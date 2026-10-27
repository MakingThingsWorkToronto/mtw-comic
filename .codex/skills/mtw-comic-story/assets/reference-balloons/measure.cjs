const sharp = require('C:/Code/MTWWebsite-clean/site/node_modules/sharp');
const fs = require('fs');
const SP = process.argv[2];
const sel = JSON.parse(fs.readFileSync(SP + '/sel.json'));
const cands = JSON.parse(fs.readFileSync(SP + '/cands.json'));
const med = (a) => { a = [...a].sort((x, y) => x - y); return a.length ? a[a.length >> 1] : NaN; };

(async () => {
  const shapes = [];
  for (const f of Object.keys(sel)) {
    const { data, info } = await sharp(SP + '/' + f).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const W = info.width, H = info.height, N = W * H;
    const px = (i) => [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]];
    const L = (i) => 0.299 * data[i * 3] + 0.587 * data[i * 3 + 1] + 0.114 * data[i * 3 + 2];
    const lab = new Int32Array(new Uint8Array(fs.readFileSync(SP + '/_lab_' + f + '.bin')).buffer);
    const list = [];
    const cs = cands[f].cands;
    for (const [k, kind] of Object.entries(sel[f].ids || {})) {
      const c = cs[+k];
      if (!c) { console.log('missing', f, k); continue; }
      list.push({ kind, src: 'cand' + k, test: (i) => lab[i] === c.id, x0: c.x0, y0: c.y0, x1: c.x1, y1: c.y1 });
    }
    for (const [cls, sx, sy, kind] of (sel[f].seeds || [])) {
      let s = -1;
      for (let r = 0; r < 20 && s < 0; r++) for (let dy = -r; dy <= r && s < 0; dy++) for (let dx = -r; dx <= r; dx++) {
        const x = sx + dx, y = sy + dy;
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        const i = y * W + x; const [R, G, B] = px(i);
        if (cls === 'red' ? (R > 170 && G < 90 && B < 90) : (L(i) > 170)) { s = i; break; }
      }
      if (s < 0) { console.log('noseed', f, sx, sy); continue; }
      const [r0, g0, b0] = px(s);
      const m = new Uint8Array(N); const st = [s]; m[s] = 1;
      let x0 = W, y0 = H, x1 = 0, y1 = 0, area = 0, border = false;
      while (st.length) {
        const p = st.pop(); area++;
        const x = p % W, y = (p / W) | 0;
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
        if (x == 0 || y == 0 || x == W - 1 || y == H - 1) border = true;
        for (const q of [p - 1, p + 1, p - W, p + W]) {
          if (q < 0 || q >= N || m[q]) continue;
          if (Math.abs((q % W) - x) > 1) continue;
          const [R, G, B] = px(q);
          if (Math.hypot(R - r0, G - g0, B - b0) < 55) { m[q] = 1; st.push(q); }
        }
      }
      if (border || area > N * 0.1) { console.log('leak', f, sx, sy); continue; }
      list.push({ kind, src: 'seed' + sx + ',' + sy, test: (i) => m[i] === 1, x0, y0, x1, y1 });
    }

    for (const sh of list) {
      const pad = 40;
      const X0 = Math.max(0, sh.x0 - pad), Y0 = Math.max(0, sh.y0 - pad), X1 = Math.min(W - 1, sh.x1 + pad), Y1 = Math.min(H - 1, sh.y1 + pad);
      const w = X1 - X0 + 1, h = Y1 - Y0 + 1;
      const inC = new Uint8Array(w * h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) inC[y * w + x] = sh.test((y + Y0) * W + x + X0) ? 1 : 0;
      const reach = new Uint8Array(w * h); const st = [];
      for (let x = 0; x < w; x++) for (const y of [0, h - 1]) if (!inC[y * w + x]) { reach[y * w + x] = 1; st.push(y * w + x); }
      for (let y = 0; y < h; y++) for (const x of [0, w - 1]) if (!inC[y * w + x] && !reach[y * w + x]) { reach[y * w + x] = 1; st.push(y * w + x); }
      while (st.length) {
        const p = st.pop(); const x = p % w, y = (p / w) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const q = ny * w + nx;
          if (!reach[q] && !inC[q]) { reach[q] = 1; st.push(q); }
        }
      }
      const M = new Uint8Array(w * h); let area = 0;
      for (let i = 0; i < w * h; i++) { M[i] = reach[i] ? 0 : 1; area += M[i]; }
      const G = (x, y) => L((y + Y0) * W + x + X0);
      let tx0 = w, ty0 = h, tx1 = 0, ty1 = 0; const rowc = new Int32Array(h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (M[i] && !inC[i] && G(x, y) < 110) { rowc[y]++; tx0 = Math.min(tx0, x); tx1 = Math.max(tx1, x); ty0 = Math.min(ty0, y); ty1 = Math.max(ty1, y); }
      }
      const bands = []; let inb = false, bs = 0;
      for (let y = 0; y < h; y++) {
        const on = rowc[y] > 2;
        if (on && !inb) { inb = true; bs = y; }
        if (!on && inb) { inb = false; if (y - bs >= 4) bands.push([bs, y - 1]); }
      }
      if (inb && h - bs >= 4) bands.push([bs, h - 1]);
      let cap = med(bands.map((b) => b[1] - b[0] + 1));
      const lines = bands.filter((b) => b[1] - b[0] + 1 > cap * 0.5);
      cap = med(lines.map((b) => b[1] - b[0] + 1));
      if (!(cap > 0)) { console.log('nocap', f, sh.src); continue; }
      const lead = lines.length > 1 ? med(lines.slice(1).map((b, i) => b[0] - lines[i][0])) / cap : null;
      const lineW = lines.map((b) => {
        let a = w, c = 0;
        for (let y = b[0]; y <= b[1]; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (M[i] && !inC[i] && G(x, y) < 110) { a = Math.min(a, x); c = Math.max(c, x); } }
        return [a, c];
      });
      const cx = (tx0 + tx1) / 2, cy = (ty0 + ty1) / 2;
      const A = 360; const rr = new Float64Array(A); const ang = [...Array(A).keys()].map((k) => (k / A) * 2 * Math.PI);
      for (let k = 0; k < A; k++) {
        const dx = Math.cos(ang[k]), dy = Math.sin(ang[k]); let last = 0;
        for (let r = 0; r < Math.max(w, h); r += 0.5) {
          const x = Math.round(cx + dx * r), y = Math.round(cy + dy * r);
          if (x < 0 || y < 0 || x >= w || y >= h) break;
          if (M[y * w + x]) last = r; else if (r - last > 6) break;
        }
        rr[k] = last;
      }
      const sw = [];
      for (let k = 0; k < A; k += 3) {
        const dx = Math.cos(ang[k]), dy = Math.sin(ang[k]); let n = 0;
        for (let r = rr[k] + 0.5; r < rr[k] + 15; r += 0.5) {
          const x = Math.round(cx + dx * r), y = Math.round(cy + dy * r);
          if (x < 0 || y < 0 || x >= w || y >= h) break;
          if (G(x, y) < 90) n += 0.5; else if (n > 0) break;
        }
        if (n > 0) sw.push(n);
      }
      let best = null;
      const tw = (tx1 - tx0) / 2, th = (ty1 - ty0) / 2;
      const Ks = []; for (let k = 0; k < A; k += 6) Ks.push([Math.abs(Math.cos(ang[k])), Math.abs(Math.sin(ang[k])), rr[k]]);
      const score = (n, a, b) => { let err = 0; for (const [c, s, r] of Ks) { const rp = Math.pow(Math.pow(c / a, n) + Math.pow(s / b, n), -1 / n); const d = r - rp; const e = d > rp * 0.12 ? rp * 0.12 : Math.abs(d); err += e * e; } return Math.sqrt(err / Ks.length); };
      for (let n = 1.6; n <= 6.01; n += 0.4) for (let a = tw; a <= tw + cap * 4; a += cap * 0.25) for (let b = th; b <= th + cap * 4; b += cap * 0.25) { const e = score(n, a, b); if (!best || e < best.err) best = { n, a, b, err: e }; }
      for (let it = 0; it < 3; it++) { const b0 = { ...best }; const sn = [0.2, 0.1, 0.05][it], sa = cap * [0.12, 0.06, 0.03][it];
        for (let dn = -2; dn <= 2; dn++) for (let da = -3; da <= 3; da++) for (let db = -3; db <= 3; db++) { const n = b0.n + dn * sn, a = b0.a + da * sa, b = b0.b + db * sa; if (n < 1.2 || a <= 0 || b <= 0) continue; const e = score(n, a, b); if (e < best.err) best = { n, a, b, err: e }; } }
      best.n = +best.n.toFixed(2);
      const rp = (k) => { const c = Math.cos(ang[k]), s = Math.sin(ang[k]); return Math.pow(Math.pow(Math.abs(c / best.a), best.n) + Math.pow(Math.abs(s / best.b), best.n), -1 / best.n); };
      const ex = [...Array(A).keys()].map((k) => rr[k] - rp(k));
      const isT = (k) => ex[k] > Math.max(rp(k) * 0.15, cap * 0.6);
      const tails = [];
      let start = 0; while (start < A && isT(start)) start++;
      let k0 = -1;
      for (let j = 0; j <= A; j++) {
        const k = (start + j) % A; const on = j < A && isT(k);
        if (on && k0 < 0) k0 = start + j;
        if (!on && k0 >= 0) { tails.push([k0, start + j - 1]); k0 = -1; }
      }
      const tailStats = tails.filter(([a, b]) => b - a >= 2).map(([a, b]) => {
        let km = a, mx = -1;
        for (let kk = a; kk <= b; kk++) { const k = kk % A; if (ex[k] > mx) { mx = ex[k]; km = k; } }
        const span = ((b - a + 1) / A) * 2 * Math.PI;
        const rbase = rp(km);
        // bend: angle of tip vs mid-angle of base
        const mid = (((a + b) / 2) % A);
        // width profile along the tail, perpendicular to the base->tip vector
        const dx = Math.cos(ang[km]), dy = Math.sin(ang[km]); const bx = cx + dx * rbase, by = cy + dy * rbase; const tl = rr[km] - rbase;
        const widthAt = (t) => { const px0 = bx + dx * tl * t, py0 = by + dy * tl * t; let wsum = 0; for (const sgn of [1, -1]) { let d = 0; for (; d < tl * 3 + 20; d += 0.5) { const x = Math.round(px0 - dy * d * sgn), y = Math.round(py0 + dx * d * sgn); if (x < 0 || y < 0 || x >= w || y >= h || !M[y * w + x]) break; } wsum += d; } return +(wsum / cap).toFixed(2); };
        const prof = [0.15, 0.35, 0.55, 0.75].map(widthAt);
        return { prof_cap: prof, dirDeg: km, len_cap: +(mx / cap).toFixed(2), baseW_frac: +((2 * rbase * Math.sin(span / 2)) / (2 * best.a)).toFixed(3), span_deg: b - a + 1, tipOffset_deg: +(km - mid).toFixed(0) };
      });
      const res = []; for (let k = 0; k < A; k++) { if (isT(k)) continue; res.push(Math.abs(ex[k]) / cap); }
      const sm = [...rr].map((v, k) => (rr[(k + A - 2) % A] + rr[(k + A - 1) % A] + v + rr[(k + 1) % A] + rr[(k + 2) % A]) / 5);
      let peaks = 0; const msm = med(sm);
      for (let k = 0; k < A; k++) { const v = sm[k]; let pk = true; for (let d = 1; d <= 5; d++) if (sm[(k + d) % A] > v || sm[(k + A - d) % A] > v) pk = false; if (pk && v > msm * 1.03) peaks++; }
      // contour roughness (high-freq residual of rr vs 15-deg smoothing), in cap units
      const sm15 = [...rr].map((v, k) => { let s = 0; for (let d = -7; d <= 7; d++) s += rr[(k + A + d) % A]; return s / 15; });
      const rough = med([...rr].map((v, k) => Math.abs(v - sm15[k]) / cap));
      let mx0 = w, my0 = h, mx1 = 0, my1 = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (M[y * w + x]) { mx0 = Math.min(mx0, x); mx1 = Math.max(mx1, x); my0 = Math.min(my0, y); my1 = Math.max(my1, y); }
      const edge = (fn, len) => { let c = 0; for (let t = 0; t < len; t++) if (fn(t)) c++; return +(c / len).toFixed(2); };
      const butt = { top: edge((x) => M[my0 * w + mx0 + x], mx1 - mx0 + 1), bottom: edge((x) => M[my1 * w + mx0 + x], mx1 - mx0 + 1), left: edge((y) => M[(my0 + y) * w + mx0], my1 - my0 + 1), right: edge((y) => M[(my0 + y) * w + mx1], my1 - my0 + 1) };
      let cr = 0, cg = 0, cb = 0, cn = 0; const cols = [];
      for (let i = 0; i < w * h; i++) if (inC[i]) { const y = (i / w) | 0, x = i % w; const [R, G2, B] = px((y + Y0) * W + x + X0); cr += R; cg += G2; cb += B; cn++; if (cn % 7 === 0) cols.push(0.299 * R + 0.587 * G2 + 0.114 * B); }
      const hex = '#' + [cr, cg, cb].map((v) => Math.round(v / cn).toString(16).padStart(2, '0')).join('');
      const lsd = Math.sqrt(cols.reduce((s, v) => s + (v - med(cols)) ** 2, 0) / cols.length);
      const pts = []; for (let k = 0; k < A; k += 4) pts.push([(Math.cos(ang[k]) * rr[k] / cap).toFixed(2), (Math.sin(ang[k]) * rr[k] / cap).toFixed(2)]);
      const path = 'M' + pts.map((p) => p.join(',')).join('L') + 'Z';
      const swm = med(sw);
      const o = {
        id: shapes.length, page: f, src: sh.src, kind: sh.kind, bbox: [sh.x0, sh.y0, sh.x1 - sh.x0 + 1, sh.y1 - sh.y0 + 1], cap_px: cap, lines: lines.length, lead_cap: lead && +lead.toFixed(2),
        lineW_cap: lineW.map(([a, c]) => +((c - a) / cap).toFixed(1)),
        text_cap: [+((tx1 - tx0) / cap).toFixed(1), +((ty1 - ty0) / cap).toFixed(1)],
        outer_cap: [+((mx1 - mx0) / cap).toFixed(1), +((my1 - my0) / cap).toFixed(1)],
        pad_cap: { l: +((tx0 - mx0) / cap).toFixed(2), r: +((mx1 - tx1) / cap).toFixed(2), t: +((ty0 - my0) / cap).toFixed(2), b: +((my1 - ty1) / cap).toFixed(2) },
        body: { n: best.n, a_cap: +(best.a / cap).toFixed(2), b_cap: +(best.b / cap).toFixed(2), aspect: +(best.a / best.b).toFixed(2), resid_med_cap: +med(res).toFixed(3), padX_cap: +((best.a - tw) / cap).toFixed(2), padY_cap: +((best.b - th) / cap).toFixed(2) },
        tails: tailStats, stroke_px: { med: swm, cv: +(Math.sqrt(sw.reduce((s, v) => s + (v - swm) ** 2, 0) / sw.length) / swm).toFixed(2) }, stroke_cap: +(swm / cap).toFixed(3),
        rough_cap: +rough.toFixed(3), peaks, butt, fill: hex, fillLumSD: +lsd.toFixed(1), fillRatio: +(area / ((mx1 - mx0 + 1) * (my1 - my0 + 1))).toFixed(3), path,
      };
      shapes.push(o);
      const poly = (fn) => 'M' + [...Array(A).keys()].filter((k) => k % 3 == 0).map((k) => [(cx + Math.cos(ang[k]) * fn(k)).toFixed(1), (cy + Math.sin(ang[k]) * fn(k)).toFixed(1)].join(',')).join('L') + 'Z';
      const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><path d="${poly((k) => rr[k])}" fill="none" stroke="#f0f" stroke-width="2"/><path d="${poly(rp)}" fill="none" stroke="#0c0" stroke-width="1.5" stroke-dasharray="4 3"/>${lines.map((b) => `<line x1="0" x2="${w}" y1="${b[0]}" y2="${b[0]}" stroke="#08f" stroke-width="1"/>`).join('')}</svg>`;
      await sharp(SP + '/' + f).extract({ left: X0, top: Y0, width: w, height: h }).composite([{ input: Buffer.from(svg) }]).png().toFile(SP + `/crop_${o.id}.png`);
    }
  }
  fs.writeFileSync(SP + '/shapes-raw.json', JSON.stringify(shapes, null, 1));
  console.log(shapes.length);
  for (const s of shapes) console.log(s.id, s.page.slice(0, 6), s.kind, 'cap', s.cap_px, 'L', s.lines, 'lead', s.lead_cap, 'n', s.body.n, 'asp', s.body.aspect, 'pad', s.body.padX_cap, s.body.padY_cap, 'tails', JSON.stringify(s.tails.map((t) => [t.len_cap, t.baseW_frac, t.span_deg])), 'sw', s.stroke_cap, 'rough', s.rough_cap, 'pk', s.peaks, s.fill);
})();
