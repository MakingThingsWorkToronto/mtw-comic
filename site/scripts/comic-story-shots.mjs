#!/usr/bin/env node
// Screenshots of a Comic B page at one moment, desktop 1440x900 and phone 390x844 (skill: mtw-comic-story, checks.md;
// Matt, 2026-09-28: "no report or handoff without inspected screenshots of the change on desktop and phone"). Takes the
// browser lock in discussion/handoff/STATUS.md (waits while any "browser run started" has no later "stopped"), notes
// its start and stop there, and writes PNGs for the agent to Read and compare with the reference page it copies. The PNGs
// go to a new run folder in the image library (assets/experiments/comic-b/browser-shots/<run>/) and are registered there
// (comic-story-library.mjs); --out is refused unless it is inside that library folder.
// Usage: node scripts/comic-story-shots.mjs --path /home-b/ --scene rolling --beat 30
//        [--query "ghost=0.6"] [--wait 20] [--label name] [--wide] (adds 1920x1080) [--eval "<js expression>"] (prints its JSON per viewport)
import { resolve, join } from 'node:path';
import { chromium } from 'playwright';
import { reviewDir, registerReview, browserLock, waitForBrowser, library } from './comic-story-library.mjs';

const args = process.argv.slice(2), opt = (n, d) => { const i = args.indexOf(`--${n}`); return i > -1 ? args[i + 1] : d; };
const origin = opt('origin', 'http://localhost:8789'), path = opt('path', '/home-b/'), scene = opt('scene', null), beat = opt('beat', '0'), extra = opt('query', '');
const out = opt('out', null) ? resolve(opt('out')) : reviewDir('browser-shots'), label = opt('label', `${path.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'page'}-${scene || 'start'}-${beat}`);
const waitMin = +opt('wait', 20), evalJs = opt('eval', null);
if (!resolve(out).startsWith(join(library, 'assets', 'experiments', 'comic-b'))) { console.error(`--out must be inside the image library's Comic B folder, not ${out}`); process.exit(2); }
await waitForBrowser(waitMin);
browserLock('started', 'scripts/comic-story-shots.mjs');
const files = [];
try {
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    const vps = [['desktop', { width: 1440, height: 900 }, 1], ['phone', { width: 390, height: 844 }, 2]];
    if (args.includes('--wide')) vps.splice(1, 0, ['wide', { width: 1920, height: 1080 }, 1]); // a large desktop too
    for (const [name, vp, dpr] of vps) {
      const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: dpr, isMobile: name === 'phone', hasTouch: name === 'phone' });
      const page = await ctx.newPage(), errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      const q = ['mute', 'hold', scene ? `scene=${encodeURIComponent(scene)}&beat=${beat}` : `t=${beat}`, extra].filter(Boolean).join('&');
      await page.goto(`${origin}${path}?${q}`, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts && document.fonts.ready);
      await page.waitForFunction(() => window.MTWComicStory && window.MTWComicStory.status().loaded, null, { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(500);
      const f = join(out, `${label}-${name}.png`);
      await page.screenshot({ path: f });
      const st = await page.evaluate(() => window.MTWComicStory && window.MTWComicStory.status());
      files.push(f);
      if (evalJs) console.log(name, JSON.stringify(await page.evaluate(evalJs).catch((e) => String(e))));
      console.log(`${f}  ${st ? `${st.scene} beat ${st.beat} ${st.mode}` : 'no engine'}${errors.length ? '  ERRORS: ' + errors.join(' | ') : ''}`);
      await ctx.close();
    }
  } finally { await browser.close(); }
} finally { browserLock('stopped', 'scripts/comic-story-shots.mjs'); }
registerReview(files.map((f) => ({ path: f, group: 'browser screenshots', title: `Browser screenshot ${f.split(/[\\/]/).slice(-2).join(' ')}`, note: `Browser screenshot of ${path}${scene ? ` scene ${scene}` : ''} at beat ${beat}${extra ? ` (${extra})` : ''} (scripts/comic-story-shots.mjs).` })));
