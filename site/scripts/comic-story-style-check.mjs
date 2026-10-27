#!/usr/bin/env node
// The Comic B style check (skill: mtw-comic-story, checks.md; Matt, 2026-09-28: "visually verify you are in the style
// boundary first with font and colors and bubble style"). One command:
//   node scripts/comic-story-style-check.mjs [--url http://127.0.0.1:8789/comics/style-lab/] [--wait 20] [--no-codex]
// 1. Waits while discussion/handoff/STATUS.md shows an open "browser run started" line without a later "stopped" (one
//    browser at a time), then records its own start and stop there.
// 2. Screenshots the style lab (Chrome, headless) at 1440x900 and 390x844: the comic and the lettering and colour sheet.
// 3. Builds a comparison sheet with sharp: the lab beside the reference crops in scripts/comic-story-style-refs.json
//    (crops of discussion/reference-comics/, read in place and never copied into site/).
// 4. Asks Codex to score it (codex exec, read-only, with the sheet and the reference pages as images): lettering, balloon
//    shapes and tails, captions, colours within the dark black-and-teal choice, each 0-100, overall, and concrete fixes.
//    Writes the sheet to the image library (assets/experiments/comic-b/style-checks/style-check-<n>.png, registered) and
//    the report beside its record (records/comic-b-review-style-checks-style-check-<n>/comic-review/v1/codex-score.md).
//    The gate is 95 overall (Matt: "95% same style").
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { chromium } from 'playwright';
import { reviewDir, registerReview, recordDir, browserLock, waitForBrowser, library } from './comic-story-library.mjs';

const here = dirname(fileURLToPath(import.meta.url)), site = resolve(here, '..'), repo = resolve(site, '..');
const args = process.argv.slice(2), opt = (n, d) => { const i = args.indexOf(`--${n}`); return i > -1 ? args[i + 1] : d; };
const url = opt('url', 'http://127.0.0.1:8789/comics/style-lab/'), waitMin = +opt('wait', 20);
const outDir = reviewDir('style-checks', null), refDir = join(repo, 'discussion/reference-comics');
const refs = JSON.parse(readFileSync(join(here, 'comic-story-style-refs.json'), 'utf8')).crops;

// ---------- 1. One browser at a time ----------
await waitForBrowser(waitMin);
browserLock('started', 'scripts/comic-story-style-check.mjs');
const n = 1 + Math.max(0, ...readdirSync(outDir).map((f) => (f.match(/^style-check-(\d+)\.png$/) || [])[1]).filter(Boolean).map(Number));
const shots = {}, geom = {}, seam = {};
try {
  // ---------- 2. Screenshots ----------
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    for (const [name, vp] of [['desktop', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844 }]]) {
      const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2 });
      const page = await ctx.newPage();
      await page.goto(url + (url.includes('?') ? '&' : '?') + 'mute', { waitUntil: 'load' });
      await page.evaluate(() => document.fonts && document.fonts.ready);
      await page.waitForFunction(() => window.MTWComicStory && window.MTWComicStory.status().loaded, null, { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(600);
      // Geometry measured in the render against the page constants (whole pixels, within 1 px; Matt, 2026-09-28: "matched
      // pixel for pixel in source"): the outer margins on each side and every gutter between neighbouring boxes.
      geom[name] = await page.evaluate(() => {
        const stage = document.querySelector('[data-comic-stage]'), g = JSON.parse(stage.getAttribute('data-geom') || '{}');
        const pg = document.querySelector('.cs-page.is-live'), pr = pg.getBoundingClientRect();
        const bx = [...pg.querySelectorAll('.cs-panel')].filter((e) => !e.classList.contains('is-inset') && getComputedStyle(e).opacity !== '0').map((e) => { const r = e.getBoundingClientRect(); return { l: r.left - pr.left, t: r.top - pr.top, r: r.right - pr.left, b: r.bottom - pr.top }; });
        const W = pr.width, H = pr.height, gaps = [], ov = (a1, a2, b1, b2) => Math.min(a2, b2) - Math.max(a1, b1) > 4;
        bx.forEach((a) => bx.forEach((b) => { if (a === b) return; if (b.l >= a.r - 0.5 && b.l - a.r < 60 && ov(a.t, a.b, b.t, b.b)) gaps.push(Math.round((b.l - a.r) * 100) / 100); if (b.t >= a.b - 0.5 && b.t - a.b < 60 && ov(a.l, a.r, b.l, b.r)) gaps.push(Math.round((b.t - a.b) * 100) / 100); }));
        return { target: g, page: [W, H], margins: { l: Math.min(...bx.map((b) => b.l)), t: Math.min(...bx.map((b) => b.t)), r: W - Math.max(...bx.map((b) => b.r)), b: H - Math.max(...bx.map((b) => b.b)) }, gutters: [...new Set(gaps)].sort((a, b) => a - b) };
      });
      shots[`${name}-comic`] = await page.locator('[data-comic-stage]').screenshot();
      shots[`${name}-type`] = await page.locator('[data-lab-swatches]').screenshot();
      await ctx.close();
    }
    // The seam test (Matt, 2026-09-28: "an obvious overlay opacity issue in their stems. you will need to improve visual
    // verification"): every balloon over flat mid-grey (?bg=grey), still; its fill sampled inside its eroded paper shape,
    // lettering excluded. A fill that varies more than 2 levels has a double-alpha seam, a gap or a halo at a join.
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      // The mean test's render: the balloons' grain and the page texture on.
      await page.goto(url + (url.includes('?') ? '&' : '?') + 'mute&reel=off&bg=grey', { waitUntil: 'load' });
      await page.evaluate(() => document.fonts && document.fonts.ready);
      await page.waitForTimeout(800);
      seam.shotTex = await page.screenshot();
      // The seam test's render: the balloons' own grain off (?grain=off), so a double-alpha stem cannot hide in it.
      await page.goto(url + (url.includes('?') ? '&' : '?') + 'mute&reel=off&bg=grey&grain=off', { waitUntil: 'load' });
      await page.evaluate(() => document.fonts && document.fonts.ready);
      await page.waitForTimeout(800);
      seam.shot = await page.screenshot();
      seam.balloons = await page.evaluate(() => [...document.querySelectorAll('.cs-page.is-live .cs-bw')].map((w, i) => {
        const svg = w.querySelector('.cs-bshape'), sr = svg.getBoundingClientRect(), kind = (w.querySelector('.cs-b').className.match(/cs-b--(\w+)/) || [])[1];
        const fills = [...svg.querySelectorAll('[fill]')].filter((e) => { const f = e.getAttribute('fill'); return f && f !== 'none' && !/0a0a0a|#000|#fff/i.test(f) && !e.closest('mask'); });
        const shapes = fills.map((e) => e.tagName === 'g' ? e.innerHTML : e.outerHTML).join('');
        const pg = fills.map((e) => { try { return e.getBBox(); } catch (x) { return null; } }).filter(Boolean);
        const bb = pg.length ? pg.reduce((a, b) => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), r: Math.max(a.r, b.x + b.width), b: Math.max(a.b, b.y + b.height) }), { x: 1e9, y: 1e9, r: -1e9, b: -1e9 }) : null;
        // Lettering of every balloon on the page is excluded (a chained balloon's words sit inside its head's paper).
        const text = [...document.querySelectorAll('.cs-page.is-live .cs-line')].map((t) => { const r = t.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }); // each composed line, so the paper between and beside short lines is sampled
        const own = w.querySelector('.cs-b').getBoundingClientRect(), paper = svg.querySelector('.cs-paper');
        // For the IoU: a seed inside the paper just above the lettering; for a joined group (chain, across), each
        // balloon's own body-and-tail path (no neck), placed on the page.
        const parts = paper && paper.tagName === 'g' ? [paper.querySelector(':scope > path'), ...[...paper.querySelectorAll(':scope > g[data-part]')].map((g) => g.querySelector('path'))].filter(Boolean).map((p) => { const t = (p.getAttribute('transform') || '').match(/translate\(([-\d.]+) ([-\d.]+)\)/) || [0, 0, 0]; return { d: p.getAttribute('d'), x: sr.left + +t[1], y: sr.top + +t[2] }; }) : [];
        const homeBox = w.closest('.cs-panel'), inner = [...document.querySelectorAll('.cs-page.is-live .cs-panel')].filter((e) => !w.classList.contains('is-breakout') || e === homeBox).filter((e) => getComputedStyle(e).opacity !== '0').map((e) => { const r = e.getBoundingClientRect(), bw = +(JSON.parse(document.querySelector('[data-comic-stage]').getAttribute('data-geom') || '{}').border || 2) + 1; return [r.left + bw, r.top + bw, r.width - 2 * bw, r.height - 2 * bw, e.classList.contains('is-inset')]; });
        const fillHex = paper && paper.getAttribute('fill'), alpha = paper ? +(paper.getAttribute('opacity') || paper.getAttribute('fill-opacity') || 1) : 1;
        return { i, kind, inner, fillHex, alpha, state: w.dataset.state, member: !paper, group: parts.length > 1, parts, seed: [own.left + own.width / 2, own.top - 4], seedL: [own.left - 3, own.top + own.height / 2], ox: sr.left, oy: sr.top, shapes, bbox: bb && { x: bb.x + sr.left, y: bb.y + sr.top, w: bb.r - bb.x, h: bb.b - bb.y }, text };
      }));
      await ctx.close();
    }
  } finally { await browser.close(); }
} finally { browserLock('stopped', 'scripts/comic-story-style-check.mjs'); }

// ---------- 2b. The seam test ----------
const seamLines = [], meanLines = [];
if (seam.shot) {
  const { data: px, info } = await sharp(seam.shot).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data: pt } = await sharp(seam.shotTex).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const SW = info.width, SH = info.height;
  for (const b of seam.balloons) {
    if (!b.shapes || !b.bbox) continue;
    const white = b.shapes.replace(/fill="[^"]*"/g, 'fill="#fff"').replace(/fill-opacity="[^"]*"/g, '').replace(/opacity="[^"]*"/g, '');
    const holes = b.text.map(([x, y, w, h]) => `<rect x="${x - 2}" y="${y - 1}" width="${w + 4}" height="${h + 2}" fill="#000"/>`).join('');
    const mask = `<svg xmlns="http://www.w3.org/2000/svg" width="${SW}" height="${SH}"><rect width="100%" height="100%" fill="#000"/><g transform="translate(${b.ox} ${b.oy})" fill="#fff">${white}</g>${holes}</svg>`;
    const { data: m } = await sharp(Buffer.from(mask)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    // Only over flat grey: inside a box's interior, never over a border, a gutter or an inset's gutter band. A breakout is
    // sampled inside its own box only (over the rules, gutters and boxes it crosses its paper is opaque, by design).
    const inBox = (x, y) => { let hit = false; for (const [l, t, w, h, ins] of b.inner) { if (x >= l && x < l + w && y >= t && y < t + h) hit = true; else if (ins && x >= l - 14 && x < l + w + 14 && y >= t - 14 && y < t + h + 14) return false; } return hit; };
    const R = b.kind === 'caption' || b.kind === 'place' ? 3 : 2, x0 = Math.max(R, Math.floor(b.bbox.x)), y0 = Math.max(R, Math.floor(b.bbox.y)), x1 = Math.min(SW - R - 1, Math.ceil(b.bbox.x + b.bbox.w)), y1 = Math.min(SH - R - 1, Math.ceil(b.bbox.y + b.bbox.h));
    // The seam is judged on the grain-free render (px); the balloon's mean, with the grain and the page texture on (pt), is
    // held to its measured fill (the mean test; Matt, 2026-09-29).
    const vals = new Map();
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      let inside = true;
      for (let dy = -R; dy <= R && inside; dy++) for (let dx = -R; dx <= R; dx++) if (m[((y + dy) * SW + (x + dx)) * 3] < 128) { inside = false; break; }
      if (!inside || !inBox(x, y)) continue;
      const k = (y * SW + x) * 3; vals.set(y * SW + x, 0.2126 * px[k] + 0.7152 * px[k + 1] + 0.0722 * px[k + 2]);
    }
    let lo = 255, hi = 0, n = 0, sum = 0;
    for (const [key, L] of vals) {
      const x = key % SW, k = key * 3; sum += 0.2126 * pt[k] + 0.7152 * pt[k + 1] + 0.0722 * pt[k + 2];
      if (L < lo) { lo = L; b.at = [x, (key - x) / SW]; } if (L > hi) hi = L; n++;
    }
    lo = Math.round(lo * 10) / 10; hi = Math.round(hi * 10) / 10;
    const ok = !n || hi - lo <= 2;
    seamLines.push(`- balloon ${b.i + 1} (${b.kind}): fill ${n ? `${lo}-${hi}` : 'not sampled'} over ${n} px. ${ok ? 'OK' : 'SEAM: the fill varies ' + (hi - lo).toFixed(1) + ' levels (double alpha, a gap or a halo at a join; darkest at ' + b.at.join(',') + ')'}`);
    // The mean test: the rendered mean over flat grey must be the measured fill composited at its alpha, within 1 level
    // (the grain and the page texture must not shift a balloon's colour; Matt, 2026-09-29).
    // The mean needs enough interior to average the grain (a tight balloon's interior is mostly lettering holes): 150 px.
    if (vals.size < 150 && b.fillHex) meanLines.push(`- balloon ${b.i + 1} (${b.kind}): mean not measured (${vals.size} interior px; needs 150)`);
    else if (vals.size && b.fillHex && /^#[0-9a-f]{6}$/i.test(b.fillHex)) {
      let bs = 0, bn = 0;
      for (let y = Math.max(0, Math.floor(b.bbox.y - 14)); y <= Math.min(SH - 1, Math.ceil(b.bbox.y + b.bbox.h + 14)); y++) for (let x = Math.max(0, Math.floor(b.bbox.x - 14)); x <= Math.min(SW - 1, Math.ceil(b.bbox.x + b.bbox.w + 14)); x++) {
        if (m[(y * SW + x) * 3] >= 128 || !inBox(x, y)) continue; const k = (y * SW + x) * 3, L = 0.2126 * pt[k] + 0.7152 * pt[k + 1] + 0.0722 * pt[k + 2]; if (L < 100 || L > 160) continue; bs += L; bn++;
      }
      const h = b.fillHex.slice(1), Lf = 0.2126 * parseInt(h.slice(0, 2), 16) + 0.7152 * parseInt(h.slice(2, 4), 16) + 0.0722 * parseInt(h.slice(4, 6), 16);
      if (bn > 20) { const bg = bs / bn, want = b.alpha * Lf + (1 - b.alpha) * bg, got = sum / vals.size, d = got - want; meanLines.push(`- balloon ${b.i + 1} (${b.kind}, ${b.fillHex} at ${b.alpha}): mean ${got.toFixed(1)}, expected ${want.toFixed(1)} over grey ${bg.toFixed(1)}: ${d >= 0 ? '+' : ''}${d.toFixed(2)} levels ${Math.abs(d) <= 1 ? 'OK' : 'SHIFTED (more than 1 level)'}`); }
    }
  }
  console.log(seamLines.join('\n')); console.log(meanLines.join('\n'));
}

// ---------- 2c. Silhouette IoU against the reference outlines ----------
// .claude/skills/mtw-comic-story/assets/reference-balloons/report.md "Metric": each balloon's silhouette (paper only, body and tail, no outline)
// is centred on its box, scaled so its longer side is 92 on a 96 x 96 grid, and compared by IoU with every reference
// outline of its kind (shapes.json samples); its score is the best match. Measured on the grey render as measure.cjs
// measures the references (flood fill from inside the paper, lettering holes filled); a joined group's balloons (chain,
// across) are rasterized from their own body-and-tail paths. Target: every balloon at least 0.78, the median 0.85.
const iouLines = [], iouScores = [];
{
  const shapesFile = join(repo, '.claude/skills/mtw-comic-story/assets/reference-balloons/shapes.json');
  if (!existsSync(shapesFile)) throw new Error(`Missing measured reference balloon shapes: ${shapesFile}`);
  if (seam.shot && existsSync(shapesFile)) {
    const G = 96, S = 92, refsBy = {};
    const rasterPoly = (pts) => {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      pts.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
      const s = S / Math.max(x1 - x0, y1 - y0), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, m = new Uint8Array(G * G);
      for (let gy = 0; gy < G; gy++) for (let gx = 0; gx < G; gx++) {
        const x = (gx + 0.5 - G / 2) / s + cx, y = (gy + 0.5 - G / 2) / s + cy; let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside; }
        m[gy * G + gx] = inside ? 1 : 0;
      }
      return m;
    };
    for (const smp of JSON.parse(readFileSync(shapesFile, 'utf8')).samples) {
      const cls = smp.kind === 'speech-yellow' ? 'speech' : smp.kind === 'shaken' ? 'fear' : smp.kind;
      const pts = smp.path_cap_units.replace(/^M|Z$/g, '').split('L').map((q) => q.split(',').map(Number));
      (refsBy[cls] = refsBy[cls] || []).push({ id: smp.id, page: smp.page, m: rasterPoly(pts) });
    }
    const rasterMask = (mask, w, h) => {
      let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y * w + x]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      const s = S / Math.max(x1 - x0 + 1, y1 - y0 + 1), cx = (x0 + x1 + 1) / 2, cy = (y0 + y1 + 1) / 2, m = new Uint8Array(G * G);
      for (let gy = 0; gy < G; gy++) for (let gx = 0; gx < G; gx++) { const x = Math.floor((gx + 0.5 - G / 2) / s + cx), y = Math.floor((gy + 0.5 - G / 2) / s + cy); m[gy * G + gx] = x >= 0 && y >= 0 && x < w && y < h ? mask[y * w + x] : 0; }
      return m;
    };
    const iouOf = (a, b) => { let i = 0, u = 0; for (let k = 0; k < a.length; k++) { if (a[k] && b[k]) i++; if (a[k] || b[k]) u++; } return u ? i / u : 0; };
    const { data: px, info } = await sharp(seam.shot).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const SW = info.width, SH = info.height;
    const fromPixels = (b, seed) => {
      // Flood fill the paper from the seed (colour within 45 of it), inside the balloon's box, then fill the holes.
      const pad = 8, X0 = Math.max(0, Math.floor(b.bbox.x - pad)), Y0 = Math.max(0, Math.floor(b.bbox.y - pad)), X1 = Math.min(SW - 1, Math.ceil(b.bbox.x + b.bbox.w + pad)), Y1 = Math.min(SH - 1, Math.ceil(b.bbox.y + b.bbox.h + pad)), w = X1 - X0 + 1, h = Y1 - Y0 + 1;
      const at = (x, y) => (y * SW + x) * 3, sx = Math.round(seed[0]), sy = Math.round(seed[1]);
      if (sx < X0 || sx > X1 || sy < Y0 || sy > Y1) return null;
      const k0 = at(sx, sy), r0 = px[k0], g0 = px[k0 + 1], b0 = px[k0 + 2], inC = new Uint8Array(w * h), st = [[sx - X0, sy - Y0]];
      inC[(sy - Y0) * w + sx - X0] = 1;
      while (st.length) {
        const [x, y] = st.pop();
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h || inC[ny * w + nx]) continue;
          const k = at(nx + X0, ny + Y0); if (Math.hypot(px[k] - r0, px[k + 1] - g0, px[k + 2] - b0) < 45) { inC[ny * w + nx] = 1; st.push([nx, ny]); }
        }
      }
      const reach = new Uint8Array(w * h), q = [];
      for (let x = 0; x < w; x++) for (const y of [0, h - 1]) if (!inC[y * w + x] && !reach[y * w + x]) { reach[y * w + x] = 1; q.push([x, y]); }
      for (let y = 0; y < h; y++) for (const x of [0, w - 1]) if (!inC[y * w + x] && !reach[y * w + x]) { reach[y * w + x] = 1; q.push([x, y]); }
      while (q.length) {
        const [x, y] = q.pop();
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue; const k = ny * w + nx; if (!reach[k] && !inC[k]) { reach[k] = 1; q.push([nx, ny]); } }
      }
      const M = new Uint8Array(w * h); let area = 0; for (let k = 0; k < w * h; k++) { M[k] = reach[k] ? 0 : 1; area += M[k]; }
      return area > 50 ? rasterMask(M, w, h) : null;
    };
    const fromPath = async (p) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SW}" height="${SH}"><rect width="100%" height="100%" fill="#000"/><path transform="translate(${p.x} ${p.y})" d="${p.d}" fill="#fff"/></svg>`;
      const { data } = await sharp(Buffer.from(svg)).removeAlpha().greyscale().raw().toBuffer({ resolveWithObject: true });
      const M = new Uint8Array(SW * SH); for (let k = 0; k < M.length; k++) M[k] = data[k] > 127 ? 1 : 0;
      return rasterMask(M, SW, SH);
    };
    const capLike = (b) => b.kind === 'caption' || b.kind === 'place' || (b.kind === 'thought' && !b.parts.length);
    const clsOf = (b) => capLike(b) ? 'caption' : b.kind === 'burst' ? 'burst' : b.kind === 'fear' ? 'fear' : 'speech';
    for (const b of seam.balloons) {
      if (b.member || !b.bbox) continue;
      const items = b.group
        ? await Promise.all(b.parts.map(async (p, k) => ({ label: `${b.i + 1}${String.fromCharCode(97 + k)}`, m: await fromPath(p), how: 'path' })))
        : [{ label: `${b.i + 1}`, m: fromPixels(b, capLike(b) ? b.seedL : b.seed), how: 'pixels' }];
      for (const it of items) {
        // The metric compares with the reference speech outlines; a shaken balloon also with the shaken ones.
        const cls = clsOf(b), refs = cls === 'fear' ? [...refsBy.speech, ...(refsBy.fear || [])] : refsBy[cls] || refsBy.speech;
        if (!it.m) { iouLines.push(`- balloon ${it.label} (${b.kind}, ${b.state}): not measured (no seed inside the paper)`); continue; }
        let best = 0, bid = null; for (const r of refs) { const v = iouOf(it.m, r.m); if (v > best) { best = v; bid = r; } }
        // An off-panel voice is reported, not gated: its long thin tail (6-10c, the recipe) has no single reference outline to
        // compare with (the one off-panel balloon, X-Men #132, was measured as part of a joined cluster, shapes.json id 13), and
        // against the short-tailed speech outlines the tail alone keeps it under 0.78.
        if (b.state === 'offpanel') { iouLines.push(`- balloon ${it.label} (${b.kind}, offpanel; ${it.how}): IoU ${best.toFixed(3)} (reported, not gated: no single off-panel reference outline)`); continue; }
        iouScores.push(best);
        iouLines.push(`- balloon ${it.label} (${b.kind}, ${b.state}; ${it.how}): IoU ${best.toFixed(3)} against ${cls} sample ${bid && bid.id} (${bid && bid.page}) ${best >= 0.78 ? 'OK' : 'BELOW 0.78'}`);
      }
    }
    const med = iouScores.slice().sort((a, b) => a - b)[Math.floor(iouScores.length / 2)] || 0;
    iouLines.push(`- median ${med.toFixed(3)} over ${iouScores.length} balloons (target 0.85); minimum ${Math.min(...iouScores).toFixed(3)} (target 0.78). ${med >= 0.85 && Math.min(...iouScores) >= 0.78 ? 'PASS' : 'FAIL'}`);
    console.log(iouLines.join('\n'));
  }
}

// ---------- 3. Comparison sheet ----------
const W = 1800, colL = 1080, colR = W - colL - 60, pad = 20;
const left = [await sharp(shots['desktop-comic']).resize({ width: colL }).png().toBuffer(), await sharp(shots['desktop-type']).resize({ width: colL }).png().toBuffer(), await sharp(shots['phone-comic']).resize({ width: 420 }).png().toBuffer()];
const right = [];
for (const r of refs) {
  if (r.crop) { right.push(await sharp(join(repo, r.crop)).resize({ width: Math.floor(colR / 2) - 10, height: 200, fit: 'inside' }).png().toBuffer()); continue; }
  const file = join(refDir, r.file), meta = await sharp(file).metadata();
  const [x, y, w, h] = r.box, box = { left: Math.max(0, x), top: Math.max(0, y), width: Math.min(w, meta.width - Math.max(0, x)), height: Math.min(h, meta.height - Math.max(0, y)) };
  const lab = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${Math.floor(colR / 2) - 10}" height="16"><text x="0" y="12" font-family="Arial" font-size="12" fill="#ddd">${(r.name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text></svg>`);
  const img = await sharp(file).extract(box).resize({ width: r.half ? Math.floor(colR / 2) - 10 : colR, height: r.half ? 190 : undefined, fit: 'inside' }).png().toBuffer();
  const im = await sharp(img).metadata();
  right.push(await sharp({ create: { width: Math.floor(colR / 2) - 10 > im.width ? Math.floor(colR / 2) - 10 : im.width, height: im.height + 18, channels: 3, background: '#1b1f21' } }).composite([{ input: lab, left: 0, top: 0 }, { input: img, left: 0, top: 18 }]).png().toBuffer());
}
const heights = async (bufs) => Promise.all(bufs.map(async (b) => (await sharp(b).metadata()).height));
const hl = await heights(left), hr = await heights(right);
const H = Math.max(hl.reduce((a, b) => a + b + pad, pad), hr.reduce((a, b) => a + b + pad, pad) / 1.6) + 60;
const comps = [];
let y = 40; left.forEach((b, i) => { comps.push({ input: b, left: pad, top: y }); y += hl[i] + pad; });
y = 40; { let col = 0, rowH = 0; right.forEach((b, i) => { const half = refs[i].crop || refs[i].half; if (half) { comps.push({ input: b, left: colL + 40 + col * Math.floor(colR / 2), top: y }); rowH = Math.max(rowH, hr[i]); col++; if (col === 2) { y += rowH + pad; col = 0; rowH = 0; } } else { if (col) { y += rowH + pad; col = 0; rowH = 0; } comps.push({ input: b, left: colL + 40, top: y }); y += hr[i] + pad; } }); if (col) y += rowH + pad; }
const crops = [];
if (seam.shot) for (const b of (seam.balloons || []).slice(0, 12)) {
  if (!b.bbox) continue;
  const meta = await sharp(seam.shot).metadata(), pad = 6, l = Math.max(0, Math.floor(b.bbox.x - pad)), t = Math.max(0, Math.floor(b.bbox.y - pad));
  const w = Math.min(meta.width - l, Math.ceil(b.bbox.w + 2 * pad)), h = Math.min(meta.height - t, Math.ceil(b.bbox.h + 2 * pad));
  if (w > 4 && h > 4) crops.push(await sharp(seam.shot).extract({ left: l, top: t, width: w, height: h }).resize({ width: Math.min(560, w * 4), kernel: 'nearest' }).png().toBuffer());
}
let cy = Math.ceil(H), cx = pad, rowH = 0;
for (const c of crops) { const m = await sharp(c).metadata(); if (cx + m.width > W) { cx = pad; cy += rowH + pad; rowH = 0; } comps.push({ input: c, left: cx, top: cy }); cx += m.width + pad; rowH = Math.max(rowH, m.height); }
const Hall = cy + rowH + pad;
const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="36"><text x="${pad}" y="26" font-family="Arial" font-size="20" fill="#ddd">OURS: the style lab (desktop comic, lettering and colours, phone)</text><text x="${colL + 40}" y="26" font-family="Arial" font-size="20" fill="#ddd">REFERENCES: balloon, caption and lettering crops</text></svg>`);
comps.push({ input: label, left: 0, top: 0 });
const sheetPath = join(outDir, `style-check-${n}.png`);
await sharp({ create: { width: W, height: Math.ceil(Math.max(H, Hall)), channels: 3, background: '#1b1f21' } }).composite(comps).png().toFile(sheetPath);
console.log(`Sheet: ${sheetPath}`);

// ---------- 4. Codex scores it ----------
mkdirSync(recordDir(sheetPath), { recursive: true });
const md = join(recordDir(sheetPath), 'codex-score.md'), mdRel = md.slice(library.length + 1).split('\\').join('/');
const register = () => registerReview([{ path: sheetPath, group: 'style checks', title: `Style check ${String(n).padStart(2, '0')}`, note: `Style lab render beside reference crops (scripts/comic-story-style-check.mjs). Codex score and geometry: ${mdRel}.` }]);
const geomLines = Object.entries(geom).map(([vp, g]) => {
  const t = g.target || {}, m = t.margin || {}, bad = [];
  g.gutters.forEach((v) => { if (Math.abs(v - t.gutter) > 1) bad.push(`a gutter of ${v}px (target ${t.gutter}px)`); });
  ['l', 't', 'r', 'b'].forEach((k) => { if (m[k] != null && Math.abs(g.margins[k] - m[k]) > 1 && g.margins[k] > 0.5) bad.push(`margin ${k} ${g.margins[k].toFixed(1)}px (target ${m[k]}px)`); });
  return `- ${vp} (${g.page.map((v) => Math.round(v)).join(' x ')} px): gutters ${g.gutters.join(', ')} px (target ${t.gutter}); margins l ${g.margins.l.toFixed(1)}, t ${g.margins.t.toFixed(1)}, r ${g.margins.r.toFixed(1)}, b ${g.margins.b.toFixed(1)} px (target ${JSON.stringify(m)}); border ${t.border}px. ${bad.length ? 'MISMATCH: ' + bad.join('; ') : 'All within 1 px.'}`;
}).join('\n');
console.log(geomLines);
if (args.includes('--no-codex')) { writeFileSync(md, `# Comic B style check ${n}\n\n## Geometry in the render\n\n${geomLines}\n\n## Balloon seams\n\n${seamLines.join('\n') || 'not run'}\n\n## Balloon mean colour (texture on, within 1 level of the measured fill)\n\n${meanLines.join('\n') || 'not run'}\n\n## Silhouette IoU\n\n${iouLines.join('\n') || 'not run'}\n\nSheet: style-check-${n}.png. Codex scoring skipped (--no-codex).\n`); register(); process.exit(0); }
const prov = JSON.parse(readFileSync(join(repo, '.claude/skills/mtw-comic-story/assets/style-provenance.json'), 'utf8'));
const exceptionList = Object.entries(prov.exceptions || {}).map(([k, v]) => `${k} (${v})`).join('; ');
const prompt = `You are judging a web comic's STYLE against 1966-1985 American comic reference pages. Image 1 is a comparison sheet: left, our style lab (every balloon kind over calibration art on a deliberately dark ground; our lettering and colour swatches; a phone view); right, crops of the reference balloons, captions and lettering; below, our balloons at 4x on flat grey (look hard at every tail join, chain neck, cloud bead and caption corner). The other images are the full reference pages.
Matt's fixed choices (do not mark down): the dark black-and-teal art and ground around a brand-teal page (#1a9ba1 frames, gutters, inset surrounds and margins, with retained subtle paper texture); teal as the only clean light; balloon and caption fills slightly translucent; Kalam 700 (Matt's chosen lettering face, 2026-09-30: its own forward lean and weight are his choice; stress is the same face slanted further and heavier) and Bangers for shouts, both open-licence; the calibration art behind the balloons is a placeholder (judge the balloons, captions, lettering and colour, not the art). Every balloon kind in the lab comes from the references' usage table: speech (tail to the mouth), chain (one speaker, joined by a neck, only the last has a tail), butted (cut by the border), across panels (a connector over the gutter), off-panel (long thin tail to the panel edge), a device or chat voice (an ordinary balloon whose tail runs to the screen), weak voice (zigzag tail), menace (red wavy second outline), inner thought (a yellow caption in quotation marks, or a yellow-filled speech balloon), shout (white burst), scream (red burst), panic (angular burst, heavy italic), shaken or spooked (scalloped balloon), narration and place captions (square, yellow #eae619, thin black rule, butted into a corner).
Score 0-100 how closely ours matches the references' style in each of: (1) lettering: font, weight, case, size, line spacing, line breaks, emphasis; (2) balloon shapes and tails, for every kind above; (3) captions: shape, rule, fill, placement, lettering; (4) colour within the fixed choices; (5) geometry: padding, stroke weights and tail proportions in cap heights. Then an overall score. Our target is 95 in each.
For every category under 95 give concrete, measurable fixes (sizes relative to page width, stroke weights, padding in cap heights, line pitch, tail geometry, font changes naming free SIL OFL fonts). Then an INVENTION pass: list every visual element in image 1 that does not appear in the reference pages (images 2..n) and is not in this exceptions list: ${exceptionList}. The gate requires this list to be empty.
Output Markdown: a score table, then the fixes as a numbered list, most important first, then a section "Invented" listing each invented element (or "none"). Do not suggest changing Matt's fixed choices.`;
const images = [sheetPath, ...[...new Set(refs.map((r) => join(refDir, r.file)))]];
const res = spawnSync('codex', ['exec', '--skip-git-repo-check', '-s', 'read-only', ...images.flatMap((f) => ['-i', f]), '-'], { input: prompt, encoding: 'utf8', maxBuffer: 1 << 26, shell: process.platform === 'win32' });
const body = (res.stdout || '').trim() || `(codex exec failed: ${res.stderr || res.error})`;
writeFileSync(md, `# Comic B style check ${n} (${new Date().toISOString().slice(0, 10)})\n\n## Geometry in the render (page constants, within 1 px)\n\n${geomLines}\n\n## Balloon seams (flat grey, fill range at most 2 levels)\n\n${seamLines.join('\n') || 'not run'}\n\n## Balloon mean colour (texture on, within 1 level of the measured fill)\n\n${meanLines.join('\n') || 'not run'}\n\n## Silhouette IoU against the reference outlines (each at least 0.78, median at least 0.85)\n\n${iouLines.join('\n') || 'not run'}\n\n## Style\n\nSheet: [style-check-${n}.png](style-check-${n}.png). Lab: ${url}. Reference crops: site/scripts/comic-story-style-refs.json. Scored by Codex (read-only).\n\n${body}\n`);
console.log(`Report: ${md}`);
register();
