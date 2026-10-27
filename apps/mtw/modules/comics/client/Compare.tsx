// A/B(/C) voice comparison for one character: the same line through each candidate, back to back, then "Select voice".
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Badge, Button } from '../../../web/ui';
import { speechPreview, type SpeechPreview } from '../../../web/playback/previewAudio';
import { OpButton } from './OpButton';
import { nextSlot, pickTakes, slotForKey } from './flow';
import type { CastDetail, VoiceView } from './types';

interface Props {
  detail: CastDetail;
  /** Compared voice refs, in slot order (at most three). */
  refs: string[];
  busy: boolean;
  onRemove: (ref: string) => void;
  onClear: () => void;
  onSelect: (voice: VoiceView) => void;
}

const labelsOf = (v: VoiceView): string => [v.labels.gender, v.labels.age, v.labels.accent, v.labels.persona ?? v.labels.descriptive].filter(Boolean).join(' · ');

export function VoiceCompare({ detail, refs, busy, onRemove, onClear, onSelect }: Props) {
  const voices = useMemo(() => refs.map((r) => detail.voices.find((v) => v.ref === r)).filter((v): v is VoiceView => !!v), [refs, detail.voices]);
  const { line, takes } = useMemo(() => pickTakes(voices, detail.clips, detail.profile?.sampleLine ?? ''), [voices, detail.clips, detail.profile]);
  const audio = useRef<HTMLAudioElement>(null);
  const preview = useRef<SpeechPreview | null>(null);
  const [slot, setSlot] = useState<number | null>(null);
  const [run, setRun] = useState(false);
  const state = useRef({ takes, run });
  state.current = { takes, run };

  const play = (i: number, asRun = false) => {
    const take = state.current.takes[i];
    const a = audio.current;
    if (!take || !a) return;
    setRun(asRun);
    state.current.run = asRun;
    setSlot(i);
    preview.current?.stop();
    a.src = take.src;
    a.currentTime = 0;
    try { void (preview.current ??= speechPreview(a)).play().catch(() => { setSlot(null); setRun(false); }); } catch { setSlot(null); setRun(false); }
  };
  const stop = () => {
    preview.current?.stop();
    audio.current?.pause();
    setSlot(null);
    setRun(false);
  };
  const playAll = () => {
    const first = nextSlot(takes, -1);
    if (first !== null) play(first, true);
  };
  const ended = () => {
    const next = state.current.run && slot !== null ? nextSlot(state.current.takes, slot) : null;
    if (next === null) {
      setSlot(null);
      setRun(false);
    } else play(next, true);
  };

  // Keys 1 to 3 toggle between the compared voices (not while typing, not over a dialog).
  const playRef = useRef(play);
  playRef.current = play;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName ?? '';
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t?.isContentEditable || document.querySelector('[role="dialog"]')) return;
      const i = slotForKey(e.key, refs.length);
      if (i === null) return;
      e.preventDefault();
      playRef.current(i);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [refs.length]);
  useEffect(() => () => { preview.current?.dispose(); audio.current?.pause(); }, []);

  if (voices.length === 0) return null;
  return (
    <section class="compare stack" aria-label="Voice comparison">
      <div class="row">
        <h2>Compare voices</h2>
        <span class="muted small">{line ? `Line: “${line}”` : 'No shared line yet; provider previews differ'}</span>
        <span class="row end grow">
          <Button small aria-label="Play every compared voice in turn" disabled={takes.every((t) => !t)} help={run ? 'Stops the voices that are playing. Nothing is changed.' : 'Plays each compared voice one after another so you can hear the differences. Nothing is chosen or changed.'} onClick={run ? stop : playAll}>
            {run ? 'Stop' : 'Play all in turn'}
          </Button>
          <Button small variant="ghost" help="Empties the side-by-side comparison. No voice is chosen or deleted." onClick={onClear}>
            Clear comparison
          </Button>
        </span>
      </div>
      <audio ref={audio} onEnded={ended} />
      <ol class="compare-slots">
        {voices.map((v, i) => {
          const take = takes[i];
          const on = slot === i;
          return (
            <li key={v.ref} class={`compare-slot${on ? ' compare-slot--on' : ''}`}>
              <div class="row">
                <button type="button" class="slot-key" aria-pressed={on} aria-keyshortcuts={String(i + 1)} aria-label={`Play voice ${i + 1}: ${v.name}`} title={take ? (on ? 'Stops this voice. Nothing is changed.' : 'Plays this voice so you can hear it (or press the same number key). Nothing is chosen or changed.') : 'There is no audio for this voice yet, so it cannot be played.'} disabled={!take} onClick={() => (on ? stop() : play(i))}>
                  {i + 1}
                </button>
                <strong>{v.name}</strong>
                <span class="muted small">{v.provider}</span>
                <Button small variant="ghost" class="slot-remove" aria-label={`Remove ${v.name} from the comparison`} help="Takes this voice out of the side-by-side comparison. The voice is not deleted or chosen." onClick={() => onRemove(v.ref)}>
                  Remove
                </Button>
              </div>
              <p class="muted small">{labelsOf(v) || v.description}</p>
              <p class="small">
                {take ? take.sameLine ? <Badge status="approved">same line</Badge> : <Badge status="pending">preview only</Badge> : <Badge status="rejected">no audio</Badge>}
                {v.ownedBy && <span class="muted"> Used by {v.ownedBy}.</span>}
              </p>
              <div class="row">
                <Button small variant="primary" disabled={busy} aria-label={`Select voice ${v.name}`} help="Opens a window asking you to confirm this voice for the character. Once you confirm, it becomes the character's voice, their speech approvals are reset against it, and the choice is locked." onClick={() => onSelect(v)}>
                  Select voice
                </Button>
                {(!take || !take.sameLine) && line && <OpButton id="comics-audition-voice" params={{ character: `cast:${detail.id}`, voice: v.ref }} label="Audition this line" small variant="ghost" help="Opens a terminal where an agent plans a short audition of this voice reading the shared line, and shows you the plan before it asks the voice service for anything. It never picks the voice for you." />}
              </div>
            </li>
          );
        })}
      </ol>
      <p class="rv-hint small muted">
        <span>
          <kbd>1</kbd>
          <kbd>2</kbd>
          <kbd>3</kbd> Play that voice
        </span>
      </p>
      {detail.taken.length > 0 && (
        <details class="taken">
          <summary>Already cast to other characters ({detail.taken.length})</summary>
          <ul class="plain">
            {detail.taken.map((t) => (
              <li key={t.ref}>
                <strong>{t.name}</strong> <span class="muted small">{[t.labels.gender, t.labels.age, t.labels.accent].filter(Boolean).join(' · ')}</span> plays {t.characterName}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
