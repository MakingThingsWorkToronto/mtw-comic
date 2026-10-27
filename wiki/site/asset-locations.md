---
id: "wiki:site/asset-locations"
kind: "knowledge"
title: "Canonical asset locations"
load_when: "Saving, importing or registering any image, audio, comic or Journal file, or deciding where a new or transported asset belongs."
themes: ["images", "audio", "comics", "journal", "operations"]
keywords: ["canonical home", "asset destination", "transport", "register", "destination checker", "integration copy"]
relations: []
---
# Canonical asset locations

Matt's canonical destinations apply to new authoring, imports, drafts, candidates, experiments and retained variants. Paths below are relative to `C:/Code/MTWWebsite-clean/`.

| Asset | Canonical home | Owning contract |
|---|---|---|
| Images, including comic art, Journal covers, screenshots, crops and comparison sheets | `wiki/image-library/` | [Image workflow](image-workflow.md), [image library](image-library.md) |
| Journal entry sources, including the LLM column, drafts, interviews, answers, editorial decisions and conversation records | `wiki/journal/` | [Journal knowledge](../journal/README.md), [Studio Journal module](../journal/console.md), [LLM column](../project/agent-journal.md) |
| Music, ambience, effects, speech, auditions and cached provider audio previews | `wiki/soundtrack-library/` | [Soundtrack library](soundtrack-library.md), [music-discovery craft](../../.codex/skills/mtw-music-discovery/SKILL.md) |
| Comic stories, storyboards, cast, voice direction, casting choices and comic-specific non-media records | `wiki/comics-library/` | [Comics library](comics-library.md), [library README](../comics-library/README.md) |

Asset type decides the media destination. A comic voice profile belongs in the comics library; its recording belongs in the soundtrack library. A Journal entry belongs in the Journal; its cover belongs in the image library. Content records link to those media records and preserve attribution, provenance and review status. Do not create duplicate media authorities.

Before generation, downloading or authoring, resolve the exact output paths against the repository root and check the current library for reusable assets. Supply explicit output arguments; a tool's default directory is not authority. Canonical media must be retained and registered with the existing library before it is reported as delivered. Register through the maintained producer (`node apps/mtw/cli/mtw.mjs register image <path>`, or the library's intake procedure); the relevant [MTW Studio](mtw-app.md) module shows the result. Do not hand-edit generated catalog projections or replace the Studio runtime.

If a provider can only return a cache file, or a coordinated worker must stage outside the repo, record each transport path, canonical destination and outstanding import. Import/register through the assigned integrating writer. Preserve candidate bytes until canonical retention is verified. Transport is not another authoring home and does not establish delivery.

`site/` holds runtime code and explicit integration/optimized copies. Every new content or media copy there must identify its canonical source and be checked for freshness before release. Canonical assets do not imply publication or approval.

## Local native media volumes

Matt, 2026-10-20: keep the source checkout below 2 GB, reclaim disk first, clean local Git next and rewrite the remote last. The full native image and soundtrack libraries on this workstation are retained outside Git at `C:/MTW-archive/repo-cleanup-20261020/libraries/{image-library,soundtrack-library}`. Directory junctions preserve the canonical `wiki/image-library/` and `wiki/soundtrack-library/` paths for Studio, registration, original bytes, catalogs and review decisions. `.mtw-local-media.json` explicitly names the two physical homes; the destination checker permits only those exact roots and still rejects links escaping a library. That local mapping and the native volumes are ignored by Git.

Completed Studio operation receipts are retained at `C:/MTW-archive/repo-cleanup-20261020/studio-receipts`, with a directory junction at `apps/mtw/.state/receipts` preserving existing receipt links. Browser profiles and entered session data remain in place.

A source clone uses the site's existing packaged canonical diagram inputs and tracked runtime media. To author or browse the full native libraries on another workstation, restore the native volumes and explicitly configure the same canonical paths there. Do not generate replacement art because the local volumes are absent. The archive contains the exact file/hash storage plan; moving these files changes their backing storage, not their logical registration or review status.

## Existing compatibility boundaries

The current comic producer reads story files under `site/src/data/comic-stories/` and accepts canonical soundtrack audio references while keeping retained comic-local media readable. The LLM column includes site integration data and older discussion/external drafts. Existing compatibility inputs remain preserved; they are not destinations for new canonical authoring. Inspect the current producer before changing adapters or relocating exact files, and coordinate with its owner. This policy alone does not establish a migration or runtime change.

An older path example in a skill, wiki page or generator cannot override these destinations. If a producer rejects the canonical path, resolve that specific adapter conflict within the authorized task before integrating; do not save a new asset to a legacy home to make the check pass.

## Studio owns library functionality

Matt, 2026-10-11: app functionality for `wiki/image-library/`, `wiki/journal/`, `wiki/soundtrack-library/` and `wiki/comics-library/` moves to [MTW Studio](mtw-app.md) (`/m/images`, `/m/journal`, `/m/soundtrack`, `/m/comics`). The four folders hold data only: media, catalogs, records and decision logs. Browsing, review, approval, registration, editing, viewers, consoles and shared helpers are Studio code under `apps/mtw/`.

- Do not add HTML, JavaScript, CSS or TypeScript to these folders. The pre-commit `wiki-code` check refuses new code under `wiki/` unless `scripts/hooks/wiki-generated-allowlist.txt` lists it.
- Grandfathered code still in a library folder (for example `wiki/image-library/{index.html,all-files.html,data.js}`) migrates into Studio when its callers can use Studio. It retires through an exact file plan Matt approves.
- Retained evidence under `records/` (build snapshots, packets) is not live app code. Keep it until its knowledge and dependencies are accounted for.

## Misplaced media

Matt, 2026-10-11: he should never have to ask for generated assets to be moved to their canonical homes. Save every new image, recording or Journal source to its home from the start. Studio intake and the pre-commit hook catch new media misses ([guaranteed registration](mtw-app.md#guaranteed-registration)). Journal text has no automatic check: write drafts, interviews and answers under `wiki/journal/` and move any you find in `discussion/` or scratch with the same plan below.

The backlog is reported by `node scripts/assets/find-misplaced-media.mjs` (`--json` for per-file target homes). It lists tracked and untracked media outside every canonical home (`site/` integration copies, skill assets and `scripts/assets/media-exempt.txt` excepted), plus media inside the comics or Journal homes that belongs in the image or soundtrack library. The SessionStart hook prints its total to every Claude and Codex session.

When the total is not zero, do not wait for Matt to ask. Bring him one relocation plan:

1. Run the report and group the files by folder.
2. For each file, name its target path in its media home (`node scripts/assets/check-asset-destination.mjs <image|audio> <path>`) and every reference that must follow it (comic records, site copies, skill links).
3. Present the exact list in one message. The no-whole-folder-move rule still requires Matt's approval of that list.
4. On approval, move the bytes (`git mv` for tracked files), register them (`node apps/mtw/cli/mtw.mjs register image <path...>` or the soundtrack intake), update the references, and rerun the report.

Folders Matt protects stay put until he decides: `discussion/verification/` (Step 1 evidence) is preserved in place unless he approves its move.
