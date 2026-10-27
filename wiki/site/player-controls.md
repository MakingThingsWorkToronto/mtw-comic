---
id: "wiki:site/player-controls"
kind: "knowledge"
title: "Shared player controls"
load_when: "Changing the comic players' transport, playhead, credit strip or equalizer, or adapting the shared progress control to a new consumer such as a Diagram Tour or Task Field."
themes: ["site", "comics", "motion", "audio"]
keywords: ["motiontoolbar", "motionprogress", "playhead", "seek", "transport", "equalizer", "credit strip", "scrub"]
routes: ["/comics/*", "/home-b", "/agentic-systems-b", "/data-migrations-b", "/traditional-systems-b"]
relations: [{"type":"depends_on","target":"wiki:site/soundtrack-library","reason":"The credit strip shows the track credit the soundtrack library owns."}]
---
# Shared player controls

The transport, playhead and credit controls shared by the illustrated Comic Story reader (`ComicStory.astro`) and the 8-bit Beat Comic (`BeatComic.astro`). Craft: the mirrored `mtw-beat-comic/references/player-controls.md`, linked by both comic skills.

## Components

- `MotionToolbar.astro` supplies transport and contact controls. Its `transport="story"`, `talkStyle="standard"`, `list={false}` variant is used by `ComicStory.astro`: Previous/Next call the comic's box navigation rather than the playlist, Pause/Play uses the story clock, Comics opens the illustrated collection, and Let's talk links to Contact in normal teal. Beat Comics retain their playlist navigation and pixel contact button.
- `MotionProgress.astro`, `site/src/styles/motion-progress.css` and `site/public/scripts/motion-progress.js` supply the same native range/playhead in both players. `MTWProgress.mount(element, { duration, seek, start, end, format })` adapts a bounded position; `update(position)` tracks playback; `destroy()` removes input listeners. Default accessible values are elapsed/total time.
- The shared control accepts a bounded position, a seek callback and a custom value formatter, so a Diagram Tour, Task Field or Matt's task list can supply its own position mapping; each new consumer still needs its own adapter and input/lifecycle review. Only the illustrated and 8-bit comics are integrated.

## Behaviour

- Both players pause during a pointer/touch scrub and restore the previous playback state on release or cancellation. Keyboard changes seek directly while preserving paused state. Range gestures stay inside the control instead of becoming a comic swipe or an entry into the page.
- The illustrated adapter uses absolute story seconds and maps them into its looped song; Beat seeking resets held endings so a backward seek can replay.
- The range uses the hand pointer (`cursor: pointer`) on desktop (Matt, 2026-10-09); native dragging and touch behaviour are unchanged.
- A box click and box transport seek to the selected box's authored reveal beat, with a one-microsecond rounding tolerance. Render, art animation, looped music, room focus and immediate effects share that destination; the previous box does not own a click made just before the boundary. Muted and paused clicks preserve their sound and playback state.
- The illustrated equalizer reads a Web Audio analyser after the master bus, covering music, rooms and synthesized effects. It settles when muted, paused, hidden or blocked.

## Illustrated strip layout (Matt approved the compact desktop credit layout, 2026-10-09)

- The progress rail sits 2.5 px below the strip's top. The row uses the measured gap beneath the comic paper to give equal visible space above and below the 3 px rail, on desktop and phone. Bottom padding inside the native range shifts its thumb to match the rail while preserving its 24 px interaction area.
- Exact `story.music.credit` and its optional source are shown in the strip. Above 700 px the credit occupies the left of a single row, vertically centred with the buttons; long credits truncate with an ellipsis; the desktop strip is 64 px high plus the bottom safe-area inset, and the transient desktop hint is hidden to give the credit that width. At 700 px and below the credit keeps its separate 44 px wrapping row within the 104 px strip.
- The strip height and artwork reservation share `--cs-strip-height` so controls never cover artwork.

## File-mode (`file://`) playback

HTTP keeps palette processing and glimmer; a file-mode canvas blocked from readback omits those two effects, and a Beat image `SecurityError` falls back to a low-resolution draw. The illustrated readers resolve artwork through a file-only art URL resolver. No browser security settings are changed. Legacy SVG fetch-based artwork is a separate file-policy limitation.

## Commands (from `site/`)

- `npx vitest run scripts/motion-progress.test.mjs scripts/player-transport.test.mjs`
- `node scripts/comic-story-audio-regression.mjs`; `node scripts/comic-story-audio-motion-regression.mjs`; `node scripts/comic-story-strip-regression.mjs`; `node scripts/comic-story-deslop.mjs`
- `node scripts/comic-story-held-seek-regression.mjs`; `node scripts/comic-story-art-url-regression.mjs`; `node scripts/beat-comic-file-canvas-regression.mjs`
- `scripts/shared-player-review.mjs` is the native Chrome runner (Home and Agentic illustrated and Beat players, desktop and phone, real touch scrubbing). It launches only inside the shared browser slot. Its reports go to `wiki/image-library/records/player-controls-<run>/` and its captures to `assets/experiments/comic-b/player-controls/<run>/`, registered through the maintained producer.
