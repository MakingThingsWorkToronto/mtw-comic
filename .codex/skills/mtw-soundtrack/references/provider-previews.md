# Existing provider preview intake

Use this for a bounded set of already-existing ElevenLabs/Fish Audio demo recordings. This helper does not discover voices, request speech, read credentials, select a character voice or assert production rights. Save current provider metadata first: ElevenLabs MCP output or Fish GET-model declared sample URLs. Normalize only the envelope/field names; retain exact provider/voice ID, published name/description, labels, preview URL, retrieval date and source method. Keep the raw snapshot or its hash in `source`. Do not infer gender, genre or delivery from a name. Missing metadata stays unknown. A requested comparison-only reference carries `comparisonOnly: true, productionSelectable: false`; it stays playable as a reference and cannot become a production choice.

Metadata is explicit UTF-8 without BOM:

```json
{
  "schemaVersion": 1,
  "retrievedAt": "2026-10-10T00:00:00Z",
  "source": {"method": "ElevenLabs MCP voice metadata", "snapshotSha256": "<raw-snapshot-sha256>"},
  "excludedVoices": [],
  "voices": [{
    "provider": "ElevenLabs",
    "voiceId": "<exact-provider-id>",
    "name": "<exact-published-name>",
    "description": "<exact-published-description>",
    "labels": {},
    "previewUrl": "<declared-public-HTTPS-preview>",
    "licensed": null
  }]
}
```

Plan with no network, credentials or output writes:

```powershell
node .codex/skills/mtw-soundtrack/scripts/provider-preview-intake.mjs --metadata <metadata.json> --plan
```

Only when existing-preview download is within the current task's scope:

```powershell
node .codex/skills/mtw-soundtrack/scripts/provider-preview-intake.mjs --metadata <metadata.json> --download --version 1 --run <unique-run-name> --output-root <external-transport-root>
```

The paired Claude path works identically. `--root`, `--catalog` and `--profiles` bind exact current inputs for an external worker. Canonical casting.selectedVoice and rejected casting history exclude exact provider/voice pairs; additional human-rejected references belong in metadata.excludedVoices with a reason. Matching existing cached IDs/URLs reuse hash-verified files. Changed URLs require an explicit higher version, never an overwrite or guessed equivalence. New namespace is ElevenLabs `<voiceId>-vN` or Fish `fish-<voiceId>-vN`, under soundtrack `assets/voices/provider-previews/`; receipts are under soundtrack `records/provider-previews/`. No retained legacy file is moved.

The explicit download path sends sequential public GETs only to supported declared preview endpoints. Redirect destinations are checked before following. It never visits synthesis routes, supplies authentication, retries a failed download or switches providers. The file extension follows actual MP3/WAV magic, not URL/MIME: retained Lauren/Serena previews previously exposed this mismatch. Probe positive-duration audio and decode the entire saved file with ffmpeg; a header/probe alone is insufficient. Save original bytes once, source/hash/status/container/duration/decode receipts immutably, then a guarded catalog proposal. Preserve failed response/saved bytes and the stopped failure receipt. Planning, cache, import, catalog refresh, native transport, listening and selection remain distinct. A provider `licensed: false` or unknown flag is recorded with rightsStatus `unverified`, never rewritten into a licensing claim.

The helper does not edit canonical catalogs or profiles. The integrating writer rechecks full catalog/profile guards, imports exact new files and applies each proposed add/version entry while preserving old versions and immutable metadata. Refresh comics and soundtrack through their maintained producers. Existing signed preview URLs may change or expire; a failure needs fresh source investigation, not an automatic retry or TTS replacement. When a required new provider host appears, extend the declared endpoint check from current metadata and an offline escape fixture rather than widening it to arbitrary HTTPS.

Run `node .codex/skills/mtw-soundtrack/scripts/provider-preview-intake-regression.mjs` (or paired Claude). `--root <repo> --out <external-evidence-dir>` supports staging. The controlled-response fixtures exercise UTF-8 Unicode preservation/invalid Windows bytes, default no-network planning, exact lock/history exclusion, endpoint/redirect rejection, WAV-under-MP3-URL full decode, failed-byte retention/no retry, occupied/higher-version guards, input drift and current cache hashes. Fixtures use tiny synthetic PCM, not provider generation or production recordings. Check the first different eligible real intake through this helper during normal review; until then retain `awaiting-next-output`, with native listening/rights/production review pending.
