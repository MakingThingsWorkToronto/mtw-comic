import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DEFAULT_CAST, diffPatch, dragMove, dragWidth, fractionsToRect, newBalloon, rectToFractions, subjectOf, tailFromPoint, tailToPoint, threeWay, validateBalloon, wordGuidance } from '../modules/comics/editor/model';
import type { BalloonData, EditOp, PxRect } from '../modules/comics/editor/model';
import { forwardToSite, proxied, rewriteCss, rewriteHtml } from '../modules/comics/editor/proxy';
import { parseCast, parseIssueIndex, portOpen, registerEditor, siteQuery } from '../modules/comics/editor/server';
import { ShapeError, OpError, applyOps, changedLines, generatedHeaderWarning, parseStory, sha256, storyModel } from '../modules/comics/editor/storyFile';
import type { ServerModule } from '../modules/types';
import { startModules } from './module-harness';
import type { ModuleHarness } from './module-harness';

const appRoot = fileURLToPath(new URL('..', import.meta.url));
const repoRoot = path.resolve(appRoot, '..', '..');
const storyDir = path.join(repoRoot, 'site', 'src', 'data', 'comic-stories');
// A frozen copy of a one-balloon-per-line story (traditional.ts at 9f068505, 2026-10-09): the live file has since been
// rebuilt as a retime({...}) JSON literal, and the line strategy must stay covered whatever the comics become.
const traditional = readFileSync(path.join(appRoot, 'tests', 'fixtures', 'comics', 'traditional-line-form.ts'), 'utf8');
// A frozen copy of a retime({...}) JSON-literal story (home.ts as of 2026-10-10), so owner reformatting never breaks the strategy tests.
const homeFixturePath = path.join(appRoot, 'tests', 'fixtures', 'comics', 'home-json-literal.ts');

const SCENE = 'locked';
const IMG = 'trad-invoices';

describe('line patch round trip', () => {
  it('finds scenes, panels and one balloon per line', () => {
    const model = storyModel(traditional, 'traditional', 'traditional-systems');
    const total = model.scenes.reduce((n, s) => n + s.panels.reduce((m, p) => m + p.balloons.length, 0), 0);
    expect(total).toBe(65); // the frozen fixture's count
    const p = model.scenes.find((s) => s.id === SCENE)?.panels.find((x) => x.img === IMG);
    expect(p?.balloons).toHaveLength(2);
    expect(p?.balloons[1]?.who).toBe('dana');
  });

  it('changes only the edited balloon line, byte for byte', () => {
    const op: EditOp = { op: 'edit', scene: SCENE, img: IMG, index: 1, patch: { text: 'The client paid twice.\nI cannot leave this.' } };
    const out = applyOps(traditional, [op]);
    const lines = changedLines(traditional, out.text);
    expect(lines).toHaveLength(1);
    const before = traditional.split('\n')[lines[0] as number] as string;
    const after = out.text.split('\n')[lines[0] as number] as string;
    expect(after.startsWith(before.slice(0, before.indexOf('"text"')))).toBe(true);
    expect(after.endsWith(',')).toBe(true);
    expect(JSON.parse(after.trim().replace(/,$/, '')).text).toBe('The client paid twice.\nI cannot leave this.');
    // Every other line is the identical string, so the rest of the file is byte-identical.
    expect(out.text.split('\n').filter((_, i) => i !== lines[0]).join('\n')).toBe(traditional.split('\n').filter((_, i) => i !== lines[0]).join('\n'));
    expect(out.changes[0]?.action).toBe('edit-balloon');
    expect(out.changes[0]?.old?.text).toBe("The client paid twice.\nI can't leave this.");
  });

  it('a no-op edit rewrites the line identically for canonical lines and keeps timing keys', () => {
    const out = applyOps(traditional, [{ op: 'edit', scene: SCENE, img: IMG, index: 0, patch: { x: 0.03 } }]);
    const line = out.text.split('\n')[changedLines(traditional, out.text)[0] as number] as string;
    const o = JSON.parse(line.trim().replace(/,$/, '')) as BalloonData;
    expect(o.x).toBe(0.03);
    expect(o.at).toBe(17.5);
  });

  it('keeps CRLF line endings', () => {
    const crlf = traditional.replace(/\n/g, '\r\n');
    const out = applyOps(crlf, [{ op: 'edit', scene: SCENE, img: IMG, index: 0, patch: { text: 'Twelve invoices\nbilled twice.' } }]);
    expect(out.text.includes('\r\n')).toBe(true);
    expect(out.text.replace(/\r\n/g, '\n')).toBe(applyOps(traditional, [{ op: 'edit', scene: SCENE, img: IMG, index: 0, patch: { text: 'Twelve invoices\nbilled twice.' } }]).text);
  });

  it('removes a key when the patch value is null and validates the result', () => {
    const out = applyOps(traditional, [{ op: 'edit', scene: SCENE, img: IMG, index: 1, patch: { tail: null } }]);
    expect(storyModel(out.text, 't', 't').scenes.find((s) => s.id === SCENE)?.panels.find((p) => p.img === IMG)?.balloons[1]?.tail).toBeUndefined();
    expect(() => applyOps(traditional, [{ op: 'edit', scene: SCENE, img: IMG, index: 1, patch: { x: 4 } }])).toThrow(OpError);
    expect(() => applyOps(traditional, [{ op: 'edit', scene: SCENE, img: IMG, index: 1, patch: { who: 'nobody' } }])).toThrow(/cast/);
  });
});

describe('timing is never edited', () => {
  it('refuses at, b, l and speech in a patch', () => {
    for (const k of ['at', 'b', 'l', 'speech']) {
      expect(() => applyOps(traditional, [{ op: 'edit', scene: SCENE, img: IMG, index: 0, patch: { [k]: 3 } }])).toThrow(/never edited/);
    }
  });
  it('inserted balloons take a placeholder at from the neighbour, never b or l', () => {
    expect(() => applyOps(traditional, [{ op: 'insert', scene: SCENE, img: IMG, after: 0, balloon: { ...newBalloon(), l: 4 } as BalloonData }])).toThrow(/never written/);
    const out = applyOps(traditional, [{ op: 'insert', scene: SCENE, img: IMG, after: 0, balloon: newBalloon() }]);
    expect(out.changes[0]?.new?.at).toBe(17.5);
  });
});

describe('refusal on unexpected shapes', () => {
  it('refuses the demo (single-quoted JS literals)', () => {
    const demo = readFileSync(path.join(storyDir, 'demo.ts'), 'utf8');
    expect(() => parseStory(demo)).toThrow(ShapeError);
  });
  it('refuses a balloon line that is not strict JSON', () => {
    const bad = traditional.replace('{"at":17.5,"kind":"caption"', "{at:17.5,\"kind\":\"caption\"");
    expect(() => parseStory(bad)).toThrow(/strict JSON/);
  });
  it('refuses a file with no scenes and an unknown panel', () => {
    expect(() => parseStory('export const x = 1;\n')).toThrow(ShapeError);
    expect(() => applyOps(traditional, [{ op: 'edit', scene: SCENE, img: 'nope', index: 0, patch: {} }])).toThrow(/no panel/);
    expect(() => applyOps(traditional, [{ op: 'edit', scene: SCENE, img: IMG, index: 9, patch: {} }])).toThrow(/no balloon/);
  });
});

describe('insert and delete index handling', () => {
  const balloons = (text: string) => storyModel(text, 't', 't').scenes.find((s) => s.id === SCENE)?.panels.find((p) => p.img === IMG)?.balloons.map((b) => b.text) ?? [];
  it('inserts after, at the start (-1) and at the end, renumbering later balloons', () => {
    const base = balloons(traditional);
    const mid = applyOps(traditional, [{ op: 'insert', scene: SCENE, img: IMG, after: 0, balloon: { ...newBalloon(), text: 'MID' } }]);
    expect(balloons(mid.text)).toEqual([base[0], 'MID', base[1]]);
    expect(mid.changes[0]?.index).toBe(1);
    expect(subjectOf('traditional', { scene: SCENE, img: IMG, index: mid.changes[0]?.index ?? 0 })).toBe(`traditional-${SCENE}-${IMG}-b2`);
    const first = applyOps(traditional, [{ op: 'insert', scene: SCENE, img: IMG, after: -1, balloon: { ...newBalloon(), text: 'FIRST' } }]);
    expect(balloons(first.text)).toEqual(['FIRST', base[0], base[1]]);
    const last = applyOps(traditional, [{ op: 'insert', scene: SCENE, img: IMG, after: 1, balloon: { ...newBalloon(), text: 'LAST' } }]);
    expect(balloons(last.text)).toEqual([base[0], base[1], 'LAST']);
    expect(changedLines(traditional, last.text).length).toBeGreaterThan(0);
    expect(last.text.split('\n').length).toBe(traditional.split('\n').length + 1);
    expect(() => applyOps(traditional, [{ op: 'insert', scene: SCENE, img: IMG, after: 2, balloon: newBalloon() }])).toThrow(/cannot insert/);
  });
  it('deletes by index and applies a sequence in order', () => {
    const base = balloons(traditional);
    const del = applyOps(traditional, [{ op: 'delete', scene: SCENE, img: IMG, index: 0 }]);
    expect(balloons(del.text)).toEqual([base[1]]);
    expect(del.text.split('\n').length).toBe(traditional.split('\n').length - 1);
    const seq = applyOps(traditional, [
      { op: 'insert', scene: SCENE, img: IMG, after: 1, balloon: { ...newBalloon(), text: 'C' } },
      { op: 'delete', scene: SCENE, img: IMG, index: 0 },
      { op: 'edit', scene: SCENE, img: IMG, index: 1, patch: { text: 'C2' } },
    ]);
    expect(balloons(seq.text)).toEqual([base[1], 'C2']);
    // Round trip: inserting then deleting the same balloon restores the file byte for byte.
    const inserted = applyOps(traditional, [{ op: 'insert', scene: SCENE, img: IMG, after: 0, balloon: newBalloon() }]);
    expect(applyOps(inserted.text, [{ op: 'delete', scene: SCENE, img: IMG, index: 1 }]).text).toBe(traditional);
  });
});

describe('px and panel-fraction math', () => {
  const panel: PxRect = { x: 100, y: 50, width: 800, height: 400 };
  it('round trips fractions through pixels', () => {
    const r = fractionsToRect(panel, { x: 0.25, y: 0.1, w: 0.5 }, 60);
    expect(r).toEqual({ x: 300, y: 90, width: 400, height: 60 });
    expect(rectToFractions(panel, r)).toEqual({ x: 0.25, y: 0.1, w: 0.5 });
  });
  it('drags by pixel deltas into 3-decimal fractions and clamps', () => {
    expect(dragMove(panel, { x: 0.25, y: 0.1 }, 80, -20)).toEqual({ x: 0.35, y: 0.05 });
    expect(dragMove(panel, { x: 0.9, y: 0.9 }, 800, 400)).toEqual({ x: 1, y: 1 });
    expect(dragMove(panel, { x: 0.9, y: 0.9 }, 800, 400, true)).toEqual({ x: 1.3, y: 1.3 });
    expect(dragMove(panel, { x: 0.1, y: 0.1 }, 1, 1)).toEqual({ x: 0.101, y: 0.103 });
  });
  it('resizes the width inside the panel and moves the tail', () => {
    expect(dragWidth(panel, 0.3, 80, 0.2)).toBe(0.4);
    expect(dragWidth(panel, 0.3, 4000, 0.2)).toBe(0.8);
    expect(dragWidth(panel, 0.3, -4000, 0.2)).toBe(0.05);
    expect(tailFromPoint(panel, 500, 250)).toEqual([0.5, 0.5]);
    expect(tailToPoint(panel, [0.5, 0.5])).toEqual({ x: 500, y: 250 });
  });
});

describe('validation, merge and guidance', () => {
  it('validates fields', () => {
    expect(validateBalloon({ ...newBalloon() }, DEFAULT_CAST)).toEqual([]);
    expect(validateBalloon({ ...newBalloon(), kind: 'machine' }).join()).toMatch(/kind/);
    expect(validateBalloon({ ...newBalloon(), em: 'absent' }).join()).toMatch(/em must appear/);
    expect(validateBalloon({ ...newBalloon(), tail: [1] }).join()).toMatch(/tail/);
  });
  it('warns beyond about 12 words', () => {
    expect(wordGuidance('one two three')).toBeNull();
    expect(wordGuidance('a b c d e f g h i j k l m n o p')).toMatch(/16 words/);
  });
  it('three-way merges by field and flags overlaps', () => {
    const base = { text: 'a', x: 0.1, y: 0.1 };
    const mine = { text: 'b', x: 0.1, y: 0.1 };
    const theirs = { text: 'a', x: 0.5, y: 0.1 };
    expect(threeWay(base, mine, theirs)).toEqual({ merged: { text: 'b', x: 0.5, y: 0.1 }, conflicts: [] });
    const clash = threeWay(base, mine, { ...theirs, text: 'c' });
    expect(clash.conflicts).toEqual([{ field: 'text', base: 'a', mine: 'b', theirs: 'c' }]);
    expect(diffPatch(base, { ...mine, y: undefined as unknown as number })).toEqual({ text: 'b', y: null });
  });
  it('parses the issue index and cast', () => {
    const index = readFileSync(path.join(storyDir, 'index.ts'), 'utf8');
    expect(parseIssueIndex(index).map((i) => `${i.id}:${i.slug}`)).toEqual(['home:home', 'agentic:agentic-systems', 'traditional:traditional-systems', 'data-migrations:data-migrations']);
    const cast = parseCast(readFileSync(path.join(storyDir, 'types.ts'), 'utf8'));
    expect(cast).toContain('narrator');
    expect(cast).toContain('dana');
  });
});

describe('site proxy', () => {
  let site: http.Server;
  let base = '';
  beforeAll(async () => {
    site = http.createServer((req, res) => {
      if (req.url?.startsWith('/comics/x/')) {
        res.writeHead(200, { 'content-type': 'text/html' });
        return void res.end('<html><head><title>x</title></head><body><script src="/scripts/comic-story.js"></script><a href="//other.example/x">y</a></body></html>');
      }
      if (req.url?.startsWith('/styles/reader.css')) { res.writeHead(200, { 'content-type': 'text/css' }); return void res.end('@font-face{src:url("/fonts/kalam.woff2")}body{background:url(../comic/paper.webp)}'); }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ url: req.url }));
    });
    await new Promise<void>((r) => site.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(site.address() as { port: number }).port}`;
  });
  afterAll(() => void site.close());

  it('drops the site dev reload client (it broke inside Studio frames) and marks only Studio review frames as fully in view', () => {
    const out = rewriteHtml('<head><script type="module" src="/@vite/client"></script><script src="/scripts/comic-story.js"></script></head>');
    expect(out).not.toContain('@vite');
    expect(out).toContain(proxied('/scripts/comic-story.js').replace(/&/g, '&amp;'));
    expect(out).toContain('studioFrame=1');
  });
  it('rewrites root-relative URLs and keeps the query for the reader', async () => {
    expect(proxied('/comics/x/?scene=a&hold')).toBe('/api/comics/editor/site?u=%2Fcomics%2Fx%2F&scene=a&hold');
    const html = rewriteHtml('<head></head><img src="/comic/a.svg"><a href="//other/x">');
    expect(html).toContain('src="/api/comics/editor/site?u=%2Fcomic%2Fa.svg"');
    expect(html).toContain('href="//other/x"');
    const r = await forwardToSite(base, '/comics/x/', 'scene=a&hold');
    expect(r.status).toBe(200);
    expect(String(r.body)).toContain('u=%2Fscripts%2Fcomic-story.js');
    const j = await forwardToSite(base, '/data.json', 'v=1');
    expect(JSON.parse(String(Buffer.from(j.body as Uint8Array)))).toEqual({ url: '/data.json?v=1' });
  });
  it('refuses paths that would leave the site and reports an unreachable dev server', async () => {
    expect((await forwardToSite(base, '//evil.example/x', '')).status).toBe(400);
    expect((await forwardToSite(base, 'http://evil.example/', '')).status).toBe(400);
    const down = await forwardToSite('http://127.0.0.1:9', '/x', '');
    expect(down.status).toBe(502);
  });
  it('rewrites only owned comic playback resources, preserving prose, authority and other JSON', () => {
    const authority = { path: 'wiki/image-library/assets/native.png', src: '/comic/authority-do-not-request.png', nativePath: 'C:/native.png' };
    const story = { art: '/comic/home/legacy-base', text: "Written /comic/plain.png and <img src='/comic/written.png'> stay unchanged.", panels: [{ staticArt: { src: '/comic/home/static.avif?v=2', alternates: ['/comic/home/static.webp', 'https://other.example/image.png'], canonicalSource: authority }, views: [{ src: '/comic/home/base.png', layers: [{ src: '/comic/home/agent.png', canonicalSource: authority }] }], balloons: [{ text: '/comic/dialogue.png', speech: { src: '/speech/voice.mp3' } }] }] };
    const config = { page: { paperTile: '/comic/_paper/tile.webp', paperGrain: { light: '/comic/_paper/light.webp', dark: '/comic/_paper/dark.webp' } } };
    const other = '<script id="unrelated" type="application/json">{"src":"/untouched.png"}</script>';
    const html = rewriteHtml(`<head></head><script type="application/json" id="comic-story">${JSON.stringify(story)}</script><script id="comic-config" type="application/json">${JSON.stringify(config)}</script>${other}`);
    const read = (id: string) => JSON.parse(html.match(new RegExp(`<script[^>]*id="${id}"[^>]*>([\\s\\S]*?)<\\/script>`))?.[1] ?? '{}');
    const data = read('comic-story');
    expect(data.art).toBe(story.art); expect(data.text).toBe(story.text);
    expect(data.panels[0].staticArt.src).toBe(proxied('/comic/home/static.avif?v=2'));
    expect(data.panels[0].staticArt.alternates).toEqual([proxied('/comic/home/static.webp'), 'https://other.example/image.png']);
    expect(data.panels[0].staticArt.canonicalSource).toEqual(authority);
    expect(data.panels[0].views[0].layers[0].src).toBe(proxied('/comic/home/agent.png'));
    expect(data.panels[0].balloons[0]).toEqual({ text: '/comic/dialogue.png', speech: { src: proxied('/speech/voice.mp3') } });
    expect(read('comic-config').page.paperTile).toBe(proxied(config.page.paperTile));
    expect(read('comic-config').page.paperGrain.light).toBe(proxied(config.page.paperGrain.light)); expect(html).toContain(other);
  });
  it('routes dynamically constructed absolute image, srcset, media, fetch and XHR requests once', () => {
    class Element { tagName = 'IMG'; attrs: Record<string, unknown> = {}; setAttribute(key: string, value: unknown) { this.attrs[key] = value; } }
    class Image extends Element { _src = ''; _srcset = ''; get src() { return this._src; } set src(value: string) { this._src = value; } get srcset() { return this._srcset; } set srcset(value: string) { this._srcset = value; } }
    class Source extends Image { tagName = 'SOURCE'; }
    class Media extends Image { tagName = 'AUDIO'; }
    class XHR { url: unknown; open(_method: string, url: unknown) { this.url = url; } }
    const sent: unknown[] = [], origin = 'http://127.0.0.1:8788', document = { baseURI: origin + '/api/comics/editor/site?u=%2Fcomics%2Fhome%2F' };
    class Request { url: string; constructor(url: string, _init?: unknown) { this.url = new URL(url, document.baseURI).href; } }
    const window = { HTMLImageElement: Image, HTMLSourceElement: Source, HTMLMediaElement: Media, fetch: (value: unknown) => { sent.push(value); } };
    const ctx = { window, document, location: { origin }, URL, Request, XMLHttpRequest: XHR, Element };
    const script = rewriteHtml('<head></head>').match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? '';
    vm.runInNewContext(script, ctx);
    const image = new Image(); image.src = new URL('/comic/home/source-native.png', document.baseURI).href;
    expect(image.src).toBe(proxied('/comic/home/source-native.png'));
    image.srcset = `${origin}/comic/home/legacy-base-1600.webp 1600w, /comic/home/legacy-base-2400.webp 2400w`;
    expect(image.srcset).toBe(`${proxied('/comic/home/legacy-base-1600.webp')} 1600w, ${proxied('/comic/home/legacy-base-2400.webp')} 2400w`);
    image.setAttribute('src', '/comic/home/plane.png'); expect(image.attrs.src).toBe(proxied('/comic/home/plane.png'));
    const media = new Media(); media.src = origin + '/speech/voice.wav?v=3'; expect(media.src).toBe(proxied('/speech/voice.wav?v=3'));
    window.fetch(new URL('/comic/home/frame.svg', document.baseURI)); window.fetch(new Request(origin + '/speech/voice.mp3'));
    expect(sent[0]).toBe(proxied('/comic/home/frame.svg')); expect((sent[1] as Request).url).toBe(origin + proxied('/speech/voice.mp3'));
    const xhr = new XHR(); xhr.open('GET', origin + '/comic/home/base.png'); expect(xhr.url).toBe(proxied('/comic/home/base.png'));
    image.src = origin + proxied('/comic/home/already.png'); expect(image.src).toBe(origin + proxied('/comic/home/already.png'));
    image.src = 'https://other.example/native.png'; expect(image.src).toBe('https://other.example/native.png');
    image.srcset = 'data:image/png;base64,/abc 1x'; expect(image.srcset).toBe('data:image/png;base64,/abc 1x');
  });
  it('rewrites actual forwarded CSS font/relative resources and each HTML srcset candidate', async () => {
    const response = await forwardToSite(base, '/styles/reader.css', '');
    expect(String(response.body)).toContain(proxied('/fonts/kalam.woff2')); expect(String(response.body)).toContain(proxied('/comic/paper.webp'));
    expect(rewriteCss('a{background:url(data:image/png;base64,abc)}b{background:url(https://other/x)}')).toBe('a{background:url(data:image/png;base64,abc)}b{background:url(https://other/x)}');
    expect(rewriteHtml('<img srcset="/comic/a.webp 1600w, /comic/b.webp 2400w">')).toContain(`srcset="${proxied('/comic/a.webp')} 1600w, ${proxied('/comic/b.webp')} 2400w"`);
  });
});

describe('save route: compare-and-swap, leases and decisions', () => {
  let tmp = '';
  let h: ModuleHarness;
  const file = () => path.join(tmp, 'site', 'src', 'data', 'comic-stories', 'traditional.ts');
  beforeAll(async () => {
    tmp = mkdtempSync(path.join(os.tmpdir(), 'mtw-editor-'));
    mkdirSync(path.join(tmp, 'site', 'src', 'data', 'comic-stories'), { recursive: true });
    mkdirSync(path.join(tmp, 'wiki', 'operations'), { recursive: true });
    mkdirSync(path.join(tmp, 'wiki', 'comics-library'), { recursive: true });
    for (const f of ['index.ts', 'types.ts']) writeFileSync(path.join(tmp, 'site', 'src', 'data', 'comic-stories', f), readFileSync(path.join(storyDir, f)));
    writeFileSync(file(), traditional);
    writeFileSync(path.join(tmp, 'wiki', 'comics-library', 'speech-approvals.json'), JSON.stringify({ schemaVersion: 1, textReviews: [{ id: 'r1', storySource: { path: 'site/src/data/comic-stories/traditional.ts' } }] }));
    const mod: ServerModule = { meta: { id: 'comics', title: 'Comics', nav: { label: 'Comics', order: 1 }, manifest: [] }, register: (router, services) => registerEditor(router, services) };
    h = await startModules(tmp, [mod]);
  });
  afterAll(async () => {
    await h.close();
    rmSync(tmp, { recursive: true, force: true });
  });

  const op = (text: string): EditOp => ({ op: 'edit', scene: SCENE, img: IMG, index: 1, patch: { text } });

  it('loads the model with the file hash, cast and stale approval count', async () => {
    const v = await h.get('/api/comics/editor/story/traditional-systems');
    expect(v.hash).toBe(sha256(traditional));
    expect(v.editable).toBe(true);
    expect(v.staleApprovals).toBe(1);
    expect(v.cast).toContain('dana');
    const cfg = await h.get('/api/comics/editor/config');
    expect(cfg.siteBaseUrl).toBe('http://127.0.0.1:8787');
  });

  it('saves one line, logs a decision and returns the new hash', async () => {
    const v = await h.get('/api/comics/editor/story/traditional');
    const res = await h.post(`/api/comics/editor/save/traditional`, { baseHash: v.hash, ops: [op('Twelve invoices.\nSame hours twice.')] });
    expect(res.status).toBe(200);
    expect(res.body.hash).not.toBe(v.hash);
    const written = readFileSync(file(), 'utf8');
    expect(changedLines(traditional, written)).toHaveLength(1);
    const log = readFileSync(path.join(tmp, 'wiki', 'comics-library', 'decisions.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ action: 'edit-balloon', subject: `traditional-${SCENE}-${IMG}-b2`, module: 'comics' });
    expect(log[0].value.old).toBe("The client paid twice.\nI can't leave this.");
    expect(log[0].value.new).toBe('Twelve invoices.\nSame hours twice.');
  });

  it('detects a conflict when the file changed on disk and writes nothing', async () => {
    const v = await h.get('/api/comics/editor/story/traditional');
    writeFileSync(file(), readFileSync(file(), 'utf8').replace('Toronto.', 'Toronto!'));
    const before = readFileSync(file(), 'utf8');
    const res = await h.post(`/api/comics/editor/save/traditional`, { baseHash: v.hash, ops: [op('Late edit.')] });
    expect(res.status).toBe(409);
    expect(readFileSync(file(), 'utf8')).toBe(before);
    const state = await h.get('/api/comics/editor/state/traditional');
    expect(state.hash).toBe(sha256(before));
    // Retrying with the fresh hash succeeds and keeps the other writer's change.
    const retry = await h.post(`/api/comics/editor/save/traditional`, { baseHash: state.hash, ops: [op('Late edit.')] });
    expect(retry.status).toBe(200);
    expect(readFileSync(file(), 'utf8')).toContain('Toronto!');
  });

  it('refuses a rejected op and a leased file', async () => {
    const v = await h.get('/api/comics/editor/story/traditional');
    const bad = await h.post(`/api/comics/editor/save/traditional`, { baseHash: v.hash, ops: [{ op: 'edit', scene: SCENE, img: IMG, index: 0, patch: { at: 9 } }] });
    expect(bad.status).toBe(400);
    writeFileSync(path.join(tmp, 'wiki', 'operations', 'leases.json'), JSON.stringify([{ path: 'site/src/data/comic-stories/*.ts', holder: 'codex-comics' }]));
    const view = await h.get('/api/comics/editor/story/traditional');
    expect(view.editable).toBe(false);
    expect(view.holder).toBe('codex-comics');
    const leased = await h.post(`/api/comics/editor/save/traditional`, { baseHash: view.hash, ops: [op('Nope.')] });
    expect(leased.status).toBe(423);
    rmSync(path.join(tmp, 'wiki', 'operations', 'leases.json'));
  });

  it('serves the demo read-only with the reason', async () => {
    writeFileSync(path.join(tmp, 'site', 'src', 'data', 'comic-stories', 'demo.ts'), readFileSync(path.join(storyDir, 'demo.ts')));
    const v = await h.get('/api/comics/editor/story/demo');
    expect(v.editable).toBe(false);
    expect(v.refusal).toBeTruthy();
    expect(v.model).toBeNull();
    const res = await h.post('/api/comics/editor/save/demo', { baseHash: v.hash, ops: [op('x')] });
    expect(res.status).toBe(422);
  });
});

describe('website preview start route', () => {
  let tmp = '';
  let h: ModuleHarness;
  const spawned: { title: string; runner: string; module?: string }[] = [];
  const written: { id: string; data: string }[] = [];
  const running: { id: string; title: string; status: 'running' }[] = [];
  beforeAll(async () => {
    tmp = mkdtempSync(path.join(os.tmpdir(), 'mtw-editor-site-'));
    mkdirSync(path.join(tmp, 'wiki', 'operations'), { recursive: true });
    writeFileSync(path.join(tmp, 'wiki', 'operations', 'editor.json'), JSON.stringify({ siteBaseUrl: 'http://127.0.0.1:9', siteStartCommand: 'npm run dev --prefix site' }));
    const terminals = {
      list: () => running,
      spawn: (o: { title: string; runner: string; module?: string }) => {
        spawned.push(o);
        running.push({ id: 't-1', title: o.title, status: 'running' });
        return { id: 't-1', ...o };
      },
      write: (id: string, data: string) => void written.push({ id, data }),
      kill: () => undefined,
    };
    const mod: ServerModule = { meta: { id: 'comics', title: 'Comics', nav: { label: 'Comics', order: 1 }, manifest: [] }, register: (router, services) => registerEditor(router, services) };
    h = await startModules(tmp, [mod], { terminals } as never);
  });
  afterAll(async () => {
    await h.close();
    rmSync(tmp, { recursive: true, force: true });
  });

  it('reports the site as down, spawns one shell terminal with the configured command and reuses it', async () => {
    expect((await h.get('/api/comics/editor/site/status')).up).toBe(false);
    const first = await h.post('/api/comics/editor/site/start', {});
    expect(first.body).toMatchObject({ up: false, terminal: 't-1', started: true });
    expect(spawned).toEqual([{ runner: 'shell', title: 'Website preview', module: 'comics' }]);
    expect(written).toEqual([{ id: 't-1', data: 'npm run dev --prefix site\r' }]);
    const again = await h.post('/api/comics/editor/site/start', {});
    expect(again.body).toMatchObject({ terminal: 't-1', started: false });
    expect(spawned).toHaveLength(1);
  });
});

describe('retime(...) JSON strategy (fixture of home.ts)', () => {
  const home = readFileSync(homeFixturePath, 'utf8');
  const eol = home.includes('\r\n') ? '\r\n' : '\n';
  const first = (t: string) => {
    const m = storyModel(t, 'home', 'home');
    const s = m.scenes.find((x) => x.panels.some((p) => p.balloons.length))!;
    const p = s.panels.find((x) => x.balloons.length)!;
    return { scene: s.id, img: p.img, balloons: p.balloons };
  };

  it('loads the model and a no-op save is byte identical', () => {
    const t = first(home);
    expect(t.balloons[0]?.text).toBeTruthy();
    const r = applyOps(home, []);
    expect(r.text).toBe(home);
    expect(r.changes).toHaveLength(0);
  });

  it('a text edit changes only that value and keeps header, tail and key order', () => {
    const t = first(home);
    const old = t.balloons[0]!.text;
    const r = applyOps(home, [{ op: 'edit', scene: t.scene, img: t.img, index: 0, patch: { text: 'Edited line.' } }]);
    expect(r.text.startsWith(home.slice(0, home.indexOf('retime(')))).toBe(true);
    expect(r.text.endsWith(home.slice(home.lastIndexOf('}') + 1))).toBe(true);
    const a = home.split(eol), b = r.text.split(eol);
    expect(b).toHaveLength(a.length);
    const diff = a.map((l, i) => (l === b[i] ? -1 : i)).filter((i) => i >= 0);
    expect(diff).toHaveLength(1);
    expect(a[diff[0]!]).toContain(JSON.stringify(old).slice(1, -1));
    expect(b[diff[0]!]).toContain('Edited line.');
    expect(r.changes[0]?.action).toBe('edit-balloon');
    expect(() => applyOps(home, [{ op: 'edit', scene: t.scene, img: t.img, index: 0, patch: { at: 3 } }])).toThrow(/never edited/);
  });

  it('inserts and deletes a balloon and returns to the original', () => {
    const t = first(home);
    const n = t.balloons.length;
    const ins = applyOps(home, [{ op: 'insert', scene: t.scene, img: t.img, after: n - 1, balloon: { ...newBalloon(), text: 'A new box.' } }]);
    expect(first(ins.text).balloons).toHaveLength(n + 1);
    expect(first(ins.text).balloons[n]?.text).toBe('A new box.');
    if (eol === '\r\n') {
      expect(ins.text).toContain('\r\n');
      expect(ins.text).not.toMatch(/[^\r]\n/);
    } else expect(ins.text).not.toContain('\r');
    const del = applyOps(ins.text, [{ op: 'delete', scene: t.scene, img: t.img, index: n }]);
    expect(del.text).toBe(home);
  });

  it('refuses when the formatting cannot be reproduced', () => {
    const odd = home.replace('"id": "home"', '"id":  "home"');
    expect(odd).not.toBe(home);
    expect(() => storyModel(odd, 'home', 'home')).toThrow(/cannot be reproduced/);
    expect(() => applyOps(odd, [])).toThrow(ShapeError);
    const mixed = eol === '\r\n' ? home.replace('\r\n  "issue"', '\n  "issue"') : home.replace('\n  "issue"', '\r\n  "issue"');
    expect(mixed).not.toBe(home);
    expect(() => applyOps(mixed, [])).toThrow(ShapeError);
  });

  it('warns from the generated header only', () => {
    expect(generatedHeaderWarning(home)).toMatch(/overwrite manual edits/);
    expect(generatedHeaderWarning(traditional)).toBeNull();
  });
});

describe('live home.ts (owner formatting may change)', () => {
  it('either round-trips byte-identically or refuses with a reason', () => {
    const live = readFileSync(path.join(storyDir, 'home.ts'), 'utf8');
    try {
      expect(applyOps(live, []).text).toBe(live);
    } catch (e) {
      expect(e).toBeInstanceOf(ShapeError);
      expect((e as Error).message.length).toBeGreaterThan(10);
    }
  });
});

describe('retime(...) save route', () => {
  let tmp = '';
  let h: ModuleHarness;
  const dir = () => path.join(tmp, 'site', 'src', 'data', 'comic-stories');
  beforeAll(async () => {
    tmp = mkdtempSync(path.join(os.tmpdir(), 'mtw-editor-home-'));
    mkdirSync(dir(), { recursive: true });
    mkdirSync(path.join(tmp, 'wiki', 'operations'), { recursive: true });
    mkdirSync(path.join(tmp, 'wiki', 'comics-library'), { recursive: true });
    for (const f of ['index.ts', 'types.ts', 'home.ts']) writeFileSync(path.join(dir(), f), readFileSync(f === 'home.ts' ? homeFixturePath : path.join(storyDir, f)));
    const mod: ServerModule = { meta: { id: 'comics', title: 'Comics', nav: { label: 'Comics', order: 1 }, manifest: [] }, register: (router, services) => registerEditor(router, services) };
    h = await startModules(tmp, [mod]);
  });
  afterAll(async () => {
    await h.close();
    rmSync(tmp, { recursive: true, force: true });
  });

  it('is editable with a regeneration warning, saves with compare-and-swap and logs the decision', async () => {
    const v = await h.get('/api/comics/editor/story/home');
    expect(v.editable).toBe(true);
    expect(v.refusal).toBeNull();
    expect(v.warning).toMatch(/overwrite/);
    const s = v.model.scenes.find((x: { panels: { balloons: unknown[] }[] }) => x.panels.some((p) => p.balloons.length));
    const p = s.panels.find((x: { balloons: unknown[] }) => x.balloons.length);
    const stale = await h.post('/api/comics/editor/save/home', { baseHash: 'nope', ops: [{ op: 'edit', scene: s.id, img: p.img, index: 0, patch: { text: 'x' } }] });
    expect(stale.status).toBe(409);
    const res = await h.post('/api/comics/editor/save/home', { baseHash: v.hash, ops: [{ op: 'edit', scene: s.id, img: p.img, index: 0, patch: { text: 'Saved via JSON.' } }] });
    expect(res.status).toBe(200);
    const written = readFileSync(path.join(dir(), 'home.ts'), 'utf8');
    expect(written).toContain('Saved via JSON.');
    expect(changedLines(readFileSync(homeFixturePath, 'utf8'), written)).toHaveLength(1);
    const log = readFileSync(path.join(tmp, 'wiki', 'comics-library', 'decisions.jsonl'), 'utf8').trim().split('\n');
    expect(log).toHaveLength(1);
  });
});

describe('portOpen (website preview status)', () => {
  it('reports a listening server as up even when its pages render slowly, and a closed port as down', async () => {
    // A server that never answers requests: the old timed page fetch called this "down".
    const slow = http.createServer(() => undefined);
    await new Promise<void>((r) => slow.listen(0, '127.0.0.1', () => r()));
    const port = (slow.address() as { port: number }).port;
    try {
      expect(await portOpen(`http://127.0.0.1:${port}`)).toBe(true);
    } finally {
      slow.closeAllConnections();
      await new Promise<void>((r) => slow.close(() => r()));
    }
    expect(await portOpen(`http://127.0.0.1:${port}`)).toBe(false);
    expect(await portOpen('not a url')).toBe(false);
  });
});

describe('siteQuery (proxied Vite module query)', () => {
  it("keeps Vite's bare style flags bare and still encodes real values", () => {
    expect(siteQuery(new URLSearchParams('astro&type=style&index=0&lang.css'))).toBe('astro&type=style&index=0&lang.css');
    expect(siteQuery(new URLSearchParams('t=1&q=a b'))).toBe('t=1&q=a%20b');
  });
});
