// Schedule model, validation and the run log (apps/mtw/.state/schedule-runs.jsonl).
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { stepsOf } from '../shared';
import { validateCron } from './cron';

export { stepsOf };

export const SCHEDULES_PATH = 'wiki/operations/schedules.json';
/** Permission ids a schedule may use. Anything that names a bypass is rejected, whatever the runner config calls it. */
export const BYPASS = /bypass|dangerous/i;

const stepSchema = z.object({
  operation: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  params: z.record(z.string()).optional(),
  runner: z.enum(['claude', 'codex']).optional(),
});
export type ChainStep = z.infer<typeof stepSchema>;

const scheduleSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'id: lowercase letters, digits and hyphens'),
  title: z.string().min(1),
  operation: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  params: z.record(z.string()).default({}),
  runner: z.enum(['claude', 'codex']),
  permission: z.string().default('default'),
  cron: z.string(),
  enabled: z.boolean().default(false),
  /** Operations in order; each starts when the previous terminal exits 0. Strings are shorthand for { operation }. */
  chain: z.array(z.union([z.string().regex(/^[a-z0-9][a-z0-9-]*$/).transform((operation) => ({ operation })), stepSchema])).optional(),
  /** Minutes a step may run before the chain gives up waiting (the terminal is left running). Default 360. */
  stepTimeoutMinutes: z.number().positive().optional(),
});
export type Schedule = z.infer<typeof scheduleSchema>;

export interface SchedulesFile {
  raw: Record<string, unknown>;
  schedules: { schedule: Schedule | null; id: string; error?: string }[];
}

export function parseSchedulesFile(json: unknown): SchedulesFile {
  const raw = (json && typeof json === 'object' ? json : {}) as Record<string, unknown>;
  const list = Array.isArray(raw.schedules) ? raw.schedules : [];
  const schedules = list.map((entry, i) => {
    const id = typeof (entry as { id?: unknown })?.id === 'string' ? ((entry as { id: string }).id) : `entry-${i}`;
    const r = scheduleSchema.safeParse(entry);
    return r.success ? { id, schedule: r.data } : { id, schedule: null, error: r.error.issues.map((x) => `${x.path.join('.') || 'schedule'}: ${x.message}`).join('; ') };
  });
  return { raw, schedules };
}

export function parseSchedule(input: unknown): Schedule {
  const r = scheduleSchema.safeParse(input);
  if (!r.success) throw new Error(r.error.issues.map((x) => `${x.path.join('.') || 'schedule'}: ${x.message}`).join('; '));
  return r.data;
}

export interface ValidationContext {
  operations: { id: string; runner: string }[];
  runners: Record<string, { permissions: { id: string; args: string[] }[] }>;
}

/** Everything wrong with a schedule, as sentences. An empty list means it may fire. */
export function problemsOf(s: Schedule, ctx: ValidationContext): string[] {
  const out: string[] = [];
  const cronError = validateCron(s.cron);
  if (cronError) out.push(`cron: ${cronError}`);
  const runner = ctx.runners[s.runner];
  if (!runner) out.push(`runner: unknown runner ${s.runner}`);
  if (BYPASS.test(s.permission)) out.push(`permission: "${s.permission}" is a bypass option; schedules never use one`);
  else if (runner) {
    const choice = runner.permissions.find((p) => p.id === s.permission);
    if (!choice) out.push(`permission: ${s.runner} has no option "${s.permission}"`);
    else if (choice.args.some((a) => BYPASS.test(a))) out.push(`permission: "${s.permission}" passes a bypass flag; schedules never use one`);
  }
  const ids = new Set(ctx.operations.map((o) => o.id));
  for (const step of stepsOf(s)) {
    if (!ids.has(step.operation)) out.push(`operation: unknown operation ${step.operation}`);
    if (/publish/i.test(step.operation)) out.push(`operation: ${step.operation} publishes; publishing is never scheduled`);
  }
  if (s.chain && s.chain.length > 12) out.push('chain: more than 12 steps');
  return out;
}

// ----------------------------------------------------------------------- run log

export type RunStatus = 'running' | 'ok' | 'failed' | 'timeout' | 'error' | 'interrupted';
export interface RunStep {
  index: number;
  operation: string;
  terminalId?: string;
  startedAt?: string;
  exitedAt?: string;
  exitCode?: number;
}
export interface RunRecord {
  runId: string;
  scheduleId: string;
  trigger: 'cron' | 'manual';
  startedAt: string;
  finishedAt?: string;
  status: RunStatus;
  reason?: string;
  steps: RunStep[];
}
export interface SkipRecord {
  at: string;
  scheduleId: string;
  trigger: 'cron' | 'manual';
  reason: string;
}

export type LogEvent =
  | { event: 'started'; at: string; runId: string; scheduleId: string; trigger: 'cron' | 'manual'; operations: string[] }
  | { event: 'step-started'; at: string; runId: string; scheduleId: string; index: number; operation: string; terminalId: string }
  | { event: 'step-finished'; at: string; runId: string; scheduleId: string; index: number; operation: string; terminalId: string; exitCode: number }
  | { event: 'finished'; at: string; runId: string; scheduleId: string; status: Exclude<RunStatus, 'running'>; reason?: string }
  | { event: 'skipped'; at: string; scheduleId: string; trigger: 'cron' | 'manual'; reason: string };

export class RunLog {
  readonly file: string;
  constructor(repoRoot: string) {
    this.file = path.join(repoRoot, 'apps', 'mtw', '.state', 'schedule-runs.jsonl');
  }

  append(e: LogEvent): void {
    try {
      mkdirSync(path.dirname(this.file), { recursive: true });
      appendFileSync(this.file, `${JSON.stringify(e)}\n`, 'utf8');
    } catch {
      /* the log must never break a run */
    }
  }

  events(): LogEvent[] {
    if (!existsSync(this.file)) return [];
    const out: LogEvent[] = [];
    for (const line of readFileSync(this.file, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      try {
        out.push(JSON.parse(line) as LogEvent);
      } catch {
        /* torn line */
      }
    }
    return out;
  }

  /** Runs, newest first, reduced from the events. */
  runs(scheduleId?: string): RunRecord[] {
    const byId = new Map<string, RunRecord>();
    for (const e of this.events()) {
      if (e.event === 'skipped') continue;
      if (scheduleId && e.scheduleId !== scheduleId) continue;
      if (e.event === 'started') {
        byId.set(e.runId, { runId: e.runId, scheduleId: e.scheduleId, trigger: e.trigger, startedAt: e.at, status: 'running', steps: e.operations.map((operation, index) => ({ index, operation })) });
        continue;
      }
      const run = byId.get(e.runId);
      if (!run) continue;
      if (e.event === 'step-started') {
        const step = run.steps[e.index] ?? (run.steps[e.index] = { index: e.index, operation: e.operation });
        step.terminalId = e.terminalId;
        step.startedAt = e.at;
      } else if (e.event === 'step-finished') {
        const step = run.steps[e.index] ?? (run.steps[e.index] = { index: e.index, operation: e.operation });
        step.exitedAt = e.at;
        step.exitCode = e.exitCode;
        step.terminalId = e.terminalId;
      } else {
        run.status = e.status;
        run.finishedAt = e.at;
        if (e.reason) run.reason = e.reason;
      }
    }
    return [...byId.values()].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  skips(scheduleId?: string): SkipRecord[] {
    return this.events()
      .filter((e): e is Extract<LogEvent, { event: 'skipped' }> => e.event === 'skipped' && (!scheduleId || e.scheduleId === scheduleId))
      .map((e) => ({ at: e.at, scheduleId: e.scheduleId, trigger: e.trigger, reason: e.reason }))
      .reverse();
  }
}
