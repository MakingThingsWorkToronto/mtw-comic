// Panel geometry for the review views, read from the story sources (site/src/data/comic-stories/<id>.ts), read-only.
// The library projection carries text and ids but not the art path or the panel crop (`ar`), so the story source is read.
import { existsSync, promises as fs } from 'node:fs';
import path from 'node:path';
import { mediaUrl } from './library';

export type Rect = [number, number, number, number];
export interface CanonicalArtSource { path: string; sha256?: string; recordId?: string; treatment?: string; panelId?: string; [key: string]: unknown }
export interface PanelLayerPlacement { sourceROI: Rect; slot: Rect; fit: 'contain'; speakerIds?: string[] }
export interface PanelArtLayer { id: string; role?: string; src: string; crop: Rect; r?: Rect; opacity: number; canonicalSource?: CanonicalArtSource; agentPlacement?: PanelLayerPlacement; propPlacement?: PanelLayerPlacement }
export interface PanelPresentation { src: string | null; crop: Rect | null; fit?: string; media?: 'desktop' | 'phone'; canonicalSource?: CanonicalArtSource; layers?: PanelArtLayer[] }
export interface PanelArt {
  index: number;
  img: string;
  alt: string;
  /** Region of the scene page art, as fractions [x, y, w, h]; falls back to the layout rect `r`. */
  crop: Rect | null;
  src?: string | null;
  canonicalSource?: CanonicalArtSource;
  layers?: PanelArtLayer[];
  phone?: PanelPresentation;
  views?: (PanelPresentation & { id?: string; at: number })[];
}
export interface SceneArt {
  id: string;
  /** The scene's art base from the story (`/comic/<issue>/<name>`), or null. */
  art: string | null;
  /** Page art served through the media route (the 1600 px webp; copies stop at the master's width), or null when the file is missing. */
  thumb: string | null;
  full: string | null;
  panels: PanelArt[];
}

const isRect = (v: unknown): v is Rect => Array.isArray(v) && v.length === 4 && v.every((n) => typeof n === 'number' && Number.isFinite(n));

export interface RawArtSource { src?: string; alternates?: string[]; ar?: Rect; fit?: string; canonicalSource?: CanonicalArtSource; phone?: RawArtSource }
export interface RawLayerPlacement extends PanelLayerPlacement { phone?: PanelLayerPlacement }
export interface RawArtLayer extends RawArtSource { id: string; role?: string; r?: Rect; opacity?: number; agentPlacement?: RawLayerPlacement; propPlacement?: RawLayerPlacement }
export interface RawArtView extends RawArtSource { id?: string; at: number; media?: 'desktop' | 'phone'; layers?: RawArtLayer[] }
export interface RawPanel {
  img: string; alt: string; ar?: Rect; r?: Rect;
  staticArt?: RawArtSource; views?: RawArtView[];
}
export interface RawScene {
  id: string;
  art?: string;
  panels: RawPanel[];
}

const RECT = { ar: /(?:^|[\s,{])ar:\s*\[([^\]]+)\]/, r: /(?:^|[\s,{])r:\s*\[([^\]]+)\]/ };
const rectOf = (line: string, key: 'ar' | 'r'): Rect | undefined => {
  const n = RECT[key].exec(line)?.[1]?.split(',').map(Number);
  return n && isRect(n) ? n : undefined;
};

const SCENES_START = /^\s*scenes:\s*\[/;
const SCENE_ID = /^\s*id:\s*"([^"]+)",?\s*$/;
const SCENE_ART = /^\s*art:\s*"([^"]+)"/;
const PANEL_LINE = /^\s*\{\s*at:\s*-?[\d.]+\s*,/;
const IMG = /\bimg:\s*"([^"]*)"/;
const ALT = /\balt:\s*"((?:[^"\\]|\\.)*)"/;

/**
 * Pure: read scene ids, page art paths and panel rectangles from a story source. The sources are generated one panel per
 * line (`{ at: 1, room: .., r: [..], ar: [..], img: "..", alt: ".." ...`), so this reads lines instead of executing site
 * code. Tests compare the result with the library's own scene and panel counts.
 */
export function parseStorySource(text: string): RawScene[] {
  const lined = parseStoryLines(text);
  return lined.length ? lined : parseStoryLiteral(text);
}

/**
 * Pure: the generated form (home.ts) is one pretty-printed JSON literal passed to `retime(...)`. Parse that literal as data
 * (never executed); any other shape yields no scenes.
 */
export function parseStoryLiteral(text: string): RawScene[] {
  const open = text.indexOf('retime(');
  const close = text.lastIndexOf(')');
  if (open < 0 || close <= open) return [];
  let story: unknown;
  try {
    story = JSON.parse(text.slice(open + 'retime('.length, close));
  } catch {
    return [];
  }
  const list = (story as { scenes?: unknown })?.scenes;
  if (!Array.isArray(list)) return [];
  const scenes: RawScene[] = [];
  for (const raw of list as Record<string, unknown>[]) {
    if (!raw || typeof raw.id !== 'string' || !Array.isArray(raw.panels)) continue;
    const scene: RawScene = { id: raw.id, panels: [] };
    if (typeof raw.art === 'string') scene.art = raw.art;
    for (const p of raw.panels as Record<string, unknown>[]) {
      scene.panels.push({
        img: typeof p.img === 'string' ? p.img : '',
        alt: typeof p.alt === 'string' ? p.alt : '',
        ...(isRect(p.ar) ? { ar: p.ar } : {}),
        ...(isRect(p.r) ? { r: p.r } : {}),
        ...(p.staticArt && typeof p.staticArt === 'object' ? { staticArt: p.staticArt as RawArtSource } : {}),
        ...(Array.isArray(p.views) ? { views: p.views as RawArtView[] } : {}),
      });
    }
    scenes.push(scene);
  }
  return scenes;
}

function parseStoryLines(text: string): RawScene[] {
  const scenes: RawScene[] = [];
  let inScenes = false;
  for (const line of text.split(/\r?\n/)) {
    if (!inScenes) {
      inScenes = SCENES_START.test(line);
      continue;
    }
    const id = SCENE_ID.exec(line);
    if (id) {
      scenes.push({ id: id[1] as string, panels: [] });
      continue;
    }
    const scene = scenes[scenes.length - 1];
    if (!scene) continue;
    const art = SCENE_ART.exec(line);
    if (art) {
      scene.art = art[1] as string;
    } else if (PANEL_LINE.test(line)) {
      const ar = rectOf(line, 'ar');
      const r = rectOf(line, 'r');
      scene.panels.push({
        img: IMG.exec(line)?.[1] ?? '',
        alt: (ALT.exec(line)?.[1] ?? '').split('\\"').join('"'),
        ...(ar ? { ar } : {}),
        ...(r ? { r } : {}),
      });
    }
  }
  return scenes;
}

// Nested folders are allowed (the site ships live art under e.g. /comic/agentic/live-20261010/); no segment may start with a dot.
const ART_PATH = /^\/comic\/[a-z0-9-]+(?:\/[\w-][\w.-]*)+$/i;

/** Pure: parsed scenes to scene art. `exists` decides whether a public file is on disk. */
export function sceneArt(scenes: RawScene[], exists: (publicPath: string) => boolean): SceneArt[] {
  const sourceUrl = (source: RawArtSource): string | null => {
    for (const src of [source.src, ...(source.alternates ?? [])]) {
      if (typeof src !== 'string' || !ART_PATH.test(src) || !/\.(png|webp|avif|jpe?g)$/i.test(src)) continue;
      const file = 'site/public' + src;
      if (exists(file)) return mediaUrl(file) ?? null;
    }
    const canonical = source.canonicalSource?.path;
    return typeof canonical === 'string' && /^wiki\/image-library\/assets\/(?:[\w-][\w.-]*\/)*[\w-][\w.-]*\.(png|webp|avif|jpe?g)$/i.test(canonical) && exists(canonical) ? mediaUrl(canonical) ?? null : null;
  };
  const presentation = (source: RawArtView, fallbackCrop: Rect, phone = false): PanelPresentation => {
    const selected = phone ? { ...source, ...source.phone } : source;
    const crop = isRect(selected.ar) ? selected.ar : fallbackCrop;
    const layers = (source.layers ?? []).flatMap(layer => {
      const selectedLayer = phone ? { ...layer, ...layer.phone } : layer;
      const src = sourceUrl(selectedLayer);
      const authored = layer.role === 'agents' ? layer.agentPlacement : layer.role === 'props' || layer.role === 'light' ? layer.propPlacement : undefined;
      const placement = phone && authored?.phone ? authored.phone : authored;
      const independent = placement && placement.fit === 'contain' && isRect(placement.sourceROI) && isRect(placement.slot)
        ? { sourceROI: placement.sourceROI, slot: placement.slot, fit: 'contain' as const, ...(placement.speakerIds ? { speakerIds: placement.speakerIds } : {}) } : undefined;
      return src ? [{ id: layer.id, role: layer.role, src, crop: independent?.sourceROI ?? (isRect(selectedLayer.ar) ? selectedLayer.ar : crop),
        ...(isRect(layer.r) ? { r: layer.r } : {}), opacity: typeof layer.opacity === 'number' ? layer.opacity : 1,
        ...(independent ? layer.role === 'agents' ? { agentPlacement: independent } : { propPlacement: independent } : {}),
        ...(selectedLayer.canonicalSource ? { canonicalSource: selectedLayer.canonicalSource } : {}) }] : [];
    });
    return { src: sourceUrl(selected), crop, ...(selected.fit ? { fit: selected.fit } : {}), ...(source.media ? { media: source.media } : {}),
      ...(selected.canonicalSource ? { canonicalSource: selected.canonicalSource } : {}), ...(layers.length ? { layers } : {}) };
  };
  return scenes.map((s) => {
    const pick = (size: number): string | null => {
      if (!s.art || !ART_PATH.test(s.art)) return null;
      const file = `site/public${s.art}-${size}.webp`;
      return exists(file) ? (mediaUrl(file) ?? null) : null;
    };
    return {
      id: s.id,
      art: s.art && ART_PATH.test(s.art) ? s.art : null,
      thumb: pick(1600),
      full: pick(1600),
      panels: s.panels.map((p, index) => {
        const selected = p.views?.find(v => v.at === 0 && v.media !== 'phone') ?? p.staticArt ?? p.views?.find(v => v.media !== 'phone') ?? p.views?.[0];
        if (!selected) return { index, img: p.img, alt: p.alt, src: pick(1600), crop: p.ar ?? p.r ?? null };
        const full: Rect = [0, 0, 1, 1];
        return { index, img: p.img, alt: p.alt, ...presentation(selected as RawArtView, full),
          phone: presentation(p.views?.find(v => v.at === 0 && v.media === 'phone') ?? selected as RawArtView, full, true),
          ...(p.views?.length ? { views: p.views.map(v => ({ ...presentation(v, full), id: v.id, at: v.at })) } : {}) };
      }),
    };
  });
}

const STORY_PATH = /^site\/src\/data\/comic-stories\/[a-z0-9-]+\.ts$/;

export class StoryArt {
  private cache = new Map<string, { mtime: number; scenes: RawScene[] }>();
  constructor(private repoRoot: string) {}

  async scenes(storyPath: string): Promise<SceneArt[]> {
    if (!STORY_PATH.test(storyPath)) return [];
    const abs = path.join(this.repoRoot, storyPath);
    try {
      const mtime = (await fs.stat(abs)).mtimeMs;
      const hit = this.cache.get(storyPath);
      const exists = (p: string) => existsSync(path.join(this.repoRoot, p));
      if (hit && hit.mtime === mtime) return sceneArt(hit.scenes, exists);
      const scenes = parseStorySource(await fs.readFile(abs, 'utf8'));
      this.cache.set(storyPath, { mtime, scenes });
      return sceneArt(scenes, exists);
    } catch {
      return []; // art is an enhancement; the review still works from the text
    }
  }
}
