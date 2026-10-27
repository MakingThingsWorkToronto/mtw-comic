import { createReadStream, existsSync, statSync } from 'node:fs';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Duplex } from 'node:stream';
import path from 'node:path';
import { z } from 'zod';
import { WebSocketServer } from 'ws';
import type { WebSocket } from 'ws';
import { serverModules } from '../modules/server-registry';

import type { OtelKind } from './core/otel';
import { dashboardFor } from './core/dashboard';
import { buildHomeSummary } from './core/home';
import { IntakeService } from './core/intake';
import { createCore } from './core/services';
import type { Core } from './core/services';
import { ManifestWatcher } from './core/watcher';
import { ApiRouter, HttpError } from './router';
import { forwardSitePath, isSitePath } from './sitePassthrough';

export interface AppOptions {
  repoRoot: string;
  /** apps/mtw */
  appRoot: string;
  port: number;
  dev?: boolean;
  host?: string;
  /** Start auto-intake (wiki/operations/intake.json decides whether it is enabled). Default true. */
  intake?: boolean;
}

export interface RunningApp {
  server: http.Server;
  core: Core;
  port: number;
  url: string;
  close(): Promise<void>;
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
  '.ico': 'image/x-icon',
};

const spawnBody = z.object({
  runner: z.string().min(1),
  title: z.string().optional(),
  permission: z.string().optional(),
  model: z.string().optional(),
  effort: z.string().optional(),
});
const launchBody = z.object({
  params: z.record(z.string()).default({}),
  runner: z.string().min(1).optional(),
  permission: z.string().optional(),
  model: z.string().optional(),
  effort: z.string().optional(),
});
const decisionBody = z.object({
  actor: z.string().default('matt'),
  module: z.string(),
  subject: z.string(),
  action: z.string(),
  value: z.unknown().optional(),
  note: z.string().optional(),
});

function send(res: ServerResponse, status: number, body: unknown, extra: Record<string, string> = {}): void {
  const text = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra });
  res.end(text);
}

type RawLike = { __raw?: true; __mtwRaw?: true; status?: number; headers?: Record<string, string>; stream?: NodeJS.ReadableStream | null; file?: string; body?: string | Uint8Array };
const isRaw = (v: unknown): v is RawLike => typeof v === 'object' && v !== null && ((v as RawLike).__raw === true || (v as RawLike).__mtwRaw === true);

/** Write a handler's raw result as-is: status + headers, then a stream, a file or a body. */
function sendRaw(res: ServerResponse, r: RawLike, extra: Record<string, string> = {}): void {
  res.writeHead(r.status ?? 200, { ...(r.headers ?? {}), ...extra });
  if (r.stream) {
    r.stream.on('error', () => res.destroy());
    r.stream.pipe(res);
  } else if (r.file) {
    const s = createReadStream(r.file);
    s.on('error', () => res.destroy());
    s.pipe(res);
  } else res.end(r.body ?? undefined);
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > 1_000_000) throw new HttpError(413, 'request body too large');
    chunks.push(chunk as Buffer);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text.trim()) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, 'body is not valid JSON');
  }
}

/** Only loopback names may reach this server: a page on another origin cannot drive it via DNS rebinding. */
function hostAllowed(hostHeader: string | undefined): boolean {
  const host = (hostHeader ?? '').replace(/:\d+$/, '').replace(/^\[|\]$/g, '');
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

export function buildApiRouter(core: Core): ApiRouter {
  const api = new ApiRouter();
  const parse = <T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, body: unknown): T => {
    const r = schema.safeParse(body ?? {});
    if (!r.success) throw new HttpError(400, r.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; '));
    return r.data;
  };

  api.get('/api/health', () => ({ ok: true }));
  api.get('/api/modules', () => serverModules.map((m) => m.meta));
  api.get('/api/home', async () => {
    const home = await buildHomeSummary(serverModules, core);
    if (core.intake) {
      // Auto-intake rows (pending-human registrations, failures, agent misses) sit beside the module tiles.
      const entry = { id: 'intake', title: 'Registration', order: -1, href: '/m/images?collection=all&status=unreviewed', summarized: true, items: [] as Awaited<ReturnType<IntakeService['summaryItems']>> };
      try {
        entry.items = await core.intake.summaryItems();
        home.modules.unshift(entry);
      } catch (error) {
        home.modules.unshift({ ...entry, error: (error as Error).message });
      }
    }
    // The five-section dashboard; `modules` stays for older clients and module tiles.
    home.dashboard = await dashboardFor(core).build(home.modules);
    return home;
  });
  // Auto-intake: status for Home; reconcile lets an agent hand over its own files (it never waits).
  api.get('/api/intake/status', async () => {
    if (!core.intake) throw new HttpError(404, 'auto-intake is not running');
    return core.intake.status();
  });
  api.post('/api/intake/reconcile', async ({ body }) => {
    if (!core.intake) throw new HttpError(404, 'auto-intake is not running');
    const b = parse(z.object({ paths: z.array(z.string()).max(500).optional(), wait: z.boolean().default(false) }), body);
    const run = core.intake.reconcile('reconcile-request', b.paths);
    if (!b.wait) {
      run.catch(() => undefined);
      return { queued: true, paths: b.paths?.length ?? null };
    }
    const r = await run;
    return { queued: false, found: r.found, registered: r.registered, failed: r.failed, outcomes: r.outcomes };
  });

  api.get('/api/terminals', () => core.terminals.list());
  api.post('/api/terminals', ({ body }) => {
    const b = parse(spawnBody, body);
    if (b.permission && /bypass|dangerous/i.test(b.permission)) throw new HttpError(400, 'that permission mode is never offered from Studio');
    try {
      return core.terminals.spawn({ runner: b.runner, title: b.title ?? (b.runner === 'shell' ? 'Shell' : b.runner === 'claude' ? 'Claude' : 'Codex'), module: 'operations', ...(b.permission && b.permission !== 'default' ? { permission: b.permission } : {}), ...(b.model?.trim() ? { model: b.model.trim() } : {}), ...(b.effort?.trim() ? { effort: b.effort.trim() } : {}) });
    } catch (error) {
      throw new HttpError(400, (error as Error).message);
    }
  });
  api.get('/api/tokens/summary', () => core.terminals.usageSummary());
  // Read-only attribution for modules: "tokens spent" next to an item. e.g. ?module=journal&subject=2026-10-09-meat
  api.get('/api/tokens/by', ({ query }) => {
    const operation = query.get('operation') ?? undefined;
    const module = query.get('module') ?? undefined;
    const subject = query.get('subject') ?? undefined;
    if (!operation && !module && !subject) throw new HttpError(400, 'give operation=, module= and/or subject=');
    return core.terminals.tokensBy({ operation, module, subject });
  });
  api.get('/api/tokens/plan-limits', () => core.terminals.latestPlanLimits() ?? { primary: null, secondary: null });
  api.get('/api/tokens/pricing', () => core.terminals.pricing.get());
  api.post('/api/terminals/:id/kill', ({ params }) => {
    if (!core.terminals.get(params.id as string)) throw new HttpError(404, 'unknown terminal');
    core.terminals.kill(params.id as string);
    return { ok: true };
  });

  api.get('/api/operations', async ({ query }) => core.operations.list(query.get('module') ?? undefined));
  api.post('/api/operations/:id/launch', async ({ params, body }) => {
    const b = parse(launchBody, body);
    try {
      return await core.operations.launch(params.id as string, b.params, b.runner, b.permission, undefined, { model: b.model, effort: b.effort });
    } catch (error) {
      throw new HttpError(400, (error as Error).message);
    }
  });

  api.get('/api/assets', () => core.assets.prefixes());
  api.get('/api/assets/resolve', async ({ query }) => {
    const ref = query.get('ref');
    if (!ref) throw new HttpError(400, 'ref is required');
    const found = await core.assets.resolve(ref);
    if (!found) throw new HttpError(404, 'asset not found');
    return found;
  });
  api.get('/api/assets/:prefix', async ({ params, query }) => {
    const resolver = core.assets.resolver(params.prefix as string);
    if (!resolver) throw new HttpError(404, `no resolver for ${params.prefix}`);
    return resolver.list({
      ...(query.get('q') ? { q: query.get('q') as string } : {}),
      limit: Number(query.get('limit') ?? 50),
      offset: Number(query.get('offset') ?? 0),
    });
  });

  api.get('/api/decisions/:lib', async ({ params, query }) => {
    try {
      return await core.decisions.list(params.lib as string, {
        ...(query.get('since') ? { since: query.get('since') as string } : {}),
        ...(query.get('subject') ? { subject: query.get('subject') as string } : {}),
      });
    } catch (error) {
      throw new HttpError(400, (error as Error).message);
    }
  });
  api.post('/api/decisions/:lib', async ({ params, body }) => {
    const b = parse(decisionBody, body);
    try {
      return await core.decisions.append(params.lib as string, b);
    } catch (error) {
      throw new HttpError(400, (error as Error).message);
    }
  });
  return api;
}

export async function startApp(opts: AppOptions): Promise<RunningApp> {
  const { repoRoot, appRoot, dev = false, host = '127.0.0.1' } = opts;
  const core = createCore(repoRoot, appRoot);
  const api = buildApiRouter(core);
  for (const m of serverModules) await m.register?.(api.mount(`/api/${m.meta.id}`), core);

  const webDist = path.join(appRoot, 'dist', 'web');
  let vite: import('vite').ViteDevServer | null = null;

  const serveStatic = (req: IncomingMessage, res: ServerResponse, pathname: string): void => {
    let file = path.join(webDist, decodeURIComponent(pathname));
    const inside = path.relative(webDist, file);
    if (inside.startsWith('..') || path.isAbsolute(inside)) return void send(res, 403, { error: 'forbidden' });
    if (!existsSync(file) || statSync(file).isDirectory()) {
      if (path.extname(pathname) && !pathname.startsWith('/m/')) return void send(res, 404, { error: 'not found' });
      file = path.join(webDist, 'index.html'); // SPA fallback (/m/*, /)
      if (!existsSync(file)) return void send(res, 404, { error: 'web build not found; run npm run build' });
    }
    const ext = path.extname(file);
    res.writeHead(200, {
      'content-type': MIME[ext] ?? 'application/octet-stream',
      'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    });
    createReadStream(file).pipe(res);
  };

  const server = http.createServer((req, res) => {
    void (async () => {
      try {
        if (!hostAllowed(req.headers.host)) return send(res, 403, { error: 'host not allowed' });
        const url = new URL(req.url ?? '/', 'http://localhost');
        if (url.pathname === '/api/events') {
          core.events.attach(res, { terminal: core.terminals.list() });
          return;
        }
        const prompt = /^\/api\/terminals\/([\w-]+)\/prompt\.md$/.exec(url.pathname);
        if (prompt && req.method === 'GET') {
          const file = core.terminals.promptFile(prompt[1] as string);
          if (!file) return send(res, 404, { error: 'no prompt file for this terminal' });
          res.writeHead(200, { 'content-type': 'text/markdown; charset=utf-8', 'cache-control': 'no-store', 'content-disposition': 'inline' });
          createReadStream(file).pipe(res);
          return;
        }
        // OTLP/HTTP receiver (JSON). Same loopback Host check as everything else; exporters post to 127.0.0.1:<port>.
        const otlp = /^\/v1\/(metrics|logs|traces)$/.exec(url.pathname);
        if (otlp) {
          if (req.method !== 'POST') return send(res, 405, { error: 'method not allowed' });
          const chunks: Buffer[] = [];
          let size = 0;
          for await (const chunk of req) {
            size += (chunk as Buffer).length;
            if (size > 16_000_000) return send(res, 413, { error: 'payload too large' });
            chunks.push(chunk as Buffer);
          }
          const out = core.terminals.otel.handle(otlp[1] as OtelKind, req.headers['content-type'], Buffer.concat(chunks), String(req.headers['content-encoding'] ?? ''));
          return send(res, out.status, out.body);
        }
        if (url.pathname.startsWith('/api/')) {
          const hit = api.match(req.method ?? 'GET', url.pathname);
          if (!hit) return send(res, 404, { error: 'not found' });
          const body = req.method === 'POST' ? await readBody(req) : undefined;
          const cors: Record<string, string> = hit.cors ? { 'access-control-allow-origin': hit.cors, vary: 'Origin' } : {};
          const result = await hit.handler({ params: hit.params, query: url.searchParams, body, headers: req.headers, method: req.method ?? 'GET' });
          if (isRaw(result)) return sendRaw(res, result, cors);
          return send(res, 200, result ?? null, cors);
        }
        // The framed site reader's own assets (art, music, rooms, fonts, scripts) come from the site preview.
        if ((req.method === 'GET' || req.method === 'HEAD') && isSitePath(url.pathname)) return void (await forwardSitePath(repoRoot, req, res, url.pathname, url.search));
        if (vite) return void vite.middlewares(req, res, () => send(res, 404, { error: 'not found' }));
        if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'method not allowed' });
        serveStatic(req, res, url.pathname);
      } catch (error) {
        const status = error instanceof HttpError ? error.status : 500;
        if (!res.headersSent) send(res, status, { error: (error as Error).message });
        else res.end();
      }
    })();
  });

  // Terminal sockets: noServer upgrade on the same http server. Anything else is left to Vite's HMR in dev.
  const wss = new WebSocketServer({ noServer: true });
  server.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const m = /^\/ws\/terminal\/([\w-]+)$/.exec(url.pathname);
    if (!m) {
      if (!dev) socket.destroy();
      return;
    }
    const origin = req.headers.origin;
    if (!hostAllowed(req.headers.host) || (origin && !hostAllowed(new URL(origin).host))) return void socket.destroy();
    wss.handleUpgrade(req, socket, head, (ws) => attachTerminal(ws, core, m[1] as string));
  });

  if (dev) {
    const { createServer } = await import('vite');
    vite = await createServer({
      root: path.join(appRoot, 'web'),
      configFile: path.join(appRoot, 'vite.config.ts'),
      appType: 'spa',
      server: { middlewareMode: true, hmr: { server } },
    });
  }

  const watcher = new ManifestWatcher(repoRoot, core.wiki, core.events);
  watcher.start(serverModules.map((m) => m.meta));

  if (opts.intake !== false) {
    const withIntake = serverModules.flatMap((m) => (m.intake ? [{ id: m.meta.id, intake: m.intake(core) }] : []));
    core.intake = new IntakeService({ repoRoot, stateDir: core.stateDir ?? path.join(appRoot, '.state'), decisions: core.decisions, events: core.events, modules: withIntake });
    await core.intake.start();
  }

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(opts.port, host, resolve);
  });
  const port = (server.address() as { port: number }).port;
  core.terminals.setPort(port);

  return {
    server,
    core,
    port,
    url: `http://${host === '127.0.0.1' ? '127.0.0.1' : host}:${port}/`,
    async close() {
      watcher.stop();
      core.intake?.stop();
      await core.terminals.shutdown();
      core.events.closeAll();
      for (const client of wss.clients) client.terminate();
      wss.close();
      await vite?.close();
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}

function attachTerminal(ws: WebSocket, core: Core, id: string): void {
  const sendJson = (value: unknown): void => {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(value));
  };
  const handle = core.terminals.attach(id, (frame) => sendJson(frame));
  if (!handle) {
    sendJson({ type: 'error', message: 'unknown terminal' });
    ws.close();
    return;
  }
  sendJson({ type: 'replay', data: handle.replay });
  if (handle.exit !== undefined) sendJson({ type: 'exit', exitCode: handle.exit });
  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(String(raw)) as { type?: string; data?: string; cols?: number; rows?: number };
      if (msg.type === 'input' && typeof msg.data === 'string') core.terminals.write(id, msg.data);
      else if (msg.type === 'resize') core.terminals.resize(id, Number(msg.cols), Number(msg.rows));
    } catch {
      /* ignore malformed frames */
    }
  });
  ws.on('close', handle.detach);
}
