---
id: "wiki:site/image-library"
kind: "knowledge"
title: "Canonical image library"
load_when: "Storing, registering, versioning or reading image records in the canonical catalog, or resolving a treatment's file and metadata for the site."
themes: ["images", "diagrams", "studio"]
keywords: ["manifest.json", "records", "treatments", "sidecar", "register image", "studio images", "earlier versions", "canonical library", "remove images", "archive-record.json", "remove all rejected", "images-removed"]
relations: [{"type":"depends_on","target":"wiki:site/asset-locations","reason":"Canonical storage and integration copies follow the shared asset-home contract."}]
---
# Canonical image library

**`wiki/image-library/` is the authoritative home for every image asset and its current catalog.** New artwork is saved here, including originals, drafts and retained variants. Existing `site/src/assets/library/` and `site/src/assets/image-sources/` are integration copies; `discussion/` is not a new artwork destination.

This includes images generated **during discussions, conversations, brainstorming and experiments**, even when they are previews, rejected, unused or not yet assigned to a page. Preserve each created output in `assets/` and register it with its actual status before reporting it as imported. Generator caches and external worker packets are temporary transport; an image shown in chat or saved only there has not reached the canonical library. Discussion documents may describe the work, but new image files and their durable generation records live here.

Review images by opening `/m/images` in [MTW Studio](mtw-app.md) (`npm run studio`, http://127.0.0.1:8788), or open [the plain file index](../image-library/all-files.html) or [the canonical manifest](../image-library/manifest.json). For an offline, shareable copy run `node apps/mtw/cli/mtw.mjs export images --out <fresh dir outside the repo>` and open the exported `index.html`. The interactive in-library browser is retired; its code survives only in Git commit `51eb6e03`. The maintained producer generates a static `index.html` redirect and fallback link to `all-files.html` so immutable tour previews retain working return links; it does not restore `browser.js` or `library.css`. Human review decisions are logged in `wiki/image-library/decisions.jsonl` (formerly `wiki/image-decisions/`), which `maintain_library.py` skips. The library permanently retains its Holographic, Photorealistic, SVG Outline and SVG Flat selector and comparison view; which treatment the website shows is decided in [Images](images.md#selected-public-style). The website's own switcher was retired on 2026-09-24, so comparison lives here.

## Stable browser and additive contributions

**`manifest.json` is the permanent catalog and stable entry point, and the Studio Images module (`/m/images`) is where it is browsed and reviewed.** Contribute to the catalog additively. A new image batch does not create a competing canonical gallery, reset the catalog or rename `manifest.json`. Register a file with `node apps/mtw/cli/mtw.mjs register image <path>` or the `images-register` procedure; both call the maintenance helper.

- Add new records and versioned files while preserving existing record IDs, earlier versions, metadata, source links and review status. A preferred treatment can change through registration; its previous treatment remains available as an earlier version.
- Keep all four style choices, comparisons, search, collection filters and full-size relative links. Browser improvements extend the existing application while preserving these capabilities and paths.
- **Order: newest first** (Matt, 2026-09-25). The manifest carries no dates, so the browser shows records in reverse manifest order; the maintained helper appends new records, which makes that newest-registered first. A record revised in place keeps its original position.
- **Images per page** offers 20, 50 (the default, Matt 2026-09-25), 100 and All. All shows every match in the selected collection and filters. Changing the page size starts at page 1; filtering, resetting filters and switching collections retain the selected page size.
- Routine `register` and `refresh` operations regenerate only `manifest.json`, `data.js`, `all-files.html` and the library `README.md`. They leave `.gitattributes` intact; the retired browser runtime is no longer part of the library. Catalog additions belong in the manifest through the maintenance helper, never a hand-edited card list.
- Browser runtime changes are deliberate source edits. Keep the canonical runtime and the matching templates in both repo skill editions synchronized; normal export copies the canonical runtime and does not reinstall a template over it.
- Keep every package reference relative and the classic local data script usable without a server or network connection. A ZIP is a dated export of this library, not another maintained authority.

The [image workflow](image-workflow.md) is the entry point that orders the maintained commands and source lookup rules for a new session.

### Page-size behavior and limits

The limit counts catalog cards: one diagram card can offer four treatments. **All** displays all matches in the active collection and filters; it does not combine every collection or display every treatment as a separate card. The comparison dialog and plain file index do not use this page-size limit.

The choice is held in memory for the open page. Reloading or reopening the browser starts at 50; the preference and current page are not saved in browser storage or encoded in a shareable URL. The existing `#image=<record-id>` link opens an individual record independently of pagination. An empty result still shows Page 1 of 1 with both navigation buttons disabled.

All creates every matching card in the document while retaining lazy image loading. Its rendering time, image-loading cost and memory use on phones or larger future collections have not been measured. See [the browser verification limits](image-quality.md#library-browser-controls) for the exact offline coverage and remaining rendered, keyboard, touch and assistive-technology checks.

## Storage and updates

- Save new image files under the appropriate `assets/` collection and give revisions new filenames. Keep each prior file, its metadata, original source and review status.
- Declare each version through the top-level manifest's `records[]` entry and `treatments[style]`. Use stable logical IDs across styles. An absent treatment is explicit; an existing treatment must not disappear during an update.
- Register the new record or treatment with the mirrored `mtw-raster-alternatives` maintenance helper. It preserves a replaced treatment as an earlier-version record and refreshes the catalog together; Studio shows the change when the manifest is written. Do not rebuild the canonical inventory from old discussion progress.
- **Versions and Studio refs.** Records carry no version field; a version family is a filename `-vN`, a producer archive record `earlier-<id>-<style>-<sha16>` with `retainedFrom`, or an ad hoc `-retained-vN` sibling. `treatment_identity` in the producer includes `status` and `note`, so re-registering a treatment with only a new status or note creates an `earlier-` archive with the same path; Matt's approvals and rejections therefore go in `decisions.jsonl` (Studio shows them apart from treatment status), never as a `treatment.status` rewrite. Review statuses are free strings. Studio refs are `img:<record-id>[#<style>]@<current|v<N>|sha8>`; the style defaults to the record's primary treatment (diagrams `svg-glass`, else `svg-flat`) and an unknown id resolves to null (`apps/mtw/modules/images/shared/refs.ts`).
- Store new generation prompts, source/output hashes and verification records under `records/<id>/<style>/<revision>/`. Matt explicitly authorized relocating the completed scoped image plans, prompts and review evidence into [the records archive](../image-library/records/discussion-relocation-2026-09-17/README.md). Their original bytes and review limits remain historical; current facts and craft are maintained in the wiki and paired skills.
- Refresh and verify the library after additions. Export its exact registered files to a portable package and refresh the ZIP when sharing. Structural checks and a successful ZIP do not confer visual review or approval.

```powershell
python .codex/skills/mtw-raster-alternatives/scripts/portable-gallery/maintain_library.py register --library wiki/image-library --payload <asset-payload.json> --receipt-dir <external-receipts>
python .codex/skills/mtw-raster-alternatives/scripts/portable-gallery/maintain_library.py verify --library wiki/image-library --receipt-dir <external-receipts>
```

The Claude edition uses the identical command under `.claude/skills/`. The payload adds a full record or merges a named record's treatment; a bulk `records` array registers an exact imported set. All referenced artwork must already be inside the canonical library. Registration and verification reject escaping paths, conflicting file hashes and unregistered artwork.

The producer checks whole-library input membership before writing derived outputs, including provenance under `records/` and support files. Added or removed inputs abort the operation; derived outputs and the human `decisions.jsonl` log are excluded. Content/hash/link checks remain separate. This detects drift during planning, not a filesystem lock: concurrent imports stay paused through registration and verification, and later additions require a fresh update.

Because any unregistered image anywhere under `assets/` blocks every registration, register each new image as soon as it is written, before generating the next. Never leave one waiting for a review round: two sessions each waiting for the other's unregistered file deadlock (2026-09-26). Break a deadlock by moving only your own unregistered file out temporarily (record its SHA-256), letting the other session register, then restoring the identical bytes. A registered file is immutable: a corrected sidecar is a new retained sibling (`<id>-v2.json`) registered as the treatment's new metadata. It is never an in-place edit.

Normal export requires the existing canonical manifest. If it is absent, the helper stops with recovery guidance; it does not reconstruct a replacement catalog from historical discussion or site folders. This keeps a missing input from silently reviving a second source of truth.

| Content | Location relative to the canonical root |
|---|---|
| Flat / outline diagrams | `assets/vector/diagrams/svg-flat/`, `assets/vector/diagrams/svg-outline/` |
| Shared vector icons | `assets/vector/icons/<style>/` |
| Holographic / photo diagrams | `assets/diagrams/<style>/` |
| Original references | `assets/originals/` |
| Earlier versions and retained artwork | `assets/earlier-attempts/` and their declared versioned paths |
| Earlier vectors, brand marks and experiments | `assets/earlier-vectors/`, `assets/variants/`, `assets/brand/`, `assets/experiments/` |
| Journal / Scaling Tier and other cinematic scenes (collection `scenes`) | `assets/scenes/` |
| Comic B art: pages, layers, models, navigation (collection `comics`) | `assets/scenes/comic-b/`, `assets/experiments/comic-b/` |
| New prompts, lineage and verification evidence | `records/<id>/<style>/<revision>/` |

Every top-level catalog path is relative to `wiki/image-library/`. Resolve each treatment's exact `path` and `metadata`. Current `assets/vector/` sidecars and the nested vector manifest use lookup paths relative to `assets/vector/`; that nested manifest is a preserved vector-delivery snapshot, not the current four-style catalog. Retained historical sidecars elsewhere preserve their original paths as provenance and geometry records; they are not current source locators. An authored `assetFile` remains a lookup key, resolved through the declared asset map rather than guessed from the sidecar's folder.

## Remove images

**Remove in Studio Images archives a file outside the repo; Matt's click on its confirm dialog is the approval** (Matt, 2026-10-11, spec "Commit every image, without duplicates; quick removal in Studio"). The Record view has a page **Remove** (every file of the record) and a **Remove** per style; the library has **Select** (multi-select bar) and **Remove all rejected** (files whose record or treatment status is rejected, or that Matt rejected in Studio). Studio moves the files itself (`apps/mtw/modules/images/server/remove.ts`, `POST /api/images/remove/plan` then `POST /api/images/remove`); no agent procedure runs.

1. The dialog shows the file count, total size and the archive folder, and lists **Kept** rows with the reason. A file is kept when it is in use: a website copy or resized derivative under `site/` carries its name stem, a comic story in `site/src/data/comic-stories/` names it, a maintained wiki page names it, or it is selected or approved (status, record fields or Matt's Studio decision). Kept rows never fail the rest of the batch.
2. The whole batch is refused while a Python `maintain_library.py` run is active, a live lease in `wiki/operations/leases.json` covers the library's derived files or `decisions.jsonl`, or another removal runs.
3. Each file is copied to `<archiveRoot>/images-removed-YYYYMMDD/wiki/image-library/<path>` (`archiveRoot` from `wiki/operations/storage/config.json`), the copy's sha256 is checked against the source and the registered hash, and only then is the source deleted. A mismatched copy is discarded and its source kept.
4. Registered files leave the catalog through the producer: `maintain_library.py remove --library wiki/image-library --receipt-dir <dir> --payload <json>`, then `verify`. If the producer refuses, every deleted source is restored from its archive copy.
5. Each batch writes `archive-record-<time>.json` beside the archived files (path, repo path, bytes, sha256, `archivedTo`, record ids, time, status, kept rows) and one `remove` line in `decisions.jsonl` (subject `img-remove:<time>`). Restore: copy each `archivedTo` back, check its sha256 and register it again.

**Producer `remove` (2026-10-11):** `maintain_library.py remove` takes Studio's payload `{expectedManifestSha256, remove:[{path, sha256, recordIds, archivedTo}]}` after the files are archived and deleted. It refuses a stale manifest hash, a path that still exists, a path registered on a record the entry does not declare, a hash mismatch and a diagram that carries tours; it drops exactly those treatments, any record left with no file, links to dropped records and their `files[]` rows, rewrites the derived files and writes a receipt naming every removed path, record and treatment. Every other drop is still refused by the append-only guard. Tests: `test_remove.py` beside the producer and the real-producer case in `apps/mtw/tests/images-remove.test.ts`.

## Preservation records and sharing

Collection, per-style and status counts are the manifest's `counts`; Studio Images (`/m/images`) shows them. Earlier artwork is retained but unselected for public use; missing raster icon sets do not authorize generation.

**Comic art has its own collection, `comics` (Studio tab Comics), separate from the cinematic `scenes` (Scene photographs: Journal covers, service and overview heroes)** (Matt, 2026-10-11: "classify comic images as comic images ... cinematic are separate"). The producer's `COLLECTIONS` lists the seven collections; Studio's sweep infers `comics` and the `comic-ink` style for new files under `assets/scenes/comic-b/` and `assets/experiments/comic-b/`, and `comic_art.py` registers new pages there. Records already filed elsewhere keep their collection (the 23 Comic B layout inputs and reference originals named doubtful in the plan, and review screenshots that `comic-story-library.mjs` registers explicitly as `experiments`); inference applies only when no collection is given. Readers of comic pages (the comics storage provider) accept `comics` and the older `scenes` value. The 2026-10-11 move of 1,034 records is evidenced in [the reclassification plan](../image-library/records/comic-style-reclassification-20261011/plan.json).

The 2026-09-17 relocation of discussion artwork into the library (Matt's authorization) is recorded in [the relocation record](../image-library/records/discussion-relocation-2026-09-17/README.md), with [the source-location browser](../image-library/records/discussion-relocation-2026-09-17/source-locations.html) and [machine-readable map](../image-library/records/discussion-relocation-2026-09-17/source-locations.json) that resolve historical paths to current files and hashes, and the earlier [preservation record](../image-library/records/maintenance-2026-09-17/preservation.json) and [source aliases](../image-library/records/maintenance-2026-09-17/source-aliases.json) that distinguish unique artwork from duplicate copies and derived review/optimizer images. Raw archived HTML and scripts in those records keep their original bytes and path strings; they are historical records, not alternate browsers or executable workflows.

A sharing package is a dated ZIP export of the library, produced with `mtw export images --out <fresh dir outside the repo>` and checked after extraction; its bundled browser reflects the runtime at export time. A ZIP is never a current authority, and sharing new features or tours requires a fresh checked export. The exported browser uses relative image/script/style/font paths and a classic data script, with no server or remote dependency.

Registered provenance includes retained producer logs that match repository ignore rules. A Git checkout alone can therefore be incomplete as a sharing-library source. Named exports account for these bytes through an exact retained-supplement inventory; the declared hashes and portable-library verification remain part of that export contract. The procedure is `.codex/skills/agent-handoff/references/release-revisions.md`, section "Export and verify a named deployment revision". This does not affect the website package, which excludes provenance history.

## Inventory and identity

Diagrams use a 1600 × 900 viewBox. Icons use 64 × 64 except the brain, which uses 96 × 64. The SVGs embed icon geometry and outlined text: no font-dependent text, external image/font/script/stylesheet dependencies, raster images, scripts or foreignObject. All internal references resolve.

### Existing assets relevant to section mapping

| ID | Actual subject and limits |
|---|---|
| `delivery-agentic-devops` | Claude Code, Codex and GitHub Copilot contribute to a repository loop with tests, human review and governed access; no autonomous release is implied |
| `delivery-scale-to-copilot` | A small team proves a workflow, packages it and adapts it for Microsoft 365 Copilot; no automatic code compatibility or numerical scale is claimed |
| `websites-agent-ready` | ChatGPT/Claude, an existing website, WebMCP tools, a reading view and organizational knowledge; it does not assert universal provider support or depict a complete form-send sequence |
| `governance-agent-governance` | Allowed builders, inventoried agents, scoped data reach and a stopped sprawl branch; repeated objects are illustrative counts |
| `governance-agentic-devops` | Coding tools, access/data controls, repository and human review; it does not label every proposed sandbox, allowlist, audit or token mechanism |
| `azure-ai-migration` | Discovery, planning, estimates, packaging, validation, deployment and handover, with AI assistance and a human decision gate; no accelerator name or invented performance claim |

The six original Azure IDs also exist: `azure-01-on-premises-to-azure`, `azure-02-cross-tenant-migration`, `azure-03-subscription-moves`, `azure-04-landing-zones`, `azure-05-networking-and-recovery` and `azure-06-aws-ec2-to-azure`. Asset existence does not decide its section caption or create tour step data.

The artwork retains inert historical provenance strings inside SVG metadata. They are not runtime dependencies. Current source lookup is self-contained through the top-level catalog and its declared files; historical sidecar strings do not override it. The publication optimizer strips embedded metadata; packaging has not created a second altered artwork variant. Historical per-output generator revisions were not recorded for every asset; current helper hashes are not presented as historical generator identity.

## Catalog and the preserved vector snapshot

The top-level catalog uses `records[]`, with explicit `collection`, `logicalId`, `treatments`, source links and per-version status. Each treatment supplies its library-relative file and optional geometry metadata, dimensions, hash and review note. It drives the browser and future authoring lookup.

The earlier vector package is retained under `assets/vector/` with its style-specific sidecars, README and schema-version-1 manifest. Its `diagrams[]`, `icons[]` and `iconAliases` describe that vector delivery only. Historical raster `missing` entries in that nested snapshot do not override the current top-level catalog, where all diagram treatments exist. The legacy site snapshot remains at `site/src/assets/library/` for preservation; active vector lookup uses the top-level canonical catalog or its generated deployment package.

Source provenance uses SHA-256. The website optimizer cache is a derived artifact and currently uses different cache keys/hashes; it is not an authoring source.

## Metadata and tour compatibility

Each style's `id`, `elements`, `relationships`, `viewBox` and `description` are preserved from its source metadata. An element's `assetFile` is an authored lookup key; resolve it through `assetReferences` to obtain a library-relative icon path. A diagram does not fetch those icons.

Element positions differ between treatments even when IDs match, so a tour resolves the sidecar of the treatment it shows; using flat metadata for outline or Glass artwork misframes the camera. Treatments of one diagram share routed IDs and route geometry identities, which the tour association records per treatment.

`mcp-azure-boundary` in `second-brain-medium-business` is a flat-only decorative enclosure. A tour shared across styles targets the common semantic MCP element. Plain association lines in `linePrimitives` are not automatically traceable `relationships`. Camera route sampling and the Glass camera are in [Diagram Tours](diagram-tours.md#glass-camera).

## Site integration boundary

`site/scripts/images/canonical-library.mjs` resolves every diagram record, its vector treatments and their declared metadata for `site/src/lib/images.ts` and the SVG optimizer. It rejects duplicate IDs, escaping paths, missing files, identity and sidecar mismatches. `DiagramAside` and the Options page use this resolver; API names, output URL patterns and optimizer cache conventions stay compatible.

The canonical wiki is preferred when present. Deployments rooted at `site/` use the explicit generated `site/src/data/canonical-images/` package (vector files, metadata, current tour definitions and one manifest). With the wiki present, the build checks package and site-copy freshness against it. Without the wiki, checks establish the packaged data's internal consistency, not freshness against an unavailable authority; a present but invalid wiki fails the build rather than triggering fallback. The field `sourceManifestSha256` hashes the declared diagram-record projection, not the full library manifest; the package excludes `.gitattributes` and is not a sharing library or history archive. Source hashes use SHA-256; optimizer hashes are derived cache identities. Git attributes preserve integration bytes.

Raster lookup is the legacy `site/src/assets/image-sources` compatibility set; raster tour framing is undecided, and portable tour playback offers the vector styles with their own geometry. The library exposes a tour action only for generated playback; `brain-cortex` is static. Data and playback preservation checks do not establish rendered behaviour: see [Diagram Tours](diagram-tours.md) and [image quality](image-quality.md).
