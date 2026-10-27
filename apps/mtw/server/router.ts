import type { Handler, Router } from '../modules/types';

/** The only root paths a module may mount (legacy external callers). */
export const ROOT_POST_ALLOWLIST = ['/api/track', '/api/collected'];

export class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

interface Route {
  method: string;
  pattern: RegExp;
  keys: string[];
  handler: Handler;
  cors?: string;
}

/** A tiny method + path-pattern table (`/terminals/:id/kill`). Registration order decides ties. */
export class ApiRouter implements Router {
  private routes: Route[] = [];

  constructor(private prefix = '') {}

  private add(method: string, path: string, handler: Handler, cors?: string): void {
    const keys: string[] = [];
    const source = `${this.prefix}${path}`
      .replace(/\/+$/, '')
      .split('/')
      .map((seg) => {
        if (seg.startsWith(':')) {
          keys.push(seg.slice(1));
          return '([^/]+)';
        }
        return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      })
      .join('/');
    this.routes.push({ method, pattern: new RegExp(`^${source}/?$`), keys, handler, ...(cors ? { cors } : {}) });
  }

  get(path: string, handler: Handler): void {
    this.add('GET', path, handler);
  }

  post(path: string, handler: Handler): void {
    this.add('POST', path, handler);
  }

  rootPost(path: string, handler: Handler, opts: { cors?: string } = {}): void {
    if (!ROOT_POST_ALLOWLIST.includes(path)) throw new Error(`rootPost: ${path} is not in the core allowlist (${ROOT_POST_ALLOWLIST.join(', ')})`);
    if (this.routes.some((r) => r.method === 'POST' && r.pattern.test(path))) throw new Error(`rootPost: ${path} is already routed`);
    // Registered on the shared table with no module prefix.
    const root = new ApiRouter('');
    root.routes = this.routes;
    root.add('POST', path, handler, opts.cors);
    if (opts.cors) {
      const origin = opts.cors;
      root.add('OPTIONS', path, () => ({ __raw: true, status: 204, headers: { 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '600' } }), origin);
    }
  }

  /** A router whose paths are mounted under `prefix`, sharing this router's table. */
  mount(prefix: string): Router {
    const parent = this;
    const child = new ApiRouter(`${this.prefix}${prefix}`);
    child.routes = parent.routes;
    return child;
  }

  match(method: string, pathname: string): { handler: Handler; params: Record<string, string>; cors?: string } | null {
    for (const route of this.routes) {
      if (route.method !== method) continue;
      const m = route.pattern.exec(pathname);
      if (!m) continue;
      const params: Record<string, string> = {};
      route.keys.forEach((key, i) => (params[key] = decodeURIComponent(m[i + 1] as string)));
      return { handler: route.handler, params, ...(route.cors ? { cors: route.cors } : {}) };
    }
    return null;
  }
}
