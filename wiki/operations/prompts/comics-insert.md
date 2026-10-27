---
id: comics-insert
title: Insert a comic scene or box
module: comics
runner: claude
skill: mtw-comic-story
idleMinutes: 60
params:
  - name: subject
    label: Tracking key
    type: text
    required: true
  - name: kind
    label: Insert kind
    type: select
    options: [scene, box]
    required: true
  - name: issue
    label: Issue
    type: text
    required: true
  - name: scene
    label: Scene id (the new scene, or the scene that gets the box)
    type: text
    required: true
  - name: position
    label: Position
    type: text
    required: true
  - name: story
    label: Story (title, purpose or what happens)
    type: text
    required: true
  - name: cast
    label: Characters and speakers
    type: text
  - name: lines
    label: Balloon lines [speaker, kind, text]
    type: text
  - name: surfaces
    label: Devices and papers on screen
    type: text
  - name: sound
    label: Score, room tone, effects and sound ideas
    type: text
  - name: motion
    label: Motion
    type: text
  - name: boxes
    label: Number of boxes
    type: text
  - name: art
    label: Art direction notes
    type: text
  - name: refs
    label: Reference images
    type: text
models:
  - runner: claude
    model: claude-sonnet-5-5
    effort: medium
  - runner: codex
    model: gpt-6.1-sol
    effort: medium
---
Follow AGENTS.md or CLAUDE.md (they are identical) for this repo. Matt filled the Insert scene or Insert box form on an issue page in MTW Studio. Studio shows "Inserting…" at the requested position while this terminal runs. The click starts this run; it is not his approval of any words, voice or art.

Read the Comics row of the repo instructions' task table, `wiki/site/comics-library.md`, `wiki/site/comic-story-world.md`, the skill named in the frontmatter (`.codex/skills/mtw-comic-story/SKILL.md`) and, from its references, `box-defects.md`, `art-pipeline.md`, `lettering-and-balloons.md`, `audio-motion.md`, `storytelling.md` and `checks.md`. Read `.codex/skills/codex-orchestration/SKILL.md` before any image generation. Read only the issue's own story file and the records this run names; do not read whole manifests or other issues.

## The request

Everything Matt entered is under "This run". The values are compact one-line JSON or plain text:

- `kind` is `scene` (a new scene, `scene` is its new kebab id) or `box` (a new box inside the existing scene `scene`).
- `position` says where: `after:<scene id>` or `before:<scene id>` for a scene; `after:<box number>` or `before:<box number>` (1-based, reading order) for a box.
- `story` holds the scene title and its purpose (what changes in the story), or what happens in the box.
- `cast` lists the characters present and, for a box, who speaks.
- `lines` is a list of `[speaker, kind, text]` balloons in reading order. These are Matt's words: keep them exactly unless a checker fails them, and then report the failure and your proposed rewording instead of silently changing them.
- `surfaces` is a list of `{object, camera, reader, shows}`: each device or paper on screen, which face the camera sees, who reads it and what its content face shows. This feeds the D8-D15 surface fields of the box-defect contract unchanged. A surface whose camera sees its back is a blank view and needs its own front view for the evidence.
- `sound` holds the scene's score level (0-1) and room tone, the effect kinds (from `SfxKind` in `site/src/data/comic-stories/types.ts`) and free sound ideas.
- `motion` is the panel motion preset and any motion note. `boxes` is the number of boxes a new scene should have. `art` is direction for the art. `refs` are `img:` catalog references to use as visual inputs.
- `not set` means Matt left that field empty. Fill it from the story, the cast and the skill's rules, and say in the report what you chose.

## Ownership first

Another session may be rebuilding the comics. Before any write, read the newest ownership entries in `discussion/handoff/STATUS.md` and the Git status. Only if this session owns `site/src/data/comic-stories/<issue>.ts` and the issue's `site/public/comic/<issue>/` copies (or Matt names you the integrating writer in this terminal) may you edit them. Otherwise do not edit the story file: write a STATUS handoff entry naming this run's tracking key, the exact proposed scene or panel JSON (balloons, sfx, motion, score, room, surfaces), its insertion position, and the art paths below, and stop after the art is registered.

## Steps

1. Plan the insert against the story: where it sits, what it changes, how the neighbouring scenes or boxes and their beats, `continues` splits, place captions, score fades and reveal timing shift. A new scene opens with a `place` caption unless it continues the previous one. Run `mtw-articulation` before writing or rewording any copy.
2. Write the brief for each new box with the skill's brief format: aspect, clear zones, key subjects, each human's solid line and each digital agent's projection line, and every surface from `surfaces` with `object`, `camera`, `reader` and `shows`.
3. Generate art only through the Codex CLI, following the codex-orchestration skill (Codex owns image generation). The generation prompt includes the output of `python .codex/skills/mtw-comic-story/scripts/art/comic_art.py box-prompt --panel <id> --brief <brief.json>` unchanged, plus the `refs` images as declared inputs with their roles.
4. Choose each output's exact destination under `wiki/image-library/assets/scenes/comic-b/` as the next unused `-vN` of that master or view, check it with `node scripts/assets/check-asset-destination.mjs image <path>` from the repo root, and pass that path to the tool explicitly. Never overwrite, move or delete an existing version. Register every attempt, including rejected ones, with the skill's maintained helper (`comic_art.py import`) or `node apps/mtw/cli/mtw.mjs register image <path>`; Studio re-reads the catalog itself.
5. Review every returned image and view yourself against D1-D15 in `box-defects.md`, bound to each file's hash. A fail or a missing item blocks integration.
6. If you own the story file, edit `site/src/data/comic-stories/<issue>.ts` to insert the scene or panel at the requested position, keeping every other scene, box, balloon id, speech reference and approval untouched. Never write the reader's `at`, `b`, `l` or `beats` fields by hand; use the skill's timing helpers. Then, from `site/`, run `node scripts/comic-story-check.mjs --story src/data/comic-stories/<issue>.ts` and `node scripts/comic-story-deslop.mjs`, one at a time. If you do not own it, skip the edit and these checks and list them as not run.
7. New balloons have no speech yet. Do not generate speech; Matt reviews the words and voices in Comic review.

Report the tracking key, the inserted ids and position, each new file path with its hash and registration state, the D1-D15 results per image, the checks with exit codes, the handoff entry if you wrote one, and what remains pending. Authored, reviewed, integrated and Matt-approved stay separate states: Matt approves the words and the art. Do not commit or push.
