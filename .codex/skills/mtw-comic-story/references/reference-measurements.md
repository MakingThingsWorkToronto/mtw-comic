# Reference measurements: what the reference pages actually are

The measured record of the ten copyrighted reference pages under `wiki/image-library/assets/originals/comic-references/` (moved from `discussion/reference-comics/` 2026-10-11, catalogued for Studio and committed to the private repository by Matt's decision that day; Marvel, DC and one independent page; read in place as Matt's inputs, never traced, never fed to a generator; one file, `97e641f3...-uncanny-x-men-137.w426 (1).webp`, is a byte-identical duplicate and was not analysed). Measured 2026-09-28 with `sharp` on raw pixels; raw numbers are in `assets/reference-analysis/reference-measurements.json`, the data file `comic_art.py` reads as `REF_MEASURES`. Codex's page-by-page descriptors (2026-09-28) estimate from the reduced reproductions, so "W" there means the width of the whole attached image, and physical ink weights and print-screen frequencies are not recoverable from them. Five pages are small web scans (426–452 px wide): their ink widths are reliable to about 1–2 px only, and halftone pitch comes from the 1080 px Darkseid page and the 900 px AllTime page. Take none of the pages' characters, costumes, logos, symbols or specific compositions (Superman S shield, Spider-Man's web suit, Cyclops' visor, the Flash, Darkseid, the Black Queen, Wolverine). Where these pages fall on the style is decided in [style-provenance.md](style-provenance.md); Matt's 2026-10-09 branded-teal border exception overrides the white-gutter figures below for borders, gutters, inset bands and margins.

## Measured reference table

The references are colourful pages with black ink, not dark pages. "Dark" in Comic B comes from story, composition, night settings and spotted blacks, never from drowning the page in near-black.

| | Mean luminance (0–255) | Black coverage (L<40) | Saturated pixels |
|---|---|---|---|
| Reference range, 1966–1985 print | 113–150 | 16–36% | 16–37% |
| Modern Superman (the darkest reference) | 80 | 30% | 40% |
| Generated style key `model-style-key-v1` (2026-09-28, failed) | 26 | 76% | 6% |

Per-panel targets for rendered Comic B art, measured on the rendered SVG/PNG: mean luminance 60–100; black (L<40) 30–50%; saturated pixels at least 12%; at least three distinct flat hues (teal, skin, one warm or villain cue); never below 50 luminance.

Other measured values (fraction of page width unless stated):

| Measure | Value | Source page |
|---|---|---|
| White gutters, 1960s–80s print | 1.2–1.6% (5 px of 426; 6 px of 426; 7–8 px of 452; 12–13 px of 1080) | X-Men 132, Spider-Man 33, Avengers, Darkseid |
| Gutters, independent contemporary | 2.3% (21 px of 900) | AllTime 15 |
| Black gutters, modern | 2.1% (16–21 px of 800) | Modern Superman |
| Halftone pitch | 9 px of 1080 (0.83%), orthogonal square grid, dot diameter about 50% of pitch, on flat backdrops only | Darkseid |
| Halftone pitch, printed photo | 9 px of 710 (1.3%) | Crisis 8 printed |
| Halftone pitch, independent | 7 px of 900 (0.78%), with 2–3 px cyan misregistration | AllTime 15 |
| Measured balloon ("YOU WASTE YOUR BREATH, YOUNGLING.") | 163 × 62 px (ratio 2.6); cap height 10 px (0.93%); line pitch 13 px; outline about 2 px (0.2 × cap height); tail 22 px long, 8 px base, short, tapered, gently curved | Darkseid |
| SFX letter height | about 12% ("BRAKK", "SLAM!", 2–3 px black outline); about 8% ("WHOOOSH") | Avengers; AllTime 15 |
| Paper tones | `#f7f1e3` (cream), `#fcfdfd` (white), `#e6d18a` (printed photo) | AllTime 15, scans, Crisis printed |
| Caption fill | yellow `#d9c91e`–`#f2d131`, black rule, italic upper-case narration | X-Men 132, AllTime 15 |
| Flat palette samples | cyan `#16a5c7`/`#3ac6ed`; deep blue `#1a2b35`/`#1e5a78`; yellow `#d9c91e`/`#e8db1d`; red `#e80711`/`#e00a0c`/`#d90711`; flesh `#d6c1c1`/`#f9e39e`; grey-blue `#83a7b2` (31% of one page); neon magenta `#d2207c`, orange `#e8532d`, olive `#77873c` | X-Men 132/137, Spider-Man 33, AllTime 15 |

## Ten recommendations

Each is checkable on a rendered page.

1. Colourful flats in black ink, not darkness: per panel, mean luminance 60–100, black 30–50%, saturated pixels at least 12%.
2. Flat fills and halftone only: at 300% zoom no gradient banding, no painterly texture, no radial glow; light is a flat that changes colour where it falls.
3. The brand teal `#1a9ba1` (with `#5fc4c9`) plays the 80s cyan plate: the only clean light (screens, the second brain, steered heroes); villain cue colours sit beside it as the other flats.
4. Halftone: round dots on an orthogonal grid (45° allowed for skin), pitch 0.8–1.3% of panel width (13–20 units on a 1600-wide panel), dot diameter 40–60% of pitch, on backdrops, skies, skin shading, light falloff and the villain's field; never on balloons.
5. Ink hierarchy: contour 0.3–0.5% of panel width, interior detail 0.12–0.2%, hatching 0.06–0.1%, contour to interior about 2.5 : 1, tapered brush ends; spotted-black masses count toward black coverage.
6. Gutters about 1.3% of page width between panels (the engine's 3 px outline on a black page is 0.2–0.3%, too thin); one dominant panel of 40–60% of the page area plus 1–4 smaller beats; a border is broken only for a silhouette or a reaching hand, about one panel in ten.
7. Balloons hug their text: padding .4em .8em, line height 1.04, letter spacing .03em, base weight 400–500 with bold italic emphasis, width 15–35% of the panel (default .26, cap .36), 1–4 words per line, 2–12 words per balloon, curved tapered tails (base .13 × balloon width) that stop at 75% of the distance to the mouth, flattened against the panel edge when at the border; cap height target 2.5% of panel width, minimum 15 px desktop and phone.
8. Captions in drained 80s yellow `#d9b23a` with a black rule; the issue closes on a NEXT band with "NEXT" stacked vertically in an arrow notch and the heading in outlined caps.
9. Camera by composition: pan a wide band (dx 0.08–0.15 over the hold, with layer parallax); cut on equal beats then pull back to the splash; track stepped insets diagonally, one step per beat; push slowest on a close-up (dz +0.03 over 4+ beats, balloons one at a time); hold a silhouette with no drift and drain to grey except teal on the song's stop; straight cut then hold on the NEXT band.
10. One silhouette beat per issue (a figure in solid black against one saturated flat), emotion carried by close-ups (eyes, a tear, a mouth); never a reference character, costume, symbol or composition, and never a reference page as a generator input.

## What to take from each reference file

| File | What it shows | What to take |
|---|---|---|
| `1702654463856e_800x800.webp` | A modern, painted Superman page: a wide city establishing shot, a close-up, a flying shot, warm cinematic light; black gutters 2.1%; mean luminance 80, 30% black, 40% saturated | The modern end of the range: camera and environmental scale, wide panels that parallax; not the rendering model (Comic B is flat 1980s colour, not painted gradients) |
| `3f8e7bfd...-1980-uncanny-x-men-132.w426.webp` | 1980: a toast in a villain's club with a full-width balloon, a caption strip over four equal small action beats, a splash taking 55% of the page, a red "NEXT: WOLVERINE ALONE!" footer | Pace built by small equal beats building to a splash; the NEXT banner as a promise (red band, white-filled black-outlined display caps, "NEXT" stacked vertically in an arrow notch, a yellow starburst); an off-panel speaker's tail bending across the panel |
| `83ca1685...-1985-crisis-on-infinite-earths-8.w426.webp` and `the-death-of-barry-allen-photo-u1.jpg` | The same 1985 page clean and printed: five shrinking insets stepping diagonally down over a yellow burst, "NOOOOO" lettering red graded to yellow across panels, a black silhouette on a rubble strip against magenta flames, a bottom tier of five narrow panels ending on glowing eyes | Panels that step through time; lettering drawn as part of the art; the silhouette beat (solid black against one saturated colour), the strongest dark moment in the set and still colourful |
| `97e641f3...-1980-uncanny-x-men-137.w426.webp` | 1980: seven panels of emotional close-ups cropped forehead to chin, a wide dark machine panel, a dense grid of narrow balloons (1–3 words per line, 3–6 lines), one speaker's two balloons joined by a short neck, a single word in bold italic, a figure dissolving to white outline | Close-ups carry weight; balloon chains set pace; a quiet panel lets a line land |
| `AllTime-Comics-15.jpg` | Independent, contemporary: hot neon magenta/orange/yellow/olive on cream, wide gutters 2.3%, visible misregistration and 0.78% halftone, jagged burst balloons in slanted hand italic, yellow captions with bold key nouns, "WHOOOSH" at 8% breaking the border | Permission for colour beyond the brand palette (sick greens and acid yellows for villains); print imperfections read as authentic |
| `d3617ce6...-1966-amazing-spider-man-33.w426.webp` | 1966: a strict 2 × 3 grid of equal panels, one figure straining under weight; one flat grey-blue covers 31% as machinery with red and blue the only accents; irregular rounded balloons hugging the text and butting the border, up to seven lines, double hyphens and bold stress words | Repeating a shot with small changes builds strain; a limited flat palette with one accent is enough; thought balloons |
| `images.jpg` | 1960s–70s Avengers: four panels with diagonal speed lines, a giant yellow foreground hand as the scale device, "BRAKK" and "SLAM!" at about 12% with figures overlapping them | Diagonal energy and foreground scale only; SFX lettering belongs to the 8-bit Beat Comic, not Comic B |
| `swwvm51dxbrh1.jpg` | 1982 Darkseid/X-Men, the 1080 px scan: two long reaching-hands panels with a close-up inset, a long monologue against a wide city backdrop, a five-line caption box, a narrow panel of figures on slabs; the measured balloon, halftone and gutters above | The inset over a wide backdrop; a long speech against scale; halftone as backdrop texture; one villain colour (blue-grey) controlling a whole tier; white caption boxes with a 2 px rule and lower-case italic emphasis |

Common craft across them: bold ink line, flat four-colour printing with halftone dots, hand-lettered upper-case balloons with tails, yellow narration boxes, SFX lettering that breaks panel borders, and page layouts that vary panel size for pace.

## Ten anti-patterns

The ten most common digital/HTML failures against these pages (Codex, 2026-09-28). A page fails the style if any is present.

1. A dashboard-like grid: equal cards, generous padding and uniformly important panels, so the page has no dramatic hierarchy.
2. Rounded panel corners or drop shadows on frames, which the reference frames never have.
3. Perfect-ellipse balloons with generic triangle tails: repeated geometry and awkward attachment seams.
4. Uncontrolled browser text wrapping: a font or container change alters balloon silhouettes, emphasis or reading order; lettering needs composed line breaks.
5. One uniformly heavy "comic" font for dialogue, emphasis, shouts, captions and SFX alike.
6. Uniform vector strokes: identical contour, facial, background, balloon and frame weights, so there is no ink hierarchy.
7. Dark teal everywhere at similar brightness, so figures, backgrounds and balloons merge.
8. Gradients and glow on every surface, displacing the flat shapes and spotted blacks that carry the vintage resemblance.
9. A universal distress or dot overlay that contaminates whites, lettering and solid blacks equally (a filter, not printed colour).
10. Arbitrary responsive reflow or cropping: panels reordered, lettering scaled independently, tails or insets clipped.

## Page descriptors

Codex's estimates from the reduced reproductions, W = width of the whole attached image. Pages 1–6 are the foundation, 7 the texture exception, 8 camera and scale only. Font names are commercial look-alikes judged by resemblance (Blambot Classic, Comicraft Meanwhile, Comicraft Dave Gibbons, Blambot 10 Cent Comics), not identifications of the original letterers.

| Page (file) | Layout | Gutters / margins | Borders | Balloons | Lettering (cap height) | Captions | SFX | Ink and colour |
|---|---|---|---|---|---|---|---|---|
| 1 X-Men 132 | Borderless opening 27% of height; yellow caption strip; four equal panels 19%; reveal 41%; red strip 7% | White 1–1.5% W; margins 2% W | Black, square, 0.25–0.45% W | Flattened white ovals with irregular shoulders, outline 0.15–0.25% W; needle-like lateral tails; a magenta angular burst with white separation; 3–7 words per line | Compact forward-leaning uppercase, weight and slant for emphasis (1.1–1.4% W) | Very shallow yellow band, two lines, black uppercase | Red black-outlined crunch across two panels, uneven heights, descending baseline | Spotted blacks dominate; contours 0.35–0.8% W; hatching on skin, hair, worn surfaces; flats sharply separated; halftone not resolved |
| 2 X-Men 137 | Tiers 26% / 45% / 27%; middle widths 28% / 23% / 49%; bottom near-equal thirds | White 1–1.5% W; margins 2% W | 0.2–0.35% W, square | White ovals and tall stacked shapes; thin tails stopping short of lips; two red shout shapes with thick angular black edges; bottom-tier speech in large white fields butted to upper borders; 3–7 words per line, 1–3 in narrow balloons | Small narrow uppercase, compact leading, selective bold italic (1.2–1.5% W) | One small yellow internal-monologue box, lower right of the opening panel | None independent; the red shout balloons are the climax | Flat cyan machinery on black; faces in large flat pink/yellow/cyan/white shapes; dissolving figure becomes a pale outline in a white flare |
| 3 Crisis 8 | Three upper panels across 49% (widths 21% / 57% / 20%) with about six receding portrait insets crossing the division; full-width strip 15%; five narrow lower panels 35% | White 0.8–1.3% W; margins 1–2% W | 0.2–0.35% W; insets thin dark outlines with blue interiors, stepped diagonal | Small white ovals following the receding faces; border-butted balloons whose bottoms taper into tails; 3–6 words per line (7–8 in wide) | Slanted compact uppercase, compressed italic captions (1.1–1.4% W) | Pale yellow/cream boxes at tops and bottoms of the narrow panels, taking much of each panel | The scream: red letters with thick black surround, very large shrinking to small, tapered curved silhouette, inside its panel | Dense black energy forms round a pale yellow centre; cyan and slate rubble; hot pink and yellow destruction; near-solid black silhouette strip |
| 4 Spider-Man 33 | 2 × 3 grid; tiers 22% / 33% / 43%; near-equal columns | White 1.5–2% W; margins 0.5–1% W | 0.25–0.4% W, square | Compact ovals, elongated rounded shapes and border-truncated forms, outline 0.15–0.25% W; narrow curved wedge tails from a lower side; 2–4 words per line | Strong rightward slant, moderate-to-bold, heavier key words (1.4–1.7% W) | Two stacked yellow monologue rectangles, 3–4 words per line | None typographic; water, splashes and trembling marks | Very flat red/blue costume, grey-blue machinery, green debris; thick black wedges under machinery; water as paper-white negative space; little halftone |
| 5 Avengers | Near-even 2 × 2; a diagonal slash inside the upper-right panel does not split it; a shout and its long tail cross the central gutter | White 2% W; margins 1.5–2% W | 0.2–0.35% W, square | Irregular ovals, rounded polygons, border-butted fields; jagged white shout bursts; scalloped thought clouds with beads; 3–6 words per line | Forward-slanted vigorous uppercase, heavier and larger for emphasis (1.3–1.6% W) | No separate narrator captions | Large cyan impact word with black outline and white burst; enormous green impact lettering pressing the frame | Brush-like black masses on the black-costumed figure; flat yellow/blue/red/magenta; background fields switch colour per beat; modest print texture |
| 6 Darkseid | Two shallow full-width strips 31% with an inset overlapping their right; a strip 14%; lower 54% split into a 40% column of two panels and a 59% tall panel | White 1–1.7% W; side margins 4–5% W | 0.2–0.3% W; inset in a white separating frame with black lines | Large white rounded forms with hand-shaped shoulders, near-rectangular where butted; long curved wedge tails; a white jagged burst; a burst with a yellow outer accent; 4–8 words per line | Broad rounded uppercase, generous counters, bold italic emphasis inside upright text (1.3–1.6% W) | None; the large white regions in the tall panel are the villain's speech | None standalone; radiating lines and clusters of irregular black circles | Assertive black shadows, feathering, parallel hatching, dense facial texture; flat blue/yellow/red/pink/lavender; visible coarse halftone in upper backgrounds, marks about 0.2–0.4% W |
| 7 AllTime 15 | Seven panels: three / two / two, near-equal tiers | White 2.5–3% W; cream margins 3.5–4% W, larger at the bottom | 0.2–0.35% W, rough, wavering, square | Irregular white bursts with deep notches and long projections, clipped at the top; rounded ovals for quiet lines; outline 0.2–0.4% W; 2–4 words per line, 1–3 when shouting | Strongly handmade uppercase, irregular widths, brushy shout letters (1.4–1.8% W) | Saturated yellow boxes with black borders spanning panel tops, tight padding, slanted uppercase | Huge pink/magenta whoosh crossing the final panel diagonally, inside the panel boundary | Strongest deliberate print surface: dense halftone (dots 0.1–0.25% W), speckling, broken coverage, ragged ink; deep black eye sockets and mouths; texture varies by colour area |
| 8 Modern Superman | Two upper panels 24% (54% / 46%); full-width close-up 37%; full-width wide view 34% | Black 2–2.5% W horizontal, 2% W vertical; black surround 2.5% W | None; separation by the black field | None | None | None | None | Fine dark contours; painted tonal transitions, rim light, atmospheric depth; no regular halftone |

Codex's 25 production rules reduce to the recommendations above plus: design the whole page as one composition before drawing panels; build figures from silhouettes first; make hatching describe form; plan balloons with the pencils and draw them around the text block; distinguish speech modes structurally (rounded speech, scalloped thoughts with beads, jagged shouts, rectangular narration); letter at 1.2–1.6% W cap height with 1.25–1.45 cap heights between baselines; draw major SFX as part of the action; apply print character selectively and judge the page at reading size and as a thumbnail. Codex's proposed teal value ladder (`#071312`, `#123D3B`, `#247A74`, `#55C6B6`, `#E7EBDD`) was a proposal, not sampled, and was not adopted; the adopted palette is in the machine-read section below and `assets/style-provenance.json`.

## Machine-read sections (comic_art.py analysis())

`comic_art.py` `analysis()` parses the "(a) SVG art" tables (plate roles and villain cue colours as `#rrggbb`), the halftone `Pitch` and `dot diameter` lines, and the quoted "(f) Prompt fragments" (in order style, night, ink, clear, svg; `prompt-fragments.default.md` overrides any name it defines). The regexes key on the `###` headings, so nothing above this section may repeat them. The text below is copied verbatim from `assets/reference-analysis/reference-analysis.md` (2026-09-28) so `REFS` can point here without changing the parser.

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

### (f) Prompt fragments for the generator

- "1980s American comic book art, printed four-colour look: heavy black brush ink contours with tapered, feathered ends, spotted solid blacks, FLAT saturated colour fills inside the ink (no gradients, no painterly rendering), Ben-Day halftone dots (round, orthogonal grid, fine) on backgrounds and skin shading."
- "Night scene, but colourful: deep blue-black sky flats, teal-cyan light from screens as flat shapes, warm flesh tones, one [villain colour] field; about 40% solid black, the rest flat colour; bright enough to read like a printed page."
- "Contour lines about twice as heavy as interior detail lines; clean silhouettes; readable at thumbnail size."
- "Leave the [top-left third] as a calm flat colour field for speech balloons; no text, no lettering, no balloons, no logos, no symbols on clothing."
- For SVG: "Flat polygon fills and tapered ink paths only; halftone as a `<pattern>` of circles; group layers: bg, mid, fig, light, fx."

## End of machine-read sections
