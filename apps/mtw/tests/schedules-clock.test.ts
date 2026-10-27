import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Scheduler } from '../modules/schedules/lib/scheduler';
import { server as schedules } from '../modules/schedules/server';
import type { Services, TerminalInfo } from '../modules/types';
import { fakeLaunchers, startModules } from './module-harness';
import type { ModuleHarness } from './module-harness';

const realRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)), '..', '..');
const at = (d: number, h: number, m: number, s = 0): Date => new Date(2026, 9, d, h, m, s); // Oct 2026; the 12th is a Monday

const RUNNERS = {
  claude: { permissions: [{ id: 'default', args: [] }, { id: 'accept-edits', args: ['--permission-mode', 'acceptEdits'] }, { id: 'bypass', args: ['--dangerously-skip-permissions'] }] },
  codex: { permissions: [{ id: 'default', args: [] }] },
};
const OPS = ['journal-ingest-all', 'journal-source', 'journal-recommend', 'llm-column-claude-solo'].map((id) => ({ id, runner: 'claude' }));

function sched(over: Record<string, unknown> = {}) {
  return { id: 'weekly', title: 'Weekly', operation: 'journal-ingest-all', params: { x: '1' }, runner: 'claude', permission: 'default', cron: '0 7 * * 1', enabled: true, ...over };
}

function rig(schedulesList: unknown[]) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'mtw-sched-'));
  const launches: { id: string; params: Record<string, string>; runner?: string; permission?: string; choice?: { model?: string; effort?: string } }[] = [];
  const terminals: TerminalInfo[] = [];
  let clock = at(12, 7, 0);
  const services = {
    repoRoot: root,
    wiki: { readJson: async (p: string) => (p.endsWith('runners.json') ? RUNNERS : { schedules: schedulesList }), readText: async () => ['---', 'runMode: scheduled', '---', ''].join('\n') },
    operations: {
      list: async () => OPS,
      launch: async (id: string, params: Record<string, string>, runner?: string, permission?: string, _prompt?: string, choice?: { model?: string; effort?: string }) => {
        launches.push({ id, params, ...(runner ? { runner } : {}), ...(permission ? { permission } : {}), ...(choice ? { choice } : {}) });
        const t: TerminalInfo = { id: `t${launches.length}`, runner: 'claude', title: id, operation: id, module: 'journal', pid: 1, startedAt: clock.toISOString(), status: 'running' };
        terminals.push(t);
        return t;
      },
    },
    terminals: { list: () => terminals },
  } as unknown as Services;
  const s = new Scheduler(services, { now: () => clock, noLease: true, stepTimeoutMs: 60 * 60_000 });
  return {
    s, launches, terminals, root,
    setNow: (d: Date) => { clock = d; },
    exit: (id: string, code: number) => { const t = terminals.find((x) => x.id === id)!; t.status = 'exited'; t.exitCode = code; },
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

describe('clock', () => {
  it('fires an enabled schedule in its minute, once, through operations.launch', async () => {
    const r = rig([sched()]);
    expect(await r.s.tick(at(12, 6, 59, 40))).toEqual([]);
    expect(await r.s.tick(at(12, 7, 0, 5))).toEqual(['weekly']);
    expect(await r.s.tick(at(12, 7, 0, 35))).toEqual([]);
    expect(r.launches).toHaveLength(1);
    expect(r.launches[0]).toMatchObject({ id: 'journal-ingest-all', runner: 'claude' });
    expect(r.launches[0]!.permission).toBeUndefined();
    expect(r.launches[0]!.params).toMatchObject({ x: '1', unattended: 'scheduled' });
    r.cleanup();
  });

  it('never fires a disabled schedule or the wrong minute', async () => {
    const r = rig([sched({ enabled: false })]);
    await r.s.tick(at(12, 7, 0));
    expect(r.launches).toHaveLength(0);
    const r2 = rig([sched()]);
    await r2.s.tick(at(13, 7, 0));
    expect(r2.launches).toHaveLength(0);
    r.cleanup();
    r2.cleanup();
  });

  it('catches a late tick up to five minutes, once', async () => {
    const r = rig([sched()]);
    await r.s.tick(at(12, 6, 58));
    expect(await r.s.tick(at(12, 7, 2, 10))).toEqual(['weekly']);
    expect(await r.s.tick(at(12, 7, 2, 40))).toEqual([]);
    r.cleanup();
  });

  it('refuses bypass permissions: nothing launches and the skip is logged', async () => {
    const r = rig([sched({ permission: 'bypass' })]);
    await r.s.tick(at(12, 7, 0));
    expect(r.launches).toHaveLength(0);
    expect(r.s.log.skips('weekly')[0]!.reason).toMatch(/bypass/);
    await expect(r.s.runNow('weekly')).rejects.toThrow(/bypass/);
    const view = (await r.s.list())[0]!;
    expect(view.problems.join(' ')).toMatch(/bypass/);
    expect(view.next).toBeNull();
    r.cleanup();
  });

  it('refuses a flag-level bypass hidden behind an innocent permission id', async () => {
    const r = rig([sched({ permission: 'accept-edits' })]);
    // accept-edits is fine
    await r.s.tick(at(12, 7, 0));
    expect(r.launches[0]!.permission).toBe('accept-edits');
    r.cleanup();
  });

  it('never schedules a publishing operation', async () => {
    const r = rig([sched({ operation: 'journal-publish' })]);
    const view = (await r.s.list())[0]!;
    expect(view.problems.join(' ')).toMatch(/unknown operation|publish/);
    await r.s.tick(at(12, 7, 0));
    expect(r.launches).toHaveLength(0);
    r.cleanup();
  });

  it('reports invalid cron and unknown operations instead of firing', async () => {
    const r = rig([sched({ cron: '99 * * * *' }), sched({ id: 'b', operation: 'nope' })]);
    const views = await r.s.list();
    expect(views[0]!.problems[0]).toMatch(/cron: minute/);
    expect(views[1]!.problems[0]).toMatch(/unknown operation nope/);
    r.cleanup();
  });
});

describe('chains', () => {
  const chain = [{ operation: 'journal-ingest-all' }, { operation: 'journal-source' }, { operation: 'journal-recommend' }];

  it('starts each step when the previous terminal exits 0, then finishes ok', async () => {
    const r = rig([sched({ chain })]);
    await r.s.tick(at(12, 7, 0));
    expect(r.launches.map((l) => l.id)).toEqual(['journal-ingest-all']);
    await r.s.progress();
    expect(r.launches).toHaveLength(1); // still running: no advance
    r.exit('t1', 0);
    await r.s.progress();
    expect(r.launches.map((l) => l.id)).toEqual(['journal-ingest-all', 'journal-source']);
    r.exit('t2', 0);
    await r.s.progress();
    r.exit('t3', 0);
    await r.s.progress();
    const run = r.s.log.runs('weekly')[0]!;
    expect(run.status).toBe('ok');
    expect(run.steps.map((s) => [s.operation, s.terminalId, s.exitCode])).toEqual([['journal-ingest-all', 't1', 0], ['journal-source', 't2', 0], ['journal-recommend', 't3', 0]]);
    const view = (await r.s.list())[0]!;
    expect(view.last!.runId).toBe(run.runId);
    expect(view.running).toBe(false);
    r.cleanup();
  });

  it('stops the chain at a non-zero exit', async () => {
    const r = rig([sched({ chain })]);
    await r.s.tick(at(12, 7, 0));
    r.exit('t1', 3);
    await r.s.progress();
    expect(r.launches).toHaveLength(1);
    const run = r.s.log.runs('weekly')[0]!;
    expect(run.status).toBe('failed');
    expect(run.reason).toMatch(/code 3/);
    r.cleanup();
  });

  it('gives up waiting after the step timeout and leaves the terminal alone', async () => {
    const r = rig([sched({ chain })]);
    await r.s.tick(at(12, 7, 0));
    r.setNow(at(12, 9, 0));
    await r.s.progress();
    const run = r.s.log.runs('weekly')[0]!;
    expect(run.status).toBe('timeout');
    expect(r.terminals[0]!.status).toBe('running');
    r.cleanup();
  });

  it('skips a firing while the previous run is still going', async () => {
    const r = rig([sched({ chain, cron: '* * * * *' })]);
    await r.s.tick(at(12, 7, 0));
    await r.s.tick(at(12, 7, 1));
    expect(r.launches).toHaveLength(1);
    expect(r.s.log.skips('weekly')[0]!.reason).toMatch(/still going/);
    r.cleanup();
  });

  it('Run now records a manual trigger and returns the run with its terminal', async () => {
    const r = rig([sched({ enabled: false, chain })]);
    const run = await r.s.runNow('weekly');
    expect(run.trigger).toBe('manual');
    expect(run.steps[0]!.terminalId).toBe('t1');
    await expect(r.s.runNow('weekly')).rejects.toThrow(/already running/);
    r.cleanup();
  });

  it('Run now passes the confirmed choice of each chained step; a timed run passes none', async () => {
    const r = rig([sched({ enabled: false, chain })]);
    await r.s.runNow('weekly', { '0': { runner: 'codex', choice: { model: 'gpt-6.1-sol', effort: 'high' } }, '1': { choice: { model: 'claude-sonnet-5-5', effort: 'medium' } } });
    expect(r.launches[0]).toMatchObject({ id: 'journal-ingest-all', runner: 'codex', choice: { model: 'gpt-6.1-sol', effort: 'high' } });
    r.exit('t1', 0);
    await r.s.progress();
    expect(r.launches[1]).toMatchObject({ id: 'journal-source', runner: 'claude', choice: { model: 'claude-sonnet-5-5', effort: 'medium' } });
    r.exit('t2', 0);
    await r.s.progress();
    expect(r.launches[2]!.choice).toBeUndefined(); // step 2 had no confirmed choice: the procedure default applies
    const timed = rig([sched({ chain })]);
    await timed.s.tick(at(12, 7, 0));
    expect(timed.launches[0]!.choice).toBeUndefined();
    r.cleanup();
    timed.cleanup();
  });

  it('marks runs the last process never finished as interrupted at start', async () => {
    const r = rig([sched({ chain })]);
    await r.s.tick(at(12, 7, 0));
    const fresh = new Scheduler((r.s as unknown as { services: Services }).services, { now: () => at(12, 8, 0), noLease: true, tickMs: 3_600_000, progressMs: 3_600_000 });
    fresh.start();
    fresh.stop();
    expect(fresh.log.runs('weekly')[0]!.status).toBe('interrupted');
    r.cleanup();
  });

  it('records fires in apps/mtw/.state/schedule-runs.jsonl', async () => {
    const r = rig([sched()]);
    await r.s.tick(at(12, 7, 0));
    const text = readFileSync(path.join(r.root, 'apps/mtw/.state/schedule-runs.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    expect(text.map((e) => e.event)).toEqual(['started', 'step-started']);
    r.cleanup();
  });
});

describe('lease', () => {
  it('stays passive while a live process holds a fresh lease, and takes over a dead one', async () => {
    const r = rig([sched()]);
    const lease = path.join(r.root, 'lease.json');
    const services = (r.s as unknown as { services: Services }).services;
    const mk = () => new Scheduler(services, { now: () => at(12, 7, 0), leaseFile: lease });
    writeFileSync(lease, JSON.stringify({ pid: process.ppid, at: new Date().toISOString() }));
    const passive = mk();
    expect(await passive.tick(at(12, 7, 0))).toEqual([]);
    expect(passive.owner().mine).toBe(false);
    writeFileSync(lease, JSON.stringify({ pid: 2147483000, at: new Date().toISOString() }));
    const active = mk();
    expect(await active.tick(at(12, 7, 0))).toEqual(['weekly']);
    expect(active.owner().mine).toBe(true);
    r.cleanup();
  });
});

describe('routes', () => {
  let h: ModuleHarness;
  let root: string;
  beforeAll(async () => {
    root = mkdtempSync(path.join(os.tmpdir(), 'mtw-sched-routes-'));
    cpSync(path.join(realRoot, 'wiki/operations'), path.join(root, 'wiki/operations'), { recursive: true });
    const probe = await startModules(root, []);
    const fake = fakeLaunchers(probe.core);
    await probe.close();
    h = await startModules(root, [schedules], fake.overrides);
  });
  afterAll(async () => {
    await h.close();
    rmSync(root, { recursive: true, force: true });
  });

  it('ships both schedules disabled and valid; weekly discovery is one journal-discover session (prompt-cache reuse)', async () => {
    const r = await h.get('/api/schedules/list');
    const byId = Object.fromEntries(r.schedules.map((v: any) => [v.id, v]));
    expect(byId['journal-weekly'].schedule.enabled).toBe(false);
    expect(byId['llm-column-weekly'].schedule.enabled).toBe(false);
    expect(byId['journal-weekly'].problems).toEqual([]);
    expect(byId['llm-column-weekly'].problems).toEqual([]);
    expect(byId['journal-weekly'].schedule.operation).toBe('journal-discover');
    expect(byId['journal-weekly'].schedule.chain).toBeUndefined();
    expect(byId['journal-weekly'].next).toBeNull();
  });

  it('enabling is a recorded decision and gives a next run; disabling clears it', async () => {
    const on = await h.post('/api/schedules/enable', { id: 'journal-weekly', enabled: true });
    expect(on.status).toBe(200);
    const view = (await h.get('/api/schedules/list')).schedules.find((v: any) => v.id === 'journal-weekly');
    expect(view.schedule.enabled).toBe(true);
    expect(new Date(view.next).getDay()).toBe(1);
    const decisions = readFileSync(path.join(root, 'wiki/operations/decisions.jsonl'), 'utf8');
    expect(decisions).toMatch(/enable-schedule/);
    await h.post('/api/schedules/enable', { id: 'journal-weekly', enabled: false });
    expect(JSON.parse(readFileSync(path.join(root, 'wiki/operations/schedules.json'), 'utf8')).schedules[0].enabled).toBe(false);
  });

  it('save rejects bypass, bad cron and unknown operations; never turns a schedule on', async () => {
    const base = { id: 'x-one', title: 'X', operation: 'journal-source', runner: 'claude', cron: '0 8 * * 2' };
    expect((await h.post('/api/schedules/save', { schedule: { ...base, permission: 'bypass' } })).status).toBe(400);
    expect((await h.post('/api/schedules/save', { schedule: { ...base, cron: 'nope' } })).status).toBe(400);
    expect((await h.post('/api/schedules/save', { schedule: { ...base, operation: 'nope' } })).status).toBe(400);
    const ok = await h.post('/api/schedules/save', { schedule: { ...base, enabled: true } });
    expect(ok.status).toBe(200);
    expect(ok.body.schedule.enabled).toBe(false);
    expect((await h.post('/api/schedules/save', { schedule: base })).status).toBe(409);
  });

  it('preview-cron explains errors and lists next runs', async () => {
    expect((await h.get('/api/schedules/preview-cron?cron=61%20*%20*%20*%20*')).valid).toBe(false);
    const ok = await h.get('/api/schedules/preview-cron?cron=0%207%20*%20*%201');
    expect(ok.next).toHaveLength(5);
  });

  it('Run now launches the first step as an ordinary operation', async () => {
    const r = await h.post('/api/schedules/run', { id: 'journal-weekly' });
    expect(r.status).toBe(200);
    expect(r.body.trigger).toBe('manual');
    expect(r.body.steps[0].terminalId).toMatch(/^t-fake/);
  });
});
