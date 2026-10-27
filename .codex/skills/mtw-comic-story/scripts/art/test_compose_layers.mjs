import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { compose, hash } from './compose_layers.mjs';
const [site,out]=process.argv.slice(2);if(!site||!out)throw Error('Usage: node test_compose_layers.mjs <site-root> <fresh-external-fixtures-dir>');
const sharp=createRequire(resolve(site,'package.json'))('sharp');
await mkdir(out,{recursive:true});
const bg=await sharp({create:{width:12,height:8,channels:3,background:'#182a32'}}).png().toBuffer();
const patch=await sharp({create:{width:3,height:3,channels:4,background:'#dd0033'}}).png().toBuffer();
const fg=await sharp({create:{width:12,height:8,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:patch,left:0,top:0}]).png().toBuffer();
const opaque=await sharp({create:{width:12,height:8,channels:4,background:'#dd0033'}}).png().toBuffer();
const empty=await sharp({create:{width:12,height:8,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).png().toBuffer();
for(const [name,bytes] of [['bg',bg],['fg',fg],['opaque',opaque],['empty',empty]])await writeFile(resolve(out,name+'.png'),bytes,{flag:'wx'});
const results=[];let count=0;
const rect=(left,top,width,height)=>({left,top,width,height});
function plan(){const n=count++;return {outputRoot:out,canvas:{width:12,height:8},background:{path:resolve(out,'bg.png'),sha256:hash(bg)},planes:[{id:'solid-human',role:'humans',source:{path:resolve(out,'fg.png'),sha256:hash(fg)},regions:[{id:'box-a',source:rect(0,0,3,3),target:rect(5,2,3,3)}],output:resolve(out,'plane-'+n+'.png')}],compositeOutput:resolve(out,'composite-'+n+'.png'),receiptOutput:resolve(out,'receipt-'+n+'.json')};}
async function rejects(name,mutate,pattern){const p=plan();mutate(p);const paths=[...p.planes.map(x=>x.output),p.compositeOutput,p.receiptOutput];const exists=async path=>{try{await access(path);return true;}catch(e){if(e.code!=='ENOENT')throw e;return false;}};const before=await Promise.all(paths.map(exists));await assert.rejects(()=>compose(sharp,p),pattern);assert.deepEqual(await Promise.all(paths.map(exists)),before);results.push({name,status:'pass'});}
const valid=plan();const receipt=await compose(sharp,valid);
const pixels=await sharp(valid.planes[0].output).ensureAlpha().raw().toBuffer();
assert.equal(pixels[(2*12+5)*4+3],255);assert.equal(pixels[3],0);
assert.equal(receipt.humanApproval,false);assert.equal(receipt.visualReview,'pending');
assert.equal(hash(await readFile(resolve(out,'fg.png'))),hash(fg));
assert.equal(receipt.planes[0].sha256,hash(await readFile(valid.planes[0].output)));
results.push({name:'Actual fixed rectangle compositing preserves source, exact alpha/receipt and no visual approval',status:'pass'});
await rejects('stale source hash',p=>p.planes[0].source.sha256='0'.repeat(64),/Source hash/);
await rejects('source rectangle overflow',p=>p.planes[0].regions[0].source.left=11,/Region outside/);
await rejects('target rectangle overflow',p=>p.planes[0].regions[0].target.left=11,/Region outside/);
await rejects('overlapping box target regions',p=>p.planes[0].regions.push({id:'b',source:rect(0,0,3,3),target:rect(6,3,3,3)}),/overlap/);
await rejects('duplicate region identity',p=>p.planes[0].regions.push({...p.planes[0].regions[0],target:rect(0,0,3,3)}),/Unique region/);
await rejects('duplicate plane identity',p=>p.planes.push({...p.planes[0],output:resolve(out,'duplicate.png')}),/Unique plane/);
await rejects('opaque RGBA is not a foreground',p=>p.planes[0].source={path:resolve(out,'opaque.png'),sha256:hash(opaque)},/empty and visible/);
await rejects('invisible plane rejected',p=>p.planes[0].source={path:resolve(out,'empty.png'),sha256:hash(empty)},/empty and visible/);
await rejects('RGB non-alpha rejected',p=>p.planes[0].source=p.background,/genuine alpha/);
await rejects('unregistered unequal canvas',p=>{p.canvas.width=13;p.background=p.planes[0].source;},/Background canvas/);
await rejects('unknown foreground role',p=>p.planes[0].role='background',/Unknown foreground/);
await rejects('output-root escape',p=>p.compositeOutput=resolve(out,'../escaped.png'),/escapes/);
await rejects('output aliases rejected',p=>p.compositeOutput=p.planes[0].output,/distinct/);
await rejects('existing receipt blocks ALL output writes',p=>p.receiptOutput=valid.receiptOutput,/Refusing overwrite/);
const rawPlan=plan();rawPlan.planes[0].regions=[];const rawReceipt=await compose(sharp,rawPlan);assert.equal(hash(await readFile(rawPlan.planes[0].output)),hash(fg));assert.equal(rawReceipt.planes[0].registered,false);results.push({name:'Already registered same-canvas source bytes preserved exactly',status:'pass'});
// The exact default and explicit identity opacity preserve native PNG bytes.
const identityPlan=plan();identityPlan.planes[0].regions=[];identityPlan.planes[0].opacity=1;
const identityReceipt=await compose(sharp,identityPlan);
assert.deepEqual(await readFile(identityPlan.planes[0].output),fg);
assert.equal(identityReceipt.planes[0].opacity,1);assert.equal(identityReceipt.planes[0].appliedTransform.alpha.operation,'identity');
results.push({name:'Explicit opacity 1 with no registration preserves exact native PNG bytes',status:'pass'});
// Known RGB and mixed native alpha exercise multiplication and nearest-integer rounding.
const rgba=Buffer.alloc(12*8*4);
for(const [index,pixel] of [[0,[90,110,130,0]],[1,[120,30,50,128]],[2,[70,80,90,250]],[3,[15,25,35,255]]])rgba.set(pixel,index*4);
const mixed=await sharp(rgba,{raw:{width:12,height:8,channels:4}}).png().toBuffer();
await writeFile(resolve(out,'mixed.png'),mixed,{flag:'wx'});
for(const opacity of [0.78,0]) {
 const p=plan();p.planes[0].regions=[];p.planes[0].role='agents';p.planes[0].opacity=opacity;
 p.planes[0].source={path:resolve(out,'mixed.png'),sha256:hash(mixed)};
 const native=await sharp(mixed).ensureAlpha().raw().toBuffer(),r=await compose(sharp,p),actual=await sharp(p.planes[0].output).ensureAlpha().raw().toBuffer();
 for(let j=0;j<actual.length;j++)assert.equal(actual[j],j%4===3?Math.round(native[j]*opacity):native[j]);
 assert.equal(hash(await readFile(resolve(out,'mixed.png'))),hash(mixed));
 assert.equal(r.planes[0].sourceAlpha.buckets['240-254'],1);assert.equal(r.planes[0].sourceAlpha.opaque,1);
 assert.deepEqual(r.planes[0].alignedAlpha,r.planes[0].sourceAlpha);
 assert.equal(r.planes[0].appliedTransform.alpha.rgbChanged,false);assert.equal(r.planes[0].sha256,hash(await readFile(p.planes[0].output)));
 assert.equal(r.planes[0].outputAlpha.maximum,Math.round(255*opacity));
 results.push({name:'Opacity '+opacity+' changes only alpha, retains native alpha distribution/source hash and exact transformed output hash',status:'pass'});
}
const registeredOpacity=plan();registeredOpacity.planes[0].role='agents';registeredOpacity.planes[0].opacity=0.78;
const registeredReceipt=await compose(sharp,registeredOpacity),registeredPixels=await sharp(registeredOpacity.planes[0].output).ensureAlpha().raw().toBuffer();
assert.equal(registeredPixels[(2*12+5)*4+3],199);assert.equal(registeredPixels[3],0);
assert.equal(registeredReceipt.planes[0].sourceAlpha.maximum,255);assert.equal(registeredReceipt.planes[0].alignedAlpha.maximum,255);assert.equal(registeredReceipt.planes[0].outputAlpha.maximum,199);
results.push({name:'Alpha multiplication follows actual fixed-coordinate alignment',status:'pass'});
for(const bad of [-0.01,1.01,NaN,Infinity,-Infinity,'0.78',null])await rejects('invalid opacity '+String(bad),p=>p.planes[0].opacity=bad,/opacity must be finite/);
// Independent actor IDs with repeated roles allow inspected interleaved depth.
const bluePatch=await sharp({create:{width:3,height:3,channels:4,background:'#0000ff'}}).png().toBuffer();
const blue=await sharp({create:{width:12,height:8,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:bluePatch,left:0,top:0}]).png().toBuffer();
await writeFile(resolve(out,'blue.png'),blue,{flag:'wx'});
const depth=plan(),rear=depth.planes[0];rear.id='rear-human';
depth.planes.push({...rear,id:'digital-between',role:'agents',opacity:0.78,source:{path:resolve(out,'blue.png'),sha256:hash(blue)},output:resolve(out,'depth-agent.png')}, {...rear,id:'front-human',regions:[{id:'front-hand',source:rect(0,0,3,3),target:rect(6,2,3,3)}],output:resolve(out,'depth-front.png')});
const depthReceipt=await compose(sharp,depth),depthPixels=await sharp(depth.compositeOutput).ensureAlpha().raw().toBuffer();
assert.deepEqual(depthReceipt.planes.map(p=>p.id),['rear-human','digital-between','front-human']);
const pixel=(x,y)=>Array.from(depthPixels.subarray((y*12+x)*4,(y*12+x)*4+4));
assert.deepEqual(pixel(6,2),[221,0,51,255]); // Solid foreground hand covers agent.
assert.ok(pixel(5,2)[2]>190 && pixel(5,2)[0]<60); // Agent remains above rear human.
assert.equal(hash(await readFile(resolve(out,'fg.png'))),hash(fg));
assert.equal(depthReceipt.humanApproval,false);assert.equal(depthReceipt.visualReview,'pending');
results.push({name:'Distinct individual humans interleave around an agent with actual overlapping pixel depth, source preservation and pending visual review',status:'pass'});
const body={schemaVersion:1,checks:results.length,passed:results.filter(x=>x.status==='pass').length,results,fixturesRoot:resolve(out),providerCalls:0,browser:false,productionPixelApproval:false};
await writeFile(resolve(out,'results.json'),JSON.stringify(body,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(body));
