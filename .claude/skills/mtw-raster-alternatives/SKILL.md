---
name: mtw-raster-alternatives
description: Generate or reassess requested MTW holographic or photorealistic diagram alternatives in a bounded, reorderable batch. Use for an explicit applicable raster request; never resume a paused queue automatically. Raster icons require an explicit icon request. Does not author flat SVGs, Journal covers, or Scaling Tiers photos.
---

# MTW raster alternatives

For this public repository, begin with root AGENTS.md and docs/authoring.md. They define the current standalone paths and commands; dated website examples below remain craft references.

Produce exactly the raster diagram versions Matt asked for, in his order, save and register them in the canonical image library, and stop. Public diagrams adopt Site Glass through their primary tour pins and unconverted diagrams retain SVG Flat (`docs/authoring.md#images` "Selected public style"); holographic and photorealistic versions are retained comparison material, and generating or reviewing them changes no public choice. Loading this skill, finding missing styles or finishing a batch authorizes nothing further. Not for flat SVGs (`svg-artisan`), Site Glass (`mtw-glass-diagram`), Journal covers or Scaling Tiers photos. Requirements and Matt's dated decisions are in `AGENTS.md` (later decisions prevail); current facts are on the wiki pages linked below; read root AGENTS.md and docs/authoring.md first.

## Read first

- `docs/authoring.md#images` sections "Selected public style" and "Raster diagram versions": the public style, the pause rule and the lighter review profile.
- `docs/authoring.md#images` section "Authority and where things belong" and `wiki/site/image-library.md` section "Storage and updates": where files and records go and how registration works.
- `docs/authoring.md#images` section "Raster prompt and review craft": recorded compiler distinctions and known draft failures.
- [Subject contracts](references/subject-contracts.md), named by step 4.
- `../imagegen/SKILL.md` and `../imagegen/references/scene-brief.md` (step 5), `../mtw-holographic-image/SKILL.md` for holography (step 5), `../codex-orchestration/references/image-lane.md` for running Codex from Claude (step 6).

## Steps

1. **Ground the task.** Run the `wiki-grounding` skill Part A, then read the wiki sections above by heading.
   Check: you can state the public style rule and the lighter review profile from the page, not from memory.
2. **Fix the scope from the request.** Resolve the style (`holographic` or `photorealistic`), the exact logical IDs, their order and the batch boundary. For a named family, derive members from the manifest `records[]` by collection, service or category and use the requested count and order. A request to list, reorder, estimate or pause is not a request to generate. Clarify only if the treatment or scope cannot be inferred.
   Check: you hold a written list of IDs in order with a stated stop point; one requested ID has not become a four-style run or the backlog.
3. **Reconcile the catalog with the files.** For each ID read its record in `wiki/image-library/manifest.json`, its per-style metadata, and hash the actual files. Classify each as saved, staged, draft, missing or user-approved; an unimported packet is not saved. Archived prompts, plans and aliases are read-only provenance. When reassessment is requested, inspect the best retained candidate first and reuse it if only cosmetic differences remain under the lighter profile, recording a reassessment rather than a fictional new call.
   Check: each ID has a current state and a decision (reuse, generate, or skip) with its reason.
4. **Resolve each composition source.** Use [Subject contracts](references/subject-contracts.md) for the selected-reference assignment, photo-only label and removal decisions and new-SVG reference roles. Open the exact named original for a selected-reference counterpart; for a new-SVG counterpart open its current native PNG and bind the canonical SVG and metadata as lineage; attach the material reference separately. Hash and preserve every input, including auxiliary chart geometry references. An inspiration or style source is not the composition.
   Check: every input has a role sentence and a SHA-256; the composition reference is the one the contract names.
5. **Compile the scene card.** Keep camera, objects, counts, relative positions and routes except explicitly authorized treatment changes. Holographic follows Part 2 and keeps permitted internal labels; selected-reference photo follows Part 3 with its per-image replacements and removals; new-SVG photo follows Part 2; never import a photo-only omission into holography. Remove overall titles; keep required row, column and group labels. Run the `../imagegen/references/scene-brief.md` compiler with both label lists, current route metadata with verified raster endpoint mapping, denied-stop boundaries, named marks and only the relevant optional constraints. Repair a helper bug at its source; never bypass validation by dropping routes, labels or source classification. For holography add the style block from `../mtw-holographic-image/SKILL.md`.
   Check: the compiler accepts the card without dropped fields; the helper hash is recorded for the call.
6. **Generate one output per call.** Built-in `image_gen` with the inspected references and their roles (from Claude: `../codex-orchestration/references/image-lane.md`). Shared palette, monochrome contour marks, transparent alpha or exact page background `#0b1419`, current status-colour rules; nominal 16:9 at least 1672x941. Record actual UTC start and end around each awaited call; file dates are not timings. Any CLI or API fallback follows imagegen's explicit opt-in rule.
   Check: exactly one new file per call, with prompt bytes, input roles, output hash and elapsed seconds recorded.
7. **Review under the lighter profile.** One full-image comparison on `#0b1419` beside the reference, plus `python .claude/skills/imagegen/scripts/inspect_png.py` for dimensions, actual alpha or background, format and hashes. Check counts, required labels, object and mark identity, meaningful routes and denied termination. RGBA alone does not prove transparency. For a Matt-requested fast preview-only batch: generate each missing version once, keep the file and hash checks, record exactly which outputs were spot-checked and leave the rest `unreviewed-preview`.
   Check: dimensions, alpha, hashes and the compared observations are written; a one-pixel shortfall is a recorded failure, never hidden by resizing.
8. **Correct at most once.** One focused correction for an obvious content, required-label legibility, identity or route error; record minor cosmetic differences without retouch loops. If a blocking issue remains or the correction adds one, keep the result `draft`, keep the clean earlier attempt, and continue only within the batch. A usable candidate is `in-review` with `userApproved: false`; `approved` requires Matt. Crop sets, duplicate reviews and per-image galleries are not default gates; never retry a blocked browser surface. A reusable defect goes through `../../../docs/authoring.md#changes-and-review` in both editions without generating a test image.
   Check: no ID has more than one correction call; every status is one of `draft`, `unreviewed-preview`, `in-review`, `approved`.
9. **Save the exact files.** Rasters under `wiki/image-library/assets/diagrams/<style>/` (icons under their declared `assets/icons/<style>/`), drafts included, fresh versioned filenames, never overwriting; original inputs read-only. Records under `wiki/image-library/records/<id>/<style>/<attempt>/`: submitted prompt, scene card, ordered input roles and hashes, dependency revision, timings, output hash and the review. Run `node scripts/assets/check-asset-destination.mjs image <path>` for each destination. Under coordinated work only root imports; workers stage outside the repo with exact source, destination, hash and base-hash records plus a registration payload; staging is not import; nothing new is written to `discussion/` or site integration copies.
   Check: the destination checker accepts each path; no existing file changed bytes.
10. **Register, refresh and verify** with the commands under [Canonical library maintenance](#canonical-library-maintenance). Register only the requested style update with its metadata and evidence paths; other treatments, their geometry, status and metadata stay intact; a replacement keeps the old treatment and file.
    Check: `verify` passes; destination hashes match the receipt; the record shows the new treatment and nothing else changed.
11. **Stop.** Report the batch and finish. Do not select another batch, change website adapters, publish, start icons or restart a paused queue.
    Check: your report ends with the stop point reached.

## Canonical library maintenance

`wiki/image-library/manifest.json` is the catalog for every image record, style choice and review state, including discussion-era previews and exploratory variants. `maintain_library.py` reads only that library and works without discussion or site assets. Save the exact files under `assets/` and `records/` first, then from the repo root:

```powershell
python .codex/skills/mtw-raster-alternatives/scripts/portable-gallery/maintain_library.py register --library ./wiki/image-library --payload <record-update.json> --receipt-dir <external-receipts>
python .codex/skills/mtw-raster-alternatives/scripts/portable-gallery/maintain_library.py refresh --library ./wiki/image-library --receipt-dir <external-receipts>
python .codex/skills/mtw-raster-alternatives/scripts/portable-gallery/maintain_library.py verify --library ./wiki/image-library --receipt-dir <external-receipts>
```

`node apps/mtw/cli/mtw.mjs register image <path>` and the `images-register` procedure call the same producer (`wiki/site/image-library.md` "Storage and updates").

- The payload is a full new record, an existing `id` plus updated `treatments`, or `{"records":[...]}` for atomic related updates. Treatment paths are library-relative and carry review status and declared metadata and evidence paths. Every new image in `assets/` must be registered; diagnostic renders in `records/` are evidence, not artwork. Refresh refuses dropped records or changed existing image bytes. Review status, selected style, integration and user approval stay separate.
- Hold producer input membership across the **whole library**, including `records/` evidence and support files, from planning through the final pre-write check; an assets-only pause is insufficient. The helper compares all file names except `DERIVED` outputs and `UNCATALOGED` human decisions before any derived write. New/removed inputs stop the operation before writing; retain the failure and reconcile with their owner. Existing hash/link checks still apply. This final scan detects drift, not a filesystem lock: keep other canonical imports paused until the producer is terminal. A later authorized addition requires a new refresh/verify.
- Within one operation, measure the inventory once and compare every declared hash; reuse those hashes only while device/inode, size and nanosecond timestamps match, rehash when a stamp changes, and reject changes during a hash read. Keep the physical inventory, post-write receipt and pre-write manifest guard fresh; never persist a hash cache or substitute manifest values. After changing this path run `test_physical_scan.py` and `test_tours.py` and measure the next real registration separately.
- `register` and `refresh` derive `manifest.json`, `data.js`, `all-files.html`, `README.md` and a tiny static `index.html` compatibility bridge to the file index. Validate the bridge target; immutable tour previews keep their bytes and existing return links. The retired `browser.js` and `library.css` are not restored, and `.gitattributes` stays intact. Add records and versioned assets without removing earlier records, styles, comparisons or relative links; Studio owns the review interface (`wiki/site/image-library.md` "Storage and updates").
- Portable export: `build_gallery.py --repo <repo> --output <external-package>` requires the canonical library and stops with recovery guidance when the manifest is absent; it never reconstructs a catalog from other folders. `--overrides` is not an update mechanism; `--plan-only` enumerates files. Output and receipts (`<output-name>.records/`) stay outside the repo. Then `package_zip.py --package <package-root> --file-manifest <output-name>.records/package-files.json --zip <fresh.zip> --extract-check <fresh-external-directory> --report <external-receipt.json>`. Dependencies: Python 3 and Pillow. Browser review is separate; a URL-policy rejection stays unperformed.
- After changing output ownership run `check_staging.py --repo <repo> --workspace <external-check-directory>` and the maintenance test suite. Keep `.gitattributes` `-text`; raw and Git-filtered hashes must match before committing byte-preserved assets; retained CRLF is source content, so use `core.whitespace=blank-at-eol,blank-at-eof,space-before-tab,cr-at-eol` for the whitespace check instead of rewriting files. No helper success confers visual or user approval.

## Authorized source relocation

For a requested cleanup: enumerate exact source files (hidden and ignored support and evidence included) across every named directory; preserve unique bytes under canonical `assets/` or `records/`, deduplicate by SHA-256, keep a source location map, register artwork and repair live dependencies. Run `scripts/portable-gallery/check_source_relocation.py --repo <repo> --plan <exact-plan.json> --phase before --report <external-report.json>` after preserving destinations, then the same with `--phase after` after exact-file removal; the plan declares `schemaVersion: 1`, `scopes` and `files` with repo-relative `source`, library-relative `destination`, `sha256`, `bytes` and `kind` (`artwork`, `evidence`, `support`). Never remove directories wholesale; a library-only verification does not prove the cleanup is complete; archived path strings stay distinct from live dependencies.

## Raster icons: explicit requests only

Never start icon sets because diagrams are finished. When requested: resolve names from the canonical icon inventory and matching outline SVGs; render the read-only outline as the shape reference; one square transparent PNG per icon and style, one icon per call, same object and meaning, monochrome contour product marks; imagegen and the style rules without a diagram scene card; the same lighter review, correction limit, preservation and exact-file integration (steps 6 to 10). Never invent missing icon names or a separate queue.

## When something is wrong

| Symptom | Redo |
|---|---|
| The request names a family or "the rest" | Step 2: derive the exact IDs and stop point; ask only if the treatment cannot be inferred |
| A candidate exists you were about to regenerate | Step 3 (reassess first) |
| The compiler rejects the card | Step 5: fix the inputs or the helper at its source; never drop routes or labels |
| Output smaller than 1672x941, RGB where alpha was required | Step 7: record the failure as a draft; do not resize |
| Second defect after the one correction | Step 8: keep `draft`, keep the clean attempt, move on within the batch |
| `refresh` refuses | Step 10: a record was dropped or existing bytes changed; restore them |
| The destination checker rejects a path | Step 9: choose a fresh versioned path under the library |

## Report

- IDs requested, order, stop point; per ID: reused, generated or skipped, with status (`draft`, `unreviewed-preview`, `in-review`), dimensions, alpha, output hash and call timings.
- Review observations and the single correction, if any; unperformed checks.
- Files saved (exact paths), records written, registration receipts, `verify` result; staged versus imported.
- `Contributed:` the wiki page and heading, skill or procedure you wrote to.
