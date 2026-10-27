// Comic scene gate (skill: mtw-comic-story). Runs the checks for one scene at one stage and records the result in the ledger.
// Usage: node scripts/comics/scene-gate.mjs --slug <slug> --build <buildId> --scene <id> --stage <planned|bound|framed> [--json]
// Exit 0 pass, 1 fail, 2 usage. Stops at the first failing step; writes <ledgerDir>/gates/<scene>-<stage>.json.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { REPO, loadStory, storyPathFor } from './lib/story.mjs';
import { openLedger, setPath, sceneState, ledgerDir } from './lib/ledger.mjs';

const SIZES = ['desktop', 'phone', 'reduced'];

/** Keep lines that mention the scene or contain ERROR; first `max`. */
export function filterOutput(text, sceneId, max = 30) {
  return String(text).split(/\r?\n/).filter((l) => l.includes(sceneId) || l.includes('ERROR')).slice(0, max);
}

/** Problems in a frames index for the given box ids and the three sizes. Index shapes: { frames: [{img,size,..}] } or { [img]: { [size]: {..} } }. */
export function framesProblems(index, boxes) {
  const problems = [];
  const entry = (img, size) => {
    if (Array.isArray(index?.frames)) return index.frames.find((f) => (f.img ?? f.box) === img && f.size === size);
    const v = index?.[img] ?? index?.boxes?.[img];
    return Array.isArray(v) ? v.find((f) => f.size === size) : v?.[size];
  };
  for (const img of boxes) for (const size of SIZES) {
    const f = entry(img, size);
    if (!f) problems.push(`${img}/${size}: missing`);
    else if (f.status !== 'ok') problems.push(`${img}/${size}: status ${f.status}`);
    else if (Array.isArray(f.errors) ? f.errors.length : f.errors) problems.push(`${img}/${size}: has errors`);
  }
  return problems;
}

const lines = (text, n = 30) => String(text).split(/\r?\n/).filter(Boolean).slice(0, n).join('\n');
function child(name, argv, cwd) {
  const r = spawnSync(process.execPath, argv, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return { name, command: `node ${argv.join(' ')}`, exitCode: r.status ?? 1, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

async function main() {
  const args = process.argv.slice(2);
  const val = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  const [slug, build, sceneId, stage] = ['--slug', '--build', '--scene', '--stage'].map(val);
  if (!slug || !build || !sceneId || !['planned', 'bound', 'framed'].includes(stage)) { console.error('usage: scene-gate.mjs --slug <slug> --build <buildId> --scene <id> --stage <planned|bound|framed> [--json]'); process.exit(2); }
  const site = path.join(REPO, 'site');
  const steps = [];
  const add = (name, ok, command, exitCode, summary) => steps.push({ name, ok, command, exitCode, summary: lines(summary) });
  const failed = () => steps.some((s) => !s.ok);
  const sceneOf = () => loadStory(storyPathFor(slug)).story.scenes.find((s) => s.id === sceneId);

  const storyFile = storyPathFor(slug), storyId = loadStory(storyFile).story.id;
  const sc = ['scripts/comic-story-check.mjs', '--story', path.relative(site, storyFile).replaceAll('\\', '/'), ...(stage === 'planned' ? [] : ['--require-art'])];
  const r1 = child('story-check', sc, site);
  add(r1.name, r1.exitCode === 0, r1.command, r1.exitCode, filterOutput(r1.out, sceneId).join('\n'));

  // Deslop lints every issue; this gate judges only this story's lines (other issues' failures are their owners').
  if (!failed()) {
    const r = child('deslop', ['scripts/comic-story-deslop.mjs'], site);
    const mine = r.out.split('\n').filter((l) => new RegExp(`\\b${storyId}\\b`).test(l));
    const ok = r.exitCode === 0 || (mine.length > 0 && mine.every((l) => !/FAIL|ERROR|error/.test(l)));
    add(r.name, ok, r.command, r.exitCode, (mine.length ? mine : r.out.split('\n').slice(-5)).join('\n'));
  }

  if (!failed()) {
    const lf = path.join(REPO, 'scripts', 'comics', 'layout-check.mjs');
    if (!fs.existsSync(lf)) add('layout', false, 'node scripts/comics/layout-check.mjs', 1, 'layout-check.mjs missing');
    else { const r = child('layout', [lf, '--story', slug, '--scene', sceneId, '--json'], REPO); add(r.name, r.exitCode === 0, r.command, r.exitCode, r.out); }
  }

  if (!failed()) {
    const label = `checkComicPhone(${sceneId})`;
    try {
      const m = await import(pathToFileURL(path.join(site, 'scripts', 'comic-story-phone-check.mjs')).href);
      const scene = sceneOf();
      if (!scene) add('phone', false, label, 1, `scene ${sceneId} not found`);
      else { const errs = m.checkComicPhone(scene); add('phone', errs.length === 0, label, errs.length ? 1 : 0, errs.join('\n')); }
    } catch (e) { add('phone', false, label, 1, String(e.stack || e)); }
  }

  if (!failed()) { const r = child('audio', [path.join(REPO, 'scripts', 'comics', 'audio-coverage.mjs'), '--story', slug, '--scene', sceneId, '--json'], REPO); add(r.name, r.exitCode === 0, r.command, r.exitCode, r.out); }

  const ledger = openLedger(slug, build);
  if (!failed() && stage === 'framed') {
    const ss = sceneState(ledger, sceneId);
    const boxes = (sceneOf()?.panels || []).filter((p) => !p.inset).map((p) => p.img ?? p.id);
    const problems = [];
    const idx = ss.frames && typeof ss.frames === 'object' ? ss.frames.index : null;
    const idxFile = idx ? (path.isAbsolute(idx) ? idx : path.join(REPO, idx)) : null;
    if (!idxFile || !fs.existsSync(idxFile)) problems.push('frames.index missing or not on disk');
    else problems.push(...framesProblems(JSON.parse(fs.readFileSync(idxFile, 'utf8')), boxes));
    if (!ss.review || ss.review.ok !== true) problems.push('review missing or not ok');
    add('frames', problems.length === 0, 'ledger frames + review', problems.length ? 1 : 0, problems.join('\n'));
  }

  const ok = !failed();
  const dir = path.join(ledgerDir(slug, build), 'gates');
  fs.mkdirSync(dir, { recursive: true });
  const result = { scene: sceneId, stage, ok, at: null, steps };
  fs.writeFileSync(path.join(dir, `${sceneId}-${stage}.json`), JSON.stringify(result, null, 2) + '\n');
  setPath(ledger, `scenes.${sceneId}.status`, `${stage}-${ok ? 'ok' : 'failed'}`);
  if (args.includes('--json')) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`${ok ? 'PASS' : 'FAIL'} ${slug}/${sceneId} ${stage}: ${steps.map((s) => `${s.name}${s.ok ? '+' : '-'}`).join(' ')}`);
    const bad = steps.find((s) => !s.ok);
    if (bad) console.log(`${bad.name} (exit ${bad.exitCode}) ${bad.command}\n${bad.summary}`);
  }
  process.exit(ok ? 0 : 1);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
