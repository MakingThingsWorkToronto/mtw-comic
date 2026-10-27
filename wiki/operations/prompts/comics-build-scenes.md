---
id: comics-build-scenes
title: Comic build, stage scenes
module: comics
skill: mtw-comic-story
runner: claude
idleMinutes: 240
params:
  - name: slug
    label: Issue slug (/comics/<slug>/)
    type: text
    required: true
  - name: build
    label: Build id
    type: text
    required: true
  - name: scenes
    label: Scene ids (comma separated; empty = all)
    type: text
  - name: note
    label: Note from Matt's story approval
    type: text
models:
  - runner: claude
    model: claude-opus-5-5
    effort: high
  - runner: codex
    model: gpt-6.1-sol
    effort: high
---
Follow AGENTS.md or CLAUDE.md. This run is Matt's request to orchestrate the comic build workflow with subagents and to generate images through Codex lanes. Read `scripts/comics/README.md` first; it is the protocol.

Parameters are under "This run". The story must already be approved: the ledger `wiki/comics-library/records/<slug>-build-<build>/state.json` has `story.approved`, or this run was launched from the Comic build workflow's approve gate (then record the approval in the ledger with `node scripts/comics/lib/ledger.mjs <slug> <build> set story.approved '{"by":"matt","via":"studio-gate"}'`). Run `node scripts/comics/preflight.mjs --slug <slug> --build <build>`; a failed required check (for example free disk under 5 GB) stops this run with that exact reason.

Run the saved Claude Code workflow `comic-build` with `args` `{ "slug": "<slug>", "build": "<build>", "stage": "scenes", "scenes": [<ids or omit>], "codex": { "model": "gpt-6.1-sol", "effort": "low" } }`. It builds one scene at a time: plan, Codex lanes (at most four at once), a full-size review of every returned image, planes cut from the master, lettering from the reviewed faces, sound, one registration per scene, binding, frames on 8787 and a frame-by-frame review, one correction per observed defect. Keep the one-browser and one-build rules: the workflow notes its headless frame captures in STATUS.

When it returns, report per scene: generated, reviewed pass/fail, planes, registered count, bound, frames reviewed, gate result, unresolved boxes. Then show the issue in Studio and on 8787. Do not generate speech. Do not commit until Matt accepts the issue; then commit with `node scripts/git/commit-paths.mjs` and only the exact build paths.
