#!/usr/bin/env node
// Browser-free escape checks against the actual validator source; no art-presence claim.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { comicSourceErrors, comicSpeakerErrors } from './comic-view-contract.mjs';
const source = readFileSync(new URL('./comic-story-check.mjs', import.meta.url), 'utf8');
const start = source.indexOf('export function checkComicIntroductions(story)');
const end = source.indexOf('// Astro resolves extensionless TypeScript imports', start);
assert(start >= 0 && end > start, 'intro validator extraction markers');
const check = new Function(source.slice(start, end).replace(/^export /, '') + '\nreturn checkComicIntroductions;')();
const place = { at: 0, kind: 'place', state: 'narration', who: 'narrator', text: 'Toronto. Friday, 2:07 a.m.' };
const intro = { at: 2, kind: 'caption', state: 'narration', who: 'narrator', characterIntro: true, text: 'The rogue agent. Sittler’s contract AI. It sends without asking.' };
const speech = { at: 8, kind: 'speech', state: 'menace', who: 'rogue', text: 'Sending to all customers.' };
const story = (balloons = [place, intro, speech]) => ({ scenes: [{ id: 'job', title: 'The send.', panels: [{ balloons }] }] });
let count = 0;
const pass = (name, value) => { assert.deepEqual(check(value), [], name); count++; };
const fail = (name, value, message) => { assert(check(value).some((e) => message.test(e)), name); count++; };
pass('embodied red-agent introduction', story());
for (const text of ['Rogue Agent. An AI that sends.', 'THE ROGUE AGENT. AN AI THAT SENDS.', 'Rogue\nAgent. An AI that sends.'])
  pass('case/optional article/linebreak identity ' + text, story([place, { ...intro, text }, speech]));
fail('missing rogue introduction', story([place, speech]), /speaks before/);
fail('unmarked caption cannot introduce rogue', story([place, { ...intro, characterIntro: undefined }, speech]), /speaks before/);
fail('place prefix cannot introduce rogue', story([place, { ...intro, kind: 'place', characterIntro: undefined }, speech]), /speaks before/);
fail('late introduction cannot fix first speech', story([place, speech, { ...intro, at: 10 }]), /speaks before/);
fail('invalid narrator role', story([place, { ...intro, who: 'rogue' }, speech]), /speaks before/);
fail('invalid narration state', story([place, { ...intro, state: 'calm' }, speech]), /speaks before/);
fail('wrong identity cannot introduce rogue', story([place, { ...intro, text: 'Claude. An AI.' }, speech]), /speaks before/);
fail('arbitrary marker cannot identify anyone', story([place, { ...intro, text: 'An AI that sends.' }, speech]), /characterIntro belongs/);
fail('scene setup cannot double as introduction', story([place, { ...intro, sceneSetup: true }, speech]), /characterIntro belongs/);
fail('speech marker cannot introduce rogue', story([place, { ...intro, kind: 'speech' }, speech]), /characterIntro belongs/);
fail('false marker rejected', story([place, { ...intro, characterIntro: false }, speech]), /characterIntro belongs/);
fail('word prefix cannot identify Matt', story([place, { ...intro, text: 'Mattie. A helper.' }, { ...speech, who: 'matt' }]), /speaks before/);
pass('Matt exact approved words', story([place, { ...intro, text: 'MATT. HE HELPS COMPANIES BUILD THESE SYSTEMS.' }, { ...speech, who: 'matt' }]));
for (const [who,text] of [['dana','12:40. Dana Dryden.'],['matt','2:10 a.m. Matt.'],['codex','3:15 a.m. Codex.'],['ruth','Friday, 8:05 a.m. Ruth Orr. Contracts, Sittler Business Services.'],['sam','8:10. Sam, Sittler installation manager.']])
  pass('combined clock/place identity '+who,story([{...intro,kind:'place',at:0,text},{...speech,who}]));
fail('timestamp does not excuse missing narrator state',story([{...intro,kind:'place',at:0,text:'2:10 a.m. Matt.',state:undefined},{...speech,who:'matt'}]),/characterIntro belongs|speaks before/);
fail('arbitrary preface cannot masquerade as clock identity',story([place,{...intro,text:'Eventually, Matt.'},{...speech,who:'matt'}]),/characterIntro belongs|speaks before/);
const rogueActionIntro={...intro,text:'1:54 a.m. Rogue Agent. Sending unattended.'};
const ownedStory=balloons=>({scenes:[{id:'job',title:'The unchecked send.',panels:[{speakers:{rogue:{mouth:[.7,.5],face:[.6,.3,.2,.3]}},balloons}]}]});
pass('clocked Rogue identity tied to source-owned sending action',ownedStory([place,rogueActionIntro,speech]));
fail('clocked Rogue roll call lacks action',ownedStory([place,{...rogueActionIntro,text:'1:54 a.m. Rogue Agent.'},speech]),/narration.*names/);
fail('clocked Rogue action lacks actual owned source anchor',story([place,rogueActionIntro,speech]),/narration.*names/);
fail('clocked Rogue cannot borrow another cast action',ownedStory([place,rogueActionIntro,{...speech,who:'codex'}]),/narration.*names/);
fail('human place caption cannot introduce Matt', story([place, { ...intro, kind: 'place', characterIntro: undefined, text: 'Matt. His office.' }, { ...speech, who: 'matt' }]), /speaks before/);
fail('rogue name still forbidden in scene title', { ...story(), scenes: [{ ...story().scenes[0], title: 'THE ROGUE AGENT.' }] }, /title.*names/);
fail('rogue name still forbidden in place caption', story([{ ...place, text: 'Rogue Agent. Friday.' }, intro, speech]), /narration.*names/);
fail('rogue name still forbidden in ordinary narration', story([place, intro, { ...place, at: 4, kind: 'caption', text: 'The Rogue Agent sends.' }, speech]), /narration.*names/);
fail('intro exception cannot hide another villain', story([place, { ...intro, text: 'Rogue Agent. It follows Slop.' }, speech]), /names Slop/);
fail('NEXT heading cannot name rogue', { ...story(), next: { heading: 'Rogue Agent.', choices: [] } }, /NEXT heading names/);
fail('NEXT choice cannot name rogue', { ...story(), next: { heading: 'The next send.', choices: [{ label: 'Rogue Agent.' }] } }, /choice.*names/);
pass('silent George portrait retains explicit identity', story([place, { ...intro, text: 'George Armstrong built it. He retired in 2019.' }]));
const withChoice = (label, href) => ({ ...story(), next: { heading: 'The next send.', choices: [{ label, href }] } });
pass('retained Demo shelf collection navigation', withChoice('Back to the shelf.', '/comics/'));
pass('plain shelf collection navigation', withChoice('Back to shelf.', '/comics/'));
for (const href of ['/comics/home/', '/comics/?q=shelf', 'https://example.com/comics/', '/comics'])
  fail('shelf word cannot bypass story choice for ' + href, withChoice('Back to the shelf.', href), /choice.*names Shelf/);
fail('Shelf story trouble remains forbidden even when linked to collection', withChoice('Shelf hides the work.', '/comics/'), /choice.*names Shelf/);
fail('another villain cannot borrow navigation exception', withChoice('Back to Slop.', '/comics/'), /choice.*names Slop/);
fail('villain-name heading still forbidden on collection choice', { ...withChoice('Back to shelf.', '/comics/'), next: { heading: 'Shelf.', choices: [{label:'Back to shelf.',href:'/comics/'}] } }, /NEXT heading names Shelf/);
// The retained-knowledge narrator is introduced before an authored connection or its own speech.
const brainIntro = { ...intro, text: 'Second Brain. The firm’s retained knowledge.' };
const brainSpeech = { ...speech, who: 'second-brain', text: 'This decision is checked.' };
pass('Second Brain explicit identity', story([place, brainIntro, brainSpeech]));
pass('optional article Second Brain identity', story([place, { ...brainIntro, text: 'The Second Brain. Retained knowledge.' }, brainSpeech]));
pass('linebreak/case Second Brain identity', story([place, { ...brainIntro, text: 'SECOND\nBRAIN. RETAINED KNOWLEDGE.' }, brainSpeech]));
fail('Second Brain missing introduction', story([place, brainSpeech]), /speaks before/);
fail('Second Brain marker cannot use wrong speaker', story([place, { ...brainIntro, who: 'second-brain' }, brainSpeech]), /characterIntro belongs|speaks before/);
fail('Second Brain place label is not identity', story([place, { ...brainIntro, kind: 'place', characterIntro: undefined }, brainSpeech]), /speaks before/);
fail('Second Brain cannot use human introduction', story([place, { ...brainIntro, text: 'Matt. He helps companies build these systems.' }, brainSpeech]), /speaks before/);
fail('Second Brain arbitrary prefix rejected', story([place, { ...brainIntro, text: 'Second Brainstorm. A helper.' }, brainSpeech]), /characterIntro belongs|speaks before/);
fail('Second Brain late introduction rejected', story([place, brainSpeech, { ...brainIntro, at: 10 }]), /speaks before/);
const setupStart=source.indexOf('export function checkComicSceneSetup(story)'),setupEnd=source.indexOf('// Character introductions',setupStart);
const setup=new Function(source.slice(setupStart,setupEnd).replace(/^export /,'')+'\nreturn checkComicSceneSetup;')();
assert.deepEqual(setup(story()),[],'narrated opening place needs no duplicate setup');count++;
assert(setup(story([{...place,state:undefined}])).length,'opening still requires narration');count++;
assert(setup(story([place,place])).some(e=>/duplicate opening place/.test(e)),'duplicate opening place rejected');count++;
assert(setup(story([{...place,text:Array(61).fill('word').join(' ')}])).some(e=>/budget/.test(e)),'opening word budget preserved');count++;
assert(setup(story([{...intro,sceneSetup:true,x:0,y:.1,w:.5}])).some(e=>/bottom-right/.test(e)),'explicit old setup keeps authored geometry rule');count++;
const tailStart=source.indexOf('export function comicBalloonHasSourceTail('),tailEnd=source.indexOf('// Opening business context',tailStart);
const sourceTail=new Function('comicSourceErrors','comicSpeakerErrors',source.slice(tailStart,tailEnd).replace(/^export /,'')+'\nreturn comicBalloonHasSourceTail;')(comicSourceErrors,comicSpeakerErrors);
const anchor={mouth:[.5,.5],face:[.4,.3,.2,.3]},authority={panelId:'p',path:'wiki/image-library/assets/scenes/test/source.png',sha256:'a'.repeat(64),recordId:'source',treatment:'comic-ink'};
const staticArt={src:'/comic/test/source.png',ar:[0,0,1,1],canonicalSource:authority,speakers:{matt:anchor}};
const sourcePanel={img:'p',staticArt,views:[{...staticArt,id:'a',at:0},{...staticArt,id:'b',at:2}]};
assert(sourceTail(sourcePanel,{who:'matt'}),'actual source metadata supplies tail without legacy coordinates');count++;
for(const mutate of [p=>delete p.staticArt,p=>delete p.views[1].speakers.matt,p=>delete p.views[0].canonicalSource,p=>p.views[0].speakers.matt.mouth=[NaN,.5],p=>p.staticArt.phone={src:'/comic/test/another.png',ar:[0,0,1,1]}]){
 const p=structuredClone(sourcePanel);mutate(p);assert(!sourceTail(p,{who:'matt'}),'missing source anchors/fallback/provenance not masked');count++;
}
const fallbackPanel=structuredClone(sourcePanel);delete fallbackPanel.staticArt.speakers;
fallbackPanel.views=fallbackPanel.views.map(v=>({...v,layers:[{id:'base',role:'background',src:v.src,canonicalSource:authority},{id:'actor',role:'agents',src:'/comic/test/actor.png',canonicalSource:{...authority,path:'wiki/image-library/assets/scenes/test/actor.png',recordId:'actor'}}]}));
fallbackPanel.fallbackView={desktop:'a',phone:'a'};
assert(sourceTail(fallbackPanel,{who:'matt'}),'complete anchored first group is the real fallback instead of its unvoiced cleanplate');count++;
for(const mutate of [p=>p.fallbackView.phone='foreign',p=>p.fallbackView.phone='b',p=>p.views[0].media='desktop',p=>delete p.views[0].speakers.matt,p=>delete p.views[1].speakers.matt,p=>delete p.views[0].layers[1].canonicalSource,p=>p.views[0].layers[1].canonicalSource.panelId='foreign',p=>delete p.views[0].layers,p=>p.fallbackView.extra=true]){
 const p=structuredClone(fallbackPanel);mutate(p);assert(!sourceTail(p,{who:'matt'}),'invalid complete fallback reference/anchor/plane ownership must not hide tail warning');count++;
}
console.log(`${count} intro escape fixtures passed; artwork identity and desktop/phone review remain separate.`);
