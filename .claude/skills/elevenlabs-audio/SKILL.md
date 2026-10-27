---
name: elevenlabs-audio
description: Reproduce bounded ElevenLabs speech or sound-effect takes with exact character casting, human-reviewed words, canonical soundtrack assets and provider/processing receipts. Use for authorized comic voiceover, narration, ambience or effects; planning and checks are offline by default.
---

# ElevenLabs comic audio

For this public repository, begin with root AGENTS.md and docs/authoring.md. They define the current standalone paths and commands; dated website examples below remain craft references.

Read the current spec decision and [audio destinations](../../../wiki/site/asset-locations.md). Reuse retained recordings or procedural presets first. A new provider request needs the current task's authorization and a finite take/text or duration budget; this skill does not authorize generation. Current comic words require Matt's human review before speech generation.

Use [workflow and receipts](references/workflow.md) for the direct API or optional connected ElevenLabs tools, credential handling, planning, provider failure, processing and catalog refresh. The maintained helper plans by default; `--generate` sends one request only after the shared speech approval check. A failure stops the take. Do not retry, change voice/provider, or create a paid fallback without new direction.

Studio `/m/comics` owns human voice selection; its sole voice authority is `wiki/comics-library/voices.json` profile `casting.selectedVoice`. Resolve that current character/provider/voice ID before constructing the request, then recheck it through the shared gate before credentials or a provider call. A stale caller-supplied identity fails; no default, alias or provider fallback may replace Matt's choice. Offline unchosen audition/discovery planning is not production authorization, and retained comparisons never select a voice. `speech-approvals.json` records exact human-reviewed text/source hashes. Both Fish and Eleven generators use `site/scripts/comic-speech-approval.mjs`; do not duplicate voice locks or manufacture review entries. Approved voices stay exclusive to their characters, and explicit gender suitability comes from the shared casting helper.

Keep raw and versioned processed audio under `wiki/soundtrack-library/assets/`, with immutable provider/processing receipts under its records/. Comic associations remain in comics-library. Refresh the soundtrack projections through mtw-soundtrack (Studio's `/m/soundtrack` re-reads them on its own); recorded speech and audio-only review mixes keep distinct types. Generated, processed, imported, integrated, heard and approved are separate stages.

Run `node .codex/skills/elevenlabs-audio/scripts/eleven-audio-regression.mjs` (paired Claude path also supported). It uses external temporary fixtures and fake provider responses, never reads a real key or charges an account. No check grants hearing or production approval.
