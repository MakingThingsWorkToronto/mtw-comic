// Shared byte-range file serving for module handlers (images, audio, comics media).
// Modules call `services.media.serve(abs, req.headers, { allowRoots })` and return the result; the core writes it.
import { createReadStream, promises as fs } from 'node:fs';
import path from 'node:path';
import type { MediaService, RawResponse } from '../../modules/types';

export const CONTENT_TYPES: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.flac': 'audio/flac',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.json': 'application/json; charset=utf-8',
  '.jsonl': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.html': 'text/plain; charset=utf-8', // never let a served file run as a page on the app origin
  '.pdf': 'application/pdf',
};

/** Parse a single `bytes=a-b` range. null = serve whole file, 'bad' = unsatisfiable (416). */
export function parseRange(header: string | undefined, size: number): { start: number; end: number } | null | 'bad' {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m) return null;
  const [, a = '', b = ''] = m;
  if (a === '' && b === '') return 'bad';
  let start: number;
  let end: number;
  if (a === '') {
    const n = Number(b);
    if (n === 0) return 'bad';
    start = Math.max(0, size - n);
    end = size - 1;
  } else {
    start = Number(a);
    end = b === '' ? size - 1 : Math.min(Number(b), size - 1);
  }
  if (start >= size || start > end) return 'bad';
  return { start, end };
}

const inside = (root: string, file: string): boolean => {
  const rel = path.relative(root, file);
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
};

const header = (h: Record<string, string | string[] | undefined>, name: string): string | undefined => {
  const v = h[name];
  return Array.isArray(v) ? v[0] : v;
};

const plain = (status: number, message: string): RawResponse => ({
  __raw: true,
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  body: JSON.stringify({ error: message }),
});

export const media: MediaService = {
  async serve(absPath, reqHeaders, opts) {
    const target = path.resolve(absPath);
    let real: string;
    try {
      real = await fs.realpath(target);
    } catch {
      return plain(404, 'not found');
    }
    // Allow-list: the resolved real path (symlinks followed) must sit under one of the given roots.
    const roots = await Promise.all(opts.allowRoots.map((r) => fs.realpath(path.resolve(r)).catch(() => path.resolve(r))));
    if (!roots.some((r) => inside(r, real))) return plain(403, 'path not allowed');
    let stat;
    try {
      stat = await fs.stat(real);
    } catch {
      return plain(404, 'not found');
    }
    if (!stat.isFile()) return plain(404, 'not found');

    const type = opts.contentType ?? CONTENT_TYPES[path.extname(real).toLowerCase()] ?? 'application/octet-stream';
    const etag = `W/"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
    const base: Record<string, string> = {
      'content-type': type,
      'accept-ranges': 'bytes',
      etag,
      'last-modified': stat.mtime.toUTCString(),
      // Files change under the app (agents write them); revalidate every time, cheaply.
      'cache-control': opts.cacheControl ?? 'private, max-age=0, must-revalidate',
      'x-content-type-options': 'nosniff',
    };
    if (header(reqHeaders, 'if-none-match') === etag) return { __raw: true, status: 304, headers: base };

    const range = parseRange(header(reqHeaders, 'range'), stat.size);
    if (range === 'bad') return { __raw: true, status: 416, headers: { ...base, 'content-range': `bytes */${stat.size}` } };
    if (range) {
      return {
        __raw: true,
        status: 206,
        headers: { ...base, 'content-range': `bytes ${range.start}-${range.end}/${stat.size}`, 'content-length': String(range.end - range.start + 1) },
        stream: createReadStream(real, { start: range.start, end: range.end }),
      };
    }
    return { __raw: true, status: 200, headers: { ...base, 'content-length': String(stat.size) }, stream: createReadStream(real) };
  },
};
