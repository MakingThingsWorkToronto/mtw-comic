# MTW raster scene constraints

Use this before generating a holographic or photorealistic diagram from a selected reference or a new SVG. It makes fragile source facts explicit; it does not inspect an image or replace the normal faster review. Ordinary raster artwork and simple icon material studies do not need this card.

Read the exact source and current treatment brief first. The maintained [subject contracts](../../mtw-raster-alternatives/references/subject-contracts.md) retain selected-source, label/removal and reference-role decisions. The canonical manifest resolves current per-style SVG metadata and original-reference records without a discussion dependency; the old discussion replay option is retired and rejects before reading inputs. Build a small JSON card and compile it with:

```text
python .codex/skills/imagegen/scripts/compile_scene_brief.py wiki/image-library/records/<id>/<style>/<attempt>/scene.json --repo . --out wiki/image-library/records/<id>/<style>/<attempt>/scene-contract.json --prompt-out wiki/image-library/records/<id>/<style>/<attempt>/scene-constraints.txt
```

Use the emitted text once in the generation prompt, alongside the material/style block and the source-specific composition description. Replace overlapping generic route, logo and caption prose; do not append the same rules twice. Save the card, contract and exact final prompt with the normal output evidence. The helper reads inputs only and refuses existing outputs. New evidence inside the repo must be under the canonical library's `records/`; an external worker staging directory is also supported. Never write new evidence in discussion or over artwork.

## Card fields

Required fields are `id`, `treatment` (`holographic` or `photorealistic`), `referenceKind` (`selected-reference` or `new-svg`), `part`, `reference: {path, sha256}`, `sourceLabels` and `labels`. Both label keys must be present; an explicit `[]` is valid when the treatment genuinely has no labels, such as the standalone brain. Missing keys never mean "remove all text." Paths are repo-relative. By default the helper reads `wiki/image-library/manifest.json`; `--library` explicitly selects another canonical records root inside the repo. Resolve the diagram by `logicalId` (or `id`), then its `treatments[vectorTreatment]`. `vectorTreatment` defaults to `svg-flat`; use `svg-outline` explicitly for outline composition and geometry. A new-SVG source must be that treatment's declared SVG. A selected source must be an original record named in the diagram's `references[]`. SVG/original hashes and the metadata hash (`metadataSha256` or the matching manifest file record) must match. A missing or stale canonical input is an error, never an automatic fallback.

The contract includes the canonical manifest hash, record ID and vector treatment. The retained `--legacy-discussion` switch / `legacy_discussion=True` function option now reports an actionable retirement error. Current compilation only reads canonical inputs. Preserve historical cards and resolve their archived bytes through the relocation map; a new brief with today's canonical inputs is not the old generation call. Keep `scene-brief-cases.json` unchanged as historical fixtures. New briefs and prompts use canonical paths.

Every new card also requires `registrationContract` with the exact canonical raster
destination, record/style/version, provenance destination, named serialized registrar,
requested status and mandatory byte-preserving import/register/verify completion.
Use the schema in [built-in reference preflight](builtin-references.md); the compiler
validates and emits it alongside the visual prompt block. It is operational provenance,
not an instruction to draw workflow metadata. Generate with validated selected inputs
while another catalog writer works, queue import, and keep the worker active until
its actual registered handoff returns. Do not return a pending packet as completion.

- **Scope:** selected-reference photo uses Part 3; holographic and new-SVG versions use Part 2. The source-label list is the visually established set of short internal strings eligible for this treatment, excluding the title. For Part 2, reconcile it with the SVG labels before writing it; the helper cannot read text or meaning from pixels. Keep one entry per distinct string even when it appears several times.
- **Title scope:** remove only an overall image title from a selected reference. New SVGs already omit that title; keep their permitted internal row, column and group headings. Include these headings in both required label lists and check them in the normal full-image review. A generic "no headings" instruction must not contradict these labels. The contract records this distinction as `titlePolicy`.
- **Source exceptions:** each `labelOmissions` item has `text`, `part` and `reason`; each `changes` item has `instruction`, `part` and `reason`. A Part 3 removal cannot silently enter Part 2. An already-authorized per-image exception uses `part: "override"` plus `authority` identifying that existing instruction. This records authorization; it does not obtain it or require a new approval. `labelAdditions` use the same form and always require that override record.
- **`routes` (critical connections only):** use the exact JSON key `routes`; the unsupported alias `criticalRoutes` is rejected rather than silently dropping its constraints. Always include denied routes and routes with a previous direction error. Name `name`, `start` and `end` using recognizable locations in the raster reference. Set `confirmedAgainstReference: true` only after checking that mapping. Prefer `relationship` naming the corresponding SVG metadata relationship; the compiler derives `startArrow`/`endArrow` and never copies SVG coordinates. For a source-only route, provide explicit `heads: []`, `["start"]`, `["end"]` or `["start", "end"]` and a short `evidence` description. Do not supply both `heads` and `relationship`. The prompt names receiving endpoints **and endpoints with zero heads**. A denied route has no arrowheads and declares a nonempty `deniedStop` naming the boundary before which its red dashed line ends at an X. A relationship with `outcome: "blocked"` or `statusRole: "error"` requires this stop even if the card omits it; zero heads or dashing alone do not imply denial. Emitted route records retain `denied` and `deniedStop` (`false`/`null` for ordinary routes), so the structured contract and prompt preserve the same status.
- **Marks:** list only present instances as `{name, location}`; default is a paper-colored hollow contour. Optional `color` is `#f2f2ef` or `#5fc4c9`; `form: "text-only"` supports Codex without inventing a logo. Name repeated locations explicitly. `softwareWindows: true` adds the no-traffic-light-controls rule.
- **Captions:** labels default to screen-aligned bare glyphs in empty space. For labels on an existing object, `surfaceLabels: [{labels: ["Q:", "A:"], surface: "Site agent answer pane", contrast: "Paper lettering on its existing charcoal glass"}]` identifies that object and ink/surface contrast. Do not create a rectangle to improve a floating caption. Keep label-only callouts as bare text; do not add props, icons or object clusters to illustrate their meaning. Existing source objects and explicitly authorized substitutions remain unchanged. When a string appears both as a caption and surface content, describe those specific instances in the source-composition prose.
- **Classification colors:** the helper treats the exact labels `Internal` and `Confidential` as classification tags, not error states: their letters and borders stay paper/neutral/teal. Error red belongs to a denied route, its X stop and its error caption. Check this during the same full-image review; a small residual tag-color difference can remain a recorded cosmetic observation under the faster profile.
- **People:** optional `people: [{count: 15, location: "the four source groups", framing: "full-body"}]`. `framing` can be `full-body`, `seated`, `torso` or `portrait`. Only full-body/seated groups receive the natural-feet/no-contact-pad clause; preserve original crops.
- **Foreground links:** set `foregroundLinks: true` only where source connections might be mistaken for broad supporting ribbons or shelves.

For example, the fragile Enterprise route needs only:

```json
{
  "name": "Efficient reads",
  "start": "the right-side expert operator screen",
  "end": "the left Scoped MCP node",
  "relationship": "operator-efficient",
  "confirmedAgainstReference": true
}
```

The current relationship produces exactly one head at Scoped MCP and zero at the operator. Bidirectional and plain connections retain their different semantics.

## Quantitative geometry references

When exact bar heights, segment fractions or other data geometry matter and a verified same-ID SVG counterpart exists, attach its current native PNG as an additional **quantitative geometry reference**. Inspect the named chart region and its actual SVG dimensions first; match both SVG and PNG hashes to the recorded native review. Correct printed values alone are insufficient evidence. Preserve every input file.

Separate image roles in the prompt: the selected original controls camera, layout, object count and routes; the selected material/style reference controls appearance; the verified native render controls only the named quantitative region's proportions and common baseline/total length. For example, the native total bar may supply 72/14/14 segment fractions while the original still supplies the oblique reporting pane. Do not transfer the auxiliary render's flat styling, camera, unrelated layout or extra labels. State the named region's geometry precedence when the original shape conflicts with the authorized values.

Keep `referenceKind` and `reference` pointing to the primary composition source. List the auxiliary PNG, canonical SVG, exact hashes and limited role in the normal input evidence and prompt; record the permitted geometry correction in `changes` with its applicable part/authority. This adds a reference input, not a new compiler reference kind or an authorization to change data. Use the existing faster review and one-correction limit. This strategy is a prevention hypothesis until the next eligible chart exercises it; assess that output during its normal review, without generating an extra image solely for validation.

## Validation and limits

[scene-brief-cases.json](scene-brief-cases.json) contains five focused cards derived from actual earlier briefs. They exercise the repeated failures; they are regression fixtures, not replacement production prompts. Run:

```text
python .codex/skills/imagegen/scripts/test_compile_scene_brief.py --repo .
python .codex/skills/imagegen/scripts/test_canonical_scene_brief.py
```

The real-brief suite retains all 19 regressions and uses the canonical resolver.
It adapts copies of the historical cards in memory: exact original source names
resolve through the catalog, while their recorded hashes, labels and constraints
stay unchanged. The fixture JSON remains immutable historical provenance; this
is a current regression run, not a replay of the old generation call. Both the
selected references and the RBAC SVG/metadata inputs come from the canonical
library, so normal tests work without `discussion/` or site copies. The retired
discussion replay switch is separately checked to reject before file lookup;
neither missing canonical data nor an explicit legacy flag revives that authority.

The isolated canonical suite exercises per-style metadata, selected-source and hash/path guards, no-discussion operation, durable records and refusal to overwrite. These checks catch contradictory inputs, treatment drift and stale references. A coherent card does not prove a correct picture. Keep the one full-image comparison and basic PNG/lineage checks; use at most one focused correction for a blocking content error. Record cosmetic differences without retouch loops. When the same defect recurs, use the shared [defect-feedback mechanism](../../../../docs/authoring.md#changes-and-review); check the next eligible output through the changed compiler before claiming improvement. Full SVG verification is unchanged.
