// New. Snapshot data adapter: the same pure filter/paging/detail code as the server, over window.MTW_LIBRARY (the
// producer's data.js) and window.MTW_DECISIONS. Originals are used directly; there are no thumbnails to generate.
import { effectiveDecisions } from '../shared/decisions';
import { buildDetail } from '../shared/detail';
import { buildEvidence, queryEvidence } from '../shared/evidence';
import { buildIndex, computeFacets, matchEntries, toCard } from '../shared/filter';
import type { DecisionEntry, ImageRecord, Manifest } from '../shared/types';
import { FamilyIndex } from '../shared/versions';
import type { ImagesData } from '../web/host';

export interface DecisionRow {
  id: string;
  at: string;
  actor: string;
  module: string;
  subject: string;
  action: string;
  value?: unknown;
  note?: string;
}

export const relativeUrl = (p: string): string => p.split('/').map(encodeURIComponent).join('/');

export function createSnapshotData(lib: Manifest, rows: DecisionRow[] = []): ImagesData {
  const index = buildIndex(lib.records);
  const byId = new Map<string, { record: ImageRecord }>(lib.records.map((record) => [record.id, { record }]));
  const family = new FamilyIndex(lib.records);
  const evidence = buildEvidence(lib.files ?? []);
  const entries: DecisionEntry[] = rows
    .filter((d) => d.module === 'images')
    .map((d) => ({ id: d.id, at: d.at, action: d.action, subject: d.subject, actor: d.actor, ...(d.value ? { value: d.value as DecisionEntry['value'] } : {}), ...(d.note ? { note: d.note } : {}) }));
  const overlay = effectiveDecisions(entries);

  return {
    async facets(collection, category) {
      return computeFacets(index, lib, { collection, ...(category ? { category } : {}), overlay });
    },
    async records(q) {
      const hits = matchEntries(index, q, overlay);
      const offset = Math.max(0, q.offset ?? 0);
      const limit = Math.min(200, Math.max(1, q.limit ?? 60));
      const style = q.style && q.style !== 'all' ? q.style : undefined;
      return { total: hits.length, items: hits.slice(offset, offset + limit).map((e) => toCard(lib.records[e.pos] as ImageRecord, e, style, overlay)) };
    },
    async record(id) {
      const hit = byId.get(id);
      return hit ? buildDetail({ record: hit.record, byId, family, entries, overlay, styleNames: lib.styleNames }) : null;
    },
    async evidence(q) {
      return queryEvidence(evidence, q);
    },
    thumb: (file) => relativeUrl(file.path),
    file: relativeUrl,
  };
}
