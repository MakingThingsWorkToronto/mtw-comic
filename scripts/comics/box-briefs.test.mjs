// Tests for box-briefs.mjs. Run: node --test scripts/comics/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const CLI = path.join(import.meta.dirname, 'box-briefs.mjs');
const REPO = path.resolve(import.meta.dirname, '..', '..');

function fixture({ withDana = true } = {}) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'briefs-'));
  const lib = path.join(d, 'lib');
  fs.mkdirSync(path.join(lib, 'm'), { recursive: true });
  const png = (n) => { fs.writeFileSync(path.join(lib, 'm', n), `png-${n}`); return `m/${n}`; };
  const style = path.join(d, 'style.png');
  fs.writeFileSync(style, 'style');
  fs.writeFileSync(path.join(d, 'characters.json'), JSON.stringify({ characters: [
    { id: 'matt', name: 'Matt', aliases: ['Matt'], group: 'mentor', modelRecord: 'rec-matt' },
    { id: 'codex', name: 'Codex', aliases: [], group: 'hero', modelRecord: 'rec-codex' },
    { id: 'dana', name: 'Dana', aliases: [], group: 'human', modelRecord: 'rec-dana' }] }));
  const records = [{ id: 'rec-matt', treatments: { 'comic-ink': { path: png('matt.png') } } },
    { id: 'rec-codex', treatments: { svg: { path: 'm/x.svg' }, raster: { path: png('codex.png') } } }];
  if (withDana) records.push({ id: 'rec-dana', treatments: { 'comic-ink': { path: png('dana.png') } } });
  fs.writeFileSync(path.join(d, 'manifest.json'), JSON.stringify({ records }));
  const panels = ['one', 'two', 'three'].map((n, i) => ({ img: `s-${n}`, alt: n, at: i, r: [i / 3, 0, 1 / 3, 1], balloons: [{ who: 'codex', text: 'Hi', kind: 'speech' }] }));
  fs.writeFileSync(path.join(d, 'x.ts'), `export const x = retime(${JSON.stringify({ id: 'x', scenes: [{ id: 's', panels }] })});\n`);
  const box = (cast) => ({ camera: 'wide', action: 'they talk', subjects: cast.map((c) => ({ cast: c, doing: 'standing', where: 'left third' })), clearArea: 'top right',
    surfaces: [{ object: 'laptop', camera: 'front', reader: 'dana', shows: 'a refusal dialog' }], motion: 'push' });
  const plan = { sceneId: 's', place: 'office', time: 'dawn', styleRefs: [style], boxes: {
    's-one': { ...box(['matt', 'codex']), planes: [{ id: 'agent', role: 'agents', what: 'Codex projected' }] }, 's-two': box(['dana']), 's-three': box(['matt']) } };
  fs.writeFileSync(path.join(d, 'plan.json'), JSON.stringify(plan));
  return d;
}
const run = (d, extra = []) => spawnSync(process.execPath, [CLI, '--story', path.join(d, 'x.ts'), '--scene', 's', '--plan', path.join(d, 'plan.json'), '--out', path.join(d, 'out'),
  '--characters', path.join(d, 'characters.json'), '--manifest', path.join(d, 'manifest.json'), '--library', path.join(d, 'lib'), ...extra], { encoding: 'utf8' });
const readJson = (...p) => JSON.parse(fs.readFileSync(path.join(...p), 'utf8'));

test('writes requests, prompts and lanes', () => {
  const d = fixture();
  const r = run(d);
  assert.equal(r.status, 0, r.stderr);
  const req = readJson(d, 'out', 's-one.request.json');
  assert.equal(req.schema, 'comic-request/1');
  assert.equal(req.references.length, 3);
  assert.match(req.references[0].role, /identity authority: Codex/);
  assert.match(req.references[1].role, /identity authority: Matt/);
  assert.match(req.references[2].role, /^style and ink reference only/);
  assert.equal(req.references[0].sha256.length, 64);
  const plane = readJson(d, 'out', 's-one--agent.request.json');
  assert.equal(plane.transparent_background, true);
  assert.equal(plane.canvas.size, '1024x1536');
  assert.match(plane.references[0].role, /Codex/);
  const prompt = fs.readFileSync(path.join(d, 'out', 's-one.prompt.txt'), 'utf8');
  const frags = fs.readFileSync(path.join(REPO, '.claude/skills/mtw-comic-story/scripts/art/prompt-fragments.default.md'), 'utf8');
  for (const n of ['style95', 'ink-plate', 'copy-rules', 'box-defects']) {
    const body = frags.match(new RegExp('```fragment:' + n + '\\s*\\n([\\s\\S]*?)```'))[1].trim();
    assert.ok(prompt.includes(body), `fragment ${n}`);
  }
  assert.match(prompt, /IMAGE s-one/);
  assert.match(prompt, /laptop: camera front; its information side faces dana; it shows a refusal dialog/);
  assert.match(prompt, /No text, no lettering, no balloons, no captions\./);
});

test('groups requests into lanes in reading order', () => {
  const d = fixture();
  assert.equal(run(d).status, 0);
  const lanes = readJson(d, 'out', 'lanes.json').lanes;
  assert.deepEqual(lanes.map((l) => l.jobs), [['s-one', 's-one--agent'], ['s-two', 's-three']]);
  const job = readJson(d, 'out', 'lane-01', 'job.json');
  assert.equal(job[1].transparent_background, true);
  assert.ok(job[0].referenced_image_paths.every((p) => !p.includes('\\') && path.isAbsolute(p)));
  const lp = fs.readFileSync(path.join(d, 'out', 'lane-01', 'lane-prompt.md'), 'utf8');
  assert.match(lp, /image_gen__imagegen/);
  assert.ok(lp.includes(fs.readFileSync(path.join(d, 'out', 's-one.prompt.txt'), 'utf8')));
  const d3 = fixture();
  run(d3, ['--lanes', '3']);
  const l3 = readJson(d3, 'out', 'lanes.json').lanes;
  assert.deepEqual(l3.map((l) => l.jobs.length), [3, 1]);
});

test('fails when a cast member has no reference', () => {
  const d = fixture({ withDana: false });
  const r = run(d);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /s-two: dana: model record rec-dana not in manifest/);
  assert.equal(fs.existsSync(path.join(d, 'out')), false);
});

test('usage error exits 2', () => {
  assert.equal(spawnSync(process.execPath, [CLI], { encoding: 'utf8' }).status, 2);
});
