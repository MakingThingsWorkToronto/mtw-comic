// Built-in OTLP/HTTP JSON receiver: /v1/metrics, /v1/logs, /v1/traces on the app's own port.
// Replaces a separate collector stack. Claude Code exports token/cost metrics and api_request/tool_result log events;
// each export is mapped to a terminal by the resource attribute mtw.terminal_id (injected through runners.json `env`),
// or by session.id. Per-terminal totals live in memory and in .state/runs/<id>/otel.json; raw tool/api events are
// appended to .state/runs/<id>/otel-events.jsonl. Protobuf is refused with 415 (the runner env asks for http/json).
import { appendFileSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
import type { TokenTotals } from '../../modules/types';
import { totalsFrom } from './tokens';
import type { Usage } from './tokens';

export type OtelKind = 'metrics' | 'logs' | 'traces';
export const OTEL_KINDS: OtelKind[] = ['metrics', 'logs', 'traces'];
const TERMINAL_ID = /^t-[0-9a-f]{8}$/;

type AttrValue = string | number | boolean;
interface KeyValue {
  key: string;
  value?: { stringValue?: string; intValue?: string | number; doubleValue?: number; boolValue?: boolean };
}
function attrs(list: KeyValue[] | undefined): Record<string, AttrValue> {
  const out: Record<string, AttrValue> = {};
  for (const kv of list ?? []) {
    const v = kv.value;
    if (!v) continue;
    if (v.stringValue !== undefined) out[kv.key] = v.stringValue;
    else if (v.intValue !== undefined) out[kv.key] = Number(v.intValue);
    else if (v.doubleValue !== undefined) out[kv.key] = v.doubleValue;
    else if (v.boolValue !== undefined) out[kv.key] = v.boolValue;
  }
  return out;
}
const n = (v: unknown): number => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

class Accum {
  /** metric series keyed by name|type|session|model; delta points add, cumulative points replace. */
  series = new Map<string, number>();
  tokenSeries = new Set<string>();
  costSeries = new Set<string>();
  logUsage: Usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
  logCost = 0;
  logRequests = 0;
  model: string | undefined;
  updatedAt = '';

  totals(): TokenTotals | null {
    const u: Usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
    let cost = 0;
    for (const key of this.tokenSeries) {
      const type = key.split('|')[1];
      const v = this.series.get(key) ?? 0;
      if (type === 'input') u.input += v;
      else if (type === 'output') u.output += v;
      else if (type === 'cacheRead') u.cacheRead += v;
      else if (type === 'cacheCreation') u.cacheWrite += v;
    }
    for (const key of this.costSeries) cost += this.series.get(key) ?? 0;
    if (u.input + u.output + u.cacheRead + u.cacheWrite > 0) return totalsFrom(u, { model: this.model, costUsd: cost || this.logCost || undefined, source: 'otel' });
    const lu = this.logUsage;
    if (lu.input + lu.output + lu.cacheRead + lu.cacheWrite > 0) return totalsFrom(lu, { model: this.model, costUsd: this.logCost || undefined, source: 'otel' });
    return null;
  }
}

export interface OtelReceiverOptions {
  stateDir: string;
  /** Resolve a Claude session id to a terminal id when mtw.terminal_id is absent. */
  terminalForSession?: (sessionId: string) => string | undefined;
  /** MTW_OTEL_FORWARD: re-post every raw payload to an external collector (fire and forget). */
  forwardUrl?: string | undefined;
  onUpdate?: (terminalId: string) => void;
  warn?: (message: string) => void;
}

export class OtelReceiver {
  private accums = new Map<string, Accum>();
  private dirty = new Set<string>();
  private timer: NodeJS.Timeout | null = null;
  private warned = new Set<string>();
  unmatched = 0;
  received = 0;

  constructor(private opts: OtelReceiverOptions) {}

  totals(terminalId: string): TokenTotals | null {
    return this.accums.get(terminalId)?.totals() ?? null;
  }

  /** Returns the HTTP status and JSON body to send. */
  handle(kind: OtelKind, contentType: string | undefined, raw: Buffer, encoding?: string): { status: number; body: unknown } {
    const type = (contentType ?? '').split(';')[0]?.trim().toLowerCase();
    if (type !== 'application/json') {
      this.warnOnce(`type:${type}`, `[otel] refused ${type || 'unknown content type'} on /v1/${kind}: only OTLP JSON is accepted (set OTEL_EXPORTER_OTLP_PROTOCOL=http/json)`);
      return { status: 415, body: { error: 'only application/json (OTLP/HTTP JSON) is accepted' } };
    }
    let text: string;
    try {
      text = (encoding === 'gzip' ? gunzipSync(raw) : raw).toString('utf8');
    } catch {
      return { status: 400, body: { error: 'bad gzip body' } };
    }
    let doc: unknown;
    try {
      doc = text.trim() ? JSON.parse(text) : {};
    } catch {
      return { status: 400, body: { error: 'body is not valid JSON' } };
    }
    this.received += 1;
    if (this.opts.forwardUrl) this.forward(kind, text);
    if (kind === 'metrics') this.metrics(doc as { resourceMetrics?: ResourceMetrics[] });
    else if (kind === 'logs') this.logs(doc as { resourceLogs?: ResourceLogs[] });
    return { status: 200, body: {} };
  }

  private warnOnce(key: string, message: string): void {
    if (this.warned.has(key)) return;
    this.warned.add(key);
    (this.opts.warn ?? console.warn)(message);
  }

  private forward(kind: OtelKind, text: string): void {
    const url = `${this.opts.forwardUrl?.replace(/\/+$/, '')}/v1/${kind}`;
    fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: text }).catch((e: Error) => this.warnOnce('forward', `[otel] forward to ${url} failed: ${e.message}`));
  }

  private terminalOf(resource: Record<string, AttrValue>, extra: Record<string, AttrValue> = {}): string | undefined {
    const direct = String(resource['mtw.terminal_id'] ?? extra['mtw.terminal_id'] ?? '');
    if (this.known(direct)) return direct;
    const session = String(resource['session.id'] ?? extra['session.id'] ?? '');
    const viaSession = session ? this.opts.terminalForSession?.(session) : undefined;
    return viaSession && this.known(viaSession) ? viaSession : undefined;
  }

  /** Only terminals this app started (they have a run folder) are accepted. */
  private known(id: string): boolean {
    return TERMINAL_ID.test(id) && (this.accums.has(id) || existsSync(path.join(this.opts.stateDir, 'runs', id)));
  }

  private accum(id: string): Accum {
    let a = this.accums.get(id);
    if (!a) this.accums.set(id, (a = new Accum()));
    return a;
  }

  private metrics(doc: { resourceMetrics?: ResourceMetrics[] }): void {
    for (const rm of doc.resourceMetrics ?? []) {
      const resource = attrs(rm.resource?.attributes);
      for (const sm of rm.scopeMetrics ?? []) {
        for (const metric of sm.metrics ?? []) {
          const isTokens = metric.name === 'claude_code.token.usage';
          const isCost = metric.name === 'claude_code.cost.usage';
          if (!isTokens && !isCost) continue;
          const body = metric.sum ?? metric.gauge;
          if (!body) continue;
          const temporality = metric.sum?.aggregationTemporality;
          const cumulative = temporality === 2 || temporality === 'AGGREGATION_TEMPORALITY_CUMULATIVE';
          for (const dp of body.dataPoints ?? []) {
            const a = attrs(dp.attributes);
            const id = this.terminalOf(resource, a);
            if (!id) {
              this.unmatched += 1;
              continue;
            }
            const acc = this.accum(id);
            const value = n(dp.asDouble ?? dp.asInt);
            const type = isTokens ? String(a.type ?? '') : '';
            const key = `${metric.name}|${type}|${String(a['session.id'] ?? '')}|${String(a.model ?? '')}`;
            acc.series.set(key, cumulative ? value : (acc.series.get(key) ?? 0) + value);
            (isTokens ? acc.tokenSeries : acc.costSeries).add(key);
            if (typeof a.model === 'string' && a.model) acc.model = a.model;
            this.touch(id, acc);
          }
        }
      }
    }
  }

  private logs(doc: { resourceLogs?: ResourceLogs[] }): void {
    for (const rl of doc.resourceLogs ?? []) {
      const resource = attrs(rl.resource?.attributes);
      for (const sl of rl.scopeLogs ?? []) {
        for (const rec of sl.logRecords ?? []) {
          const a = attrs(rec.attributes);
          const id = this.terminalOf(resource, a);
          if (!id) {
            this.unmatched += 1;
            continue;
          }
          const name = String(a['event.name'] ?? rec.body?.stringValue ?? '');
          const acc = this.accum(id);
          const isApi = name.endsWith('api_request');
          if (isApi) {
            acc.logUsage.input += n(a.input_tokens);
            acc.logUsage.output += n(a.output_tokens);
            acc.logUsage.cacheRead += n(a.cache_read_tokens);
            acc.logUsage.cacheWrite += n(a.cache_creation_tokens);
            acc.logCost += n(a.cost_usd);
            acc.logRequests += 1;
            if (typeof a.model === 'string' && a.model) acc.model = a.model;
          }
          if (isApi || name.endsWith('tool_result')) {
            this.appendEvent(id, {
              at: new Date().toISOString(),
              event: name,
              ...(a.model ? { model: a.model } : {}),
              ...(a.tool_name ? { tool: a.tool_name } : {}),
              ...(a.success !== undefined ? { success: a.success } : {}),
              ...(a.duration_ms !== undefined ? { durationMs: a.duration_ms } : {}),
              ...(isApi ? { input: n(a.input_tokens), output: n(a.output_tokens), cacheRead: n(a.cache_read_tokens), cacheWrite: n(a.cache_creation_tokens), costUsd: n(a.cost_usd) } : {}),
            });
          }
          this.touch(id, acc);
        }
      }
    }
  }

  private appendEvent(id: string, event: Record<string, unknown>): void {
    const dir = path.join(this.opts.stateDir, 'runs', id);
    if (!existsSync(dir)) return;
    try {
      appendFileSync(path.join(dir, 'otel-events.jsonl'), `${JSON.stringify(event)}\n`, 'utf8');
    } catch {
      /* telemetry must never break a run */
    }
  }

  private touch(id: string, acc: Accum): void {
    acc.updatedAt = new Date().toISOString();
    this.dirty.add(id);
    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), 1000);
      this.timer.unref();
    }
  }

  flush(): void {
    this.timer = null;
    for (const id of this.dirty) {
      const acc = this.accums.get(id);
      const dir = path.join(this.opts.stateDir, 'runs', id);
      if (acc && existsSync(dir)) {
        try {
          writeFileSync(path.join(dir, 'otel.json'), `${JSON.stringify({ totals: acc.totals(), requests: acc.logRequests, updatedAt: acc.updatedAt }, null, 2)}\n`, 'utf8');
        } catch {
          /* ignore */
        }
      }
      this.opts.onUpdate?.(id);
    }
    this.dirty.clear();
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer);
    this.flush();
  }
}

interface Point {
  attributes?: KeyValue[];
  asInt?: string | number;
  asDouble?: number;
}
interface MetricBody {
  aggregationTemporality?: number | string;
  dataPoints?: Point[];
}
interface ResourceMetrics {
  resource?: { attributes?: KeyValue[] };
  scopeMetrics?: { metrics?: { name: string; sum?: MetricBody; gauge?: MetricBody }[] }[];
}
interface ResourceLogs {
  resource?: { attributes?: KeyValue[] };
  scopeLogs?: { logRecords?: { attributes?: KeyValue[]; body?: { stringValue?: string } }[] }[];
}
