---
id: comics-editor-check
title: Check an edited comic story
module: comics
runner: claude
skill: mtw-comic-story
params:
  - name: story
    label: Story id
    type: select
    options: [home, agentic, traditional, data-migrations]
    required: true
models:
  - runner: claude
    model: claude-sonnet-5-5
    effort: medium
  - runner: codex
    model: gpt-6.1-sol
    effort: medium
---
Follow AGENTS.md or CLAUDE.md (they are identical) for this repo. Read the Comics row of its task table, `wiki/site/comics-library.md` and the skill named in the frontmatter. Another session may own the comic story data and the site runtime: read them, never modify files under `site/`.

The Comic Editor just saved balloon edits to `site/src/data/comic-stories/<story>.ts` for the story under "This run". From `site/`, run one command at a time (a shared build rule): `node scripts/comic-story-check.mjs --story src/data/comic-stories/<story>.ts`, then `node scripts/comic-story-deslop.mjs`, and keep only the deslop lines that name this story.

Report each command, its exit code and every ERROR, WARN or FAIL line verbatim, grouped by scene and panel when the line names one. Read `git diff` for the story file and list the balloons whose text changed, because editing text invalidates that story's speech approvals. List the checks that stay human (mtw-articulation review, ai-slop-check, desktop and phone playback, art check) as not run. Do not fix anything, edit story files, start a browser, commit or push.
