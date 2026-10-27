import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), 'audio-coverage.mjs');

function scene(id, over = {}, box = {}) {
  return { id, score: 0.4, room: 'office', panels: [{ img: `${id}-a`, r: [0, 0, 1, 1], sfx: [{ kind: 'click' }], balloons: [{ at: 0, kind: 'speech', who: 'matt', text: 'Hello there', x: 0.1, y: 0.1, speech: { id: 's', src: '/audio/v.mp3', durationSeconds: 2, provider: 'x', characterId: 'matt' } }], ...box }], ...over };
}
function run(storyOver = {}, { scenes, extra = [], files = ['audio/v.mp3', 'audio/m.mp3', 'audio/o.mp3'] } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'acov-'));
  const pub = path.join(dir, 'public');
  for (const f of files) { fs.mkdirSync(path.dirname(path.join(pub, f)), { recursive: true }); fs.writeFileSync(path.join(pub, f), 'x'); }
  const story = { music: { src: '/audio/m.mp3', offset: 0, credit: 'c', source: 's' }, soundAssets: { rooms: { office: { src: '/audio/o.mp3' } } }, next: { sound: { score: 0.2, room: 'office' } }, scenes: scenes ?? [scene('a'), scene('b'), scene('c')], ...storyOver };
  const file = path.join(dir, 't.ts');
  fs.writeFileSync(file, `export const t = retime(${JSON.stringify(story, null, 2)});\n`);
  const r = spawnSync(process.execPath, [script, '--story', file, '--public', pub, '--json', ...extra], { encoding: 'utf8' });
  return { code: r.status, out: JSON.parse(r.stdout) };
}
const has = (out, re) => out.errors.some((e) => re.test(e));

test('all good', () => { const { code, out } = run(); assert.equal(code, 0); assert.equal(out.totals.voiced, 3); });
test('missing room', () => {
  const s = scene('a'); delete s.room;
  const { code, out } = run({}, { scenes: [s, scene('b'), scene('c')] });
  assert.equal(code, 1); assert.ok(has(out, /room must be/));
});
test('too many silent scenes', () => {
  const sil = (id) => scene(id, { score: 0, room: 'none' });
  const { code, out } = run({}, { scenes: [sil('a'), sil('b'), scene('c')] });
  assert.equal(code, 1); assert.ok(has(out, /silent/));
});
test('one silent scene in three with sfx is fine', () => {
  const { code } = run({}, { scenes: [scene('a', { score: 0, room: 'none' }), scene('b'), scene('c')] });
  assert.equal(code, 0);
});
test('sfx density below 50%', () => {
  const s = scene('a');
  for (const k of 'bcdefg') s.panels.push({ img: 'a-' + k, r: [0, 0, 1, 1] });
  const { code, out } = run({}, { scenes: [s, scene('b'), scene('c')] });
  assert.equal(code, 1); assert.ok(has(out, /% of boxes/));
});
test('speech src missing on disk', () => {
  const { code, out } = run({}, { files: ['audio/m.mp3', 'audio/o.mp3'] });
  assert.equal(code, 1); assert.ok(has(out, /missing on disk/));
});
test('unknown sfx kind', () => {
  const { code, out } = run({}, { scenes: [scene('a', {}, { sfx: [{ kind: 'kazoo' }] }), scene('b'), scene('c')] });
  assert.equal(code, 1); assert.ok(has(out, /unknown sfx kind/));
});
test('--require-voiced', () => {
  const s = scene('a'); delete s.panels[0].balloons[0].speech;
  const scenes = [s, scene('b'), scene('c')];
  const soft = run({}, { scenes }); assert.equal(soft.code, 0); assert.equal(soft.out.totals.unvoiced, 1);
  const hard = run({}, { scenes, extra: ['--require-voiced'] }); assert.equal(hard.code, 1); assert.ok(has(hard.out, /unvoiced/));
});
