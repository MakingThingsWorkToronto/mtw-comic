// Comic Editor: the proxy URL form shared by the client (iframe src) and the server (HTML rewrite). New for the MTW app.
export const PROXY_PATH = '/api/comics/editor/site';

/** The query-string form of a site path, e.g. `/comic/x.svg?v=1` -> `/api/comics/editor/site?u=%2Fcomic%2Fx.svg&v=1`. */
export function proxied(sitePath: string, base = PROXY_PATH): string {
  const q = sitePath.indexOf('?');
  const p = q < 0 ? sitePath : sitePath.slice(0, q);
  const rest = q < 0 ? '' : `&${sitePath.slice(q + 1)}`;
  return `${base}?u=${encodeURIComponent(p)}${rest}`;
}
