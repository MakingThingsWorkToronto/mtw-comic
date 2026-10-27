// New (migration spec section 7). Replaces "extract the ZIP and open index.html": the exact registered files, the
// producer's derived files, and the module's own views as one classic-script bundle that works from file://.
import { createHash } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import type { Catalog } from './catalog';
import { helperPath } from './register';
import type { RegisterContext } from './register';
import type { ManifestFile } from '../shared/types';

const DERIVED = ['manifest.json', 'data.js', 'all-files.html', 'README.md'];
/** Retired console files, skipped if an older files[] row still names them; the snapshot ships its own index.html. */
const LEGACY_RUNTIME = new Set(['index.html', 'browser.js', 'library.css', '.gitattributes']);

export interface ExportOptions {
  out: string;
  /** Run the producer's `verify` first (default true). */
  verify?: boolean;
  /** Include records/ evidence images and files (default true). */
  evidence?: boolean;
  /** Hash every copied file against files[] (slow; default false). */
  hashCheck?: boolean;
  /** List what would be copied; write nothing. */
  plan?: boolean;
  /** Also build the ZIP with package_zip.py --extract-check. */
  zip?: string;
}

export interface ExportResult {
  out: string;
  plan: boolean;
  files: number;
  bytes: number;
  skippedEvidence: number;
  bundle?: { js: number; css: number };
  verify?: { code: number; stdout: string; stderr: string };
  zip?: { code: number; stdout: string; stderr: string; zip: string; report: string; extractCheck: string };
  receiptDir?: string;
}

const hashFile = (file: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const h = createHash('sha256');
    createReadStream(file).on('data', (d) => h.update(d)).on('error', reject).on('end', () => resolve(h.digest('hex')));
  });

async function mapLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) await fn(items[next++] as T);
    }),
  );
}

export function snapshotEntry(): string {
  return fileURLToPath(new URL('../snapshot/entry.tsx', import.meta.url));
}

/** Build the classic IIFE bundle (no module scripts, no network) into `outDir`: app.js, app.css, assets/. */
export async function buildSnapshotBundle(outDir: string): Promise<{ js: number; css: number }> {
  await build({
    entryPoints: [snapshotEntry()],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2019',
    minify: true,
    jsx: 'automatic',
    jsxImportSource: 'preact',
    outdir: outDir,
    entryNames: 'app',
    assetNames: 'assets/[name]',
    loader: { '.woff2': 'file' },
    define: { 'process.env.NODE_ENV': '"production"' },
    logLevel: 'silent',
  });
  const size = async (f: string): Promise<number> => (await fs.stat(path.join(outDir, f))).size;
  return { js: await size('app.js'), css: await size('app.css') };
}

export const SNAPSHOT_INDEX = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Images · Making Things Work</title>
<link rel="stylesheet" href="app.css">
</head>
<body>
<div id="app"></div>
<noscript><p>The image browser needs JavaScript. <a href="all-files.html">All image files</a> lists every file without it.</p></noscript>
<script src="data.js"></script>
<script src="decisions.js"></script>
<script src="app.js"></script>
</body>
</html>
`;

export async function exportImages(ctx: RegisterContext, opts: ExportOptions, decisionsJson: unknown[] = []): Promise<ExportResult> {
  const out = path.resolve(opts.out);
  const repoRel = path.relative(ctx.repoRoot, out);
  if (!repoRel.startsWith('..') && !path.isAbsolute(repoRel)) throw new Error(`Output must be a fresh folder outside the repo: ${out}`);
  if (existsSync(out) && (await fs.readdir(out)).length) throw new Error(`Output folder is not empty: ${out}`);
  const catalog: Catalog = ctx.catalog;
  const l = await catalog.ensure();
  const lib = catalog.libraryRoot;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const receiptDir = path.join(ctx.stateDir, 'receipts', `export-${stamp}`);

  const result: ExportResult = { out, plan: Boolean(opts.plan), files: 0, bytes: 0, skippedEvidence: 0 };
  if (opts.verify !== false && !opts.plan) {
    await fs.mkdir(receiptDir, { recursive: true });
    const python = ctx.python ?? process.env.MTW_PYTHON ?? 'python';
    result.verify = await ctx.runProducer(python, [helperPath(ctx), 'verify', '--library', lib, '--receipt-dir', path.join(receiptDir, 'verify')]);
    if (result.verify.code !== 0) throw new Error(`verify failed; nothing exported:\n${result.verify.stderr || result.verify.stdout}`);
    result.receiptDir = receiptDir;
  }

  const wanted: ManifestFile[] = [];
  for (const f of l.manifest.files) {
    if (DERIVED.includes(f.destination) || LEGACY_RUNTIME.has(f.destination)) continue;
    if (opts.evidence === false && f.destination.startsWith('records/')) {
      result.skippedEvidence++;
      continue;
    }
    wanted.push(f);
  }
  result.files = wanted.length + DERIVED.length + 4;
  result.bytes = wanted.reduce((n, f) => n + f.bytes, 0);
  if (opts.plan) return result;

  await fs.mkdir(out, { recursive: true });
  const made = new Set<string>();
  await mapLimit(wanted, 16, async (f) => {
    const dest = path.join(out, ...f.destination.split('/'));
    const dir = path.dirname(dest);
    if (!made.has(dir)) {
      await fs.mkdir(dir, { recursive: true });
      made.add(dir);
    }
    await fs.copyFile(path.join(lib, ...f.destination.split('/')), dest);
    if (opts.hashCheck && (await hashFile(dest)) !== f.sha256) throw new Error(`Export hash conflict: ${f.destination}`);
  });
  for (const name of DERIVED) await fs.copyFile(path.join(lib, name), path.join(out, name));

  result.bundle = await buildSnapshotBundle(out);
  await fs.writeFile(path.join(out, 'index.html'), SNAPSHOT_INDEX, 'utf8');
  await fs.writeFile(path.join(out, 'decisions.js'), `window.MTW_DECISIONS = ${JSON.stringify(decisionsJson)};\n`, 'utf8');

  if (opts.zip) {
    await fs.mkdir(receiptDir, { recursive: true });
    const sums = new Map(l.manifest.files.map((f) => [f.destination, f.sha256]));
    const listing: { path: string; sha256: string; bytes: number }[] = [];
    const walk = async (dir: string): Promise<void> => {
      for (const e of await fs.readdir(dir, { withFileTypes: true })) {
        const abs = path.join(dir, e.name);
        if (e.isDirectory()) await walk(abs);
        else if (e.isFile()) {
          const rel = path.relative(out, abs).replace(/\\/g, '/');
          const st = await fs.stat(abs);
          listing.push({ path: rel, sha256: (!DERIVED.includes(rel) && sums.get(rel)) || (await hashFile(abs)), bytes: st.size });
        }
      }
    };
    await walk(out);
    const fileManifest = path.join(receiptDir, 'package-files.json');
    await fs.writeFile(fileManifest, JSON.stringify({ root: out, files: listing }), 'utf8');
    const extractCheck = path.join(receiptDir, 'extract-check');
    const report = path.join(receiptDir, 'zip-report.json');
    const python = ctx.python ?? process.env.MTW_PYTHON ?? 'python';
    const helper = path.join(path.dirname(helperPath(ctx)), 'package_zip.py');
    const z = await ctx.runProducer(python, [helper, '--package', out, '--file-manifest', fileManifest, '--zip', path.resolve(opts.zip), '--extract-check', extractCheck, '--report', report]);
    result.zip = { ...z, zip: path.resolve(opts.zip), report, extractCheck };
    if (z.code !== 0) throw new Error(`package_zip.py failed:\n${z.stderr || z.stdout}`);
  }
  return result;
}
