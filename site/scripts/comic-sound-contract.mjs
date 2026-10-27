// Shared Comic B sound authoring contract; one registry for story-check and deslop.
export const COMIC_SOUND_KINDS = Object.freeze(['buzz', 'ring', 'paper', 'keys', 'click', 'whoosh', 'impact', 'glass', 'alarm', 'door', 'heartbeat', 'sting', 'transit']);
// Begin comic sound validator (shared with audio-motion escape fixtures).
export function comicSoundErrors(sc) {
  const rooms = new Set(['office', 'servers', 'street', 'rain', 'none']);
  const kinds = new Set(COMIC_SOUND_KINDS);
  const errors = [];
  if (sc.soundAssets != null) {
    const map = sc.soundAssets.rooms;
    if (typeof sc.soundAssets !== 'object' || Array.isArray(sc.soundAssets)) errors.push('soundAssets must be an object');
    if (map !== undefined && (!map || typeof map !== 'object' || Array.isArray(map))) errors.push('soundAssets.rooms must be a room map');
    else for (const [room, asset] of Object.entries(map || {})) {
      if (!rooms.has(room) || room === 'none') errors.push('unknown room asset ' + room);
      if (!asset || typeof asset.src !== 'string' || !asset.src.trim() || /^(?:https?:|\/\/|data:)/i.test(asset.src)) errors.push('room asset must use a local src');
      if (asset?.gain != null && !(typeof asset.gain === 'number' && Number.isFinite(asset.gain) && asset.gain >= 0 && asset.gain <= 1)) errors.push('room asset gain must be finite within 0-1');
    }
  }
  if (sc.room != null && !rooms.has(sc.room)) errors.push('unknown scene room ' + sc.room);
  if (sc.score != null && !(typeof sc.score === 'number' && Number.isFinite(sc.score) && sc.score >= 0 && sc.score <= 1)) errors.push('score must be finite within 0-1');
  for (const p of sc.panels || []) {
    const name = p.img || p.id || 'panel';
    if (p.room != null && !rooms.has(p.room)) errors.push(name + ': unknown panel room ' + p.room);
    if (p.sfx != null && !Array.isArray(p.sfx)) { errors.push(name + ': sfx must be an array'); continue; }
    for (const cue of p.sfx || []) {
      if (!cue || !kinds.has(cue.kind)) errors.push(name + ': unknown effect ' + cue?.kind);
      if (cue?.gain != null && !(typeof cue.gain === 'number' && Number.isFinite(cue.gain) && cue.gain >= 0 && cue.gain <= 1)) errors.push(name + ': effect gain must be finite within 0-1');
      if (cue?.delay != null && !(typeof cue.delay === 'number' && Number.isFinite(cue.delay) && cue.delay >= 0)) errors.push(name + ': effect delay must be finite and nonnegative');
    }
  }
  return errors;
}
// End comic sound validator.
