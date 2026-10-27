import { HttpError } from '../../server/router';
import type { ModuleSummary, ServerModule, Services } from '../types';
import { JournalActions } from './lib/actions';
import { JournalService } from './lib/service';
import { meta } from './meta';
import type { JournalState } from './shared';

// The service per Services, so summary() reads the same cached state the module's own routes use.
const serviceFor = new WeakMap<Services, JournalService>();

// JSON endpoints over the data layer ported from the retired Journal console build-state.mjs. Writes: decisions.jsonl only (via services.decisions).
export const server: ServerModule = {
  meta,
  async summary(services): Promise<ModuleSummary> {
    // The service's state is fingerprinted and cached; the first build walks wiki/journal (about 0.3 s), later calls
    // reuse it until a journal file changes. Unregistered services (no module mounted) show no count.
    const svc = serviceFor.get(services);
    if (!svc) return { items: [{ id: 'waiting', label: 'Waiting on Matt', count: undefined, href: '/m/journal', attention: false }] };
    const state: JournalState = svc.state().state;
    const waiting = state.waiting;
    const source = 'wiki/journal/ (candidates.json, entries, interviews, queue)';
    const linkFor = (w: JournalState['waiting'][number]): string =>
      w.entrySlug ? `/m/journal/entry/${encodeURIComponent(w.entrySlug)}?tab=${w.ask.includes('draft') ? 'notes' : 'interview'}` : `/m/journal/concept/${encodeURIComponent(String(w.conceptNumber))}`;
    const opened = state.entries.map((e) => ({ e, at: (e as { opened?: string }).opened })).filter((x): x is { e: (typeof state.entries)[number]; at: string } => typeof x.at === 'string' && !Number.isNaN(Date.parse(x.at)));
    const newest = opened.sort((a, b) => b.at.localeCompare(a.at))[0];
    return {
      items: [{ id: 'waiting', label: 'Waiting on Matt', count: waiting.length, ...(waiting[0] ? { detail: `${waiting[0].entryTitle}: ${waiting[0].ask}` } : {}), href: '/m/journal', attention: waiting.length > 0, source }],
      needs: waiting.map((w, i) => ({ id: `journal-${w.entrySlug ?? w.where ?? i}-${i}`, title: w.entryTitle, next: w.ask, href: linkFor(w), action: 'Open', source })),
      library: {
        total: Number(state.counts.entries ?? 0),
        totalLabel: `entries, ${state.counts.concepts} concepts`,
        awaiting: waiting.length,
        awaitingLabel: 'asks waiting on Matt',
        newest: newest ? { label: newest.e.title, at: new Date(newest.at).toISOString(), href: `/m/journal/entry/${encodeURIComponent(newest.e.slug)}` } : null,
        href: '/m/journal',
        source,
      },
    };
  },
  register(router, services) {
    const svc = new JournalService(services);
    serviceFor.set(services, svc);
    const actions = new JournalActions(svc, services);

    router.get('/overview', () => svc.overview());
    router.get('/state', () => svc.state().state);
    router.get('/options', () => svc.options());
    router.get('/decisions', ({ query }) => svc.decisions(query.get('subject') ?? undefined));
    router.get('/cover/:file', ({ params, headers }) => {
      let c;
      try {
        c = svc.coverPath(params.file as string);
      } catch (error) {
        throw new HttpError(404, (error as Error).message);
      }
      return services.media.serve(c.abs, headers, { allowRoots: [c.dir], contentType: c.mime, cacheControl: 'no-cache' });
    });
    router.post('/decide', ({ body }) => actions.decide(body));
    router.post('/answers', ({ body }) => actions.answers(body));
    router.post('/launch', ({ body }) => actions.launchOp(body));
    router.post('/preview', ({ body }) => actions.preview(body));
    // Review chat (wiki/operations/prompts/journal-review.md): presets from its template, and a launch per item.
    router.get('/review-presets', async () => ({ presets: await actions.reviewPresets() }));
    router.post('/review', ({ body }) => actions.review(body));
  },
};
