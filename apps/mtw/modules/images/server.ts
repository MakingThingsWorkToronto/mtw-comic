// Images module server entry: mounts the routes and the `img:` resolver (see server/routes.ts).
import { stat } from 'node:fs/promises';
import path from 'node:path';
import type { ModuleSummary, ServerModule } from '../types';
import { INTAKE_NOTE } from './intake';
import { meta } from './meta';
import { mountImages } from './server/routes';
import type { ImagesContext, ImagesOptions } from './server/routes';

export function createImagesServer(opts: ImagesOptions = {}): ServerModule {
  // The catalog is created by mountImages in register(); summary() reads the same cached index.
  let ctx: ImagesContext | null = null;
  return {
    meta,
    async summary(): Promise<ModuleSummary> {
      if (!ctx) return { items: [{ id: 'unreviewed', label: 'Unreviewed images', count: undefined, href: '/m/images?collection=all&status=unreviewed', attention: false }] };
      // Same rule as the library view: the record's shown treatment state, over all collections.
      const hit = await ctx.catalog.cards({ collection: 'all', status: 'unreviewed', limit: 1 });
      const l = await ctx.catalog.ensure();
      // Files auto-intake registered that are still unreviewed (the Registration count): a subset by file, not by record.
      let intake = 0;
      for (const r of l.manifest.records) for (const t of Object.values(r.treatments) as { status?: string; note?: string }[]) if (t.note?.startsWith(INTAKE_NOTE) && /unreviewed/.test(t.status ?? '')) intake++;
      const last = l.manifest.records.at(-1);
      const lastPath = last ? (Object.values(last.treatments) as { path?: string }[]).find((t) => t.path)?.path : undefined;
      let lastAt: string | undefined;
      if (lastPath) lastAt = await stat(path.join(ctx.catalog.libraryRoot, lastPath)).then((s) => s.mtime.toISOString(), () => undefined);
      const href = '/m/images?collection=all&status=unreviewed';
      const source = 'wiki/image-library/manifest.json + decisions.jsonl';
      const detail = intake ? `${intake} of the waiting files were auto-registered by Studio intake` : '';
      return {
        items: [
          { id: 'unreviewed', label: 'Image records awaiting review', count: hit.total, ...(detail ? { detail } : {}), href, attention: hit.total > 0, source },
          // The sweep is a live scan with no cache, so there is no unregistered count to show here.
        ],
        needs: hit.total ? [{ id: 'images-review', title: `${hit.total} image records awaiting review`, next: `Approve, reject or select versions${intake ? ` (${intake} files auto-registered by intake)` : ''}`, count: hit.total, href, action: 'Review', source }] : [],
        library: {
          total: l.manifest.records.length,
          totalLabel: 'records',
          awaiting: hit.total,
          awaitingLabel: 'records awaiting review',
          newest: last ? { label: last.title, ...(lastAt ? { at: lastAt } : {}), href: `/m/images/record/${encodeURIComponent(last.id)}` } : null,
          href,
          source,
        },
      };
    },
    register(router, services) {
      ctx = mountImages(router, services, opts);
    },
  };
}

export const server: ServerModule = createImagesServer();
