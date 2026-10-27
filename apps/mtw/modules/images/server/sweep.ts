// New (migration spec section 6). Read-only report of what keeps the library and the website out of step.
// It never writes: registration goes through register.ts and the producer.
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { IMAGE_EXT } from './catalog';
import type { Catalog } from './catalog';

export interface UnregisteredFile {
  path: string;
  bytes: number;
  folder: string;
  /** Collection the registration would infer from the folder, or null when `--collection` is needed. */
  inferred: string | null;
  mtime: string;
  /** When the file arrived here: the later of mtime and creation time (Windows copies keep the source's mtime). */
  arrived: string;
}
export interface FileProblem {
  path: string;
  kind: 'missing' | 'size' | 'hash';
  expected: number | string;
  actual?: number | string;
}
export interface SweepReport {
  at: string;
  manifestSha256: string;
  registeredImages: number;
  /** Whether registered files were checked on disk (`files` or `hash`). */
  checkedFiles: boolean;
  /** Image files under assets/ that no treatment names. Each one blocks every registration. */
  unregistered: UnregisteredFile[];
  /** Non-image files under assets/ that the manifest's files[] does not list. */
  unlisted: { path: string; bytes: number }[];
  /** files[] entries missing on disk or changed (only when the sweep was asked to check files). */
  problems: FileProblem[];
  integration: {
    /** site/public/comic stems with no canonical master page. */
    orphanComicStems: { story: string; stem: string }[];
    /** Diagram build-input package built from an older manifest than the current one. */
    diagramPackageStale: boolean | null;
    /** image-sources files whose bytes match no canonical treatment (deep only). */
    unmatchedSources?: string[];
  };
  derived: { stale: string[] };
}

const DERIVED = ['manifest.json', 'data.js', 'all-files.html', 'README.md'];

/** Folder -> collection rules of `mtw register image` (spec section 6, step 3). */
export function inferCollection(rel: string): string | null {
  const [area, first, second] = rel.split('/');
  if (area !== 'assets') return null;
  // Comic B art is comic, not a cinematic scene photograph: it has its own collection.
  if ((first === 'scenes' || first === 'experiments') && second === 'comic-b') return 'comics';
  if (first === 'scenes') return 'scenes';
  if (first === 'experiments') return 'experiments';
  if (first === 'earlier-attempts') return 'earlier';
  if (first === 'originals') return 'originals';
  return null;
}

async function* walk(dir: string, base: string): AsyncGenerator<{ rel: string; abs: string }> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(abs, base);
    else if (e.isFile()) yield { rel: path.relative(base, abs).replace(/\\/g, '/'), abs };
  }
}

const hashFile = (file: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const h = createHash('sha256');
    createReadStream(file).on('data', (d) => h.update(d)).on('error', reject).on('end', () => resolve(h.digest('hex')));
  });

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i] as T);
      }
    }),
  );
  return out;
}

/**
 * `files` stats every registered file (17,000 stats: about 10 s on a laptop disk), `hash` also hashes them, `deep`
 * hashes the website's image-sources copies. All three are off by default so the first sweep answers in a few seconds.
 */
export async function sweepImages(catalog: Catalog, opts: { files?: boolean; hash?: boolean; deep?: boolean } = {}): Promise<SweepReport> {
  const l = await catalog.ensure();
  const lib = catalog.libraryRoot;
  const treatmentPaths = new Set<string>();
  const treatmentShas = new Set<string>();
  for (const r of l.manifest.records) {
    for (const t of Object.values(r.treatments)) {
      if (t.path) treatmentPaths.add(t.path);
      if (t.sha256) treatmentShas.add(t.sha256);
    }
  }
  const listed = new Map(l.manifest.files.map((f) => [f.destination, f]));

  const unregistered: UnregisteredFile[] = [];
  const unlisted: { path: string; bytes: number }[] = [];
  for await (const f of walk(path.join(lib, 'assets'), lib)) {
    if (IMAGE_EXT.has(path.extname(f.rel).toLowerCase())) {
      if (!treatmentPaths.has(f.rel)) {
        const st = await fs.stat(f.abs);
        unregistered.push({ path: f.rel, bytes: st.size, folder: path.posix.dirname(f.rel), inferred: inferCollection(f.rel), mtime: new Date(st.mtimeMs).toISOString(), arrived: new Date(Math.max(st.mtimeMs, st.birthtimeMs || 0)).toISOString() });
      }
    } else if (!listed.has(f.rel)) {
      unlisted.push({ path: f.rel, bytes: (await fs.stat(f.abs)).size });
    }
  }
  unregistered.sort((a, b) => b.mtime.localeCompare(a.mtime) || a.path.localeCompare(b.path));

  const problems: FileProblem[] = [];
  const files = opts.files || opts.hash ? l.manifest.files.filter((f) => !DERIVED.includes(f.destination)) : [];
  await mapLimit(files, 48, async (f) => {
    const abs = path.join(lib, f.destination);
    let st;
    try {
      st = await fs.stat(abs);
    } catch {
      problems.push({ path: f.destination, kind: 'missing', expected: f.bytes });
      return;
    }
    if (st.size !== f.bytes) {
      problems.push({ path: f.destination, kind: 'size', expected: f.bytes, actual: st.size });
      return;
    }
    if (opts.hash) {
      const actual = await hashFile(abs);
      if (actual !== f.sha256) problems.push({ path: f.destination, kind: 'hash', expected: f.sha256, actual });
    }
  });
  problems.sort((a, b) => a.path.localeCompare(b.path));

  // Integration drift.
  const site = path.join(catalog.repoRoot, 'site');
  const masters = new Set<string>();
  for (const p of treatmentPaths) {
    const m = /^assets\/scenes\/comic-b\/pages\/(.+?)(?:-v\d+)?\.[a-z0-9]+$/i.exec(p);
    if (m) masters.add(m[1] as string);
  }
  const orphanComicStems: { story: string; stem: string }[] = [];
  const comicRoot = path.join(site, 'public', 'comic');
  if (existsSync(comicRoot)) {
    for (const story of await fs.readdir(comicRoot, { withFileTypes: true })) {
      if (!story.isDirectory() || story.name.startsWith('_')) continue;
      const stems = new Set<string>();
      for (const name of await fs.readdir(path.join(comicRoot, story.name))) {
        const m = /^(.+)-(?:1600|2400|3200)\.(?:avif|webp)$/.exec(name);
        if (m) stems.add(m[1] as string);
      }
      for (const stem of [...stems].sort()) if (!masters.has(stem)) orphanComicStems.push({ story: story.name, stem });
    }
  }
  let diagramPackageStale: boolean | null = null;
  const pkg = path.join(site, 'src', 'data', 'canonical-images', 'manifest.json');
  if (existsSync(pkg)) {
    try {
      diagramPackageStale = (JSON.parse(readFileSync(pkg, 'utf8')) as { sourceManifestSha256?: string }).sourceManifestSha256 !== l.etag;
    } catch {
      diagramPackageStale = null;
    }
  }
  let unmatchedSources: string[] | undefined;
  if (opts.deep) {
    unmatchedSources = [];
    const root = path.join(site, 'src', 'assets', 'image-sources');
    const found: { rel: string; abs: string }[] = [];
    for await (const f of walk(root, root)) if (IMAGE_EXT.has(path.extname(f.rel).toLowerCase())) found.push(f);
    await mapLimit(found, 8, async (f) => {
      if (!treatmentShas.has(await hashFile(f.abs))) (unmatchedSources as string[]).push(`site/src/assets/image-sources/${f.rel}`);
    });
    unmatchedSources.sort();
  }

  // Cheap staleness heuristic; `maintain_library.py verify` is the exact check (see images-verify-library).
  const stale: string[] = [];
  try {
    const manifestTime = (await fs.stat(path.join(lib, 'manifest.json'))).mtimeMs;
    for (const name of DERIVED.slice(1)) {
      const st = await fs.stat(path.join(lib, name)).catch(() => null);
      if (!st || st.mtimeMs + 1000 < manifestTime) stale.push(name);
    }
  } catch {
    /* no manifest: the catalog would already have thrown */
  }

  return {
    at: new Date().toISOString(),
    manifestSha256: l.etag,
    registeredImages: treatmentPaths.size,
    checkedFiles: Boolean(opts.files || opts.hash),
    unregistered,
    unlisted: unlisted.sort((a, b) => a.path.localeCompare(b.path)),
    problems,
    integration: { orphanComicStems, diagramPackageStale, ...(unmatchedSources ? { unmatchedSources } : {}) },
    derived: { stale },
  };
}
