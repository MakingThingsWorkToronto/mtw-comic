import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveStoryFile, slugInRegistry, parseFreeBytes, statusOwnership } from './preflight.mjs';

const idx = [
  "import { agenticComic } from './agentic';",
  "import { homeComic } from './home';",
  "  { slug: 'agentic-systems', ready: true, story: agenticComic, bPage: '/x/' },",
  "  { slug: 'home', story: homeComic },",
].join('\n');

test('resolveStoryFile maps registry slug to import file', () => {
  assert.match(resolveStoryFile('agentic-systems', idx).replaceAll('\\', '/'), /comic-stories\/agentic\.ts$/);
  assert.match(resolveStoryFile('nope', idx).replaceAll('\\', '/'), /comic-stories\/nope\.ts$/);
});
test('slugInRegistry', () => {
  assert.equal(slugInRegistry('home', idx), true);
  assert.equal(slugInRegistry('hom', idx), false);
});
test('parseFreeBytes', () => {
  assert.equal(parseFreeBytes('123456789012\r\n'), 123456789012);
  assert.equal(parseFreeBytes('Free\n  98765432\n'), 98765432);
  assert.equal(parseFreeBytes('none'), null);
});
test('statusOwnership scans only the first lines', () => {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'st-')), 'STATUS.md');
  fs.writeFileSync(f, ['a', 'working on agentic-systems comic', ...Array(50).fill('x'), 'agentic-systems late'].join('\n'));
  assert.deepEqual(statusOwnership(f, ['agentic-systems']), ['working on agentic-systems comic']);
  assert.deepEqual(statusOwnership(f, ['zzz']), []);
  assert.deepEqual(statusOwnership(f + '.missing', ['a']), []);
});
