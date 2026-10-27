// Shared by every Comic B story (skill: mtw-comic-story, references/storytelling.md).
import type { ComicStory } from './types';

// Timing from reading time (2026-10-04): the story is authored in order and its beats are computed, so a rewrite never
// leaves a box revealing before the last one is read (comic-story-check.mjs reads each balloon in 1 s plus 0.3 s a word,
// in order). Boxes in a run with no words step one beat apart; other boxes wait for the reader; each scene ends on a bar.
export function retime(story: ComicStory): ComicStory {
  // Validate all authored holds before mutating any existing scene/panel/balloon clocks.
  for (const sc of story.scenes) {
    const hold = sc.artHoldBeats;
    if (hold !== undefined && !(typeof hold === 'number' && Number.isFinite(hold) && hold >= 0 && hold <= 32)) {
      throw new RangeError('artHoldBeats must be a finite number within 0-32');
    }
  }
  const B = 60 / story.bpm, read = (t: string) => (1 + 0.3 * t.split(/\s+/).filter(Boolean).length) / B;
  const up = (v: number) => Math.ceil(v * 2) / 2, exit = Math.max(1.5, 1.2 / B);
  // Optional saved speech changes spacing only when explicitly authored; legacy stories stay byte-identical.
  const voiced = story.scenes.some(sc => sc.panels.some(p => p.balloons.some(b => !!b.speech)));
  let start = 0;
  for (const sc of story.scenes) {
    let cursor = 1, end = 0;
    for (const p of sc.panels) {
      p.at = up(Math.max(cursor, end));
      let t = p.at + (p.balloons.length ? 0.5 : 0);
      for (const b of p.balloons) {
        b.at = up(voiced ? Math.max(t, end) : t);
        const duration = b.speech?.durationSeconds;
        const spoken = typeof duration === 'number' && Number.isFinite(duration) && duration > 0 ? (0.3 + duration + 0.4) / B : 0;
        end = Math.max(b.at, end) + (voiced ? Math.max(read(b.text), spoken) : read(b.text));
        t = voiced ? end : b.at + 1.5;
      }
      cursor = p.at + (p.run && !p.balloons.length ? 1 : 1.5);
    }
    sc.b = start; sc.l = Math.ceil((Math.max(cursor, end) + (sc.artHoldBeats ?? 0) + exit + 1) / 4) * 4; start += sc.l;
  }
  story.next.b = start; story.beats = start + 4;
  return story;
}
