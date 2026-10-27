// Auto-intake (server/core/intake.ts) with fake modules, plus the real soundtrack and images intakes on temp copies.
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { FileDecisionLog } from '../server/core/decisions';
import { IntakeService, flattenMisses, leaseHolderOf, recentFailures } from '../server/core/intake';
import { FileLeases } from '../server/core/leases';
import { FileWikiStore } from '../server/core/wiki-store';
import type { IntakeFile, IntakeOutcome, ModuleIntake, Services } from '../modules/types';
import { createSoundtrackIntake } from '../modules/soundtrack/intake';
import { SoundtrackStore } from '../modules/soundtrack/server/store';
import { createImagesIntake } from '../modules/images/intake';
import { HELPER, makeFixture, writePng } from './images-fixture';

const cleanups: (() => void)[] = [];
afterEach(() => {
  while (cleanups.length) cleanups.pop()?.();
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function until(fn: () => boolean | Promise<boolean>, ms = 5000): Promise<void> {
  const end = Date.now() + ms;
  while (!(await fn())) {
    if (Date.now() > end) throw new Error('timed out');
    await sleep(25);
  }
}

function tempRoot(): string {
  const root = mkdtempSync(path.join(os.tmpdir(), 'mtw-intake-'));
  cleanups.push(() => rmSync(root, { recursive: true, force: true, maxRetries: 3 }));
  mkdirSync(path.join(root, 'wiki', 'fake', 'assets'), { recursive: true });
  return root;
}

/** In-memory catalog; register() sleeps so overlapping calls would be visible. */
function fakeModule(opts: { delayMs?: number; fail?: () => string | null } = {}) {
  const registered = new Set<string>();
  const calls: string[][] = [];
  let active = 0;
  let maxActive = 0;
  const intake: ModuleIntake = {
    lib: 'fake',
    defaultRoots: ['wiki/fake/assets/'],
    accepts: (rel) => rel.endsWith('.png'),
    async unregistered(rels) {
      return rels.filter((r) => !registered.has(r));
    },
    async register(files: IntakeFile[]): Promise<IntakeOutcome[]> {
      active++;
      maxActive = Math.max(maxActive, active);
      calls.push(files.map((f) => f.path));
      await sleep(opts.delayMs ?? 30);
      active--;
      const failure = opts.fail?.();
      if (failure) throw new Error(failure);
      for (const f of files) registered.add(f.path);
      return files.map((f) => ({ path: f.path, ok: true, subject: `fake:${f.path}` }));
    },
    async pending() {
      return { count: registered.size, label: 'Fake pending', href: '/m/fake' };
    },
  };
  return { intake, registered, calls, get maxActive() { return maxActive; } };
}

function service(root: string, modules: { id: string; intake: ModuleIntake }[], config: Record<string, unknown> = {}) {
  const wiki = new FileWikiStore(root, new FileLeases(root));
  const decisions = new FileDecisionLog(wiki);
  const events: { type: string; data: unknown }[] = [];
  const stateDir = path.join(root, 'state');
  const svc = new IntakeService({
    repoRoot: root,
    stateDir,
    decisions,
    events: { emit: (type, data) => events.push({ type, data }) },
    modules,
    watch: false,
    pollMs: 60,
    config: { enabled: true, since: null, stableMs: 60, modules: {}, ...config },
  });
  cleanups.push(() => svc.stop());
  return { svc, decisions, events, stateDir };
}

const put = (root: string, rel: string, body: string | Buffer = 'png-bytes') => {
  mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  writeFileSync(path.join(root, rel), body);
};

describe('IntakeService', () => {
  it('registers once (idempotent), logs auto-registered by studio-intake, and emits SSE', async () => {
    const root = tempRoot();
    const fake = fakeModule();
    const { svc, decisions, events } = service(root, [{ id: 'fake', intake: fake.intake }]);
    await svc.start();
    put(root, 'wiki/fake/assets/a.png');
    const files = [{ path: 'wiki/fake/assets/a.png', bytes: 9, mtimeMs: Date.now() }];
    const [r1, r2] = await Promise.all([svc.process('fake', files, 't'), svc.process('fake', files, 't')]);
    expect(r1.filter((o) => o.ok)).toHaveLength(1);
    expect(r2).toHaveLength(0);
    expect(fake.calls).toHaveLength(1);
    await svc.reconcile('again'); // a fresh file goes through the stability check, then finds it registered
    await sleep(250);
    await svc.idle();
    expect(fake.calls).toHaveLength(1);
    const log = await decisions.list('fake');
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ actor: 'studio-intake', action: 'auto-registered', module: 'fake', subject: 'fake:wiki/fake/assets/a.png' });
    expect(events.some((e) => e.type === 'wiki-changed' && (e.data as { module: string }).module === 'fake')).toBe(true);
    expect(events.some((e) => e.type === 'intake')).toBe(true);
  });

  it('waits until size and mtime are stable before registering', async () => {
    const root = tempRoot();
    const fake = fakeModule();
    const { svc } = service(root, [{ id: 'fake', intake: fake.intake }]);
    await svc.start();
    const rel = 'wiki/fake/assets/growing.png';
    put(root, rel, 'a');
    svc.notice(rel);
    for (let i = 0; i < 5; i++) {
      await sleep(40);
      appendFileSync(path.join(root, rel), 'more');
      svc.notice(rel);
    }
    expect(fake.calls).toHaveLength(0);
    expect((await svc.status()).waiting).toContain(rel);
    await until(() => fake.registered.has(rel));
    expect(fake.calls).toEqual([[rel]]);
    // A file that vanishes while settling is dropped, not failed.
    put(root, 'wiki/fake/assets/temp.png');
    svc.notice('wiki/fake/assets/temp.png');
    rmSync(path.join(root, 'wiki/fake/assets/temp.png'));
    await sleep(250);
    expect((await svc.status()).failures).toHaveLength(0);
  });

  it('serializes producer calls across modules and concurrent triggers', async () => {
    const root = tempRoot();
    mkdirSync(path.join(root, 'wiki', 'other', 'assets'), { recursive: true });
    const a = fakeModule({ delayMs: 50 });
    const b = fakeModule({ delayMs: 50 });
    const bIntake = { ...b.intake, defaultRoots: ['wiki/other/assets/'] };
    const { svc } = service(root, [{ id: 'a', intake: a.intake }, { id: 'b', intake: bIntake }]);
    await svc.start();
    const jobs: Promise<unknown>[] = [];
    for (let i = 0; i < 4; i++) {
      put(root, `wiki/fake/assets/${i}.png`);
      put(root, `wiki/other/assets/${i}.png`);
      jobs.push(svc.process('a', [{ path: `wiki/fake/assets/${i}.png`, bytes: 1, mtimeMs: 0 }], 't'));
      jobs.push(svc.process('b', [{ path: `wiki/other/assets/${i}.png`, bytes: 1, mtimeMs: 0 }], 't'));
    }
    let overlap = 0;
    const probe = setInterval(() => {
      if (a.maxActive + b.maxActive > 2) overlap++;
    }, 5);
    await Promise.all(jobs);
    clearInterval(probe);
    expect(a.maxActive).toBe(1);
    expect(b.maxActive).toBe(1);
    expect(a.calls.length + b.calls.length).toBe(8);
    expect(overlap).toBe(0);
  });

  it('reconciles at startup what appeared while down, skipping files older than since; a copy keeping an old mtime counts as arrived', async () => {
    const root = tempRoot();
    put(root, 'wiki/fake/assets/old.png');
    const old = new Date('2026-01-01T00:00:00Z');
    utimesSync(path.join(root, 'wiki/fake/assets/old.png'), old, old);
    await new Promise((r) => setTimeout(r, 60));
    const since = new Date(Date.now() - 20).toISOString(); // after old.png was created, before the files below
    await new Promise((r) => setTimeout(r, 40));
    put(root, 'wiki/fake/assets/sub/new.png');
    const past = new Date(Date.now() - 10_000);
    utimesSync(path.join(root, 'wiki/fake/assets/sub/new.png'), past, past);
    put(root, 'wiki/fake/assets/sub/copied.png'); // Windows copies keep the source's mtime: creation time decides
    utimesSync(path.join(root, 'wiki/fake/assets/sub/copied.png'), old, old);
    put(root, 'wiki/fake/assets/notes.txt');
    const fake = fakeModule();
    const { svc } = service(root, [{ id: 'fake', intake: fake.intake }], { since });
    await svc.start();
    await until(() => fake.registered.size === 2);
    await svc.idle();
    expect([...fake.registered].sort()).toEqual(['wiki/fake/assets/sub/copied.png', 'wiki/fake/assets/sub/new.png']);
    expect((await svc.status()).lastReconcile).toMatchObject({ reason: 'startup', found: 2, registered: 2 });
  });

  it('keeps producer failures visible on Home until a later pass succeeds; disabled config does nothing', async () => {
    const root = tempRoot();
    let failing = true;
    const fake = fakeModule({ fail: () => (failing ? 'producer exploded' : null) });
    const { svc, stateDir } = service(root, [{ id: 'fake', intake: fake.intake }]);
    await svc.start();
    put(root, 'wiki/fake/assets/x.png');
    const past = new Date(Date.now() - 10_000);
    utimesSync(path.join(root, 'wiki/fake/assets/x.png'), past, past);
    await svc.reconcile('t');
    const status = await svc.status();
    expect(status.failures).toEqual([expect.objectContaining({ path: 'wiki/fake/assets/x.png', error: 'producer exploded' })]);
    const items = await svc.summaryItems();
    expect(items.find((i) => i.id === 'failures')).toMatchObject({ count: 1, attention: true });
    expect(JSON.parse(readFileSync(path.join(stateDir, 'intake', 'state.json'), 'utf8')).failures).toHaveLength(1);
    failing = false;
    await svc.reconcile('retry');
    expect((await svc.status()).failures).toHaveLength(0);

    const off = service(tempRoot(), [{ id: 'fake', intake: fakeModule().intake }], { enabled: false });
    await off.svc.start();
    expect((await off.svc.reconcile('t')).found).toBe(0);
    expect((await off.svc.summaryItems()).find((i) => i.id === 'disabled')).toMatchObject({ attention: true });
  });

  it('a deferred outcome is not a failure; it is shown as deferred and re-checked later', async () => {
    const root = tempRoot();
    const fake = fakeModule();
    let defer = true;
    const intake: ModuleIntake = {
      ...fake.intake,
      async register(files, scope) {
        if (defer && !scope?.force) return files.map((f) => ({ path: f.path, ok: false, deferUntil: Date.now() + 50, detail: 'waiting for author' }));
        return fake.intake.register(files);
      },
    };
    const { svc } = service(root, [{ id: 'fake', intake }]);
    await svc.start();
    put(root, 'wiki/fake/assets/d.png');
    const out = await svc.process('fake', [{ path: 'wiki/fake/assets/d.png', bytes: 1, mtimeMs: 0 }], 't');
    expect(out[0]?.deferUntil).toBeTruthy();
    const s = await svc.status();
    expect(s.failures).toHaveLength(0);
    expect(s.deferred.map((d) => d.path)).toEqual(['wiki/fake/assets/d.png']);
    defer = false;
    await until(() => fake.registered.has('wiki/fake/assets/d.png'));
    expect((await svc.status()).deferred).toHaveLength(0);
  });

  it('shows agent misses until their files are registered', async () => {
    const root = tempRoot();
    const fake = fakeModule();
    const { svc, stateDir } = service(root, [{ id: 'fake', intake: fake.intake }]);
    await svc.start();
    put(root, 'wiki/fake/assets/m.png');
    mkdirSync(stateDir, { recursive: true });
    writeFileSync(path.join(stateDir, 'intake-misses.jsonl'), `${JSON.stringify({ at: '2026-10-10T05:00:00Z', files: ['wiki/fake/assets/m.png'] })}\n{torn\n`);
    expect((await svc.summaryItems()).find((i) => i.id === 'misses')).toMatchObject({ count: 1, attention: true });
    fake.registered.add('wiki/fake/assets/m.png');
    expect((await svc.summaryItems(0)).find((i) => i.id === 'misses')).toMatchObject({ count: 0, attention: false });
  });
});

function coreServices(root: string): Services {
  const leases = new FileLeases(root);
  const wiki = new FileWikiStore(root, leases);
  return { repoRoot: root, wiki, decisions: new FileDecisionLog(wiki), events: { emit: () => undefined }, leases } as unknown as Services;
}

describe('soundtrack intake', () => {
  it("adds music as a 'needs source' sources.json entry and comic audio to comic-intake.json, never the music list", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'mtw-snd-intake-'));
    cleanups.push(() => rmSync(root, { recursive: true, force: true }));
    const lib = path.join(root, 'wiki', 'soundtrack-library');
    mkdirSync(path.join(lib, 'profiles'), { recursive: true });
    writeFileSync(path.join(lib, 'sources.json'), JSON.stringify({ tracks: [{ id: 'known', file: 'known.mp3', provider: 'P', title: 'K', artist: 'A', status: 'approved' }] }));
    writeFileSync(path.join(lib, 'manifest.json'), '{}');
    put(root, 'wiki/soundtrack-library/assets/known.mp3', 'k');
    put(root, 'wiki/soundtrack-library/assets/new-song.mp3', 'n');
    put(root, 'wiki/soundtrack-library/assets/speech/b1/line-v1.mp3', 's');
    put(root, 'wiki/soundtrack-library/assets/speech/b1/listed-v1.mp3', 'l');
    put(root, 'wiki/comics-library/speech.json', JSON.stringify({ records: [{ canonicalPath: 'wiki/soundtrack-library/assets/speech/b1/listed-v1.mp3' }] }));
    const services = coreServices(root);
    const intake = createSoundtrackIntake(services, new SoundtrackStore(services), { now: () => new Date('2026-10-10T06:00:00Z') });
    const all = ['known.mp3', 'new-song.mp3', 'speech/b1/line-v1.mp3', 'speech/b1/listed-v1.mp3'].map((f) => `wiki/soundtrack-library/assets/${f}`);
    expect(await intake.unregistered(all)).toEqual([all[1], all[2]]);
    const out = await intake.register([all[1], all[2]].map((p) => ({ path: p as string, bytes: 1, mtimeMs: 0 })));
    expect(out.every((o) => o.ok)).toBe(true);
    const sources = JSON.parse(readFileSync(path.join(lib, 'sources.json'), 'utf8')) as { tracks: { id: string; file: string; status: string; kind?: string }[] };
    const added = sources.tracks.filter((t) => t.id.startsWith('intake-'));
    expect(added.map((t) => [t.file, t.status, t.kind])).toEqual([['new-song.mp3', 'needs source', 'music']]);
    expect(JSON.parse(readFileSync(path.join(lib, 'manifest.json'), 'utf8')).counts.tracks).toBe(2);
    const comic = JSON.parse(readFileSync(path.join(lib, 'comic-intake.json'), 'utf8')) as { records: { canonicalPath: string; kind: string }[] };
    expect(comic.records.map((r) => [r.canonicalPath, r.kind])).toEqual([[all[2], 'speech']]);
    // Idempotent: a second pass adds nothing.
    expect(await intake.register([{ path: all[1] as string, bytes: 1, mtimeMs: 0 }])).toEqual([]);
    expect(await intake.unregistered(all)).toEqual([]);
    expect(await intake.pending()).toMatchObject({ count: 1 });
  });
});

describe('images intake (real producer)', () => {
  it('registers a scene as unreviewed-preview and an unplaceable diagrams-folder file into experiments; repeat is a no-op', async () => {
    const fx = await makeFixture();
    cleanups.push(fx.cleanup);
    // The fixture leaves its seeded PNGs unregistered; register them first so they do not block the producer.
    const intakeA = createImagesIntake(fx.services, { stateDir: fx.stateDir, helper: HELPER, catalog: fx.catalog });
    const seeded = await intakeA.unregistered(['assets/scenes/fx-scene.png'].map((p) => `wiki/image-library/${p}`));
    expect(seeded.length).toBeLessThanOrEqual(1);
    await writePng(path.join(fx.lib, 'assets/scenes/intake-new.png'), { r: 1, g: 2, b: 3 });
    await writePng(path.join(fx.lib, 'assets/vector/diagrams/svg-flat/brand-new-thing.png'), { r: 4, g: 5, b: 6 });
    const { sweepImages } = await import('../modules/images/server/sweep');
    const unregistered = (await sweepImages(fx.catalog)).unregistered.map((u) => `wiki/image-library/${u.path}`);
    const out = await intakeA.register(unregistered.map((p) => ({ path: p, bytes: 1, mtimeMs: 0 })));
    expect(out.filter((o) => !o.ok)).toEqual([]);
    const manifest = JSON.parse(readFileSync(path.join(fx.lib, 'manifest.json'), 'utf8')) as { records: { id: string; collection: string; treatments: Record<string, { path: string; status: string; note?: string }> }[] };
    const byPath = (p: string) => manifest.records.flatMap((r) => Object.entries(r.treatments).map(([style, t]) => ({ r, style, t }))).find((x) => x.t.path === p);
    const scene = byPath('assets/scenes/intake-new.png');
    expect(scene?.t.status).toBe('unreviewed-preview');
    expect(scene?.r.collection).toBe('scenes');
    const loose = byPath('assets/vector/diagrams/svg-flat/brand-new-thing.png');
    expect(loose?.r.collection).toBe('experiments');
    expect(loose?.t.note).toMatch(/Auto-registered by Studio intake/);
    expect(await intakeA.unregistered(['wiki/image-library/assets/scenes/intake-new.png'])).toEqual([]);
    expect(await intakeA.register([{ path: 'wiki/image-library/assets/scenes/intake-new.png', bytes: 1, mtimeMs: 0 }])).toEqual([]);
    expect((await intakeA.pending()).count).toBeGreaterThanOrEqual(2);
    expect(existsSync(path.join(fx.lib, 'assets/scenes/intake-new.png'))).toBe(true);

    // A file that needs a record decision waits out the grace for its author; a forced pass (an agent naming its own files) files it.
    await writePng(path.join(fx.lib, 'assets/vector/diagrams/svg-flat/fx-diagram-v9.png'), { r: 9, g: 9, b: 9 });
    const v9 = [{ path: 'wiki/image-library/assets/vector/diagrams/svg-flat/fx-diagram-v9.png', bytes: 1, mtimeMs: Date.now() }];
    const waiting = await intakeA.register(v9, { sinceMs: 0, stableMs: 0, graceMs: 60_000 });
    expect(waiting[0]).toMatchObject({ ok: false });
    expect(waiting[0]?.deferUntil).toBeGreaterThan(Date.now());
    expect(await intakeA.unregistered([v9[0]!.path])).toHaveLength(1);
    const forced = await intakeA.register(v9, { sinceMs: 0, stableMs: 0, graceMs: 60_000, force: true });
    expect(forced[0]).toMatchObject({ ok: true });
    const m2 = JSON.parse(readFileSync(path.join(fx.lib, 'manifest.json'), 'utf8')) as typeof manifest;
    expect(m2.records.find((r) => Object.values(r.treatments).some((t) => t.path === 'assets/vector/diagrams/svg-flat/fx-diagram-v9.png'))?.collection).toBe('experiments');

    // Two files that settled apart: registering one sweeps in the other only when it is eligible (newer than since).
    await writePng(path.join(fx.lib, 'assets/scenes/pair-a.png'), { r: 7, g: 7, b: 1 });
    await writePng(path.join(fx.lib, 'assets/scenes/pair-b.png'), { r: 7, g: 7, b: 2 });
    const one = [{ path: 'wiki/image-library/assets/scenes/pair-a.png', bytes: 1, mtimeMs: 0 }];
    const blocked = await intakeA.register(one, { sinceMs: Date.now() + 60_000, stableMs: 0 });
    expect(blocked[0]?.detail).toMatch(/blocked/);
    const both = await intakeA.register(one, { sinceMs: 0, stableMs: 0 });
    expect(both.filter((o) => o.ok).map((o) => o.path).sort()).toEqual(['wiki/image-library/assets/scenes/pair-a.png', 'wiki/image-library/assets/scenes/pair-b.png']);
  });
});

describe('Home facts: lease deferrals, the 24 h failure window and open misses (2026-10-12)', () => {
  it('a lease refusal is held (deferred), not a failure, and older state files are migrated', async () => {
    const root = tempRoot();
    const fake = fakeModule();
    let leased = true;
    const intake: ModuleIntake = {
      ...fake.intake,
      async register(files) {
        if (leased) return files.map((f) => ({ path: f.path, ok: false, detail: 'wiki/image-library/manifest.json is leased to codex-root; no changes made' }));
        return fake.intake.register(files);
      },
    };
    const { svc, stateDir } = service(root, [{ id: 'fake', intake }]);
    await svc.start();
    put(root, 'wiki/fake/assets/l.png');
    await svc.process('fake', [{ path: 'wiki/fake/assets/l.png', bytes: 1, mtimeMs: 0 }], 't');
    const f = await svc.facts(24, 0);
    expect(f.failures).toHaveLength(0);
    expect(f.held).toEqual([expect.objectContaining({ path: 'wiki/fake/assets/l.png', holder: 'codex-root' })]);
    expect((await svc.summaryItems(0)).find((i) => i.id === 'failures')).toMatchObject({ count: 0, attention: false });
    leased = false;
    await svc.process('fake', [{ path: 'wiki/fake/assets/l.png', bytes: 1, mtimeMs: 0 }], 't');
    expect((await svc.facts(24, 0)).held).toHaveLength(0);

    // A state file written by an older Studio kept lease refusals as failures.
    const root2 = tempRoot();
    const s2 = service(root2, [{ id: 'fake', intake: fakeModule().intake }]);
    mkdirSync(path.join(s2.stateDir, 'intake'), { recursive: true });
    const at = new Date().toISOString();
    writeFileSync(path.join(s2.stateDir, 'intake', 'state.json'), JSON.stringify({ failures: [{ module: 'fake', path: 'wiki/fake/assets/a.png', error: 'x is leased to h1; no changes made', at }, { module: 'fake', path: 'wiki/fake/assets/b.png', error: 'producer exploded', at }] }));
    await s2.svc.start();
    const f2 = await s2.svc.facts(24, 0);
    expect(f2.failures.map((x) => x.path)).toEqual(['wiki/fake/assets/b.png']);
    expect(f2.held.map((x) => x.holder)).toEqual(['h1']);
    expect(stateDir).toBeTruthy();
  });

  it('counts only failures from the last 24 h, one per path, newest first', () => {
    const now = new Date('2026-10-12T12:00:00Z');
    const r = recentFailures(
      [
        { module: 'm', path: 'a', error: 'old', at: '2026-10-10T12:00:00Z' },
        { module: 'm', path: 'b', error: 'newer', at: '2026-10-12T11:00:00Z' },
        { module: 'm', path: 'c', error: 'newest', at: '2026-10-12T11:30:00Z' },
      ],
      now,
    );
    expect(r.recent.map((f) => f.path)).toEqual(['c', 'b']);
    expect(r.older).toBe(1);
    expect(leaseHolderOf('wiki/image-library/manifest.json is leased to codex-root-home-native-r08-intake; no changes made')).toBe('codex-root-home-native-r08-intake');
    expect(leaseHolderOf('producer exploded')).toBeNull();
  });

  it('flattens misses to one row per path (newest miss wins) and classifies repo, outside and transport paths', () => {
    const rows = flattenMisses(
      [
        { at: '2026-10-10T06:00:00Z', files: ['wiki/fake/assets/x.png'], outside: ['site/public/comic/home/a-1600.avif'] },
        { at: '2026-10-11T06:00:00Z', files: [], outside: ['site/public/comic/home/a-1600.avif', 'C:/Users/me/.codex/generated_images/s/e.png', 'C:/Repo/discussion/y.png'] },
      ],
      () => true,
      'C:/Repo',
    );
    expect(rows).toEqual([
      expect.objectContaining({ path: 'wiki/fake/assets/x.png', kind: 'unregistered', at: '2026-10-10T06:00:00Z' }),
      expect.objectContaining({ path: 'site/public/comic/home/a-1600.avif', kind: 'outside', at: '2026-10-11T06:00:00Z' }),
      expect.objectContaining({ path: 'C:/Users/me/.codex/generated_images/s/e.png', kind: 'transport' }),
      expect.objectContaining({ path: 'discussion/y.png', kind: 'outside' }),
    ]);
  });

  it('an outside miss closes once the file is gone, and a transport file closes once a catalog names its bytes', async () => {
    const root = tempRoot();
    const { svc, stateDir } = service(root, [{ id: 'fake', intake: fakeModule().intake }]);
    await svc.start();
    const transport = path.join(root, 'cache', 'gen.png');
    mkdirSync(path.dirname(transport), { recursive: true });
    writeFileSync(transport, 'generated bytes');
    mkdirSync(path.join(root, 'discussion'), { recursive: true });
    writeFileSync(path.join(root, 'discussion', 'stray.png'), 'stray');
    mkdirSync(stateDir, { recursive: true });
    writeFileSync(path.join(stateDir, 'intake-misses.jsonl'), `${JSON.stringify({ at: '2026-10-12T01:00:00Z', files: [], outside: ['discussion/stray.png', 'site/public/comic/gone-1600.avif', 'Z:/elsewhere/cache/gen.png'] })}\n`);
    // The transport path above points outside this root and does not exist there: closed. The stray repo file is open.
    expect((await svc.openMissFiles()).map((f) => f.path)).toEqual(['discussion/stray.png']);
    rmSync(path.join(root, 'discussion', 'stray.png'));
    expect(await svc.openMissFiles()).toEqual([]);
  });
});
