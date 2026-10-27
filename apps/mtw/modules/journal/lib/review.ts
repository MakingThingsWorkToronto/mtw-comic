// Review chat for one Journal candidate or entry: the shared agent chat bound to wiki/operations/prompts/journal-review.md.
// Presets come from wiki/operations/templates/journal-review-fixes.md (nothing hard-coded here). Each launch puts only the
// item's short description under "This run", so the procedure body stays a stable, cacheable prefix; follow-ups go into
// the same live session.
import { parseFrontmatter } from '../../../server/core/prompts';

export const REVIEW_OPERATION = 'journal-review';
export const REVIEW_TEMPLATE = 'wiki/operations/templates/journal-review-fixes.md';
export const REVIEW_SCOPES = ['candidate', 'interview', 'draft', 'assets', 'decision'] as const;
export const REVIEW_RUNNERS = ['claude', 'codex'];

export interface ReviewPreset {
  id: string;
  label: string;
  instruction: string;
  scope: (typeof REVIEW_SCOPES)[number];
}

/** Pure: the template's `presets`. Entries missing an id, label or instruction are dropped; ids stay unique; unknown scope reads candidate. */
export function parseReviewPresets(text: string): ReviewPreset[] {
  let data: Record<string, unknown>;
  try {
    data = parseFrontmatter(text).data;
  } catch {
    return [];
  }
  const seen = new Set<string>();
  const out: ReviewPreset[] = [];
  for (const raw of Array.isArray(data.presets) ? data.presets : []) {
    if (!raw || typeof raw !== 'object') continue;
    const o = raw as Record<string, unknown>;
    const id = typeof o.id === 'string' ? o.id.trim() : '';
    const label = typeof o.label === 'string' ? o.label.trim() : '';
    const instruction = typeof o.instruction === 'string' ? o.instruction.trim() : '';
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id) || !label || !instruction || seen.has(id)) continue;
    seen.add(id);
    const scope = (REVIEW_SCOPES as readonly unknown[]).includes(o.scope) ? (o.scope as ReviewPreset['scope']) : 'candidate';
    out.push({ id, label, instruction, scope });
  }
  return out;
}

/** `entry:<slug>` or `concept:<n>`; anything else is refused. */
export function parseReviewSubject(subject: string): { kind: 'entry'; slug: string } | { kind: 'concept'; number: number } | null {
  const e = /^entry:([a-z0-9][a-z0-9-]*)$/.exec(subject);
  if (e) return { kind: 'entry', slug: e[1] as string };
  const c = /^concept:(\d{1,3})$/.exec(subject);
  return c ? { kind: 'concept', number: Number(c[1]) } : null;
}
