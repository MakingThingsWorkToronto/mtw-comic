import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import { startApp } from '../server/app';
import type { RunningApp } from '../server/app';

const appRoot = fileURLToPath(new URL('..', import.meta.url));
const repoRoot = path.resolve(appRoot, '..', '..');

let app: RunningApp;
beforeAll(async () => {
  app = await startApp({ repoRoot, appRoot, port: 0 });
});
afterAll(async () => {
  await app.close();
});

const base = () => `http://127.0.0.1:${app.port}`;
const json = async <T>(url: string, init?: RequestInit): Promise<T> => (await fetch(`${base()}${url}`, init)).json() as Promise<T>;

describe('server', () => {
  it('serves /api/modules and the operations list', async () => {
    const modules = await json<{ id: string; nav: { label: string } }[]>('/api/modules');
    expect(modules.map((m) => m.id)).toContain('operations');
    const ops = await json<{ id: string }[]>('/api/operations');
    expect(ops.map((o) => o.id)).toEqual(expect.arrayContaining(['wiki-graph-check', 'asset-destination-check']));
    expect((await fetch(`${base()}/api/nope`)).status).toBe(404);
  });

  it('refuses a foreign Host header', async () => {
    const res = await new Promise<number>((resolve, reject) => {
      import('node:http').then(({ default: http }) => {
        const req = http.request({ host: '127.0.0.1', port: app.port, path: '/api/health', headers: { host: 'evil.example' } }, (r) => resolve(r.statusCode ?? 0));
        req.on('error', reject);
        req.end();
      }, reject);
    });
    expect(res).toBe(403);
  });

  it('spawns a shell terminal, streams output over the WebSocket, then kills it', async () => {
    const info = await json<{ id: string; pid: number; status: string }>('/api/terminals', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ runner: 'shell', title: 'test shell' }),
    });
    expect(info, JSON.stringify(info)).toMatchObject({ status: 'running' });
    expect(info.pid).toBeGreaterThan(0);

    const ws = new WebSocket(`ws://127.0.0.1:${app.port}/ws/terminal/${info.id}`);
    let output = '';
    let exited = false;
    ws.on('message', (raw) => {
      const frame = JSON.parse(String(raw)) as { type: string; data?: string };
      if (frame.type === 'replay' || frame.type === 'output') output += frame.data ?? '';
      if (frame.type === 'exit') exited = true;
    });
    await new Promise<void>((resolve, reject) => {
      ws.once('open', () => resolve());
      ws.once('error', reject);
    });
    ws.send(JSON.stringify({ type: 'resize', cols: 100, rows: 30 }));

    const until = async (cond: () => boolean, ms: number, what: string) => {
      const end = Date.now() + ms;
      while (!cond()) {
        if (Date.now() > end) throw new Error(`timed out waiting for ${what}; output so far: ${JSON.stringify(output.slice(-300))}`);
        await new Promise((r) => setTimeout(r, 100));
      }
    };
    // Give the shell time to start, then type a command whose result differs from its echo.
    await new Promise((r) => setTimeout(r, 1500));
    ws.send(JSON.stringify({ type: 'input', data: 'echo mtw$((20+22))\r' }));
    // PowerShell: $((...)) also evaluates; bash does too.
    await until(() => /mtw42/.test(output), 20000, 'command output');

    expect((await json<{ id: string }[]>('/api/terminals')).some((t) => t.id === info.id)).toBe(true);
    const killed = await json<{ ok: boolean }>(`/api/terminals/${info.id}/kill`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    expect(killed.ok).toBe(true);
    await until(() => exited, 15000, 'exit frame');
    await until(() => app.core.terminals.get(info.id)?.status === 'exited', 5000, 'exited status');
    ws.close();
  });
});
