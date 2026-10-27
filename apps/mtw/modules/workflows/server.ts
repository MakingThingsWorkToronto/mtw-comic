// New module (no wiki origin). Routes under /api/workflows.
import path from 'node:path';
import { z } from 'zod';
import { stepChoicesFromBody } from '../../server/core/prompts';
import { HttpError } from '../../server/router';
import type { ActivityRow, ModuleSummary, NeedItem, ServerModule, Services } from '../types';
import { RunEngine, sumTokens } from './lib/engine';
import type { RunState } from './lib/engine';
import { checkNewWorkflow } from './lib/create';
import { WORKFLOW_DIR, contextFor, loadWorkflows, readSvg, readTour } from './lib/library';
import { meta } from './meta';

const runBody = z.object({ id: z.string().min(1), inputs: z.record(z.string()).optional(), choices: z.record(z.unknown()).optional() });
const createBody = z.object({ workflow: z.unknown() });
const decideBody = z.object({ node: z.string().min(1), decision: z.enum(['approve', 'reject']), note: z.string().max(4000).optional() });

const parse = <T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, body: unknown): T => {
  const r = schema.safeParse(body ?? {});
  if (!r.success) throw new HttpError(400, r.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; '));
  return r.data;
};

export function summarize(run: RunState) {
  const nodes = Object.values(run.nodes);
  const t = sumTokens(run);
  return {
    runId: run.runId,
    workflowId: run.workflowId,
    title: run.title,
    status: run.status,
    startedAt: run.startedAt,
    ...(run.endedAt ? { endedAt: run.endedAt } : {}),
    done: nodes.filter((n) => n.status === 'done').length,
    total: nodes.length,
    tokens: t.total,
    estCostUsd: t.estCostUsd,
  };
}

/** Pure: Home rows from the engine's runs: gates waiting on Matt, runs today or still active, and counts. */
export function workflowsSummary(runs: RunState[], now = new Date()): ModuleSummary {
  const source = 'apps/mtw/.state/workflows/ (runs) + wiki/workflows/*.json';
  const day = (iso: string): string => new Date(iso).toDateString();
  const today = now.toDateString();
  const waiting = runs.filter((r) => r.status === 'waiting');
  const needs: NeedItem[] = waiting.flatMap((r) =>
    Object.entries(r.nodes)
      .filter(([, n]) => n.status === 'waiting')
      .map(([id, n]) => ({
        id: `workflow-${r.runId}-${id}`,
        title: `${r.title}: ${r.workflow.nodes.find((x) => x.id === id)?.label ?? id}`,
        next: 'Approve or reject the gate',
        since: n.startedAt ?? r.startedAt,
        href: `/m/workflows/run/${encodeURIComponent(r.runId)}`,
        action: 'Decide',
        source,
      })),
  );
  const shown = runs.filter((r) => day(r.startedAt) === today || r.status === 'running' || r.status === 'waiting');
  const activity: ActivityRow[] = shown.slice(0, 12).map((r) => ({ id: r.runId, kind: 'workflow-run', label: r.title, status: r.status, at: r.startedAt, href: `/m/workflows/run/${encodeURIComponent(r.runId)}` }));
  const running = runs.filter((r) => r.status === 'running').length;
  const failedToday = runs.filter((r) => r.status === 'failed' && day(r.startedAt) === today).length;
  return {
    items: [
      { id: 'gates', label: 'Runs waiting at a gate', count: waiting.length, href: '/m/workflows', attention: waiting.length > 0, source },
      { id: 'running', label: 'Runs running', count: running, href: '/m/workflows', source },
      { id: 'failed', label: 'Runs failed today', count: failedToday, href: '/m/workflows', source },
    ],
    needs,
    activity,
    ...(failedToday ? { health: [{ id: 'workflows-failed', label: 'Workflow runs today', state: 'warn' as const, detail: `${failedToday} failed today`, href: '/m/workflows', source }] } : {}),
  };
}

// The engine per Services, so summary() reads the same runs the routes serve.
const engineFor = new WeakMap<Services, RunEngine>();

export const server: ServerModule = {
  meta,
  summary(services) {
    const engine = engineFor.get(services);
    return engine ? workflowsSummary(engine.list()) : { items: [] };
  },
  register(router, services) {
    const stateDir = process.env.MTW_STATE_DIR || path.join(services.repoRoot, 'apps', 'mtw', '.state');
    const engine = new RunEngine(services, { stateDir, pollMs: process.env.VITEST || process.env.MTW_WORKFLOWS === 'off' ? 0 : 2000 });
    engineFor.set(services, engine);
    engine.start();

    router.get('/list', async () => {
      const loaded = await loadWorkflows(services);
      return loaded.map((l) => {
        const runs = engine.list(l.id);
        return {
          id: l.id,
          title: l.workflow?.title ?? l.id,
          domain: l.workflow?.domain ?? '',
          description: l.workflow?.description ?? '',
          nodes: l.workflow?.nodes.length ?? 0,
          gates: l.workflow?.nodes.filter((n) => n.kind === 'human-gate').length ?? 0,
          hasDiagram: Boolean(l.workflow?.diagram),
          needsInput: (l.workflow?.inputs ?? []).length > 0,
          problems: l.problems,
          last: runs[0] ? summarize(runs[0]) : null,
          active: runs.some((r) => r.status === 'running' || r.status === 'waiting'),
        };
      });
    });

    router.get('/workflow/:id', async ({ params }) => {
      const hit = (await loadWorkflows(services)).find((l) => l.id === params.id);
      if (!hit) throw new HttpError(404, `unknown workflow: ${params.id}`);
      const w = hit.workflow;
      let svg: string | undefined;
      let tour: Awaited<ReturnType<typeof readTour>> | undefined;
      if (w?.diagram) {
        const s = await readSvg(services.repoRoot, w.diagram.svg);
        if (!('error' in s)) svg = s.svg;
        if (w.diagram.tour) tour = await readTour(services.repoRoot, w.diagram.tour);
      }
      return { id: hit.id, workflow: w, problems: hit.problems, ...(svg ? { svg } : {}), ...(tour && !('error' in tour) ? { tour } : {}), runs: engine.list(hit.id).slice(0, 10).map(summarize) };
    });

    router.get('/runs', ({ query }) =>
      engine
        .list(query.get('workflow') ?? undefined)
        .slice(0, 50)
        .map(summarize),
    );

    router.get('/run/:id', ({ params }) => {
      const run = engine.get(params.id as string);
      if (!run) throw new HttpError(404, `unknown run: ${params.id}`);
      return { run, summary: summarize(run) };
    });

    router.post('/run', async ({ body }) => {
      const b = parse(runBody, body);
      const hit = (await loadWorkflows(services)).find((l) => l.id === b.id);
      if (!hit?.workflow) throw new HttpError(404, `unknown workflow: ${b.id}`);
      if (hit.problems.length) throw new HttpError(409, `This workflow has problems and cannot run: ${hit.problems.join('; ')}`);
      try {
        const choices = stepChoicesFromBody(b.choices);
        const unknownStep = Object.keys(choices).find((k) => !hit.workflow?.nodes.some((n) => n.id === k));
        if (unknownStep) throw new Error(`"${unknownStep}" is not a step of this workflow`);
        return { run: await engine.begin(hit.workflow, b.inputs ?? {}, choices) };
      } catch (error) {
        throw new HttpError(400, (error as Error).message);
      }
    });

    router.post('/run/:id/decide', async ({ params, body }) => {
      const b = parse(decideBody, body);
      if (!engine.get(params.id as string)) throw new HttpError(404, `unknown run: ${params.id}`);
      try {
        return { run: await engine.decide(params.id as string, b.node, b.decision, b.note) };
      } catch (error) {
        throw new HttpError(409, (error as Error).message);
      }
    });

    router.post('/run/:id/cancel', async ({ params }) => {
      if (!engine.get(params.id as string)) throw new HttpError(404, `unknown run: ${params.id}`);
      return { run: await engine.cancel(params.id as string) };
    });

    /** Save a new workflow from the form. Same schema and run checks as the files; never overwrites an existing id. */
    let creating: Promise<unknown> = Promise.resolve();
    router.post('/create', async ({ body }) => {
      const b = parse(createBody, body);
      const job = creating.then(async () => {
        const existing = (await loadWorkflows(services)).map((l) => l.id);
        // No diagram context: a workflow from the form names none (checkNewWorkflow refuses one).
        const { workflow, problems } = checkNewWorkflow(b.workflow, await contextFor(services, null), existing);
        if (!workflow || problems.length) throw new HttpError(problems.some((p) => p.includes('already exists')) ? 409 : 400, problems.join('; '));
        const file = `${WORKFLOW_DIR}/${workflow.id}.json`;
        if (await services.wiki.exists(file)) throw new HttpError(409, `a workflow with id "${workflow.id}" already exists; choose another id`);
        await services.wiki.writeJson(file, workflow);
        return { id: workflow.id, path: file };
      });
      creating = job.catch(() => undefined);
      return job;
    });

    /** Observe terminals now instead of waiting for the 2 s timer (the client calls it on focus; tests drive the engine with it). */
    router.post('/progress', async () => {
      await engine.progress();
      return { ok: true };
    });
  },
};
