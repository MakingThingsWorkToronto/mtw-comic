import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '..', '..');
const sharp = createRequire(path.join(repo, 'site', 'package.json'))('sharp');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bind-art-'));
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const raw = (ch) => ({ raw: { width: 8, height: 8, channels: ch } });
const opaque = path.join(tmp, 'master.png'), plane = path.join(tmp, 'plane.png');
await sharp(Buffer.alloc(8 * 8 * 3, 200), raw(3)).png().toFile(opaque);
const rgba = Buffer.alloc(8 * 8 * 4, 0);
for (let i = 0; i < 32; i++) { rgba[i * 4] = 255; rgba[i * 4 + 3] = 255; } // top half opaque red, bottom half clear
await sharp(rgba, raw(4)).png().toFile(plane);
const [mSha, pSha] = [sha(opaque), sha(plane)];

const slug = 'zz-bind-test', storyFile = path.join(tmp, `${slug}.ts`);
const panel = (img) => ({ img, alt: 'alt text', r: [0, 0, 1, 1], ar: [0.1, 0.1, 0.5, 0.5], balloons: [], staticArt: { src: '/old.webp' } });
const wrapper = `import { retime } from './x';\nexport const zzComic = retime(${JSON.stringify({ id: 'bindtest', scenes: [{ id: 's1', panels: [panel('a'), panel('b')] }] }, null, 2)});\n`;
fs.writeFileSync(storyFile, wrapper);
const ledgerRoot = path.join(tmp, 'ledgers'), pub = path.join(tmp, 'public'), ledgerFile = path.join(ledgerRoot, `${slug}-build-t1`, 'state.json');
fs.mkdirSync(path.dirname(ledgerFile), { recursive: true });
const sel = { src: opaque, sha256: mSha };
fs.writeFileSync(ledgerFile, JSON.stringify({ schema: 'comic-build/1', slug, buildId: 't1', scenes: { s1: { status: 'generated', boxes: {
  a: { selected: sel, faces: [{ cast: 'ann', mouth: [0.5, 0.6], face: [0.4, 0.4, 0.2, 0.2] }], planes: [] },
  b: { selected: sel, planes: [{ id: 'bg', role: 'background', src: opaque, sha256: mSha }, { id: 'p1', role: 'props', src: plane, sha256: pSha, motion: { preset: 'travel' } }] },
  c: { selected: null } } } } }));
const run = (...extra) => spawnSync(process.execPath, [path.join(here, 'bind-art.mjs'), '--slug', slug, '--build', 't1', '--scene', 's1', '--no-check', '--story', storyFile, '--ledger-root', ledgerRoot, '--public-root', pub, ...extra], { encoding: 'utf8' });
const read = () => JSON.parse(fs.readFileSync(storyFile, 'utf8').replace(/^[\s\S]*?retime\(/, '').replace(/\);\s*$/, ''));
const dir = path.join(pub, 'comic', 'bindtest', 'build-t1');
test.after(() => { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {} });

test('dry run changes nothing', () => {
  const r = run('--dry-run'); assert.equal(r.status, 0, r.stderr);
  assert.equal(fs.readFileSync(storyFile, 'utf8'), wrapper); assert.equal(fs.existsSync(dir), false);
});

test('binds staticArt and plane stack', async () => {
  const r = run(); assert.equal(r.status, 0, r.stderr);
  const [a, b] = read().scenes[0].panels;
  assert.equal(a.staticArt.src, '/comic/bindtest/build-t1/a-v.webp');
  assert.deepEqual(a.staticArt.speakers.ann.mouth, [0.5, 0.6]);
  assert.equal(a.staticArt.canonicalSource.recordId, 'pending-registration');
  assert.deepEqual(a.ar, [0.1, 0.1, 0.5, 0.5]); assert.equal(a.views, undefined);
  assert.deepEqual(b.views.map((v) => [v.id, v.at]), [['base', 0], ['stack', 1]]);
  assert.deepEqual(b.views[1].layers.map((l) => l.id), ['bg', 'p1']);
  assert.deepEqual(b.views[1].layerMotion, [{ layerId: 'p1', preset: 'travel' }]);
  assert.deepEqual(b.fallbackView, { desktop: 'base', phone: 'base' });
  assert.equal(b.staticArt.src, b.views[0].src);
  for (const f of ['a-v', 'b-v', 'b-bg', 'b-p1']) assert.ok(fs.existsSync(path.join(dir, `${f}.webp`)), f);
  const { data, info } = await sharp(path.join(dir, 'b-p1.webp')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const alphas = new Set(); for (let i = 3; i < data.length; i += 4) alphas.add(data[i] > 128 ? 'solid' : 'clear');
  assert.equal(info.channels, 4); assert.deepEqual([...alphas].sort(), ['clear', 'solid']);
});

test('second run is idempotent and skips boxes without a master', () => {
  const text = fs.readFileSync(storyFile, 'utf8'), stamp = () => fs.readdirSync(dir).map((f) => fs.statSync(path.join(dir, f)).mtimeMs);
  const before = stamp();
  const r = run(); assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /\(0 new file/); assert.match(r.stderr, /c: no selected master/);
  assert.equal(fs.readFileSync(storyFile, 'utf8'), text); assert.deepEqual(stamp(), before);
});
