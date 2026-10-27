// New (no legacy origin): version chains over wiki/image-library/manifest.json. The manifest has no version field,
// so a family is derived from three real mechanisms: filename `-vN`, producer `earlier-*` archives (`retainedFrom`),
// and ad hoc `-retained-vN` sibling records. See migration spec section 1.
import { recordState } from './states';
import type { ImageRecord, VersionEntry } from './types';

const FILE_N = /-v(\d+)\.[a-z0-9]+$/i;
const RETAINED_N = /-retained-v(\d+)$/;

/** Union-find over record ids joined by logicalId, retainedFrom and the -retained-vN sibling pattern. */
export class FamilyIndex {
  private parent = new Map<string, string>();
  private members = new Map<string, ImageRecord[]>();
  private byId = new Map<string, ImageRecord>();

  constructor(records: ImageRecord[]) {
    for (const r of records) {
      this.byId.set(r.id, r);
      this.parent.set(r.id, r.id);
    }
    const logical = new Map<string, string>();
    for (const r of records) {
      if (r.logicalId) {
        const first = logical.get(r.logicalId);
        if (first) this.union(first, r.id);
        else logical.set(r.logicalId, r.id);
      }
      if (r.retainedFrom && this.byId.has(r.retainedFrom)) this.union(r.retainedFrom, r.id);
      const base = RETAINED_N.test(r.id) ? r.id.replace(RETAINED_N, '') : '';
      if (base && this.byId.has(base)) this.union(base, r.id);
    }
    for (const r of records) {
      const root = this.find(r.id);
      const list = this.members.get(root);
      if (list) list.push(r);
      else this.members.set(root, [r]);
    }
  }

  private find(id: string): string {
    let cur = id;
    while (this.parent.get(cur) !== cur) {
      const up = this.parent.get(cur) as string;
      this.parent.set(cur, this.parent.get(up) as string);
      cur = this.parent.get(cur) as string;
    }
    return cur;
  }

  private union(a: string, b: string): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent.set(rb, ra);
  }

  family(id: string): ImageRecord[] {
    return this.members.get(this.find(id)) ?? [];
  }
}

const sha8 = (sha: string): string => sha.slice(0, 8);

function kindOf(record: ImageRecord, owner: ImageRecord): VersionEntry['kind'] {
  if (record.id === owner.id) return 'live';
  return record.retainedFrom || record.id.startsWith('earlier-') ? 'archive' : 'retained';
}

/**
 * Every distinct file of `style` across the record's family, newest registration first within a token.
 * `v<N>` goes to the first entry (live before archive) per N; later same-N entries and entries with no N use sha8.
 */
export function versionsOf(family: FamilyIndex, record: ImageRecord, style: string): VersionEntry[] {
  const live = record.treatments[style]?.path ? record.treatments[style] : undefined;
  const raw: (Omit<VersionEntry, 'token' | 'current'> & { order: number })[] = [];
  const seen = new Set<string>();
  const members = family.family(record.id);
  // Live record first, then others from newest to oldest manifest position.
  const ordered = [...members].sort((a, b) => (a.id === record.id ? -1 : b.id === record.id ? 1 : 0));
  ordered.forEach((r, order) => {
    const t = r.treatments[style];
    if (!t?.path || !t.sha256) return;
    // Content identity: the same bytes under two names are one version.
    if (seen.has(t.sha256)) return;
    seen.add(t.sha256);
    const fileN = FILE_N.exec(t.path)?.[1];
    const idN = RETAINED_N.exec(r.id)?.[1];
    const n = fileN ? Number(fileN) : idN ? Number(idN) : null;
    raw.push({
      n,
      recordId: r.id,
      style,
      path: t.path,
      sha256: t.sha256,
      sha8: sha8(t.sha256),
      status: t.status ?? '',
      state: recordState(r, t),
      ...(t.bytes ? { bytes: t.bytes } : {}),
      ...(t.width ? { width: t.width } : {}),
      ...(t.height ? { height: t.height } : {}),
      live: r.id === record.id,
      kind: kindOf(r, record),
      order,
    });
  });
  // Order: highest N first (newest version), unnumbered by registration order.
  raw.sort((a, b) => (b.n ?? -1) - (a.n ?? -1) || a.order - b.order);
  const takenN = new Set<number>();
  return raw.map(({ order: _order, ...e }) => {
    let token = e.sha8;
    if (e.n !== null && !takenN.has(e.n)) {
      takenN.add(e.n);
      token = `v${e.n}`;
    }
    return { ...e, token, current: Boolean(live && e.live && e.sha256 === live.sha256) };
  });
}

/** Resolve a version token against a chain. `current` is the record's live file; unknown tokens give undefined. */
export function pickVersion(chain: VersionEntry[], token: string): VersionEntry | undefined {
  if (token === 'current') return chain.find((v) => v.current) ?? chain[0];
  return chain.find((v) => v.token === token) ?? chain.find((v) => v.sha8 === token);
}
