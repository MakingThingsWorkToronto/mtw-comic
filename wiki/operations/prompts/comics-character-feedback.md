---
id: comics-character-feedback
title: Tweak one comic character from Matt's feedback
module: comics
runner: claude
skill: mtw-comic-story
idleMinutes: 60
params:
  - name: subject
    label: Tracking key
    type: text
  - name: character
    label: Character id
    type: text
    required: true
  - name: name
    label: Character name
    type: text
  - name: appearance
    label: Current model reference
    type: text
  - name: voice
    label: Current voice and profile
    type: text
  - name: fixes
    label: Common-issue preset ids
    type: text
  - name: note
    label: Matt's message
    type: text
models:
  - runner: claude
    model: claude-sonnet-5-5
    effort: medium
  - runner: codex
    model: gpt-6.1-sol
    effort: medium
---
Follow AGENTS.md or CLAUDE.md (they are identical) for this repo. Read the Comics row of its task table, `wiki/site/comics-library.md`, `wiki/site/comic-story-world.md` and the skill named in the frontmatter (`.claude/skills/mtw-comic-story/SKILL.md`) with its `references/characters.md`. Read the newest ownership entries in `discussion/handoff/STATUS.md` and the Git status before any write.

This is an interactive session. Matt reviews one comic character in Studio (`/m/comics/cast/<id>`), and this terminal sits beside it. His first message is under "This run": `fixes` are preset ids from `wiki/operations/templates/comics-character-fixes.md` (look up each instruction there; its `scope` says appearance or voice) and `note` is what he wrote. `appearance` and `voice` describe the character as it stands. If both `fixes` and `note` are empty, ask him what to change. The output lives on that page, not in this terminal (Matt, 2026-10-12: "the outputs must be in the pages we are working on otherwise the human cannot iterate with you"). After each change, confirm it shows on `/m/comics/cast/<id>`, then say in two or three plain sentences what to look at there; no process detail, no lists of receipts. Then wait for his next message. Do not ask permission for any step of this run (generation, landing a sheet, registration, taking over a blocking lease); only a paid speech request needs his yes.

Change only this character unless Matt asks for more. Choices are Matt's: never select, approve or reject a voice, an image or a line for him.

- Appearance: Codex generates every image. Drive it through the Codex CLI with the `codex-orchestration` skill and the comic skill's art prompt contract (`references/art-pipeline.md`, including the box-defect block for agent projection, comic format and quality). Save each output as the next unused `-vN` beside the character's current model under `wiki/image-library/assets/` after `node scripts/assets/check-asset-destination.mjs image <path>` accepts it, register every attempt through the image library's maintained producer, and inspect each result against the cast reference before showing it. Never overwrite or move an earlier version. Pointing the comics at a new model is an integration step for the session that owns the comic data; otherwise write a STATUS handoff note.
- Description: the character's `role` (what it is and when a story uses it), `signature` (its look) and `modelContext` live in its row of `wiki/comics-library/characters.json`; Studio has no route for them, so edit the row in place, keep `id`, `aliases` and `modelRecord` unchanged, and leave a villain's `introduction` null (villains enter through damage). The Studio cast page and `cast_authority.py` read the row on the next request.
- Voice: profile fields (delivery, pace, pitch, accent, pronunciations, sample line, notes) change through Studio's own route, `POST http://127.0.0.1:8788/api/comics/cast/<id>/profile` with `{"fields": {...}}`, which records the decision. Shortlist candidates with `POST /api/comics/cast/<id>/shortlist` only when Matt asks. Auditions run through the `comics-audition-voice` procedure and the `elevenlabs-audio` or `fish-audio` skill: show the plan and cost and wait for Matt's yes in this terminal before any paid request; one request, no retries.

Studio auto-intake registers a new canonical file itself within minutes, with a generic note, and the maintained producer refuses a batch when any other file joins or leaves the library while it runs. So write the attempt's provenance into `records/<record id>/comic-ink/v<n>/`, never only into the register note; when another cast run is live (check `apps/mtw/.state/runs/*/run.json` for `cast:*` subjects), one session registers every pending model file in one batch and posts the receipt and catalog hash in STATUS, and the others launch no producer. A note from Matt that changes the design mid-run does not cancel the attempt in flight: finish it, register it, then run the next version with the current Studio mapping as identity authority and the newer attempt attached as a design reference until it is registered. Matt's character requests are authoritative over other sessions' leases and registration closures. Land each new sheet in the character's reference slot (`wiki/site/comics-library.md`, "Character reference slots") the moment it is generated and inspected; landing never waits for anyone's registration. The cast page shows the newest slot sheet within 15 seconds, marked "awaiting registration", with no Studio restart and no reload. Studio auto-intake then registers it; if it is still unregistered when the run ends, register it yourself in one batch. Matt approves or rejects each sheet with the Approve / Reject buttons under it on the cast page (they record an Images decision); when he approves a version that is not yet the character's sheet, register it as a new version of the character's `modelRecord` so stories and generation use it. When Matt relaunches a cast run to continue, read the earlier run's `run.json` and transcript for the same subject and reuse its frozen lane folder rather than re-briefing.

Report each change with its file or route, and what remains pending. Authored, generated, registered and Matt-approved stay separate states. Do not commit or push.
