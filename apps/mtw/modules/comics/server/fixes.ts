// Box issue presets, read from wiki/operations/templates/comics-box-fixes.md (nothing hard-coded here).
import { parseFrontmatter } from '../../../server/core/prompts';

export const FIX_SCOPES = ['art', 'speech', 'sound', 'motion', 'appearance', 'voice'] as const;
export type FixScope = (typeof FIX_SCOPES)[number];
export interface FixPreset {
  id: string;
  label: string;
  instruction: string;
  /** What the preset changes; missing or unknown means art (the presets predate scopes). */
  scope: FixScope;
}

export const FIX_TEMPLATE = 'wiki/operations/templates/comics-box-fixes.md';
export const CHARACTER_FIX_TEMPLATE = 'wiki/operations/templates/comics-character-fixes.md';

/** Pure: the `presets` list of the template's frontmatter. Entries missing an id, label or instruction are dropped; ids stay unique. */
export function parseFixPresets(text: string): FixPreset[] {
  let data: Record<string, unknown>;
  try {
    data = parseFrontmatter(text).data;
  } catch {
    return [];
  }
  const list = Array.isArray(data.presets) ? data.presets : [];
  const seen = new Set<string>();
  const out: FixPreset[] = [];
  for (const raw of list) {
    if (!raw || typeof raw !== 'object') continue;
    const o = raw as Record<string, unknown>;
    const id = typeof o.id === 'string' ? o.id.trim() : '';
    const label = typeof o.label === 'string' ? o.label.trim() : '';
    const instruction = typeof o.instruction === 'string' ? o.instruction.trim() : '';
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id) || !label || !instruction || seen.has(id)) continue;
    seen.add(id);
    const scope = (FIX_SCOPES as readonly unknown[]).includes(o.scope) ? (o.scope as FixScope) : 'art';
    out.push({ id, label, instruction, scope });
  }
  return out;
}
