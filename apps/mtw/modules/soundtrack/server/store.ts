// Lifted from the retired `soundtrack.mjs serve` (POST /api/track, POST /api/collected) and its manifest rebuild.
// All writes go through one queue and re-read their inputs, so concurrent clicks and external intake never clobber each other.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Services } from '../../types';
import { HttpError } from '../../../server/router';
import type { Counts, Discovery, DiscoveryRequest, Library, Profile, Track, TrackResult } from '../types';
import { LIB, buildManifest, emptyDiscovery, manifestJson, todayUtc } from './library';
import type { Manifest, Sources } from './library';

const LOG = 'soundtrack-library';

export interface StoreOptions {
  now?: () => Date;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export class SoundtrackStore {
  readonly libDir: string;
  private queue: Promise<unknown> = Promise.resolve();
  private manifestCache: { key: string; value: Manifest } | null = null;

  constructor(private services: Services, private opts: StoreOptions = {}) {
    this.libDir = path.join(services.repoRoot, 'wiki', 'soundtrack-library');
  }

  private now(): Date {
    return this.opts.now ? this.opts.now() : new Date();
  }

  /** Run `fn` after every earlier write has finished, whether or not that write failed. */
  enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.queue.then(fn, fn);
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async readSources(): Promise<Sources> {
    return this.services.wiki.readJson<Sources>(`${LIB}/sources.json`);
  }

  private async readDiscovery(): Promise<Discovery> {
    if (!(await this.services.wiki.exists(`${LIB}/discovery.json`))) return emptyDiscovery();
    return this.services.wiki.readJson<Discovery>(`${LIB}/discovery.json`);
  }

  /** Profiles are large and only change when the producer rebuilds them, so parsed copies are kept until the file changes. */
  private profileCache = new Map<string, { key: string; value: Profile }>();

  private async readProfile(id: string): Promise<Profile | null> {
    const rel = `${LIB}/profiles/${id}.json`;
    try {
      const st = await fs.stat(path.join(this.libDir, 'profiles', `${id}.json`));
      const key = `${st.mtimeMs}:${st.size}`;
      const hit = this.profileCache.get(id);
      if (hit && hit.key === key) return hit.value;
      const value = await this.services.wiki.readJson<Profile>(rel);
      this.profileCache.set(id, { key, value });
      return value;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  }

  /** Rebuild manifest.json from sources + discovery + profiles, exactly as the producer does. */
  private async writeManifest(sources: Sources, discovery: Discovery): Promise<Manifest> {
    const profiles = new Map<string, Profile | null>();
    for (const t of sources.tracks) profiles.set(t.id, await this.readProfile(t.id));
    const manifest = buildManifest(sources, discovery, (t) => profiles.get(t.id) ?? null);
    await this.services.wiki.writeText(`${LIB}/manifest.json`, manifestJson(manifest));
    this.manifestCache = null;
    return manifest;
  }

  private async guarded<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof HttpError) throw error;
      if (/is leased to/.test((error as Error).message)) throw new HttpError(409, (error as Error).message);
      throw error;
    }
  }

  /** approve | unapprove | rate | similar for one track. Same checks, statuses and messages as the legacy server. */
  act(msg: unknown): Promise<TrackResult> {
    return this.enqueue(() => this.guarded(() => this.actNow(msg)));
  }

  private async actNow(msg: unknown): Promise<TrackResult> {
    if (!isObject(msg)) throw new HttpError(400, 'bad JSON');
    // Re-read on every click: an intake or discovery run may have changed the registry while the server ran.
    const sources = await this.readSources();
    const t = sources.tracks.find((x) => x.id === msg.id);
    if (!t) throw new HttpError(404, `no track ${String(msg.id)}`);
    const action = msg.action;
    let decision: { action: string; value?: unknown } | null = null;
    let requestId: string | undefined;
    let discovery = await this.readDiscovery();
    let writeSources = true;

    if (action === 'approve') {
      if (t.status !== 'candidate') throw new HttpError(409, `${t.id} is ${t.status}, not a candidate`);
      if (!t.title || !t.artist || !t.license || !(t.source || t.note)) throw new HttpError(409, `${t.id} lacks its credit or licence`);
      Object.assign(t, { status: 'approved', approved: todayUtc(this.now()), approvedVia: 'console' });
      decision = { action: 'approve' };
    } else if (action === 'unapprove') {
      // Undo is only for a console approval no page uses yet.
      if (t.approvedVia !== 'console' || (t.usedBy || []).length) throw new HttpError(409, `${t.id} was not approved from the console or is in use`);
      t.status = 'candidate';
      delete t.approved;
      delete t.approvedVia;
      decision = { action: 'unapprove' };
    } else if (action === 'rate') {
      if (msg.rating === 0 || msg.rating === null) delete t.rating;
      else if (Number.isInteger(msg.rating) && (msg.rating as number) >= 1 && (msg.rating as number) <= 5) t.rating = msg.rating as number;
      else throw new HttpError(400, 'rating is 1-5, or 0 to clear');
      decision = { action: 'rate', value: t.rating ?? 0 };
    } else if (action === 'similar') {
      writeSources = false;
      const open = discovery.requests.find((r) => r.basis === t.id && r.status === 'open');
      if (open) {
        requestId = open.id;
      } else {
        const request: DiscoveryRequest = { id: `req-${todayUtc(this.now())}-${t.id}`, basis: t.id, title: t.title, artist: t.artist, requested: this.now().toISOString(), by: 'console', status: 'open' };
        discovery = { ...discovery, requests: [...discovery.requests, request] };
        await this.services.wiki.writeJson(`${LIB}/discovery.json`, discovery);
        requestId = request.id;
        decision = { action: 'request-similar', value: request.id };
      }
    } else {
      throw new HttpError(400, 'action is approve, unapprove, rate or similar');
    }

    if (writeSources) await this.services.wiki.writeJson(`${LIB}/sources.json`, sources);
    const manifest = await this.writeManifest(sources, discovery);
    let logged = false;
    if (decision) {
      // The click is already saved; a log failure must not undo it.
      logged = await this.services.decisions
        .append(LOG, { actor: 'matt', module: 'soundtrack', subject: `snd:${t.id}`, action: decision.action, ...(decision.value !== undefined ? { value: decision.value } : {}) })
        .then(
          () => true,
          () => false,
        );
    }
    const track = manifest.tracks.find((x) => x.id === t.id) as Track;
    return { track, counts: manifest.counts as Counts, discovery: manifest.discovery, logged, ...(requestId ? { requestId } : {}) };
  }

  /** Save what the discovery collector read in a Pixabay tab as a new records/ file; never over an existing one. */
  collect(msg: unknown): Promise<{ file: string; count: number }> {
    return this.enqueue(() =>
      this.guarded(async () => {
        if (!isObject(msg)) throw new HttpError(400, 'name and records');
        const name = String(msg.name || '').replace(/[^a-z0-9-]/gi, '').slice(0, 80);
        if (!name || !Array.isArray(msg.records)) throw new HttpError(400, 'name and records');
        let rel = `${LIB}/records/${name}.json`;
        for (let n = 2; await this.services.wiki.exists(rel); n++) rel = `${LIB}/records/${name}-${n}.json`;
        await this.services.wiki.writeJson(rel, { name, saved: this.now().toISOString(), from: msg.from || null, records: msg.records });
        return { file: rel, count: msg.records.length };
      }),
    );
  }

  /** The manifest the list view shows (cached until the file changes), with discovery read fresh. */
  async library(): Promise<Library> {
    const file = path.join(this.libDir, 'manifest.json');
    const st = await fs.stat(file);
    const key = `${st.mtimeMs}:${st.size}`;
    if (!this.manifestCache || this.manifestCache.key !== key) {
      this.manifestCache = { key, value: JSON.parse(await fs.readFile(file, 'utf8')) as Manifest };
    }
    const m = this.manifestCache.value;
    return { bands: m.bands, counts: m.counts, discovery: await this.readDiscovery(), tracks: m.tracks };
  }

  async profile(id: string): Promise<Profile | null> {
    if (!/^[A-Za-z0-9._-]+$/.test(id)) return null;
    return this.readProfile(id);
  }
}
