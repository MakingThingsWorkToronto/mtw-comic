# MTW Studio

One local app over the wiki libraries: terminals, review queues, storage plans, schedules and token use.

## Start

From the repo root:

```
npm run all             # website preview (8787) + Studio (8788) (Ctrl+C stops both)
npm run studio          # Studio only, dev mode with hot reload
npm run studio:build    # build + type-check the web bundle
npm run studio:start    # serve the built bundle
```

Open **http://127.0.0.1:8788/** (the next free port if 8788 is busy; the command prints the URL).
The first run installs `apps/mtw` dependencies by itself. The server only answers on loopback.

## What each section is for

- **Home**: what needs you now: running terminals, items waiting on a decision, tokens today.
- **Images**: browse, review and register image versions.
- **Soundtrack**: play, rate and approve music candidates and credits.
- **Comics**: cast, voices, speech to review, art fixes.
- **Journal**: queue, interviews, drafts and what waits on Matt.
- **Operations**: live terminals (Claude, Codex, shell), token usage, and Procedures (one-click prompts).
- **Schedules**: recurring runs; they only enqueue, you press start.
- **Spend**: token and cost estimates against budgets (estimates, not bills).
- **Storage**: footprint per library and plans awaiting your approval.

## Where things live

- Data: `wiki/` (libraries, `wiki/operations/`). Human decisions are logged per library in `wiki/image-library/decisions.jsonl`, `wiki/soundtrack-library/decisions.jsonl`, `wiki/comics-library/decisions.jsonl` and `wiki/journal/decisions.jsonl`. Never hand-edit generated files.
- The old per-library browser consoles under `wiki/` are retired; each Studio module (`/m/images`, `/m/soundtrack`, `/m/comics`, `/m/journal`) replaces one. For an offline image snapshot run `node apps/mtw/cli/mtw.mjs export images --out <folder>`.
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
