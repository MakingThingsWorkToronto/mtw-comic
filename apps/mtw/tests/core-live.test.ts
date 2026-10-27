import { appendFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { startApp } from '../server/app';
import type { RunningApp } from '../server/app';
import { Events } from '../server/core/events';
import { FileLeases } from '../server/core/leases';
import { runnersSchema } from '../server/core/runners';
import { TerminalService } from '../server/core/terminals';
import { TokenTracker, claudeProjectDir } from '../server/core/tokens';
import { ManifestWatcher } from '../server/core/watcher';
import { FileWikiStore } from '../server/core/wiki-store';
import { matchesChange } from '../web/state';

const appRoot = fileURLToPath(new URL('..', import.meta.url));
const repoRoot = path.resolve(appRoot, '..', '..');

/** A temp repo root carrying the real prompt templates (prompt text lives in wiki/operations/templates, never in code). */
function withTemplates(root: string): string {
  cpSync(path.join(repoRoot, 'wiki', 'operations', 'templates'), path.join(root, 'wiki', 'operations', 'templates'), { recursive: true });
  return root;
}
const dirs: string[] = [];
const tmp = () => {
  const d = mkdtempSync(path.join(tmpdir(), 'mtw-live-'));
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

describe('runners.json', () => {
  const runners = runnersSchema.parse(JSON.parse(readFileSync(path.join(repoRoot, 'wiki', 'operations', 'runners.json'), 'utf8')));
  it('keeps claude, codex and shell proven; opencode is a listed, untested data row', () => {
    for (const id of ['claude', 'codex', 'shell']) expect(runners[id]?.status).toBe('proven');
    expect(runners.opencode?.status).toBe('untested');
    expect(runners.claude).toMatchObject({ tokenSource: 'otel', tokenFallback: 'claude-transcript' });
    expect(runners.claude?.sessionIdArgs).toEqual(['--session-id', '{sessionId}']);
    expect(runners.claude?.env.OTEL_EXPORTER_OTLP_PROTOCOL).toBe('http/json');
    expect(runners.codex?.tokenSource).toBe('codex-rollout');
  });
});

describe('TerminalService token tracking', () => {
  // A fake "claude"/"codex" that just sleeps; the real argv is visible to node after `--`.
  const fakeRunners = (extra: Record<string, unknown> = {}) =>
    runnersSchema.parse({
      claude: { label: 'Claude', executable: process.execPath, args: ['-e', 'setTimeout(()=>{},2500)', '--'], tokenSource: 'otel', tokenFallback: 'claude-transcript', sessionIdArgs: ['--session-id', '{sessionId}'], env: { OTEL_RESOURCE_ATTRIBUTES: 'mtw.terminal_id={terminalId},mtw.operation={operation}', MTW_TEST_PORT: '{port}' } },
      codex: { label: 'Codex', executable: process.execPath, args: ['-e', 'setTimeout(()=>{},2500)', '--'], tokenSource: 'codex-rollout' },
      ghost: { label: 'Ghost', executable: process.execPath, status: 'untested' },
      ...extra,
    });

  it('uses the claude transcript as fallback, then OTel numbers when they arrive; refuses untested runners', async () => {
    const stateDir = tmp();
    const claudeHome = tmp();
    const cwd = withTemplates(tmp());
    const svc = new TerminalService({ repoRoot: cwd, stateDir, runners: () => fakeRunners(), events: new Events(), tokens: new TokenTracker({ claudeHome, codexHome: path.join(claudeHome, 'x') }), tokenPollMs: 100 });
    svc.setPort(4999);
    expect(() => svc.spawn({ runner: 'ghost', title: 'g' })).toThrow(/untested/);

    const info = svc.spawn({ runner: 'claude', title: 'Register images', operation: 'images-register', module: 'images', prompt: '# do it\n', cwd });
    expect(info.sessionId).toMatch(/^[0-9a-f-]{36}$/);
    expect(info.hasPrompt).toBe(true);
    expect(readFileSync(svc.promptFile(info.id) as string, 'utf8')).toContain('# do it');
    const run = JSON.parse(readFileSync(path.join(stateDir, 'runs', info.id, 'run.json'), 'utf8'));
    expect(run.sessionId).toBe(info.sessionId);
    expect(run.otel).toBe(true);

    const dir = path.join(claudeHome, 'projects', claudeProjectDir(cwd));
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, `${info.sessionId}.jsonl`), `${JSON.stringify({ type: 'assistant', message: { id: 'm1', model: 'claude-x', usage: { input_tokens: 4, output_tokens: 6, cache_read_input_tokens: 90 } } })}\n`);
    expect(await until(() => svc.get(info.id)?.tokens?.total === 100)).toBe(true);
    expect(svc.get(info.id)?.tokens?.source).toBe('claude-transcript');

    const point = (type: string, v: number) => ({ attributes: [{ key: 'type', value: { stringValue: type } }], asInt: String(v) });
    const res = svc.otel.handle('metrics', 'application/json', Buffer.from(JSON.stringify({ resourceMetrics: [{ resource: { attributes: [{ key: 'mtw.terminal_id', value: { stringValue: info.id } }] }, scopeMetrics: [{ metrics: [{ name: 'claude_code.token.usage', sum: { aggregationTemporality: 1, dataPoints: [point('input', 1000), point('output', 500)] } }] }] }] })));
    expect(res.status).toBe(200);
    expect(await until(() => svc.get(info.id)?.tokens?.source === 'otel')).toBe(true);
    expect(svc.get(info.id)?.tokens?.total).toBe(1500);

    svc.kill(info.id);
    await svc.shutdown();
    const done = JSON.parse(readFileSync(path.join(stateDir, 'runs', info.id, 'run.json'), 'utf8'));
    expect(done.status).toBe('exited');
    expect(done.tokens.total).toBe(1500);
    expect(svc.usageSummary().all.total).toBe(1500);
  }, 30000);

  it('closes a run that declared idleMinutes once it has been quiet that long, and only that run', async () => {
    const stateDir = tmp();
    const cwd = withTemplates(tmp());
    const svc = new TerminalService({ repoRoot: cwd, stateDir, runners: () => fakeRunners(), events: new Events(), tokens: new TokenTracker({ claudeHome: tmp(), codexHome: tmp() }) });
    const idle = svc.spawn({ runner: 'codex', title: 'feedback', operation: 'comics-box-feedback', idleMinutes: 5, cwd });
    const plain = svc.spawn({ runner: 'codex', title: 'plain', cwd });
    expect(svc.get(idle.id)?.idleMinutes).toBe(5);
    expect(svc.sweepIdle(Date.now() + 4 * 60_000)).toEqual([]);
    expect(svc.sweepIdle(Date.now() + 6 * 60_000)).toEqual([idle.id]);
    expect(await until(() => svc.get(idle.id)?.status === 'exited')).toBe(true);
    expect(svc.get(idle.id)?.closedReason).toBe('idle');
    expect(svc.get(plain.id)?.status).toBe('running');
    await svc.shutdown();
  }, 30000);

  it('binds a codex rollout after spawn', async () => {
    const stateDir = tmp();
    const codexHome = tmp();
    const cwd = withTemplates(tmp());
    const svc = new TerminalService({ repoRoot: cwd, stateDir, runners: () => fakeRunners(), events: new Events(), tokens: new TokenTracker({ claudeHome: path.join(codexHome, 'x'), codexHome }), tokenPollMs: 100 });
    const info = svc.spawn({ runner: 'codex', title: 'Codex job', cwd });
    const now = new Date();
    const day = path.join(codexHome, 'sessions', String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0'));
    mkdirSync(day, { recursive: true });
    const meta = { type: 'session_meta', payload: { cwd, timestamp: new Date().toISOString() } };
    const count = { type: 'event_msg', payload: { type: 'token_count', info: { total_token_usage: { input_tokens: 300, cached_input_tokens: 100, output_tokens: 20, total_tokens: 320 } } } };
    writeFileSync(path.join(day, 'rollout-test.jsonl'), `${JSON.stringify(meta)}\n${JSON.stringify(count)}\n`);
    expect(await until(() => svc.get(info.id)?.tokens?.total === 320)).toBe(true);
    expect(svc.get(info.id)?.tokens).toMatchObject({ input: 200, cacheRead: 100, output: 20, source: 'codex-rollout' });
    svc.kill(info.id);
    await svc.shutdown();
  }, 30000);
});

describe('OTLP receiver and run files on the app port', () => {
  let app: RunningApp;
  beforeAll(async () => {
    app = await startApp({ repoRoot, appRoot, port: 0 });
  });
  afterAll(async () => {
    await app.close();
  });
  const request = (opts: { method?: string; path: string; headers?: Record<string, string>; body?: string }) =>
    new Promise<{ status: number; body: string }>((resolve, reject) => {
      const req = http.request({ host: '127.0.0.1', port: app.port, method: opts.method ?? 'GET', path: opts.path, headers: opts.headers }, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
      });
      req.on('error', reject);
      req.end(opts.body);
    });

  it('accepts OTLP JSON on all three signals, refuses protobuf, keeps the Host check', async () => {
    for (const kind of ['metrics', 'logs', 'traces']) {
      expect((await request({ method: 'POST', path: `/v1/${kind}`, headers: { 'content-type': 'application/json' }, body: '{}' })).status).toBe(200);
    }
    expect((await request({ method: 'POST', path: '/v1/metrics', headers: { 'content-type': 'application/x-protobuf' }, body: 'x' })).status).toBe(415);
    expect((await request({ method: 'POST', path: '/v1/metrics', headers: { 'content-type': 'application/json', host: 'evil.example' }, body: '{}' })).status).toBe(403);
    expect((await request({ path: '/v1/metrics' })).status).toBe(405);
  });

  it('serves the usage summary and a terminal prompt file read-only', async () => {
    const s = JSON.parse((await request({ path: '/api/tokens/summary' })).body);
    expect(s).toHaveProperty('byDay');
    expect(s).toHaveProperty('byOperation');
    expect((await request({ path: '/api/terminals/t-deadbeef/prompt.md' })).status).toBe(404);
    expect((await request({ path: '/api/terminals/..%2F..%2Fpackage.json/prompt.md' })).status).toBe(404);
    const runners = JSON.parse((await request({ path: '/api/operations/runners' })).body) as { id: string; status: string }[];
    expect(runners.find((r) => r.id === 'opencode')?.status).toBe('untested');
  });
});

describe('every launch goes through the core terminal service', () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((n) => {
      if (n === 'node_modules') return [];
      const p = path.join(dir, n);
      return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(n) ? [p] : [];
    });
  it('no module imports node-pty/pty directly or spawns claude/codex itself', () => {
    const offenders: string[] = [];
    for (const file of walk(path.join(appRoot, 'modules'))) {
      const text = readFileSync(file, 'utf8');
      if (/node-pty|core\/pty|spawnPty/.test(text)) offenders.push(`${file}: pty`);
      if (/child_process/.test(text) && /['"`](claude|codex)(\.cmd|\.exe)?['"`]/.test(text)) offenders.push(`${file}: child_process + claude/codex`);
    }
    for (const file of walk(path.join(appRoot, 'server'))) {
      if (/core[\\/](pty|terminals)\.ts$/.test(file)) continue;
      if (/node-pty|\.\/pty|spawnPty/.test(readFileSync(file, 'utf8'))) offenders.push(`${file}: pty`);
    }
    expect(offenders).toEqual([]);
  });
});

describe('ManifestWatcher', () => {
  it('emits wiki-changed for every module manifest, including late-created folders, and ignores unrelated files', async () => {
    const root = tmp();
    mkdirSync(path.join(root, 'wiki', 'a'), { recursive: true });
    mkdirSync(path.join(root, 'wiki', 'b'), { recursive: true });
    mkdirSync(path.join(root, 'wiki', 'other'), { recursive: true });
    writeFileSync(path.join(root, 'wiki', 'b', 'one.json'), '{}');
    const events = new Events();
    const seen: { module: string; paths: string[] }[] = [];
    events.on((type, data) => type === 'wiki-changed' && seen.push(data as { module: string; paths: string[] }));
    const store = new FileWikiStore(root, new FileLeases(root));
    const watcher = new ManifestWatcher(root, store, events, 50);
    watcher.start([
      { id: 'a', title: 'A', nav: { label: 'A', order: 1 }, manifest: ['wiki/a/*.json'] },
      { id: 'b', title: 'B', nav: { label: 'B', order: 2 }, manifest: ['wiki/b/one.json'] },
    ]);
    try {
      writeFileSync(path.join(root, 'wiki', 'a', 'x.json'), '{"v":1}');
      writeFileSync(path.join(root, 'wiki', 'a', 'ignored.txt'), 'no');
      appendFileSync(path.join(root, 'wiki', 'b', 'one.json'), ' ');
      writeFileSync(path.join(root, 'wiki', 'other', 'y.json'), '{}');
      expect(await until(() => seen.some((e) => e.module === 'a') && seen.some((e) => e.module === 'b'))).toBe(true);
      expect(seen.flatMap((e) => e.paths)).not.toContain('wiki/other/y.json');
      expect(seen.flatMap((e) => e.paths)).not.toContain('wiki/a/ignored.txt');
      expect(existsSync(root)).toBe(true);
    } finally {
      watcher.stop();
    }
  });
});

describe('client change matching', () => {
  it('matches module ids, paths and globs; "*" always matches', () => {
    const change = { module: 'journal', paths: ['wiki/journal/records/2026-10-09.md'] };
    expect(matchesChange('journal', change)).toBe(true);
    expect(matchesChange('images', change)).toBe(false);
    expect(matchesChange(['images', 'wiki/journal/records/*.md'], change)).toBe(true);
    expect(matchesChange('wiki/journal/**', change)).toBe(true);
    expect(matchesChange('wiki/journal/queue.json', change)).toBe(false);
    expect(matchesChange('images', { module: '*', paths: [] })).toBe(true);
    expect(matchesChange(undefined, change)).toBe(true);
  });
});
