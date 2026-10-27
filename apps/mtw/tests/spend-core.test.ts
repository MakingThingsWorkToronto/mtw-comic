import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { afterEach, describe, expect, it } from 'vitest';
import { buildOverview, parseBudgets, parseLedgerEntry } from '../modules/spend/server';
import { ApiRouter, ROOT_POST_ALLOWLIST } from '../server/router';
import { media, parseRange } from '../server/core/media';
import { FileDecisionLog } from '../server/core/decisions';
import { FileLeases } from '../server/core/leases';
import { PricingTable, budgetStatuses, isoWeekKey, writeWeeklyRollup } from '../server/core/spend';
import { summarizeRuns } from '../server/core/tokens';
import type { RunRecord } from '../server/core/tokens';
import { FileWikiStore } from '../server/core/wiki-store';

const dirs: string[] = [];
const tmp = () => {
  const d = mkdtempSync(path.join(tmpdir(), 'mtw-spend-'));
  dirs.push(d);
  return d;
};
afterEach(() => {
  while (dirs.length) rmSync(dirs.pop() as string, { recursive: true, force: true });
});

const priceFile = (dir: string) => {
  const f = path.join(dir, 'pricing.json');
  writeFileSync(f, JSON.stringify({ models: { 'claude-opus': { input: 10, output: 50, cacheRead: 1, cacheWrite: 12 }, 'claude-opus-fast': { input: 1, output: 1, cacheRead: 0, cacheWrite: 0 } } }));
  return f;
};

describe('PricingTable', () => {
  it('matches the longest key in the model id and estimates cost and cache savings', () => {
    const t = new PricingTable(priceFile(tmp()));
    expect(t.priceFor('claude-opus-5-5')?.input).toBe(10);
    expect(t.priceFor('Claude-Opus-Fast-1')?.input).toBe(1);
    expect(t.priceFor('mystery')).toBeNull();
    const base = { input: 1_000_000, output: 100_000, cacheRead: 2_000_000, cacheWrite: 0, total: 3_100_000, cacheHitRate: 0.66, model: 'claude-opus-5-5' };
    const e = t.withEstimate(base);
    expect(e.estCostUsd).toBeCloseTo(10 + 5 + 2);
    expect(e.cacheSavingsUsd).toBeCloseTo(2 * 9);
    expect(t.withEstimate({ ...base, model: 'mystery' }).estCostUsd).toBeUndefined();
  });
});

describe('weekly rollup and budgets', () => {
  const tk = (total: number, cost: number) => ({ input: total, output: 0, cacheRead: 0, cacheWrite: 0, total, cacheHitRate: 0, estCostUsd: cost });
  const run = (id: string, runner: string, module: string, at: Date, total: number, cost: number): RunRecord => ({ id, runner, title: 'T', operation: `${module}-op`, module, startedAt: at.toISOString(), status: 'exited', tokens: tk(total, cost) });

  it('computes ISO week keys', () => {
    expect(isoWeekKey(new Date(2026, 9, 9))).toBe('2026-41');
    expect(isoWeekKey(new Date(2026, 0, 1))).toBe('2026-01');
  });

  it('writes a small weekly file with totals only, no prompts', () => {
    const repo = tmp();
    const now = new Date(2026, 9, 9, 12);
    const file = writeWeeklyRollup(repo, [run('a', 'claude', 'images', now, 100, 1), run('b', 'codex', 'images', now, 50, 0.5), run('c', 'claude', 'journal', new Date(2026, 8, 1), 999, 9)], now);
    expect(file.replace(/\\/g, '/')).toMatch(/wiki\/operations\/usage\/2026-41\.json$/);
    const doc = JSON.parse(readFileSync(file, 'utf8'));
    expect(doc.runs).toBe(2);
    expect(doc.totals.total).toBe(150);
    expect(doc.byModule).toHaveLength(1);
    expect(doc.byModule[0]).toMatchObject({ key: 'images', runs: 2, total: 150 });
    expect(doc.byRunner.map((r: { key: string }) => r.key).sort()).toEqual(['claude', 'codex']);
    expect(JSON.stringify(doc)).not.toContain('"prompt"');
  });

  it('measures monthly budgets per scope and flags 80%', () => {
    const now = new Date(2026, 9, 9, 12);
    const runs = [run('a', 'claude', 'images', now, 100, 40), run('b', 'codex', 'images', now, 50, 5), run('c', 'claude', 'images', new Date(2026, 8, 30), 1000, 500)];
    const s = budgetStatuses([{ scope: 'runner', key: 'claude', limitUsd: 50 }, { scope: 'total', limitTokens: 1000 }, { scope: 'module', key: 'images', limitUsd: 1000 }], runs, now);
    expect(s[0]?.fraction).toBeCloseTo(0.8);
    expect(s[1]?.fraction).toBeCloseTo(0.15);
    expect(s[2]?.usedUsd).toBeCloseTo(45);
  });

  it('validates budget and ledger input', () => {
    expect(parseBudgets({ monthly: [{ scope: 'runner', key: 'claude', limitUsd: 20 }, { scope: 'total', limitTokens: 5 }] })).toHaveLength(2);
    expect(() => parseBudgets({ monthly: [{ scope: 'module', limitUsd: 1 }] })).toThrow(/needs a name/);
    expect(() => parseBudgets({ monthly: [{ scope: 'total' }] })).toThrow(/limit/);
    expect(parseLedgerEntry({ provider: 'Fish Audio', units: 12, unit: 'credits', receipt: 'wiki/x.json' }).provider).toBe('fish-audio');
    expect(() => parseLedgerEntry({ provider: 'x', units: -1, unit: 'credits' })).toThrow();
    expect(() => parseLedgerEntry({ provider: 'x', units: 1, unit: 'gold' })).toThrow();
  });

  it('builds the overview with Claude plan limits as not reported', () => {
    const now = new Date(2026, 9, 9, 12);
    const o = buildOverview([run('a', 'claude', 'images', now, 100, 40)], null, {}, [], now);
    expect(o.days).toHaveLength(30);
    expect(o.days[29]?.total).toBe(100);
    expect(o.planLimits.claude).toBeNull();
    expect(o.periods.month.estCostUsd).toBe(40);
    expect(summarizeRuns([run('a', 'claude', 'images', now, 100, 40)], now).topRuns[0]?.id).toBe('a');
  });
});

describe('media.serve', () => {
  const setup = () => {
    const root = tmp();
    mkdirSync(path.join(root, 'in'));
    writeFileSync(path.join(root, 'in', 'a.mp3'), Buffer.from('0123456789'));
    writeFileSync(path.join(root, 'secret.txt'), 'no');
    return root;
  };
  const read = async (r: { stream?: NodeJS.ReadableStream | null }) => {
    const chunks: Buffer[] = [];
    for await (const c of r.stream as Readable) chunks.push(c as Buffer);
    return Buffer.concat(chunks).toString();
  };

  it('serves whole files, byte ranges and 416; type by extension; revalidates with ETag', async () => {
    const root = setup();
    const opts = { allowRoots: [path.join(root, 'in')] };
    const file = path.join(root, 'in', 'a.mp3');
    const full = await media.serve(file, {}, opts);
    expect(full.status).toBe(200);
    expect(full.headers).toMatchObject({ 'content-type': 'audio/mpeg', 'accept-ranges': 'bytes', 'content-length': '10' });
    expect(await read(full)).toBe('0123456789');
    const part = await media.serve(file, { range: 'bytes=2-4' }, opts);
    expect(part.status).toBe(206);
    expect(part.headers?.['content-range']).toBe('bytes 2-4/10');
    expect(await read(part)).toBe('234');
    expect((await media.serve(file, { range: 'bytes=-3' }, opts)).headers?.['content-range']).toBe('bytes 7-9/10');
    const bad = await media.serve(file, { range: 'bytes=50-60' }, opts);
    expect(bad.status).toBe(416);
    expect(bad.headers?.['content-range']).toBe('bytes */10');
    expect((await media.serve(file, { 'if-none-match': full.headers?.etag }, opts)).status).toBe(304);
  });

  it('refuses paths outside the allowed roots and missing files', async () => {
    const root = setup();
    const opts = { allowRoots: [path.join(root, 'in')] };
    expect((await media.serve(path.join(root, 'secret.txt'), {}, opts)).status).toBe(403);
    expect((await media.serve(path.join(root, 'in', '..', 'secret.txt'), {}, opts)).status).toBe(403);
    expect((await media.serve(path.join(root, 'in', 'nope.mp3'), {}, opts)).status).toBe(404);
    expect(parseRange('bytes=0-0', 10)).toEqual({ start: 0, end: 0 });
  });
});

describe('router additions', () => {
  it('rootPost accepts only the explicit allowlist and sends CORS for the named origin only', async () => {
    const api = new ApiRouter();
    const mod = api.mount('/api/soundtrack');
    expect(() => mod.rootPost('/api/evil', () => ({}))).toThrow(/allowlist/);
    mod.rootPost('/api/collected', () => ({ ok: true }), { cors: 'https://pixabay.com' });
    mod.rootPost('/api/track', () => ({ ok: true }));
    expect(ROOT_POST_ALLOWLIST).toEqual(['/api/track', '/api/collected']);
    expect(api.match('POST', '/api/collected')?.cors).toBe('https://pixabay.com');
    expect(api.match('OPTIONS', '/api/collected')).not.toBeNull();
    expect(api.match('POST', '/api/track')?.cors).toBeUndefined();
    expect(api.match('OPTIONS', '/api/track')).toBeNull();
    expect(() => mod.rootPost('/api/track', () => ({}))).toThrow(/already/);
  });
});

describe('http: handler input and raw responses', () => {
  it('passes headers and method to handlers, and writes raw results as-is', async () => {
    const { startApp } = await import('../server/app');
    const { serverModules } = await import('../modules/server-registry');
    const { fileURLToPath } = await import('node:url');
    const appRoot = fileURLToPath(new URL('..', import.meta.url));
    const repoRoot = path.resolve(appRoot, '..', '..');
    serverModules.push({
      meta: { id: 'rawtest', title: 'x', nav: { label: 'x', order: 99 }, manifest: [] },
      register(router, services) {
        router.get('/echo', ({ headers, method }) => ({ range: headers.range, method }));
        router.get('/file', async ({ headers }) => services.media.serve(path.join(appRoot, 'package.json'), headers, { allowRoots: [appRoot] }));
        router.get('/outside', async ({ headers }) => services.media.serve(path.join(repoRoot, 'CLAUDE.md'), headers, { allowRoots: [appRoot] }));
        router.get('/shape', () => ({ __raw: true, status: 202, headers: { 'x-a': '1' }, stream: Readable.from(['hi']) }));
      },
    });
    const app = await startApp({ repoRoot, appRoot, port: 0 });
    const get = (p: string, headers: Record<string, string> = {}) =>
      new Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }>((resolve, reject) => {
        http.get({ host: '127.0.0.1', port: app.port, path: p, headers }, (res) => {
          let body = '';
          res.on('data', (c) => (body += c));
          res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body }));
        }).on('error', reject);
      });
    try {
      expect(JSON.parse((await get('/api/rawtest/echo', { range: 'bytes=0-1' })).body)).toEqual({ range: 'bytes=0-1', method: 'GET' });
      const r = await get('/api/rawtest/file', { range: 'bytes=0-3' });
      expect(r.status).toBe(206);
      expect(r.body).toHaveLength(4);
      expect((await get('/api/rawtest/outside')).status).toBe(403);
      const s = await get('/api/rawtest/shape');
      expect(s.status).toBe(202);
      expect(s.headers['x-a']).toBe('1');
      expect(s.body).toBe('hi');
    } finally {
      await app.close();
      serverModules.pop();
    }
  });
});

describe('nested decision libraries', () => {
  it('writes to wiki/operations/spend/decisions.jsonl and refuses escapes', async () => {
    const root = tmp();
    mkdirSync(path.join(root, 'wiki'), { recursive: true });
    const log = new FileDecisionLog(new FileWikiStore(root, new FileLeases(root)));
    await log.append('operations/spend', { actor: 'matt', module: 'spend', subject: 'budgets', action: 'edit' });
    expect(readFileSync(path.join(root, 'wiki', 'operations', 'spend', 'decisions.jsonl'), 'utf8')).toContain('"budgets"');
    expect((await log.list('operations/spend')).length).toBe(1);
    for (const bad of ['../x', 'a/../b', '/abs', 'a//b', 'C:/x', 'a/..']) await expect(log.append(bad, { actor: 'a', module: 'm', subject: 's', action: 'x' })).rejects.toThrow(/invalid library/);
  });
});
