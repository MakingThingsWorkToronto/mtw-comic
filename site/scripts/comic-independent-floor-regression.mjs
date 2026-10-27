// Independent-floor playback regression (skill: mtw-comic-story, references/checks.md).
// Runs the runtime's real motion sampler and DOM application, the maintained layer/art gates and the playback
// measurement against controlled fixtures. The runtime's top-level functions are loaded whole, so adding or splitting a
// helper cannot break the check. No browser, native reader or artwork claim.
// Usage: node site/scripts/comic-independent-floor-regression.mjs [runtime.js]
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {comicLayerErrors} from './comic-layer-contract.mjs';
import {checkComicArt} from './comic-story-art-check.mjs';
import {channelMetrics, motionChannels, motionPeakBeat} from './comic-playback-motion.mjs';
import {loadRuntimeFunctions, readRuntime} from './lib/comic-runtime-functions.mjs';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtime = path.resolve(process.argv[2] || path.join(site, 'public/scripts/comic-story.js'));

// Runtime state the functions read; the fixture owns it, the runtime owns every function.
const ctx = loadRuntimeFunctions({REDUCED: false, layerArtDisposed: false, activeAgentFabrications: [], window: {}}, readRuntime(runtime), {filename: runtime});
const sample = (spec, beat, start = 10, stop = 30, reduced = false) => JSON.parse(JSON.stringify(ctx.panelMotionSample(spec, beat, start, stop, reduced)));

const results = [];
const test = (name, fn) => { try { fn(); results.push({name, pass: true}); } catch (e) { results.push({name, pass: false, error: e.message}); } };
const spec = {preset: 'sprout', floors: 8, beats: 8, floorIndex: 5, activeFloors: [1, 2, 3, 4, 5]};

test('the sampler switches a whole independent floor at its exact story-clock step', () => {
  for (const beat of [0, 9, 10, 14.999]) assert.equal(sample(spec, beat).opacity, 0);
  for (const beat of [15, 18, 30, 100]) assert.equal(sample(spec, beat).opacity, 1);
  assert.deepEqual(sample(spec, 15), {transform: 'none', filter: 'none', clipPath: 'none', opacity: 1});
});
test('a paused clock repeats identically; backward seek and replay restore the authored state', () => {
  const frozen = sample(spec, 14); assert.deepEqual(sample(spec, 14), frozen);
  assert.equal(sample(spec, 17).opacity, 1); assert.equal(sample(spec, 12).opacity, 0); assert.equal(sample(spec, 10).opacity, 0);
  assert.equal(sample(spec, 50, 10, 14).opacity, 0); // the focus stop freezes before this floor's threshold
});
test('reduced motion and the end never activate future floors; eligible floors become static at focus', () => {
  const future = {...spec, floorIndex: 8};
  for (const reduced of [false, true]) for (const beat of [10, 18, 100]) assert.equal(sample(future, beat, 10, 30, reduced).opacity, 0);
  assert.equal(sample(spec, 9, 10, 30, true).opacity, 0); assert.equal(sample(spec, 10, 10, 30, true).opacity, 1);
});
test('retained eligible floors survive rewind and replay while exclusions stay authoritative', () => {
  const prior = {...spec, retainedFloors: [5]};
  for (const beat of [0, 10, 12, 100]) assert.equal(sample(prior, beat).opacity, 1);
  assert.equal(sample({...prior, activeFloors: [1]}, 100).opacity, 0);
});
test('a legacy sprout clips by whole floors, holds at the stop and is unclipped when reduced', () => {
  const legacy = {preset: 'sprout', floors: 8, beats: 8};
  for (const [beat, clip] of [[9, 'inset(100.000% 0 0 0)'], [10, 'inset(100.000% 0 0 0)'], [14, 'inset(50.000% 0 0 0)'], [18, 'inset(0.000% 0 0 0)']]) assert.deepEqual(sample(legacy, beat), {transform: 'none', filter: 'none', clipPath: clip});
  assert.equal(sample(legacy, 40, 10, 14).clipPath, 'inset(50.000% 0 0 0)'); assert.equal(sample(legacy, 14, 10, 30, true).clipPath, 'none');
  assert.deepEqual(sample({preset: 'still'}, 15), {transform: 'none', filter: 'none', clipPath: 'none'});
});
test('DOM application multiplies authored opacity and never clips an independent plane', () => {
  const target = {style: {}}, layer = {spec: {id: 'f5', opacity: .78}, element: target, cache: {}};
  const o = {d: {at: 10, layerMotion: [{layerId: 'f5', ...spec}]}, layerCrops: [layer]}, x = {exitStart: 30, exitEnd: 32, panels: [o]};
  ctx.panelFadeStart = () => 30; ctx.REDUCED = false;
  ctx.applyPanelMotion(o, x, 0, 14); assert.equal(target.style.opacity, '0'); assert.equal(target.style.clipPath, 'none');
  ctx.applyPanelMotion(o, x, 0, 15); assert.equal(target.style.opacity, '0.78');
  ctx.applyPanelMotion(o, x, 0, 15); assert.equal(target.style.opacity, '0.78');
  ctx.applyPanelMotion(o, x, 0, 10); assert.equal(target.style.opacity, '0');
  ctx.REDUCED = true; ctx.applyPanelMotion(o, x, 0, 10); assert.equal(target.style.opacity, '0.78'); ctx.REDUCED = false;
});

const scene = {id: 'init', art: 'master', layers: [{id: 'f5', role: 'light', src: '/comic/f5.png'}, {id: 'f8', role: 'light', src: '/comic/f8.png'}], panels: [{id: 'init-panel', layerMotion: [{layerId: 'f5', ...spec, floorSource: {sceneId: 'prior', panelId: 'prior-panel'}}]}]};
const story = {scenes: [{id: 'prior', panels: [{id: 'prior-panel'}]}, scene, {id: 'future', panels: [{id: 'future-panel'}]}]};
test('the layer gate accepts a current contribution and an excluded future contribution', () => {
  assert.deepEqual(comicLayerErrors(scene, story), []);
  const s = structuredClone(scene); s.panels[0].layerMotion.push({layerId: 'f8', ...spec, floorIndex: 8, floorSource: {sceneId: 'future', panelId: 'future-panel'}});
  assert.deepEqual(comicLayerErrors(s, {scenes: [story.scenes[0], s, story.scenes[2]]}), []);
});
test('img-based panel IDs bind once; duplicate source art IDs fail', () => {
  const actual = structuredClone(story); for (const s of actual.scenes) for (const p of s.panels) { p.img = p.id; delete p.id; }
  assert.deepEqual(comicLayerErrors(actual.scenes[1], actual), []);
  actual.scenes[0].panels.push({img: 'prior-panel'}); assert(comicLayerErrors(actual.scenes[1], actual).some(e => e.includes('floorSource')));
});
test('the layer gate rejects bad bounds, duplicate indexes, roles, future activation and a fabricated source binding', () => {
  const bads = [m => m.floorIndex = 0, m => m.floorIndex = 9, m => m.floorIndex = 1.5, m => m.activeFloors = [1, 1], m => m.activeFloors = [9], m => m.activeFloors = 'all', m => m.retainedFloors = [8], m => m.floorSource = {sceneId: 'none', panelId: 'none'}, m => m.floorSource = {sceneId: 'future', panelId: 'future-panel'}, m => m.floorSource.extra = 'unbound', m => delete m.floorIndex, m => m.preset = 'push'];
  for (const mutate of bads) { const s = structuredClone(scene); mutate(s.panels[0].layerMotion[0]); assert(comicLayerErrors(s, {...story, scenes: [story.scenes[0], s, story.scenes[2]]}).length, 'damaged motion accepted'); }
  const duplicate = structuredClone(scene); duplicate.panels[0].layerMotion.push({...duplicate.panels[0].layerMotion[0], layerId: 'f8'}); assert(comicLayerErrors(duplicate, story).some(e => e.includes('unique')));
  const wrongRole = structuredClone(scene); wrongRole.layers[0].role = 'humans'; assert(comicLayerErrors(wrongRole, story).some(e => e.includes('light')));
  const inconsistent = structuredClone(scene); inconsistent.panels[0].layerMotion.push({...inconsistent.panels[0].layerMotion[0], layerId: 'f8', floorIndex: 8, activeFloors: [1, 5, 8]}); assert(comicLayerErrors(inconsistent, story).some(e => e.includes('policy')));
});
test('the art gate receives whole-story contribution context', () => {
  const options = {publicDir: '/not-a-real-public', widths: [], resolveChoice: () => null};
  assert(!checkComicArt(story, options).some(([, message]) => message.includes('floorSource')));
  const broken = structuredClone(story); broken.scenes[1].panels[0].layerMotion[0].floorSource.panelId = 'invented';
  assert(checkComicArt(broken, options).some(([, message]) => message.includes('floorSource')));
});
test('measurement tells whole-plane opacity from a false legacy clip and skips static held/retained channels', () => {
  const before = {worldRect: [0, 0, 100, 100], width: 100, chain: [], filter: 'none', clipPath: 'none', transform: 'none', targetOpacity: 0}, after = {...before, targetOpacity: 1};
  assert.equal(channelMetrics(before, after, spec).pass, true); assert.equal(channelMetrics(before, before, spec).pass, false);
  assert.equal(channelMetrics(before, {...after, targetOpacity: .78}, {...spec, planeOpacity: .78}).pass, true);
  assert.equal(channelMetrics(before, {...before, clipPath: 'inset(50% 0 0 0)'}, spec).pass, false);
  assert.equal(motionPeakBeat(spec, 10, 30), 15.002);
  assert.equal(motionChannels(scene.panels[0], scene).length, 1);
  assert.equal(motionChannels({layerMotion: [{layerId: 'f8', ...spec, floorIndex: 8}]}, scene).length, 0);
  assert.equal(motionChannels({layerMotion: [{layerId: 'f5', ...spec, retainedFloors: [5]}]}, scene).length, 0);
});

const passed = results.filter(r => r.pass).length;
console.log(JSON.stringify({runtime, checks: results.length, passed, failed: results.filter(r => !r.pass), scope: 'runtime sampler/DOM application, layer and art gates, playback measurement; no browser acceptance'}, null, 2));
if (passed !== results.length) process.exitCode = 1;
