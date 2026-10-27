---
id: comics-box-fixes
purpose: Common-issue presets for one comic box. Studio lists them as chips in the box feedback pop-up (all scopes) and in the Fix art dialog (scope art only); the comics-box-feedback and comics-fix-box-art procedures receive the chosen ids and look up each instruction here.
presets:
  - id: low-quality
    scope: art
    label: "Low quality image"
    instruction: "Regenerate the box art at full master resolution with crisp cartoon ink and flat colour: no soft focus, smearing, compression artifacts, melted hands or garbled small detail at desktop or phone crop size."
  - id: doesnt-fit
    scope: art
    label: "Image doesn't fit box"
    instruction: "Bind the actual selected source and responsive crop so this box fills its desktop and phone aspect without empty bands while every required face, action and evidence object stays readable; repair source/crop metadata before considering new art and check all selected cuts and layer states."
  - id: rewrite-speech
    scope: speech
    label: "Rewrite all speech"
    instruction: "Rewrite every balloon in this box with mtw-articulation and the comic skill's lettering rules: say what this box adds to the story, in the speaker's voice, sentence case, Canadian spelling, about 12 words a balloon; keep kinds, speakers and placement unless they are wrong."
  - id: agent-projection
    scope: art
    label: "Agent not in projection format"
    instruction: "Redraw every digital agent in the box in the cast's accepted projection format (translucent projected light with its cast colour and silhouette, cast from its source device), never as a solid human, robot or flat sticker; humans stay solid."
  - id: more-sfx
    scope: sound
    label: "Add more sound effects and improve score"
    instruction: "Inspect this box's audible actions, use fitting existing effects at the actual event clock, match its own room tone and score to the dramatic beat, retain intentional quiet, and listen to the delivered mix rather than treating cue declarations as proof."
  - id: comic-format
    scope: art
    label: "Image not in correct comic format"
    instruction: "Redraw in the approved Comic B format: cartoon ink line and flat colour on the accepted cast models, panel-composed for lettering space, with no photographic, 3D, painterly or glossy rendering."
  - id: lacks-motion
    scope: motion
    label: "Slide lacks motion and animation"
    instruction: "Show a purposeful depicted action through exact source-bound moving planes or useful ordered views, with visible full-colour agent transmission where applicable, fixed humans/lettering/evidence, and deterministic pause/seek/replay/reduced motion; a fade, whole-box drift or declared preset alone does not pass."
  - id: laptop-ui-wrong-side
    scope: art
    label: "Laptop UI on wrong side of screen"
    instruction: "Put the laptop's UI on the inner glass that faces its user; when the camera sees the lid from behind, the lid back is plain casing with no UI, and the UI is shown only from the user's side."
  - id: monitor-wrong-side
    scope: art
    label: "Monitor graphic on wrong side of screen"
    instruction: "Put the monitor's graphic on the front glass facing the person using it; from behind, the monitor shows only its plain back and stand."
  - id: phone-wrong-side
    scope: art
    label: "Phone graphic on wrong side of screen"
    instruction: "Put the phone's graphic on the screen side facing its holder; the camera side shows only the plain back and camera bump, never the UI."
  - id: laptop-missing-ui
    scope: art
    label: "Laptop missing UI on screen"
    instruction: "Draw the UI the story says the laptop shows (simple shapes, a few readable words at most) on the screen facing its user; never leave a story-relevant screen blank or dark."
  - id: monitor-missing-ui
    scope: art
    label: "Monitor missing UI on screen"
    instruction: "Draw the graphic the story says the monitor shows on the front glass facing its user; never leave a story-relevant monitor blank or dark."
  - id: phone-missing-graphic
    scope: art
    label: "Phone missing graphic"
    instruction: "Draw the graphic the story says the phone shows (call, message, chart) on the screen side facing its holder, readable for that person; never leave a story-relevant phone screen blank."
  - id: paper-wrong-side
    scope: art
    label: "Paper has graphic on wrong side of sheet"
    instruction: "Put the printed text or graph on the face of the sheet turned toward its reader; the side facing away is blank paper, and nothing is mirrored or reads through."
  - id: paper-missing-graphics
    scope: art
    label: "Paper missing graphics"
    instruction: "Draw the evidence the story says the paper carries (lines of text, a table or a graph) on the face toward its reader; never leave a story-relevant sheet blank."
  - id: wrong-side
    scope: art
    label: "Graphic on wrong side of screen or paper"
    instruction: "Move the graph, text or UI onto the face its user or reader can actually see: a device's glass must face its operator and a paper's information face must face its reader, never on a back or edge."
  - id: two-step
    scope: art
    label: "Convert to a 2-step graphic box"
    instruction: "Convert this box into two ordered images in the same box: first the person reading or reacting with the device or paper seen from the rear (plain casing, content unseen), then an operator-perspective view whose glass or paper face carries the evidence."
  - id: faces-away
    scope: art
    label: "Device faces away from its user"
    instruction: "Redraw so the phone, laptop or monitor screen faces the person using it, with eyeline and hands matching, and a plain back toward the camera when the camera is behind it."
  - id: wrong-reading-side
    scope: art
    label: "Text or graph readable from the wrong side"
    instruction: "Make every word, number and graph on paper or screens read correctly for the depicted person (not mirrored, rotated or upside down), placed inside the physical front face with a margin."
  - id: off-model
    scope: art
    label: "Character off-model"
    instruction: "Restore each character to the accepted cast reference: silhouette, costume, colours and digital-agent projection, with solid humans and no change to the authored colour states."
  - id: hands-props
    scope: art
    label: "Hands or props wrong"
    instruction: "Correct hands and props so each hand has a clear owner and action, no duplicate or unlisted devices appear, and the evidence object is the one the story names."
  - id: crop-cuts
    scope: art
    label: "Crop cuts the subject"
    instruction: "Make the subject sit fully inside this box's region on desktop and phone crops; if the recorded region is wrong rather than the drawing, correct the box's region instead of redrawing."
  - id: cluttered
    scope: art
    label: "Too cluttered or AI slop"
    instruction: "Simplify the box to the story action: remove stray objects, extra figures, garbled text and photographic or 3D rendering, keeping cartoon ink and flat colour."
  - id: missing-pointer
    scope: speech
    label: "Speech pointer missing"
    instruction: "Preserve the approved words and cast while making each visible on-panel speech pointer extend outside its balloon toward its speaker's actual source mouth; protect all faces, allow intentional joined-balloon chains, and reflow the box when no face-safe pointer space exists."
  - id: wrong-speaker-pointer
    scope: speech
    label: "Speech points at wrong person"
    instruction: "Bind each speech pointer to the written speaker's normalized mouth in the exact decoded source and responsive crop, keep its route clear of other faces, and inspect every active cut rather than copying old panel-relative coordinates."
  - id: label-placement
    scope: art
    label: "Intro or setting label misplaced"
    instruction: "Keep place labels at the top, character introductions beside the named character at their authored position, and scene setup at bottom-right; preserve words and report/reflow collisions instead of relocating labels to arbitrary free corners."
  - id: empty-layered-state
    scope: motion
    label: "Layered state loses useful art"
    instruction: "Keep a complete useful static/page source during group decode or failure and install every required plane atomically, preserving dialogue and useful content through opening/peak/end/seek/reduced states while exposing actual source errors rather than falsely reporting ready."
  - id: no-story-content
    scope: speech
    label: "Box has no useful story content"
    instruction: "Make this box add a readable action, reaction, evidence or spoken/narrated beat in every selected responsive state; retain meaningful silent action but repair empty imagery or missing scheduled words without inventing filler dialogue."
  - id: wrong-sound
    scope: sound
    label: "Score or effects do not fit action"
    instruction: "Correct this box's delivered ambience, event effects, score, timing and levels to its actual depicted action with deliberate quiet where appropriate, and verify by listening with speech active rather than raising global volume."
  - id: pace-slow
    scope: motion
    label: "Pace too slow"
    instruction: "Shorten low-content setup and unnecessary holds so this box advances with its actual reading/action load, while retaining exact approved utterances, measured voice windows, essential evidence dwell and sufficient phone reading time."
  - id: pace-rushed
    scope: motion
    label: "Pace too rushed"
    instruction: "Give this box enough adaptive dwell for its actual words, typed final glyph, recorded speech and essential action/evidence in both layouts; preserve pause/seek/replay and do not solve rushing by shrinking lettering."
  - id: missing-voice
    scope: voice
    label: "Voice missing"
    instruction: "Bind the matching approved saved utterance to this box's exact words and character, including Second Brain narration for teal highlights and rectangular introductions, verify decoded playback and timing, and keep any unproduced recording explicitly missing under its actual authorization."
  - id: wrong-voice
    scope: voice
    label: "Voice or words do not match"
    instruction: "Correct this box's saved recording binding to its exact approved text, cast voice and delivery, preserve approved narration casting, verify the actual recording and playback window, and do not treat metadata as a listening pass."
  - id: too-few-boxes
    scope: art
    label: "Fewer than five visible comic boxes"
    instruction: "Reflow the actual Home desktop page and phone sheet so at least five distinct, meaningful comic boxes survive viewport clipping and stacking; authored array length, duplicate images or regions, and extra cuts inside one box do not satisfy the count."
---
Edit this file to change the presets; Studio re-reads it on every open. `id` is stable (the procedures and run history refer to it), `scope` is art, speech, sound, motion, appearance or voice (the Fix art dialog shows only art), `label` is the chip text and `instruction` is the one sentence the agent receives. The order here is the pop-up order. These issues come from Matt's box corrections, including his 13 October requirements for useful layered states, actual pointers, stable labels, adaptive pacing and complete sound/voice review. Flagging an issue is feedback, not a source/render/listening test or approval; check every box's actual selected desktop/phone source and opening/peak/end states, then retain the failure or verify the repair. The art presets name defects the `mtw-comic-story` skill must also prevent at generation and catch in visual review, so a preset that keeps being picked points to a gap in that skill.
