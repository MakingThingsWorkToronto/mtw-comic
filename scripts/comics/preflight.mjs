#!/usr/bin/env node
// Comic build preflight (skill: mtw-comic-story; protocol: scripts/comics/README.md).
// Usage: node scripts/comics/preflight.mjs --slug <registry-slug> --build <buildId> [--origin http://127.0.0.1:8787] [--json]
// Required checks fail the run (exit 1): codex, python PIL/numpy, sharp/playwright, story file + registry, disk >= 5 GB,
// transport dir and ledger. Optional checks only warn: reader page, Studio, dirty story/art files, STATUS ownership.
// The report is recorded in the ledger at "preflight". Exit 0 ok, 1 required check failed, 2 usage.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { REPO, loadStory, storyPathFor, rel } from './lib/story.mjs';
import { openLedger, setPath, transportDir } from './lib/ledger.mjs';

const GB = 1024 ** 3;
const INDEX = path.join(REPO, 'site', 'src', 'data', 'comic-stories', 'index.ts');
const sh = (cmd, args) => spawnSync(cmd, args, { encoding: 'utf8', shell: process.platform === 'win32', timeout: 60000 });

/** Registry slug -> story file (via the index.ts line with that slug), falling back to <slug>.ts. */
export function resolveStoryFile(slug, indexText) {
  const line = indexText.split('\n').find((l) => l.includes(`slug: '${slug}'`));
  const name = line && line.match(/story:\s*(\w+)/)?.[1];
  const imp = name && indexText.match(new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*'\\./([^']+)'`));
  return imp ? path.join(path.dirname(INDEX), `${imp[1]}.ts`) : storyPathFor(slug);
}
export const slugInRegistry = (slug, indexText) => indexText.includes(`slug: '${slug}'`);
/** Parse free bytes from PowerShell/wmic output (first run of 4+ digits). */
export function parseFreeBytes(text) {
  const m = String(text).match(/\d{4,}/);
  return m ? Number(m[0]) : null;
}
/** Lines in the first `n` lines of a STATUS file that mention any of the needles. */
export function statusOwnership(file, needles, n = 40) {
  if (!fs.existsSync(file)) return [];
  const lines = fs.readFileSync(file, 'utf8').split('\n').slice(0, n);
  return lines.filter((l) => needles.some((x) => x && l.includes(x))).map((l) => l.trim());
}
function freeBytes() {
  if (typeof fs.statfsSync === 'function') { const s = fs.statfsSync(REPO); return Number(s.bavail) * Number(s.bsize); }
  const drive = path.parse(REPO).root[0];
  const r = sh('powershell', ['-NoProfile', '-Command', `"(Get-PSDrive ${drive}).Free"`]);
  return parseFreeBytes(r.stdout);
}
async function get(url, ms = 5000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try { const r = await fetch(url, { signal: ac.signal }); return { status: r.status, text: await r.text() }; }
  finally { clearTimeout(t); }
}

async function main() {
  const args = process.argv.slice(2);
  const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i > -1 ? args[i + 1] : d; };
  const slug = opt('slug'), build = opt('build'), origin = opt('origin', 'http://127.0.0.1:8787'), json = args.includes('--json');
  if (!slug || !build) { console.error('usage: preflight.mjs --slug <slug> --build <buildId> [--origin url] [--json]'); return 2; }
  const checks = [];
  const check = async (name, required, fn) => {
    try { const r = await fn(); checks.push({ name, ok: r.ok, required, detail: r.detail }); }
    catch (e) { checks.push({ name, ok: false, required, detail: String(e.message || e).split('\n')[0] }); }
  };
  const indexText = fs.readFileSync(INDEX, 'utf8');
  const storyFile = resolveStoryFile(slug, indexText);
  let storyId = slug;

  await check('codex', true, () => { const r = sh('codex', ['--version']); return { ok: r.status === 0, detail: (r.stdout || r.stderr || '').trim().split('\n')[0] }; });
  await check('python PIL+numpy', true, () => { const r = sh('python', ['-c', '"import PIL, numpy"']); return { ok: r.status === 0, detail: r.status === 0 ? 'ok' : (r.stderr || 'failed').trim().split('\n').pop() }; });
  for (const mod of ['sharp', 'playwright']) await check(`site/node_modules/${mod}`, true, () => { const ok = fs.existsSync(path.join(REPO, 'site', 'node_modules', mod)); return { ok, detail: ok ? 'present' : 'missing' }; });
  await check('story file loads', true, () => { const s = loadStory(storyFile); storyId = s.story.id ?? slug; return { ok: true, detail: `${rel(storyFile)} id=${storyId} scenes=${s.story.scenes.length}` }; });
  await check('slug in registry', true, () => ({ ok: slugInRegistry(slug, indexText), detail: `slug '${slug}' in index.ts` }));
  // --min-disk-gb lowers the floor for stages that write nothing large (the story stage); image lanes need the default 5.
  const minGb = Number(process.argv[process.argv.indexOf('--min-disk-gb') + 1]) || 5;
  await check(`free disk >= ${minGb} GB`, true, () => { const f = freeBytes(); return { ok: f != null && f >= minGb * GB, detail: f == null ? 'unknown' : `${(f / GB).toFixed(1)} GB free` }; });
  await check('transport dir + ledger', true, () => {
    const t = transportDir(slug, build); fs.mkdirSync(t, { recursive: true });
    const st = openLedger(slug, build, { storyPath: rel(storyFile) });
    return { ok: !!st && fs.existsSync(t), detail: rel(t) };
  });
  await check('reader page', false, async () => {
    const r = await get(`${origin}/comics/${slug}/`);
    const has = r.text.includes('id="comic-story"');
    return { ok: r.status === 200 && has, detail: `${r.status}${has ? '' : ' no #comic-story'}` };
  });
  await check('Studio 8788', false, async () => { const r = await get('http://127.0.0.1:8788/'); return { ok: r.status > 0, detail: String(r.status) }; });
  await check('git clean (story + art)', false, () => {
    const r = sh('git', ['status', '--porcelain', '--', rel(storyFile), `site/public/comic/${storyId}/`]);
    const dirty = (r.stdout || '').split('\n').filter(Boolean);
    return { ok: dirty.length === 0, detail: dirty.length ? `dirty: ${dirty.join('; ')}` : 'clean' };
  });
  await check('STATUS ownership', false, () => {
    const hits = statusOwnership(path.join(REPO, 'discussion', 'handoff', 'STATUS.md'), [slug, storyId]);
    return { ok: hits.length === 0, detail: hits.length ? `another session may own this issue: ${hits[0].slice(0, 200)}` : 'no mention' };
  });

  const failed = checks.filter((c) => c.required && !c.ok);
  const report = { schema: 'comic-preflight/1', slug, build, origin, ok: failed.length === 0, checks };
  try { setPath(openLedger(slug, build, {}), 'preflight', report); } catch (e) { report.ledgerError = String(e.message); }
  if (json) console.log(JSON.stringify(report, null, 2));
  else for (const c of checks) console.log(`${c.ok ? 'ok  ' : c.required ? 'FAIL' : 'warn'} ${c.name}: ${c.detail}`);
  return report.ok ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))) {
  main().then((c) => process.exit(c), (e) => { console.error(e); process.exit(2); });
}
