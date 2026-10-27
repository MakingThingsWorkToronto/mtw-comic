// Asset health: rasters far larger than any use needs. The fix is a NEW versioned smaller file (transcode plan); originals are
// never overwritten, and a second plan (replaced-originals) archives an original only after the new file exists and Matt approves.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { PlanFile, SkippedFile, Vertical } from '../types';
import { assetIndex, baseName, libOf, stemKey } from './assets';
import { buildEntries, dirName, posix } from './context';
import type { Candidate, ProviderContext, ReductionProvider, ReductionTarget } from './context';

const LIBS: Vertical[] = ['images', 'comics'];
const RASTER = /\.(png|jpe?g)$/i;
const SMALLER = /\.(webp|avif)$/i;
/** Bytes per pixel above which a PNG is photographic (flat graphics sit far below 1). */
const PHOTO_BPP = 1.2;

async function pngSize(abs: string): Promise<{ w: number; h: number } | null> {
  let fh;
  try {
    fh = await fs.open(abs, 'r');
    const buf = Buffer.alloc(24);
    await fh.read(buf, 0, 24, 0);
    return buf.toString('ascii', 1, 4) === 'PNG' ? { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) } : null;
  } catch {
    return null;
  } finally {
    await fh?.close();
  }
}

const mb = (n: number): string => `${(n / 1_000_000).toFixed(1)} MB`;

function find(ctx: ProviderContext): Promise<Map<Vertical, Candidate[]>> {
  const factor = ctx.params.factor ?? 2;
  const minBytes = (ctx.params.minMb ?? 1) * 1_000_000;
  return ctx.memo(`oversized-${factor}-${minBytes}`, async () => {
    const index = await assetIndex(ctx);
    const siteMax = new Map<string, number>();
    for (const f of index) if (f.lib === 'site') siteMax.set(stemKey(baseName(f.rel)), Math.max(siteMax.get(stemKey(baseName(f.rel))) ?? 0, f.size));
    const smaller = new Set(index.filter((f) => SMALLER.test(f.rel)).map((f) => `${dirName(f.rel)}|${stemKey(baseName(f.rel))}`));
    const out = new Map<Vertical, Candidate[]>();
    for (const f of index) {
      if (!LIBS.includes(f.lib) || !RASTER.test(f.rel) || f.size < minBytes || !f.rel.startsWith(`${libOf(f.lib).root}/assets/`)) continue;
      const key = stemKey(baseName(f.rel));
      if (smaller.has(`${dirName(f.rel)}|${key}`)) continue; // a smaller sibling already exists
      let reason = '';
      const site = siteMax.get(key);
      if (site && f.size > factor * site) reason = `${(f.size / site).toFixed(1)} times the largest site copy (${mb(f.size)} against ${mb(site)})`;
      else if (/\.png$/i.test(f.rel)) {
        const dim = await pngSize(f.abs);
        if (dim && f.size / (dim.w * dim.h) > PHOTO_BPP) reason = `PNG photo, ${mb(f.size)} at ${dim.w} by ${dim.h}; a lossless WebP is usually a third smaller`;
      }
      if (reason) out.set(f.lib, [...(out.get(f.lib) ?? []), { path: f.rel, reason, action: 'transcode' }]);
    }
    return out;
  });
}

export const oversizedOriginals: ReductionProvider = {
  id: 'oversized-originals',
  vertical: 'images',
  category: 'oversized',
  label: 'Larger than needed',
  describe:
    'Rasters much larger than the site ever shows (over the set number of times the biggest site copy), and PNG photos that a lossless WebP would shrink. The plan writes a new versioned file next to each original with a visible terminal procedure; the original stays until a second plan, which you approve, archives it.',
  reportOnly: false,
  params: [
    { name: 'factor', label: 'Times the largest site copy', default: 2 },
    { name: 'minMb', label: 'Only files over (MB)', default: 1 },
  ],

  async targets(ctx) {
    const found = await find(ctx);
    return LIBS.filter((l) => (found.get(l)?.length ?? 0) > 0).map((l) => ({ id: l, label: `${libOf(l).label} larger than needed`, vertical: l }));
  },

  async plan(target, ctx) {
    if (!LIBS.includes(target as Vertical)) throw new Error(`unknown target: ${target}`);
    return buildEntries(ctx, (await find(ctx)).get(target as Vertical) ?? []);
  },
};

const PLANS_DIR = 'wiki/operations/storage/plans';

/** Originals whose transcoded replacement exists (from executed transcode plans): the second, separately approved plan. */
function replaced(ctx: ProviderContext): Promise<Map<Vertical, Candidate[]>> {
  return ctx.memo('replaced-originals', async () => {
    const out = new Map<Vertical, Candidate[]>();
    let names: string[] = [];
    try {
      names = (await fs.readdir(path.join(ctx.repoRoot, PLANS_DIR))).filter((n) => n.endsWith('.json'));
    } catch {
      return out;
    }
    const seen = new Set<string>();
    for (const n of names) {
      let plan: { providerId?: string; status?: string; target?: string; id?: string; files?: PlanFile[] };
      try {
        plan = JSON.parse(await fs.readFile(path.join(ctx.repoRoot, PLANS_DIR, n), 'utf8')) as typeof plan;
      } catch {
        continue;
      }
      if (plan.providerId !== 'oversized-originals' || (plan.status !== 'executed' && plan.status !== 'partial')) continue;
      for (const f of plan.files ?? []) {
        if (f.result?.status !== 'transcoded' || !f.result.outputPath || seen.has(f.path)) continue;
        const exists = (rel: string) => fs.stat(path.join(ctx.repoRoot, rel)).then(() => true, () => false);
        if (!(await exists(f.path)) || !(await exists(posix(f.result.outputPath)))) continue;
        seen.add(f.path);
        const lib = (plan.target === 'comics' ? 'comics' : 'images') as Vertical;
        out.set(lib, [...(out.get(lib) ?? []), { path: f.path, reason: `replaced by ${f.result.outputPath} (transcode plan ${plan.id})`, sha256: f.sha256 }]);
      }
    }
    return out;
  });
}

export const replacedOriginals: ReductionProvider = {
  id: 'replaced-originals',
  vertical: 'images',
  category: 'oversized',
  label: 'Originals with a smaller replacement',
  describe: 'Archive an original whose smaller versioned replacement was written by an executed transcode plan and still exists. Nothing is listed until a transcode plan has run.',
  reportOnly: false,
  params: [],

  async targets(ctx) {
    const found = await replaced(ctx);
    return LIBS.filter((l) => (found.get(l)?.length ?? 0) > 0).map((l): ReductionTarget => ({ id: l, label: `${libOf(l).label} originals replaced`, vertical: l }));
  },

  async plan(target, ctx) {
    const skipped: SkippedFile[] = [];
    return buildEntries(ctx, (await replaced(ctx)).get(target as Vertical) ?? [], skipped);
  },
};
