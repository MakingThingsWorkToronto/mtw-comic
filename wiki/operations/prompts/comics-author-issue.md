---
id: comics-author-issue
title: Author or revise a comic issue
module: comics
runner: claude
skill: mtw-comic-story
params:
  - name: issue
    label: Issue or page
    type: text
    required: true
  - name: brief
    label: What to write or change
    type: text
    required: true
models:
  - runner: claude
    model: claude-opus-5-5
    effort: high
  - runner: codex
    model: gpt-6.1-sol
    effort: medium
---
Follow AGENTS.md or CLAUDE.md (they are identical) for this repo. Read the Comics row of its task table, `wiki/site/comics-library.md` and the skill named in the frontmatter. Another session may own the comic story data and the site runtime: read them, never modify files under `site/`.

Run `mtw-articulation` before writing any copy, then follow the `mtw-comic-story` skill for the issue and brief under "This run": cast and hockey naming, story as data, balloons, art, the deslop gate and the checks. Before editing any story file, read `discussion/handoff/STATUS.md` and inspect Git status. If another session holds the story or the site runtime, stop and report who; do not edit around the lease.

Report the files changed, the checks run with their exit codes, and what stays unchecked (articulation review, ai-slop-check, desktop and phone playback). Changing a balloon invalidates its speech approval: list the balloons that now need a new review. Do not publish, commit or push.
