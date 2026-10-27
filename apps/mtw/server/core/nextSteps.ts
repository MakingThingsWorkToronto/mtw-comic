// Home "Next steps": a short ordered list from deterministic rules over the dashboard's facts. No model, no prose
// generation: each rule reads one fact and writes one fixed sentence. Order = the rule order below (unblock work
// first, then Matt's decisions oldest first, then housekeeping). Tests: tests/home-dashboard.test.ts.
import type { NeedItem } from '../../modules/types';
import type { OwnerGroup } from './gitChanges';
import type { LeaseRow } from './statusBoard';

export interface StepFacts {
  now: Date;
  /** Server source files changed after this Studio process started (null: not known yet). */
  restart: { files: string[]; runningTerminals: number } | null;
  /** Site preview reachable (null: not checked yet). */
  siteUp: boolean | null;
  leases: LeaseRow[];
  /** Uncommitted changes by likely owner (null: git status not read yet). */
  owners: OwnerGroup[] | null;
  intake: { failures: number; newest?: { path: string; error: string }; held: { holder: string; files: number }[]; misses: number; enabled: boolean } | null;
  /** Everything awaiting Matt, already sorted oldest first. */
  needs: (NeedItem & { module: string })[];
  unpricedModels: string[];
  gates: { name: string; ok: boolean }[] | null;
}

export interface NextStep {
  id: string;
  text: string;
  href?: string;
  /** The fact that produced the step (shown as the step's source). */
  because: string;
}

const ago = (iso: string | undefined, now: Date): string => {
  if (!iso) return '';
  const min = Math.round((now.getTime() - Date.parse(iso)) / 60_000);
  if (!Number.isFinite(min)) return '';
  if (min < 60) return `${min} min`;
  if (min < 48 * 60) return `${Math.round(min / 60)} h`;
  return `${Math.round(min / 1440)} days`;
};
const plural = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`;

/** Pure: the ordered next steps (at most `max`). */
export function nextSteps(f: StepFacts, max = 8): NextStep[] {
  const out: NextStep[] = [];

  // 1. Unblock: a stale Studio, the site preview, leases past their review time, failing gates.
  if (f.restart && f.restart.files.length) {
    const busy = f.restart.runningTerminals ? ` after its ${plural(f.restart.runningTerminals, 'running terminal')} finish` : '';
    out.push({ id: 'restart', text: `Restart Studio${busy} to load ${plural(f.restart.files.length, 'changed server file')} (${f.restart.files.slice(0, 2).join(', ')}${f.restart.files.length > 2 ? ', ...' : ''})`, because: 'apps/mtw server sources newer than this Studio process' });
  }
  if (f.siteUp === false) out.push({ id: 'site', text: 'Start the site preview with npm run all (port 8787 does not answer)', because: 'wiki/operations/editor.json siteBaseUrl' });
  for (const l of f.leases.filter((x) => x.overdue && !x.expired)) {
    out.push({ id: `lease-${l.holder}-${l.path}`, text: `Ask ${l.holder} to release or renew its lease on ${l.path} (review was due ${ago(l.reviewByUtc, f.now)} ago)`, because: 'wiki/operations/leases.json reviewByUtc' });
  }
  for (const g of (f.gates ?? []).filter((x) => !x.ok)) out.push({ id: `gate-${g.name}`, text: `Fix the failing wiki gate: ${g.name}`, because: `${g.name} (last background run)` });

  // 2. Registration problems that keep media out of Matt's review.
  if (f.intake && !f.intake.enabled) out.push({ id: 'intake-off', text: 'Turn auto-intake back on (wiki/operations/intake.json "enabled")', because: 'wiki/operations/intake.json' });
  if (f.intake?.failures) {
    out.push({ id: 'intake-failures', text: `Fix ${plural(f.intake.failures, 'intake failure')} from the last 24 h${f.intake.newest ? `; newest: ${f.intake.newest.error.slice(0, 90)}` : ''}`, href: '/m/images', because: 'apps/mtw/.state/intake/state.json' });
  }
  if (f.intake?.misses) out.push({ id: 'misses', text: `Register or relocate ${plural(f.intake.misses, 'file')} an agent stopped without registering`, href: '/m/images', because: 'apps/mtw/.state/intake-misses.jsonl' });

  // 3. Matt's decisions, oldest first (one step per module so one long queue does not crowd out the rest).
  const seen = new Set<string>();
  for (const n of f.needs) {
    if (seen.has(n.module)) continue;
    seen.add(n.module);
    out.push({ id: `need-${n.id}`, text: `${n.next}: ${n.title}`, href: n.href, because: n.source });
  }

  // 4. Housekeeping: commits blocked by leases, unclaimed changes, unpriced models.
  for (const o of (f.owners ?? []).filter((x) => x.via === 'lease')) {
    out.push({ id: `commit-lease-${o.owner}`, text: `Commit ${plural(o.files, 'file')} under ${o.lease?.path ?? o.areas.join(', ')} after lease ${o.owner} is released`, because: 'git status + wiki/operations/leases.json' });
  }
  const unclaimed = (f.owners ?? []).find((x) => x.via === 'none');
  if (unclaimed && unclaimed.files) {
    out.push({ id: 'commit-unclaimed', text: `Claim or commit ${plural(unclaimed.files, 'changed file')} no session claims (${unclaimed.areas.slice(0, 3).join(', ')}${unclaimed.areas.length > 3 ? ', ...' : ''})`, because: 'git status + discussion/handoff/STATUS.md' });
  }
  for (const h of f.intake?.held ?? []) {
    out.push({ id: `held-${h.holder}`, text: `${plural(h.files, 'new image')} will register once ${h.holder} releases the image catalog`, because: 'apps/mtw/.state/intake/state.json' });
  }
  if (f.unpricedModels.length) {
    out.push({ id: 'pricing', text: `Add confirmed prices for ${f.unpricedModels.join(', ')} to wiki/operations/pricing.json (their tokens are not costed)`, href: '/m/spend', because: 'wiki/operations/pricing.json' });
  }
  return out.slice(0, max);
}
