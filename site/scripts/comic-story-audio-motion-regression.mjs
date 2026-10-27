import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';
// Run the real score controller using the existing audio-policy fixture; no browser or audible claim.
// Usage: node scripts/comic-story-audio-motion-regression.mjs [runtime.js] [reference-site] [proposed-deslop.mjs] [proposed-audio-fixture.mjs]
const site=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const runtime=process.argv[2]?resolve(process.argv[2]):resolve(site,'public/scripts/comic-story.js');
const reference=process.argv[3]?resolve(process.argv[3]):site;
const source=readFileSync(runtime,'utf8');
const harness=readFileSync(process.argv[5]?resolve(process.argv[5]):resolve(reference,'scripts/comic-story-audio-regression.mjs'),'utf8');
const from=harness.indexOf("const from = source.indexOf("),to=harness.indexOf('const results = [];');
assert(from>=0&&to>from,'existing fixture boundaries');
const {fixture,flush}=vm.runInNewContext(harness.slice(from,to)+';({fixture,flush})',{source,vm,assert,URL,URLSearchParams,Float32Array});
const results=[];
const test=async(name,fn)=>{try{await fn();results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.message});}};
const ready=async({score=0.4,...opts}={})=>{const f=fixture({score,...opts});f.env.gesture=true;f.run('startMusic()');await flush();return f;};
const fired=f=>Array.from(f.run('score.info().fired'));
await test('actual common output headroom survives init, mute/unmute, pause, seek and reduced motion',async()=>{
 const f=await ready({score:.12}),ctx=f.contexts[0],master=ctx.gains[0];assert.equal(master.gain.value,.6);assert.equal(f.run('score.info()').headroom,.6);assert.equal(f.run('score.info()').masterGain,.6);
 f.run('setMuted(true)');assert.equal(master.gain.value,0);f.run('setMuted(false)');await flush();assert.equal(master.gain.value,.6);
 f.run('userPaused=true;score.pause(true);score.seek(5,true);REDUCED=true;userPaused=false;score.pause(false);score.update(6)');assert.equal(master.gain.value,.6);assert.equal(f.run('score.info()').level,.12);assert(Math.abs(f.run('score.outputGain()')-.12*.6)<1e-9);
 const muted=await ready({muted:true});assert.equal(muted.contexts[0].gains[0].gain.value,0);muted.run('setMuted(false)');await flush();assert.equal(muted.contexts[0].gains[0].gain.value,.6);
});
await test('actual common output shape meters all sources and direct-media fallback retains margin',async()=>{
 const f=await ready({score:.12}),ctx=f.contexts[0],master=ctx.gains[0],hp=master.connections[0],low=hp.connections[0],high=low.connections[0];assert.equal(hp.type,'highpass');assert.equal(low.type,'lowshelf');assert.equal(high.type,'highshelf');assert(high.connections.includes(ctx.analyser));assert(ctx.analyser.connections.includes(ctx.destination));assert(ctx.gains[1].connections.includes(master));assert(ctx.gains[2].connections.includes(master));
 const g=ctx.gains.length;f.run("score.play('sting')");assert(ctx.gains.slice(g).some(n=>n.connections.includes(master)));
 const fallback=fixture({score:.12});fallback.run("window.AudioContext.prototype.createMediaElementSource=function(){throw Error('routing fixture')};");fallback.env.gesture=true;fallback.run('startMusic()');await flush();fallback.run('score.seek(5,true)');assert.equal(fallback.run('score.info()').routed,false);assert(Math.abs(fallback.audios[0].volume-.12*.85*.6)<1e-9);
});

await test('actual score: natural reveal fires once and respects delayed cue',async()=>{const f=await ready();f.run("scenes[0].panels=[{at:1,sfx:[{kind:'click'},{kind:'paper',delay:0.5}]}];score.update(0.8);score.update(1.1);score.update(1.2);");assert.deepEqual(fired(f),['click']);f.run('score.update(1.6);score.update(1.7)');assert.deepEqual(fired(f),['click','paper']);});
await test('actual score: seek updates sound immediately, current focus only, no backlog',async()=>{const f=await ready();f.run("scenes[0].panels=[{at:1,sfx:[{kind:'click'}]},{at:4,sfx:[{kind:'paper'},{kind:'sting',delay:1}]}];score.seek(4);score.update(4.2)");assert.deepEqual(fired(f),['paper']);f.run('score.update(4.8);score.update(5.1)');assert.deepEqual(fired(f),['paper','sting']);});
await test('actual score: muted seek schedules no event, unmute has no backlog',async()=>{const f=await ready({muted:true});f.run("scenes[0].panels=[{at:1,sfx:[{kind:'click'}]}];score.seek(1);score.update(1.1)");assert.deepEqual(fired(f),[]);f.run('setMuted(false);score.update(1.5)');await flush();assert.deepEqual(fired(f),[]);});
await test('actual score: paused seek changes target envelope without event synthesis',async()=>{const f=await ready();f.run("userPaused=true;score.pause(true);scenes[0].panels=[{at:1,sfx:[{kind:'click'}]}];score.seek(1);score.update(1.1)");assert.deepEqual(fired(f),[]);assert.equal(f.contexts[0].state,'suspended');f.run('userPaused=false;score.pause(false);score.update(1.5)');assert.deepEqual(fired(f),[]);});
await test('actual score: hidden/suspended context schedules no event backlog',async()=>{const f=await ready();f.run("scenes[0].panels=[{at:1,sfx:[{kind:'click'}]}]");f.visibility(true);f.run('score.update(0.8);score.update(1.1)');assert.deepEqual(fired(f),[]);f.visibility(false);f.run('score.update(1.5)');assert.deepEqual(fired(f),[]);});
await test('actual score: explicit close fades last music to authored target and stops last room',async()=>{const f=await ready({score:0.6});f.run("scenes[0].room='office';story.next={b:100,sound:{score:0.08,room:'none',fadeBeats:1.5}};sceneAt=function(t){return t<100?0:1};score.update(99);score.seek(100)");assert.equal(f.run('score.info().level'),0.6);assert.equal(f.run('score.info().room'),'none');f.run('score.update(100.75)');assert.equal(f.run('score.info().level'),0.34);f.run('score.update(101.5)');assert.equal(f.run('score.info().level'),0.08);assert(Math.abs(f.run('score.outputGain()')-0.08*0.6)<1e-9);});
await test('actual score: silent close retains zero in navigation gain',async()=>{const f=await ready({score:0.8});f.run("story.next={b:100,sound:{score:0,room:'none'}};sceneAt=function(t){return t<100?0:1};score.seek(101.5)");assert.equal(f.run('score.outputGain()'),0);});
await test('actual score: old data without close preserves legacy final score',async()=>{const f=await ready({score:0.6});f.run("sceneAt=function(t){return t<100?0:1};score.update(101.5)");assert.equal(f.run('score.info().level'),0.6);});
await test('actual seekTo integration updates media and score/cue without waiting for RAF',async()=>{const f=await ready({score:0.6});const a=source.indexOf('  function seekTo('),b=source.indexOf('  function goScene(',a);assert(a>=0&&b>a);f.run(source.slice(a,b));f.run("scenes[0].panels=[{at:1,sfx:[{kind:'click'}]},{at:4,sfx:[{kind:'paper'}]}];seekTo(4)");assert.equal(f.audios[0].currentTime,4);assert.equal(f.run('T'),4);assert.equal(f.run('score.info().level'),0.6);assert.deepEqual(fired(f),['paper']);});
await test('actual progress adapter silences repeated seek cues but retains media, score and natural delayed events',async()=>{
  const f=await ready({score:0.6});
  const a=source.indexOf('  function seekTo('),b=source.indexOf('  function goScene(',a);
  assert(a>=0&&b>a,'actual seek function');f.run(source.slice(a,b));
  const c=source.indexOf('  var resumeAfterScrub = false;'),d=source.indexOf('  function setPaused(',c);
  assert(c>=0&&d>c,'actual shared progress adapter');
  f.run('stage={querySelector(){return null}};window.MTWProgress={mount(element,options){return options}};progress=null;');
  f.run(source.slice(c,d));
  f.run("scenes[0].panels=[{at:1,sfx:[{kind:'click'}]},{at:4,sfx:[{kind:'paper'},{kind:'sting',delay:1}]}];progress.seek(4);progress.seek(4.05)");
  assert.equal(f.run('T'),4.05);assert.equal(f.audios[0].currentTime,4.05);assert.equal(f.run('score.info().level'),0.6);assert.deepEqual(fired(f),[]);
  f.run('score.update(4.8);score.update(5.1)');assert.deepEqual(fired(f),['sting']);
  f.run('seekTo(4)');assert.deepEqual(fired(f),['sting','paper']);
});

// Focus/ambience fixtures run the same controller and responsive sheet resolver as playback.
const useSheets=f=>{const a=source.indexOf('  function sheetAt('),b=source.indexOf('  var liveScene',a);assert(a>=0&&b>a);f.run(source.slice(a,b));};
const info=f=>JSON.parse(JSON.stringify(f.run('score.info()')));
const roomOutputs=f=>f.contexts[0].gains.filter(g=>g.connections.includes(f.contexts[0].gains[1]));
await test('actual ambience: Home skyline street -> office -> explicit none, smooth room crossfade with unchanged music',async()=>{
 const f=await ready({score:.10});f.run("scenes[0].id='quote';scenes[0].room='rain';scenes[0].panels=[{img:'skyline',at:1,room:'street'},{img:'office',at:4,room:'office'},{img:'quiet',at:8,room:'none'}];score.seek(2,true)");
 assert.equal(info(f).room,'street');assert.equal(info(f).focus.panel,'skyline');assert.equal(info(f).focus.source,'panel');
 const first=roomOutputs(f)[0],scheduled=[];
 for(const g of f.contexts[0].gains){const original=g.gain.setTargetAtTime;g.gain.setTargetAtTime=function(v,t,tau){scheduled.push({g,v,tau});return original.call(this,v,t,tau);};}
 const gain=f.run('score.outputGain()');f.run('score.seek(5,true)');assert.equal(info(f).room,'office');assert.equal(info(f).focus.panel,'office');assert.equal(first.gain.value,0);assert(scheduled.some(e=>e.g===first&&e.v===0&&e.tau===.6));assert.equal(f.run('score.outputGain()'),gain);
 assert.equal(roomOutputs(f).at(-1).gain.value,1);f.run('score.seek(9,true)');assert.equal(info(f).room,'none');assert(roomOutputs(f).every(g=>g.gain.value===0));
});
await test('actual ambience: continuous reading reuses loops and changes no music level on focus',async()=>{
 const f=await ready({score:.12});f.run("scenes[0].panels=[{img:'outside',at:1,room:'street'},{img:'inside',at:4,room:'office'}];score.seek(2,true)");const streetCount=f.contexts[0].gains.length;
 f.run('score.update(2.2);score.update(2.5);score.update(3.5)');assert.equal(f.contexts[0].gains.length,streetCount);assert.equal(info(f).room,'street');
 f.run('score.seek(5,true)');const count=f.contexts[0].gains.length;f.run('score.update(6);score.update(20);score.seek(2,true);score.seek(5,true)');assert.equal(f.contexts[0].gains.length,count);assert.equal(info(f).level,.12);assert.equal(info(f).room,'office');
});
await test('actual ambience: old data inherits scene room and next scene fallback',async()=>{
 const f=await ready();f.run("scenes[0].room='servers';scenes[0].panels=[{img:'old',at:1}];scenes.push({id:'outside',b:10,l:20,score:.1,room:'street',panels:[{img:'street',at:1}]});sceneAt=function(t){return t>=10?1:0};score.seek(2,true)");assert.equal(info(f).room,'servers');assert.equal(info(f).focus.source,'scene');f.run('score.seek(12,true)');assert.equal(info(f).room,'street');assert.equal(info(f).focus.source,'scene');
});
await test('actual ambience: active phone sheet before reveal cannot select or sound hidden previous panel',async()=>{
 const f=await ready();useSheets(f);f.run("scenes[0].room='office';scenes[0].panels=[{img:'outside',at:1,room:'street',sfx:[{kind:'click'}]},{img:'new-sheet',at:4,room:'servers',sfx:[{kind:'paper'}]}];model=[{times:[{start:0,panels:[{d:scenes[0].panels[0]}]},{start:3.5,panels:[{d:scenes[0].panels[1]}]}]}];score.seek(3.7)");assert.equal(info(f).room,'office');assert.equal(info(f).focus.sheet,1);assert.equal(info(f).focus.panel,null);assert.deepEqual(fired(f),[]);
 f.run('score.seek(4.1)');assert.equal(info(f).room,'servers');assert.equal(info(f).focus.panel,'new-sheet');assert.deepEqual(fired(f),['paper']);f.run('score.seek(2,true)');assert.equal(info(f).room,'street');assert.equal(info(f).focus.sheet,0);
});
await test('actual ambience: authored hold freezes environment, then resume/seek reaches next focus',async()=>{
 const f=await ready();f.run("scenes[0].hold=[[2,5]];scenes[0].panels=[{img:'outside',at:1,room:'street'},{img:'inside',at:3,room:'office'}];score.seek(4,true)");assert.equal(info(f).room,'street');assert.equal(info(f).focus.panel,'outside');f.run('score.update(4.5)');assert.equal(info(f).room,'street');f.run('score.seek(5.1,true)');assert.equal(info(f).room,'office');
});
await test('actual ambience: manual pause, mute and visibility preserve focus without event backlog',async()=>{
 const f=await ready();f.run("scenes[0].panels=[{img:'outside',at:1,room:'street',sfx:[{kind:'transit'}]},{img:'inside',at:4,room:'office',sfx:[{kind:'paper'}]}];score.seek(2,true);userPaused=true;score.pause(true);score.seek(5)");assert.equal(f.contexts[0].state,'suspended');assert.equal(info(f).room,'office');assert.deepEqual(fired(f),[]);
 f.run('userPaused=false;score.pause(false);score.update(5.2);setMuted(true);score.seek(2)');assert.equal(f.contexts[0].gains[0].gain.value,0);assert.equal(info(f).room,'street');assert.deepEqual(fired(f),[]);
 f.visibility(true);assert.equal(f.contexts[0].state,'suspended');f.visibility(false);f.run('setMuted(false);score.update(2.2)');await flush();assert.equal(f.contexts[0].state,'running');assert.deepEqual(fired(f),[]);
});
await test('actual ambience: reduced motion keeps focused sound, closing none fades every room',async()=>{
 const f=await ready();f.run("REDUCED=true;scenes[0].panels=[{img:'outside',at:1,room:'street'},{img:'inside',at:4,room:'office'}];score.seek(5,true)");assert.equal(info(f).room,'office');f.run("story.next={b:100,sound:{score:.08,room:'none'}};sceneAt=function(t){return t<100?0:1};score.seek(101.5,true)");assert.equal(info(f).room,'none');assert.equal(info(f).focus.scene,'next');assert.equal(info(f).focus.panel,null);assert(roomOutputs(f).every(g=>g.gain.value===0));
});
await test('actual transit cue: one natural entrance, no backlog, bounded sources through the shared analyser',async()=>{
 const f=await ready({score:0}),ctx=f.contexts[0],stops=[];
 for(const method of ['createBufferSource','createOscillator']){const original=ctx[method].bind(ctx);ctx[method]=()=>{const node=original();node.stop=t=>stops.push(t);return node;};}
 f.run("scenes[0].panels=[{img:'transit',at:1,room:'street',sfx:[{kind:'transit',gain:.2}]},{img:'office',at:4,room:'office'}];score.update(.8);score.update(1.1);score.update(1.2)");assert.deepEqual(fired(f),['transit']);assert.equal(stops.length,3);assert(stops.every(t=>t<=ctx.currentTime+2.61));
 f.run('score.seek(5);score.update(5.1)');assert.deepEqual(fired(f),['transit']);const hp=ctx.gains[0].connections[0],low=hp.connections[0],high=low.connections[0];assert.equal(hp.type,'highpass');assert.equal(low.type,'lowshelf');assert.equal(high.type,'highshelf');assert(high.connections.includes(ctx.analyser));assert(ctx.analyser.connections.includes(ctx.destination));assert(ctx.gains[1].connections.includes(ctx.gains[0]));
});
await test('actual ambience: explicit music silence fades previous score to zero while room and band meter remain live',async()=>{
 const f=await ready({score:.14});f.run("scenes[0].panels=[{img:'outside',at:1,room:'street'}];scenes.push({id:'quiet-work',b:10,l:20,score:0,room:'none',panels:[{img:'desk',at:1,room:'office'}]});sceneAt=function(t){return t>=10?1:0};score.seek(9,true);score.update(11)");assert.equal(info(f).level,.07);f.run('score.update(12)');assert.equal(info(f).level,0);assert.equal(f.run('score.outputGain()'),0);assert.equal(info(f).room,'office');assert.equal(roomOutputs(f).at(-1).gain.value,1);
 f.env.spectrum=70;f.meter();for(const bar of f.bars)assert.equal(bar.style['--level'],'0.500');assert(!f.classes.has('is-music-active'));
});
await test('actual room asset: decode once and crossfade procedural fallback through same room/master EQ',async()=>{
 const f=await ready(),ctx=f.contexts[0];ctx.decodeAudioData=async()=>({duration:4});
 f.run("assetFetches=0;fetch=function(){assetFetches++;return Promise.resolve({ok:true,arrayBuffer:function(){return Promise.resolve(new ArrayBuffer(8))}})};story.soundAssets={rooms:{street:{src:'/comic/sound/street-loop-v1.mp3',gain:.6}}};scenes[0].panels=[{img:'road',at:1,room:'street'}];score.seek(2,true)");
 const out=roomOutputs(f)[0],procedural=ctx.gains.find(g=>g.connections.includes(out));assert.equal(procedural.gain.value,1);assert.equal(info(f).roomAssets.street.status,'loading');
 for(let n=0;n<6;n++)await flush();assert.equal(info(f).roomAssets.street.status,'decoded-loop');assert.equal(procedural.gain.value,0);assert(ctx.gains.some(g=>g!==procedural&&g.connections.includes(out)&&g.gain.value===.6));assert.equal(out.gain.value,1);
 f.run('score.update(3);score.seek(2,true)');assert.equal(f.run('assetFetches'),1);
});
await test('actual room asset: load/decode errors retain procedural fallback; late decode cannot reactivate old room',async()=>{
 for(const fail of ['fetch','decode']){
  const f=await ready(),ctx=f.contexts[0];ctx.decodeAudioData=()=>Promise.reject(Error('decode fixture'));
  f.run("fetch=function(){return "+(fail==='fetch'?"Promise.reject(Error('HTTP fixture'))":"Promise.resolve({ok:true,arrayBuffer:function(){return Promise.resolve(new ArrayBuffer(8))}})")+"};story.soundAssets={rooms:{street:{src:'/comic/sound/loop.mp3'}}};scenes[0].panels=[{img:'road',at:1,room:'street'}];score.seek(2,true)");const out=roomOutputs(f)[0],procedural=ctx.gains.find(g=>g.connections.includes(out));for(let n=0;n<6;n++)await flush();assert.equal(info(f).roomAssets.street.status,'fallback-error');assert.equal(procedural.gain.value,1);
 }
 const f=await ready(),ctx=f.contexts[0];let decode;ctx.decodeAudioData=()=>new Promise(r=>decode=r);
 f.run("fetch=function(){return Promise.resolve({ok:true,arrayBuffer:function(){return Promise.resolve(new ArrayBuffer(8))}})};story.soundAssets={rooms:{street:{src:'/comic/sound/loop.mp3'}}};scenes[0].panels=[{img:'road',at:1,room:'street'},{img:'quiet',at:4,room:'none'}];score.seek(2,true)");for(let n=0;n<4;n++)await flush();const out=roomOutputs(f)[0];f.run('score.seek(5,true)');decode({duration:4});for(let n=0;n<6;n++)await flush();assert.equal(out.gain.value,0);assert.equal(info(f).room,'none');assert.equal(info(f).roomAssets.street.status,'decoded-loop');
});
await test('actual four room assets: one decode each, loading/error fallback and shared loop route',async()=>{
 for(const room of ['office','servers','rain','street'])for(const failure of [false,true]){
  const f=await ready(),ctx=f.contexts[0];ctx.decodeAudioData=()=>failure?Promise.reject(Error('fixture decode')):Promise.resolve({duration:4});
  f.run("fetches=0;fetch=function(){fetches++;return Promise.resolve({ok:true,arrayBuffer:function(){return Promise.resolve(new ArrayBuffer(8))}})};story.soundAssets={rooms:{"+room+":{src:'/comic/sound/"+room+"-loop-v1.mp3',gain:1}}};scenes[0].panels=[{img:'room',at:1,room:'"+room+"'}];score.seek(2,true)");const out=roomOutputs(f)[0],proc=ctx.gains.find(g=>g.connections.includes(out));assert.equal(proc.gain.value,1);for(let n=0;n<6;n++)await flush();assert.equal(info(f).roomAssets[room].status,failure?'fallback-error':'decoded-loop');assert.equal(proc.gain.value,failure?1:0);assert.equal(out.gain.value,1);f.run('score.seek(3,true)');assert.equal(f.run('fetches'),1);
 }
});
await test('actual pending room assets: pagehide and Astro swap cancel late decode; persisted pagehide retains it',async()=>{
 for(const event of ['pagehide','swap','persisted']){
  const f=await ready(),ctx=f.contexts[0];let decode;ctx.decodeAudioData=()=>new Promise(r=>decode=r);
  f.run("fetch=function(){return Promise.resolve({ok:true,arrayBuffer:function(){return Promise.resolve(new ArrayBuffer(8))}})};story.soundAssets={rooms:{office:{src:'/comic/sound/office-loop-v1.mp3'}}};scenes[0].panels=[{img:'desk',at:1,room:'office'}];score.seek(2,true)");for(let n=0;n<4;n++)await flush();const count=ctx.gains.length;if(event==='swap')f.swap();else f.pagehide(event==='persisted');decode({duration:4});for(let n=0;n<6;n++)await flush();assert.equal(ctx.state,event==='persisted'?'running':'closed');assert.equal(info(f).roomAssets.office.status,event==='persisted'?'decoded-loop':'fallback-cancelled');assert.equal(ctx.gains.length,event==='persisted'?count+1:count);
 }
});

// Begin clicked-panel sound synchronization escape check.
// Reuse the existing policy fixture, actual seek and jump functions, and real responsive focus resolver.
async function jumpFixture(phone = false, paused = false) {
 const f = await ready({score:.12});
 const sceneFrom=source.indexOf('  function sceneAt('),sceneTo=source.indexOf('  var liveScene',sceneFrom);
 const seekFrom=source.indexOf('  function seekTo('),seekTo=source.indexOf('  function goScene(',seekFrom);
 const jumpFrom=source.indexOf('  function jumpToBox('),jumpTo=source.indexOf("  stage.addEventListener('click'",jumpFrom);
 assert(sceneFrom>=0&&sceneTo>sceneFrom&&seekFrom>=0&&seekTo>seekFrom&&jumpFrom>=0&&jumpTo>jumpFrom,'actual scene/sheet, seek and clicked-panel boundaries');
 f.run(source.slice(sceneFrom,sceneTo));f.run(source.slice(seekFrom,seekTo));f.run(source.slice(jumpFrom,jumpTo));
 f.run("B=.625;NEXT_T=62.5;END_T=64;ENTER=1.28;music.offset=.1625;LOOP={from:4,to:16};story.next.b=100;scenes[0].id='earlier';scenes[0].b=0;scenes[0].l=20;scenes[0].panels=[{img:'old-room',at:1,room:'rain',sfx:[{kind:'click'}]}];scenes.push({id:'work',b:20,l:40,score:.12,room:'none',panels:[{img:'street',at:1,room:'street',sfx:[{kind:'transit'}]},{img:'desk',at:4,room:'office',sfx:[{kind:'paper'},{kind:'sting',delay:1}]},{img:'server',at:8,room:'servers',sfx:[{kind:'keys'}]}]});var hint={classList:{remove(){}}};var rendered=[];render=function(t){var si=sceneAt(t);rendered.push({t,scene:si,sheet:sheetAt(model[si],t/B-model[si].d.b)});};");
 f.run("model=scenes.map(function(sc){var ps=sc.panels.map(function(p){return {d:p,sheet:0}});return {d:sc,panels:ps,times:[{start:0,panels:ps}]};});");
 if(phone) f.run("model[1].panels[1].sheet=1;model[1].panels[2].sheet=1;model[1].times=[{start:0,panels:[model[1].panels[0]]},{start:3.8,panels:[model[1].panels[1],model[1].panels[2]]}];");
 if(paused)f.run("userPaused=true;state='paused';score.pause(true);audio.pause()");
 return f;
}
function clickPanel(f, scene, box) { f.run(`jumpToBox({dataset:{scene:'${scene}',box:'${box}'}})`); }
function panelStart(f, scene, box, panel, room, sheet=0) {
 const snapshot=JSON.parse(JSON.stringify(f.run(`({T,media:audio.currentTime,mapped:songTime(T),last:rendered[rendered.length-1],focus:score.info().focus,room:score.info().room,start:(model[${scene}].d.b+model[${scene}].panels[${box}].d.at)*B})`)));
 assert(snapshot.T>=snapshot.start&&snapshot.T-snapshot.start<=1.1e-6,'clicked panel starts at authored beat with only positive rounding tolerance');
 assert(Math.abs(snapshot.media-snapshot.mapped)<=1e-9,'music maps the same absolute story time through offset/loop');
 assert.equal(snapshot.last.t,snapshot.T,'render sees the same destination immediately');assert.equal(snapshot.last.scene,scene);assert.equal(snapshot.last.sheet,sheet);
 assert.equal(snapshot.focus.scene,scene===1?'work':'earlier');assert.equal(snapshot.focus.panel,panel);assert.equal(snapshot.focus.sheet,sheet);assert.equal(snapshot.room,room);
 return snapshot;
}
await test('actual panel click: nonzero scene/beat forward and backward select clicked audio focus immediately',async()=>{
 const f=await jumpFixture();clickPanel(f,1,2);const later=panelStart(f,1,2,'server','servers');assert.deepEqual(fired(f),['keys']);
 clickPanel(f,1,1);const back=panelStart(f,1,1,'desk','office');assert(back.T<later.T);assert.deepEqual(fired(f),['keys','paper']);
 clickPanel(f,0,0);panelStart(f,0,0,'old-room','rain');assert.deepEqual(fired(f),['keys','paper','click']);
});
await test('actual panel click: replay restarts its immediate cue; delayed cue stays on authored beat without backlog',async()=>{
 const f=await jumpFixture();clickPanel(f,1,1);panelStart(f,1,1,'desk','office');assert.deepEqual(fired(f),['paper']);
 f.run('score.update((20+4.8)*B);score.update((20+5.1)*B)');assert.deepEqual(fired(f),['paper','sting']);
 clickPanel(f,1,1);panelStart(f,1,1,'desk','office');assert.deepEqual(fired(f),['paper','sting','paper']);
 f.run('score.update((20+4.8)*B);score.update((20+5.1)*B)');assert.deepEqual(fired(f),['paper','sting','paper','sting']);
});
await test('actual panel click: phone sheet starts at selected panel beat without entrance cap or previous-sheet audio',async()=>{
 const f=await jumpFixture(true);clickPanel(f,1,1);panelStart(f,1,1,'desk','office',1);assert.deepEqual(fired(f),['paper']);
 clickPanel(f,1,0);panelStart(f,1,0,'street','street',0);assert.deepEqual(fired(f),['paper','transit']);
 clickPanel(f,1,1);panelStart(f,1,1,'desk','office',1);assert.deepEqual(fired(f),['paper','transit','paper']);
});
await test('actual panel click: paused and muted destinations synchronize without resuming or emitting cues',async()=>{
 for(const paused of [true,false]){
  const f=await jumpFixture(true,paused);if(!paused)f.run('setMuted(true)');clickPanel(f,1,1);panelStart(f,1,1,'desk','office',1);assert.deepEqual(fired(f),[]);
  if(paused){assert.equal(f.run('state'),'paused');assert.equal(f.contexts[0].state,'suspended');assert.equal(f.audios[0].paused,true);}else assert.equal(f.run('muted'),true);
 }
});
// End clicked-panel sound synchronization escape check.

const soundGatePath=process.argv[4]?resolve(process.argv[4]):resolve(reference,'scripts/comic-story-deslop.mjs');
const {comicSoundErrors: soundGate}=await import(pathToFileURL(resolve(dirname(soundGatePath),'comic-sound-contract.mjs')).href);
await test('actual sound authoring gate validates room override, cue identity and finite gains/delays',()=>{
 const gate=soundGate;
 for(const room of ['none','office','servers','rain','street'])assert.equal(gate({score:.12,room,panels:[{img:'box',room,sfx:[{kind:'transit',gain:.2,delay:0}]}]}).length,0);
 assert.equal(gate({panels:[{img:'legacy'}]}).length,0);
 for(const p of [{room:'wind'},{room:''},{room:[]},{sfx:[{kind:'missing'}]},{sfx:[{kind:'transit',gain:NaN}]},{sfx:[{kind:'transit',gain:1.01}]},{sfx:[{kind:'transit',delay:-1}]},{sfx:[{kind:'transit',delay:Infinity}]},{sfx:{kind:'transit'}}])assert(gate({panels:[p]}).length>0);
 assert.equal(gate({soundAssets:{rooms:{street:{src:'/comic/sound/street-loop-v1.mp3',gain:1}}}}).length,0);
 for(const rooms of [{none:{src:'/x.mp3'}},{wind:{src:'/x.mp3'}},{office:{src:'https://example.com/x.mp3'}},{office:{src:'/x.mp3',gain:1.1}},{office:{src:''}},{office:{src:'/x.mp3',gain:NaN}}])assert(gate({soundAssets:{rooms}}).length>0);
});

// Begin standalone clicked-panel timing escape check.
// Reuse the existing policy fixture, actual seek and jump functions, and real responsive focus resolver.
async function panelTimingFixture(phone = false, paused = false) {
 const f = await ready({score:.12});
 const sceneFrom=source.indexOf('  function sceneAt('),sceneTo=source.indexOf('  var liveScene',sceneFrom);
 const seekFrom=source.indexOf('  function seekTo('),seekTo=source.indexOf('  function goScene(',seekFrom);
 const jumpFrom=source.indexOf('  function jumpToBox('),jumpTo=source.indexOf("  stage.addEventListener('click'",jumpFrom);
 assert(sceneFrom>=0&&sceneTo>sceneFrom&&seekFrom>=0&&seekTo>seekFrom&&jumpFrom>=0&&jumpTo>jumpFrom,'actual scene/sheet, seek and clicked-panel boundaries');
 f.run(source.slice(sceneFrom,sceneTo));f.run(source.slice(seekFrom,seekTo));f.run(source.slice(jumpFrom,jumpTo));
 f.run("B=.625;NEXT_T=62.5;END_T=64;ENTER=1.28;music.offset=.1625;LOOP={from:4,to:16};story.next.b=100;scenes[0].id='earlier';scenes[0].b=0;scenes[0].l=20;scenes[0].panels=[{img:'old-room',at:1,room:'rain',sfx:[{kind:'click'}]}];scenes.push({id:'work',b:20,l:40,score:.12,room:'none',panels:[{img:'street',at:1,room:'street',sfx:[{kind:'click'}]},{img:'desk',at:4,room:'office',sfx:[{kind:'paper'},{kind:'sting',delay:1}]},{img:'server',at:8,room:'servers',sfx:[{kind:'keys'}]}]});var hint={classList:{remove(){}}};var rendered=[];render=function(t){var si=sceneAt(t);rendered.push({t,scene:si,sheet:sheetAt(model[si],t/B-model[si].d.b)});};");
 f.run("model=scenes.map(function(sc){var ps=sc.panels.map(function(p){return {d:p,sheet:0}});return {d:sc,panels:ps,times:[{start:0,panels:ps}]};});");
 if(phone) f.run("model[1].panels[1].sheet=1;model[1].panels[2].sheet=1;model[1].times=[{start:0,panels:[model[1].panels[0]]},{start:3.8,panels:[model[1].panels[1],model[1].panels[2]]}];");
 if(paused)f.run("userPaused=true;state='paused';score.pause(true);audio.pause()");
 return f;
}
function activatePanelTiming(f, scene, box) { f.run(`jumpToBox({dataset:{scene:'${scene}',box:'${box}'}})`); }
function assertPanelTiming(f, scene, box, sheet=0) {
 const snapshot=JSON.parse(JSON.stringify(f.run(`({T,media:audio.currentTime,mapped:songTime(T),last:rendered[rendered.length-1],start:(model[${scene}].d.b+model[${scene}].panels[${box}].d.at)*B})`)));
 assert(snapshot.T>=snapshot.start&&snapshot.T-snapshot.start<=1.1e-6,'clicked panel starts at authored beat with only positive rounding tolerance');
 assert(Math.abs(snapshot.media-snapshot.mapped)<=1e-9,'music maps the same absolute story time through offset/loop');
 assert.equal(snapshot.last.t,snapshot.T,'render sees the same destination immediately');assert.equal(snapshot.last.scene,scene);assert.equal(snapshot.last.sheet,sheet);
 return snapshot;
}
await test('actual clicked-panel timing: nonzero scene/beat forward and backward select clicked cue, media and render immediately',async()=>{
 const f=await panelTimingFixture();activatePanelTiming(f,1,2);const later=assertPanelTiming(f,1,2);assert.deepEqual(fired(f),['keys']);
 activatePanelTiming(f,1,1);const back=assertPanelTiming(f,1,1);assert(back.T<later.T);assert.deepEqual(fired(f),['keys','paper']);
 activatePanelTiming(f,0,0);assertPanelTiming(f,0,0);assert.deepEqual(fired(f),['keys','paper','click']);
});
await test('actual clicked-panel timing: replay restarts its immediate cue; delayed cue stays on authored beat without backlog',async()=>{
 const f=await panelTimingFixture();activatePanelTiming(f,1,1);assertPanelTiming(f,1,1);assert.deepEqual(fired(f),['paper']);
 f.run('score.update((20+4.8)*B);score.update((20+5.1)*B)');assert.deepEqual(fired(f),['paper','sting']);
 activatePanelTiming(f,1,1);assertPanelTiming(f,1,1);assert.deepEqual(fired(f),['paper','sting','paper']);
 f.run('score.update((20+4.8)*B);score.update((20+5.1)*B)');assert.deepEqual(fired(f),['paper','sting','paper','sting']);
});
await test('actual clicked-panel timing: phone sheet starts at selected panel beat without entrance cap or skipped-panel audio',async()=>{
 const f=await panelTimingFixture(true);activatePanelTiming(f,1,1);assertPanelTiming(f,1,1,1);assert.deepEqual(fired(f),['paper']);
 activatePanelTiming(f,1,0);assertPanelTiming(f,1,0,0);assert.deepEqual(fired(f),['paper','click']);
 activatePanelTiming(f,1,1);assertPanelTiming(f,1,1,1);assert.deepEqual(fired(f),['paper','click','paper']);
});
await test('actual clicked-panel timing: paused and muted destinations synchronize without resuming or emitting cues',async()=>{
 for(const paused of [true,false]){
  const f=await panelTimingFixture(true,paused);if(!paused)f.run('setMuted(true)');activatePanelTiming(f,1,1);assertPanelTiming(f,1,1,1);assert.deepEqual(fired(f),[]);
  if(paused){assert.equal(f.run('state'),'paused');assert.equal(f.contexts[0].state,'suspended');assert.equal(f.audios[0].paused,true);}else assert.equal(f.run('muted'),true);
 }
});

function bindActualPanelClick(f) {
 const a=source.indexOf("  stage.addEventListener('click'",source.indexOf('  function jumpToBox(')),b=source.indexOf('  var firstGestureAt = 0;',a);
 assert(a>=0&&b>a,'actual stage click handler boundary');
 f.run("var stageClick=null;stage={addEventListener:function(type,handler){if(type==='click')stageClick=handler}};var issuesEl={};var closeIssues=function(){};var advances=0;goBox=function(){advances++};var firstGestureAt=4900;");
 f.run(source.slice(a,b));
}
await test('actual clicked-panel timing: first sound gesture still activates panel with pending or freshly unlocked audio',async()=>{
 for(const live of [false,true]){
  const f=await panelTimingFixture(true);bindActualPanelClick(f);
  f.run("seekTo(2,true);rendered=[];state='play';gestureStarted=true;audioLive="+live+";stageClick({target:{closest:function(selector){return selector==='.cs-panel'?{dataset:{scene:'1',box:'1'}}:null}}});");
  const destination=f.run('T');assert(destination>=15&&destination-15<=1.1e-6,'first sound gesture cannot swallow clicked panel destination');assert.equal(f.run('advances'),0);assert.equal(f.run('gestureStarted'),false);
  assert.equal(f.run('rendered.length'),1);assert.equal(f.run('rendered[0].scene'),1);assert.equal(f.run('rendered[0].sheet'),1);
  if(live){assertPanelTiming(f,1,1,1);assert.deepEqual(fired(f),['paper']);}else{assert.deepEqual(fired(f),[]);f.run('startMusic()');await flush();assert.equal(f.run('audioLive'),true);assert(Math.abs(f.audios[0].currentTime-f.run('songTime(T)'))<=1e-9,'pending media unlock maps newly selected story time');}
 }
});
await test('actual clicked-panel timing: first non-panel sound gesture preserves no-advance semantics',async()=>{
 for(const live of [false,true]){
  const f=await panelTimingFixture();bindActualPanelClick(f);f.run("seekTo(2,true);rendered=[];state='play';gestureStarted=true;audioLive="+live+";stageClick({target:{closest:function(){return null}}});");
  assert.equal(f.run('T'),2);assert.equal(f.run('rendered.length'),0);assert.equal(f.run('advances'),0);assert.equal(f.run('gestureStarted'),false);assert.deepEqual(fired(f),[]);
 }
});
// End standalone clicked-panel timing escape check.
const motionFrom=source.indexOf('  function panelMotionSample('),motionTo=source.indexOf('  function renderPanels(',motionFrom);
assert(motionFrom>=0&&motionTo>motionFrom,'real motion sample and application boundaries');
const mc=vm.createContext({REDUCED:false,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),c01:v=>Math.max(0,Math.min(1,v)),ease:v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);},panelFadeStart:(x,i)=>x.exitStart+i});
vm.runInContext(source.slice(motionFrom,motionTo),mc);
const sample=(preset,beat,start=1,stop=20,strength=1,reduced=false)=>JSON.parse(JSON.stringify(mc.panelMotionSample({preset,beats:4,strength},beat,start,stop,reduced)));
await test('real motion: before focus, unspecified and still are neutral',()=>{for(const p of ['push','drift-left','drift-right','shadow','light','still'])assert.deepEqual(sample(p,0),{transform:'none',filter:'none',clipPath:'none'});assert.deepEqual(JSON.parse(JSON.stringify(mc.panelMotionSample(null,3,1,10,false))),{transform:'none',filter:'none',clipPath:'none'});});
await test('real motion: samples deterministic; repeat same clock freezes pause',()=>{for(const p of ['push','drift-left','drift-right','shadow','light'])assert.deepEqual(sample(p,2.4),sample(p,2.4));});
await test('real motion: old focus rests exactly at next-panel beat',()=>{for(const p of ['push','drift-left','drift-right','shadow','light'])assert.deepEqual(sample(p,5,1,3),sample(p,10,1,3));});
await test('real motion: reduced motion disables every preset',()=>{for(const p of ['push','drift-left','drift-right','shadow','light'])assert.deepEqual(sample(p,3,1,20,1,true),{transform:'none',filter:'none',clipPath:'none'});});
await test('real motion: zoom/drift/brightness bounded across clock and strength',()=>{for(const p of ['push','drift-left','drift-right','shadow','light'])for(const strength of [-1,0,0.5,1,2])for(let beat=0;beat<=12;beat+=0.25){const s=sample(p,beat,1,20,strength);const sc=s.transform.match(/scale\(([^)]+)\)/),tr=s.transform.match(/translateX\(([^)%]+)%\)/),br=s.filter.match(/brightness\(([^)]+)\)/);if(sc)assert(+sc[1]>=1&&+sc[1]<=1.06);if(tr)assert(Math.abs(+tr[1])<=1.2);if(br)assert(+br[1]>=0.88&&+br[1]<=1.10);}});
await test('real application: targets image only; never lettering/frame/paper',()=>{const art={style:{}},panel={style:{}},letter={style:{}},border={style:{}},o={motionArt:art,el:panel,box:letter,border,d:{at:1,motion:{preset:'push'}},cache:{}};mc.applyPanelMotion(o,{exitStart:20,panels:[o]},0,3);assert.match(art.style.transform,/scale/);assert.deepEqual(panel.style,{});assert.deepEqual(letter.style,{});assert.deepEqual(border.style,{});});
await test('reduced-motion CSS holds geometry static; real sampler removes light/shadow',()=>{const css=readFileSync(resolve(reference,'src/styles/comic-story.css'),'utf8');assert.match(css,/@media \(prefers-reduced-motion: reduce\)[^\n]+transform: none !important;/);});

await test('real motion: authored strengths produce measurable selected focus at a reference350px crop',()=>{
 for(const preset of ['push','drift-left','drift-right'])for(const strength of [0.3,0.4,0.6]){
  const value=sample(preset,5,1,20,strength),scale=+(value.transform.match(/scale\(([^)]+)\)/)?.[1]||1),travel=+(value.transform.match(/translateX\(([^)%]+)%\)/)?.[1]||0);
  const edgeTravel=Math.abs(travel)*350/100+(scale-1)*350/2;
  assert(edgeTravel>=2,`${preset} strength${strength}: ${edgeTravel}px reference-edge travel is below the model floor`);
 }
});
await test('actual renderPanels invokes art-only motion with scene-clock and freezes hold/reduced samples',()=>{
 const cut=(a,b)=>{const i=source.indexOf(a),j=source.indexOf(b,i);assert(i>=0&&j>i,a);return source.slice(i,j);};
 const cc=vm.createContext({B:1,REDUCED:false,GHOST:.22,ENTER:1,EXIT:1.5,REVEAL:.75,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),c01:v=>Math.max(0,Math.min(1,v)),ease:v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);},snap:v=>v,inOut:v=>v});
 vm.runInContext(cut('  function fxTime(','  /* ---------- Transitions:'),cc);
 vm.runInContext(cut('  function sheetAt(','  var liveScene'),cc);
 vm.runInContext(cut('  function panelFadeStart(','  function hash('),cc);
 const make=(at,motion)=>({d:{at,motion},loaded:true,el:{style:{}},art:{style:{}},motionArt:{style:{}},cache:{},balloons:[],layers:[],rain:[],flick:[],floors:[]});
 const a=make(1,{preset:'drift-right',strength:.4,beats:4}),b=make(8,null),m={d:{b:10,hold:[]},panels:[a,b],dir:1,times:[{start:0,exitStart:20,exitEnd:22,panels:[a,b]}]};
 cc.renderPanels(m,1,0,11);const first=a.motionArt.style.transform;
 cc.renderPanels(m,5,0,15);const final=a.motionArt.style.transform;assert.notEqual(final,first);
 assert.equal(a.el.style.transform,'none');assert.equal(a.art.style.transform,undefined);
 cc.renderPanels(m,5,0,15);assert.equal(a.motionArt.style.transform,final);
 m.d.hold=[[2,6]];cc.renderPanels(m,3,1,13);const frozen=a.motionArt.style.transform;cc.renderPanels(m,4,1,14);assert.equal(a.motionArt.style.transform,frozen);
 cc.REDUCED=true;cc.renderPanels(m,5,0,15);assert.equal(a.motionArt.style.transform,'none');assert.equal(a.motionArt.style.filter,'none');
 assert.match(source,/o\.motionArt = c/,'actual raster loader binds crop node');
});


await test('actual render brightness reaches a bounded authored-strength pulse on fully revealed art and freezes paused/hold/reduced',()=>{
 const cut=(a,b)=>{const i=source.indexOf(a),j=source.indexOf(b,i);assert(i>=0&&j>i,a);return source.slice(i,j);};
 for(const preset of ['light','shadow']){
  const cc=vm.createContext({B:1,REDUCED:false,GHOST:.22,ENTER:1,EXIT:1.5,REVEAL:.75,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),c01:v=>Math.max(0,Math.min(1,v)),ease:v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);},snap:v=>v,inOut:v=>v});
  vm.runInContext(cut('  function fxTime(','  /* ---------- Transitions:'),cc);vm.runInContext(cut('  function sheetAt(','  var liveScene'),cc);vm.runInContext(cut('  function panelFadeStart(','  function hash('),cc);
  const make=(at,motion)=>({d:{at,motion},loaded:true,el:{style:{}},art:{style:{}},motionArt:{style:{}},cache:{},balloons:[],layers:[],rain:[],flick:[],floors:[]});
  const a=make(1,{preset,strength:.3,beats:4}),b=make(8,null),m={d:{b:10,hold:[]},panels:[a,b],dir:1,times:[{start:0,exitStart:20,exitEnd:22,panels:[a,b]}]};
  cc.renderPanels(m,3,0,13);const peak=a.motionArt.style.filter,brightness=+peak.match(/brightness\(([^)]+)\)/)[1];
  assert(+a.art.style.opacity>=.95,'pulse must be sampled on fully revealed art');assert(Math.abs(brightness-1)>=.0295,`${preset} visible pulse delta${Math.abs(brightness-1)} below floor`);
  assert(brightness>=.88&&brightness<=1.10);assert.equal(a.motionArt.style.transform,'none');assert.equal(a.el.style.transform,'none');
  cc.renderPanels(m,3,0,13);assert.equal(a.motionArt.style.filter,peak);
  cc.renderPanels(m,5,0,15);assert.equal(a.motionArt.style.filter,'brightness(1.00000)','single smooth pulse returns to neutral');
  m.d.hold=[[2,6]];cc.renderPanels(m,3,1,13);const frozen=a.motionArt.style.filter;cc.renderPanels(m,4,1,14);assert.equal(a.motionArt.style.filter,frozen);
  cc.REDUCED=true;cc.renderPanels(m,3,0,13);assert.equal(a.motionArt.style.filter,'none');
 }
});

const gateSource=readFileSync(resolve(reference,'scripts/comic-story-deslop.mjs'),'utf8');
const ga=gateSource.indexOf('function panelMotionErrors('),gb=gateSource.indexOf('// End panel-motion validator.',ga);
assert(ga>=0&&gb>ga,'actual authored-motion gate boundaries');
const gate=vm.runInNewContext(gateSource.slice(ga,gb)+';panelMotionErrors');
await test('actual deslop gate accepts only declared bounded presets',()=>{for(const preset of ['still','push','drift-left','drift-right','shadow','light']){assert.equal(gate({preset}).length,0);assert.equal(gate({preset,beats:2,strength:0}).length,0);assert.equal(gate({preset,beats:8,strength:1}).length,0);}assert.equal(gate(null).length,0);});
await test('actual deslop gate rejects unknown effects, fields and unsafe values',()=>{for(const m of ['push',[],{}, {preset:'blur'}, {preset:'push',target:'page'}, {preset:'light',beats:1.99}, {preset:'light',beats:8.01}, {preset:'shadow',beats:NaN}, {preset:'push',beats:'4'}, {preset:'push',strength:Infinity}, {preset:'push',strength:-0.01}, {preset:'push',strength:1.01}])assert(gate(m).length>0,JSON.stringify(m));const css=readFileSync(resolve(reference,'src/styles/comic-story.css'),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');assert(!/(^|[^-])filter\s*:/im.test(css),'CSS filter ban remains satisfied');});
console.log(JSON.stringify({runtime,checks:results.length,passed:results.filter(r=>r.pass).length,results,limitation:'Modelled Web Audio policy and actual controller samples; browser crops, audible balance and real playback remain unreviewed.'},null,2));
if(results.some(r=>!r.pass))process.exitCode=1;
