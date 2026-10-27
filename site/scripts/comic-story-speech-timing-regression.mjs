// Speech-aware retime regression (skill: mtw-comic-story, references/checks.md).
// Tests properties of the shared retime branch against every current story, never a frozen timetable,
// so ordinary story edits cannot make it stale. Usage: node scripts/comic-story-speech-timing-regression.mjs [retime.ts] [site]
import path from 'node:path';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {pathToFileURL, fileURLToPath} from 'node:url';

const site = process.argv[3] ? path.resolve(process.argv[3]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const proposal = process.argv[2] ? path.resolve(process.argv[2]) : path.join(site, 'src/data/comic-stories/retime.ts');
registerHooks({resolve(spec, ctx, next) {
  try { return next(spec, ctx); } catch (e) { if (/^\.\.?\//.test(spec) && !/\.[a-z]+$/i.test(spec)) return next(spec + '.ts', ctx); throw e; }
}});
const load = rel => import(pathToFileURL(path.join(site, rel)));
const {retime} = await import(pathToFileURL(proposal));
const {comicIssues} = await load('src/data/comic-stories/index.ts');
const {demoComic} = await load('src/data/comic-stories/demo.ts');
const stories = [...comicIssues.map(i => i.story), demoComic];
const clone = s => JSON.parse(JSON.stringify(s));
const results = [];
const test = (name, fn) => { try { fn(); results.push({name, pass: true}); } catch (e) { results.push({name, pass: false, error: e.message}); } };

// The pre-speech reading-time algorithm, kept as the reference for stories with no authored speech.
function legacyRetime(story) {
  const B = 60 / story.bpm, read = t => (1 + 0.3 * t.split(/\s+/).filter(Boolean).length) / B;
  const up = v => Math.ceil(v * 2) / 2, exit = Math.max(1.5, 1.2 / B);
  let start = 0;
  for (const sc of story.scenes) {
    let cursor = 1, end = 0;
    for (const p of sc.panels) {
      p.at = up(Math.max(cursor, end));
      let t = p.at + (p.balloons.length ? 0.5 : 0);
      for (const b of p.balloons) { b.at = up(t); end = Math.max(b.at, end) + read(b.text); t = b.at + 1.5; }
      cursor = p.at + (p.run && !p.balloons.length ? 1 : 1.5);
    }
    sc.b = start; sc.l = Math.ceil((Math.max(cursor, end) + (sc.artHoldBeats ?? 0) + exit + 1) / 4) * 4; start += sc.l;
  }
  story.next.b = start; story.beats = start + 4;
  return story;
}
const unvoiced = story => { const s = clone(story); for (const sc of s.scenes) for (const p of sc.panels) for (const b of p.balloons) delete b.speech; return s; };
const withoutClocks = story => {
  const s = clone(story); delete s.beats; delete s.next.b;
  for (const sc of s.scenes) { delete sc.b; delete sc.l; for (const p of sc.panels) { delete p.at; for (const b of p.balloons) delete b.at; } }
  return JSON.stringify(s);
};
// Real measured take lengths (seconds) from retained Home speech; placed on generated balloons, not named panels.
const takeSeconds = [13.008875, 2.612125, 4.937063, 2.377063];
function voice(story) {
  const s = unvoiced(story), firsts = [];
  s.scenes.forEach((sc, si) => sc.panels.forEach((p, pi) => p.balloons.forEach((b, bi) => { if (pi === 0 && bi === 0) firsts.push({si, b}); })));
  // The story's first balloon gets the longest take so the following silent line must wait for it; later takes go
  // on the first balloon of evenly spread later scenes.
  const picks = [firsts[0], ...[1, 2, 3].map(k => firsts[Math.round(k * (firsts.length - 1) / 3)])].filter((x, i, a) => x && a.indexOf(x) === i);
  picks.forEach((x, i) => { x.b.speech = {id: `${s.id}-synthetic-${i}`, src: '/comic/speech/synthetic.mp3', durationSeconds: takeSeconds[i], provider: 'saved', characterId: 'synthetic'}; });
  return s;
}

for (const story of stories) {
  const id = story.id;
  test(`${id}: with no authored speech, retime equals the pre-speech reading-time algorithm`, () => {
    assert.deepEqual(retime(unvoiced(story)), legacyRetime(unvoiced(story)));
  });
  const voiced = voice(story), original = clone(voiced), timed = retime(clone(voiced)), B = 60 / story.bpm;
  const rows = timed.scenes.flatMap(sc => sc.panels.flatMap(p => p.balloons.map(b => ({sc, p, b, start: (sc.b + Math.max(p.at, b.at)) * B + .3})))).sort((a, b) => a.start - b.start);
  test(`${id}: speech spacing changes only clocks, never words, order or geometry`, () => {
    assert.equal(withoutClocks(timed), withoutClocks(original));
  });
  test(`${id}: every take ends before the next line, box and scene, with the reading gap`, () => {
    rows.forEach((r, i) => {
      if (!r.b.speech) return;
      const panelEnd = r.sc.panels.filter(p => p.at > r.p.at).reduce((end, p) => Math.min(end, (r.sc.b + p.at) * B), (r.sc.b + r.sc.l) * B);
      const next = rows[i + 1]?.start ?? Infinity, end = r.start + r.b.speech.durationSeconds;
      assert(end <= Math.min(panelEnd, next) + .02, `${r.b.speech.id} overruns its slot`);
      assert(end + .4 <= next + .0001, `${r.b.speech.id} leaves no reading gap`);
    });
  });
  test(`${id}: a silent line after the first take waits for it`, () => {
    assert(rows[0].b.speech, 'first balloon carries the long take');
    if (rows[1] && !rows[1].b.speech) assert(rows[1].start >= rows[0].start + takeSeconds[0] + .4);
  });
  test(`${id}: retime is idempotent and every balloon follows its box`, () => {
    assert.equal(JSON.stringify(retime(clone(timed))), JSON.stringify(timed));
    for (const r of rows) assert(r.p.at <= r.b.at);
  });
}

const passed = results.filter(r => r.pass).length;
console.log(JSON.stringify({proposal, stories: stories.map(s => s.id), checks: results.length, passed, failed: results.filter(r => !r.pass)}, null, 2));
if (passed !== results.length) process.exitCode = 1;
