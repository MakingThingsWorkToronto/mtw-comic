// Where Comic B tools put their images, and the shared browser lock (skill: mtw-comic-story, references/checks.md).
// Every image a Comic B check or tool writes (screenshots, style-check sheets, golden comparisons, contact sheets) lands
// in the canonical image library and is registered there, so Matt can preview it at /m/images in MTW Studio
// (AGENTS.md; spec, Comic B, Matt 2026-10-02: "all images generated are supposed to be placed in the image-library so i
// can preview"). Nothing is written under discussion/; the deslop lint fails any image file there.
//   reviewDir(group, run)   a new folder for one run: assets/experiments/comic-b/<group>/<run>/ (registered files are
//                            immutable, so a run never overwrites an earlier run's file)
//   registerReview(files)  registers the files as Comic B experiments records in one call to the maintained helper
//   browserLock(what, tool) the one-browser-at-a-time lock line in discussion/handoff/STATUS.md (keeps only the latest)
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, realpathSync, statSync, existsSync } from 'node:fs';
import { resolve, dirname, join, relative, basename, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
export const repo = resolve(here, '..', '..');
export const library = join(repo, 'wiki/image-library');
const base = 'assets/experiments/comic-b';
const helper = join(repo, '.claude/skills/mtw-raster-alternatives/scripts/portable-gallery/maintain_library.py');
export const statusFile = join(repo, 'discussion/handoff/STATUS.md');

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const runStamp = () => new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');
export const libPath = (abs) => relative(library, abs).split('\\').join('/');
export const recordId = (abs) => 'comic-b-review-' + slug(libPath(abs).slice(base.length + 1).replace(/\.[a-z0-9]+$/i, ''));
export const recordDir = (abs) => join(library, 'records', recordId(abs), 'comic-review', 'v1');

export function reviewDir(group, run = runStamp()) {
  const dir = join(library, base, group, ...(run ? [run] : []));
  mkdirSync(dir, { recursive: true });
  return dir;
}

export const reviewTitle = title => `Comic B - ${title}`;

// files: [{ path (absolute, inside reviewDir), title, group (e.g. 'browser screenshots'), note }]
export function registerReview(files) {
  if (!files.length) return;
  const records = files.map((f) => {
    const p = libPath(f.path);
    if (!p.startsWith(base + '/')) throw new Error(`Not a Comic B review file: ${f.path}`);
    return {
      id: recordId(f.path), logicalId: null, collection: 'experiments', title: reviewTitle(f.title),
      description: f.note, service: `Comic B ${f.group}`, category: 'Comic B', publicUse: 'not-selected',
      treatments: { 'comic-review': { path: p, status: 'review-evidence', note: `${f.note} Review evidence, not artwork for the site; not approved by Matt.`, sourceName: basename(f.path) } },
    };
  });
  const tmp = mkdtempSync(join(tmpdir(), 'comic-b-register-')), payload = join(tmp, 'payload.json');
  writeFileSync(payload, JSON.stringify({ records }, null, 1));
  const python = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
  const r = spawnSync(python, [helper, 'register', '--library', library, '--payload', payload, '--receipt-dir', join(tmp, 'receipts')], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`Image library registration failed (payload kept at ${payload}):\n${r.stderr || r.stdout}`);
  const registration = { payload, receipts: join(tmp, 'receipts'), images: records.length };
  console.log(`Registered ${records.length} image(s) in the image library (${libPath(dirname(files[0].path))}/).`);
  return registration;
}

export function browserBusy() {
  let open = false;
  for (const l of readFileSync(statusFile, 'utf8').split(/\r?\n/)) { if (/browser run started/i.test(l)) open = true; if (/browser run stopped/i.test(l)) open = false; }
  return open;
}

// One Comic B lock line, replaced on every change, at the top of the Comic B section (other sessions' lines are kept).
export function browserLock(what, tool) {
  const s = readFileSync(statusFile, 'utf8'), nl = s.includes('\r\n') ? '\r\n' : '\n';
  const lock = (l) => /^-? ?Comic B (engine )?browser run (started|stopped)/i.test(l), lines = [];
  for (const l of s.split(/\r?\n/)) { if (lock(l)) { if (lines.at(-1) === '') lines.pop(); } else lines.push(l); }
  const entry = `- Comic B browser run ${what} ${new Date().toISOString()} (${tool}, PID ${process.pid})`;
  const at = lines.findIndex((l) => /^## Comic B/.test(l));
  if (at < 0) lines.push('', entry); else lines.splice(at + 1, 0, '', entry);
  writeFileSync(statusFile, lines.join(nl));
}

export async function waitForBrowser(minutes = 20) {
  const t0 = Date.now();
  while (browserBusy()) {
    if (Date.now() - t0 > minutes * 60000) { console.error('A browser run is still open in STATUS.md; not starting.'); process.exit(3); }
    console.log('Another browser run is open in STATUS.md; waiting 20 s...');
    await new Promise((r) => setTimeout(r, 20000));
  }
}

// Opt-in coordinated review batch. Capture passes retain evidence without rescanning the catalog.
const sha256 = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const json = path => JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
const inside = (root, path) => { const rel = relative(realpathSync(root), realpathSync(path)); return rel && !rel.startsWith('..') && !isAbsolute(rel); };
function evidenceFile(path, libraryRoot, prefix) {
  path = resolve(path);
  if (!inside(libraryRoot, path) || !statSync(path).isFile()) throw new Error(`Evidence path outside library or not a file: ${path}`);
  const rel = relative(realpathSync(libraryRoot), realpathSync(path)).split('\\').join('/');
  if (!rel.startsWith(prefix + '/') || !statSync(path).size) throw new Error(`Invalid or empty evidence file: ${path}`);
  return { path, sha256: sha256(path), bytes: statSync(path).size };
}
export function deferReview(files, { batch, reportPath, libraryRoot = library }) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(batch || '') || !files.length) throw new Error('A named batch and nonempty capture list are required');
  const captures = files.map(f => ({ ...f, ...evidenceFile(f.path, libraryRoot, base) }));
  if (new Set(captures.map(f => f.path.toLowerCase())).size !== captures.length) throw new Error('Duplicate capture path');
  const report = evidenceFile(reportPath, libraryRoot, 'records');
  const manifestPath = join(dirname(report.path), 'pending-registration.json');
  writeFileSync(manifestPath, JSON.stringify({ schemaVersion: 1, status: 'pending-registration', batch, owner: 'Comic', createdAt: new Date().toISOString(), report, captures }, null, 2) + '\n', { flag: 'wx' });
  return manifestPath;
}
export function prepareReviewBatch(manifestPaths, batch, { libraryRoot = library } = {}) {
  if (!manifestPaths.length || !/^[a-z0-9][a-z0-9-]*$/.test(batch || '')) throw new Error('Supply batch name and exact pending manifests');
  const catalog = json(join(libraryRoot, 'manifest.json')), registered = new Set((catalog.records || []).map(r => r.id));
  const ids = new Set(), paths = new Set(), manifests = [], files = [];
  for (const path of manifestPaths) {
    const manifest = evidenceFile(path, libraryRoot, 'records'), data = json(manifest.path);
    if (data.schemaVersion !== 1 || data.status !== 'pending-registration' || data.batch !== batch || !data.captures?.length) throw new Error(`Invalid pending manifest or batch mismatch: ${path}`);
    if (manifests.some(m => m.path.toLowerCase() === manifest.path.toLowerCase())) throw new Error('Duplicate pending manifest');
    for (const [entry, prefix] of [[data.report, 'records'], ...data.captures.map(f => [f, base])]) {
      const now = evidenceFile(entry.path, libraryRoot, prefix);
      if (now.sha256 !== entry.sha256 || now.bytes !== entry.bytes) throw new Error(`Evidence changed: ${entry.path}`);
    }
    for (const f of data.captures) {
      const rel = relative(libraryRoot, f.path).split('\\').join('/');
      const id = 'comic-b-review-' + slug(rel.slice(base.length + 1).replace(/\.[a-z0-9]+$/i, ''));
      if (ids.has(id) || paths.has(f.path.toLowerCase()) || registered.has(id)) throw new Error(`Duplicate or already registered review version: ${id}`);
      if (!/\.(png|webp|avif|jpe?g)$/i.test(f.path)) throw new Error(`Not a review image: ${f.path}`);
      ids.add(id); paths.add(f.path.toLowerCase()); files.push(f);
    }
    manifests.push(manifest);
  }
  return { batch, manifests, files };
}
export function finalizeReviewBatch(manifestPaths, batch, { libraryRoot = library, register = registerReview } = {}) {
  const prepared = prepareReviewBatch(manifestPaths, batch, { libraryRoot });
  const receipt = join(dirname(prepared.manifests[0].path), 'batch-registration.json');
  if (existsSync(receipt)) throw new Error(`Batch already finalized: ${receipt}`);
  const registration = register(prepared.files); // exactly one maintained helper call
  writeFileSync(receipt, JSON.stringify({ status: 'registered', batch, registeredAt: new Date().toISOString(), manifests: prepared.manifests, images: prepared.files.length, registration, catalogSha256: sha256(join(libraryRoot, 'manifest.json')), visualApproval: 'not implied by registration' }, null, 2) + '\n', { flag: 'wx' });
  return receipt;
}
