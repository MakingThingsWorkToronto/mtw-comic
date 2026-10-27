import { promises as fs } from 'node:fs';
import path from 'node:path';
import { canonicalAudioPath, mediaUrl } from './library';
import type { ImageAsset } from './library';

/**
 * A character's reference slot (wiki/site/comics-library.md, "Character reference slots"): one canonical folder and file
 * stem, `<stem>-v<N>.<ext>`, where every model sheet for the character is saved as the next unused N. The catalog
 * registers one version as the record's current treatment; that version is what stories and generation use.
 */
export const SLOT_DIR = 'wiki/image-library/assets/scenes/comic-b/models';
const VERSIONED = /^(.*)-v(\d+)\.(png|jpe?g|webp|avif)$/i;

export interface SlotVersion {
  version: number;
  path: string;
  preview: string;
  savedAt: string;
  /** The catalog's current treatment for the character's record: what stories and image generation use. */
  registered: boolean;
  /** Author review from `records/<record>/<style>/v<N>/reference-review.json`, when the run wrote one. */
  observations: string[];
  unresolved: string[];
}

export interface ReferenceSlot {
  dir: string;
  stem: string;
  recordId: string | null;
  /** Newest first. */
  versions: SlotVersion[];
  registeredVersion: number | null;
}

const list = (x: unknown): string[] => (Array.isArray(x) ? x.filter((s): s is string => typeof s === 'string') : []);

/** The slot of a character: its registered sheet's folder and stem, or `<id>-dedicated` in the models folder. */
export async function referenceSlot(repoRoot: string, characterId: string, model: ImageAsset | null): Promise<ReferenceSlot> {
  const current = model?.path ? canonicalAudioPath(model.path) : null;
  const m = current ? VERSIONED.exec(path.posix.basename(current)) : null;
  const dir = current && m ? path.posix.dirname(current) : SLOT_DIR;
  const stem = m?.[1] ?? `${characterId}-dedicated`;
  const registeredVersion = m ? Number(m[2]) : null;
  const names = await fs.readdir(path.join(repoRoot, dir)).catch(() => [] as string[]);
  const versions: SlotVersion[] = [];
  for (const name of names) {
    const v = VERSIONED.exec(name);
    if (!v || v[1] !== stem) continue;
    const rel = `${dir}/${name}`;
    const stat = await fs.stat(path.join(repoRoot, rel)).catch(() => null);
    if (!stat) continue;
    const review = model
      ? ((await fs
          .readFile(path.join(repoRoot, 'wiki', 'image-library', 'records', model.recordId, model.style, `v${v[2]}`, 'reference-review.json'), 'utf8')
          .then(JSON.parse)
          .catch(() => null)) as { observations?: unknown; unresolved?: unknown } | null)
      : null;
    versions.push({
      version: Number(v[2]),
      path: rel,
      preview: mediaUrl(rel)!,
      savedAt: stat.mtime.toISOString(),
      registered: rel === current,
      observations: list(review?.observations),
      unresolved: list(review?.unresolved),
    });
  }
  versions.sort((a, b) => b.version - a.version);
  return { dir, stem, recordId: model?.recordId ?? null, versions, registeredVersion };
}
