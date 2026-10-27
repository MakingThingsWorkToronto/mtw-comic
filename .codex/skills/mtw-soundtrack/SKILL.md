---
name: mtw-soundtrack
description: Take approved music into the MTW soundtrack library (wiki/soundtrack-library) and pre-profile it for motion graphics - resolve each track's exact title, artist, track page and licence, copy it in, measure its beat map, feel and eight-band frequency profile, rebuild the manifest for review in MTW Studio, and check it. Use when Matt supplies or approves new tracks, when a hero, Beat Comic or page transition needs a song chosen or its beats and frequencies read, or when a track's credit or status changes. Not for writing the story itself (mtw-beat-comic) or the page transition's own code (mtw-page-transition).
---

# MTW soundtrack library

Read `discussion/spec.md` first ("Soundtrack library", "Homepage B music"): it wins over this skill. Facts live in [wiki/site/soundtrack-library.md](../../../wiki/site/soundtrack-library.md); this skill holds the method.

**What it is.** Every track Matt approves for motion graphics, in one place, each with its credit and a profile a motion graphic can be cut and mixed to: tempo, first downbeat, phrases, dead stops, accents, the song's end, its feel (straight, triplet or sixteenths), loudness and brightness, kick/snare/hat onsets, and eight frequency bands at 20 frames a second. Matt: "these tracks will be used to define the hero motion graphics. you will need the frequencies so you can mix them with the page transitions."

## The library (wiki/soundtrack-library/)

| File | What it is |
|---|---|
| `sources.json` | The intake registry: one entry per track (file, download name, provider, exact title and artist, track page, licence, genre, status, Matt's `rating`). The only file you edit by hand; Studio's review buttons also write it. |
| `discovery.json` | Find similar requests from Studio's Soundtrack module and every discovery run (skill `mtw-music-discovery`). |
| `records/` | What each discovery run read from the provider, kept as provenance. |
| `assets/<id>-<slug>.mp3` | The approved audio, copied once; never overwritten (a new version is a new id). |
| `profiles/<id>.json` | The profile (schema: [references/profile-schema.md](references/profile-schema.md)). |
| `manifest.json` | Generated catalogue: every track with its credit and summary; each track's `profile` field is `profiles/<id>.json`. |
| `comic-audio.json` | Comic ambience, effects and speech projection ([references/comic-audio.md](references/comic-audio.md)). |

**Review surface:** open `/m/soundtrack` in MTW Studio (`npm run studio`, http://127.0.0.1:8788): filters, player, the homepage credit tag, frequency lane, live bands, metronome and a transition preview, and Matt's review buttons (stars, Approve, Find similar). Studio reads the files above directly; there is no browser page or server in the library folder.

**Statuses:** `approved` (usable on pages), `candidate` (found by a discovery run, credited and profiled, waiting for Matt), `needs source`, `withdrawn`. Only Matt approves: his Approve button (saved as `approvedVia: "console"`, the value Studio still writes) or his words in a session.

## Matt's review (Studio's Soundtrack module)

Start Studio (`npm run studio`, or `npm run all` for the website too) and give Matt http://127.0.0.1:8788/m/soundtrack. Every click writes `sources.json` or `discovery.json` (plus a line in `wiki/soundtrack-library/decisions.jsonl`) and rebuilds the manifest at once: **Approve** (candidate to approved, with the date), **Undo approval** (only a Studio approval no page uses), **1-5 stars** (`rating`; the same star again clears it) and **Find similar songs** (an open request that `mtw-music-discovery` answers). Studio re-reads the files on every change, so an intake may run beside it. `soundtrack.mjs serve` is retired.

## Intake (every time Matt approves tracks)

1. **Find the files.** Matt drops approved tracks in `C:\Users\thast\Downloads`. Skip duplicate downloads (`name (1).mp3`, same bytes). A file downloaded outside the approved batch is not approved: register it as `needs source` with a note and ask.
2. **Resolve the credit from the provider, never from the file name.**
   - **Pixabay** (`<uploader>-<title>-<id>.mp3`, no embedded tags): Pixabay refuses scripted requests (403), so use a real browser (Claude in Chrome) on pixabay.com and, from that tab, `fetch('https://pixabay.com/music/x-<id>/')`: it redirects to the canonical track page, whose `og:title` reads "<Title> by <Artist> | Royalty-free Music". Keep the title and artist exactly as published (odd capitals and brackets included). Licence: Pixabay Content License, https://pixabay.com/service/license-summary/.
   - **Free To Use**: the ID3 tags (`TIT2`, `TPE1`, `TPUB`) give title and artist; the track page is `https://freetouse.com/music/<artist>/<title>` (confirm it returns 200 and its title matches).
   - **Anything else** (Artlist, unknown): record what the tags say, set `status: "needs source"` and ask Matt for the track page and licence. An Artlist "licensed for video" tag does not by itself cover a website. If Matt approves it anyway, credit the closest confirmed page (an Artlist artist page for an Artlist track) or, with none, the title and artist without a link, and say why in the entry's `note` (`check` requires the note). Artlist also refuses scripted requests; its search does not always find a track.
3. **Register** each track in `sources.json` (a track already there as a `candidate` is approved in place: set `status`, `approved` and a note, keep its id and asset) (ids `pixabay-<id>`, `freetouse-<artist>-<title>`, `unconfirmed-<artist>-<title>`).
4. **Build:** `node .claude/skills/mtw-soundtrack/scripts/soundtrack.mjs build` copies, hashes and profiles only what is new or changed (about 5 s a track in installed Chrome), then rebuilds the manifest. **Check:** `... soundtrack.mjs check` must print no PROBLEM.
5. **Review** at `/m/soundtrack` in MTW Studio: play a few, turn on the metronome and confirm the beat grid sits on the kick; look at the frequency lane. Read tempo and feel together (a triplet-feel track has three hit positions per beat; see [references/profiling.md](references/profiling.md)).
   **When the detected grid is wrong**, record a checked one on the track in `sources.json`: `"grid": { "bpm": 76.535, "offset": 0.041, "by": "<who, date, how it was measured>", "confirmedByEar": false }`, then `build` (a changed grid rebuilds that profile, measuring stops, accents and bands on the checked grid) and `check` (it fails when a profile lacks its checked grid). Set `confirmedByEar` true only after a `?beat=tick` listen. No automatic test reliably spots a wrong grid from the profile alone (loudness repeats and kick-on-beat shares were tried on 2026-09-28 and flagged good songs while missing the bad one); the listen, and `beat-comic-check.mjs` refusing a story whose tempo differs from its profile, are the checks.
6. **Record** the batch in `wiki/site/soundtrack-library.md` (counts, providers, anything flagged) and Matt's decisions in the spec.

## Using a track on a page

- **Only `approved` tracks.** `beat-comic-audit.mjs` fails a comic whose song is a candidate or withdrawn.
- **Credit and sound experience are the homepage's, always** (Matt: "the attribution and sound mute experience on the homepage is what we want when tracks are loaded and these screens are created"): the credit reads `Music: <Title> by <Artist>` and links to the track's own page, in the BeatComic dock's tag (59% black, animated equalizer, folds to a mute button); music is on by default, "Tap for sound" while the browser holds it back, the music plays the whole time and the tag stays pinned for muting. Credit Pixabay tracks too, although their licence does not require it.
- Copy the track to `site/public/audio/<file>` for the page (the wiki copy is the canonical one) and use the track's "Copy story music line" button at `/m/soundtrack` in Studio for the `music` object.
- Cut the story to the profile's beat map (`mtw-beat-comic`); mix motion and transitions to its bands and onsets ([references/motion-mixing.md](references/motion-mixing.md)).
- Choose by fit, not by name: tempo and feel for pace, `hitPhaseBeats` for where slams land, stops for freeze gags, the ending for the last gag, brightness and bass share for mood.

## Comic ambience, effects and voice auditions

New audio of every kind belongs in `wiki/soundtrack-library/`; comic profiles and records link to it. Existing comic media links remain legacy compatibility inputs until a scoped migration. For additive non-music intake, canonical recording links, procedural recipes and separate hearing/production states, follow [comic audio](references/comic-audio.md).

## Keeping this skill current

When the analysis changes, bump `ANALYSIS_VERSION` in the script so every profile is rebuilt, and record why in `references/profiling.md`. Change both editions identically.
