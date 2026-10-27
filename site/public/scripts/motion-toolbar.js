/* The motion toolbar (src/components/MotionToolbar.astro; skill: mtw-beat-comic): one toolbar for every motion graphic
   experience on the site (Matt, 2026-09-28: "this toolbar shall be canonical in all motion graphic experiences"). Left
   to right: Let's Talk, Tracklist, Previous track, Pause/Play, Next track, Skip Intro, then the player's music tag.
   This script owns the toolbar's state in one module (so a later persistent player can keep it across page swaps): the
   Tracklist dialog, the buttons' reveal and pinning, and the 8-bit drawing the Beat Comic engine shares (the pixel font,
   the marquee strip, the tracklist layout and rows: window.MTWPixel).

   A player (the Beat Comic engine; Comic B and Game C next) adopts it like this:
     MTWToolbar.register({
       beat: 0.6,                       // seconds a beat: the Tracklist's play head blinks on it
       songTime: function () { ... },   // the song's time in seconds, shown on the playing row
       togglePause: function () { ... },// Pause/Play pressed: pause or resume, then call MTWToolbar.setPaused(state)
       skip: function () { ... },       // Skip Intro pressed: fold the experience into the page
     });
     MTWToolbar.setPaused(true|false);  // show the player's state on the Pause/Play button (its name says the next action)
     MTWToolbar.pin(tagElement);        // after folding into the page: pin Let's Talk, Tracklist, Previous, Next (and the
                                        // player's music tag, if given) bottom right, the permanent way to stay in 8-bit
     MTWToolbar.isOpen();               // the Tracklist dialog is open: ignore input that would fold or leave
     MTWToolbar.open(); MTWToolbar.close();
   Every press is also announced as a window event, 'mtw-toolbar', detail { action }: 'pause', 'play', 'skip', 'prev',
   'next', 'tracklist-open', 'tracklist-close' (a player may listen instead of registering callbacks). Previous and Next
   are real links (the page transition and the DJ crossfade apply); Let's Talk links to /contact/. Classic script, no
   dependencies; load it before the player's own script. */
(function () {
  if (window.MTWToolbar) return;
  var root = document.documentElement;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function font(size) { return '700 ' + size + 'px "Barlow Condensed", "Arial Narrow", sans-serif'; }
  function now() { return performance.now() / 1000; }
  var player = null;
  // Seconds a beat: the panel's own (the engine sets p.B), else the registered player's, else 100 BPM.
  function beat(p) { return (p && p.B) || (player && player.beat) || 0.6; }

  /* ---------- The pixel font: condensed 3x7 capitals, drawn for the comic ---------- */
  // An original bitmap face (2026-09-28), for pixel type too small for pixelated Barlow Condensed to read: seven pixels
  // of capital height at whole canvas pixels, no anti-aliasing, most glyphs three wide so it keeps Barlow Condensed's
  // narrow proportions (Matt, 2026-09-28: "you can balance out the columns and use a different font if need be"). Capitals,
  // digits and the punctuation the site's titles use; anything else draws as a space.
  var PF_SRC = {
    A: '.#./#.#/#.#/###/#.#/#.#/#.#', B: '##./#.#/#.#/##./#.#/#.#/##.', C: '.##/#../#../#../#../#../.##', D: '##./#.#/#.#/#.#/#.#/#.#/##.',
    E: '###/#../#../##./#../#../###', F: '###/#../#../##./#../#../#..', G: '.##/#../#../#.#/#.#/#.#/.##', H: '#.#/#.#/#.#/###/#.#/#.#/#.#',
    I: '#/#/#/#/#/#/#', J: '..#/..#/..#/..#/..#/#.#/.#.', K: '#.#/#.#/##./##./#.#/#.#/#.#', L: '#../#../#../#../#../#../###',
    M: '#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#', N: '#..#/##.#/##.#/#.##/#.##/#..#/#..#', O: '.#./#.#/#.#/#.#/#.#/#.#/.#.',
    P: '##./#.#/#.#/##./#../#../#..', Q: '.#./#.#/#.#/#.#/#.#/##./.##', R: '##./#.#/#.#/##./#.#/#.#/#.#', S: '.##/#../#../.#./..#/..#/##.',
    T: '###/.#./.#./.#./.#./.#./.#.', U: '#.#/#.#/#.#/#.#/#.#/#.#/###', V: '#.#/#.#/#.#/#.#/#.#/.#./.#.',
    W: '#...#/#...#/#...#/#.#.#/#.#.#/#.#.#/.#.#.', X: '#.#/#.#/#.#/.#./#.#/#.#/#.#', Y: '#.#/#.#/#.#/.#./.#./.#./.#.',
    Z: '###/..#/..#/.#./#../#../###',
    0: '.#./#.#/#.#/#.#/#.#/#.#/.#.', 1: '.#./##./.#./.#./.#./.#./###', 2: '##./..#/..#/.#./#../#../###', 3: '##./..#/..#/.#./..#/..#/##.',
    4: '#.#/#.#/#.#/###/..#/..#/..#', 5: '###/#../#../##./..#/..#/##.', 6: '.##/#../#../##./#.#/#.#/.#.', 7: '###/..#/..#/.#./.#./.#./.#.',
    8: '.#./#.#/#.#/.#./#.#/#.#/.#.', 9: '.#./#.#/#.#/.##/..#/..#/##.',
    '.': './././././.' + '/#', ',': '../../../../../.#/#.', '-': '.../.../.../###/.../.../...',
    '&': '.#../#.#./#.#./.#../#.##/#..#/.###', ':': '././#/././#/.', "'": '#/#/././././.', '!': '#/#/#/#/#/./#', '?': '##./..#/..#/.#./.#./.../.#.',
    '/': '..#/..#/.#./.#./.#./#../#..', '+': '.../.../.#./###/.#./.../...', '•': '../../../##/##/../..', '▶': '#.../##../###./####/###./##../#...',
    ' ': '../../../../../../..'
  };
  var PF = {};
  for (var pk in PF_SRC) (function (k) {
    var rs = PF_SRC[k].split('/'), g = { w: rs[0].length, on: [] };
    rs.forEach(function (r, y) { for (var x = 0; x < r.length; x++) if (r[x] === '#') g.on.push(x, y); });
    PF[k] = g;
  })(pk);
  function pfW(s) { var w = 0; for (var i = 0; i < s.length; i++) w += (PF[s[i]] || PF[' ']).w + 1; return Math.max(0, w - 1); }
  // Draws s with its top-left at (x, y), one font pixel to one canvas pixel; col(i) colours character i. Returns the end x.
  function pfDraw(c, s, x, y, col) {
    var last = null;
    for (var i = 0; i < s.length; i++) {
      var g = PF[s[i]] || PF[' '], k = col(i);
      if (k !== last) { if (last) c.fill(); c.fillStyle = k; c.beginPath(); last = k; }
      for (var j = 0; j < g.on.length; j += 2) c.rect(x + g.on[j], y + g.on[j + 1], 1, 1);
      x += g.w + 1;
    }
    if (last) c.fill();
    return x - 1;
  }

  /* ---------- The marquee strip: one renderer for the landing covers' scrolling name and the tracklist's rows ---------- */
  // (Matt, 2026-09-28: "the homepage tracklist should use the same style as the marquee tracklist on the section pages,
  // i am trying to give this global navigation".) Teal rules over and under the strip, the first word in teal-light and
  // the rest in paper, a flat ink shadow; given `run` (seconds of scrolling) it repeats and slides left at `speed` px a
  // second (the caller steps `run` 12 times a second on the motion clock). In canvas pixels. `pf`: the text is drawn in
  // the pixel font (one font pixel per canvas pixel, `my` its top) instead of Barlow Condensed at `size` (`my` its middle).
  function strip(c, o) {
    var P2 = o.pf, head = o.head, body = o.body, sh = P2 ? 1 : Math.max(1, Math.round(o.size * 0.06)), hw, seg;
    c.save(); c.beginPath(); c.rect(o.x, o.y, o.w, o.h); c.clip();
    function rules() { c.fillStyle = TK.teal; c.fillRect(o.x, o.y, o.w, o.rule); c.fillRect(o.x, o.y + o.h - o.rule, o.w, o.rule); }
    // Pixel-font strips are only a few pixels taller than their type: their rules go over the shadow, not under it.
    if (o.rule && !P2) rules();
    if (P2) { hw = pfW(head); seg = pfW(head + body) + (o.run != null ? 1 : 0); }
    else { c.font = font(o.size); c.textBaseline = 'middle'; hw = c.measureText(head).width; seg = hw + c.measureText(body).width; }
    var off = o.run != null ? (Math.max(0, o.run) * o.speed) % seg : 0, sx = o.tx - Math.round(off) - (o.run != null ? seg : 0);
    for (; sx < o.x + o.w; sx += seg) {
      if (P2) {
        if (o.shadow !== false) pfDraw(c, head + body, sx + 1, o.my + 1, function () { return TK.ink; });
        pfDraw(c, head + body, sx, o.my, function (i) { return i < head.length ? o.hc : o.bc; });
      } else {
        c.fillStyle = TK.ink; c.fillText(head + body, sx + sh, o.my + sh);
        c.fillStyle = o.hc; c.fillText(head, sx, o.my);
        c.fillStyle = o.bc; c.fillText(body, sx + hw, o.my);
      }
      if (o.run == null) break;
    }
    if (o.rule && P2) rules();
    c.restore();
  }

  /* ---------- Tracklist (Panel.tracks): the mixtape's back cover, the comics' global navigation ---------- */
  // Matt, 2026-09-28: "restyle the first scene on homepage to reflect the tracklist", "the homepage disc track listing
  // needs to look 8 bit", "balance out the columns", "highlight the section landing pages over the service pages". Every
  // row is a marquee strip in the pixel font at a whole-pixel scale (the biggest that fits: 3 CSS px a font pixel on a
  // desktop, 2 on a phone). Columns break only between groups (a disc label or a section's landing track starts one); a
  // disc label that opens the list spans the columns and one that closes it sits at the foot of the last column; of the
  // layouts that fit, the most even columns win. A name too long for its column scrolls as the marquee does.
  var ROW_STEP = 0.2; // beats between rows landing, like a player reading the disc's table of contents
  var TK = { ink: '#0b1419', panel: '#112126', teal: '#1a9ba1', tealLight: '#5fc4c9', paper: '#f2f2ef' };
  var PRE = 16; // font pixels before a title: the play head (4) and 2, the number (7) and 3
  function trackText(r) {
    var t = r.title.toUpperCase();
    if (r.disc) { var sp = t.indexOf(' '); return sp < 0 ? [t, ''] : [t.slice(0, sp), t.slice(sp)]; }
    return [r.no || '', t];
  }
  // Discs (2026-09-28: Disc 2, the Journal; Matt: "journal should be a separate disk on the site playlist"): the list is
  // laid out as one block per disc, stacked, like the back of a double album. Each block is its disc label spanning the
  // block, then its tracks in columns of their own; each disc's columns are balanced on their own ("balance out the
  // columns"). Within a disc, columns break only between groups: a landing track heads its services (Disc 1); a disc
  // without landing tracks (the Journal) may break after any track, with no gap between its tracks.
  // The scale is a whole number of device pixels a font pixel (2026-09-28): 1 to 5 CSS px in steps of one device pixel,
  // so a phone (3 device px a CSS px) can use 5/3 CSS px and keep a long list readable where 2 would not fit; a desktop
  // (1 device px a CSS px) keeps whole CSS px as before.
  function trackLayout(p) {
    var rows = p.d.tracks.rows, found = null;
    var need = rows.map(function (r) { var tx = trackText(r); return r.disc ? 4 + pfW(tx[0] + tx[1]) : PRE + pfW(tx[1]) + 2 + (r.now ? pfW('0:00') + 4 : 0); });
    // Blocks: a disc label starts one (rows before any label form a block without one). Groups: a landing track starts
    // one; in a block without landing tracks every track is a group of its own, joined without a gap ("soft").
    var blocks = [];
    rows.forEach(function (r, i) {
      if (r.disc || !blocks.length) blocks.push({ label: r.disc ? i : -1, groups: [] });
      if (r.disc) return;
      blocks[blocks.length - 1].groups.push({ rows: [], head: !!r.head, at: i });
    });
    // Merge: in a block with landing tracks, a track that is not one joins the group before it.
    blocks.forEach(function (bk) {
      var heads = bk.groups.some(function (g) { return g.head; }), gs = [];
      bk.groups.forEach(function (g) {
        if (heads && !g.head && gs.length && !rows[gs[gs.length - 1].rows[0]].disc) gs[gs.length - 1].rows.push(g.at);
        else gs.push({ rows: [g.at], soft: !heads && gs.length > 0 });
      });
      bk.groups = gs;
    });
    function splits(gs, n) {
      if (n === 1) return [[gs]];
      var out = [];
      for (var e = 1; e <= gs.length - n + 1; e++) splits(gs.slice(e), n - 1).forEach(function (rest) { out.push([gs.slice(0, e)].concat(rest)); });
      return out;
    }
    function colH(cg, rh, gap) { var k = 0; cg.forEach(function (g, j) { k += g.rows.length * rh + (j && !g.soft ? gap : 0); }); return k; }
    var dpr = Math.max(1, (typeof window !== 'undefined' && window.devicePixelRatio) || 1), us = [];
    for (var k = Math.floor(5 * dpr + 1e-6); k >= Math.ceil(dpr - 1e-6); k--) us.push(k / dpr);
    if (us[us.length - 1] > 1) us.push(1);
    var tries = [[12, 3], [11, 3], [10, 3], [9, 2], [9, 1]];
    us.forEach(function (u) {
      var W = Math.floor(p.w / u), H = Math.floor(p.h / u), pad = clamp(Math.round(Math.min(W, H) * 0.02), 3, 6), gapC = Math.max(3, Math.round(W * 0.02)), fullW = W - 2 * pad;
      // Row heights 12 down to 9; at the smallest, the gap between groups may close to one pixel (the teal rules still
      // mark each group) before the list gives up its pixel size.
      tries.forEach(function (tr) {
        var rh = tr[0], gap = tr[1];
        // Each block's best cut for each column count: the most even columns whose names fit (at most one name per
        // disc may scroll, as the marquee does; the smallest scale takes whatever fits).
        var opts = blocks.map(function (bk) {
          var list = [];
          for (var n = 1; n <= Math.min(4, bk.groups.length); n++) {
            var colW = Math.floor((fullW - (n - 1) * gapC) / n), over = 0;
            bk.groups.forEach(function (g) { g.rows.forEach(function (i) { if (need[i] > colW) over++; }); });
            if (bk.label >= 0 && need[bk.label] > fullW) over++;
            if (u > 1 && over > 1) continue;
            var best = null;
            splits(bk.groups, n).forEach(function (cols) {
              var hs = cols.map(function (cg) { return colH(cg, rh, gap); }), tall = Math.max.apply(null, hs);
              var spread = n > 1 ? (tall - Math.min.apply(null, hs)) / tall : 0;
              // Equally even: the earlier columns fuller (a list reads down the first column first).
              var lead = hs.every(function (v, j) { return !j || v <= hs[j - 1]; });
              if (!best || spread < best.spread - 1e-9 || (Math.abs(spread - best.spread) < 1e-9 && lead && !best.lead)) best = { n: n, colW: colW, cols: cols, tall: tall, spread: spread, lead: lead };
            });
            if (best) { best.h = (bk.label >= 0 ? rh : 0) + best.tall; list.push(best); }
          }
          return list;
        });
        if (opts.some(function (o) { return !o.length; })) return;
        // Every combination of the blocks' column counts that fits the height.
        (function pick(bi, chosen) {
          if (bi === blocks.length) {
            var total = 0, spread = 0;
            chosen.forEach(function (c, j) { total += c.h + (j ? gap : 0); spread = Math.max(spread, c.spread); });
            if (total > H - 2 * pad) return;
            // Size and evenness together: cap height in CSS px, less the share by which a disc's shortest column falls
            // short; fewer columns win a tie (the reading order stays down the list).
            var cols = chosen.reduce(function (s, c) { return s + c.n; }, 0), score = u * 7 * (1 - spread) + u * rh * 0.01 - cols * 0.001;
            if (!found || score > found.score) found = { u: u, W: W, H: H, pad: pad, gapC: gapC, fullW: fullW, rh: rh, gap: gap, total: total, pick: chosen.slice(), score: score };
            return;
          }
          opts[bi].forEach(function (o) { chosen.push(o); pick(bi + 1, chosen); chosen.pop(); });
        })(0, []);
      });
    });
    // Centred in a panel; from the top in the Tracklist dialog (p.alignTop), which then shrinks to fit (used).
    var L = found, boxes = [], y = L.pad + (p.alignTop ? 0 : Math.floor((L.H - 2 * L.pad - L.total) / 2));
    blocks.forEach(function (bk, bi) {
      var c = L.pick[bi];
      if (bi) y += L.gap;
      if (bk.label >= 0) { boxes[bk.label] = [L.pad, y, L.fullW, L.rh]; y += L.rh; }
      c.cols.forEach(function (cg, ci) {
        var x = L.pad + ci * (c.colW + L.gapC), yy = y;
        cg.forEach(function (g, j) { if (j && !g.soft) yy += L.gap; g.rows.forEach(function (i) { boxes[i] = [x, yy, c.colW, L.rh]; yy += L.rh; }); });
      });
      y += c.tall;
    });
    return { u: L.u, px: L.u, rh: L.rh, used: L.total + 2 * L.pad, boxes: boxes, css: boxes.map(function (b) { return b.map(function (v) { return v * L.u; }); }), scrolls: rows.map(function (r, i) { return need[i] > boxes[i][2]; }) };
  }
  // How many rows have landed, and whether the disc is playing (the playing row lit, the links live).
  // The Tracklist overlay passes its own row step (p.step, seconds) and is always live (p.always).
  function trackState(p, t) {
    var tk = p.d.tracks, step = p.step || ROW_STEP * beat(p), shown = Math.max(0, Math.min(tk.rows.length, Math.floor((t - p.t - 0.16) / step) + 1));
    return { shown: t - p.t < 0.16 ? 0 : shown, live: !!p.always || t >= (p.page.b + (tk.live != null ? tk.live : p.d.at)) * beat(p), step: step };
  }
  // A notched bar (the corners stepped off, like an 8-bit menu's highlight), or its one-pixel outline.
  function notch(c, x, y, w, h, col, outline) {
    c.fillStyle = col;
    if (outline) { c.fillRect(x + 1, y, w - 2, 1); c.fillRect(x + 1, y + h - 1, w - 2, 1); c.fillRect(x, y + 1, 1, h - 2); c.fillRect(x + w - 1, y + 1, 1, h - 2); return; }
    c.fillRect(x + 1, y, w - 2, h); c.fillRect(x, y + 1, w, h - 2);
  }
  // Drawn at one font pixel per canvas pixel (the panel's final pixel is the layout's scale).
  // One row, drawn at (x, y) in font pixels. `secs`: the song time the playing row shows (the story clock when omitted).
  function drawRow(c, p, i, x, y, w, st, t, mt, secs) {
    var tl = p.tl, r = p.d.tracks.rows[i], rh = tl.rh, blink = Math.floor(mt / beat(p)) % 2 === 0, ty = y + Math.max(1, Math.floor((rh - 8) / 2));
    var hot = p.hot === i && st.live, lit = r.now && st.live, tx = trackText(r), strp = r.disc || r.head;
    if (tl.scrolls[i]) tx[1] += '  •  '; // a scrolling name repeats as the marquee does
    var bar = hot ? TK.paper : lit ? TK.tealLight : null, hc, bc;
    c.fillStyle = TK.panel; c.fillRect(x, y, w, rh);
    if (bar) { notch(c, x, y, w, rh, bar); hc = bc = TK.ink; }
    else if (r.disc || r.head || r.now) { hc = TK.tealLight; bc = TK.paper; }
    else if (!r.no) { hc = bc = TK.teal; } // a note under a disc ("Tracks coming soon."): dimmest
    else { hc = TK.teal; bc = TK.tealLight; } // a service: dimmer, under its landing track
    if (r.now && !st.live) notch(c, x, y, w, rh, TK.tealLight, true); // cued: waiting for the drop
    // The play head: still while cued, blinking on the beat once the disc plays.
    if (r.now && (!st.live || blink)) pfDraw(c, '▶', x + 1, ty, function () { return lit ? TK.ink : TK.tealLight; });
    var run = tl.scrolls[i] ? Math.floor((mt - (p.t + 0.16 + i * st.step) - 2 * beat(p)) * 12) / 12 : null;
    if (r.disc) strip(c, { pf: true, x: x, y: y, w: w, h: rh, tx: x + 3, my: ty, head: tx[0], body: tx[1], hc: hc, bc: bc, rule: bar ? 0 : 1, shadow: !bar, run: run, speed: 18 });
    else {
      pfDraw(c, tx[0], x + 6, ty, function () { return hc; });
      var tRight = x + w - (lit ? pfW('0:00') + 4 : 1);
      strip(c, { pf: true, x: x + PRE, y: y, w: tRight - x - PRE, h: rh, tx: x + PRE, my: ty, head: '', body: tx[1], hc: bc, bc: bc, rule: 0, shadow: !bar, run: run, speed: 18 });
      if (strp && !bar) { c.fillStyle = TK.teal; c.fillRect(x, y, w, 1); c.fillRect(x, y + rh - 1, w, 1); }
      // Playing: the song's own time at the row's right, as a CD player's playlist shows it.
      if (lit) { var sc = Math.floor(secs != null ? secs : t), tm = Math.floor(sc / 60) + ':' + ('0' + sc % 60).slice(-2); pfDraw(c, tm, x + w - 2 - pfW(tm), ty, function () { return TK.ink; }); }
    }
  }
  // What a row shows now: it is redrawn (into its own sprite, p.rows[i]) only when this changes, so a scrolling name
  // or the playing row's clock repaints one row, not the list (render cost, lesson 27).
  function rowKey(p, i, st, t, mt, secs) {
    var r = p.d.tracks.rows[i], live = st.live, k = (p.hot === i && live ? 'h' : '') + (r.now ? (live ? 'L' + (Math.floor(mt / beat(p)) % 2) + '@' + Math.floor(secs != null ? secs : t) : 'c') : '');
    return p.tl.scrolls[i] ? k + 's' + Math.floor((mt - (p.t + 0.16 + i * st.step) - 2 * beat(p)) * 12) : k;
  }
  function drawTracks(p, c, t, mt, secs) {
    var tl = p.tl, st = trackState(p, t), rh = tl.rh;
    if (!p.rows || p.rowsOf !== tl) { p.rows = []; p.rowsOf = tl; }
    c.fillStyle = TK.panel; c.fillRect(0, 0, c.canvas.width, c.canvas.height);
    for (var i = 0; i < st.shown; i++) {
      var b = tl.boxes[i], R = p.rows[i] || (p.rows[i] = { cv: document.createElement('canvas'), key: null }), k = rowKey(p, i, st, t, mt, secs);
      if (R.key !== k) {
        if (R.cv.width !== b[2] || R.cv.height !== rh) { R.cv.width = b[2]; R.cv.height = rh; }
        drawRow(R.cv.getContext('2d'), p, i, 0, 0, b[2], st, t, mt, secs); R.key = k;
      }
      c.drawImage(R.cv, b[0], b[1]);
    }
    // The row that has just landed flashes as a solid bar for one step, like a cursor writing it.
    if (st.shown && t - p.t - 0.16 - (st.shown - 1) * st.step < 0.07) { var fb = tl.boxes[st.shown - 1]; notch(c, fb[0], fb[1], fb[2], rh, TK.tealLight); }
  }


  window.MTWPixel = { font: font, pfW: pfW, pfDraw: pfDraw, strip: strip, TK: TK, PRE: PRE, trackText: trackText, trackLayout: trackLayout, trackState: trackState, drawTracks: drawTracks, notch: notch };

  /* ---------- The toolbar ---------- */
  var bar = document.querySelector('[data-motion-toolbar]');
  function emit(action) { try { window.dispatchEvent(new CustomEvent('mtw-toolbar', { detail: { action: action } })); } catch (e) {} }
  function q(sel) { return bar ? bar.querySelector(sel) : null; }
  var talkBtn = q('.rl-talk'), listBtn = q('.rl-list'), prevBtn = q('.rl-prev'), nextBtn = q('.rl-next'), pauseBtn = q('.rl-pause'), skipBtn = q('.rl-skip');
  var pauseLabel = pauseBtn && pauseBtn.querySelector('.rl-pause__label');

  // Pixel labels: Let's Talk, the Tracklist's heading and its Close (canvas.rl-px[data-px]), painted in the pixel font
  // at data-scale CSS px a font pixel (2 by default): the marquee's colours (the first word teal-light, the rest paper,
  // an ink shadow), or ink on Let's Talk's teal-light block. The words stay the control's name.
  function pxLabel(cv) {
    var txt = cv.getAttribute('data-px'), ink = !!cv.closest('.rl-talk'), s = +(cv.getAttribute('data-scale') || 2), sp = txt.indexOf(' ');
    var w = pfW(txt) + 2, h = 9, c = cv.getContext('2d');
    cv.width = w; cv.height = h; cv.style.width = w * s + 'px'; cv.style.height = h * s + 'px'; c.clearRect(0, 0, w, h);
    if (!ink) pfDraw(c, txt, 2, 2, function () { return TK.ink; });
    pfDraw(c, txt, 1, 1, function (i) { return ink ? TK.ink : sp < 0 || i < sp ? TK.tealLight : TK.paper; });
  }
  Array.prototype.forEach.call(document.querySelectorAll('canvas.rl-px[data-px]'), pxLabel);

  // The buttons slide in 1.2 s after the page starts, as Skip Intro always has.
  var shown = false;
  function show() { if (shown) return; shown = true; [talkBtn, listBtn, prevBtn, pauseBtn, nextBtn, skipBtn].forEach(function (b) { if (b) b.classList.add('is-shown'); }); }
  if (bar) setTimeout(show, 1200);

  // Pause/Play: icon only (Matt, 2026-09-28: "remove "Pause" text from button"); its name says what a press does next.
  function setPaused(pz) {
    if (!pauseBtn) return;
    var name = pz ? 'Play' : 'Pause';
    pauseBtn.classList.toggle('is-paused', !!pz); pauseBtn.setAttribute('aria-label', name); pauseBtn.title = name;
    if (pauseLabel) pauseLabel.textContent = name;
  }
  if (pauseBtn) pauseBtn.addEventListener('click', function () { emit(pauseBtn.classList.contains('is-paused') ? 'play' : 'pause'); if (player && player.togglePause) player.togglePause(); });
  if (skipBtn) skipBtn.addEventListener('click', function () { emit('skip'); if (player && player.skip) player.skip(); });
  [[prevBtn, 'prev'], [nextBtn, 'next']].forEach(function (x) { if (x[0]) x[0].addEventListener('click', function (e) { emit(x[1]); if (player && typeof player[x[1]] === 'function') { e.preventDefault(); player[x[1]](); } }); });

  // After the experience folds into the page, the way around stays: Let's Talk, Tracklist, Previous and Next, with the
  // player's music tag, pinned bottom right (Matt, 2026-09-28: "this will be the perm way to stay in the 8-bit
  // experience"). Pause/Play and Skip Intro leave with the experience (the music tag mutes the music from then on).
  var pinEl = null;
  function pin(tag) {
    if (!pinEl) { pinEl = document.createElement('div'); pinEl.className = 'rl-pin'; document.body.appendChild(pinEl); }
    [talkBtn, listBtn, prevBtn, nextBtn, tag].forEach(function (b) { if (b) { b.classList.add('is-shown'); pinEl.appendChild(b); } });
    return pinEl;
  }

  /* ---------- The Tracklist: the site playlist as an 8-bit dialog, the comics' global navigation ---------- */
  // Matt, 2026-09-28: "make this a component and give the user a button similar to "Skip Intro" to open tracklist on each
  // page reveal, this will be the perm way to stay in the 8-bit experience". The Tracklist button opens #rl-tracklist
  // (Tracklist.astro, moved to <body> so it outlives the experience); its rows are #mtw-playlist, drawn by drawTracks,
  // always live, landing one every 0.03 s. The player plays on under it (in time with its music); the player should ignore
  // input that would fold or leave while it is open (MTWToolbar.isOpen()). Escape, Close or a click on the scrim closes it
  // and focus returns to the button; Tab stays inside it, and the arrow keys walk the rows like a game menu.
  var dlg = document.getElementById('rl-tracklist'), dataEl = document.getElementById('mtw-playlist'), rows = null;
  try { rows = dataEl ? JSON.parse(dataEl.textContent) : null; } catch (e) { rows = null; }
  var TL = null, listOpen = false, listFrom = null, tlT0 = 0;
  if (dlg && rows) {
    if (dlg.parentNode !== document.body) document.body.appendChild(dlg);
    TL = { box: dlg.querySelector('.rl-tl__list'), cv: dlg.querySelector('.rl-tl__px'), items: dlg.querySelectorAll('.rl-tl__a[data-row]'), close: dlg.querySelector('.rl-tl__close'), key: '',
      p: { w: 0, h: 0, t: 0, page: { b: 0 }, d: { at: 0, tracks: { rows: rows } }, hot: -1, step: 0.03, always: true, alignTop: true } };
    Array.prototype.forEach.call(TL.items, function (a) {
      if (a.tagName !== 'A') return;
      var ri = +a.getAttribute('data-row');
      // Focus lights a row only when it is keyboard focus (opening with a pointer focuses the first row quietly).
      ['pointerenter', 'focus', 'pointerleave', 'blur'].forEach(function (ev, i) { a.addEventListener(ev, function () { if (i === 1 && a.matches && !a.matches(':focus-visible')) return; if (i < 2) TL.p.hot = ri; else if (TL.p.hot === ri) TL.p.hot = -1; }); });
    });
  }
  function songSecs() { var s = player && player.songTime ? player.songTime() : 0; return isFinite(s) ? Math.max(0, s) : 0; }
  function layoutList() {
    // Laid out in the room the dialog allows, then the list shrinks to its rows.
    var p = TL.p; TL.box.style.height = ''; p.w = TL.box.clientWidth; p.h = TL.box.clientHeight; p.B = beat(null); p.tl = trackLayout(p);
    var u = p.tl.u; p.h = Math.min(p.h, p.tl.used * u); TL.box.style.height = p.h + 'px';
    TL.cv.width = Math.ceil(p.w / u); TL.cv.height = Math.ceil(p.h / u); TL.box.style.setProperty('--px', u + 'px');
    Array.prototype.forEach.call(TL.items, function (a) { var b = p.tl.css[+a.getAttribute('data-row')]; if (!b) return; a.style.left = b[0] + 'px'; a.style.top = b[1] + 'px'; a.style.width = b[2] + 'px'; a.style.height = b[3] + 'px'; });
    var hd = dlg.querySelector('.rl-tl__h .rl-px'); if (hd) { hd.setAttribute('data-scale', Math.max(2, u)); pxLabel(hd); }
    TL.key = '';
  }
  function paintList() {
    if (!listOpen) return;
    requestAnimationFrame(paintList);
    // Its own clock from the moment it opened: rows land, the play head blinks on the beat, long names scroll.
    var t = now() - tlT0, secs = songSecs(), st = trackState(TL.p, t), B = beat(TL.p);
    var key = st.shown + ':' + TL.p.hot + ':' + Math.floor(secs) + ':' + (Math.floor(t / B) % 2) + (TL.p.tl.scrolls.indexOf(true) >= 0 ? ':' + Math.floor(t * 12) : '') + (t < 1.2 ? ':' + Math.floor(t * 30) : '');
    if (key === TL.key) return;
    TL.key = key; drawTracks(TL.p, TL.cv.getContext('2d'), t, t, secs);
  }
  function openList() {
    if (!TL || listOpen) return;
    listOpen = true; listFrom = document.activeElement;
    dlg.hidden = false; root.classList.add('rl-tl-open'); if (listBtn) listBtn.setAttribute('aria-expanded', 'true');
    layoutList(); tlT0 = now(); requestAnimationFrame(paintList);
    var first = dlg.querySelector('a.rl-tl__a'); (first || TL.close).focus();
    emit('tracklist-open');
  }
  function closeList() {
    if (!listOpen) return;
    listOpen = false; dlg.hidden = true; root.classList.remove('rl-tl-open'); TL.p.hot = -1;
    if (listBtn) listBtn.setAttribute('aria-expanded', 'false');
    var back = listBtn && document.contains(listBtn) ? listBtn : listFrom; if (back && back.focus) back.focus();
    emit('tracklist-close');
  }
  if (listBtn) listBtn.addEventListener('click', function () { if (listOpen) closeList(); else openList(); });
  if (TL) {
    TL.close.addEventListener('click', closeList);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) closeList(); }); // the scrim around the list
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); closeList(); return; }
      var links = Array.prototype.slice.call(dlg.querySelectorAll('a.rl-tl__a')), f = [TL.close].concat(links), i = f.indexOf(document.activeElement), d = 0;
      if (e.key === 'Tab') d = e.shiftKey ? -1 : 1;
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') d = 1;
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') d = -1;
      if (!d) return;
      e.preventDefault(); f[(i + d + f.length) % f.length].focus();
    });
    window.addEventListener('resize', function () { if (listOpen) layoutList(); });
  }

  window.MTWToolbar = {
    register: function (p) { player = p || null; },
    setPaused: setPaused,
    pin: pin,
    show: show,
    isOpen: function () { return listOpen; },
    open: openList,
    close: closeList,
  };
})();
