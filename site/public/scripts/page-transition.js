/* Fixed seeded cubes fade down, then up across ordinary document navigation. */
(function () {
  var root = document.documentElement, motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var KEY = 'mtw-nav', COVER_MS = 660, ARRIVAL_MS = 810, RECOVER_MS = 2540;
  var coverResized = false, phase = 'idle', raf = 0, timer = 0, pending = null, layer, canvas, ctx, atlas, cells;
  var W, H, pitch, started = 0, coveredAt = null, palette, departure = null;
  function address(href) { return href.split('#')[0]; }
  function forget() { try { sessionStorage.removeItem(KEY); } catch (e) {} }
  function stop() { cancelAnimationFrame(raf); clearTimeout(timer); raf = timer = 0; }
  function unwatch() {
    if (departure && departure.signal) departure.signal.removeEventListener('abort', cancelDeparture);
    departure = null;
  }
  function cancelDeparture() { reset(); forget(); }
  function reset() {
    unwatch(); stop(); phase = 'idle'; pending = null; coverResized = false;
    ['nav', 'reveal', 'leaving'].forEach(function (name) { root.removeAttribute('data-mtw-' + name); });
    if (layer) { layer.replaceChildren(); layer.removeAttribute('style'); layer.removeAttribute('data-phase'); }
    canvas = ctx = atlas = cells = null;
  }
  function adopt() {
    if (!layer || !document.body) return;
    var placeholder = document.body.querySelector('.page-transition');
    if (placeholder && placeholder !== layer) placeholder.replaceWith(layer);
    else if (layer.parentNode !== document.body) document.body.prepend(layer);
  }
  function colors(saved) {
    if (saved) return saved;
    var s = getComputedStyle(root);
    return [s.getPropertyValue('--teal').trim() || '#1a9ba1', s.getPropertyValue('--muted').trim() || '#b9c3c4', s.getPropertyValue('--teal-light').trim() || '#5fc4c9'];
  }
  function prepare(saved) {
    // Body scrollbars must not change the viewport lattice.
    W = innerWidth || root.clientWidth; H = innerHeight;
    if (!W || !H) return false;
    layer = layer || document.querySelector('.page-transition');
    if (!layer) {
      layer = document.createElement('div'); layer.className = 'page-transition';
      layer.setAttribute('aria-hidden', 'true'); layer.setAttribute('inert', '');
      root.appendChild(layer); // Before body parsing; adopt this same painted layer later.
    }
    canvas = document.createElement('canvas'); atlas = document.createElement('canvas');
    var ink;
    try { ctx = canvas.getContext('2d'); ink = atlas.getContext('2d'); } catch (e) { return false; }
    if (!ctx || !ink) return false;
    palette = colors(saved); pitch = Math.round(Math.max(18, Math.min(28, W / 58)));
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.ceil(W * dpr); canvas.height = Math.ceil(H * dpr);
    // Five tiny atlas cells replace a second viewport bitmap or thousands of DOM nodes.
    var tile = Math.ceil(pitch * dpr); atlas.width = tile * 5; atlas.height = tile;
    ink.setTransform(tile / pitch, 0, 0, tile / pitch, 0, 0);
    var size = pitch * .76, off = (pitch - size) / 2;
    for (var kind = 0; kind < 5; kind++) {
      var left = kind * pitch;
      ink.globalAlpha = 1; ink.fillStyle = '#0b1419'; ink.fillRect(left, 0, pitch, pitch);
      ink.globalAlpha = .05; ink.strokeStyle = palette[1]; ink.lineWidth = 1;
      ink.beginPath(); ink.moveTo(left + .5, 0); ink.lineTo(left + .5, pitch);
      ink.moveTo(left, .5); ink.lineTo(left + pitch, .5); ink.stroke();
      if (kind) {
        ink.globalAlpha = [.16, .07, .34, .46][kind - 1];
        ink.fillStyle = [palette[0], palette[1], palette[0], palette[2]][kind - 1];
        ink.fillRect(left + off, off, size, size);
      }
    }
    var seed = 20260915, rows = Math.ceil(H / pitch), cols = Math.ceil(W / pitch) + 1;
    function rand() { seed = (seed + 0x6D2B79F5) | 0; var t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
    cells = [];
    for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
      var a = rand(), b = rand(), jitter = rand() * 60;
      if (x * pitch >= W) continue;
      var progress = rows > 1 ? y / (rows - 1) : 0;
      cells.push({ x: x, y: y, kind: a > .27 ? 0 : b < .60 ? 1 : b < .82 ? 2 : b < .95 ? 3 : 4,
        down: progress * 360 + jitter, up: (1 - progress) * 460 + jitter, alpha: -1 });
    }
    // Critical arrival coverage must not depend on late external/dev CSS.
    layer.style.cssText = 'position:fixed;inset:0;z-index:100;display:block;overflow:hidden;pointer-events:none;user-select:none';
    // Keep head paint unscaled through body adoption.
    canvas.style.cssText = 'display:block;width:' + W + 'px;height:' + H + 'px;position:absolute;inset:0';
    canvas.dataset.gridPitch = String(pitch);
    layer.replaceChildren(canvas); adopt();
    return true;
  }
  function paint(elapsed, direction) {
    var tile = atlas.height;
    cells.forEach(function (cell) {
      var t = direction === 'full' ? 1 : Math.max(0, Math.min(1, (elapsed - cell[direction]) / (direction === 'down' ? 180 : 260)));
      var alpha = t * t * (3 - 2 * t);
      if (direction === 'up') alpha = 1 - alpha;
      if (cell.alpha === alpha) return;
      cell.alpha = alpha;
      // Integer device-pixel edges meet exactly, even at fractional DPR.
      var x = Math.round(cell.x * pitch * canvas.width / W), y = Math.round(cell.y * pitch * canvas.height / H);
      var right = Math.round(Math.min(W, (cell.x + 1) * pitch) * canvas.width / W);
      var bottom = Math.round(Math.min(H, (cell.y + 1) * pitch) * canvas.height / H);
      ctx.clearRect(x, y, right - x, bottom - y);
      if (alpha) {
        ctx.globalAlpha = alpha;
        ctx.drawImage(atlas, cell.kind * tile, 0, tile * Math.min(pitch, W - cell.x * pitch) / pitch, tile * Math.min(pitch, H - cell.y * pitch) / pitch, x, y, right - x, bottom - y);
      }
    });
    ctx.globalAlpha = 1;
  }
  function markDeparture(url) {
    try { sessionStorage.setItem(KEY, JSON.stringify({ to: address(url), at: Date.now(), colors: palette })); } catch (e) {}
  }
  function recoverDeparture() {
    if (!departure) return;
    var age = Date.now() - departure.at;
    // An observed native request may simply be slow. Keep its paint and fresh handoff.
    markDeparture(departure.url);
    if (departure.signal && !departure.signal.aborted && age < 15000) {
      timer = setTimeout(recoverDeparture, Math.min(RECOVER_MS, 15000 - age));
    } else reset(); // Bounded usability fallback; preserve the marker for a late arrival.
  }
  if (window.navigation && window.navigation.addEventListener) window.navigation.addEventListener('navigate', function (event) {
    if (!departure || address(event.destination.url) !== address(departure.url) || !event.signal) return;
    var attempt = departure;
    attempt.signal = event.signal;
    event.signal.addEventListener('abort', cancelDeparture, { once: true });
    queueMicrotask(function () {
      if (departure === attempt && (event.defaultPrevented || event.signal.aborted)) cancelDeparture();
    });
  });
  function navigate() {
    var url = pending; if (!url) return;
    pending = null; phase = 'departed'; if (layer) layer.dataset.phase = phase;
    if (!motion.matches) {
      departure = { url: url, at: Date.now(), signal: null }; markDeparture(url);
      timer = setTimeout(recoverDeparture, RECOVER_MS);
    }
    try { location.assign(url); } catch (e) { cancelDeparture(); }
  }
  function tick(now) {
    if (phase !== 'cover' && phase !== 'reveal') return;
    var elapsed = now - started;
    paint(elapsed, phase === 'cover' ? coverResized ? 'full' : 'down' : 'up');
    if (phase === 'cover' && elapsed >= 600) {
      if (coveredAt === null) coveredAt = now;
      // A throttled first frame must also paint fully covered before navigation.
      if (elapsed >= COVER_MS && now - coveredAt >= 32) { navigate(); return; }
    }
    if (phase === 'reveal' && elapsed >= ARRIVAL_MS + 80) { reset(); return; }
    raf = requestAnimationFrame(tick);
  }
  function startReveal() {
    if (document.readyState === 'loading') { timer = setTimeout(startReveal, 50); return; }
    stop(); adopt();
    // Keep the full canvas through two rendering opportunities after readiness.
    raf = requestAnimationFrame(function () {
      raf = requestAnimationFrame(function (now) {
        if (motion.matches) { reset(); return; }
        phase = 'reveal'; layer.dataset.phase = phase; root.setAttribute('data-mtw-reveal', '');
        started = now; raf = requestAnimationFrame(tick);
      });
    });
  }
  function awaitPage() {
    if (phase !== 'waiting') return;
    adopt();
    if (document.readyState !== 'loading' && getComputedStyle(layer).getPropertyValue('--transition-ready').trim() === '1') startReveal();
    else raf = requestAnimationFrame(awaitPage);
  }
  function arrival(saved) {
    if (motion.matches || !prepare(saved)) { reset(); return; }
    phase = 'waiting'; layer.dataset.phase = phase;
    root.setAttribute('data-mtw-nav', ''); paint(0, 'full');
    timer = setTimeout(startReveal, RECOVER_MS); // Missing styles cannot trap the visitor.
    raf = requestAnimationFrame(awaitPage);
  }
  try {
    var saved = JSON.parse(sessionStorage.getItem(KEY) || 'null'); forget();
    if (saved && saved.to === address(location.href) && Date.now() - saved.at >= 0 && Date.now() - saved.at < 15000) arrival(saved.colors);
  } catch (e) { forget(); reset(); }
  function destination(a) {
    if (!a || a.hasAttribute('download') || (a.target && a.target !== '_self')) return null;
    var href = a.getAttribute('href'), url;
    if (!href || href.charAt(0) === '#') return null;
    try { url = new URL(a.href, location.href); } catch (e) { return null; }
    if (!/^(https?:|file:)$/.test(url.protocol) || url.protocol !== location.protocol || (url.protocol !== 'file:' && url.host !== location.host)) return null;
    return address(url.href) === address(location.href) ? null : url;
  }
  document.addEventListener('click', function (e) {
    if (motion.matches || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null, url = destination(a);
    if (!url) { if (a && pending) { reset(); forget(); } return; }
    var host = document.querySelector('.page-transition');
    if (!host || getComputedStyle(host).getPropertyValue('--transition-ready').trim() !== '1') return;
    try { sessionStorage.setItem(KEY, ''); forget(); } catch (error) { return; }
    reset(); if (!prepare()) { reset(); return; }
    e.preventDefault(); pending = url.href; phase = 'cover'; layer.dataset.phase = phase;
    root.setAttribute('data-mtw-leaving', ''); started = performance.now(); coveredAt = null;
    paint(0, 'down'); raf = requestAnimationFrame(tick);
  });
  window.addEventListener('pagehide', function () { stop(); unwatch(); }); // Preserve the painted cover through document replacement.
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) { reset(); forget(); arrival(); }
  });
  window.addEventListener('resize', function () {
    if (phase === 'idle') return;
    var oldPhase = phase; stop();
    if (!prepare(palette)) { reset(); return; }
    paint(oldPhase === 'reveal' ? performance.now() - started : 0, oldPhase === 'reveal' ? 'up' : 'full');
    if (oldPhase === 'cover') { coverResized = true; coveredAt = performance.now(); raf = requestAnimationFrame(tick); }
    else if (oldPhase === 'reveal') raf = requestAnimationFrame(tick);
    else if (oldPhase === 'departed') timer = setTimeout(recoverDeparture, RECOVER_MS);
    else { phase = 'waiting'; timer = setTimeout(startReveal, RECOVER_MS); raf = requestAnimationFrame(awaitPage); }
  });
  if (motion.addEventListener) motion.addEventListener('change', function () {
    if (motion.matches) { var url = pending; reset(); forget(); if (url) { pending = url; navigate(); } }
  });
})();
