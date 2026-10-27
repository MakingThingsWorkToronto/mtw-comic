// Asset health, images: older versions. Files named <stem>-vN and `earlier-*` records whose newer version or current record
// exists. The newest version, anything a current record selects or Matt approved, and anything a wiki page names stay.
// Comic page art has its own provider (comics-published-issue) because the site's story files decide what is in use.
import type { SkippedFile } from '../types';
import { buildEntries, dropReferenced, IMAGE_LIB, loadImageManifest, MEDIA_EXT } from './context';
import type { Candidate, ProviderContext, ReductionProvider } from './context';
import { parseVersioned } from './comics';

const COMIC = /^assets\/(scenes|experiments)\/comic-b\//;
const keepStatus = (s?: string): boolean => /^(selected|user-approved)/i.test(s ?? '');

const group = (rel: string): string => rel.split('/').slice(0, 2).join('/');

function find(ctx: ProviderContext): Promise<{ byGroup: Map<string, Candidate[]>; skipped: SkippedFile[] }> {
  return ctx.memo('image-versions', async () => {
    const manifest = await loadImageManifest(ctx);
    const keep = new Set<string>();
    const earlierIds = (id: string): boolean => /^earlier-/.test(id);
    for (const r of manifest.records) {
      for (const t of Object.values(r.treatments ?? {})) {
        if (!t.path) continue;
        if (!earlierIds(r.id) && !/reject/i.test(t.status ?? r.status ?? '')) keep.add(t.path);
        if (r.userApproved || t.userApproved || keepStatus(t.status) || keepStatus(r.status) || /^selected/i.test(r.publicUse ?? '')) keep.add(t.path);
      }
    }
    const cands: Candidate[] = [];
    // (1) -vN files with a newer version in the same folder
    const newest = new Map<string, number>();
    const files = manifest.files.filter((f) => f.destination.startsWith('assets/') && MEDIA_EXT.test(f.destination) && !COMIC.test(f.destination));
    for (const f of files) {
      const dir = f.destination.slice(0, f.destination.lastIndexOf('/'));
      const p = parseVersioned(f.destination.slice(f.destination.lastIndexOf('/') + 1));
      if (p) newest.set(`${dir}|${p.stem}|${p.print}`, Math.max(newest.get(`${dir}|${p.stem}|${p.print}`) ?? 0, p.version));
    }
    for (const f of files) {
      const dir = f.destination.slice(0, f.destination.lastIndexOf('/'));
      const p = parseVersioned(f.destination.slice(f.destination.lastIndexOf('/') + 1));
      const top = p ? (newest.get(`${dir}|${p.stem}|${p.print}`) ?? 0) : 0;
      if (p && p.version < top && !keep.has(f.destination)) cands.push({ path: `${IMAGE_LIB}/${f.destination}`, reason: `older version v${p.version}; v${top} is newer and nothing selects v${p.version}`, sha256: f.sha256 ?? '' });
    }
    // (2) the files of `earlier-*` records that no current record uses
    const have = new Set(cands.map((c) => c.path));
    for (const r of manifest.records) {
      if (!earlierIds(r.id) || /comic-b-/.test(r.id)) continue;
      for (const t of Object.values(r.treatments ?? {})) {
        const rel = t.path;
        if (!rel || !rel.startsWith('assets/') || !MEDIA_EXT.test(rel) || COMIC.test(rel) || keep.has(rel) || have.has(`${IMAGE_LIB}/${rel}`)) continue;
        have.add(`${IMAGE_LIB}/${rel}`);
        cands.push({ path: `${IMAGE_LIB}/${rel}`, reason: `earlier version of ${r.id.replace(/^earlier-/, '')}; a current record replaced it`, sha256: t.sha256 ?? '' });
      }
    }
    const skipped: SkippedFile[] = [];
    const left = await dropReferenced(ctx, cands, skipped);
    const byGroup = new Map<string, Candidate[]>();
    for (const c of left) {
      const g = group(c.path.slice(IMAGE_LIB.length + 1));
      byGroup.set(g, [...(byGroup.get(g) ?? []), c]);
    }
    return { byGroup, skipped };
  });
}

export const imageVersions: ReductionProvider = {
  id: 'image-versions',
  vertical: 'images',
  category: 'older',
  label: 'Older versions',
  describe:
    'Archive earlier images: files with a newer -vN version nothing selects, and the files of earlier-* records that no current record uses. The newest version, anything selected or approved, and anything a wiki page names stay.',
  reportOnly: false,
  params: [],

  async targets(ctx) {
    const { byGroup } = await find(ctx);
    return [...byGroup.keys()].sort().map((g) => ({ id: g, label: g }));
  },

  async plan(target, ctx) {
    const { byGroup, skipped } = await find(ctx);
    return buildEntries(ctx, byGroup.get(target) ?? [], skipped.filter((s) => s.path.includes(`/${target}/`)));
  },
};
