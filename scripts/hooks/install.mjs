#!/usr/bin/env node
// Idempotent: points this clone at scripts/hooks/git. Run from anywhere in the repo.
//   node scripts/hooks/install.mjs          install
//   node scripts/hooks/install.mjs --force  replace a different existing core.hooksPath
// Undo: git config --unset core.hooksPath
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const WANT = 'scripts/hooks/git';
const here = path.dirname(fileURLToPath(import.meta.url));
const run = (args, cwd = here) => spawnSync('git', args, { cwd, encoding: 'utf8' });
const top = run(['rev-parse', '--show-toplevel']);
if (top.status !== 0) { console.error('install: not a git work tree.'); process.exit(1); }
const root = top.stdout.trim();
const shim = path.join(root, WANT, 'pre-commit');
if (!fs.existsSync(shim)) { console.error(`install: missing ${WANT}/pre-commit`); process.exit(1); }
try { fs.chmodSync(shim, 0o755); } catch { /* not meaningful on Windows */ }
const cur = run(['config', '--get', 'core.hooksPath'], root).stdout.trim();
if (cur && cur !== WANT && !process.argv.includes('--force')) {
  console.error(`install: core.hooksPath is already "${cur}". Re-run with --force to replace it.`);
  process.exit(1);
}
if (cur === WANT) console.log(`already installed (core.hooksPath=${WANT}).`);
else {
  const r = run(['config', 'core.hooksPath', WANT], root);
  if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
  console.log(`installed: core.hooksPath=${WANT}`);
}
console.log('Undo: git config --unset core.hooksPath');
console.log('Bypass one commit on purpose: MTW_HOOKS_SKIP=<parity|media|wiki-code|prompts|all> git commit ...');
