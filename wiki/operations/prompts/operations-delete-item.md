---
id: operations-delete-item
title: Delete a library item
module: operations
runner: claude
idleMinutes: 30
params:
  - name: kind
    label: Item kind
    type: select
    options: [image, track, comic, comic-page, comic-box]
    required: true
  - name: target
    label: Item
    type: text
    required: true
  - name: paths
    label: Known files
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
Follow AGENTS.md (CLAUDE.md loads it) for this repo. Matt pressed Delete on one item in MTW Studio. That click starts this run; it is not his approval of any file. Studio keeps the item's panel disabled while this terminal runs and removes the panel once the item is gone from its library's data.

The item is under "This run": its kind, the exact item, any file paths Studio already knew, and the Studio subject. Read the section for that kind in `wiki/operations/templates/delete-item-kinds.md`, then only the wiki pages and producer commands that section names. Do not read the other kinds' sections or whole manifests; query only this item's records.

Work in four phases and stop at the first that fails.

1. **Inventory (read only).** Resolve the item to its exact canonical record and files. List, with repo-relative paths:
   - the canonical asset files that belong to exactly this item (only the version named; never an earlier or later version that was not named, never a whole folder);
   - the catalog or registry records that name it, and the maintained producer that rewrites each derived file;
   - every other reference to it: site integration copies under `site/`, story data, other records' `references`, `usedBy`, `selectedReference` or lineage, workflows, decisions that a gate reads, and code. Search with `git grep` for its id, file name and hash prefix.
2. **Ownership check (read only).** Check the current task coordination and run `git status --short` for every path in the inventory. A path another session owns, a path with uncommitted changes you did not make, or a lease in `wiki/operations/leases.json` blocks that path.
3. **Plan and ask.** Stop and report without changing anything if any of these hold: the item is not found or matches more than one record; anything other than the item's own records still references it (name each reference); a needed path is blocked by ownership; deleting it would leave a registered record pointing at a missing file that no producer can repair. Otherwise print the exact plan: each file to remove with its sha256, each record to change and the producer command that will change it, each reference to edit, and what stays. Then ask Matt in this terminal to confirm, word for word, `delete <target>`. Do nothing further until he types it. Any other answer ends the run with nothing changed.
4. **Execute only the confirmed plan.**
   - Remove only the listed files. Do not use wildcards, recursive deletes, `git clean`, `git rm -r` or folder moves.
   - Change catalogs and registries only through their maintained producers or the Studio CLI (`node apps/mtw/cli/mtw.mjs`), and canonical hand-maintained source files (such as `sources.json` or a story data file) by editing exactly the named entry. Never hand-edit a generated projection (`manifest.json`, `data.js`, `profiles/<id>.json`, `comic-audio.json`) and never bypass the registration hooks or the destination checker.
   - Edit a site integration copy or story data file only when this session holds its ownership through current task coordination; otherwise report the required handoff in this terminal naming the exact file and edit still needed, and leave that file alone.
   - Run the library's check after the producer, as named in the kind's section, and report its exit code.
   - Record one decision for the library (`image-library`, `soundtrack-library`, `comics-library`): when Studio runs, `POST /api/decisions/<library>` with `{"actor": "matt", "module": <Studio module>, "subject": <the item>, "action": "delete", "value": {"via": "operations-delete-item", "files": [<removed paths>], "records": [<changed records>]}}`; otherwise append that object with a new `id` (UUID) and `at` (ISO time) as one line to `wiki/<library>/decisions.jsonl`.

If anything fails part way, stop, leave the remaining files in place and report exactly what was and was not removed so Matt can decide; never restore or delete further on your own.

Never run `git add`, `git commit`, `git push`, `git checkout --` or `git reset`; Matt reviews the working tree and commits. Report in under 250 words: what was removed, what was changed by which producer with exit codes, any handoff note written, and anything left for Matt. When you have reported, tell Matt he can close this terminal.
