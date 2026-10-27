import { promises as fs } from 'node:fs';
import path from 'node:path';
import { HttpError } from '../../server/router';
import type { ModuleSummary, Router, ServerModule, Services } from '../types';
import { meta } from './meta';
import { PlanError, StoragePlans } from './plans';
import { sizeCollisions } from './providers/duplicates';
import { makeContext } from './providers/context';
import { hasherFor } from './providers/hasher';
import { computeReductions, runScan } from './scan';
import { providers } from './providers/registry';
import type { HashProgress, ProviderInfo, ScanResult } from './types';
import { launchOptsFromBody } from '../../server/core/prompts';

/** Routes, mounted by the core under /api/storage/. `stateDir` holds the scan cache (apps/mtw/.state/storage). */
export function registerStorage(router: Router, services: Services, stateDir = path.join(services.repoRoot, 'apps', 'mtw', '.state', 'storage')): void {
  const plans = new StoragePlans(services, services.repoRoot, stateDir);
  const hasher = hasherFor(stateDir);
  const scanFile = path.join(stateDir, 'scan.json');
  let scanning: Promise<ScanResult> | null = null;

  const readCache = async (): Promise<ScanResult | null> => {
    try {
      return JSON.parse(await fs.readFile(scanFile, 'utf8')) as ScanResult;
    } catch {
      return null;
    }
  };

  // Duplicate checks hash files lazily in the background; progress is polled, and the cache makes rescans fast.
  const startHashing = async (): Promise<HashProgress> => {
    if (!hasher.progress.running) {
      const ctx = makeContext(services.repoRoot, { stateDir });
      const files = await sizeCollisions(ctx);
      void hasher.ensure(files.map((f) => ({ rel: f.rel, abs: f.abs, size: f.size, mtimeMs: f.mtimeMs }))).catch(() => undefined);
      await Promise.resolve();
    }
    return hasher.progress;
  };

  const refresh = (): Promise<ScanResult> => {
    scanning ??= (async () => {
      try {
        const cfg = await plans.config();
        const result = await runScan(services.repoRoot, providers, cfg.archiveRoot, stateDir);
        await fs.mkdir(stateDir, { recursive: true });
        await fs.writeFile(scanFile, JSON.stringify(result), 'utf8');
        void startHashing();
        return result;
      } finally {
        scanning = null;
      }
    })();
    return scanning;
  };

  const wrap =
    <T>(fn: (req: { params: Record<string, string>; query: URLSearchParams; body: unknown }) => Promise<T>) =>
    async (req: { params: Record<string, string>; query: URLSearchParams; body: unknown }): Promise<T> => {
      try {
        return await fn(req);
      } catch (error) {
        if (error instanceof PlanError) throw new HttpError(error.status, error.message);
        throw error;
      }
    };

  router.get('/providers', async (): Promise<ProviderInfo[]> =>
    providers.map(({ id, vertical, label, category, describe, reportOnly, params }) => ({ id, vertical, label, category, describe, reportOnly, params })),
  );

  // The cached scan; null until the first refresh. `scanning` tells the client a refresh is running.
  router.get('/scan', async () => ({ scan: await readCache(), scanning: scanning !== null }));
  router.post('/scan', wrap(async () => ({ scan: await refresh(), scanning: false })));

  router.get('/config', async () => plans.config());

  router.get('/plans', async () => plans.listPlans());
  router.get('/plans/:id', wrap(async (req) => plans.detail(req.params.id as string)));
  router.post(
    '/plans',
    wrap(async (req) => {
      const b = (req.body ?? {}) as { providerId?: string; target?: string; params?: Record<string, number> };
      if (!b.providerId || !b.target) throw new PlanError(400, 'providerId and target are required');
      const plan = await plans.create({ providerId: b.providerId, target: b.target, ...(b.params ? { params: b.params } : {}) });
      return { id: plan.id };
    }),
  );
  router.post(
    '/plans/:id/exclusions',
    wrap(async (req) => {
      const b = (req.body ?? {}) as { excluded?: unknown };
      if (!Array.isArray(b.excluded) || !b.excluded.every((x) => typeof x === 'string')) throw new PlanError(400, 'excluded must be a list of paths');
      await plans.setExclusions(req.params.id as string, b.excluded as string[]);
      return plans.detail(req.params.id as string);
    }),
  );
  router.post('/plans/:id/approve', wrap(async (req) => (await plans.approve(req.params.id as string), plans.detail(req.params.id as string))));
  router.post('/plans/:id/cancel', wrap(async (req) => (await plans.cancel(req.params.id as string), plans.detail(req.params.id as string))));
  router.post('/plans/:id/execute', wrap(async (req) => (await plans.execute(req.params.id as string, launchOptsFromBody(req.body)), plans.detail(req.params.id as string))));
  router.post('/plans/:id/restore', wrap(async (req) => (await plans.restore(req.params.id as string, launchOptsFromBody(req.body)), plans.detail(req.params.id as string))));
  router.post(
    '/register',
    wrap(async (req) => {
      const b = (req.body ?? {}) as { providerId?: string; target?: string };
      if (!b.providerId || !b.target) throw new PlanError(400, 'providerId and target are required');
      return plans.register({ providerId: b.providerId, target: b.target }, launchOptsFromBody(req.body));
    }),
  );
  router.get('/hashing', async () => hasher.progress);
  router.post('/hashing', wrap(async () => startHashing()));

  // Fresh reduction rows without a full walk, optionally with other day thresholds ({ params: { <providerId>: { days: 7 } } }).
  router.post(
    '/reductions',
    wrap(async (req) => {
      const b = (req.body ?? {}) as { params?: Record<string, Record<string, number>> };
      return computeReductions(services.repoRoot, providers, b.params ?? {}, stateDir);
    }),
  );
}

export const server: ServerModule = {
  meta,
  async summary(services): Promise<ModuleSummary> {
    // Plans are small JSON files under wiki/operations/storage/plans; the scan cache is not read here.
    const plans = await new StoragePlans(services, services.repoRoot).listPlans();
    const draftPlans = plans.filter((p) => p.status === 'draft');
    const drafts = draftPlans.length;
    const source = 'wiki/operations/storage/plans/*.json';
    const mb = (b: number): string => (b >= 1e9 ? `${(b / 1e9).toFixed(2)} GB` : `${(b / 1e6).toFixed(1)} MB`);
    return {
      items: [{ id: 'plans', label: 'Plans to approve', count: drafts, href: '/m/storage/plans', attention: drafts > 0, source }],
      needs: draftPlans.map((p) => ({
        id: `storage-${p.id}`,
        title: `${p.title}: ${p.files} files, ${mb(p.bytes)}`,
        next: 'Approve or reject the storage plan',
        count: p.files,
        since: p.createdAt,
        href: `/m/storage/plans/${encodeURIComponent(p.id)}`,
        action: 'Decide',
        source,
      })),
    };
  },
  register(router, services) {
    registerStorage(router, services);
  },
};
