// Allowlists lifted from the retired `soundtrack.mjs serve` (static GET) and comic-audio-paths.mjs (resolveComicAudioPath).
// Pure path resolution: the core's media service does the range-aware streaming and the real-path root check.
import path from 'node:path';

export const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.webm'];

/**
 * Read-only canonical comic audio and receipts; never grants write access.
 * Same allowlist as .claude/skills/mtw-soundtrack/scripts/comic-audio-paths.mjs (checked against it in the tests).
 */
export function resolveComicAudioPath(root: string, pathname: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded.includes('\0')) return null;
  const f = path.resolve(root, `.${decoded}`);
  const base = path.resolve(root, 'wiki/comics-library');
  const ext = path.extname(f).toLowerCase();
  for (const dir of ['assets/voices', 'assets/sounds']) {
    const allowed = path.resolve(base, dir);
    if (f.startsWith(allowed + path.sep) && ['.mp3', '.wav', '.ogg'].includes(ext)) return f;
  }
  const receipts = path.resolve(base, 'records');
  if (f.startsWith(receipts + path.sep) && ext === '.json') return f;
  const runtime = path.resolve(root, 'site/public/scripts/comic-story.js');
  return f === runtime ? f : null;
}

const unsafe = (decoded: string): boolean => !decoded || decoded.includes('\0') || decoded.includes('\\') || /[:*?"<>|]/.test(decoded) || decoded.split('/').some((s) => !s || s === '.' || s === '..');

/** A path under wiki/soundtrack-library/assets (audio only, nested folders allowed, e.g. speech/<batch>/x.mp3). `rel` is already decoded. */
export function resolveLibraryAudio(libDir: string, rel: string): string | null {
  if (unsafe(rel) || !AUDIO_EXTENSIONS.includes(path.extname(rel).toLowerCase())) return null;
  const assets = path.resolve(libDir, 'assets');
  const f = path.resolve(assets, rel);
  return f.startsWith(assets + path.sep) ? f : null;
}

/** Receipts under wiki/soundtrack-library/records (JSON only). `rel` is already decoded. */
export function resolveLibraryRecord(libDir: string, rel: string): string | null {
  if (unsafe(rel) || path.extname(rel).toLowerCase() !== '.json') return null;
  const records = path.resolve(libDir, 'records');
  const f = path.resolve(records, rel);
  return f.startsWith(records + path.sep) ? f : null;
}

/**
 * What `/api/soundtrack/comic-audio/<repo-relative path>` may serve: the legacy comic-audio allowlist, plus the soundtrack
 * library's own audio and receipts (recorded dialogue lives under wiki/soundtrack-library/assets/speech). `repoPath` is decoded.
 */
export function resolveComicAudioRequest(root: string, libDir: string, repoPath: string): string | null {
  // Re-encode so the legacy resolver's single decode gives back exactly `repoPath`.
  const legacy = resolveComicAudioPath(root, `/${repoPath.split('/').map(encodeURIComponent).join('/')}`);
  if (legacy) return legacy;
  const prefix = 'wiki/soundtrack-library/';
  if (repoPath.startsWith(`${prefix}assets/`)) return resolveLibraryAudio(libDir, repoPath.slice(`${prefix}assets/`.length));
  if (repoPath.startsWith(`${prefix}records/`)) return resolveLibraryRecord(libDir, repoPath.slice(`${prefix}records/`.length));
  return null;
}

export const contentTypeFor = (abs: string): string | undefined => (abs.toLowerCase().endsWith('.js') ? 'text/javascript; charset=utf-8' : undefined);
