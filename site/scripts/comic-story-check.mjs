#!/usr/bin/env node
// Story check for a Comic Story (Comic B; skill: mtw-comic-story). Static rules for one story file (or the story a page
// ships), with the song's beat map when given:
//   scenes sit in order inside the song, do not overlap and fit before NEXT; panels sit inside the page and do not
//   overlap; panels arrive in order inside their scene; balloons sit inside their panel, land inside the scene, keep
//   1.5 beats apart in a panel and stay short; tails and steering are only where they mean something; every art file
//   matches runtime page AVIF/WebP derivatives or SVG paths (missing: WARN, or ERROR with --require-art); with a
//   beat map, holds sit on the song's dead stops and scenes start on bars.
//   --registry (scripts/comic-story-registry.mjs): the issue registry matches the pages and every issue reaches every
//   other within 2 interactions; with --url it also checks the served overlay, prev/next and reader links.
//   Reading time (Matt, 2026-09-28: "give the human time to read"): each balloon needs about 1 s plus 0.3 s a word, read
//   in order; a box's balloons must be readable before the next box reveals, and the last box's before the scene's exit
//   (the engine's exit takes max(1.5 beats, 1.2 s)). Boxes exit with staggered fades. Breakout balloons may
//   leave their box only when flagged, and warn when they would cover another box's balloon.
//   Box shapes: boxes overlap only when one is an inset; clip polygons have 3+ points inside the box and real area.
//   Proportional sizing (Matt, 2026-09-28: "comic books never do this unless it's a rapid few sections"): a tier of
//   equal boxes warns unless the scene is `rapid`, and more than one rapid scene an issue warns. Villains are announced by
//   the trouble they cause, not by name: an ERROR when a villain's name (or an enforcer surname) appears in a scene
//   title, a caption or place balloon, the NEXT heading or a choice label (except the validated red-agent identity caption); a WARN on the word "villain" in any text a
//   reader sees. A song may loop under a longer story (music.loop, song beats on phrase boundaries).
//   Anchors and introductions (2026-10-04): every scene opens with a place caption unless marked `continues`, and every
//   cast member who speaks, including the embodied Rogue Agent, has an explicit narrator characterIntro before speaking (ERROR).
//   Opening context: a first narrated place establishes where/when, or the retained sceneSetup caption does so;
//   explicit sceneSetup keeps its bottom-right geometry and separate budget. Cold-reader review still checks meaning.
// Usage: node scripts/comic-story-check.mjs --story src/data/comic-stories/home.ts [--map <beat map or profile json>]
//        node scripts/comic-story-check.mjs --url http://127.0.0.1:8789/home-b/ [--map ...]
//        node scripts/comic-story-check.mjs --registry [--url http://127.0.0.1:8789/]
// --require-art promotes missing/empty scene, panel, NEXT and registry-cover assets to ERROR for delivery.
// Exit code 1 on any ERROR; WARN lines are judgement calls to look at.
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { registerHooks } from 'node:module';
import { registryCheck } from './comic-story-registry.mjs';
import { checkComicArt } from './comic-story-art-check.mjs';
import { checkComicPhone } from './comic-story-phone-check.mjs';
import { comicSoundErrors } from './comic-sound-contract.mjs';
import { comicBoxDefectWarnings } from './comic-box-defects.mjs';
import { comicSourceErrors, comicSpeakerErrors } from './comic-view-contract.mjs';
// A source-owned mouth is the runtime's real tail target, even without a legacy hand-written `tail`.
// This is metadata recognition only; art checks and native pointer/face review still apply independently.
export function comicBalloonHasSourceTail(panel, balloon) {
  let sources = [...(panel.views || []), ...(panel.staticArt ? [panel.staticArt] : [])];
  if (panel.fallbackView !== undefined) {
    // An explicit complete first group replaces the static cleanplate as the runtime fallback.
    // Reject missing/foreign/flat/unowned references rather than treating the marker as proof.
    const refs = panel.fallbackView;
    if (!refs || typeof refs !== 'object' || Array.isArray(refs) || Object.keys(refs).some(k=>!['desktop','phone'].includes(k))) return false;
    for (const media of ['desktop','phone']) {
      const matches = (panel.views || []).filter(v=>typeof refs[media] === 'string' && v.id === refs[media]);
      const v = matches[0];
      if (matches.length !== 1 || v.at !== 0 || v.media && v.media !== media || !v.canonicalSource ||
          !Array.isArray(v.layers) || v.layers.length < 2 || v.layers[0]?.role !== 'background' ||
          v.layers.some(l=>!l?.canonicalSource || comicSourceErrors({src:l.src,canonicalSource:l.canonicalSource},panel,{phone:true}).length)) return false;
    }
    sources = [...(panel.views || [])];
  } else if (!panel.staticArt) return false; // do not hide an unbound page-art fallback
  if (!sources.length) return false;
  const valid = source => !!source.canonicalSource && !!source.speakers?.[balloon.who] &&
    !comicSpeakerErrors({[balloon.who]:source.speakers[balloon.who]}).length &&
    !comicSourceErrors(source,panel,{staticArt:source.at === undefined}).length &&
    (source.layers || []).filter(l=>l.agentPlacement?.speakerIds?.includes(balloon.who)).every(l=>!!l.canonicalSource && !comicSourceErrors({src:l.src,canonicalSource:l.canonicalSource},panel,{phone:true}).length);
  return sources.every(source => {
    if (!valid(source)) return false;
    const ph=source.phone;
    if (!ph || source.media === 'desktop') return true;
    if (ph.src && ph.src !== source.src && (!ph.speakers?.[balloon.who] || !ph.canonicalSource)) return false;
    return valid({src:ph.src || source.src,ar:ph.ar || source.ar || [0,0,1,1],canonicalSource:ph.canonicalSource || source.canonicalSource,speakers:ph.speakers || source.speakers});
  });
}
// Opening business context (Matt, 2026-10-09): these are structural checks, not a semantic or visual verdict.
// Exactly named development specimens are exempt from a missing setup; `issue: 0` alone never exempts the demo.
export function checkComicSceneSetup(story) {
  const errors = [], setups = [];
  const specimens = new Map([['_lab', 'Style lab.'], ['placeholder', 'Engine test.']]);
  const specimen = story.issue === 0 && specimens.get(story.id) === story.title;
  (story.scenes || []).forEach((scene, si) => (scene.panels || []).forEach((panel, pi) =>
    (panel.balloons || []).forEach((balloon) => {
      if (balloon.sceneSetup === undefined) return;
      const tag = `scene ${scene.id} box ${pi + 1}: opening context`;
      if (balloon.sceneSetup !== true) { errors.push(`${tag}: sceneSetup must be true when present`); return; }
      setups.push(balloon);
      if (si !== 0 || pi !== 0) errors.push(`${tag}: belongs in the first scene's first box`);
      if (balloon.kind !== 'caption' || balloon.who !== 'narrator' || balloon.state !== 'narration')
        errors.push(`${tag}: must be a narrator caption with state narration`);
      if (balloon.characterIntro || balloon.tail || balloon.chain || balloon.across || balloon.breakout || balloon.anchor)
        errors.push(`${tag}: cannot be a character introduction, have a tail/join/breakout or use a free anchor`);
      if (balloon.edge && balloon.edge !== 'bottom') errors.push(`${tag}: cannot butt into a different edge`);
      const placement = (b, label) => {
        if (!Number.isFinite(b.x) || !Number.isFinite(b.y) || !Number.isFinite(b.w) ||
            b.x < 0 || b.y < 0.9 || b.y > 0.95 || b.w <= 0 || b.x + b.w < 0.9 || b.x + b.w > 1.02)
          errors.push(`${tag}: ${label} needs finite x/y/w, y 0.9-0.95 and x + w 0.9-1.02 for its bottom-right caption`);
      };
      placement(balloon, 'desktop');
      if (balloon.phone) {
        placement({ ...balloon, ...balloon.phone }, 'phone');
        if (balloon.phone.anchor || balloon.phone.tail || balloon.phone.chain)
          errors.push(`${tag}: phone cannot use a free anchor, tail or join`);
      }
      const text = String(balloon.text || '').trim(), words = text.split(/\s+/).filter(Boolean).length;
      if (!text) errors.push(`${tag}: caption text is empty`);
      if (text.length > 360 || words > 60) errors.push(`${tag}: ${words} words / ${text.length} characters exceeds the 60-word / 360-character context budget`);
    })));
  const opening = story.scenes?.[0]?.panels?.[0]?.balloons || [];
  const first = opening[0], narratedPlace = first?.kind === 'place' && first.who === 'narrator' && first.state === 'narration' && String(first.text || '').trim();
  if (narratedPlace) {
    const count = opening.filter(b => b.kind === 'place').length;
    if (count > 1) errors.push(`opening context: duplicate opening place captions (${count})`);
    const text = String(first.text).trim();
    if (text.length > 360 || text.split(/\s+/).length > 60) errors.push('opening context: narrated place exceeds the 60-word / 360-character context budget');
  }
  if (!specimen && setups.length !== 1 && !narratedPlace) errors.push(`opening context: first scene's first box needs a narrated place or exactly one sceneSetup narrator caption; found ${setups.length}`);
  else if (setups.length > 1) errors.push(`opening context: duplicate sceneSetup captions (${setups.length})`);
  return errors;
}

// Character introductions are structural identity checks, never proof of who is actually drawn.
// Pure damage motifs keep their damage-first reveal; the embodied red agent needs an explicit identity caption.
export function checkComicIntroductions(story) {
  const errors = [];
  const names = {
    'second-brain': ['Second Brain', 'The Second Brain'], matt: ['Matt'], claude: ['Claude'], codex: ['Codex'], dana: ['Dana Dryden', 'Dana'],
    marco: ['Marco Lemieux', 'Marco'], ruth: ['Ruth Orr', 'Ruth'], sam: ['Sam Howe', 'Sam'],
    joan: ['Joan Mikita', 'Joan'], potvin: ['Ryan Potvin'], rogue: ['The rogue agent', 'Rogue agent'],
    grok: ['Grok'], copilot: ['Copilot'], opencode: ['OpenCode'],
    'frontier-league': ['Frontier League', 'The Frontier League'], 'local-crew': ['Local Crew', 'The Local Crew'],
  };
  const normalize = (text) => String(text || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const withoutClock = text => normalize(text).replace(/^(?:(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday),?\s+)?(?:\d{1,2}:\d{2}(?:\s*[ap]\.m\.)?|\d{1,2}\s*[ap]\.m\.)(?:\.\s*|\s+)/, '');
  const identity = (balloon) => {
    if (!['caption','place'].includes(balloon.kind)) return null;
    const text = withoutClock(balloon.text);
    for (const [id, aliases] of Object.entries(names))
      if (aliases.some((name) => text === name.toLowerCase() || text.startsWith(name.toLowerCase() + '.') || text.startsWith(name.toLowerCase() + ','))) return id;
    // The retained silent portrait is an identity caption even though George never speaks.
    if (/^george armstrong(?:\.| |$)/.test(text)) return 'george';
    return null;
  };
  const validIntro = (balloon) => balloon?.characterIntro === true && ['caption','place'].includes(balloon.kind) &&
    balloon.who === 'narrator' && balloon.state === 'narration' && !balloon.sceneSetup && identity(balloon);
  const villains = ['Slop', 'Hallucination', 'Snowball', 'Blindspot', 'Shadow', 'Shelf', 'Amnesia', 'Rogue Agent',
    'Overhead', 'Schultz', 'Nilan', 'Williams', 'Domi', 'Grimson', 'McSorley', 'Kocur', 'Hunter', 'Twist'];
  const named = (text) => villains.filter((name) => new RegExp(`\\b${name}\\b`, 'i').test(normalize(text)));
  const introduced = new Set();
  const voices = new Set(['speech', 'thought', 'burst', 'fear', 'machine', 'whisper']);
  (story.scenes || []).forEach((scene, si) => {
    const first = scene.panels?.[0]?.balloons?.[0];
    if (!scene.continues && !(first?.kind === 'place' || validIntro(first) && withoutClock(first.text) !== normalize(first.text)))
      errors.push(`scene ${si + 1} (${scene.id}): its first box needs a place caption (where and when) first, or mark the scene continues`);
    if (named(scene.title).length)
      errors.push(`scene ${scene.id}: title "${scene.title}" names ${named(scene.title).join(', ')}; villains enter through the trouble they cause`);
    (scene.panels || []).forEach((panel, pi) => [...(panel.balloons || [])].sort((a, b) => a.at - b.at).forEach((balloon) => {
      const tag = `scene ${si + 1} (${scene.id}) box ${pi + 1}`;
      const id = identity(balloon), valid = validIntro(balloon);
      if (id && balloon.characterIntro !== true) errors.push(`${tag}: identifying character caption needs characterIntro: true`);
      if (balloon.characterIntro !== undefined && !valid)
        errors.push(`${tag}: characterIntro belongs only on an identifying narrator caption/place with state narration`);
      if (valid) introduced.add(id);
      if (voices.has(balloon.kind) && names[balloon.who] && !introduced.has(balloon.who))
        errors.push(`${tag}: ${names[balloon.who][0]} speaks before an explicit introduction caption`);
      if (balloon.kind === 'caption' || balloon.kind === 'place' || balloon.who === 'narrator') {
        const anchor = a => Array.isArray(a?.mouth) && a.mouth.length === 2 && a.mouth.every(Number.isFinite) && Array.isArray(a.face) && a.face.length === 4 && a.face.every(Number.isFinite) && a.face[2] > 0 && a.face[3] > 0;
        const sourceOwned = (panel.views || []).some(v => anchor(v.speakers?.rogue)) || anchor(panel.staticArt?.speakers?.rogue) || anchor(panel.speakers?.rogue);
        const actionOwned = (panel.balloons || []).some(b => b.who === 'rogue' && voices.has(b.kind) && /\b(?:send(?:ing|s)?|copy(?:ing|ies)?|overwrite(?:s|ing)?|delet(?:e|es|ing))\b/i.test(String(b.text)));
        // Retained name-first captions remain valid; the new combined clock/action identity must identify the
        // source-owned actor performing that trouble, never turn a location label into a villain roll call.
        const timestamped = withoutClock(balloon.text) !== normalize(balloon.text);
        const rogueIntro = valid && id === 'rogue' && (!timestamped && balloon.kind === 'caption' || sourceOwned && actionOwned && /\b(?:send(?:ing|s)?|copy(?:ing|ies)?|overwrite(?:s|ing)?|delet(?:e|es|ing))\b/i.test(String(balloon.text)));
        const forbidden = named(balloon.text).filter((name) => !(rogueIntro && name === 'Rogue Agent'));
        if (forbidden.length) errors.push(`${tag}: narration "${String(balloon.text).slice(0, 40)}" names ${forbidden.join(', ')}; use damage-first staging, not a roll call`);
      }
    }));
  });
  if (story.next) {
    if (named(story.next.heading).length) errors.push(`NEXT heading names ${named(story.next.heading).join(', ')}; tease with a story moment, never a roll call`);
    for (const choice of story.next.choices || []) {
      // A collection link says shelf in its ordinary navigation sense; story teasers still name damage first.
      const collectionNavigation = choice.href === '/comics/' && /^back to (?:the )?shelf\.?$/i.test(normalize(choice.label));
      const forbidden = named(choice.label).filter((name) => !(name === 'Shelf' && collectionNavigation));
      if (forbidden.length) errors.push(`choice "${choice.label}" names ${forbidden.join(', ')}; one line of trouble instead`);
    }
  }
  return errors;
}

// Astro resolves extensionless TypeScript imports ('./home'); Node needs the .ts added.
registerHooks({ resolve(spec, ctx, next) { try { return next(spec, ctx); } catch (e) { if (/^\.\.?\//.test(spec) && !/\.[a-z]+$/i.test(spec)) return next(spec + '.ts', ctx); throw e; } } });

const here = dirname(fileURLToPath(import.meta.url));
const site = resolve(here, '..');
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(`--${name}`); return i > -1 ? args[i + 1] : def; };
const storyFile = opt('story', null), url = opt('url', null), mapFile = opt('map', null);
const requireArt = args.includes('--require-art');
if (args.includes('--registry')) {
  const res = await registryCheck(site, url ? new URL(url).origin : null, { requireArt });
  let n = 0;
  for (const [lvl, msg] of res) { if (lvl === 'ERROR') n++; console.log(`${lvl.padEnd(5)} ${msg}`); }
  console.log(n ? `\n${n} error(s)` : '\nregistry: no errors');
  process.exit(n ? 1 : 0);
}
if (!storyFile && !url) { console.error('Usage: node scripts/comic-story-check.mjs --story <file.ts> | --url <page> [--map <beat-map.json>]'); process.exit(2); }

let story;
if (storyFile) {
  const mod = await import(pathToFileURL(resolve(process.cwd(), storyFile)).href); // Node 22.18+/24 strips TypeScript types
  story = Object.values(mod).find((v) => v && typeof v === 'object' && Array.isArray(v.scenes));
  if (!story) { console.error(`No exported ComicStory in ${storyFile}`); process.exit(2); }
} else {
  const html = await (await fetch(`${url}${url.includes('?') ? '&' : '?'}reel=off`)).text();
  const m = html.match(/<script type="application\/json" id="comic-story">([\s\S]*?)<\/script>/);
  if (!m) { console.error(`No #comic-story on ${url}`); process.exit(2); }
  story = JSON.parse(m[1]);
}
let map = null;
if (mapFile) { const raw = JSON.parse(readFileSync(mapFile, 'utf8')); map = raw.beatMap || raw; }

const out = [];
const err = (msg) => out.push(['ERROR', msg]);
const warn = (msg) => out.push(['WARN', msg]);
const ok = (msg) => out.push(['ok', msg]);
// The component uses this exact edition's page constants and registry artSrc for NEXT images.
const { page } = JSON.parse(readFileSync(join(site, '../.claude/skills/mtw-comic-story/assets/page-constants.json'), 'utf8'));
const { artSrc } = await import(pathToFileURL(join(site, 'src/data/comic-stories/index.ts')).href);
out.push(...checkComicArt(story, { publicDir: join(site, 'public'), widths: page.artWidths || [1600], requireArt, resolveChoice: artSrc }));
const EPS = 1e-6;
const inside = (r) => r[0] >= -EPS && r[1] >= -EPS && r[2] > 0 && r[3] > 0 && r[0] + r[2] <= 1 + EPS && r[1] + r[3] <= 1 + EPS;
const overlap = (a, b) => a[0] + a[2] > b[0] + EPS && b[0] + b[2] > a[0] + EPS && a[1] + a[3] > b[1] + EPS && b[1] + b[3] > a[1] + EPS;

for (const message of checkComicSceneSetup(story)) err(message);

// Header.
for (const k of ['id', 'issue', 'title', 'bpm', 'beats', 'music', 'scenes', 'next']) if (story[k] == null) err(`missing ${k}`);
if (!/^[a-z0-9-]+$/.test(story.id || '')) err(`id "${story.id}" should be a folder name (a-z, 0-9, -)`);
if (story.music && !existsSync(join(site, 'public', story.music.src || ''))) err(`music ${story.music.src} not found in public/`);
if (story.music && !/^Music: .+ by .+/.test(story.music.credit || '')) warn(`credit "${story.music?.credit}" should read "Music: <title> by <artist>"`);
if (map) {
  if (Math.abs(story.bpm - map.bpm) > 0.01) err(`bpm ${story.bpm} differs from the map's ${map.bpm}`); else ok(`bpm ${story.bpm} matches the map`);
  if (Math.abs(story.music.offset - map.offset) > 0.03) err(`offset ${story.music.offset} differs from the map's ${map.offset}`); else ok(`offset ${story.music.offset} s`);
  const nextEnd = story.music.offset + (story.next.b + 1.5) * 60 / story.bpm;
  if (map.duration && nextEnd > map.duration && !story.music.loop) warn(`the NEXT page lands at ${nextEnd.toFixed(1)} s, after the song ends (${map.duration} s); it still shows, over the song's loop`);
}

// Scenes.
const scenes = story.scenes || [];
const ids = new Set();
let prevEnd = 0;
scenes.forEach((sc, i) => {
  const tag = `scene ${sc.id}`;
  if (ids.has(sc.id)) err(`${tag}: duplicate id`); ids.add(sc.id);
  if (sc.b < prevEnd - EPS) err(`${tag}: starts on beat ${sc.b}, before the previous scene ends (${prevEnd})`);
  if (i > 0 && sc.b > prevEnd + EPS) warn(`${tag}: a gap of ${sc.b - prevEnd} beats before it (black)`);
  if (sc.l < 6) warn(`${tag}: only ${sc.l} beats; a camera move and a balloon need more`);
  prevEnd = sc.b + sc.l;
  if (map && map.beatsPerBar && sc.b % map.beatsPerBar !== 0) warn(`${tag}: starts on beat ${sc.b}, not on a bar`);
  else if (sc.b % 4 !== 0) warn(`${tag}: starts on beat ${sc.b}, not on a bar of four`);
  if (!sc.panels?.length) { err(`${tag}: no panels`); return; }
  for (const message of checkComicPhone(sc)) err(`${tag}: ${message}`);
  (sc.hold || []).forEach(([a, b]) => { if (!(a >= 0 && b > a && b <= sc.l)) err(`${tag}: hold [${a}, ${b}] outside the scene`); });
  if (map && map.stops) {
    const stops = (map.stops || []).map((s) => (Array.isArray(s) ? s[0] : s.beat ?? s));
    stops.filter((s) => s >= sc.b && s < sc.b + sc.l).forEach((s) => {
      if (!(sc.hold || []).some(([a, b]) => s - sc.b >= a - 0.5 && s - sc.b <= b + 0.5)) warn(`${tag}: the song stops on beat ${s} with no hold`);
    });
  }
  let prevAt = -1;
  sc.panels.forEach((p, pi) => {
    const pt = `${tag} panel ${pi + 1} (${p.img})`;
    if (!inside(p.r)) err(`${pt}: rect ${JSON.stringify(p.r)} is outside the page`);
    sc.panels.slice(0, pi).forEach((q, qi) => { if (overlap(p.r, q.r) && !p.inset && !q.inset) err(`${pt}: overlaps panel ${qi + 1} (only an inset may overlap)`); });
    if (p.clip) {
      const c = p.clip, area = Math.abs(c.reduce((a, q, k) => { const r = c[(k + 1) % c.length]; return a + q[0] * r[1] - r[0] * q[1]; }, 0)) / 2;
      if (!Array.isArray(c) || c.length < 3) err(`${pt}: clip needs 3 or more points`);
      else if (c.some((q) => q.length !== 2 || q[0] < -0.001 || q[1] < -0.001 || q[0] > 1.001 || q[1] > 1.001)) err(`${pt}: clip points must be box fractions 0-1`);
      else if (area < 0.2) err(`${pt}: clip polygon covers only ${(area * 100).toFixed(0)}% of the box`);
    }
    if (p.inset && p.open) warn(`${pt}: an inset that is also open has no border to sit on`);
    // A cascade (Crisis #8's stepped column; Matt, 2026-09-28): insets on a host box, stepping diagonally, revealed after
    // the host, one after another. Neighbouring insets may share only a sliver (their gutter bands), never art.
    if (p.inset) sc.panels.slice(0, pi).forEach((q, qi) => {
      if (!q.inset || !overlap(p.r, q.r)) return;
      const ow = Math.min(p.r[0] + p.r[2], q.r[0] + q.r[2]) - Math.max(p.r[0], q.r[0]), oh = Math.min(p.r[1] + p.r[3], q.r[1] + q.r[3]) - Math.max(p.r[1], q.r[1]);
      if (ow > 0.035 && oh > 0.035) err(`${pt}: its art overlaps inset ${qi + 1} (${(ow * 100).toFixed(1)}% x ${(oh * 100).toFixed(1)}% of the page); cascade insets step so only their gutter bands touch`);
    });
    if (p.host) {
      const h = sc.panels.find((q) => q.id === p.host);
      if (!h) err(`${pt}: host "${p.host}" is not a box id in this scene`);
      else {
        if (!p.inset) err(`${pt}: a box with a host must be an inset`);
        if (p.r[0] < h.r[0] - 1e-6 || p.r[1] < h.r[1] - 1e-6 || p.r[0] + p.r[2] > h.r[0] + h.r[2] + 1e-6 || p.r[1] + p.r[3] > h.r[1] + h.r[3] + 1e-6) err(`${pt}: sticks out of its host "${p.host}"`);
        if (!(p.at > h.at)) err(`${pt}: reveals before its host "${p.host}"; the host (the background of the cascade) comes first`);
        const sib = sc.panels.slice(0, pi).filter((q) => q.host === p.host);
        if (sib.length && !(p.at > sib[sib.length - 1].at)) err(`${pt}: reveals before the previous inset of its cascade`);
        for (const b of h.balloons || []) if (b.kind === 'caption' || b.kind === 'place') { const bx = h.r[0] + b.x * h.r[2], by = h.r[1] + b.y * h.r[3]; if (bx >= p.r[0] && bx <= p.r[0] + p.r[2] && by >= p.r[1] && by <= p.r[1] + p.r[3]) err(`${pt}: covers the host's caption "${b.text.slice(0, 20)}"`); }
      }
    }
    if (p.inset && (p.r[0] <= 0.002 || p.r[1] <= 0.002 || p.r[0] + p.r[2] >= 0.998 || p.r[1] + p.r[3] >= 0.998)) err(`${pt}: an overlapping box must sit inside the page, clear of its outer edge (it may span boxes in the middle; its gutter band covers them)`);
    if (p.at <= prevAt) err(`${pt}: arrives on beat ${p.at}, not after the previous panel (${prevAt})`);
    if (p.at < 0 || p.at >= sc.l) err(`${pt}: arrives on beat ${p.at}, outside the scene's ${sc.l} beats`);
    if (pi > 0 && p.at - prevAt < 1) warn(`${pt}: only ${(p.at - prevAt).toFixed(2)} beats after the previous box's reveal`);
    prevAt = p.at;
    if (!p.alt || p.alt.length < 8) err(`${pt}: alt text missing or too short`);
    if ((p.fx || []).includes('breathe')) warn(`${pt}: fx 'breathe' is deprecated and ignored (nothing zooms)`);
    if (!sc.art && !p.img && !p.staticArt) err(`${pt}: no img, staticArt, or scene page art`);
    let prevB = -Infinity;
    (p.balloons || []).slice().sort((a, b) => a.at - b.at).forEach((b, bi) => {
      const bt = `${pt} balloon ${bi + 1} "${b.text.slice(0, 24)}"`;
      if (b.at < p.at - 1) warn(`${bt}: lands on beat ${b.at}, before its panel arrives (${p.at})`);
      if (b.at >= sc.l - 1) err(`${bt}: lands on beat ${b.at}, too close to the scene's end (${sc.l})`);
      if (b.at - prevB < 1.5) err(`${bt}: only ${(b.at - prevB).toFixed(2)} beats after the previous balloon in this panel`);
      prevB = b.at;
      if (b.breakout) {
        if (b.x < -0.3 || b.y < -0.3 || b.x > 1.3 || b.y > 1.3) err(`${bt}: breakout anchor (${b.x}, ${b.y}) is past -0.3..1.3`);
        if (!['speech', 'thought', 'machine', 'whisper', 'fear', 'burst'].includes(b.kind)) warn(`${bt}: a ${b.kind} breaking out of its box`);
      } else {
        if (b.x < 0 || b.y < 0 || b.x > 0.95 || b.y > 0.95) err(`${bt}: anchor (${b.x}, ${b.y}) is outside the box (set breakout to let it cross the border)`);
        if ((b.w || 0.26) + b.x > 1.02) warn(`${bt}: x + w = ${((b.w || 0.26) + b.x).toFixed(2)} runs past the box's right edge (the engine pulls it in)`);
      }
      if (b.sceneSetup !== true && b.text.length > 90) err(`${bt}: ${b.text.length} characters; keep balloons to about 12 words`);
      // The engine composes the lines itself (about 9 characters a line, never a word broken, never the browser's wrap);
      // an author's "\n" wins.
      if (b.sceneSetup !== true && b.text.split(/\s+/).length > 16) warn(`${bt}: ${b.text.split(/\s+/).length} words`);
      if (b.em && !b.text.includes(b.em)) err(`${bt}: em "${b.em}" is not in the text`);
      if (b.tail && ['caption', 'place'].includes(b.kind)) warn(`${bt}: a ${b.kind} has no tail`);
      if (!b.tail && !b.chain && !b.across && b.state !== 'offpanel' && ['speech', 'machine', 'whisper', 'fear'].includes(b.kind) && b.who !== 'narrator' && !comicBalloonHasSourceTail(p,b)) warn(`${bt}: a ${b.kind} balloon with no tail (off-panel speaker?)`);
      if (b.chain && bi === 0) err(`${bt}: chain needs a previous balloon in the same box`);
      if (['whisper', 'machine'].includes(b.kind) || b.steered != null) err(`${bt}: ${b.kind === 'whisper' || b.kind === 'machine' ? `kind "${b.kind}"` : 'steered'} is not used in the reference comics (Claude and Codex speak in speech balloons)`);
      // The measured usage table (.claude/skills/mtw-comic-story/assets/reference-balloons/report.md; skill references/lettering-and-balloons.md).
      const STATE_KIND = { calm: ['speech'], offpanel: ['speech'], device: ['speech'], weak: ['speech'], menace: ['speech'], thought: ['thought'], shout: ['burst'], scream: ['burst'], panic: ['burst'], fear: ['fear'], narration: ['caption', 'place'] };
      if (b.state && !STATE_KIND[b.state]) err(`${bt}: state "${b.state}" is not in the usage table (${Object.keys(STATE_KIND).join(', ')})`);
      else if (b.state && !STATE_KIND[b.state].includes(b.kind)) err(`${bt}: a ${b.state} voice uses ${STATE_KIND[b.state].join(' or ')}, not ${b.kind} (the balloon-usage table)`);
      if (!b.state) warn(`${bt}: no state; the voice decides the balloon (calm, offpanel, device, weak, menace, thought, shout, scream, panic, fear, narration)`);
      if (b.state === 'offpanel' && b.tail && !(b.tail[0] <= 0.01 || b.tail[0] >= 0.99 || b.tail[1] <= 0.01 || b.tail[1] >= 0.99)) warn(`${bt}: an off-panel voice's long thin tail runs to the box edge (tail on 0 or 1)`);
      if (b.state === 'device' && !b.tail) warn(`${bt}: a device or chat voice is an ordinary balloon whose tail runs to the screen`);
      if (b.across && b.chain) err(`${bt}: a balloon is either chained (same box) or across (from the previous box), not both`);
      if (b.across && pi === 0) err(`${bt}: across continues the previous box's last speech balloon; the first box has none`);
      if (b.edge && !['top', 'left', 'right', 'bottom'].includes(b.edge)) err(`${bt}: edge "${b.edge}" is not top, left, right or bottom`);
      if (b.tail && (b.tail[0] < 0 || b.tail[0] > 1 || b.tail[1] < 0 || b.tail[1] > 1)) err(`${bt}: tail outside the panel`);
      if (b.steered != null && b.kind !== 'machine') warn(`${bt}: steered only means something on a machine balloon`);
      if (b.kind === 'machine' && !['claude', 'codex', 'rogue'].includes(b.who)) warn(`${bt}: a machine balloon spoken by ${b.who}`);
    });
  });
});
// Reading time: read in order across the scene; each box's balloons before the next box reveals.
const BEAT = 60 / story.bpm, EXIT_B = Math.max(1.5, 1.2 / BEAT);
const readS = (text) => {
  const words = text.split(/\s+/).filter(Boolean).length;
  return story.id === 'home' && words <= 8 ? 0.55 + 0.26 * words : 1 + 0.3 * words;
};
let readingShort = 0;
for (const sc of scenes) {
  const ps = sc.panels.slice().sort((a, b) => a.at - b.at);
  let end = -Infinity;
  ps.forEach((p, i) => {
    for (const b of (p.balloons || []).slice().sort((a, c) => a.at - c.at)) end = Math.max(b.at * BEAT, end) + readS(b.text);
    const nextAt = i < ps.length - 1 ? ps[i + 1].at : sc.l - EXIT_B;
    const what = i < ps.length - 1 ? `box ${i + 2} reveals` : 'the scene starts to leave';
    if ((p.balloons || []).length && end > nextAt * BEAT + 0.05) {
      readingShort++;
      err(`scene ${sc.id} box ${i + 1} (${p.img}): its balloons need until beat ${(end / BEAT).toFixed(1)} to read; ${what} on beat ${nextAt.toFixed(1)} (short by ${(end / BEAT - nextAt).toFixed(1)} beats)`);
    }
  });
}
if (!readingShort) ok(`reading time: every box can be read before the next reveals (${story.id === 'home' ? 'adaptive brief replies; full reading windows for longer text' : '1 s + 0.3 s a word'}, at ${story.bpm} bpm)`);
// Exits and breakouts.
for (const sc of scenes) {
  if (sc.exit) warn(`scene ${sc.id}: exit "${sc.exit}" is deprecated and ignored (boxes simply fade in reading order)`);
  // Breakout balloons: estimate each balloon's rectangle on a 1600 x 900 page and warn on overlap with another box's balloon.
  const rects = [];
  sc.panels.forEach((p, pi) => (p.balloons || []).forEach((b) => {
    const pw = p.r[2] * 1600, ph = p.r[3] * 900, fs = Math.min(24, Math.max(15, pw * 0.0357));
    const w = Math.max((b.w || 0.26) * pw, 7.5 * fs), lines = Math.ceil((b.text.length * 0.62 * fs) / Math.max(fs, w - 1.6 * fs));
    rects.push({ pi, b, x: p.r[0] * 1600 + b.x * pw, y: p.r[1] * 900 + b.y * ph, w, h: lines * 1.04 * fs + 1.1 * fs });
  }));
  rects.filter((r) => r.b.breakout).forEach((r) => rects.forEach((o) => {
    if (o.pi !== r.pi && r.x < o.x + o.w && o.x < r.x + r.w && r.y < o.y + o.h && o.y < r.y + r.h) warn(`scene ${sc.id}: breakout balloon "${r.b.text.slice(0, 24)}" would cover box ${o.pi + 1}'s balloon "${o.b.text.slice(0, 24)}"`);
  }));
  const n = rects.filter((r) => r.b.breakout).length;
  if (n > 2) warn(`scene ${sc.id}: ${n} breakout balloons; keep them rare`);
}
// Proportional sizing: equal boxes in a tier (a row sharing y and height, or a column sharing x and width).
const near = (a, b, t) => Math.abs(a - b) <= t;
let rapid = 0;
for (const sc of scenes) {
  if (sc.rapid) { rapid++; continue; }
  // Equal boxes are allowed only as a run: every box of the tier shares one run id.
  const ps = sc.panels.filter((p) => !p.inset);
  const tiers = (key, size, span) => {
    const groups = [];
    ps.forEach((p) => { const g = groups.find((x) => near(x[0].r[key], p.r[key], 0.01) && near(x[0].r[span], p.r[span], 0.01)); if (g) g.push(p); else groups.push([p]); });
    return groups.filter((g) => g.length > 1 && g.every((p) => near(p.r[size], g[0].r[size], 0.03)) && !(g[0].run && g.every((p) => p.run === g[0].run)));
  };
  const rows = tiers(1, 2, 3), cols = tiers(0, 3, 2);
  if (rows.length || cols.length) warn(`scene ${sc.id}: ${rows.length ? `${rows[0].length} equal boxes in a row` : `${cols[0].length} equal boxes in a column`}; comics avoid proportional splits (set rapid: true for a rapid few beats)`);
}
// Runs: boxes of one run reveal in quick steps (half a beat to a beat apart, unless a box needs reading time).
for (const sc of scenes) {
  const runs = {};
  sc.panels.forEach((p, i) => { if (p.run) (runs[p.run] = runs[p.run] || []).push([i, p]); });
  for (const [id, list] of Object.entries(runs)) {
    if (list.length < 2) warn(`scene ${sc.id}: run "${id}" has one box`);
    list.slice(1).forEach(([i, p], k) => { const prev = list[k][1], gap = p.at - prev.at; if (gap > 1.5 && !(prev.balloons || []).length) warn(`scene ${sc.id} box ${i + 1}: ${gap} beats after the last step of run "${id}"; runs step half a beat to a beat apart`); });
  }
}
// Named damage motifs remain forbidden in titles/place narration. The validated red-agent identity caption is the sole exception.
for (const message of checkComicIntroductions(story)) err(message);
const seen = scenes.flatMap((sc) => [sc.title, ...sc.panels.flatMap((p) => (p.balloons || []).map((b) => b.text))]);
if (story.next) seen.push(story.next.heading, ...(story.next.choices || []).map((c) => c.label));
seen.filter((t) => /\bvillains?\b/i.test(t || '')).forEach((t) => warn(`"${t.slice(0, 50)}" says "villain"; comics show the trouble instead`));

// Sound, scored like a film (Matt, 2026-10-04: "Score plus effects"): effects of known kinds, a level 0-1, a known room,
// and music under no more than two scenes in three.
{
  for (const message of comicSoundErrors({ soundAssets: story.soundAssets })) err(message);
  let scored = 0;
  story.scenes.forEach((sc) => {
    for (const message of comicSoundErrors(sc)) err(`scene ${sc.id}: ${message}`);
    if (sc.score > 0) scored++;
    sc.panels.forEach((p, pi) => {
      if ((p.sfx || []).length > 2) warn(`scene ${sc.id} box ${pi + 1}: ${p.sfx.length} sound effects; one or two at most`);
    });
  });
  if (story.scenes.length >= 3 && scored > Math.ceil(story.scenes.length * 2 / 3)) warn(`music under ${scored} of ${story.scenes.length} scenes; keep at least one scene in three without it`);
}
// Matt's recurring box defects (2026-10-11): speech length, silent scenes, action boxes left still. Fix or explain each.
for (const message of comicBoxDefectWarnings(story)) warn(message);

// Music loop.
if (story.music && story.music.loop) {
  const L = story.music.loop;
  if (!(L.to > L.from && L.from >= 0)) err(`music.loop ${JSON.stringify(L)}: to must be after from`);
  const ph = (map && map.phraseLength) || 16;
  if (L.from % ph || L.to % ph) warn(`music.loop ${JSON.stringify(L)} is not on ${ph}-beat phrase boundaries`);
  if (map && map.duration && story.music.offset + L.to * 60 / story.bpm > map.duration + 0.05) err(`music.loop ends at song beat ${L.to}, past the song file`);
}
if (scenes.length) ok(`${scenes.length} scenes, ${scenes.reduce((n, s) => n + s.panels.length, 0)} panels, ${scenes.reduce((n, s) => n + s.panels.reduce((m, p) => m + (p.balloons || []).length, 0), 0)} balloons`);

// NEXT.
if (story.next) {
  const registry = await import(pathToFileURL(join(site, 'src/data/comic-stories/index.ts')).href);
  if (story.next.b < prevEnd - EPS) err(`NEXT starts on beat ${story.next.b}, before the last scene ends (${prevEnd})`);
  if (story.beats && story.next.b > story.beats) warn(`NEXT starts on beat ${story.next.b}, after the story's ${story.beats} beats`);
  if (!story.next.choices?.length) err('NEXT has no choices');
  if (/^next\s*:/i.test(story.next.heading || '')) err('NEXT heading starts with "Next:"; the banner already says NEXT');
  (story.next.choices || []).forEach((c, i) => {
    const ct = `choice ${i + 1} "${c.label}"`;
    const href = registry.choiceHref(c.href || '', 'standalone');
    const path = href.replace(/[?#].*$/, '').replace(/^\/|\/$/g, '');
    const page = path === '' ? 'index' : path;
    const found = /^https:\/\//.test(href) || registry.comicIssues.some(i => `/comics/${i.slug}` === '/' + path) || [`src/pages/${page}.astro`, `src/pages/${page}/index.astro`].some((f) => existsSync(join(site, f)));
    if (!found) err(`${ct}: ${c.href} is not a page`);
    if (c.label.length > 70) warn(`${ct}: ${c.label.length} characters`);
    if (/^next\s*:/i.test(c.label)) err(`${ct}: starts with "Next:"; the banner already says NEXT`);
  });
}

let errors = 0;
for (const [lvl, msg] of out) { if (lvl === 'ERROR') errors++; console.log(`${lvl.padEnd(5)} ${msg}`); }
console.log(errors ? `\n${errors} error(s)` : '\nno errors');
process.exit(errors ? 1 : 0);
