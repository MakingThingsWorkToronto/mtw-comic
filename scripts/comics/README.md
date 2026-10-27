# Comic build framework

How an MTW Comic Story (Comic B) is built so that the result is repeatable: one issue at a time, one scene at a time, box by box, with a mechanical check after every step and a human gate only where a human decision belongs. The craft rules stay in the `mtw-comic-story` skill; this folder holds the steps, the data each step produces and the check that lets the next step start.

Why it exists: Home was rebuilt four times in October 2026 and rejected each time. Every version passed its source checks. Nobody had watched it play box by box, layouts repeated, planes were drawn instead of cut, voices were missing, and every run rewrote the pipeline in a worktree. This framework makes the steps small enough that an agent cannot skip one without a check failing.

## Units

| Unit | Data | Owner during a build |
|---|---|---|
| Issue | `site/src/data/comic-stories/<id>.ts` (a `retime({...})` JSON literal) | the build's single story writer |
| Scene | one `ComicScene`: a desktop page plus one or more phone sheets | the scene lane |
| Box | one `ComicPanel`: `r` on the 16:9 page, its art, planes, balloons, effects | the box lane |
| Balloon | one `Balloon`: words, kind, position, tail, optional saved speech | the lettering step |
| Effect | one `Sfx` or room change on a box | the sound step |
| Plane | one full-canvas RGBA image with a `LayerMotion` | the planes step |

Every build has an id (`<slug>-build-<buildId>`), a ledger at `wiki/comics-library/records/<slug>-build-<buildId>/state.json` and a transport folder at `.codex/worktrees/comic-build-<slug>-<buildId>/`. The ledger records what each scene and box has actually reached. Transport is unfinished production until registration succeeds.

## Steps

Each step names its input, the file it writes and the check that gates the next step. A step that fails its check is corrected once from the observed defect; a second failure stops the scene and reports.

### 0. Preflight
`node scripts/comics/preflight.mjs --slug <slug> --build <id>` checks Codex, Python imaging, sharp, Playwright, the story file, free disk, the dev server on 8787, Studio on 8788, Git status of the story and STATUS ownership. Writes `preflight` into the ledger.

### 1. Story
Input: the A page, the world bible (`wiki/site/comic-story.md`), the eight repair beats, the cast. Output: the story file with scenes, boxes (`r`, `img`, `alt`), balloons (words, kind, who, state, approximate x/y) and sound intent (`score`, `room`, `sfx`), but no art bindings yet. The writer follows `mtw-comic-story/references/storytelling.md` and `story-craft.md`.
Checks: `comic-story-check.mjs --story` and `comic-story-deslop.mjs` from `site/`, `layout-check.mjs` (five or more boxes, a dominant box, no repeated geometry across scenes, valid phone sheets), `audio-coverage.mjs` (score and room declared, effects on half the boxes, silence intentional), then a cold read: a separate agent that has not seen the brief answers the acceptance questions from the story alone.
Gate: Matt approves the words in Studio. Approved words are frozen; later steps move balloons but never change text.

### 2. Scene plan
One scene at a time. Input: the frozen scene. Output: `scenes/<scene>/scene-plan.json` with place, time, style references and, per box: camera, action, subjects with cast ids, surfaces (object, camera face, reader, what it shows), the clear area reserved for lettering, motion intent, planes needed (lit floors, agent projection, moving props) and sound. `box-briefs.mjs` turns the plan into one request and prompt per box and groups them into Codex lanes of two images.
Check: every request has its cast references resolved by path and hash; `layout-check.mjs --scene` passes.

### 3. Box art
`lane-run.mjs` runs each lane through the Codex image lane (`codex_lane.mjs`, read-only sandbox, foreground, at most four lanes at once). Every returned image is copied into the run folder and measured: width, height, real alpha, fit against the requested canvas. Output: `lane-manifest.json`.
Check: a reviewer agent reads every PNG at full size against D1 to D15, the cast sheet and the reference pages, and returns per box: pass or fail per item, the observed mouth and face rectangles of every speaker in normalized image coordinates, and whether the clear area is clear. Fail: one correction lane from the observed defect, then stop.

### 4. Planes
For boxes whose plan needs motion: agent projections are generated as isolated transparent images (`--planeId` requests); lit floors, glowing screens and moving props are cut from the selected master by pixel mask with `cut_planes.py` (never redrawn by an image model). Output: full-canvas RGBA planes plus `planes-receipt.json`.
Check: the composite of all planes over the base equals the master (mean error 2 or less) and each plane cuts something, not everything.

### 5. Lettering
Balloons are placed in the clear area from the plan, tails to the reviewed mouth rectangles, faces protected, with `phone` overrides from the phone sheet geometry. Output: the story's balloons updated (positions only).
Check: `comic-story-check.mjs` and the lettering regressions pass; the frame review in step 8 is the real test.

### 6. Sound
Per box: effects on the visible events, room changes where the place changes, score level per scene, and saved speech bound where an approved take already exists. Output: `sfx`, `room`, `score`, `speech` fields.
Check: `audio-coverage.mjs`: every box's words are voiced or listed as pending approval, no scene without a declared room and score, silence intentional and no more than one scene in three, effects on half the boxes, every file present.

### 7. Register and bind
`wave-register.mjs` copies every attempt (selected and rejected) to `wiki/image-library/assets/scenes/comic-b/<slug>-build-<id>/<scene>/` and registers them in one producer call (this takes minutes; it runs while the next scene generates). The selected masters and planes are then encoded to 1600-wide integration copies and written into the story as `staticArt`, `views` with `layers` and `layerMotion`, by compare-and-swap on the story file.
Check: `comic-story-check.mjs --require-art` passes and `build-comics-library.mjs` validates.

### 8. Frames
`frames-review.mjs` opens the real reader on 8787 and captures every box at its reveal, after its last balloon and, for moving boxes, mid-motion, on desktop, phone and reduced motion, with the box cropped out as well. Output: `frames/<scene>/index.json` and PNGs.
Check: no page errors and no failed requests; then a reviewer agent reads the frames and answers per frame: art loaded and filling the box, balloons readable and off every face, tails to the right mouth, the beat the story needs visible, planes moving where authored and still under reduced motion. Fail: one correction (lettering or art), then stop.
Gate: `scene-gate.mjs --stage framed` passes. Matt can accept the scene from its frames in Studio.

### 9. Issue finish
After every scene: `comic-story-check.mjs --registry`, the playback review, one `npm run build`, one STATUS line in the spec's wave format, and the issue shown in Studio. New speech for approved words is a separate paid step with its own authorization.

## Orchestration

- Claude Code: `.claude/workflows/comic-build.js` runs the steps above as a graph of subagents. Run it by name with `args` `{slug, build, stage: "story" | "scenes" | "finish", scenes?: [...], models?: {...}}`. It stops at the story gate and resumes from the ledger.
- Studio: `wiki/workflows/comic-build.json` chains the procedures `comics-build-story` and `comics-build-scenes` with Matt's gates between them, so a build starts, pauses and finishes from `/m/workflows`.
- Changes after a build go through the existing Studio feedback procedures; each lands as a new attempt in the same ledger, never as a hand edit of a catalog.

## Rules the checks enforce

- At least five distinct boxes on every desktop page and every phone sheet; a dominant box; no repeated geometry across scenes; no even grids except one `rapid` scene.
- No image is accepted without a full-size review bound to its hash. No plane is drawn by an image model when it can be cut from the master.
- Words are frozen at the story gate. Speech approvals bind to the words, not to the file.
- Every attempt is registered, including rejected art. Transport is not delivery.
- The frames are the acceptance test. A passing fixture is not a comic.
