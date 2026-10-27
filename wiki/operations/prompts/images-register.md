---
id: images-register
title: Register images
module: images
runner: claude
skill: mtw-raster-alternatives
params:
  - name: paths
    label: Files to register
    type: text
    required: true
  - name: record
    label: Existing record id
    type: text
  - name: style
    label: Style
    type: text
  - name: collection
    label: Collection
    type: text
  - name: note
    label: Note
    type: text
models:
  - runner: claude
    model: claude-sonnet-5-5
    effort: medium
  - runner: codex
    model: gpt-6.1-sol
    effort: medium
---
Follow AGENTS.md or CLAUDE.md (they are identical) for this repo. Read the Images row of its task table, `wiki/site/image-workflow.md`, `wiki/site/image-library.md` and the skill named in the frontmatter. Another session may own `wiki/image-library/`: read `discussion/handoff/STATUS.md` and inspect Git status first, and stop and report who holds it instead of editing around a lease.

The files under "This run" are separated by "; ". Each is already saved under `wiki/image-library/assets/`. Do not copy, move, edit or delete any image. Registration goes only through the `mtw` CLI, which builds a payload for the existing producer `maintain_library.py` and runs `register` and then `verify`. Never edit `manifest.json`, `data.js`, `all-files.html` or `README.md` by hand.

1. Preview first: `node apps/mtw/cli/mtw.mjs register image <paths> --dry-run` from the repo root, adding `--record`, `--style`, `--collection` and `--note` only when the run sets them. Read the preview. A file whose bytes match its registered entry is a no-op. A registered path with different bytes is refused: registered files are immutable, so save the new bytes under the proposed next `-vN` name and register that. Diagram and icon files need `--record`. Every other unregistered image under `assets/` blocks the producer for everyone, so include them in the same batch or report them.
2. Run the same command without `--dry-run`. The CLI checks leases, writes the payload and receipts under `apps/mtw/.state/`, runs `register`, then `verify`.
3. Run `node apps/mtw/cli/mtw.mjs sweep images --no-files` and confirm nothing is left unregistered.

New files register as `unreviewed-preview`. Never set a status, never mark anything reviewed, selected or approved: Matt decides in the Images view. Report the registered ids and styles, the producer's exit codes, anything refused and why, and the files that still need a human decision. Do not commit or push.
