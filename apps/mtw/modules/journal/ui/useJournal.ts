import { api } from '../../../web/api';
import { useLiveResource } from '../../../web/state';
import type { DecisionRec, JournalState, QueueViewRow } from '../shared';

export interface Overview {
  state: JournalState;
  decisions: DecisionRec[];
  proposals: { file: string | null; skipped: string[] };
  queue: QueueViewRow[];
}

export const jget = <T,>(path: string): Promise<T> => api.get<T>(`/api/journal${path}`);
export const jpost = <T,>(path: string, body: unknown): Promise<T> => api.post<T>(`/api/journal${path}`, body);

/** Live overview. While `hold()` is true (typed answers) a file change sets `changed` instead of reloading. */
export function useOverview(hold?: () => boolean) {
  const live = useLiveResource<Overview>('/api/journal/overview', { module: 'journal', ...(hold ? { isDirty: hold } : {}) });
  return { data: live.data ?? null, error: live.error, live, reload: () => void live.reload() };
}
