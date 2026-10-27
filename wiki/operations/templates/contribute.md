---
id: contribute
purpose: Stable block after every procedure body and before "## This run", so the cached prefix never changes.
---
## Contribute what you learned

Before you finish, record what this run taught you where it belongs. Ownership in `Git status and current task coordination` still applies: if another session owns a file, report the change instead of editing around it.

- If a step of this procedure was wrong, missing or unclear, fix the procedure file `wiki/operations/prompts/<operation id>.md` (the operation id is under "This run"). Keep the body stable and put nothing variable in it.
- If a skill's instructions or helpers were the cause, update the owning skill in BOTH editions: `.claude/skills/<name>/` and `.codex/skills/<name>/`.
- If you learned or corrected a fact, update the owning wiki page in place; do not append a duplicate.
- Register any asset you produced through its maintained producer in its canonical library.
- Do not commit or push unless this procedure's own Rules say to, and do not widen scope to make an improvement.

End your final message with a short list:

Contributed:
- <path or asset> — <what changed and why>

If nothing needed recording, write one line: `Contributed: nothing — <why>`.
