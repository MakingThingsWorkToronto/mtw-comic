# Historical Comic B art pipeline (retained provenance)

This is the prior pipeline text, retained to interpret earlier assets, recipes and experiments. Its numeric 95 thresholds, mandatory calibration/trace passes and demo-first/style-gain loops are superseded by Matt's 2026-10-04 style acceptance and 2026-10-08 outcome-focused cleanup. Do not execute its old queue or treat its paths as current art bindings. Use [the current pipeline](art-pipeline.md).

# Comic Story art pipeline (craft v2)

How Comic B art is made: art that copies the 1980s reference pages' drawing and printing, in black and teal, delivered as sharp, layered SVG and reproducible from an art brief. The scripts are in `scripts/art/` (README there). The facts they serve are in `wiki/site/comic-story.md` (cast and style sheet), `assets/reference-analysis/reference-analysis.md` and `reference-measurements.json` (the measured reference pages), and the "Comic B" paragraphs of `discussion/spec.md`.

## Matt's direction this craft encodes (2026-09-28)

- **"Crisp vector":** SVG, sharp at any camera zoom, in layers that move.
- **"95% same style minimum" and "I provided the reference images so you could copy":** hand-inked line, feathered hatching, spotted blacks, dot screens, flat print colour and a newsprint feel, copied from the reference pages. That includes their page layouts and panel compositions when a brief names one. Never their characters, costumes, symbols, logos or text.
- **"Black and teal":** night and shadow are black and the teal family, never blue or violet.
- **Darker than the references:** about 55–65% black, with colour only where light falls.
- **"Lean into the darkness in the cinematography":** low-key light, silhouettes, and light only where it tells the story.
- **"Looking for something sharp":** crisp, confident ink edges. Soft or mushy output fails.

## Why this method

| Try | Result |
|---|---|
| Bake-off A: trace a detailed raster | Blotchy speckle, 0.6–1.3 MB |
| Bake-off B: Codex writes SVG by hand | Tiny and layered, but reads as clip-art |
| Bake-off C: vector-ready raster, colour-traced (craft v1) | Crisp shapes, but Matt found the model sheets looked like modern digital illustration, not 1980s print. Flattening the drawing for tracing removed the hatching and line quality that make the style |
| **Craft v2:** print-style raster copying the reference pages, split into print plates | The drawing survives in an ink plate traced at high fidelity, and colour becomes flat plates with halftone underneath, as comics were printed |

## Calibration first

Before any model sheet or panel, the pipeline remakes each reference page (`wiki/image-library/records/comic-b-art-pipeline-inputs-20260928/calibration-brief.json`, one row per page, skipping duplicates). Each remake copies its page closely: layout, compositions, line, hatching, dots and colour handling, with our cast, our setting, black and teal, and no text. Each is scored with the gate. The best two or three remakes become `styleAnchors` in `trace.config.json` and are attached to every later generation, so everything inherits a style already proven against the references. The contact sheet shows each reference beside its remake.

## Inputs to every generation (`prompt` stage)

In order, at most `maxStyleInputs` style inputs, then the cast:

1. **`after` (panels that name a reference panel):** a crop of that panel (`crop`, fractions of the page) as the **composition reference**, and its whole page as the style and composition source. Crops and PNG conversions are made in the work folder. The copyrighted pages never enter the repo, and records list their source path and hash.
2. **Style anchors:** our calibration remakes.
3. **Reference pages:** the brief's `refs`, or the config's `styleSets[styleSet]` (faces, action, print, city).
4. **Cast model sheets:** the newest sheet for every cast member. These are for identity only; the style comes from the references.

The prompt fragments come from `prompt-fragments.default.md`: `style95`, `black-teal`, `cinematography`, `darkness`, `ink-plate`, framing (`full-bleed` for panels, because the page engine draws the black borders and newsprint gutters; `page-frame` for calibration pages; `sheet-frame` for sheets), `copy-rules` and `avoid`. Then comes the exact palette. **Pass PNG inputs**: Codex's image tool rejected a valid JPEG as `invalid_image_file`.

## Stages

| Stage | What it does |
|---|---|
| `prompt` | Assembles the prompt and inputs, and writes `work/<id>/prompt.txt` and `inputs.json` (paths, roles, hashes) |
| `generate` | Runs `codex exec` into a staging folder outside the library. Then, under the registration lock, it moves the PNG into the library, copies its records and registers it. Safety-system refusals are reported as such |
| `trace` | Builds the print plates. The **ink plate** is dark pixels (L < `ink.threshold`), traced by potrace (potracer) at 2× for tapered, crisp edges, as one evenodd path on top. The **colour flats** are the raster median-filtered, snapped to the black-and-teal palette, traced by vtracer with low detail (speckle 16), and grouped `bg / mid / fig / light / fx` with `data-layer` and `data-depth`. **Halftone** refills the `nightTeal`, `tealDeep`, `skinMid` and villain-cue flats with round dot `<pattern>`s at the measured pitch. An optional feTurbulence **grain** is off by default because Chrome re-filters it on every camera frame. The stage then runs svgo (pinned config) and records and registers the SVG under the lock |
| `review` | Renders a 1600 px PNG, a 3× zoom crop and the source raster |
| `measure` | Compares measured features with the references (below) |
| `score` | Runs Codex's independent, read-only review of the rendered SVG against the reference page(s) it copies, plus the cast sheets. It returns scores for style (and for composition and identity where they apply) and an **invention list**: every element or treatment not found in the reference pages and not among Matt's exceptions (the dark black-and-teal palette, our cast and settings). The answer is schema-bound, written to `codex-score.json`, and logged as a row in the art log |
| `judge` (manual) | The author reads the render and the 3× zoom beside the reference pages, and records the style score (0–100), the composition score when the brief names a panel, and reasons. The row goes to `wiki/image-library/records/comic-b-art-log-20260928-20261002/art-log.md` |
| `integrate` (manual) | Copies the SVG to `site/public/comic/<story>/<id>.svg`. **It refuses unless the same file passed every part of the gate. There is no override flag** |

`all` runs `prompt` to `measure` (two jobs at most) and never integrates. `sheet --pair-refs` puts each render beside its reference page (or its reference panel crop) and its 3× zoom.

## The gate: zero images that miss the references

Matt (2026-09-28): "give me 0 images that do not hit the reference images", and "nothing invented". A failing image is never integrated and never shown to Matt. It is registered in the library as a draft, with its failing scores in the art log. `integrate` enforces all of the following for one and the same SVG file:

- **Measured** (`measure.json`, with the targets in `trace.config.json` → `measure`):
  - Black: 55–65% for panels, 45–70% for pages, 35–75% for calibration pages.
  - Saturated light present.
  - Flat colour.
  - Halftone patterns and the ink plate present.
  - Line weight: ink run P50 within the reference pages' range × 0.7–1.5.
- **Author's judge** (`judge`): style ≥ `judgeMin` (95). Composition ≥ `compositionMin` (90) when the brief names a reference panel. Soft, mushy, wobbly or speckled edges at 3× fail.
- **Codex** (`score`): style ≥ `codexStyleMin` (95); composition ≥ 90 and identity ≥ 95 when they apply; and an **empty** invention list.

**One-correction rule:** a failure gets one focused correction (`--version N+1` for a new generation, or `--retrace K` for a new trace of the same raster under a new config version). Every version stays registered.

## Whole-page art (the page method, 2026-09-28)

Matt judged per-box art as "a slideshow, not a comic" and the drawn page outline as looking "like html vector". So a page is now **one generated image**, including its hand-inked box borders, gutters and margins, and the engine reveals regions of that single artwork. This is how `calibration-xmen137-v1` was made, and the coordinator called it "exactly the direction".

1. **Page spec** (the Home example is `wiki/image-library/records/comic-b-home-p1-layout/layout/v2/home-p1.page.json`): the page size (2400×1500, 16:10 wide), margins and gutter taken from the reference page's measurements (X-Men #132: margins about 1.9% of width, gutters about 1.2%), and each box's rect copied exactly from the story data (`site/src/data/comic-stories/<story>.ts`). `open` marks a box that bleeds with no border; `poly` gives a diagonal or inset region.
2. **Layout template** (`page_tools.py template`): a dark ground (`#0b1419`; Matt: "dark by default", so margins and gutters are never newsprint) with the boxes as grey fills with faint numbers, and the open box shown bleeding off the page. Register it in the library (`assets/scenes/comic-b/pages/templates/`, treatment `layout`).
3. **Page brief** (`wiki/image-library/records/comic-b-art-pipeline-inputs-20260928/pages/<page>.brief.json`, `kind: "page"`): the prompt names every box as `BOX n (template box n, after <reference> panel n): <box prompt>`. `inputsFirst` makes the template input image 1. `after.ref` attaches the reference page with the "THE PAGE TO COPY" role, so box n copies panel n and its hand-inked borders. The config's `styleAnchors` attach the calibration page, and the cast sheets are added (`noSheetFor` skips a villain that must not appear as a figure). Framing uses the `page-frame-dark` fragment.
4. **Generate and trace** with `comic_art.py all --panel <page> --brief <page brief>`. The ink plate keeps the border ink. Whole pages may be up to `maxBytesPage`.
5. **Regions** (`page_tools.py detect`): finds each box's gutter band on the generated page (a band one gutter wide that is dark along the whole edge, searched within ±3% of the template edge) and writes `<page>.regions.json` (default in the art work cache; `--out` names another path) in page fractions, with an overlay PNG (template in red, detected in teal). **Read the overlay.** If any box drifts more than 1.5% of the width, regenerate once. If it still drifts, the detected regions win, because the engine reveals regions of the art as it is.
6. **Codex validation** (`page_tools.py validate --ref <reference page>`): a read-only `codex exec` with the reference page and our page, and a JSON schema for the answer. It asks for strict 0–100 scores for layout, style and each box's composition, with reasons, telling Codex that dark gutters are intended. The target is layout ≥ 90 and style ≥ 95. One correction at most.
7. **Integrate** the whole-page SVG to `site/public/comic/<story>/<page>.svg` only after the gate.

## Calibration results (running log)

| Page | Result |
|---|---|
| X-Men #137 → `calibration-xmen137-v1` | The coordinator called it "exactly the direction". It copies the reference's layout and each panel's composition closely, with the ink line, hatching, dot screens, black-and-teal night and paper gutters. Watch-out: copying a page of a masked hero makes Claude's visor read like that hero's visor. Faces, hair and visor shape must follow our model sheet, not the reference character. Traced: 358 KB (128 KB gzip), 4,653 ink curves, **526 s of potrace at 2×**, which is too slow for 60 panels, so the ink scale is under review |

## Pins

Codex CLI 0.154.0, Python 3.14.4, vtracer 0.6.15 (**called positionally**: keyword arguments segfault under Python 3.14), potracer 0.0.4, numpy 2.5.3, Pillow 12.3.0, Node 24.15.0, svgo 4.1.0 and sharp 0.35.4 (`versions.lock.json`). Every record stores the effective config (frozen at the trace stage, so a config edit mid-run cannot mix settings) and the hashes of the config and the analysis. Everything after `generate` is deterministic. Codex image generation is not, so its exact request is recorded and the registered raster is the fixed point.

## Registration lock

The library helper hashes every tracked file and refuses to register while any file is unregistered or changed. Two failures taught the rules:

- On 2026-09-26 two sessions deadlocked, each waiting on the other's unregistered image.
- On 2026-09-28 a registration hashed a Codex log that was still being written, and every later registration failed until the registered prefix was restored.

So: Codex writes only into the work folder. Image and records land in the library, and are registered, in one step under a lock that spans every `comic_art.py` process (`work/_register.lock`). Registered files are never edited afterwards. Scores and verdicts live in the art log.

## Raster delivery and colour separation (2026-09-29)

Matt chose "Hi-res image". Page art is Codex's raster. The engine keeps balloons, borders and lettering vector. `integrate` encodes WebP and AVIF at no less than `displayWidthCss` × `dpr` (upscaling with Lanczos when the master is narrower, recorded in its output), and the PNG master stays in the library. Vector plates are an optional stage (`--retrace K`).

The `print` stage separates colour the way a 1980 print job did: k-means down to 18 flat colours, no dither. It is deterministic and registered as `<id>-vN-print.png` (treatment `comic-ink-print`); it is the delivered master and what the gate scores. On calibration-xmen137 v8 it lifted Codex style from 82 to **85** with an empty invention list.

## Style-lock log (calibration-xmen137, Codex style, invention list)

| Round | Prompt change | Style | Inventions flagged |
|---|---|---|---|
| v1 | craft v2 | 65 (62 before the reviewer was told the cast designs are allowed) | glow, glossy visor, reflections, distressed grain, etched detail |
| v2 | forbid those treatments; crisp ruled borders; flat paper gutters; measured dot pitch | 64 | bloom, visor gradient, rim light, glossy floor |
| v3 | light only as hard-edged flat shapes; burst as flat white and cyan star shapes with ink speed lines; no reflections or rim light | 72 (74 on a rescore, so the scores vary by about ±3) | visor gradient, grain, stippled contours |
| v4 | no grain; visor one flat fill; continuous outlines | 64 | glow, stipple |
| v5 | reference scans upscaled to 1024 px for Codex | 79 | window fades, mottled texture |
| v6 | no fades; no distress on colour fields | 76 | burst and visor gradients |
| v7 | depth and movement fragments; chunky, variable brush ink | 76 | teal gradients; depth planes not present |
| **v8** | **one limited set of 12–16 flat colours, separated like a 1980 print job** | **82, with no inventions** | none; depth planes missing in close-ups |
| v8-print | the `print` stage (18 flat colours) | **85, with no inventions** | none; depth planes missing in close-ups |
| v9 | brush irregularity and "unevenly printed dots" | 68 | grain and mottling: **asking for print roughness invites grain, so don't** |
| v10 | v8 wording plus depth in close-ups | 74 | visor gradient |
| v8-reprint (2026-10-02, no generation) | raster reprint: ink despeckled, stipple flattened, round dots at the measured pitch on mid-tone flats | 78 (gentle) / 62 (heavy) | the added dot screen ("oversized, mechanically regular") and "chipped" contours: **adding a screen or rewriting the ink after generation makes it look less printed, so don't** |

**Lessons:** forbid treatments by name; draw light as flat hard shapes; name the colour separation; give Codex reference scans of at least 1024 px; separate colour after generation; never ask for "print roughness".

## Lessons

- **potracer traces the False pixels.** Checked on a test ring: a True ring came back as its complement plus a frame around the image, so every ink plate was inverted (faces black, bursts filled) until the mask was inverted (config v8). Its curves also nest holes as `children`, which must be walked.
- **The ink plate is true ink only:** dark (luminance < 80) AND neutral (chroma ≤ 22). With a plain darkness threshold, the dark-teal flats became black ink and the pages measured 85–98% black. At 1× with threshold 34 the hatching was lost (calibration-xmen137 t2 read as a posterized poster). 2× at threshold 80 keeps it, at about 7 minutes of potrace per page (config v10).
- **Codex scores are far below 95 so far.** On calibration-xmen137, Codex gave the raster style 62 and the SVG (t3) 52. It listed as inventions the large dot texture, posterized patches, glow and bloom, glossy reflections, simulated wear and rough borders, and our own paper-slip coat. Vectorizing costs about 10 points. Reaching 95 needs prompts that forbid those treatments, tighter flats (fewer mottled patches) and a smaller, printed-screen halftone.

- **Safety refusals:** "fused managers sharing one body" and a collar and leash on a humanoid were refused. The same ideas worked as "managers standing shoulder to shoulder" and "a thin teal ring on its neck armour". The good-boy reform is understated: the same shape, still and calm, with a small teal collar or ring. It is never a dog.
- **Model sheets v1** (craft v1) read as modern digital illustration, and Matt rejected the look. They stay registered as drafts. Craft v2 regenerates them.
