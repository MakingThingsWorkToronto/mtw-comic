# Exact returned-image visual review

The art helper's new-acceptance contract is `comic-visual-v1`. `judge`, `gate`/integration and selected native-batch preflight require it without an opt-in flag. Existing historical records stay readable; they do not supply new acceptance by omission. Draft/failed images can be retained and cataloged with their actual status.

This validates coverage, claims and byte identity. It does not inspect pixels, certify the truth of observations, approve production speech or record Matt's approval. The author must inspect every returned file and every depicted box/view beside the declared comic/cast references. Missing inspection stays pending; failed information-side/style/identity findings block acceptance.

## Freeze expected coverage in the brief

Before every new comic scene, layer, reference edit or fix, resolve the visible cast through Studio's current `characters.json` → `modelRecord` → manifest `comic-ink` treatment with `scripts/art/cast_authority.py`. Preserve current names, roles, signatures, exact path/hash and catalog status; `unreviewed-preview` is not approval. Filename recency, group-sheet fallback, remembered descriptors and arbitrary role=`cast` declarations cannot supply identity. `comic_art.py` binds prompt inputs and re-resolves them before generation; `comic-visual-v1` checks each declared actor's reference against that same live mapping before acceptance. Freeze the full current binding in each cast reference in the hash-bound inventory. Acceptance re-resolves character facts, model record, path/hash and catalog status; changed facts or status invalidate the earlier review even when image bytes remain identical. Historical outputs remain retained provenance.

Add `storySceneId` and `visualInventory` to the exact generation brief before inspection. A `kind: page` inventory must cover every actual scene box in order; it cannot use `storyPanelId` to select a subset. A standalone `kind: panel` (also the default kind) must declare `storyPanelId` resolving to exactly one actual box. The packaged read-only `story_inventory.mjs` loads the current local story: identifiers are `panel.img`, then `panel.id`, or, only when both are absent, `<sceneId>:box-<zero-based-index>` for retained demo boxes. Invalid/missing scenes or empty/duplicate panel IDs fail.

`visualInventory` has these required arrays:

- `references`: entries `{id, path, sha256, role}`; each depicted actor's cast reference additionally carries `castBinding`, the exact current `resolve_cast` object with exact live local bytes. Role is `comic-style` or `cast`; include at least one approved comic-style reference and accepted cast references for declared actors.
- `images`: exactly one `{id, panels}` for this returned file, with `id` equal to the caller's brief/page ID. Run acceptance separately for each returned image/version; a sequence's first master cannot cover different file bytes.
- Each panel: `{id, views}`; each view: `{id, digitalAgents, humans, surfaces}`. All arrays are explicit, including empty actor/surface lists when no such subjects occur. Enumerate the actual cast and surfaces; empty lists cannot excuse a visible omitted subject.
- Digital agent: `{id, referenceId, colourState}`. Human: `{id, referenceId}`. A reference ID resolves to role `cast`.
- Surface: `{id, kind, informationSide, reader}`. Kind is `paper` or `device`. Information side is `reader-facing-paper` or `screen` respectively, or `blank` for a rear/reaction surface showing no information. Content needs the actual reader's ID; blank needs `reader: null`. Explicit duplex paper must still depict the correct reading face.

Every expected ID is unique within its array. Freeze the actual ordered image/view versions and timing in the storyboard for in-box cuts; a per-image contract does not implement or verify player sequencing.

A surface also carries `object` (laptop, monitor, phone, paper), `camera` (`front`, `back` or `side`: which face the camera sees) and, for content surfaces, `shows` (exactly what the screen or printed face shows). `comic_art.py prompt` and `box-prompt` turn these into explicit prompt lines. Both refuse a missing camera face, a content surface without `shows` or reader, and a content surface seen from its back. The contract hash covers these fields. The validator does not yet read them.

## Record actual observations

Keep the existing outer review fields: `pageId`, exact `masterSha256` and current `storySha256`, nonempty `reviewer`/`observations`, the existing content checks and `unresolved: []` only when no blocking findings remain. Add `visualReview`:

- `contract: comic-visual-v1`, `briefSha256` and `inventorySha256`. Compute the latter two with packaged `visual_review.contract_hash` (sorted compact JSON, UTF-8), not a file-formatting hash.
- `references`: the expected ordered `{id, sha256}` entries.
- `images`: expected ordered `{id, sha256, panels}` entries, using this exact returned file's hash. Panels/views repeat the expected IDs/order and explicit arrays.
- Each observed view has nonempty `observations` and `checks` with literal true values for `cartoonConsistency`, `noPhotorealism`, `noPainterlyRealism`, `noCinematic3D` only after actual inspection.
- Each observed digital agent repeats `id`, `referenceId`, `colourState`, records nonempty observations and checks `identityPreserved`, `colourPreserved`, `subtleProjection`, `comicTreatment`, `noRepositoryHologram`.
- Each observed human repeats `id`/`referenceId`, records actual observations and `solid: true` only when the human remains solid cartoon art.
- Each observed surface repeats `id`, `kind`, `reader`, records `observedInformationSide` matching the expected reading/blank side, and nonempty observations of operator, face and line of sight. Check `noBackLidEdgeUI` for devices or `noReverseSideCopy` for paper, plus `facesReader` for content or `blankSurface` for a plain back. Wrong sides and false/missing checks fail.

Do not pre-fill these records as passes from a prompt, alt text or fixture. Each observed view also records `boxDefects`: entries `D1` to `D15`, each `{result, observation}`, from the [box-defect checklist](box-defects.md). The validator does not enforce `boxDefects` yet, so the integrating writer refuses any box with a failed or missing entry. Duplicated, missing, unexpected or reordered coverage; changed references/master/story/brief; realistic art; missing projection; non-solid humans; and wrong-side paper/device information all reject new acceptance. Preserve failed attempts and observations.

## Checks and recurrence

Run `python -B .codex/skills/mtw-comic-story/scripts/art/test_cast_authority.py` and `python -B .codex/skills/imagegen/scripts/test_validate_builtin_request.py` (use each mirrored Claude path there). The fixtures include a coherent wrong-person reference, unchanged old bytes after a canonical mapping/fact change, a different valid character, actual prompt/provider-boundary wiring and explicit contact-sheet members. Synthetic passing claims do not inspect pixels or establish approval. Until the next eligible actual generation runs through this repair and is inspected, recurrence is `awaiting-next-output`.

Run the paired package's `scripts/art/test_visual_review.py`, `test_native_import.py` and `test_native_batch.py` offline. Their synthetic cases establish rejection and caller wiring, not production art approval. Then inspect the next different eligible returned output through the repaired path, retain exact findings and dependency hashes, and run normal final desktop/phone/player review. Until that output exists, record `awaiting-next-output`.
