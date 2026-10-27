// Read-only shared-runtime timing regression; no browser, catalog or story edits.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(resolve(here, '../public/scripts/comic-story.js'), 'utf8');
function extract(name) {
  const start = source.indexOf(`  function ${name}(`);
  assert(start >= 0, `${name} exists`);
  if (name === 'sheetAt' || name === 'lastAtOf') return source.slice(start, source.indexOf('\n', start));
  const end = source.indexOf('\n  }', start) + 4;
  return source.slice(start, end);
}
const ctx = { model: [], mode: 'phone', ENTER: 1, EXIT: 1.8, REVEAL: 1, B: .5, clamp: (v,lo,hi) => Math.max(lo,Math.min(hi,v)) };
vm.createContext(ctx);
vm.runInContext(['lastAtOf', 'sheetReadyAt', 'timeline', 'panelFadeStart', 'panelRevealDuration', 'sheetAt', 'reviewFrames'].map(extract).join('\n'), ctx);
const panel = (id, at, balloons = []) => ({ d: { img: id, at }, balloons });
const balloon = (at, per = .04, count = 20) => ({ d: { at }, per, units: Array(count).fill({}) });
function plan(panels, times = []) {
  const x = { panels, start: 0, lastAt: Math.max(...panels.map(p => p.d.at)), exitStart: 5, exitEnd: 7 };
  ctx.model = [{ d: { id: 'sample', b: 100, l: 12 }, sheets: [panels, ...times.map(t => t.panels)], times: [x, ...times] }];
  return ctx.reviewFrames('sample');
}
let tests = 0;
let p = plan([panel('first', 1), panel('late', 4.5)]);
assert.equal(p.frames.length, 2);
assert(p.frames.every(f => f.ready));
assert.equal(p.frames[1].panels[0].fadeStart, 106);
assert.deepEqual(Array.from(p.frames.flatMap(f => f.panelImageIds)).sort(), ['first', 'late']); tests++;

p = plan([panel('silent', 4.5)]);
assert.equal(ctx.panelRevealDuration(ctx.model[0].times[0], ctx.model[0].times[0].panels[0], 0), .4);
assert(p.frames[0].ready);
assert(Math.abs(p.frames[0].panels[0].fadeStart - p.frames[0].fullyVisibleBeat - .1) < 1e-9); tests++;

p = plan([panel('speech', 4.5, [balloon(4.5)])]);
assert.equal(ctx.panelRevealDuration(ctx.model[0].times[0], ctx.model[0].times[0].panels[0], 0), 1);
assert.equal(p.frames[0].ready, false); tests++;

p = plan([panel('unmeasured', 1, [balloon(1, undefined)])]);
// Explicitly unknown measured speed cannot be replaced with a guessed type duration.
ctx.model[0].times[0].panels[0].balloons[0].per = undefined;
assert.equal(ctx.reviewFrames('sample').frames[0].ready, false); tests++;

const next = { panels: [panel('next', 5.4)], start: 5.2, lastAt: 5.4, exitStart: 10, exitEnd: 12 };
p = plan([panel('first', 1), panel('outgoing', 4.5)], [next]);
assert.equal(p.frames.find(f => f.panelImageIds.includes('outgoing')).activeSheet, 1);
assert.equal(new Set(p.frames.map(f => f.sheet)).size, 2);
assert(p.frames.every(f => f.ready)); tests++;

p = plan([panel('one', 1), panel('two', 2)]);
assert.equal(p.frames.length, 1);
assert.equal(p.frames[0].panelImageIds.length, 2); tests++;

assert.equal(ctx.reviewFrames('missing'), null); tests++;
assert(source.includes('(bt - panelFadeStart(x, idx)) / dOut'));
assert(source.includes('(bt - o.d.at) / panelRevealDuration(x, o, idx)'));
tests++;
// Actual Home phone failure: one glyph starts at317.5, but the original
// outgoing sheet faded at317.82 before its318.025 completion (B=2/3).
ctx.B = 2 / 3;
const short = panel('wait', 316.4, [balloon(317.5, .12, 1)]);
const following = panel('following', 319.4);
let real = { d: { id: 'sample', b: 0, l: 324 }, sheets: [[short], [following]] };
real.times = ctx.timeline(real); ctx.model = [real];
assert(ctx.reviewFrames('sample').frames.every(f => f.ready));
assert(real.times[0].exitStart >= 318.275); tests++;
// A different long measured balloon also finishes before exit, while a
// genuinely impossible scene remains reported as unready.
const long = panel('long', 1, [balloon(2, .12, 40)]);
real = { d: { id: 'sample', b: 0, l: 16 }, sheets: [[long]] };
real.times = ctx.timeline(real); ctx.model = [real];
assert(ctx.reviewFrames('sample').frames.every(f => f.ready)); tests++;
real.d.l = 3; real.times = ctx.timeline(real);
assert.equal(ctx.reviewFrames('sample').frames[0].ready, false); tests++;
console.log(`${tests} comic timing regression cases passed.`);
