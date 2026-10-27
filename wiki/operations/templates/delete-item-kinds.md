---
id: delete-item-kinds
purpose: Per-kind detail for the operations-delete-item procedure. The procedure body stays byte-identical across every delete (the cached prefix); the agent reads only the section for the kind named under "This run".
---
# Delete a library item: per-kind detail

Each section names the item's identity, where its files and records live, which producer rewrites derived files, what else may reference it and the check to run. Removing a file always means listing each file individually; a folder is never removed as a unit.

## image

- Item: one version of one style of one image record, `img:<record>#<style>@<version>`. The version is a `v<N>` token or an 8-character sha256 prefix. Only that version is in scope; the record's other styles and versions stay.
- Read: `wiki/site/image-workflow.md`, `wiki/site/image-library.md`. Resolve with `GET /api/assets/resolve?ref=<ref>` when Studio runs, else a bounded query of `wiki/image-library/manifest.json` for that record only.
- Files: the version's file under `wiki/image-library/assets/`. Site integration copies are same-bytes files or resized derivatives named after the master under `site/public/` and `site/src/`; find them by file name and hash.
- References: other records' `references`, `relatedDiagrams`, `selectedReference`, `retainedFrom` and `logicalId`; diagram tours; Journal covers; comic drawing references; `site/` imports.
- Producer: `python .claude/skills/mtw-raster-alternatives/scripts/portable-gallery/maintain_library.py refresh --library wiki/image-library --receipt-dir <a fresh folder outside the repo>`, then `verify` the same way. The producer rejects null treatments and path deletion, so it has no removal operation for a registered version. If the inventory shows the catalog would still list the removed file after `refresh`, stop after the plan: report that the producer needs a removal operation before this version can be deleted, and change nothing. Never edit `manifest.json` or `data.js` by hand.
- Decision library: `image-library` (module `images`).

## track

- Item: one music track, `snd:<id>`.
- Read: `wiki/site/soundtrack-library.md`.
- Files: the track's audio under `wiki/soundtrack-library/assets/` (its `file` in `sources.json`) and its derived `wiki/soundtrack-library/profiles/<id>.json`.
- References: `usedBy` in `sources.json`; `discovery.json` runs that list it; `comic-audio.json`; Beat Comic and comic story data under `site/src/data/`; page heroes and transitions under `site/`.
- Records: the track's entry in `wiki/soundtrack-library/sources.json` (canonical, edit only that entry). `manifest.json` and `profiles/` are derived.
- Producer and check: `node .claude/skills/mtw-soundtrack/scripts/soundtrack.mjs build`, then `check`.
- Decision library: `soundtrack-library` (module `soundtrack`).

## comic

- Item: one Comic B issue, by story id.
- Read: `wiki/site/comics-library.md`, `wiki/site/comic-story-world.md`.
- Files: `site/src/data/comic-stories/<id>.ts`; its art and audio are canonical image and soundtrack library items and are listed as references, not removed, unless Matt names them.
- References: the registry `site/src/data/comic-stories/index.ts` (route and order), `site/public/comic/<id>/` integration copies, `wiki/comics-library/speech.json`, `speech-approvals.json`, `sounds.json`, `playback-review-inputs.json`, workflows, Journal entries and page links.
- Ownership: `site/` story data and integration copies are edited only when this session holds them in STATUS.md; otherwise write the handoff note.
- Producer and check: `node site/scripts/build-comics-library.mjs`.
- Decision library: `comics-library` (module `comics`).

## comic-page

- Item: one scene (page) of one issue, `<issue>/<scene id>`.
- Read: `wiki/site/comics-library.md`; the `mtw-comic-story` skill's story-craft and checks references for scene timing.
- Edit: remove only that scene's entry from `site/src/data/comic-stories/<issue>.ts`, then fix what depends on its position: later scenes' beat timing if the story data derives it, NEXT links and introductions. Speech records for its balloons in `wiki/comics-library/speech.json` and approvals are references: list them and ask whether to retire them.
- Files: the page art is an image library item; list it as a reference, not a file to remove, unless Matt names it.
- Ownership: the story data file is edited only when this session holds it in STATUS.md; otherwise write the handoff note naming the exact edit.
- Producer and check: `node site/scripts/build-comics-library.mjs`.
- Decision library: `comics-library` (module `comics`).

## comic-box

- Item: one box (panel) of one scene, `<issue>/<scene id>/<box number>`, with a fingerprint after `@` that Studio uses to tell boxes apart; the box number is 1-based in reading order.
- Read: as comic-page.
- Edit: remove only that panel from the scene in `site/src/data/comic-stories/<issue>.ts`, with its balloons, effects and motion; renumber nothing else by hand that the data derives. List its balloons' speech records as references and ask before retiring them.
- Ownership, producer, check and decision library: as comic-page.
