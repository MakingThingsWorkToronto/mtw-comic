import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { reviewText } from './comic-review-fetch.mjs';
let passed = 0;
const dom = name => new DOMException(name === 'TimeoutError' ? 'The operation was aborted due to timeout' : 'Manually cancelled', name);
const transient = code => Object.assign(new Error('fetch failed'), { cause: { code } });
const response = text => ({ ok: true, text: async () => text });
for (const error of [transient('ECONNRESET'), transient('ECONNREFUSED'), transient('UND_ERR_SOCKET'), dom('TimeoutError'), Object.assign(new TypeError('fetch failed'), { cause: dom('TimeoutError') })]) {
  let calls = 0; const sleeps = [];
  assert.equal(await reviewText('http://local/runtime', { sleep: async ms => sleeps.push(ms), fetcher: async (_, options) => {
    assert.equal(options.method, 'GET'); assert.ok(options.signal instanceof AbortSignal);
    if (++calls < 3) throw error; return response('exact current bytes');
  } }), 'exact current bytes');
  assert.equal(calls, 3); assert.deepEqual(sleeps, [100, 200]); passed++;
}
for (const error of [transient('ECONNRESET'), dom('TimeoutError'), Object.assign(new TypeError('fetch failed'), { cause: dom('TimeoutError') })]) {
  let calls = 0; const sleeps = [];
  await assert.rejects(reviewText('http://local/runtime', { sleep: async ms => sleeps.push(ms), fetcher: async () => { calls++; throw error; } }), e => e === error);
  assert.equal(calls, 3); assert.deepEqual(sleeps, [100, 200]); passed++;
}
for (const error of [dom('AbortError'), Object.assign(new Error('fetch failed'), { cause: dom('AbortError') }), Object.assign(dom('TimeoutError'), { cause: dom('AbortError') }), new Error('unrelated failure')]) {
  let calls = 0; const sleeps = [];
  await assert.rejects(reviewText('http://local/runtime', { sleep: async ms => sleeps.push(ms), fetcher: async () => { calls++; throw error; } }), e => e === error);
  assert.equal(calls, 1); assert.deepEqual(sleeps, []); passed++;
}
for (const status of [404, 503]) {
  let calls = 0, bodies = 0;
  await assert.rejects(reviewText('http://local/missing', { sleep: async () => assert.fail('HTTP must be fatal'), fetcher: async () => { calls++; return { ok: false, status, text: async () => { bodies++; return 'unused'; } }; } }), new RegExp(String(status)));
  assert.equal(calls, 1); assert.equal(bodies, 0); passed++;
}
const manual = new AbortController(); manual.abort(dom('AbortError'));
await assert.rejects(reviewText('http://local/runtime', { signal: manual.signal, fetcher: async () => assert.fail('pre-aborted signal must not fetch') }), /Manually/);passed++;
{
  const manual = new AbortController(); let calls = 0;
  await assert.rejects(reviewText('http://local/runtime', { signal: manual.signal, sleep: async () => assert.fail('manual abort must not retry'), fetcher: async () => { calls++; manual.abort(new Error('owner stopped review')); throw dom('TimeoutError'); } }), /owner stopped/);
  assert.equal(calls, 1);passed++;
}
{
  const manual = new AbortController(); let calls = 0;
  await assert.rejects(reviewText('http://local/runtime', { signal: manual.signal, sleep: async () => assert.fail('cancelled body must not retry'), fetcher: async () => { calls++; return { ok: true, text: async () => { manual.abort(dom('AbortError')); return 'late body after cancellation'; } }; } }), /Manually/);
  assert.equal(calls, 1);passed++;
}
// The body is also inside the actual request deadline; retain no partial text.
{
  let calls = 0;
  assert.equal(await reviewText('http://local/runtime', { sleep: async () => {}, fetcher: async () => { calls++; return calls === 1 ? { ok: true, text: async () => { throw dom('TimeoutError'); } } : response('new complete body'); } }), 'new complete body');
  assert.equal(calls, 2);passed++;
}
// Use a native DOMException deadline with a shortened fixture timer; verify the
// production helper requests exactly 5000ms on each of its three attempts.
{
  const nativeTimeout = AbortSignal.timeout; const budgets = []; let calls = 0;
  try {
    AbortSignal.timeout = ms => { budgets.push(ms); return nativeTimeout(1); };
    assert.equal(await reviewText('http://local/runtime', { sleep: async () => {}, fetcher: async (_, {signal}) => {
      if (++calls === 3) return response('after native timeout');
      return await new Promise((_, reject) => {
        const keepAlive = setTimeout(() => reject(new Error('fixture deadline did not fire')), 100);
        signal.addEventListener('abort', () => { clearTimeout(keepAlive); reject(signal.reason); }, { once: true });
      });
    } }), 'after native timeout');
    assert.deepEqual(budgets, [5000, 5000, 5000]);assert.equal(calls, 3);passed++;
  } finally { AbortSignal.timeout = nativeTimeout; }
}
// Retry returns the actual new complete bytes; exact-byte caller guards still fail drift.
{
  const digest = text => createHash('sha256').update(text).digest('hex'); let calls = 0;
  const actual = await reviewText('http://local/runtime', { sleep: async () => {}, fetcher: async () => { if (++calls === 1) throw dom('TimeoutError'); return response('changed server bytes'); } });
  assert.throws(() => assert.equal(digest(actual), digest('frozen expected bytes')), /Expected values/);passed++;
}
console.log(JSON.stringify({ passed, standing: 'Bounded read-only transport fixtures; no browser performance, native pixel, hearing or source-drift approval.' }));
