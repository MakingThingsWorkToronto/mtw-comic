// Migrated from retired git 51eb6e03:wiki/soundtrack-library/comic-audio-console.js (labels, order, filter). Pure.
import type { ComicAudioRecord } from '../types';

export const TYPE_LABELS: Record<string, string> = {
  'speech-dialogue': 'Recorded dialogue',
  'speech-narration': 'Recorded narration',
  'review-evidence': 'Audio review evidence',
  'sound-effect-recording': 'Recorded sound effects',
  'speech-audition': 'Character auditions',
  'ambience-recording': 'Recorded ambience',
  'effect-recipe': 'Effect recipes',
  'ambient-recipe': 'Ambient fallback recipes',
  'provider-preview': 'Provider previews',
  'unsorted-recording': 'Not yet linked to a comic',
};
const ORDER: Record<string, number> = { 'ambience-recording': 0, 'speech-audition': 1, 'effect-recipe': 2, 'ambient-recipe': 3, 'provider-preview': 4, 'speech-dialogue': 1, 'speech-narration': 1, 'sound-effect-recording': 0, 'review-evidence': 5, 'unsorted-recording': 6 };

export interface ComicFilters {
  q: string;
  type: string;
  character: string;
  provider: string;
  /** '' (any), 'approved' or 'rejected'. */
  approval: string;
}

/** Every clip is approved unless Matt rejected it. */
export const approvalOf = (r: ComicAudioRecord): 'approved' | 'rejected' => (r.approval === 'rejected' ? 'rejected' : 'approved');

export function filterRecords(records: ComicAudioRecord[], f: ComicFilters): ComicAudioRecord[] {
  const q = f.q.trim().toLowerCase();
  return records.filter(
    (r) =>
      (!f.type || r.type === f.type) &&
      (!f.character || r.characterId === f.character || (r.characters || []).includes(f.character)) &&
      (!f.provider || r.provider === f.provider) &&
      (!f.approval || approvalOf(r) === f.approval) &&
      (!q || [r.title, r.description, r.character, r.provider, r.kind, r.room, r.text].join(' ').toLowerCase().includes(q)),
  );
}

export const sortRecords = (records: ComicAudioRecord[]): ComicAudioRecord[] =>
  records.slice().sort((a, b) => (ORDER[a.type] ?? 9) - (ORDER[b.type] ?? 9) || a.title.localeCompare(b.title));
