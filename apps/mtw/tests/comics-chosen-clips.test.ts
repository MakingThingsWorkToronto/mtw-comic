import { describe, it, expect } from 'vitest';
import { chosenClips } from '../modules/comics/client/casting-view';
const clips = [
  { id: 'rejected', title: 'Old narrator', status: 'candidate', text: 'Same line', canonicalPath: null, voiceId: 'old', provider: 'Fish Audio' },
  { id: 'chosen', title: 'Chosen narrator', status: 'candidate', text: 'Same line', canonicalPath: null, voiceId: 'chosen', provider: 'Fish Audio' },
  { id: 'collision', title: 'Other provider', status: 'candidate', text: 'Same line', canonicalPath: null, voiceId: 'chosen', provider: 'ElevenLabs' },
];
describe('chosen audition display', () => {
  it('keeps only the exact chosen provider and voice, including held choices', () => {
    expect(chosenClips(clips, { voiceId: 'chosen', provider: 'Fish Audio' }).map(c => c.id)).toEqual(['chosen']);
    expect(clips).toHaveLength(3);
  });
  it('keeps auditions available while casting remains open', () => expect(chosenClips(clips, null)).toBe(clips));
});
