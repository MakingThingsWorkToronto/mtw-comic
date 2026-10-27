---
id: comics-rebuild-library
title: Check the comics library projection
module: comics
runner: claude
skill: mtw-comic-story
params:
models:
  - runner: claude
    model: claude-sonnet-5-5
    effort: medium
  - runner: codex
    model: gpt-6.1-sol
    effort: medium
---
Follow AGENTS.md or CLAUDE.md (they are identical) for this repo. Read the Comics row of its task table, `wiki/site/comics-library.md` and the skill named in the frontmatter. Another session may own the comic story data and the site runtime: read them, never modify files under `site/`.

From the repo root run `node site/scripts/build-comics-library.mjs` as a validation check. It builds the comics projection from `characters.json`, `voices.json`, `provider-voices.json`, `speech-approvals.json`, `sounds.json`, the image manifest and the story registry (importing the shared voice-casting rules `scripts/comics/voice-casting.mjs`) and writes no files; `--snapshot <file.json>` (a path under `apps/mtw/.state/`) writes a parity snapshot if you need to compare runs. Studio's Comics module computes the same projection live and re-reads the files on its own.

Report the script's JSON summary (comics, characters, warnings) and any warning that is new compared with the previous run. If the build throws, quote the error and stop; do not edit sources to make it pass. Do not generate art or audio, start a website build, commit or push.
