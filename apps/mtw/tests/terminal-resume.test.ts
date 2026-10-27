import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { Events } from '../server/core/events';
import { runnersSchema } from '../server/core/runners';
import { TerminalService } from '../server/core/terminals';
import { TokenTracker, claudeProjectDir } from '../server/core/tokens';

const dirs: string[] = [];
const tmp = () => {
  const d = mkdtempSync(path.join(tmpdir(), 'mtw-resume-'));
  dirs.push(d);
  return d;
};
afterEach(() => {
  while (dirs.length) rmSync(dirs.pop() as string, { recursive: true, force: true });
});
const until = async (fn: () => boolean, ms = 8000) => {
  const end = Date.now() + ms;
  while (!fn() && Date.now() < end) await new Promise((r) => setTimeout(r, 50));
  return fn();
};

// Fake provider CLIs: node writes the argv it was given to MTW_TEST_OUT, then idles briefly.
const script = "require('fs').writeFileSync(process.env.MTW_TEST_OUT, JSON.stringify(process.argv.slice(1))); setTimeout(()=>{},2500)";
const SID = '11111111-2222-3333-4444-555555555555';

function setup() {
  const out = tmp();
  const stateDir = tmp();
  const claudeHome = tmp();
  const codexHome = tmp();
  const cwd = tmp();
  const runners = runnersSchema.parse({
    claude: {
      label: 'Claude',
      executable: process.execPath,
      args: ['-e', script, '--'],
      tokenSource: 'none',
      tokenFallback: 'claude-transcript',
      sessionIdArgs: ['--session-id', '{sessionId}'],
      resumeArgs: ['--resume', '{sessionId}'],
      modelArgs: ['--model', '{model}'],
      effortArgs: ['--effort', '{effort}'],
      models: [{ id: 'claude-sonnet-5-5', label: 'Sonnet 5.5' }, { id: 'claude-opus-5-5', label: 'Opus 5.5' }],
      env: { MTW_TEST_OUT: path.join(out, 'argv-{terminalId}.json') },
      permissions: [
        { id: 'default', label: 'Ask', args: [] },
        { id: 'accept-edits', label: 'Accept edits', args: ['--permission-mode', 'acceptEdits'] },
        { id: 'bypass', label: 'Bypass', args: ['--dangerously-skip-permissions'] },
      ],
    },
    codex: {
      label: 'Codex',
      executable: process.execPath,
      args: ['-e', script, '--'],
      tokenSource: 'codex-rollout',
      resumeArgs: ['resume', '{sessionId}'],
      modelArgs: ['-m', '{model}'],
      effortArgs: ['-c', 'model_reasoning_effort={effort}'],
      models: [{ id: 'gpt-6.1-sol', label: 'GPT-6.1 Sol' }],
      env: { MTW_TEST_OUT: path.join(out, 'argv-{terminalId}.json') },
      permissions: [
        { id: 'default', label: 'Ask', args: [] },
        { id: 'bypass', label: 'Bypass', args: ['--dangerously-bypass-approvals-and-sandbox'] },
      ],
    },
  });
  const make = () => new TerminalService({ repoRoot: cwd, stateDir, runners: () => runners, events: new Events(), tokens: new TokenTracker({ claudeHome, codexHome }), homes: { claude: claudeHome, codex: codexHome }, tokenPollMs: 100 });
  const argvOf = async (id: string): Promise<string[]> => {
    const file = path.join(out, `argv-${id}.json`);
    expect(await until(() => existsSync(file) && readFileSync(file, 'utf8').length > 0)).toBe(true);
    return JSON.parse(readFileSync(file, 'utf8')) as string[];
  };
  const claudeTranscript = (sid: string) => {
    const dir = path.join(claudeHome, 'projects', claudeProjectDir(cwd));
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, `${sid}.jsonl`), '{"type":"user"}\n');
  };
  const codexRollout = (sid: string) => {
    const day = path.join(codexHome, 'sessions', '2026', '10', '11');
    mkdirSync(day, { recursive: true });
    const file = path.join(day, `rollout-2026-10-11T01-02-03-${sid}.jsonl`);
    writeFileSync(file, `${JSON.stringify({ type: 'session_meta', payload: { id: sid, cwd, timestamp: new Date().toISOString() } })}\n`);
    return file;
  };
  return { stateDir, cwd, make, argvOf, claudeTranscript, codexRollout };
}

describe('terminal session ids survive a Studio restart', () => {
  it('keeps the Claude session id, and shows a crashed (still "running" on disk) terminal as interrupted', async () => {
    const t = setup();
    const a = t.make();
    const info = a.spawn({ runner: 'claude', title: 'Work', module: 'operations', cwd: t.cwd, model: 'claude-x' });
    expect(info.sessionId).toMatch(/^[0-9a-f-]{36}$/);
    // No kill, no shutdown: the Studio process "crashes" and run.json still says running.
    const b = t.make();
    const back = b.get(info.id);
    expect(back).toMatchObject({ id: info.id, status: 'exited', interrupted: true, sessionId: info.sessionId, model: 'claude-x' });
    expect(b.list().map((x) => x.id)).toContain(info.id);
    await a.shutdown();
  }, 30000);

  it('learns the Codex conversation id from the rollout it binds to and stores it', async () => {
    const t = setup();
    const svc = t.make();
    const info = svc.spawn({ runner: 'codex', title: 'Codex job', cwd: t.cwd });
    expect(info.sessionId).toBeUndefined();
    t.codexRollout(SID);
    expect(await until(() => svc.get(info.id)?.sessionId === SID)).toBe(true);
    svc.kill(info.id);
    await svc.shutdown();
    const run = JSON.parse(readFileSync(path.join(t.stateDir, 'runs', info.id, 'run.json'), 'utf8'));
    expect(run.sessionId).toBe(SID);
    expect(t.make().get(info.id)?.sessionId).toBe(SID);
  }, 30000);
});

describe('New terminal passes the confirmed model and effort to the CLI', () => {
  it('claude: --model claude-sonnet-5-5 --effort medium; codex: -m gpt-6.1-sol -c model_reasoning_effort=high', async () => {
    const t = setup();
    const a = t.make();
    const c = a.spawn({ runner: 'claude', title: 'Claude', module: 'operations', cwd: t.cwd, permission: 'accept-edits', model: 'claude-sonnet-5-5', effort: 'medium' });
    const x = a.spawn({ runner: 'codex', title: 'Codex', module: 'operations', cwd: t.cwd, model: 'gpt-6.1-sol', effort: 'high' });
    const cArgv = (await t.argvOf(c.id)).join(' ');
    expect(cArgv).toContain('--permission-mode acceptEdits');
    expect(cArgv).toContain('--model claude-sonnet-5-5 --effort medium');
    expect((await t.argvOf(x.id)).join(' ')).toContain('-m gpt-6.1-sol -c model_reasoning_effort=high');
    a.kill(c.id);
    a.kill(x.id);
    await a.shutdown();
  }, 30000);
});

describe('resuming a past terminal', () => {
  it('claude: --resume <id> in a new terminal with the same model, folder and permission', async () => {
    const t = setup();
    const a = t.make();
    const old = a.spawn({ runner: 'claude', title: 'Work', operation: 'op-x', module: 'images', subject: 'img:1', cwd: t.cwd, model: 'claude-x', permission: 'accept-edits' });
    t.claudeTranscript(old.sessionId as string);
    a.kill(old.id);
    await a.shutdown();
    const b = t.make();
    const next = b.resume(old.id);
    expect(next.id).not.toBe(old.id);
    expect(next).toMatchObject({ resumedFrom: old.id, sessionId: old.sessionId, status: 'running', operation: 'op-x', module: 'images', subject: 'img:1', model: 'claude-x' });
    const argv = await t.argvOf(next.id);
    expect(argv).toEqual(['--resume', old.sessionId, '--permission-mode', 'acceptEdits', '--model', 'claude-x']);
    expect(argv).not.toContain('--session-id');
    b.kill(next.id);
    await b.shutdown();
  }, 30000);

  it('codex: "resume <id>" subcommand, and a bypass permission is never reused', async () => {
    const t = setup();
    const a = t.make();
    const old = a.spawn({ runner: 'codex', title: 'Codex job', cwd: t.cwd, permission: 'bypass', model: 'gpt-x' });
    t.codexRollout(SID);
    expect(await until(() => a.get(old.id)?.sessionId === SID)).toBe(true);
    a.kill(old.id);
    await a.shutdown();
    const b = t.make();
    const next = b.resume(old.id);
    const argv = await t.argvOf(next.id);
    expect(argv).toEqual(['resume', SID, '-m', 'gpt-x']);
    expect(argv.join(' ')).not.toMatch(/bypass|dangerously/);
    b.kill(next.id);
    await b.shutdown();
  }, 30000);

  it('Resume with a changed model and effort passes them into the argv; unchanged fields keep the original', async () => {
    const t = setup();
    const a = t.make();
    const old = a.spawn({ runner: 'claude', title: 'Work', cwd: t.cwd, model: 'claude-sonnet-5-5', effort: 'medium' });
    t.claudeTranscript(old.sessionId as string);
    a.kill(old.id);
    await a.shutdown();
    const b = t.make();
    const same = b.resume(old.id);
    expect(await t.argvOf(same.id)).toEqual(['--resume', old.sessionId, '--model', 'claude-sonnet-5-5', '--effort', 'medium']);
    const changed = b.resume(old.id, { model: 'claude-opus-5-5', effort: 'high' });
    expect(await t.argvOf(changed.id)).toEqual(['--resume', old.sessionId, '--model', 'claude-opus-5-5', '--effort', 'high']);
    expect(changed).toMatchObject({ model: 'claude-opus-5-5', effort: 'high' });
    // A bypass permission is never accepted, even when asked for.
    expect(() => b.resume(old.id, { permission: 'bypass' })).toThrow(/never offered/);
    const asked = b.resume(old.id, { permission: 'accept-edits' });
    expect(await t.argvOf(asked.id)).toContain('acceptEdits');
    for (const x of [same, changed, asked]) b.kill(x.id);
    await b.shutdown();
  }, 30000);

  it('refuses a model listed under another provider; an unlisted typed id still launches', async () => {
    const t = setup();
    const a = t.make();
    expect(() => a.spawn({ runner: 'codex', title: 'x', cwd: t.cwd, model: 'claude-opus-5-5' })).toThrow(/Claude model.*cannot run in Codex/);
    expect(() => a.spawn({ runner: 'claude', title: 'x', cwd: t.cwd, model: 'gpt-6.1-sol' })).toThrow(/Codex model.*cannot run in Claude/);
    const typed = a.spawn({ runner: 'claude', title: 'x', cwd: t.cwd, model: 'my-typed-model' });
    expect(typed.model).toBe('my-typed-model');
    a.kill(typed.id);
    await a.shutdown();
  }, 30000);

  it('refuses with a plain message when the transcript is missing, the id was never saved, or the terminal still runs', async () => {
    const t = setup();
    const a = t.make();
    const live = a.spawn({ runner: 'claude', title: 'Work', cwd: t.cwd });
    expect(() => a.resume(live.id)).toThrow(/still running/);
    a.kill(live.id);
    await a.shutdown();
    // No transcript was ever written for this session.
    expect(() => t.make().resume(live.id)).toThrow(/saved transcript .* is missing/);
    // A codex run that never bound a rollout has no id to resume.
    const c = t.make();
    const noId = c.spawn({ runner: 'codex', title: 'Codex job', cwd: t.cwd });
    c.kill(noId.id);
    await c.shutdown();
    expect(() => t.make().resume(noId.id)).toThrow(/did not save/);
    expect(() => t.make().resume('t-00000000')).toThrow(/not in the list/);
  }, 30000);
});
