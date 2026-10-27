import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveComicAudioPath } from '../modules/soundtrack/server/audio';
import { comicPrefix, trackStatus } from '../modules/soundtrack/server/resolver';
import type { ComicAudioRecord, Track, TrackResult } from '../modules/soundtrack/types';
import { liveRepo, makeFixture, runNode, startStudio } from './soundtrack-fixture';
import type { Fixture, Studio } from './soundtrack-fixture';

// The real app, serving only the soundtrack module over the fixture repo.
vi.mock('../modules/server-registry', async () => ({ serverModules: [(await import('../modules/soundtrack/server')).server] }));

interface Raw {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: Buffer;
}

function raw(url: string, opts: { method?: string; headers?: Record<string, string>; body?: string | Buffer } = {}): Promise<Raw> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({ host: u.hostname, port: u.port, path: u.pathname + u.search, method: opts.method ?? 'GET', headers: opts.headers }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    if (opts.body !== undefined) req.write(opts.body);
    req.end();
  });
}

/** Same as raw() but keeps the request path exactly as written (no URL normalisation), for traversal probes. */
function rawPath(port: string, p: string, headers: Record<string, string> = {}): Promise<Raw> {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: p, method: 'GET', headers }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.end();
  });
}

const post = (base: string, p: string, body: unknown, headers: Record<string, string> = {}) =>
  raw(`${base}${p}`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });
const json = <T>(r: Raw): T => JSON.parse(r.body.toString('utf8')) as T;

const readJson = <T>(file: string): T => JSON.parse(readFileSync(file, 'utf8')) as T;
const sha = (file: string): string => createHash('sha1').update(readFileSync(file)).digest('hex');
function pickTracks(lib: string) {
  const { tracks } = readJson<{ tracks: Track[] }>(path.join(lib, 'sources.json'));
  const candidates = tracks.filter((t) => t.status === 'candidate' && t.title && t.artist && t.license && (t.source || t.note));
  const used = tracks.find((t) => t.status === 'approved' && (t.usedBy || []).length > 0);
  const approved = tracks.find((t) => t.status === 'approved');
  if (candidates.length < 3 || !used || !approved) throw new Error('library fixture lacks the tracks the tests need');
  return { candidates: candidates as [Track, Track, ...Track[]], used, approved, all: tracks };
}

const DECISIONS = (fx: Fixture) => path.join(fx.lib, 'decisions.jsonl');
const decisionLines = (fx: Fixture): Record<string, unknown>[] =>
  existsSync(DECISIONS(fx))
    ? readFileSync(DECISIONS(fx), 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((l) => JSON.parse(l) as Record<string, unknown>)
    : [];

describe('track actions: rejections, re-read, queue, decisions', () => {
  let fx: Fixture;
  let h: Studio;
  beforeEach(async () => {
    fx = makeFixture();
    h = await startStudio(fx.root);
  }, 60000);
  afterEach(async () => {
    await h.close();
    fx.cleanup();
  });
  const click = (body: unknown) => post(h.url, '/api/soundtrack/track', body);
  const state = () => ({ sources: sha(path.join(fx.lib, 'sources.json')), discovery: sha(path.join(fx.lib, 'discovery.json')), manifest: sha(path.join(fx.lib, 'manifest.json')) });

  it('rejects bad clicks without touching any file or the decision log', async () => {
    const { candidates, used, approved } = pickTracks(fx.lib);
    const c = candidates[0];
    const before = state();
    const cases: [unknown, number, RegExp][] = [
      [{ action: 'approve', id: approved.id }, 409, /not a candidate/],
      [{ action: 'unapprove', id: used.id }, 409, /not approved from the console or is in use/],
      [{ action: 'unapprove', id: c.id }, 409, /not approved from the console/],
      [{ action: 'rate', id: c.id, rating: 6 }, 400, /rating is 1-5/],
      [{ action: 'rate', id: c.id, rating: 2.5 }, 400, /rating is 1-5/],
      [{ action: 'rate', id: c.id, rating: '3' }, 400, /rating is 1-5/],
      [{ action: 'rate', id: c.id }, 400, /rating is 1-5/],
      [{ action: 'nope', id: c.id }, 400, /action is approve/],
      [{ action: 'approve', id: 'no-such-track' }, 404, /no track no-such-track/],
      [[1, 2], 400, /bad JSON/],
    ];
    for (const [body, status, message] of cases) {
      const r = await click(body);
      expect(r.status, JSON.stringify(body)).toBe(status);
      expect(json<{ error: string }>(r).error).toMatch(message);
    }
    // The legacy route rejects the same way.
    expect((await post(h.url, '/api/track', 'not json')).status).toBe(400);
    expect(state()).toEqual(before);
    expect(decisionLines(fx)).toEqual([]);
  });

  it('refuses to approve a candidate without a credit or licence (read fresh from disk)', async () => {
    const { candidates } = pickTracks(fx.lib);
    const c = candidates[0];
    const file = path.join(fx.lib, 'sources.json');
    const sources = readJson<{ tracks: Track[] }>(file);
    delete (sources.tracks.find((t) => t.id === c.id) as Track).license;
    writeFileSync(file, `${JSON.stringify(sources, null, 2)}\n`);
    const r = await click({ action: 'approve', id: c.id });
    expect(r.status).toBe(409);
    expect(json<{ error: string }>(r).error).toBe(`${c.id} lacks its credit or licence`);
    expect(decisionLines(fx)).toEqual([]);
  });

  it('keeps a duplicate Find similar from adding a second open request', async () => {
    const { candidates } = pickTracks(fx.lib);
    const c = candidates[1];
    const first = json<TrackResult>(await click({ action: 'similar', id: c.id }));
    const afterFirst = readJson<{ requests: { basis: string; status: string }[] }>(path.join(fx.lib, 'discovery.json'));
    const open = afterFirst.requests.filter((r) => r.basis === c.id && r.status === 'open');
    expect(open).toHaveLength(1);
    expect(first.requestId).toBe(`req-${new Date().toISOString().slice(0, 10)}-${c.id}`);
    const second = json<TrackResult>(await click({ action: 'similar', id: c.id }));
    const afterSecond = readJson<{ requests: unknown[] }>(path.join(fx.lib, 'discovery.json'));
    expect(afterSecond.requests).toHaveLength(afterFirst.requests.length);
    expect(second.requestId).toBe(first.requestId);
    // One decision (the request), not two.
    expect(decisionLines(fx).filter((d) => d.action === 'request-similar')).toHaveLength(1);
  });

  it('re-reads sources.json on every click, so a track added by an intake in the meantime survives', async () => {
    const { candidates, all } = pickTracks(fx.lib);
    const file = path.join(fx.lib, 'sources.json');
    const sources = readJson<{ tracks: Track[] }>(file);
    const added: Track = { ...(candidates[2] as Track), id: 'external-intake-track', file: 'external-intake-track.mp3', title: 'Added Outside' };
    delete added.rating;
    sources.tracks.push(added);
    writeFileSync(file, `${JSON.stringify(sources, null, 2)}\n`);
    const r = json<TrackResult>(await click({ action: 'rate', id: (candidates[0] as Track).id, rating: 3 }));
    expect(r.counts.tracks).toBe(all.length + 1);
    const after = readJson<{ tracks: Track[] }>(file);
    expect(after.tracks.map((t) => t.id)).toContain('external-intake-track');
    expect(readJson<{ tracks: Track[] }>(path.join(fx.lib, 'manifest.json')).tracks.map((t) => t.id)).toContain('external-intake-track');
  });

  it('serialises concurrent clicks so none is lost', async () => {
    const { candidates } = pickTracks(fx.lib);
    const ids = candidates.slice(0, 3).map((t) => t.id);
    const more = readJson<{ tracks: Track[] }>(path.join(fx.lib, 'sources.json')).tracks.filter((t) => !ids.includes(t.id)).slice(0, 7);
    const all = [...ids, ...more.map((t) => t.id)];
    const results = await Promise.all(all.map((id, i) => click({ action: 'rate', id, rating: (i % 5) + 1 })));
    expect(results.map((r) => r.status)).toEqual(all.map(() => 200));
    const after = readJson<{ tracks: Track[] }>(path.join(fx.lib, 'sources.json')).tracks;
    all.forEach((id, i) => expect(after.find((t) => t.id === id)?.rating, id).toBe((i % 5) + 1));
    expect(decisionLines(fx)).toHaveLength(all.length);
  });

  it('appends one valid decision per successful click and none on failure', async () => {
    const { candidates, approved } = pickTracks(fx.lib);
    const c = candidates[0];
    await click({ action: 'rate', id: c.id, rating: 5 });
    await click({ action: 'approve', id: c.id });
    await click({ action: 'approve', id: c.id }); // fails: already approved
    await click({ action: 'rate', id: approved.id, rating: 9 }); // fails
    await click({ action: 'unapprove', id: c.id });
    await click({ action: 'rate', id: c.id, rating: 0 });
    const similar = json<TrackResult>(await click({ action: 'similar', id: c.id }));
    const lines = decisionLines(fx);
    expect(lines.map((d) => [d.action, d.value ?? null])).toEqual([
      ['rate', 5],
      ['approve', null],
      ['unapprove', null],
      ['rate', 0],
      ['request-similar', similar.requestId],
    ]);
    for (const d of lines) {
      expect(d).toMatchObject({ module: 'soundtrack', subject: `snd:${c.id}`, actor: 'matt' });
      expect(typeof d.id).toBe('string');
      expect(Number.isNaN(Date.parse(String(d.at)))).toBe(false);
    }
    expect(await h.core.decisions.list('soundtrack-library', { subject: `snd:${c.id}` })).toHaveLength(5);
  });

  it('keeps the click when the decision log cannot be written', async () => {
    const { candidates } = pickTracks(fx.lib);
    const c = candidates[0];
    mkdirSync(DECISIONS(fx)); // a directory where the log file should be
    const r = json<TrackResult>(await click({ action: 'rate', id: c.id, rating: 2 }));
    expect(r.logged).toBe(false);
    expect(readJson<{ tracks: Track[] }>(path.join(fx.lib, 'sources.json')).tracks.find((t) => t.id === c.id)?.rating).toBe(2);
    rmSync(DECISIONS(fx), { recursive: true });
  });
});

describe('POST /api/collected', () => {
  let fx: Fixture;
  let h: Studio;
  beforeAll(async () => {
    fx = makeFixture();
    h = await startStudio(fx.root);
  }, 60000);
  afterAll(async () => {
    await h.close();
    fx.cleanup();
  });
  const records = () => readdirSync(path.join(fx.lib, 'records'));
  const body = (name: string) => JSON.stringify({ name, from: 'test', records: [{ id: 1 }, { id: 2 }] });

  it('allows only the Pixabay origin, with CORS headers for it alone', async () => {
    const pre = await raw(`${h.url}/api/collected`, { method: 'OPTIONS', headers: { origin: 'https://pixabay.com' } });
    expect(pre.status).toBe(204);
    expect(pre.headers['access-control-allow-origin']).toBe('https://pixabay.com');
    // The core answers a preflight with the one allowed origin whoever asks, so a page on any other origin is blocked by its browser.
    const other = await raw(`${h.url}/api/collected`, { method: 'OPTIONS', headers: { origin: 'https://evil.example' } });
    expect(other.headers['access-control-allow-origin']).toBe('https://pixabay.com');

    const before = records().length;
    const refused = await post(h.url, '/api/collected', body('x'), { origin: 'https://evil.example' });
    expect(refused.status).toBe(403);
    expect(refused.headers['access-control-allow-origin']).not.toBe('https://evil.example');
    expect(records()).toHaveLength(before);

    const ok = await post(h.url, '/api/collected', body('pix-run'), { origin: 'https://pixabay.com' });
    expect(ok.status).toBe(200);
    expect(ok.headers['access-control-allow-origin']).toBe('https://pixabay.com');
    expect(json<{ file: string; count: number }>(ok)).toEqual({ file: 'wiki/soundtrack-library/records/pix-run.json', count: 2 });
    expect(readJson<{ name: string; from: string; records: unknown[] }>(path.join(fx.lib, 'records', 'pix-run.json'))).toMatchObject({ name: 'pix-run', from: 'test', records: [{ id: 1 }, { id: 2 }] });
    // Loopback pages and header-less tools may post too.
    expect((await post(h.url, '/api/collected', body('local'), { origin: h.url })).status).toBe(200);
    expect((await post(h.url, '/api/collected', body('tool'))).status).toBe(200);
    expect((await raw(`${h.url}/api/collected`)).status).toBe(404);
  });

  it('never overwrites: a repeated name gets -2, -3', async () => {
    for (let i = 0; i < 3; i++) await post(h.url, '/api/collected', body('repeat'));
    expect(records().filter((f) => f.startsWith('repeat'))).toEqual(['repeat-2.json', 'repeat-3.json', 'repeat.json']);
  });

  it('sanitises the name and rejects bad bodies', async () => {
    const r = json<{ file: string }>(await post(h.url, '/api/collected', body('../../Evil Name!!')));
    expect(r.file).toBe('wiki/soundtrack-library/records/EvilName.json');
    const long = json<{ file: string }>(await post(h.url, '/api/collected', body('a'.repeat(100))));
    expect(path.basename(long.file)).toBe(`${'a'.repeat(80)}.json`);
    expect((await post(h.url, '/api/collected', body('!!!'))).status).toBe(400);
    expect((await post(h.url, '/api/collected', JSON.stringify({ name: 'ok' }))).status).toBe(400);
    expect((await post(h.url, '/api/collected', 'nope')).status).toBe(400);
    expect((await post(h.url, '/api/collected', 'null')).status).toBe(400);
    expect(existsSync(path.join(fx.root, 'wiki', 'Evil Name.json'))).toBe(false);
  });

  it('refuses a body over the cap and writes nothing', async () => {
    // Over 5 MB the module's own cap applies; the core stops at 1 MB first (see the report: rootPost needs a per-route cap).
    const before = records().length;
    const big = JSON.stringify({ name: 'big', records: ['x'.repeat(5_100_000)] });
    // The core may answer 413 or cut the connection while the client is still sending; either way nothing is written.
    const r = await post(h.url, '/api/collected', big).then(
      (x) => x.status,
      () => 'reset',
    );
    expect([413, 'reset']).toContain(r);
    expect(records()).toHaveLength(before);
    // The refused connection may have been dropped; the next request opens a fresh one.
    const mid = JSON.stringify({ name: 'mid', records: ['x'.repeat(600_000)] });
    const small = await post(h.url, '/api/collected', mid).catch(() => post(h.url, '/api/collected', mid));
    expect(small.status).toBe(200);
  });

  it('caps /api/track at 10 KB and refuses a foreign Origin', async () => {
    const big = JSON.stringify({ action: 'rate', id: 'x', pad: 'x'.repeat(11_000) });
    expect((await post(h.url, '/api/track', big)).status).toBe(413);
    const { candidates } = pickTracks(fx.lib);
    const r = await post(h.url, '/api/track', { action: 'rate', id: (candidates[0] as Track).id, rating: 3 }, { origin: 'https://evil.example' });
    expect(r.status).toBe(403);
  });
});

describe('audio serving', () => {
  let fx: Fixture;
  let h: Studio;
  let file: string;
  beforeAll(async () => {
    fx = makeFixture();
    h = await startStudio(fx.root);
    file = readdirSync(path.join(fx.lib, 'assets')).find((f) => f.endsWith('.mp3')) as string;
  }, 60000);
  afterAll(async () => {
    await h.close();
    fx.cleanup();
  });
  const port = () => new URL(h.url).port;
  const audio = (f: string) => `/api/soundtrack/audio/${encodeURIComponent(f)}`;
  const comicAudio = (p: string) => `/api/soundtrack/comic-audio/${encodeURIComponent(p)}`;

  it('serves whole files and byte ranges', async () => {
    const size = statSync(path.join(fx.lib, 'assets', file)).size;
    const full = await raw(`${h.url}${audio(file)}`);
    expect(full.status).toBe(200);
    expect(full.headers['content-type']).toBe('audio/mpeg');
    expect(full.headers['accept-ranges']).toBe('bytes');
    expect(full.body.length).toBe(size);
    const disk = readFileSync(path.join(fx.lib, 'assets', file));
    expect(full.body.equals(disk)).toBe(true);

    const part = await raw(`${h.url}${audio(file)}`, { headers: { range: 'bytes=100-199' } });
    expect(part.status).toBe(206);
    expect(part.headers['content-range']).toBe(`bytes 100-199/${size}`);
    expect(part.body.equals(disk.subarray(100, 200))).toBe(true);
    const tail = await raw(`${h.url}${audio(file)}`, { headers: { range: 'bytes=-50' } });
    expect(tail.status).toBe(206);
    expect(tail.body.equals(disk.subarray(size - 50))).toBe(true);
    const open = await raw(`${h.url}${audio(file)}`, { headers: { range: `bytes=${size - 10}-` } });
    expect(open.body.equals(disk.subarray(size - 10))).toBe(true);
    const beyond = await raw(`${h.url}${audio(file)}`, { headers: { range: `bytes=${size + 5}-` } });
    expect(beyond.status).toBe(416);
    // A range the core cannot parse is ignored (whole file), as the HTTP spec allows.
    expect((await raw(`${h.url}${audio(file)}`, { headers: { range: 'bytes=abc' } })).status).toBe(200);
  });

  it('rejects traversal, NUL, non-audio and unknown files', async () => {
    const probes = [
      '/api/soundtrack/audio/..%2Fsources.json',
      '/api/soundtrack/audio/..%2F..%2F..%2FAGENTS.md',
      '/api/soundtrack/audio/%2e%2e/%2e%2e/AGENTS.md',
      '/api/soundtrack/audio/..%5Csources.json',
      `/api/soundtrack/audio/${encodeURIComponent(file)}%00.json`,
      `/api/soundtrack/audio/${encodeURIComponent(file)}%00`,
      '/api/soundtrack/audio/sources.json',
      '/api/soundtrack/audio/sources.json.bak',
      '/api/soundtrack/audio/C%3A%5CWindows%5Cwin.mp3',
      '/api/soundtrack/audio/missing-file.mp3',
      '/api/soundtrack/audio/',
    ];
    for (const p of probes) {
      const r = await rawPath(port(), p);
      expect(r.status, p).toBe(404);
    }
    // A malformed escape is refused too (the core router answers 500 today; either way nothing is served).
    expect((await rawPath(port(), '/api/soundtrack/audio/%E0%A4%A.mp3')).status).toBeGreaterThanOrEqual(400);
    expect([404, 405]).toContain((await post(h.url, '/api/soundtrack/audio/x.mp3', {})).status);
  });

  it('serves nested library audio and receipts, and only the legacy comic allowlist otherwise', async () => {
    const ok = [
      ['wiki/comics-library/assets/voices/matt/v1.mp3', 'audio/mpeg'],
      ['wiki/comics-library/assets/sounds/rooms/street.wav', 'audio/wav'],
      ['wiki/comics-library/records/receipt.json', 'application/json; charset=utf-8'],
      ['site/public/scripts/comic-story.js', 'text/javascript; charset=utf-8'],
      ['wiki/soundtrack-library/assets/speech/batch/line.mp3', 'audio/mpeg'],
      ['wiki/soundtrack-library/records/batch/receipt.json', 'application/json; charset=utf-8'],
    ] as const;
    for (const [p, type] of ok) {
      const r = await raw(`${h.url}${comicAudio(p)}`);
      expect(r.status, p).toBe(200);
      expect(r.headers['content-type'], p).toBe(type);
    }
    const no = [
      'wiki/comics-library/assets/other/secret.mp3',
      'wiki/comics-library/records/notes.txt',
      'site/public/scripts/other.js',
      'wiki/soundtrack-library/sources.json',
      'wiki/soundtrack-library/sources.json.bak',
      'wiki/comics-library/assets/voices/../other/secret.mp3',
      'wiki/comics-library/assets/voices/%2e%2e/other/secret.mp3',
      'wiki/soundtrack-library/assets/%2e%2e/sources.json',
      'wiki/soundtrack-library/records/%2e%2e/sources.json',
      'AGENTS.md',
    ];
    for (const p of no) {
      const r = await rawPath(port(), comicAudio(p));
      expect(r.status, p).toBe(404);
    }
  });

  it('matches resolveComicAudioPath from the producer scripts for every probe', async () => {
    // require() of the .mjs (no top-level await in it) keeps vite-node from transforming it.
    const oracle = createRequire(import.meta.url)(path.join(liveRepo, '.claude', 'skills', 'mtw-soundtrack', 'scripts', 'comic-audio-paths.mjs')) as {
      resolveComicAudioPath(root: string, pathname: string): string | null;
    };
    const probes = [
      '/wiki/comics-library/assets/voices/matt/v1.mp3',
      '/wiki/comics-library/assets/voices/matt/v1.MP3',
      '/wiki/comics-library/assets/voices/matt/v1.flac',
      '/wiki/comics-library/assets/sounds/rooms/street.wav',
      '/wiki/comics-library/assets/sounds/x.ogg',
      '/wiki/comics-library/assets/other/secret.mp3',
      '/wiki/comics-library/assets/voices/../other/secret.mp3',
      '/wiki/comics-library/assets/voices/%2e%2e/other/secret.mp3',
      '/wiki/comics-library/assets/voices/%2E%2E%2Fother%2Fsecret.mp3',
      '/wiki/comics-library/records/receipt.json',
      '/wiki/comics-library/records/receipt.JSON',
      '/wiki/comics-library/records/a.txt',
      '/wiki/comics-library/records/../assets/voices/matt/v1.mp3',
      '/site/public/scripts/comic-story.js',
      '/site/public/scripts/other.js',
      '/wiki/comics-library/assets/voices/matt/v1.mp3%00.json',
      '/wiki/comics-library/assets/voices/%E0%A4%A.mp3',
      '/wiki/soundtrack-library/assets/x.mp3',
      '/AGENTS.md',
      '/',
      '',
      '/wiki/comics-library/assets/voices',
      '/wiki/comics-library/assets/voices/.mp3',
      '\\wiki\\comics-library\\assets\\voices\\matt\\v1.mp3',
      '/wiki/comics-library/assets/voices/matt/v1.mp3/',
      '/../../etc/passwd',
    ];
    for (const p of probes) expect(resolveComicAudioPath(fx.root, p), p).toBe(oracle.resolveComicAudioPath(fx.root, p));
  });
});

describe('asset resolvers', () => {
  let fx: Fixture;
  let h: Studio;
  beforeAll(async () => {
    fx = makeFixture();
    const { approved } = pickTracks(fx.lib);
    mkdirSync(path.join(fx.root, 'site', 'public', 'audio'), { recursive: true });
    writeFileSync(path.join(fx.root, 'site', 'public', 'audio', approved.file), 'x');
    h = await startStudio(fx.root);
  }, 60000);
  afterAll(async () => {
    await h.close();
    fx.cleanup();
  });
  const resolver = (prefix: string) => h.core.assets.resolver(prefix) as NonNullable<ReturnType<typeof h.core.assets.resolver>>;

  it('lists snd tracks with approved first, filters and pages', async () => {
    const r = resolver('snd');
    expect(r).toMatchObject({ prefix: 'snd', label: 'Sound', module: 'soundtrack' });
    const all = await r.list({ limit: 1000 });
    const manifest = readJson<{ tracks: Track[] }>(path.join(fx.lib, 'manifest.json')).tracks;
    expect(all.total).toBe(manifest.length);
    const statuses = all.items.map((i) => i.status);
    const firstNonApproved = statuses.findIndex((s) => s !== 'approved');
    expect(statuses.slice(firstNonApproved).every((s) => s !== 'approved')).toBe(true);
    expect(statuses.filter((s) => s === 'approved')).toHaveLength(manifest.filter((t) => t.status === 'approved').length);
    const cand = await r.list({ filters: { status: 'candidate' }, limit: 5 });
    expect(cand.items).toHaveLength(5);
    expect(cand.items.every((i) => i.status === 'candidate')).toBe(true);
    expect(cand.total).toBe(manifest.filter((t) => t.status === 'candidate').length);
    const page = await r.list({ limit: 3, offset: 3 });
    expect(page.items.map((i) => i.ref)).toEqual(all.items.slice(3, 6).map((i) => i.ref));
    const found = await r.list({ q: (manifest[0] as Track).artist.toLowerCase() });
    expect(found.total).toBeGreaterThan(0);
    const run = manifest.find((t) => t.discovery)?.discovery?.run as string;
    const byRun = await r.list({ filters: { run }, limit: 1000 });
    expect(byRun.total).toBe(manifest.filter((t) => t.discovery?.run === run).length);
  });

  it('resolves a track with title, preview, canonical path, integration source and meta', async () => {
    const { approved, candidates } = pickTracks(fx.lib);
    const a = await resolver('snd').resolve(`snd:${approved.id}`);
    expect(a).toMatchObject({
      ref: `snd:${approved.id}`,
      title: `${approved.title} - ${approved.artist}`,
      status: 'approved',
      preview: `/api/soundtrack/audio/${encodeURIComponent(approved.file)}`,
      canonicalPath: `wiki/soundtrack-library/assets/${approved.file}`,
      integrationSrc: `/audio/${approved.file}`,
    });
    expect(a?.meta).toMatchObject({ artist: approved.artist, license: approved.license, source: approved.source ?? null });
    expect(a?.meta).toHaveProperty('bpm');
    expect(a?.meta).toHaveProperty('offset');
    expect(a?.meta).toHaveProperty('usedBy');
    expect(a?.meta).toHaveProperty('credit');
    const c = await resolver('snd').resolve(`snd:${candidates[0].id}`);
    expect(c?.status).toBe('candidate');
    expect(c?.integrationSrc).toBeUndefined();
    expect(await resolver('snd').resolve('snd:nope')).toBeNull();
    expect(await resolver('snd').resolve('sfx:nope')).toBeNull();
    // Over the app's own asset routes.
    const viaApi = json<{ ref: string }>(await raw(`${h.url}/api/assets/resolve?ref=${encodeURIComponent(`snd:${approved.id}`)}`));
    expect(viaApi.ref).toBe(`snd:${approved.id}`);
    expect(json<{ items: unknown[] }>(await raw(`${h.url}/api/assets/snd?limit=2`)).items).toHaveLength(2);
  });

  it('maps library statuses to asset statuses', () => {
    expect(trackStatus('approved')).toBe('approved');
    expect(trackStatus('candidate')).toBe('candidate');
    expect(trackStatus('needs source')).toBe('blocked');
    expect(trackStatus('withdrawn')).toBe('withdrawn');
  });

  it('partitions every comic-audio record into exactly one of sfx, amb and speech', async () => {
    const records = readJson<{ records: ComicAudioRecord[] }>(path.join(fx.lib, 'comic-audio.json')).records;
    const seen = new Map<string, string>();
    for (const prefix of ['sfx', 'amb', 'speech']) {
      const list = await resolver(prefix).list({ limit: 10000 });
      for (const item of list.items) {
        expect(seen.has(item.ref.slice(prefix.length + 1)), item.ref).toBe(false);
        seen.set(item.ref.slice(prefix.length + 1), prefix);
        expect(item.ref.startsWith(`${prefix}:`)).toBe(true);
      }
    }
    expect([...seen.keys()].sort()).toEqual(records.map((r) => r.id).sort());
    for (const r of records) expect(seen.get(r.id), r.id).toBe(comicPrefix(r.type));
    expect(new Set(records.map((r) => comicPrefix(r.type)))).toEqual(new Set(['sfx', 'amb', 'speech']));
  });

  it('resolves comic records with previews for recordings and runtime meta for recipes', async () => {
    const records = readJson<{ records: ComicAudioRecord[] }>(path.join(fx.lib, 'comic-audio.json')).records;
    const recipe = records.find((r) => r.type === 'effect-recipe') as ComicAudioRecord;
    const sfx = await resolver('sfx').resolve(`sfx:${recipe.id}`);
    expect(sfx?.preview).toBeUndefined();
    expect(sfx?.meta).toHaveProperty('runtime');
    expect(sfx?.status).toBe(recipe.productionApproved ? 'approved' : 'candidate');
    const audition = records.find((r) => r.type === 'speech-audition' && r.media) as ComicAudioRecord;
    const sp = await resolver('speech').resolve(`speech:${audition.id}`);
    expect(sp?.preview).toBe(`/api/soundtrack/comic-audio/${encodeURIComponent(audition.media?.path as string)}`);
    expect(sp?.canonicalPath).toBe(audition.media?.path);
    expect(await resolver('amb').resolve(`amb:${audition.id}`)).toBeNull();
    expect(await resolver('speech').resolve(`speech:${recipe.id}`)).toBeNull();
    const filtered = await resolver('speech').list({ filters: { character: audition.characterId as string }, limit: 1000 });
    expect(filtered.total).toBeGreaterThan(0);
  });
});

describe('library routes', () => {
  let fx: Fixture;
  let h: Studio;
  beforeAll(async () => {
    fx = makeFixture();
    h = await startStudio(fx.root);
  }, 60000);
  afterAll(async () => {
    await h.close();
    fx.cleanup();
  });

  it('serves the manifest, a profile and the comic records', async () => {
    const lib = json<{ counts: { tracks: number }; tracks: Track[]; bands: string[]; discovery: { requests: unknown[] } }>(await raw(`${h.url}/api/soundtrack/library`));
    expect(lib.tracks).toHaveLength(lib.counts.tracks);
    expect(lib.bands).toHaveLength(8);
    const id = (lib.tracks.find((t) => t.profile) as Track).id;
    const profile = json<{ id: string; frequency: { frames: number; bands: string[] } }>(await raw(`${h.url}/api/soundtrack/profile/${id}`));
    expect(profile.id).toBe(id);
    expect(profile.frequency.bands).toHaveLength(8);
    expect((await raw(`${h.url}/api/soundtrack/profile/nope`)).status).toBe(404);
    expect((await raw(`${h.url}/api/soundtrack/profile/..%2Fsources`)).status).toBe(404);
    const comic = json<{ records: unknown[]; counts: { records: number } }>(await raw(`${h.url}/api/soundtrack/comic`));
    expect(comic.records).toHaveLength(comic.counts.records);
  });
});
