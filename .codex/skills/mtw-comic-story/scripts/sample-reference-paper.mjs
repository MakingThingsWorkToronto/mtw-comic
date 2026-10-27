#!/usr/bin/env node
// Re-derive the Comic B page constants from a set of reference comic pages (skill: mtw-comic-story; Matt, 2026-09-28:
// "Match the margin colors too. but needs to be minimal ... make repeatable"). For each page it finds the gutters and
// margins (rows and columns that are almost entirely light, unsaturated paper), takes the median paper colour of those
// pixels and the widths of the interior gutter runs and the outer margins as a percentage of the page's short side, then
// reports the medians across pages. With --write it updates assets/page-constants.json (the one source the engine, the
// deslop lint and the art template read) and keeps every other field.
// Usage (from the repo root; sharp comes from site/node_modules):
//   node .claude/skills/mtw-comic-story/scripts/sample-reference-paper.mjs [--dir wiki/image-library/assets/originals/comic-references] [--write]
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url)), skill = resolve(here, '..');
const args = process.argv.slice(2), opt = (n, d) => { const i = args.indexOf(`--${n}`); return i > -1 ? args[i + 1] : d; };
const repo = resolve(opt('repo', process.cwd())), dir = resolve(repo, opt('dir', 'wiki/image-library/assets/originals/comic-references'));
const require = createRequire(join(repo, 'site', 'package.json')), sharp = require('sharp');
const median = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
const hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

const files = readdirSync(dir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f) && !/\(1\)/.test(f));
const perPage = [];
for (const f of files) {
  const { data, info } = await sharp(join(dir, f)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, short = Math.min(W, H);
  const isPaper = (i) => { const r = data[i], g = data[i + 1], b = data[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx > 190 && (mx - mn) / mx < 0.2; };
  const rowFrac = new Array(H).fill(0), colFrac = new Array(W).fill(0);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (isPaper((y * W + x) * 3)) { rowFrac[y]++; colFrac[x]++; }
  const rows = rowFrac.map((c) => c / W > 0.9), cols = colFrac.map((c) => c / H > 0.9);
  const runs = (flags) => { const out = []; let s = -1; flags.forEach((v, i) => { if (v && s < 0) s = i; if ((!v || i === flags.length - 1) && s >= 0) { out.push([s, v ? i : i - 1]); s = -1; } }); return out; };
  const rr = runs(rows), cr = runs(cols), n = (a, len) => a.map(([s, e]) => ({ s, e, w: e - s + 1, edge: s === 0 || e === len - 1 }));
  const all = [...n(rr, H), ...n(cr, W)];
  const gutters = all.filter((r) => !r.edge).map((r) => (r.w / short) * 100), margins = all.filter((r) => r.edge).map((r) => (r.w / short) * 100);
  // Each outer margin on its own side (printed pages are not symmetric): top, bottom, left, right.
  const side = (list, atStart, len) => { const r = list.find((q) => (atStart ? q.s === 0 : q.e === len - 1)); return r ? ((r.e - r.s + 1) / short) * 100 : 0; };
  const sides = { top: side(n(rr, H), true, H), bottom: side(n(rr, H), false, H), left: side(n(cr, W), true, W), right: side(n(cr, W), false, W) };
  // Border weight: the run of ink on each side of an interior gutter, sampled along it.
  const dark = (i) => { const r = data[i], g = data[i + 1], b = data[i + 2]; return (r + g + b) / 3 < 70; };
  const inkRuns = [];
  for (const g of n(rr, H).filter((r) => !r.edge)) for (let x = Math.floor(W * 0.1); x < W * 0.9; x += Math.max(1, Math.floor(W / 40))) {
    let k = 0; for (let y = g.s - 1; y >= 0 && k < 20 && dark((y * W + x) * 3); y--) k++; if (k && k < 20) inkRuns.push(k);
    k = 0; for (let y = g.e + 1; y < H && k < 20 && dark((y * W + x) * 3); y++) k++; if (k && k < 20) inkRuns.push(k);
  }
  for (const g of n(cr, W).filter((r) => !r.edge)) for (let y = Math.floor(H * 0.1); y < H * 0.9; y += Math.max(1, Math.floor(H / 40))) {
    let k = 0; for (let x = g.s - 1; x >= 0 && k < 20 && dark((y * W + x) * 3); x--) k++; if (k && k < 20) inkRuns.push(k);
    k = 0; for (let x = g.e + 1; x < W && k < 20 && dark((y * W + x) * 3); x++) k++; if (k && k < 20) inkRuns.push(k);
  }
  const borderPct = inkRuns.length ? (median(inkRuns) / short) * 100 : null;
  const px = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if ((rows[y] || cols[x]) && isPaper((y * W + x) * 3)) { const i = (y * W + x) * 3; px.push([data[i], data[i + 1], data[i + 2]]); }
  if (!px.length) { console.log(`${f}: no paper gutters found (full-bleed or dark page), skipped`); continue; }
  const paper = [0, 1, 2].map((k) => median(px.map((p) => p[k])));
  perPage.push({ file: f, paper: hex(...paper), gutterPct: median(gutters), marginPct: median(margins), sides, borderPct, gutters: gutters.length, width: W, height: H });
  console.log(`${f} (${W}x${H}): paper ${hex(...paper)}, gutter ${median(gutters)?.toFixed(2)}% of the short side (${gutters.length} runs), margin ${median(margins)?.toFixed(2)}%, border ${borderPct?.toFixed(2)}%`);
}
const pick = (k) => median(perPage.map((p) => p[k]).filter((v) => v != null));
const papers = perPage.map((p) => p.paper), paperMed = hex(...[1, 3, 5].map((o) => median(papers.map((h) => parseInt(h.slice(o, o + 2), 16)))));
const sideMed = Object.fromEntries(['top', 'bottom', 'left', 'right'].map((k) => [k, +(median(perPage.map((p) => p.sides[k])) || 0).toFixed(3)]));
// Printed paper: clean digital scans come back pure white; the photographed and reprinted pages keep the paper's warmth.
const printed = perPage.filter((p) => p.paper !== '#ffffff' && p.paper !== '#fefefe'), printedPaper = printed.length ? hex(...[1, 3, 5].map((o) => median(printed.map((p) => parseInt(p.paper.slice(o, o + 2), 16))))) : null;
const result = { paper: paperMed, printedPaper, marginSidesPct: sideMed, gutterPct: +(pick('gutterPct') || 0).toFixed(3), marginPct: +(pick('marginPct') || 0).toFixed(3), borderPct: +(pick('borderPct') || 0).toFixed(3), pages: perPage.length, perPage: perPage.map((p) => ({ file: p.file, size: `${p.width}x${p.height}`, paper: p.paper, gutterPct: p.gutterPct && +p.gutterPct.toFixed(3), marginPct: p.marginPct && +p.marginPct.toFixed(3), sides: Object.fromEntries(Object.entries(p.sides).map(([k, v]) => [k, +v.toFixed(3)])), borderPct: p.borderPct && +p.borderPct.toFixed(3) })) };
console.log('\nMedians across pages:', JSON.stringify(result));
// ---------- Printed paper colour and texture (Matt, 2026-09-29: "make reference color and texture") ----------
// Blank paper only (never art or lettering), from the printed references' margins. The tile is a multiply layer: white
// where the paper is at its median, a few levels darker in its fibres, seamless by mirroring, subtle by design.
const PAPER_CROPS = [
  { file: 'AllTime-Comics-15.jpg', box: [60, 5, 780, 45] },
  { file: 'the-death-of-barry-allen-photo-u1.jpg', box: [1, 150, 9, 700] },
];
const cropPx = [];
for (const c of PAPER_CROPS) {
  const f = join(dir, c.file); if (!existsSync(f)) continue;
  const { data } = await sharp(f).extract({ left: c.box[0], top: c.box[1], width: c.box[2], height: c.box[3] }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 3) cropPx.push([data[i], data[i + 1], data[i + 2]]);
}
const printedHex = cropPx.length ? hex(...[0, 1, 2].map((k) => median(cropPx.map((p) => p[k])))) : null;
let tileInfo = null;
{
  // The paper texture (Matt, 2026-09-29: "make reference color and texture"; engine round 2: non-repeating to the eye). Only
  // the photographed page (Crisis #8, printed) carries real paper grain; the AllTime page's paper is flat digital colour.
  // Its blank margins (TILE_CROPS, checked: no ink, luminance 200-253) are cut into small patches, each with its own tone
  // removed; the patches, picked at random (and at random turns), are overlap-added with raised-cosine windows onto a
  // wrap-around 512 px grid, so the tile is seamless without mirroring. A faint low-frequency tone field (periodic, the
  // margins' measured large-scale variation) is added, and the grain is scaled to the crops' measured deviation. The page
  // layers the tile twice at coprime sizes and offsets (comic-story.css .cs-paperfx), so its period never shows.
  const TILE_CROPS = [
    { file: 'the-death-of-barry-allen-photo-u1.jpg', box: [1, 40, 9, 1000] },
    { file: 'the-death-of-barry-allen-photo-u1.jpg', box: [697, 0, 11, 500] },
  ];
  const srcs = [];
  for (const c of TILE_CROPS) {
    const f = join(dir, c.file); if (!existsSync(f)) continue;
    const { data, info } = await sharp(f).extract({ left: c.box[0], top: c.box[1], width: c.box[2], height: c.box[3] }).greyscale().raw().toBuffer({ resolveWithObject: true });
    srcs.push({ d: Float64Array.from(data), w: info.width, h: info.height });
  }
  if (srcs.length) {
    let seed = 20260929; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    const P = 8, S = P / 2, T = 512, acc = new Float64Array(T * T), win = [];
    for (let i = 0; i < P; i++) win.push(Math.sin(Math.PI * (i + 0.5) / P) ** 2); // Hann: 50% overlaps sum to 1
    // Grain deviation and large-scale tone, measured on the crops (patch means against a 64 px running mean).
    const devs = [], tones = [];
    for (const s of srcs) {
      const means = [];
      for (let y = 0; y + P <= s.h; y += P) { let m = 0; for (let yy = 0; yy < P; yy++) for (let x = 0; x < Math.min(P, s.w); x++) m += s.d[(y + yy) * s.w + x]; means.push(m / (P * Math.min(P, s.w))); }
      means.forEach((m, i) => { const lo = Math.max(0, i - 4), hi = Math.min(means.length, i + 5); let r = 0; for (let k = lo; k < hi; k++) r += means[k]; tones.push(m - r / (hi - lo)); });
      for (let y = 0; y + P <= s.h; y += P) { let m = 0, v = 0, n = 0; for (let yy = 0; yy < P; yy++) for (let x = 0; x < s.w; x++) { m += s.d[(y + yy) * s.w + x]; n++; } m /= n; for (let yy = 0; yy < P; yy++) for (let x = 0; x < s.w; x++) v += (s.d[(y + yy) * s.w + x] - m) ** 2; devs.push(Math.sqrt(v / n)); }
    }
    const grainSd = median(devs), toneSd = Math.sqrt(tones.reduce((a, v) => a + v * v, 0) / tones.length);
    for (let ty = 0; ty < T; ty += S) for (let tx = 0; tx < T; tx += S) {
      const s = srcs[Math.floor(rnd() * srcs.length)], pw = Math.min(P, s.w), sx = Math.floor(rnd() * (s.w - pw + 1)), sy = Math.floor(rnd() * (s.h - P)), turn = Math.floor(rnd() * 4);
      const patch = new Float64Array(P * P); let m = 0;
      for (let y = 0; y < P; y++) for (let x = 0; x < P; x++) { const v = s.d[(sy + y) * s.w + sx + Math.min(x, pw - 1)]; patch[y * P + x] = v; m += v; }
      m /= P * P;
      for (let y = 0; y < P; y++) for (let x = 0; x < P; x++) {
        const [u, v] = turn === 0 ? [x, y] : turn === 1 ? [P - 1 - y, x] : turn === 2 ? [P - 1 - x, P - 1 - y] : [y, P - 1 - x];
        acc[((ty + v) % T) * T + ((tx + u) % T)] += (patch[y * P + x] - m) * win[u] * win[v];
      }
    }
    let sd = 0; for (const v of acc) sd += v * v; sd = Math.sqrt(sd / acc.length);
    // A periodic low-frequency tone field, a few waves with random phases.
    const waves = []; while (waves.length < 10) { const a = Math.floor(rnd() * 7) - 3, b = Math.floor(rnd() * 7) - 3; if (a || b) waves.push([a, b, rnd() * 6.2832]); } // isotropic: no banding
    const tone = new Float64Array(T * T); let tsd = 0;
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { let v = 0; for (const [a, b, ph] of waves) v += Math.cos(6.2832 * (a * x + b * y) / T + ph); tone[y * T + x] = v; tsd += v * v; }
    tsd = Math.sqrt(tsd / tone.length);
    // Two layers multiply on the page, so each carries the deviation divided by the square root of two.
    const k = 1 / Math.SQRT2, tile = Buffer.alloc(T * T), grain = grainSd / (sd || 1) * k, tk = 0.6 * toneSd / (tsd || 1) * k, off = 1.6 * Math.hypot(grainSd, 0.6 * toneSd) * k;
    for (let i = 0; i < T * T; i++) tile[i] = Math.max(0, Math.min(255, Math.round(255 - off + acc[i] * grain + tone[i] * tk)));
    const outDir = join(repo, 'site/public/comic/_paper');
    (await import('node:fs')).mkdirSync(outDir, { recursive: true });
    await sharp(tile, { raw: { width: T, height: T, channels: 1 } }).webp({ quality: 88 }).toFile(join(outDir, 'paper-tile-512.webp'));
    // Balloons and captions keep their measured colour on average (Matt, 2026-09-29: "i want the speech bubbles to match
    // the reference images" with "if you need to add texture do it"): they carry the same grain as two masks, one lighting
    // and one darkening the fill by the same factor (at most 4.5%), so the grain shows and the mean stays. Stored at 256 px and
    // drawn at 512: a pixel of the photographed page (710 px wide) is about two pixels of our page, so the fibres keep scale.
    const kMax = 0.045, gl = Buffer.alloc(T * T), gd = Buffer.alloc(T * T);
    for (let i = 0; i < T * T; i++) { const a = (acc[i] * grainSd / (sd || 1)) / 244 / kMax; gl[i] = Math.min(255, Math.round(Math.max(0, a) * 255)); gd[i] = Math.min(255, Math.round(Math.max(0, -a) * 255)); }
    await sharp(gl, { raw: { width: T, height: T, channels: 1 } }).resize(T / 2, T / 2).webp({ quality: 72 }).toFile(join(outDir, 'paper-grain-light.webp'));
    await sharp(gd, { raw: { width: T, height: T, channels: 1 } }).resize(T / 2, T / 2).webp({ quality: 72 }).toFile(join(outDir, 'paper-grain-dark.webp'));
    let lo = 255, hi = 0; for (const v of tile) { if (v < lo) lo = v; if (v > hi) hi = v; }
    tileInfo = { path: '/comic/_paper/paper-tile-512.webp', size: T, layers: [[512, 0, 0], [397, 173, 89]], grain: { light: '/comic/_paper/paper-grain-light.webp', dark: '/comic/_paper/paper-grain-dark.webp', k: kMax, size: T / 2, drawn: T }, from: TILE_CROPS, grainSd: +grainSd.toFixed(2), toneSd: +toneSd.toFixed(2), range: [lo, hi] };
    console.log(`Paper tile: site/public/comic/_paper/paper-tile-512.webp (${T}x${T}, grain sd ${grainSd.toFixed(2)}, tone sd ${toneSd.toFixed(2)}, multiply values ${lo}-${hi})`);
  }
}
console.log(`Printed paper colour (blank margin crops): ${printedHex}`);
if (args.includes('--write')) {
  for (const ed of ['.claude', '.codex']) {
    const p = join(repo, ed, 'skills', 'mtw-comic-story', 'assets', 'page-constants.json');
    const cur = existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {};
    // The page takes the references' ratios exactly (Matt, 2026-09-28: "matched pixel for pixel in source"), of the short side.
        // The page is printed paper: colour and texture from the printed references' blank margins (Matt, 2026-09-29: "make the
    // margin look like paper, not bright white"); the clean scans' white is kept as scanWhite.
    cur.page = { ...(cur.page || {}), separator: '#1a9ba1', paper: printedHex || result.printedPaper || result.paper, scanWhite: result.paper, paperTile: tileInfo && tileInfo.path, paperTileLayers: tileInfo && tileInfo.layers, paperGrain: tileInfo && tileInfo.grain, paperCrops: PAPER_CROPS, printedPaper: result.printedPaper, gutterPct: result.gutterPct, marginPct: result.marginPct, marginSidesPct: result.marginSidesPct, borderPct: result.borderPct };
    cur.derived = { ...(cur.derived || {}), fromReferences: { ...result, sampled: new Date().toISOString().slice(0, 10), by: 'scripts/sample-reference-paper.mjs' } };
    writeFileSync(p, JSON.stringify(cur, null, 2) + '\n');
    console.log(`Wrote ${p}`);
  }
}