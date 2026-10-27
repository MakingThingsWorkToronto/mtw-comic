// Asset health: files under a library's assets/ that its catalogue never names. Action: register them with the owning module, or archive.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { SkippedFile, Vertical } from '../types';
import { assetIndex, baseName, libOf } from './assets';
import { buildEntries, dropReferenced, loadImageManifest, mapLimit, readJsonIf } from './context';
import type { Candidate, ProviderContext, ReductionProvider, ReductionTarget } from './context';

const ORPHAN_LIBS: Vertical[] = ['images', 'audio', 'comics', 'journal'];
/** Libraries whose owning module has a register procedure. */
const REGISTER: Partial<Record<Vertical, { procedure: string; param: string }>> = {
  images: { procedure: 'images-register', param: 'paths' },
  audio: { procedure: 'soundtrack-intake', param: 'files' },
};
const CATALOGUE: Record<string, string> = {
  images: 'manifest.json',
  audio: 'sources.json',
  comics: 'the comics records',
  journal: 'the Journal entries and records',
};
const TEXT_EXT = /\.(json|jsonl|md)$/i;
const MAX_TEXT = 8_000_000;

async function textFiles(dir: string, out: string[] = []): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) await textFiles(abs, out);
    else if (e.isFile() && TEXT_EXT.test(e.name)) out.push(abs);
  }
  return out;
}

/** Every file name a library's own text records mention (generated projections such as .js and .html are not records). */
function libraryText(ctx: ProviderContext, lib: Vertical): Promise<string> {
  return ctx.memo(`library-text-${lib}`, async () => {
    const files = await textFiles(path.join(ctx.repoRoot, libOf(lib).root));
    const parts = await mapLimit(files, 16, async (f) => {
      try {
        const st = await fs.stat(f);
        return st.size > MAX_TEXT ? '' : (await fs.readFile(f, 'utf8')).toLowerCase();
      } catch {
        return '';
      }
    });
    return parts.join('\n');
  });
}

function orphansOf(ctx: ProviderContext, lib: Vertical): Promise<Candidate[]> {
  return ctx.memo(`orphans-${lib}`, async () => {
    const root = libOf(lib).root;
    const assetsDir = lib === 'journal' ? `${root}/` : `${root}/assets/`;
    const files = (await assetIndex(ctx)).filter((f) => f.lib === lib && f.rel.startsWith(assetsDir));
    const why = `not named by ${CATALOGUE[lib] ?? 'the catalogue'}`;
    if (lib === 'images') {
      const manifest = await loadImageManifest(ctx);
      const known = new Set<string>();
      for (const f of manifest.files) known.add(`${root}/${f.destination}`);
      for (const r of manifest.records) for (const t of Object.values(r.treatments ?? {})) if (t.path) known.add(`${root}/${t.path}`);
      return files.filter((f) => !known.has(f.rel)).map((f) => ({ path: f.rel, reason: why }));
    }
    if (lib === 'audio') {
      const sources = await readJsonIf<{ tracks?: { file?: string }[] }>(path.join(ctx.repoRoot, root, 'sources.json'));
      const known = new Set((sources?.tracks ?? []).map((t) => (t.file ? `${root}/assets/${t.file}`.toLowerCase() : '')));
      const text = await libraryText(ctx, lib);
      return files.filter((f) => !known.has(f.rel.toLowerCase()) && !text.includes(baseName(f.rel).toLowerCase())).map((f) => ({ path: f.rel, reason: why }));
    }
    const text = await libraryText(ctx, lib);
    return files.filter((f) => !text.includes(baseName(f.rel).toLowerCase())).map((f) => ({ path: f.rel, reason: why }));
  });
}

export const orphans: ReductionProvider = {
  id: 'orphans',
  vertical: 'images',
  category: 'orphans',
  label: 'Not in a catalogue',
  describe:
    'Files under a library that its manifest, track list, records or entries never name. Register them with the owning module (so they get a record and credit), or archive the ones that are leftovers. Files a maintained wiki page names are left alone.',
  reportOnly: false,
  params: [],

  async targets(ctx) {
    const out: ReductionTarget[] = [];
    for (const lib of ORPHAN_LIBS) {
      if ((await orphansOf(ctx, lib)).length === 0) continue;
      out.push({ id: lib, label: `${libOf(lib).label} not in a catalogue`, vertical: lib, ...(REGISTER[lib] ? { register: true } : {}) });
    }
    return out;
  },

  async plan(target, ctx) {
    if (!ORPHAN_LIBS.includes(target as Vertical)) throw new Error(`unknown target: ${target}`);
    const skipped: SkippedFile[] = [];
    const list = await dropReferenced(ctx, await orphansOf(ctx, target as Vertical), skipped);
    return buildEntries(ctx, list, skipped);
  },

  async register(target, ctx) {
    const r = REGISTER[target as Vertical];
    if (!r) return null;
    const skipped: SkippedFile[] = [];
    const list = await dropReferenced(ctx, await orphansOf(ctx, target as Vertical), skipped);
    const inPlace = target === 'audio' ? ' Register them in place: keep each file where it is, resolve its title, artist and licence, and add it to sources.json.' : '';
    return {
      procedure: r.procedure,
      param: r.param,
      paths: list.map((c) => c.path),
      text: (n, listFile) => `${n} files under ${libOf(target as Vertical).root}/assets that the ${CATALOGUE[target] ?? 'catalogue'} does not name, listed one per line in ${listFile}.${inPlace}`,
    };
  },
};
