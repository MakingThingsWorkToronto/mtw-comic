import type { ServerResponse } from 'node:http';
import type { EventBus } from '../../modules/types';

/** Fan-out of server events to SSE clients (/api/events) and in-process listeners. */
export class Events implements EventBus {
  private clients = new Set<ServerResponse>();
  private listeners = new Set<(type: string, data: unknown) => void>();

  emit(type: string, data: unknown): void {
    const frame = `event: ${type}\ndata: ${JSON.stringify(data ?? null)}\n\n`;
    for (const res of this.clients) res.write(frame);
    for (const fn of this.listeners) fn(type, data);
  }

  on(fn: (type: string, data: unknown) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Attach an SSE response. Sends a comment heartbeat so proxies keep the stream open. */
  attach(res: ServerResponse, hello: Record<string, unknown> = {}): void {
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache, no-transform', connection: 'keep-alive' });
    res.write(': connected\n\n');
    this.clients.add(res);
    for (const [type, data] of Object.entries(hello)) res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
    const beat = setInterval(() => res.write(': hb\n\n'), 25000);
    res.on('close', () => {
      clearInterval(beat);
      this.clients.delete(res);
    });
  }

  closeAll(): void {
    for (const res of this.clients) res.end();
    this.clients.clear();
  }
}
