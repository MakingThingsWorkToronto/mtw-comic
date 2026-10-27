---
id: "wiki:site/soundtrack-library"
kind: "knowledge"
title: "Soundtrack library"
load_when: "Approving, crediting, profiling or choosing music for a page, Beat Comic or page transition, or changing a track's status or credit."
themes: ["site", "audio"]
keywords: ["soundtrack", "approved", "candidate", "credit line", "beat map", "eight bands", "sources.json", "profile", "checked grid"]
routes: ["/", "/comics/*"]
relations: [{"type":"depends_on","target":"wiki:site/asset-locations","reason":"Every audio file, including auditions and provider previews, lands in the soundtrack library under the shared asset-home contract."}]
---
# Soundtrack library

Approved music for MTW motion graphics, pre-profiled so heroes, Beat Comics and page transitions can be cut and mixed to it (Matt, 2026-09-26: "these tracks will be used to define the hero motion graphics. you will need the frequencies so you can mix them with the page transitions."). Method: the `mtw-soundtrack` skill (both editions) and the Claude agent `soundtrack-intake`. Review: open `/m/soundtrack` in [MTW Studio](mtw-app.md) (`npm run studio`, http://127.0.0.1:8788). The old `index.html` console, its `.js` data twins and `soundtrack.mjs serve` are retired (code in Git commit `51eb6e03`). Intake runs through the `soundtrack-intake` procedure; `soundtrack.mjs build` (writes `profiles/<id>.json` and `manifest.json` only) and `check` remain. Canonical data: `wiki/soundtrack-library/{sources.json,discovery.json,manifest.json,profiles/<id>.json,comic-audio.json,decisions.jsonl}`. New music arrives through [music discovery](music-discovery.md).

## Contents

Track, approved, candidate and profiled counts are the `counts` field of `wiki/soundtrack-library/manifest.json`; the Studio Soundtrack module lists the tracks by status and by discovery run. Do not type the figures into a page.

| | |
|---|---|
| Registry | `wiki/soundtrack-library/sources.json`; generated `manifest.json`, `profiles/`; audio in `assets/` |
| Providers | Pixabay (Pixabay Content License), Free To Use ("Aphelion" by Zambolino), Artlist, and one track with no known source |
| Without a track page | "The World Is Full Of Wonders" by Ziggy (album Strums & Whistles, tagged "Licensed for video by Artlist.io"): no page for the track was found, so its credit links to Ziggy's Artlist artist page. "Epic Win" by Moire: no source page is known, so its credit names the track and artist without a link. Add either page if it turns up. |
| Analysis | Version 2 (`site/scripts/audio/analyze-audio.mjs`, shared with `site/scripts/analyze-song.mjs`) |

## Review and approval (Matt, 2026-10-02)

- Statuses: `approved` (usable on pages), `candidate` (found by discovery: credited, downloaded and profiled, waiting for Matt), `needs source`, `withdrawn`. Only approved tracks go on pages; the Beat Comic audit fails any other.
- In Studio Soundtrack Matt plays a track, rates it 1 to 5 stars and presses **Approve**; the click saves to `sources.json` at once (`status`, `approved` date, `approvedVia: "console"`, `rating`). A Studio approval no page uses can be undone.
- **Find similar songs** on any track saves an open request in `discovery.json`; the next discovery run answers it with candidates.
- Studio refuses **Approve** (409) unless the track is a `candidate` with a title, artist, licence and a source or note, and refuses **Undo** unless `approvedVia` is `"console"` and `usedBy` is empty. Each click re-reads `sources.json` first, so tracks added by other writers survive. Studio's `/api/collected` (posted by `pixabay-collect.js`) allows CORS only from `https://pixabay.com`, caps the body at 5 MB and writes `records/<name>[-n].json` with a cleaned `[a-z0-9-]` name, never overwriting.

The first intake (Matt, 2026-09-26: "all 59 are approved") approved every track Matt supplied; later tracks arrive as candidates through discovery.

Matt's own approved list from that intake is kept verbatim, with its Pixabay attribution lines, at `wiki/soundtrack-library/records/approved-list-20260926/approved-music.md`; Studio's `sources.json` statuses, not the list, are the live record. Reconciled 2026-10-11: every Pixabay ID in the list is `approved` in `sources.json`. The last one, "Mafia Gangstar Criminal Beat" by Andrii Zaitsev (Pixabay 595783), was taken in on 2026-10-11 as `pixabay-595783`, credited as Pixabay publishes it, "Mafia Gangster Criminal Beat" by vaitsez; its Pixabay page marks it Content ID Registered, so video platforms may flag uses, and its detected grid (121 BPM, first downbeat 0.38 s) is not yet confirmed by ear. Four list entries ("Retro Funk", "Funk Funk Music", a second "Stylish Funk" and a second "Funky Funk") repeat another entry's link, so their own track pages are unknown.

## Attribution and playback (Matt, 2026-09-26)

- Every track is credited as the homepage credits Aphelion: `Music: <Title> by <Artist>`, linked to the track's own page, with the title and artist exactly as the provider publishes them. Pixabay's licence does not require attribution; MTW credits anyway.
- Any screen built from a track uses the homepage's sound experience: music on by default, "Tap for sound" while the browser holds it back, the music playing the whole time, the credit tag pinned bottom right folding to a mute button (`site/src/components/BeatComic.astro`).
- Studio's "Copy story music line" gives the `music` object for a Beat Comic story; the page serves its own copy under `site/public/audio/`.
- Each track's `usedBy` in `sources.json` records the pages that use it; the homepage Beat Comic is cut to "Aphelion" by Zambolino, whose hand-verified beat map (100 BPM, first downbeat 0.565 s, stops at beats 8-9, 84 and 147-148, end 190) is the reference the analysis reproduces.
- Between pages the tracks mix: the departing track fades under the page transition's cover and the next page's track starts as its reveal begins; mute carries across (the `mtw-beat-comic` skill, "The mixtape").

## What each profile holds

Tempo, first downbeat, per-beat loudness, 16-beat phrases, dead stops, accents, end beat and loop length; feel (straight, triplet, sixteenth) with where hits sit in the beat; loudness, dynamics, brightness and bass share; kick, snare and hat onsets (25 ms); eight bands (sub to air) at 20 frames a second and per beat. Schema: the skill's `references/profile-schema.md`.

## Checks

- `soundtrack.mjs check`: every registered track's asset is present and hash-matched to its profile, and approved tracks carry title, artist, track page and licence.
- **Checked grids (2026-09-28):** a track may carry a `grid` in `sources.json` (BPM, first downbeat, who measured it and how, whether confirmed by ear) that replaces the detected grid when its profile is built; `check` fails a profile that lacks its checked grid. The detector can halve or double a tempo (for example "LEMMINO [FREE RAP BEAT]", pixabay-481598, is 76.535 BPM from 0.041 s against a detected 100.41 BPM), so a doubtful grid is measured and recorded with its `confirmedByEar` state rather than trusted. The Studio track metronome is the listening check.
- Credits are resolved from each track's canonical page in a real browser; a credit with no track page is recorded as such (see Contents).
