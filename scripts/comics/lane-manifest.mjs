// Build <run>/lane-manifest.json from a Codex lane run (receipt.json + the lane's job.json and request files).
// Usage: node scripts/comics/lane-manifest.mjs --run <runDir> [--json]
// Also exports buildLaneManifest(runDir): copies each job's generated PNG to <run>/out/<id>.png when missing
// (byte for byte, sha256 verified), measures it, writes lane-manifest.json and returns the manifest.
// Exit 0 ok, 1 when any job has no image, 2 usage.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { REPO, rel, abs, sha256 } from './lib/story.mjs';

const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));

/** Width, height and colour type straight from the PNG IHDR (null when not a PNG). */
export function pngInfo(buf) {
  if (buf.length < 33 || buf.readUInt32BE(0) !== 0x89504e47 || buf.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), colorType: buf[25] };
}

/** True when any pixel alpha < 255, false when none, null when sharp is unavailable. */
export async function realAlpha(buf, info) {
  if (info && (info.colorType === 0 || info.colorType === 2)) return false; // no alpha channel at all
  try {
    const sharp = createRequire(path.join(REPO, 'site', 'package.json'))('sharp');
    const { data, info: i } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let p = 3; p < data.length; p += i.channels) if (data[p] < 255) return true;
    return false;
  } catch { return null; }
}

function parseMessage(text) {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  const cands = [fenced?.[1], text.slice(text.indexOf('['), text.lastIndexOf(']') + 1)];
  for (const cand of cands) {
    try { const v = JSON.parse(cand); if (Array.isArray(v)) return v; } catch { /* try next */ }
  }
  return [];
}

/** Map job id -> native generated path: final-message JSON first, then generatedImages by job order. */
export function mapJobs(runDir, jobs, receipt) {
  const gen = receipt.generatedImages ?? [];
  const lastFile = path.join(runDir, 'last-message.txt');
  const msg = fs.existsSync(lastFile) ? parseMessage(fs.readFileSync(lastFile, 'utf8')) : [];
  const byId = new Map(msg.filter((e) => e && e.id).map((e) => [e.id, e]));
  return jobs.map((job, i) => {
    const e = byId.get(job.id);
    const claimed = e?.ok !== false && e?.path ? e.path : null;
    const hit = claimed && fs.existsSync(claimed) ? claimed : null;
    return { id: job.id, native: hit ?? gen[i]?.path ?? null };
  });
}

export async function buildLaneManifest(runDir) {
  runDir = abs(runDir);
  const laneDir = path.dirname(runDir);
  const receipt = readJson(path.join(runDir, 'receipt.json'));
  const jobs = readJson(path.join(laneDir, 'job.json'));
  const map = mapJobs(runDir, jobs, receipt);
  const out = [];
  for (const [i, job] of jobs.entries()) {
    const reqFile = path.join(path.dirname(laneDir), `${job.id}.request.json`);
    const req = readJson(reqFile);
    const dest = path.join(runDir, 'out', `${job.id}.png`);
    const native = map[i].native;
    if (!fs.existsSync(dest) && native && fs.existsSync(native)) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(native, dest);
      if (sha256(fs.readFileSync(dest)) !== sha256(fs.readFileSync(native))) throw new Error(`copy of ${native} does not match`);
    }
    let output = null;
    if (fs.existsSync(dest)) {
      const buf = fs.readFileSync(dest);
      const info = pngInfo(buf);
      output = {
        path: rel(dest), sha256: sha256(buf), width: info?.width ?? null, height: info?.height ?? null,
        alpha: info ? await realAlpha(buf, info) : null, bytes: buf.length,
        fitsCanvas: info ? Math.abs(info.width / info.height - req.canvas.w / req.canvas.h) <= 0.05 : false,
        native: native ?? null,
      };
    }
    out.push({ id: job.id, request: rel(reqFile), scene: req.scene, box: req.box, kind: job.transparent_background ? 'agent' : 'plate', canvas: req.canvas, references: req.references ?? [], output, review: null, registration: null });
  }
  const manifest = { schema: 'comic-lane/1', lane: rel(laneDir), run: rel(runDir), threadId: receipt.threadId ?? null, exitCode: receipt.exitCode ?? null, promptSha256: receipt.promptSha256 ?? null, startedAt: receipt.startedAt ?? null, finishedAt: receipt.finishedAt ?? null, jobs: out };
  fs.writeFileSync(path.join(runDir, 'lane-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))) {
  const a = process.argv.slice(2);
  const i = a.indexOf('--run');
  if (i < 0 || !a[i + 1]) { console.error('usage: lane-manifest.mjs --run <runDir> [--json]'); process.exit(2); }
  try {
    const m = await buildLaneManifest(a[i + 1]);
    if (a.includes('--json')) console.log(JSON.stringify(m, null, 2));
    else for (const j of m.jobs) console.log(`${j.id}\t${j.output ? `${j.output.width}x${j.output.height} alpha=${j.output.alpha} fits=${j.output.fitsCanvas}` : 'NO IMAGE'}`);
    process.exit(m.jobs.some((j) => !j.output) ? 1 : 0);
  } catch (e) { console.error(e.message); process.exit(1); }
}
