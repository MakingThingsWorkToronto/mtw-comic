#!/usr/bin/env node
// The Comic B golden reference (skill: mtw-comic-story, references/lettering-and-balloons.md "How to reproduce"; Matt,
// 2026-09-29: "looks perfect. standardize and update skill craft so this is reproducible"). The approved balloon, caption
// and lettering standard is frozen as renders plus measured parameters in the skill's assets/golden/ (both editions):
//   node scripts/comic-story-golden.mjs              compare new renders with the golden; exit 1 on a regression
//   node scripts/comic-story-golden.mjs --capture    (re)capture the golden: only after Matt approves a change
// Captures: the style lab over flat grey (?bg=grey: balloons without art, small files) and home-b's scenes as they render
// (boxes dark without art), at 1440x900, 1920x1080 and 390x844. Each render's balloons report their measured parameters
// (the engine's data-geom: font size, cap height, lines, leading, padding and body size in cap heights, stroke). The
// comparison fails when a parameter moves (lines or font size change, padding or stroke by more than 0.05c, body size by
// more than 4%), or the lab render differs (mean over 1 level, or more than 0.5% of pixels by more than 24 levels).
// Takes the browser lock in discussion/handoff/STATUS.md, like comic-story-shots.mjs. A comparison run's renders and diffs
// go to a new run folder in the image library (assets/experiments/comic-b/golden-compare/<run>/) and are registered there.
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { chromium } from 'playwright';
import { reviewDir, registerReview, browserLock, waitForBrowser } from './comic-story-library.mjs';

const here = dirname(fileURLToPath(import.meta.url)), repo = resolve(here, '..', '..');
const args = process.argv.slice(2), opt = (n, d) => { const i = args.indexOf(`--${n}`); return i > -1 ? args[i + 1] : d; };
const origin = opt('origin', 'http://localhost:8789'), capture = args.includes('--capture');
const gold = join(repo, '.claude/skills/mtw-comic-story/assets/golden'), gold2 = join(repo, '.codex/skills/mtw-comic-story/assets/golden');
const TARGETS = [
  { id: 'lab', path: '/comics/style-lab/', query: 'mute&reel=off&bg=grey', pixels: true },
  { id: 'home-quote', path: '/home-b/', query: 'mute&hold&scene=quote&beat=40' },
  { id: 'home-rolling', path: '/home-b/', query: 'mute&hold&scene=rolling&beat=20' },
];
const VIEWPORTS = [['desktop', { width: 1440, height: 900 }, 1], ['wide', { width: 1920, height: 1080 }, 1], ['phone', { width: 390, height: 844 }, 2]];
await waitForBrowser(20);
const renders = [];
browserLock('started', 'scripts/comic-story-golden.mjs');
try {
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    for (const t of TARGETS) for (const [vp, size, dpr] of VIEWPORTS) {
      const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: dpr, isMobile: vp === 'phone', hasTouch: vp === 'phone' });
      const page = await ctx.newPage();
      await page.goto(`${origin}${t.path}?${t.query}`, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts && document.fonts.ready);
      await page.waitForFunction(() => window.MTWComicStory && window.MTWComicStory.status().loaded, null, { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(700);
      const balloons = await page.evaluate(() => [...document.querySelectorAll('.cs-page.is-live .cs-bw')].filter((w) => getComputedStyle(w).opacity !== '0').map((w) => ({ kind: w.dataset.kind, state: w.dataset.state, text: (w.querySelector('.cs-b').getAttribute('aria-label') || '').slice(0, 40), geom: JSON.parse(w.dataset.geom || '{}') })));
      const png = await sharp(await page.locator('[data-comic-stage]').screenshot()).png({ palette: true, colours: 64, compressionLevel: 9 }).toBuffer();
      renders.push({ id: `${t.id}-${vp}`, target: t, vp, size, dpr, balloons, png });
      await ctx.close();
    }
  } finally { await browser.close(); }
} finally { browserLock('stopped', 'scripts/comic-story-golden.mjs'); }

if (capture) {
  for (const d of [gold, gold2]) mkdirSync(d, { recursive: true });
  const bsj = JSON.parse(readFileSync(join(repo, '.claude/skills/mtw-comic-story/assets/balloon-style.json'), 'utf8'));
  const manifest = { version: bsj.version, approved: bsj.approved, captured: new Date().toISOString(), config: 'assets/balloon-style.json', renders: renders.map((r) => ({ id: r.id, url: `${r.target.path}?${r.target.query}`, viewport: r.size, dpr: r.dpr, file: `${r.id}.png`, pixels: !!r.target.pixels, balloons: r.balloons })) };
  for (const r of renders) { writeFileSync(join(gold, `${r.id}.png`), r.png); copyFileSync(join(gold, `${r.id}.png`), join(gold2, `${r.id}.png`)); }
  const body = JSON.stringify(manifest, null, 1) + '\n';
  writeFileSync(join(gold, 'manifest.json'), body); writeFileSync(join(gold2, 'manifest.json'), body);
  console.log(`Golden captured: ${renders.length} renders in assets/golden/ (both skill editions).`);
  process.exit(0);
}

// ---------- Compare ----------
if (!existsSync(join(gold, 'manifest.json'))) { console.error('No golden yet: run with --capture after Matt approves.'); process.exit(2); }
const manifest = JSON.parse(readFileSync(join(gold, 'manifest.json'), 'utf8')), bad = [], lines = [];
const outDir = reviewDir('golden-compare'), saved = [];
for (const r of renders) {
  const g = manifest.renders.find((x) => x.id === r.id); if (!g) { bad.push(`${r.id}: not in the golden`); continue; }
  if (g.balloons.length !== r.balloons.length) bad.push(`${r.id}: ${r.balloons.length} balloons, golden ${g.balloons.length}`);
  r.balloons.forEach((b, i) => {
    const o = g.balloons[i]; if (!o) return; const a = b.geom, z = o.geom, tag = `${r.id} #${i + 1} ${b.kind} "${b.text.slice(0, 22)}"`;
    if (a.lines !== z.lines) bad.push(`${tag}: ${a.lines} lines, golden ${z.lines}`);
    if (Math.abs((a.fs || 0) - (z.fs || 0)) > 0.26) bad.push(`${tag}: font ${a.fs}px, golden ${z.fs}px`);
    for (const k of ['padX', 'padY', 'stroke', 'rule', 'lead']) if (a[k] != null && z[k] != null && Math.abs(a[k] - z[k]) > 0.05) bad.push(`${tag}: ${k} ${a[k]}c, golden ${z[k]}c`);
    for (const k of ['bodyW', 'bodyH', 'boxW', 'boxH']) if (a[k] && z[k] && Math.abs(a[k] - z[k]) / z[k] > 0.04) bad.push(`${tag}: ${k} ${a[k]}c, golden ${z[k]}c`);
  });
  if (g.pixels) {
    const A = await sharp(r.png).removeAlpha().raw().toBuffer({ resolveWithObject: true }), B = await sharp(join(gold, g.file)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    if (A.info.width !== B.info.width || A.info.height !== B.info.height) { bad.push(`${r.id}: render ${A.info.width}x${A.info.height}, golden ${B.info.width}x${B.info.height}`); continue; }
    let sum = 0, big = 0; const n = A.data.length / 3, diff = Buffer.alloc(A.data.length);
    for (let i = 0; i < A.data.length; i += 3) { const d = (Math.abs(A.data[i] - B.data[i]) + Math.abs(A.data[i + 1] - B.data[i + 1]) + Math.abs(A.data[i + 2] - B.data[i + 2])) / 3; sum += d; if (d > 24) { big++; diff[i] = 255; } }
    const mean = sum / n, frac = big / n;
    lines.push(`- ${r.id}: mean pixel difference ${mean.toFixed(2)} levels, ${(frac * 100).toFixed(2)}% of pixels over 24 levels`);
    if (mean > 1 || frac > 0.005) { bad.push(`${r.id}: the lab render moved (mean ${mean.toFixed(2)}, ${(frac * 100).toFixed(2)}% over 24 levels; diff in ${outDir})`); await sharp(diff, { raw: { width: A.info.width, height: A.info.height, channels: 3 } }).png().toFile(join(outDir, `${r.id}-diff.png`)); saved.push([join(outDir, `${r.id}-diff.png`), `${r.id} difference from the golden`]); }
  }
  writeFileSync(join(outDir, `${r.id}.png`), r.png); saved.push([join(outDir, `${r.id}.png`), `${r.id} render`]);
}
registerReview(saved.map(([path, what]) => ({ path, group: 'golden comparisons', title: `Golden compare ${path.split(/[\\/]/).slice(-2, -1)[0]} ${what}`, note: `Balloon-standard golden comparison: ${what} (scripts/comic-story-golden.mjs).` })));
console.log(lines.join('\n'));
if (bad.length) { console.log(`\nGOLDEN REGRESSION (${bad.length}):\n- ${bad.join('\n- ')}\nIf Matt approved this change, re-capture with --capture.`); process.exit(1); }
console.log(`\ngolden: ${renders.length} renders match the approved standard (${manifest.approved}).`);
