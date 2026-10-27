// Images module through the real app server (server/app.ts): routes, raw responses, headers, validation.
// The module registry is replaced for this file only; the real library is read-only and thumbnails go to a temp .state.
import { rmSync } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const { stateDir } = vi.hoisted(() => ({ stateDir: `${process.env.TEMP ?? process.env.TMPDIR ?? '/tmp'}/mtw-images-state-${process.pid}-${Date.now()}` }));
vi.mock('../modules/server-registry', async () => {
  const { createImagesServer } = await import('../modules/images/server');
  return { serverModules: [createImagesServer({ stateDir })] };
});

import { startApp } from '../server/app';
import type { RunningApp } from '../server/app';
import { appRoot, makeFixture, realRepoRoot } from './images-fixture';
import type { Fixture } from './images-fixture';

let fx: Fixture;
let fixtureApp: RunningApp;
let realApp: RunningApp;
beforeAll(async () => {
  fx = await makeFixture();
  fixtureApp = await startApp({ repoRoot: fx.root, appRoot, port: 0 });
  realApp = await startApp({ repoRoot: realRepoRoot, appRoot, port: 0 });
}, 120000);
afterAll(async () => {
  await fixtureApp?.close();
  await realApp?.close();
  fx?.cleanup();
  rmSync(stateDir, { recursive: true, force: true, maxRetries: 3 });
});

const get = (app: RunningApp, url: string): Promise<Response> => fetch(`http://127.0.0.1:${app.port}${url}`);
const json = async <T>(app: RunningApp, url: string): Promise<T> => (await get(app, url)).json() as Promise<T>;
const post = (app: RunningApp, url: string, body: unknown): Promise<Response> =>
  fetch(`http://127.0.0.1:${app.port}${url}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

interface Cards {
  total: number;
  items: { id: string; treatment: { sha: string; path: string } | null; style: string; state: string }[];
}

describe('fixture library over HTTP', () => {
  it('pages and filters slim cards', async () => {
    const all = await json<Cards>(fixtureApp, '/api/images/records?collection=diagrams');
    expect(all.total).toBe(2);
    expect(all.items.map((i) => i.id)).toEqual(['fx-diagram-b', 'fx-diagram']);
    expect(all.items[1]?.style).toBe('svg-glass');
    const gaps = await json<Cards>(fixtureApp, '/api/images/records?collection=diagrams&style=photorealistic&gaps=1');
    expect(gaps.items.map((i) => i.id)).toEqual(['fx-diagram-b']);
    const paged = await json<Cards>(fixtureApp, '/api/images/records?collection=earlier&limit=1&offset=1');
    expect(paged.total).toBe(2);
    expect(paged.items.length).toBe(1);
    const facets = await json<{ collections: Record<string, number>; categories: { value: string; count: number }[] }>(fixtureApp, '/api/images/facets?collection=diagrams');
    expect(facets.collections.diagrams).toBe(2);
    expect(facets.categories).toEqual([{ value: 'Test', count: 2 }]);
  });

  it('returns one record with its version chain and lineage', async () => {
    const d = await json<{ record: { id: string }; versions: Record<string, { token: string; current: boolean }[]>; linked: { id: string; kind: string }[] }>(fixtureApp, '/api/images/records/fx-diagram');
    expect(d.record.id).toBe('fx-diagram');
    expect(d.versions['svg-glass']?.map((v) => `${v.token}${v.current ? '*' : ''}`)).toEqual(['v2*', 'v1']);
    expect(d.linked.map((l) => l.id)).toContain('earlier-fx-diagram-svg-glass-aaaaaaaaaaaaaaaa');
    expect((await get(fixtureApp, '/api/images/records/nope')).status).toBe(404);
  });

  it('serves thumbnails and originals as raw bytes with immutable caching, and rejects unsafe paths', async () => {
    const cards = await json<Cards>(fixtureApp, '/api/images/records?collection=scenes');
    const t = cards.items[0]?.treatment as { sha: string; path: string };
    const thumb = await get(fixtureApp, `/api/images/thumb/${t.sha}?w=320`);
    expect(thumb.status).toBe(200);
    expect(thumb.headers.get('content-type')).toBe('image/webp');
    expect(thumb.headers.get('cache-control')).toContain('immutable');
    expect((await thumb.arrayBuffer()).byteLength).toBeGreaterThan(50);

    const svg = (await json<Cards>(fixtureApp, '/api/images/records?collection=icons')).items[0]?.treatment as { sha: string };
    const svgRes = await get(fixtureApp, `/api/images/thumb/${svg.sha}`);
    expect(svgRes.headers.get('content-type')).toContain('image/svg+xml');
    expect(await svgRes.text()).toContain('<svg');

    expect((await get(fixtureApp, `/api/images/thumb/${'0'.repeat(64)}`)).status).toBe(404);
    expect((await get(fixtureApp, '/api/images/thumb/not-a-hash')).status).toBe(404);

    const file = await get(fixtureApp, `/api/images/file/${encodeURIComponent(`wiki/image-library/${t.path}`)}`);
    expect(file.status).toBe(200);
    expect(file.headers.get('content-type')).toBe('image/png');
    for (const bad of ['wiki/image-library/assets/../manifest.json', 'wiki/image-library/manifest.json', '../../etc/passwd', 'wiki/image-library/assets/scenes/fx-scene.png:stream', 'wiki/image-library/assets/scenes']) {
      const r = await get(fixtureApp, `/api/images/file/${encodeURIComponent(bad)}`);
      expect([400, 404], bad).toContain(r.status);
    }
  });

  it('records decisions through the log, validates them and shows the overlay', async () => {
    expect((await post(fixtureApp, '/api/images/decide', { id: 'fx-scene', action: 'reject' })).status).toBe(400);
    expect((await post(fixtureApp, '/api/images/decide', { id: 'fx-scene', action: 'approve', version: 'v9' })).status).toBe(400);
    expect((await post(fixtureApp, '/api/images/decide', { id: 'nope', action: 'approve' })).status).toBe(404);
    const ok = await post(fixtureApp, '/api/images/decide', { id: 'fx-diagram', action: 'approve', style: 'svg-glass', scope: 'public-site', version: 'v1' });
    expect(ok.status).toBe(200);
    const d = await json<{ decision: { kind: string; version: string; scope: string }; decisions: { action: string; subject: string }[] }>(fixtureApp, '/api/images/records/fx-diagram');
    expect(d.decision).toMatchObject({ kind: 'approved', version: 'v1', scope: 'public-site' });
    expect(d.decisions[0]).toMatchObject({ action: 'approve', subject: 'img:fx-diagram@v1' });
    expect((await json<Cards>(fixtureApp, '/api/images/records?collection=diagrams&status=approved')).items.map((i) => i.id)).toEqual(['fx-diagram']);
  });

  it('previews a registration without writing and reports the sweep', async () => {
    const { writePng } = await import('./images-fixture');
    await writePng(path.join(fx.lib, 'assets/scenes/http-new.png'), { r: 5, g: 6, b: 7 });
    const plan = await (await post(fixtureApp, '/api/images/register/plan', { paths: ['assets/scenes/http-new.png'] })).json() as { ok: boolean; items: { action: string }[]; records: number };
    expect(plan).toMatchObject({ ok: true, records: 1 });
    expect(plan.items[0]?.action).toBe('new-record');
    const sweep = await json<{ unregistered: { path: string }[] }>(fixtureApp, '/api/images/sweep');
    expect(sweep.unregistered.map((u) => u.path)).toEqual(['assets/scenes/http-new.png']);
    expect((await post(fixtureApp, '/api/images/register/plan', { paths: [] })).status).toBe(400);
  });

  it('exposes the img: resolver through the core asset routes', async () => {
    const list = await json<{ items: { ref: string; preview: string; canonicalPath: string }[]; total: number }>(fixtureApp, '/api/assets/img?q=fixture&limit=5');
    expect(list.total).toBeGreaterThan(0);
    expect(list.items[0]?.preview).toMatch(/^\/api\/images\/thumb\/[0-9a-f]{64}\?w=320$/);
    const one = await json<{ canonicalPath: string; meta: { version: string } }>(fixtureApp, `/api/assets/resolve?ref=${encodeURIComponent('img:fx-diagram#svg-glass@v1')}`);
    expect(one.canonicalPath).toBe('wiki/image-library/assets/vector/diagrams/svg-glass/fx-diagram-v1.svg');
    expect((await get(fixtureApp, `/api/assets/resolve?ref=${encodeURIComponent('img:missing')}`)).status).toBe(404);
  });
});

describe('real library over HTTP (read-only)', () => {
  it('never sends the whole manifest: a page of cards is small and facets cover the tabs', async () => {
    const res = await get(realApp, '/api/images/records?collection=experiments&limit=60');
    const text = await res.text();
    expect(text.length).toBeLessThan(60_000);
    const facets = await json<{ collections: Record<string, number> }>(realApp, '/api/images/facets?collection=diagrams');
    expect(Object.keys(facets.collections)).toEqual(expect.arrayContaining(['diagrams', 'icons', 'originals', 'scenes', 'comics', 'earlier', 'experiments']));
  });

  it('generates a small thumbnail for a large PNG once and serves it from the cache', async () => {
    const page = await json<Cards>(realApp, '/api/images/records?collection=scenes&limit=60');
    const png = page.items.find((i) => i.treatment?.path.endsWith('.png'));
    expect(png).toBeTruthy();
    const url = `/api/images/thumb/${png?.treatment?.sha}?w=320`;
    const first = await get(realApp, url);
    expect(first.status).toBe(200);
    const bytes = (await first.arrayBuffer()).byteLength;
    expect(bytes).toBeLessThan(120_000);
    const t0 = Date.now();
    const second = await get(realApp, url);
    expect((await second.arrayBuffer()).byteLength).toBe(bytes);
    expect(Date.now() - t0).toBeLessThan(1500);
  });

  it('sweeps the real library read-only', async () => {
    const report = await json<{ registeredImages: number; unregistered: unknown[]; problems: unknown[] }>(realApp, '/api/images/sweep');
    expect(report.registeredImages).toBeGreaterThan(1000);
    expect(Array.isArray(report.unregistered)).toBe(true);
  });
});
