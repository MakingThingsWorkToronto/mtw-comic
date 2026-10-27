# Deslop: every rejected pattern, what replaces it, and how it is checked

Matt, 2026-09-28: "do everything you can to add deslop to the skill so this does not repeat." A pattern here has already been rejected once. Do not reintroduce it; the lint (`site/scripts/comic-story-deslop.mjs`) fails most of them, and the style check (`comic-story-style-check.mjs`) and `ai-slop-check` catch the rest. When a new pattern is rejected, add it here, to the lint, and to [lessons](lessons.md), in both skill editions.

## Matt's corrections (2026-09-28)

| Rejected | Source | Replacement | Check |
|---|---|---|---|
| A slideshow or presentation look: centred cards, title bars, chapter slates, a masthead | "looks like a presentation layout", "not a slideshow" | A whole comic page; nothing but boxes, balloons and captions | lint (component chrome), style check |
| Even grids of equal boxes | "don't use proportional sizing in scenes ... unless it's a rapid few sections" | Varied box sizes, one dominant box; `rapid: true` on at most one scene | lint (grid), story check |
| Camera zooms, pans, vertical motion inside a scene | "do not use vertical animations. this should be legit comic book" | The whole page always shows; boxes fade | engine has no camera; review |
| Fancy exits: ink wipes, film scratch, torn halftone, slides | "no fancy animations ... just simply fade each box out" | Each box fades, in reading order, in and out | lint (engine) |
| Rough, wobbly box edges | "those are crisp" | Crisp ruled borders, square corners | lint (CSS radius), engine border has no wobble |
| An HTML-vector page outline | "it looks like html vector, we want comic book" | Generated page art owns the outline (page-art mode) | style check |
| A boxed-in frame with borders on every side | "they do not have n/s/e/w borders" | Borders only where boxes meet; a box may bleed | review |
| White paper ground everywhere | "the white background here isn't what we want" | Dark ground; brand-teal gutters and margins (Matt, 2026-10-09) | lint (paper) |
| Large margins | "we look big" | The references' ratios of the short side, in whole pixels | lint (constants), style check (render within 1 px) |
| Generic oval or square balloons, triangle tails | "do not use generic ovals or squares for speech bubbles" | Shapes drawn around composed lettering from `balloon-style.json` | style check (IoU when the shape analysis lands) |
| Wobbly balloons for ordinary speech | "the speech bubbles where the character is spooked out only have those edges" | Clean speech; `fear` is the only shaky balloon | lint (kinds) |
| Cartoon thought clouds (regular scallops, spikes) | "some of the chat cloud bubbles look cartoon" | Shallow irregular lobes hugging the text; few small oval beads | style check |
| Balloon styles the comics do not use (dashed whisper, double-ruled machine) | "if you have styles not used in the comics remove them" | Speech for everyone, Claude and Codex included | lint (kinds) |
| Engine-drawn overlays: film grain, vignette, shimmer, rain and brain overlays, grey wash | same | Motion only from the art's own `data-fx` groups, or none | lint (CSS, engine) |
| Villain roll calls in captions, titles, NEXT | "Villains are announced by the trouble they cause, not by name" | Show the damage; a character may name one later | lint, story check |
| Marketing copy in balloons | spec | Story over fact; claims only from cleared copy | articulation, rubric |
| Too-dark painterly art, modern digital illustration | "not like the reference images", "we want 95% same style" | The reference style: hand ink, dot screens, flat colour, in black and teal | art pipeline gate |
| Controls, hints or progress over the page | Codex critique 01, Matt | A strip below the page | lint (overlay) |
| Placeholder descriptions drawn as big lettering | Codex critique 01 | A plain dark box | lint (placeholder) |
| A hard-coded ghost opacity | "the 30% is a guess ... make it a constant" | `ghostOpacity` in page-constants | lint (ghost) |
| Opaque balloons | "some transparency in those yellow and other bubbles would be worth it" | Fills at `fillAlpha` (0.8-0.95), ink opaque | lint (fill alpha) |
| A box revealing before its art is in (blank, half-drawn or popping in) | "never reveal a half-loaded box" | The preloader; a box's content stays at 0 until its art is decoded | screenshot with `--query loader` and at a scene start |
| Stacked translucent shapes in a balloon (a darker stem where tail meets body) | "an obvious overlay opacity issue in their stems" | One paper group with one opacity; one ink ring masked by it | style check seam test (flat grey, fill range at most 2 levels) |
| The wrong balloon for the speaker (a calm line in a burst, a scared line in plain speech) | "use the correct chat bubble style depending on if it is people, chat, spooked" | `state` on the balloon decides the kind (usage table) | story check (state vs kind) |
| Invented control styles | "we have invented new styles and i don't like them as much" | The canonical motion toolbar (MotionToolbar.astro, the 8-bit Beat Comic's) | lint (controls) |
| An overlapping box that reads as a floating overlay | "the margin is reconstructed so it still looks like a comic book" | A full gutter band of brand teal around it, then its border; never a shadow, offset or ghost | lint (inset), story check (outer edge) |
| Anything not in the references and not an exception | "ensure what is created is not invented" | Cite it in assets/style-provenance.json, or get Matt's decision | lint (invented), style check invention pass |
| Blur, soft edges, rasterized art | "looking for something sharp" | SVG, whole-pixel geometry, no filters | lint (CSS, art) |
| Cloud thought balloons, and any kind not in the measured usage table | root 2026-09-29, the balloon-shape analysis | The usage table: speech (calm, device, off-panel, weak, menace), thought, burst (shout, scream, panic), fear (scalloped), captions | lint (recipe, invented, voice), checker (state vs kind) |
| A word broken across lines ("WEDNES DAY"), or the browser wrapping lettering | Matt, round 2 brief | The engine composes lines (`composeLines`), `white-space: nowrap`; a caption that cannot fit grows its inset or moves to the host | lint (lettering) |
| Re-tinting a measured element to match another surface (balloons in the page paper colour) | "i think you invented the color change" | Balloons #f4f4f4 (measured); brand teal for margins and gutters; sampled paper retained separately | lint (colour), style check mean test |
| A texture that shifts a balloon's colour, or lightens an empty box | "if you need to add texture do it" | Mean-preserving grain in balloons; multiply only over art and paper; the art layer carries the dark base | style check mean test (within 1 level) |
| Oversized, bubbly lettering; fat pillow balloons; thick outlines; stubby tails | "chat bubbles have regressed significantly", "they look cartoon" | Cap 1.2% of the short side (floor 15 px desktop, 14 phone), padding 0.6c, n 4.5, stroke 0.2c, 1.9c tapered wedge; never inflate a body | lint (recipe ranges), golden compare |
| Type shrunk below the readable floor to look tight | "don't make too small" | 15 px desktop, 14 px phone; captions at the dialogue size | golden compare (font size) |
| A yellow balloon with a wedge tail, beads on a white balloon, or yellow for anything but thinking and captions | "the stem of the bubble should standardize that" | White + wedge for every voice; yellow #ede614 + bead stem for thinking; yellow squares for captions | lint (colour, stem) |
| A stray one-word line in a balloon | engine round 2 | The composer never leaves a line under 0.45 of the widest | golden compare (lines) |
| Images saved in `discussion/comic-b/` or left in the art work cache (204 and 59 by 2026-10-02) | "all images generated are supposed to be placed in the image-library so i can preview, i see that rule broken often" | Every tool writes under `wiki/image-library/assets/` and registers in the same run (`scripts/comic-story-library.mjs`, the art pipeline's `sheet`) | deslop lint `library` rule |
| Drifting from the approved standard | "looks perfect. standardize" | balloon-style.json 2.0.0 and assets/golden/ | `comic-story-golden.mjs` (fails on regression) |

## Codex's HTML failure modes (reference descriptors) and critique 01

1. A dashboard-like grid (equal cards, padding): varied boxes, one dominant.
2. Rounded corners and drop shadows: square, flat.
3. Perfect ellipses with generic triangle tails: shapes around composed text, tapered curved tails.
4. Uncontrolled browser text wrapping: composed `\n` line breaks, never the browser's wrap (lint: more than 4 words without a break fails).
5. One uniformly heavy comic font for everything: dialogue, bold-italic stress, captions tighter, shouts in Bangers.
6. Uniform vector strokes: outline weight from the page width with modest variation; borders measured.
7. Dark teal everywhere at one brightness: the value ladder (#071312, #123d3b, #247a74, #55c6b6, #e7ebdd), a light value kept for balloons.
8. Gradients and glow: flat shapes only.
9. A universal dot or distress overlay: none; screens belong in the art.
10. Arbitrary responsive reflow or cropping: reading order kept; tails and insets preserved.

Critique 01 also fixed: captions flush to a box corner (place caption top-left, narrative below it, a small even gap), one dialogue size across the page, about one cap height of padding, baseline pitch about 1.3 cap heights, selective bold italic, no teal hairlines or inset frames.
