---
id: comics-audition-voice
title: Audition a character voice
module: comics
runner: claude
skill: elevenlabs-audio
params:
  - name: character
    label: Character
    type: asset
    assetType: cast
    required: true
  - name: voice
    label: Voice to audition
    type: asset
    assetType: voice
models:
  - runner: claude
    model: claude-sonnet-5-5
    effort: medium
  - runner: codex
    model: gpt-6.1-sol
    effort: medium
---
Follow AGENTS.md or CLAUDE.md (they are identical) for this repo. Read the Comics row of its task table, `wiki/site/comics-library.md` and the skill named in the frontmatter. Another session may own the comic story data and the site runtime: read them, never modify files under `site/`.

Use the `elevenlabs-audio` skill for an ElevenLabs voice and the `fish-audio` skill for a Fish Audio voice (the provider is in `wiki/comics-library/provider-voices.json`). Read the character's profile in `wiki/comics-library/voices.json`. Reuse an existing provider preview or saved audition first; the skill's default is an offline plan. Show the plan (exact voice, script, settings, canonical destination under `wiki/soundtrack-library/assets/voices/`) and run `--generate` only when the skill's guards pass and the run names a voice. Run `node scripts/assets/check-asset-destination.mjs audio <path>` for each new file before writing it.

Do not select a voice, edit `casting.selectedVoice` or write `speech-approvals.json`: Matt selects in the Comics Cast view. Write the registration proposal the skill emits, then report the files created, their hashes and what remains for the integrating writer. Do not commit or push.
