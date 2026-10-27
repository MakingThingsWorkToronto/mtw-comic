import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { commandForKey, compactNumber, countStates, cropLayout, describeChange, filterRows, flowReduce, meterSegments, nextOpen, nextSlot, parseTokens, pickTakes, restoreAction, settle, slotForKey, wordDiff } from '../modules/comics/client/flow';
import type { FlowContext, FlowState } from '../modules/comics/client/flow';
import type { ReviewState } from '../modules/comics/client/types';
import { Library } from '../modules/comics/server/library';
import { comicsSnapshot } from './comics-snapshot';
import { StoryArt, parseStorySource, sceneArt } from '../modules/comics/server/stories';
import { baselineFor, pagesView, speechRows } from '../modules/comics/server/views';
import { FileWikiStore } from '../server/core/wiki-store';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)), '..', '..');

describe('word diff', () => {
  it('marks added and removed words and ignores whitespace', () => {
    expect(wordDiff('Quote by\nmidnight.', 'Quote by midnight.')).toEqual([{ op: 'same', text: 'Quote by midnight.' }]);
    expect(wordDiff('The desks will be ready.', 'The desks are ready. Tonight.')).toEqual([
      { op: 'same', text: 'The desks' },
      { op: 'del', text: 'will be' },
      { op: 'add', text: 'are' },
      { op: 'same', text: 'ready.' },
      { op: 'add', text: 'Tonight.' },
    ]);
  });
  it('handles empty sides and reconstructs both texts', () => {
    expect(wordDiff('', 'new words')).toEqual([{ op: 'add', text: 'new words' }]);
    expect(wordDiff('old words', '')).toEqual([{ op: 'del', text: 'old words' }]);
    const a = 'Nobody checked the rate card. It was two years old.';
    const b = 'Nobody checked the old rate card. It was three years old.';
    const d = wordDiff(a, b);
    expect(d.filter((s) => s.op !== 'add').map((s) => s.text).join(' ')).toBe(a);
    expect(d.filter((s) => s.op !== 'del').map((s) => s.text).join(' ')).toBe(b);
  });
});

describe('crop math', () => {
  it('places the page art so only the panel region shows', () => {
    // A panel in the top-left quarter of a 2000 x 3000 page.
    const c = cropLayout([0, 0, 0.5, 0.25], { width: 2000, height: 3000 });
    expect(c).not.toBeNull();
    expect(c?.widthPct).toBeCloseTo(200);
    expect(c?.leftPct).toBeCloseTo(0);
    expect(c?.topPct).toBeCloseTo(0);
    expect(c?.aspect).toBeCloseTo(1000 / 750);
  });
  it('offsets by the region origin relative to the region size', () => {
    const c = cropLayout([0.25, 0.5, 0.5, 0.25], { width: 1000, height: 1000 });
    expect(c?.leftPct).toBeCloseTo(-50);
    expect(c?.topPct).toBeCloseTo(-200);
    expect(c?.widthPct).toBeCloseTo(200);
    expect(c?.aspect).toBeCloseTo(2);
  });
  it('clamps to the page and rejects empty regions or unknown sizes', () => {
    const c = cropLayout([0.9, -0.2, 0.5, 0.3], { width: 100, height: 100 });
    expect(c?.widthPct).toBeCloseTo(1000); // width clamped to 0.1
    expect(c?.topPct).toBeCloseTo(0);
    expect(cropLayout([0.5, 0.5, 0, 0.2], { width: 100, height: 100 })).toBeNull();
    expect(cropLayout([0, 0, 1, 1], { width: 0, height: 100 })).toBeNull();
  });
});

describe('shortcut mapping', () => {
  it('maps the documented keys', () => {
    expect(commandForKey({ key: ' ' })).toBe('play');
    expect(commandForKey({ key: 'a' })).toBe('approve');
    expect(commandForKey({ key: 'R' })).toBe('reject');
    expect(commandForKey({ key: 'j' })).toBe('next');
    expect(commandForKey({ key: 'k' })).toBe('prev');
    expect(commandForKey({ key: 'u' })).toBe('undo');
    expect(commandForKey({ key: 'x' })).toBeNull();
  });
  it('leaves typing, modifiers and focused buttons alone', () => {
    expect(commandForKey({ key: 'a', typing: true })).toBeNull();
    expect(commandForKey({ key: 'a', ctrl: true })).toBeNull();
    expect(commandForKey({ key: 'r', meta: true })).toBeNull();
    expect(commandForKey({ key: ' ', onControl: true })).toBeNull();
    expect(commandForKey({ key: 'a', onControl: true })).toBe('approve');
  });
});

describe('review flow reducer', () => {
  const ids = ['b1', 'b2', 'b3', 'b4'];
  const states: Record<string, ReviewState> = { b1: 'approved', b2: 'pending', b3: 'approved', b4: 'stale' };
  const ctx: FlowContext = { ids, states };
  const start: FlowState = { current: 'b2', undo: [] };

  it('moves within bounds', () => {
    expect(flowReduce({ current: 'b1', undo: [] }, { type: 'move', dir: -1 }, ctx).current).toBe('b1');
    expect(flowReduce(start, { type: 'move', dir: 1 }, ctx).current).toBe('b3');
    expect(flowReduce({ current: 'b4', undo: [] }, { type: 'move', dir: 1 }, ctx).current).toBe('b4');
    expect(flowReduce(start, { type: 'goto', id: 'zz' }, ctx)).toBe(start);
  });
  it('a decision advances to the next open balloon and can be undone', () => {
    const decided = flowReduce(start, { type: 'decided', decision: { id: 'b2', prev: 'pending', action: 'approve' } }, ctx);
    expect(decided.current).toBe('b4');
    expect(decided.undo).toEqual([{ id: 'b2', prev: 'pending', action: 'approve' }]);
    const undone = flowReduce(decided, { type: 'undone' }, ctx);
    expect(undone.current).toBe('b2');
    expect(undone.undo).toEqual([]);
    expect(flowReduce(start, { type: 'undone' }, ctx)).toBe(start);
  });
  it('wraps to an earlier open balloon, and stays put when none is left', () => {
    expect(nextOpen({ ids, states: { ...states, b4: 'approved' } }, 'b3')).toBe('b2');
    expect(nextOpen({ ids, states: { b1: 'approved', b2: 'approved', b3: 'approved', b4: 'approved' } }, 'b2')).toBe('b3');
    expect(nextOpen({ ids: [], states: {} }, null)).toBeNull();
  });
  it('settle keeps a surviving cursor and recovers a vanished one', () => {
    expect(settle(start, ctx)).toBe(start);
    expect(settle({ current: 'gone', undo: [] }, ctx).current).toBe('b2');
    expect(settle({ current: 'x', undo: [] }, { ids: [], states: {} }).current).toBeNull();
  });
  it('undo restores the prior state with the right write', () => {
    expect(restoreAction('approved')).toBe('approve');
    expect(restoreAction('rejected')).toBe('reject');
    expect(restoreAction('pending')).toBe('revoke');
    expect(restoreAction('stale')).toBe('revoke');
  });
});

describe('progress counts and filters', () => {
  const rows = [
    { id: 'a', text: 'Ask them first.', characterId: 'marco', state: 'approved' as ReviewState },
    { id: 'b', text: 'Quote by midnight.', characterId: 'marco', state: 'pending' as ReviewState },
    { id: 'c', text: 'Looks great!', characterId: 'second-brain', state: 'stale' as ReviewState },
    { id: 'd', text: 'No.', characterId: 'dana', state: 'rejected' as ReviewState },
    { id: 'e', text: 'Hm.', characterId: 'dana', state: 'unvoiced' as ReviewState },
  ];
  it('counts every state and builds meter segments summing to 100', () => {
    const c = countStates(rows);
    expect(c).toEqual({ total: 5, approved: 1, rejected: 1, stale: 1, pending: 1, unvoiced: 1 });
    const segs = meterSegments(c);
    expect(segs.map((s) => s.state)).toEqual(['approved', 'rejected', 'pending', 'stale', 'unvoiced']);
    expect(segs.reduce((n, s) => n + s.pct, 0)).toBeCloseTo(100);
    expect(meterSegments(countStates([]))).toEqual([]);
  });
  it('filters by state group, character and search over text, id and name', () => {
    expect(filterRows(rows, { state: 'open' }).map((r) => r.id)).toEqual(['b', 'c']);
    expect(filterRows(rows, { state: 'all' })).toHaveLength(5);
    expect(filterRows(rows, { state: 'open', keep: new Set(['a']) }).map((r) => r.id)).toEqual(['a', 'b', 'c']);
    expect(filterRows(rows, { character: 'dana' }).map((r) => r.id)).toEqual(['d', 'e']);
    expect(filterRows(rows, { q: 'MIDNIGHT' }).map((r) => r.id)).toEqual(['b']);
    expect(filterRows(rows, { q: 'dana lemieux' }, { dana: 'Dana' })).toEqual([]);
    expect(filterRows(rows, { q: 'marco' }, { marco: 'Marco Lemieux' }).map((r) => r.id)).toEqual(['a', 'b']);
  });
});

describe('live notice and tokens adapter', () => {
  it('names what changed', () => {
    expect(describeChange(['wiki/comics-library/speech-approvals.json'])).toBe('Speech approvals updated by another writer');
    expect(describeChange(['wiki/comics-library/speech-approvals.json', 'wiki/comics-library/voices.json', 'scripts/comics/voice-casting.mjs'])).toBe(
      'Speech approvals, Voice casting and Casting rules updated by another writer',
    );
    expect(describeChange(['wiki/comics-library/speech-approvals.json', 'wiki/comics-library/speech-approvals.json'])).toBe('Speech approvals updated by another writer');
    expect(describeChange([])).toBe('Comics files updated by another writer');
  });
  it('reads the token response in the shapes the core may use', () => {
    expect(parseTokens({ total: 1200, runs: 3 })).toEqual({ total: 1200, runs: 3 });
    expect(parseTokens({ row: { input: 10, output: 5, cacheRead: 100, cacheWrite: 1, runs: 2 } })).toEqual({ total: 116, runs: 2 });
    expect(parseTokens({ rows: [{ total: 5, runs: 1 }, { total: 7, runs: 2 }] })).toEqual({ total: 12, runs: 3 });
    expect(parseTokens({ error: 'x' })).toBeNull();
    expect(parseTokens(null)).toBeNull();
    expect(compactNumber(1_250_000)).toBe('1.3M');
    expect(compactNumber(42_000)).toBe('42k');
    expect(compactNumber(999)).toBe('999');
  });
});

describe('voice comparison', () => {
  const voices = [
    { ref: 'voice:a', voiceId: 'a', provider: 'ElevenLabs', preview: '/p/a' },
    { ref: 'voice:b', voiceId: 'b', provider: 'ElevenLabs', preview: '/p/b' },
    { ref: 'voice:c', voiceId: 'c', provider: 'Fish Audio' },
  ];
  const clips = [
    { voiceId: 'a', provider: 'ElevenLabs', text: 'Ask them first.', preview: '/c/a1' },
    { voiceId: 'b', provider: 'ElevenLabs', text: 'Ask them first.', preview: '/c/b1' },
    { voiceId: 'a', provider: 'ElevenLabs', text: 'Other line.', preview: '/c/a2' },
  ];
  it('picks the line most voices share and flags previews that are not the same line', () => {
    const { line, takes } = pickTakes(voices, clips, 'Sample.');
    expect(line).toBe('Ask them first.');
    expect(takes[0]).toEqual({ src: '/c/a1', sameLine: true, line });
    expect(takes[1]).toEqual({ src: '/c/b1', sameLine: true, line });
    expect(takes[2]).toBeNull();
    const none = pickTakes(voices.slice(0, 2), [], 'Sample.');
    expect(none.takes.map((t) => t?.sameLine)).toEqual([false, false]);
    expect(none.line).toBe('Sample.');
  });
  it('plays back to back, skipping silent slots, and maps keys 1 to 3', () => {
    const takes = [{ src: 'a', sameLine: true, line: '' }, null, { src: 'c', sameLine: true, line: '' }];
    expect(nextSlot(takes, -1)).toBe(0);
    expect(nextSlot(takes, 0)).toBe(2);
    expect(nextSlot(takes, 2)).toBeNull();
    expect(slotForKey('1', 3)).toBe(0);
    expect(slotForKey('3', 2)).toBeNull();
    expect(slotForKey('x', 3)).toBeNull();
  });
});

describe('story art and page overview (read-only on the real library)', () => {
  it('baselineFor prefers the decision text, then a differing voiced text', () => {
    expect(baselineFor('new', 'old', 'voiced')).toBe('old');
    expect(baselineFor('new', 'new', 'voiced')).toBe('voiced');
    expect(baselineFor('new', undefined, 'new')).toBeNull();
  });
  it('parseStorySource and sceneArt read art urls and panel crops', () => {
    const source = [
      'export const x = retime({',
      '  scenes: [',
      '    {',
      '      id: "s",',
      '      art: "/comic/home/home-quote-20261010-device-v2",',
      '      panels: [',
      '        { at: 1, room: "street", r: [0,0,0.34,0.4], ar: [0.1,0.2,0.3,0.4], img: "p1", alt: "A \\"quoted\\" thing", balloons: [',
      '          {"at":1.5,"kind":"place","text":"Toronto."},',
      '        ] },',
      '        { at: 8, room: "office", r: [0,0.5,1,0.5], img: "p2", alt: "" },',
      '      ],',
      '    },',
      '    {',
      '      id: "nested",',
      '      art: "/comic/agentic/live-20261010/agentic-five-composite-selected-v4",',
      '      panels: [],',
      '    },',
      '    {',
      '      id: "dots",',
      '      art: "/comic/agentic/../../secret",',
      '      panels: [],',
      '    },',
      '    {',
      '      id: "bad",',
      '      art: "../../etc/passwd",',
      '      panels: [],',
      '    },',
      '  ],',
      '});',
    ].join('\n');
    const parsed = parseStorySource(source);
    expect(parsed.map((x) => x.id)).toEqual(['s', 'nested', 'dots', 'bad']);
    expect(parsed[0]?.panels).toHaveLength(2);
    expect(parsed[0]?.panels[0]).toMatchObject({ img: 'p1', ar: [0.1, 0.2, 0.3, 0.4], r: [0, 0, 0.34, 0.4] });
    const [s, nested, dots, bad] = sceneArt(parsed, () => true);
    expect(nested?.thumb).toContain('live-20261010%2Fagentic-five-composite-selected-v4-1600.webp');
    expect(dots?.art).toBeNull();
    expect(s?.thumb).toContain('home-quote-20261010-device-v2-1600.webp');
    expect(s?.panels.map((p) => p.crop)).toEqual([[0.1, 0.2, 0.3, 0.4], [0, 0.5, 1, 0.5]]);
    expect(bad?.thumb).toBeNull();
    expect(sceneArt(parsed, () => false)[0]?.thumb).toBeNull();
  });
  it('every story source agrees with the library on scenes, panels and balloon addresses', async () => {
    const wiki = new FileWikiStore(repoRoot);
    const snap = await new Library(repoRoot, (p) => wiki.readJson(p), { snapshotFile: comicsSnapshot() }).snapshot();
    const stories = new StoryArt(repoRoot);
    for (const comic of snap.derived.comics) {
      const art = await stories.scenes(comic.textReview[0]?.storySource.path ?? '');
      if (comic.id === 'demo') {
        expect(art, 'the lab demo is hand-written in another shape and shows no crops').toEqual([]);
        continue;
      }
      expect(art.length, `${comic.id} parses at least one scene`).toBeGreaterThanOrEqual(1);
      expect(art.map((a) => a.id), comic.id).toEqual(comic.scenes.map((x) => x.id));
      for (const scene of comic.scenes) expect(art.find((a) => a.id === scene.id)?.panels.length, `${comic.id}/${scene.id}`).toBe(scene.panels);
      for (const row of comic.textReview) {
        const panel = art.find((a) => a.id === row.sceneId)?.panels[row.panelIndex];
        expect(panel?.img, row.id).toBe(row.panelId);
      }
    }
  });
  it('the home story yields crops for its review rows, and pages tally balloons per scene', async () => {
    const wiki = new FileWikiStore(repoRoot);
    const library = new Library(repoRoot, (p) => wiki.readJson(p), { snapshotFile: comicsSnapshot() });
    const snap = await library.snapshot();
    const comic = snap.derived.comics.find((c) => c.id === 'home');
    expect(comic).toBeTruthy();
    if (!comic) return;
    const art = await new StoryArt(repoRoot).scenes(comic.textReview[0]?.storySource.path ?? '');
    expect(art.length).toBeGreaterThanOrEqual(1);
    expect(art.length).toBe(comic.scenes.length);
    const rows = speechRows(snap, { art: new Map([['home', art]]) }).filter((r) => r.storyId === 'home');
    expect(rows).toHaveLength(comic.textReview.length);
    expect(rows.some((r) => r.crop)).toBe(true);
    for (const r of rows) if (r.crop) expect(r.crop.rect.every((n) => n >= 0 && n <= 1)).toBe(true);
    const pages = pagesView(snap, comic, art);
    expect(pages.reduce((n, s) => n + s.balloons, 0)).toBe(comic.textReview.length);
    for (const s of pages) {
      expect(s.counts.total).toBe(s.balloons);
      expect(s.panels.reduce((n, p) => n + p.balloons.length, 0)).toBe(s.balloons);
    }
  });
});
