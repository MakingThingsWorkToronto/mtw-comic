# Story craft: cast, names, scenes, lettering and layout

Facts (the full cast, companies, villain names and colours) live in `wiki/site/comic-story.md`, and the place, time and introductions in `wiki/site/comic-story-world.md`; this file is how to use them. How to make a reader follow the story (the method, anchors, introductions, structure, landing and the cold-reader test) is [storytelling](storytelling.md); read it first.

## Cast and names

- **Reuse before inventing.** Recurring characters carry the universe across issues: Matt (mentor), Claude and Codex (heroes), the four operators (legal, sales, grants, training), the users. Grok, GitHub Copilot, OpenCode and frontier and open-weight models may appear as background characters; local versus frontier models are two rival teams.
- **Heroes' power:** human judgement, borrowed. The more judgement they get, the better they build their second brain, which is their superpower. Unsteered, the same power is the Rogue Agent. Show the brain growing (floors lighting) when an operator gives a decision.
- **Matt** says the fewest words in any scene and never fights for the operators; he steers and names the gate. He is drawn from his own photo, in plain clothes.
- **Naming:** every invented name comes from hockey. Allies and companies from famous players (never Gretzky or Ovechkin), villains from the NHL's most notorious enforcers (surnames only, never likenesses). Check the wiki's lists before adding one, and record new names there.
- **Companies are invented.** Stories may draw on Matt's resume, but no real client, employer or firm may be identifiable.

## Villains and stakes

- A story fields one or several villains from the gallery; they team up, return and change shape. Hallucination is a sub-form of the Slop. Overhead (the big-firm delivery model) appears in some stories only.
- Stakes are realistic and dramatized from researched incidents (`wiki/research/comic-anchors.md` holds the sourced incidents, cautions and per-villain anchors): a quote below cost, emails to the wrong customers, a file surfacing to its own subject, production data deleted in seconds. Never name the real event.
- Serious, adult tone: dry sarcasm as a character's edge, not gags. One loss is not undone in each issue, so the win is earned.

- **Villains are shown by the trouble they cause, never announced** (Matt, 2026-09-28): no caption, scene title, NEXT heading or choice names one; a character may name one later. The NEXT page teases with a story moment (an image and one line of trouble), never a roll call.

## Story shape

- Scenes sit on the song's phrases; holds on its dead stops; about 1.5+ beats between panels so the camera can travel; balloons at least 1.5 beats apart in a panel.
- Classic issue arc: cold open on the harm, the spread, the heroes make it worse unsteered, the mentor's one line, judgement given, the fight back at the gates, what stays, NEXT.
- **One silhouette beat per issue** (a figure in solid black against one saturated flat), and emotion carried by close-ups: eyes, a mouth, a hand.
- The NEXT page: a heading and 2-4 choices. Choices to other issues point at their `-b` page (the reader maps them); choices to A service pages stay A pages. The banner already says NEXT: headings and labels never begin "Next:" (the check fails it).

## Balloons and captions

Only the reference comics' kinds: speech (with chain, edge and breakout), thought, burst, fear (Matt's exception, the only shaky one), caption and place. Claude and Codex speak in ordinary speech balloons. Compose every balloon with `
` into 2-4 lines of 1-4 words; about 12 words at most. One stressed word or phrase via `em`. Captions sit flush in a box corner (place top-left, narration stacked below). Shapes, fonts and sizes: [lettering and balloons](lettering-and-balloons.md). Every element must have a citation in [style provenance](style-provenance.md).

## Page layout

A scene is a real comic page of about 6-8 boxes: one dominant box (40-60% of the page), the rest varied in size; never an even grid (Matt: "comic books never do this unless it's a rapid few sections"). Equal boxes appear only as a **run**: small boxes that animate a character in quick steps, an entrance or one movement (Matt: "it is good to use many small boxes if you can animate the character via quick intros"; Spider-Man #33's strained 2 x 3, Crisis's stepped column). Mark them with the same `run` id; they reveal half a beat to a beat apart, and a page may hold more than one run. Wide pages transpose the references' rhythms: a wide establishing box and inserts, a row of uneven beats, building to a dominant full-height splash (X-Men #132 turned on its side). Borders only where boxes meet; a box may `bleed`, be an `inset` or be cut on a diagonal (`clip`). On phones the engine uses the references' tall layout. Gutters and margins are measured values, not choices.

## Art brief per panel

Composition (which pattern above), subject and characters (from the model sheets), the balloon clear zone (e.g. "top-left third calm"), the villain's cue colour, darkness 55-65% black with colour only where light falls, halftone on backdrops and skin (pitch 0.8-1.3% of panel width), ink hierarchy (contour about 2.5x interior), no text or logos, any `data-fx` groups the art itself animates (rain, a screen's flicker, the second brain's floors); nothing is added over the art by the engine. The art pipeline turns the brief into a registered SVG: [art pipeline](art-pipeline.md).
