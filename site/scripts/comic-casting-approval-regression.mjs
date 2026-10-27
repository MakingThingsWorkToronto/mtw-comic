// Casting and speech-approval regression (skill: mtw-comic-story, references/console.md).
// Asserts properties of the shared casting authority (scripts/comics/voice-casting.mjs), the speech gate
// (site/scripts/comic-speech-approval.mjs) and the comics-library projection against the CURRENT canonical data,
// never a frozen roster or count, so ordinary casting decisions cannot make it stale. Offline: no browser, no provider
// request, no repo writes (fixtures live in a temp folder).
// Usage: node site/scripts/comic-casting-approval-regression.mjs [--repo <repo>] [--packet <dir>] [--profiles <voices.json>]
//   [--catalog <provider-voices.json>] [--data <comics-library.json>]
// --packet overlays any of scripts/comics/voice-casting.mjs, site/scripts/comic-speech-approval.mjs,
// site/scripts/build-comics-library.mjs and wiki/comics-library/*.json from another folder (a prospective or broken copy).
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';

const args = process.argv.slice(2), opt = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const repo = path.resolve(opt('--repo', process.cwd())), packet = path.resolve(opt('--packet', repo));
const sourceFile = rel => fs.existsSync(path.join(packet, rel)) ? path.join(packet, rel) : path.join(repo, rel);
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const files = {
  profiles: opt('--profiles', sourceFile('wiki/comics-library/voices.json')),
  characters: sourceFile('wiki/comics-library/characters.json'),
  catalog: opt('--catalog', sourceFile('wiki/comics-library/provider-voices.json')),
};
const c = await import(pathToFileURL(sourceFile('scripts/comics/voice-casting.mjs')).href);
const {assertSpeechApproved} = await import(pathToFileURL(sourceFile('site/scripts/comic-speech-approval.mjs')).href);
const profiles = read(files.profiles).profiles, characters = read(files.characters).characters, catalog = read(files.catalog).voices;
const characterOf = p => characters.find(x => x.id === p.characterId);
const hash = s => createHash('sha256').update(s).digest('hex');

const results = [];
const test = async (name, fn) => { try { await fn(); results.push({name, pass: true}); } catch (e) { results.push({name, pass: false, error: e.message}); } };

// The current roster, by state. Every later check derives its subjects from these lists.
const chosenProfiles = profiles.filter(p => c.chosen(p));
const held = chosenProfiles.filter(p => c.choiceState(p) === 'held');
const production = chosenProfiles.filter(p => c.choiceState(p) === 'production');
const open = profiles.filter(p => !c.chosen(p));
let owners = new Map();

await test('current canonical casting validates, and every Matt choice owns exactly one catalogued voice', () => {
  owners = c.validate(profiles, catalog, characters);
  assert.equal(owners.size, chosenProfiles.length, 'one reserved voice per chosen character');
  assert(chosenProfiles.length > 0 && production.length > 0, 'the roster has at least one production choice to exercise');
  for (const p of chosenProfiles) {
    const choice = c.chosen(p);
    assert.equal(owners.get(c.key(choice)), p.characterId);
    assert(catalog.some(v => c.key(v) === c.key(choice)), `${p.characterId}: chosen voice is catalogued`);
    assert.equal(p.provider + '/' + p.voiceId, choice.provider + '/' + choice.voiceId, `${p.characterId}: profile binds its choice`);
  }
});

await test('a choice counts only when Matt approved it with a date; agent or draft choices grant nothing', () => {
  for (const p of production.slice(0, 1)) {
    for (const forge of [s => s.selectedBy = 'agent', s => s.status = 'proposed', s => delete s.selectedAt, s => s.voiceId = '']) {
      const q = structuredClone(p); forge(q.casting.selectedVoice);
      assert.equal(c.chosen(q), null); assert.equal(c.selected(q), null); assert.equal(c.choiceState(q), 'none');
    }
  }
});

await test('a chosen character sees only its chosen voice and only clips in that voice', () => {
  for (const p of chosenProfiles) {
    const key = c.key(c.chosen(p));
    assert.deepEqual(c.options(p, catalog, profiles, characterOf(p)).map(c.key), [key], p.characterId);
    assert(c.clips(p).every(clip => c.key(clip) === key), `${p.characterId}: a clip in another voice is shown`);
  }
});

await test('a held choice reserves its voice but is never production-selected', () => {
  for (const p of held) {
    assert.equal(c.selected(p), null, p.characterId);
    assert.equal(c.reserved(profiles).get(c.key(c.chosen(p))), p.characterId);
  }
  // Make the hold explicit on a production choice: it must stop being selectable without losing the reservation.
  const q = structuredClone(production[0]); q.casting.selectedVoice.productionHold = true;
  assert.equal(c.selected(q), null); assert.equal(c.choiceState(q), 'held'); assert(c.chosen(q));
});

await test('an open character is offered only unowned, unrejected voices that fit its gender and persona', () => {
  for (const p of open) {
    const gender = p.voiceGender || characterOf(p)?.gender, persona = p.voicePersona;
    const rejected = (p.casting?.history || []).filter(h => h.status === 'rejected').map(c.key);
    for (const v of c.options(p, catalog, profiles, characterOf(p))) {
      assert(!owners.has(c.key(v)), `${p.characterId}: offered ${c.key(v)}, owned by ${owners.get(c.key(v))}`);
      assert(!rejected.includes(c.key(v)), `${p.characterId}: offered rejected ${c.key(v)}`);
      if (gender) assert.equal(v.labels?.gender, gender, `${p.characterId}: gender`);
      if (persona) assert([v.labels?.persona, v.labels?.descriptive].includes(persona) || v.verifiedFit?.[p.characterId] === true, `${p.characterId}: persona`);
    }
  }
});

await test('validation refuses a shared voice, a gender conflict, an uncatalogued voice, a split binding and a comparison-only production choice', () => {
  const [a] = production, b = profiles.find(p => p.characterId !== a.characterId);
  const steal = structuredClone(profiles), thief = steal.find(p => p.characterId === b.characterId);
  thief.casting = {...thief.casting, selectedVoice: structuredClone(a.casting.selectedVoice)}; thief.provider = a.provider; thief.voiceId = a.voiceId;
  // A voice gender conflict needs a gendered voice and no override; the flipped character gender is derived from it.
  const gendered = production.find(p => catalog.find(v => c.key(v) === c.key(p))?.labels?.gender && !p.voiceGender && p.casting.selectedVoice.genderOverride !== true);
  const assertGender = () => {
    if (!gendered) return;
    const voiceGender = catalog.find(v => c.key(v) === c.key(gendered)).labels.gender, flipped = structuredClone(characters);
    flipped.find(x => x.id === gendered.characterId).gender = voiceGender === 'male' ? 'female' : 'male';
    assert.throws(() => c.validate(profiles, catalog, flipped), /gender/);
  };
  assert.throws(() => c.validate(steal, catalog, characters), /two characters/);
  assertGender();
  assert.throws(() => c.validate(profiles, catalog.filter(v => c.key(v) !== c.key(a)), characters), /missing from provider catalog/);
  const split = structuredClone(profiles); split.find(p => p.characterId === a.characterId).voiceId = 'split-binding';
  assert.throws(() => c.validate(split, catalog, characters), /binding differs/);
  const reference = catalog.map(v => c.key(v) === c.key(a) ? {...v, comparisonOnly: true} : v);
  assert.throws(() => c.validate(profiles, reference, characters), /Comparison-only/);
  // The same reference is allowed only as a held preview-review choice.
  const previewed = structuredClone(profiles); Object.assign(previewed.find(p => p.characterId === a.characterId).casting.selectedVoice, {productionHold: true, useScope: 'preview-review'});
  assert.doesNotThrow(() => c.validate(previewed, reference, characters));
});

// The projection Studio reads. Rebuilt from the current sources into a temp file unless --data is supplied.
let data;
await test('the comics-library projection keeps every receipt and hashes every reviewable line exactly', () => {
  const dataSource = opt('--data', null);
  if (dataSource) data = read(dataSource);
  else {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mtw-comics-projection-')), snap = path.join(dir, 'comics-library.json');
    try {
      const run = spawnSync(process.execPath, [sourceFile('site/scripts/build-comics-library.mjs'), '--repo', repo, '--snapshot', snap], {cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024});
      assert.equal(run.status, 0, run.stderr);
      data = read(snap);
    } finally { fs.rmSync(dir, {recursive: true, force: true}); }
  }
  assert.equal(data.voiceReceiptAudit.length, profiles.reduce((n, p) => n + (p.clips || []).length, 0), 'one audit row per retained clip');
  const ids = data.comics.map(s => s.id);
  assert(ids.length > 0 && new Set(ids).size === ids.length, 'comic ids are unique');
  for (const comic of data.comics) for (const row of comic.textReview || []) {
    assert.equal(row.storyId, comic.id);
    assert.equal(row.textSha256, hash(Buffer.from(row.text, 'utf8')), `${row.id}: text hash`);
  }
});

// The speech gate, run against a temp copy of the canonical files so every forged state stays off the repo.
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'mtw-speech-gate-'));
const put = (rel, value) => { const f = path.join(temp, rel); fs.mkdirSync(path.dirname(f), {recursive: true}); fs.writeFileSync(f, typeof value === 'string' ? value : JSON.stringify(value)); };
const reset = () => {
  put('wiki/comics-library/voices.json', {profiles});
  put('wiki/comics-library/characters.json', {characters});
  put('wiki/comics-library/provider-voices.json', {voices: catalog});
  put(sourcePath, source);
};
const text = 'Exact words. — Don’t guess.', sourcePath = 'site/src/data/comic-stories/home.ts', source = 'retained authored script';
const speaker = production[0], choice = c.selected(speaker);
const review = (p = speaker, extra = {}) => ({id: 'gate-test-b1', characterId: p.characterId, provider: p.provider, voiceId: p.voiceId, textSha256: hash(text), storySource: {path: sourcePath, sha256: hash(source)}, status: 'approved', reviewedBy: 'Matt Stark', reviewedAt: new Date().toISOString(), ...extra});
const input = (p = speaker, extra = {}) => ({root: temp, approvalId: 'gate-test-b1', characterId: p.characterId, provider: p.provider, voiceId: p.voiceId, text, ...extra});
const reviews = (...rows) => put('wiki/comics-library/speech-approvals.json', {schemaVersion: 1, textReviews: rows});
try {
  await test('generation needs an exact human review of these words, this source and this voice', async () => {
    reset(); reviews();
    await assert.rejects(assertSpeechApproved(input()), /human review absent/);
    reviews(review());
    assert.equal((await assertSpeechApproved(input())).review.textSha256, hash(text));
    assert.equal(choice.voiceId, speaker.voiceId);
    await assert.rejects(assertSpeechApproved(input(speaker, {text: text + ' Changed.'})), /changed/);
    await assert.rejects(assertSpeechApproved(input(speaker, {voiceId: 'wrong'})), /approved voice/);
    put(sourcePath, source + ' changed');
    await assert.rejects(assertSpeechApproved(input()), /changed/);
    reset(); reviews(review(speaker, {reviewedBy: 'agent'}));
    await assert.rejects(assertSpeechApproved(input()), /changed/);
  });
  await test('an exact review cannot unlock an open, held or forged comparison-only voice', async () => {
    reset();
    for (const p of [...open.filter(p => p.voiceId), ...held]) {
      reviews(review(p));
      await assert.rejects(assertSpeechApproved(input(p)), /no matching approved voice/, p.characterId);
    }
    put('wiki/comics-library/provider-voices.json', {voices: catalog.map(v => c.key(v) === c.key(speaker) ? {...v, comparisonOnly: true} : v)});
    reviews(review());
    await assert.rejects(assertSpeechApproved(input()), /Comparison-only/);
  });
} finally { fs.rmSync(temp, {recursive: true, force: true}); }

const passed = results.filter(r => r.pass).length;
console.log(JSON.stringify({
  sources: {...files, voiceCasting: sourceFile('scripts/comics/voice-casting.mjs'), speechGate: sourceFile('site/scripts/comic-speech-approval.mjs')},
  roster: {profiles: profiles.length, production: production.length, held: held.length, open: open.length},
  retainedReceipts: data?.voiceReceiptAudit.length, comics: data?.comics.map(s => s.id),
  checks: results.length, passed, failed: results.filter(r => !r.pass), providerRequests: 0, repoWrites: 0,
}, null, 2));
if (passed !== results.length) process.exitCode = 1;
