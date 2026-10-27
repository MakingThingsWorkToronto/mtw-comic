// Shared provider plumbing: context, streaming walks and hashing, manifest and reference lookups.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { FileAction, PlanFile, ProviderInfo, ProviderPlan, SkippedFile, Vertical } from '../types';
import { defaultStateDir, hasherFor } from './hasher';
import type { Hasher } from './hasher';

export { sha256File } from './hasher';

export interface ProviderContext {
  repoRoot: string;
  now: Date;
  /** Compute real sha256 (streaming) for every planned file. Off for the overview scan. */
  hash: boolean;
  params: Record<string, number>;
  /** sha256 cache keyed by (path, size, mtime). */
  hasher: Hasher;
  memo<T>(key: string, make: () => Promise<T>): Promise<T>;
}

export interface RegisterRequest {
  procedure: string;
  paths: string[];
  /** The text of the procedure parameter, given the count and the repo-relative list file. */
  text(count: number, listFile: string): string;
  param: string;
}

export interface ReductionTarget {
  id: string;
  label: string;
  /** Overrides the provider's vertical, for providers that cover several libraries. */
  vertical?: Vertical;
  /** The row can launch the owning module's register procedure. */
  register?: boolean;
  /** A target that is only ever reported or registered, never planned for archiving. */
  planless?: boolean;
}

export interface ReductionProvider extends ProviderInfo {
  targets(ctx: ProviderContext): Promise<ReductionTarget[]>;
  plan(target: string, ctx: ProviderContext): Promise<ProviderPlan>;
  /** The files a register launch should hand to the owning module's procedure. */
  register?(target: string, ctx: ProviderContext): Promise<RegisterRequest | null>;
}

export function makeContext(
  repoRoot: string,
  opts: { hash?: boolean; params?: Record<string, number>; now?: Date; stateDir?: string; memo?: Map<string, Promise<unknown>> } = {},
): ProviderContext {
  const cache = opts.memo ?? new Map<string, Promise<unknown>>();
  return {
    repoRoot,
    now: opts.now ?? new Date(),
    hash: opts.hash ?? false,
    params: opts.params ?? {},
    hasher: hasherFor(opts.stateDir ?? defaultStateDir(repoRoot)),
    memo<T>(key: string, make: () => Promise<T>): Promise<T> {
      let hit = cache.get(key) as Promise<T> | undefined;
      if (!hit) {
        hit = make();
        cache.set(key, hit);
      }
      return hit;
    },
  };
}

export const dirName = (rel: string): string => rel.slice(0, rel.lastIndexOf('/'));

export const posix = (p: string): string => p.replace(/\\/g, '/');

export async function readJsonIf<T>(abs: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(abs, 'utf8')) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i] as T);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

export const AUDIO_EXT = /\.(mp3|wav|ogg|m4a|flac)$/i;
export const ASSET_EXT = /\.(png|jpe?g|webp|avif|gif|webm|mp4|mov|mp3|wav|ogg|m4a|flac)$/i;
export const MEDIA_EXT = /\.(png|jpe?g|webp|avif|gif|webm|mp4|mov)$/i;

/** First plausible YYYYMMDD or YYYY-MM-DD in a path, as a Date. */
export function dateInPath(p: string): Date | null {
  const m = /(?<![0-9])(20\d{2})-?(0[1-9]|1[0-2])-?(0[1-9]|[12]\d|3[01])(?![0-9])/.exec(p);
  return m ? new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00Z`) : null;
}

export const ageDays = (then: Date, now: Date): number => Math.floor((now.getTime() - then.getTime()) / 86_400_000);

export interface ImageManifest {
  records: {
    id: string;
    collection?: string;
    sceneKind?: string;
    status?: string;
    userApproved?: boolean;
    rejectionReason?: string;
    publicUse?: string;
    treatments?: Record<string, { path?: string; status?: string; sha256?: string; bytes?: number; userApproved?: boolean; rejectionReason?: string }>;
  }[];
  files: { destination: string; sha256?: string; bytes?: number; role?: string }[];
}

export const IMAGE_LIB = 'wiki/image-library';

export function loadImageManifest(ctx: ProviderContext): Promise<ImageManifest> {
  return ctx.memo('image-manifest', async () => {
    const m = await readJsonIf<ImageManifest>(path.join(ctx.repoRoot, IMAGE_LIB, 'manifest.json'));
    return m ?? { records: [], files: [] };
  });
}

const REF_TOKEN = /(?:\.{0,2}\/)?(?:[\w@+.-]+\/)*[\w@+.-]+\.(?:png|jpe?g|webp|avif|gif|webm|mp4|mov)|(?:assets|records)\/[\w@+.\-/]+\//g;

async function* walkMarkdown(dir: string, skip: (rel: string) => boolean, rel = ''): AsyncGenerator<string> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const childRel = rel ? `${rel}/${e.name}` : e.name;
    if (skip(childRel)) continue;
    if (e.isDirectory()) yield* walkMarkdown(path.join(dir, e.name), skip, childRel);
    else if (e.isFile() && e.name.endsWith('.md')) yield path.join(dir, e.name);
  }
}

export interface ReferenceIndex {
  /** Returns the referring page (repo-relative) when a wiki page names this repo-relative file, else null. */
  referencedBy(repoRel: string): string | null;
}

/**
 * Which files do maintained wiki pages name? Pages inside wiki/image-library describe their own records and are ignored.
 * A page references a file by its path ending, or by bare file name; a folder reference counts only when it is specific
 * (five or more segments) so a passing mention of "assets/scenes" protects nothing.
 */
export function buildReferenceIndex(ctx: ProviderContext): Promise<ReferenceIndex> {
  return ctx.memo('reference-index', async () => {
    const byBase = new Map<string, { token: string; page: string }[]>();
    const dirs: { token: string; page: string }[] = [];
    const wikiDir = path.join(ctx.repoRoot, 'wiki');
    const files: string[] = [];
    for await (const f of walkMarkdown(wikiDir, (rel) => rel.startsWith('image-library') || rel.includes('node_modules'))) files.push(f);
    await mapLimit(files, 16, async (f) => {
      const text = await fs.readFile(f, 'utf8');
      const page = posix(path.relative(ctx.repoRoot, f));
      for (const raw of text.match(REF_TOKEN) ?? []) {
        const token = raw.replace(/^(\.{1,2}\/)+/, '').replace(/^wiki\//, '').replace(/^image-library\//, '');
        if (token.endsWith('/')) {
          if (token.split('/').filter(Boolean).length >= 5) dirs.push({ token, page });
          continue;
        }
        const base = token.slice(token.lastIndexOf('/') + 1).toLowerCase();
        const list = byBase.get(base) ?? [];
        list.push({ token, page });
        byBase.set(base, list);
      }
    });
    return {
      referencedBy(repoRel: string): string | null {
        const p = repoRel.replace(/^wiki\/(image-library\/)?/, '').toLowerCase();
        const base = p.slice(p.lastIndexOf('/') + 1);
        for (const hit of byBase.get(base) ?? []) {
          if (!hit.token.includes('/') || p.endsWith(hit.token.toLowerCase())) return hit.page;
        }
        for (const d of dirs) if (p.startsWith(d.token.toLowerCase())) return d.page;
        return null;
      },
    };
  });
}

export interface Candidate {
  path: string;
  reason: string;
  action?: FileAction;
  regenerable?: boolean;
  /** Manifest hash, used as a hint only when the context does not hash. */
  sha256?: string;
}

/** Builds plan entries for candidate paths: stat each file, hash when the context asks, report missing files as skipped. */
export async function buildEntries(ctx: ProviderContext, candidates: Candidate[], skipped: SkippedFile[] = []): Promise<ProviderPlan> {
  const seen = new Set<string>();
  const unique = candidates.filter((c) => (seen.has(c.path) ? false : (seen.add(c.path), true)));
  const rows = await mapLimit(unique, 24, async (c): Promise<PlanFile | null> => {
    const abs = path.join(ctx.repoRoot, c.path);
    let st;
    try {
      st = await fs.stat(abs);
    } catch {
      skipped.push({ path: c.path, reason: 'file not found on disk' });
      return null;
    }
    if (!st.isFile()) return null;
    const entry: PlanFile = {
      path: c.path,
      bytes: st.size,
      sha256: ctx.hash ? await ctx.hasher.sha({ rel: c.path, abs, size: st.size, mtimeMs: st.mtimeMs }) : (c.sha256 ?? ''),
      reason: c.reason,
      action: c.action ?? 'archive',
    };
    if (c.regenerable) entry.regenerable = true;
    return entry;
  });
  if (ctx.hash) await ctx.hasher.flush();
  const files = rows.filter((r): r is PlanFile => r !== null).sort((a, b) => a.path.localeCompare(b.path));
  return { files, savings: files.reduce((s, f) => s + f.bytes, 0), skipped };
}

/** Drops candidates that a maintained wiki page names; they are reported as skipped. */
export async function dropReferenced<T extends { path: string }>(ctx: ProviderContext, list: T[], skipped: SkippedFile[]): Promise<T[]> {
  const refs = await buildReferenceIndex(ctx);
  return list.filter((c) => {
    const page = refs.referencedBy(c.path);
    if (page) {
      skipped.push({ path: c.path, reason: `named by ${page}` });
      return false;
    }
    return true;
  });
}
