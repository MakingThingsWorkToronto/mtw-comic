#!/usr/bin/env node
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { checkComicArt, comicArtUrl } from './comic-story-art-check.mjs';

// Actual temp files, individually tracked/removed; no repo fixtures or directory copies.
const prefix = `mtw-comic-art-${process.pid}-${Date.now()}`;
const publicDir = tmpdir(), files = new Set(), widths = [1600];
const url = name => `/${prefix}-${name}`;
function put(name) { const path = join(publicDir, name); writeFileSync(path, 'fixture'); files.add(path); return name; }
function remove(name) { const path = join(publicDir, name); unlinkSync(path); files.delete(path); }
const story = scenes => ({ id: 'example', scenes, next: { choices: [] } });
const options = { publicDir, widths, requireArt: true, resolveChoice: (img, st) => comicArtUrl(img, st.id) };
let count = 0;
function test(name, run) { run(); count++; console.log(`PASS ${name}`); }
try {
  const stem = url('page');
  for (const width of widths) for (const ext of ['avif', 'webp']) put(`${stem}-${width}.${ext}`);
  test('whole-page raster validates real derivatives and ignores unfetched stale panel ids', () => {
    assert.deepEqual(checkComicArt(story([{ id: 'page', art: stem, panels: [{ img: 'stale-missing-id' }] }]), options), []);
  });
  test('a missing real derivative fails delivery and warns only in draft mode', () => {
    const missing = `${stem}-1600.avif`; remove(missing);
    const data = story([{ id: 'page', art: stem, panels: [] }]);
    const strict = checkComicArt(data, options), draft = checkComicArt(data, { ...options, requireArt: false });
    assert.equal(strict.length, 1); assert.equal(strict[0][0], 'ERROR'); assert(strict[0][1].includes(missing));
    assert.equal(draft.length, 1); assert.equal(draft[0][0], 'WARN'); put(missing);
  });
  test('declared WebP-only fallback checks that real file without inventing AVIF; missing declared file still fails',()=>{
    const single=url('webp-only');put(`${single}-1600.webp`);
    const data=story([{id:'webp',art:single,artFormats:['webp'],panels:[]}]);
    assert.deepEqual(checkComicArt(data,options),[]);
    remove(`${single}-1600.webp`);
    assert(checkComicArt(data,options).some(([level,message])=>level==='ERROR'&&message.includes('webp-only-1600.webp')));
  });
  test('empty, duplicate and unsupported fallback format declarations are errors',()=>{
    for(const artFormats of [[],['webp','webp'],['jpg'],'webp'])
      assert(checkComicArt(story([{id:'bad',art:stem,artFormats,panels:[]}]),options).some(([level,message])=>level==='ERROR'&&message.includes('artFormats')));
  });
  test('existing absolute SVG page and panel paths are preserved', () => {
    const page = put(url('whole.svg')), panel = put(url('panel.svg'));
    assert.deepEqual(checkComicArt(story([{ id: 'whole', art: page, panels: [{ img: 'unused' }] }, { id: 'separate', panels: [{ img: panel }] }]), options), []);
    assert.equal(comicArtUrl('panel-id', 'example'), '/comic/example/panel-id.svg');
  });
  test('NEXT absolute raster image resolves unchanged', () => {
    const image = put(url('next.webp')), data = story([]); data.next.choices.push({ label: 'Next', img: image });
    assert.deepEqual(checkComicArt(data, options), []);
  });
  test('NEXT delegates cross-story ownership to the supplied registry artSrc', () => {
    const image = put(url('other-story.svg')), data = story([]); data.next.choices.push({ label: 'Elsewhere', img: 'other-story-panel' });
    let calls = 0;
    assert.deepEqual(checkComicArt(data, { ...options, resolveChoice(img, owner) { calls++; assert.equal(img, 'other-story-panel'); assert.equal(owner, data); return image; } }), []);
    assert.equal(calls, 1);
  });
  console.log(`${count}/7 art dependency regressions passed`);
} finally { for (const path of files) if (existsSync(path)) unlinkSync(path); }
