// Small read-only checks for the existing reader frame; these never establish acting, hearing or human approval.
export interface QuickRect { x: number; y: number; width: number; height: number }
export interface QuickBalloonSource { at?: number; kind?: string; who?: string; text?: string; state?: string; chain?: boolean; across?: boolean; sceneSetup?: boolean; characterIntro?: boolean; speech?: { src?: string; characterId?: string; durationSeconds?: number } }
export interface QuickPanelSource { at: number; alt?: string; balloons: QuickBalloonSource[]; motion?: { preset?: string; beats?: number }; layerMotion?: { preset?: string; beats?: number }[]; views?: { layerMotion?: { preset?: string; beats?: number }[] }[]; sfx?: unknown[]; room?: string }
export interface QuickPlane { src?: string; nativeDimensions?: number[]; transform?: string; opacity?: string }
export interface QuickPanelGeometry { id: string; scene: string; imageId: string | null; rect: QuickRect; visibleRect: QuickRect; activeArt?: { status?: string; reason?: string; fit?: string; transform?: string; cropRect?: number[]; planes?: QuickPlane[] }; speakerGeometry?: Record<string, { mouth: number[]; face: number[] }> }
export interface QuickBalloonGeometry { panelId: string; balloonIndex: number; kind?: string; pointerVisible?: boolean; sourceAnchored?: boolean; placementConflict?: boolean; bodyRect?: number[]; captionAnchor?: string }
export interface QuickSample { label: string; beat: number; panel?: QuickPanelGeometry; balloons: QuickBalloonGeometry[]; motionSignature: string; sourceError?: string; layerState?: string; loaded: boolean; visibleBoxes?: number }
export interface QuickCheck { id: string; label: string; state: 'pass' | 'fail' | 'pending'; basis: 'source' | 'geometry' | 'human'; detail: string }
export interface QuickReport { key: string; at: string; mode: string; samples: QuickSample[]; checks: QuickCheck[] }
/** Count actual visible paper bounds, requiring a useful portion instead of a clipped sliver; never authored arrays. */
export function visibleBoxCount(panels: QuickPanelGeometry[], viewport: { width: number; height: number; scrollX: number; scrollY: number }): number {
  return panels.filter(p => {
    const r = p.visibleRect, x0 = Math.max(r.x, viewport.scrollX), y0 = Math.max(r.y, viewport.scrollY), x1 = Math.min(r.x + r.width, viewport.scrollX + viewport.width), y1 = Math.min(r.y + r.height, viewport.scrollY + viewport.height);
    const w = Math.max(0, x1 - x0), h = Math.max(0, y1 - y0);
    return w >= 60 && h >= 60 && w * h >= p.rect.width * p.rect.height * .9;
  }).length;
}

/** Current source membership, not viewport clipping or a claim that each shot is useful. */
export function comicPageBoxCount(sourceImages: string[], pageImages?: string[]): number | null {
  if (!sourceImages.length || sourceImages.some(id => !id) || new Set(sourceImages).size !== sourceImages.length || !pageImages?.length) return null;
  if (pageImages.some(id => !sourceImages.includes(id)) || new Set(pageImages).size !== pageImages.length) return null;
  return pageImages.length;
}

export function checkBoxSamples(input: { key: string; mode: string; panel: QuickPanelSource; pageBoxCount?: number | null; score?: number; room?: string; bpm?: number; endLocalBeat?: number; durationSeconds: number; fullyReadBeat: number | null; fadeBeat: number; samples: QuickSample[] }): QuickReport {
  const { panel, samples } = input, checks: QuickCheck[] = [];
  const add = (id: string, label: string, state: QuickCheck['state'], basis: QuickCheck['basis'], detail: string) => checks.push({ id, label, state, basis, detail });
  const counts = samples.map(s => s.visibleBoxes).filter((n): n is number => n !== undefined), minimum = counts.length ? Math.min(...counts) : null;
  const pageCount = Number.isInteger(input.pageBoxCount) && (input.pageBoxCount ?? 0) > 0 ? input.pageBoxCount! : null;
  add('too-few-boxes', 'Authored comic-page boxes', pageCount === null ? 'pending' : pageCount < 5 ? 'fail' : 'pass', 'source', `${pageCount === null ? 'Current source/page membership is unknown.' : `${pageCount} authored boxes on the selected comic page; minimum 5.`} ${minimum === null ? 'Viewport-visible boxes were not measured.' : `Viewport: ${minimum} fully visible boxes at the narrowest sampled state; scrolling can reveal the remaining page.`} Distinct meaningful shots still require visual story review.`);
  const artFailures = samples.filter(s => { const art = s.panel?.activeArt; if (!art || art.status !== 'ready') return true; return s.sourceError || s.layerState === 'missing' || s.layerState === 'loading' || !art.planes?.length || art.planes.some(p => !p.src || p.nativeDimensions?.length !== 2 || !p.nativeDimensions.every(n => Number.isFinite(n) && n > 0)); });
  add('empty-layered-state', 'Decoded art and required planes', artFailures.length ? 'fail' : samples.length ? 'pass' : 'pending', 'geometry', artFailures.length ? `Unavailable/incomplete selected art at ${artFailures.map(s => s.label).join(', ')}.` : 'Actual selected planes decoded at the sampled states; source hashes and usefulness still need review.');
  const clipped = samples.filter(s => { const p = s.panel, crop = p?.activeArt?.cropRect; return p && crop && ((crop[2] ?? 0) < p.rect.width - 2 || (crop[3] ?? 0) < p.rect.height - 2); });
  const faceClips = samples.some(s => s.panel && Object.values(s.panel.speakerGeometry ?? {}).some(({ face }) => { const x = face[0] ?? NaN, y = face[1] ?? NaN, w = face[2] ?? NaN, h = face[3] ?? NaN; return ![x,y,w,h].every(Number.isFinite) || x < -1 || y < -1 || x + w > s.panel!.rect.width + 1 || y + h > s.panel!.rect.height + 1; }));
  add('doesnt-fit', 'Art fills this box', clipped.length ? 'fail' : artFailures.length ? 'pending' : 'pass', 'geometry', clipped.length ? 'The actual selected art rectangle leaves bands inside the box.' : 'Selected-art bounds cover the box; visual content quality is separate.');
  add('crop-cuts', 'Protected faces stay inside crop', faceClips ? 'fail' : samples.some(s => Object.keys(s.panel?.speakerGeometry ?? {}).length) ? 'pass' : 'pending', 'geometry', faceClips ? 'A mapped source face extends outside its actual box.' : 'Uses authored source face bounds; unannotated faces/evidence need visual review.');
  add('low-quality', 'Actual image detail and information', 'pending', 'human', 'Inspect source pixels, information faces, faces/hands and evidence at desktop/phone size.');
  add('off-model', 'Cast identity and acting', 'pending', 'human', 'Compare the actual pictured speaker with its approved cast; watch eyeline, pose and reaction.');
  add('agent-projection', 'Full-colour scene transmission', 'pending', 'human', 'Inspect the actual digital-agent interior, colour and background transmission; declared alpha/planes alone do not pass.');
  const full = samples.find(s => s.label === 'full-read') ?? samples[samples.length - 1];
  const missing: number[] = [], wrong: number[] = []; let deviceTarget = false;
  panel.balloons.forEach((b, i) => {
    if (['caption', 'place'].includes(b.kind ?? '') || b.state === 'offpanel' || b.across || panel.balloons[i + 1]?.chain) return;
    const g = full?.balloons.find(g => g.balloonIndex === i);
    if (!g || !g.pointerVisible) missing.push(i + 1);
    if (b.state === 'device') deviceTarget = true;
    else if (g && !g.sourceAnchored) wrong.push(i + 1);
  });
  add('missing-pointer', 'Visible speaker pointers', missing.length ? 'fail' : full ? 'pass' : 'pending', 'geometry', missing.length ? `Missing exterior pointer/balloon at ${missing.join(', ')}.` : 'Actual rendered pointer is present; intentional chains/off-panel lines are exempt.');
  add('wrong-speaker-pointer', 'Source speaker anchoring', wrong.length ? 'fail' : full && !deviceTarget ? 'pass' : 'pending', 'geometry', wrong.length ? `Unbound source mouth at balloon ${wrong.join(', ')}; inspect target.` : deviceTarget ? 'Authored device/chat pointer exists; its actual screen/device target needs visual review, not a human mouth anchor.' : 'Pointers are bound to source mouths; cast/face identity still needs visual review.');
  const conflicts = samples.flatMap(s => s.balloons).some(b => b.placementConflict);
  let labelMissing = false, labelWrong = false;
  panel.balloons.forEach((b, i) => { if (!(b.kind === 'place' || b.sceneSetup || b.characterIntro)) return; const g = full?.balloons.find(g => g.balloonIndex === i); if (!g?.captionAnchor) labelMissing = true; else if (b.sceneSetup ? g.captionAnchor !== 'bottom-right' : b.kind === 'place' ? g.captionAnchor !== 'top' : g.captionAnchor !== 'character-authored') labelWrong = true; });
  add('label-placement', 'Lettering and semantic labels', conflicts || labelWrong ? 'fail' : full && !labelMissing ? 'pass' : 'pending', 'geometry', conflicts || labelWrong ? 'Actual lettering has a face/body collision or wrong semantic caption anchor.' : 'Uses actual top/place, bottom-right/setup and authored-intro anchors; character identity/proximity needs visual review.');
  const text = panel.balloons.some(b => !!b.text?.trim());
  add('no-story-content', 'Useful story content', !text && artFailures.length ? 'fail' : 'pending', 'human', text ? 'Written content exists; watch the selected states for meaningful action/evidence.' : 'A silent box may be meaningful; inspect its actual action rather than inventing words.');
  const motions = [panel.motion, ...(panel.layerMotion ?? []), ...(panel.views ?? []).flatMap(v => v.layerMotion ?? [])].filter(m => m?.preset && m.preset !== 'still');
  const signatures = new Set(samples.map(s => s.motionSignature));
  add('lacks-motion', 'Motion changes on the reader clock', input.mode === 'reduced' ? 'pending' : motions.length && signatures.size < 2 ? 'fail' : signatures.size > 1 ? 'pass' : 'pending', 'geometry', signatures.size > 1 ? 'Actual isolated transforms/projection bands change; purpose and strength still need watching.' : input.mode === 'reduced' ? 'Static reduced-motion pose; compare with normal playback separately.' : motions.length ? 'Declared motion did not change at sampled opening/peak/end states.' : 'No declared motion; decide whether the depicted action needs movement.');
  const unvoiced = panel.balloons.map((b, i) => b.text?.trim() && !b.speech?.src ? i + 1 : 0).filter(Boolean);
  add('missing-voice', 'Saved voice bindings', unvoiced.length ? 'fail' : 'pass', 'source', unvoiced.length ? `No saved utterance for balloon ${unvoiced.join(', ')}.` : 'Recording references exist; decoding, exact words and hearing remain separate.');
  const wrongNarration = panel.balloons.some(b => (b.sceneSetup || b.characterIntro || ['caption', 'place'].includes(b.kind ?? '') && (b.who === 'narrator' || b.state === 'narration')) && b.speech && b.speech.characterId !== 'second-brain');
  add('wrong-voice', 'Narrator and cast match', wrongNarration ? 'fail' : 'pending', 'source', wrongNarration ? 'An intro/setup recording is not bound to Second Brain.' : 'Check actual words/cast recording by listening; metadata alone cannot pass.');
  add('more-sfx', 'Score, room and event direction', input.score === undefined || !(panel.room ?? input.room) ? 'fail' : 'pending', 'source', `score ${input.score ?? 'missing'}; room ${panel.room ?? input.room ?? 'missing'}; ${panel.sfx?.length ?? 0} event cues; silence can be intentional.`);
  add('wrong-sound', 'Delivered sound and acting', 'pending', 'human', 'Play and listen with speech active: event fit, ambience, score, levels and delivery.');
  const B = input.bpm ? 60 / input.bpm : 0;
  const voiceOverrun = B > 0 && input.endLocalBeat !== undefined && panel.balloons.some(b => {
    if (!b.speech?.durationSeconds) return false;
    const at = Math.max(panel.at, b.at ?? panel.at), start = at * B + .3;
    const stop = panel.balloons.filter(other => (other.at ?? panel.at) > at).reduce((end, other) => Math.min(end, (other.at ?? panel.at) * B + .3), input.endLocalBeat! * B);
    return start + b.speech.durationSeconds > stop + .02;
  });
  const rushed = voiceOverrun || input.fullyReadBeat === null || input.fullyReadBeat >= input.fadeBeat;
  add('pace-rushed', 'Complete lettering and voice window', rushed ? 'fail' : 'pass', 'geometry', voiceOverrun ? 'A measured recording exceeds its actual next-written/next-box slot.' : rushed ? 'Final glyph/art has no complete reading frame before fade.' : 'Actual fully-lettered frame and declared recording durations fit; human reading and hearing remain separate.');
  const words = panel.balloons.reduce((n, b) => n + (b.text?.split(/\s+/).filter(Boolean).length ?? 0), 0), speech = panel.balloons.reduce((n, b) => n + (b.speech?.durationSeconds ?? 0), 0);
  const overlong = input.durationSeconds > Math.max(6, 1 + words * .3, speech + 1) + 8;
  add('pace-slow', 'Dwell versus content', overlong ? 'fail' : 'pending', 'source', `${input.durationSeconds.toFixed(1)}s, ${words}words, ${speech.toFixed(1)}s saved speech${overlong ? '; excess dwell flagged for review' : '; watch engagement/readability'}.`);
  return { key: input.key, at: new Date().toISOString(), mode: input.mode, samples, checks };
}

export function quickFailureNote(report: QuickReport): string {
  const failures = report.checks.filter(c => c.state === 'fail');
  return `Box tests (${report.key}, ${report.mode}): ${failures.length ? failures.map(c => `${c.id}: ${c.detail}`).join('\n') : 'No measured failures.'}\nPending watching/listening and source-hash review remain pending; no approval.`;
}
