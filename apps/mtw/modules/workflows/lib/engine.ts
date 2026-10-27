// New module (no wiki origin): the run engine. A run walks the workflow graph node by node.
// 'operation'/'script' nodes launch through services.operations.launch (a visible terminal, tokens tracked) and finish
// when that terminal exits 0. 'human-gate' nodes wait for Matt's click; the decision is appended through
// services.decisions (wiki/workflows/decisions.jsonl). Run state is JSON under <stateDir>/workflows/runs/.
import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { LaunchOpts } from '../../../server/core/prompts';
import type { Services, TokenTotals } from '../../types';
import { edgeWhen, renderTemplate } from './schema';
import type { Workflow, WorkflowNode } from './schema';

export type NodeStatus = 'pending' | 'running' | 'waiting' | 'done' | 'failed' | 'skipped';
export type RunStatus = 'running' | 'waiting' | 'succeeded' | 'failed' | 'cancelled';

export interface NodeRun {
  status: NodeStatus;
  terminalId?: string;
  startedAt?: string;
  endedAt?: string;
  exitCode?: number;
  /** Gate: Matt's note. */
  note?: string;
  decision?: 'approve' | 'reject';
  error?: string;
  /** Last token totals seen for the node's terminal (kept after the terminal is gone). */
  tokens?: TokenTotals;
}

export interface RunState {
  runId: string;
  workflowId: string;
  title: string;
  status: RunStatus;
  startedAt: string;
  endedAt?: string;
  inputs: Record<string, string>;
  /** The workflow as it was when the run started, so history survives later edits. */
  workflow: Workflow;
  nodes: Record<string, NodeRun>;
  /**
   * What Matt confirmed when he clicked Run: provider, permission, model and effort per step (by node id).
   * A step with no entry launches with its procedure's frontmatter default, so scheduled/autonomous runs are unchanged.
   */
  choices?: Record<string, LaunchOpts>;
}

export interface EngineOptions {
  stateDir: string;
  now?: () => Date;
  /** Background polling interval; 0 disables the timer (tests call progress() themselves). */
  pollMs?: number;
}

const TERMINAL: NodeStatus[] = ['done', 'failed', 'skipped'];
const ACTIVE: RunStatus[] = ['running', 'waiting'];

export class RunEngine {
  private runs = new Map<string, RunState>();
  private dir: string;
  private now: () => Date;
  private chain: Promise<unknown> = Promise.resolve();
  private timer: NodeJS.Timeout | null = null;

  constructor(private services: Services, private opts: EngineOptions) {
    this.dir = path.join(opts.stateDir, 'workflows', 'runs');
    this.now = opts.now ?? (() => new Date());
    mkdirSync(this.dir, { recursive: true });
    this.load();
  }

  // ------------------------------------------------------------------ persistence

  private load(): void {
    for (const f of readdirSync(this.dir)) {
      if (!f.endsWith('.json')) continue;
      try {
        const run = JSON.parse(readFileSync(path.join(this.dir, f), 'utf8')) as RunState;
        if (run?.runId && run.nodes && run.workflow) this.runs.set(run.runId, run);
      } catch {
        /* a half-written or foreign file is ignored */
      }
    }
  }

  private save(run: RunState): void {
    const file = path.join(this.dir, `${run.runId}.json`);
    const tmp = `${file}.${process.pid}.tmp`;
    const text = JSON.stringify(run, null, 2);
    writeFileSync(tmp, text);
    // On Windows a scanner or indexer briefly holding either file makes rename fail with EPERM/EACCES/EBUSY.
    for (let attempt = 0; ; attempt++) {
      try {
        renameSync(tmp, file);
        return;
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code ?? '';
        if (!['EPERM', 'EACCES', 'EBUSY'].includes(code)) throw error;
        if (attempt >= 5) {
          writeFileSync(file, text); // last resort: not atomic, but the run state is local telemetry
          try {
            unlinkSync(tmp);
          } catch {
            /* left for the next save to overwrite */
          }
          return;
        }
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 25 * (attempt + 1));
      }
    }
  }

  start(): void {
    if (this.timer || !this.opts.pollMs) return;
    this.timer = setInterval(() => void this.progress().catch(() => undefined), this.opts.pollMs);
    this.timer.unref();
    void this.progress().catch(() => undefined);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  // ------------------------------------------------------------------------ reads

  get(runId: string): RunState | undefined {
    return this.runs.get(runId);
  }

  list(workflowId?: string): RunState[] {
    return [...this.runs.values()].filter((r) => !workflowId || r.workflowId === workflowId).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  // ---------------------------------------------------------------------- actions

  /** Begin a run. The caller has already refused a workflow with problems. */
  async begin(workflow: Workflow, inputs: Record<string, string> = {}, choices: Record<string, LaunchOpts> = {}): Promise<RunState> {
    const missing = (workflow.inputs ?? []).filter((i) => i.required && !(inputs[i.name] ?? '').trim()).map((i) => i.label);
    if (missing.length) throw new Error(`Needed to start: ${missing.join(', ')}`);
    const at = this.now();
    const stamp = at.toISOString().replace(/\D/g, '').slice(0, 14);
    const run: RunState = {
      runId: `wf-${stamp}-${randomBytes(2).toString('hex')}`,
      workflowId: workflow.id,
      title: workflow.title,
      status: 'running',
      startedAt: at.toISOString(),
      inputs: Object.fromEntries((workflow.inputs ?? []).map((i) => [i.name, (inputs[i.name] ?? '').trim()])),
      workflow,
      nodes: Object.fromEntries(workflow.nodes.map((n) => [n.id, { status: 'pending' as NodeStatus }])),
      ...(Object.keys(choices).length ? { choices } : {}),
    };
    this.runs.set(run.runId, run);
    this.save(run);
    await this.progress();
    return this.runs.get(run.runId) as RunState;
  }

  /** Matt's click on a human gate. Recorded in wiki/workflows/decisions.jsonl. */
  async decide(runId: string, nodeId: string, decision: 'approve' | 'reject', note = ''): Promise<RunState> {
    return this.serial(async () => {
      const run = this.runs.get(runId);
      const node = run?.nodes[nodeId];
      const def = run?.workflow.nodes.find((n) => n.id === nodeId);
      if (!run || !node || !def) throw new Error('unknown run or node');
      if (def.kind !== 'human-gate' || node.status !== 'waiting') throw new Error(`"${def.label}" is not waiting for a decision`);
      const text = note.trim();
      if (decision === 'approve' && def.noteRequired && !text) throw new Error(`"${def.label}" needs a note before it can be approved`);
      await this.services.decisions.append('workflows', {
        actor: 'matt',
        module: 'workflows',
        subject: `${runId}:${nodeId}`,
        action: decision,
        value: { workflow: run.workflowId, node: nodeId },
        ...(text ? { note: text } : {}),
      });
      node.decision = decision;
      node.note = text;
      node.status = decision === 'approve' ? 'done' : 'failed';
      node.endedAt = this.now().toISOString();
      if (decision === 'reject') node.error = text ? `Rejected: ${text}` : 'Rejected';
      this.save(run);
      await this.step();
      return run;
    });
  }

  /** Stop a run: kill running terminals, mark open nodes skipped. */
  async cancel(runId: string): Promise<RunState> {
    return this.serial(async () => {
      const run = this.runs.get(runId);
      if (!run) throw new Error('unknown run');
      if (!ACTIVE.includes(run.status)) return run;
      for (const node of Object.values(run.nodes)) {
        if (node.status === 'running' && node.terminalId) {
          try {
            this.services.terminals.kill(node.terminalId);
          } catch {
            /* already gone */
          }
        }
        if (!TERMINAL.includes(node.status)) {
          node.status = node.status === 'running' ? 'failed' : 'skipped';
          if (node.status === 'failed') node.error = 'Cancelled';
          node.endedAt = this.now().toISOString();
        }
      }
      run.status = 'cancelled';
      run.endedAt = this.now().toISOString();
      this.save(run);
      this.emit(run);
      return run;
    });
  }

  // ------------------------------------------------------------------------ engine

  private serial<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.chain.then(fn, fn);
    this.chain = next.catch(() => undefined);
    return next;
  }

  /** Observe terminals and advance every active run. Safe to call at any time; calls are serialised. */
  progress(): Promise<void> {
    return this.serial(() => this.step());
  }

  private emit(run: RunState): void {
    this.services.events.emit('workflow-run', { runId: run.runId, workflow: run.workflowId, status: run.status });
  }

  private async step(): Promise<void> {
    for (const run of this.runs.values()) {
      if (!ACTIVE.includes(run.status)) continue;
      const before = JSON.stringify(run);
      this.observe(run);
      await this.advance(run);
      this.settle(run);
      if (JSON.stringify(run) !== before) {
        this.save(run);
        this.emit(run);
      }
    }
  }

  /** Read terminal exits and token totals into running nodes. */
  private observe(run: RunState): void {
    const terminals = new Map(this.services.terminals.list().map((t) => [t.id, t]));
    for (const node of Object.values(run.nodes)) {
      if (node.status !== 'running' || !node.terminalId) continue;
      const t = terminals.get(node.terminalId);
      if (!t) {
        node.status = 'failed';
        node.error = 'The terminal is gone (the server restarted while it ran)';
        node.endedAt = this.now().toISOString();
        continue;
      }
      if (t.tokens) node.tokens = t.tokens;
      if (t.status === 'exited') {
        node.exitCode = t.exitCode ?? -1;
        node.endedAt = t.exitedAt ?? this.now().toISOString();
        if (node.exitCode === 0) node.status = 'done';
        else {
          node.status = 'failed';
          node.error = `Exited with code ${node.exitCode}`;
        }
      }
    }
  }

  /** Start every node whose predecessors have resolved; skip those no incoming edge reaches. */
  private async advance(run: RunState): Promise<void> {
    const w = run.workflow;
    for (let guard = 0; guard < w.nodes.length + 2; guard++) {
      let changed = false;
      for (const def of w.nodes) {
        const node = run.nodes[def.id] as NodeRun;
        if (node.status !== 'pending') continue;
        const incoming = w.edges.filter((e) => e.to === def.id);
        let go = incoming.length === 0;
        if (!go) {
          const preds = incoming.map((e) => ({ e, s: (run.nodes[e.from] as NodeRun).status }));
          if (!preds.every((x) => TERMINAL.includes(x.s))) continue;
          go = preds.some(({ e, s }) => {
            const when = edgeWhen(e);
            return (s === 'done' && (when === 'success' || when === 'always')) || (s === 'failed' && (when === 'failure' || when === 'always'));
          });
          if (!go) {
            node.status = 'skipped';
            node.endedAt = this.now().toISOString();
            changed = true;
            continue;
          }
        }
        await this.startNode(run, def, node);
        changed = true;
      }
      if (!changed) break;
    }
  }

  private async startNode(run: RunState, def: WorkflowNode, node: NodeRun): Promise<void> {
    const at = this.now().toISOString();
    node.startedAt = at;
    if (def.kind === 'schedule') {
      node.status = 'done';
      node.endedAt = at;
      return;
    }
    if (def.kind === 'human-gate') {
      node.status = 'waiting';
      return;
    }
    try {
      const notes = Object.fromEntries(Object.entries(run.nodes).map(([id, n]) => [id, n.note ?? '']));
      const params = Object.fromEntries(Object.entries(def.params ?? {}).map(([k, v]) => [k, renderTemplate(v, run.inputs, notes).trim()]));
      const ops = await this.services.operations.list();
      const op = ops.find((o) => o.id === def.operation);
      if (!op) throw new Error(`operation "${def.operation}" does not exist`);
      const missing = op.params.filter((p) => p.required && !params[p.name]).map((p) => p.label || p.name);
      if (missing.length) throw new Error(`missing required parameter: ${missing.join(', ')}`);
      const runner = def.runner ?? (def.kind === 'script' ? 'shell' : undefined);
      const picked = run.choices?.[def.id];
      const t = await this.services.operations.launch(def.operation as string, params, picked?.runner ?? runner, picked?.permission, undefined, picked?.choice);
      node.terminalId = t.id;
      node.status = 'running';
    } catch (error) {
      node.status = 'failed';
      node.error = (error as Error).message;
      node.endedAt = at;
    }
  }

  /** Decide the run's overall status. A failure with no failure/always edge leading onward fails the run. */
  private settle(run: RunState): void {
    const nodes = Object.values(run.nodes);
    const running = nodes.some((n) => n.status === 'running');
    const waiting = nodes.some((n) => n.status === 'waiting');
    const open = nodes.some((n) => n.status === 'pending');
    if (running) run.status = 'running';
    else if (waiting) run.status = 'waiting';
    else if (!open) {
      const w = run.workflow;
      const unhandled = w.nodes.some((def) => {
        if ((run.nodes[def.id] as NodeRun).status !== 'failed') return false;
        return !w.edges.some((e) => e.from === def.id && edgeWhen(e) !== 'success' && (run.nodes[e.to] as NodeRun).status !== 'skipped');
      });
      run.status = unhandled ? 'failed' : 'succeeded';
      run.endedAt = this.now().toISOString();
    } else run.status = 'running';
  }
}

export { sumTokens } from './tokens';
