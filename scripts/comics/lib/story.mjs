// Comic build framework (skill: mtw-comic-story; protocol: scripts/comics/README.md).
// Loads and saves a Comic B story file. Story files are TypeScript wrappers around one JSON literal:
//   export const xComic: ComicStory = retime({ ...json... });
// Everything before "retime(" and after the closing "});" is preserved byte for byte, so a save is a data edit only.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..', '..');
export const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
export const sha256File = (file) => sha256(fs.readFileSync(file));
/** Story file for a story id (agentic) or a registry slug (agentic-systems), resolved through index.ts. */
export function storyPathFor(slug) {
  const dir = path.join(REPO, 'site', 'src', 'data', 'comic-stories');
  const direct = path.join(dir, `${slug}.ts`);
  if (fs.existsSync(direct)) return direct;
  const index = fs.readFileSync(path.join(dir, 'index.ts'), 'utf8');
  const entry = index.split('\n').find((l) => l.includes(`slug: '${slug}'`));
  const name = entry && entry.match(/story:\s*([A-Za-z0-9_]+)/)?.[1];
  const imp = name && index.match(new RegExp(`import \\{ ${name} \\} from '\\./([a-z0-9-]+)'`))?.[1];
  return imp ? path.join(dir, `${imp}.ts`) : direct;
}

/** Read a story file: { file, head, tail, story, fileSha256, storySha256 }. storySha256 hashes the canonical JSON. */
export function loadStory(file) {
  const text = fs.readFileSync(file, 'utf8');
  const open = text.indexOf('retime(');
  if (open < 0) throw new Error(`${file}: expected "retime({ ...JSON... });"`);
  const start = open + 'retime('.length;
  const close = text.lastIndexOf('});');
  if (close <= start) throw new Error(`${file}: expected closing "});"`);
  const json = text.slice(start, close + 1);
  const story = JSON.parse(json);
  return { file, head: text.slice(0, start), tail: text.slice(close + 1), story, fileSha256: sha256(text), storySha256: storyHash(story) };
}

/** Canonical hash of story data (stable key order, no whitespace), independent of file formatting. */
export function storyHash(story) {
  return sha256(JSON.stringify(sortKeys(story)));
}
export function sortKeys(v) {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])]));
  return v;
}

/** Save by compare-and-swap: refuses when the file changed since it was loaded (another writer). */
export function saveStory(loaded, story = loaded.story) {
  const current = fs.readFileSync(loaded.file, 'utf8');
  if (sha256(current) !== loaded.fileSha256) throw new Error(`${loaded.file}: changed since load; reload and retry`);
  const text = loaded.head + JSON.stringify(story, null, 2) + loaded.tail;
  fs.writeFileSync(loaded.file, text);
  loaded.fileSha256 = sha256(text);
  loaded.story = story;
  loaded.storySha256 = storyHash(story);
  return loaded;
}

/** Every box with its scene, in reading order. */
export function panels(story) {
  const out = [];
  story.scenes.forEach((scene, si) => scene.panels.forEach((panel, pi) => out.push({ scene, panel, si, pi, img: panel.img ?? panel.id ?? `${scene.id}:box-${pi}` })));
  return out;
}
export function findPanel(story, sceneId, img) {
  const scene = story.scenes.find((s) => s.id === sceneId);
  if (!scene) throw new Error(`scene ${sceneId} not found`);
  const panel = scene.panels.find((p) => (p.img ?? p.id) === img);
  if (!panel) throw new Error(`box ${img} not found in scene ${sceneId}`);
  return { scene, panel };
}

/** Desktop box aspect (width/height) of r authored on a 16:9 page. */
export const boxAspect = (r) => (r[2] * 16) / (r[3] * 9);
/** Native canvas the image tool is asked for, from the box aspect (landscape 3:2, square, portrait 2:3). */
export function canvasFor(r) {
  const a = boxAspect(r);
  return a >= 1.25 ? { size: '1536x1024', words: 'landscape canvas 3:2', w: 1536, h: 1024 } : a >= 0.8 ? { size: '1024x1024', words: 'square canvas', w: 1024, h: 1024 } : { size: '1024x1536', words: 'portrait canvas 2:3', w: 1024, h: 1536 };
}

/** A layout signature for a scene: rounded box rects in reading order, so two scenes with the same geometry match. */
export function layoutSignature(scene) {
  const q = (n) => Math.round(n * 20) / 20;
  return scene.panels.filter((p) => !p.host).map((p) => p.r.map(q).join(',')).join('|');
}

export const rel = (file) => path.relative(REPO, file).replaceAll('\\', '/');
export const abs = (file) => (path.isAbsolute(file) ? file : path.join(REPO, file));
