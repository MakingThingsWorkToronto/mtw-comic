// New. One record's full detail (version chains, decisions, lineage), shared by the server route and the snapshot.
import type { Overlay } from './filter';
import { parseImgRef } from './refs';
import type { DecisionEntry, ImageRecord, RecordDetail } from './types';
import { versionsOf } from './versions';
import type { FamilyIndex } from './versions';

export function buildDetail(args: {
  record: ImageRecord;
  byId: ReadonlyMap<string, { record: ImageRecord }>;
  family: FamilyIndex;
  entries: DecisionEntry[];
  overlay: Overlay;
  styleNames: Record<string, string>;
  integration?: Record<string, string>;
}): RecordDetail {
  const { record, byId, family, entries, overlay } = args;
  const linked: RecordDetail['linked'] = [];
  const seen = new Set<string>([record.id]);
  const add = (id: string, kind: RecordDetail['linked'][number]['kind']): void => {
    const other = byId.get(id);
    if (other && !seen.has(id) && linked.length < 60) {
      seen.add(id);
      linked.push({ id, title: other.record.title, kind });
    }
  };
  for (const id of record.references ?? []) add(id, 'reference');
  for (const id of record.relatedDiagrams ?? []) add(id, 'related');
  for (const member of family.family(record.id)) add(member.id, 'family');
  const versions: RecordDetail['versions'] = {};
  for (const style of Object.keys(record.treatments)) {
    const chain = versionsOf(family, record, style);
    if (chain.length) versions[style] = chain;
  }
  const decision = overlay.get(record.id);
  return {
    record,
    versions,
    decisions: entries.filter((d) => parseImgRef(d.subject)?.id === record.id).sort((a, b) => b.at.localeCompare(a.at)),
    ...(decision ? { decision } : {}),
    styleNames: args.styleNames,
    linked,
    ...(args.integration && Object.keys(args.integration).length ? { integration: args.integration } : {}),
  };
}
