// Bind selected box art from a build ledger into the canonical comic story (skill: mtw-comic-story).
// Usage: node scripts/comics/bind-art.mjs --slug <registry slug|story id> --build <buildId> --scene <id>
//          [--dry-run] [--json] [--no-check] [--story <file>] [--ledger-root <dir>] [--public-root <dir>]
// Per box with ledger `selected`: encodes 1600px WebP copies under <public-root>/comic/<story.id>/build-<buildId>/ (never
// overwriting different bytes), then writes staticArt (no planes) or two views (base at 0, stack at 1 with layers +
// layerMotion) plus fallbackView. Saves the story by compare-and-swap, runs comic-story-check --require-art, and on a pass
// marks box.bound and scene status 'bound'. Exit 0 ok, 1 box/check failure, 2 usage.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { loadStory, saveStory, findPanel, storyPathFor, sha256, sha256File, REPO, rel, abs } from './lib/story.mjs';
import { ledgerDir, sceneState, boxState } from './lib/ledger.mjs';

const sharp = createRequire(path.join(REPO, 'site', 'package.json'))('sharp');
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : undefined; };
const [slug, buildId, sceneId] = [opt('slug'), opt('build'), opt('scene')];
if (!slug || !buildId || !sceneId) { console.error('usage: bind-art.mjs --slug <slug> --build <buildId> --scene <id> [--dry-run] [--json] [--no-check] [--story file] [--ledger-root dir] [--public-root dir]'); process.exit(2); }
const dry = flag('dry-run'), publicRoot = path.resolve(opt('public-root') ?? path.join(REPO, 'site', 'public'));

// site/src/data/comic-stories/<slug>.ts, else the index.ts registry line with slug and story symbol.
function resolveStoryFile(name) {
  if (opt('story')) return path.resolve(opt('story'));
  const direct = storyPathFor(name);
  if (fs.existsSync(direct)) return direct;
  const dir = path.dirname(direct), index = fs.readFileSync(path.join(dir, 'index.ts'), 'utf8');
  const line = index.split('\n').find((l) => l.includes(`slug: '${name}'`) && /story:\s*\w+Comic/.test(l));
  const sym = line?.match(/story:\s*(\w+Comic)/)?.[1];
  const imp = sym && index.match(new RegExp(`import\\s*\\{[^}]*\\b${sym}\\b[^}]*\\}\\s*from\\s*'([^']+)'`));
  if (!imp) throw new Error(`no story file for ${name}`);
  return path.join(dir, `${imp[1].replace(/^\.\//, '')}.ts`);
}

const loaded = loadStory(resolveStoryFile(slug));
const story = loaded.story, before = JSON.stringify(story);
const ledgerFile = path.join(opt('ledger-root') ? path.resolve(opt('ledger-root'), `${slug}-build-${buildId}`) : ledgerDir(slug, buildId), 'state.json');
const state = JSON.parse(fs.readFileSync(ledgerFile, 'utf8'));
const scene = sceneState(state, sceneId);
const outRel = `comic/${story.id}/build-${buildId}`, outDir = path.join(publicRoot, outRel);
const results = [];
let failed = false;

// Encode to a 1600px WebP (alpha kept). Identical existing file: skip. Different existing file: refuse.
async function publish(box, name, srcFile) {
  const buf = await sharp(abs(srcFile)).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 86, alphaQuality: 90 }).toBuffer();
  const file = path.join(outDir, `${box}-${name}.webp`);
  let wrote = false;
  if (fs.existsSync(file)) {
    if (sha256File(file) !== sha256(buf)) throw new Error(`${rel(file)} exists with different content; refusing to overwrite`);
  } else {
    if (!dry) { fs.mkdirSync(outDir, { recursive: true }); fs.writeFileSync(file, buf); }
    wrote = true;
  }
  return { url: `/${outRel}/${box}-${name}.webp`, wrote };
}
function authority(img, src, sha, recordId) {
  const file = abs(src);
  if (sha256File(file) !== sha) throw new Error(`${src}: sha256 differs from the ledger`);
  return { panelId: img, path: rel(file), sha256: sha, recordId: recordId ?? 'pending-registration', treatment: 'comic-ink' };
}

for (const [img, box] of Object.entries(scene.boxes)) {
  const sel = box.selected;
  if (!sel) { console.warn(`${img}: no selected master, skipped`); results.push({ img, skipped: true }); continue; }
  try {
    const { panel } = findPanel(story, sceneId, img);
    const ar = sel.ar ?? [0, 0, 1, 1], fit = sel.fit ?? 'cover';
    const speakers = Object.fromEntries((box.faces ?? []).map((f) => [f.cast, { mouth: f.mouth, face: f.face }]));
    const canonicalSource = authority(img, sel.src, sel.sha256, sel.recordId);
    const base = await publish(img, 'v', sel.src);
    const planes = box.planes ?? [], wrote = [base.wrote];
    delete panel.views; delete panel.staticArt; delete panel.fallbackView;
    const art = { ar, fit, src: base.url, ...(Object.keys(speakers).length ? { speakers } : {}), canonicalSource };
    if (!planes.length) panel.staticArt = art;
    else {
      const layers = [];
      for (const p of planes) {
        const out = await publish(img, p.id, p.src); wrote.push(out.wrote);
        layers.push({ id: p.id, role: p.role, src: out.url, canonicalSource: authority(img, p.src, p.sha256, p.recordId) });
      }
      const layerMotion = planes.filter((p) => p.motion).map((p) => ({ layerId: p.id, ...p.motion }));
      const { speakers: _s, ...stackArt } = art;
      panel.staticArt = art;
      panel.views = [{ id: 'base', at: 0, alt: panel.alt, ...art }, { id: 'stack', at: 1, alt: panel.alt, ...stackArt, layers, layerMotion }];
      panel.fallbackView = { desktop: 'base', phone: 'base' };
    }
    const n = wrote.filter(Boolean).length;
    results.push({ img, planes: planes.length, wrote: n, src: base.url });
    console.log(`${img}: ${planes.length ? `${planes.length} planes` : 'single image'} -> ${base.url} (${n} new file(s))`);
  } catch (e) { failed = true; results.push({ img, error: e.message }); console.error(`${img}: ERROR ${e.message}`); }
}

const changed = JSON.stringify(story) !== before;
if (changed && !dry && !failed) saveStory(loaded, story);
if (changed) console.log(dry ? 'dry run: story not saved' : failed ? 'story not saved (box errors)' : `story saved: ${rel(loaded.file)}`);

let check = null;
if (!dry && !failed && !flag('no-check')) {
  const siteDir = path.join(REPO, 'site'), storyRel = path.relative(siteDir, loaded.file).replaceAll('\\', '/');
  const r = spawnSync(process.execPath, ['scripts/comic-story-check.mjs', '--story', storyRel, '--require-art'], { cwd: siteDir, encoding: 'utf8' });
  const lines = `${r.stdout}\n${r.stderr}`.split('\n').filter((l) => l.includes(sceneId) || /ERROR/.test(l)).slice(0, 20);
  check = { ok: r.status === 0, lines };
  console.log(`comic-story-check: ${check.ok ? 'pass' : 'FAIL'}`);
  lines.forEach((l) => console.log(`  ${l}`));
  if (!check.ok) failed = true;
}
if (check) {
  for (const r of results.filter((x) => x.src)) boxState(state, sceneId, r.img).bound = { at: null, ok: check.ok, src: r.src };
  if (check.ok) scene.status = 'bound';
  fs.writeFileSync(`${ledgerFile}.tmp`, JSON.stringify(state, null, 2) + '\n');
  fs.renameSync(`${ledgerFile}.tmp`, ledgerFile);
}
if (flag('json')) console.log(JSON.stringify({ slug, buildId, scene: sceneId, dryRun: dry, results, check }, null, 2));
process.exit(failed ? 1 : 0);
