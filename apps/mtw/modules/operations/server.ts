import { readFile } from 'node:fs/promises';
import { HttpError } from '../../server/router';
import type { ServerModule } from '../types';
import { ContributionTracker, readRun, recentRuns } from './contrib';
import { meta } from './meta';
import { loadStudioSettings, saveStudioSettings } from '../../server/core/studioSettings';
import { MODELS_FILE, syncModels } from '../../../../scripts/models/sync-models.mjs';
import type { CatalogProvider } from '../../../../scripts/models/sync-models.mjs';
import { launchOptsFromBody } from '../../server/core/prompts';

// Terminals and operations are served by the core under /api/terminals and /api/operations.
// This module adds only what its own views need: the runner choices from wiki/operations/runners.json.
const fmt = (n: number): string => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(n));
type UsageToday = { today: { total: number; estCostUsd: number; unpricedTokens?: number; unpricedModels?: string[] } };

/** "est. $1.34 for priced models; price unknown for claude-fable-5-1 (27.4M tokens)": an unpriced model is never $0. */
export function costLine(t: UsageToday['today']): string {
  const unpriced = t.unpricedModels ?? [];
  if (!unpriced.length) return `est. $${t.estCostUsd.toFixed(2)} (estimate)`;
  const tail = `price unknown for ${unpriced.join(', ')} (${fmt(t.unpricedTokens ?? 0)} tokens not costed)`;
  return (t.unpricedTokens ?? 0) >= t.total ? `est. cost unknown: ${tail}` : `est. $${t.estCostUsd.toFixed(2)} for priced models; ${tail}`;
}

type RunnerRow = { models?: { id: string; label: string }[]; efforts?: string[]; modelArgs?: string[]; effortArgs?: string[] };

/** Visible models and the union of their effort levels for one runner; empty when its CLI takes no such flag. */
export function modelChoices(r: RunnerRow, p: CatalogProvider | undefined): { models: { id: string; label: string }[]; efforts: string[] } {
  const listed = p?.models.filter((m) => !m.hidden) ?? [];
  const models = r.modelArgs?.length ? (listed.length ? listed.map((m) => ({ id: m.id, label: m.label })) : (r.models ?? [])) : [];
  const efforts = r.effortArgs?.length ? (listed.length ? [...new Set(listed.flatMap((m) => m.efforts))] : (r.efforts ?? [])) : [];
  return { models, efforts };
}

export const server: ServerModule = {
  meta,
  summary(services) {
    const running = services.terminals.list().filter((t) => t.status === 'running').length;
    // usageSummary() lives on the core's TerminalService, not on the module-facing interface.
    const usage = (services.terminals as unknown as { usageSummary?: () => UsageToday }).usageSummary?.();
    return {
      items: [
        { id: 'running', label: 'Terminals running', count: running, href: '/m/operations/terminals?status=running', source: 'Studio terminal service (live)' },
        ...(usage ? [{ id: 'tokens', label: 'Tokens today', count: fmt(usage.today.total), detail: costLine(usage.today), href: '/m/operations/usage', source: 'apps/mtw/.state/runs/*/run.json + wiki/operations/pricing.json' }] : []),
      ],
    };
  },
  register(router, services) {
    // config/models.json follows each CLI's own model list: refreshed now and every 10 minutes (a write only on change).
    const refreshModels = (): void => {
      try {
        syncModels();
      } catch (error) {
        console.warn(`[operations] models refresh failed: ${(error as Error).message}`);
      }
    };
    refreshModels();
    setInterval(refreshModels, 10 * 60 * 1000).unref();
    new ContributionTracker(services).start();
    const stateDirOf = () => (services.terminals as unknown as { stateDir?: string }).stateDir ?? '';
    router.get('/contributions', async ({ query }) => recentRuns(stateDirOf(), Math.min(200, Number(query.get('limit') ?? 40) || 40)));
    router.get('/runs/:id', async ({ params }) => {
      const run = await readRun(stateDirOf(), params.id as string);
      if (!run) throw new HttpError(404, 'unknown run');
      return run;
    });
    // "Improve this procedure": launches operations-improve-procedure for one operation run.
    router.post('/runs/:id/improve', async ({ params, body }) => {
      const run = await readRun(stateDirOf(), params.id as string);
      if (!run?.operation) throw new HttpError(404, 'that run was not launched from an operation');
      if (!run.promptPath) throw new HttpError(400, 'that run has no prompt file');
      try {
        const o = launchOptsFromBody(body);
        return await services.operations.launch('operations-improve-procedure', { operation: run.operation, run: run.id, prompt: run.promptPath, transcript: run.transcript ?? '' }, o.runner, o.permission, undefined, o.choice);
      } catch (error) {
        throw new HttpError(400, (error as Error).message);
      }
    });
    // "Resume": reopen an ended or crashed terminal's saved conversation (provider transcript on disk) in a new terminal.
    router.post('/runs/:id/resume', async ({ params, body }) => {
      if (!services.terminals.resume) throw new HttpError(400, 'this Studio cannot reopen saved conversations');
      try {
        // The provider stays the original; the confirm may change model, effort or permission (never to bypass).
        const o = launchOptsFromBody(body);
        return services.terminals.resume(params.id as string, { ...(o.choice ?? {}), ...(o.permission ? { permission: o.permission } : {}) });
      } catch (error) {
        throw new HttpError(400, (error as Error).message);
      }
    });
    router.get('/runners', async () => {
      const catalog = await readFile(MODELS_FILE, 'utf8').then((t) => (JSON.parse(t) as { providers?: Record<string, CatalogProvider> }).providers ?? {}, () => ({}) as Record<string, CatalogProvider>);
      const runners = await services.wiki.readJson<Record<string, { label: string; status?: string; note?: string; tokenSource?: string; permissions?: { id: string; label: string }[]; models?: { id: string; label: string }[]; efforts?: string[]; modelArgs?: string[]; effortArgs?: string[] }>>('wiki/operations/runners.json');
      return Object.entries(runners).map(([id, r]) => ({
        id,
        label: r.label,
        status: r.status ?? 'proven',
        tokenSource: r.tokenSource ?? 'none',
        ...(r.note ? { note: r.note } : {}),
        permissions: (r.permissions ?? []).map((p) => ({ id: p.id, label: p.label })),
        // Only runners whose CLI takes a model or effort flag offer those settings. config/models.json (each CLI's own
        // list, refreshed below) supplies them; runners.json's short list is the fallback before the first refresh.
        ...modelChoices(r, catalog[id]),
      }));
    });
    // Operations > Defaults: config/studio.json (the default provider, and each provider's model and effort).
    router.get('/settings', async () => loadStudioSettings(services.repoRoot));
    router.post('/settings', async ({ body }) => {
      try {
        const saved = await saveStudioSettings(services.repoRoot, body);
        services.events.emit('studio-settings', saved);
        return saved;
      } catch (error) {
        throw new HttpError(400, (error as Error).message);
      }
    });
  },
};
