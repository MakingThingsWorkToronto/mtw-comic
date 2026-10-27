#!/usr/bin/env node
// Per-box frames of one scene of a Comic Story reader page (skill: mtw-comic-story; protocol: scripts/comics/README.md).
// Usage: node scripts/comics/frames-review.mjs --slug <slug> --build <buildId> --scene <id> [--origin http://127.0.0.1:8787]
//        [--sizes desktop,phone,reduced] [--channel chrome] [--json]
// Reader page <origin>/comics/<slug>/ embeds the retimed story (#comic-story). Test hooks: ?scene=<id>&beat=<n>&mute&hold
// (beat is relative to the scene start), ?reel=off is the reduced-motion still. Per non-inset box: reveal, read, and
// motion (boxes with layerMotion or views). Writes <ledgerDir>/frames/<scene>/*.png, *-box.png and index.json, and sets
// scenes.<scene>.frames in the ledger. Uses ONE headless browser: note it in discussion/handoff/STATUS.md first.
// Exit 0 ok, 1 a frame had errors or failed requests, 2 usage/setup.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { REPO, rel, sha256, storyPathFor } from './lib/story.mjs';
import { openLedger, writeLedger, ledgerDir, sceneState } from './lib/ledger.mjs';

const SIZES = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  reduced: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
};

/** Moments to capture for a box. rel = beat within the scene (the URL hook), beat = scene.b + rel (absolute). */
export function momentsFor(scene, panel) {
  if (panel.inset) return [];
  const last = panel.balloons?.length ? Math.max(...panel.balloons.map((b) => b.at)) : panel.at;
  const out = [{ moment: 'reveal', rel: panel.at + 0.6 }, { moment: 'read', rel: last + 2 }];
  if (panel.layerMotion?.length || panel.views?.length) out.push({ moment: 'motion', rel: out[0].rel + 3 });
  return out.map((m) => ({ ...m, beat: scene.b + m.rel }));
}
export const frameName = (img, size, moment, box = false) => `${String(img).replace(/[^\w.-]+/g, '-')}-${size}-${moment}${box ? '-box' : ''}.png`;

async function text(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return r.text();
}

async function main() {
  const args = process.argv.slice(2);
  const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i > -1 ? args[i + 1] : d; };
  const slug = opt('slug'), build = opt('build'), sceneId = opt('scene'), origin = opt('origin', 'http://127.0.0.1:8787'), json = args.includes('--json');
  const sizes = opt('sizes', 'desktop,phone,reduced').split(',');
  if (!slug || !build || !sceneId || sizes.some((s) => !SIZES[s])) { console.error('usage: frames-review.mjs --slug <slug> --build <id> --scene <id> [--origin url] [--sizes desktop,phone,reduced] [--json]'); return 2; }

  const pageUrl = `${origin}/comics/${slug}/`;
  const html = await text(pageUrl);
  const m = html.match(/<script type="application\/json" id="comic-story">([\s\S]*?)<\/script>/);
  if (!m) { console.error(`No #comic-story on ${pageUrl}`); return 2; }
  const story = JSON.parse(m[1]);
  const si = story.scenes.findIndex((s) => s.id === sceneId);
  if (si < 0) { console.error(`scene ${sceneId} not in story`); return 2; }
  const scene = story.scenes[si];
  const storySha256 = sha256(JSON.stringify(story));
  const runtimeSha256 = sha256(await text(`${origin}/scripts/comic-story.js`));

  const state = openLedger(slug, build, { storyPath: rel(storyPathFor(slug)) });
  const outDir = path.join(ledgerDir(slug, build), 'frames', sceneId);
  fs.mkdirSync(outDir, { recursive: true });

  const { chromium } = createRequire(path.join(REPO, 'site', 'package.json'))('playwright');
  const browser = await chromium.launch(opt('channel') ? { channel: opt('channel') } : {});
  const frames = [];
  try {
    for (const size of sizes) {
      const ctx = await browser.newContext(SIZES[size]);
      const page = await ctx.newPage();
      let errors = [], failed = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('requestfailed', (r) => failed.push(`${r.url()} ${r.failure()?.errorText ?? ''}`.trim()));
      page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.url()} HTTP ${r.status()}`); });
      scene.panels.forEach((panel, pi) => {
        if (panel.inset) return;
        const moments = momentsFor(scene, panel).filter((x) => size !== 'reduced' || x.moment === 'reveal');
        for (const mo of moments) frames.push({ panel, pi, size, mo, page, take: () => { const e = errors, f = failed; errors = []; failed = []; return { errors: e, failed: f }; } });
      });
    }
    const done = [];
    for (const f of frames) {
      const img = f.panel.img ?? f.panel.id ?? `box-${f.pi}`;
      const q = f.size === 'reduced' ? `reel=off&mute&scene=${encodeURIComponent(sceneId)}&beat=${f.mo.rel}` : `scene=${encodeURIComponent(sceneId)}&beat=${f.mo.rel}&hold&mute`;
      f.take();
      let rec = { img, size: f.size, moment: f.mo.moment, beat: f.mo.beat, path: null, boxPath: null, boxRect: null, sha256: null, status: 'ok', errors: [], failedRequests: [] };
      try {
        await f.page.goto(`${pageUrl}?${q}`, { waitUntil: 'load' });
        await f.page.evaluate(() => document.fonts && document.fonts.ready);
        await f.page.waitForFunction(() => window.MTWComicStory && window.MTWComicStory.status().loaded, null, { timeout: 20000 }).catch(() => rec.errors.push('art not loaded within 20s'));
        await f.page.waitForTimeout(400);
        const file = path.join(outDir, frameName(img, f.size, f.mo.moment));
        await f.page.screenshot({ path: file });
        rec.path = rel(file);
        rec.sha256 = sha256(fs.readFileSync(file));
        const box = f.page.locator(`.cs-panel[data-scene="${si}"][data-box="${f.pi}"]`).first();
        const rect = await box.boundingBox().catch(() => null);
        if (rect) {
          const vp = SIZES[f.size].viewport;
          const clip = { x: Math.max(0, rect.x), y: Math.max(0, rect.y), width: Math.min(rect.width, vp.width - Math.max(0, rect.x)), height: Math.min(rect.height, vp.height - Math.max(0, rect.y)) };
          rec.boxRect = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
          if (clip.width > 1 && clip.height > 1) {
            const bfile = path.join(outDir, frameName(img, f.size, f.mo.moment, true));
            await f.page.screenshot({ path: bfile, clip });
            rec.boxPath = rel(bfile);
          } else rec.errors.push('box outside viewport');
        } else rec.errors.push('box element not found');
      } catch (e) { rec.errors.push(String(e.message || e).split('\n')[0]); }
      const got = f.take();
      rec.errors.push(...got.errors);
      rec.failedRequests.push(...got.failed);
      if (rec.errors.length || rec.failedRequests.length) rec.status = 'error';
      done.push(rec);
      if (!json) console.log(`${rec.status.padEnd(5)} ${f.size.padEnd(7)} ${img} ${rec.moment} b${rec.beat.toFixed(2)} ${rec.path ?? '-'}${rec.errors.concat(rec.failedRequests).length ? ` [${rec.errors.concat(rec.failedRequests).join('; ').slice(0, 160)}]` : ''}`);
    }
    frames.length = 0;
    frames.push(...done);
  } finally { await browser.close(); }

  const index = { schema: 'comic-frames/1', slug, build, scene: sceneId, origin, storySha256, runtimeSha256, frames };
  const indexFile = path.join(outDir, 'index.json');
  fs.writeFileSync(indexFile, JSON.stringify(index, null, 2) + '\n');
  const bad = frames.filter((f) => f.status !== 'ok').length;
  sceneState(state, sceneId).frames = { index: rel(indexFile), count: frames.length, errors: bad };
  writeLedger(state);
  if (json) console.log(JSON.stringify(index, null, 2));
  return bad ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))) {
  main().then((c) => process.exit(c), (e) => { console.error(e); process.exit(2); });
}
