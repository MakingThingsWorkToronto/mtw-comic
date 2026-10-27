// Asset health providers: duplicates, orphans, older image versions, oversized rasters, the hash cache and the code report.
import { access, mkdtemp, readFile, rm, utimes, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FileDecisionLog } from '../server/core/decisions';
import { FileWikiStore } from '../server/core/wiki-store';
import { StoragePlans } from '../modules/storage/plans';
import type { Services } from '../modules/types';
import { makeContext } from '../modules/storage/providers/context';
import { duplicates, sizeCollisions } from '../modules/storage/providers/duplicates';
import { Hasher } from '../modules/storage/providers/hasher';
import { orphans } from '../modules/storage/providers/orphans';
import { oversizedOriginals, replacedOriginals } from '../modules/storage/providers/oversized';
import { providers } from '../modules/storage/providers/registry';
import { imageVersions } from '../modules/storage/providers/versions';
import { codeReport, computeReductions } from '../modules/storage/scan';
import { addAssetHealth, makeRepo } from './storage-fixture';

let root: string;
let state: string;
const IL = 'wiki/image-library/';

/** A context whose hash cache is private to this test run. */
const ctxOf = (opts: { hash?: boolean; params?: Record<string, number> } = {}) => makeContext(root, { ...opts, stateDir: state });
const rels = (p: { files: { path: string }[] }): string[] => p.files.map((f) => f.path).sort();

beforeAll(async () => {
  root = await makeRepo();
  await addAssetHealth(root);
  state = await mkdtemp(path.join(os.tmpdir(), 'mtw-storage-state-'));
});
afterAll(async () => {
  await rm(root, { recursive: true, force: true });
  await rm(state, { recursive: true, force: true });
});

describe('hash cache', () => {
  it('reuses a hash while path, size and time are unchanged and rehashes when they change', async () => {
    const abs = path.join(root, 'cache-probe.bin');
    await writeFile(abs, 'one');
    const stamp = new Date('2026-01-01T00:00:00Z');
    await utimes(abs, stamp, stamp);
    const file = path.join(state, 'probe', 'hashes.json');
    const a = new Hasher(file);
    const t = { rel: 'cache-probe.bin', abs, size: 3, mtimeMs: stamp.getTime() };
    expect(await a.cached(t)).toBeNull();
    const sha = await a.sha(t);
    await a.flush();
    const b = new Hasher(file);
    expect(await b.cached(t)).toBe(sha);
    expect(await b.cached({ ...t, mtimeMs: t.mtimeMs + 1000 })).toBeNull();
    expect(await b.cached({ ...t, size: 4 })).toBeNull();
  });

  it('hashes lazily with progress and only what is not cached', async () => {
    const h = new Hasher(path.join(state, 'lazy', 'hashes.json'));
    const files = await sizeCollisions(ctxOf());
    expect(files.length).toBeGreaterThan(2);
    const targets = files.map((f) => ({ rel: f.rel, abs: f.abs, size: f.size, mtimeMs: f.mtimeMs }));
    await h.ensure(targets);
    expect(h.progress).toEqual({ running: false, done: targets.length, total: targets.length });
    await h.ensure(targets);
    expect(h.progress.total).toBe(0);
  });
});

describe('duplicates', () => {
  it('reports unchecked files as pending until their hashes exist, then finds the groups', async () => {
    const lazy = await mkdtemp(path.join(os.tmpdir(), 'mtw-storage-lazy-'));
    try {
      const ctx = makeContext(root, { stateDir: lazy });
      const before = await duplicates.plan('images', ctx);
      expect(before.files).toEqual([]);
      expect(before.pending).toBeGreaterThan(0);
      const files = await sizeCollisions(ctx);
      await ctx.hasher.ensure(files.map((f) => ({ rel: f.rel, abs: f.abs, size: f.size, mtimeMs: f.mtimeMs })));
      const after = await duplicates.plan('images', makeContext(root, { stateDir: lazy }));
      expect(after.pending).toBe(0);
      expect(rels(after)).toContain(`${IL}assets/dupes/deeper/copy-of-a.png`);
    } finally {
      await rm(lazy, { recursive: true, force: true });
    }
  });

  it('keeps one copy within a library, ignores expected site copies and flags library duplicates across libraries', async () => {
    const ctx = ctxOf({ hash: true });
    const targets = (await duplicates.targets(ctx)).map((t) => `${t.id}:${t.vertical}`);
    expect(targets).toContain('images:images');
    expect(targets).toContain('comics:comics');
    expect(targets).not.toContain('audio:audio');

    const images = await duplicates.plan('images', ctx);
    expect(rels(images)).toContain(`${IL}assets/dupes/deeper/copy-of-a.png`); // longer path of the pair
    expect(rels(images)).not.toContain(`${IL}assets/dupes/a.png`); // the registered, shorter copy is kept
    expect(images.files.find((f) => f.path.endsWith('copy-of-a.png'))?.reason).toMatch(/also at wiki\/image-library\/assets\/dupes\/a\.png/);
    expect(rels(images).some((p) => p.startsWith('site/'))).toBe(false); // site/public/hero.png is an expected copy

    const comics = await duplicates.plan('comics', ctx);
    expect(rels(comics)).toEqual(['wiki/comics-library/assets/sounds/shared-sound.mp3']);
    expect(comics.files[0]?.reason).toMatch(/kept in Audio at wiki\/soundtrack-library\/assets\/shared-sound\.mp3/);
    expect(comics.files[0]?.sha256).toHaveLength(64);
  });

  it('flags a site copy that has no library master and offers to register it, never to archive it', async () => {
    const ctx = ctxOf({ hash: true });
    const site = (await duplicates.targets(ctx)).find((t) => t.id === 'site');
    expect(site?.planless).toBe(true);
    expect(site?.register).toBe(true);
    const plan = await duplicates.plan('site', ctx);
    expect(rels(plan)).toEqual(['site/public/lonely-thing.png']);
    const req = await duplicates.register?.('site', ctx);
    expect(req?.procedure).toBe('images-register');
    expect(req?.paths).toEqual(['site/public/lonely-thing.png']);
  });
});

describe('orphans', () => {
  it('lists files a library catalogue never names, per library', async () => {
    const ctx = ctxOf();
    const ids = (await orphans.targets(ctx)).map((t) => t.id);
    expect(ids).toEqual(expect.arrayContaining(['images', 'audio', 'comics']));
    expect(rels(await orphans.plan('images', ctx))).toContain(`${IL}assets/orphans/loose.png`);
    expect(rels(await orphans.plan('images', ctx))).not.toContain(`${IL}assets/dupes/a.png`); // registered in manifest.json
    expect(rels(await orphans.plan('audio', ctx))).toEqual(expect.arrayContaining(['wiki/soundtrack-library/assets/stray.mp3']));
    expect(rels(await orphans.plan('audio', ctx))).not.toContain('wiki/soundtrack-library/assets/a.mp3'); // named by sources.json
    expect(rels(await orphans.plan('comics', ctx))).toEqual(['wiki/comics-library/assets/sounds/lost.wav']);
  });

  it('can register images and audio with the owning module, but not comics', async () => {
    const ctx = ctxOf();
    const targets = await orphans.targets(ctx);
    expect(targets.find((t) => t.id === 'images')?.register).toBe(true);
    expect(targets.find((t) => t.id === 'audio')?.register).toBe(true);
    expect(targets.find((t) => t.id === 'comics')?.register).toBeUndefined();
    const audio = await orphans.register?.('audio', ctx);
    expect(audio?.procedure).toBe('soundtrack-intake');
    expect(audio?.text(1, 'x.txt')).toMatch(/in place/);
    expect(await orphans.register?.('comics', ctx)).toBeNull();
  });
});

describe('older image versions', () => {
  it('keeps the newest and the selected version and takes the rest, plus unused earlier-* files', async () => {
    const ctx = ctxOf();
    const targets = (await imageVersions.targets(ctx)).map((t) => t.id);
    expect(targets).toContain('assets/diagrams');
    const plan = await imageVersions.plan('assets/diagrams', ctx);
    expect(rels(plan)).toEqual([`${IL}assets/diagrams/box-v1.png`, `${IL}assets/diagrams/earlier-only.png`]);
  });
});

describe('oversized originals', () => {
  it('finds photographic PNGs and files far above their site copy, as transcode actions, and leaves the rest', async () => {
    const ctx = ctxOf({ params: { factor: 2, minMb: 1 } });
    const plan = await oversizedOriginals.plan('images', ctx);
    expect(rels(plan)).toEqual([`${IL}assets/big/photo.png`, `${IL}assets/big/sized-scene-v1.png`]);
    expect(plan.files.every((f) => f.action === 'transcode')).toBe(true);
    expect(plan.files.find((f) => f.path.endsWith('photo.png'))?.reason).toMatch(/PNG photo/);
    expect(plan.files.find((f) => f.path.endsWith('sized-scene-v1.png'))?.reason).toMatch(/7\.5 times the largest site copy/);
  });

  it('honours the size threshold', async () => {
    const plan = await oversizedOriginals.plan('images', ctxOf({ params: { factor: 2, minMb: 3 } }));
    expect(plan.files).toEqual([]);
  });

  it('offers an original for archiving only after its replacement was written by an executed plan', async () => {
    const ctx = ctxOf();
    expect((await replacedOriginals.targets(ctx)).map((t) => t.id)).toEqual(['images']);
    const plan = await replacedOriginals.plan('images', ctx);
    expect(rels(plan)).toEqual([`${IL}assets/done/old-original.png`]);
    expect(plan.files[0]?.action).toBe('archive');
    expect(plan.files[0]?.reason).toMatch(/old-original-v2\.webp/);
  });
});

describe('overview rows', () => {
  it('group by vertical and category, with register only where a procedure exists', async () => {
    const rows = await computeReductions(root, providers, {}, state);
    const key = (r: { vertical: string; category: string; target: string }) => `${r.vertical}/${r.category}/${r.target}`;
    const keys = rows.map(key);
    expect(keys).toEqual(expect.arrayContaining(['images/duplicates/images', 'comics/duplicates/comics', 'site/duplicates/site', 'images/orphans/images', 'audio/orphans/audio', 'images/oversized/images']));
    expect(rows.find((r) => key(r) === 'site/duplicates/site')).toMatchObject({ reportOnly: true, register: true });
    expect(rows.find((r) => key(r) === 'images/orphans/images')).toMatchObject({ reportOnly: false, register: true });
    expect(rows.find((r) => key(r) === 'comics/orphans/comics')?.register).toBeUndefined();
    expect(rows.every((r) => r.files > 0 || r.skipped > 0)).toBe(true);
  });
});

describe('code report', () => {
  it('is information only: counts files, large sources and duplicate script names, ignoring node_modules', async () => {
    const code = await codeReport(root);
    expect(code.large).toEqual([{ path: 'apps/mtw/server/big.ts', lines: 901 }]);
    expect(code.duplicateNames).toEqual([{ name: 'shared-name.mjs', paths: ['apps/mtw/server/shared-name.mjs', 'site/scripts/shared-name.mjs'] }]);
    expect(code.files).toBe(5);
    await expect(access(path.join(root, 'apps/mtw/node_modules/pkg/ignored.ts'))).resolves.toBeUndefined();
  });
});

describe('plans for asset health', () => {
  const launched: { id: string; params: Record<string, string> }[] = [];
  const services = () => {
    const wiki = new FileWikiStore(root);
    return {
      repoRoot: root,
      wiki,
      decisions: new FileDecisionLog(wiki),
      terminals: { list: () => [] },
      operations: {
        launch: async (id: string, params: Record<string, string>) => {
          launched.push({ id, params });
          return { id: `t-${launched.length}` };
        },
      },
    } as unknown as Services;
  };

  it('register hands the file list to the owning procedure and writes the list to a file; it moves nothing', async () => {
    const plans = new StoragePlans(services(), root, state);
    const r = await plans.register({ providerId: 'orphans', target: 'audio' });
    expect(r.files).toBeGreaterThan(0);
    expect(launched.at(-1)?.id).toBe('soundtrack-intake');
    const listFile = /in (\S+\.txt)/.exec(launched.at(-1)?.params.files ?? '')?.[1] ?? '';
    expect(path.isAbsolute(listFile)).toBe(false);
    expect(await readFile(path.join(root, listFile), 'utf8')).toContain('wiki/soundtrack-library/assets/stray.mp3');
    await expect(access(path.join(root, 'wiki/soundtrack-library/assets/stray.mp3'))).resolves.toBeUndefined();
    const log = await readFile(path.join(root, 'wiki/operations/storage/decisions.jsonl'), 'utf8');
    expect(log).toContain('register-files');
  });

  it('a transcode plan runs through its own procedure and cannot be restored; a site-only row cannot be planned', async () => {
    const plans = new StoragePlans(services(), root, state);
    const plan = await plans.create({ providerId: 'oversized-originals', target: 'images', params: { factor: 2, minMb: 1 } });
    expect(plan.files.every((f) => f.action === 'transcode' && f.sha256.length === 64)).toBe(true);
    await plans.approve(plan.id);
    await plans.execute(plan.id);
    expect(launched.at(-1)).toEqual({ id: 'storage-transcode-plan', params: { plan: plan.id } });
    await expect(plans.restore(plan.id)).rejects.toThrow(/only adds new files/);
    await expect(plans.create({ providerId: 'duplicates', target: 'site' })).rejects.toThrow(/register it instead/);
  });
});
