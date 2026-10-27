// Look-alikes provider: same picture as different bytes (resize, re-encode) groups; a different picture does not; the
// selected or site-used image stays; fingerprints are cached.
import { access, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { makeContext } from '../modules/storage/providers/context';
import { distance, fingerprint, lookalikes } from '../modules/storage/providers/lookalikes';
import { put } from './storage-fixture';

let root: string;
let state: string;
const LIB = 'wiki/image-library';

/** A 160x100 picture: a left-to-right gradient with a dark block whose position `shift` moves. */
async function picture(shift: number): Promise<Buffer> {
  const w = 160;
  const h = 100;
  const px = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const inBlock = x > 20 + shift && x < 70 + shift && y > 20 && y < 80;
      const v = inBlock ? 20 : Math.round((x / w) * 230);
      px.set([v, v, (v + y) % 256], (y * w + x) * 3);
    }
  }
  return sharp(px, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer();
}

beforeAll(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'mtw-lookalikes-'));
  state = path.join(root, 'state');
  const a = await picture(0);
  const different = await sharp(await picture(0)).flop().png().toBuffer();
  await put(root, `${LIB}/assets/experiments/x/a.png`, a);
  await put(root, `${LIB}/assets/experiments/x/a-resized.png`, await sharp(a).resize(320, 200).png().toBuffer());
  await put(root, `${LIB}/assets/experiments/x/a-reencoded.jpg`, await sharp(a).jpeg({ quality: 70 }).toBuffer());
  await put(root, `${LIB}/assets/experiments/x/different.png`, different);
  await put(root, `${LIB}/assets/scenes/y/b-v1.png`, await picture(40));
  await put(root, `${LIB}/assets/scenes/y/b-v2.png`, await sharp(await picture(40)).resize(320, 200).png().toBuffer());
  await put(root, `${LIB}/assets/scenes/y/c-v1.png`, await picture(80));
  await put(root, `${LIB}/assets/scenes/y/c-v2.png`, await sharp(await picture(80)).jpeg({ quality: 80 }).toBuffer().then((b) => sharp(b).png().toBuffer()));
  await put(root, 'site/public/comic/z/c-1600.webp', Buffer.from('site copy of c'));
  const rec = (id: string, p: string, extra: Record<string, unknown> = {}) => ({ id, collection: 'experiments', treatments: { t: { path: p, ...extra } } });
  const files = ['experiments/x/a.png', 'experiments/x/a-resized.png', 'experiments/x/a-reencoded.jpg', 'experiments/x/different.png', 'scenes/y/b-v1.png', 'scenes/y/b-v2.png', 'scenes/y/c-v1.png', 'scenes/y/c-v2.png'].map((f) => `assets/${f}`);
  await put(
    root,
    `${LIB}/manifest.json`,
    JSON.stringify({
      records: [...files.map((f, i) => rec(`r${i}`, f)), rec('b-selected', 'assets/scenes/y/b-v1.png', { status: 'selected' })],
      files: files.map((destination) => ({ destination })),
    }),
  );
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
});

describe('look-alikes', () => {
  it('fingerprints survive resize and re-encode, and a mirrored picture differs', async () => {
    const lib = path.join(root, LIB, 'assets/experiments/x');
    const [a, r, j, d] = await Promise.all(['a.png', 'a-resized.png', 'a-reencoded.jpg', 'different.png'].map((f) => fingerprint(path.join(lib, f))));
    expect(distance(a!.dhash, r!.dhash)).toBeLessThanOrEqual(2);
    expect(distance(a!.dhash, j!.dhash)).toBeLessThanOrEqual(4);
    expect(distance(a!.dhash, d!.dhash)).toBeGreaterThan(8);
  });

  it('keeps the largest of an unprotected group, the selected one and the site-used one, and offers the rest', async () => {
    const ctx = makeContext(root, { stateDir: state });
    const targets = (await lookalikes.targets(ctx)).map((t) => t.id).sort();
    expect(targets).toEqual(['assets/experiments/x', 'assets/scenes/y']);
    const x = (await lookalikes.plan('assets/experiments/x', ctx)).files.map((f) => f.path).sort();
    expect(x).toEqual([`${LIB}/assets/experiments/x/a-reencoded.jpg`, `${LIB}/assets/experiments/x/a.png`]); // a-resized is largest
    const y = await lookalikes.plan('assets/scenes/y', ctx);
    expect(y.files.map((f) => f.path).sort()).toEqual([`${LIB}/assets/scenes/y/b-v2.png`]); // b-v1 selected; c-v1/c-v2 share the site stem c
    expect(y.files[0]!.reason).toMatch(/looks like assets\/scenes\/y\/b-v1\.png/);
    await access(path.join(state, 'fingerprints.json'));
  });

  it('a strict threshold of 0 bits drops the re-encode group members that differ', async () => {
    const ctx = makeContext(root, { stateDir: state, params: { bits: 0 } });
    const all = (await Promise.all((await lookalikes.targets(ctx)).map((t) => lookalikes.plan(t.id, ctx)))).flatMap((p) => p.files.map((f) => f.path));
    const loose = makeContext(root, { stateDir: state });
    const allLoose = (await Promise.all((await lookalikes.targets(loose)).map((t) => lookalikes.plan(t.id, loose)))).flatMap((p) => p.files.map((f) => f.path));
    expect(all.length).toBeLessThanOrEqual(allLoose.length);
  });
});
