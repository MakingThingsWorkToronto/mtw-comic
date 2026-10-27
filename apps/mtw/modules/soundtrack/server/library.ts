// Lifted from .claude/skills/mtw-soundtrack/scripts/soundtrack.mjs (writeManifest, bars, credit, discovery). Pure: no I/O.
// The output must stay byte-identical to the producer's manifest.json.
import type { BeatMap, Counts, Discovery, Profile, Track } from '../types';

export const ANALYSIS_VERSION = 2; // mirrors the producer; bump together with analyze-audio.mjs
export const LIB = 'wiki/soundtrack-library';
export const BANDS = ['sub 20-60 Hz', 'bass 60-150', 'low-mid 150-400', 'mid 400-1k', 'upper-mid 1-2.5k', 'presence 2.5-5k', 'brilliance 5-10k', 'air 10-16k'];

export interface Sources {
  about?: string;
  downloadsDir?: string;
  tracks: Track[];
}

/** The credit always names the track and artist; it links to the track's page when one is known. */
export function credit(t: Pick<Track, 'title' | 'artist' | 'source'>): { text: string; href: string | null } | null {
  return t.title && t.artist ? { text: `Music: ${t.title} by ${t.artist}`, href: t.source || null } : null;
}

/** Loudness per bar (4 beats), for the list sparkline. */
export function bars(beats: number[] | undefined | null, bm: Pick<BeatMap, 'endBeat'>): number[] | null {
  if (!beats) return null;
  const out: number[] = [];
  for (let i = 0; i < Math.min(beats.length, bm.endBeat + 1); i += 4) out.push(Math.round(beats.slice(i, i + 4).reduce((a, b) => a + b, 0) / 4));
  return out;
}

export function emptyDiscovery(): Discovery {
  return { requests: [], runs: [] };
}

export function countsOf(tracks: Track[]): Counts {
  return {
    tracks: tracks.length,
    approved: tracks.filter((t) => t.status === 'approved').length,
    candidates: tracks.filter((t) => t.status === 'candidate').length,
    profiled: tracks.filter((t) => t.summary).length,
  };
}

export interface Manifest {
  about: string;
  analysisVersion: number;
  bands: string[];
  counts: Counts;
  discovery: Discovery;
  tracks: Track[];
}

/** Every track with its credit and the profile's summary (heavy arrays stay in profiles/), plus discovery. */
export function buildManifest(sources: Sources, discovery: Discovery, profileOf: (t: Track) => Profile | null): Manifest {
  const tracks = sources.tracks.map((t) => {
    const p = profileOf(t);
    const { beats, ...beatMap } = p ? p.beatMap : ({} as Profile['beatMap']);
    return {
      ...t,
      credit: credit(t),
      asset: p ? (p as unknown as { asset: Track['asset'] }).asset : null,
      beatMap: p ? beatMap : null,
      summary: p ? p.summary : null,
      profile: p ? `profiles/${t.id}.json` : null,
      energy: p ? bars(beats, p.beatMap) : null,
    } as Track;
  });
  return {
    about: 'Soundtrack library: approved music for MTW motion graphics (skill: mtw-soundtrack). Facts: wiki/site/soundtrack-library.md.',
    analysisVersion: ANALYSIS_VERSION,
    bands: BANDS,
    counts: countsOf(tracks),
    discovery,
    tracks,
  };
}

export const manifestJson = (m: Manifest): string => `${JSON.stringify(m, null, 2)}\n`;

export const todayUtc = (now: Date = new Date()): string => now.toISOString().slice(0, 10);
