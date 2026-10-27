/** Authored lettering reservations from real styled browser measurements; never runtime auto-layout. */
import fs from 'node:fs/promises';import path from 'node:path';import{createHash}from'node:crypto';import{fileURLToPath}from'node:url';
export const hash=b=>createHash('sha256').update(b).digest('hex');
export async function assertMeasuredDependencies(root,dependencies,read=fs.readFile){for(const dep of dependencies){const file=path.resolve(root,dep.path);if(!file.startsWith(root+path.sep)||!/^(?:site\/|\.codex\/skills\/|\.claude\/skills\/)[\w/.-]+$/.test(dep.path)||dep.path.split('/').includes('..'))throw Error('Unsafe measured dependency');if(hash(await read(file))!==dep.sha256)throw Error('Measured dependency is stale: '+dep.path);}}
// Pass this self-contained function to the authorized browser's read-only evaluate API after fonts.ready and resize settle.
export function collectStyledLetteringDom(){
 if(document.fonts.status!=='loaded')throw Error('Fonts not loaded');
 return{viewport:[innerWidth,innerHeight],pages:[...document.querySelectorAll('.cs-page')].map(page=>({scene:page.dataset.scene,panels:[...page.querySelectorAll('.cs-panel')].map(panel=>{const r=panel.getBoundingClientRect();return{box:+panel.dataset.box,panelId:panel.querySelector('.cs-panel__alt')?.textContent,panelRect:{width:r.width,height:r.height},balloons:[...panel.querySelectorAll('.cs-bw')].map((w,ordinal)=>{const g=JSON.parse(w.dataset.geom||'null'),b=w.querySelector('.cs-b');if(!g||!b)throw Error('Balloon geometry missing');return{ordinal,text:b.getAttribute('aria-label'),kind:w.dataset.kind,computedFontSize:+(getComputedStyle(b).fontSize.replace("px","")),capPx:g.c,geometry:g,bodyHeightPx:(g.bodyH??g.boxH)*g.c,bodyWidthPx:(g.bodyW??g.boxW)*g.c};})};})}))};
}
export function planLetteringStack(heights,{width,height,gap=12,padding=12,maxMeasuredWidth,minArtHeight=180}={}){
 if(!Array.isArray(heights)||heights.some(h=>!Number.isFinite(h)||h<=0))throw Error('Actual finite measured body heights required');
 if(![width,height,gap,padding,maxMeasuredWidth,minArtHeight].every(n=>Number.isFinite(n)&&n>=0)||!width||!height)throw Error('Actual positive panel metrics required');
 const available=width-2*padding;if(maxMeasuredWidth>available)throw Error('Measured body wider than authored lettering reserve; remeasure/split');
 let y=padding;const boxes=heights.map(h=>{const budget=Math.ceil(h*1.03+4),r={x:padding/width,y:y/height,w:available/width,heightPx:budget};y+=budget+gap;return r;});
 if(heights.length)y-=gap;y+=gap;
 const art={x:padding/width,y:y/height,w:available/width,h:(height-y-padding)/height};if(art.h*height<minArtHeight)throw Error('Insufficient art reservation; split page or remeasure');
 return{boxes,art,panel:{width,height},gap,padding,minimumArtPx:minArtHeight};
}
export function planOpeningLettering(heights,options){
 if(!Array.isArray(heights)||heights.length<2)throw Error('Opening needs measured heading and final setup');
 const {width,height,gap=12,padding=12}=options,footer=Math.ceil(heights.at(-1)*1.03+4),topHeight=height-footer-gap-padding;
 const top=planLetteringStack(heights.slice(0,-1),{...options,height:topHeight}),headCount=heights.length-1,headWidth=options.maxMeasuredWidth+8;
 if(headCount>1&&headCount*headWidth+(headCount-1)*gap<=width-2*padding){top.boxes=top.boxes.map((b,i)=>({...b,x:(padding+i*(headWidth+gap))/width,y:padding/topHeight,w:headWidth/width}));const y=padding+Math.max(...top.boxes.map(b=>b.heightPx))+gap;top.art.y=y/topHeight;top.art.h=(topHeight-y-padding)/topHeight;if(top.art.h*topHeight<(options.minArtHeight??180))throw Error('Insufficient art reservation; split page or remeasure');}
 const result={...top,panel:{width,height},boxes:[...top.boxes.map(b=>({...b,y:b.y*topHeight/height})),{x:padding/width,y:(height-padding-footer)/height,w:(width-2*padding)/width,heightPx:footer,setup:true}],art:{...top.art,y:top.art.y*topHeight/height,h:top.art.h*topHeight/height}};assertNoLetteringCollision(result.boxes,result.art,{width,height,gap});return result;
}
export function assertNoLetteringCollision(boxes,art,{width,height,gap=0}={}){
 if(![width,height].every(n=>Number.isFinite(n)&&n>0))throw Error('Positive panel size required');
 const rects=boxes.map(b=>({left:b.x*width,top:b.y*height,width:b.w*width,height:b.heightPx}));
 if(![art.x,art.y,art.w,art.h].every(n=>Number.isFinite(n)&&n>=0))throw Error('Finite artwork reservation required');
 for(let i=0;i<rects.length;i++){const a=rects[i];if(![a.left,a.top,a.width,a.height].every(Number.isFinite)||a.left<0||a.top<0||a.left+a.width>width+.01||a.top+a.height>height+.01)throw Error('Lettering outside panel');for(let j=i+1;j<rects.length;j++){const b=rects[j];if(a.left<b.left+b.width&&b.left<a.left+a.width&&a.top<b.top+b.height+gap-.01&&b.top<a.top+a.height+gap-.01)throw Error('Measured accumulated lettering collision');}if(a.top+a.height+gap>art.y*height+.01&&a.top<(art.y+art.h)*height+gap-.01)throw Error('Lettering enters artwork reservation');}
 return true;
}
export function parseStory(text){const a=text.indexOf('retime(')+7,z=text.lastIndexOf('});')+1;if(a<7||z<a)throw Error('Expected retime JSON story');return{story:JSON.parse(text.slice(a,z)),prefix:text.slice(0,a),suffix:text.slice(z)};}
export function authorMeasuredPages(story,measurements){
 const dw=measurements.desktop?.panelWidths,dh=measurements.desktop?.fullRowHeight,pw=measurements.phone?.oneBox;
 if(!dw||![dw[1],dw[2],dw[3],dh,pw?.[0],pw?.[1]].every(n=>Number.isFinite(n)&&n>0))throw Error('Measured one/two/three-column desktop and one-box phone dimensions required');
 for(const group of Object.values(measurements.speakerAnchors??{}))for(const a of Object.values(group)){if(a.offpanel?!['left','right'].includes(a.side):![a.x,a.y].every(n=>Number.isFinite(n)&&n>=0&&n<=1))throw Error('Actual bounded speaker anchor or offpanel side required');}
 for(const a of Object.values(measurements.artAspects??{}))if(!Number.isFinite(a)||a<=0)throw Error('Actual positive artwork aspect required');
 const source=structuredClone(story),scenes=[],receipt=[];let measured=0;
 for(const sc of source.scenes){const m=measurements.scenes[sc.id];if(!m||m.desktop.length!==sc.panels.length||m.phone.length!==sc.panels.length)throw Error('Exact scene/panel measurement coverage required');
  if(sc.panels.some((p,i)=>p.balloons.length!==m.desktop[i].length||p.balloons.length!==m.phone[i].length))throw Error('Exact balloon measurement coverage required');
  measured+=sc.panels.reduce((n,p)=>n+p.balloons.length,0);
  if(sc.panels.some(p=>p.balloons.some(b=>b.sceneSetup))){if(sc.panels.length!==1)throw Error('Opening context needs its own full page');const p=sc.panels[0];if(!p.balloons.at(-1)?.sceneSetup||p.balloons.slice(0,-1).some(b=>b.sceneSetup))throw Error('Opening setup must be final exact caption');const desktop=planOpeningLettering(m.desktop[0],{width:dw[1],height:dh,maxMeasuredWidth:m.desktopWidths?.[0]??measurements.desktop.maxMeasuredWidth}),phone=planOpeningLettering(m.phone[0],{width:pw[0],height:pw[1],padding:8,maxMeasuredWidth:m.phoneWidths?.[0]??measurements.phone.maxMeasuredWidth});p.pageArt=[desktop.art.x,desktop.art.y,desktop.art.w,desktop.art.h];p.phoneArt=[phone.art.x,phone.art.y,phone.art.w,phone.art.h];p.balloons.forEach((b,j)=>{for(const[key,plan]of[['desktop',desktop],['phone',phone]]){const target=key==='desktop'?b:(b.phone??={}),box=plan.boxes[j];target.x=box.x;target.y=box.setup?.95:box.y;target.w=box.w;target.chain=false;if(box.setup)delete target.anchor;else target.anchor='free';}});sc.phonePages=[[{img:p.img,r:[0,0,1,1]}]];receipt.push({scene:sc.id,sourceScene:sc.id,panel:p.img,desktop,phone,opening:true,standing:'Actual top body budgets and bottom-right final setup bracket full contained art; final native clearance pending'});scenes.push(sc);continue;}
  for(let at=0;at<sc.panels.length;at+=3){const page=structuredClone(sc);page.id=at?sc.id+'-lettering-'+(at/3+1):sc.id;page.continues=at?true:!!sc.continues;page.panels=page.panels.slice(at,at+3);page.phonePages=page.panels.map(p=>[{img:p.img,r:[0,0,1,1]}]);const n=page.panels.length;
   for(let i=0;i<n;i++){const p=page.panels[i],di=at+i,desktop=planLetteringStack(m.desktop[di],{width:dw[n],height:dh,maxMeasuredWidth:m.desktopWidths?.[di]??measurements.desktop.maxMeasuredWidth}),phone=planLetteringStack(m.phone[di],{width:pw[0],height:pw[1],gap:12,padding:8,maxMeasuredWidth:m.phoneWidths?.[di]??measurements.phone.maxMeasuredWidth,minArtHeight:180});
    p.r=[i/n,0,1/n,1];p.pageArt=[desktop.art.x,desktop.art.y,desktop.art.w,desktop.art.h];p.phoneArt=[phone.art.x,phone.art.y,phone.art.w,phone.art.h];
    p.balloons.forEach((b,j)=>{const old=structuredClone(b),anchor=measurements.speakerAnchors?.[p.img]?.[b.who];if(anchor?.offpanel)b.state='offpanel';for(const [key,plan] of [['desktop',desktop],['phone',phone]]){const box=plan.boxes[j],target=key==='desktop'?b:(b.phone??={});target.x=box.x;target.y=box.y;target.w=box.w;target.anchor='free';target.chain=false;if(old.tail&& !['caption','place'].includes(b.kind)){const original=key==='phone'?old.phone?.tail??old.tail:old.tail;if(b.state==='offpanel'){target.tail=[anchor?.side==='right'?1:anchor?.side==='left'?0:original[0]<.5?0:1,box.y+box.heightPx/(2*plan.panel.height)];}else if(anchor&&measurements.artAspects?.[p.img]){const a=measurements.artAspects[p.img],rw=plan.art.w*plan.panel.width,rh=plan.art.h*plan.panel.height,iw=Math.min(rw,rh*a),ih=iw/a;target.tail=[plan.art.x+(rw-iw)/2/plan.panel.width+anchor.x*iw/plan.panel.width,plan.art.y+(rh-ih)/2/plan.panel.height+anchor.y*ih/plan.panel.height];}else target.tail=[Math.max(.08,Math.min(.92,original[0])),plan.art.y+plan.art.h*.30];}}
    });
    assertNoLetteringCollision(desktop.boxes,desktop.art,{...desktop.panel,gap:12});assertNoLetteringCollision(phone.boxes,phone.art,{...phone.panel,gap:12});receipt.push({scene:page.id,sourceScene:sc.id,panel:p.img,desktop,phone,tailStanding:'Original authored horizontal speaker direction retained, tail moved below lettering into reserved art; offpanel tails terminate at nearest authored side. Mouth/subject identity must be checked in final native frames.'});
   }scenes.push(page);
  }
 }source.scenes=scenes;return{story:source,receipt,measuredBalloons:measured};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),get=k=>args[args.indexOf(k)+1];if(!args.includes('--source')||!args.includes('--measurements')||!args.includes('--out'))throw Error('Usage: node comic-story-lettering-plan.mjs --source story.ts --measurements actual.json --out new-ignored-candidate.ts');
 const src=path.resolve(get('--source')),out=path.resolve(get('--out')),metrics=JSON.parse(await fs.readFile(get('--measurements'),'utf8')),raw=await fs.readFile(src);if(hash(raw)!==metrics.sourceSha256)throw Error('Measured source is stale');if(out===src||!out.includes(path.sep+'.codex'+path.sep+'worktrees'+path.sep))throw Error('Output must be new ignored authoring candidate, never canonical source');
 const root=path.resolve(path.dirname(src),'../../../..');await assertMeasuredDependencies(root,metrics.dependencies??[]);
 const parsed=parseStory(raw.toString('utf8')),result=authorMeasuredPages(parsed.story,metrics);await fs.mkdir(path.dirname(out),{recursive:true});await fs.writeFile(out,parsed.prefix+JSON.stringify(result.story,null,2)+parsed.suffix,{flag:'wx'});await fs.writeFile(out+'.lettering-plan.json',JSON.stringify({...result,story:undefined,sourceSha256:hash(raw),candidateSha256:hash(await fs.readFile(out)),measurementsSha256:hash(await fs.readFile(get('--measurements'))),nativeReview:'pending'},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({out,panels:result.story.scenes.reduce((n,s)=>n+s.panels.length,0),scenes:result.story.scenes.length,measuredBalloons:result.measuredBalloons,nativeReview:'pending'}));
}

// A short speaker pointer must finish before a different speaker's accumulated body.
// Inputs are actual styled body pixels, or retained native pixel bounds with explicit uncertainty.
export function planShortSpeakerTail({body,nextBodyTop,panelWidth,panelHeight,speakerX,clearance=8,uncertainty=3,minStem=4}={}){
 if(!body||![body.x,body.y,body.width,body.height,nextBodyTop,panelWidth,panelHeight,speakerX,clearance,uncertainty,minStem].every(Number.isFinite)||body.width<=0||body.height<=0||panelWidth<=0||panelHeight<=0||clearance<8||uncertainty<0||minStem<0)throw Error('Actual finite body, next-body and speaker pixels required');
 if(body.x<0||body.y<0||body.x+body.width>panelWidth||body.y+body.height>panelHeight||nextBodyTop>panelHeight||speakerX<0||speakerX>panelWidth)throw Error('Tail geometry outside measured panel');
 const bottom=body.y+body.height,y=Math.min(bottom+8,nextBodyTop-clearance-uncertainty);
 if(y<bottom+minStem)throw Error('Insufficient separate tail gap; reauthor measured body placement');
 const center=body.x+body.width/2,side=speakerX<center?-1:1,inset=Math.min(8,body.width/4),x=side<0?Math.max(body.x+inset,Math.min(center-1,speakerX)):Math.min(body.x+body.width-inset,Math.max(center+1,speakerX));
 return{tail:[x/panelWidth,y/panelHeight],tipPixels:{x,y},bodyBottom:bottom,nextBodyTop,minimumClearance:clearance,uncertainty,conservativeClearance:nextBodyTop-y-uncertainty,speakerSide:side<0?'left':'right',nativeReview:'pending'};
}
export function alignOffpanelBody({bodyWidth,panelWidth,padding=12,side='right'}={}){
 if(![bodyWidth,panelWidth,padding].every(Number.isFinite)||bodyWidth<=0||panelWidth<=0||padding<0||bodyWidth+2*padding>panelWidth||!['left','right'].includes(side))throw Error('Actual bounded offpanel body width and edge required');
 return{ x:(side==='right'?panelWidth-padding-bodyWidth:padding)/panelWidth,side,bodyWidth,panelWidth,padding,nativeReview:'pending'};
}
