import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildGraph, neighborhood, readPage } from './wiki-graph.mjs';

const page = (id, relations = [], body = '# Page\n') => `---\nid: ${JSON.stringify(id)}\nkind: "knowledge"\ntitle: "Page"\nload_when: "Testing."\nthemes: ["wiki"]\nrelations: ${JSON.stringify(relations)}\n---\n${body}`;
const bare = (id, relations = [], body = '# Page\n') => page(id, relations, body).replace('load_when: "Testing."\nthemes: ["wiki"]\n', '');
function fixture(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mtw-wiki-graph-'));
  fs.mkdirSync(path.join(root, 'wiki'));
  try { return run(root, (name, text) => fs.writeFileSync(path.join(root, 'wiki', name), text)); }
  finally {
    for (const name of fs.readdirSync(path.join(root, 'wiki'))) fs.unlinkSync(path.join(root, 'wiki', name));
    fs.rmdirSync(path.join(root, 'wiki')); fs.rmdirSync(root);
  }
}

test('frontmatter preserves body and accepts CRLF; raw sources are not ingested', () => {
  const body = '# Knowledge\r\n\r\nVerbatim—source.\r\n';
  const input = page('wiki:a', [], '').replaceAll('\n', '\r\n') + body;
  assert.equal(readPage(Buffer.from(input), 'a.md').body, body);
  assert.equal(readPage(Buffer.from('# Raw answers\n'), 'answers.md'), null);
  assert.equal(readPage(Buffer.from([0xff, 0xfe, 0x23]), 'legacy-source.md'), null);
});

test('duplicate fields, unknown fields, unsupported YAML and malformed relations fail', () => {
  for (const input of [page('wiki:a').replace('kind:', 'id: "wiki:other"\nkind:'), page('wiki:a').replace('kind:', 'noise: true\nkind:'), page('wiki:a').replace('"knowledge"', 'knowledge'), page('wiki:a', [{ type: 'supports', target: 'wiki:b' }])]) {
    assert.throws(() => readPage(Buffer.from(input), 'a.md'));
  }
});

test('duplicate page IDs and unknown reasoning targets fail', () => fixture((root, write) => {
  write('a.md', page('wiki:a')); write('b.md', page('wiki:a'));
  assert.throws(() => buildGraph(root), /Duplicate id/);
  write('b.md', page('wiki:b', [{ type: 'supports', target: 'wiki:absent', reason: 'Evidence.' }]));
  assert.throws(() => buildGraph(root), /unknown relation target/);
}));

test('reasoning evidence resolves to retained source references, never invented support', () => fixture((root, write) => {
  write('source.md', 'Original untouched source.\n');
  write('a.md', page('wiki:a', [{ type: 'supports', target: 'wiki:b', reason: 'Measured result.', evidence: ['source.md'] }], '# A\n[B](b.md) [source](source.md)\n'));
  write('b.md', page('wiki:b'));
  const graph = buildGraph(root);
  assert.deepEqual(graph.edges.find(edge => edge.type === 'supports').evidence, ['file:wiki/source.md']);
  assert.equal(graph.edges.filter(edge => edge.type === 'supports').length, 1);
  assert.equal(graph.nodes.find(node => node.id === 'file:wiki/source.md').kind, 'reference');
  assert.equal(fs.readFileSync(path.join(root, 'wiki/source.md'), 'utf8'), 'Original untouched source.\n');
  assert.equal(neighborhood(graph, 'wiki:b').incoming.length, 2);
  assert.throws(() => neighborhood(graph, 'wiki:missing'), /Unknown node/);
  assert.deepEqual(buildGraph(root), graph);
}));

test('missing and escaping reasoning evidence fails; ordinary broken links are visible', () => fixture((root, write) => {
  write('b.md', page('wiki:b'));
  const relation = evidence => [{ type: 'derived_from', target: 'wiki:b', reason: 'Source basis.', evidence }];
  write('a.md', page('wiki:a', relation(['absent.md'])));
  assert.throws(() => buildGraph(root), /missing reference/);
  write('a.md', page('wiki:a', relation(['../../outside.md'])));
  assert.throws(() => buildGraph(root), /outside repo/);
  write('a.md', page('wiki:a', relation(['http://example.com/source'])));
  assert.throws(() => buildGraph(root), /must use HTTPS/);
  write('a.md', page('wiki:a', [], '[missing](absent.md)\n```text\n[example](not-real.md)\n```\n'));
  assert.equal(buildGraph(root).unresolvedLinks.length, 1);
}));

test('renamed pages retain stable IDs and update body links independently', () => fixture((root, write) => {
  write('renamed.md', page('wiki:original'));
  write('a.md', page('wiki:a', [], '[Reference](renamed.md)\n'));
  assert.equal(buildGraph(root).edges[0].to, 'wiki:original');
}));

test('initial generation resolves its own projection link without hiding other missing files', () => fixture((root, write) => {
  write('a.md', page('wiki:a', [], '[Graph](graph.json) [Missing](missing.json)\n'));
  const graph = buildGraph(root);
  assert.equal(graph.edges[0].to, 'file:wiki/graph.json');
  assert.equal(graph.unresolvedLinks.length, 1);
  assert.equal(graph.unresolvedLinks[0].target, 'missing.json');
}));

test('an owned snapshot can derive the graph without writing shared peer content', () => fixture((root, write) => {
  const shared = page('wiki:a', [], '[Peer addition](peer.md)\n');
  write('a.md', shared); write('peer.md', 'Preserved peer source.\n');
  const snapshot = buildGraph(root, new Map([['wiki/a.md', Buffer.from(page('wiki:a'))]]));
  assert.equal(snapshot.edges.length, 0);
  assert.equal(buildGraph(root).edges.length, 1);
  assert.equal(fs.readFileSync(path.join(root, 'wiki/a.md'), 'utf8'), shared);
}));

import { KINDS, THEMES, STRICT, indexEntry, renderIndexes, wikiMarkdownFiles } from './wiki-graph.mjs';

const routed = (id, extra = '', body = '# Page\n') => `---\nid: ${JSON.stringify(id)}\nkind: "knowledge"\ntitle: ${JSON.stringify(id.slice(5))}\nload_when: "Working on ${id.slice(5)}."\nthemes: ["wiki"]\n${extra}relations: []\n---\n${body}`;

test('routing fields parse, default and refuse invalid literals; a BOM is stripped', () => {
  const full = readPage(Buffer.from(routed('wiki:a', 'keywords: ["glass", "brand colors"]\nroutes: ["/", "/journal/*"]\n')), 'a.md');
  assert.deepEqual([full.load_when, full.themes, full.keywords, full.routes], ['Working on a.', ['wiki'], ['glass', 'brand colors'], ['/', '/journal/*']]);
  assert.deepEqual(readPage(Buffer.from(bare('wiki:a')), 'a.md', { strict: false }).keywords, []);
  assert.equal(readPage(Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(routed('wiki:bom'))]), 'bom.md').id, 'wiki:bom');
  for (const input of [
    routed('wiki:a').replace('["wiki"]', '[]'), routed('wiki:a').replace('["wiki"]', '["unknown"]'), routed('wiki:a').replace('["wiki"]', '["wiki", "wiki"]'),
    routed('wiki:a', 'keywords: ["Glass"]\n'), routed('wiki:a', 'keywords: ["a", "a"]\n'), routed('wiki:a', 'routes: ["journal"]\n'), routed('wiki:a').replace('"knowledge"', '"plan"'),
  ]) assert.throws(() => readPage(Buffer.from(input), 'a.md', { strict: true }), undefined, input);
  assert.throws(() => readPage(Buffer.from(bare('wiki:a')), 'a.md', { strict: true }), /missing load_when/);
  assert.throws(() => readPage(Buffer.from(routed('wiki:a').replace('themes: ["wiki"]\n', '')), 'a.md', { strict: true }), /missing themes/);
  assert.equal(readPage(Buffer.from(bare('wiki:log').replace('"knowledge"', '"log"')), 'log.md', { strict: true }).kind, 'log');
  assert.equal(typeof STRICT, 'boolean');
  assert.ok(KINDS.has('status') && THEMES.has('journal'));
});

test('index blocks render routed pages inside markers only and report stale blocks', () => fixture((root, write) => {
  fs.mkdirSync(path.join(root, 'wiki/site'));
  const marker = kind => `<!-- wiki-index:begin ${kind} -->\nold line\n<!-- wiki-index:end -->`;
  try {
    write('README.md', `---\nid: "wiki:README"\nkind: "index"\ntitle: "Index"\nload_when: "Starting."\nthemes: ["wiki"]\nrelations: []\n---\n# Index\n\nAbove.\n\n${marker('folders')}\n\nBelow.\n`);
    write('rules.md', routed('wiki:rules', 'keywords: ["edit contract"]\n'));
    write('site/README.md', `---\nid: "wiki:site/README"\nkind: "index"\ntitle: "Site"\nload_when: "Site work."\nthemes: ["site"]\nrelations: []\n---\n${marker('pages')}\n`);
    write('site/design.md', routed('wiki:site/design'));
    write('site/notes.md', '# Unstamped source record\n');
    const outputs = renderIndexes(root);
    const index = outputs.get('wiki/README.md'), site = outputs.get('wiki/site/README.md');
    assert.match(index, /^Above\.\n\n<!-- wiki-index:begin folders -->\n- \[rules\]\(rules\.md\) — Load when: Working on rules\. Keywords: edit contract\. Themes: wiki\.\n- \[Site\]\(site\/README\.md\) — Load when: Site work\. Themes: site\.\n<!-- wiki-index:end -->\n\nBelow\.\n$/m);
    assert.equal(site.split('\n').filter(line => line.startsWith('- [')).join('\n'), '- [site/design](design.md) — Load when: Working on site/design. Themes: wiki.');
    assert.ok(!site.includes('notes.md'));
    for (const [relative, text] of outputs) fs.writeFileSync(path.join(root, relative), text);
    assert.equal(renderIndexes(root).size, 0);
    assert.equal(indexEntry('wiki', { path: 'wiki/site/x.md', title: 'X', load_when: 'Do X', keywords: [], themes: [] }), '- [X](site/x.md) — Load when: Do X.');
    assert.deepEqual(wikiMarkdownFiles(root).filter(file => file.includes('site/')), ['wiki/site/README.md', 'wiki/site/design.md', 'wiki/site/notes.md']);
  } finally {
    for (const name of fs.readdirSync(path.join(root, 'wiki/site'))) fs.unlinkSync(path.join(root, 'wiki/site', name));
    fs.rmdirSync(path.join(root, 'wiki/site'));
  }
}));
