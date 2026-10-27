import { computed, signal } from '@preact/signals';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import type { TerminalInfo } from '../modules/types';
import { api } from './api';

export const terminals = signal<TerminalInfo[]>([]);
export const runningCount = computed(() => terminals.value.filter((t) => t.status === 'running').length);

/** Bumped on every wiki-changed event. Prefer the hooks below; this is the raw signal. */
export const wikiChanged = signal<{ module: string; paths: string[]; n: number }>({ module: '', paths: [], n: 0 });

// ---------------------------------------------------------------------------------------------------------------
// LIVE RELOAD (Matt, 2026-10-09: "the UI shall reload automatically when files update")
//
// The server watches every registered module's meta.manifest paths, debounces, ignores the app's own writes and
// emits SSE `wiki-changed {module, paths}`. Vite HMR already covers app code. Modules adopt the hooks like this:
//
//   // 1. A list/detail that is only displayed (no edits): refetch quietly when its files change.
//   const live = useLiveResource<Track[]>('/api/soundtrack/tracks', { module: 'soundtrack' });
//   live.data, live.error, live.loading
//
//   // 2. A view with unsaved edits: pass isDirty. On a change it does NOT refetch; it sets live.changed so the view
//   //    can render <ChangedBar live={live} /> ("Changed on disk - Reload"). Reload applies the new data.
//   const live = useLiveResource<Cast>(`/api/comics/cast/${id}`, { module: 'comics', paths: [`wiki/comics-library/cast/${id}.json`], isDirty: () => form.dirty });
//
//   // 3. Anything else (own fetch logic): react to matching events.
//   useWikiChanged('journal', () => reload());                       // a module id
//   useWikiChanged(['wiki/journal/queue.json', 'wiki/journal/*.md'], () => reload());   // repo-relative paths/globs
//
// A target without "/" is a module id; with "/" it is a path (a trailing /* or ** glob is allowed). '*' matches all.
// After an SSE reconnect a synthetic {module: '*'} event fires so no change is missed while disconnected.
// ---------------------------------------------------------------------------------------------------------------

export interface WikiChange {
  module: string;
  paths: string[];
}
type Listener = (change: WikiChange) => void;
const listeners = new Set<Listener>();

/** Subscribe outside a component. Returns the unsubscribe function. */
export function onWikiChanged(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function globToRegExp(glob: string): RegExp {
  const src = glob
    .replace(/\\/g, '/')
    .replace(/[.+^${}()|[\]]/g, '\\$&')
    .replace(/\/\*\*$/, '/\u0001')
    .replace(/\*\*\/?/g, '\u0000')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]')
    .replace(/\u0000/g, '(?:.*/)?')
    .replace(/\u0001/g, '.*');
  return new RegExp(`^${src}$`);
}

/** Whether a change touches a target: module id(s) or repo-relative path/glob(s). Exported for tests. */
export function matchesChange(target: string | string[] | undefined, change: WikiChange): boolean {
  if (change.module === '*') return true;
  if (target === undefined) return true;
  const list = Array.isArray(target) ? target : [target];
  return list.some((t) => {
    if (t === '*') return true;
    if (!t.includes('/')) return t === change.module;
    const re = globToRegExp(t);
    return change.paths.some((p) => re.test(p.replace(/\\/g, '/')));
  });
}

/** Run `callback` when a wiki-changed event matches `target` (module id, path/glob, or a list of them). */
export function useWikiChanged(target: string | string[] | undefined, callback: (change: WikiChange) => void): void {
  const cb = useRef(callback);
  cb.current = callback;
  const key = Array.isArray(target) ? target.join('\n') : target;
  useEffect(() => {
    const t = key === undefined ? undefined : key.split('\n');
    return onWikiChanged((change) => {
      if (matchesChange(t, change)) cb.current(change);
    });
  }, [key]);
}

export interface LiveResourceOptions {
  /** Module id whose changes refetch this resource. */
  module?: string;
  /** Narrower: refetch only when one of these repo-relative paths/globs changed. Wins over `module`. */
  paths?: string[];
  /** True (or a function returning true) while the view holds unsaved edits: changes then set `changed` instead of refetching. */
  isDirty?: boolean | (() => boolean);
  /** Skip fetching (e.g. while an id is missing). */
  enabled?: boolean;
}
export interface LiveResource<T> {
  data: T | undefined;
  error: string;
  loading: boolean;
  /** The files changed on disk while the view was dirty; show <ChangedBar>. */
  changed: boolean;
  /** Refetch now and clear `changed`. */
  reload: () => Promise<void>;
}

/** GET `url` as JSON and keep it fresh: see the usage notes above. */
export function useLiveResource<T>(url: string, opts: LiveResourceOptions = {}): LiveResource<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [changed, setChanged] = useState(false);
  const seq = useRef(0);
  const dirtyRef = useRef(opts.isDirty);
  dirtyRef.current = opts.isDirty;
  const enabled = opts.enabled !== false;

  const reload = useCallback(async () => {
    const mine = ++seq.current;
    try {
      const next = await api.get<T>(url);
      if (mine !== seq.current) return; // a newer request superseded this one
      setData(next);
      setError('');
      setChanged(false);
    } catch (e) {
      if (mine === seq.current) setError((e as Error).message);
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    void reload();
  }, [reload, enabled]);

  const target = opts.paths ?? opts.module;
  useWikiChanged(target, () => {
    if (!enabled) return;
    const dirty = typeof dirtyRef.current === 'function' ? dirtyRef.current() : dirtyRef.current === true;
    if (dirty) setChanged(true);
    else void reload();
  });

  return { data, error, loading, changed, reload };
}

// ---------------------------------------------------------------------------------------------------------------
// TOKENS (header counter and Operations > Usage)

export interface UsageRowDto {
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
  costUsd: number;
  /** ESTIMATE (API-equivalent, placeholder price table). */
  estCostUsd: number;
  cacheSavingsUsd: number;
}
export interface UsageSummaryDto {
  generatedAt: string;
  runs: number;
  today: UsageRowDto;
  all: UsageRowDto;
  byDay: UsageRowDto[];
  byRunner: UsageRowDto[];
  byOperation: UsageRowDto[];
  byModule: UsageRowDto[];
  topRuns: { id: string; runner: string; title: string; module?: string; startedAt: string; total: number; estCostUsd: number }[];
  budgets: { scope: string; key?: string; limitUsd?: number; limitTokens?: number; usedUsd: number; usedTokens: number; fraction: number }[];
  pricing: { asOf?: string; source?: string };
}
export const usageSummary = signal<UsageSummaryDto | null>(null);
export const tokensToday = computed(() => usageSummary.value?.today.total ?? 0);
export const estCostToday = computed(() => usageSummary.value?.today.estCostUsd ?? 0);
/** Budgets at or past 80% of their monthly limit (shown as a muted badge in the header). */
export const budgetWarnings = computed(() => (usageSummary.value?.budgets ?? []).filter((b) => b.fraction >= 0.8));

let summaryTimer: number | undefined;
/** Debounced: many terminal updates arrive in a burst. */
export function refreshUsageSummary(delayMs = 1500): void {
  window.clearTimeout(summaryTimer);
  summaryTimer = window.setTimeout(() => {
    api.get<UsageSummaryDto>('/api/tokens/summary').then((s) => (usageSummary.value = s), () => undefined);
  }, delayMs);
}

let source: EventSource | null = null;

/** One SSE connection for the whole app; the browser reconnects it on its own. */
export function connectEvents(): void {
  if (source || typeof EventSource === 'undefined') return;
  source = new EventSource('/api/events');
  let opened = false;
  source.addEventListener('open', () => {
    if (opened) for (const fn of [...listeners]) fn({ module: '*', paths: [] });
    opened = true;
    refreshUsageSummary(0);
  });
  source.addEventListener('terminal', (e) => {
    terminals.value = JSON.parse((e as MessageEvent<string>).data) as TerminalInfo[];
    refreshUsageSummary();
  });
  source.addEventListener('wiki-changed', (e) => {
    const d = JSON.parse((e as MessageEvent<string>).data) as WikiChange;
    wikiChanged.value = { ...d, n: wikiChanged.value.n + 1 };
    for (const fn of [...listeners]) fn(d);
  });
}
