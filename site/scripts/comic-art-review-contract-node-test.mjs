#!/usr/bin/env node
// Synthetic inspection declarations exercise the actual gate, not a claim to inspect any image.
import assert from 'node:assert/strict';import {artReviewErrors,loadReviewStory} from './comic-art-review-contract.mjs';
const args=process.argv.slice(2),i=args.indexOf('--story');if(i<0)throw Error('Use --story <actual-story.ts>');
const story=await loadReviewStory(args[i+1]),scene=story.scenes[0];assert(scene.panels.length>1);
const digital={characterId:'codex',kind:'digital',identityAndColorsPass:true,observations:'Synthetic test declaration only.',digitalProjectionPass:true,projectionTreatment:'subtle-comic-semi-projection'};
const human={characterId:'matt',kind:'human',identityAndColorsPass:true,observations:'Synthetic test declaration only.',solidPass:true,digitalProjectionPass:'not-applicable'};
const masterSha256='a'.repeat(64),storySha256='b'.repeat(64),pageId=story.id+'-'+scene.id;
const review={masterSha256,storySha256,pageId,reviewer:'Synthetic regression fixture (no image inspected)',visualReview:{schemaVersion:1,sceneId:scene.id,reviewedAt:'2026-10-10T00:00:00Z',humanApproval:false,nativeStatus:'pending',wholePageReviewed:true,wholePageObservations:'Synthetic declarations test contract only.',panels:scene.panels.map(p=>({panelId:p.img,reviewed:true,cartoonPass:true,rendering:'comic-ink-flat-print',observations:'Synthetic inspection declaration.',subjectCoverage:'complete-actual-image',subjects:[structuredClone(digital),structuredClone(human)]}))}};
const input={review,masterSha256,storySha256,pageId,story};assert.deepEqual(artReviewErrors(input),[]);
const fixtures=[];function reject(name,mutate){const r=structuredClone(review),request={...input,review:r};mutate(r,request);const errors=artReviewErrors(request);assert(errors.length,name);fixtures.push({name,rejected:true});}
reject('missing current per-box contract',r=>delete r.visualReview);
reject('changed master',r=>r.masterSha256='c'.repeat(64));
reject('changed story',r=>r.storySha256='c'.repeat(64));
reject('missing actual panel',r=>r.visualReview.panels.pop());
reject('unperformed panel inspection',r=>r.visualReview.panels[0].reviewed=false);
reject('photoreal rendering',r=>r.visualReview.panels[0].rendering='photorealistic');
reject('failed cartoon evidence',r=>r.visualReview.panels[0].cartoonPass=false);
reject('no actual observations',r=>r.visualReview.panels[0].observations='');
reject('projection failure',r=>r.visualReview.panels[0].subjects[0].digitalProjectionPass=false);
reject('digital cast incorrectly labeled solid',r=>r.visualReview.panels[0].subjects[0].kind='human');
reject('human cast not solid',r=>r.visualReview.panels[0].subjects[1].solidPass=false);
reject('claim Matt approval from image inspection',r=>r.visualReview.humanApproval=true);
reject('claim native verification before capture',r=>r.visualReview.nativeStatus='passed');
reject('unknown box',r=>r.visualReview.panels[0].panelId='nonexistent');
reject('duplicated box',r=>r.visualReview.panels[1]=structuredClone(r.visualReview.panels[0]));
reject('invalid digest context',(_,q)=>q.masterSha256='invalid');
reject('wrong whole page',r=>r.pageId='another-page');
reject('no whole-page observations',r=>r.visualReview.wholePageObservations='');
reject('unknown subject taxonomy',r=>r.visualReview.panels[0].subjects[0].kind='inferred');
console.log(JSON.stringify({schemaVersion:1,actualModuleExecuted:true,actualStoryShapeBound:true,synthetic:true,fixtures:fixtures.length,checks:fixtures,pixelInspection:false,humanApproval:false,wiredIntoMaintainedHelper:false,prevention:'awaiting-next-output'},null,2));
