// New. Spend: token usage as API-equivalent ESTIMATES (subscription, not billed), plan limits, budgets, provider ledger.
// Reads run history through the core terminal service (usageRecords / latestPlanLimits); writes only
// wiki/operations/spend/{budgets.json,ledger.jsonl} through services.wiki, each with a decision record.
import { budgetStatuses, readBudgets, readLedger } from '../../server/core/spend';
import { isUnpriced } from '../../server/core/tokens';
import type { Budget, LedgerEntry } from '../../server/core/spend';
import type { PlanLimits, RunRecord } from '../../server/core/tokens';
import type { HealthRow, ServerModule, Services } from '../types';
import { meta } from './meta';

interface UsageSource {
  usageRecords(): RunRecord[];
  latestPlanLimits(): PlanLimits | null;
  pricing?: { get(): { asOf?: string; source?: string } };
}
const usage = (s: Services): UsageSource => s.terminals as unknown as UsageSource;

const dayKey = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const weekStart = (now: Date): Date => {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
  return d;
};

export interface Agg {
  runs: number;
  total: number;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  estCostUsd: number;
  cacheSavingsUsd: number;
  cacheHitRate: number;
}
function agg(rows: RunRecord[]): Agg {
  const a: Agg = { runs: rows.length, total: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, estCostUsd: 0, cacheSavingsUsd: 0, cacheHitRate: 0 };
  for (const r of rows) {
    const t = r.tokens;
    if (!t) continue;
    a.total += t.total;
    a.input += t.input;
    a.output += t.output;
    a.cacheRead += t.cacheRead;
    a.cacheWrite += t.cacheWrite;
    a.estCostUsd += t.estCostUsd ?? 0;
    a.cacheSavingsUsd += t.cacheSavingsUsd ?? 0;
  }
  const prompt = a.input + a.cacheRead + a.cacheWrite;
  a.cacheHitRate = prompt > 0 ? a.cacheRead / prompt : 0;
  return a;
}
function groupBy(rows: RunRecord[], key: (r: RunRecord) => string): ({ key: string } & Agg)[] {
  const m = new Map<string, RunRecord[]>();
  for (const r of rows) m.set(key(r), [...(m.get(key(r)) ?? []), r]);
  return [...m].map(([k, v]) => ({ key: k, ...agg(v) })).sort((a, b) => b.estCostUsd - a.estCostUsd || b.total - a.total);
}

export function buildOverview(records: RunRecord[], limits: PlanLimits | null, pricing: { asOf?: string; source?: string }, budgets: Budget[], now = new Date()) {
  const start = (r: RunRecord) => new Date(r.startedAt);
  const wk = weekStart(now);
  const mo = new Date(now.getFullYear(), now.getMonth(), 1);
  const week = records.filter((r) => start(r) >= wk);
  const month = records.filter((r) => start(r) >= mo);
  const days: { day: string; runners: Record<string, number>; estCostUsd: number; total: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    days.push({ day: dayKey(d), runners: {}, estCostUsd: 0, total: 0 });
  }
  const byDay = new Map(days.map((d) => [d.day, d]));
  for (const r of records) {
    const d = byDay.get(dayKey(start(r)));
    if (!d || !r.tokens) continue;
    d.runners[r.runner] = (d.runners[r.runner] ?? 0) + r.tokens.total;
    d.total += r.tokens.total;
    d.estCostUsd += r.tokens.estCostUsd ?? 0;
  }
  return {
    generatedAt: now.toISOString(),
    estimateNote: 'Estimates: API-equivalent cost from wiki/operations/pricing.json. Matt is on a subscription; these are not billed amounts.',
    pricing,
    unpricedRuns: month.filter((r) => r.tokens && isUnpriced(r.tokens)).length,
    // Model ids with no price in pricing.json: their tokens are left out of every estimate here (shown, never $0).
    unpricedModels: [...new Set(month.flatMap((r) => (r.tokens && isUnpriced(r.tokens) ? [r.tokens.model ?? 'unknown model'] : [])))].sort(),
    unpricedTokens: month.reduce((n, r) => n + (r.tokens && isUnpriced(r.tokens) ? r.tokens.total : 0), 0),
    periods: { week: agg(week), month: agg(month), all: agg(records) },
    days,
    byRunner: groupBy(month, (r) => r.runner),
    byModule: groupBy(month, (r) => r.module ?? 'no module'),
    topOperations: groupBy(month, (r) => `${r.module ?? '-'}/${r.operation ?? r.title}`).slice(0, 10),
    planLimits: {
      codex: limits,
      // Claude transcripts and OTel carry no plan-limit window: shown as "not reported", never guessed.
      claude: null as null,
    },
    budgets: budgetStatuses(budgets, records, now),
  };
}

const positive = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : undefined);

export function parseBudgets(body: unknown): Budget[] {
  const list = (body as { monthly?: unknown })?.monthly;
  if (!Array.isArray(list)) throw new Error('monthly must be a list');
  return list.map((b, i) => {
    const o = b as Record<string, unknown>;
    if (o.scope !== 'total' && o.scope !== 'runner' && o.scope !== 'module') throw new Error(`budget ${i + 1}: scope must be total, runner or module`);
    const key = typeof o.key === 'string' ? o.key.trim() : '';
    if (o.scope !== 'total' && !key) throw new Error(`budget ${i + 1}: a ${o.scope} budget needs a name`);
    const limitUsd = positive(o.limitUsd);
    const limitTokens = positive(o.limitTokens);
    if (!limitUsd && !limitTokens) throw new Error(`budget ${i + 1}: give a dollar or token limit`);
    return { scope: o.scope, ...(o.scope !== 'total' ? { key } : {}), ...(limitUsd ? { limitUsd } : {}), ...(limitTokens ? { limitTokens } : {}) };
  });
}

export function parseLedgerEntry(body: unknown, now = new Date()): LedgerEntry {
  const o = (body ?? {}) as Record<string, unknown>;
  const provider = typeof o.provider === 'string' ? o.provider.trim().toLowerCase().replace(/\s+/g, '-') : '';
  const units = Number(o.units);
  if (!provider) throw new Error('provider is required');
  if (!Number.isFinite(units) || units <= 0) throw new Error('units must be a positive number');
  if (o.unit !== 'credits' && o.unit !== 'usd' && o.unit !== 'images') throw new Error('unit must be credits, usd or images');
  const text = (k: string): string | undefined => (typeof o[k] === 'string' && (o[k] as string).trim() ? (o[k] as string).trim().slice(0, 300) : undefined);
  const at = text('at');
  if (at && Number.isNaN(Date.parse(at))) throw new Error('at must be a date');
  const entry: LedgerEntry = { at: at ? new Date(at).toISOString() : now.toISOString(), provider, units, unit: o.unit };
  for (const k of ['operation', 'subject', 'receipt', 'note'] as const) {
    const v = text(k);
    if (v) entry[k] = v;
  }
  return entry;
}

type Allowances = Record<string, { label?: string; amount?: number; unit?: string }>;

/** Pure: Home health rows for spend: monthly budgets, provider allowances (ledger this month) and price coverage. */
export function spendHealth(records: RunRecord[], budgets: Budget[], ledger: LedgerEntry[], allowances: Allowances, now = new Date()): HealthRow[] {
  const rows: HealthRow[] = [];
  const statuses = budgetStatuses(budgets, records, now);
  if (!statuses.length) {
    rows.push({ id: 'budgets', label: 'Spend vs budget', state: 'info', detail: 'No monthly budget set', href: '/m/spend/budgets', source: 'wiki/operations/spend/budgets.json' });
  } else {
    const worst = [...statuses].sort((a, b) => b.fraction - a.fraction)[0] as (typeof statuses)[number];
    const name = worst.scope === 'total' ? 'total' : `${worst.scope} ${worst.key}`;
    rows.push({ id: 'budgets', label: 'Spend vs budget', state: worst.fraction >= 1 ? 'fail' : worst.fraction >= 0.8 ? 'warn' : 'pass', detail: `${Math.round(worst.fraction * 100)}% of the ${name} monthly budget used (est.)${statuses.length > 1 ? `; ${statuses.length} budgets` : ''}`, href: '/m/spend/budgets', source: 'wiki/operations/spend/budgets.json + run records' });
  }
  const month = dayKey(now).slice(0, 7);
  for (const [id, a] of Object.entries(allowances)) {
    if (!a.amount) continue;
    const used = ledger.filter((e) => e.provider === id && dayKey(new Date(e.at)).slice(0, 7) === month && e.unit === (a.unit ?? 'credits')).reduce((n, e) => n + e.units, 0);
    const f = used / a.amount;
    rows.push({ id: `allowance-${id}`, label: `${a.label ?? id} allowance`, state: f >= 1 ? 'fail' : f >= 0.8 ? 'warn' : 'pass', detail: `${used.toLocaleString('en-US')} of ${a.amount.toLocaleString('en-US')} ${a.unit ?? 'credits'} this month (ledger)`, href: '/m/spend/providers', source: 'wiki/operations/spend/{ledger.jsonl,allowances.json}' });
  }
  const mo = new Date(now.getFullYear(), now.getMonth(), 1);
  const unpriced = [...new Set(records.filter((r) => new Date(r.startedAt) >= mo && r.tokens && isUnpriced(r.tokens)).map((r) => r.tokens?.model ?? 'unknown model'))].sort();
  rows.push(
    unpriced.length
      ? { id: 'pricing', label: 'Cost estimates', state: 'warn', detail: `Price unknown for ${unpriced.join(', ')}; their tokens are not costed`, href: '/m/spend', source: 'wiki/operations/pricing.json' }
      : { id: 'pricing', label: 'Cost estimates', state: 'pass', detail: 'Every model used this month has a price (placeholder prices; estimates only)', href: '/m/spend', source: 'wiki/operations/pricing.json' },
  );
  return rows;
}

export const server: ServerModule = {
  meta,
  async summary(services) {
    const repo = services.repoRoot;
    const records = usage(services).usageRecords();
    const allowances = (await services.wiki.exists('wiki/operations/spend/allowances.json')) ? await services.wiki.readJson<Allowances>('wiki/operations/spend/allowances.json') : {};
    const health = spendHealth(records, readBudgets(repo), readLedger(repo), allowances);
    const mo = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const month = agg(records.filter((r) => new Date(r.startedAt) >= mo));
    return {
      items: [{ id: 'month', label: 'Est. API-equivalent cost this month', count: `$${month.estCostUsd.toFixed(2)}`, detail: health.find((h) => h.id === 'pricing')?.detail ?? '', href: '/m/spend', source: 'run records + wiki/operations/pricing.json' }],
      health,
    };
  },
  register(router, services) {
    const repo = services.repoRoot;
    router.get('/overview', () => {
      const u = usage(services);
      return buildOverview(u.usageRecords(), u.latestPlanLimits(), u.pricing?.get() ?? {}, readBudgets(repo));
    });

    router.get('/runs', () => {
      const rows = usage(services)
        .usageRecords()
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
        .map((r) => ({
          id: r.id,
          startedAt: r.startedAt,
          durationMs: (r.exitedAt ? Date.parse(r.exitedAt) : Date.now()) - Date.parse(r.startedAt),
          runner: r.runner,
          model: r.tokens?.model ?? '',
          operation: r.operation ?? r.title,
          module: r.module ?? '',
          subject: r.subject ?? '',
          status: r.status,
          transcript: r.transcript ?? '',
          tokens: r.tokens ?? null,
        }));
      return { runs: rows };
    });

    router.get('/budgets', () => {
      const budgets = readBudgets(repo);
      return { monthly: budgets, statuses: budgetStatuses(budgets, usage(services).usageRecords()) };
    });
    router.post('/budgets', async ({ body }) => {
      const monthly = parseBudgets(body);
      await services.wiki.writeJson('wiki/operations/spend/budgets.json', { monthly });
      await services.decisions.append('operations/spend', { actor: 'matt', module: 'spend', subject: 'budgets', action: 'edit', value: monthly });
      return { monthly, statuses: budgetStatuses(monthly, usage(services).usageRecords()) };
    });

    const ledgerPayload = async () => {
      const entries = readLedger(repo).sort((a, b) => b.at.localeCompare(a.at));
      type Allowance = { label?: string; amount?: number; unit?: string; period?: string; source?: string };
      const allowances = (await services.wiki.exists('wiki/operations/spend/allowances.json')) ? await services.wiki.readJson<Record<string, Allowance>>('wiki/operations/spend/allowances.json') : {};
      const month = dayKey(new Date()).slice(0, 7);
      const thisMonth = entries.filter((e) => dayKey(new Date(e.at)).slice(0, 7) === month);
      const providers = new Set([...Object.keys(allowances), ...entries.map((e) => e.provider)]);
      const totals = [...providers].map((p) => {
        const units = new Map<string, number>();
        for (const e of thisMonth.filter((x) => x.provider === p)) units.set(e.unit, (units.get(e.unit) ?? 0) + e.units);
        const a = allowances[p];
        return { provider: p, label: a?.label ?? p, month: Object.fromEntries(units), allowance: a?.amount ? { amount: a.amount, unit: a.unit ?? 'credits', source: a.source ?? '' } : null };
      });
      return { entries, totals, month };
    };
    router.get('/ledger', ledgerPayload);
    router.post('/ledger', async ({ body }) => {
      const entry = parseLedgerEntry(body);
      const file = 'wiki/operations/spend/ledger.jsonl';
      const prev = (await services.wiki.exists(file)) ? await services.wiki.readText(file) : '';
      await services.wiki.writeText(file, `${prev}${prev && !prev.endsWith('\n') ? '\n' : ''}${JSON.stringify(entry)}\n`);
      await services.decisions.append('operations/spend', { actor: 'matt', module: 'spend', subject: entry.provider, action: 'ledger-add', value: entry });
      return ledgerPayload();
    });
  },
};
