// One comic box as the reader shows it: page art with its balloons lettered on top (click a balloon to edit its words),
// the box's effects, a Play that runs the box on the reader's clock, and a feedback panel that becomes the agent's terminal.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { api } from '../../../web/api';
import { Button, Dialog } from '../../../web/ui';
import { AgentChat } from '../../../web/ui/AgentChat';
import { boxClock, revealedAt } from './boxPlay';
import { previewOutput, speechPreview, type SpeechPreview } from '../../../web/playback/previewAudio';
import type { BoxClock, Take } from './boxPlay';
import { loadPresets } from './FixArt';
import type { FixPreset } from './fix';
import { testReaderBox } from './ReaderStage';
import { quickFailureNote } from './boxChecks';
import type { QuickReport } from './boxChecks';

export const FEEDBACK_OPERATION = 'comics-box-feedback';

export interface BoxBalloon { index: number; id: string; kind: string; state: string; who: string; text: string; x: number; y: number; w: number; tail: [number, number] | null; delay: number; intro: boolean; corner: 'tl' | 'tr' | 'bl' | 'br' | null }
export interface BoxData {
  box: {
    story: string; scene: string; img: string; panelIndex: number; hash: string; bpm: number; at: number; length: number; alt: string; room: string | null;
    r: [number, number, number, number] | null; ar: [number, number, number, number] | null; focus: [number, number]; insetPct: number;
    motion: { preset: string; layered: boolean }; sfx: { kind: string; delay: number; gain: number }[]; balloons: BoxBalloon[];
  };
  subject: string;
  art: { src: string | null; rect: [number, number, number, number] | null; art: string | null };
  speech: Record<string, Take & { state: string; voice: string | null }>;
  history: { id: string; at: string; action: string; subject: string; value?: unknown }[];
  run: { id: string; status: string; closedReason?: string; idleMinutes?: number } | null;
}

const boxUrl = (story: string, scene: string, img: string) => `/api/comics/box/${[story, scene, img].map(encodeURIComponent).join('/')}`;

/** The box's data; `reload` refetches (after a save, or when the story or art changed on disk). */
export function useBox(story: string, scene: string, img: string): { data: BoxData | null; error: string; reload: () => Promise<void> } {
  const [data, setData] = useState<BoxData | null>(null);
  const [error, setError] = useState('');
  const key = boxUrl(story, scene, img);
  const live = useRef(key);
  live.current = key;
  const reload = useCallback(async () => {
    if (!story || !img) return;
    try {
      const next = await api.get<BoxData>(key);
      if (live.current === key) {
        setData(next);
        setError('');
      }
    } catch (e) {
      if (live.current === key) setError((e as Error).message);
    }
  }, [key, story, img]);
  // The previous box stays until the next arrives, so the page keeps its height (no scroll jump between boxes).
  useEffect(() => {
    void reload();
  }, [reload]);
  return { data, error, reload };
}

// ------------------------------------------------------------------------------------------------ playback

type FxMap = Record<string, (t: number, g: GainNode) => void>;
let audio: { ctx: AudioContext; fx: FxMap } | null = null;
let synth: Promise<string> | null = null;

/** The reader's own effect synthesis (served from comic-story.js), bound to one shared AudioContext. */
async function sound(): Promise<{ ctx: AudioContext; fx: FxMap }> {
  if (audio) return audio;
  synth ??= api.get<{ source: string }>('/api/comics/sfx-synth').then((r) => r.source, (e) => ((synth = null), Promise.reject(e)));
  const source = await synth;
  const ctx = new AudioContext();
  // eslint-disable-next-line no-new-func
  const fx = new Function('ctx', source)(ctx) as FxMap;
  audio = { ctx, fx };
  return audio;
}

/** Play one invented effect now (or `at` seconds from now) at gain 0-1. */
export async function playEffect(kind: string, gain = 0.7, at = 0): Promise<void> {
  const { ctx, fx } = await sound();
  if (ctx.state === 'suspended') await ctx.resume();
  const make = fx[kind];
  if (!make) return;
  const g = ctx.createGain();
  g.gain.value = Math.max(0, Math.min(1, gain));
  g.connect(previewOutput(ctx));
  make(ctx.currentTime + 0.01 + at, g);
}

export interface BoxPlayer {
  playing: boolean;
  /** Balloons lettered so far; null when not playing (all shown). */
  revealed: Set<string> | null;
  toggle: () => void;
  play: () => void;
  stop: () => void;
  error: string;
}

/** Runs a box on the reader's clock: balloons letter in, effects fire, saved takes play (a balloon with no take is silent). */
export function useBoxPlayer(clock: BoxClock | null, resetKey: string): BoxPlayer {
  const [playing, setPlaying] = useState(false);
  const [revealed, setRevealed] = useState<Set<string> | null>(null);
  const [error, setError] = useState('');
  const run = useRef<{ tick: number; timers: number[]; clips: HTMLAudioElement[]; nodes: GainNode[]; previews: SpeechPreview[] } | null>(null);

  const stop = useCallback(() => {
    const r = run.current;
    run.current = null;
    if (r) {
      window.clearInterval(r.tick);
      r.timers.forEach((t) => window.clearTimeout(t));
      r.previews.forEach((p) => p.dispose());
      r.clips.forEach((c) => c.pause());
      r.nodes.forEach((n) => n.disconnect());
    }
    setPlaying(false);
    setRevealed(null);
  }, []);

  const play = useCallback(() => {
    if (!clock) return;
    stop();
    setError('');
    const r = { tick: 0, timers: [] as number[], clips: [] as HTMLAudioElement[], nodes: [] as GainNode[], previews: [] as SpeechPreview[] };
    run.current = r;
    setPlaying(true);
    setRevealed(new Set());
    const start = performance.now();
    const tick = () => {
      if (run.current !== r) return window.clearInterval(r.tick);
      const t = (performance.now() - start) / 1000;
      setRevealed((old) => {
        const now = revealedAt(clock, t);
        return old && old.size === now.size ? old : now;
      });
      if (t >= clock.duration) {
        window.clearInterval(r.tick);
        run.current = null;
        setPlaying(false);
        setRevealed(null);
      }
    };
    // A timer, not animation frames: the clock must keep running when the window is behind another one.
    r.tick = window.setInterval(tick, 40);
    tick();
    sound().then(
      async ({ ctx, fx }) => {
        if (run.current !== r) return;
        if (ctx.state === 'suspended') await ctx.resume();
        const base = ctx.currentTime + 0.01;
        for (const f of clock.sfx) {
          const make = fx[f.kind];
          if (!make) continue;
          const g = ctx.createGain();
          g.gain.value = Math.max(0, Math.min(1, f.gain));
          g.connect(previewOutput(ctx));
          r.nodes.push(g);
          make(base + f.at, g);
        }
      },
      (e: Error) => setError(`Effects unavailable: ${e.message}`),
    );
    for (const s of clock.speech) {
      const clip = new Audio(s.src);
      clip.preload = 'auto';
      r.clips.push(clip);
      r.timers.push(window.setTimeout(() => {
        if (run.current !== r) return;
        void sound().then(({ ctx }) => {
          if (run.current !== r || (performance.now() - start) / 1000 > s.at + 0.25) return;
          const p = speechPreview(clip, ctx); r.previews.push(p);
          return p.play();
        }).catch(() => { if (run.current === r) setError('Speech preview unavailable.'); });
      }, s.at * 1000));
    }
  }, [clock, stop]);

  const toggle = useCallback(() => (run.current ? stop() : play()), [play, stop]);
  useEffect(() => stop, [resetKey, stop]);
  return { playing, revealed, toggle, play, stop, error };
}

export const clockOf = (data: BoxData | null): BoxClock | null => (data ? boxClock(data.box, data.speech) : null);

// ------------------------------------------------------------------------------------------------ balloons over the art

const capFill = (b: BoxBalloon): string => (b.kind === 'place' ? 'place' : b.kind === 'caption' ? 'caption' : b.kind);

/**
 * The box's balloons placed on the crop as the reader places them (x, y, w are fractions of the box), lettered in the
 * comic's face. Click one to edit its words: Ctrl+Enter or leaving the field saves, Esc cancels, Enter breaks the line.
 */
export function BalloonLayer({ data, revealed, current, onSaved }: { data: BoxData; revealed: Set<string> | null; current?: string; onSaved: () => void }) {
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { box } = data;
  useEffect(() => setEditing(null), [box.story, box.scene, box.img]);
  const layer = useRef<HTMLSpanElement>(null);
  // Shrink each lettered box to its widest wrapped line, as the reader sizes balloons and captions to their lettering
  // (CSS alone keeps a wrapped box at its maximum width). Re-run on every render and when the stage resizes.
  useLayoutEffect(() => {
    const host = layer.current?.parentElement;
    if (!host) return;
    const fit = () => {
      for (const el of host.querySelectorAll<HTMLElement>('button.bx-b')) {
        el.style.width = '';
        const text = el.firstChild;
        if (!text) continue;
        const range = document.createRange();
        range.selectNodeContents(text);
        const rects = [...range.getClientRects()];
        if (!rects.length) continue;
        const inner = Math.max(...rects.map((r) => r.right)) - Math.min(...rects.map((r) => r.left));
        const cs = getComputedStyle(el);
        const chrome = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
        el.style.width = `${Math.ceil(inner + chrome + 1)}px`;
      }
    };
    fit();
    const ro = new ResizeObserver(() => fit());
    ro.observe(host);
    return () => ro.disconnect();
  });

  const save = async (b: BoxBalloon) => {
    const text = draft.replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').trim();
    if (!text || text === b.text) {
      setEditing(null);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.post(`/api/comics/editor/save/${encodeURIComponent(box.story)}`, { baseHash: box.hash, ops: [{ op: 'edit', scene: box.scene, img: box.img, index: b.index, patch: { text } }] });
      setEditing(null);
      onSaved();
    } catch (e) {
      setError(`Balloon ${b.index + 1} not saved: ${(e as Error).message}`);
      onSaved();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <span ref={layer} hidden />
      <svg class="bx-tails" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
        {box.balloons.map((b) => {
          if (!b.tail || (revealed && !revealed.has(b.id)) || b.kind === 'caption' || b.kind === 'place') return null;
          const cx = (b.x + b.w / 2) * 1000, cy = (b.y + 0.04) * 1000, tx = b.tail[0] * 1000, ty = b.tail[1] * 1000;
          const spread = Math.max(14, b.w * 60);
          return <polygon key={b.id} points={`${cx - spread},${cy} ${cx + spread},${cy} ${tx},${ty}`} />;
        })}
      </svg>
      {(() => {
        const one = (b: BoxBalloon) => {
          const shown = !revealed || revealed.has(b.id);
          const cap = b.kind === 'caption' || b.kind === 'place';
          // Corner captions flow in their corner stack; everything else sits with its top-left at (x, y) of the box.
          const style = b.corner ? { maxWidth: `${(b.w || 0.5) * 100}cqw` } : cap ? { left: `${b.x * 100}%`, top: `${b.y * 100}%`, maxWidth: `${(b.w || 0.5) * 100}%` } : { left: `${b.x * 100}%`, top: `${b.y * 100}%` };
          const cls = `bx-b bx-b--${capFill(b)}${b.corner ? ' bx-b--stacked' : ''}${b.state === 'scream' ? ' bx-b--scream' : ''}${b.intro ? ' bx-b--intro' : ''}${b.id === current ? ' bx-b--current' : ''}${shown ? '' : ' bx-b--hidden'}`;
          if (editing === b.index)
            return (
              <textarea
                key={b.id}
                class={`${cls} bx-edit`}
                style={style}
                value={draft}
                rows={Math.max(2, draft.split('\n').length)}
                disabled={busy}
                aria-label={`Words of balloon ${b.index + 1}`}
                ref={(el) => {
                  if (el && document.activeElement !== el && !busy) el.focus();
                }}
                onInput={(e) => setDraft((e.target as HTMLTextAreaElement).value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.stopPropagation();
                    setEditing(null);
                  } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    void save(b);
                  }
                }}
                onBlur={() => void save(b)}
              />
            );
          return (
            <button
              key={b.id}
              type="button"
              class={cls}
              style={style}
              title="Opens this balloon's words for editing. Nothing is saved until you press Save, and saving clears speech approvals for this story."
              aria-label={`Balloon ${b.index + 1}, ${b.who}, ${b.kind}: ${b.text}. Edit the words`}
              onClick={() => {
                setDraft(b.text);
                setError('');
                setEditing(b.index);
              }}
            >
              {b.text}
            </button>
          );
        };
        return (
          <>
            {box.balloons.filter((b) => !b.corner).map(one)}
            {(['tl', 'tr', 'bl', 'br'] as const).map((k) => {
              const list = box.balloons.filter((b) => b.corner === k);
              return list.length ? (
                <div key={k} class={`bx-corner bx-corner--${k}`}>
                  {list.map(one)}
                </div>
              ) : null;
            })}
          </>
        );
      })()}
      {error && (
        <p class="bx-error error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

/** Pop-up editor for one balloon's words (opened by clicking the balloon in the reader). Saves with the editor's
 * compare-and-swap write to the story file; a conflict reloads and says so. */
export function BalloonEditor({ data, index, names, onClose, onSaved }: { data: BoxData; index: number; names: Record<string, string>; onClose: () => void; onSaved: () => void }) {
  const b = data.box.balloons[index];
  const [text, setText] = useState(b?.text ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!b) return null;
  const words = text.split(/\s+/).filter(Boolean).length;
  const save = async () => {
    const next = text.replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').trim();
    if (!next || next === b.text) return onClose();
    setBusy(true);
    setError('');
    try {
      await api.post(`/api/comics/editor/save/${encodeURIComponent(data.box.story)}`, { baseHash: data.box.hash, ops: [{ op: 'edit', scene: data.box.scene, img: data.box.img, index: b.index, patch: { text: next } }] });
      onSaved();
      onClose();
    } catch (e) {
      setError((e as Error).message);
      onSaved();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      title={`Balloon ${b.index + 1}: ${names[b.who] ?? b.who} · ${b.kind}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" help="Closes this window without changing the words." onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={busy || !text.trim()} help="Writes the new words into the comic's story file. Changing the words clears any speech approvals for this story, so they need reviewing again." onClick={() => void save()}>
            Save
          </Button>
        </>
      }
    >
      <div class="stack">
        <textarea
          class={`input bx-popup-text bx-popup-text--${capFill(b)}`}
          rows={Math.max(3, text.split('\n').length + 1)}
          value={text}
          aria-label="Balloon words"
          onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              void save();
            }
          }}
        />
        <p class={`small ${words > 14 ? 'error' : 'muted'}`}>
          {words} words{words > 14 ? '; keep to about 12' : ''} · Enter breaks the line as lettered · Ctrl+Enter saves
        </p>
        {error && (
          <p class="error" role="alert">
            Not saved: {error}
          </p>
        )}
      </div>
    </Dialog>
  );
}

// ------------------------------------------------------------------------------------------------ effects strip

export function SoundStrip({ data, onAsk }: { data: BoxData; onAsk: (text: string) => void }) {
  const { box } = data;
  return (
    <div class="bx-sound" aria-label="Sound and motion of this box">
      <span class="small muted">Effects</span>
      {box.sfx.length === 0 && <span class="small muted">none</span>}
      {box.sfx.map((f, i) => (
        <button key={i} type="button" class="chip" title="Plays this sound effect here in the browser so you can hear it. Nothing is changed." onClick={() => void playEffect(f.kind, f.gain)}>
          ▶ {f.kind} · +{f.delay} beat{f.delay === 1 ? '' : 's'} · {Math.round(f.gain * 100)}%
        </button>
      ))}
      <span class="small muted">· room {box.room ?? 'inherited'} · motion {box.motion.preset}{box.motion.layered ? ' + layers' : ''}</span>
      <Button small variant="ghost" help="Starts a message to the agent beside this box, beginning with Sound:, so you can say what to change about its sound. Nothing is sent until you press send." onClick={() => onAsk('Sound: ')}>
        Ask for a sound change
      </Button>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ history

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

/** The box's recorded changes, newest first: balloon edits (old and new words) and feedback requests. */
export function BoxHistory({ data }: { data: BoxData }) {
  if (!data.history.length) return null;
  return (
    <details class="bx-history">
      <summary class="small">Changes to this box ({data.history.length})</summary>
      <ol>
        {data.history.map((d) => {
          const v = (d.value ?? {}) as { old?: string | null; new?: string | null; fixes?: string[]; note?: string };
          const n = /-b(\d+)$/.exec(d.subject)?.[1];
          return (
            <li key={d.id} class="small">
              <span class="muted">{when(d.at)}</span>{' '}
              {d.action === 'box-feedback' ? (
                <>
                  feedback{v.fixes?.length ? `: ${v.fixes.join(', ')}` : ''}
                  {v.note ? ` · “${v.note}”` : ''}
                </>
              ) : (
                <>
                  balloon {n} {d.action.replace('-balloon', '')}: <del>{v.old ?? ''}</del> → <ins>{v.new ?? ''}</ins>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </details>
  );
}

// ------------------------------------------------------------------------------------------------ feedback panel

const SCOPE_LABEL: Record<string, string> = { art: 'Art', speech: 'Speech', sound: 'Sound', motion: 'Motion', appearance: 'Appearance', voice: 'Voice' };

function QuickBoxChecks({ data, onFlags, onNote }: { data: BoxData; onFlags: (ids: string[]) => void; onNote: (note: string) => void }) {
  const [busy, setBusy] = useState(false), [report, setReport] = useState<QuickReport | null>(null), [error, setError] = useState('');
  const current = useRef(''); current.current = `${data.box.story}/${data.box.scene}/${data.box.img}/${data.box.hash}`;
  useEffect(() => { setReport(null); setError(''); setBusy(false); }, [data.box.story, data.box.scene, data.box.img, data.box.hash]);
  const run = async () => {
    const revision = current.current;
    setBusy(true); setError(''); setReport(null);
    try { const next = await testReaderBox(data.box.story, data.box.scene, data.box.img); if (current.current === revision) setReport(next); } catch (e) { if (current.current === revision) setError((e as Error).message); } finally { if (current.current === revision) setBusy(false); }
  };
  const flag = async () => {
    if (!report || report.key !== `${data.box.story}/${data.box.scene}/${data.box.img}`) return;
    const revision = current.current;
    const known = new Set((await loadPresets()).map(p => p.id));
    if (current.current !== revision) return;
    onFlags(report.checks.filter(c => c.state === 'fail' && known.has(c.id)).map(c => c.id));
    onNote(quickFailureNote(report));
  };
  return <section class="stack" aria-label="Tests for this box">
    <Button small disabled={busy} help="Samples the current held reader at opening, motion peak, full lettering and end, then restores its clock; no files or messages are sent." onClick={() => void run()}>{busy ? 'Testing box…' : 'Test this box'}</Button>
    <p class="small muted">Current reader layout only. Measured source/geometry checks and pending watching/listening are separate.</p>
    {error && <p class="small error" role="alert">{error}</p>}
    {report && <>
      <p class="small" role="status">{report.mode}: {report.checks.filter(c => c.state === 'fail').length} failures; {report.checks.filter(c => c.state === 'pending').length} checks pending.</p>
      <ul class="small">{report.checks.map(c => <li key={c.id}><strong>{c.state.toUpperCase()}</strong> {c.label} ({c.basis}): {c.detail}</li>)}</ul>
      <Button small disabled={!report.checks.some(c => c.state === 'fail')} help="Selects measured failures in Common Issues and adds their evidence to the existing draft; you still choose when to Send." onClick={() => void flag().catch(e => setError((e as Error).message))}>Flag failures and add notes</Button>
    </>}
  </section>;
}

/** The box's feedback conversation: the shared agent chat bound to the comics-box-feedback procedure. */
export function FeedbackPanel({ data, prefill, onPrefilled, waiting = false }: { data: BoxData; prefill: string; onPrefilled: () => void; waiting?: boolean }) {
  const { story, scene, img } = data.box;
  const [testNote, setTestNote] = useState('');
  return (
    <AgentChat
      label="Feedback for this box"
      title="What should change?"
      operation={FEEDBACK_OPERATION}
      subject={data.subject}
      placeholder="Explain the fix: the words, the art, the sound or the motion of this box. Or press the mic and say it."
      hint="The agent works on this box only; Codex generates any new art."
      loadPresets={loadPresets}
      scopeLabels={SCOPE_LABEL}
      presetTools={select => waiting ? <p class="small muted">Opening current box before tests…</p> : <QuickBoxChecks data={data} onFlags={select} onNote={setTestNote} />}
      knownRun={data.run}
      waiting={waiting}
      prefill={[prefill, testNote].filter(Boolean).join('\n')}
      onPrefilled={() => { if (prefill) onPrefilled(); setTestNote(''); }}
      launch={(req) => api.post<{ id: string }>(`${boxUrl(story, scene, img)}/feedback`, req)}
    />
  );
}
