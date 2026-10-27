#!/usr/bin/env node
// asset-registration-reminder — PostToolUse REMINDER (never a block) on Write|Edit|apply_patch|Bash.
//
// If a tool call landed a media file under wiki/image-library/assets/ or wiki/soundtrack-library/assets/
// that the catalog does not list, it tells the agent to register it before finishing. It reads the
// tool input and output for path mentions, so it catches what those calls NAME; a file written some
// other way is not seen. A guardrail that catches misses, not a guarantee. The git pre-commit hook
// (scripts/hooks/pre-commit.mjs) is the second net.
//
// Also registered on PreToolUse(Bash) and records each call's window and named media in
// apps/mtw/.state/sessions/<session_id>.media.jsonl (lib/session-media.mjs) so a session is reminded only
// for files its own calls wrote.
//
// Exit contract: always 0. A reminder rides stdout as PostToolUse additionalContext JSON.
// MTW_HOOK_ROOT points the lookup at a planted tree (tests).
//
// Mirrored byte-identically at .codex/hooks/asset-registration-reminder.mjs; the policy lives once in
// scripts/assets/media-registration.mjs.

import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeSurfaces } from './lib/write-payload.mjs';
import { recordToolEnd, recordToolStart } from './lib/session-media.mjs';
import { isMedia, checkRegistered, diskReader, toRepoRelative, isExemptMedia, REGISTER_HINT } from '../../scripts/assets/media-registration.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PATH_RE = /wiki[\\/](?:image-library|soundtrack-library)[\\/]assets[\\/][^\s"'`<>|,;()]+/gi;

function textOf(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  try { return JSON.stringify(v); } catch { return ''; }
}

/** Repo-relative media paths this call names inside the two asset homes. Pure. */
export function mentionedAssets(payload, root = ROOT) {
  const input = payload?.tool_input ?? {};
  const blobs = [textOf(input.file_path), textOf(input.command), textOf(input.path), textOf(payload?.tool_response)];
  const { surfaces } = writeSurfaces(payload);
  for (const s of surfaces) blobs.push(s.path);
  const found = new Set();
  for (const blob of blobs) {
    for (const m of blob.replace(/\\\\/g, '/').matchAll(PATH_RE)) {
      const rel = toRepoRelative(m[0], root).replace(/[.\\/]+$/, '');
      if (isMedia(rel)) found.add(rel.replace(/\\/g, '/'));
    }
  }
  return [...found];
}

/** The reminder text, or null when nothing needs one. */
export function reminderFor(payload, root = ROOT) {
  const read = diskReader(root);
  const owed = [];
  for (const rel of mentionedAssets(payload, root)) {
    if (!existsSync(join(root, rel)) || isExemptMedia(rel, root)) continue;
    const r = checkRegistered(rel, read);
    if (!r.registered) owed.push({ rel, registry: r.registry });
  }
  if (!owed.length) return null;
  const lines = owed.slice(0, 5).map((o) => `- ${o.rel}: ${REGISTER_HINT[o.registry]}`);
  const more = owed.length > 5 ? `\n(+${owed.length - 5} more)` : '';
  return `Asset registration reminder: ${owed.length} media file(s) in a canonical home are not in the catalog yet. Register before you finish (the pre-commit hook will also flag them):\n${lines.join('\n')}${more}`;
}

const invokedDirectly = Boolean(process.argv[1])
  && /\.(?:claude|codex)\/hooks\/asset-registration-reminder\.mjs$/.test(process.argv[1].replace(/\\/g, '/'));

if (invokedDirectly) {
  let payload = null;
  try { payload = JSON.parse(readFileSync(0, 'utf8')); } catch { payload = null; }
  const root = process.env.MTW_HOOK_ROOT || ROOT;
  // Attribution: which media this session's own calls wrote.
  // No process.exit(): exiting while the stdin pipe handle is still closing aborts Node on Windows
  // (UV_HANDLE_CLOSING assertion, seen on PostToolUse:Bash 2026-10). The process ends on its own with exit code 0.
  const pre = payload?.hook_event_name === 'PreToolUse';
  try {
    if (pre) recordToolStart(payload, root);
    else if (payload) recordToolEnd(payload, root);
  } catch { /* attribution is best effort */ }
  if (!pre) {
    try {
      const msg = payload ? reminderFor(payload, root) : null;
      if (msg) process.stdout.write(`${JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: msg } })}\n`);
    } catch {
      // A reminder that cannot measure stays silent; it never blocks.
    }
  }
}
