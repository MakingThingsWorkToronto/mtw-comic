// Current Home (14 Oct rebuild) story invariants. Source checks never confer native review or approval.
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {comicSpeakerErrors,comicSourceErrors,comicViewErrors} from './comic-view-contract.mjs';
registerHooks({resolve(s,c,next){try{return next(s,c);}catch(e){if(/^\.\.?\//.test(s)&&!s.endsWith('.ts'))return next(s+'.ts',c);throw e;}}});
const {homeComic}=await import('../src/data/comic-stories/home.ts');
const panels=homeComic.scenes.flatMap(s=>s.panels),byId=new Map(panels.map(p=>[p.img,p])),balloons=panels.flatMap(p=>p.balloons);
const txt=p=>p.balloons.map(b=>b.text.replace(/\s+/g,' ')).join(' ');
const words=id=>{assert(byId.has(id),'Missing causal box '+id);return txt(byId.get(id));};
const index=id=>{assert(byId.has(id),'Missing causal box '+id);return panels.findIndex(p=>p.img===id);};
const ordered=(...ids)=>ids.slice(1).forEach((id,i)=>assert(index(ids[i])<index(id),ids[i]+' must precede '+id));
const test=(name,run)=>{run();console.log('PASS '+name);};
test('14 pages, 86 distinct boxes, 128 balloons; each phone page tiles its boxes without holes or overlaps',()=>{
 assert.equal(homeComic.scenes.length,14);assert.equal(panels.length,86);assert.equal(balloons.length,128);
 assert.equal(byId.size,panels.length,'Duplicated panel identities');
 for(const s of homeComic.scenes){
  assert(s.panels.length>=5,s.id+' desktop');assert.equal(new Set(s.panels.map(p=>p.alt.replace(/\s+/g,' ').trim())).size,s.panels.length,'Repeated shots '+s.id);
  for(const p of s.panels)assert(p.alt?.trim().length>=30,'Missing action/evidence '+p.img);
  assert(s.phonePages?.length);assert.deepEqual(s.phonePages.flatMap(page=>page.map(p=>p.img)),s.panels.map(p=>p.img));
  for(const page of s.phonePages){
   assert.equal(new Set(page.map(p=>p.img)).size,page.length);
   assert(Math.abs(page.reduce((n,p)=>n+p.r[2]*p.r[3],0)-1)<1e-6,'Hole in authored page '+s.id);
   for(const [i,p] of page.entries()){
    const [x,y,w,h]=p.r;assert([x,y,w,h].every(Number.isFinite)&&x>=0&&y>=0&&w>0&&h>0&&x+w<=1+1e-6&&y+h<=1+1e-6);
    for(const q of page.slice(i+1))assert(Math.min(x+w,q.r[0]+q.r[2])-Math.max(x,q.r[0])<=1e-6||Math.min(y+h,q.r[1]+q.r[3])-Math.max(y,q.r[1])<=1e-6,'Overlapping boxes '+s.id);
   }
  }
 }
});
test('clean words; the night runs Thursday 11:04 p.m. to Friday 9:20 a.m., then Monday',()=>{
 for(const s of homeComic.scenes)for(const value of [s.title,...s.panels.flatMap(p=>[p.alt,...p.balloons.map(b=>b.text)])])assert(!/[�]|â€™|â€œ|â€|Ã[\x80-ÿ]/u.test(value),'Corrupt words '+s.id);
 assert.match(words('home-tower-night'),/Thursday, 15 October, 11:04 p\.m\..*200 desks.*Monday, 9:00 a\.m\./i);
 assert.match(words('home-send'),/two years old.*11:58 p\.m\. Sent\. \$50,000 below cost/i);
 assert.match(words('home-lobby'),/Friday, 8:05 a\.m\./i);assert.match(words('home-marco-sends'),/8:57 a\.m\..*real quote went out/i);
 assert.match(words('home-monday-desks'),/Monday, 19 October.*Two hundred desks\. Done before nine/i);
 ordered('home-send','home-call-alert','home-rogue-screens','home-matt-pauses','home-codex-asks','home-lobby','home-compare-table','home-codex-safety-test','home-marco-sends','home-roof','home-monday-desks');
});
test('owners: Ruth owns the terms, Sam the costs, Marco approves every send; the agent never sends',()=>{
 assert.match(words('home-ruth'),/Ruth Orr\. Contracts, Sittler/i);assert.match(words('home-sam'),/Sam Howe\. Sittler.{0,3}s installation manager/i);
 assert(index('home-sam')<index('home-sam-card'),'Sam must be introduced before his rate card');
 assert.match(words('home-sam-card'),/2024 card.*2026/i);assert.match(words('home-sam-labour'),/Forty hours\. Ten installers/i);
 assert.match(words('home-process-refusal'),/Permission denied/i);assert.match(words('home-codex-safety-test'),/Safety clause missing\. Draft stopped/i);
 assert.match(words('home-matt-names'),/Ruth owns the terms\. Sam owns the costs\. You approve every send/i);
 assert.match(words('home-codex-lists'),/hold the draft for you/i);
 for(const p of panels.slice(index('home-codex-safety-test')+1))assert(!/safety clause (?:is |was |has been )?(?:missing|dropped|lost)/i.test(txt(p)),'Production relapse '+p.img);
});
test('every balloon is voiced; narration is the Second Brain',()=>{
 const silent=panels.flatMap(p=>p.balloons.filter(b=>!b.speech).map(b=>p.img+': '+b.text.replace(/\s+/g,' ')));
 assert.deepEqual(silent,[]);
});
test('mouth anchors lie within named faces; malformed fixtures fail',()=>{
 const speakers={marco:{mouth:[.5,.5],face:[.4,.3,.2,.25]}};
 assert.deepEqual(comicSpeakerErrors(speakers),[]);assert.deepEqual(comicSourceErrors({src:'/comic/test/source.webp',speakers,phone:{speakers}},{}),[]);
 for(const mouth of [[NaN,.5],[Infinity,.5],[-.1,.5],[.5,1.1],[.5]])assert(comicSpeakerErrors({marco:{mouth,face:[.4,.3,.2,.25]}}).length);
 for(const s of homeComic.scenes){assert.deepEqual(comicViewErrors(s,homeComic),[],s.id);for(const p of s.panels)for(const v of [p.staticArt,p.staticArt?.phone,...(p.views||[])].filter(Boolean))for(const [who,a] of Object.entries(v.speakers||{})){const [x,y,w,h]=a.face;assert(a.mouth[0]>=x&&a.mouth[0]<=x+w&&a.mouth[1]>=y&&a.mouth[1]<=y+h,'Mouth outside named face '+p.img+'/'+who);}}
});
console.log(JSON.stringify({status:'PASS',stage:'story/source only; native fit, playback and hearing separate',scenes:homeComic.scenes.length,panels:panels.length,balloons:balloons.length,phonePages:homeComic.scenes.reduce((n,s)=>n+s.phonePages.length,0)}));
