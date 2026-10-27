import { z } from 'zod';
import { stepChoicesFromBody } from '../../server/core/prompts';
import { HttpError } from '../../server/router';
import type { ModuleSummary, ServerModule } from '../types';
import { nextRuns, parseCron, validateCron } from './lib/cron';
import { Scheduler } from './lib/scheduler';
import { SCHEDULES_PATH, BYPASS, parseSchedule, parseSchedulesFile, problemsOf } from './lib/store';
import type { Schedule } from './lib/store';
import { meta } from './meta';

const enableBody = z.object({ id: z.string().min(1), enabled: z.boolean() });
const idBody = z.object({ id: z.string().min(1) });
const runBody = z.object({ id: z.string().min(1), choices: z.record(z.unknown()).optional() });
const saveBody = z.object({ schedule: z.unknown(), originalId: z.string().optional() });

const parse = <T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, body: unknown): T => {
  const r = schema.safeParse(body ?? {});
  if (!r.success) throw new HttpError(400, r.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; '));
  return r.data;
};

/** The shared clock for this process (one per server). Tests start the app too, so it stays off under vitest. */
export let scheduler: Scheduler | null = null;

let summaryCache: { clock: Scheduler; at: number; views: Awaited<ReturnType<Scheduler['list']>> } | null = null;

export const server: ServerModule = {
  meta,
  async summary(): Promise<ModuleSummary> {
    // The clock's list() validates every schedule against all procedures (operations.list(), seconds on this repo),
    // so Home reuses it for 60 s unless a schedule is running; the Schedules view always reads it fresh.
    const clock = scheduler;
    let views: Awaited<ReturnType<Scheduler['list']>> | null = null;
    if (clock) {
      if (summaryCache && summaryCache.clock === clock && Date.now() - summaryCache.at < 60_000 && !summaryCache.views.some((v) => v.running)) views = summaryCache.views;
      else summaryCache = { clock, at: Date.now(), views: (views = await clock.list()) };
    }
    const enabled = views ? views.filter((v) => v.schedule?.enabled) : null;
    const nexts = (enabled ?? []).map((v) => v.next).filter((n): n is string => n !== null).sort();
    const next = nexts[0];
    const when = next ? `${next.slice(0, 16).replace('T', ' ')} UTC` : 'none due';
    return {
      items: [{ id: 'enabled', label: `Next scheduled run: ${when}`, count: enabled ? enabled.length : undefined, href: '/m/schedules', attention: false, source: 'wiki/operations/schedules.json' }],
      activity: (views ?? [])
        .filter((v) => v.schedule && (v.next || v.running))
        .sort((a, b) => (a.next ?? '').localeCompare(b.next ?? ''))
        .slice(0, 5)
        .map((v) => ({ id: v.id, kind: 'schedule' as const, label: v.schedule?.title ?? v.id, status: v.running ? 'running' : 'scheduled', ...(v.next ? { at: v.next } : {}), href: '/m/schedules' })),
    };
  },
  register(router, services) {
    const clock = new Scheduler(services);
    scheduler = clock;
    if (!process.env.VITEST && process.env.MTW_SCHEDULER !== 'off') clock.start();

    async function readFile() {
      return parseSchedulesFile(await services.wiki.readJson(SCHEDULES_PATH).catch(() => ({})));
    }
    async function write(raw: Record<string, unknown>, schedules: unknown[]): Promise<void> {
      try {
        await services.wiki.writeJson(SCHEDULES_PATH, { version: 1, ...raw, schedules });
      } catch (error) {
        throw new HttpError(409, (error as Error).message);
      }
      services.events.emit('wiki-changed', { module: 'schedules', paths: [SCHEDULES_PATH] });
    }
    /** Entries that failed to parse are written back untouched, so a typo is never lost by an unrelated edit. */
    async function rewrite(mutate: (list: Schedule[]) => Schedule[]): Promise<void> {
      const file = await readFile();
      const rawList = Array.isArray(file.raw.schedules) ? (file.raw.schedules as unknown[]) : [];
      const good = file.schedules.filter((e) => e.schedule).map((e) => e.schedule as Schedule);
      const next = mutate(good);
      const byId = new Map(next.map((s) => [s.id, s]));
      const out: unknown[] = [];
      rawList.forEach((item, i) => {
        const entry = file.schedules[i];
        if (entry?.schedule) {
          const replacement = byId.get(entry.schedule.id);
          if (replacement) {
            out.push(replacement);
            byId.delete(entry.schedule.id);
          }
        } else out.push(item);
      });
      for (const s of byId.values()) out.push(s);
      await write(file.raw, out);
    }

    router.get('/status', () => ({ owner: clock.owner(), now: new Date().toISOString(), running: clock.hasActive() }));
    router.get('/list', async () => ({ owner: clock.owner(), now: new Date().toISOString(), schedules: await clock.list() }));

    router.get('/schedule/:id', async ({ params }) => {
      const view = (await clock.list()).find((v) => v.id === params.id);
      if (!view) throw new HttpError(404, `unknown schedule: ${params.id}`);
      return { owner: clock.owner(), view, runs: clock.log.runs(params.id as string).slice(0, 20), skips: clock.log.skips(params.id as string).slice(0, 10) };
    });
    router.get('/runs', ({ query }) => clock.log.runs(query.get('schedule') ?? undefined).slice(0, 50));

    router.get('/preview-cron', ({ query }) => {
      const cron = query.get('cron') ?? '';
      const error = validateCron(cron);
      return { valid: !error, ...(error ? { error } : { next: nextRuns(parseCron(cron), new Date(), 5).map((d) => d.toISOString()) }) };
    });

    router.post('/save', async ({ body }) => {
      const b = parse(saveBody, body);
      const incoming = b.schedule as Record<string, unknown>;
      let schedule: Schedule;
      try {
        schedule = parseSchedule({ permission: 'default', params: {}, ...incoming });
      } catch (error) {
        throw new HttpError(400, (error as Error).message);
      }
      if (BYPASS.test(schedule.permission)) throw new HttpError(400, 'schedules never use a bypass permission');
      const operations = await services.operations.list();
      const runners = await services.wiki.readJson<Record<string, { permissions?: { id: string; args?: string[] }[] }>>('wiki/operations/runners.json');
      const problems = problemsOf(schedule, {
        operations: operations.map((o) => ({ id: o.id, runner: o.runner })),
        runners: Object.fromEntries(Object.entries(runners).map(([id, r]) => [id, { permissions: (r.permissions ?? []).map((p) => ({ id: p.id, args: p.args ?? [] })) }])),
      });
      if (problems.length) throw new HttpError(400, problems.join('; '));
      const file = await readFile();
      const originalId = b.originalId ?? '';
      const existing = b.originalId ? file.schedules.find((e) => e.id === originalId)?.schedule ?? null : null;
      if (b.originalId && !existing) throw new HttpError(404, `unknown schedule: ${b.originalId}`);
      if (!existing && file.schedules.some((e) => e.id === schedule.id)) throw new HttpError(409, `a schedule with id ${schedule.id} already exists`);
      if (existing && schedule.id !== originalId && file.schedules.some((e) => e.id === schedule.id)) throw new HttpError(409, `a schedule with id ${schedule.id} already exists`);
      // enabled is Matt's decision made through /enable; saving never turns a schedule on.
      const saved: Schedule = { ...schedule, enabled: existing ? existing.enabled : false };
      await rewrite((list) => {
        if (!existing) return [...list, saved];
        return list.map((s) => (s.id === originalId ? saved : s));
      });
      return { ok: true, schedule: saved };
    });

    router.post('/enable', async ({ body }) => {
      const b = parse(enableBody, body);
      const view = (await clock.list()).find((v) => v.id === b.id);
      if (!view?.schedule) throw new HttpError(404, `unknown or unreadable schedule: ${b.id}`);
      if (b.enabled && view.problems.length) throw new HttpError(400, `cannot enable: ${view.problems.join('; ')}`);
      await rewrite((list) => list.map((s) => (s.id === b.id ? { ...s, enabled: b.enabled } : s)));
      await services.decisions.append('operations', { actor: 'matt', module: 'schedules', subject: b.id, action: b.enabled ? 'enable-schedule' : 'disable-schedule', value: { cron: view.schedule.cron } });
      return { ok: true, enabled: b.enabled };
    });

    router.post('/run', async ({ body }) => {
      const b = parse(runBody, body);
      try {
        return await clock.runNow(b.id, stepChoicesFromBody(b.choices));
      } catch (error) {
        throw new HttpError(400, (error as Error).message);
      }
    });
  },
};
