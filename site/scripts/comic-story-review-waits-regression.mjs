// Reader-review failure-path regression (skill: mtw-comic-story, references/checks.md).
// Runs the real comic-story-art-review.mjs with a fake browser whose font readiness times out before the first frame,
// once with a working diagnostic screenshot and once with a closed page. Asserts the report is still written with exact
// input hashes, the failure is deferred for registration, the browser is muted and closed and the browser lock released.
// Only playwright and the shared catalog library are faked; every other import of the review script stays real.
// No browser is launched. Usage: node site/scripts/comic-story-review-waits-regression.mjs [comic-story-art-review.mjs]
import {readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const scripts = path.dirname(fileURLToPath(import.meta.url)), sourcePath = path.resolve(process.argv[2] || path.join(scripts, 'comic-story-art-review.mjs'));
const original = readFileSync(sourcePath, 'utf8');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const faked = new Set(['playwright', './comic-story-library.mjs']);
// Point every other relative import at the real module in site/scripts, so the harness runs the review's actual helpers.
const harnessSource = original.replace(/from\s+'([^']+)'/g, (whole, spec) => faked.has(spec) ? "from './fake.mjs'"
  : spec.startsWith('.') ? `from '${pathToFileURL(path.resolve(scripts, spec)).href}'` : whole);
assert.equal((harnessSource.match(/from '\.\/fake\.mjs'/g) || []).length, faked.size, 'the review script imports playwright and the catalog library');

function fixture(root, failedScreenshot) {
  const out = path.join(root, failedScreenshot ? 'closed-page' : 'font-timeout'), scriptDir = path.join(out, 'site', 'scripts'), runtimeDir = path.join(out, 'site', 'public', 'scripts');
  mkdirSync(scriptDir, {recursive: true}); mkdirSync(runtimeDir, {recursive: true});
  const runtimeBytes = '// controlled runtime provenance fixture\n'; writeFileSync(path.join(runtimeDir, 'comic-story.js'), runtimeBytes);
  writeFileSync(path.join(scriptDir, 'fake.mjs'), `import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
const out=${JSON.stringify(out)}, events=[];
const log=e=>{events.push(e);writeFileSync(join(out,'events.json'),JSON.stringify(events));};
export const runStamp=()=>'fixture';
export const reviewDir=()=>out;
export const recordDir=()=>out;
export const browserLock=what=>log('lock:'+what);
export const registerReview=()=>{throw new Error('Deferred mode unexpectedly registered');};
export const deferReview=(captures,options)=>{writeFileSync(join(out,'pending.json'),JSON.stringify({captures,options}));return join(out,'pending.json');};
const page={setDefaultTimeout:n=>log('timeout:'+n),setDefaultNavigationTimeout:n=>log('navtimeout:'+n),on:()=>{},goto:async()=>{},
waitForFunction:async()=>{throw new Error('fixture-font-readiness-timeout');},evaluate:async()=>({url:'fixture',fonts:'loading',status:{loaded:false}}),
screenshot:async()=>{${failedScreenshot ? "throw new Error('fixture-page-closed');" : "log('failure-screenshot');"}}};
export const chromium={launch:async options=>{log('muted:'+options.args.includes('--mute-audio'));return {newContext:async()=>({newPage:async()=>page}),close:async()=>log('browser-closed')};}};
`);
  const manifest = path.join(out, 'manifest.json'); writeFileSync(manifest, JSON.stringify({stories: [{slug: 'fixture', scenes: []}]}));
  const prefix = `globalThis.fetch=async()=>({text:async()=>'<script type="application/json" id="comic-story">{"scenes":[]}</script>'});\n`;
  const harness = path.join(scriptDir, 'harness.mjs'); writeFileSync(harness, prefix + harnessSource);
  const run = spawnSync(process.execPath, [harness, '--manifest', manifest, '--registration-batch', 'wait-fixture'], {encoding: 'utf8', timeout: 20000});
  const read = name => JSON.parse(readFileSync(path.join(out, name), 'utf8'));
  return {run, manifest, runtimeBytes, read};
}

const results = [];
const test = (name, fn) => { try { fn(); results.push({name, pass: true}); } catch (e) { results.push({name, pass: false, error: e.message}); } };
const root = mkdtempSync(path.join(tmpdir(), 'comic-review-waits-'));
try {
  for (const failedScreenshot of [false, true]) {
    const label = failedScreenshot ? 'closed page' : 'font timeout', f = fixture(root, failedScreenshot);
    test(`${label}: the review fails with exit 1 and still writes its report with exact input hashes`, () => {
      assert.equal(f.run.status, 1, f.run.stderr.slice(-800));
      const report = f.read('reader-review.json');
      assert.equal(report.frames.length, 0);
      assert.equal(report.inputs.manifestSha256, sha(readFileSync(f.manifest)));
      assert.equal(report.inputs.runtimeSha256, sha(f.runtimeBytes));
      assert.equal(report.inputs.stories[0].storySha256, sha(JSON.stringify({scenes: []})));
      assert.deepEqual(report.inputs.stories[0].story, {scenes: []});
    });
    test(`${label}: the fatal error names its phase and page state`, () => {
      const [error] = f.read('reader-review.json').errors;
      assert.match(error.message, /fixture-font-readiness-timeout/); assert.equal(error.phase, 'fixture/desktop/fonts'); assert.equal(error.state.fonts, 'loading');
      if (failedScreenshot) assert.match(error.screenshotError, /fixture-page-closed/);
      else assert.equal(f.read('pending.json').captures.length, 1, 'the failure capture is deferred to the registration batch');
    });
    test(`${label}: the browser was muted, bounded, closed and its lock released`, () => {
      const events = f.read('events.json');
      for (const expected of ['timeout:30000', 'navtimeout:30000', 'muted:true', 'browser-closed', 'lock:stopped']) assert(events.includes(expected), expected);
      assert(events.indexOf('lock:started') < events.indexOf('lock:stopped'));
    });
  }
} finally { rmSync(root, {recursive: true, force: true}); }

const passed = results.filter(r => r.pass).length;
console.log(JSON.stringify({reviewScript: sourcePath, checks: results.length, passed, failed: results.filter(r => !r.pass), browserLaunched: false}, null, 2));
if (passed !== results.length) process.exitCode = 1;
