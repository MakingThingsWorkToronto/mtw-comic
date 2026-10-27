// Client data for the soundtrack module: the library, comic audio, the review actions. Shared by the list, detail and pickers.
import { signal } from '@preact/signals';
import { api } from '../../../web/api';
import type { ComicAudio, ComicAudioRecord, Library, Profile, Track, TrackAction, TrackResult } from '../types';
import type { Loaded } from './player';

const BASE = '/api/soundtrack';

export const library = signal<Library | null>(null);
export const comicAudio = signal<ComicAudio | null>(null);
export const loadError = signal('');
/** Last failed save, shown above the list until the next successful one. */
export const saveError = signal('');
/** Track ids with a save in flight (their buttons are disabled). */
export const busy = signal<ReadonlySet<string>>(new Set());

// A path travels as ONE URL segment (speech/<batch>/x.mp3 is speech%2F<batch>%2Fx.mp3).
export const audioSrc = (file: string): string => `${BASE}/audio/${encodeURIComponent(file)}`;
export const comicSrc = (repoPath: string): string => `${BASE}/comic-audio/${encodeURIComponent(repoPath)}`;

export function trackItem(t: Track): Loaded {
  return { key: `snd:${t.id}`, src: audioSrc(t.file), title: t.title, subtitle: t.artist, ...(t.beatMap ? { duration: t.beatMap.duration } : {}) };
}

export async function refreshLibrary(): Promise<void> {
  try {
    library.value = await api.get<Library>(`${BASE}/library`);
    loadError.value = '';
  } catch (e) {
    loadError.value = (e as Error).message;
  }
}

export async function refreshComic(): Promise<void> {
  try {
    comicAudio.value = await api.get<ComicAudio>(`${BASE}/comic`);
  } catch (e) {
    loadError.value = (e as Error).message;
  }
}

export const fetchProfile = (id: string): Promise<Profile> => api.get<Profile>(`${BASE}/profile/${encodeURIComponent(id)}`);

function setBusy(id: string, on: boolean): void {
  const next = new Set(busy.value);
  if (on) next.add(id);
  else next.delete(id);
  busy.value = next;
}

/** One review click. The server re-reads sources.json, writes it, rebuilds the manifest and logs the decision. */
export async function act(id: string, action: TrackAction, rating?: number): Promise<TrackResult | null> {
  setBusy(id, true);
  try {
    const res = await api.post<TrackResult>(`${BASE}/track`, { action, id, ...(rating !== undefined ? { rating } : {}) });
    const lib = library.value;
    if (lib) library.value = { ...lib, counts: res.counts, discovery: res.discovery, tracks: lib.tracks.map((t) => (t.id === id ? res.track : t)) };
    saveError.value = res.logged ? '' : 'Saved, but the decision could not be written to decisions.jsonl.';
    return res;
  } catch (e) {
    saveError.value = `Not saved: ${(e as Error).message}`;
    return null;
  } finally {
    setBusy(id, false);
  }
}

/** Approve or reject one comic clip. The server saves the decision, rebuilds comic-audio.json and logs it. */
export async function reviewComic(id: string, approval: 'approved' | 'rejected'): Promise<boolean> {
  setBusy(id, true);
  try {
    const res = await api.post<{ record: ComicAudioRecord; logged: boolean }>(`${BASE}/comic/review`, { id, approval });
    const data = comicAudio.value;
    if (data) comicAudio.value = { ...data, records: data.records.map((r) => (r.id === id ? res.record : r)) };
    saveError.value = res.logged ? '' : 'Saved, but the decision could not be written to decisions.jsonl.';
    return true;
  } catch (e) {
    saveError.value = `Not saved: ${(e as Error).message}`;
    return false;
  } finally {
    setBusy(id, false);
  }
}
