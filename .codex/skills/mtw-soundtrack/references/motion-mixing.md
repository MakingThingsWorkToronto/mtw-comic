# Mixing motion to a soundtrack

The profile turns a song into numbers a motion graphic can read at any moment. The Beat Comic already runs its clock from the music (`site/public/scripts/beat-comic.js`); this is how any motion, page transitions included, reads the rest.

## Reading the profile at time t (the music's `currentTime`)

```js
// profile = the track's profile JSON; t = audio.currentTime (seconds)
const u8 = Uint8Array.from(atob(profile.frequency.data), (c) => c.charCodeAt(0));
const F = profile.frequency, bm = profile.beatMap;
function band(b, t) { // 0..1, b = 0 sub ... 7 air
  const f = Math.min(F.frames - 1, Math.max(0, Math.floor(t * F.fps)));
  return u8[b * F.frames + f] / 255;
}
const beatAt = (t) => (t - bm.offset) / bm.beatSeconds;          // fractional beat index
const nextBeat = (t) => bm.offset + Math.ceil(beatAt(t)) * bm.beatSeconds;
const nextPhrase = (t) => { const k = bm.phrases.find((p) => bm.offset + p * bm.beatSeconds > t); return k == null ? null : bm.offset + k * bm.beatSeconds; };
const kickNear = (t, w = 0.05) => profile.onsets.kicks.some((k) => Math.abs(k - t) < w);
```

## What to drive with what (the site's own motion)

| Motion | Drive it with | Why |
|---|---|---|
| Page transition cover (square tiles fading down) | Start the cover so it completes on `nextBeat(t)`, or on `nextPhrase(t)` when that is under a beat away; cover tile alpha steps on `onsets.hats` | The cut lands on the beat the ear expects |
| Transition reveal (tiles clearing up) | One beat long (`beatSeconds`), rows clearing on each sixteenth (or third, for a triplet-feel track) | Rhythm the ear can follow |
| Grid Background tiles | Bass (`band(0)+band(1)`) lifts the campfire rows; mids (`band(2..4)`) the tile field; brilliance and air (`band(6..7)`) a sparse white sparkle | The "Live bands" tile preview at `/m/soundtrack` in MTW Studio is exactly this mapping |
| Slams and chapter cuts | `beatMap.hits` and phrase starts | See `mtw-beat-comic` |
| Freeze frames | `beatMap.stops` | Silence is the joke |
| Camera shake, kicks | `onsets.kicks` | Physical, like a speaker pushing air |
| Captions typing | Speed from `onsetsPerSecond` (busier track, faster type) | Pace matches |

## Rules

- The music is the clock. Read `currentTime`; never run a separate timer that drifts.
- Levels are relative to the track's own loudest band (0-255 over 60 dB): compare within a track, not across tracks. Use `summary.rmsDbfs` to compare tracks.
- A triplet-feel track (`summary.feel === 'triplet'`) has three hit positions per beat; cut to `hitPhaseBeats` steps of a third. Two downbeat estimates a third of a beat apart can both look right (see `profiling.md`).
- Reduced motion: no motion from music; the page is static. Muted: motion still follows the clock (the music plays silently).
- Every screen that plays a track carries the homepage's credit tag and mute; see SKILL.md.

## Mixing between pages (the mixtape)

Every Beat Comic page is a track; following a link is the mix (Matt, 2026-09-26: "the transitions are important as once all the pages have these we will be able to navigate through like a self directed mix tape").

- **Out:** the departing track fades to silence over 0.6 s under the page transition's cover (660 ms), quadratic, then pauses. The cover's tiles hide the page while the sound drains.
- **In:** the arriving story waits under the cover and starts with its own track, from its first downbeat, the moment the reveal begins, so the new track drops as the tiles clear. A track with a quiet or stuttering intro (Rodeo) enters softly; a track that starts on a hit enters hard.
- **Mute and unlock carry** across pages for the session; the credit tag on every page names the track now playing.
- **Test:** `node scripts/beat-comic-mixtape.mjs` (from `site/`).
