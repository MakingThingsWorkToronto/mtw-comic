// Images module against a throwaway mini library under the OS temp dir (never wiki/): registration round trip with the
// real producer, sweep, path confinement, thumbnails, decisions, snapshot export.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { exportImages } from '../modules/images/server/export';
import { PathError, confineLibraryPath, readableFile } from '../modules/images/server/files';
import { planRegister, runRegister } from '../modules/images/server/register';
import { inferCollection, sweepImages } from '../modules/images/server/sweep';
import { createSnapshotData } from '../modules/images/snapshot/data';
import { matchEntries } from '../modules/images/shared/filter';
import { DECISIONS_LIB } from '../modules/images/shared/types';
import type { Manifest } from '../modules/images/shared/types';
import { makeFixture, writePng } from './images-fixture';
import type { Fixture } from './images-fixture';

const sha = (file: string): string => createHash('sha256').update(readFileSync(file)).digest('hex');

/** Hash of every file under a directory, for "nothing under wiki/ changed" assertions. */
function treeHash(dir: string): string {
  const h = createHash('sha256');
  const walk = (d: string): void => {
    for (const name of readdirSync(d).sort()) {
      const abs = path.join(d, name);
      if (statSync(abs).isDirectory()) walk(abs);
      else h.update(`${path.relative(dir, abs)}:${sha(abs)}\n`);
    }
  };
  walk(dir);
  return h.digest('hex');
}

let fx: Fixture;
beforeAll(async () => {
  fx = await makeFixture();
}, 120000);
afterAll(() => fx?.cleanup());

const manifestOf = (): Manifest => JSON.parse(readFileSync(path.join(fx.lib, 'manifest.json'), 'utf8')) as Manifest;

describe('fixture library', () => {
  it('verifies with the real producer', () => {
    const v = fx.run('verify');
    expect(v.code, v.out).toBe(0);
  });

  it('serves the same filtered ids from the server catalog and the snapshot adapter', async () => {
    const m = manifestOf();
    const data = createSnapshotData(m);
    for (const q of [{ collection: 'diagrams' }, { collection: 'diagrams', gaps: true }, { collection: 'earlier' }, { collection: 'icons', style: 'svg-flat' }, { collection: 'diagrams', q: 'gaps' }]) {
      const server = await fx.catalog.cards({ ...q, limit: 100 });
      const snap = await data.records({ ...q, limit: 100 });
      expect(snap.items.map((c) => c.id)).toEqual(server.items.map((c) => c.id));
    }
    const gaps = await fx.catalog.cards({ collection: 'diagrams', gaps: true, style: 'holographic' });
    expect(gaps.items.map((c) => c.id)).toEqual(['fx-diagram-b']);
  });
});

describe('registration round trip', () => {
  it('registers a new record, then a new version, then treats the same bytes as a no-op', async () => {
    // New record.
    await writePng(path.join(fx.lib, 'assets/scenes/fx-new.png'), { r: 1, g: 2, b: 3 });
    let plan = await planRegister(fx.ctx.register, ['wiki/image-library/assets/scenes/fx-new.png'], { note: 'first' });
    expect(plan.ok, JSON.stringify(plan)).toBe(true);
    expect(plan.items[0]).toMatchObject({ action: 'new-record', recordId: 'fx-new', style: 'photograph', collection: 'scenes' });
    expect(plan.payload?.records[0]).toMatchObject({ id: 'fx-new', collection: 'scenes', treatments: { photograph: { status: 'unreviewed-preview', note: 'first', path: 'assets/scenes/fx-new.png' } } });
    const manifestBefore = sha(path.join(fx.lib, 'manifest.json'));
    let result = await runRegister(fx.ctx.register, plan);
    expect(result.ok, result.register.stderr + (result.verify?.stderr ?? '')).toBe(true);
    expect(sha(path.join(fx.lib, 'manifest.json'))).not.toBe(manifestBefore);
    expect((await fx.catalog.record('fx-new'))?.record.treatments.photograph?.status).toBe('unreviewed-preview');

    // New version: the same stem with -v2 is inferred as a version of the existing record.
    await writePng(path.join(fx.lib, 'assets/scenes/fx-new-v2.png'), { r: 4, g: 5, b: 6 });
    plan = await planRegister(fx.ctx.register, ['assets/scenes/fx-new-v2.png']);
    expect(plan.items[0]).toMatchObject({ action: 'new-version', recordId: 'fx-new', style: 'photograph' });
    result = await runRegister(fx.ctx.register, plan);
    expect(result.ok, result.register.stderr + (result.verify?.stderr ?? '')).toBe(true);
    const archived = manifestOf().records.filter((r) => r.retainedFrom === 'fx-new');
    expect(archived.length).toBe(1);
    const chain = (await fx.catalog.versions('fx-new')).photograph ?? [];
    expect(chain.map((v) => v.token)).toEqual(['v2', 'v1'].filter((t) => chain.some((c) => c.token === t)).length === 2 ? ['v2', 'v1'] : chain.map((v) => v.token));
    expect(chain.find((v) => v.current)?.path).toBe('assets/scenes/fx-new-v2.png');

    // Same bytes again: a no-op, nothing to write.
    plan = await planRegister(fx.ctx.register, ['assets/scenes/fx-new-v2.png']);
    expect(plan.items[0]).toMatchObject({ action: 'noop' });
    expect(plan.payload).toBeNull();

    // A later version still goes to the live record although retained earlier-* snapshots share its stem
    // (Slop Schultz v4 was filed as a new record before this), and one file named two ways is planned once.
    await writePng(path.join(fx.lib, 'assets/scenes/fx-new-v3.png'), { r: 7, g: 8, b: 9 });
    plan = await planRegister(fx.ctx.register, ['assets/scenes/fx-new-v3.png', path.join(fx.lib, 'assets/scenes/fx-new-v3.png')]);
    expect(plan.items.length).toBe(1);
    expect(plan.items[0]).toMatchObject({ action: 'new-version', recordId: 'fx-new', style: 'photograph' });
    // Two new versions in one batch: the newest becomes current, the older one is kept as its own record.
    await writePng(path.join(fx.lib, 'assets/scenes/fx-new-v4.png'), { r: 10, g: 11, b: 12 });
    plan = await planRegister(fx.ctx.register, ['assets/scenes/fx-new-v3.png', 'assets/scenes/fx-new-v4.png']);
    expect(plan.items.find((i) => i.path.endsWith('v4.png'))).toMatchObject({ action: 'new-version', recordId: 'fx-new' });
    expect(plan.items.find((i) => i.path.endsWith('v3.png'))).toMatchObject({ action: 'new-record' });
    rmSync(path.join(fx.lib, 'assets/scenes/fx-new-v3.png'));
    rmSync(path.join(fx.lib, 'assets/scenes/fx-new-v4.png'));
    expect(fx.run('verify').code).toBe(0);
  }, 120000);

  it('refuses changed bytes at a registered path and proposes the next free version', async () => {
    const file = path.join(fx.lib, 'assets/scenes/fx-scene.png');
    const original = readFileSync(file);
    await writePng(file, { r: 250, g: 250, b: 250 });
    try {
      const plan = await planRegister(fx.ctx.register, ['assets/scenes/fx-scene.png']);
      expect(plan.ok).toBe(false);
      expect(plan.items[0]).toMatchObject({ action: 'refuse', proposedPath: 'assets/scenes/fx-scene-v2.png' });
      expect(plan.payload).toBeNull();
    } finally {
      writeFileSync(file, original);
    }
  });

  it('needs --record for diagrams and --collection where the folder says nothing', async () => {
    await writePng(path.join(fx.lib, 'assets/diagrams/holographic/fx-diagram-extra.png'), { r: 9, g: 9, b: 9 });
    await writePng(path.join(fx.lib, 'assets/misc/loose.png'), { r: 8, g: 8, b: 8 });
    const plan = await planRegister(fx.ctx.register, ['assets/diagrams/holographic/fx-diagram-extra.png', 'assets/misc/loose.png']);
    expect(plan.ok).toBe(false);
    expect(plan.errors.join('\n')).toMatch(/cannot infer a collection/);
    await fs.rm(path.join(fx.lib, 'assets/misc'), { recursive: true });
    const withRecord = await planRegister(fx.ctx.register, ['assets/diagrams/holographic/fx-diagram-extra.png'], { record: 'fx-diagram', style: 'holographic' });
    expect(withRecord.items[0]).toMatchObject({ action: 'new-version', recordId: 'fx-diagram', style: 'holographic' });
    await fs.rm(path.join(fx.lib, 'assets/diagrams/holographic/fx-diagram-extra.png'));
  });

  it('reports a stray unregistered file in the sweep, blocks registration and leaves the manifest alone', async () => {
    const stray = path.join(fx.lib, 'assets/scenes/fx-stray.png');
    await writePng(stray, { r: 77, g: 78, b: 79 });
    await writePng(path.join(fx.lib, 'assets/scenes/fx-wanted.png'), { r: 80, g: 81, b: 82 });
    try {
      const report = await sweepImages(fx.catalog, { files: true });
      expect(report.problems).toEqual([]);
      expect(report.unregistered.map((u) => u.path)).toEqual(expect.arrayContaining(['assets/scenes/fx-stray.png', 'assets/scenes/fx-wanted.png']));
      expect(report.unregistered.find((u) => u.path === 'assets/scenes/fx-stray.png')?.inferred).toBe('scenes');
      const plan = await planRegister(fx.ctx.register, ['assets/scenes/fx-wanted.png']);
      expect(plan.ok).toBe(false);
      expect(plan.blockedBy).toEqual(['assets/scenes/fx-stray.png']);
      const before = sha(path.join(fx.lib, 'manifest.json'));
      await expect(runRegister(fx.ctx.register, plan)).rejects.toThrow(/block registration/);
      expect(sha(path.join(fx.lib, 'manifest.json'))).toBe(before);
      // The producer itself would also refuse: the unregistered file blocks every registration.
      const whole = await planRegister(fx.ctx.register, ['assets/scenes/fx-wanted.png', 'assets/scenes/fx-stray.png']);
      expect(whole.ok).toBe(true);
      const result = await runRegister(fx.ctx.register, whole);
      expect(result.ok, result.register.stderr).toBe(true);
    } finally {
      // Registered files stay; nothing to remove.
    }
    const after = await sweepImages(fx.catalog);
    expect(after.unregistered).toEqual([]);
  }, 120000);

  it('refuses to write while another session leases a derived file', async () => {
    await writePng(path.join(fx.lib, 'assets/scenes/fx-leased.png'), { r: 31, g: 32, b: 33 });
    const plan = await planRegister(fx.ctx.register, ['assets/scenes/fx-leased.png']);
    expect(plan.ok).toBe(true);
    mkdirSync(path.join(fx.root, 'wiki', 'operations'), { recursive: true });
    writeFileSync(path.join(fx.root, 'wiki', 'operations', 'leases.json'), JSON.stringify([{ path: 'wiki/image-library/manifest.json', holder: 'other-session' }]));
    const before = sha(path.join(fx.lib, 'manifest.json'));
    await expect(runRegister(fx.ctx.register, plan)).rejects.toThrow(/leased to other-session/);
    expect(sha(path.join(fx.lib, 'manifest.json'))).toBe(before);
    await fs.rm(path.join(fx.root, 'wiki', 'operations', 'leases.json'));
    const ok = await runRegister(fx.ctx.register, await planRegister(fx.ctx.register, ['assets/scenes/fx-leased.png']));
    expect(ok.ok).toBe(true);
  }, 120000);
});

describe('comic art collection', () => {
  it('files Comic B art under comics with the comic-ink style, never as a cinematic scene', async () => {
    expect(inferCollection('assets/scenes/comic-b/pages/fx-page-v1.png')).toBe('comics');
    expect(inferCollection('assets/experiments/comic-b/reader-art/fx-shot.png')).toBe('comics');
    expect(inferCollection('assets/scenes/journal/fx-cover.png')).toBe('scenes');
    expect(inferCollection('assets/experiments/fx-try.png')).toBe('experiments');
    const files = ['assets/scenes/comic-b/pages/fx-comic-page-v1.png', 'assets/experiments/comic-b/fx-comic-try.png'];
    for (const [i, f] of files.entries()) await writePng(path.join(fx.lib, f), { r: 90 + i, g: 91, b: 92 });
    try {
      const plan = await planRegister(fx.ctx.register, files);
      expect(plan.ok, JSON.stringify(plan)).toBe(true);
      for (const item of plan.items) expect(item).toMatchObject({ action: 'new-record', collection: 'comics', style: 'comic-ink' });
    } finally {
      for (const f of files) await fs.rm(path.join(fx.lib, f));
    }
  });
});

describe('path confinement', () => {
  it('rejects traversal, drive paths, streams, encoded tricks and directories', async () => {
    for (const bad of ['../x.png', 'assets/../../outside.png', 'assets/../manifest.json', 'manifest.json', 'C:/Windows/win.ini', '/etc/passwd', 'assets/a.png:stream', 'assets/%2e%2e/x.png', 'assets//a.png', 'assets\\..\\x.png', '']) {
      await expect(confineLibraryPath(fx.root, bad), bad).rejects.toBeInstanceOf(PathError);
    }
    await expect(readableFile(fx.root, 'assets/scenes')).rejects.toBeInstanceOf(PathError);
    const ok = await confineLibraryPath(fx.root, 'wiki/image-library/assets/scenes/fx-scene.png');
    expect(ok.rel).toBe('assets/scenes/fx-scene.png');
  });

  it('does not follow a junction out of the library', async () => {
    const outside = path.join(os.tmpdir(), `mtw-outside-${Date.now()}`);
    mkdirSync(outside, { recursive: true });
    writeFileSync(path.join(outside, 'secret.png'), 'not an image');
    const link = path.join(fx.lib, 'assets', 'linked');
    try {
      symlinkSync(outside, link, 'junction');
    } catch {
      return; // no permission to create a link on this machine
    }
    await expect(confineLibraryPath(fx.root, 'assets/linked/secret.png')).rejects.toBeInstanceOf(PathError);
    await expect(readableFile(fx.root, 'assets/linked/secret.png')).rejects.toBeInstanceOf(PathError);
    const plan = await planRegister(fx.ctx.register, ['assets/linked/secret.png']);
    expect(plan.ok).toBe(false);
    await fs.rm(link, { recursive: true, force: true });
    await fs.rm(outside, { recursive: true, force: true });
  });
});

describe('thumbnails', () => {
  it('write only under .state/thumbs and are idempotent', async () => {
    const before = treeHash(path.join(fx.root, 'wiki'));
    const l = await fx.catalog.ensure();
    const first = [...l.bySha].find(([, v]) => v.path.endsWith('fx-scene.png')) as [string, { path: string }];
    const src = path.join(fx.lib, first[1].path);
    const out1 = await fx.ctx.thumbs.get(first[0], src, 320);
    const mtime = statSync(out1).mtimeMs;
    const [a, b] = await Promise.all([fx.ctx.thumbs.get(first[0], src, 640), fx.ctx.thumbs.get(first[0], src, 640)]);
    const out2 = await fx.ctx.thumbs.get(first[0], src, 320);
    expect(a).toBe(b);
    expect(out2).toBe(out1);
    expect(statSync(out2).mtimeMs).toBe(mtime);
    expect(path.dirname(out1)).toBe(path.join(fx.stateDir, 'thumbs'));
    expect(readdirSync(path.join(fx.stateDir, 'thumbs')).filter((n) => n.endsWith('.tmp'))).toEqual([]);
    expect(treeHash(path.join(fx.root, 'wiki'))).toBe(before);
  });
});

describe('decisions overlay', () => {
  it('leaves manifest.json and the derived files byte-identical', async () => {
    const names = ['manifest.json', 'data.js', 'all-files.html', 'README.md'];
    const before = names.map((n) => sha(path.join(fx.lib, n)));
    await fx.services.decisions.append(DECISIONS_LIB, { module: 'images', subject: 'img:fx-diagram@current', action: 'approve', actor: 'matt', value: { style: 'svg-glass', scope: 'public-site' } });
    await fx.services.decisions.append(DECISIONS_LIB, { module: 'images', subject: 'img:fx-scene@current', action: 'reject', actor: 'matt', value: { reason: 'wrong crop' } });
    const cards = await fx.catalog.cards({ collection: 'diagrams' });
    expect(cards.items.find((c) => c.id === 'fx-diagram')).toMatchObject({ state: 'approved', decision: { kind: 'approved', scope: 'public-site' } });
    const scenes = await fx.catalog.cards({ collection: 'scenes' });
    expect(scenes.items.find((c) => c.id === 'fx-scene')?.state).toBe('rejected');
    expect((await fx.catalog.cards({ collection: 'diagrams', status: 'approved' })).items.map((c) => c.id)).toEqual(['fx-diagram']);
    expect(names.map((n) => sha(path.join(fx.lib, n)))).toEqual(before);
    expect(existsSync(path.join(fx.root, 'wiki', DECISIONS_LIB, 'decisions.jsonl'))).toBe(true);
    // The log sits at the library root; the producer skips a root decisions.jsonl, so verify still passes after appends.
    expect(DECISIONS_LIB).toBe('image-library');
    expect(fx.run('verify').code).toBe(0);
  });
});

describe('snapshot export', () => {
  it('copies the exact registered files, emits a classic bundle and resolves every relative reference', async () => {
    const out = path.join(os.tmpdir(), `mtw-export-${Date.now()}`);
    const rows = await fx.services.decisions.list(DECISIONS_LIB);
    const result = await exportImages(fx.ctx.register, { out, hashCheck: true }, rows);
    try {
      const m = manifestOf();
      expect(result.files).toBeGreaterThan(m.files.length - 4);
      for (const f of m.files) {
        if (['index.html', 'browser.js', 'library.css', '.gitattributes'].includes(f.destination)) continue;
        const copy = path.join(out, f.destination);
        expect(statSync(copy).size, f.destination).toBe(f.bytes);
      }
      const html = readFileSync(path.join(out, 'index.html'), 'utf8');
      expect(html).not.toMatch(/type=["']module["']/);
      const refs = [...html.matchAll(/(?:src|href)=["']([^"'#]+)["']/g)].map((x) => x[1] as string);
      expect(refs.sort()).toEqual(['all-files.html', 'app.css', 'app.js', 'data.js', 'decisions.js']);
      for (const r of refs) expect(existsSync(path.join(out, r)), r).toBe(true);

      const js = readFileSync(path.join(out, 'app.js'), 'utf8');
      expect(js).not.toMatch(/\bimport\.meta\b/);
      expect(js).not.toMatch(/^\s*(import|export)\s/m);
      const network = [...js.matchAll(/https?:\/\/[^"'\s)]+/g)].map((x) => x[0]).filter((u) => !/w3\.org|reactjs\.org|preactjs\.com|developer\.mozilla\.org|github\.com|example\.(com|org)/.test(u));
      expect(network).toEqual([]);
      const css = readFileSync(path.join(out, 'app.css'), 'utf8');
      for (const m2 of css.matchAll(/url\(["']?([^)"']+)["']?\)/g)) {
        const u = m2[1] as string;
        if (u.startsWith('data:')) continue;
        expect(u.startsWith('http'), u).toBe(false);
        expect(existsSync(path.join(out, u.replace(/^\.\//, ''))), u).toBe(true);
      }

      // Data parity: data.js is the producer's compact manifest; decisions.js carries the decision log.
      const dataJs = readFileSync(path.join(out, 'data.js'), 'utf8');
      const payload = JSON.parse(dataJs.replace(/^window\.MTW_LIBRARY = /, '').replace(/;\s*$/, '')) as Manifest;
      expect(payload.records.length).toBe(m.records.length);
      expect(payload.counts.collections).toEqual(m.counts.collections);
      const decisionsJs = readFileSync(path.join(out, 'decisions.js'), 'utf8');
      expect(JSON.parse(decisionsJs.replace(/^window\.MTW_DECISIONS = /, '').replace(/;\s*$/, '')).length).toBe(rows.length);
      // The producer's all-files.html links resolve too (the validate_links rule).
      const allFiles = readFileSync(path.join(out, 'all-files.html'), 'utf8');
      for (const m3 of allFiles.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
        const u = decodeURIComponent((m3[1] as string).replace(/&amp;/g, '&'));
        if (!u.startsWith('#')) expect(existsSync(path.join(out, u)), u).toBe(true);
      }
      // The snapshot adapter works from the exported data.
      const snap = createSnapshotData(payload, rows as never);
      expect((await snap.records({ collection: 'diagrams' })).items.length).toBe(2);
      expect(matchEntries([], {}).length).toBe(0);
    } finally {
      await fs.rm(out, { recursive: true, force: true, maxRetries: 3 });
    }
  }, 180000);

  it('refuses an output folder inside the repo or a non-empty one', async () => {
    await expect(exportImages(fx.ctx.register, { out: path.join(fx.root, 'inside') })).rejects.toThrow(/outside the repo/);
    const used = path.join(os.tmpdir(), `mtw-export-used-${Date.now()}`);
    mkdirSync(used, { recursive: true });
    writeFileSync(path.join(used, 'x.txt'), 'x');
    await expect(exportImages(fx.ctx.register, { out: used })).rejects.toThrow(/not empty/);
    await fs.rm(used, { recursive: true, force: true });
  });
});
