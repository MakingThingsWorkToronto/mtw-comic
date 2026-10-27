import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { artStem, matchFamily, parseArtStem } from '../modules/comics/server/artwatch';
import { FIX_TEMPLATE, parseFixPresets } from '../modules/comics/server/fixes';
import { parsePrompt } from '../server/core/prompts';
import { FIX_OPERATION, assembleFixParams, baselineOf, bustToken, bustUrl, canLaunch, createPresetLoader, detectNewArt, fixSubject, fixingBoxes, parseFixSubject, subjectTokens } from '../modules/comics/client/fix';
import type { SceneStatus } from '../modules/comics/client/fix';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)), '..', '..');

describe('fix presets', () => {
  it('shares in-flight preset reads but reopens current canonical flags after changes or errors', async () => {
    let resolve!: (value: []) => void;
    let requests = 0;
    const load = createPresetLoader(() => { requests++; return new Promise<[]>(r => { resolve = r; }); });
    const first = load(); expect(load()).toBe(first); expect(requests).toBe(1); resolve([]); await first;
    const second = load(); expect(second).not.toBe(first); expect(requests).toBe(2); resolve([]); await second;
    let fail = true;
    const retry = createPresetLoader(() => fail ? Promise.reject(new Error('offline')) : Promise.resolve([]));
    await expect(retry()).rejects.toThrow('offline'); fail = false; await expect(retry()).resolves.toEqual([]);
  });
  it('reads id, label and instruction from the template and drops incomplete or duplicate entries', () => {
    const text = ['---', 'presets:', '  - id: a-one', '    label: "First: one"', '    instruction: "Do it, then check."', '  - id: a-one', '    label: dup', '    instruction: dup', '  - id: Bad Id', '    label: x', '    instruction: y', '  - id: no-text', '    label: only', '---', 'body'].join('\n');
    expect(parseFixPresets(text)).toEqual([{ id: 'a-one', label: 'First: one', instruction: 'Do it, then check.', scope: 'art' }]);
    expect(parseFixPresets('no frontmatter')).toEqual([]);
  });
  it('the real template carries the requested presets, each with a one-sentence instruction', () => {
    const presets = parseFixPresets(readFileSync(path.join(repoRoot, FIX_TEMPLATE), 'utf8'));
    expect(presets.map((p) => p.id)).toEqual(expect.arrayContaining(['wrong-side', 'two-step', 'faces-away', 'wrong-reading-side', 'off-model', 'hands-props', 'crop-cuts', 'cluttered']));
    for (const p of presets) expect(p.instruction.trim().endsWith('.')).toBe(true);
  });
  it('common issues cover current source/render, lettering, timing and delivered audio failures without duplicate legacy flags', () => {
    const presets = parseFixPresets(readFileSync(path.join(repoRoot, FIX_TEMPLATE), 'utf8'));
    const scopes = Object.fromEntries(presets.map(p => [p.id, p.scope]));
    expect(scopes).toMatchObject({ 'lacks-motion': 'motion', 'doesnt-fit': 'art', 'crop-cuts': 'art', 'missing-pointer': 'speech', 'wrong-speaker-pointer': 'speech', 'label-placement': 'art', 'empty-layered-state': 'motion', 'no-story-content': 'speech', 'more-sfx': 'sound', 'wrong-sound': 'sound', 'pace-slow': 'motion', 'pace-rushed': 'motion', 'missing-voice': 'voice', 'wrong-voice': 'voice', 'too-few-boxes': 'art' });
    expect(new Set(presets.map(p => p.id)).size).toBe(presets.length);
    expect(presets.find(p => p.id === 'lacks-motion')?.instruction).toContain('declared preset alone does not pass');
    expect(presets.find(p => p.id === 'missing-pointer')?.instruction).toContain('outside its balloon');
    expect(presets.find(p => p.id === 'label-placement')?.instruction).toContain('bottom-right');
  });
  it("the template opens with Matt's common box issues in his order, each scoped", () => {
    const presets = parseFixPresets(readFileSync(path.join(repoRoot, FIX_TEMPLATE), 'utf8'));
    expect(presets.slice(0, 15).map((p) => `${p.id}:${p.scope}`)).toEqual([
      'low-quality:art', 'doesnt-fit:art', 'rewrite-speech:speech', 'agent-projection:art', 'more-sfx:sound', 'comic-format:art', 'lacks-motion:motion',
      'laptop-ui-wrong-side:art', 'monitor-wrong-side:art', 'phone-wrong-side:art', 'laptop-missing-ui:art', 'monitor-missing-ui:art', 'phone-missing-graphic:art',
      'paper-wrong-side:art', 'paper-missing-graphics:art',
    ]);
  });
  it('the scope parses and an unknown scope falls back to art', () => {
    const text = ['---', 'presets:', '  - id: s', '    scope: sound', '    label: S', '    instruction: "Do."', '  - id: q', '    scope: nope', '    label: Q', '    instruction: "Do."', '---'].join('\n');
    expect(parseFixPresets(text).map((p) => p.scope)).toEqual(['sound', 'art']);
  });
  it('the character chat has appearance and voice presets and its own idle-closing procedure', () => {
    const presets = parseFixPresets(readFileSync(path.join(repoRoot, 'wiki', 'operations', 'templates', 'comics-character-fixes.md'), 'utf8'));
    expect(new Set(presets.map((p) => p.scope))).toEqual(new Set(['appearance', 'voice']));
    expect(presets.map((p) => p.id)).toEqual(expect.arrayContaining(['off-model', 'agent-projection', 'wrong-voice', 'pace', 'audition']));
    const { def } = parsePrompt(readFileSync(path.join(repoRoot, 'wiki', 'operations', 'prompts', 'comics-character-feedback.md'), 'utf8'), 'comics-character-feedback');
    expect(def).toMatchObject({ runner: 'claude', idleMinutes: 60 });
    expect(def.params.map((p) => p.name)).toEqual(['subject', 'character', 'name', 'appearance', 'voice', 'fixes', 'note']);
  });
  it('the box feedback procedure is an interactive claude run that closes after an hour idle', () => {
    const { def } = parsePrompt(readFileSync(path.join(repoRoot, 'wiki', 'operations', 'prompts', 'comics-box-feedback.md'), 'utf8'), 'comics-box-feedback');
    expect(def).toMatchObject({ id: 'comics-box-feedback', runner: 'claude', skill: 'mtw-comic-story', idleMinutes: 60 });
    expect(def.params.map((p) => p.name)).toEqual(['subject', 'issue', 'scene', 'panel', 'art', 'balloons', 'sound', 'fixes', 'note']);
  });
  it('the procedure parses, defaults to codex and names the tracking key first', () => {
    const { def } = parsePrompt(readFileSync(path.join(repoRoot, 'wiki', 'operations', 'prompts', 'comics-fix-box-art.md'), 'utf8'), 'comics-fix-box-art');
    expect(def.id).toBe(FIX_OPERATION);
    expect(def.runner).toBe('codex');
    expect(def.skill).toBe('mtw-comic-story');
    expect(def.params.map((p) => p.name)).toEqual(['subject', 'issue', 'scene', 'panel', 'art', 'fixes', 'note']);
  });
});

describe('fix parameters', () => {
  const panel = { index: 1, img: 'p2', rect: [0.1, 0.25, 0.5, 0.3333333] as [number, number, number, number] };
  it('assembles one box', () => {
    const p = assembleFixParams({ issue: 'home', sceneId: 'agent', art: '/comic/home/home-agent-20261008', panels: [panel], fixes: ['wrong-side', 'two-step'], note: ' phone  faces\naway ' });
    expect(p).toEqual({
      subject: 'fix:home/agent/p2',
      issue: 'home',
      scene: 'agent',
      panel: 'p2',
      art: '/comic/home/home-agent-20261008 | p2 ar=[0.1, 0.25, 0.5, 0.3333]',
      fixes: 'wrong-side, two-step',
      note: 'phone faces away',
    });
  });
  it('assembles several boxes into one run and falls back to the index without an img id', () => {
    const p = assembleFixParams({ issue: 'home', sceneId: 'agent', art: null, panels: [panel, { index: 3, img: '', rect: null }], fixes: [], note: 'x' });
    expect(p.panel).toBe('p2, 3');
    expect(p.art).toBe('none | p2 ar=[0.1, 0.25, 0.5, 0.3333] | 3 ar=none');
    expect(parseFixSubject(p.subject)).toEqual({ issue: 'home', scene: 'agent', refs: ['p2', '3'] });
    expect(fixSubject('a', 'b', ['c'])).toBe('fix:a/b/c');
    expect(parseFixSubject('other')).toBeNull();
  });
  it('needs a box and either a fix or a note', () => {
    expect(canLaunch({ panels: [panel], fixes: [], note: '  ' })).toBe(false);
    expect(canLaunch({ panels: [panel], fixes: ['a'], note: '' })).toBe(true);
    expect(canLaunch({ panels: [panel], fixes: [], note: 'x' })).toBe(true);
    expect(canLaunch({ panels: [], fixes: ['a'], note: '' })).toBe(false);
  });
  it('tracks running fix runs per box and reads tokens', () => {
    const runs = [
      { id: 't1', operation: FIX_OPERATION, status: 'running', subject: 'fix:home/agent/p2+p3', startedAt: '2026-10-09T10:00:00Z' },
      { id: 't2', operation: FIX_OPERATION, status: 'exited', subject: 'fix:home/agent/p4' },
      { id: 't3', operation: 'comics-run-checks', status: 'running', subject: 'home' },
      { id: 't4', operation: FIX_OPERATION, status: 'running', subject: 'fix:agentic/x/p1' },
    ];
    const m = fixingBoxes(runs, 'home');
    expect([...m.keys()].sort()).toEqual(['agent/p2', 'agent/p3']);
    expect(m.get('agent/p2')?.id).toBe('t1');
    expect(subjectTokens({ summary: {}, runs: [{ tokens: { total: 1200 } }, { tokens: { total: 300 } }, {}] })).toBe(1500);
    expect(subjectTokens({ summary: { all: { total: 42 } } })).toBe(42);
    expect(subjectTokens(null)).toBeNull();
  });
});

describe('newer art detection', () => {
  const file = (p: string, mtime: number, version: number | null = null, kind: 'site' | 'canonical' = 'site') => ({ path: p, mtime, version, kind });
  const scene = (art: string | null, files: ReturnType<typeof file>[]): SceneStatus => ({ id: 's', art, files });
  const site = 'site/public/comic/home/';
  const canon = 'wiki/image-library/assets/scenes/comic-b/pages/';

  it('splits an art stem into family and version and matches only the same family', () => {
    expect(parseArtStem('home-quote-20261010-device-v2')).toEqual({ family: 'home-quote-20261010-device', version: 2 });
    expect(parseArtStem('home-agent-20261008')).toEqual({ family: 'home-agent-20261008', version: null });
    expect(artStem('/comic/home/home-agent-20261008')).toBe('home-agent-20261008');
    expect(artStem('../x')).toBeNull();
    const names = ['home-agent-20261008-1600.webp', 'home-agent-20261008-v2-2400.webp', 'home-agent-20261008-v2-2400.avif', 'home-agent-2-1600.webp', 'home-agent-20261008-v2.png', 'x-home-agent-20261008-1600.webp'];
    expect(matchFamily('home-agent-20261008', names, 'site').map((m) => [m.name, m.version])).toEqual([['home-agent-20261008-1600.webp', null], ['home-agent-20261008-v2-2400.webp', 2], ['home-agent-20261008-v2-2400.avif', 2]]);
    expect(matchFamily('home-agent-20261008', names, 'canonical').map((m) => m.name)).toEqual(['home-agent-20261008-v2.png']);
  });
  it('reports nothing while files are unchanged', () => {
    const s = scene('/comic/home/a', [file(`${site}a-2400.webp`, 10), file(`${canon}a-v1.png`, 5, 1, 'canonical')]);
    expect(detectNewArt(baselineOf(s), s)).toBeNull();
  });
  it('sees a newer -vN canonical master before the site copy exists', () => {
    const base = scene('/comic/home/a', [file(`${site}a-2400.webp`, 10), file(`${canon}a-v1.png`, 5, 1, 'canonical')]);
    const now = scene('/comic/home/a', [...base.files, file(`${canon}a-v2.png`, 20, 2, 'canonical')]);
    expect(detectNewArt(baselineOf(base), now)).toEqual({ kind: 'newer-version', file: 'a-v2.png', showPath: `${canon}a-v2.png`, version: 2 });
  });
  it('prefers the widest site webp for the new version and notices a repointed art path', () => {
    const base = scene('/comic/home/a-v1', [file(`${site}a-v1-2400.webp`, 10, 1)]);
    const now = scene('/comic/home/a-v2', [file(`${site}a-v1-2400.webp`, 10, 1), file(`${site}a-v2-1600.webp`, 30, 2), file(`${site}a-v2-2400.webp`, 30, 2), file(`${site}a-v2-2400.avif`, 30, 2)]);
    expect(detectNewArt(baselineOf(base), now)).toMatchObject({ kind: 'newer-version', showPath: `${site}a-v2-2400.webp`, version: 2 });
    const moved = scene('/comic/home/other', base.files);
    expect(detectNewArt(baselineOf(base), moved)).toMatchObject({ kind: 'repointed', file: 'other' });
  });
  it('sees a file rewritten in place and a file that appears for a scene with no art', () => {
    const base = scene('/comic/home/a', [file(`${site}a-2400.webp`, 10)]);
    expect(detectNewArt(baselineOf(base), scene('/comic/home/a', [file(`${site}a-2400.webp`, 11)]))).toMatchObject({ kind: 'changed', file: 'a-2400.webp' });
    const empty = scene('/comic/home/a', []);
    expect(detectNewArt(baselineOf(empty), scene('/comic/home/a', [file(`${site}a-2400.webp`, 50)]))).toMatchObject({ kind: 'appeared' });
  });
  it('a kept change becomes the new baseline', () => {
    const base = scene('/comic/home/a', [file(`${canon}a-v1.png`, 5, 1, 'canonical')]);
    const now = scene('/comic/home/a', [...base.files, file(`${canon}a-v2.png`, 20, 2, 'canonical')]);
    expect(detectNewArt(baselineOf(now), now)).toBeNull();
  });
});

describe('crop cache busting', () => {
  it('adds or replaces v= without touching the other parameters', () => {
    expect(bustUrl('/api/comics/media?path=a%2Fb.webp', 123)).toBe('/api/comics/media?path=a%2Fb.webp&v=123');
    expect(bustUrl('/api/comics/media?path=a%2Fb.webp&v=1', 2)).toBe('/api/comics/media?path=a%2Fb.webp&v=2');
    expect(bustUrl('/api/comics/media?v=1&path=a', 'x y')).toBe('/api/comics/media?path=a&v=x%20y');
    expect(bustUrl('/plain.webp', 5)).toBe('/plain.webp?v=5');
  });
  it('the token follows the newest site file only', () => {
    const s: SceneStatus = { id: 's', art: null, files: [{ path: 'a', mtime: 5, version: null, kind: 'site' }, { path: 'b', mtime: 9, version: null, kind: 'site' }, { path: 'c', mtime: 99, version: 3, kind: 'canonical' }] };
    expect(bustToken(s)).toBe('9');
    expect(bustToken(undefined)).toBe('0');
  });
});
