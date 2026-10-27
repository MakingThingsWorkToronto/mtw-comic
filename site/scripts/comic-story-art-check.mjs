// Actual Comic B media dependencies. Keep these paths aligned with comic-story.js artUrl/artSrcset.
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {comicLayerErrors,comicLayerAssetErrors} from './comic-layer-contract.mjs';
import {comicViewErrors,comicViewAssetErrors} from './comic-view-contract.mjs';

export function comicArtUrl(img, storyId) {
  return img.startsWith('/') ? img : `/comic/${storyId}/${img}.svg`;
}

export function checkArtFile(url, { publicDir, label, requireArt = false, maxKB = null }) {
  const severity = requireArt ? 'ERROR' : 'WARN';
  if (!url) return [[severity, `${label}: art not declared`]];
  const file = join(publicDir, url);
  if (!existsSync(file) || !statSync(file).isFile()) return [[severity, `${label}: art not found (${url})`]];
  const size = statSync(file).size;
  if (size === 0) return [[severity, `${label}: art is empty (${url})`]];
  return maxKB && size > maxKB * 1024 ? [['WARN', `${label}: art is ${(size / 1024).toFixed(0)} KB (over ${maxKB} KB; ${url})`]] : [];
}

export function checkComicArt(story, { publicDir, widths, requireArt = false, resolveChoice }) {
  const out = [];
  const check = (url, label, maxKB = null) => out.push(...checkArtFile(url, { publicDir, label, requireArt, maxKB }));
  for (const scene of story.scenes || []) {
    const label = `scene ${scene.id}`;
    for(const message of [...comicLayerErrors(scene,story),...comicLayerAssetErrors(scene,publicDir),...comicViewErrors(scene,story),...comicViewAssetErrors(scene,publicDir)])out.push(['ERROR',`${label}: ${message}`]);
    if (scene.art) {
      const url = comicArtUrl(scene.art, story.id);
      if (/\.svg$/i.test(scene.art)) check(url, `${label} page`, 900);
      else {
        const stem = url.replace(/\.svg$/i, '');
        const formats = scene.artFormats ?? ['avif', 'webp'];
        if (!Array.isArray(formats) || !formats.length || formats.some(ext => !['avif','webp'].includes(ext)) || new Set(formats).size !== formats.length) out.push(['ERROR', `${label}: artFormats must declare distinct supported avif/webp fallback formats`]);
        else for (const width of widths) for (const ext of formats) check(`${stem}-${width}.${ext}`, `${label} page`);
      }
      // Both page-art paths supply every panel; p.img is retained story provenance, never fetched here.
      continue;
    }
    for (const [index, panel] of (scene.panels || []).entries()) {
      check(panel.img ? comicArtUrl(panel.img, story.id) : null, `${label} panel ${index + 1}`, 200);
    }
  }
  for (const [index, choice] of (story.next?.choices || []).entries()) {
    const url = choice.img ? resolveChoice(choice.img, story) : null;
    check(url, `choice ${index + 1} "${choice.label}"`);
  }
  return out;
}
