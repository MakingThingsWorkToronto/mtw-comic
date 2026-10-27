// Pure URL scheme: /m/<module>/<view>/<id>?filters. "/" is Home. No signals here so it can be tested in node.
export interface ParsedRoute {
  /** null on Home or an unknown top-level path. */
  module: string | null;
  /** Path segments after /m/<module>/. */
  path: string[];
  query: URLSearchParams;
}

export function parseLocation(pathname: string, search = ''): ParsedRoute {
  const query = new URLSearchParams(search);
  const segments = pathname.split('/').filter(Boolean).map((s) => decodeURIComponent(s));
  if (segments[0] === 'm' && segments[1]) return { module: segments[1], path: segments.slice(2), query };
  return { module: null, path: [], query };
}

export function buildUrl(module: string | null, path: string[] = [], query?: URLSearchParams | Record<string, string>): string {
  const base = module ? `/m/${[module, ...path].map(encodeURIComponent).join('/')}` : '/';
  const qs = query instanceof URLSearchParams ? query.toString() : new URLSearchParams(query ?? {}).toString();
  return qs ? `${base}?${qs}` : base;
}
