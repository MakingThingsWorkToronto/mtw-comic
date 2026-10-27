---
id: images-refresh-verify
title: Refresh or verify the image library
module: images
runner: claude
skill: mtw-raster-alternatives
params:
  - name: mode
    label: Mode
    type: select
    options: [verify, refresh]
    required: true
models:
  - runner: claude
    model: claude-sonnet-5-5
    effort: medium
  - runner: codex
    model: gpt-6.1-sol
    effort: medium
---
Follow AGENTS.md or CLAUDE.md (they are identical) for this repo. Read the Images row of its task table, `wiki/site/image-workflow.md`, `wiki/site/image-library.md` and the skill named in the frontmatter. Another session may own `wiki/image-library/`: read `discussion/handoff/STATUS.md` and inspect Git status first, and stop and report who holds it instead of editing around a lease.

The library's derived files (`manifest.json` counts and file inventory, `data.js`, `all-files.html`, `README.md`) are written only by the producer `maintain_library.py`. Never edit them by hand. `decisions.jsonl` in the library is Studio's decision log, which the producer skips. The old in-library browser (`index.html`, `browser.js`, `library.css`) is retired; review happens at `/m/images` in Studio, which re-reads the manifest on its own.

Always run `verify` first, from the repo root, with a receipt folder outside the library and the helper:

`python .claude/skills/mtw-raster-alternatives/scripts/portable-gallery/maintain_library.py verify --library wiki/image-library --receipt-dir apps/mtw/.state/receipts/<timestamp>`

If the mode under "This run" is `verify`, report the exit code and the producer's message, then stop. If it is `refresh` and `verify` reported that derived files need a refresh, run the same command with `refresh`, then `verify` again. If `verify` failed for any other reason (unregistered image files, a hash conflict, a missing file), do not refresh: report the exact files and the producer's message, and suggest `node apps/mtw/cli/mtw.mjs sweep images` or `mtw register image` as the next step. Receipts are transport: keep them.

Report the commands run, their exit codes, the receipt folder, and whether the derived files now match. Do not commit or push.
