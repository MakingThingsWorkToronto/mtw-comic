---
id: "wiki:site/copy-workflow"
kind: "workflow"
title: "Copy workflow"
load_when: "Starting any task that writes or revises words on the site: which page or skill answers each question, and the order of operations from surface to rubric."
themes: ["site", "copy", "workflows"]
keywords: ["copy entry point", "articulation", "content-refinement", "order of operations", "authority table", "which rubric"]
routes: ["/*"]
relations: [{"type":"depends_on","target":"wiki:site/content-rubric","reason":"The workflow uses this rubric to assess finished site copy separately from drafting craft."},{"type":"depends_on","target":"wiki:site/content","reason":"Every copy task applies the content rules before any surface-specific craft."}]
---
# Copy workflow

The entry point for any session that writes or revises words on this site. Load progressively: this page, then the [communication rubric](content-rubric.md) for the standard, then `mtw-articulation` before writing a sentence, then only the surface's own skill and the source material that surface needs. Do not load every content page and every draft to change one paragraph.

The wiki owns facts and standards. Paired repo skills own craft. Nothing here approves publication; Matt approves every page and every entry.

## Authority and where things belong

| Question | Where it is answered |
|---|---|
| What is the voice, and what may never appear | [Content rules](content.md): business-leader framing, no client names, no prices, no invented facts, a model is "they" |
| Is this finished copy good enough | [Communication rubric](content-rubric.md): seven tests, recorded as meets, revise, evidence needed, or not applicable with reason. No scores, no length quotas |
| What am I actually saying, and in what order | `mtw-articulation` (`.claude/skills/mtw-articulation/SKILL.md`, mirrored in `.codex/skills/`): page fifty, the three written questions, compression, the three orderings, the word that identifies the thing |
| How do I revise existing page and tour copy | `content-refinement` (`.claude/skills/mtw-diagram-tour/references/content-refinement.md`): copy surfaces, component props, the static check, carrying a repair forward |
| What claim may this copy make | [Measured outcomes](../experience/measured-outcomes.md) and the rubric's claim states: attested result, implemented behavior, documented capability, proposed approach, illustrative scenario, attributed opinion |
| Which pages and sections exist, and what shared copy they consume | [Structure](structure.md) and [service content](service-content.md) |
| Journal entries specifically | [Journal knowledge](../journal/README.md), then the interview and drafting skills. The rubric records that the Journal's interview and drafting method stays separate from the site-wide rubric |
| Does the rendered result look generated | `ai-slop-check`, which is visual tropes only and says nothing about sentences |

Craft that serves every surface lives in a shared skill that each surface points at, never inside one surface's skill. `content-refinement` governs page and tour copy site-wide and stays in the `mtw-diagram-tour` package because it works there; this table is what makes it findable. Spoken delivery (Matt on a call, a demo or a podcast) has no skill.

## Order of operations for a copy task

1. **Establish the surface.** Which route, section, component prop, tour step, model field or entry. Shared copy has several consumers; find them before changing one.
2. **Read this page, then the rubric.** Do not skip to the draft.
3. **Shape before writing.** Use `mtw-articulation`. Answer its three questions in writing. For an existing piece that is clear but not landing, this is usually where the problem is.
4. **Write or revise**, using the surface's own skill: `content-refinement` for page and tour copy, `mtw-task-field` for a model, `journal-entry` for a Journal entry, `llm-column` for a column section.
5. **Assess against the rubric**, recording a finding and either a rewrite or a reasoned retention. A retention needs a reason, just as a rewrite does.
6. **Check every consumer of shared wording** (`node scripts/verify-tour-copy.mjs` in `site/` for tour text; see [service content](service-content.md#shared-tour-copy)), then read the result in a browser. A passing text comparison is not editorial acceptance.
7. **Stop.** Integration, deployment and Matt's approval are separate operations and none of them follows from good copy.

**Which rubric applies to a Journal entry.** Both, doing different jobs. `journal-entry` carries the Journal's own drafting rubric and governs the prose. The site-wide rubric still governs what the entry shares with the rest of the site: claim states, evidence boundaries, link text and consistency across surfaces. What the site rubric does not govern is the Journal's interview and drafting *method*, which is what content-rubric.md means by staying separate.

The articulation method is adapted from a public post and is **method, never evidence**; its use does not establish proof for a public claim.
