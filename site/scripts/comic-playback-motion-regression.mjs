import assert from 'node:assert/strict';
import fs from 'node:fs';
import {motionChannels,motionPeakBeat,sampleMotionDom,channelMetrics,sameMotion,reducedStatic,targetVisible,readingSampleVerdict,playbackTerminalSummary,waitVoiceJump} from './comic-playback-motion.mjs';
const results=[];
async function test(name,run){await run();results.push(name);}
const scene={layers:[{id:'bg',role:'background'},{id:'agents',role:'agents',opacity:.9},{id:'light',role:'light'}],panels:[]};
await test('Still and zero-strength channels excluded; all seven real preset kinds included',()=>{
 assert.equal(motionChannels({motion:{preset:'still'},layerMotion:[{layerId:'agents',preset:'projection',strength:0}]},scene).length,0);
 for(const preset of ['push','drift-left','drift-right','light','shadow','projection','sprout'])assert.equal(motionChannels({layerMotion:[{layerId:'agents',preset}]},scene).length,1);
});
await test('Compound panel and independent named planes counted separately',()=>assert.equal(motionChannels({motion:{preset:'push'},layerMotion:[{layerId:'agents',preset:'projection'},{layerId:'light',preset:'sprout'}]},scene).length,3));
await test('Missing layer and duplicate channel rejected',()=>{
 assert.throws(()=>motionChannels({layerMotion:[{layerId:'missing',preset:'push'}]},scene));
 assert.throws(()=>motionChannels({layerMotion:[{layerId:'bg',preset:'push'},{layerId:'bg',preset:'push'}]},scene));
});
await test('Pulse/projection midspan and sprout end, bounded by next focus',()=>{
 assert.equal(motionPeakBeat({preset:'projection',beats:4},10,20),12);assert.equal(motionPeakBeat({preset:'sprout',beats:8},10,20),18);assert.equal(motionPeakBeat({preset:'push',beats:8},10,11),10.998);
});
function node(name,rect,style={},dataset={}){return {className:name,dataset,box:rect,style:{transform:'none',filter:'none',opacity:'1',clipPath:'none',transformOrigin:'50px 50px',visibility:'visible',backgroundImage:'url("http://localhost/art.png")',...style},offsetWidth:100,offsetHeight:100,parentElement:null,getBoundingClientRect(){return {x:this.box[0],y:this.box[1],width:this.box[2],height:this.box[3]};},closest(){return panel;}};}
const panel=node('cs-panel',[0,0,100,100]),art=node('cs-panel__art',[0,0,100,100]),stack=node('cs-crop-stack',[0,0,100,100]),bg=node('cs-crop cs-art-layer',[0,0,100,100],{},{layerId:'bg'}),agents=node('cs-crop cs-art-layer',[0,0,100,100],{opacity:'.9'},{layerId:'agents'}),border=node('cs-border',[0,0,100,100]),page=node('cs-page',[0,0,100,100],{},{scene:'test',artMode:'layers'});
art.parentElement=panel;stack.parentElement=art;bg.parentElement=stack;agents.parentElement=stack;panel.parentElement=page;
panel.querySelector=s=>s==='.cs-crop-stack'?stack:s==='.cs-panel__art'?art:null;
panel.querySelectorAll=s=>s==='.cs-crop'?[bg,agents]:s==='.cs-bw'?[]:[border];page.querySelector=()=>panel;
globalThis.document={querySelectorAll:()=>[page],elementsFromPoint:()=>[panel]};globalThis.getComputedStyle=n=>n.style;
globalThis.DOMMatrixReadOnly=class{constructor(transform){[this.a,this.b,this.c,this.d,this.e,this.f]=transform?.includes('10')?[1,0,0,1,10,0]:[1,0,0,1,0,0];}};
globalThis.window={__cropDecodes:{'http://localhost/art.png':Promise.resolve({url:'http://localhost/art.png',width:100,height:100})}};
globalThis.MTWComicStory={status:()=>({T:4,userPaused:true})};
const sample=channel=>sampleMotionDom({id:'test',index:0,channel});
const initial=await sample({id:'panel'});
stack.style.transform='matrix(1,0,0,1,10,0)';stack.box=[10,0,100,100];bg.box=[10,0,100,100];agents.box=[10,0,100,100];
const moved=await sample({id:'panel'}),compoundLayer=await sample({id:'layer:agents',layerId:'agents'});
await test('Actual DOM sampler chooses transformed ancestor stack, not identity child',()=>{assert.equal(moved.transform,stack.style.transform);assert.equal(moved.targetLayerId,'bg');assert.equal(channelMetrics(initial,moved,{preset:'drift-right',strength:.2}).movementPx,10);assert.equal(channelMetrics(initial,moved,{preset:'drift-right',strength:.2}).pass,true);});
await test('Compound layer world geometry sees ancestor motion with child transform none',()=>{assert.equal(compoundLayer.transform,'none');assert.equal(compoundLayer.worldRect[0],10);assert.equal(compoundLayer.chain[1].transform,stack.style.transform);});
await test('Parent movement cannot falsely fulfill an unchanged independent layer channel',()=>{const before={...compoundLayer,worldRect:[0,0,100,100]};assert.equal(channelMetrics(before,compoundLayer,{preset:'push',strength:.5}).pass,false);const lit={...compoundLayer,chain:[{filter:'none'},{filter:'brightness(1.05)'}]};assert.equal(channelMetrics(compoundLayer,lit,{preset:'light',strength:.5}).pass,false);});
await test('Named agent actual alpha does not invalidate reveal visibility',()=>{assert.equal(compoundLayer.targetLayerId,'agents');assert.equal(compoundLayer.targetOpacity,.9);assert.equal(compoundLayer.visible,true);});
await test('Missing requested DOM layer rejected',()=>assert.rejects(sample({id:'layer:missing',layerId:'missing'})));
await test('Layer fallback cannot fulfill actual layered motion',()=>{assert.equal(targetVisible({...moved,artMode:'fallback'},scene),false);assert.equal(targetVisible(moved,scene),true);});
await test('Actual identical paused compound sample passes; ancestor changes fail',()=>{assert.equal(sameMotion(moved,structuredClone(moved)),true);const changed=structuredClone(moved);changed.chain[0].transform='none';assert.equal(sameMotion(moved,changed),false);});
await test('Clock advance fails paused assertion even with identical geometry',()=>{const changed=structuredClone(moved);changed.status.T+=.02;assert.equal(sameMotion(moved,changed),false);});
await test('Actual runner fixed-lettering guard rejects moved body/border/frame',()=>{const source=fs.readFileSync(new URL('./comic-story-playback-review.mjs',import.meta.url),'utf8'),body=source.match(/function fixed\(a,b\) \{[^\n]+/)[0],fixed=Function('return ('+body+')')();assert.equal(fixed(initial,structuredClone(initial)),true);const bodyMoved=structuredClone(initial);bodyMoved.fixed[0].rect[0]+=1;assert.equal(fixed(initial,bodyMoved),false);const frameMoved=structuredClone(initial);frameMoved.frame[1]+=1;assert.equal(fixed(initial,frameMoved),false);});
await test('Stationary world corners fail push despite preset declaration',()=>assert.equal(channelMetrics(initial,initial,{preset:'push',strength:.5}).pass,false));
const filterSample=filter=>({...initial,chain:[{filter}],filter});
await test('Actual light and shadow brightness with authored strength',()=>{assert.equal(channelMetrics(filterSample('none'),filterSample('brightness(1.02)'),{preset:'light',strength:.2}).pass,true);assert.equal(channelMetrics(filterSample('none'),filterSample('brightness(.976)'),{preset:'shadow',strength:.2}).pass,true);assert.equal(channelMetrics(initial,initial,{preset:'light',strength:.2}).pass,false);});
await test('Projection requires actual alpha change and edge filter, not filter name alone',()=>{const before={...initial,targetOpacity:.9},after={...initial,targetOpacity:.87975,filter:'drop-shadow(0 0 1.4px rgba(91,220,217,.24))'};assert.equal(channelMetrics(before,after,{preset:'projection',strength:.5}).pass,true);assert.equal(channelMetrics(before,{...after,targetOpacity:.9},{preset:'projection',strength:.5}).pass,false);});
await test('Stepped sprout measures actual clip; unchanged clip fails',()=>{const before={...initial,clipPath:'inset(100% 0 0 0)'},after={...initial,clipPath:'inset(50% 0 0 0)'};assert.equal(channelMetrics(before,after,{preset:'sprout',floors:8}).pass,true);assert.equal(channelMetrics(before,before,{preset:'sprout',floors:8}).pass,false);});
await test('Reduced mode rejects ancestor movement, effect filter and unrevealed sprout',()=>{assert.equal(reducedStatic(initial),true);assert.equal(reducedStatic(compoundLayer),false);for(const [key,value] of [['filter','brightness(1.02)'],['clipPath','inset(50% 0 0 0)']]){const c=structuredClone(initial);c.chain[0][key]=value;assert.equal(reducedStatic(c),false);}});
const silent={panels:[{img:'x',balloons:[]}]},frame={ready:true,sheet:0,activeSheet:1,panelImageIds:['x']},visible=[{visible:true,occluded:false,artMode:'legacy',renderedBalloonCount:0}];
await test('No-word overlap is explicitly classified and qualified, not completed lettering',()=>{assert.deepEqual(readingSampleVerdict(silent,frame,[{balloons:[]}],visible),{kind:'quick-montage-overlap',pass:true});});
await test('Any authored text preserves strict active-sheet failure',()=>{const text={panels:[{img:'x',balloons:[{text:'Read this'}]}]};assert.equal(readingSampleVerdict(text,frame,[{balloons:[{found:true,opacity:1,untyped:0}]}],visible).pass,false);});
await test('Silent overlap fails hidden crop, rendered leftover words or unready plan',()=>{assert.equal(readingSampleVerdict(silent,frame,[{balloons:[]}],[{...visible[0],visible:false}]).pass,false);assert.equal(readingSampleVerdict(silent,frame,[{balloons:[]}],[{...visible[0],renderedBalloonCount:1}]).pass,false);assert.equal(readingSampleVerdict(silent,{...frame,ready:false},[{balloons:[]}],visible).pass,false);});
await test('Terminal only reports names/count/path, full error detail retained in original report',()=>{const report={checks:[1],frames:[1,2],errors:[{name:'amplitude',details:{huge:'x'.repeat(100000)}},{name:'amplitude',details:{}}],closed:true},summary=playbackTerminalSummary(report,'report.json');assert.equal(summary.errorCount,2);assert.equal(summary.errorCounts.amplitude,2);assert.ok(JSON.stringify(summary).length<300);assert.equal(report.errors[0].details.huge.length,100000);});
await test('Voice first-click timeout retains actual readiness diagnostic, no retry/forced seek',async()=>{let attempts=0;const entry={},fake={waitForFunction:async(fn,id,opts)=>{attempts++;assert.equal(opts.timeout,8000);throw Error('deadline');},evaluate:async()=>({status:{T:95,score:{speech:{assets:{clip:{status:'decoded'}},current:null}}},fonts:'loaded'})};await assert.rejects(waitVoiceJump(fake,{id:'line',start:90,src:'clip'},entry),/Home voice jump deadline/);assert.equal(attempts,1);assert.equal(entry.failedJump.actual.status.T,95);});
await test('Voice actual-current success has no fabricated failedJump',async()=>{const entry={};await waitVoiceJump({waitForFunction:async()=>{}},{id:'line'},entry);assert.equal(entry.failedJump,undefined);});
console.log(JSON.stringify({passed:results.length,checks:results,native:false}));
