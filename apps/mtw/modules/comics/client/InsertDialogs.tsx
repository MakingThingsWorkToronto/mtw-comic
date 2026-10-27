// Insert scene / Insert box (InsertDialogs.tsx): structured forms that launch the shared `comics-insert` procedure in an Operations terminal,
// and "Inserting…" markers found again in the live terminals signal. Logic is in insert.ts.
import type { ComponentChildren } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { api } from '../../../web/api';
import { Link } from '../../../web/shell/Link';
import { buildUrl } from '../../../web/shell/route';
import { terminals } from '../../../web/state';
import { AssetField, Badge, Button, Dialog, LaunchConfirm, useLaunchChoice } from '../../../web/ui';
import {
  BALLOON_KINDS, CAMERA_FACES, INSERT_OPERATION, MAX_BOXES, MOTION_PRESETS, NARRATION_KINDS, ROOM_TONES, SCORE_LEVELS, SFX_KINDS, SURFACE_OBJECTS,
  boxParams, boxPositions, insertRunFor, insertRuns, lineWarnings, sceneParams, scenePositions, splitPosition, validateBox, validateScene,
} from './insert';
import type { BalloonLine, BoxForm, Errors, InsertSubject, SceneForm, Surface } from './insert';
import type { TerminalInfo } from '../../types';
import './insert.css';

// ------------------------------------------------------------------------------------------------ cast

interface CastPick { id: string; name: string }
let castCache: Promise<CastPick[]> | null = null;
const loadCast = (): Promise<CastPick[]> =>
  (castCache ??= api.get<{ characters: CastPick[] }>('/api/comics/cast').then(
    (r) => r.characters.map((c) => ({ id: c.id, name: c.name })),
    (e) => ((castCache = null), Promise.reject(e)),
  ));

function useCast(): { cast: CastPick[]; error: string } {
  const [cast, setCast] = useState<CastPick[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    loadCast().then(setCast, (e: Error) => setError(e.message));
  }, []);
  return { cast, error };
}

// ------------------------------------------------------------------------------------------------ live runs

/** Running insert runs for this issue (reads the live terminals signal, so callers re-render as runs start and end). */
export const useInserts = (issue: string): { run: TerminalInfo; target: InsertSubject }[] => insertRuns(terminals.value, issue);

/** "Inserting…" linked to the run's terminal. */
export function InsertingBadge({ run, label }: { run: TerminalInfo; label: string }) {
  return (
    <Link class="ins-badge" href={buildUrl('operations', ['terminals', run.id])} aria-label={`${label}; open its terminal`} title="Opens the terminal where an agent is adding this to the comic right now, so you can watch it or answer its questions.">
      <Badge status="running">Inserting…</Badge>
      <span class="small muted">{label}</span>
    </Link>
  );
}

// ------------------------------------------------------------------------------------------------ shared fields

function Field({ id, label, error, hint, children }: { id?: string; label: string; error?: string | undefined; hint?: string; children: ComponentChildren }) {
  return (
    <div class="field">
      <label for={id}>{label}</label>
      {children}
      {hint && <span class="hint">{hint}</span>}
      {error && <span class="error">{error}</span>}
    </div>
  );
}

function Chips({ legend, options, value, onChange, error }: { legend: string; options: readonly { id: string; label: string }[]; value: string[]; onChange: (v: string[]) => void; error?: string | undefined }) {
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return (
    <fieldset class="ins-chips">
      <legend class="small muted">{legend}</legend>
      {options.map((o) => (
        <button key={o.id} type="button" class="chip" aria-pressed={value.includes(o.id)} title={value.includes(o.id) ? `Takes "${o.label}" out of this list. Nothing is created until you press Start insert.` : `Adds "${o.label}" to this list. Nothing is created until you press Start insert.`} onClick={() => toggle(o.id)}>
          {o.label}
        </button>
      ))}
      {error && <span class="error small">{error}</span>}
    </fieldset>
  );
}

const sfxOptions = SFX_KINDS.map((k) => ({ id: k, label: k }));
const area = (set: (v: string) => void) => (e: Event) => set((e.target as HTMLTextAreaElement).value);

function Refs({ refs, onChange, error }: { refs: string[]; onChange: (v: string[]) => void; error?: string | undefined }) {
  const list = refs.length ? refs : [''];
  return (
    <div class="stack ins-refs">
      {list.map((r, i) => (
        <AssetField key={i} label={i === 0 ? 'Reference images (optional)' : `Reference ${i + 1}`} assetType="img" value={r} onChange={(v) => onChange(list.map((x, j) => (j === i ? v : x)))} />
      ))}
      <div class="row">
        <Button small variant="ghost" disabled={list.length >= 4} help="Adds another box for a reference image or note the agent should look at (up to four). Nothing is created yet." onClick={() => onChange([...list, ''])}>
          Add reference
        </Button>
        {error && <span class="error small">{error}</span>}
      </div>
    </div>
  );
}

/** Footer and "started" body shared by both dialogs. */
function useLaunch(params: Record<string, string>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [started, setStarted] = useState<TerminalInfo | null>(null);
  const lc = useLaunchChoice(INSERT_OPERATION);
  const launch = async () => {
    setBusy(true);
    setError('');
    try {
      const [runner, permission, choice] = lc.args();
      setStarted(await api.launch(INSERT_OPERATION, params, runner, permission === 'default' ? undefined : permission, choice));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, started, launch, lc };
}

function Started({ run, what }: { run: TerminalInfo; what: string }) {
  const live = insertRunFor(terminals.value, run.subject ?? '') ?? run;
  return (
    <div class="stack" role="status">
      <p>
        Started: {what}. The agent works in an Operations terminal; this page shows "Inserting…" at that position until the run ends.
      </p>
      <p class="small muted">
        Subject <code>{live.subject}</code> · {live.status === 'running' ? 'running' : `ended${live.exitCode !== undefined ? ` (exit ${live.exitCode})` : ''}`}
      </p>
      <p>
        <Link class="btn btn--secondary btn--small" href={buildUrl('operations', ['terminals', live.id])} title="Opens the terminal where the agent is working on this, so you can watch it or answer its questions.">
          Open terminal
        </Link>
      </p>
    </div>
  );
}

function Footer({ onClose, started, busy, ready, launch, error }: { onClose: () => void; started: boolean; busy: boolean; ready: boolean; launch: () => void; error: string }) {
  return (
    <>
      {error && (
        <span class="error small" role="alert">
          {error}
        </span>
      )}
      <Button variant="ghost" help={started ? 'Closes this window. The agent keeps working in its terminal.' : 'Closes this window without starting anything. What you typed is discarded.'} onClick={onClose}>
        {started ? 'Close' : 'Cancel'}
      </Button>
      {!started && (
        <Button variant="primary" disabled={busy} aria-disabled={!ready} help={ready ? 'Opens a terminal where an agent adds this to the comic from your brief. The page shows "Inserting…" at that spot until it finishes.' : 'Fill in the fields marked in red first. Then this opens a terminal where an agent adds it to the comic from your brief.'} onClick={launch}>
          Start insert
        </Button>
      )}
    </>
  );
}

function PromptParams({ params }: { params: Record<string, string> }) {
  return (
    <details>
      <summary class="small">What the run receives</summary>
      <pre class="ins-params">{Object.entries(params).map(([k, v]) => `${k}: ${v || 'not set'}`).join('\n')}</pre>
    </details>
  );
}

// ------------------------------------------------------------------------------------------------ insert scene

export function InsertSceneButton({ issue, scenes, chosen }: { issue: string; scenes: { id: string; title: string }[]; chosen: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button small help="Opens a form to describe a new scene. Nothing is added until you press Start insert in it." onClick={() => setOpen(true)}>
        Insert scene
      </Button>
      {open && <SceneDialog issue={issue} scenes={scenes} chosen={chosen} onClose={() => setOpen(false)} />}
    </>
  );
}

function SceneDialog({ issue, scenes, chosen, onClose }: { issue: string; scenes: { id: string; title: string }[]; chosen: string; onClose: () => void }) {
  const positions = scenePositions(scenes);
  const start = splitPosition(scenes.some((s) => s.id === chosen) ? `after:${chosen}` : (positions[positions.length - 1]?.value ?? 'after:'));
  const [f, setF] = useState<SceneForm>({ issue, where: start.where, anchor: start.anchor, id: '', title: '', purpose: '', room: '', characters: [], boxes: 3, score: '', sfx: [], soundIdeas: '', art: '', refs: [] });
  const [touched, setTouched] = useState(false);
  const set = <K extends keyof SceneForm>(k: K) => (v: SceneForm[K]) => setF((o) => ({ ...o, [k]: v }));
  const { cast, error: castError } = useCast();
  const ids = scenes.map((s) => s.id);
  const errors: Errors = validateScene(f, ids);
  const ready = Object.keys(errors).length === 0;
  const params = useMemo(() => sceneParams(f), [f]);
  const { busy, error, started, launch, lc } = useLaunch(params);
  const show = (k: string) => (touched || (k === 'id' && f.id) ? errors[k] : undefined);
  return (
    <Dialog
      title="Insert scene"
      wide
      onClose={onClose}
      footer={<Footer onClose={onClose} started={!!started} busy={busy} ready={ready} error={error} launch={() => (setTouched(true), ready && void launch())} />}
    >
      {started ? (
        <Started run={started} what={`scene "${f.id}" ${f.where} ${f.anchor || 'the start'}`} />
      ) : (
        <form class="ins-form" onSubmit={(e) => e.preventDefault()}>
          <div class="ins-grid">
            <Field id="ins-pos" label="Position" error={show('position')}>
              <select id="ins-pos" class="select" value={`${f.where}:${f.anchor}`} onChange={(e) => setF((o) => ({ ...o, ...splitPosition((e.target as HTMLSelectElement).value) }))}>
                {positions.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="ins-id" label="Scene id" error={show('id')} hint="Lower-case words joined by hyphens; unique in this issue.">
              <input id="ins-id" class="input" value={f.id} placeholder="late-quote" onInput={(e) => set('id')((e.target as HTMLInputElement).value.toLowerCase())} />
            </Field>
            <Field id="ins-title" label="Title (optional)" error={show('title')}>
              <input id="ins-title" class="input" value={f.title} onInput={(e) => set('title')((e.target as HTMLInputElement).value)} />
            </Field>
            <Field id="ins-boxes" label="Number of boxes" error={show('boxes')}>
              <select id="ins-boxes" class="select" value={String(f.boxes)} onChange={(e) => set('boxes')(Number((e.target as HTMLSelectElement).value))}>
                {Array.from({ length: MAX_BOXES }, (_, i) => (
                  <option key={i} value={String(i + 1)}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field id="ins-purpose" label="Purpose in the story: what changes" error={show('purpose')}>
            <textarea id="ins-purpose" class="input ins-area" rows={2} value={f.purpose} placeholder="Who wants what, what goes wrong or turns, and where the reader is left." onInput={area(set('purpose'))} />
          </Field>
          <Chips legend="Characters" options={cast.map((c) => ({ id: c.id, label: c.name }))} value={f.characters} onChange={set('characters')} error={castError} />
          <div class="ins-grid">
            <Field id="ins-room" label="Place / room tone">
              <select id="ins-room" class="select" value={f.room} onChange={(e) => set('room')((e.target as HTMLSelectElement).value)}>
                <option value="">Author chooses</option>
                {ROOM_TONES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="ins-score" label="Mood / score level" hint="0 is silence; keep one scene in three without music.">
              <select id="ins-score" class="select" value={f.score} onChange={(e) => set('score')((e.target as HTMLSelectElement).value)}>
                <option value="">Author chooses</option>
                {SCORE_LEVELS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Chips legend="Sound effects to use" options={sfxOptions} value={f.sfx} onChange={set('sfx')} error={errors.sfx} />
          <Field id="ins-sound" label="Sound ideas" error={show('soundIdeas')}>
            <input id="ins-sound" class="input" value={f.soundIdeas} placeholder="Optional, one line" onInput={(e) => set('soundIdeas')((e.target as HTMLInputElement).value)} />
          </Field>
          <Field id="ins-art" label="Art direction notes" error={show('art')}>
            <textarea id="ins-art" class="input ins-area" rows={2} value={f.art} placeholder="Place and time, camera, light, what the reader must see." onInput={area(set('art'))} />
          </Field>
          <Refs refs={f.refs} onChange={set('refs')} error={show('refs')} />
          <LaunchConfirm state={lc} idPrefix="ins" />
          <PromptParams params={params} />
        </form>
      )}
    </Dialog>
  );
}

// ------------------------------------------------------------------------------------------------ insert box

export function InsertBoxButton({ issue, scene, sceneName, boxCount }: { issue: string; scene: string; sceneName: string; boxCount: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button small help="Opens a form to describe a new picture box for this scene. Nothing is added until you press Start insert in it." onClick={() => setOpen(true)}>
        Insert box
      </Button>
      {open && <BoxDialog issue={issue} scene={scene} sceneName={sceneName} boxCount={boxCount} onClose={() => setOpen(false)} />}
    </>
  );
}

const blankLine = (): BalloonLine => ({ speaker: '', kind: 'speech', text: '' });
const blankSurface = (): Surface => ({ object: 'laptop', camera: 'front', reader: '', shows: '' });

function BoxDialog({ issue, scene, sceneName, boxCount, onClose }: { issue: string; scene: string; sceneName: string; boxCount: number; onClose: () => void }) {
  const positions = boxPositions(boxCount);
  const start = splitPosition(positions[positions.length - 1]?.value ?? 'after:0');
  const [f, setF] = useState<BoxForm>({ issue, scene, where: start.where, box: Number(start.anchor), happens: '', characters: [], lines: [], surfaces: [], sfx: [], motion: '', motionNote: '', art: '', refs: [] });
  const [touched, setTouched] = useState(false);
  const set = <K extends keyof BoxForm>(k: K) => (v: BoxForm[K]) => setF((o) => ({ ...o, [k]: v }));
  const { cast, error: castError } = useCast();
  const errors: Errors = validateBox(f, boxCount);
  const warnings = lineWarnings(f.lines);
  const ready = Object.keys(errors).length === 0;
  const params = useMemo(() => boxParams(f), [f]);
  const { busy, error, started, launch, lc } = useLaunch(params);
  const show = (k: string) => (touched ? errors[k] : undefined);
  const speakers = f.characters.length ? cast.filter((c) => f.characters.includes(c.id)) : cast;
  const setLine = (i: number, patch: Partial<BalloonLine>) => set('lines')(f.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const setSurface = (i: number, patch: Partial<Surface>) => set('surfaces')(f.surfaces.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  return (
    <Dialog
      title={`Insert box: ${sceneName}`}
      wide
      onClose={onClose}
      footer={<Footer onClose={onClose} started={!!started} busy={busy} ready={ready} error={error} launch={() => (setTouched(true), ready && void launch())} />}
    >
      {started ? (
        <Started run={started} what={`a box ${f.where} box ${f.box} in ${sceneName}`} />
      ) : (
        <form class="ins-form" onSubmit={(e) => e.preventDefault()}>
          <div class="ins-grid">
            <Field id="insb-pos" label="Position in scene" error={show('position')}>
              <select id="insb-pos" class="select" value={`${f.where}:${f.box}`} onChange={(e) => { const p = splitPosition((e.target as HTMLSelectElement).value); setF((o) => ({ ...o, where: p.where, box: Number(p.anchor) })); }}>
                {positions.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="insb-motion" label="Motion" error={show('motion')}>
              <select id="insb-motion" class="select" value={f.motion} onChange={(e) => set('motion')((e.target as HTMLSelectElement).value)}>
                <option value="">Author chooses</option>
                {MOTION_PRESETS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field id="insb-happens" label="What happens" error={show('happens')}>
            <textarea id="insb-happens" class="input ins-area" rows={2} value={f.happens} placeholder="The one moment this box shows." onInput={area(set('happens'))} />
          </Field>
          <Chips legend="Characters in the box" options={cast.map((c) => ({ id: c.id, label: c.name }))} value={f.characters} onChange={set('characters')} error={castError} />

          <fieldset class="ins-rows">
            <legend class="small muted">Balloon lines, in reading order (who speaks comes from these)</legend>
            {f.lines.map((l, i) => (
              <div key={i} class="ins-row">
                <select class="select" aria-label={`Line ${i + 1} speaker`} value={l.speaker} onChange={(e) => setLine(i, { speaker: (e.target as HTMLSelectElement).value })}>
                  <option value="">{NARRATION_KINDS.includes(l.kind) ? 'Narrator' : 'Speaker'}</option>
                  {speakers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select class="select" aria-label={`Line ${i + 1} kind`} value={l.kind} onChange={(e) => setLine(i, { kind: (e.target as HTMLSelectElement).value })}>
                  {BALLOON_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
                <input class="input ins-grow" aria-label={`Line ${i + 1} text`} value={l.text} maxLength={120} placeholder="Exact words" onInput={(e) => setLine(i, { text: (e.target as HTMLInputElement).value })} />
                <Button small variant="ghost" aria-label={`Remove line ${i + 1}`} help="Takes this line of dialogue out of the brief. Nothing is created or deleted in the comic." onClick={() => set('lines')(f.lines.filter((_, j) => j !== i))}>
                  Remove
                </Button>
                {show(`line-${i}`) && <span class="error small ins-row-error">{errors[`line-${i}`]}</span>}
              </div>
            ))}
            <div class="row">
              <Button small variant="ghost" help="Adds another line of dialogue to the brief for you to fill in. Nothing is created yet." onClick={() => set('lines')([...f.lines, blankLine()])}>
                Add line
              </Button>
              {warnings.map((w) => (
                <span key={w} class="small muted">
                  {w}
                </span>
              ))}
            </div>
          </fieldset>

          <fieldset class="ins-rows">
            <legend class="small muted">Devices and papers on screen: which face the camera sees, who reads it, what it shows (D8-D15)</legend>
            {f.surfaces.map((s, i) => (
              <div key={i} class="ins-row">
                <select class="select" aria-label={`Surface ${i + 1} object`} value={s.object} onChange={(e) => setSurface(i, { object: (e.target as HTMLSelectElement).value })}>
                  {SURFACE_OBJECTS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <select class="select" aria-label={`Surface ${i + 1} camera sees`} value={s.camera} onChange={(e) => setSurface(i, { camera: (e.target as HTMLSelectElement).value })}>
                  {CAMERA_FACES.map((c) => (
                    <option key={c} value={c}>
                      camera sees {c}
                    </option>
                  ))}
                </select>
                <select class="select" aria-label={`Surface ${i + 1} reader`} value={s.reader} disabled={s.camera === 'back'} onChange={(e) => setSurface(i, { reader: (e.target as HTMLSelectElement).value })}>
                  <option value="">Read by</option>
                  <option value="reader">the comic reader</option>
                  {cast.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input class="input ins-grow" aria-label={`Surface ${i + 1} shows`} value={s.shows} disabled={s.camera === 'back'} placeholder={s.camera === 'back' ? 'Back view: blank' : 'What the screen or page shows'} onInput={(e) => setSurface(i, { shows: (e.target as HTMLInputElement).value })} />
                <Button small variant="ghost" aria-label={`Remove surface ${i + 1}`} help="Takes this screen or page out of the brief. Nothing is created or deleted in the comic." onClick={() => set('surfaces')(f.surfaces.filter((_, j) => j !== i))}>
                  Remove
                </Button>
                {show(`surface-${i}`) && <span class="error small ins-row-error">{errors[`surface-${i}`]}</span>}
              </div>
            ))}
            <Button small variant="ghost" help="Adds another screen or page for the box to show; you fill in what it displays. Nothing is created yet." onClick={() => set('surfaces')([...f.surfaces, blankSurface()])}>
              Add device or paper
            </Button>
          </fieldset>

          <Chips legend="Sound effects" options={sfxOptions} value={f.sfx} onChange={set('sfx')} error={errors.sfx} />
          <Field id="insb-mnote" label="Motion note" error={show('motionNote')}>
            <input id="insb-mnote" class="input" value={f.motionNote} placeholder="Optional, one line" onInput={(e) => set('motionNote')((e.target as HTMLInputElement).value)} />
          </Field>
          <Field id="insb-art" label="Art notes" error={show('art')}>
            <textarea id="insb-art" class="input ins-area" rows={2} value={f.art} placeholder="Camera, light, what the reader must see." onInput={area(set('art'))} />
          </Field>
          <Refs refs={f.refs} onChange={set('refs')} error={show('refs')} />
          <LaunchConfirm state={lc} idPrefix="ins" />
          <PromptParams params={params} />
        </form>
      )}
    </Dialog>
  );
}
