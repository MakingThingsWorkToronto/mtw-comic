// One comic box as the reader plays it: balloons with their placement and timing, the box's effects, room and motion.
// Read-only and pure: the story file is parsed as data (the retime(...) JSON literal), never executed.
import { locateRetimeSpan, sha256 } from '../editor/storyFile';

export interface BoxSfx { kind: string; delay: number; gain: number }
export interface BoxBalloon {
  index: number;
  /** Speech-review id, `<story>-<scene>-<img>-b<n>`. */
  id: string;
  kind: string;
  state: string;
  who: string;
  text: string;
  x: number;
  y: number;
  w: number;
  tail: [number, number] | null;
  /** Beats after the box reveals that the balloon letters in (the reader uses max(panel.at, balloon.at)). */
  delay: number;
  /** A character-introduction or scene-setup caption (the reader fills these teal). */
  intro: boolean;
  /** Captions and place labels stack in a corner of the box (reader: placeCaption); null for balloons. */
  corner: 'tl' | 'tr' | 'bl' | 'br' | null;
}
export interface BoxView {
  story: string;
  scene: string;
  img: string;
  panelIndex: number;
  /** Hash of the whole story file: the compare-and-swap base for an editor save. */
  hash: string;
  bpm: number;
  /** The box's reveal, in scene beats (the reader's ?scene=&beat=). */
  at: number;
  /** Beats from this box's reveal to the next box (or the scene's end). */
  length: number;
  alt: string;
  /** Layout box on the page and the art region it shows, as page fractions [x, y, w, h] (reader: placeCrops). */
  r: [number, number, number, number] | null;
  ar: [number, number, number, number] | null;
  /** Desktop crop focus [fx, fy] (default centre) and the art inset in percent of the short side (default 0.8). */
  focus: [number, number];
  insetPct: number;
  room: string | null;
  motion: { preset: string; layered: boolean };
  sfx: BoxSfx[];
  balloons: BoxBalloon[];
}

type Json = Record<string, unknown>;
const num = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const str = (v: unknown, d = ''): string => (typeof v === 'string' ? v : d);

const rect = (v: unknown): [number, number, number, number] | null => (Array.isArray(v) && v.length === 4 && v.every((n) => typeof n === 'number' && Number.isFinite(n)) ? (v as [number, number, number, number]) : null);
const pair = (v: unknown): [number, number] | null => (Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === 'number' && Number.isFinite(n)) ? (v as [number, number]) : null);

/** Pure: the reader's corner for a caption or place label (placeCaption), null for anything lettered in a balloon. */
export function captionCorner(b: Record<string, unknown>): BoxBalloon['corner'] {
  if ((b.kind !== 'caption' && b.kind !== 'place') || b.anchor === 'free') return null;
  const x = num(b.x, 0), y = num(b.y, 0), w = num(b.w, 0.3);
  const setup = b.sceneSetup === true;
  const right = setup || (x + w > 0.9 && x > 0.35);
  const bottom = setup || y > 0.6 || b.edge === 'bottom';
  return `${bottom ? 'b' : 't'}${right ? 'r' : 'l'}`;
}

export class BoxError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

/** Pure: the box `img` of scene `sceneId` in story `storyId`, from the story file text. */
export function boxFromStory(text: string, storyId: string, sceneId: string, img: string): BoxView {
  const span = locateRetimeSpan(text);
  if (!span) throw new BoxError(422, 'this story file is not a retime({...}) JSON literal');
  const story = JSON.parse(text.slice(span.start, span.end)) as Json;
  const scenes = Array.isArray(story.scenes) ? (story.scenes as Json[]) : [];
  const scene = scenes.find((s) => s.id === sceneId);
  if (!scene) throw new BoxError(404, `no scene ${sceneId}`);
  const panels = Array.isArray(scene.panels) ? (scene.panels as Json[]) : [];
  const panelIndex = panels.findIndex((p) => p.img === img);
  const panel = panels[panelIndex];
  if (!panel) throw new BoxError(404, `no box ${sceneId}/${img}`);
  const at = num(panel.at, 0);
  const later = panels.map((p) => num(p.at, 0)).filter((a) => a > at);
  const end = later.length ? Math.min(...later) : num(scene.l, at + 8);
  const motion = (panel.motion ?? {}) as Json;
  const balloons = (Array.isArray(panel.balloons) ? (panel.balloons as Json[]) : []).map((b, index): BoxBalloon => ({
    index,
    id: `${storyId}-${sceneId}-${img}-b${index + 1}`,
    kind: str(b.kind, 'speech'),
    state: str(b.state),
    who: str(b.who),
    text: str(b.text),
    x: num(b.x, 0.05),
    y: num(b.y, 0.05),
    w: num(b.w, 0.34),
    tail: Array.isArray(b.tail) && b.tail.length === 2 ? (b.tail as [number, number]) : null,
    delay: Math.max(0, num(b.at, at) - at),
    intro: b.characterIntro === true || b.sceneSetup === true,
    corner: captionCorner(b),
  }));
  return {
    story: storyId,
    scene: sceneId,
    img,
    panelIndex,
    hash: sha256(text),
    bpm: num(story.bpm, 90),
    at,
    length: Math.max(1, end - at),
    alt: str(panel.alt),
    r: rect(panel.r),
    ar: rect(panel.ar) ?? rect(panel.r),
    focus: pair((panel.cropFocus as Json | undefined)?.page) ?? [0.5, 0.5],
    insetPct: num(scene.artCropInsetPct, 0.8),
    room: typeof panel.room === 'string' ? panel.room : typeof scene.room === 'string' ? scene.room : null,
    motion: { preset: str(motion.preset, 'still'), layered: Array.isArray(panel.layerMotion) && panel.layerMotion.length > 0 },
    sfx: (Array.isArray(panel.sfx) ? (panel.sfx as Json[]) : []).map((f) => ({ kind: str(f.kind), delay: num(f.delay, 0), gain: num(f.gain, 0.7) })).filter((f) => f.kind),
    balloons,
  };
}

/** Pure: a short, single-line summary of the box for the feedback procedure's parameters. */
export function boxSummary(box: BoxView): { balloons: string; sound: string } {
  const one = (s: string) => s.replace(/\s+/g, ' ').trim();
  return {
    balloons: box.balloons.map((b) => `b${b.index + 1} ${b.kind}/${b.who}: "${one(b.text)}"`).join(' | ') || 'none',
    sound: [`room ${box.room ?? 'inherited'}`, `motion ${box.motion.preset}${box.motion.layered ? ' + layer motion' : ''}`, `sfx ${box.sfx.map((f) => `${f.kind}@${f.delay}b`).join(', ') || 'none'}`].join('; '),
  };
}
