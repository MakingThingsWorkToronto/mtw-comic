// Pure timing for playing one box the way the reader does: balloons letter in at max(panel.at, balloon.at), a saved take
// starts 0.3 s after its balloon (comic-story.js voiceEvents), effects fire at the box reveal plus `delay` beats.

export interface ClockInput {
  bpm: number;
  /** Beats until the next box. */
  length: number;
  sfx: { kind: string; delay: number; gain: number }[];
  balloons: { id: string; delay: number }[];
}
export interface Take { audio: string | null; durationSeconds: number | null }
export interface BoxClock {
  duration: number;
  letters: { id: string; at: number }[];
  sfx: { kind: string; at: number; gain: number }[];
  speech: { id: string; at: number; src: string }[];
}

/** The reader's offset between a balloon's first glyph and its saved take. */
export const SPEECH_LEAD = 0.3;

export function boxClock(box: ClockInput, takes: Record<string, Take | undefined>): BoxClock {
  const beat = 60 / (box.bpm > 0 ? box.bpm : 90);
  const letters = box.balloons.map((b) => ({ id: b.id, at: b.delay * beat }));
  const speech = letters.flatMap((l) => {
    const t = takes[l.id];
    return t?.audio ? [{ id: l.id, at: l.at + SPEECH_LEAD, src: t.audio, end: l.at + SPEECH_LEAD + (t.durationSeconds ?? 0) }] : [];
  });
  const duration = Math.max(box.length * beat, ...speech.map((s) => s.end));
  return {
    duration,
    letters,
    sfx: box.sfx.map((f) => ({ kind: f.kind, at: f.delay * beat, gain: f.gain })),
    speech: speech.map(({ id, at, src }) => ({ id, at, src })),
  };
}

/** Balloons lettered by time `t` seconds into the box. */
export const revealedAt = (clock: BoxClock, t: number): Set<string> => new Set(clock.letters.filter((l) => l.at <= t + 1e-9).map((l) => l.id));
