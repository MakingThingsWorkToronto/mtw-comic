---
id: soundtrack-intake
title: Take approved downloads into the soundtrack library
module: soundtrack
runner: claude
skill: mtw-soundtrack
params:
  - name: files
    label: Files to take in (names, or "all new in Downloads")
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
Follow AGENTS.md or CLAUDE.md (they are identical) for this repo.

Use the `mtw-soundtrack` skill (`.claude/skills/mtw-soundtrack/SKILL.md`), following the `soundtrack-intake` agent's steps (`.claude/agents/soundtrack-intake.md`): read `wiki/site/soundtrack-library.md`, then take in the files named under "This run". For "all new in Downloads", take every audio file in the `downloadsDir` of `wiki/soundtrack-library/sources.json` that is not yet registered, skipping duplicate `name (1)` downloads.

Resolve each track's exact title, artist, track page and licence from its provider (Pixabay needs a real Chrome tab). Never invent a title or artist from a file name; a track you cannot resolve is registered as `needs source` with a note. Add the entries to `sources.json`, then run `node .claude/skills/mtw-soundtrack/scripts/soundtrack.mjs build` and `node .claude/skills/mtw-soundtrack/scripts/soundtrack.mjs check` until `check` prints no PROBLEM. Update the batch facts in `wiki/site/soundtrack-library.md`.

Never approve, rate or withdraw a track: only Matt does that in the Soundtrack module. Never delete or overwrite a file in `wiki/soundtrack-library/assets/`. Do not edit the analysis script or the producer.

Report the tracks added, the tracks flagged and why, and the `check` result.
