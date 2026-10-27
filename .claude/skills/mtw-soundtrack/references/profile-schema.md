# Profile schema (analysis version 2)

`wiki/soundtrack-library/profiles/<id>.json`, written by `scripts/soundtrack.mjs` from `site/scripts/audio/analyze-audio.mjs`.

| Field | Meaning |
|---|---|
| `id`, `analysisVersion`, `profiled` | Track id, analysis version, date profiled |
| `asset` | `file` (relative to the library), `bytes`, `sha256` |
| `beatMap.bpm`, `beatSeconds` | Tempo, snapped to the half BPM songs are produced at; one beat in seconds |
| `beatMap.offset` | First downbeat in seconds. Beat `k` starts at `offset + k × beatSeconds` |
| `beatMap.beats[]` | Loudness per beat (RMS, % of full scale) |
| `beatMap.phrases[]` | Beat indexes where 16-beat phrases start (a heuristic: read the loudness table too) |
| `beatMap.stops[]` | Beats where the band cuts out (below 30% of the median): freeze-frame candidates |
| `beatMap.hits[]` | Accent beats (above 122% of the median and a local peak): slam candidates |
| `beatMap.endBeat`, `loopBeats`, `loopSeconds` | Last sounding beat; one pass rounded up to the bar |
| `frequency.fps`, `bands`, `bandEdgesHz`, `frames`, `rangeDb` | 20 frames a second; `sub 20-60, bass 60-150, lowmid 150-400, mid 400-1k, uppermid 1-2.5k, presence 2.5-5k, brilliance 5-10k, air 10-16k` Hz; 60 dB range |
| `frequency.data` | Base64 Uint8, band-major: value of band `b` at frame `f` is `data[b × frames + f]`, 0-255 against the track's loudest band level (0 = 60 dB below it) |
| `perBeat[b][k]` | Band `b` averaged over beat `k`, 0-255 |
| `onsets.kicks`, `snares`, `hats` | Hit times in seconds (25 ms resolution): sub+bass, upper-mid+presence, brilliance+air flux peaks |
| `summary.feel`, `feelFit`, `hitPhaseBeats` | `straight` (eighths), `triplet` (shuffle) or `sixteenth`; the share of hits each grid holds; where that grid sits after the beat map's downbeats, in beats |
| `summary.onsetPhase12` | Hits per twelfth of a beat: the groove's fingerprint |
| `summary.rmsDbfs`, `dynamicsDb`, `brightnessHz`, `bassShare`, `bandMean[]` | Loudness; loud-to-quiet spread (95th minus 10th percentile of frame level); mean spectral centroid; energy share below 150 Hz; mean level per band |
| `summary.onsetsPerSecond`, `kickOnBeat`, `snareOnBeat`, `introBeats` | Hit density; share of kicks and snares within 12% of a beat line; beats before the song reaches 60% of its median loudness |

`manifest.json` carries each track's registry entry plus `credit` `{ text, href }`, `asset`, `beatMap` (without `beats`), `summary`, `profile` (the `.js` path) and `energy` (loudness per bar, for sparklines).
