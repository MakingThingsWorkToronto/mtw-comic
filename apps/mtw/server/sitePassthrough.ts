// The site reader framed inside Studio (Comic review, Comic Editor) loads its art, music, room tones, fonts and scripts
// from root paths it builds in script (`/comic/...`, `/audio/...`), which the HTML-rewriting site proxy cannot see.
// Studio owns none of these folders, so GET/HEAD requests for them are forwarded to the site preview named in
// wiki/operations/editor.json (siteBaseUrl), with Range for audio seeking. Only loopback bases are used.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

/** The site's public top-level folders the reader loads from (site/public). */
export const SITE_ROOTS = ['comic', 'audio', 'fonts', 'images', 'marks', 'scripts'] as const;

/** Pure: whether a request path belongs to the site rather than Studio. */
export function isSitePath(pathname: string): boolean {
  const first = pathname.split('/')[1] ?? '';
  return (SITE_ROOTS as readonly string[]).includes(first) && !pathname.includes('..') && !pathname.includes(String.fromCharCode(92));
}

/** Pure: the loopback site base from editor.json's text, or null. */
export function siteBase(configText: string | null): string | null {
  try {
    const url = new URL(String((JSON.parse(configText ?? '{}') as { siteBaseUrl?: unknown }).siteBaseUrl ?? ''));
    return (url.hostname === '127.0.0.1' || url.hostname === 'localhost') && url.protocol === 'http:' ? url.origin : null;
  } catch {
    return null;
  }
}

export async function forwardSitePath(repoRoot: string, req: IncomingMessage, res: ServerResponse, pathname: string, search: string): Promise<void> {
  let text: string | null = null;
  try {
    text = readFileSync(path.join(repoRoot, 'wiki', 'operations', 'editor.json'), 'utf8');
  } catch {
    /* no config: not available */
  }
  const base = siteBase(text);
  if (!base) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    return void res.end('No site preview is configured (wiki/operations/editor.json siteBaseUrl).');
  }
  const headers: Record<string, string> = { accept: String(req.headers.accept ?? '*/*') };
  if (req.headers.range) headers.range = String(req.headers.range);
  let upstream: Response;
  try {
    upstream = await fetch(new URL(pathname + search, base), { method: req.method === 'HEAD' ? 'HEAD' : 'GET', headers, redirect: 'manual' });
  } catch {
    res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
    return void res.end(`The site preview is not reachable at ${base}.`);
  }
  const out: Record<string, string> = { 'cache-control': 'no-store' };
  for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'last-modified', 'etag']) {
    const v = upstream.headers.get(h);
    if (v) out[h] = v;
  }
  res.writeHead(upstream.status, out);
  if (req.method === 'HEAD' || !upstream.body) return void res.end();
  res.end(Buffer.from(await upstream.arrayBuffer()));
}
