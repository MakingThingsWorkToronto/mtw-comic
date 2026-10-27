// Comic Editor server logic (pure): read and patch balloon lines in site/src/data/comic-stories/<story>.ts.
// New for the MTW app. The four issue files hold one balloon object per line as a strict JSON literal inside
// `balloons: [` ... `] },`; this module parses only those lines, rewrites only the edited lines and refuses any other shape.
import { createHash } from 'node:crypto';
import { DEFAULT_CAST, validateBalloon } from './model';
import type { BalloonData, EditOp, SceneModel, StoryModel } from './model';

export class ShapeError extends Error {
  readonly status = 422;
}
export class OpError extends Error {
  readonly status = 400;
}

export const sha256 = (text: string): string => createHash('sha256').update(text, 'utf8').digest('hex');

const SCENES_START = /^\s*scenes:\s*\[/;
const SCENE_ID = /^\s*id:\s*"([^"]+)",?\s*$/;
const PANEL_LINE = /^\s*\{\s*at:\s*-?[\d.]+\s*,/;
const IMG = /\bimg:\s*"([^"]*)"/;
const BALLOONS_OPEN = /\bballoons:\s*\[\s*$/;
const BALLOONS_INLINE = /\bballoons:\s*\[[^\]]*\]/;
const BLOCK_CLOSE = /^\s*\]\s*\},?\s*$/;
const BALLOON_LINE = /^(\s*)(\{.*\})(,?)\s*$/;

interface ParsedPanel {
  img: string;
  panelLine: number;
  /** Line numbers of the balloon lines. */
  balloonLines: number[];
  /** True when the panel uses the multi-line `balloons: [` block the editor can patch. */
  block: boolean;
}
interface ParsedScene { id: string; panels: ParsedPanel[] }
interface Parsed { lines: string[]; scenes: ParsedScene[] }

const stripCr = (line: string): { body: string; cr: string } => (line.endsWith('\r') ? { body: line.slice(0, -1), cr: '\r' } : { body: line, cr: '' });

function parseBalloon(body: string, lineNo: number): { data: BalloonData; indent: string; comma: string } {
  const m = BALLOON_LINE.exec(body);
  if (!m) throw new ShapeError(`line ${lineNo + 1}: not a single-line balloon object`);
  let data: unknown;
  try {
    data = JSON.parse(m[2] as string);
  } catch {
    throw new ShapeError(`line ${lineNo + 1}: balloon is not a strict JSON literal (this file is not line-patchable)`);
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new ShapeError(`line ${lineNo + 1}: balloon is not an object`);
  return { data: data as BalloonData, indent: m[1] as string, comma: m[3] as string };
}

/** Locate scenes, panels and balloon lines. Throws ShapeError for any file the editor cannot patch safely. */
export function parseStory(text: string): Parsed {
  const lines = text.split('\n');
  const scenes: ParsedScene[] = [];
  let inScenes = false;
  let scene: ParsedScene | null = null;
  let panel: ParsedPanel | null = null;
  for (let i = 0; i < lines.length; i++) {
    const { body } = stripCr(lines[i] as string);
    if (!inScenes) {
      inScenes = SCENES_START.test(body);
      continue;
    }
    if (panel && panel.block) {
      if (BLOCK_CLOSE.test(body)) {
        panel = null;
        continue;
      }
      parseBalloon(body, i);
      panel.balloonLines.push(i);
      continue;
    }
    const id = SCENE_ID.exec(body);
    if (id && !PANEL_LINE.test(body)) {
      scene = { id: id[1] as string, panels: [] };
      scenes.push(scene);
      continue;
    }
    if (scene && PANEL_LINE.test(body)) {
      const img = IMG.exec(body)?.[1];
      if (img === undefined) throw new ShapeError(`line ${i + 1}: panel has no img`);
      const block = BALLOONS_OPEN.test(body);
      if (!block && !BALLOONS_INLINE.test(body)) throw new ShapeError(`line ${i + 1}: panel balloons are not in a one-per-line block`);
      panel = { img, panelLine: i, balloonLines: [], block };
      scene.panels.push(panel);
      if (!block) panel = null;
    }
  }
  const supported = scenes.reduce((n, s) => n + s.panels.filter((p) => p.block).length, 0);
  if (!scenes.length || !supported) {
    const generated = lines.some((l) => /^\s*"scenes":\s*\[/.test(l));
    throw new ShapeError(generated
      ? 'this story is a retime({...}) JSON literal that could not be located as a single argument'
      : 'no scenes with one-balloon-per-line panels were found (expected a file like traditional.ts)');
  }
  if (panel) throw new ShapeError('a balloons block was not closed');
  // Duplicate (scene, img) pairs would make an address ambiguous.
  const seen = new Set<string>();
  for (const s of scenes) for (const p of s.panels) {
    const key = `${s.id}\u0000${p.img}`;
    if (seen.has(key)) throw new ShapeError(`panel ${s.id}/${p.img} appears twice`);
    seen.add(key);
  }
  return { lines, scenes };
}

/** The balloons of every panel, parsed from the lines (one-per-line files) or from the retime(...) JSON argument. */
export function storyModel(text: string, id: string, slug: string): StoryModel {
  const span = locateRetimeSpan(text);
  if (span) {
    const { story } = parseJsonStory(text, span);
    return { id, slug, hash: sha256(text), scenes: story.scenes.map((s) => ({ id: s.id, panels: s.panels.map((p) => ({ img: p.img, balloons: p.balloons as unknown as BalloonData[] })) })) };
  }
  const parsed = parseStory(text);
  const scenes: SceneModel[] = parsed.scenes.map((s) => ({
    id: s.id,
    panels: s.panels.map((p) => ({ img: p.img, balloons: p.balloonLines.map((n) => parseBalloon(stripCr(parsed.lines[n] as string).body, n).data) })),
  }));
  return { id, slug, hash: sha256(text), scenes };
}

const ORDER = ['at', 'speech', 'kind', 'characterIntro', 'sceneSetup', 'state', 'who', 'text', 'em', 'x', 'y', 'w', 'tail', 'breakout', 'chain', 'across', 'edge', 'phone'];
function ordered(b: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of ORDER) if (k in b && b[k] !== undefined) out[k] = b[k];
  for (const k of Object.keys(b)) if (!(k in out) && b[k] !== undefined) out[k] = b[k];
  return out;
}

const FORBIDDEN_PATCH = ['at', 'b', 'l', 'speech'];

export interface OpResult {
  text: string;
  /** Per-op summary used for the decision log. */
  changes: { action: 'edit-balloon' | 'insert-balloon' | 'delete-balloon'; scene: string; img: string; index: number; old?: BalloonData; new?: BalloonData }[];
}

/**
 * Apply edit/insert/delete ops in order to the file text. Only the targeted lines are replaced, inserted or removed;
 * every other byte is kept (line endings included). Timing keys (at, b, l) and speech are never written by an edit.
 */
export function applyOps(text: string, ops: EditOp[], cast: readonly string[] = DEFAULT_CAST): OpResult {
  const span = locateRetimeSpan(text);
  if (span) return applyJsonOps(text, span, ops, cast);
  let current = text;
  const changes: OpResult['changes'] = [];
  for (const op of ops) {
    const parsed = parseStory(current);
    const scene = parsed.scenes.find((s) => s.id === op.scene);
    const panel = scene?.panels.find((p) => p.img === op.img);
    if (!scene || !panel) throw new OpError(`no panel ${op.scene}/${op.img}`);
    if (!panel.block) throw new ShapeError(`panel ${op.scene}/${op.img} has its balloons inline; the editor cannot patch it`);
    const lines = parsed.lines;
    const eolCr = (n: number): string => stripCr(lines[n] as string).cr;

    if (op.op === 'edit') {
      const n = panel.balloonLines[op.index];
      if (n === undefined) throw new OpError(`no balloon ${op.index + 1} in ${op.scene}/${op.img}`);
      const cur = parseBalloon(stripCr(lines[n] as string).body, n);
      const merged: Record<string, unknown> = { ...cur.data };
      for (const [k, v] of Object.entries(op.patch)) {
        if (FORBIDDEN_PATCH.includes(k)) throw new OpError(`${k} is never edited (retime recomputes timing on import)`);
        if (v === null || v === undefined) delete merged[k];
        else merged[k] = v;
      }
      const problems = validateBalloon(merged, cast);
      if (problems.length) throw new OpError(problems.join('; '));
      lines[n] = `${cur.indent}${JSON.stringify(ordered(merged))}${cur.comma}${eolCr(n)}`;
      changes.push({ action: 'edit-balloon', scene: op.scene, img: op.img, index: op.index, old: cur.data, new: merged as BalloonData });
    } else if (op.op === 'delete') {
      const n = panel.balloonLines[op.index];
      if (n === undefined) throw new OpError(`no balloon ${op.index + 1} in ${op.scene}/${op.img}`);
      const cur = parseBalloon(stripCr(lines[n] as string).body, n);
      lines.splice(n, 1);
      // Keep the list valid: if the removed line was the last and the new last has no comma issue, nothing to do (trailing commas are legal).
      changes.push({ action: 'delete-balloon', scene: op.scene, img: op.img, index: op.index, old: cur.data });
    } else {
      const count = panel.balloonLines.length;
      if (!Number.isInteger(op.after) || op.after < -1 || op.after > count - 1) throw new OpError(`cannot insert after balloon ${op.after + 1}`);
      const forbidden = ['b', 'l', 'speech'].find((k) => k in op.balloon);
      if (forbidden) throw new OpError(`${forbidden} is never written by an insert`);
      const neighbour = panel.balloonLines[Math.max(op.after, 0)] ?? panel.balloonLines[0];
      const nb = neighbour !== undefined ? parseBalloon(stripCr(lines[neighbour] as string).body, neighbour) : null;
      const placeholderAt = typeof nb?.data.at === 'number' ? nb.data.at : 0;
      const fresh: Record<string, unknown> = { ...op.balloon, at: placeholderAt };
      const problems = validateBalloon(fresh, cast);
      if (problems.length) throw new OpError(problems.join('; '));
      const indent = nb?.indent ?? `${/^\s*/.exec(lines[panel.panelLine] as string)?.[0] ?? ''}  `;
      const cr = eolCr(panel.panelLine);
      const insertAt = op.after < 0 ? (panel.balloonLines[0] ?? panel.panelLine + 1) : (panel.balloonLines[op.after] as number) + 1;
      // The new line takes a trailing comma like its neighbours (the issue files end every balloon with one).
      lines.splice(insertAt, 0, `${indent}${JSON.stringify(ordered(fresh))},${cr}`);
      changes.push({ action: 'insert-balloon', scene: op.scene, img: op.img, index: op.after + 1, new: fresh as unknown as BalloonData });
    }
    current = lines.join('\n');
  }
  // Safety: the result must parse again and the untouched lines must be unchanged in number terms.
  parseStory(current);
  return { text: current, changes };
}

/** Lines that differ between two texts (same line count), for the byte-identical guarantee in tests and the save path. */
export function changedLines(a: string, b: string): number[] {
  const x = a.split('\n'), y = b.split('\n');
  const out: number[] = [];
  for (let i = 0; i < Math.max(x.length, y.length); i++) if (x[i] !== y[i]) out.push(i);
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// Second save strategy: the story is one pretty-printed JSON object passed to retime(...), e.g. home.ts.
// The argument span is parsed, the targeted balloon is changed, and the object is re-serialised with the file's own
// formatting. The unmodified parse must reproduce the original span byte for byte or the file is refused; only the
// span is replaced, so the header, imports and everything after the closing brace are kept as they are.
// ---------------------------------------------------------------------------------------------------------------

export interface RetimeSpan { start: number; end: number }

/** The exact `{...}` argument of `retime(`, or null when the file does not call retime with an object literal. */
export function locateRetimeSpan(text: string): RetimeSpan | null {
  // Only a JSON object (quoted first key); the other issue files pass a JS literal and use the one-balloon-per-line strategy.
  const m = /\bretime\(\s*\{(?=\s*")/.exec(text);
  if (!m) return null;
  const start = m.index + m[0].length - 1;
  let depth = 0;
  let inString = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i] as string;
    if (inString) {
      if (c === '\\') i++;
      else if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) {
      if (!/^\s*,?\s*\)/.test(text.slice(i + 1))) throw new ShapeError('retime(...) argument is not followed by a closing parenthesis');
      return { start, end: i + 1 };
    }
  }
  throw new ShapeError('retime(...) argument is not a balanced JSON object');
}

type Json = Record<string, unknown>;
interface JsonStory { scenes: { id: string; panels: { img: string; balloons: Json[] }[] }[] }
interface Layout { indent: string | number; eol: '\n' | '\r\n' }

function serialise(obj: unknown, layout: Layout): string {
  const out = JSON.stringify(obj, null, layout.indent);
  return layout.eol === '\n' ? out : out.replace(/\n/g, layout.eol);
}

/** Offsets of every number token outside strings (the generator writes 0.0 / 1.50 where JSON.stringify writes 0 / 1.5). */
function numberTokens(text: string): { s: number; e: number }[] {
  const out: { s: number; e: number }[] = [];
  const re = /"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
  for (let m = re.exec(text); m; m = re.exec(text)) if (m[0][0] !== '"') out.push({ s: m.index, e: m.index + m[0].length });
  return out;
}

/** The re-serialised text with each number literal replaced by the original's spelling when the values are equal. */
function restoreNumbers(serialised: string, original: string): string {
  const a = numberTokens(serialised), b = numberTokens(original);
  if (a.length !== b.length) return serialised;
  let out = '', last = 0;
  a.forEach((tok, i) => {
    const was = original.slice((b[i] as { s: number }).s, (b[i] as { e: number }).e);
    const now = serialised.slice(tok.s, tok.e);
    out += serialised.slice(last, tok.s) + (Number(was) === Number(now) ? was : now);
    last = tok.e;
  });
  return out + serialised.slice(last);
}

/** For an edited object: number literals of unchanged `"key": number` lines keep their original spelling, matched per key in order. */
function restoreNumberLines(serialised: string, original: string): string {
  const line = /^(\s*(?:"[^"\\]*": )?)(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)(,?)\s*$/;
  const queues = new Map<string, string[]>();
  for (const l of original.split(/\r?\n/)) {
    const m = line.exec(l);
    if (m) queues.set(m[1]!.trim(), [...(queues.get(m[1]!.trim()) ?? []), m[2] as string]);
  }
  return serialised.split('\n').map((l) => {
    const m = line.exec(l);
    if (!m) return l;
    const q = queues.get(m[1]!.trim());
    const was = q?.shift();
    return was !== undefined && Number(was) === Number(m[2]) ? `${m[1]}${was}${m[3]}` : l;
  }).join('\n');
}

interface Node { start: number; end: number; kind: 'obj' | 'arr' | 'val'; items: Node[]; props: Map<string, Node> }

/** A small offset-keeping JSON tokenizer over text already known to be strict JSON. */
function parseNode(t: string, from: number): Node {
  let i = from;
  const ws = () => { while (i < t.length && /\s/.test(t[i] as string)) i++; };
  const str = () => { const s = i; i++; while (t[i] !== '"') i += t[i] === '\\' ? 2 : 1; i++; return t.slice(s, i); };
  const value = (): Node => {
    ws();
    const n: Node = { start: i, end: i, kind: 'val', items: [], props: new Map() };
    const c = t[i];
    if (c === '{' || c === '[') {
      n.kind = c === '{' ? 'obj' : 'arr';
      i++; ws();
      while (t[i] !== (c === '{' ? '}' : ']')) {
        if (c === '{') { const k = JSON.parse(str()) as string; ws(); i++; n.props.set(k, value()); } else n.items.push(value());
        ws();
        if (t[i] === ',') { i++; ws(); }
      }
      i++;
    } else if (c === '"') str();
    else while (i < t.length && !/[\s,\]}]/.test(t[i] as string)) i++;
    n.end = i;
    return n;
  };
  return value();
}

/** Parse the span and find the indent and line ending that reproduce it exactly (number spellings aside); refuse when none does. */
function parseJsonStory(text: string, span: RetimeSpan): { story: JsonStory; layout: Layout; root: Node } {
  const original = text.slice(span.start, span.end);
  let raw: unknown;
  try {
    raw = JSON.parse(original);
  } catch {
    throw new ShapeError('the retime(...) argument is not strict JSON, so the editor cannot patch it safely');
  }
  const eol: Layout['eol'] = original.includes('\r\n') ? '\r\n' : '\n';
  const layout = ([2, '\t', 4] as const).map((indent): Layout => ({ indent, eol })).find((l) => restoreNumbers(serialise(raw, l), original) === original);
  if (!layout) {
    throw new ShapeError('the retime(...) JSON formatting cannot be reproduced exactly (expected JSON.stringify with 2 spaces, a tab or 4 spaces, and consistent line endings); refusing to rewrite the file');
  }
  const story = raw as JsonStory;
  if (!story || !Array.isArray(story.scenes) || !story.scenes.length) throw new ShapeError('the retime(...) story has no scenes');
  const seen = new Set<string>();
  for (const s of story.scenes) {
    if (typeof s.id !== 'string' || !Array.isArray(s.panels)) throw new ShapeError('a scene has no id or panels');
    for (const p of s.panels) {
      if (typeof p.img !== 'string' || !Array.isArray(p.balloons)) throw new ShapeError(`panel in scene ${s.id} has no img or balloons`);
      const key = `${s.id}\u0000${p.img}`;
      if (seen.has(key)) throw new ShapeError(`panel ${s.id}/${p.img} appears twice`);
      seen.add(key);
    }
  }
  return { story, layout, root: parseNode(original, 0) };
}

/** Header comments (before the first non-comment line) that say the file is produced or rebuilt elsewhere; null when none do. */
export function generatedHeaderWarning(text: string): string | null {
  const header: string[] = [];
  for (const line of text.split('\n')) {
    const t = line.replace(/\r+$/, '').trim();
    if (t.startsWith('//')) header.push(t.slice(2).trim());
    else if (t) break;
  }
  const joined = header.join(' ');
  return /\b(generated|regenerat\w*|rebuil\w*|canonical|do not edit|overwr\w*)\b/i.test(joined)
    ? `The file header says this story is produced from another source ("${joined.slice(0, 160)}"). Regenerating it may overwrite manual edits made here.`
    : null;
}

function applyJsonOps(text: string, span: RetimeSpan, ops: EditOp[], cast: readonly string[]): OpResult {
  const { story, layout, root } = parseJsonStory(text, span);
  const changes: OpResult['changes'] = [];
  // Targeted splice: only the balloons arrays an op touches are re-emitted; untouched balloons keep their source text.
  interface Slot { src?: string; obj?: Json }
  const touched = new Map<Node, Slot[]>();
  const slotsOf = (si: number, pi: number): Slot[] => {
    const arr = root.props.get('scenes')!.items[si]!.props.get('panels')!.items[pi]!.props.get('balloons')!;
    let slots = touched.get(arr);
    if (!slots) {
      slots = arr.items.map((n) => ({ src: text.slice(span.start + n.start, span.start + n.end) }));
      touched.set(arr, slots);
    }
    return slots;
  };
  for (const op of ops) {
    const si = story.scenes.findIndex((s) => s.id === op.scene);
    const pi = si < 0 ? -1 : (story.scenes[si] as JsonStory['scenes'][number]).panels.findIndex((p) => p.img === op.img);
    const panel = pi < 0 ? undefined : story.scenes[si]!.panels[pi];
    if (!panel) throw new OpError(`no panel ${op.scene}/${op.img}`);
    const list = panel.balloons;
    const slots = slotsOf(si, pi);
    if (op.op === 'edit') {
      const cur = list[op.index];
      if (!cur) throw new OpError(`no balloon ${op.index + 1} in ${op.scene}/${op.img}`);
      const merged: Json = { ...cur };
      for (const [k, v] of Object.entries(op.patch)) {
        if (FORBIDDEN_PATCH.includes(k)) throw new OpError(`${k} is never edited (retime recomputes timing on import)`);
        if (v === null || v === undefined) delete merged[k];
        else merged[k] = v;
      }
      const problems = validateBalloon(merged, cast);
      if (problems.length) throw new OpError(problems.join('; '));
      list[op.index] = merged;
      slots[op.index] = { src: slots[op.index]?.src, obj: merged };
      changes.push({ action: 'edit-balloon', scene: op.scene, img: op.img, index: op.index, old: cur as unknown as BalloonData, new: merged as unknown as BalloonData });
    } else if (op.op === 'delete') {
      const cur = list[op.index];
      if (!cur) throw new OpError(`no balloon ${op.index + 1} in ${op.scene}/${op.img}`);
      list.splice(op.index, 1);
      slots.splice(op.index, 1);
      changes.push({ action: 'delete-balloon', scene: op.scene, img: op.img, index: op.index, old: cur as unknown as BalloonData });
    } else {
      if (!Number.isInteger(op.after) || op.after < -1 || op.after > list.length - 1) throw new OpError(`cannot insert after balloon ${op.after + 1}`);
      const forbidden = ['b', 'l', 'speech'].find((k) => k in op.balloon);
      if (forbidden) throw new OpError(`${forbidden} is never written by an insert`);
      const neighbour = list[Math.max(op.after, 0)];
      const fresh: Json = { ...op.balloon, at: typeof neighbour?.at === 'number' ? neighbour.at : 0 };
      const problems = validateBalloon(fresh, cast);
      if (problems.length) throw new OpError(problems.join('; '));
      const placed = ordered(fresh);
      list.splice(op.after + 1, 0, placed);
      slots.splice(op.after + 1, 0, { obj: placed });
      changes.push({ action: 'insert-balloon', scene: op.scene, img: op.img, index: op.after + 1, new: fresh as unknown as BalloonData });
    }
  }
  const unit = typeof layout.indent === 'number' ? ' '.repeat(layout.indent) : layout.indent;
  const lead = (at: number): string => {
    const from = text.lastIndexOf('\n', at - 1) + 1;
    return /^[ \t]*/.exec(text.slice(from, at))![0];
  };
  const edits = [...touched.entries()].map(([arr, slots]) => {
    const start = span.start + arr.start, end = span.start + arr.end;
    const close = lead(start);
    const first = arr.items[0];
    const inner = first ? lead(span.start + first.start) : close + unit;
    const parts = slots.map((sl) => {
      if (!sl.obj) return sl.src as string;
      let body = JSON.stringify(sl.obj, null, layout.indent);
      if (sl.src) body = restoreNumberLines(body, sl.src);
      return body.split('\n').join(layout.eol + inner);
    });
    const out = parts.length ? `[${layout.eol}${inner}${parts.join(`,${layout.eol}${inner}`)}${layout.eol}${close}]` : '[]';
    return { start, end, out };
  }).sort((a, b) => b.start - a.start);
  let result = text;
  for (const e of edits) result = result.slice(0, e.start) + e.out + result.slice(e.end);
  return { text: result, changes };
}
