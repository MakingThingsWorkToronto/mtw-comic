---
id: comics-fix-box-art
title: Fix comic box art
module: comics
runner: codex
skill: mtw-comic-story
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
    label: Box (img id or index, comma separated)
    type: text
    required: true
  - name: art
    label: Current art and region
    type: text
    required: true
  - name: fixes
    label: Fix preset ids
    type: text
  - name: note
    label: Note from Matt
    type: text
models:
  - runner: claude
    model: claude-sonnet-5-5
    effort: medium
  - runner: codex
    model: gpt-6.1-sol
    effort: high
---
Follow AGENTS.md or CLAUDE.md (they are identical) for this repo. Read the Comics row of its task table, `wiki/site/comics-library.md`, `wiki/site/comic-story-world.md`, the skill named in the frontmatter (`.codex/skills/mtw-comic-story/SKILL.md`) and its `references/art-pipeline.md`, `references/checks.md` and `references/visual-review.md`. Read the newest ownership entries in `discussion/handoff/STATUS.md` and the Git status before any write. `wiki/operations/templates/comics-box-fixes.md` holds the instruction for each fix preset id.

Parameters are under "This run". `art` is the scene's current art base path (`/comic/<issue>/<name>`) followed by `| <box> ar=[x, y, w, h]` for each box, the fractions of the page master that the box shows. Locate exactly those boxes in `site/src/data/comic-stories/<issue>.ts` (scene `scene`, panel `img` id or index) and in the canonical master under `wiki/image-library/assets/scenes/comic-b/`. Look up every id in `fixes` in the template and apply its instruction; the `note` adds to them and never overrides the cast, cartoon-style and device/paper orientation rules in the skill. If both are empty, stop and report that nothing was asked.

Change only the named boxes. Never touch the other boxes, the lettering, the other scenes, `a5be950` or earlier snapshots.

1. Study the current master and each named box beside the approved comic reference. Record what is wrong and what must stay.
2. Fix with the skill's art pipeline: a focused native edit or regeneration of the named boxes, with the exact prompt, input roles and hashes recorded. A "2-step graphic box" means splitting the box into ordered images in the same box (reading or reaction view, then operator-perspective evidence view), following the skill's multi-image box rules. The step order, timing and box id come from the skill; do not claim the sequence plays until the player supports it, and say so in the report if it does not.
   The fix prompt includes the output of `python .codex/skills/mtw-comic-story/scripts/art/comic_art.py box-prompt --panel <id> --brief <brief.json>` unchanged: the shared box-defect block (D1-D15) and each surface's camera face, reader and `shows` content, as in `.codex/skills/mtw-comic-story/references/box-defects.md`. Step 4 checks the same IDs.
3. Choose each new file's exact destination under `wiki/image-library/assets/scenes/comic-b/` as the next unused `-vN` of that master or view, check it with `node scripts/assets/check-asset-destination.mjs image <path>`, and save the output there. Never overwrite or move an existing version; earlier versions stay preserved. Register every attempt, including rejected ones, with the skill's maintained helper (`comic_art.py import`) under the shared registration lock; Studio `/m/images` re-reads the catalog on its own, so there is nothing else to refresh.
4. Inspect every returned image and view yourself: front and back of each device and paper, the face the person can see, identity, colour state and cartoon style, using the skill's review contract. Record observations bound to each file's hash. A failed or uninspected view blocks integration.
5. Ownership: only if this session holds ownership of the story file and the site art copies in `discussion/handoff/STATUS.md` (or Matt's current message names you the integrating writer), run the skill's `judge` and `integrate` steps to refresh the `site/public/comic/<issue>/` copies, update the box's `ar` and the scene's `art` reference, and run the checks below. Otherwise stop after registration and write a handoff note in `discussion/handoff/STATUS.md` naming the new version paths and hashes, the box and scene, and the integration still pending.
6. Checks for the named boxes: from `site/`, `node scripts/comic-story-check.mjs --story src/data/comic-stories/<issue>.ts` and `node scripts/comic-story-deslop.mjs`, one command at a time, then the skill's story-art crop and lettering review for the changed boxes on desktop and phone. List the checks you did not run.

Report each new file path with its hash and registration state, the observations per image, the checks with exit codes, and what remains pending. Authored, reviewed, integrated and Matt-approved stay separate states: Matt approves the art. Do not commit or push.
