/* Shared clock adapter: seconds for comics; any bounded position for later tours/task fields.
   The native range owns pointer/touch/keyboard input. Players own clocks and audio. */
(function () {
  if (window.MTWProgress) return;
  function time(t) { t = Math.floor(t); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); }
  window.MTWProgress = {
    mount: function (element, options) {
      if (!element) return null;
      var input = element.querySelector('input'), dragging = false, activePointer = null, listeners = [];
      var duration = Math.max(0.01, options.duration);
      input.max = String(duration);
      function listen(type, fn, opts) { input.addEventListener(type, fn, opts); listeners.push([type, fn, opts]); }
      function paint(value) {
        var t = Math.max(0, Math.min(duration, Number(value) || 0));
        input.value = String(t);
        element.style.setProperty('--progress', (t / duration * 100) + '%');
        input.setAttribute('aria-valuetext', options.format ? options.format(t, duration) : time(t) + ' of ' + time(duration));
      }
      function finish(e) { if (!dragging || (e && e.pointerId != null && e.pointerId !== activePointer)) return; dragging = false; activePointer = null; if (options.end) options.end(); }
      listen('pointerdown', function (e) { e.stopPropagation(); if (dragging || e.button > 0) { e.preventDefault(); return; } dragging = true; activePointer = e.pointerId; if (options.start) options.start(); input.setPointerCapture(e.pointerId); });
      listen('pointerup', finish);
      listen('pointercancel', finish);
      listen('lostpointercapture', finish);
      listen('blur', finish);
      listen('input', function (e) { e.stopPropagation(); var t = Number(input.value); options.seek(t); paint(t); });
      ['click', 'touchstart', 'touchmove', 'touchend', 'keydown', 'keyup'].forEach(function (type) { listen(type, function (e) { e.stopPropagation(); }); });
      paint(0);
      return { update: function (t) { if (!dragging) paint(t); }, isDragging: function () { return dragging; }, destroy: function () { dragging = false; listeners.forEach(function (l) { input.removeEventListener(l[0], l[1], l[2]); }); } };
    }
  };
})();
