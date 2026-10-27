import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadWorkflows, sanitizeSvg } from '../modules/workflows/lib/library';
import { server as workflows } from '../modules/workflows/server';
import { fakeLaunchers, startModules } from './module-harness';
import type { ModuleHarness } from './module-harness';

const realRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)), '..', '..');
let h: ModuleHarness;
let launches: ReturnType<typeof fakeLaunchers>['launches'];
const state = mkdtempSync(path.join(os.tmpdir(), 'mtw-wf-state-'));

beforeAll(async () => {
  process.env.MTW_STATE_DIR = state; // the server module reads this at register time
  const probe = await startModules(realRoot, []);
  const fake = fakeLaunchers(probe.core);
  launches = fake.launches;
  await probe.close();
  h = await startModules(realRoot, [workflows], { ...fake.overrides, terminals: { list: () => [], kill: () => undefined } as never });
});
afterAll(async () => {
  await h.close();
  rmSync(state, { recursive: true, force: true });
});

describe('the shipped workflows', () => {
  it('every workflow in wiki/workflows is valid and every operation it names exists', async () => {
    const loaded = await loadWorkflows(h.services);
    expect(loaded.map((l) => l.id)).toEqual(expect.arrayContaining(['weekly-journal-entry', 'comic-box-art-fix', 'music-discovery', 'access-review-example']));
    for (const l of loaded) expect({ id: l.id, problems: l.problems }).toEqual({ id: l.id, problems: [] });
  });

  it('the diagram workflow maps real SVG ids and carries the public-claim label', async () => {
    const d = await h.get<{ workflow: { notice: string; nodes: { diagramNode?: string }[] }; svg: string; tour: { steps: unknown[] } }>('/api/workflows/workflow/access-review-example');
    expect(d.workflow.notice).toMatch(/not a live client process/);
    expect(d.svg).toContain('<svg');
    expect(d.svg).not.toMatch(/<script|\son\w+=/i);
    for (const n of d.workflow.nodes) expect(d.svg).toContain(`id="${n.diagramNode}"`);
    expect(d.tour.steps).toHaveLength(4);
  });
});

describe('workflows API', () => {
  it('lists, refuses a run with missing inputs, then runs the Journal chain through the launcher', async () => {
    const list = await h.get<{ id: string; nodes: number; problems: string[]; last: unknown }[]>('/api/workflows/list');
    expect(list.find((x) => x.id === 'weekly-journal-entry')).toMatchObject({ nodes: 9, problems: [], last: null });

    const missing = await h.post('/api/workflows/run', { id: 'comic-box-art-fix', inputs: {} });
    expect(missing.status).toBe(400);
    expect(missing.body.error).toMatch(/Needed to start/);

    const started = await h.post<{ run: { runId: string; status: string } }>('/api/workflows/run', { id: 'weekly-journal-entry' });
    expect(started.status).toBe(200);
    expect(launches.map((l) => l.id)).toEqual(['journal-ingest-all']);
    const runId = started.body.run.runId;
    const view = await h.get<{ run: { nodes: Record<string, { status: string; terminalId?: string }> } }>(`/api/workflows/run/${runId}`);
    expect(view.run.nodes.ingest).toMatchObject({ status: 'running', terminalId: 't-fake1' });
    expect(view.run.nodes.source?.status).toBe('pending');

    const nope = await h.post(`/api/workflows/run/${runId}/decide`, { node: 'pick-headline', decision: 'approve' });
    expect(nope.status).toBe(409);
    const stop = await h.post<{ run: { status: string } }>(`/api/workflows/run/${runId}/cancel`);
    expect(stop.body.run.status).toBe('cancelled');
    const runs = await h.get<{ runId: string; status: string }[]>('/api/workflows/runs?workflow=weekly-journal-entry');
    expect(runs[0]).toMatchObject({ runId, status: 'cancelled' });
  });

  it('a run carries the per-step choices Matt confirmed: stored on the run, used when the step launches, bypass and unknown steps refused', async () => {
    const before = launches.length;
    const bad = await h.post('/api/workflows/run', { id: 'weekly-journal-entry', choices: { nowhere: { runner: 'claude' } } });
    expect(bad.status).toBe(400);
    expect(bad.body.error).toMatch(/not a step/);
    const bypass = await h.post('/api/workflows/run', { id: 'weekly-journal-entry', choices: { ingest: { runner: 'claude', permission: 'bypass' } } });
    expect(bypass.status).toBe(400);
    expect(launches).toHaveLength(before);
    const ok = await h.post<{ run: { runId: string; choices?: Record<string, { runner?: string; choice?: { model?: string } }> } }>('/api/workflows/run', { id: 'weekly-journal-entry', choices: { ingest: { runner: 'codex', model: 'gpt-6.1-sol', effort: 'high', permission: 'default' } } });
    expect(ok.status).toBe(200);
    expect(ok.body.run.choices?.ingest).toMatchObject({ runner: 'codex', choice: { model: 'gpt-6.1-sol', effort: 'high' } });
    expect(launches[before]).toMatchObject({ id: 'journal-ingest-all', runner: 'codex', model: 'gpt-6.1-sol', effort: 'high' });
    await h.post(`/api/workflows/run/${ok.body.run.runId}/cancel`);
  });
});

describe('sanitizeSvg', () => {
  it('removes scripts, event handlers and javascript links', () => {
    const out = sanitizeSvg('<?xml version="1.0"?><svg onload="x()"><script>alert(1)</script><a href="javascript:alert(1)"><g id="ok" onclick=\'y()\'/></a></svg>');
    expect(out).toBe('<svg><a><g id="ok"/></a></svg>');
  });
});
