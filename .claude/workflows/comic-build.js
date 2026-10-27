export const meta = {
  name: 'comic-build',
  description: 'Build one Comic B issue scene by scene, box by box: story, art lanes through Codex, reviews, planes, lettering, sound, registration, frames',
  whenToUse: 'When a /comics/<slug>/ issue is written or rebuilt. Stage story runs to the human gate; stage scenes builds every scene; stage finish runs the issue checks and build.',
  phases: [
    { title: 'Preflight', detail: 'tools, disk, servers, ownership' },
    { title: 'Story', detail: 'write, check, cold read, gate' },
    { title: 'Scene plan', detail: 'layout, briefs, lanes' },
    { title: 'Art', detail: 'Codex lanes, full-size review' },
    { title: 'Planes', detail: 'cut from the master, projections' },
    { title: 'Lettering and sound', detail: 'place balloons, effects, speech' },
    { title: 'Register and bind', detail: 'library, integration copies, story' },
    { title: 'Frames', detail: 'capture on 8787, review every frame' },
    { title: 'Finish', detail: 'issue checks, build, status' },
  ],
}

// Protocol: scripts/comics/README.md. Pluggable per issue through args:
// { slug, build, stage: 'story'|'scenes'|'finish', scenes?: [ids], maxLanes?: 4, lanes?: 2,
//   codex: { model: 'gpt-6.1-sol', effort: 'low' }, models: { writer, planner, lane, reviewer, letter, sound, bind, frames, judge },
//   approve?: true  // stage scenes only: record Matt's story approval (given in chat) in the ledger before building }
const A = args || {}
if (!A.slug || !A.build) throw new Error('args.slug and args.build are required')
const slug = A.slug, build = A.build, stage = A.stage || 'story'
const M = { writer: 'opus', planner: 'opus', lane: 'sonnet', reviewer: undefined, letter: 'sonnet', sound: 'sonnet', bind: 'sonnet', frames: 'sonnet', judge: undefined, ...(A.models || {}) }
const CODEX = { model: 'gpt-6.1-sol', effort: 'low', timeout: 560, ...(A.codex || {}) }
const MAX_LANES = A.maxLanes || 4
const LEDGER = `wiki/comics-library/records/${slug}-build-${build}/state.json`
const TRANSPORT = `.codex/worktrees/comic-build-${slug}-${build}`
const ctx = `Comic build ${slug} / ${build}. Protocol: scripts/comics/README.md (read it first). Ledger: ${LEDGER}. Transport: ${TRANSPORT}. Work from the repo root C:\\Code\\MTWWebsite-clean. Never commit. Never edit a catalog by hand. Return only the structured result.`
const mo = (model) => (model ? { model } : {})

// Serialize shared resources: the story file (one writer), the registry (one producer), the browser (one browser).
const locks = {}
function withLock(name, fn) {
  const prev = locks[name] || Promise.resolve()
  const next = prev.then(fn, fn)
  locks[name] = next.catch(() => {})
  return next
}

const OK = { type: 'object', properties: { ok: { type: 'boolean' }, summary: { type: 'string' }, errors: { type: 'array', items: { type: 'string' } } }, required: ['ok', 'summary', 'errors'] }
const PLAN = { type: 'object', properties: { ok: { type: 'boolean' }, summary: { type: 'string' }, errors: { type: 'array', items: { type: 'string' } }, boxes: { type: 'array', items: { type: 'string' } }, lanes: { type: 'array', items: { type: 'string' } }, planeBoxes: { type: 'array', items: { type: 'string' } } }, required: ['ok', 'summary', 'errors', 'boxes', 'lanes', 'planeBoxes'] }
const LANE = { type: 'object', properties: { ok: { type: 'boolean' }, run: { type: 'string' }, jobs: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, ok: { type: 'boolean' }, path: { type: 'string' }, fitsCanvas: { type: 'boolean' } }, required: ['id', 'ok'] } }, errors: { type: 'array', items: { type: 'string' } } }, required: ['ok', 'run', 'jobs', 'errors'] }
const REVIEW = { type: 'object', properties: { box: { type: 'string' }, pass: { type: 'boolean' }, failures: { type: 'array', items: { type: 'string' } }, items: { type: 'object' }, speakers: { type: 'array', items: { type: 'object', properties: { cast: { type: 'string' }, mouth: { type: 'array', items: { type: 'number' } }, face: { type: 'array', items: { type: 'number' } } }, required: ['cast', 'mouth', 'face'] } }, clearAreaClear: { type: 'boolean' }, referenceCloseness: { type: 'number' }, correction: { type: 'string' } }, required: ['box', 'pass', 'failures', 'items', 'speakers', 'clearAreaClear', 'referenceCloseness', 'correction'] }
const FRAMES = { type: 'object', properties: { ok: { type: 'boolean' }, summary: { type: 'string' }, defects: { type: 'array', items: { type: 'object', properties: { box: { type: 'string' }, size: { type: 'string' }, moment: { type: 'string' }, defect: { type: 'string' }, fix: { type: 'string', enum: ['lettering', 'art', 'planes', 'sound', 'none'] } }, required: ['box', 'size', 'moment', 'defect', 'fix'] } } }, required: ['ok', 'summary', 'defects'] }
const STORY = { type: 'object', properties: { ok: { type: 'boolean' }, summary: { type: 'string' }, errors: { type: 'array', items: { type: 'string' } }, scenes: { type: 'array', items: { type: 'string' } }, boxes: { type: 'number' }, balloons: { type: 'number' } }, required: ['ok', 'summary', 'errors', 'scenes', 'boxes', 'balloons'] }
const COLD = { type: 'object', properties: { ok: { type: 'boolean' }, answers: { type: 'array', items: { type: 'object', properties: { question: { type: 'string' }, answer: { type: 'string' }, evidence: { type: 'string' }, ok: { type: 'boolean' } }, required: ['question', 'answer', 'evidence', 'ok'] } }, confusions: { type: 'array', items: { type: 'string' } } }, required: ['ok', 'answers', 'confusions'] }

// ---------- Preflight ----------
phase('Preflight')
const pre = await agent(`${ctx}\nRun: node scripts/comics/preflight.mjs --slug ${slug} --build ${build} --json${stage === 'story' ? ' --min-disk-gb 1' : ''}. Return ok = its exit code was 0, summary = one line per failed or warned check, errors = required failures.`, { label: 'preflight', phase: 'Preflight', effort: 'low', schema: OK, ...mo(M.lane) })
if (!pre || !pre.ok) { log(`preflight failed: ${pre ? pre.errors.join('; ') : 'no result'}`); return { stage, ok: false, preflight: pre } }
log(`preflight ok: ${pre.summary}`)

// ---------- Story ----------
if (stage === 'story') {
  phase('Story')
  const brief = A.brief || `Rewrite the issue completely from the A page, the world bible (wiki/site/comic-story.md: Premise, Cast, the eight repair beats and this issue's insertion points) and the cast reference files. Everything from scratch: story, scene count, box count, words.`
  const writerPrompt = (notes) => `${ctx}\nYou are the single story writer. Read scripts/comics/README.md step 1, .claude/skills/mtw-comic-story/references/storytelling.md and story-craft.md, site/src/data/comic-stories/types.ts, and the current story file for ${slug} (resolve it through site/src/data/comic-stories/index.ts). ${brief}\nWrite the new story into that file as the retime({...}) JSON literal, keeping the file's imports and export. Scenes: each a page of 5 to 9 boxes with one dominant box (40-60% of the page), varied geometry on every page (no two pages alike, no equal grids except one rapid scene), complex beats split into more boxes, and a phonePages sheet per scene that tiles every box in order with at least 3 boxes a sheet. Each box: img id, r, alt (what the art shows, one or two sentences, cast by name), balloons with who/kind/state/text (sentence case, at most 12 words, one em) and approximate x/y, sfx on visible events, room where the place changes. Scene: title, place caption, score and room per scene with at least one scene in three without music, villains. One sceneSetup caption in the first box; characterIntro captions on first appearances; hockey names only; villains enter through damage; the ending answers page one. No art bindings (no art, staticArt, views, layers): art comes later. Keep music and soundAssets from the current file unless the brief changes them. Update the NEXT page choices.\nThen run from site/: node scripts/comic-story-check.mjs --story src/data/comic-stories/<file>.ts and node scripts/comic-story-deslop.mjs; and from the repo root: node scripts/comics/layout-check.mjs --story ${slug} and node scripts/comics/audio-coverage.mjs --story ${slug}. Fix every error they report (warnings about unvoiced lines are expected) and rerun until all four pass, at most 4 rounds. Record the story hash in the ledger: node scripts/comics/lib/ledger.mjs ${slug} ${build} set story.status '"checked"'.${notes ? `\nA cold reader could not follow these points; fix them without changing what works: ${notes}` : ''}\nReturn ok (all four checks pass), summary (the story in 8 lines: place, time, protagonist, want, trouble, turn, ending, loss), errors, scenes (ids in order), boxes, balloons.`
  let story = await agent(writerPrompt(''), { label: 'story writer', phase: 'Story', effort: 'high', schema: STORY, ...mo(M.writer) })
  if (!story || !story.ok) return { stage, ok: false, story }
  const coldPrompt = `${ctx}\nYou are a cold reader. Read only the story file for ${slug} (resolve through site/src/data/comic-stories/index.ts) and the acceptance questions in wiki/site/comic-story.md (section "Expert operator and Second Brain story repair", the cold-read acceptance list). Do not read briefs, plans or discussion. Answer each question from the words and alt text alone, citing scene and box ids as evidence. ok = every answer is clear from the story and a first-time reader would follow the plot and know who each person is when they first speak. List confusions: anything you had to guess.`
  let cold = await agent(coldPrompt, { label: 'cold read', phase: 'Story', effort: 'medium', schema: COLD, ...mo(M.judge) })
  if (cold && !cold.ok) {
    log(`cold read found ${cold.confusions.length} confusions; one revision`)
    story = await agent(writerPrompt(cold.confusions.join(' | ')), { label: 'story revision', phase: 'Story', effort: 'high', schema: STORY, ...mo(M.writer) })
    if (!story || !story.ok) return { stage, ok: false, story, cold }
    cold = await agent(coldPrompt, { label: 'cold read 2', phase: 'Story', effort: 'medium', schema: COLD, ...mo(M.judge) })
  }
  await agent(`${ctx}\nWrite wiki/comics-library/records/${slug}-build-${build}/story-review.md for Matt: the story scene by scene (scene id, title, place/time, each box's img and alt in one line, each balloon as "WHO: text"), then the cold-read answers from this JSON: ${JSON.stringify(cold).slice(0, 6000)}. Then: node scripts/comics/lib/ledger.mjs ${slug} ${build} set story.status '"awaiting-approval"' and set story.coldRead '${JSON.stringify({ ok: !!(cold && cold.ok), confusions: cold ? cold.confusions : [] })}'. Return ok.`, { label: 'story review sheet', phase: 'Story', effort: 'low', schema: OK, ...mo(M.lane) })
  return { stage, ok: true, story, cold, gate: `Story awaiting Matt's approval: ${LEDGER} story.status; review sheet wiki/comics-library/records/${slug}-build-${build}/story-review.md` }
}

// ---------- Scenes ----------
async function buildScene(scene) {
  const S = `${ctx}\nScene: ${scene}.`
  phase('Scene plan')
  const plan = await agent(`${S}\nYou are the scene planner. Read README step 2, the scene in the story file (resolve ${slug} through index.ts), .claude/skills/mtw-comic-story/references/scene-layers.md, box-defects.md (D1-D15) and the cast list in wiki/site/comic-story.md. Write ${TRANSPORT}/scenes/${scene}/scene-plan.json in the shape box-briefs.mjs expects (read its usage comment): place, time, styleRefs (two files from wiki/image-library/assets/originals/comic-references/ that match this scene's mood, plus one approved MTW page from wiki/image-library/assets/scenes/comic-b/pages/ for ink consistency), and per box: camera, action (mid-movement when the beat moves), subjects with cast ids and placement, surfaces (every laptop, monitor, phone and paper: object, camera face, reader, shows), clearArea for lettering sized for that box's balloons, motion (still|push|drift-left|drift-right|light|shadow|projection|sprout|travel|vibrate), planes (role agents for every digital agent on screen as a projection; role light for lit tower floors or glowing screens with floors when the Second Brain learns; role props for a moving object), sound (room, sfx). Perspective may change inside a box: say where the camera is. Then run: node scripts/comics/box-briefs.mjs --story ${slug} --scene ${scene} --plan ${TRANSPORT}/scenes/${scene}/scene-plan.json --out ${TRANSPORT}/scenes/${scene} --lanes ${A.lanes || 2}. Fix any missing reference it reports. Record: node scripts/comics/lib/ledger.mjs ${slug} ${build} set scenes.${scene}.plan '{"file":"${TRANSPORT}/scenes/${scene}/scene-plan.json"}'. Return ok, boxes (img ids in order), lanes (lane folders), planeBoxes (img ids that need cut planes), errors.`, { label: `plan ${scene}`, phase: 'Scene plan', effort: 'high', schema: PLAN, ...mo(M.planner) })
  if (!plan || !plan.ok) return { scene, ok: false, step: 'plan', plan }

  phase('Art')
  const runLane = (lane, note) => agent(`${S}\nRun one Codex image lane in the foreground (Bash timeout 600000): node scripts/comics/lane-run.mjs --lane ${lane} --model ${CODEX.model} --effort ${CODEX.effort} --timeout-s ${CODEX.timeout}. ${note || ''} Do not retry a job that returned an image. Return ok, run (the run folder), jobs from its lane-manifest.json (id, ok, path of out PNG, fitsCanvas), errors.`, { label: `lane ${lane.split('/').pop()}`, phase: 'Art', effort: 'low', schema: LANE, ...mo(M.lane) })
  const laneResults = []
  for (let i = 0; i < plan.lanes.length; i += MAX_LANES) {
    const chunk = plan.lanes.slice(i, i + MAX_LANES)
    const results = await parallel(chunk.map((lane) => () => runLane(lane)))
    laneResults.push(...results.filter(Boolean))
  }
  const jobs = laneResults.flatMap((r) => r.jobs.map((j) => ({ ...j, run: r.run })))
  const review = (job) => agent(`${S}\nYou are the art reviewer for box ${job.id}. Read ${job.path} at full size (use the Read tool on the PNG), its request ${TRANSPORT}/scenes/${scene}/${job.id}.request.json, every reference it lists (read those images too) and .claude/skills/mtw-comic-story/references/box-defects.md. Judge D1-D15 from the pixels only (items: each "pass", "fail" or "n/a" with a 10-word observation), identity and colours against the cast references, style closeness to the reference pages (referenceCloseness 0-1: ink weight, flat colour, black mass, hatching), and that the clear area named in the request has no face, hand or evidence. Report speakers: for every cast member visible, mouth [x,y] and face [x,y,w,h] as fractions of the full image, measured carefully. pass = no failed item and identity/colour correct. correction = one sentence telling the generator exactly what to change, from the observed defect (empty when pass). Write your JSON to ${job.run}/review-${job.id}.json and record it: node scripts/comics/lib/ledger.mjs ${slug} ${build} set scenes.${scene}.boxes.${job.id.replace(/--.*$/, '')}.review '<json>' (for a --plane job set scenes.${scene}.boxes.<box>.planes instead, appending). Return the JSON.`, { label: `review ${job.id}`, phase: 'Art', effort: 'medium', schema: REVIEW, ...mo(M.reviewer) })
  let reviews = (await parallel(jobs.filter((j) => j.ok).map((j) => () => review(j)))).filter(Boolean)
  const failed = reviews.filter((r) => !r.pass)
  if (failed.length) {
    log(`${scene}: ${failed.length} of ${reviews.length} images failed review; one correction pass`)
    const fixes = await parallel(failed.map((r) => () => agent(`${S}\nCorrect box ${r.box} once from this observed defect: "${r.failures.join('; ')}". Instruction for the generator: "${r.correction}". Create ${TRANSPORT}/scenes/${scene}/fix-${r.box}/ with job.json and lane-prompt.md copied from the original lane of this box (find it in ${TRANSPORT}/scenes/${scene}/lanes.json), keeping only this job, with the correction appended to the end of the prompt text under the heading CORRECTION and the failed image added as the last referenced image with the role "previous attempt: fix only the named defect, keep everything else". Then run it: node scripts/comics/lane-run.mjs --lane ${TRANSPORT}/scenes/${scene}/fix-${r.box} --model ${CODEX.model} --effort ${CODEX.effort} --timeout-s ${CODEX.timeout} (foreground, Bash timeout 600000). Return ok, run, jobs, errors.`, { label: `fix ${r.box}`, phase: 'Art', effort: 'low', schema: LANE, ...mo(M.lane) })))
    const fixJobs = fixes.filter(Boolean).flatMap((f) => f.jobs.filter((j) => j.ok).map((j) => ({ ...j, run: f.run })))
    const second = (await parallel(fixJobs.map((j) => () => review(j)))).filter(Boolean)
    reviews = reviews.filter((r) => r.pass).concat(second)
  }
  const stillFailed = reviews.filter((r) => !r.pass).map((r) => `${r.box}: ${r.failures.join('; ')}`)
  const selectPrompt = `${S}\nFor every box of this scene choose the selected image: the passing review in ${TRANSPORT}/scenes/${scene}/**/review-*.json (a fix run wins over the original). Set in the ledger for each box: scenes.${scene}.boxes.<img>.selected = {"src": "<repo-relative out PNG>", "sha256": "<from its lane-manifest>", "ar": [0,0,1,1], "fit": "cover"} and scenes.${scene}.boxes.<img>.faces = the review's speakers. Boxes with no passing image: status "blocked" with the failures. Return ok (every box selected), summary, errors (blocked boxes).`
  const sel = await agent(selectPrompt, { label: `select ${scene}`, phase: 'Art', effort: 'low', schema: OK, ...mo(M.lane) })

  phase('Planes')
  const planes = plan.planeBoxes.length ? await agent(`${S}\nYou make the planes for boxes ${plan.planeBoxes.join(', ')}. Read README step 4 and scene-layers.md. For each box: read its selected master (ledger scenes.${scene}.boxes.<img>.selected.src) and the plan's planes. Lit floors, glowing screens and moving props: write ${TRANSPORT}/scenes/${scene}/planes/<img>/planes.json for scripts/comics/cut_planes.py (modes luminance/hue/rect/color with a rect around the object measured from the image; floors N for tower floors), run python scripts/comics/cut_planes.py --master <src> --plan <planes.json> --out ${TRANSPORT}/scenes/${scene}/planes/<img> and read its receipt; adjust the rect or threshold once if coverage is 0 or the composite fails. Agent projections: use the transparent "--<planeId>" images already generated in this scene's lanes (their reviews are in the run folders); if one is missing, note it. Then record for each box: scenes.${scene}.boxes.<img>.planes = [ {id:"background", role:"background", src:<base png>, sha256}, ...one per plane with role, src, sha256 and motion: {preset: "sprout", floors, floorIndex, activeFloors, floorSource:{sceneId, panelId}} for floors, {preset:"projection", fabrication:true} for agents, {preset:"travel"|"vibrate", from, to, sourceBounds} for props, {preset:"light"|"drift-left"|...} otherwise ]. Return ok, summary (planes per box), errors.`, { label: `planes ${scene}`, phase: 'Planes', effort: 'medium', schema: OK, ...mo(M.planner) }) : { ok: true, summary: 'no planes needed', errors: [] }

  phase('Lettering and sound')
  const letter = await withLock('story', () => agent(`${S}\nPlace the balloons: node scripts/comics/letter-plan.mjs --slug ${slug} --build ${build} --scene ${scene}. If it reports a balloon that does not fit, edit only that balloon's position by hand in the story file (never its words) and rerun. Then from site/: node scripts/comic-story-check.mjs --story src/data/comic-stories/<file>.ts. Return ok, summary, errors.`, { label: `letter ${scene}`, phase: 'Lettering and sound', effort: 'low', schema: OK, ...mo(M.letter) }))
  const sound = await withLock('story', () => agent(`${S}\nSound design for this scene. Read README step 6 and .claude/skills/mtw-comic-story/references/audio-motion.md. In the story file (data edit through scripts/comics/lib/story.mjs loadStory/saveStory, or a careful edit of the JSON literal), set for each box the sfx that its visible events earn (one or two, kinds from types.ts SfxKind), room overrides where the place changes, the scene's score level and room (keep at least one scene in three without music across the issue), and bind saved speech only where wiki/comics-library/speech.json has an approved take whose textSha256 matches the balloon's exact words (src must exist under site/public). Then: node scripts/comics/audio-coverage.mjs --story ${slug} --scene ${scene}. Return ok, summary (voiced/unvoiced, sfx boxes), errors.`, { label: `sound ${scene}`, phase: 'Lettering and sound', effort: 'low', schema: OK, ...mo(M.sound) }))

  // Registration is slow (the producer hashes the library). It runs under the registry lock while the next scene generates.
  const registered = withLock('registry', () => agent(`${S}\nRegister every attempt of this scene: node scripts/comics/wave-register.mjs --slug ${slug} --build ${build} --scene ${scene} --json (this takes minutes; Bash timeout 600000). If it is blocked by other sessions' unregistered files, return ok=false with the blockedBy list; never use --all-unregistered. Return ok, summary (count registered), errors.`, { label: `register ${scene}`, phase: 'Register and bind', effort: 'low', schema: OK, ...mo(M.lane) }))

  const tail = (async () => {
    const reg = await registered
    phase('Register and bind')
    const bound = await withLock('story', () => agent(`${S}\nFirst, for every box whose lane-manifest job now has a registration (${TRANSPORT}/scenes/${scene}/**/lane-manifest.json, jobs[].registration.path and recordId), update the ledger's scenes.${scene}.boxes.<img>.selected.src to wiki/image-library/<registration.path> and selected.recordId to its recordId (same bytes; keep sha256). Then bind the selected art: node scripts/comics/bind-art.mjs --slug ${slug} --build ${build} --scene ${scene} --json (it encodes 1600-wide integration copies and writes staticArt/views/layers into the story, then runs comic-story-check --require-art). Return ok, summary, errors.`, { label: `bind ${scene}`, phase: 'Register and bind', effort: 'low', schema: OK, ...mo(M.bind) }))
    if (!bound || !bound.ok) return { scene, ok: false, step: 'bind', bound, reg }
    phase('Frames')
    const capture = () => withLock('browser', () => agent(`${S}\nAdd one line at the top of discussion/handoff/STATUS.md: "- **CLAUDE COMIC BUILD ${slug} ${build} FRAMES (${scene}):** headless Playwright Chromium on 8787 for this scene's frames; released when the line below says so." Then run: node scripts/comics/frames-review.mjs --slug ${slug} --build ${build} --scene ${scene} --json. Then add the release line. Return ok (no page errors, no failed requests), summary (frame count, index path), errors.`, { label: `frames ${scene}`, phase: 'Frames', effort: 'low', schema: OK, ...mo(M.frames) }))
    let frames = await capture()
    const judge = () => agent(`${S}\nYou are the frame reviewer. Read wiki/comics-library/records/${slug}-build-${build}/frames/${scene}/index.json and every PNG it lists (the full frames and the -box crops) with the Read tool, plus the scene's balloons in the story file. For each frame answer from the pixels: art loaded and filling its box with no bars; the box's beat visible (the action, the evidence, the person the alt names); every balloon fully readable, inside the page, off every face, its tail at the speaker's mouth; captions in their corners; on phone sheets at least 3 boxes visible and in order; moving boxes different between reveal and motion frames; reduced-motion frames still and complete. Record defects with the one fix type that resolves each: lettering (position/tail), art (the image), planes (motion), sound (n/a here), none. ok = no defects. Write the JSON to wiki/comics-library/records/${slug}-build-${build}/frames/${scene}/review.json and set scenes.${scene}.review to it in the ledger. Return it.`, { label: `judge frames ${scene}`, phase: 'Frames', effort: 'medium', schema: FRAMES, ...mo(M.judge) })
    let verdict = await judge()
    if (verdict && !verdict.ok) {
      const letterFixes = verdict.defects.filter((d) => d.fix === 'lettering')
      const artFixes = verdict.defects.filter((d) => d.fix === 'art' || d.fix === 'planes')
      log(`${scene}: ${verdict.defects.length} frame defects (${letterFixes.length} lettering, ${artFixes.length} art); one correction pass`)
      if (letterFixes.length) await withLock('story', () => agent(`${S}\nFix these lettering defects by editing only balloon positions (x, y, w, tail, phone) in the story file, then rerun node scripts/comic-story-check.mjs from site/: ${JSON.stringify(letterFixes)}. Return ok, summary, errors.`, { label: `letter fix ${scene}`, phase: 'Frames', effort: 'medium', schema: OK, ...mo(M.letter) }))
      if (artFixes.length) log(`${scene}: art defects need a new attempt; recorded for the next pass: ${artFixes.map((d) => `${d.box}: ${d.defect}`).join(' | ')}`)
      frames = await capture()
      verdict = await judge()
    }
    const gate = await agent(`${S}\nRun: node scripts/comics/scene-gate.mjs --slug ${slug} --build ${build} --scene ${scene} --stage framed --json. Return ok, summary (the failing step if any), errors.`, { label: `gate ${scene}`, phase: 'Frames', effort: 'low', schema: OK, ...mo(M.lane) })
    return { scene, ok: !!(gate && gate.ok), reg, bound, frames, verdict, gate, stillFailed }
  })()
  return { scene, ok: !!(sel && sel.ok && letter && letter.ok && sound && sound.ok && planes.ok), plan: plan.summary, reviews: reviews.length, stillFailed, planes: planes.summary, tail }
}

if (stage === 'scenes') {
  if (A.approve) await agent(`${ctx}\nMatt approved the story in chat. Record it: node scripts/comics/lib/ledger.mjs ${slug} ${build} set story.approved '{"by":"matt","via":"chat"}' and set story.status '"approved"'. Return ok.`, { label: 'record approval', phase: 'Story', effort: 'low', schema: OK, ...mo(M.lane) })
  const state = await agent(`${ctx}\nRead ${LEDGER} and the story file for ${slug}. Return ok = story.approved is set (or story.status is "approved"), summary = the scene ids in story order as a comma-separated list, errors.`, { label: 'read ledger', phase: 'Story', effort: 'low', schema: OK, ...mo(M.lane) })
  if (!state || !state.ok) return { stage, ok: false, blocked: 'story not approved in the ledger', state }
  const all = state.summary.split(',').map((s) => s.trim()).filter(Boolean)
  const scenes = A.scenes && A.scenes.length ? A.scenes : all
  log(`building ${scenes.length} scenes, one at a time: ${scenes.join(', ')}`)
  const results = []
  const tails = []
  for (const scene of scenes) {
    const r = await buildScene(scene)
    results.push(r)
    if (r.tail) tails.push(r.tail)
    log(`${scene}: generation ${r.ok ? 'done' : 'blocked'}${r.stillFailed && r.stillFailed.length ? `; unresolved art: ${r.stillFailed.length}` : ''}`)
    if (!r.ok && A.stopOnBlock) break
  }
  const finished = (await Promise.all(tails.map((t) => t.catch((e) => ({ ok: false, error: String(e) })))))
  return { stage, ok: finished.every((f) => f.ok), scenes: results.map(({ tail, ...r }) => r), finished }
}

if (stage === 'finish') {
  phase('Finish')
  const fin = await agent(`${ctx}\nRun the issue checks from site/: node scripts/comic-story-check.mjs --story src/data/comic-stories/<file>.ts --require-art; node scripts/comic-story-check.mjs --registry --url http://127.0.0.1:8787; node scripts/comic-story-deslop.mjs; from the root: node scripts/comics/layout-check.mjs --story ${slug}; node scripts/comics/audio-coverage.mjs --story ${slug}; node site/scripts/build-comics-library.mjs. Read the newest 30 lines of discussion/handoff/STATUS.md: if no other session holds the build slot, run one npm run build in site/ (Bash timeout 600000); otherwise report that the build is held. Append one STATUS line in the wave format from discussion/comic-workflow-spec-20261012.md section 6 with the ledger path. Return ok, summary, errors.`, { label: 'finish', phase: 'Finish', effort: 'medium', schema: OK, ...mo(M.bind) })
  return { stage, ok: !!(fin && fin.ok), fin }
}

return { stage, ok: false, error: `unknown stage ${stage}` }
