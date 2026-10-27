# Comic Story art stage

`comic_art.py` turns one row of an art brief into a layered, crisp SVG panel. It registers the result in the canonical image library and copies it to the site. The full guide, covering the method, targets, review and lessons, is `../../references/art-pipeline.md`.

## Quick start (from the repo root; the Codex edition is the same path under `.codex/`)

```
python .claude/skills/mtw-comic-story/scripts/art/comic_art.py setup                                              # pinned venv outside the repo
python .claude/skills/mtw-comic-story/scripts/art/comic_art.py all --every --brief wiki/image-library/records/comic-b-art-pipeline-inputs-20260928/calibration-brief.json --jobs 2   # 1. calibration remakes of the reference pages
python .claude/skills/mtw-comic-story/scripts/art/comic_art.py sheet --every --brief wiki/image-library/records/comic-b-art-pipeline-inputs-20260928/calibration-brief.json --pair-refs --name calibration
python .claude/skills/mtw-comic-story/scripts/art/comic_art.py judge --panel calibration-xmen137 --brief wiki/image-library/records/comic-b-art-pipeline-inputs-20260928/calibration-brief.json --score 96 --reasons "..."
#    then set styleAnchors in trace.config.json to the best 2-3 remakes
python .claude/skills/mtw-comic-story/scripts/art/comic_art.py all --every --brief wiki/image-library/records/comic-b-art-pipeline-inputs-20260928/model-brief.json --jobs 2 --version 2   # 2. model sheets
python .claude/skills/mtw-comic-story/scripts/art/comic_art.py all --story home --jobs 2                            # 3. a story's panels, then judge and integrate each
python .claude/skills/mtw-comic-story/scripts/art/comic_art.py sheet --story home                                   # contact sheet of the review renders
```

Run one stage with `<stage> --panel <id>[,<id>] [--version N]`. The automatic stages are `prompt generate trace review measure` (trace also optimizes, records and registers); `judge` and `integrate` are manual, and `integrate` refuses unless the gate passed. After a failed review, rerun the whole panel with `--version 2`. Existing files are never overwritten.

## Files

| File | Purpose |
|---|---|
| `comic_art.py` | The pipeline |
| `trace.config.json` | Black-and-teal palette, style anchors and style sets, ink-plate (potrace) and colour-flat (vtracer) settings, halftone fields, layer rules, svgo config, the 300 KB cap, measure targets and the judge minimums. `configVersion` changes with every edit |
| `versions.lock.json` | Pinned tools. A mismatch stops the run unless `--allow-version-drift` is given, and any drift is recorded |
| `prompt-fragments.default.md` | Craft v2 prompt fragments; the analyst's fragments fill only names this file does not define |
| `test_box_prompt.py` | Offline checks that the `box-defects` fragment, `box_defect_lines` and the [box-defect checklist](../../references/box-defects.md) share D1-D15. They also check that a surface with no camera face, or a content surface with no `shows` or reader, is refused. Use `comic_art.py box-prompt --panel <id> --brief <brief.json>` to print the block for a hand-written or fix prompt |

## Environment

| Variable | Default | Meaning |
|---|---|---|
| `COMIC_ART_VENV` | `%LOCALAPPDATA%\mtw-comic-art\venv` | Pinned Python venv (vtracer, potracer, numpy, Pillow). The script re-runs itself inside it |
| `COMIC_ART_WORK` | `%LOCALAPPDATA%\mtw-comic-art\work` | Prompts, staged Codex output, reference-page PNGs and crops (`_refs`, never in the repo), traces, review renders, sheets, `_failures.log`, `_register.lock` |
| `MTW_REPO` | four folders above this one | Repo root |

The Codex CLI must be on `PATH`. The site's `node_modules` supplies svgo and sharp.
