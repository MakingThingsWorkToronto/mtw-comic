#!/usr/bin/env node
// The Comic B deslop lint (skill: mtw-comic-story, references/deslop.md; Matt, 2026-09-28: "do everything you can to add
// deslop to the skill so this does not repeat"). A static check that fails on every pattern Matt or the reference review
// has already rejected: UI styling in the comic (rounded corners, shadows, gradients, blur, overlays, off-palette
// colours), styles the reference comics do not use (whisper and machine balloons, engine-drawn effects), controls over
// the page, placeholder text drawn as lettering, uncomposed dialogue, villain roll calls, "Next:" prefixes, even grids,
// page constants outside the measured, minimal range, and blur or glow in the art. Mandatory before showing Matt,
// together with comic-story-style-check.mjs and ai-slop-check.
// Usage: node scripts/comic-story-deslop.mjs        (from site/; exit 1 on any FAIL)
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { registerHooks } from 'node:module';
import { comicSoundErrors } from './comic-sound-contract.mjs';
import {comicLayerErrors,withoutApprovedProjection} from './comic-layer-contract.mjs';
registerHooks({ resolve(spec, ctx, next) { try { return next(spec, ctx); } catch (e) { if (/^\.\.?\//.test(spec) && !/\.[a-z]+$/i.test(spec)) return next(spec + '.ts', ctx); throw e; } } });

const here = dirname(fileURLToPath(import.meta.url)), site = resolve(here, '..'), repo = resolve(site, '..');
const skillAssets = join(repo, '.claude/skills/mtw-comic-story/assets');
const out = [];
const fail = (rule, msg) => out.push(['FAIL', rule, msg]);
const ok = (rule, msg) => out.push(['ok', rule, msg]);
const read = (p) => readFileSync(join(site, p), 'utf8');

// ---------- Config: one source, measured and minimal ----------
const pc = JSON.parse(readFileSync(join(skillAssets, 'page-constants.json'), 'utf8')), bsCfg = JSON.parse(readFileSync(join(skillAssets, 'balloon-style.json'), 'utf8'));
for (const f of ['page-constants.json', 'balloon-style.json']) {
  const a = readFileSync(join(skillAssets, f), 'utf8'), b = join(repo, '.codex/skills/mtw-comic-story/assets', f);
  if (!existsSync(b) || readFileSync(b, 'utf8') !== a) fail('config', `${f} differs between the .claude and .codex skill editions`);
}
const P = pc.page || {}, D = (pc.derived && pc.derived.fromReferences) || {};
if (!(P.gutterPct >= 0.4 && P.gutterPct <= 1.4)) fail('gutter', `page gutter ${P.gutterPct}% of the short side is outside the minimal range 0.4-1.4%`);
if (!(P.marginPct >= 0.4 && P.marginPct <= 2.5)) fail('margin', `page margin ${P.marginPct}% is outside the minimal range 0.4-2.5%`);
if (!(P.borderPct >= 0.1 && P.borderPct <= 0.5)) fail('border', `border ${P.borderPct}% is outside 0.1-0.5%`);
// Matt, 2026-10-09: structural separators are brand teal; sampled paper is a separate retained input.
if (P.separator !== '#1a9ba1') fail('separator', `comic separator ${P.separator} must be brand teal #1a9ba1`);
if (!P.paperTile || !existsSync(join(site, 'public', P.paperTile))) fail('paper', `the paper texture tile ${P.paperTile} is missing (scripts/sample-reference-paper.mjs --write)`);
if (D.gutterPct && Math.abs(P.gutterPct - D.gutterPct) > 0.001) fail('gutter', `page gutter ${P.gutterPct} differs from the measured ${D.gutterPct}`);
const fa = bsCfg.fillAlpha || {}, [aLo, aHi] = fa.allowed || [0.8, 0.95];
for (const k of ['balloon', 'caption']) if (!(fa[k] >= aLo && fa[k] <= aHi)) fail('fill-alpha', `${k} fill alpha ${fa[k]} is outside ${aLo}-${aHi}`);
if (!out.some((o) => o[0] === 'FAIL')) ok('config', `separator ${P.separator}, historical paper ${P.paper}, gutter ${P.gutterPct}%, margin ${P.marginPct}%, border ${P.borderPct}% (short side); fills ${fa.balloon}/${fa.caption}`);
// Active whole-page guides must not bake the retired white/cream separators into future artwork.
for (const edition of ['.codex', '.claude']) {
  const art = join(repo, edition, 'skills/mtw-comic-story/scripts/art');
  const fragments = readFileSync(join(art, 'prompt-fragments.default.md'), 'utf8');
  for (const name of ['full-bleed', 'page-frame', 'page-frame-dark']) {
    const block = fragments.match(new RegExp('```fragment:' + name + '\\s*\\n([\\s\\S]*?)```'));
    if (!block || !block[1].includes('#1a9ba1')) fail('separator', `${edition} ${name} prompt must specify brand teal #1a9ba1`);
  }
  const template = readFileSync(join(art, 'page_tools.py'), 'utf8');
  if (!/SEPARATOR\s*=\s*\(26,\s*155,\s*161\)/.test(template) || !/Image\.new\('RGB',\s*\(W, H\),\s*SEPARATOR\)/.test(template) || !/outline=None if b\.get\('open'\) else SEPARATOR/.test(template)) fail('separator', `${edition} whole-page template must use brand teal for margins, gutters and frames`);
}

// ---------- CSS: print, not UI ----------
const css = read('src/styles/comic-story.css').replace(/\/\*[\s\S]*?\*\//g, '');
const cssRules = [
  [/border-radius\s*:\s*(?!0[;\s}]|0px)/i, 'rounded corners'],
  [/box-shadow\s*:/i, 'a box-shadow'],
  [/(^|[^-])filter\s*:/im, 'a CSS filter'],
  [/backdrop-filter/i, 'a backdrop-filter'],
  [/gradient\(/i, 'a gradient'],
  [/radial/i, 'a radial effect'],
  [/grain|vignette|shimmer|scanline/i, 'an overlay effect (grain, vignette, shimmer)'],
];
for (const [re, what] of cssRules) { const m = css.match(re); if (m) fail('css', `comic-story.css has ${what}: "${css.slice(Math.max(0, m.index - 20), m.index + 40).replace(/\s+/g, ' ')}"`); }
// Controls are the canonical motion toolbar's (the 8-bit Beat Comic's); comic-story.css styles no buttons of its own.
const ownButtons = css.match(/\.(rl-(skip|pause|list|prev|next|tag|eq|talk)|cs-(pause|tag|eq|issue-step|issues__close|issues-open--next))\b[^{]*{[^}]*}/g) || [];
ownButtons.filter((r) => !/^\.cs-strip > \.cs-issues-btn\s*{\s*margin-left:\s*auto;\s*}$/.test(r.trim()) && !/^(\.cs-strip )?\.rl-(talk|list)(,\s*\.cs-strip \.rl-(talk|list))*\s*{\s*display:\s*none;\s*}$/.test(r.trim())).forEach((r) => fail('controls', `comic-story.css styles a control itself ("${r.slice(0, 60)}"): use the motion toolbar's styles (hiding one with display: none is allowed)`));
// An overlapping box keeps a full gutter band of brand teal around it, never a shadow, offset or ghost.
if (!/\.cs-panel\.is-inset\s*{[^}]*outline:\s*var\(--cs-gut[^)]*\)\s*solid\s*var\(--cs-separator/.test(css)) fail('inset', 'an inset must have a full brand-teal gutter band (outline: var(--cs-gut) solid var(--cs-separator))');
for (const [selector, property] of [['cs-page', 'background'], ['cs-gutters', 'background'], ['cs-border', 'fill'], ['cs-loader__page', 'background-color']]) {
  const rule = css.match(new RegExp('\\.' + selector + '\\s*\\{([^}]*)\\}'));
  if (!rule || !new RegExp('(?:^|;)\\s*' + property + ':\\s*var\\(--cs-separator\\)\\s*(?:;|$)').test(rule[1])) fail('separator', `${selector} ${property} must use --cs-separator`);
}
const beatCss = read('src/styles/beat-comic.css').replace(/\/\*[\s\S]*?\*\//g, '');
if (!/\.rl-ink rect\s*{[^}]*stroke:\s*var\(--teal\)/.test(beatCss)) fail('separator', 'Beat Comic panel frames must use brand teal');
if (!/\.rl-link:focus-visible\s*{[^}]*outline:\s*2px solid var\(--teal\)/.test(beatCss)) fail('separator', 'Beat Comic panel focus must use brand teal');
const palette = new Set([...Object.values(pc.palette || {}), P.separator, P.paper, P.printedPaper, pc.ground, bsCfg.caption && bsCfg.caption.fill, '#050607', '#0f171a', '#4d5a5d', '#aab4b5', '#7e8a8c', '#123d3b', '#ddd5bf', '#071312f0', '#808080', '#101a1f', '#e8db1d'].filter(Boolean).map((c) => c.toLowerCase()));
const hexes = [...new Set((css.match(/#[0-9a-f]{3,8}\b/gi) || []).map((h) => h.toLowerCase()))].filter((h) => !palette.has(h));
if (hexes.length) fail('palette', `comic-story.css uses colours outside the palette: ${hexes.join(' ')}`); else ok('palette', 'every colour in comic-story.css is on the palette');
// Begin comic-strip reservation validator (shared with its browser-free escape fixtures).
function comicStripErrors(source) {
  const css = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const errors = [];
  const heights = [...css.matchAll(/--cs-strip-height\s*:\s*([^;}]+)/g)].map(m => m[1].trim());
  const roots = [...css.matchAll(/\.comic\s*\{([^}]*)\}/g)];
  if (!roots.some(m => /--cs-strip-height\s*:/.test(m[1]))) errors.push('--cs-strip-height must belong to the comic root');
  if (!heights.length || heights.some(v => !/^\d+(?:\.\d+)?px$/.test(v) || parseFloat(v) <= 0)) errors.push('--cs-strip-height must be declared as a positive px length');
  const reservation = 'calc(env(safe-area-inset-bottom)+var(--cs-strip-height))';
  for (const [selector, property] of [['cs-view', 'bottom'], ['cs-strip', 'height']]) {
    const rules = [...css.matchAll(new RegExp('\\.' + selector + '\\s*\\{([^}]*)\\}', 'g'))];
    const values = rules.flatMap(m => [...m[1].matchAll(new RegExp('(?:^|;)\\s*' + property + '\\s*:\\s*([^;}]+)', 'g'))].map(v => v[1].replace(/\s+/g, '')));
    if (!values.length || values.some(v => v !== reservation)) errors.push('.' + selector + ' ' + property + ' must reserve the shared strip height plus the bottom safe area');
  }
  return errors;
}
// End comic-strip reservation validator.
for (const error of comicStripErrors(css)) fail('overlay', error);

// ---------- Engine and component ----------
const js = read('public/scripts/comic-story.js'), astro = read('src/components/ComicStory.astro');
for (const [re, what] of [[/'cs-grain'|'cs-vignette'|cs-fx--/, 'engine-drawn overlays'], [/radialGradient|feGaussianBlur|drop-shadow/, 'blur or glow'], [/'x-(ink|scratch|tear)'/, 'fancy exits']]) if (re.test(withoutApprovedProjection(js))) fail('engine', `comic-story.js still has ${what}`);
if (!/\.cs-panel__alt\s*{\s*display:\s*none;\s*}/.test(css)) fail('placeholder', 'a box without art must be just the dark box: no label or description (.cs-panel__alt { display: none; })');
// The ghost opacity is one constant (page-constants ghostOpacity, a story's ghost, ?ghost=); never hard-coded.
if (/GHOST\s*=[^;\n]*\b0?\.3\b/.test(js) || /--cs-ghost,\s*0?\.\d|opacity:\s*0?\.3\b/.test(css)) fail('ghost', 'a hard-coded ghost opacity; read it from page-constants ghostOpacity (--cs-ghost)');
if (!(pc.ghostOpacity > 0 && pc.ghostOpacity < 1)) fail('ghost', `page-constants ghostOpacity ${pc.ghostOpacity} must be between 0 and 1`);
// Keep sampled texture while all structural surfaces use the independent branded separator.
if (!/\.cs-paperfx\s*{[^}]*--cs-paper-tile[^}]*multiply/.test(css)) fail('paper', 'retain the sampled paper texture layer (.cs-paperfx, multiply)');
if (!/setProperty\('--cs-separator', PAGE\.separator \|\| '#1a9ba1'\)/.test(js)) fail('separator', 'runtime must bind the branded separator independently from paper');
const strip = astro.indexOf('class="cs-strip"'), dock = astro.indexOf('<MotionToolbar');
if (strip < 0 || dock < strip) fail('overlay', 'the motion toolbar must sit inside the strip below the page, not over it');
if (/class="cs-skip"/.test(astro)) fail('chrome', 'Skip Intro is back: the comic is the page header, nothing folds away');
if (/cs-mast|cs-title|cs-vignette/.test(astro)) fail('chrome', 'presentation chrome (masthead, chapter slate, vignette) in the component');
if (!out.some((o) => o[1] === 'engine' || o[1] === 'overlay' || o[1] === 'chrome' || o[1] === 'placeholder')) ok('engine', 'no overlays, fancy exits, chrome or placeholder lettering; controls below the page');

// ---------- Balloons: the measured recipe, and no invented kinds ----------
// .claude/skills/mtw-comic-story/assets/reference-balloons/report.md: every balloon parameter stays inside the references' p10-p90 range.
{
  const R = { 'speech.padX': [0.506, 1.492], 'speech.padY': [0.596, 1.274], stroke: [0.1, 0.347], // measured p10 0.154 at +-0.07c accuracy (report Limits); Codex's visual reading 0.08-0.12c 'tail.length': [1.298, 2.374], 'tail.bendMaxDeg': [0, 5],
    'lettering.leadCap': [1.114, 1.533], 'caption.lead': [1.134, 1.51], 'looks.marvel.exponent': [2.25, 5.81], 'looks.crisis.exponent': [2.25, 5.81],
    'caption.pad.l': [0.566, 1.148], 'caption.pad.t': [0.284, 0.754], 'caption.pad.b': [0.474, 0.928], 'burst.stroke': [0.071, 0.297], 'lettering.shoutScale': [1.6, 3.5] };
  const get = (o, k) => k.split('.').reduce((a, x) => (a == null ? a : a[x]), o), before = out.length;
  for (const [k, [lo, hi]] of Object.entries(R)) { const v = get(bsCfg, k); if (!(v >= lo && v <= hi)) fail('recipe', `balloon-style ${k} = ${v} is outside the references' p10-p90 range ${lo}-${hi}`); }
  const sb = get(bsCfg, 'fear.bumps') || [], sp = get(bsCfg, 'burst.spikes') || [];
  if (!(sb[0] >= 8 && sb[1] <= 17)) fail('recipe', `fear scallops ${sb} outside the measured 8-17`);
  if (!(sp[0] >= 6 && sp[1] <= 15)) fail('recipe', `burst spikes ${sp} outside the measured 6-15`);
  // No cloud thought balloons in any reference (root, 2026-09-29): no lobes or beads in the config or the engine.
  if ((bsCfg.thought && bsCfg.thought.lobeCaps) || /lobeCaps|lobeJitter|beadRun/.test(js)) fail('invented', 'invented: cloud thought balloon (thinking is the yellow balloon with the bead stem; the references have no clouds)');
  // Lettering is composed by the engine; the browser never wraps it or breaks a word ("WEDNES DAY").
  if (/overflow-wrap:\s*(break-word|anywhere)|word-break:\s*break-all|hyphens:\s*auto/.test(css)) fail('lettering', 'comic-story.css lets the browser break a word inside lettering');
  if (!/function composeLines/.test(js) || !/\.cs-b\s*{[^}]*white-space:\s*nowrap/.test(css)) fail('lettering', 'lettering must be composed into lines by the engine (composeLines) with white-space: nowrap');
  // Measured colours, never re-tinted to match another surface (Matt, 2026-09-29: "i think you invented the color change"):
  // balloons are the measured #f4f4f4 (white is the standard); the yellow balloon means thinking and always has the bead
  // stem (Matt, 2026-09-29: "the stem of the bubble should standardize that"); captions are yellow square boxes.
  if ((bsCfg.fill || '').toLowerCase() !== '#f4f4f4') fail('colour', `balloon fill ${bsCfg.fill} is not the measured reference fill #f4f4f4 (shapes.raw-per-shape.json)`);
  if (((bsCfg.thought || {}).fill || '').toLowerCase() !== '#ede614') fail('colour', `thought balloon fill ${(bsCfg.thought || {}).fill} is not the measured Spider-Man #33 yellow #ede614`);
  if (!/var PAPER = BS\.fill/.test(js)) fail('colour', 'the engine must fill balloons with balloon-style fill (the measured #f4f4f4), not a CSS variable or the page paper');
  const dg = (js.match(/function drawGroup[\s\S]*?\r?\n  }\r?\n/) || [''])[0];
  if (/captionFill|#eae619|#f9ddb6|--cs-page-paper|#f8f2e4/i.test(dg)) fail('colour', 'a balloon (not a caption) is drawn in caption yellow or the page paper colour: balloons are white #f4f4f4, thinking is #ede614 with the bead stem');
  // The stem standardizes the meaning: yellow always with beads, beads never on white.
  const op = (js.match(/function outlinePath[\s\S]*?\r?\n  }\r?\n/) || [''])[0];
  if (!/kind === 'thought'[^\n]*beadStem|beadStem[^\n]*kind === 'thought'/.test(op + dg)) fail('stem', 'a thought (yellow) balloon must always carry the bead stem, and only it (beadStem keyed to kind thought)');
  if (/--cs-balloon/.test(css)) fail('colour', 'a --cs-balloon colour in comic-story.css: balloons take the measured fill from balloon-style.json');
  if (out.length === before) ok('recipe', 'balloon-style inside the measured ranges; balloons the measured #f4f4f4, yellow only in captions; no cloud thought; lettering composed, never a broken word');
}

// Matt, 2026-10-09: only these authored art-only focus effects are permitted.
// Keep this validator shared with the regression extraction; unknown fields are rejected.
function panelMotionErrors(m) {
  if (m == null) return [];
  if (typeof m !== 'object' || Array.isArray(m)) return ['must be a declarative object'];
  const errors = [], presets = new Set(['still', 'push', 'drift-left', 'drift-right', 'shadow', 'light']);
  if (!presets.has(m.preset)) errors.push('unknown preset ' + m.preset);
  for (const k of Object.keys(m)) if (!['preset', 'beats', 'strength'].includes(k)) errors.push('unknown field ' + k);
  if (m.beats != null && !(typeof m.beats === 'number' && Number.isFinite(m.beats) && m.beats >= 2 && m.beats <= 8)) errors.push('beats must be finite and within 2-8');
  if (m.strength != null && !(typeof m.strength === 'number' && Number.isFinite(m.strength) && m.strength >= 0 && m.strength <= 1)) errors.push('strength must be finite and within 0-1');
  return errors;
}
// End panel-motion validator.


// Sound contract lives in comic-sound-contract.mjs, shared with story-check.


// ---------- Stories ----------
const ALLOWED = new Set(['speech', 'thought', 'burst', 'fear', 'caption', 'place']);
const VILLAINS = ['Slop', 'Hallucination', 'Snowball', 'Blindspot', 'Shadow', 'Shelf', 'Amnesia', 'Rogue Agent', 'Overhead', 'Schultz', 'Nilan', 'Williams', 'Domi', 'Grimson', 'McSorley', 'Kocur', 'Hunter', 'Twist'];
const named = (t) => VILLAINS.filter((v) => new RegExp(`\\b${v}\\b`).test(t || ''));
const near = (a, b, t) => Math.abs(a - b) <= t;
for (const f of readdirSync(join(site, 'src/data/comic-stories')).filter((f) => f.endsWith('.ts') && !['index.ts', 'types.ts', 'placeholder.ts'].includes(f))) {
  const mod = await import(pathToFileURL(join(site, 'src/data/comic-stories', f)).href);
  const story = Object.values(mod).find((v) => v && v.scenes);
  if (!story) continue;
  const tag = f.replace(/\.ts$/, ''), before = out.length;
  for (const error of comicSoundErrors({ soundAssets: story.soundAssets })) fail('sound', `${tag}: ${error}`);
  let rapid = 0;
  for (const sc of story.scenes) {
    for (const error of comicLayerErrors(sc)) fail('layers', `${tag}/${sc.id}: ${error}`);
    for (const error of comicSoundErrors(sc)) fail('sound', `${tag}/${sc.id}: ${error}`);
    if (named(sc.title).length) fail('villain', `${tag}/${sc.id}: scene title names ${named(sc.title)}`);
    if (sc.exit) fail('exit', `${tag}/${sc.id}: exit "${sc.exit}" (fancy exits were rejected: boxes simply fade)`);
    if (sc.rapid) rapid++;
    else {
      const ps = sc.panels.filter((p) => !p.inset), groups = [];
      ps.forEach((p) => { const g = groups.find((x) => near(x[0].r[1], p.r[1], 0.01) && near(x[0].r[3], p.r[3], 0.01)); if (g) g.push(p); else groups.push([p]); });
      if (groups.some((g) => g.length > 1 && g.every((p) => near(p.r[2], g[0].r[2], 0.03)) && !(g[0].run && g.every((p) => p.run === g[0].run)))) fail('grid', `${tag}/${sc.id}: equal boxes in a row that are not one run (an even grid)`);
    }
    for (const p of sc.panels) for (const error of panelMotionErrors(p.motion)) fail('motion', `${tag}/${sc.id}/${p.id}: ${error}`);
    for (const p of sc.panels) for (const b of p.balloons || []) {
      const bt = `${tag}/${sc.id} "${b.text.slice(0, 28).replace(/\n/g, ' ')}"`;
      if (!ALLOWED.has(b.kind)) fail('kind', `${bt}: kind "${b.kind}" is not used in the reference comics (use speech)`);
      if (b.steered != null) fail('kind', `${bt}: steered belongs to the removed machine balloon`);
      if (!b.state) fail('voice', `${bt}: no state; the voice decides the balloon (the measured usage table)`);
      if (b.kind === 'thought' && !b.tail) fail('stem', `${bt}: a thought (the yellow balloon) needs a tail point for its bead stem toward the thinker`);
      if (b.kind === 'thought' && b.state !== 'thought') fail('stem', `${bt}: the yellow balloon means thinking only (state thought), not ${b.state}`);
      if ((b.kind === 'caption' || b.kind === 'place' || b.who === 'narrator') && named(b.text).length) fail('villain', `${bt}: narration names ${named(b.text)}`);
    }
  }

  if (story.next) {
    if (/^next\s*:/i.test(story.next.heading || '') || named(story.next.heading).length) fail('next', `${tag}: NEXT heading "${story.next.heading}" (no "Next:", no villain names)`);
    for (const c of story.next.choices || []) if (/^next\s*:/i.test(c.label) || named(c.label).length) fail('next', `${tag}: choice "${c.label}"`);
  }
  if (out.length === before) ok('story', `${tag}: clean`);
}

// ---------- Anti-invention: everything used must be cited (assets/style-provenance.json) ----------
const prov = JSON.parse(readFileSync(join(skillAssets, 'style-provenance.json'), 'utf8')), known = new Set([...Object.keys(prov.elements || {}), ...Object.keys(prov.exceptions || {})].map((k) => k.toLowerCase()));
const invented = new Set(), need = (k) => { if (!known.has(k.toLowerCase())) invented.add(k); };
(css.match(/#[0-9a-f]{3,8}\b/gi) || []).forEach((h) => need(`colour:${h.toLowerCase()}`));
(css.match(/@font-face\s*{[^}]*font-family:\s*'([^']+)'/gi) || []).forEach((m) => need(`font:${m.match(/font-family:\s*'([^']+)'/i)[1]}`));
(css.match(/@keyframes\s+([\w-]+)/g) || []).forEach((m) => need(`animation:${m.split(/\s+/)[1]}`));
for (const f of readdirSync(join(site, 'src/data/comic-stories')).filter((f) => f.endsWith('.ts') && !['index.ts', 'types.ts', 'placeholder.ts'].includes(f))) {
  const story = Object.values(await import(pathToFileURL(join(site, 'src/data/comic-stories', f)).href)).find((v) => v && v.scenes);
  if (!story) continue;
  for (const sc of story.scenes) {
    if (sc.rapid) need('layout:equal-row-rapid');
    if (sc.art) need('art:page');
    for (const p of sc.panels) {
      for (const k of ['open', 'clip', 'inset', 'bleed', 'run']) if (p[k]) need(`layout:${k}`);
      if (p.host) need('layout:cascade');
      if (p.motion) need(`motion:${p.motion.preset}`);
      for (const b of p.balloons || []) { need(`balloon:${b.kind}`); if (b.state) need(`voice:${b.state}`); for (const k of ['chain', 'edge', 'breakout', 'across']) if (b[k]) need(`balloon:${k}`); if (b.em) need('lettering:bold-italic-stress'); }
    }
  }
}
if (invented.size) [...invented].forEach((x) => fail('invented', `invented: ${x} (no citation in assets/style-provenance.json)`)); else ok('invented', 'every colour, font, animation, balloon kind and layout field used has a citation or an exception');

// ---------- Art: no blur, glow or rounded panel frames in the comic SVGs ----------
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const svgs = existsSync(join(site, 'public/comic')) ? walk(join(site, 'public/comic')).filter((f) => f.endsWith('.svg')) : [];
let artBad = 0;
for (const f of svgs) {
  const t = readFileSync(f, 'utf8');
  if (/feGaussianBlur|radialGradient|drop-shadow/.test(t)) { artBad++; fail('art', `${f.replace(site, 'site')}: blur, glow or a radial gradient`); }
}
if (!artBad) ok('art', `${svgs.length} comic SVGs: no blur, glow or radial gradients`);

// ---------- Images live in the image library, never in discussion/ (Matt, 2026-10-02) ----------
// Every Comic B image (art, screenshots, style-check sheets, contact sheets, crops) goes to wiki/image-library and is
// registered there so Matt can preview it; tools use scripts/comic-story-library.mjs. The reference pages Matt supplied
// (discussion/reference-comics/) are inputs, not generated images, and stay where they are.
const imgRe = /\.(png|jpe?g|webp|gif|svg|avif)$/i, disc = join(repo, 'discussion');
const strays = existsSync(disc) ? walk(disc).filter((f) => imgRe.test(f) && /comic/i.test(f) && !f.includes(join('discussion', 'reference-comics'))) : [];
if (strays.length) fail('library', `${strays.length} Comic B image(s) under discussion/ (move them into wiki/image-library and register them): ${strays.slice(0, 5).map((f) => f.replace(repo, '').slice(1)).join(', ')}${strays.length > 5 ? ', ...' : ''}`);
else ok('library', 'no Comic B images under discussion/: they are all in the image library');

let n = 0;
for (const [lvl, rule, msg] of out) { if (lvl === 'FAIL') n++; console.log(`${lvl.padEnd(4)} ${rule.padEnd(11)} ${msg}`); }
console.log(n ? `\n${n} deslop failure(s)` : '\ndeslop: clean');
process.exit(n ? 1 : 0);
