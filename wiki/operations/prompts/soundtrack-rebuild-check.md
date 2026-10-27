---
id: soundtrack-rebuild-check
title: Rebuild and check the soundtrack library
module: soundtrack
runner: claude
skill: mtw-soundtrack
params:
  - name: only
    label: Only these track ids (comma separated, optional)
    type: text
models:
  - runner: claude
    model: claude-sonnet-5-5
    effort: medium
  - runner: codex
    model: gpt-6.1-sol
    effort: medium
---
Follow AGENTS.md or CLAUDE.md (they are identical) for this repo.

Use the `mtw-soundtrack` skill (`.claude/skills/mtw-soundtrack/SKILL.md`). From the repo root run `node .claude/skills/mtw-soundtrack/scripts/soundtrack.mjs build`, adding `--only <ids>` when track ids are given under "This run", then `node .claude/skills/mtw-soundtrack/scripts/soundtrack.mjs check`.

`build` profiles only tracks whose file hash or checked grid changed, then rewrites `profiles/<id>.json` and `manifest.json` (nothing else; Studio `/m/soundtrack` re-reads them on its own). If `check` prints PROBLEM lines, fix only what the skill says is yours to fix (a missing profile, a stale manifest) and re-run until it prints none. Anything else, such as a missing credit or a download that differs from the library copy, is reported, not changed.

Never approve, rate or withdraw a track. Never delete or overwrite a file in `wiki/soundtrack-library/assets/`. Do not edit the analysis script or the producer.

Report the tracks profiled, the final `check` output, and every PROBLEM you left in place with its track id.
