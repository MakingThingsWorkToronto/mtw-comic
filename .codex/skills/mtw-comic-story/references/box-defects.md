# Box-defect checklist: prevent at generation, catch at review

Matt reviewed comic boxes in MTW Studio on 2026-10-11 and listed fifteen recurring defects: "all of these different situations should be covered by our skills / visual testing. ensure the skills all ensure this is very difficult or impossible to happen." Image generation runs through the Codex CLI, so each defect must be stated in the image prompt and then checked with the same wording after generation.

## One wording, two uses

The wording lives in one place: the `box-defects` block in [prompt-fragments.default.md](../scripts/art/prompt-fragments.default.md). Do not copy it into other prompts or pages; include it.

- **Generation.** `comic_art.py prompt` adds the block to every scene/panel prompt. For interactive Codex generation, a `comics-fix-box-art` run or any hand-written fix prompt, paste the output of `python .codex/skills/mtw-comic-story/scripts/art/comic_art.py box-prompt --panel <id> --brief <brief.json>` into the prompt unchanged.
- **Review.** After generation, check every returned image and view against D1-D15 below. Use the same IDs and words from the block.

## What the brief must state before generation

Each surface in the brief's `visualInventory` view (see [visual review](visual-review.md)) carries these fields in addition to `id`, `kind`, `informationSide` and `reader`:

- `object`: `laptop`, `monitor`, `phone`, `paper`, `document` or another plain noun.
- `camera`: `front`, `back` or `side`, meaning which face of that object the camera sees in this view.
- `shows`: required for every content surface (`screen` or `reader-facing-paper`). It states exactly what the screen or printed face shows, as the story says, such as "the quote table with the wrong desk count highlighted". Legible words go on the separate props plane ([art pipeline](art-pipeline.md#registered-layers-for-a-live-comic)); the generated art shows the interface or graph shapes.

`box-prompt` and `prompt` refuse to write a prompt in these cases:

- a surface without `camera`;
- a content surface without `shows` or `reader`;
- a content surface whose camera sees its back. Declare that view `blank` and give the evidence its own front view.

Each digital agent and human in the view gets its own explicit projection or solid-human line. Brief fields still state the box aspect, clear zones and key subjects ([art pipeline](art-pipeline.md#the-inputs-that-matter)).

## The checklist

Check every item on every returned image and on every view inside a multi-image box. Record each result against that file's hash. A `fail` or a missing item blocks `judge`, integration and showing the box to Matt. `n/a` needs a reason. For example, D8 is `n/a` only when the box has no laptop.

| ID | Defect | Prevented at generation | Caught after generation |
|---|---|---|---|
| D1 | Low quality: soft, artifacts, garbled detail, wrong resolution for the box | Block D1; `ink-plate` fragment; native high-resolution master | Inspect the master at 100% and each box crop. Record true source dimensions and any upscale ([art pipeline](art-pipeline.md#generate-retain-and-inspect) step 4). The `sharpness` content check. Desktop/phone crops in [checks](checks.md#story-art-crop-and-lettering-review) |
| D2 | Doesn't fit its box: subject cut, wrong aspect, letterbox, desktop/phone crop loses subject | Block D2; brief `aspect`, panel layout, clear zones and key-subject regions | Detected `ar` per drawn box. `comic-story-art-review.mjs` protected-subject crops at 1440x900 and 390x844, plus the `keySubjects` content check |
| D3 | Speech needs rewriting: weak, over about 12 words, off-voice | Block D3 (no drawn words); [lettering](lettering-and-balloons.md) and `mtw-articulation` before copy | `comic-story-check.mjs` WARN `box-defect 3` over 12 words, plus the 90-character error. The [cold-reader test](storytelling.md#the-cold-reader-test-run-before-matt-sees-it) for voice. Matt reviews exact words before speech |
| D4 | Digital agent not in the agreed projection format | Block D4; per-agent prompt line; `style95` agent exception | `comic-visual-v1` agent checks `subtleProjection`, `comicTreatment`, `identityPreserved`, `colourPreserved` and `noRepositoryHologram` |
| D5 | Too few sound effects / weak score | Block D5 (draw the sounding events); [audio and motion](audio-motion.md) | `comic-story-check.mjs` WARN `box-defect 5` when effects appear in fewer than one box in three per scene, with `continues` splits joined. Listening review |
| D6 | Not in the comic format: photo, 3D, painterly | Block D6; `style95`, `avoid` | `comic-visual-v1` view checks `cartoonConsistency`, `noPhotorealism`, `noPainterlyRealism` and `noCinematic3D` |
| D7 | Box lacks motion where the story needs it | Block D7; `movement` fragment; panel `motion`/`layerMotion` | `comic-story-check.mjs` WARN `box-defect 7` when an action effect (`impact`, `glass`, `door`, `whoosh`, `alarm`) sits on a box whose panel and layers are all still. Playback review |
| D8 | Laptop UI on the wrong side | Block D8; surface line (`camera`, reader) | Surface `observedInformationSide`, `noBackLidEdgeUI`, `facesReader` |
| D9 | Monitor graphic on the wrong side | Block D9; surface line | Same surface checks |
| D10 | Phone graphic on the wrong side | Block D10; surface line | Same surface checks |
| D11 | Laptop missing UI | Block D11; required `shows` | Record a `D11` result: the observed screen content matches `shows`. Not yet validator-enforced |
| D12 | Monitor missing UI | Block D12; required `shows` | `D12` result, as D11 |
| D13 | Phone missing its graphic | Block D13; required `shows` | `D13` result, as D11 |
| D14 | Paper graphic on the wrong side | Block D14; surface line | Surface `observedInformationSide`, `noReverseSideCopy`, `facesReader` |
| D15 | Paper missing graphics | Block D15; required `shows` | `D15` result, as D11 |

## Actual projection and integrated surface inspection

Apply the current D4 and D11-D15 wording from the shared fragment. Inspect the raw isolated agent first: opaque full-colour costume/face interiors, true silhouette alpha, no humans/background/backing and zero baked skyline, building, room, desk or parapet imagery inside the body. Bind its identity to the opaque current canonical model, not a prior translucent/ghost scene. Then on every actual composed digital-agent appearance, record the crisp current full-colour face/costume and a specific underlying scene feature that transmits through a body portion with physically correct foreground occlusion; an armour seam, pale fill or glowing contour alone is not transmission. Check that humans remain solid. For independent motion, inspect the actual isolated RGBA plane, complete silhouette and actor-only alpha mask, then the composed frame. A flattened RGB scene cannot prove separate alpha or motion. Use real background → agent → foreground depth ordering; concrete parapets/desks must occlude the actor rather than expose unrelated painted city texture. Shared sky/skyline movement is authored separately from the actor mask. Moving scan lines and dot fabrication are renderer-owned overlays confined to the agent; prompt inclusion is not implemented animation or approval. Reject ghost haze, global actor fading/desaturation, baked whole-scene hologram effects and 3D/glass treatment.

Home's October 13 source repair found two ways genuine RGBA still failed D4: the base retained the same opaque agent beneath its translucent overlay, and threshold masks gave sky/edges alpha while the agent's face and torso were zero. Inspect the selected background alone for absence of the agent, then sample and inspect the source mask at actual face, torso, empty background and physical foreground. A usable actor plane includes its real face/body and excludes city, humans and parapets; intermediate-alpha counts cannot prove polarity or isolation. Blind alpha inversion can retain whole skyline/roof regions. Reuse a correct aligned actor silhouette or register an explicit source-bound mask/composition with unchanged actor RGB, then inspect the result over the clean base before reader integration.

On each visible information face, inspect both physical reading geometry and graphic treatment: words/table/graph follow that face's perspective, ink/halftone, lighting and real occlusion, with exact required content still readable. Preserve an already correct screen orientation. Reject pasted flat UI/vector stickers, floating panels, unreadable stylization or projected physical paper. Rear surfaces remain plain. A source-only surface observation does not establish phone glyph size, dwell, integrated lettering or Matt's approval.

Run `python -B .codex/skills/mtw-comic-story/scripts/art/test_prompt_projection_surfaces.py` (and the paired Claude path). Its synthetic generation-prompt fixture covers both an agent and an operator-facing screen/paper, plus a blank rear view and a legacy brief. It proves inclusion and preservation of the existing orientation refusal; it does not prove generated pixels, alpha quality or renderer behaviour. Inspect the next eligible actual output and retain any failed version.

## Full-box fit and owned writing action

Before a new source call, use the actual responsive art area/aspect and authored lettering layout, rather than assuming native dimensions establish D2. Inspect desktop, phone and reduced-motion compositions: no black matte, sidebar, fake blurred/duplicated edge fill or stretched bodies; do not crop or cover a required face, acting hand or evidence surface to fill the box. Where a source cannot satisfy both layouts, author a purposeful alternate composition/cut and verify its actual fit. A forecast, static source pass or prompt test does not establish reader readiness.

For a depicted writing action, inspect the pen tip against the specifically intended field or signature area, and trace the hand to its actual owner. Correct paper orientation alone does not prove contact; a pen on another row or a nearby pointing hand fails that action. Preserve exact story content and never add approval/signature claims to solve staging. The [owning art pipeline](art-pipeline.md) carries source/canonical-reference and correction procedures; the [current comic contract](../../../../wiki/site/comic-story.md) carries Matt's direction. This checklist adds craft checks, not duplicate approval facts.

## Recording

Add `boxDefects` to each observed view in `visualReview.images[].panels[].views[]`, beside the existing checks. Give it one entry per ID, `"D1"` to `"D15"`, each `{result: "pass" | "fail" | "n/a", observation: "<what you actually saw>"}`. The `observation` is required for every entry. The existing `comic-visual-v1` validator enforces D4, D6, D8-D10 and D14. It ignores `boxDefects` today, so the integrating writer must refuse integration when any entry is missing or failed. Do not pre-fill passes from the prompt, the brief or alt text.

The story-data warnings for D3, D5 and D7 are not exempt. Fix each one, or record in that box's review why the box is right as it is, such as a deliberate silence. Static checks never prove pixels, listening or Matt's approval.

## Recurrence

The story-data rules were first run on 2026-10-11 over the five illustrated stories (`--story`, WARN only, exit 0). They found:

| Story | D3 | D5 | D7 |
|---|---|---|---|
| home | 5 | 9 | 1 |
| agentic | 1 | 1 | 4 |
| traditional | 3 | 4 | 0 |
| data-migrations | 4 | 3 | 2 |
| demo | 0 | 2 | 4 |

These are candidate defects for the integrating writer, not corrections. The image-side prevention takes effect at the next generated or fixed box through `prompt` or `box-prompt`. Until that output is inspected against D1-D15, its status is `awaiting-next-output`.
