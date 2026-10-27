import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPages, repoRoot } from './wiki-graph.mjs';

// Progress phrasing on a maintained page (wiki/wiki-rules.md rule 1). Report only; --strict exits 2 on any hit.
export const NEEDLE = /\b(?:as of (?:today|now|20\d\d-\d\d-\d\d)|currently|so far|not yet|still (?:pending|open|missing|unperformed)|in progress|remain(?:s|ing)? (?:open|pending|unperformed|unverified|outstanding)|\d+ of \d+ (?:pages|diagrams|entries|tracks|issues|routes|tests)|\d+\/\d+ (?:tests|checks|assertions)|has not been deployed|awaiting)\b/i;
const EXEMPT_KINDS = new Set(['status', 'log', 'rules']);

export function scan(root = repoRoot) {
  const hits = [];
  for (const page of loadPages(root)) {
    if (EXEMPT_KINDS.has(page.kind)) continue;
    let inFence = false;
    page.body.split(/\r?\n/).forEach((line, index) => {
      if (/^```/.test(line)) inFence = !inFence;
      if (inFence || /^\|.*\|$/.test(line.trim()) && /^\|[-| :]+\|$/.test(line.trim())) return;
      const match = NEEDLE.exec(line);
      if (match && !/`[^`]*$/.test(line.slice(0, match.index))) hits.push({ path: page.path, line: index + 1, text: line.trim().slice(0, 160), match: match[0] });
    });
  }
  return hits;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const strict = process.argv.includes('--strict');
  const hits = scan();
  for (const hit of hits) process.stdout.write(`${hit.path}: "${hit.match}" — ${hit.text}\n`);
  process.stdout.write(`${JSON.stringify({ hits: hits.length })}\n`);
  process.exitCode = strict && hits.length ? 2 : 0;
}
