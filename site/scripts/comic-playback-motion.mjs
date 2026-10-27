export const movingPresets = new Set(['push','drift-left','drift-right','light','shadow','projection','sprout']);
export function motionChannels(panel,scene,mode) {
 const out=[];
 if(panel.motion&&movingPresets.has(panel.motion.preset)&&panel.motion.strength!==0)out.push({id:'panel',spec:panel.motion});
 for(const spec of panel.layerMotion||[])if(movingPresets.has(spec.preset)&&(spec.preset==='sprout'||spec.strength!==0)){
  if(!scene.layers?.some(l=>l.id===spec.layerId))throw Error('Missing authored moving layer '+spec.layerId);
  // Ineligible and retained independent floors are deliberate static channels.
  if(spec.preset==='sprout'&&spec.floorIndex!=null&&((spec.activeFloors&&!spec.activeFloors.includes(spec.floorIndex))||spec.retainedFloors?.includes(spec.floorIndex)||scene.layers.find(l=>l.id===spec.layerId).opacity===0))continue;
  out.push({id:'layer:'+spec.layerId,layerId:spec.layerId,spec:spec.fabrication===true?{...spec,planeOpacity:scene.layers.find(l=>l.id===spec.layerId).opacity??1}:spec.floorIndex==null?spec:{...spec,planeOpacity:scene.layers.find(l=>l.id===spec.layerId).opacity??1}});
 }
 const layeredViews=(panel.views||[]).filter(v=>v.layers?.length&&v.layerMotion?.length);
 if(layeredViews.length){
  if(!['page','desktop','phone'].includes(mode))throw Error('Layered-view motion review requires current layout');
  const media=mode==='phone'?'phone':'desktop',eligible=(panel.views||[]).filter(v=>!v.media||v.media===media);
  for(const [i,view]of eligible.entries())for(const spec of view.layerMotion||[]){
   if(!movingPresets.has(spec.preset)||(spec.preset!=='sprout'&&spec.strength===0))continue;
   const layer=view.layers?.find(l=>l.id===spec.layerId);if(!layer)throw Error('Missing authored moving view layer '+spec.layerId);
   if(spec.preset==='sprout'&&spec.floorIndex!=null&&((spec.activeFloors&&!spec.activeFloors.includes(spec.floorIndex))||spec.retainedFloors?.includes(spec.floorIndex)||layer.opacity===0))continue;
   out.push({id:'view:'+view.id+':layer:'+spec.layerId,viewId:view.id,layerId:spec.layerId,startOffset:view.at,stopOffset:eligible[i+1]?.at,spec:spec.fabrication===true?{...spec,planeOpacity:layer.opacity??1}:spec.floorIndex==null?spec:{...spec,planeOpacity:layer.opacity??1}});
  }
 }
 if(new Set(out.map(c=>c.id)).size!==out.length)throw Error('Duplicate authored motion channel');
 return out;
}
export function motionPeakBeat(spec,start,stop) {
 const span=Math.max(2,Math.min(8,Number(spec.beats)||(spec.floorIndex!=null?8:4)));
 if(spec.preset==='sprout'&&spec.floorIndex!=null)return Math.min(start+span*spec.floorIndex/(spec.floors||8)+.002,stop-.002);
 return Math.min(start+span/(['light','shadow','projection'].includes(spec.preset)?2:1),stop-.002);
}
export async function sampleMotionDom({id,index,channel}) {
 const pageNode=[...document.querySelectorAll('.cs-page')].find(n=>n.dataset.scene===id),panel=pageNode?.querySelector('.cs-panel[data-box="'+index+'"]');
 if(channel?.viewId&&panel?.dataset.viewId!==channel.viewId)throw Error('Expected selected actual layered view '+channel.viewId);
 if(channel?.viewId){const began=Date.now();while(panel.dataset.viewMode==='loading'){if(Date.now()-began>15000)throw Error('Selected view decode deadline '+channel.viewId);await new Promise(resolve=>setTimeout(resolve,50));}if(panel.dataset.viewId!==channel.viewId||panel.dataset.viewMode!=='ready')throw Error('Selected layered view unavailable '+channel.viewId+': '+(panel.dataset.viewError||panel.dataset.viewMode));}
 const root=channel?.viewId?panel.querySelector('.cs-ordered-view'):panel;
 const crops=[...root?.querySelectorAll('.cs-crop')||[]],c=channel?.layerId?crops.find(n=>n.dataset.layerId===channel.layerId):crops[0];
 if(!c)throw Error('Missing actual crop '+id+'/'+index+'/'+(channel?.id||'reading'));
 const target=channel?.id==='panel'?(panel.querySelector('.cs-crop-stack')||c):c;
 const rect=n=>{const r=n.getBoundingClientRect();return [r.x,r.y,r.width,r.height];};
 const cs=getComputedStyle(c),url=cs.backgroundImage.match(/^url\(["']?(.*?)["']?\)$/)?.[1];if(!url)throw Error('Missing loaded background');
 window.__cropDecodes||={};window.__cropDecodes[url]||=new Promise((resolve,reject)=>{
  const im=new Image(),started=performance.now(),diagnostic=reason=>({reason,scene:id,index,url,elapsedMs:performance.now()-started,complete:im.complete,naturalWidth:im.naturalWidth,naturalHeight:im.naturalHeight}),timer=setTimeout(()=>reject(Error('Crop decode deadline '+JSON.stringify(diagnostic('deadline')))),15000);
  im.onload=async()=>{try{await im.decode();clearTimeout(timer);if(!im.naturalWidth||!im.naturalHeight)throw Error('Zero decoded crop dimensions');resolve({url,width:im.naturalWidth,height:im.naturalHeight,elapsedMs:performance.now()-started});}catch(e){clearTimeout(timer);reject(Error('Crop decode failed '+JSON.stringify(diagnostic(String(e)))));}};
  im.onerror=()=>{clearTimeout(timer);reject(Error('Crop load failed '+JSON.stringify(diagnostic('load error'))));};im.src=url;
 });
 const decoded=await window.__cropDecodes[url],chain=[];
 for(let n=target;n&&n!==panel&&n!==panel.querySelector('.cs-panel__art');n=n.parentElement){const s=getComputedStyle(n);chain.push({class:n.className,layerId:n.dataset.layerId||null,rect:rect(n),transform:s.transform,filter:s.filter,opacity:+s.opacity,clipPath:s.clipPath});}
 const t=getComputedStyle(target),matrix=new DOMMatrixReadOnly(t.transform==='none'?undefined:t.transform),world=rect(target);
 let revealOpacity=1;for(let n=panel.querySelector('.cs-panel__art')||panel;n;n=n.parentElement)revealOpacity*=+getComputedStyle(n).opacity;
 const frame=rect(panel),x=frame[0]+frame[2]/2,y=frame[1]+frame[3]/2,top=document.elementsFromPoint(x,y).map(n=>n.closest('.cs-panel')).find(n=>n&&+getComputedStyle(n).opacity>.2);
 const mask=c.querySelector?.('.cs-agent-fabrication'),band=mask?.querySelector('.cs-agent-fabrication__band'),fabrication=mask&&band?{mode:mask.dataset.fabricationMode,hidden:getComputedStyle(mask).display==='none',maskImage:getComputedStyle(mask).maskImage||getComputedStyle(mask).webkitMaskImage,maskSize:getComputedStyle(mask).maskSize||getComputedStyle(mask).webkitMaskSize,maskPosition:getComputedStyle(mask).maskPosition||getComputedStyle(mask).webkitMaskPosition,sourceImage:cs.backgroundImage,sourceSize:cs.backgroundSize,sourcePosition:cs.backgroundPosition,blend:getComputedStyle(mask).mixBlendMode,bandTop:parseFloat(band.style.top),opacity:+getComputedStyle(band).opacity}:null;
 const fixed=[...panel.querySelectorAll('.cs-border,.cs-bw,.cs-bshape,.cs-b')].map(n=>({class:n.className.baseVal||n.className,rect:rect(n),transform:getComputedStyle(n).transform,filter:getComputedStyle(n).filter}));
 return {fabrication,decoded,width:target.offsetWidth,height:target.offsetHeight,transform:t.transform,filter:t.filter,clipPath:t.clipPath,targetOpacity:+t.opacity,matrix:[matrix.a,matrix.b,matrix.c,matrix.d,matrix.e,matrix.f],origin:t.transformOrigin.split(' ').map(parseFloat),worldRect:world,chain,artMode:pageNode.dataset.artMode||'legacy',targetLayerId:c.dataset.layerId||null,renderedBalloonCount:panel.querySelectorAll('.cs-bw').length,frame,fixed,opacity:revealOpacity,visible:revealOpacity>=.95&&getComputedStyle(pageNode).visibility==='visible',occluded:!!top&&top!==panel,status:MTWComicStory.status()};
}
export function channelMetrics(before,after,spec) {
 const corners=r=>[[r[0],r[1]],[r[0]+r[2],r[1]],[r[0],r[1]+r[3]],[r[0]+r[2],r[1]+r[3]]];
 const a=corners(before.worldRect),b=corners(after.worldRect),movement=Math.max(...a.map((p,i)=>Math.hypot(b[i][0]-p[0],b[i][1]-p[1])));
 const brightness=c=>c.chain.reduce((v,n)=>v*Number(n.filter.match(/brightness\(([^)]+)\)/)?.[1]||1),1);
 const brightnessDelta=Math.abs(brightness(after)-brightness(before)),ownBrightness=c=>Number(c.filter.match(/brightness\(([^)]+)\)/)?.[1]||1),ownBrightnessDelta=Math.abs(ownBrightness(after)-ownBrightness(before)),opacityDelta=Math.abs(after.targetOpacity-before.targetOpacity);
 const clipTop=c=>c.clipPath==='none'?0:Number(c.clipPath.match(/^inset\(([\d.]+)%/)?.[1]);
 const clipDelta=Math.abs(clipTop(after)-clipTop(before));
 const strength=spec.strength==null ? .5 : spec.strength;
 // Bounds reflect the actual authored strength, not a fixed brightness threshold.
 const minimumEdgePx=Math.max(.1,Math.min(2,before.width*.02*strength));
 const aligned=f=>f&&f.maskImage===f.sourceImage&&f.maskSize===f.sourceSize&&f.maskPosition===f.sourcePosition&&f.blend==='normal';
 const bodyOpacity=spec.planeOpacity??1,fabricationDelta=Math.abs((after.fabrication?.bandTop??0)-(before.fabrication?.bandTop??0)),fabricationPass=aligned(before.fabrication)&&aligned(after.fabrication)&&!after.fabrication.hidden&&after.fabrication.mode==='active'&&after.fabrication.opacity>0&&after.fabrication.opacity<=.12*strength+.0001&&fabricationDelta>=1&&bodyOpacity>=.9&&bodyOpacity<=1&&Math.abs(before.targetOpacity-bodyOpacity)<.0001&&Math.abs(after.targetOpacity-bodyOpacity)<.0001&&before.filter==='none'&&after.filter==='none';
 const kind=spec.preset,pass=spec.fabrication===true?fabricationPass:['light','shadow'].includes(kind)?ownBrightnessDelta>=.02*strength:kind==='projection'?opacityDelta>=.01*strength&&after.filter!==before.filter:kind==='sprout'?(spec.floorIndex!=null?before.clipPath==='none'&&after.clipPath==='none'&&opacityDelta>=.95*(spec.planeOpacity??1):Number.isFinite(clipDelta)&&clipDelta>=100/(spec.floors||8)):after.transform!==before.transform&&movement>=minimumEdgePx;
 return {pass,fabricationDelta,movementPx:movement,brightnessDelta,ownBrightnessDelta,opacityDelta,clipDelta,minimumEdgePx};
}
export const sameMotion=(a,b)=>JSON.stringify(a.chain)===JSON.stringify(b.chain)&&JSON.stringify(a.fabrication)===JSON.stringify(b.fabrication)&&Math.abs(a.status.T-b.status.T)<.002;
export const reducedStatic=c=>(!c.fabrication||c.fabrication.hidden)&&c.chain.every(n=>n.transform==='none'&&n.filter==='none'&&n.clipPath==='none');
export function readingSampleKind(scene,frame) {
 const panels=scene.panels.filter(p=>frame.panelImageIds.includes(p.img));
 return frame.activeSheet!==frame.sheet&&panels.length>0&&panels.every(p=>!(p.balloons||[]).length)?'quick-montage-overlap':'completed-lettering';
}
export const targetVisible=(sample,scene)=>sample.visible&&!sample.occluded&&(!scene.layers?.length||sample.artMode==='layers');
export function readingSampleVerdict(scene,frame,lettering,visible) {
 const kind=readingSampleKind(scene,frame),base=frame.ready&&visible.every(c=>targetVisible(c,scene));
 return {kind,pass:!!(base&&(kind==='quick-montage-overlap'?lettering.every(p=>p.balloons.length===0)&&visible.every(c=>c.renderedBalloonCount===0):frame.activeSheet===frame.sheet&&lettering.every(p=>p.balloons.every(b=>b.found&&b.opacity>=.99&&!b.untyped))))};
}
export function playbackTerminalSummary(report,reportFile) {
 const names=report.errors.map(e=>typeof e==='string'?e:e.name||Object.keys(e).find(k=>/Error$/.test(k))||'unnamed-error'),errorCounts={};for(const n of names)errorCounts[n]=(errorCounts[n]||0)+1;
 return {reportFile,checks:report.checks.length,frames:report.frames.length,errorCount:report.errors.length,errorCounts,closed:report.closed};
}
export async function waitVoiceJump(frame,line,entry) {
 try{await frame.waitForFunction(id=>window.MTWComicStory?.status().score.speech?.current?.id===id,line.id,{timeout:8000});}
 catch(error){const actual=await frame.evaluate(()=>({status:window.MTWComicStory?.status(),fonts:document.fonts.status,url:location.href,loader:[...document.querySelectorAll('.cs-loader')].map(n=>({hidden:n.hidden,class:n.className,text:n.textContent}))}));entry.failedJump={line,actual,reason:'Selected UI line did not enter actual speech state within8s; no retry or forced replay performed'};throw Error('Home voice jump deadline '+JSON.stringify(entry.failedJump)+' '+String(error));}
}
