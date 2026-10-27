# Storytelling: making a reader follow the story

The style is settled (Matt, 2026-10-04: "the images look great, the story now needs work"). This file is how to write a Comic B story that a first-time reader can follow and wants to finish, well enough to develop one without Matt. Where and when the stories happen, and how each person is introduced, are facts in `wiki/site/comic-story-world.md`; the cast and villains are in `wiki/site/comic-story.md`.

## Why this exists: the demo nobody could follow

Matt, 2026-10-04, on `/comics/demo/`: "i find it difficult to follow the demo comic ... i could not understand who people were as i had no reference." What the demo did wrong, and what each rule below prevents:

- **Five pages, five threads.** Marco, Dana, an agent, Matt and Codex each had a page, and nobody carried the story from start to end.
- **Nobody was introduced.** Names appeared in the data, never on the page. A reader saw a man with a phone, a woman with glasses and a figure in a visor, with no way to know who they were or that two of them were AIs.
- **Place and time were stated once.** Page 1 said "King Street West"; after that, "The lobby." and "The elevator opens." did not say which building, what time, or how much later.
- **Jargon before meaning.** "The second brain" arrived in the last caption, never shown or explained.
- **No goal.** Nobody wanted something the reader could see, so nothing was at stake and the ending paid nothing off.

All five are the articulation skill's "page fifty" failure: the writer had been inside the story for weeks and wrote from there.

## The sources

Read in full on 2026-10-04 at Matt's direction; this file paraphrases them. When a rule here traces to a source it is named.

| Source | What it gives this skill |
|---|---|
| Pinnacle Pages, *The art of storytelling in comics* | Concept, characters and conflict first; characters are the emotional anchor; every word counts; vary shots; hook at once; twists and cliffhangers; one theme |
| Comics for Beginners, *Stick the landing* | Commit early, finish what you start, archive what you cut (characters and ideas come back) |
| 13th Dimension, *13 visual storytelling tips* | Whose moment is this; compress the familiar, decompress the important; show, don't tell, and its reverse; signature design elements; no visual repetition; consistent screen direction; one killer element per panel and one killer panel per page; think in half-pages and pages |
| TCK Publishing, *Comic book writing* | Three acts; write episodes that each rise and fall; describe for the artist; use the medium (panel pacing, page turns, balloon size); archetypes; leave out what the reader can infer |
| StorySpread, *How to do story structure* | Setting (where, when, conditions), characters with motive, plot (exposition, inciting incident, climax, resolution, change), conflict inside and outside, a resolution that fits the theme, point of view |
| Quality Comix, *Great comic book story ideas* | Simple ideas work; a character needs one clear goal you can understand; distinct silhouettes; thumbnails before art |
| Making Comics, *Qualities of great comics* | A consistent, clear narrative with recognizable patterns; command of pacing; a style that stays consistent; care that shows; presentation that doesn't get in the way |

## The method: from idea to script

Do these in order and write each answer down before the next. A step you cannot answer is the finding: go back to the page's source or ask Matt.

1. **The one sentence.** Who wants what, what stands in the way, and what changes. "Marco needs tonight's quote out; chat writes it from a two-year-old rate card; by Monday he has learned to show his assumptions." If it will not fit one sentence, the idea is two issues (Quality Comix: simple ideas work).
2. **Whose story it is.** One point-of-view character carries the issue from first page to last (13th Dimension: whose moment is this). Others help or get in the way. An ensemble issue still picks one person the reader follows.
3. **The goal, the obstacle and the cost.** The goal is concrete and visible (a quote due at midnight, a brief due at nine). The obstacle is a villain's damage. The cost is shown in a number or a person's face, never asserted.
4. **The opening job.** Before writing the first box, answer four cold-reader questions: which invented company is this; what does it do and what actual job is underway; what has just gone wrong; what must happen by when, or who loses what? Put those answers in one concise narrator caption, in the first scene’s first panel, marked `sceneSetup: true`. Use the story’s existing facts and hockey-derived names; do not copy another issue’s company, crisis or deadline. A deadline is exact when the plot has one; otherwise name the concrete consequence rather than inventing a clock.
5. **Where and when.** Pick the places and the clock from the world page. Every page states its place and time unless it continues the same scene.
6. **Who the reader meets, and when.** Audit every recognisable character's actual first box in the artwork, then bind its identifying caption and proving action to that box. List the source region, identity evidence, caption and first speech; do not trust alt text or a subject manifest as proof of who is drawn. No more than two introductions a page; nobody speaks before they are introduced. A cropped partial silhouette can precede the first recognisable appearance, but record why the identity is not yet clear. A screen notification is not a character speaking: bind any real agent dialogue to its introduced speaker, and mark system-status narration as narrator only when that is what the scene actually says.
7. **The shape, in pages.** Three acts over the issue's pages (TCK; StorySpread):
   - **Page 1, the hook and the setting:** the place and time plus the first-box company/work/trouble/stakes caption, the POV character and their goal, and the inciting incident by the last box.
   - **Middle pages, the conflict:** it gets worse; unsteered agents compound it; Matt and the business operators make the concrete repair below. A useful line can begin the turn, but cannot substitute for that work.
   - **The last page, the landing:** the goal is met or lost in a way that answers page 1, and the person has changed. One loss stays.
   Each page is a unit with its own rise and turn (TCK: episodes; 13th Dimension: work in pages), and its last box makes the reader want the next page.
8. **Beat each page.** For every box: what happens, whose moment it is, the shot (wide, medium, close), and the one line of words it needs, if any. One killer panel per page carries its main beat (13th Dimension).
9. **Write the words last**, with `mtw-articulation` and the rules below. Then run the checks.

## Show the expert operator's work

Use the current [process repair contract](../../../../wiki/site/comic-story.md#expert-operator-and-second-brain-story-repair) for the requested issue's insertion anchors. Matt's latest scope is Home only; older all-five correction notes are requirements references, not an active production queue. Keep exact affected scenes, boxes, revised words and art in the existing storyboard.

The recovery must visibly explain how the organization changes its operating method:

1. Establish the uncontrolled starting point: isolated chat commands, no organization procedure or connected Second Brain, inconsistent outputs, and excessive agent or data permissions. In Home and Agentic Systems, the call brings Matt in as an expert operator.
2. Have Matt work with the business users to define the actual task, approved sources, procedure, output format and who reviews or owns the result. Show a specific decision or worked step, not a generic training speech.
3. Introduce the teal Second Brain tower explicitly at or before the first connection. Explain retained organizational knowledge in ordinary words. Its narration voice alone does not mean the failing agents were connected already.
4. Show Claude/Codex helping build the agreed knowledge/procedure through repo skills. Distinguish Claude, Codex, OpenCode and GitHub Copilot as vendor harnesses from Matt's business domain harness: the repo skills and methodology that organize their work, sources, tests, permissions and review. The agents work inside it and use/contribute checked knowledge to the retained brain; the harness and brain have different jobs.
5. Show Matt securing both the traditional system/data permissions and agentic operating boundaries. Skills text or a glowing tower cannot enforce access. Depict the actual restriction or approved route appropriate to the story.
6. Pay off the repair with a checked usable standard output, an unsafe action refused and a business operator retaining responsibility. Simple procedures can be quick; earned recovery does not erase the loss or imply every system is fixed instantly.

For Home, distinguish discovering the already-damaged contract from a new failure. Place Sam's discovery of the missing safety clause before Matt completes the final procedure and checked contract. After that completed fix, retain the safety clause and every agreed field in the successful output and Monday review; do not introduce a later dropped clause to manufacture another turn. Preserve the earlier erroneous send and its losses. Cold-read the scene times and the visible contract together: retimed playback alone does not repair story chronology.

Each displayed Home page or phone sheet has at least five distinct, meaningful comic boxes. Group short scenes into a causal page when needed and check the last phone sheet after reflow. A new camera view inside one box remains one box; repeated images or duplicate regions do not meet the count. This Home correction does not authorize production on other comics.

Add boxes or a full scene when the causal work needs room. Existing SVG diagrams may guide the flow; the comic must explain it on screen without requiring a diagram lookup. Read the finished words cold: can a reader explain why Matt was called, what the users decided, what he connected/built/secured, and what now succeeds or is refused? Preserve exact words as proposed dialogue until Matt reviews them; feedback on the concept is not approval of a speech script. Run the normal dialogue identity/continuity/pronunciation review on any insertion before the human-word speech gate.

## Rules for the page

- **Anchor every scene.** A place caption opens every scene that moves place or time: the place, then the time ("Floor 28, Bourque & Coffey. 12:40 a.m."). The first page of an issue names the city and the day. "The lobby." alone is not an anchor; "The Keon Tower lobby. 2:07 a.m." is.
- **Set the job deliberately in the first box.** The opening caption is a `caption` from `narrator`, with `state: 'narration'` and `sceneSetup: true`; exactly one per issue, in the first scene’s first panel. It is distinct from the place/time caption and character introductions. Use brand teal `#1a9ba1`, existing caption alpha `0.85`, lettering and rule; do not give it a tail or combine it with `characterIntro`. Author `y >= 0.9` and `x + w >= 0.9`; the `sceneSetup` runtime always selects bottom right by its measured caption height. Desktop and phone captions may span the box when it is narrow; they stay right aligned, rather than relying on a large `x` value. Do not use a free anchor: its top-left coordinate cannot safely predict text height. Keep to 60 words and 360 characters, preferably much shorter. Ordinary speech keeps its existing short budget. Let the separate place/time caption land first, and schedule all first-box captions/dialogue with enough time to read. Reserve a clear lettering area before cropping or generating art; if the final phone box cannot carry it without hiding the action, revise its layout rather than shrinking words to illegibility.
- **Introduce on first recognisable appearance**, with the caption, the signature and a proving action together (the world page has the wording). An AI is introduced as an AI in its caption, because nothing in the art says so to a stranger. The embodied red agent also needs a branded-teal `characterIntro: true` narrator caption: identify it as a rogue AI and say plainly what it does in this story. Its damage provides the entrance; the caption supplies identity, never a villain roll call. Only that marked identity caption may name Rogue Agent in narration; scene titles, place/time captions and NEXT choices retain the damage-first rule. Matt's introduction is “MATT. HE HELPS COMPANIES BUILD THESE SYSTEMS.” Preserve his helper/mentor role. Never introduce Claude over Dana or identify a visible Matt as an agent merely because the data names that speaker.
- **Establish before you close in.** A new place opens on a wide or medium shot that shows who is where; close-ups and inserts come after (Pinnacle: vary shots; 13th Dimension: keep scenic space consistent).
- **Keep screen direction.** Two people talking stay on the same sides across boxes; an object moving keeps its direction (13th Dimension: the 180-degree rule).
- **Show and explain before relying on the name.** Introduce the Second Brain explicitly at its first connection; pair its name with retained organizational knowledge and a concrete use. A gate or operator likewise needs a visible role before unexplained shorthand.
- **Compress the familiar, decompress the important** (13th Dimension). A phone ringing, a late night, a deadline: one box each. The moment a mistake is found, the turn, the payoff: several boxes, often a run.
- **Show, don't tell; tell, don't show** (13th Dimension). Let the art carry action. Let words carry what art cannot: a number, a name, a thought, the line that turns the scene.
- **Every word counts** (Pinnacle). A caption says what the art can't. Never describe what the box already shows ("Marco is buried in paper").
- **Voices are distinct.** Matt plain and few; Claude polite and precise; Codex flat and literal; each operator in their own register (the cast table in `comic-story.md`).
- **One thread at a time.** Cut between threads only on a page turn, with a place caption, and come back to the POV character before the end.
- **No visual repetition** of the same composition in neighbouring boxes unless it is a deliberate run (13th Dimension).

## Landing the ending

- The last page answers the first: the quote that went out wrong is caught or paid for; the person who didn't check now checks.
- One thing stays lost, so the win is earned (the existing story craft).
- The change is shown in an action, not stated in a moral.
- The NEXT page sets up the next trouble with a story moment, never a villain's name.
- Finish the issue before polishing it (Comics for Beginners). Cut ideas go to `wiki/comics-library/records/cut-ideas-archive.md`, dated with their issue, not the bin.

## The cold-reader test (run before Matt sees it)

Read only what will be on screen: captions, balloons and the alt text standing in for the art. Write, for each page, the answers a stranger would give:

1. Where are we, and when? On the opening page, which company is this, what work does it actually do, what has gone wrong, and what concrete deadline or consequence makes this urgent? The first-box caption must answer these without another page or production notes.
2. Whose story is this page, and what do they want?
3. Who is everyone who speaks? (Each must have been introduced.)
4. What went wrong, or what changed, on this page?
5. Why would I turn the page?

Then, for the whole issue: the one sentence from step 1, as a stranger would tell it. If a stranger's answer to any question is "I don't know" or differs from the plan, rewrite before showing. Record the answers with the story's other checks.

`site/scripts/comic-story-check.mjs` enforces the mechanical part: exactly one marked opening-context caption in the first scene’s first box, its narrator/caption treatment, bottom-right desktop/phone geometry and distinct text budget; every scene that changes place or time opens with a `place` caption, and each speaking person or embodied AI, including the red Rogue Agent, has a validated `characterIntro: true` narrator caption beginning with their name (optional “The” for Rogue Agent), with `state: narration`, before their first line. A place label or unmarked caption cannot satisfy identity. This is a structural check; first recognisable appearance, caption placement and actual character binding remain an artwork audit.

## Opening-context defect and recurrence

Matt’s 2026-10-09 `/comics/home/` correction exposed a gap: place/time captions and named characters existed, while the company’s work, urgent job and disruption still required inference. The responsible story rule had required a goal somewhere on page one; the checker could pass a location caption with no business context. Repair that shared cause with the deliberate `sceneSetup` contract and the four-answer cold-reader check above, then apply it to each actual illustrated story, including the retained demo. The style lab and engine placeholder are explicitly classified development specimens, not story exemptions inferred from issue number zero.

Record the original first-box text and story hash, the repaired on-screen four answers and native desktop/phone captures, and the next different comic produced through this rule. Measure missing or incorrect context answers / four required opening answers and missing or invalid opening-caption contracts / actual illustrated stories checked; retain raw counts and failures. The marker cannot prove the words answer the questions or that the caption clears faces/actions: inspect both. Until the next different comic receives that editorial and rendered review, record `awaiting-next-output`; a passing fixture proves escape-check behaviour only. Follow the paired `skill-creator/references/defect-feedback.md` mechanism.


## Introduction binding defect and recurrence

Matt’s 2026-10-09 Home correction found Claude’s caption one box before the intended Claude portrait and the red agent speaking without an introduction. The static checker ignored `rogue`, accepted arbitrary caption/place prefixes as introductions, and prohibited a narrated Rogue Agent identity. Repair the narrow exception and the explicit-introduction validator together; keep villain damage-first staging elsewhere. Audit all five actual illustrated stories against their source art rather than moving captions solely from metadata. Record missing/incorrect identity captions and caption-to-person mismatches separately, with inspected source regions and native desktop/phone frames. Fixture failures prove the escape check catches the structural omission, not that the caption identifies the drawn person. Check the next different story through this audit; retain `awaiting-next-output` until the actual binding/lettering review exists.

## Sound: scored, not wall to wall

Matt, 2026-10-04: "I'm not convinced we need or want music all the time, it is kind of annoying at times ... try inventing audio effects or using the music but in a creative score type way similar to a movie." Sound follows the story like a film score: silence and room tone where the story is quiet, music only where it lifts the story, and sound effects where something happens on the page. Matt chose "Score plus effects feel free to use music where you want": write it into the story as data. Each scene gets a `room` tone, a `score` level only where the song lifts the story (the turn, the fight back, the landing; at least one scene in three without music), and a box gets an `sfx` only when something on the page makes a sound (one or two at most). Silence before a reveal makes the reveal land; a `sting` on the page's killer panel, a `heartbeat` under dread, never a sound on every box. The engine and the effects list: [engine reference](engine-reference.md).

## Layered production after the script

Use [scene-layer authoring](scene-layers.md) after the cold read and before generating replacement pages. Keep the written job, clocks, first introductions, procedural cause and information-facing views explicit in the scene brief. The live layer contract separates background, solid humans, digital agents, props and light; a whole-panel push cannot substitute for it. Bind only actual returned canonical files, then inspect each plane, the composite and final desktop/phone lettering through the existing art gate. Missing layers, usable evidence dwell, identity decisions or native checks remain unfinished even when structural checks pass.

Matt's current production direction targets Home first. Its new exact words still require human review before speech; retained source and preview audio are not new dialogue approval. For the other three shelf issues, bind the actual root-verified Home receipt and selected distinct Ruth reference/version. A fresh session may initialize while Matt's final Home review remains pending; do not invent an additional human approval gate before existing authorized art work. Resolve current scope from the spec and ownership before starting a conversion; do not infer a production batch from an older planning prompt.
