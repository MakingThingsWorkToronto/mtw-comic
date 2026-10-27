// Put new box art in front of Matt fast (skill: mtw-comic-story, "Fast path"). Copies images into site/public and
// gives each named box its art: one image (staticArt) or a plane stack (two views: base, then layers + layerMotion).
// The Astro dev server on 8789 shows the change at once. These are preview copies; canonical registration follows
// in one wave and replaces each canonicalSource "pending-registration" binding.
// Usage (from site/): node scripts/comic-box-preview.mjs <spec.json>
// spec: { "story": "src/data/comic-stories/home.ts", "publicDir": "comic/home/preview-20261012", "fillAll": true,
//   "boxes": [ { "img": "home-floors-light", "src": "<repo-relative>.png" },
//     { "img": "home-brain-initialize", "layers": [{ "id": "base", "role": "background", "src": "..." }, ...],
//       "layerMotion": [{ "layerId": "floor-01", "preset": "sprout", "floors": 7, "floorIndex": 1, ... }] } ] }
// fillAll: every desktop box's art covers the whole box and balloons overlay it (no letterbox bars). Phone reserves stay.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const site = process.cwd(), repo = path.dirname(site);
const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf8').replace(/^﻿/, ''));
const storyPath = path.resolve(site, spec.story), text = fs.readFileSync(storyPath, 'utf8');
const open = text.indexOf('retime({') + 'retime('.length, close = text.lastIndexOf('});') + 1;
if (open < 'retime('.length || close <= open) throw new Error(`${spec.story}: expected "retime({ ...JSON... });"`);
const story = JSON.parse(text.slice(open, close));
const outDir = path.join(site, 'public', spec.publicDir);
fs.mkdirSync(outDir, { recursive: true });
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const { default: sharp } = await import('sharp');
const jobs = [];
// 1600-wide WebP (alpha kept): full-size PNGs time out decoding in the reader.
const publish = (box, name, src) => {
  const from = path.resolve(repo, src), file = `${box.img}-${name}.webp`;
  jobs.push(sharp(from).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 86, alphaQuality: 90 }).toFile(path.join(outDir, file)));
  return { src: `/${spec.publicDir}/${file}`, canonicalSource: { panelId: box.img, path: path.relative(repo, from).replaceAll('\\', '/'), sha256: sha(from), recordId: 'pending-registration', treatment: 'comic-ink' } };
};
const panels = story.scenes.flatMap(sc => sc.panels);
for (const box of spec.boxes || []) {
  const panel = panels.find(p => p.img === box.img);
  if (!panel) throw new Error(`Box ${box.img} not found in ${spec.story}`);
  delete panel.staticArt; delete panel.views;
  if (box.layers) {
    const layers = box.layers.map(l => ({ id: l.id, role: l.role, ...publish(box, l.id, l.src) }));
    const base = { id: 'preview-base', at: 0, alt: panel.alt, fit: 'cover', ar: [0, 0, 1, 1], src: layers[0].src, canonicalSource: layers[0].canonicalSource };
    panel.views = [base, { ...base, id: 'preview-stack', at: box.stackAt ?? 1, layers, layerMotion: box.layerMotion || [] }];
  } else panel.staticArt = { ar: [0, 0, 1, 1], fit: 'cover', ...publish(box, 'v', box.src) };
  console.log(`${box.img}: ${box.layers ? box.layers.length + ' planes' : 'single image'} -> /${spec.publicDir}/`);
}
if (spec.fillAll) {
  for (const p of panels) { p.artFit = 'cover'; if (p.pageArt) p.pageArt = [0, 0, 1, 1]; }
  console.log(`fillAll: ${panels.length} boxes cover their desktop box`);
}
await Promise.all(jobs);
fs.writeFileSync(storyPath, text.slice(0, open) + JSON.stringify(story, null, 2) + text.slice(close));
