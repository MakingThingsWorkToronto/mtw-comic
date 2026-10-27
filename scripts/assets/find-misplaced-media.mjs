#!/usr/bin/env node
// find-misplaced-media — lists media (images, audio, video) in the repository that sits outside its
// canonical home (wiki/site/asset-locations.md). Read-only: it never moves, registers or deletes.
//
//   outside    media outside every canonical home, site/ integration copies and skill assets
//   wrong-home media inside a canonical home that is not its asset type's home (audio or images
//              under wiki/comics-library/ or wiki/journal/; recordings belong in the soundtrack
//              library, pictures in the image library)
//
// Tracked and untracked files count; ignored transport (.codex/worktrees/, apps/mtw/.state/) does not.
// Exemptions are the shared ones in scripts/assets/media-exempt.txt and skill assets.
//
// Usage: node scripts/assets/find-misplaced-media.mjs [--json]
// The SessionStart hook prints the totals to every session; relocation follows the "Misplaced media"
// section of wiki/site/asset-locations.md.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMedia, isExemptMedia, mediaExemptions } from './media-registration.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const TYPE_HOMES = { image: 'wiki/image-library/', audio: 'wiki/soundtrack-library/' };
const CONTENT_HOMES = ['wiki/comics-library/', 'wiki/journal/'];
const AUDIO = /\.(?:mp3|wav|ogg|m4a|aac|flac|opus|weba)$/i;

/** `{ outside: string[], wrongHome: string[] }`, repo-relative POSIX paths. */
export function findMisplacedMedia(root = ROOT) {
  const r = spawnSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`git ls-files failed: ${r.stderr.trim()}`);
  const exemptions = mediaExemptions(root);
  const outside = [];
  const wrongHome = [];
  for (const rel of r.stdout.split('\0').filter(Boolean)) {
    if (!isMedia(rel) || rel.startsWith('site/') || isExemptMedia(rel, root, exemptions)) continue;
    if (Object.values(TYPE_HOMES).some((h) => rel.startsWith(h))) continue;
    if (CONTENT_HOMES.some((h) => rel.startsWith(h))) wrongHome.push(rel);
    else outside.push(rel);
  }
  return { outside, wrongHome };
}

/** Containing folder (first three segments) -> count, largest first. */
export function byFolder(paths) {
  const counts = new Map();
  for (const p of paths) {
    const k = path.posix.dirname(p).split('/').slice(0, 3).join('/');
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1]);
}

export function homeFor(rel) {
  return AUDIO.test(rel) ? TYPE_HOMES.audio : TYPE_HOMES.image;
}

const invokedDirectly = Boolean(process.argv[1]) && /find-misplaced-media\.mjs$/.test(process.argv[1]);
if (invokedDirectly) {
  const found = findMisplacedMedia();
  if (process.argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify({ ...found, homes: Object.fromEntries([...found.outside, ...found.wrongHome].map((p) => [p, homeFor(p)])) }, null, 2)}\n`);
  } else {
    for (const [label, list] of [['Outside canonical homes', found.outside], ['In a content home, not its media home', found.wrongHome]]) {
      process.stdout.write(`${label}: ${list.length}\n`);
      for (const [folder, n] of byFolder(list)) process.stdout.write(`  ${n}\t${folder}/\n`);
    }
  }
}
