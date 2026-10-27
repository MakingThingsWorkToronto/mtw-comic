// Read-only media for previews and review crops, served by the core range-aware service from fixed allowed folders.
import path from 'node:path';
import type { MediaService, RawResponse } from '../../types';

const AUDIO = '(mp3|wav|ogg)';
const ALLOWED: RegExp[] = [
  new RegExp(`^wiki/soundtrack-library/assets/(voices|speech|sounds)/.+\\.${AUDIO}$`, 'i'),
  new RegExp(`^wiki/comics-library/assets/(voices|sounds)/.+\\.${AUDIO}$`, 'i'),
  /^wiki\/image-library\/assets\/.+\.(png|jpe?g|webp|svg)$/i,
  // Scene page art as the site ships it (read-only; site/ stays the owner).
  /^site\/public\/comic\/[a-z0-9-]+\/(?:[\w-][\w.-]*\/)*[\w.-]+\.(webp|avif|png|jpe?g)$/i,
];

export function mediaAllowed(repoPath: string): boolean {
  if (repoPath.includes('\\') || repoPath.split('/').some((s) => !s || s === '.' || s === '..')) return false;
  return ALLOWED.some((re) => re.test(repoPath));
}

const plain = (status: number, error: string): RawResponse => ({
  __raw: true,
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  body: JSON.stringify({ error }),
});

/** Serve one allowed repo path with byte ranges and revalidation (headers are the request's). */
export function serveMedia(media: MediaService, repoRoot: string, repoPath: string, headers: Record<string, string | string[] | undefined> = {}): Promise<RawResponse> {
  if (!mediaAllowed(repoPath)) return Promise.resolve(plain(403, 'path not allowed'));
  return media.serve(path.resolve(repoRoot, repoPath), headers, {
    allowRoots: [path.join(repoRoot, 'wiki'), path.join(repoRoot, 'site', 'public', 'comic')],
  });
}
