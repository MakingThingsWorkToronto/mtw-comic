// Footprint scan: streaming directory walk (stat only, file contents are never read), git pack size, reduction rows.
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { makeContext } from './providers/context';
import type { ReductionProvider } from './providers/context';
import type { CodeReport, GitFootprint, KindTotals, NodeFootprint, ReductionRow, RootFootprint, ScanResult } from './types';

export const SCAN_ROOTS: { id: string; label: string; path: string }[] = [
  { id: 'images', label: 'Image library', path: 'wiki/image-library' },
  { id: 'audio', label: 'Soundtrack library', path: 'wiki/soundtrack-library' },
  { id: 'comics', label: 'Comics library', path: 'wiki/comics-library' },
  { id: 'journal', label: 'Journal', path: 'wiki/journal' },
  { id: 'site', label: 'Site public media', path: 'site/public' },
  { id: 'discussion', label: 'Evidence and scratch', path: 'discussion' },
];

const NODE_DEPTH = 7;
const NODE_MIN_BYTES = 1_000_000;
const NODE_CAP = 2500;
const SKIP_DIRS = new Set(['node_modules', '.git']);

const KIND_BY_EXT: Record<string, keyof KindTotals> = {};
for (const e of ['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'svg']) KIND_BY_EXT[e] = 'image';
for (const e of ['mp3', 'wav', 'ogg', 'm4a', 'flac']) KIND_BY_EXT[e] = 'audio';
for (const e of ['webm', 'mp4', 'mov']) KIND_BY_EXT[e] = 'video';
for (const e of ['json', 'jsonl', 'js', 'md', 'html', 'css', 'txt', 'csv', 'ts', 'mjs']) KIND_BY_EXT[e] = 'data';

export const kindOf = (name: string): keyof KindTotals => KIND_BY_EXT[name.slice(name.lastIndexOf('.') + 1).toLowerCase()] ?? 'other';

class Semaphore {
  private active = 0;
  private queue: (() => void)[] = [];
  constructor(private limit: number) {}
  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active >= this.limit) await new Promise<void>((r) => this.queue.push(r));
    this.active++;
    try {
      return await fn();
    } finally {
      this.active--;
      this.queue.shift()?.();
    }
  }
}

interface WalkState {
  io: Semaphore;
  nodes: Map<string, NodeFootprint>;
  largest: { path: string; bytes: number }[];
}

const emptyKinds = (): KindTotals => ({ image: 0, audio: 0, video: 0, data: 0, other: 0 });

async function walk(abs: string, rel: string, depth: number, state: WalkState, kinds: KindTotals): Promise<NodeFootprint> {
  let entries;
  try {
    entries = await state.io.run(() => fs.readdir(abs, { withFileTypes: true }));
  } catch {
    return { bytes: 0, files: 0 };
  }
  const total: NodeFootprint = { bytes: 0, files: 0 };
  await Promise.all(
    entries.map(async (e) => {
      const childRel = `${rel}/${e.name}`;
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name)) return;
        const sub = await walk(path.join(abs, e.name), childRel, depth + 1, state, kinds);
        total.bytes += sub.bytes;
        total.files += sub.files;
      } else if (e.isFile()) {
        let size = 0;
        try {
          size = (await state.io.run(() => fs.stat(path.join(abs, e.name)))).size;
        } catch {
          return;
        }
        total.bytes += size;
        total.files += 1;
        kinds[kindOf(e.name)] += size;
        const L = state.largest;
        if (L.length < 30 || size > (L[L.length - 1]?.bytes ?? 0)) {
          L.push({ path: childRel, bytes: size });
          L.sort((a, b) => b.bytes - a.bytes);
          if (L.length > 30) L.length = 30;
        }
      }
    }),
  );
  if (depth <= NODE_DEPTH && total.bytes >= NODE_MIN_BYTES) state.nodes.set(rel, total);
  return total;
}

export function parseCountObjects(text: string): GitFootprint {
  const get = (k: string): number => Number(new RegExp(`^${k}:\\s*(\\d+)`, 'm').exec(text)?.[1] ?? 0);
  const packBytes = get('size-pack') * 1024;
  const looseBytes = get('size') * 1024;
  const gib = (packBytes + looseBytes) / 1024 ** 3;
  return { available: true, packBytes, looseBytes, packs: get('packs'), objects: get('in-pack') + get('count'), human: `${gib.toFixed(2)} GiB` };
}

export function gitFootprint(repoRoot: string): Promise<GitFootprint> {
  return new Promise((resolve) => {
    execFile('git', ['count-objects', '-v'], { cwd: repoRoot, windowsHide: true, timeout: 30_000 }, (err, stdout) => {
      if (err) resolve({ available: false, packBytes: 0, looseBytes: 0, packs: 0, objects: 0, human: 'unavailable' });
      else resolve(parseCountObjects(stdout));
    });
  });
}

const CODE_ROOTS = ['apps', 'site/scripts'];
const CODE_SKIP = new Set(['node_modules', '.git', 'dist', 'build', '.state', '.astro', '.vercel', 'coverage', '__pycache__']);
const CODE_EXT = /\.(ts|tsx|js|jsx|mjs|cjs|py|css)$/i;
const LARGE_LINES = 800;
const MAX_SOURCE_BYTES = 4_000_000;

/** Maintainability hotspots in apps/ and site/scripts. Information only: no action is offered for code. */
export async function codeReport(repoRoot: string): Promise<CodeReport> {
  const found: { rel: string; abs: string; size: number }[] = [];
  const walkCode = async (rel: string): Promise<void> => {
    let entries;
    try {
      entries = await fs.readdir(path.join(repoRoot, rel), { withFileTypes: true });
    } catch {
      return;
    }
    await Promise.all(
      entries.map(async (e) => {
        const child = `${rel}/${e.name}`;
        if (e.isDirectory()) {
          if (!CODE_SKIP.has(e.name)) await walkCode(child);
        } else if (e.isFile() && CODE_EXT.test(e.name)) {
          try {
            found.push({ rel: child, abs: path.join(repoRoot, child), size: (await fs.stat(path.join(repoRoot, child))).size });
          } catch {
            /* vanished */
          }
        }
      }),
    );
  };
  for (const r of CODE_ROOTS) await walkCode(r);
  const large: { path: string; lines: number }[] = [];
  const sources = found.filter((f) => !/\.css$/i.test(f.rel) && f.size <= MAX_SOURCE_BYTES && f.size > LARGE_LINES * 8);
  const queue = [...sources];
  await Promise.all(
    Array.from({ length: 16 }, async () => {
      while (queue.length > 0) {
        const f = queue.pop() as (typeof sources)[number];
        try {
          const text = await fs.readFile(f.abs, 'utf8');
          let lines = 1;
          for (let i = text.indexOf('\n'); i !== -1; i = text.indexOf('\n', i + 1)) lines++;
          if (lines > LARGE_LINES) large.push({ path: f.rel, lines });
        } catch {
          /* unreadable */
        }
      }
    }),
  );
  large.sort((a, b) => b.lines - a.lines);
  const names = new Map<string, string[]>();
  for (const f of found) {
    const n = f.rel.slice(f.rel.lastIndexOf('/') + 1).toLowerCase();
    if (n === 'index.ts' || n === 'index.tsx' || n === 'index.js' || n === 'types.ts' || n === 'main.ts') continue;
    names.set(n, [...(names.get(n) ?? []), f.rel]);
  }
  const duplicateNames = [...names.entries()]
    .filter(([, list]) => list.length > 1 && list.some((p) => p.startsWith('site/scripts/')) && list.some((p) => p.startsWith('apps/')))
    .map(([name, list]) => ({ name, paths: list.sort() }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return { files: found.length, bytes: found.reduce((s, f) => s + f.size, 0), large: large.slice(0, 25), duplicateNames };
}

/** Planable targets and their current savings, from every provider. Hashes come from the cache only (never computed here). */
export async function computeReductions(
  repoRoot: string,
  providers: ReductionProvider[],
  params: Record<string, Record<string, number>> = {},
  stateDir?: string,
): Promise<ReductionRow[]> {
  const rows: ReductionRow[] = [];
  const memo = new Map<string, Promise<unknown>>();
  for (const p of providers) {
    const defaults = Object.fromEntries(p.params.map((x) => [x.name, params[p.id]?.[x.name] ?? x.default]));
    const ctx = makeContext(repoRoot, { params: defaults, memo, ...(stateDir ? { stateDir } : {}) });
    for (const t of await p.targets(ctx)) {
      const plan = await p.plan(t.id, ctx);
      if (plan.files.length === 0 && plan.skipped.length === 0) continue;
      rows.push({
        providerId: p.id,
        vertical: t.vertical ?? p.vertical,
        providerLabel: p.label,
        target: t.id,
        targetLabel: t.label,
        category: p.category,
        files: plan.files.length,
        bytes: plan.savings,
        skipped: plan.skipped.length,
        reportOnly: p.reportOnly || Boolean(t.planless),
        ...(t.register ? { register: true } : {}),
        ...(plan.pending ? { pending: plan.pending } : {}),
      });
    }
  }
  return rows;
}

export async function runScan(repoRoot: string, providers: ReductionProvider[], archiveRoot: string, stateDir?: string): Promise<ScanResult> {
  const started = Date.now();
  const state: WalkState = { io: new Semaphore(48), nodes: new Map(), largest: [] };
  const roots: RootFootprint[] = [];
  for (const r of SCAN_ROOTS) {
    const kinds = emptyKinds();
    const total = await walk(path.join(repoRoot, r.path), r.path, 0, state, kinds);
    roots.push({ ...r, bytes: total.bytes, files: total.files, kinds });
  }
  const [git, code, reductions] = await Promise.all([gitFootprint(repoRoot), codeReport(repoRoot), computeReductions(repoRoot, providers, {}, stateDir)]);
  const nodes = Object.fromEntries([...state.nodes.entries()].sort((a, b) => b[1].bytes - a[1].bytes).slice(0, NODE_CAP));
  return { generatedAt: new Date().toISOString(), durationMs: Date.now() - started, roots, nodes, largest: state.largest, git, code, reductions, archiveRoot };
}
