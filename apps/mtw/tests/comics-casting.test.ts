import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chosenBadge, matchesVoiceFilter, timelineLine, voiceStateBadge } from '../modules/comics/client/casting-view';
import * as c from '../modules/comics/server/casting';
import type { EffectDirection, Profile } from '../modules/comics/server/casting';
import { Library } from '../modules/comics/server/library';
import { comicsSnapshot } from './comics-snapshot';
import { ComicsStore, ConflictError, InvalidError } from '../modules/comics/server/store';
import { castDetail, castSummary, effectDirections } from '../modules/comics/server/views';
import { FileDecisionLog } from '../server/core/decisions';
import { FileLeases } from '../server/core/leases';
import { FileWikiStore } from '../server/core/wiki-store';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)), '..', '..');
const lib = path.join(repoRoot, 'wiki', 'comics-library');
const profile = (selectedVoice?: Record<string, unknown>, history: unknown[] = []): Profile =>
  ({ characterId: 'x', provider: 'Fish Audio', voiceId: 'v', casting: { candidateVoiceIds: [], shortlistVoiceIds: ['s'], ...(selectedVoice ? { selectedVoice } : {}), history } }) as unknown as Profile;
const choice = { provider: 'Fish Audio', voiceId: 'v', status: 'approved', selectedBy: 'Matt Stark', selectedAt: '2026-10-10T03:00:00Z' };

describe('chosen, held and selected', () => {
  it('a held choice hides rejected clips while retaining its matching preview and production hold', () => {
    const held = profile({ ...choice, productionHold: true, useScope: 'preview-review' });
    held.clips = [
      { id: 'old', provider: 'Fish Audio', voiceId: 'rejected' },
      { id: 'current', provider: 'Fish Audio', voiceId: 'v' },
    ] as Profile['clips'];
    expect(c.clips(held).map((clip) => clip.id)).toEqual(['current']);
    expect(c.selected(held)).toBeNull();
    expect(held.clips).toHaveLength(2);
  });
  it('a held choice is chosen but not production-selected', () => {
    const held = profile({ ...choice, productionHold: true, useScope: 'preview-review' });
    expect(c.choiceState(held)).toBe('held');
    expect(c.chosen(held)).not.toBeNull();
    expect(c.selected(held)).toBeNull();
    expect(c.choiceState(profile(choice))).toBe('production');
    expect(c.choiceState(profile())).toBe('none');
    expect(c.choiceState(profile({ ...choice, selectedBy: 'someone' }))).toBe('none');
  });
  it('badges: held shows the preview-review wording, selected shows approved', () => {
    expect(chosenBadge({ held: true })).toEqual({ status: 'pending', label: 'held for preview review' });
    expect(chosenBadge({ held: false })).toEqual({ status: 'approved', label: 'selected' });
    expect(chosenBadge(null)).toBeNull();
    expect(voiceStateBadge({ state: 'selected', held: true } as never).label).toBe('held for preview review');
  });
  it('voice filters separate selected, held, shortlisted and unvoiced', () => {
    const row = (voice: { held: boolean } | null, shortlist = 0, voiceUse: string | null = null) => ({ voice: voice as never, shortlist, voiceUse });
    expect(matchesVoiceFilter(row({ held: false }), 'selected')).toBe(true);
    expect(matchesVoiceFilter(row({ held: true }), 'selected')).toBe(false);
    expect(matchesVoiceFilter(row({ held: true }), 'held')).toBe(true);
    expect(matchesVoiceFilter(row(null, 2), 'shortlisted')).toBe(true);
    expect(matchesVoiceFilter(row({ held: true }, 2), 'shortlisted')).toBe(false);
    expect(matchesVoiceFilter(row(null), 'unvoiced')).toBe(true);
    expect(matchesVoiceFilter(row(null, 0, 'reference'), 'unvoiced')).toBe(false);
  });
  it('the reserved namespace includes held choices', () => {
    const a = { ...profile({ ...choice, productionHold: true }), characterId: 'a' };
    const b = { ...profile({ ...choice, voiceId: 'w' }), characterId: 'b', voiceId: 'w' };
    expect([...c.reserved([a, b])]).toEqual([['Fish Audio/v', 'a'], ['Fish Audio/w', 'b']]);
  });
  it('timeline is oldest first with the current choice, earlier choices and rejections', () => {
    const p = profile({ ...choice, productionHold: true, holdReason: 'unverified' }, [
      { provider: 'Fish Audio', voiceId: 'old', status: 'rejected', selectedBy: 'Matt Stark', selectedAt: '2026-10-10T00:00:00Z', rejectedBy: 'Matt Stark', rejectedAt: '2026-10-10T02:00:00Z', reason: 'too bright' },
    ]);
    expect(c.timeline(p).map((e) => [e.kind, e.voiceId])).toEqual([['chosen', 'old'], ['rejected', 'old'], ['held', 'v']]);
    expect(timelineLine({ at: '2026-10-10T02:00:00Z', kind: 'rejected', name: 'Old', provider: 'Fish Audio', reason: 'too bright' })).toBe('2026-10-10 Rejected Old (Fish Audio): too bright');
  });
});

describe('exact-words gate', () => {
  const d: EffectDirection = { id: 'e', provider: 'Fish Audio', voiceId: 'v', usage: 'u', generationApproved: false, exactWordsReviewRequired: true };
  it('blocks generation while exact words need review or generation is unapproved', () => {
    expect(c.effectGate(d).canGenerate).toBe(false);
    expect(c.effectGate({ ...d, generationApproved: true }).canGenerate).toBe(false);
    expect(c.effectGate({ ...d, exactWordsReviewRequired: false }).canGenerate).toBe(false);
    expect(c.effectGate({ ...d, exactWordsReviewRequired: false, generationApproved: true }).canGenerate).toBe(true);
    const { exactWordsReviewRequired: _omit, ...missing } = d;
    expect(c.effectGate(missing).canGenerate).toBe(false);
  });
  it('only usage and notes are editable', () => {
    expect([...c.EFFECT_EDITABLE]).toEqual(['usage', 'notes']);
  });
});

describe('live canonical data and store (temp copy)', () => {
  let tmp: string;
  let library: Library;
  let store: ComicsStore;
  let decisions: FileDecisionLog;
  const file = () => path.join(tmp, 'wiki', 'comics-library', 'voices.json');
  beforeAll(() => {
    tmp = mkdtempSync(path.join(os.tmpdir(), 'mtw-casting-'));
    mkdirSync(path.join(tmp, 'wiki', 'comics-library'), { recursive: true });
    for (const f of ['voices.json', 'provider-voices.json', 'speech-approvals.json', 'speech.json', 'characters.json']) cpSync(path.join(lib, f), path.join(tmp, 'wiki', 'comics-library', f));
    const wiki = new FileWikiStore(tmp, new FileLeases(tmp));
    decisions = new FileDecisionLog(wiki);
    library = new Library(tmp, (p) => wiki.readJson(p), { snapshotFile: comicsSnapshot() });
    store = new ComicsStore(wiki, decisions, library);
  });
  afterAll(() => rmSync(tmp, { recursive: true, force: true }));

  it('the held Second Brain choice is locked, listed, reserved and keeps its history', async () => {
    const snap = await library.snapshot();
    const sb = snap.voices.profiles.find((p) => p.characterId === 'second-brain') as Profile;
    if (c.choiceState(sb) !== 'held') return; // the canonical choice has moved on
    const ch = snap.derived.characters.find((x) => x.id === 'second-brain') as never;
    const detail = castDetail(snap, ch);
    expect(detail.locked).toBe(true);
    expect(detail.choice?.held).toBe(true);
    expect(detail.voice?.held).toBe(true);
    expect(detail.history.length).toBeGreaterThan(0);
    expect(detail.voices).toHaveLength(1);
    expect(castSummary(snap, snap.derived.characters, ch).voice?.held).toBe(true);
    // Other characters see the held voice as taken and are not offered it.
    const od = castDetail(snap, snap.derived.characters.find((x) => x.id === 'matt') as never);
    const key = c.chosen(sb) as c.VoiceChoice;
    expect(od.taken.some((t) => t.voiceId === key.voiceId && t.characterId === 'second-brain')).toBe(true);
    expect(od.voices.some((v) => v.voiceId === key.voiceId)).toBe(false);
  });

  it('refuses to replace a held choice or trim its shortlist', async () => {
    const snap = await library.snapshot();
    const held = snap.voices.profiles.find((p) => c.choiceState(p) === 'held');
    if (!held) return;
    await expect(store.selectVoice(held.characterId, 'anything')).rejects.toBeInstanceOf(ConflictError);
    const id = held.casting?.shortlistVoiceIds[0];
    if (id) await expect(store.shortlist(held.characterId, id, false)).rejects.toBeInstanceOf(ConflictError);
  });

  it('Change voice reopens a chosen voice: options return, then a new pick locks', async () => {
    const snap = await library.snapshot();
    const id = 'rogue';
    const p = snap.voices.profiles.find((x) => x.characterId === id) as Profile;
    const old = c.chosen(p);
    if (!old) return;
    await store.changeVoice(id);
    const reopened = await library.snapshot();
    const rp = reopened.voices.profiles.find((x) => x.characterId === id) as Profile;
    expect(c.chosen(rp)).toBeNull();
    expect(rp.casting?.history?.some((h) => h.status === 'replaced' && h.voiceId === old.voiceId)).toBe(true);
    const detail = castDetail(reopened, reopened.derived.characters.find((x) => x.id === id) as never);
    expect(detail.locked).toBe(false);
    expect(detail.voices.length).toBeGreaterThan(1);
    const pick = detail.voices.find((v) => v.voiceId !== old.voiceId) as { voiceId: string };
    await store.selectVoice(id, pick.voiceId);
    expect(c.chosen((await library.snapshot()).voices.profiles.find((x) => x.characterId === id) as Profile)?.voiceId).toBe(pick.voiceId);
    await expect(store.changeVoice('dana-does-not-exist')).rejects.toBeInstanceOf(InvalidError);
  });

  it('edits an effect direction keeping CRLF, gate flags and a decision record', async () => {
    const before = readFileSync(file(), 'utf8');
    const first = effectDirections(await library.snapshot())[0];
    expect(first?.gate.canGenerate).toBe(false);
    await store.editEffectDirection(first?.id as string, { notes: 'edited in test' });
    const after = readFileSync(file(), 'utf8');
    expect(after.includes('\r\n')).toBe(before.includes('\r\n'));
    const saved = (JSON.parse(after).effectVoiceDirections as EffectDirection[])[0] as EffectDirection;
    expect(saved.notes).toBe('edited in test');
    expect(saved.generationApproved).toBe(false);
    expect(saved.exactWordsReviewRequired).toBe(true);
    expect((await decisions.list('comics-library')).map((x) => x.action)).toContain('edit-effect-direction');
  });

  it('the app cannot approve generation or drop the exact-words review', async () => {
    const id = effectDirections(await library.snapshot())[0]?.id as string;
    for (const bad of ['generationApproved', 'exactWordsReviewRequired', 'voiceId', 'status']) await expect(store.editEffectDirection(id, { [bad]: 'true' } as never)).rejects.toBeInstanceOf(InvalidError);
    await expect(store.editEffectDirection(id, { usage: '  ' })).rejects.toBeInstanceOf(InvalidError);
    await expect(store.editEffectDirection('nope', { notes: 'x' })).rejects.toBeInstanceOf(InvalidError);
  });
});
