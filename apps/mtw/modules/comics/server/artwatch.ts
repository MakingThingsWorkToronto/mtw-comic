// What art files exist for each scene of an issue, so the views can notice a newer or changed file. Read-only.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { SceneArt } from './stories';

export interface ArtFile {
  /** Repo-relative path. */
  path: string;
  mtime: number;
  /** Version number from a `-vN` suffix; null for an unversioned file. */
  version: number | null;
  kind: 'site' | 'canonical';
}
export interface SceneArtStatus {
  id: string;
  /** The scene's art base from the story (`/comic/<issue>/<name>`), or null. */
  art: string | null;
  files: ArtFile[];
}
export interface ArtStatus {
  story: { path: string; mtime: number } | null;
  scenes: SceneArtStatus[];
}

const CANON_ROOT = 'wiki/image-library/assets/scenes/comic-b';
const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Pure: split `home-quote-20261010-device-v2` into its family (`home-quote-20261010-device`) and version (2); no suffix means version null. */
export function parseArtStem(stem: string): { family: string; version: number | null } {
  const m = /^(.*)-v(\d+)$/.exec(stem);
  return m ? { family: m[1] as string, version: Number(m[2]) } : { family: stem, version: null };
}

/** Pure: the art base's file stem, or null when it is not a `/comic/<issue>/<name>` path. */
export function artStem(art: string | null | undefined): string | null {
  const m = /^\/comic\/[a-z0-9-]+\/([\w.-]+)$/i.exec(art ?? '');
  return m ? (m[1] as string) : null;
}

/**
 * Pure: which of `names` belong to the art family. Site copies are `<stem>-<width>.(webp|avif)`, with the version inside
 * the stem; canonical masters are `<family>-vN.(png|webp|jpg)`. Returns the matching names with their version.
 */
export function matchFamily(family: string, names: string[], kind: 'site' | 'canonical'): { name: string; version: number | null }[] {
  const re = kind === 'site' ? new RegExp(`^${esc(family)}(?:-v(\\d+))?-\\d+\\.(?:webp|avif)$`, 'i') : new RegExp(`^${esc(family)}-v(\\d+)\\.(?:png|webp|jpe?g)$`, 'i');
  const out: { name: string; version: number | null }[] = [];
  for (const name of names) {
    const m = re.exec(name);
    if (m) out.push({ name, version: m[1] ? Number(m[1]) : null });
  }
  return out;
}

async function mtimeOf(abs: string): Promise<number | null> {
  try {
    return (await fs.stat(abs)).mtimeMs;
  } catch {
    return null;
  }
}

async function listCanonical(repoRoot: string): Promise<string[]> {
  try {
    const all = (await fs.readdir(path.join(repoRoot, CANON_ROOT), { recursive: true })) as string[];
    return all.map((p) => p.split(path.sep).join('/'));
  } catch {
    return [];
  }
}

export async function artStatus(repoRoot: string, storyPath: string | null, scenes: SceneArt[]): Promise<ArtStatus> {
  const canonical = await listCanonical(repoRoot);
  const siteDirs = new Map<string, string[]>();
  const siteNames = async (dir: string): Promise<string[]> => {
    if (!siteDirs.has(dir)) siteDirs.set(dir, await fs.readdir(path.join(repoRoot, 'site', 'public', 'comic', dir)).catch(() => []));
    return siteDirs.get(dir) ?? [];
  };
  const out: SceneArtStatus[] = [];
  for (const scene of scenes) {
    const stem = artStem(scene.art);
    const files: ArtFile[] = [];
    // Selected native planes and responsive cuts often use deep versioned paths,
    // outside the old flat scene-art family. Watch the actual Studio bindings too.
    const selected = new Set<string>();
    const collect = (value: unknown): void => {
      if (!value || typeof value !== 'object') return;
      const source = value as { src?: string; canonicalSource?: { path?: string }; phone?: unknown; views?: unknown[]; layers?: unknown[] };
      if (source.src?.startsWith('/api/comics/media?')) {
        const rel = new URL(source.src, 'http://studio.local').searchParams.get('path');
        if (rel && /^(site\/public\/comic\/|wiki\/image-library\/assets\/)/.test(rel) && !rel.includes('\\') && !rel.split('/').some(part => !part || part === '.' || part === '..')) selected.add(rel);
      }
      const canonical = source.canonicalSource?.path;
      if (canonical?.startsWith('wiki/image-library/assets/') && !canonical.includes('\\') && !canonical.split('/').some(part => !part || part === '.' || part === '..')) selected.add(canonical);
      collect(source.phone);
      for (const view of source.views ?? []) collect(view);
      for (const layer of source.layers ?? []) collect(layer);
    };
    for (const panel of scene.panels ?? []) collect(panel);
    for (const rel of selected) {
      const m = await mtimeOf(path.join(repoRoot, rel));
      if (m !== null) files.push({ path: rel, mtime: m, version: Number(/\/v(\d+)\//.exec(rel)?.[1]) || null, kind: rel.startsWith('site/') ? 'site' : 'canonical' });
    }
    if (stem && scene.art) {
      const { family } = parseArtStem(stem);
      const dir = scene.art.split('/')[2] as string;
      for (const hit of matchFamily(family, await siteNames(dir), 'site')) {
        const rel = `site/public/comic/${dir}/${hit.name}`;
        const m = await mtimeOf(path.join(repoRoot, rel));
        if (m !== null) files.push({ path: rel, mtime: m, version: hit.version, kind: 'site' });
      }
      for (const hit of matchFamily(family, canonical.map((p) => path.posix.basename(p)), 'canonical')) {
        const rel = canonical.find((p) => path.posix.basename(p) === hit.name);
        const full = rel ? `${CANON_ROOT}/${rel}` : null;
        const m = full ? await mtimeOf(path.join(repoRoot, full)) : null;
        if (full && m !== null) files.push({ path: full, mtime: m, version: hit.version, kind: 'canonical' });
      }
    }
    out.push({ id: scene.id, art: scene.art ?? null, files: files.filter((file, index) => files.findIndex(other => other.path === file.path) === index) });
  }
  const story = storyPath ? { path: storyPath, mtime: (await mtimeOf(path.join(repoRoot, storyPath))) ?? 0 } : null;
  return { story, scenes: out };
}
