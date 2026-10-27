import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as ts from '../modules/comics/server/casting';
import type { CatalogVoice, Profile, ReviewRow } from '../modules/comics/server/casting';
import { Library, reviewState } from '../modules/comics/server/library';
import type { Derived } from '../modules/comics/server/library';
import { comicsSnapshot } from './comics-snapshot';
import type { DerivedReview } from '../modules/comics/server/library';
import { mediaAllowed, serveMedia } from '../modules/comics/server/media';
import { castResolver, speechResolver, voiceResolver } from '../modules/comics/server/resolvers';
import { ComicsStore, ConflictError, InvalidError, normalizeCatalog } from '../modules/comics/server/store';
import type { CatalogFile } from '../modules/comics/server/store';
import { media } from '../server/core/media';
import { FileDecisionLog } from '../server/core/decisions';
import { FileLeases } from '../server/core/leases';
import { FileWikiStore } from '../server/core/wiki-store';

const appRoot = fileURLToPath(new URL('..', import.meta.url));
const repoRoot = path.resolve(appRoot, '..', '..');
const lib = path.join(repoRoot, 'wiki', 'comics-library');

const readJson = <T>(file: string): T => JSON.parse(readFileSync(file, 'utf8')) as T;

describe('shared casting contract through the typed Studio export', () => {
  const choice = { provider: 'Fish Audio', voiceId: 'fixture-current', status: 'approved', selectedBy: 'Matt Stark', selectedAt: '2026-10-11T00:00:00Z' };
  const profile = (selectedVoice: ts.VoiceChoice = choice): Profile => ({
    characterId: 'fixture', provider: selectedVoice.provider, voiceId: selectedVoice.voiceId, voiceGender: 'male',
    delivery: '', pace: '', pitch: '', accent: '', referenceAudio: '', sampleLine: '', pronunciations: '', notes: '',
    casting: { candidateVoiceIds: [], shortlistVoiceIds: [], selectedVoice, history: [] },
  });
  const catalog: CatalogVoice[] = [{ provider: 'Fish Audio', voiceId: 'fixture-current', name: 'Current', labels: { gender: 'male' } }];

  it('reserves held choices while refusing catalog, profile and duplicate-owner conflicts', () => {
    const held = profile({ ...choice, productionHold: true, useScope: 'preview-review' });
    expect([...ts.validate([held], [{ ...catalog[0] as CatalogVoice, comparisonOnly: true }])]).toEqual([['Fish Audio/fixture-current', 'fixture']]);
    expect(ts.chosen(held)).toBe(held.casting?.selectedVoice);
    expect(ts.selected(held)).toBeNull();
    expect(() => ts.validate([profile()], [])).toThrow('missing from provider catalog');
    expect(() => ts.validate([{ ...profile(), voiceId: 'stale' }], catalog)).toThrow('binding differs');
    expect(() => ts.validate([profile(), { ...profile(), characterId: 'other' }], catalog)).toThrow('two characters');
    expect(() => ts.validate([profile()], [{ ...catalog[0] as CatalogVoice, comparisonOnly: true }])).toThrow('Comparison-only');
  });

  it('a held chosen voice hides mismatched clips and options without removing history', () => {
    const held = profile({ ...choice, productionHold: true, useScope: 'preview-review' });
    held.clips = [
      { id: 'old', provider: 'Fish Audio', voiceId: 'previous', path: 'retained-old.mp3' },
      { id: 'current', provider: 'Fish Audio', voiceId: 'fixture-current', path: 'retained-current.mp3' },
    ];
    expect(ts.clips(held).map((c) => c.id)).toEqual(['current']);
    expect(held.clips).toHaveLength(2);
    expect(ts.options(held, [...catalog, { provider: 'Fish Audio', voiceId: 'previous', name: 'Previous' }], [held]).map((v) => v.voiceId)).toEqual(['fixture-current']);
    expect(ts.selected(held)).toBeNull();
    expect(ts.chosen(profile({ ...choice, selectedBy: 'agent' }))).toBeNull();
  });

  it('exact approval needs human review, bound current identity, exact words/source and no hold', () => {
    const p = profile();
    const row: ReviewRow = { id: 'fixture-b1', characterId: p.characterId, provider: choice.provider, voiceId: choice.voiceId, textSha256: 'exact-words', storySource: { path: 'site/src/data/comic-stories/home.ts', sha256: 'exact-source' } };
    const review = { ...row, provider: choice.provider, voiceId: choice.voiceId, status: 'approved', reviewedBy: 'Matt Stark', reviewedAt: '2026-10-11T00:00:00Z' };
    expect(ts.approval(row, review, p)).toBe(true);
    for (const patch of [{ textSha256: 'changed' }, { status: 'rejected' }, { reviewedBy: 'agent' }, { provider: '', voiceId: '' }, { voiceId: 'previous' }, { storySource: { ...row.storySource, sha256: 'changed' } }]) {
      expect(ts.approval(row, { ...review, ...patch }, p)).toBe(false);
    }
    expect(ts.approval(row, review, profile({ ...choice, productionHold: true }))).toBe(false);
  });
});

describe('library projection', () => {
  it('the producer projection matches the source files', async () => {
    const derived = JSON.parse(readFileSync(comicsSnapshot(), 'utf8')) as Derived;
    expect(derived.comics.length).toBeGreaterThanOrEqual(4);
    expect(derived.characters).toHaveLength(readJson<{ characters: unknown[] }>(path.join(lib, 'characters.json')).characters.length);
    expect(derived.comics.every((c) => c.textReview.every((r) => r.storySource.sha256))).toBe(true);
  });
});

describe('store writes (temp copy of the library)', () => {
  let tmp: string;
  let wiki: FileWikiStore;
  let store: ComicsStore;
  let library: Library;
  let decisions: FileDecisionLog;

  beforeAll(() => {
    tmp = mkdtempSync(path.join(os.tmpdir(), 'mtw-comics-'));
    mkdirSync(path.join(tmp, 'wiki', 'comics-library'), { recursive: true });
    for (const f of ['voices.json', 'provider-voices.json', 'speech-approvals.json', 'speech.json', 'characters.json']) {
      cpSync(path.join(lib, f), path.join(tmp, 'wiki', 'comics-library', f));
    }
    // Copy only the exact authored story sources required by the projection; no legacy wiki app code.
    const storyPaths = [...new Set(readJson<Derived>(comicsSnapshot()).comics.flatMap((c) => c.textReview.map((r) => r.storySource.path)))];
    for (const sourcePath of storyPaths) {
      const destination = path.join(tmp, sourcePath);
      mkdirSync(path.dirname(destination), { recursive: true });
      cpSync(path.join(repoRoot, sourcePath), destination);
    }
    expect(existsSync(path.join(tmp, 'wiki/comics-library/casting.js'))).toBe(false);
    wiki = new FileWikiStore(tmp, new FileLeases(tmp));
    decisions = new FileDecisionLog(wiki);
    library = new Library(tmp, (p) => wiki.readJson(p), { snapshotFile: comicsSnapshot() });
    store = new ComicsStore(wiki, decisions, library);
  });
  afterAll(() => rmSync(tmp, { recursive: true, force: true }));

  const file = (n: string) => path.join(tmp, 'wiki', 'comics-library', n);

  it('shortlists and un-shortlists a voice, keeping CRLF and untouched bytes', async () => {
    const snap = await library.snapshot();
    const catalog = normalizeCatalog(readJson<CatalogFile>(file('provider-voices.json')));
    const target = snap.voices.profiles.find((p) => !ts.chosen(p) && ts.options(p, catalog, snap.voices.profiles, snap.derived.characters.find((c) => c.id === p.characterId)).length > 0) as Profile;
    expect(target).toBeTruthy();
    const voice = ts.options(target, catalog, snap.voices.profiles, snap.derived.characters.find((c) => c.id === target.characterId))[0] as CatalogVoice;
    const before = readFileSync(file('voices.json'), 'utf8');
    await store.shortlist(target.characterId, voice.voiceId, true);
    const after = readFileSync(file('voices.json'), 'utf8');
    expect(after.includes('\r\n')).toBe(before.includes('\r\n'));
    expect(JSON.parse(after).profiles.find((p: Profile) => p.characterId === target.characterId).casting.shortlistVoiceIds).toContain(voice.voiceId);
    await store.shortlist(target.characterId, voice.voiceId, false);
    expect(JSON.parse(readFileSync(file('voices.json'), 'utf8')).profiles.find((p: Profile) => p.characterId === target.characterId).casting.shortlistVoiceIds).not.toContain(voice.voiceId);
    const log = await decisions.list('comics-library');
    expect(log.map((d) => d.action)).toEqual(['shortlist', 'unshortlist']);
  });

  it('edits profile fields and refuses unknown fields', async () => {
    await store.editProfile('matt', { notes: 'edited in test' });
    expect(JSON.parse(readFileSync(file('voices.json'), 'utf8')).profiles.find((p: Profile) => p.characterId === 'matt').notes).toBe('edited in test');
    await expect(store.editProfile('matt', { voiceId: 'x' } as never)).rejects.toBeInstanceOf(InvalidError);
  });

  it('gate contract: approve words, bind the chosen voice, then the real gate passes; changes make it throw', async () => {
    // The real gate, run as the skills run it: JSON on stdin, exit code and message out.
    const gate = (input: Record<string, string>): { ok: boolean; message: string } => {
      const r = spawnSync(process.execPath, [path.join(repoRoot, 'site', 'scripts', 'comic-speech-approval.mjs')], { input: JSON.stringify(input), encoding: 'utf8' });
      return { ok: r.status === 0, message: r.stderr };
    };
    const snap = await library.snapshot();
    const catalog = normalizeCatalog(readJson<CatalogFile>(file('provider-voices.json')));
    // A speaking character with no selection and at least one option.
    const rowsByChar = new Map<string, DerivedReview>();
    for (const c of snap.derived.comics) for (const r of c.textReview) if (!rowsByChar.has(r.characterId)) rowsByChar.set(r.characterId, r);
    const target = snap.voices.profiles.find((p) => rowsByChar.has(p.characterId) && !ts.chosen(p) && ts.options(p, catalog, snap.voices.profiles, snap.derived.characters.find((c) => c.id === p.characterId)).some(ts.productionSelectable)) as Profile;
    expect(target).toBeTruthy();
    const row = rowsByChar.get(target.characterId) as DerivedReview;
    const voice = ts.options(target, catalog, snap.voices.profiles, snap.derived.characters.find((c) => c.id === target.characterId)).find(ts.productionSelectable) as CatalogVoice;
    const args = { root: tmp, approvalId: row.id, characterId: row.characterId, provider: voice.provider ?? 'ElevenLabs', voiceId: voice.voiceId, text: row.text };
    const savedReview = () => readJson<{ textReviews: ts.TextReview[] }>(file('speech-approvals.json')).textReviews.find((r) => r.id === row.id) as ts.TextReview;

    expect(await store.reviewSpeech(row.id, 'approve')).toEqual({ state: 'unvoiced' });
    const wordsOnly = savedReview();
    expect(wordsOnly).toMatchObject({ id: row.id, characterId: row.characterId, provider: '', voiceId: '', textSha256: row.textSha256, storySource: row.storySource, status: 'approved', reviewedBy: 'Matt Stark' });
    expect(wordsOnly.reviewedAt).toBeTruthy();
    expect(gate(args)).toMatchObject({ ok: false, message: expect.stringContaining('matching approved voice') });
    await store.selectVoice(target.characterId, voice.voiceId);
    await expect(store.selectVoice(target.characterId, voice.voiceId)).rejects.toBeInstanceOf(ConflictError);
    // Selection binds the existing word approval; it preserves the review's words/source/human receipt.
    expect(savedReview()).toEqual({ ...wordsOnly, provider: voice.provider ?? 'ElevenLabs', voiceId: voice.voiceId });
    expect(reviewState(await library.snapshot(), row).state).toBe('approved');
    expect((await decisions.list('comics-library')).some((d) => d.action === 'bind-word-approvals')).toBe(true);
    expect(gate(args).ok).toBe(true);
    expect((await store.reviewSpeech(row.id, 'approve')).state).toBe('approved');
    expect(gate({ ...args, text: `${row.text} changed` })).toMatchObject({ ok: false, message: expect.stringContaining('blocked') });

    // Reject, then clear: the gate refuses both.
    await store.reviewSpeech(row.id, 'reject');
    expect(gate(args)).toMatchObject({ ok: false, message: expect.stringContaining('blocked') });
    await store.reviewSpeech(row.id, 'approve');
    await store.reviewSpeech(row.id, 'revoke');
    expect(gate(args)).toMatchObject({ ok: false, message: expect.stringContaining('blocked') });

    // A held current choice can have its words reviewed, but the real synthesis gate still refuses production.
    const heldProfile = snap.voices.profiles.find((p) => ts.chosen(p)?.productionHold === true && rowsByChar.has(p.characterId));
    if (heldProfile) {
      const heldChoice = ts.chosen(heldProfile) as ts.VoiceChoice;
      const heldRow = rowsByChar.get(heldProfile.characterId) as DerivedReview;
      expect(await store.reviewSpeech(heldRow.id, 'approve')).toEqual({ state: 'unvoiced' });
      const heldReview = readJson<{ textReviews: ts.TextReview[] }>(file('speech-approvals.json')).textReviews.find((r) => r.id === heldRow.id);
      expect(heldReview).toMatchObject({ provider: '', voiceId: '', textSha256: heldRow.textSha256, storySource: heldRow.storySource, status: 'approved' });
      expect(gate({ root: tmp, approvalId: heldRow.id, characterId: heldRow.characterId, provider: heldChoice.provider, voiceId: heldChoice.voiceId, text: heldRow.text })).toMatchObject({ ok: false, message: expect.stringContaining('production hold') });
    }

    // Story edited after review: the stored approval is stale in the app and refused by the gate.
    await store.reviewSpeech(row.id, 'approve');
    const storyFile = path.join(tmp, row.storySource.path);
    writeFileSync(storyFile, `${readFileSync(storyFile, 'utf8')}\n// touched\n`);
    const after = await library.snapshot();
    expect(reviewState(after, row).state).toBe('stale');
    expect(gate(args)).toMatchObject({ ok: false, message: expect.stringContaining('blocked') });
    await expect(store.reviewSpeech(row.id, 'approve')).rejects.toBeInstanceOf(ConflictError);

    // The approvals file keeps exactly the gate's shape.
    const approvals = readJson<{ schemaVersion: number; textReviews: Record<string, unknown>[] }>(file('speech-approvals.json'));
    expect(approvals.schemaVersion).toBe(1);
    expect(Object.keys(approvals.textReviews[0] as object).sort()).toEqual(['characterId', 'id', 'provider', 'reviewedAt', 'reviewedBy', 'status', 'storySource', 'textSha256', 'voiceId']);
  });

  it('preserves changes another writer made since the last view', async () => {
    const before = readFileSync(file('voices.json'), 'utf8');
    const other = JSON.parse(before) as { profiles: Profile[] };
    (other.profiles.find((p) => p.characterId === 'claude') as Profile).notes = 'changed by another writer';
    // Writer B lands between this call's read and its write: simulate by writing first, then editing a different field.
    writeFileSync(file('voices.json'), JSON.stringify(other, null, 2).replace(/\n/g, '\r\n') + '\r\n');
    await store.editProfile('matt', { pace: 'slow' });
    const final = JSON.parse(readFileSync(file('voices.json'), 'utf8')) as { profiles: Profile[] };
    expect(final.profiles.find((p) => p.characterId === 'claude')?.notes).toBe('changed by another writer');
    expect(final.profiles.find((p) => p.characterId === 'matt')?.pace).toBe('slow');
  });

  it('refuses a write to a leased path', async () => {
    mkdirSync(path.join(tmp, 'wiki', 'operations'), { recursive: true });
    writeFileSync(path.join(tmp, 'wiki', 'operations', 'leases.json'), JSON.stringify([{ path: 'wiki/comics-library/voices.json', holder: 'other-session' }]));
    await expect(store.editProfile('matt', { pace: 'fast' })).rejects.toBeInstanceOf(ConflictError);
    rmSync(path.join(tmp, 'wiki', 'operations', 'leases.json'));
  });
});

describe('resolvers', () => {
  const library = new Library(repoRoot, (p) => new FileWikiStore(repoRoot).readJson(p), { snapshotFile: comicsSnapshot() });
  it('cast, voice and speech resolve', async () => {
    const cast = await castResolver(library).list({ limit: 100 });
    expect(cast.total).toBeGreaterThan(20);
    expect((await castResolver(library).resolve('cast:matt'))?.title).toBe('Matt');
    const voices = await voiceResolver(library).list({ limit: 200 });
    expect(voices.items.some((v) => v.ref.startsWith('voice:clip/'))).toBe(true);
    const first = voices.items[0];
    expect((await voiceResolver(library).resolve(first?.ref ?? ''))?.ref).toBe(first?.ref);
    const speech = await speechResolver(library).list({ limit: 300 });
    expect(speech.items[0]?.preview).toBeTruthy();
    expect(await speechResolver(library).resolve('speech:nope')).toBeNull();
    for (const i of [...cast.items, ...voices.items, ...speech.items]) expect(i.canonicalPath.startsWith('wiki/')).toBe(true);
  });
});

describe('media', () => {
  it('allowlist, ranges and revalidation through the core media service', async () => {
    expect(mediaAllowed('wiki/soundtrack-library/assets/voices/a.mp3')).toBe(true);
    expect(mediaAllowed('wiki/soundtrack-library/assets/../../x.mp3')).toBe(false);
    expect(mediaAllowed('wiki/comics-library/voices.json')).toBe(false);
    expect(mediaAllowed('site/public/x.mp3')).toBe(false);
    expect(mediaAllowed('site/public/comic/home/home-quote-20261010-device-v2-1600.webp')).toBe(true);
    expect(mediaAllowed('site/public/comic/../secret.webp')).toBe(false);
    expect(mediaAllowed('site/public/comic/agentic/live-20261010/agentic-five-composite-selected-v4-1600.webp')).toBe(true);
    expect(mediaAllowed('site/public/comic/agentic/live-20261010/../../x.webp')).toBe(false);

    const speech = readJson<{ records: { canonicalPath: string }[] }>(path.join(lib, 'speech.json')).records[0] as { canonicalPath: string };
    expect(existsSync(path.join(repoRoot, speech.canonicalPath))).toBe(true);
    const whole = await serveMedia(media, repoRoot, speech.canonicalPath);
    expect(whole.status).toBe(200);
    (whole.stream as unknown as { destroy(): void }).destroy();
    const part = await serveMedia(media, repoRoot, speech.canonicalPath, { range: 'bytes=0-99' });
    expect(part.status).toBe(206);
    expect(part.headers?.['content-range']).toMatch(/^bytes 0-99\//);
    expect(part.headers?.['content-length']).toBe('100');
    const chunks: Buffer[] = [];
    for await (const c of part.stream as AsyncIterable<Buffer>) chunks.push(c);
    expect(Buffer.concat(chunks)).toHaveLength(100);
    expect((await serveMedia(media, repoRoot, speech.canonicalPath, { range: 'bytes=99999999999-' })).status).toBe(416);
    expect((await serveMedia(media, repoRoot, 'wiki/comics-library/voices.json')).status).toBe(403);
    expect((await serveMedia(media, repoRoot, 'wiki/soundtrack-library/assets/speech/nope.mp3')).status).toBe(404);
  });
});
