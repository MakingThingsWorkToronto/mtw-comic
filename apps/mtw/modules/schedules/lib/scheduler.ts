// The clock. Every 30 s it reads wiki/operations/schedules.json, fires enabled schedules whose cron matches the
// current minute, and advances running chains. Every step is launched through services.operations.launch, so a
// scheduled run is an ordinary visible terminal in Operations. Never publishes, never passes a bypass option.
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseFrontmatter } from '../../../server/core/prompts';
import type { LaunchOpts } from '../../../server/core/prompts';
import type { RunnerId, Services, TerminalInfo } from '../../types';
import { cronMatches, nextRun, parseCron } from './cron';
import { RunLog, SCHEDULES_PATH, parseSchedulesFile, problemsOf, stepsOf } from './store';
import type { ChainStep, RunRecord, Schedule, ValidationContext } from './store';

export interface ScheduleView {
  id: string;
  /** null when the entry in the file could not be parsed. */
  schedule: Schedule | null;
  /** Everything wrong with it; a schedule with problems never fires. */
  problems: string[];
  /** ISO time of the next cron firing (null if disabled or invalid). */
  next: string | null;
  last: RunRecord | null;
  running: boolean;
}

export interface SchedulerOptions {
  now?: () => Date;
  tickMs?: number;
  progressMs?: number;
  /** Default 360 minutes. */
  stepTimeoutMs?: number;
  /** Where the single-owner lease lives (default apps/mtw/.state/scheduler-owner.json). */
  leaseFile?: string;
  /** Turn the lease off (tests). */
  noLease?: boolean;
}

interface Active {
  runId: string;
  scheduleId: string;
  steps: ChainStep[];
  schedule: Schedule;
  index: number;
  terminalId: string;
  stepStartedAt: number;
  timeoutMs: number;
  /** A human's confirmed provider/model/effort/permission per step index ("Run now" only; timed runs have none). */
  choices?: Record<string, LaunchOpts>;
}

const LEASE_FRESH_MS = 90_000;
const minuteKey = (d: Date): string => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}`;

export class Scheduler {
  readonly log: RunLog;
  private now: () => Date;
  private active = new Map<string, Active>();
  private timers: NodeJS.Timeout[] = [];
  private fired = new Set<string>();
  private lastTick: Date | null = null;
  private leaseFile: string;
  private useLease: boolean;
  private busy = false;

  constructor(private services: Services, private opts: SchedulerOptions = {}) {
    this.now = opts.now ?? (() => new Date());
    this.log = new RunLog(services.repoRoot);
    this.leaseFile = opts.leaseFile ?? path.join(services.repoRoot, 'apps', 'mtw', '.state', 'scheduler-owner.json');
    this.useLease = !opts.noLease;
  }

  // ------------------------------------------------------------------ lifecycle

  /** Start the intervals. Timers are unref'd so they never keep the process alive. */
  start(): void {
    if (this.timers.length) return;
    this.interruptStale();
    const tick = setInterval(() => void this.tick().catch(() => undefined), this.opts.tickMs ?? 30_000);
    const progress = setInterval(() => void this.progress().catch(() => undefined), this.opts.progressMs ?? 3_000);
    tick.unref();
    progress.unref();
    this.timers = [tick, progress];
    void this.tick().catch(() => undefined);
  }

  stop(): void {
    for (const t of this.timers) clearInterval(t);
    this.timers = [];
    if (this.useLease && this.ownsLease()) {
      try {
        writeFileSync(this.leaseFile, JSON.stringify({ pid: 0, at: new Date(0).toISOString() }));
      } catch {
        /* best effort */
      }
    }
  }

  /** Runs the previous process never finished are marked interrupted: their terminals died with it. */
  private interruptStale(): void {
    for (const run of this.log.runs()) {
      if (run.status === 'running' && !this.active.has(run.runId)) {
        this.log.append({ event: 'finished', at: this.now().toISOString(), runId: run.runId, scheduleId: run.scheduleId, status: 'interrupted', reason: 'the server stopped while this run was in progress' });
      }
    }
  }

  // ---------------------------------------------------------------------- lease

  private readLease(): { pid: number; at: string } | null {
    try {
      return JSON.parse(readFileSync(this.leaseFile, 'utf8')) as { pid: number; at: string };
    } catch {
      return null;
    }
  }

  private ownsLease(): boolean {
    return this.readLease()?.pid === process.pid;
  }

  /** One clock per repo: a second MTW server (a dev port) stays passive while another's lease is fresh and its process alive. */
  owner(): { mine: boolean; pid: number | null } {
    if (!this.useLease) return { mine: true, pid: process.pid };
    const lease = this.readLease();
    if (!lease || !lease.pid) return { mine: false, pid: null };
    return { mine: lease.pid === process.pid, pid: lease.pid };
  }

  private claimLease(): boolean {
    if (!this.useLease) return true;
    const lease = this.readLease();
    const fresh = lease && lease.pid && Date.now() - Date.parse(lease.at) < LEASE_FRESH_MS;
    let alive = false;
    if (fresh && lease.pid !== process.pid) {
      try {
        process.kill(lease.pid, 0);
        alive = true;
      } catch {
        alive = false;
      }
    }
    if (fresh && alive && lease.pid !== process.pid) return false;
    try {
      mkdirSync(path.dirname(this.leaseFile), { recursive: true });
      writeFileSync(this.leaseFile, JSON.stringify({ pid: process.pid, at: new Date().toISOString() }));
    } catch {
      return false;
    }
    return this.ownsLease();
  }

  // -------------------------------------------------------------------- context

  private async context(): Promise<ValidationContext> {
    const operations = await this.services.operations.list();
    const runners = await this.services.wiki.readJson<Record<string, { permissions?: { id: string; args?: string[] }[] }>>('wiki/operations/runners.json');
    return {
      operations: operations.map((o) => ({ id: o.id, runner: o.runner })),
      runners: Object.fromEntries(Object.entries(runners).map(([id, r]) => [id, { permissions: (r.permissions ?? []).map((p) => ({ id: p.id, args: p.args ?? [] })) }])),
    };
  }

  private async load(): Promise<ReturnType<typeof parseSchedulesFile>> {
    try {
      return parseSchedulesFile(await this.services.wiki.readJson(SCHEDULES_PATH));
    } catch {
      return { raw: {}, schedules: [] };
    }
  }

  // ----------------------------------------------------------------------- views

  async list(): Promise<ScheduleView[]> {
    const [file, ctx] = await Promise.all([this.load(), this.context()]);
    const runs = this.log.runs();
    const now = this.now();
    return file.schedules.map((entry) => {
      if (!entry.schedule) return { id: entry.id, schedule: null, problems: [entry.error ?? 'could not be read'], next: null, last: null, running: false };
      const s = entry.schedule;
      const problems = problemsOf(s, ctx);
      let next: string | null = null;
      if (s.enabled && !problems.length) next = nextRun(parseCron(s.cron), now)?.toISOString() ?? null;
      return { id: s.id, schedule: s, problems, next, last: runs.find((r) => r.scheduleId === s.id) ?? null, running: [...this.active.values()].some((a) => a.scheduleId === s.id) };
    });
  }

  // ------------------------------------------------------------------------ clock

  /** Fire every enabled schedule whose cron matches a minute not yet checked. Late ticks catch up at most 5 minutes. */
  async tick(now: Date = this.now()): Promise<string[]> {
    if (this.busy) return [];
    this.busy = true;
    try {
      if (!this.claimLease()) {
        this.lastTick = now;
        return [];
      }
      const from = this.lastTick ? new Date(Math.max(this.lastTick.getTime() + 60_000, now.getTime() - 5 * 60_000)) : now;
      from.setSeconds(0, 0);
      const minutes: Date[] = [];
      const end = new Date(now.getTime());
      end.setSeconds(0, 0);
      for (let m = new Date(from.getTime()); m.getTime() <= end.getTime(); m = new Date(m.getTime() + 60_000)) minutes.push(m);
      this.lastTick = now;
      if (!minutes.length) return [];
      const file = await this.load();
      const ctx = await this.context();
      const launched: string[] = [];
      for (const entry of file.schedules) {
        const s = entry.schedule;
        if (!s || !s.enabled) continue;
        let spec;
        try {
          spec = parseCron(s.cron);
        } catch {
          continue;
        }
        for (const m of minutes) {
          if (!cronMatches(spec, m)) continue;
          const key = `${s.id}|${minuteKey(m)}`;
          if (this.fired.has(key) || this.firedInLog(s.id, m)) continue;
          this.fired.add(key);
          if (this.fired.size > 500) this.fired.delete(this.fired.values().next().value as string);
          const problems = problemsOf(s, ctx);
          if (problems.length) {
            this.log.append({ event: 'skipped', at: now.toISOString(), scheduleId: s.id, trigger: 'cron', reason: problems.join('; ') });
            continue;
          }
          if (await this.fire(s, 'cron')) launched.push(s.id);
        }
      }
      return launched;
    } finally {
      this.busy = false;
    }
  }

  private firedInLog(scheduleId: string, minute: Date): boolean {
    const key = minuteKey(minute);
    return this.log.events().some((e) => e.event === 'started' && e.scheduleId === scheduleId && e.trigger === 'cron' && minuteKey(new Date(e.at)) === key);
  }

  /** Start a run now (the "Run now" button). Throws when the schedule is invalid or already running. */
  async runNow(id: string, choices: Record<string, LaunchOpts> = {}): Promise<RunRecord> {
    const file = await this.load();
    const found = file.schedules.find((e) => e.id === id);
    if (!found?.schedule) throw new Error(`unknown or unreadable schedule: ${id}`);
    const problems = problemsOf(found.schedule, await this.context());
    if (problems.length) throw new Error(problems.join('; '));
    if ([...this.active.values()].some((a) => a.scheduleId === id)) throw new Error('this schedule is already running');
    const run = await this.fire(found.schedule, 'manual', choices);
    if (!run) throw new Error('the first step could not be launched; see the run log');
    return this.log.runs(id)[0] as RunRecord;
  }

  // --------------------------------------------------------------------- running

  /** The Run mode value comes from wiki/operations/templates/scheduled-run.md (nothing agent-facing is hardcoded here). */
  private async runMode(): Promise<string> {
    const text = await this.services.wiki.readText('wiki/operations/templates/scheduled-run.md').catch(() => '');
    return String(parseFrontmatter(text).data.runMode ?? '');
  }

  private resolve(step: ChainStep, s: Schedule, runMode: string): { params: Record<string, string>; runner: RunnerId } {
    return {
      // Tells the procedure to end its session with /exit so the next step can start.
      params: { ...s.params, ...(step.params ?? {}), ...(runMode ? { unattended: runMode } : {}) },
      runner: (step.runner ?? s.runner) as RunnerId,
    };
  }

  private async launchStep(a: Pick<Active, 'schedule' | 'steps' | 'choices'>, index: number): Promise<TerminalInfo> {
    const step = a.steps[index] as ChainStep;
    const { params, runner } = this.resolve(step, a.schedule, await this.runMode());
    const picked = a.choices?.[String(index)];
    // A confirmed step uses what Matt chose (an absent permission is the default); everything else keeps the schedule's own settings.
    const permission = picked ? picked.permission : a.schedule.permission === 'default' ? undefined : a.schedule.permission;
    return this.services.operations.launch(step.operation, params, (picked?.runner ?? runner) as RunnerId, permission, undefined, picked?.choice);
  }

  private async fire(s: Schedule, trigger: 'cron' | 'manual', choices: Record<string, LaunchOpts> = {}): Promise<boolean> {
    const at = this.now().toISOString();
    if ([...this.active.values()].some((a) => a.scheduleId === s.id)) {
      this.log.append({ event: 'skipped', at, scheduleId: s.id, trigger, reason: 'the previous run is still going' });
      return false;
    }
    const steps = stepsOf(s);
    const runId = `r-${randomUUID().slice(0, 8)}`;
    this.log.append({ event: 'started', at, runId, scheduleId: s.id, trigger, operations: steps.map((x) => x.operation) });
    try {
      const t = await this.launchStep({ schedule: s, steps, choices }, 0);
      this.log.append({ event: 'step-started', at: this.now().toISOString(), runId, scheduleId: s.id, index: 0, operation: (steps[0] as ChainStep).operation, terminalId: t.id });
      this.active.set(runId, { runId, scheduleId: s.id, steps, schedule: s, index: 0, terminalId: t.id, stepStartedAt: this.now().getTime(), timeoutMs: (s.stepTimeoutMinutes ?? 0) * 60_000 || this.opts.stepTimeoutMs || 360 * 60_000, ...(Object.keys(choices).length ? { choices } : {}) });
      return true;
    } catch (error) {
      this.log.append({ event: 'finished', at: this.now().toISOString(), runId, scheduleId: s.id, status: 'error', reason: `could not launch ${(steps[0] as ChainStep).operation}: ${(error as Error).message}` });
      return false;
    }
  }

  /** Advance chains: start the next step when the terminal exited 0; stop at a failure or timeout. */
  async progress(): Promise<void> {
    if (!this.active.size) return;
    const terminals = this.services.terminals.list();
    for (const a of [...this.active.values()]) {
      const at = this.now().toISOString();
      const t = terminals.find((x) => x.id === a.terminalId);
      const step = a.steps[a.index] as ChainStep;
      if (!t) {
        this.active.delete(a.runId);
        this.log.append({ event: 'finished', at, runId: a.runId, scheduleId: a.scheduleId, status: 'error', reason: `terminal ${a.terminalId} is no longer known` });
        continue;
      }
      if (t.status === 'running') {
        if (this.now().getTime() - a.stepStartedAt > a.timeoutMs) {
          this.active.delete(a.runId);
          this.log.append({ event: 'finished', at, runId: a.runId, scheduleId: a.scheduleId, status: 'timeout', reason: `${step.operation} did not exit within ${Math.round(a.timeoutMs / 60_000)} minutes; its terminal is still running` });
        }
        continue;
      }
      const code = t.exitCode ?? -1;
      this.log.append({ event: 'step-finished', at, runId: a.runId, scheduleId: a.scheduleId, index: a.index, operation: step.operation, terminalId: t.id, exitCode: code });
      if (code !== 0) {
        this.active.delete(a.runId);
        this.log.append({ event: 'finished', at, runId: a.runId, scheduleId: a.scheduleId, status: 'failed', reason: `${step.operation} exited with code ${code}; the chain stops` });
        continue;
      }
      const nextIndex = a.index + 1;
      if (nextIndex >= a.steps.length) {
        this.active.delete(a.runId);
        this.log.append({ event: 'finished', at, runId: a.runId, scheduleId: a.scheduleId, status: 'ok' });
        continue;
      }
      try {
        const next = await this.launchStep(a, nextIndex);
        a.index = nextIndex;
        a.terminalId = next.id;
        a.stepStartedAt = this.now().getTime();
        this.log.append({ event: 'step-started', at: this.now().toISOString(), runId: a.runId, scheduleId: a.scheduleId, index: nextIndex, operation: (a.steps[nextIndex] as ChainStep).operation, terminalId: next.id });
      } catch (error) {
        this.active.delete(a.runId);
        this.log.append({ event: 'finished', at, runId: a.runId, scheduleId: a.scheduleId, status: 'error', reason: `could not launch ${(a.steps[nextIndex] as ChainStep).operation}: ${(error as Error).message}` });
      }
    }
  }

  hasActive(): boolean {
    return this.active.size > 0;
  }
}

void existsSync;
