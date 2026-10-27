// New module (no wiki origin): client helpers.
import { useEffect, useRef } from 'preact/hooks';
import type { BadgeStatus } from '../../../web/ui';
import { api } from '../../../web/api';
import { useLiveResource } from '../../../web/state';
import type { NodeRun, RunState } from '../lib/engine';
import type { Workflow } from '../lib/schema';

export const wget = <T,>(p: string): Promise<T> => api.get<T>(`/api/workflows${p}`);
export const wpost = <T,>(p: string, body: unknown = {}): Promise<T> => api.post<T>(`/api/workflows${p}`, body);

export interface RunSummary {
  runId: string;
  workflowId: string;
  title: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  done: number;
  total: number;
  tokens: number;
  estCostUsd: number;
}
export interface ListRow {
  id: string;
  title: string;
  /** Absent from a server started before the domain field. '' means Other. */
  domain?: string;
  description: string;
  nodes: number;
  gates: number;
  hasDiagram: boolean;
  needsInput: boolean;
  problems: string[];
  last: RunSummary | null;
  active: boolean;
}
export interface TourData {
  title: string;
  steps: { title: string; paragraphs: string[] }[];
}
export interface DetailData {
  id: string;
  workflow: Workflow | null;
  problems: string[];
  svg?: string;
  tour?: TourData;
  runs: RunSummary[];
}
/**
 * The steps of a workflow that start an LLM agent: operation steps whose provider is not the plain shell.
 * Schedule, human-gate and script (shell) steps launch no agent, so the run confirm skips them.
 */
export function llmSteps(workflow: Workflow | null | undefined, ops: { id: string; runner: string }[]): { key: string; operation: string; label: string; runner?: string }[] {
  const out: { key: string; operation: string; label: string; runner?: string }[] = [];
  for (const n of workflow?.nodes ?? []) {
    if (n.kind !== 'operation' || !n.operation) continue;
    const op = ops.find((o) => o.id === n.operation);
    if ((n.runner ?? op?.runner) === 'shell') continue;
    out.push({ key: n.id, operation: n.operation, label: n.label, ...(n.runner ? { runner: n.runner } : {}) });
  }
  return out;
}
export interface RunData {
  run: RunState;
  summary: RunSummary;
}

const WHEN = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export const fmtWhen = (iso: string): string => WHEN.format(new Date(iso));
export const fmtTokens = (n: number): string => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));
export const fmtUsd = (n: number): string => `$${n.toFixed(n < 1 ? 3 : 2)}`;

export function nodeBadge(status: NodeRun['status'] | string): BadgeStatus {
  switch (status) {
    case 'running':
      return 'running';
    case 'waiting':
      return 'candidate';
    case 'done':
    case 'succeeded':
      return 'approved';
    case 'failed':
    case 'cancelled':
      return 'rejected';
    default:
      return 'pending';
  }
}

/** Fetch and keep fresh: live on file changes and polled while visible. */
export function useRemote<T>(path: string, opts: { pollMs?: number; enabled?: boolean } = {}) {
  const live = useLiveResource<T>(`/api/workflows${path}`, { module: 'workflows', ...(opts.enabled === false ? { enabled: false } : {}) });
  const ref = useRef(live.reload);
  ref.current = live.reload;
  useEffect(() => {
    if (!opts.pollMs || opts.enabled === false) return;
    const t = setInterval(() => {
      if (!document.hidden) void ref.current();
    }, opts.pollMs);
    return () => clearInterval(t);
  }, [opts.pollMs, path, opts.enabled]);
  return { data: live.data ?? null, error: live.error, reload: () => void live.reload() };
}
