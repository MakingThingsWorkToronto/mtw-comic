# Reference balloons and captions: measurements and recipe

Written by root from the balloon-shape analyst's report of 2026-09-29, because the analyst was refused permission to write this file.

**Data** (all in this folder):

- `shapes.json`: aggregates, the `usage` table (14 kinds), the metric and 50 normalized outlines.
- `shapes.raw-per-shape.json`: every shape measured.
- `reference-silhouettes.png`, the three overlay sheets and `crops/`.
- `seg.cjs`, `measure.cjs`, `agg.cjs` and `sel.json`: the scripts to re-run the analysis.

**Sample:** 68 shapes from 7 pages. Every outline was checked by eye on overlay crops.

The unit **c** is the cap height of the balloon's own lettering.

## Findings

1. **Speech balloons are superellipses that hug the text, not CSS ellipses.**
   - The exponent n has a median of 3.55 (p10–p90: 2.25–5.8).
   - The 1966–80 Marvel pages use rounded rectangles, n about 3.5–6.
   - Crisis and AllTime use fat ovals, n about 2.0–2.8.
2. **Padding** is about 0.94c horizontally (0.5–1.5c) and 0.75c vertically (0.6–1.3c). The first and last lines are about 0.81 as wide as the widest line.
3. **The outline** is thin, even and smooth: about 0.20c (0.15–0.35c), with roughness of only 0.023c. A perfect superellipse matches the shapes at about 0.92 overlap.
4. **Tails** are short, nearly straight tapered wedges, part of one continuous outline with the body.
   - Length is about 1.87c (1.3–2.4c).
   - Width is 0.70, 0.46 and 0.32c at 15%, 55% and 75% of the length.
   - They bend 2° on median, at most 5°.
   - Long thin tails are used only for off-panel speakers.
5. **Captions:**
   - Corners are square (softened by 0.3c at most).
   - The rule is thin, black and about the balloon's stroke weight.
   - Padding: left 0.67c, top 0.60c, bottom 0.77c. Baseline to baseline: 1.29c.
   - Fills: `#eae619` (X-Men 137), `#eeeb32` (AllTime) and cream `#f9ddb6` (Crisis). The earlier `#d9b23a` is too dark.
   - Placement: butted into a panel corner, or run as a band.
6. **Lettering:**
   - Baseline to baseline is 1.31c (1.11–1.53c).
   - Dialogue cap height is about 1.2% of the page width.
   - Lines run about 9 characters (5–15), with 2–7 lines per balloon (median 3).
7. **"Spooked" is a scalloped speech balloon**, with about 14 bumps (8–17) and a roughness of 0.104c (the dazed figure on the Avengers page). It is not a trembling line.
8. **Panic is drawn as angular bursts** with 6–8 spikes (AllTime). Marvel's shouts use 7–15 spikes, with lettering 1.6–3.5 times the dialogue size.
9. **No reference has a cloud thought balloon.** Thought is a yellow caption in quotation marks (X-Men 137) or a yellow-filled speech balloon (Spider-Man 33).
10. **No machine, screen or radio speaks in any reference.**

## Usage

| Kind | Used for | Crop |
|---|---|---|
| Speech | calm dialogue | ref-4, ref-30 |
| Butted | long lines against a panel edge, cut flat with no outline there | ref-8 |
| Chain | one speaker over several beats; only the last balloon has a tail | ref-10, ref-43 |
| Off-panel | voice from outside the panel: long thin tail to the panel edge | ref-13 |
| Across panels | a line continuing into the next panel, with a connector across the gutter | ref-40 |
| Shout | a yell, a name, pain: a jagged white burst | ref-50 |
| Coloured scream | an anguished cry from a distance: a red-filled ragged balloon | ref-12 |
| Menace | a threat: a red wavy second outline | ref-15 |
| Panic | terror: angular bursts with heavy italic lettering | ref-57, ref-58, ref-65 |
| Shaken | unnerved or dazed speech: a scalloped outline | ref-44, ref-45, ref-47 |
| Weak voice | a faint reply: a zigzag tail | ref-56 |
| Inner thought | private thought: a yellow caption in quotes, or a yellow balloon | ref-1, ref-34 |
| Narration | narrator, time and place: a square box, in a corner or as a band | ref-26, ref-61 |

**Device or chat voices don't appear in the references.** The options:

1. **Most faithful:** an ordinary speech balloon whose tail runs to the screen, citing the off-panel tail on X-Men 132.
2. A caption in quotation marks, citing the quoted captions on X-Men 132 and 137.
3. Text drawn on the screen inside the art. No reference shows this.

## Recipe

1. **Letter first.** Set line breaks by hand, centred, 5–15 characters a line, first and last lines about 0.8 of the widest. Use 1.31c leading.
2. **Body.** A superellipse with `a = textW/2 + 0.94c` and `b = textH/2 + 0.75c`. Use n = 3.5 for the Marvel look or 2.3 for the Crisis look, one per issue. Keep a/b between 0.9 and 2.1.
3. **Shoulders.** `r(θ) = max(r_superellipse, r_textHull + 0.55c)`.
4. **Hand variation.** Multiply by `1 + Σ_{k=2..4} A_k cos(kθ + φ_k)`, with A_k about 0.012–0.02, for about 0.1c RMS in total. Keep high-frequency roughness at 0.03c or less.
5. **Tail.** Build it as part of the same path:
   - Exit the body at the point nearest the speaker's mouth.
   - Root half-width 0.45–0.5c, length about 1.9c.
   - Draw two quadratic curves from `root ± 0.48c` to the tip, with control points at 45% of the length, 0.22c off the axis.
   - Round the joins with a 0.3c radius and keep the bend to 5° or less.
   - An off-panel tail runs 6–10c long with a 0.3c root half-width.
6. **Outline and fill.** Stroke 0.20c, black. Fill with paper (`#f1f1f1`–`#f8f4e8`).
7. **Butted.** Clip the body at the border, draw no outline on the cut edge, and keep text at least 0.6c from it.
8. **Chain.** Place the next balloon diagonally below and right, joined by a neck about 1–1.5c wide and 0.5–1c long; only the last balloon has a tail.
9. **Shaken.** Take a speech body and add 12–16 uneven scallops of about 0.2c depth (±30%, seeded), for about 0.10c roughness. The optional weak-voice tail is a zigzag.
10. **Burst.**
    - 6–13 spikes around an ellipse of `textW/2 + 0.6c` by `textH/2 + 0.5c`.
    - Tips 0.6–1.3c out, with ±35% irregular spacing and ±40% irregular length.
    - Straight edges, stroke about 0.16c, heavy italic lettering.
    - The red scream variant is filled `#e30a0f`–`#b30d11`.
11. **Caption.** Corner radius 0.3c or less, a rule of about 0.2c, and the padding above. Fill `#eae619` for the Marvel look or `#f9ddb6` for the Crisis look.

## Metric

- **How to compare.** Normalize each silhouette to its bounding box (the longer side scaled to 92 on a 96×96 grid) and take the IoU against the best-matching reference speech outline.
- **Reference baseline** (the references compared with each other): worst 0.66, p25 0.78, median 0.86.
- **Target:** every balloon at 0.78 or better, and the page median at 0.85 or better.
- **Parameter gates:** keep every parameter inside the reference p10–p90 ranges above.
- **Checking our own balloons:** run `measure.cjs` on a screenshot, with our balloons' ids added to `sel.json`.

**Limits:** five pages are small web scans, so strokes are only good to about ±0.07c. Chain necks, burst spike depth and the caption rule weight are visual estimates.
