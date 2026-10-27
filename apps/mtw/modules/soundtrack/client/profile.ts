// Migrated from retired git 51eb6e03:wiki/soundtrack-library/index.html: bandsOf, the frequency lane maths, the stats, the credit snippets. Pure.
import type { Profile, Track } from '../types';

export const fmtTime = (s: number | null | undefined): string => {
  if (s == null || Number.isNaN(s)) return '–';
  const m = Math.floor(s / 60);
  const x = Math.floor(s % 60);
  return `${m}:${x < 10 ? '0' : ''}${x}`;
};

const decoded = new WeakMap<object, Uint8Array>();

/**
 * Decode the base64 band-major frequency data, scaling each band to its own min/max. This per-band scaling is load-bearing:
 * it is what lets quiet upper bands (hats, shimmer) read. The stored data keeps true relative levels across bands.
 */
export function bandsOf(p: Pick<Profile, 'frequency'> | null): Uint8Array | null {
  if (!p) return null;
  const cached = decoded.get(p);
  if (cached) return cached;
  const bin = atob(p.frequency.data);
  const u = new Uint8Array(bin.length);
  const nf = p.frequency.frames;
  const nb = p.frequency.bands.length;
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  for (let b = 0; b < nb; b++) {
    let mx = 1;
    let mn = 255;
    for (let f = 0; f < nf; f++) {
      const v = u[b * nf + f] as number;
      if (v > mx) mx = v;
      if (v < mn) mn = v;
    }
    const span = Math.max(1, mx - mn);
    for (let f = 0; f < nf; f++) u[b * nf + f] = Math.round((((u[b * nf + f] as number) - mn) / span) * 255);
  }
  decoded.set(p, u);
  return u;
}

/** Frame (column of the data) under pixel `px` of a lane `width` px wide. */
export const laneFrame = (px: number, width: number, frames: number): number => Math.min(frames - 1, Math.floor((px / width) * frames));

/** CSS colour of one lane cell, v in 0..1. */
export const laneColor = (v: number): string =>
  `rgba(${Math.round(26 + 69 * v)},${Math.round(155 + 41 * v)},${Math.round(161 + 40 * v)},${(v * v * 0.95).toFixed(3)})`;

/** Level (0..1) of every band at time t, as the live meters and the tile preview read it. */
export function levelsAt(u: Uint8Array, p: Pick<Profile, 'frequency'>, t: number, silent: boolean): number[] {
  const nf = p.frequency.frames;
  const fr = Math.min(nf - 1, Math.max(0, Math.floor(t * p.frequency.fps)));
  const out: number[] = [];
  for (let b = 0; b < 8; b++) out.push(silent ? 0 : (u[b * nf + fr] as number) / 255);
  return out;
}

/** Heights (0.2..1) of the four equalizer bars in the credit tag. */
export function eqLevels(u: Uint8Array | null, p: Pick<Profile, 'frequency'> | null, t: number, playing: boolean): number[] {
  return [1, 3, 5, 7].map((band) => {
    if (!u || !p || !playing) return 0.3;
    const nf = p.frequency.frames;
    const f = Math.min(nf - 1, Math.floor(t * p.frequency.fps));
    return 0.2 + ((u[band * nf + f] as number) / 255) * 0.8;
  });
}

/** A count, then the first few beats (a busy track has dozens of accents). */
export const listBeats = (a: number[]): string => (a.length ? `${a.length}: ${a.slice(0, 5).join(', ')}${a.length > 5 ? ' …' : ''}` : 'none');

export function creditText(t: Pick<Track, 'credit'>): string {
  return t.credit ? t.credit.text + (t.credit.href ? ` (${t.credit.href})` : '') : '';
}

/** The `music:` line a story data file takes. */
export function creditSnippet(t: Pick<Track, 'credit' | 'file' | 'beatMap'>): string {
  if (!t.credit) return '';
  const bm = t.beatMap;
  return `music: { src: '/audio/${t.file}', offset: ${bm ? bm.offset : 0}, credit: '${t.credit.text.replace(/'/g, "\\'")}', source: ${t.credit.href ? `'${t.credit.href}'` : 'null'} }`;
}

/** The 16 measurements shown in the detail panel; empty when the track is not profiled. */
export function trackStats(t: Track): [string, string][] {
  const bm = t.beatMap;
  const sm = t.summary;
  if (!bm || !sm) return [];
  return [
    ['Tempo', `${bm.bpm} BPM`],
    ['First downbeat', `${bm.offset} s`],
    ['Feel', `${sm.feel} (${Math.round((sm.feelFit[sm.feel] || 0) * 100)}%)`],
    ['Hits sit at', `+${sm.hitPhaseBeats} beat`],
    ['Length', fmtTime(bm.duration)],
    ['Ends on beat', String(bm.endBeat)],
    ['Loop', `${bm.loopBeats} beats · ${bm.loopSeconds} s`],
    ['Phrases', `${bm.phrases.length} × ${bm.phraseLength}`],
    ['Dead stops', listBeats(bm.stops)],
    ['Accents', listBeats(bm.hits)],
    ['Intro', `${sm.introBeats} beats`],
    ['Loudness', `${sm.rmsDbfs} dBFS`],
    ['Dynamics', `${sm.dynamicsDb} dB`],
    ['Brightness', `${sm.brightnessHz} Hz`],
    ['Bass share', `${Math.round(sm.bassShare * 100)}%`],
    ['Hits per second', String(sm.onsetsPerSecond)],
  ];
}
