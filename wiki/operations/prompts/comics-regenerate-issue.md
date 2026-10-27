---
id: comics-regenerate-issue
title: Regenerate one comic scene from its issue plan
module: comics
runner: codex
skill: mtw-comic-story
params:
  - name: issue
    label: Issue id
    type: text
    required: true
  - name: plan
    label: Canonical full-regeneration plan path
    type: text
    required: true
  - name: scene
    label: Scene id
    type: text
    required: true
  - name: note
    label: Note from Matt
    type: text
models:
  - runner: claude
    model: claude-opus-5-5
    effort: high
  - runner: codex
    model: gpt-6.1-sol
    effort: high
---
Follow AGENTS.md or CLAUDE.md. Use the Comics task entry point and `.codex/skills/mtw-comic-story/SKILL.md`, especially `references/scene-layers.md`, `art-pipeline.md`, `box-defects.md` and `visual-review.md`. Read the current image workflow/library contract and only the plan's selected cast and asset records. Read the newest ownership entries in `discussion/handoff/STATUS.md` and inspect Git status before writes.

Parameters are under "This run". This is one scene of a full issue regeneration, not permission to run the whole issue queue. The root owns story/runtime changes, site integration, shared status and Git. This worker owns only the exact canonical image assets and scene records assigned by the plan. Do not change the plan, words, cast selections, voice holds, approval records, procedures, skills or application code. An optional note refines the requested scene within these boundaries; it cannot grant unrelated production or approvals. No new speech, audio-provider calls, paid fallback, commit, push or deployment.

1. **Bind the named scene.** Require an existing plan under `wiki/comics-library/records/`; validate its exact path with `node scripts/assets/check-asset-destination.mjs comic <plan>`. Confirm the issue and scene match its assigned record, the current story path/hash and every affected panel id, exact word ordinal/hash, layout, intended action, evidence, separate plane/view requirement and destination/version. Freeze these bindings in the scene record. A missing, stale or ambiguous plan or an unassigned destination blocks production; report the precise discrepancy to root. Inspect current catalog records and actual files for reuse before creating anything. Preserve all source art, prior attempts and comparison records.

2. **Resolve cast and submitted inputs.** Follow the art pipeline's `cast_authority.py` resolution from current `characters.json` through `modelRecord` to each actor's exact `comic-ink` path/hash/status. Use those live bindings, not remembered filenames, old selections or a group fallback. Resolve any distinct-reference blocker before affected art. Inspect all supplied images. Follow `.codex/skills/imagegen/references/builtin-references.md`: retain the exact UTF-8 prompt, ordered input paths, roles, hashes and current `comicCast`/`castBinding` provenance; run `python .codex/skills/imagegen/scripts/validate_builtin_request.py <request.json> <input-roles.json>` immediately before the built-in call. Use only its validated fields. Respect the reference limit; a contact sheet needs explicit authorization and retained exact-member/composition provenance. A cast/catalog preview status is not Matt's approval.

3. **Write a complete box prompt.** Prepare the plan-bound brief before generating any page, plane, evidence view or correction. For every affected box include the unchanged output of `python .codex/skills/mtw-comic-story/scripts/art/comic_art.py box-prompt --panel <id> --brief <brief.json>`: the maintained D1-D15 block and each surface's object, camera face, reader and `shows` content. Keep exact existing words in separate lettering; do not invent replacement copy or draw story balloons into art. Missing surface direction/content or any required box prompt blocks the call. Record solid humans separately from projected digital agents, protected faces/hands/evidence and clear lettering areas.

4. **Prove the composition first.** For a Home full-regeneration plan the first proof is `connect`. Produce its real composition and separately readable operator-facing source evidence before the remaining scene queue. Inspect the actual assembled composite and actual source evidence against the frozen story, cast and information side, recording their exact hashes and findings. A prompt, plane list, repeated old composite or evidence crop is not this proof. If another scene is requested, require the plan's registered, inspected `connect` proof receipt and matching actual bytes first; a missing/stale/failed proof blocks that run. Do not expand this run into `connect` or any other scene. A passing production proof permits the documented next work gate; it does not record or imply human approval.

5. **Produce genuine scene ingredients.** Use the skill's Codex built-in generation/import path for the named scene's actual back-to-front planes and required distinct views. Keep matching canvas/geometry and genuine alpha around foreground subjects; a clean background, solid humans, digital agents and readable evidence have their declared roles. Do not supply the flattened composite repeatedly as different planes, opaque foreground rectangles, or crops renamed as newly authored views. Assemble and inspect the real composition. Retain a real fallback and immutable source versions. Measure returned dimensions and alpha; record any explicit alignment transformation. Never upscale, add detail/resolution claims from enlargement, or produce delivery slots above the master width. Root integrates the retained masters and checked no-upscale derivatives into the reader.

6. **Save and register every attempt.** Choose each exact canonical path/version from the plan and run `node scripts/assets/check-asset-destination.mjs image <path>` before a write; comic scene records likewise use the `comic` destination check. Keep artwork and its production/review evidence in `wiki/image-library/`, and the plan-linked scene/handoff records in `wiki/comics-library/`. If the built-in tool returns a provider/cache path instead of accepting an output path, record that exact transport file and canonical destination, preserve its bytes and import promptly through the maintained helper; transport is not a new asset home. Coordinate the catalog/registration lock with root. Register every returned attempt, including failed/rejected variants, with the maintained art import/registration producer; never hand-edit catalog projections. Verify retained bytes, hashes and the resulting catalog entry; Studio `/m/images` and `/m/comics` must resolve the registered records. A blocked import remains explicitly pending, never complete, and retains its exact files for root's reconciliation.

7. **Inspect pixels and hand off this scene.** Apply the existing `comic-visual-v1` contract to every returned plane, view, fallback and final composite against the live cast/reference and frozen story hashes. Inspect at actual resolution and each relevant box; record D1-D15 observations for every view, including `n/a` reasons. Check identity/colour, comic treatment, alpha/geometry, action, device/paper front and reader, actual readable source evidence, protected subjects and clear lettering regions. Do not prefill passes from prompts, alt text or dimensions. Missing/failed coverage blocks integration; retain the failure and its hash. Hand root exact registered paths/ids/hashes, prompt/input/generation/review records, ordered plane/view roles, composition and evidence proof, unresolved findings and checks with exit codes. Keep Studio procedure/run tracking and token receipt links with the scene record. Record authored, returned, inspected, registered, integrated, browser/heard and Matt-approved as separate states; worker work cannot set the latter states. Desktop/phone playback, motion/fallback and listening verification belong to root after integration. Stop after this named scene's registered handoff; do not launch the next scene or automatically retry a failed batch.
