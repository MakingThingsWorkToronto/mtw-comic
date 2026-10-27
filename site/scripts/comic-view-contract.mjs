// Cheap schema/container prerequisites, never actual image inspection or human approval.
import {readFileSync,existsSync,realpathSync} from 'node:fs';
import {resolve,relative,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {verifyDelivery} from '../../.codex/skills/mtw-comic-story/scripts/playback_bindings.mjs';
import {comicLayerErrors,layerRasterHeader} from './comic-layer-contract.mjs';
const local=src=>typeof src==='string'&&/^\/comic\/[-a-zA-Z0-9_/]+\.(png|webp|avif)$/.test(src);
export function viewRasterHeader(bytes){
 if(bytes.toString('ascii',4,8)!=='ftyp')return layerRasterHeader(bytes);
 const size=bytes.readUInt32BE(0);
 if(size<16||size>bytes.length||!['avif','avis'].some(brand=>bytes.subarray(8,size).includes(Buffer.from(brand))))throw Error('not an AVIF container');
 function dimensions(start,end){
  for(let at=start;at+8<=end;){const n=bytes.readUInt32BE(at),kind=bytes.toString('ascii',at+4,at+8);if(n<8||at+n>end)throw Error('truncated AVIF box');
   if(kind==='ispe'&&n>=20)return {format:'avif',width:bytes.readUInt32BE(at+12),height:bytes.readUInt32BE(at+16)};
   if(['meta','iprp','ipco'].includes(kind)){const result=dimensions(at+8+(kind==='meta'?4:0),at+n);if(result)return result;}
   at+=n;
  }
 }
 const meta=dimensions(0,bytes.length);if(!meta)throw Error('AVIF has no encoded image dimensions');return meta;
}
const rect=r=>Array.isArray(r)&&r.length===4&&r.every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0)&&r[2]>0&&r[3]>0&&r[0]+r[2]<=1&&r[1]+r[3]<=1;
const point=p=>Array.isArray(p)&&p.length===2&&p.every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1);
function agentPlacementErrors(placement,role,phone=false){
 if(!placement||typeof placement!=='object'||Array.isArray(placement))return ['agentPlacement must be an object'];
 const errors=[];
 if(role!=='agents')errors.push('agentPlacement is only for digital-agent alpha planes');
 for(const key of Object.keys(placement))if(!(phone?['sourceROI','slot','fit','speakerIds']:['sourceROI','slot','fit','speakerIds','phone']).includes(key))errors.push('unknown agentPlacement field '+key);
 if(!rect(placement.sourceROI)||!rect(placement.slot))errors.push('agentPlacement requires bounded nonempty sourceROI and panel slot');
 if(placement.fit!=='contain')errors.push('agentPlacement preserves the full silhouette with contain');
 if(!Array.isArray(placement.speakerIds)||!placement.speakerIds.length||placement.speakerIds.some(id=>typeof id!=='string'||!/^[-a-z]+$/.test(id))||new Set(placement.speakerIds).size!==placement.speakerIds.length)errors.push('agentPlacement requires unique source-owned cast speakerIds');
 if(placement.phone!==undefined)errors.push(...agentPlacementErrors(placement.phone,role,true).map(s=>'phone '+s));
 return errors;
}
function propPlacementErrors(placement,role){
 if(!placement||typeof placement!=='object'||Array.isArray(placement))return ['propPlacement must be an object'];
 const errors=[];
 if(!['props','light'].includes(role))errors.push('propPlacement is only for isolated physical props or architectural light planes');
 for(const key of Object.keys(placement))if(!['sourceROI','slot','fit'].includes(key))errors.push('unknown propPlacement field '+key);
 if(!rect(placement.sourceROI)||!rect(placement.slot))errors.push('propPlacement requires bounded sourceROI and panel slot');
 if(placement.fit!=='contain')errors.push('propPlacement preserves the full silhouette with contain');
 return errors;
}
export function comicSpeakerErrors(speakers){
 if(!speakers||typeof speakers!=='object'||Array.isArray(speakers))return ['speakers must be an object'];
 const errors=[];
 for(const [id,anchor] of Object.entries(speakers)){
  if(!/^[-a-z]+$/.test(id))errors.push('speaker identity must be a cast ID');
  if(!anchor||typeof anchor!=='object'||Array.isArray(anchor)){errors.push(id+' speaker anchor must be an object');continue;}
  for(const key of Object.keys(anchor))if(!['mouth','face'].includes(key))errors.push(id+' unknown speaker anchor field '+key);
  if(!point(anchor.mouth))errors.push(id+' mouth must be a normalized finite source point');
  if(!rect(anchor.face))errors.push(id+' face must be a bounded nonempty source rectangle');
 }
 return errors;
}
const digest=b=>createHash('sha256').update(b).digest('hex');
const boundHash=s=>typeof s==='string'&&/^[0-9a-f]{64}$/.test(s);
const canonicalPath=s=>typeof s==='string'&&/^wiki\/image-library\/assets\/[-a-zA-Z0-9_/]+\.(png|webp|avif)$/.test(s);
export function comicSourceErrors(spec,panel,{staticArt=false,phone=false}={}){
 const e=[];if(!spec||typeof spec!=='object'||Array.isArray(spec))return ['source must be an object'];
 const keys=phone?['src','ar','alternates','canonicalSource','fit','speakers','protectedFaces']:staticArt?['src','ar','alternates','canonicalSource','phone','fit','speakers','protectedFaces']:['id','at','src','alt','ar','phone','media','alternates','canonicalSource','layers','layerMotion','fit','speakers','protectedFaces'];
 for(const key of Object.keys(spec))if(!keys.includes(key))e.push('unknown source field '+key);
 if(spec.fit!=null&&!['cover','contain'].includes(spec.fit))e.push('fit must be cover or contain');
 if(spec.speakers!=null)e.push(...comicSpeakerErrors(spec.speakers));
 if(spec.protectedFaces!=null&&(!Array.isArray(spec.protectedFaces)||spec.protectedFaces.some(r=>!rect(r))))e.push('protectedFaces requires bounded source rectangles');
 if((!phone||spec.src!=null)&&!local(spec.src))e.push('src must be a local full PNG/WebP/AVIF URL');
 if((staticArt||spec.ar!=null)&&!rect(spec.ar))e.push('ar must be a bounded nonempty source rectangle');
 if(spec.alternates!=null&&(!Array.isArray(spec.alternates)||!spec.alternates.length||spec.alternates.some(s=>!local(s))||new Set([spec.src,...spec.alternates]).size!==1+spec.alternates.length))e.push('alternates must be distinct local PNG/WebP/AVIF URLs');
 const a=spec.canonicalSource;
 if(staticArt||spec.alternates||a){
  if(!a||typeof a!=='object'||Array.isArray(a))e.push('canonicalSource required for staticArt/alternate encodings');
  else{
   for(const k of Object.keys(a))if(!['panelId','path','sha256','recordId','treatment','deliveryBindings'].includes(k))e.push('unknown canonicalSource field '+k);
   if(!panel.img||a.panelId!==panel.img)e.push('canonicalSource panelId must match this panel img');
   if(!canonicalPath(a.path)||!boundHash(a.sha256)||typeof a.recordId!=='string'||!a.recordId.trim()||typeof a.treatment!=='string'||!a.treatment.trim())e.push('canonicalSource requires exact canonical path/hash/record/treatment');
   if(a.deliveryBindings!=null&&!Array.isArray(a.deliveryBindings))e.push('deliveryBindings must be an array');
  }
 }
 if(!phone&&spec.phone!=null){
  if(!spec.phone||typeof spec.phone!=='object'||Array.isArray(spec.phone))e.push('phone source must be an object');
  else e.push(...comicSourceErrors({...spec.phone,src:spec.phone.src||spec.src,canonicalSource:spec.phone.canonicalSource||a},panel,{phone:true}).map(s=>'phone '+s));
 }
 return e;
}
function viewLayerErrors(view,panel,scene,story){
 const errors=[],layers=view.layers;
 if(!Array.isArray(layers)||!layers.length)return ['layers must be a nonempty ordered array'];
 if(!view.ar)return ['layered view requires one shared bounded ar'];
 if(view.phone&&Object.keys(view.phone).some(k=>!['ar','fit','speakers','protectedFaces'].includes(k)))errors.push('layered phone overrides may change only shared ar/fit/speakers/protectedFaces');
 const stripped=layers.map(l=>({id:l?.id,src:l?.src,role:l?.role,...(l?.opacity!=null?{opacity:l.opacity}:{})}));
 for(const layer of layers){
  if(!layer||typeof layer!=='object'||Array.isArray(layer)){errors.push('layer must be an object');continue;}
  for(const k of Object.keys(layer))if(!['id','src','role','opacity','alternates','canonicalSource','agentPlacement','propPlacement'].includes(k))errors.push('unknown view layer field '+k);
  if(layer.agentPlacement!==undefined)errors.push(...agentPlacementErrors(layer.agentPlacement,layer.role));
  if(layer.propPlacement!==undefined)errors.push(...propPlacementErrors(layer.propPlacement,layer.role));
  errors.push(...comicSourceErrors({src:layer.src,alternates:layer.alternates,canonicalSource:layer.canonicalSource},panel,{phone:true}));
  if(!layer.canonicalSource)errors.push('every view plane requires canonicalSource');
  if((Array.isArray(layer.alternates)?layer.alternates:[]).some(src=>!/^\/comic\/[-a-zA-Z0-9_/]+\.(png|webp)$/.test(src)))errors.push('plane alternates require PNG/WebP alpha-capable containers');
 }
 for(const phone of [false,true]){
  const owned=new Set(),anchors=phone&&view.phone?.speakers||view.speakers||panel.speakers;
  for(const layer of layers){const p=phone&&layer?.agentPlacement?.phone||layer?.agentPlacement;
   for(const id of Array.isArray(p?.speakerIds)?p.speakerIds:[]){
    if(owned.has(id))errors.push('agentPlacement cannot assign one speaker to two independent transforms');owned.add(id);
    if(!anchors?.[id])errors.push('agentPlacement requires reviewed source mouth/face anchors for '+id);
   }
  }
 }
 if(layers[0]?.role!=='background'||layers[0]?.src!==view.src||!['panelId','path','sha256','recordId','treatment'].every(k=>layers[0]?.canonicalSource?.[k]===view.canonicalSource?.[k])||JSON.stringify(layers[0]?.alternates||[])!==JSON.stringify(view.alternates||[]))errors.push('view src/authority/alternates must bind its first background scaffold');
 if(!Array.isArray(view.layerMotion))return [...errors,'view layerMotion must be an array'];
 if(view.layerMotion.some(m=>m&&(['activeFloors','retainedFloors'].some(k=>m[k]!==undefined&&!Array.isArray(m[k]))||(m.floors!==undefined&&(!Number.isInteger(m.floors)||m.floors<2||m.floors>16)))))return [...errors,'floor policy requires bounded integer floors and array eligibility/retention'];
 if(view.layerMotion.length!==layers.length)errors.push('every view plane requires its own motion declaration');
 // Keep every real contribution anchor in this scene. Only the viewed panel
 // receives this plane stack; other panels' unrelated motion is not in scope.
 const virtual={...scene,layers:stripped,panels:scene.panels.map(p=>p===panel?{...p,layerMotion:view.layerMotion}:{...p,layerMotion:undefined})};
 const indexed=(view.layerMotion||[]).some(m=>m?.floorIndex!=null);
 if(indexed&&(!Number.isFinite(scene.b)||!Number.isFinite(panel.at)||!Number.isFinite(view.at)))errors.push('indexed layered view requires finite story/panel/view clock anchors');
 if(indexed&&(!story?.scenes?.includes(scene)))errors.push('indexed layered views require the actual whole story');
 const boundStory={...story,scenes:(story?.scenes||[scene]).map(s=>s===scene?virtual:s)};
 errors.push(...comicLayerErrors(virtual,boundStory));
 for(const m of view.layerMotion||[]){
  if(m?.preset==='sprout'&&m.floorIndex==null)errors.push('view sprout requires an independent whole floor plane; clipping a baked archive is unsupported');
  if(m?.floorIndex==null)continue;
  const sourceScene=story?.scenes?.find(s=>s.id===m.floorSource?.sceneId),sourcePanel=sourceScene?.panels?.find(p=>(p.img??p.id)===m.floorSource?.panelId);
  const start=scene.b+panel.at+view.at,retained=m.retainedFloors?.includes(m.floorIndex),eligible=!m.activeFloors||m.activeFloors.includes(m.floorIndex);
  if(eligible&&sourcePanel&&(!(Number.isFinite(sourceScene.b)&&Number.isFinite(sourcePanel.at))||(retained?sourceScene.b+sourcePanel.at>=start:sourceScene.b+sourcePanel.at>start+(m.beats??8)*m.floorIndex/(m.floors??8))))errors.push('floorSource must precede its actual retained/activation boundary');
  const eligibleIndexes=m.activeFloors||Array.from({length:m.floors??8},(_,i)=>i+1);
  if(eligibleIndexes.some(index=>!(view.layerMotion||[]).some(n=>n?.floorIndex===index)))errors.push('eligible/retained floor must have an independent anchored plane');
  const layer=layers.find(l=>l?.id===m.layerId);
  if(m.preset==='sprout'&&layer?.opacity!=null&&layer.opacity!==1)errors.push('archive content keeps source-authored alpha; runtime opacity must be 1');
 }
 return errors;
}
export function comicViewErrors(scene,story){
 const errors=[];
 for(const [index,p] of (scene.panels||[]).entries()){
  if(p.fallbackView!==undefined){
   const f=p.fallbackView,tag='panel '+(index+1)+' fallbackView: ';
   if(!f||typeof f!=='object'||Array.isArray(f)||Object.keys(f).some(k=>!['desktop','phone'].includes(k)))errors.push(tag+'requires desktop/phone same-panel group references');
   else for(const media of ['desktop','phone']){
    const matches=Array.isArray(p.views)?p.views.filter(v=>v?.id===f[media]):[];const v=matches[0];
    if(typeof f[media]!=='string'||matches.length!==1||v.at!==0||v.media&&v.media!==media||!Array.isArray(v.layers)||v.layers.length<2||v.layers[0]?.role!=='background'||!v.canonicalSource||v.layers.some(l=>!l?.canonicalSource))errors.push(tag+media+' must bind one eligible canonical layered first view at zero in this panel');
   }
  }
  if(p.speakers!=null)errors.push(...comicSpeakerErrors(p.speakers).map(s=>`panel ${index+1} speakers: ${s}`));
  if(p.artFit!=null&&!['cover','contain'].includes(p.artFit))errors.push('panel '+(index+1)+' artFit must be cover or contain');
  if(p.staticArt!=null)errors.push(...comicSourceErrors(p.staticArt,p,{staticArt:true}).map(s=>`panel ${index+1} staticArt: ${s}`));
  if(p.views==null)continue;
  const prefix=`panel ${index+1} views: `;
  // One enduring group is layered artwork, not an implied sequence of cuts.
  // A lone flat cut still requires a second authored view.
  const enduring=v=>v?.at===0&&Array.isArray(v.layers)&&v.layers.length>=2&&v.layers[0]?.role==='background'&&(v.layers.some(layer=>layer?.role==='agents')||(v.layerMotion||[]).some(m=>v.layers.some(layer=>layer?.id===m.layerId&&(['travel','vibrate'].includes(m?.preset)&&layer.role==='props'||['light','sprout'].includes(m?.preset)&&layer.role==='light'))));
  const persistent=Array.isArray(p.views)&&['phone','desktop'].every(media=>{const eligible=p.views.filter(v=>v&&(!v.media||v.media===media));return !eligible.length||eligible.length===1&&enduring(eligible[0]);});
  if(!Array.isArray(p.views)||(!persistent&&p.views.length<2)){errors.push(prefix+'requires at least two ordered views, or one persistent background/agent, light or isolated-action group at zero');continue;}
  if(!p.staticArt&&(!scene.art||/\.svg$/i.test(scene.art)))errors.push(prefix+'requires retained raster page-art fallback containing essential evidence');
  const ids=new Set(),stop=index+1<scene.panels.length?scene.panels[index+1].at:scene.l,window=stop-p.at;
  for(const [i,v] of p.views.entries()){
   if(!v||typeof v!=='object'||Array.isArray(v)){errors.push(prefix+'view must be an object');continue;}
   errors.push(...comicSourceErrors(v,p).map(s=>prefix+s));
   if(v.layers!=null)errors.push(...viewLayerErrors(v,p,scene,story).map(s=>prefix+s));
   else if(v.layerMotion!=null)errors.push(prefix+'view layerMotion requires view.layers');
   if(typeof v.id!=='string'||!/^[-a-zA-Z0-9_]+$/.test(v.id)||ids.has(v.id))errors.push(prefix+'view IDs must be nonempty and unique');ids.add(v.id);
   if(!Number.isFinite(v.at)||v.at<0)errors.push(prefix+'offset must be finite and nonnegative');
   if(v.media!=null&&!['phone','desktop'].includes(v.media))errors.push(prefix+'media must be phone or desktop when present');
   if(!Number.isFinite(window)||window-v.at<1)errors.push(prefix+'view must leave at least one beat before next focus or scene end');
   if(!local(v.src))errors.push(prefix+'src must be a local full PNG/WebP/AVIF URL');
   if(typeof v.alt!=='string'||!v.alt.trim())errors.push(prefix+'alt must describe actual visible content');
   if(v.ar!=null&&!rect(v.ar))errors.push(prefix+'ar must be a bounded nonempty source rectangle');
   if(v.phone!=null){
    if(!v.phone||typeof v.phone!=='object'||Array.isArray(v.phone)){errors.push(prefix+'phone must be an object');continue;}
    for(const key of Object.keys(v.phone))if(!['src','ar','alternates','canonicalSource','fit','speakers','protectedFaces'].includes(key))errors.push(prefix+'unknown phone field '+key);
    if(v.phone.src!=null&&!local(v.phone.src))errors.push(prefix+'phone src must be a local full PNG/WebP/AVIF URL');
    if(v.phone.ar!=null&&!rect(v.phone.ar))errors.push(prefix+'phone ar must be a bounded nonempty source rectangle');
   }
  }
  for(const media of ['phone','desktop']){
   const eligible=p.views.filter(v=>v&&(!v.media||v.media===media));
   if(eligible.length===1&&!enduring(eligible[0]))errors.push(prefix+media+' requires at least two eligible ordered views');
   for(const [i,v] of eligible.entries())if(i===0?v.at!==0:v.at-eligible[i-1].at<1)errors.push(prefix+media+' first offset must be 0; increasing offsets need at least one beat of dwell');
  }
 }
 return errors;
}
export function comicViewAssetErrors(scene,publicDir){
 const errors=[];
 const repo=resolve(publicDir,'../..');
 // One lazy snapshot per validation pass; alias/binding checks share this catalog.
 let catalog,catalogError,catalogRead=false;
 const currentCatalog=()=>{if(!catalogRead){catalogRead=true;try{catalog=JSON.parse(readFileSync(resolve(repo,'wiki/image-library/manifest.json'),'utf8'));}catch(e){catalogError=e;}}if(catalogError)throw catalogError;return catalog;};
 for(const [i,p] of (scene.panels||[]).entries())for(const v of [p.staticArt,...(Array.isArray(p.views)?p.views:[])].filter(Boolean)){
  let canvas; const viewLayers=Array.isArray(v.layers)?v.layers:[];
  const sources=[v,...viewLayers,...(v.phone?[{...v,...v.phone,phone:undefined}]:[])],seen=new Set();
  for(const spec of sources)for(const src of [spec.src,...(Array.isArray(spec.alternates)?spec.alternates:[])].filter(local)){const bindingKey=JSON.stringify([src,spec.canonicalSource||null]);if(seen.has(bindingKey))continue;seen.add(bindingKey);try{
   const file=resolve(publicDir,'.'+src),rel=relative(resolve(publicDir),file);
   if(rel.startsWith('..')||isAbsolute(rel))throw Error('view escapes public');
   if(!existsSync(file))throw Error('view file missing');
   const real=relative(realpathSync(publicDir),realpathSync(file));if(real.startsWith('..')||isAbsolute(real))throw Error('view escapes public');
   const meta=viewRasterHeader(readFileSync(file));
   if(!meta.width||!meta.height||!src.endsWith('.'+meta.format))throw Error('invalid dimensions or container/extension mismatch');
   if(viewLayers.includes(spec)){
    if(!['png','webp'].includes(meta.format))throw Error('view plane requires PNG/WebP');
    const independent=spec.role==='agents'&&spec.agentPlacement||['props','light'].includes(spec.role)&&spec.propPlacement;
    if(!canvas)canvas=meta;else if(!independent&&(meta.width!==canvas.width||meta.height!==canvas.height))throw Error('view planes must share exact canvas dimensions');
    if(spec.role!=='background'&&!meta.alpha)throw Error('foreground view plane must declare alpha');
   }
   const a=spec.canonicalSource;
   if(a){
    if(!canonicalPath(a.path)||a.panelId!==p.img||!boundHash(a.sha256))throw Error('invalid canonical source binding');
    const master=resolve(repo,a.path),realMaster=relative(realpathSync(resolve(repo,'wiki/image-library/assets')),realpathSync(master));if(realMaster.startsWith('..')||isAbsolute(realMaster))throw Error('canonical source escapes image assets');
    const bytes=readFileSync(master);if(digest(bytes)!==a.sha256)throw Error('canonical source bytes stale');
    const nativeMeta=viewRasterHeader(bytes);if(Math.abs(meta.width/meta.height-nativeMeta.width/nativeMeta.height)>0.002)throw Error('source encoding aspect differs from canonical master');
    const catalog=currentCatalog();
    const selected=catalog.records.find(r=>r.id===a.recordId)?.treatments?.[a.treatment];
    if(!selected||'wiki/image-library/'+selected.path!==a.path||selected.sha256!==a.sha256)throw Error('canonical source catalog binding stale');
    if(src.endsWith('.png')&&digest(readFileSync(file))===a.sha256)continue;
    const binding=(a.deliveryBindings||[]).find(b=>b.publicPath==='site/public'+src);
    if(!binding?.encoderReceipt||binding.encoderReceipt.sourcePath!==a.path||binding.encoderReceipt.sourceSha256!==a.sha256||binding.encoderReceipt.outputPath!==binding.publicPath)throw Error('source-bound encoding receipt missing');
    verifyDelivery(repo,catalog,{story:null,art:src,recordId:a.recordId,treatment:a.treatment,deliveryBinding:binding});
   }
  }catch(e){errors.push(`panel ${i+1} ${v.id?'view '+v.id:'staticArt'}: ${src}: ${e.message}`);}}
 }
 return errors;
}
// Actual runtime reviewFrames diagnostics only: schema scene.l is not a usable cut window.
export function comicViewWindowErrors(scene,plan){
 const errors=[];
 if(!(scene.panels||[]).some(p=>p.views?.length))return errors;
 if(!plan||plan.scene!==scene.id||!['page','desktop','phone'].includes(plan.mode)||!Array.isArray(plan.frames)||!plan.frames.length)return ['ordered views require complete actual per-layout runtime windows'];
 const expected=(scene.panels||[]).map(p=>p.img),seen=new Set();
 for(const f of plan.frames){
  if(!f||!Array.isArray(f.panelImageIds)||!Array.isArray(f.panels)||!Number.isInteger(f.sheet)||!Number.isFinite(f.exitStart)||f.panelImageIds.some(id=>seen.has(id)||!expected.includes(id)||!f.panels.some(p=>p?.imageId===id&&Number.isFinite(p.fadeStart)&&Number.isFinite(p.fullyVisibleBeat))))return ['ordered views require complete actual per-layout runtime windows'];
  f.panelImageIds.forEach(id=>seen.add(id));
 }
 if(expected.some(id=>!id||!seen.has(id)))return ['ordered views require complete actual per-layout runtime windows'];
 const media=plan.mode==='phone'?'phone':'desktop';
 for(const p of scene.panels||[]){
  const eligible=(p.views||[]).filter(v=>!v.media||v.media===media);if(!eligible.length)continue;
  const frame=plan.frames.find(f=>f.panelImageIds?.includes(p.img)),window=frame?.panels?.find(w=>w.imageId===p.img);
  if(!frame||!window||!Number.isFinite(frame.exitStart)||!Number.isFinite(window.fadeStart)||!Number.isInteger(frame.sheet)){
   errors.push(p.img+': incomplete actual '+media+' window');continue;
  }
  const ids=new Set(plan.frames.filter(f=>f.sheet===frame.sheet).flatMap(f=>f.panelImageIds||[])),sameSheet=scene.panels.filter(p=>ids.has(p.img)),index=sameSheet.indexOf(p);
  if(index<0||[...ids].some(id=>!scene.panels.some(p=>p.img===id))){errors.push(p.img+': invalid actual sheet ownership');continue;}
  const stop=Math.min(window.fadeStart-scene.b,index+1<sameSheet.length?sameSheet[index+1].at:frame.exitStart-scene.b),offset=stop-p.at;
  if(!Number.isFinite(offset)){errors.push(p.img+': nonfinite actual usable window');continue;}
  for(const [i,v]of eligible.entries()){
   const end=Math.min(offset,i+1<eligible.length?eligible[i+1].at:offset);
   if(!Number.isFinite(v.at)||end-v.at<1)errors.push(p.img+'/'+v.id+': '+media+' cut has less than one beat before actual next focus/fade (usable offset '+offset+')');
  }
 }
 return errors;
}
