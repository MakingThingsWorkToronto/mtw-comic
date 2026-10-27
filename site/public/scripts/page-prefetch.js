// Warm linked HTML documents without intercepting navigation or loading tour assets.
// Classic head script: file:// review keeps its ordinary links and makes no requests.
(function () {
  'use strict';
  if (!/^https?:$/.test(window.location.protocol)) return;
  var probe = document.createElement('link');
  if (!probe.relList || !probe.relList.supports || !probe.relList.supports('prefetch')) return;
  var seen = new Set();

  function warmPages() {
    var connection = navigator.connection;
    if (navigator.onLine === false || (connection && (connection.saveData || /2g/.test(connection.effectiveType)))) return;
    Array.prototype.forEach.call(document.querySelectorAll('link[rel~="prefetch"][href]'), function (link) { seen.add(link.href); });
    Array.prototype.forEach.call(document.querySelectorAll('a[href]'), function (anchor) {
      if (anchor.hasAttribute('download') || anchor.getAttribute('data-prefetch') === 'false' ||
          (anchor.target && anchor.target !== '_self') || anchor.relList.contains('nofollow') ||
          anchor.closest('[hidden], [inert], [data-diagram-aside-tour]')) return;
      var url;
      try { url = new URL(anchor.href); } catch (_) { return; }
      if (url.origin !== location.origin || url.protocol !== location.protocol || url.username || url.password || url.search) return;
      if (url.pathname === location.pathname || /^\/(?:api|library-tour)\//.test(url.pathname)) return;
      // Public Astro pages use trailing slashes; .html is retained for served file-review builds.
      if (!url.pathname.endsWith('/') && !/\.html$/.test(url.pathname)) return;
      url.hash = '';
      if (seen.has(url.href)) return;
      seen.add(url.href);
      var hint = document.createElement('link');
      hint.rel = 'prefetch';
      hint.href = url.href;
      hint.setAttribute('fetchpriority', 'low');
      document.head.appendChild(hint);
    });
  }

  // Let this document's images, styles and fonts finish before warming the next one.
  if (document.readyState === 'complete') warmPages();
  else window.addEventListener('load', warmPages, { once: true });
})();
