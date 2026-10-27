---
name: mtw-articulation
description: Decide what a piece of copy actually says, who it is for, and in what order, before writing a sentence. Use before drafting or rewriting any Making Things Work copy - a page section, a Diagram Tour step, Task Field text, a Journal entry, an LLM column section, contact or metadata text - and whenever a draft is clear but not landing. Not for judging finished copy, which is the site-wide communication rubric, and not for visual design review, which is ai-slop-check.
metadata:
  short-description: Shape what copy says and in what order, before it is written
---

# MTW articulation

Decide what a piece of copy says, which single reader it serves and in what order it arrives, in writing, before drafting. Every other copy standard judges finished text; this skill is the step before. It produces no standards of its own and is method, never evidence: it adapts a communication method Matt circulated on 2026-09-17 from a public post, so nothing in it may be cited as proof in copy. Not for judging finished copy (`wiki/site/content-rubric.md`), not for visual review (`ai-slop-check`), and not for spoken delivery, which uses the repo-local Fish Audio or ElevenLabs audio skill after exact-word review. Requirements and Matt's dated decisions are in `discussion/spec.md` (later decisions prevail); current facts are on the wiki pages linked below; load the `wiki-grounding` skill first.

## Read first

- `wiki/site/copy-workflow.md` section "Order of operations for a copy task": where this step sits.
- `wiki/site/content-rubric.md`: the seven tests finished copy must pass; this skill gets copy there.
- `wiki/site/content.md` sections "Voice", "How Matt can help" and "Heading full stops": the standing word choices.
- The surface's own craft after this skill: `../journal-entry/SKILL.md` for a Journal draft, `../mtw-diagram-tour/references/content-refinement.md` for page and tour copy, `../journal-interview/SKILL.md` for getting substance out of Matt.

## Steps

1. **Ground the task.** Run the `wiki-grounding` skill Part A for the surface, then read the three `content.md` sections above by heading.
   Check: you can say who does the work in MTW copy ("How Matt can help.", never "How we can help."; "How can Matt help?" in a contact prompt) from the page.
2. **Find page fifty.** Write one line saying where the reader's book is open: on a service page the buyer's immediate concern; in a tour step what is on screen; in a Journal entry what a practitioner already knows (usually more than the page assumes and less than Matt assumes). Start there, not where you are after weeks inside the subject.
   Check: the line names the reader's starting point, not the subject's.
3. **Answer three questions in writing.** (1) What exactly is this saying, in the plain version? If the plain version is dull, the argument is the problem and no rewriting fixes it. (2) What does this one reader need from it? Pick one of owner, IT lead or finance lead; one version for all three leaves two without what they came for. (3) What is necessary to get them there? List everything you could say, then mark the main point, the single strongest support and the action you want; everything else stays available for questions and is not written.
   Check: three written answers; the list in (3) has exactly one main point, one support and one action marked.
4. **Compress until it breaks.** Say it in sixty seconds, then thirty, then one sentence that gives the reader somewhere to stand. If you keep sticking at the same place, that place is the finding: a missing example, an unsharp distinction, or something less settled than it looked. Go back to the source or ask Matt; do not write around it.
   Check: one surviving sentence (usually the lede, standfirst or step title), or a named sticking point sent back to the source.
5. **Choose the order before drafting.** Context, core idea, connection: when the reader needs background first. Point, action, result, ask: when a real thing was done with a real outcome. Pause, takeaway, question: when the subject is contested. Show the result before the features. Structure follows the argument; two pieces of MTW copy must not be mistakable with the nouns swapped.
   Check: the chosen structure is written down with the reason.
6. **Let a finished point stay finished.** State it once, support it once, move on; do not re-explain, soften or qualify after the point lands (the rubric's self-cancelling assertion). If the reader must act, ask for something specific instead of restating louder.
   Check: no paragraph makes the same point twice.
7. **Pick the word that identifies the thing.** "The design feels bad" could mean cluttered, inconsistent, unreadable or wrong for the audience: four problems, four fixes. The test is whether the word made the meaning clearer, not whether it sounded better; this is what fills the hole left by deleting "useful" and "practical". Apply the standing choices from `content.md` (Matt by name; heading full stops).
   Check: every evaluative word can be replaced by the specific problem it names.
8. **Stay correctable.** Say what is not known, attribute a position to whoever holds it, and keep the qualification that makes a claim true rather than the phrasing that makes it sound strong. If a reader would be right, change the copy.
   Check: no sentence claims certainty about something unchecked.
9. **Hand to the surface's craft** named under Read first, then judge the result against `content-rubric.md`.
   Check: the hand-off carries the written answers from steps 2 to 5.

## When something is wrong

| Symptom | Redo |
|---|---|
| The draft is clear but not landing | Step 2, then 3(2): the reader was not chosen |
| Five features before the result | Step 5 |
| The draft keeps qualifying itself | Step 6 |
| Every sentence needs a "useful" or "practical" | Step 7 |
| The plain version is dull | Step 3(1): the argument, not the prose; back to the source |
| Copy says "we" | Step 1 and 7 |

When copy keeps failing the same way across surfaces, change the step here and in `.codex/skills/mtw-articulation/`, recording the occurrence per `../skill-creator/references/defect-feedback.md`.

## Report

- The written answers: page fifty, the three questions, the one sentence, the structure chosen.
- The surface skill handed to; the rubric result once drafted.
- Sticking points sent back to the source or to Matt.
- `Contributed:` the wiki page and heading, skill or procedure you wrote to.
