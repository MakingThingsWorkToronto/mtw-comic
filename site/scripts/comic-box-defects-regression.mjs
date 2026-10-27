// Offline fixtures for comic-box-defects.mjs: node scripts/comic-box-defects-regression.mjs (from site/).
// Synthetic story data only; this proves the rules fire and stay quiet, not that any real box looks or sounds right.
import assert from 'node:assert/strict';
import { comicBoxDefectWarnings, SPEECH_WORD_LIMIT } from './comic-box-defects.mjs';

const box = (over = {}) => ({ img: 'b', motion: { preset: 'still' }, sfx: [], balloons: [], ...over });
const story = (scenes) => ({ scenes });
const only = (n, list) => list.filter((m) => m.startsWith(`box-defect ${n} `));
const checks = [];
const is = (label, fn) => { fn(); checks.push(label); };

const twelve = Array.from({ length: SPEECH_WORD_LIMIT }, (_, i) => 'w' + i).join(' ');
is('12-word speech passes; 13 words warns defect 3', () => {
  assert.equal(only(3, comicBoxDefectWarnings(story([{ id: 's', panels: [box({ sfx: [{ kind: 'click' }], balloons: [{ kind: 'speech', text: twelve }] })] }]))).length, 0);
  assert.equal(only(3, comicBoxDefectWarnings(story([{ id: 's', panels: [box({ sfx: [{ kind: 'click' }], balloons: [{ kind: 'speech', text: twelve + ' more' }] })] }]))).length, 1);
});
is('captions and the opening sceneSetup are not speech', () => {
  const long = twelve + ' and then several more words';
  const w = comicBoxDefectWarnings(story([{ id: 's', panels: [box({ sfx: [{ kind: 'click' }], balloons: [{ kind: 'caption', text: long }, { kind: 'caption', sceneSetup: true, text: long }, { kind: 'place', text: long }] })] }]));
  assert.equal(only(3, w).length, 0);
});
is('burst, thought and fear balloons count as speech', () => {
  for (const kind of ['burst', 'thought', 'fear']) assert.equal(only(3, comicBoxDefectWarnings(story([{ id: 's', panels: [box({ sfx: [{ kind: 'click' }], balloons: [{ kind, text: twelve + ' x' }] })] }]))).length, 1, kind);
});
is('action effect on a still box warns defect 7; panel motion or a moving layer clears it', () => {
  const sfx = [{ kind: 'impact' }];
  assert.equal(only(7, comicBoxDefectWarnings(story([{ id: 's', panels: [box({ sfx })] }]))).length, 1);
  assert.equal(only(7, comicBoxDefectWarnings(story([{ id: 's', panels: [box({ sfx, motion: undefined })] }]))).length, 1, 'missing motion is still');
  assert.equal(only(7, comicBoxDefectWarnings(story([{ id: 's', panels: [box({ sfx, motion: { preset: 'push' } })] }]))).length, 0);
  const layers=[{id:'fg',role:'humans',src:'/comic/test/fg.png'},{id:'bg',role:'background',src:'/comic/test/bg.png'}];
  assert.equal(only(7, comicBoxDefectWarnings(story([{ id: 's',art:'/comic/test/page',layers, panels: [box({ sfx, layerMotion: [{ layerId: 'fg', preset: 'still' }, { layerId: 'bg', preset: 'drift-left' }] })] }]))).length, 0);
  assert.equal(only(7, comicBoxDefectWarnings(story([{ id: 's', panels: [box({ sfx, layerMotion: [{ layerId: 'fg', preset: 'still' }] })] }]))).length, 1, 'all-still layers');
});
is('validated distinct ordered source views count; duplicate sources, invalid timing and invented presets do not',()=>{
  const views=[{id:'a',at:0,src:'/comic/test/a.png',alt:'First actual pose'},{id:'b',at:2,src:'/comic/test/b.png',alt:'Second actual pose'}];
  const data=v=>story([{id:'s',art:'/comic/test/page',l:20,panels:[box({at:0,sfx:[{kind:'impact'}],views:v})]}]);
  assert.equal(only(7,comicBoxDefectWarnings(data(views))).length,0);
  assert.equal(only(7,comicBoxDefectWarnings(data([views[0],{...views[1],src:views[0].src}]))).length,1,'same pixels/source with new id is not motion');
  assert.equal(only(7,comicBoxDefectWarnings(data([views[0],{...views[1],at:.2}]))).length,1,'invalid dwell cannot supply motion');
  assert.equal(only(7,comicBoxDefectWarnings(story([{id:'s',panels:[box({sfx:[{kind:'impact'}],motion:{preset:'invented'}})]}]))).length,1);
  assert.equal(only(7,comicBoxDefectWarnings(story([{id:'s',panels:[box({sfx:[{kind:'impact'}],layerMotion:[{layerId:'missing',preset:'push'}]})]}]))).length,1,'unbound layer cannot supply motion');
});
is('moving view-local prop layers count only with a valid bound group',()=>{
  const authority={panelId:'b',path:'wiki/image-library/assets/scenes/test/base.png',sha256:'a'.repeat(64),recordId:'test',treatment:'comic-ink'};
  const view={id:'group',at:0,src:'/comic/test/base.png',ar:[0,0,1,1],alt:'Grounded tram',canonicalSource:authority,layers:[{id:'bg',role:'background',src:'/comic/test/base.png',canonicalSource:authority},{id:'tram',role:'props',src:'/comic/test/tram.png',canonicalSource:{...authority,path:'wiki/image-library/assets/scenes/test/tram.png',sha256:'b'.repeat(64),recordId:'tram'}}],layerMotion:[{layerId:'bg',preset:'still'},{layerId:'tram',preset:'travel',beats:4,from:[0,0],to:[.1,0]}]};
  const data=v=>story([{id:'s',art:'/comic/test/page',l:20,panels:[box({at:0,sfx:[{kind:'whoosh'}],views:[v]})]}]);
  assert.equal(only(7,comicBoxDefectWarnings(data(view))).length,0);
  assert.equal(only(7,comicBoxDefectWarnings(data({...view,layerMotion:[view.layerMotion[0],{...view.layerMotion[1],layerId:'missing'}]}))).length,1);
  assert.equal(only(7,comicBoxDefectWarnings(data({...view,layers:[view.layers[0]]}))).length,1);
});
is('room-tone effects (keys, buzz, transit) on a still box are not an action', () => {
  assert.equal(only(7, comicBoxDefectWarnings(story([{ id: 's', panels: [box({ sfx: [{ kind: 'keys' }, { kind: 'buzz' }, { kind: 'transit' }] })] }]))).length, 0);
});
is('scene with effects in fewer than one box in three warns defect 5', () => {
  const silent = Array.from({ length: 6 }, () => box());
  assert.equal(only(5, comicBoxDefectWarnings(story([{ id: 's', panels: silent }]))).length, 1);
  const scored = silent.map((p, i) => (i % 3 === 0 ? { ...p, sfx: [{ kind: 'paper' }] } : p));
  assert.equal(only(5, comicBoxDefectWarnings(story([{ id: 's', panels: scored }]))).length, 0);
});
is('continues:true page splits are scored with their parent scene, not alone', () => {
  const w = comicBoxDefectWarnings(story([
    { id: 'parent', panels: [box({ sfx: [{ kind: 'door' }], motion: { preset: 'push' } }), box(), box()] },
    { id: 'parent-2', continues: true, panels: [box({ sfx: [{ kind: 'paper' }] }), box(), box()] },
  ]));
  assert.equal(only(5, w).length, 0, w.join('\n'));
  const short = comicBoxDefectWarnings(story([
    { id: 'parent', panels: [box(), box(), box()] }, { id: 'parent-2', continues: true, panels: [box(), box(), box({ sfx: [{ kind: 'paper' }] })] },
  ]));
  assert.deepEqual(only(5, short).map((m) => m.split(':')[1].trim().split(' ')[1]), ['parent']);
});
is('empty or malformed stories do not throw', () => {
  assert.deepEqual(comicBoxDefectWarnings(undefined), []);
  assert.deepEqual(comicBoxDefectWarnings({ scenes: [{ id: 'e', panels: [] }] }), []);
});
console.log(JSON.stringify({ status: 'pass', checks, limitations: 'Synthetic story data only. No pixel, listening, copy-quality or browser review.' }, null, 2));
