/**
 * Which media a session's own tool calls wrote, so a session is held only to its own files (the working
 * tree is shared with peer sessions). Append-only log apps/mtw/.state/sessions/<session_id>.media.jsonl:
 *   {"k":"start","key":<tool_use_id>,"at":ms[,"codex":true]}  PreToolUse of a Bash call (codex: the command runs `codex exec`)
 *   {"k":"end","key":<tool_use_id>,"at":ms}    PostToolUse of that call: media changed inside [start, end] is the call's
 *   {"k":"path","path":<repo-relative>,"at":ms} a path a Write/Edit/apply_patch call wrote, or a call named in its output
 * Appends are one short line each, so parallel hooks never rewrite each other. Mirrored at .codex/hooks/lib/.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { writeSurfaces } from './write-payload.mjs';
import { isMedia, toRepoRelative } from '../../../scripts/assets/media-registration.mjs';

const MEDIA_PATH = /[A-Za-z0-9_.:\\/-]+\.(?:png|jpe?g|webp|gif|svg|avif|mp3|wav|ogg|flac|m4a|aac|opus|mp4|webm|mov)\b/gi;

const safeId = (id) => String(id ?? '').replace(/[^A-Za-z0-9._-]/g, '').slice(0, 120);

export function mediaLogPath(root, sessionId) {
  const id = safeId(sessionId);
  return id ? join(root, 'apps', 'mtw', '.state', 'sessions', `${id}.media.jsonl`) : null;
}

function append(root, sessionId, rows) {
  const file = mediaLogPath(root, sessionId);
  if (!file || !rows.length) return false;
  try {
    mkdirSync(join(file, '..'), { recursive: true });
    appendFileSync(file, rows.map((r) => `${JSON.stringify(r)}\n`).join(''));
    return true;
  } catch { return false; }
}

const callKey = (payload) => String(payload?.tool_use_id ?? payload?.turn_id ?? 'call');
const textOf = (v) => (v == null ? '' : typeof v === 'string' ? v : (() => { try { return JSON.stringify(v); } catch { return ''; } })());

/** Repo-relative media paths a tool call names (written file, patch targets, paths in command or output). */
export function namedMedia(payload, root) {
  const input = payload?.tool_input ?? {};
  const found = new Set();
  const add = (p) => {
    const rel = toRepoRelative(String(p).replace(/\\\\/g, '/'), root).replace(/\\/g, '/');
    if (isMedia(rel) && !rel.startsWith('/') && !/^[A-Za-z]:/.test(rel) && existsSync(join(root, rel))) found.add(rel);
  };
  if (input.file_path) add(input.file_path);
  for (const s of writeSurfaces(payload).surfaces) add(s.path);
  for (const blob of [textOf(input.command), textOf(payload?.tool_response)]) for (const m of blob.matchAll(MEDIA_PATH)) add(m[0]);
  return [...found];
}

/** True when a shell command launches a Codex run (`codex exec`), the only way a Claude call writes Codex image output. */
export function runsCodex(command) {
  return /(?:^|[^\w.-])codex(?:\.cmd|\.exe|\.js)?["']?\s+(?:exec|e)\b/i.test(String(command ?? ''));
}

/** PreToolUse: remember when a shell call started, and whether it runs Codex. */
export function recordToolStart(payload, root, now = Date.now()) {
  const row = { k: 'start', key: callKey(payload), at: now };
  if (runsCodex(payload?.tool_input?.command)) row.codex = true;
  return append(root, payload?.session_id, [row]);
}

/** PostToolUse: close the call's window and record the media paths it named. */
export function recordToolEnd(payload, root, now = Date.now()) {
  const rows = [{ k: 'end', key: callKey(payload), at: now }];
  for (const path of namedMedia(payload, root)) rows.push({ k: 'path', path, at: now });
  return append(root, payload?.session_id, rows);
}

/** { logged, paths, windows } for a session; `logged` is false when the session wrote no log at all. */
export function readSessionMedia(root, sessionId) {
  const file = mediaLogPath(root, sessionId);
  const out = { logged: false, paths: new Set(), windows: [] };
  if (!file) return out;
  let text = '';
  try { text = readFileSync(file, 'utf8'); } catch { return out; }
  out.logged = true;
  const starts = new Map();
  for (const line of text.split('\n')) {
    let r;
    try { r = JSON.parse(line); } catch { continue; }
    if (r.k === 'path') out.paths.add(r.path);
    else if (r.k === 'start') starts.set(r.key, r);
    else if (r.k === 'end' && starts.has(r.key)) {
      const s = starts.get(r.key);
      out.windows.push({ from: s.at, to: r.at, ...(s.codex ? { codex: true } : {}) });
      starts.delete(r.key);
    }
  }
  return out;
}

/**
 * True when this session wrote `rel` (named it, or it changed during one of the session's shell calls).
 * `codexOnly`: count only shell calls that ran `codex exec`. Codex image output lands outside the repo from any
 * Codex run on the machine (Studio lanes, the desktop app), so a timing overlap with an unrelated shell call is not
 * authorship (2026-10-11: a Studio comic lane's images blocked a Claude session that only ran git and node).
 */
export function ownedBy(media, rel, mtimeMs, slackMs = 2000, { codexOnly = false } = {}) {
  if (media.paths.has(rel)) return true;
  return media.windows.some((w) => (!codexOnly || w.codex) && mtimeMs >= w.from - slackMs && mtimeMs <= w.to + slackMs);
}
