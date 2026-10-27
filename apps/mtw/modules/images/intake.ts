// Images auto-intake (server/core/intake.ts). New image files under wiki/image-library/assets/ that no treatment names
// are registered through the same plan and producer as `mtw register image` (planRegister/runRegister ->
// maintain_library.py register, then verify), with status 'unreviewed-preview': never reviewed or approved.
//
// Record shape: planRegister's own inference first (folder collection, or a new version of the record whose file shares
// the name stem). A file it cannot place mirrors its registered siblings in the same folder (collection, style, service,
// category); with no usable sibling (or a diagrams/icons folder, whose records need a deliberate --record) it lands in
// 'experiments' with style 'unsorted' and a note, so it is catalogued and visible in the review queue, and Matt or an
// agent sorts it there. The producer refuses while any other unregistered image exists, and only one batch runs at a
// time (the core queue), so the batch is all-or-nothing; a concurrent registration elsewhere changes the manifest hash
// and is retried once after a fresh plan.
import path from 'node:path';
import type { IntakeFile, IntakeOutcome, ModuleIntake, Services } from '../types';
import { Catalog, IMAGE_EXT } from './server/catalog';
import { planRegister, runRegister } from './server/register';
import type { PlanItem, RegisterContext, RegisterOptions, RegisterPlan } from './server/register';
import { sweepImages } from './server/sweep';
import { formatImgRef } from './shared/refs';
import { DECISIONS_LIB } from './shared/types';

export const INTAKE_NOTE = 'Auto-registered by Studio intake; awaiting review.';
const ASSETS = 'wiki/image-library/assets/';
const LIBRARY = 'wiki/image-library/';

const libRel = (rel: string): string => (rel.startsWith(LIBRARY) ? rel.slice(LIBRARY.length) : rel);
const repoRel = (rel: string): string => (rel.startsWith(LIBRARY) ? rel : `${LIBRARY}${rel}`);

/**
 * Items that need a record decision: refusals a better record shape can fix (not immutability, not a missing file), and
 * an inferred new version of a diagram or icon record (that would swap a live record's current file).
 */
const placeable = (i: PlanItem): boolean =>
  (i.action === 'refuse' && !i.proposedPath && /collection|--style|--record/.test(i.reason ?? '')) ||
  (i.action === 'new-version' && (i.collection === 'diagrams' || i.collection === 'icons'));

const mostCommon = <T>(values: T[]): T | undefined => {
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
};

/** Options for a file planRegister could not place: mirror the registered siblings in its folder, else the fallback. */
export async function siblingOptions(catalog: Catalog, rel: string, date: string): Promise<RegisterOptions> {
  const l = await catalog.ensure();
  const folder = path.posix.dirname(libRel(rel));
  const siblings: { collection: string; style: string; service: string; category: string }[] = [];
  for (const r of l.manifest.records) {
    for (const [style, t] of Object.entries(r.treatments)) {
      if (t.path && path.posix.dirname(t.path) === folder) siblings.push({ collection: r.collection, style, service: r.service, category: r.category });
    }
  }
  const note = `${INTAKE_NOTE} (${date})`;
  // Diagrams and icons keep one record per subject and `earlier` holds archives: neither is a shape to copy.
  const usable = siblings.filter((s) => !['diagrams', 'icons', 'earlier'].includes(s.collection));
  const collection = mostCommon(usable.map((s) => s.collection));
  if (collection) {
    const same = usable.filter((s) => s.collection === collection);
    return {
      collection,
      style: mostCommon(same.map((s) => s.style)) ?? 'unsorted',
      service: mostCommon(same.map((s) => s.service)) ?? 'Unsorted',
      category: mostCommon(same.map((s) => s.category)) ?? 'Unsorted',
      note,
    };
  }
  // Style 'unsorted' so the plan never folds it into a diagram or icon record by file-name stem.
  return { collection: 'experiments', style: 'unsorted', service: 'Unsorted', category: 'Unsorted', note: `${note} No sibling record to mirror; sort it into its record.` };
}

/** Merge several plans into one producer payload; renames colliding new-record ids. */
export function mergePlans(plans: RegisterPlan[], etag: string): RegisterPlan {
  const items: PlanItem[] = [];
  const records: Record<string, unknown>[] = [];
  const ids = new Set<string>();
  const errors: string[] = [];
  for (const plan of plans) {
    const renamed = new Map<string, string>();
    for (const rec of plan.payload?.records ?? []) {
      const r = { ...rec } as { id: string; treatments: Record<string, unknown> };
      const existing = records.find((x) => (x as { id: string }).id === r.id) as { id: string; treatments: Record<string, unknown> } | undefined;
      if (existing && !('collection' in r)) {
        // Two new versions of the same existing record: merge treatments when the styles differ.
        for (const [style, t] of Object.entries(r.treatments)) {
          if (existing.treatments[style]) errors.push(`two files for ${r.id}/${style} in one batch`);
          else existing.treatments[style] = t;
        }
        continue;
      }
      let id = r.id;
      for (let n = 2; ids.has(id.toLowerCase()); n++) id = `${r.id}-${n}`;
      if (id !== r.id) renamed.set(r.id, id);
      ids.add(id.toLowerCase());
      records.push({ ...r, id });
    }
    for (const i of plan.items) items.push(i.recordId && renamed.has(i.recordId) && i.action === 'new-record' ? { ...i, recordId: renamed.get(i.recordId) as string } : i);
    errors.push(...plan.errors.filter((e) => !/cannot infer|need --record|--style is required/.test(e)));
  }
  return { ok: errors.length === 0, items, errors, blockedBy: [], payload: records.length ? { expectedManifestSha256: etag, records } : null };
}

export function createImagesIntake(services: Services, opts: { catalog?: Catalog; stateDir?: string; python?: string; helper?: string; now?: () => Date } = {}): ModuleIntake {
  const catalog = opts.catalog ?? new Catalog(services.repoRoot, services.decisions);
  const ctx: RegisterContext = {
    repoRoot: services.repoRoot,
    catalog,
    leases: services.leases,
    stateDir: opts.stateDir ?? process.env.MTW_STATE_DIR ?? path.join(services.repoRoot, 'apps', 'mtw', '.state'),
    runProducer: (c, a) => services.wiki.runProducer(c, a),
    ...(opts.python ? { python: opts.python } : {}),
    ...(opts.helper ? { helper: opts.helper } : {}),
  };
  const now = (): Date => (opts.now ? opts.now() : new Date());

  const registeredPaths = async (): Promise<Set<string>> => {
    const l = await catalog.ensure();
    const out = new Set<string>();
    for (const r of l.manifest.records) for (const t of Object.values(r.treatments)) if (t.path) out.add(t.path);
    return out;
  };

  async function attempt(files: IntakeFile[], graceUntil: (mtimeMs: number) => number | null): Promise<{ outcomes: IntakeOutcome[]; retry: boolean; blockers?: { path: string; mtimeMs: number; arrivedMs: number; bytes: number; inferred: string | null }[] }> {
    const rels = files.map((f) => repoRel(f.path));
    const mtimes = new Map(files.map((f) => [libRel(f.path), f.mtimeMs]));
    const date = now().toISOString().slice(0, 10);
    const first = await planRegister(ctx, rels, { note: `${INTAKE_NOTE} (${date})` });
    // A file that needs a record decision (a diagram's new version, an unknown folder) waits a grace period for its
    // author's own `mtw register image --record` before intake files it under experiments.
    const deferred: IntakeOutcome[] = [];
    const toPlace: PlanItem[] = [];
    for (const item of first.items.filter(placeable)) {
      const until = graceUntil(mtimes.get(libRel(item.path)) ?? 0);
      if (until) deferred.push({ path: repoRel(item.path), ok: false, deferUntil: until, detail: `needs a record decision; waiting for its author to register it until ${new Date(until).toISOString().slice(11, 16)} UTC` });
      else toPlace.push(item);
    }
    // Drop the items being re-placed (or deferred) from the first plan's payload too, not just from its item list.
    const moved = new Set(first.items.filter(placeable).map((i) => i.path));
    const keptRecords = (first.payload?.records ?? [])
      .map((rec) => {
        const r = rec as { treatments: Record<string, { path?: string }> };
        const treatments = Object.fromEntries(Object.entries(r.treatments).filter(([, t]) => !moved.has(t.path ?? '')));
        return { ...rec, treatments };
      })
      .filter((rec) => Object.keys(rec.treatments).length > 0);
    const plans: RegisterPlan[] = [{ ...first, items: first.items.filter((i) => !placeable(i)), payload: first.payload ? { ...first.payload, records: keptRecords } : null }];
    const groups = new Map<string, { opts: RegisterOptions; paths: string[] }>();
    for (const item of toPlace) {
      const o = await siblingOptions(catalog, item.path, date);
      const key = JSON.stringify(o);
      groups.set(key, { opts: o, paths: [...(groups.get(key)?.paths ?? []), item.path] });
    }
    for (const g of groups.values()) plans.push(await planRegister(ctx, g.paths, g.opts));
    const l = await catalog.ensure();
    const merged = mergePlans(plans, l.etag);
    const fail = (p: string, detail: string): IntakeOutcome => ({ path: repoRel(p), ok: false, detail });
    const outcomes: IntakeOutcome[] = [...deferred];
    const deferredPaths = new Set(deferred.map((d) => libRel(d.path)));
    const refused = merged.items.filter((i) => i.action === 'refuse');
    for (const i of refused) outcomes.push(fail(i.path, i.reason ?? 'refused'));
    const writable = merged.items.filter((i) => i.action === 'new-record' || i.action === 'new-version');
    if (!writable.length || !merged.payload) return { outcomes, retry: false };
    if (refused.length || !merged.ok) {
      const why = `not registered: the batch has refusals (${[...refused.map((i) => i.reason), ...merged.errors].slice(0, 2).join('; ')})`;
      return { outcomes: [...outcomes, ...writable.map((i) => fail(i.path, why))], retry: false };
    }
    const planned = new Set([...merged.items.map((i) => i.path), ...deferredPaths]);
    const others = (await sweepImages(catalog)).unregistered.filter((u) => !planned.has(u.path));
    const blockedBy = [...others.map((u) => u.path), ...deferredPaths];
    if (blockedBy.length) {
      const why = `blocked: the producer refuses while ${blockedBy.length} other unregistered image(s) exist (${blockedBy.slice(0, 3).join(', ')}); register those first (mtw register image ...)`;
      return { outcomes: writable.map((i) => fail(i.path, why)), retry: false, blockers: deferredPaths.size ? undefined : others.map((u) => ({ path: repoRel(u.path), mtimeMs: Date.parse(u.mtime), arrivedMs: Date.parse(u.arrived ?? u.mtime), bytes: u.bytes, inferred: u.inferred })) };
    }
    const result = await runRegister(ctx, { ...merged, blockedBy: [] });
    if (!result.ok) {
      const tail = `${result.register.stderr || result.register.stdout}${result.verify ? ` ${result.verify.stderr || result.verify.stdout}` : ''}`.trim().split('\n').slice(-2).join(' ').slice(0, 300);
      if (result.register.code === 0) {
        // Registered; only the follow-up verify failed (often a peer's concurrent write). Report the registration so it
        // is logged, and say verify failed so it is visible.
        return {
          outcomes: [...outcomes, ...writable.map((i) => ({ path: repoRel(i.path), ok: true, subject: formatImgRef(i.recordId as string, 'current', i.style), detail: `${i.action} ${i.recordId} (${i.collection ?? 'existing record'}), unreviewed-preview; producer verify failed afterwards: ${tail}` }))],
          retry: false,
        };
      }
      const changed = (await catalog.ensure()).etag !== merged.payload.expectedManifestSha256;
      return { outcomes: writable.map((i) => fail(i.path, `producer register failed: ${tail}`)), retry: changed };
    }
    for (const i of writable) {
      outcomes.push({ path: repoRel(i.path), ok: true, subject: formatImgRef(i.recordId as string, 'current', i.style), detail: `${i.action} ${i.recordId}${i.style ? `#${i.style}` : ''} (${i.collection ?? 'existing record'}), unreviewed-preview` });
    }
    return { outcomes, retry: false };
  }

  return {
    lib: DECISIONS_LIB,
    defaultRoots: [ASSETS],
    accepts: (rel) => rel.startsWith(ASSETS) && IMAGE_EXT.has(path.posix.extname(rel).toLowerCase()),
    async unregistered(rels) {
      const known = await registeredPaths();
      return rels.filter((r) => !known.has(libRel(r)));
    },
    async register(files, scope) {
      const known = await registeredPaths();
      let todo = files.filter((f) => !known.has(libRel(f.path)));
      if (!todo.length) return [];
      const grace = scope?.force ? 0 : (scope?.graceMs ?? 0);
      const graceUntil = (mtimeMs: number): number | null => (grace > 0 && mtimeMs + grace > Date.now() ? mtimeMs + grace : null);
      let r = await attempt(todo, graceUntil);
      // Files that settled a moment apart block each other; when every blocker is itself intake-eligible (newer than
      // the since floor, settled, and not waiting on a record decision), register them together in one batch.
      // Older backlog files are never swept in; a copy that keeps an old mtime counts from when it arrived.
      const settled = Date.now() - (scope?.stableMs ?? 2000);
      if (scope && r.blockers?.length && r.blockers.every((b) => b.arrivedMs >= scope.sinceMs && b.mtimeMs <= settled && !(b.inferred === null && graceUntil(b.mtimeMs)))) {
        todo = [...todo, ...r.blockers];
        r = await attempt(todo, graceUntil);
      }
      if (!r.retry) return r.outcomes;
      // The manifest changed under us (a registration elsewhere): re-plan once on the fresh catalog.
      const fresh = await registeredPaths();
      const again = todo.filter((f) => !fresh.has(libRel(f.path)));
      return again.length ? (await attempt(again, graceUntil)).outcomes : [];
    },
    async pending() {
      const l = await catalog.ensure();
      let count = 0;
      for (const r of l.manifest.records) {
        for (const t of Object.values(r.treatments) as { status?: string; note?: string }[]) {
          if (t.note?.startsWith(INTAKE_NOTE) && /unreviewed/.test(t.status ?? '')) count++;
        }
      }
      return { count, label: 'Images auto-registered, awaiting review', href: '/m/images?collection=all&status=unreviewed' };
    },
  };
}
