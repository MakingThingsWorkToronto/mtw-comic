// Actual runtime/DOM/load/transport functions with controlled decoders; tiny real container/lineage fixtures.
// No browser, native reader, artwork approval or listening claim.
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {createRequire,syncBuiltinESMExports} from 'node:module';import {fileURLToPath,pathToFileURL} from 'node:url';import {loadRuntimeFunctions,readRuntime,topLevelStatements} from './lib/comic-runtime-functions.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),site=path.resolve(process.argv[4]||path.join(here,'..')),runtime=path.resolve(process.argv[2]||path.join(site,'public/scripts/comic-story.js')),contract=path.resolve(process.argv[3]||path.join(here,'comic-view-contract.mjs')),source=readRuntime(runtime),{comicViewErrors,comicViewAssetErrors,comicViewWindowErrors}=await import(pathToFileURL(contract)),results=[];
const test=async(name,fn)=>{try{await fn();results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.stack});}},flush=async()=>{for(let i=0;i<40;i++)await Promise.resolve();};
function node(){const classes=new Set();return {style:{},attrs:{},children:[],classList:{add(k){classes.add(k);},remove(k){classes.delete(k);},contains(k){return classes.has(k);},toggle(k,on){if(on)classes.add(k);else classes.delete(k);}},appendChild(c){this.children.push(c);},removeChild(c){this.children.splice(this.children.indexOf(c),1);},setAttribute(k,v){this.attrs[k]=v;}};}
const authority={panelId:'box',path:'wiki/image-library/assets/proof/master.png',sha256:'a'.repeat(64),recordId:'proof',treatment:'comic-ink'};
const baseSpec={src:'/comic/test/evidence.avif',ar:[0,0,1,1],alternates:['/comic/test/evidence.webp','/comic/test/evidence.png'],canonicalSource:authority};
const sourceScenes=Array.from({length:8},(_,i)=>({id:'source-'+(i+1),b:i,l:1,panels:[{img:'source-box-'+(i+1),at:0}]}));
const group={id:'archive',at:0,src:'/comic/test/base.png',ar:[952/1536,8/1024,451/1536,958/1024],alt:'Retained archive and three new actual contributions.',canonicalSource:authority,layers:[{id:'base',src:'/comic/test/base.png',role:'background',canonicalSource:authority},...Array.from({length:8},(_,i)=>({id:'floor-'+(i+1),src:'/comic/test/floor-'+(i+1)+'.png',role:'light',opacity:1,canonicalSource:{...authority,path:'wiki/image-library/assets/proof/floor-'+(i+1)+'.png',recordId:'floor-'+(i+1)}}))],layerMotion:[{layerId:'base',preset:'still'},...Array.from({length:8},(_,i)=>({layerId:'floor-'+(i+1),preset:'sprout',floors:8,floorIndex:i+1,activeFloors:[1,2,3,4,5,6,7,8],retainedFloors:[1,2,3,4,5],beats:i===5?8/3:i===6?32/7:i===7?6:8,floorSource:{sceneId:'source-'+(i+1),panelId:'source-box-'+(i+1)}}))]};
const valid={id:'learning',b:20,l:28,art:'/comic/test/old-master',panels:[{img:'box',alt:'Actual owning context.',at:1,r:[0,0,1,1],pageArt:[.23,.1,.75,.88],phoneArt:[.02,.446,.96,.514],motion:{preset:'still'},views:[group,{id:'context',at:8,src:'/comic/test/context.png',alt:'Matt names the archive.'}]}]};
const storyFor=s=>({scenes:[...structuredClone(sourceScenes),s]});
function fixture(){const images=[],timers=new Map(),events={};let timer=0;class Image{constructor(){images.push(this);}set src(v){this._src=v;}get src(){return this._src;}decode(){return this.badDecode?Promise.reject(Error('bad decode')):Promise.resolve();}finish(w=1200,h=800){this.naturalWidth=w;this.naturalHeight=h;if(this.onload)this.onload();}fail(){if(this.onerror)this.onerror();}}
 const context={Image,Promise,Number,Math,JSON,isFinite,mode:'desktop',REDUCED:false,PAGE:{},B:.5,T:12,REVEAL:2,ENTER:1,GHOST:.3,window:{addEventListener(k,f){events[k]=f;},removeEventListener(k){delete events[k];}},document:{addEventListener(k,f){events[k]=f;},removeEventListener(k){delete events[k];}},setTimeout(fn,ms){timers.set(++timer,{fn,ms});return timer;},clearTimeout(id){timers.delete(id);},el(tag,cls,parent){const n=node();n.className=cls;parent.appendChild(n);return n;},artUrl:s=>s,snap:v=>v,sheetAt:()=>0};
 loadRuntimeFunctions(context,source,{filename:runtime});vm.runInContext(topLevelStatements(source,/layerArtDisposed|disposeLayerArt|layerPageHide/,runtime),context);
 const o={d:structuredClone(valid.panels[0]),el:node(),art:node(),box:{w:390,h:640},loaded:true,cache:{},balloons:[],layers:[],rain:[],flick:[],floors:[]},base=node(),m={d:structuredClone(valid),page:node(),panels:[o],crops:[base]};m.times=[{start:0,exitStart:34,exitEnd:36,panels:[o]}];context.m=m;const run=s=>vm.runInContext(s,context),render=beat=>{context.T=(m.d.b+beat)*context.B;run(`renderPanels(m,${beat},0,${context.T})`);};context.render=t=>run(`renderPanels(m,${t}/B-m.d.b,0,${t})`);
 return {images,timers,events,context,o,m,base,run,render,image:src=>images.find(i=>i.src===src),expire(){for(const [id,{fn}]of [...timers])if(timers.has(id)){timers.delete(id);fn();}}};}
async function decoded({phone=false,reduced=false}={}){
 const f=fixture();f.context.mode=phone?'phone':'desktop';f.context.REDUCED=reduced;f.run('loadPanelViews(m)');f.render(1);
 for(const im of f.images)im.finish(1536,1024);await flush();return f;
}
const floor=f=>f.o.viewLayerCrops.slice(1).map(l=>Number(l.element.style.opacity));
await test('actual whole-story gate accepts eight real anchored planes and retained floors',()=>assert.deepEqual(comicViewErrors(valid,storyFor(valid)),[]));
await test('one persistent archive group retains eligible light planes without a fabricated second cut',()=>{
 const s=structuredClone(valid);s.panels[0].views=[structuredClone(group)];
 assert.deepEqual(comicViewErrors(s,storyFor(s)),[]);
 s.panels[0].views[0].layerMotion=s.panels[0].views[0].layerMotion.map(m=>({...m,preset:'still'}));
 assert(comicViewErrors(s,storyFor(s)).some(error=>error.includes('persistent')),'An inert flat group is not an archive action');
});
const persistentAgent={id:'projection',at:0,src:'/comic/test/base.png',ar:[0,0,1,1],alt:'Solid room and one translucent digital agent.',canonicalSource:authority,layers:[{id:'base',src:'/comic/test/base.png',role:'background',canonicalSource:authority},{id:'agent',src:'/comic/test/agent.png',role:'agents',opacity:.72,canonicalSource:{...authority,path:'wiki/image-library/assets/proof/agent.png',recordId:'agent'}},{id:'paper',src:'/comic/test/paper.png',role:'props',opacity:1,canonicalSource:{...authority,path:'wiki/image-library/assets/proof/paper.png',recordId:'paper'}}],layerMotion:[{layerId:'base',preset:'still'},{layerId:'agent',preset:'projection',fabrication:true,beats:6,strength:.9},{layerId:'paper',preset:'still'}]};
const actorPlacement={sourceROI:[.4,.1,.2,.8],slot:[.6,.05,.35,.9],fit:'contain',speakerIds:['codex'],phone:{sourceROI:[.4,.1,.2,.8],slot:[.05,.05,.4,.9],fit:'contain',speakerIds:['codex']}};
// Complete source-owned groups, with one shared native alpha canvas and independent pose ROIs.
function fallbackFixture(){
 const f=fixture();f.o.d.pageArt=f.o.d.phoneArt=[0,0,1,1];f.o.d.staticArt=structuredClone(baseSpec);
 f.o.d.views=['desktop','phone'].flatMap(media=>['a','b'].map((pose,i)=>{
  const v=structuredClone(persistentAgent),left=i?.6:.1;
  Object.assign(v,{id:media+'-'+pose,media,at:i*2,src:'/comic/test/'+media+'-'+pose+'.png'});
  v.layers=v.layers.slice(0,2);v.layers[0].src=v.src;v.layerMotion=v.layerMotion.slice(0,2);
  v.layers[1].src='/comic/test/poses.png';v.layers[1].agentPlacement={sourceROI:[left,.1,.2,.8],slot:media==='phone'?[.05,.05,.4,.9]:[.6,.05,.35,.9],fit:'contain',speakerIds:['codex']};
  v.speakers={codex:{mouth:[left+.1,.2],face:[left+.05,.15,.1,.1]}};return v;
 }));
 f.o.d.fallbackView={desktop:'desktop-a',phone:'phone-a'};f.m.d.panels[0]=f.o.d;return f;
}
async function finishFallback(f,ids){for(const id of ids)f.image(id==='poses'?'/comic/test/poses.png':'/comic/test/'+id+'.png').finish(id==='poses'?2048:id.startsWith('phone')?1024:1536,id==='poses'?1024:id.startsWith('phone')?1536:1024);await flush();}
await test('fallback references bind only same-panel canonical complete media-eligible first groups',()=>{
 const f=fallbackFixture();assert.deepEqual(comicViewErrors(f.m.d,{scenes:[f.m.d]}),[]);
 for(const mutate of [p=>p.fallbackView.desktop='foreign',p=>p.fallbackView.desktop='phone-a',p=>p.fallbackView.desktop='desktop-b',p=>p.fallbackView.extra=true,p=>delete p.fallbackView.phone,p=>delete p.views[0].layers,p=>delete p.views[0].layers[1].canonicalSource,p=>p.views.push(structuredClone(p.views[0]))]){
  const s=structuredClone(f.m.d);mutate(s.panels[0]);assert(comicViewErrors(s,{scenes:[s]}).some(e=>e.includes('fallbackView')));
 }
});
await test('cold first-group loading never installs the cleanplate or reports selected art ready',async()=>{
 const f=fallbackFixture();f.run('loadPanelViews(m)');f.render(4);
 assert(!f.images.some(im=>im.src===baseSpec.src));assert.equal(f.images.filter(im=>im.src==='/comic/test/poses.png').length,1);
 await finishFallback(f,['desktop-a']);assert.equal(f.o.el.attrs['data-view-mode'],'loading');assert.equal(f.base.style.visibility,'hidden');
 assert.equal(f.run('panelArtLoaded(m.panels[0])'),false);assert.equal(f.run('activeArtGeometry(m,m.panels[0]).status'),'unavailable');
 assert.equal(f.o.viewCrop.style.display,'none');assert.equal(f.o.selectedSource,null);
 await finishFallback(f,['poses']);assert.equal(f.o.el.attrs['data-view-id'],'desktop-a');assert.equal(f.o.el.attrs['data-requested-view-id'],'desktop-b');
 assert.equal(f.o.el.attrs['data-requested-view-mode'],'loading');assert.equal(f.o.el.attrs['data-view-fallback'],'true');assert.equal(f.run('panelArtLoaded(m.panels[0])'),true);
 assert.equal(f.o.viewLayerCrops.length,2);assert.equal(f.o.viewLayerCrops[1].element.style.opacity,'0.72');
 const a=f.run('panelSpeakerGeometry(m.panels[0]).codex'),p=f.o.viewLayerCrops[1].placement;
 assert.equal(a.mouth[0],p.left+p.backgroundPosition[0]+.2*p.backgroundSize[0]);assert.equal(f.o.selectedImage.src,'/comic/test/desktop-a.png');
});
await test('failed later group retains complete A and its anchors without cancelling a shared plane',async()=>{
 const f=fallbackFixture();f.run('loadPanelViews(m)');f.render(4);f.image('/comic/test/desktop-b.png').fail();await flush();
 await finishFallback(f,['desktop-a','poses']);const time=f.context.T,actor=f.o.viewLayerCrops[1],anchor=JSON.stringify(f.run('panelSpeakerGeometry(m.panels[0])'));
 f.render(4);assert.equal(f.o.el.attrs['data-view-id'],'desktop-a');assert.equal(f.o.el.attrs['data-requested-view-mode'],'missing');assert(f.o.el.attrs['data-view-error']);
 assert.equal(f.o.viewLayerCrops[1],actor);assert.equal(JSON.stringify(f.run('panelSpeakerGeometry(m.panels[0])')),anchor);assert.equal(f.context.T,time);
 assert.equal(f.base.style.visibility,'hidden');assert.equal(f.run('panelArtLoaded(m.panels[0])'),true);
});
await test('missing cold A and B remain honestly unavailable instead of showing bare background',async()=>{
 const f=fallbackFixture();f.run('loadPanelViews(m)');f.render(4);f.image('/comic/test/desktop-a.png').fail();f.image('/comic/test/desktop-b.png').fail();await finishFallback(f,['poses']);
 assert.equal(f.o.el.attrs['data-view-mode'],'missing');assert.equal(f.o.selectedSource,null);assert.equal(f.o.artMissing.textContent,'Artwork unavailable.');
 assert.equal(f.base.style.visibility,'hidden');assert.equal(f.run('panelArtLoaded(m.panels[0])'),false);assert.equal(f.run('activeArtGeometry(m,m.panels[0]).status'),'unavailable');
});
await test('late B decode samples current clock and cannot override a rewind; pause replay and reduced motion retain complete groups',async()=>{
 const f=fallbackFixture();f.run('loadPanelViews(m)');f.render(4);await finishFallback(f,['desktop-a','poses']);f.render(7);
 await finishFallback(f,['desktop-b']);assert.equal(f.context.T,13.5);assert.equal(f.o.el.attrs['data-view-id'],'desktop-b');
 const actual=JSON.stringify(f.o.viewLayerCrops[1].element.style);f.render(7);assert.equal(JSON.stringify(f.o.viewLayerCrops[1].element.style),actual);
 const direct=fallbackFixture();direct.run('loadPanelViews(m)');direct.render(7);await finishFallback(direct,['desktop-a','poses','desktop-b']);assert.equal(JSON.stringify(direct.o.viewLayerCrops[1].element.style),actual);
 f.render(1);assert.equal(f.o.el.attrs['data-view-id'],'desktop-a');f.render(4);assert.equal(f.o.el.attrs['data-view-id'],'desktop-b');
 f.context.REDUCED=true;f.render(4);assert.equal(f.o.viewLayerCrops[1].element.style.opacity,'0.72');assert.equal(f.o.viewLayerCrops[1].element.style.transform,'none');
 const rewound=fallbackFixture();rewound.run('loadPanelViews(m)');rewound.render(4);await finishFallback(rewound,['desktop-a','poses']);rewound.render(1);await finishFallback(rewound,['desktop-b']);assert.equal(rewound.o.el.attrs['data-view-id'],'desktop-a');
});
await test('phone change waits for phone A then uses actual phone source anchors and independent native alpha dimensions',async()=>{
 const f=fallbackFixture();f.run('loadPanelViews(m)');f.render(4);await finishFallback(f,['desktop-a','poses','desktop-b']);
 f.context.mode='phone';f.render(4);assert.equal(f.o.viewCrop.style.display,'none');assert.equal(f.run('panelArtLoaded(m.panels[0])'),false);assert.equal(f.base.style.visibility,'hidden');
 await finishFallback(f,['phone-a']);assert.equal(f.o.el.attrs['data-view-id'],'phone-a');assert.equal(f.o.selectedImage.naturalWidth,1024);
 assert.equal(f.o.viewLayerCrops[1].image.naturalWidth,2048);const a=f.run('panelSpeakerGeometry(m.panels[0]).codex'),p=f.o.viewLayerCrops[1].placement;assert.equal(a.mouth[0],p.left+p.backgroundPosition[0]+.2*p.backgroundSize[0]);
 await finishFallback(f,['phone-b']);assert.equal(f.o.el.attrs['data-view-id'],'phone-b');assert.equal(f.images.filter(im=>im.src==='/comic/test/poses.png').length,1);
 f.context.mode='desktop';f.render(4);assert.equal(f.o.el.attrs['data-view-id'],'desktop-b');
});
await test('existing transport pause and seek keep complete A while B decodes then replay chooses current pose',async()=>{
 const f=fallbackFixture();f.run('loadPanelViews(m)');f.render(4);await finishFallback(f,['desktop-a','poses']);
 Object.assign(f.context,{nowValue:12,now:()=>f.context.nowValue,state:'play',userPaused:false,held:false,END_T:99,t0:0,audioLive:false,audio:null,raf:1,tag:{classList:{toggle(){}}},pauseBtn:null,TB:null,score:{pause(){},seek(){},update(){}},tick(){},startMusic(){},requestAnimationFrame:()=>1,cancelAnimationFrame(){}});
 f.run('frame();setPaused(true)');const time=f.context.T;f.context.nowValue=40;f.run('frame()');assert.equal(f.context.T,time);assert.equal(f.o.el.attrs['data-view-id'],'desktop-a');
 await finishFallback(f,['desktop-b']);assert.equal(f.context.T,time);assert.equal(f.context.state,'paused');assert.equal(f.o.el.attrs['data-view-id'],'desktop-b');
 f.run('seekTo(10.5,true)');assert.equal(f.o.el.attrs['data-view-id'],'desktop-a');assert.equal(f.context.state,'paused');
 f.context.nowValue=45;f.run('setPaused(false,true);frame()');assert.equal(f.o.el.attrs['data-view-id'],'desktop-a');f.context.nowValue=47;f.run('frame()');assert.equal(f.o.el.attrs['data-view-id'],'desktop-b');
});
await test('opted-in first group also backs a delayed flat cut then installs the decoded cut at current time',async()=>{
 const f=fallbackFixture(),v=f.o.d.views.find(v=>v.id==='desktop-b');delete v.layers;delete v.layerMotion;
 f.run('loadPanelViews(m)');f.render(4);await finishFallback(f,['desktop-a','poses']);assert.equal(f.o.el.attrs['data-view-id'],'desktop-a');
 const actor=f.o.viewLayerCrops[1];f.render(6);assert.equal(f.o.viewLayerCrops[1],actor);await finishFallback(f,['desktop-b']);assert.equal(f.o.el.attrs['data-view-id'],'desktop-b');assert.equal(f.o.el.attrs['data-requested-view-mode'],'ready');assert.equal(f.o.el.attrs['data-view-fallback'],'false');assert.equal(f.o.viewLayerCrops.length,0);assert.equal(f.o.selectedImage.src,'/comic/test/desktop-b.png');assert.equal(f.run('panelArtLoaded(m.panels[0])'),true);
 f.render(1);assert.equal(f.o.el.attrs['data-view-id'],'desktop-a');assert.equal(f.o.viewLayerCrops.length,2);
});
await test('fallback decoder disposal clears pending work and stale completion cannot mutate removed art',async()=>{
 const f=fallbackFixture();f.run('loadPanelViews(m)');f.render(4);assert(f.timers.size);f.events.pagehide({persisted:true});assert(f.timers.size);
 f.events.pagehide({persisted:false});assert.equal(f.timers.size,0);assert.equal(f.o.viewCrop.style.display,'none');assert.equal(f.base.style.visibility,'hidden');
 const before=JSON.stringify(f.o.el.attrs);for(const im of f.images)im.finish(1536,1024);await flush();assert.equal(JSON.stringify(f.o.el.attrs),before);assert.equal(f.o.viewLayerCrops.length,0);
});
await test('independent alpha placement admits only reviewed agent anchors and bounded native silhouette slots',()=>{
 const s=structuredClone(valid);s.panels[0].views=[structuredClone(persistentAgent)];const v=s.panels[0].views[0];v.layers[1].agentPlacement=structuredClone(actorPlacement);v.speakers={codex:{mouth:[.5,.2],face:[.45,.15,.1,.1]}};assert.deepEqual(comicViewErrors(s,{scenes:[s]}),[]);
 for(const mutate of [v=>v.layers[1].role='humans',v=>v.layers[1].agentPlacement.fit='cover',v=>v.layers[1].agentPlacement.sourceROI=[0,0,0,1],v=>v.layers[1].agentPlacement.slot=[.7,0,.4,1],v=>v.layers[1].agentPlacement.speakerIds=[],v=>v.layers[1].agentPlacement.speakerIds=['matt'],v=>v.layers[1].agentPlacement.phone.sourceROI=[NaN,0,1,1],v=>v.layers[1].agentPlacement.scale=.4,v=>v.layers[1].agentPlacement.phone.phone={},v=>{v.layers[2].role='agents';v.layers[2].agentPlacement=structuredClone(actorPlacement);}]){const bad=structuredClone(s);mutate(bad.panels[0].views[0]);assert(comicViewErrors(bad,{scenes:[bad]}).length);}
});
await test('actual ready group gives actor and its mouth/face one independent transform with actor-confined fabrication mask',async()=>{
 const f=fixture(),v=structuredClone(persistentAgent);v.fit='cover';v.layers[1].agentPlacement=structuredClone(actorPlacement);v.speakers={codex:{mouth:[.5,.2],face:[.45,.15,.1,.1]},matt:{mouth:[.2,.3],face:[.15,.2,.1,.1]}};f.o.d.views=[v];f.o.d.pageArt=f.o.d.phoneArt=[0,0,1,1];f.o.box={w:390,h:200};f.run('loadPanelViews(m)');f.render(1);for(const image of f.images)image.finish(1536,1024);await flush();
 for(const mode of ['page','phone']){f.context.mode=mode;f.render(4);const actor=f.o.viewLayerCrops[1],base=f.o.viewLayerCrops[0];assert.equal(actor.placement.fit,'contain');assert.equal(base.placement.fit,'cover');assert.equal(f.o.viewLayerCrops[2].placement,base.placement);assert.notEqual(actor.element.style.backgroundSize,base.element.style.backgroundSize);assert.equal(actor.fabrication.mask.style.maskSize,actor.element.style.backgroundSize);assert.equal(actor.fabrication.mask.style.maskPosition,actor.element.style.backgroundPosition);
  const anchors=f.run('panelSpeakerGeometry(m.panels[0])'),p=actor.placement;assert.equal(anchors.codex.mouth[0],p.left+p.backgroundPosition[0]+.5*p.backgroundSize[0]);assert.equal(anchors.codex.face[2],.1*p.backgroundSize[0]);assert.equal(anchors.matt.face[2],.1*base.placement.backgroundSize[0]);f.context.REDUCED=true;f.render(4);assert.equal(actor.element.style.opacity,'0.72');assert.equal(actor.element.style.transform,'none');f.context.REDUCED=false;
 }
});
await test('persistent source-bound props action works without inventing a digital-agent plane',async()=>{const v=structuredClone(persistentAgent);v.layers=v.layers.filter(l=>l.id!=='agent');v.layerMotion=[{layerId:'base',preset:'still'},{layerId:'paper',preset:'travel',from:[0,0],to:[-.18,.028],beats:6,strength:1}];const s=structuredClone(valid);s.panels[0].views=[v];assert.deepEqual(comicViewErrors(s,{scenes:[s]}),[]);const f=fixture();f.o.d.views=[v];f.run('loadPanelViews(m)');f.render(1);for(const im of f.images)im.finish(1536,1024);await flush();f.render(4);assert.notEqual(f.o.viewLayerCrops[1].element.style.transform,'none');assert.equal(f.o.viewLayerCrops[0].element.style.transform,'none');const middle=f.o.viewLayerCrops[1].element.style.transform;f.render(7);assert.notEqual(f.o.viewLayerCrops[1].element.style.transform,middle);f.render(4);assert.equal(f.o.viewLayerCrops[1].element.style.transform,middle);f.context.REDUCED=true;f.render(4);assert.equal(f.o.viewLayerCrops[1].element.style.transform,'none');v.layerMotion[1]={layerId:'paper',preset:'still'};assert(comicViewErrors(s,{scenes:[s]}).length,'Lone static props cut is still blocked');});
await test('one persistent layered source accepts explicit72percent projection while flat single cuts stay blocked',()=>{
 const s=structuredClone(valid);s.panels[0].views=[structuredClone(persistentAgent)];assert.deepEqual(comicViewErrors(s,{scenes:[s]}),[]);
 for(const change of [v=>v.at=1,v=>delete v.layers,v=>v.layers.splice(1),v=>v.layers[1].role='props',v=>v.layers[1].role='background',v=>v.layers[1].opacity=.24]){const bad=structuredClone(s);change(bad.panels[0].views[0]);assert(comicViewErrors(bad,{scenes:[bad]}).length);}
});
await test('persistent projection remains selected through ghost, hold, rewind and reduced motion; paper stays solid',async()=>{
 for(const phone of [false,true]){
  const f=fixture();f.context.mode=phone?'phone':'desktop';f.o.d.views=[structuredClone(persistentAgent)];f.m.d.panels[0].views=f.o.d.views;f.run('loadPanelViews(m)');f.render(0);
  for(const image of f.images)image.finish(1536,1024);await flush();
  for(const beat of [0,1,3,3,1]){f.render(beat);assert.equal(f.o.el.attrs['data-view-id'],'projection');assert.equal(f.o.viewLayerCrops.length,3);assert.equal(f.o.viewLayerCrops[2].element.style.opacity,'1');}
  f.m.d.hold=[[2,8]];f.render(4);const held=JSON.stringify(f.o.viewLayerCrops[1].element.style);f.render(7);assert.equal(JSON.stringify(f.o.viewLayerCrops[1].element.style),held);
  f.context.REDUCED=true;f.render(5);assert.equal(f.o.viewLayerCrops[1].element.style.opacity,'0.72');assert.equal(f.o.viewLayerCrops[2].element.style.opacity,'1');
 }
});
await test('duplicate/foreign layer targets, clipped sprites, missing retained anchors and future contributions fail',()=>{
 for(const mutate of [v=>v.layers[1].id='base',v=>v.layerMotion[1].layerId='foreign',v=>delete v.layerMotion[1].floorIndex,v=>delete v.layerMotion[1].floorSource,v=>v.layerMotion[1].floorSource.panelId='foreign',v=>v.layerMotion[1].activeFloors=[1,2,3,4,5,6,7,8,9],v=>v.layerMotion[1].activeFloors={},v=>v.layerMotion[1].retainedFloors={},v=>v.layerMotion[1].floors=Infinity,v=>v.layers[1].alternates='invalid',v=>v.layerMotion.pop(),v=>{v.layers.pop();v.layerMotion.pop();v.layerMotion.forEach(m=>delete m.activeFloors);},v=>v.layers[1].opacity=.78,v=>delete v.layers[1].canonicalSource,v=>v.phone={src:'/comic/test/wrong.png'},v=>v.layerMotion={},v=>v.alternates=['/comic/test/base.webp']]){
  const s=structuredClone(valid);mutate(s.panels[0].views[0]);assert(comicViewErrors(s,storyFor(s)).length);
 }
 const s=structuredClone(valid),story=storyFor(s);story.scenes[0].b=100;assert(comicViewErrors(s,story).some(e=>e.includes('boundary')));assert(comicViewErrors(valid).some(e=>e.includes('whole story')));
});
await test('actual render retains floors1â€“5 and activates floor6 at2, floor7 at4, floor8 at6; rewind and replay restore exact states',async()=>{
 const f=await decoded();assert.deepEqual(floor(f),[1,1,1,1,1,0,0,0]);
 for(const [offset,expected]of [[1.999,[1,1,1,1,1,0,0,0]],[2,[1,1,1,1,1,1,0,0]],[3.999,[1,1,1,1,1,1,0,0]],[4,[1,1,1,1,1,1,1,0]],[5.999,[1,1,1,1,1,1,1,0]],[6,[1,1,1,1,1,1,1,1]],[1,[1,1,1,1,1,0,0,0]],[0,[1,1,1,1,1,0,0,0]]]){f.render(1+offset);assert.deepEqual(floor(f),expected);}
 assert(f.o.viewLayerCrops.every(l=>l.element.style.clipPath==='none'));assert.equal(f.o.viewCrop.style.backgroundImage,'none');assert.equal(f.base.style.visibility,'hidden');
});
await test('existing held transport freezes pause; external seek and replay sample actual floor group',async()=>{
 const f=await decoded();Object.assign(f.context,{nowValue:11.5,now:()=>f.context.nowValue,state:'play',userPaused:false,held:false,END_T:99,t0:0,audioLive:false,audio:null,raf:1,tag:{classList:{toggle(){}}},pauseBtn:null,TB:null,score:{pause(){},seek(){},update(){}},tick(){},startMusic(){},requestAnimationFrame:()=>1,cancelAnimationFrame(){}});f.run('frame();setPaused(true)');assert.deepEqual(floor(f),[1,1,1,1,1,1,0,0]);
 f.context.nowValue=26;f.run('frame()');assert.deepEqual(floor(f),[1,1,1,1,1,1,0,0]);f.run('seekTo(10.5,true)');assert.equal(f.context.state,'paused');assert.deepEqual(floor(f),[1,1,1,1,1,0,0,0]);f.context.nowValue=30;f.run('setPaused(false,true);frame()');assert.deepEqual(floor(f),[1,1,1,1,1,0,0,0]);f.context.nowValue=32;f.run('frame()');assert.deepEqual(floor(f),[1,1,1,1,1,1,1,0]);
});
await test('ghost boxes cannot reveal an unearned same-page floor; rewind and reduced motion keep the contribution gate',async()=>{
 const f=await decoded();f.o.d.at=10;f.m.d.panels[0].at=10;
 f.m.d.panels.push({img:'later-source',at:5});
 f.o.d.views[0].layerMotion[1].floorSource={sceneId:f.m.d.id,panelId:'later-source'};
 f.context.story=storyFor(f.m.d);
 f.render(3);assert.equal(floor(f)[0],0,'Future contribution leaks through ghost artwork');
 f.render(6);assert.equal(floor(f)[0],1,'Earned contribution should remain in later ghost artwork');
 f.render(3);assert.equal(floor(f)[0],0,'Rewind must restore unearned state');
 f.context.REDUCED=true;f.render(3);assert.equal(floor(f)[0],0,'Reduced motion must not reveal a future contribution');
});
await test('both layouts leave archive at exact offset8 and tear down all planes before flat context',async()=>{
 for(const phone of [false,true]){const f=await decoded({phone});f.render(8.999);assert.equal(f.o.el.attrs['data-view-id'],'archive');f.render(9);assert.equal(f.o.el.attrs['data-view-id'],'context');assert.equal(f.o.viewLayerCrops.length,0);assert.equal(f.o.viewCrop.children.length,0);assert.equal(f.o.viewCrop.style.backgroundImage,'url("/comic/test/context.png")');f.render(1);assert.equal(f.o.el.attrs['data-view-id'],'archive');assert.equal(f.o.viewLayerCrops.length,9);}
});
await test('actual desktop mode page selects media desktop cuts and never loads phone-only cuts',async()=>{
 const f=fixture();f.context.mode='page';f.o.d.views[0].media='desktop';f.o.d.views[1].media='desktop';f.o.d.views.push({id:'phone-only',at:12,media:'phone',src:'/comic/test/phone.png',alt:'Phone evidence.'});f.run('loadPanelViews(m)');f.render(1);assert(!f.images.some(i=>i.src==='/comic/test/phone.png'));for(const im of f.images)im.finish(1536,1024);await flush();assert.equal(f.o.el.attrs['data-view-id'],'archive');f.render(9);assert.equal(f.o.el.attrs['data-view-id'],'context');
});
await test('resize to a layout with no eligible group tears down pending requests and restores legacy base',async()=>{
 const f=fixture();f.o.d.views[0].media='desktop';f.o.d.views[1].media='desktop';f.run('loadPanelViews(m)');f.render(1);const pending=f.images.filter(i=>i.src!=='/comic/test/context.png');assert.equal(pending.length,9);f.context.mode='phone';f.render(1);assert(pending.every(i=>i.src===''));assert.equal(f.o.viewLayerState,null);assert.equal(f.base.style.visibility,'');assert.equal(f.o.viewCrop.style.display,'none');for(const i of pending)i.finish();await flush();assert.equal(f.o.viewCrop.children.length,0);
});
await test('view switch cancels async decode; obsolete completion cannot resurrect archive or obsolete base',async()=>{
 const f=fixture();f.run('loadPanelViews(m)');f.render(1);let release;const first=f.image('/comic/test/base.png');first.decode=()=>new Promise(r=>release=r);first.finish(1536,1024);await flush();f.image('/comic/test/context.png').finish();await flush();f.render(9);assert.equal(first.src,'');release();await flush();assert.equal(f.o.el.attrs['data-view-id'],'context');assert.equal(f.o.viewCrop.children.length,0);assert.equal(f.o.viewCrop.style.backgroundImage,'url("/comic/test/context.png")');
});
await test('loading selected group keeps decoded static source and loaded accounts for actual active plane readiness',async()=>{
 const f=fixture();f.o.d.staticArt=structuredClone(baseSpec);f.run('loadPanelViews(m)');f.image('/comic/test/evidence.avif').finish(1536,1024);await flush();f.render(1);
 f.o.loaded=true;assert.equal(f.run('panelArtLoaded(m.panels[0])'),false,'Obsolete page art cannot report a still-decoding selected group loaded');
 assert.equal(f.o.el.attrs['data-view-mode'],'loading');assert.equal(f.o.viewCrop.style.display,'');assert.equal(f.o.viewCrop.style.backgroundImage,'url("/comic/test/evidence.avif")');assert.equal(f.run('activeArtGeometry(m,m.panels[0]).kind'),'static');
 for(const im of f.images)if(!im.naturalWidth)im.finish(1536,1024);await flush();f.render(1);assert.equal(f.run('panelArtLoaded(m.panels[0])'),true);assert.equal(f.o.el.attrs['data-view-mode'],'ready');assert.equal(f.o.viewLayerCrops.length,9);
});
await test('failed required plane keeps complete static evidence while status/error remain unavailable; never partial group',async()=>{
 const f=fixture();f.o.d.staticArt=baseSpec;f.run('loadPanelViews(m)');f.render(1);for(const im of f.images)if(im.src!=='/comic/test/floor-7.png')im.finish(1536,1024);f.image('/comic/test/floor-7.png').fail();await flush();assert.equal(f.o.el.attrs['data-view-mode'],'missing');assert.equal(f.o.viewCrop.style.display,'');assert.equal(f.o.viewCrop.style.backgroundImage,'url("/comic/test/evidence.avif")');assert.equal(f.o.el.attrs['data-static-art-mode'],'ready');assert(f.o.el.attrs['data-view-error']);assert.equal(f.run('panelArtLoaded(m.panels[0])'),false);assert.equal(f.base.style.visibility,'hidden');assert.equal(f.o.viewCrop.children.length,0);
});
await test('loading selected group without staticArt keeps complete decoded original page rather than bare clean plate',async()=>{const f=fixture();f.run('loadPanelViews(m)');f.render(1);assert.equal(f.o.el.attrs['data-view-mode'],'loading');assert.equal(f.base.style.visibility,'');assert.equal(f.o.viewCrop.style.display,'none');assert.equal(f.o.selectedSource,null);assert.equal(f.o.viewCrop.children.length,0);assert.equal(f.run('panelArtLoaded(m.panels[0])'),false);});
await test('selected layered group owns reveal readiness independently of missing superseded page',async()=>{
 const f=fixture();f.o.loaded=false;f.run('loadPanelViews(m)');f.render(2);for(const i of f.images)i.finish(1536,1024);await flush();assert.equal(f.o.loaded,true);assert.equal(f.o.el.attrs['data-view-mode'],'ready');assert(Number(f.o.art.style.opacity)>0);
});
await test('wrong canvas and timeout refuse incomplete group; same plane alternate can recover',async()=>{
 const f=fixture();f.o.d.views[0].layers[7].alternates=['/comic/test/floor-7.webp'];f.run('loadPanelViews(m)');f.render(1);for(const im of f.images)if(im.src!=='/comic/test/floor-7.png')im.finish(1536,1024);f.image('/comic/test/floor-7.png').fail();await flush();f.image('/comic/test/floor-7.webp').finish(1536,1024);await flush();assert.equal(f.o.viewLayerCrops.length,9);assert.equal(f.o.viewLayerCrops[7].element.style.backgroundImage,'url("/comic/test/floor-7.webp")');
 const q=fixture();q.run('loadPanelViews(m)');q.render(1);for(const im of q.images)im.finish(1536,im.src.endsWith('floor-7.png')?1000:1024);await flush();assert.equal(q.o.el.attrs['data-view-mode'],'missing');assert.equal(q.o.viewCrop.children.length,0);
 const t=fixture();t.run('loadPanelViews(m)');t.render(1);t.expire();await flush();assert.equal(t.o.el.attrs['data-view-mode'],'missing');assert.equal(t.o.artMissing.style.display,'grid');
});
await test('independent complete agent uses its own native canvas beside a portrait room',async()=>{
 const f=fixture();const v=structuredClone(persistentAgent);v.layers.splice(2,1);v.layerMotion.splice(2,1);
 v.fit='cover';v.layers[1].agentPlacement=structuredClone(actorPlacement);v.speakers={codex:{mouth:[.5,.2],face:[.45,.15,.1,.1]}};
 f.o.d.views=[v];f.context.mode='phone';f.run('loadPanelViews(m)');f.render(1);
 for(const im of f.images)im.finish(im.src.endsWith('agent.png')?1536:1024,im.src.endsWith('agent.png')?1024:1536);
 await flush();f.render(1);assert.equal(f.o.el.attrs['data-view-mode'],'ready');
 const actor=f.o.viewLayerCrops[1],size=actor.element.style.backgroundSize.split(' ').map(parseFloat);
 assert(Math.abs(size[0]/size[1]-1.5)<.002,'the complete actor keeps its native 3:2 aspect');
 assert.equal(actor.placement.fit,'contain');assert.equal(f.o.viewLayerCrops[0].placement.fit,'cover');
});
await test('independent physical prop keeps its native silhouette and rejects placement on humans',()=>{
 const s=structuredClone(valid);const v=structuredClone(persistentAgent);v.layers.splice(1,1);v.layerMotion.splice(1,1);
 v.layers[1].propPlacement={sourceROI:[.1,.2,.2,.3],slot:[.1,.5,.25,.3],fit:'contain'};
 v.layerMotion[1]={layerId:'paper',preset:'travel',from:[.02,0],to:[0,0],sourceBounds:[.1,.2,.2,.3]};s.panels[0].views=[v];
 assert.deepEqual(comicViewErrors(s,{scenes:[s]}),[]);v.layers[1].role='humans';assert(comicViewErrors(s,{scenes:[s]}).length);
});
await test('one genuine action group per responsive layout needs no fake second cut',()=>{
 const s=structuredClone(valid);const v=structuredClone(persistentAgent);v.media='desktop';const phone=structuredClone(v);phone.media='phone';phone.id='projection-phone';s.panels[0].views=[v,phone];
 assert.deepEqual(comicViewErrors(s,{scenes:[s]}),[]);phone.layers=undefined;phone.layerMotion=undefined;assert(comicViewErrors(s,{scenes:[s]}).length);
});
await test('anonymous visible heads reserve lettering space without becoming a voiced cast identity',async()=>{
 const f=fixture();f.o.d.views[0].protectedFaces=[[.6,.2,.1,.1]];f.run('loadPanelViews(m)');f.render(1);for(const im of f.images)im.finish(1536,1024);await flush();f.render(1);
 const faces=f.run('panelSpeakerGeometry(m.panels[0])');assert(faces['protected-face-0']);assert(faces['protected-face-0'].face[2]>0);
 const s=structuredClone(valid);s.panels[0].views[0].protectedFaces=[[-.1,0,.1,.1]];assert(comicViewErrors(s,storyFor(s)).some(x=>x.includes('protectedFaces')));
});
await test('reduced motion retains saved eligible floors, excludes future floor and preserves authored static alpha',async()=>{
 const f=fixture();f.context.REDUCED=true;for(const m of f.o.d.views[0].layerMotion)if(m.floorIndex){m.activeFloors=[1,2,3,4,5,6,7];}f.run('loadPanelViews(m)');f.render(1);for(const im of f.images)im.finish(1536,1024);await flush();assert.deepEqual(floor(f),[1,1,1,1,1,1,1,0]);assert(f.o.viewLayerCrops.every(l=>l.element.style.mixBlendMode==='normal'&&l.element.style.transform==='none'&&l.element.style.clipPath==='none'));
});
await test('actual contain calculation shows full451Ã—958 ROI on phone and desktop with identical plane transforms',async()=>{
 const f=await decoded();for(const [mode,w,h,area]of [['phone',390,640,[.02,.446,.96,.514]],['desktop',1200,800,[.23,.1,.75,.88]]]){
  f.context.mode=mode;f.o.box={w,h};f.render(1);const c=f.o.viewCrop,s=Math.min(w*area[2]/451,h*area[3]/958);assert(Math.abs(parseFloat(c.style.width)-451*s)<.06);assert(Math.abs(parseFloat(c.style.height)-958*s)<.06);assert(parseFloat(c.style.width)<=w*area[2]+.1);assert(parseFloat(c.style.height)<=h*area[3]+.1);
  for(const l of f.o.viewLayerCrops){assert.equal(l.element.style.backgroundSize,c.style.backgroundSize);assert.equal(l.element.style.backgroundPosition,c.style.backgroundPosition);assert.equal(l.element.style.inset,'0');}
 }
});
await test('disposal cancels all pending group loads and removes every layer; persisted pagehide retains clock state',async()=>{
 const f=await decoded();f.events.pagehide({persisted:true});assert.equal(f.o.viewLayerCrops.length,9);f.events['astro:before-swap']();assert.equal(f.o.viewLayerCrops.length,0);assert.equal(f.o.viewCrop.style.display,'none');assert.equal(f.timers.size,0);f.render(7);assert.equal(f.o.viewCrop.children.length,0);
 const p=fixture();p.run('loadPanelViews(m)');p.render(1);p.events.pagehide({persisted:false});assert(p.images.filter(i=>i.src!=='/comic/test/context.png').every(i=>i.src===''));await flush();assert.equal(p.o.viewCrop.children.length,0);
});
const fixtureRoot=path.join(site,'../.codex/worktrees/home-gap-audit-20261011/home-ordered-art/layered-test-fixtures',crypto.randomUUID()),publicDir=path.join(fixtureRoot,'site/public'),assetRoot=path.join(fixtureRoot,'wiki/image-library/assets/proof');fs.mkdirSync(assetRoot,{recursive:true});fs.mkdirSync(path.join(publicDir,'comic/test'),{recursive:true});
const sharp=createRequire(path.join(site,'package.json'))('sharp'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const native=await sharp({create:{width:16,height:12,channels:3,background:'#1a9ba1'}}).png().toBuffer();
const rgba=Buffer.alloc(16*12*4);for(let i=0;i<16*12;i++){rgba[i*4+3]=199;}const alpha=await sharp(rgba,{raw:{width:16,height:12,channels:4}}).png().toBuffer();
const assetScene=structuredClone(valid),assetView=assetScene.panels[0].views[0],records=[];
for(const [i,l]of assetView.layers.entries()){const bytes=i?alpha:native,name=i?'floor-'+i:'base';fs.writeFileSync(path.join(assetRoot,name+'.png'),bytes);fs.writeFileSync(path.join(publicDir,'comic/test',name+'.png'),bytes);l.canonicalSource={...authority,path:'wiki/image-library/assets/proof/'+name+'.png',sha256:hash(bytes),recordId:name};records.push({id:name,panelIds:['immutable-original-owner'],treatments:{'comic-ink':{path:'assets/proof/'+name+'.png',sha256:hash(bytes)}}});}
assetView.canonicalSource=structuredClone(assetView.layers[0].canonicalSource);assetScene.panels[0].views.pop();fs.writeFileSync(path.join(fixtureRoot,'wiki/image-library/manifest.json'),JSON.stringify({records}));
await test('real PNG source/catalog/public aliases validate all9 planes despite distinct original source panel ownership',()=>assert.deepEqual(comicViewAssetErrors(assetScene,publicDir),[]));
await test('actual stale canonical/catalog/alias/missing bytes fail for a required floor, not just scaffold',()=>{
 for(const mutate of [v=>v.layers[6].canonicalSource.sha256='f'.repeat(64),v=>v.layers[6].canonicalSource.recordId='foreign',v=>v.layers[6].src='/comic/test/missing.png',v=>v.layers[6].canonicalSource.panelId='immutable-original-owner',v=>v.layers[6].alternates=['/comic/test/missing.webp']]){const s=structuredClone(assetScene);mutate(s.panels[0].views[0]);assert(comicViewAssetErrors(s,publicDir).length);}
});
await test('actual header prerequisites reject opaque foreground and same-aspect different canvas',async()=>{
 const file=path.join(publicDir,'comic/test/floor-6.png'),old=fs.readFileSync(file);fs.writeFileSync(file,native);assert(comicViewAssetErrors(assetScene,publicDir).some(e=>e.includes('alpha')));fs.writeFileSync(file,await sharp(alpha).resize(32,24).png().toBuffer());assert(comicViewAssetErrors(assetScene,publicDir).some(e=>e.includes('canvas dimensions')));fs.writeFileSync(file,old);
});
await test('actual 78% source alpha and normal opacity1 preserve black ink; screen or extra alpha produces different pixels',async()=>{
 const rgbaDecoded=await sharp(alpha).raw().toBuffer();assert.equal(rgbaDecoded[3],199);const pixel=await sharp(native).composite([{input:alpha,blend:'over'}]).raw().toBuffer();assert(pixel[0]<10&&pixel[1]<40&&pixel[2]<40);const screened=await sharp(native).composite([{input:alpha,blend:'screen'}]).raw().toBuffer();assert(screened[1]>pixel[1]+80);const dimmed=Buffer.from(rgba);for(let i=3;i<dimmed.length;i+=4)dimmed[i]=Math.round(dimmed[i]*.78);const dimPNG=await sharp(dimmed,{raw:{width:16,height:12,channels:4}}).png().toBuffer(),twice=await sharp(native).composite([{input:dimPNG,blend:'over'}]).raw().toBuffer();assert(twice[1]>pixel[1]);
 const f=await decoded();assert(f.o.viewLayerCrops.slice(1,6).every(l=>l.element.style.opacity==='1'&&l.element.style.mixBlendMode==='normal'));
});
await test('maintained audio file audit validates every plane and refuses omitted visual, stale native and missing alias',async()=>{
 const {validateFiles,panelSelectedMedia}=await import(pathToFileURL(path.join(path.dirname(contract),'../../.codex/skills/mtw-comic-story/scripts/audio_opportunities.mjs'))),media=panelSelectedMedia(assetScene,assetScene.panels[0]),context={panels:[{sceneId:'learning',panelId:'box',key:'learning/box',selectedMedia:media}],visualBindings:new Set(),records:new Map()},audit={boxes:[{sceneId:'learning',panelId:'box',selectedMedia:structuredClone(media),visuals:assetView.layers.map(l=>({path:l.canonicalSource.path,sha256:l.canonicalSource.sha256}))}],coverage:[]};
 await validateFiles(audit,context,fixtureRoot);assert.equal(context.visualBindings.size,9);
 const missing=structuredClone(audit);missing.boxes[0].visuals.pop();await assert.rejects(validateFiles(missing,context,fixtureRoot),/missing from actual visual audit/);
 const file=path.join(publicDir,'comic/test/floor-6.png'),bytes=fs.readFileSync(file);fs.renameSync(file,file+'.retained');await assert.rejects(validateFiles(audit,context,fixtureRoot),/ENOENT/);fs.renameSync(file+'.retained',file);
 const master=path.join(assetRoot,'floor-6.png');fs.writeFileSync(master,native);await assert.rejects(validateFiles(audit,context,fixtureRoot),/hash|Hash|SHA|bytes/);fs.writeFileSync(master,bytes);
});
if(process.argv[5])await test('exact source-only parent Learning datum passes whole-story bindings and both-layout handoff',()=>{
 const text=fs.readFileSync(path.resolve(process.argv[5]),'utf8'),story=JSON.parse(text.slice(text.indexOf('retime({')+7,text.lastIndexOf('});')+1)),scene=story.scenes.find(s=>s.id==='learning'),panel=scene.panels.find(p=>p.img==='home-floors-light');assert.deepEqual(comicViewErrors(scene,story),[]);assert.equal(panel.views[0].layers.length,9);for(const media of ['phone','desktop']){const eligible=panel.views.filter(v=>!v.media||v.media===media);assert.equal(eligible[1].at,8);assert.equal(panel.at+eligible[1].at,9);}assert.deepEqual(panel.pageArt,[.23,.1,.75,.88]);assert.deepEqual(panel.phoneArt,[.02,.446,.96,.514]);
});
const timingProof=[];
await test('actual setLines DOM units/timeline prove final phone cut26 unreachable at l28; artHold4 retime makes it reachable',async()=>{
 const text=process.argv[5]?fs.readFileSync(path.resolve(process.argv[5]),'utf8'):null,original=text?JSON.parse(text.slice(text.indexOf('retime({')+7,text.lastIndexOf('});')+1)):{bpm:90,scenes:[structuredClone(valid)],next:{},beats:0},finalText=process.argv[6]?fs.readFileSync(path.resolve(process.argv[6]),'utf8'):null,finalStory=finalText?JSON.parse(finalText.slice(finalText.indexOf('retime({')+7,finalText.lastIndexOf('});')+1)):null,{retime}=await import(pathToFileURL(path.join(site,'src/data/comic-stories/retime.ts')));
 if(!text){const p=original.scenes[0].panels[0];p.views.push({id:'final-phone-context',at:26,media:'phone',src:'/comic/test/final.png',alt:'Final context fixture.'});p.balloons=[13,10,14].map(count=>({text:Array(count).fill('fixture').join(' '),speech:{durationSeconds:.01}}));}
 if(finalStory){const reversed=structuredClone(finalStory);delete reversed.scenes.find(s=>s.id==='learning').artHoldBeats;assert.deepEqual(reversed,original);assert.equal(finalStory.scenes.find(s=>s.id==='learning').artHoldBeats,4);}
 for(const hold of [0,4])for(const media of ['page','phone']){
  const story=structuredClone(hold&&finalStory?finalStory:original);if(hold)story.scenes.find(s=>s.id==='learning').artHoldBeats=hold;retime(story);const scene=story.scenes.find(s=>s.id==='learning'),panel=scene.panels[0],f=fixture();f.context.mode=media;f.context.B=60/story.bpm;f.context.REVEAL=Math.max(.75,.6/f.context.B);f.context.ENTER=Math.max(1,.8/f.context.B);f.context.EXIT=Math.max(1.5,1.2/f.context.B);f.context.document.createTextNode=()=>node();f.m.d=scene;f.o.d=panel;f.o.balloons=panel.balloons.map(b=>({d:b,box:node(),budget:1+.3*b.text.split(/\s+/).filter(Boolean).length,units:[]}));
  f.run('m.panels[0].balloons.forEach(function(bl){setLines(bl,parseWords(bl.d.text,bl.d.em).lines);});m.sheets=[[m.panels[0]]];m.times=timeline(m);');
  f.context.model=[f.m];
  const plan=f.run('reviewFrames("learning")'),windowErrors=comicViewWindowErrors(scene,plan);
  const callerText=fs.readFileSync(path.join(path.dirname(contract),'comic-story-playback-review.mjs'),'utf8'),ca=callerText.indexOf('const viewWindows=comicViewWindowErrors'),cb=callerText.indexOf('for(const frame of plan.frames)',ca),checks=[],caller={comicViewWindowErrors,scene,plan,size:media,slug:'fixture',check(pass,label,details){checks.push({pass,label,details});}};assert(ca>=0&&cb>ca);vm.createContext(caller);
  if(windowErrors.length)assert.throws(()=>vm.runInContext(callerText.slice(ca,cb),caller),/Unreachable or incomplete/);else vm.runInContext(callerText.slice(ca,cb),caller);assert.equal(checks[0].pass,!windowErrors.length);
  const balloonUnits=f.o.balloons.map(bl=>({at:bl.d.at,count:bl.units.length,per:bl.per})),ready=f.run('sheetReadyAt(m.panels)'),exit=f.m.times[0].exitStart,stop=f.run('Math.min(panelFadeStart(m.times[0],0),m.times[0].exitStart)');f.o.balloons=[];f.run('loadPanelViews(m)');f.render(scene.l-.01);for(const im of f.images)im.finish(1536,1024);await flush();
  const selected=f.o.el.attrs['data-view-id'],dwell=stop-panel.at-26;timingProof.push({hold,media,length:scene.l,panelAt:panel.at,ready,exit,usableOffset:stop-panel.at,finalOffset:26,preFadeDwellSeconds:Math.max(0,dwell)*f.context.B,selectedAtSceneEnd:selected,balloonUnits,windowErrors});
  assert(comicViewWindowErrors(scene,{...plan,frames:[]}).length);assert(comicViewWindowErrors(scene,{...plan,scene:'foreign'}).length);const missing=structuredClone(plan);missing.frames[0].panels=[];assert(comicViewWindowErrors(scene,missing).length);
  assert(comicViewWindowErrors({...scene,panels:[...scene.panels,{img:'unmeasured-next-panel',at:28}]},plan).length);
  if(media==='phone'){if(!hold){assert.equal(scene.l,28);assert(dwell<0);assert.notEqual(selected,panel.views.at(-1).id);assert(windowErrors.some(e=>e.includes(panel.views.at(-1).id)));}else{assert.equal(scene.l,32);assert(dwell>3);assert.equal(selected,panel.views.at(-1).id);assert.deepEqual(windowErrors,[]);}}else{assert.equal(selected,panel.views[1].id);assert.deepEqual(windowErrors,[]);}
 }
});
const additionalTimingProof=[];
if(process.argv[5])await test('actual phoneSheets/setLines/timeline measured gate catches Process/Connect/Access gaps and proposed bounded corrections',async()=>{
 const text=fs.readFileSync(path.resolve(process.argv[6]||process.argv[5]),'utf8'),raw=JSON.parse(text.slice(text.indexOf('retime({')+7,text.lastIndexOf('});')+1)),{retime}=await import(pathToFileURL(path.join(site,'src/data/comic-stories/retime.ts'))),PAGE=JSON.parse(fs.readFileSync(path.join(site,'../.codex/skills/mtw-comic-story/assets/page-constants.json'),'utf8')).page;
 for(const corrected of [false,true]){
  const story=structuredClone(raw);if(corrected){story.scenes.find(s=>s.id==='process').panels.find(p=>p.img==='home-process-procedure').views.at(-1).at=18.8;story.scenes.find(s=>s.id==='access-check').panels.find(p=>p.img==='home-process-permissions').views.at(-1).at=7.8;story.scenes.find(s=>s.id==='connect').artHoldBeats=2;}retime(story);
  for(const [media,w,h]of [['page',1280,800],['phone',390,640],['phone',500,900]])for(const id of ['process','connect','access-check']){
   const scene=story.scenes.find(s=>s.id===id),f=fixture(),c=f.context,B=60/story.bpm;Object.assign(c,{B,PAGE,mode:media,GUT:4,REVEAL:Math.max(.75,.6/B),ENTER:Math.max(1,.8/B),EXIT:Math.max(1.5,1.2/B)});c.document.createTextNode=()=>node();const si=source.indexOf('  function sheetAt(');f.run(source.slice(si,source.indexOf('\n',si)));
   const m={d:scene,panels:scene.panels.map(p=>({d:p,balloons:(p.balloons||[]).map(b=>({d:b,box:node(),budget:1+.3*b.text.split(/\s+/).filter(Boolean).length,units:[]}))}))};c.m=m;f.run('m.panels.forEach(function(o){o.balloons.forEach(function(bl){setLines(bl,parseWords(bl.d.text,bl.d.em).lines);});});');
   if(media==='page')m.sheets=[m.panels];else{const PAD=Math.max(6,Math.round(Math.min(w,h)*.012)),pw=w-2*PAD,ph=h-2*PAD,SS=Math.min(pw,ph),ms=PAGE.marginSidesPct||{},margin=k=>Math.round(SS*(ms[k]||PAGE.marginPct||1.9)/100);c.GUT=Math.max(2,Math.round(SS*(PAGE.gutterPct||1.2)/100));m.sheets=c.phoneSheets(m,pw-margin('left')-margin('right'),ph-margin('top')-margin('bottom'),margin('left'),margin('top'));}
   m.times=c.timeline(m);c.model=[m];const plan=c.reviewFrames(id),errors=comicViewWindowErrors(scene,plan),panelId=id==='process'?'home-process-procedure':id==='connect'?'home-process-connect':'home-process-permissions',o=m.panels.find(p=>p.d.img===panelId),x=m.times.find(t=>t.panels.includes(o)),index=x.panels.indexOf(o),stop=Math.min(c.panelFadeStart(x,index),index+1<x.panels.length?x.panels[index+1].d.at:x.exitStart),views=o.d.views.filter(v=>!v.media||v.media===(media==='phone'?'phone':'desktop')),last=views.at(-1),dwell=last?stop-o.d.at-last.at:null;
   additionalTimingProof.push({corrected,media,w,h,sceneId:id,sceneLength:scene.l,panelId,stop,finalView:last?.id,finalAt:last?.at,preFadeDwellBeats:dwell,preFadeDwellSeconds:dwell==null?null:Math.max(0,dwell)*B,errors});
   if(corrected||media==='page')assert.deepEqual(errors,[]);else assert(errors.some(e=>e.includes(panelId)));
   if(media==='phone'&&corrected){assert(dwell>=1);const sampled=views[c.panelViewAt(views,o.d.at+last.at+dwell/2,o.d.at,stop)];assert.equal(sampled.id,last.id);if(id==='connect')assert.equal(scene.l,36);}
  }
 }
});

await test('layered cover uses one full source/group placement including actor mask registration',async()=>{
 const f=await decoded();f.o.d.views[0].fit='cover';f.render(1);
 const active=JSON.parse(f.run('JSON.stringify(activeArtGeometry(m,m.panels[0]))'));
 assert.equal(active.status,'ready');assert.equal(active.kind,'view-group');assert.equal(active.fit,'cover');
 for(const p of active.planes){assert.deepEqual(p.backgroundSize,active.backgroundSize);assert.deepEqual(p.backgroundPosition,active.backgroundPosition);assert.deepEqual(p.nativeDimensions,active.nativeDimensions);}
 assert.equal(f.o.viewCrop.style.overflow,'hidden');
});
await test('paper aspect bounds desktop artwork without shrinking phone or legacy pages',()=>{
 const {context:c}=fixture(),m={t:15,b:15,l:12,r:12};
 assert.equal(c.pageCanvasWidth({},1600,800,m,'page'),1600);
 assert.equal(c.pageCanvasWidth({pageAspect:1.5},1600,800,m,'page'),1179);
 assert.equal(c.pageCanvasWidth({pageAspect:1.5},900,800,m,'page'),900);
 assert.equal(c.pageCanvasWidth({pageAspect:1.5},378,2000,m,'phone'),378);
 for(const bad of [NaN,Infinity,0,-1])assert.equal(c.pageCanvasWidth({pageAspect:bad},1600,800,m,'page'),1600);
});
await test('responsive phone canvas preserves the authored crop aspect and legacy height',()=>{
 const {context:c}=fixture(),m={t:5,b:4,l:6,r:6},s={phonePageHeight:1009,phonePageReferenceWidth:351};
 assert.equal(c.phoneCanvasHeight(s,320,'phone',363,m),1009);
 assert.equal(c.phoneCanvasHeight(s,320,'phone',336,m),9+1000*324/351);
 assert.equal(c.phoneCanvasHeight(s,1200,'phone',336,m),1200);
 assert.equal(c.phoneCanvasHeight(s,800,'page',1600,m),800);
 assert.equal(c.phoneCanvasHeight({phonePageHeight:1009},320,'phone',336,m),1009);
});
await test('legacy layered phone fit stays group-level; independent actor placement requires its explicit alpha contract',async()=>{
 const f=await decoded({phone:true});f.o.d.views[0].phone={ar:f.o.d.views[0].ar,fit:'cover'};f.render(1);
 assert.equal(f.run('activeArtGeometry(m,m.panels[0]).fit'),'cover');
 const bad=structuredClone(f.m.d);bad.panels[0].views[0].layers[1].fit='cover';assert(comicViewErrors(bad,{scenes:[bad]}).some(e=>e.includes('unknown view layer field fit')));
});
console.log(JSON.stringify({runtime,contract,fixtureRoot,stage:'controlled actual DOM/load/clock and tiny pixel/lineage only; actual native reader/phone glyph and approval pending',passed:results.filter(r=>r.pass).length,total:results.length,results,timingProof,additionalTimingProof},null,2));if(results.some(r=>!r.pass))process.exitCode=1;

