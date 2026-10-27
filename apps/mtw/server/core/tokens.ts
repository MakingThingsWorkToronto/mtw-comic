// Token tracking for agent terminals. Pluggable by runner `tokenSource` (wiki/operations/runners.json):
//   claude-transcript  ~/.claude/projects/<cwd munged>/<session-id>.jsonl (MTW chooses the session id)
//   codex-rollout      ~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl, bound by cwd + start time
//   otel               the built-in OTLP receiver (server/core/otel.ts) - preferred when it has data
// A new harness is a data row; add an adapter here only when it has its own transcript format.
import { closeSync, existsSync, openSync, readdirSync, readFileSync, readSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import type { TerminalInfo, TokenSourceId, TokenTotals } from '../../modules/types';

export interface Usage {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

export function totalsFrom(u: Usage, extra: { model?: string | undefined; total?: number | undefined; costUsd?: number | undefined; source?: TokenSourceId } = {}): TokenTotals {
  const total = extra.total ?? u.input + u.output + u.cacheRead + u.cacheWrite;
  const prompt = u.input + u.cacheRead + u.cacheWrite;
  return {
    input: u.input,
    output: u.output,
    cacheRead: u.cacheRead,
    cacheWrite: u.cacheWrite,
    total,
    cacheHitRate: prompt > 0 ? u.cacheRead / prompt : 0,
    ...(extra.model ? { model: extra.model } : {}),
    ...(extra.costUsd !== undefined ? { costUsd: extra.costUsd } : {}),
    ...(extra.source ? { source: extra.source } : {}),
  };
}

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** Claude transcript: assistant lines repeat while streaming, so keep the largest value per field per message.id. */
export class ClaudeAccumulator {
  private byId = new Map<string, Usage>();
  private model: string | undefined;
  private anon = 0;

  addLine(line: string): void {
    if (!line.includes('"usage"')) return;
    let obj: { type?: string; uuid?: string; message?: { id?: string; model?: string; usage?: Record<string, unknown> } };
    try {
      obj = JSON.parse(line);
    } catch {
      return;
    }
    const msg = obj.message;
    const usage = msg?.usage;
    if (!usage || (obj.type !== undefined && obj.type !== 'assistant')) return;
    if (msg?.model && msg.model !== '<synthetic>') this.model = msg.model;
    const id = msg?.id ?? obj.uuid ?? `anon-${this.anon++}`;
    const next: Usage = {
      input: num(usage.input_tokens),
      output: num(usage.output_tokens),
      cacheRead: num(usage.cache_read_input_tokens),
      cacheWrite: num(usage.cache_creation_input_tokens),
    };
    const prev = this.byId.get(id);
    this.byId.set(id, prev ? { input: Math.max(prev.input, next.input), output: Math.max(prev.output, next.output), cacheRead: Math.max(prev.cacheRead, next.cacheRead), cacheWrite: Math.max(prev.cacheWrite, next.cacheWrite) } : next);
  }

  totals(): TokenTotals | null {
    if (!this.byId.size) return null;
    const sum: Usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
    for (const u of this.byId.values()) {
      sum.input += u.input;
      sum.output += u.output;
      sum.cacheRead += u.cacheRead;
      sum.cacheWrite += u.cacheWrite;
    }
    return totalsFrom(sum, { model: this.model, source: 'claude-transcript' });
  }
}

export interface PlanWindow {
  usedPercent: number;
  windowMinutes: number;
  resetsAt: string | null;
}
export interface PlanLimits {
  at: string;
  primary: PlanWindow | null;
  secondary: PlanWindow | null;
}

/** Codex rollout: `token_count` events carry a running total, so the latest wins. input_tokens includes cached tokens. */
export class CodexAccumulator {
  private latest: Record<string, unknown> | null = null;
  private model: string | undefined;
  /** Latest plan-limit snapshot Codex reported (primary/secondary windows). */
  rateLimits: PlanLimits | null = null;

  addLine(line: string): void {
    if (!line.includes('token_count') && !line.includes('turn_context')) return;
    let obj: { timestamp?: string; type?: string; payload?: { type?: string; model?: string; info?: { total_token_usage?: Record<string, unknown> } | null; rate_limits?: Record<string, { used_percent?: number; window_minutes?: number; resets_at?: number } | null> | null } };
    try {
      obj = JSON.parse(line);
    } catch {
      return;
    }
    const p = obj.payload;
    if (!p) return;
    if (obj.type === 'turn_context' && typeof p.model === 'string') this.model = p.model;
    if (p.type === 'token_count' && p.info?.total_token_usage) this.latest = p.info.total_token_usage;
    if (p.type === 'token_count' && p.rate_limits) {
      const win = (w: { used_percent?: number; window_minutes?: number; resets_at?: number } | null | undefined): PlanWindow | null =>
        w && typeof w.used_percent === 'number' ? { usedPercent: w.used_percent, windowMinutes: num(w.window_minutes), resetsAt: w.resets_at ? new Date(w.resets_at * 1000).toISOString() : null } : null;
      this.rateLimits = { at: obj.timestamp ?? new Date().toISOString(), primary: win(p.rate_limits.primary), secondary: win(p.rate_limits.secondary) };
    }
  }

  totals(): TokenTotals | null {
    const t = this.latest;
    if (!t) return null;
    const cached = num(t.cached_input_tokens);
    const write = num(t.cache_write_input_tokens);
    const input = Math.max(0, num(t.input_tokens) - cached - write);
    const total = num(t.total_tokens) || num(t.input_tokens) + num(t.output_tokens);
    return totalsFrom({ input, output: num(t.output_tokens), cacheRead: cached, cacheWrite: write }, { model: this.model, total, source: 'codex-rollout' });
  }
}

/** Reads only the bytes appended since the last call; never consumes a partial last line. */
export class TailReader {
  private offset = 0;
  constructor(readonly file: string) {}

  readLines(maxBytes = 8 * 1024 * 1024): { lines: string[]; reset: boolean } {
    let size: number;
    try {
      size = statSync(this.file).size;
    } catch {
      return { lines: [], reset: false };
    }
    let reset = false;
    if (size < this.offset) {
      this.offset = 0;
      reset = true;
    }
    if (size === this.offset) return { lines: [], reset };
    const length = Math.min(size - this.offset, maxBytes);
    const buf = Buffer.alloc(length);
    const fd = openSync(this.file, 'r');
    try {
      readSync(fd, buf, 0, length, this.offset);
    } finally {
      closeSync(fd);
    }
    const lastNl = buf.lastIndexOf(0x0a);
    if (lastNl < 0) return { lines: [], reset };
    this.offset += lastNl + 1;
    return { lines: buf.subarray(0, lastNl).toString('utf8').split('\n').filter((l) => l.trim()), reset };
  }
}

export interface TrackSpec {
  terminalId: string;
  cwd: string;
  startedAt: Date;
  sessionId?: string | undefined;
}

/** One live binding of a terminal to a transcript. */
export interface TranscriptHandle {
  /** New totals when anything changed since the last call, else null. */
  refresh(): TokenTotals | null;
  /** Current totals regardless of change (used for the final read). */
  current(): TokenTotals | null;
  transcriptPath(): string | null;
  /** Plan-limit snapshot when the transcript carries one (Codex rate_limits). */
  rateLimits?(): PlanLimits | null;
  dispose(): void;
}

export interface TokenTrackerOptions {
  /** Defaults to %USERPROFILE%/.claude */
  claudeHome?: string;
  /** Defaults to %USERPROFILE%/.codex */
  codexHome?: string;
  /** How long a Codex terminal keeps looking for its rollout file. */
  codexBindWindowMs?: number;
}

export const normalizeCwd = (p: string): string => p.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
/** Claude names a project folder after the cwd with every non-alphanumeric turned into '-'. */
export const claudeProjectDir = (cwd: string): string => cwd.replace(/[^A-Za-z0-9]/g, '-');

type Adapter = (spec: TrackSpec) => TranscriptHandle;

export class TokenTracker {
  private claudeHome: string;
  private codexHome: string;
  private bound = new Set<string>();
  private adapters: Record<string, Adapter>;
  private bindWindow: number;

  constructor(opts: TokenTrackerOptions = {}) {
    this.claudeHome = opts.claudeHome ?? path.join(homedir(), '.claude');
    this.codexHome = opts.codexHome ?? path.join(homedir(), '.codex');
    this.bindWindow = opts.codexBindWindowMs ?? 10 * 60_000;
    this.adapters = {
      'claude-transcript': (spec) => this.claude(spec),
      'codex-rollout': (spec) => this.codex(spec),
    };
  }

  /** The adapter for a runner tokenSource, or null (otel / none have no transcript). */
  track(source: string, spec: TrackSpec): TranscriptHandle | null {
    const adapter = this.adapters[source];
    return adapter ? adapter(spec) : null;
  }

  claudeTranscriptPath(cwd: string, sessionId: string): string | null {
    const projects = path.join(this.claudeHome, 'projects');
    const direct = path.join(projects, claudeProjectDir(cwd), `${sessionId}.jsonl`);
    if (existsSync(direct)) return direct;
    try {
      for (const dir of readdirSync(projects)) {
        const candidate = path.join(projects, dir, `${sessionId}.jsonl`);
        if (existsSync(candidate)) return candidate;
      }
    } catch {
      /* no projects folder yet */
    }
    return null;
  }

  private claude(spec: TrackSpec): TranscriptHandle {
    const acc = new ClaudeAccumulator();
    let reader: TailReader | null = null;
    let last = '';
    const pump = (): void => {
      if (!reader && spec.sessionId) {
        const file = this.claudeTranscriptPath(spec.cwd, spec.sessionId);
        if (file) reader = new TailReader(file);
      }
      if (!reader) return;
      for (const line of reader.readLines().lines) acc.addLine(line);
    };
    return {
      refresh: () => {
        pump();
        const t = acc.totals();
        const key = JSON.stringify(t);
        if (!t || key === last) return null;
        last = key;
        return t;
      },
      current: () => {
        pump();
        return acc.totals();
      },
      transcriptPath: () => reader?.file ?? null,
      dispose: () => undefined,
    };
  }

  /** Candidate rollout dirs for a start time: local and UTC calendar dates of start and now. */
  private codexDirs(start: Date): string[] {
    const dirs = new Set<string>();
    const add = (y: number, m: number, d: number) => dirs.add(path.join(this.codexHome, 'sessions', String(y), String(m).padStart(2, '0'), String(d).padStart(2, '0')));
    for (const t of [start, new Date()]) {
      add(t.getFullYear(), t.getMonth() + 1, t.getDate());
      add(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
    }
    return [...dirs];
  }

  private findRollout(spec: TrackSpec): string | null {
    const want = normalizeCwd(spec.cwd);
    let best: { file: string; at: number } | null = null;
    for (const dir of this.codexDirs(spec.startedAt)) {
      let names: string[];
      try {
        names = readdirSync(dir).filter((n) => n.startsWith('rollout-') && n.endsWith('.jsonl'));
      } catch {
        continue;
      }
      for (const name of names) {
        const file = path.join(dir, name);
        if (this.bound.has(file)) continue;
        try {
          if (statSync(file).mtimeMs < spec.startedAt.getTime() - 5000) continue;
          const first = readFileSync(file, 'utf8').split('\n', 1)[0] ?? '';
          const meta = JSON.parse(first) as { type?: string; payload?: { cwd?: string; timestamp?: string } };
          if (meta.type !== 'session_meta' || normalizeCwd(meta.payload?.cwd ?? '') !== want) continue;
          const at = Date.parse(meta.payload?.timestamp ?? '') || statSync(file).birthtimeMs;
          if (at < spec.startedAt.getTime() - 2000) continue;
          if (!best || at > best.at) best = { file, at };
        } catch {
          /* unreadable or half-written first line: try again next poll */
        }
      }
    }
    return best?.file ?? null;
  }

  private codex(spec: TrackSpec): TranscriptHandle {
    const acc = new CodexAccumulator();
    let reader: TailReader | null = null;
    let last = '';
    const pump = (): void => {
      if (!reader && Date.now() - spec.startedAt.getTime() < this.bindWindow) {
        const file = this.findRollout(spec);
        if (file) {
          this.bound.add(file);
          reader = new TailReader(file);
        }
      }
      if (!reader) return;
      const { lines, reset } = reader.readLines();
      if (reset) return;
      for (const line of lines) acc.addLine(line);
    };
    return {
      refresh: () => {
        pump();
        const t = acc.totals();
        const key = JSON.stringify(t);
        if (!t || key === last) return null;
        last = key;
        return t;
      },
      current: () => {
        pump();
        return acc.totals();
      },
      transcriptPath: () => reader?.file ?? null,
      rateLimits: () => acc.rateLimits,
      dispose: () => {
        if (reader) this.bound.delete(reader.file);
      },
    };
  }
}

// ---------------------------------------------------------------- usage summary

export interface RunRecord {
  id: string;
  runner: string;
  title: string;
  operation?: string;
  module?: string;
  subject?: string;
  startedAt: string;
  exitedAt?: string;
  exitCode?: number;
  status: string;
  transcript?: string;
  tokens?: TokenTotals;
  rateLimits?: PlanLimits;
}

export interface UsageRow {
  key: string;
  label: string;
  module?: string;
  runs: number;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  total: number;
  cacheHitRate: number;
  /** Cost reported by the CLI over OTel (usually absent). */
  costUsd: number;
  /** ESTIMATE from the price table. */
  estCostUsd: number;
  cacheSavingsUsd: number;
  /** Tokens of runs whose model has no price in wiki/operations/pricing.json: estCostUsd leaves them out. */
  unpricedTokens: number;
  /** Those models' ids ("unknown model" when the run recorded none), sorted. */
  unpricedModels: string[];
}

/** A run's tokens that the price table could not cost (no model, or a model with no price). */
export const isUnpriced = (t: TokenTotals): boolean => t.total > 0 && (t.unpriced === true || t.estCostUsd === undefined);

const localDay = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function rollup(runs: RunRecord[], keyOf: (r: RunRecord) => { key: string; label: string; module?: string }): UsageRow[] {
  const rows = new Map<string, UsageRow>();
  for (const r of runs) {
    const { key, label, module } = keyOf(r);
    let row = rows.get(key);
    if (!row) rows.set(key, (row = { key, label, ...(module ? { module } : {}), runs: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0, cacheHitRate: 0, costUsd: 0, estCostUsd: 0, cacheSavingsUsd: 0, unpricedTokens: 0, unpricedModels: [] }));
    row.runs += 1;
    const t = r.tokens;
    if (!t) continue;
    row.input += t.input;
    row.output += t.output;
    row.cacheRead += t.cacheRead;
    row.cacheWrite += t.cacheWrite;
    row.total += t.total;
    row.costUsd += t.costUsd ?? 0;
    row.estCostUsd += t.estCostUsd ?? 0;
    row.cacheSavingsUsd += t.cacheSavingsUsd ?? 0;
    if (isUnpriced(t)) {
      row.unpricedTokens += t.total;
      const id = t.model ?? 'unknown model';
      if (!row.unpricedModels.includes(id)) row.unpricedModels = [...row.unpricedModels, id].sort();
    }
  }
  for (const row of rows.values()) {
    const prompt = row.input + row.cacheRead + row.cacheWrite;
    row.cacheHitRate = prompt > 0 ? row.cacheRead / prompt : 0;
  }
  return [...rows.values()];
}

export interface UsageSummary {
  generatedAt: string;
  runs: number;
  today: UsageRow;
  all: UsageRow;
  byDay: UsageRow[];
  byRunner: UsageRow[];
  byOperation: UsageRow[];
  byModule: UsageRow[];
  /** The 10 most expensive runs (estimate; tokens when unpriced). */
  topRuns: { id: string; runner: string; title: string; module?: string; startedAt: string; total: number; estCostUsd: number }[];
}

/** Aggregates run records: by local day (newest first), by runner, and by module/operation (largest first). */
export function summarizeRuns(runs: RunRecord[], now = new Date()): UsageSummary {
  const today = localDay(now.toISOString());
  const todayRuns = runs.filter((r) => localDay(r.startedAt) === today);
  const one = (list: RunRecord[], key: string, label: string) => rollup(list, () => ({ key, label }))[0] ?? { key, label, runs: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0, cacheHitRate: 0, costUsd: 0, estCostUsd: 0, cacheSavingsUsd: 0, unpricedTokens: 0, unpricedModels: [] };
  return {
    generatedAt: now.toISOString(),
    runs: runs.length,
    today: one(todayRuns, today, 'Today'),
    all: one(runs, 'all', 'All time'),
    byDay: rollup(runs, (r) => ({ key: localDay(r.startedAt), label: localDay(r.startedAt) })).sort((a, b) => b.key.localeCompare(a.key)),
    byRunner: rollup(runs, (r) => ({ key: r.runner, label: r.runner })).sort((a, b) => b.total - a.total),
    byModule: rollup(runs, (r) => ({ key: r.module ?? '-', label: r.module ?? 'no module' })).sort((a, b) => b.estCostUsd - a.estCostUsd || b.total - a.total),
    topRuns: [...runs]
      .filter((r) => r.tokens)
      .sort((a, b) => (b.tokens?.estCostUsd ?? 0) - (a.tokens?.estCostUsd ?? 0) || (b.tokens?.total ?? 0) - (a.tokens?.total ?? 0))
      .slice(0, 10)
      .map((r) => ({ id: r.id, runner: r.runner, title: r.title, ...(r.module ? { module: r.module } : {}), startedAt: r.startedAt, total: r.tokens?.total ?? 0, estCostUsd: r.tokens?.estCostUsd ?? 0 })),
    byOperation: rollup(runs, (r) => {
      const label = r.operation ?? r.title;
      return { key: `${r.module ?? '-'}/${label}`, label, ...(r.module ? { module: r.module } : {}) };
    }).sort((a, b) => b.estCostUsd - a.estCostUsd || b.total - a.total),
  };
}

/** Run records from .state/runs/*\/run.json, with live in-memory terminals taking precedence. */
export function loadRunRecords(stateDir: string, live: TerminalInfo[]): RunRecord[] {
  const byId = new Map<string, RunRecord>();
  const runsDir = path.join(stateDir, 'runs');
  let names: string[] = [];
  try {
    names = readdirSync(runsDir);
  } catch {
    /* no runs yet */
  }
  for (const name of names) {
    try {
      const r = JSON.parse(readFileSync(path.join(runsDir, name, 'run.json'), 'utf8')) as RunRecord;
      if (r.id && r.startedAt) byId.set(r.id, r);
    } catch {
      /* skip unreadable records */
    }
  }
  for (const t of live) byId.set(t.id, { id: t.id, runner: t.runner, title: t.title, ...(t.operation ? { operation: t.operation } : {}), ...(t.module ? { module: t.module } : {}), ...(t.subject ? { subject: t.subject } : {}), startedAt: t.startedAt, ...(t.exitedAt ? { exitedAt: t.exitedAt } : {}), status: t.status, ...(t.tokens ? { tokens: t.tokens } : {}) });
  return [...byId.values()];
}
