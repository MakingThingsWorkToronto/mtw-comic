import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { RunEngine } from '../modules/workflows/lib/engine';
import { WorkflowSchema, problemsOf, topoOrder } from '../modules/workflows/lib/schema';
import type { ValidationContext, Workflow } from '../modules/workflows/lib/schema';
import type { Services, TerminalInfo } from '../modules/types';

const OPS = [
  { id: 'step-a', params: [{ name: 'concept', label: 'Concept', type: 'text', required: true }] },
  { id: 'step-b', params: [] },
  { id: 'recover', params: [] },
];

const wf = (over: Partial<Workflow> = {}): Workflow =>
  WorkflowSchema.parse({
    id: 'demo',
    title: 'Demo',
    inputs: [{ name: 'topic', label: 'Topic' }],
    nodes: [
      { id: 'a', label: 'A', kind: 'operation', operation: 'step-a', params: { concept: '{{input.topic}} / {{pick}}' } },
      { id: 'pick', label: 'Pick', kind: 'human-gate', noteRequired: true },
      { id: 'b', label: 'B', kind: 'operation', operation: 'step-b' },
      { id: 'ok', label: 'Done', kind: 'human-gate' },
      { id: 'fix', label: 'Recover', kind: 'operation', operation: 'recover' },
    ],
    edges: [
      { from: 'pick', to: 'a' },
      { from: 'a', to: 'b' },
      { from: 'a', to: 'fix', when: 'failure' },
      { from: 'b', to: 'ok' },
      { from: 'fix', to: 'ok' },
    ],
    ...over,
  });

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

function rig(stateDir?: string, terminalsIn?: TerminalInfo[]) {
  const dir = stateDir ?? mkdtempSync(path.join(os.tmpdir(), 'mtw-wf-'));
  if (!stateDir) dirs.push(dir);
  const terminals: TerminalInfo[] = terminalsIn ?? [];
  const launches: { id: string; params: Record<string, string>; runner?: string; permission?: string; choice?: { model?: string; effort?: string } }[] = [];
  const decisions: { lib: string; subject: string; action: string; note?: string }[] = [];
  const events: string[] = [];
  const services = {
    repoRoot: dir,
    operations: {
      list: async () => OPS,
      launch: async (id: string, params: Record<string, string>, runner?: string, permission?: string, _prompt?: string, choice?: { model?: string; effort?: string }) => {
        launches.push({ id, params, ...(runner ? { runner } : {}), ...(permission ? { permission } : {}), ...(choice ? { choice } : {}) });
        const t: TerminalInfo = { id: `t-${String(launches.length).padStart(8, '0')}`, runner: 'claude', title: id, operation: id, module: 'workflows', pid: 1, startedAt: new Date().toISOString(), status: 'running' };
        terminals.push(t);
        return t;
      },
    },
    terminals: { list: () => terminals, kill: (id: string) => { const t = terminals.find((x) => x.id === id); if (t) { t.status = 'exited'; t.exitCode = 143; } } },
    decisions: { append: async (lib: string, d: { subject: string; action: string; note?: string }) => { decisions.push({ lib, ...d }); return d; } },
    events: { emit: (type: string) => events.push(type) },
  } as unknown as Services;
  const engine = new RunEngine(services, { stateDir: dir, pollMs: 0 });
  const exit = (i: number, code: number, tokens = 0) => {
    const t = terminals[i] as TerminalInfo;
    t.status = 'exited';
    t.exitCode = code;
    t.exitedAt = new Date().toISOString();
    if (tokens) t.tokens = { input: tokens, output: 0, cacheRead: 0, cacheWrite: 0, total: tokens, cacheHitRate: 0 };
  };
  return { dir, engine, services, terminals, launches, decisions, events, exit };
}

describe('run engine', () => {
  it('walks success: gate waits, operations launch only after their predecessors, run succeeds', async () => {
    const r = rig();
    const run = await r.engine.begin(wf(), { topic: 'Agents' });
    expect(run.status).toBe('waiting');
    expect(run.nodes.pick?.status).toBe('waiting');
    expect(r.launches).toHaveLength(0); // nothing launches ahead of the gate

    await expect(r.engine.decide(run.runId, 'pick', 'approve', '')).rejects.toThrow(/needs a note/);
    await r.engine.decide(run.runId, 'pick', 'approve', 'Concept 7');
    expect(r.launches).toEqual([{ id: 'step-a', params: { concept: 'Agents / Concept 7' } }]); // input and gate note fill the template
    expect(r.engine.get(run.runId)?.nodes.a?.status).toBe('running');

    r.exit(0, 0, 1200);
    await r.engine.progress();
    expect(r.engine.get(run.runId)?.nodes.a).toMatchObject({ status: 'done', exitCode: 0, tokens: { total: 1200 } });
    expect(r.launches.map((l) => l.id)).toEqual(['step-a', 'step-b']);
    expect(r.engine.get(run.runId)?.nodes.fix?.status).toBe('skipped'); // the failure edge was not taken

    r.exit(1, 0, 300);
    await r.engine.progress();
    expect(r.engine.get(run.runId)?.status).toBe('waiting'); // final gate
    const done = await r.engine.decide(run.runId, 'ok', 'approve');
    expect(done.status).toBe('succeeded');
    expect(done.endedAt).toBeTruthy();
    expect(r.decisions.map((d) => [d.lib, d.subject, d.action])).toEqual([
      ['workflows', `${run.runId}:pick`, 'approve'],
      ['workflows', `${run.runId}:ok`, 'approve'],
    ]);
  });

  it('launches a step with the choice Matt confirmed at Run; a step without one keeps the frontmatter default (no choice passed)', async () => {
    const r = rig();
    const run = await r.engine.begin(wf(), { topic: 'x' }, { a: { runner: 'codex', permission: 'accept-edits', choice: { model: 'gpt-6.1-sol', effort: 'high' } } });
    expect(r.engine.get(run.runId)?.choices).toEqual({ a: { runner: 'codex', permission: 'accept-edits', choice: { model: 'gpt-6.1-sol', effort: 'high' } } });
    await r.engine.decide(run.runId, 'pick', 'approve', 'n');
    expect(r.launches[0]).toMatchObject({ id: 'step-a', runner: 'codex', permission: 'accept-edits', choice: { model: 'gpt-6.1-sol', effort: 'high' } });
    r.exit(0, 0);
    await r.engine.progress();
    // Step b has no stored choice: launched exactly as an unattended run would be.
    expect(r.launches[1]).toEqual({ id: 'step-b', params: {} });
    // The choices survive a restart with the run record.
    const again = rig(r.dir);
    expect(again.engine.get(run.runId)?.choices?.a?.choice?.model).toBe('gpt-6.1-sol');
  });

  it('follows a failure edge and the run still succeeds; an unhandled failure fails the run', async () => {
    const r = rig();
    const run = await r.engine.begin(wf(), { topic: 'x' });
    await r.engine.decide(run.runId, 'pick', 'approve', 'n');
    r.exit(0, 2);
    await r.engine.progress();
    const mid = r.engine.get(run.runId);
    expect(mid?.nodes.a).toMatchObject({ status: 'failed', exitCode: 2 });
    expect(mid?.nodes.b?.status).toBe('skipped');
    expect(r.launches.map((l) => l.id)).toEqual(['step-a', 'recover']);
    r.exit(1, 0);
    await r.engine.progress();
    expect((await r.engine.decide(run.runId, 'ok', 'approve')).status).toBe('succeeded');

    // Same graph without the failure edge: the failure is unhandled.
    const base = wf();
    const plain = wf({ nodes: base.nodes.filter((n) => n.id !== 'fix'), edges: [{ from: 'pick', to: 'a' }, { from: 'a', to: 'b' }, { from: 'b', to: 'ok' }] });
    const r2 = rig();
    const run2 = await r2.engine.begin(plain, { topic: 'x' });
    await r2.engine.decide(run2.runId, 'pick', 'approve', 'n');
    r2.exit(0, 1);
    await r2.engine.progress();
    expect(r2.engine.get(run2.runId)).toMatchObject({ status: 'failed' });
  });

  it('a rejected gate fails its node; an always edge still continues', async () => {
    const w = wf({
      nodes: [
        { id: 'g', label: 'G', kind: 'human-gate' },
        { id: 'after', label: 'After', kind: 'operation', operation: 'step-b' },
      ],
      edges: [{ from: 'g', to: 'after', when: 'always' }],
      inputs: [],
    });
    const r = rig();
    const run = await r.engine.begin(w);
    const out = await r.engine.decide(run.runId, 'g', 'reject', 'not good');
    expect(out.nodes.g).toMatchObject({ status: 'failed', decision: 'reject', error: 'Rejected: not good' });
    expect(out.nodes.after?.status).toBe('running');
    expect(r.decisions[0]).toMatchObject({ action: 'reject', note: 'not good' });
  });

  it('fails a node whose required parameter renders empty, without launching', async () => {
    const r = rig();
    const w = wf({ nodes: [{ id: 'a', label: 'A', kind: 'operation', operation: 'step-a', params: { concept: '{{input.topic}}' } }], edges: [], inputs: [{ name: 'topic', label: 'Topic' }] });
    const run2 = await r.engine.begin(w, {});
    expect(run2.nodes.a).toMatchObject({ status: 'failed' });
    expect(run2.nodes.a?.error).toMatch(/missing required parameter/);
    expect(r.launches).toHaveLength(0);
    expect(run2.status).toBe('failed');
  });

  it('a gate cannot be decided twice and required start inputs are enforced', async () => {
    const r = rig();
    const w = wf({ inputs: [{ name: 'topic', label: 'Topic', required: true }] });
    await expect(r.engine.begin(w, {})).rejects.toThrow(/Topic/);
    const run = await r.engine.begin(w, { topic: 't' });
    await r.engine.decide(run.runId, 'pick', 'approve', 'n');
    await expect(r.engine.decide(run.runId, 'pick', 'approve', 'n')).rejects.toThrow(/not waiting/);
  });

  it('persists: a new engine over the same state dir resumes a waiting gate and fails a node whose terminal is gone', async () => {
    const r = rig();
    const run = await r.engine.begin(wf(), { topic: 'p' });
    await r.engine.decide(run.runId, 'pick', 'approve', 'n'); // a is running on terminal t-00000001
    const gateRun = await r.engine.begin(wf({ id: 'demo2' }), { topic: 'q' }); // waiting at its first gate

    // "Restart": a fresh engine, a fresh (empty) terminal list.
    const again = rig(r.dir, []);
    expect(again.engine.list().map((x) => x.runId).sort()).toEqual([run.runId, gateRun.runId].sort());
    expect(again.engine.get(gateRun.runId)?.nodes.pick?.status).toBe('waiting');
    await again.engine.progress();
    const a = again.engine.get(run.runId)?.nodes.a;
    expect(a).toMatchObject({ status: 'failed' });
    expect(a?.error).toMatch(/server restarted/);
    expect(again.launches.map((l) => l.id)).toEqual(['recover']); // the failure edge ran after the restart

    // The waiting gate can still be approved after the restart.
    await again.engine.decide(gateRun.runId, 'pick', 'approve', 'carry on');
    expect(again.launches.map((l) => l.id)).toEqual(['recover', 'step-a']);
  });

  it('cancel kills running terminals and closes the run', async () => {
    const r = rig();
    const run = await r.engine.begin(wf(), { topic: 'c' });
    await r.engine.decide(run.runId, 'pick', 'approve', 'n');
    const out = await r.engine.cancel(run.runId);
    expect(out.status).toBe('cancelled');
    expect(r.terminals[0]?.status).toBe('exited');
    expect(Object.values(out.nodes).every((n) => ['done', 'failed', 'skipped'].includes(n.status))).toBe(true);
  });
});

describe('workflow validation', () => {
  const ctx = (over: Partial<ValidationContext> = {}): ValidationContext => ({ operations: new Map(OPS.map((o) => [o.id, o])), ...over });

  it('accepts a good workflow and rejects cycles, unknown operations, bad params and bad templates', () => {
    expect(problemsOf(wf(), ctx())).toEqual([]);
    expect(topoOrder(wf())).toHaveLength(5);

    const bad = wf({
      nodes: [
        { id: 'a', label: 'A', kind: 'operation', operation: 'nope' },
        { id: 'b', label: 'B', kind: 'operation', operation: 'step-a', params: { wrong: '1', concept: '{{input.missing}} {{ghost}}' } },
        { id: 'c', label: 'C', kind: 'human-gate', operation: 'step-b' },
      ],
      edges: [{ from: 'a', to: 'z' }],
      inputs: [],
    });
    const p = problemsOf(bad, ctx()).join('\n');
    expect(p).toMatch(/operation "nope" does not exist/);
    expect(p).toMatch(/no parameter "wrong"/);
    expect(p).toMatch(/\{\{input\.missing\}\} is not a declared input/);
    expect(p).toMatch(/\{\{ghost\}\} is not a human-gate/);
    expect(p).toMatch(/gate nodes take no operation|human-gate nodes take no operation/);
    expect(p).toMatch(/unknown node "z"/);

    const loop = wf({ edges: [{ from: 'a', to: 'b' }, { from: 'b', to: 'a' }] });
    expect(problemsOf(loop, ctx()).join()).toMatch(/cycle/);
  });

  it('checks diagram nodes against the SVG ids and tour steps against the tour', () => {
    const w = WorkflowSchema.parse({
      id: 'd', title: 'D', diagram: { svg: 'wiki/image-library/x.svg', tour: 'wiki/image-library/t.json' },
      nodes: [{ id: 'n1', label: 'N', kind: 'human-gate', diagramNode: 'present', tourStep: 1 }, { id: 'n2', label: 'M', kind: 'human-gate', diagramNode: 'absent', tourStep: 5 }],
      edges: [{ from: 'n1', to: 'n2' }],
    });
    const p = problemsOf(w, ctx({ svgIds: new Set(['present']), tourSteps: 2 })).join('\n');
    expect(p).toMatch(/diagramNode "absent" is not an id/);
    expect(p).toMatch(/tourStep 5 is past/);
    expect(p).not.toMatch(/"present"/);
  });
});
