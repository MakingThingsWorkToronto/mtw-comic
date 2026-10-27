---
id: comics-box-feedback
title: Fix one comic box from Matt's feedback
module: comics
runner: claude
skill: mtw-comic-story
idleMinutes: 60
params:
  - name: subject
    label: Tracking key
    type: text
  - name: issue
    label: Issue
    type: text
    required: true
  - name: scene
    label: Scene id
    type: text
    required: true
  - name: panel
    label: Box image id
    type: text
    required: true
  - name: art
    label: Current art and region
    type: text
  - name: balloons
    label: Current balloons
    type: text
  - name: sound
    label: Current room, motion and effects
    type: text
  - name: fixes
    label: Common-issue preset ids
    type: text
  - name: note
    label: Matt's message
    type: text
models:
  - runner: claude
    model: claude-sonnet-5-5
    effort: medium
  - runner: codex
    model: gpt-6.1-sol
    effort: medium
---
Follow AGENTS.md or CLAUDE.md (they are identical) for this repo. Read the Comics row of its task table, `wiki/site/comics-library.md`, `wiki/site/comic-story-world.md` and the skill named in the frontmatter (`.claude/skills/mtw-comic-story/SKILL.md`) with the references each change below needs. Read the newest ownership entries in `discussion/handoff/STATUS.md` and the Git status before any write.

This is an interactive session. Matt reviews one comic box in Studio (`/m/comics/speech`), and this terminal sits beside the box. His first message is under "This run": `fixes` are preset ids from `wiki/operations/templates/comics-box-fixes.md` (look up each instruction there; its `scope` says whether it is art, speech, sound or motion) and `note` is what he wrote. `balloons`, `sound` and `art` describe the box as it stands. If both `fixes` and `note` are empty, ask him what to change. After each change, say in two or three plain sentences what changed and where, then wait for his next message in this terminal. Studio refreshes the box on its own when the story file or the art files change on disk.

Change only this box (scene `scene`, panel `img` = `panel` in `site/src/data/comic-stories/<issue>.ts`) unless Matt asks for more. The story is one JSON literal passed to `retime(...)`: keep it strict JSON in the same formatting, and never write `at`, `b`, `l`, `next.b` or `beats` (retime recomputes timing). Only the integrating writer named in STATUS.md (or by Matt in this session) edits the story file and `site/public/comic/`; otherwise prepare the exact change, write a STATUS handoff note and tell Matt who must apply it.

- Speech: run `mtw-articulation` before changing words, then the skill's lettering rules (sentence case, Canadian spelling, about 12 words, `\n` for composed breaks, cast and hockey naming). Edits invalidate this story's speech approvals; never regenerate speech here.
- Sound: effects are the box's `sfx` list (`kind` from the `SfxKind` union in `site/src/data/comic-stories/types.ts`, `delay` in beats, `gain` 0 to 1, one or two per box); room tone is `room`; the song level is the scene's `score`. Follow the skill's `references/audio-motion.md` and `audio-opportunity-rubric.md`.
- Motion: the box's `motion` preset and `layerMotion` follow `references/motion-grammar.md`, `audio-motion.md` and `scene-layers.md`; reduced motion keeps a still frame. Do not claim an effect the player does not implement.
- Art: Codex generates every image. Drive it through the Codex CLI with the `codex-orchestration` skill, and include the output of `python .claude/skills/mtw-comic-story/scripts/art/comic_art.py box-prompt --panel <id> --brief <brief.json>` unchanged in the Codex prompt: the shared box-defect block (D1-D15 in the skill's `references/box-defects.md`) plus each laptop, monitor, phone and sheet's camera face, reader and what that face shows, the agent projection format, the comic format and the box's safe area. Review each returned image against the same D1-D15 items. Save each output as the next unused `-vN` under `wiki/image-library/assets/scenes/comic-b/` after `node scripts/assets/check-asset-destination.mjs image <path>` accepts it, register every attempt with the skill's `comic_art.py import`, and inspect each returned image with `references/visual-review.md` before integrating. Never overwrite or move an earlier version.

After a change to the story file, run `node scripts/comic-story-check.mjs --story src/data/comic-stories/<issue>.ts` from `site/` and report its exit code and every ERROR, WARN or FAIL line. Authored, checked, integrated and Matt-approved stay separate states: Matt approves the box. Do not commit or push.
