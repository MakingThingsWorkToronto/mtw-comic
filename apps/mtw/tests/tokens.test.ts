import { appendFileSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { OtelReceiver } from '../server/core/otel';
import { ClaudeAccumulator, CodexAccumulator, TailReader, TokenTracker, claudeProjectDir, summarizeRuns } from '../server/core/tokens';
import type { RunRecord } from '../server/core/tokens';

const fixtures = path.join(fileURLToPath(new URL('.', import.meta.url)), 'fixtures', 'tokens');
const lines = (name: string) => readFileSync(path.join(fixtures, name), 'utf8').split('\n').filter(Boolean);
const dirs: string[] = [];
const tmp = () => {
  const d = mkdtempSync(path.join(tmpdir(), 'mtw-tokens-'));
  dirs.push(d);
  return d;
};
afterEach(() => {
  while (dirs.length) rmSync(dirs.pop() as string, { recursive: true, force: true });
});

describe('claude transcript', () => {
  it('dedupes streamed message ids and skips synthetic models', () => {
    const acc = new ClaudeAccumulator();
    for (const l of lines('claude.jsonl')) acc.addLine(l);
    const t = acc.totals();
    expect(t).toMatchObject({ input: 15, output: 100, cacheRead: 200, cacheWrite: 100, total: 415, model: 'claude-opus-5-5', source: 'claude-transcript' });
    expect(t?.cacheHitRate).toBeCloseTo(200 / 315);
  });

  it('munges the cwd into the project folder name', () => {
    expect(claudeProjectDir('C:\\Code\\MTWWebsite-clean')).toBe('C--Code-MTWWebsite-clean');
    expect(claudeProjectDir('/home/a/b')).toBe('-home-a-b');
  });
});

describe('codex rollout', () => {
  it('takes the latest total, splitting cached input out of input', () => {
    const acc = new CodexAccumulator();
    for (const l of lines('codex.jsonl')) acc.addLine(l);
    expect(acc.totals()).toMatchObject({ input: 500, output: 120, cacheRead: 1500, cacheWrite: 0, total: 2120, model: 'gpt-5.5', source: 'codex-rollout' });
    expect(acc.totals()?.cacheHitRate).toBeCloseTo(0.75);
  });
});

describe('TailReader', () => {
  it('reads only appended bytes and holds back a partial last line', () => {
    const file = path.join(tmp(), 't.jsonl');
    writeFileSync(file, 'one\ntwo\npart');
    const r = new TailReader(file);
    expect(r.readLines().lines).toEqual(['one', 'two']);
    expect(r.readLines().lines).toEqual([]);
    appendFileSync(file, 'ial\nthree\n');
    expect(r.readLines().lines).toEqual(['partial', 'three']);
    writeFileSync(file, 'x\n'); // truncated: start over
    expect(r.readLines()).toEqual({ lines: ['x'], reset: true });
  });
});

describe('TokenTracker', () => {
  it('finds a claude transcript by session id and follows appends', () => {
    const home = tmp();
    const cwd = 'C:\\Code\\Fixture';
    const dir = path.join(home, 'projects', claudeProjectDir(cwd));
    mkdirSync(dir, { recursive: true });
    const tracker = new TokenTracker({ claudeHome: home, codexHome: path.join(home, 'nocodex') });
    const h = tracker.track('claude-transcript', { terminalId: 't-00000001', cwd, startedAt: new Date(), sessionId: 'sess-1' });
    expect(h?.refresh()).toBeNull();
    const file = path.join(dir, 'sess-1.jsonl');
    copyFileSync(path.join(fixtures, 'claude.jsonl'), file);
    expect(h?.refresh()?.total).toBe(415);
    expect(h?.refresh()).toBeNull();
    appendFileSync(file, `${JSON.stringify({ type: 'assistant', message: { id: 'msg_c', model: 'm', usage: { input_tokens: 1, output_tokens: 1 } } })}\n`);
    expect(h?.refresh()?.total).toBe(417);
    expect(h?.transcriptPath()).toBe(file);
  });

  it('binds a codex rollout by cwd and start time, never to two terminals', () => {
    const home = tmp();
    const cwd = 'C:\\Code\\Fixture';
    const started = new Date();
    const now = new Date();
    const day = path.join(home, 'sessions', String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0'));
    mkdirSync(day, { recursive: true });
    const rollout = (name: string, c: string, at: Date) =>
      writeFileSync(path.join(day, name), `${JSON.stringify({ type: 'session_meta', payload: { cwd: c, timestamp: at.toISOString() } })}\n` + lines('codex.jsonl').slice(1).join('\n') + '\n');
    rollout('rollout-other.jsonl', 'C:\\Code\\Elsewhere', new Date(started.getTime() + 500));
    rollout('rollout-old.jsonl', cwd, new Date(started.getTime() - 60_000));
    rollout('rollout-mine.jsonl', cwd, new Date(started.getTime() + 1000));
    const tracker = new TokenTracker({ claudeHome: path.join(home, 'noclaude'), codexHome: home });
    const a = tracker.track('codex-rollout', { terminalId: 't-00000001', cwd: 'c:/code/fixture/', startedAt: started });
    expect(a?.refresh()?.total).toBe(2120);
    expect(a?.transcriptPath()).toMatch(/rollout-mine/);
    const b = tracker.track('codex-rollout', { terminalId: 't-00000002', cwd, startedAt: started });
    expect(b?.refresh()).toBeNull();
    expect(tracker.track('none', { terminalId: 'x', cwd, startedAt: started })).toBeNull();
  });
});

const point = (type: string, value: number, extra: Record<string, string> = {}) => ({
  attributes: [{ key: 'type', value: { stringValue: type } }, { key: 'model', value: { stringValue: 'claude-opus-5-5' } }, ...Object.entries(extra).map(([key, v]) => ({ key, value: { stringValue: v } }))],
  asInt: String(value),
});
const metricsDoc = (terminalId: string, pts: ReturnType<typeof point>[], temporality = 1) => ({
  resourceMetrics: [
    {
      resource: { attributes: [{ key: 'mtw.terminal_id', value: { stringValue: terminalId } }] },
      scopeMetrics: [{ metrics: [{ name: 'claude_code.token.usage', sum: { aggregationTemporality: temporality, dataPoints: pts } }, { name: 'claude_code.cost.usage', sum: { aggregationTemporality: temporality, dataPoints: [{ asDouble: 0.25 }] } }] }],
    },
  ],
});

describe('OtelReceiver', () => {
  const make = () => {
    const stateDir = tmp();
    mkdirSync(path.join(stateDir, 'runs', 't-0000000a'), { recursive: true });
    const warns: string[] = [];
    const r = new OtelReceiver({ stateDir, warn: (m) => warns.push(m), terminalForSession: (s) => (s === 'sess-9' ? 't-0000000a' : undefined) });
    return { r, stateDir, warns };
  };
  const post = (r: OtelReceiver, kind: 'metrics' | 'logs' | 'traces', doc: unknown) => r.handle(kind, 'application/json', Buffer.from(JSON.stringify(doc)));

  it('sums delta token metrics per terminal and writes otel.json', () => {
    const { r, stateDir } = make();
    expect(post(r, 'metrics', metricsDoc('t-0000000a', [point('input', 10), point('output', 20), point('cacheRead', 70), point('cacheCreation', 0)])).status).toBe(200);
    post(r, 'metrics', metricsDoc('t-0000000a', [point('input', 5), point('output', 5)]));
    const t = r.totals('t-0000000a');
    expect(t).toMatchObject({ input: 15, output: 25, cacheRead: 70, total: 110, source: 'otel', model: 'claude-opus-5-5' });
    expect(t?.costUsd).toBeCloseTo(0.5);
    r.flush();
    expect(JSON.parse(readFileSync(path.join(stateDir, 'runs', 't-0000000a', 'otel.json'), 'utf8')).totals.total).toBe(110);
  });

  it('replaces cumulative points instead of adding', () => {
    const { r } = make();
    post(r, 'metrics', metricsDoc('t-0000000a', [point('input', 10)], 2));
    post(r, 'metrics', metricsDoc('t-0000000a', [point('input', 30)], 2));
    expect(r.totals('t-0000000a')?.input).toBe(30);
  });

  it('maps by session.id and counts unmatched resources', () => {
    const { r } = make();
    const doc = { resourceMetrics: [{ resource: { attributes: [{ key: 'session.id', value: { stringValue: 'sess-9' } }] }, scopeMetrics: [{ metrics: [{ name: 'claude_code.token.usage', sum: { dataPoints: [point('output', 7)] } }] }] }] };
    post(r, 'metrics', doc);
    expect(r.totals('t-0000000a')?.output).toBe(7);
    post(r, 'metrics', metricsDoc('t-ffffffff', [point('input', 1)]));
    expect(r.unmatched).toBeGreaterThan(0);
  });

  it('falls back to api_request log events when no token metric arrived, and records events', () => {
    const { r, stateDir } = make();
    const rec = (name: string, a: Record<string, string | number>) => ({ attributes: [{ key: 'event.name', value: { stringValue: name } }, ...Object.entries(a).map(([key, v]) => ({ key, value: typeof v === 'number' ? { intValue: String(v) } : { stringValue: v } }))] });
    post(r, 'logs', { resourceLogs: [{ resource: { attributes: [{ key: 'mtw.terminal_id', value: { stringValue: 't-0000000a' } }] }, scopeLogs: [{ logRecords: [rec('claude_code.api_request', { input_tokens: 3, output_tokens: 4, cache_read_tokens: 5, model: 'm' }), rec('claude_code.tool_result', { tool_name: 'Bash' })] }] }] });
    expect(r.totals('t-0000000a')).toMatchObject({ input: 3, output: 4, cacheRead: 5, total: 12 });
    expect(readFileSync(path.join(stateDir, 'runs', 't-0000000a', 'otel-events.jsonl'), 'utf8').trim().split('\n')).toHaveLength(2);
  });

  it('refuses protobuf with 415 and warns once', () => {
    const { r, warns } = make();
    expect(r.handle('metrics', 'application/x-protobuf', Buffer.from([1, 2])).status).toBe(415);
    expect(r.handle('logs', 'application/x-protobuf', Buffer.from([1, 2])).status).toBe(415);
    expect(warns).toHaveLength(1);
    expect(r.handle('metrics', 'application/json', Buffer.from('{nope')).status).toBe(400);
  });
});

describe('summarizeRuns', () => {
  const tk = (total: number, input = total, cacheRead = 0) => ({ input, output: 0, cacheRead, cacheWrite: 0, total, cacheHitRate: 0 });
  it('groups by day, runner and operation', () => {
    const now = new Date(2026, 9, 9, 15, 0, 0);
    const run = (id: string, runner: string, operation: string | undefined, at: Date, tokens?: ReturnType<typeof tk>): RunRecord => ({ id, runner, title: operation ?? 'Terminal', ...(operation ? { operation } : {}), module: 'images', startedAt: at.toISOString(), status: 'exited', ...(tokens ? { tokens } : {}) });
    const s = summarizeRuns(
      [run('1', 'claude', 'register', now, tk(100, 20, 80)), run('2', 'codex', 'register', now, tk(50)), run('3', 'claude', 'check', new Date(2026, 9, 8, 9, 0, 0), tk(10)), run('4', 'shell', undefined, now)],
      now,
    );
    expect(s.today.total).toBe(150);
    expect(s.all.total).toBe(160);
    expect(s.byDay.map((d) => d.key)).toEqual(['2026-10-09', '2026-10-08']);
    expect(s.byRunner[0]).toMatchObject({ key: 'claude', total: 110 });
    expect(s.byOperation[0]).toMatchObject({ label: 'register', runs: 2, total: 150 });
    expect(s.all.cacheHitRate).toBeCloseTo(80 / (20 + 80 + 50 + 10));
  });
});
