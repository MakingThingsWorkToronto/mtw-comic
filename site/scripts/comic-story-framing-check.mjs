// Pure framing/device-review gates. Declarations are source inspection, not pixel recognition or user approval.
export function checkDeviceReview(panel, scene, required = false) {
  const review = panel.deviceReview, errors = [];
  if (review == null) return required ? ['missing explicit source device review'] : errors;
  if (typeof review !== 'object' || Array.isArray(review) || review.reviewed !== true || !Array.isArray(review.devices)) return ['deviceReview needs reviewed:true and devices array'];
  if (!/^[a-f0-9]{64}$/i.test(scene.masterSha256 || '')) errors.push('device review must bind the source master hash');
  for (const d of review.devices) {
    if (!d || typeof d !== 'object' || !d.label || !['front', 'back', 'edge', 'hologram'].includes(d.surface) || typeof d.uiVisible !== 'boolean') { errors.push('invalid device surface/UI declaration'); continue; }
    const a = d.sourcePixelRect;
    if (!Array.isArray(a) || a.length !== 4 || a.some(v => !Number.isFinite(v)) || a[0] < 0 || a[1] < 0 || a[2] <= 0 || a[3] <= 0 || a[0] + a[2] > scene.width || a[1] + a[3] > scene.height) errors.push(d.label + ': device rectangle escapes its source master');
    if (d.uiVisible && !['front', 'hologram'].includes(d.surface)) errors.push(d.label + ': UI is visible on a ' + d.surface + ' surface');
    if (required && d.uiVisible && d.surface === 'front' && !['faces-screen', 'no-visible-operator'].includes(d.operatorView)) errors.push(d.label + ': front UI needs an inspected operator-to-screen orientation');
  }
  return errors;
}
export function sourceToScreen(sourceRect, sourceSize, backgroundSize, backgroundPosition, cropRect, cssSize) {
  // The bounding rect includes the allowed translate/scale; computed background values do not.
  const sx = backgroundSize[0] / sourceSize[0] * cropRect[2] / cssSize[0];
  const sy = backgroundSize[1] / sourceSize[1] * cropRect[3] / cssSize[1];
  const kx = cropRect[2] / cssSize[0], ky = cropRect[3] / cssSize[1];
  return [cropRect[0] + backgroundPosition[0] * kx + sourceRect[0] * sx,
    cropRect[1] + backgroundPosition[1] * ky + sourceRect[1] * sy, sourceRect[2] * sx, sourceRect[3] * sy];
}

/** Review the actual selected visible source, never an arbitrary first DOM crop or scene-master dimensions. */
export function checkActiveArt(active, annotation) {
  const errors=[];
  if (!active || active.status!=='ready') return {errors:['active art is unavailable/not decoded'],geometryOnly:true};
  if(active.aliasDecodeMismatch||active.aliasReadError) errors.push('actual alias bytes could not verify current decode');
  const sources=annotation?.activeArtSources;
  const expected=Array.isArray(sources)&&sources.find(s=>s.viewId===active.viewId && s.canonicalSource?.path===active.canonicalSource?.path && s.canonicalSource?.sha256===active.canonicalSource?.sha256);
  if (!expected) return {errors:['missing/stale actual selected view/source annotation'],geometryOnly:true};
  if (!Array.isArray(expected.sourceDimensions)||expected.sourceDimensions.length!==2||expected.sourceDimensions.some(v=>!Number.isFinite(v)||v<=0)) errors.push('selected source needs exact canonical dimensions');
  const alias=(expected.aliases||[]).find(a=>a.src===active.src || a.src===new URL(active.src,'http://localhost:8789').pathname);
  if (!alias || !Array.isArray(alias.dimensions)||JSON.stringify(alias.dimensions)!==JSON.stringify(active.nativeDimensions)) errors.push('selected decoded alias dimensions/source are missing or stale');
  if (!active.actualAliasSha256||!alias?.sha256||active.actualAliasSha256!==alias.sha256) errors.push('actual selected alias byte hash is missing or stale');
  if (!Array.isArray(expected.protectedSubjects)||!expected.protectedSubjects.length) errors.push('selected source has no observed protected subjects');
  if ((active.planes||[]).some(p=>p.nativeDimensions&&JSON.stringify(p.nativeDimensions)!==JSON.stringify(active.nativeDimensions))) errors.push('aligned group canvas dimensions differ');
  if (active.kind==='view-group'||active.kind==='scene-group') for(const plane of active.planes||[]) {
    const row=expected.planes?.find(p=>p.id===plane.id&&p.canonicalSource?.path===plane.canonicalSource?.path&&p.canonicalSource?.sha256===plane.canonicalSource?.sha256);
    const aliasRow=row?.aliases?.find(a=>a.src===plane.src||a.src===new URL(plane.src,'http://localhost:8789').pathname);
    if(!row||!aliasRow||aliasRow.sha256!==plane.actualAliasSha256||JSON.stringify(aliasRow.dimensions)!==JSON.stringify(plane.nativeDimensions)||plane.aliasDecodeMismatch||plane.aliasReadError)errors.push('selected plane source/alias binding is missing or stale: '+plane.id);
    if(plane.nativeDimensions){const size=plane.backgroundSize,box=plane.rect,css=plane.cssSize,ratio=(active.devicePixelRatio||1);if(size[0]/plane.nativeDimensions[0]*box[2]/css[0]*ratio>1.001||size[1]/plane.nativeDimensions[1]*box[3]/css[1]*ratio>1.001)errors.push('selected plane native pixels insufficient for CSS×DPR: '+plane.id);}
  }
  if ((active.planes||[]).some(p=>JSON.stringify(p.backgroundSize)!==JSON.stringify(active.backgroundSize)||JSON.stringify(p.backgroundPosition)!==JSON.stringify(active.backgroundPosition))) errors.push('aligned group registration differs');
  const cssPair=v=>String(v||'').split(/\s+/).map(parseFloat);
  if ((active.planes||[]).some(p=>p.mask&&(JSON.stringify(cssPair(p.mask.size))!==JSON.stringify(p.backgroundSize)||JSON.stringify(cssPair(p.mask.position))!==JSON.stringify(p.backgroundPosition)||p.mask.image!==p.backgroundImage))) errors.push('actor mask registration differs');
  const [nw,nh]=active.nativeDimensions||[],[bw,bh]=active.backgroundSize||[],[cw,ch]=active.cssSize||[],[,,dw,dh]=active.cropRect||[];
  const sx=bw/nw*(dw/cw),sy=bh/nh*(dh/ch),dpr=active.devicePixelRatio||1;
  const quality={sourcePixelsPerDevicePixelX:1/(sx*dpr),sourcePixelsPerDevicePixelY:1/(sy*dpr),visualSharpness:'pending'};
  if (![sx,sy].every(v=>Number.isFinite(v)&&v>0)) errors.push('active source/display geometry invalid');
  else if (sx*dpr>1.001||sy*dpr>1.001) errors.push('selected cropped native pixels are insufficient for displayed CSS×DPR');
  const sourceDimensions=expected.sourceDimensions, crop=active.cropRect;
  if (Array.isArray(sourceDimensions)&&Array.isArray(crop)) for(const subject of expected.protectedSubjects||[]) {
    const r=subject.sourcePixelRect;
    if(!Array.isArray(r)||r.length!==4||r.some(v=>!Number.isFinite(v))||r[0]<0||r[1]<0||r[2]<=0||r[3]<=0||r[0]+r[2]>sourceDimensions[0]||r[1]+r[3]>sourceDimensions[1]) {errors.push('protected subject has invalid current source bounds');continue;}
    const rect=sourceToScreen(r,sourceDimensions,active.backgroundSize,active.backgroundPosition,crop,active.cssSize);
    if(rect[0]<crop[0]-0.5||rect[1]<crop[1]-0.5||rect[0]+rect[2]>crop[0]+crop[2]+0.5||rect[1]+rect[3]>crop[1]+crop[3]+0.5)errors.push('protected subject clipped: '+subject.label);
  }
  return {errors,expected,quality,geometryOnly:true,bakedMatteVisualReview:'pending'};
}

/** Caller reads actual URLs once, supplies SHA/dimensions from actual bytes; declared source hashes are not substituted. */
export async function bindActiveArtAliases(geometry, readAlias) {
  const cache=new Map();
  for (const panel of geometry.panels||[]) {
    const active=panel.activeArt;if(!active||active.status!=='ready')continue;
    for(const selected of [active,...(active.planes||[])]){
      if (!cache.has(selected.src)) cache.set(selected.src,Promise.resolve().then(()=>readAlias(selected.src)));
      try { const bytes=await cache.get(selected.src);selected.actualAliasSha256=bytes.sha256;
        if (JSON.stringify(bytes.dimensions)!==JSON.stringify(selected.nativeDimensions)) selected.aliasDecodeMismatch=true;
      } catch(error) { selected.aliasReadError=String(error); }
    }
  }
  return geometry;
}

export async function captureActiveArt(getGeometry, readAlias) {
  const cache=new Map(),read=src=>{if(!cache.has(src))cache.set(src,Promise.resolve().then(()=>readAlias(src)));return cache.get(src);};
  const selection=g=>JSON.stringify((g.panels||[]).map(p=>[p.scene,p.imageId,p.activeArt?.status,p.activeArt?.kind,p.activeArt?.viewId,p.activeArt?.src,p.activeArt?.nativeDimensions,p.activeArt?.canonicalSource,p.activeArt?.sourceROI,p.activeArt?.planes?.map(l=>[l.id,l.src,l.nativeDimensions,l.canonicalSource,l.mask?.image])]));
  for(let attempt=0;attempt<2;attempt++) {
    const before=await getGeometry();await bindActiveArtAliases(before,read);const after=await getGeometry();
    if(selection(before)===selection(after))return bindActiveArtAliases(after,read);
  }
  throw Error('Selected art changed during byte binding; fresh capture pending');
}
