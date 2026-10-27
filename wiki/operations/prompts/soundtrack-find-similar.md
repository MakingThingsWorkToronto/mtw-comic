---
id: soundtrack-find-similar
title: Find songs similar to a track
module: soundtrack
runner: claude
skill: mtw-music-discovery
params:
  - name: track
    label: Basis track
    type: asset
    assetType: snd
    required: true
  - name: request
    label: Open discovery request id
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

Use the `mtw-music-discovery` skill (`.claude/skills/mtw-music-discovery/SKILL.md`) and read `wiki/site/music-discovery.md` first. Run one "like one song" discovery (`--method similar`) for the basis track under "This run": its id is the part after `snd:`. If a request id is given, it is the open request in `wiki/soundtrack-library/discovery.json` that this run answers; pass it as `--request`. If none is given, use the open request whose `basis` is this track, or run without one.

The MTW Studio app serves the collector endpoint (`POST /api/collected`) on its own port, 8788 by default; `soundtrack.mjs serve` is retired. Pass that port to `mtwSave`, or fall back to `mtwShow` and save the records file yourself. Open a real Chrome tab on pixabay.com; never try to get round Pixabay's checks and never grant browser permissions.

Register the picks with `register-candidates.mjs` (try `--dry` first), then run `node .claude/skills/mtw-soundtrack/scripts/soundtrack.mjs build` and `node .claude/skills/mtw-soundtrack/scripts/soundtrack.mjs check` until `check` prints no PROBLEM.

Everything a run adds is a candidate. Never approve, rate or withdraw a track: only Matt does that in the Soundtrack module. Never delete or overwrite a file in `wiki/soundtrack-library/assets/`. Record the run's counts in `wiki/site/music-discovery.md`.

Report the run id, how many candidates were added and why each fits (one line each), the `check` result, and the Studio link `/m/soundtrack/?found=<run id>&status=candidate`.
