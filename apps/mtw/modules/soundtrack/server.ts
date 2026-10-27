// Migrated from the retired `soundtrack.mjs serve` and soundtrack console (git 51eb6e03:wiki/soundtrack-library/index.html).
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { HttpError } from '../../server/router';
import type { HandlerInput, ModuleSummary, ServerModule, Services } from '../types';
import { contentTypeFor, resolveComicAudioRequest, resolveLibraryAudio } from './server/audio';
import { meta } from './meta';
import { reviewComicAudio } from './server/comic-review';
import { ComicAudioStore, comicResolver, sndResolver } from './server/resolver';
import { SoundtrackStore } from './server/store';

const PRODUCER = '.claude/skills/mtw-soundtrack/scripts/soundtrack.mjs';
const PIXABAY = 'https://pixabay.com';
/** The limits of the retired `soundtrack.mjs serve`; the core's own body cap applies first. */
const TRACK_CAP = 10_000;
const COLLECTED_CAP = 5_000_000;

// One store (and so one write queue) per Services, shared by the module routes and the legacy root routes.
const stores = new WeakMap<Services, SoundtrackStore>();
export function storeFor(services: Services): SoundtrackStore {
  let store = stores.get(services);
  if (!store) stores.set(services, (store = new SoundtrackStore(services)));
  return store;
}

/** Track id -> audio file mtime (ms), re-read only when the track list changes. */
let timesCache: { key: string; times: Map<string, number> } | null = null;
async function trackTimes(libDir: string, tracks: { id: string; file: string; asset?: { file: string } | null }[]): Promise<Map<string, number>> {
  const key = `${libDir}|${tracks.map((t) => t.id).join(',')}`;
  if (timesCache?.key === key) return timesCache.times;
  const times = new Map<string, number>();
  await Promise.all(
    tracks.map(async (t) => {
      const rel = t.asset?.file ?? `assets/${t.file}`;
      try {
        times.set(t.id, (await fs.stat(path.join(libDir, rel))).mtimeMs);
      } catch {
        /* a missing file has no arrival time */
      }
    }),
  );
  timesCache = { key, times };
  return times;
}

const originOf = (req: HandlerInput): string | undefined => {
  const o = req.headers.origin;
  return Array.isArray(o) ? o[0] : o;
};
const loopbackOrigin = (origin: string): boolean => {
  try {
    return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(new URL(origin).hostname);
  } catch {
    return false;
  }
};

/**
 * A page on another origin must not be able to drive the buttons (a simple cross-site POST needs no CORS preflight).
 * No Origin header (curl, a script) and loopback origins pass; `allow` names extra origins (the Pixabay collector tab).
 */
export function checkOrigin(req: HandlerInput, allow: string[] = []): void {
  const origin = originOf(req);
  if (origin === undefined || allow.includes(origin) || loopbackOrigin(origin)) return;
  throw new HttpError(403, 'origin not allowed');
}

const sizeOf = (body: unknown): number => (body === undefined ? 0 : JSON.stringify(body).length);

export const server: ServerModule = {
  meta,
  async summary(services): Promise<ModuleSummary> {
    // library() reads the cached manifest (re-read only when its size or mtime changes).
    const store = storeFor(services);
    const lib = await store.library().catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    const candidates = lib ? lib.counts.candidates : undefined;
    const href = '/m/soundtrack?status=candidate';
    const source = 'wiki/soundtrack-library/manifest.json';
    // Arrival times: each track's audio file mtime (the manifest records no add date), cached per manifest version.
    const times = lib ? await trackTimes(store.libDir, lib.tracks) : new Map<string, number>();
    const cands = (lib?.tracks ?? []).filter((t) => t.status === 'candidate');
    const oldest = cands.map((t) => times.get(t.id)).filter((n): n is number => n !== undefined).sort((a, b) => a - b)[0];
    const newestTrack = (lib?.tracks ?? []).reduce<{ t: (typeof cands)[number]; at: number } | null>((best, t) => {
      const at = times.get(t.id);
      return at !== undefined && (!best || at > best.at) ? { t, at } : best;
    }, null);
    return {
      items: [{ id: 'candidates', label: 'Tracks to review', count: candidates, href, attention: (candidates ?? 0) > 0, source }],
      needs: candidates ? [{ id: 'soundtrack-candidates', title: `${candidates} candidate track${candidates === 1 ? '' : 's'}`, next: 'Play, rate and approve or reject', count: candidates, ...(oldest ? { since: new Date(oldest).toISOString() } : {}), href, action: 'Listen', source }] : [],
      ...(lib
        ? {
            library: {
              total: lib.counts.tracks,
              totalLabel: `tracks (${lib.counts.approved} approved)`,
              awaiting: candidates ?? 0,
              awaitingLabel: 'candidates to review',
              newest: newestTrack ? { label: newestTrack.t.title, at: new Date(newestTrack.at).toISOString(), href: `/m/soundtrack/track/${encodeURIComponent(newestTrack.t.id)}` } : null,
              href: '/m/soundtrack',
              source,
            },
          }
        : {}),
    };
  },
  register(router, services) {
    const store = storeFor(services);
    const comic = new ComicAudioStore(store.libDir);
    const roots = [store.libDir, path.join(services.repoRoot, 'wiki', 'comics-library'), path.join(services.repoRoot, 'site', 'public', 'scripts')];

    services.assets.register(sndResolver(services, store));
    services.assets.register(comicResolver('sfx', 'Sound effect', comic));
    services.assets.register(comicResolver('amb', 'Ambience', comic));
    services.assets.register(comicResolver('speech', 'Speech', comic));

    router.get('/library', () => store.library());
    router.get('/profile/:id', async ({ params }) => {
      const profile = await store.profile(params.id as string);
      if (!profile) throw new HttpError(404, `no profile for ${params.id}`);
      return profile;
    });
    router.get('/comic', () => comic.read());
    // Approve or reject one comic clip (approved by default); saves the decision, rebuilds comic-audio.json, logs it.
    router.post('/comic/review', (req) => {
      checkOrigin(req);
      return reviewComicAudio({ services, comic, enqueue: (fn) => store.enqueue(fn) }, req.body);
    });

    router.post('/track', (req) => {
      checkOrigin(req);
      return store.act(req.body);
    });

    // Audio and receipts, read-only, with byte ranges (the core media service). `:file` is the path under the allowlisted
    // folder, URL-encoded as ONE segment (speech/<batch>/x.mp3 is speech%2F<batch>%2Fx.mp3).
    router.get('/audio/:file', ({ params, headers }) => {
      const abs = resolveLibraryAudio(store.libDir, params.file as string);
      if (!abs) throw new HttpError(404, 'not found');
      return services.media.serve(abs, headers, { allowRoots: [path.join(store.libDir, 'assets')], cacheControl: 'no-store' });
    });
    router.get('/comic-audio/:file', ({ params, headers }) => {
      const abs = resolveComicAudioRequest(services.repoRoot, store.libDir, params.file as string);
      if (!abs) throw new HttpError(404, 'not found');
      const contentType = contentTypeFor(abs);
      return services.media.serve(abs, headers, { allowRoots: roots, cacheControl: 'no-store', ...(contentType ? { contentType } : {}) });
    });

    // Read-only library check (the producer's own `check`); a rebuild is the soundtrack-rebuild-check operation.
    router.post('/check', async () => {
      const r = await services.wiki.runProducer('node', [PRODUCER, 'check']);
      return { ok: r.code === 0, problems: r.stdout.split('\n').filter((l) => l.startsWith('PROBLEM')), output: r.stdout.trim() };
    });

    // Legacy endpoints at their old root paths, until the Pixabay collector (pixabay-collect.js) is retired in Phase 8.
    router.rootPost('/api/track', (req) => {
      checkOrigin(req);
      if (sizeOf(req.body) > TRACK_CAP) throw new HttpError(413, 'request body too large');
      return store.act(req.body);
    });
    router.rootPost(
      '/api/collected',
      (req) => {
        checkOrigin(req, [PIXABAY]);
        if (sizeOf(req.body) > COLLECTED_CAP) throw new HttpError(413, 'request body too large');
        return store.collect(req.body);
      },
      { cors: PIXABAY },
    );
  },
};
