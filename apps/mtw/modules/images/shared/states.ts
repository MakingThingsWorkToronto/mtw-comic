// Replaces stateLabels (retired git 51eb6e03:wiki/image-library/browser.js L21-31, L49): free-string status -> typed ReviewState.
import type { DecisionKind, ImageRecord, ReviewState, Treatment } from './types';

/** Map a treatment status string (not an enum in the manifest) to a badge state. */
export function stateOf(status: string | undefined): ReviewState {
  const s = (status ?? '').toLowerCase().trim();
  if (!s || s === 'missing') return 'missing';
  if (/user-approved/.test(s)) return 'approved';
  if (/reject/.test(s)) return 'rejected';
  if (s === 'review-evidence') return 'evidence';
  if (/nonselected|non-selected/.test(s)) return 'reference';
  if (/selected-reference/.test(s)) return 'selected';
  if (/historical|earlier|before-correction/.test(s)) return 'reference';
  if (/draft/.test(s)) return 'draft';
  if (/unreviewed|needs-review|^preview$|^retained$/.test(s)) return 'unreviewed';
  if (/spot-checked|reviewed|in-review/.test(s)) return 'reviewed';
  return 'unreviewed';
}

/** Record-level fields can override the treatment status (rejected, selected, user-approved). */
export function recordState(record: ImageRecord, treatment: Treatment | undefined): ReviewState {
  if (!treatment?.path) return 'missing';
  if (record.publicUse === 'rejected' || record.status === 'rejected') return 'rejected';
  if (record.userApproved === true) return 'approved';
  if (record.publicUse === 'selected') return 'selected';
  return stateOf(treatment.status);
}

export const STATE_LABEL: Record<ReviewState, string> = {
  reviewed: 'Reviewed',
  draft: 'Draft',
  unreviewed: 'Unreviewed',
  rejected: 'Rejected',
  selected: 'Selected',
  approved: 'Approved by Matt',
  reference: 'Reference',
  evidence: 'Evidence',
  missing: 'Missing',
};

/** Review is not approval: shown as a tooltip, never as page prose. */
export const STATE_HINT: Record<ReviewState, string> = {
  reviewed: "Author reviewed. This is not Matt's approval.",
  draft: 'Draft with a known issue.',
  unreviewed: 'No review recorded.',
  rejected: 'Rejected.',
  selected: 'Selected as a reference. Selection is not approval.',
  approved: 'Approved by Matt.',
  reference: 'Earlier or reference-only artwork.',
  evidence: 'Review evidence.',
  missing: 'No file for this style.',
};

export const DECISION_STATE: Record<DecisionKind, ReviewState> = { approved: 'approved', rejected: 'rejected', selected: 'selected' };
export const REVIEW_STATES = Object.keys(STATE_LABEL) as ReviewState[];
