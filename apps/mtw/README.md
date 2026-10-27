# Comic Studio

Local comic authoring and review, with image registration, soundtrack tools and authoring terminals.

## Start

From the repo root:

```
npm --prefix apps/mtw ci
npm run studio
# Build/type-check separately:
npm --prefix apps/mtw run build
# Serve the built bundle:
node scripts/studio/start-studio.mjs --built
```

Open **http://127.0.0.1:8790/**. A busy port is an error. Run `npm run dev` separately for the reader on **8789**.
The first run installs `apps/mtw` dependencies by itself. The server only answers on loopback.

## What each section is for

- **Home**: links and summaries for the comic tools.
- **Images**: browse, review and register image versions.
- **Soundtrack**: play, rate and approve music candidates and credits.
- **Comics**: cast, voices, speech to review, art fixes.
- **Operations**: live terminals (Claude, Codex, shell), token usage, and Procedures (one-click prompts).
- **Workflows**: the comic build, its authoring steps and human review gates.

## Where things live

- Data and decisions stay in `wiki/image-library/`, `wiki/soundtrack-library/` and `wiki/comics-library/`. Never hand-edit generated catalogs.
- The review modules are `/m/images`, `/m/soundtrack` and `/m/comics`. For an offline image snapshot run `node apps/mtw/cli/mtw.mjs export images --out <folder>`.
- Procedures: prompts in `wiki/operations/prompts/*.md`, templates in `wiki/operations/templates/`.
- Runtime state (pids, rendered prompts, transcripts): `apps/mtw/.state/`, not committed.

## Extend

- **Add a module**: create `modules/<id>/` with `meta.ts`, `server.ts`, `client.tsx` (copy `modules/operations/`), then add one line each to `modules/server-registry.ts` and `modules/client-registry.ts`. Optional `summary()` on the server module puts rows on Home.
- **Add a runner**: add a row to `wiki/operations/runners.json` (label, executable, args, tokenSource, permissions). It appears in the runner pickers without code changes.
- **Add a procedure**: add `wiki/operations/prompts/<id>.md` (frontmatter: id, title, module, params, runner).

## Test

```
cd apps/mtw
npm test           # vitest
npm run typecheck
```
