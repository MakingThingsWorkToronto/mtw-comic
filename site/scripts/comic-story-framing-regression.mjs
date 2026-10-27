import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {checkDeviceReview,sourceToScreen,checkActiveArt,captureActiveArt} from './comic-story-framing-check.mjs';
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
const scene={width:1000,height:600,masterSha256:'a'.repeat(64)};
const device=(surface,uiVisible)=>({deviceReview:{reviewed:true,devices:[{label:'test device',surface,uiVisible,operatorView:'faces-screen',sourcePixelRect:[10,20,100,50]}]}});
for(const [surface,ui] of [['front',true],['front',false],['back',false],['edge',false],['hologram',true]]) test(surface+'/'+ui+' allowed',()=>assert.deepEqual(checkDeviceReview(device(surface,ui),scene,true),[]));
for(const [surface,ui] of [['back',true],['edge',true],['unknown',false]]) test(surface+'/'+ui+' blocked',()=>assert(checkDeviceReview(device(surface,ui),scene,true).length));
test('required front UI without operator view blocked',()=>{const p=device('front',true);delete p.deviceReview.devices[0].operatorView;assert(checkDeviceReview(p,scene,true).length)});
test('front screen facing away from operator blocked',()=>{const p=device('front',true);p.deviceReview.devices[0].operatorView='faces-away';assert(checkDeviceReview(p,scene,true).length)});
test('front close-up without visible operator allowed',()=>{const p=device('front',true);p.deviceReview.devices[0].operatorView='no-visible-operator';assert.deepEqual(checkDeviceReview(p,scene,true),[])});
test('legacy optional orientation remains readable',()=>{const p=device('front',true);delete p.deviceReview.devices[0].operatorView;assert.deepEqual(checkDeviceReview(p,scene,false),[])});
test('required missing audit blocked',()=>assert(checkDeviceReview({},scene,true).length));
test('legacy optional missing audit preserved',()=>assert.deepEqual(checkDeviceReview({},scene,false),[]));
test('unreviewed declaration blocked',()=>assert(checkDeviceReview({deviceReview:{reviewed:false,devices:[]}},scene,true).length));
test('source hash required',()=>assert(checkDeviceReview(device('front',true),{...scene,masterSha256:''},true).length));
for(const r of [[-1,2,10,10],[1,2,0,10],[999,2,10,10],[1,2,NaN,10]]) test('bad rectangle '+String(r),()=>{const p=device('front',true);p.deviceReview.devices[0].sourcePixelRect=r;assert(checkDeviceReview(p,scene,true).length)});
function near(a,b){a.forEach((v,i)=>assert(Math.abs(v-b[i])<1e-8));}
test('untransformed source projection',()=>near(sourceToScreen([100,50,100,50],[1000,600],[500,300],[-20,-10],[30,30,200,100],[200,100]),[60,45,50,25]));
test('push projection respects transform',()=>near(sourceToScreen([100,50,100,50],[1000,600],[500,300],[-20,-10],[29,29.5,202,101],[200,100]),[59.3,44.65,50.5,25.25]));
test('drift projection respects translation',()=>near(sourceToScreen([100,50,100,50],[1000,600],[500,300],[-20,-10],[31,30,200,100],[200,100]),[61,45,50,25]));
test('browser projection is the actual checked function',()=>{const runtime=readFileSync(new URL('./comic-story-art-review.mjs',import.meta.url),'utf8');const fn=sourceToScreen.toString();assert(runtime.includes(fn.split('\n').map(line=>'            '+line).join('\n')));assert(runtime.includes('const screen = sourceToScreen(s.sourcePixelRect'));assert(runtime.includes("args.includes('--require-device-audit')"));});

const active={status:'ready',kind:'view',viewId:'detail',src:'/comic/detail.png',canonicalSource:{path:'wiki/image-library/assets/detail.png',sha256:'a'.repeat(64)},actualAliasSha256:'b'.repeat(64),nativeDimensions:[1200,800],sourceROI:[0,0,1200,800],backgroundSize:[600,400],backgroundPosition:[0,0],cropRect:[0,0,600,400],cssSize:[600,400],devicePixelRatio:2,planes:[]};
const current={activeArtSources:[{viewId:'detail',canonicalSource:active.canonicalSource,sourceDimensions:[1200,800],aliases:[{src:'/comic/detail.png',sha256:'b'.repeat(64),dimensions:[1200,800]}],protectedSubjects:[{label:'evidence',sourcePixelRect:[10,10,100,100]}]}]};
test('actual current selected alias/dimensions/byte binding allows source geometry review',()=>assert.deepEqual(checkActiveArt(active,current).errors,[]));
test('old hidden source hash or master dimensions cannot supply current view proof',()=>{
 for(const mutate of [a=>a.activeArtSources[0].canonicalSource={...active.canonicalSource,sha256:'c'.repeat(64)},a=>a.activeArtSources[0].aliases[0].dimensions=[9999,99],a=>a.activeArtSources[0].viewId='old-hidden']){const a=structuredClone(current);mutate(a);assert(checkActiveArt(active,a).errors.length);}
});
test('actual display CSS times DPR detects low cropped resolution despite named alias',()=>{const a={...active,src:'/comic/detail-1600.png',devicePixelRatio:3};const c=structuredClone(current);c.activeArtSources[0].aliases[0].src=a.src;assert(checkActiveArt(a,c).errors.some(e=>e.includes('CSS×DPR')));});
test('cover clipping essential subject is rejected even when rectangle fills',()=>{const a={...active,backgroundPosition:[-100,0]};const c=structuredClone(current);c.activeArtSources[0].protectedSubjects[0].sourcePixelRect=[0,0,100,100];assert(checkActiveArt(a,c).errors.some(e=>e.includes('clipped')));});
test('wrong group canvas or actor mask registration is rejected',()=>{const a={...active,planes:[{nativeDimensions:[600,400],backgroundSize:active.backgroundSize,backgroundPosition:active.backgroundPosition}]};assert(checkActiveArt(a,current).errors.some(e=>e.includes('canvas')));a.planes=[{nativeDimensions:active.nativeDimensions,backgroundImage:'url(actor.png)',backgroundSize:active.backgroundSize,backgroundPosition:active.backgroundPosition,mask:{image:'url(actor.png)',size:'700px 400px',position:'0px 0px'}}];assert(checkActiveArt(a,current).errors.some(e=>e.includes('mask')));});
test('declared canonical hash without actual selected alias bytes does not pass',()=>{const a={...active};delete a.actualAliasSha256;assert(checkActiveArt(a,current).errors.some(e=>e.includes('byte hash')));});
test('every visible group plane needs its actual current source and alias bytes, not just background',()=>{
 const group=structuredClone(active);group.kind='view-group';group.planes=[{id:'bg',src:active.src,canonicalSource:active.canonicalSource,nativeDimensions:active.nativeDimensions,actualAliasSha256:active.actualAliasSha256,backgroundSize:active.backgroundSize,backgroundPosition:active.backgroundPosition,rect:active.cropRect,cssSize:active.cssSize},{id:'actor',src:'/comic/actor.png',canonicalSource:{path:'wiki/image-library/assets/actor.png',sha256:'c'.repeat(64)},nativeDimensions:active.nativeDimensions,actualAliasSha256:'d'.repeat(64),backgroundSize:active.backgroundSize,backgroundPosition:active.backgroundPosition,rect:active.cropRect,cssSize:active.cssSize}];
 const annotated=structuredClone(current);annotated.activeArtSources[0].planes=group.planes.map(p=>({id:p.id,canonicalSource:p.canonicalSource,aliases:[{src:p.src,sha256:p.actualAliasSha256,dimensions:p.nativeDimensions}]}));assert.deepEqual(checkActiveArt(group,annotated).errors,[]);
 group.planes[1].actualAliasSha256='e'.repeat(64);assert(checkActiveArt(group,annotated).errors.some(e=>e.includes('actor')));
});
let reads=0,captures=0;const old={...active,src:'/comic/old.png',viewId:'old',nativeDimensions:[9999,99]};
const captured=await captureActiveArt(async()=>({panels:[{scene:'s',imageId:'box',activeArt:structuredClone(captures++===0?old:active)}]}),async src=>{reads++;return {sha256:'b'.repeat(64),dimensions:src==='/comic/old.png'?[9999,99]:[1200,800]};});
test('late selection while binding retries current identity rather than capturing hidden previous crop',()=>{assert.equal(captured.panels[0].activeArt.viewId,'detail');assert.deepEqual(captured.panels[0].activeArt.nativeDimensions,[1200,800]);assert.equal(reads,2);});
let sample=0;const latest=await captureActiveArt(async()=>({panels:[{scene:'s',imageId:'box',activeArt:{...structuredClone(active),cropRect:[sample++,0,600,400]}}]}),async()=>({sha256:'b'.repeat(64),dimensions:[1200,800]}));
test('stable source byte binding returns newest measured pose instead of earlier geometry',()=>assert.equal(latest.panels[0].activeArt.cropRect[0],1));

const reviewer=readFileSync(new URL('./comic-story-art-review.mjs',import.meta.url),'utf8');
const callbackBlock=reviewer.slice(reviewer.indexOf('          const activeGeometry ='),reviewer.indexOf('          const sampledIds ='));
const element={dataset:{box:'0'},parentElement:null,getBoundingClientRect:()=>({x:0,y:0,width:600,height:400}),querySelectorAll:()=>[],querySelector:selector=>{assert.notEqual(selector,'.cs-crop');return element;}};
const rootElement={dataset:{scene:'s'},classList:{contains:()=>true},parentElement:null,contains:()=>true,querySelectorAll:selector=>selector==='.cs-panel'?[element]:[]};
const context={source:{id:'s',panels:[{imageId:'box'}]},scene:{id:'s',panels:[{img:'box'}]},moment:{panelImageIds:['box']},report:{errors:[]},readActiveAlias:()=>{},captureActiveArt:async()=>({panels:[{scene:'s',imageId:'box',activeArt:structuredClone(active)}]}),checkActiveArt:()=>({errors:[],expected:{sourceDimensions:[1200,800],protectedSubjects:[{label:'current evidence',sourcePixelRect:[100,50,100,50]}]}}),document:{querySelectorAll:()=>[rootElement],elementsFromPoint:()=>[]},getComputedStyle:()=>({opacity:'1',display:'block',visibility:'visible'}),innerWidth:600,innerHeight:400};
context.page={evaluate:async(fn,arg)=>{context.argument=arg;return vm.runInNewContext('('+fn.toString()+')(argument)',context);}};
const exercised=await vm.runInNewContext('(async()=>{'+callbackBlock+'return inspection;})()',context);
test('art reviewer passes current-source data into its real frame callback without hidden crop selection',()=>{assert.equal(exercised[0].subjects[0].label,'current evidence');assert.deepEqual(Array.from(exercised[0].subjects[0].screen),[50,25,50,25]);assert.equal(exercised[0].missing,undefined);});
console.log(JSON.stringify({passed,scope:'actual pure gate/projection and browser function equality; no browser/art approval'}));
