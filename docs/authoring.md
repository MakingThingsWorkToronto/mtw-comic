# Authoring this public example

AGENTS.md is the instruction authority. Claude Code loads it through CLAUDE.md; Codex reads it directly. Current user instructions set the task. The imported wiki and dated craft references preserve how the original website was built; their old website routes, local archive paths, queues and scope decisions are historical context, not prerequisites for this repository.

## Commands

Install Node 24+, then run `npm --prefix site ci`, `npm run build`, `npm test` and `npm run dev`. The preview is http://127.0.0.1:8789/. Claude Code and Codex run from the root with `claude` or `codex`; no private website checkout or MCP service is required.

For optional library authoring, install `npm --prefix apps/mtw ci` and run `npm run studio`. Studio is http://127.0.0.1:8790/ and operates on this repository. Library folders contain data; the application is under apps/mtw. Python image tools and optional media providers have their own documented dependencies; their setup is not needed to build or play the retained examples.

The application registry includes only Comics, Images, Soundtrack, comic Workflows and the Operations needed to launch local authoring agents. There are no Journal, storage, schedule or spend modules. Image reference protection stays with Images. The browser reader has no consulting page templates, contact form, website playlist or parallax coordinator.

## Sources

Stories and navigation are in site/src/data/comic-stories. The shared reader is site/src/components/ComicStory.astro and site/public/scripts/comic-story.js; Home retains its versioned player. The four authored issues and the demo are standalone under /comics/. Home voice-review inputs are packaged with scripts/comics/package-review.mjs; run it with --check to detect drift.

## Assets

Images, original artwork and visual evidence belong in wiki/image-library; music, speech, effects and recordings belong in wiki/soundtrack-library. Cast, voice profiles, storyboards and comic records belong in wiki/comics-library. The selected native files and playback integration copies are tracked here. No workstation archive or media junction is required for these examples.

Before creating an asset, check reuse and run `node scripts/assets/check-asset-destination.mjs image <path>` (or audio). Save new versions, retain original bytes and failed attempts, and register through Studio or `node apps/mtw/cli/mtw.mjs register`. Catalog files are producer output. Site files are integration copies; preserve their source identity. A downloaded cache file or worker packet is unfinished until its canonical import and registration are verified.

## Images

Follow the paired imagegen and relevant art skills. Inspect actual supplied references, retain prompts and hashes, and review returned images themselves before selecting them. Third-party calibration scans are not redistributed; old calibration recipes require the caller to supply the referenced inputs. The existing generated artwork can be built and played without those scans. A changed visual requires actual desktop/phone review; metadata and a passing fixture do not establish visual quality.

## Music and speech

Retained music keeps its exact source credit and licence in wiki/soundtrack-library/sources.json. Reuse the measured profiles when cutting a story. New discovery adds candidates for human review. A saved voice or audition is not approval to generate new dialogue: use exact current words, casting and the actual provider authorization. Keep provider keys in your environment, never in Git. Silent, muted, paused and reduced-motion states retain distinct transport behavior.

## Writing

Use the supplied story, audience and evidence. The local mtw-articulation and mtw-inquiry references support writing and interviews; they do not require private Journal or consulting-site documents. Fictional comic events remain fiction and cannot serve as evidence of consulting outcomes. Review the actual changed words and drawings together before generating speech.

## Changes and review

Inspect Git status before writing; preserve other work. Keep paired skill files byte-identical. Repair a concrete defect in its owning source, make the smallest useful change, and return to the requested output. Delegation, new paid generation and publication require the actual current task's authorization. Do not infer approval from files, tests or commits.

Build, run the relevant checks and inspect the affected presentation when browser access is available. After deployment run `npm run test:live -- https://comics.makingthings.work`; this checks page and media delivery, not visual playback or listening. Vercel must include site/public/scripts; root-only authoring exclusions in .vercelignore preserve those files. Commit exact paths with scripts/git/commit-paths.mjs, and report unperformed reviews honestly.

Run `npm run test:runtime` for the retained player transport fixtures. These simulate runtime behavior and complement the deployed-resource check; they do not replace a browser or listening review.
