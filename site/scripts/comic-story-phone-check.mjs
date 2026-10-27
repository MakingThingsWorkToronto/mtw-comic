// Use the reader's pure layout validator so authoring and runtime accept the same phone-page schema. The runtime is
// loaded whole by the shared loader (no text slicing), so a helper the validator starts calling cannot break this gate.
import { loadRuntimeFunctions, readRuntime } from './lib/comic-runtime-functions.mjs';
const context = loadRuntimeFunctions({}, readRuntime());
if (typeof context.phonePagesValid !== 'function') throw new Error('Comic phone-page validator is missing');
// `phonePagesValid` defaults to the site runtime's; a regression passes another runtime's to test that copy.
export function checkComicPhone(scene, phonePagesValid = context.phonePagesValid) {
  const errors = [];
  if (scene.phonePages != null && !phonePagesValid(scene)) errors.push('phonePages must tile each page and contain every panel img exactly once in reading order, without insets');
  if (scene.artCropInsetPct != null && !(Number.isFinite(scene.artCropInsetPct) && scene.artCropInsetPct >= 0 && scene.artCropInsetPct <= 5)) errors.push('artCropInsetPct must be a finite percentage from 0 to 5');
  for (const panel of scene.panels || []) {
    if (panel.pageArt != null) {
      const r = panel.pageArt;
      if (!Array.isArray(r) || r.length !== 4 || r.some(n => !Number.isFinite(n) || n < 0) || r[2] <= 0 || r[3] <= 0 || r[0] + r[2] > 1 || r[1] + r[3] > 1) errors.push(`${panel.img}: pageArt must be a positive rectangle inside a desktop panel`);
    }
    if (panel.phoneArt != null) {
      const r = panel.phoneArt;
      if (!scene.phonePages || !Array.isArray(r) || r.length !== 4 || r.some(n => !Number.isFinite(n) || n < 0) || r[2] <= 0 || r[3] <= 0 || r[0] + r[2] > 1 || r[1] + r[3] > 1) errors.push(`${panel.img}: phoneArt must be a positive rectangle within an authored phone panel`);
    }
    for (const balloon of panel.balloons || []) {
      const p = balloon.phone; if (p == null) continue;
      if (!scene.phonePages || typeof p !== 'object' || Array.isArray(p) || Object.keys(p).some(k => !['x','y','w','tail','anchor','chain','reflow'].includes(k))) { errors.push(`${panel.img}: phone balloon overrides allow geometry and caption reflow only on authored phone pages`); continue; }
      for (const k of ['x','y','w']) if (p[k] != null && (!Number.isFinite(p[k]) || p[k] < 0 || p[k] > 1 || (k === 'w' && p[k] === 0))) errors.push(`${panel.img}: invalid phone balloon ${k}`);
      if (p.tail != null && (!Array.isArray(p.tail) || p.tail.length !== 2 || p.tail.some(n => !Number.isFinite(n) || n < 0 || n > 1))) errors.push(`${panel.img}: invalid phone tail`);
      if (p.anchor != null && p.anchor !== 'free') errors.push(`${panel.img}: invalid phone caption anchor`);
      if (p.reflow != null && (p.reflow !== 'paragraph' || !['caption','place'].includes(balloon.kind))) errors.push(`${panel.img}: phone paragraph reflow belongs only on caption/place lettering`);
      if (p.chain != null && typeof p.chain !== 'boolean') errors.push(`${panel.img}: invalid phone chain`);
    }
    if (panel.cropFocus == null) continue;
    if (typeof panel.cropFocus !== 'object' || Array.isArray(panel.cropFocus)) { errors.push(`${panel.img}: cropFocus must name phone and/or page`); continue; }
    for (const [mode, focus] of Object.entries(panel.cropFocus)) {
      if (!['phone', 'page'].includes(mode) || !Array.isArray(focus) || focus.length !== 2 || focus.some(n => !Number.isFinite(n) || n < 0 || n > 1)) errors.push(`${panel.img}: cropFocus.${mode} must contain two fractions from 0 to 1`);
    }
  }
  return errors;
}
