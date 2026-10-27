// Asset resolvers: snd:<track> (wiki/soundtrack-library/manifest.json) and sfx:/amb:/speech:<id> (comic-audio.json).
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { AssetResolver, AssetSummary, Services } from '../../types';
import { comicPrefix } from '../prefix';
import type { ComicPrefix } from '../prefix';
import type { ComicAudio, ComicAudioRecord, Track } from '../types';
import type { SoundtrackStore } from './store';

export { comicPrefix };
export type { ComicPrefix };

/** A repo or library path as ONE URL segment (the core router matches `:file` against a single segment). */
export const encodePath = (p: string): string => encodeURIComponent(p);

export function trackStatus(status: string): string {
  return status === 'approved' ? 'approved' : status === 'candidate' ? 'candidate' : status === 'needs source' ? 'blocked' : status === 'withdrawn' ? 'withdrawn' : status;
}

export function comicStatus(r: Pick<ComicAudioRecord, 'productionApproved'>): string {
  return r.productionApproved ? 'approved' : 'candidate';
}

export class ComicAudioStore {
  private cache: { key: string; value: ComicAudio } | null = null;
  constructor(private libDir: string) {}

  async read(): Promise<ComicAudio> {
    const file = path.join(this.libDir, 'comic-audio.json');
    const st = await fs.stat(file);
    const key = `${st.mtimeMs}:${st.size}`;
    if (!this.cache || this.cache.key !== key) {
      const raw = JSON.parse(await fs.readFile(file, 'utf8')) as ComicAudio;
      this.cache = { key, value: { counts: raw.counts, records: raw.records } };
    }
    return this.cache.value;
  }
}

function page<T>(items: T[], query: { limit?: number; offset?: number }): { items: T[]; total: number } {
  const offset = Math.max(0, query.offset ?? 0);
  const limit = Math.max(1, query.limit ?? 50);
  return { items: items.slice(offset, offset + limit), total: items.length };
}

export function sndResolver(services: Services, store: SoundtrackStore): AssetResolver {
  const summarize = async (t: Track): Promise<AssetSummary> => {
    const integration = `site/public/audio/${t.file}`;
    const hasIntegration = await fs.access(path.join(services.repoRoot, integration)).then(
      () => true,
      () => false,
    );
    return {
      ref: `snd:${t.id}`,
      title: `${t.title} - ${t.artist}`,
      status: trackStatus(t.status),
      preview: `/api/soundtrack/audio/${encodePath(t.file)}`,
      canonicalPath: `wiki/soundtrack-library/assets/${t.file}`,
      ...(hasIntegration ? { integrationSrc: `/audio/${t.file}` } : {}),
      meta: {
        artist: t.artist,
        credit: t.credit?.text ?? null,
        bpm: t.beatMap?.bpm ?? null,
        offset: t.beatMap?.offset ?? null,
        license: t.license ?? null,
        source: t.source ?? null,
        usedBy: t.usedBy ?? [],
      },
    };
  };
  return {
    prefix: 'snd',
    label: 'Sound',
    module: 'soundtrack',
    async list(query) {
      const lib = await store.library();
      const q = (query.q ?? '').trim().toLowerCase();
      const f = query.filters ?? {};
      const rank = (t: Track) => (t.status === 'approved' ? 0 : 1);
      const hits = lib.tracks
        .filter(
          (t) =>
            (!q || `${t.id} ${t.title} ${t.artist} ${t.genre ?? ''}`.toLowerCase().includes(q)) &&
            (!f.status || t.status === f.status || trackStatus(t.status) === f.status) &&
            (!f.genre || t.genre === f.genre) &&
            (!f.run || t.discovery?.run === f.run),
        )
        .map((t, i) => ({ t, i }))
        .sort((a, b) => rank(a.t) - rank(b.t) || a.i - b.i)
        .map((x) => x.t);
      const p = page(hits, query);
      return { items: await Promise.all(p.items.map(summarize)), total: p.total };
    },
    async resolve(ref) {
      if (!ref.startsWith('snd:')) return null;
      const lib = await store.library();
      const t = lib.tracks.find((x) => x.id === ref.slice(4));
      return t ? summarize(t) : null;
    },
  };
}

export function comicSummary(r: ComicAudioRecord, prefix: ComicPrefix): AssetSummary {
  const media = r.media?.path;
  return {
    ref: `${prefix}:${r.id}`,
    title: r.title,
    status: comicStatus(r),
    ...(media ? { preview: `/api/soundtrack/comic-audio/${encodePath(media)}` } : {}),
    canonicalPath: media ?? 'wiki/soundtrack-library/comic-audio.json',
    meta: {
      type: r.type,
      provider: r.provider,
      character: r.character || null,
      durationSeconds: r.durationSeconds ?? null,
      hearingReview: r.hearingReview ?? null,
      ...(r.runtime ? { runtime: r.runtime } : {}),
    },
  };
}

export function comicResolver(prefix: ComicPrefix, label: string, comic: ComicAudioStore): AssetResolver {
  return {
    prefix,
    label,
    module: 'soundtrack',
    async list(query) {
      const { records } = await comic.read();
      const q = (query.q ?? '').trim().toLowerCase();
      const f = query.filters ?? {};
      const hits = records.filter(
        (r) =>
          comicPrefix(r.type) === prefix &&
          (!q || [r.id, r.title, r.character, r.provider, r.text, r.kind, r.room].join(' ').toLowerCase().includes(q)) &&
          (!f.status || comicStatus(r) === f.status) &&
          (!f.type || r.type === f.type) &&
          (!f.character || r.characterId === f.character),
      );
      const p = page(hits, query);
      return { items: p.items.map((r) => comicSummary(r, prefix)), total: p.total };
    },
    async resolve(ref) {
      if (!ref.startsWith(`${prefix}:`)) return null;
      const { records } = await comic.read();
      const r = records.find((x) => x.id === ref.slice(prefix.length + 1) && comicPrefix(x.type) === prefix);
      return r ? comicSummary(r, prefix) : null;
    },
  };
}
