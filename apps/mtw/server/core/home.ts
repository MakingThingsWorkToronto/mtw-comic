// GET /api/home: the Home dashboard's data. Asks each registered module for its optional read-only summary().
// One failing module never blanks the page: its entry carries an error string instead. A summary slower than its
// budget is answered from that module's previous result (marked stale) while it finishes in the background.
import type { ActivityRow, HealthRow, LibraryRow, ModuleSummary, NeedItem, ServerModule, Services, SummaryItem } from '../../modules/types';

export interface HomeModuleEntry {
  id: string;
  title: string;
  order: number;
  /** Link to the module's own view. */
  href: string;
  /** False when the module has no summary() yet: Home shows only the link. */
  summarized: boolean;
  items: SummaryItem[];
  needs?: NeedItem[];
  library?: LibraryRow;
  activity?: ActivityRow[];
  health?: HealthRow[];
  /** When this module's summary was computed (older than the response when it was slow and served from cache). */
  readAt?: string;
  error?: string;
}
export interface HomeSummary {
  generatedAt: string;
  modules: HomeModuleEntry[];
  /** The five-section dashboard (server/core/dashboard.ts). Absent from servers started before 2026-10-12. */
  dashboard?: import('./dashboard').DashboardData;
}

const last = new WeakMap<Services, Map<string, { summary: ModuleSummary; readAt: string }>>();
const pending = new WeakMap<Services, Map<string, Promise<ModuleSummary>>>();

export async function buildHomeSummary(modules: ServerModule[], services: Services, budgetMs = 800): Promise<HomeSummary> {
  const cache = last.get(services) ?? new Map<string, { summary: ModuleSummary; readAt: string }>();
  last.set(services, cache);
  const inflight = pending.get(services) ?? new Map<string, Promise<ModuleSummary>>();
  pending.set(services, inflight);
  const entries = await Promise.all(
    modules.map(async (m): Promise<HomeModuleEntry> => {
      const base = { id: m.meta.id, title: m.meta.title, order: m.meta.nav.order, href: `/m/${m.meta.id}` };
      if (!m.summary) return { ...base, summarized: false, items: [] };
      const summarize = m.summary;
      let job = inflight.get(m.meta.id);
      if (!job) {
        job = Promise.resolve()
          .then(() => summarize(services))
          .then((s) => {
            cache.set(m.meta.id, { summary: s, readAt: new Date().toISOString() });
            return s;
          })
          .finally(() => inflight.delete(m.meta.id));
        inflight.set(m.meta.id, job);
      }
      try {
        const prev = cache.get(m.meta.id);
        const timer = new Promise<'late'>((r) => setTimeout(() => r('late'), budgetMs).unref?.());
        const s = prev ? await Promise.race([job, timer]) : await job;
        const got = s === 'late' ? (prev as { summary: ModuleSummary; readAt: string }) : { summary: s, readAt: new Date().toISOString() };
        const { items, needs, library, activity, health } = got.summary;
        return { ...base, summarized: true, items, ...(needs ? { needs } : {}), ...(library ? { library } : {}), ...(activity ? { activity } : {}), ...(health ? { health } : {}), readAt: got.readAt };
      } catch (error) {
        return { ...base, summarized: true, items: [], error: (error as Error).message };
      }
    }),
  );
  entries.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  return { generatedAt: new Date().toISOString(), modules: entries };
}
