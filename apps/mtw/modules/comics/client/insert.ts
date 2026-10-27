// Insert scene / Insert box (Matt, 2026-10-11: "the comic studio has a button to insert a scene and insert a box - these
// should have a structured form ... that submits a prompt cache optimized prompt"). Pure logic only: the vocabularies,
// form validation, the launch parameters and finding the run again. The dialogs are in InsertDialogs.tsx.
//
// Prompt caching: the one shared procedure (wiki/operations/prompts/comics-insert.md) has a body that never varies per
// run; every form value goes into the parameters, which the server renders in the final "## This run" section. Every
// parameter is always sent, in PARAM_ORDER, as one compact line.
import type { TerminalInfo } from '../../types';
import { shortHash } from '../../../web/delete';

export const INSERT_OPERATION = 'comics-insert';

/** The procedure's parameters in frontmatter order; assembled params always carry every key in this order. */
export const PARAM_ORDER = ['subject', 'kind', 'issue', 'scene', 'position', 'story', 'cast', 'lines', 'surfaces', 'sound', 'motion', 'boxes', 'art', 'refs'] as const;
export type ParamName = (typeof PARAM_ORDER)[number];

// Vocabularies, mirrored from site/src/data/comic-stories/types.ts (tests/comics-insert.test.ts keeps them in step).
export const SFX_KINDS = ['buzz', 'ring', 'paper', 'keys', 'click', 'whoosh', 'impact', 'glass', 'alarm', 'door', 'heartbeat', 'sting', 'transit'] as const;
export const ROOM_TONES = ['office', 'servers', 'street', 'rain', 'none'] as const;
/** Balloon kinds a new line may use; `machine` is deprecated (2026-09-28). */
export const BALLOON_KINDS = ['speech', 'thought', 'whisper', 'burst', 'fear', 'caption', 'place'] as const;
/** Kinds that need no speaking character. */
export const NARRATION_KINDS: readonly string[] = ['caption', 'place'];
export const MOTION_PRESETS = ['still', 'push', 'drift-left', 'drift-right', 'shadow', 'light'] as const;
/** Score level under a scene, 0-1 (types.ts ComicScene.score). */
export const SCORE_LEVELS = ['0', '0.25', '0.5', '0.75', '1'] as const;
/** Surface objects and camera faces of the box-defect contract (mtw-comic-story references/box-defects.md, D8-D15). */
export const SURFACE_OBJECTS = ['laptop', 'monitor', 'phone', 'paper', 'document', 'whiteboard', 'other'] as const;
export const CAMERA_FACES = ['front', 'back', 'side'] as const;

/** The reader's checker errors on a balloon over this many characters. */
export const MAX_LINE_CHARS = 90;
/** The box-defect D3 warning threshold. */
export const WORDS_WARN = 12;
export const MAX_TEXT = 500;
export const MAX_BOXES = 8;
export const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const IMG_REF = /^img:[A-Za-z0-9][\w.:/#@-]*$/;

export type Where = 'before' | 'after';

export interface SceneForm {
  issue: string;
  where: Where;
  /** The existing scene the new one sits before or after ('' when the issue has none). */
  anchor: string;
  id: string;
  title: string;
  /** What changes in the story. */
  purpose: string;
  /** '' leaves the room to the author. */
  room: string;
  characters: string[];
  boxes: number;
  /** '' leaves the level to the author. */
  score: string;
  sfx: string[];
  soundIdeas: string;
  art: string;
  refs: string[];
}

export interface BalloonLine {
  speaker: string;
  kind: string;
  text: string;
}

export interface Surface {
  object: string;
  camera: string;
  /** Who reads the content face. */
  reader: string;
  /** What the content face shows; empty only for a back (blank) view. */
  shows: string;
}

export interface BoxForm {
  issue: string;
  scene: string;
  where: Where;
  /** 1-based box number in reading order the new box sits before or after (0 in an empty scene). */
  box: number;
  happens: string;
  characters: string[];
  lines: BalloonLine[];
  surfaces: Surface[];
  sfx: string[];
  motion: string;
  motionNote: string;
  art: string;
  refs: string[];
}

export type Errors = Record<string, string>;

export const oneLine = (s: string): string => (s ?? '').replace(/\s+/g, ' ').trim();
const words = (s: string): number => oneLine(s).split(' ').filter(Boolean).length;
const nonEmpty = (xs: readonly string[]): string[] => xs.map(oneLine).filter(Boolean);
const unique = (xs: readonly string[]): string[] => [...new Set(xs)];

function checkText(errors: Errors, key: string, value: string, label: string, required = false): void {
  const v = oneLine(value);
  if (required && !v) errors[key] = `${label} is required.`;
  else if (v.length > MAX_TEXT) errors[key] = `${label} is over ${MAX_TEXT} characters.`;
}

function checkRefs(errors: Errors, refs: readonly string[]): void {
  const bad = nonEmpty(refs).filter((r) => !IMG_REF.test(r));
  if (bad.length) errors.refs = `Not an image reference: ${bad.join(', ')} (use img:<record>).`;
}

/** Field errors for the Insert scene form; empty when it can launch. */
export function validateScene(f: SceneForm, existingIds: readonly string[]): Errors {
  const errors: Errors = {};
  const id = f.id.trim();
  if (!id) errors.id = 'Scene id is required.';
  else if (!KEBAB.test(id)) errors.id = 'Use lower-case words joined by hyphens, like "late-quote".';
  else if (id.length > 48) errors.id = 'Keep the id under 48 characters.';
  else if (existingIds.includes(id)) errors.id = `This issue already has a scene "${id}".`;
  if (existingIds.length && !existingIds.includes(f.anchor)) errors.position = 'Choose where the scene goes.';
  checkText(errors, 'title', f.title, 'Title');
  checkText(errors, 'purpose', f.purpose, 'Purpose', true);
  if (!Number.isInteger(f.boxes) || f.boxes < 1 || f.boxes > MAX_BOXES) errors.boxes = `Choose 1 to ${MAX_BOXES} boxes.`;
  if (f.room && !(ROOM_TONES as readonly string[]).includes(f.room)) errors.room = 'Unknown room tone.';
  if (f.score && !(SCORE_LEVELS as readonly string[]).includes(f.score)) errors.score = 'Unknown score level.';
  const badSfx = f.sfx.filter((k) => !(SFX_KINDS as readonly string[]).includes(k));
  if (badSfx.length) errors.sfx = `Unknown effect: ${badSfx.join(', ')}.`;
  checkText(errors, 'soundIdeas', f.soundIdeas, 'Sound ideas');
  checkText(errors, 'art', f.art, 'Art direction');
  checkRefs(errors, f.refs);
  return errors;
}

/** Field errors for the Insert box form; keys `line-<i>` and `surface-<i>` point at a row. */
export function validateBox(f: BoxForm, boxCount: number): Errors {
  const errors: Errors = {};
  if (!f.scene.trim()) errors.position = 'No scene chosen.';
  else if (boxCount > 0 ? !Number.isInteger(f.box) || f.box < 1 || f.box > boxCount : f.box !== 0) errors.position = 'Choose where the box goes.';
  checkText(errors, 'happens', f.happens, 'What happens', true);
  f.lines.forEach((l, i) => {
    const text = oneLine(l.text);
    if (!(BALLOON_KINDS as readonly string[]).includes(l.kind)) errors[`line-${i}`] = 'Choose a balloon kind.';
    else if (!text) errors[`line-${i}`] = 'Write the line or remove the row.';
    else if (text.length > MAX_LINE_CHARS) errors[`line-${i}`] = `${text.length} characters; the reader allows ${MAX_LINE_CHARS}.`;
    else if (!NARRATION_KINDS.includes(l.kind) && !l.speaker.trim()) errors[`line-${i}`] = 'Choose who says it.';
  });
  f.surfaces.forEach((s, i) => {
    if (!s.object.trim()) errors[`surface-${i}`] = 'Name the device or paper.';
    else if (!(CAMERA_FACES as readonly string[]).includes(s.camera)) errors[`surface-${i}`] = 'Choose which face the camera sees.';
    else if (s.camera === 'back' && oneLine(s.shows)) errors[`surface-${i}`] = 'The camera sees its back, so it shows nothing here: leave "shows" empty and add a front view row for the content.';
    else if (s.camera !== 'back' && !oneLine(s.shows)) errors[`surface-${i}`] = 'Say what the screen or page shows.';
    else if (s.camera !== 'back' && !s.reader.trim()) errors[`surface-${i}`] = 'Say who reads it.';
    else if (oneLine(s.shows).length > MAX_TEXT) errors[`surface-${i}`] = `Over ${MAX_TEXT} characters.`;
  });
  const badSfx = f.sfx.filter((k) => !(SFX_KINDS as readonly string[]).includes(k));
  if (badSfx.length) errors.sfx = `Unknown effect: ${badSfx.join(', ')}.`;
  if (f.motion && !(MOTION_PRESETS as readonly string[]).includes(f.motion)) errors.motion = 'Unknown motion preset.';
  checkText(errors, 'motionNote', f.motionNote, 'Motion note');
  checkText(errors, 'art', f.art, 'Art notes');
  checkRefs(errors, f.refs);
  return errors;
}

/** Non-blocking notes: lines over the D3 word limit. */
export function lineWarnings(lines: readonly BalloonLine[]): string[] {
  return lines.flatMap((l, i) => (words(l.text) > WORDS_WARN ? [`Line ${i + 1} has ${words(l.text)} words; the checker warns over ${WORDS_WARN} (D3).`] : []));
}

/** Who speaks, in reading order, from the lines. */
export const speakersOf = (lines: readonly BalloonLine[]): string[] => unique(lines.filter((l) => !NARRATION_KINDS.includes(l.kind) && l.speaker.trim() && oneLine(l.text)).map((l) => l.speaker.trim()));

/** Compact one-line JSON of an object with its keys in the given order, dropping empty values; '' when nothing is left. */
function compact(entries: [string, unknown][]): string {
  const kept = entries.filter(([, v]) => v !== '' && v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0));
  return kept.length ? JSON.stringify(Object.fromEntries(kept)) : '';
}

function ordered(values: Partial<Record<ParamName, string>>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of PARAM_ORDER) out[k] = oneLine(values[k] ?? '');
  return out;
}

export const insertSubject = {
  scene: (issue: string, where: Where, anchor: string, id: string): string => `insert:scene:${issue}/${where}:${anchor || '-'}/${id}`,
  box: (issue: string, scene: string, where: Where, box: number, happens: string): string => `insert:box:${issue}/${scene}/${where}:${box}@${shortHash(oneLine(happens))}`,
};

export interface InsertSubject {
  kind: 'scene' | 'box';
  issue: string;
  /** The new scene's id (scene) or the scene that gets the box (box). */
  scene: string;
  where: Where;
  /** Anchor scene id (scene) or 1-based box number as text (box). */
  anchor: string;
}

export function parseInsertSubject(subject: string | undefined): InsertSubject | null {
  const s = subject?.match(/^insert:scene:([^/]+)\/(before|after):([^/]+)\/([^/]+)$/);
  if (s) return { kind: 'scene', issue: s[1] as string, where: s[2] as Where, anchor: s[3] === '-' ? '' : (s[3] as string), scene: s[4] as string };
  const b = subject?.match(/^insert:box:([^/]+)\/([^/]+)\/(before|after):(\d+)@[a-z0-9]+$/);
  if (b) return { kind: 'box', issue: b[1] as string, scene: b[2] as string, where: b[3] as Where, anchor: b[4] as string };
  return null;
}

export function sceneParams(f: SceneForm): Record<string, string> {
  return ordered({
    subject: insertSubject.scene(f.issue, f.where, f.anchor, f.id.trim()),
    kind: 'scene',
    issue: f.issue,
    scene: f.id.trim(),
    position: `${f.where}:${f.anchor || '-'}`,
    story: compact([['title', oneLine(f.title)], ['purpose', oneLine(f.purpose)]]),
    cast: compact([['present', unique(nonEmpty(f.characters))]]),
    sound: compact([['score', f.score ? Number(f.score) : ''], ['room', f.room], ['sfx', unique(f.sfx)], ['ideas', oneLine(f.soundIdeas)]]),
    boxes: String(f.boxes),
    art: f.art,
    refs: nonEmpty(f.refs).join(', '),
  });
}

export function boxParams(f: BoxForm): Record<string, string> {
  const lines = f.lines.filter((l) => oneLine(l.text)).map((l) => [NARRATION_KINDS.includes(l.kind) ? l.speaker.trim() || 'narrator' : l.speaker.trim(), l.kind, oneLine(l.text)]);
  const surfaces = f.surfaces.filter((s) => s.object.trim()).map((s) => compactObject([['object', oneLine(s.object)], ['camera', s.camera], ['reader', s.reader.trim()], ['shows', oneLine(s.shows)]]));
  return ordered({
    subject: insertSubject.box(f.issue, f.scene, f.where, f.box, f.happens),
    kind: 'box',
    issue: f.issue,
    scene: f.scene,
    position: `${f.where}:${f.box}`,
    story: compact([['happens', oneLine(f.happens)]]),
    cast: compact([['present', unique(nonEmpty(f.characters))], ['speakers', speakersOf(f.lines)]]),
    lines: lines.length ? JSON.stringify(lines) : '',
    surfaces: surfaces.length ? JSON.stringify(surfaces) : '',
    sound: compact([['sfx', unique(f.sfx)]]),
    motion: compact([['preset', f.motion], ['note', oneLine(f.motionNote)]]),
    art: f.art,
    refs: nonEmpty(f.refs).join(', '),
  });
}

function compactObject(entries: [string, string][]): Record<string, string> {
  return Object.fromEntries(entries.filter(([, v]) => v !== ''));
}

/** Insert runs for this issue that are still going, newest first. */
export function insertRuns(list: readonly TerminalInfo[], issue: string): { run: TerminalInfo; target: InsertSubject }[] {
  const out: { run: TerminalInfo; target: InsertSubject }[] = [];
  for (const run of list) {
    if (run.operation !== INSERT_OPERATION || run.status !== 'running') continue;
    const target = parseInsertSubject(run.subject);
    if (target && target.issue === issue) out.push({ run, target });
  }
  return out.sort((a, b) => b.run.startedAt.localeCompare(a.run.startedAt));
}

/** The latest run (any state) for one subject: how a dialog finds the run it launched. */
export function insertRunFor(list: readonly TerminalInfo[], subject: string): TerminalInfo | undefined {
  let best: TerminalInfo | undefined;
  for (const t of list) {
    if (t.operation !== INSERT_OPERATION || t.subject !== subject) continue;
    if (!best || t.startedAt >= best.startedAt) best = t;
  }
  return best;
}

/** Slot options for a new scene: before the first, then after each scene. */
export function scenePositions(scenes: readonly { id: string; title: string }[]): { value: string; label: string }[] {
  if (!scenes.length) return [{ value: 'after:', label: 'First scene' }];
  const name = (s: { id: string; title: string }, n: number) => `${n + 1}. ${s.title?.trim() || s.id}`;
  return [{ value: `before:${scenes[0]!.id}`, label: `Before ${name(scenes[0]!, 0)}` }, ...scenes.map((s, n) => ({ value: `after:${s.id}`, label: `After ${name(s, n)}` }))];
}

/** Slot options for a new box: before box 1, then after each box. */
export function boxPositions(count: number): { value: string; label: string }[] {
  if (count < 1) return [{ value: 'after:0', label: 'First box' }];
  return [{ value: 'before:1', label: 'Before box 1' }, ...Array.from({ length: count }, (_, i) => ({ value: `after:${i + 1}`, label: `After box ${i + 1}` }))];
}

export function splitPosition(value: string): { where: Where; anchor: string } {
  const i = value.indexOf(':');
  return { where: value.slice(0, i) === 'before' ? 'before' : 'after', anchor: value.slice(i + 1) };
}
