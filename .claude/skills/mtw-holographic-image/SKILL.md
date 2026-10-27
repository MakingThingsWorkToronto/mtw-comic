---
name: mtw-holographic-image
description: Generate or regenerate an MTW scene image in the approved translucent holographic style using MTW brand colors. Use for standardizing selected reference images, overlay layers for parallax, and any new scene artwork the spec requests.
---

# MTW holographic image

For this public repository, begin with root AGENTS.md and docs/authoring.md. They define the current standalone paths and commands; dated website examples below remain craft references.

Generate one holographic image per call in the MTW material: translucent teal filament holography in brand colours on the flat page background, preserving the composition reference. This is the material guide; batch scope, order, pause and review limits belong to `mtw-raster-alternatives`, and the generation transport belongs to `imagegen` and `codex-orchestration`. Loading it authorizes no queue. Requirements and Matt's dated decisions are in `AGENTS.md` (later decisions prevail); current facts are on the wiki pages linked below; read root AGENTS.md and docs/authoring.md first.

## Read first

- `wiki/site/design.md` section "Colors" and `docs/authoring.md#images` section "Diagram design contract": the brand palette, the page background and the status-colour rule the prompt must obey.
- `docs/authoring.md#images` section "Raster diagram versions": the lighter review profile and the pause rule.
- `docs/authoring.md#images` section "Authority and where things belong": where outputs and records go.
- `../mtw-raster-alternatives/references/subject-contracts.md`, named by step 2.
- `../imagegen/references/scene-brief.md`, named by step 4.

## Steps

1. **Ground the task.** Run the `wiki-grounding` skill Part A, then read the wiki sections above by heading. Confirm the request names this image (one ID or scene) and the batch it belongs to.
   Check: you can name the six brand colours and the page background from `design.md` "Colors" without this file restating them.
2. **Resolve the inputs.** Reference image: for a selected-reference counterpart, open the exact original through the diagram's `references[]` in `wiki/image-library/manifest.json`; for a new-SVG counterpart, use the diagram's current native PNG as the composition reference and an approved selected image as the material reference, recording the canonical SVG and metadata hashes. Subject: objects, relationships and exact short labels from the selected image's `native_detail_observation` or the SVG and its metadata, under the Part 2 label scope in `../mtw-raster-alternatives/references/subject-contracts.md` (keep internal labels that the SVG also carries; remove embedded titles; never apply Part 3 photo-only removals to holography; record any explicit per-image override). Output: a fresh path under `wiki/image-library/assets/diagrams/holographic/` (or `assets/scenes/` for an authorized scene) or an assigned external packet.
   Check: every input is read-only and hashed; the output path does not exist and passes `node scripts/assets/check-asset-destination.mjs image <path>`.
3. **Write the prompt file.** Paste the core style block once:

   ```text
   Use case: stylized-concept. One landscape 16:9 raster image for the Making Things Work website.
   Style: exceptionally detailed translucent holography in MTW brand colors only: teal-light #5fc4c9 and teal #1a9ba1 luminous light with paper-white #f2f2ef nearest edges and highlights. Fine curved luminous filaments following each object's geometry, microscopic mesh detail, tiny sharp nodes, genuine internal layered depth, razor-sharp near edges and softly attenuated far edges, dark intervals within volumes, restrained local bloom. Preserve the composition reference's camera and layout. Give objects local translucent depth without shifting node positions or changing route directions.
   Background: flat solid #0b1419 across the entire frame, with no haze, gradient, stars, specks or vignette. [Or: fully transparent background with preserved alpha.]
   Objects: recognizable, few and meaningful; connections are few, purposeful and legible. Any source people are finely resolved luminous humans. Documents and folders are translucent fiber holograms, never opaque white. App windows are thin open translucent panes.
   Text: no added overall image title, watermark or invented copy. Retain every permitted internal label, including semantic column and group headings. The compiled scene constraints supply their exact text and surfaces.
   Never: floor, base, pedestal, plinth, podium, projection ring, enclosing box or card, website layout, dashboard, HUD, decorative rings, frosted milky glass, opaque plastic, low-poly blocks, rainbow or extra colors.
   ```

   Secondary label text is the muted token and denied or blocked routes alone use error red (`design.md` "Colors"); product logos are monochrome contours in these colours, resolved through the library manifest's icon marks. No other hues.
   Check: the prompt names only the palette colours and no title, floor or HUD.
4. **Append the compiled scene card.** Run the `../imagegen/references/scene-brief.md` compiler on the inputs (Part 2, with any recorded override) and append its block once. It carries named marks with open contour interiors, endpoint-specific arrowhead counts, bare captions, natural-foot constraints only where needed and the red/X termination rule for denied routes; keep those local constraints out of the core block. Then add:

   ```text
   Reference image 1: composition reference for a new output. Preserve its composition, object counts, relative sizes, routes and arrow directions except the explicit compiled scene changes.
   Subject: [objects and relationships from the spec].
   ```

   Check: the file contains exactly one style block, one compiled block and one subject line; the helper hash is recorded.
5. **Generate.** Inside Codex: `imagegen`'s built-in `image_gen` with the prompt and the reference, then copy every output to its fresh canonical path or packet. From Claude Code or a shell:

   ```text
   bash .codex/skills/mtw-holographic-image/scripts/generate.sh <reference.png> <output.png> <prompt.txt>
   ```

   The prompt goes through stdin because `codex exec -i` would consume a prompt argument as another image; the script refuses repository outputs outside the image library. Record UTC start and end around the call.
   Check: exactly one new PNG at the named path; drafts are kept as well as the preferred candidate.
6. **Review under the lighter profile** (`docs/authoring.md#images` "Raster diagram versions"). Open the output beside its reference and record only what you checked: corners sample flat `#0b1419` or true transparency with no haze; only brand colours and monochrome logos; no title and only the requested labels spelled exactly; counts, routes and arrow directions match the reference; the material is fine luminous filament, not frosted glass. Look beneath figures for independent contact pads while keeping real foot outlines and purposeful nodes; check product silhouettes and open contour interiors in the same whole-image view (judge a logo on a pane against that pane); foreground links are thin filaments, not shelves.
   Check: each item is recorded as checked or not checked; `python .claude/skills/imagegen/scripts/inspect_png.py <output.png>` dimensions and alpha are recorded.
7. **Correct at most once.** Only for an obvious content error (wrong or missing human geometry, identity, route, required label). After the correction compare the whole page composite for unrelated changes; keep the clean earlier attempt if a blocking regression remains. Small residual cosmetic pads are recorded, not re-edited. `python .claude/skills/mtw-holographic-image/scripts/contact_proofs.py` may produce optional diagnostic crops for a suspected meaning-changing contact defect; it cannot declare a pass. A recurring defect goes through `../../../docs/authoring.md#changes-and-review`; a changed prompt rule is a hypothesis until the next eligible output is reviewed, and no image is generated to test it.
   Check: at most one correction call; both attempts preserved.
8. **Record and register.** Save prompt, lineage and review under `wiki/image-library/records/<id>/<style>/<attempt>/`, then register through `../mtw-raster-alternatives/SKILL.md#canonical-library-maintenance`. A saved PNG is not an updated library; approval is Matt's and is never implied. Never overwrite; new versions are `-v2`, `-v3` siblings.
   Check: the record folder and the manifest treatment both point at the new file; status is `draft`, `unreviewed-preview` or `in-review`.

## When something is wrong

| Symptom | Redo |
|---|---|
| Haze, gradient, pedestal or HUD in the output | Step 3 (style block intact, pasted once) |
| A label from the photo brief is missing | Step 2 (Part 2, not Part 3) |
| Logo in brand colours but filled, not contour | Step 6 then one correction (step 7) |
| `generate.sh` refuses the output path | Step 2 (fresh path under the library or an external packet) |
| Prompt argument treated as an image | Step 5 (stdin) |
| Contact pads under figures | Step 6: record; correct only if meaning changes |

## Report

- ID, inputs with roles and hashes, prompt file hash, helper hash, call timings.
- Output path, dimensions, alpha, hash; checks performed and not performed; the one correction if any.
- Record folder and registration receipt; status.
- `Contributed:` the wiki page and heading, skill or procedure you wrote to.
