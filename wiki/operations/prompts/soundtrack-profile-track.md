---
id: soundtrack-profile-track
title: Profile one soundtrack track
module: soundtrack
runner: claude
skill: mtw-soundtrack
params:
  - name: track
    label: Track to profile
    type: asset
    assetType: snd
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

Use the `mtw-soundtrack` skill (`.claude/skills/mtw-soundtrack/SKILL.md`). Profile the track under "This run" (its id is the part after `snd:`): from the repo root run `node .claude/skills/mtw-soundtrack/scripts/soundtrack.mjs build --only <id> --force`, then `node .claude/skills/mtw-soundtrack/scripts/soundtrack.mjs check` until it prints no PROBLEM.

Read the result from `wiki/soundtrack-library/profiles/<id>.json`: tempo, first downbeat, feel and how well the feel fits, phrases, dead stops, accents, and the kick, snare and hat onsets. Say whether the grid looks right. If it does not, say what you measured and what a `grid` entry in `sources.json` (`{ "bpm": ..., "offset": ... }`) would need to be; do not add one unless Matt asks.

Never approve, rate or withdraw a track. Never delete or overwrite a file in `wiki/soundtrack-library/assets/`. Do not edit the analysis script or the producer.

Report the measurements in a few lines, the grid verdict, and the `check` result.
