---
id: images-generate-alternatives
title: Generate comic art alternatives
module: images
runner: claude
skill: mtw-comic-story
params:
  - name: image
    label: Image to start from
    type: asset
    assetType: img
    required: true
  - name: style
    label: Style
    type: select
    options: [comic-ink]
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
Read AGENTS.md, docs/authoring.md and the comic-story art pipeline. This procedure makes an alternative of the selected comic artwork; it does not start a website diagram or unrelated image batch.

Resolve the exact img: reference through Studio's asset resolver or its one catalog record. Reuse an existing suitable version before making a new attempt. Preserve the source, cast identity and the requested scene's words, action, subjects and evidence.

Follow the current request's generation authorization. Choose a new version under wiki/image-library/assets/, run node scripts/assets/check-asset-destination.mjs image <path>, and use the local imagegen and comic-story helpers. Keep every attempt and register it with node apps/mtw/cli/mtw.mjs register image <path> --record <id> --style comic-ink. Never hand-edit catalog projections or infer selection from registration.

Review the actual result and its desktop/phone composition. Report the exact files, hashes, record/version and checks. New versions remain unreviewed until the actual review; publication and human approval are separate. Do not commit or push.
