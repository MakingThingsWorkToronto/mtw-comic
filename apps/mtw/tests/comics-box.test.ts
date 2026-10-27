import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { boxFromStory, boxSummary } from '../modules/comics/server/box';
import { extractSfx } from '../modules/comics/server/sfxSource';
import { boxClock, revealedAt } from '../modules/comics/client/boxPlay';
import { checkBoxSamples, comicPageBoxCount, quickFailureNote, visibleBoxCount } from '../modules/comics/client/boxChecks';
import type { QuickPanelSource, QuickSample } from '../modules/comics/client/boxChecks';
import { readerViewport, sampleReaderBox } from '../modules/comics/client/ReaderStage';
import type { ReaderTestFrame } from '../modules/comics/client/ReaderStage';
import { chatDraftKey, parseChatDraft, promptAfterSend, replyAfterSend } from '../web/ui/chatText';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)), '..', '..');
const read = (rel: string) => readFileSync(path.join(repoRoot, rel), 'utf8');

describe('Common Issues reader checks', () => {
  const panel: QuickPanelSource = { at: 1, motion: { preset: 'travel', beats: 6 }, room: 'office', balloons: [{ kind: 'speech', who: 'codex', text: 'Checked.', speech: { src: '/speech/checked.mp3', characterId: 'codex', durationSeconds: 1 } }] };
  const sample = (label: string, signature: string): QuickSample => ({ label, beat: 2, loaded: true, motionSignature: signature, balloons: [{ panelId: 'p', balloonIndex: 0, pointerVisible: true, sourceAnchored: true }], panel: { id: 'p', scene: 's', imageId: 'i', rect: { x: 0, y: 0, width: 400, height: 300 }, visibleRect: { x: 0, y: 0, width: 400, height: 300 }, activeArt: { status: 'ready', cropRect: [0, 0, 400, 300], planes: [{ src: '/comic/current.png', nativeDimensions: [1600, 1200], transform: signature }] }, speakerGeometry: { codex: { mouth: [300, 180], face: [260, 120, 80, 80] } } } });
  const run = (samples: QuickSample[], source = panel, full: number | null = 3, mode = 'desktop') => checkBoxSamples({ key: 'x/s/i', mode, panel: source, score: 0, room: 'office', durationSeconds: 5, fullyReadBeat: full, fadeBeat: 8, samples });
  it('reports clipped viewport bounds independently of the five boxes on a scrolling comic page', () => {
    const a = sample('full-read', 'none').panel!, b = { ...a, id: 'b', rect: { x: 0, y: 310, width: 400, height: 300 }, visibleRect: { x: 0, y: 310, width: 400, height: 300 } }, c = { ...a, id: 'c', rect: { x: 0, y: 620, width: 400, height: 300 }, visibleRect: { x: 0, y: 620, width: 400, height: 100 } };
    expect(visibleBoxCount([a,b,c], { width: 400, height: 720, scrollX: 0, scrollY: 0 })).toBe(2);
    expect(visibleBoxCount([a,b,{ ...c, visibleRect: { ...c.visibleRect, height: 180 } }], { width: 400, height: 800, scrollX: 0, scrollY: 0 })).toBe(2);
    expect(visibleBoxCount([a,b,{ ...c, visibleRect: c.rect }], { width: 400, height: 1000, scrollX: 0, scrollY: 0 })).toBe(3);
    const frame = sample('full-read', 'none'); frame.visibleBoxes = 2;
    const check = (pageBoxCount?: number | null) => checkBoxSamples({ key: 'x/s/i', mode: 'phone', panel, pageBoxCount, score: 0, room: 'office', durationSeconds: 5, fullyReadBeat: 3, fadeBeat: 8, samples: [frame] }).checks.find(c => c.id === 'too-few-boxes');
    expect(check(5)).toMatchObject({ state: 'pass', basis: 'source' });
    expect(check(5)?.detail).toContain('Viewport: 2 fully visible');
    expect(check(5)?.detail).toContain('Distinct meaningful shots still require visual story review');
    expect(check(4)?.state).toBe('fail');
    frame.visibleBoxes = 5;
    expect(check()?.state).toBe('pending');
    expect(check(NaN)?.state).toBe('pending');
  });
  it('counts only known current source/page membership, including separate responsive phone pages', () => {
    const source = ['a','b','c','d','e','f','g','h','i','j'];
    expect(comicPageBoxCount(source, source.slice(0,5))).toBe(5);
    expect(comicPageBoxCount(source, source.slice(5))).toBe(5);
    expect(comicPageBoxCount(source, source.slice(0,4))).toBe(4);
    expect(comicPageBoxCount(source)).toBeNull();
    expect(comicPageBoxCount(source, ['a','a','b','c','d'])).toBeNull();
    expect(comicPageBoxCount(source, ['a','b','c','d','old-source'])).toBeNull();
    expect(comicPageBoxCount(['a','a'], ['a'])).toBeNull();
  });
  it('preview controls use actual desktop/phone dimensions and only the supported reduced query', () => {
    expect(readerViewport('desktop')).toEqual({ width: 1664, height: 919, query: '' });
    expect(readerViewport('phone')).toEqual({ width: 390, height: 720, query: '' });
    expect(readerViewport('phone-small')).toEqual({ width: 360, height: 500, query: '' });
    expect(readerViewport('reduced')).toEqual({ width: 1664, height: 919, query: '&reel=off' });
  });
  it('measures decoded current planes, crop and pointers while leaving acting/hearing/usefulness pending', () => {
    const report = run([sample('opening', 'none'), sample('full-read', 'translate(40px,0)')]);
    expect(report.checks.filter(c => c.state === 'fail')).toEqual([]);
    expect(report.checks.find(c => c.id === 'wrong-sound')?.state).toBe('pending');
    expect(report.checks.find(c => c.id === 'wrong-voice')?.state).toBe('pending');
    expect(report.checks.find(c => c.id === 'no-story-content')?.state).toBe('pending');
  });
  it('maps actual missing planes, bars, cropped faces, absent pointers and conflicts to canonical flags', () => {
    const a = sample('full-read', 'none'); a.layerState = 'loading'; a.sourceError = 'missing required actor'; a.balloons[0]!.pointerVisible = false; a.balloons[0]!.sourceAnchored = false; a.balloons[0]!.placementConflict = true; a.panel!.activeArt!.cropRect = [30, 0, 340, 300]; a.panel!.speakerGeometry!.codex!.face = [360, 120, 80, 80];
    const report = run([a]);
    expect(report.checks.filter(c => c.state === 'fail').map(c => c.id)).toEqual(expect.arrayContaining(['empty-layered-state', 'doesnt-fit', 'crop-cuts', 'missing-pointer', 'wrong-speaker-pointer', 'label-placement', 'lacks-motion']));
    expect(quickFailureNote(report)).toContain('missing-pointer'); expect(quickFailureNote(report)).toContain('no approval');
  });
  it('never treats reveal opacity or an absent motion declaration as proof of useful motion', () => {
    const still = { ...panel, motion: { preset: 'still' } };
    expect(run([sample('opening', 'none'), sample('full-read', 'none')], still).checks.find(c => c.id === 'lacks-motion')?.state).toBe('pending');
    expect(run([sample('opening', 'none')], panel, 3, 'reduced').checks.find(c => c.id === 'lacks-motion')?.state).toBe('pending');
  });
  it('checks semantic labels, narration binding and impossible full-read window; silent art remains a human check', () => {
    const source = { ...panel, balloons: [{ kind: 'caption', sceneSetup: true, text: 'Monday.', speech: { src: '/speech/monday.mp3', characterId: 'codex' } }] };
    const a = sample('full-read', 'none'); a.balloons[0]!.captionAnchor = 'top';
    const result = run([a], source, null);
    expect(result.checks.filter(c => c.state === 'fail').map(c => c.id)).toEqual(expect.arrayContaining(['label-placement', 'wrong-voice', 'pace-rushed']));
    const silent = run([sample('full-read', 'none')], { at: 1, balloons: [] });
    expect(silent.checks.find(c => c.id === 'no-story-content')?.state).toBe('pending');
  });
  it('flags recording overruns without equating references with hearing or shortening approved words', () => {
    const source: QuickPanelSource = { at: 1, balloons: [{ at: 1, text: 'First.', speech: { src: '/speech/first.wav', durationSeconds: 2 } }, { at: 2, text: 'Next.' }] };
    const report = checkBoxSamples({ key: 'x/s/i', mode: 'desktop', panel: source, score: 0, room: 'none', bpm: 120, endLocalBeat: 8, durationSeconds: 3.5, fullyReadBeat: 3, fadeBeat: 8, samples: [sample('full-read', 'none')] });
    expect(report.checks.find(c => c.id === 'pace-rushed')?.state).toBe('fail');
    expect(report.checks.find(c => c.id === 'wrong-sound')?.state).toBe('pending');
    expect(source.balloons[0]?.text).toBe('First.');
  });
  it('actual held-frame sampler seeks four authored states, checks readiness after seek and restores the prior clock', async () => {
    const events: string[] = []; let clock = 3, pending = 0;
    const current = { bpm: 120, scenes: [{ id: 's', b: 10, l: 12, score: 0, room: 'office', panels: [{ ...panel, img: 'i' }] }] };
    const frame: ReaderTestFrame = { current: () => true, document: { getElementById: () => ({ textContent: JSON.stringify(current) }), querySelectorAll: () => [] } as unknown as Document, api: {
      status: () => { events.push(`status:${clock}`); return { state: 'paused', T: clock, beat: clock * 2, mode: 'desktop', loaded: pending-- <= 0 }; },
      seek: t => { events.push(`seek:${t}`); clock = t; pending = 1; },
      reviewFrames: () => ({ frames: [{ panelImageIds: ['i'], beat: 17, fullyVisibleBeat: 14, panels: [{ imageId: 'i', fullyVisibleBeat: 14, fadeStart: 21 }] }] }),
      geometry: () => { events.push(`geometry:${clock}`); const s = sample('full-read', `translate(${clock}px,0)`); return { viewport: { scrollX: 0, scrollY: 0 }, panels: [s.panel!], balloons: s.balloons.map(b => ({ ...b, visibleRect: { x: 0, y: 0, width: 10, height: 10 } })) }; },
    } };
    const report = await sampleReaderBox(frame, 'x', 's', 'i');
    expect(report.samples.map(s => s.label)).toEqual(['opening', 'motion-peak', 'full-read', 'end']); expect(clock).toBe(3);
    const seeks = events.filter(e => e.startsWith('seek:')); expect(seeks).toHaveLength(5); expect(seeks.at(-1)).toBe('seek:3');
    const first = events.findIndex(e => e.startsWith('seek:')); expect(events[first + 1]).toMatch(/^status:/);
    expect(report.checks.find(c => c.id === 'wrong-sound')?.state).toBe('pending');
    expect(report.checks.find(c => c.id === 'too-few-boxes')).toMatchObject({ state: 'fail', basis: 'source' });
    // Accurate authored phone page membership remains five even when the controlled viewport exposes one box.
    frame.api.status = () => ({ state: 'paused', T: clock, beat: clock * 2, mode: 'phone', loaded: true });
    const phone = { bpm: 120, scenes: [{ ...current.scenes[0]!, phonePages: [[{ img: 'i' }, ...['j','k','l','m'].map(img => ({ img }))]], panels: ['i','j','k','l','m'].map((img,i) => ({ ...panel, img, at: i + 1 })) }] };
    frame.document.getElementById = (() => ({ textContent: JSON.stringify(phone) })) as unknown as Document['getElementById'];
    const phoneReport = await sampleReaderBox(frame, 'x', 's', 'i');
    expect(phoneReport.checks.find(c => c.id === 'too-few-boxes')).toMatchObject({ state: 'pass', basis: 'source' });
    frame.api.status = () => ({ state: 'paused', T: clock, beat: clock * 2, loaded: true });
    const unknown = await sampleReaderBox(frame, 'x', 's', 'i');
    expect(unknown.checks.find(c => c.id === 'too-few-boxes')?.state).toBe('pending');
    frame.api.status = () => ({ state: 'play', T: clock, beat: clock * 2, loaded: true });
    await expect(sampleReaderBox(frame, 'x', 's', 'i')).rejects.toThrow('Stop Play'); expect(clock).toBe(3);
  });
  it('device/chat targets remain a visual check and only the final joined speech balloon requires a mouth pointer', () => {
    const a = sample('full-read', 'none'); a.balloons[0]!.sourceAnchored = false;
    const device = run([a], { at: 1, balloons: [{ kind: 'speech', state: 'device', who: 'narrator', text: 'The app response.' }] });
    expect(device.checks.find(c => c.id === 'wrong-speaker-pointer')?.state).toBe('pending');
    expect(device.checks.find(c => c.id === 'missing-voice')?.state).toBe('fail');
    const joined: QuickPanelSource = { at: 1, balloons: [{ kind: 'speech', text: 'First.' }, { kind: 'speech', chain: true, text: 'Next.' }] };
    a.balloons = [{ panelId: 'p', balloonIndex: 0, pointerVisible: false, sourceAnchored: true }, { panelId: 'p', balloonIndex: 1, pointerVisible: true, sourceAnchored: true }];
    expect(run([a], joined).checks.find(c => c.id === 'missing-pointer')?.state).toBe('pass');
    a.balloons[1]!.pointerVisible = false;
    expect(run([a], joined).checks.find(c => c.id === 'missing-pointer')?.state).toBe('fail');
  });
  it('narrator caption/place metadata requires the same Second Brain voice as introductions', () => {
    for (const kind of ['caption', 'place']) {
      const b = { kind, who: 'narrator', text: 'Friday.', speech: { src: '/speech/friday.mp3', characterId: 'codex' } };
      expect(run([sample('full-read', 'none')], { at: 1, balloons: [b] }).checks.find(c => c.id === 'wrong-voice')?.state).toBe('fail');
      b.speech.characterId = 'second-brain'; expect(run([sample('full-read', 'none')], { at: 1, balloons: [b] }).checks.find(c => c.id === 'wrong-voice')?.state).toBe('pending');
    }
  });
});

const story = (panels: unknown[]) =>
  `import { retime } from './retime';\nexport const x = retime(${JSON.stringify({ id: 'x', bpm: 120, scenes: [{ id: 's', l: 20, room: 'office', panels }] }, null, 2)});\n`;

describe('boxFromStory', () => {
  const text = story([
    { at: 1, img: 'a', alt: 'A', sfx: [{ kind: 'ring', delay: 1 }], motion: { preset: 'push' }, balloons: [{ at: 2.5, kind: 'speech', who: 'marco', text: 'Hi\nthere', x: 0.1, y: 0.2, w: 0.3, tail: [0.5, 0.9] }] },
    { at: 6, img: 'b', alt: 'B', room: 'rain', balloons: [] },
  ]);
  it('reads balloons with placement and delay, effects, room and motion; the box ends at the next box', () => {
    const box = boxFromStory(text, 'x', 's', 'a');
    expect(box).toMatchObject({ panelIndex: 0, bpm: 120, length: 5, room: 'office', motion: { preset: 'push', layered: false }, sfx: [{ kind: 'ring', delay: 1, gain: 0.7 }] });
    expect(box.balloons[0]).toMatchObject({ id: 'x-s-a-b1', text: 'Hi\nthere', x: 0.1, y: 0.2, w: 0.3, tail: [0.5, 0.9], delay: 1.5 });
    expect(box.hash).toMatch(/^[0-9a-f]{64}$/);
  });
  it('the last box runs to the scene end and inherits nothing it does not have', () => {
    const box = boxFromStory(text, 'x', 's', 'b');
    expect(box).toMatchObject({ length: 14, room: 'rain', sfx: [], balloons: [], motion: { preset: 'still' } });
  });
  it('refuses unknown scenes and boxes', () => {
    expect(() => boxFromStory(text, 'x', 'nope', 'a')).toThrow(/no scene/);
    expect(() => boxFromStory(text, 'x', 's', 'zz')).toThrow(/no box/);
  });
  it('summarises the box on one line per field', () => {
    const s = boxSummary(boxFromStory(text, 'x', 's', 'a'));
    expect(s.balloons).toBe('b1 speech/marco: "Hi there"');
    expect(s.sound).toBe('room office; motion push; sfx ring@1b');
  });
  it('parses the real Home box Matt reviewed', () => {
    const box = boxFromStory(read('site/src/data/comic-stories/home.ts'), 'home', 'quote', 'home-marco-desk');
    expect(box.balloons[0]?.id).toBe('home-quote-home-marco-desk-b1');
    expect(box.length).toBeGreaterThan(0);
  });
});

describe('extractSfx', () => {
  it("lifts every SfxKind from the reader's own synthesis, as a function body that compiles", () => {
    const found = extractSfx(read('site/public/scripts/comic-story.js'));
    expect(found).not.toBeNull();
    const union = /export type SfxKind\s*=([^;]+);/.exec(read('site/src/data/comic-stories/types.ts'))?.[1] ?? '';
    const kinds = [...union.matchAll(/'([a-z]+)'/g)].map((m) => m[1]);
    expect([...(found?.kinds ?? [])].sort()).toEqual([...kinds].sort());
    expect(() => new Function('ctx', found?.source ?? '')).not.toThrow();
  });
  it('returns null when the markers are missing', () => {
    expect(extractSfx('nothing here')).toBeNull();
  });
});

describe('box playback clock', () => {
  const box = { bpm: 120, length: 4, sfx: [{ kind: 'ring', delay: 1, gain: 0.5 }], balloons: [{ id: 'b1', delay: 0 }, { id: 'b2', delay: 2 }] };
  it('places effects in seconds from the beat clock and starts takes 0.3 s after each balloon letters in', () => {
    const c = boxClock(box, { b1: { audio: '/t1.mp3', durationSeconds: 1 }, b2: { audio: null, durationSeconds: null } });
    expect(c.duration).toBe(2);
    expect(c.sfx).toEqual([{ kind: 'ring', at: 0.5, gain: 0.5 }]);
    expect(c.speech).toEqual([{ id: 'b1', at: 0.3, src: '/t1.mp3' }]);
    expect(c.letters).toEqual([{ id: 'b1', at: 0 }, { id: 'b2', at: 1 }]);
  });
  it('the play-through runs at least until the last saved take ends', () => {
    expect(boxClock({ ...box, length: 1 }, { b2: { audio: '/t.mp3', durationSeconds: 3 } }).duration).toBeCloseTo(4.3);
  });
  it('reveals balloons whose time has come', () => {
    const c = boxClock(box, {});
    expect(revealedAt(c, 0.9)).toEqual(new Set(['b1']));
    expect(revealedAt(c, 1)).toEqual(new Set(['b1', 'b2']));
  });
});

describe('shared chat helpers', () => {
  it('draft keys isolate operation and subject and restore exact multiline input without submitting', () => {
    expect(chatDraftKey('a/b', 'c')).not.toBe(chatDraftKey('a', 'b/c'));
    expect(chatDraftKey('box', 'x')).not.toBe(chatDraftKey('journal', 'x'));
    const draft = { note: 'Keep\nmy words.  ', reply: 'Typed reply\nnext line', chosen: ['missing-pointer', 'wrong-sound'] };
    expect(parseChatDraft(JSON.stringify(draft))).toEqual(draft);
    expect(parseChatDraft('{bad')).toEqual({ note: '', reply: '', chosen: [] });
  });
  it('successful sends clear only the exact sent draft and preserve edits/replies made while a request runs', () => {
    const original = { note: 'Original', chosen: ['crop-cuts'], reply: 'Reply draft' };
    expect(promptAfterSend(original, original)).toEqual({ note: '', chosen: [], reply: 'Reply draft' });
    const newer = { ...original, note: 'Original plus new words' };
    expect(promptAfterSend(newer, original)).toBe(newer);
    const flags = { ...original, chosen: ['crop-cuts', 'missing-pointer'] };
    expect(promptAfterSend(flags, original)).toBe(flags);
    expect(replyAfterSend(original, 'Reply draft')).toEqual({ ...original, reply: '' });
    expect(replyAfterSend({ ...original, reply: 'New reply' }, 'Reply draft').reply).toBe('New reply');
  });
  it('appends dictation with one space and turns a reply into one terminal line', async () => {
    const { appendDictation, terminalLine } = await import('../web/ui/chatText');
    expect(appendDictation('', ' make it shorter ')).toBe('make it shorter');
    expect(appendDictation('Fix the laptop.', 'And the phone')).toBe('Fix the laptop. And the phone');
    expect(appendDictation('Fix ', 'it')).toBe('Fix it');
    expect(terminalLine(' one\n two \n\nthree ')).toBe('one two three');
  });
});

describe('boxFrame (reader geometry)', () => {
  it('matches the measured reader: the Home tower box letters at 15 px in a 542 px box', async () => {
    const { boxFrame } = await import('../modules/comics/client/boxLayout');
    const f = boxFrame({ r: [0, 0, 0.343, 0.282], ar: [0, 0, 0.343, 0.282], focus: [0.5, 0.5], insetPct: 0 }, { width: 2400, height: 1600 });
    expect(f?.fontCqw).toBeCloseTo((15 / 542) * 100, 1);
  });
  it('covers the box with the art region at the focus, keeping the layout shape', async () => {
    const { boxFrame } = await import('../modules/comics/client/boxLayout');
    const f = boxFrame({ r: [0.5, 0, 0.5, 0.5], ar: [0.5, 0, 0.5, 0.5], focus: [0.5, 0.5], insetPct: 0 }, { width: 2000, height: 1000 });
    expect(f).toMatchObject({ aspect: 2, img: { widthPct: 200, leftPct: -100, topPct: -0 } });
  });
});

describe('word approvals before a voice is chosen', () => {
  const row = { id: 'x-s-a-b1', textSha256: 't1', storySource: { path: 'site/x.ts', sha256: 'h1' } };
  const review = { id: 'x-s-a-b1', characterId: 'marco', status: 'approved', provider: '', voiceId: '', textSha256: 't1', storySource: { path: 'site/x.ts', sha256: 'h1' } };
  it('shows an unvoiced row whose exact words were approved as approved, and nothing else', async () => {
    const { applyWordApprovals } = await import('../modules/comics/server/wordApprovals');
    const rows = [{ id: 'x-s-a-b1', state: 'unvoiced' }, { id: 'other', state: 'unvoiced' }, { id: 'p', state: 'pending' }];
    const derived = new Map([[row.id, row]]);
    expect(applyWordApprovals(rows, [review], derived, { 'site/x.ts': 'h1' }).map((r) => r.state)).toEqual(['approved', 'unvoiced', 'pending']);
    expect(applyWordApprovals(rows, [review], derived, { 'site/x.ts': 'h2' })[0]?.state).toBe('unvoiced');
    expect(applyWordApprovals(rows, [{ ...review, textSha256: 'old' }], derived, { 'site/x.ts': 'h1' })[0]?.state).toBe('unvoiced');
  });
  it('choosing the voice binds only that character’s voiceless approvals', async () => {
    const { bindWordApprovals } = await import('../modules/comics/server/wordApprovals');
    const list = [{ ...review }, { ...review, id: 'b2', characterId: 'dana' }, { ...review, id: 'b3', voiceId: 'keep', provider: 'Fish' }];
    expect(bindWordApprovals(list, 'marco', 'ElevenLabs', 'v1')).toBe(1);
    expect(list.map((r) => r.voiceId)).toEqual(['v1', '', 'keep']);
  });
});
