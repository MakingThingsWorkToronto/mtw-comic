// Phone layout regression (skill: mtw-comic-story, references/checks.md): the runtime's real phone reflow, authored
// phone pages and crop placement, tested as properties against controlled boxes and every current story's scenes,
// never a frozen layout or a pinned source hash. Every top-level runtime function is loaded, so a new helper cannot
// break the check. No browser, image-library mutation or visual claim.
// Usage: node site/scripts/comic-story-phone-regression.mjs [runtime.js] [site]
import assert from 'node:assert/strict';
import vm from 'node:vm';
import path from 'node:path';
import {registerHooks} from 'node:module';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {loadRuntimeFunctions, readRuntime, runtimeFunctions} from './lib/comic-runtime-functions.mjs';

const site = process.argv[3] ? path.resolve(process.argv[3]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtime = path.resolve(process.argv[2] || path.join(site, 'public/scripts/comic-story.js'));
registerHooks({resolve(spec, ctx, next) {
  try { return next(spec, ctx); } catch (e) { if (/^\.\.?\//.test(spec) && !/\.[a-z]+$/i.test(spec)) return next(spec + '.ts', ctx); throw e; }
}});
const load = rel => import(pathToFileURL(path.join(site, rel)));
const {checkComicPhone: phoneGate} = await load('scripts/comic-story-phone-check.mjs');
const {comicIssues} = await load('src/data/comic-stories/index.ts');
const {demoComic} = await load('src/data/comic-stories/demo.ts');
const stories = [...comicIssues.map(i => i.story), demoComic];

const source = readRuntime(runtime), fns = runtimeFunctions(source, runtime);
for (const name of ['phonePagesValid', 'authoredPhoneSheets', 'phoneSheets', 'placeCrops']) assert(fns.has(name), `runtime defines ${name}`);
// The generic reflow is phoneSheets without its authored-pages branch: the reference for scenes with no valid phonePages.
const authoredBranch = /\n\s*var authored = authoredPhoneSheets\([^)]*\);\s*\n\s*if \(authored\) return authored;/;
assert(authoredBranch.test(fns.get('phoneSheets')), 'phoneSheets tries authored pages first');
const generic = fns.get('phoneSheets').replace(authoredBranch, '');
const state = () => ({GUT: 5, mode: 'phone', PAGE: {artCropInsetPct: .8}});
const ctx = loadRuntimeFunctions(state(), source, {filename: runtime}), legacy = loadRuntimeFunctions(state(), source, {filename: runtime});
vm.runInContext(generic, legacy);
// The authoring gate, judged with the validator of the runtime under test.
const checkComicPhone = scene => phoneGate(scene, ctx.phonePagesValid);

const clean = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const model = (panels, phonePages) => ({d: {panels, phonePages}, panels: panels.map(d => ({d}))});
const sizes = [[362, 704], [360, 540], [720, 820]];
const results = [];
const test = (name, fn) => { try { fn(); results.push({name, pass: true}); } catch (e) { results.push({name, pass: false, error: e.message}); } };

const panels = ['a', 'b', 'c', 'd'].map(img => ({img, r: [0, 0, 1, .25]}));
const spanning = [[{img: 'a', r: [0, 0, .5, .5]}, {img: 'b', r: [.5, 0, .5, .25]}, {img: 'c', r: [.5, .25, .5, .25]}, {img: 'd', r: [0, .5, 1, .5]}]];

test('without phone pages the reflow is the generic algorithm and leaves the model untouched by the authored path', () => {
  const m = model(panels), untouched = JSON.stringify(m);
  assert.equal(ctx.authoredPhoneSheets(m, 362, 704, 8, 6), null); assert.equal(JSON.stringify(m), untouched);
  for (const size of sizes) { const a = model(panels), b = model(panels); ctx.phoneSheets(a, ...size, 8, 6); legacy.phoneSheets(b, ...size, 8, 6); assert.deepEqual(clean(a), clean(b)); }
});
for (const story of stories) test(`${story.id}: every scene passes the phone gate and lays out inside the phone page`, () => {
  for (const scene of story.scenes) {
    assert.deepEqual(checkComicPhone(scene), [], `${scene.id}: phone gate`);
    for (const [W, H] of sizes) {
      const a = model(clean(scene.panels), clean(scene.phonePages)), b = model(clean(scene.panels), clean(scene.phonePages));
      const sheets = ctx.phoneSheets(a, W, H, 8, 6);
      if (!ctx.phonePagesValid(a.d)) { legacy.phoneSheets(b, W, H, 8, 6); assert.deepEqual(clean(a), clean(b), `${scene.id}: generic reflow`); continue; }
      if (!sheets) continue;
      assert.equal(sheets.length, scene.phonePages.length, `${scene.id}: one sheet per authored phone page`);
      assert.deepEqual(sheets.flat().map(o => o.d.img), scene.panels.map(p => p.img), `${scene.id}: reading order`);
      for (const o of sheets.flat()) assert(o.box.x >= 8 && o.box.y >= 6 && o.box.x + o.box.w <= 8 + W && o.box.y + o.box.h <= 6 + H && o.box.w > 0 && o.box.h > 0, `${scene.id}/${o.d.img}: box inside the page`);
    }
  }
});
test('authored spanning pages tile edge to edge with exact gutters in reading order', () => {
  const m = model(panels, spanning); assert(ctx.phonePagesValid(m.d));
  const sheets = ctx.phoneSheets(m, 362, 704, 8, 6); assert.equal(sheets.length, 1);
  const [a, b, c, d] = m.panels.map(p => p.box), gut = state().GUT;
  assert.equal(a.x, 8); assert.equal(a.y, 6); assert.equal(b.x - a.x - a.w, gut); assert.equal(c.y - b.y - b.h, gut); assert.equal(d.y - a.y - a.h, gut);
  assert.equal(d.x, 8); assert.equal(d.w, 362); assert.equal(d.y + d.h, 6 + 704);
  assert.deepEqual(clean(sheets[0].map(p => p.d.img)), ['a', 'b', 'c', 'd']);
});
test('invalid authored pages are refused by runtime and gate and fall back to the generic reflow', () => {
  for (const change of [x => x[0].pop(), x => x[0][1].img = 'a', x => x[0][1].img = 'unknown', x => [x[0][0], x[0][1]] = [x[0][1], x[0][0]], x => x[0][0].r[2] = .6, x => x[0][0].r[2] = .4, x => x[0][0].r[0] = -.1, x => x[0][0].r[3] = 0, x => x.push([])]) {
    const bad = clean(spanning); change(bad); const a = model(panels, bad), b = model(panels, bad);
    assert(!ctx.phonePagesValid(a.d)); assert(checkComicPhone(a.d).length);
    ctx.phoneSheets(a, 362, 704, 8, 6); legacy.phoneSheets(b, 362, 704, 8, 6); assert.deepEqual(clean(a), clean(b));
  }
  assert(!ctx.phonePagesValid(model(panels.map((p, i) => ({...p, inset: i === 2})), spanning).d), 'insets cannot be authored onto phone pages');
});
test('phone captions admit runtime free anchors/paragraph reflow while words, casting, audio and fake anchors remain forbidden', () => {
  const scene=()=>({panels:panels.map((p,i)=>({...p,balloons:i===0?[{kind:'place',phone:{anchor:'free',reflow:'paragraph',x:.02,y:.02,w:.9}}]:[]})),phonePages:clean(spanning)});
  assert.deepEqual(checkComicPhone(scene()),[]);
  const legacyFreeSpeech=scene();legacyFreeSpeech.panels[0].balloons[0].kind='speech';delete legacyFreeSpeech.panels[0].balloons[0].phone.reflow;assert.deepEqual(checkComicPhone(legacyFreeSpeech),[],'retained legacy free-anchor field remains accepted');
  for(const kind of ['caption','place']){const s=scene();s.panels[0].balloons[0].kind=kind;assert.deepEqual(checkComicPhone(s),[]);}
  for(const change of [b=>b.kind='speech',b=>b.phone.anchor='mouth',b=>b.phone.reflow='shrink',b=>b.phone.text='Rewritten',b=>b.phone.who='codex',b=>b.phone.speech={src:'/paid.mp3'},b=>b.phone.tail=[NaN,.5]]){
    const s=scene();change(s.panels[0].balloons[0]);assert(checkComicPhone(s).length,'invalid runtime/copy override rejected');
  }
});
test('a valid tile too small for the window is refused whole, without partial mutation', () => {
  const tiny = model([{img: 'a', r: [0, 0, .5, 1]}, {img: 'b', r: [.5, 0, .5, 1]}], [[{img: 'a', r: [0, 0, .0001, 1]}, {img: 'b', r: [.0001, 0, .9999, 1]}]]), before = JSON.stringify(tiny);
  assert.equal(ctx.authoredPhoneSheets(tiny, 362, 704, 8, 6), null); assert.equal(JSON.stringify(tiny), before);
});

// Crop placement. A 1000x500 raster art region [0,0,1,1] in a 100x100 box: the inset trims insetPct% of the short side
// (500) from each edge, then the region covers the box, centred unless the mode's cropFocus says otherwise.
function crop(box, focus, inset) {
  const panel = {d: {r: [0, 0, 1, 1], cropFocus: focus}, box}, c = {style: {}};
  ctx.placeCrops({d: {artCropInsetPct: inset}, art: {raster: true, vw: 1000, vh: 500}, panels: [panel], crops: [c]});
  return c.style;
}
const px = v => v.toFixed(1) + 'px';
const cover = (inset, fx = .5) => { const ins = 500 * inset / 100, rw = 1000 - 2 * ins, rh = 500 - 2 * ins, s = Math.max(100 / rw, 100 / rh); return {backgroundSize: `${px(1000 * s)} ${px(500 * s)}`, backgroundPosition: `${px(-(ins * s + (rw * s - 100) * fx))} ${px(-(ins * s + (rh * s - 100) * .5))}`}; };
test('crops cover the box after the inset, centred by default and with a zero inset', () => {
  assert.deepEqual(clean(crop({w: 100, h: 100})), cover(.8));
  assert.deepEqual(clean(crop({w: 100, h: 100}, undefined, 0)), cover(0));
});
test('crop focus follows the current mode only and is clamped; invalid focus centres', () => {
  assert.equal(crop({w: 100, h: 100}, {phone: [0, 0]}, 0).backgroundPosition, cover(0, 0).backgroundPosition);
  assert.equal(crop({w: 100, h: 100}, {phone: [1, 1]}, 0).backgroundPosition, cover(0, 1).backgroundPosition);
  ctx.mode = 'page';
  try {
    assert.equal(crop({w: 100, h: 100}, {phone: [0, 0]}, 0).backgroundPosition, cover(0).backgroundPosition);
    assert.equal(crop({w: 100, h: 100}, {page: [1, 1]}, 0).backgroundPosition, cover(0, 1).backgroundPosition);
  } finally { ctx.mode = 'phone'; }
  assert.equal(crop({w: 100, h: 100}, {phone: [-4, 8]}, 0).backgroundPosition, cover(0, 0).backgroundPosition);
  assert.equal(crop({w: 100, h: 100}, {phone: [NaN, Infinity]}, 0).backgroundPosition, cover(0).backgroundPosition);
});
test('a phone art area contains the whole source region, leaving lettering space, and is undone on desktop', () => {
  const contained = {d: {phonePages: true, artCropInsetPct: 0}, art: {raster: true, vw: 1200, vh: 800}, panels: [{d: {r: [.25, .25, .5, .5], phoneArt: [0, .2, 1, .5]}, box: {w: 360, h: 700}}], crops: [{style: {}}]};
  ctx.placeCrops(contained); const css = contained.crops[0].style;
  // Source region 600x400 contained in a 360x350 slot: scale 0.6, 360x240, centred vertically in the slot.
  assert.equal(css.width, '360.0px'); assert.equal(css.height, '240.0px'); assert.equal(css.top, px(700 * .2 + (350 - 240) / 2));
  assert.equal(css.backgroundPosition, `${px(-300 * .6)} ${px(-200 * .6)}`); assert.equal(css.backgroundSize, `${px(1200 * .6)} ${px(800 * .6)}`);
  ctx.mode = 'page';
  try { ctx.placeCrops(contained); assert.equal(css.width, ''); assert.equal(css.height, ''); assert.equal(css.top, ''); assert.equal(contained.crops[0].phoneContained, false); }
  finally { ctx.mode = 'phone'; }
});
test('the phone gate refuses bad focus, inset, phone art and phone-only balloon text', () => {
  assert(checkComicPhone({panels: [{img: 'x', cropFocus: {phone: [2, .5]}}]}).length);
  assert(checkComicPhone({panels: [], artCropInsetPct: -1}).length); assert.equal(checkComicPhone({panels: [], artCropInsetPct: 0}).length, 0);
  assert(checkComicPhone({panels: [{img: 'x', phoneArt: [0, 0, 1, 1]}]}).length);
  assert(checkComicPhone({phonePages: [[{img: 'x', r: [0, 0, 1, 1]}]], panels: [{img: 'x', balloons: [{phone: {text: 'changed'}}]}]}).length);
  assert(checkComicPhone({phonePages: [[{img: 'x', r: [0, 0, 1, 1]}]], panels: [{img: 'x', phoneArt: [0, .8, 1, .4]}]}).length);
});

test('tall phone canvas is optional, phone-only, viewport-minimum and capped at3000pixels',()=>{
  assert.equal(ctx.phoneCanvasHeight({},700,'phone'),700);
  assert.equal(ctx.phoneCanvasHeight({phonePageHeight:1800},700,'phone'),1800);
  assert.equal(ctx.phoneCanvasHeight({phonePageHeight:1800},700,'page'),700);
  assert.equal(ctx.phoneCanvasHeight({phonePageHeight:20},700,'phone'),700);
  assert.equal(ctx.phoneCanvasHeight({phonePageHeight:9999},700,'phone'),3000);
  assert.equal(ctx.phoneCanvasHeight({phonePageHeight:NaN},700,'phone'),700);
});
test('tall native scroll follows changed focus/explicit seek while retaining manual paused scroll',()=>{
  const view={scrollTop:0,setAttribute(){},removeAttribute(){}},cam={style:{}},attrs={},stage={setAttribute:(k,v)=>attrs[k]=v};
  Object.assign(ctx,{view,cam,stage,vw:390,vh:640,PAD:6,mode:'phone',phoneScrollForce:false,phoneScrollFocus:''});
  const panels=[0,1,2,3].map(i=>({d:{at:i*10},box:{y:i*450,w:370,h:440}}));
  const m={si:2,h:1800,panels,times:[{start:0,panels}]};ctx.syncPhoneScroll(m,0);
  assert.equal(attrs['data-phone-scroll'],'true');assert.equal(cam.style.height,'1812px');
  ctx.syncPhoneScroll(m,20);assert.equal(view.scrollTop,900);
  view.scrollTop=1100;ctx.syncPhoneScroll(m,20);assert.equal(view.scrollTop,1100,'Repeated paused sample never steals manual scroll');
  ctx.phoneScrollForce=true;ctx.syncPhoneScroll(m,10);assert.equal(view.scrollTop,450,'Explicit seek returns to requested box');
  ctx.syncPhoneScroll({si:3,h:628,panels,times:[{start:0,panels}]},0);assert.equal(view.scrollTop,0);assert.equal(attrs['data-phone-scroll'],'false');
});
const passed = results.filter(r => r.pass).length;
console.log(JSON.stringify({runtime, stories: stories.map(s => s.id), checks: results.length, passed, failed: results.filter(r => !r.pass), scope: 'runtime phone layout and crop math; no visual review implied'}, null, 2));
if (passed !== results.length) process.exitCode = 1;
