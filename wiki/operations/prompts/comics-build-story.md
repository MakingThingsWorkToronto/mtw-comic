---
id: comics-build-story
title: Comic build, stage story
module: comics
runner: claude
skill: mtw-comic-story
idleMinutes: 90
params:
  - name: slug
    label: Issue slug (/comics/<slug>/)
    type: text
    required: true
  - name: build
    label: Build id
    type: text
    required: true
  - name: brief
    label: Story brief from Matt
    type: text
models:
  - runner: claude
    model: claude-opus-5-5
    effort: high
  - runner: codex
    model: gpt-6.1-sol
    effort: high
---
Follow AGENTS.md or CLAUDE.md. This run is Matt's request to orchestrate the comic build workflow with subagents. Read `scripts/comics/README.md` first; it is the protocol.

Parameters are under "This run". Run the saved Claude Code workflow `comic-build` with `args` `{ "slug": "<slug>", "build": "<build>", "stage": "story", "brief": "<brief or omit>" }`. It writes the story into `site/src/data/comic-stories/`, runs the four checks until they pass, has a cold reader answer the acceptance questions from the words alone, and writes `wiki/comics-library/records/<slug>-build-<build>/story-review.md` for Matt. Before it starts, add one ownership line at the top of `discussion/handoff/STATUS.md` naming the story file and the build ledger; preserve every other line.

When the workflow returns, open the review sheet and the issue in Studio `/m/comics/issues/<id>` and report in five lines: the story in one sentence, scene and box counts, the cold-read result, the ledger path, and what Matt approves next. Do not start stage scenes, generate images or spend audio credits in this run. Do not commit.
