#!/usr/bin/env node
// Tests the actual deslop reservation validator without loading stories or starting a browser.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const here = dirname(fileURLToPath(import.meta.url));
const gatePath = resolve(process.argv[2] || resolve(here, 'comic-story-deslop.mjs'));
const cssPath = resolve(process.argv[3] || resolve(here, '../src/styles/comic-story.css'));
const source = readFileSync(gatePath, 'utf8');
const a = source.indexOf('// Begin comic-strip reservation validator');
const b = source.indexOf('// End comic-strip reservation validator');
assert(a >= 0 && b > a, 'actual reservation validator is available');
const check = vm.runInNewContext(source.slice(a, b) + ';comicStripErrors');
const valid = '.comic { --cs-strip-height: 88px; } .cs-view { bottom: calc(env(safe-area-inset-bottom) + var(--cs-strip-height)); } .cs-strip { height: calc(env(safe-area-inset-bottom) + var(--cs-strip-height)); }';
assert.equal(check(valid).length, 0, 'one declared reservation shared by view and strip');
assert.equal(check(valid.replace('88px', '92px')).length, 0, 'changing the one height keeps both reservations bound');
assert.equal(check(valid + '@media(max-width:850px){.comic {--cs-strip-height:96px;}.cs-strip {gap:6px;}}').length, 0, 'safe responsive height and unrelated placement overrides');
assert.equal(check(valid.replace('88px', '64px') + '@media(max-width:700px){.comic {--cs-strip-height:104px;}}').length, 0, 'compact desktop and separate phone credit row share the same safe-area reservation');
assert.equal(check(readFileSync(cssPath, 'utf8')).length, 0, 'actual source uses the same reservation');
const bad = [
  ['unrelated declaration', valid.replace('.comic { --cs-strip-height:', '.other { --cs-strip-height:')],
  ['missing declaration', valid.replace('--cs-strip-height: 88px;', '')],
  ['zero declaration', valid.replace('88px', '0px')],
  ['negative declaration', valid.replace('88px', '-88px')],
  ['invalid declaration', valid.replace('88px', 'auto')],
  ['lost view reservation', valid.replace('bottom: calc(env(safe-area-inset-bottom) + var(--cs-strip-height));', 'bottom:0;')],
  ['mismatched view reservation', valid.replace('bottom: calc(env(safe-area-inset-bottom) + var(--cs-strip-height));', 'bottom:calc(env(safe-area-inset-bottom) + 52px);')],
  ['lost strip reservation', valid.replace('height: calc(env(safe-area-inset-bottom) + var(--cs-strip-height));', '')],
  ['mismatched strip reservation', valid.replace('height: calc(env(safe-area-inset-bottom) + var(--cs-strip-height));', 'height:52px;')],
  ['view override overlays page', valid + '@media(max-width:850px){.cs-view{bottom:0;}}'],
  ['strip override mismatches', valid + '@media(max-width:850px){.cs-strip{height:52px;}}'],
  ['invalid variable override', valid + '@media(max-width:850px){.comic{--cs-strip-height:0px;}}'],
  ['comment-only reservation', '/*' + valid + '*/'],
];
for(const [name, css] of bad) assert(check(css).length > 0, name);
// Do not weaken the independent prohibition on local control styles or whole-page effects.
assert(source.includes('ownButtons.filter'), 'control styling gate retained');
assert(source.includes("'a backdrop-filter'"), 'whole-page effect gate retained');
console.log('strip reservation: 5 eligible passes; 13 unsafe mutations rejected; control/effect gates retained');