# Motion grammar: a comic page, revealed box by box

Matt, 2026-09-28: "do not use vertical animations. this should be legit comic book ... on a page with 10 boxes you just need to show each box at 10% opacity, then fade in the box and the chat dialog, and then give the human time to read and then fade in boxes, and that is a scene", later "start all boxes at min 30% opacity", "no fancy animations ... just simply fade each box out from start to end, and fade in the next scene boxes the same way".

## A scene

1. The page arrives: the dark boxes and brand-teal gutters are there; each box's content fades in to the **ghost** (`ghostOpacity`), box by box in reading order.
2. At a box's `at` beat its content comes up to full; its balloons fade in on their beats and their lettering **types on** word by word (by opacity, so glyphs never move).
3. The reader gets **time to read** before the next box: 1 s plus 0.3 s a word, in order (the checker enforces it).
4. The scene leaves: each box's content fades out, in reading order, start to end. The next scene's page arrives the same way.

## Never

Camera moves, zooms, pans, drift, vertical motion inside a scene, slides, wipes, scratches, tears, flicker overlays, grain, vignettes, glows, bounces, pops, shakes, SFX slams. The 8-bit Beat Comic owns the cheesy effects. Motion inside a box comes only from the art's own `data-fx` groups (rain, a screen's flicker, the second brain's floors), or none.

## Holds

On the song's dead stops the page simply freezes.

## The reader's control

The music leads. A click on a box jumps to it (every box before it revealed, its balloons replayed); a click anywhere else, or ArrowRight, reveals the next box; Shift+ArrowRight or a sideways swipe moves a scene; ArrowLeft goes back. `[` and `]` change issue. Reduced motion or `?reel=off`: every page complete and still, reader-paced. Out of view, the comic rests (clock and music pause).
