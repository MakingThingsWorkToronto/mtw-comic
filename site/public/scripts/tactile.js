// Tactile feedback. Classic script (not a module, no network) so it runs from file:// too.
// Research and pattern vocabulary: site/research/tactile-ui.md. Styles: src/styles/tactile.css.
//
// 1. Press: sets .is-pressed on the element under a pointer or Enter/Space, so CSS can press
//    and settle it. A press stays visible for at least MIN_PRESS_MS; nothing is ever delayed,
//    prevented or re-dispatched, so clicks and navigation happen exactly when they would anyway.
// 2. Sound: a brief synthesized piano note from Web Audio. Off until the visitor turns it on
//    (localStorage 'mtw-sound'), or until a Beat Comic's music becomes audible: the site has one sound
//    setting for music and presses (Matt, 2026-09-27: "link scene audio to button click audio"). Every change
//    is announced as a window 'mtw-sound' event. No AudioContext exists before a user gesture with sound on.
//    Never on hover, focus, scroll or load; never while the tab is hidden.
// 3. Haptics: a 10 to 15 ms navigator.vibrate pulse on touch activation, where supported,
//    under the same preference.
// 4. Sound toggle: any [data-sound-toggle] button (src/components/SoundToggle.astro).
(function () {
  'use strict';
  if (window.MTWTactile) return;

  var root = document.documentElement;
  var STORAGE_KEY = 'mtw-sound';
  var DEFAULT_ON = false; // research: opt-in, see site/research/tactile-ui.md "Sound default"
  var MIN_PRESS_MS = 90;
  var TOUCH_PRESS_DELAY_MS = 50; // lets a scroll start (pointercancel) before any press shows

  // Kinds: press (buttons, links), toggle (aria-expanded / aria-pressed / switch), tick (select, step link), none.
  var TOGGLE_SEL = 'button[aria-expanded], button[aria-pressed], [role="switch"], [role="button"][aria-pressed], [role="button"][aria-expanded], input[type="checkbox"], input[type="radio"]';
  var PRESS_SEL = 'a[href], button, [role="button"], input[type="submit"], input[type="button"], input[type="reset"], select, summary, [data-tactile]';

  function isDisabled(el) {
    return el.disabled || el.getAttribute('aria-disabled') === 'true' || !!el.closest('[inert]');
  }
  function targetOf(node) {
    if (!node || !node.closest) return null;
    var el = node.closest(PRESS_SEL);
    if (!el || isDisabled(el) || el.closest('[data-tactile="off"]')) return null;
    return el;
  }
  function kindOf(el) {
    var forced = el.getAttribute('data-tactile');
    if (forced && /^(press|toggle|tick|none)$/.test(forced)) return forced;
    if (el.matches(TOGGLE_SEL)) return 'toggle';
    if (el.nodeName === 'SELECT' || el.hasAttribute('data-tour-link')) return 'tick';
    return 'press';
  }

  /* ---------- Preference ---------- */
  function readPref() {
    try {
      var v = window.localStorage.getItem(STORAGE_KEY);
      if (v === 'on') return true;
      if (v === 'off') return false;
    } catch (e) { /* storage blocked */ }
    return DEFAULT_ON;
  }
  var soundOn = readPref();
  // True while a page's music is held back by the browser's autoplay rule: the toggle then shows sound off,
  // because nothing is audible, and a press on it asks for sound rather than turning it off.
  var blocked = false;
  function setSound(on) {
    soundOn = !!on;
    try { window.localStorage.setItem(STORAGE_KEY, soundOn ? 'on' : 'off'); } catch (e) { /* storage blocked */ }
    root.dataset.sound = soundOn ? 'on' : 'off';
    syncToggles();
    if (!soundOn && ctx && ctx.state === 'running' && ctx.suspend) ctx.suspend().catch(function () {});
    announce();
  }
  function announce() { try { window.dispatchEvent(new CustomEvent('mtw-sound', { detail: { on: soundOn } })); } catch (e) { /* old browser */ } }
  root.dataset.sound = soundOn ? 'on' : 'off';

  /* ---------- Sound ---------- */
  var AC = window.AudioContext || window.webkitAudioContext;
  var ctx = null;
  var lastPlay = -Infinity;
  var MIN_GAP_MS = 60; // at most one note per 60 ms, so repeated clicks never turn tinkly

  // Only called from inside a user gesture handler, and only when sound is on. One shared context.
  function ensureAudio() {
    if (!AC) return null;
    if (!ctx) {
      try {
        ctx = new AC({ latencyHint: 'interactive' });
      } catch (e) { ctx = null; return null; }
    }
    if (ctx.state === 'suspended' && ctx.resume) ctx.resume().catch(function () {});
    return ctx;
  }

  // A soft piano-like note: three sine partials with slight string inharmonicity (f_n = n f sqrt(1 + B n^2)),
  // a 4 ms attack and exponential decay (upper partials die sooner), a low-pass that closes as the note
  // decays, and a quiet band-passed noise "hammer". Research: site/research/tactile-ui.md "Piano note".
  var HZ = { C5: 523.25, E5: 659.26, G5: 783.99 };
  var ATTACK = 0.004;
  var INHARMONICITY = 0.0004;
  var PARTIALS = [{ n: 1, gain: 1, decay: 1 }, { n: 2, gain: 0.3, decay: 0.6 }, { n: 3, gain: 0.1, decay: 0.4 }];
  var noiseBuffers = {};
  function hammerNoise(c) {
    var sr = c.sampleRate;
    if (noiseBuffers[sr]) return noiseBuffers[sr];
    var len = Math.floor(sr * 0.02);
    var buf = c.createBuffer(1, len, sr);
    var d = buf.getChannelData(0);
    var seed = 22222;
    for (var i = 0; i < len; i++) { seed = (seed * 16807) % 2147483647; d[i] = seed / 1073741823.5 - 1; }
    return (noiseBuffers[sr] = buf);
  }

  function strike(c, dest, t, hz, level, decay) {
    var out = c.createGain();
    out.gain.value = level;
    out.connect(dest);
    var lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 0.5;
    lp.frequency.setValueAtTime(Math.min(hz * 9, 7000), t);
    lp.frequency.exponentialRampToValueAtTime(hz * 1.6, t + decay);
    lp.connect(out);
    var end = t;
    PARTIALS.forEach(function (p) {
      var osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = hz * p.n * Math.sqrt(1 + INHARMONICITY * p.n * p.n);
      var g = c.createGain();
      var stop = t + ATTACK + decay * p.decay;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(p.gain, t + ATTACK);
      g.gain.exponentialRampToValueAtTime(p.gain * 0.0001, stop);
      g.gain.setValueAtTime(0, stop);
      osc.connect(g); g.connect(lp);
      osc.start(t); osc.stop(stop + 0.01);
      if (stop > end) { end = stop; osc.onended = function () { out.disconnect(); }; }
    });
    // Hammer: 12 ms of band-passed noise, well under the tone.
    var src = c.createBufferSource();
    src.buffer = hammerNoise(c);
    var band = c.createBiquadFilter();
    band.type = 'bandpass'; band.frequency.value = Math.min(hz * 4, 6000); band.Q.value = 0.8;
    var hg = c.createGain();
    hg.gain.setValueAtTime(0, t);
    hg.gain.linearRampToValueAtTime(0.35, t + 0.001);
    hg.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);
    src.connect(band); band.connect(hg); hg.connect(out);
    src.start(t); src.stop(t + 0.02);
  }

  // Each sound is a list of notes: [note, start offset s, level, decay s]. Peaks: press about -19 dBFS, tick -26 dBFS.
  var SOUNDS = {
    press: [['C5', 0, 0.1, 0.38]],                               // root note
    toggleOn: [['C5', 0, 0.06, 0.12], ['E5', 0.075, 0.09, 0.32]], // rising major third
    toggleOff: [['E5', 0, 0.06, 0.12], ['C5', 0.075, 0.09, 0.32]], // falling major third
    tick: [['G5', 0, 0.045, 0.22]]                               // quiet fifth above (select, step link)
  };

  // Schedules a named sound into any BaseAudioContext (also an OfflineAudioContext, for verification).
  function schedule(c, dest, name, when) {
    var notes = SOUNDS[name];
    if (!notes) return false;
    notes.forEach(function (n) { strike(c, dest, when + n[1], HZ[n[0]], n[2], n[3]); });
    return true;
  }

  function play(name) {
    if (!soundOn || document.visibilityState === 'hidden' || !SOUNDS[name]) return false;
    var now = performance.now();
    if (now - lastPlay < MIN_GAP_MS) return false; // one note per gesture, never a burst
    if (!ensureAudio()) return false;
    lastPlay = now;
    try { schedule(ctx, ctx.destination, name, ctx.currentTime + 0.005); } catch (e) { return false; }
    return true;
  }

  document.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    if (document.visibilityState === 'hidden') { if (ctx.suspend) ctx.suspend().catch(function () {}); }
  });

  /* ---------- Haptics ---------- */
  var canVibrate = typeof navigator.vibrate === 'function';
  function pulse(ms) {
    if (!soundOn || !canVibrate) return false;
    try { return navigator.vibrate(ms) !== false; } catch (e) { return false; }
  }

  /* ---------- Press state ---------- */
  var pressed = null;
  var pressedAt = 0;
  var releaseTimer = 0;
  var touchTimer = 0;
  var touchPending = null;
  var lastPointerType = '';

  function press(el) {
    if (pressed && pressed !== el) releaseNow();
    window.clearTimeout(releaseTimer);
    pressed = el;
    pressedAt = performance.now();
    el.classList.add('is-pressed');
  }
  function releaseNow() {
    window.clearTimeout(releaseTimer);
    if (pressed) pressed.classList.remove('is-pressed');
    pressed = null;
  }
  function release() {
    if (!pressed) return;
    var held = performance.now() - pressedAt;
    window.clearTimeout(releaseTimer);
    if (held >= MIN_PRESS_MS) releaseNow();
    else releaseTimer = window.setTimeout(releaseNow, MIN_PRESS_MS - held);
  }
  function cancelTouch() { window.clearTimeout(touchTimer); touchPending = null; }

  document.addEventListener('pointerdown', function (e) {
    lastPointerType = e.pointerType;
    if (e.button !== 0) return;
    var el = targetOf(e.target);
    if (!el) return;
    if (e.pointerType === 'touch') {
      cancelTouch();
      touchPending = el;
      touchTimer = window.setTimeout(function () { if (touchPending === el) { touchPending = null; press(el); } }, TOUCH_PRESS_DELAY_MS);
      return;
    }
    press(el);
    // A select opens its own list, which swallows pointerup: release after the minimum press.
    if (el.nodeName === 'SELECT') release();
    // Mouse and pen: the click sound belongs to the moment the button goes down.
    // A select ticks on change instead.
    var kind = kindOf(el);
    if (kind === 'press') play('press');
  }, true);

  document.addEventListener('pointerup', function () {
    if (touchPending) { var el = touchPending; cancelTouch(); press(el); }
    release();
  }, true);
  document.addEventListener('pointercancel', function () { cancelTouch(); releaseNow(); }, true);
  document.addEventListener('pointerout', function (e) {
    if (pressed && e.target === pressed && !(e.relatedTarget && pressed.contains(e.relatedTarget))) release();
  }, true);
  document.addEventListener('dragstart', function () { cancelTouch(); releaseNow(); }, true);
  window.addEventListener('blur', function () { cancelTouch(); releaseNow(); });

  // Keyboard parity: Enter presses links and buttons, Space presses buttons (it scrolls on links).
  document.addEventListener('keydown', function (e) {
    if (e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
    var isEnter = e.key === 'Enter';
    var isSpace = e.key === ' ' || e.key === 'Spacebar';
    if (!isEnter && !isSpace) return;
    var el = targetOf(document.activeElement);
    if (!el || el !== document.activeElement) return;
    var tag = el.nodeName;
    if (tag === 'SELECT') return;
    if (isSpace && tag === 'A') return;
    if (isEnter && el.matches('input[type="checkbox"], input[type="radio"]')) return;
    press(el);
    if (kindOf(el) === 'press') play('press');
  }, true);
  document.addEventListener('keyup', function (e) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') release();
  }, true);
  // Enter on a link navigates on keydown, and focus may move before keyup arrives.
  document.addEventListener('focusout', function (e) { if (pressed && e.target === pressed) release(); }, true);

  // Activation (bubbling, so the control's own handlers have already updated its state).
  document.addEventListener('click', function (e) {
    var el = targetOf(e.target);
    if (!el || el.hasAttribute('data-sound-toggle')) return;
    var kind = kindOf(el);
    var type = e.pointerType || (e.detail === 0 ? 'keyboard' : lastPointerType);
    if (kind === 'toggle') {
      var on = el.getAttribute('aria-expanded') === 'true' || el.getAttribute('aria-pressed') === 'true' ||
        el.getAttribute('aria-checked') === 'true' || el.checked === true;
      play(on ? 'toggleOn' : 'toggleOff');
      if (type === 'touch') pulse(15);
    } else if (kind === 'tick') {
      if (el.nodeName !== 'SELECT') play('tick');
      if (type === 'touch' && el.nodeName !== 'SELECT') pulse(8);
    } else if (kind === 'press') {
      // Touch and keyboard-less activations (no pointerdown sound yet) click here.
      if (type === 'touch') { play('press'); pulse(10); }
    }
  });

  // Select Tick: a value really changed.
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (!el || el.nodeName !== 'SELECT' || isDisabled(el)) return;
    releaseNow();
    el.classList.remove('tactile-ticked');
    void el.offsetWidth; // restart the animation
    el.classList.add('tactile-ticked');
    play('tick');
  });
  document.addEventListener('animationend', function (e) {
    if (e.animationName === 'tactile-tick' && e.target.classList) e.target.classList.remove('tactile-ticked');
  });
  // A select's own list swallows pointerup, so release its press when the list closes.
  document.addEventListener('blur', function (e) { if (pressed && e.target === pressed && pressed.nodeName === 'SELECT') releaseNow(); }, true);

  /* ---------- Sound toggle ---------- */
  function syncToggles() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-sound-toggle]'), function (b) {
      b.setAttribute('aria-pressed', soundOn && !blocked ? 'true' : 'false');
      b.hidden = false;
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-sound-toggle]');
    if (!b) return;
    if (blocked) setSound(true); else setSound(!soundOn);
    if (soundOn) { play('toggleOn'); if ((e.pointerType || lastPointerType) === 'touch') pulse(15); }
  });
  window.addEventListener('storage', function (e) {
    if (e.key === STORAGE_KEY) { soundOn = e.newValue === 'on' || (e.newValue === null && DEFAULT_ON); root.dataset.sound = soundOn ? 'on' : 'off'; syncToggles(); announce(); }
  });

  function init() { syncToggles(); root.classList.add('tactile-ready'); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.MTWTactile = {
    isSoundOn: function () { return soundOn; },
    setSound: setSound,
    setBlocked: function (b) { blocked = !!b; syncToggles(); },
    play: play,
    schedule: schedule,
    sounds: SOUNDS,
    notes: HZ,
    pulse: pulse,
    storageKey: STORAGE_KEY,
    defaultOn: DEFAULT_ON
  };
})();
