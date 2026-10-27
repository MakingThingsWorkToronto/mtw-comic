import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { transportDir } from './lib/ledger.mjs';
import { REPO } from './lib/story.mjs';

const script = fileURLToPath(new URL('./wave-register.mjs', import.meta.url));
const slug = `wavetest-${process.pid}`;
const buildId = 'b1';
const scene = 'sc1';
const sha = (b) => createHash('sha256').update(b).digest('hex');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wr-'));
const okCheck = path.join(tmp, 'check.mjs');
const registerStub = path.join(tmp, 'register.mjs');
fs.writeFileSync(okCheck, 'process.exit(0);\n');
fs.writeFileSync(registerStub, "const paths = process.argv.slice(4).filter((x) => x.endsWith('.png'));\nconst blocked = process.env.STUB_BLOCK ? ['other/file.png'] : [];\nconsole.log(JSON.stringify({ items: paths.map((p, i) => ({ path: p, recordId: 'rec-' + i, ok: true })), blockedBy: blocked }));\n");

const root = transportDir(slug, buildId);
test.after(() => fs.rmSync(root, { recursive: true, force: true }));

function makeRun(lane, run, jobs) {
  const dir = path.join(root, 'scenes', scene, lane, run);
  fs.mkdirSync(path.join(dir, 'out'), { recursive: true });
  const outJobs = jobs.map(([id, bytes]) => {
    const buf = Buffer.from(bytes);
    const file = path.join(dir, 'out', `${id}.png`);
    fs.writeFileSync(file, buf);
    return { id, output: { path: path.relative(REPO, file).replaceAll('\\', '/'), sha256: sha(buf) }, registration: null };
  });
  fs.writeFileSync(path.join(dir, 'lane-manifest.json'), JSON.stringify({ schema: 'comic-lane/1', jobs: outJobs }));
}
const run = (extra = [], env = {}) => spawnSync(process.execPath, [script, '--slug', slug, '--build', buildId, '--scene', scene, '--dry-run', '--json', '--register-cmd', registerStub, '--check-cmd', okCheck, ...extra], { encoding: 'utf8', env: { ...process.env, ...env } });

test('dry run numbers versions per job across runs and writes nothing', () => {
  makeRun('lane-01', 'run-01', [['box-a', 'one'], ['box-b', 'two']]);
  makeRun('lane-01', 'run-02', [['box-a', 'three']]);
  const r = run();
  assert.equal(r.status, 0, r.stderr + r.stdout);
  const out = JSON.parse(r.stdout);
  const names = out.destinations.map((d) => d.split('/').pop());
  assert.deepEqual(names, ['box-a-v1.png', 'box-b-v1.png', 'box-a-v2.png']);
  assert.ok(out.destinations[0].includes(`scenes/comic-b/${slug}-build-${buildId}/${scene}/`));
  assert.ok(out.dryRun);
  assert.ok(!fs.existsSync(path.join(REPO, out.destinations[0])));
});

test('an existing destination with different bytes is an error, never overwritten', () => {
  const dest = path.join(REPO, 'wiki', 'image-library', 'assets', 'scenes', 'comic-b', `${slug}-build-${buildId}`, scene, 'box-a-v1.png');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, 'different');
  try {
    const r = run();
    assert.equal(r.status, 1);
    assert.match(r.stdout, /different bytes/);
    assert.equal(fs.readFileSync(dest, 'utf8'), 'different');
  } finally {
    fs.rmSync(path.join(REPO, 'wiki', 'image-library', 'assets', 'scenes', 'comic-b', `${slug}-build-${buildId}`), { recursive: true, force: true });
  }
});

test('blockedBy from the producer stops with exit 1', () => {
  const r = run([], { STUB_BLOCK: '1' });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /blockedBy/);
  assert.match(r.stdout, /other\/file\.png/);
});
