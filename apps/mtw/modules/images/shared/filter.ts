// Migrated from retired git 51eb6e03:wiki/image-library/browser.js L66 (newest-first order), L67-86 (facets) and L153-164 (search + filters).
// Pure: used by the server catalog and by the static snapshot bundle, so both return identical ids.
import { recordState } from './states';
import type { Card, CardQuery, DecisionState, Facet, Facets, ImageRecord, Manifest, ReviewState } from './types';

export interface IndexEntry {
  id: string;
  /** Position in manifest order; newest-registered has the highest value. */
  pos: number;
  collection: string;
  category: string;
  service: string;
  title: string;
  /** Lowercased search text, precomputed (browser.js L158). */
  hay: string;
  /** Treatment keys that exist, in manifest order (a key may exist without a file). */
  keys: string[];
  /** Keys whose treatment has a file. */
  paths: Record<string, true>;
  states: Record<string, ReviewState>;
  primary: string;
}

/** Diagrams show Site Glass when present, else SVG Flat; every other record shows its first style with a file. */
export function primaryStyle(record: ImageRecord): string {
  const t = record.treatments;
  const keys = Object.keys(t);
  const order = record.collection === 'diagrams' ? ['svg-glass', 'svg-flat'] : record.collection === 'icons' ? ['svg-flat'] : [];
  for (const s of order) if (t[s]?.path) return s;
  return keys.find((k) => t[k]?.path) ?? keys[0] ?? '';
}

export function haystack(r: ImageRecord): string {
  return [r.id, r.logicalId, r.title, r.description, r.service, r.sourceName, ...Object.values(r.treatments).map((t) => t.sourceName)]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase();
}

export function buildIndex(records: ImageRecord[]): IndexEntry[] {
  return records.map((r, pos) => {
    const keys = Object.keys(r.treatments);
    const paths: Record<string, true> = {};
    const states: Record<string, ReviewState> = {};
    for (const k of keys) {
      const t = r.treatments[k];
      if (t?.path) paths[k] = true;
      states[k] = recordState(r, t);
    }
    return { id: r.id, pos, collection: r.collection, category: r.category, service: r.service, title: r.title, hay: haystack(r), keys, paths, states, primary: primaryStyle(r) };
  });
}

/** Collection tab membership: "earlier" also holds experiments (browser.js L66). */
export function inCollection(entry: IndexEntry, collection: string | undefined): boolean {
  if (!collection || collection === 'all') return true;
  return collection === 'earlier' ? entry.collection === 'earlier' || entry.collection === 'experiments' : entry.collection === collection;
}

/** The style a record shows: the requested style when set (and not "all"), else its primary treatment. */
export function shownStyle(entry: IndexEntry, style: string | undefined): string {
  if (style && style !== 'all') return style;
  return entry.primary;
}

export type Overlay = ReadonlyMap<string, DecisionState>;

export function effectiveState(entry: IndexEntry, style: string, overlay?: Overlay): ReviewState {
  const d = overlay?.get(entry.id);
  if (d) return d.kind;
  return entry.states[style] ?? 'missing';
}

/**
 * Filter and order. Mirrors browser.js L153-164: a missing style drops only non-diagrams; "gaps" keeps
 * diagrams whose shown style has no file. Newest first is reverse manifest order (L66).
 */
export function matchEntries(index: IndexEntry[], q: CardQuery, overlay?: Overlay): IndexEntry[] {
  const query = (q.q ?? '').trim().toLocaleLowerCase();
  const style = q.style && q.style !== 'all' ? q.style : '';
  const out: IndexEntry[] = [];
  for (const e of index) {
    if (!inCollection(e, q.collection)) continue;
    if (q.category && e.category !== q.category) continue;
    if (q.service && e.service !== q.service) continue;
    if (style && e.collection !== 'diagrams' && !e.keys.includes(style)) continue;
    if (query && !e.hay.includes(query)) continue;
    const shown = shownStyle(e, style);
    if (q.gaps && (e.collection !== 'diagrams' || e.paths[shown])) continue;
    if (q.status && effectiveState(e, shown, overlay) !== q.status) continue;
    out.push(e);
  }
  const sort = q.sort ?? 'newest';
  if (sort === 'newest') out.sort((a, b) => b.pos - a.pos);
  else if (sort === 'oldest') out.sort((a, b) => a.pos - b.pos);
  else out.sort((a, b) => a.title.localeCompare(b.title) || a.pos - b.pos);
  return out;
}

const tally = (values: Iterable<string>): Facet[] => {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts].map(([value, count]) => ({ value, count })).sort((a, b) => a.value.localeCompare(b.value));
};

/** Cascading facets for one collection tab (browser.js L67-86): services narrow by the chosen category. */
export function computeFacets(index: IndexEntry[], manifest: Pick<Manifest, 'counts' | 'styleNames'>, opts: { collection?: string; category?: string; overlay?: Overlay } = {}): Facets {
  const inTab = index.filter((e) => inCollection(e, opts.collection));
  const inCategory = opts.category ? inTab.filter((e) => e.category === opts.category) : inTab;
  const styleKeys: string[] = [];
  const states: string[] = [];
  for (const e of inTab) {
    for (const k of Object.keys(e.paths)) styleKeys.push(k);
    states.push(effectiveState(e, e.primary, opts.overlay));
  }
  return {
    collections: { ...manifest.counts.collections },
    categories: tally(inTab.map((e) => e.category)),
    services: tally(inCategory.map((e) => e.service)),
    styles: tally(styleKeys),
    statuses: tally(states),
    styleNames: manifest.styleNames,
    ...(manifest.counts.diagramsByStyle ? { diagramsByStyle: manifest.counts.diagramsByStyle } : {}),
  };
}

export function toCard(record: ImageRecord, entry: IndexEntry, style: string | undefined, overlay?: Overlay): Card {
  const shown = shownStyle(entry, style);
  const t = record.treatments[shown];
  const tour = record.tour;
  const tv = tour?.versions.find((v) => v.version === tour.currentVersion);
  const decision = overlay?.get(record.id);
  return {
    id: record.id,
    title: record.title,
    service: record.service,
    category: record.category,
    collection: record.collection,
    style: shown,
    treatment:
      t?.path && t.sha256
        ? {
            path: t.path,
            sha: t.sha256,
            ...(t.width ? { w: t.width } : {}),
            ...(t.height ? { h: t.height } : {}),
            ...(t.format ? { format: t.format } : {}),
            ...(t.bytes ? { bytes: t.bytes } : {}),
            status: t.status ?? '',
            state: entry.states[shown] ?? 'missing',
          }
        : null,
    status: t?.status ?? 'missing',
    state: effectiveState(entry, shown, overlay),
    treatmentCount: Object.keys(entry.paths).length,
    styles: Object.keys(entry.paths),
    hasTour: Boolean(tv?.preview && tv.review?.playback === 'generated'),
    ...(decision ? { decision } : {}),
  };
}

/** Display order for style selectors: permanent four, then the rest alphabetically. */
export function orderStyles(styles: string[]): string[] {
  const perm = ['svg-flat', 'svg-outline', 'holographic', 'photorealistic'];
  return [...perm.filter((s) => styles.includes(s)), ...styles.filter((s) => !perm.includes(s)).sort()];
}

export function bytesLabel(value: number | undefined): string {
  if (!value) return '';
  return value >= 1048576 ? `${(value / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(value / 1024))} KB`;
}
