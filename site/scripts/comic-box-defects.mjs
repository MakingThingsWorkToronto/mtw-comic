// Story-data rules for Matt's recurring Comic B box defects (2026-10-11). Each message names its defect number from the
// mtw-comic-story box-defect checklist (references/box-defects.md). These read story data only; they never inspect
// pixels, judge copy quality or replace the per-image visual review. Warnings must be fixed or explained in the box review.
import { comicViewErrors } from './comic-view-contract.mjs';
import { comicLayerErrors } from './comic-layer-contract.mjs';
export const SPEECH_WORD_LIMIT = 12;
// Effects that depict a physical event happening in the box (an action), as opposed to room tone or typing.
export const ACTION_SFX = Object.freeze(['impact', 'glass', 'door', 'whoosh', 'alarm']);
const SPOKEN = new Set(['speech', 'thought', 'burst', 'fear']);
const words = (text) => String(text || '').split(/\s+/).filter(Boolean).length;
const moving = (preset) => ['push','drift-left','drift-right','light','shadow','projection','sprout','travel','vibrate'].includes(preset);
const sourceSignature = view => JSON.stringify([view.canonicalSource?.sha256 || view.src, view.ar || [0,0,1,1], (view.layers || []).map(l => [l.canonicalSource?.sha256 || l.src,l.role,l.agentPlacement || l.propPlacement || null])]);

export function comicBoxDefectWarnings(story) {
  const out = [], groups = [];
  // A `continues: true` scene is a measured page split of the previous scene; score the whole scene once.
  for (const sc of story?.scenes || []) {
    if (sc.continues === true && groups.length) groups[groups.length - 1].panels.push(...(sc.panels || []));
    else groups.push({ id: sc.id, panels: [...(sc.panels || [])] });
  }
  for (const group of groups) {
    const withSfx = group.panels.filter((p) => (p.sfx || []).length).length, needed = Math.ceil(group.panels.length / 3);
    // Defect 5: a scene where most boxes are silent has too few effects for the events it depicts.
    if (group.panels.length && withSfx < needed)
      out.push(`box-defect 5 sound: scene ${group.id} has effects in ${withSfx} of ${group.panels.length} boxes; score at least ${needed} depicted events (one box in three)`);
  }
  for (const sc of story?.scenes || []) {
    const panels = sc.panels || [];
    const viewErrors = comicViewErrors(sc,story), layerErrors = comicLayerErrors(sc,story);
    panels.forEach((p, pi) => {
      const tag = `scene ${sc.id} box ${pi + 1} (${p.img || p.id || 'panel'})`;
      // Defect 3: balloon copy over about 12 words needs rewriting (captions and the opening context are budgeted elsewhere).
      for (const b of p.balloons || []) {
        const n = words(b.text);
        if (SPOKEN.has(b.kind) && b.sceneSetup !== true && n > SPEECH_WORD_LIMIT)
          out.push(`box-defect 3 speech: ${tag} "${String(b.text).slice(0, 28).replace(/\n/g, ' ')}" has ${n} words; rewrite to ${SPEECH_WORD_LIMIT} or fewer in the speaker's voice`);
      }
      // Defect 7: an action effect means something happens in the box; a box with no moving art reads as a still photo.
      const action = (p.sfx || []).filter((cue) => ACTION_SFX.includes(cue?.kind)).map((cue) => cue.kind);
      const validViews = Array.isArray(p.views) && p.views.length && !viewErrors.some(e => e.startsWith(`panel ${pi + 1} `));
      const viewMotion = validViews && ['desktop','phone'].every(media => {
        const eligible = p.views.filter(v => !v.media || v.media === media);
        return !eligible.length || new Set(eligible.map(sourceSignature)).size > 1 || eligible.some(v => (v.layerMotion || []).some(m => moving(m?.preset)));
      });
      const animated = moving(p.motion?.preset) || (!layerErrors.length && Array.isArray(p.layerMotion) && p.layerMotion.some((m) => moving(m?.preset))) || viewMotion;
      if (action.length && !animated)
        out.push(`box-defect 7 motion: ${tag} sounds ${action.join(', ')} but lacks validated moving art/layers or distinct ordered views; author the action (source metadata is not playback proof)`);
    });
  }
  return out;
}
