// Home summaries of the five modules that provide one: images, soundtrack, journal, storage, schedules.
// Each summary must be cheap (cached or small files), must not write, and must return counts that match the module's own data.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { server as journal } from '../modules/journal/server';
import { createImagesServer } from '../modules/images/server';
import { server as schedules } from '../modules/schedules/server';
import { StoragePlans } from '../modules/storage/plans';
import { server as storage } from '../modules/storage/server';
import { server as soundtrack } from '../modules/soundtrack/server';
import type { ModuleSummary, ServerModule, Services } from '../modules/types';
import { createCore } from '../server/core/services';
import { ApiRouter } from '../server/router';
import { makeFixture as makeImagesFixture } from './images-fixture';
import type { Fixture as ImagesFixture } from './images-fixture';
import { makeFixture as makeSoundtrackFixture } from './soundtrack-fixture';
import type { Fixture as SoundtrackFixture } from './soundtrack-fixture';
import { makeRepo as makeStorageRepo } from './storage-fixture';

const appRoot = fileURLToPath(new URL('..', import.meta.url));
const liveRepo = path.resolve(appRoot, '..', '..');

/** The shape Home relies on: every item has a label, an href and a count it can show. */
function expectWellFormed(summary: ModuleSummary): void {
  expect(Array.isArray(summary.items)).toBe(true);
  for (const item of summary.items) {
    expect(typeof item.id).toBe('string');
    expect(item.label.length).toBeGreaterThan(0);
    expect(item.href.startsWith('/m/')).toBe(true);
    expect(item.count === null || item.count === undefined || typeof item.count === 'number' || typeof item.count === 'string').toBe(true);
    expect(item.attention === undefined || typeof item.attention === 'boolean').toBe(true);
  }
}

/** Register a module on a fresh router, the way the server does at boot, and return the core it was given. */
function registerOn(mod: ServerModule, repoRoot: string): Services {
  const core = createCore(repoRoot, appRoot);
  void mod.register?.(new ApiRouter().mount(`/api/${mod.meta.id}`), core);
  return core;
}

describe('images summary', () => {
  let fx: ImagesFixture;
  beforeAll(async () => {
    fx = await makeImagesFixture();
  });
  afterAll(() => fx?.cleanup());

  it('returns a null count before the catalogue is mounted', async () => {
    const summary = await createImagesServer().summary?.(createCore(fx.root, appRoot));
    expect(summary).toMatchObject({ items: [{ id: 'unreviewed', count: undefined, attention: false }] });
  });

  it('counts unreviewed records with the library filter and links to that filter', async () => {
    const mod = createImagesServer({ stateDir: fx.stateDir });
    const services = fx.services;
    mod.register?.(new ApiRouter().mount('/api/images'), services);
    const summary = await mod.summary?.(services);
    expect(summary).toBeDefined();
    const s = summary as ModuleSummary;
    expectWellFormed(s);
    const expected = (await fx.catalog.cards({ collection: 'all', status: 'unreviewed', limit: 1 })).total;
    expect(s.items[0]).toMatchObject({ id: 'unreviewed', count: expected, href: '/m/images?collection=all&status=unreviewed', attention: expected > 0 });
  });
});

describe('soundtrack summary', () => {
  let fx: SoundtrackFixture;
  beforeAll(() => {
    fx = makeSoundtrackFixture();
  });
  afterAll(() => fx?.cleanup());

  it('counts candidate tracks from the cached manifest and links to the candidate filter', async () => {
    const services = registerOn(soundtrack, fx.root);
    const summary = (await soundtrack.summary?.(services)) as ModuleSummary;
    expectWellFormed(summary);
    const manifest = JSON.parse(readFileSync(path.join(fx.root, 'wiki', 'soundtrack-library', 'manifest.json'), 'utf8')) as { counts: { candidates: number } };
    expect(summary.items[0]).toMatchObject({ id: 'candidates', count: manifest.counts.candidates, href: '/m/soundtrack?status=candidate' });
    expect(summary.items[0]?.attention).toBe(manifest.counts.candidates > 0);
  });
});

describe('journal summary', () => {
  it('shows no count until the journal state has been built once', async () => {
    // A services object that the Journal module never registered on has no service, so nothing is built or read.
    const summary = (await journal.summary?.(createCore(liveRepo, appRoot))) as ModuleSummary;
    expect(summary.items[0]).toMatchObject({ id: 'waiting', count: undefined, href: '/m/journal', attention: false });
  });

  it('counts the waiting list from the same state the Journal view reads', async () => {
    const services = createCore(liveRepo, appRoot);
    const api = new ApiRouter();
    journal.register?.(api.mount('/api/journal'), services);
    const state = api.match('GET', '/api/journal/state');
    expect(state).not.toBeNull();
    const built = (await state?.handler({ params: {}, query: new URLSearchParams(), body: undefined, headers: {}, method: 'GET' })) as { waiting: unknown[] };
    const summary = (await journal.summary?.(services)) as ModuleSummary;
    expectWellFormed(summary);
    expect(summary.items[0]).toMatchObject({ id: 'waiting', count: built.waiting.length, href: '/m/journal', attention: built.waiting.length > 0 });
  });
});

describe('storage summary', () => {
  let root: string;
  beforeAll(async () => {
    root = await makeStorageRepo();
  });

  it('counts draft plans and links to the plans view', async () => {
    const services = createCore(root, appRoot);
    const summary = (await storage.summary?.(services)) as ModuleSummary;
    expectWellFormed(summary);
    const plans = await new StoragePlans(services, root).listPlans();
    const drafts = plans.filter((p) => p.status === 'draft').length;
    expect(summary.items[0]).toMatchObject({ id: 'plans', count: drafts, href: '/m/storage/plans', attention: drafts > 0 });
  });
});

describe('schedules summary', () => {
  it('counts enabled schedules, shows the next run in the label, and never asks for attention', async () => {
    const services = registerOn(schedules, liveRepo);
    const summary = (await schedules.summary?.(services)) as ModuleSummary;
    expectWellFormed(summary);
    const item = summary.items[0];
    expect(item).toMatchObject({ id: 'enabled', href: '/m/schedules', attention: false });
    expect(item?.label.startsWith('Next scheduled run: ')).toBe(true);
    expect(typeof item?.count).toBe('number');
  });
});
