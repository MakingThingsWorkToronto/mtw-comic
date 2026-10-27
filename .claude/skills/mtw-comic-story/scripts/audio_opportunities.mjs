import {readFile,realpath} from 'node:fs/promises';
import {verifyDelivery} from './playback_bindings.mjs';
import {viewRasterHeader} from '../../../../site/scripts/comic-view-contract.mjs';
import {createHash} from 'node:crypto';
import {resolve,relative,isAbsolute,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {registerHooks} from 'node:module';

export const hash = value => createHash('sha256').update(value).digest('hex');
const fail = message => { throw new Error(message); };
const finite = (n, lo, hi) => typeof n==='number' && Number.isFinite(n) && n>=lo && n<=hi;
const text = value => typeof value==='string' && value.trim().length>0;
const key = (scene,panel) => `${scene}/${panel}`;
const unique = (values,label) => {if(new Set(values).size!==values.length) fail(`Duplicate ${label}`);};
export function contained(root,path) {
  if(!text(path)||path.includes('\\')||path.split('/').includes('..')||isAbsolute(path)||/^[a-z]+:/i.test(path)) fail('Unsafe local path');
  const full=resolve(root,path),rel=relative(resolve(root),full);
  if(rel.startsWith('..')||isAbsolute(rel)) fail('Path escapes root');
  return full;
}
export async function checkFile(root,path,sha) {
  const bytes=await readFile(contained(root,path));
  if(!/^[a-f0-9]{64}$/.test(sha??'')||hash(bytes)!==sha) fail(`Stale/missing bytes: ${path}`);
  return bytes;
}

export function validateAudioOpportunities(audit,context) {
  if(audit.schemaVersion!==1||audit.storyId!==context.storyId||audit.storySource.path!==context.source.path||audit.storySource.sha256!==context.source.sha256) fail('Stale/wrong story source');
  if(audit.librarySource.path!==context.library.path||audit.librarySource.sha256!==context.library.sha256) fail('Stale audio library projection');
  const boxes=audit.boxes??[],opps=audit.opportunities??[],decisions=audit.coverage??[];
  unique(boxes.map(b=>key(b.sceneId,b.panelId)),'boxes');
  if(JSON.stringify(boxes.map(b=>key(b.sceneId,b.panelId)))!==JSON.stringify(context.panels.map(p=>p.key))) fail('Missing/unexpected/reordered actual box');
  unique(opps.map(o=>o.id),'opportunities'); unique(decisions.map(d=>d.opportunityId),'coverage decisions');
  const boxMap=new Map(boxes.map(b=>[key(b.sceneId,b.panelId),b]));
  let pending=0;
  for(const box of boxes) {
    if(!['inspected','pending'].includes(box.visualReview?.status)||!text(box.decisionReason)) fail('Missing box visual/quiet decision');
    if(box.visualReview.status==='pending') pending++;
    else if(!text(box.visualReview.observations)||!(box.visuals?.length)) fail('No actual visual evidence');
    unique((box.visuals??[]).map(v=>v.viewId),'box views');
    for(const v of box.visuals??[]) if(!text(v.viewId)||!context.visualBindings.has(`${v.path}:${v.sha256}`)) fail('Unbound visual bytes');
    const actualPanel=context.panels.find(p=>p.key===key(box.sceneId,box.panelId));
    if(hasPanelSources(actualPanel?.selectedMedia)&&box.selectedMedia===undefined)fail('Missing selected panel source snapshot');
    if(box.selectedMedia!==undefined&&JSON.stringify(box.selectedMedia)!==JSON.stringify(context.panels.find(p=>p.key===key(box.sceneId,box.panelId))?.selectedMedia))fail('Stale selected media binding');
    if(!Array.isArray(box.opportunityIds)||!Array.isArray(box.speech)) fail('Missing explicit opportunity/speech lists');
    for(const speech of box.speech) if(!text(speech.id)||!['gated','unavailable','available-not-counted'].includes(speech.status)||!text(speech.reason)) fail('Invalid separate speech standing');
  }
  const anchorSignatures=new Set(),ambientSegments=new Set(),opMap=new Map();
  for(const o of opps) {
    if(!text(o.id)||!['ambient','action','agent'].includes(o.category)||!text(o.rationale)||!o.anchors?.length) fail('Invalid supported opportunity; music/speech do not inflate coverage');
    if(o.category==='ambient') {
      if(!text(o.segmentId)||ambientSegments.has(o.segmentId)) fail('Duplicate/missing continuous ambience segment');
      ambientSegments.add(o.segmentId);
    }
    unique(o.anchors.map(a=>key(a.sceneId,a.panelId)),'opportunity anchors');
    for(const anchor of o.anchors) {
      const k=key(anchor.sceneId,anchor.panelId),box=boxMap.get(k);
      if(!box||!box.opportunityIds.includes(o.id)||!text(anchor.observation)||!(box.visuals??[]).some(v=>v.viewId===anchor.viewId)) fail('Missing exact visual opportunity anchor');
      const signature=`${k}/${anchor.viewId}/${o.category}/${anchor.observation.trim().toLowerCase()}`;
      if(anchorSignatures.has(signature)) fail('Duplicated visual opportunity inflation');
      anchorSignatures.add(signature);
    }
    opMap.set(o.id,o);
  }
  for(const box of boxes) {
    unique(box.opportunityIds,'box opportunity IDs');
    for(const id of box.opportunityIds) if(!opMap.get(id)?.anchors.some(a=>key(a.sceneId,a.panelId)===key(box.sceneId,box.panelId))) fail('Dangling box opportunity');
  }
  if(decisions.length!==opps.length) fail('Every supported opportunity needs one explicit sound/silence decision');
  let covered=0; const coveredSources=new Set(); const byCategory={ambient:{eligible:0,covered:0},action:{eligible:0,covered:0},agent:{eligible:0,covered:0}};
  for(const d of decisions) {
    const o=opMap.get(d.opportunityId);
    if(!o||!['authored','planned','silent','missing'].includes(d.state)||!text(d.reason)) fail('Invalid coverage decision');
    byCategory[o.category].eligible++;
    if(d.state!=='authored') continue;
    const c=d.cue,asset=context.records.get(c?.libraryRecordId);
    if(!asset||!['ambience-recording','ambient-recipe','effect-recipe','sound-effect-recording'].includes(asset.type)) fail('Not a reusable non-speech sound record');
    if(!text(c.reuseReason)||!text(c.mixReason)||!finite(c.gain,0,1)||!finite(c.startBeat,0,context.beats)||!finite(c.endBeat,c.startBeat,context.beats)||c.endBeat<=c.startBeat||!finite(c.fadeInBeats,0,4)||!finite(c.fadeOutBeats,0,4)) fail('Invalid timing/mix/reuse binding');
    const panel=context.panels.find(p=>p.key===key(c.sceneId,c.panelId));
    if(!panel||!o.anchors.some(a=>key(a.sceneId,a.panelId)===panel.key)) fail('Cue source outside visual opportunity');
    if(c.source==='panel-sfx') {
      if(o.category==='ambient'||!Number.isInteger(c.cueIndex)) fail('Wrong cue source/category');
      const authored=panel.sfx[c.cueIndex];
      if(!authored||asset.kind!==authored.kind||c.gain!==(authored.gain??1)||Math.abs(c.startBeat-(panel.startBeat+(authored.delay??0)))>1e-7) fail('Cue kind/gain/beat differs from actual story');
    } else if(c.source==='panel-room') {
      if(o.category!=='ambient'||asset.room!==c.room||!['office','servers','street','rain'].includes(c.room)) fail('Wrong room opportunity');
      for(const a of o.anchors) if(context.panels.find(p=>p.key===key(a.sceneId,a.panelId))?.room!==c.room) fail('Ambience absent/wrong in actual anchored box');
    } else fail('Unsupported authored cue source');
    const sourceKey=`${c.source}/${panel.key}/${c.source==='panel-sfx'?c.cueIndex:c.room}`;
    if(coveredSources.has(sourceKey))fail('One authored cue cannot inflate multiple opportunities');
    coveredSources.add(sourceKey);
    if(o.anchors.some(a=>boxMap.get(key(a.sceneId,a.panelId)).visualReview.status!=='inspected')) fail('Cannot fulfil opportunity from pending visual inspection');
    covered++;byCategory[o.category].covered++;
  }
  const denominator=opps.length,ratio=denominator?covered/denominator:null;
  return {storyId:audit.storyId,boxes:boxes.length,denominator,covered,ratio,minimum:0.5,
    quantityMet:pending===0&&denominator>0&&ratio>=0.5,pendingVisualBoxes:pending,
    intentionalSilence:decisions.filter(d=>d.state==='silent').length,
    gatedOrUnavailableSpeech:boxes.reduce((n,b)=>n+b.speech.filter(s=>s.status!=='available-not-counted').length,0),byCategory,
    standing:pending?'pending actual visual audit':denominator?'quantity only; hearing/native/approval separate':'no supported opportunities; quantity not applicable',
    qualityReview:audit.qualityReview??{listening:'pending',nativeTiming:'pending'}};
}

/** Complete declared panel-source identity. Legacy stories retain their exact old shape. */
export function panelSelectedMedia(scene,panel) {
  const media={art:scene.art??null,layers:(scene.layers??[]).map(l=>({role:l.role,src:l.src}))};
  for(const field of ['staticArt','views'])if(panel[field]!==undefined)media[field]=structuredClone(panel[field]);
  return media;
}
function panelSources(media) {
  const out=[];
  for(const source of [media?.staticArt,...(Array.isArray(media?.views)?media.views:[])].filter(Boolean)) {
    out.push(source);
    for(const layer of source.layers || [])out.push(layer);
    if(source.phone)out.push({...source,...source.phone,phone:undefined,canonicalSource:source.phone.canonicalSource??source.canonicalSource});
  }
  return out;
}
const hasPanelSources=media=>media&&(media.staticArt!==undefined||media.views!==undefined);
async function validateSelectedSourceFiles(audit,context,root) {
  if(!context.panels.some(p=>hasPanelSources(p.selectedMedia)))return;
  const catalog=JSON.parse(await readFile(contained(root,'wiki/image-library/manifest.json'),'utf8'));
  const actualRoot=await realpath(resolve(root));
  async function actual(path) {
    const real=await realpath(contained(root,path)),rel=relative(actualRoot,real);
    if(rel.startsWith('..')||isAbsolute(rel))fail('Selected source escapes physical repository');
    return real;
  }
  for(const panel of context.panels) {
    const box=audit.boxes.find(b=>key(b.sceneId,b.panelId)===panel.key);
    if(!hasPanelSources(panel.selectedMedia))continue;
    if(!box||JSON.stringify(box.selectedMedia)!==JSON.stringify(panel.selectedMedia))fail('Missing/stale selected panel source snapshot');
    const seen=new Set();
    for(const spec of panelSources(panel.selectedMedia)) {
      const authority=spec.canonicalSource;
      if(!authority||authority.panelId!==panel.panelId||!/^wiki\/image-library\/assets\/[-a-zA-Z0-9_/]+\.(png|webp|avif)$/.test(authority.path??'')||!/^[a-f0-9]{64}$/.test(authority.sha256??'')||!text(authority.recordId)||!text(authority.treatment))fail('Selected panel source needs exact canonical authority');
      const selected=catalog.records.find(r=>r.id===authority.recordId)?.treatments?.[authority.treatment];
      if(!selected||'wiki/image-library/'+selected.path!==authority.path||selected.sha256!==authority.sha256)fail('Selected panel canonical catalog source stale');
      if(!box.visuals?.some(v=>v.path===authority.path&&v.sha256===authority.sha256))fail('Selected panel source missing from actual visual audit');
      await actual(authority.path);const nativeBytes=await checkFile(root,authority.path,authority.sha256),nativeHeader=viewRasterHeader(nativeBytes);
      if(!authority.path.endsWith('.'+nativeHeader.format))fail('Canonical source container/extension mismatch');
      const urls=[spec.src,...(spec.alternates??[])];
      if(!urls.length||new Set(urls).size!==urls.length)fail('Duplicate/missing selected source aliases');
      for(const src of urls) {
        if(typeof src!=='string'||!/^\/comic\/[-a-zA-Z0-9_/]+\.(png|webp|avif)$/.test(src))fail('Selected panel alias must be exact local raster URL');
        const publicPath='site/public'+src,signature=authority.path+'/'+src;
        if(seen.has(signature))continue;seen.add(signature);
        await actual(publicPath);const bytes=await readFile(contained(root,publicPath)),header=viewRasterHeader(bytes);
        if(!src.endsWith('.'+header.format)||Math.abs(header.width/header.height-nativeHeader.width/nativeHeader.height)>0.002||header.width>nativeHeader.width||header.height>nativeHeader.height)fail('Selected alias container/aspect/native-size mismatch');
        if(src.endsWith('.png')&&hash(bytes)===authority.sha256)continue;
        const binding=authority.deliveryBindings?.find(b=>b.publicPath===publicPath),receipt=binding?.encoderReceipt;
        if(!receipt||receipt.sourcePath!==authority.path||receipt.sourceSha256!==authority.sha256||receipt.outputPath!==publicPath)fail('Selected alias needs source-bound encoder receipt');
        verifyDelivery(root,catalog,{story:null,art:src,recordId:authority.recordId,treatment:authority.treatment,deliveryBinding:binding});
      }
    }
  }
}

export async function loadContext(root,sourcePath) {
  const sourceBytes=await readFile(contained(root,sourcePath));
  registerHooks({resolve(spec,ctx,next){try{return next(spec,ctx);}catch(e){if(/^\.\.?\//.test(spec)&&! /\.[a-z]+$/i.test(spec))return next(spec+'.ts',ctx);throw e;}}});
  const mod=await import(pathToFileURL(contained(root,sourcePath)).href+'?source-sha256='+hash(sourceBytes));
  const matches=Object.values(mod).filter(s=>s&&Array.isArray(s.scenes));
  if(matches.length!==1)fail('Expected one actual exported story');
  if(hash(await readFile(contained(root,sourcePath)))!==hash(sourceBytes))fail('Story source changed while loading');
  const story=matches[0],panels=[];
  for(const scene of story.scenes) for(const [i,p]of scene.panels.entries()) panels.push({key:key(scene.id,p.img??p.id??`${scene.id}:box-${i}`),sceneId:scene.id,panelId:p.img??p.id??`${scene.id}:box-${i}`,startBeat:scene.b+p.at,room:p.room??scene.room??'none',sfx:p.sfx??[],art:scene.art,selectedMedia:panelSelectedMedia(scene,p),sceneScore:scene.score??0,motion:p.motion??{preset:'still'},authorDescription:p.alt??'',speech:(p.balloons??[]).filter(b=>b.speech).map(b=>({id:b.speech.id,characterId:b.speech.characterId}))});
  const libraryPath='wiki/soundtrack-library/comic-audio.json',libraryBytes=await readFile(contained(root,libraryPath)),library=JSON.parse(libraryBytes);
  return {storyId:story.id,source:{path:sourcePath,sha256:hash(sourceBytes)},library:{path:libraryPath,sha256:hash(libraryBytes)},beats:story.beats,panels,roomAssets:story.soundAssets?.rooms??{},records:new Map(library.records.map(r=>[r.id,r])),visualBindings:new Set()};
}
export async function validateFiles(audit,context,root) {
  await validateSelectedSourceFiles(audit,context,root);
  for(const box of audit.boxes)for(const v of box.visuals??[]) {
    if(!v.path.startsWith('wiki/image-library/'))fail('Visual source must be canonical image-library bytes');
    await checkFile(root,v.path,v.sha256);context.visualBindings.add(`${v.path}:${v.sha256}`);
  }
  for(const d of audit.coverage??[])if(d.state==='authored') {
    const r=context.records.get(d.cue?.libraryRecordId);if(!r)fail('Missing soundtrack record');
    if(r.media){
      if(!r.media.path.startsWith('wiki/soundtrack-library/')&&!r.media.path.startsWith('wiki/comics-library/'))fail('Media must be canonical soundtrack or retained comics compatibility');
      await checkFile(root,r.media.path,r.media.sha256);
      if(d.cue.source==='panel-room'){
        const authored=context.roomAssets[d.cue.room];
        if(!authored?.src?.startsWith('/')||d.cue.gain!==(authored.gain??1))fail('Recording is not the actual authored room asset/gain');
        await checkFile(root,'site/public'+authored.src,r.media.sha256);
      }
    }
    else if(r.runtime) {
      const current=await readFile(contained(root,r.runtime.path));
      if(!text(r.runtime.functionSource)||hash(r.runtime.functionSource)!==r.runtime.recipeSha256||!current.toString('utf8').includes(r.runtime.functionSource))fail('Stale/unbound reproducible recipe');
    } else fail('No actual media or reproducible recipe binding');
  }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2),at=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];};
  if(!at('--audit'))fail('Usage: node audio_opportunities.mjs --audit <review.json> [--root <repo>]');
  const root=resolve(at('--root')??resolve(dirname(fileURLToPath(import.meta.url)),'../../../..'));
  const parsed=JSON.parse(await readFile(resolve(at('--audit')),'utf8'));
  let audits=Array.isArray(parsed.reviews)?parsed.reviews:[parsed];
  if(at('--story'))audits=audits.filter(a=>a.storyId===at('--story'));
  if(!audits.length)fail('No matching audit story');
  const results=[];
  for(const audit of audits){const ctx=await loadContext(root,audit.storySource.path);await validateFiles(audit,ctx,root);results.push(validateAudioOpportunities(audit,ctx));}
  console.log(JSON.stringify(results.length===1?results[0]:results,null,2));
}
