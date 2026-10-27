// The comics projection for tests: the maintained producer (site/scripts/build-comics-library.mjs) run once per test
// process over the live repo, written to the test state dir. Studio computes the same projection live (server/library.ts).
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)), '..', '..');
let cached: string | null = null;

export function comicsSnapshot(): string {
  if (cached && existsSync(cached)) return cached;
  const dir = path.join(process.env.MTW_STATE_DIR || os.tmpdir(), 'comics-test');
  mkdirSync(dir, { recursive: true });
  const out = path.join(dir, `comics-library-${process.pid}.json`);
  const run = spawnSync(process.execPath, [path.join(repoRoot, 'site', 'scripts', 'build-comics-library.mjs'), '--repo', repoRoot, '--snapshot', out], {
    cwd: repoRoot,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (run.status !== 0) throw new Error(`comics producer failed: ${run.stderr || run.stdout}`);
  cached = out;
  return out;
}
