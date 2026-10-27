// One memoized stat-only walk of the canonical libraries and site/public, shared by the asset-health providers.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Vertical } from '../types';
import { ASSET_EXT, mapLimit } from './context';
import type { ProviderContext } from './context';

export interface LibraryDef {
  id: Vertical;
  label: string;
  root: string;
}

export const LIBRARIES: LibraryDef[] = [
  { id: 'images', label: 'Images', root: 'wiki/image-library' },
  { id: 'audio', label: 'Audio', root: 'wiki/soundtrack-library' },
  { id: 'comics', label: 'Comics', root: 'wiki/comics-library' },
  { id: 'journal', label: 'Journal', root: 'wiki/journal' },
  { id: 'site', label: 'Site', root: 'site/public' },
];

export interface AssetFile {
  rel: string;
  abs: string;
  size: number;
  mtimeMs: number;
  lib: Vertical;
}

const SKIP = new Set(['node_modules', '.git']);

async function walkDir(ctx: ProviderContext, lib: LibraryDef): Promise<AssetFile[]> {
  const out: AssetFile[] = [];
  let pending = [lib.root];
  while (pending.length > 0) {
    const batch = pending;
    pending = [];
    const listed = await mapLimit(batch, 16, async (rel) => {
      try {
        return { rel, entries: await fs.readdir(path.join(ctx.repoRoot, rel), { withFileTypes: true }) };
      } catch {
        return { rel, entries: [] };
      }
    });
    const files: string[] = [];
    for (const { rel, entries } of listed) {
      for (const e of entries) {
        const child = `${rel}/${e.name}`;
        if (e.isDirectory()) {
          if (!SKIP.has(e.name)) pending.push(child);
        } else if (e.isFile() && ASSET_EXT.test(e.name)) files.push(child);
      }
    }
    const stats = await mapLimit(files, 32, async (rel): Promise<AssetFile | null> => {
      try {
        const abs = path.join(ctx.repoRoot, rel);
        const st = await fs.stat(abs);
        return { rel, abs, size: st.size, mtimeMs: st.mtimeMs, lib: lib.id };
      } catch {
        return null;
      }
    });
    for (const s of stats) if (s) out.push(s);
  }
  return out;
}

/** Every media file in the canonical libraries and site/public, stat only. */
export function assetIndex(ctx: ProviderContext): Promise<AssetFile[]> {
  return ctx.memo('asset-index', async () => (await Promise.all(LIBRARIES.map((l) => walkDir(ctx, l)))).flat());
}

export const libOf = (id: Vertical): LibraryDef => LIBRARIES.find((l) => l.id === id) as LibraryDef;

/** Identity of a picture across versions, sizes, build dates and device tags: foo-page-20261009-device-v3-1600.avif -> foo-page. */
export function stemKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, '')
    .replace(/-(1600|2400|3200)$/, '')
    .replace(/-v\d+(-print)?$/, '')
    .replace(/-\d{8}(?=-|$)/, '')
    .replace(/-device$/, '');
}

export const baseName = (rel: string): string => rel.slice(rel.lastIndexOf('/') + 1);
