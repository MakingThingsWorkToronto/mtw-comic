import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { canonicalHomes, checkAssetDestination } from '../assets/check-asset-destination.mjs';
import { inspectInstructions } from './check-agent-instructions.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mtw-guardrails-'));
  const files = new Set();
  const directories = [root];
  const ownedPath = relative => {
    const result = path.resolve(root, relative);
    assert.ok(path.relative(root, result) && !path.relative(root, result).startsWith('..'));
    return result;
  };
  t.after(() => {
    // Remove only exact fixture-owned files/links, then empty directories.
    for (const file of [...files].reverse()) fs.unlinkSync(file);
    for (const directory of directories.reverse()) fs.rmdirSync(directory);
  });
  const mkdir = relative => {
    const target = ownedPath(relative);
    fs.mkdirSync(target);
    directories.push(target);
  };
  for (const directory of ['wiki', ...Object.values(canonicalHomes), 'site', 'outside']) mkdir(directory);
  const write = (relative, value) => {
    const target = ownedPath(relative);
    fs.writeFileSync(target, value);
    files.add(target);
  };
  const link = (relative, target) => {
    const destination = ownedPath(relative);
    fs.symlinkSync(target, destination, process.platform === 'win32' ? 'junction' : 'dir');
    files.add(destination);
  };
  const text = Object.values(canonicalHomes).map(home => `| Asset | \`${home}/\` |`).join('\n') + '\n';
  write('AGENTS.md', text);
  write('CLAUDE.md', text);
  write('package.json', JSON.stringify({ scripts: { all: 'launcher' } }));
  write('site/package.json', JSON.stringify({ scripts: { test: 'unit-tests' } }));
  return { root, write, link, mkdir, text };
}

test('the real instruction pair passes the maintained check', () => {
  const result = inspectInstructions();
  assert.deepEqual(result.issues, []);
  assert.ok(result.links > 0 && result.commands > 0);
});

test('byte drift fails, even when only a newline differs', t => {
  const f = fixture(t);
  f.write('CLAUDE.md', f.text.replaceAll('\n', '\r\n'));
  assert.ok(inspectInstructions(f.root).issues.some(issue => issue.includes('differ')));
});

test('excess context fails for long paragraphs and many lines', t => {
  const f = fixture(t);
  for (const extra of ['word '.repeat(1651), '\n'.repeat(211) + 'end']) {
    f.write('AGENTS.md', f.text + extra);
    f.write('CLAUDE.md', f.text + extra);
    assert.ok(inspectInstructions(f.root).issues.some(issue => issue.includes('Context budget')));
  }
});

test('a missing canonical home fails', t => {
  const f = fixture(t);
  f.write('AGENTS.md', f.text.replace('wiki/journal/', 'discussion/journal/'));
  f.write('CLAUDE.md', fs.readFileSync(path.join(f.root, 'AGENTS.md')));
  assert.ok(inspectInstructions(f.root).issues.some(issue => issue.includes('wiki/journal')));
});

test('broken local links and wrong command directories fail', t => {
  const f = fixture(t);
  const content = f.text + '[Missing](wiki/missing.md)\n| Repo root | `npm test` | check |\n';
  f.write('AGENTS.md', content);
  f.write('CLAUDE.md', content);
  const { issues } = inspectInstructions(f.root);
  assert.ok(issues.some(issue => issue.includes('Broken local link')));
  assert.ok(issues.some(issue => issue.includes('Unknown command/directory')));
});

test('invalid UTF-8 fails', t => {
  const f = fixture(t);
  f.write('AGENTS.md', Buffer.from([0xc3, 0x28]));
  assert.throws(() => inspectInstructions(f.root));
});

test('missing referenced node utilities fail', t => {
  const f = fixture(t);
  const content = f.text + '`node scripts/missing.mjs`\n';
  f.write('AGENTS.md', content);
  f.write('CLAUDE.md', content);
  assert.ok(inspectInstructions(f.root).issues.some(issue => issue.includes('Missing command script')));
});

test('destination CLI exits nonzero for refused paths and accepts canonical paths without writing', () => {
  const script = fileURLToPath(new URL('../assets/check-asset-destination.mjs', import.meta.url));
  const accepted = spawnSync(process.execPath, [script, 'image', 'wiki/image-library/records/guard-preflight-only.json'], { encoding: 'utf8' });
  assert.equal(accepted.status, 0, accepted.stderr);
  assert.match(accepted.stdout, /^PASS /);
  assert.equal(fs.existsSync(path.resolve(path.dirname(script), '../wiki/image-library/records/guard-preflight-only.json')), false);
  const rejected = spawnSync(process.execPath, [script, 'image', 'discussion/guard-preflight-only.png'], { encoding: 'utf8' });
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /^FAIL /);
});

test('all four homes accept relative and absolute future file paths', t => {
  const f = fixture(t);
  for (const [kind, home] of Object.entries(canonicalHomes)) {
    const relative = `${home}/future/version-2.dat`;
    const expected = path.resolve(f.root, relative);
    assert.equal(checkAssetDestination(kind, relative, f.root), expected);
    assert.equal(checkAssetDestination(kind, expected, f.root), expected);
  }
});

test('discussion, site, external and wrong-library destinations fail', t => {
  const f = fixture(t);
  for (const destination of ['discussion/art.png', 'site/public/art.png', 'outside/art.png', 'wiki/soundtrack-library/art.png', path.join(os.tmpdir(), 'external-art.png')]) {
    assert.throws(() => checkAssetDestination('image', destination, f.root), /inside/);
  }
});

test('traversal and sibling prefix tricks fail', t => {
  const f = fixture(t);
  for (const destination of ['wiki/image-library/../../outside/art.png', 'wiki/image-library-other/art.png', 'wiki/image-library/../journal/art.png']) {
    assert.throws(() => checkAssetDestination('image', destination, f.root), /inside/);
  }
});

test('kind, blank paths and directories must be explicit', t => {
  const f = fixture(t);
  assert.throws(() => checkAssetDestination('unknown', 'file', f.root), /Unknown/);
  assert.throws(() => checkAssetDestination('image', '', f.root), /exact/);
  assert.throws(() => checkAssetDestination('image', 'wiki/image-library', f.root), /inside/);
  f.mkdir('wiki/image-library/records');
  assert.throws(() => checkAssetDestination('image', 'wiki/image-library/records', f.root), /directory/);
});

test('a linked ancestor cannot route future files outside the library', t => {
  const f = fixture(t);
  f.link('wiki/image-library/escape', path.join(f.root, 'outside'));
  assert.throws(() => checkAssetDestination('image', 'wiki/image-library/escape/future/art.png', f.root), /escapes/);
});

test('an internal library alias remains valid', t => {
  const f = fixture(t);
  f.link('wiki/image-library/internal', path.join(f.root, 'wiki/image-library'));
  assert.equal(checkAssetDestination('image', 'wiki/image-library/internal/future/art.png', f.root), path.join(f.root, 'wiki/image-library/internal/future/art.png'));
});

test('an existing broken link fails closed', t => {
  const f = fixture(t);
  f.link('wiki/image-library/broken', path.join(f.root, 'nonexistent'));
  assert.throws(() => checkAssetDestination('image', 'wiki/image-library/broken/art.png', f.root));
});

test('a redirected canonical home requires its exact explicit local mapping', t => {
  const f = fixture(t);
  f.mkdir('outside/media');
  const home = path.join(f.root, canonicalHomes.image);
  const media = path.join(f.root, 'outside/media');
  fs.rmdirSync(home);
  fs.symlinkSync(media, home, process.platform === 'win32' ? 'junction' : 'dir');
  try {
    assert.throws(() => checkAssetDestination('image', 'wiki/image-library/future.dat', f.root), /redirected/);
    f.write('.mtw-local-media.json', JSON.stringify({ homes: { image: path.join(f.root, 'outside') } }));
    assert.throws(() => checkAssetDestination('image', 'wiki/image-library/future.dat', f.root), /redirected/);
    f.write('.mtw-local-media.json', JSON.stringify({ homes: { image: media } }));
    assert.equal(checkAssetDestination('image', 'wiki/image-library/future.dat', f.root), path.join(home, 'future.dat'));
  } finally {
    fs.unlinkSync(home);
    fs.mkdirSync(home);
  }
});

test('an explicit local mapping still rejects links escaping that physical home', t => {
  const f = fixture(t);
  f.mkdir('outside/media');
  const home = path.join(f.root, canonicalHomes.image);
  const media = path.join(f.root, 'outside/media');
  fs.rmdirSync(home);
  fs.symlinkSync(media, home, process.platform === 'win32' ? 'junction' : 'dir');
  try {
    f.write('.mtw-local-media.json', JSON.stringify({ homes: { image: media } }));
    f.link('outside/media/escape', path.join(f.root, 'site'));
    assert.throws(() => checkAssetDestination('image', 'wiki/image-library/escape/future.dat', f.root), /escapes/);
  } finally {
    fs.unlinkSync(home);
    fs.mkdirSync(home);
  }
});

test('full-spec startup mandates fail in either skill edition and nested references', t => {
  const f = fixture(t);
  for (const edition of ['.codex', '.claude']) {
    for (const dir of [edition, `${edition}/skills`, `${edition}/skills/tour`, `${edition}/skills/tour/references`, `${edition}/skills/tour/references/nested`]) f.mkdir(dir);
    f.write(`${edition}/skills/tour/SKILL.md`, 'Read `discussion/spec.md` in full first (Image choreography). It wins over this skill.\n');
    f.write(`${edition}/skills/tour/references/nested/contract.md`, '`discussion/spec.md`, read in full, is authoritative.\n');
  }
  const result = inspectInstructions(f.root);
  assert.equal(result.issues.length, 4);
  assert.ok(result.issues.every(issue => issue.includes('stale full-spec read')));
  assert.deepEqual(result.skillSpecReads.files, 4);
});

test('scoped reading preserves topical full checks, quoted history and fenced examples', t => {
  const f = fixture(t);
  for (const dir of ['.codex', '.codex/skills', '.codex/skills/reveal']) f.mkdir(dir);
  f.write('.codex/skills/reveal/SKILL.md', [
    'Read the Build Order, relevant requirements and latest task decisions in `discussion/spec.md` before work and after compaction. Include Reveal effects. The spec wins.',
    'Inspect SVG endpoints in full and reduced renders.',
    '> Read discussion/spec.md in full first; retained historical instruction.',
    '```markdown', 'Read discussion/spec.md in full first;', '```',
    '~~~markdown', '`discussion/spec.md`, read in full, is authoritative.', '~~~',
    'Do not read discussion/spec.md in full for startup.',
  ].join('\n'));
  assert.deepEqual(inspectInstructions(f.root).issues, []);
  // A fresh active line after the closed fence must still fail.
  f.write('.codex/skills/reveal/SKILL.md', fs.readFileSync(path.join(f.root, '.codex/skills/reveal/SKILL.md'), 'utf8') + '\nRead discussion/spec.md in full first; it wins.\n');
  assert.equal(inspectInstructions(f.root).issues.length, 1);
});
