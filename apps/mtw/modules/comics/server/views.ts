// View models for the console: pure functions over a Snapshot, shared by the routes and the asset resolvers.
import * as casting from './casting';
import type { CatalogVoice, Clip, Profile } from './casting';
import { canonicalAudioPath, currentSpeechRecord, mediaUrl, reviewState } from './library';
import type { Rect, SceneArt, CanonicalArtSource, PanelArtLayer, PanelPresentation } from './stories';
import type { DerivedCharacter, DerivedComic, DerivedReview, ReviewState, Snapshot, SpeechRecord } from './library';

export interface Voice {
  ref: string;
  voiceId: string;
  provider: string;
  name: string;
  description: string;
  labels: Record<string, string | undefined>;
  canonicalPath: string | null;
  preview?: string;
  state: 'selected' | 'shortlist' | 'candidate' | 'rejected' | 'option';
  /** Chosen by Matt but held: preview-review only, not production-eligible. */
  held?: boolean;
  ownedBy?: string;
}

const previewPath = (v: CatalogVoice & { canonicalPath?: string; previewAsset?: string }): string | null =>
  v.canonicalPath ? canonicalAudioPath(v.canonicalPath) : v.previewAsset ? canonicalAudioPath(v.previewAsset) : null;

/** `voice:<id>`, or `voice:fish/<id>` when a Fish voice id collides with another provider's. */
export function voiceRef(v: CatalogVoice, catalog: CatalogVoice[]): string {
  const clash = catalog.some((o) => o !== v && o.voiceId === v.voiceId);
  return clash && v.provider === 'Fish Audio' ? `voice:fish/${v.voiceId}` : `voice:${v.voiceId}`;
}

export function toVoice(v: CatalogVoice, catalog: CatalogVoice[], profile: Profile | undefined, profiles: Profile[]): Voice {
  const path = previewPath(v);
  const owner = profiles.find((p) => {
    const c = casting.chosen(p);
    return c && casting.key(c) === casting.key(v);
  });
  const rejected = (profile?.casting?.history ?? []).some((h) => h.status === 'rejected' && casting.key(h) === casting.key(v));
  const sel = casting.chosen(profile);
  let state: Voice['state'] = 'option';
  if (sel && casting.key(sel) === casting.key(v)) state = 'selected';
  else if (rejected) state = 'rejected';
  else if (profile?.casting?.shortlistVoiceIds.includes(v.voiceId)) state = 'shortlist';
  else if (profile?.casting?.candidateVoiceIds.includes(v.voiceId)) state = 'candidate';
  const url = mediaUrl(path);
  return {
    ref: voiceRef(v, catalog),
    voiceId: v.voiceId,
    provider: v.provider ?? 'ElevenLabs',
    name: v.name,
    description: String(v.description ?? ''),
    labels: v.labels ?? {},
    canonicalPath: path,
    ...(url ? { preview: url } : {}),
    state,
    ...(state === 'selected' && sel?.productionHold === true ? { held: true } : {}),
    ...(owner && state !== 'selected' ? { ownedBy: owner.characterId } : {}),
  };
}

export interface ClipView {
  id: string;
  title: string;
  status: string;
  text: string;
  durationSeconds?: number;
  voiceId?: string;
  provider?: string;
  canonicalPath: string | null;
  preview?: string;
}
export function toClip(c: Clip): ClipView {
  const p = canonicalAudioPath(c.path);
  const url = mediaUrl(p);
  return {
    id: c.id,
    title: c.title ?? c.id,
    status: c.status ?? 'candidate',
    text: c.text ?? '',
    ...(c.durationSeconds !== undefined ? { durationSeconds: c.durationSeconds } : {}),
    ...(c.voiceId ? { voiceId: c.voiceId } : {}),
    ...(c.provider ? { provider: c.provider } : {}),
    canonicalPath: p,
    ...(url ? { preview: url } : {}),
  };
}

export interface ReviewCounts {
  total: number;
  approved: number;
  rejected: number;
  stale: number;
  pending: number;
  unvoiced: number;
}
export function countReviews(snap: Snapshot, rows: DerivedReview[]): ReviewCounts {
  const counts: ReviewCounts = { total: rows.length, approved: 0, rejected: 0, stale: 0, pending: 0, unvoiced: 0 };
  for (const row of rows) counts[reviewState(snap, row).state]++;
  return counts;
}

export function issueSummary(snap: Snapshot, c: DerivedComic) {
  return {
    id: c.id,
    issue: c.issue,
    title: c.title,
    collection: c.collection,
    hook: c.hook,
    path: c.path,
    liveUrl: `https://www.makingthings.work${c.path}`,
    /** The local reader started by `npm run all` (Astro dev on 8787), for issues not yet published. */
    localUrl: `http://localhost:8787${c.path}`,
    bPage: c.bPage,
    cover: c.cover?.present ? mediaUrl(canonicalImage(c.cover.path)) ?? null : null,
    durationSeconds: c.durationSeconds,
    bpm: c.bpm,
    scenes: c.scenes.length,
    panels: c.panelCount,
    speakers: c.speakers,
    reviews: countReviews(snap, c.textReview),
    problems: c.coverage.missingIntroductions.length + c.coverage.missingProfiles.length + c.coverage.unknownSpeakers.length,
  };
}

/** `../image-library/assets/...` as written by the producer to a repo path. */
export function canonicalImage(p: string): string | null {
  return canonicalAudioPath(p);
}

export function issueDetail(snap: Snapshot, c: DerivedComic) {
  return {
    ...issueSummary(snap, c),
    music: c.music,
    nextSound: c.nextSound,
    coverage: c.coverage,
    scenes: c.scenes.map((s) => ({ id: s.id, title: s.title, beat: s.beat, seconds: Math.round(s.seconds * 10) / 10, panels: s.panels, score: s.score, scoreAuthored: s.scoreAuthored, room: s.room, roomAuthored: s.roomAuthored, effects: s.effects.length, motion: s.motion.length, speakers: s.speakers, villains: s.villains })),
  };
}

export function sharedModels(chars: DerivedCharacter[]): Set<string> {
  const seen = new Map<string, number>();
  for (const c of chars) if (c.modelRecord) seen.set(c.modelRecord, (seen.get(c.modelRecord) ?? 0) + 1);
  return new Set([...seen].filter(([, n]) => n > 1).map(([id]) => id));
}

export function castSummary(snap: Snapshot, chars: DerivedCharacter[], c: DerivedCharacter) {
  const profile = snap.voices.profiles.find((p) => p.characterId === c.id);
  const choice = casting.chosen(profile);
  const catalog = catalogOf(snap);
  const voice = choice ? catalog.find((v) => casting.key(v) === casting.key(choice)) : undefined;
  const portrait = c.model?.present ? canonicalImage(c.model.path) : null;
  return {
    id: c.id,
    name: c.name,
    group: c.group,
    role: c.role,
    voiceUse: c.voiceUse ?? null,
    speakingIn: c.speakingIn,
    model: c.model ? { recordId: c.model.recordId, style: c.model.style, status: c.model.status, present: c.model.present, shared: sharedModels(chars).has(c.modelRecord ?? '') } : null,
    portrait: mediaUrl(portrait) ?? null,
    imgRef: c.model ? `img:${c.model.recordId}` : null,
    voice: choice ? { state: 'selected' as const, voiceId: choice.voiceId, provider: choice.provider, name: voice?.name ?? choice.voiceId, ref: `voice:${choice.voiceId}`, held: choice.productionHold === true } : null,
    shortlist: profile?.casting?.shortlistVoiceIds.length ?? 0,
    clips: profile?.clips?.length ?? 0,
  };
}

export function catalogOf(snap: Snapshot): CatalogVoice[] {
  return snap.derived.voiceCatalog.voices;
}

/** The chosen voice with its hold: what the detail page headlines instead of an unlocked picker. */
function choiceView(profile: Profile | undefined, catalog: CatalogVoice[]) {
  const choice = casting.chosen(profile);
  if (!choice) return null;
  const voice = catalog.find((v) => casting.key(v) === casting.key(choice));
  return {
    voice: voice ? toVoice(voice, catalog, profile, profile ? [profile] : []) : null,
    held: choice.productionHold === true,
    useScope: choice.useScope ?? null,
    holdReason: choice.holdReason ?? null,
    source: choice.selectionSource ?? null,
    selectedAt: choice.selectedAt ?? null,
    selectedBy: choice.selectedBy ?? null,
  };
}

/** Shortlisted voices, kept visible after a choice (the options list collapses to the chosen voice). */
function shortlistOf(profile: Profile | undefined, catalog: CatalogVoice[], profiles: Profile[]): Voice[] {
  const ids = profile?.casting?.shortlistVoiceIds ?? [];
  return ids.flatMap((id) => {
    const voice = catalog.find((v) => v.voiceId === id);
    return voice ? [toVoice(voice, catalog, profile, profiles)] : [];
  });
}

/** Effect voice directions with the voice resolved and the exact-words gate evaluated. */
export function effectDirections(snap: Snapshot) {
  const catalog = catalogOf(snap);
  const list = (snap.voices.effectVoiceDirections ?? []) as casting.EffectDirection[];
  return list.map((d) => {
    const voice = catalog.find((v) => casting.key(v) === casting.key(d));
    const path = voice ? previewPath(voice) : null;
    const url = mediaUrl(path);
    return {
      ...d,
      voiceName: voice?.name ?? d.voiceId,
      ...(url ? { preview: url } : {}),
      gate: casting.effectGate(d),
      editable: [...casting.EFFECT_EDITABLE],
    };
  });
}

export function castDetail(snap: Snapshot, c: DerivedCharacter) {
  const profile = snap.voices.profiles.find((p) => p.characterId === c.id);
  const catalog = catalogOf(snap);
  const base = castSummary(snap, snap.derived.characters, c);
  const profiles = snap.voices.profiles;
  const offered = profile ? casting.options(profile, catalog, profiles, c) : [];
  return {
    ...base,
    aliases: c.aliases,
    signature: c.signature,
    introduction: c.introduction ?? null,
    profile: profile
      ? {
          delivery: profile.delivery,
          pace: profile.pace,
          pitch: profile.pitch,
          accent: profile.accent,
          pronunciations: profile.pronunciations,
          sampleLine: profile.sampleLine,
          notes: profile.notes,
        }
      : null,
    /** Named audition scripts and the last browser speech settings, for the provisional system-voice audition. */
    auditionScripts: Array.isArray(profile?.auditionScripts) ? (profile?.auditionScripts as { id: string; title: string; text: string }[]) : [],
    audition: (profile?.audition as { voiceURI?: string; rate?: number; pitch?: number } | undefined) ?? null,
    locked: !!casting.chosen(profile),
    choice: choiceView(profile, catalog),
    shortlisted: shortlistOf(profile, catalog, profiles),
    history: casting.timeline(profile).map((e) => ({ ...e, name: catalog.find((v) => casting.key(v) === casting.key(e))?.name ?? e.voiceId })),
    voices: offered.map((v) => toVoice(v, catalog, profile, profiles)),
    /** Voices other characters already use (they are not offered here), so a comparison can steer clear of them. */
    taken: profiles
      .filter((p) => p.characterId !== c.id)
      .flatMap((p) => {
        const choice = casting.chosen(p);
        const voice = choice ? catalog.find((v) => casting.key(v) === casting.key(choice)) : undefined;
        if (!voice) return [];
        const who = snap.derived.characters.find((x) => x.id === p.characterId);
        return [{ ...toVoice(voice, catalog, p, profiles), characterId: p.characterId, characterName: who?.name ?? p.characterId }];
      }),
    clips: profile ? casting.clips(profile).map(toClip) : [],
  };
}

export interface SpeechRow {
  id: string;
  storyId: string;
  sceneId: string;
  sceneTitle: string;
  panelId: string | null;
  panelIndex: number;
  balloonIndex: number;
  kind: string;
  characterId: string;
  text: string;
  state: ReviewState;
  reviewedAt?: string;
  voice: string | null;
  audio?: { ref: string; preview?: string; durationSeconds: number; status: string };
  /** Page art and the panel region on it, when the story has raster page art. */
  crop?: { src: string; rect: Rect; alt: string; art: string | null; canonicalSource?: CanonicalArtSource; layers?: PanelArtLayer[]; phone?: PanelPresentation; views?: (PanelPresentation & { id?: string; at: number })[] };
  /** The text that was approved or voiced earlier, for the stale diff. Null when nothing was recorded. */
  baseline?: string | null;
}

export interface SpeechExtras {
  /** Story id to its scene art. */
  art?: Map<string, SceneArt[]>;
  /** Balloon id to the text recorded when it was last approved or rejected (decision log). */
  decided?: Map<string, string>;
}

/** The earlier text a stale row is compared with: the decision-log text, else a differing voiced text. */
export function baselineFor(current: string, decided: string | undefined, voiced: string | undefined): string | null {
  if (decided !== undefined && decided !== current) return decided;
  if (voiced !== undefined && voiced !== current) return voiced;
  return null;
}

export function speechRows(snap: Snapshot, extras: SpeechExtras = {}): SpeechRow[] {
  const records = new Map(snap.speech.map((r) => [r.id, r]));
  const rows: SpeechRow[] = [];
  for (const comic of snap.derived.comics) {
    const scenes = extras.art?.get(comic.id) ?? [];
    for (const r of comic.textReview) {
      const { state, review } = reviewState(snap, r);
      const rec = currentSpeechRecord(snap, r);
      const profile = snap.voices.profiles.find((p) => p.characterId === r.characterId);
      const choice = casting.selected(profile);
      const url = rec ? mediaUrl(canonicalAudioPath(rec.canonicalPath)) : undefined;
      const art = scenes.find((s) => s.id === r.sceneId);
      const panel = art?.panels.find(p => p.img === r.panelId) ?? art?.panels[r.panelIndex];
      const src = panel?.src !== undefined ? panel.src : art?.full ?? art?.thumb;
      rows.push({
        id: r.id,
        storyId: r.storyId,
        sceneId: r.sceneId,
        sceneTitle: comic.scenes.find((s) => s.id === r.sceneId)?.title ?? r.sceneId,
        panelId: r.panelId,
        panelIndex: r.panelIndex,
        balloonIndex: r.balloonIndex,
        kind: r.kind,
        characterId: r.characterId,
        text: r.text,
        state,
        ...(review?.reviewedAt ? { reviewedAt: review.reviewedAt } : {}),
        voice: choice ? `${choice.provider}/${choice.voiceId}` : null,
        ...(rec ? { audio: { ref: `speech:${rec.id}`, ...(url ? { preview: url } : {}), durationSeconds: rec.durationSeconds, status: rec.status ?? 'candidate' } } : {}),
        ...(src && panel?.crop ? { crop: { src, rect: panel.crop, alt: panel.alt, art: art?.art ?? null,
          ...(panel.canonicalSource ? { canonicalSource: panel.canonicalSource } : {}), ...(panel.layers ? { layers: panel.layers } : {}),
          ...(panel.phone ? { phone: panel.phone } : {}), ...(panel.views ? { views: panel.views } : {}) } } : {}),
        ...(state === 'stale' ? { baseline: baselineFor(r.text, extras.decided?.get(r.id), records.get(r.speechId ?? r.id)?.text) } : {}),
      });
    }
  }
  return rows;
}

export interface PageBalloon {
  id: string;
  text: string;
  kind: string;
  characterId: string;
  state: ReviewState;
  voiced: boolean;
}
export interface PagePanel {
  index: number;
  img: string;
  alt: string;
  crop: Rect | null;
  src?: string | null;
  canonicalSource?: CanonicalArtSource;
  layers?: PanelArtLayer[];
  phone?: PanelPresentation;
  views?: (PanelPresentation & { id?: string; at: number })[];
  balloons: PageBalloon[];
}
export interface PageScene {
  id: string;
  title: string;
  beat: number;
  seconds: number;
  /** The scene's art base (`/comic/<issue>/<name>`), or null. */
  art: string | null;
  thumb: string | null;
  full: string | null;
  balloons: number;
  voiced: number;
  counts: ReviewCounts;
  panels: PagePanel[];
}

/** Scenes of one issue in reading order with page art, balloons per panel (reading order) and review/voice counts. */
export function pagesView(snap: Snapshot, comic: DerivedComic, art: SceneArt[]): PageScene[] {
  const recorded = new Set(comic.textReview.filter((r) => currentSpeechRecord(snap, r)).map((r) => r.id));
  return comic.scenes.map((scene) => {
    const rows = comic.textReview.filter((r) => r.sceneId === scene.id).sort((a, b) => a.panelIndex - b.panelIndex || a.balloonIndex - b.balloonIndex);
    const a = art.find((x) => x.id === scene.id);
    const indexes = [...new Set([...(a?.panels.map((p) => p.index) ?? []), ...rows.map((r) => r.panelIndex)])].sort((x, y) => x - y);
    return {
      id: scene.id,
      title: scene.title,
      beat: scene.beat,
      seconds: Math.round(scene.seconds * 10) / 10,
      art: a?.art ?? null,
      thumb: a?.thumb ?? null,
      full: a?.full ?? null,
      balloons: rows.length,
      voiced: rows.filter((r) => recorded.has(r.id)).length,
      counts: countReviews(snap, rows),
      panels: indexes.map((index) => {
        const p = a?.panels[index];
        return {
          index,
          img: p?.img ?? rows.find((r) => r.panelIndex === index)?.panelId ?? '',
          alt: p?.alt ?? '',
          crop: p?.crop ?? null,
          ...(p?.src !== undefined ? { src: p.src } : {}),
          ...(p?.canonicalSource ? { canonicalSource: p.canonicalSource } : {}), ...(p?.layers ? { layers: p.layers } : {}),
          ...(p?.phone ? { phone: p.phone } : {}), ...(p?.views ? { views: p.views } : {}),
          balloons: rows
            .filter((r) => r.panelIndex === index)
            .map((r) => ({ id: r.id, text: r.text, kind: r.kind, characterId: r.characterId, state: reviewState(snap, r).state, voiced: recorded.has(r.id) })),
        };
      }),
    };
  });
}

export function speechRecordView(r: SpeechRecord, snap?: Snapshot) {
  const path = canonicalAudioPath(r.canonicalPath);
  const url = mediaUrl(path);
  const row = snap?.derived.comics.flatMap((c) => c.textReview).find((row) => (row.speechId ?? row.id) === r.id);
  const historical = snap !== undefined && (!row || !currentSpeechRecord(snap, row, r));
  return { id: r.id, title: historical ? `Earlier take — ${r.title}` : r.title, storyId: r.storyId, characterId: r.characterId, provider: r.provider, voiceId: r.voiceId, text: r.text, durationSeconds: r.durationSeconds, status: historical ? 'retained-history' : r.status ?? 'candidate', canonicalPath: path, ...(url ? { preview: url } : {}) };
}

export function soundsView(snap: Snapshot) {
  return {
    rooms: snap.derived.soundCatalog.map((s) => {
      const p = canonicalAudioPath(s.libraryPath);
      const url = mediaUrl(p);
      return { room: s.room, status: s.status, provider: s.provider, loop: !!s.loop, integratedLufs: s.integratedLufs ?? null, truePeakDbfs: s.truePeakDbfs ?? null, productionApproved: !!s.productionApproved, canonicalPath: p, ...(url ? { preview: url } : {}) };
    }),
    speech: snap.speech.map((r) => speechRecordView(r, snap)),
    next: snap.derived.comics.filter((c) => c.nextSound).map((c) => ({ issue: c.id, title: c.title, sound: c.nextSound })),
  };
}
