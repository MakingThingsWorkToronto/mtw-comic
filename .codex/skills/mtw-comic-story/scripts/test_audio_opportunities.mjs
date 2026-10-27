import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {validateAudioOpportunities,contained,checkFile,hash} from './audio_opportunities.mjs';
const sha='a'.repeat(64),visual='b'.repeat(64);
function fixture(){
 const context={storyId:'fixture',source:{path:'site/fixture.ts',sha256:sha},library:{path:'wiki/soundtrack-library/comic-audio.json',sha256:sha},beats:20,
 panels:[{key:'opening/city',sceneId:'opening',panelId:'city',startBeat:1,room:'street',sfx:[{kind:'transit',gain:.2,delay:0}]},{key:'opening/desk',sceneId:'opening',panelId:'desk',startBeat:8,room:'office',sfx:[{kind:'paper',gain:.1}]}],
 records:new Map([['effect-transit',{type:'effect-recipe',kind:'transit'}],['room-office',{type:'ambience-recording',room:'office'}]]),visualBindings:new Set([`wiki/image-library/fixture.png:${visual}`])};
 const audit={schemaVersion:1,storyId:'fixture',storySource:context.source,librarySource:context.library,
 boxes:context.panels.map(p=>({sceneId:p.sceneId,panelId:p.panelId,visualReview:{status:'inspected',observations:'Actual source viewed; streetcar / office paperwork visible.'},visuals:[{viewId:'master',path:'wiki/image-library/fixture.png',sha256:visual}],decisionReason:'Setting/action explicitly audited.',opportunityIds:[p.panelId==='city'?'transit':'office'],speech:[{id:`${p.panelId}-words`,status:'gated',reason:'Exact words not human-approved; no new speech.'}]})),
 opportunities:[{id:'transit',category:'action',rationale:'Passing streetcar depicted, one short rumble.',anchors:[{sceneId:'opening',panelId:'city',viewId:'master',observation:'Visible moving TTC streetcar.'}]},{id:'office',category:'ambient',segmentId:'office-run-1',rationale:'Audible quiet office setting.',anchors:[{sceneId:'opening',panelId:'desk',viewId:'master',observation:'Office room and people at desk.'}]}],
 coverage:[{opportunityId:'transit',state:'authored',reason:'Low one-shot matches depicted passing transit.',cue:{libraryRecordId:'effect-transit',source:'panel-sfx',sceneId:'opening',panelId:'city',cueIndex:0,startBeat:1,endBeat:5,gain:.2,fadeInBeats:0,fadeOutBeats:1,reuseReason:'Existing reproducible recipe.',mixReason:'Low transient; hear balance before approval.'}},{opportunityId:'office',state:'silent',reason:'Hold room quiet while reader checks evidence.'}],qualityReview:{listening:'pending',nativeTiming:'pending'}};
 return {audit,context};
}
let count=0;
function bad(name,edit,pattern){const f=fixture();edit(f);assert.throws(()=>validateAudioOpportunities(f.audit,f.context),pattern,name);count++;}
let f=fixture(),r=validateAudioOpportunities(f.audit,f.context);
assert.equal(r.ratio,.5);assert.equal(r.quantityMet,true);assert.equal(r.gatedOrUnavailableSpeech,2);assert.equal(r.qualityReview.listening,'pending');count++;
f=fixture();f.audit.coverage[0]={opportunityId:'transit',state:'planned',reason:'No new source yet.'};r=validateAudioOpportunities(f.audit,f.context);assert.equal(r.quantityMet,false);assert.equal(r.covered,0);count++;
f=fixture();f.audit.coverage[0]={opportunityId:'transit',state:'missing',reason:'Not yet authored.'};f.audit.boxes[0].visualReview.status='pending';r=validateAudioOpportunities(f.audit,f.context);assert.equal(r.quantityMet,false);assert.equal(r.pendingVisualBoxes,1);count++;
bad('missing actual box',f=>f.audit.boxes.pop(),/actual box/);
bad('stale story',f=>f.audit.storySource={...f.context.source,sha256:visual},/story source/);
bad('stale library',f=>f.audit.librarySource={...f.context.library,sha256:visual},/library/);
bad('music denominator inflation',f=>f.audit.opportunities[0].category='music',/music\/speech/);
bad('duplicate opportunity',f=>f.audit.opportunities.push(structuredClone(f.audit.opportunities[0])),/Duplicate/);
bad('missing cue decision',f=>f.audit.coverage.pop(),/explicit sound/);
bad('wrong visual anchor',f=>f.audit.opportunities[0].anchors[0].viewId='invented',/visual opportunity/);
bad('unbound visual hash',f=>f.audit.boxes[0].visuals[0].sha256=sha,/visual bytes/);
bad('generic mismatched action',f=>f.context.records.set('effect-transit',{type:'effect-recipe',kind:'impact'}),/kind\/gain\/beat/);
bad('wrong event beat',f=>f.audit.coverage[0].cue.startBeat=2,/kind\/gain\/beat/);
bad('wrong gain',f=>f.audit.coverage[0].cue.gain=.9,/kind\/gain\/beat/);
bad('nonfinite mix',f=>f.audit.coverage[0].cue.gain=Infinity,/timing\/mix/);
bad('cannot claim pending pixels',f=>f.audit.boxes[0].visualReview.status='pending',/pending visual/);
bad('cannot count speech preview',f=>f.context.records.set('effect-transit',{type:'provider-preview',kind:'transit'}),/non-speech/);
bad('zero-duration sound does not fulfil',f=>f.audit.coverage[0].cue.endBeat=1,/timing\/mix/);
bad('same cue cannot fulfil two actions',f=>{const second=structuredClone(f.audit.opportunities[0]);second.id='duplicate-source';second.anchors[0].observation='Same pictured transit credited again as a separate rattle.';f.audit.opportunities.push(second);f.audit.boxes[0].opportunityIds.push(second.id);f.audit.coverage.push({...structuredClone(f.audit.coverage[0]),opportunityId:second.id});},/inflate multiple/);
bad('wrong room',f=>{f.audit.coverage[1]={opportunityId:'office',state:'authored',reason:'Wrong source intentionally tested.',cue:{...f.audit.coverage[0].cue,libraryRecordId:'room-office',source:'panel-room',sceneId:'opening',panelId:'desk',room:'servers',startBeat:8,endBeat:18}};},/room opportunity/);
assert.throws(()=>contained('C:/fixture','../outside.mp3'),/Unsafe/);count++;
const folder=await mkdtemp(join(tmpdir(),'mtw-audio-opportunity-'));
try{await writeFile(join(folder,'sound.mp3'),'real bytes');await checkFile(folder,'sound.mp3',hash('real bytes'));await assert.rejects(checkFile(folder,'sound.mp3',sha),/Stale/);count++;await assert.rejects(checkFile(folder,'missing.mp3',sha));count++;}finally{await rm(folder,{recursive:true});}
console.log(JSON.stringify({passed:count,standing:'Synthetic binding/denominator fixtures; no pixel/hearing/native approval.'}));
