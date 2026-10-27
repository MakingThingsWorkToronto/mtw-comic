---
id: comics-character-fixes
purpose: Common-issue presets for one comic character. Studio lists them as chips in the character chat's pop-up; the comics-character-feedback procedure receives the chosen ids and looks up each instruction here.
presets:
  - id: off-model
    scope: appearance
    label: "Doesn't match the cast reference"
    instruction: "Bring the character's model sheet and every use of it back to one consistent design: silhouette, face, hair, build, costume and colours, so the reference and the comic boxes read as the same person."
  - id: costume
    scope: appearance
    label: "Costume or colours wrong"
    instruction: "Correct the costume, accessories and colour palette to the character's role and the story world, keeping the agreed colour states and the cartoon ink and flat colour style."
  - id: age-build
    scope: appearance
    label: "Age or build wrong"
    instruction: "Redraw the character at the age, height and build the role and voice imply, keeping identity recognisable across views."
  - id: expression
    scope: appearance
    label: "Face or expression wrong"
    instruction: "Give the character a face and default expression that fit their personality and the scenes they play, with clear eyes and readable emotion at panel size."
  - id: agent-projection
    scope: appearance
    label: "Agent not in projection format"
    instruction: "Draw this digital agent in the cast's accepted projection format (translucent projected light in its cast colour and silhouette, cast from its source device), never as a solid human, robot or sticker."
  - id: new-sheet
    scope: appearance
    label: "Make a new model sheet"
    instruction: "Produce a new model sheet for this character (front, three-quarter and profile, with expressions) from the current reference and Matt's note, as a new version beside the old one."
  - id: wrong-voice
    scope: voice
    label: "Voice doesn't fit the character"
    instruction: "Shortlist better-fitting voices for this character from the provider catalogues and record why each fits; Matt chooses the voice, so never select one."
  - id: pace
    scope: voice
    label: "Too fast or too slow"
    instruction: "Adjust the voice profile's pace and delivery notes so lines land at a natural reading speed for balloons of about 12 words."
  - id: pitch-accent
    scope: voice
    label: "Pitch or accent wrong"
    instruction: "Adjust the voice profile's pitch and accent fields to fit the character's age, background and the Toronto setting."
  - id: flat-delivery
    scope: voice
    label: "Delivery is flat"
    instruction: "Rewrite the voice profile's delivery and notes so the performance carries the character's attitude and stakes, with direction a voice actor could follow."
  - id: pronunciation
    scope: voice
    label: "Mispronounces names or terms"
    instruction: "Add the names, places and terms this character says to the profile's pronunciations, with plain respellings."
  - id: audition
    scope: voice
    label: "Audition voices with a sample line"
    instruction: "Plan auditions of the shortlisted voices on the profile's sample line through the casting procedure, showing the plan and cost before any paid request."
---
Edit this file to change the presets; Studio re-reads it on every open. `id` is stable, `scope` is appearance or voice, `label` is the chip text and `instruction` is the one sentence the agent receives. The order here is the pop-up order.
