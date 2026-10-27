// Home-only projection. Reuse canonical words, speech references and retained auditions; never synthesize.
import { homeComic } from './home';
import type { ComicStory } from './types';
import inputs from './home-voice-inputs.json' with { type: 'json' };
const { voices, cast } = inputs;
const normalize=(text:string)=>text.replace(/\s+/g,' ').trim().toLowerCase();
type SavedProfiles={profiles:{characterId:string;casting?:{selectedVoice?:{status:string;voiceId:string;provider:string;useScope?:string;productionHold?:boolean;holdReason?:string}};clips:{id:string;provider:string;voiceId:string;text:string;path?:string;canonicalPath?:string;sha256:string}[]}[]};
export function projectHomeVoiceReview(story:ComicStory,voiceInput:SavedProfiles=voices,castInput=cast){
const named=new Set<string>(['second-brain']);
for(const scene of story.scenes){for(const id of scene.villains||[])named.add(id);for(const panel of scene.panels)for(const balloon of panel.balloons){if(!['caption','place','narrator'].includes(balloon.who))named.add(balloon.who);if(balloon.characterIntro){const text=normalize(balloon.text),character=castInput.characters.find(c=>c.aliases.some(alias=>text.startsWith(normalize(alias)+'.')));if(character)named.add(character.id);}}}
const name=(id:string)=>castInput.characters.find(c=>c.id===id)?.name||id;
const homeVoiceLines=story.scenes.flatMap(scene=>scene.panels.flatMap(panel=>panel.balloons.flatMap((balloon,index)=>balloon.speech?[{id:balloon.speech.id,characterId:balloon.speech.characterId,name:name(balloon.speech.characterId),scene:scene.id,panel:panel.img,balloon:index,text:balloon.text,startSeconds:(scene.b+Math.max(panel.at,balloon.at))*60/story.bpm+.3,durationSeconds:balloon.speech.durationSeconds,src:balloon.speech.src,provider:balloon.speech.provider,comparison:false}]:[])));
// Captions are written for the Second Brain even while the exact selected take
// is unavailable. Expose that production gap; a rejected audition cannot fill it.
const narrationChoice=voiceInput.profiles.find(profile=>profile.characterId==='second-brain')?.casting?.selectedVoice;
const homeVoiceNarrationGaps=story.scenes.flatMap(scene=>scene.panels.flatMap(panel=>panel.balloons.flatMap((balloon,index)=>
 balloon.who==='narrator'&&['caption','place'].includes(balloon.kind)&&!balloon.speech?
 [{characterId:'second-brain',name:name('second-brain'),scene:scene.id,panel:panel.img,balloon:index,
   text:balloon.text,kind:balloon.kind,teal:!!(balloon.characterIntro||balloon.sceneSetup),
   provider:narrationChoice?.provider??null,voiceId:narrationChoice?.voiceId??null,
   status:narrationChoice?.productionHold?'Selected voice held — no exact production clip':'Exact production clip missing',
   reason:narrationChoice?.holdReason??'No saved recording matches this exact caption and the selected Second Brain voice.'}]:[])));
const homeVoiceAuditions=voiceInput.profiles.filter(profile=>named.has(profile.characterId)).flatMap(profile=>profile.clips.map(clip=>{
 const choice=profile.casting?.selectedVoice,selected=profile.characterId!=='second-brain'&&choice?.status==='approved'&&choice.voiceId===clip.voiceId&&choice.provider===clip.provider;
 const canonical=('canonicalPath' in clip&&typeof clip.canonicalPath==='string')?clip.canonicalPath:(clip.path?.startsWith('wiki/')?clip.path:'wiki/comics-library/'+clip.path);
 if(!/^wiki\/(comics-library|soundtrack-library)\/assets\/[a-zA-Z0-9/_\-.]+\.(mp3|wav|ogg|m4a)$/.test(canonical)||canonical.includes('..'))throw Error('Unsafe retained Home audition path');
 return {id:profile.characterId+'-'+clip.id,characterId:profile.characterId,name:name(profile.characterId),provider:clip.provider,voiceId:clip.voiceId,text:clip.text,canonicalPath:canonical,sha256:clip.sha256,status:profile.characterId==='second-brain'?'Rejected comparison — replacement pending':selected?'Current voice audition':'Earlier audition — not current casting'};
}));
return {homeVoiceLines,homeVoiceAuditions,homeVoiceNarrationGaps};
}
export const {homeVoiceLines,homeVoiceAuditions,homeVoiceNarrationGaps}=projectHomeVoiceReview(homeComic);
