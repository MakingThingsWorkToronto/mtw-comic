const fs = require('fs');
const sharp = require('C:/Code/MTWWebsite-clean/site/node_modules/sharp');
const SP = process.argv[2]; const OUT = process.argv[3];
const S = JSON.parse(fs.readFileSync(SP + '/shapes-raw.json'));
const q = (a, p) => { a = a.filter((v) => Number.isFinite(v)).sort((x, y) => x - y); if (!a.length) return null; const i = (a.length - 1) * p; const lo = Math.floor(i), hi = Math.ceil(i); return +(a[lo] + (a[hi] - a[lo]) * (i - lo)).toFixed(3); };
const dist = (a) => ({ n: a.filter(Number.isFinite).length, p10: q(a, 0.1), p25: q(a, 0.25), median: q(a, 0.5), p75: q(a, 0.75), p90: q(a, 0.9) });
const groups = {
  speech: [4, 5, 7, 8, 9, 17, 18, 19, 20, 21, 22, 23, 24, 29, 30, 31, 32, 34, 35, 36, 39, 42, 46, 48, 52, 53, 55, 63, 67],
  speech_free: [4, 5, 17, 18, 19, 20, 21, 22, 23, 24, 30, 31, 32, 35, 36, 39, 42, 46, 48, 52, 55, 63, 67],
  shaken: [44, 45, 47],
  burst: [6, 12, 16, 38, 50, 57, 58, 59, 60, 62, 65, 11],
  caption: [1, 26, 27, 28, 61, 64, 66],
  chain: [2, 10, 37, 41, 43],
  cluster: [0, 13, 15, 40],
};
const by = (ids) => ids.map((i) => S[i]);
const tailsOf = (arr) => arr.flatMap((s) => s.tails.filter((t) => t.len_cap >= 0.9 && t.span_deg < 90));
const sp = by(groups.speech_free);
const out = { source: 'Reference pages in discussion/reference-comics/ (Matt\'s style references). Units: cap = the balloon\'s own lettering cap height. Measured 2026-09-29 by segmentation (sharp) on 2-3x upscaled scans; every silhouette checked on overlay crops.', counts: {}, speech: {}, shaken: {}, burst: {}, caption: {}, chain: {}, lettering: {}, usage: [] };
for (const [k, v] of Object.entries(groups)) out.counts[k] = v.length;
out.speech = {
  superellipse_n: dist(sp.map((s) => s.body.n)),
  aspect_a_over_b: dist(sp.map((s) => s.body.aspect)),
  padX_cap_from_text_edge_to_body_axis: dist(sp.map((s) => s.body.padX_cap)),
  padY_cap: dist(sp.map((s) => s.body.padY_cap)),
  bbox_pad_cap: { left: dist(sp.map((s) => s.pad_cap.l)), right: dist(sp.map((s) => s.pad_cap.r)), top: dist(sp.map((s) => s.pad_cap.t)), bottom: dist(sp.map((s) => s.pad_cap.b)) },
  fit_residual_cap: dist(sp.map((s) => s.body.resid_med_cap)),
  contour_roughness_cap: dist(sp.map((s) => s.rough_cap)),
  outline_stroke_cap: dist(by(groups.speech).map((s) => s.stroke_cap).filter((v) => v > 0.1 && v < 0.5)),
  outline_stroke_cv: dist(by(groups.speech).map((s) => s.stroke_px.cv)),
  lines: dist(sp.map((s) => s.lines)),
  tails: { len_cap: dist(tailsOf(by(groups.speech)).map((t) => t.len_cap)), base_width_frac_of_body_width: dist(tailsOf(by(groups.speech)).map((t) => t.baseW_frac)), angular_span_deg: dist(tailsOf(by(groups.speech)).map((t) => t.span_deg)), tip_offset_from_base_mid_deg: dist(tailsOf(by(groups.speech)).map((t) => Math.abs(t.tipOffset_deg))) },
  fill_hex_examples: [...new Set(by(groups.speech).map((s) => s.fill))].slice(0, 12),
};
const sh = by(groups.shaken);
out.shaken = { contour_roughness_cap: dist(sh.map((s) => s.rough_cap)), superellipse_n: dist(sh.map((s) => s.body.n)), bumps_per_outline: dist(sh.map((s) => s.peaks)), note: 'Scalloped/wavy contour, ~14-17 small bumps round the balloon; same fill, lettering and stroke as speech. Roughness 4-5x ordinary speech.' };
const bu = by(groups.burst);
out.burst = { spike_count: dist(bu.map((s) => s.peaks)), outline_stroke_cap: dist(bu.map((s) => s.stroke_cap)), cap_px_vs_speech_cap: dist(bu.map((s) => s.cap_px / 15)), fills: [...new Set(bu.map((s) => s.fill))] };
const ca = by(groups.caption);
out.caption = { corner_fill_ratio: dist(ca.map((s) => s.fillRatio)), contour_roughness_cap: dist(ca.map((s) => s.rough_cap)), pad_cap: { left: dist(ca.map((s) => s.pad_cap.l)), right: dist(ca.map((s) => s.pad_cap.r)), top: dist(ca.map((s) => s.pad_cap.t)), bottom: dist(ca.map((s) => s.pad_cap.b)) }, lead_cap: dist(ca.map((s) => s.lead_cap)), rule_stroke_cap: dist(ca.map((s) => s.stroke_cap)), fills: ca.map((s) => ({ page: s.page, fill: s.fill })) };
const all = S.filter((s) => s.lead_cap && s.lines > 1 && !groups.cluster.includes(s.id));
out.lettering = { baseline_to_baseline_cap: dist(all.map((s) => s.lead_cap)), line_width_cap: dist(sp.flatMap((s) => s.lineW_cap)), est_chars_per_line: dist(sp.flatMap((s) => s.lineW_cap.map((w) => w / 0.78))),
  line_profile: dist(sp.filter((s) => s.lines >= 3).map((s) => { const m = Math.max(...s.lineW_cap); return (s.lineW_cap[0] + s.lineW_cap[s.lineW_cap.length - 1]) / 2 / m; })),
  cap_height_frac_of_page_width: dist(S.filter((s) => ['speech', 'caption', 'chain', 'shaken'].includes(s.kind)).map((s) => s.cap_px / ({ '97e641f3.png': 1278, '3f8e7bfd.png': 1278, '83ca1685.png': 1278, 'd3617ce6.png': 1278, 'images.j.png': 1356, 'swwvm51d.png': 1080, 'AllTime-.png': 1800 }[s.page]))) };
out.samples = S.filter((s) => [...groups.speech_free, ...groups.shaken, ...groups.burst, ...groups.caption].includes(s.id)).map((s) => ({ id: s.id, page: s.page, kind: s.kind, lines: s.lines, n: s.body.n, aspect: s.body.aspect, path_cap_units: s.path }));
fs.writeFileSync(OUT + '/shapes.raw-per-shape.json', JSON.stringify(S.map(({ path, ...r }) => r), null, 1));
fs.writeFileSync(OUT + '/shapes.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify({ ...out, samples: out.samples.length }, null, 1));
(async () => {
  // silhouette sheet of normalized outlines
  const cell = 200, cols = 8; const items = out.samples; const rows = Math.ceil(items.length / cols);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cols * cell}" height="${rows * cell}"><rect width="100%" height="100%" fill="#111"/>${items.map((s, i) => { const x = (i % cols) * cell + cell / 2, y = Math.floor(i / cols) * cell + cell / 2; const pts = s.path_cap_units.slice(1, -1).split('L').map((p) => p.split(',').map(Number)); const m = Math.max(...pts.map(([a, b]) => Math.max(Math.abs(a), Math.abs(b)))); const k = (cell * 0.42) / m; return `<path d="M${pts.map(([a, b]) => `${(x + a * k).toFixed(1)},${(y + b * k).toFixed(1)}`).join('L')}Z" fill="${s.kind === 'caption' ? '#e8d34a' : '#f2f2ee'}" stroke="#000" stroke-width="2"/><text x="${x - cell / 2 + 6}" y="${y - cell / 2 + 16}" font-size="13" fill="#8ff" font-family="Arial">${s.id} ${s.kind} n${s.n}</text>`; }).join('')}</svg>`;
  // Images go to the image library, never discussion/ (Matt, 2026-10-02); register the file afterwards
  // (site/scripts/comic-story-library.mjs registerReview, or the maintained helper's register).
  const lib = require('path').resolve(__dirname, '../../../wiki/image-library/assets/experiments/comic-b/balloon-shapes');
  const sil = lib + `/reference-silhouettes-${new Date().toISOString().slice(0, 10)}.png`;
  await sharp(Buffer.from(svg)).png().toFile(sil); console.log('Register in the image library:', sil);
})();
