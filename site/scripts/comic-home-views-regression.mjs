// Current Home (14 Oct rebuild) schema/encoded sources. Native review remains separate.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';import {execFileSync} from 'node:child_process';import {pathToFileURL,fileURLToPath} from 'node:url';
import {comicViewErrors,comicViewAssetErrors,viewRasterHeader} from './comic-view-contract.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),candidate=path.resolve(process.argv[2]||path.join(here,'../src/data/comic-stories/home.ts')),reference=path.resolve(process.argv[3]||path.join(here,'..')),repo=path.resolve(reference,'..');
registerHooks({resolve(s,c,next){if(s==='./retime')return next(pathToFileURL(path.join(reference,'src/data/comic-stories/retime.ts')).href,c);try{return next(s,c);}catch(e){if(/^\.\.?\//.test(s)&&!s.endsWith('.ts'))return next(s+'.ts',c);throw e;}}});
const {homeComic}=await import(pathToFileURL(candidate));const results=[],agentPaths=new Set(),AGENTS=['codex','claude','rogue'];
function test(name,fn){try{fn();results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.message});}}
const box=a=>Array.isArray(a)&&a.length===4&&a.every(Number.isFinite)&&a[2]>0&&a[3]>0&&a[0]+a[2]<=1+1e-6&&a[1]+a[3]<=1+1e-6;
test('every box has its art: a bound canonical source or a crop of its page master; views ordered per media',()=>{
 for(const s of homeComic.scenes){assert.deepEqual(comicViewErrors(s,homeComic),[],s.id);for(const p of s.panels){
  if(p.staticArt)assert(p.staticArt.canonicalSource?.path&&box(p.staticArt.ar),'Unbound art '+p.img);
  else assert(s.art&&box(p.ar),'No page-master crop '+p.img);
  for(const media of ['desktop','phone']){
   const vs=(p.views||[]).filter(v=>!v.media||v.media===media);if(!vs.length)continue;assert.equal(vs[0].at,0,p.img);
   for(let i=1;i<vs.length;i++)assert(vs[i].at>vs[i-1].at,'Unordered views '+p.img);
   for(const v of vs)assert(v.canonicalSource?.path,'Unbound view '+p.img+'/'+v.id);
  }
 }}
});
test('every actual view/delivery has encoded dimensions, fresh canonical SHA/catalog and source receipt',()=>{
 const errors=homeComic.scenes.flatMap(s=>comicViewAssetErrors(s,path.join(reference,'public')).map(error=>s.id+': '+error));assert.deepEqual(errors,[]);
});
test('agents sit on their own projection planes with genuine alpha; physical plates never project',()=>{
 let count=0;
 for(const s of homeComic.scenes)for(const p of s.panels)for(const v of p.views||[])for(const layer of v.layers||[]){
  const m=(v.layerMotion||[]).find(m=>m.layerId===layer.id);
  if(layer.role!=='agents'){assert.notEqual(m?.preset,'projection','Physical plane projects '+p.img);continue;}
  count++;assert(AGENTS.includes(layer.id),'Human on agent plane '+p.img+'/'+layer.id);
  assert.equal(m?.preset,'projection',p.img);assert.equal(m.fabrication,true,p.img);
  assert(layer.canonicalSource?.path,'Unbound agent '+p.img);agentPaths.add(path.join(repo,layer.canonicalSource.path));
 }
 assert(count,'Home needs actual agent planes');
 const py='import json,sys;from PIL import Image;out=[]\nfor p in json.loads(sys.stdin.read()):\n im=Image.open(p).convert("RGBA");a=im.getchannel("A");out.append({"path":p,"extrema":a.getextrema(),"bbox":a.getbbox()})\nprint(json.dumps(out))';
 const rows=JSON.parse(execFileSync('python',['-c',py],{input:JSON.stringify([...agentPaths]),encoding:'utf8'}));
 for(const r of rows){assert.equal(r.extrema[0],0,'No genuine transparent silhouette '+r.path);assert(r.extrema[1]>=200,'Faint ghost agent interior '+r.path);assert(r.bbox,'Empty agent '+r.path);}
});
test('encoded headers reject unsupported/truncated containers',()=>{
 const p=homeComic.scenes.flatMap(s=>s.panels).find(p=>p.staticArt?.src),bytes=fs.readFileSync(path.join(reference,'public',p.staticArt.src)),h=viewRasterHeader(bytes);assert(h.width>0&&h.height>0);
 for(const bad of [Buffer.from('bad file'),bytes.subarray(0,12)])assert.throws(()=>viewRasterHeader(bad));
});
test('each page master fallback is an actual encoded WebP',()=>{
 for(const s of homeComic.scenes){
  if(s.artFormats)assert(s.artFormats.includes('webp'),s.id);
  const bytes=fs.readFileSync(path.join(reference,'public',s.art+'-1600.webp'));
  assert.equal(bytes.toString('ascii',0,4),'RIFF',s.id);assert.equal(bytes.toString('ascii',8,12),'WEBP',s.id);
  assert(viewRasterHeader(bytes).width>0,s.id);
 }
});
console.log(JSON.stringify({stage:'source/schema/decoded-alpha/encoded-header only; native fit, motion and hearing separate',candidate,passed:results.filter(r=>r.pass).length,total:results.length,results},null,2));if(results.some(r=>!r.pass))process.exitCode=1;
