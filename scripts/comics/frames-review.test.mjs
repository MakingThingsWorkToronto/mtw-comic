import test from 'node:test';
import assert from 'node:assert/strict';
import { momentsFor, frameName } from './frames-review.mjs';

const scene = { id: 's1', b: 40, panels: [] };

test('momentsFor: plain box gets reveal and read', () => {
  const p = { img: 'a', at: 2, balloons: [{ at: 3 }, { at: 5 }] };
  assert.deepEqual(momentsFor(scene, p), [
    { moment: 'reveal', rel: 2.6, beat: 42.6 },
    { moment: 'read', rel: 7, beat: 47 },
  ]);
});
test('momentsFor: no balloons reads from panel.at; motion adds a third moment', () => {
  const p = { img: 'b', at: 4, layerMotion: [{ preset: 'sprout' }] };
  const m = momentsFor(scene, p);
  assert.deepEqual(m.map((x) => x.moment), ['reveal', 'read', 'motion']);
  assert.equal(m[1].rel, 6);
  assert.ok(Math.abs(m[2].rel - 7.6) < 1e-9);
});
test('momentsFor: views count as motion; insets are skipped', () => {
  assert.equal(momentsFor(scene, { img: 'c', at: 0, views: [{ id: 'v' }] }).length, 3);
  assert.deepEqual(momentsFor(scene, { img: 'd', at: 0, inset: true }), []);
});
test('frameName', () => {
  assert.equal(frameName('a:b', 'phone', 'reveal'), 'a-b-phone-reveal.png');
  assert.equal(frameName('a', 'desktop', 'read', true), 'a-desktop-read-box.png');
});
