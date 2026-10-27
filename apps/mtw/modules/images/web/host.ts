// New. The views talk to a Host, never to the shell router or fetch directly, so the same Preact views run in the app
// (server data, shell router) and in the static snapshot (window.MTW_LIBRARY, hash routing, file:// safe).
import { createContext } from 'preact';
import type { ComponentType } from 'preact';
import { useContext } from 'preact/hooks';
import type { Card, CardQuery, DecisionEntry, EvidenceItem, Facets, RecordDetail } from '../shared/types';
import type { PlanItem } from '../server/register';
import type { SweepReport } from '../server/sweep';
import type { RemovePlan, RemoveRequest, RemoveResult } from '../server/remove';

export type { PlanItem, RemovePlan, RemoveRequest, RemoveResult, SweepReport };

export interface PlanPreview {
  ok: boolean;
  items: PlanItem[];
  errors: string[];
  blockedBy: string[];
  records: number;
}

export interface DecideInput {
  id: string;
  action: 'approve' | 'reject' | 'select' | 'unselect' | 'note';
  version?: string;
  style?: string;
  scope?: 'public-site' | 'reference' | 'cover';
  reason?: string;
}

export interface ImagesData {
  facets(collection: string, category?: string): Promise<Facets>;
  records(q: CardQuery): Promise<{ total: number; items: Card[] }>;
  record(id: string): Promise<RecordDetail | null>;
  evidence(q: { q?: string; group?: string; offset?: number; limit?: number }): Promise<{ total: number; items: EvidenceItem[]; groups: { value: string; count: number }[] }>;
  /** Thumbnail URL for a file. */
  thumb(file: { sha: string; path: string }, w?: 320 | 640): string;
  /** Original file URL. */
  file(path: string): string;
  /** App only. */
  decide?(input: DecideInput): Promise<DecisionEntry>;
  sweep?(opts?: { files?: boolean; hash?: boolean; deep?: boolean }): Promise<SweepReport>;
  planRegister?(paths: string[]): Promise<PlanPreview>;
  reveal?(path: string): Promise<void>;
  /** App only: what Remove would archive and keep (read-only). */
  planRemove?(req: RemoveRequest): Promise<RemovePlan>;
  /** App only: archive, verify, delete and drop from the catalog. Called after Matt confirms. */
  remove?(req: RemoveRequest & { etag?: string }): Promise<RemoveResult>;
}

export type ImagesView = 'library' | 'evidence' | 'sweep' | 'record';

export interface Host {
  mode: 'app' | 'snapshot';
  data: ImagesData;
  view: ImagesView;
  id?: string;
  query: URLSearchParams;
  href(view: ImagesView, id?: string, query?: Record<string, string | undefined>): string;
  go(href: string, opts?: { replace?: boolean }): void;
  /** Merge into the current query string without adding a history entry. */
  setQuery(patch: Record<string, string | undefined>): void;
  /** Bumps whenever the library changed on disk; views show "changed on disk, reload?" instead of refetching. */
  changeToken: number;
  /** Picker mode: choosing an image returns its `img:` ref. */
  pick?: (ref: string) => void;
  /** App only: launch a procedure in a visible terminal. */
  launchOperation?: (id: string, params: Record<string, string>, args?: [runner: string, permission: string, choice: { model?: string; effort?: string }]) => Promise<void>;
  /** App only: the provider / model / effort / permission confirm control; reports its choice through onChoice. */
  LaunchPicker?: ComponentType<{ operation: string; onChoice: (args: [string, string, { model?: string; effort?: string }] | null) => void }>;
}

export const HostContext = createContext<Host | null>(null);

export function useHost(): Host {
  const host = useContext(HostContext);
  if (!host) throw new Error('Images view rendered without a host');
  return host;
}
