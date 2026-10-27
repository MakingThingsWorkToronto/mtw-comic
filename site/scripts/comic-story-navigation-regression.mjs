#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import assert from 'node:assert/strict';

// Execute production navigation resolvers without importing whole stories or producing artwork.
const source = readFileSync(new URL('../src/data/comic-stories/index.ts', import.meta.url), 'utf8');
const begin = source.indexOf('export function artSrc('), end = source.indexOf('/** The previous and next issue', begin);
assert(begin >= 0 && end > begin, 'production resolver boundaries');
const code = stripTypeScriptTypes(source.slice(begin, end).replace(/export function/g, 'function'));
const positionsSource = readFileSync(new URL('../src/data/comic-stories/navigation-art.ts', import.meta.url), 'utf8');
const navigationPositions = vm.runInNewContext(stripTypeScriptTypes(positionsSource.replace(/^export /gm, '')) + '\n navigationPositions;');
const home = { id: 'home', scenes: [{ id: 'raster', art: '/comic/home/page', panels: [{ img: 'raster-panel', ar: [0.2, 0.3, 0.4, 0.5] }, { img: 'not-cropped' }] }] };
const other = { id: 'other', scenes: [{ id: 'vector', panels: [{ img: 'vector-panel' }] }] };
const context = vm.createContext({ navigationPositions, navigationArt: { 'raster-panel': '/comic/navigation/raster-panel-v1.webp' }, comicIssues: [{ story: home }, { story: other }], home, other });
vm.runInContext(code, context);
const resolve = (img, owner = home) => context.artSrc(img, owner);
const position = img => context.artPosition(img);
const tests = [
  ['explicit registered crop wins for the matching raster panel', () => assert.equal(resolve('raster-panel'), '/comic/navigation/raster-panel-v1.webp')],
  ['normal SVG keeps cross-story owner resolution', () => assert.equal(resolve('vector-panel'), '/comic/other/vector-panel.svg')],
  ['existing absolute URL passes through unchanged', () => assert.equal(resolve('/comic/actual/cover.webp'), '/comic/actual/cover.webp')],
  ['unknown legacy panel retains its existing SVG fallback', () => assert.equal(resolve('home-hands-paste'), '/comic/home/home-hands-paste.svg')],
  ['known raster panel without a registered crop fails explicitly', () => assert.throws(() => resolve('not-cropped'), /needs a registered navigation crop/)],
  ['Data cover retains its right-hand subject position', () => assert.equal(position('dm-records-room'), '81% 32%')],
  ['Home cover retains its planned tower position', () => assert.equal(position('home-tower-night'), '78% 35%')],
  ['unknown legacy image retains the centred position', () => assert.equal(position('home-hands-paste'), '50% 50%')],
  ['absolute image without a position retains the centred default', () => assert.equal(position('/comic/actual/cover.webp'), '50% 50%')],
];
for (const [name, run] of tests) { run(); console.log(`PASS ${name}`); }
console.log(`${tests.length}/${tests.length} navigation resolver regressions passed`);
