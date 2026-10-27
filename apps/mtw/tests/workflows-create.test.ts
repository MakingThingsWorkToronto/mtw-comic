import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Services, TerminalInfo } from '../modules/types';
import { buildWorkflow, checkNewWorkflow, domainChoices, groupByDomain, OTHER_DOMAIN } from '../modules/workflows/lib/create';
import type { Draft, OperationInfo } from '../modules/workflows/lib/create';
import { RunEngine } from '../modules/workflows/lib/engine';
import { loadWorkflows } from '../modules/workflows/lib/library';
import { server as workflows } from '../modules/workflows/server';
import { startModules } from './module-harness';
import type { ModuleHarness } from './module-harness';

const realRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)), '..', '..');

const OPS = new Map<string, OperationInfo>([
  ['find', { id: 'find', title: 'Find things', params: [{ name: 'topic', label: 'Topic', required: true }, { name: 'depth', label: 'Depth', options: ['quick', 'deep'] }] }],
  ['write', { id: 'write', title: 'Write it up', params: [{ name: 'topic', label: 'Topic', required: true }] }],
]);
const ctx = { operations: OPS as never };

const draft = (over: Partial<Draft> = {}): Draft => ({
  title: 'Topic research',
  id: 'topic-research',
  domain: 'Research',
  description: 'Find, decide, write.',
  steps: [
    { kind: 'operation', label: '', operation: 'find', params: { depth: 'deep' }, ask: ['topic'] },
    { kind: 'human-gate', label: 'Worth writing?', note: 'Read the findings.', noteRequired: true },
    { kind: 'operation', label: 'Write', operation: 'write', params: {}, ask: ['topic'] },
  ],
  ...over,
});

describe('domain sections', () => {
  it('groups by domain in name order, merges case, and puts workflows without one under Other last', () => {
    const rows = [
      { id: 'a', domain: 'Music' },
      { id: 'b', domain: '' },
      { id: 'c', domain: 'journal' },
      { id: 'd', domain: 'Journal' },
      { id: 'e' },
      { id: 'f', domain: 'Access' },
    ] as { id: string; domain?: string }[];
    const g = groupByDomain(rows, (r) => r.domain);
    expect(g.map((s) => s.domain)).toEqual(['Access', 'journal', 'Music', OTHER_DOMAIN]);
    expect(g.find((s) => s.domain === 'journal')?.rows.map((r) => r.id)).toEqual(['c', 'd']);
    expect(g.at(-1)?.rows.map((r) => r.id)).toEqual(['b', 'e']);
  });

  it('offers the domains in use plus the suggestions, without duplicates or Other', () => {
    const d = domainChoices(['Music', 'music', 'Other', '', 'Ops']);
    expect(d).toContain('Ops');
    expect(d).toContain('Research');
    expect(d.filter((x) => x.toLowerCase() === 'music')).toHaveLength(1);
    expect(d).not.toContain('Other');
  });
});

describe('building a workflow from the form', () => {
  it('chains the steps in order, names nodes, and turns asked parameters into run inputs', () => {
    const w = buildWorkflow(draft(), OPS);
    expect(w).toMatchObject({ id: 'topic-research', domain: 'Research', title: 'Topic research' });
    expect(w.nodes.map((n) => [n.id, n.kind])).toEqual([
      ['find-things', 'operation'],
      ['worth-writing', 'human-gate'],
      ['write', 'operation'],
    ]);
    expect(w.edges).toEqual([
      { from: 'find-things', to: 'worth-writing' },
      { from: 'worth-writing', to: 'write' },
    ]);
    expect(w.inputs).toEqual([
      { name: 'topic', label: 'Topic', required: true },
      { name: 'topic_2', label: 'Topic', required: true },
    ]);
    expect(w.nodes[2]?.params).toEqual({ topic: '{{input.topic_2}}' });
    expect(w.nodes[0]?.params).toEqual({ topic: '{{input.topic}}', depth: 'deep' });
    expect(w.nodes[1]).toMatchObject({ noteRequired: true, note: 'Read the findings.' });
    expect(checkNewWorkflow(w, ctx, []).problems).toEqual([]);
  });

  it('refuses a duplicate or reserved id, an unknown procedure, an unknown parameter and a missing required value', () => {
    expect(checkNewWorkflow(buildWorkflow(draft(), OPS), ctx, ['topic-research']).problems.join(' ')).toMatch(/already exists/);
    expect(checkNewWorkflow(buildWorkflow(draft({ id: 'run' }), OPS), ctx, []).problems.join(' ')).toMatch(/reserved/);
    expect(checkNewWorkflow(buildWorkflow(draft({ id: 'Bad Id' }), OPS), ctx, []).problems.join(' ')).toMatch(/^id: /);

    const unknownOp = buildWorkflow(draft({ steps: [{ kind: 'operation', label: 'X', operation: 'nope', params: {} }] }), OPS);
    expect(checkNewWorkflow(unknownOp, ctx, []).problems.join(' ')).toMatch(/"nope" does not exist/);

    const badParam = buildWorkflow(draft({ steps: [{ kind: 'operation', label: 'X', operation: 'write', params: { topic: 't', colour: 'red' } }] }), OPS);
    expect(checkNewWorkflow(badParam, ctx, []).problems.join(' ')).toMatch(/has no parameter "colour"/);

    const missing = buildWorkflow(draft({ steps: [{ kind: 'operation', label: 'X', operation: 'write', params: {} }] }), OPS);
    expect(checkNewWorkflow(missing, ctx, []).problems.join(' ')).toMatch(/required parameter "topic"/);

    const badOption = buildWorkflow(draft({ steps: [{ kind: 'operation', label: 'X', operation: 'find', params: { topic: 't', depth: 'forever' } }] }), OPS);
    expect(checkNewWorkflow(badOption, ctx, []).problems.join(' ')).toMatch(/not one of quick, deep/);

    expect(checkNewWorkflow({ ...buildWorkflow(draft(), OPS), nodes: [] }, ctx, []).problems.join(' ')).toMatch(/^nodes: /);
  });
});

describe('POST /api/workflows/create', () => {
  let h: ModuleHarness;
  let root: string;
  let state: string;
  beforeAll(async () => {
    root = mkdtempSync(path.join(os.tmpdir(), 'mtw-wf-create-'));
    state = mkdtempSync(path.join(os.tmpdir(), 'mtw-wf-create-state-'));
    mkdirSync(path.join(root, 'wiki'), { recursive: true });
    for (const dir of ['wiki/operations', 'wiki/workflows']) cpSync(path.join(realRoot, dir), path.join(root, dir), { recursive: true });
    process.env.MTW_STATE_DIR = state;
    h = await startModules(root, [workflows]);
  });
  afterAll(async () => {
    await h.close();
    rmSync(root, { recursive: true, force: true });
    rmSync(state, { recursive: true, force: true });
  });

  it('writes a valid workflow, lists it under its domain, and never overwrites an existing id', async () => {
    const ops = await h.services.operations.list();
    const op = ops.find((o) => o.params.every((p) => !p.required)) ?? ops[0];
    const wf = {
      id: 'test-made-by-form',
      title: 'Made by the form',
      domain: 'Research',
      description: '',
      nodes: [
        { id: 'go', label: 'Go', kind: 'operation', operation: op?.id, ...(op?.params.some((p) => p.required) ? { params: Object.fromEntries(op.params.filter((p) => p.required).map((p) => [p.name, p.options?.[0] ?? 'x'])) } : {}) },
        { id: 'ok', label: 'OK?', kind: 'human-gate' },
      ],
      edges: [{ from: 'go', to: 'ok' }],
    };
    const made = await h.post<{ id: string; path: string }>('/api/workflows/create', { workflow: wf });
    expect(made.status).toBe(200);
    expect(made.body).toEqual({ id: 'test-made-by-form', path: 'wiki/workflows/test-made-by-form.json' });
    const file = path.join(root, 'wiki/workflows/test-made-by-form.json');
    expect(JSON.parse(readFileSync(file, 'utf8'))).toMatchObject({ id: 'test-made-by-form', domain: 'Research' });

    const list = await h.get<{ id: string; domain: string; problems: string[] }[]>('/api/workflows/list');
    expect(list.find((r) => r.id === 'test-made-by-form')).toMatchObject({ domain: 'Research', problems: [] });
    expect(list.find((r) => r.id === 'weekly-journal-entry')?.domain).toBe('Journal');

    const again = await h.post('/api/workflows/create', { workflow: { ...wf, title: 'Changed' } });
    expect(again.status).toBe(409);
    expect(JSON.parse(readFileSync(file, 'utf8')).title).toBe('Made by the form');

    const shipped = await h.post('/api/workflows/create', { workflow: { ...wf, id: 'music-discovery' } });
    expect(shipped.status).toBe(409);

    const bad = await h.post<{ error: string }>('/api/workflows/create', { workflow: { ...wf, id: 'bad-step', nodes: [{ id: 'go', label: 'Go', kind: 'operation', operation: 'no-such-procedure' }], edges: [] } });
    expect(bad.status).toBe(400);
    expect(bad.body.error).toMatch(/does not exist/);
    expect(existsSync(path.join(root, 'wiki/workflows/bad-step.json'))).toBe(false);
  }, 120_000);
});

describe('the shipped workflows run end to end (dry: fake launcher, simulated exits, approved gates)', () => {
  let core: Services;
  let close: () => Promise<void>;
  beforeAll(async () => {
    const probe = await startModules(realRoot, []);
    core = probe.services;
    close = probe.close;
  });
  afterAll(async () => close());

  it('each of the four reaches succeeded, launching only real procedures with every required value set', async () => {
    const loaded = await loadWorkflows(core);
    const realOps = await core.operations.list();
    for (const id of ['weekly-journal-entry', 'comic-box-art-fix', 'music-discovery', 'access-review-example']) {
      const hit = loaded.find((l) => l.id === id);
      expect({ id, problems: hit?.problems }).toEqual({ id, problems: [] });
      const w = hit?.workflow;
      if (!w) continue;
      expect(w.domain, `${id} domain`).toBeTruthy();
      const dir = mkdtempSync(path.join(os.tmpdir(), 'mtw-wf-dry-'));
      const terminals: TerminalInfo[] = [];
      const launches: { id: string; params: Record<string, string> }[] = [];
      const services = {
        repoRoot: dir,
        operations: {
          list: async () => realOps,
          launch: async (op: string, params: Record<string, string>) => {
            launches.push({ id: op, params });
            const t: TerminalInfo = { id: `t-${launches.length}`, runner: 'claude', title: op, operation: op, module: 'workflows', pid: 1, startedAt: new Date().toISOString(), status: 'running' };
            terminals.push(t);
            return t;
          },
        },
        terminals: { list: () => terminals, kill: () => undefined },
        decisions: { append: async (_lib: string, d: unknown) => d },
        events: { emit: () => undefined },
      } as unknown as Services;
      const engine = new RunEngine(services, { stateDir: dir, pollMs: 0 });
      const inputs = Object.fromEntries((w.inputs ?? []).map((i) => [i.name, `sample ${i.name}`]));
      let run = await engine.begin(w, inputs);
      for (let guard = 0; guard < 40 && (run.status === 'running' || run.status === 'waiting'); guard++) {
        for (const t of terminals) if (t.status === 'running') Object.assign(t, { status: 'exited', exitCode: 0, exitedAt: new Date().toISOString() });
        await engine.progress();
        run = engine.get(run.runId) as typeof run;
        const gate = Object.entries(run.nodes).find(([, n]) => n.status === 'waiting');
        if (gate) run = await engine.decide(run.runId, gate[0], 'approve', 'sample note');
      }
      expect({ id, status: run.status }).toEqual({ id, status: 'succeeded' });
      for (const l of launches) {
        const def = realOps.find((o) => o.id === l.id);
        expect(def, `${id} launched ${l.id}`).toBeTruthy();
        for (const p of def?.params ?? []) if (p.required) expect(l.params[p.name], `${id}: ${l.id}.${p.name}`).toBeTruthy();
      }
      expect(launches.length).toBe(w.nodes.filter((n) => n.kind === 'operation' || n.kind === 'script').length);
      engine.stop();
      rmSync(dir, { recursive: true, force: true });
    }
  }, 120_000);
});
