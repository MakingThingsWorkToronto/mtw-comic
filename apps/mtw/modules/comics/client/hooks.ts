import { useEffect, useState } from 'preact/hooks';
import { api } from '../../../web/api';
import { useLiveResource } from '../../../web/state';
import { parseTokens } from './flow';
import type { TokensSpent } from './flow';

export interface Loaded<T> {
  data: T | null;
  error: string;
  reload: () => Promise<void>;
  /** True when the files moved on disk while `hold` was set (an unsaved edit is open). */
  changed: boolean;
}

/** GET a JSON view and keep it fresh from the comics manifest; with `hold` set it keeps the data and flags `changed`. */
export function useView<T>(url: string, hold = false): Loaded<T> {
  const live = useLiveResource<T>(url, { module: 'comics', isDirty: hold });
  return { data: live.data ?? null, error: live.data === undefined ? live.error : '', reload: live.reload, changed: live.changed };
}

export const post = <T,>(url: string, body: unknown): Promise<T> => api.post<T>(url, body);

export const secs = (s: number): string => (s >= 60 ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}` : `${Math.round(s * 10) / 10} s`);

/**
 * Tokens spent on a subject through GET /api/tokens/by?module=&subject= (core). Null while loading or when the route is
 * not available, so the caller simply shows nothing.
 */
export function useTokensSpent(module: string, subject: string): TokensSpent | null {
  const [spent, setSpent] = useState<TokensSpent | null>(null);
  useEffect(() => {
    let live = true;
    api.get<unknown>(`/api/tokens/by?module=${encodeURIComponent(module)}&subject=${encodeURIComponent(subject)}`).then(
      (j) => live && setSpent(parseTokens(j)),
      () => live && setSpent(null),
    );
    return () => {
      live = false;
    };
  }, [module, subject]);
  return spent;
}
