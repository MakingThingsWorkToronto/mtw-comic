import type { AssetSummary, Decision, OperationDef, TerminalInfo } from '../modules/types';

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    ...(body !== undefined ? { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {}),
  });
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!res.ok) throw new Error(data?.error ?? `${res.status} ${res.statusText}`);
  return data as T;
}

export interface RunnerOption {
  id: string;
  label: string;
  status: 'proven' | 'untested';
  tokenSource: string;
  note?: string;
  permissions: { id: string; label: string }[];
  /** Model and effort choices for Operations > Defaults; empty when the CLI takes no such flag. */
  models?: { id: string; label: string }[];
  efforts?: string[];
}

/** config/studio.json (Operations > Defaults). */
export interface StudioSettings {
  about?: string;
  defaultRunner: string;
  runners: Record<string, { model: string; effort: string }>;
}

export const api = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body?: unknown) => request<T>('POST', url, body ?? {}),
  terminals: () => request<TerminalInfo[]>('GET', '/api/terminals'),
  spawnTerminal: (runner: string, title?: string, choice?: { permission?: string; model?: string; effort?: string }) => request<TerminalInfo>('POST', '/api/terminals', { runner, title, ...choice }),
  killTerminal: (id: string) => request<{ ok: true }>('POST', `/api/terminals/${encodeURIComponent(id)}/kill`, {}),
  operations: (module?: string) => request<OperationDef[]>('GET', `/api/operations${module ? `?module=${encodeURIComponent(module)}` : ''}`),
  runners: () => request<RunnerOption[]>('GET', '/api/operations/runners'),
  settings: () => request<StudioSettings>('GET', '/api/operations/settings'),
  saveSettings: (next: StudioSettings) => request<StudioSettings>('POST', '/api/operations/settings', next),
  launch: (id: string, params: Record<string, string>, runner?: string, permission?: string, choice?: { model?: string; effort?: string }) =>
    request<TerminalInfo>('POST', `/api/operations/${encodeURIComponent(id)}/launch`, { params, runner, permission, model: choice?.model, effort: choice?.effort }),
  resolveAsset: (ref: string) => request<AssetSummary>('GET', `/api/assets/resolve?ref=${encodeURIComponent(ref)}`),
  decisions: (lib: string) => request<Decision[]>('GET', `/api/decisions/${encodeURIComponent(lib)}`),
};
