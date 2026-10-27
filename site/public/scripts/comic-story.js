/* Comic Story (Comic B) engine. Component: src/components/ComicStory.astro; styles: src/styles/comic-story.css; schema:
   src/data/comic-stories/types.ts; skill: mtw-comic-story (references/deslop.md; config in assets/); facts:
   wiki/site/comic-story.md.

   A real comic page, revealed box by box. Everything drawn is a pure function of the story clock T (seconds from the
   song's first downbeat), so seeking, pausing and jumping never leave stale state:
   - The page sits in the site's flow under the MTW header (a -b page's header, or the reader's page), one screen tall. Its
     gutters, margins and borders take the reference pages' ratios of the short side, in whole pixels (page-constants).
     A scene may be one generated page (`art`, the art owns the outline; boxes are reveal regions) or boxes of their own.
     Phones reflow boxes into portrait pages.
   - Every box shows at 30% from the start; at its beat a box comes up to full, its balloons fade in and their lettering
     types on word by word. A click on a box jumps to it; anywhere else, or ArrowRight, reveals the next box; Shift or a
     sideways swipe moves a scene. Scenes fade box by box, in reading order, in and out. No camera, no slides, no wipes.
   - Balloons are ink shapes drawn around composed lettering (balloon-style config): speech, thought, burst, fear, caption,
     place. Fills slightly translucent, ink and lettering opaque.
   - Holds (the song's dead stops) freeze. Motion inside a box comes only from the art's own data-fx groups.
   - The song loops under a longer story (music.loop); the clock stays on the beat across loops. Out of view, it rests.
   - Sound: shares the site's sound setting (localStorage 'mtw-sound', window.MTWTactile) and the mixtape
     (sessionStorage 'mtw-mixtape') with the Beat Comics. Issues overlay, [ and ] for issues, NEXT page of choices.
   Test hooks: ?scene=<id>&beat=<n> or ?t=<s> seeks; ?hold freezes there (no music); ?mute; ?beat=tick; ?reel=off (still);
   window.MTWComicStory.{status, seek, go, issue, openIssues, closeIssues}. */
(function () {
  'use strict';
  var root = document.documentElement;
  var stage = document.querySelector('[data-comic-stage]');
  var dataEl = document.getElementById('comic-story');
  if (!root.hasAttribute('data-comic')) return;
  if (!stage || !dataEl) { root.setAttribute('data-comic', 'done'); root.removeAttribute('data-mtw-reveal'); return; }
  var story;
  try { story = JSON.parse(dataEl.textContent); } catch (e) { root.setAttribute('data-comic', 'done'); root.removeAttribute('data-mtw-reveal'); return; }

  var q = new URLSearchParams(location.search);
  var cfg = {};
  try { cfg = JSON.parse((document.getElementById('comic-config') || {}).textContent || '{}') || {}; } catch (e) { cfg = {}; }
  var APP = cfg.mode === 'standalone';
  // One versioned config in the skill (assets/page-constants.json and balloon-style.json), passed in by the component.
  var PAGE = cfg.page || {}, BS = cfg.balloon || {};
  function bs(kind, key, d) { var k = BS[kind]; return k && k[key] != null ? k[key] : d; }
  // Reduced motion or ?reel=off: every page shown complete and still, reader-paced (on a -b page too: the comic is its header).
  var REDUCED = !!cfg.still || q.get('reel') === 'off' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Dark page ground by default (Matt, 2026-09-28: "use dark by default please"); newsprint paper only as an option.
  var THEME = q.get('theme') === 'paper' || story.theme === 'paper' ? 'paper' : 'dark';
  stage.setAttribute('data-theme', THEME);
  stage.setAttribute('data-story', story.id);
  // Verification only: ?bg=grey shows every box as flat mid-grey, so the style check can measure balloon fills for seams.
  if (q.get('bg') === 'grey') stage.setAttribute('data-bg', 'grey');
  var B = 60 / story.bpm;                       // seconds per beat
  var scenes = story.scenes || [];
  // Test hook: ?art=<path without extension> puts raster page art on the scene named by ?scene (or the first), to verify the
  // raster path before real art exists.
  if (q.get('art')) { var at0 = scenes.filter(function (x) { return x.id === q.get('scene'); })[0] || scenes[0]; if (at0) at0.art = q.get('art'); }
  var NEXT_T = story.next.b * B;                // the NEXT page's start, seconds
  var END_T = NEXT_T + 1.5 * B;                 // fully shown; the story holds here
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function c01(v) { return clamp(v, 0, 1); }
  function ease(k) { k = c01(k); return k * k * (3 - 2 * k); }
  function inOut(k) { k = c01(k); return 0.5 - 0.5 * Math.cos(Math.PI * k); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function now() { return performance.now() / 1000; }
  function el(tag, cls, parent) { var e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; }
  var SVGNS = 'http://www.w3.org/2000/svg';

  var view = stage.querySelector('.cs-view'), cam = stage.querySelector('.cs-cam'), veil = stage.querySelector('.cs-veil');
  // No masthead or chapter slate any more (no presentation chrome, 2026-09-28): detached stand-ins keep the render simple.
  var mast = stage.querySelector('.cs-mast') || document.createElement('div'), titleEl = stage.querySelector('.cs-title') || document.createElement('div'), nextEl = stage.querySelector('.cs-next');
  var hint = stage.querySelector('.cs-hint'), progress = null;
  var tag = stage.querySelector('.cs-tag'), muteBtn = stage.querySelector('.cs-tag__mute');

  /* ---------- Art: fetch, sanitize and inline SVG ---------- */
  var artRoot = location.protocol === 'file:' && document.currentScript && document.currentScript.src ? new URL('../', document.currentScript.src).href : null;
  function artUrl(img) {
    // File-review JSON already contains document-relative media URLs. Only bare legacy IDs gain .svg.
    var path = img.split(/[?#]/)[0], explicit = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(img) || path.indexOf('/') >= 0 || /\.(?:svg|png|webp|avif|jpe?g)$/i.test(path);
    var url = explicit ? img : '/comic/' + story.id + '/' + path + '.svg' + img.slice(path.length);
    if (artRoot && url.charAt(0) === '/' && url.charAt(1) !== '/') return new URL(url.slice(1), artRoot).href;
    return explicit && url.charAt(0) !== '/' ? new URL(url, document.baseURI).href : url;
  }
  var svgCache = {};
  function fetchSvg(url) {
    if (!svgCache[url]) svgCache[url] = fetch(url, { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); });
    return svgCache[url];
  }
  var uid = 0;
  // Strip anything active or external; prefix ids so many inlined SVGs never collide.
  function sanitize(text) {
    var doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    var svg = doc.documentElement;
    if (!svg || svg.nodeName.toLowerCase() !== 'svg' || doc.getElementsByTagName('parsererror').length) return null;
    ['script', 'foreignObject', 'iframe', 'object', 'embed', 'audio', 'video', 'animate', 'set', 'animateTransform', 'animateMotion'].forEach(function (n) {
      Array.prototype.slice.call(svg.getElementsByTagName(n)).forEach(function (x) { x.parentNode.removeChild(x); });
    });
    var pre = 'cs' + (++uid) + '-', ids = {};
    var all = [svg].concat(Array.prototype.slice.call(svg.getElementsByTagName('*')));
    all.forEach(function (x) { if (x.id) { ids[x.id] = pre + x.id; x.id = pre + x.id; } });
    function fixRefs(v) { return v.replace(/url\(\s*['"]?#([^'")\s]+)['"]?\s*\)/g, function (m, id) { return ids[id] ? 'url(#' + ids[id] + ')' : 'none'; }); }
    all.forEach(function (x) {
      Array.prototype.slice.call(x.attributes).forEach(function (a) {
        var n = a.name.toLowerCase(), v = a.value;
        if (n.indexOf('on') === 0) { x.removeAttribute(a.name); return; }
        if (n === 'href' || n === 'xlink:href') {
          if (v.charAt(0) === '#') { var id = v.slice(1); if (ids[id]) x.setAttribute(a.name, '#' + ids[id]); else x.removeAttribute(a.name); }
          else if (!/^data:image\/(png|jpeg|webp|gif);/i.test(v)) x.removeAttribute(a.name);
          return;
        }
        if (/url\(/i.test(v)) {
          if (/url\(\s*['"]?(?!#)/i.test(v)) { x.removeAttribute(a.name); return; }
          x.setAttribute(a.name, fixRefs(v));
        }
      });
    });
    Array.prototype.slice.call(svg.getElementsByTagName('style')).forEach(function (s) {
      var css = s.textContent || '';
      css = css.replace(/@import[^;]*;?/gi, '').replace(/url\(\s*['"]?(?!#)[^)]*\)/gi, 'none');
      css = fixRefs(css).replace(/#([A-Za-z_][\w-]*)/g, function (m, id) { return ids[id] ? '#' + ids[id] : m; });
      s.textContent = css;
    });
    var out = document.importNode(svg, true);
    out.removeAttribute('width'); out.removeAttribute('height');
    out.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    out.setAttribute('class', 'cs-svg');
    out.setAttribute('aria-hidden', 'true'); out.setAttribute('focusable', 'false');
    return out;
  }

  /* ---------- Build the pages ---------- */
  // Boxes enter and leave with staggered fades in reading order.
  var model = scenes.map(function (sc, si) {
    var page = el('div', 'cs-page', cam);
    var gut = el('div', 'cs-gutters', page); gut.setAttribute('aria-hidden', 'true');
    // SVG page art draws the whole page; raster page art is cut into its boxes, laid out like any issue (full window).
    if (sc.art) page.classList.add(/\.svg$/i.test(sc.art) ? 'is-art' : 'is-boxart');
    page.dataset.scene = sc.id;
    var panels = sc.panels.map(function (p, pi) {
      var e = el('div', 'cs-panel', page);
      e.tabIndex = 0; e.setAttribute('role', 'button'); e.setAttribute('aria-label', 'Box ' + (pi + 1) + ': ' + (p.alt || ''));
      e.dataset.scene = String(si); e.dataset.box = String(pi);
      var art = el('div', 'cs-panel__art', e);
      el('p', 'cs-panel__alt', e).textContent = p.img || ''; // placeholder only: a tiny id label while the art is missing
      var fx = p.fx || [];
      var o = { d: p, el: e, art: art, svg: null, layers: [], rain: [], flick: [], floors: [], loaded: false, loading: false, balloons: [], cache: {} };
      // No engine-drawn overlays (Matt, 2026-09-28: only what the comics use): motion comes from the art's own data-fx
      // groups or not at all. A hold is a simple freeze.
      // The box's inked border: thick, slightly irregular, drawn as a vector over the art (crisp at any DPR).
      o.border = document.createElementNS(SVGNS, 'svg'); o.border.setAttribute('class', 'cs-border'); o.border.setAttribute('aria-hidden', 'true'); e.appendChild(o.border);
      o.seed = si * 31 + pi * 7 + 1;
      // Box shapes (Matt, 2026-09-28: "they do not have n/s/e/w borders"): an open box bleeds into the paper with a rough
      // ink edge; a clipped box is cut on a diagonal; an inset overlaps the box under it with a thick border and a paper margin.
      if (p.open) e.classList.add('is-open');
      if (p.inset) e.classList.add('is-inset');
      if (p.clip && p.clip.length >= 3) e.dataset.clip = '';
      if (p.clip && p.clip.length >= 3) art.style.clipPath = 'polygon(' + p.clip.map(function (q) { return (q[0] * 100).toFixed(2) + '% ' + (q[1] * 100).toFixed(2) + '%'; }).join(',') + ')';
      (p.balloons || []).forEach(function (b) {
        // The kind and the voice (state) decide the drawing (the measured usage table, skill references/lettering-and-balloons.md).
        // Approved 2.1.0: white speech, yellow thoughts with bead stems, yellow square captions.
        var k = kindOf(b.kind), st = stateOf(b), asCap = k === 'caption' || k === 'place';
        var w = el('div', 'cs-bw', e); w.setAttribute('data-kind', k); w.setAttribute('data-state', st);
        if (b.characterIntro) w.setAttribute('data-character-intro', '');
        if (b.sceneSetup) w.setAttribute('data-scene-setup', '');
        var box = el('div', 'cs-b cs-b--' + k + (asCap ? ' cs-b--cap' : '') + (st === 'panic' ? ' cs-b--panic' : ''), w);
        var text = b.text;
        box.setAttribute('aria-label', text.replace(/\n/g, ' '));
        // The balloon's hand-inked shape sits under its lettering.
        var shape = document.createElementNS(SVGNS, 'svg'); shape.setAttribute('class', 'cs-bshape'); shape.setAttribute('aria-hidden', 'true'); w.insertBefore(shape, box);
        if (b.breakout) w.classList.add('is-breakout');
        // Typing pace: the lettering finishes within half the balloon's reading budget (1 s + 0.3 s a word). The words are
        // set into composed lines at layout (setLines), since the line breaks depend on the lettering size.
        var nw = text.split(/\s+/).filter(Boolean).length;
        o.balloons.push({ d: b, kind: k, st: st, cap: asCap, text: text, words: parseWords(text, b.em), w: w, box: box, shape: shape, last: '', units: [], shown: -1, budget: 1 + 0.3 * nw, per: 0.12, parts: [] });
      });
      return o;
    });
    return { d: sc, si: si, page: page, gut: gut, panels: panels, dir: si % 2 === 0 ? -1 : 1, sheets: [], times: [] };
  });

  // Page-art mode (Matt, 2026-09-28: "we want comic book"): a scene's `art` is a whole inked page (its borders, gutters and
  // margins drawn). It is shown once as a base (outside the boxes: the page's outline and ground) and once per box, clipped
  // to the box's region, so each box, its border with it, can ghost, reveal and fade on its own. Regions are the panels'
  // rects (or clip polygons) in fractions of the art's viewBox.
  function loadPageArt(m) {
    if (m.artLoading) return; m.artLoading = true;
    m.artPromise = fetchSvg(artUrl(m.d.art)).then(function (text) {
      var src = sanitize(text); if (!src) throw new Error('bad svg');
      var vb = (src.getAttribute('viewBox') || '0 0 1600 900').split(/[\s,]+/).map(Number), VW = vb[2] || 1600, VH = vb[3] || 900;
      var id = 'cs-pa-' + (++uid), svg = document.createElementNS(SVGNS, 'svg');
      svg.setAttribute('class', 'cs-pageart'); svg.setAttribute('viewBox', vb.join(' ')); svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      var defs = document.createElementNS(SVGNS, 'defs'), g = document.createElementNS(SVGNS, 'g'); g.id = id;
      while (src.firstChild) { var c = src.firstChild; if (c.nodeName === 'defs' || c.nodeName === 'style') defs.appendChild(c); else g.appendChild(c); }
      defs.appendChild(g);
      var region = function (o) {
        var r = o.d.r, cp = o.d.clip;
        if (cp && cp.length >= 3) return '<polygon points="' + cp.map(function (q) { return (r[0] + q[0] * r[2]) * VW + ',' + (r[1] + q[1] * r[3]) * VH; }).join(' ') + '"/>';
        return '<rect x="' + r[0] * VW + '" y="' + r[1] * VH + '" width="' + r[2] * VW + '" height="' + r[3] * VH + '"/>';
      };
      var mask = '<mask id="' + id + '-base" maskUnits="userSpaceOnUse" x="0" y="0" width="' + VW + '" height="' + VH + '"><rect width="' + VW + '" height="' + VH + '" fill="#fff"/><g fill="#000">' + m.panels.map(region).join('') + '</g></mask>';
      var clips = m.panels.map(function (o, i) { return '<clipPath id="' + id + '-r' + i + '">' + region(o) + '</clipPath>'; }).join('');
      defs.insertAdjacentHTML('beforeend', mask + clips);
      svg.appendChild(defs);
      svg.insertAdjacentHTML('beforeend', '<g class="cs-pa-base" mask="url(#' + id + '-base)"><use href="#' + id + '"/></g>' + m.panels.map(function (o, i) { return '<g class="cs-pa-r" clip-path="url(#' + id + '-r' + i + ')" opacity="0"><use href="#' + id + '"/></g>'; }).join(''));
      m.page.insertBefore(svg, m.page.firstChild);
      var base = svg.querySelector('.cs-pa-base'), regs = svg.querySelectorAll('.cs-pa-r'), last = [], lastBase = '';
      // Art effects inside the page (data-fx groups) animate through every clipped copy at once.
      m.artFlick = []; m.artRain = [];
      Array.prototype.forEach.call(g.querySelectorAll('[data-fx]'), function (fg) { var k = fg.getAttribute('data-fx'); if (k === 'flicker') m.artFlick.push({ g: fg, seed: m.artFlick.length + 1, last: '' }); else if (k === 'rain') m.artRain.push({ g: fg, loop: parseFloat(fg.getAttribute('data-loop')) || VH * 0.1, last: '' }); });
      m.art = { vw: VW, vh: VH, svg: svg, ops: [], setRegion: function (i, o, op) {
        var v = op.toFixed(3); if (last[i] !== v && regs[i]) { regs[i].setAttribute('opacity', v); last[i] = v; }
        if (lastBase !== '1') { base.setAttribute('opacity', '1'); lastBase = '1'; } // the page's own gutters stay full
      } };
      measure(); render(T);
    }).catch(function () { m.page.classList.add('is-art-missing'); });
  }
  // The paper texture sits where ink meets paper: one multiply layer per page, just above the page's own art (its margins,
  // gutters and page art) and below the boxes, and one inside each box's art (comic-story.css .cs-panel__art::after).
  // Balloons and captions are never under it: they carry their own mean-preserving grain.
  model.forEach(function (m) { var fx = el('div', 'cs-paperfx', null); fx.setAttribute('aria-hidden', 'true'); m.page.insertBefore(fx, m.gut.nextSibling); });
  // Raster page art (Matt, 2026-09-29): /comic/<story>/<art>-<width>.avif|webp at the widths in page-constants
  // (artWidths). Copies stop at the master's own width (Matt, 2026-10-11), so the one slot is 1600; no upscales. The page is cut into its boxes
  // (Matt, 2026-10-04: "all be full screen ... scaling the boxes creating desktop and mobile views"): the boxes are laid
  // out from their `r` like any issue, edge to edge on a wide window and reflowed on a phone, and each box shows its own
  // region of the page art (`ar`, default `r`) scaled to cover it. One decoded image per page is shared by every box as a
  // background; no box carries its own copy of the whole page (45 full-page copies left the demo's boxes unpainted).
  function isRasterArt(m) { return m.d.layers && m.d.layers.length || m.d.art && !/\.svg$/i.test(m.d.art); }
  var layerArtDisposed = false, pendingLayerLoads = [], activePanelViews = [], activeAgentFabrications = [];
  function disposeLayerArt() {
    if (layerArtDisposed) return; layerArtDisposed = true;
    activeAgentFabrications.slice().forEach(removeAgentFabrication);
    pendingLayerLoads.slice().forEach(function (cancel) { cancel(); });
    activePanelViews.forEach(function (entry) {
      clearViewLayers(entry.o);
      entry.o.viewCrop.style.display = 'none';
      showPanelBase(entry.m, entry.o, !entry.o.d.staticArt && !entry.o.d.fallbackView); if (entry.o.artMissing) entry.o.artMissing.style.display = 'none';
    }); activePanelViews = [];
    document.removeEventListener('astro:before-swap', disposeLayerArt);
    window.removeEventListener('pagehide', layerPageHide);
  }
  function layerPageHide(event) { if (!event.persisted) disposeLayerArt(); }
  document.addEventListener('astro:before-swap', disposeLayerArt);
  window.addEventListener('pagehide', layerPageHide);
  function loadLayerArt(m) {
    var layers = m.d.layers;
    return Promise.all(layers.map(function (layer) {
      return new Promise(function (resolve, reject) {
        var img = new Image(), settled = false, timer = 0;
        function finish(error) {
          if (settled) return; settled = true; clearTimeout(timer); img.onload = img.onerror = null;
          var index = pendingLayerLoads.indexOf(cancel); if (index >= 0) pendingLayerLoads.splice(index, 1);
          if (error) reject(error); else resolve(img);
        }
        function cancel() { finish(new Error('Comic plane load cancelled: ' + layer.id)); img.src = ''; }
        if (layerArtDisposed) { finish(new Error('Comic plane owner disposed')); return; }
        pendingLayerLoads.push(cancel);
        timer = setTimeout(function () { finish(new Error('Comic plane load/decode timed out: ' + layer.id)); img.src = ''; }, 10000);
        img.onload = function () {
          Promise.resolve().then(function () { return img.decode ? img.decode() : null; }).then(function () { finish(); }, finish);
        };
        img.onerror = function () { finish(new Error('Missing comic plane: ' + layer.id)); }; img.src = artUrl(layer.src);
      });
    })).then(function (decoded) {
      if (layerArtDisposed) return;
      var first = decoded[0], aspect = first.naturalWidth / first.naturalHeight;
      if (!first.naturalWidth || decoded.some(function (img) { return Math.abs(img.naturalWidth / img.naturalHeight - aspect) > 0.001; })) throw new Error('Comic planes have different aspects');
      m.art = { vw: first.naturalWidth, vh: first.naturalHeight, raster: true, layered: true, img: first, setRegion: function () {} };
      m.crops = m.panels.map(function (o) {
        var stack = el('div', 'cs-crop-stack', o.art); o.motionArt = stack;
        o.layerCrops = layers.map(function (layer, index) {
          var crop = el('div', 'cs-crop cs-art-layer', stack); crop.setAttribute('data-layer-id', layer.id); crop.setAttribute('data-layer-role', layer.role);
          crop.style.backgroundImage = 'url("' + decoded[index].src + '")'; crop.style.opacity = layer.opacity == null ? '1' : String(clamp(layer.opacity, 0, 1));
          return { element: crop, spec: layer, image: decoded[index], cache: {} };
        });
        o.loaded = true; return o.layerCrops[0].element;
      });
      m.page.setAttribute('data-art-mode', 'layers'); measure(); render(T);
    }).catch(function (error) {
      if (layerArtDisposed) return;
      m.page.setAttribute('data-layer-error', error.message); m.page.setAttribute('data-art-mode', 'fallback');
      if (!m.d.art) { m.page.classList.add('is-art-missing'); m.panels.forEach(function (o) { o.loaded = true; }); return; }
      m.layerFallback = true; m.artReady = null; return loadRasterArt(m);
    });
  }
  // Source cuts decode independently; every completion samples the current held clock.
  function viewSource(spec, phone) {
    if (!phone || !spec.phone) return spec;
    return { src: spec.phone.src || spec.src, ar: spec.phone.ar || spec.ar,
      alternates: spec.phone.alternates || spec.alternates, canonicalSource: spec.phone.canonicalSource || spec.canonicalSource, fit: spec.phone.fit || spec.fit,
      speakers: spec.phone.speakers || spec.speakers, protectedFaces: spec.phone.protectedFaces || spec.protectedFaces };
  }
  function panelBaseCrops(m, o) {
    return o.layerCrops ? o.layerCrops.map(function (l) { return l.element; }) : [m.crops && m.crops[m.panels.indexOf(o)]];
  }
  function showPanelBase(m, o, show) {
    panelBaseCrops(m, o).forEach(function (target) { if (target) target.style.visibility = show ? '' : 'hidden'; });
  }
  function loadViewImage(src, registerCancel) {
    return new Promise(function (resolve, reject) {
      var img = new Image(), settled = false, timer = 0;
      function finish(error) {
        if (settled) return; settled = true; clearTimeout(timer); img.onload = img.onerror = null;
        var index = pendingLayerLoads.indexOf(cancel); if (index >= 0) pendingLayerLoads.splice(index, 1);
        if (error) reject(error); else resolve(img);
      }
      function cancel() { finish(new Error('Comic view cancelled')); img.src = ''; }
      if (layerArtDisposed) { finish(new Error('Comic view owner disposed')); return; }
      pendingLayerLoads.push(cancel); if (registerCancel) registerCancel(cancel);
      timer = setTimeout(function () { finish(new Error('Comic view load/decode timed out')); img.src = ''; }, 10000);
      img.onload = function () { Promise.resolve().then(function () { return img.decode ? img.decode() : null; }).then(function () {
        if (!img.naturalWidth || !img.naturalHeight) finish(new Error('Comic view has no dimensions')); else finish();
      }, finish); };
      img.onerror = function () { finish(new Error('Missing comic view')); }; img.src = artUrl(src);
    });
  }
  function sourceKey(spec) { return JSON.stringify([spec.src].concat(spec.alternates || [])); }
  function loadPanelSource(m, o, spec) {
    var key = sourceKey(spec), state = o.sourceStates[key]; if (state) return state;
    state = o.sourceStates[key] = { status: 'loading', spec: spec };
    var urls = [spec.src].concat(spec.alternates || []), at = 0;
    function attempt() {
      if (layerArtDisposed) return Promise.resolve();
      var src = urls[at++], request = o.sourceRequests[src];
      if (!request) request = o.sourceRequests[src] = loadViewImage(src);
      return request.then(function (img) {
        if (layerArtDisposed) return;
        var ref = spec.canonicalSource, identity = ref && ref.path + ':' + ref.sha256, aspect = img.naturalWidth / img.naturalHeight;
        if (identity && o.sourceAspects[identity] != null && Math.abs(o.sourceAspects[identity] - aspect) > 0.002) throw new Error('Comic source encodings have different aspects');
        if (identity) o.sourceAspects[identity] = aspect;
        state.status = 'ready'; state.img = img; state.resolvedSrc = src;
      }).catch(function (error) {
        if (layerArtDisposed) return;
        state.error = error.message;
        if (at < urls.length) return attempt();
        state.status = 'missing';
      });
    }
    state.promise = attempt().then(function () { if (!layerArtDisposed) {
      if (o.d.staticArt && sourceKey(spec) === sourceKey(viewSource(o.d.staticArt, mode === 'phone'))) o.loaded = true;
      placeViewCrops(m); render(T);
    } });
    return state;
  }
  function preparePanelSources(m, o) {
    if (o.d.fallbackView) { var first = panelFallbackView(o); if (first) loadViewLayers(m, o, first); return; }
    if (o.d.staticArt) loadPanelSource(m, o, viewSource(o.d.staticArt, mode === 'phone'));
    (o.d.views || []).forEach(function (v) { if (!v.layers && (!v.media || v.media === (mode === 'phone' ? 'phone' : 'desktop'))) loadPanelSource(m, o, viewSource(v, mode === 'phone')); });
  }
  function loadPanelViews(m) {
    m.panels.forEach(function (o) {
      if ((!o.d.staticArt && (!o.d.views || !o.d.views.length)) || o.sourcesPrepared) return;
      o.sourcesPrepared = true; o.sourceStates = {}; o.sourceRequests = {}; o.sourceAspects = {};
      if (o.d.fallbackView) o.loaded = false;
      o.viewCrop = el('div', 'cs-crop cs-ordered-view', o.art); o.viewCrop.style.display = 'none'; o.viewCrop.setAttribute('aria-hidden', 'true');
      if (o.d.staticArt || (o.d.views || []).some(function (v) { return v.layers; })) {
        if (o.d.staticArt || o.d.fallbackView) showPanelBase(m, o, false);
        o.artMissing = el('span', 'cs-art-missing', o.art); o.artMissing.textContent = 'Artwork unavailable.';
        o.artMissing.setAttribute('role', 'status'); o.artMissing.style.display = 'none';
        o.artMissing.style.position = 'absolute'; o.artMissing.style.inset = '0'; o.artMissing.style.placeItems = 'center';
      }
      activePanelViews.push({ m: m, o: o }); preparePanelSources(m, o);
      // Compatibility promise covers current layout only; one rejection never discards sibling sources.
      o.viewsReady = Promise.all(Object.keys(o.sourceStates).map(function (key) { return o.sourceStates[key].promise; }));
    });
  }
  // A selected group is atomic. No incomplete archive or superseded flat base is installed.
  function clearViewLayers(o) {
    if (o.viewLayerState && o.viewLayerState.status === 'loading') {
      o.viewLayerState.cancelled = true; o.viewLayerState.cancels.slice().forEach(function (cancel) { cancel(); });
      delete o.viewLayerStates[o.viewLayerState.id];
    }
    (o.viewLayerCrops || []).forEach(function (l) { removeAgentFabrication(l); o.viewCrop.removeChild(l.element); });
    o.viewLayerCrops = []; o.viewLayerState = null;
  }
  function loadViewLayers(m, o, view) {
    if (o.viewLayerState && o.viewLayerState.id === view.id) return o.viewLayerState;
    if (!o.d.fallbackView) clearViewLayers(o); o.viewLayerStates = o.viewLayerStates || {};
    var state = o.viewLayerStates[view.id];
    if (!state) {
      state = o.viewLayerStates[view.id] = { id: view.id, status: 'loading', cancels: [], cancelled: false };
      function decode(layer) {
        var urls = [layer.src].concat(layer.alternates || []), index = 0;
        function attempt() {
          if (state.cancelled || layerArtDisposed) return Promise.reject(new Error('Comic group cancelled'));
          var src = urls[index++], request;
          if (o.d.fallbackView) { o.viewLayerRequests = o.viewLayerRequests || {}; request = o.viewLayerRequests[src] || (o.viewLayerRequests[src] = loadViewImage(src)); }
          else request = loadViewImage(src, function (cancel) { state.cancels.push(cancel); });
          return request.catch(function (error) {
            if (!state.cancelled && !layerArtDisposed && index < urls.length) return attempt(); throw error;
          });
        } return attempt();
      }
      state.promise = Promise.all(view.layers.map(decode)).then(function (images) {
        if (state.cancelled || layerArtDisposed) return;
        if (images.some(function (img, i) {
          var layer = view.layers[i], independent = layer.role === 'agents' && layer.agentPlacement || (layer.role === 'props' || layer.role === 'light') && layer.propPlacement;
          return !independent && (img.naturalWidth !== images[0].naturalWidth || img.naturalHeight !== images[0].naturalHeight);
        })) throw new Error('Comic view planes must share exact canvas dimensions unless their full silhouette has an independent placement');
        state.images = images; state.status = 'ready';
      }).catch(function (error) {
        if (state.cancelled || layerArtDisposed) return;
        state.status = 'missing'; state.error = error.message;
        state.cancels.slice().forEach(function (cancel) { cancel(); });
      }).then(function () { if (!state.cancelled && !layerArtDisposed) { if (o.viewLayerState === state) o.loaded = true; render(T); } });
    }
    if (!o.d.fallbackView) o.viewLayerState = state; return state;
  }
  function panelFallbackView(o) {
    var media = mode === 'phone' ? 'phone' : 'desktop', id = o.d.fallbackView && o.d.fallbackView[media];
    if (typeof id !== 'string') return null;
    var matches = (o.d.views || []).filter(function (v) { return v.id === id && (!v.media || v.media === media); }), v = matches[0];
    return matches.length === 1 && v.at === 0 && v.canonicalSource && Array.isArray(v.layers) && v.layers.length >= 2 && v.layers[0].role === 'background' && v.layers.every(function (l) { return l.canonicalSource; }) ? v : null;
  }
  function applyViewLayers(m, o, view, beat, stop) {
    var state = loadViewLayers(m, o, view);
    if (o.d.fallbackView) {
      var requested = view, requestedState = state, first = panelFallbackView(o);
      if (state.status !== 'ready' && first && first.id !== view.id) { view = first; state = loadViewLayers(m, o, first); }
      o.el.setAttribute('data-requested-view-id', requested.id); o.el.setAttribute('data-requested-view-mode', requestedState.status);
      o.el.setAttribute('data-view-fallback', view.id !== requested.id ? 'true' : 'false');
      if (state.status !== 'ready') {
        clearViewLayers(o); showPanelBase(m, o, false); o.loaded = false;
        o.selectedSource = null; o.selectedImage = null; o.activeViewId = ''; o.viewCrop.style.display = 'none';
        o.el.setAttribute('data-view-id', ''); o.el.setAttribute('data-view-source', ''); o.el.setAttribute('data-view-mode', state.status);
        o.el.setAttribute('data-view-error', state.error || requestedState.error || 'Complete first group loading');
        o.artMissing.textContent = state.status === 'missing' ? 'Artwork unavailable.' : 'Artwork loading.'; o.artMissing.style.display = 'grid';
        refreshSpeakerLayout(m, o); return;
      }
      if (o.viewLayerState !== state) { clearViewLayers(o); o.viewLayerState = state; }
      o.el.setAttribute('data-view-error', requestedState.error || (requestedState.status !== 'ready' ? 'Requested view loading; complete first group retained' : ''));
    }
    o.activeViewId = view.id; o.el.setAttribute('data-view-id', view.id); o.el.setAttribute('data-view-mode', state.status);
    if (!o.d.fallbackView) o.el.setAttribute('data-view-error', state.error || '');
    if (state.status !== 'loading') o.loaded = true;
    o.el.setAttribute('aria-label', 'Box ' + (m.panels.indexOf(o) + 1) + ': ' + view.alt);
    if (state.status !== 'ready') {
      o.el.setAttribute('data-view-source', '');
      // Keep the declared complete static source while a newly selected group decodes. Hiding it here
      // produced empty boxes after seek although all source HTTP requests succeeded.
      var fallback = o.d.staticArt && viewSource(o.d.staticArt, mode === 'phone');
      var fallbackState = fallback && loadPanelSource(m, o, fallback);
      if (fallbackState && fallbackState.status === 'ready') {
        showPanelBase(m, o, false);
        o.selectedSource = fallback; o.selectedImage = fallbackState.img; o.activeViewId = '';
        placeViewCrops(m); o.viewCrop.style.display = ''; o.viewCrop.style.transform = 'none'; o.viewCrop.style.filter = 'none';
        o.el.setAttribute('data-view-source', fallbackState.resolvedSrc); o.el.setAttribute('data-static-art-mode', 'ready');
        o.artMissing.style.display = 'none'; refreshSpeakerLayout(m, o);
      } else {
        // A selected group is atomic. Until complete, retain the complete page-art fallback, never its bare clean plate.
        showPanelBase(m, o, true); o.viewCrop.style.display = 'none'; o.selectedSource = null; o.selectedImage = null;
        o.artMissing.style.display = state.status === 'missing' ? 'grid' : 'none'; refreshSpeakerLayout(m, o);
      }
      return;
    }
    showPanelBase(m, o, false);
    if (!o.viewLayerCrops.length) o.viewLayerCrops = view.layers.map(function (layer, i) {
      var crop = el('div', 'cs-crop cs-art-layer', o.viewCrop);
      crop.setAttribute('data-layer-id', layer.id); crop.setAttribute('data-layer-role', layer.role);
      crop.style.position = 'absolute'; crop.style.inset = '0'; crop.style.mixBlendMode = 'normal';
      crop.style.backgroundImage = 'url("' + state.images[i].src + '")';
      return { element: crop, spec: layer, image: state.images[i] };
    });
    o.selectedSource = viewSource(view, mode === 'phone'); o.selectedImage = state.images[0]; placeViewCrops(m);
    o.viewCrop.style.display = ''; o.artMissing.style.display = 'none';
    o.el.setAttribute('data-view-source', state.images[0].src);
    refreshSpeakerLayout(m, o);
    var start = o.d.at + view.at;
    o.viewLayerCrops.forEach(function (layer) {
      var motion = (view.layerMotion || []).find(function (spec) { return spec.layerId === layer.spec.id; });
      if (motion && motion.preset === 'projection' && layer.spec.role && layer.spec.role !== 'agents') motion = null;
      if (motion && (motion.preset === 'travel' || motion.preset === 'vibrate') && layer.spec.role !== 'props') motion = null;
      var sample = panelMotionSample(motion, beat, start, stop, REDUCED), crop = layer.element;
      crop.style.opacity = String((layer.spec.opacity == null ? 1 : layer.spec.opacity) * (floorContributionAvailable(motion, m, beat) ? (sample.opacity == null ? 1 : sample.opacity) : 0));
      crop.style.transform = layerMotionTransform(sample, crop, layer.placement || o.viewPlacement); crop.style.filter = sample.filter; crop.style.clipPath = sample.clipPath;
      applyAgentFabrication(layer, sample);
    });
    // Content alpha is authored in each PNG; never screen/lighten or dim it again.
    o.viewCrop.style.transform = 'none'; o.viewCrop.style.filter = 'none';
  }
  function panelViewAt(views, beat, start, stop) {
    var offset = Math.max(0, Math.min(beat, stop) - start), index = 0;
    for (var i = 0; i < views.length; i++) if (offset >= views[i].at) index = i;
    return index;
  }
  function artPlacement(AW, AH, a, b, area, fit, focus) {
    var rx = AW * a[0], ry = AH * a[1], rw = AW * a[2], rh = AH * a[3];
    var W = b.w * area[2], H = b.h * area[3], cover = fit === 'cover';
    var k = (cover ? Math.max : Math.min)(W / rw, H / rh), fx = focus && isFinite(focus[0]) ? clamp(focus[0], 0, 1) : 0.5, fy = focus && isFinite(focus[1]) ? clamp(focus[1], 0, 1) : 0.5;
    var w = cover ? W : rw * k, h = cover ? H : rh * k;
    return { fit: fit, sourceROI: [rx, ry, rw, rh], artSlot: [b.w * area[0], b.h * area[1], W, H], scale: k,
      left: b.w * area[0] + (cover ? 0 : (W - w) / 2), top: b.h * area[1] + (cover ? 0 : (H - h) / 2), width: w, height: h,
      backgroundSize: [AW * k, AH * k], backgroundPosition: [-rx * k - (cover ? (rw * k - W) * fx : 0), -ry * k - (cover ? (rh * k - H) * fy : 0)] };
  }
  function applyArtPlacement(c, p) {
    c.style.right = 'auto'; c.style.bottom = 'auto'; c.style.left = p.left.toFixed(1) + 'px'; c.style.top = p.top.toFixed(1) + 'px';
    c.style.width = p.width.toFixed(1) + 'px'; c.style.height = p.height.toFixed(1) + 'px'; c.style.overflow = p.fit === 'cover' ? 'hidden' : '';
    c.style.backgroundSize = p.backgroundSize.map(function (v) { return v.toFixed(1) + 'px'; }).join(' ');
    c.style.backgroundPosition = p.backgroundPosition.map(function (v) { return v.toFixed(1) + 'px'; }).join(' ');
  }
  function placeViewCrops(m) {
    m.panels.forEach(function (o) {
      if (!o.viewCrop || !o.box || !o.selectedSource || !o.selectedImage) return;
      var spec = o.selectedSource, img = o.selectedImage, a = spec.ar || [0, 0, 1, 1], b = o.box;
      var area = (mode === 'phone' ? o.d.phoneArt : o.d.pageArt) || [0, 0, 1, 1];
      o.viewPlacement = artPlacement(img.naturalWidth, img.naturalHeight, a, b, area, spec.fit || o.d.artFit || 'contain', o.d.cropFocus && o.d.cropFocus[mode]);
      var c = o.viewCrop; applyArtPlacement(c, o.viewPlacement);
      c.style.backgroundImage = o.viewLayerState && o.viewLayerState.status === 'ready' ? 'none' : 'url("' + img.src + '")';
      var independent = false;
      (o.viewLayerCrops || []).forEach(function (l) {
        var authored = l.spec.role === 'agents' && l.spec.agentPlacement || (l.spec.role === 'props' || l.spec.role === 'light') && l.spec.propPlacement;
        if (authored && mode === 'phone' && authored.phone) authored = authored.phone;
        l.agentPlacement = authored || null;
        var native = l.image || img;
        l.placement = authored ? artPlacement(native.naturalWidth, native.naturalHeight, authored.sourceROI, b, authored.slot, 'contain') : o.viewPlacement;
        var local = Object.assign({}, l.placement, { left: l.placement.left - o.viewPlacement.left, top: l.placement.top - o.viewPlacement.top });
        applyArtPlacement(l.element, local);
        // A child retains its own ROI clip. Only the group wrapper permits an independently
        // placed alpha silhouette outside the room's cover crop; the real panel still clips art.
        if (authored) { independent = true; l.element.style.overflow = 'hidden'; }
      });
      if (independent) c.style.overflow = 'visible';
    });
  }
  // Mouths and faces belong to the selected source, not its old panel rectangle. Apply the very same
  // source-to-panel registration as the pixels; a responsive source can supply its own authored anchors.
  function panelSpeakerGeometry(o) {
    var selected = o.viewCrop && o.viewCrop.style.display !== 'none', p = selected ? o.viewPlacement : o.basePlacement;
    var anchors = selected && o.selectedSource && o.selectedSource.speakers || o.d.speakers;
    var reserves = selected && o.selectedSource && o.selectedSource.protectedFaces || [];
    if (!p || !anchors && !reserves.length) return null;
    var out = {};
    Object.keys(anchors || {}).forEach(function (who) {
      var a = anchors[who]; if (!a || !a.mouth || !a.face) return;
      var actor = selected && (o.viewLayerCrops || []).find(function (l) { return l.agentPlacement && Array.isArray(l.agentPlacement.speakerIds) && l.agentPlacement.speakerIds.indexOf(who) >= 0; });
      var registration = actor && actor.placement || p, actorLeft = registration.left || 0, actorTop = registration.top || 0;
      var actorSize = registration.backgroundSize, actorPos = registration.backgroundPosition;
      out[who] = { mouth: [actorLeft + actorPos[0] + a.mouth[0] * actorSize[0], actorTop + actorPos[1] + a.mouth[1] * actorSize[1]],
        face: [actorLeft + actorPos[0] + a.face[0] * actorSize[0], actorTop + actorPos[1] + a.face[1] * actorSize[1], a.face[2] * actorSize[0], a.face[3] * actorSize[1]] };
    });
    reserves.forEach(function (face, index) {
      var r = [p.left + p.backgroundPosition[0] + face[0] * p.backgroundSize[0], p.top + p.backgroundPosition[1] + face[1] * p.backgroundSize[1], face[2] * p.backgroundSize[0], face[3] * p.backgroundSize[1]];
      out['protected-face-' + index] = { face: r, mouth: [r[0] + r[2] / 2, r[1] + r[3] / 2] };
    });
    return out;
  }
  function refreshSpeakerLayout(m, o) {
    // Only authored source anchors trigger relayout. Legacy stories preserve their lettering positions.
    var speakers = panelSpeakerGeometry(o), key = speakers && JSON.stringify(speakers);
    if (key !== o.speakerLayoutKey && (key || o.speakerLayoutKey)) {
      o.speakerLayoutKey = key; layoutBalloons(m);
    }
  }
  // Read-only selected art identity and geometry; never recognizes pixels or proves an asset hash.
  function activeArtGeometry(m, o) {
    var view = o.viewCrop && o.viewCrop.style.display !== 'none' && o.selectedImage && o.selectedSource;
    var crops = view ? (o.viewLayerCrops && o.viewLayerCrops.length ? o.viewLayerCrops : [{element: o.viewCrop, spec: o.selectedSource}]) : (o.layerCrops || [{element: m.crops && m.crops[m.panels.indexOf(o)], spec: {src: m.art && m.art.img && m.art.img.src}}]);
    var target = view ? o.viewCrop : crops[0] && crops[0].element;
    if (!target || target.style.visibility === 'hidden' || (!view && !m.art)) return { status: 'unavailable', reason: 'No visible decoded selected art' };
    var img = view ? o.selectedImage : m.art.img, placement = view ? o.viewPlacement : o.basePlacement;
    if (!img || !img.naturalWidth || !placement) return { status: 'unavailable', reason: 'Selected art not decoded/placed' };
    var css = function (node) { return typeof getComputedStyle === 'function' ? getComputedStyle(node) : node.style; };
    var rect = function (node) { if (node.getBoundingClientRect) { var r = node.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; } var c = css(node); return [parseFloat(c.left) || 0, parseFloat(c.top) || 0, parseFloat(c.width) || placement.width, parseFloat(c.height) || placement.height]; };
    var pair = function (v) { return String(v || '').split(' ').map(parseFloat); }, selected = view ? o.selectedSource : {src: img.currentSrc || img.src};
    var group = view && o.viewLayerCrops && o.viewLayerCrops.length, kind = view ? (group ? 'view-group' : (o.activeViewId ? 'view' : 'static')) : (o.layerCrops ? 'scene-group' : 'scene');
    var planes = crops.map(function (layer, i) {
      var image = group ? o.viewLayerState.images[i] : (!view && o.layerCrops ? layer.image : img), c = css(layer.element), mask = layer.fabrication && layer.fabrication.mask;
      return { id: layer.spec.id || null, role: layer.spec.role || (i ? null : 'background'), src: image && (image.currentSrc || image.src) || layer.spec.src,
        nativeDimensions: image ? [image.naturalWidth, image.naturalHeight] : null, canonicalSource: layer.spec.canonicalSource || null, registration: layer.placement || placement,
        backgroundImage: c.backgroundImage, backgroundSize: pair(c.backgroundSize), backgroundPosition: pair(c.backgroundPosition), rect: rect(layer.element), cssSize: [parseFloat(c.width) || placement.width, parseFloat(c.height) || placement.height],
        transform: c.transform || 'none', opacity: c.opacity || '1', mask: mask ? { size: mask.style.maskSize, position: mask.style.maskPosition, image: mask.style.maskImage } : null };
    });
    return { status: 'ready', kind: kind, viewId: o.activeViewId || '', src: img.currentSrc || img.src, nativeDimensions: [img.naturalWidth, img.naturalHeight],
      canonicalSource: selected.canonicalSource || null, sourceROI: placement.sourceROI, fit: placement.fit, artSlot: placement.artSlot, registration: placement,
      cropRect: rect(target), cssSize: [parseFloat(css(target).width) || placement.width, parseFloat(css(target).height) || placement.height],
      backgroundSize: pair(css(target).backgroundSize), backgroundPosition: pair(css(target).backgroundPosition), transform: css(target).transform || 'none',
      devicePixelRatio: window.devicePixelRatio || 1, planes: planes, declaredHashOnly: true };
  }
  function applyPanelView(m, o, x, index, beat) {
    if (!o.viewCrop || layerArtDisposed) return;
    preparePanelSources(m, o);
    var stop = Math.min(panelFadeStart(x, index), index + 1 < x.panels.length ? x.panels[index + 1].d.at : x.exitStart);
    var eligible = (o.d.views || []).filter(function (v) { return !v.media || v.media === (mode === 'phone' ? 'phone' : 'desktop'); });
    var chosen = eligible.length ? eligible[panelViewAt(eligible, beat, o.d.at, stop)] : null;
    if (chosen && chosen.layers) {
      var cutStop = stop, ci = eligible.indexOf(chosen); if (ci + 1 < eligible.length) cutStop = Math.min(stop, o.d.at + eligible[ci + 1].at);
      applyViewLayers(m, o, chosen, beat, cutStop); return;
    }
    if (!o.d.fallbackView) clearViewLayers(o);
    var spec = chosen && viewSource(chosen, mode === 'phone'), state = spec && loadPanelSource(m, o, spec), showingCut = !!(state && state.status === 'ready');
    if (!showingCut && o.d.fallbackView) {
      var first = panelFallbackView(o);
      if (first) { applyViewLayers(m, o, first, beat, stop); o.el.setAttribute('data-requested-view-id', chosen ? chosen.id : ''); o.el.setAttribute('data-requested-view-mode', state ? state.status : 'missing'); o.el.setAttribute('data-view-fallback', 'true'); o.el.setAttribute('data-view-error', state && state.error || 'Requested view loading'); return; }
      showPanelBase(m, o, false); o.selectedSource = null; o.selectedImage = null; o.viewCrop.style.display = 'none'; o.loaded = false; o.artMissing.style.display = 'grid'; return;
    }
    if (o.d.fallbackView) { clearViewLayers(o); o.el.setAttribute('data-requested-view-id', chosen.id); o.el.setAttribute('data-requested-view-mode', 'ready'); o.el.setAttribute('data-view-fallback', 'false'); }
    if (!showingCut && o.d.staticArt) { spec = viewSource(o.d.staticArt, mode === 'phone'); state = loadPanelSource(m, o, spec); }
    if (!state || state.status !== 'ready') {
      o.viewCrop.style.display = 'none'; showPanelBase(m, o, !o.d.staticArt);
      refreshSpeakerLayout(m, o);
      o.el.setAttribute('data-view-id', ''); o.el.setAttribute('data-view-mode', state ? state.status : 'fallback');
      if (o.d.staticArt) { o.el.setAttribute('data-static-art-mode', state.status); o.artMissing.style.display = state.status === 'missing' ? 'grid' : 'none'; }
      o.el.setAttribute('aria-label', 'Box ' + (m.panels.indexOf(o) + 1) + ': ' + o.d.alt); return;
    }
    o.selectedSource = spec; o.selectedImage = state.img; placeViewCrops(m); showPanelBase(m, o, false);
    o.viewCrop.style.display = ''; if (o.artMissing) o.artMissing.style.display = 'none';
    refreshSpeakerLayout(m, o);
    o.activeViewId = showingCut ? chosen.id : ''; o.el.setAttribute('data-view-id', showingCut ? chosen.id : ''); o.el.setAttribute('data-view-mode', showingCut ? 'ready' : 'static');
    if (o.d.staticArt) o.el.setAttribute('data-static-art-mode', 'ready');
    o.el.setAttribute('data-view-source', state.resolvedSrc); o.el.setAttribute('data-view-error', showingCut || !chosen ? '' : (o.sourceStates[sourceKey(viewSource(chosen, mode === 'phone'))].error || 'Selected view loading'));
    o.el.setAttribute('aria-label', 'Box ' + (m.panels.indexOf(o) + 1) + ': ' + (showingCut ? chosen.alt : o.d.alt));
    var sample = panelMotionSample(o.d.motion, beat, o.d.at, stop, REDUCED);
    o.viewCrop.style.transform = sample.transform; o.viewCrop.style.filter = sample.filter;
  }
  function artSrcset(m, ext) { var b = artUrl(m.d.art).replace(/\.svg$/i, ''); return (PAGE.artWidths || [1600]).map(function (w) { return b + '-' + w + '.' + ext + ' ' + w + 'w'; }).join(', '); }
  function loadRasterArt(m) {
    loadPanelViews(m);
    if (m.artReady) return m.artReady;
    if (m.d.layers && m.d.layers.length && !m.layerFallback) { m.artReady = loadLayerArt(m); return m.artReady; }
    var pic = document.createElement('picture'), av = document.createElement('source'), im0 = document.createElement('img');
    // A box shows a slice of the page enlarged, so ask for twice the window's width (the widest file on most screens).
    var sz = Math.round(Math.max(window.innerWidth, 320) * 2) + 'px'; av.sizes = sz; im0.sizes = sz;
    av.type = 'image/avif'; av.srcset = artSrcset(m, 'avif'); im0.srcset = artSrcset(m, 'webp'); im0.alt = '';
    if (!m.d.artFormats || m.d.artFormats.indexOf('avif') !== -1) pic.appendChild(av);
    pic.appendChild(im0);
    m.crops = m.panels.map(function (o) { var c = el('div', 'cs-crop', o.art); o.motionArt = c; if (o.d.motion) c.classList.add('cs-motion-art'); c.setAttribute('aria-hidden', 'true'); return c; });
    // Wait for the load, then the decode, so a box never reveals half-loaded; the page's proportions come from the image.
    m.artReady = new Promise(function (res) { if (im0.complete && im0.naturalWidth) res(); else { im0.addEventListener('load', res, { once: true }); im0.addEventListener('error', res, { once: true }); } }).then(function () {
      if (layerArtDisposed) return;
      return im0.decode ? im0.decode().catch(function () {}) : null;
    }).then(function () {
      if (layerArtDisposed) return;
      if (!im0.naturalWidth) throw new Error('raster page art missing');
      var url = im0.currentSrc || im0.src;
      m.art = { vw: im0.naturalWidth, vh: im0.naturalHeight, raster: true, img: im0, setRegion: function () {} };
      m.crops.forEach(function (c) { c.style.backgroundImage = 'url("' + url + '")'; });
      m.panels.forEach(function (o) { o.loaded = true; });
      measure(); render(T);
    }).catch(function () { if (layerArtDisposed) return; m.page.classList.add('is-art-missing'); m.panels.forEach(function (o) { o.loaded = true; }); });
    return m.artReady;
  }
  // Each box shows its region of the page art, cropped in a little (page-constants artCropInsetPct of the art's short
  // side) so the art's own drawn borders and gutters stay out, and scaled to cover the box, centred.
  function placeCrops(m) {
    if (!m.art || !m.art.raster) return;
    var AW = m.art.vw, AH = m.art.vh, insetPct = m.d.artCropInsetPct == null ? (PAGE.artCropInsetPct == null ? 0.8 : PAGE.artCropInsetPct) : m.d.artCropInsetPct;
    var ins = Math.min(AW, AH) * (typeof insetPct === 'number' && isFinite(insetPct) ? clamp(insetPct, 0, 5) : 0.8) / 100;
    m.panels.forEach(function (o, i) {
      var targets = o.layerCrops ? o.layerCrops.map(function (layer) { return layer.element; }) : [m.crops[i]], a = o.d.ar || o.d.r, b = o.box; if (!targets[0] || !b) return;
      targets.forEach(function (c) {
      var rx = a[0] * AW + ins, ry = a[1] * AH + ins, rw = Math.max(1, a[2] * AW - 2 * ins), rh = Math.max(1, a[3] * AH - 2 * ins);
      var focus = o.d.cropFocus && o.d.cropFocus[mode], fx = 0.5, fy = 0.5;
      if (Array.isArray(focus)) {
        if (typeof focus[0] === 'number' && isFinite(focus[0])) fx = clamp(focus[0], 0, 1);
        if (typeof focus[1] === 'number' && isFinite(focus[1])) fy = clamp(focus[1], 0, 1);
      }
      var s = Math.max(b.w / rw, b.h / rh), ox = rx * s + (rw * s - b.w) * fx, oy = ry * s + (rh * s - b.h) * fy;
      // Authored lettering reserve: contain the complete evidence crop in its declared art area.
      var area = mode === 'phone' ? m.d.phonePages && o.d.phoneArt : o.d.pageArt;
      if (c.phoneContained) {
        c.style.left = ''; c.style.top = ''; c.style.width = ''; c.style.height = ''; c.style.right = ''; c.style.bottom = '';
        c.phoneContained = false;
      }
      if (Array.isArray(area) && area.length === 4 && area.every(function (v) { return typeof v === 'number' && isFinite(v) && v >= 0; }) && area[2] > 0 && area[3] > 0 && area[0] + area[2] <= 1 && area[1] + area[3] <= 1) {
        s = (o.d.artFit === 'cover' ? Math.max : Math.min)(b.w * area[2] / rw, b.h * area[3] / rh);
        c.phoneContained = true; c.style.right = 'auto'; c.style.bottom = 'auto';
        c.style.left = (b.w * area[0] + (o.d.artFit === 'cover' ? 0 : (b.w * area[2] - rw * s) / 2)).toFixed(1) + 'px';
        c.style.top = (b.h * area[1] + (o.d.artFit === 'cover' ? 0 : (b.h * area[3] - rh * s) / 2)).toFixed(1) + 'px';
        c.style.width = (o.d.artFit === 'cover' ? b.w * area[2] : rw * s).toFixed(1) + 'px'; c.style.height = (o.d.artFit === 'cover' ? b.h * area[3] : rh * s).toFixed(1) + 'px';
        ox = rx * s + (o.d.artFit === 'cover' ? (rw * s - b.w * area[2]) * fx : 0); oy = ry * s + (o.d.artFit === 'cover' ? (rh * s - b.h * area[3]) * fy : 0);
      }
      if (!Array.isArray(area) && o.d.artFit === 'contain') {
        var p = artPlacement(AW, AH, [rx / AW, ry / AH, rw / AW, rh / AH], b, [0, 0, 1, 1], 'contain', [fx, fy]);
        applyArtPlacement(c, p); c.phoneContained = true; s = p.scale; ox = -p.backgroundPosition[0]; oy = -p.backgroundPosition[1];
      }
      o.basePlacement = { fit: o.d.artFit || (Array.isArray(area) ? 'contain' : 'cover'), sourceROI: [rx, ry, rw, rh], artSlot: Array.isArray(area) ? [b.w * area[0], b.h * area[1], b.w * area[2], b.h * area[3]] : [0, 0, b.w, b.h], scale: s,
        left: parseFloat(c.style.left) || 0, top: parseFloat(c.style.top) || 0,
        width: parseFloat(c.style.width) || b.w, height: parseFloat(c.style.height) || b.h, backgroundSize: [AW * s, AH * s], backgroundPosition: [-ox, -oy] };
      c.style.backgroundSize = (AW * s).toFixed(1) + 'px ' + (AH * s).toFixed(1) + 'px';
      c.style.backgroundPosition = (-ox).toFixed(1) + 'px ' + (-oy).toFixed(1) + 'px';
      });
    });
    placeViewCrops(m);
  }
  function loadScene(i) {
    var m = model[i]; if (!m) return Promise.resolve();
    loadPanelViews(m);
    if (isRasterArt(m)) return loadRasterArt(m);
    if (m.d.art) { loadPageArt(m); m.panels.forEach(function (o) { o.loaded = true; }); return m.artPromise || Promise.resolve(); }
    return Promise.all(m.panels.map(function (o) {
      if (o.loaded) return Promise.resolve();
      if (o.loading) return o.loadPromise || Promise.resolve();
      o.loading = true;
      var url = artUrl(o.d.img);
      if (!/\.svg(\?|$)/i.test(url)) { // raster box art
        var im = new Image(); im.decoding = 'async'; im.alt = ''; im.src = url; im.className = 'cs-raster';
        o.art.appendChild(im); o.svg = im; o.motionArt = im; if (o.d.motion) im.classList.add('cs-motion-art');
        o.loadPromise = (im.decode ? im.decode() : Promise.resolve()).then(function () { o.loaded = true; }, function () { o.el.classList.add('is-missing'); o.loaded = true; });
        return o.loadPromise;
      }
      return (o.loadPromise = fetchSvg(url).then(function (text) {
        var svg = sanitize(text);
        if (!svg) throw new Error('bad svg');
        o.art.appendChild(svg); o.svg = svg; o.motionArt = svg; if (o.d.motion) svg.classList.add('cs-motion-art'); o.loaded = true;
        var vb = (svg.getAttribute('viewBox') || '0 0 1600 900').split(/[\s,]+/).map(Number);
        o.vbW = vb[2] || 1600; o.vbH = vb[3] || 900;
        var brk = null;
        Array.prototype.forEach.call(svg.children, function (g) { if (g.getAttribute && g.getAttribute('data-layer') === 'break') brk = g; });
        if (brk) {
          var ov = svg.cloneNode(false); ov.setAttribute('class', 'cs-break'); ov.appendChild(brk);
          o.el.insertBefore(ov, o.border.nextSibling);
          o.layers.push({ g: brk, depth: clamp(parseFloat(brk.getAttribute('data-depth')) || 1, 0, 1), last: '' });
        }
        Array.prototype.forEach.call(svg.children, function (g) {
          if (g.getAttribute && g.getAttribute('data-layer')) o.layers.push({ g: g, depth: clamp(parseFloat(g.getAttribute('data-depth')) || 0, 0, 1), last: '' });
        });
        Array.prototype.forEach.call(svg.querySelectorAll('[data-fx]'), function (g) {
          var kind = g.getAttribute('data-fx');
          if (kind === 'rain') o.rain.push({ g: g, loop: parseFloat(g.getAttribute('data-loop')) || o.vbH * 0.1, last: '' });
          else if (kind === 'flicker') o.flick.push({ g: g, seed: o.flick.length + 1, last: '' });
          else if (kind === 'brain') Array.prototype.forEach.call(g.querySelectorAll('[data-floor]'), function (f) { o.floors.push({ g: f, n: parseFloat(f.getAttribute('data-floor')) || 0, last: '' }); });
        });
        o.floors.sort(function (a, b) { return a.n - b.n; });
        if (state === 'play' || state === 'paused' || state === 'hold') render(T);
      }).catch(function () { o.el.classList.add('is-missing'); o.loaded = true; }));
    }));
  }

  /* ---------- Geometry: the whole page, always, edge to edge (no camera) ---------- */
  // Matt, 2026-09-28: "this should be legit comic book" and "go edge to edge in the window, really immerse the user". The
  // story's rects map onto the whole window (x and y scale independently; the SVG art is sliced, so a box may change
  // shape). On a phone or a squarish window the boxes reflow into portrait pages (1-2 columns, reading order kept), split
  // over consecutive phone pages when they do not fit one screen. Newsprint paper between the boxes; every edge snaps to
  // whole device pixels, so borders and lettering stay sharp.
  var PAD = 8, vw = 0, vh = 0, mode = 'page', GUT = 12, BW = 4, MARGIN = 20, MS = { t: 20, b: 20, l: 20, r: 20 }, dpr = 1;
  function snap(v) { return Math.round(v * dpr) / dpr; }
  var ENTER = Math.max(1, 0.8 / B);    // beats: the ghosted boxes arrive
  var EXIT = Math.max(1.5, 1.2 / B);   // beats: the boxes leave, each on its own, staggered
  var REVEAL = Math.max(0.75, 0.6 / B); // beats: a box fades up from its ghost
  // Every box's content shows from the start at the ghost opacity until its story is told (Matt, 2026-09-28: "the 30% is
  // a guess ... make it a constant we can change"): page-constants ghostOpacity, a story's `ghost`, or ?ghost= to review.
  var GHOST = clamp(parseFloat(q.get('ghost')) || story.ghost || cfg.ghost || 1, 0, 1); // 1 only if unconfigured
  stage.style.setProperty('--cs-ghost', String(GHOST));
  function aspectOf(o) { return (o.d.r[2] * 16) / (o.d.r[3] * 9); }
  // Authored phone pages preserve wide ensemble shots and tall columns without changing legacy reflow.
  // Rectangles tile the unit page before gutters; their array order must preserve the scene's reading order.
  function phonePagesValid(scene) {
    var pages = scene.phonePages, panels = scene.panels, ids = [], E = 0.000001;
    if (!Array.isArray(pages) || !pages.length || panels.some(function (p) { return p.inset || !p.img; })) return false;
    for (var k = 0; k < pages.length; k++) {
      var page = pages[k], area = 0;
      if (!Array.isArray(page) || !page.length) return false;
      for (var i = 0; i < page.length; i++) {
        var entry = page[i], r = entry && entry.r;
        if (!entry || typeof entry.img !== 'string' || !Array.isArray(r) || r.length !== 4 || r.some(function (n) { return typeof n !== 'number' || !isFinite(n); })) return false;
        if (r[0] < 0 || r[1] < 0 || r[2] <= 0 || r[3] <= 0 || r[0] + r[2] > 1 + E || r[1] + r[3] > 1 + E || ids.indexOf(entry.img) >= 0) return false;
        for (var j = 0; j < i; j++) {
          var q = page[j].r;
          if (Math.min(r[0] + r[2], q[0] + q[2]) - Math.max(r[0], q[0]) > E && Math.min(r[1] + r[3], q[1] + q[3]) - Math.max(r[1], q[1]) > E) return false;
        }
        ids.push(entry.img); area += r[2] * r[3];
      }
      if (Math.abs(area - 1) > E) return false;
    }
    return ids.length === panels.length && ids.every(function (id, i) { return panels[i].img === id; });
  }
  function authoredPhoneSheets(m, W, H, X0, Y0) {
    if (!phonePagesValid(m.d)) return null;
    var at = 0, lo = Math.floor(GUT / 2), hi = GUT - lo, E = 0.000001, usable = true;
    var placed = m.d.phonePages.map(function (page, sheet) {
      return page.map(function (entry) {
        var o = m.panels[at++], r = entry.r;
        var x0 = X0 + Math.round(r[0] * W) + (r[0] > E ? hi : 0);
        var y0 = Y0 + Math.round(r[1] * H) + (r[1] > E ? hi : 0);
        var x1 = X0 + Math.round((r[0] + r[2]) * W) - (r[0] + r[2] < 1 - E ? lo : 0);
        var y1 = Y0 + Math.round((r[1] + r[3]) * H) - (r[1] + r[3] < 1 - E ? lo : 0);
        if (x1 <= x0 || y1 <= y0) usable = false;
        return { panel: o, box: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, sheet: sheet };
      });
    });
    if (!usable) return null; // No partial mutation if a valid fractional tile is too small at this window size.
    return placed.map(function (page) { return page.map(function (entry) { entry.panel.box = entry.box; entry.panel.sheet = entry.sheet; return entry.panel; }); });
  }
  function phoneSheets(m, W, H, X0, Y0) {
    var authored = authoredPhoneSheets(m, W, H, X0, Y0);
    if (authored) return authored;
    var g = GUT, rows = [], row = [];
    m.panels.forEach(function (o) {
      if (o.d.inset) return; // placed with its host below
      if (aspectOf(o) >= 1.15) { if (row.length) { rows.push(row); row = []; } rows.push([o]); }
      else { row.push(o); if (row.length === 2) { rows.push(row); row = []; } }
    });
    if (row.length) rows.push(row);
    var capA = function (o, n) { return n > 1 ? Math.min(aspectOf(o), 1.1) : Math.min(aspectOf(o), 3); };
    var hs = rows.map(function (rw) { var sa = rw.reduce(function (s, o) { return s + capA(o, rw.length); }, 0); return clamp((W - g * (rw.length - 1)) / sa, W * 0.42, H * 0.56); });
    var sheets = [], cur = [], used = 0;
    rows.forEach(function (rw, i) {
      if (cur.length && used + g + hs[i] > H) { sheets.push(cur); cur = []; used = 0; }
      cur.push({ row: rw, h: hs[i] }); used += (cur.length > 1 ? g : 0) + hs[i];
    });
    if (cur.length) sheets.push(cur);
    return sheets.map(function (sh, k) {
      var gaps = g * (sh.length - 1), sumH = sh.reduce(function (s, x) { return s + x.h; }, 0);
      var sc = Math.max(1, (H - gaps) / sumH), total = sumH * sc + gaps, y = Y0 + (H - total) / 2, list = [];
      sh.forEach(function (x) {
        var h = x.h * sc, n = x.row.length, sa = x.row.reduce(function (s, o) { return s + capA(o, n); }, 0), xs = X0;
        x.row.forEach(function (o) {
          var w = (W - g * (n - 1)) * capA(o, n) / sa;
          o.box = { x: xs, y: y, w: w, h: h }; o.sheet = k; xs += w + g; list.push(o);
        });
        y += h + g;
      });
      // Each inset follows its host (its `host` id, or the box its centre sits in) at the same relative place.
      m.panels.forEach(function (o) {
        if (!o.d.inset) return;
        var r = o.d.r, cx = r[0] + r[2] / 2, cy = r[1] + r[3] / 2;
        var h = (o.d.host && m.panels.filter(function (q) { return q.d.id === o.d.host; })[0]) || m.panels.filter(function (q) { return !q.d.inset && cx >= q.d.r[0] && cx <= q.d.r[0] + q.d.r[2] && cy >= q.d.r[1] && cy <= q.d.r[1] + q.d.r[3]; })[0];
        if (!h || list.indexOf(h) < 0) return;
        var hr = h.d.r, fx = (r[0] - hr[0]) / hr[2], fy = (r[1] - hr[1]) / hr[3];
        o.box = { x: h.box.x + fx * h.box.w, y: h.box.y + fy * h.box.h, w: (r[2] / hr[2]) * h.box.w, h: (r[3] / hr[3]) * h.box.h }; o.sheet = k;
        var at = list.lastIndexOf(h), n2 = at + 1; while (n2 < list.length && list[n2].d.inset) n2++;
        list.splice(n2, 0, o);
      });
      return list;
    });
  }
  function phoneCanvasHeight(scene, viewportHeight, layoutMode, width, margins) {
    if (layoutMode !== 'phone' || !Number.isFinite(scene.phonePageHeight)) return viewportHeight;
    var height = scene.phonePageHeight, ref = scene.phonePageReferenceWidth;
    if (Number.isFinite(ref) && ref > 0 && Number.isFinite(width) && margins) {
      var outer = margins.t + margins.b;
      height = outer + (height - outer) * Math.max(0, width - margins.l - margins.r) / ref;
    }
    return Math.max(viewportHeight, clamp(height, 0, 3000));
  }
  function pageCanvasWidth(scene, width, height, margins, layoutMode) {
    var aspect = scene.pageAspect;
    if (layoutMode !== 'page' || !Number.isFinite(aspect) || aspect <= 0) return width;
    return Math.min(width, (height - margins.t - margins.b) * aspect + margins.l + margins.r);
  }
  function measure() {
    dpr = window.devicePixelRatio || 1;
    fontMetrics();
    var r = view.getBoundingClientRect(); vw = r.width; vh = r.height;
    mode = (vw < 700 || vw / vh < 1.2) ? 'phone' : 'page';
    stage.setAttribute('data-mode', mode);
    // A thin band of the dark site ground around the paper page (Matt, 2026-09-29: "add margin around the comic, make the
    // margin look like paper"); superseded by Matt's brand-teal margins/gutters (2026-10-09), retaining geometry.
    PAD = Math.max(6, Math.round(Math.min(vw, vh) * 0.012));
    stage.style.setProperty('--cs-page-gap', PAD + 'px');
    var pw = vw - 2 * PAD, ph = vh - 2 * PAD;
    // Gutters, margins and borders take the reference pages' ratios of the short side, exactly (Matt, 2026-09-28: "matched
    // pixel for pixel in source"), as whole pixels, so every gutter is the same width and nothing drifts.
    var SS = Math.min(pw, ph), ms = PAGE.marginSidesPct || {};
    GUT = Math.max(2, Math.round(SS * (PAGE.gutterPct || 1.2) / 100)); BW = Math.max(1, Math.round(SS * (PAGE.borderPct || 0.235) / 100));
    MARGIN = Math.max(2, Math.round(SS * (PAGE.marginPct || 1.9) / 100));
    MS = { t: Math.round(SS * (ms.top || PAGE.marginPct || 1.9) / 100), b: Math.round(SS * (ms.bottom || PAGE.marginPct || 1.9) / 100), l: Math.round(SS * (ms.left || PAGE.marginPct || 1.9) / 100), r: Math.round(SS * (ms.right || PAGE.marginPct || 1.9) / 100) };
    model.forEach(function (m) {
      var pageHeight = phoneCanvasHeight(m.d, ph, mode, pw, MS);
      var pageWidth = pageCanvasWidth(m.d, pw, ph, MS, mode);
      m.w = pageWidth; m.h = pageHeight;
      if (m.d.art && !isRasterArt(m)) {
        // The whole generated page always shows (round 2 brief: never crop the page's top or bottom): fit by meet, full
        // height on a wide window, centred on the paper; the paper and dark band show beside it.
        var AW = m.art ? m.art.vw : 1600, AH = m.art ? m.art.vh : 900, sl = false, sc2 = Math.min(pw / AW, ph / AH);
        var ox = (pw - AW * sc2) / 2, oy = (ph - AH * sc2) / 2;
        if (m.art && m.art.svg) m.art.svg.setAttribute('preserveAspectRatio', sl ? 'xMidYMid slice' : 'xMidYMid meet');
        m.artFit = { x: ox, y: oy, w: AW * sc2, h: AH * sc2 };
        m.panels.forEach(function (o) { var rr = o.d.r; o.box = { x: snap(ox + rr[0] * AW * sc2), y: snap(oy + rr[1] * AH * sc2), w: snap(rr[2] * AW * sc2), h: snap(rr[3] * AH * sc2) }; o.sheet = 0; o.sides = { l: true, t: true, r: true, b: true }; });
        m.sheets = [m.panels.slice()];
      } else if (mode === 'page') {
        // A clean, even margin around the page, as a printed comic has (Matt, 2026-09-28: no other frame); a gutter where boxes
        // meet; a box marked `bleed` runs off the window on the page edges it touches, with no border there. An inset sits
        // exactly on its rect, over the box beneath.
        // Edges map to whole-pixel grid lines; a gutter is split floor/ceil across the shared line, so it is exactly GUT.
        var g = GUT, E = 0.002, iw = pageWidth - MS.l - MS.r, ih = ph - MS.t - MS.b, gLo = Math.floor(g / 2), gHi = g - gLo;
        var gx = function (f) { return Math.round(MS.l + f * iw); }, gy = function (f) { return Math.round(MS.t + f * ih); };
        m.panels.forEach(function (o) {
          var rr = o.d.r, ins = !!o.d.inset, bl = !!o.d.bleed && !ins;
          var l = rr[0] <= E, t = rr[1] <= E, rt = rr[0] + rr[2] >= 1 - E, bo = rr[1] + rr[3] >= 1 - E;
          var x0 = l ? (bl ? 0 : MS.l) : gx(rr[0]) + (ins ? 0 : gHi), y0 = t ? (bl ? 0 : MS.t) : gy(rr[1]) + (ins ? 0 : gHi);
          var x1 = rt ? (bl ? pageWidth : pageWidth - MS.r) : gx(rr[0] + rr[2]) - (ins ? 0 : gLo), y1 = bo ? (bl ? ph : ph - MS.b) : gy(rr[1] + rr[3]) - (ins ? 0 : gLo);
          o.box = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; o.sheet = 0;
          o.sides = { l: bl && l, t: bl && t, r: bl && rt, b: bl && bo };
        });
        m.sheets = [m.panels.slice()];
      } else m.sheets = phoneSheets(m, pw - MS.l - MS.r, pageHeight - MS.t - MS.b, MS.l, MS.t);
      m.page.style.left = (pw - pageWidth) / 2 + 'px';
      m.page.style.width = pageWidth + 'px'; m.page.style.height = pageHeight + 'px';
      // Paper only between boxes: the rectangle the non-bleeding boxes tile, inside the dark outer margin, so no paper
      // edge shows at the page's outer edge beside a bleed (none in page-art mode).
      m.gut.style.display = 'none'; // the page itself is paper now
      if (false) { var gs2 = m.gut.style, x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; m.panels.forEach(function (o) { if (o.d.inset || o.d.bleed) return; x0 = Math.min(x0, o.box.x); y0 = Math.min(y0, o.box.y); x1 = Math.max(x1, o.box.x + o.box.w); y1 = Math.max(y1, o.box.y + o.box.h); }); gs2.left = x0 + 'px'; gs2.top = y0 + 'px'; gs2.width = (x1 - x0) + 'px'; gs2.height = (y1 - y0) + 'px'; }
      m.panels.forEach(function (o) {
        var b = o.box, st = o.el.style;
        if (mode === 'phone' && !(m.d.art && !isRasterArt(m))) {
          var bx0 = snap(b.x), by0 = snap(b.y); b.w = snap(b.x + b.w) - bx0; b.h = snap(b.y + b.h) - by0; b.x = bx0; b.y = by0;
          // On a phone page a `bleed` box runs off the screen on the sides it touches the margin.
          if (o.d.bleed && !o.d.inset) {
            var sl = b.x <= MARGIN + 0.5, stp = b.y <= MARGIN + 0.5, sr = b.x + b.w >= pw - MARGIN - 0.5, sb = b.y + b.h >= pageHeight - MARGIN - 0.5;
            if (sl) { b.w += b.x; b.x = 0; } if (stp) { b.h += b.y; b.y = 0; } if (sr) b.w = pw - b.x; if (sb) b.h = pageHeight - b.y;
            o.sides = { l: sl, t: stp, r: sr, b: sb };
          } else o.sides = { l: false, t: false, r: false, b: false };
        }
        st.left = b.x + 'px'; st.top = b.y + 'px'; st.width = b.w + 'px'; st.height = b.h + 'px';
        st.setProperty('--px', b.x + 'px'); st.setProperty('--py', b.y + 'px'); // the box's paper texture runs on from the page's
        // Lettering sized per box: a cap height near 2.5% of the box's width, readable on every screen.
        // One dialogue size across the page (Codex critique 01): a cap height near 0.93% of the page width, as the references.
        // Dialogue cap height about 1.2% of the page's SHORT side (the references measure 1.2% of their width, which is a
        // portrait page's short side; Matt, 2026-09-29: "chat bubbles have regressed significantly" when it was read as our
        // wide page's width); the font size follows from the face's measured cap height, and never goes under 15 px on a
        // desktop page or 14 px on a phone (Matt, 2026-09-29: "don't make too small").
        o.fs = Math.max(clamp(Math.min(pw, ph) * bsl('capPctOfShortSide', 1.2) / 100, bsl('minCapPx', 9), bsl('maxCapPx', 14)) / MET.cap, mode === 'page' ? bsl('minFontPx', 15) : bsl('minFontPxPhone', 14));
        st.fontSize = o.fs.toFixed(2) + 'px';
        drawBorder(o);
        st.setProperty('--pitch', Math.max(5, b.w * 0.012).toFixed(1) + 'px');
        o.cache = {};
        o.balloons.forEach(function (bl) { bl.last = ''; });
      });
      m.times = timeline(m);
      if (m.crops) placeCrops(m);
    });
    cam.style.transform = 'translate3d(' + PAD + 'px,' + PAD + 'px,0)';
    stage.style.setProperty('--cs-gut', GUT + 'px'); stage.style.setProperty('--cs-bw', BW + 'px'); stage.style.setProperty('--cs-margin', MARGIN + 'px');
    stage.style.setProperty('--cs-separator', PAGE.separator || '#1a9ba1');
    if (PAGE.paper) stage.style.setProperty('--cs-paper', PAGE.paper);
    if (PAGE.paperTile) stage.style.setProperty('--cs-paper-tile', 'url("' + new URL(PAGE.paperTile, document.baseURI).href + '")');
    stage.setAttribute('data-geom', JSON.stringify({ gutter: GUT, border: BW, margin: MS }));
    layoutBalloons();
    // Lettering layout determines the actual type speed. Recompute sheet exits
    // afterwards so a short balloon cannot fade before its last glyph appears.
    model.forEach(function (m) { m.times = timeline(m); });
  }
  // An inked box border only where the box meets another (Matt, 2026-09-28: "they do not have n/s/e/w borders"): none on
  // a side that bleeds off the page, none on an open box. The outer edge is straight and the inner edge wavers a little,
  // like a brush-inked rule. A clipped box's border follows its cut (edges on a bleeding side are left open). Insets get a
  // heavier rule.
  function drawBorder(o) {
    var w = o.box.w, h = o.box.h, s = o.border, n = 7, sd = o.sides || {}, bw = o.d.inset ? BW * 1.6 : BW, j = 0, d, i; // a crisp ruled line
    s.setAttribute('viewBox', '0 0 ' + w + ' ' + h); s.setAttribute('width', w); s.setAttribute('height', h);
    if (o.d.open) { s.innerHTML = ''; return; }
    if (o.d.clip && o.d.clip.length >= 3) {
      var pts = o.d.clip.map(function (q) { return [q[0] * w, q[1] * h]; }), id = 'cs-cut-' + o.seed, poly = 'M' + pts.map(function (q) { return q[0].toFixed(2) + ' ' + q[1].toFixed(2); }).join('L') + 'Z', seg = '';
      pts.forEach(function (a, k) {
        var b = pts[(k + 1) % pts.length], on = function (v, x) { return Math.abs(v - x) < 0.5; };
        if ((sd.l && on(a[0], 0) && on(b[0], 0)) || (sd.r && on(a[0], w) && on(b[0], w)) || (sd.t && on(a[1], 0) && on(b[1], 0)) || (sd.b && on(a[1], h) && on(b[1], h))) return;
        seg += 'M' + a[0].toFixed(2) + ' ' + a[1].toFixed(2) + 'L' + b[0].toFixed(2) + ' ' + b[1].toFixed(2);
      });
      s.innerHTML = '<defs><clipPath id="' + id + '"><path d="' + poly + '"/></clipPath></defs><path d="' + seg + '" fill="none" stroke="#0a0a0a" stroke-width="' + (2 * bw) + '" stroke-linecap="square" clip-path="url(#' + id + ')"/>';
      return;
    }
    if (sd.l && sd.t && sd.r && sd.b) { s.innerHTML = ''; return; }
    var L = sd.l ? 0 : bw, T = sd.t ? 0 : bw, R = sd.r ? 0 : bw, Bt = sd.b ? 0 : bw;
    function wob(i, k, on) { return on ? (hash(i + k * 13, o.seed) - 0.5) * j : 0; }
    d = 'M0 0H' + w + 'V' + h + 'H0Z M' + (L + wob(0, 0, !sd.l)).toFixed(2) + ' ' + (T + wob(0, 1, !sd.t)).toFixed(2);
    for (i = 1; i <= n; i++) d += 'L' + (L + (w - L - R) * i / n).toFixed(2) + ' ' + (T + wob(i, 3, !sd.t)).toFixed(2);
    for (i = 1; i <= n; i++) d += 'L' + (w - R + wob(i, 4, !sd.r)).toFixed(2) + ' ' + (T + (h - T - Bt) * i / n).toFixed(2);
    for (i = 1; i <= n; i++) d += 'L' + (w - R - (w - L - R) * i / n).toFixed(2) + ' ' + (h - Bt + wob(i, 5, !sd.b)).toFixed(2);
    for (i = 1; i < n; i++) d += 'L' + (L + wob(i, 6, !sd.l)).toFixed(2) + ' ' + (h - Bt - (h - T - Bt) * i / n).toFixed(2);
    d += 'Z';
    s.innerHTML = '<path fill-rule="evenodd" d="' + d + '"/>';
  }
  /* ---------- Balloons and captions: the measured recipe ----------
     discussion/comic-b/balloon-shapes/report.md, applied through the skill's assets/balloon-style.json (Matt, 2026-09-28: "do
     not use generic ovals or squares for speech bubbles"; root, 2026-09-29: balloon kinds from the measured references).
     The unit c is the cap height of the balloon's own lettering. Letter first: the words are composed into centred lines
     of about 9 characters (5-15), never broken inside a word, with 1.31c between baselines. Then draw around the ink:
     - speech: a superellipse (n 3.5, or 2.3 for the Crisis look, one per issue) with a = textW/2 + 0.94c and
       b = textH/2 + 0.75c (a/b kept within 0.9-2.1), shoulders r = max(r_se, r_textHull + 0.55c), a low-order hand
       variation (k = 2..4, 1.2-2%), and a tail spliced into the same outline: exit nearest the mouth, root half-width
       0.48c, about 1.9c long, two quadratics with control points at 45% of the length 0.22c off the axis, 0.3c fillets,
       at most 5 degrees of bend. Stroke 0.20c black, paper fill.
     - off-panel voice (and a device or chat voice may use it): a long thin tail (root 0.3c) to the panel edge.
     - weak voice: a zigzag tail. menace: a red wavy second outline.
     - chain (the same speaker's next beat) and across (a line continuing into the next panel): the balloon is placed by
       rule (chain: 0.75c from the last, along the authored direction) and joined by a neck 1.2c wide; both are drawn in
       the head balloon's shape so the paper is one group with one opacity (no darker stem where shapes overlap).
     - butted (edge): the box border cuts the balloon, no outline on the cut side, the text 0.6c clear of it.
     - fear (spooked, shaken): the speech body with 12-16 uneven scallops about 0.2c deep (roughness about 0.10c).
     - burst (shout; scream in red; panic with heavy italic lettering): 6-13 straight spikes 0.6-1.3c out, uneven.
     - caption and place (the only yellow): square, a 0.2c black rule, padding
       0.67/0.78/0.60/0.77c, butted into a box corner and stacked. A caption never breaks a word: if it cannot fit its
       box, a cascade inset grows (up to 1.5x, inside its host) or the caption moves to the host box.
     - thought: the one yellow balloon (#ede614, Spider-Man #33), the speech body with a stem of 2-3 shrinking beads toward
       the thinker, never a wedge (Matt, 2026-09-29: the stem standardizes the meaning). White is the standard for every
       other voice, a device or chat voice included. No clouds (none in the references). Fills slightly translucent
       (Matt's exception); ink opaque. */
  function kindOf(k) { return /^(speech|thought|burst|fear|caption|place)$/.test(k) ? k : 'speech'; } // whisper, machine: speech
  function stateOf(b) {
    if (b.state) return b.state;
    var k = kindOf(b.kind);
    return k === 'burst' ? 'shout' : k === 'fear' ? 'fear' : k === 'thought' ? 'thought' : k === 'caption' || k === 'place' ? 'narration' : 'calm';
  }
  // Words with their emphasis (the `em` phrase in bold italic); an author's "\n" is a composed line break and wins.
  function parseWords(text, em) {
    var e0 = em ? text.indexOf(em) : -1, e1 = e0 < 0 ? -1 : e0 + em.length, lines = [], pos = 0;
    text.split('\n').forEach(function (ln) {
      var ws = [], re = /\S+/g, mm;
      while ((mm = re.exec(ln))) { var a = pos + mm.index, z = a + mm[0].length; ws.push({ t: mm[0], em: e0 >= 0 && a < e1 && z > e0 }); }
      if (ws.length) lines.push(ws);
      pos += ln.length + 1;
    });
    return { lines: lines, set: lines.length > 1 };
  }
  function bsl(key, d) { var L = BS.lettering; return L && L[key] != null ? L[key] : d; }
  // The lettering faces' measured metrics (cap height, ascent, descent per em), read once the fonts are in.
  var MET = { cap: 0.7, asc: 0.95, desc: 0.3, bcap: 0.72, basc: 0.9, bdesc: 0.25 }, MCTX = null;
  function ctx2d() { if (!MCTX) { try { MCTX = document.createElement('canvas').getContext('2d'); } catch (e) { MCTX = null; } } return MCTX; }
  function fontMetrics() {
    var c = ctx2d(); if (!c) return;
    [['cap', 'asc', 'desc', '700 100px "Kalam Letter"'], ['bcap', 'basc', 'bdesc', '400 100px "Bangers"']].forEach(function (f) {
      c.font = f[3]; var mt = c.measureText('H');
      if (mt.actualBoundingBoxAscent > 30) MET[f[0]] = mt.actualBoundingBoxAscent / 100;
      if (mt.fontBoundingBoxAscent) { MET[f[1]] = mt.fontBoundingBoxAscent / 100; MET[f[2]] = mt.fontBoundingBoxDescent / 100; }
    });
  }
  var LOOK = (BS.looks || {})[q.get('look') || story.look || BS.defaultLook || 'marvel'] || { exponent: 3.5, captionFill: '#eae619' };
  // Balloon paper is the measured reference fill (#f4f4f4: the median of the reference balloons, shapes.raw-per-shape.json;
  // Matt, 2026-09-29: "i want the speech bubbles to match the reference images. i think you invented the color change").
  // Never re-tinted to match another surface: the page paper colour is for margins and gutters only.
  var PAPER = BS.fill || '#f4f4f4', INK = '#0a0a0a';
  // The paper's grain inside balloons and captions (Matt, 2026-09-29: "i want the comic scenes to look like paper, so if you
  // need to add texture do it"): two masks cut from the sampled paper grain light and darken the fill by the same factor,
  // so the grain shows and the mean colour stays the measured one. The pattern is fixed to the page, so the grain runs
  // on across balloons. Balloons sit above the page's multiply texture (which only darkens).
  function shade(hex, f) { var h = hex.replace('#', ''); return '#' + [0, 2, 4].map(function (i) { return ('0' + Math.max(0, Math.min(255, Math.round(parseInt(h.substr(i, 2), 16) * f))).toString(16)).slice(-2); }).join(''); }
  var GRAIN = q.get('grain') !== 'off'; // verification only: ?grain=off for the style check's seam test
  function grainDefs(id, P) {
    var G = PAGE.paperGrain; if (!G || !GRAIN) return '';
    var D = G.drawn || 512, ox = ((-P.x % D) + D) % D, oy = ((-P.y % D) + D) % D, X = -4000, W = 8000, out = '';
    ['light', 'dark'].forEach(function (k) {
      out += '<pattern id="' + id + '-p' + k + '" patternUnits="userSpaceOnUse" x="' + f1(ox) + '" y="' + f1(oy) + '" width="' + D + '" height="' + D + '"><image href="' + G[k] + '" width="' + D + '" height="' + D + '" preserveAspectRatio="none"/></pattern>' +
        '<mask id="' + id + '-m' + k + '" maskUnits="userSpaceOnUse" x="' + X + '" y="' + X + '" width="' + W + '" height="' + W + '"><rect x="' + X + '" y="' + X + '" width="' + W + '" height="' + W + '" fill="url(#' + id + '-p' + k + ')"/></mask>';
    });
    return out;
  }
  function grainOver(id, inner, fill) {
    var G = PAGE.paperGrain; if (!G || !GRAIN) return '';
    var k = (G.k || 0.045) * (BS.grainStrength != null ? BS.grainStrength : 0.25);
    return '<g mask="url(#' + id + '-mlight)" fill="' + shade(fill, 1 + k) + '">' + inner + '</g><g mask="url(#' + id + '-mdark)" fill="' + shade(fill, 1 - k) + '">' + inner + '</g>';
  }
  // The lettering for one balloon: size, face and its metrics in px.
  function letterOf(bl, fs) {
    var k = bl.kind, cap = BS.caption || {}, bangers = k === 'burst' && bl.st !== 'panic';
    var sc = bl.cap ? (k === 'place' ? cap.placeEm || 0.85 : cap.sizeEm || 0.92) : k === 'burst' ? (bl.st === 'panic' ? bsl('panicScale', 1.4) : bsl('shoutScale', 1.6)) : 1;
    var f = fs * sc;
    return { fs: f, bangers: bangers, heavy: bl.st === 'panic', cap: (bangers ? MET.bcap : MET.cap) * f, asc: (bangers ? MET.basc : MET.asc) * f, desc: (bangers ? MET.bdesc : MET.desc) * f, lead: bl.cap ? cap.lead || 1.29 : bsl('leadCap', 1.31) };
  }
  function wordW(t, em, Lt) {
    var c = ctx2d(), up = t.toUpperCase();
    if (!c) return up.length * Lt.fs * 0.62;
    c.font = (Lt.bangers ? '400 ' : em || Lt.heavy ? 'italic 700 ' : '700 ') + Lt.fs.toFixed(2) + 'px ' + (Lt.bangers ? '"Bangers"' : '"Kalam Letter"');
    return c.measureText(up).width + up.length * Lt.fs * (Lt.bangers ? 0.04 : 0.02);
  }
  // The best split of words into k lines: the narrowest widest line; with 3 or more lines, the first and last a little
  // shorter than the widest (the references: about 0.8), so the block reads as a letterer's diamond. Never inside a word.
  function partition(n, k, lineW, lastFree) {
    var best = null, cut = [];
    function score() {
      var lens = [], prev = 0; for (var i = 0; i < cut.length; i++) { lens.push(lineW(prev, cut[i])); prev = cut[i]; }
      var mx = Math.max.apply(null, lens), s = mx;
      if (lens.length > 2) s += 0.35 * (Math.max(0, lens[0] - 0.88 * mx) + Math.max(0, lens[lens.length - 1] - 0.88 * mx));
      var stray = 0; for (var j = 0; j < lens.length - (lastFree ? 1 : 0); j++) if (lens[j] < 0.5 * mx) stray++; // no stray one-word line
      s += 0.6 * mx * stray;
      if (!best || s < best.s) best = { s: s, cuts: cut.slice(), mx: mx, stray: stray };
    }
    function rec(start, left) {
      if (left === 1) { cut.push(n); score(); cut.pop(); return; }
      for (var e = start + 1; e <= n - left + 1; e++) { cut.push(e); rec(e, left - 1); cut.pop(); }
    }
    rec(0, k); return best;
  }
  function combos(n, k) { var r = 1; for (var i = 1; i < k; i++) r = r * (n - i) / i; return r; }
  // A deliberate line break stays a break, but an oversized phone line must still wrap at whole words.
  // This is enabled only for authored phone pages; the accepted desktop and legacy/demo composition is unchanged.
  function wrapAuthoredLines(lines, Lt, maxW) {
    var out = [], space = wordW(' ', false, Lt) * 0.9;
    lines.forEach(function (line) {
      var row = [], width = 0;
      line.forEach(function (word) {
        var w = wordW(word.t, word.em, Lt), next = width + (row.length ? space : 0) + w;
        if (row.length && next > maxW + 0.5) { out.push(row); row = []; width = 0; }
        width += (row.length ? space : 0) + w; row.push(word);
      });
      if (row.length) out.push(row);
    });
    return out;
  }
  function composeLines(bl, Lt, maxW) {
    if (!bl.words.lines.length) return bl.words.lines;
    // An authored phone caption may compose its existing words as one paragraph. Keep the raw text and word objects
    // intact, so emphasis, narration bindings and desktop line breaks retain their approved identity.
    var phoneParagraph = bl.phoneLayout && bl.cap && (bl.kind === 'caption' || bl.kind === 'place') && bl.d && bl.d.phone && bl.d.phone.reflow === 'paragraph';
    if (bl.words.set && !phoneParagraph) {
      if (!bl.phoneLayout) return bl.words.lines;
      bl.longest = Math.max.apply(null, bl.words.lines.reduce(function (all, row) { return all.concat(row.map(function (word) { return wordW(word.t, word.em, Lt); })); }, [0]));
      return wrapAuthoredLines(bl.words.lines, Lt, maxW);
    }
    var ws = phoneParagraph ? bl.words.lines.reduce(function (all, row) { return all.concat(row); }, []) : bl.words.lines[0], n = ws.length;
    var W = ws.map(function (x) { return wordW(x.t, x.em, Lt); }), sp = wordW(' ', false, Lt) * 0.9, pre = [0];
    W.forEach(function (v, i) { pre.push(pre[i] + v); });
    var lineW = function (a, b) { return pre[b] - pre[a] + sp * (b - a - 1); };
    var chars = ws.reduce(function (s, x) { return s + x.t.length; }, 0) + n - 1, choice = null;
    bl.longest = Math.max.apply(null, W);
    if (n < 2) return [ws];
    if (bl.cap) {
      // A caption: the fewest lines that fit its width and keep the box's proportions inside the references' (captions
      // measure 1.1-2.0 wide to high, or a band of 5 and more; shapes.json), then balanced.
      var C = BS.caption || {}, pd = C.pad || { l: 0.67, r: 0.78, t: 0.6, b: 0.77 }, c0 = Lt.cap, amax = C.maxAspect || 2.3;
      var aspect = function (pp, k) { return (pp.mx + (pd.l + pd.r) * c0) / ((k - 1) * Lt.lead * c0 + c0 + (pd.t + pd.b) * c0); };
      for (var k = 1; k <= n; k++) {
        if (combos(n, k) > 60000) continue;
        var p = partition(n, k, lineW, true); if (p.mx > maxW + 0.5) continue;
        if (!choice) choice = p;
        if ((balloonLayoutData(bl).w || 0.5) >= 0.9 || aspect(p, k) <= amax) { choice = p; break; } // a full-width band may run long
      }
    } else {
      // Dialogue: about 9-10 characters a line (5-15), inside the width it may take.
      // The body's a/b must land in the measured 0.9-2.1 without inflating it, so a line count whose block is too wide or
      // too tall is penalized.
      var per = bl.kind === 'burst' ? (BS.burst || {}).charsPerLine || 14 : bsl('charsPerLine', 9), bestS = Infinity, SP = BS.speech || {}, asp2 = bl.kind === 'burst' ? [0.9, 4] : SP.aspect || [0.9, 2.1], c1 = Lt.cap;
      for (var k2 = 1; k2 <= Math.min(n, 7); k2++) {
        if (combos(n, k2) > 60000) continue;
        var p2 = partition(n, k2, lineW), ih = (k2 - 1) * Lt.lead * c1 + c1, ab = (p2.mx / 2 + (SP.padX || 0.94) * c1) / (ih / 2 + (SP.padY || 0.75) * c1);
        var s2 = 0.5 * Math.abs(chars / k2 - per) + 12 * p2.stray + (p2.mx > maxW ? 1000 : 0) + (ab > asp2[1] ? 6 * (ab - asp2[1]) : 0) + p2.s / (Lt.fs * 40);
        if (s2 < bestS) { bestS = s2; choice = p2; }
      }
    }
    if (!choice) return ws.map(function (x) { return [x]; });
    var out = [], prev = 0;
    choice.cuts.forEach(function (c) { out.push(ws.slice(prev, c)); prev = c; });
    return out;
  }
  // Sets the composed lines as spans: one block per line, one span per word (the lettering types on word by word, by
  // opacity, so the glyphs never move).
  function setLines(bl, lines) {
    var key = lines.map(function (l) { return l.map(function (x) { return x.t; }).join(' '); }).join('\n');
    if (bl.key === key) return;
    bl.key = key; bl.box.textContent = ''; bl.units = [];
    lines.forEach(function (ln) {
      var le = el('span', 'cs-line', bl.box);
      ln.forEach(function (x, i) {
        if (i) le.appendChild(document.createTextNode(' '));
        var sp = el('span', 'cs-u', x.em ? el('em', '', le) : le); sp.textContent = x.t; bl.units.push(sp);
      });
    });
    bl.shown = -1; bl.per = Math.min(0.12, (bl.budget * 0.5) / Math.max(1, bl.units.length));
  }
  // Letter one balloon at a size and width: returns its ink geometry in the text box's coordinates.
  function letter(bl, Lt, maxW) {
    var box = bl.box, lines = composeLines(bl, Lt, maxW);
    setLines(bl, lines);
    var Lh = Lt.lead * Lt.cap;
    box.style.fontSize = Lt.fs.toFixed(2) + 'px'; box.style.lineHeight = Lh.toFixed(2) + 'px';
    box.style.left = '0px'; box.style.top = '0px';
    var lw = Array.prototype.map.call(box.children, function (e) { return e.getBoundingClientRect().width; }), n = Math.max(1, lw.length);
    var bw = Math.max.apply(null, lw.concat([1])), base0 = Lh / 2 + (Lt.asc - Lt.desc) / 2, top = base0 - Lt.cap, bot = (n - 1) * Lh + base0;
    return { lw: lw, n: n, bw: bw, bh: n * Lh, Lh: Lh, c: Lt.cap, base0: base0, top: top, bot: bot, inkW: bw, inkH: bot - top, cx: bw / 2, cy: (top + bot) / 2 };
  }
  // Convex hull of the lines' ink rectangles, centred on the ink centre; and the ray distance to it at an angle.
  function textHull(g) {
    var pts = [];
    g.lw.forEach(function (w, i) { var t = g.top + i * g.Lh - g.cy, b = g.base0 + i * g.Lh - g.cy; pts.push([-w / 2, t], [w / 2, t], [w / 2, b], [-w / 2, b]); });
    pts.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    var cr = function (o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }, lo = [], up = [];
    pts.forEach(function (p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); });
    for (var i = pts.length - 1; i >= 0; i--) { var p = pts[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  function hullR(h, dx, dy) {
    var best = 0;
    for (var i = 0; i < h.length; i++) {
      var p = h[i], q = h[(i + 1) % h.length], ex = q[0] - p[0], ey = q[1] - p[1], den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-9) continue;
      var t = (p[0] * ey - p[1] * ex) / den, s = (p[0] * dy - p[1] * dx) / den;
      if (t > 0 && s >= -1e-6 && s <= 1 + 1e-6) best = Math.max(best, t);
    }
    return best;
  }
  // The speech body as polar radii around the ink centre (N samples, angle increasing clockwise on screen).
  function speechBody(bl, g) {
    var c = g.c, sp = BS.speech || {}, n = bl.kind === 'fear' ? (BS.fear || {}).exponent || 3.5 : LOOK.exponent || 3.5;
    var a = g.inkW / 2 + (sp.padX || 0.94) * c, b = g.inkH / 2 + (sp.padY || 0.75) * c, asp = sp.aspect || [0.9, 2.1];
    // Butted: extra body beyond the cut side (Codex style check 21: the border should replace a clear straight part).
    var bx = ((BS.butted || {}).extraCut || 0.6) * c; if (bl.d.edge === 'top' || bl.d.edge === 'bottom') b += bx; else if (bl.d.edge) a += bx;
    // The lettering is composed so a/b falls in the measured 0.9-2.1 (composeLines); the body is never inflated to force it
    // (inflating made fat pillows, 2026-09-29). Only a single short word is widened to the minimum.
    if (a / b < asp[0]) a = b * asp[0];
    var hull = textHull(g), sh = (sp.shoulder || 0.55) * c, hand = sp.hand || { amp: [0.012, 0.02] }, seed = bl.seed;
    var fear = bl.kind === 'fear', N = fear ? 288 : 180, r = [], amps = [], phs = [];
    for (var k = 2; k <= 4; k++) { amps.push(hand.amp[0] + (hand.amp[1] - hand.amp[0]) * hash(seed, 50 + k)); phs.push(hash(seed, 60 + k) * 6.2832); }
    var bumps = null;
    if (fear) {
      // Spooked (the Avengers page's dazed voice): 12-16 uneven scallops about 0.2c deep.
      // Lobes sized by width (Codex style check 9: "visible, unequal scallops ... around the shoulders and sides"), so the count
      // follows the balloon's perimeter: about lobeWidth c each, at least bumps[0].
      var S = BS.fear || {}, bn = S.bumps || [12, 16], per0 = 2 * Math.PI * Math.sqrt((a * a + b * b) / 2), nb = Math.min(bn[1], Math.max(bn[0], Math.round(per0 / ((S.lobeWidth || 1.0) * c)))), jit = S.jitter || 0.3, ws = [], tot = 0;
      for (var j = 0; j < nb; j++) { var wj = 1 + (hash(seed, 80 + j) - 0.5) * 2 * jit; ws.push(wj); tot += wj; }
      bumps = []; var acc = hash(seed, 71) * 6.2832 / nb;
      ws.forEach(function (wj, jj) { var span = wj / tot * 6.2832; bumps.push({ a: acc, w: span, d: (S.depth || 0.2) * c * (1 + (hash(seed, 100 + jj) - 0.5) * 2 * jit) }); acc += span; });
    }
    for (var i = 0; i < N; i++) {
      var t = i / N * 6.2832, co = Math.cos(t), si = Math.sin(t);
      var rs = Math.pow(Math.pow(Math.abs(co / a), n) + Math.pow(Math.abs(si / b), n), -1 / n), rh = hullR(hull, co, si) + sh, rr = Math.max(rs, rh);
      var hv = 1; for (var kk = 0; kk < 3; kk++) hv += amps[kk] * Math.cos((kk + 2) * t + phs[kk]);
      rr *= hv;
      if (bumps) for (var bj = 0; bj < bumps.length; bj++) { var bu = bumps[bj], u = ((t - bu.a) % 6.2832 + 6.2832) % 6.2832 / bu.w; if (u < 1) { rr += bu.d * Math.sin(Math.PI * u); break; } }
      r.push(rr);
    }
    var pts = r.map(function (v, i2) { var t2 = i2 / N * 6.2832; return [v * Math.cos(t2), v * Math.sin(t2)]; });
    return { N: N, r: r, pts: pts, bbox: bboxOf(pts) };
  }
  function bboxOf(pts) { var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; pts.forEach(function (p) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }); return { x0: x0, y0: y0, x1: x1, y1: y1 }; }
  function radiusAt(body, ang) { var N = body.N, f = ((ang / 6.2832) % 1 + 1) % 1 * N, i = Math.floor(f) % N, k = f - Math.floor(f); return body.r[i] * (1 - k) + body.r[(i + 1) % N] * k; }
  function pt(p) { return f1(p[0]) + ' ' + f1(p[1]); }
  function f1(v) { return v.toFixed(1); }
  // The closed outline of a body with its tail spliced in (one path: the tail is part of the balloon, not a second shape).
  // Coordinates are local to the ink centre; T is the mouth, or null.
  function outlinePath(bl, body, T, g) {
    bl.tailVisible = false;
    var N = body.N, P = body.pts, c = g.c, TL = BS.tail || {};
    var smoothRun = function (from, to) { // body samples from index `from` up to `to` (to >= from), smoothed through midpoints
      var s = 'M' + pt(P[((from % N) + N) % N]);
      for (var i = from + 1; i < to; i++) { var a = P[((i % N) + N) % N], b = P[(((i + 1) % N) + N) % N]; s += 'Q' + pt(a) + ' ' + pt([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]); }
      return s + 'L' + pt(P[((to % N) + N) % N]);
    };
    var closed = function () { var s = 'M' + pt([(P[N - 1][0] + P[0][0]) / 2, (P[N - 1][1] + P[0][1]) / 2]); for (var i = 0; i < N; i++) { var a = P[i], b = P[(i + 1) % N]; s += 'Q' + pt(a) + ' ' + pt([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]); } return s + 'Z'; };
    // Thinking (the yellow balloon) never has a wedge: its stem is always the bead trail (Matt, 2026-09-29).
    if (bl.kind === 'thought') { bl.beadStem = T ? beadStem(body, T, c) : ''; bl.tailVisible = !!bl.beadStem; return closed(); }
    if (!T || Math.hypot(T[0], T[1]) <= radiusAt(body, Math.atan2(T[1], T[0])) + c * 0.3) return closed();
    bl.tailVisible = true;
    var e = 0, bd = Infinity;
    for (var i = 0; i < N; i++) { var d = Math.hypot(P[i][0] - T[0], P[i][1] - T[1]); if (d < bd) { bd = d; e = i; } }
    var E = P[e], ax = (T[0] - E[0]) / bd, ay = (T[1] - E[1]) / bd, st = bl.st, off = st === 'offpanel', weak = st === 'weak';
    var anchored = bl.sourceAnchored;
    var half = (off || weak ? (BS.offPanelTail || {}).rootHalf || 0.3 : anchored ? 0.22 : TL.rootHalf || 0.48) * c;
    var len = off ? bd : anchored ? Math.max(0, bd - 0.35 * c) : Math.min(bd, (TL.length || 1.9) * c);
    if (!off && !anchored) { var bend = ((hash(bl.seed, 90) - 0.5) * 2 * (TL.bendMaxDeg || 5) * 0.6) * Math.PI / 180, cb = Math.cos(bend), sb = Math.sin(bend), nx = ax * cb - ay * sb; ay = ax * sb + ay * cb; ax = nx; }
    var iL = e, iR = e, guard = 0;
    while (Math.hypot(P[((iL % N) + N) % N][0] - E[0], P[((iL % N) + N) % N][1] - E[1]) < half && guard++ < N / 4) iL--;
    guard = 0; while (Math.hypot(P[iR % N][0] - E[0], P[iR % N][1] - E[1]) < half && guard++ < N / 4) iR++;
    var fil = (TL.fillet || 0.3) * c, fL = iL, fR = iR, pL = P[((iL % N) + N) % N], pR = P[iR % N];
    guard = 0; while (Math.hypot(P[((fL % N) + N) % N][0] - pL[0], P[((fL % N) + N) % N][1] - pL[1]) < fil && guard++ < N / 8) fL--;
    guard = 0; while (Math.hypot(P[fR % N][0] - pR[0], P[fR % N][1] - pR[1]) < fil && guard++ < N / 8) fR++;
    var mid = [(pL[0] + pR[0]) / 2, (pL[1] + pR[1]) / 2], tip = [mid[0] + ax * len, mid[1] + ay * len], px = -ay, py = ax;
    var sideL = (pL[0] - mid[0]) * px + (pL[1] - mid[1]) * py >= 0 ? 1 : -1;
    var toward = function (a, b, d) { var l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [a[0] + (b[0] - a[0]) / l * d, a[1] + (b[1] - a[1]) / l * d]; };
    var s = smoothRun(fR, fL + N);
    if (weak) {
      // A weak voice (the Darkseid page's faint "NO."): a thin zigzag tail.
      var WZ = BS.weakTail || {}, Z = WZ.zigs || 3, amp = (WZ.amp || 0.3) * c, Ls = [], Rs = [];
      len = anchored ? Math.max(0, bd - 0.35 * c) : Math.min(bd, (WZ.length || 2) * c); tip = [mid[0] + ax * len, mid[1] + ay * len]; half = (WZ.rootHalf || 0.2) * c;
      for (var z = 1; z < Z; z++) { var k = z / Z, zz = (z % 2 ? 1 : -0.6) * amp, cx0 = mid[0] + ax * len * k + px * zz, cy0 = mid[1] + ay * len * k + py * zz, hw = half * (1 - k); Ls.push([cx0 + px * sideL * hw, cy0 + py * sideL * hw]); Rs.unshift([cx0 - px * sideL * hw, cy0 - py * sideL * hw]); }
      // Distinct, unequal changes of direction, tapering to a point (the Darkseid "NO.").
      s += 'L' + pt(pL); Ls.forEach(function (q) { s += 'L' + pt(q); }); s += 'L' + pt(tip); Rs.forEach(function (q) { s += 'L' + pt(q); }); s += 'L' + pt(pR);
      return s + 'Z';
    }
    var ca = TL.ctrlAt || 0.45, co = off ? half * 0.9 : anchored ? half * 0.3 : (TL.ctrlOff || 0.22) * c; // an off-panel wedge stays visible to the edge
    var cL = [mid[0] + ax * len * ca + px * sideL * co, mid[1] + ay * len * ca + py * sideL * co], cR = [mid[0] + ax * len * ca - px * sideL * co, mid[1] + ay * len * ca - py * sideL * co];
    var sL = toward(pL, cL, fil), sR = toward(pR, cR, fil);
    s += 'Q' + pt(pL) + ' ' + pt(sL) + 'Q' + pt(cL) + ' ' + pt(tip) + 'Q' + pt(cR) + ' ' + pt(sR) + 'Q' + pt(pR) + ' ' + pt(P[fR % N]);
    return s + 'Z';
  }
  // The thought stem (Matt, 2026-09-29: "we can have yellow bubbles, and that can indicate something like thinking, the
  // stem of the bubble should standardize that"): 2-3 small beads shrinking from the balloon toward the thinker's head.
  function beadStem(body, T, c) {
    var TS = BS.thought || {}, rs = TS.beads || [0.5, 0.36, 0.25], gap = (TS.beadGap || 0.3) * c, an = Math.atan2(T[1], T[0]), r0 = radiusAt(body, an), ux = Math.cos(an), uy = Math.sin(an);
    var room = Math.hypot(T[0], T[1]) - r0, d = r0 + gap, out = '';
    rs.forEach(function (rr, i) {
      var ry = rr * c, rx = ry * 1.25; if (d + 2 * rx > r0 + Math.max(room, 2 * gap + 2 * rx) && i > 1) return;
      var cx = ux * (d + rx), cy = uy * (d + rx);
      out += 'M' + f1(cx - rx) + ' ' + f1(cy) + 'a' + f1(rx) + ' ' + f1(ry) + ' 0 1 0 ' + f1(2 * rx) + ' 0a' + f1(rx) + ' ' + f1(ry) + ' 0 1 0 ' + f1(-2 * rx) + ' 0Z';
      d += 2 * rx + gap;
    });
    return out;
  }
  // A shout: straight spikes around an ellipse hugging the lettering, uneven in spacing and length; the spike nearest the
  // speaker runs toward them as the tail.
  function burstPath(bl, g, T) {
    var c = g.c, S0 = BS.burst || {}, S = Object.assign({}, S0, (S0.voices || {})[bl.st] || {}), seed = bl.seed, sp = S.spikes || [6, 13], nS = sp[0] + Math.floor(hash(seed, 4) * (sp[1] - sp[0] + 1));
    var A = g.inkW / 2 + (S.padX || 0.6) * c, Bv = g.inkH / 2 + (S.padY || 0.5) * c, tip = S.tip || [0.6, 1.3], sj = S.spacingJitter || 0.35, lj = S.lengthJitter || 0.4;
    var ws = [], tot = 0, i; for (i = 0; i < nS; i++) { var w = 1 + (hash(seed, 10 + i) - 0.5) * 2 * sj; ws.push(w); tot += w; }
    var ang = [], acc = hash(seed, 5) * 6.2832 / nS; ws.forEach(function (w) { ang.push(acc + w / tot * 6.2832 / 2); acc += w / tot * 6.2832; });
    var tailI = -1;
    if (T) { var ta = Math.atan2(T[1], T[0]), bd = 9; ang.forEach(function (a, k) { var d = Math.abs(Math.atan2(Math.sin(a - ta), Math.cos(a - ta))); if (d < bd) { bd = d; tailI = k; } }); ang[tailI] += Math.atan2(Math.sin(ta - ang[tailI]), Math.cos(ta - ang[tailI])); }
    var bn = S.bodyN || 3, ell = function (t) { return Math.pow(Math.pow(Math.abs(Math.cos(t) / A), bn) + Math.pow(Math.abs(Math.sin(t) / Bv), bn), -1 / bn); }, pts = [];
    ang.forEach(function (a, k) {
      var prev = k ? ang[k - 1] : ang[nS - 1] - 6.2832, v = (a + prev) / 2, rv = ell(v) * (S.valley || 0.9), len = (tip[0] + (tip[1] - tip[0]) * hash(seed, 30 + k)) * c * (1 + (hash(seed, 40 + k) - 0.5) * 2 * lj) * (k % 2 ? 1 - (S.alternate || 0) : 1);
      if (hash(seed, 60 + k) > 1 - (S.accents || 0) / nS) len *= S.accentScale || 1.6; // a few accents (Codex: not evenly spiked)
      if (k === tailI) len = Math.max(len, Math.min(Math.hypot(T[0], T[1]) - ell(a), (bl.st === 'panic' ? S.panicTip || 1.3 : S.tailTip || 1.6) * c));
      pts.push([Math.cos(v) * rv, Math.sin(v) * rv], [Math.cos(a) * (ell(a) + len), Math.sin(a) * (ell(a) + len)]);
    });
    return { d: 'M' + pts.map(pt).join('L') + 'Z', bbox: bboxOf(pts) };
  }
  // A neck between two bodies (chain, across): a band about 1.2c wide, slightly waisted, reaching into both bodies.
  // h0 at the first balloon, h1 at the second (a chain's neck is even and slightly waisted; an across connector tapers from
  // the head toward the receiving balloon, as the Avengers connector does).
  function neckPath(c0, e0, e1, c1, h, ext, h1, waist) {
    if (h1 == null) h1 = h;
    var dx = e1[0] - e0[0], dy = e1[1] - e0[1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, px = -uy, py = ux;
    var s0 = [e0[0] - ux * ext, e0[1] - uy * ext], s1 = [e1[0] + ux * ext, e1[1] + uy * ext], bow = waist ? l * 0.05 : 0, m = [(s0[0] + s1[0]) / 2 + px * bow, (s0[1] + s1[1]) / 2 + py * bow], hm = (h + h1) / 2 * (waist || 0.8);
    return 'M' + pt([s0[0] + px * h, s0[1] + py * h]) + 'Q' + pt([m[0] + px * hm, m[1] + py * hm]) + ' ' + pt([s1[0] + px * h1, s1[1] + py * h1]) + 'L' + pt([s1[0] - px * h1, s1[1] - py * h1]) + 'Q' + pt([m[0] - px * hm, m[1] - py * hm]) + ' ' + pt([s0[0] - px * h, s0[1] - py * h]) + 'Z';
  }
  function speechLike(bl) { return !bl.cap && bl.kind !== 'burst'; }
  function balloonLayoutData(bl) {
    var b = mode === 'phone' && bl.d.phone ? Object.assign({}, bl.d, bl.d.phone) : bl.d;
    var anchors = bl.o && panelSpeakerGeometry(bl.o), speaker = anchors && anchors[b.who];
    bl.sourceAnchored = !!(speaker && !bl.cap && b.state !== 'offpanel');
    if (speaker && !bl.cap && b.state !== 'offpanel') {
      b = Object.assign({}, b, { tail: [speaker.mouth[0] / bl.o.box.w, speaker.mouth[1] / bl.o.box.h] });
      bl.w.setAttribute('data-speaker-anchor', 'source');
    } else if (bl.w) bl.w.setAttribute('data-speaker-anchor', 'panel');
    return b;
  }
  function clearBalloonPosition(o, bb, X, Y, margin, current) {
    var speakers = panelSpeakerGeometry(o); if (!speakers) return { x: X, y: Y };
    var P = o.box, width = bb.x1 - bb.x0, height = bb.y1 - bb.y0;
    var faces = Object.keys(speakers).map(function (id) {
      var f = speakers[id].face, pad = margin + (current && !current.cap && current.sourceAnchored && id === current.d.who ? 1.1 * current.g.c : 0);
      return [f[0] - pad, f[1] - pad, f[2] + 2 * pad, f[3] + 2 * pad];
    });
    var occupied = o.balloons.filter(function (bl) { return bl !== current && bl.placementRect; }).map(function (bl) { return bl.placementRect; });
    var blocks = faces.concat(occupied), points = [[X, Y]];
    var loX = margin - bb.x0, hiX = P.w - margin - bb.x1, loY = margin - bb.y0, hiY = P.h - margin - bb.y1;
    if (loX > hiX || loY > hiY) return { x: X, y: Y, conflict: true };
    [loX, hiX, X].forEach(function (x) { [loY, hiY, Y].forEach(function (y) { points.push([x, y]); }); });
    blocks.forEach(function (r) {
      var xs = [r[0] - margin - bb.x1, r[0] + r[2] + margin - bb.x0, X], ys = [r[1] - margin - bb.y1, r[1] + r[3] + margin - bb.y0, Y];
      xs.forEach(function (x) { ys.forEach(function (y) { points.push([x, y]); }); });
    });
    var speaker = current && !current.cap && speakers[current.d.who], best = null;
    points.forEach(function (xy) {
      var x = clamp(xy[0], loX, hiX), y = clamp(xy[1], loY, hiY), rect = [x + bb.x0, y + bb.y0, width, height];
      var overlap = blocks.reduce(function (sum, r) { return sum + Math.max(0, Math.min(rect[0] + width, r[0] + r[2]) - Math.max(rect[0], r[0])) * Math.max(0, Math.min(rect[1] + height, r[1] + r[3]) - Math.max(rect[1], r[1])); }, 0);
      var tailCrossings = speaker ? Object.keys(speakers).filter(function (id) { return id !== current.d.who; }).reduce(function (n, id) { return n + (segmentFaceEntry([x, y], speaker.mouth, speakers[id].face, margin) == null ? 0 : 1); }, 0) : 0;
      var tailConflict = !!(speaker && current.body && !speakerTailTarget([x, y], speaker, current.body, current.g.c).visible);
      var distance = Math.hypot(x - X, y - Y);
      if (speaker) distance = distance * 0.2 + Math.hypot(x - speaker.mouth[0], y - speaker.mouth[1]) * 0.8;
      if (!best || overlap < best.overlap - 0.1 || Math.abs(overlap - best.overlap) < 0.1 && (Number(tailConflict) < Number(best.tailConflict) || tailConflict === best.tailConflict && (tailCrossings < best.tailCrossings || tailCrossings === best.tailCrossings && distance < best.distance))) best = { x: x, y: y, overlap: overlap, tailConflict: tailConflict, tailCrossings: tailCrossings, distance: distance };
    });
    return { x: best.x, y: best.y, conflict: best.overlap > 0.5 || best.tailConflict };
  }
  function segmentFaceEntry(from, to, face, padding) {
    var low = 0, high = 1, pad = padding || 0;
    for (var axis = 0; axis < 2; axis++) {
      var min = face[axis] - pad, max = face[axis] + face[axis + 2] + pad, d = to[axis] - from[axis];
      if (Math.abs(d) < 0.0001) { if (from[axis] < min || from[axis] > max) return null; continue; }
      var a = (min - from[axis]) / d, b = (max - from[axis]) / d;
      low = Math.max(low, Math.min(a, b)); high = Math.min(high, Math.max(a, b));
      if (low > high) return null;
    }
    return low;
  }
  function speakerTailTarget(origin, speaker, body, cap) {
    var entry = segmentFaceEntry(origin, speaker.mouth, speaker.face, 0.25 * cap), fraction = entry == null ? 1 : entry;
    var vector = [(speaker.mouth[0] - origin[0]) * fraction, (speaker.mouth[1] - origin[1]) * fraction];
    var radius = body ? radiusAt(body, Math.atan2(vector[1], vector[0])) : 0;
    return { vector: vector, visible: Math.hypot(vector[0], vector[1]) > radius + 0.75 * cap };
  }
  function semanticCaptionConflict(o, rect, current) {
    var speakers = panelSpeakerGeometry(o) || {}, blocks = Object.keys(speakers).map(function (id) { return speakers[id].face; });
    blocks = blocks.concat(o.balloons.filter(function (bl) { return bl !== current && bl.placementRect; }).map(function (bl) { return bl.placementRect; }));
    return rect[0] < 0 || rect[1] < 0 || rect[0] + rect[2] > o.box.w + 0.5 || rect[1] + rect[3] > o.box.h + 0.5 || blocks.some(function (r) { return rect[0] < r[0] + r[2] && rect[0] + rect[2] > r[0] && rect[1] < r[1] + r[3] && rect[1] + rect[3] > r[1]; });
  }
  function panelStackIndex(m, o, lifted) {
    var local = lifted ? 3 : o.d.inset ? 2 : 0;
    // Keep outgoing authored phone boxes above incoming boxes until their existing exitEnd.
    // Legacy/demo stacking is unchanged; no reveal, dialogue or transition timing changes.
    if (mode === 'phone' && phonePagesValid(m.d)) return String((m.sheets.length - (o.sheet || 0)) * 10 + local);
    return local ? String(local) : '';
  }
  function layoutBalloons(onlyScene) {
    (onlyScene ? [onlyScene] : model).forEach(function (m) {
      var heads = [], prevPanelLast = null;
      m.panels.forEach(function (o) { o.stack = { tl: 0, tr: 0, bl: 0, br: 0 }; o.balloons.forEach(function (bl) { bl.placementRect = null; }); });
      m.panels.forEach(function (o) {
        var P = o.box, lifted = false, prev = null;
        o.balloons.forEach(function (bl, bi) {
          bl.phoneLayout = mode === 'phone' && !!m.d.phonePages;
          bl.o = o;
          var b = balloonLayoutData(bl), Lt = letterOf(bl, o.fs); bl.Lt = Lt; bl.seed = o.seed * 17 + bi * 5 + 3; bl.P = P; bl.members = []; bl.head = null; bl.parts = []; bl.lastPart = '';
          if (bl.w.parentNode !== o.el) o.el.appendChild(bl.w); // a caption moved to its host on a phone comes home on resize
          bl.w.classList.toggle('is-edge', !!b.edge); bl.w.style.clipPath = '';
          if (bl.cap) { placeCaption(m, o, bl, Lt); return; }
          var sw0 = Math.max(1.2, (bl.kind === 'burst' ? (BS.burst || {}).stroke || 0.16 : BS.stroke || 0.2) * Lt.cap);
          var maxW = (b.breakout ? m.w * 0.4 : P.w * 0.86) - 2 * Lt.cap * 1.2;
          if (mode === 'phone' && bl.d.phone && bl.d.phone.w) maxW = Math.min(maxW, P.w * bl.d.phone.w - 2 * Lt.cap * 1.2);
          var g = letter(bl, Lt, Math.max(Lt.fs * 4, maxW)); bl.g = g; bl.sw = sw0;
          var body = bl.kind === 'burst' ? null : speechBody(bl, g), bb = body ? body.bbox : { x0: -g.inkW / 2 - 1.5 * g.c, x1: g.inkW / 2 + 1.5 * g.c, y0: -g.inkH / 2 - 1.3 * g.c, y1: g.inkH / 2 + 1.3 * g.c };
          bl.body = body;
          var mg = sw0 + 2, X = b.x * P.w - bb.x0, Y = b.y * P.h - bb.y0;
          // A chain: the same speaker's next beat, 0.75c from the last balloon along the authored direction.
          var join = null;
          if (b.chain && prev && speechLike(prev) && body) join = prev;
          if (b.across && body) join = prevPanelLast;
          if (join && b.chain && join.body) {
            var dx = X - join.cx, dy = Y - join.cy, dl = Math.hypot(dx, dy) || 1, an = Math.atan2(dy, dx), gap = ((BS.chain || {}).gap || 0.75) * g.c;
            var dist = radiusAt(join.body, an) + gap + radiusAt(body, an + Math.PI);
            X = join.cx + dx / dl * dist; Y = join.cy + dy / dl * dist;
          }
          if (b.breakout) { X = clamp(X, -P.x - bb.x0 + 4, m.w - P.x - bb.x1 - 4); Y = clamp(Y, -P.y - bb.y0 + 4, m.h - P.y - bb.y1 - 4); lifted = true; }
          else if (!b.edge) { X = bb.x1 - bb.x0 > P.w - 2 * mg ? P.w / 2 - (bb.x0 + bb.x1) / 2 : clamp(X, mg - bb.x0, P.w - mg - bb.x1); Y = bb.y1 - bb.y0 > P.h - 2 * mg ? P.h / 2 - (bb.y0 + bb.y1) / 2 : clamp(Y, mg - bb.y0, P.h - mg - bb.y1); }
          // Butted: the box border cuts the balloon (no outline on the cut side); the lettering stays 0.6c clear of it.
          var clear = ((BS.butted || {}).textClear || 0.6) * g.c + BW;
          if (b.edge === 'top') Y = clear + g.inkH / 2; else if (b.edge === 'bottom') Y = P.h - clear - g.inkH / 2;
          else if (b.edge === 'left') X = clear + g.inkW / 2; else if (b.edge === 'right') X = P.w - clear - g.inkW / 2;
          if (b.edge) bl.w.style.clipPath = 'inset(' + BW + 'px)';
          if (!b.edge && !b.breakout) {
            var placed = clearBalloonPosition(o, bb, X, Y, mg, bl); X = placed.x; Y = placed.y;
            bl.placementConflict = !!placed.conflict;
            bl.w.setAttribute('data-placement-conflict', placed.conflict ? 'true' : 'false');
          }
          X = snap(X); Y = snap(Y); bl.cx = X; bl.cy = Y;
          bl.placementRect = [X + bb.x0, Y + bb.y0, bb.x1 - bb.x0, bb.y1 - bb.y0];
          bl.box.style.left = snap(X - g.cx) + 'px'; bl.box.style.top = snap(Y - g.cy) + 'px';
          // Only the last balloon of a chain carries the tail (the references); it inherits the chain's tail if it has none.
          var nx = o.balloons[bi + 1], chainNext = nx && balloonLayoutData(nx).chain && !nx.cap, tl = b.tail;
          if (b.chain && !tl && !chainNext) { for (var ci = bi - 1; ci >= 0 && !tl; ci--) { var prior = balloonLayoutData(o.balloons[ci]); tl = prior.tail; if (!prior.chain) break; } }
          if (tl && bl.sourceAnchored) {
            var speakers = panelSpeakerGeometry(o), speaker = speakers && speakers[b.who];
            if (speaker) {
              var pointer = speakerTailTarget([X, Y], speaker, body, g.c);
              tl = [(X + pointer.vector[0]) / P.w, (Y + pointer.vector[1]) / P.h];
              bl.w.setAttribute('data-tail-conflict', pointer.visible ? 'false' : 'true');
              if (!pointer.visible) { bl.placementConflict = true; bl.w.setAttribute('data-placement-conflict', 'true'); }
            }
          }
          var T = tl && !chainNext && !b.across ? [tl[0] * P.w - X, tl[1] * P.h - Y] : null;
          if (!T && bl.st === 'offpanel' && !b.chain) T = [(X < P.w / 2 ? -X : P.w - X), 0]; // an off-panel voice with no mouth: to the nearer side
          if (bl.kind === 'burst') { var bp = burstPath(bl, g, T); bl.path = bp.d; bl.body = { bbox: bp.bbox }; }
          else bl.path = outlinePath(bl, body, T, g);
          // The balloon's measured parameters, in cap heights, for the style check's golden comparison.
          var bbx = bl.body && bl.body.bbox;
          bl.w.setAttribute('data-geom', JSON.stringify({ fs: +Lt.fs.toFixed(2), c: +g.c.toFixed(2), lines: g.n, lead: +(g.Lh / g.c).toFixed(3), inkW: +(g.inkW / g.c).toFixed(2), bodyW: bbx ? +((bbx.x1 - bbx.x0) / g.c).toFixed(2) : null, bodyH: bbx ? +((bbx.y1 - bbx.y0) / g.c).toFixed(2) : null, padX: bbx ? +(((bbx.x1 - bbx.x0) - g.inkW) / 2 / g.c).toFixed(2) : null, padY: bbx ? +(((bbx.y1 - bbx.y0) - g.inkH) / 2 / g.c).toFixed(2) : null, n: bl.kind === 'burst' ? null : LOOK.exponent, stroke: +(sw0 / g.c).toFixed(3), strokePx: +sw0.toFixed(2), tail: !!T && (bl.kind === 'burst' || !!bl.tailVisible) }));
          if (join) { var hd = join.head || join; bl.head = hd; bl.join = join; hd.members.push(bl); }
          else heads.push(bl);
          prev = bl;
        });
        var sp = o.balloons.filter(function (x) { return !x.cap && x.kind !== 'burst'; });
        if (sp.length) prevPanelLast = sp[sp.length - 1];
        o.el.style.zIndex = panelStackIndex(m, o, lifted);
      });
      heads.forEach(drawGroup);
      m.panels.forEach(function (o) { o.balloons.forEach(function (bl) { if (bl.head) bl.shape.innerHTML = ''; }); });
    });
  }
  // One shape per head balloon: the head and any balloons joined to it (chain, across), as one paper group with one
  // opacity and one ink ring masked by that paper, so there is no darker stem where shapes meet (Matt, 2026-09-28).
  function drawGroup(hd) {
    var svg = hd.shape, P = hd.P, all = [hd].concat(hd.members), FA = (BS.fillAlpha && BS.fillAlpha.balloon) || 0.88;
    svg.setAttribute('width', P.w); svg.setAttribute('height', P.h);
    // White is the standard (the measured #f4f4f4); thinking is the measured yellow of Spider-Man #33; a scream is red.
    var fill = hd.kind === 'thought' ? (BS.thought || {}).fill || '#ede614' : hd.st === 'scream' ? (BS.burst || {}).screamFill || '#e30a0f' : PAPER;
    var parts = all.map(function (bl) {
      var ox = bl.P.x - P.x + bl.cx, oy = bl.P.y - P.y + bl.cy, tr = ' transform="translate(' + f1(ox) + ' ' + f1(oy) + ')"', paper = '<path' + tr + ' d="' + bl.path + '"/>', neck = '';
      if (bl.kind === 'thought' && bl.beadStem) paper += '<path' + tr + ' d="' + bl.beadStem + '"/>'; // beadStem: thinking only
      if (bl.join) {
        var j = bl.join, jx = j.P.x - P.x + j.cx, jy = j.P.y - P.y + j.cy, an = Math.atan2(oy - jy, ox - jx), AC = BS.across || {}, acr = !!bl.d.across;
        var h = (acr ? AC.rootHalf || 0.3 : (BS.chain || {}).neckHalf || 0.6) * bl.g.c, h1 = acr ? (AC.endHalf || 0.3) * bl.g.c : h;
        var r0 = radiusAt(j.body, an), r1 = radiusAt(bl.body, an + Math.PI);
        neck = neckPath([jx, jy], [jx + Math.cos(an) * r0, jy + Math.sin(an) * r0], [ox - Math.cos(an) * r1, oy - Math.sin(an) * r1], [ox, oy], h, 0.6 * bl.g.c, h1, acr ? AC.waist || 0.4 : null);
        neck = '<path d="' + neck + '"/>';
      }
      return { bl: bl, i: all.indexOf(bl), sil: paper + neck, ox: ox, oy: oy };
    });
    var wrap = function (p, inner) { return p.i === 0 ? inner : '<g data-part="' + p.i + '" opacity="0">' + inner + '</g>'; };
    var sw = hd.sw, id = 'cs-bm-' + (++uid), X = -4000, W = 8000;
    var menace = '';
    all.forEach(function (bl, i) {
      if (bl.st !== 'menace' || !bl.body || !bl.body.r) return;
      // Menace (X-Men #132): a red, wavy second outline around the balloon.
      var M = BS.menace || {}, off = (M.offset || 0.35) * bl.g.c, amp = (M.amp || 0.12) * bl.g.c, wv = M.waves || 18, N = bl.body.N, pts = [];
      var p1 = hash(bl.seed, 91) * 6.2832, p2 = hash(bl.seed, 92) * 6.2832;
      for (var k = 0; k < N; k++) { var t = k / N * 6.2832, rr = bl.body.r[k] + off + amp * (1 + 0.25 * Math.sin(3 * t + p1)) * Math.sin(wv * t + 0.6 * Math.sin(5 * t + p2)); pts.push([Math.cos(t) * rr, Math.sin(t) * rr]); }
      // The mask sits on a group, not on the transformed path (a mask resolves in the element's own transformed space).
      menace += wrap(parts[i], '<g mask="url(#' + id + ')"><path transform="translate(' + f1(parts[i].ox) + ' ' + f1(parts[i].oy) + ')" d="' + smooth(pts) + '" fill="none" stroke="' + (M.colour || '#e30a0f') + '" stroke-width="' + f1(Math.max(1.5, (M.stroke || 0.16) * bl.g.c)) + '"/></g>');
    });
    svg.innerHTML = '<defs>' + grainDefs(id, P) + '<mask id="' + id + '" maskUnits="userSpaceOnUse" x="' + X + '" y="' + X + '" width="' + W + '" height="' + W + '"><rect x="' + X + '" y="' + X + '" width="' + W + '" height="' + W + '" fill="#fff"/><g fill="#000">' + parts.map(function (p) { return wrap(p, p.sil); }).join('') + '</g></mask></defs>' +
      menace +
      '<g fill="none" stroke="' + INK + '" stroke-width="' + f1(2 * sw) + '" stroke-linejoin="' + (all.some(function (b) { return b.st === 'weak'; }) ? 'round' : 'miter') + '" stroke-miterlimit="' + (hd.kind === 'burst' ? 6 : 30) + '" mask="url(#' + id + ')">' + parts.map(function (p) { return wrap(p, p.sil); }).join('') + '</g>' +
      // A breakout is one printed shape laid over the page: its paper is opaque throughout (Codex style checks 8 and 30: a
      // rule, or a tonal seam at the box edge, showed through a translucent breakout). Every other balloon keeps the
      // approved translucency.
      '<g class="cs-paper" fill="' + fill + '" opacity="' + (hd.d.breakout ? 1 : FA) + '" data-sil>' + parts.map(function (p) { return wrap(p, p.sil + grainOver(id, p.sil, fill)); }).join('') + '</g>';
    // Each joined balloon's parts (mask, ink, paper) follow its own opacity (render).
    hd.members.forEach(function (bl, i) { bl.parts = Array.prototype.slice.call(svg.querySelectorAll('[data-part="' + (i + 1) + '"]')); });
  }
  function smooth(pts) {
    var n = pts.length, mid = function (a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }, m0 = mid(pts[n - 1], pts[0]), d = 'M' + f1(m0[0]) + ' ' + f1(m0[1]);
    for (var i = 0; i < n; i++) { var p = pts[i], mm = mid(p, pts[(i + 1) % n]); d += 'Q' + f1(p[0]) + ' ' + f1(p[1]) + ' ' + f1(mm[0]) + ' ' + f1(mm[1]); }
    return d + 'Z';
  }
  // Captions (narration, place, inner thought): square, a 0.2c black rule, the measured padding, butted into a box
  // corner (flush to its border) and stacked. The words are composed into lines that fit; a word is never broken.
  function capGeom(bl, Lt, maxTextW) {
    var C = BS.caption || {}, pd = C.pad || { l: 0.67, r: 0.78, t: 0.6, b: 0.77 }, c = Lt.cap, rule = Math.max(1, Math.round((C.rule || 0.2) * c * dpr) / dpr); // whole device pixels: a crisp rule
    var g = letter(bl, Lt, maxTextW);
    return { g: g, rule: rule, w: g.inkW + (pd.l + pd.r) * c + rule, h: g.inkH + (pd.t + pd.b) * c + rule, pl: pd.l * c + rule / 2, pt: pd.t * c + rule / 2 };
  }
  function placeCaption(m, o, bl, Lt) {
    var b = balloonLayoutData(bl), C = BS.caption || {}, pd = C.pad || { l: 0.67, r: 0.78 }, c = Lt.cap, rule = Math.max(1, (C.rule || 0.2) * c), pads = (pd.l + pd.r) * c + rule;
    var host = o, P = o.box, inner = P.w - 2 * BW;
    var want = Math.min((b.w || 0.5) * P.w, inner) - pads;
    var cg = capGeom(bl, Lt, Math.max(want, 1));
    if (bl.longest > want) cg = capGeom(bl, Lt, Math.min(inner - pads, bl.longest + 1));
    var fits = function (box, gg, st) { return bl.longest + pads <= box.w - 2 * BW + 0.5 && st + gg.h <= box.h - 2 * BW + 0.5; };
    var right = b.sceneSetup || (b.x + (b.w || 0.3) > 0.9 && b.x > 0.35), bottom = b.sceneSetup || bl.kind !== 'place' && (b.y > 0.6 || b.edge === 'bottom'), key = (bottom ? 'b' : 't') + (right ? 'r' : 'l');
    if (!fits(P, cg, o.stack[key]) && o.d.inset) {
      // A caption that cannot fit its cascade inset: the inset grows (up to 1.5x, kept inside its host), or the caption
      // moves to the host box. Never a word broken across lines (the phone's "WEDNES DAY").
      var hb = hostOf(m, o), needW = bl.longest + pads + 2 * BW + 2, needH = cg.h + 2 * BW + 2, gk = Math.max(needW / P.w, needH / P.h, 1);
      var nb = null;
      if (hb && gk <= 1.5 && P.w * gk <= hb.box.w - 2 * GUT && P.h * gk <= hb.box.h - 2 * GUT) {
        nb = { x: P.x - (P.w * gk - P.w) / 2, y: P.y - (P.h * gk - P.h) / 2, w: P.w * gk, h: P.h * gk };
        nb.x = clamp(nb.x, hb.box.x + GUT, hb.box.x + hb.box.w - nb.w - GUT); nb.y = clamp(nb.y, hb.box.y + GUT, hb.box.y + hb.box.h - nb.h - GUT);
        nb = { x: snap(nb.x), y: snap(nb.y), w: snap(nb.w), h: snap(nb.h) };
        // Not if it would cover a sibling inset's art (cascade steps touch only by their gutter bands).
        m.panels.forEach(function (q) { if (q === o || !q.d.inset || hostOf(m, q) !== hb || !q.box) return; var ow = Math.min(nb.x + nb.w, q.box.x + q.box.w) - Math.max(nb.x, q.box.x), oh = Math.min(nb.y + nb.h, q.box.y + q.box.h) - Math.max(nb.y, q.box.y); if (ow > 2 * GUT && oh > 2 * GUT) nb = null; });
      }
      if (nb) {
        o.box = nb; P = nb; var st = o.el.style; st.left = nb.x + 'px'; st.top = nb.y + 'px'; st.width = nb.w + 'px'; st.height = nb.h + 'px'; drawBorder(o);
        want = Math.min((b.w || 0.5) * P.w, P.w - 2 * BW) - pads; cg = capGeom(bl, Lt, Math.max(want, bl.longest + 1));
      } else if (hb) {
        host = hb; P = hb.box; hb.el.appendChild(bl.w); bl.movedTo = hb.d.id || 'host';
        cg = capGeom(bl, Lt, Math.max(Math.min(0.5 * P.w, P.w - 2 * BW) - pads, bl.longest + 1));
      }
    }
    bl.P = P;
    var gap = Math.round(((C.gap || 0.5) * c)), stack = host.stack;
    var at = function (k) { var r = k.charAt(1) === 'r', bo = k.charAt(0) === 'b'; return { x: r ? P.w - BW - cg.w : BW, y: bo ? P.h - BW - cg.h - stack[k] : BW + stack[k] }; };
    if (!b.sceneSetup && !b.characterIntro && bl.kind !== 'place' && m.panels.some(function (z) { return z.d.inset && z.box && hostOf(m, z) === host; })) {
      // In a box that hosts insets (a cascade), a caption takes the first corner that no inset covers: its own, or one moved
      // from an inset. A caption is never covered and never covers an inset's gutter band.
      var clearOf = function (k) { var q = at(k), X0 = P.x + q.x, Y0 = P.y + q.y; return q.y >= 0 && q.y + cg.h <= P.h && !m.panels.some(function (z) { return z.d.inset && z.box && hostOf(m, z) === host && X0 < z.box.x + z.box.w + GUT && X0 + cg.w > z.box.x - GUT && Y0 < z.box.y + z.box.h + GUT && Y0 + cg.h > z.box.y - GUT; }); };
      // A caption moved from an inset reads after the host's own, so it tries the lower corners first.
      var ks = (host !== o ? ['br', 'bl', 'tr', 'tl'] : [key, 'tl', 'tr', 'bl', 'br']).filter(clearOf); if (ks.length) key = ks[0];
    }
    var xy = !b.sceneSetup && b.anchor === 'free' ? { x: clamp(b.x * P.w, BW, P.w - BW - cg.w), y: bl.kind === 'place' ? BW + stack[key] : clamp(b.y * P.h, BW, P.h - BW - cg.h) } : at(key), x = xy.x, y = xy.y;
    if (host === o && b.anchor === 'free' && bl.kind === 'caption' && !b.characterIntro && !b.sceneSetup) {
      var clearCaption = clearBalloonPosition(o, { x0: 0, y0: 0, x1: cg.w, y1: cg.h }, x, y, BW, bl);
      x = clearCaption.x; y = clearCaption.y;
    }
    if (b.anchor !== 'free') stack[key] += cg.h + gap;
    if (host === o) {
      // Location stays at the top, introductions stay at their authored character, setup stays bottom-right.
      // A collision is an authoring/reflow failure; it must not silently teleport the story's labels.
      bl.placementConflict = semanticCaptionConflict(o, [x, y, cg.w, cg.h], bl);
      bl.w.setAttribute('data-placement-conflict', bl.placementConflict ? 'true' : 'false');
      bl.w.setAttribute('data-caption-anchor', b.sceneSetup ? 'bottom-right' : bl.kind === 'place' ? 'top' : b.characterIntro ? 'character-authored' : b.anchor === 'free' ? 'authored' : key);
    }
    x = snap(x); y = snap(y);
    bl.placementRect = [x, y, cg.w, cg.h];
    bl.box.style.left = snap(x + cg.pl) + 'px'; bl.box.style.top = snap(y + cg.pt - cg.g.top) + 'px';
    var CA = (BS.fillAlpha && BS.fillAlpha.caption) || 0.85, fill = (b.characterIntro || b.sceneSetup) && (bl.kind === 'caption' || bl.kind === 'place') ? ((BS.characterIntro && BS.characterIntro.fill) || '#1a9ba1') : LOOK.captionFill || C.fill || '#eae619';
    bl.shape.setAttribute('width', P.w); bl.shape.setAttribute('height', P.h);
    var gid = 'cs-cg-' + (++uid), rect = '<rect x="' + f1(x) + '" y="' + f1(y) + '" width="' + f1(cg.w) + '" height="' + f1(cg.h) + '"/>';
    // Butted into the corner, the caption shares the box's border: its own rule is drawn only on the sides away from the
    // border, so no doubled frame (Codex style check 8; the references' corner captions).
    var e0 = 0.5, fl = { l: Math.abs(x - BW) < e0, r: Math.abs(x + cg.w - (P.w - BW)) < e0, t: Math.abs(y - BW) < e0, b: Math.abs(y + cg.h - (P.h - BW)) < e0 };
    if (host.d.open || host.d.clip) fl = { l: false, r: false, t: false, b: false };
    var h2 = cg.rule / 2, X0 = x + h2, Y0 = y + h2, X1 = x + cg.w - h2, Y1 = y + cg.h - h2, seg = '';
    if (!fl.t) seg += 'M' + f1(x) + ' ' + f1(Y0) + 'H' + f1(x + cg.w); if (!fl.b) seg += 'M' + f1(x) + ' ' + f1(Y1) + 'H' + f1(x + cg.w);
    if (!fl.l) seg += 'M' + f1(X0) + ' ' + f1(y) + 'V' + f1(y + cg.h); if (!fl.r) seg += 'M' + f1(X1) + ' ' + f1(y) + 'V' + f1(y + cg.h); // butt caps: no overrun
    bl.shape.innerHTML = '<defs>' + grainDefs(gid, P) + '</defs><g class="cs-paper" data-sil fill="' + fill + '" opacity="' + CA + '">' + rect + grainOver(gid, rect, fill) + '</g><path d="' + seg + '" fill="none" stroke="' + INK + '" stroke-width="' + f1(cg.rule) + '" stroke-linecap="butt"/>';
    bl.g = cg.g;
    bl.w.setAttribute('data-geom', JSON.stringify({ fs: +Lt.fs.toFixed(2), c: +c.toFixed(2), lines: cg.g.n, lead: +(cg.g.Lh / c).toFixed(3), boxW: +(cg.w / c).toFixed(2), boxH: +(cg.h / c).toFixed(2), rule: +(cg.rule / c).toFixed(3), rulePx: +cg.rule.toFixed(2), moved: !!bl.movedTo }));
  }
  function hostOf(m, o) {
    if (o.d.host) { var h = m.panels.filter(function (q) { return q.d.id === o.d.host; })[0]; if (h) return h; }
    var r = o.box, cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    return m.panels.filter(function (q) { return q !== o && !q.d.inset && q.box && cx >= q.box.x && cx <= q.box.x + q.box.w && cy >= q.box.y && cy <= q.box.y + q.box.h; })[0] || null;
  }
  // Per scene (beats, relative to the scene): each sheet's arrival, and its exit window. A desktop scene is one sheet; a
  // phone scene may be several, turned horizontally inside the scene.
  function lastAtOf(ps) { var a = 0; ps.forEach(function (o) { a = Math.max(a, o.d.at); (o.d.balloons || []).forEach(function (b) { a = Math.max(a, b.at); }); }); return a; }
  function sheetReadyAt(ps) {
    var ready = 0;
    ps.forEach(function (o) {
      ready = Math.max(ready, o.d.at + (o.d.run ? REVEAL * 0.5 : REVEAL));
      o.balloons.forEach(function (bl) {
        var count = bl.units.length, per = bl.per;
        if (typeof per !== 'number' || !isFinite(per) || per < 0) return;
        ready = Math.max(ready, bl.d.at + Math.max(0.35, 0.3 + Math.max(0, count - 1) * per) / B);
      });
    });
    return ready;
  }
  function timeline(m) {
    var l = m.d.l, out = [];
    m.sheets.forEach(function (ps, k) {
      var first = ps[0].d.at, s = k === 0 ? 0 : clamp(first - ENTER * 0.5, out[k - 1].lastAt + 0.5, first);
      out.push({ panels: ps, start: s, lastAt: lastAtOf(ps) });
    });
    out.forEach(function (x, k) {
      var ready = sheetReadyAt(x.panels) + 0.25;
      if (k < out.length - 1) { var nx = out[k + 1].start; x.exitStart = Math.max(x.lastAt + 0.25, ready, nx - EXIT * 0.6); x.exitEnd = Math.max(x.exitStart + 0.5, nx + EXIT * 0.4); }
      else { x.exitStart = Math.min(l - 0.1, Math.max(Math.min(x.lastAt + 0.5, l - 0.5), ready, l - EXIT)); x.exitEnd = l; }
    });
    return out;
  }
  function inHold(m, bt) { var h = m.d.hold || []; for (var i = 0; i < h.length; i++) { if (bt >= h[i][0] - 0.3 && bt < h[i][1] + 0.3) return c01(Math.min((bt - h[i][0] + 0.3) / 0.3, (h[i][1] + 0.3 - bt) / 0.3)); } return 0; }
  // Effects time: frozen at a hold's start while the hold lasts (the hero hold is still, as well as grey).
  function fxTime(m, bt, t) { var h = m.d.hold || []; for (var i = 0; i < h.length; i++) if (bt >= h[i][0] && bt < h[i][1]) return (m.d.b + h[i][0]) * B; return t; }

  /* ---------- Transitions: simple fades, box by box ---------- */
  // Matt, 2026-09-28: "no fancy animations on slide fade out, just simply fade each box out from start to end, and fade in
  // the next scene boxes the same way." A scene's boxes fade in to their ghost in reading order, reveal box by box, then
  // fade out in reading order. Nothing slides, wipes or flickers. (The old `exit` styles are ignored.)
  /* ---------- Render: everything from T ---------- */
  function sceneAt(t) { if (t >= NEXT_T) return scenes.length; var k = 0; for (var i = 0; i < scenes.length; i++) if (t >= scenes[i].b * B) k = i; return k; }
  function sheetAt(m, bt) { var k = 0; m.times.forEach(function (x, i) { if (bt >= x.start) k = i; }); return k; }
  var liveScene = -1, nextShown = false, mastOp = '', titleOp = '', titleFor = -1, frozen = false;
  var phoneScrollForce = false, phoneScrollFocus = '';
  function syncPhoneScroll(m, beat) {
    if (typeof view === 'undefined' || !view || typeof cam === 'undefined') return;
    var tall = mode === 'phone' && m && m.h > vh - 2 * PAD + 1;
    stage.setAttribute('data-phone-scroll', tall ? 'true' : 'false');
    cam.style.height = (tall ? m.h + 2 * PAD : vh) + 'px';
    cam.style.width = vw + 'px';
    if (!tall) { view.scrollTop = 0; phoneScrollFocus = ''; phoneScrollForce = false; view.removeAttribute('tabindex'); return; }
    view.setAttribute('tabindex', '0'); view.setAttribute('role', 'region'); view.setAttribute('aria-label', 'Comic page. Scroll to read all boxes.');
    var sheet = sheetAt(m, beat), panels = m.times[sheet] && m.times[sheet].panels || [], focused = panels[0];
    panels.forEach(function (o) { if (o.d.at <= beat) focused = o; });
    var key = m.si + ':' + sheet + ':' + (focused ? m.panels.indexOf(focused) : 0);
    if ((phoneScrollForce || key !== phoneScrollFocus) && focused && focused.box) {
      var top = PAD + focused.box.y, bottom = top + focused.box.h;
      if (phoneScrollForce || top < view.scrollTop || bottom > view.scrollTop + vh) view.scrollTop = clamp(top - PAD, 0, Math.max(0, m.h + 2 * PAD - vh));
    }
    phoneScrollFocus = key; phoneScrollForce = false;
  }
  function render(t) {
    var si = sceneAt(t);
    if (si !== liveScene) {
      model.forEach(function (m, i) { m.page.classList.toggle('is-live', i === si); });
      liveScene = si;
      loadScene(si - 1); loadScene(si); loadScene(si + 1); loadScene(si + 2); // readiness includes previous; preserve two ahead
    }
    var fz = false;
    if (si < scenes.length) {
      var m = model[si], bt = t / B - m.d.b, l = m.d.l, greyK = inHold(m, bt);
      fz = greyK > 0.98;
      renderPanels(m, bt, greyK, t);
      syncPhoneScroll(m, bt);
      var mo = si === 0 ? String(Math.min(c01((bt - 0.3) / 0.6), 1 - c01((bt - Math.min(7, l - 2)) / 0.8)).toFixed(3)) : '0';
      if (mo !== mastOp) { mast.style.opacity = mo; mastOp = mo; }
      if (titleFor !== si) { titleEl.textContent = m.d.title || ''; titleFor = si; }
      var first = m.panels[0] ? m.panels[0].d.at : 1;
      var to = m.d.title ? String(Math.min(c01((bt - 0.4) / 0.5), 1 - c01((bt - (first + 2)) / 0.6)).toFixed(3)) : '0';
      if (to !== titleOp) { titleEl.style.opacity = to; titleOp = to; }
    } else {
      syncPhoneScroll(null, 0);
      if (mastOp !== '0') { mast.style.opacity = '0'; mastOp = '0'; }
      if (titleOp !== '0') { titleEl.style.opacity = '0'; titleOp = '0'; }
    }
    if (fz !== frozen) { frozen = fz; if (fz) stage.setAttribute('data-freeze', ''); else stage.removeAttribute('data-freeze'); }
    showNext(si >= scenes.length, t);
    if (progress) progress.update(t);
  }
  function panelFadeStart(x, index) {
    return x.exitStart + index * (x.panels.length > 1 ? (x.exitEnd - x.exitStart) * 0.5 / (x.panels.length - 1) : 0);
  }
  function panelRevealDuration(x, o, index) {
    var duration = o.d.run ? REVEAL * 0.5 : REVEAL, available = panelFadeStart(x, index) - o.d.at;
    // A silent final box can inherit a short phone-sheet transition window.
    // Complete its reveal with a visible hold; never shorten lettering/reading budgets.
    return !o.balloons.length && available > 0 && available < duration ? available * 0.8 : duration;
  }
  // Declarative art-only motion (Matt, 2026-10-09). A pure story-clock sample: no CSS clock, no random effects.
  // The previous focus rests at the exact next-panel beat; balloons, paper and borders are never targets.
  function removeAgentFabrication(layer) {
    if (!layer.fabrication) return;
    layer.element.removeChild(layer.fabrication.mask); layer.fabrication = null;
    var index = activeAgentFabrications.indexOf(layer); if (index >= 0) activeAgentFabrications.splice(index, 1);
  }
  function applyAgentFabrication(layer, sample) {
    if (!sample.fabrication || layer.spec.role !== 'agents' || layerArtDisposed) { removeAgentFabrication(layer); return; }
    var target = layer.element, effect = layer.fabrication;
    if (!effect) {
      var mask = el('div', 'cs-agent-fabrication', target), band = el('div', 'cs-agent-fabrication__band', mask);
      mask.setAttribute('aria-hidden', 'true'); mask.style.position = 'absolute'; mask.style.inset = '0'; mask.style.overflow = 'hidden'; mask.style.pointerEvents = 'none'; mask.style.mixBlendMode = 'normal';
      mask.style.maskMode = 'alpha'; mask.style.maskRepeat = mask.style.webkitMaskRepeat = 'no-repeat';
      band.style.position = 'absolute'; band.style.left = '0'; band.style.width = '100%'; band.style.height = '6%';
      band.style.backgroundImage = 'repeating-linear-gradient(0deg,transparent 0px,transparent 3px,rgba(91,220,217,1) 3px,rgba(91,220,217,1) 4px),radial-gradient(circle,rgba(255,255,255,1) 0.75px,transparent 0.85px)';
      band.style.backgroundSize = '100% 4px,6px 6px'; band.style.mixBlendMode = 'normal';
      effect = layer.fabrication = { mask: mask, band: band }; activeAgentFabrications.push(layer);
    }
    // The fixed parent samples the exact decoded plane alpha in the same registered crop.
    effect.mask.style.maskImage = effect.mask.style.webkitMaskImage = target.style.backgroundImage;
    effect.mask.style.maskSize = effect.mask.style.webkitMaskSize = target.style.backgroundSize;
    effect.mask.style.maskPosition = effect.mask.style.webkitMaskPosition = target.style.backgroundPosition;
    var supported = !window.CSS || !window.CSS.supports || window.CSS.supports('mask-image', target.style.backgroundImage) || window.CSS.supports('-webkit-mask-image', target.style.backgroundImage);
    effect.mask.style.display = supported && sample.fabrication.opacity > 0 ? '' : 'none';
    effect.mask.setAttribute('data-fabrication-mode', supported ? (sample.fabrication.opacity > 0 ? 'active' : 'static') : 'unsupported-static');
    effect.band.style.top = sample.fabrication.y.toFixed(4) + '%'; effect.band.style.opacity = sample.fabrication.opacity.toFixed(4);
    target.style.mixBlendMode = 'normal'; target.style.isolation = 'isolate';
  }
  function layerMotionTransform(sample, target, placement) {
    if (target.setAttribute) { target.setAttribute('data-motion-clamped', 'false'); target.setAttribute('data-motion-conflict', 'false'); }
    if (!sample.sourceOffset) return sample.transform;
    var size = (target.style.backgroundSize || '').split(/\s+/).map(parseFloat);
    if (!(size[0] > 0 && size[1] > 0)) return 'none';
    var offset = [sample.sourceOffset[0] * size[0], sample.sourceOffset[1] * size[1]], bounds = sample.sourceBounds;
    if (bounds && placement) {
      var pos = placement.backgroundPosition, extent = [placement.width, placement.height], clamped = false;
      for (var axis = 0; axis < 2; axis++) {
        var origin = pos[axis] + bounds[axis] * size[axis], span = bounds[axis + 2] * size[axis];
        var low = -origin, high = extent[axis] - origin - span;
        if (!(Number.isFinite(low) && Number.isFinite(high)) || low > high) {
          if (target.setAttribute) target.setAttribute('data-motion-conflict', 'true');
          return 'none'; // A prop larger than its visible crop needs a real composition repair.
        }
        if (sample.sourceTravel) {
          // Clamp the route's endpoints before interpolation; reaching an edge must not leave the rest of the beat idle.
          var from = sample.sourceTravel.from[axis] * size[axis], to = sample.sourceTravel.to[axis] * size[axis];
          var safeFrom = clamp(from, low, high), safeTo = clamp(to, low, high);
          clamped = clamped || Math.abs(safeFrom - from) > 0.01 || Math.abs(safeTo - to) > 0.01;
          offset[axis] = safeFrom + (safeTo - safeFrom) * sample.sourceTravel.progress;
        } else {
          var safe = clamp(offset[axis], low, high); clamped = clamped || Math.abs(safe - offset[axis]) > 0.01; offset[axis] = safe;
        }
      }
      if (target.setAttribute) target.setAttribute('data-motion-clamped', clamped ? 'true' : 'false');
    }
    return 'translate(' + offset[0].toFixed(4) + 'px,' + offset[1].toFixed(4) + 'px)';
  }
  function floorContributionAvailable(spec, m, beat) {
    if (!spec || spec.floorIndex == null || !spec.floorSource || typeof story === 'undefined') return true;
    var scene = story.scenes.find(function (s) { return s.id === spec.floorSource.sceneId; });
    var panel = scene && scene.panels.find(function (p) { return (p.img || p.id) === spec.floorSource.panelId; });
    return !!(panel && Number.isFinite(scene.b) && Number.isFinite(panel.at) && m.d.b + beat >= scene.b + panel.at);
  }
  function panelMotionSample(spec, beat, start, stop, reduced) {
    var out = { transform: 'none', filter: 'none', clipPath: 'none' };
    if (spec && (spec.preset === 'travel' || spec.preset === 'vibrate')) {
      if (reduced || beat < start) return out;
      var duration = spec.preset === 'travel' && spec.sourceBounds && spec.beats == null ? Math.max(2, stop - start) : clamp(Number(spec.beats) || 4, 2, 8), elapsed = Math.max(0, Math.min(beat, stop) - start);
      var power = spec.strength == null ? 1 : clamp(Number(spec.strength) || 0, 0, 1), progress = c01(elapsed / duration);
      if (spec.sourceBounds) out.sourceBounds = spec.sourceBounds;
      if (spec.preset === 'travel') {
        var from = spec.from || [0, 0], to = spec.to || [0, 0], k = spec.sourceBounds ? progress : ease(progress);
        out.sourceOffset = [0, 1].map(function (axis) { return (from[axis] + (to[axis] - from[axis]) * k) * power; });
        if (spec.sourceBounds) out.sourceTravel = { from: from.map(function (v) { return v * power; }), to: to.map(function (v) { return v * power; }), progress: k };
      } else {
        var amplitude = clamp(Number(spec.amplitude) || 0, 0, 0.012) * power;
        // Short ring bursts move the isolated phone, then settle; no CSS/wall clock or full-box shake.
        out.sourceOffset = [progress >= 1 ? 0 : amplitude * Math.sin(Math.PI * progress) * Math.sin(elapsed * Math.PI * 8), 0];
      }
      return out;
    }
    if (spec && spec.preset === 'sprout' && spec.floorIndex != null) {
      var count = clamp(Number(spec.floors) || 8, 2, 16), span = clamp(Number(spec.beats) || 8, 2, 8);
      var eligible = !spec.activeFloors || spec.activeFloors.indexOf(spec.floorIndex) !== -1;
      var retained = spec.retainedFloors && spec.retainedFloors.indexOf(spec.floorIndex) !== -1;
      var step = Math.floor(c01((Math.min(beat, stop) - start) / span) * count);
      out.opacity = eligible && (retained || (beat >= start && (reduced || step >= spec.floorIndex))) ? 1 : 0;
      return out; // An independently authored floor is a whole plane, never a clipped tower copy.
    }
    if (spec && spec.preset === 'sprout' && !reduced) {
      var floors = clamp(Number(spec.floors) || 8, 2, 16), duration = clamp(Number(spec.beats) || 8, 2, 8);
      var grown = Math.floor(c01((Math.min(beat, stop) - start) / duration) * floors) / floors;
      out.clipPath = 'inset(' + ((1 - grown) * 100).toFixed(3) + '% 0 0 0)';
      return out;
    }
    if (spec && spec.preset === 'projection' && spec.fabrication === true) {
      var cycle = clamp(Number(spec.beats) || 4, 2, 8), power = spec.strength == null ? 0.5 : clamp(Number(spec.strength) || 0, 0, 1);
      var phase = (Math.max(0, Math.min(beat, stop) - start) / cycle) % 1;
      out.opacity = 1; // Native RGBA owns transmission; source colour/ink never dims or desaturates.
      out.fabrication = { y: 108 - 116 * phase, opacity: reduced || beat < start ? 0 : 0.12 * power };
      return out;
    }
    if (!spec || spec.preset === 'still' || reduced || beat < start) return out;
    var span = clamp(Number(spec.beats) || 4, 2, 8), strength = spec.strength == null ? 0.5 : clamp(Number(spec.strength) || 0, 0, 1);
    var k = ease(c01((Math.min(beat, stop) - start) / span)), amount = strength * k;
    if (spec.preset === 'push') out.transform = 'scale(' + (1 + 0.06 * amount).toFixed(5) + ')';
    else if (spec.preset === 'drift-left' || spec.preset === 'drift-right') {
      var dir = spec.preset === 'drift-left' ? -1 : 1;
      out.transform = 'translateX(' + (dir * 1.2 * amount).toFixed(4) + '%) scale(' + (1 + 0.06 * amount).toFixed(5) + ')';
    } else if (spec.preset === 'light' || spec.preset === 'shadow') {
      var light = spec.preset === 'light' ? 0.10 : -0.12;
      out.filter = 'brightness(' + (1 + light * strength * Math.sin(Math.PI * k)).toFixed(5) + ')';
    } else if (spec.preset === 'projection') {
      out.opacity = 1 - 0.045 * strength * Math.sin(Math.PI * k);
      out.filter = 'drop-shadow(0 0 ' + (1 + 1.5 * amount).toFixed(3) + 'px rgba(91,220,217,0.24))';
    }
    return out;
  }
  function applyPanelMotion(o, x, index, beat) {
    var stop = Math.min(panelFadeStart(x, index), index + 1 < x.panels.length ? x.panels[index + 1].d.at : x.exitStart);
    (o.layerCrops || []).forEach(function (layer) {
      var spec = (o.d.layerMotion || []).find(function (motion) { return motion.layerId === layer.spec.id; });
      if (spec && spec.preset === 'projection' && layer.spec.role && layer.spec.role !== 'agents') spec = null;
      if (spec && (spec.preset === 'travel' || spec.preset === 'vibrate') && layer.spec.role !== 'props') spec = null;
      var sample = panelMotionSample(spec, beat, o.d.at, stop, REDUCED), target = layer.element;
      sample.transform = layerMotionTransform(sample, target, o.basePlacement);
      var opacity = (sample.opacity == null ? 1 : sample.opacity) * (layer.spec.opacity == null ? 1 : clamp(layer.spec.opacity, 0, 1));
      if (sample.transform !== layer.cache.transform) { target.style.transform = sample.transform; layer.cache.transform = sample.transform; }
      if (sample.filter !== layer.cache.filter) { target.style.filter = sample.filter; layer.cache.filter = sample.filter; }
      if (sample.clipPath !== layer.cache.clipPath) { target.style.clipPath = sample.clipPath; layer.cache.clipPath = sample.clipPath; }
      if (opacity !== layer.cache.opacity) { target.style.opacity = String(opacity); layer.cache.opacity = opacity; }
      applyAgentFabrication(layer, sample);
    });
    var target = o.motionArt; if (!target || !o.d.motion) return;
    var sample = panelMotionSample(o.d.motion, beat, o.d.at, stop, REDUCED);
    if (sample.transform !== o.cache.motionTransform) { target.style.transform = sample.transform; o.cache.motionTransform = sample.transform; }
    if (sample.filter !== o.cache.motionFilter) { target.style.filter = sample.filter; o.cache.motionFilter = sample.filter; }
  }
  function renderPanels(m, bt, greyK, t) {
    var ft = fxTime(m, bt, t), cur = sheetAt(m, bt);
    m.times.forEach(function (x, k) {
      var n = x.panels.length;
      // In and out alike: each box fades on its own, in reading order, start to end.
      var span = x.exitEnd - x.exitStart, dOut = span * 0.5;
      var dIn = ENTER * 0.5, stIn = n > 1 ? (ENTER * 0.5) / (n - 1) : 0;
      x.panels.forEach(function (o, idx) {
        // The box itself (its dark base and border) is there for the whole sheet; its content fades in to the ghost as the
        // scene arrives, comes up to full at its beat, and fades out as the scene leaves, box by box in reading order.
        var op, tx = 0, ek = 0, live = REDUCED ? k === cur : bt >= x.start && (k === cur || bt < x.exitEnd), fo = 1;
        if (REDUCED) op = 1;
        else if (bt < x.start) op = 0;
        else {
          // A run (quick steps animating a character) reveals each box faster.
          var e = ease(c01((bt - (x.start + idx * stIn)) / dIn)), rk = ease(c01((bt - o.d.at) / panelRevealDuration(x, o, idx)));
          ek = c01((bt - panelFadeStart(x, idx)) / dOut);
          fo = e * (1 - ease(ek));
          op = fo * (GHOST + (1 - GHOST) * rk);
        }
        op = clamp(op, 0, 1);
        if (!o.loaded) op = 0; // a box waits for its art (Matt, 2026-09-29: never reveal a half-loaded box)
        if (m.art) m.art.setRegion(idx + (k ? m.times.slice(0, k).reduce(function (a2, y) { return a2 + y.panels.length; }, 0) : 0), o, op);
        var vs = live ? '1' : '0'; if (o.cache.box !== vs) { o.cache.box = vs; o.el.style.opacity = vs; }
        var os = op.toFixed(3); if (o.cache.op !== os) { o.cache.op = os; o.art.style.opacity = os; }
        o.fo = fo;
        tx = snap(tx);
        var ts = tx ? 'translate3d(' + tx + 'px,0,0)' : 'none'; if (o.cache.tx !== ts) { o.cache.tx = ts; o.el.style.transform = ts; }
        applyPanelMotion(o, x, idx, ft / B - m.d.b);
        if (o.viewCrop) applyPanelView(m, o, x, idx, ft / B - m.d.b);
        if (vs === '0') return;
        // Inside the box: artistic effects only. Layers drift apart horizontally, very slightly, over the box's life.
        if (o.svg && o.layers.length && !REDUCED) {
          var life = Math.max(1, x.exitStart - o.d.at), kk = inOut(c01((bt - o.d.at) / life)) - 0.5;
          o.layers.forEach(function (L) {
            var s = 'translate(' + (m.dir * (L.depth - 0.5) * kk * 0.012 * o.vbW).toFixed(2) + 'px,0px)';
            if (s !== L.last) { L.g.style.transform = s; L.last = s; }
          });
        }
        o.rain.forEach(function (R) { var y = ((ft / 0.9) % 1) * R.loop, s = 'translate(' + (-y * 0.18).toFixed(1) + 'px,' + y.toFixed(1) + 'px)'; if (s !== R.last) { R.g.style.transform = s; R.last = s; } });
        o.flick.forEach(function (F) { var step = Math.floor(ft / 0.11), h = hash(step, F.seed), a = h < 0.12 ? 0.3 : h < 0.2 ? 0.65 : 1; var s = String(a); if (s !== F.last) { F.g.style.opacity = s; F.last = s; } });
        // The second brain: one more floor lights on every beat after the box is revealed.
        var lit = REDUCED ? 99 : (ft / B - m.d.b) - o.d.at;
        o.floors.forEach(function (F, j) { var a = String((0.14 + 0.86 * c01(lit - j)).toFixed(3)); if (a !== F.last) { F.g.style.opacity = a; F.last = a; } });
        // Balloons fade in on their beats: no movement.
        o.balloons.forEach(function (bl) {
          var since = (bt - bl.d.at) * B, v = REDUCED ? 1 : ease(c01(since / 0.35)) * o.fo, s = v.toFixed(3);
          if (s !== bl.last) { bl.last = s; bl.w.style.opacity = s; }
          bl.v = v;
          // A chained or across-panel balloon is drawn inside its head's shape (one paper group, so no stacked translucency
          // at the neck): its part there follows its own opacity.
          if (bl.head && bl.parts.length) { var pv = bl.head.v > 0.001 ? Math.min(1, v / bl.head.v).toFixed(3) : '0'; if (pv !== bl.lastPart) { bl.lastPart = pv; bl.parts.forEach(function (g) { g.setAttribute('opacity', pv); }); } }
          // Then the lettering types on, word by word (letter by letter, with a small teal caret, for a machine).
          var n = REDUCED ? bl.units.length : clamp(Math.floor((since - 0.3) / bl.per) + 1, 0, bl.units.length);
          if (n !== bl.shown) {
            bl.units.forEach(function (u, k) { u.style.opacity = k < n ? '1' : '0'; });
            bl.shown = n;
          }
        });
      });
    });
  }
  function hash(a, b) { var h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h); }
  // The NEXT page arrives between screens, so it may move vertically.
  function showNext(on, t) {
    if (on && !nextShown) { nextEl.hidden = false; nextEl.removeAttribute('inert'); nextShown = true; }
    if (!on && nextShown) { nextEl.hidden = true; nextShown = false; }
    if (on) { var k = REDUCED ? 1 : c01(((t - NEXT_T) / B - 0.25) / 1); nextEl.style.opacity = ease(k).toFixed(3); nextEl.style.transform = 'translate3d(0,' + ((1 - ease(k)) * 28).toFixed(1) + 'px,0)'; }
  }
  // Page turns land on each sheet's arrival, then the NEXT page.
  function stops() {
    var out = [];
    model.forEach(function (m) { m.times.forEach(function (x) { out.push((m.d.b + x.start) * B + 0.02); }); });
    out.push(REDUCED ? END_T : NEXT_T);
    return out;
  }

  /* ---------- Clock and music (the Beat Comic's conventions, shared keys) ---------- */
  var MIX = 'mtw-mixtape';
  function mixGet() { try { return JSON.parse(sessionStorage.getItem(MIX) || '{}') || {}; } catch (e) { return {}; } }
  function mixSet(o) { try { var m = mixGet(); for (var k in o) m[k] = o[k]; sessionStorage.setItem(MIX, JSON.stringify(m)); } catch (e) {} }
  function sitePref() { try { return localStorage.getItem('mtw-sound'); } catch (e) { return null; } }
  function siteSound(on) { var tt = window.MTWTactile; if (tt && tt.isSoundOn && tt.isSoundOn() !== on) tt.setSound(on); }
  function siteBlocked(b) { var tt = window.MTWTactile; if (tt && tt.setBlocked) tt.setBlocked(b); }
  var music = story.music, audio = null, muted = q.has('mute') || sitePref() === 'off', audioLive = false, waiting = false;
  // Resolve before storing a cross-page tail: the next file may have a different directory depth.
  music.src = new URL(music.src, document.baseURI).href;
  var state = 'play', t0 = 0, T = 0, raf = 0, held = false, userPaused = false, pausedAt = 0;
  var hold = q.has('hold');
  var seek0 = 0;
  if (q.has('scene')) { var sid = q.get('scene'), sc0 = null; for (var z = 0; z < scenes.length; z++) if (scenes[z].id === sid) sc0 = scenes[z]; seek0 = sid === 'next' ? NEXT_T + (parseFloat(q.get('beat')) || 0) * B : sc0 ? (sc0.b + (parseFloat(q.get('beat')) || 0)) * B : 0; }
  else if (q.has('t')) seek0 = Math.max(0, parseFloat(q.get('t')) || 0);
  // The song loops under a longer story (Matt, 2026-09-28: "loop the music and sync it to box changes"). Story beats count
  // on; the song plays its region music.loop {from, to} (song beats, phrase boundaries) again and again, seeked back on
  // the loop's downbeat. Default: from 0 to the last whole 16-beat phrase in the file, set once its length is known.
  var LOOP = music.loop && music.loop.to > music.loop.from ? music.loop : null;
  function songTime(t) { var sb = t / B; if (LOOP && sb >= LOOP.to) sb = LOOP.from + ((sb - LOOP.to) % (LOOP.to - LOOP.from)); return music.offset + sb * B; }
  // Song position (beats) back to story beats, choosing the pass nearest the story's last known beat.
  function storyBeat(sp, q) {
    if (!LOOP || q == null) return sp;
    var Lb = LOOP.to - LOOP.from, n0 = Math.floor((q - LOOP.to) / Lb), best = sp < LOOP.to ? sp : null;
    for (var n = Math.max(0, n0 - 1); n <= Math.max(0, n0 + 1); n++) {
      var c = LOOP.to + n * Lb + (sp - LOOP.from);
      if (best == null || Math.abs(c - q) < Math.abs(best - q)) best = c;
    }
    return best;
  }

  function clockTime() {
    if (REDUCED) return T;
    if (held) return END_T;
    if (audioLive && audio && !audio.paused) {
      var sp = (audio.currentTime - music.offset) / B;
      if (LOOP && sp >= LOOP.to - 0.002) { var Lb = LOOP.to - LOOP.from; try { audio.currentTime -= Lb * B; } catch (e) {} sp -= Lb; }
      var sb = storyBeat(sp, lastSB);
      if (lastSB != null && sb < lastSB - 1) sb = lastSB; // never run backwards
      lastSB = sb;
      var mt = sb * B;
      if (mt >= END_T) { held = true; return END_T; }
      return Math.max(0, mt);
    }
    var pt = now() - t0; if (pt >= END_T) { held = true; return END_T; }
    return Math.max(0, pt);
  }
  var lastSB = null, tickCtx = null, lastBeat = -1, TICK = q.get('beat') === 'tick';
  function tick(t) {
    if (!TICK) return; var bn = Math.floor(t / B); if (bn === lastBeat) return; lastBeat = bn;
    try { tickCtx = tickCtx || new (window.AudioContext || window.webkitAudioContext)(); var o = tickCtx.createOscillator(), g = tickCtx.createGain(); o.frequency.value = bn % 4 === 0 ? 1600 : 1000; g.gain.value = 0.15; g.gain.exponentialRampToValueAtTime(0.001, tickCtx.currentTime + 0.05); o.connect(g); g.connect(tickCtx.destination); o.start(); o.stop(tickCtx.currentTime + 0.06); } catch (e) {}
  }
  function frame() {
    raf = 0;
    if (state !== 'play') return;
    T = clockTime();
    render(T); tick(T); score.update(T);
    if (!document.hidden && !held && !REDUCED) raf = requestAnimationFrame(frame);
  }
  /* ---------- The score: music where it lifts the story, room tone, invented effects ---------- */
  // Matt, 2026-10-04: "I'm not convinced we need or want music all the time ... try inventing audio effects or using the
  // music but in a creative score type way similar to a movie", then "Score plus effects feel free to use music where you
  // want". The song still runs (it is the clock) but through a gain that follows each scene's `score` (0-1), faded over two
  // beats; a story with no `score` anywhere keeps the song at full, as before. Under it, each scene's `room` tone, and on
  // each box's reveal (plus `delay`) its `sfx`, all synthesized here with Web Audio: no sound files, nothing borrowed.
  var SCORED = scenes.some(function (s) { return s.score != null || s.room || s.panels.some(function (p) { return p.room != null || p.sfx && p.sfx.length || (p.balloons || []).some(function (b) { return !!b.speech; }); }); });
  var score = (function () {
    var OUTPUT_HEADROOM = 0.6; // Common output margin for summed cues and encoded review overshoot.
    var ctx = null, master = null, musicGain = null, roomBus = null, rooms = {}, routed = false, lastBt = null, lastLvl = -1, lastRoom = '', roomFocus = null, focusedPanel = null, fired = [];
    var analyser = null, tone = null, roomAssets = {}, roomLoads = [], disposed = false, bins = null, meterTimer = 0;
    var bars = tag.querySelectorAll('.rl-eq i'), credit = tag.querySelector('.rl-tag__credit');
    tag.classList.add('is-metered');
    if (credit) { credit.title = music.credit; credit.setAttribute('aria-label', music.credit); }
    function meter() {
      var live = analyser && ctx.state === 'running' && audioLive && !muted && !userPaused && !document.hidden;
      if (live) analyser.getByteFrequencyData(bins);
      var edges = [1, 6, 24, 80, 256];
      Array.prototype.forEach.call(bars, function (bar, i) {
        var sum = 0; if (live) for (var k = edges[i]; k < edges[i + 1]; k++) sum += bins[k];
        var value = live ? Math.min(1, sum / (edges[i + 1] - edges[i]) / 140) : 0;
        bar.style.setProperty('--level', value.toFixed(3));
      });
      // Keep the exact song credit visible during its score cue; effects/room alone do not imply music.
      tag.classList.toggle('is-music-active', !!(live && audio && !audio.paused && (SCORED ? lastLvl > 0.004 : true)));
      meterTimer = setTimeout(meter, document.hidden ? 250 : 50);
    }
    function noiseBuf(kind) {
      var n = ctx.sampleRate * 4, buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0), b0 = 0, b1 = 0, b2 = 0, last = 0;
      for (var i = 0; i < n; i++) {
        var w = Math.random() * 2 - 1;
        if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
        else if (kind === 'pink') { b0 = 0.997 * b0 + w * 0.029591; b1 = 0.985 * b1 + w * 0.032534; b2 = 0.95 * b2 + w * 0.048056; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.6; }
        else d[i] = w;
      }
      return buf;
    }
    var bufs = {};
    function buf(kind) { return bufs[kind] || (bufs[kind] = noiseBuf(kind)); }
    function src(kind, loop) { var s = ctx.createBufferSource(); s.buffer = buf(kind); s.loop = !!loop; return s; }
    function filt(type, f, qv) { var x = ctx.createBiquadFilter(); x.type = type; x.frequency.value = f; if (qv) x.Q.value = qv; return x; }
    function gainNode(v) { var g = ctx.createGain(); g.gain.value = v; return g; }
    function osc(type, f) { var o = ctx.createOscillator(); o.type = type; o.frequency.value = f; return o; }
    function env(g, t, a, peak, dcy) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dcy); }
    // Room tones: continuous low beds; crossfade only when the focused depicted environment changes.
    function makeRoom(name) {
      var out = gainNode(0); out.connect(roomBus); var procedural = gainNode(1); procedural.connect(out);
      if (name === 'office') { var s = src('pink', true), f = filt('lowpass', 380); s.connect(f); f.connect(gainNode(0.5)).connect(procedural); s.start(); }
      else if (name === 'servers') {
        var s1 = src('pink', true), f1 = filt('bandpass', 900, 0.6); s1.connect(f1); f1.connect(gainNode(0.35)).connect(procedural); s1.start();
        var h = osc('sine', 60), hg = gainNode(0.05); h.connect(hg); hg.connect(procedural); h.start();
        var h2 = osc('sine', 120), hg2 = gainNode(0.025); h2.connect(hg2); hg2.connect(procedural); h2.start();
      } else if (name === 'street') {
        // Low road body plus distant tire/traffic wash. No horn, voice or repeating bell.
        var road = src('brown', true), roadFilter = filt('lowpass', 260);
        road.connect(roadFilter); roadFilter.connect(gainNode(0.32)).connect(procedural); road.start();
        var traffic = src('pink', true), trafficFilter = filt('bandpass', 720, 0.45), trafficGain = gainNode(0.10);
        traffic.connect(trafficFilter); trafficFilter.connect(trafficGain); trafficGain.connect(procedural); traffic.start();
        var passing = osc('sine', 0.11), passingGain = gainNode(0.035);
        passing.connect(passingGain); passingGain.connect(trafficGain.gain); passing.start();
      }
      else if (name === 'rain') {
        var s3 = src('white', true), f3 = filt('highpass', 1200), lf = osc('sine', 0.3), lg = gainNode(0.08), rg = gainNode(0.18);
        s3.connect(f3); f3.connect(rg); rg.connect(procedural); lf.connect(lg); lg.connect(rg.gain); s3.start(); lf.start();
      }
      loadRoomAsset(name, out, procedural);
      return out;
    }
    // Optional authored audio assets replace only their procedural bed after successful decode.
    // Both branches enter the same room envelope/master EQ; failures retain the procedural bed.
    function loadRoomAsset(name, out, procedural) {
      var asset = story.soundAssets && story.soundAssets.rooms && story.soundAssets.rooms[name];
      if (!asset) return;
      var state = roomAssets[name] = { status: 'loading', src: asset.src, gain: asset.gain == null ? 1 : asset.gain };
      if (typeof asset.src !== 'string' || !asset.src || typeof state.gain !== 'number' || !isFinite(state.gain) || state.gain < 0 || state.gain > 1 || typeof fetch !== 'function') { state.status = 'fallback-invalid'; return; }
      var abort = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = setTimeout(function () { state.status = 'fallback-timeout'; if (abort) abort.abort(); }, 8000);
      roomLoads.push({ state: state, abort: abort, timer: timer });
      fetch(new URL(asset.src, document.baseURI).href, abort ? { signal: abort.signal } : {}).then(function (response) {
        if (!response.ok) throw new Error('room asset HTTP failure'); return response.arrayBuffer();
      }).then(function (bytes) { return ctx.decodeAudioData(bytes); }).then(function (decoded) {
        if (disposed || state.status !== 'loading' || ctx.state === 'closed') return;
        var loop = ctx.createBufferSource(), mix = gainNode(0); loop.buffer = decoded; loop.loop = true;
        loop.connect(mix); mix.connect(out); loop.start();
        mix.gain.setTargetAtTime(state.gain, ctx.currentTime, 0.6); procedural.gain.setTargetAtTime(0, ctx.currentTime, 0.6);
        state.status = 'decoded-loop'; state.durationSeconds = decoded.duration;
      }).catch(function () { if (state.status === 'loading') state.status = 'fallback-error'; }).finally(function () { clearTimeout(timer); });
    }
    // Effects, each a few lines of synthesis.
    var FX = {
      // One bounded passing transit rumble; authors select it only for depicted transit.
      transit: function (t, g) {
        var road = src('brown'), low = filt('lowpass', 320), v = gainNode(0);
        road.connect(low); low.connect(v); v.connect(g); env(v, t, 0.65, 0.5, 1.9); road.start(t); road.stop(t + 2.6);
        [58, 87].forEach(function (fr) { var o = osc('triangle', fr), f = filt('lowpass', 190), h = gainNode(0);
          o.connect(f); f.connect(h); h.connect(g); env(h, t, 0.7, 0.035, 1.8); o.start(t); o.stop(t + 2.6); });
      },
      buzz: function (t, g) { var o = osc('sawtooth', 160), f = filt('lowpass', 700), v = gainNode(0); o.connect(f); f.connect(v); v.connect(g); for (var k = 0; k < 3; k++) { v.gain.setValueAtTime(0.0001, t + k * 0.45); v.gain.linearRampToValueAtTime(0.5, t + k * 0.45 + 0.02); v.gain.setValueAtTime(0.5, t + k * 0.45 + 0.28); v.gain.linearRampToValueAtTime(0.0001, t + k * 0.45 + 0.3); } o.start(t); o.stop(t + 1.4); },
      ring: function (t, g) { [1400, 1800].forEach(function (fr) { var o = osc('sine', fr), v = gainNode(0), tr = osc('square', 20), tg = gainNode(0.12); o.connect(v); v.connect(g); tr.connect(tg); tg.connect(v.gain); for (var k = 0; k < 2; k++) { v.gain.setValueAtTime(0.12, t + k * 0.8); v.gain.setValueAtTime(0, t + k * 0.8 + 0.45); } o.start(t); tr.start(t); o.stop(t + 1.3); tr.stop(t + 1.3); }); },
      paper: function (t, g) { var s = src('white'), f = filt('bandpass', 3200, 0.8), v = gainNode(0); s.connect(f); f.connect(v); v.connect(g); for (var k = 0; k < 10; k++) { var tk = t + k * 0.06 + Math.random() * 0.03; v.gain.setValueAtTime(0.0001, tk); v.gain.exponentialRampToValueAtTime(0.35 * Math.random() + 0.1, tk + 0.01); v.gain.exponentialRampToValueAtTime(0.0001, tk + 0.07); } s.start(t, Math.random()); s.stop(t + 0.8); },
      keys: function (t, g) { for (var k = 0; k < 8; k++) { var tk = t + k * 0.09 + Math.random() * 0.05, s = src('white'), f = filt('highpass', 2500), v = gainNode(0); s.connect(f); f.connect(v); v.connect(g); env(v, tk, 0.002, 0.4, 0.03); s.start(tk, Math.random()); s.stop(tk + 0.05); } },
      click: function (t, g) { var s = src('white'), f = filt('bandpass', 2000, 2), v = gainNode(0); s.connect(f); f.connect(v); v.connect(g); env(v, t, 0.001, 0.6, 0.025); s.start(t); s.stop(t + 0.04); },
      whoosh: function (t, g) { var s = src('pink'), f = filt('bandpass', 300, 1.5), v = gainNode(0); s.connect(f); f.connect(v); v.connect(g); f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(3000, t + 0.3); f.frequency.exponentialRampToValueAtTime(400, t + 0.7); env(v, t, 0.25, 0.9, 0.45); s.start(t, Math.random()); s.stop(t + 0.8); },
      impact: function (t, g) { var o = osc('sine', 70), v = gainNode(0); o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.4); o.connect(v); v.connect(g); env(v, t, 0.005, 1, 0.5); o.start(t); o.stop(t + 0.6); var s = src('brown'), f = filt('lowpass', 900), w = gainNode(0); s.connect(f); f.connect(w); w.connect(g); env(w, t, 0.002, 0.8, 0.25); s.start(t); s.stop(t + 0.3); },
      glass: function (t, g) { for (var k = 0; k < 6; k++) { var o = osc('sine', 2800 + Math.random() * 3500), v = gainNode(0), tk = t + Math.random() * 0.12; o.connect(v); v.connect(g); env(v, tk, 0.002, 0.12, 0.5 + Math.random() * 0.4); o.start(tk); o.stop(tk + 1); } var s = src('white'), f = filt('highpass', 4000), w = gainNode(0); s.connect(f); f.connect(w); w.connect(g); env(w, t, 0.002, 0.5, 0.2); s.start(t); s.stop(t + 0.25); },
      alarm: function (t, g) { var o = osc('square', 880), f = filt('lowpass', 2200), v = gainNode(0.12); o.connect(f); f.connect(v); v.connect(g); for (var k = 0; k < 6; k++) o.frequency.setValueAtTime(k % 2 ? 660 : 880, t + k * 0.25); v.gain.setValueAtTime(0.12, t + 1.4); v.gain.linearRampToValueAtTime(0, t + 1.5); o.start(t); o.stop(t + 1.5); },
      door: function (t, g) { [[1047, 0], [1319, 0.35]].forEach(function (p) { var o = osc('sine', p[0]), v = gainNode(0); o.connect(v); v.connect(g); env(v, t + p[1], 0.005, 0.3, 1.2); o.start(t + p[1]); o.stop(t + p[1] + 1.3); }); var s = src('brown'), f = filt('lowpass', 200), w = gainNode(0); s.connect(f); f.connect(w); w.connect(g); w.gain.setValueAtTime(0.0001, t + 0.6); w.gain.exponentialRampToValueAtTime(0.6, t + 0.9); w.gain.exponentialRampToValueAtTime(0.0001, t + 1.8); s.start(t + 0.6); s.stop(t + 1.9); },
      heartbeat: function (t, g) { [0, 0.28].forEach(function (d, k) { var o = osc('sine', 52), v = gainNode(0); o.connect(v); v.connect(g); env(v, t + d, 0.01, k ? 0.6 : 1, 0.18); o.start(t + d); o.stop(t + d + 0.3); }); },
      sting: function (t, g) { var f = filt('lowpass', 2400), v = gainNode(0); f.connect(v); v.connect(g); f.frequency.setValueAtTime(2400, t); f.frequency.exponentialRampToValueAtTime(260, t + 1.6); env(v, t, 0.01, 0.5, 2.2); [55, 82.4, 110, 130.8].forEach(function (fr) { var o = osc('sawtooth', fr); o.detune.value = (Math.random() - 0.5) * 12; o.connect(f); o.start(t); o.stop(t + 2.4); }); var sub = osc('sine', 41), sg = gainNode(0); sub.connect(sg); sg.connect(g); env(sg, t, 0.01, 0.7, 2); sub.start(t); sub.stop(t + 2.2); }
    };

    // Optional saved words follow the same balloon first-glyph/read clock. No generated speech or voice API here.
    var SPEECH_BUS_LEVEL = 0.7, SPEECH_ATTACK_SECONDS = 0.025, SPEECH_RELEASE_SECONDS = 0.045;
    var voiceBus = null, voiceAssets = {}, voiceQueue = [], voiceLoads = [], voiceBusy = 0, voiceActive = null;
    var voiceT = null, voiceLastTime = null, voiceNatural = {}, voiceShifts = {}, voiceQuiet = false, voiceEnded = '', voiceDuck = 1, voiceIssues = [], voiceIssueKeys = {};
    function voiceIssue(id, reason, details) { var key = id + ':' + reason; if (voiceIssueKeys[key]) return; voiceIssueKeys[key] = true; voiceIssues.push({ id: id, reason: reason, details: details || null }); }
    function voiceEvents() {
      var events = [], writtenStarts = [];
      scenes.forEach(function (sc) { sc.panels.forEach(function (p) { (p.balloons || []).forEach(function (bl) { writtenStarts.push((sc.b + Math.max(p.at, bl.at)) * B + 0.3); }); }); });
      scenes.forEach(function (sc, si) { sc.panels.forEach(function (p, pi) { (p.balloons || []).forEach(function (bl, bi) {
        var clip = bl.speech; if (!clip) return;
        var start = (sc.b + Math.max(p.at, bl.at)) * B + 0.3;
        var next = sc.panels.filter(function (other) { return other.at > p.at; }).reduce(function (end, other) { return Math.min(end, (sc.b + other.at) * B); }, (sc.b + sc.l) * B);
        var m = typeof model !== 'undefined' && model[si];
        if (m && m.times) m.times.forEach(function (sheet) { if (sheet.start > p.at) next = Math.min(next, (sc.b + sheet.start) * B); });
        var key = si + ':' + pi + ':' + bi, asset = voiceAssets[clip.src];
        var duration = asset && asset.status === 'decoded' ? asset.decodedDurationSeconds : clip.durationSeconds;
        events.push({ key: key, scene: sc, sceneIndex: si, panel: p, balloon: bi, clip: clip, start: start, end: start + duration + (voiceShifts[key] || 0), slotEnd: next });
      }); }); });
      events.sort(function (a, b) { return a.start - b.start || a.sceneIndex - b.sceneIndex || a.balloon - b.balloon; });
      events.forEach(function (event) { writtenStarts.forEach(function (start) { if (start > event.start) event.slotEnd = Math.min(event.slotEnd, start); }); });
      return events;
    }
    function validVoice(event) {
      var c = event.clip, reason = '';
      if (!c || typeof c.id !== 'string' || !c.id || typeof c.src !== 'string' || !c.src || typeof c.provider !== 'string' || !c.provider || typeof c.characterId !== 'string' || !c.characterId || !isFinite(c.durationSeconds) || typeof c.durationSeconds !== 'number' || c.durationSeconds <= 0 || (c.gain != null && (typeof c.gain !== 'number' || !isFinite(c.gain) || c.gain < 0 || c.gain > 1))) reason = 'invalid metadata';
      else { try { var u = new URL(c.src, document.baseURI), base = new URL(document.baseURI); if (!((u.protocol === 'file:' && base.protocol === 'file:') || ((u.protocol === 'http:' || u.protocol === 'https:') && u.origin === base.origin))) reason = 'nonlocal playback asset'; } catch (e) { reason = 'invalid playback URL'; } }
      if (!reason && event.end > event.slotEnd + 0.02) reason = 'recording exceeds current reading window';
      if (reason) { voiceIssue(c && c.id || event.key, reason, { start: event.start, end: event.end, slotEnd: event.slotEnd, availableSeconds: Math.max(0, event.slotEnd - event.start) }); return false; }
      return true;
    }
    function duckVoice(value) {
      if (value === voiceDuck) return; voiceDuck = value;
      if (roomBus) roomBus.gain.setTargetAtTime(0.35 * (value < 1 ? 0.75 : 1), ctx.currentTime, 0.10);
      if (musicGain && routed) musicGain.gain.setTargetAtTime(Math.max(0, lastLvl) * value, ctx.currentTime, 0.08);
      else if (audio) audio.volume = clamp(Math.max(0, lastLvl) * value * 0.85 * OUTPUT_HEADROOM, 0, 1);
    }
    function voiceEnvelope(gain, level, remaining) {
      var now = ctx.currentTime, end = now + remaining;
      var attack = Math.min(SPEECH_ATTACK_SECONDS, remaining * 0.5), release = Math.min(SPEECH_RELEASE_SECONDS, remaining * 0.5);
      gain.gain.cancelScheduledValues(now); gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(level, now + attack);
      gain.gain.setValueAtTime(level, Math.max(now + attack, end - release));
      gain.gain.linearRampToValueAtTime(0, end);
      return { attackSeconds: attack, releaseSeconds: release, startsAt: now, releaseAt: Math.max(now + attack, end - release), endsAt: end };
    }
    function scheduledVoiceGain(active) {
      var e = active.envelope, t = ctx.currentTime;
      if (t <= e.startsAt || t >= e.endsAt) return 0;
      if (t < e.startsAt + e.attackSeconds) return active.clipGain * (t - e.startsAt) / e.attackSeconds;
      if (t > e.releaseAt) return active.clipGain * (e.endsAt - t) / e.releaseSeconds;
      return active.clipGain;
    }
    function stopVoice() {
      var old = voiceActive; voiceActive = null;
      if (old) { old.node.onended = null; old.gain.gain.cancelScheduledValues(ctx.currentTime); old.gain.gain.setValueAtTime(0, ctx.currentTime); try { old.node.stop(); } catch (e) {} if (old.node.disconnect) old.node.disconnect(); if (old.gain.disconnect) old.gain.disconnect(); }
      duckVoice(1);
    }
    function canVoice() { return !disposed && ctx && ctx.state === 'running' && audioLive && !muted && !userPaused && !document.hidden && !voiceQuiet; }
    function queueVoice(event) {
      if (!validVoice(event) || voiceAssets[event.clip.src]) return;
      var state = voiceAssets[event.clip.src] = { status: 'queued', src: event.clip.src, declaredDurationSeconds: event.clip.durationSeconds };
      state.ready = new Promise(function (resolve) { state.resolveReady = resolve; });
      voiceQueue.push({ event: event, state: state }); pumpVoices();
    }
    function pumpVoices() {
      if (disposed || !ctx || ctx.state === 'closed') return;
      while (voiceBusy < 3 && voiceQueue.length) (function (job) {
        voiceBusy++; var state = job.state; state.status = 'loading';
        var abort = typeof AbortController !== 'undefined' ? new AbortController() : null;
        var done = false, load, timer;
        function finish() { if (done) return; done = true; clearTimeout(timer); voiceBusy--; if (state.resolveReady) { state.resolveReady(); state.resolveReady = null; } var i = voiceLoads.indexOf(load); if (i >= 0) voiceLoads.splice(i, 1); pumpVoices(); }
        timer = setTimeout(function () { if (state.status === 'loading') { state.status = 'load-timeout'; if (abort) abort.abort(); finish(); } }, 8000);
        load = { state: state, abort: abort, timer: timer, finish: finish }; voiceLoads.push(load);
        Promise.resolve().then(function () { if (typeof fetch !== 'function') throw new Error('local speech fetch unavailable'); return fetch(new URL(state.src, document.baseURI).href, abort ? { signal: abort.signal } : {}); }).then(function (response) { if (!response.ok) throw new Error('speech asset HTTP failure'); return response.arrayBuffer(); }).then(function (bytes) { if (disposed || state.status !== 'loading') throw new Error('cancelled speech decode'); return ctx.decodeAudioData(bytes); }).then(function (decoded) {
          if (disposed || ctx.state === 'closed' || state.status !== 'loading') return;
          state.decodedDurationSeconds = decoded.duration;
          if (!isFinite(decoded.duration) || decoded.duration <= 0 || Math.abs(decoded.duration - state.declaredDurationSeconds) > Math.max(0.15, state.declaredDurationSeconds * 0.03)) { state.status = 'duration-mismatch'; voiceIssue(job.event.clip.id, 'decoded duration mismatch', { declared: state.declaredDurationSeconds, decoded: decoded.duration }); return; }
          state.buffer = decoded; state.status = 'decoded'; syncVoice(voiceT, false);
        }).catch(function (error) { if (state.status === 'loading') { state.status = 'load-error'; state.error = String(error); } }).finally(finish);
      })(voiceQueue.shift());
    }
    function syncVoice(t, jumped) {
      if (disposed || !ctx || t == null) return; voiceT = t;
      var previousTime = voiceLastTime; voiceLastTime = t;
      if (jumped) { stopVoice(); voiceEnded = ''; voiceNatural = {}; voiceShifts = {}; }
      var events = voiceEvents(), si = sceneAt(t), target = null;
      events.forEach(function (event) { if (event.sceneIndex >= si && event.sceneIndex <= si + 1) queueVoice(event); if (event.sceneIndex === si && event.panel === focusedPanel && t >= event.start && t < event.end && validVoice(event)) target = event; });
      if (!jumped && target && (previousTime == null || previousTime < target.start)) voiceNatural[target.key] = true;
      if (!canVoice() || !target) { stopVoice(); return; }
      var asset = voiceAssets[target.clip.src];
      if (!asset || asset.status !== 'decoded' || voiceEnded === target.key) { stopVoice(); return; }
      if (voiceActive && voiceActive.key === target.key) return;
      stopVoice();
      var natural = voiceNatural[target.key], shift = voiceShifts[target.key];
      var offset = natural && shift == null ? 0 : Math.max(0, t - target.start - (shift || 0));
      var remaining = target.slotEnd - t, duration = asset.buffer.duration - offset;
      if (offset >= asset.buffer.duration || remaining <= 0) return;
      if (duration > remaining + 0.002) { voiceIssue(target.clip.id, 'decoded recording exceeds remaining reading window', { remainingSeconds: remaining, neededSeconds: duration }); return; }
      if (natural && shift == null) voiceShifts[target.key] = Math.max(0, t - target.start);
      if (!voiceBus) { voiceBus = gainNode(SPEECH_BUS_LEVEL); voiceBus.connect(master); }
      var clipGain = target.clip.gain == null ? 1 : target.clip.gain;
      var node = ctx.createBufferSource(), gain = gainNode(0); node.buffer = asset.buffer; node.connect(gain); gain.connect(voiceBus);
      var envelope = voiceEnvelope(gain, clipGain, duration);
      var active = voiceActive = { key: target.key, id: target.clip.id, src: target.clip.src, provider: target.clip.provider, characterId: target.clip.characterId, start: target.start, offset: offset, startedAt: ctx.currentTime, durationSeconds: target.clip.durationSeconds, clipGain: clipGain, envelope: envelope, node: node, gain: gain };
      node.onended = function () { if (voiceActive !== active) return; voiceEnded = active.key; voiceActive = null; if (node.disconnect) node.disconnect(); if (gain.disconnect) gain.disconnect(); duckVoice(1); };
      try { node.start(ctx.currentTime, offset, duration); duckVoice(0.65); } catch (e) { voiceIssue(active.id, 'source start failed', String(e)); stopVoice(); }
    }
    function speechInfo() {
      var assets = {}; Object.keys(voiceAssets).forEach(function (src) { var a = voiceAssets[src]; assets[src] = { status: a.status, src: src, declaredDurationSeconds: a.declaredDurationSeconds, decodedDurationSeconds: a.decodedDurationSeconds, error: a.error || null }; });
      return { playing: !!voiceActive, current: voiceActive ? { id: voiceActive.id, src: voiceActive.src, provider: voiceActive.provider, characterId: voiceActive.characterId, offsetSeconds: voiceActive.offset + Math.max(0, ctx.currentTime - voiceActive.startedAt), durationSeconds: voiceActive.durationSeconds, clipGain: voiceActive.clipGain, speechBusLevel: SPEECH_BUS_LEVEL, envelope: voiceActive.envelope, scheduledClipGain: scheduledVoiceGain(voiceActive) } : null, busLevel: SPEECH_BUS_LEVEL, attackSeconds: SPEECH_ATTACK_SECONDS, releaseSeconds: SPEECH_RELEASE_SECONDS, musicDuck: voiceDuck, ambienceDuck: voiceDuck < 1 ? 0.75 : 1, assets: assets, issues: voiceIssues.slice(), pending: voiceQueue.length + voiceBusy };
    }
    // End optional speech scheduler.

    function disposeScore() {
      if (disposed) return; disposed = true; stopVoice();
      voiceQueue.forEach(function (job) { job.state.status = 'cancelled'; }); voiceQueue = []; voiceLoads.slice().forEach(function (load) { clearTimeout(load.timer); if (load.state.status === 'loading') load.state.status = 'cancelled'; if (load.abort) load.abort.abort(); load.finish(); });
      clearTimeout(meterTimer); meterTimer = 0; Array.prototype.forEach.call(bars, function (bar) { bar.style.setProperty('--level', '0.000'); }); tag.classList.remove('is-music-active');
      if (audio) audio.pause(); audioLive = false; waiting = false;
      roomLoads.forEach(function (load) { clearTimeout(load.timer); if (load.state.status === 'loading') load.state.status = 'fallback-cancelled'; if (load.abort) load.abort.abort(); });
      if (ctx) ctx.close().catch(function () {});
      if (document.removeEventListener) document.removeEventListener('astro:before-swap', disposeScore);
    }
    function init(prepareOnly) {
      if (disposed) return;
      if (!ctx) {
        try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
        master = gainNode(muted ? 0 : OUTPUT_HEADROOM);
        analyser = ctx.createAnalyser(); analyser.fftSize = 512; analyser.smoothingTimeConstant = 0.45;
        bins = new Uint8Array(analyser.frequencyBinCount);
        // Shared restrained tone shaping: media, rooms and cues enter the same master.
        var hp = filt('highpass', 35, 0.707), lowShelf = filt('lowshelf', 120), highShelf = filt('highshelf', 4500);
        lowShelf.gain.value = -2; highShelf.gain.value = -1.5;
        tone = { highpass: hp, lowShelf: lowShelf, highShelf: highShelf };
        master.connect(hp); hp.connect(lowShelf); lowShelf.connect(highShelf); highShelf.connect(analyser); analyser.connect(ctx.destination);
        roomBus = gainNode(0.35); roomBus.connect(master);
        musicGain = gainNode(SCORED ? 0 : 1); musicGain.connect(master);
        if (!meterTimer) meter();
        window.addEventListener('pagehide', function (e) { if (!e.persisted) disposeScore(); });
        document.addEventListener('astro:before-swap', disposeScore);
      }
      if (audio && !routed) { try { ctx.createMediaElementSource(audio).connect(musicGain); routed = true; } catch (e) { routed = false; } }
      // Muted autoplay may have created a suspended context. Retry inside the next sound gesture.
      if (!prepareOnly && !muted && !userPaused && !document.hidden && ctx.state === 'suspended') ctx.resume().catch(function () {});
    }
    function prepareSpeech(t) {
      var si = sceneAt(t), events = voiceEvents().filter(function (event) { return event.sceneIndex >= si && event.sceneIndex <= si + 1; });
      if (disposed || !events.length) return Promise.resolve();
      init(true); if (!ctx) return Promise.resolve();
      events.forEach(queueVoice);
      return Promise.all(events.map(function (event) { var asset = voiceAssets[event.clip.src]; return asset && asset.ready || Promise.resolve(); }));
    }
    // The song's level at story beat bt: the scene's score, faded in over its first two beats from the previous scene's.
    function level(bt) {
      var k = 0; for (var i = 0; i < scenes.length; i++) if (bt >= scenes[i].b) k = i;
      if (bt >= story.next.b && story.next.sound) {
        var end = scenes[scenes.length - 1].score || 0, close = story.next.sound;
        return end + (clamp(close.score, 0, 1) - end) * c01((bt - story.next.b) / clamp(close.fadeBeats || 1.5, 0.25, 1.5));
      }
      var cur = scenes[k].score || 0, prev = k ? scenes[k - 1].score || 0 : 0;
      return prev + (cur - prev) * c01((bt - scenes[k].b) / 2);
    }
    // Resolve the same responsive sheet and revealed box as the reader, not a hidden earlier phone box.
    // A held story keeps its focused environment; loops continue until pause/mute/visibility suspends the mix.
    function ambientFocus(t, si) {
      focusedPanel = null;
      if (si >= scenes.length) return { scene: 'next', panel: null, sheet: null, room: story.next.sound ? story.next.sound.room || 'none' : lastRoom || 'none', source: story.next.sound ? 'next' : 'legacy' };
      var sc = scenes[si], local = t / B - sc.b, holds = sc.hold || [], active = null, sheet = null;
      for (var h = 0; h < holds.length; h++) if (local >= holds[h][0] && local < holds[h][1]) { local = holds[h][0]; break; }
      var candidates = sc.panels, m = typeof model !== 'undefined' && model[si];
      if (m && m.times && m.times.length) { sheet = sheetAt(m, local); candidates = m.times[sheet].panels.map(function (o) { return o.d; }); }
      candidates.forEach(function (p) { if (p.at <= local && (!active || p.at >= active.at)) active = p; });
      var valid = function (r) { return ['none', 'office', 'servers', 'street', 'rain'].indexOf(r) >= 0; };
      var override = active && active.room != null && valid(active.room);
      focusedPanel = active;
      return { scene: sc.id || String(si), panel: active ? active.img || active.id || null : null, sheet: sheet,
        room: override ? active.room : valid(sc.room) ? sc.room : 'none', source: override ? 'panel' : 'scene' };
    }
    function update(t, jumped, quietCue) {
      if (disposed || !SCORED || !audioLive) return;
      if (!ctx) init(); if (!ctx) return;
      voiceQuiet = !!quietCue; voiceT = t;
      var bt = t / B, lv = level(story.next.sound ? bt : Math.min(bt, story.next.b - 0.01));
      if (Math.abs(lv - lastLvl) > 0.004) {
        lastLvl = lv;
        if (routed) musicGain.gain.setTargetAtTime(lv * voiceDuck, ctx.currentTime, 0.08); else if (audio) audio.volume = clamp(lv * voiceDuck * 0.85 * OUTPUT_HEADROOM, 0, 1);
      }
      var si = sceneAt(t); roomFocus = ambientFocus(t, si); var room = roomFocus.room;
      if (room !== lastRoom) {
        Object.keys(rooms).forEach(function (n) { rooms[n].gain.setTargetAtTime(0, ctx.currentTime, 0.6); });
        if (room !== 'none') { rooms[room] = rooms[room] || makeRoom(room); rooms[room].gain.setTargetAtTime(1, ctx.currentTime, 0.6); }
        lastRoom = room;
      }
      syncVoice(t, !!jumped);
      // Score and rooms follow a seek immediately. Only its current panel may sound, never skipped panels.
      var canSound = !quietCue && !muted && !userPaused && !document.hidden && ctx.state === 'running';
      if (jumped) {
        lastBt = bt;
        if (canSound && si < scenes.length) {
          var active = focusedPanel;
          if (active) (active.sfx || []).forEach(function (f) { if (!(f.delay > 0) && FX[f.kind]) emit(f); });
        }
        return;
      }
      // Natural playback crosses cue beats. Muted, paused, hidden and blocked sound advances no event backlog.
      if (canSound && lastBt != null && bt > lastBt && bt - lastBt < 1) {
        scenes.forEach(function (sc) {
          if (sc.b > bt || sc.b + sc.l < lastBt) return;
          sc.panels.forEach(function (p) {
            (p.sfx || []).forEach(function (f) {
              var at = sc.b + p.at + (f.delay || 0);
              if (at > lastBt && at <= bt && FX[f.kind]) emit(f);
            });
          });
        });
      }
      lastBt = bt;
    }
    function emit(f) { fired.push(f.kind); var g = gainNode(clamp(f.gain == null ? 0.7 : f.gain, 0, 1)); g.connect(master); try { FX[f.kind](ctx.currentTime + 0.01, g); } catch (e) {} }
    function seek(t, quietCue) { init(); update(t, true, quietCue); }
    function setMute(mm) { if (mm) stopVoice(); if (master) master.gain.setTargetAtTime(mm ? 0 : OUTPUT_HEADROOM, ctx.currentTime, 0.05); }
    function pause(pz) { if (!ctx) return; lastBt = null; if (pz) stopVoice(); if (pz) ctx.suspend().catch(function () {}); else ctx.resume().catch(function () {}); }
    return { info: function () { return { scored: SCORED, ctx: ctx ? ctx.state : null, routed: routed, headroom: OUTPUT_HEADROOM, masterGain: master ? master.gain.value : null, buses: { music: musicGain ? musicGain.gain.value : null, room: roomBus ? roomBus.gain.value : null, voice: voiceBus ? voiceBus.gain.value : null, roomEnvelopes: Object.keys(rooms).map(function (name) { return { name: name, gain: rooms[name].gain.value }; }) }, level: +lastLvl.toFixed(3), room: lastRoom, focus: roomFocus, roomAssets: roomAssets, speech: speechInfo(), eq: tone ? { highpassHz: tone.highpass.frequency.value, highpassQ: tone.highpass.Q.value, lowShelfHz: tone.lowShelf.frequency.value, lowShelfDb: tone.lowShelf.gain.value, highShelfHz: tone.highShelf.frequency.value, highShelfDb: tone.highShelf.gain.value } : null, fired: fired.slice(-12) }; }, outputGain: function () { return routed && musicGain ? clamp(musicGain.gain.value, 0, 1) * clamp(master.gain.value, 0, 1) : 1; }, init: init, prepare: prepareSpeech, update: update, seek: seek, setMute: setMute, pause: pause, play: function (k) { init(); if (ctx && FX[k]) { var g = gainNode(0.7); g.connect(master); FX[k](ctx.currentTime + 0.01, g); } } };
  })();
  function startMusic() {
    if (hold || userPaused || state === 'done') return;
    if (audioLive) { score.init(); return; }
    if (!audio) {
      audio = audioPre || new Audio(music.src); audio.preload = 'auto';
      // The music plays on under the NEXT page and into the site; the story itself holds.
      // The song file ended (a story within one pass, or its tail): go round the loop region, on its downbeat.
      audio.addEventListener('ended', function () { audio.currentTime = music.offset + (LOOP ? LOOP.from : 0) * B; audio.play().catch(function () {}); });
      audio.addEventListener('loadedmetadata', function () {
        var songBeats = (audio.duration - music.offset) / B;
        if (!LOOP && isFinite(songBeats) && story.beats > songBeats - 0.5) { var to = Math.floor(songBeats / 16) * 16; if (to >= 16) LOOP = { from: 0, to: to }; }
      });
    }
    audio.muted = muted; audio.volume = mixIn ? 0 : 0.85;
    try { audio.currentTime = songTime(clockTime()); lastSB = clockTime() / B; } catch (e) {}
    // Unlock Web Audio synchronously in the gesture, before the asynchronous media play result.
    score.init();
    var pr = audio.play();
    function ok() {
      var st = held ? END_T : Math.max(0, now() - t0);
      if (state === 'play' && !held && !REDUCED && Math.abs(audio.currentTime - songTime(st)) > 0.08) { try { audio.currentTime = songTime(st); } catch (e) {} lastSB = st / B; }
      audioLive = true; waiting = false; tag.classList.remove('is-waiting'); mixSet({ unlocked: true, track: music.credit });
      score.init(); score.seek(T);
      siteBlocked(false); if (!muted) siteSound(true);
      if (mixIn) { mixIn = false; ramp(audio, 0, 0.85, XF, EQ_IN); playTail(); }
      clearTimeout(foldTimer); foldTimer = setTimeout(function () { tag.classList.remove('is-open'); }, 10000);
    }
    if (pr && pr.then) pr.then(ok, function () { if (audioLive) return; waiting = true; tag.classList.add('is-waiting', 'is-open'); siteBlocked(true); }); else ok();
  }
  var gestureStarted = false;
  function onFirstGesture(e) {
    // Sound buttons own their click. Unlocking on their pointerdown can turn that later click into a mute.
    if (e && e.target && e.target.closest && e.target.closest('.cs-next, .rl-pause, .rl-prev, .rl-next, [data-motion-progress], .cs-tag__mute, [data-sound-toggle]')) return;
    if (!muted) { if (!audioLive) gestureStarted = true; startMusic(); }
  }
  ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'].forEach(function (ev) { window.addEventListener(ev, onFirstGesture, { capture: true, passive: true }); });
  function setMuted(mm) {
    muted = mm; siteSound(!mm);
    if (audio) audio.muted = mm;
    score.setMute(mm);
    tag.classList.toggle('is-muted', mm);
    muteBtn.setAttribute('aria-pressed', mm ? 'true' : 'false');
    muteBtn.setAttribute('aria-label', mm ? 'Unmute music' : 'Mute music');
    if (!mm) startMusic();
  }
  window.addEventListener('mtw-sound', function (e) { var on = !!(e.detail && e.detail.on); if (on) { if (muted) setMuted(false); else startMusic(); } else if (!muted) setMuted(true); });
  muteBtn.addEventListener('click', function () { if (waiting) { if (muted) setMuted(false); startMusic(); } else setMuted(!muted); });
  var foldTimer = setTimeout(function () { if (!waiting) tag.classList.remove('is-open'); }, 10000);
  var skip = stage.querySelector('.cs-skip');
  if (skip) { skip.addEventListener('click', collapse); setTimeout(function () { skip.classList.add('is-shown'); }, 1200); }
  var pauseBtn = stage.querySelector('.cs-pause'), pauseLabel = pauseBtn && pauseBtn.querySelector('.cs-pause__label');
  // The canonical motion toolbar (MotionToolbar.astro, public/scripts/motion-toolbar.js) owns Pause/Play: register with it.
  var TB = window.MTWToolbar;
  if (TB) TB.register({ beat: B, songTime: function () { return T; }, togglePause: function () { setPaused(!userPaused); }, prev: function () { goBox(-1); }, next: function () { goBox(1); } });
  var resumeAfterScrub = false;
  if (window.MTWProgress) progress = window.MTWProgress.mount(stage.querySelector('[data-motion-progress]'), {
    duration: END_T, seek: function (t) { seekTo(t, true); },
    start: function () { resumeAfterScrub = state === 'play' && !userPaused; if (resumeAfterScrub) setPaused(true); },
    end: function () { if (resumeAfterScrub) setPaused(false, true); resumeAfterScrub = false; }
  });
  function setPaused(pz, preserveBlockedSound) { // (also used by the view pause; the reader's Pause button sets userPaused through it too)
    if (pz === userPaused || (state !== 'play' && state !== 'paused')) return;
    if (pz) T = clockTime();
    userPaused = pz; score.pause(pz);
    if (pz) { state = 'paused'; pausedAt = now(); if (raf) { cancelAnimationFrame(raf); raf = 0; } if (audio) audio.pause(); }
    else {
      state = 'play'; t0 = now() - T;
      if (audioLive && audio) { if (!held) { try { audio.currentTime = songTime(T); } catch (e) {} lastSB = T / B; } audio.play().catch(function () {}); }
      else if (!preserveBlockedSound) startMusic();
      if (!raf) raf = requestAnimationFrame(frame);
    }
    tag.classList.toggle('is-paused', pz);
    if (pauseBtn) { pauseBtn.classList.toggle('is-paused', pz); if (pauseLabel) pauseLabel.textContent = pz ? 'Play' : 'Pause'; }
    if (TB) TB.setPaused(pz);
  }
  if (pauseBtn) { pauseBtn.addEventListener('click', function () { setPaused(!userPaused); }); setTimeout(function () { pauseBtn.classList.add('is-shown'); }, 1200); }
  // The page transition can clear the reveal gate while the comic still owns the screen: hold it again.
  new MutationObserver(function () {
    if (APP) return; // standalone: no scroll reveal to hold
    if ((state === 'play' || state === 'paused' || state === 'hold') && !root.hasAttribute('data-mtw-reveal')) root.setAttribute('data-mtw-reveal', '');
  }).observe(root, { attributes: true, attributeFilter: ['data-mtw-reveal'] });

  /* ---------- Turning pages ---------- */
  function seekTo(t, quietCue) {
    T = clamp(t, 0, END_T); held = !REDUCED && T >= END_T; t0 = now() - T; lastSB = T / B;
    if (audioLive && audio) { try { audio.currentTime = songTime(Math.min(T, END_T)); } catch (e) {} }
    phoneScrollForce = true; render(T); score.seek(T, quietCue);
    if (state === 'play' && !raf && !held) raf = requestAnimationFrame(frame);
  }
  function goScene(k) { var st = stops(); seekTo(st[clamp(k < 0 ? st.length + k : k, 0, st.length - 1)]); }
  function go(dir) {
    if (state !== 'play' && state !== 'paused' && state !== 'hold') return;
    var cur = state === 'play' ? clockTime() : T, st = stops(), i = -1;
    for (var k = 0; k < st.length; k++) if (st[k] <= cur + 0.05) i = k;
    var target = dir > 0 ? i + 1 : (i >= 0 && cur - st[i] > 1.5 * B ? i : i - 1);
    seekTo(st[clamp(target, 0, st.length - 1)]);
    hint.classList.remove('is-on');
  }
  // Box by box (Matt, 2026-09-28: "allow the user to click forward into them"): a click on a box jumps to it (every box
  // before it revealed, its balloons replayed); a click anywhere else, or ArrowRight, reveals the next box.
  function boxStops() {
    var out = [];
    model.forEach(function (m) {
      m.times.forEach(function (x) { out.push((m.d.b + x.start) * B + 0.02); x.panels.forEach(function (o) { out.push((m.d.b + o.d.at) * B + 0.000001); }); });
    });
    out.push(REDUCED ? END_T : NEXT_T);
    return out.sort(function (a, b) { return a - b; }).filter(function (v, i, a) { return !i || v - a[i - 1] > 0.05; });
  }
  function goBox(dir) {
    if (REDUCED) { go(dir); return; }
    var cur = state === 'play' ? clockTime() : T, st = boxStops(), i = -1;
    for (var k = 0; k < st.length; k++) if (st[k] <= cur + 0.05) i = k;
    seekTo(st[clamp(dir > 0 ? i + 1 : i - 1, 0, st.length - 1)]);
    hint.classList.remove('is-on');
  }
  function jumpToBox(pe) {
    var m = model[+pe.dataset.scene], o = m && m.panels[+pe.dataset.box]; if (!o) return;
    // Land just inside the authored reveal beat so media, room and cues focus the clicked box.
    seekTo((m.d.b + o.d.at) * B + 0.000001);
    hint.classList.remove('is-on');
  }
  stage.addEventListener('click', function (e) {
    if (e.target === issuesEl) { closeIssues(); return; }
    if (e.target.closest('.cs-strip, .rl-dock, .rl-tl, .cs-issues, .cs-next a, a, button')) return;
    if (state !== 'play' && state !== 'paused') return;
    var pe = e.target.closest && e.target.closest('.cs-panel');
    // A box click owns its destination even while the first sound gesture is unlocking media.
    if (!pe && gestureStarted && !audioLive) { gestureStarted = false; return; }
    if (!pe && gestureStarted && audioLive && performance.now() - firstGestureAt < 400) { gestureStarted = false; return; }
    gestureStarted = false;
    if (pe && !REDUCED) jumpToBox(pe); else goBox(1);
  });
  var firstGestureAt = 0;
  window.addEventListener('pointerdown', function () { if (!firstGestureAt) firstGestureAt = performance.now(); }, { capture: true, passive: true });

  /* ---------- Folding into the page ---------- */
  function restingRect(target) {
    var r = target.getBoundingClientRect(), cs = getComputedStyle(target), tf = cs.transform, tr = cs.translate;
    var dx = 0, dy = 0, sc = 1;
    if (tf && tf !== 'none' && window.DOMMatrixReadOnly) { var mm = new DOMMatrixReadOnly(tf); sc = mm.a || 1; dx = mm.m41; dy = mm.m42; }
    if (tr && tr !== 'none') { var pr = tr.split(' '); dx += parseFloat(pr[0]) || 0; dy += parseFloat(pr[1]) || 0; }
    var w = r.width / sc, h = r.height / sc, cx = r.left + r.width / 2 - dx, cy = r.top + r.height / 2 - dy;
    return { left: cx - w / 2, right: cx + w / 2, top: cy - h / 2, bottom: cy + h / 2 };
  }
  var collapseEnd = 0;
  function collapse() {
    if (APP || (state !== 'play' && state !== 'paused')) return;
    if (state === 'play') T = clockTime();
    if (userPaused) { userPaused = false; score.pause(false); tag.classList.remove('is-paused'); if (audioLive && audio) audio.play().catch(function () {}); }
    state = 'collapsing';
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    tag.classList.add('cs-tag--page'); document.body.appendChild(tag);
    if (window.scrollY) window.scrollTo(0, 0);
    var sr = stage.getBoundingClientRect(), W = sr.width, H = sr.height;
    var target = document.querySelector(story.collapseTo || '.home-intro');
    var r0 = target ? restingRect(target) : { left: W * 0.55, top: H * 0.3, right: W * 0.9, bottom: H * 0.7 };
    var r = { left: r0.left - sr.left, right: r0.right - sr.left, top: r0.top - sr.top, bottom: r0.bottom - sr.top };
    var inset = [Math.max(0, r.top), Math.max(0, W - r.right), Math.max(0, H - r.bottom), Math.max(0, r.left)];
    stage.classList.add('is-collapsing');
    var inner = [view, mast, titleEl, nextEl, hint];
    var start = now(), FOLD = 0.9, released = false, handAt = 0, MAX_HOLD = 4;
    collapseEnd = performance.now() + (FOLD + 1.5) * 1000;
    (function step() {
      var e = now() - start, k = inOut(e / FOLD), fade = c01(e / 0.35);
      inner.forEach(function (x) { x.style.opacity = String(1 - fade); });
      var box = inset.map(function (v2) { return (v2 * k).toFixed(1) + 'px'; }).join(' ');
      var clip = 'inset(' + box + ' round ' + (4 * k).toFixed(1) + 'px)';
      stage.style.clipPath = clip; stage.style.webkitClipPath = clip;
      if (!released && e > 0.42) { released = true; root.removeAttribute('data-mtw-reveal'); }
      if (!handAt && e >= FOLD && (!target || target.classList.contains('is-revealed') || e > FOLD + MAX_HOLD)) handAt = e;
      var h = handAt ? c01((e - handAt) / 0.5) : 0;
      stage.style.opacity = (1 - h).toFixed(3);
      if (h < 1) requestAnimationFrame(step); else finish();
    })();
  }
  function finish() { state = 'done'; root.setAttribute('data-comic', 'done'); root.removeAttribute('data-mtw-reveal'); window.scrollTo(0, 0); }

  /* ---------- Immersive chrome: controls hide after 2 s without the pointer ---------- */
  var chromeTimer = 0;
  function chromeIdle() {
    var a = document.activeElement, busy = issuesOpen() || waiting || (a && a.closest && a.closest('.cs-dock, .cs-bar'));
    if (busy) { chromeTimer = setTimeout(chromeIdle, 2000); return; }
    stage.setAttribute('data-chrome', 'hidden');
  }
  function showChrome() {
    if (stage.hasAttribute('data-chrome')) stage.removeAttribute('data-chrome');
    clearTimeout(chromeTimer); chromeTimer = setTimeout(chromeIdle, 2000);
  }
  ['pointermove', 'pointerdown', 'keydown', 'focusin', 'touchstart'].forEach(function (ev) { stage.addEventListener(ev, showChrome, { passive: true }); });
  window.addEventListener('keydown', showChrome, { passive: true });

  /* ---------- Issues: the overlay, and the previous and next issue ---------- */
  var issuesEl = stage.querySelector('.cs-issues'), issuesOpeners = stage.querySelectorAll('.cs-issues-open'), issuesFrom = null, autoPaused = false;
  function issuesOpen() { return !!issuesEl && !issuesEl.hidden; }
  function openIssues(from) {
    if (!issuesEl || issuesOpen()) return;
    issuesFrom = from || document.activeElement;
    issuesEl.hidden = false; stage.setAttribute('data-issues', 'open');
    autoPaused = false;
    if (!userPaused && state === 'play' && !REDUCED) { setPaused(true); autoPaused = true; }
    var cur = issuesEl.querySelector('[aria-current="page"]') || issuesEl.querySelector('a');
    if (cur) cur.focus({ preventScroll: true });
    hint.classList.remove('is-on');
  }
  function closeIssues() {
    if (!issuesOpen()) return;
    issuesEl.hidden = true; stage.removeAttribute('data-issues');
    if (autoPaused) { autoPaused = false; setPaused(false); }
    if (issuesFrom && issuesFrom.focus) issuesFrom.focus({ preventScroll: true });
  }
  Array.prototype.forEach.call(issuesOpeners, function (b) {
    b.addEventListener('click', function (e) { e.stopPropagation(); openIssues(b); });
    if (!APP) setTimeout(function () { b.classList.add('is-shown'); }, 1200);
  });
  if (issuesEl) {
    var closeBtn = issuesEl.querySelector('.cs-issues__close');
    if (closeBtn) closeBtn.addEventListener('click', closeIssues);
    // Keep focus inside the open dialog.
    issuesEl.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = issuesEl.querySelectorAll('a[href], button'), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }
  // A real link, so the page transition covers the change and the mixtape crossfades the music.
  function stepIssue(dir) {
    var a = stage.querySelector('[data-issue-step="' + (dir > 0 ? 'next' : 'prev') + '"]');
    if (a) a.click(); else if (cfg[dir > 0 ? 'next' : 'prev']) location.assign(cfg[dir > 0 ? 'next' : 'prev']);
  }
  function atNext() { return sceneAt(T) >= scenes.length; }

  /* ---------- Input: scrolling enters the site (standalone: turns pages); taps and arrows turn pages ---------- */
  var KEYS = { ArrowDown: 1, PageDown: 1, ' ': 1, Spacebar: 1, End: 1, ArrowUp: 1, PageUp: 1, Home: 1, Escape: 1 };
  var lastWheel = 0;
  function owning() { return (state === 'play' || state === 'paused') && !(window.MTWToolbar && window.MTWToolbar.isOpen()); }
  function onWheel(e) {
    var t = performance.now(), quiet = t - lastWheel > 220; lastWheel = t;
    if (issuesOpen()) { var pnl = issuesEl.querySelector('.cs-issues__panel'); if (!(e.target.closest && e.target.closest('.cs-issues__panel') && pnl.scrollHeight > pnl.clientHeight + 2)) e.preventDefault(); return; }
    if (stage.getAttribute('data-phone-scroll') === 'true' && e.target.closest && e.target.closest('.cs-view')) return;
    if (APP) {
      // The comic sits in the page, the MTW footer below it (Matt, 2026-09-28): wheel over the comic turns pages; once the
      // NEXT page is showing, scrolling down carries on to the footer, and a page scrolled away scrolls back natively.
      if (!(e.target.closest && e.target.closest('[data-comic-stage]')) || window.scrollY > 2) return;
      if (atNext() && e.deltaY > 0) return;
      e.preventDefault();
      // One gesture, one page: act on the first event after a quiet gap (trackpad inertia is one gesture).
      if (quiet && Math.abs(e.deltaY) >= 4 && (state === 'play' || state === 'paused')) go(e.deltaY > 0 ? 1 : -1);
      return;
    }
    // A -b page scrolls normally past its comic header (Matt, 2026-09-28: "it will be the header").
  }
  var SWIPE = 12, touch0 = null;
  window.addEventListener('touchstart', function (e) { var p = e.touches[0]; touch0 = p ? [p.clientX, p.clientY] : null; }, { passive: true });
  function onTouch(e) {
    if (issuesOpen()) { if (!(e.target.closest && e.target.closest('.cs-issues__panel'))) e.preventDefault(); return; }
    if (owning()) {
      var p = e.touches[0], dx = touch0 && p ? p.clientX - touch0[0] : 0, dy = touch0 && p ? p.clientY - touch0[1] : 0;
      var sideways = Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5;
      if (!sideways && stage.getAttribute('data-phone-scroll') === 'true' && e.target.closest && e.target.closest('.cs-view')) return;
      // On the NEXT page a sideways swipe changes issue; its choice list may scroll vertically on a phone.
      if (sideways && atNext()) { e.preventDefault(); touch0 = null; stepIssue(dx < 0 ? 1 : -1); return; }
      if (APP && (window.scrollY > 2 || (atNext() && dy < 0))) return; // native scroll to and from the footer
      if (!APP && !sideways) return; // a -b page scrolls vertically as usual; only a sideways swipe turns the comic's page
      e.preventDefault();
      if (!touch0 || !p) return;
      if (sideways) { touch0 = null; go(dx < 0 ? 1 : -1); return; } // a sideways swipe turns the page
      if (APP) { if (Math.abs(dy) > 40 && Math.abs(dy) > Math.abs(dx) * 1.5) { touch0 = null; go(dy < 0 ? 1 : -1); } return; } // swipe up: next page
    }
  }
  function onKey(e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || !owning()) return;
    showChrome();
    var tn = (e.target && e.target.tagName) || '';
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tn)) return;
    if (issuesOpen()) { if (e.key === 'Escape') { e.preventDefault(); closeIssues(); } return; }
    if (stage.getAttribute('data-phone-scroll') === 'true' && e.target.closest && e.target.closest('.cs-view') && /^(ArrowDown|ArrowUp|PageDown|PageUp|Home|End| |Spacebar)$/.test(e.key)) return;
    if (e.key === ']' || (APP && e.key === 'PageDown')) { e.preventDefault(); stepIssue(1); return; }
    if (e.key === '[' || (APP && e.key === 'PageUp')) { e.preventDefault(); stepIssue(-1); return; }
    if ((e.key === 'i' || e.key === 'I') && issuesEl) { e.preventDefault(); openIssues(); return; }
    var sr = stage.getBoundingClientRect();
    if (sr.bottom < sr.height * 0.5 || sr.top > window.innerHeight * 0.5) return; // keys belong to the comic only while it is in view
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('cs-panel')) { e.preventDefault(); jumpToBox(e.target); return; }
    // ArrowRight and ArrowLeft move box by box; with Shift, scene by scene.
    if (e.key === 'ArrowRight') { e.preventDefault(); if (e.shiftKey) go(1); else goBox(1); return; }
    if (e.key === 'ArrowLeft') { e.preventDefault(); if (e.shiftKey) go(-1); else goBox(-1); return; }
    if (APP) {
      // Keys turn pages while the comic is in view; End (or Space and ArrowDown on the NEXT page) scroll on to the footer.
      if (window.scrollY > 40) return;
      var onControl = tn === 'BUTTON' || tn === 'A', down = e.key === 'ArrowDown' || ((e.key === ' ' || e.key === 'Spacebar') && !onControl);
      if (down && !atNext()) { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); go(-1); }
      else if (e.key === 'Home') { e.preventDefault(); goScene(0); window.scrollTo(0, 0); }
      return;
    }
  }
  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchmove', onTouch, { passive: false });
  window.addEventListener('keydown', onKey);
  // Out of view, the comic rests: its reveal clock and music pause, and resume when it is back (Matt, 2026-09-28).
  var outOfView = false, viewPaused = false;
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) {
    var out = es[0].intersectionRatio < 0.35;
    if (out === outOfView) return; outOfView = out;
    if (out && !userPaused && state === 'play') { viewPaused = true; setPaused(true); }
    else if (!out && viewPaused) { viewPaused = false; setPaused(false); }
  }, { threshold: [0, 0.35, 0.6] }).observe(stage);
  document.addEventListener('visibilitychange', function () {
    if (userPaused) return;
    score.pause(document.hidden); // Room loops must rest with the media element too.
    if (audioLive && audio && (state !== 'play' || held)) { if (document.hidden) audio.pause(); else audio.play().catch(function () {}); return; }
    if (state !== 'play') return;
    if (document.hidden) { T = clockTime(); if (audio) audio.pause(); }
    else { if (held) return; t0 = now() - T; if (audioLive && audio) { audio.currentTime = songTime(T); lastSB = T / B; audio.play().catch(function () {}); } if (!raf) raf = requestAnimationFrame(frame); }
  });
  var rsz = 0;
  window.addEventListener('resize', function () { clearTimeout(rsz); rsz = setTimeout(function () { if (owning() || state === 'hold') { measure(); render(T); } }, 80); });

  /* ---------- The mixtape: a DJ crossfade across page changes (as the Beat Comics) ---------- */
  var XF = 4;
  function ramp(a, from, to, secs, shape, done) { var r0 = now(); (function step() { var k = c01((now() - r0) / secs); a.volume = clamp(from + (to - from) * shape(k), 0, 1); if (k < 1) requestAnimationFrame(step); else if (done) done(); })(); }
  var EQ_IN = function (k) { return Math.sin(k * Math.PI / 2); }, EQ_OUT = function (k) { return 1 - Math.cos(k * Math.PI / 2); };
  new MutationObserver(function () {
    if (!root.hasAttribute('data-mtw-leaving') || !audio || audio.paused) return;
    // The tail plays outside this page's Web Audio graph: retain the audible score/master level.
    var tailVolume = audio.volume * score.outputGain() * 0.6;
    if (!muted) mixSet({ tail: tailVolume > 0.0001 ? { src: music.src, t: audio.currentTime, at: Date.now(), vol: tailVolume } : null });
    ramp(audio, audio.volume, audio.volume * 0.6, 0.6, EQ_IN);
  }).observe(root, { attributes: true, attributeFilter: ['data-mtw-leaving'] });
  var mixIn = false;
  function playTail() {
    var tl = mixGet().tail; mixSet({ tail: null });
    if (!tl || muted || tl.src === music.src || Date.now() - tl.at > 8000) return;
    var a = new Audio(tl.src); a.volume = tl.vol;
    try { a.currentTime = tl.t + (Date.now() - tl.at) / 1000; } catch (e) {}
    var pr = a.play(), gogo = function () { ramp(a, tl.vol, 0, XF, EQ_OUT, function () { a.pause(); }); };
    if (pr && pr.then) pr.then(gogo, function () {}); else gogo();
  }

  /* ---------- Start ---------- */
  function arriving() { var l = document.querySelector('.page-transition'); return root.hasAttribute('data-mtw-nav') && !(l && l.dataset.phase === 'reveal'); }
  function begin() {
    if (state !== 'play') return;
    mixIn = !!mixGet().tail;
    T = seek0; t0 = now() - T;
    raf = requestAnimationFrame(frame);
    startMusic();
    setTimeout(function () { if (owning()) hint.classList.add('is-on'); }, 2500);
    setTimeout(function () { hint.classList.remove('is-on'); }, 11000);
  }
  // The preloader (Matt, 2026-09-29: "add a loader so you can preload all of these"): before the issue plays, the current
  // and next pages' art, the paper texture, the lettering fonts and enough of the song to start. Honest progress (assets
  // done of total) on a paper page in the comic's own caption style; it fades when ready, or after 12 s with what is there.
  var loaderEl = stage.querySelector('.cs-loader'), audioPre = null;
  function preload(done) {
    var jobs = [], si = sceneAt(seek0), n = 0, total = 0, finished = false, rule = loaderEl && loaderEl.querySelector('.cs-loader__rule span'), cnt = loaderEl && loaderEl.querySelector('.cs-loader__count');
    function track(p) { total++; jobs.push(Promise.resolve(p).then(tick, tick)); }
    function tick() { n++; var k = total ? n / total : 1; if (rule) rule.style.transform = 'scaleX(' + k.toFixed(3) + ')'; if (cnt) cnt.textContent = n + ' of ' + total; }
    track(loadScene(si)); track(loadScene(si + 1));
    if (!muted && !hold) track(score.prepare(seek0)); // Decode saved dialogue before its first glyph; the existing 12s loader bounds readiness.
    if (PAGE.paperTile) track(new Promise(function (res) { var im = new Image(); im.onload = im.onerror = res; im.src = PAGE.paperTile; }));
    if (document.fonts && document.fonts.load) { track(document.fonts.load('700 1em "Kalam Letter"')); track(document.fonts.load('400 1em "Bangers"')); }
    if (!muted && !hold) track(new Promise(function (res) { audioPre = new Audio(music.src); audioPre.preload = 'auto'; audioPre.addEventListener('canplay', res, { once: true }); audioPre.addEventListener('error', res, { once: true }); setTimeout(res, 8000); audioPre.load(); }));
    tick(); n--; // show 0 of N
    var finish = function () { if (finished || q.has('loader')) return; finished = true; if (loaderEl) { loaderEl.classList.add('is-done'); setTimeout(function () { loaderEl.hidden = true; }, 700); } done(); };
    Promise.all(jobs).then(finish); setTimeout(finish, 12000);
  }
  function startAll() {
    measure();
    showChrome();
    if ((hold && !q.has('loader')) || REDUCED) { if (loaderEl) loaderEl.hidden = true; startAll2(); return; }
    if (q.has('loader')) { preload(function () {}); return; } // the loader held for a screenshot
    preload(startAll2);
  }
  function startAll2() {
    if (REDUCED) { stage.setAttribute('data-still', ''); if (!q.has('scene') && !q.has('t')) seek0 = stops()[0]; }
    T = seek0; t0 = now() - T; held = !REDUCED && T >= END_T;
    tag.classList.toggle('is-muted', muted);
    muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    muteBtn.setAttribute('aria-label', muted ? 'Unmute music' : 'Mute music');
    loadScene(sceneAt(T)); loadScene(sceneAt(T) + 1);
    if (hold) { state = 'paused'; stage.setAttribute('data-hold', ''); render(T); return; }
    if (!arriving()) { begin(); return; }
    render(T);
    var done = false, goOn = function () { if (done || arriving()) return; done = true; obs.disconnect(); begin(); };
    var obs = new MutationObserver(goOn);
    obs.observe(root, { attributes: true, attributeFilter: ['data-mtw-nav'], subtree: false });
    var layerEl = document.querySelector('.page-transition'); if (layerEl) obs.observe(layerEl, { attributes: true, attributeFilter: ['data-phase'] });
    setTimeout(function () { if (!done) { done = true; obs.disconnect(); begin(); } }, 3500);
  }
  // Read-only measured windows: boxes leave in reading order, not all at once.
  // Sample each box after its final glyph and before its own outgoing fade.
  function reviewFrames(sceneId) {
    var m = model.filter(function (item) { return item.d.id === sceneId; })[0];
    if (!m) return null;
    var frames = [];
    m.times.forEach(function (x, sheet) {
      var pending = x.panels.map(function (o, index) {
        var ready = Math.max(x.start + index * (x.panels.length > 1 ? ENTER * 0.5 / (x.panels.length - 1) : 0) + ENTER * 0.5,
          o.d.at + panelRevealDuration(x, o, index)), balloons = [];
        o.balloons.forEach(function (bl) {
          var count = bl.units ? bl.units.length : 0, per = bl.per;
          var measured = count === 0 || (typeof per === 'number' && isFinite(per) && per >= 0);
          var at = measured ? bl.d.at + Math.max(0.35, 0.3 + Math.max(0, count - 1) * (per || 0)) / B : Infinity;
          ready = Math.max(ready, at);
          balloons.push({ imageId: o.d.img, at: m.d.b + bl.d.at, units: count, per: measured ? per || 0 : null,
            fullyVisibleBeat: measured ? m.d.b + at : null, measured: measured });
        });
        return { imageId: o.d.img, ready: ready, fade: Math.min(m.d.l, panelFadeStart(x, index)), balloons: balloons };
      }).sort(function (a, b) { return a.fade - b.fade; });
      while (pending.length) {
        var candidate = pending[0].fade - 0.01;
        var group = pending.filter(function (p) { return p.ready <= candidate && candidate < p.fade; });
        if (!group.length) group = [pending[0]]; // retain/report an impossible window rather than silently skip it
        var ready = Math.max.apply(Math, group.map(function (p) { return p.ready; }));
        var localBeat = Math.max(x.start, candidate);
        frames.push({ frame: frames.length, sheet: sheet, activeSheet: sheetAt(m, localBeat),
          start: m.d.b + x.start, lastAt: m.d.b + x.lastAt, exitStart: m.d.b + x.exitStart, exitEnd: m.d.b + x.exitEnd,
          beat: m.d.b + localBeat, panelImageIds: group.map(function (p) { return p.imageId; }),
          balloons: [].concat.apply([], group.map(function (p) { return p.balloons; })),
          panels: group.map(function (p) { return { imageId: p.imageId, fullyVisibleBeat: isFinite(p.ready) ? m.d.b + p.ready : null, fadeStart: m.d.b + p.fade }; }),
          fullyVisibleBeat: isFinite(ready) ? m.d.b + ready : null,
          ready: candidate >= ready, timingIssue: candidate >= ready ? null : 'Panel exits before its art or final balloon finishes appearing/typing.' });
        pending = pending.filter(function (p) { return group.indexOf(p) < 0; });
      }
    });
    return { scene: m.d.id, mode: mode, sheets: m.sheets.length, frames: frames };
  }
  /* ---------- Read-only live geometry ---------- */
  var geometryDisposed = false;
  function geometryRect(rect) {
    return { x: rect.left + (window.scrollX || 0), y: rect.top + (window.scrollY || 0), width: rect.right - rect.left, height: rect.bottom - rect.top };
  }
  function geometryVisible(node) {
    if (!node || node.isConnected === false) return null;
    var r = node.getBoundingClientRect();
    if (![r.left, r.top, r.right, r.bottom].every(function (v) { return typeof v === 'number' && isFinite(v); }) || r.right <= r.left || r.bottom <= r.top) return null;
    var clip = { left: Math.max(0, r.left), top: Math.max(0, r.top), right: Math.min(window.innerWidth, r.right), bottom: Math.min(window.innerHeight, r.bottom) }, opacity = 1;
    for (var ancestor = node; ancestor; ancestor = ancestor.parentElement) {
      var css = window.getComputedStyle(ancestor);
      if (css.display === 'none' || css.visibility === 'hidden' || css.visibility === 'collapse') return null;
      var alpha = parseFloat(css.opacity); if (isFinite(alpha)) opacity *= alpha;
      if (opacity <= 0.001) return null;
      if (ancestor !== node) {
        var ar = ancestor.getBoundingClientRect();
        if (/^(hidden|clip|scroll|auto)$/.test(css.overflowX)) { clip.left = Math.max(clip.left, ar.left); clip.right = Math.min(clip.right, ar.right); }
        if (/^(hidden|clip|scroll|auto)$/.test(css.overflowY)) { clip.top = Math.max(clip.top, ar.top); clip.bottom = Math.min(clip.bottom, ar.bottom); }
      }
    }
    if (clip.right <= clip.left || clip.bottom <= clip.top) return null;
    return { rect: geometryRect(r), visibleRect: geometryRect(clip), opacity: opacity };
  }
  function geometry() {
    var si = sceneAt(T), result = { schemaVersion: 1, coordinateSpace: 'document-css-px', story: story.id,
      scene: si < scenes.length ? scenes[si].id : 'next', beat: T / B, seconds: T, mode: mode,
      viewport: { width: window.innerWidth, height: window.innerHeight, scrollX: window.scrollX || 0, scrollY: window.scrollY || 0 },
      disposed: geometryDisposed, pages: [], panels: [], balloons: [] };
    if (geometryDisposed) return result;
    model.forEach(function (m) {
      var page = geometryVisible(m.page); if (!page) return;
      result.pages.push({ id: story.id + '-' + m.d.id, scene: m.d.id, rect: page.rect, visibleRect: page.visibleRect });
      m.panels.forEach(function (o, index) {
        var panelKey = o.d.img || 'panel-' + index, id = story.id + '-' + m.d.id + '-' + panelKey, p = geometryVisible(o.el);
        if (p) result.panels.push({ id: id, scene: m.d.id, panelIndex: index, imageId: o.d.img || null, rect: p.rect, visibleRect: p.visibleRect, opacity: p.opacity, activeArt: activeArtGeometry(m, o), speakerGeometry: panelSpeakerGeometry(o) });
        // Captions can be reparented to a visible phone host; inspect their actual DOM, independently of the source box.
        o.balloons.forEach(function (bl, bi) {
          var box = geometryVisible(bl.box); if (!box) return;
          result.balloons.push({ id: id + '-b' + (bi + 1), panelId: id, scene: m.d.id, panelIndex: index, balloonIndex: bi,
            kind: bl.kind, authoredWho: bl.d.who, hostPanelId: bl.movedTo || null, rect: box.rect, visibleRect: box.visibleRect, opacity: box.opacity,
            sourceAnchored: !!bl.sourceAnchored, pointerVisible: !bl.cap && (bl.kind === 'burst' ? !!(bl.d.tail || bl.sourceAnchored) : !!bl.tailVisible), placementConflict: !!bl.placementConflict, bodyRect: bl.placementRect || null });
        });
      });
    });
    return result;
  }
  // Studio editor: ?editor=<origin> names exactly one loopback origin allowed to drive this page from outside.
  function editorOrigin() {
    var raw; try { raw = new URLSearchParams(window.location.search || '').get('editor'); } catch (e) { return ''; }
    if (!raw) return '';
    var m = /^http:\/\/(127\.0\.0\.1|localhost):(\d{1,5})$/.exec(raw);
    return m && +m[2] > 0 && +m[2] < 65536 ? raw : '';
  }
  function geometryMessage(event) {
    if (geometryDisposed || window.location.origin === 'null' || !event.source || !event.data) return;
    var editor = editorOrigin(), type = event.data.type;
    if (event.origin !== window.location.origin && !(editor && event.origin === editor)) return;
    if (editor && event.origin === editor && event.origin !== window.location.origin) {
      if (type === 'mtw-seek' && typeof event.data.scene === 'string' && typeof seekTo === 'function') {
        var beat = parseFloat(event.data.beat) || 0, target = null;
        if (event.data.scene === 'next') target = NEXT_T + beat * B;
        else for (var i = 0; i < scenes.length; i++) if (scenes[i].id === event.data.scene) target = (scenes[i].b + beat) * B;
        if (target !== null) seekTo(target);
        return;
      }
      if (type === 'mtw-hold' && typeof event.data.hold === 'boolean') { hold = event.data.hold; return; }
    }
    if (type !== 'mtw-geometry') return;
    var reply = { type: 'mtw-geometry-result', geometry: geometry() };
    if (Object.prototype.hasOwnProperty.call(event.data, 'requestId')) reply.requestId = event.data.requestId;
    event.source.postMessage(reply, event.origin);
  }
  function disposeGeometry() {
    geometryDisposed = true;
    window.removeEventListener('message', geometryMessage);
    document.removeEventListener('astro:before-swap', disposeGeometry);
    window.removeEventListener('pagehide', geometryPageHide);
  }
  function geometryPageHide(event) { if (!event.persisted) disposeGeometry(); }
  window.addEventListener('message', geometryMessage);
  document.addEventListener('astro:before-swap', disposeGeometry);
  window.addEventListener('pagehide', geometryPageHide);
  /* ---------- End read-only live geometry ---------- */
  function panelArtLoaded(o) {
    if (o.d.fallbackView) return !!(o.viewCrop && o.viewCrop.style.display !== 'none' && o.selectedSource && o.selectedImage && (!o.viewLayerCrops.length || o.viewLayerState && o.viewLayerState.status === 'ready'));
    if (!o.loaded) return false;
    if (o.viewLayerState && o.viewLayerState.status !== 'ready') return false;
    if (o.d.staticArt) {
      var spec = viewSource(o.d.staticArt, mode === 'phone'), state = o.sourceStates && o.sourceStates[sourceKey(spec)];
      if (!state || state.status !== 'ready') return false;
    }
    return true;
  }
  window.MTWComicStory = {
    geometry: geometry,
    reviewFrames: reviewFrames,
    collapse: collapse,
    sfx: function (k) { score.play(k); }, // audition one invented effect (review and tests)
    go: go,
    issue: stepIssue,
    openIssues: openIssues,
    closeIssues: closeIssues,
    seek: function (t) { seekTo(t); },
    status: function () {
      var si = sceneAt(T), loaded = model.every(function (m, i) { return Math.abs(i - si) > 1 || m.panels.every(panelArtLoaded); });
      return { score: score.info(), app: APP, still: REDUCED, issues: issuesOpen(), state: state, T: +T.toFixed(3), beat: +(T / B).toFixed(2), scene: si < scenes.length ? scenes[si].id : 'next', sheet: si < scenes.length ? sheetAt(model[si], T / B - scenes[si].b) : 0, sheets: si < scenes.length ? model[si].sheets.length : 0, mode: mode, held: held, userPaused: userPaused, audioLive: audioLive, muted: muted, loaded: loaded };
    },
  };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (owning() || state === 'hold') { measure(); render(T); } });
  startAll();
})();
