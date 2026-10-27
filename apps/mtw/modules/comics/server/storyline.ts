// The raw storyline of one issue, read from its story file for the Story tab: scenes, boxes and lines, words only.
// Story files are TypeScript wrappers around one JSON literal (`retime({ ... });`), the same shape scripts/comics/lib/story.mjs reads.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

type Json = Record<string, unknown>;
export interface StorylineBalloon { index: number; who: string; kind: string; state: string | null; text: string; sceneSetup: boolean; characterIntro: boolean }
export interface StorylineBox { index: number; img: string; alt: string; r: number[] | null; balloons: StorylineBalloon[]; sfx: string[]; room: string | null; hasArt: boolean }
export interface StorylineScene { id: string; title: string | null; place: string | null; score: number | null; room: string | null; villains: string[]; boxes: StorylineBox[] }
export interface Storyline { id: string; file: string; sha256: string; issue: number | null; title: string | null; scenes: StorylineScene[]; counts: { scenes: number; boxes: number; lines: number }; next: { heading: string | null; choices: string[] } }

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

export function storyFileFor(repoRoot: string, id: string): string {
  return path.join(repoRoot, 'site', 'src', 'data', 'comic-stories', `${id}.ts`);
}

export async function readStoryline(repoRoot: string, id: string): Promise<Storyline> {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error('bad story id');
  const file = storyFileFor(repoRoot, id);
  const text = await fs.readFile(file, 'utf8');
  const open = text.indexOf('retime(');
  const close = text.lastIndexOf('});');
  if (open < 0 || close <= open) throw new Error(`${path.basename(file)}: expected retime({ ... });`);
  const story = JSON.parse(text.slice(open + 'retime('.length, close + 1)) as Json;
  const scenes = (Array.isArray(story.scenes) ? (story.scenes as Json[]) : []).map((sc): StorylineScene => {
    const boxes = (Array.isArray(sc.panels) ? (sc.panels as Json[]) : []).map((p, index): StorylineBox => ({
      index,
      img: str(p.img) || str(p.id) || `box-${index + 1}`,
      alt: str(p.alt),
      r: Array.isArray(p.r) ? (p.r as number[]) : null,
      balloons: (Array.isArray(p.balloons) ? (p.balloons as Json[]) : []).map((b, bi): StorylineBalloon => ({
        index: bi, who: str(b.who), kind: str(b.kind), state: typeof b.state === 'string' ? b.state : null, text: str(b.text), sceneSetup: b.sceneSetup === true, characterIntro: b.characterIntro === true,
      })),
      sfx: (Array.isArray(p.sfx) ? (p.sfx as Json[]) : []).map((s) => str(s.kind)).filter(Boolean),
      room: typeof p.room === 'string' ? p.room : null,
      hasArt: Boolean(p.staticArt || p.views || p.img && sc.art),
    }));
    const place = boxes[0]?.balloons.find((b) => b.kind === 'place')?.text ?? null;
    return { id: str(sc.id), title: typeof sc.title === 'string' ? sc.title : null, place, score: typeof sc.score === 'number' ? sc.score : null, room: typeof sc.room === 'string' ? sc.room : null, villains: Array.isArray(sc.villains) ? (sc.villains as string[]) : [], boxes };
  });
  const next = (story.next ?? {}) as Json;
  return {
    id: str(story.id) || id,
    file: path.relative(repoRoot, file).replaceAll('\\', '/'),
    sha256: createHash('sha256').update(text).digest('hex'),
    issue: typeof story.issue === 'number' ? story.issue : null,
    title: typeof story.title === 'string' ? story.title : null,
    scenes,
    counts: { scenes: scenes.length, boxes: scenes.reduce((n, s) => n + s.boxes.length, 0), lines: scenes.reduce((n, s) => n + s.boxes.reduce((m, b) => m + b.balloons.length, 0), 0) },
    next: { heading: typeof next.heading === 'string' ? next.heading : null, choices: (Array.isArray(next.choices) ? (next.choices as Json[]) : []).map((c) => str(c.label)) },
  };
}
