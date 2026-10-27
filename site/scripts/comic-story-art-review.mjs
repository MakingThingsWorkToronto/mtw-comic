// Actual reader crops and lettering against visually authored source-image subject regions.
// Coordinate the shared browser/catalog slots before running. Does not grant visual or user approval.
// node scripts/comic-story-art-review.mjs --manifest <json> [--base http://127.0.0.1:8789] [--story home] [--require-device-audit]
// Manifest: {stories:[{slug,scenes:[{id,width,height,panels:[{imageId,protectedSubjects:[{label,sourcePixelRect}]}]}]}]}
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { randomUUID, createHash } from 'node:crypto';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { checkDeviceReview, checkActiveArt, captureActiveArt } from './comic-story-framing-check.mjs';
import { viewRasterHeader } from './comic-view-contract.mjs';
import { reviewDir, registerReview, recordDir, browserLock, deferReview, runStamp } from './comic-story-library.mjs';

const args = process.argv.slice(2), opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`); return i < 0 ? fallback : args[i + 1];
};
const manifestPath = opt('manifest');
if (!manifestPath) throw new Error('Supply a reviewed source-subject manifest with --manifest');
const input = JSON.parse(readFileSync(manifestPath, 'utf8'));
const base = opt('base', 'http://127.0.0.1:8789');
const activeAliasCache=new Map();
async function readActiveAlias(src) {
  const url=new URL(src,base);
  if(url.origin!==new URL(base).origin)throw Error('Selected art is outside the owned review origin');
  if(!activeAliasCache.has(url.href))activeAliasCache.set(url.href,(async()=>{
    const response=await fetch(url);if(!response.ok)throw Error('Selected art response '+response.status);
    const bytes=Buffer.from(await response.arrayBuffer()),header=viewRasterHeader(bytes);
    if(!header)throw Error('Selected art header unavailable');
    return {sha256:createHash('sha256').update(bytes).digest('hex'),dimensions:[header.width,header.height]};
  })());
  return activeAliasCache.get(url.href);
}

const selected = input.stories.filter(s => !opt('story') || s.slug === opt('story'));
if (!selected.length) throw new Error('No stories selected');
const prepared = [];
for (const item of selected) {
  const url = `${base}/comics/${item.slug}/`;
  const html = await (await fetch(url)).text();
  const json = html.match(/<script type="application\/json" id="comic-story">([\s\S]*?)<\/script>/);
  if (!json) throw new Error(`No comic story at ${url}`);
  const story = JSON.parse(json[1]);
  for (const scene of item.scenes) {
    const data = story.scenes.find(s => s.id === scene.id);
    if (!data?.art) throw new Error(`${item.slug}/${scene.id}: integrate page art before review`);
    if (scene.panels.length !== data.panels.length) throw new Error(`${scene.id}: subject/panel count mismatch`);
    const imageIds = scene.panels.map(p => p.imageId);
    if (new Set(imageIds).size !== imageIds.length || data.panels.some(p => !imageIds.includes(p.img))) throw new Error(`${scene.id}: subject image IDs mismatch`);
    for (const p of scene.panels) {
      if (!p.protectedSubjects?.length && !p.activeArtSources?.length) throw new Error(`${p.imageId}: no observed subjects`);
      const deviceErrors = p.activeArtSources?.length ? p.activeArtSources.flatMap(a=>checkDeviceReview(a,{width:a.sourceDimensions?.[0],height:a.sourceDimensions?.[1],masterSha256:a.canonicalSource?.sha256},args.includes('--require-device-audit'))) : checkDeviceReview(p, scene, args.includes('--require-device-audit'));
      if (deviceErrors.length) throw new Error(`${p.imageId}: ${deviceErrors.join('; ')}`);
    }
  }
  prepared.push({ ...item, url, story });
}

const registrationBatch = opt('registration-batch');
if (registrationBatch && !/^[a-z0-9][a-z0-9-]*$/.test(registrationBatch)) throw new Error('Invalid registration batch name');
const out = reviewDir('reader-art', registrationBatch ? `${runStamp()}-${randomUUID().slice(0, 8)}` : undefined), captures = [], report = { sourceManifest: manifestPath, at: new Date().toISOString(), frames: [], errors: [], diagnostics: [] };
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
report.inputs = {
  manifestSha256: digest(readFileSync(manifestPath)),
  runtimeSha256: digest(readFileSync(new URL('../public/scripts/comic-story.js', import.meta.url))),
  stories: prepared.map(({ slug, url, story }) => ({ slug, url, storySha256: digest(JSON.stringify(story)), story })),
};
let browser, lastPage, phase = 'launch';
browserLock('started', 'scripts/comic-story-art-review.mjs');
try {
  browser = await chromium.launch({ channel: 'chrome', args: ['--mute-audio'] });
  for (const [viewport, options] of [
    ['desktop', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }],
    ['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
  ]) {
    const context = await browser.newContext(options), page = await context.newPage();
    lastPage = page;
    page.setDefaultTimeout(30000); page.setDefaultNavigationTimeout(30000);
    page.on('framenavigated', frame => report.diagnostics.push({ viewport, event: 'navigation', url: frame.url(), at: new Date().toISOString() }));
    page.on('console', message => { if (['warning', 'error'].includes(message.type())) report.diagnostics.push({ viewport, event: 'console', type: message.type(), message: message.text() }); });
    page.on('response', response => { if (response.status() >= 400) report.errors.push({ viewport, event: 'response', url: response.url(), status: response.status() }); });
    page.on('pageerror', e => report.errors.push({ viewport, message: String(e) }));
    page.on('requestfailed', r => report.errors.push({ viewport, url: r.url(), message: r.failure()?.errorText }));
    for (const item of prepared) {
      phase = `${item.slug}/${viewport}/navigation`;
      await page.goto(`${item.url}?hold&mute`, { waitUntil: 'load', timeout: 30000 });
      phase = `${item.slug}/${viewport}/fonts`;
      await page.waitForFunction(() => document.fonts.status === 'loaded');
      await page.waitForFunction(() => !!window.MTWComicStory);
      const seek = async beat => {
        phase = `${item.slug}/${viewport}/seek/${beat}`;
        await page.evaluate(t => window.MTWComicStory.seek(t), beat * 60 / item.story.bpm);
        await page.waitForFunction(() => window.MTWComicStory.status().loaded);
        await page.waitForTimeout(120);
        return page.evaluate(() => window.MTWComicStory.status());
      };
      for (const source of item.scenes) {
        const scene = item.story.scenes.find(s => s.id === source.id);
        await seek(scene.b + 0.001); // load/decode and measure this scene before reading its viewport timeline
        const plan = await page.evaluate(id => window.MTWComicStory.reviewFrames(id), source.id);
        if (!plan || plan.scene !== source.id || !plan.sheets || new Set(plan.frames.map(f => f.sheet)).size !== plan.sheets ||
            plan.frames.some(f => f.sheet < 0 || f.sheet >= plan.sheets)) throw new Error(`${source.id}: incomplete measured sheet timeline`);
        const expectedIds = source.panels.map(p => p.imageId).sort(), plannedIds = plan.frames.flatMap(f => f.panelImageIds).sort();
        if (JSON.stringify(expectedIds) !== JSON.stringify(plannedIds)) throw new Error(`${source.id}: timeline panel coverage mismatch`);
        const seenSheets = new Set(), seenPanels = new Set();
        for (const moment of plan.frames) {
          const sheet = moment.sheet, state = await seek(moment.beat);
          if (state.scene !== source.id || state.sheet !== moment.activeSheet || state.sheets !== plan.sheets) throw new Error(`${source.id}: seek landed on ${state.scene}/${state.sheet}, expected ${moment.activeSheet}`);
          if (!moment.ready) report.errors.push({ viewport, scene: source.id, sheet, timing: moment, message: moment.timingIssue });
          const activeGeometry = await captureActiveArt(()=>page.evaluate(()=>MTWComicStory.geometry()),readActiveAlias);
          const activeSources = moment.panelImageIds.map(id=>{
            const active=activeGeometry.panels.find(p=>p.scene===scene.id&&p.imageId===id)?.activeArt;
            const audit=checkActiveArt(active,source.panels.find(p=>p.imageId===id));
            for(const message of audit.errors)report.errors.push({phase:'active-art',scene:scene.id,imageId:id,message});
            return {imageId:id,active,audit};
          });
          const inspection = await page.evaluate(({ source, scene, targetIds, activeSources }) => {
            function sourceToScreen(sourceRect, sourceSize, backgroundSize, backgroundPosition, cropRect, cssSize) {
              // The bounding rect includes the allowed translate/scale; computed background values do not.
              const sx = backgroundSize[0] / sourceSize[0] * cropRect[2] / cssSize[0];
              const sy = backgroundSize[1] / sourceSize[1] * cropRect[3] / cssSize[1];
              const kx = cropRect[2] / cssSize[0], ky = cropRect[3] / cssSize[1];
              return [cropRect[0] + backgroundPosition[0] * kx + sourceRect[0] * sx,
                cropRect[1] + backgroundPosition[1] * ky + sourceRect[1] * sy, sourceRect[2] * sx, sourceRect[3] * sy];
            }
            const root = [...document.querySelectorAll('.cs-page')].find(e => e.dataset.scene === source.id);
            if (!root?.classList.contains('is-live') || getComputedStyle(root).visibility !== 'visible') throw new Error(`${source.id}: scene root is not live/visible`);
            const rect = e => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; };
            const visible = e => { for (let p = e; p; p = p.parentElement) { const s = getComputedStyle(p); if (+s.opacity < 0.2 || s.display === 'none' || s.visibility !== 'visible') return false; } return true; };
            const fullyVisible = e => { let opacity = 1; for (let p = e; p; p = p.parentElement) opacity *= +getComputedStyle(p).opacity; return visible(e) && opacity >= 0.99; };
            const shapes = [...root.querySelectorAll('.cs-paper > path, .cs-paper > rect, .cs-paper > [data-part] > path')].filter(visible);
            const inRect = (x, y, r) => x >= r[0] && y >= r[1] && x <= r[0] + r[2] && y <= r[1] + r[3];
            function topPanelAt(x, y) {
              return document.elementsFromPoint(x, y).map(node => node.closest('.cs-panel')).find(panel =>
                panel && root.contains(panel) && visible(panel) && inRect(x, y, rect(panel)));
            }
            return [...root.querySelectorAll('.cs-panel')].filter(el => targetIds.includes(scene.panels[+el.dataset.box]?.img)).map(el => {
              const index = +el.dataset.box, authored = scene.panels[index];
              const annotated = source.panels.find(p => p.imageId === authored.img);
              const selected = activeSources.find(a=>a.imageId===authored.img), frame = rect(el);
              if (!selected?.active || selected.audit.errors.length || !selected.audit.expected) return { index, imageId: authored.img, missing: true, activeSourceFailure: true };
              const active=selected.active, cr=active.cropRect, size=active.backgroundSize, pos=active.backgroundPosition;
              const subjects = selected.audit.expected.protectedSubjects.map(s => {
                const screen = sourceToScreen(s.sourcePixelRect, selected.audit.expected.sourceDimensions, size, pos, cr,
                  active.cssSize);
                let clipped = 0, covered = 0, occludedByPanel = 0;
                for (let iy = 0; iy < 10; iy++) for (let ix = 0; ix < 10; ix++) {
                  const px = screen[0] + (ix + 0.5) * screen[2] / 10, py = screen[1] + (iy + 0.5) * screen[3] / 10;
                  if (!inRect(px, py, frame)) { clipped++; continue; }
                  const topPanel = topPanelAt(px, py);
                  if (topPanel && topPanel !== el) occludedByPanel++;
                  if (shapes.some(path => { const matrix = path.getScreenCTM(); return matrix && path.isPointInFill(new DOMPoint(px, py).matrixTransform(matrix.inverse())); })) covered++;
                }
                return { label: s.label, screen, sampled: 100, clipped, covered, occludedByPanel, needsInspection: clipped > 5 || covered > 2 || occludedByPanel > 2 };
              });
              // Check rendered glyph spans: a visible wrapper can contain text outside its panel.
              function letteringEscapes(box, limit, tolerance = 1) {
                return box[0] < limit[0] - tolerance || box[1] < limit[1] - tolerance ||
                  box[0] + box[2] > limit[0] + limit[2] + tolerance || box[1] + box[3] > limit[1] + limit[3] + tolerance;
              }
              const balloons = [...el.querySelectorAll('.cs-bw')].map(b => {
                const units = [...b.querySelectorAll('.cs-u')];
                const textRects = units.filter(u => fullyVisible(u)).flatMap(u => [...u.getClientRects()].map(r => [r.x, r.y, r.width, r.height])).filter(r => r[2] > 0 && r[3] > 0);
                return { text: b.querySelector('.cs-b')?.getAttribute('aria-label'), geometry: JSON.parse(b.dataset.geom || '{}'),
                  fullyVisible: fullyVisible(b), untypedUnits: units.filter(u => +getComputedStyle(u).opacity < 0.99).length,
                  textRects, letteringOutsidePanel: textRects.filter(r => letteringEscapes(r, frame)).length,
                  letteringOutsideViewport: textRects.filter(r => letteringEscapes(r, [0, 0, innerWidth, innerHeight])).length };
              });
              for (let i = 0; i < balloons.length; i++) balloons[i].textOverlapWith = balloons.flatMap((other, j) => j !== i && balloons[i].textRects.some(a => other.textRects.some(b =>
                Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0]) > 1 && Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]) > 1)) ? [j] : []);
              return { index, imageId: authored.img, frame, subjects, balloons, artFullyVisible: fullyVisible(el.querySelector('.cs-panel__art')) };
            });
          }, { source, scene, targetIds: moment.panelImageIds, activeSources });
          const sampledIds = inspection.map(p => p.imageId).sort();
          if (JSON.stringify(sampledIds) !== JSON.stringify([...moment.panelImageIds].sort())) throw new Error(`${source.id}/${sheet}: visible panel coverage mismatch`);
          seenSheets.add(sheet); sampledIds.forEach(id => seenPanels.add(id));
          if (inspection.some(p => !p.missing && (!p.artFullyVisible || p.balloons.some(b => !b.fullyVisible || b.untypedUnits))))
            report.errors.push({ viewport, scene: source.id, sheet, message: 'Actual frame has faded artwork/balloons or unfinished lettering.' });
          if (inspection.some(p => p.subjects?.some(subject => subject.occludedByPanel > 2)))
            report.errors.push({ viewport, scene: source.id, sheet, message: 'Another visible panel covers a ready target subject.' });
          const letteringCandidates = inspection.flatMap(p => (p.balloons || []).flatMap((b, balloon) =>
            b.letteringOutsidePanel || b.letteringOutsideViewport || b.textOverlapWith.length ? [{ imageId: p.imageId, balloon, text: b.text,
              outsidePanel: b.letteringOutsidePanel, outsideViewport: b.letteringOutsideViewport, textOverlapWith: b.textOverlapWith }] : []));
          if (letteringCandidates.length) (report.letteringCandidates ||= []).push({ slug: item.slug, scene: source.id, viewport, sheet, frame: moment.frame, candidates: letteringCandidates });
          const name = `${item.slug}-${source.id}-${viewport}-${sheet}-${moment.frame}.png`, path = join(out, name);
          await page.screenshot({ path });
          captures.push({ path, title: `${item.slug} ${source.id} ${viewport} sheet ${sheet + 1}`, group: 'reader artwork', note: 'Actual illustrated page with final lettering; automated source-subject sampling identifies review candidates, not visual approval.' });
          report.frames.push({ slug: item.slug, scene: source.id, viewport, sheet, state, timing: moment, file: name, panels: inspection });
          console.log(`${item.slug}/${source.id} ${viewport} ${sheet + 1}/${state.sheets}: ${inspection.flatMap(p => p.subjects || []).filter(s => s.needsInspection).length} subject candidates`);
        }
        if (seenSheets.size !== plan.sheets || JSON.stringify([...seenPanels].sort()) !== JSON.stringify(expectedIds))
          throw new Error(`${source.id}: captured sheet/panel coverage incomplete`);
      }
    }
    await context.close();
  }
} catch (error) {
  const failure = { fatal: true, phase, message: String(error) };
  report.errors.push(failure);
  if (lastPage) {
    try { failure.state = await lastPage.evaluate(() => ({ url: location.href, fonts: document.fonts.status,
      status: window.MTWComicStory?.status(), missingArt: [...document.querySelectorAll('.is-art-missing')].map(el => el.dataset.scene || el.dataset.box || el.className) })); }
    catch (stateError) { failure.stateError = String(stateError); }
    try {
      const path = join(out, 'reader-failure.png'); await lastPage.screenshot({ path, timeout: 10000 });
      captures.push({ path, title: `Reader failure at ${phase}`, group: 'reader failure', note: 'Diagnostic capture from a failed review; not a completed frame or visual approval.' });
    } catch (screenshotError) { failure.screenshotError = String(screenshotError); }
  }
  throw error;
} finally {
  await browser?.close(); browserLock('stopped', 'scripts/comic-story-art-review.mjs');
  const records = recordDir(captures[0]?.path || join(out, 'reader-failure.png')); mkdirSync(records, { recursive: true });
  writeFileSync(join(records, 'reader-review.json'), JSON.stringify(report, null, 2));
  console.log(`Review candidates and evidence: ${join(records, 'reader-review.json')}`);
  if (captures.length) {
    if (registrationBatch) {
      const pending = deferReview(captures, { batch: registrationBatch, reportPath: join(records, 'reader-review.json') });
      console.log(`Registration pending in coordinated batch ${registrationBatch}: ${pending}`);
    } else registerReview(captures);
  }
}
if (report.errors.length || report.frames.some(f => f.panels.some(p => p.missing))) process.exitCode = 1;
