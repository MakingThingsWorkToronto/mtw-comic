// Run one Codex image lane in the foreground and file its outputs.
// Usage: node scripts/comics/lane-run.mjs --lane <dir> [--model gpt-6.1-sol] [--effort low] [--timeout-s 560]
//        [--sandbox read-only] [--dry-run]
// Picks <lane>/run-NN (next unused), runs codex_lane.mjs, copies each job's PNG to <run>/out/<id>.png,
// writes <run>/lane-manifest.json and prints one line per job. Exit 0 ok, 1 a job has no image, 2 usage.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { REPO, abs } from './lib/story.mjs';
import { buildLaneManifest } from './lane-manifest.mjs';

const CODEX_LANE = path.join(REPO, '.claude', 'skills', 'codex-orchestration', 'scripts', 'codex_lane.mjs');

function nextRun(laneDir) {
  for (let n = 1; n < 100; n++) {
    const dir = path.join(laneDir, `run-${String(n).padStart(2, '0')}`);
    if (!fs.existsSync(dir)) return dir;
  }
  throw new Error(`${laneDir}: no free run-NN`);
}

const a = process.argv.slice(2);
const opt = (name, d) => (a.includes(`--${name}`) ? a[a.indexOf(`--${name}`) + 1] : d);
if (!opt('lane')) { console.error('usage: lane-run.mjs --lane <dir> [--model m] [--effort e] [--timeout-s N] [--sandbox s] [--dry-run]'); process.exit(2); }
const laneDir = abs(opt('lane'));
if (!fs.existsSync(path.join(laneDir, 'lane-prompt.md')) || !fs.existsSync(path.join(laneDir, 'job.json'))) { console.error(`${laneDir}: needs lane-prompt.md and job.json`); process.exit(2); }
const runDir = nextRun(laneDir);
const cmd = [process.execPath, CODEX_LANE, 'run', '--prompt', path.join(laneDir, 'lane-prompt.md'), '--cd', REPO, '--out', runDir,
  '--sandbox', opt('sandbox', 'read-only'), '--model', opt('model', 'gpt-6.1-sol'), '--effort', opt('effort', 'low'), '--timeout-s', opt('timeout-s', '560')];
if (a.includes('--dry-run')) { console.log(cmd.map((c) => (/\s/.test(c) ? `"${c}"` : c)).join(' ')); process.exit(0); }

const r = spawnSync(cmd[0], cmd.slice(1), { stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8', maxBuffer: 1 << 28 });
if (!fs.existsSync(path.join(runDir, 'receipt.json'))) { console.error(`codex_lane exited ${r.status} without a receipt`); process.exit(1); }
const manifest = await buildLaneManifest(runDir);
for (const j of manifest.jobs) {
  const x = j.output;
  console.log(`${j.id}\tok=${!!x}\t${x ? `${x.width}x${x.height}` : '-'}\talpha=${x ? x.alpha : '-'}\tfitsCanvas=${x ? x.fitsCanvas : '-'}`);
}
process.exit(manifest.jobs.some((j) => !j.output) ? 1 : 0);
