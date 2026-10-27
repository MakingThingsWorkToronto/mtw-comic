---
id: comics-editor-revise
title: Revise one comic balloon
module: comics
runner: claude
skill: mtw-comic-story
params:
  - name: story
    label: Story id
    type: select
    options: [home, agentic, traditional, data-migrations]
    required: true
  - name: scene
    label: Scene id
    type: text
    required: true
  - name: panel
    label: Panel image id
    type: text
    required: true
  - name: balloon
    label: Balloon number in the panel (from 1)
    type: text
    required: true
  - name: instruction
    label: What should change
    type: text
    required: true
models:
  - runner: claude
    model: claude-sonnet-5-5
    effort: medium
  - runner: codex
    model: gpt-6.1-sol
    effort: medium
---
Follow AGENTS.md or CLAUDE.md (they are identical) for this repo. Read the Comics row of its task table, `wiki/site/comics-library.md` and the skill named in the frontmatter. Another session may own the comic story data and the site runtime: read them, never modify files under `site/` before the lease check below.

The Comic Editor asks for a wording or placement change to one balloon of the story, scene, panel image and balloon number under "This run". The balloon is one JSON-literal line inside that panel's `balloons: [` block in `site/src/data/comic-stories/<story>.ts`. Before editing, read `discussion/handoff/STATUS.md` and inspect Git status; if another session holds the story file, stop and report who.

Run `mtw-articulation` before changing any words, then follow the `mtw-comic-story` skill: sentence case, Canadian spelling, about 12 words, `\n` for composed breaks, cast and hockey naming, kind and state that match. Change only that balloon line (and a new line next to it if the instruction asks to add one). Never write `at`, `b`, `l`, `next.b` or `beats`; retime recomputes them on import. Keep the line a strict single-line JSON literal so the editor can keep patching it.

Then run `node scripts/comic-story-check.mjs --story src/data/comic-stories/<story>.ts` from `site/` and report its exit code and every ERROR, WARN or FAIL line verbatim. Report the old and new line, and note that the edit invalidates this story's speech approvals. Do not regenerate speech, commit or push.
