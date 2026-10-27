#!/usr/bin/env node
// Validate the illustrated comics projection from existing authored sources. No art, audio or website build.
// MTW Studio computes the same projection live (apps/mtw/modules/comics/server/library.ts, /m/comics); this script
// writes nothing unless --snapshot <file.json> asks for a parity snapshot. Casting rules come from the maintained Studio runtime.
// From repo root: node site/scripts/build-comics-library.mjs [--snapshot <file.json>]
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join, basename, relative } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import * as castingTools from '../../scripts/comics/voice-casting.mjs';
import { createHash } from 'node:crypto';
import { registerHooks } from 'node:module';
const args = process.argv.slice(2);
const opt = (key, fallback) => { const i = args.indexOf(`--${key}`); return i < 0 ? fallback : args[i + 1]; };
const repo = resolve(opt('repo', process.cwd()));
const input = resolve(opt('inputs', join(repo, 'wiki/comics-library')));
const snapshot = opt('snapshot', null);
const imageHome = join(repo, 'wiki/image-library');
const voiceHome = join(repo, 'wiki/comics-library');
// Canonical audio lives in soundtrack-library; retained comic-local media remains readable.
export function canonicalAudioRef(value, kind = 'assets') {
  let path = String(value || '');
  if (path.startsWith('../soundtrack-library/')) path = 'wiki/soundtrack-library/' + path.slice('../soundtrack-library/'.length);
  else if (path.startsWith(kind + '/')) path = 'wiki/comics-library/' + path;
  if (path.includes('\\') || path.split('/').some((p) => !p || p === '.' || p === '..') ||
      !['wiki/comics-library/' + kind + '/', 'wiki/soundtrack-library/' + kind + '/'].some((prefix) => path.startsWith(prefix))) throw new Error('Unsafe canonical audio reference: ' + value);
  return path;
}
export function audioRefs(record, localKey, canonicalKey, kind = 'assets') {
  const path = canonicalAudioRef(record[canonicalKey] || record[localKey], kind);
  if (record[canonicalKey] && record[localKey] && canonicalAudioRef(record[localKey], kind) !== path) throw new Error('Contradictory audio path aliases');
  return path;
}
export function providerPreviewPath(preview) {
  if (!/^[A-Za-z0-9_-]+$/.test(preview.voiceId)) throw new Error(`Unsafe provider voice ID: ${preview.voiceId}`);
  const path = audioRefs(preview, 'previewAsset', 'canonicalPath');
  const assetId = preview.provider === 'Fish Audio' ? `fish-${preview.voiceId}` : preview.voiceId;
  const retained = ['comics', 'soundtrack'].some((home) => ['mp3', 'wav'].some((ext) => path === `wiki/${home}-library/assets/voices/provider-previews/${assetId}.${ext}`));
  const prefix = `wiki/soundtrack-library/assets/voices/provider-previews/${assetId}-v`;
  const versioned = path.startsWith(prefix) && /^[1-9][0-9]*\.(mp3|wav)$/.test(path.slice(prefix.length));
  if (!retained && !versioned) throw new Error(`Unsafe provider preview asset path: ${path}`);
  return path;
}
const audioHref = (path) => path.startsWith('wiki/soundtrack-library/') ? '../soundtrack-library/' + path.slice('wiki/soundtrack-library/'.length) : path.slice('wiki/comics-library/'.length);
const sourceHashes = {}, warnings = [];
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
function read(file) { const bytes = readFileSync(file); sourceHashes[relative(repo, file).replace(/\\/g, '/')] = hash(bytes); return bytes.toString('utf8'); }
const parse = (file) => JSON.parse(read(file));
const manifest = parse(join(imageHome, 'manifest.json'));
const characterInput = parse(join(input, 'characters.json'));
const voiceInput = parse(join(input, 'voices.json'));
const voiceCatalog = parse(join(input, 'provider-voices.json'));
read(fileURLToPath(new URL('../../scripts/comics/voice-casting.mjs', import.meta.url)));
const approvalPath = join(input, 'speech-approvals.json');
const speechApprovals = existsSync(approvalPath) ? parse(approvalPath) : {schemaVersion:1,textReviews:[]};
if (speechApprovals.schemaVersion !== 1 || !Array.isArray(speechApprovals.textReviews)) throw new Error('Invalid human speech approval input');
const soundMetadataPath = resolve(opt('sounds', join(input, 'sounds.json')));
const soundInput = existsSync(soundMetadataPath) ? parse(soundMetadataPath) : { schemaVersion: 1, rooms: {} };
if (soundInput.schemaVersion !== 1 || !soundInput.rooms || typeof soundInput.rooms !== 'object' || Array.isArray(soundInput.rooms)) throw new Error('Unsupported environment sound metadata');
const soundCatalog = Object.entries(soundInput.rooms).map(([room, entry]) => {
  if (!['street', 'office', 'servers', 'rain'].includes(room)) throw new Error('Unknown environment sound ' + room);
  if (!entry || !/^\/comic\/sound\/[a-z0-9-]+\.mp3$/.test(entry.src || '')) throw new Error('Unsafe environment sound path ' + room);
  const path = audioRefs(entry, 'libraryPath', 'canonicalPath');
  if (!/^wiki\/(comics|soundtrack)-library\/assets\/sounds\/rooms\/[a-z0-9-]+\.mp3$/.test(path)) throw new Error('Unsafe environment sound path ' + room);
  const file = resolve(repo, path), bytes = readFileSync(file);
  entry.libraryPath = audioHref(path);
  for (const [localKey, canonicalKey, kind, declaredHash] of [['originalPath', 'originalCanonicalPath', 'assets', entry.originalSha256], ['receipt', 'receiptCanonicalPath', 'records', entry.receiptSha256]]) {
    if (!entry[localKey] && !entry[canonicalKey]) continue;
    const ref = audioRefs(entry, localKey, canonicalKey, kind);
    if (kind === 'assets' && !ref.includes('/assets/sounds/rooms/originals/') || kind === 'records' && !ref.endsWith('.json')) throw new Error('Unsafe environment provenance path ' + room);
    const source = resolve(repo, ref), raw = readFileSync(source);
    if (declaredHash && hash(raw) !== declaredHash) throw new Error('Environment provenance hash differs ' + room);
    sourceHashes[ref] = hash(raw); entry[localKey] = audioHref(ref);
  }
  if (hash(bytes) !== entry.sha256 || bytes.length !== entry.bytes) throw new Error('Environment sound identity mismatch ' + room);
  sourceHashes[relative(repo, file).replace(/\\/g, '/')] = hash(bytes);
  return { room, ...entry };
});
if (characterInput.schemaVersion !== 1 || voiceInput.schemaVersion !== 1 || !Array.isArray(characterInput.characters) || !Array.isArray(voiceInput.profiles)) throw new Error('Unsupported comics authoring profile schema');
if (voiceCatalog.schemaVersion !== 1 || !Array.isArray(voiceCatalog.voices) || typeof voiceCatalog.provider !== 'string') throw new Error('Unsupported provider voice catalog schema');
// Retained schema-1 ElevenLabs records predate per-entry providers. Normalize only the projection.
for (const voice of voiceCatalog.voices) {
  voice.provider = voice.provider ?? (voiceCatalog.provider.toLowerCase() === 'mixed' ? 'ElevenLabs' : voiceCatalog.provider);
  if (typeof voice.provider !== 'string' || !voice.provider.trim() || voice.provider.toLowerCase() === 'mixed') throw new Error(`Voice catalog entry has no concrete provider: ${voice.voiceId}`);
}
castingTools.validate(voiceInput.profiles, voiceCatalog.voices, characterInput.characters);
const unique = (rows, key) => { const ids = rows.map((x) => x[key]); if (new Set(ids).size !== ids.length) throw new Error(`Duplicate ${key}`); };
unique(characterInput.characters, 'id'); unique(voiceInput.profiles, 'characterId');
unique(voiceCatalog.voices, 'voiceId');
const characterIds = new Set(characterInput.characters.map((c) => c.id));
for (const p of voiceInput.profiles) if (!characterIds.has(p.characterId)) throw new Error(`Voice profile has no character: ${p.characterId}`);
for (const c of characterInput.characters) if (!voiceInput.profiles.some((p) => p.characterId === c.id)) throw new Error(`Character has no voice profile: ${c.id}`);
const catalogIds = new Set(voiceCatalog.voices.map((v) => v.voiceId));
for (const profile of voiceInput.profiles) if (profile.casting != null) {
  for (const field of ['candidateVoiceIds', 'shortlistVoiceIds']) {
    if (!Array.isArray(profile.casting[field])) throw new Error(`Casting ${field} must be an array: ${profile.characterId}`);
    const ids = profile.casting[field];
    if (new Set(ids).size !== ids.length) throw new Error(`Duplicate casting ${field}: ${profile.characterId}`);
    for (const id of ids) if (!catalogIds.has(id)) throw new Error(`Unknown provider preview voice ID: ${profile.characterId}/${id}`);
  }
}
function audioContainer(bytes) {
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WAVE') return 'wav';
  if (bytes.length >= 3 && bytes.subarray(0, 3).toString() === 'ID3') return 'mp3';
  if (bytes.length >= 2 && bytes[0] === 255 && (bytes[1] & 224) === 224 && (bytes[1] & 6) !== 0) return 'mp3';
  return null;
}
for (const preview of voiceCatalog.voices) {
  if (!/^[A-Za-z0-9_-]+$/.test(preview.voiceId)) throw new Error(`Unsafe provider voice ID: ${preview.voiceId}`);
  if (preview.status !== 'provider-preview' || preview.generatedForCharacter !== false) throw new Error(`Provider preview must remain separate from character generation: ${preview.voiceId}`);
  const path = providerPreviewPath(preview);
  preview.previewAsset = audioHref(path);
  const file = resolve(repo, path);
  if (!existsSync(file)) throw new Error(`Missing provider preview: ${path}`);
  const bytes = readFileSync(file), container = audioContainer(bytes);
  if (!container || !path.endsWith('.' + container)) throw new Error(`Provider preview container differs from extension: ${path}`);
  if (!/^[a-f0-9]{64}$/i.test(preview.sha256 || '') || hash(bytes) !== preview.sha256.toLowerCase()) throw new Error(`Provider preview hash differs: ${path}`);
  if (preview.bytes !== bytes.length) throw new Error(`Provider preview byte count differs: ${path}`);
}
const generationIds = new Set(), voiceReceiptAudit = [];
const textKey = (text) => String(text ?? '').replace(/\s+/g, ' ').trim();
export function auditVoiceReceipt(profile, clip, receipt, bytes) {
  const fail = (reason) => { throw new Error(`Voice receipt identity differs (${reason}): ${profile.characterId}/${clip.id}`); };
  if (/reject|fail|unknown|pending|started|unvalidated/i.test(receipt.status || '') || receipt.httpStatus != null && receipt.httpStatus !== 200) fail('receipt is not a saved success');
  const clipPath = audioRefs(clip, 'path', 'canonicalPath');
  if (!['comics', 'soundtrack'].some((home) => clipPath.startsWith(`wiki/${home}-library/assets/voices/${profile.characterId}/`))) fail('character path');
  const asset = receipt.savedAsset || receipt;
  if (clipPath !== audioRefs(asset, 'path', 'canonicalPath') || clip.sha256 !== asset.sha256 || hash(bytes) !== clip.sha256) fail('file/hash');
  if (receipt.path != null && canonicalAudioRef(receipt.path) !== clipPath || receipt.sha256 != null && receipt.sha256 !== asset.sha256) fail('receipt aliases');
  if (clip.provider === 'Fish Audio' && (receipt.text !== clip.text || receipt.settings?.text !== clip.text)) fail('exact Fish UTF-8 script text');
  if (asset.bytes != null && asset.bytes !== bytes.length || clip.bytes != null && clip.bytes !== bytes.length) fail('bytes');
  if (typeof clip.provider !== 'string' || !clip.provider.trim() || receipt.provider !== clip.provider) fail('provider');
  if (!clip.voiceId || receipt.voiceId !== clip.voiceId) fail('voice ID');
  if (receipt.id != null && receipt.id !== clip.id) fail('clip ID');
  if (receipt.characterId != null && receipt.characterId !== profile.characterId) fail('character ID');
  if (!clip.scriptId || receipt.scriptId != null && receipt.scriptId !== clip.scriptId) fail('script ID');
  if (!textKey(clip.text) || textKey(receipt.text) !== textKey(clip.text)) fail('script text');
  if (receipt.textSha256 != null && receipt.textSha256 !== hash(Buffer.from(receipt.text, 'utf8'))) fail('script hash');
  const request = receipt.request || receipt.settings || {};
  if (request.text != null && textKey(request.text) !== textKey(clip.text) || request.prompt != null && textKey(request.prompt) !== textKey(clip.text)) fail('request text');
  if (request.reference_id != null && request.reference_id !== clip.voiceId || request.voiceId != null && request.voiceId !== clip.voiceId) fail('request voice ID');
  const script = (profile.auditionScripts || []).find((s) => s.id === clip.scriptId);
  const source = [receipt.scriptSource, request.scriptSource, clip.settings?.scriptSource, script?.source].filter(Boolean).join(' ');
  if (receipt.scriptSource != null && clip.settings?.scriptSource != null && receipt.scriptSource !== clip.settings.scriptSource) fail('script source');
  const comparison = clip.scriptId === 'comparison-read' && /audition.only/i.test(source);
  if (script ? textKey(script.text) !== textKey(clip.text) : !comparison) fail('named script or explicit audition-only comparison');
  if (profile.voiceRole === 'reference-only' && !comparison) fail('reference-only comparison role');
  if (clip.generatedForCharacter === false || clip.status === 'provider-preview' || receipt.status === 'provider-preview') fail('provider demo is not generated character audio');
  const model = receipt.modelId || request.modelId;
  if (model && clip.settings?.modelId && model !== clip.settings.modelId) fail('model ID');
  return { characterId: profile.characterId, clipId: clip.id, provider: clip.provider, scriptId: clip.scriptId, receiptShape: receipt.savedAsset ? 'savedAsset' : 'legacy-flat', generationId: receipt.generationId || request.generationId || null };
}
for (const profile of voiceInput.profiles) {
 unique(profile.clips || [], 'id');
 for (const clip of profile.clips || []) {
  const path = audioRefs(clip, 'path', 'canonicalPath');
  if (!['comics', 'soundtrack'].some((home) => path.startsWith(`wiki/${home}-library/assets/voices/${profile.characterId}/`))) throw new Error(`Voice candidate path must stay in its canonical character directory: ${path}`);
  clip.path = audioHref(path);
  const file = resolve(repo, path);
  if (!existsSync(file)) throw new Error(`Missing voice candidate: ${path}`);
  const bytes = readFileSync(file), container = audioContainer(bytes);
  if (!container || !path.endsWith('.' + container)) throw new Error(`Voice candidate container differs from extension: ${path}`);
  const receiptPath = audioRefs(clip, 'receipt', 'receiptCanonicalPath', 'records');
  if (!receiptPath.endsWith('.json')) throw new Error(`Unsafe voice receipt path: ${receiptPath}`);
  clip.receipt = audioHref(receiptPath);
  const role = characterInput.characters.find((c) => c.id === profile.characterId)?.voiceRole;
  const audit = auditVoiceReceipt({ ...profile, voiceRole: role || profile.voiceRole }, clip, parse(resolve(repo, receiptPath)), bytes);
  if (audit.generationId) {
    const key = `${audit.provider}/${audit.generationId}`;
    if (generationIds.has(key)) throw new Error(`Duplicate generated voice ID: ${key}`);
    generationIds.add(key);
  }
  voiceReceiptAudit.push(audit);
 }
}
registerHooks({ resolve(spec, ctx, next) { try { return next(spec, ctx); } catch (e) {
  if (/^\.\.?\//.test(spec) && !/\.[a-z]+$/i.test(spec)) return next(spec + '.ts', ctx); throw e;
} } });
const storyDir = join(repo, 'site/src/data/comic-stories');
for (const file of readdirSync(storyDir).filter((f) => f.endsWith('.ts'))) read(join(storyDir, file));
read(join(repo, 'wiki/site/comic-story.md')); const worldText = read(join(repo, 'wiki/site/comic-story-world.md'));
const typesText = read(join(storyDir, 'types.ts'));
const union = typesText.match(/export type CastId\s*=([\s\S]*?);/);
if (!union) throw new Error('Cannot resolve the canonical CastId type');
const typeCastIds = [...union[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
if (!typeCastIds.length) throw new Error('Canonical CastId type is empty');
for (const id of typeCastIds) if (!characterIds.has(id)) throw new Error(`Canonical CastId has no character profile: ${id}`);
const table = worldText.split('| Character |')[1]?.split(/\r?\n\r?\n/)[0];
if (!table) throw new Error('Cannot resolve the world introduction roster');
const canonicalNames = [...table.matchAll(/^\|\s*\*\*([^*]+)\*\*/gm)].map((m) => m[1]);
const silentPeople = worldText.match(/\*\*People seen but never speaking\*\*([^\r\n]+)/)?.[1] || '';
canonicalNames.push(...[...silentPeople.matchAll(/\*\*([^*]+)\*\*/g)].map((m) => m[1]));
canonicalNames.push(...[...worldText.matchAll(/document system,\s*([A-Z][A-Za-z0-9-]*)/g)].map((m) => m[1]));
const nameKey = (name) => String(name).trim().toLowerCase().replace(/^the\s+/, '');
for (const name of canonicalNames) if (!characterInput.characters.some((c) => [c.name, ...c.aliases].some((alias) => nameKey(alias) === nameKey(name)))) throw new Error(`Canonical named cast has no character profile: ${name}`);
const typeCast = new Set(typeCastIds);
export const validateCastId = (id, context) => { if (!typeCast.has(id)) throw new Error(`Unknown story CastId: ${context}/${id}`); };
const { comicIssues, artSrc, artPosition } = await import(pathToFileURL(join(storyDir, 'index.ts')).href);
const { demoComic } = await import(pathToFileURL(join(storyDir, 'demo.ts')).href);
const assetCache = new Map();
function asset(recordId, style = 'comic-ink') {
  const key = `${recordId}/${style}`; if (assetCache.has(key)) return assetCache.get(key);
  const record = manifest.records.find((r) => r.id === recordId), treatment = record?.treatments?.[style];
  if (!treatment) { warnings.push(`No registered ${style} treatment for ${recordId}`); return null; }
  const file = resolve(imageHome, treatment.path), inside = relative(imageHome, file);
  if (inside.startsWith('..') || /^[A-Za-z]:/.test(inside)) throw new Error(`Image path escapes library: ${treatment.path}`);
  const present = existsSync(file), actualHash = present ? hash(readFileSync(file)) : null;
  if (!present) warnings.push(`Missing registered image: ${treatment.path}`);
  if (treatment.sha256 && actualHash !== treatment.sha256) warnings.push(`Image hash differs from manifest: ${treatment.path}`);
  const value = { recordId, style, title: record.title, path: `../image-library/${treatment.path}`, status: treatment.status || null, sha256: actualHash, present };
  assetCache.set(key, value); return value;
}
function assetForPath(path) {
  for (const record of manifest.records) for (const [style, treatment] of Object.entries(record.treatments || {})) {
    if (treatment.path === path || basename(treatment.path) === basename(path)) return asset(record.id, style);
  }
  warnings.push(`No canonical image mapping for ${path}`); return null;
}
const normalize = (text) => String(text).replace(/\s+/g, ' ').trim();
const matchIntro = (b) => ['caption', 'place'].includes(b.kind) ? characterInput.characters.find((c) => c.id !== 'narrator' && c.aliases.some((name) => normalize(b.text).toLowerCase().startsWith(name.toLowerCase() + '.'))) : null;
// Begin panel ambience projection (shared with focused offline fixtures).
function panelAmbience(scene) {
  const rooms = new Set(['office', 'servers', 'street', 'rain', 'none']);
  const fallback = scene.room ?? 'none';
  if (!rooms.has(fallback)) throw new Error('Unknown scene ambience ' + fallback);
  return scene.panels.map((panel, index) => {
    const authored = panel.room != null, room = authored ? panel.room : fallback;
    if (!rooms.has(room)) throw new Error('Unknown panel ambience ' + room);
    return { panel: index + 1, id: panel.img || panel.id || null, room, authored, fallback };
  });
}
// End panel ambience projection.
function comic(entry, demo = false) {
  const story = entry.story, speakers = new Set(), introductions = [], textReview = [];
  const sourcePath = 'site/src/data/comic-stories/' + (demo ? 'demo' : story.id) + '.ts';
  const storySource = {path:sourcePath,sha256:sourceHashes[sourcePath]};
  if (!storySource.sha256) throw new Error('Missing text review story guard ' + sourcePath);
  const scenes = story.scenes.map((scene) => {
    const effects = [], motion = [], sceneSpeakers = new Set();
    for (const id of scene.villains || []) validateCastId(id, `${story.id}/${scene.id}/villains`);
    for (const [index, panel] of scene.panels.entries()) {
      for (const fx of panel.sfx || []) effects.push({ panel: index + 1, ...fx });
      if (panel.motion) motion.push({ panel: index + 1, ...panel.motion });
      for (const [balloonIndex, balloon] of (panel.balloons || []).entries()) {
        const characterId = balloon.speech?.characterId ?? (['caption', 'place'].includes(balloon.kind) ? 'second-brain' : balloon.who);
        const profile = voiceInput.profiles.find((p) => p.characterId === characterId), choice = castingTools.selected(profile);
        textReview.push({id:`${story.id}-${scene.id}-${panel.img || 'panel-' + index}-b${balloonIndex + 1}`,...(typeof balloon.speech?.id === 'string' ? {speechId:balloon.speech.id} : {}),storyId:story.id,sceneId:scene.id,panelId:panel.img || null,panelIndex:index,balloonIndex,kind:balloon.kind,authoredWho:balloon.who,characterId,text:balloon.text,textSha256:hash(Buffer.from(balloon.text,'utf8')),storySource,provider:choice?.provider || null,voiceId:choice?.voiceId || null,startSeconds:(scene.b+Math.max(panel.at,balloon.at))*60/story.bpm+.3});
        validateCastId(balloon.who, `${story.id}/${scene.id}/${index + 1}`);
        const intro = matchIntro(balloon);
        if (intro) introductions.push({ characterId: intro.id, sceneId: scene.id, sceneTitle: scene.title, panel: index + 1, text: balloon.text, branded: balloon.characterIntro === true });
        if (!['caption', 'place'].includes(balloon.kind) && balloon.who !== 'narrator') { speakers.add(balloon.who); sceneSpeakers.add(balloon.who); }
      }
    }
    return { id: scene.id, title: scene.title, beat: scene.b, beats: scene.l, seconds: scene.l * 60 / story.bpm, panels: scene.panels.length,
      score: scene.score ?? 0, scoreAuthored: scene.score != null, room: scene.room ?? 'none', roomAuthored: scene.room != null, panelRooms: panelAmbience(scene), effects, motion, speakers: [...sceneSpeakers], villains: scene.villains || [], art: scene.art || null };
  });
  const missingIntroductions = [...speakers].filter((id) => characterInput.characters.find((c) => c.id === id)?.introduction && !introductions.some((intro) => intro.characterId === id));
  const missingProfiles = [...speakers].filter((id) => !voiceInput.profiles.some((v) => v.characterId === id && v.delivery.trim()));
  const unknownSpeakers = [...speakers].filter((id) => !characterIds.has(id));
  for (const id of unknownSpeakers) warnings.push(`${story.id}: no character profile for ${id}`);
  const cover = demo ? assetForPath('assets/scenes/comic-b/pages/home-p1-v5-print.png') : assetForPath(artSrc(entry.cover, story));
  return { id: story.id, issue: demo ? null : story.issue, title: story.title, collection: demo ? 'demo' : 'issue', hook: demo ? 'Original illustrated experiment, retained separately.' : entry.hook,
    path: demo ? '/comics/demo/' : `/comics/${entry.slug}/`, bPage: entry.bPage || null, cover, coverPosition: demo ? '50% 50%' : artPosition(entry.cover),
    durationSeconds: story.beats * 60 / story.bpm, bpm: story.bpm, panelCount: scenes.reduce((n, s) => n + s.panels, 0), music: story.music,
    speakers: [...speakers], introductions, scenes, textReview, soundAssets: story.soundAssets || null, nextSound: story.next.sound || null,
    coverage: { missingIntroductions, missingProfiles, unknownSpeakers, unmarkedIntroductions: introductions.filter((i) => !i.branded).length,
      scenesWithoutExplicitScore: scenes.filter((s) => !s.scoreAuthored).map((s) => s.id), scenesWithoutExplicitRoom: scenes.filter((s) => !s.roomAuthored).map((s) => s.id), panelsWithoutExplicitRoom: scenes.flatMap((s) => s.panelRooms.filter((p) => !p.authored).map((p) => ({ sceneId: s.id, panel: p.panel, id: p.id }))), panelsWithMotion: scenes.reduce((n, s) => n + s.motion.length, 0) } };
}
const comics = [...comicIssues].sort((a, b) => a.story.issue - b.story.issue).map((entry) => comic(entry));
comics.push(comic({ story: demoComic }, true));
const characters = characterInput.characters.map((c) => ({ ...c, model: c.modelRecord ? asset(c.modelRecord) : null,
  speakingIn: comics.filter((story) => story.speakers.includes(c.id)).map((story) => story.id),
  introductions: comics.flatMap((story) => story.introductions.filter((i) => i.characterId === c.id).map((i) => ({ comicId: story.id, comicTitle: story.title, ...i }))) }));
const references = [...characterInput.references.map((r) => ({ ...r, asset: asset(r.recordId, r.style) })),
  ...[...new Set(characters.map((c) => c.modelRecord).filter(Boolean))].map((recordId) => ({ recordId, kind: 'Character model sheet', label: manifest.records.find((r) => r.id === recordId)?.title || recordId, asset: asset(recordId) }))];
const castCoverage = { typeCastIds, canonicalNames: [...new Set(canonicalNames)], characterProfiles: characters.length, voiceProfiles: voiceInput.profiles.length, dialogueSpeakers: [...new Set(comics.flatMap((c) => c.speakers))], narrationProfile: 'narrator', referenceOnlyProfiles: characters.filter((c) => c.voiceUse).map((c) => ({ id: c.id, voiceUse: c.voiceUse })) };
const data = { schemaVersion: 1, readerOrigin: 'http://127.0.0.1:8789', comics, characters, voices: voiceInput, voiceCatalog, voiceReceiptAudit, speechApprovals, soundCatalog, castCoverage, references, warnings, sourceHashes };
if (snapshot) writeFileSync(resolve(snapshot), JSON.stringify(data, null, 2) + '\n');
console.log(JSON.stringify({ snapshot: snapshot ? resolve(snapshot) : null, comics: comics.length, characters: characters.length, references: references.length, voiceProfiles: voiceInput.profiles.length, generatedVoiceClips: voiceInput.profiles.reduce((n, p) => n + (p.clips || []).length, 0), warnings }, null, 2));
