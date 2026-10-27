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

describe('the shipped comic workflow', () => {
  it('loads the comic build and resolves every procedure', async () => {
    const loaded = await loadWorkflows(h.services);
    expect(loaded.map(l => l.id)).toEqual(['comic-build']);
    for (const l of loaded) expect(l.problems).toEqual([]);
  });
  it('refuses missing inputs and starts only the comic story step', async () => {
    expect((await h.post('/api/workflows/run', {id:'comic-build',inputs:{}})).status).toBe(400);
    const started = await h.post<{run:{runId:string,status:string}}>('/api/workflows/run', {id:'comic-build',inputs:{slug:'home',build:'fixture',brief:'Fixture only'}});
    expect(started.status).toBe(200);
    expect(launches.at(-1)?.id).toBe('comics-build-story');
    const stopped = await h.post<{run:{status:string}}>(`/api/workflows/run/${started.body.run.runId}/cancel`);
    expect(stopped.body.run.status).toBe('cancelled');
  });
  it('refuses nonexistent steps and bypass permissions', async () => {
    const inputs={slug:'home',build:'fixture'};
    const bad=await h.post('/api/workflows/run',{id:'comic-build',inputs,choices:{nowhere:{runner:'codex'}}});
    expect(bad.status).toBe(400);
    const bypass=await h.post('/api/workflows/run',{id:'comic-build',inputs,choices:{story:{runner:'codex',permission:'bypass'}}});
    expect(bypass.status).toBe(400);
  });
});

describe('sanitizeSvg', () => {
  it('removes scripts, event handlers and javascript links', () => {
    const out = sanitizeSvg('<?xml version="1.0"?><svg onload="x()"><script>alert(1)</script><a href="javascript:alert(1)"><g id="ok" onclick=\'y()\'/></a></svg>');
    expect(out).toBe('<svg><a><g id="ok"/></a></svg>');
  });
});
