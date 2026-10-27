/** Fixed-coordinate layer registration/composition; never draws or approves artwork. */
import { readFile, writeFile, access, mkdir, realpath } from 'node:fs/promises';
import { resolve, relative, dirname, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = message => { throw Error(message); };
function alphaStats(raw) {
 const buckets={'0':0,'1-63':0,'64-127':0,'128-191':0,'192-239':0,'240-254':0,'255':0};
 let minimumVisible=null,maximum=0;
 for(let j=3;j<raw.length;j+=4) {
  const a=raw[j];buckets[a===0?'0':a<64?'1-63':a<128?'64-127':a<192?'128-191':a<240?'192-239':a<255?'240-254':'255']++;
  if(a>0)minimumVisible=minimumVisible===null?a:Math.min(minimumVisible,a);maximum=Math.max(maximum,a);
 }
 return {empty:buckets['0'],visible:raw.length/4-buckets['0'],intermediate:raw.length/4-buckets['0']-buckets['255'],opaque:buckets['255'],minimumVisible,maximum,buckets};
}
async function rgba(sharp,bytes) { return sharp(bytes).toColourspace('srgb').ensureAlpha().raw().toBuffer({resolveWithObject:true}); }

const within = (root,p) => { const r=relative(root,p); return r==='' || (!r.startsWith('..')&&!isAbsolute(r)); };
const rect = (r,w,h) => r && ['left','top','width','height'].every(k=>Number.isInteger(r[k])) && r.left>=0 && r.top>=0 && r.width>0 && r.height>0 && r.left+r.width<=w && r.top+r.height<=h;
const overlap = (a,b) => a.left<b.left+b.width && b.left<a.left+a.width && a.top<b.top+b.height && b.top<a.top+a.height;
async function guardedOutput(root,p) {
 p=resolve(p); if (!within(root,p)) fail('Output escapes declared outputRoot');
 let ancestor=dirname(p);
 for (;;) { try { ancestor=await realpath(ancestor);break; } catch(e) { if(e.code!=='ENOENT')throw e;const next=dirname(ancestor);if(next===ancestor)throw e;ancestor=next; } }
 if(!within(root,ancestor))fail('Output ancestor escapes outputRoot');
 try { await access(p);fail('Refusing overwrite: '+p); } catch(e) { if(e.code!=='ENOENT')throw e; }
 return p;
}
async function source(sharp,item) {
 if(!item || !/^[a-f0-9]{64}$/.test(item.sha256))fail('Exact source sha256 required');
 const bytes=await readFile(item.path);if(hash(bytes)!==item.sha256)fail('Source hash mismatch');
 const meta=await sharp(bytes).metadata();return {bytes,meta};
}
export async function compose(sharp,plan) {
 const root=await realpath(resolve(plan.outputRoot));
 const c=plan.canvas;if(!c || !Number.isInteger(c.width)||!Number.isInteger(c.height)||c.width<=0||c.height<=0)fail('Positive integer canvas required');
 if(!Array.isArray(plan.planes)||!plan.planes.length)fail('Explicit foreground planes required');
 const ids=new Set(), outputs=[];
 for(const p of plan.planes) {
  if(typeof p.id!=='string'||!p.id.trim()||ids.has(p.id))fail('Unique plane IDs required');ids.add(p.id);
  if(!['humans','agents','props','light'].includes(p.role))fail('Unknown foreground role');
  const opacity=p.opacity===undefined?1:p.opacity;
  if(typeof opacity!=='number'||!Number.isFinite(opacity)||opacity<0||opacity>1)fail('Plane opacity must be finite 0..1');
  outputs.push(await guardedOutput(root,p.output));
 }
 outputs.push(await guardedOutput(root,plan.compositeOutput));outputs.push(await guardedOutput(root,plan.receiptOutput));
 if(new Set(outputs).size!==outputs.length)fail('Output paths must be distinct');
 const bg=await source(sharp,plan.background);
 if(bg.meta.width!==c.width||bg.meta.height!==c.height)fail('Background canvas mismatch');
 const staged=[];const entries=[];
 for(let i=0;i<plan.planes.length;i++) {
  const p=plan.planes[i],s=await source(sharp,p.source);
  if(!s.meta.hasAlpha)fail('Foreground must have genuine alpha');
  const native=await rgba(sharp,s.bytes),sourceAlpha=alphaStats(native.data);
  if(!sourceAlpha.empty||!sourceAlpha.visible)fail('Foreground must contain both empty and visible alpha pixels');
  if(!Array.isArray(p.regions))fail('Explicit regions array required');
  const comps=[],regionIds=new Set();
  for(const r of p.regions) {
   if(!r.id||regionIds.has(r.id))fail('Unique region IDs required');regionIds.add(r.id);
   if(!rect(r.source,s.meta.width,s.meta.height)||!rect(r.target,c.width,c.height))fail('Region outside canvas');
   if(!['centre','north','south','east','west','northeast','northwest','southeast','southwest'].includes(r.position??'centre'))fail('Unknown contain position');
   if(p.regions.some(q=>q!==r&&overlap(r.target,q.target)))fail('Target regions overlap');
   const bytes=await sharp(s.bytes).extract(r.source).resize(r.target.width,r.target.height,{fit:'contain',position:r.position??'centre',background:{r:0,g:0,b:0,alpha:0},kernel:'lanczos3'}).png().toBuffer();
   comps.push({input:bytes,left:r.target.left,top:r.target.top});
  }
  let bytes=s.bytes;
  if(p.regions.length)bytes=await sharp({create:{width:c.width,height:c.height,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(comps).png().toBuffer();
  else if(s.meta.width!==c.width||s.meta.height!==c.height)fail('Unregistered foreground canvas mismatch');
  const opacity=p.opacity===undefined?1:p.opacity;
  const aligned=await rgba(sharp,bytes),alignedAlpha=alphaStats(aligned.data);
  let outputAlpha=alignedAlpha;
  if(opacity!==1) {
   const adjusted=Buffer.from(aligned.data);
   for(let j=3;j<adjusted.length;j+=4)adjusted[j]=Math.round(adjusted[j]*opacity);
   outputAlpha=alphaStats(adjusted);
   bytes=await sharp(adjusted,{raw:{width:aligned.info.width,height:aligned.info.height,channels:4}}).png().toBuffer();
  }
  staged.push({path:outputs[i],bytes});
  entries.push({id:p.id,role:p.role,source:p.source,sourceDimensions:{width:s.meta.width,height:s.meta.height},sourceAlpha,alignedAlpha,outputAlpha,opacity,appliedTransform:{alignment:p.regions,alpha:{operation:opacity===1?'identity':'multiply-alpha',opacity,rounding:'nearest-integer',rgbChanged:false}},regions:p.regions,output:outputs[i],sha256:hash(bytes),registered:!!p.regions.length,upscaledRegions:p.regions.filter(r=>r.target.width>r.source.width||r.target.height>r.source.height).map(r=>r.id)});
 }
 const composite=await sharp(bg.bytes).composite(staged.map(x=>({input:x.bytes,left:0,top:0}))).png().toBuffer();
 staged.push({path:outputs.at(-2),bytes:composite});
 const receipt={schemaVersion:1,operation:'fixed-coordinate-layer-composition',generatedOrRedrawnPixels:false,canvas:c,background:plan.background,planes:entries,composite:{path:outputs.at(-2),sha256:hash(composite)},sharpVersion:sharp.versions.sharp,kernel:'lanczos3',planSha256:hash(Buffer.from(JSON.stringify(plan))),helperSha256:hash(await readFile(fileURLToPath(import.meta.url))),visualReview:'pending',humanApproval:false};
 staged.push({path:outputs.at(-1),bytes:Buffer.from(JSON.stringify(receipt,null,2)+'\n')});
 for(const x of staged){await mkdir(dirname(x.path),{recursive:true});await writeFile(x.path,x.bytes,{flag:'wx'});}
 return receipt;
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 const [site,planFile]=process.argv.slice(2);if(!site||!planFile)fail('Usage: node compose_layers.mjs <site-root> <plan.json>');
 const sharp=createRequire(resolve(site,'package.json'))('sharp');
 console.log(JSON.stringify(await compose(sharp,JSON.parse(await readFile(planFile,'utf8')))));
}
