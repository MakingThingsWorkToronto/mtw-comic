---
name: "imagegen"
description: "Generate or edit raster images when the task benefits from AI-created bitmap visuals such as photos, illustrations, textures, sprites, mockups, or transparent-background cutouts. Use when Codex should create a brand-new image, transform an existing image, or derive visual variants from references, and the output should be a bitmap asset rather than repo-native code or vector. Do not use when the task is better handled by editing existing SVG/vector/code-native assets, extending an established icon or logo system, or building the visual directly in HTML/CSS/canvas."
---

# Image generation

Produce the requested image. Reuse a suitable current asset before generating. Do not make image delivery into a process-repair project.

Use the native image_gen tool for generation/editing. Inspect local references first. Use the CLI/API fallback only when explicitly requested; do not launch a nested Codex merely to access a native tool already available.

For MTW, save every version under wiki/image-library/assets/ and its prompt/reference/output provenance under records/. Use the actual current catalog/cast mappings, check the exact destination, and preserve all native/earlier bytes. The generator finishes registration and authorized commits before reporting completion; serialize with a current catalog writer.

## Generate, register and hand off as one task

Keep terminal output compact: never dump prompts, source JSON, manifests or full
reference/receipt inventories. Retain details in their declared files and print
only the operation, exit code and completed canonical registration handoff.
Do not repeatedly poll unchanged files or rerun an already-passing check.

An MTW image-generation request includes its exact canonical destination, record ID,
treatment, version, provenance destination and named registration writer **before
the provider call**. Destination/reuse checks and the current catalog input closure
belong to that request. Generate, preserve the returned bytes, import canonically,
run maintained registration and verify, then return one completed handoff. A tool
result or cached PNG alone is not the completed request.

Put the executable completion contract in `input-roles.json.registrationContract`
(and `scene.json.registrationContract` for the diagram compiler):
`{canonicalDestination, recordId, style, version, provenanceDestination, registrar,
requestedStatus, bytePreserveImport: true, register: true, verify: true,
completionStage: "registered"}`. All strings are explicit; destinations are
repo-relative. Provenance is exactly `wiki/image-library/records/<recordId>/<style>/<vN>`.
The validator requires this contract for every MTW generation/edit, including a
new image with no references, before the provider call. Pass `--repo <repo>`;
the CLI also recognizes its MTW repository without prompt keywords.
Use the requested status in the first registration payload: one maintained
registration and one verify, without a second status/review pass.

The completed JSON handoff has `stage: "registered"`, `humanApproval: false` and
`images: [{path, recordId, style, version, sha256, registration: {receiptPath,
receiptSha256}}]`. The receipt is the retained maintained-runner result with actual
`register.code` and `verify.code`, both zero; never manufacture terminal success.
Keep exact generation/input provenance and factual visual findings with the record.
Run `python .codex/skills/imagegen/scripts/validate_builtin_request.py --handoff
<handoff.json> --repo <repo>` once when sealing/consuming that completed handoff.
It checks the actual canonical bytes, selected record/treatment and hashed producer
receipt. It does not establish image quality, native playback or Matt's approval.

Each image also carries its original `registrationContract`. The receipt names
that `registrar`; its `register` and `verify` entries each carry `code: 0` plus
hashed `terminal`, `maintenanceChecks` and `packageFiles` artifacts as
`{path, sha256}`. Bind real terminal `actualExitCode` and the maintained
`maintenance-checks.json`/`package-files.json` to the library and image bytes.
Bare invented zero-exit JSON is rejected. Unrelated later catalog additions do
not invalidate the checked handoff while its selected image path/hash stay intact.

Evaluate the registered canonical file and its existing findings directly. Reuse
that checked handoff while bytes, selection and relevant presentation are unchanged;
reopen only for changed dependencies or a concrete defect, not repeated manual
catalog chasing. Run `python .codex/skills/imagegen/scripts/test_registered_handoff.py`
when changing this contract or checker.

One writer serializes registration across workers. If a peer holds that window,
retain exact transport files/destinations, queue the import with the named registrar
and **keep the generation worker active** until that registrar imports exact bytes,
registers and verifies. Valid selected references permit authorized native generation
in parallel with a catalog writer; the lease serializes canonical import, not the
provider call. An unrelated catalog job never blocks that authorized generation.
The image sub-agent reports back to its calling agent **only** the checked registered
JSON handoff (canonical path, SHA-256, record/style/version and actual producer
receipts). A pending packet is progress, never a final response or completed request.
Keep art findings in the canonical record. Preserve failed/rejected takes and
transport bytes too; registration does not confer human approval.
Do not ask Matt to discover or register leftovers, launch a competing
producer, hide unregistered canonical files or silently approve candidates. Combine
the authorized pending input closure before maintained prewrite when required.

## Native inputs

Use references/builtin-references.md only for a reference-based call. Run scripts/validate_builtin_request.py on the exact request and ordered input roles; do not attach more than five raster references or a prompt over32000characters. Unknown model/usage stays unknown.

## Transparent image requests

Request actual transparency and inspect alpha with scripts/inspect_png.py. RGBA format alone is not proof. Preserve returned bytes. Review the actual scene composition for identity, colour, foreground occlusion and physical device orientation; alpha counts are not visual approval.

## Live Comic B layers

For a comic, use current canonical opaque cast references and crisp comic ink/flat colour. Isolated agents keep full colour without a painted city/room inside their bodies. The existing compositor/player handles scene transmission and fabrication; humans and physical props remain solid. Use references/comic-layers.md and the relevant mtw-comic-story reference only for an actual layer task.

## Other requested modes

For diagram alternatives use mtw-raster-alternatives and references/scene-brief.md; paused batches remain paused. For an explicitly requested API workflow use references/cli.md and references/image-api.md. Generic prompting examples are in references/sample-prompts.md. Do not load these modes for an ordinary Home comic call.
