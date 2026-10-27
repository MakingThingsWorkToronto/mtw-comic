import { describe, expect, it } from 'vitest';
import { currentSpeechRecord } from '../modules/comics/server/library';
import type { DerivedComic, DerivedReview, Snapshot, SpeechRecord } from '../modules/comics/server/library';
import { pagesView, soundsView, speechRows } from '../modules/comics/server/views';
import { speechResolver } from '../modules/comics/server/resolvers';
import type { Library } from '../modules/comics/server/library';

const row = { id: 'home-brain-b1', storyId: 'home', sceneId: 'brain', panelId: 'brain-panel', panelIndex: 0, balloonIndex: 0, kind: 'caption', characterId: 'second-brain', text: 'Checked knowledge.', textSha256: '', storySource: { path: 'site/src/data/comic-stories/home.ts', sha256: 'story' } } as DerivedReview;
const saved = { id: row.id, title: 'Brain narration', storyId: 'home', characterId: 'second-brain', provider: 'Fish Audio', voiceId: 'old-mk', text: row.text, canonicalPath: 'wiki/soundtrack-library/assets/speech/brain.mp3', durationSeconds: 2, sha256: 'bytes', status: 'candidate' } as SpeechRecord;
function fixture(record: SpeechRecord = saved, held = false): Snapshot {
  return {
    voices: { schemaVersion: 1, profiles: [{ characterId: 'second-brain', delivery: '', pace: '', pitch: '', accent: '', referenceAudio: '', sampleLine: '', pronunciations: '', notes: '', provider: 'Fish Audio', voiceId: 'current-brain', casting: { candidateVoiceIds: [], shortlistVoiceIds: [], selectedVoice: { provider: 'Fish Audio', voiceId: 'current-brain', status: 'approved', selectedBy: 'Matt Stark', selectedAt: 'now', productionHold: held } } }] },
    approvals: { schemaVersion: 1, textReviews: [] }, speech: [record], sourceNow: { [row.storySource.path]: 'story' }, builtAt: 'now',
    derived: { comics: [{ id: 'home', textReview: [row], scenes: [{ id: 'brain', title: 'Brain', beat: 0, seconds: 0 }] } as DerivedComic], characters: [], voiceCatalog: { voices: [] }, soundCatalog: [], warnings: [] },
  } as Snapshot;
}
describe('current speech follows Studio casting', () => {
  it('keeps review UI ids while following an exact retained runtime speech id through regrouping', () => {
    const take={...saved,id:'home-earlier-scene-panel-b0',voiceId:'current-brain'};
    const snap=fixture(take),bound={...row,id:'home-new-scene-panel-b3',sceneId:'brain',speechId:take.id};
    snap.derived.comics[0]!.textReview=[bound];
    expect(currentSpeechRecord(snap,bound)).toBe(take);
    expect(speechRows(snap)[0]).toMatchObject({id:bound.id,audio:{ref:'speech:'+take.id}});
    expect(pagesView(snap,snap.derived.comics[0]!,[])[0]?.voiced).toBe(1);
    expect(soundsView(snap).speech[0]?.status).toBe('candidate');
    expect(take.id).toBe('home-earlier-scene-panel-b0');
    expect(currentSpeechRecord(snap,{...bound,characterId:'matt'})).toBeUndefined();
    expect(currentSpeechRecord(snap,{...bound,text:'Changed exact words.'})).toBeUndefined();
    expect(currentSpeechRecord(snap,{...bound,speechId:'not-this-take'})).toBeUndefined();
  });
  it('does not substitute a row-id take when an explicit runtime binding selects a different saved id',()=>{
    const take={...saved,voiceId:'current-brain'},snap=fixture(take);
    expect(currentSpeechRecord(snap,{...row,speechId:'another-explicit-take'})).toBeUndefined();
  });
  it('does not expose a retained rejected voice as current speech or voiced page coverage', () => {
    const snap = fixture();
    expect(currentSpeechRecord(snap, row)).toBeUndefined();
    expect(speechRows(snap)[0]?.audio).toBeUndefined();
    expect(pagesView(snap, snap.derived.comics[0]!, [])[0]?.voiced).toBe(0);
    expect(pagesView(snap, snap.derived.comics[0]!, [])[0]?.panels[0]?.balloons[0]?.voiced).toBe(false);
    expect(soundsView(snap).speech[0]).toMatchObject({ status: 'retained-history', title: 'Earlier take — Brain narration', voiceId: 'old-mk' });
    expect(snap.speech[0]).toBe(saved);
    expect(saved.status).toBe('candidate');
  });
  it('retains a matching selected take, including held preview-only casting', () => {
    const take = { ...saved, voiceId: 'current-brain' };
    for (const held of [false, true]) {
      const snap = fixture(take, held);
      expect(currentSpeechRecord(snap, row)).toBe(take);
      expect(speechRows(snap)[0]?.audio?.preview).toBeTruthy();
      expect(pagesView(snap, snap.derived.comics[0]!, [])[0]?.voiced).toBe(1);
      if (held) expect(speechRows(snap)[0]?.state).toBe('unvoiced');
    }
  });
  it.each([
    { provider: 'ElevenLabs' }, { characterId: 'matt' }, { text: 'Changed line.' }, { storyId: 'demo' },
    { textSha256: 'stale' }, { status: 'retained-rejected-normalization' },
  ])('refuses crossed or stale take %j', (change) => {
    const snap = fixture({ ...saved, voiceId: 'current-brain', ...change });
    expect(currentSpeechRecord(snap, row)).toBeUndefined();
    expect(speechRows(snap)[0]?.audio).toBeUndefined();
  });
  it('rechecks changed or cleared Studio choices rather than a cached ID', () => {
    const snap = fixture({ ...saved, voiceId: 'current-brain' });
    expect(currentSpeechRecord(snap, row)).toBeTruthy();
    snap.voices.profiles[0]!.casting!.selectedVoice!.voiceId = 'replacement';
    expect(currentSpeechRecord(snap, row)).toBeUndefined();
    delete snap.voices.profiles[0]!.casting!.selectedVoice;
    expect(currentSpeechRecord(snap, row)).toBeUndefined();
  });
  it('labels historical resolver assets with their exact provider and voice while retaining the bytes', async () => {
    const snap = fixture();
    const resolver = speechResolver({ snapshot: async () => snap } as Library);
    const result = await resolver.resolve(`speech:${saved.id}`);
    expect(result).toMatchObject({ status: 'retained-history', meta: { provider: 'Fish Audio', voiceId: 'old-mk' } });
    expect(result?.preview).toBeTruthy();
  });
});
