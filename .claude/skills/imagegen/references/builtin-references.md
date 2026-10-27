# Built-in reference preflight

For MTW work, the generation request also names the exact canonical destination,
record/treatment/version, provenance destination and registration writer. Complete
the [generate/register/handoff contract](../SKILL.md#generate-register-and-hand-off-as-one-task)
as part of that request. Seal the actual registered handoff with this helper's
`--handoff` mode after maintained register/verify; consume it once for evaluation,
and reopen only changed bytes, selections, dependencies or a concrete defect.
Pending transport is an unfinished request, not a catalog-complete handoff.

Required roles key: `registrationContract: {canonicalDestination, recordId, style,
version, provenanceDestination, registrar, requestedStatus, bytePreserveImport: true,
register: true, verify: true, completionStage: "registered"}`. Use exact repo-relative
asset/provenance destinations and a named serialized registrar. Every request made
with an MTW `--repo` requires it, including no-reference/new-image/edit requests.
Validated references allow the native call while a catalog writer works; queue only
canonical import. The worker remains active until actual import/register/verify and
returns only the registered handoff. Use the requested status in the first payload,
one registration and one verify. Retain failed takes without inferred approval.

For MTW comic cast, set `scope: "mtw-comic"` in the request/roles and add `comicCast: {characters: [<exact cast_authority.resolve_cast binding>, ...]}` to the roles object. Each actual identity input carries `castBinding`; compare its actual path/hash to that binding. An authorized contact sheet carries `castMembers` plus `composition: {outputSha256, sources: [<same exact bindings>], layout: <retained deterministic layout>}`. Each member resolves independently to its current canonical identity; a sheet does not create a new cast selection. Keep layout/style/exclusion roles separate. Re-run immediately before invoking the provider, using `--repo <repo-root>` for an isolated fixture. The guard refuses stale mappings even when old image bytes still exist. Never bypass missing authority with a filename, copied Studio response or old whole-file snapshot. Exact declared composition provenance cannot prove montage pixels, human review or approval.

1. Freeze the exact submitted UTF-8 prompt (including its terminal newline), actual ordered local image paths, and one nonempty role/exact SHA-256 for each path. Read source/story JSON with explicit `encoding='utf-8'`, and compare copied source strings with the immutable UTF-8 extraction before composing the prompt; Windows default decoding can silently corrupt curly punctuation. Keep previous submitted prompt/receipt bytes unchanged when correcting later source evidence.
2. The observed built-in tool accepts at most five `referenced_image_paths`. Do not submit six or more, silently drop identities, or switch to paid API fallback. When more identities are required, compose an explicitly authorized reference contact sheet from the original immutable images; retain every source hash and the deterministic layout receipt. A reference contact sheet is not a new selected character design.
3. Run `python .codex/skills/imagegen/scripts/validate_builtin_request.py request.json input-roles.json --repo <repo>` (Claude uses its mirrored path). This is offline; it checks the completion contract, actual file order, purpose, uniqueness, hashes and decoded raster image bytes, then reports the prompt hash. CSS, JSON and other source/style records remain separately hashed supplemental metadata, never provider image attachments. Preserve its output before the call. Use only provider-supported request fields in the built-in invocation; the registration contract stays in roles/provenance, not tool kwargs.
4. Compare that prompt hash with the bytes saved using `Path.write_bytes(prompt.encode('utf-8'))`. Retain provider rejection receipts and outputs separately. No model name, price, approval or visual pass is inferred.
5. Inspect the next actual returned image under its existing profile. This preflight cannot judge cast, information side, alpha or artwork quality.

Observed occurrence: Agentic procedure proof's seven-reference native request was rejected before image generation on 2026-10-10. A deterministic three-human contact sheet retained Matt/Sam/Joan and reduced the next request to five references. Preserve that request and its returned draft. The shared preflight now rejects an over-cap call earlier; its tests also reject missing, reordered, duplicate and stale input roles. Actual layer extraction is the next eligible workflow run through this repair, with its result recorded separately.

Source-code packet edits must preserve the baseline newline bytes as well as UTF-8 text. Read raw bytes, retain the existing newline convention and write the proposed bytes directly; do not pass decoded CRLF through Windows text-mode newline translation. Before handoff, reject any CRCRLF sequence in every proposed source/guidance file and inspect the raw diff for unintended whole-file line-ending changes. Exact base/output hashes and paired parity still apply; UTF-8 decoding alone does not detect doubled carriage returns.

### Native prompt length and source evidence

The native image tool rejects prompts longer than 32,000 characters. Run the paired `validate_builtin_request.py` preflight before every call; the limit concerns the exact submitted string, not UTF-8 byte length. Keep full maintained box-prompt receipts. When several boxes repeat identical cast metadata, include that metadata once while retaining each box's D1–D15 requirements, source action, information-face contract and current cast/ref roles. Never truncate frozen source words or silently omit a box to fit. Retain a rejected request/error as an attempt with no returned image; rerun fresh guards on the compact successor.

On Windows, console replacement-looking glyphs do not establish corrupted source. Check raw bytes with strict UTF-8 decoding and actual Unicode codepoints; retain ASCII-escaped diagnostics before proposing a source rewrite. Preserve source-code newline bytes and reject CRCRLF as described above.
