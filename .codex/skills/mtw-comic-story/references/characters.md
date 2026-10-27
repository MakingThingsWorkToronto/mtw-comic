# Characters: holding identity across images

How each cast member stays recognizable in every panel, and how that is checked. The cast bible, with looks, voices and roles, is in `wiki/site/comic-story.md`. The pipeline is in [art-pipeline.md](art-pipeline.md).

## How identity is held

1. **Resolve Studio's current canonical identity.** Use `characters.json` → the exact character `modelRecord` → the image manifest's `comic-ink` treatment, as the maintained Studio producer does. `scripts/art/cast_authority.py` returns the canonical ID, current name/role/signature, record, path/hash and unchanged catalog status. It rejects unknown/ambiguous aliases, missing mappings, shared identity mappings and changed bytes. Neither a newer filename nor an old group sheet replaces this choice.
2. **Attach that exact mapped image for every depicted character.** Scene prompts and interactive fix prompts use `comic_art.py prompt` or `box-prompt`; production re-resolves the current mapping at the provider boundary. A `noSheetFor` omission is allowed only for a cast entry that is not visibly declared. The visual inventory freezes each actor reference's exact `castBinding`; acceptance rechecks current identity facts, modelRecord and catalog status as well as file bytes. Missing references remain an integration gap; inspect registered/staged owner packets rather than inventing a cast member or silently omitting one.
3. **Use current canonical descriptors.** Names, roles and signatures come from the resolved row, and likeness from the exact mapped image. Never copy historical appearance lists from memory. Role, costume/colour state and artwork status are distinct: retain authored state changes without changing identity or implying Matt approval.

## Dedicated references

- **Format** is Matt's `model-matt-v1.png`: wide landscape (actual outputs 1672x941); front, three-quarter and profile full-body views across the left two-thirds; three face or expression studies on the right; plain dark navy-black background; no text, scenery or balloons; full head, hands and feet with margin.
- **Ordered inputs, one role sentence each in the prompt and in `inputs.json`:** (1) the current Studio-mapped identity image, "do not transfer other characters"; (2) the retained approved Matt format reference for layout and ink only, "do not transfer Matt identity"; (3) optionally the other character's current mapped reference, exclusion comparison only. Ruth and Joan remain visibly distinct according to their current canonical rows and exact references. A missing first-reference mapping needs the bounded canonical identity decision before production; a shared group sheet or arbitrary crop cannot silently supply it.
- **Names and roles** come from the exact `wiki/comics-library/characters.json` row, hash-bound; never from memory. Point the row's `modelRecord` at the dedicated record once registered. The exact ordered input and prompt procedure is in the imagegen skill's [built-in reference preflight](../../imagegen/references/builtin-references.md).
- **Record ids** `comic-b-model-<id>` or `comic-b-model-<id>-dedicated`; folder `records/<id>/comic-ink/v<n>/` with `submitted-prompt.txt`, `inputs.json`, `generation-start.json`, `generation.json` (`tool: image_gen.imagegen`, `model: null`, `nativeCachePath`, hashes, size), `reference-review.json`, `catalog-payload.json`.
- **Produce through Codex** as in [art-pipeline.md](art-pipeline.md#generate-retain-and-inspect); Matt reviews each reference in the Studio Images view.
- **Save into the character's reference slot** (`wiki/site/comics-library.md`, "Character reference slots"): `wiki/image-library/assets/scenes/comic-b/models/<stem>-v<N>.png`, the next unused N after the registered sheet's stem (`<id>-dedicated` for a new character). Studio's cast page shows the newest slot sheet as soon as the file lands, marked "awaiting registration" until the catalog registers it; stories and generation keep using the registered version until then. Never park a finished sheet in a transport packet while Matt waits: land it in the slot as soon as no producer is mid-run, then register it in the same session. Check the result at `/m/comics/cast/<id>` before telling Matt it is ready.

## Matt is drawn like the rest of the cast

Matt, 2026-09-28: "my face and form should fit into the other characters. don't overdo that."

- Matt is drawn with the same ink economy and level of detail as every other character, and is never more rendered, photographic or traced.
- His retained photo (`assets/originals/about/matt-raw-decoded-v1.png`) is auxiliary identity provenance only, and the prompt says so. Current mapped cast identity controls continuity; an authorized identity revision remains a separate human decision.
- For a reference-sheet edit, attach the current mapped identity and keep rendering/layout references separate. An old personal photo or unselected group sheet never replaces Studio's selection implicitly.
- The v1 sheet broke this rule: it looked like a traced photo, and the glasses came out black instead of tortoiseshell.

## The likeness check

Likeness is a human-visible review of the dedicated reference against the brief, then inspection of the real returned panels against that reference (face, hair, glasses, build, costume, proportions, and the same ink economy as the rest of the cast). Record factual observations, not a numeric score; the old 95-point likeness gate is retired, as numeric thresholds were for pages. A failing reference or sample gets one focused regeneration as a new version. Every attempt is registered in the library.

## Results

Dedicated references exist for several cast members (see the models folder); the v1 group sheets are drafts that read as modern digital illustration.
