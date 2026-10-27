---
id: "wiki:site/design"
kind: "knowledge"
title: "Design"
load_when: "Styling any site surface: colours, fonts, glass, header, spacing, components, page patterns, transitions, scroll reveal and step grid behaviour."
themes: ["design", "motion", "site"]
keywords: ["brand colours", "fonts", "glass panel", "header", "page transition", "scroll reveal", "step grid", "reduced motion", "page patterns"]
routes: ["/*"]
relations: []
---
# Design

The codex-strata sample (`C:\Code\MTWWebsite\samples\codex-strata`) is the visual baseline. Its headings and glass are kept exactly.

## Colors

From the sample's `codex-shared/base.css`:

| Token | Value | Use |
|---|---|---|
| `--ink` | `#101619` | Base body background token |
| `.strata` | `#0b1419` | Actual background of codex-strata pages (sample `site.css`); image backgrounds match this |
| `--teal` | `#1a9ba1` | Brand teal, logo accent |
| `--teal-light` | `#5fc4c9` | Accents, links, buttons, focus |
| `--paper` | `#f2f2ef` | Main text |
| `--muted` | `#b9c3c4` | Secondary text |
| `--line` | `#ffffff26` | Hairlines and borders |
| `--error` | `#ff4d4d` | Error only: form errors, denied routes in images (5.7:1 on page, 5.1:1 on glass) |
| `--success` | `#34c759` | Success only: confirmations (8.4:1 on page, 7.5:1 on glass) |

## Fonts

Matt approved the headings as rendered on the Design Reference page (2026-09-15).


| Role | Font |
|---|---|
| Display and headings | Barlow Condensed (self-hosted in the sample), weight 600 |
| Body | Open Sans, 16px / 1.65 |

The retained pre-rebuild site observation used Open Sans with PT Sans; the current review site uses the self-hosted Barlow Condensed/Open Sans faces below.

Files (`site/public/fonts/`, declared in `site/src/styles/fonts.css`): WOFF2 only, one file per face: `barlow-condensed-500.woff2`, `barlow-condensed-600.woff2`, `barlow-condensed-700.woff2`, `open-sans-400.woff2`, `open-sans-600.woff2`, about 101 KB in total (the full TTFs were 499 KB, 276 KB gzipped). OFL licences sit beside them.

- Subset ranges: U+0020-007E, U+00A0-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F (dashes, curly quotes, ellipsis), U+20A0-20CF (currency), U+2122, U+2190-21FF, U+2212, U+2215, U+2713-2714, U+FEFF, U+FFFD. A codepoint is kept only where the original font has a glyph for it. All OpenType layout features (kerning, ligatures) and TrueType hinting are kept, so text renders the same as the TTFs did.
- Regenerate with `python scripts/fonts/subset.py` from `site/` (needs `pip install fonttools brotli`). It reads the full TTFs in `site/scripts/fonts/source/` and fails if any character used in `src/`, `public/scripts/` or a built `dist*/client` would be dropped.
- The fonts have no ↓ (U+2193); the scroll cue arrow uses the browser's fallback font.
- Deploy builds preload Barlow Condensed 600 and Open Sans 400 (`BaseLayout.astro`). File-mode builds skip the preloads, because Chrome blocks `crossorigin` font preloads from `file://`.

## Interaction

- Matt values that Diagram Tours become automatic immersive experiences as the reader scrolls ("really really cool"). Keep that quality: the page expands into a full-window story without the reader doing anything but scrolling.

- Buttons are approved as rendered on the Design Reference page (2026-09-15).
- Tactile patterns (from `site/research/tactile-ui.md`): Press (scale 0.97 in 80 ms), Settle (spring, stiffness 1400, damping 0.9), Lift (mouse hover, 1px), Link, Toggle Snap, Open, Select Tick, Step Tick, Field Focus. Pure CSS springs plus about 4 KB of classic script, synthesized Web Audio piano notes (Matt's request): three slightly inharmonic sine harmonics, 4 ms attack, about 380 ms decay, a closing low-pass and a soft hammer transient. Press plays C5, Toggle on a rising C5 to E5, Toggle off falling, Tick a quieter G5; release and settle are silent; at most one sound per 60 ms through one shared AudioContext, `navigator.vibrate` only where supported (Android Chrome). Sound is off by default; it never plays on load, hover, focus, scroll or typing. Reduced motion turns presses into an instant opacity dim.
- The Sound Toggle (a Site Header part, before Let's talk) is the site's one sound setting: tactile sounds, haptics and Beat Comic music (Matt, 2026-09-27: "link scene audio to button click audio"). Press sounds are off until the visitor turns sound on, or until a Beat Comic's music becomes audible (the first click or tap on a page that has one), which turns it on; the choice is remembered. While a browser holds the music back, the toggle shows off.
- Immersive components (Diagram Tour, Task Field) share one expand language: they grow from the page column to the full window, and back. Launched components (Diagram Aside) pop out from their own box to the full window and shrink back on close.
- Page weight: pages must stay fast. Most diagrams are Diagram Asides with deferred player activation; their inert SVG/templates still contribute to initial HTML. Only important tours run inline. Root chooses the presentation for each section.
- Unresolved Diagram Tour choices: emphasis as a ring, thicker shape stroke or backing plate, and aside thumbnail padding of 16px or 24px. The Options reference holds the comparison; its historical numbers are not current-build measurements.
- Category cues are solid, edge-to-edge colour fills only. No patterns or shapes to memorise (Matt: humans read colour faster than pattern). Accessibility comes from emphasis tied to the text, which separates in greyscale.
- Placeholder figures never use a currency symbol; express costs as shares or indices.
- Step glass in immersive components is vertically centred on the midpoint between the heading overlay's bottom and the viewport bottom, and grows equally up and down with its text (bottom anchoring looked lopsided): left page margin in the Task Field, right page margin in the Diagram Tour.
- Section Heading Overlay placement: top left in the Task Field for the whole section; top right in the Diagram Tour, only once expanded.
- Alignment: every section uses the centered 1440px frame and inner gutters defined under Spacing. Journal List, title, lede and byline start at its left content edge; article body measure is 720px. The header shares the page edges at rest and expands to 24px (16px on narrow screens) while a Diagram Tour or Task Field fills the window.
- Every interactive element gets tactile design: subtle physics-based motion (press, settle, snap), subtle press sounds, and haptic feedback on supported touch devices. It respects reduced motion, never delays an action, and sound has an on/off preference.

Parallax scenes: every scene, including the homepage, uses image parallax driven by native scrolling; no 3D models or 3D diagrams. Team Modernization's scene begins with the selected `#story` content and the task transformation; its shared heading and description slot changes by opacity (old copy reaches zero before new copy appears), never by vertical travel, and recognizable tasks stay visible as their allocation changes. Craft: the `mtw-parallax` skill.

## Page transitions

Matt's reference is https://labs.chaingpt.org/portfolio. The current transition uses the same small grid as Grid Background: rounded clamp(18, viewport width / 58, 28) pitch, fixed squares at 76% of that pitch, the same seeded occupancy and brand colours. One canvas and a five-cell paint atlas provide individual opacity fades with 60ms randomized variation inside each row. An opaque page-colour backing covers the gaps between squares.

The downward wave covers the source before native navigation at 660ms or later, including a rendering opportunity after full coverage. The destination paints its cover from a classic head script, adopts the same canvas after parsing, waits for stylesheet readiness and two rendering opportunities, then fades upward. Main, header, footer and immersive ancestors remain stationary. Cold loads, reduced motion and excluded links retain ordinary navigation. No animation library is used.

Where the browser exposes a matching active Navigation API signal, the source keeps its painted cover and refreshes the destination marker during a slow request, up to 15 seconds. Abort or prevented navigation releases it. Unsupported browsers use the bounded 2540ms recovery and preserve a fresh marker for late arrival. Continuous coverage is not promised after these usability fallback bounds.

The later scrollbar-offset correction derives the transition lattice from the viewport rather than body scrollbar width and keeps the same painted canvas through adoption. The named transition release receipt (archived: `C:/MTW-archive/site-verification-20261011/site/verification/deploy-content-transition-2026-09-17/README.md`) records matching sampled origin, bitmap, size and pitch through desktop/phone document changes, plus a local grid-rounding-boundary check. This repaired runtime is retained in the current release; asynchronous samples do not prove uninterrupted no-flash behavior.

The paired `mtw-page-transition` skill owns checks. Evidence (archived 2026-10-11 under `C:/MTW-archive/site-verification-20261011/`) was in `site/verification/content-completion-2026-09-17/transition-grid/` and `transition-slow-native/`: actual phone/desktop cover and upward reveal, plus delayed arrival. Capture gaps prevent a continuous no-flash claim. A page-target Escape attempt did not demonstrate browser Stop; native cancellation, file-browser and reduced-motion profiles remain unperformed. Older row-canvas and large-pixel receipts are historical implementations.

Linked-page prefetch is included by the shared HTML head (Matt, 2026-09-17). After the current document loads, `public/scripts/page-prefetch.js` adds low-priority `rel="prefetch"` head hints for unique internal HTML page links. It excludes query-bearing URLs, downloads, external links, current-page anchors, APIs, library-tour routes and hidden/inert content; `data-prefetch="false"` opts a link out. It makes no requests under `file://`, offline, Save-Data or 2G, and unsupported browsers keep ordinary navigation. Prefetch hints target HTML documents; aside templates and SVG may already be part of that HTML. Player activation remains deferred. The browser controls hint execution and cache reuse; no measured speed gain is claimed. The mechanism follows [HTML prefetch semantics](https://html.spec.whatwg.org/multipage/links.html#link-type-prefetch).

Runtime constants (`site/public/scripts/site.js` transition module): seed `20260915`; 27% cell occupancy; Grid Background palette alphas teal .16/.34, muted .07, teal-light .46, lines .05, with an opaque `#0b1419` backing per full-pitch cell; cover down is a 180 ms cell fade over a 360 ms top-to-bottom row progression with 0 to 60 ms seeded within-row scatter; reveal up is 260 ms over 460 ms bottom to top; the source is opaque by 600 ms; navigation fires at or after 660 ms and 32 ms after a fully painted frame; the reveal completes by 780 ms; cleanup at 890 ms; the runtime stays under 12,288 raw bytes.

## Scroll reveal

- On Home, Agentic Systems, Traditional Systems, Data & Migrations, About Matt, the Journal index and Roadmaps & Cloud Planning (2026-09-26, with its Step Grid; service pages follow in the Step Grid rollout). Matt approved the homepage look on 2026-09-26 ("i love them"); the other pages are awaiting his validation.
- Craft, markup contract, timing model and failure history: the `mtw-scroll-reveal` skill (both editions). Code: `site/src/components/ScrollReveal.astro`, `site/public/scripts/reveal.js`, `site/src/styles/reveal.css`. Check: `site/scripts/verify-reveal.mjs`.
- Behaviour as built: headings type in (inline characters, so no shift when the original markup returns); panels and boxes fade, rise and sharpen in DOM order, left to right, each only once its whole resting box is in view (half the window for a box taller than 90% of it); above the fold plays on load one section at a time; nothing plays until the page transition's upward reveal has finished; anchors and restored scroll start what is on screen at once; reduced motion shows everything with no drift. Text stays in the static HTML. One typing cursor on the page: headings type strictly in turn and the cursor rests on each, then moves to the next (Matt, 2026-09-26). Devices that cannot hold the frame rate switch themselves to lite (no blur, same fade, rise, typing and drift) for the session; capable phones such as the iPhone 12 are meant to keep the full effect.
- The About Matt portrait and the Journal index hero artwork stay static (LCP backgrounds); their titles, ledes and actions reveal.
- Checked (2026-09-26): `verify-reveal.mjs` passes on all six routes at 1440x900 and 390x844 (no reveal before its box is wholly in view, nothing left hidden, no leftover characters, no sideways scroll, no script errors, every desktop section anchor starts within 1.5s); per-line heading edges typed against restored within 0.25px on four pages; transition into Home (visible Chrome) and into the Journal (headless) starts typing only after the tiles clear; reduced motion leaves nothing armed or hidden on Home, About Matt and the Journal. Frames were inspected on every page. Checked (2026-09-26, cursor and lite): `verify-reveal.mjs` passes on all six routes at both sizes with at most one visible cursor on every frame, including every desktop anchor load; a forced-lite phone pass shows no blur; a 6x CPU-throttled phone pass chose lite. Not checked: an actual iPhone 12 (the lite threshold is untested on real hardware), physical touch devices, screen readers, the LCP effect of the typed hero heading, the landing pages, About Matt and Journal in visible Chrome.
- Matt on the single cursor, phone capability and heading full stops (2026-09-26): "it looks great".
- Committed in `c089910c` (not deployed). Lite thresholds: after 1.5s of animated frames, more than 30% of frames slower than 28ms switches to `html[data-reveal-lite]` for the session (`sessionStorage` key `mtw-reveal-lite`); `deviceMemory` of 2GB or less starts lite. How each check is run and read, including how to rule out another session's dev-server reloads: the skill's `references/verification.md`.

Timing model (`site/public/scripts/reveal.js`): 34 ms per character, 520 ms minimum and 1150 ms maximum per heading; 420 ms settle; one page-wide caret that fades over 360 ms when no heading follows within 1.32 s; headings type strictly in turn with a 450 ms gap; boxes start at 45% of the heading's typing time, step 130 ms, animate opacity over 0.9 s with a 34 px rise (24 px on phones), scale 0.975 and 10 px blur (6 px on phones); the next group starts 350 ms after the previous group's last box; parallax drift is up to 48 px (22 px on phones) scaled by depth.

## Step Grid

- A section of glass boxes shown one row at a time (Matt, 2026-09-26, built generic for reuse). First used for Plan the Path on Roadmaps & Cloud Planning: four rows of two panel cards (the last is Training and Client Handover). Code: `site/src/components/StepGrid.astro` (rows are children marked `data-step-row`, the section heading goes in the `head` slot), `site/public/scripts/step-grid.js`, `site/src/styles/step-grid.css`. Check: `site/scripts/verify-step-grid.mjs --routes <route>`.
- Pinned layout, when motion is allowed, the window is wider than 850px and the tallest row fits under the heading: the heading locks under the header and one row fills the space below it, over a window-wide Grid Background that fades in over the last half window of scroll before the grid and out over the half window after it (reversed exactly going back up). Steps use the Diagram Tour's input model and values (one Arrow Down/Up, Page Down/Up or Space, one wheel or trackpad gesture, one swipe; input during a change is swallowed; the page scroll snaps to that row's stop; past the first or last row native scroll leaves). The outgoing row fades out left to right; then the next row arrives in the scroll reveal's pose and curves: the left box, its contents one after another (figure, heading, text, links, tour, Summary), then the right box 300ms later. A box further along the row travels further (parallax depth). Going back reverses the travel (rows drop in from above and leave downward); the left box still arrives first (Matt). A scrollable box inside the grid (the Summary overlay) keeps wheel and swipe gestures while it can still scroll. The grid measures again as it approaches, since an early measurement before fonts settle had left it static in a 1664x919 window. A fragment link to a box shows that box's row. Rows that do not fit get shorter diagram thumbnails at full text width (whole diagram, not below 180px tall); if still too tall, the grid stays static.
- Static layout (no script, reduced motion, phones, or rows that cannot fit, such as 1280x720): rows stack as one grid with the panel grid's 32px gap and no Grid Background. All text is static HTML either way.
- Figure-first panel card (`panel-card--figure-first`, used in the Step Grid): the diagram heads the card at full text width; at the card foot come the card's links, then "Take the tour" (`DiagramAside ctaPlacement="after"`; the default keeps it under the thumbnail), then Summary, which opens as an overlay over the card above the Summary row, with the teal thin scrollbar.
- Craft and conversion recipe: the `mtw-step-grid` skill (both editions). Service pages carry the Step Grid together with the scroll reveal (Matt, 2026-09-26: iterate every section page's side-by-side grid).
- Rollout (2026-09-26): all 14 service pages carry the Step Grid and the scroll reveal. Agentic Systems: Second Brain (grid `second-brain-panels` under the heading "Your second brain, explained.", Matt 2026-09-26; its cards keep h2 headings for the agent-content extractor), Team Modernization (Redesign the Work), Cost Planning, DevOps & Scaling, Agent-Ready Websites. Traditional Systems: Roadmaps & Cloud Planning, Roles & Access Control, Information Governance & AI Readiness (two grids), Intranet & Collaboration, Power Platform & Logic Apps, Custom Software Development. Data & Migrations: M365 Migrations (Plan What Moves), Azure Migrations, Migration Planning (Plan the Move). Card copy was cut to about one paragraph (merged word for word where it already fit). Not converted: single-row pairs (M365 Cut Over and Prove It, Migration Planning Time and Cost, the landing pages' What to Know panels), because a Step Grid needs two rows; they carry the scroll reveal. `second-brain-b` belongs to the Diagram Tour A/B/C experiment. Pinned spacing was tightened (24px pin padding and heading gap) after a 2px overflow left most grids static at 1440x900; thumbnails may shrink to 180px. On windows too short for a row (such as 1280x720) the grid stays static (Matt approved, 2026-09-26).
- Checked (2026-09-26): `verify-step-grid.mjs` passes on all 14 pages; every grid pins at 1440x900 and is static at 1280x720, 390x844 and with reduced motion. First-row frames of every page inspected. `verify-reveal.mjs` passes on all 14 pages at 1440x900 and 390x844, plus forced-lite and CPU-throttled phone runs on the first page of each batch (Roadmaps, Roles & Access, M365 Migrations, Second Brain). Not checked: visible Chrome on every page, touch devices, screen readers.

## Spacing

- Ordinary section content is separated by `--section-gap`: 80px on desktop, 72px at 850px and below, split evenly as section padding. Matt requested tighter desktop spacing; the 80px preview remains under review. Shared tokens in `base.css` also define opening clearance (150/120px), final clearance (80/56px), section heading gap (40/32px), article subsection gap (64/48px), and page title gap (50/32px). `pages.css` owns page boundaries; components supply only their internal gaps.
- Visible breadcrumb navigation is removed from every page and template. BreadcrumbList structured data remains. Nested hero titles, the last panel/list item and cleared figures add no trailing section margin; captionless figures reserve no caption space.
- The paired `mtw-parallax` (`references/section-spacing.md`) and `ai-slop-check` skills contain the spacing rubric. `verify-section-spacing.mjs` checks source/build coverage and saved all-route measurements; `measureSectionSpacing` checks content envelopes as well as section boxes. Visual review and native scrolling are recorded separately from measurement passes.

- The main Design Reference's centered 1440px maximum page frame is authoritative across all pages (Matt, 2026-09-17). Inner gutters are 5vw, changing to 25px at 850px and below. Header, footer and ordinary section content share the resulting edges. Immersive stages expand to the viewport, then return to this frame.
- Hero banner artwork spans the full window width; the centered frame applies to its text and glass (Matt, 2026-09-17).
- Every section's outer surface and background fills the window width, with the centered content frame inside it. Immersive expansion uses the full browser width and height (Matt, 2026-09-17).

- The codex-strata samples do **not** use an 8px grid: their common values are 20, 12, 25, 14, 10, 24, 18, 30, 15, 22, 13, 17. Renumbering to an 8px scale would diverge from the baseline the spec says to copy.
- Instead, every hard px spacing value in `src/styles/*.css` must be a multiple of 4 or be registered against the sample rule it came from (`verify-layouts-sections.mjs` spacing registry, about 60 entries). New off-grid values fail the check until snapped or recorded.
- Named components have equal top/bottom and left/right inner padding, except two recorded cases (Live Demo Invitation band, Journal card body under its cover).
- The site footer shares the centered page frame's content edges. Ordinary glass headings start at the panel's top padding and align with its body text; article heading spacing is scoped to the article rather than nested cards.

## Glass

Matt approved the Glass Panel's look and asked for slightly more Apple-like translucency, with any added transparency kept minor. Headings inside glass panels use the two-colour treatment (second phrase in teal).


Sample `.glass`: background `#112126bf`, 1px border `#b4d5d52c`, shadow `0 25px 65px #0005`, `backdrop-filter: blur(22px)`, radius 12px.

Site glass (after Matt's translucency request): background `#112126b3` (0.70 tint), `blur(22px) saturate(150%)`, and a faint inset top highlight. Blur size is an open question in the spec.

## Header

- **Full-window presentation alignment:** The shared header follows every full-window presentation (Matt, 2026-10-09): comics align logo/navigation to the measured left/right canvas margins; Task Field and Diagram Tour expansion comes from each actual component’s progress. Continuous scroll/fold progress has no extra CSS smoothing; discrete entry/close animates with the presentation. Reduced motion keeps final alignment without animation. Launched presentations contain the actual shared header and existing Close control within the modal, restore the same header on close, and preserve Escape/focus return. Verify desktop/phone, activation, resize, exit and reduced motion through the common runtime; never implement a separate per-story/model header.
- Layout and size follow `body > header` in `C:\Code\MTWWebsite\samples\work-field-v1\index.html`.
- Look follows the Codex glass.
- Links are the navigation in [structure.md](structure.md).

## Components

Component names are shared vocabulary between Matt and agents. The Design Reference page in `site/` shows each component with its name.

Annotations on the Design Reference page (component names and notes) are an overlay layer of chat-bubble notes in Matt's teal and black, visually distinct from the site, with a show/hide toggle. They must never look like site UI or like AI-generated scaffolding (for example monospace `— Label` tags or leader-line callouts). Bubble look: black fill, 2px `#5fc4c9` border, teal text, a tail pointing at the component. Every Components table row must have a bubble on the main Design Reference page (`check:file` enforces it).

Design Reference pages: the main components page, plus Above the fold, Sections and States sub-pages. A temporary Demo Nav links them with the component test pages (Diagram Tour, Task Field, tactile) for Matt's review: a quiet "Demo pages" button bottom right that opens a list, rendered by `BaseLayout.astro` only on `/design-reference*` and `*-test/` paths (`src/components/DemoNav.astro`, `src/styles/demo-nav.css`); it is removed before launch.

Matt approved as rendered (2026-09-15): headings, buttons, Glass Panel look, the Grid Background, and the rest of the Sections page apart from the items under review. The grid now sits behind the homepage hero and behind the cinematic hero figures on section and service pages; About Matt and Journal heroes use full-width photographs (2026-09-25). Root has now inspected 32 painted opening views across those 16 routes at desktop and phone sizes. Thirteen replacement captures supersede blank or unsettled originals; the manifest retains that distinction. This is opening-layout review, not complete page playback or approval. Existing grid rules now live in grid-background.css, imported by GridBackground and components.css, avoiding the whole-component stylesheet import that altered secondary-button styling. Quiet figure regions protect diagram labels/routes; no artwork changes are implied.
Matt rejected: a Service Page Hero that leads straight into a full-width tour.

| Component | What it is |
|---|---|
| Site Header | Fixed top bar: Brand Mark, Nav Menu, Services mega menu, Contact Button and Sound Toggle. The Image Style Switcher is retired (2026-09-24); the site always shows SVG Flat |
| Hero Heading | Large two-tone display heading (second phrase in teal); shared class `.hero-heading` in `src/styles/components.css`; 90px at 851–1100px and 65px at 850px and below, as in the sample |
| Page Title | Page `h1` with its Lede paragraph |
| Section Heading (image section) | Section `h2` over imagery: 82px (74px on short windows, 66px at 851–1100px, 65px at 850px and below), from the sample's `.department-heading h2` |
| Section Heading (text page) | Plain page `h2`: `clamp(44px, 5vw, 76px)` (72px at 1440px) |
| Body Text | Open Sans reading text |
| Glass Panel | Translucent panel for text over imagery; section size `.glass`, large size `.glass-panel-large` (shared, with the sample's responsive overrides) |
| Primary Button / Text Link | Calls to action |
| Secondary Button | Outline button beside a Primary Button for the second choice (for example a demo beside a call); shared `.button.button--secondary` in `src/styles/components.css`, with the header Contact Button's outline, hover and press fill. Pending Matt's confirmation |
| Service Dock | Row of glass link tiles (Service Tile: title, one line, arrow) for the three service groups along the foot of the homepage hero; shared `.service-dock` and `.service-tile`, four across with `.service-dock--four` |
| Journal Card | A Journal post as a large card: a fixed-height cinematic cover band on top, then date, title (three lines reserved), summary (two lines reserved) and Text Link at identical offsets; every card starts at the same top edge (Matt dropped the sample's 180px stagger on 2026-09-15: "the top alignment of journal rollup view is still not top aligned"); cards stack on phones. A title longer than three lines is clamped with an ellipsis, and titles are written to fit (see [content](content.md)). Shared `.journal-card` in a `.journal-list` |
| Placeholder | Quiet box for an image or widget that does not exist yet: dashed outline, flat faint fill, small monospace label, no stripes; shared `.placeholder` |
| Diagram Tour | Text on the right, diagram on the left; scrolling pans and zooms the diagram to each step, follows the arrows, and ends on the full picture. Step text stays in place and fades: title first (heading style), then paragraph by paragraph. Matt: "amazing" Step navigation is a centred row of translucent gallery-style dots inside the tour's viewport (no numbers). The stage animates from the page margins to the full window as the tour pins, and back as it leaves; the text panel keeps the page's side gutter at every width. |
| Task Field | Anthropic-inspired field of task tiles that regroups as the reader scrolls; flat design in brand colors Glass panel titles use the heading style; tiles are vertically centred. The story structure follows the Anthropic article's steps, and models from different industries can be swapped in through data. Anthropic's source story has 10 steps (field, a day in the life, jobs change, only humans, augmented, automated, new tasks, the job changes, millions of times, tasks to economy); models are one fixed step set plus a data object per role (schema: `site/src/data/task-fields/SCHEMA.md`). |
| Contact Form | Let's talk form: validated native submission, honeypot, WebMCP prefill attributes and a shared readiness gate; the visitor always clicks Send. Vercel protection runs at the edge. Missing readiness leaves Send disabled with email fallback. Shared field states include disabled, success/error feedback and Sending…; final visual acceptance remains separate. |
| Grid Background | Shared decorative flat tile field in teal, grey and black. Behind the homepage hero, behind the cinematic hero figures on section and service pages, in the teal bands, and behind launched/inline Diagram Tours. About Matt and Journal heroes use full-width photographs instead (2026-09-25). The component imports its narrow grid-background.css. |
| Diagram Aside | A diagram presented as a figure beside page content. Clicking it (or a card marked as a tour) launches the tour in place: the figure pops out and expands to the full window, the tour runs there, and closing shrinks it back. Player activation is deferred; static text and inert SVG/templates already contribute to the page HTML. The default way to show diagrams on pages, and the only way in the Journal |
| Image Card Set | A row of cinematic image cards, one per option (Second Brain section 06: Small Business, Medium Business, Enterprise): photograph, heading, text and two link rows. The card and the top row navigate to that option's page (arrow); the bottom row expands the option's Diagram Tour in place (corner marks). The two are never on the same target. Both rows use descriptive link text carrying the target's keywords ("Second brain for a small business", "See how a small business second brain works"), never generic wording such as "Read more" (see [discoverability](discoverability.md)) |
| Diagram Card Set | The same row presented as diagrams: each card is a Diagram Aside, so clicking a card expands that option's Diagram Tour in place and closing shrinks it back. Used when the row leads into the diagrams rather than into pages |
| Marks Strip | Design Reference specimen: heading, action glass panel and stacked glass planes of monochrome product marks. About Matt replaced it (2026-09-25) with six Platforms glass panels of chips (mark plus name, or name only). |
| Source Marks | `src/components/SourceMarks.astro` over `src/data/migration-sources.ts`: glass tiles of migration source systems with vendor marks; compact on the Data & Migrations landing, with detail (and the agent-content attributes) on M365 Migrations. |
| Section Heading Overlay | The section's heading kept on screen over an immersive component: top left in the Task Field for the whole section, top right in the Diagram Tour once expanded |
| Page Transition | Full-window MTW grid: randomized downward opacity cover and upward reveal around native navigation. Codified as the `mtw-page-transition` skill |
| Page Rail | Temporary bottom-centre rail linking the demo and test pages, in `DemoNav.astro`; removed before launch |
| Site Footer | Footer links and details |

## Images

**Public diagrams adopt Site Glass through their pinned primary tours; unconverted diagrams retain SVG Flat ([images](images.md#selected-public-style)). SVG Flat's rules:** square borderless 2D containers, shared filled icons, restrained shafts and compact filled arrowheads. Align labels and connections to actual visible geometry. Outline and raster candidates remain comparison material. Image rules, scene exceptions and current state are in [images.md](images.md); measured alignment and contrast are in [image-quality.md](image-quality.md). Depth comes from layered image parallax; no 3D.

Both Journal indexes now reuse the existing cinematic second-brain desk artwork through JournalIndexHero, with responsive eager image sources and a restrained contrast overlay. Root inspected both at 1280 by 800 and 390 by 844 in Chrome; existing article covers are unchanged. Evidence: `site/verification/content-completion-2026-09-17/journal-index-heroes/`.

Section balance (Matt, 2026-09-24) is judged per section across the full width, not by a site-wide rule; Matt's per-page direction is recorded as dated decisions in the spec (the completed 24–25 September change lists in `discussion/layout-changes/` were retired on 2026-09-25). Treatments in `sections.css`: Brain Grid (`brain-grid`/`brain-card`, sections as a 2×2 of glass panels with the diagram below the text), Deliverables Row, Related Row (no arrow icons), Teal Section (`page-section--teal`, a new closing-section style: token-derived teal ground with light glass) and a cinematic hero figure (`page-art__image--cinematic`, source kind `service-hero`). Second Brain uses all of them and hides diagram figcaptions. Evidence: `site/verification/section-balance-2026-09-24/`.

Section headings are never width-constrained (Matt, 2026-09-24, site-wide): `.section-head` spans the column and prose `h2` has no 720px cap; paragraphs keep their reading measure. The Service Dock uses equal columns. The homepage closes with the Let's Talk CTA Band.

No top rule lines on boxes, cards, list items or captions anywhere on the site (Matt, 2026-09-24); page chrome and the header menu divider are not boxes. Service pages carry Related services in the footer (`SiteFooter related`, built from `src/config/services.ts`), not as a content panel. Live Demo Invitation stacks its buttons in a 2fr column beside 3fr text. Glass corners use `--glass-radius` (4px, the Service Tile's corner) site-wide since the 2026-09-24 consistency pass; the sample's 12px is retired.

The header Image Style toggle is retired (Matt, 2026-09-24): the site shows each diagram's pinned treatment (Site Glass where converted, SVG Flat otherwise) and clears any choice the old toggle saved. The image library keeps its own four-treatment comparison. The toggle-behaviour sections of `verify-file-review.mjs`, `verify-images.mjs` and `verify-layouts-sections.mjs` still drive `[data-image-style-select]` and must be updated before those verifiers are next run; `verify-diagram-tour.mjs` already tolerates its absence.

Services mega menu (Matt, 2026-09-24): the header Services control opens a full-width opaque panel under the header on desktop with one column per section, built from `src/config/services.ts`: a two-colour heading linking to the overview, and every service link. The section images were removed (Matt, 2026-09-25). Every catalog service has its own page (the temporary `planned` flag is gone). On mobile the sections are collapsible groups inside the menu. Escape and outside clicks close it.

## Page patterns as of 2026-09-25

- **Section overview pattern** (Agentic Systems, Traditional Systems, Data & Migrations): cinematic hero figure (`page-hero-grid--large-art`, `service-hero` source kind), service image cards with photographs (`overview-cards` source kind), What to Know First glass panels, How Matt Can Help in the Work With layout. Data & Migrations also carries Sources Migrated and two researched question groups.
- **Service page pattern** (every service page): cinematic non-brain hero in the brain's translucent style; panel grids (`panel-grid` 2×2 plus `panel-card--wide`/`--split`) with the diagram as a Diagram Aside below the text and one link below it; `page-body--quiet-captions` hides aside captions; a teal band (`page-section--teal teal-band`) holding How Matt Can Help (drafted offers) and What You Receive; Work With Us last. Pages without their own hero image fall back to their section's image (`findSourceImage` in a try/catch).
- **About Matt**: the hero background is Matt's portrait scene (`portrait` source kind, `matt-scene.png`, About Matt only), starting below the header so the head is never cropped, with an --ink gradient behind the title; styles live in `src/styles/about.css` (moved out of the page's scoped `<style>`, which the dev server kept serving stale).
- **Technology marks**: a mark shown on the site must be that product's own drawing. Products without a real mark show their name only. `site/scripts/technology-marks.test.mjs` fails on two marks sharing geometry, on a Microsoft four-square stand-in, or on an unlabelled mark. The library's stand-ins are preserved under `technology-marks/rejected/`.
- **Raster URLs are versioned**: `rasterFile` in `src/lib/images.ts` appends `?v=<source hash>` to every generated image URL, so a replaced source reaches browsers and CDNs immediately.

