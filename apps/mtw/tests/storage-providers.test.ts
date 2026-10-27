import { createHash } from 'node:crypto';
import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { audioCandidates } from '../modules/storage/providers/audio';
import { comicsPublishedIssue, pageKey, parseVersioned } from '../modules/storage/providers/comics';
import { makeContext } from '../modules/storage/providers/context';
import { integrationDerivatives } from '../modules/storage/providers/derivatives';
import { imageEvidence } from '../modules/storage/providers/evidence';
import { parseCountObjects } from '../modules/storage/scan';
import { makeRepo, NOW } from './storage-fixture';

let root: string;
beforeAll(async () => {
  root = await makeRepo();
});
afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

const IL = 'wiki/image-library';
const paths = (p: { files: { path: string }[] }): string[] => p.files.map((f) => f.path.replace(`${IL}/`, '')).sort();

describe('page naming', () => {
  it('parses version and print variants and normalises the page key', () => {
    expect(parseVersioned('home-p1-v8.png')).toEqual({ stem: 'home-p1', version: 8, print: false });
    expect(parseVersioned('x-y-20261008-v1-print.png')).toEqual({ stem: 'x-y-20261008', version: 1, print: true });
    expect(parseVersioned('notes.txt')).toBeNull();
    expect(pageKey('agentic-restore-20261010-device')).toBe('agentic-restore');
    expect(pageKey('agentic-restore-20261008')).toBe('agentic-restore');
    expect(pageKey('home-p1')).toBe('home-p1');
  });
});

describe('comics-published-issue', () => {
  it('lists the issues the site stories name', async () => {
    const t = await comicsPublishedIssue.targets(makeContext(root));
    expect(t.map((x) => x.id)).toEqual(['bar', 'foo']);
  });

  it('plans superseded versions, their evidence, rejected candidates and issue screenshots, and keeps the used art', async () => {
    const plan = await comicsPublishedIssue.plan('foo', makeContext(root, { hash: true }));
    expect(paths(plan)).toEqual([
      'assets/experiments/comic-b/reader-art/baseline-01/foo-systems-desktop-0-0.png',
      'assets/scenes/comic-b/pages/foo-page-20261008-v1-print.png',
      'assets/scenes/comic-b/pages/foo-page-20261008-v1.png',
      'assets/scenes/comic-b/pages/foo-rejected-v1.png',
      'records/comic-b-foo-page-20261008/comic-ink/v1/brief.json',
    ]);
    // kept: registered v2, the site's v3 and the single-version page; the other issue is untouched
    const all = paths(plan).join('\n');
    expect(all).not.toContain('v2.png');
    expect(all).not.toContain('v3');
    expect(all).not.toContain('foo-two');
    expect(all).not.toContain('bar-');
  });

  it('leaves out a screenshot a wiki page names and says why', async () => {
    const plan = await comicsPublishedIssue.plan('foo', makeContext(root));
    expect(paths(plan)).not.toContain('assets/experiments/comic-b/reader-art/baseline-01/foo-systems-phone-0-0.png');
    expect(plan.skipped.find((s) => s.path.endsWith('foo-systems-phone-0-0.png'))?.reason).toContain('wiki/site/comic-notes.md');
  });

  it('records real bytes and sha256 from the files, and totals the savings', async () => {
    const plan = await comicsPublishedIssue.plan('foo', makeContext(root, { hash: true }));
    for (const f of plan.files) {
      const body = await readFile(path.join(root, f.path));
      expect(f.bytes).toBe(body.length);
      expect(f.sha256).toBe(createHash('sha256').update(body).digest('hex'));
      expect(f.action).toBe('archive');
      expect(f.reason.length).toBeGreaterThan(5);
    }
    expect(plan.savings).toBe(plan.files.reduce((s, f) => s + f.bytes, 0));
  });

  it('plans nothing when no version is superseded', async () => {
    const plan = await comicsPublishedIssue.plan('bar', makeContext(root));
    expect(paths(plan)).toEqual(['assets/experiments/comic-b/reader-art/baseline-01/bar-systems-desktop-0-0.png', 'assets/scenes/comic-b/pages/bar-one-20261008-v1.png']);
  });
});

describe('image-evidence', () => {
  it('plans old unreferenced evidence only', async () => {
    const ctx = makeContext(root, { params: { days: 30 }, now: NOW });
    const targets = await imageEvidence.targets(ctx);
    expect(targets.map((t) => t.id)).toEqual(['records/site-glass-run-20260101']);
    const plan = await imageEvidence.plan('records/site-glass-run-20260101', ctx);
    expect(paths(plan)).toEqual(['records/site-glass-run-20260101/shot-old.png']);
    expect(plan.files[0]?.reason).toContain('path date');
    expect(plan.skipped.some((s) => s.path.endsWith('shot-named.png') && s.reason.includes('evidence-notes.md'))).toBe(true);
  });

  it('honours the day threshold and never touches relocated legacy inputs', async () => {
    const strict = makeContext(root, { params: { days: 100000 }, now: NOW });
    expect(await imageEvidence.targets(strict)).toEqual([]);
    const loose = makeContext(root, { params: { days: 0 }, now: NOW });
    const ids = (await imageEvidence.targets(loose)).map((t) => t.id);
    expect(ids).toContain('records/site-glass-run-20261009');
    expect(ids.join()).not.toContain('discussion-relocation');
  });
});

describe('integration-derivatives', () => {
  it('reports regenerable sizes and is report only', async () => {
    expect(integrationDerivatives.reportOnly).toBe(true);
    const ctx = makeContext(root, { hash: true });
    expect((await integrationDerivatives.targets(ctx)).map((t) => t.id)).toEqual(['foo']);
    const plan = await integrationDerivatives.plan('foo', ctx);
    expect(plan.files.map((f) => path.basename(f.path)).sort()).toEqual(['foo-page-20261009-device-v3-1600.avif', 'foo-page-20261009-device-v3-1600.webp', 'foo-page-20261009-device-v3-3200.avif']);
    expect(plan.files.every((f) => f.action === 'delete-derivative' && f.regenerable === true && f.sha256.length === 64)).toBe(true);
    expect(plan.savings).toBe(6000);
  });

  it('rejects a path-like target', async () => {
    await expect(integrationDerivatives.plan('../x', makeContext(root))).rejects.toThrow();
  });
});

describe('audio-candidates', () => {
  it('plans withdrawn tracks and candidates older than the threshold; spares approved, used and highly rated tracks', async () => {
    const plan = await audioCandidates.plan('candidates', makeContext(root, { params: { days: 30 }, now: NOW }));
    expect(plan.files.map((f) => path.basename(f.path)).sort()).toEqual(['b.mp3', 'c.mp3']);
    expect(plan.skipped.map((s) => path.basename(s.path)).sort()).toEqual(['e.mp3', 'f.mp3']);
    expect(plan.savings).toBe(2000);
  });

  it('a short threshold also takes the recent candidate', async () => {
    const plan = await audioCandidates.plan('candidates', makeContext(root, { params: { days: 1 }, now: NOW }));
    expect(plan.files.map((f) => path.basename(f.path)).sort()).toEqual(['b.mp3', 'c.mp3', 'd.mp3']);
  });
});

describe('git footprint', () => {
  it('parses git count-objects -v', () => {
    const g = parseCountObjects('count: 211\nsize: 1280\nin-pack: 40397\npacks: 4\nsize-pack: 4875264\nprune-packable: 0\ngarbage: 0\nsize-garbage: 0\n');
    expect(g.packBytes).toBe(4875264 * 1024);
    expect(g.packs).toBe(4);
    expect(g.objects).toBe(40608);
  });
});
