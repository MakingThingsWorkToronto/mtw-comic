# How the profile is measured, and why (lessons from 2026-09-26)

`site/scripts/audio/analyze-audio.mjs` runs inside installed Chrome (Playwright, `channel: 'chrome'`), so any format the browser plays decodes without ffmpeg. It is shared by `site/scripts/analyze-song.mjs` (Beat Comic beat maps) and `scripts/soundtrack.mjs` (library profiles); a change to one is a change to both. Reference result: "Aphelion" (Zambolino) reads 100 BPM, first downbeat 0.565 s, stops 8-9, 84, 147-148, song end 190, triplet feel (84% of hits), hits at +0.27 beat.

## Detectors

1. **Tempo: autocorrelation of the onset envelope**, weighted to 85-140 BPM, refined by a phase comb, snapped to the half BPM. A phase comb alone read Aphelion as 75 BPM (a 3:4 lock).
2. **Downbeat: maximum beat-to-beat loudness contrast.** The grid that puts dead stops wholly inside beats is the arrangement's grid. All-band and kick-band combs, silence re-entries and a hand measurement disagreed on Aphelion (0.16 s vs 0.565 s); see 5.
3. **Stops, accents, end**: per-beat loudness against the median (below 30%, above 122% and a local peak, last beat above 15%).
4. **Bands**: 2048-point Hann FFT every 25 ms (40 fps), band energy in dB, normalized to the track's top 60 dB, stored at 20 fps (frame pairs averaged). Onsets are flux peaks of band groups over an adaptive threshold, timed at the window centre (+23 ms), at 25 ms resolution; a 20 fps onset clock was too coarse to see a groove.
5. **Feel**: the share of kick and snare hits on a grid of 2, 3 or 4 steps per beat, tried at every phase. Aphelion's hits sit on three positions per beat (a shuffle); the hand-measured downbeat and the detectors' downbeat were two of those positions apart (0.4 s = two thirds of a beat), which is why a story cut to either grid felt in sync. Read `hitPhaseBeats` before choosing where slams land.

## Provider lessons

- Pixabay files carry no ID3 tags; the file name holds the uploader slug, a title slug and the id. Pixabay blocks scripted fetches (403) and the plain `/music/-<id>/` form 404s; from a real browser tab, `/music/x-<id>/` redirects to the canonical page. The artist is the display name in "Title by Artist", which can be a number (one reads "51703654").
- Free To Use files carry clean ID3 tags; the track page follows `/music/<artist>/<title>`.
- Artlist files are tagged "Licensed for video by Artlist.io"; treat as `needs source` until Matt confirms web use and a page.
- Browsers download duplicates as `name (1).mp3`; compare bytes and keep one.

## Cost

About 5 s a minute of audio's worth of track in Chrome on this machine (a 5 min 17 s track took 17 s); 59 tracks in about 5 minutes. Profiles are about 35 KB (JSON) per two minutes of audio.

## Wrong grids (2026-09-28)

"LEMMINO [FREE RAP BEAT]" (pixabay-481598) was profiled at 100.41 BPM; its drums sit on a 0.196 s grid and its loudness repeats every 16 beats at 76.535 BPM, first downbeat 0.041 s (a half-time trap beat; the detected tempo was 1.31x off, not a double or half). It surfaced when the Track 09 story, cut to the true grid, failed `beat-comic-check.mjs` against the profile. Repair: the `grid` override in `sources.json`, honoured by `build` and enforced by `check`. The analysis itself was not changed: an automatic detector of wrong grids (per-beat loudness repeat lags, detrended or not; kick-on-beat share) flagged good triplet songs and missed this one, so it was not kept. The same day "Funky Rock Groove" (pixabay-556625) proved wrong the same way (detected 124.68 BPM, true 95.05 from 0.045 s: drum onsets repeat every 2.525 s, kick on 1, snares on 2 and 4), caught by the story author's grid sanity check before cutting: read the per-beat loudness in rows of 16 and confirm the sections repeat on whole bars before trusting a profiled tempo.
