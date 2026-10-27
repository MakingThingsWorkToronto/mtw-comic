---
id: comics-run-checks
title: Run comic story checks
module: comics
runner: claude
skill: mtw-comic-story
params:
  - name: story
    label: Issue
    type: select
    options: [home, agentic, traditional, data-migrations, demo, all]
    required: true
models:
  - runner: claude
    model: claude-sonnet-5-5
    effort: medium
  - runner: codex
    model: gpt-6.1-sol
    effort: medium
---
Read AGENTS.md, docs/authoring.md and the comic-story checks reference. Check only this standalone comic repository; no consulting pages, 8-bit player, private archive or sibling checkout is required.

From site/, run node scripts/comic-story-check.mjs --story src/data/comic-stories/<story>.ts --require-art for the requested story. For all, check home, agentic, traditional and data-migrations, then node scripts/comic-story-check.mjs --registry --require-art. Registered standalone reader links and HTTPS related-page links are valid; deleted consulting page templates are not prerequisites.

From the root run npm test, npm run test:runtime, node site/scripts/build-comics-library.mjs and node .claude/skills/mtw-soundtrack/scripts/comic-audio.mjs check. A build and browser review use the one coordinated slot when authorized. Use npm run test:live -- <origin> to check delivered media including runtime-created URLs.

Report actual exit codes and each error with its story/scene/panel. Keep source validation, registration, decoded image delivery, native playback, listening and human approval separate. This check procedure does not generate assets, change words, infer approval, publish, commit or push. Report any missing source or failed check; do not replace it with an older website fixture.
