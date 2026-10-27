// Reads the comics library: the projection computed by the maintained producer (site/scripts/build-comics-library.mjs,
// cached under apps/mtw/.state) plus the canonical authored JSON. Replaces the retired wiki/comics-library console.
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
import * as casting from './casting';
import type { CastCharacter, CatalogVoice, Clip, Profile, ReviewRow, TextReview } from './casting';

export const LIB = 'wiki/comics-library';
export const VOICES = `${LIB}/voices.json`;
export const APPROVALS = `${LIB}/speech-approvals.json`;

export interface ImageAsset {
  recordId: string;
  style: string;
  title: string;
  path: string;
  status: string | null;
  sha256: string | null;
  present: boolean;
}
export interface DerivedReview extends ReviewRow {
  /** Exact retained take assigned by the reader; review ids remain stable UI addresses. */
  speechId?: string;
  storyId: string;
  sceneId: string;
  panelId: string | null;
  panelIndex: number;
  balloonIndex: number;
  kind: string;
  authoredWho: string;
  text: string;
  startSeconds: number;
}
export interface DerivedScene {
  id: string;
  title: string;
  beat: number;
  beats: number;
  seconds: number;
  panels: number;
  score: number;
  scoreAuthored: boolean;
  room: string;
  roomAuthored: boolean;
  effects: unknown[];
  motion: unknown[];
  speakers: string[];
  villains: string[];
}
export interface DerivedComic {
  id: string;
  issue: number | null;
  title: string;
  collection: string;
  hook: string;
  path: string;
  bPage: string | null;
  cover: ImageAsset | null;
  durationSeconds: number;
  bpm: number;
  panelCount: number;
  music: unknown;
  speakers: string[];
  scenes: DerivedScene[];
  textReview: DerivedReview[];
  nextSound: unknown;
  coverage: { missingIntroductions: string[]; missingProfiles: string[]; unknownSpeakers: string[]; scenesWithoutExplicitScore: string[]; scenesWithoutExplicitRoom: string[] };
}
export interface DerivedCharacter extends CastCharacter {
  name: string;
  aliases: string[];
  group: string;
  role: string;
  signature: string;
  introduction?: string;
  voiceUse?: string;
  modelRecord?: string;
  model: ImageAsset | null;
  speakingIn: string[];
}
export interface SoundRoom {
  room: string;
  src: string;
  libraryPath: string;
  status: string;
  provider: string;
  integratedLufs?: number;
  truePeakDbfs?: number;
  loop?: boolean;
  productionApproved?: boolean;
  [k: string]: unknown;
}
/** A drawing reference: model sheet, calibration page or lettering crop, resolved in the image library. */
export interface DerivedReference {
  recordId: string;
  kind: string;
  label: string;
  asset: ImageAsset | null;
  [k: string]: unknown;
}
export interface Derived {
  comics: DerivedComic[];
  characters: DerivedCharacter[];
  voiceCatalog: { voices: CatalogVoice[] };
  soundCatalog: SoundRoom[];
  references?: DerivedReference[];
  warnings: string[];
}
export interface VoicesFile {
  schemaVersion: number;
  profiles: Profile[];
  [k: string]: unknown;
}
export interface ApprovalsFile {
  schemaVersion: number;
  textReviews: TextReview[];
}
export interface SpeechRecord {
  id: string;
  title: string;
  storyId: string;
  characterId: string;
  provider: string;
  voiceId: string;
  text: string;
  canonicalPath: string;
  durationSeconds: number;
  status?: string;
  sha256: string;
  receiptCanonicalPath?: string;
  originalCanonicalPath?: string;
  [k: string]: unknown;
}

export const sha256 = (bytes: Buffer | string): string => createHash('sha256').update(bytes).digest('hex');

/** Port of canonicalAudioRef in build-comics-library.mjs: library-relative paths to repo paths. */
export function canonicalAudioPath(value: string): string | null {
  let p = String(value || '');
  if (p.startsWith('../soundtrack-library/')) p = `wiki/soundtrack-library/${p.slice('../soundtrack-library/'.length)}`;
  else if (p.startsWith('../image-library/')) p = `wiki/image-library/${p.slice('../image-library/'.length)}`;
  else if (p.startsWith('assets/') || p.startsWith('records/')) p = `wiki/comics-library/${p}`;
  if (p.includes('\\') || p.split('/').some((s) => !s || s === '.' || s === '..') || !p.startsWith('wiki/')) return null;
  return p;
}

export function mediaUrl(repoPath: string | null | undefined): string | undefined {
  return repoPath ? `/api/comics/media?path=${encodeURIComponent(repoPath)}` : undefined;
}

export type ReviewState = 'approved' | 'rejected' | 'stale' | 'pending' | 'unvoiced';

export interface Snapshot {
  derived: Derived;
  voices: VoicesFile;
  approvals: ApprovalsFile;
  speech: SpeechRecord[];
  /** Current sha256 of each story source file named by a review row (stale detection). */
  sourceNow: Record<string, string | null>;
  builtAt: string;
}

export interface LibraryOptions {
  /** A fixed projection snapshot to read instead of running the producer (tests). */
  snapshotFile?: string;
  /** Where the live projection is cached; defaults to MTW_STATE_DIR or apps/mtw/.state. */
  stateDir?: string;
}

/** The producer and the authored inputs it reads; any change to one of these rebuilds the projection. */
export const PRODUCER = 'site/scripts/build-comics-library.mjs';
const INPUT_DIRS: [string, RegExp][] = [
  [LIB, /^(?:[^/]+\.json|casting\.js)$/],
  ['site/src/data/comic-stories', /\.ts$/],
  ['wiki/soundtrack-library', /^[^/]+\.json$/],
];
const INPUT_FILES = [PRODUCER, 'wiki/image-library/manifest.json', 'wiki/site/comic-story.md', 'wiki/site/comic-story-world.md'];

export class Library {
  private cache: { stamp: string; derived: Derived; builtAt: string } | null = null;
  private building: Promise<{ derived: Derived; builtAt: string }> | null = null;
  constructor(private repoRoot: string, private readJson: <T>(p: string) => Promise<T>, private options: LibraryOptions = {}) {}

  private abs(rel: string): string {
    return path.join(this.repoRoot, rel);
  }

  /** Size and mtime of every producer input, so the projection is rebuilt only when one changes. */
  private async inputsStamp(): Promise<string> {
    const parts: string[] = [];
    const add = async (rel: string) => {
      const s = await fs.stat(this.abs(rel)).catch(() => null);
      parts.push(`${rel}:${s ? `${s.size}:${s.mtimeMs}` : '-'}`);
    };
    for (const [dir, match] of INPUT_DIRS) {
      const names = await fs.readdir(this.abs(dir)).catch(() => [] as string[]);
      for (const name of names.filter((n) => match.test(n)).sort()) await add(`${dir}/${name}`);
    }
    for (const rel of INPUT_FILES) await add(rel);
    return parts.join('|');
  }

  /**
   * The comics projection (issues, cast, review rows, voice catalog), computed by the maintained producer from the authored
   * sources and cached under the app's state folder. Nothing derived is written into wiki/.
   */
  async derived(): Promise<{ derived: Derived; builtAt: string }> {
    if (this.options.snapshotFile) {
      const stat = await fs.stat(this.options.snapshotFile);
      const stamp = String(stat.mtimeMs);
      if (this.cache?.stamp !== stamp) this.cache = { stamp, derived: JSON.parse(await fs.readFile(this.options.snapshotFile, 'utf8')) as Derived, builtAt: stat.mtime.toISOString() };
      return { derived: this.cache.derived, builtAt: this.cache.builtAt };
    }
    const stamp = await this.inputsStamp();
    if (this.cache?.stamp === stamp) return { derived: this.cache.derived, builtAt: this.cache.builtAt };
    if (!this.building) this.building = this.build(stamp).finally(() => (this.building = null));
    return this.building;
  }

  private async build(stamp: string): Promise<{ derived: Derived; builtAt: string }> {
    const dir = path.join(this.options.stateDir ?? process.env.MTW_STATE_DIR ?? this.abs('apps/mtw/.state'), 'comics');
    await fs.mkdir(dir, { recursive: true });
    const out = path.join(dir, 'comics-library.json');
    await execFileAsync(process.execPath, [this.abs(PRODUCER), '--repo', this.repoRoot, '--snapshot', out], { cwd: this.repoRoot, windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
    const derived = JSON.parse(await fs.readFile(out, 'utf8')) as Derived;
    this.cache = { stamp, derived, builtAt: new Date().toISOString() };
    return { derived, builtAt: this.cache.builtAt };
  }

  async approvals(): Promise<ApprovalsFile> {
    if (!(await fs.stat(this.abs(APPROVALS)).catch(() => null))) return { schemaVersion: 1, textReviews: [] };
    const a = await this.readJson<ApprovalsFile>(APPROVALS);
    if (a.schemaVersion !== 1 || !Array.isArray(a.textReviews)) throw new Error('Invalid speech approval file');
    return a;
  }

  async storyHash(storyPath: string): Promise<string | null> {
    if (!/^site\/src\/data\/comic-stories\/[a-z0-9-]+\.ts$/.test(storyPath)) return null;
    try {
      return sha256(await fs.readFile(this.abs(storyPath)));
    } catch {
      return null;
    }
  }

  async speechRecords(): Promise<SpeechRecord[]> {
    try {
      return (await this.readJson<{ records: SpeechRecord[] }>(`${LIB}/speech.json`)).records ?? [];
    } catch {
      return [];
    }
  }

  async snapshot(): Promise<Snapshot> {
    const [{ derived, builtAt }, voices, approvals, speech] = await Promise.all([this.derived(), this.readJson<VoicesFile>(VOICES), this.approvals(), this.speechRecords()]);
    const paths = new Set<string>();
    for (const c of derived.comics) for (const r of c.textReview) paths.add(r.storySource.path);
    const sourceNow: Record<string, string | null> = {};
    for (const p of paths) sourceNow[p] = await this.storyHash(p);
    return { derived, voices, approvals, speech, sourceNow, builtAt };
  }
}

export function reviewState(snap: Pick<Snapshot, 'voices' | 'approvals' | 'sourceNow'>, row: DerivedReview): { state: ReviewState; review?: TextReview } {
  const profile = snap.voices.profiles.find((p) => p.characterId === row.characterId);
  const choice = casting.selected(profile);
  if (!choice) return { state: 'unvoiced' };
  const review = snap.approvals.textReviews.find((r) => r.id === row.id);
  if (!review) return { state: 'pending' };
  // The library row records provider/voice at build time; judge against the live selection and the live story hash.
  const live: ReviewRow = { ...row, provider: choice.provider, voiceId: choice.voiceId, storySource: { path: row.storySource.path, sha256: snap.sourceNow[row.storySource.path] ?? row.storySource.sha256 } };
  if (casting.approval(live, review, profile)) return { state: 'approved', review };
  return { state: review.status === 'rejected' ? 'rejected' : 'stale', review };
}

/** Saved history is reusable as the current take only for this exact text and Studio's chosen identity. */
export function currentSpeechRecord(snap: Pick<Snapshot, 'voices' | 'speech'>, row: DerivedReview, record?: SpeechRecord): SpeechRecord | undefined {
  const profile = snap.voices.profiles.find((p) => p.characterId === row.characterId);
  const choice = casting.chosen(profile);
  if (!choice) return undefined;
  const textHash = sha256(row.text);
  const matches = (r: SpeechRecord) => r.id === (row.speechId ?? row.id) && r.storyId === row.storyId && r.characterId === row.characterId &&
    r.provider === choice.provider && r.voiceId === choice.voiceId && r.text === row.text &&
    (r.textSha256 === undefined || r.textSha256 === textHash) &&
    !/rejected|comparison|historical|retained-history/i.test(r.status ?? 'candidate');
  return record ? (matches(record) ? record : undefined) : snap.speech.find(matches);
}

export function clipPath(clip: Clip): string | null {
  return canonicalAudioPath(clip.path);
}
