// Migrated from retired git 51eb6e03:wiki/soundtrack-library/index.html (filtered(), the filter row). Pure, so the tests can compare it with the legacy logic.
import type { Track } from '../types';

export type SortKey = 'bpm' | 'duration' | 'energy' | 'bright' | 'title' | 'published' | 'rating' | 'discovered';

export const SORTS: { value: SortKey; label: string }[] = [
  { value: 'bpm', label: 'BPM' },
  { value: 'duration', label: 'Length' },
  { value: 'energy', label: 'Loudness' },
  { value: 'bright', label: 'Brightness' },
  { value: 'title', label: 'Title' },
  { value: 'published', label: 'Newest' },
  { value: 'rating', label: 'Rating' },
  { value: 'discovered', label: 'Discovery order' },
];

export interface Filters {
  q: string;
  genre: string;
  feel: string;
  bmin: string;
  bmax: string;
  status: string;
  rating: string;
  found: string;
  sort: SortKey;
}

export const DEFAULT_FILTERS: Filters = { q: '', genre: '', feel: '', bmin: '', bmax: '', status: '', rating: '', found: '', sort: 'bpm' };

const FILTER_KEYS = Object.keys(DEFAULT_FILTERS) as (keyof Filters)[];

export function filtersFromQuery(query: URLSearchParams): Filters {
  const f: Filters = { ...DEFAULT_FILTERS };
  for (const key of FILTER_KEYS) {
    const v = query.get(key);
    if (v !== null) (f as unknown as Record<string, string>)[key] = v;
  }
  if (!SORTS.some((s) => s.value === f.sort)) f.sort = 'bpm';
  return f;
}

/** Query-string patch for a filter change: defaults are removed from the URL. */
export function queryPatch(key: keyof Filters, value: string): Record<string, string | undefined> {
  return { [key]: value === DEFAULT_FILTERS[key] ? undefined : value };
}

export function filterTracks(tracks: Track[], f: Filters): Track[] {
  const q = f.q.toLowerCase();
  const lo = +f.bmin || 0;
  const hi = +f.bmax || 999;
  const out = tracks.filter((t) => {
    const bpm = t.beatMap ? t.beatMap.bpm : 0;
    return (
      (!q || `${t.title} ${t.artist} ${t.genre || ''}`.toLowerCase().indexOf(q) > -1) &&
      (!f.genre || t.genre === f.genre) &&
      (!f.feel || (t.summary && t.summary.feel === f.feel)) &&
      (!f.status || t.status === f.status) &&
      (!bpm || (bpm >= lo && bpm <= hi)) &&
      (f.rating === '' || (f.rating === '0' ? !t.rating : (t.rating || 0) >= +f.rating)) &&
      (!f.found || (t.discovery && t.discovery.run === f.found))
    );
  });
  const val = (t: Track): number | string => {
    switch (f.sort) {
      case 'duration':
        return t.beatMap ? t.beatMap.duration : 0;
      case 'energy':
        return t.summary ? t.summary.rmsDbfs : -99;
      case 'bright':
        return t.summary ? t.summary.brightnessHz : 0;
      case 'title':
        return t.title.toLowerCase();
      case 'published':
        return t.published || '';
      case 'rating':
        return t.rating || 0;
      case 'discovered':
        return t.discovery ? `${t.discovery.run}#${1000 + t.discovery.rank}` : '~';
      default:
        return t.beatMap ? t.beatMap.bpm : 0;
    }
  };
  const textual = f.sort === 'title' || f.sort === 'discovered';
  const descending = f.sort === 'published' || f.sort === 'energy' || f.sort === 'bright' || f.sort === 'rating';
  return out.sort((a, b) => {
    const x = val(a);
    const y = val(b);
    if (textual) return x < y ? -1 : x > y ? 1 : 0;
    if (descending) return x < y ? 1 : x > y ? -1 : 0;
    return (x as number) - (y as number);
  });
}

export const GENRES = (tracks: Track[]): string[] => Array.from(new Set(tracks.map((t) => t.genre).filter((g): g is string => !!g))).sort();

export const RATING_OPTIONS = [
  { value: '', label: 'Any rating' },
  { value: '0', label: 'Not rated' },
  { value: '5', label: '5 stars' },
  { value: '4', label: '4 stars and up' },
  { value: '3', label: '3 stars and up' },
];

export const STATUS_OPTIONS = [
  { value: '', label: 'Any status' },
  { value: 'approved', label: 'Approved' },
  { value: 'candidate', label: 'Candidates' },
  { value: 'needs source', label: 'Needs source' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

export const FEEL_OPTIONS = [
  { value: '', label: 'Any feel' },
  { value: 'straight', label: 'Straight' },
  { value: 'triplet', label: 'Triplet' },
  { value: 'sixteenth', label: 'Sixteenth' },
];
