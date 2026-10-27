// Copy every lane output of one scene into the image library and register them in one call.
// Usage: node scripts/comics/wave-register.mjs --slug <slug> --build <buildId> --scene <id> [--dry-run] [--json]
//        [--register-cmd <script.mjs>] [--check-cmd <script.mjs>]   (or env MTW_REGISTER_CMD / MTW_CHECK_CMD; test stubs)
// Reads <transport>/scenes/<scene>/lane-NN/run-NN/lane-manifest.json (every attempt, selected or not), copies to
// wiki/image-library/assets/scenes/comic-b/<slug>-build-<buildId>/<scene>/<jobId>-v<N>.png (N per job across runs, never
// overwritten), checks each destination, registers once, writes registration into the manifests and the ledger.
// --dry-run copies nothing and writes nothing. Exit 0 ok, 1 error or blockedBy, 2 usage.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { REPO, rel, abs, sha256 } from './lib/story.mjs';
import { openLedger, writeLedger, sceneState, transportDir } from './lib/ledger.mjs';

const a = process.argv.slice(2);
const opt = (n, d) => (a.includes(`--${n}`) ? a[a.indexOf(`--${n}`) + 1] : d);
const slug = opt('slug'), buildId = opt('build'), scene = opt('scene');
const dry = a.includes('--dry-run'), asJson = a.includes('--json');
if (!slug || !buildId || !scene) { console.error('usage: wave-register.mjs --slug <slug> --build <buildId> --scene <id> [--dry-run] [--json]'); process.exit(2); }
const registerScript = opt('register-cmd', process.env.MTW_REGISTER_CMD) ?? path.join(REPO, 'apps', 'mtw', 'cli', 'mtw.mjs');
const checkScript = opt('check-cmd', process.env.MTW_CHECK_CMD) ?? path.join(REPO, 'scripts', 'assets', 'check-asset-destination.mjs');
const say = (...m) => { if (!asJson) console.log(...m); };
const fail = (msg, extra = {}) => { if (asJson) console.log(JSON.stringify({ ok: false, error: msg, ...extra }, null, 2)); else console.error(msg); process.exit(1); };

const sceneDir = path.join(transportDir(slug, buildId), 'scenes', scene);
const numbered = (dir, re) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((n) => re.test(n)).sort() : []);
const manifests = [];
for (const lane of numbered(sceneDir, /^lane-\d+$/)) for (const run of numbered(path.join(sceneDir, lane), /^run-\d+$/)) {
  const file = path.join(sceneDir, lane, run, 'lane-manifest.json');
  if (fs.existsSync(file)) manifests.push({ file, manifest: JSON.parse(fs.readFileSync(file, 'utf8')) });
}
if (!manifests.length) fail(`no lane-manifest.json under ${sceneDir}`);

const libDir = path.join(REPO, 'wiki', 'image-library');
const destDir = path.join(libDir, 'assets', 'scenes', 'comic-b', `${slug}-build-${buildId}`, scene);
const seen = {};
const plan = []; // { entry (manifest job), manifestRef, src, dest, version, noop }
for (const m of manifests) for (const job of m.manifest.jobs) {
  if (!job.output) continue;
  const version = (seen[job.id] = (seen[job.id] ?? 0) + 1);
  const src = abs(job.output.path);
  const dest = path.join(destDir, `${job.id}-v${version}.png`);
  const want = fs.existsSync(src) ? sha256(fs.readFileSync(src)) : null;
  if (!want) fail(`${job.output.path}: source missing`);
  if (want !== job.output.sha256) fail(`${job.output.path}: sha256 differs from its lane manifest`);
  let noop = false;
  if (fs.existsSync(dest)) {
    if (sha256(fs.readFileSync(dest)) !== want) fail(`${rel(dest)}: exists with different bytes; never overwritten`);
    noop = true;
  }
  plan.push({ job, m, src, dest, version, noop, sha256: want });
}
const fresh = plan.filter((p) => !p.noop);

for (const p of fresh) {
  const r = spawnSync(process.execPath, [checkScript, 'image', rel(p.dest)], { cwd: REPO, encoding: 'utf8' });
  if (r.status !== 0) fail(`check-asset-destination refused ${rel(p.dest)}:\n${r.stdout}${r.stderr}`);
}
if (!dry) for (const p of fresh) {
  fs.mkdirSync(path.dirname(p.dest), { recursive: true });
  fs.copyFileSync(p.src, p.dest);
  if (sha256(fs.readFileSync(p.dest)) !== p.sha256) fail(`${rel(p.dest)}: copy sha256 mismatch`);
}

let result = { items: [] };
let outFile = null;
if (fresh.length) {
  say(`registering ${fresh.length} image(s); the producer hashes the whole library and can take minutes...`);
  const args = [registerScript, 'register', 'image', ...fresh.map((p) => rel(p.dest)), '--style', 'comic-ink', '--collection', 'scenes', '--service', 'Comic B', '--category', 'Comic B', '--note', `comic build ${slug} ${buildId} scene ${scene}`, '--json'];
  if (dry) args.push('--dry-run');
  const r = spawnSync(process.execPath, args, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
  try { result = JSON.parse(r.stdout); } catch { fail(`register output was not JSON (exit ${r.status}):\n${r.stdout}${r.stderr}`); }
  const blocked = result.blockedBy ?? [];
  if (blocked.length) { say('register is blocked by other unregistered files:'); blocked.forEach((b) => say(`  ${typeof b === 'string' ? b : JSON.stringify(b)}`)); fail('blockedBy: register nothing until those are owned', { blockedBy: blocked }); }
  if (r.status !== 0) fail(`register exited ${r.status}:\n${r.stdout}${r.stderr}`);
  if (!dry) {
    const n = numbered(sceneDir, /^register-\d+\.json$/).length + 1;
    outFile = path.join(sceneDir, `register-${String(n).padStart(2, '0')}.json`);
    fs.writeFileSync(outFile, JSON.stringify(result, null, 2) + '\n');
  }
}

const items = result.items ?? [];
const regs = plan.map((p) => {
  const libPath = path.relative(libDir, p.dest).replaceAll('\\', '/');
  const item = items.find((i) => typeof i.path === 'string' && i.path.replaceAll('\\', '/').endsWith(libPath));
  return { p, reg: { path: libPath, version: p.version, recordId: item?.recordId ?? null, registeredAt: null, ok: item ? item.ok !== false : p.noop || dry } };
});
if (!dry) {
  for (const { p, reg } of regs) p.job.registration = reg;
  for (const m of manifests) fs.writeFileSync(m.file, JSON.stringify(m.manifest, null, 2) + '\n');
  const state = openLedger(slug, buildId);
  sceneState(state, scene).registered = { at: null, count: regs.length, paths: regs.map((r) => r.reg.path), ok: regs.every((r) => r.reg.ok), output: outFile ? rel(outFile) : null };
  writeLedger(state);
}
const summary = { ok: regs.every((r) => r.reg.ok), dryRun: dry, copied: fresh.length, noop: plan.length - fresh.length, destinations: regs.map((r) => rel(path.join(libDir, r.reg.path))), output: outFile ? rel(outFile) : null };
if (asJson) console.log(JSON.stringify(summary, null, 2));
else { regs.forEach((r) => say(`${r.reg.ok ? 'ok ' : 'BAD'} v${r.reg.version} ${r.reg.path}${r.p.noop ? ' (already there)' : ''}`)); say(dry ? 'dry run: nothing written' : `ledger updated; register output ${summary.output ?? '(none)'}`); }
process.exit(summary.ok ? 0 : 1);
