// Asset health, images: look-alikes. Catalogued images that look the same but are different bytes: re-saves, resizes,
// re-encodes and near-identical regenerations. Exact copies (same sha256) are the duplicates provider's.
// Two images look alike when their 64-bit difference hash (9x8 greyscale) differs in at most `bits` bits and their aspect
// ratios agree. One image per group stays: everything selected, approved, used by the site or named by a wiki page;
// otherwise the largest, then newest file. Fingerprints are cached by (path, size, mtime) in .state/storage/fingerprints.json.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import type { SkippedFile } from '../types';
import { buildEntries, dropReferenced, IMAGE_LIB, loadImageManifest, mapLimit } from './context';
import type { Candidate, ProviderContext, ReductionProvider } from './context';

const RASTER = /\.(png|jpe?g|webp|avif)$/i;
const DEFAULT_BITS = 4;
const ASPECT_TOLERANCE = 0.02;
const keepStatus = (s?: string): boolean => /^(selected|user-approved)/i.test(s ?? '');

export interface Fingerprint {
  size: number;
  mtimeMs: number;
  /** 16 hex digits, or '' when the image has no structure to compare (flat colour). */
  dhash: string;
  width: number;
  height: number;
}

/** 64-bit difference hash: for each of 8 rows, is each of 8 pixels darker than its right neighbour. */
export async function fingerprint(abs: string): Promise<{ dhash: string; width: number; height: number }> {
  const meta = await sharp(abs, { failOn: 'none', limitInputPixels: false }).metadata();
  const { data } = await sharp(abs, { failOn: 'none', limitInputPixels: false }).greyscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  let bits = '';
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += (data[y * 9 + x] ?? 0) < (data[y * 9 + x + 1] ?? 0) ? '1' : '0';
  const flat = !bits.includes('1') || !bits.includes('0');
  const dhash = flat ? '' : BigInt(`0b${bits}`).toString(16).padStart(16, '0');
  return { dhash, width: meta.width ?? 0, height: meta.height ?? 0 };
}

const popcount = (n: number): number => {
  let c = 0;
  for (let v = n >>> 0; v; v &= v - 1) c++;
  return c;
};

/** Hamming distance between two 16-hex-digit hashes. */
export function distance(a: string, b: string): number {
  return popcount(parseInt(a.slice(0, 8), 16) ^ parseInt(b.slice(0, 8), 16)) + popcount(parseInt(a.slice(8), 16) ^ parseInt(b.slice(8), 16));
}

class FingerprintCache {
  private entries: Record<string, Fingerprint> = {};
  private loaded = false;
  private dirty = false;
  constructor(private readonly file: string) {}
  async load(): Promise<void> {
    if (this.loaded) return;
    this.loaded = true;
    try {
      this.entries = (JSON.parse(await fs.readFile(this.file, 'utf8')) as { files?: Record<string, Fingerprint> }).files ?? {};
    } catch {
      /* no cache yet */
    }
  }
  get(rel: string, size: number, mtimeMs: number): Fingerprint | null {
    const e = this.entries[rel];
    return e && e.size === size && e.mtimeMs === mtimeMs ? e : null;
  }
  set(rel: string, f: Fingerprint): void {
    this.entries[rel] = f;
    this.dirty = true;
  }
  async flush(): Promise<void> {
    if (!this.dirty) return;
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    await fs.writeFile(tmp, JSON.stringify({ files: this.entries }));
    await fs.rename(tmp, this.file);
    this.dirty = false;
  }
}

interface Item {
  rel: string; // library-relative
  fp: Fingerprint;
}

/** Library-relative file names the site serves, as master stems (`<stem>-<width>.<ext>` -> `<stem>`), to protect art in use. */
async function siteStems(repoRoot: string): Promise<Set<string>> {
  const out = new Set<string>();
  const walk = async (dir: string): Promise<void> => {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.isDirectory()) await walk(path.join(dir, e.name));
      else if (RASTER.test(e.name)) {
        const base = e.name.replace(/\.[^.]+$/, '');
        out.add(base);
        out.add(base.replace(/-\d{3,4}$/, ''));
      }
    }
  };
  for (const d of ['site/public', 'site/src/assets']) await walk(path.join(repoRoot, d));
  return out;
}

const stemOf = (rel: string): string => rel.slice(rel.lastIndexOf('/') + 1).replace(/\.[^.]+$/, '').replace(/-v\d+$/, '');

/** Union-find groups of items whose hashes are within `bits` and whose aspect ratios agree. */
export function groupLookalikes(items: Item[], bits: number): Item[][] {
  const usable = items.filter((i) => i.fp.dhash && i.fp.width > 0 && i.fp.height > 0).sort((a, b) => a.fp.width / a.fp.height - b.fp.width / b.fp.height);
  const parent = usable.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i]!)));
  for (let i = 0; i < usable.length; i++) {
    const ai = usable[i]!.fp.width / usable[i]!.fp.height;
    for (let j = i + 1; j < usable.length; j++) {
      const aj = usable[j]!.fp.width / usable[j]!.fp.height;
      if (aj - ai > ASPECT_TOLERANCE * ai) break; // sorted by aspect: nothing further can agree
      if (distance(usable[i]!.fp.dhash, usable[j]!.fp.dhash) <= bits) parent[find(j)] = find(i);
    }
  }
  const groups = new Map<number, Item[]>();
  usable.forEach((it, i) => groups.set(find(i), [...(groups.get(find(i)) ?? []), it]));
  return [...groups.values()].filter((g) => g.length > 1);
}

function find(ctx: ProviderContext): Promise<{ byGroup: Map<string, Candidate[]>; skipped: SkippedFile[]; groups: number }> {
  const bits = ctx.params.bits ?? DEFAULT_BITS;
  return ctx.memo(`lookalikes-${bits}`, async () => {
    const manifest = await loadImageManifest(ctx);
    const keep = new Set<string>();
    for (const r of manifest.records) {
      for (const t of Object.values(r.treatments ?? {})) {
        if (t.path && (r.userApproved || t.userApproved || keepStatus(t.status) || keepStatus(r.status) || /^selected/i.test(r.publicUse ?? ''))) keep.add(t.path);
      }
    }
    const site = await siteStems(ctx.repoRoot);
    const cache = new FingerprintCache(path.join(path.dirname(ctx.hasher.file), 'fingerprints.json'));
    await cache.load();
    const files = [...new Set(manifest.files.map((f) => f.destination).filter((d) => d.startsWith('assets/') && RASTER.test(d)))];
    const items = (
      await mapLimit(files, 4, async (rel): Promise<Item | null> => {
        const abs = path.join(ctx.repoRoot, IMAGE_LIB, rel);
        let st;
        try {
          st = await fs.stat(abs);
        } catch {
          return null;
        }
        let fp = cache.get(rel, st.size, st.mtimeMs);
        if (!fp) {
          try {
            fp = { size: st.size, mtimeMs: st.mtimeMs, ...(await fingerprint(abs)) };
          } catch {
            fp = { size: st.size, mtimeMs: st.mtimeMs, dhash: '', width: 0, height: 0 };
          }
          cache.set(rel, fp);
        }
        return { rel, fp };
      })
    ).filter((x): x is Item => x !== null);
    await cache.flush();

    const groups = groupLookalikes(items, bits);
    const cands: Candidate[] = [];
    for (const g of groups) {
      const protectedOnes = g.filter((i) => keep.has(i.rel) || site.has(stemOf(i.rel)) || site.has(i.rel.slice(i.rel.lastIndexOf('/') + 1).replace(/\.[^.]+$/, '')));
      const ranked = [...g].sort((a, b) => b.fp.width * b.fp.height - a.fp.width * a.fp.height || b.fp.size - a.fp.size || b.fp.mtimeMs - a.fp.mtimeMs);
      const keepers = protectedOnes.length ? protectedOnes : [ranked[0]!];
      const keeperSet = new Set(keepers.map((k) => k.rel));
      for (const i of g) {
        if (keeperSet.has(i.rel)) continue;
        const nearest = keepers.reduce((best, k) => (distance(i.fp.dhash, k.fp.dhash) < distance(i.fp.dhash, best.fp.dhash) ? k : best));
        cands.push({
          path: `${IMAGE_LIB}/${i.rel}`,
          reason: `looks like ${nearest.rel} (${distance(i.fp.dhash, nearest.fp.dhash)} of 64 bits differ; ${i.fp.width}x${i.fp.height} vs ${nearest.fp.width}x${nearest.fp.height})`,
        });
      }
    }
    const skipped: SkippedFile[] = [];
    const left = await dropReferenced(ctx, cands, skipped);
    const byGroup = new Map<string, Candidate[]>();
    for (const c of left) {
      const g = c.path.slice(IMAGE_LIB.length + 1).split('/').slice(0, 3).join('/');
      byGroup.set(g, [...(byGroup.get(g) ?? []), c]);
    }
    return { byGroup, skipped, groups: groups.length };
  });
}

export const lookalikes: ReductionProvider = {
  id: 'lookalikes',
  vertical: 'images',
  category: 'duplicates',
  label: 'Look-alikes',
  describe:
    'Images that look the same but are different files: re-saves, resizes, re-encodes and near-identical regenerations (a 64-bit picture fingerprint within a few bits, same shape). One per group stays: anything selected, approved, used by the site or named by a wiki page, otherwise the largest. Check each row against the image it names before approving.',
  reportOnly: false,
  params: [{ name: 'bits', label: 'Max differing bits (of 64)', default: DEFAULT_BITS }],

  async targets(ctx) {
    const { byGroup } = await find(ctx);
    return [...byGroup.keys()].sort().map((g) => ({ id: g, label: g }));
  },

  async plan(target, ctx) {
    const { byGroup, skipped } = await find(ctx);
    return buildEntries(ctx, byGroup.get(target) ?? [], skipped.filter((s) => s.path.includes(`/${target}/`)));
  },
};
