// Comic box briefs (skill: mtw-comic-story). Turns a scene plan into per-box generation requests, prompts and Codex lanes.
// Usage: node scripts/comics/box-briefs.mjs --story <slug|path> --scene <id> --plan <scene-plan.json> --out <dir>
//          [--lanes 2] [--style-ref <png>]... [--characters <json>] [--manifest <json>] [--library <dir>]
// Writes <img>.request.json, <img>.prompt.txt, lane-NN/{job.json,lane-prompt.md}, lanes.json. Exit 0 ok, 1 missing reference, 2 usage.
import fs from 'node:fs';
import path from 'node:path';
import { loadStory, storyPathFor, boxAspect, canvasFor, sha256File, sha256, REPO, rel, abs } from './lib/story.mjs';

const FRAGMENTS = path.join(REPO, '.claude', 'skills', 'mtw-comic-story', 'scripts', 'art', 'prompt-fragments.default.md');
const FRAG_NAMES = ['style95', 'ink-plate', 'copy-rules', 'box-defects'];
const MAX_REFS = 5;
const STYLE_ROLE = 'style and ink reference only; never copy its characters, marks or words';
const fwd = (p) => p.replaceAll('\\', '/');

function fragments() {
  const text = fs.readFileSync(FRAGMENTS, 'utf8'), out = {};
  for (const m of text.matchAll(/```fragment:([\w-]+)\s*\n([\s\S]*?)```/g)) out[m[1]] = m[2].trim();
  for (const n of FRAG_NAMES) if (!out[n]) throw new Error(`fragment ${n} missing from ${FRAGMENTS}`);
  return out;
}

function castRef(id, chars, manifest, library) {
  const c = chars.characters.find((x) => x.id === id || (x.aliases || []).includes(id));
  if (!c) return { error: `${id}: not in characters.json` };
  const rec = manifest.records.find((r) => r.id === c.modelRecord);
  if (!rec) return { error: `${id}: model record ${c.modelRecord} not in manifest` };
  const t = rec.treatments?.['comic-ink'] ?? Object.values(rec.treatments || {}).find((x) => x.path && x.path.endsWith('.png'));
  if (!t || !t.path) return { error: `${id}: record ${c.modelRecord} has no png treatment` };
  const file = path.join(library, t.path);
  if (!fs.existsSync(file)) return { error: `${id}: reference file missing: ${fwd(file)}` };
  return { name: c.name, group: c.group, file };
}
const refEntry = (file, role) => ({ path: rel(file), sha256: sha256File(file), role });
const identity = (name) => `identity authority: ${name}, do not transfer other characters`;

function boxPrompt(frag, img, b, canvas, aspect, plan, refNumber) {
  const L = [frag.style95, frag['ink-plate'], frag['copy-rules'], frag['box-defects'], ''];
  L.push(`IMAGE ${img}`, `comic box art, full bleed, for a box of aspect ${aspect.toFixed(2)}:1 (${canvas.words}).`);
  if (plan.place || plan.time) L.push(`Place and time: ${[plan.place, plan.time].filter(Boolean).join('; ')}.`);
  L.push(`Camera: ${b.camera}.`);
  L.push(`Action${b.motion && b.motion !== 'still' ? ' (caught mid-movement)' : ''}: ${b.action}`);
  for (const s of b.subjects || []) L.push(`Image ${refNumber[s.cast] ?? '?'} is the identity authority for ${s.name || s.cast}: ${s.doing}, ${s.where}.`);
  for (const s of b.surfaces || []) L.push(`${s.object}: camera ${s.camera}; its information side faces ${s.reader}; it shows ${s.shows}.`);
  if (b.clearArea) L.push(`Keep the ${b.clearArea} part of the frame as simple low-detail background for lettering added later; no faces, hands or evidence there.`);
  const sfx = (b.sound?.sfx || []).map((e) => `the source of the ${e.kind} sound`);
  const ev = [b.sound?.room && `the room tone's source (${b.sound.room})`, ...sfx].filter(Boolean);
  if (ev.length) L.push(`Sound events that must be visible: ${ev.join('; ')}.`);
  if (b.notes) L.push(b.notes);
  L.push('No text, no lettering, no balloons, no captions.');
  return L.join('\n');
}

function planePrompt(frag, img, plane, name) {
  return [frag.style95, frag['ink-plate'], '', `IMAGE ${img}--${plane.id}`,
    `One isolated digital agent, ${name}, as a full-colour comic projection on a fully transparent background (true alpha), portrait canvas 2:3: no scene, no floor, no room, no shadow, no frame.`,
    `Image 1 is the identity authority for ${name}: same face, costume, proportions and colours. Image 2 is style reference only. ${plane.what || ''}`.trim(),
    'Show the complete figure with a margin of empty transparent space around it; nothing cropped.',
    'No text, no glow halo, no bloom, no ghost fade: the projection effect is added later by the website.'].join('\n');
}

function laneText(lane, jobs) {
  // String.raw keeps backslashes; a backtick or ${ inside a prompt is re-emitted through a substitution so the text stays exact.
  const lit = (s) => s.replace(/`|\$\{/g, (m) => (m === '`' ? '${"`"}' : '${"${"}'));
  const body = jobs.map((j) => `  { id: ${JSON.stringify(j.id)}, size: ${JSON.stringify(j.size)}, t: ${j.transparent_background}, refs: ${JSON.stringify(j.referenced_image_paths)}, prompt: String.raw\`${lit(j.prompt)}\` },`).join('\n');
  return `You are an image-generation worker for a comic. Your shell does not work on this machine; do not use it. Use only your JavaScript exec tool and the built-in image tool tools.image_gen__imagegen.

Run the JavaScript program below in ONE exec call, copying it exactly. Every prompt string is byte for byte; never add, change or shorten prompt text. Never retry a call that returned an image.

\`\`\`js
const jobs = [
${body}
];
const out = [];
for (const j of jobs) {
  try {
    const r = await tools.image_gen__imagegen({ prompt: j.prompt, referenced_image_paths: j.refs, transparent_background: j.t });
    out.push({ id: j.id, ok: true, path: (r && (r.savedPath || (r.output && r.output.savedPath))) || '' });
  } catch (e) { out.push({ id: j.id, ok: false, path: '' }); }
}
console.log(JSON.stringify(out));
\`\`\`

Finish with a final message that is ONLY a JSON array, one object per job in job order: [{"id":"<jobId>","ok":true,"path":"<returned image path or empty>"}]. Lane ${lane}: jobs ${jobs.map((j) => j.id).join(', ')}.
`;
}

export function build(opt) {
  const { story, storySha256 } = loadStory(opt.storyFile);
  const scene = story.scenes.find((s) => s.id === opt.scene);
  if (!scene) throw new Error(`scene ${opt.scene} not found`);
  const planText = fs.readFileSync(opt.plan, 'utf8'), plan = JSON.parse(planText), planSha256 = sha256(planText);
  const chars = JSON.parse(fs.readFileSync(opt.characters, 'utf8')), manifest = JSON.parse(fs.readFileSync(opt.manifest, 'utf8'));
  const frag = fragments();
  const styleRefs = [...(plan.styleRefs || []), ...opt.styleRefs].map(abs);
  const errors = styleRefs.filter((f) => !fs.existsSync(f)).map((f) => `style reference missing: ${fwd(f)}`);
  const styleRefsOk = styleRefs.filter((f) => fs.existsSync(f));
  const requests = [];
  for (const panel of scene.panels.filter((p) => !p.host)) {
    const img = panel.img ?? panel.id, b = plan.boxes?.[img];
    if (!b) { errors.push(`plan has no entry for box ${img}`); continue; }
    const speakers = (panel.balloons || []).map((x) => x.who);
    const cast = [...new Set((b.subjects || []).map((s) => s.cast))].sort((x, y) => speakers.includes(y) - speakers.includes(x));
    const refs = {};
    for (const id of cast) { const r = castRef(id, chars, manifest, opt.library); if (r.error) errors.push(`${img}: ${r.error}`); else refs[id] = r; }
    const room = MAX_REFS - Math.min(styleRefsOk.length, 1);
    const kept = Object.keys(refs).slice(0, room), dropped = Object.keys(refs).slice(room);
    const references = [...kept.map((id) => refEntry(refs[id].file, identity(refs[id].name))),
      ...styleRefsOk.slice(0, MAX_REFS - kept.length).map((f) => refEntry(f, STYLE_ROLE))];
    const refNumber = Object.fromEntries(kept.map((id, i) => [id, i + 1]));
    const canvas = canvasFor(panel.r), aspect = boxAspect(panel.r);
    const subjects = (b.subjects || []).map((s) => ({ ...s, name: refs[s.cast]?.name }));
    requests.push({ id: img, transparent: false, canvas, prompt: boxPrompt(frag, img, { ...b, subjects }, canvas, aspect, plan, refNumber),
      request: { schema: 'comic-request/1', slug: story.id, scene: scene.id, box: img, r: panel.r, aspect, canvas, alt: panel.alt,
        balloons: (panel.balloons || []).map(({ who, text, kind }) => ({ who, text, kind })), plan: b, references, ...(dropped.length ? { droppedReferences: dropped } : {}), storySha256, planSha256 } });
    for (const pl of (b.planes || []).filter((x) => x.role === 'agents')) {
      const who = pl.cast || kept.find((id) => refs[id].group !== 'mentor') || kept[0];
      const ref = refs[who];
      if (!ref) { errors.push(`${img}--${pl.id}: no agent reference`); continue; }
      const c = { size: '1024x1536', words: 'portrait canvas 2:3', w: 1024, h: 1536 };
      const references = [refEntry(ref.file, identity(ref.name)), ...styleRefsOk.slice(0, 1).map((f) => refEntry(f, STYLE_ROLE))];
      requests.push({ id: `${img}--${pl.id}`, transparent: true, canvas: c, prompt: planePrompt(frag, img, pl, ref.name),
        request: { schema: 'comic-request/1', slug: story.id, scene: scene.id, box: img, plane: pl.id, r: panel.r, aspect: 2 / 3, canvas: c, alt: pl.what || '', balloons: [], plan: pl, transparent_background: true, references, storySha256, planSha256 } });
    }
  }
  if (errors.length) return { errors };
  fs.mkdirSync(opt.out, { recursive: true });
  for (const r of requests) {
    fs.writeFileSync(path.join(opt.out, `${r.id}.request.json`), JSON.stringify(r.request, null, 2) + '\n');
    fs.writeFileSync(path.join(opt.out, `${r.id}.prompt.txt`), r.prompt + '\n');
  }
  const lanes = [];
  for (let i = 0; i < requests.length; i += opt.lanes) {
    const n = String(lanes.length + 1).padStart(2, '0'), dir = path.join(opt.out, `lane-${n}`);
    fs.mkdirSync(dir, { recursive: true });
    const jobs = requests.slice(i, i + opt.lanes).map((r) => ({ id: r.id, size: r.canvas.size, transparent_background: r.transparent,
      referenced_image_paths: r.request.references.map((x) => fwd(abs(x.path))), promptFile: fwd(path.resolve(opt.out, `${r.id}.prompt.txt`)) }));
    // Embed the prompt exactly as read back from its file.
    const full = jobs.map((j) => ({ ...j, prompt: fs.readFileSync(j.promptFile, 'utf8') }));
    fs.writeFileSync(path.join(dir, 'job.json'), JSON.stringify(jobs, null, 2) + '\n');
    fs.writeFileSync(path.join(dir, 'lane-prompt.md'), laneText(n, full));
    lanes.push({ lane: n, dir: fwd(dir), jobs: jobs.map((j) => j.id) });
  }
  fs.writeFileSync(path.join(opt.out, 'lanes.json'), JSON.stringify({ slug: story.id, scene: scene.id, lanes }, null, 2) + '\n');
  return { requests, lanes, errors };
}

function main() {
  const a = process.argv.slice(2), opt = { styleRefs: [], lanes: 2 };
  const flags = { '--story': 'story', '--scene': 'scene', '--plan': 'plan', '--out': 'out', '--lanes': 'lanes', '--characters': 'characters', '--manifest': 'manifest', '--library': 'library' };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--style-ref' && a[i + 1]) opt.styleRefs.push(a[++i]);
    else if (flags[a[i]] && a[i + 1] !== undefined) opt[flags[a[i]]] = a[++i];
    else { console.error(`unknown argument ${a[i]}`); process.exit(2); }
  }
  if (!opt.story || !opt.scene || !opt.plan || !opt.out) { console.error('usage: node scripts/comics/box-briefs.mjs --story <slug|path> --scene <id> --plan <scene-plan.json> --out <dir> [--lanes 2] [--style-ref <png>]...'); process.exit(2); }
  opt.lanes = Math.max(1, Number(opt.lanes));
  opt.storyFile = /[\\/]|\.ts$/.test(opt.story) ? path.resolve(opt.story) : storyPathFor(opt.story);
  opt.plan = path.resolve(opt.plan); opt.out = path.resolve(opt.out);
  opt.characters = path.resolve(opt.characters ?? path.join(REPO, 'wiki', 'comics-library', 'characters.json'));
  opt.manifest = path.resolve(opt.manifest ?? path.join(REPO, 'wiki', 'image-library', 'manifest.json'));
  opt.library = path.resolve(opt.library ?? path.join(REPO, 'wiki', 'image-library'));
  const res = build(opt);
  if (res.errors.length) { res.errors.forEach((e) => console.error(`error: ${e}`)); process.exit(1); }
  console.log('request'.padEnd(36) + 'canvas'.padEnd(11) + 'refs  lane');
  res.requests.forEach((r) => console.log(r.id.padEnd(36) + r.canvas.size.padEnd(11) + String(r.request.references.length).padEnd(6) + res.lanes.find((l) => l.jobs.includes(r.id)).lane));
  console.log(`${res.requests.length} requests in ${res.lanes.length} lanes -> ${fwd(opt.out)}`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))) main();
