// Images Remove (server/remove.ts): archive outside the repo, verify sha256, delete, drop from the catalog through the
// producer; in-use files are kept with a reason. Temp repo fixture; most cases fake the producer call, and one runs the
// real maintain_library.py `remove` end to end on the fixture library.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { planRemove, producerHasRemove, runRemove } from '../modules/images/server/remove';
import type { RemoveContext } from '../modules/images/server/remove';
import { DECISIONS_LIB } from '../modules/images/shared/types';
import { HELPER, makeFixture, writePng } from './images-fixture';
import type { Fixture } from './images-fixture';

let fx: Fixture;
let archive: string;
let calls: { cmd: string; args: string[] }[];
let producerCode: number;

const sha = (file: string): string => createHash('sha256').update(readFileSync(file)).digest('hex');
const put = (rel: string, text: string): void => {
  const abs = path.join(fx.root, rel);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, text);
};

/** Remove context over the fixture: no producer is running, the producer has `remove`, and calls are recorded. */
function ctx(over: Partial<RemoveContext> = {}): RemoveContext {
  return {
    ...fx.ctx.remove,
    producerRuns: async () => [],
    catalogRemovable: async () => true,
    runProducer: async (cmd, args) => {
      calls.push({ cmd, args });
      return { code: producerCode, stdout: '', stderr: producerCode ? 'refused' : '' };
    },
    ...over,
  };
}

beforeEach(async () => {
  fx = await makeFixture();
  archive = mkdtempSync(path.join(os.tmpdir(), 'mtw-archive-'));
  put('wiki/operations/storage/config.json', JSON.stringify({ archiveRoot: archive }));
  calls = [];
  producerCode = 0;
}, 60000);
afterEach(() => {
  fx.cleanup();
  rmSync(archive, { recursive: true, force: true, maxRetries: 3 });
});

describe('Images Remove', () => {
  it('archives, verifies and deletes a record file, then asks the producer to drop it and logs one decision', async () => {
    const src = path.join(fx.lib, 'assets/experiments/fx-exp.png');
    const before = sha(src);
    const plan = await planRemove(ctx(), { ids: ['fx-exp'] });
    expect(plan.blocked).toBeNull();
    expect(plan.remove).toBe(1);
    expect(plan.removeBytes).toBeGreaterThan(0);
    const res = await runRemove(ctx(), { ids: ['fx-exp'] }, plan.etag);
    expect(res.ok).toBe(true);
    expect(res.removed).toBe(1);
    expect(existsSync(src)).toBe(false);
    const copy = path.join(plan.archiveDir, 'wiki/image-library/assets/experiments/fx-exp.png');
    expect(path.relative(fx.root, plan.archiveDir).startsWith('..')).toBe(true);
    expect(sha(copy)).toBe(before);
    const record = JSON.parse(readFileSync(res.archiveRecord as string, 'utf8'));
    expect(record.files[0]).toMatchObject({ path: 'assets/experiments/fx-exp.png', sha256: before, recordIds: ['fx-exp'], status: 'removed' });
    expect(calls.map((c) => c.args[1])).toEqual(['remove', 'verify']);
    const payload = JSON.parse(readFileSync(calls[0]?.args[calls[0].args.indexOf('--payload') + 1] as string, 'utf8'));
    expect(payload.remove[0]).toMatchObject({ path: 'assets/experiments/fx-exp.png', recordIds: ['fx-exp'] });
    const decisions = await fx.services.decisions.list(DECISIONS_LIB);
    const last = decisions.filter((d) => d.action === 'remove');
    expect(last).toHaveLength(1);
    expect(last[0]?.value).toMatchObject({ files: 1, paths: ['assets/experiments/fx-exp.png'] });
  });

  it('keeps files in use and says why, without failing the rest of the batch', async () => {
    put('site/public/images/scenes/fx-scene-1600.webp', 'site copy');
    put('site/src/data/comic-stories/fx.ts', 'export const fx = { src: "/comic/fx/fx-diagram-1600.png" };\n');
    put('wiki/site/fx-notes.md', 'See `assets/experiments/fx-exp.png`.\n');
    const plan = await planRemove(ctx(), { ids: ['fx-scene', 'fx-original', 'fx-exp', 'fx-diagram-b'], paths: ['assets/diagrams/holographic/fx-diagram.png'] });
    const why = Object.fromEntries(plan.items.map((i) => [i.path, i.action === 'keep' ? i.reason : 'remove']));
    expect(why['assets/scenes/fx-scene.png']).toMatch(/website has a copy/);
    expect(why['assets/originals/fx-original.png']).toMatch(/selected or approved/);
    expect(why['assets/experiments/fx-exp.png']).toMatch(/wiki\/site\/fx-notes\.md/);
    expect(why['assets/diagrams/holographic/fx-diagram.png']).toMatch(/comic-stories\/fx\.ts/);
    expect(why['assets/vector/diagrams/svg-flat/fx-diagram-b.svg']).toBe('remove');
    expect(plan.remove).toBe(2);
    const res = await runRemove(ctx(), { ids: ['fx-scene', 'fx-original', 'fx-exp', 'fx-diagram-b'] });
    expect(res.removed).toBe(2);
    expect(res.kept.length).toBe(3);
    expect(existsSync(path.join(fx.lib, 'assets/scenes/fx-scene.png'))).toBe(true);
    expect(existsSync(path.join(fx.lib, 'assets/vector/diagrams/svg-flat/fx-diagram-b.svg'))).toBe(false);
  });

  it('removes all rejected files (manifest status or Matt\'s Studio rejection) through the same path', async () => {
    await fx.services.decisions.append(DECISIONS_LIB, { module: 'images', subject: 'img:fx-scene@current', action: 'reject', actor: 'matt', value: { style: 'photograph', reason: 'not needed' } });
    const plan = await planRemove(ctx(), { rejected: true });
    expect(plan.items.map((i) => `${i.path}:${i.action}`)).toEqual(['assets/scenes/fx-scene.png:remove']);
    const res = await runRemove(ctx(), { rejected: true });
    expect(res.removed).toBe(1);
    expect(existsSync(path.join(fx.lib, 'assets/scenes/fx-scene.png'))).toBe(false);
  });

  it('keeps the source when the archive copy does not match its sha256', async () => {
    const src = path.join(fx.lib, 'assets/experiments/fx-exp.png');
    const before = sha(src);
    const bad = ctx({ copyFile: async (_from, to) => writeFileSync(to, 'corrupt') });
    const res = await runRemove(bad, { ids: ['fx-exp'] });
    expect(res.ok).toBe(false);
    expect(res.removed).toBe(0);
    expect(res.failed[0]?.error).toMatch(/did not match/);
    expect(sha(src)).toBe(before);
    expect(existsSync(path.join(res.archiveDir, 'wiki/image-library/assets/experiments/fx-exp.png'))).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it('restores every deleted source when the producer refuses', async () => {
    producerCode = 1;
    const src = path.join(fx.lib, 'assets/experiments/fx-exp.png');
    const before = sha(src);
    const res = await runRemove(ctx(), { ids: ['fx-exp'] });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/restored/);
    expect(sha(src)).toBe(before);
    expect(JSON.parse(readFileSync(res.archiveRecord as string, 'utf8')).files[0].status).toBe('restored');
  });

  it('drops registered files through the real producer remove operation end to end, then verify passes', async () => {
    expect(producerHasRemove(HELPER)).toBe(true);
    await writePng(path.join(fx.lib, 'assets/experiments/stray.png'), { r: 1, g: 2, b: 3 });
    const real: RemoveContext = { ...fx.ctx.remove, helper: HELPER, producerRuns: async () => [] };
    const plan = await planRemove(real, { ids: ['fx-exp'], paths: ['assets/experiments/stray.png'] });
    expect(plan.catalogRemovable).toBe(true);
    expect(plan.remove).toBe(2);
    const res = await runRemove(real, { ids: ['fx-exp'], paths: ['assets/experiments/stray.png'] }, plan.etag);
    expect(res.error, JSON.stringify(res.producer)).toBeUndefined();
    expect(res.ok).toBe(true);
    expect(res.removed).toBe(2);
    expect(res.producer?.code).toBe(0);
    expect(res.verify?.code).toBe(0);
    expect(existsSync(path.join(fx.lib, 'assets/experiments/fx-exp.png'))).toBe(false);
    const manifest = JSON.parse(readFileSync(path.join(fx.lib, 'manifest.json'), 'utf8'));
    expect(manifest.records.some((r: { id: string }) => r.id === 'fx-exp')).toBe(false);
    expect(manifest.files.some((f: { destination: string }) => f.destination === 'assets/experiments/fx-exp.png')).toBe(false);
    expect(fx.run('verify').code).toBe(0);
  }, 60000);

  it('refuses the whole batch while maintain_library.py runs or a lease covers the library', async () => {
    const busy = await planRemove(ctx({ producerRuns: async () => [4242] }), { ids: ['fx-exp'] });
    expect(busy.blocked).toMatch(/4242/);
    const res = await runRemove(ctx({ producerRuns: async () => [4242] }), { ids: ['fx-exp'] });
    expect(res.removed).toBe(0);
    expect(existsSync(path.join(fx.lib, 'assets/experiments/fx-exp.png'))).toBe(true);
    put('wiki/operations/leases.json', JSON.stringify([{ path: 'wiki/image-library/**', holder: 'peer-session' }]));
    const leased = await planRemove(ctx(), { ids: ['fx-exp'] });
    expect(leased.blocked).toMatch(/peer-session/);
  });
});
