import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gate as frontmatterGate, isMaintainedPage, PRODUCER_OWNED } from './wiki-frontmatter-gate.mjs';
import { gate as indexGate, existsCaseSensitive, indexEntries } from './wiki-index-gate.mjs';
import { scan, NEEDLE } from './wiki-status-scan.mjs';
import { renderIndexes, repoRoot } from './wiki-graph.mjs';

const page = (id, { kind = 'knowledge', load = `Working on ${id}.`, body = '# Page\n', fm = '' } = {}) => `---\nid: ${JSON.stringify(id)}\nkind: ${JSON.stringify(kind)}\ntitle: ${JSON.stringify(id)}\nload_when: ${JSON.stringify(load)}\nthemes: ["wiki"]\n${fm}relations: []\n---\n${body}`;

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mtw-wiki-gates-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const put = (rel, text) => { const file = path.join(root, rel); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); };
  put('wiki/README.md', page('wiki:README', { kind: 'index', body: '# Index\n\n<!-- wiki-index:begin folders -->\n<!-- wiki-index:end -->\n' }));
  put('wiki/site/README.md', page('wiki:site/README', { kind: 'index', body: '# Site\n\n<!-- wiki-index:begin pages -->\n<!-- wiki-index:end -->\n' }));
  put('wiki/journal/README.md', page('wiki:journal/README', { kind: 'index', body: '# Journal\n\n<!-- wiki-index:begin pages -->\n<!-- wiki-index:end -->\n' }));
  put('wiki/site/design.md', page('wiki:site/design'));
  const render = () => { for (const [rel, text] of renderIndexes(root)) fs.writeFileSync(path.join(root, rel), text); };
  return { root, put, render };
}

test('population: source records, operation data and producer-owned READMEs are not maintained pages', () => {
  assert.ok(isMaintainedPage('wiki/site/design.md'));
  assert.ok(isMaintainedPage('wiki/journal/records/README.md'));
  for (const rel of ['wiki/journal/entries/x/README.md', 'wiki/journal/interviews/x.md', 'wiki/journal/records/2026-01-01-x.md', 'wiki/image-library/records/x.md', 'wiki/image-library/assets/x.md', 'wiki/operations/prompts/x.md', 'wiki/experience/resume-full.md', 'wiki/journal/console/README.md', ...PRODUCER_OWNED]) assert.ok(!isMaintainedPage(rel), rel);
});

test('frontmatter gate names unstamped and BOM-prefixed pages', (t) => {
  const { root, put } = fixture(t);
  assert.equal(frontmatterGate(root).findings.length, 0);
  put('wiki/site/notes.md', '# No frontmatter\n');
  put('wiki/site/bom.md', '﻿' + page('wiki:site/bom'));
  put('wiki/site/half.md', page('wiki:site/half').replace(/load_when: .*\n/, ''));
  const findings = frontmatterGate(root).findings.map(f => `${path.basename(f.path)}:${f.finding}`).sort();
  assert.deepEqual(findings, ['bom.md:BOM-BEFORE-FENCE', 'half.md:missing load_when', 'notes.md:NO-FRONTMATTER']);
});

test('index gate: every maintained page routed once, case-sensitive targets, island rule, trigger agreement', (t) => {
  const { root, put, render } = fixture(t);
  render();
  assert.deepEqual(indexGate(root).findings, []);
  put('wiki/site/orphan.md', page('wiki:site/orphan'));
  assert.deepEqual(indexGate(root).findings.map(f => f.finding), ['UNROUTED']);
  render();
  assert.deepEqual(indexGate(root).findings, []);
  const site = path.join(root, 'wiki/site/README.md');
  fs.appendFileSync(site, '- [Design again](Design.md) — Load when: duplicate.\n- [Plan](../../discussion/plan.md) — Load when: never.\n- [Orphan](orphan.md) — Load when: a hand-edited trigger.\n');
  const findings = indexGate(root).findings.map(f => f.finding).sort();
  assert.deepEqual(findings, ['ISLAND-RULE', 'ROUTED-TWICE', 'TARGET-MISSING-OR-WRONG-CASE', 'TARGET-MISSING-OR-WRONG-CASE', 'TRIGGER-DIFFERS-FROM-FRONTMATTER']);
  assert.ok(existsCaseSensitive(root, 'wiki/site/design.md'));
  assert.ok(!existsCaseSensitive(root, 'wiki/site/Design.md'));
  assert.equal(indexEntries(root, 'wiki/site/README.md').filter(e => e.rawTarget === 'orphan.md').at(-1).loadWhen, 'a hand-edited trigger.');
});

test('status scan reports progress phrasing, skips fences, inline code and status/log/rules pages', (t) => {
  const { root, put } = fixture(t);
  put('wiki/site/progress.md', page('wiki:site/progress', { body: '# P\n\nThe browser review is still pending for 3 of 7 pages.\n\n```text\nnot yet\n```\n\nThe needle `not yet` in code is fine.\n' }));
  put('wiki/site/status.md', page('wiki:site/status', { kind: 'status', body: '# S\n\nstill pending\n' }));
  const hits = scan(root);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].path, 'wiki/site/progress.md');
  assert.ok(NEEDLE.test('as of 2026-10-10'));
});

test('the real tree: frontmatter and index gates have a measured, shrink-only residue', () => {
  // Every maintained page is stamped and routed; any finding is a regression.
  // A page mid-edit by another session may throw; that counts as one finding, never a crash.
  const count = gateFn => { try { return gateFn(repoRoot).findings.length; } catch { return 1; } };
  const frontmatter = count(frontmatterGate), index = count(indexGate);
  assert.equal(frontmatter, 0, `frontmatter findings rose to ${frontmatter}`);
  assert.equal(index, 0, `index findings rose to ${index}`);
});
