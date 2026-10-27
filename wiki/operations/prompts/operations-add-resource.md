---
id: operations-add-resource
title: Add a library resource
module: operations
runner: claude
idleMinutes: 60
params:
  - name: kind
    label: Resource kind
    type: select
    options: [image, track, character]
    required: true
  - name: name
    label: Name or working title
    type: text
  - name: brief
    label: What it is and what it is for
    type: text
    required: true
  - name: details
    label: Form fields
    type: text
  - name: sources
    label: Sources and references
    type: text
  - name: subject
    label: Studio subject
    type: text
    required: true
models:
  - runner: claude
    model: claude-sonnet-5-5
    effort: medium
  - runner: codex
    model: gpt-6.1-sol
    effort: medium
---
Follow AGENTS.md (CLAUDE.md loads it) for this repo. Matt filled an "Add" form in MTW Studio. That form starts this run; it is not his approval of any plan, spend or file.

The request is under "This run": the resource kind, a name or working title, a brief, the remaining form fields as `Label: value` pairs separated by "; ", sources and references separated by "; ", and the Studio subject. Read the section for that kind in `wiki/operations/templates/add-resource-kinds.md`, then only the wiki pages, skills and producer commands that section names. Do not read the other kinds' sections, whole manifests or whole logs; query only the records this request needs.

This is an interactive session. Work in four phases and stop at the first that fails.

1. **Reuse check (read only).** Search the kind's canonical catalog for an existing item that already meets the brief (same name, same purpose, an earlier version or a rejected attempt). Check the current task coordination and run `git status --short` for every path you would write. A path another session owns, uncommitted changes you did not make, or a lease in `wiki/operations/leases.json` blocks that path.
2. **Plan and ask.** Print a short plan: what will be produced or taken in, how many options, each exact destination path (run `node scripts/assets/check-asset-destination.mjs <image|journal|audio|comic> <path>` for every new file and show the result), the provider and model or tool for each paid or external request with its count and an honest cost estimate, the producer command that registers each output, and what stays untouched. If a reusable item exists, say so and offer reuse instead. If the brief is too thin to act on, ask the one or two questions that decide it. Then ask Matt to reply `yes` in this terminal. Do nothing further until he does: no provider request, no download, no generation and no write to a canonical library. Any other answer is a change to the plan; revise it and ask again.
3. **Produce only the approved plan.** Make exactly the approved requests, one each, with no automatic retries; a failed paid request is reported, not repeated. Images are generated only by Codex through the Codex CLI (`codex-orchestration` skill); Claude never generates an image itself. Pass every tool an explicit output path that the destination checker accepted. Never overwrite, move or delete an existing file; a new attempt is the next unused `-vN`.
4. **Register and check.** Register every output, including attempts Matt may reject, through the kind's maintained producer or the Studio CLI (`node apps/mtw/cli/mtw.mjs`), then run the kind's check and report its exit code. Never hand-edit a generated projection (`manifest.json`, `data.js`, `all-files.html`, `profiles/<id>.json`, `comic-audio.json`) and never bypass the registration hooks. New items stay candidates or unreviewed: never approve, select, rate or queue anything for Matt; he decides in the Studio module.

If anything fails part way, stop, leave what exists in place and report exactly what was produced, registered and left pending. Provider caches and Codex outputs are transport: keep their bytes until import and registration succeed.

Never run `git add`, `git commit`, `git push`, `git checkout --` or `git reset`; Matt reviews the working tree and commits. Report in under 250 words: each new file with its sha256 prefix and catalog record, the producer and check exit codes, the spend made, and what waits for Matt's review in which Studio view. When you have reported, wait in this terminal for Matt's follow-up; tell him he can close it when he is done.
