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
    var menus = Array.prototype.slice.call(nav.querySelectorAll('.menu'));
    var setMenu = function (menu, open) {
      menu.dataset.open = String(open);
      menu.querySelector('.menu-toggle').setAttribute('aria-expanded', String(open));
    };
    var closeMenus = function () { menus.forEach(function (menu) { setMenu(menu, false); }); };

    var setNav = function (open) {
      nav.dataset.open = String(open);
      navToggle.setAttribute('aria-expanded', String(open));
      if (!open) closeMenus();
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
    menus.forEach(function (menu) {
      menu.querySelector('.menu-toggle').addEventListener('click', function () {
        var open = menu.dataset.open !== 'true';
        closeMenus();
        setMenu(menu, open);
      });
      menu.addEventListener('focusout', function (e) {
        if (e.relatedTarget && !menu.contains(e.relatedTarget)) setMenu(menu, false);
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var menu = menus.find(function (item) { return item.dataset.open === 'true'; });
      if (menu) { setMenu(menu, false); menu.querySelector('.menu-toggle').focus(); return; }
      if (nav.dataset.open === 'true') { setNav(false); navToggle.focus(); }
    });
    document.addEventListener('click', function (e) {
      menus.forEach(function (menu) {
        if (menu.dataset.open === 'true' && !menu.contains(e.target)) setMenu(menu, false);
      });
      if (nav.dataset.open === 'true' && !nav.contains(e.target)) setNav(false);
    });
  }

})();
