import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

test('lane-run --dry-run prints the codex_lane command and creates nothing', () => {
  const lane = fs.mkdtempSync(path.join(os.tmpdir(), 'lane-'));
  fs.writeFileSync(path.join(lane, 'lane-prompt.md'), 'x');
  fs.writeFileSync(path.join(lane, 'job.json'), '[]');
  fs.mkdirSync(path.join(lane, 'run-01'));
  const r = spawnSync(process.execPath, [fileURLToPath(new URL('./lane-run.mjs', import.meta.url)), '--lane', lane, '--dry-run', '--effort', 'high'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /codex_lane\.mjs/);
  assert.match(r.stdout, /run-02/);
  assert.match(r.stdout, /--effort high/);
  assert.match(r.stdout, /gpt-6\.1-sol/);
  assert.ok(!fs.existsSync(path.join(lane, 'run-02')));
});
