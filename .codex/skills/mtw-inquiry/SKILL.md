---
name: mtw-inquiry
description: Interview a human expert so their answers change what you think, rather than confirming what you already decided. Use before and during any interview that feeds content - a Journal entry, a Task Field role story, service page copy, client discovery - and whenever an interview is producing answers that all seem to fit. Not for writing the questions themselves, which is each surface's own craft, and not for drafting the output.
metadata:
  short-description: Stop an interview collapsing into confirmation of a predefined thesis
---

# MTW inquiry

For this public repository, begin with root AGENTS.md and docs/authoring.md. They define the current standalone paths and commands; dated website examples below remain craft references.

Keep an interview from closing into a loop where every question collects evidence for a thesis the expert never authored (Matt, 2026-09-17: questions without reflection on the answers "merely serve to validate a predefined chain of thought"). A leading question can be fixed; a leading interview cannot, because each question in it is reasonable, so this skill works between the questions and the answers. Not for writing questions (each surface's craft: `../journal-interview/references/question-design.md` for the Journal, the role-story reference for Task Fields) and not for drafting (`../journal-entry/SKILL.md`). Requirements and Matt's dated decisions are in `AGENTS.md` (later decisions prevail); current facts are on the wiki pages linked below; read root AGENTS.md and docs/authoring.md first.

## Read first

- `wiki/journal/candidate-quality.md` section "The rubric": what the interview must make answerable.
- `wiki/journal/framing.md` section "What belongs here": the named positions the questions should rest on.
- `../journal-interview/references/question-design.md`, named by step 3.

## Steps

1. **Ground the task.** Run the `wiki-grounding` skill Part A for the surface, then read the two wiki sections above by heading.
   Check: you can name the rubric checks the interview exists to satisfy.
2. **Write the thesis down before the first question.** One dated sentence in the interview file: what I currently think this is about, and why. It exists so it can be checked later; an unrecorded thesis cannot be shown to have survived unchanged.
   Check: the sentence is in the file with today's date before any question goes out.
3. **Make every question able to fail.** Before asking, write the answer you expect. If no answer could make you rethink the piece, it is a prompt for evidence, not a question: rewrite or drop it. Prefer the edges of his view: "Where does that stop being true?", "What would have to change for you to abandon that?", "What do most people in your position get wrong about this?", "What is the strongest case against how you do it?". Check wording against `../journal-interview/references/question-design.md`.
   Check: each question has an expected answer written beside it and at least one answer that would disappoint you.
4. **Run the reflection pass after every round, before the next.** Write five lines: what is new on record (if nothing, the round failed regardless of answer length); what contradicted the thesis, an earlier answer or the research (the most valuable output and the easiest to smooth over); what opened (threads he raised unasked); what he kept returning to (his actual argument lives in repetition, not detail); what is still assumed (what the piece needs that no answer supports: the next question).
   Check: all five lines written; "what is new" is not empty.
5. **Record whether the thesis moved.** How, and which words moved it; if it did not, why not. "Because I was right" is the answer to distrust.
   Check: the thesis entry has a dated line for this round.
6. **Open the next round with his threads, not your list.** The questions he opens come from the subject; yours came from your model of it. Prepared questions are the fallback when his threads are exhausted. (Recorded failure: round one of the first Journal entry produced six unasked threads, four were logged, and the next round asked the original list anyway; the four went unasked for three more rounds.)
   Check: the first question of round two onward traces to a previous answer.
7. **Stop and rebuild when two signals coincide.** The thesis has not moved across two rounds; every answer fit; no question came from a previous answer; you can predict his answers and are usually right; the piece could have been written beforehand, only thinner; his answers keep reaching for something the questions never go near (he is telling you what the piece is actually about).
   Check: fewer than two signals present, or the question set has been rebuilt from his threads.
8. **Judge the interview before drafting.** It has worked when at least one is true and you can point at it: the thesis changed and you can name the sentence; a planned section was dropped because an answer made it pointless; you now argue something you would have disagreed with; the best line is his; you learned something you would repeat unprompted. An interview where everything confirmed everything has failed.
   Check: one of the five is named with its evidence before handing to the drafting skill, whose representation pass then checks his arguments survived.

## When something is wrong

| Symptom | Redo |
|---|---|
| Answers all fit | Step 7, then 3 |
| Long answers, nothing new | Step 4: the round failed; step 6 for the next |
| He keeps steering elsewhere | Step 6: ask about that |
| Thesis unchanged after two rounds | Step 5 and 7 |
| Thin result at drafting | Step 2 was skipped or step 4 was done only at drafting; start the next interview from step 2 |

A thin interview is usually caused here rather than in the questions: record the occurrence, change the step here and in `.codex/skills/mtw-inquiry/`, per `../../../docs/authoring.md#changes-and-review`, and check the next interview.

## Report

- The dated thesis and its movement per round.
- Per round: new, contradicted, opened, returned-to, still assumed.
- Which of the five success signs is met, with the sentence that proves it.
- `Contributed:` the wiki page and heading, skill or procedure you wrote to.
