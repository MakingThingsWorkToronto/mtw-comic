// Source/container checks only. These do not inspect artwork or replace comic-visual-v1 approval.
import {readFileSync,existsSync} from 'node:fs';
import {resolve,relative,isAbsolute} from 'node:path';
const presets=new Set(['still','push','drift-left','drift-right','light','shadow','projection','sprout','travel','vibrate']);
const rect=r=>Array.isArray(r)&&r.length===4&&r.every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0)&&r[2]>0&&r[3]>0&&r[0]+r[2]<=1&&r[1]+r[3]<=1;
export function comicLayerErrors(scene,story={scenes:[scene]}){
 const errors=[],layers=scene.layers;
 const motions=(scene.panels||[]).flatMap((p,index)=>(p.layerMotion==null?[]:[{panel:p,index}]));
 if(layers==null){if(motions.length)errors.push('layerMotion requires scene.layers');return errors;}
 if(!Array.isArray(layers)||!layers.length)return ['layers must be a nonempty ordered array'];
 const ids=new Set();
 for(const l of layers){
  if(!l||typeof l!=='object'||Array.isArray(l)){errors.push('layer must be an object');continue;}
  if(typeof l.id!=='string'||!/^[-a-zA-Z0-9_]+$/.test(l.id)||ids.has(l.id))errors.push('layer IDs must be nonempty and unique');ids.add(l.id);
  for(const k of Object.keys(l))if(!['id','src','role','opacity'].includes(k))errors.push('unknown layer field '+k);
  if(!['background','humans','agents','props','light'].includes(l.role))errors.push('unknown layer role '+l.role);
  if(typeof l.src!=='string'||!/^\/comic\/[-a-zA-Z0-9_/]+\.(png|webp)$/.test(l.src)||l.src.split('/').includes('..'))errors.push('layer src must be a local full PNG/WebP URL');
  if(l.opacity!=null&&!(typeof l.opacity==='number'&&Number.isFinite(l.opacity)&&l.opacity>=0&&l.opacity<=1))errors.push('layer opacity must be finite within 0-1');
 }
 if(!scene.art)errors.push('layered scene must retain its page-art fallback');
 for(const {panel,index} of motions){
  if(!Array.isArray(panel.layerMotion)){errors.push('panel '+index+' layerMotion must be an array');continue;}
  const used=new Set(),floorIndexes=new Set(); let floorPolicy;
  for(const m of panel.layerMotion){
   if(!m||typeof m!=='object'||Array.isArray(m)){errors.push('layer motion must be an object');continue;}
   for(const k of Object.keys(m))if(!['layerId','preset','beats','strength','fabrication','floors','floorIndex','activeFloors','retainedFloors','floorSource','from','to','amplitude','sourceBounds'].includes(k))errors.push('unknown layer motion field '+k);
   if(!ids.has(m.layerId)||used.has(m.layerId))errors.push('layer motion must bind one unique existing layer');used.add(m.layerId);
   if(!presets.has(m.preset))errors.push('unknown layer motion preset '+m.preset);
   if(['travel','vibrate'].includes(m.preset)&&layers.find(l=>l?.id===m.layerId)?.role!=='props')errors.push('action motion requires an isolated props plane');
   if(m.sourceBounds!==undefined&&(!['travel','vibrate'].includes(m.preset)||!rect(m.sourceBounds)))errors.push('sourceBounds requires isolated prop motion and a bounded nonempty genuine-alpha source rectangle');
   for(const field of ['from','to'])if((m.preset==='travel'||m[field]!==undefined)&&!(m.preset==='travel'&&Array.isArray(m[field])&&m[field].length===2&&m[field].every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=-1&&n<=1)))errors.push(field+' requires travel and two source-normalized offsets within -1 to 1');
   if((m.preset==='vibrate'||m.amplitude!==undefined)&&!(m.preset==='vibrate'&&typeof m.amplitude==='number'&&Number.isFinite(m.amplitude)&&m.amplitude>0&&m.amplitude<=.012))errors.push('amplitude requires vibrate and a source-width displacement within 0-.012');
   if(m.fabrication!==undefined&&(m.fabrication!==true||m.preset!=='projection'||layers.find(l=>l?.id===m.layerId)?.role!=='agents'||(layers.find(l=>l?.id===m.layerId)?.opacity??1)<.25||(layers.find(l=>l?.id===m.layerId)?.opacity??1)>1))errors.push('fabrication requires projection on an agent plane with constant authored opacity .25-1');
   if(m.preset==='projection'&&layers.find(l=>l?.id===m.layerId)?.role!=='agents')errors.push('projection modulation is for digital-agent planes; humans remain solid');
   if(m.preset==='sprout'&&layers.find(l=>l?.id===m.layerId)?.role!=='light')errors.push('sprout reveals only an isolated archive light plane');
   if(m.floors!=null&&!(m.preset==='sprout'&&Number.isInteger(m.floors)&&m.floors>=2&&m.floors<=16))errors.push('floors requires sprout and an integer within 2-16');
   const count=m.floors??8;
   const floorFields=['activeFloors','retainedFloors','floorSource'];
   if(m.floorIndex!==undefined){
    if(m.preset!=='sprout'||!Number.isInteger(m.floorIndex)||m.floorIndex<1||m.floorIndex>count)errors.push('floorIndex requires sprout and an integer within 1-floors');
    if(floorIndexes.has(m.floorIndex))errors.push('independent floor indexes must be unique within a panel');floorIndexes.add(m.floorIndex);
    for(const field of ['activeFloors','retainedFloors'])if(m[field]!==undefined&&(!Array.isArray(m[field])||m[field].some(n=>!Number.isInteger(n)||n<1||n>count)||new Set(m[field]).size!==m[field].length))errors.push(field+' must contain unique integer indexes within 1-floors');
    if(Array.isArray(m.activeFloors)&&Array.isArray(m.retainedFloors)&&m.retainedFloors.some(n=>!m.activeFloors.includes(n)))errors.push('retainedFloors must be eligible activeFloors');
    const policy=JSON.stringify([count,Array.isArray(m.activeFloors)?[...m.activeFloors].sort((a,b)=>a-b):null,Array.isArray(m.retainedFloors)?[...m.retainedFloors].sort((a,b)=>a-b):[]]);
    if(floorPolicy!==undefined&&policy!==floorPolicy)errors.push('independent floors in a panel must share floor count and eligibility/retention policy');floorPolicy=policy;
    const source=m.floorSource,sourceScene=story.scenes?.find(s=>s.id===source?.sceneId);
    if(!source||typeof source!=='object'||Array.isArray(source)||Object.keys(source).some(k=>!['sceneId','panelId'].includes(k))||typeof source.sceneId!=='string'||typeof source.panelId!=='string'||sourceScene?.panels?.filter(p=>(p.img??p.id)===source.panelId).length!==1)errors.push('floorSource must bind one existing story scene/panel contribution');
    const active=!Array.isArray(m.activeFloors)||m.activeFloors.includes(m.floorIndex);
    if(active&&sourceScene&&story.scenes.indexOf(sourceScene)>story.scenes.indexOf(scene))errors.push('active floor cannot claim a future scene contribution');
   }else if(floorFields.some(k=>m[k]!==undefined))errors.push('floor eligibility/retention/source fields require floorIndex');
   if(m.beats!=null&&!(typeof m.beats==='number'&&Number.isFinite(m.beats)&&m.beats>=2&&m.beats<=8))errors.push('layer motion beats must be finite within 2-8');
   if(m.strength!=null&&!(typeof m.strength==='number'&&Number.isFinite(m.strength)&&m.strength>=0&&m.strength<=1))errors.push('layer motion strength must be finite within 0-1');
  }
 }
 return errors;
}
// Header dimensions/declared alpha are a cheap source prerequisite, never pixel-level visual proof.
export function layerRasterHeader(bytes){
 if(bytes.length>=33&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&bytes.toString('ascii',12,16)==='IHDR'){
  let alpha=[4,6].includes(bytes[25]);for(let i=8;i+12<=bytes.length;){const n=bytes.readUInt32BE(i);if(i+n+12>bytes.length)throw Error('truncated PNG chunk');if(bytes.toString('ascii',i+4,i+8)==='tRNS')alpha=true;i+=n+12;}
  return {format:'png',width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),alpha};
 }
 if(bytes.length>=20&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'){
  let alpha=false,result;for(let i=12;i+8<=bytes.length;){const kind=bytes.toString('ascii',i,i+4),n=bytes.readUInt32LE(i+4),start=i+8;if(start+n>bytes.length)throw Error('truncated WebP chunk');
   if(kind==='ALPH')alpha=true;
   if(kind==='VP8X'&&n>=10){alpha=alpha||!!(bytes[start]&16);result={width:bytes.readUIntLE(start+4,3)+1,height:bytes.readUIntLE(start+7,3)+1};}
   else if(kind==='VP8L'&&n>=5&&bytes[start]===47){const bits=bytes.readUInt32LE(start+1);alpha=alpha||!!(bits&0x10000000);result=result||{width:(bits&0x3fff)+1,height:((bits>>>14)&0x3fff)+1};}
   else if(kind==='VP8 '&&n>=10&&bytes[start+3]===157&&bytes[start+4]===1&&bytes[start+5]===42)result=result||{width:bytes.readUInt16LE(start+6)&0x3fff,height:bytes.readUInt16LE(start+8)&0x3fff};
   i=start+n+(n%2);
  }if(result)return {format:'webp',...result,alpha};
 }throw Error('not a supported full PNG/WebP plane');
}
export function comicLayerAssetErrors(scene,publicDir){
 const errors=[];if(!Array.isArray(scene.layers)||!scene.layers.length)return errors;
 let aspect;
 for(const layer of scene.layers){try{
  if(!layer?.src||!/^\/comic\/[-a-zA-Z0-9_/]+\.(png|webp)$/.test(layer.src))continue;
  const file=resolve(publicDir,'.'+layer.src),rel=relative(resolve(publicDir),file);if(rel.startsWith('..')||isAbsolute(rel))throw Error('plane escapes public');
  if(!existsSync(file))throw Error('plane file missing');const meta=layerRasterHeader(readFileSync(file));
  if(!meta.width||!meta.height||!layer.src.endsWith('.'+meta.format))throw Error('invalid dimensions or container/extension mismatch');
  const a=meta.width/meta.height;if(aspect==null)aspect=a;else if(Math.abs(a-aspect)>.001)throw Error('planes have different aspects');
  if(layer.role!=='background'&&!meta.alpha)throw Error('foreground plane must declare alpha; actual transparency still needs visual inspection');
 }catch(error){errors.push(layer.id+': '+error.message);}}
 return errors;
}
// Permit only the exact implemented digital projection sample. Any extra engine glow still fails deslop.
export function withoutApprovedProjection(source){
 const exact="out.filter = 'drop-shadow(0 0 ' + (1 + 1.5 * amount).toFixed(3) + 'px rgba(91,220,217,0.24))';";
 const start=source.indexOf("} else if (spec.preset === 'projection') {"),end=source.indexOf('\n    }',start),branch=start<0?'':source.slice(start,end);
 return branch.includes(exact)&&branch.includes('out.opacity = 1 - 0.045 * strength * Math.sin(Math.PI * k);')?source.slice(0,start)+branch.replace(exact,'out.filter = /* approved digital-agent projection */ \'none\';')+source.slice(end):source;
}
