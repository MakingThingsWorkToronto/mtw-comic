#!/usr/bin/env node
// Model the actual Beat seek/pause helpers; no browser or visible ember-quality claim.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const runtime = process.argv[2] ? resolve(process.argv[2]) : fileURLToPath(new URL('../public/scripts/beat-comic.js', import.meta.url));
const source = readFileSync(runtime, 'utf8');
const a = source.indexOf('  function seekTo('), b = source.indexOf('  var resumeAfterScrub = false;', a);
const c = source.indexOf('  function setPaused('), d = source.indexOf('  /* ---------- The motion toolbar', c);
assert(a >= 0 && b > a && c >= 0 && d > c, 'actual seek/pause helper boundaries');
function fixture(paused) {
  const wall = { value: 30 };
  const audio = { currentTime: 0, paused, play() { this.paused = false; return Promise.resolve(); }, pause() { this.paused = true; } };
  const context = vm.createContext({
    T: 0, END: 60, HOLD_END: true, held: false, heldAt: 0, userPaused: paused, pausedAt: 10,
    state: paused ? 'paused' : 'play', t0: 0, lastMT: 9, audioLive: true, audio, music: { offset: 0.2 },
    story: { holdLive: true }, liveRun: false, hold: false, raf: 0, TB: null,
    tag: { classList: { toggle() {} } },
    now: () => wall.value, clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    render() {}, requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    frame() {}, liveHold() {}, clockTime() { return context.T; }, startMusic() {}
  });
  vm.runInContext(source.slice(a, b) + source.slice(c, d), context);
  return { context, wall, run: text => vm.runInContext(text, context) };
}
const f = fixture(true); f.run('seekTo(60)');
assert.equal(f.context.held, true); assert.equal(f.context.heldAt, 10); assert.equal(f.context.audio.paused, true);
f.wall.value = 40; f.run('setPaused(false, true)');
assert.equal(f.context.heldAt, 40); assert.equal(f.wall.value - f.context.heldAt, 0, 'new held seek begins at resume');
assert.equal(f.context.audio.paused, false);
const ordinary = fixture(true); ordinary.context.held = true; ordinary.context.heldAt = 5;
ordinary.wall.value = 40; ordinary.run('setPaused(false, true)');
assert.equal(ordinary.context.heldAt, 35); assert.equal(ordinary.wall.value - ordinary.context.heldAt, 5, 'ordinary held pause preserves prior animation elapsed');
const playing = fixture(false); playing.run('seekTo(60)'); assert.equal(playing.context.heldAt, 30);
playing.run('seekTo(12)');
assert.equal(playing.context.T, 12); assert.equal(playing.context.held, false); assert.equal(playing.context.heldAt, 0);
assert.equal(playing.context.lastMT, null); assert.equal(playing.context.audio.currentTime, 12.2);
console.log(JSON.stringify({ runtime, checks: 4, limitation: 'Actual helper samples in a modelled clock; native playback and ember appearance remain separate.' }, null, 2));