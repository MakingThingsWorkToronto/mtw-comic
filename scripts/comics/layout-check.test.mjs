// Tests for layout-check.mjs. Run: node --test scripts/comics/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const CLI = path.join(import.meta.dirname, 'layout-check.mjs');
const A = [[0, 0, .55, .5], [.55, 0, .45, .3], [.55, .3, .45, .2], [0, .5, .3, .5], [.3, .5, .7, .5]];
const B = [[0, 0, .7, .6], [.7, 0, .3, .6], [0, .6, .3, .4], [.3, .6, .4, .4], [.7, .6, .3, .4]];
const scene = (id, rects, extra = {}) => ({ id, panels: rects.map((r, i) => ({ img: `${id}-${i + 1}`, alt: 'a box', at: 0, r, balloons: [] })), ...extra });
const A_PHONE = (id) => [[{ img: `${id}-1`, r: [0, 0, 1, .5] }, { img: `${id}-2`, r: [0, .5, .5, .5] }, { img: `${id}-3`, r: [.5, .5, .5, .5] }],
  [{ img: `${id}-4`, r: [0, 0, .5, 1] }, { img: `${id}-5`, r: [.5, 0, .5, 1] }]];

function run(scenes, args = []) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'layout-'));
  const file = path.join(dir, 'x.ts');
  fs.writeFileSync(file, `export const x = retime(${JSON.stringify({ id: 'x', scenes }, null, 2)});\n`);
  const r = spawnSync(process.execPath, [CLI, '--story', file, '--json', ...args], { encoding: 'utf8' });
  return { status: r.status, report: r.stdout ? JSON.parse(r.stdout) : null };
}

test('passes a varied, tiled issue', () => {
  const { status, report } = run([scene('a', A, { phonePages: A_PHONE('a') }), scene('b', B)]);
  assert.equal(status, 0, JSON.stringify(report));
  assert.equal(report.scenes[1].warnings[0], 'phonePages missing; runtime reflow will be used');
});

test('fails fewer than 5 boxes, and --min lowers the bar', () => {
  const three = [[0, 0, .6, 1], [.6, 0, .4, .5], [.6, .5, .4, .5]];
  const r = run([scene('a', three)]);
  assert.equal(r.status, 1);
  assert.match(r.report.scenes[0].errors[0], /only 3 non-inset boxes/);
  assert.equal(run([scene('a', three)], ['--min', '3']).status, 0);
});

test('fails a duplicate layout signature across scenes, naming both', () => {
  const { status, report } = run([scene('a', A), scene('b', A)]);
  assert.equal(status, 1);
  assert.ok(report.scenes[1].errors.some((e) => /same layout signature as scene a/.test(e)));
});

test('fails bad phonePages (a box missing, too few boxes on a page)', () => {
  const pages = A_PHONE('a');
  pages[1].pop();
  const { status, report } = run([scene('a', A, { phonePages: pages })]);
  assert.equal(status, 1);
  const e = report.scenes[0].errors.join('\n');
  assert.match(e, /areas sum to/);
  assert.match(e, /a-5 appears 0 times/);
  assert.match(e, /\(minimum 2\)/);
});

test('fails equal tiers unless the scene is rapid', () => {
  const grid = [[0, 0, .5, .5], [.5, 0, .5, .5], [0, .5, .5, .5], [.5, .5, .5, .5]];
  const r = run([scene('a', grid)], ['--min', '4']);
  assert.equal(r.status, 1);
  assert.match(r.report.scenes[0].errors.join('\n'), /no dominant box/);
  const four = [[0, 0, .25, 1], [.25, 0, .25, 1], [.5, 0, .25, 1], [.75, 0, .25, 1]];
  const three = [[0, 0, .2, 1], [.2, 0, .2, 1], [.4, 0, .2, 1], [.6, 0, .4, 1]];
  assert.match(run([scene('a', three)], ['--min', '4']).report.scenes[0].errors.join('\n'), /3 boxes share size/);
  assert.equal(run([scene('a', four, { rapid: true })], ['--min', '4']).status, 0);
});

test('fails overlap, low coverage, tiny boxes and bad alt/img', () => {
  const rects = [[0, 0, .5, .5], [.4, 0, .5, .5], [0, .6, .1, .1], [.5, .5, .2, .2], [.7, .7, .3, .3]];
  const s = scene('a', rects);
  s.panels[0].alt = ' ';
  s.panels[1].img = 'Bad_Id';
  const e = run([s]).report.scenes[0].errors.join('\n');
  for (const re of [/overlap/, /coverage/, /below minimum size/, /empty alt/, /must match/]) assert.match(e, re);
});
