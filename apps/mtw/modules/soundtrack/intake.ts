// Soundtrack auto-intake (server/core/intake.ts). A new audio file under wiki/soundtrack-library/assets/ that no catalog
// lists (sources.json, or for comic speech/voices the comics-library records and their comic-audio.json projection) is
// registered where it belongs. Music (a file at the assets root) gets a sources.json entry with status 'needs source':
// never 'candidate' or 'approved', because only a credited, licensed track may be a candidate and only Matt approves.
// Comic audio (any subfolder: voices/, speech/, sounds/ ...) never enters the music registry: it gets a comic-intake.json
// row, which the comic-audio projection shows at /m/soundtrack/comic until a comic catalog lists the file. The write runs in the soundtrack store's own queue (the same queue as the
// Approve/Rate clicks), re-reads sources.json, skips files already listed, and rebuilds manifest.json
// exactly as the store does. The media file itself is never touched.
import { createHash } from 'node:crypto';
import { createReadStream, promises as fs, readFileSync } from 'node:fs';
import path from 'node:path';
import { AUDIO_ASSETS, AUDIO_EXT, checkRegistered } from '../../../../scripts/assets/media-registration.mjs';
import type { IntakeFile, IntakeOutcome, ModuleIntake, Services } from '../types';
import type { Discovery, Track } from './types';
import { LIB, emptyDiscovery, todayUtc } from './server/library';
import type { Sources } from './server/library';
import type { SoundtrackStore } from './server/store';

export const INTAKE_STATUS = 'needs source';
export const COMIC_INTAKE = `${LIB}/comic-intake.json`;
const COMIC_PRODUCER = '.claude/skills/mtw-soundtrack/scripts/comic-audio.mjs';

interface ComicIntakeRow {
  id: string;
  canonicalPath: string;
  kind: string;
  title: string;
  sha256: string;
  intake: { by: string; at: string; bytes: number };
}
const DECISIONS_LIB = 'soundtrack-library';

const hashFile = (file: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const h = createHash('sha256');
    createReadStream(file).on('data', (d) => h.update(d)).on('error', reject).on('end', () => resolve(h.digest('hex')));
  });

/** speech/<batch>/x.mp3 -> speech; voices/... -> voice; root files -> music. */
export function kindOf(sub: string): string {
  const first = sub.includes('/') ? sub.split('/')[0] : '';
  if (!first) return 'music';
  if (first === 'voices') return 'voice';
  if (first === 'sounds' || first === 'effects') return 'sound';
  return first.replace(/s$/, '');
}

export function intakeId(sub: string, taken: Set<string>): string {
  const base = `intake-${sub.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`.slice(0, 120);
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
  return id;
}

const humanize = (sub: string): string => path.posix.basename(sub).replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();

/** The hooks' reader shape (synchronous, as the shared lookup also runs in the git hook), cached for one pass. */
function cachedReader(repoRoot: string): (rel: string) => string | null {
  const cache = new Map<string, string | null>();
  return (rel) => {
    if (!cache.has(rel)) {
      let text: string | null = null;
      try {
        text = readFileSync(path.join(repoRoot, rel), 'utf8');
      } catch {
        text = null;
      }
      cache.set(rel, text);
    }
    return cache.get(rel) ?? null;
  };
}

export function createSoundtrackIntake(services: Services, store: SoundtrackStore, opts: { now?: () => Date } = {}): ModuleIntake {
  const now = (): Date => (opts.now ? opts.now() : new Date());

  return {
    lib: DECISIONS_LIB,
    defaultRoots: [AUDIO_ASSETS],
    accepts: (rel) => rel.startsWith(AUDIO_ASSETS) && AUDIO_EXT.includes(path.posix.extname(rel).slice(1).toLowerCase()),
    async unregistered(rels) {
      const read = cachedReader(services.repoRoot);
      return rels.filter((rel) => !checkRegistered(rel, read).registered);
    },
    register(files: IntakeFile[]): Promise<IntakeOutcome[]> {
      return store.enqueue(async () => {
        const music = files.filter((f) => kindOf(f.path.slice(AUDIO_ASSETS.length)) === 'music');
        const comic = files.filter((f) => kindOf(f.path.slice(AUDIO_ASSETS.length)) !== 'music');
        return [...(music.length ? await registerMusic(music) : []), ...(comic.length ? await registerComic(comic) : [])];
      });
    },
    async pending() {
      const sources = await services.wiki.readJson<Sources>(`${LIB}/sources.json`);
      const count = sources.tracks.filter((t) => t.status === INTAKE_STATUS && (t as unknown as { intake?: { by?: string } }).intake?.by === 'studio-intake').length;
      return { count, label: 'Music auto-registered, needs source and review', href: '/m/soundtrack?status=needs%20source' };
    },
  };

  async function registerComic(files: IntakeFile[]): Promise<IntakeOutcome[]> {
    const registry = (await services.wiki.exists(COMIC_INTAKE)) ? await services.wiki.readJson<{ schemaVersion: 1; records: ComicIntakeRow[] }>(COMIC_INTAKE) : { schemaVersion: 1 as const, records: [] };
    const read = cachedReader(services.repoRoot);
    const taken = new Set(registry.records.map((r) => r.id));
    const outcomes: IntakeOutcome[] = [];
    let added = 0;
    for (const f of files) {
      const sub = f.path.slice(AUDIO_ASSETS.length);
      if (checkRegistered(f.path, read).registered || registry.records.some((r) => r.canonicalPath === f.path)) continue;
      let sha256: string;
      try {
        sha256 = await hashFile(path.join(services.repoRoot, f.path));
      } catch (error) {
        outcomes.push({ path: f.path, ok: false, detail: `cannot read: ${(error as Error).message}` });
        continue;
      }
      const id = intakeId(sub, taken);
      taken.add(id);
      registry.records.push({ id, canonicalPath: f.path, kind: kindOf(sub), title: humanize(sub), sha256, intake: { by: 'studio-intake', at: now().toISOString(), bytes: f.bytes } });
      added++;
      outcomes.push({ path: f.path, ok: true, subject: `${kindOf(sub) === 'sound' ? 'sfx' : 'speech'}:${id}`, detail: `comic-intake.json entry ${id}` });
    }
    if (!added) return outcomes;
    try {
      await services.wiki.writeJson(COMIC_INTAKE, registry);
    } catch (error) {
      return outcomes.map((o) => (o.ok ? { path: o.path, ok: false, detail: `comic-intake.json write failed: ${(error as Error).message}` } : o));
    }
    const r = await services.wiki.runProducer('node', [COMIC_PRODUCER, 'build']).catch((error: Error) => ({ code: 1, stdout: '', stderr: error.message }));
    return r.code === 0 ? outcomes : outcomes.map((o) => (o.ok ? { ...o, detail: `${o.detail}; comic-audio.json rebuild failed (run comic-audio.mjs build): ${r.stderr.trim().split('\n')[0]}` } : o));
  }

  async function registerMusic(files: IntakeFile[]): Promise<IntakeOutcome[]> {
    const sources = await services.wiki.readJson<Sources>(`${LIB}/sources.json`);
    const read = cachedReader(services.repoRoot);
    const taken = new Set(sources.tracks.map((t) => t.id));
    const outcomes: IntakeOutcome[] = [];
    const added: Track[] = [];
    for (const f of files) {
      const sub = f.path.slice(AUDIO_ASSETS.length);
      // Re-check inside the queue: an agent or a concurrent intake may have registered it meanwhile.
      if (checkRegistered(f.path, read).registered || sources.tracks.some((t) => t.file === sub)) continue;
      let sha256: string;
      try {
        sha256 = await hashFile(path.join(services.repoRoot, f.path));
      } catch (error) {
        outcomes.push({ path: f.path, ok: false, detail: `cannot read: ${(error as Error).message}` });
        continue;
      }
      const id = intakeId(sub, taken);
      taken.add(id);
      const at = now();
      const track = {
        id,
        file: sub,
        provider: 'unknown',
        title: humanize(sub),
        artist: '',
        status: INTAKE_STATUS,
        kind: kindOf(sub),
        usedBy: [],
        note: `Auto-registered by Studio intake on ${todayUtc(at)} (${kindOf(sub)} file, ${f.bytes} bytes, sha256 ${sha256.slice(0, 12)}). Credit, licence and status need a human: complete it through the soundtrack-intake procedure; only Matt approves.`,
        intake: { by: 'studio-intake', at: at.toISOString(), sha256, bytes: f.bytes },
      } as unknown as Track;
      added.push(track);
      outcomes.push({ path: f.path, ok: true, subject: `snd:${id}`, detail: `sources.json entry ${id} (status ${INTAKE_STATUS})` });
    }
    if (!added.length) return outcomes;
    sources.tracks.push(...added);
    try {
      await services.wiki.writeJson(`${LIB}/sources.json`, sources);
    } catch (error) {
      return outcomes.map((o) => (o.ok ? { path: o.path, ok: false, detail: `sources.json write failed: ${(error as Error).message}` } : o));
    }
    try {
      // The store's own manifest rebuild, so the projection stays exactly what its clicks produce.
      const discovery = (await services.wiki.exists(`${LIB}/discovery.json`)) ? await services.wiki.readJson<Discovery>(`${LIB}/discovery.json`) : emptyDiscovery();
      await (store as unknown as { writeManifest(s: Sources, d: Discovery): Promise<unknown> }).writeManifest(sources, discovery);
    } catch (error) {
      // sources.json (the registry) is saved; the projection is stale and says so.
      return outcomes.map((o) => (o.ok ? { ...o, detail: `${o.detail}; manifest rebuild failed (run the soundtrack rebuild): ${(error as Error).message}` } : o));
    }
    return outcomes;
  }
}
