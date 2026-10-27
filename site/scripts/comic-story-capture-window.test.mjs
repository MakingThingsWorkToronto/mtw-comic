import { test } from 'node:test';
import assert from 'node:assert/strict';
import { captureWindow } from './comic-story-capture-window.mjs';
test('uses the outgoing panel window even after the next phone sheet becomes active', () => {
  const frame = { panelImageIds:['outgoing'], beat:107.4, ready:true, sheet:0, activeSheet:1 };
  assert.deepEqual(captureWindow({frames:[frame]},'outgoing',100), {beat:7.400000000000006,readingWindow:frame});
});
test('retains impossible lettering windows rather than certifying or hiding them', () => {
  const frame = { panelImageIds:['long-dialogue'], beat:12, ready:false, timingIssue:'exits early' };
  assert.equal(captureWindow({frames:[frame]},'long-dialogue',10).readingWindow.ready,false);
});
test('rejects missing panel and nonfinite timing instead of legacy next-focus fallback', () => {
  assert.throws(()=>captureWindow({frames:[]},'missing',10));
  assert.throws(()=>captureWindow({frames:[{panelImageIds:['bad'],beat:NaN}]},'bad',10));
});
