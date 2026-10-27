#!/usr/bin/env node
// Native Node clean-fixture checks. No provider, credentials, media, catalog or repo source writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const args=process.argv.slice(2),opt=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const repo=path.resolve(opt('--repo',fileURLToPath(new URL('../../',import.meta.url))));
const fixtureHome=path.resolve(opt('--out',path.join(repo,'.codex/worktrees/comic-speech-dependency-regression')));
assert(path.relative(repo,fixtureHome).replace(/\\/g,'/').startsWith('.codex/worktrees/'),'Fixture output must be under ignored task worktrees');
fs.mkdirSync(fixtureHome,{recursive:true});
const fixture=fs.mkdtempSync(path.join(fixtureHome,'clean-'));
const runtimePath='scripts/comics/voice-casting.mjs',gatePath='site/scripts/comic-speech-approval.mjs';
const put=(rel,value)=>{const dest=path.join(fixture,rel);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value));};
const copy=rel=>put(rel,fs.readFileSync(path.join(repo,rel)));
const hash=value=>createHash('sha256').update(value).digest('hex');
const checks=[];const check=async(name,work)=>{await work();checks.push(name);};
const cli=input=>spawnSync(process.execPath,[path.join(fixture,gatePath)],{input:JSON.stringify(input),encoding:'utf8'});
copy(gatePath);
await check('clean checkout fails without declared runtime instead of falling back to legacy/global authority',()=>{
 const result=cli({action:'resolve',root:fixture,characterId:'fixture'});
 assert.notEqual(result.status,0);assert.match(result.stderr,/ERR_MODULE_NOT_FOUND/);
 assert.equal(fs.existsSync(path.join(fixture,'wiki/comics-library/casting.js')),false);
});
copy(runtimePath);
// A poisoned former global must never affect either native or in-process decisions.
globalThis.MTW_COMIC_CASTING={chosen:()=>{throw Error('Legacy global used');},approval:()=>true,validate:()=>null};
const c=await import(pathToFileURL(path.join(fixture,runtimePath)).href);
const gate=await import(pathToFileURL(path.join(fixture,gatePath)).href);
const provider='Fish Audio',voiceId='current-fixture',characterId='fixture';
const choice={provider,voiceId,status:'approved',selectedBy:'Matt Stark',selectedAt:'2026-10-11T00:00:00Z'};
const profile={characterId,provider,voiceId,voiceGender:'male',casting:{selectedVoice:choice,history:[]},clips:[]};
const catalog=[{provider,voiceId,labels:{gender:'male'}}],characters=[{id:characterId,gender:'male'}];
const state=(p=profile,v=catalog)=>{put('wiki/comics-library/voices.json',{profiles:[p]});put('wiki/comics-library/provider-voices.json',{voices:v});put('wiki/comics-library/characters.json',{characters});};
state();
const text='Exact words. — Don’t guess.',sourcePath='site/src/data/comic-stories/home.ts',source='fixture authored source';
put(sourcePath,source);
const review={id:'fixture-b1',characterId,provider,voiceId,textSha256:hash(text),storySource:{path:sourcePath,sha256:hash(source)},status:'approved',reviewedBy:'Matt Stark',reviewedAt:'2026-10-11T00:00:00Z'};
const reviews=(value=review)=>put('wiki/comics-library/speech-approvals.json',{schemaVersion:1,textReviews:[value]});
const input={root:fixture,approvalId:review.id,characterId,provider,voiceId,text};
const held={...profile,casting:{...profile.casting,selectedVoice:{...choice,productionHold:true,useScope:'preview-review'}}};
await check('chosen requires exact human choice metadata',()=>{
 for(const patch of [{status:'pending'},{selectedBy:'agent'},{selectedAt:''},{provider:''},{voiceId:''}])assert.equal(c.chosen({...profile,casting:{selectedVoice:{...choice,...patch}}}),null);
 assert.equal(c.chosen(undefined),null);assert.equal(c.chosen(null),null);
});
await check('chosen retains raw held identity while selected blocks production',()=>{
 assert.equal(c.chosen(held),held.casting.selectedVoice);assert.equal(c.selected(held),null);assert.equal(c.choiceState(held),'held');assert.equal(c.selected(profile),choice);
 assert.deepEqual([...c.reserved([held])],[[provider+'/'+voiceId,characterId]]);
});
await check('validate preserves held comparison exception and gender/catalog/profile/uniqueness guards',()=>{
 assert.equal(c.validate([held],[{...catalog[0],comparisonOnly:true}],characters).size,1);
 assert.throws(()=>c.validate([profile],[{...catalog[0],comparisonOnly:true}],characters),/Comparison-only/);
 assert.throws(()=>c.validate([profile],[],characters),/missing/);
 assert.throws(()=>c.validate([{...profile,voiceId:'old'}],catalog,characters),/binding differs/);
 assert.throws(()=>c.validate([{...profile,voiceGender:'female'}],catalog,characters),/gender/);
 assert.throws(()=>c.validate([profile,{...profile,characterId:'other'}],catalog,characters),/two characters/);
 assert.equal(c.validate([{...profile,voiceGender:'female',casting:{selectedVoice:{...choice,genderOverride:true}}}],catalog,characters).size,1);
});
await check('options and clips follow held chosen identity without altering retained history',()=>{
 const p={...held,clips:[{id:'old',provider,voiceId:'old'},{id:'current',provider,voiceId}]};
 assert.deepEqual(c.options(p,catalog,[p],characters[0]),catalog);assert.deepEqual(c.clips(p).map(v=>v.id),['current']);assert.equal(p.clips.length,2);
 const unchosen={...profile,casting:{history:[{provider,voiceId:'rejected',status:'rejected'}]}};
 assert.deepEqual(c.options(unchosen,[...catalog,{provider,voiceId:'rejected',labels:{gender:'male'}}],[],characters[0]),catalog);
});
await check('timeline and vocal effect exact-word gate remain unchanged',()=>{
 const p={...held,casting:{...held.casting,history:[{provider,voiceId:'old',selectedAt:'2026-10-09',selectedBy:'Matt Stark',rejectedAt:'2026-10-10',status:'rejected'}]}};
 assert.deepEqual(c.timeline(p).map(e=>e.kind),['chosen','rejected','held']);assert.deepEqual(c.EFFECT_EDITABLE,['usage','notes']);
 for(const d of [{},{generationApproved:true},{exactWordsReviewRequired:false}])assert.equal(c.effectGate(d).canGenerate,false);
 assert.equal(c.effectGate({generationApproved:true,exactWordsReviewRequired:false}).canGenerate,true);
});
await check('no review fails closed on clean native dependency closure',async()=>{
 await assert.rejects(gate.assertSpeechApproved(input),/human speech review/);
 put('wiki/comics-library/speech-approvals.json',{schemaVersion:1,textReviews:[]});
 await assert.rejects(gate.assertSpeechApproved(input),/exact human review absent/);
});
reviews();
await check('current exact human approval succeeds with poisoned former global and no legacy wiki code',async()=>{
 const result=await gate.assertSpeechApproved(input);assert.equal(result.review.textSha256,hash(text));assert.equal(result.sourceSha256,hash(source));
 assert.equal(fs.existsSync(path.join(fixture,'wiki/comics-library/casting.js')),false);
});
await check('native Node CLI succeeds with only its two declared runtime files',()=>{
 const resolved=cli({action:'resolve',root:fixture,characterId});assert.equal(resolved.status,0,resolved.stderr);assert.equal(JSON.parse(resolved.stdout).voiceId,voiceId);
 const result=cli(input);assert.equal(result.status,0,result.stderr);assert.equal(JSON.parse(result.stdout).sourceSha256,hash(source));
});
await check('changed words and changed source invalidate human approval',async()=>{
 await assert.rejects(gate.assertSpeechApproved({...input,text:text+' changed'}),/changed/);
 put(sourcePath,source+' changed');await assert.rejects(gate.assertSpeechApproved(input),/changed/);put(sourcePath,source);
});
await check('stale supplied voice/provider never substitutes current Studio choice',async()=>{
 await assert.rejects(gate.resolveSpeechVoice({...input,voiceId:'old'}),/matching approved voice/);
 await assert.rejects(gate.resolveSpeechVoice({...input,provider:'ElevenLabs'}),/matching approved voice/);
 const next={...profile,voiceId:'new',casting:{selectedVoice:{...choice,voiceId:'new'}}};state(next,[...catalog,{provider,voiceId:'new',labels:{gender:'male'}}]);
 assert.equal((await gate.resolveSpeechVoice({root:fixture,characterId})).voiceId,'new');
 await assert.rejects(gate.assertSpeechApproved(input),/matching approved voice/);
 await assert.rejects(gate.assertSpeechApproved({...input,voiceId:'new'}),/changed/);state();
});
await check('held current choice resolves for preview only and cannot synthesize despite exact review',async()=>{
 state(held);assert.equal((await gate.resolveSpeechVoice({...input,allowHeld:true})).voiceId,voiceId);
 await assert.rejects(gate.resolveSpeechVoice(input),/production hold/);await assert.rejects(gate.assertSpeechApproved(input),/production hold/);state();
});
await check('empty provider/voice word approvals stay intact but never authorize synthesis',async()=>{
 const words={...review,provider:'',voiceId:''};reviews(words);
 assert.equal(c.approval({...review},words,profile),false);
 await assert.rejects(gate.assertSpeechApproved(input),/changed/);
 const saved=JSON.parse(fs.readFileSync(path.join(fixture,'wiki/comics-library/speech-approvals.json'),'utf8')).textReviews[0];
 assert.equal(saved.provider,'');assert.equal(saved.voiceId,'');
 // Binding is the existing Studio action; this fixture represents its completed result.
 reviews({...saved,provider,voiceId});assert.equal((await gate.assertSpeechApproved(input)).voiceSelection.voiceId,voiceId);
});
await check('nonhuman/rejected approvals and wrong character/source fail closed',async()=>{
 for(const patch of [{reviewedBy:'agent'},{status:'rejected'},{characterId:'other'},{reviewedAt:''},{storySource:{path:sourcePath,sha256:hash('a different source')}}]){
  reviews({...review,...patch});
  await assert.rejects(gate.assertSpeechApproved(input),/changed/);
 }reviews();
});
await check('malformed approval authority and unsafe source path fail closed',async()=>{
 put('wiki/comics-library/speech-approvals.json',{schemaVersion:2,textReviews:[review]});await assert.rejects(gate.assertSpeechApproved(input),/Invalid speech approval authority/);
 reviews({...review,storySource:{path:'../home.ts',sha256:hash(source)}});await assert.rejects(gate.assertSpeechApproved(input),/exact human review absent/);reviews();
});
await check('unchosen character has no fallback; optional offline resolution stays null',async()=>{
 state({...profile,casting:{history:[]}});assert.equal(await gate.resolveSpeechVoice({root:fixture,characterId,required:false}),null);
 await assert.rejects(gate.resolveSpeechVoice({root:fixture,characterId}),/matching approved voice/);state();
});
await check('invalid canonical ownership blocks gate before approval',async()=>{
 state(profile,[]);await assert.rejects(gate.assertSpeechApproved(input),/missing from provider catalog/);state();
});
delete globalThis.MTW_COMIC_CASTING;
console.log(JSON.stringify({checks:checks.length,passed:checks,fixture,legacyWikiCode:false,providerRequests:0,sourceWrites:0},null,2));
