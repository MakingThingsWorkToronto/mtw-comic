// Comic layout check (skill: mtw-comic-story). Verifies box geometry, variety and phone pages for a story.
// Usage: node scripts/comics/layout-check.mjs --story <slug|path> [--scene <id>] [--min 5] [--json]
// Exit 0 pass, 1 an error found, 2 usage. Warnings never fail.
import path from 'node:path';
import { loadStory, storyPathFor, layoutSignature } from './lib/story.mjs';

const area = (r) => r[2] * r[3];
const q02 = (n) => Math.round(n / 0.02) * 0.02;
const sizeKey = (r) => `${q02(r[2]).toFixed(2)}x${q02(r[3]).toFixed(2)}`;
const inter = (a, b) => Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]));
const IMG = /^[a-z0-9][a-z0-9-]*$/;

function overlaps(rects, errors, label) {
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const o = inter(rects[i], rects[j]), m = Math.min(area(rects[i]), area(rects[j]));
    if (m > 0 && o / m > 0.02) errors.push(`${label}: boxes ${i + 1} and ${j + 1} overlap by ${(100 * o / m).toFixed(1)}% of the smaller`);
  }
}
function coverage(rects) {
  const N = 200; let hit = 0;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const px = (x + 0.5) / N, py = (y + 0.5) / N;
    if (rects.some((r) => px >= r[0] && px < r[0] + r[2] && py >= r[1] && py < r[1] + r[3])) hit++;
  }
  return hit / (N * N);
}

export function checkScene(scene, min) {
  const errors = [], warnings = [];
  const main = scene.panels.filter((p) => !p.host);
  const rects = main.map((p) => p.r);
  if (main.length < min) errors.push(`only ${main.length} non-inset boxes (minimum ${min})`);
  scene.panels.forEach((p, i) => {
    const r = p.r;
    if (!Array.isArray(r) || r.length !== 4 || r.some((n) => typeof n !== 'number')) return errors.push(`box ${i + 1}: r is not [x,y,w,h]`);
    if (r[0] < 0 || r[1] < 0 || r[0] + r[2] > 1.0001 || r[1] + r[3] > 1.0001) errors.push(`box ${i + 1}: r ${JSON.stringify(r)} leaves the page`);
    if (r[2] < 0.12 || r[3] < 0.15) errors.push(`box ${i + 1}: r ${JSON.stringify(r)} below minimum size (w>=0.12, h>=0.15)`);
    if (!p.alt || !String(p.alt).trim()) errors.push(`box ${i + 1}: empty alt`);
    const img = p.img ?? p.id;
    if (!img || !IMG.test(img)) errors.push(`box ${i + 1}: img "${img ?? ''}" must match ${IMG}`);
  });
  if (rects.every((r) => Array.isArray(r) && r.length === 4)) {
    overlaps(rects, errors, 'page');
    const cov = coverage(rects);
    if (cov < 0.85) errors.push(`coverage ${(cov * 100).toFixed(0)}% of the page (minimum 85%)`);
    if (!scene.rapid && rects.length) {
      const areas = rects.map(area).sort((a, b) => a - b), mid = Math.floor(areas.length / 2);
      const median = areas.length % 2 ? areas[mid] : (areas[mid - 1] + areas[mid]) / 2;
      if (areas[areas.length - 1] < 1.5 * median) errors.push(`no dominant box: largest ${areas[areas.length - 1].toFixed(3)} < 1.5 x median ${median.toFixed(3)}`);
      const tiers = {};
      rects.forEach((r) => { tiers[sizeKey(r)] = (tiers[sizeKey(r)] || 0) + 1; });
      for (const [k, n] of Object.entries(tiers)) if (n > 2) errors.push(`${n} boxes share size ${k}; equal tiers only in a rapid scene`);
    }
  }
  if (scene.phonePages) checkPhone(scene, main, errors);
  else warnings.push('phonePages missing; runtime reflow will be used');
  return { id: scene.id, boxes: main.length, errors, warnings, signature: layoutSignature(scene) };
}

function checkPhone(scene, main, errors) {
  const pages = scene.phonePages, seen = [];
  pages.forEach((pg, i) => {
    const label = `phonePages[${i}]`, rects = pg.map((e) => e.r);
    const sum = rects.reduce((s, r) => s + area(r), 0);
    if (Math.abs(sum - 1) > 0.03) errors.push(`${label}: areas sum to ${sum.toFixed(3)}, expected 1 +-0.03`);
    overlaps(rects, errors, label);
    const need = i === pages.length - 1 ? 2 : 3;
    if (pg.length < need) errors.push(`${label}: ${pg.length} boxes (minimum ${need})`);
    pg.forEach((e) => seen.push(e.img));
  });
  const want = main.map((p) => p.img ?? p.id);
  for (const img of want) { const n = seen.filter((s) => s === img).length; if (n !== 1) errors.push(`phonePages: ${img} appears ${n} times (expected once)`); }
  for (const img of seen) if (!want.includes(img)) errors.push(`phonePages: ${img} is not a non-inset box of the scene`);
  if (want.every((w) => seen.filter((s) => s === w).length === 1) && seen.length === want.length && want.join() !== seen.join()) errors.push('phonePages: not in reading order');
}

export function checkStory(story, { scene, min = 5 } = {}) {
  const all = story.scenes.map((s) => checkScene(s, min));
  const sizes = story.scenes.map((s) => s.panels.filter((p) => !p.host).map((p) => sizeKey(p.r)).sort().join('|'));
  all.forEach((rep, i) => {
    for (let j = 0; j < i; j++) {
      if (all[j].signature === rep.signature) { rep.errors.push(`same layout signature as scene ${all[j].id}`); break; }
      if (sizes[j] === sizes[i]) { rep.errors.push(`same multiset of box sizes as scene ${all[j].id}`); break; }
    }
  });
  return scene ? all.filter((r) => r.id === scene) : all;
}

function main() {
  const a = process.argv.slice(2), opt = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--json') opt.json = true;
    else if (['--story', '--scene', '--min'].includes(a[i]) && a[i + 1] !== undefined) opt[a[i].slice(2)] = a[++i];
    else { console.error(`unknown argument ${a[i]}`); process.exit(2); }
  }
  if (!opt.story) { console.error('usage: node scripts/comics/layout-check.mjs --story <slug|path> [--scene <id>] [--min 5] [--json]'); process.exit(2); }
  const file = /[\/]|\.ts$/.test(opt.story) ? path.resolve(opt.story) : storyPathFor(opt.story);
  const { story } = loadStory(file);
  if (opt.scene && !story.scenes.some((s) => s.id === opt.scene)) { console.error(`scene ${opt.scene} not found`); process.exit(2); }
  const report = checkStory(story, { scene: opt.scene, min: Number(opt.min ?? 5) });
  const failed = report.some((r) => r.errors.length);
  if (opt.json) console.log(JSON.stringify({ story: story.id, ok: !failed, scenes: report }, null, 2));
  else {
    for (const r of report) {
      console.log(`${r.errors.length ? 'FAIL' : 'ok  '} ${r.id}: ${r.boxes} boxes`);
      r.errors.forEach((e) => console.log(`  error: ${e}`));
      r.warnings.forEach((w) => console.log(`  warning: ${w}`));
    }
    console.log(failed ? `FAIL: ${report.filter((r) => r.errors.length).length} of ${report.length} scenes have errors` : `PASS: ${report.length} scenes`);
  }
  process.exit(failed ? 1 : 0);
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))) main();
