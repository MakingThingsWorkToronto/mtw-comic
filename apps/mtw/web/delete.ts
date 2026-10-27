// Delete buttons (Matt, 2026-10-11): every item view can start the shared `operations-delete-item` procedure in an
// Operations terminal. The run is found again in the live `terminals` signal by operation + subject, so the item's
// panel stays disabled while it runs and disappears when the item is gone from its module's data. Pure logic only;
// the hook and controls are in web/ui/DeleteControl.tsx.
import type { TerminalInfo } from '../modules/types';

/** The one shared procedure (wiki/operations/prompts/operations-delete-item.md). Its body never varies per item. */
export const DELETE_OPERATION = 'operations-delete-item';

export type DeleteKind = 'image' | 'track' | 'journal' | 'comic' | 'comic-page' | 'comic-box';

/** Studio module whose wiki-changed events mean the item's data may have changed. */
export const DELETE_MODULE: Record<DeleteKind, string> = {
  image: 'images',
  track: 'soundtrack',
  journal: 'journal',
  comic: 'comics',
  'comic-page': 'comics',
  'comic-box': 'comics',
};

export const deleteSubject = {
  /** One version of one style: `delete:img:<record>#<style>@<version>` (version: v<N> or an 8-char sha256 prefix). */
  image: (record: string, version: string, style?: string): string => `delete:img:${record}${style ? `#${style}` : ''}@${version}`,
  track: (id: string): string => `delete:snd:${id}`,
  journal: (slug: string): string => `delete:journal:${slug}`,
  comic: (issue: string): string => `delete:comic:${issue}`,
  page: (issue: string, scene: string): string => `delete:comic-page:${issue}/${scene}`,
  /** `number` is 1-based in reading order; `fingerprint` tells a box apart from the one that moves into its place. */
  box: (issue: string, scene: string, number: number, fingerprint: string): string => `delete:comic-box:${issue}/${scene}/${number}@${fingerprint}`,
};

/** Short stable hash (FNV-1a, base 36) for box fingerprints. */
export function shortHash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

/** A comic box's identity independent of its index: its crop region and balloon ids. */
export function boxFingerprint(panel: { crop: readonly number[] | null; balloons: readonly { id: string }[] }): string {
  return shortHash(`${panel.crop ? panel.crop.join(',') : 'full'}|${panel.balloons.map((b) => b.id).join(',')}`);
}

/** The latest delete run for this subject, if any. */
export function deleteRunFor(list: readonly TerminalInfo[], subject: string): TerminalInfo | undefined {
  let best: TerminalInfo | undefined;
  for (const t of list) {
    if (t.operation !== DELETE_OPERATION || t.subject !== subject) continue;
    if (!best || t.startedAt >= best.startedAt) best = t;
  }
  return best;
}

export type DeletePhase =
  /** Item gone from the module's data: render nothing. */
  | 'gone'
  /** No run, or the last run's failure was dismissed. */
  | 'idle'
  /** A run is going: panel disabled, "Deleting…" badge links to the terminal. */
  | 'deleting'
  /** The run exited and the module's data is being refetched: still disabled. */
  | 'checking'
  /** The run exited and the item is still there: re-enabled, with a "did not complete" note. */
  | 'failed';

export interface DeleteInput {
  run: TerminalInfo | undefined;
  /** Whether the item is still in the module's data. */
  present: boolean;
  /** The run id whose exit has been followed by a refetch. */
  checkedRunId?: string | undefined;
  /** The run id whose failure note Matt dismissed. */
  dismissedRunId?: string | undefined;
}

export function deletePhase({ run, present, checkedRunId, dismissedRunId }: DeleteInput): DeletePhase {
  if (!present) return 'gone';
  if (!run) return 'idle';
  if (run.status === 'running') return 'deleting';
  if (run.id === dismissedRunId) return 'idle';
  if (run.id !== checkedRunId) return 'checking';
  return 'failed';
}

/** Whether the panel's controls are disabled in this phase. */
export const deleteBusy = (phase: DeletePhase): boolean => phase === 'deleting' || phase === 'checking';

/** Launch parameters for the shared procedure: only this "This run" data varies between deletes. */
export function deleteParams(kind: DeleteKind, subject: string, target: string, paths: readonly string[] = []): Record<string, string> {
  const files = paths.filter(Boolean);
  return { kind, target, subject, ...(files.length ? { paths: files.join(', ') } : {}) };
}
