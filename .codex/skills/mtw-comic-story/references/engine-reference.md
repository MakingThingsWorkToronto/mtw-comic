# Engine reference

## Shared presentation header

The shared header follows every full-window presentation (Matt, 2026-10-09): comics align logo/navigation to the measured left/right canvas margins; Task Field and Diagram Tour expansion comes from each actual component’s progress. Continuous scroll/fold progress has no extra CSS smoothing; discrete entry/close animates with the presentation. Reduced motion keeps final alignment without animation. Launched presentations contain the actual shared header and existing Close control within the modal, restore the same header on close or before navigation swaps, and preserve Escape/focus return. Verify desktop/phone, activation, resize, exit and reduced motion through the common runtime; never implement a separate per-story/model header.

| Part | File (under `site/`) |
|---|---|
| Schema | `src/data/comic-stories/types.ts` |
| Stories | `src/data/comic-stories/<id>.ts` (one exported `ComicStory` each); `lab.ts` is the style lab's specimen |
| Registry (the only story-to-route map) | `src/data/comic-stories/index.ts`: `comicIssues` (slug, story, `bPage`, `aPage`, cover, villain (data only), `hook`, `ready`) |
| Component | `src/components/ComicStory.astro` (`story`, `mode: 'page' \| 'standalone'`, `still`); imports the skill's `assets/page-constants.json` and `balloon-style.json` into `#comic-config` |
| Runtime | `public/scripts/comic-story.js` (window `MTWComicStory`) |
| Styles | `src/styles/comic-story.css` (fonts: `public/fonts/COMIC-FONTS.md`) |
| Pages | `src/pages/<name>-b.astro` (the comic is the header; the old hero keeps only a hidden `h1`); `src/pages/comics/index.astro` (shelf), `comics/[issue].astro` (reader), `comics/style-lab.astro` (the style lab); all in `BaseLayout` |
| Art | `public/comic/<story id>/<img or page>.svg`, integration copies of `wiki/image-library/assets/scenes/comic-b/` |

## Layout

The stage is a block in the page's flow directly under the MTW header, one screen tall (`100svh` minus the header), edge to edge; a 52 px strip at its foot holds a one-time hint, an Issues button and the site's canonical motion toolbar (MotionToolbar.astro: Let's Talk, Tracklist, Previous, Pause/Play, Next, and the music tag in its slot; the engine registers with `window.MTWToolbar`), and a 1 px progress line. Nothing sits over the page.

- **Page geometry**: from `page-constants` (ratios of the short side, whole pixels): outer margins per side (dark), gutters between boxes (brand teal, one rectangle under the boxes), crisp brand-teal borders where boxes meet, a box's dark base. `bleed: true` runs a box off the window on the edges it touches. `inset: true` overlaps the boxes beneath with a full gutter band of brand teal around it (then its border); it may span boxes in the middle, never touch the outer edge. `open: true` has no border. `clip` cuts a box with a polygon. An SVG group `data-layer="break"` draws outside the clip. The stage carries `data-geom` (gutter, border, margins in px) for the style check.
- **Raster page art** (Matt, 2026-09-29, the default for generated pages): `art: "/comic/<story>/<name>"` with no `.svg` loads `<name>-<width>.avif` and `.webp` at `page-constants.artWidths` (1600 only since 2026-10-11: copies stop at the master's ~1586 px width, no upscales) through `srcset`/`sizes`. The page is **cut into its boxes** (Matt, 2026-10-04: "all be full screen ... scaling the boxes creating desktop and mobile views"): boxes are laid out from `r` exactly like box art (full window on desktop, reflowed on phones), and each box shows its region of the page, `ar` (default `r`), as fractions of the art, inset by `page-constants.artCropInsetPct` (default 0.8% of the art's short side) to drop the art's own drawn borders, scaled to cover the box and centred (`.cs-crop`, one shared decoded image as a CSS background per box). Keep `r` and `ar` close in shape, or the cover crop loses art. Never stack a full-page `<img>` per box: 45 full-page copies left the demo's boxes unpainted (2026-10-04). Balloons, borders, gutters, paper and lettering stay vector/CSS. A box stays dark until its image is decoded (never half-loaded).
- **Page-art mode, SVG fallback** (a scene's `art` ending `.svg`): the generated page (its borders, gutters, margins) is drawn once as a base at full opacity and once per box clipped to its region (`r` or `clip`, fractions of the art's viewBox); only the regions ghost and reveal. Fit: meet, always: the whole generated page shows, full height on a wide window, centred on the brand-teal margin (round 2: never crop its top or bottom).
- **Phones** (under 700 px wide or width/height under 1.2): boxes reflow into portrait pages of 1-2 columns in reading order, several phone pages per scene when needed.

## Preloader

Before an issue plays (not in `?hold` or still mode), the engine loads the start scene's and the next scene's art, the paper tile, the three lettering faces (`document.fonts.load`) and the song to `canplay` (unless muted), showing `.cs-loader`: a blank brand-teal page with retained texture and the issue number in the NEXT tag's ink block, the title in the NEXT heading's caption and one ink progress rule with an honest count (assets done of total). It fades out when all are in, or after 12 s with what is there; during play the engine keeps loading two scenes ahead. `?loader` holds the loader for a screenshot. It sits inside the comic's frame on a -b page and in the reader.

## Balloons

The approved standard and how to reproduce it are in [lettering and balloons](lettering-and-balloons.md). In `layoutBalloons`, each balloon is lettered first and then drawn:

- `letterOf` sets the size and face from the face's measured metrics (`fontMetrics`).
- `composeLines` and `partition` set the lines.
- `speechBody` and `outlinePath` draw the body, with the tail or the `beadStem` spliced in; `burstPath` draws bursts and `placeCaption` places captions.
- A chain or across balloon is drawn inside its head's shape (`drawGroup`): one paper group, one ink ring masked by the paper, and the mean-preserving grain.

Each balloon wrapper carries `data-kind`, `data-state` and `data-geom` (its measured parameters in cap heights, for the golden). `whisper` and `machine` are drawn as speech (deprecated).

**The paper texture** is one multiply layer per page (`.cs-paperfx`, above the page's art and below the boxes) and one per box's art (`.cs-panel__art::after`, the same grain continued by `--px` and `--py`). Balloons (z 6) sit above both and carry their own grain.

## Time and sound

One clock (the song's time while it plays). `music.loop {from, to}` (song beats on phrase boundaries; default the whole song's last full phrase) loops the song under a longer story; story beats map into the loop and stay monotonic. Out of view (under 35% visible) the clock and music pause. Sound is shared with the Beat Comics: `localStorage` `mtw-sound`, `window.MTWTactile`, `sessionStorage` `mtw-mixtape` (crossfade across issue changes, which are real links).

**The score** (Matt, 2026-10-04: "Score plus effects feel free to use music where you want"): when any scene sets `score`, `room` or a box's `sfx`, the song (still the clock) is routed through a Web Audio gain on its first played note. The gain follows the scene's `score` (0-1, default 0), faded from the previous scene's level over two beats. Each scene's `room` (office, servers, street, rain) is a quiet synthesized loop crossfaded by scene. Each box's `sfx` fire as play crosses the box's reveal plus `delay`; a jump, seek or pause never fires a backlog. All twelve effects (buzz, ring, paper, keys, click, whoosh, impact, glass, alarm, door, heartbeat, sting) are synthesized in the engine, with no sound files. Mute and pause reach the score too. A story with none of these fields plays the song at full, as before. `MTWComicStory.sfx('<kind>')` auditions one effect; `status().score` reports the context, routing, level, room and the last effects fired.

## Test hooks

`?scene=<id>&beat=<n>` (or `scene=next`), `?t=`, `?hold`, `?mute`, `?beat=tick`, `?reel=off` (still), `?ghost=0.6`, `?theme=paper`, `?look=crisis` (the other balloon look), `?bg=grey` (flat grey boxes, no art) and `?grain=off` (no balloon grain) for the style check, and `?art=<path without extension>` (raster page art on the `?scene`). To verify the raster path, write the calibration raster (`wiki/image-library/assets/scenes/comic-b/calibration/calibration-xmen137-v1.png`) with sharp as `site/public/comic/_lab/raster-test-1600.{avif,webp}`, load `/home-b/?scene=quote&beat=40&hold&mute&art=/comic/_lab/raster-test` and check three things: the boxes fill the window, each showing its own region of the page; the source is the master's own resolution (no upscales; a box may show fewer than 2x device pixels, which is accepted); no drawn border of the art shows inside a box. Then delete the test files (verified 2026-09-29: 5.6x desktop, 4.5x at 1920, 2.1x phone). `MTWComicStory.status()` (mode, still, scene, sheet, beat, loaded...), `seek(t)`, `go(dir)`, `issue(dir)`, `openIssues()`, `closeIssues()`.

Sound activation retries the existing score context inside the user's gesture, even if muted HTML media already started. Route the media through the score gain before its first `play()` call; initialize the current score again when media readiness resolves, because still mode may have no later animation frame. Explicit sound buttons own their click: the generic first-gesture listener must ignore their pointer events, or a pointerdown unlock can turn the following click into a mute. Preserve paused playback when unmuting. Silent score scenes and quiet room tone are authored behavior, not a reason to replace the score with continuous music. See the sound unlock regression in [checks](checks.md).
