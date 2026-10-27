// Direct, human-click writes to voices.json and speech-approvals.json in their exact current shapes.
// Each write re-reads the file, applies one change, re-checks the bytes did not move, then writes atomically.
import { bindWordApprovals } from './wordApprovals';
import type { WordReview } from './wordApprovals';
import type { DecisionLog, WikiStore } from '../../types';
import * as casting from './casting';
import type { CatalogVoice, EffectDirection, Profile, TextReview } from './casting';
import { APPROVALS, VOICES, reviewState } from './library';
import type { ApprovalsFile, Library, VoicesFile } from './library';

export class ConflictError extends Error {
  readonly status = 409;
}
export class InvalidError extends Error {
  readonly status = 400;
}

export const PROFILE_FIELDS = ['delivery', 'pace', 'pitch', 'accent', 'pronunciations', 'sampleLine', 'notes'] as const;
export type ProfileField = (typeof PROFILE_FIELDS)[number];

const MATT = 'Matt Stark';

/** Serialize with the file's own line endings so a one-field change is a one-line diff. */
export function serialize(value: unknown, eol: string): string {
  return JSON.stringify(value, null, 2).replace(/\n/g, eol) + eol;
}

export interface CatalogFile {
  provider: string;
  voices: (CatalogVoice & { canonicalPath?: string; previewAsset?: string })[];
}

/** provider-voices.json with the producer's provider normalization (retained schema-1 entries have none). */
export function normalizeCatalog(file: CatalogFile): CatalogVoice[] {
  return file.voices.map((v) => ({ ...v, provider: v.provider ?? (file.provider.toLowerCase() === 'mixed' ? 'ElevenLabs' : file.provider) }));
}

export class ComicsStore {
  private queues = new Map<string, Promise<unknown>>();

  constructor(
    private wiki: WikiStore,
    private decisions: DecisionLog,
    private library: Library,
  ) {}

  private serial<T>(rel: string, job: () => Promise<T>): Promise<T> {
    const prev = this.queues.get(rel) ?? Promise.resolve();
    const next = prev.then(job, job);
    this.queues.set(rel, next.catch(() => undefined));
    return next;
  }

  /** Read, change, verify unchanged, write. Retries when another writer moved the file in between. */
  private async mutate<T>(rel: string, missing: T | null, change: (data: T) => void): Promise<T> {
    return this.serial(rel, async () => {
      for (let attempt = 0; attempt < 5; attempt++) {
        let text: string | null = null;
        try {
          text = await this.wiki.readText(rel);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT' || missing === null) throw error;
        }
        const data = text === null ? (JSON.parse(JSON.stringify(missing)) as T) : (JSON.parse(text) as T);
        const eol = text?.includes('\r\n') ? '\r\n' : text === null ? '\r\n' : '\n';
        change(data);
        let again: string | null = null;
        try {
          again = await this.wiki.readText(rel);
        } catch {
          again = null;
        }
        if (again !== text) continue;
        try {
          await this.wiki.writeText(rel, serialize(data, eol));
        } catch (error) {
          throw new ConflictError((error as Error).message);
        }
        return data;
      }
      throw new ConflictError(`${rel} keeps changing on disk; try again`);
    });
  }

  private async catalog(): Promise<CatalogVoice[]> {
    return normalizeCatalog(await this.wiki.readJson<CatalogFile>('wiki/comics-library/provider-voices.json'));
  }

  private async log(subject: string, action: string, value?: unknown, note?: string): Promise<void> {
    await this.decisions.append('comics-library', { actor: 'matt', module: 'comics', subject, action, ...(value !== undefined ? { value } : {}), ...(note ? { note } : {}) });
  }

  /** Text recorded with the latest approve/reject of each balloon (the baseline for the stale diff). */
  async decidedTexts(): Promise<Map<string, string>> {
    const out = new Map<string, string>();
    try {
      for (const d of await this.decisions.list('comics-library')) {
        const text = (d.value as { text?: unknown } | undefined)?.text;
        if ((d.action === 'approve-text' || d.action === 'reject-text') && typeof text === 'string') out.set(d.subject, text);
      }
    } catch {
      /* no log yet */
    }
    return out;
  }

  private profile(data: VoicesFile, characterId: string): Profile {
    const p = data.profiles.find((x) => x.characterId === characterId);
    if (!p) throw new InvalidError(`unknown character: ${characterId}`);
    return p;
  }

  async shortlist(characterId: string, voiceId: string, on: boolean): Promise<Profile> {
    const catalog = await this.catalog();
    const characters = (await this.library.derived()).derived.characters;
    let result!: Profile;
    await this.mutate<VoicesFile>(VOICES, null, (data) => {
      const profile = this.profile(data, characterId);
      const voice = catalog.find((v) => v.voiceId === voiceId);
      if (!voice) throw new InvalidError(`unknown provider voice: ${voiceId}`);
      const cast = (profile.casting ??= { candidateVoiceIds: [], shortlistVoiceIds: [] });
      if (on) {
        const allowed = casting.options(profile, catalog, data.profiles, characters.find((c) => c.id === characterId));
        if (!allowed.some((v) => v.voiceId === voiceId)) throw new InvalidError('that voice is not available for this character');
        if (!cast.candidateVoiceIds.includes(voiceId)) cast.candidateVoiceIds.push(voiceId);
        if (!cast.shortlistVoiceIds.includes(voiceId)) cast.shortlistVoiceIds.push(voiceId);
      } else {
        if (casting.chosen(profile)) throw new ConflictError('the shortlist is kept once a voice is chosen');
        cast.shortlistVoiceIds = cast.shortlistVoiceIds.filter((id) => id !== voiceId);
      }
      result = profile;
    });
    await this.log(`cast:${characterId}`, on ? 'shortlist' : 'unshortlist', { voiceId });
    return result;
  }

  /** Matt reopens a chosen voice: the choice moves to history (still playable, not rejected) and the options come back. */
  async changeVoice(characterId: string): Promise<Profile> {
    let result!: Profile;
    let old!: { provider: string; voiceId: string };
    await this.mutate<VoicesFile>(VOICES, null, (data) => {
      const profile = this.profile(data, characterId);
      const choice = casting.chosen(profile);
      if (!choice) throw new ConflictError('this character has no chosen voice to change');
      const cast = profile.casting!;
      (cast.history ??= []).push({ provider: choice.provider, voiceId: choice.voiceId, status: 'replaced', selectedBy: choice.selectedBy, selectedAt: choice.selectedAt, replacedBy: MATT, replacedAt: new Date().toISOString() });
      delete cast.selectedVoice;
      old = { provider: choice.provider, voiceId: choice.voiceId };
      result = profile;
    });
    await this.log(`cast:${characterId}`, 'change-voice', old);
    return result;
  }

  /** Matt's explicit decision. Refuses anything the speech approval gate would reject. */
  async selectVoice(characterId: string, voiceId: string): Promise<Profile> {
    const catalog = await this.catalog();
    const characters = (await this.library.derived()).derived.characters;
    let result!: Profile;
    let chosen!: CatalogVoice;
    await this.mutate<VoicesFile>(VOICES, null, (data) => {
      const profile = this.profile(data, characterId);
      if (casting.chosen(profile)) throw new ConflictError('this character already has a chosen voice');
      const voice = catalog.find((v) => v.voiceId === voiceId);
      if (!voice) throw new InvalidError(`unknown provider voice: ${voiceId}`);
      const allowed = casting.options(profile, catalog, data.profiles, characters.find((c) => c.id === characterId));
      if (!allowed.some((v) => v.voiceId === voiceId)) throw new InvalidError('that voice is not available for this character');
      const provider = voice.provider ?? 'ElevenLabs';
      const cast = (profile.casting ??= { candidateVoiceIds: [], shortlistVoiceIds: [] });
      if (!cast.candidateVoiceIds.includes(voiceId)) cast.candidateVoiceIds.push(voiceId);
      cast.selectedVoice = { provider, voiceId, status: 'approved', selectedBy: MATT, selectedAt: new Date().toISOString() };
      profile.provider = provider;
      profile.voiceId = voiceId;
      try {
        casting.validate(data.profiles, catalog, characters);
      } catch (error) {
        throw new InvalidError((error as Error).message);
      }
      result = profile;
      chosen = voice;
    });
    await this.log(`cast:${characterId}`, 'select-voice', { provider: chosen.provider, voiceId }, chosen.name);
    // Words Matt approved before this character had a voice now carry over to the chosen voice.
    let bound = 0;
    await this.mutate<ApprovalsFile>(APPROVALS, { schemaVersion: 1, textReviews: [] }, (file) => {
      if (Array.isArray(file.textReviews)) bound = bindWordApprovals(file.textReviews as WordReview[], characterId, chosen.provider ?? 'ElevenLabs', voiceId);
    });
    if (bound) await this.log(`cast:${characterId}`, 'bind-word-approvals', { voiceId, count: bound });
    return result;
  }

  async editProfile(characterId: string, fields: Partial<Record<ProfileField, string>>): Promise<Profile> {
    const changes: Record<string, { from: string; to: string }> = {};
    let result!: Profile;
    await this.mutate<VoicesFile>(VOICES, null, (data) => {
      const profile = this.profile(data, characterId);
      for (const [name, value] of Object.entries(fields)) {
        if (!(PROFILE_FIELDS as readonly string[]).includes(name)) throw new InvalidError(`not an editable field: ${name}`);
        if (typeof value !== 'string') throw new InvalidError(`${name} must be text`);
        const before = String(profile[name] ?? '');
        if (before !== value) {
          changes[name] = { from: before, to: value };
          profile[name] = value;
        }
      }
      result = profile;
    });
    if (Object.keys(changes).length) await this.log(`cast:${characterId}`, 'edit-profile', changes);
    return result;
  }

  /**
   * Edit an effect voice direction's text (usage, notes). The exact-words gate is the producer's: provider, voice, status and the
   * generation flags are never written here, so a direction can neither approve generation nor drop the exact-word review.
   */
  async editEffectDirection(id: string, fields: Partial<Record<(typeof casting.EFFECT_EDITABLE)[number], string>>): Promise<EffectDirection> {
    const catalog = await this.catalog();
    const changes: Record<string, { from: string; to: string }> = {};
    let result!: EffectDirection;
    await this.mutate<VoicesFile>(VOICES, null, (data) => {
      const list = data.effectVoiceDirections as EffectDirection[] | undefined;
      const d = list?.find((x) => x.id === id);
      if (!d) throw new InvalidError(`unknown effect voice direction: ${id}`);
      if (!catalog.some((v) => casting.key(v) === casting.key(d))) throw new InvalidError('the direction names a voice missing from the provider catalog');
      for (const [name, value] of Object.entries(fields)) {
        if (!(casting.EFFECT_EDITABLE as readonly string[]).includes(name)) throw new InvalidError(`not an editable effect field: ${name}`);
        if (typeof value !== 'string') throw new InvalidError(`${name} must be text`);
        if (name === 'usage' && !value.trim()) throw new InvalidError('usage cannot be empty');
        const before = String(d[name] ?? '');
        if (before !== value) {
          changes[name] = { from: before, to: value };
          d[name] = value;
        }
      }
      if (casting.effectGate(d).canGenerate && Object.keys(changes).length) throw new InvalidError('generation is approved for this direction; change its words through the producer');
      result = d;
    });
    if (Object.keys(changes).length) await this.log(`effect:${id}`, 'edit-effect-direction', changes);
    return result;
  }

  async reviewSpeech(rowId: string, action: 'approve' | 'reject' | 'revoke'): Promise<{ state: string }> {
    const snap = await this.library.snapshot();
    const row = snap.derived.comics.flatMap((c) => c.textReview).find((r) => r.id === rowId);
    if (!row) throw new InvalidError(`unknown balloon: ${rowId}`);
    const nowHash = snap.sourceNow[row.storySource.path];
    let entry: TextReview | undefined;
    if (action !== 'revoke') {
      const profile = snap.voices.profiles.find((p) => p.characterId === row.characterId);
      // Words can be approved before a voice is chosen; choosing the voice later binds the approval (wordApprovals.ts).
      const choice = casting.selected(profile) ?? { provider: '', voiceId: '' };
      if (!nowHash || nowHash !== row.storySource.sha256) throw new ConflictError('the story changed since the library was built; rebuild the library first');
      entry = {
        id: row.id,
        characterId: row.characterId,
        provider: choice.provider,
        voiceId: choice.voiceId,
        textSha256: row.textSha256,
        storySource: row.storySource,
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewedBy: MATT,
        reviewedAt: new Date().toISOString(),
      } as TextReview;
    }
    const data = await this.mutate<ApprovalsFile>(APPROVALS, { schemaVersion: 1, textReviews: [] }, (file) => {
      if (file.schemaVersion !== 1 || !Array.isArray(file.textReviews)) throw new InvalidError('Invalid speech approval file');
      const rest = file.textReviews.filter((r) => r.id !== rowId);
      file.textReviews = entry ? [...rest, entry] : rest;
    });
    await this.log(row.id, action === 'approve' ? 'approve-text' : action === 'reject' ? 'reject-text' : 'revoke-text', { textSha256: row.textSha256, voiceId: entry?.voiceId, ...(entry ? { text: row.text } : {}) });
    return { state: reviewState({ voices: snap.voices, approvals: data, sourceNow: snap.sourceNow }, row).state };
  }
}
