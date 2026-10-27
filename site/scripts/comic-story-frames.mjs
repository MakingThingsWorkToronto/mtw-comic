#!/usr/bin/env node
// Seeked frames of a Comic Story (Comic B; skill: mtw-comic-story), desktop and phone, headless Chrome (Playwright).
// For every scene (the page reveal, 2026-09-28): the ghosted page (every box at 10%), each box revealed with all its
// balloons, any hold (grey), the whole page before it leaves, and the exit mid-way (boxes leaving on their own); then the
// NEXT page. Uses the engine's test hooks (?scene=<id>&beat=<n>&hold&mute) and waits until the
// scene's art is inlined and fonts are ready before each shot. Also logs page errors and the engine's status.
// Also the standalone reader: the shelf (/comics/), and one reader issue (/comics/<slug>/, default this story's issue):
// its first panel, its NEXT page, the Issues overlay open, and a still (reduced-motion, ?reel=off) page. --no-reader skips.
// Usage: node scripts/comic-story-frames.mjs --url http://127.0.0.1:8789/home-b/ [--out verification/comic-story/home]
//        [--only desktop|phone] [--scene <id>] [--reader <slug>] [--no-reader] [--channel chrome]
// One browser at a time across sessions: note the run in discussion/handoff/STATUS.md first.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { captureWindow } from './comic-story-capture-window.mjs';
import { reviewText } from './comic-review-fetch.mjs';
import { freezeDevNotifications } from './comic-review-dev-notifications.mjs';

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(`--${name}`); return i > -1 ? args[i + 1] : def; };
const url = opt('url', 'http://127.0.0.1:8789/home-b/');
const only = opt('only', null), oneScene = opt('scene', null);
const html = await reviewText(`${url}${url.includes('?') ? '&' : '?'}reel=off`);
const m = html.match(/<script type="application\/json" id="comic-story">([\s\S]*?)<\/script>/);
if (!m) { console.error(`No #comic-story on ${url}`); process.exit(2); }
const story = JSON.parse(m[1]);
const payloadHash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const storySha256 = payloadHash(story);
async function checkServedStory() {
  const current = await reviewText(`${url}${url.includes('?') ? '&' : '?'}reel=off`);
  const embedded = current.match(/<script type="application\/json" id="comic-story">([\s\S]*?)<\/script>/);
  if (!embedded || payloadHash(JSON.parse(embedded[1])) !== storySha256) throw Error('Served story changed during native capture; retain partial evidence.');
}
const runtimeUrl = new URL('/scripts/comic-story.js', url).href;
const runtimeHash = value => createHash('sha256').update(value).digest('hex');
const runtimeSha256 = runtimeHash(await reviewText(runtimeUrl));
const out = resolve(opt('out', `verification/comic-story/${story.id}`));
mkdirSync(out, { recursive: true });

// Which moments to capture, as [name, scene id, beat within the scene].
const shots = [];
for (const sc of story.scenes) {
  if (oneScene && sc.id !== oneScene) continue;
  const EXIT = Math.max(1.5, 1.2 * story.bpm / 60); // the engine's exit, beats
  const firstAt = Math.min(...sc.panels.map((p) => p.at));
  shots.push([`${sc.id}-00-ghosted`, sc.id, Math.max(0.6, Math.min(firstAt - 0.1, 1.2))]);
  sc.panels.forEach((p, i) => {
    if (args.includes('--balloons')) (p.balloons || []).forEach((b, j) => {
      const end = p.balloons[j + 1]?.at ?? sc.panels[i + 1]?.at ?? sc.l - EXIT;
      shots.push([`${sc.id}-${String(i + 1).padStart(2, '0')}-balloon-${j + 1}`, sc.id, Math.max(b.at, end - .1)]);
    });
    if (args.includes('--motion-stops') && (p.layerMotion || []).some(m => m.preset === 'sprout')) {
      for (const offset of [0,.5,2,4,6,8]) shots.push([`${sc.id}-${String(i + 1).padStart(2, '0')}-growth-${offset}`,sc.id,p.at+offset]);
    }
    // Use the real retimed reading window, not an early fraction of a beat after the final balloon starts.
    const next = sc.panels[i + 1]?.at ?? sc.l - EXIT;
    shots.push([`${sc.id}-${String(i + 1).padStart(2, '0')}-box`, sc.id, Math.max(p.at, next - 0.35)]);
  });
  (sc.hold || []).forEach(([a], i) => shots.push([`${sc.id}-hold-${i + 1}`, sc.id, a + 0.6]));
  shots.push([`${sc.id}-98-page`, sc.id, Math.max(0, sc.l - EXIT - 0.3)]);
  shots.push([`${sc.id}-99-exit`, sc.id, sc.l - EXIT * 0.5]);
}
if (!oneScene) shots.push(['next', 'next', 2.5]);
// Standalone reader shots: [name, path, query, action].
const origin = new URL(url).origin;
const readerSlug = opt('reader', null) || ({ home: 'home', agentic: 'agentic-systems', traditional: 'traditional-systems', 'data-migrations': 'data-migrations' })[story.id] || story.id;
const first = story.scenes[0], firstP = first && first.panels[0];
const readerShots = args.includes('--no-reader') || oneScene ? [] : [
  ['reader-shelf', '/comics/', '', null],
  ['reader-first-panel', `/comics/${readerSlug}/`, `scene=${first.id}&beat=${firstP ? Math.max(firstP.at + 0.2, ((firstP.balloons || [])[0]?.at ?? firstP.at) + 0.8) : 1}&hold&mute`, null],
  ['reader-next', `/comics/${readerSlug}/`, 'scene=next&beat=2.5&hold&mute', null],
  ['reader-issues-open', `/comics/${readerSlug}/`, `scene=${first.id}&beat=2&hold&mute`, 'issues'],
  ['reader-still', `/comics/${readerSlug}/`, 'reel=off&mute', null],
];

const viewports = [
  ['desktop', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }],
  ['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
].filter(([n]) => !only || n === only);

const browser = await chromium.launch(opt('channel', null) ? { channel: opt('channel', null) } : {});
const report = [];
try {
  for (const [vname, ctxOpts] of viewports) {
    const ctx = await browser.newContext(ctxOpts);
    // Freeze dev notifications only, keeping actual scene/runtime HTTP identity checks.
    if (args.includes('--freeze-hmr')) await freezeDevNotifications(ctx, origin);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    let loadedScene = null;
    const measuredWindows = new Map();
    for (const [name, sid, beat] of shots) {
      const u = `${url}${url.includes('?') ? '&' : '?'}scene=${encodeURIComponent(sid)}&beat=${beat}&hold&mute`;
      const scene = story.scenes.find(s => s.id === sid);
      if (args.includes('--reuse-scene') && loadedScene === sid && scene) {
        await page.evaluate(t => window.MTWComicStory.seek(t), (scene.b + beat) * 60 / story.bpm);
      } else {
        await checkServedStory();
        await page.goto(u, { waitUntil: 'load' });
        loadedScene = sid;
      }
      const liveStory = await page.locator('#comic-story').textContent();
      if (payloadHash(JSON.parse(liveStory)) !== storySha256) throw Error('Story changed during native capture; retain partial evidence and rerun a fresh scope.');
      if (runtimeHash(await reviewText(runtimeUrl)) !== runtimeSha256) throw Error('Runtime changed during native capture; retain partial evidence and rerun a fresh scope.');
      await page.evaluate(() => document.fonts && document.fonts.ready);
      await page.waitForFunction(() => window.MTWComicStory && window.MTWComicStory.status().loaded, null, { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(250);
      let captureBeat = beat, readingWindow = null;
      if (scene && name.endsWith('-box')) {
        if (!measuredWindows.has(sid)) measuredWindows.set(sid, await page.evaluate(id => window.MTWComicStory.reviewFrames(id), sid));
        const panelIndex = Number(name.match(/-(\d+)-box$/)[1]) - 1;
        const panelId = scene.panels[panelIndex].img;
        ({ beat: captureBeat, readingWindow } = captureWindow(measuredWindows.get(sid), panelId, scene.b));
        await page.evaluate(t => window.MTWComicStory.seek(t), readingWindow.beat * 60 / story.bpm);
        await page.waitForTimeout(100);
      }
      const st = await page.evaluate(() => window.MTWComicStory && window.MTWComicStory.status());
      const file = `${vname}-${name}.png`;
      await page.screenshot({ path: resolve(out, file) });
      report.push({ viewport: vname, shot: name, scene: sid, requestedBeat: beat, beat: captureBeat, readingWindow, file, status: st });
      console.log(`${vname.padEnd(7)} ${name.padEnd(28)} ${st ? `${st.scene} b${st.beat} ${st.mode}${st.loaded ? '' : ' (art not loaded)'}` : 'no engine'}`);
    }
    for (const [name, path, query, action] of readerShots) {
      await page.goto(`${origin}${path}${query ? `?${query}` : ''}`, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts && document.fonts.ready);
      if (path !== '/comics/') await page.waitForFunction(() => window.MTWComicStory && window.MTWComicStory.status().loaded, null, { timeout: 15000 }).catch(() => {});
      if (action === 'issues') await page.evaluate(() => window.MTWComicStory && window.MTWComicStory.openIssues());
      await page.waitForTimeout(300);
      const st = await page.evaluate(() => window.MTWComicStory ? window.MTWComicStory.status() : null);
      const file = `${vname}-${name}.png`;
      await page.screenshot({ path: resolve(out, file) });
      report.push({ viewport: vname, shot: name, path, query, file, status: st });
      console.log(`${vname.padEnd(7)} ${name.padEnd(28)} ${path}${st ? ` ${st.scene} b${st.beat} ${st.mode}${st.still ? ' still' : ''}${st.issues ? ' issues-open' : ''}` : ''}`);
    }
    if (errors.length) { console.log(`${vname}: ${errors.length} page error(s)`); errors.forEach((e) => console.log(`  ${e}`)); }
    report.push({ viewport: vname, errors });
    await ctx.close();
  }
  await checkServedStory();
} catch (error) {
  report.push({ failure: String(error), at: new Date().toISOString() });
  throw error;
} finally {
  await browser.close();
  writeFileSync(resolve(out, 'frames.json'), JSON.stringify({ url, story: story.id, storySha256, runtimeSha256, reuseScene: args.includes('--reuse-scene'), frozenDevNotifications: args.includes('--freeze-hmr'), at: new Date().toISOString(), report }, null, 2));
}
console.log(`\n${report.filter((r) => r.file).length} frames in ${out}`);
