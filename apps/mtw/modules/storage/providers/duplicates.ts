// Asset health: identical sha256 at more than one path inside the canonical libraries, and site copies with no library master.
// Hashing is lazy: this provider only reads the hash cache unless the context asks for real hashes (plan creation).
import type { SkippedFile, Vertical } from '../types';
import { assetIndex, baseName, libOf, LIBRARIES, stemKey } from './assets';
import type { AssetFile } from './assets';
import { AUDIO_EXT, buildEntries, loadImageManifest } from './context';
import type { Candidate, ProviderContext, ReductionProvider, ReductionTarget } from './context';

const MIN_BYTES = 1024;
export const SITE_TARGET = 'site';

/** Files that share a size with another file: the only ones that can be identical. */
export async function sizeCollisions(ctx: ProviderContext): Promise<AssetFile[]> {
  const all = (await assetIndex(ctx)).filter((f) => f.size >= MIN_BYTES);
  const bySize = new Map<number, AssetFile[]>();
  for (const f of all) bySize.set(f.size, [...(bySize.get(f.size) ?? []), f]);
  return [...bySize.values()].filter((g) => g.length > 1).flat();
}

interface Found {
  /** extras per library, with the copy they duplicate */
  extras: Map<Vertical, Candidate[]>;
  noMaster: Candidate[];
  pending: number;
}

/** Which library should keep a file of this kind when the same bytes sit in several. */
function ownerRank(file: AssetFile): number {
  const owner: Vertical = AUDIO_EXT.test(file.rel) ? 'audio' : 'images';
  return file.lib === owner ? 0 : file.lib === 'images' ? 1 : file.lib === 'audio' ? 2 : file.lib === 'comics' ? 3 : 4;
}

function find(ctx: ProviderContext): Promise<Found> {
  return ctx.memo(`duplicates-${ctx.hash}`, async () => {
    const index = await assetIndex(ctx);
    const manifest = await loadImageManifest(ctx);
    const registered = new Set(manifest.files.map((f) => `wiki/image-library/${f.destination}`));
    const colliding = await sizeCollisions(ctx);
    const collidingSet = new Set(colliding.map((f) => f.rel));
    const byHash = new Map<string, AssetFile[]>();
    const unhashed = new Set<string>();
    for (const f of colliding) {
      const t = { rel: f.rel, abs: f.abs, size: f.size, mtimeMs: f.mtimeMs };
      const sha = ctx.hash ? await ctx.hasher.sha(t) : await ctx.hasher.cached(t);
      if (!sha) {
        unhashed.add(f.rel);
        continue;
      }
      byHash.set(sha, [...(byHash.get(sha) ?? []), f]);
    }
    if (ctx.hash) await ctx.hasher.flush();

    const extras = new Map<Vertical, Candidate[]>();
    const inGroupWithMaster = new Set<string>();
    for (const [sha, group] of byHash) {
      const lib = group.filter((f) => f.lib !== 'site');
      if (lib.length > 0) for (const s of group) if (s.lib === 'site') inGroupWithMaster.add(s.rel);
      if (lib.length < 2) continue;
      lib.sort(
        (a, b) =>
          ownerRank(a) - ownerRank(b) ||
          Number(registered.has(b.rel)) - Number(registered.has(a.rel)) ||
          a.rel.length - b.rel.length ||
          a.rel.localeCompare(b.rel),
      );
      const keeper = lib[0] as AssetFile;
      for (const dup of lib.slice(1)) {
        const where = dup.lib === keeper.lib ? 'also at' : `kept in ${libOf(keeper.lib).label} at`;
        extras.set(dup.lib, [...(extras.get(dup.lib) ?? []), { path: dup.rel, reason: `identical content (${sha.slice(0, 8)}); ${where} ${keeper.rel}`, sha256: sha }]);
      }
    }

    // Site files with no library master: no identical library file and no library file of the same picture.
    const libStems = new Set(index.filter((f) => f.lib !== 'site').map((f) => stemKey(baseName(f.rel))));
    const libSizes = new Set(index.filter((f) => f.lib !== 'site').map((f) => f.size));
    const noMaster: Candidate[] = [];
    for (const f of index) {
      if (f.lib !== 'site' || f.size < MIN_BYTES || inGroupWithMaster.has(f.rel)) continue;
      if (libStems.has(stemKey(baseName(f.rel)))) continue;
      if (unhashed.has(f.rel) && collidingSet.has(f.rel) && libSizes.has(f.size)) continue; // may still prove to be a copy
      noMaster.push({ path: f.rel, reason: 'integration copy with no library master' });
    }
    return { extras, noMaster, pending: unhashed.size };
  });
}

export const duplicates: ReductionProvider = {
  id: 'duplicates',
  vertical: 'images',
  category: 'duplicates',
  label: 'Duplicates',
  describe:
    'Files with identical content (sha256) at more than one path in the libraries: one copy is kept, the rest can be archived. Site copies of a library master are expected and not counted; a site copy with no library master is listed so it can be registered. Hashes are cached by path, size and time.',
  reportOnly: false,
  params: [],

  async targets(ctx) {
    const f = await find(ctx);
    const out: ReductionTarget[] = [];
    for (const l of LIBRARIES) if ((f.extras.get(l.id)?.length ?? 0) > 0) out.push({ id: l.id, label: `${l.label} duplicates`, vertical: l.id });
    if (f.noMaster.length > 0) out.push({ id: SITE_TARGET, label: 'Site copies with no library master', vertical: 'site', register: true, planless: true });
    return out;
  },

  async plan(target, ctx) {
    const f = await find(ctx);
    const list = target === SITE_TARGET ? f.noMaster : (f.extras.get(target as Vertical) ?? []);
    const plan = await buildEntries(ctx, list, []);
    plan.pending = f.pending;
    return plan;
  },

  async register(target, ctx) {
    if (target !== SITE_TARGET) return null;
    const f = await find(ctx);
    return {
      procedure: 'images-register',
      param: 'paths',
      paths: f.noMaster.map((c) => c.path),
      text: (n, listFile) =>
        `${n} files under site/public that have no master in the image library, listed one per line in ${listFile}. Register each as a library record with its master, then point the site at the registered file.`,
    };
  },
};
