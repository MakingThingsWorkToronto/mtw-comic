---
id: images-review-version
title: Review an image version against its references
module: images
runner: claude
skill: ai-slop-check
params:
  - name: image
    label: Image version
    type: asset
    assetType: img
    required: true
  - name: references
    label: Reference images
    type: text
models:
  - runner: claude
    model: claude-sonnet-5-5
    effort: medium
  - runner: codex
    model: gpt-6.1-sol
    effort: medium
---
Follow AGENTS.md or CLAUDE.md (they are identical) for this repo. Read the Images row of its task table, `wiki/site/image-workflow.md`, `wiki/site/image-library.md`, `wiki/site/design.md` and the skills that apply to the image type. Another session may own `wiki/image-library/`: read `discussion/handoff/STATUS.md` and inspect Git status first.

The image under "This run" is an `img:<record>[#style]@<version>` reference. Resolve it to its file: `GET /api/assets/resolve?ref=<ref>` when the MTW app is running (the port is in `apps/mtw/.state/` or the terminal that launched you), otherwise read only that record from `wiki/image-library/manifest.json` with a bounded query. Never dump the whole manifest. If the run lists reference images, resolve each the same way; otherwise use the record's `references`, `relatedDiagrams`, `selectedReference` and earlier versions (same `logicalId` or `retainedFrom`).

Open the real files, not descriptions of them. Compare the version beside each reference and its previous version for composition, brand colours, type, readable labels, and fidelity to the reference. For SVG, follow `svg-visual-verification` (label centering, padding, connector alignment, contrast). Apply `ai-slop-check` to anything meant for the site. Distinguish what you checked from what you did not.

This is a review, not a decision. Do not edit any file, change a status, register anything, or mark an image reviewed, selected or approved: Matt does that in the Images view. Report, in under 300 words: the exact files compared, what matches, what differs, concrete defects with where they are, and one recommendation (keep, revise, or reject) with the reason.
