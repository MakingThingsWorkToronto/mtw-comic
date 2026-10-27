// Comic audio coverage check (skill: mtw-comic-story). Voice, score continuity, effects density, room loops.
// Usage: node scripts/comics/audio-coverage.mjs --story <slug|path> [--scene <id>] [--require-voiced] [--public <dir>] [--json]
// Exit 0 pass, 1 an error found, 2 usage. Warnings never fail (unvoiced balloons fail only with --require-voiced).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadStory, storyPathFor, REPO } from './lib/story.mjs';

const VOICED_KINDS = new Set(['speech', 'burst', 'fear', 'thought', 'caption', 'place']);
const ROOMS = ['office', 'servers', 'street', 'rain', 'none'];
const typesFile = path.join(REPO, 'site', 'src', 'data', 'comic-stories', 'types.ts');

export function sfxKinds(file = typesFile) {
  const m = fs.readFileSync(file, 'utf8').match(/export type SfxKind =([^;]+);/);
  if (!m) throw new Error(`${file}: export type SfxKind not found`);
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
}

const words = (t) => String(t ?? '').split(/\s+/).filter(Boolean).length;

/** Analyze a story object. Returns { scenes, totals, errors, warnings }. */
export function analyze(story, { publicDir = path.join(REPO, 'site', 'public'), sceneId = null, requireVoiced = false, kinds = sfxKinds() } = {}) {
  const exists = (src) => typeof src === 'string' && fs.existsSync(path.join(publicDir, src.replace(/^\/+/, '')));
  const issueErrors = [];
  const all = story.scenes;
  const scenes = all.map((scene) => {
    const r = { id: scene.id, boxes: scene.panels.length, voiced: 0, unvoiced: 0, unvoicedList: [], score: scene.score ?? null, room: scene.room ?? null, silent: false, sfxBoxes: 0, errors: [], warnings: [] };
    scene.panels.forEach((panel, pi) => {
      const img = panel.img ?? panel.id ?? `box-${pi}`;
      if ((panel.sfx || []).length) r.sfxBoxes++;
      for (const s of panel.sfx || []) if (!kinds.includes(s.kind)) r.errors.push(`${img}: unknown sfx kind "${s.kind}"`);
      if (panel.room != null && !ROOMS.includes(panel.room)) r.errors.push(`${img}: unknown room "${panel.room}"`);
      (panel.balloons || []).forEach((b, bi) => {
        if (!VOICED_KINDS.has(b.kind)) return;
        const id = `${scene.id}/${img}/${bi}`;
        const sp = b.speech;
        const fileOk = sp && exists(sp.src);
        if (sp && !fileOk) r.errors.push(`${id}: speech.src missing on disk: ${sp.src}`);
        if (fileOk && sp.durationSeconds > 0) {
          r.voiced++;
          const limit = 1 + 0.3 * words(b.text) + 6;
          if (sp.durationSeconds > limit) r.warnings.push(`${id}: clip ${sp.durationSeconds}s is long for ${words(b.text)} words (> ${limit.toFixed(1)}s)`);
        } else {
          r.unvoiced++;
          r.unvoicedList.push({ id, who: b.who, text: b.text });
        }
      });
    });
    if (typeof scene.score !== 'number' || scene.score < 0 || scene.score > 1) r.errors.push(`scene ${scene.id}: score must be a number 0..1`);
    if (!ROOMS.includes(scene.room)) r.errors.push(`scene ${scene.id}: room must be one of ${ROOMS.join('|')}`);
    r.silent = scene.score === 0 && scene.room === 'none';
    if (r.sfxBoxes === 0) r.errors.push(`scene ${scene.id}: no box has sfx`);
    if (r.unvoiced) (requireVoiced ? r.errors : r.warnings).push(`scene ${scene.id}: ${r.unvoiced} unvoiced balloon(s)`);
    return r;
  });
  // Issue-wide checks.
  const silent = scenes.filter((s) => s.silent);
  if (silent.length * 3 > all.length) issueErrors.push(`${silent.length} of ${all.length} scenes are silent (score 0 and room none); at most one in three`);
  for (const s of silent) if (s.sfxBoxes === 0) issueErrors.push(`silent scene ${s.id} has no sfx`);
  const n = story.next?.sound;
  if (!n || typeof n.score !== 'number' || !ROOMS.includes(n.room)) issueErrors.push('next.sound must exist with score and room');
  const music = story.music;
  if (!music || !exists(music.src)) issueErrors.push(`music.src missing on disk: ${music?.src}`);
  if (music?.loop && !(music.loop.from < music.loop.to)) issueErrors.push('music.loop.from must be less than loop.to');
  for (const [room, v] of Object.entries(story.soundAssets?.rooms || {})) if (!exists(v?.src)) issueErrors.push(`soundAssets.rooms.${room}.src missing on disk: ${v?.src}`);
  const boxes = all.flatMap((s) => s.panels);
  const dense = boxes.filter((p) => (p.sfx || []).length || p.room != null).length;
  const pct = boxes.length ? Math.round((dense / boxes.length) * 100) : 0;
  if (pct < 50) issueErrors.push(`only ${pct}% of boxes have sfx or a room override (need >= 50%)`);
  const picked = sceneId ? scenes.filter((s) => s.id === sceneId) : scenes;
  const totals = {
    scenes: picked.length, boxes: picked.reduce((a, s) => a + s.boxes, 0), voiced: picked.reduce((a, s) => a + s.voiced, 0), unvoiced: picked.reduce((a, s) => a + s.unvoiced, 0),
    silentScenes: silent.length, sfxBoxPct: pct,
  };
  const errors = [...picked.flatMap((s) => s.errors), ...(sceneId ? [] : issueErrors)];
  const warnings = picked.flatMap((s) => s.warnings);
  return { scenes: picked, totals, errors, warnings };
}

function main() {
  const args = process.argv.slice(2);
  const val = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  const slugOrPath = val('--story');
  if (!slugOrPath) { console.error('usage: audio-coverage.mjs --story <slug|path> [--scene <id>] [--require-voiced] [--public <dir>] [--json]'); process.exit(2); }
  const file = /[\\/]|\.ts$/.test(slugOrPath) ? path.resolve(slugOrPath) : storyPathFor(slugOrPath);
  const { story } = loadStory(file);
  const sceneId = val('--scene') ?? null;
  if (sceneId && !story.scenes.some((s) => s.id === sceneId)) { console.error(`scene ${sceneId} not found`); process.exit(2); }
  const pub = val('--public');
  const res = analyze(story, { publicDir: pub ? path.resolve(pub) : undefined, sceneId, requireVoiced: args.includes('--require-voiced') });
  const ok = res.errors.length === 0;
  if (args.includes('--json')) console.log(JSON.stringify({ ok, ...res }, null, 2));
  else {
    for (const s of res.scenes) console.log(`${s.id}: boxes ${s.boxes} voiced ${s.voiced} unvoiced ${s.unvoiced} score ${s.score} room ${s.room}${s.silent ? ' SILENT' : ''} sfxBoxes ${s.sfxBoxes}`);
    for (const w of res.warnings) console.log(`WARN ${w}`);
    for (const e of res.errors) console.log(`ERROR ${e}`);
    const t = res.totals;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${t.scenes} scenes, ${t.boxes} boxes, voiced ${t.voiced}, unvoiced ${t.unvoiced}, silent scenes ${t.silentScenes}, sfx/room boxes ${t.sfxBoxPct}%, ${res.errors.length} errors, ${res.warnings.length} warnings`);
  }
  process.exit(ok ? 0 : 1);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
