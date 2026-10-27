#!/usr/bin/env node
// Enforces hash-bound declarations of actual whole-page and every-box image inspection, never examines pixels.
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL,fileURLToPath} from 'node:url';import {registerHooks} from 'node:module';
const digital=new Set(['claude','codex','rogue','grok','opencode','copilot']),humans=new Set(['matt','marco','dana','ruth','sam','joan','potvin','george']);
const text=x=>typeof x==='string'&&x.trim().length>0;
export function artReviewErrors({review,masterSha256,storySha256,pageId,story}){
 const errors=[];const fail=m=>errors.push(m),v=review?.visualReview;
 if(!/^[a-f0-9]{64}$/.test(masterSha256||'')||!/^[a-f0-9]{64}$/.test(storySha256||'')||!text(pageId))fail('Actual SHA256 master/story and page id required');
 if(review?.masterSha256!==masterSha256||review?.storySha256!==storySha256||review?.pageId!==pageId)fail('Visual review must bind exact master, story and page');
 if(!v||v.schemaVersion!==1)return errors.concat('Missing version1 per-box visualReview; older review remains historical pending current contract');
 if(!text(review.reviewer)||!text(v.reviewedAt)||!Number.isFinite(Date.parse(v.reviewedAt)))fail('Actual reviewer and inspection time required');
 if(v.humanApproval!==false||v.nativeStatus!=='pending')fail('Master inspection cannot assert human/native approval');
 if(v.wholePageReviewed!==true||!text(v.wholePageObservations))fail('Whole-page inspection and observations required');
 const scene=story?.scenes?.find(s=>s.id===v.sceneId);
 if(!scene)return errors.concat('Review scene not found in actual story');
 const stem=String(scene.art||'').split('/').pop();if(pageId!==`${story.id}-${scene.id}`&&stem!==pageId&&!stem.startsWith(pageId+'-'))fail('Page id must match actual reviewed scene artwork');
 if(!Array.isArray(v.panels))return errors.concat('Exact per-box review array required');
 const expected=scene.panels.map(p=>p.img),seen=new Set();if(v.panels.length!==expected.length)fail('Per-box review must cover every actual scene panel');
 for(const p of v.panels){if(!p||!expected.includes(p.panelId)||seen.has(p.panelId)){fail('Unknown or duplicate reviewed panel');continue;}seen.add(p.panelId);
  if(p.reviewed!==true||p.cartoonPass!==true||p.rendering!=='comic-ink-flat-print'||!text(p.observations))fail(`${p.panelId}: actual cartoon inspection/observations required; realistic/painterly/3D fails`);
  if(p.subjectCoverage!=='complete-actual-image'||!Array.isArray(p.subjects))fail(`${p.panelId}: list actual observed subjects and complete-image coverage`);
  const subjects=new Set();for(const s of p.subjects||[]){if(!s||!text(s.characterId)||subjects.has(s.characterId)||!['digital','human','prop'].includes(s.kind)){fail(`${p.panelId}: unique explicit subject id/kind required`);continue;}subjects.add(s.characterId);
   if(digital.has(s.characterId)&&s.kind!=='digital')fail(`${p.panelId}: known digital agent mislabeled`);if(humans.has(s.characterId)&&s.kind!=='human')fail(`${p.panelId}: known human mislabeled`);
   if(!text(s.observations)||s.identityAndColorsPass!==true)fail(`${p.panelId}/${s.characterId}: actual identity/colour observations required`);
   if(s.kind==='digital'&&(s.digitalProjectionPass!==true||s.projectionTreatment!=='subtle-comic-semi-projection'))fail(`${p.panelId}/${s.characterId}: retained digital identity needs subtle comic projection`);
   if(s.kind!=='digital'&&(s.solidPass!==true||s.digitalProjectionPass!=='not-applicable'))fail(`${p.panelId}/${s.characterId}: humans/props remain solid cartoons`);
  }
 }
 for(const id of expected)if(!seen.has(id))fail('Missing actual panel review: '+id);
 return errors;
}
export async function loadReviewStory(file){registerHooks({resolve(s,c,n){try{return n(s,c)}catch(e){if(/^\.\.?\//.test(s)&&!/\.[a-z]+$/i.test(s))return n(s+'.ts',c);throw e;}}});const mod=await import(pathToFileURL(path.resolve(file)).href);const story=Object.values(mod).find(s=>s&&typeof s==='object'&&Array.isArray(s.scenes));if(!story)throw Error('Actual ComicStory export missing');return story;}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const request=JSON.parse(fs.readFileSync(0,'utf8'));try{const story=await loadReviewStory(request.storySource);const errors=artReviewErrors({...request,story});console.log(JSON.stringify({errors,humanApproval:false,pixelInspectionPerformedByValidator:false,nativeReview:'pending',prevention:'awaiting-next-output'}));process.exitCode=errors.length?1:0;}catch{console.log(JSON.stringify({errors:['Cannot bind actual current story or per-box review'],humanApproval:false}));process.exitCode=1;}}
