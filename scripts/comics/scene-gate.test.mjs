import test from 'node:test';
import assert from 'node:assert/strict';
import { filterOutput, framesProblems } from './scene-gate.mjs';

test('filterOutput keeps scene and ERROR lines, capped', () => {
  const text = ['ok line', 'scene quote: fine', 'ERROR something', 'other'].join('\n');
  assert.deepEqual(filterOutput(text, 'quote'), ['scene quote: fine', 'ERROR something']);
  const many = Array.from({ length: 50 }, (_, i) => `ERROR ${i}`).join('\n');
  assert.equal(filterOutput(many, 'x').length, 30);
});

const ok = () => ({ status: 'ok' });
test('framesProblems passes a complete index', () => {
  const idx = { a: { desktop: ok(), phone: ok(), reduced: ok() } };
  assert.deepEqual(framesProblems(idx, ['a']), []);
});
test('framesProblems names missing, bad status and errors', () => {
  const idx = { a: { desktop: ok(), phone: { status: 'fail' }, reduced: { status: 'ok', errors: ['x'] } } };
  assert.deepEqual(framesProblems(idx, ['a']), ['a/phone: status fail', 'a/reduced: has errors']);
  assert.equal(framesProblems(idx, ['b']).length, 3);
});
test('framesProblems accepts a frames array', () => {
  const idx = { frames: ['desktop', 'phone', 'reduced'].map((size) => ({ img: 'a', size, status: 'ok', errors: [] })) };
  assert.deepEqual(framesProblems(idx, ['a']), []);
});
