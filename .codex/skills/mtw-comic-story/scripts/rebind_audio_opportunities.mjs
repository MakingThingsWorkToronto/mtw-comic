/** Rebind an inspected opportunity inventory after geometry-only page/phone changes. No pixel/hearing approval. */
import fs from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {contained,hash,checkFile,loadContext,validateFiles,validateAudioOpportunities,panelSelectedMedia} from './audio_opportunities.mjs';

const fail=m=>{throw Error(m);};
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const nonempty=x=>typeof x==='string'&&x.trim().length;
const semanticBalloon=b=>Object.fromEntries(['text','who','kind','characterIntro','sceneSetup','speech'].filter(k=>b[k]!==undefined).map(k=>[k,b[k]]));
export function storySnapshot(story){
 const panels=story.scenes.flatMap(s=>s.panels.map(p=>({panelId:p.img??p.id,sceneId:s.id,words:(p.balloons??[]).map(semanticBalloon),media:panelSelectedMedia(s,p)})));
 if(panels.some(p=>!nonempty(p.panelId))||new Set(panels.map(p=>p.panelId)).size!==panels.length)fail('Exact globally unique authored panel IDs required; ordinal aliases cannot be silently carried across splits');
 return {storyId:story.id,issue:story.issue,title:story.title,bpm:story.bpm,panels};
}
function remapKey(row,map){const p=map.get(row.panelId);if(!p)fail('Missing stable panel '+row.panelId);return {...row,sceneId:p.sceneId,panelId:p.panelId};}
export function prepareRebind(original,before,after,beforeSnapshot,afterSnapshot,successors=[]){
 if(!eq(['storyId','issue','title','bpm'].map(k=>beforeSnapshot[k]),['storyId','issue','title','bpm'].map(k=>afterSnapshot[k])))fail('Story identity/title/tempo changed');
 const oldPanels=beforeSnapshot.panels,newPanels=afterSnapshot.panels;
 if(!eq(oldPanels.map(p=>p.panelId),newPanels.map(p=>p.panelId)))fail('Missing/reordered/new stable panel IDs');
 const newMap=new Map(newPanels.map(p=>[p.panelId,p])),oldBoxes=new Map(original.boxes.map(b=>[b.panelId,b]));
 if(new Set(successors.map(s=>s.panelId)).size!==successors.length)fail('Duplicate successor declaration');
 const declarations=new Map(successors.map(s=>[s.panelId,s]));
 for(const old of oldPanels){
  const current=newMap.get(old.panelId);if(!eq(old.words,current.words))fail('Words/speakers/caption identity/speech changed: '+old.panelId);
  const declared=declarations.get(old.panelId);
  if(!eq(old.media,current.media)){
   if(!declared||!eq(declared.oldMedia,old.media)||!eq(declared.newMedia,current.media)||!eq(declared.oldVisuals,oldBoxes.get(old.panelId)?.visuals))fail('Changed selected artwork requires exact inspected successor: '+old.panelId);
   if(declared.reviewStage!=='actual-master-pixels-inspected'||!nonempty(declared.reviewedBy)||!nonempty(declared.reviewedAt)||!nonempty(declared.observations)||!Array.isArray(declared.newVisuals)||!declared.newVisuals.length||declared.humanApproval!==false)fail('Missing explicit master-pixel successor observations; never infer human approval');
   if(!eq(declared.retainedOpportunityIds,oldBoxes.get(old.panelId).opportunityIds))fail('Successor does not retain exact inspected opportunity inventory');
  }else if(declared)fail('Unused successor declaration: '+old.panelId);
 }
 for(const id of declarations.keys())if(!newMap.has(id))fail('Unknown successor panel');
 const audit=structuredClone(original);audit.storySource=after.source;audit.librarySource=after.library;
 audit.boxes=audit.boxes.map(b=>{let box=remapKey(b,newMap);box.selectedMedia=structuredClone(newMap.get(b.panelId).media);const d=declarations.get(b.panelId);if(d){box.visuals=structuredClone(d.newVisuals);box.visualReview={status:'inspected',observations:d.observations};}return box;});
 for(const o of audit.opportunities)o.anchors=o.anchors.map(a=>{const r=remapKey(a,newMap),d=declarations.get(a.panelId);if(d){if(d.newVisuals.length!==1)fail('Multiple successor views require explicit per-anchor view mapping');r.viewId=d.newVisuals[0].viewId;r.observation=a.observation+' Inspected successor: '+d.observations;}return r;});
 const panels=new Map(after.panels.map(p=>[p.panelId,p]));
 for(const d of audit.coverage){if(d.state!=='authored')continue;const c=d.cue,oldCue=original.coverage.find(x=>x.opportunityId===d.opportunityId).cue,p=panels.get(c.panelId);if(!p)fail('Cue has no actual stable panel');c.sceneId=p.sceneId;
  if(c.source==='panel-sfx'){
   const old=before.panels.find(x=>x.panelId===c.panelId)?.sfx[c.cueIndex],current=p.sfx[c.cueIndex];if(!old||!current||old.kind!==current.kind)fail('Authored event recipe/order changed; fresh action review required');
   const asset=after.records.get(c.libraryRecordId);if(!asset||asset.kind!==current.kind)fail('Current soundtrack recipe missing or changed');
   c.startBeat=p.startBeat+(current.delay??0);c.endBeat=Math.min(after.beats,c.startBeat+oldCue.endBeat-oldCue.startBeat);c.gain=current.gain??1;
  }else if(c.source==='panel-room'){
   const o=audit.opportunities.find(o=>o.id===d.opportunityId),anchors=o.anchors.map(a=>panels.get(a.panelId));if(anchors.some(a=>!a||a.room!==p.room)||p.room!==oldCue.room)fail('Room setting changed; fresh observed opportunity required');
   const asset=after.records.get(c.libraryRecordId);if(!asset||asset.room!==p.room)fail('Current room record does not match observed setting');
   const positions=anchors.map(a=>after.panels.indexOf(a)),first=Math.min(...positions),last=Math.max(...positions);if(after.panels.slice(first,last+1).some(a=>a.room!==p.room))fail('Continuous ambience crosses a different room');
   c.room=p.room;c.startBeat=after.panels[first].startBeat;c.endBeat=after.panels[last+1]?.startBeat??after.beats;c.gain=after.roomAssets[p.room]?.gain??1;
  }else fail('Unsupported cue source');
  if(c.endBeat<=c.startBeat)fail('Retiming leaves no actual cue window');
 }
 // All previously heard/native evidence remains historical, never silently accepted after retiming.
 audit.qualityReview={...audit.qualityReview,listening:'pending',nativeTiming:'pending',humanApproval:false};
 if(audit.opportunities.length!==original.opportunities.length||!eq(audit.opportunities.map(o=>o.id),original.opportunities.map(o=>o.id))||!eq(audit.coverage.map(d=>[d.opportunityId,d.state]),original.coverage.map(d=>[d.opportunityId,d.state])))fail('Inventory/decisions changed');
 return audit;
}
export async function loadSnapshot(root,source){const context=await loadContext(root,source),mod=await import(pathToFileURL(contained(root,source)).href+'?source-sha256='+context.source.sha256),story=Object.values(mod).find(v=>v&&Array.isArray(v.scenes));await checkFile(root,source,context.source.sha256);return {context,snapshot:storySnapshot(story)};}
const snapshot=loadSnapshot;
export async function inventoryReviewPlan({root,auditPath,expectedAuditSha256,afterSourcePath}){
 const bytes=await fs.readFile(resolve(auditPath));if(hash(bytes)!==expectedAuditSha256)fail('Original immutable audit hash mismatch');const original=JSON.parse(bytes),current=await snapshot(root,afterSourcePath);
 if(!eq(original.boxes.map(b=>b.panelId),current.snapshot.panels.map(p=>p.panelId)))fail('Current reviewed inventory must retain every stable panel in exact order');
 return {schemaVersion:1,mode:'retained-inventory-current-source-review',historicalSourceUnavailable:true,originalAuditSha256:expectedAuditSha256,currentSourceSha256:current.context.source.sha256,currentLibrarySha256:current.context.library.sha256,currentSemanticSnapshotSha256:hash(JSON.stringify(current.snapshot)),reviewStage:'pending',reviewedBy:'',reviewedAt:'',observations:'',humanApproval:false,invariantEvidence:[],rows:current.snapshot.panels.map((p,i)=>({panelId:p.panelId,currentMedia:p.media,oldVisuals:original.boxes[i].visuals,newVisuals:[],retainedOpportunityIds:original.boxes[i].opportunityIds,observations:''}))};
}
export async function rebindAudit({root,auditPath,expectedAuditSha256,beforeSourcePath,afterSourcePath,successorPath}){
 root=resolve(root);const bytes=await fs.readFile(resolve(auditPath));if(!/^[a-f0-9]{64}$/.test(expectedAuditSha256??'')||hash(bytes)!==expectedAuditSha256)fail('Original immutable audit hash mismatch');const original=JSON.parse(bytes),before=await snapshot(root,beforeSourcePath),after=await snapshot(root,afterSourcePath);
 if(before.context.source.sha256!==original.storySource.sha256)fail('Retained before source hash differs from inspected original audit');
 // Validate retained words/cues/visuals against actual old TS and the current verified library records.
 const old=structuredClone(original);old.storySource=before.context.source;old.librarySource=before.context.library;await validateFiles(old,before.context,root);validateAudioOpportunities(old,before.context);
 let successors=[],successorSha256=null;
 if(successorPath){const data=await fs.readFile(resolve(successorPath));successorSha256=hash(data);const s=JSON.parse(data);if(s.schemaVersion!==1||s.storyBeforeSha256!==original.storySource.sha256||s.storyAfterSha256!==after.context.source.sha256)fail('Stale successor source guards');successors=s.rows??[];}
 const audit=prepareRebind(original,before.context,after.context,before.snapshot,after.snapshot,successors);await validateFiles(audit,after.context,root);const result=validateAudioOpportunities(audit,after.context);
 audit.rebind={originalAudit:{path:auditPath,sha256:expectedAuditSha256},originalSource:original.storySource,retainedBeforeSource:before.context.source,currentSource:after.context.source,originalLibrary:original.librarySource,currentLibrary:after.context.library,originalSemanticSnapshotSha256:hash(JSON.stringify(before.snapshot)),currentSemanticSnapshotSha256:hash(JSON.stringify(after.snapshot)),successorSha256,originalQualityReview:original.qualityReview??null,standing:'Geometry/clock rebind only; denominator preserved; master inspections retained; hearing/native/human approval pending',result};return audit;
}
/** Explicit NEW current-source inventory review when the historical TS is unavailable.
 * This is never reported as a verified automatic before/after word comparison. */
export async function reviewInventoryAudit({root,auditPath,expectedAuditSha256,afterSourcePath,inventoryReviewPath}){
 root=resolve(root);const bytes=await fs.readFile(resolve(auditPath));if(!/^[a-f0-9]{64}$/.test(expectedAuditSha256??'')||hash(bytes)!==expectedAuditSha256)fail('Original immutable audit hash mismatch');
 const original=JSON.parse(bytes),current=await snapshot(root,afterSourcePath),reviewBytes=await fs.readFile(resolve(inventoryReviewPath)),review=JSON.parse(reviewBytes);
 if(review.schemaVersion!==1||review.mode!=='retained-inventory-current-source-review'||review.historicalSourceUnavailable!==true||review.originalAuditSha256!==expectedAuditSha256||review.currentSourceSha256!==current.context.source.sha256||review.currentLibrarySha256!==current.context.library.sha256||review.currentSemanticSnapshotSha256!==hash(JSON.stringify(current.snapshot)))fail('Current inventory review source/library/semantic guards missing or stale');
 if(review.reviewStage!=='actual-master-pixels-inspected'||!nonempty(review.reviewedBy)||!nonempty(review.reviewedAt)||!nonempty(review.observations)||review.humanApproval!==false||!review.invariantEvidence?.length)fail('Explicit current pixel review and retained invariant evidence required; no human approval inference');
 for(const e of review.invariantEvidence){if(!nonempty(e.meaning))fail('Invariant evidence meaning missing');await checkFile(root,e.path,e.sha256);}
 if(original.storyId!==current.context.storyId||!eq(original.boxes.map(b=>b.panelId),current.snapshot.panels.map(p=>p.panelId))||!eq(review.rows?.map(r=>r.panelId),current.snapshot.panels.map(p=>p.panelId)))fail('Current reviewed inventory must retain every stable panel in exact order');
 // Only the current snapshot is compared here. No historical words/TS are reconstructed.
 const audit=prepareRebind(original,current.context,current.context,current.snapshot,current.snapshot),rows=new Map(review.rows.map(r=>[r.panelId,r]));
 for(const [i,box]of audit.boxes.entries()){
  const r=rows.get(box.panelId),old=original.boxes[i];
  if(!eq(r.currentMedia,current.snapshot.panels[i].media)||!eq(r.oldVisuals,old.visuals)||!eq(r.retainedOpportunityIds,old.opportunityIds)||!nonempty(r.observations)||r.newVisuals?.length!==1)fail('Every current selected visual needs exact per-box reviewed binding and retained opportunities');
  for(const v of old.visuals??[])await checkFile(root,v.path,v.sha256);
  box.visuals=structuredClone(r.newVisuals);box.visualReview={status:'inspected',observations:r.observations};
 }
 for(const o of audit.opportunities)for(const a of o.anchors){const r=rows.get(a.panelId);a.viewId=r.newVisuals[0].viewId;a.observation+=' Current-source inspected successor: '+r.observations;}
 await validateFiles(audit,current.context,root);const result=validateAudioOpportunities(audit,current.context);
 audit.rebind={mode:review.mode,originalAudit:{path:auditPath,sha256:expectedAuditSha256},originalSource:original.storySource,historicalSourceUnavailable:true,historicalWordsCompared:false,currentSource:current.context.source,originalLibrary:original.librarySource,currentLibrary:current.context.library,currentSemanticSnapshotSha256:hash(JSON.stringify(current.snapshot)),inventoryReview:{path:inventoryReviewPath,sha256:hash(reviewBytes)},invariantEvidence:review.invariantEvidence,originalQualityReview:original.qualityReview??null,standing:'Explicit new current-source pixel/inventory review retaining denominator. Historical TS unavailable; automatic word equivalence not verified. Hearing/native/human approval pending.',result};
 return audit;
}
export async function writeRebind(options){const output=contained(options.root,options.outputPath);if(!options.outputPath.startsWith('wiki/comics-library/records/'))fail('Output must be new canonical comic record');const audit=await (options.inventoryReviewPath?reviewInventoryAudit(options):rebindAudit(options));if(hash(await fs.readFile(resolve(options.auditPath)))!==options.expectedAuditSha256)fail('Original audit changed during preflight');if(options.successorPath&&hash(await fs.readFile(resolve(options.successorPath)))!==audit.rebind.successorSha256)fail('Successor review changed during preflight');if(options.inventoryReviewPath&&hash(await fs.readFile(resolve(options.inventoryReviewPath)))!==audit.rebind.inventoryReview.sha256)fail('Inventory review changed during preflight');await checkFile(options.root,audit.storySource.path,audit.storySource.sha256);await checkFile(options.root,audit.librarySource.path,audit.librarySource.sha256);await fs.mkdir(dirname(output),{recursive:true});await fs.writeFile(output,JSON.stringify(audit,null,2)+'\n',{encoding:'utf8',flag:'wx'});return {path:options.outputPath,sha256:hash(await fs.readFile(output)),result:audit.rebind.result};}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),get=k=>args[args.indexOf('--'+k)+1];
 for(const k of ['audit','audit-sha256','after-source','out'])if(!args.includes('--'+k))fail('Usage: node rebind_audio_opportunities.mjs --root <repo> --audit <immutable.json> --audit-sha256 <sha> --after-source <repo-relative current.ts> --out wiki/comics-library/records/<new>.json (--before-source <repo-relative retained.ts> [--visual-successors <exact dossier.json>] | --current-inventory-review <exact reviewed dossier.json>)');
 if(args.includes('--before-source')===args.includes('--current-inventory-review'))fail('Choose strict before-source OR explicit current inventory review');
 console.log(JSON.stringify(await writeRebind({root:args.includes('--root')?get('root'):resolve(dirname(fileURLToPath(import.meta.url)),'../../../..'),auditPath:get('audit'),expectedAuditSha256:get('audit-sha256'),beforeSourcePath:get('before-source'),afterSourcePath:get('after-source'),outputPath:get('out'),successorPath:args.includes('--visual-successors')?get('visual-successors'):null,inventoryReviewPath:args.includes('--current-inventory-review')?get('current-inventory-review'):null}),null,2));
}
