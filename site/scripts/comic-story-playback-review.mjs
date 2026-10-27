// Execute only after the shared native/source window is explicitly released.
import { createRequire, registerHooks } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { freezeDevNotifications } from './comic-review-dev-notifications.mjs';
import { reviewText } from './comic-review-fetch.mjs';
import {motionChannels,motionPeakBeat,sampleMotionDom,channelMetrics,sameMotion,reducedStatic,readingSampleKind,readingSampleVerdict,targetVisible,playbackTerminalSummary,waitVoiceJump} from './comic-playback-motion.mjs';
import { comicViewWindowErrors, viewRasterHeader } from './comic-view-contract.mjs';
import { checkActiveArt, captureActiveArt } from './comic-story-framing-check.mjs';
import { verifyDelivery } from '../../.codex/skills/mtw-comic-story/scripts/playback_bindings.mjs';
const args=process.argv.slice(2),value=(name,fallback)=>{const i=args.indexOf(name);if(i<0)return fallback;if(!args[i+1]||args[i+1].startsWith('--'))throw Error('Missing '+name+' value');return args[i+1];};
const known=new Set(['--repo','--origin','--config','--out','--check-inputs','--help','--sizes','--slugs']);for(let i=0;i<args.length;i++){if(!known.has(args[i]))throw Error('Unknown argument '+args[i]);if(!['--check-inputs','--help'].includes(args[i]))i++;}
if(args.includes('--help')){console.log('node scripts/comic-story-playback-review.mjs [--origin http://localhost:8789] [--config wiki/comics-library/playback-review-inputs.json] [--out <external-transport-root>] [--repo <repository>] [--check-inputs] [--sizes desktop,phone] [--slugs home,agentic-systems,traditional-systems,data-migrations,demo]\nRun native capture only in the serialized browser slot. --check-inputs is browser-free. --out queues exact canonical destinations without catalog writes.');process.exit(0);}
const root=path.resolve(value('--repo',path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'))),outputRoot=value('--out',null)?path.resolve(value('--out',null)):root;
const configPath=path.resolve(root,value('--config','wiki/comics-library/playback-review-inputs.json')),configBytes=fs.readFileSync(configPath),config=JSON.parse(configBytes.toString('utf8').replace(/^\uFEFF/,''));
if(config.schemaVersion!==1||!Array.isArray(config.masterAliases)||!Array.isArray(config.phoneTargets)||!config.subjectBindings)throw Error('Invalid playback review input schema');
const repoFile=relative=>{if(typeof relative!=='string'||path.isAbsolute(relative)||/^[a-z]:/i.test(relative)||relative.startsWith('\\\\')||relative.split(/[\\/]/).includes('..'))throw Error('Unsafe repository input '+relative);return path.join(root,relative);};
const require = createRequire(root + '/site/package.json');
const { deferReview } = await import(pathToFileURL(path.join(root,'site/scripts/comic-story-library.mjs')));
const digest = b => crypto.createHash('sha256').update(b).digest('hex');
const stable = v => JSON.stringify(v, (_, x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(k => [k, x[k]])) : x);
const launchRuntime = fs.readFileSync(root + '/site/public/scripts/comic-story.js');
const expectedCatalogVoices=JSON.parse(fs.readFileSync(repoFile('wiki/comics-library/provider-voices.json'),'utf8')).voices.length;
registerHooks({ resolve(spec, ctx, next) { try { return next(spec, ctx); } catch (e) { if (/^\.\.?\//.test(spec) && !/\.[a-z]+$/i.test(spec)) return next(spec + '.ts', ctx); throw e; } } });
const { comicIssues } = await import(pathToFileURL(root + '/site/src/data/comic-stories/index.ts'));
const { demoComic } = await import(pathToFileURL(root + '/site/src/data/comic-stories/demo.ts'));
const diskEntries = comicIssues.map(i => ({ slug: i.slug, story: i.story })).concat({ slug: 'demo', story: demoComic });
function reviewSelection(sizes,slugs,entries){
 const parse=(text,allowed,label)=>{const values=text.split(',');if(!values.length||values.some(v=>!allowed.includes(v))||new Set(values).size!==values.length)throw Error('Invalid '+label+' selection '+text);return values;};
 const widths=parse(sizes,['desktop','phone'],'sizes'),selectedSlugs=parse(slugs,entries.map(e=>e.slug),'slugs');return {sizes:widths,slugs:selectedSlugs,full:widths.length===2&&selectedSlugs.length===entries.length};
}
const selection=reviewSelection(value('--sizes','desktop,phone'),value('--slugs',diskEntries.map(e=>e.slug).join(',')),diskEntries),selectedEntries=diskEntries.filter(e=>selection.slugs.includes(e.slug));

const phoneTargets=config.phoneTargets,subjectBindings=config.subjectBindings,deviceAssets=config.deviceAssets||[],deviceOperations=config.deviceOperations||[];
const framingHelperPath=repoFile('site/scripts/comic-story-framing-check.mjs'),framingHelperBytes=fs.readFileSync(framingHelperPath);
const {sourceToScreen}=await import(pathToFileURL(framingHelperPath));
const subjectScenes=subjectBindings.stories.flatMap(e=>e.scenes.map(a=>({...a,slug:diskEntries.find(i=>i.story.id===e.storyId)?.slug,scope:'annotated subjects only; manual full-scene review separate'}))).concat((subjectBindings.additionalDeviceScenes||[]).map(a=>({...a,id:a.scene,slug:diskEntries.find(i=>i.story.id===a.storyId)?.slug,panels:[{imageId:a.deviceObservation.imageId,protectedSubjects:a.deviceObservation.protectedSubjectUpdates||[],deviceReview:a.deviceObservation.deviceReview}],scope:'target-device supplement only; no complete scene subject coverage'})));
const imageManifestPath=root+'/wiki/image-library/manifest.json',imageManifestBytes=fs.readFileSync(imageManifestPath),imageManifest=JSON.parse(imageManifestBytes);
const styleBindings=config.styles.map(relative=>{const file=repoFile(relative);return {file,sha256:digest(fs.readFileSync(file))};});
const masterBindings=diskEntries.flatMap(({slug,story})=>story.scenes.map(scene=>{
 const alias=config.masterAliases.find(a=>a.story===story.id&&a.scene===scene.id);if(!alias)throw Error('Missing canonical master alias '+story.id+'/'+scene.id);
 const record=imageManifest.records.find(r=>r.id===alias.recordId),selected=record?.treatments?.[alias.treatment],file=selected?repoFile('wiki/image-library/'+selected.path):null,bytes=file&&fs.existsSync(file)?fs.readFileSync(file):null;
 const device=deviceAssets.find(i=>i.story===story.id&&i.scene===scene.id&&i.newArt===scene.art),op=device&&deviceOperations.find(o=>o.path.endsWith('/'+story.id+'.ts')&&o.sceneId===scene.id&&o.field==='art'&&o.value===scene.art);
 return {slug,scene:scene.id,art:scene.art,recordId:record?.id,treatment:alias.treatment,master:file,sha256:bytes?digest(bytes):null,declaredSha256:selected?.sha256,bytes:bytes?.length||0,aliasArtMatches:alias.art===scene.art,...(device?{deviceLineage:{operation:op,selectedVersion:device.version,canonicalTarget:device.target,expectedSha256:device.masterSha256,treatmentTarget:selected?.path,lineageMatches:!!op&&selected?.path===device.target.replace(/^wiki\/image-library\//,'')&&selected?.sha256===device.masterSha256},derivatives:device.encoding.outputs.map(o=>({target:o.target,file:repoFile(o.target),sha256:o.sha256,exists:fs.existsSync(repoFile(o.target)),matches:fs.existsSync(repoFile(o.target))&&digest(fs.readFileSync(repoFile(o.target)))===o.sha256}))}:{})};
}));
const inputChecks=[{name:'canonical scene aliases exactly cover authored inventory',pass:config.masterAliases.length===masterBindings.length&&new Set(config.masterAliases.map(a=>a.story+'/'+a.scene)).size===config.masterAliases.length&&masterBindings.every(m=>m.aliasArtMatches&&m.sha256&&m.sha256===m.declaredSha256)},{name:'selected device art and derivative identities',pass:deviceAssets.length===masterBindings.filter(m=>m.deviceLineage).length&&masterBindings.filter(m=>m.deviceLineage).every(m=>m.deviceLineage.lineageMatches&&m.derivatives.every(d=>d.matches))},{name:'phone target story/scene/panel and authored art binding',pass:phoneTargets.every(t=>{const e=diskEntries.find(e=>e.story.id===t.story),p=e?.story.scenes.find(s=>s.id===t.scene)?.panels.find(p=>p.img===t.panelImageId);return !!p&&(!t.requiresPhoneArt||stable(p.phoneArt)===stable(t.value));})},{name:'subject annotation master and scene identity',pass:subjectScenes.every(a=>{const m=masterBindings.find(m=>m.slug===a.slug&&m.scene===a.id);return m?.art===a.art&&m?.sha256===a.masterSha256;})}];
if(config.masterAliases.some(a=>a.deliveryBinding))inputChecks.push({name:'exact public delivery and selected canonical/encoder lineage',pass:config.masterAliases.every(a=>{try{return verifyDelivery(root,imageManifest,a);}catch{return false;}})});
// Snapshot current exact reader integration bytes, including all responsive variants and saved room beds.
const diskMedia=new Map(),directories=new Set(diskEntries.flatMap(e=>[root+'/site/public/comic/'+e.story.id,...e.story.scenes.filter(s=>s.art?.startsWith('/comic/')).map(s=>root+'/site/public'+path.posix.dirname(s.art))]).concat(root+'/site/public/comic/sound',...diskEntries.flatMap(e=>e.story.scenes.flatMap(s=>s.panels.flatMap(p=>(p.balloons||[]).filter(b=>b.speech?.src?.startsWith('/')).map(b=>root+'/site/public'+path.posix.dirname(b.speech.src)))))));
for(const dir of directories)if(fs.existsSync(dir))for(const name of fs.readdirSync(dir)){const file=path.join(dir,name);if(fs.statSync(file).isFile()&&/\.(avif|webp|png|svg|mp3|wav|ogg|m4a)$/i.test(name))diskMedia.set('/'+path.relative(root+'/site/public',file).replace(/\\/g,'/'),{file,sha256:digest(fs.readFileSync(file))});}
if(args.includes('--check-inputs')){console.log(JSON.stringify({stage:'browser-free current repository readback',runtimeSha256:digest(launchRuntime),configSha256:digest(configBytes),masters:masterBindings.length,deviceMasters:masterBindings.filter(m=>m.deviceLineage).length,derivatives:masterBindings.flatMap(m=>m.derivatives||[]).length,phoneTargets:phoneTargets.length,subjectScenes:subjectScenes.length,checks:inputChecks},null,2));if(inputChecks.some(c=>!c.pass))process.exitCode=1;process.exit(process.exitCode||0);}
function reviewPaths(repo,out,run){const base=out||repo;return {images:path.join(base,'wiki/image-library/assets/experiments/comic-b/visible-playback',run),records:path.join(base,'wiki/image-library/records/comics-visible-playback-'+run),audio:path.join(base,'wiki/soundtrack-library/assets/score-review',run)};}
function writeOnce(file,data){fs.writeFileSync(file,data,{encoding:typeof data==='string'?'utf8':undefined,flag:'wx'});}
const run = new Date().toISOString().replace(/[:.]/g, '-');
const outputs=reviewPaths(root,outputRoot,run),imageDir=outputs.images;fs.mkdirSync(imageDir,{recursive:true});
const recordDir=outputs.records;
fs.mkdirSync(recordDir, { recursive: true });
const report = { run, origin:value('--origin','http://localhost:8789'), started: new Date().toISOString(), pid: process.pid, checks: [], frames: [], errors: [], bindings: [], motion: [], phoneTargets: [], readingFrames: [], introPlacements: [], subjectInspections: [], subjectReviewFlags: [], ambience: [], loadedMedia: [], executingStyles: [], masterBindings, audio: [], speechReview: [], homeVoiceDemo: [], roomOutcomes: [], scope:selection, preflight: [], browserStarted:false, videos:[], inputs: { runtimeSha256: digest(launchRuntime), configPath,configSha256:digest(configBytes),framingHelperPath,framingHelperSha256:digest(framingHelperBytes),annotatedScenes:subjectBindings.stories.reduce((n,e)=>n+e.scenes.length,0),deviceOnlySupplementScenes:(subjectBindings.additionalDeviceScenes||[]).length,styleBindings,imageManifestSha256:digest(imageManifestBytes),phoneTargets: phoneTargets.length, phoneScenes: new Set(phoneTargets.map(t => t.story + '/' + t.scene)).size }, listening: 'pending; recording and transport do not establish audible quality', closed: false };
const captures = [];
check(masterBindings.every(m=>m.sha256&&m.sha256===m.declaredSha256),'current canonical master bindings',{masters:masterBindings.length,missing:masterBindings.filter(m=>!m.sha256||m.sha256!==m.declaredSha256)});
check(masterBindings.filter(m=>m.deviceLineage).every(m=>m.deviceLineage.lineageMatches&&m.derivatives.every(o=>o.matches)),'exact four device-art lineage and derivative identity',masterBindings.filter(m=>m.deviceLineage));
async function soundOn(page){await pause(page,false);await page.mouse.move(180,160);let s=await page.evaluate(()=>MTWComicStory.status());if(!s.muted&&(!s.audioLive||s.score.ctx!=='running'))await page.locator('.cs-tag__mute').click();if((await page.evaluate(()=>MTWComicStory.status())).muted)await page.locator('.cs-tag__mute').click();await page.waitForFunction(()=>MTWComicStory.status().audioLive&&!MTWComicStory.status().muted&&MTWComicStory.status().score.ctx==='running',null,{timeout:5000});}
async function letters(page,scene,imageIds){return page.evaluate(({id,ids})=>{const node=[...document.querySelectorAll('.cs-page')].find(n=>n.dataset.scene===id),source=JSON.parse(document.getElementById('comic-story').textContent).scenes.find(s=>s.id===id),norm=t=>t.replace(/\s+/g,' ').trim();return ids.map(imageId=>{const index=source.panels.findIndex(p=>p.img===imageId),panel=node.querySelector('.cs-panel[data-box="'+index+'"]');return {imageId,index,balloons:source.panels[index].balloons.map(expected=>{const own=[...panel.querySelectorAll('.cs-bw')],candidates=source.panels[index].inset?own.concat([...node.querySelectorAll('.cs-bw')]):own,b=candidates.find(b=>norm(b.querySelector('.cs-b')?.getAttribute('aria-label')||'')===norm(expected.text));return {text:expected.text,found:!!b,opacity:b?+getComputedStyle(b).opacity:0,untyped:b?[...b.querySelectorAll('.cs-u')].filter(u=>+getComputedStyle(u).opacity<.99).length:null};})};});},{id:scene.id,ids:imageIds});}
function check(pass, name, details) { report.checks.push({ pass: !!pass, name, details }); if (!pass) report.errors.push({ name, details }); }

async function waitReady(page){try{await page.waitForFunction(() => window.MTWComicStory && MTWComicStory.status().loaded && document.fonts.status === 'loaded' && !document.querySelector('.cs-loader:not(.is-done):not([hidden])'), null, {timeout:30000});}catch(error){const actual=await page.evaluate(()=>({url:location.href,status:window.MTWComicStory?.status(),fonts:document.fonts.status,loaders:[...document.querySelectorAll('.cs-loader')].map(n=>({class:n.className,hidden:n.hidden,text:n.textContent}))}));throw Error('Comic readiness deadline '+JSON.stringify(actual)+' '+String(error));}}
async function roomOutcome(page,room,label){
 let deadline=null;try{await page.waitForFunction(r=>{const status=MTWComicStory.status().score.roomAssets?.[r]?.status;return !!status&&status!=='loading';},room,{timeout:10000});}catch(error){deadline=String(error);}
 const actual=await page.evaluate(()=>({url:location.href,status:MTWComicStory.status()})),asset=actual.status.score.roomAssets?.[room],terminal=['decoded-loop','fallback-timeout','fallback-error','fallback-invalid','fallback-cancelled'].includes(asset?.status),result={label,room,asset,deadline,...actual};report.roomOutcomes.push(result);check(terminal,label+' terminal saved-room state',result);return result;
}
async function pause(page, value) { await page.mouse.move(180,160); if ((await page.evaluate(() => MTWComicStory.status())).userPaused !== value) await page.locator('.rl-pause').click(); await page.waitForFunction(v => MTWComicStory.status().userPaused === v, value, { timeout: 5000 }); }
async function recordMix(page, milliseconds, time) {
  try { await page.waitForFunction(() => { const s=MTWComicStory.status(), r=window.__comicAudioRoute?.(); return !s.userPaused&&!s.muted&&s.audioLive&&s.score.ctx==='running'&&r?.ctx==='running'&&r.masterGain>0; }, null, {timeout:5000}); }
  catch(error){const actual=await page.evaluate(()=>({status:MTWComicStory.status(),route:window.__comicAudioRoute?.(),contexts:window.__comicCaptureContexts?.()}));throw Error('Native post-EQ recording route not ready '+JSON.stringify(actual)+' '+String(error));}
  return page.evaluate(({milliseconds,time})=>window.__recordComicMix(milliseconds,time),{milliseconds,time});
}
async function seek(page, story, beat) { await page.evaluate(t => MTWComicStory.seek(t), beat * 60 / story.bpm); await waitReady(page); await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); }
async function crop(page,scene,index,channel){return page.evaluate(sampleMotionDom,{id:scene.id,index,channel});}


const playbackActiveAliasCache=new Map();
async function readPlaybackActiveAlias(src) {
  const url=new URL(src,report.origin);
  if(url.origin!==new URL(report.origin).origin)throw Error('Selected art is outside the owned review origin');
  if(!playbackActiveAliasCache.has(url.href))playbackActiveAliasCache.set(url.href,(async()=>{
    const response=await fetch(url);if(!response.ok)throw Error('Selected art response '+response.status);
    const bytes=Buffer.from(await response.arrayBuffer()),header=viewRasterHeader(bytes);
    if(!header)throw Error('Selected art header unavailable');
    return {sha256:crypto.createHash('sha256').update(bytes).digest('hex'),dimensions:[header.width,header.height]};
  })());
  return playbackActiveAliasCache.get(url.href);
}
async function inspectSubjects(page,size,slug,scene,ids,kind){
 const source=subjectScenes.find(a=>a.slug===slug&&a.id===scene.id),master=masterBindings.find(m=>m.slug===slug&&m.scene===scene.id);
 if(!source)return {status:'unannotated',scope:'no numeric subject claim; manual review remains required'};
 const sourceSpecific=source.panels?.some(p=>p.activeArtSources?.length),bound=sourceSpecific||(source.art===scene.art&&source.masterSha256===master?.sha256);
 if(!bound){const result={size,slug,scene:scene.id,kind,status:'annotation-binding-mismatch',source,master};report.subjectInspections.push(result);check(false,size+'-'+slug+'-'+scene.id+' current subject master binding',result);return result;}
 const activeGeometry=await captureActiveArt(()=>page.evaluate(()=>MTWComicStory.geometry()),src=>readPlaybackActiveAlias(src));
 const activeSources=ids.map(id=>{const active=activeGeometry.panels.find(p=>p.scene===scene.id&&p.imageId===id)?.activeArt,audit=checkActiveArt(active,source.panels.find(p=>p.imageId===id));check(audit.errors.length===0,size+'-'+slug+'-'+id+' actual selected source/hash/dimensions/quality',audit);return {imageId:id,active,audit};});
 const inspection=await page.evaluate(({source,scene,ids,activeSources})=>{
  const node=[...document.querySelectorAll('.cs-page')].find(n=>n.dataset.scene===scene.id),rect=n=>{const r=n.getBoundingClientRect();return[r.x,r.y,r.width,r.height]},inRect=(x,y,r)=>x>=r[0]&&y>=r[1]&&x<=r[0]+r[2]&&y<=r[1]+r[3],visible=n=>{for(let p=n;p;p=p.parentElement){const c=getComputedStyle(p);if(+c.opacity<.2||c.visibility!=='visible'||c.display==='none')return false;}return true;};
  const shapes=[...node.querySelectorAll('.cs-paper > path,.cs-paper > rect,.cs-paper > [data-part] > path')].filter(visible),glyphs=[...node.querySelectorAll('.cs-u')].filter(visible).flatMap(n=>[...n.getClientRects()].map(r=>[r.x,r.y,r.width,r.height]));
  return ids.map(id=>{const index=scene.panels.findIndex(p=>p.img===id),annotation=source.panels.find(p=>p.imageId===id);if(!annotation)return {imageId:id,status:'unannotated panel'};const panel=node.querySelector('.cs-panel[data-box="'+index+'"]'),selected=activeSources.find(a=>a.imageId===id);if(!panel||!selected?.active||selected.audit.errors.length||!selected.audit.expected)return {imageId:id,status:'missing current source binding'};
   const frame=rect(panel),cr=selected.active.cropRect,bs=selected.active.backgroundSize,bp=selected.active.backgroundPosition,cs=selected.active.cssSize;
   if([...bs,...bp,...cs].some(v=>!Number.isFinite(v)))return {imageId:id,status:'unsupported computed background geometry',backgroundSize:bs,backgroundPosition:bp};
   const annotations=(selected.audit.expected.protectedSubjects||[]).map(a=>({...a,category:'protected subject'})).concat((selected.audit.expected.deviceReview?.devices||[]).map(a=>({...a,category:'device-only surface'})));
   const subjects=annotations.map(a=>{const screen=window.__comicSourceToScreen(a.sourcePixelRect,selected.audit.expected.sourceDimensions,bs,bp,cr,cs);let clipped=0,outsideViewport=0,covered=0,lettering=0,occludedByPanel=0;for(let iy=0;iy<10;iy++)for(let ix=0;ix<10;ix++){const x=screen[0]+(ix+.5)*screen[2]/10,y=screen[1]+(iy+.5)*screen[3]/10;if(!inRect(x,y,frame)){clipped++;continue;}if(!inRect(x,y,[0,0,innerWidth,innerHeight])){outsideViewport++;continue;}const top=document.elementsFromPoint(x,y).map(n=>n.closest('.cs-panel')).find(n=>n&&node.contains(n)&&visible(n)&&inRect(x,y,rect(n)));if(top&&top!==panel)occludedByPanel++;if(shapes.some(n=>{const m=n.getScreenCTM();return m&&n.isPointInFill(new DOMPoint(x,y).matrixTransform(m.inverse()));}))covered++;if(glyphs.some(r=>inRect(x,y,r)))lettering++;}return {...a,screen,sampled:100,clipped,outsideViewport,covered,lettering,occludedByPanel,needsInspection:clipped>5||outsideViewport>0||covered>2||lettering>0||occludedByPanel>2};});
   return {imageId:id,index,status:'sampled',frame,cropRect:cr,backgroundSize:bs,backgroundPosition:bp,cssSize:cs,subjects};});
 },{source,scene,ids,activeSources});
 const result={size,slug,scene:scene.id,kind,status:'sampled',scope:source.scope,annotationSource:source.annotationSource,sourceSize:[source.width,source.height],master:master?{path:master.master,sha256:master.sha256,recordId:master.recordId}:null,activeSources,sourceAnnotations:source.panels,inspection};report.subjectInspections.push(result);
 for(const p of inspection){if(p.status==='missing current source binding'||p.status==='missing crop'||p.status==='unsupported computed background geometry')check(false,size+'-'+slug+'-'+p.imageId+' subject projection geometry',p);for(const a of p.subjects||[])if(a.needsInspection)report.subjectReviewFlags.push({size,slug,scene:scene.id,kind,imageId:p.imageId,...a});}
 return result;
}

function fixed(a,b) { return a.fixed.length === b.fixed.length && a.fixed.every((x,i) => x.transform === b.fixed[i].transform && x.filter === b.fixed[i].filter && x.rect.every((v,j) => Math.abs(v-b.fixed[i].rect[j]) < .5)) && a.frame.every((v,i) => Math.abs(v-b.frame[i]) < .5); }
async function shot(page, filename, fields) { const file=path.join(imageDir,filename+'.png');if(fs.existsSync(file))throw Error('Capture already exists '+file);await page.screenshot({path:file});report.frames.push({file,...fields});captures.push({path:file,title:filename,group:fields.kind?.startsWith('console')?'comic console':'reader playback',note:fields.kind?.startsWith('console')?'Actual canonical console in a fresh native context; visual and listening review remain separate.':'Actual loaded reader; visual and listening review remain separate.'}); }

async function homeVoiceDemoReview(page,size){
 const runtimeStart=pendingRuntimeEvidence.length,home=diskEntries.find(e=>e.slug==='home').story,expected=home.scenes.flatMap(s=>s.panels.flatMap(p=>p.balloons.filter(b=>b.speech).map(b=>({id:b.speech.id,start:(s.b+Math.max(p.at,b.at))*60/home.bpm+.3,src:b.speech.src,characterId:b.speech.characterId})))),entry={size,expected,jumps:[],listening:'pending'};report.homeVoiceDemo.push(entry);
 await page.goto(report.origin+'/comics/home-voice-demo/',{waitUntil:'load'});await page.waitForFunction(()=>document.querySelector('[data-home-voice-review][data-ready]'),null,{timeout:10000});
 const before=await page.evaluate(()=>({iframes:document.querySelectorAll('iframe').length,lines:[...document.querySelectorAll('[data-home-line]')].map(b=>({id:b.dataset.homeLine,start:+b.dataset.start,disabled:b.disabled})),playing:[...document.querySelectorAll('audio')].some(a=>!a.paused),width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));check(before.iframes===0&&!before.playing&&before.lines.length===expected.length&&before.lines.every(b=>b.disabled&&expected.some(e=>e.id===b.id&&Math.abs(e.start-b.start)<1e-8)),'Home voice demo initial exact refs/no autoplay',before);check(before.scrollWidth<=before.width+1,size+' Home voice demo initial horizontal containment',before);await shot(page,size+'-home-voice-demo-lines',{size,kind:'voice-review-controls'});
 await page.locator('[data-load-home]').click();await page.waitForFunction(()=>[...document.querySelectorAll('[data-home-line]')].every(b=>!b.disabled)&&document.querySelector('iframe'),null,{timeout:30000});const frame=page.frames().find(f=>f!==page.mainFrame()&&f.url().includes('/comics/home/'));if(!frame)throw Error('Missing actual shared Home reader frame');const payload=await frame.locator('#comic-story').textContent();const responses=await Promise.all(pendingRuntimeEvidence.slice(runtimeStart));check(stable(JSON.parse(payload))===stable(home)&&responses.length>0&&responses.every(r=>r.matches),'Home voice demo shared reader exact authored payload/runtime',{sha256:digest(payload),responses});
 for(const line of expected){await waitReady(frame);await page.locator('[data-home-line="'+line.id+'"]').click();await waitVoiceJump(frame,line,entry);const actual=await frame.evaluate(()=>MTWComicStory.status());entry.jumps.push({line,actual});check(!actual.userPaused&&!actual.muted&&actual.score.speech.current.id===line.id&&actual.score.speech.current.src===line.src,size+' Home voice demo actual selected speech jump '+line.id,{line,actual});await shot(page,size+'-home-voice-demo-'+line.id,{size,kind:'voice-review-reader',identity:line});await frame.locator('.rl-pause').click();}
 await frame.evaluate(()=>document.dispatchEvent(new Event('astro:before-swap')));check((await frame.evaluate(()=>MTWComicStory.status())).score.ctx==='closed','Home voice demo reader audio cleanup',null);
}

async function boundedNative(promise, milliseconds, label) {
  let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(label+' deadline '+milliseconds+'ms')),milliseconds);})]);}finally{clearTimeout(timer);}
}
async function responseIdentity(response, size, expected, file) {
  const identity={size,url:response.url(),status:response.status(),diskSha256:typeof expected==='string'?expected:digest(expected),...(file?{file}:{})};
  try{const bytes=await boundedNative(response.body(),15000,'Actual response body '+identity.url);return {...identity,sha256:digest(bytes),matches:identity.status===200&&digest(bytes)===identity.diskSha256};}
  catch(error){return {...identity,matches:false,bodyAvailable:false,error:String(error)};}
}
async function disableNativeCache(context,page) {
  const session=await boundedNative(context.newCDPSession(page),5000,'Native CDP session');
  await boundedNative(session.send('Network.enable'),5000,'Native Network.enable');
  await boundedNative(session.send('Network.setCacheDisabled',{cacheDisabled:true}),5000,'Native cache disable');
  return session;
}

async function finalizeReviewVideo(item){
 await boundedNative(item.context.close(),30000,'Native video context close');
 const sourcePath=await boundedNative(item.video.path(),30000,'Native video path');
 await boundedNative(item.video.saveAs(item.saved),30000,'Native finalized video save');
 const bytes=fs.readFileSync(item.saved);return {size:item.size,file:item.saved,sourcePath,sha256:digest(bytes),bytes:bytes.length,status:'finalized native capture; visual review pending'};
}

async function preflightNativeOrigins() {
  const endpoints=[{name:'reader',url:report.origin+'/comics/home/',marker:'id="comic-story"'},{name:'runtime',url:report.origin+'/scripts/comic-story.js',sha256:digest(launchRuntime)}];
  const settled=await Promise.allSettled(endpoints.map(async endpoint=>{const bytes=Buffer.from(await reviewText(endpoint.url));return {...endpoint,status:200,sha256:digest(bytes),pass:endpoint.marker?bytes.toString('utf8').includes(endpoint.marker):digest(bytes)===endpoint.sha256};}));
  report.preflight=settled.map((result,index)=>result.status==='fulfilled'?result.value:{...endpoints[index],pass:false,error:String(result.reason)});for(const item of report.preflight)check(item.pass,'before-browser local '+item.name+' reachable/current',item);if(report.preflight.some(item=>!item.pass))throw Error('Required localhost preflight failed; native browser was not launched');
}

let browser;
const nativeVideos=[],rawVideoPaths=new Set();
const pendingMediaEvidence=[],pendingRuntimeEvidence=[];
try {
  for(const c of inputChecks)check(c.pass,c.name,null);if(inputChecks.some(c=>!c.pass))throw Error('Current playback input binding failed before browser launch');
  await preflightNativeOrigins();
  const {chromium}=require('playwright');
  browser = await chromium.launch({ channel: 'chrome', headless: false, args: ['--mute-audio'] });report.browserStarted=true;
  for (const [size, viewport] of [['desktop', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844 }]].filter(([size])=>selection.sizes.includes(size))) {
    const context = await browser.newContext({ viewport, hasTouch: size === 'phone', isMobile: size === 'phone', reducedMotion: 'no-preference', serviceWorkers: 'block', recordVideo: { dir: recordDir, size: viewport } });
    await freezeDevNotifications(context, report.origin);
    const page = await context.newPage();nativeVideos.push({size,context,video:page.video(),saved:path.join(recordDir,'native-'+size+'.webm')}); await disableNativeCache(context,page); await page.addInitScript({content:'window.__comicSourceToScreen='+sourceToScreen.toString()+';'}); page.setDefaultTimeout(30000); page.setDefaultNavigationTimeout(30000);
    let mediaResponses=[], actualResponses = []; page.on('response', r => {const pathname=new URL(r.url()).pathname;if(diskMedia.has(pathname)){const expected=diskMedia.get(pathname),promise=responseIdentity(r,size,expected.sha256,expected.file);mediaResponses.push(promise);pendingMediaEvidence.push(promise);}if(pathname==='/scripts/comic-story.js'){const promise=responseIdentity(r,size,launchRuntime);actualResponses.push(promise);pendingRuntimeEvidence.push(promise);}});
    await page.addInitScript(() => {
      const Native = window.AudioContext || window.webkitAudioContext;
      if (!Native || !window.MediaRecorder) return;
      const contexts = [], connect = AudioNode.prototype.connect;
      function Tracked(...args) { const ctx = new Native(...args); contexts.push({ ctx, destination: ctx.createMediaStreamDestination(), scored: false, master: null, music: null }); return ctx; }
      Tracked.prototype = Native.prototype; window.AudioContext = Tracked;
      if (window.webkitAudioContext) window.webkitAudioContext = Tracked;
      AudioNode.prototype.connect = function (...args) {
        const result = connect.apply(this, args), item = contexts.find(c => c.ctx === this.context);
        if (item && this instanceof GainNode && args[0] instanceof BiquadFilterNode && args[0].type==='highpass' && args[0].frequency.value===35) item.master=this;
        if (item && this instanceof MediaElementAudioSourceNode) item.music = args[0];
        if (item && args[0] === this.context.destination) {
          connect.call(this, item.destination);
          if (this instanceof AnalyserNode) item.scored = true;
        }
        return result;
      };
      window.__comicAudioRoute = () => { const item=contexts.findLast(c=>c.scored); return item ? {ctx:item.ctx.state,masterGain:item.master?.gain?.value ?? null,musicGain:item.music?.gain?.value ?? null,outputGain:item.master?.gain && item.music?.gain ? item.master.gain.value*item.music.gain.value : null} : null; };
      window.__comicCaptureContexts = () => contexts.map(item=>({ctx:item.ctx.state,scored:item.scored,master:!!item.master,music:!!item.music}));
      window.__recordComicMix = async (milliseconds, time) => {
        const item = contexts.findLast(c => c.scored && c.ctx.state === 'running');
        if (!item) throw new Error('No running comic master analyser '+JSON.stringify({status:MTWComicStory.status(),contexts:window.__comicCaptureContexts()}));

        const mime = ['audio/webm;codecs=opus','audio/webm'].find(t => MediaRecorder.isTypeSupported(t)); if (!mime) throw Error('Unsupported native recording');
        const chunks = [], samples = [], recorder = new MediaRecorder(item.destination.stream, { mimeType: mime }); let timer;
        recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
        const stopped = new Promise((resolve,reject) => { recorder.onstop=resolve;recorder.onerror=e=>reject(Error('Recorder error '+e.error?.message)); });
        const sample = () => samples.push({at:performance.now(),status:MTWComicStory.status(),routing:window.__comicAudioRoute(),eq:[...document.querySelectorAll('.rl-eq i')].map(n=>Number(n.style.getPropertyValue('--level')))});
        recorder.start();
        try { MTWComicStory.seek(time); sample();timer=setInterval(sample,80);await new Promise(r=>setTimeout(r,milliseconds));sample();recorder.stop();await Promise.race([stopped,new Promise((_,reject)=>setTimeout(()=>reject(Error('Recorder stop deadline')),2000))]); }
        finally { clearInterval(timer); if (recorder.state !== 'inactive') recorder.stop(); }
        const blob = new Blob(chunks,{type:mime}), bytes = new Uint8Array(await blob.arrayBuffer()); let binary='';
        for(let i=0;i<bytes.length;i+=8192) binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
        const decoded=await item.ctx.decodeAudioData(await blob.arrayBuffer());let peak=0,squares=0,nearFullScale=0,count=0;
        for(let channel=0;channel<decoded.numberOfChannels;channel++)for(const value of decoded.getChannelData(channel)){peak=Math.max(peak,Math.abs(value));squares+=value*value;nearFullScale+=Math.abs(value)>=.999?1:0;count++;}
        return {base64:btoa(binary),mime,bytes:bytes.length,samples,waveform:{peak,rms:Math.sqrt(squares/Math.max(1,count)),nearFullScale,count,durationSeconds:decoded.duration,note:'Decoded recording sample metric; listening and subjective balance remain pending.'}};
      };
    });
    page.on('pageerror', e => report.errors.push(String(e)));
    if(selection.slugs.includes('home')){try{await homeVoiceDemoReview(page,size);}catch(error){report.errors.push({homeVoiceDemoError:String(error),size,stack:error.stack});}}
    for (const {slug,story:diskStory} of selectedEntries) {
      actualResponses=[]; await page.emulateMedia({reducedMotion:'no-preference'});
      await page.goto(report.origin + '/comics/' + slug + '/', { waitUntil: 'load' });
      await page.waitForFunction(() => window.MTWComicStory && !document.querySelector('.cs-loader:not(.is-done)'), null, { timeout: 30000 });
      const payload = await page.locator('#comic-story').textContent(), story=JSON.parse(payload), responses=await Promise.all(actualResponses);
      const binding={size,slug,payloadSha256:digest(payload),retimedDiskStorySha256:digest(stable(diskStory)),servedStorySha256:digest(stable(story)),runtimeResponses:responses}; report.bindings.push(binding);
      writeOnce(path.join(recordDir,size+'-'+slug+'-served-story.json'),payload);
      const styles=await page.evaluate(()=>[...document.styleSheets].map(s=>{try{return {url:s.href,rules:[...s.cssRules].map(r=>r.cssText).join('\n')}}catch(e){return {url:s.href,inaccessible:String(e)}}}));report.executingStyles.push({size,slug,styles:styles.map(s=>({...s,rulesSha256:s.rules?digest(s.rules):null}))});
      check(responses.length>0 && responses.every(r=>r.matches), size+'-'+slug+' actual loaded response runtime identity',binding);
      check(stable(story)===stable(diskStory),size+'-'+slug+' current retimed disk/payload identity',binding);
      if(!responses.length || responses.some(r=>!r.matches) || stable(story)!==stable(diskStory)) throw Error('Loaded source mismatch before sampling '+slug);
      check(!(await page.evaluate(()=>MTWComicStory.status().still)),size+'-'+slug+' animation mode',null);
      await soundOn(page); await pause(page,true);
      check(await page.evaluate(w=>innerWidth===w,viewport.width),size+'-'+slug+' actual viewport width',{viewport});

      let motionCount=0;
      for (const scene of story.scenes) {
        await seek(page,story,scene.b); const plan=await page.evaluate(id=>MTWComicStory.reviewFrames(id),scene.id);if(!plan)throw Error('No actual timing plan');
        const viewWindows=comicViewWindowErrors(scene,plan);check(!viewWindows.length,size+'-'+slug+'-'+scene.id+' actual ordered-view usable windows',{mode:plan.mode,errors:viewWindows,plan});
        if(viewWindows.length)throw Error('Unreachable or incomplete actual ordered-view windows: '+viewWindows.join('; '));
        for(const frame of plan.frames){
          await seek(page,story,frame.beat);const lettering=await letters(page,scene,frame.panelImageIds),visible=[];
          for(const imageId of frame.panelImageIds){const index=scene.panels.findIndex(p=>p.img===imageId);visible.push(await crop(page,scene,index));}
          const subjects=await inspectSubjects(page,size,slug,scene,frame.panelImageIds,'completed-lettering');const reviewType=readingSampleKind(scene,frame),result={size,slug,scene:scene.id,frame,lettering,visible,subjects,reviewType,...(reviewType==='quick-montage-overlap'?{qualification:'Silent montage overlap; previous art remains visible after next sheet focus/audio begins. This is not an exclusive completed-lettering window.'}:{})};report.readingFrames.push(result);
          if(scene.layers?.length)check(visible.every(c=>c.artMode==='layers'),size+'-'+slug+'-'+scene.id+' actual authored planes installed',visible.map(c=>({artMode:c.artMode,decoded:c.decoded}))); 
          const verdict=readingSampleVerdict(scene,frame,lettering,visible);
          if(reviewType==='quick-montage-overlap')check(verdict.pass,size+'-'+slug+'-'+scene.id+'-'+frame.frame+' qualified silent montage overlap visible',result);
          else check(verdict.pass,size+'-'+slug+'-'+scene.id+'-'+frame.frame+' completed lettering sheet',result);
          const intros=frame.panelImageIds.flatMap(imageId=>{const index=scene.panels.findIndex(p=>p.img===imageId);return scene.panels[index].balloons.map((b,balloon)=>({b,balloon})).filter(o=>o.b.characterIntro).map(o=>({size,slug,scene:scene.id,imageId,index,balloon:o.balloon,text:o.b.text}));});report.introPlacements.push(...intros);
          await shot(page,size+'-'+slug+'-'+scene.id+'-reading-'+frame.frame,{size,slug,scene:scene.id,kind:'completed-lettering',frame:frame.frame,sheet:frame.sheet,panels:frame.panelImageIds,intros,opening:scene===story.scenes[0]&&frame.panelImageIds.includes(scene.panels[0].img),demoFallback:slug==='demo'});
        }
        for(const[index,panel] of scene.panels.entries()){
          await seek(page,story,scene.b+panel.at+.02);const actual=await page.evaluate(()=>MTWComicStory.status()),expected=panel.room??scene.room??'none';report.ambience.push({size,slug,scene:scene.id,index,imageId:panel.img,expected,authored:panel.room!=null,actual});
          check(actual.score.room===expected&&actual.score.focus?.panel===panel.img,size+'-'+slug+'-'+panel.img+' actual box ambience',{expected,actual:actual.score});
        }
        for(const[index,panel] of scene.panels.entries()){
          const channels=motionChannels(panel,scene,plan.mode);motionCount+=channels.length;
          if(!channels.length)continue;
          const frame=plan.frames.find(f=>f.panelImageIds.includes(panel.img));if(!frame)throw Error('Missing motion target in measured plan '+panel.img);
          const ids=new Set(plan.frames.filter(f=>f.sheet===frame.sheet).flatMap(f=>f.panelImageIds)),sameSheet=scene.panels.filter(p=>ids.has(p.img)),local=sameSheet.findIndex(p=>p.img===panel.img);
          const fade=frame.panels.find(p=>p.imageId===panel.img).fadeStart-scene.b,stop=Math.min(fade,local+1<sameSheet.length?sameSheet[local+1].at:frame.exitStart-scene.b);
          for(const channel of channels){
            const channelStart=panel.at+(channel.startOffset||0),channelStop=Math.min(stop,channel.stopOffset==null?stop:panel.at+channel.stopOffset),peak=motionPeakBeat(channel.spec,channelStart,channelStop);
            if(peak<=channelStart)throw Error('No finite moving-channel window '+panel.img+'/'+channel.id);
            await seek(page,story,scene.b+channelStart);const before=await crop(page,scene,index,channel);
            await seek(page,story,scene.b+peak);const after=await crop(page,scene,index,channel),metrics=channelMetrics(before,after,channel.spec);
            const subjects=await inspectSubjects(page,size,slug,scene,[panel.img],'motion-peak');
            const result={size,slug,scene:scene.id,imageId:panel.img,index,subjects,channel,motion:channel.spec,stop:channelStop,start:channelStart,peak,...metrics,before,after};report.motion.push(result);
            check(targetVisible(after,scene),size+'-'+slug+'-'+panel.img+'-'+channel.id+' actual decoded target/planes visible',result);
            check(metrics.pass,size+'-'+slug+'-'+panel.img+'-'+channel.id+' actual rendered amplitude floor',result);
            check(fixed(before,after),size+'-'+slug+'-'+panel.img+'-'+channel.id+' lettering and borders fixed',{before:before.fixed,after:after.fixed});
            await page.waitForTimeout(160);const frozen=await crop(page,scene,index,channel);
            check(sameMotion(after,frozen),size+'-'+slug+'-'+panel.img+'-'+channel.id+' pause freezes actual compound channel',frozen);
            await seek(page,story,scene.b+channelStart);await seek(page,story,scene.b+peak);const replay=await crop(page,scene,index,channel);
            check(sameMotion(after,replay)&&fixed(after,replay),size+'-'+slug+'-'+panel.img+'-'+channel.id+' exact seek/replay channel sample',replay);
            await shot(page,size+'-'+slug+'-'+scene.id+'-'+index+'-'+channel.id.replace(':','-')+'-motion',{size,slug,scene:scene.id,index,imageId:panel.img,channel:channel.id,kind:'motion-peak',beat:scene.b+peak});
          }
        }
      }
      report.checks.push({pass:true,name:size+'-'+slug+' motion coverage',panels:motionCount});
      if(size==='phone')for(const target of phoneTargets.filter(t=>t.story===story.id)){
        const scene=story.scenes.find(s=>s.id===target.scene),index=scene?.panels.findIndex(p=>p.img===target.panelImageId);
        if(!scene || index<0)throw Error('Missing pending phone target '+target.panelImageId);
        check(!target.requiresPhoneArt || stable(scene.panels[index].phoneArt)===stable(target.value),'phone-'+slug+'-'+target.panelImageId+' current imported phoneArt value',scene.panels[index].phoneArt);
        await seek(page,story,scene.b);const plan=await page.evaluate(id=>MTWComicStory.reviewFrames(id),scene.id),frame=plan.frames.find(f=>f.panelImageIds.includes(target.panelImageId));if(!frame)throw Error('No target lettering window');
        await seek(page,story,frame.beat);const actual=await crop(page,scene,index);
        const lettering=await page.evaluate(({id,index})=>{const p=[...document.querySelectorAll('.cs-page')].find(n=>n.dataset.scene===id)?.querySelector('.cs-panel[data-box="'+index+'"]');return [...p.querySelectorAll('.cs-bw')].map(b=>({text:b.querySelector('.cs-b')?.getAttribute('aria-label'),opacity:+getComputedStyle(b).opacity,untyped:[...b.querySelectorAll('.cs-u')].filter(u=>+getComputedStyle(u).opacity<.99).length}));},{id:scene.id,index});
        check(frame.ready && actual.visible && !actual.occluded && lettering.every(b=>b.opacity>=.99 && !b.untyped),'phone-'+slug+'-'+target.panelImageId+' actual final-lettering target visible',{frame,actual,lettering});
        report.phoneTargets.push({slug,scene:scene.id,imageId:target.panelImageId,frame,actual,lettering,originalManifestSource:target.sourceSha256,reason:target.reason,subjectInspectionRecordedSeparately:true,currentMaster:masterBindings.find(m=>m.slug===slug&&m.scene===scene.id)});
        await shot(page,'phone-'+slug+'-'+scene.id+'-'+index+'-contain',{size,slug,scene:scene.id,index,imageId:target.panelImageId,kind:'phoneArt-final'});
      }

      if(size==='desktop'){
        await seek(page,story,0);await page.mouse.move(180,160);if((await page.evaluate(()=>MTWComicStory.status())).muted)await page.locator('.cs-tag__mute').click();await pause(page,false);
        await page.waitForFunction(()=>MTWComicStory.status().score.ctx==='running' && !MTWComicStory.status().muted,null,{timeout:5000});
        const quiet=story.scenes.find(s=>s.score===0)||story.scenes[0];
        const threat=story.scenes.filter(s=>s.villains?.length).sort((a,b)=>(b.score||0)-(a.score||0))[0] || [...story.scenes].sort((a,b)=>(b.score||0)-(a.score||0))[0];
        const resolution=[...story.scenes].reverse().find(s=>!s.villains?.length)||story.scenes.at(-1);
        const physical=story.scenes.flatMap(s=>s.panels.map(p=>({scene:s,panel:p}))).find(o=>o.panel.sfx?.some(f=>['transit','buzz','ring','paper','keys','click','impact','glass','alarm','door'].includes(f.kind)));
        const samples=[{kind:'opening',scene:story.scenes[0],beat:0},{kind:'quiet',scene:quiet,beat:quiet.b+quiet.panels[0].at},{kind:'threat',scene:threat,beat:threat.b+(threat.panels.find(p=>p.sfx?.length)?.at||threat.panels[0].at)},{kind:'resolution',scene:resolution,beat:resolution.b+(resolution.panels.find(p=>p.sfx?.length)?.at||resolution.panels[0].at)},{kind:'NEXT',scene:null,beat:story.next.b}];
        if(physical)samples.push({kind:'physical',scene:physical.scene,beat:physical.scene.b+physical.panel.at});else check(false,slug+' meaningful physical cue exists',null);
        if(slug==='home'){const opening=story.scenes[0];samples.push({kind:'office-reading',scene:opening,beat:opening.b+opening.panels[1].at});}
        for(const sample of samples){
          await pause(page,true);await seek(page,story,sample.beat);await pause(page,false);
          const recorded=await recordMix(page,3500,sample.beat*60/story.bpm);
          const dir=outputs.audio;fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,slug+'-'+sample.kind+'.webm'),bytes=Buffer.from(recorded.base64,'base64');writeOnce(file,bytes);
          const score=sample.scene?.score ?? story.next.sound?.score,local=sample.scene?sample.beat-sample.scene.b:0,focused=sample.scene?[...sample.scene.panels].reverse().find(p=>p.at<=local):null,room=focused?.room ?? sample.scene?.room ?? story.next.sound?.room;
          const result={slug,kind:sample.kind,scene:sample.scene?.id || 'next',beat:sample.beat,authored:{score,room},file,bytes:bytes.length,sha256:digest(bytes),mime:recorded.mime,catalogStatus:'review mix retained; soundtrack WebM review-evidence adapter pending',waveform:recorded.waveform,focusedPanel:focused?.img,samples:recorded.samples,listening:'pending'};report.audio.push(result);
          check(bytes.length>0 && recorded.samples.some(x=>x.status.audioLive && !x.status.muted && x.status.score.ctx==='running' && x.status.score.routed),slug+'-'+sample.kind+' actual recorded master route',result);
          check(recorded.waveform.nearFullScale===0,slug+'-'+sample.kind+' recorded decoded peak headroom',recorded.waveform);
          check(recorded.samples.every(x=>x.status.score.eq?.highpassHz===35&&x.status.score.eq?.lowShelfDb===-2&&x.status.score.eq?.highShelfDb===-1.5),slug+'-'+sample.kind+' observed shared EQ',recorded.samples.map(x=>x.status.score.eq));
          if(score>0 || room && room!=='none')check(recorded.samples.some(x=>x.eq.some(v=>v>0)),slug+'-'+sample.kind+' actual EQ activity',result);
        }
        await pause(page,true);
      }
      if(slug==='home'){
        const voiced=story.scenes.flatMap(scene=>scene.panels.flatMap(panel=>(panel.balloons||[]).filter(balloon=>balloon.speech).map(balloon=>({scene,panel,balloon,start:(scene.b+Math.max(panel.at,balloon.at))*60/story.bpm+.3}))));
        if(!voiced.length)report.speechReview.push({size,slug,status:'pending; no saved authored speech refs integrated',listening:'pending'});
        const chosen=[];for(const item of voiced){if(chosen.length===4)break;chosen.push(item);}
        for(const item of chosen){
          const clip=item.balloon.speech,identity={id:clip.id,src:clip.src,provider:clip.provider,characterId:clip.characterId,declaredDurationSeconds:clip.durationSeconds};
          await soundOn(page);await pause(page,true);await seek(page,story,(item.start+.05)*story.bpm/60);
          await page.waitForFunction(({src,id})=>{const s=MTWComicStory.status().score.speech;return s?.issues?.some(i=>i.id===id)||s?.assets?.[src]&& !['queued','loading'].includes(s.assets[src].status);},{src:clip.src,id:clip.id},{timeout:10000});
          const prepared=await page.evaluate(()=>MTWComicStory.status().score.speech),issue=prepared?.issues?.find(i=>i.id===clip.id);check(!issue&&prepared?.assets?.[clip.src]?.status==='decoded',size+' Home speech measured local asset ready',{identity,prepared});
          if(issue||prepared?.assets?.[clip.src]?.status!=='decoded'){report.speechReview.push({size,slug,identity,status:'failed readiness/window',prepared,listening:'pending'});continue;}
          check(!prepared.playing,size+' Home paused seek suppresses speech',{identity,prepared});
          await pause(page,false);await page.waitForFunction(id=>MTWComicStory.status().score.speech?.current?.id===id,clip.id,{timeout:3000});
          const live=await page.evaluate(()=>MTWComicStory.status().score.speech);check(live.playing&&live.current?.src===clip.src&&live.current?.provider===clip.provider&&live.current?.characterId===clip.characterId&&live.current.offsetSeconds>=.04,size+' Home actual current speech identity/offset',{identity,live});
          await pause(page,true);const held=await page.evaluate(()=>MTWComicStory.status().score.speech);check(!held.playing&&held.musicDuck===1&&held.ambienceDuck===1,size+' Home paused speech stops/restores',{identity,held});
          await seek(page,story,(item.start+Math.min(.4,clip.durationSeconds*.3))*story.bpm/60);await pause(page,false);await page.waitForFunction(id=>MTWComicStory.status().score.speech?.current?.id===id,clip.id,{timeout:3000});const resumed=await page.evaluate(()=>MTWComicStory.status().score.speech);
          await page.locator('.cs-tag__mute').click();const mutedState=await page.evaluate(()=>MTWComicStory.status());check(mutedState.muted&&!mutedState.score.speech.playing,size+' Home mute stops actual speech',{identity,mutedState});await page.locator('.cs-tag__mute').click();
          if(size==='desktop'){await pause(page,true);await seek(page,story,(item.start+.05)*story.bpm/60);await pause(page,false);const recorded=await recordMix(page,3000,item.start+.05),file=path.join(outputs.audio,'home-speech-'+chosen.indexOf(item)+'.webm'),bytes=Buffer.from(recorded.base64,'base64');fs.mkdirSync(outputs.audio,{recursive:true});writeOnce(file,bytes);report.audio.push({slug,kind:'speech',identity,file,bytes:bytes.length,sha256:digest(bytes),mime:recorded.mime,waveform:recorded.waveform,samples:recorded.samples,listening:'pending'});check(recorded.samples.some(s=>s.status.score.speech?.current?.id===clip.id)&&recorded.waveform.nearFullScale===0,'Home saved speech actual post-EQ recording',{identity,file,waveform:recorded.waveform});}
          report.speechReview.push({size,slug,identity,prepared,live,held,resumed,status:'native lifecycle sampled; human listening/words approval separate',listening:'pending'});await pause(page,true);
        }
      }
      if(slug==='home'){
        const scene=story.scenes[0];for(const[index,expected]of [[0,'street'],[1,'office']]){await seek(page,story,scene.b+scene.panels[index].at+.02);const initial=await page.evaluate(()=>MTWComicStory.status());await page.waitForTimeout(180);const later=await page.evaluate(()=>MTWComicStory.status());check(initial.score.room===expected&&later.score.room===expected&&later.score.focus?.panel===scene.panels[index].img,size+' Home street -> office persistent focus',{index,initial,later});}
      }
      for(const room of Object.keys(story.soundAssets?.rooms||{})){
        const authored=report.ambience.some(a=>a.size===size&&a.slug===slug&&a.expected===room);if(!authored)continue;
        await roomOutcome(page,room,size+'-'+slug+'-'+room); // Terminal fallback is retained honestly; fresh-load recovery below still requires decode.
      }
      actualResponses=[];await page.emulateMedia({reducedMotion:'reduce'});await page.reload({waitUntil:'load'});await waitReady(page);
      const reducedResponses=await Promise.all(actualResponses),reducedPayload=await page.locator('#comic-story').textContent();
      check(reducedResponses.length>0 && reducedResponses.every(r=>r.matches) && stable(JSON.parse(reducedPayload))===stable(diskStory),size+'-'+slug+' reduced reload loaded identity',{runtimeResponses:reducedResponses,payloadSha256:digest(reducedPayload)});
      if(!reducedResponses.length || reducedResponses.some(r=>!r.matches) || stable(JSON.parse(reducedPayload))!==stable(diskStory))throw Error('Reduced reload source identity mismatch');
      check(await page.evaluate(()=>MTWComicStory.status().still),size+'-'+slug+' reduced mode active',null);
      // Reduced channels use this layout's measured plan and the selected source's own plane.
      for(const scene of story.scenes){
        await seek(page,story,scene.b);const reducedPlan=await page.evaluate(id=>MTWComicStory.reviewFrames(id),scene.id);
        if(!reducedPlan)throw Error('No actual reduced timing plan');
        const reducedWindows=comicViewWindowErrors(scene,reducedPlan);if(reducedWindows.length)throw Error('Incomplete reduced ordered-view windows: '+reducedWindows.join('; '));
        for(const[index,panel]of scene.panels.entries())for(const channel of motionChannels(panel,scene,reducedPlan.mode)){
          const frame=reducedPlan.frames.find(f=>f.panelImageIds.includes(panel.img));if(!frame)throw Error('Missing reduced motion window '+panel.img);
          const ids=new Set(reducedPlan.frames.filter(f=>f.sheet===frame.sheet).flatMap(f=>f.panelImageIds)),sameSheet=scene.panels.filter(p=>ids.has(p.img)),local=sameSheet.indexOf(panel),fade=frame.panels.find(p=>p.imageId===panel.img)?.fadeStart;
          const stop=Math.min(fade-scene.b,local+1<sameSheet.length?sameSheet[local+1].at:frame.exitStart-scene.b,channel.stopOffset==null?Infinity:panel.at+channel.stopOffset),start=panel.at+(channel.startOffset||0);
          if(!Number.isFinite(stop)||stop<=start)throw Error('No eligible reduced moving-view window '+channel.id);
          const layer=channel.layerId?(channel.viewId?panel.views.find(v=>v.id===channel.viewId)?.layers?.find(l=>l.id===channel.layerId):scene.layers?.find(l=>l.id===channel.layerId)):null;
          if(channel.layerId&&!layer)throw Error('Missing selected reduced source plane '+channel.id);
          await seek(page,story,scene.b+start+Math.min(1,(stop-start)/2));const reduced=await crop(page,scene,index,channel),alpha=layer?(layer.opacity??1):null;
          check(reducedStatic(reduced)&&(channel.viewId||!scene.layers?.length||reduced.artMode==='layers')&&(alpha==null||Math.abs(reduced.targetOpacity-alpha)<.0001),size+'-'+slug+'-'+panel.img+'-'+channel.id+' actual reduced-motion static/authored alpha',reduced);
        }
      }
      // End reduced moving-plane review.

    }
    if(size==='desktop')for(const room of ['street','office','servers','rain']){
      const target=selectedEntries.flatMap(e=>e.story.scenes.flatMap(s=>s.panels.map(p=>({entry:e,scene:s,panel:p})))).find(t=>(t.panel.room??t.scene.room)===room&&t.entry.story.soundAssets?.rooms?.[room]);
      if(!target)continue; // Room outside explicitly selected story scope.
      const pattern='**/comic/sound/'+room+'-loop-v1.mp3';await page.route(pattern,route=>route.abort());
      for(const phase of ['blocked-fallback','decoded-recovery']){
        actualResponses=[];await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(report.origin+'/comics/'+target.entry.slug+'/',{waitUntil:'load'});await waitReady(page);
        const payload=await page.locator('#comic-story').textContent(),responses=await Promise.all(actualResponses);check(stable(JSON.parse(payload))===stable(target.entry.story)&&responses.length>0&&responses.every(r=>r.matches),'native '+room+' '+phase+' loaded identity',{payloadSha256:digest(payload),responses});
        await soundOn(page);await pause(page,true);await seek(page,target.entry.story,target.scene.b+target.panel.at+.02);
        const outcome=await roomOutcome(page,room,'native '+room+' '+phase);check(outcome.asset?.status===(phase==='blocked-fallback'?'fallback-error':'decoded-loop'),'native '+room+' '+phase+' expected asset branch',outcome);
        const actual=await page.evaluate(()=>MTWComicStory.status());check(actual.score.room===room,'native '+room+' '+phase+' preserves focused room',actual);
        if(phase==='blocked-fallback')await page.unroute(pattern);else{await page.evaluate(()=>document.dispatchEvent(new Event('astro:before-swap')));await page.waitForFunction(()=>MTWComicStory.status().score.ctx==='closed'&&!MTWComicStory.status().audioLive,null,{timeout:5000});check(true,'native '+room+' Astro audio disposal',await page.evaluate(()=>MTWComicStory.status()));}
      }
    }
    const media=await Promise.all(mediaResponses);report.loadedMedia.push(...media);check(media.length>0&&media.every(m=>m.matches),size+' actual loaded integration art/room bytes',media);
    await context.close();
  }
  check(report.motion.length===selectedEntries.reduce((n,e)=>n+e.story.scenes.reduce((a,s)=>a+s.panels.reduce((k,p)=>k+motionChannels(p,s).length,0),0),0)*selection.sizes.length,'selected authored moving channels covered at selected widths',{checked:report.motion.length});
  check(report.ambience.length===selectedEntries.reduce((n,e)=>n+e.story.scenes.reduce((k,s)=>k+s.panels.length,0),0)*selection.sizes.length,'selected authored box ambience sampled at selected widths',{checked:report.ambience.length});
  const expectedIntros=selectedEntries.reduce((n,e)=>n+e.story.scenes.reduce((k,s)=>k+s.panels.reduce((a,p)=>a+p.balloons.filter(b=>b.characterIntro).length,0),0),0)*selection.sizes.length;check(report.introPlacements.length===expectedIntros,'selected introduction placements recorded',{checked:report.introPlacements.length,expected:expectedIntros});
  const expectedPhoneTargets=selection.sizes.includes('phone')?phoneTargets.filter(t=>selectedEntries.some(e=>e.story.id===t.story)).length:0;check(report.phoneTargets.length===expectedPhoneTargets,'selected pending phone targets captured',{checked:report.phoneTargets.length,expected:expectedPhoneTargets});
  check(styleBindings.every(s=>digest(fs.readFileSync(s.file))===s.sha256),'final player/CSS disk snapshot unchanged during serialized native review',styleBindings);
} catch (error) {
  report.errors.push({ harnessError: String(error), stack: error.stack });
} finally {
  for(const item of nativeVideos){try{const result=await finalizeReviewVideo(item);rawVideoPaths.add(path.resolve(result.sourcePath));report.videos.push(result);}catch(error){report.errors.push({videoFinalizationError:String(error),size:item.size});}}
  if(!browser)report.closed=true;
  if(browser){try{await browser.close();report.closed=true;}catch(e){report.errors.push({cleanupError:String(e)});}} report.finished = new Date().toISOString();
  const retainedMedia=await Promise.all(pendingMediaEvidence);report.loadedMedia.push(...retainedMedia.filter(m=>!report.loadedMedia.includes(m)));report.loadedRuntimeResponses=await Promise.all(pendingRuntimeEvidence);
  check(report.loadedMedia.every(m=>m.matches),'all retained actual integration response hashes including interrupted capture',report.loadedMedia);
  const reportFile = path.join(recordDir, 'report.json');
  writeOnce(reportFile,JSON.stringify(report,null,2)+'\n');
  const receipt={reportFile,reportSha256:digest(fs.readFileSync(reportFile)),pending:null,stage:'pending registration; immutable native report'};
  try { if(captures.length)receipt.pending=deferReview(captures,{batch:'comics-visible-playback-'+run.toLowerCase(),reportPath:reportFile,libraryRoot:path.join(outputRoot,'wiki/image-library')}); } catch(e) { receipt.registrationError=String(e);process.exitCode=1; }
  writeOnce(path.join(recordDir,'registration-receipt.json'),JSON.stringify(receipt,null,2)+'\n');
  if(outputRoot!==root){
    const files=[];for(const dir of [imageDir,recordDir,outputs.audio])if(fs.existsSync(dir))for(const name of fs.readdirSync(dir)){const file=path.join(dir,name);if(fs.statSync(file).isFile()&&!rawVideoPaths.has(path.resolve(file))&&!(dir===recordDir&&name.endsWith('.webm')&&!report.videos.some(v=>v.file===file))){const bytes=fs.readFileSync(file),canonical=path.relative(outputRoot,file).replace(/\\/g,'/');files.push({transport:file,canonical,sha256:digest(bytes),bytes:bytes.length});}}
    fs.writeFileSync(path.join(recordDir,'queued-transport.json'),JSON.stringify({schemaVersion:1,status:'queued-transport; not imported or catalog-registered',run,reportSha256:receipt.reportSha256,files,afterImport:'Rebind canonical screenshot/report paths through maintained deferReview, then the serialized review finalizer; retain this original transport report/receipt. Catalog soundtrack score-review mixes as review evidence when the WebM adapter is available; do not classify them as speech or production. Visual review and listening remain separate.'},null,2)+'\n',{encoding:'utf8',flag:'wx'});
  }
  console.log(JSON.stringify(playbackTerminalSummary(report,reportFile)));
}
if(report.errors.length)process.exitCode=1;
