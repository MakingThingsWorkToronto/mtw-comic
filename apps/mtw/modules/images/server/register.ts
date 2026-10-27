// New (migration spec section 6). Builds a producer payload for `maintain_library.py register` and runs it.
// The producer stays the only writer of manifest.json, data.js, all-files.html and README.md; this file never edits them.
import { createHash } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { ImageRecord } from '../shared/types';
import { IMAGE_EXT } from './catalog';
import type { Catalog } from './catalog';
import { PathError, confineLibraryPath } from './files';
import { inferCollection, sweepImages } from './sweep';

export const HELPER_REL = '.claude/skills/mtw-raster-alternatives/scripts/portable-gallery/maintain_library.py';
const DERIVED_FILES = ['manifest.json', 'data.js', 'all-files.html', 'README.md'];

export interface RegisterOptions {
  record?: string;
  style?: string;
  collection?: string;
  note?: string;
  sourceName?: string;
  title?: string;
  description?: string;
  service?: string;
  category?: string;
}

export interface PlanItem {
  path: string;
  action: 'new-record' | 'new-version' | 'noop' | 'refuse';
  recordId?: string;
  style?: string;
  collection?: string;
  sha256?: string;
  bytes?: number;
  /** Set when the target record or style was inferred rather than given. */
  inferred?: string;
  reason?: string;
  /** For a refusal because the path holds different bytes: the next free versioned name. */
  proposedPath?: string;
}

export interface RegisterPlan {
  ok: boolean;
  items: PlanItem[];
  errors: string[];
  /** Unregistered files outside this plan. Each one makes the producer refuse the whole registration. */
  blockedBy: string[];
  payload: { expectedManifestSha256: string; records: Record<string, unknown>[] } | null;
}

export interface RegisterContext {
  repoRoot: string;
  catalog: Catalog;
  leases?: { holder(repoPath: string): string | null };
  stateDir: string;
  runProducer(command: string, args: string[]): Promise<{ code: number; stdout: string; stderr: string }>;
  python?: string;
  /** Absolute path of maintain_library.py; defaults to the repo's skill copy. */
  helper?: string;
  now?: () => Date;
}

export const helperPath = (ctx: Pick<RegisterContext, 'repoRoot' | 'helper'>): string => ctx.helper ?? path.join(ctx.repoRoot, ...HELPER_REL.split('/'));

const hashFile = (file: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const h = createHash('sha256');
    createReadStream(file).on('data', (d) => h.update(d)).on('error', reject).on('end', () => resolve(h.digest('hex')));
  });

const FAMILY_STEM = /^(.*?)(?:-v\d+)?(\.[a-z0-9]+)$/i;
const stemOf = (rel: string): string => {
  const m = FAMILY_STEM.exec(rel);
  return m ? (m[1] as string) : rel;
};

/** `x-v3.png` -> `x-v4.png`; `x.png` -> `x-v2.png`; skipping names already on disk or registered. */
export function nextFreeVersion(rel: string, taken: (candidate: string) => boolean): string {
  const m = /^(.*?)(?:-v(\d+))?(\.[a-z0-9]+)$/i.exec(rel) as RegExpExecArray;
  let n = m[2] ? Number(m[2]) + 1 : 2;
  for (;;) {
    const candidate = `${m[1]}-v${n}${m[3]}`;
    if (!taken(candidate)) return candidate;
    n++;
  }
}

function defaultStyle(rel: string): string | null {
  if (rel.startsWith('assets/scenes/comic-b/') || rel.startsWith('assets/experiments/comic-b/')) return 'comic-ink';
  const area = rel.split('/')[1];
  if (area === 'scenes') return 'photograph';
  if (area === 'experiments') return 'experimental';
  if (area === 'originals') return 'original';
  return null;
}

const humanize = (stem: string): string => stem.replace(/-v\d+$/, '').replace(/[-_]+/g, ' ').trim();

/**
 * Plan registering one or more files. Nothing is written. `all unregistered` batches matter: the producer refuses
 * every registration while any other unregistered image sits under assets/, so the plan lists `blockedBy`.
 */
export async function planRegister(ctx: RegisterContext, paths: string[], opts: RegisterOptions = {}): Promise<RegisterPlan> {
  const l = await ctx.catalog.ensure();
  const errors: string[] = [];
  const items: PlanItem[] = [];
  const byPath = new Map<string, { record: ImageRecord; style: string }>();
  for (const r of l.manifest.records) for (const [style, t] of Object.entries(r.treatments)) if (t.path && !byPath.has(t.path)) byPath.set(t.path, { record: r, style });
  const byStem = new Map<string, { record: ImageRecord; style: string }[]>();
  for (const [p, hit] of byPath) {
    const k = stemOf(p);
    byStem.set(k, [...(byStem.get(k) ?? []), hit]);
  }
  const ids = new Set(l.manifest.records.map((r) => r.id.toLowerCase()));
  const records = new Map<string, Record<string, unknown>>();
  const taken = (candidate: string): boolean => byPath.has(candidate) || existsSync(path.join(ctx.catalog.libraryRoot, candidate));

  if (opts.record && !l.byId.has(opts.record)) errors.push(`Unknown record: ${opts.record}`);

  const seen = new Set<string>();
  // Highest -vN first, so when one batch holds several versions of a record the newest becomes its current treatment.
  const versionOf = (p: string): number => Number(/-v(\d+)\.[a-z0-9]+$/i.exec(p)?.[1] ?? 0);
  for (const input of [...new Set(paths)].sort((a, b) => versionOf(b) - versionOf(a))) {
    let rel: string;
    let abs: string;
    try {
      ({ abs, rel } = await confineLibraryPath(ctx.repoRoot, input, ['assets']));
    } catch (error) {
      errors.push((error as Error).message);
      items.push({ path: input, action: 'refuse', reason: (error as Error).message });
      continue;
    }
    // The same file named two ways (repo-relative and library-relative, e.g. a named path plus --all-unregistered).
    if (seen.has(rel)) continue;
    seen.add(rel);
    if (!IMAGE_EXT.has(path.extname(rel).toLowerCase())) {
      const reason = `Not an image file: ${rel}`;
      errors.push(reason);
      items.push({ path: rel, action: 'refuse', reason });
      continue;
    }
    let sha256: string;
    let bytes: number;
    try {
      bytes = (await fs.stat(abs)).size;
      sha256 = await hashFile(abs);
    } catch {
      const reason = `File not found: ${rel}`;
      errors.push(reason);
      items.push({ path: rel, action: 'refuse', reason });
      continue;
    }

    const registered = byPath.get(rel);
    if (registered) {
      const t = registered.record.treatments[registered.style] as { sha256?: string };
      if (t.sha256 === sha256) {
        items.push({ path: rel, action: 'noop', recordId: registered.record.id, style: registered.style, sha256, bytes, reason: 'Already registered with these bytes.' });
      } else {
        const proposedPath = nextFreeVersion(rel, taken);
        const reason = `Registered files are immutable and ${rel} holds different bytes. Save them as ${proposedPath} and register that.`;
        errors.push(reason);
        items.push({ path: rel, action: 'refuse', recordId: registered.record.id, style: registered.style, sha256, bytes, reason, proposedPath });
      }
      continue;
    }

    // Choose the record: explicit, else an existing record that holds an earlier version of the same stem, else a new one.
    let target: { record: ImageRecord; style: string } | undefined;
    let inferred: string | undefined;
    if (opts.record) {
      const record = l.byId.get(opts.record)?.record;
      if (record) {
        const style = opts.style ?? (Object.keys(record.treatments).length === 1 ? Object.keys(record.treatments)[0] : undefined);
        if (!style) errors.push(`${rel}: --style is required for record ${record.id} (it has several styles)`);
        else target = { record, style };
      }
    } else {
      const family = byStem.get(stemOf(rel)) ?? [];
      const styled = opts.style ? family.filter((f) => f.style === opts.style) : family;
      // `earlier-*` records are the producer's retained snapshots of replaced versions; a new version belongs to the
      // live record, so they never make the choice ambiguous.
      const live = styled.filter((f) => !f.record.id.startsWith('earlier-') && !(f.record as { retainedFrom?: string }).retainedFrom);
      const pick = live.length ? live : styled;
      if (pick.length === 1) {
        target = pick[0] as { record: ImageRecord; style: string };
        inferred = `New version of ${target.record.id} (same file name stem).`;
      }
    }

    const note = opts.note ?? '';
    const sourceName = opts.sourceName ?? path.posix.basename(rel);
    const treatment = { path: rel, status: 'unreviewed-preview', ...(note ? { note } : {}), sourceName };

    if (target) {
      const entry = records.get(target.record.id) ?? { id: target.record.id, treatments: {} };
      const treatments = entry.treatments as Record<string, unknown>;
      if (treatments[target.style] && (opts.record || !inferred)) {
        const reason = `${rel}: two files for ${target.record.id}/${target.style} in one batch; register them separately`;
        errors.push(reason);
        items.push({ path: rel, action: 'refuse', reason });
        continue;
      }
    }
    // An older inferred version in the same batch as a newer one is kept as its own record (a retained attempt).
    if (target && !(records.get(target.record.id)?.treatments as Record<string, unknown> | undefined)?.[target.style]) {
      const entry = records.get(target.record.id) ?? { id: target.record.id, treatments: {} };
      const treatments = entry.treatments as Record<string, unknown>;
      treatments[target.style] = treatment;
      records.set(target.record.id, entry);
      items.push({ path: rel, action: 'new-version', recordId: target.record.id, style: target.style, collection: target.record.collection, sha256, bytes, ...(inferred ? { inferred } : {}) });
      continue;
    }

    const collection = opts.collection ?? inferCollection(rel);
    if (!collection) {
      const reason = `${rel}: cannot infer a collection from the folder; pass --collection`;
      errors.push(reason);
      items.push({ path: rel, action: 'refuse', reason });
      continue;
    }
    if (collection === 'diagrams' || collection === 'icons') {
      const reason = `${rel}: ${collection} files need --record (an existing ${collection.slice(0, -1)} record) so the diagram keeps one logical identity`;
      errors.push(reason);
      items.push({ path: rel, action: 'refuse', reason });
      continue;
    }
    const style = opts.style ?? defaultStyle(rel);
    if (!style) {
      const reason = `${rel}: cannot infer a style from the folder; pass --style`;
      errors.push(reason);
      items.push({ path: rel, action: 'refuse', reason });
      continue;
    }
    let id = path.posix.basename(rel).replace(/\.[^.]+$/, '');
    if (!/^[A-Za-z0-9._-]+$/.test(id)) id = id.replace(/[^A-Za-z0-9._-]+/g, '-');
    const base = id;
    for (let n = 2; ids.has(id.toLowerCase()); n++) id = `${base}-${n}`;
    ids.add(id.toLowerCase());
    records.set(id, {
      id,
      collection,
      title: opts.title ?? humanize(base),
      description: opts.description ?? note,
      service: opts.service ?? 'Unsorted',
      category: opts.category ?? 'Unsorted',
      treatments: { [style]: treatment },
    });
    items.push({ path: rel, action: 'new-record', recordId: id, style, collection, sha256, bytes });
  }

  // Other unregistered files block the producer; surface them so the batch can include them.
  const planned = new Set(items.map((i) => i.path));
  const sweep = await sweepImages(ctx.catalog);
  const blockedBy = sweep.unregistered.map((u) => u.path).filter((p) => !planned.has(p));
  const writable = items.some((i) => i.action === 'new-record' || i.action === 'new-version');
  const hasRefusal = items.some((i) => i.action === 'refuse');
  return {
    ok: writable && errors.length === 0 && !hasRefusal && blockedBy.length === 0,
    items,
    errors,
    blockedBy,
    payload: writable ? { expectedManifestSha256: l.etag, records: [...records.values()] } : null,
  };
}

export interface RegisterResult {
  ok: boolean;
  payloadFile: string;
  receiptDir: string;
  register: { code: number; stdout: string; stderr: string };
  verify: { code: number; stdout: string; stderr: string } | null;
}

/** Write the payload and receipts under .state, check leases, run the producer's `register`, then `verify`. */
export async function runRegister(ctx: RegisterContext, plan: RegisterPlan): Promise<RegisterResult> {
  if (!plan.payload) throw new Error('Nothing to register');
  if (plan.blockedBy.length) throw new Error(`Unregistered files block registration: ${plan.blockedBy.slice(0, 5).join(', ')}${plan.blockedBy.length > 5 ? ' ...' : ''}`);
  for (const name of DERIVED_FILES) {
    const holder = ctx.leases?.holder(`wiki/image-library/${name}`);
    if (holder) throw new Error(`wiki/image-library/${name} is leased to ${holder}; no changes made`);
  }
  const stamp = (ctx.now?.() ?? new Date()).toISOString().replace(/[:.]/g, '-');
  const payloadFile = path.join(ctx.stateDir, 'register', `${stamp}.json`);
  const receiptDir = path.join(ctx.stateDir, 'receipts', stamp);
  await fs.mkdir(path.dirname(payloadFile), { recursive: true });
  await fs.mkdir(receiptDir, { recursive: true });
  await fs.writeFile(payloadFile, `${JSON.stringify(plan.payload, null, 2)}\n`, 'utf8');
  const python = ctx.python ?? process.env.MTW_PYTHON ?? 'python';
  const helper = helperPath(ctx);
  const library = ctx.catalog.libraryRoot;
  const register = await ctx.runProducer(python, [helper, 'register', '--library', library, '--receipt-dir', receiptDir, '--payload', payloadFile]);
  if (register.code !== 0) return { ok: false, payloadFile, receiptDir, register, verify: null };
  const verify = await ctx.runProducer(python, [helper, 'verify', '--library', library, '--receipt-dir', path.join(receiptDir, 'verify')]);
  return { ok: verify.code === 0, payloadFile, receiptDir, register, verify };
}

export { PathError };
