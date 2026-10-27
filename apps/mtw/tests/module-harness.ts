// Test harness for module builders: the app's API router plus the given modules registered over a throwaway repo copy,
// served on a loopback port. Services can be overridden (fake terminals/operations) so tests never spawn an agent.
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ServerModule, Services } from '../modules/types';
import { createCore } from '../server/core/services';
import type { Core } from '../server/core/services';
import { modelFor } from '../server/core/prompts';
import { ApiRouter, HttpError } from '../server/router';

const appRoot = fileURLToPath(new URL('..', import.meta.url));

export interface ModuleHarness {
  url: string;
  core: Core;
  services: Services;
  close(): Promise<void>;
  get<T = any>(p: string): Promise<T>;
  post<T = any>(p: string, body?: unknown): Promise<{ status: number; body: T }>;
}

export async function startModules(repoRoot: string, modules: ServerModule[], overrides: Partial<Services> = {}): Promise<ModuleHarness> {
  const core = createCore(repoRoot, appRoot);
  const services = { ...core, ...overrides } as Services;
  const api = new ApiRouter();
  for (const m of modules) await m.register?.(api.mount(`/api/${m.meta.id}`), services);
  const server = http.createServer((req, res) => {
    void (async () => {
      const url = new URL(req.url ?? '/', 'http://localhost');
      try {
        const hit = api.match(req.method ?? 'GET', url.pathname);
        if (!hit) {
          res.writeHead(404, { 'content-type': 'application/json' });
          return void res.end('{"error":"not found"}');
        }
        let body: unknown;
        if (req.method === 'POST') {
          const chunks: Buffer[] = [];
          for await (const c of req) chunks.push(c as Buffer);
          const text = Buffer.concat(chunks).toString('utf8');
          body = text.trim() ? JSON.parse(text) : undefined;
        }
        const out = (await hit.handler({ params: hit.params, query: url.searchParams, body, headers: req.headers, method: req.method ?? 'GET' })) ?? null;
        if (out && typeof out === 'object' && (out as { __raw?: boolean }).__raw) {
          const raw = out as { status?: number; headers?: Record<string, string>; file?: string; body?: string | Uint8Array };
          res.writeHead(raw.status ?? 200, raw.headers ?? {});
          if (raw.file) {
            const { createReadStream } = await import('node:fs');
            createReadStream(raw.file).pipe(res);
          } else res.end(raw.body);
          return;
        }
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify(out));
      } catch (error) {
        const status = error instanceof HttpError ? error.status : 500;
        if (!res.headersSent) res.writeHead(status, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: (error as Error).message }));
      }
    })();
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as net.AddressInfo).port;
  const url = `http://127.0.0.1:${port}`;
  return {
    url,
    core,
    services,
    get: async (p) => (await fetch(`${url}${p}`)).json() as Promise<any>,
    post: async (p, body) => {
      const r = await fetch(`${url}${p}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body ?? {}) });
      return { status: r.status, body: (await r.json()) as any };
    },
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
}

/** A launcher that records calls instead of spawning an agent. Lists the real prompt files. */
/** `model`/`effort` are what the real launcher would start the terminal with: the explicit choice, else the procedure's entry for the runner. */
export type FakeLaunch = { id: string; params: Record<string, string>; runner?: string; permission?: string; model?: string; effort?: string };
export function fakeLaunchers(core: Core): { overrides: Partial<Services>; launches: FakeLaunch[] } {
  const launches: FakeLaunch[] = [];
  const operations = {
    list: (module?: string) => core.operations.list(module),
    launch: async (id: string, params: Record<string, string>, runner?: string, permission?: string, _prompt?: string, choice?: { model?: string; effort?: string }) => {
      const def = (await core.operations.list()).find((d) => d.id === id);
      const dflt = def ? modelFor(def, runner ?? def.runner) : undefined;
      const model = choice?.model || dflt?.model;
      const effort = choice?.effort || dflt?.effort;
      launches.push({ id, params, ...(runner ? { runner } : {}), ...(permission ? { permission } : {}), ...(model ? { model } : {}), ...(effort ? { effort } : {}) });
      return { id: `t-fake${launches.length}`, runner: (runner ?? 'claude') as 'claude', title: id, operation: id, module: 'journal', pid: 1, startedAt: new Date().toISOString(), status: 'running' as const };
    },
  };
  return { overrides: { operations: operations as unknown as Services['operations'] }, launches };
}
void path;
