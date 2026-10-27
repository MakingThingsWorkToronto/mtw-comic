---
id: comics-story-feedback
title: Improve a comic's story from Matt's feedback
module: comics
runner: claude
skill: mtw-comic-story
idleMinutes: 90
params:
  - name: subject
    label: Tracking key
    type: text
  - name: issue
    label: Issue (story id)
    type: text
    required: true
  - name: slug
    label: Reader slug (/comics/<slug>/)
    type: text
  - name: build
    label: Build id (newest ledger, or today's date)
    type: text
  - name: storyline
    label: Current storyline (scene, box and line counts)
    type: text
  - name: note
    label: Matt's message
    type: text
    required: true
models:
  - runner: claude
    model: claude-opus-5-5
    effort: high
  - runner: codex
    model: gpt-6.1-sol
    effort: high
---
Follow AGENTS.md or CLAUDE.md. Matt sent this from the Story tab of the issue in Studio; his message under "This run" is the brief for a story revision. Read `scripts/comics/README.md` (step 1) first.

This run is Matt's request to orchestrate the comic build workflow's story stage. Run the saved Claude Code workflow `comic-build` with `args` `{ "slug": "<slug>", "build": "<build>", "stage": "story", "brief": "<Matt's message, plus: revise the current story in site/src/data/comic-stories/<issue>.ts; keep every scene, box and line his message does not touch; rewrite what it does>" }`. The workflow's writer edits the story, runs the four checks until they pass, a cold reader answers the acceptance questions from the words alone, and the review sheet `wiki/comics-library/records/<slug>-build-<build>/story-review.md` is refreshed. If no ledger exists for this build id, the workflow creates one.

When it returns, reply in this terminal in five lines: what changed (scenes and boxes touched), what the cold reader still could not follow, the scene and box counts, the review-sheet path, and that the Story tab now shows the revision. Words are not frozen until Matt approves them on the Story tab. Do not start image lanes, generate speech or commit in this run. Follow-up messages from Matt in this terminal are further revisions: run the same stage again with the new note.
