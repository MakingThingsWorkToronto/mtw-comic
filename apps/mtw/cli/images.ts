// Image commands of the `mtw` CLI (migration spec sections 6-7): register image, sweep images, export images, thumbs warm.
// `register` calls the existing producer (maintain_library.py) and never edits the derived files itself.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FileDecisionLog } from '../server/core/decisions';
import { FileLeases } from '../server/core/leases';
import { FileWikiStore } from '../server/core/wiki-store';
import { Catalog } from '../modules/images/server/catalog';
import { exportImages } from '../modules/images/server/export';
import { planRegister, runRegister } from '../modules/images/server/register';
import type { RegisterContext, RegisterOptions } from '../modules/images/server/register';
import { sweepImages } from '../modules/images/server/sweep';
import { Thumbs } from '../modules/images/server/thumbs';
import { readableFile } from '../modules/images/server/files';
import { buildEvidence } from '../modules/images/shared/evidence';
import { DECISIONS_LIB } from '../modules/images/shared/types';

export interface Parsed {
  positional: string[];
  flags: Map<string, string | true>;
}

const BOOLEAN_FLAGS = new Set(['json', 'dry-run', 'all-unregistered', 'hash', 'deep', 'no-verify', 'no-evidence', 'no-files', 'hash-check', 'plan', 'help', 'evidence']);

export function parseArgs(argv: string[]): Parsed {
  const positional: string[] = [];
  const flags = new Map<string, string | true>();
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] as string;
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      const name = eq > 0 ? a.slice(2, eq) : a.slice(2);
      if (eq > 0) flags.set(name, a.slice(eq + 1));
      else if (BOOLEAN_FLAGS.has(name) || i + 1 >= argv.length || (argv[i + 1] as string).startsWith('--')) flags.set(name, true);
      else flags.set(name, argv[++i] as string);
    } else positional.push(a);
  }
  return { positional, flags };
}

const flag = (p: Parsed, name: string): string | undefined => {
  const v = p.flags.get(name);
  return typeof v === 'string' ? v : undefined;
};

export function defaultRepoRoot(): string {
  return process.env.MTW_REPO_ROOT ?? path.resolve(fileURLToPath(new URL('..', import.meta.url)), '..', '..');
}

export function createCliContext(repoRoot = defaultRepoRoot()): RegisterContext & { decisions: FileDecisionLog } {
  const leases = new FileLeases(repoRoot);
  const wiki = new FileWikiStore(repoRoot, leases);
  const decisions = new FileDecisionLog(wiki);
  const catalog = new Catalog(repoRoot, decisions);
  return { repoRoot, catalog, leases, stateDir: path.join(repoRoot, 'apps', 'mtw', '.state'), runProducer: (c, a) => wiki.runProducer(c, a), decisions };
}

const USAGE = `Usage:
  mtw register image <path...> [--record <id>] [--style <style>] [--collection <c>] [--note <text>] [--source-name <name>]
                    [--service <s>] [--category <c>] [--title <t>] [--description <d>] [--all-unregistered] [--dry-run] [--json]
  mtw sweep images [--no-files] [--hash] [--deep] [--json]
  mtw export images --out <fresh dir outside the repo> [--plan] [--no-verify] [--no-evidence] [--hash-check] [--zip <file>] [--json]
  mtw thumbs warm [--collection <c>] [--limit <n>]
Paths are repo-relative, library-relative (assets/...) or absolute, and must sit under wiki/image-library/assets/.`;

function print(json: boolean, value: unknown, text: () => string): void {
  process.stdout.write(json ? `${JSON.stringify(value, null, 2)}\n` : `${text()}\n`);
}

async function register(p: Parsed, ctx: RegisterContext): Promise<number> {
  const json = p.flags.has('json');
  if (p.flags.has('status')) {
    process.stderr.write('Status cannot be set from the CLI: new files register as unreviewed-preview.\n');
    return 2;
  }
  let paths = p.positional.slice(2);
  if (p.flags.has('all-unregistered')) paths = [...paths, ...(await sweepImages(ctx.catalog)).unregistered.map((u) => u.path)];
  if (!paths.length) {
    process.stderr.write(`No files given.\n${USAGE}\n`);
    return 2;
  }
  const opts: RegisterOptions = {
    ...(flag(p, 'record') ? { record: flag(p, 'record') as string } : {}),
    ...(flag(p, 'style') ? { style: flag(p, 'style') as string } : {}),
    ...(flag(p, 'collection') ? { collection: flag(p, 'collection') as string } : {}),
    ...(flag(p, 'note') ? { note: flag(p, 'note') as string } : {}),
    ...(flag(p, 'source-name') ? { sourceName: flag(p, 'source-name') as string } : {}),
    ...(flag(p, 'service') ? { service: flag(p, 'service') as string } : {}),
    ...(flag(p, 'category') ? { category: flag(p, 'category') as string } : {}),
    ...(flag(p, 'title') ? { title: flag(p, 'title') as string } : {}),
    ...(flag(p, 'description') ? { description: flag(p, 'description') as string } : {}),
  };
  const plan = await planRegister(ctx, paths, opts);
  const noopOnly = plan.items.length > 0 && plan.items.every((i) => i.action === 'noop');
  const lines = (): string =>
    [
      ...plan.items.map((i) => `${i.action.padEnd(11)} ${i.path}${i.recordId ? `  -> ${i.recordId}${i.style ? `#${i.style}` : ''}` : ''}${i.reason ? `  (${i.reason})` : i.inferred ? `  (${i.inferred})` : ''}`),
      ...(plan.blockedBy.length ? [`Blocked: ${plan.blockedBy.length} other unregistered file(s) make the producer refuse. Include them or use --all-unregistered:`, ...plan.blockedBy.slice(0, 20).map((b) => `  ${b}`)] : []),
    ].join('\n');
  if (noopOnly) {
    print(json, { ok: true, noop: true, items: plan.items }, () => `${lines()}\nNothing to do.`);
    return 0;
  }
  if (p.flags.has('dry-run') || !plan.ok) {
    print(json, { ...plan, dryRun: p.flags.has('dry-run') }, () => `${p.flags.has('dry-run') ? 'Dry run.' : 'Refused.'}\n${lines()}${plan.errors.length ? `\n${plan.errors.join('\n')}` : ''}`);
    return plan.ok ? 0 : 1;
  }
  const result = await runRegister(ctx, plan);
  print(json, { ...result, items: plan.items }, () => `${lines()}\n${result.ok ? 'Registered and verified.' : `Failed (register exit ${result.register.code}${result.verify ? `, verify exit ${result.verify.code}` : ''}).`}\n${result.register.stdout.slice(0, 600)}${result.register.stderr.slice(-1200)}${result.verify?.stderr.slice(-1200) ?? ''}`);
  return result.ok ? 0 : 1;
}

async function sweep(p: Parsed, ctx: RegisterContext): Promise<number> {
  const r = await sweepImages(ctx.catalog, { files: !p.flags.has('no-files'), hash: p.flags.has('hash'), deep: p.flags.has('deep') });
  print(p.flags.has('json'), r, () =>
    [
      `Manifest ${r.manifestSha256.slice(0, 12)} · ${r.registeredImages} registered images`,
      `Unregistered image files: ${r.unregistered.length}${r.unregistered.length ? ' (each blocks every registration)' : ''}`,
      ...r.unregistered.slice(0, 40).map((u) => `  ${u.path}  [${u.inferred ?? 'needs --collection'}]`),
      `Unlisted non-image files: ${r.unlisted.length}`,
      ...r.unlisted.slice(0, 10).map((u) => `  ${u.path}`),
      `Registered files missing or changed: ${r.checkedFiles ? r.problems.length : 'not checked'}`,
      ...r.problems.slice(0, 20).map((x) => `  ${x.kind}: ${x.path}`),
      `Comic stems without a canonical page: ${r.integration.orphanComicStems.length}`,
      ...r.integration.orphanComicStems.slice(0, 10).map((s) => `  ${s.story}/${s.stem}`),
      `Diagram build inputs older than the manifest: ${r.integration.diagramPackageStale ?? 'unknown'}`,
      ...(r.integration.unmatchedSources ? [`Website source copies matching no canonical file: ${r.integration.unmatchedSources.length}`] : []),
      `Derived files older than the manifest: ${r.derived.stale.join(', ') || 'none'}`,
    ].join('\n'),
  );
  return r.unregistered.length || r.problems.length ? 1 : 0;
}

async function exportCmd(p: Parsed, ctx: RegisterContext & { decisions: FileDecisionLog }): Promise<number> {
  const out = flag(p, 'out');
  if (!out) {
    process.stderr.write(`--out is required.\n${USAGE}\n`);
    return 2;
  }
  const rows = await ctx.decisions.list(DECISIONS_LIB);
  const result = await exportImages(
    ctx,
    {
      out,
      plan: p.flags.has('plan'),
      verify: !p.flags.has('no-verify'),
      evidence: !p.flags.has('no-evidence'),
      hashCheck: p.flags.has('hash-check'),
      ...(flag(p, 'zip') ? { zip: flag(p, 'zip') as string } : {}),
    },
    rows,
  );
  print(p.flags.has('json'), result, () => `${result.plan ? 'Plan' : 'Exported'}: ${result.files} files, ${(result.bytes / 1048576).toFixed(0)} MB to ${result.out}${result.skippedEvidence ? `, ${result.skippedEvidence} evidence files skipped` : ''}${result.bundle ? `\nBundle: app.js ${result.bundle.js} bytes, app.css ${result.bundle.css} bytes` : ''}${result.zip ? `\nZip: ${result.zip.zip}` : ''}`);
  return 0;
}

async function thumbsWarm(p: Parsed, ctx: RegisterContext): Promise<number> {
  const l = await ctx.catalog.ensure();
  const thumbs = new Thumbs(ctx.repoRoot, path.join(ctx.stateDir, 'thumbs'));
  const collection = flag(p, 'collection');
  const limit = Number(flag(p, 'limit') ?? Infinity);
  const wanted = new Map<string, string>();
  const entries = collection ? l.index.filter((e) => e.collection === collection) : l.index;
  for (const e of entries) {
    for (const t of Object.values((l.byId.get(e.id) as { record: { treatments: Record<string, { path?: string; sha256?: string }> } }).record.treatments)) {
      if (t.path && t.sha256 && !/\.svg$/i.test(t.path)) wanted.set(t.sha256, t.path);
    }
  }
  if (p.flags.has('evidence')) for (const e of buildEvidence(l.manifest.files)) if (!/\.svg$/i.test(e.path)) wanted.set(e.sha, e.path);
  let done = 0;
  let failed = 0;
  for (const [sha, rel] of [...wanted].slice(0, limit)) {
    try {
      const file = await readableFile(ctx.repoRoot, `wiki/image-library/${rel}`);
      await thumbs.get(sha, file.abs, 320);
      done++;
    } catch {
      failed++;
    }
  }
  process.stdout.write(`Thumbnails ready: ${done}, failed: ${failed}, cache: ${thumbs.dir}\n`);
  return failed ? 1 : 0;
}

/** Entry for `mtw <verb> <noun> ...`. Returns the process exit code. */
export async function imagesCommand(argv: string[], repoRoot = defaultRepoRoot()): Promise<number | null> {
  const p = parseArgs(argv);
  const [verb, noun] = p.positional;
  if (p.flags.has('help') && (noun === 'image' || noun === 'images' || verb === 'thumbs')) {
    process.stdout.write(`${USAGE}\n`);
    return 0;
  }
  const ctx = createCliContext(repoRoot);
  if (verb === 'register' && noun === 'image') return register(p, ctx);
  if (verb === 'sweep' && noun === 'images') return sweep(p, ctx);
  if (verb === 'export' && noun === 'images') return exportCmd(p, ctx);
  if (verb === 'thumbs' && noun === 'warm') return thumbsWarm(p, ctx);
  return null;
}

export { USAGE as IMAGES_USAGE };
