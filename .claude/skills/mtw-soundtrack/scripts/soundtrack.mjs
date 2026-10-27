#!/usr/bin/env node
// Soundtrack library intake (skill: mtw-soundtrack). Reads wiki/soundtrack-library/sources.json, and for every track:
// copies the approved file into assets/ (never overwriting a different file), hashes it, profiles it with the shared
// analysis (site/scripts/audio/analyze-audio.mjs: beat map, 8-band frequency profile at 20 fps, per-beat bands, onsets,
// summary) into profiles/<id>.json, then rebuilds manifest.json.
//   node .claude/skills/mtw-soundtrack/scripts/soundtrack.mjs build [--only id,id] [--force]
//   node .claude/skills/mtw-soundtrack/scripts/soundtrack.mjs check
// Profiles are rebuilt only when a track's file hash or the analysis version changes (or --force).
// Review (play, rate, Approve, Find similar) happens in MTW Studio at /m/soundtrack (`npm run studio`, port 8788), which
// writes sources.json, discovery.json and manifest.json exactly as `build` does and answers the Pixabay collector.
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ANALYSIS_VERSION = 2; // bump when analyze-audio.mjs changes what it measures
let root = path.dirname(fileURLToPath(import.meta.url));
while (!existsSync(path.join(root, 'AGENTS.md'))) { const up = path.dirname(root); if (up === root) throw new Error('repo root not found'); root = up; }
const lib = path.join(root, 'wiki', 'soundtrack-library');
const [cmd = 'check', ...rest] = process.argv.slice(2);
const only = (() => { const i = rest.indexOf('--only'); return i > -1 ? new Set(rest[i + 1].split(',')) : null; })();
const force = rest.includes('--force');
const sources = JSON.parse(readFileSync(path.join(lib, 'sources.json'), 'utf8'));
const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
// The credit always names the track and artist; it links to the track's page when one is known (Matt approved one
// track with no known page, 2026-09-26).
const credit = (t) => (t.title && t.artist ? { text: `Music: ${t.title} by ${t.artist}`, href: t.source || null } : null);
const profilePath = (t) => path.join(lib, 'profiles', `${t.id}.json`);
const problems = [];

async function build() {
  mkdirSync(path.join(lib, 'assets'), { recursive: true });
  mkdirSync(path.join(lib, 'profiles'), { recursive: true });
  const todo = [];
  for (const t of sources.tracks) {
    if (only && !only.has(t.id)) continue;
    const dest = path.join(lib, 'assets', t.file), src = path.join(sources.downloadsDir, t.download || '');
    if (!existsSync(dest)) {
      if (!t.download || !existsSync(src)) { problems.push(`${t.id}: no asset and no download at ${src}`); continue; }
      copyFileSync(src, dest);
    } else if (t.download && existsSync(src) && sha(src) !== sha(dest)) {
      problems.push(`${t.id}: assets/${t.file} differs from the download; kept the library copy (a new version needs a new id)`);
    }
    const hash = sha(dest), p = profilePath(t);
    const old = existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
    // A checked grid (sources.json `grid`) that changed also rebuilds the profile.
    const gridChanged = old && JSON.stringify(old.grid || null) !== JSON.stringify(t.grid || null);
    if (force || !old || old.asset.sha256 !== hash || old.analysisVersion !== ANALYSIS_VERSION || gridChanged) todo.push({ t, dest, hash });
  }
  if (todo.length) {
    const require = createRequire(path.join(root, 'site', 'package.json'));
    const { chromium } = require('playwright');
    const { analyzeAudio, BANDS } = await import(pathToFileURL(path.join(root, 'site', 'scripts', 'audio', 'analyze-audio.mjs')).href);
    const browser = await chromium.launch({ channel: 'chrome' });
    try {
      for (const { t, dest, hash } of todo) {
        const page = await browser.newPage();
        await page.setContent('<!doctype html><title>profile</title>');
        const t0 = Date.now();
        const res = await page.evaluate(analyzeAudio, { b64: readFileSync(dest).toString('base64'), PHRASE: 16, BANDS, FPS: 20, grid: t.grid || null });
        await page.close();
        const profile = { id: t.id, analysisVersion: ANALYSIS_VERSION, profiled: new Date().toISOString().slice(0, 10),
          asset: { file: `assets/${t.file}`, bytes: statSync(dest).size, sha256: hash }, grid: t.grid || null, ...res };
        writeFileSync(profilePath(t), JSON.stringify(profile) + '\n');
        console.log(`profiled ${t.id}: ${res.beatMap.bpm} BPM, ${res.beatMap.duration} s (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
      }
    } finally { await browser.close(); }
  }
  writeManifest();
}
// Manifest: every track, with its credit and the profile's summary (the heavy arrays stay in profiles/),
// and the discovery requests and runs (discovery.json) so Studio can show what is open.
function writeManifest() {
  const tracks = sources.tracks.map((t) => {
    const p = existsSync(profilePath(t)) ? JSON.parse(readFileSync(profilePath(t), 'utf8')) : null;
    const { beats, ...beatMap } = p ? p.beatMap : {};
    return { ...t, credit: credit(t), asset: p ? p.asset : null, beatMap: p ? beatMap : null, summary: p ? p.summary : null,
      profile: p ? `profiles/${t.id}.json` : null, energy: p ? bars(beats, p.beatMap) : null };
  });
  const manifest = { about: 'Soundtrack library: approved music for MTW motion graphics (skill: mtw-soundtrack). Facts: wiki/site/soundtrack-library.md.',
    analysisVersion: ANALYSIS_VERSION, bands: ['sub 20-60 Hz', 'bass 60-150', 'low-mid 150-400', 'mid 400-1k', 'upper-mid 1-2.5k', 'presence 2.5-5k', 'brilliance 5-10k', 'air 10-16k'],
    counts: { tracks: tracks.length, approved: tracks.filter((t) => t.status === 'approved').length,
      candidates: tracks.filter((t) => t.status === 'candidate').length, profiled: tracks.filter((t) => t.summary).length },
    discovery: discovery(), tracks };
  writeFileSync(path.join(lib, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`manifest: ${manifest.counts.tracks} tracks, ${manifest.counts.approved} approved, ${manifest.counts.candidates} candidates, ${manifest.counts.profiled} profiled`);
  return manifest;
}
function discovery() {
  const f = path.join(lib, 'discovery.json');
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : { requests: [], runs: [] };
}

// Loudness per bar (4 beats), for the Studio sparkline.
function bars(beats, bm) { if (!beats) return null; const out = []; for (let i = 0; i < Math.min(beats.length, bm.endBeat + 1); i += 4) out.push(Math.round(beats.slice(i, i + 4).reduce((a, b) => a + b, 0) / 4)); return out; }

function check() {
  const man = existsSync(path.join(lib, 'manifest.json')) ? JSON.parse(readFileSync(path.join(lib, 'manifest.json'), 'utf8')) : null;
  if (!man) { problems.push('no manifest.json: run build'); return; }
  for (const t of sources.tracks) {
    const m = man.tracks.find((x) => x.id === t.id);
    if (!m) { problems.push(`${t.id}: not in the manifest (run build)`); continue; }
    const f = path.join(lib, 'assets', t.file);
    if (!existsSync(f)) problems.push(`${t.id}: assets/${t.file} missing`);
    else if (!m.asset || sha(f) !== m.asset.sha256) problems.push(`${t.id}: asset hash differs from its profile (run build)`);
    if (!existsSync(profilePath(t))) problems.push(`${t.id}: no profile`);
    if (t.rating != null && !(Number.isInteger(t.rating) && t.rating >= 1 && t.rating <= 5)) problems.push(`${t.id}: rating ${t.rating} is not 1-5`);
    if (!['approved', 'candidate', 'needs source', 'withdrawn'].includes(t.status)) problems.push(`${t.id}: unknown status ${t.status}`);
    // A candidate carries its full credit before Matt hears it, so approving it is one click.
    if (t.status === 'approved' || t.status === 'candidate') {
      if (t.source && !/^https:\/\/[^/]+\/.+/.test(t.source)) problems.push(`${t.id}: its source is not a page URL`);
      if (!t.source && !t.note) problems.push(`${t.id}: ${t.status} with no source page and no note saying why`);
      if (!t.license) problems.push(`${t.id}: ${t.status} without a licence`);
      if (!t.title || !t.artist) problems.push(`${t.id}: ${t.status} without title and artist for the credit`);
    }
    if (t.grid && m.beatMap && (Math.abs(m.beatMap.bpm - t.grid.bpm) > 0.001 || Math.abs(m.beatMap.offset - t.grid.offset) > 0.001)) problems.push(`${t.id}: its checked grid is not in its profile (run build)`);
  }
  for (const r of discovery().requests) if (!sources.tracks.some((t) => t.id === r.basis)) problems.push(`discovery request ${r.id}: no track ${r.basis}`);
  const counts = { tracks: sources.tracks.length, approved: sources.tracks.filter((t) => t.status === 'approved').length,
    candidates: sources.tracks.filter((t) => t.status === 'candidate').length };
  for (const [k, v] of Object.entries(counts)) if (man.counts?.[k] !== v) problems.push(`manifest.json counts.${k} is out of date with sources.json (run build)`);
  for (const m of man.tracks) if (m.profile && m.profile !== `profiles/${m.id}.json`) problems.push(`${m.id}: manifest profile path ${m.profile} is stale (run build)`);
  console.log(`checked ${sources.tracks.length} tracks`);
}

if (cmd === 'serve') problems.push('serve is retired: open /m/soundtrack in MTW Studio (npm run studio, port 8788)'); else if (cmd === 'build') await build(); else check();
for (const p of problems) console.log('PROBLEM', p);
process.exit(problems.length && cmd !== 'build' ? 1 : 0);
