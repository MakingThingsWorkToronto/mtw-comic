---
id: "wiki:site/content"
kind: "knowledge"
title: "Content"
load_when: "Writing or revising any public copy on the site or in the Journal: voice, what may never appear, people and pronouns, step text, service-specific rules, Journal rules, closing headings and full stops."
themes: ["site", "copy", "journal"]
keywords: ["voice", "no client names", "no prices", "pronouns", "leave room", "heading full stops", "how matt can help", "journal rules", "step text"]
routes: ["/*"]
relations: [{"type":"depends_on","target":"wiki:site/positioning","reason":"Copy rules apply the positioning decisions and audience framing recorded there."},{"type":"depends_on","target":"wiki:experience/measured-outcomes","reason":"Public proof wording is bounded by the attested outcomes and proof boundaries."}]
---
# Content

The rules every piece of public copy follows. Finished copy is judged by the [communication rubric](content-rubric.md); the order of work is in the [copy workflow](copy-workflow.md). Signed LLM Journal text keeps its authorship and composition; its rules are in [agent journal](../project/agent-journal.md).

## Voice

- Written for business leaders: the problem, what changes, and the value. Not a technical description.
- Advisory first: taste, judgement and wide domain knowledge, anchored to Matt's [experience](../experience/README.md). See [positioning](positioning.md).
- No visible AI characters or AI-sounding phrases.
- Clients are never named; engagements are described by industry, source systems and the work done. Combinations of details (industry plus exact months, awards or user counts) can identify a client without naming it; the uncleared combinations are listed in [proof boundaries](../experience/measured-outcomes.md#proof-boundaries). Matt cleared awards and attested numbers from `wiki/experience` for the site on 2026-09-25; the client President's Award keeps generic wording, and employers are never named.
- Matt's resume is the source of truth over the project list. Never lead with total years of experience or early career dates.
- No prices. There is no approved vendor-price exception.
- Statistics quoted by competitors (for example "16% of business-critical data is overshared") are third-party figures. They are never presented as MTW's own proof; MTW proof comes only from Matt's real projects and systems.
- Do not restore content from the rejected site or earlier website snapshots. Existing topic research does not authorize reusing those articles. Every new article needs Matt's approval.
- Each section starts from the buyer's immediate concern, makes one plain point and supports it with a relevant example. Recognizable consequences replace machinery descriptions; detailed methods are left for the call; the section stops when the point is complete. The source is the [communication reference](../research/agentic.md#content-references-reviewed-17-september-2026); its promotional numbers supply no MTW proof.

## People in copy (reference, not a gate)

Recorded so Matt can point at it later. It is guidance for whoever writes copy, not something enforced by a build check.

- Matt, 2026-09-16: "I do not believe it is fair in 2026 to refer to the nurse as a female... we should not use gender as a descriptor on this site."
- So copy avoids gendered pronouns: use they/them, or rewrite without a pronoun, which usually reads more assertively ("The nurse decides" rather than "she decides").
- Roles are described by what they do, not by gender, appearance or age.
- Third-party wording carrying gendered pronouns is adapted to neutral wording and credited as "adapted from", not presented as a verbatim quote.
- An LLM is referred to as **they**: a collective, not a single head (Matt, 2026-09-16). This covers Claude, Codex and any model named on the site or in the Journal.

## Leave room (Matt, 2026-09-16)

"Do not be overly honest, ambiguity is what makes people call. Think about it as a worm on a hook."

The site's job is to start a conversation, not to answer every question in advance. Pages are written to make a reader want the call.

- **Show the shape, not the whole method.** Say what changes and what it is worth; do not publish the step-by-step of how it is done.
- **Concrete about outcomes, open about scope.** "An Azure subscription move delivered in two weeks against a six-week estimate" earns the call. "Here is the full runbook" ends it.
- **No exhaustive lists, no full FAQs, no pricing logic.** Answer enough to be credible, then stop.
- **End sections on the reader's next question,** which is the reason to get in touch.
- **This is not licence to mislead.** Nothing false, nothing implied that is not true, no invented proof, no fake urgency, no false scarcity. Withholding detail is fine; misrepresenting is not.
- Practically: shorter answers, fewer caveats, no over-explaining the mechanics, and the call to action where the curiosity peaks.

## Immersive step text

Step text in the Task Field and the Diagram Tour describes the concept, not the animation (Matt, 2026-09-16). The picture supports the sentence; the sentence never reports the picture.

- Active voice, about the work and the role: what changed, why, and what it means.
- Never narrate motion ("tiles shrink out", "grows back into the gap", "the bottom row is empty") and never make a tile or element count the subject of a sentence.
- Two to three sentences a paragraph, and fewer paragraphs when the point is made.
- Naming a task or element is fine when it carries the argument, not as a list of what moved.
- Each paragraph names the elements it is about, so the right parts light up as it is read.

Encoded in the `mtw-task-field` and `mtw-diagram-tour` skills.

## Service rules

Content review takes place on the website: Matt needs copy integrated into its page before he can review it (Matt, 2026-09-17). Source research and drafts are preparation, not page approval. Shared tour copy and its consumers are mapped in [service content](service-content.md); source findings and their limits are in [agentic research](../research/agentic.md).

### Agentic Systems

- **Second-brain value:** maintained context lets work continue with less repeated input from the expert. Matt identifies this website's wiki, his Azure and insurer migration work, and his legal second brain as examples. Use the attested migration wording; name no client or case participant.
- **AI quotas differ by role** (Matt, 2026-09-17). Expert experimentation needs room within explicit limits, with exceptions for difficult work. Set allowances for the role and work, distinguishing R&D from routine use of proven workflows.
- **Second Brain**: packaged as a two-week SharePoint Online second brain or a two-week Claude Code / Codex second brain. Live demos available. Offers: [positioning](positioning.md#offers-and-pricing).
- **Agentic Team Modernization**: aligns its language with Anthropic's analysis of how work changes, turned toward buyers. The Design Reference retains attributed Anthropic wording. Production uses four original MTW role stories, introduced through the differences between industries; all task allocations are illustrative ([role models](task-field-models.md)).
- **Agentic Cost Planning** carries Matt's position (15 September, clarified 17 September 2026): understand the cost of the work and judge it against useful results. Expert operators develop context, methods and quality checks; people using proven workflows have different work and different allowances. Development consumption is R&D, not automatically waste.
  - Include model use, retries, infrastructure, development and human review. Separate development, testing and operation; which costs more depends on the workflow and volume.
  - Centralized reporting is the service approach. Record the visibility each platform actually supplies and the gaps. Neither complete session-level coverage across all vendors nor a client deployment of that reporting is established by the current proof.
  - A failed check can change the next action: bounded retry, specialist review or a person. Useful failures become corrections to shared knowledge, skills and regression checks. Improvement requires maintenance; it is not automatic or guaranteed.
  - Matt's **forecast**, stated 15 September, is that token prices commoditize and flat-rate Max plans eventually give way to standard usage pricing. This is his forecast, not announced vendor policy. The page prepares for changing prices and limits without predicting a cancellation date.
  - Matt considers this a strong differentiator. The [competitor research](../competitors/README.md) is a dated sample of public offers, not proof that every competitor stops at licence audits. No competitor radar or MTW payback benchmark is established; Matt selected a qualitative comparison in place of payback and competitor-radar charts.
- **Agentic DevOps & Scaling** (name decided 2026-09-15; "agentic DevOps" is Microsoft's own search term): agentic DevOps with Claude Code, Codex and GitHub Copilot, and scaling workflows proven in Claude or Codex to Microsoft 365 Copilot. GitHub Copilot and Microsoft 365 Copilot are always distinct.
- **Agent-Ready Websites** (name decided 2026-09-15): connects existing web properties with agentic features: WebMCP, optimizing sites for AI agents, and ranking in and integration with OpenAI and Anthropic. Delivered with a second brain. This website is the working example; no client example or verified platform list is recorded.

### Traditional Systems

- Every Traditional Systems service rests on the Roles & Access Control pattern, with application access (service principals, enterprise app registrations) shown in most images.
- **Information Governance & AI Readiness** covers:
  - oversharing and permissions debt ("Copilot does not create access; it exposes what users can already reach")
  - sensitivity labels, DLP, Purview and DSPM for AI
  - Entra access reviews and SharePoint Advanced Management
  - agent governance: who builds agents, the agent inventory, data reach, stopping sprawl
  - extending those controls to Claude Code, Codex and GitHub Copilot
- **Power Platform & Logic Apps**: Logic Apps delivery is not attested in the experience wiki, so its panel stays descriptive.

### Data & Migrations

- **M365 Migrations** links in how Claude and Codex are now used to build migration automation. Sources Migrated precedes the Explorer, after Reporting and before contact (Matt's placement); advisory-only and unclear projects are omitted.
- **Azure Migrations** explains how AI speeds up migration, using the concepts of Matt's migration accelerator at a high level so non-technical readers understand what the future of apps looks like. The accelerator is never named. The attested subscription move is not assigned to an unverified scenario ([proof boundaries](../experience/measured-outcomes.md#proof-boundaries)).

## Journal

- Matt's ordinary Journal requirement is immersive content as pop-out asides: one diagram tour plus one task field tour, three diagram tours, or one task field plus two diagram tours. The LLM column entries use cinematic covers and three related Diagram Asides each; their signed text is preserved. Their distinct authorship and moderation rules are in [agent journal](../project/agent-journal.md).
- Every post has a cinematic cover image tinted with the MTW palette. Diagrams in posts are Diagram Asides that launch their tour in place, never full-width tours.
- **Post titles are written to fit three lines on a Journal Card.** The card reserves three lines and clamps anything longer with an ellipsis, so a title that runs over is cut, not reflowed. Measured in the built page (Barlow Condensed 600, 60px on a 675px and a 563px card at 1440 and 1280, 48px on a 340px card at 390): three lines hold about **55 characters** on a desktop card and about **43 characters** on a phone card. Write titles at **30 to 43 characters** (roughly six or seven words) so they fit at every width, and never past 55. Check a new title on the Journal Card at 390 before publishing.
- Matt requested a 12-post backfill covering October 2025 to September 2026, followed by weekly drafts for approval. Each backfill post carries the month it covers, not its real publish date, and pages show month and year only (Matt, 2026-09-24). The entry states are in [the queue](../journal/queue.md).
- Entries must not be superficial (Matt on the recovered candidates: "weak and superficial"). A post needs a decision, a mistake or a measured outcome, not a summary of a vendor announcement. Each entry is dialled in with Matt through its own interview file before drafting ([runbook](../journal/runbook.md)).
- Topic recommendations come from Matt's own git commits, his local Claude Code and Codex sessions, and his X/Twitter bookmarks. His dev work leads X commentary by about 1.5 to 2 months, so recent work is scored against when the market is likely to catch up. Encoded as the `journal-recommendation` skill.
- Every post is angled on generative AI, code generation and Microsoft.
- Diagrams in posts use the site's diagram style; covers are the authorized cinematic scene images (see [images](images.md)).
- Whether the ordinary Journal discloses AI authorship is undecided; it needs Matt's decision in `discussion/spec.md`.

## How Matt can help

Matt, 2026-09-26: the closing section on every service and landing page is headed "How Matt can help." ("How Matt can help you plan." on Roadmaps & Cloud Planning, M365 Migrations and Azure Migrations), and a contact prompt reads "How can Matt help?". No surface uses "How we can help" or "How can we help?", including new pages, Journal entries and skill templates. The section anchor ids (`how-we-can-help`, `how-we-can-help-you-plan`) keep their original names so existing links and `verify-pages.mjs` keep working; renaming them is a separate change. Craft: `content-refinement` "How Matt can help" in the `mtw-diagram-tour` package and `mtw-articulation`.

## Heading full stops

Matt, 2026-09-26: page and section headings, names used as titles (service, tier, offer, skill-area and role names; footer column labels) and Journal and LLM column headings (entry titles and subheads) end with a full stop. Step and card sentences (Diagram Tour steps, Task Field steps, process, starting-point and example cards) do not. Headings ending in ? or ! keep them. Headings written in page markup carry the stop in their text. Headings rendered from data that is also used elsewhere (library and tour titles, page `<title>`, Journal entry data) get it at display time through `stop()` in `site/src/lib/heading-stop.ts`, so the data and metadata keep their own wording; it returns an empty string for a missing value, and new components that render such headings use the same helper.

Test harnesses and the image library's tour previews (`/tour-test`, `/library-tour`, `/task-field-*`, `/tactile-test`, `/design-reference`) are not held to the rule (Matt, 2026-09-26: "i am ok with the stop rule as is"). The check is `node scripts/verify-heading-stops.mjs` in `site/`: no h1 or h2 on a linked route without a stop, and every route renders; h3 step and card sentences are reviewed, not failed. Craft: `content-refinement` "Heading full stops" in the `mtw-diagram-tour` package.
