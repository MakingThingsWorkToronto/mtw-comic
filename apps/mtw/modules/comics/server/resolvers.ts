// Asset resolvers for speech:, voice: and cast: refs.
import type { AssetResolver, AssetSummary } from '../../types';
import * as casting from './casting';
import type { Library, Snapshot } from './library';
import { canonicalImage, castSummary, catalogOf, sharedModels, speechRecordView, toClip, toVoice } from './views';

type Query = { q?: string; filters?: Record<string, string>; limit?: number; offset?: number };

function page(items: AssetSummary[], query: Query): { items: AssetSummary[]; total: number } {
  const q = (query.q ?? '').trim().toLowerCase();
  const filtered = items.filter((i) => {
    if (q && !`${i.ref} ${i.title}`.toLowerCase().includes(q)) return false;
    for (const [k, v] of Object.entries(query.filters ?? {})) if (v && String((i.meta?.[k] ?? (k === 'status' ? i.status : '')) ?? '') !== v) return false;
    return true;
  });
  const offset = query.offset ?? 0;
  return { items: filtered.slice(offset, offset + (query.limit ?? 50)), total: filtered.length };
}

export function castResolver(library: Library): AssetResolver {
  const items = async (): Promise<AssetSummary[]> => {
    const snap = await library.snapshot();
    const shared = sharedModels(snap.derived.characters);
    return snap.derived.characters.map((c) => {
      const s = castSummary(snap, snap.derived.characters, c);
      const path = c.model?.present ? canonicalImage(c.model.path) : null;
      return {
        ref: `cast:${c.id}`,
        title: c.name,
        status: s.voice ? 'selected' : c.voiceUse ? 'reference' : 'unvoiced',
        ...(s.portrait ? { preview: s.portrait } : {}),
        canonicalPath: path ?? 'wiki/comics-library/characters.json',
        meta: { group: c.group, role: c.role, modelStatus: c.model?.status ?? 'none', modelShared: shared.has(c.modelRecord ?? ''), ...(s.voice ? { voice: s.voice.ref } : {}), ...(s.imgRef ? { img: s.imgRef } : {}) },
      };
    });
  };
  return {
    prefix: 'cast',
    label: 'Character',
    module: 'comics',
    async list(query) {
      return page(await items(), query);
    },
    async resolve(ref) {
      return (await items()).find((i) => i.ref === ref) ?? null;
    },
  };
}

export function voiceResolver(library: Library): AssetResolver {
  const items = async (): Promise<AssetSummary[]> => {
    const snap: Snapshot = await library.snapshot();
    const catalog = catalogOf(snap);
    const out: AssetSummary[] = [];
    for (const v of catalog) {
      const owner = snap.voices.profiles.find((p) => casting.chosen(p) && casting.key(casting.chosen(p) as casting.VoiceChoice) === casting.key(v));
      const rejected = snap.voices.profiles.some((p) => (p.casting?.history ?? []).some((h) => h.status === 'rejected' && casting.key(h) === casting.key(v)));
      const inList = snap.voices.profiles.some((p) => p.casting?.candidateVoiceIds.includes(v.voiceId) || p.casting?.shortlistVoiceIds.includes(v.voiceId));
      const view = toVoice(v, catalog, owner, snap.voices.profiles);
      out.push({
        ref: view.ref,
        title: view.name,
        status: owner ? 'selected' : rejected ? 'rejected' : inList ? 'candidate' : 'preview',
        ...(view.preview ? { preview: view.preview } : {}),
        canonicalPath: view.canonicalPath ?? 'wiki/comics-library/provider-voices.json',
        meta: { provider: view.provider, gender: view.labels.gender ?? '', persona: view.labels.persona ?? view.labels.descriptive ?? '', ...(owner ? { selectedFor: owner.characterId, ...(casting.choiceState(owner) === 'held' ? { held: 'preview-review' } : {}) } : {}) },
      });
    }
    for (const p of snap.voices.profiles) {
      for (const clip of p.clips ?? []) {
        const c = toClip(clip);
        out.push({
          ref: `voice:clip/${p.characterId}/${clip.id}`,
          title: c.title,
          status: c.status,
          ...(c.preview ? { preview: c.preview } : {}),
          canonicalPath: c.canonicalPath ?? 'wiki/comics-library/voices.json',
          meta: { provider: clip.provider ?? '', characterId: p.characterId, durationSeconds: c.durationSeconds ?? null, text: c.text },
        });
      }
    }
    return out;
  };
  return {
    prefix: 'voice',
    label: 'Voice',
    module: 'comics',
    async list(query) {
      return page(await items(), query);
    },
    async resolve(ref) {
      return (await items()).find((i) => i.ref === ref) ?? null;
    },
  };
}

export function speechResolver(library: Library): AssetResolver {
  const items = async (): Promise<AssetSummary[]> => {
    const snap = await library.snapshot();
    const out: AssetSummary[] = snap.speech.map((r) => {
      const v = speechRecordView(r, snap);
      return {
        ref: `speech:${r.id}`,
        title: `${v.status === 'retained-history' ? 'Earlier take — ' : ''}${r.characterId}: ${r.text.replace(/\s+/g, ' ').slice(0, 60)}`,
        status: v.status,
        ...(v.preview ? { preview: v.preview } : {}),
        canonicalPath: v.canonicalPath ?? r.canonicalPath,
        meta: { sha256: r.sha256, durationSeconds: r.durationSeconds, receipt: r.receiptCanonicalPath ?? null, original: r.originalCanonicalPath ?? null, storyId: r.storyId, characterId: r.characterId, provider: r.provider, voiceId: r.voiceId },
      };
    });
    const have = new Set(snap.speech.map((r) => r.id));
    for (const c of snap.derived.comics) {
      for (const row of c.textReview) {
        if (have.has(row.id)) continue;
        out.push({
          ref: `speech:${row.id}`,
          title: `${row.characterId}: ${row.text.replace(/\s+/g, ' ').slice(0, 60)}`,
          status: 'unrecorded',
          canonicalPath: 'wiki/comics-library/speech-approvals.json',
          meta: { storyId: row.storyId, characterId: row.characterId, textSha256: row.textSha256 },
        });
      }
    }
    return out;
  };
  return {
    prefix: 'speech',
    label: 'Speech',
    module: 'comics',
    async list(query) {
      const all = await items();
      // Recorded takes first: a picker wants something playable.
      all.sort((a, b) => Number(!!b.preview) - Number(!!a.preview));
      return page(all, query);
    },
    async resolve(ref) {
      return (await items()).find((i) => i.ref === ref) ?? null;
    },
  };
}
