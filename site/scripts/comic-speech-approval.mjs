import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {fileURLToPath,pathToFileURL} from 'node:url';import * as casting from '../../scripts/comics/voice-casting.mjs';
export async function assertSpeechApproved({root,approvalId,characterId,provider,voiceId,text,sessionAuthorizationPath}) {
  if(sessionAuthorizationPath)return assertHomeSessionAuthorized({root,approvalId,characterId,provider,voiceId,text,sessionAuthorizationPath});
  root=path.resolve(root);
  const choice=await resolveSpeechVoice({root,characterId,provider,voiceId});
  const profiles=JSON.parse(fs.readFileSync(path.join(root,'wiki/comics-library/voices.json'),'utf8')).profiles;
  const profile=profiles.find(p=>p.characterId===characterId);
  const file=path.join(root,'wiki/comics-library/speech-approvals.json');if(!fs.existsSync(file))throw Error('Generation blocked: human speech review is required');
  const raw=fs.readFileSync(file),reviews=JSON.parse(raw.toString('utf8'));
  if(reviews.schemaVersion!==1||!Array.isArray(reviews.textReviews))throw Error('Invalid speech approval authority');
  const review=reviews.textReviews.find(r=>r.id===approvalId),hash=b=>createHash('sha256').update(b).digest('hex');
  if(!review||!/^site\/src\/data\/comic-stories\/[a-z0-9-]+\.ts$/.test(review.storySource?.path||''))throw Error('Generation blocked: exact human review absent');
  const source=path.join(root,review.storySource.path),sourceHash=hash(fs.readFileSync(source));
  const row={id:approvalId,characterId,provider,voiceId,textSha256:hash(Buffer.from(text,'utf8')),storySource:{path:review.storySource.path,sha256:sourceHash}};
  if(!casting.approval(row,review,profile))throw Error('Generation blocked: text, source or selected voice changed after human review');
  return {review,approvalManifestSha256:hash(raw),voiceSelection:choice,sourceSha256:sourceHash};
}
/** A current bounded delivery instruction is distinct from a human text/hearing review. */
export async function assertHomeSessionAuthorized({root,approvalId,characterId,provider,voiceId,text,sessionAuthorizationPath}) {
  root=path.resolve(root);
  const permittedPaths={'wiki/comics-library/records/home-missing-voices-20261013-authorization.json':47,'wiki/comics-library/records/home-missing-voices-20261013-authorization-v2.json':53,'wiki/comics-library/records/home-voice-linebreak-repair-20261013-authorization.json':41,'wiki/comics-library/records/home-rebuild-20261014/narration-authorization-20261015.json':11};
  const ceiling=permittedPaths[sessionAuthorizationPath];if(!ceiling)throw Error('Invalid Home session authorization path');
  const raw=fs.readFileSync(path.join(root,sessionAuthorizationPath)),auth=JSON.parse(raw);
  if(auth.schemaVersion!==1||auth.type!=='current-session-generation-direction'||auth.storyId!=='home'||auth.directive?.goal!=='complete comic'||!auth.directive?.quote?.includes('use the morgan freeman second brain voice')||auth.hearingApproved!==false||auth.textReviewRecorded!==false||auth.maximumRequests!==ceiling||auth.automaticRetries!==0||auth.paidFallback!==false||!Array.isArray(auth.lines)||auth.lines.length!==ceiling||new Set(auth.lines.map(r=>r.id)).size!==ceiling)throw Error('Invalid bounded Home direction');
  const row=auth.lines.find(r=>r.id===approvalId),hash=b=>createHash('sha256').update(b).digest('hex');
  if(!row||row.characterId!==characterId||row.provider!==provider||row.voiceId!==voiceId||row.textSha256!==hash(Buffer.from(text,'utf8'))||row.text!==text)throw Error('Home request differs from the exact session direction');
  if(!['second-brain','matt','marco'].includes(characterId))throw Error('Home session has no casting authority for this character');
  const choice=await resolveSpeechVoice({root,characterId,provider,voiceId,allowHeld:characterId==='second-brain'});
  // Re-read actual words/identity; unrelated artwork and geometry changes do not revoke the instruction.
  const {registerHooks}=await import('node:module');
  const hooks=registerHooks({resolve(spec,context,next){try{return next(spec,context);}catch(error){if(/^\.\.?\//.test(spec)&&!spec.endsWith('.ts'))return next(spec+'.ts',context);throw error;}}});
  const source=path.join(root,'site/src/data/comic-stories/home.ts'),sourceSha256=hash(fs.readFileSync(source));
  let story;try{story=(await import(pathToFileURL(source).href+'?speech-session='+sourceSha256)).homeComic;}finally{hooks.deregister();}
  const panel=story.scenes.flatMap(s=>s.panels).find(p=>p.img===row.panelId),balloon=panel?.balloons.find(b=>b&&b.text===text&&b.kind===row.kind&&b.who===row.authoredWho);
  const validNarration=balloon&&(['caption','place'].includes(balloon.kind)||(balloon.kind==='speech'&&balloon.who==='narrator'&&row.presentation==='quoted-message'));
  const repair=sessionAuthorizationPath==='wiki/comics-library/records/home-voice-linebreak-repair-20261013-authorization.json';
  if(repair){
    const spoken=text.replace(/\s+/gu,' ').trim(),old=row.replacesTake;
    if(auth.purpose!=='repair-layout-pauses'||characterId!=='second-brain'||provider!=='Fish Audio'||!text.includes('\n')||row.spokenText!==spoken||row.spokenTextSha256!==hash(Buffer.from(spoken,'utf8'))||row.spokenTextNormalization!=='layout-whitespace-v1'||!old||balloon?.speech?.id!==old.id||balloon.speech.src!==old.src||balloon.speech.provider!==provider||balloon.speech.characterId!==characterId)throw Error('Current Home replacement differs from bounded layout-pause repair');
    const records=JSON.parse(fs.readFileSync(path.join(root,'wiki/comics-library/speech.json'),'utf8')).records,retained=records.find(r=>r.id===old.id);
    if(!retained||retained.characterId!==characterId||retained.voiceId!==voiceId||retained.text!==text||retained.canonicalPath!==old.canonicalPath||retained.sha256!==old.sha256||hash(fs.readFileSync(path.join(root,retained.canonicalPath)))!==old.sha256)throw Error('Retained Home take changed before replacement');
  }
  if(!balloon||(!repair&&balloon.speech)||(characterId==='second-brain'&&!validNarration))throw Error('Current Home utterance changed or already has a take');
  return {sessionAuthorization:{path:sessionAuthorizationPath,sha256:hash(raw),lineId:approvalId,directive:auth.directive},voiceSelection:choice,sourceSha256,hearingApproved:false,textReviewRecorded:false};
}
/** Resolve Studio's live canonical choice; a supplied stale identity is never substituted. */
export async function resolveSpeechVoice({root,characterId,provider,voiceId,allowHeld=false,required=true}) {
  root=path.resolve(root);
  const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
  const profiles=read('wiki/comics-library/voices.json').profiles,catalog=read('wiki/comics-library/provider-voices.json').voices;
  const characters=read('wiki/comics-library/characters.json').characters;
  casting.validate(profiles,catalog,characters);
  const profile=profiles.find(p=>p.characterId===characterId);
  if(!profile)throw Error('Generation blocked: character has no canonical voice profile');
  const choice=casting.chosen(profile);
  if(!choice){if(required===false)return null;throw Error('Generation blocked: character has no matching approved voice');}
  if(choice.productionHold===true&&allowHeld!==true)throw Error('Generation blocked: character has no matching approved voice (production hold)');
  if((provider!==undefined&&choice.provider!==provider)||(voiceId!==undefined&&choice.voiceId!==voiceId))
    throw Error('Generation blocked: character has no matching approved voice');
  return choice;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const input=JSON.parse(fs.readFileSync(0,'utf8'));console.log(JSON.stringify(await(input.action==='resolve'?resolveSpeechVoice(input):assertSpeechApproved(input))));}
  catch(error){console.error(error.message);process.exitCode=1;}
}
