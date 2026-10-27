#!/usr/bin/env node
// Native Chrome sound-control and authored-score regression. Controller state proves routing/unlock,
// not audible quality. No autoplay-policy override, forced clicks, or direct sound-toggle calls.
// Usage: node scripts/comic-story-score.mjs [--origin http://localhost:8789] [--path /comics/home/]
//        [--out verification/comic-story/sound.json] [--headed] [--audible]
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { browserLock, waitForBrowser } from './comic-story-library.mjs';

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(`--${name}`); return i < 0 ? fallback : args[i + 1]; };
const origin = opt('origin', 'http://localhost:8789');
const selected = opt('path', null);
const paths = selected ? [selected] : ['/comics/home/', '/comics/agentic-systems/', '/comics/traditional-systems/', '/comics/data-migrations/'];
const output = resolve(opt('out', 'verification/comic-story/sound.json'));
const controls = { header: '[data-sound-toggle]', credit: '.cs-tag__mute' };
const report = { at: new Date().toISOString(), origin, policy: 'native Chrome; fresh context for every case; no autoplay override', limits: 'Routing and controller checks only. Audible quality, effect timbre and crossfade listening remain separate.', cases: [] };
let browser;
function assert(condition, message) { if (!condition) throw new Error(message); }
async function status(page) { return page.evaluate(() => window.MTWComicStory.status()); }
async function soundReady(page) {
  await page.waitForFunction(() => {
    const s = window.MTWComicStory.status();
    return s.audioLive && !s.muted && s.score.ctx === 'running' && s.score.routed;
  }, null, { timeout: 15000 });
}
async function compareScore(page, story, target) {
  await page.evaluate(t => window.MTWComicStory.seek(t), target);
  await page.waitForFunction(data => {
    const s = window.MTWComicStory.status(), beat = s.T * data.bpm / 60;
    let index = 0;
    data.scenes.forEach((scene, i) => { if (beat >= scene.b) index = i; });
    const scene = data.scenes[index], prev = index ? data.scenes[index - 1].score || 0 : 0;
    const expected = prev + ((scene.score || 0) - prev) * Math.max(0, Math.min(1, (beat - scene.b) / 2));
    return Math.abs(s.score.level - expected) <= 0.015 && s.score.room === (scene.room || 'none');
  }, story, { timeout: 3000 });
  const s = await status(page), beat = s.T * story.bpm / 60;
  let index = 0; story.scenes.forEach((scene, i) => { if (beat >= scene.b) index = i; });
  const sc = story.scenes[index], prev = index ? story.scenes[index - 1].score || 0 : 0;
  const expected = prev + ((sc.score || 0) - prev) * Math.max(0, Math.min(1, (beat - sc.b) / 2));
  assert(Math.abs(s.score.level - expected) <= 0.015, `score ${s.score.level} != authored ${expected}`);
  return { scene: sc.id, expected, actual: s.score.level, room: s.score.room, intentionalNoMusic: (sc.score || 0) === 0 };
}
async function runCase(path, preference, control, reduced = false, inspectScenes = false) {
  const result = { path, preference, control, reduced, passed: false, scoreChecks: [], errors: [] };
  report.cases.push(result);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  try {
    await context.addInitScript(pref => { localStorage.setItem('mtw-sound', pref); sessionStorage.removeItem('mtw-mixtape'); }, preference);
    const page = await context.newPage();
    page.on('pageerror', error => result.errors.push(String(error)));
    const url = new URL(path, origin);
    // Reduced motion must initialize a nonzero score after its sole render, without a later seek/frame.
    if (reduced) {
      const response = await context.request.get(url.href); assert(response.ok(), `${path}: HTTP ${response.status()}`);
      const html = await response.text(), raw = html.match(/<script\b[^>]*\bid=["']comic-story["'][^>]*>([\s\S]*?)<\/script>/);
      assert(raw, 'story JSON missing'); const story = JSON.parse(raw[1]);
      const scored = story.scenes.find(sc => sc.score > 0); assert(scored, 'no authored scored scene for reduced-motion case');
      url.searchParams.set('scene', scored.id); url.searchParams.set('beat', '3');
    }
    await page.goto(url.href, { waitUntil: 'load' });
    await page.waitForFunction(() => window.MTWComicStory && (!document.querySelector('.cs-loader') || document.querySelector('.cs-loader').hidden), null, { timeout: 20000 });
    await page.waitForFunction(() => window.MTWComicStory.status().audioLive || document.querySelector('.cs-tag')?.classList.contains('is-waiting'), null, { timeout: 15000 });
    const story = await page.locator('#comic-story').evaluate(el => JSON.parse(el.textContent));
    result.before = await status(page);
    result.autoplay = result.before.audioLive ? 'allowed' : 'blocked';
    const button = page.locator(controls[control]).first();
    // Native policy can permit a cold start. Record that precondition honestly and still exercise unmute.
    if (preference === 'on' && result.before.audioLive && result.before.score.ctx === 'running') {
      await button.click(); await page.waitForFunction(() => window.MTWComicStory.status().muted);
    }
    await button.click(); await soundReady(page);
    result.after = await status(page);
    assert(!result.after.muted, 'one unmute click left comic muted');
    if (reduced) {
      const sc = story.scenes.find(sc => sc.id === result.after.scene);
      assert(result.after.still, 'reduced-motion mode was not active');
      assert(Math.abs(result.after.score.level - sc.score) <= 0.015, 'reduced-motion score was not initialized');
      assert(result.after.score.room === (sc.room || 'none'), 'reduced-motion room was not initialized');
      result.scoreChecks.push({ scene: sc.id, expected: sc.score, actual: result.after.score.level, room: result.after.score.room });
    } else {
      const start = result.after.T;
      await page.waitForFunction(t => window.MTWComicStory.status().T > t + 0.15, start, { timeout: 5000 });
      const scenes = inspectScenes ? story.scenes : [story.scenes[0]];
      for (const sc of scenes) result.scoreChecks.push(await compareScore(page, story, (sc.b + Math.min(3, sc.l - 0.1)) * 60 / story.bpm));
    }
    await button.click(); await page.waitForFunction(() => window.MTWComicStory.status().muted);
    await button.click(); await soundReady(page);
    assert(result.errors.length === 0, result.errors.join(' | '));
    result.passed = true;
  } catch (error) { result.failure = String(error); }
  finally { await context.close(); console.log(`${result.passed ? 'PASS' : 'FAIL'} ${path} ${preference}/${control}${reduced ? '/reduced' : ''}${result.failure ? ': ' + result.failure : ''}`); }
}
await waitForBrowser(20);
browserLock('started', 'scripts/comic-story-score.mjs');
try {
  // Controller tests deliberately toggle sound and seek; keep their browser output quiet by default.
  browser = await chromium.launch({ channel: 'chrome', headless: !args.includes('--headed'), args: args.includes('--audible') ? [] : ['--mute-audio'] });
  for (const path of paths) {
    for (const preference of ['on', 'off']) for (const control of Object.keys(controls)) await runCase(path, preference, control, false, preference === 'off' && control === 'header');
    await runCase(path, 'off', 'header', true);
  }
} finally {
  if (browser) await browser.close();
  browserLock('stopped', 'scripts/comic-story-score.mjs');
  report.passed = report.cases.length === paths.length * 5 && report.cases.every(test => test.passed);
  mkdirSync(dirname(output), { recursive: true }); writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  console.log(output);
}
if (!report.passed) process.exitCode = 1;
