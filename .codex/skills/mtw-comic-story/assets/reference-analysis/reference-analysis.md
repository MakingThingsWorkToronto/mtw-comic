# Comic B: visual analysis of the reference pages

This analysis was measured on 2026-09-28. Raw numbers are in [reference-measurements.json](reference-measurements.json). The pages are in `discussion/reference-comics/`. Each was viewed whole, then as zoomed crops of its balloons, captions, halftone, faces, SFX and gutters.

- **Method:** measured with `sharp` on raw pixels.
- **Units:** "frac" means a fraction of the page width.
- **What was not measured:**
  - Five of the pages are small web scans, 426–452 px wide. Their ink widths are only reliable to about 1–2 px.
  - On those small scans halftone dots mostly fall below the sampling, so dot pitch comes from the 1080 px Darkseid page and the 900 px AllTime page.
  - The duplicate "(1)" file was not analysed.

These pages are **craft references only**. Take none of their characters, costumes, logos, symbols or specific compositions. That covers the Superman S shield, Spider-Man's web suit, Cyclops' visor, the Flash, Darkseid, the Black Queen and Wolverine. Nothing is traced, and none of these pages is ever an input image to a generator.

## The finding that matters most

The references are **colourful pages with black ink**, not dark pages. The generated style key, `model-style-key-v1`, is a dark monochrome page, and that misses the point.

| | Mean luminance (0–255) | Black coverage (L<40) | Saturated pixels |
|---|---|---|---|
| Reference range, 1966–1985 print | 113–150 | 16–36% | 16–37% |
| Modern Superman (the darkest reference) | 80 | 30% | 40% |
| **Generated style key** | **26** | **76%** | **6%** |

Even the darkest reference, a night-fire city, keeps 40% saturated colour. The 1980s look comes from **flat, saturated four-colour fills held inside heavy black ink**, plus paper-white balloons as the brightest value on the page.

"Dark" in Comic B has to come from story, composition, night settings and spotted blacks. It must not come from drowning everything in near-black. The style key needs about three times less black and at least three times more saturated colour. Its colour is also missing flat fills: it uses painterly gradients and fine rain texture where the references use flats and halftone.

## Page by page

### X-Men #132 (1980)

- **Layout:** six panels in three tiers.
  - A wide top tier: a toast, with a long balloon running the full width.
  - A caption strip over a row of four equal small action beats.
  - A splash that takes 55% of the page.
  - A red **NEXT:** footer band.
- **Gutters:** white, 5 px of 426 (**1.2%**).
- **Palette:** black 32% and paper 23%, then flats: cyan `#16a5c7`, deep blue `#1a2b35`, yellow `#d9c91e`, red `#e80711`, brown `#653e1b`, flesh `#d6c1c1`.
- **Captions:** yellow boxes with black rules and italic upper-case narration.
- **Balloons:** one balloon's long thin tail bends right across the panel to its speaker. The speaker in the top tier is off panel, and the balloon still points at him.
- **NEXT footer:**
  - The band is red, in upper-case display caps with white fill and black outline, set against brush-lettered black caps.
  - "NEXT" is stacked vertically in tiny type inside an arrow notch.
  - A yellow starburst sits at the end.
- **Teaches:** pace built by **small equal beats that build to a splash**, and the NEXT banner as a promise.

### X-Men #137 (1980)

- **Layout:** seven panels. There are emotional close-ups cropped from forehead to chin, a wide dark machine panel, and a dense grid of balloons.
- **Gutters:** 1.6%.
- **Palette:** paper 28%, black 21%, cyan `#3ac6ed`, flesh `#f9e39e`, blue `#1e5a78`, yellow `#e8db1d`, red `#e00a0c`.
- **Balloons:** narrow, with 1–3 words per line and 3–6 lines. One speaker gets a chain of two balloons joined by a short neck. **A single word is set in bold italic** for stress ("ONE").
- **Emotion:** carried by eyes, a single tear, and a gaping mouth under a visor. A figure dissolves to white outline (negative space).
- **Teaches:** close-ups carry weight, balloon chains set pace, and "a part of me will always be with you" lands because the panel is quiet.

### Crisis on Infinite Earths #8 (1985), clean scan and printed photo

- **Layout:**
  - A column of **five shrinking inset panels stepping diagonally down** over a huge yellow light burst, showing time running out. Each has a short balloon ("TIME... BACK IN TIME...").
  - "NOOOOO" lettering in red, graded to yellow, crosses panels.
  - A black silhouette stands on a rubble strip against magenta flames.
  - A bottom tier of five narrow panels ends on two glowing eyes.
- **Printed photo:** paper tone `#e6d18a`, black `#191f13`, dot pitch 9 px of 710 (**1.3%**).
- **Teaches:**
  - Panels that step through time.
  - Lettering drawn as part of the art.
  - The **silhouette beat**: a figure in solid black against one saturated colour. It's the strongest "dark" moment in the set, and it's colourful.

### The Amazing Spider-Man #33 (1966)

- **Layout:** a strict **2 × 3 grid of equal panels** telling one moment, a figure straining under weight.
- **Gutters:** 6 px of 426 (1.4%).
- **Palette:** a single flat grey-blue `#83a7b2` covers 31% as the machinery. Red `#d90711` and blue `#0c9ad8` are the only accents.
- **Balloons:** irregular rounded shapes that **hug the text and butt against the panel border**, with 1–3 words per line and up to seven lines. The two double hyphens ("STRENGTH--") are part of the voice. Bold words for stress ("ALL").
- **Teaches:** repeating a shot with small changes builds strain, and a limited flat palette with one accent colour is enough.

### Avengers (1960s–70s), "SLAM!"

- **Layout:** four panels with diagonal speed lines. A giant yellow hand in the foreground is the scale device.
- **Gutters:** 7–8 px of 452 (**1.6%**).
- **SFX:** "BRAKK" and "SLAM!" are about **12% of the page width** in letter height, green or blue with a 2–3 px black outline. Figures overlap them.
- **Teaches:** impact lettering, and diagonal energy. For Comic B, **SFX belong to the 8-bit version**, so take only the diagonal composition.

### Darkseid / X-Men crossover (1982), the 1080 px scan

- **Layout:** two long reaching-hands panels with a close-up **inset**, a tier with a long monologue set against a wide city backdrop, a caption box with 5 lines of 5–7 words, and a narrow panel of figures lying on slabs.
- **Gutters:** 12–13 px of 1080 (**1.2%**).
- **Halftone:** an orthogonal square grid with **pitch 9 px (0.83% of page width)**. Dot diameter is about 50% of pitch. It's used on flat backdrops (the blue field behind the hands, lavender sky), never on figures' costume flats.
- **Balloon measured** ("YOU WASTE YOUR BREATH, YOUNGLING."):
  - 163 × 62 px, a width-to-height ratio of **2.6**.
  - Cap height 10 px (**0.93% of page width**) and line pitch 13 px, which is very tight leading.
  - Outline about 2 px (**about 0.2 × cap height**).
  - Tail 22 px long with an 8 px base: short, tapered and gently curved.
- **Captions:** rectangular white boxes with a 2 px black rule. Emphasis in italic lower case ("*uh*").
- **Teaches:** the inset over a wide backdrop, a long speech against scale, halftone as backdrop texture, and one villain colour (blue-grey) controlling a whole tier.

### AllTime Comics #15 (independent, contemporary)

- **Colour:** hot neon: magenta `#d2207c`, orange `#e8532d`, yellow `#f2d131`, olive-green `#77873c`, on cream paper `#f7f1e3`.
- **Gutters:** wide, 21 px of 900 (**2.3%**).
- **Print artifacts:** visible cyan misregistration (about 2–3 px) and halftone at 7 px pitch (0.78%).
- **Balloons and captions:** screams go in **jagged burst balloons**, lettered in slanted hand italic. Captions are yellow with a 2 px rule and bold key nouns.
- **SFX:** "WHOOOSH" is about 8% of page width, pink with dark spots, and breaks the panel border.
- **Teaches:** permission for colour beyond the brand palette, especially sick greens and acid yellows for villains, and that print imperfections read as authentic.

### Modern Superman page

- **Layout:** four panels with black gutters (16–21 px of 800, 2.1%).
- **Rendering:** a digital painted finish with gradients, rim light and fine hatching on muscle. A wide city establishing shot, a close-up, and a flying shot.
- **Numbers:** the darkest reference (mean luminance 80, 30% black) and the most saturated (40%), all warm orange-red against deep blue.
- **Teaches:** the *modern* end of the range, with depth and wide panels that parallax well. It's **not** the rendering model: Comic B is flat 1980s colour, not painted gradients.

## What Comic B must do

### (a) SVG art

1. **Luminance and colour targets per panel, measured on the rendered SVG:**
   - Mean luminance 60–100.
   - Black (L<40) 30–50%.
   - Saturated pixels at least 12%.
   - At least three distinct flat hues: teal, skin, and one warm or villain cue.
   - Grade: darker than any 80s print page but never below 50 luminance. The generated style key, at 26 luminance and 76% black, fails.
2. **Flat fills only, no gradients.** Shading is black ink shapes (spotted blacks, feathered edges) plus halftone patterns. Radial glows are not allowed. Light comes from flats that change colour where the light falls.
3. **Palette, 80s four-colour process mapped onto the brand:**

   | Plate role (measured 80s value) | Comic B hex | Use |
   |---|---|---|
   | Ink black (`#060506`–`#0b0707`) | `#050607` (ink) and ground `#0b1419` | Contours, spotted blacks, gutters |
   | Cyan (`#16a5c7`, `#3ac6ed`) | `#1a9ba1` and `#5fc4c9` | Screens, the second brain, steered heroes. **The brand teal sits exactly where 80s cyan flats sat** |
   | Deep blue (`#1a2b35`, `#1e5a78`) | `#1d3a4a` and `#274e63` | Night sky, glass towers, suits |
   | Flesh (`#f9e39e`, `#d6c1c1`) | `#e9c29a`, `#c98f6b`, `#8a5a3f` | Skin, three tones for range |
   | Yellow (`#d9c91e`, `#f2d131`) | `#d9b23a` | Captions (drained ochre), practical lights |
   | Red (`#e00a0c`, `#e80711`) | `#c8202a` | Warnings, the Rogue Agent |
   | Paper (`#f7f1e3`, `#fcfdfd`) | `#f2f2ef` | Balloons, highlights |

   | Villain | Cue colours |
   |---|---|
   | Slop | `#8a9a3c` sick olive, with `#c6cf6a` |
   | Hallucination | `#8a9a3c`, with gold footnotes `#d9b23a` |
   | Snowball | `#cfe3ee` and `#8fb3c9` |
   | Blindspot | sodium orange `#e8872d` |
   | Shadow | violet `#6b3fa0` and `#a07ad0` |
   | Shelf | dusty gold `#b08a3a` |
   | Amnesia | fog grey `#9aa4a8` |
   | Rogue Agent | `#c8202a` on black, no teal |
   | Overhead | pinstripe grey `#5d6468` |

4. **Halftone:**
   - Pitch **0.8–1.3% of panel width**: 13–20 page units on a 1600-wide panel.
   - Round dots on an orthogonal grid (45° allowed for skin), with dot diameter 40–60% of pitch.
   - Used on backdrops, skies, skin shading, light falloff and the villain's colour field. Never on balloons.
5. **Ink weights, relative to panel width:**
   - Contour 0.3–0.5% (the heaviest, for figures in front).
   - Interior detail 0.12–0.2%.
   - Hatching 0.06–0.1%.
   - Contour to interior is about 2.5 : 1.
   - Feathered brush ends, which are tapered strokes rather than uniform-width strokes. Spotted-black masses count toward black coverage.
6. **Silhouettes:** at least one silhouette beat per issue, a figure in solid black against one saturated flat (after Crisis).
7. **No text, no balloons, no logos in art.** Leave the balloon clear zones as calm flat or halftone areas, not busy detail.

### (b) Panel layouts, 16:9 pages

Reference pages are portrait. Comic B pages are landscape, so use **tiers as vertical columns or as horizontal bands.**

- **Gutters:**
  - Black gutters 1.2–1.6% of page width, the 1980s value. Modern black gutters run to 2.1%.
  - Keep the one ink ground, with no cream paper around the page.
  - The engine's 3 px outline plus a black page gives about 0.2–0.3%, which is too thin. Use about 1.3% of page width between panels.
- **Mix per page:** one dominant panel (40–60% of the page area) plus 1–4 smaller beats.
- **Proven patterns:**
  - A wide establishing band over small beats.
  - An equal row of 3–4 that builds to a splash (X-Men 132).
  - A stepped diagonal of shrinking insets for time (Crisis).
  - An inset close-up over a wide backdrop (Darkseid).
  - An equal grid of one repeated shot for strain (Spider-Man).
- **Borders:** a panel may break its border only for a silhouette or a reaching hand. Keep that rare, about one in ten panels.

### (c) Balloons, captions and lettering: exact deltas to `comic-story.css`

| Property | Measured reference | Current CSS | Change |
|---|---|---|---|
| Base weight | Medium hand lettering; emphasis in bold italic | 700 everywhere; `em` is only italic | Base weight **400–500** (add Comic Neue 400); `em` **700 italic** |
| Line height | Line pitch about 1.3 × cap height, about **1.0–1.05** of font size | 1.18 | **1.04** |
| Letter spacing | Loose, about .02–.04em | .015em | **.03em** |
| Outline | About 0.2 × cap height, about **.13–.15em** | .13em | Keep, and use **.14em** on phones |
| Padding | About 0.5 cap top and bottom, 1 cap at the sides, so **.35em .75em** | speech .78em 1.25em | **.4em .8em** (balloons hug text) |
| Shape | Width-to-height ratio 2–3 for 2–3 lines; irregular rounded shapes hugging text; butted against the panel edge when at the border | `border-radius: 50%` (true ellipse on any box) | Use **`border-radius: 48% / 50%`** plus a slight asymmetry per balloon, or SVG paths. Allow `edge: 'top' or 'left'` to butt a balloon flat against the panel border |
| Width | 15–35% of panel width; 1–4 words per line | default w .34 | Default **.26**; cap at .36 |
| Words | 2–12 per balloon, 3–7 lines in close-ups | ≤ about 12 words | OK |
| Tail | Tapered wedge 0.35–1.0 × balloon height; base about 0.12–0.15 × balloon width; gently curved; stops short of the mouth by about 25% of the distance | straight from the edge to the speaker | Curve it (quadratic), base **.13w**, stop at **75%** of the distance |
| Chains | One speaker, 2 balloons joined by a short neck | none | Optional `chain: true` joins the next balloon of the same speaker |
| Caption fill | 80s yellow `#d9c91e`–`#f2d131`; modern white box | ochre `#c49a45` | **`#d9b23a`** (drained 80s yellow; reads on black), black rule .1em, italic narration allowed |
| Scream | Jagged burst outline | none | Add `kind: 'burst'` (spiky polygon), rare |
| Thought | Cloud plus a trail of 2–3 shrinking bubbles | present | OK |
| Paper | `#f7f1e3` to `#fcfdfd` | `#f2f2ef` | OK |
| Text size | Cap height about 0.93% of page width, about 2–3% of panel width | scales with camera | At camera framing, the **minimum is 15 px desktop and 15 px phone**, and the **target cap height is 2.5% of panel width** |
| NEXT band | Red band, white outlined display caps, "NEXT" stacked vertically in an arrow notch | teal tag, paper heading | Keep teal (it's the brand's red here), but **stack "NEXT" vertically** with an arrow notch and letter the heading in **outlined caps** |

### (d) Motion: which composition suits which camera move

| Composition | Camera |
|---|---|
| Wide establishing band (Superman top, the Darkseid city) | Slow lateral pan across the width (dx 0.08–0.15 over the hold), with layer parallax |
| Equal row of small beats (X-Men 132) | A hard or short cut to each on the beat; no drift; then **pull back to reveal the splash** |
| Stepped shrinking insets (Crisis) | Diagonal track, one step per beat, zoom increasing as the insets shrink |
| Equal grid, one strained moment (Spider-Man) | Locked framing; a small push-in (dz +0.02) on each panel; a grey drain on the last |
| Emotional close-up (X-Men 137) | The slowest push (dz +0.03 over 4+ beats), and balloons one at a time |
| Inset over backdrop (Darkseid hands) | Frame the backdrop; the inset lands later as a separate panel |
| Silhouette beat (Crisis) | Hold with no drift; drain to grey except teal on the song's stop |
| NEXT band | Straight cut, then hold |

### (e) Review checklist for generated art

Grade each panel on a rendered PNG:

1. Luminance, black coverage and saturation fall within the ranges in (a)1. Measure with the script from `reference-measurements.json`.
2. Only flat fills and halftone. Zoom to 300%: no gradient banding and no painterly texture.
3. Ink hierarchy: the contour is visibly heavier than the interior (about 2.5 : 1), with tapered brush ends.
4. Halftone is present on backdrops or skin, with pitch 0.8–1.3% of panel width.
5. Teal appears only as clean light (the second brain, screens, steered heroes).
6. The villain's cue colour controls its panels.
7. The balloon clear zones are calm, with no faces or hands under them.
8. At 100% width, it reads as a 1980s comic page and not as a digital painting.
9. No text, logos, marks or real people except Matt, and no reference character, costume, symbol or composition.
10. Character consistency with the model sheets: face, hair, glasses, clothes.

### (f) Prompt fragments for the generator

- "1980s American comic book art, printed four-colour look: heavy black brush ink contours with tapered, feathered ends, spotted solid blacks, FLAT saturated colour fills inside the ink (no gradients, no painterly rendering), Ben-Day halftone dots (round, orthogonal grid, fine) on backgrounds and skin shading."
- "Night scene, but colourful: deep blue-black sky flats, teal-cyan light from screens as flat shapes, warm flesh tones, one [villain colour] field; about 40% solid black, the rest flat colour; bright enough to read like a printed page."
- "Contour lines about twice as heavy as interior detail lines; clean silhouettes; readable at thumbnail size."
- "Leave the [top-left third] as a calm flat colour field for speech balloons; no text, no lettering, no balloons, no logos, no symbols on clothing."
- For SVG: "Flat polygon fills and tapered ink paths only; halftone as a `<pattern>` of circles; group layers: bg, mid, fig, light, fx."

## The 10 most important rules

1. **Colourful flats in black ink, not darkness.** Target mean luminance 60–100, black 30–50% and saturated pixels at least 12% per panel. The current style key (26, 76%, 6%) fails.
2. **Flat fills and halftone only.** No gradients, no painterly rendering, no radial glow.
3. **The brand teal plays the role of the 80s cyan plate.** It's the only clean light, and the villain cue colours sit beside it as the other flats.
4. **Halftone:** round dots at a pitch of 0.8–1.3% of panel width and 40–60% diameter, on backdrops, skin and villain fields, never on balloons.
5. **Ink hierarchy:** contour 0.3–0.5% of panel width, interior 0.12–0.2%, about 2.5 : 1, with tapered brush ends and spotted blacks.
6. **Gutters about 1.3% of page width**, black; the engine's 3 px is too thin. One dominant panel of 40–60% area per page, plus 1–4 beats.
7. **Balloons hug their text:**
   - Padding .4em .8em and line height 1.04.
   - Base weight 400–500 with bold italic emphasis.
   - Width 15–35% of the panel.
   - Curved tapered tails that stop short of the mouth.
   - Butted against the panel edge when at the border.
8. **Captions in drained 80s yellow `#d9b23a`** with a black rule. A stacked-"NEXT" banner with outlined caps closes each issue.
9. **Camera by composition:**
   - Pan wide bands.
   - Cut on equal beats, then pull back to the splash.
   - Track stepped insets diagonally.
   - Push slowest on close-ups.
   - Hold on silhouettes.
10. **One silhouette beat per issue**, and emotion carried by close-ups (eyes, a tear, a mouth). That's where the darkness lives, in homage to Crisis and X-Men 137. Never copy a reference character, costume, symbol or composition, and never feed these pages to a generator.
