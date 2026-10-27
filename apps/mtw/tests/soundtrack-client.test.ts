import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { filterRecords, sortRecords } from '../modules/soundtrack/client/comic-filters';
import { DEFAULT_FILTERS, SORTS, filterTracks, filtersFromQuery, queryPatch } from '../modules/soundtrack/client/filters';
import type { Filters } from '../modules/soundtrack/client/filters';
import { nextRow, rowAction, shouldTogglePlay } from '../modules/soundtrack/client/keyboard';
import { bandsOf, creditSnippet, creditText, eqLevels, laneColor, laneFrame, levelsAt, listBeats, trackStats } from '../modules/soundtrack/client/profile';
import { comicPrefix } from '../modules/soundtrack/prefix';
import type { ComicAudioRecord, Profile, Track } from '../modules/soundtrack/types';
import { liveLib } from './soundtrack-fixture';

const manifest = JSON.parse(readFileSync(path.join(liveLib, 'manifest.json'), 'utf8')) as { tracks: Track[] };

/** The legacy filtered(): index.html lines 205-219, with the DOM controls replaced by a state object. */
function legacyFiltered(tracks: Track[], s: { q: string; genre: string; feel: string; status: string; bmin: string; bmax: string; rating: string; found: string; sort: string }): Track[] {
  const q = s.q.toLowerCase();
  const g = s.genre;
  const f = s.feel;
  const st = s.status;
  const lo = +s.bmin || 0;
  const hi = +s.bmax || 999;
  const rt = s.rating;
  const fd = s.found;
  const out = tracks.filter((t) => {
    const bpm = t.beatMap ? t.beatMap.bpm : 0;
    return (
      (!q || (t.title + ' ' + t.artist + ' ' + (t.genre || '')).toLowerCase().indexOf(q) > -1) &&
      (!g || t.genre === g) &&
      (!f || (t.summary && t.summary.feel === f)) &&
      (!st || t.status === st) &&
      (!bpm || (bpm >= lo && bpm <= hi)) &&
      (rt === '' || (rt === '0' ? !t.rating : (t.rating || 0) >= +rt)) &&
      (!fd || (t.discovery && t.discovery.run === fd))
    );
  });
  const key = s.sort;
  const val = (t: Track): number | string => {
    switch (key) {
      case 'duration':
        return t.beatMap ? t.beatMap.duration : 0;
      case 'energy':
        return t.summary ? t.summary.rmsDbfs : -99;
      case 'bright':
        return t.summary ? t.summary.brightnessHz : 0;
      case 'title':
        return t.title.toLowerCase();
      case 'published':
        return t.published || '';
      case 'rating':
        return t.rating || 0;
      case 'discovered':
        return t.discovery ? t.discovery.run + '#' + (1000 + t.discovery.rank) : '~';
      default:
        return t.beatMap ? t.beatMap.bpm : 0;
    }
  };
  return out.sort((a, b) => {
    const x = val(a) as never;
    const y = val(b) as never;
    return key === 'title' || key === 'discovered' ? (x < y ? -1 : x > y ? 1 : 0) : key === 'published' || key === 'energy' || key === 'bright' || key === 'rating' ? (x < y ? 1 : x > y ? -1 : 0) : (x as number) - (y as number);
  });
}

describe('filter and sort', () => {
  // The manifest has few ratings; give some tracks one so the rating filter and sort have something to order.
  const tracks: Track[] = manifest.tracks.map((t, i) => (i % 7 === 0 ? { ...t, rating: (i % 5) + 1 } : t));
  const genre = tracks.find((t) => t.genre)?.genre as string;
  const run = tracks.find((t) => t.discovery)?.discovery?.run as string;
  const combos: Partial<Filters>[] = [
    {},
    { q: 'a' },
    { q: 'funk' },
    { genre },
    { feel: 'straight' },
    { feel: 'triplet' },
    { status: 'approved' },
    { status: 'candidate' },
    { bmin: '90', bmax: '120' },
    { bmin: '140' },
    { bmax: '80' },
    { rating: '0' },
    { rating: '4' },
    { rating: '3' },
    { found: run },
    { status: 'candidate', genre, bmin: '70', bmax: '130', rating: '' },
  ];

  it('has real data to compare', () => {
    expect(tracks.length).toBeGreaterThan(100);
    expect(genre).toBeTruthy();
    expect(run).toBeTruthy();
  });

  for (const sort of SORTS.map((s) => s.value)) {
    it(`orders exactly as the legacy console does for sort=${sort}`, () => {
      for (const combo of combos) {
        const f: Filters = { ...DEFAULT_FILTERS, ...combo, sort };
        expect(filterTracks(tracks, f).map((t) => t.id), JSON.stringify(f)).toEqual(legacyFiltered(tracks, f).map((t) => t.id));
      }
    });
  }

  it('round-trips filters through the URL and drops defaults', () => {
    const q = new URLSearchParams('q=hi&sort=title&status=candidate&bmin=80');
    expect(filtersFromQuery(q)).toEqual({ ...DEFAULT_FILTERS, q: 'hi', sort: 'title', status: 'candidate', bmin: '80' });
    expect(filtersFromQuery(new URLSearchParams('sort=bogus')).sort).toBe('bpm');
    expect(queryPatch('sort', 'bpm')).toEqual({ sort: undefined });
    expect(queryPatch('sort', 'title')).toEqual({ sort: 'title' });
    expect(queryPatch('q', '')).toEqual({ q: undefined });
  });
});

describe('profile maths', () => {
  const b64 = (bytes: number[]) => Buffer.from(bytes).toString('base64');
  const profile = (bytes: number[], frames: number, bands: number): Pick<Profile, 'frequency'> => ({ frequency: { data: b64(bytes), frames, fps: 20, bands: Array.from({ length: bands }, (_, i) => `b${i}`) } });

  it('decodes band-major data and scales each band to its own range', () => {
    // Band 0 runs 10..50, band 1 is constant (span floors at 1), band 2 runs 0..255.
    const p = profile([10, 20, 30, 50, 100, 100, 100, 100, 0, 51, 102, 255], 4, 3);
    expect(Array.from(bandsOf(p) as Uint8Array)).toEqual([0, 64, 128, 255, 0, 0, 0, 0, 0, 51, 102, 255]);
    // Cached: a second call returns the same decoded array without rescaling it again.
    expect(bandsOf(p)).toBe(bandsOf(p));
    expect(bandsOf(null)).toBeNull();
  });

  it('decodes a real profile into full-range bands', () => {
    const file = readdirSync(path.join(liveLib, 'profiles')).find((f) => f.endsWith('.json')) as string;
    const p = JSON.parse(readFileSync(path.join(liveLib, 'profiles', file), 'utf8')) as Profile;
    const u = bandsOf(p) as Uint8Array;
    const nf = p.frequency.frames;
    expect(u.length).toBe(nf * p.frequency.bands.length);
    for (let b = 0; b < p.frequency.bands.length; b++) {
      const band = Array.from(u.subarray(b * nf, (b + 1) * nf));
      expect(Math.min(...band)).toBe(0);
      expect([0, 255]).toContain(Math.max(...band));
    }
  });

  it('maps lane pixels to frames and levels to colours', () => {
    expect(laneFrame(0, 100, 50)).toBe(0);
    expect(laneFrame(50, 100, 50)).toBe(25);
    expect(laneFrame(99, 100, 50)).toBe(49);
    expect(laneFrame(500, 100, 50)).toBe(49);
    expect(laneColor(0)).toBe('rgba(26,155,161,0.000)');
    expect(laneColor(1)).toBe('rgba(95,196,201,0.950)');
    expect(laneColor(0.5)).toBe('rgba(61,176,181,0.237)');
  });

  it('reads live levels and equalizer bars at a time', () => {
    const bytes = Array.from({ length: 8 * 4 }, (_, i) => i * 8);
    const p = profile(bytes, 4, 8);
    const u = new Uint8Array(bytes);
    // fps 20: t = 0.1 is frame 2.
    expect(levelsAt(u, p, 0.1, false)).toEqual(Array.from({ length: 8 }, (_, b) => (b * 32 + 2 * 8) / 255));
    expect(levelsAt(u, p, 0.1, true)).toEqual(Array(8).fill(0));
    expect(levelsAt(u, p, 99, false)[0]).toBe(24 / 255);
    expect(eqLevels(u, p, 0.1, false)).toEqual([0.3, 0.3, 0.3, 0.3]);
    expect(eqLevels(u, p, 0.1, true)[1]).toBeCloseTo(0.2 + ((3 * 32 + 16) / 255) * 0.8, 10);
  });

  it('builds the credit text and the story music line', () => {
    const t = { file: 'a.mp3', beatMap: { offset: 0.34 }, credit: { text: "Music: Don't Stop by Ann", href: 'https://example.com/x' } } as unknown as Track;
    expect(creditText(t)).toBe("Music: Don't Stop by Ann (https://example.com/x)");
    expect(creditSnippet(t)).toBe("music: { src: '/audio/a.mp3', offset: 0.34, credit: 'Music: Don\\'t Stop by Ann', source: 'https://example.com/x' }");
    const bare = { file: 'b.mp3', beatMap: null, credit: { text: 'Music: B by C', href: null } } as unknown as Track;
    expect(creditSnippet(bare)).toBe("music: { src: '/audio/b.mp3', offset: 0, credit: 'Music: B by C', source: null }");
    expect(creditText(bare)).toBe('Music: B by C');
    expect(creditSnippet({ file: 'c.mp3', beatMap: null, credit: null } as unknown as Track)).toBe('');
    // Every real credit reproduces the legacy string.
    for (const real of manifest.tracks.filter((x) => x.credit)) {
      const bm = real.beatMap;
      const legacy = "music: { src: '/audio/" + real.file + "', offset: " + (bm ? bm.offset : 0) + ", credit: '" + (real.credit?.text as string).replace(/'/g, "\\'") + "', source: " + (real.credit?.href ? "'" + real.credit.href + "'" : 'null') + ' }';
      expect(creditSnippet(real), real.id).toBe(legacy);
    }
  });

  it('lists beats and the sixteen stats', () => {
    expect(listBeats([])).toBe('none');
    expect(listBeats([1, 2, 3])).toBe('3: 1, 2, 3');
    expect(listBeats([1, 2, 3, 4, 5, 6])).toBe('6: 1, 2, 3, 4, 5 …');
    const profiled = manifest.tracks.find((t) => t.summary && t.beatMap) as Track;
    const stats = trackStats(profiled);
    expect(stats).toHaveLength(16);
    expect(stats[0]).toEqual(['Tempo', `${profiled.beatMap?.bpm} BPM`]);
    expect(trackStats({ ...profiled, summary: null })).toEqual([]);
  });
});

describe('keyboard', () => {
  const key = (code: string, tagName?: string, extra: Record<string, unknown> = {}) => ({ code, target: tagName ? { tagName, ...extra } : null, ...extra });

  it('toggles play on Space unless the focus uses Space itself', () => {
    expect(shouldTogglePlay(key('Space', 'BODY'))).toBe(true);
    expect(shouldTogglePlay(key('Space', 'DIV'))).toBe(true);
    expect(shouldTogglePlay(key('Space', 'TR'))).toBe(true);
    expect(shouldTogglePlay(key('Space'))).toBe(true);
    for (const tag of ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'SUMMARY', 'input', 'button']) expect(shouldTogglePlay(key('Space', tag)), tag).toBe(false);
    expect(shouldTogglePlay(key('Space', 'DIV', { isContentEditable: true }))).toBe(false);
    expect(shouldTogglePlay(key('Space', 'BODY', { defaultPrevented: true }))).toBe(false);
    expect(shouldTogglePlay(key('Enter', 'BODY'))).toBe(false);
    expect(shouldTogglePlay(key('KeyA', 'BODY'))).toBe(false);
  });

  it('plays a row on Enter, and toggles when it is already loaded', () => {
    expect(rowAction(null, 'snd:a')).toBe('play');
    expect(rowAction('snd:b', 'snd:a')).toBe('play');
    expect(rowAction('snd:a', 'snd:a')).toBe('toggle');
  });

  it('moves between rows with the arrow keys', () => {
    expect(nextRow(0, 5, 'ArrowDown')).toBe(1);
    expect(nextRow(4, 5, 'ArrowDown')).toBe(4);
    expect(nextRow(0, 5, 'ArrowUp')).toBe(0);
    expect(nextRow(3, 5, 'ArrowUp')).toBe(2);
    expect(nextRow(-1, 5, 'ArrowDown')).toBe(0);
    expect(nextRow(0, 0, 'ArrowDown')).toBeNull();
    expect(nextRow(0, 5, 'Enter')).toBeNull();
  });
});

describe('comic audio list', () => {
  const comic = JSON.parse(readFileSync(path.join(liveLib, 'comic-audio.json'), 'utf8')) as { records: ComicAudioRecord[] };
  const rows = comic.records;

  it('orders by type then title as the legacy console did', () => {
    const sorted = sortRecords(rows);
    expect(sorted).toHaveLength(rows.length);
    const order: Record<string, number> = { 'ambience-recording': 0, 'speech-audition': 1, 'effect-recipe': 2, 'ambient-recipe': 3, 'provider-preview': 4, 'speech-dialogue': 1, 'speech-narration': 1, 'sound-effect-recording': 0, 'review-evidence': 5 };
    const legacy = rows.slice().sort((a, b) => (order[a.type] as number) - (order[b.type] as number) || a.title.localeCompare(b.title));
    expect(sorted.map((r) => r.id)).toEqual(legacy.map((r) => r.id));
  });

  it('filters by type, character (including multi-character previews), provider and text', () => {
    const all = { q: '', type: '', character: '', provider: '', approval: '' };
    expect(filterRecords(rows, all)).toHaveLength(rows.length);
    const t = rows.find((r) => r.type === 'speech-audition') as ComicAudioRecord;
    expect(filterRecords(rows, { ...all, type: 'speech-audition' }).every((r) => r.type === 'speech-audition')).toBe(true);
    const withChar = filterRecords(rows, { ...all, character: t.characterId as string });
    expect(withChar.length).toBeGreaterThan(0);
    expect(withChar.every((r) => r.characterId === t.characterId || (r.characters || []).includes(t.characterId as string))).toBe(true);
    expect(filterRecords(rows, { ...all, provider: t.provider }).every((r) => r.provider === t.provider)).toBe(true);
    expect(filterRecords(rows, { ...all, q: (t.title as string).toUpperCase() }).map((r) => r.id)).toContain(t.id);
    expect(filterRecords(rows, { ...all, q: 'zzzz-no-such-thing' })).toHaveLength(0);
  });

  it('gives every clip a description that search finds, and approves every clip unless rejected', () => {
    const all = { q: '', type: '', character: '', provider: '', approval: '' };
    expect(rows.every((r) => typeof r.description === 'string' && r.description.length > 0)).toBe(true);
    const keys = rows.find((r) => r.type === 'effect-recipe' && r.kind === 'keys') as ComicAudioRecord;
    expect(filterRecords(rows, { ...all, q: 'typing on a keyboard' }).map((r) => r.id)).toContain(keys.id);
    expect(rows.every((r) => r.approval === 'approved' || r.approval === 'rejected')).toBe(true);
    const fake = [{ ...keys, approval: 'rejected' as const }, { ...keys, id: 'x', approval: undefined }];
    expect(filterRecords(fake, { ...all, approval: 'rejected' }).map((r) => r.id)).toEqual([keys.id]);
    expect(filterRecords(fake, { ...all, approval: 'approved' }).map((r) => r.id)).toEqual(['x']);
  });

  it('gives every record a prefix', () => {
    expect(new Set(rows.map((r) => comicPrefix(r.type)))).toEqual(new Set(['sfx', 'amb', 'speech']));
  });
});
