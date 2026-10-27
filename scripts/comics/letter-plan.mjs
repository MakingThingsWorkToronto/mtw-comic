// Place every balloon of one scene from measured data (positions only). Skill: mtw-comic-story; protocol: scripts/comics/README.md.
//   node scripts/comics/letter-plan.mjs --slug <registry slug|story id> --build <buildId> --scene <id> [--dry-run] [--json]
//        [--story <file>] [--ledger-root <dir> | env MTW_LEDGER_ROOT]   (the last two redirect files, for tests)
// Reads boxState(...).faces/selected (art reviewer) and sceneState(...).plan.boxes[img].clearArea from the build ledger.
// Writes x, y, w, tail and phone{x,y,w,tail} on each balloon via saveStory, and <ledger>/lettering/<scene>.json.
// Never touches text, who, kind, state, em, speech, order or count. Exit 0 ok, 1 a balloon cannot be placed, 2 usage/input error.
import fs from 'node:fs';
import path from 'node:path';
import { loadStory, saveStory, storyPathFor, rel, abs } from './lib/story.mjs';
import { openLedger, writeLedger, sceneState, boxState, ledgerDir } from './lib/ledger.mjs';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const r3 = (v) => Math.round(v * 1000) / 1000;
const E = 1e-6;
const hit = (a, b) => a.x < b.x + b.w - E && b.x < a.x + a.w - E && a.y < b.y + b.h - E && b.y < a.y + a.h - E;
const grow = (f, g) => ({ x: f.x - g, y: f.y - g, w: f.w + 2 * g, h: f.h + 2 * g });
const GAP = 0.02, STEP = 0.02;
// [x0, y0, x1, y1, stack direction, horizontal start side]
const BANDS = { top: [.02, .02, .98, .4, 'down', 'L'], bottom: [.02, .6, .98, .98, 'up', 'L'], left: [.02, .02, .5, .98, 'down', 'L'], right: [.5, .02, .98, .98, 'down', 'R'],
  'top left': [.02, .02, .5, .5, 'down', 'L'], 'top right': [.5, .02, .98, .5, 'down', 'R'], 'bottom left': [.02, .5, .5, .98, 'up', 'L'], 'bottom right': [.5, .5, .98, .98, 'up', 'R'] };

function wrap(text, cpl) {
  const lines = [];
  for (const part of String(text).split('\n')) {
    let cur = '';
    for (const word of part.split(/\s+/).filter(Boolean)) {
      if (cur && (cur + ' ' + word).length > cpl) { lines.push(cur); cur = word; } else cur = cur ? cur + ' ' + word : word;
    }
    lines.push(cur);
  }
  return lines;
}
const isCap = (b) => b.kind === 'caption' || b.kind === 'place';
function size(b, lineH, wScale = 1) {
  const w0 = isCap(b) ? (b.sceneSetup ? 0.5 : b.characterIntro ? 0.34 : 0.4) : null;
  const lines = wrap(b.text, w0 ? Math.floor(w0 * 30) : 9);
  const longest = Math.max(...lines.map((l) => l.length));
  const w = w0 ?? Math.min(0.34, Math.max(0.18, 0.045 * longest));
  return { w: r3(Math.min(0.6, w * wScale)), h: r3(lines.length * lineH + 0.03) };
}
const priority = (b) => (b.kind === 'place' ? 0 : b.characterIntro ? 1 : b.sceneSetup ? 2 : isCap(b) ? 3 : 4);

// Lay out items [{b, i, w, h}] in one box. Returns { pos: {index: rect}, errors: [index], warnings: [] }.
function layout(items, faces, clearArea) {
  const out = { pos: {}, errors: [], warnings: [] };
  const placed = [], cursors = {}, corners = {};
  const fr = faces.map((f) => grow(f.rect, 0.04));
  const clear = (r, others) => !fr.some((f) => hit(r, f)) && !others.some((o) => hit(r, o));
  const dist = (r, f) => Math.hypot(r.x + r.w / 2 - (f.rect.x + f.rect.w / 2), r.y + r.h / 2 - (f.rect.y + f.rect.h / 2));
  const cornerRect = (name, it) => {
    const used = corners[name] ?? 0;
    const right = name.includes('right'), bottom = name.includes('bottom');
    return { x: right ? 1 - it.w - 0.02 : 0.02, y: bottom ? 1 - it.h - 0.02 - used : 0.02 + used, w: it.w, h: it.h };
  };
  const putCorner = (name, it) => {
    const r = cornerRect(name, it);
    corners[name] = (corners[name] ?? 0) + it.h + GAP;
    if (!clear(r, [])) out.warnings.push(`balloon ${it.i} (${it.b.kind}) in the ${name} corner touches a face`);
    return r;
  };
  const bandDist = (n) => {
    const [x0, y0, x1, y1] = BANDS[n];
    const r = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    return faces.length ? Math.min(...faces.map((f) => dist(r, f))) : 0;
  };
  // The requested band first, then the others, farthest from any face first.
  const bandNames = [clearArea, ...Object.keys(BANDS).filter((n) => n !== clearArea).sort((a, b) => bandDist(b) - bandDist(a))];
  const order = [...items].sort((a, b) => priority(a.b) - priority(b.b) || a.i - b.i);
  for (const it of order) {
    const b = it.b;
    let r = null;
    if (b.kind === 'place') r = putCorner('top left', it);
    else if (b.sceneSetup) r = putCorner('bottom right', it);
    else if (b.characterIntro) {
      const face = faces.find((f) => f.cast === b.who);
      const score = (n) => { const c = cornerRect(n, it); return (face ? dist(c, face) : 0) - (fr.some((f) => hit(c, f)) ? 10 : 0); };
      r = putCorner(['top left', 'top right', 'bottom left', 'bottom right'].sort((a, c) => score(c) - score(a))[0], it);
    } else if (isCap(b)) r = putCorner('top left', it);
    else {
      for (const name of bandNames) {
        const [x0, y0, x1, y1, dir, side] = BANDS[name];
        if (it.w > x1 - x0) continue;
        const gap = b.chain ? 0.01 : GAP;
        const xs = []; for (let x = x0; x + it.w <= x1 + 1e-9; x += STEP) xs.push(x);
        if (side === 'R') xs.reverse();
        for (let y = cursors[name] ?? (dir === 'down' ? y0 : y1 - it.h); y >= y0 - 1e-9 && y + it.h <= y1 + 1e-9 && !r; y += dir === 'down' ? STEP : -STEP) {
          const x = xs.find((cx) => clear({ x: cx, y, w: it.w, h: it.h }, placed));
          if (x != null) r = { x, y, w: it.w, h: it.h };
        }
        if (r) { cursors[name] = dir === 'down' ? r.y + it.h + gap : r.y - gap - it.h; break; }
      }
    }
    if (!r) { out.errors.push(it.i); continue; }
    r = { x: r3(r.x), y: r3(r.y), w: r.w, h: r.h };
    placed.push(r);
    out.pos[it.i] = r;
  }
  return out;
}

function tailFor(b, r, faces) {
  if (isCap(b) || b.chain || b.across) return undefined;
  const mouth = faces.find((f) => f.cast === b.who)?.mouth;
  if (mouth) return mouth;
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  if (b.state === 'offpanel') return [[cx, [0, cy]], [1 - cx, [1, cy]], [cy, [cx, 0]], [1 - cy, [cx, 1]]].sort((a, c) => a[0] - c[0])[0][1].map(r3);
  if (!faces.length) return b.tail;
  const d = (q) => Math.hypot(q.rect.x + q.rect.w / 2 - cx, q.rect.y + q.rect.h / 2 - cy);
  const f = [...faces].sort((a, c) => d(a) - d(c))[0];
  return [r3(f.rect.x + f.rect.w / 2), r3(f.rect.y + f.rect.h / 2)];
}

function resolveStoryFile(slug) {
  if (fs.existsSync(storyPathFor(slug))) return storyPathFor(slug);
  const dir = path.dirname(storyPathFor('x'));
  const index = fs.readFileSync(path.join(dir, 'index.ts'), 'utf8');
  const line = index.split('\n').find((l) => l.includes(`slug: '${slug}'`) && /story:\s*\w+Comic/.test(l));
  const name = line?.match(/story:\s*(\w+Comic)/)?.[1];
  const imp = name && index.match(new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*'\\./([^']+)'`));
  if (!imp) throw new Error(`cannot resolve story for slug ${slug}`);
  return path.join(dir, imp[1].endsWith('.ts') ? imp[1] : `${imp[1]}.ts`);
}

function main() {
  const a = process.argv.slice(2);
  const opt = (n) => { const i = a.indexOf(`--${n}`); return i >= 0 ? a[i + 1] : undefined; };
  const slug = opt('slug'), build = opt('build'), sceneId = opt('scene');
  if (!slug || !build || !sceneId) { console.error('usage: letter-plan.mjs --slug <slug> --build <id> --scene <id> [--dry-run] [--json]'); return 2; }
  const dry = a.includes('--dry-run'), json = a.includes('--json');
  const root = opt('ledger-root') ?? process.env.MTW_LEDGER_ROOT;
  const loaded = loadStory(opt('story') ? abs(opt('story')) : resolveStoryFile(slug));
  const scene = loaded.story.scenes.find((s) => s.id === sceneId);
  if (!scene) { console.error(`scene ${sceneId} not found`); return 2; }
  const dir = root ? path.join(path.resolve(root), `${slug}-build-${build}`) : ledgerDir(slug, build);
  const stateFile = path.join(dir, 'state.json');
  const state = root
    ? (fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : { schema: 'comic-build/1', slug, buildId: build, scenes: {}, notes: [] })
    : openLedger(slug, build);
  const plan = sceneState(state, sceneId).plan;
  const report = { scene: sceneId, boxes: {} };
  let failed = 0;
  for (const panel of scene.panels) {
    const img = panel.img ?? panel.id;
    if (!panel.balloons?.length) continue;
    const bs = boxState(state, sceneId, img);
    const ar = bs.selected?.ar ?? [0, 0, 1, 1];
    const cv = (v, i) => clamp((v - ar[i]) / ar[i + 2], 0, 1);
    const faces = (bs.faces ?? []).map((f) => {
      const x0 = cv(f.face[0], 0), y0 = cv(f.face[1], 1), x1 = cv(f.face[0] + f.face[2], 0), y1 = cv(f.face[1] + f.face[3], 1);
      return { cast: f.cast, mouth: f.mouth ? [r3(cv(f.mouth[0], 0)), r3(cv(f.mouth[1], 1))] : undefined, rect: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } };
    });
    const clearArea = BANDS[plan?.boxes?.[img]?.clearArea] ? plan.boxes[img].clearArea : 'top';
    const lineH = clamp(0.075 * (0.5 / panel.r[3]), 0.06, 0.2);
    const items = panel.balloons.map((b, i) => ({ b, i, ...size(b, lineH) }));
    const res = layout(items, faces, clearArea);
    const warnings = [...res.warnings];
    for (const i of res.errors) { failed++; warnings.push(`ERROR: balloon ${i} does not fit in box ${img} (${clearArea})`); }
    // Phone: same band, wider balloons in a narrow box, line height scaled by the phone box height.
    const pr = (scene.phonePages ?? []).flat().find((e) => e.img === img)?.r;
    let phone = null;
    if (pr) {
      const narrow = (pr[2] * 9) / (pr[3] * 16) < 0.9;
      const pLine = clamp(lineH * (panel.r[3] * 9) / (pr[3] * 16), 0.04, 0.3);
      const pItems = panel.balloons.map((b, i) => ({ b, i, ...size(b, pLine, narrow && !isCap(b) ? 1.5 : 1) }));
      const pres = layout(pItems, faces, clearArea);
      for (const i of pres.errors) warnings.push(`phone: balloon ${i} does not fit in box ${img}; desktop position kept`);
      phone = pItems.map((it) => { const r = pres.pos[it.i] ?? res.pos[it.i]; return r ? { r, w: pres.pos[it.i] ? it.w : r.w } : null; });
    }
    const rows = [];
    panel.balloons.forEach((b, i) => {
      const r = res.pos[i];
      if (!r) { rows.push({ index: i, kind: b.kind, who: b.who, error: true }); return; }
      const tail = tailFor(b, r, faces);
      b.x = r.x; b.y = r.y; b.w = r.w;
      if (tail) b.tail = tail; else if (isCap(b) || b.chain || b.across) delete b.tail;
      let ph = null;
      if (phone?.[i]) {
        const p = phone[i], pt = tailFor(b, p.r, faces);
        ph = { ...(b.phone ?? {}), x: p.r.x, y: p.r.y, w: p.w };
        if (pt) ph.tail = pt; else delete ph.tail;
        b.phone = ph;
      }
      rows.push({ index: i, kind: b.kind, who: b.who, x: r.x, y: r.y, w: r.w, h: r.h, tail: tail ?? null, phone: ph });
    });
    report.boxes[img] = { balloons: rows, faces: faces.map((f) => ({ cast: f.cast, mouth: f.mouth ?? null, rect: f.rect })), clearArea, warnings };
    if (!json) {
      console.log(`${img}: ${rows.length} balloons, ${faces.length} faces, clear ${clearArea}${pr ? ', phone' : ''}${warnings.length ? `, ${warnings.length} warning(s)` : ''}`);
      for (const w of warnings) console.log(`  ${w}`);
    }
  }
  const file = path.join(dir, 'lettering', `${sceneId}.json`);
  if (!dry) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(report, null, 2) + '\n');
    for (const img of Object.keys(report.boxes)) boxState(state, sceneId, img).lettering = { at: null, ok: !failed, file: rel(file) };
    if (root) fs.writeFileSync(stateFile, JSON.stringify(state, null, 2) + '\n'); else writeLedger(state);
    if (!failed) saveStory(loaded);
  }
  if (json) console.log(JSON.stringify({ ...report, ok: !failed, dryRun: dry }, null, 2));
  return failed ? 1 : 0;
}
try { process.exitCode = main(); } catch (e) { console.error(e.message); process.exitCode = 2; }
