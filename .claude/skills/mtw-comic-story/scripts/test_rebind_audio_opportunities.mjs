import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {hash,loadContext,validateAudioOpportunities,validateFiles} from './audio_opportunities.mjs';
import {storySnapshot,prepareRebind,rebindAudit,reviewInventoryAudit,inventoryReviewPlan,writeRebind} from './rebind_audio_opportunities.mjs';

const args=process.argv.slice(2),at=args.indexOf('--fixtures');
const parent=resolve(at>=0?args[at+1]:join(dirname(fileURLToPath(import.meta.url)),'fixture-runs'));
await fs.mkdir(parent,{recursive:true});
const root=await fs.mkdtemp(join(parent,'run-'));
const put=async(path,bytes)=>{const target=join(root,path);await fs.mkdir(dirname(target),{recursive:true});await fs.writeFile(target,bytes,{encoding:'utf8',flag:'wx'});};
const recipe='function transit(){ return 1; }',media='synthetic room bytes; no perceptual evidence';
await put('package.json',JSON.stringify({type:'module'}));
await put('site/runtime.js',recipe);
await put('wiki/image-library/master.png','synthetic fixture visual; no pixel approval');
await put('wiki/image-library/successor.png','synthetic successor; no pixel approval');
await put('wiki/soundtrack-library/room.mp3',media);await put('site/public/room.mp3',media);
await put('wiki/soundtrack-library/comic-audio.json',JSON.stringify({records:[
 {id:'transit',type:'effect-recipe',kind:'transit',runtime:{path:'site/runtime.js',functionSource:recipe,recipeSha256:hash(recipe)}},
 {id:'office',type:'ambience-recording',room:'office',media:{path:'wiki/soundtrack-library/room.mp3',sha256:hash(media)}}]}));
function story(split=false){return {id:'fixture',issue:1,title:'Audit fixture',bpm:90,beats:30,soundAssets:{rooms:{office:{src:'/room.mp3',gain:.07}}},scenes:split?
 [{id:'first',b:0,art:'/comic/fixture',layers:[{role:'background',src:'/comic/bg.png'}],panels:[{img:'city',at:3,sfx:[{kind:'transit',gain:.15,delay:2}],balloons:[{who:'Matt',text:'Exact café words.',x:.2,y:.7}]}]},
 {id:'second',b:12,art:'/comic/fixture',layers:[{role:'background',src:'/comic/bg.png'}],room:'office',panels:[{img:'desk',at:1,balloons:[]},{img:'paper',at:8,balloons:[]}]}]:
 [{id:'opening',b:0,art:'/comic/fixture',layers:[{role:'background',src:'/comic/bg.png'}],panels:[{img:'city',at:1,sfx:[{kind:'transit',gain:.2}],balloons:[{who:'Matt',text:'Exact café words.',x:.1,y:.1}]},{img:'desk',at:8,room:'office',balloons:[]},{img:'paper',at:18,room:'office',balloons:[]}]}]};}
const beforeStory=story(),afterStory=story(true);
await put('site/before.ts','export const STORY='+JSON.stringify(beforeStory)+';');await put('site/after.ts','export const STORY='+JSON.stringify(afterStory)+';');
const before=await loadContext(root,'site/before.ts'),after=await loadContext(root,'site/after.ts');
const visual={viewId:'master',path:'wiki/image-library/master.png',sha256:hash('synthetic fixture visual; no pixel approval')};
const anchor=(id,observation)=>({sceneId:'opening',panelId:id,viewId:'master',observation});
const original={schemaVersion:1,storyId:'fixture',storySource:before.source,librarySource:before.library,
 boxes:before.panels.map(p=>({sceneId:p.sceneId,panelId:p.panelId,visualReview:{status:'inspected',observations:'Synthetic binding fixture, not actual pixels.'},visuals:[visual],decisionReason:'Frozen test inventory.',opportunityIds:[p.panelId==='city'?'pass':'office-run'],speech:[]})),
 opportunities:[{id:'pass',category:'action',rationale:'Synthetic single depicted passing transit.',anchors:[anchor('city','Synthetic passing transit.')]},{id:'office-run',category:'ambient',segmentId:'one-office-run',rationale:'One continuous room, not two opportunities.',anchors:[anchor('desk','Synthetic office desk.'),anchor('paper','Synthetic same office paper.')]}],
 coverage:[{opportunityId:'pass',state:'authored',reason:'One saved recipe.',cue:{libraryRecordId:'transit',source:'panel-sfx',sceneId:'opening',panelId:'city',cueIndex:0,startBeat:1,endBeat:5,gain:.2,fadeInBeats:0,fadeOutBeats:1,reuseReason:'Existing recipe.',mixReason:'Bounded.'}},
 {opportunityId:'office-run',state:'authored',reason:'One room recording.',cue:{libraryRecordId:'office',source:'panel-room',sceneId:'opening',panelId:'desk',room:'office',startBeat:8,endBeat:30,gain:.07,fadeInBeats:1,fadeOutBeats:1,reuseReason:'Existing room.',mixReason:'Quiet.'}}],qualityReview:{listening:'heard-historical-only',nativeTiming:'historical-only'}};
await put('original.json',JSON.stringify(original));
const options={root,auditPath:join(root,'original.json'),expectedAuditSha256:hash(await fs.readFile(join(root,'original.json'))),beforeSourcePath:'site/before.ts',afterSourcePath:'site/after.ts',outputPath:'wiki/comics-library/records/rebound.json'};
let passed=0;const good=await rebindAudit(options);
assert.equal(good.rebind.result.denominator,2);assert.equal(good.rebind.result.covered,2);
assert.equal(good.coverage[0].cue.startBeat,5);assert.equal(good.coverage[0].cue.endBeat,9);assert.equal(good.coverage[0].cue.gain,.15);
assert.equal(good.coverage[1].cue.startBeat,13);assert.equal(good.coverage[1].cue.endBeat,30);
assert.equal(good.qualityReview.listening,'pending');assert.equal(good.qualityReview.humanApproval,false);passed++;
await writeRebind(options);await assert.rejects(writeRebind(options),/EEXIST/);passed++;
await assert.rejects(writeRebind({...options,outputPath:'../outside.json'}),/Unsafe/);passed++;
await assert.rejects(rebindAudit({...options,expectedAuditSha256:'f'.repeat(64)}),/audit hash/);passed++;
await assert.rejects(rebindAudit({...options,beforeSourcePath:'site/after.ts'}),/Retained before/);passed++;
function bad(label,change,pattern){const b=storySnapshot(beforeStory),a=storySnapshot(afterStory),old=structuredClone(original),ctx={...after,panels:structuredClone(after.panels),records:new Map(after.records)};change({b,a,old,ctx});assert.throws(()=>prepareRebind(old,before,ctx,b,a),pattern,label);passed++;}
bad('changed words',f=>f.a.panels[0].words[0].text='New words',/Words/);
bad('changed speaker',f=>f.a.panels[0].words[0].who='Dana',/Words/);
bad('speech binding changed',f=>f.a.panels[0].words[0].speech={src:'/new.mp3'},/Words/);
bad('lost stable panel',f=>f.a.panels.pop(),/panel IDs/);
bad('reordered stable panels',f=>f.a.panels.reverse(),/panel IDs/);
bad('unreviewed changed media',f=>f.a.panels[0].media.art='/new',/inspected successor/);
bad('wrong current recipe',f=>f.ctx.panels[0].sfx[0].kind='impact',/recipe/);
bad('missing current library',f=>f.ctx.records.delete('transit'),/recipe missing/);
bad('cross-room ambience',f=>f.ctx.panels[2].room='servers',/Room setting/);
const invalid=structuredClone(original);invalid.opportunities.push({...structuredClone(invalid.opportunities[0]),id:'fake'});await put('inflated.json',JSON.stringify(invalid));await assert.rejects(rebindAudit({...options,auditPath:join(root,'inflated.json'),expectedAuditSha256:hash(await fs.readFile(join(root,'inflated.json')))}),/visual opportunity|explicit sound|Dangling/);passed++;
assert.throws(()=>storySnapshot({...beforeStory,scenes:[{...beforeStory.scenes[0],panels:[beforeStory.scenes[0].panels[0],beforeStory.scenes[0].panels[0]]}]}),/unique/);passed++;
// This SAME path previously returned cached panels alongside a fresh source hash.
await put('site/repeated.ts','export const STORY='+JSON.stringify(beforeStory)+';');
const first=await loadContext(root,'site/repeated.ts');await fs.writeFile(join(root,'site/repeated.ts'),'export const STORY='+JSON.stringify(afterStory)+';','utf8');
const second=await loadContext(root,'site/repeated.ts');assert.notEqual(first.source.sha256,second.source.sha256);assert.equal(second.panels[0].key,'first/city');assert.equal(second.panels[0].startBeat,3);passed++;
const changed=structuredClone(afterStory);changed.scenes[0].art='/comic/new';
await put('site/successor.ts','export const STORY='+JSON.stringify(changed)+';');
const current=await loadContext(root,'site/successor.ts'),newVisual={viewId:'new-master',path:'wiki/image-library/successor.png',sha256:hash('synthetic successor; no pixel approval')};
const row={panelId:'city',oldMedia:storySnapshot(beforeStory).panels[0].media,newMedia:storySnapshot(changed).panels[0].media,oldVisuals:[visual],newVisuals:[newVisual],reviewStage:'actual-master-pixels-inspected',reviewedBy:'Synthetic fixture reviewer',reviewedAt:'2026-10-10T00:00:00Z',observations:'Synthetic fixture only; no real review claim.',retainedOpportunityIds:['pass'],humanApproval:false};
await put('successors.json',JSON.stringify({schemaVersion:1,storyBeforeSha256:before.source.sha256,storyAfterSha256:current.source.sha256,rows:[row]}));
const next=await rebindAudit({...options,afterSourcePath:'site/successor.ts',successorPath:join(root,'successors.json')});assert.equal(next.boxes[0].visuals[0].viewId,'new-master');assert.equal(next.opportunities[0].anchors[0].viewId,'new-master');passed++;
for(const [label,edit,pattern] of [['missing pixel observations',r=>r.observations='',/observations/],['human approval inferred',r=>r.humanApproval=true,/human approval/],['different denominator',r=>r.retainedOpportunityIds=[],/exact inspected/],['stale selected binding',r=>r.newMedia.art='/wrong',/exact inspected/]]){
 const copy=structuredClone(row);edit(copy);assert.throws(()=>prepareRebind(original,before,current,storySnapshot(beforeStory),storySnapshot(changed),[copy]),pattern,label);passed++;
}
const stale=structuredClone(row);stale.newVisuals[0].sha256='c'.repeat(64);await put('stale-visual.json',JSON.stringify({schemaVersion:1,storyBeforeSha256:before.source.sha256,storyAfterSha256:current.source.sha256,rows:[stale]}));
await assert.rejects(rebindAudit({...options,afterSourcePath:'site/successor.ts',successorPath:join(root,'stale-visual.json')}),/Stale\/missing/);passed++;
await validateFiles(good,after,root);const staleBinding=structuredClone(good);staleBinding.boxes[0].selectedMedia.art='/wrong';assert.throws(()=>validateAudioOpportunities(staleBinding,after),/selected media/);passed++;
await put('invariant.json',JSON.stringify({standing:'Synthetic retained word-invariant receipt; not original source bytes.'}));
const plan=await inventoryReviewPlan({...options,afterSourcePath:'site/successor.ts'});assert.equal(plan.reviewStage,'pending');assert.equal(plan.rows.length,3);assert.equal(plan.rows[0].newVisuals.length,0);await put('unreviewed-plan.json',JSON.stringify(plan));await assert.rejects(reviewInventoryAudit({...options,afterSourcePath:'site/successor.ts',inventoryReviewPath:join(root,'unreviewed-plan.json')}),/review|evidence/);passed++;
const reviewed={schemaVersion:1,mode:'retained-inventory-current-source-review',historicalSourceUnavailable:true,originalAuditSha256:options.expectedAuditSha256,currentSourceSha256:current.source.sha256,currentLibrarySha256:current.library.sha256,currentSemanticSnapshotSha256:hash(JSON.stringify(storySnapshot(changed))),reviewStage:'actual-master-pixels-inspected',reviewedBy:'Synthetic fixture reviewer',reviewedAt:'2026-10-10T00:00:00Z',observations:'Synthetic current per-box inspection fixture only.',humanApproval:false,invariantEvidence:[{path:'invariant.json',sha256:hash(await fs.readFile(join(root,'invariant.json'))),meaning:'Retained synthetic receipt; no historical source reconstruction.'}],rows:storySnapshot(changed).panels.map((p,i)=>({panelId:p.panelId,currentMedia:p.media,oldVisuals:original.boxes[i].visuals,newVisuals:[i===0?newVisual:visual],retainedOpportunityIds:original.boxes[i].opportunityIds,observations:'Synthetic per-box observation.'}))};
await put('inventory-review.json',JSON.stringify(reviewed));
const reviewedOptions={...options,afterSourcePath:'site/successor.ts',inventoryReviewPath:join(root,'inventory-review.json')};
const explicit=await reviewInventoryAudit(reviewedOptions);assert.equal(explicit.rebind.historicalWordsCompared,false);assert.equal(explicit.rebind.historicalSourceUnavailable,true);assert.equal(explicit.rebind.result.denominator,2);assert.equal(explicit.qualityReview.listening,'pending');passed++;
for(const [label,edit,pattern] of [['missing box',r=>r.rows.pop(),/every stable panel/],['stale source',r=>r.currentSourceSha256='a'.repeat(64),/guards/],['wrong semantic guard',r=>r.currentSemanticSnapshotSha256='a'.repeat(64),/guards/],['missing retained receipt',r=>r.invariantEvidence=[],/invariant evidence/],['selected media mismatch',r=>r.rows[0].currentMedia.art='/other',/per-box/],['new opportunity invented',r=>r.rows[0].retainedOpportunityIds.push('invented'),/per-box/],['human approval fabricated',r=>r.humanApproval=true,/human approval/]]){
 const copy=structuredClone(reviewed);edit(copy);const path='review-negative-'+passed+'.json';await put(path,JSON.stringify(copy));await assert.rejects(reviewInventoryAudit({...reviewedOptions,inventoryReviewPath:join(root,path)}),pattern,label);passed++;
}
console.log(JSON.stringify({passed,root,standing:'Retained synthetic filesystem/binding fixtures; no real pixels, hearing, browser or human approval.'},null,2));
