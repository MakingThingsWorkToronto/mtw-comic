---
id: comics-run-checks
title: Run comic story checks
module: comics
runner: claude
skill: mtw-comic-story
params:
  - name: story
    label: Issue
    type: select
    options: [home, agentic, traditional, data-migrations, demo, all]
    required: true
models:
  - runner: claude
    model: claude-sonnet-5-5
    effort: medium
  - runner: codex
    model: gpt-6.1-sol
    effort: medium
---
Follow AGENTS.md or CLAUDE.md (they are identical) for this repo. Read the Comics row of its task table, `wiki/site/comics-library.md` and the skill named in the frontmatter. Another session may own the comic story data and the site runtime: read them, never modify files under `site/`.

From `site/`, run one command at a time (a shared build rule): `node scripts/comic-story-check.mjs --story src/data/comic-stories/<story>.ts` for the issue under "This run". For `all`, run it for each of home, agentic, traditional and data-migrations, then `node scripts/comic-story-check.mjs --registry`, then `node scripts/comic-story-deslop.mjs`.

Report each command, its exit code and every ERROR, WARN or FAIL line verbatim, grouped by scene and panel when the line names one. List the checks that stay human (mtw-articulation review, ai-slop-check, desktop and phone playback, art check) as not run. Do not fix anything, edit story files, start a browser, commit or push.

For a Home demo-readiness request, record the exact current canonical story/runtime/retime/types/CSS and catalog/projection hashes before these checks. Verify that the reader's served story and selected image/audio delivery refer to that snapshot; a future worker file is a separate candidate. Read the owning audio-motion guidance and the current canonical audio-opportunity inventory when one exists. From the repo root, validate that exact inventory with `node .codex/skills/mtw-comic-story/scripts/audio_opportunities.mjs --audit <exact-current-canonical-audit.json> --root .`, then run the maintained browser-free playback input check `node site/scripts/comic-story-playback-review.mjs --check-inputs --slugs home --config wiki/comics-library/playback-review-inputs.json`. Respect current file/read resource ownership and report a missing or stale inventory, alias, registration or receipt explicitly; do not substitute an older transport audit or relabel pending visuals inspected. Preserve approved music selections, intentional score zero and separate pending voice/word status. These commands do not generate audio or perform native listening.

Report source/schema checks, canonical registration and byte-bound delivery, served visibility/decode/timing, audio hearing and Matt review as separate states. A successful script exit, source loudness value, quantity ratio or past native report cannot establish a complete current mix. Return exact reproducing commands and cold/warm Brief, quiet passages, meaningful action cues, music transitions, seek/replay and earphone listening windows for the integrating owner. Actual browser playback, capture and listening stay not run in this procedure unless that owner separately releases the one browser and exact capture destinations. Do not start those operations, refresh catalogs, edit gains/timing/words or create new assets from this check request.
