// Shared lookup: is a media file in a canonical home registered? Used by the pre-commit hook and by
// the PostToolUse reminder hooks (.claude/hooks and .codex/hooks import this one copy).
// A fast lookup against the catalog files, never a full sweep. A guardrail that catches misses.
import fs from 'node:fs';
import path from 'node:path';

export const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'avif'];
export const AUDIO_EXT = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'opus'];
export const VIDEO_EXT = ['mp4', 'webm', 'mov'];
export const MEDIA_EXT = [...IMAGE_EXT, ...AUDIO_EXT, ...VIDEO_EXT];
export const IMAGE_ASSETS = 'wiki/image-library/assets/';
export const AUDIO_ASSETS = 'wiki/soundtrack-library/assets/';

export function isMedia(rel) {
  return MEDIA_EXT.includes(path.posix.extname(rel).slice(1).toLowerCase());
}

export function toRepoRelative(p, root) {
  let s = String(p).replace(/\\/g, '/');
  const r = String(root).replace(/\\/g, '/').replace(/\/$/, '');
  if (s.toLowerCase().startsWith(`${r.toLowerCase()}/`)) s = s.slice(r.length + 1);
  return s.replace(/^\.\//, '');
}

/** Which registry applies: 'image' | 'audio' | null (no registry check for this path). */
export function registryFor(rel) {
  if (rel.startsWith(IMAGE_ASSETS)) return 'image';
  if (rel.startsWith(AUDIO_ASSETS)) return 'audio';
  return null;
}

/**
 * `readText(relPath)` returns the catalog text (staged or on disk) or null when absent.
 * Returns { registered, registry, detail }. An unreadable catalog is reported, not treated as clean.
 */
export function checkRegistered(rel, readText) {
  const registry = registryFor(rel);
  if (!registry) return { registered: true, registry: null };
  if (registry === 'image') {
    const text = readText('wiki/image-library/manifest.json');
    if (text == null) return { registered: false, registry, detail: 'wiki/image-library/manifest.json not found' };
    const key = rel.slice('wiki/image-library/'.length);
    const destinations = parsedOnce(text, 'destinations', (m) => new Set((Array.isArray(m.files) ? m.files : []).map((f) => f.destination)));
    if (!destinations) return { registered: false, registry, detail: 'manifest.json does not parse' };
    if (destinations.has(key)) return { registered: true, registry };
    return { registered: text.includes(key), registry };
  }
  const text = readText('wiki/soundtrack-library/sources.json');
  if (text == null) return { registered: false, registry, detail: 'wiki/soundtrack-library/sources.json not found' };
  const sub = rel.slice(AUDIO_ASSETS.length);
  const files = parsedOnce(text, 'trackFiles', (s) => new Set((s.tracks ?? []).map((t) => t.file)));
  if (!files) return { registered: false, registry, detail: 'sources.json does not parse' };
  if (files.has(sub) || files.has(path.posix.basename(sub))) return { registered: true, registry };
  // Retained review evidence and other non-track audio (score-review renders ...) is catalogued by repo path in
  // audio-records.json, each record with its receipt under records/.
  const records = readText(AUDIO_RECORDS);
  if (records) {
    // An unparseable audio-records.json registers nothing; sources.json still decides.
    const paths = parsedOnce(records, 'recordPaths', (r) => new Set((r.records ?? []).map((x) => x.canonicalPath)));
    if (paths?.has(rel)) return { registered: true, registry };
  }
  if (!sub.includes('/')) return { registered: false, registry };
  // Comic audio in a subfolder (speech/, voices/, sounds/ ...) is catalogued by the comics-library inputs and their
  // comic-audio.json projection, which name it by repo path or library-relative path.
  const libRel = `assets/${sub}`;
  for (const catalog of COMIC_AUDIO_CATALOGS) {
    const t = readText(catalog);
    if (t && (t.includes(`"${rel}"`) || t.includes(`"${libRel}"`))) return { registered: true, registry };
  }
  return { registered: false, registry };
}

/** Catalog of non-track audio (retained review renders and similar evidence), keyed by `canonicalPath`. */
export const AUDIO_RECORDS = 'wiki/soundtrack-library/audio-records.json';

/** Catalogs that list comic speech, voice previews, effects and ambience stored under the soundtrack library. */
export const COMIC_AUDIO_CATALOGS = [
  'wiki/comics-library/speech.json',
  'wiki/comics-library/provider-voices.json',
  'wiki/comics-library/sounds.json',
  'wiki/comics-library/voices.json',
  'wiki/soundtrack-library/comic-audio.json',
  // Comic audio Studio intake found before any comic catalog listed it (never the music sources.json).
  'wiki/soundtrack-library/comic-intake.json',
];

/**
 * Parse `text` as JSON and derive a lookup from it once per catalog text. The image manifest is ~15 MB; parsing it
 * per file made a hook take over a minute with a few thousand changed images (2026-10-11). Null when the
 * text does not parse. A small cache: hooks and checks read only a handful of catalogs per run.
 */
const derived = new Map();
function parsedOnce(text, kind, build) {
  let byKind = derived.get(text);
  if (!byKind) {
    if (derived.size >= 8) derived.delete(derived.keys().next().value);
    byKind = new Map();
    derived.set(text, byKind);
  }
  if (!byKind.has(kind)) {
    let value = null;
    try { value = build(JSON.parse(text)); } catch { value = null; }
    byKind.set(kind, value);
  }
  return byKind.get(kind);
}

/** Catalog reader over the work tree. Each file is read once per reader, so build one reader per run. */
export function diskReader(root) {
  const cache = new Map();
  return (rel) => {
    if (!cache.has(rel)) {
      let text = null;
      try { text = fs.readFileSync(path.join(root, rel), 'utf8'); } catch { text = null; }
      cache.set(rel, text);
    }
    return cache.get(rel);
  };
}

export const REGISTER_HINT = {
  image: 'register it (images-register procedure: maintain_library.py register, or `mtw register image`); Studio /m/images re-reads the catalog',
  audio: 'add it to wiki/soundtrack-library/sources.json via soundtrack intake (mtw-soundtrack skill) and run `soundtrack.mjs build` (comic speech/voice files: the comics-library speech.json or provider-voices.json record)',
};

/** Canonical homes for any media kind (same four homes as scripts/assets/check-asset-destination.mjs). */
export const CANONICAL_PREFIXES = ['wiki/image-library/', 'wiki/soundtrack-library/', 'wiki/comics-library/', 'wiki/journal/'];
/** Media that legitimately lives outside the canonical homes: site integration copies and skill assets. */
export const MEDIA_COPY_PREFIXES = ['site/', '.claude/skills/', '.codex/skills/'];

/** Repo-relative glob -> RegExp (`**` spans folders, `*` stays inside one segment). */
export function globRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') {
      i++;
      if (glob[i + 1] === '/') { i++; re += '(?:.*/)?'; } else re += '.*';
    } else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else re += /[.+^${}()|[\]\\]/.test(c) ? `\\${c}` : c;
  }
  return new RegExp(`^${re}$`);
}

/** Globs from scripts/assets/media-exempt.txt: media allowed outside the canonical homes (test fixtures). */
export function mediaExemptions(root) {
  try {
    return fs.readFileSync(path.join(root, 'scripts', 'assets', 'media-exempt.txt'), 'utf8')
      .split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map(globRegExp);
  } catch { return []; }
}

/**
 * True when `rel` may hold media outside a canonical home without a master check: skill assets or a listed exemption.
 * (site/ copies are allowed by pre-commit.)
 */
export function isExemptMedia(rel, root, exemptions = mediaExemptions(root)) {
  return ['.claude/skills/', '.codex/skills/'].some((p) => rel.startsWith(p)) || exemptions.some((re) => re.test(rel));
}

const masterIndex = new Map();
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** `a-b-c` -> [`a-b-c`, `a-b`, `a`]: website names add size or hash suffixes, so shorten until a master matches. */
function stems(name, max = 3) {
  const out = [name];
  let s = name;
  for (let i = 0; i < max; i++) {
    const cut = s.lastIndexOf('-');
    if (cut <= 0) break;
    s = s.slice(0, cut);
    out.push(s);
  }
  return out;
}

/**
 * True when a site/ media file is a website copy or resized derivative of a registered library master (the reverse
 * of the Images module's integration mapping, apps/mtw/modules/images/server/integration.ts):
 *   site/public/comic/<story>/[<folder>/]<stem>-<width>.<ext>   <- assets/scenes/comic-b/**\/<stem>[-vN].<ext>
 *   site/public/images/_optimized/journal/<id>-<width>.<ext>    <- assets/scenes/journal/<id>[-vN].<ext>
 *   site/src/assets/image-sources/journal/<id>.<ext>             <- assets/scenes/journal/<id>[-vN].<ext>
 *   site/public/images/<style>/<id>.svg, site/src/assets/image-sources/<style>/<id>.<ext>  <- a record with logicalId <id>
 * Derivatives never byte-match their master, so this is a name lookup; byte-identical copies are checked separately.
 */
export function hasLibraryMaster(rel, readText) {
  const text = readText('wiki/image-library/manifest.json');
  if (!text) return false;
  const base = path.posix.basename(rel).replace(/\.[^.]+$/, '');
  // Search only the quoted scene asset paths and logicalIds, extracted once per manifest text, not all 15 MB per file.
  let index = masterIndex.get(text);
  if (!index) {
    index = {
      scenes: (text.match(/"assets\/scenes\/(?:comic-b|journal)\/[^"]*"/gi) ?? []).join('\n'),
      logicalIds: new Set([...text.matchAll(/"logicalId": ?"([^"]*)"/g)].map((x) => x[1])),
    };
    masterIndex.clear();
    masterIndex.set(text, index);
  }
  const masterIn = (folderRe, name) => new RegExp(`"assets/${folderRe}${escapeRe(name)}(?:-v\\d+)?\\.[a-z0-9]+"`, 'i').test(index.scenes);
  let m = /^site\/public\/comic\/[^/]+\/(?:[^/]+\/)*[^/]+$/.exec(rel); // live art sits in subfolders (live-20261010/)
  if (m) return stems(base).some((s) => masterIn('scenes/comic-b/(?:[^"]*/)?', s));
  if (/^site\/(?:public\/images\/_optimized|src\/assets\/image-sources)\/journal\//.test(rel)) return stems(base).some((s) => masterIn('scenes/journal/', s));
  m = /^site\/(?:public\/images|src\/assets\/image-sources)\/[^/]+\/([^/]+)\.[a-z0-9]+$/i.exec(rel);
  if (m) return index.logicalIds.has(m[1]);
  return false;
}
