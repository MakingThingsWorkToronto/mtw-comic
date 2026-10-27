// Comic build ledger (protocol: scripts/comics/README.md). One JSON file per build records what each scene and box has
// reached, so a run can stop and resume, and so a reviewer can see what was actually done rather than declared.
// Home: wiki/comics-library/records/<slug>-build-<buildId>/state.json (data only; Studio reads it).
import fs from 'node:fs';
import path from 'node:path';
import { REPO } from './story.mjs';

export const STAGES = ['planned', 'generated', 'reviewed', 'planes', 'lettered', 'sounded', 'bound', 'registered', 'framed', 'accepted', 'blocked'];

export const ledgerDir = (slug, buildId) => path.join(REPO, 'wiki', 'comics-library', 'records', `${slug}-build-${buildId}`);
export const ledgerPath = (slug, buildId) => path.join(ledgerDir(slug, buildId), 'state.json');
export const transportDir = (slug, buildId) => path.join(REPO, '.codex', 'worktrees', `comic-build-${slug}-${buildId}`);

export function openLedger(slug, buildId, init = {}) {
  const file = ledgerPath(slug, buildId);
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const state = { schema: 'comic-build/1', slug, buildId, createdAt: init.now ?? null, storyPath: init.storyPath ?? null, storySha256: null, stage: 'story', story: { status: 'draft', coldRead: null, approved: null }, scenes: {}, notes: [], ...init };
  writeLedger(state);
  return state;
}
export function writeLedger(state) {
  const file = ledgerPath(state.slug, state.buildId);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2) + '\n');
  fs.renameSync(tmp, file);
  return file;
}
/** Set a dotted path (e.g. "scenes.quote.boxes.quote-open.status") to a value and save. */
export function setPath(state, dotted, value) {
  const keys = dotted.split('.');
  let o = state;
  for (const k of keys.slice(0, -1)) o = o[k] ??= {};
  o[keys.at(-1)] = value;
  writeLedger(state);
  return state;
}
export function getPath(state, dotted) {
  return dotted.split('.').reduce((o, k) => (o == null ? undefined : o[k]), state);
}
export function sceneState(state, sceneId) {
  return (state.scenes[sceneId] ??= { status: 'pending', plan: null, boxes: {}, planes: [], registered: null, frames: null, review: null, attempts: 0 });
}
export function boxState(state, sceneId, img) {
  const s = sceneState(state, sceneId);
  return (s.boxes[img] ??= { status: 'pending', attempts: [], selected: null, review: null, faces: null, planes: [], lettering: null, sound: null });
}
export function note(state, text, now = null) {
  state.notes.push({ at: now, text });
  writeLedger(state);
}

// CLI: node scripts/comics/lib/ledger.mjs <slug> <buildId> get <dotted> | set <dotted> <json> | open [storyPath] | note "<text>"
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))) {
  const [slug, buildId, cmd, a, b] = process.argv.slice(2);
  if (!slug || !buildId || !cmd) { console.error('usage: ledger.mjs <slug> <buildId> open [storyPath] | get <dotted> | set <dotted> <json> | note "<text>"'); process.exit(2); }
  const state = openLedger(slug, buildId, cmd === 'open' && a ? { storyPath: a } : {});
  if (cmd === 'open') console.log(ledgerPath(slug, buildId));
  else if (cmd === 'get') console.log(JSON.stringify(getPath(state, a) ?? null, null, 2));
  else if (cmd === 'set') { setPath(state, a, JSON.parse(b)); console.log('ok'); }
  else if (cmd === 'note') { note(state, a); console.log('ok'); }
  else { console.error(`unknown command ${cmd}`); process.exit(2); }
}
