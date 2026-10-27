import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { RunnerId, TerminalInfo, TerminalManager, TokenTotals } from '../../modules/types';
import type { Events } from './events';
import { releasePty, spawnPty } from './pty';
import type { IPty } from './pty';
import { OtelReceiver } from './otel';
import { assertModelFitsRunner, attrSafe, executableFor, fillTemplate, promptHandoverOf } from './runners';
import type { RunnersConfig } from './runners';
import type { StudioSettings } from './studioSettings';
import { codexSessionIdOf, defaultHomes, findTranscript, isBypass, loadPastTerminals, readRunFile, transcriptKind } from './resume';
import type { Homes } from './resume';
import { PricingTable, appendUsageLine, budgetStatuses, readBudgets, writeWeeklyRollup } from './spend';
import type { BudgetStatus } from './spend';
import { TokenTracker, loadRunRecords, summarizeRuns } from './tokens';
import { renderTemplate } from './templates';
import type { PlanLimits, RunRecord, TranscriptHandle, UsageSummary } from './tokens';

export const RING_BYTES = 256 * 1024;

type SpawnOpts = Parameters<TerminalManager['spawn']>[0];
const MAX_PARAM_CHARS = 500;

interface Entry {
  info: TerminalInfo;
  proc: IPty;
  ring: string;
  listeners: Set<(frame: TerminalFrame) => void>;
  runFile: string;
  telemetry: Record<string, unknown>;
  handles: TranscriptHandle[];
  timer?: NodeJS.Timeout;
  lastTokens: string;
  killing?: boolean;
  /** ms epoch of the last output or input. */
  active: number;
}

/** How often idle runs are looked for. */
const IDLE_SWEEP_MS = 30_000;

export type TerminalFrame = { type: 'output'; data: string } | { type: 'exit'; exitCode: number };

export interface TerminalServiceOptions {
  repoRoot: string;
  /** apps/mtw/.state */
  stateDir: string;
  runners: () => RunnersConfig;
  /** config/studio.json; each runner's model and effort. Absent in tests that do not set it. */
  settings?: () => StudioSettings;
  events: Events;
  tokens?: TokenTracker;
  /** How often bound transcripts are re-read while a terminal runs. */
  tokenPollMs?: number;
  /** Defaults to wiki/operations/pricing.json under repoRoot. */
  pricing?: PricingTable;
  /** Where the provider CLIs keep their transcripts; defaults to ~/.claude and ~/.codex. */
  homes?: Partial<Homes>;
  /** MTW_OTEL_FORWARD */
  otelForwardUrl?: string;
}

/** Terminals live here, in the server: navigating away in the browser never ends one. */
export class TerminalService implements TerminalManager {
  private entries = new Map<string, Entry>();
  /** Terminals from before this Studio process started, read back from each run.json under .state/runs. */
  private past = new Map<string, TerminalInfo>();
  private homes: Homes;
  private tokens: TokenTracker;
  readonly pricing: PricingTable;
  /** Set once the HTTP server is listening; the port goes into each runner's `env` template. */
  private port = 0;
  readonly otel: OtelReceiver;
  constructor(private opts: TerminalServiceOptions) {
    this.tokens = opts.tokens ?? new TokenTracker();
    this.homes = { ...defaultHomes(), ...opts.homes };
    for (const t of loadPastTerminals(opts.stateDir)) this.past.set(t.id, t);
    this.pricing = opts.pricing ?? new PricingTable(path.join(opts.repoRoot, 'wiki', 'operations', 'pricing.json'));
    this.otel = new OtelReceiver({
      stateDir: opts.stateDir,
      forwardUrl: opts.otelForwardUrl,
      terminalForSession: (sid) => [...this.entries.values()].find((e) => e.info.sessionId === sid)?.info.id,
      onUpdate: (id) => {
        const e = this.entries.get(id);
        if (e) this.pollTokens(e);
      },
    });
  }

  setPort(port: number): void {
    this.port = port;
  }

  get stateDir(): string {
    return this.opts.stateDir;
  }

  /** Every run on disk plus the live ones, re-estimated with the current price table. */
  usageRecords(): RunRecord[] {
    return loadRunRecords(this.opts.stateDir, this.list()).map((r) => (r.tokens ? { ...r, tokens: this.pricing.withEstimate(r.tokens) } : r));
  }

  /** Token usage across every run on disk plus the live ones. */
  usageSummary(): UsageSummary & { budgets: BudgetStatus[]; pricing: { asOf?: string; source?: string } } {
    const records = this.usageRecords();
    const p = this.pricing.get();
    return { ...summarizeRuns(records), budgets: budgetStatuses(readBudgets(this.opts.repoRoot), records), pricing: { ...(p.asOf ? { asOf: p.asOf } : {}), ...(p.source ? { source: p.source } : {}) } };
  }

  /** Attribution for a module item: runs filtered by operation, module and/or subject. */
  tokensBy(filter: { operation?: string | undefined; module?: string | undefined; subject?: string | undefined }): { summary: UsageSummary; runs: RunRecord[] } {
    const runs = this.usageRecords().filter((r) => (!filter.operation || r.operation === filter.operation) && (!filter.module || r.module === filter.module) && (!filter.subject || r.subject === filter.subject));
    runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    return { summary: summarizeRuns(runs), runs: runs.slice(0, 50) };
  }

  /** Latest Codex plan-limit snapshot seen in any run. */
  latestPlanLimits(): PlanLimits | null {
    let best: PlanLimits | null = null;
    for (const r of loadRunRecords(this.opts.stateDir, this.list())) if (r.rateLimits && (!best || r.rateLimits.at > best.at)) best = r.rateLimits;
    return best;
  }

  promptFile(id: string): string | null {
    if (!/^t-[0-9a-f]{8}$/.test(id)) return null;
    const file = path.join(this.opts.stateDir, 'runs', id, 'prompt.md');
    return existsSync(file) ? file : null;
  }

  list(): TerminalInfo[] {
    const live = [...this.entries.values()].map((e) => this.snapshot(e));
    const earlier = [...this.past.values()].filter((t) => !this.entries.has(t.id));
    return [...live, ...earlier].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  get(id: string): TerminalInfo | undefined {
    const e = this.entries.get(id);
    return e ? this.snapshot(e) : this.past.get(id);
  }

  /**
   * Reopen an ended or crashed terminal's saved conversation in a NEW terminal: same runner, model, effort, folder and
   * operation, using the runner's resumeArgs with the stored provider session id. Never reuses a bypass permission.
   */
  resume(id: string, change: { model?: string; effort?: string; permission?: string } = {}): TerminalInfo {
    const old = this.get(id);
    if (!old) throw new Error('That terminal is not in the list.');
    if (old.status === 'running') throw new Error('That terminal is still running; use it as it is.');
    const runner = this.opts.runners()[old.runner];
    if (!runner || !runner.resumeArgs.length) throw new Error(`${runner?.label ?? old.runner} has no way to reopen a saved conversation.`);
    if (!old.sessionId) throw new Error("Studio did not save this terminal's conversation id, so it cannot be reopened. Start a new terminal instead.");
    const rec = readRunFile(this.opts.stateDir, id);
    const cwd = rec?.cwd ?? this.opts.repoRoot;
    if (!findTranscript(transcriptKind(runner), this.homes, cwd, old.sessionId)) {
      throw new Error(`The saved transcript for this conversation (${old.sessionId}) is missing from this computer, so it cannot be reopened.`);
    }
    const saved = rec?.permission ? runner.permissions.find((p) => p.id === rec.permission) : undefined;
    // Matt's choice in the Resume confirm wins; a bypass permission is never reused or accepted.
    const picked = change.permission ? runner.permissions.find((p) => p.id === change.permission) : undefined;
    if (change.permission && !picked) throw new Error(`${runner.label} has no permission option "${change.permission}"`);
    if (picked && isBypass(picked.args)) throw new Error('that permission mode is never offered from Studio');
    const permission = picked ? picked.id : saved && !isBypass(saved.args) ? saved.id : undefined;
    return this.spawn(
      {
        runner: old.runner,
        title: old.title,
        ...(old.operation ? { operation: old.operation } : {}),
        ...(old.module ? { module: old.module } : {}),
        ...(old.subject ? { subject: old.subject } : {}),
        cwd,
        ...(permission ? { permission } : {}),
        // The original model and effort, unless Matt changed them in the Resume confirm (the provider never changes).
        ...(change.model?.trim() || old.model ? { model: change.model?.trim() || old.model } : {}),
        ...(change.effort?.trim() || old.effort ? { effort: change.effort?.trim() || old.effort } : {}),
      },
      { sessionId: old.sessionId, from: old.id },
    );
  }

  private snapshot(e: Entry): TerminalInfo {
    return { ...e.info, lastActivityAt: new Date(e.active).toISOString() };
  }

  spawn(o: SpawnOpts, resume?: { sessionId: string; from: string }): TerminalInfo {
    const runner = this.opts.runners()[o.runner];
    if (!runner) throw new Error(`unknown runner: ${o.runner}`);
    if (runner.status === 'untested') throw new Error(`runner ${o.runner} is untested and cannot be launched yet${runner.note ? `: ${runner.note}` : ''}`);
    const id = `t-${randomUUID().slice(0, 8)}`;
    const runDir = path.join(this.opts.stateDir, 'runs', id);
    mkdirSync(runDir, { recursive: true });

    const args = [...runner.args];
    // Resuming puts the CLI's own resume form first (codex takes it as a subcommand) and starts no new session.
    if (resume) args.push(...runner.resumeArgs.map((a) => fillTemplate(a, { sessionId: resume.sessionId })));
    if (o.permission) {
      const choice = runner.permissions.find((p) => p.id === o.permission);
      if (!choice) throw new Error(`runner ${o.runner} has no permission option "${o.permission}"`);
      args.push(...choice.args);
    }
    // The model and effort: this launch's own choice, else the runner's default in config/studio.json (Operations > Defaults).
    let preset: { model?: string; effort?: string } = {};
    try {
      preset = this.opts.settings?.().runners[o.runner] ?? {};
    } catch (error) {
      console.warn(`[terminals] config/studio.json unreadable; using the CLI's defaults: ${(error as Error).message}`);
    }
    const model = o.model ?? preset.model ?? '';
    const effort = o.effort ?? preset.effort ?? '';
    // A model listed under another provider is refused here too (every launch goes through this door).
    if (o.model) assertModelFitsRunner(this.opts.runners(), o.runner, o.model);
    if (model && runner.modelArgs.length) args.push(...runner.modelArgs.map((a) => fillTemplate(a, { model })));
    if (effort && runner.effortArgs.length) args.push(...runner.effortArgs.map((a) => fillTemplate(a, { effort })));
    // MTW chooses the session id (when the runner takes one) so the transcript can be found without guessing.
    const sessionId = resume ? resume.sessionId : runner.sessionIdArgs.length ? randomUUID() : undefined;
    if (sessionId && !resume) args.push(...runner.sessionIdArgs.map((a) => fillTemplate(a, { sessionId })));
    let promptPath: string | undefined;
    if (o.prompt && !resume && promptHandoverOf(runner) === 'arg-file-line') {
      // Always hand over a file and one self-contained line: a multi-line argv was cut at its first newline on
      // Windows (measured 2026-10-09: claude saw only line 1 and asked what to do). The file is also the run's record.
      promptPath = path.join(runDir, 'prompt.md');
      writeFileSync(promptPath, o.prompt, 'utf8');
      args.push(renderTemplate(this.opts.repoRoot, 'handover', { title: o.title, promptPath }));
    }

    const executable = executableFor(runner);
    const cwd = o.cwd ?? this.opts.repoRoot;
    const vars = { terminalId: id, operation: attrSafe(o.operation ?? 'terminal'), module: attrSafe(o.module ?? ''), sessionId: sessionId ?? '', port: String(this.port) };
    const useOtel = runner.tokenSource === 'otel' && this.port > 0;
    const env: NodeJS.ProcessEnv = { ...process.env };
    // Runner env templates are OTel exporter settings; without a listening receiver they are not injected.
    if (useOtel || runner.tokenSource !== 'otel') for (const [k, v] of Object.entries(runner.env)) env[k] = fillTemplate(v, vars);
    const proc = spawnPty(executable, args, { cwd, env });
    const startedAtDate = new Date();
    const info: TerminalInfo = {
      id,
      runner: o.runner as RunnerId,
      title: o.title,
      ...(o.operation ? { operation: o.operation } : {}),
      ...(o.module ? { module: o.module } : {}),
      pid: proc.pid,
      startedAt: startedAtDate.toISOString(),
      status: 'running',
      ...(sessionId ? { sessionId } : {}),
      ...(o.subject ? { subject: o.subject } : {}),
      ...(promptPath ? { hasPrompt: true } : {}),
      lastActivityAt: startedAtDate.toISOString(),
      ...(o.idleMinutes ? { idleMinutes: o.idleMinutes } : {}),
      ...(model && runner.modelArgs.length ? { model } : {}),
      ...(effort && runner.effortArgs.length ? { effort } : {}),
      ...(resume ? { resumedFrom: resume.from } : {}),
    };
    const runFile = path.join(runDir, 'run.json');
    const telemetry: Record<string, unknown> = {
      ...info,
      cwd,
      executable,
      permission: o.permission ?? null,
      params: o.params ? Object.fromEntries(Object.entries(o.params).map(([k, v]) => [k, v.slice(0, MAX_PARAM_CHARS)])) : null,
      promptChars: o.prompt?.length ?? 0,
      promptPath: promptPath ?? null,
      // A short prompt is already in argv; a long one lives in prompt.md.
      prompt: promptPath ? null : (o.prompt ?? null),
    };
    const handles: TranscriptHandle[] = [];
    for (const source of [runner.tokenSource, runner.tokenFallback]) {
      const h = this.tokens.track(source, { terminalId: id, cwd, startedAt: startedAtDate, sessionId });
      if (h) handles.push(h);
    }
    Object.assign(telemetry, { tokenSource: runner.tokenSource, otel: useOtel });
    const entry: Entry = { info, proc, ring: '', listeners: new Set(), runFile, telemetry, handles, lastTokens: '', active: startedAtDate.getTime() };
    if (o.idleMinutes) this.startIdleSweep();
    this.entries.set(id, entry);
    this.writeTelemetry(entry);
    if (useOtel || handles.length) {
      entry.timer = setInterval(() => this.pollTokens(entry), this.opts.tokenPollMs ?? 5000);
      entry.timer.unref();
    }

    proc.onData((data) => {
      this.touch(entry);
      entry.ring += data;
      if (entry.ring.length > RING_BYTES) entry.ring = entry.ring.slice(entry.ring.length - RING_BYTES);
      for (const fn of entry.listeners) fn({ type: 'output', data });
    });
    proc.onExit(({ exitCode }) => {
      if (entry.timer) clearInterval(entry.timer);
      this.pollTokens(entry, false);
      for (const h of entry.handles) h.dispose();
      entry.info.status = 'exited';
      entry.info.exitCode = exitCode;
      entry.info.exitedAt = new Date().toISOString();
      releasePty(proc);
      Object.assign(entry.telemetry, { status: 'exited', exitCode, exitedAt: entry.info.exitedAt });
      this.writeTelemetry(entry);
      this.recordUsage(entry);
      for (const fn of entry.listeners) fn({ type: 'exit', exitCode });
      this.prune();
      this.announce();
    });
    this.announce();
    return { ...info };
  }

  kill(id: string): void {
    const e = this.entries.get(id);
    if (!e) throw new Error(`unknown terminal: ${id}`);
    // A second kill() while the first is landing crashes node-pty on Windows ConPTY; make it idempotent.
    if (e.info.status === 'running' && !e.killing) {
      e.killing = true;
      e.proc.kill();
    }
  }

  /** Subscribe to a terminal: returns the scrollback to replay and a detach function. */
  attach(id: string, listener: (frame: TerminalFrame) => void): { replay: string; exit?: number; detach: () => void } | null {
    const e = this.entries.get(id);
    if (!e) return null;
    e.listeners.add(listener);
    return { replay: e.ring, ...(e.info.exitCode !== undefined ? { exit: e.info.exitCode } : {}), detach: () => e.listeners.delete(listener) };
  }

  write(id: string, data: string): void {
    const e = this.entries.get(id);
    if (e?.info.status === 'running') {
      this.touch(e);
      e.proc.write(data);
    }
  }

  private touch(e: Entry): void {
    e.active = Date.now();
  }

  private idleTimer: NodeJS.Timeout | undefined;
  private startIdleSweep(): void {
    if (this.idleTimer) return;
    this.idleTimer = setInterval(() => this.sweepIdle(), IDLE_SWEEP_MS);
    this.idleTimer.unref();
  }

  /** Close runs that declared idleMinutes and have been quiet that long. Returns the ids closed. */
  sweepIdle(now = Date.now()): string[] {
    const closed: string[] = [];
    for (const e of this.entries.values()) {
      const limit = e.info.idleMinutes;
      if (e.info.status !== 'running' || !limit || now - e.active < limit * 60_000) continue;
      e.info.closedReason = 'idle';
      e.telemetry.closedReason = 'idle';
      closed.push(e.info.id);
      this.kill(e.info.id);
    }
    return closed;
  }

  resize(id: string, cols: number, rows: number): void {
    const e = this.entries.get(id);
    if (e?.info.status === 'running' && cols > 0 && rows > 0) {
      try {
        e.proc.resize(Math.floor(cols), Math.floor(rows));
      } catch {
        /* resize after exit races are harmless */
      }
    }
  }

  runningCount(): number {
    return [...this.entries.values()].filter((e) => e.info.status === 'running').length;
  }

  /** Kill everything still running and wait (bounded) for the exits to land. */
  async shutdown(timeoutMs = 4000): Promise<void> {
    if (this.idleTimer) clearInterval(this.idleTimer);
    const running = [...this.entries.values()].filter((e) => e.info.status === 'running');
    for (const e of running) {
      if (e.killing) continue;
      e.killing = true;
      try {
        e.proc.kill();
      } catch {
        /* gone */
      }
    }
    this.otel.stop();
    const deadline = Date.now() + timeoutMs;
    while (running.some((e) => e.info.status === 'running') && Date.now() < deadline) await new Promise((r) => setTimeout(r, 50));
  }

  /** On exit: one append-only line in .state/usage.jsonl, and the weekly rollup in the wiki when the run used tokens. */
  private recordUsage(e: Entry): void {
    const i = e.info;
    appendUsageLine(this.opts.stateDir, {
      id: i.id,
      runner: i.runner,
      ...(i.tokens?.model ? { model: i.tokens.model } : {}),
      title: i.title,
      ...(i.operation ? { operation: i.operation } : {}),
      ...(i.module ? { module: i.module } : {}),
      ...(i.subject ? { subject: i.subject } : {}),
      startedAt: i.startedAt,
      ...(i.exitedAt ? { exitedAt: i.exitedAt } : {}),
      durationMs: Date.parse(i.exitedAt ?? i.startedAt) - Date.parse(i.startedAt),
      status: i.status,
      ...(i.exitCode !== undefined ? { exitCode: i.exitCode } : {}),
      ...(i.tokens ? { tokens: i.tokens } : {}),
    });
    if (!i.tokens) return;
    try {
      writeWeeklyRollup(this.opts.repoRoot, this.usageRecords(), new Date(i.startedAt));
    } catch {
      /* the rollup is a convenience; never break a run */
    }
  }

  /** OTel numbers win; transcript parsing is the fallback. Announces only when the totals changed. */
  private pollTokens(e: Entry, announce = true): void {
    let totals: TokenTotals | null = this.otel.totals(e.info.id);
    let transcript: string | null = null;
    for (const h of e.handles) {
      const limits = h.rateLimits?.();
      if (limits) e.telemetry.rateLimits = limits;
      const t = h.current();
      transcript ??= h.transcriptPath();
      if (!totals && t) totals = t;
    }
    if (transcript) {
      e.telemetry.transcript = transcript;
      // Codex picks its own conversation id: read it from the rollout once it is bound, so the run can be resumed later.
      if (!e.info.sessionId && path.basename(transcript).startsWith('rollout-')) {
        const sid = codexSessionIdOf(transcript);
        if (sid) {
          e.info.sessionId = sid;
          e.telemetry.sessionId = sid;
          this.writeTelemetry(e);
          if (announce) this.announce();
        }
      }
    }
    if (!totals) return;
    totals = this.pricing.withEstimate(totals);
    const key = JSON.stringify(totals);
    if (key === e.lastTokens) return;
    e.lastTokens = key;
    e.info.tokens = totals;
    e.telemetry.tokens = totals;
    this.writeTelemetry(e);
    if (announce) this.announce();
  }

  private announce(): void {
    this.opts.events.emit('terminal', this.list());
  }

  /** Keep the newest 100 exited terminals in memory; run.json on disk is the durable record. */
  private prune(): void {
    const exited = [...this.entries.values()].filter((e) => e.info.status === 'exited').sort((a, b) => (b.info.exitedAt ?? '').localeCompare(a.info.exitedAt ?? ''));
    for (const e of exited.slice(100)) {
      this.past.set(e.info.id, this.snapshot(e));
      this.entries.delete(e.info.id);
    }
  }

  private writeTelemetry(e: Entry): void {
    try {
      writeFileSync(e.runFile, `${JSON.stringify(e.telemetry, null, 2)}\n`, 'utf8');
    } catch {
      /* telemetry must never break a run */
    }
  }
}
