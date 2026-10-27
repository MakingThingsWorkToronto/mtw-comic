// Site behaviour. Classic script (not a module) so it runs from file:// as well as the web.
// 1. Header: mobile menu toggle and Services disclosure (keyboard, Escape, outside click).
// 2. Temporary image style dropdown.
// 3. One native-scroll parallax coordinator (transforms only).
// 4. Header expansion: --header-expand, from the signals the immersive components already publish.
(function () {
  'use strict';
  var root = document.documentElement;

  // Resolve the shared CSS frame once for immersive descendants. A percentage
  // inset otherwise changes meaning inside the tour's narrower grid tracks.
  // The same CSS-only frame remains usable when scripts are unavailable.
  function measurePageInset() {
    root.style.setProperty('--page-viewport-width', root.clientWidth + 'px');
    var probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;inset:0 0 auto;max-width:var(--page-frame-max);margin-inline:auto;padding-inline:var(--page-gutter);visibility:hidden;pointer-events:none;height:0;';
    document.body.appendChild(probe);
    var inset = probe.getBoundingClientRect().left + parseFloat(getComputedStyle(probe).paddingLeft);
    root.style.setProperty('--page-inset-px', inset + 'px');
    probe.remove();
  }
  measurePageInset();
  window.addEventListener('resize', measurePageInset);

  /* ---------- 1. Header ---------- */
  var nav = document.querySelector('.site-nav');
  if (nav) {
    var navToggle = nav.querySelector('.nav-toggle');
    var menu = nav.querySelector('.menu');
    var menuToggle = menu && menu.querySelector('.menu-toggle');

    var setMenu = function (open) {
      if (!menu) return;
      menu.dataset.open = String(open);
      menuToggle.setAttribute('aria-expanded', String(open));
    };
    var setNav = function (open) {
      nav.dataset.open = String(open);
      navToggle.setAttribute('aria-expanded', String(open));
      if (!open) setMenu(false);
    };

    navToggle.addEventListener('click', function () { setNav(nav.dataset.open !== 'true'); });
    // Mega menu groups: collapsible on mobile (their toggles are hidden on desktop, where every group shows).
    Array.prototype.forEach.call(nav.querySelectorAll('.mega-col__toggle'), function (t) {
      t.addEventListener('click', function () {
        var col = t.closest('.mega-col'), open = col.dataset.open !== 'true';
        col.dataset.open = String(open);
        t.setAttribute('aria-expanded', String(open));
      });
    });
    if (menuToggle) menuToggle.addEventListener('click', function () { setMenu(menu.dataset.open !== 'true'); });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (menu && menu.dataset.open === 'true') { setMenu(false); menuToggle.focus(); return; }
      if (nav.dataset.open === 'true') { setNav(false); navToggle.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (menu && menu.dataset.open === 'true' && !menu.contains(e.target)) setMenu(false);
      if (nav.dataset.open === 'true' && !nav.contains(e.target)) setNav(false);
    });
    // Close the Services panel when focus leaves it (keyboard users tabbing on).
    if (menu) menu.addEventListener('focusout', function (e) {
      if (e.relatedTarget && !menu.contains(e.relatedTarget)) setMenu(false);
    });
  }

  /* ---------- 2. Image style dropdown: retired 2026-09-24 (the site always shows the public default) ---------- */

  /* ---------- 3. Parallax coordinator ---------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll('[data-story-anchor]'));
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var narrow = window.matchMedia('(max-width: 850px)');
  var queued = false;

  function clearTransforms() {
    sections.forEach(function (s) {
      Array.prototype.forEach.call(s.querySelectorAll('[data-depth]'), function (el) { el.style.transform = ''; });
    });
  }

  function update() {
    queued = false;
    var vh = window.innerHeight;
    var current = null;
    var best = Infinity;
    sections.forEach(function (section) {
      var rect = section.getBoundingClientRect();
      // Current anchor: the section containing the viewport centre, else the nearest one.
      var d = rect.top <= vh / 2 && rect.bottom >= vh / 2 ? 0 : Math.min(Math.abs(rect.top - vh / 2), Math.abs(rect.bottom - vh / 2));
      if (d < best) { best = d; current = section; }
      if (reduced.matches) return;
      if (rect.bottom < -vh || rect.top > 2 * vh) return;
      // progress: 0 as the section enters from below, 1 as it leaves at the top.
      var p = (vh - rect.top) / (vh + rect.height);
      p = Math.max(0, Math.min(1, p));
      var c = p * 2 - 1; // -1 .. 1, 0 when centred
      var travel = narrow.matches ? 0.04 : 0.14; // share of viewport height
      Array.prototype.forEach.call(section.querySelectorAll('[data-depth]'), function (el) {
        var depth = parseFloat(el.getAttribute('data-depth')) || 0;
        var y = -c * depth * travel * vh;
        var scale = 1 + Math.abs(c) * 0.08 * Math.abs(depth);
        el.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0) scale(' + scale.toFixed(4) + ')';
      });
    });
    if (current) root.dataset.currentAnchor = current.getAttribute('data-story-anchor');
    else delete root.dataset.currentAnchor;
  }

  function schedule() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(update);
  }

  /* ---------- 4. Shared presentation header ----------
     Task Field and Diagram Tour progress is published on their own components. Comics use their actual canvas
     margins, including still/reduced-motion readers. Launched dialogs keep the real header inside their modal.
     Observe existing state; never add a second scroll clock. Continuous player progress stays direct, while
     discrete activation/close receives the shared CSS transition. */
  (function headerExpand() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var last = '';
    var fullInset = parseFloat(getComputedStyle(header).getPropertyValue('--header-gutter-full')) || 24;
    var apply = function () {
      var e = root.dataset.diagramAsideOpen ? 1 : parseFloat(root.dataset.tfExpand) || 0;
      var presentations = document.querySelectorAll('[data-tour-expand], [data-tf-expand]');
      for (var i = 0; i < presentations.length; i++) e = Math.max(e, parseFloat(presentations[i].dataset.tourExpand || presentations[i].dataset.tfExpand) || 0);
      var comic = root.hasAttribute('data-comic') && root.dataset.comic !== 'done' && document.querySelector('.comic');
      var reel = root.hasAttribute('data-reel') && root.dataset.reel !== 'done' && document.querySelector('.reel');
      var kind = root.dataset.diagramAsideOpen ? 'aside' : (comic || reel ? 'comic' : 'scroll');
      var left = fullInset, right = left;
      var headerBounds = header.getBoundingClientRect();
      if (!root.dataset.diagramAsideOpen && comic) {
        var view = comic.querySelector('.cs-view'), gap = parseFloat(comic.style.getPropertyValue('--cs-page-gap')) || 6;
        if (view) { var box = view.getBoundingClientRect(); left = box.left - headerBounds.left + gap; right = headerBounds.right - box.right + gap; }
        e = 1;
      } else if (!root.dataset.diagramAsideOpen && reel) {
        var book = reel.querySelector('.rl-book');
        if (book) { var bounds = book.getBoundingClientRect(); left = bounds.left - headerBounds.left; right = headerBounds.right - bounds.right; }
        e = parseFloat(root.dataset.reelExpand || '1');
      }
      e = Math.max(0, Math.min(1, e));
      if (!e && kind === 'scroll' && header.dataset.presentation && header.dataset.presentation !== 'scroll') kind = header.dataset.presentation;
      var signature = [e, left, right, kind].join('|');
      if (signature === last) return;
      var entering = !last && kind === 'comic';
      last = signature;
      // Continuous scroll/fold progress follows its player directly. Only discrete entry/exit uses a timed transition.
      header.dataset.presentation = kind;
      header.dataset.presentationTimed = kind !== 'scroll' && !root.hasAttribute('data-reel-expand') ? 'true' : 'false';
      header.style.setProperty('--header-full-left', Math.max(0, left) + 'px');
      header.style.setProperty('--header-full-right', Math.max(0, right) + 'px');
      if (entering && !reduced.matches) void header.offsetWidth; // establish the page alignment before the first comic entry
      if (e) root.style.setProperty('--header-expand', e.toFixed(3));
      else root.style.removeProperty('--header-expand');
    };
    var observer = new MutationObserver(apply);
    observer.observe(root, { attributes: true, attributeFilter: ['data-tf-expand', 'data-diagram-aside-open', 'data-comic', 'data-reel', 'data-reel-expand'] });
    // Tours are in the page at load; a tour launched from a Diagram Aside runs in its own document, and the layer
    // above it carries data-diagram-aside-open here instead.
    Array.prototype.forEach.call(document.querySelectorAll('[data-diagram-tour], [data-task-field], .comic'), function (el) {
      observer.observe(el, { attributes: true, attributeFilter: el.matches('.comic') ? ['style'] : ['data-tour-expand', 'data-tf-expand'] });
    });
    var resize = function () { fullInset = parseFloat(getComputedStyle(header).getPropertyValue('--header-gutter-full')) || 24; apply(); };
    window.addEventListener('resize', resize);
    window.addEventListener('pageshow', apply);
    document.addEventListener('astro:before-swap', function () { observer.disconnect(); root.style.removeProperty('--header-expand'); window.removeEventListener('resize', resize); window.removeEventListener('pageshow', apply); }, { once: true });
    apply();
  })();

  function onMotionChange() {
    if (reduced.matches) clearTransforms();
    schedule();
  }

  if (sections.length) {
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    if (reduced.addEventListener) reduced.addEventListener('change', onMotionChange);
    if (narrow.addEventListener) narrow.addEventListener('change', schedule);
    update();
  }
})();
