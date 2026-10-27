// Tests for letter-plan.mjs. Run: node --test scripts/comics/letter-plan.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const CLI = path.join(import.meta.dirname, 'letter-plan.mjs');
const r3 = (v) => Math.round(v * 1000) / 1000;
const b = (kind, who, text, extra = {}) => ({ at: 0, kind, who, text, x: 0.5, y: 0.5, ...extra });
const box = (img, r, balloons) => ({ img, alt: 'a box', at: 0, r, balloons });
const scene = () => ({
  id: 's1',
  panels: [
    box('b1', [0, 0, .6, .9], [
      b('speech', 'ann', 'Fix the quote first.', { state: 'calm' }),
      b('caption', 'second-brain', 'Eleven at night.', { sceneSetup: true }),
      b('place', 'second-brain', 'Toronto, 11 pm'),
      b('speech', 'ben', 'Send it anyway.', { state: 'calm' }),
      b('speech', 'ann', 'Wait.', { chain: true }),
      b('speech', 'zed', 'Who else saw this?', { state: 'calm' }),
    ]),
    box('b2', [.6, 0, .4, .9], [b('caption', 'cy', 'Cy Smith, the owner.', { characterIntro: true }), b('speech', 'cy', 'It is mine.', { state: 'calm' })]),
    box('b3', [0, .9, .4, .9], [b('speech', 'voice', 'Check the totals!', { state: 'offpanel' })]),
    box('b4', [.4, .5, .3, .5], [b('thought', 'ann', 'This is wrong.')]),
    box('b5', [.7, .5, .3, .5], [b('speech', 'ann', 'Hold on.', { phone: { reflow: 'paragraph' } })]),
  ],
  phonePages: [[{ img: 'b1', r: [0, 0, 1, .5] }, { img: 'b2', r: [0, .5, .5, .5] }, { img: 'b3', r: [.5, .5, .5, .5] }], [{ img: 'b4', r: [0, 0, .5, 1] }, { img: 'b5', r: [.5, 0, .5, 1] }]],
});
const face = (cast, mouth, f) => ({ cast, mouth, face: f });
const FACES = {
  b1: { faces: [face('ann', [.17, .45], [.1, .3, .15, .2]), face('ben', [.65, .55], [.6, .35, .15, .25])], selected: { ar: [0, 0, 1, 1] } },
  b2: { faces: [face('cy', [.5, .5], [.4, .3, .2, .3])], selected: null },
};

function setup(scenes, boxes, plan = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'letter-'));
  const file = path.join(dir, 't.ts');
  fs.writeFileSync(file, `export const t = retime(${JSON.stringify({ id: 't', scenes }, null, 2)});\n`);
  const led = path.join(dir, 'ledger');
  const sdir = path.join(led, 't-build-1');
  fs.mkdirSync(sdir, { recursive: true });
  const bx = Object.fromEntries(Object.entries(boxes).map(([k, v]) => [k, { status: 'pending', attempts: [], ...v }]));
  const st = { schema: 'comic-build/1', slug: 't', buildId: '1', scenes: { s1: { status: 'pending', plan: { boxes: plan }, boxes: bx, planes: [] } }, notes: [] };
  fs.writeFileSync(path.join(sdir, 'state.json'), JSON.stringify(st));
  return { dir, file, led, sdir };
}
const run = (env, extra = []) => {
  const r = spawnSync(process.execPath, [CLI, '--slug', 't', '--build', '1', '--scene', 's1', '--story', env.file, '--ledger-root', env.led, '--json', ...extra], { encoding: 'utf8' });
  return { status: r.status, out: r.stdout ? JSON.parse(r.stdout) : null, err: r.stderr };
};
const readStory = (file) => { const t = fs.readFileSync(file, 'utf8'); return JSON.parse(t.slice(t.indexOf('retime(') + 7, t.lastIndexOf('});') + 1)); };
const rect = (x) => ({ x: x.x, y: x.y, w: x.w, h: x.h });
const hit = (a, c) => a.x < c.x + c.w - 1e-6 && c.x < a.x + a.w - 1e-6 && a.y < c.y + c.h - 1e-6 && c.y < a.y + a.h - 1e-6;
const grow = (f) => ({ x: f.x - .04, y: f.y - .04, w: f.w + .08, h: f.h + .08 });

test('places a five-box scene without collisions and keeps the words', () => {
  const env = setup([scene()], FACES, { b3: { clearArea: 'bottom' }, b1: { clearArea: 'top' } });
  const before = readStory(env.file);
  const { status, out } = run(env);
  assert.equal(status, 0, JSON.stringify(out));
  const after = readStory(env.file);
  after.scenes.forEach((s, si) => s.panels.forEach((p, pi) => p.balloons.forEach((bl, bi) => {
    const o = before.scenes[si].panels[pi].balloons[bi];
    for (const k of ['text', 'who', 'kind', 'state', 'sceneSetup', 'characterIntro', 'chain', 'at']) assert.equal(bl[k], o[k]);
  })));
  assert.equal(after.scenes[0].panels.map((p) => p.balloons.length).join(), '6,2,1,1,1');
  for (const [img, bx] of Object.entries(out.boxes)) {
    const rs = bx.balloons.map(rect);
    rs.forEach((r, i) => {
      assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= 1 && r.y + r.h <= 1, `${img} ${i} inside`);
      // Corner-fixed captions are warned about, not slid; every other balloon must clear the expanded faces.
      if (!['caption', 'place'].includes(bx.balloons[i].kind)) for (const f of bx.faces) assert.ok(!hit(r, grow(f.rect)), `${img} ${i} hits a face`);
      rs.slice(i + 1).forEach((q, j) => assert.ok(!hit(r, q), `${img} ${i} overlaps ${i + j + 1}`));
    });
  }
  const b1 = out.boxes.b1.balloons;
  assert.deepEqual(b1[0].tail, [.17, .45]);
  assert.deepEqual(b1[3].tail, [.65, .55]);
  assert.equal(b1[4].tail, null);
  assert.equal(b1[5].tail.length, 2);
  assert.equal(b1[1].x, r3(1 - b1[1].w - .02));
  assert.equal(b1[1].y, r3(1 - b1[1].h - .02));
  assert.equal(b1[2].x, .02);
  assert.equal(b1[2].y, .02);
  assert.equal(out.boxes.b2.balloons[0].w, .34);
  assert.ok(out.boxes.b3.balloons[0].tail.some((v) => v === 0 || v === 1));
  assert.equal(out.boxes.b4.balloons[0].tail, null);
  assert.equal(after.scenes[0].panels[4].balloons[0].phone.reflow, 'paragraph');
  assert.ok(Object.values(out.boxes).every((bx) => bx.balloons.every((x) => x.phone && typeof x.phone.x === 'number')));
  const ledger = JSON.parse(fs.readFileSync(path.join(env.sdir, 'state.json'), 'utf8'));
  assert.equal(ledger.scenes.s1.boxes.b1.lettering.ok, true);
  assert.ok(fs.existsSync(path.join(env.sdir, 'lettering', 's1.json')));
});

test('a scene with no phonePages writes no phone overrides', () => {
  const s = scene(); delete s.phonePages;
  const env = setup([s], FACES);
  assert.equal(run(env).status, 0);
  assert.ok(readStory(env.file).scenes[0].panels.every((p) => p.balloons.every((x) => !x.phone || Object.keys(x.phone).join() === 'reflow')));
});

test('dry-run leaves the story and ledger unchanged', () => {
  const env = setup([scene()], FACES);
  const text = fs.readFileSync(env.file, 'utf8');
  const state = fs.readFileSync(path.join(env.sdir, 'state.json'), 'utf8');
  assert.equal(run(env, ['--dry-run']).status, 0);
  assert.equal(fs.readFileSync(env.file, 'utf8'), text);
  assert.equal(fs.readFileSync(path.join(env.sdir, 'state.json'), 'utf8'), state);
  assert.ok(!fs.existsSync(path.join(env.sdir, 'lettering')));
});

test('exits 1 when faces cover the whole box', () => {
  const s = { id: 's1', panels: [box('b1', [0, 0, 1, 1], [b('speech', 'ann', 'Hello there.', { state: 'calm' })])] };
  const env = setup([s], { b1: { faces: [face('ann', [.5, .5], [0, 0, 1, 1])], selected: null } });
  const { status, out } = run(env);
  assert.equal(status, 1);
  assert.match(out.boxes.b1.warnings.join(), /b1/);
});

test('exits 2 on a missing scene', () => {
  const env = setup([scene()], FACES);
  const r = spawnSync(process.execPath, [CLI, '--slug', 't', '--build', '1', '--scene', 'nope', '--story', env.file, '--ledger-root', env.led], { encoding: 'utf8' });
  assert.equal(r.status, 2);
});
