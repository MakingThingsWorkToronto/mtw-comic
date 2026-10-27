# Lettering, balloons, colour and page geometry: the approved standard

**Approved by Matt on 2026-09-29** ("looks perfect. standardize and update skill craft so this is reproducible"; spec "Comic B: balloon style approved and standardized"), then **refined with Kalam lettering on 2026-09-30** (spec "Comic B: balloons to 95, Kalam lettering") and **accepted as 2.1.0 on 2026-10-02** (spec "Comic B: balloon standard 2.1.0 accepted"). The accepted baseline is style check 43: Codex lettering 94, balloons 93, captions 96, colour 97, geometry 93, no inventions; IoU median 0.868, minimum 0.797. Golden 2.1.0 is the regression reference. The standard is `assets/balloon-style.json` version 2.1.0 (with `"approved"`; the history is in `_changes`), frozen as renders and measured parameters in `assets/golden/`. The before/after sheet of 2.0.1 and 2.1.0 is `wiki/image-library/assets/experiments/comic-b/review/golden-2.0.1-vs-2.1.0.png`. A change to any value below needs Matt's approval, a new version in the config and a re-captured golden. Values live in `assets/` (both editions identical), never in code.

The measurements behind it are `assets/reference-balloons/report.md` and `shapes.json`: 68 shapes on 7 reference pages. The unit **c** is the cap height of the balloon's own lettering, measured from the face at run time.

## The standard

### Which balloon for which voice (`state` decides the `kind`)

| Voice (`state`) | Kind | Drawn as | Reference |
|---|---|---|---|
| `calm` | `speech` | **White** `#f4f4f4` balloon, tapered wedge tail to the mouth | ref-4, ref-30 |
| `device` (chat, screen) | `speech` | The same white balloon, its tail to the screen | ref-13 (spec, root 2026-09-29) |
| `offpanel` | `speech` | White, a long thin wedge (root 0.3c) that stays visible to the box edge | ref-13 |
| `weak` | `speech` | White, a slim zigzag tail: two unequal bends (0.2c), about 1.8c long, root 0.3c wide, pointed, round joins | ref-56 |
| `menace` | `speech` | White, a red (`#e30a0f`) irregular wavy second outline, 0.2c out, 0.09c thick | ref-15 |
| `thought` | `thought` | **The one yellow balloon** (`#ede614`, Spider-Man #33), always with the **bead stem**: 2-3 small beads shrinking toward the thinker, never a wedge | ref-34, ref-35 (colour); the bead stem is Matt's rule |
| `fear` (spooked, shaken) | `fear` | White, scalloped all round on a rounder body (n 2.5): 12-17 uneven lobes about 1c wide and 0.3c deep | ref-44, ref-45, ref-47 |
| `shout` | `burst` | White burst, Bangers at 1.6x | ref-50 |
| `scream` | `burst` | Red-filled burst (`#e30a0f`), black lettering, fewer and longer points (8-10) | ref-12 |
| `panic` | `burst` | White burst, fewer points (7-9) with one long point (1.2c) toward the speaker, Kalam slanted and heavier at 1.4x | ref-57, ref-58, ref-65 |
| `narration` | `caption` or `place` | **Yellow square box** `#eae619`, thin black rule, butted into a box corner | ref-26, ref-61 |

Two markers carry the meaning, and they are never mixed: the **stem** (a wedge for speech, beads for thought) and the **colour** (white for every balloon, yellow only for thinking; the yellow square is a caption). A yellow balloon with a wedge, or beads on a white balloon, fails the lint. Also joined by rule:

- **chain** (`chain: true`): the same speaker's next beat, in the same box. It is placed 1.2c from the previous balloon along the authored direction and joined by a neck 0.5c wide; only the last balloon has a tail (ref-10, ref-43).
- **across** (`across: true`): a line continued into the next box, joined by a connector over the gutter, gently bowed, that tapers from 0.5c at the head to 0.14c at the receiving balloon (ref-40).
- **butted** (`edge`): cut flat by the box border with no outline on the cut side; the lettering stays 0.6c clear of it (ref-8).
- **breakout** (`breakout: true`): the only balloon that may cross a border. Its paper is opaque throughout (one printed shape laid over the page; translucent, the rules and a tonal seam showed through). Use 1-2 an issue.

A chain or across group is drawn inside its head balloon's shape: one paper group with one opacity, so there is never a darker stem where shapes meet.

### Lettering

| Value | Standard | Source |
|---|---|---|
| Dialogue face | **Kalam 700** (`/fonts/kalam-700.woff2`, `OFL-kalam.txt`), upper case, its own forward lean, letter-spacing .02em | Matt, 2026-09-30 ("Kalam lettering"), from the 15 px comparison beside the reference crops (`wiki/image-library/assets/experiments/comic-b/browser-shots/font-candidates-15px.png`); SIL OFL |
| Stress | The same face, the `em` phrase, slanted further (synthetic italic: Kalam has no italic) and heavier by a 0.05em stroke of the same ink | ref-4 (lettering:bold-italic-stress) |
| Shouts | Bangers 400 (`bangers-400.woff2`), 1.6x; panic is Kalam slanted and heavier at 1.4x | ref-50, ref-57 |
| Size | cap height 1.2% of the page's **short side** (the references' width is their short side), and **at least 15 px type on a desktop page, 14 px on a phone** | shapes.json lettering; Matt: "don't make too small" |
| Leading | 1.35c between baselines (captions 1.26c); the references measure 1.11-1.53c | shapes.json |
| Lines | composed by the engine: about 11 characters a line (5-15), first and last about 0.8 of the widest, never a line under half the widest, never a word broken; the author's `\n` wins | shapes.json lettering |
| Captions | the dialogue size (Matt: "make yellow square text bigger"), left-aligned, Kalam's own lean | |

The browser never wraps lettering: each composed line is a `.cs-line` with `white-space: nowrap`.

### Shapes

- **Speech body:** a superellipse, n 4.5 (the Marvel look; n 2.3 for the Crisis look, one per issue). a = textW/2 + 0.75c, b = textH/2 + 0.65c. These sit at the tight end of the measured range (Matt: "make more savage and tight"; 2.1.0 gave the slanted stress a little more side room). The shoulders are r = max(r_superellipse, r_textHull + 0.45c), with a hand variation of 1.2-2% at orders 2-4.
- **Aspect:** a/b is kept near 0.9-2.3 by composing the lines (the references' 0.9-2.1 at their median padding), never by inflating the body (inflating made fat pillows); the silhouette IoU is the check.
- **Tail:** spliced into the outline as one path. It exits nearest the mouth, with a root half-width of 0.35c and a length of 1.9c, drawn as two quadratics (controls at 45% of the length, 0.22c off the axis) with 0.3c fillets and at most 5 degrees of bend. The ink ring is mitred (limit 30) so every tail ends in a sharp point.
- **Stroke:** 0.12c black, at least 1.2 px (the references measure about 0.2c, but only to +-0.07c on the small scans; Codex's reading of the render settled at 0.12c). The caption rule is 0.08c, in whole device pixels.
- **Thought beads:** 0.5, 0.36 and 0.25c high (1.25 wide to high), 0.3c apart.
- **Burst:** composed wide (about 14 characters a line), a superellipse body (n 4.5) at 0.9c x 0.5c around the lettering, 10-13 straight teeth 0.3-0.6c out from valleys 5% inside, alternate teeth 25% shorter and two accents 1.6x longer. The tail tooth is at most 0.6c. The stroke is 0.12c with mitred joins. Tuned against the reference bursts by the silhouette IoU (the references' bursts are wide bodies ringed by many short teeth; `burst.voices` sets scream and panic).
- **Caption:** square corners and a 0.2c rule, omitted on the sides butted against the box border (the border is the rule there). Padding is left 0.67c, right 0.78c, top 0.60c, bottom 0.77c. It is butted into a box corner, flush to the border, and stacked 0.5c apart. A caption is at most 2.6 wide to high unless it spans the box (`w` 0.9 or more). If a caption cannot fit its cascade inset, the inset grows (up to 1.5x, inside its host), or the caption moves to the host box's first corner that no inset covers.

### Character introductions (Matt, 2026-10-09)

Mark identifying character captions `characterIntro: true`. The shared caption renderer takes their fill from `assets/balloon-style.json` `characterIntro.fill`, the site brand teal `#1a9ba1`, and keeps the existing caption alpha `0.85`, opaque black rule, lettering, grain and geometry. Narration and place captions keep their existing look-specific yellow/cream fills. Mark the first identifying caption, including a photo-only character such as George Armstrong; later narration mentioning a name is not an introduction. Use the story checker to catch missing or misplaced markers, then inspect actual intro and place captions together on desktop and phone. This user-requested colour exception does not change the accepted 2.1.0 balloon geometry or require another style-scoring campaign.

### Colour and paper

- **Balloons:** `#f4f4f4`, the measured median of the reference balloons. Never re-tint a measured element to match another surface.
- **Thinking:** `#ede614`. **Captions:** `#eae619` (cream `#f9ddb6` in the Crisis look). **Scream and menace:** `#e30a0f`. **Ink:** `#0a0a0a`.
- **Fill alpha:** 0.88 for balloons and 0.85 for captions, by Matt's exception. Ink and lettering stay opaque.
- **Page separators:** brand teal `#1a9ba1` for frames, margins, gutters and inset bands (Matt, 2026-10-09). Historical paper samples never override this colour; balloon fills remain independently measured.
- **Paper texture** (Matt: "i want the comic scenes to look like paper"):
  - One multiply layer per page, over the page's art, margins and gutters and below the boxes.
  - One multiply layer inside each box's art, continuing the same grain. The box's art layer carries its dark base, so an empty box stays dark.
  - Balloons and captions sit above both layers and carry their own mean-preserving grain: two masks cut from the same sampled grain light and darken the fill by the same factor, at a fifth of the paper's strength (`grainStrength` 0.2).
  - Their rendered mean stays the measured colour within 1 level (the style check's mean test).

## Page geometry (`assets/page-constants.json`, from `scripts/sample-reference-paper.mjs`)

These are measured on the reference pages as percentages of each page's **short side**, applied in whole pixels:

| Value | Median | Notes |
|---|---|---|
| Gutter between boxes | 1.204% | Split floor/ceil across the shared grid line |
| Outer margin top / bottom / left / right | 1.408 / 1.174 / 1.690 / 1.643% | Each side is its own |
| Panel border | 0.235% | |
| Page separators | `#1a9ba1` | Matt’s 2026-10-09 branded teal direction; historical reference paper is `#f8f2e4` |
| Paper tile | `paper-tile-512.webp` | Patches of the photographed Crisis page's blank margins, overlap-added into a seamless 512 px tile, layered twice (512 px and 397 px, offset 173/89 px) so it never repeats to the eye |
| Balloon grain | `paper-grain-light.webp`, `paper-grain-dark.webp` | The same grain as masks: 256 px drawn at 512 (a pixel of the photographed page is about two of ours) |

Regenerate them with `node .claude/skills/mtw-comic-story/scripts/sample-reference-paper.mjs --write` (from the repo root). It writes both editions' page constants and the files in `site/public/comic/_paper/`.

## How to reproduce

1. **Config.** `assets/balloon-style.json` (the standard; both editions identical) and `assets/page-constants.json` feed the engine through `ComicStory.astro`. Never hard-code a value in the engine or CSS.
2. **Engine.** `site/public/scripts/comic-story.js`, in `layoutBalloons` and `drawGroup`:
   - `letterOf`: the size and face.
   - `composeLines`: lines by `partition`.
   - `letter`: the ink box from the face's measured cap, ascent and descent.
   - `speechBody`: superellipse, shoulders, hand variation and scallops.
   - `outlinePath`: the tail splice, or `beadStem` for a thought.
   - `burstPath`, `placeCaption` and `drawGroup`: one paper group, one masked ink ring, the grain.
3. **Lab.** `/comics/style-lab/` (`site/src/data/comic-stories/lab.ts`) shows every voice in the table.
4. **Check** (from `site/`):
   - `node scripts/comic-story-deslop.mjs`: the recipe ranges, measured colours, stems and invented kinds.
   - `node scripts/comic-story-style-check.mjs`: geometry to ±1 px, the seam test, the mean test, silhouette IoU (each at least 0.78, median at least 0.85) and Codex's score with the invention pass.
5. **Golden compare.** `node scripts/comic-story-golden.mjs` renders the lab (flat grey) and home-b at 1440x900, 1920x1080 and 390x844. It compares each balloon's measured parameters (lines, font size, padding, stroke, body size) and the lab's pixels with `assets/golden/`, and fails on any regression. Re-capture (`--capture`) only after Matt approves a change, and record the approval in the spec and a new config version.
6. **Screenshots** of every change, desktop and phone, read beside the reference crops (`references/checks.md`).

## Measured authoring before native review

When accumulated captions or speeches overlap, follow [measured lettering](measured-lettering.md): retain actual styled body pixels, split dense desktop pages, reserve artwork and inspect the candidate natively. Keep this approved style unchanged.

For openings, measured top headers and the bottom-right setup body bracket the full-aspect artwork. Share one desktop header row only when actual body widths fit; stack phone headers and reserve at least 180px for art. Keep per-panel body widths, CSS font sizes and cap heights distinct. Verify the actual contained picture size and speaker attribution after authoring; unchanged fonts and a collision fixture do not prove the final native image.

## Source-bound speaker and face placement

The Home regression combined new full-bleed cover crops with old box-relative tails and lettering reserves. Author `speakers` keyed by cast ID with `mouth: [x,y]` and `face: [x,y,w,h]` as fractions of the complete decoded source, not the cropped box. Bind each active `staticArt`/view/layer source to its actual speaker metadata; use panel `speakers` only when that source shares the same composition, and `phone.speakers` for a changed phone composition. Every visible face needs bounds, including a nonspeaking character. A new image/cut needs new inspected coordinates; do not guess identity from the `who` label or carry another view's map forward.

The renderer transforms these anchors through the active `ar`, fit, crop focus and responsive art area. Speech tails target the transformed mouth; captions have no tails. Keep a real speaking mouth in the crop. Use an authored offpanel edge only when the speaker is actually offpanel. Protect every transformed face from all accumulated balloon bodies and captions, preserving legible type and reading order. If there is no room, recompose/reflow or use a supported responsive source; do not globally shrink lettering or cover a face. Existing short-tail authoring is a fallback for genuinely offpanel/reserved lettering, not a substitute for visible-speaker binding.

Inspect complete lettering for each desktop page, every phone sheet and every changed view. Confirm who is drawn, the tail's actual endpoint and face clearance at rest and strongest motion. A schema/source-coordinate test cannot prove the rendered speaker or clearance.

## Accumulated-tail escape check (Agentic native03)

1. Inspect each actual box crop after all its balloons appear. Body collision clearance does not check the complete wedge. Agentic native03 retained seven phone boxes where a normal speech pointer appeared to join the following different speaker, plus two unnecessarily long right-edge offpanel pointers.
2. Retain the original source/frame hashes and actual styled body heights. Measure native body widths if fresh DOM geometry is unavailable; name this pixel evidence honestly, include ink/shape uncertainty, and retain the full-size image. Do not label a pixel width a new computed DOM metric.
3. For a short pointer, call planShortSpeakerTail with the actual body, next body's top, panel dimensions and existing speaker direction. Its target ends before the next body with at least 8px conservative clearance; insufficient room fails and requires measured reauthoring. Preserve font, shape recipe, text, order and speaker. Use existing source phone.tail only where the phone defect occurs; never create a same-speaker chain between different speakers.
4. For an offpanel voice, call alignOffpanelBody with its actual complete body width and owned edge. Retain the composition width and actual font; put a right-edge body near the right edge instead of spanning the empty reserve with its wedge. Keep source captions and art reservations fixed.
5. Run the maintained planner regression and source equality checks, then inspect new native desktop/phone crops. A calculated target or fixture is not the final drawn tail; rounded body samples, fillets and shape variation still require actual pixel review. Verify the pointer remains visible, points toward the correct speaker/edge, stops at least8px before a different body, and touches no protected face, hand or evidence. Retain before/after images and record the next eligible recurrence result.

This repair changes authoring coordinates, not the approved2.1.0 font/balloon configuration or runtime drawing algorithm. Agentic's nine-target source candidate is the first eligible output; new native clearance remains pending until the integrating writer records it.

The next different consumer is Data access-procedure-2, dm-process-existing-brain: Dana’s actual desktop right-edge pointer crossed the empty reserve. The bounded candidate uses the measured native body width and changes desktop x only; its authored LEFT phone override stays unchanged. Original native PNG/hash retained; corrected native review remains pending.

For direct-file review, include comic-config paperTile and paperGrain URLs in the maintained post-build media rewrite. Resolve a paperTile CSS-variable URL against document.baseURI before setting it; relative URLs used from an external stylesheet can otherwise resolve at the wrong depth. Local font preloads must not require a CORS origin. Verify the actual built Home file on desktop and phone as well as HTTP artwork.
