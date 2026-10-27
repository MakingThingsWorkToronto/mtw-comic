// New (Matt, 2026-10-11, spec "Commit every image, without duplicates; quick removal in Studio"). Remove = archive each
// file outside the repo (storage config `archiveRoot`), verify the copy's sha256, delete the source, then drop it from
// the catalog through the maintained producer. Matt's click on the confirm dialog is the approval; no agent runs.
// Files in use (site copy, comic story, maintained wiki page, selected/approved) are kept and say why.
// The producer stays the only writer of manifest.json, data.js, all-files.html and README.md.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { DecisionLog } from '../../types';
import { buildReferenceIndex, makeContext } from '../../storage/providers/context';
import { stateOf } from '../shared/states';
import { DECISIONS_LIB } from '../shared/types';
import type { ImageRecord } from '../shared/types';
import { IMAGE_EXT } from './catalog';
import type { Catalog } from './catalog';
import { PathError, confineLibraryPath } from './files';
import { helperPath } from './register';

const LIB = 'wiki/image-library';
const GUARDED = ['manifest.json', 'data.js', 'all-files.html', 'README.md', 'decisions.jsonl'];
const SITE_DIRS = ['site/public', 'site/src/assets'];
const STORY_DIR = 'site/src/data/comic-stories';
const SITE_EXT = /\.(png|jpe?g|webp|avif|gif|svg)$/i;

export interface RemoveRequest {
  /** Library-relative files (`assets/...`). */
  paths?: string[];
  /** Records: every file the record's treatments name. */
  ids?: string[];
  /** Every file whose record or treatment status is rejected, or that Matt rejected in Studio. */
  rejected?: boolean;
}

export interface RemoveItem {
  path: string;
  recordIds: string[];
  title: string;
  bytes: number;
  sha256?: string;
  action: 'remove' | 'keep';
  /** Why a file is kept. */
  reason?: string;
}

export interface RemovePlan {
  etag: string;
  items: RemoveItem[];
  remove: number;
  removeBytes: number;
  keep: number;
  /** The whole batch is refused (producer running, lease, another removal). */
  blocked: string | null;
  /** Where the files would go. */
  archiveDir: string;
  /** False while maintain_library.py has no `remove` operation: registered files are then kept. */
  catalogRemovable: boolean;
}

export interface RemoveEntry {
  path: string;
  repoPath: string;
  bytes: number;
  sha256: string;
  archivedTo: string;
  recordIds: string[];
  at: string;
  status: 'removed' | 'restored' | 'failed';
  error?: string;
}

export interface RemoveResult {
  ok: boolean;
  removed: number;
  removedBytes: number;
  kept: RemoveItem[];
  failed: { path: string; error: string }[];
  archiveDir: string;
  archiveRecord: string | null;
  producer: { code: number; stdout: string; stderr: string } | null;
  verify: { code: number; stdout: string; stderr: string } | null;
  error?: string;
}

export interface RemoveContext {
  repoRoot: string;
  catalog: Catalog;
  decisions: DecisionLog;
  leases?: { holder(repoPath: string): string | null };
  stateDir: string;
  runProducer(command: string, args: string[]): Promise<{ code: number; stdout: string; stderr: string }>;
  python?: string;
  helper?: string;
  now?: () => Date;
  /** Process ids of running maintain_library.py runs. Defaults to a process-list query. */
  producerRuns?: () => Promise<number[]>;
  /** Does the producer have a `remove` operation? Defaults to reading its argparse choices. */
  catalogRemovable?: () => Promise<boolean>;
  /** Copy used for the archive (tests inject a faulty one). */
  copyFile?: (from: string, to: string) => Promise<void>;
}

export const hashFile = (file: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const h = createHash('sha256');
    createReadStream(file).on('data', (d) => h.update(d)).on('error', reject).on('end', () => resolve(h.digest('hex')));
  });

/** `archiveRoot` from wiki/operations/storage/config.json (default C:/MTW-archive/); refused when inside the repo. */
export function archiveRoot(repoRoot: string): string {
  let root = 'C:/MTW-archive/';
  try {
    const cfg = JSON.parse(readFileSync(path.join(repoRoot, 'wiki', 'operations', 'storage', 'config.json'), 'utf8')) as { archiveRoot?: string };
    if (cfg.archiveRoot) root = cfg.archiveRoot;
  } catch {
    /* default */
  }
  const abs = path.resolve(repoRoot, root);
  const inside = path.relative(repoRoot, abs);
  if (!inside.startsWith('..') && !path.isAbsolute(inside)) throw new PathError(`archiveRoot must be outside the repo: ${root}`, 500);
  return abs;
}

const day = (d: Date): string => d.toISOString().slice(0, 10).replace(/-/g, '');
export const archiveDirFor = (repoRoot: string, d: Date): string => path.join(archiveRoot(repoRoot), `images-removed-${day(d)}`);

/** The producer's argparse operation choices include `remove`. */
export function producerHasRemove(helper: string): boolean {
  try {
    const text = readFileSync(helper, 'utf8');
    const m = /add_argument\(\s*["']operation["']\s*,\s*choices\s*=\s*\[([^\]]*)\]/.exec(text);
    return Boolean(m && /["']remove["']/.test(m[1] as string));
  } catch {
    return false;
  }
}

/** Running Python maintain_library.py processes (Windows: CIM query; elsewhere: ps). Shells that only name it do not count. */
export function findProducerRuns(): Promise<number[]> {
  const [cmd, args] =
    process.platform === 'win32'
      ? ['powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', "Get-CimInstance Win32_Process -Filter \"CommandLine like '%maintain_library.py%'\" | Where-Object { $_.Name -match '^(python|py)' } | ForEach-Object { $_.ProcessId }"]]
      : ['ps', ['-eo', 'pid=,args=']];
  return new Promise((resolve) => {
    const child = spawn(cmd as string, args as string[], { windowsHide: true, shell: false });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.on('error', () => resolve([]));
    child.on('close', () => {
      const lines = out.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const pids = process.platform === 'win32' ? lines : lines.filter((l) => l.includes('maintain_library.py') && /python/i.test(l));
      resolve(pids.map((l) => Number.parseInt(l, 10)).filter((n) => Number.isFinite(n) && n !== process.pid));
    });
  });
}

async function walk(dir: string, visit: (name: string, abs: string) => void): Promise<void> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) await walk(abs, visit);
    else if (e.isFile()) visit(e.name, abs);
  }
}

const baseName = (rel: string): string => rel.slice(rel.lastIndexOf('/') + 1).replace(/\.[^.]+$/, '').toLowerCase();
/** Same master stem as the Storage look-alike provider: drop a trailing `-vN`. */
const familyStem = (rel: string): string => baseName(rel).replace(/-v\d+$/, '');
const unsized = (name: string): string => name.replace(/-\d{3,4}$/, '');

/** Website file names (`<stem>-<width>.<ext>` -> `<stem>`), as in storage/providers/lookalikes.ts siteStems. */
async function siteNames(repoRoot: string): Promise<Set<string>> {
  const out = new Set<string>();
  for (const d of SITE_DIRS) {
    await walk(path.join(repoRoot, d), (name) => {
      if (!SITE_EXT.test(name)) return;
      const base = name.replace(/\.[^.]+$/, '').toLowerCase();
      out.add(base);
      out.add(unsized(base));
    });
  }
  return out;
}

/** File names a comic story names (`/comic/<story>/<name>-<width>.<ext>`, comments included). */
async function storyNames(repoRoot: string): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const dir = path.join(repoRoot, STORY_DIR);
  let files: string[] = [];
  try {
    files = (await fs.readdir(dir)).filter((f) => f.endsWith('.ts'));
  } catch {
    return out;
  }
  for (const f of files) {
    const text = await fs.readFile(path.join(dir, f), 'utf8');
    const story = `${STORY_DIR}/${f}`;
    const add = (name: string): void => {
      const n = name.toLowerCase();
      if (!out.has(n)) out.set(n, story);
      if (!out.has(unsized(n))) out.set(unsized(n), story);
    };
    for (const m of text.matchAll(/[\w@+.-]+\.(?:png|jpe?g|webp|avif|gif|svg)\b/gi)) add(m[0].replace(/\.[^.]+$/, ''));
    for (const m of text.matchAll(/\/comic\/[^"'`\s)]+/g)) add(baseName(m[0]));
  }
  return out;
}

const KEEP_STATES = new Set(['approved', 'selected']);

interface Target {
  path: string;
  records: { record: ImageRecord; style: string }[];
}

let running = false;

/** Plan a removal. Nothing is written. */
export async function planRemove(ctx: RemoveContext, req: RemoveRequest, ownRun = false): Promise<RemovePlan> {
  const l = await ctx.catalog.ensure();
  const { overlay } = await ctx.catalog.overlay();
  const now = ctx.now?.() ?? new Date();
  const archiveDir = archiveDirFor(ctx.repoRoot, now);

  const byPath = new Map<string, Target>();
  for (const r of l.manifest.records) {
    for (const [style, t] of Object.entries(r.treatments)) {
      if (!t.path) continue;
      const hit = byPath.get(t.path) ?? { path: t.path, records: [] };
      hit.records.push({ record: r, style });
      byPath.set(t.path, hit);
    }
  }
  const rejectedFile = (record: ImageRecord, style: string): boolean => {
    const t = record.treatments[style];
    const d = overlay.get(record.id);
    if (d?.kind === 'rejected' && (!d.style || d.style === style)) return true;
    return record.status === 'rejected' || record.publicUse === 'rejected' || stateOf(t?.status) === 'rejected';
  };

  const wanted: string[] = [];
  const keep: RemoveItem[] = [];
  for (const p of req.paths ?? []) wanted.push(p);
  for (const id of req.ids ?? []) {
    const hit = l.byId.get(id);
    if (!hit) {
      keep.push({ path: id, recordIds: [], title: id, bytes: 0, action: 'keep', reason: `Unknown record: ${id}` });
      continue;
    }
    for (const t of Object.values(hit.record.treatments)) if (t.path) wanted.push(t.path);
  }
  if (req.rejected) {
    for (const r of l.manifest.records) for (const [style, t] of Object.entries(r.treatments)) if (t.path && rejectedFile(r, style)) wanted.push(t.path);
  }

  const catalogRemovable = await (ctx.catalogRemovable?.() ?? Promise.resolve(producerHasRemove(helperPath(ctx))));
  const [site, stories, refs] = await Promise.all([siteNames(ctx.repoRoot), storyNames(ctx.repoRoot), buildReferenceIndex(makeContext(ctx.repoRoot, { stateDir: ctx.stateDir }))]);

  const items: RemoveItem[] = [...keep];
  const seen = new Set<string>();
  for (const input of wanted) {
    let rel: string;
    let abs: string;
    try {
      ({ rel, abs } = await confineLibraryPath(ctx.repoRoot, input, ['assets']));
    } catch (error) {
      items.push({ path: input, recordIds: [], title: input, bytes: 0, action: 'keep', reason: (error as Error).message });
      continue;
    }
    if (seen.has(rel)) continue;
    seen.add(rel);
    const target = byPath.get(rel);
    const records = target?.records ?? [];
    const title = records[0]?.record.title ?? path.posix.basename(rel);
    const item: RemoveItem = { path: rel, recordIds: records.map((x) => x.record.id), title, bytes: 0, action: 'remove' };
    const keepFor = (reason: string): void => {
      item.action = 'keep';
      item.reason ??= reason;
    };
    let st;
    try {
      st = await fs.stat(abs);
    } catch {
      /* missing */
    }
    if (!st?.isFile()) keepFor('File not found on disk.');
    else item.bytes = st.size;
    if (!IMAGE_EXT.has(path.extname(rel).toLowerCase())) keepFor('Not an image file.');
    const registeredSha = records.map((x) => x.record.treatments[x.style]?.sha256).find(Boolean);
    if (registeredSha) item.sha256 = registeredSha;

    // In use: selected or approved (manifest status, record fields or Matt's Studio decision).
    for (const { record, style } of records) {
      const t = record.treatments[style];
      const d = overlay.get(record.id);
      const decided = d && (!d.style || d.style === style) && (d.kind === 'approved' || d.kind === 'selected');
      if (record.userApproved === true || t?.userApproved === true || /^selected/i.test(record.publicUse ?? '') || KEEP_STATES.has(stateOf(t?.status)) || decided) {
        keepFor(`In use: ${decided ? `Matt ${d?.kind} it in Studio` : 'selected or approved'} (${record.id}).`);
      }
    }
    // In use: a website copy or resized derivative named after this master.
    const base = baseName(rel);
    const stem = familyStem(rel);
    if (site.has(base) || site.has(stem)) keepFor('In use: the website has a copy (site/).');
    else {
      for (const { record } of records) {
        if (record.collection !== 'earlier' && record.logicalId && site.has(String(record.logicalId).toLowerCase())) keepFor(`In use: the website shows ${record.logicalId}.`);
      }
    }
    // In use: a comic story names it.
    const story = stories.get(base) ?? stories.get(stem);
    if (story) keepFor(`In use: named by ${story}.`);
    // In use: a maintained wiki page names it.
    const page = refs.referencedBy(`${LIB}/${rel}`);
    if (page) keepFor(`In use: named by ${page}.`);
    const holder = ctx.leases?.holder(`${LIB}/${rel}`);
    if (holder) keepFor(`Leased to ${holder}.`);
    if (records.length && !catalogRemovable) keepFor('The catalog producer (maintain_library.py) has no remove operation yet, so this registered file cannot leave the catalog.');
    items.push(item);
  }

  let blocked: string | null = null;
  if (running && !ownRun) blocked = 'Another removal is running. Try again when it finishes.';
  for (const name of GUARDED) {
    const holder = ctx.leases?.holder(`${LIB}/${name}`);
    if (holder && !blocked) blocked = `${LIB}/${name} is leased to ${holder}; nothing removed.`;
  }
  const removing = items.filter((i) => i.action === 'remove');
  if (!blocked && removing.length) {
    const runs = await (ctx.producerRuns?.() ?? findProducerRuns());
    if (runs.length) blocked = `maintain_library.py is running (process ${runs.join(', ')}). Wait for it to finish.`;
  }
  return {
    etag: l.etag,
    items,
    remove: removing.length,
    removeBytes: removing.reduce((n, i) => n + i.bytes, 0),
    keep: items.length - removing.length,
    blocked,
    archiveDir,
    catalogRemovable,
  };
}

const defaultCopy = (from: string, to: string): Promise<void> => fs.copyFile(from, to);

/**
 * Re-plan, then archive, verify and delete every `remove` item, and drop the registered ones from the catalog through
 * the producer. A copy whose hash differs keeps its source. If the producer fails, every deleted source is restored.
 */
export async function runRemove(ctx: RemoveContext, req: RemoveRequest, expectEtag?: string): Promise<RemoveResult> {
  if (running) {
    return { ok: false, removed: 0, removedBytes: 0, kept: [], failed: [], archiveDir: '', archiveRecord: null, producer: null, verify: null, error: 'Another removal is running. Try again when it finishes.' };
  }
  running = true;
  try {
    const plan = await planRemove(ctx, req, true);
    const base: RemoveResult = { ok: false, removed: 0, removedBytes: 0, kept: plan.items.filter((i) => i.action === 'keep'), failed: [], archiveDir: plan.archiveDir, archiveRecord: null, producer: null, verify: null };
    if (plan.blocked) return { ...base, error: plan.blocked };
    if (expectEtag && expectEtag !== plan.etag) return { ...base, error: 'The library changed since the dialog opened. Close it and try again.' };
    const todo = plan.items.filter((i) => i.action === 'remove');
    if (!todo.length) return { ...base, ok: true, error: 'Nothing to remove.' };

    const now = ctx.now?.() ?? new Date();
    const at = now.toISOString();
    const stamp = at.replace(/[:.]/g, '-');
    const copy = ctx.copyFile ?? defaultCopy;
    const entries: RemoveEntry[] = [];
    const libRoot = ctx.catalog.libraryRoot;

    // 1. Archive and verify each copy before anything is deleted.
    for (const item of todo) {
      const src = path.join(libRoot, ...item.path.split('/'));
      const repoPath = `${LIB}/${item.path}`;
      const dest = path.join(plan.archiveDir, ...repoPath.split('/'));
      const entry: RemoveEntry = { path: item.path, repoPath, bytes: item.bytes, sha256: '', archivedTo: dest.replace(/\\/g, '/'), recordIds: item.recordIds, at, status: 'failed' };
      try {
        const sha = await hashFile(src);
        entry.sha256 = sha;
        if (item.sha256 && item.sha256 !== sha) throw new Error('the file changed since it was registered');
        await fs.mkdir(path.dirname(dest), { recursive: true });
        if (existsSync(dest)) {
          if ((await hashFile(dest)) !== sha) throw new Error(`a different file already sits at ${entry.archivedTo}`);
        } else {
          await copy(src, dest);
          if ((await hashFile(dest)) !== sha) {
            await fs.rm(dest, { force: true });
            throw new Error('the archive copy did not match the source sha256; source kept');
          }
        }
        entry.status = 'removed';
      } catch (error) {
        entry.error = (error as Error).message;
      }
      entries.push(entry);
    }

    // 2. Delete the verified sources.
    const deleted: RemoveEntry[] = [];
    for (const e of entries.filter((x) => x.status === 'removed')) {
      try {
        await fs.rm(path.join(libRoot, ...e.path.split('/')));
        deleted.push(e);
      } catch (error) {
        e.status = 'failed';
        e.error = `delete failed: ${(error as Error).message}`;
      }
    }

    // 3. Catalog: the producer drops the registered files, then verifies.
    let producer: RemoveResult['producer'] = null;
    let verify: RemoveResult['verify'] = null;
    let error: string | undefined;
    const registered = deleted.filter((e) => e.recordIds.length);
    if (registered.length) {
      const payloadFile = path.join(ctx.stateDir, 'remove', `${stamp}.json`);
      const receiptDir = path.join(ctx.stateDir, 'receipts', `remove-${stamp}`);
      await fs.mkdir(path.dirname(payloadFile), { recursive: true });
      await fs.mkdir(receiptDir, { recursive: true });
      await fs.writeFile(payloadFile, `${JSON.stringify({ expectedManifestSha256: plan.etag, remove: registered.map((e) => ({ path: e.path, sha256: e.sha256, recordIds: e.recordIds, archivedTo: e.archivedTo })) }, null, 2)}\n`, 'utf8');
      const python = ctx.python ?? process.env.MTW_PYTHON ?? 'python';
      const helper = helperPath(ctx);
      producer = await ctx.runProducer(python, [helper, 'remove', '--library', libRoot, '--receipt-dir', receiptDir, '--payload', payloadFile]);
      if (producer.code === 0) {
        verify = await ctx.runProducer(python, [helper, 'verify', '--library', libRoot, '--receipt-dir', path.join(receiptDir, 'verify')]);
        if (verify.code !== 0) error = `The producer removed the files but verify failed: ${(verify.stderr || verify.stdout).trim().slice(-400)}`;
      } else {
        // The catalog still lists the files: put every deleted source back from its verified archive copy.
        error = `The producer refused the removal, so the files were restored: ${(producer.stderr || producer.stdout).trim().slice(-400)}`;
        for (const e of deleted) {
          const src = path.join(libRoot, ...e.path.split('/'));
          try {
            await fs.copyFile(e.archivedTo, src);
            e.status = (await hashFile(src)) === e.sha256 ? 'restored' : 'failed';
            if (e.status === 'failed') e.error = 'restore hash mismatch';
          } catch (restoreError) {
            e.status = 'failed';
            e.error = `restore failed: ${(restoreError as Error).message}`;
          }
        }
      }
    }

    // 4. Receipt beside the archived files, and one decision line for the batch.
    const removed = entries.filter((e) => e.status === 'removed');
    const archiveRecord = path.join(plan.archiveDir, `archive-record-${stamp}.json`);
    const record = {
      kind: 'mtw-images-remove',
      at,
      actor: 'matt',
      via: 'studio-images-remove',
      library: LIB,
      archiveDir: plan.archiveDir.replace(/\\/g, '/'),
      manifestBefore: plan.etag,
      restore: 'Copy each archivedTo back to its repoPath, check sha256, then register it again (node apps/mtw/cli/mtw.mjs register image <path>).',
      files: entries,
      kept: base.kept.map((k) => ({ path: k.path, reason: k.reason })),
      producer: producer ? { code: producer.code } : null,
      verify: verify ? { code: verify.code } : null,
    };
    await fs.mkdir(plan.archiveDir, { recursive: true });
    await fs.writeFile(archiveRecord, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
    await ctx.decisions.append(DECISIONS_LIB, {
      module: 'images',
      subject: `img-remove:${stamp}`,
      action: 'remove',
      actor: 'matt',
      value: {
        files: removed.length,
        bytes: removed.reduce((n, e) => n + e.bytes, 0),
        records: [...new Set(removed.flatMap((e) => e.recordIds))],
        paths: removed.map((e) => e.path),
        archiveRecord: archiveRecord.replace(/\\/g, '/'),
        ...(error ? { error } : {}),
      },
    });
    const failed = entries.filter((e) => e.status !== 'removed').map((e) => ({ path: e.path, error: e.error ?? e.status }));
    return {
      ...base,
      ok: !error && !failed.length,
      removed: removed.length,
      removedBytes: removed.reduce((n, e) => n + e.bytes, 0),
      failed,
      archiveRecord: archiveRecord.replace(/\\/g, '/'),
      producer,
      verify,
      ...(error ? { error } : {}),
    };
  } finally {
    running = false;
  }
}
