// Spend: price table (estimates), per-run usage history, weekly rollups, budgets and the provider ledger.
// Everything here is ESTIMATE-only: Matt is on a subscription, so costs are API-equivalent, never billed amounts.
import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { TokenTotals } from '../../modules/types';
import { summarizeRuns } from './tokens';
import type { RunRecord, UsageSummary } from './tokens';

export interface ModelPrice {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}
export interface PricingFile {
  asOf?: string;
  source?: string;
  unit?: string;
  models: Record<string, ModelPrice>;
}

/** wiki/operations/pricing.json, re-read when its mtime changes so an edit applies without a restart. */
export class PricingTable {
  private cache: { mtime: number; data: PricingFile } | null = null;
  constructor(private file: string) {}

  get(): PricingFile {
    try {
      const mtime = statSync(this.file).mtimeMs;
      if (!this.cache || this.cache.mtime !== mtime) this.cache = { mtime, data: JSON.parse(readFileSync(this.file, 'utf8')) as PricingFile };
      return this.cache.data;
    } catch {
      return { models: {} };
    }
  }

  priceFor(model: string | undefined): ModelPrice | null {
    if (!model) return null;
    const id = model.toLowerCase();
    let best: string | null = null;
    for (const key of Object.keys(this.get().models)) {
      if (id.includes(key.toLowerCase()) && (!best || key.length > best.length)) best = key;
    }
    return best ? (this.get().models[best] as ModelPrice) : null;
  }

  /** Adds estCostUsd (what these tokens cost at API prices) and cacheSavingsUsd (cache reads vs. uncached input). */
  withEstimate(t: TokenTotals): TokenTotals {
    const p = this.priceFor(t.model);
    if (!p) {
      // No price is "unknown", never $0: callers show the model id as unpriced (see unpricedModels in tokens.ts).
      const { estCostUsd: _a, cacheSavingsUsd: _b, ...rest } = t;
      return { ...rest, unpriced: true };
    }
    const { unpriced: _u, ...priced } = t;
    t = priced;
    const m = 1_000_000;
    const est = (t.input * p.input + t.output * p.output + t.cacheRead * p.cacheRead + t.cacheWrite * p.cacheWrite) / m;
    const saved = (t.cacheRead * (p.input - p.cacheRead)) / m;
    return { ...t, estCostUsd: est, cacheSavingsUsd: Math.max(0, saved) };
  }
}

/** ISO week key like 2026-41 (year of the week's Thursday). */
export function isoWeekKey(d: Date): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(t.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((t.getTime() - yearStart) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-${String(week).padStart(2, '0')}`;
}

export interface UsageLine {
  id: string;
  runner: string;
  model?: string | undefined;
  title: string;
  operation?: string | undefined;
  module?: string | undefined;
  subject?: string | undefined;
  startedAt: string;
  exitedAt?: string | undefined;
  durationMs: number;
  status: string;
  exitCode?: number | undefined;
  tokens?: TokenTotals | undefined;
}

/** Append-only per-run summary: .state/usage.jsonl. */
export function appendUsageLine(stateDir: string, line: UsageLine): void {
  try {
    mkdirSync(stateDir, { recursive: true });
    appendFileSync(path.join(stateDir, 'usage.jsonl'), `${JSON.stringify(line)}\n`, 'utf8');
  } catch {
    /* history must never break a run */
  }
}

const slimRows = (rows: UsageSummary['byOperation']) =>
  rows.map((r) => ({ key: r.key, label: r.label, ...(r.module ? { module: r.module } : {}), runs: r.runs, input: r.input, output: r.output, cacheRead: r.cacheRead, cacheWrite: r.cacheWrite, total: r.total, estCostUsd: Math.round(r.estCostUsd * 1e4) / 1e4 }));

/**
 * Small weekly rollup committed in the wiki so agents can see usage history: totals by operation, module and
 * runner only. No prompts, no paths. Rewritten atomically from every run record of that ISO week.
 */
export function writeWeeklyRollup(repoRoot: string, records: RunRecord[], when: Date): string {
  const week = isoWeekKey(when);
  const inWeek = records.filter((r) => isoWeekKey(new Date(r.startedAt)) === week);
  const s = summarizeRuns(inWeek, when);
  const byModule = new Map<string, UsageSummary['byOperation'][number]>();
  for (const r of s.byOperation) {
    const key = r.module ?? '-';
    const m = byModule.get(key) ?? { ...r, key, label: key, runs: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0, cacheHitRate: 0, costUsd: 0, estCostUsd: 0, cacheSavingsUsd: 0, unpricedTokens: 0, unpricedModels: [] };
    m.runs += r.runs;
    m.input += r.input;
    m.output += r.output;
    m.cacheRead += r.cacheRead;
    m.cacheWrite += r.cacheWrite;
    m.total += r.total;
    m.estCostUsd += r.estCostUsd;
    byModule.set(key, m);
  }
  const dir = path.join(repoRoot, 'wiki', 'operations', 'usage');
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${week}.json`);
  const doc = {
    week,
    updatedAt: when.toISOString(),
    note: 'Token usage by terminal runs started this ISO week. est* fields are API-equivalent ESTIMATES from wiki/operations/pricing.json, not billed amounts (subscription).',
    runs: inWeek.length,
    totals: { input: s.all.input, output: s.all.output, cacheRead: s.all.cacheRead, cacheWrite: s.all.cacheWrite, total: s.all.total, estCostUsd: Math.round(s.all.estCostUsd * 1e4) / 1e4 },
    byOperation: slimRows(s.byOperation),
    byModule: slimRows([...byModule.values()]),
    byRunner: slimRows(s.byRunner),
  };
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
  renameSync(tmp, file);
  return file;
}

// ------------------------------------------------------------------ budgets

export interface Budget {
  scope: 'total' | 'runner' | 'module';
  /** runner id / module id; omitted for 'total'. */
  key?: string;
  limitUsd?: number;
  limitTokens?: number;
}
export interface BudgetStatus extends Budget {
  usedUsd: number;
  usedTokens: number;
  /** Highest of the cost and token fractions that have a limit. */
  fraction: number;
}

export function readBudgets(repoRoot: string): Budget[] {
  try {
    const doc = JSON.parse(readFileSync(path.join(repoRoot, 'wiki', 'operations', 'spend', 'budgets.json'), 'utf8')) as { monthly?: Budget[] };
    return (doc.monthly ?? []).filter((b) => b && (b.scope === 'total' || b.key));
  } catch {
    return [];
  }
}

export function budgetStatuses(budgets: Budget[], records: RunRecord[], now = new Date()): BudgetStatus[] {
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const mine = records.filter((r) => {
    const d = new Date(r.startedAt);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === month;
  });
  return budgets.map((b) => {
    const rows = mine.filter((r) => (b.scope === 'total' ? true : b.scope === 'runner' ? r.runner === b.key : r.module === b.key));
    const usedUsd = rows.reduce((n, r) => n + (r.tokens?.estCostUsd ?? 0), 0);
    const usedTokens = rows.reduce((n, r) => n + (r.tokens?.total ?? 0), 0);
    const fr = [b.limitUsd ? usedUsd / b.limitUsd : 0, b.limitTokens ? usedTokens / b.limitTokens : 0];
    return { ...b, usedUsd, usedTokens, fraction: Math.max(...fr) };
  });
}

// ------------------------------------------------------------------ provider ledger

export interface LedgerEntry {
  at: string;
  provider: string;
  units: number;
  unit: 'credits' | 'usd' | 'images';
  operation?: string;
  subject?: string;
  receipt?: string;
  note?: string;
}

export function readLedger(repoRoot: string): LedgerEntry[] {
  const file = path.join(repoRoot, 'wiki', 'operations', 'spend', 'ledger.jsonl');
  if (!existsSync(file)) return [];
  const out: LedgerEntry[] = [];
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      const e = JSON.parse(line) as LedgerEntry;
      if (e.provider && typeof e.units === 'number') out.push(e);
    } catch {
      /* skip a damaged line */
    }
  }
  return out;
}
