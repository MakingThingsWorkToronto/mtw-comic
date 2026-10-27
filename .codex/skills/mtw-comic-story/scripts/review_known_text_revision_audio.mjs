/** Current-source non-speech audit after explicitly declared authoring words change.
 * Uses retained actual source; never reports strict word equivalence or speech approval. */
import fs from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {hash,contained,checkFile,validateFiles,validateAudioOpportunities} from './audio_opportunities.mjs';
import {loadSnapshot,prepareRebind} from './rebind_audio_opportunities.mjs';
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const nonempty=x=>typeof x==='string'&&x.trim().length;
const sha=x=>/^[a-f0-9]{64}$/.test(x??'');
const fail=m=>{throw Error(m);};
const panelIds=['dm-letters','dm-screen-dark','dm-rule-written'];
const captionIds=['dm-boardroom','dm-codex-waves'];
export function checkKnownTextChanges(before,after,changes){
 if(!eq(['storyId','issue','title','bpm'].map(k=>before[k]),['storyId','issue','title','bpm'].map(k=>after[k])))fail('Story identity/title/tempo changed');
 if(!eq(before.panels.map(p=>p.panelId),after.panels.map(p=>p.panelId)))fail('Panel inventory/order changed');
 if(changes?.length!==2||!eq(changes.map(c=>c.panelId),captionIds)||changes.some(c=>c.balloonOrdinal!==2||c.mattApproved!==false||c.speechApproved!==false))fail('Exact two declared unapproved intro changes required');
 const declarations=new Map(changes.map(c=>[c.panelId+'/'+c.balloonOrdinal,c]));
 const adjusted=structuredClone(before),seen=new Set();
 for(let i=0;i<before.panels.length;i++){
  const b=before.panels[i],a=after.panels[i];if(b.words.length!==a.words.length)fail('Balloon inventory changed');
  for(let j=0;j<b.words.length;j++){
   const key=b.panelId+'/'+(j+1),declared=declarations.get(key);
   if(!eq(b.words[j],a.words[j])){
    if(!declared||declared.oldText!==b.words[j].text||declared.newText!==a.words[j].text||declared.oldTextSha256!==hash(b.words[j].text)||declared.newTextSha256!==hash(a.words[j].text)||!eq({...b.words[j],text:a.words[j].text},a.words[j]))fail('Extra/stale word/speaker/kind/speech change: '+key);
    if(a.words[j].text.includes('\ufffd')||a.words[j].text.includes('\u00e2\u20ac')||a.words[j].text.includes('\u00c3'))fail('Invalid Unicode proposal');
    adjusted.panels[i].words[j]=structuredClone(a.words[j]);seen.add(key);
   }else if(declared)fail('Unused declared word change');
  }
 }
 if(seen.size!==2)fail('Missing declared caption changes');
 return adjusted;
}
export function checkNativeReview(review,afterSha){
 const n=review.nativeReview;
 if(review.historicalSourceAvailable!==true||review.historicalSourceUnavailable!==false||review.humanApproval!==false)fail('Available history and no human approval must be explicit');
 if(n?.status!=='passed'||n.sourceSha256!==afterSha||!nonempty(n.reviewedBy)||!nonempty(n.reviewedAt))fail('Native actual-pixel review pending/stale');
 const expected=panelIds.flatMap(id=>['desktop','phone'].map(v=>id+'/'+v)),keys=n.frames?.map(f=>f.panelId+'/'+f.viewport)??[];
 if(keys.length!==6||new Set(keys).size!==6||expected.some(k=>!keys.includes(k)))fail('Six actual successor desktop/phone PNG bindings required');
 for(const f of n.frames)if(!nonempty(f.path)||!sha(f.sha256)||f.sourceSha256!==afterSha||f.actualPixelsInspected!==true||!nonempty(f.observations)||f.masterSha256!==review.selectedMaster?.sha256)fail('Native evidence lacks exact source/master/actual inspection');
 if(review.visualSuccessors?.length!==3||!eq(review.visualSuccessors.map(r=>r.panelId),panelIds))fail('Exact three visual successors required');
 return true;
}
export function prepareKnownRevision(original,before,after,beforeSnapshot,afterSnapshot,review){
 checkNativeReview(review,after.source.sha256);
 const adjusted=checkKnownTextChanges(beforeSnapshot,afterSnapshot,review.allowedTextChanges);
 // The original actual word comparison above proves EXACTLY the two declared differences.
 // Shared geometry/cue rebinding sees only that independently checked adjustment, not a claim of equivalence.
 const audit=prepareRebind(original,before,after,adjusted,afterSnapshot,review.visualSuccessors);
 if(original.opportunities.length!==43||original.coverage.filter(c=>c.state==='authored').length!==34)fail('Expected retained Data quantity changed');
 if(!eq(audit.opportunities.map(o=>[o.id,o.category,o.rationale,o.segmentId]),original.opportunities.map(o=>[o.id,o.category,o.rationale,o.segmentId]))||!eq(audit.coverage.map(c=>[c.opportunityId,c.state,c.reason]),original.coverage.map(c=>[c.opportunityId,c.state,c.reason])))fail('Retained category/rationale/quiet decisions changed');
 if(audit.opportunities.length!==43||audit.coverage.filter(c=>c.state==='authored').length!==34)fail('Quantity inflated');
 audit.currentSourceRevision={mode:'current-source-known-text-revision-review',historicalSourceAvailable:true,historicalSourceUnavailable:false,strictWordEquivalent:false,historicalWordsCompared:true,allowedTextChanges:review.allowedTextChanges,visualSuccessors:review.visualSuccessors,nativeReview:review.nativeReview,originalSemanticSnapshotSha256:hash(JSON.stringify(beforeSnapshot)),currentSemanticSnapshotSha256:hash(JSON.stringify(afterSnapshot)),standing:'Two declared authoring word changes and three inspected visual successors; original non-speech inventory preserved. Speech/human approval not inferred.',humanApproval:false};
 return audit;
}
export async function reviewKnownRevision({root,auditPath,expectedAuditSha256,beforeSourcePath,afterSourcePath,reviewPath}){
 root=resolve(root);const bytes=await fs.readFile(resolve(auditPath));if(hash(bytes)!==expectedAuditSha256)fail('Original immutable audit hash changed');
 const original=JSON.parse(bytes),before=await loadSnapshot(root,beforeSourcePath),after=await loadSnapshot(root,afterSourcePath);
 if(before.context.source.sha256!==original.storySource.sha256)fail('Actual retained before source differs');
 const reviewBytes=await fs.readFile(resolve(reviewPath)),review=JSON.parse(reviewBytes);
 if(review.schemaVersion!==1||review.mode!=='current-source-known-text-revision-review'||review.originalAuditSha256!==expectedAuditSha256||review.storyBeforeSha256!==before.context.source.sha256||review.storyAfterSha256!==after.context.source.sha256||review.currentLibrarySha256!==after.context.library.sha256||review.currentSemanticSnapshotSha256!==hash(JSON.stringify(after.snapshot)))fail('Stale known-revision source/library/semantic guards');
 // Verify immutable peer proposal source, exact allowed old/new strings and unapproved status.
 const proposalBytes=await checkFile(root,review.allowedTextChangeSource.path,review.allowedTextChangeSource.sha256),proposal=JSON.parse(proposalBytes);
 const declared=proposal.operations;
 if(!Array.isArray(declared)||declared.length!==2||!eq(declared.map(d=>d.suggestionId),['D21','D24']))fail('Wrong immutable word proposal authority');
 const expected=declared.map(d=>({panelId:d.panelImageId,balloonOrdinal:d.balloonOrdinal,oldText:d.beforeValue,newText:d.value,oldTextSha256:d.originalTextSha256,newTextSha256:d.proposedTextSha256,suggestionId:d.suggestionId,mattApproved:false,speechApproved:false}));
 if(!eq(review.allowedTextChanges,expected)||declared.some(d=>d.mattApproved!==false||d.speechApproved!==false))fail('Allowed words differ from immutable unapproved proposal');
 const approvals=JSON.parse(await checkFile(root,review.speechApprovalSource.path,review.speechApprovalSource.sha256));
 if(approvals.textReviews?.length!==0)fail('This bounded plan requires the unchanged empty human speech approvals');
 checkNativeReview(review,after.context.source.sha256);
 const catalogBytes=await checkFile(root,'wiki/image-library/manifest.json',review.catalogSha256),catalog=JSON.parse(catalogBytes);
 const selected=catalog.records.find(r=>r.id===review.selectedMaster.recordId)?.treatments?.['comic-ink'];
 if(selected?.sha256!==review.selectedMaster.sha256||'wiki/image-library/'+selected.path!==review.selectedMaster.path)fail('Canonical selected master record mismatch');
 await checkFile(root,review.selectedMaster.path,review.selectedMaster.sha256);
 for(const row of review.visualSuccessors)if(row.newVisuals?.length!==1||row.newVisuals[0].path!==review.selectedMaster.path||row.newVisuals[0].sha256!==review.selectedMaster.sha256)fail('Successor is not selected canonical master');
 for(const f of review.nativeReview.frames){const b=await checkFile(root,f.path,f.sha256);if(b.length<24||!b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))fail('Native evidence is not actual PNG bytes');}
 const old=structuredClone(original);old.storySource=before.context.source;old.librarySource=before.context.library;await validateFiles(old,before.context,root);validateAudioOpportunities(old,before.context);
 const audit=prepareKnownRevision(original,before.context,after.context,before.snapshot,after.snapshot,review);
 await validateFiles(audit,after.context,root);const result=validateAudioOpportunities(audit,after.context);
 audit.currentSourceRevision.originalAudit={path:auditPath,sha256:expectedAuditSha256};audit.currentSourceRevision.originalSource=original.storySource;audit.currentSourceRevision.currentSource=after.context.source;audit.currentSourceRevision.originalLibrary=original.librarySource;audit.currentSourceRevision.currentLibrary=after.context.library;audit.currentSourceRevision.review={path:reviewPath,sha256:hash(reviewBytes)};audit.currentSourceRevision.result=result;
 return audit;
}
export async function writeKnownRevision(options){
 const output=contained(options.root,options.outputPath);if(!options.outputPath.startsWith('wiki/comics-library/records/'))fail('New canonical record only');
 const audit=await reviewKnownRevision(options);
 await checkFile(options.root,audit.storySource.path,audit.storySource.sha256);await checkFile(options.root,audit.librarySource.path,audit.librarySource.sha256);
 if(hash(await fs.readFile(resolve(options.auditPath)))!==options.expectedAuditSha256||hash(await fs.readFile(resolve(options.reviewPath)))!==audit.currentSourceRevision.review.sha256)fail('Review/original changed during preflight');
 const review=JSON.parse(await fs.readFile(resolve(options.reviewPath),'utf8'));
 await checkFile(options.root,'wiki/image-library/manifest.json',review.catalogSha256);
 await checkFile(options.root,review.allowedTextChangeSource.path,review.allowedTextChangeSource.sha256);
 await checkFile(options.root,review.speechApprovalSource.path,review.speechApprovalSource.sha256);
 for(const f of review.nativeReview.frames)await checkFile(options.root,f.path,f.sha256);
 await fs.mkdir(dirname(output),{recursive:true});await fs.writeFile(output,JSON.stringify(audit,null,2)+'\n',{encoding:'utf8',flag:'wx'});
 return {path:options.outputPath,sha256:hash(await fs.readFile(output)),result:audit.currentSourceRevision.result,strictWordEquivalent:false,humanApproval:false};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),get=k=>args[args.indexOf('--'+k)+1];for(const k of ['root','audit','audit-sha256','before-source','after-source','review','out'])if(!args.includes('--'+k))fail('Usage: review_known_text_revision_audio.mjs --root <repo> --audit <original> --audit-sha256 <sha> --before-source <retained.ts> --after-source <current.ts> --review <completed exact source/native dossier> --out wiki/comics-library/records/<new>.json');
 console.log(JSON.stringify(await writeKnownRevision({root:get('root'),auditPath:get('audit'),expectedAuditSha256:get('audit-sha256'),beforeSourcePath:get('before-source'),afterSourcePath:get('after-source'),reviewPath:get('review'),outputPath:get('out')}),null,2));
}
