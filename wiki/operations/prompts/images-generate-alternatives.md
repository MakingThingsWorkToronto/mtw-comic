---
id: images-generate-alternatives
title: Generate image alternatives
module: images
runner: claude
skill: mtw-raster-alternatives
params:
  - name: image
    label: Image to start from
    type: asset
    assetType: img
    required: true
  - name: style
    label: Style
    type: select
    options: [holographic, photorealistic, svg-glass, scene]
    required: true
  - name: brief
    label: What to change or try
    type: text
models:
  - runner: claude
    model: claude-sonnet-5-5
    effort: medium
  - runner: codex
    model: gpt-6.1-sol
    effort: high
---
Choose the scope before the authoring reads below. If this run's brief explicitly requests **execution only** of an already-authored, frozen `svg-glass` packet from the coordinating root, follow [Execute a frozen SVG packet](../../../.codex/skills/codex-orchestration/SKILL.md#execute-a-frozen-svg-packet) and end after its receipt. That branch requires exact guarded inputs, one command or an explicitly enumerated serial batch, owned outputs and canonical destinations; it does not authorize new design or registration. All other runs follow the existing authoring workflow below.

Follow AGENTS.md or CLAUDE.md (they are identical) for this repo. Read the Images row of its task table, `wiki/site/image-workflow.md`, `wiki/site/image-library.md`, `wiki/site/design.md` and the skill for the style under "This run": `mtw-raster-alternatives` for holographic or photorealistic diagram alternatives, `mtw-glass-diagram` for svg-glass, `mtw-holographic-image` for a scene. Another session may own `wiki/image-library/` and the generation queue: read `discussion/handoff/STATUS.md` and inspect Git status first, and stop and report who holds them. Holographic and photorealistic diagram batches and raster icons stay paused unless this run names them, so do exactly the one bounded request below and no neighbouring images.

Resolve the starting image (`img:<record>[#style]@<version>`) with `GET /api/assets/resolve?ref=<ref>` when the MTW app is running, otherwise read only that record from `wiki/image-library/manifest.json` with a bounded query. Check the library for an existing alternative or reusable version before generating anything.

Choose an exact destination under `wiki/image-library/assets/` with a new `-vN` file name, run `node scripts/assets/check-asset-destination.mjs image <path>` for it, and pass that explicit output path to the tool. Keep the source image and every earlier version unchanged. Generate with the skill, then register the new file with `node apps/mtw/cli/mtw.mjs register image <path> --record <id> --style <style>` (preview with `--dry-run` first). Do not edit the derived library files by hand.

New versions register as `unreviewed-preview`. Do not mark them reviewed, selected or approved: Matt decides in the Images view. Report the new files and their hashes, the registered record and version token, the checks run with exit codes, what you did not check (visual review on desktop and phone), and any provider cache or pending import you left. Do not commit or push.
