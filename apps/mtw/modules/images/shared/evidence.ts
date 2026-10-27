// New. Evidence images (records/ in files[]) are queried apart from the creative list (migration spec section 4).
import type { EvidenceItem, ManifestFile } from './types';

const IMAGE = /\.(png|svg|jpe?g|webp|gif|avif|tiff?|bmp|ico)$/i;

export function buildEvidence(files: ManifestFile[]): EvidenceItem[] {
  const out: EvidenceItem[] = [];
  for (const f of files) {
    if (!f.destination.startsWith('records/') || !IMAGE.test(f.destination)) continue;
    const parts = f.destination.split('/');
    out.push({ path: f.destination, sha: f.sha256, bytes: f.bytes, group: parts[1] ?? '', name: parts.slice(2).join('/') });
  }
  return out;
}

export function queryEvidence(
  list: EvidenceItem[],
  opts: { q?: string; group?: string; offset?: number; limit?: number },
): { total: number; items: EvidenceItem[]; groups: { value: string; count: number }[] } {
  const q = (opts.q ?? '').trim().toLowerCase();
  const filtered = list.filter((e) => (!opts.group || e.group === opts.group) && (!q || e.path.toLowerCase().includes(q)));
  const groups = new Map<string, number>();
  for (const e of list) groups.set(e.group, (groups.get(e.group) ?? 0) + 1);
  const offset = Math.max(0, opts.offset ?? 0);
  const limit = Math.min(200, Math.max(1, opts.limit ?? 60));
  return {
    total: filtered.length,
    items: filtered.slice(offset, offset + limit),
    groups: [...groups].map(([value, count]) => ({ value, count })).sort((a, b) => a.value.localeCompare(b.value)),
  };
}
