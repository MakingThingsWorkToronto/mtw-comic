// The comic box as the reader itself shows it (Matt, 2026-10-11: "a preview of what i would see in the comic so reuse as
// much as possible so we can spot bugs there"). The site's own reader (comic-story.js, through the same-origin site proxy)
// runs in a fixed-size frame, zoomed so only this box shows:
// - still: ?scene=&beat=&hold&mute, then seek to the box's fully-lettered beat (reviewFrames), no sound;
// - play: ?scene=&beat=<box start>, the reader plays the box with its own motion, effects, room, score and saved speech,
//   and Studio stops it at the next box.
// Balloons are the reader's (geometry()); clicking one asks the page to open its text editor.
import type { ComponentChildren } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { api } from '../../../web/api';
import { proxied } from '../editor/proxy-url';
import { checkBoxSamples, comicPageBoxCount, visibleBoxCount } from './boxChecks';
import type { QuickBalloonGeometry, QuickPanelGeometry, QuickPanelSource, QuickReport, QuickSample } from './boxChecks';

/** The reader window Studio frames: the live reader measured in a 1664x919 window (lettering checked there). */
export const READER_W = 1664;
export const READER_H = 919;

interface ReaderApi {
  status(): { state: string; beat: number; loaded: boolean; T: number; still?: boolean; mode?: string };
  seek(t: number): void;
  reviewFrames(scene: string): { frames: { sheet?: number; panelImageIds: string[]; beat: number; fullyVisibleBeat: number | null; panels?: { imageId: string; fullyVisibleBeat: number | null; fadeStart: number }[] }[] } | null;
  geometry(): {
    viewport: { scrollX: number; scrollY: number; width?: number; height?: number };
    panels: QuickPanelGeometry[];
    balloons: (QuickBalloonGeometry & { visibleRect: Rect })[];
  };
}
interface Rect { x: number; y: number; width: number; height: number }

/** The page's gutter: the narrowest gap between two boxes side by side or stacked; 1% of the page's width with one box. */
export function gutter(rects: Rect[]): number {
  let best = Infinity;
  const overlap = (a0: number, a1: number, b0: number, b1: number): boolean => Math.min(a1, b1) - Math.max(a0, b0) > 1;
  for (const a of rects)
    for (const b of rects) {
      if (a === b) continue;
      const dx = b.x - (a.x + a.width), dy = b.y - (a.y + a.height);
      if (dx > 0.5 && overlap(a.y, a.y + a.height, b.y, b.y + b.height)) best = Math.min(best, dx);
      if (dy > 0.5 && overlap(a.x, a.x + a.width, b.x, b.x + b.width)) best = Math.min(best, dy);
    }
  if (Number.isFinite(best)) return best;
  const left = Math.min(...rects.map((r) => r.x)), right = Math.max(...rects.map((r) => r.x + r.width));
  return Math.max(0, (right - left) * 0.01);
}

let slugs: Promise<Record<string, string>> | null = null;
const slugOf = (issue: string): Promise<string> =>
  (slugs ??= api.get<{ issues: { id: string; slug: string }[] }>('/api/comics/editor/config').then((c) => Object.fromEntries(c.issues.map((i) => [i.id, i.slug])) as Record<string, string>, () => ({}) as Record<string, string>)).then((m) => m[issue] ?? issue);

/** Whether the site preview answers right now (one request; no caching, the preview restarts while the comic is rebuilt). */
export const readerAvailable = (): Promise<boolean> => api.get<{ up: boolean }>('/api/comics/editor/site/status').then((s) => s.up, () => false);

/**
 * The site preview's availability, kept current: checked every 4 s while it is down and every 30 s while it is up, so
 * the stage switches to the real reader as soon as the preview comes back (and to Studio's stand-in if it goes away).
 */
export function useReaderAvailable(): boolean | null {
  const [up, setUp] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    let timer = 0;
    const check = async () => {
      const next = await readerAvailable();
      if (!live) return;
      setUp(next);
      timer = window.setTimeout(() => void check(), next ? 30000 : 4000);
    };
    void check();
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, []);
  return up;
}

/** Shown over Studio's stand-in drawing while the site preview is down. */
export function PreviewDown() {
  return (
    <p class="rs-down" role="status">
      The comic preview (the site on 127.0.0.1:8787) is not running, so this is Studio's rough stand-in: no motion, no
      sound, approximate balloons. It switches to the real comic by itself when the preview is back (<code>npm run all</code>).
    </p>
  );
}

export interface ReaderStageProps {
  issue: string;
  scene: string;
  /** The box to frame; empty frames the whole scene page with each box clickable (onPanel). */
  img: string;
  /** The box's reveal and length in scene beats, and the story tempo. */
  at: number;
  length: number;
  bpm: number;
  playing: boolean;
  /** Bumped when the story or art changed on disk: the frame reloads. */
  version: string;
  currentIndex: number | null;
  onEnded: () => void;
  onBalloon: (index: number) => void;
  onPanel?: (imageId: string) => void;
  /** Shown when the site preview is not running. */
  fallback: ComponentChildren;
}

type FrameBox = { rect: Rect; balloons: { index: number; rect: Rect }[]; panels: { imageId: string; rect: Rect }[] };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
export type ReaderPreviewMode = 'desktop' | 'phone' | 'phone-small' | 'reduced';
export const readerViewport = (mode: ReaderPreviewMode): { width: number; height: number; query: string } => mode === 'phone-small' ? { width: 360, height: 500, query: '' } : mode === 'phone' ? { width: 390, height: 720, query: '' } : { width: READER_W, height: READER_H, query: mode === 'reduced' ? '&reel=off' : '' };
export interface ReaderTestFrame { api: ReaderApi; document: Document; current: () => boolean }
const reviewReaders = new Map<string, ReaderTestFrame>();

/** User-invoked, same-origin existing held frame. No new browser, automatic Send or playback/hearing claim. */
export async function testReaderBox(issue: string, scene: string, img: string): Promise<QuickReport> {
  const key = `${issue}/${scene}/${img}`, entry = reviewReaders.get(key);
  if (!entry?.current()) throw new Error('Open this box in the real reader first; the stand-in cannot run reader tests.');
  return sampleReaderBox(entry, issue, scene, img);
}
/** The actual frame sampler, also exercised by controlled SDK fixtures (not a native review). */
export async function sampleReaderBox(entry: ReaderTestFrame, issue: string, scene: string, img: string): Promise<QuickReport> {
  const key = `${issue}/${scene}/${img}`;
  const { api: r, document: doc } = entry;
  if (r.status().state === 'play') throw new Error('Stop Play before testing the held box.');
  const story = JSON.parse(doc.getElementById('comic-story')?.textContent ?? '{}') as { bpm: number; scenes: { id: string; b: number; l: number; score?: number; room?: string; phonePages?: { img: string }[][]; panels: (QuickPanelSource & { img: string })[] }[] };
  const sc = story.scenes.find(s => s.id === scene), panel = sc?.panels.find(p => p.img === img);
  if (!sc || !panel) throw new Error('The actual reader JSON does not contain this box.');
  const index = sc.panels.indexOf(panel), end = sc.b + (sc.panels[index + 1]?.at ?? sc.l), start = sc.b + panel.at;
  const frames = r.reviewFrames(scene)?.frames;
  const frame = frames?.find(f => f.panelImageIds.includes(img)), own = frame?.panels?.find(p => p.imageId === img);
  const readerMode = r.status().mode;
  const sourceImages = sc.panels.map(p => p.img);
  const pageImages = readerMode === 'phone' ? sc.phonePages?.find(page => page.some(p => p.img === img))?.map(p => p.img)
    ?? (frame?.sheet !== undefined ? [...new Set(frames?.filter(f => f.sheet === frame.sheet).flatMap(f => f.panelImageIds))] : undefined)
    : readerMode === 'desktop' ? sourceImages : undefined;
  const pageBoxCount = comicPageBoxCount(sourceImages, pageImages);
  const full = own?.fullyVisibleBeat ?? frame?.fullyVisibleBeat ?? null, fade = own?.fadeStart ?? end;
  const motions = [panel.motion, ...(panel.layerMotion ?? []), ...(panel.views ?? []).flatMap(v => v.layerMotion ?? [])];
  const span = Math.max(2, ...motions.map(m => m?.beats ?? 4)), last = Math.max(start + .01, Math.min(end, fade) - .02);
  const stops = [{ label: 'opening', beat: Math.min(last, start + .02) }, { label: 'motion-peak', beat: Math.min(last, start + span / 2 + .0625) }, { label: 'full-read', beat: Math.min(last, full ?? last) }, { label: 'end', beat: last }];
  const previous = r.status().T, samples: QuickSample[] = [];
  try {
    for (const stop of stops) {
      if (!entry.current()) throw new Error('The selected box/source changed during its tests; rerun on the current box.');
      r.seek(stop.beat * 60 / story.bpm);
      const deadline = performance.now() + 6000;
      while (!r.status().loaded && performance.now() < deadline) {
        const ownNode = [...doc.querySelectorAll<HTMLElement>('.cs-panel')].find(p => p.querySelector('.cs-panel__alt')?.textContent === img);
        if (ownNode?.getAttribute('data-view-mode') === 'missing' || ownNode?.getAttribute('data-static-art-mode') === 'missing') break;
        const ownArt = r.geometry().panels.find(p => p.scene === scene && p.imageId === img)?.activeArt;
        if (ownArt?.status === 'ready' && ownNode?.getAttribute('data-view-mode') !== 'loading') break; // Other boxes' failures cannot stall this box's review.
        await wait(80);
      }
      await wait(32);
      const g = r.geometry(), selected = g.panels.find(p => p.scene === scene && p.imageId === img);
      const node = [...doc.querySelectorAll<HTMLElement>('.cs-panel')].find(p => p.querySelector('.cs-panel__alt')?.textContent === img);
      const bands = node ? [...node.querySelectorAll<HTMLElement>('.cs-agent-fabrication__band')].map(b => ({ top: b.style.top, opacity: b.style.opacity })) : [];
      const wrappers = node ? [...node.querySelectorAll<HTMLElement>(':scope > .cs-bw')] : [];
      const artEffects = node ? [...node.querySelectorAll<HTMLElement>('.cs-crop')].map(c => [c.style.transform, c.style.filter]) : [];
      const paper = g.panels.filter(p => p.scene === scene).filter(p => {
        if (typeof doc.elementsFromPoint !== 'function') return true;
        const x = p.visibleRect.x - g.viewport.scrollX + p.visibleRect.width / 2, y = p.visibleRect.y - g.viewport.scrollY + p.visibleRect.height / 2;
        const top = doc.elementsFromPoint(x, y).map(el => el.closest('.cs-panel')).find(Boolean);
        return top?.querySelector('.cs-panel__alt')?.textContent === p.imageId;
      });
      const count = g.viewport.width !== undefined && g.viewport.height !== undefined ? visibleBoxCount(paper, { ...g.viewport, width: g.viewport.width, height: g.viewport.height }) : undefined;
      samples.push({ label: stop.label, beat: stop.beat, panel: selected, balloons: g.balloons.filter(b => b.panelId === selected?.id).map(b => ({ ...b, captionAnchor: wrappers[b.balloonIndex]?.getAttribute('data-caption-anchor') ?? '' })), loaded: r.status().loaded,
        visibleBoxes: count,
        sourceError: node?.getAttribute('data-view-error') || node?.getAttribute('data-static-art-error') || '', layerState: node?.getAttribute('data-view-mode') ?? '',
        motionSignature: JSON.stringify({ transform: selected?.activeArt?.transform, planes: selected?.activeArt?.planes?.map(p => [p.transform, p.opacity]), artEffects, bands }) });
    }
  } finally { if (entry.current()) r.seek(previous); }
  return checkBoxSamples({ key, mode: r.status().still ? 'reduced' : r.status().mode ?? 'desktop', panel, pageBoxCount, score: sc.score, room: sc.room, bpm: story.bpm, endLocalBeat: end - sc.b, durationSeconds: (end - start) * 60 / story.bpm, fullyReadBeat: full, fadeBeat: fade, samples });
}

export function ReaderStage(p: ReaderStageProps) {
  const available = useReaderAvailable();
  const [slug, setSlug] = useState('');
  // The frame on screen and where it is cropped. A new frame (play, still, a new box, changed art) loads hidden behind it
  // and replaces it only once framed, so the stage never blanks between them (Matt, 2026-10-11: the box flickered).
  const [shown, setShown] = useState<{ src: string; scene: string; box: FrameBox } | null>(null);
  const [error, setError] = useState('');
  const host = useRef<HTMLDivElement>(null);
  const frames = useRef(new Map<string, HTMLIFrameElement>());
  const [width, setWidth] = useState(0);
  const [previewMode, setPreviewMode] = useState<ReaderPreviewMode>('desktop');
  const preview = readerViewport(previewMode);
  const ended = useRef(p.onEnded);
  ended.current = p.onEnded;

  useEffect(() => void slugOf(p.issue).then(setSlug), [p.issue]);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, [available]);

  // Play starts one beat early so the warmed-up reader crosses the box's reveal and fires its effects on time
  // (starting exactly on the reveal beat skipped a delay-0 effect); the still view starts on the box itself.
  const beat = Math.max(0, p.at - (p.playing ? 1 : 0.01));
  const src = slug ? proxied(`/comics/${slug}/?scene=${encodeURIComponent(p.scene)}&beat=${beat}${p.playing ? '' : '&hold&mute'}${preview.query}&studioFrame=1&v=${encodeURIComponent(p.version)}`) + `#studio-${previewMode}` : '';
  const want = useRef(src);
  want.current = src;

  /** Once the reader is up: (still) seek to the fully-lettered beat; read the box and balloon rectangles; (play) watch for the box's end. */
  const settle = useCallback(
    async (mine: string) => {
      const el = frames.current.get(mine);
      const win = el?.contentWindow as (Window & { MTWComicStory?: ReaderApi }) | null;
      const current = (): boolean => want.current === mine && !!el?.isConnected;
      // Deadlines in real time, not tick counts: a background tab runs timers about once a second.
      let r: ReaderApi | undefined;
      const t0 = performance.now();
      while (!(r = win?.MTWComicStory) && performance.now() - t0 < 10000) await wait(100);
      if (!current()) return;
      if (!r) return setError('The reader did not start in the frame.');
      const t1 = performance.now();
      while (!r.status().loaded && performance.now() - t1 < 3000) await wait(100);
      const B = 60 / (p.bpm > 0 ? p.bpm : 90);
      const sceneB = r.status().beat - beat;
      if (!p.playing) {
        const list = r.reviewFrames(p.scene)?.frames ?? [];
        // A box: the moment it is fully lettered. A scene: its last frame, with every box shown.
        const f = p.img ? list.find((x) => x.panelImageIds.includes(p.img)) : list[list.length - 1];
        if (f) r.seek((f.fullyVisibleBeat ?? f.beat) * B);
        const deadline = performance.now() + 6000;
        while (!r.status().loaded && performance.now() < deadline) await wait(80);
        await wait(32);
      }
      if (!current()) return;
      const g = r.geometry();
      const at = (q: Rect): Rect => ({ x: q.x - g.viewport.scrollX, y: q.y - g.viewport.scrollY, width: q.width, height: q.height });
      if (!p.img) {
        const own = g.panels.filter((x) => x.scene === p.scene && x.imageId && x.visibleRect.width > 0 && x.visibleRect.height > 0);
        if (!own.length) return setError(`The reader shows no boxes for scene ${p.scene}.`);
        // The page's outer margin matches its gutters, as the comic frames it (Matt, 2026-10-11: the outer edge was cropped flush).
        const m = gutter(own.map((x) => x.visibleRect));
        const x0 = Math.min(...own.map((x) => x.visibleRect.x)) - m, y0 = Math.min(...own.map((x) => x.visibleRect.y)) - m;
        const x1 = Math.max(...own.map((x) => x.visibleRect.x + x.visibleRect.width)) + m, y1 = Math.max(...own.map((x) => x.visibleRect.y + x.visibleRect.height)) + m;
        setShown({ src: mine, scene: p.scene, box: { rect: at({ x: x0, y: y0, width: x1 - x0, height: y1 - y0 }), balloons: [], panels: own.map((x) => ({ imageId: x.imageId as string, rect: at(x.visibleRect) })) } });
        setError('');
        return;
      }
      const panel = g.panels.find((x) => x.scene === p.scene && x.imageId === p.img);
      if (!panel) return setError(`The reader has no box ${p.scene}/${p.img}.`);
      if (el?.contentDocument && win) reviewReaders.set(`${p.issue}/${p.scene}/${p.img}`, { api: r, document: el.contentDocument, current });
      setShown({ src: mine, scene: p.scene, box: { rect: at(panel.visibleRect), balloons: g.balloons.filter((b) => b.panelId === panel.id).map((b) => ({ index: b.balloonIndex, rect: at(b.visibleRect) })), panels: [] } });
      setError('');
      if (p.playing) {
        const end = sceneB + p.at + p.length;
        const api2 = r;
        const doc = el?.contentDocument;
        const pause = (): void => (doc?.querySelector('[data-motion-toolbar] .rl-pause, .cs-pause') as HTMLButtonElement | null)?.click();
        window.clearInterval(watch.current);
        const timer = window.setInterval(() => {
          try {
            const st = api2.status();
            // The reader pauses itself when its page is mostly out of view, and Studio's crop looks out of view to it.
            // Until the proxy's frame shim is live (a Studio restart), resume through the reader's own pause button.
            if (st.state === 'paused' && st.beat < end - 0.02) pause();
            if (st.beat >= end - 0.02) {
              window.clearInterval(timer);
              // It stays on screen while the next frame loads: stop it here so the next box's sound does not start.
              if (st.state !== 'paused') pause();
              ended.current();
            }
          } catch {
            window.clearInterval(timer);
          }
        }, 50);
        watch.current = timer;
      }
    },
    [p.issue, p.playing, p.scene, p.img, p.at, p.length, p.bpm, beat],
  );
  const watch = useRef(0);
  useEffect(() => () => window.clearInterval(watch.current), []);
  useEffect(() => () => { reviewReaders.delete(`${p.issue}/${p.scene}/${p.img}`); }, [p.issue, p.scene, p.img]);

  if (available === false) return <>{p.fallback}</>;
  if (available === null) return <div class="rs" style={{ height: '40vh' }}><p class="rs-wait small muted">Checking the comic preview…</p></div>;
  // A whole-page stage keeps the old scene's frame only for the same scene: a newly chosen scene takes the reader a few
  // seconds to open, and the old scene's picture under the new scene's name read as the click doing nothing (Matt, 2026-10-13).
  const stale = shown !== null && ((!p.img && shown.scene !== p.scene) || shown.src.split('#')[1] !== `studio-${previewMode}`);
  const box = stale ? null : (shown?.box ?? null);
  const s = box && width ? width / box.rect.width : 0;
  // The shown frame, then the wanted one loading hidden behind it (the same element once it is shown).
  const live = [...new Set([shown?.src, src].filter(Boolean) as string[])];
  return (
    <>
    <div class="row" role="group" aria-label="Reader preview layout">
      {(['desktop', 'phone', 'phone-small', 'reduced'] as const).map(mode => <button type="button" class="chip" aria-pressed={previewMode === mode} disabled={p.playing} title={mode === 'phone-small' ? 'Runs the actual reader at360×500; tests sample this short phone frame.' : mode === 'phone' ? 'Runs the actual reader at390×720; tests sample this phone frame.' : mode === 'reduced' ? 'Uses the reader’s supported reel=off static mode at desktop size.' : 'Runs the actual reader at1664×919; OS reduced-motion preferences remain respected.'} onClick={() => setPreviewMode(mode)}>{mode === 'desktop' ? 'Desktop' : mode === 'phone' ? 'Phone' : mode === 'phone-small' ? 'Small phone' : 'Reduced motion'}</button>)}
    </div>
    <div class="rs" ref={host} style={{ height: box && s ? `${box.rect.height * s}px` : stale && host.current ? `${host.current.clientHeight}px` : '40vh' }}>
      {live.map((u) => {
        const on = !stale && u === shown?.src;
        const size = readerViewport(u.endsWith('#studio-phone') ? 'phone' : 'desktop');
        return (
          <iframe
            key={u}
            ref={(el) => {
              if (el) frames.current.set(u, el);
              else frames.current.delete(u);
            }}
            class={`rs-frame${on ? '' : ' is-loading'}`}
            title={on ? 'This box in the comic reader' : 'The comic reader, loading'}
            aria-hidden={on ? undefined : 'true'}
            src={u}
            allow="autoplay"
            tabIndex={-1}
            style={{ width: `${size.width}px`, height: `${size.height}px`, transform: on && box && s ? `scale(${s}) translate(${-box.rect.x}px, ${-box.rect.y}px)` : 'scale(0.0001)' }}
            onLoad={() => void settle(u)}
          />
        );
      })}
      {box && s
        ? box.balloons.map((b) => (
            <button
              key={b.index}
              type="button"
              class={`rs-balloon${p.currentIndex === b.index ? ' is-current' : ''}`}
              style={{ left: `${(b.rect.x - box.rect.x) * s}px`, top: `${(b.rect.y - box.rect.y) * s}px`, width: `${b.rect.width * s}px`, height: `${b.rect.height * s}px` }}
              title="Opens this balloon's words for editing. Nothing is saved until you press Save in the window that opens."
              aria-label={`Edit the words of balloon ${b.index + 1}`}
              onClick={() => p.onBalloon(b.index)}
            />
          ))
        : null}
      {box && s
        ? box.panels.map((b) => (
            <button
              key={b.imageId}
              type="button"
              class="rs-panel"
              style={{ left: `${(b.rect.x - box.rect.x) * s}px`, top: `${(b.rect.y - box.rect.y) * s}px`, width: `${b.rect.width * s}px`, height: `${b.rect.height * s}px` }}
              title="Opens this box in the review so you can check its picture, words and sound. Nothing is changed by opening it."
              aria-label={`Review box ${b.imageId}`}
              onClick={() => p.onPanel?.(b.imageId)}
            />
          ))
        : null}
      {!box && !error && <p class="rs-wait small muted" role="status">{stale ? `Opening ${p.scene} in the comic reader…` : 'Opening the comic reader…'}</p>}
      {error && <p class="rs-wait error small">{error}</p>}
    </div>
    </>
  );
}
