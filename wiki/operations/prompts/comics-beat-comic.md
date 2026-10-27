---
id: comics-beat-comic
title: Make an 8-bit beat comic
module: comics
runner: claude
skill: mtw-beat-comic
params:
  - name: song
    label: Song
    type: asset
    assetType: snd
    required: true
  - name: story
    label: Story source (page, Journal entry or notes)
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
Follow AGENTS.md or CLAUDE.md (they are identical) for this repo. Read the Comics row of its task table, `wiki/site/comics-library.md` and the skill named in the frontmatter. Another session may own the comic story data and the site runtime: read them, never modify files under `site/`.

Follow the `mtw-beat-comic` skill with the song and story under "This run": read the song's beat map from `wiki/soundtrack-library/profiles/`, map chapters to phrases, write the story as data for the shared BeatComic component, then run the skill's audit and story checks (`beat-comic-audit.mjs`, `beat-comic-check.mjs`) from `site/`, one at a time.

Report the files changed, each check with its exit code and every ERROR, and the desktop and phone frames still to review. Use only an approved song. Do not publish, commit or push.
