import { useEffect, useRef } from 'preact/hooks';
import { api } from '../../../web/api';
import { useLiveResource } from '../../../web/state';
import type { ScheduleView } from '../lib/scheduler';
import { stepsOf } from '../shared';
import type { Schedule } from '../lib/store';

export interface ListResponse {
  owner: { mine: boolean; pid: number | null };
  now: string;
  schedules: ScheduleView[];
}

export const sget = <T,>(p: string): Promise<T> => api.get<T>(`/api/schedules${p}`);
export const spost = <T,>(p: string, body: unknown): Promise<T> => api.post<T>(`/api/schedules${p}`, body);

export const opsOf = (s: Schedule): string[] => stepsOf(s).map((x) => x.operation);

const WHEN = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export const fmtWhen = (iso: string): string => WHEN.format(new Date(iso));

/** Fetch and keep fresh: live on file changes and polled while visible. `hold()` stops reloads over an unsaved form. */
export function useRemote<T>(path: string, opts: { hold?: () => boolean; pollMs?: number } = {}) {
  const live = useLiveResource<T>(`/api/schedules${path}`, { module: 'schedules', ...(opts.hold ? { isDirty: opts.hold } : {}) });
  const holdRef = useRef(opts.hold);
  holdRef.current = opts.hold;
  useEffect(() => {
    if (!opts.pollMs) return;
    const t = setInterval(() => {
      if (!holdRef.current?.()) void live.reload();
    }, opts.pollMs);
    return () => clearInterval(t);
  }, [opts.pollMs, path]);
  return { data: live.data ?? null, error: live.error, reload: () => void live.reload(), changed: live.changed, live };
}
