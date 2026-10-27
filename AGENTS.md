# Comics

AGENTS.md is the single instruction source. Claude Code loads it through CLAUDE.md; Codex reads it directly. No other website checkout, provider account or MCP server is needed to run this example.

## Reproduce after pulling

Install Node 24 or later and Claude Code or Codex, then:

```sh
git clone https://github.com/MakingThingsWorkToronto/mtw-comic.git
cd mtw-comic
npm --prefix site ci
npm run build
npm test
npm run dev
```

Open http://127.0.0.1:8789/. Start an agent with `claude` or `codex` from this root and ask it to reproduce the README. Optional Blender authoring requires Blender; optional paid media work requires your own environment keys and explicit approval.

## Authoring

Use the repo-local paired .claude/skills and .codex/skills; begin with `mtw-comic-story`. Preserve supplied stories, source models, original media, prior versions and third-party licences. Never infer human approval from a generated file or test. Keep credentials and workstation state out of Git.

Canonical images and audio live in wiki/image-library and wiki/soundtrack-library. Comics data is in wiki/comics-library and site/src/data/comic-stories. Media registration uses the maintained producers. Install the optional Studio with npm --prefix apps/mtw ci, then npm run studio. The local skills carry the generation scripts and references.

## Verify and publish

Run npm test and npm run build. Check changed desktop, phone and reduced-motion behavior when browser access is available; report unperformed checks. Commit exact owned paths with `node scripts/git/commit-paths.mjs -m "message" -- paths`. Vercel serves `site/dist` at https://comics.makingthings.work/. Publication requires the current user's authorization.

Read docs/authoring.md for standalone authoring, local Studio, source packaging and review commands. Imported wiki/site pages retain historical website context; their older private archive paths, page routes and queues do not apply to this public clone. Current task instructions and this root remain authoritative.
