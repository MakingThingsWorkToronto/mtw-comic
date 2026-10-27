// New. Effective human decisions from decisions.jsonl entries. The manifest is never edited: this overlay is shown as
// "Approved by Matt" separately from treatment status (the contract keeps review, selection and approval apart).
import { parseImgRef } from './refs';
import type { DecisionEntry, DecisionState } from './types';

/** Effective decision per record id: the latest approve/reject, else the latest select (unselect clears it). */
export function effectiveDecisions(entries: DecisionEntry[]): Map<string, DecisionState> {
  const approval = new Map<string, DecisionState>();
  const selection = new Map<string, DecisionState | null>();
  for (const d of [...entries].sort((a, b) => a.at.localeCompare(b.at))) {
    const ref = parseImgRef(d.subject);
    if (!ref) continue;
    const style = d.value?.style ?? ref.style;
    const base = {
      ...(ref.version !== 'current' ? { version: ref.version } : {}),
      ...(style ? { style } : {}),
      ...(d.value?.scope ? { scope: d.value.scope } : {}),
      ...(d.value?.reason ? { reason: d.value.reason } : {}),
      at: d.at,
    };
    if (d.action === 'approve') approval.set(ref.id, { kind: 'approved', ...base });
    else if (d.action === 'reject') approval.set(ref.id, { kind: 'rejected', ...base });
    else if (d.action === 'select') selection.set(ref.id, { kind: 'selected', ...base });
    else if (d.action === 'unselect') selection.set(ref.id, null);
  }
  const out = new Map<string, DecisionState>(approval);
  for (const [id, s] of selection) if (s && !out.has(id)) out.set(id, s);
  return out;
}
