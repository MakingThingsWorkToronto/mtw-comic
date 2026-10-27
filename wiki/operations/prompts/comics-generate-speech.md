---
id: comics-generate-speech
title: Generate approved speech
module: comics
runner: claude
skill: elevenlabs-audio
params:
  - name: balloon
    label: Balloon id
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

The balloon id is under "This run". First confirm the approval gate passes: `site/scripts/comic-speech-approval.mjs` needs the character's selected voice in `wiki/comics-library/voices.json` and a matching approved review in `wiki/comics-library/speech-approvals.json` (text hash, story source hash, voice). If it fails, report the gate's message and stop; never create or edit an approval yourself.

If it passes, use the `elevenlabs-audio` skill (or `fish-audio` when the selected provider is Fish Audio) with the exact reviewed words and the selected voice. Show the plan first, send one request, no retries. Send new audio and receipts to `wiki/soundtrack-library/assets/speech/` and `records/` under a new version, after `node scripts/assets/check-asset-destination.mjs audio <path>` accepts each path. Never overwrite a retained take. A `402 payment_required` rejection means the provider plan, not the words or voice, blocks the take: the rejection receipt is the run's retained result, no audio or charge exists, and the balloon is relaunched only after Matt confirms the ElevenLabs plan upgrade.

Report the plan, the files written with hashes, measured loudness, and the registration still needed in `speech.json` and the story. Listening review and approval of the take stay with Matt. Do not commit or push.
