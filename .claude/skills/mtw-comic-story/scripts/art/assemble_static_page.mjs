/** Opaque, source-bound page-cell replacement. Not an alpha compositor or art judge. */
import {readFile,writeFile,mkdir,realpath,access} from 'node:fs/promises';
import {resolve,relative,dirname,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
export const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const fail=message=>{throw Error(message);};
const within=(root,p)=>{const r=relative(root,p);return r===''||(!r.startsWith('..')&&!isAbsolute(r));};
const rect=(r,w,h)=>r&&['left','top','width','height'].every(k=>Number.isInteger(r[k]))&&r.left>=0&&r.top>=0&&r.width>0&&r.height>0&&r.left+r.width<=w&&r.top+r.height<=h;
const overlap=(a,b)=>a.left<b.left+b.width&&b.left<a.left+a.width&&a.top<b.top+b.height&&b.top<a.top+a.height;
async function output(root,path){
 const p=resolve(path);if(!within(root,p))fail('Output escapes outputRoot');
 let parent=dirname(p);for(;;){try{parent=await realpath(parent);break;}catch(e){if(e.code!=='ENOENT')throw e;const next=dirname(parent);if(next===parent)throw e;parent=next;}}
 if(!within(root,parent))fail('Output ancestor escapes outputRoot');
 try{await access(p);fail('Refusing overwrite: '+p);}catch(e){if(e.code!=='ENOENT')throw e;}
 return p;
}
async function source(sharp,s,roots){
 if(!s||typeof s.path!=='string'||!/^[a-f0-9]{64}$/.test(s.sha256))fail('Exact source path/hash required');
 const path=await realpath(resolve(s.path));if(!roots.some(root=>within(root,path)))fail('Source escapes sourceRoots');
 const bytes=await readFile(path);if(hash(bytes)!==s.sha256)fail('Source hash mismatch');
 const meta=await sharp(bytes).metadata();if(meta.format!=='png'||(meta.orientation&&meta.orientation!==1))fail('Source must be a native unoriented PNG');
 const {data,info}=await sharp(bytes).toColourspace('srgb').ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let i=3;i<data.length;i+=4)if(data[i]!==255)fail('Static page sources must be fully opaque');
 const rgb=Buffer.alloc(info.width*info.height*3);for(let i=0,j=0;i<data.length;i+=4){rgb[j++]=data[i];rgb[j++]=data[i+1];rgb[j++]=data[i+2];}
 return {bytes,rgb,width:info.width,height:info.height};
}
function crop(raw,width,r){const bytes=Buffer.alloc(r.width*r.height*3);for(let y=0;y<r.height;y++){const offset=((r.top+y)*width+r.left)*3;raw.copy(bytes,y*r.width*3,offset,offset+r.width*3);}return bytes;}
export async function assemble(sharp,plan){
 if(plan.schemaVersion!==1||plan.operation!=='opaque-static-page-replacement')fail('Explicit opaque static-page operation required');
 if(plan.planes||plan.opacity!==undefined)fail('Alpha planes/opacity do not belong to static page assembly');
 if(!Array.isArray(plan.sourceRoots)||!plan.sourceRoots.length)fail('Explicit sourceRoots required');
 const roots=await Promise.all(plan.sourceRoots.map(p=>realpath(resolve(p)))),root=await realpath(resolve(plan.outputRoot));
 const destinations=await Promise.all([plan.pageOutput,plan.receiptOutput].map(p=>output(root,p)));
 if(destinations[0]===destinations[1])fail('Output paths must be distinct');
 const newCanvas=plan.canvas!==undefined;
 if(newCanvas&&plan.base!==undefined)fail('Choose an opaque source base OR explicit canvas, never both');
 let base,canvas;
 if(newCanvas){
  const c=plan.canvas;if(!c||!Number.isInteger(c.width)||!Number.isInteger(c.height)||c.width<1||c.height<1||c.width*c.height>100000000||typeof c.color!=='string'||!/^#[a-fA-F0-9]{6}$/.test(c.color)||Object.keys(c).some(k=>!['width','height','color'].includes(k)))fail('Explicit bounded opaque canvas dimensions/color required');
  const rgb=Buffer.alloc(c.width*c.height*3),color=[1,3,5].map(i=>parseInt(c.color.slice(i,i+2),16));for(let i=0;i<rgb.length;i+=3){rgb[i]=color[0];rgb[i+1]=color[1];rgb[i+2]=color[2];}
  base={rgb,width:c.width,height:c.height};canvas={width:c.width,height:c.height,color:c.color};
 }else{base=await source(sharp,plan.base,roots);canvas={width:base.width,height:base.height};}
 if(!Array.isArray(plan.cells)||!plan.cells.length)fail('Explicit source cell inventory required');
 const cells=new Map();for(const c of plan.cells){if(!c.id||cells.has(c.id))fail('Unique cell IDs required');if(!rect(c.rect,base.width,base.height))fail('Cell rectangle outside base');if([...cells.values()].some(q=>overlap(c.rect,q.rect)))fail('Source cells overlap');cells.set(c.id,c);}
 if(!Array.isArray(plan.replacements)||!plan.replacements.length)fail('Explicit cell replacements required');
 const ids=new Set(),staged=[];
 for(const r of plan.replacements){
  if(!cells.has(r.cellId)||ids.has(r.cellId))fail('Replacement requires a unique declared cell');ids.add(r.cellId);
  if(r.opacity!==undefined||r.targetRect!==undefined||r.fit!==undefined)fail('No opacity, target override or image warp allowed');
  if(typeof r.matte!=='string'||!/^#[a-fA-F0-9]{6}$/.test(r.matte))fail('Explicit opaque contain matte required');
  const s=await source(sharp,r.source,roots),target=cells.get(r.cellId).rect;
  if(!rect(r.sourceRect,s.width,s.height))fail('Source rectangle outside replacement');
  const scale=Math.min(target.width/r.sourceRect.width,target.height/r.sourceRect.height);if(scale>1)fail('Replacement would upscale source');
  const region=crop(s.rgb,s.width,r.sourceRect);
  const patch=await sharp(region,{raw:{width:r.sourceRect.width,height:r.sourceRect.height,channels:3}}).resize(target.width,target.height,{fit:'contain',background:r.matte,kernel:'lanczos3',withoutEnlargement:true}).removeAlpha().raw().toBuffer();
  if(patch.length!==target.width*target.height*3)fail('Contained patch dimensions mismatch');
  staged.push({r,s,target,scale,patch});
 }
 if(newCanvas&&ids.size!==cells.size)fail('New canvas requires a source-bound replacement for every declared cell');
 const pixels=Buffer.from(base.rgb);
 for(const {patch,target}of staged)for(let y=0;y<target.height;y++)patch.copy(pixels,((target.top+y)*base.width+target.left)*3,y*target.width*3,(y+1)*target.width*3);
 const before=createHash('sha256'),after=createHash('sha256');
 for(let y=0;y<base.height;y++){
  const intervals=staged.map(p=>p.target).filter(r=>y>=r.top&&y<r.top+r.height).sort((a,b)=>a.left-b.left);let left=0;
  for(const r of [...intervals,{left:base.width,width:0}]){const start=(y*base.width+left)*3,end=(y*base.width+r.left)*3;before.update(base.rgb.subarray(start,end));after.update(pixels.subarray(start,end));left=r.left+r.width;}
 }
 const untouchedBefore=before.digest('hex'),untouchedAfter=after.digest('hex');if(untouchedBefore!==untouchedAfter)fail('Untouched pixels changed');
 const cellHashes=[...cells.values()].map(c=>({id:c.id,rect:c.rect,replaced:ids.has(c.id),beforePixelSha256:newCanvas?null:hash(crop(base.rgb,base.width,c.rect)),afterPixelSha256:hash(crop(pixels,base.width,c.rect))}));
 if(cellHashes.some(c=>!c.replaced&&c.beforePixelSha256!==c.afterPixelSha256))fail('Unchanged cell pixels changed');
 const bytes=await sharp(pixels,{raw:{width:base.width,height:base.height,channels:3}}).png().toBuffer();
 const receipt={schemaVersion:1,operation:plan.operation,canvas,base:plan.base??null,basePixelSha256:newCanvas?null:hash(base.rgb),foundation:newCanvas?'explicit-opaque-canvas':'source-bound-opaque-base',cells:cellHashes,replacements:staged.map(({r,s,target,scale,patch})=>({cellId:r.cellId,source:r.source,sourceDimensions:{width:s.width,height:s.height},sourceRect:r.sourceRect,targetRect:target,fit:'contain',matte:r.matte,scale,kernel:'lanczos3',upscaled:false,patchPixelSha256:hash(patch)})),untouchedPixels:newCanvas?{applicable:false,reason:'New canvas; source preservation is bound per replacement, no inherited page pixels'}:{beforeSha256:untouchedBefore,afterSha256:untouchedAfter,unchanged:true},page:{path:destinations[0],sha256:hash(bytes)},planSha256:hash(Buffer.from(JSON.stringify(plan))),helperSha256:hash(await readFile(fileURLToPath(import.meta.url))),sharpVersion:sharp.versions.sharp,generatedArtwork:false,alphaPlaneSemantics:false,visualReview:'pending',humanApproval:false};
 const receiptBytes=Buffer.from(JSON.stringify(receipt,null,2)+'\n');
 for(const [p,b]of [[destinations[0],bytes],[destinations[1],receiptBytes]]){await mkdir(dirname(p),{recursive:true});await writeFile(p,b,{flag:'wx'});}
 return receipt;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [site,planFile]=process.argv.slice(2);if(!site||!planFile)fail('Usage: node assemble_static_page.mjs <site-root> <plan.json>');
 const sharp=createRequire(resolve(site,'package.json'))('sharp');console.log(JSON.stringify(await assemble(sharp,JSON.parse(await readFile(planFile,'utf8')))));
}
