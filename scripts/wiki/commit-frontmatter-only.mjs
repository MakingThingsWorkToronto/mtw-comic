#!/usr/bin/env node
// Commit ONLY the frontmatter block of pages whose bodies another session is still editing.
// For each path: blob = working-tree frontmatter + HEAD body (HEAD frontmatter removed). The commit is
// built in a temporary index so the shared index and the working tree are untouched; afterwards the
// shared index entry for each path is set to the committed blob so no peer commit can revert it.
//
//   node scripts/wiki/commit-frontmatter-only.mjs -m "message" -- wiki/site/a.md wiki/site/b.md
//
// Refuses when the working-tree frontmatter is invalid, when a path has no frontmatter, or when HEAD
// and the working tree differ by more than the frontmatter plus the body edits of others (that is the
// normal case; the check is that the body we commit is exactly HEAD's).
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { readPage, repoRoot } from './wiki-graph.mjs';

const FENCE = /^(?:﻿)?---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/;
const args = process.argv.slice(2);
const dash = args.indexOf('--');
const messageIndex = args.indexOf('-m');
if (dash < 0 || messageIndex < 0 || !args[messageIndex + 1] || dash === args.length - 1) {
  console.error('usage: node scripts/wiki/commit-frontmatter-only.mjs -m "message" -- <wiki page> [...]');
  process.exit(2);
}
const message = args[messageIndex + 1];
const paths = args.slice(dash + 1);

function git(cmdArgs, options = {}) {
  const r = spawnSync('git', cmdArgs, { cwd: repoRoot, encoding: options.binary ? 'buffer' : 'utf8', input: options.input, env: { ...process.env, ...(options.env ?? {}) }, maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`git ${cmdArgs.join(' ')}: ${r.stderr.toString().trim()}`);
  return r.stdout;
}

const blobs = [];
for (const relative of paths) {
  const working = fs.readFileSync(path.join(repoRoot, relative));
  const page = readPage(working, relative, { strict: true });
  if (!page) throw new Error(`${relative}: no frontmatter in the working tree`);
  const frontmatter = working.toString('utf8').match(FENCE)?.[0];
  const head = git(['show', `HEAD:${relative}`], { binary: true }).toString('utf8');
  const headBody = head.replace(FENCE, '');
  const content = frontmatter + headBody;
  readPage(Buffer.from(content), relative, { strict: true });
  const sha = git(['hash-object', '-w', '--stdin'], { input: content }).trim();
  blobs.push({ relative, sha });
}

const temporaryIndex = path.join(os.tmpdir(), `mtw-frontmatter-index-${process.pid}`);
try {
  const env = { GIT_INDEX_FILE: temporaryIndex };
  git(['read-tree', 'HEAD'], { env });
  for (const { relative, sha } of blobs) git(['update-index', '--add', '--cacheinfo', `100644,${sha},${relative}`], { env });
  const tree = git(['write-tree'], { env }).trim();
  const head = git(['rev-parse', 'HEAD']).trim();
  const commit = git(['commit-tree', tree, '-p', head, '-m', message]).trim();
  git(['update-ref', 'refs/heads/main', commit, head]);
  // Keep the shared index agreeing with the new HEAD for exactly these paths.
  for (const { relative, sha } of blobs) git(['update-index', '--cacheinfo', `100644,${sha},${relative}`]);
  process.stdout.write(`${commit.slice(0, 8)} ${blobs.length} frontmatter-only page(s): ${blobs.map(b => b.relative).join(', ')}\n`);
} finally {
  fs.rmSync(temporaryIndex, { force: true });
}
