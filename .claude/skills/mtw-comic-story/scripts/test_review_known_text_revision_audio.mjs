import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {loadSnapshot} from './rebind_audio_opportunities.mjs';
import {hash} from './audio_opportunities.mjs';
import {checkKnownTextChanges,checkNativeReview,prepareKnownRevision,reviewKnownRevision} from './review_known_text_revision_audio.mjs';
const packet='.codex/worktrees/comics-04-conversion-20261010/known-revision-audio-v1';
const originalPath='.codex/worktrees/comics-04-conversion-20261010/full-reader-v1/wiki/comics-library/records/data-migrations-live-delivery-20261010-v1/audio-opportunities.json';
const sourceBefore='.codex/worktrees/comics-04-conversion-20261010/full-reader-v1/site/src/data/comic-stories/data-migrations.ts';
const sourceAfter='.codex/worktrees/comics-04-conversion-20261010/final-anatomy-pronouns-v1/site/src/data/comic-stories/data-migrations.ts';
const original=JSON.parse(await fs.readFile(originalPath,'utf8')),before=await loadSnapshot(process.cwd(),sourceBefore),after=await loadSnapshot(process.cwd(),sourceAfter),template=JSON.parse(await fs.readFile(packet+'/review-template.json','utf8'));
let passed=0;
checkKnownTextChanges(before.snapshot,after.snapshot,template.allowedTextChanges);passed++;
const good=structuredClone(template);Object.assign(good.nativeReview,{status:'passed',sourceSha256:after.context.source.sha256,reviewedBy:'synthetic native contract fixture only',reviewedAt:'fixture only'});
for(const f of good.nativeReview.frames)Object.assign(f,{path:'synthetic-no-real-PNG.png',sha256:'3'.repeat(64),sourceSha256:after.context.source.sha256,actualPixelsInspected:true,observations:'synthetic metadata fixture only; no pixels inspected'});
checkNativeReview(good,after.context.source.sha256);passed++;
const audit=prepareKnownRevision(original,before.context,after.context,before.snapshot,after.snapshot,good);
assert.equal(audit.opportunities.length,43);assert.equal(audit.coverage.filter(c=>c.state==='authored').length,34);assert.equal(audit.currentSourceRevision.strictWordEquivalent,false);assert.equal(audit.qualityReview.listening,'pending');assert.equal(audit.currentSourceRevision.humanApproval,false);passed++;
const wordNegatives=[
 [s=>s.panels[0].words[0].text+=' extra',/Extra\/stale/],
 [s=>s.panels.find(p=>p.panelId==='dm-boardroom').words[1].who='Matt',/Extra\/stale/],
 [s=>s.panels.find(p=>p.panelId==='dm-boardroom').words[1].speech={id:'unapproved'},/Extra\/stale/],
 [s=>s.panels.find(p=>p.panelId==='dm-boardroom').words[1].kind='speech',/Extra\/stale/],
 [s=>s.panels.reverse(),/Panel inventory/],
 [s=>s.panels[0].words.push({text:'new'}),/Balloon inventory/],
 [s=>s.title+=' changed',/Story identity/]
];
for(const [edit,re]of wordNegatives){const s=structuredClone(after.snapshot);edit(s);assert.throws(()=>checkKnownTextChanges(before.snapshot,s,good.allowedTextChanges),re);passed++;}
for(const edit of [r=>r.allowedTextChanges.pop(),r=>r.allowedTextChanges[0].mattApproved=true,r=>r.allowedTextChanges[0].speechApproved=true,r=>r.allowedTextChanges[0].oldTextSha256='4'.repeat(64)]){
 const r=structuredClone(good);edit(r);assert.throws(()=>checkKnownTextChanges(before.snapshot,after.snapshot,r.allowedTextChanges));passed++;
}
for(const edit of [r=>r.historicalSourceAvailable=false,r=>r.historicalSourceUnavailable=true,r=>r.humanApproval=true,r=>r.nativeReview.status='pending',r=>r.nativeReview.frames.pop(),r=>r.nativeReview.frames[0].sourceSha256='4'.repeat(64),r=>r.nativeReview.frames[0].masterSha256='4'.repeat(64),r=>r.nativeReview.frames[0].actualPixelsInspected=false,r=>r.nativeReview.frames[1]=r.nativeReview.frames[0],r=>r.visualSuccessors.push(r.visualSuccessors[0])]){
 const r=structuredClone(good);edit(r);assert.throws(()=>checkNativeReview(r,after.context.source.sha256));passed++;
}
const badMedia=structuredClone(after.snapshot);badMedia.panels[0].media.art='/unreviewed';assert.throws(()=>prepareKnownRevision(original,before.context,after.context,before.snapshot,badMedia,good),/exact inspected successor/);passed++;
const staleVisual=structuredClone(good);staleVisual.visualSuccessors[0].retainedOpportunityIds.push('invented');assert.throws(()=>prepareKnownRevision(original,before.context,after.context,before.snapshot,after.snapshot,staleVisual),/exact inspected opportunity/);passed++;
await assert.rejects(reviewKnownRevision({root:process.cwd(),auditPath:originalPath,expectedAuditSha256:hash(await fs.readFile(originalPath)),beforeSourcePath:sourceBefore,afterSourcePath:sourceAfter,reviewPath:packet+'/review-template.json'}),/Native actual-pixel review pending\/stale/);passed++;
console.log(JSON.stringify({passed,standing:'Actual immutable Data source/audit invariants plus synthetic native-metadata escape fixtures; no actual new native frames, hearing or human approval.'},null,2));
