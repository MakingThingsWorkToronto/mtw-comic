# Making Things Work comics

Illustrated motion comics with authored story data, layered art, lettering, music and saved speech.

[Open the project](https://comics.makingthings.work/) · [Headquarters of slop](https://www.makingthings.work/experiments/)

## Reproduce

With Node 24 or later:

```sh
npm --prefix site ci
npm run build
npm test
npm run dev
```

The player is at http://127.0.0.1:8789/. No provider account, sibling checkout, private wiki or MCP server is needed. Open `claude` or `codex` in this root; [AGENTS.md](AGENTS.md) is the single instruction source, and CLAUDE.md loads it.

## Authoring

- Player and components: `site/src/components`, `site/public/scripts`.
- Authored content: `site/src/data/comic-stories`.
- Original images and catalog: `wiki/image-library`.
- Music, original audio, credits and measured beat profiles: `wiki/soundtrack-library`.
- Versioned craft, scripts and references: `.claude/skills` and `.codex/skills`.
- Casting, saved speech and exact-word approvals: `wiki/comics-library`. No new voice selection or approval is implied by this export.


Install the optional local Studio with `npm --prefix apps/mtw ci`, then `npm run studio`. It runs on 8790 and manages this repository only. `scripts/comics/package-review.mjs` packages the Home voice-review inputs; `node scripts/comics/package-review.mjs --check` detects drift.

Music retains its source licence and attribution in `wiki/soundtrack-library/sources.json`; the player displays its credit. Fonts retain their bundled licence notices. Third-party style reference scans and the consulting website’s private history are not bundled. Optional generation uses your own provider credentials from environment variables and requires explicit authorization.

## Deployment

Vercel runs the root `vercel.json` build command and serves `site/dist`. The .claude/.codex sources and native libraries are in Git, while uploads exclude authoring-only data.
