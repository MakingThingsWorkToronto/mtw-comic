import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPages, repoRoot } from './wiki-graph.mjs';
import { isMaintainedPage } from './wiki-frontmatter-gate.mjs';

const ENTRY_RE = /^-\s+\[(.+?)\]\((.+?)\)\s*(?:[—–]|--)?\s*(.*)$/;
const LOAD_WHEN_RE = /^Load when:\s*(\S[\s\S]*)$/i;
const TEMPORARY_DIR = 'discussion';

// NTFS resolves a wrong-case path; Linux hosts do not. Compare each segment against the real directory listing.
export function existsCaseSensitive(root, relative) {
  let current = root;
  for (const segment of relative.split('/')) {
    if (!fs.existsSync(current) || !fs.statSync(current).isDirectory() || !fs.readdirSync(current).includes(segment)) return false;
    current = path.join(current, segment);
  }
  return fs.existsSync(current);
}

export function indexEntries(root, readmeRelative) {
  const directory = path.posix.dirname(readmeRelative);
  return fs.readFileSync(path.join(root, readmeRelative), 'utf8').split(/\r?\n/).flatMap(line => {
    const entry = ENTRY_RE.exec(line);
    if (!entry) return [];
    const rawTarget = entry[2].split('#')[0];
    const target = /^[a-z][a-z0-9+.-]*:/i.test(rawTarget) ? rawTarget : path.posix.normalize(path.posix.join(directory, rawTarget));
    return [{ readme: readmeRelative, title: entry[1], rawTarget, target, loadWhen: LOAD_WHEN_RE.exec(entry[3])?.[1]?.trim() ?? null }];
  });
}

export function gate(root = repoRoot) {
  const findings = [];
  const pages = loadPages(root);
  const byPath = new Map(pages.map(page => [page.path, page]));
  const readmes = pages.filter(page => page.kind === 'index' && path.posix.basename(page.path) === 'README.md').map(page => page.path);
  if (!readmes.includes('wiki/README.md')) findings.push({ finding: 'NO-ANCHOR', detail: 'wiki/README.md must be an index page' });
  const entries = readmes.flatMap(readme => indexEntries(root, readme));
  const listed = new Map();
  for (const entry of entries) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(entry.target)) continue;
    if (entry.target.startsWith(`${TEMPORARY_DIR}/`) || entry.target.toLowerCase().includes(`/${TEMPORARY_DIR}/`)) findings.push({ finding: 'ISLAND-RULE', detail: `${entry.readme} → ${entry.rawTarget}` });
    if (!existsCaseSensitive(root, entry.target)) findings.push({ finding: 'TARGET-MISSING-OR-WRONG-CASE', detail: `${entry.readme} → ${entry.rawTarget}` });
    if (entry.loadWhen === null) findings.push({ finding: 'NO-LOAD-WHEN', detail: `${entry.readme} → ${entry.rawTarget}` });
    const page = byPath.get(entry.target);
    if (page && page.load_when && entry.loadWhen && !entry.loadWhen.startsWith(page.load_when.trim().replace(/\.?$/, '.'))) findings.push({ finding: 'TRIGGER-DIFFERS-FROM-FRONTMATTER', detail: `${entry.readme} → ${entry.rawTarget}` });
    listed.set(entry.target, (listed.get(entry.target) ?? 0) + 1);
  }
  for (const page of pages) {
    if (page.path === 'wiki/README.md' || !isMaintainedPage(page.path)) continue;
    const count = listed.get(page.path) ?? 0;
    if (count === 0) findings.push({ finding: 'UNROUTED', detail: page.path });
    if (count > 1) findings.push({ finding: 'ROUTED-TWICE', detail: page.path });
  }
  for (const control of ['wiki/README.md', 'wiki/site/README.md', 'wiki/journal/README.md']) if (!readmes.includes(control)) findings.push({ finding: 'CONTROL-README-MISSING', detail: control });
  return { readmes: readmes.length, entries: entries.length, findings };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = gate();
  for (const finding of result.findings) process.stdout.write(`${finding.finding}: ${finding.detail}\n`);
  process.stdout.write(`${JSON.stringify({ readmes: result.readmes, entries: result.entries, findings: result.findings.length })}\n`);
  process.exitCode = result.readmes === 0 ? 3 : result.findings.length ? 2 : 0;
}
