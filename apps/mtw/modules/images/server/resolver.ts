// New. The `img:` asset resolver other modules' AssetField uses: img:<record>[#<style>]@<current|v<N>|sha8>.
import type { AssetResolver, AssetSummary } from '../../types';
import { formatImgRef } from '../shared/refs';
import type { Catalog } from './catalog';
import type { Integration } from './integration';

const thumbUrl = (sha: string): string => `/api/images/thumb/${sha}?w=320`;

export function createResolver(catalog: Catalog, integration: Integration): AssetResolver {
  const approved = async (id: string): Promise<boolean> => {
    const { overlay } = await catalog.overlay();
    return overlay.get(id)?.kind === 'approved';
  };

  return {
    prefix: 'img',
    label: 'Image',
    module: 'images',

    async list(query) {
      const f = query.filters ?? {};
      const res = await catalog.cards({
        ...(query.q ? { q: query.q } : {}),
        ...(f.collection ? { collection: f.collection } : {}),
        ...(f.style ? { style: f.style } : {}),
        ...(f.status ? { status: f.status } : {}),
        ...(f.category ? { category: f.category } : {}),
        offset: query.offset ?? 0,
        limit: query.limit ?? 50,
      });
      const { overlay } = await catalog.overlay();
      const items: AssetSummary[] = res.items
        .filter((c) => c.treatment)
        .map((c) => ({
          ref: formatImgRef(c.id, 'current', c.style),
          title: c.title,
          status: c.status,
          preview: thumbUrl((c.treatment as { sha: string }).sha),
          canonicalPath: `wiki/image-library/${(c.treatment as { path: string }).path}`,
          meta: { collection: c.collection, style: c.style, version: 'current', userApproved: overlay.get(c.id)?.kind === 'approved' },
        }));
      return { items, total: res.total };
    },

    async resolve(ref) {
      try {
        const hit = await catalog.resolveFile(ref);
        if (!hit) return null;
        const full = hit.version;
        const record = hit.record;
        const requested = /@([^@]+)$/.exec(ref)?.[1] ?? 'current';
        return {
          ref: formatImgRef(record.id, requested, /#/.test(ref) ? hit.style : undefined),
          title: record.title,
          status: full?.status ?? record.treatments[hit.style]?.status ?? '',
          preview: thumbUrl(hit.sha),
          canonicalPath: `wiki/image-library/${hit.treatmentPath}`,
          ...(integration.integrationSrc(record, hit.style, hit.treatmentPath) ? { integrationSrc: integration.integrationSrc(record, hit.style, hit.treatmentPath) as string } : {}),
          meta: {
            collection: record.collection,
            style: hit.style,
            version: full?.token ?? requested,
            userApproved: record.userApproved === true || (await approved(record.id)),
          },
        };
      } catch {
        return null;
      }
    },
  };
}
