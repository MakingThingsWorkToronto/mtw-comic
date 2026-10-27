// Comic Editor shared model (client and server): balloon fields, validation, px<->fraction math, three-way merge.
// New for the MTW app; field meanings come from site/src/data/comic-stories/types.ts (read-only).

export const KINDS = ['speech', 'thought', 'burst', 'fear', 'caption', 'place'] as const;
export const STATES = ['calm', 'offpanel', 'device', 'weak', 'menace', 'thought', 'shout', 'scream', 'panic', 'fear', 'narration'] as const;
export const EDGES = ['top', 'left', 'right', 'bottom'] as const;
/** Fallback cast list; the server prefers parsing the CastId union from site types.ts. */
export const DEFAULT_CAST = [
  'matt', 'claude', 'codex', 'dana', 'marco', 'ruth', 'sam', 'joan', 'potvin',
  'slop', 'hallucination', 'snowball', 'blindspot', 'shadow', 'shelf', 'amnesia', 'rogue', 'overhead',
  'grok', 'copilot', 'opencode', 'frontier-league', 'local-crew', 'narrator', 'second-brain',
];
/** Keys the editor never writes: retime() recomputes timing on import. */
export const TIMING_KEYS = ['at', 'b', 'l'] as const;

export interface BalloonData {
  at?: number;
  kind: string;
  who: string;
  text: string;
  x: number;
  y: number;
  w?: number;
  tail?: [number, number];
  state?: string;
  em?: string;
  characterIntro?: boolean;
  sceneSetup?: boolean;
  breakout?: boolean;
  chain?: boolean;
  across?: boolean;
  edge?: string;
  phone?: { x?: number; y?: number; w?: number; tail?: [number, number]; anchor?: 'free'; chain?: boolean };
  speech?: unknown;
  [extra: string]: unknown;
}

export interface PanelModel { img: string; balloons: BalloonData[] }
export interface SceneModel { id: string; panels: PanelModel[] }
export interface StoryModel { id: string; slug: string; hash: string; scenes: SceneModel[] }

/** Address of one balloon: the story-wide subject is `<story>-<scene>-<img>-b<index+1>`. */
export interface BalloonAddr { scene: string; img: string; index: number }
export const subjectOf = (story: string, a: BalloonAddr): string => `${story}-${a.scene}-${a.img}-b${a.index + 1}`;

export type EditOp =
  | ({ op: 'edit' } & BalloonAddr & { patch: Record<string, unknown> })
  | ({ op: 'insert' } & { scene: string; img: string; after: number; balloon: BalloonData })
  | ({ op: 'delete' } & BalloonAddr);

export const wordCount = (text: string): number => text.split(/\s+/).filter(Boolean).length;
/** The ~12-word guidance; a warning, never a block. */
export const wordGuidance = (text: string): string | null => {
  const n = wordCount(text);
  return n > 14 ? `${n} words; keep to about 12` : null;
};

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isPair = (v: unknown): v is [number, number] => Array.isArray(v) && v.length === 2 && v.every(isNum);

/** Returns problems (empty = valid). `cast` is the allowed who list. */
export function validateBalloon(b: Record<string, unknown>, cast: readonly string[] = DEFAULT_CAST): string[] {
  const out: string[] = [];
  if (typeof b.text !== 'string' || !b.text.trim()) out.push('text is required');
  if (!(KINDS as readonly string[]).includes(b.kind as string)) out.push(`kind must be one of ${KINDS.join(', ')}`);
  if (typeof b.who !== 'string' || !cast.includes(b.who)) out.push('who must be a cast id');
  if (b.state !== undefined && !(STATES as readonly string[]).includes(b.state as string)) out.push('state is not recognised');
  if (b.edge !== undefined && !(EDGES as readonly string[]).includes(b.edge as string)) out.push('edge is not recognised');
  const lim = b.breakout ? [-0.3, 1.3] : [0, 1];
  for (const k of ['x', 'y'] as const) {
    const v = b[k];
    if (!isNum(v)) out.push(`${k} must be a number`);
    else if (v < (lim[0] as number) || v > (lim[1] as number)) out.push(`${k} must be ${lim[0]} to ${lim[1]}`);
  }
  if (b.w !== undefined && (!isNum(b.w) || b.w <= 0 || b.w > 1.3)) out.push('w must be above 0 and at most 1.3');
  if (b.tail !== undefined && !isPair(b.tail)) out.push('tail must be [x, y]');
  if (typeof b.em === 'string' && b.em && typeof b.text === 'string' && !b.text.replace(/\s+/g, ' ').includes(b.em)) out.push('em must appear in the text');
  const ph = b.phone as Record<string, unknown> | undefined;
  if (ph !== undefined) {
    if (typeof ph !== 'object' || ph === null || Array.isArray(ph)) out.push('phone must be an object');
    else {
      for (const k of ['x', 'y', 'w'] as const) if (ph[k] !== undefined && !isNum(ph[k])) out.push(`phone.${k} must be a number`);
      if (ph.tail !== undefined && !isPair(ph.tail)) out.push('phone.tail must be [x, y]');
    }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// px <-> panel fractions. Geometry rects are document CSS px inside the iframe; the caller divides screen pointer
// deltas by the iframe's on-screen scale before calling these.
// ---------------------------------------------------------------------------------------------------------------
export interface PxRect { x: number; y: number; width: number; height: number }
export const round3 = (n: number): number => Math.round(n * 1000) / 1000;
const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));
const range = (breakout?: boolean): [number, number] => (breakout ? [-0.3, 1.3] : [0, 1]);

/** Pixel rect of a balloon placed at fractions (x, y, w) in a panel; height is not authored, so it comes from `height`. */
export function fractionsToRect(panel: PxRect, f: { x: number; y: number; w: number }, height: number): PxRect {
  return { x: panel.x + f.x * panel.width, y: panel.y + f.y * panel.height, width: f.w * panel.width, height };
}
/** Fractions of a balloon's measured rect inside its panel. */
export function rectToFractions(panel: PxRect, rect: PxRect): { x: number; y: number; w: number } {
  return { x: round3((rect.x - panel.x) / panel.width), y: round3((rect.y - panel.y) / panel.height), w: round3(rect.width / panel.width) };
}
/** Move: new x, y after a pointer delta in CSS px. */
export function dragMove(panel: PxRect, start: { x: number; y: number }, dx: number, dy: number, breakout?: boolean): { x: number; y: number } {
  const [lo, hi] = range(breakout);
  return { x: round3(clamp(start.x + dx / panel.width, lo, hi)), y: round3(clamp(start.y + dy / panel.height, lo, hi)) };
}
/** Resize the right edge: new w after a pointer delta in CSS px. */
export function dragWidth(panel: PxRect, startW: number, dx: number, x: number, breakout?: boolean): number {
  const max = breakout ? 1.3 : Math.max(0.05, 1 - x);
  return round3(clamp(startW + dx / panel.width, 0.05, max));
}
/** Tail point from an absolute document point. */
export function tailFromPoint(panel: PxRect, px: number, py: number): [number, number] {
  return [round3((px - panel.x) / panel.width), round3((py - panel.y) / panel.height)];
}
/** Page point of a tail given in panel fractions. */
export function tailToPoint(panel: PxRect, tail: [number, number]): { x: number; y: number } {
  return { x: panel.x + tail[0] * panel.width, y: panel.y + tail[1] * panel.height };
}

/** The geometry hook's result (site/public/scripts/comic-story.js geometry(), schemaVersion 1). */
export interface Geometry {
  schemaVersion: number;
  story: string;
  scene: string;
  beat: number;
  mode: string;
  viewport: { width: number; height: number; scrollX: number; scrollY: number };
  disposed: boolean;
  panels: { id: string; scene: string; panelIndex: number; imageId: string | null; rect: PxRect; visibleRect: PxRect }[];
  balloons: { id: string; panelId: string; scene: string; panelIndex: number; balloonIndex: number; kind: string; authoredWho: string; hostPanelId: string | null; rect: PxRect; visibleRect: PxRect }[];
}

// ---------------------------------------------------------------------------------------------------------------
// Three-way merge by field, for one balloon: base (when loaded), mine (edited), theirs (on disk now).
// ---------------------------------------------------------------------------------------------------------------
export interface FieldConflict { field: string; base: unknown; mine: unknown; theirs: unknown }
const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);
export function threeWay(base: Record<string, unknown>, mine: Record<string, unknown>, theirs: Record<string, unknown>): { merged: Record<string, unknown>; conflicts: FieldConflict[] } {
  const merged: Record<string, unknown> = {};
  const conflicts: FieldConflict[] = [];
  const keys = [...new Set([...Object.keys(theirs), ...Object.keys(mine), ...Object.keys(base)])];
  for (const k of keys) {
    const b = base[k], m = mine[k], t = theirs[k];
    let pick: unknown;
    if (same(m, t)) pick = m;
    else if (same(b, m)) pick = t;
    else if (same(b, t)) pick = m;
    else {
      conflicts.push({ field: k, base: b, mine: m, theirs: t });
      pick = t;
    }
    if (pick !== undefined) merged[k] = pick;
  }
  return { merged, conflicts };
}

/** Fields of `mine` that differ from `base`, as an edit patch (null removes a key). Timing and speech are skipped. */
export function diffPatch(base: Record<string, unknown>, mine: Record<string, unknown>): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const k of new Set([...Object.keys(base), ...Object.keys(mine)])) {
    if (k === 'at' || k === 'speech') continue;
    if (!same(base[k], mine[k])) patch[k] = mine[k] === undefined ? null : mine[k];
  }
  return patch;
}

/** Default balloon for Insert: a narration caption near the top left of the panel. */
export const newBalloon = (): BalloonData => ({ kind: 'caption', state: 'narration', who: 'narrator', text: 'New line', x: 0.08, y: 0.08, w: 0.34 });
