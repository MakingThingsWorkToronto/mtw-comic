import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { fill, loadTemplate } from './templates';
import { assertModelFitsRunner, loadRunners, type RunnersConfig } from './runners';
import type { OperationDef, OperationLauncher, RunnerId, TerminalManager, TerminalInfo } from '../../modules/types';

const paramSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['text', 'asset', 'select']).default('text'),
  assetType: z.string().optional(),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional(),
});

const defSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  title: z.string().min(1),
  module: z.string().min(1),
  runner: z.string().min(1),
  skill: z.string().optional(),
  idleMinutes: z.number().positive().optional(),
  // Default model and effort per provider: at most one entry per runner (checked against runners.json by checkModels).
  models: z.array(z.object({ runner: z.string().min(1), model: z.string().min(1), effort: z.string().min(1) })).optional(),
  // Shorthand: a bare name (`params: [scope]`) is an optional text parameter labelled by its name.
  params: z.array(z.union([z.string().min(1).transform((name) => ({ name, label: name, type: 'text' as const })), paramSchema])).default([]),
});

export interface ParsedPrompt {
  def: OperationDef;
  body: string;
}

function scalar(raw: string): unknown {
  const v = raw.trim();
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
  if (v.startsWith('[') && v.endsWith(']')) {
    const inner = v.slice(1, -1).trim();
    return inner ? inner.split(',').map((part) => scalar(part)) : [];
  }
  return v;
}

/**
 * Parse the small YAML subset used by operation prompts: `key: value` pairs, inline `[a, b]` lists,
 * and one level of `- ` list items that are either scalars or flat `key: value` maps.
 */
export function parseFrontmatter(text: string): { data: Record<string, unknown>; body: string } {
  const normalized = text.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)/);
  if (!match) return { data: {}, body: normalized };
  const data: Record<string, unknown> = {};
  let listKey: string | null = null;
  let item: Record<string, unknown> | null = null;
  for (const line of (match[1] as string).split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const indent = line.length - line.trimStart().length;
    const trimmed = line.trim();
    if (indent === 0) {
      const kv = trimmed.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (!kv) throw new Error(`bad frontmatter line: ${line}`);
      const [, key, value] = kv as unknown as [string, string, string];
      if (value === '') {
        data[key] = [];
        listKey = key;
      } else {
        data[key] = scalar(value);
        listKey = null;
      }
      item = null;
      continue;
    }
    if (!listKey) throw new Error(`unexpected indented line: ${line}`);
    const list = data[listKey] as unknown[];
    if (trimmed.startsWith('- ')) {
      const rest = trimmed.slice(2);
      const kv = rest.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (kv) {
        item = { [kv[1] as string]: scalar(kv[2] as string) };
        list.push(item);
      } else {
        item = null;
        list.push(scalar(rest));
      }
    } else {
      const kv = trimmed.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (!kv || !item) throw new Error(`bad list item line: ${line}`);
      item[kv[1] as string] = scalar(kv[2] as string);
    }
  }
  return { data, body: normalized.slice(match[0].length).replace(/^\n+/, '') };
}

/** Problems with a procedure's `models:` block: a repeated runner, or a model/effort the runner does not offer. */
export function checkModels(def: OperationDef, runners?: RunnersConfig): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const m of def.models ?? []) {
    if (seen.has(m.runner)) problems.push(`models: runner "${m.runner}" appears more than once`);
    seen.add(m.runner);
    if (!runners) continue;
    const r = runners[m.runner];
    if (!r) { problems.push(`models: unknown runner "${m.runner}"`); continue; }
    if (!r.models.some((x) => x.id === m.model)) problems.push(`models: "${m.model}" is not a ${m.runner} model in runners.json`);
    if (!r.efforts.includes(m.effort)) problems.push(`models: "${m.effort}" is not a ${m.runner} effort in runners.json`);
  }
  return problems;
}

/** The procedure's default model/effort for a provider, or none. */
export function modelFor(def: OperationDef, runner: string): { model: string; effort: string } | undefined {
  const m = def.models?.find((x) => x.runner === runner);
  return m ? { model: m.model, effort: m.effort } : undefined;
}

export function parsePrompt(text: string, source = 'prompt', runners?: RunnersConfig): ParsedPrompt {
  const { data, body } = parseFrontmatter(text);
  const parsed = defSchema.safeParse(data);
  if (!parsed.success) throw new Error(`${source}: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
  const problems = checkModels(parsed.data as OperationDef, runners);
  if (problems.length) throw new Error(`${source}: ${problems.join('; ')}`);
  return { def: parsed.data as OperationDef, body: body.trim() };
}

export function validateParams(def: OperationDef, params: Record<string, string>): void {
  for (const p of def.params) {
    const value = (params[p.name] ?? '').trim();
    if (!value) {
      if (p.required) throw new Error(`parameter "${p.name}" is required`);
      continue;
    }
    if (p.type === 'select' && p.options && !p.options.includes(value)) {
      throw new Error(`parameter "${p.name}" must be one of ${p.options.join(', ')}`);
    }
  }
}

/**
 * Prompt-cache order: stable body, then the stable contribution block (wiki/operations/templates/contribute.md),
 * then the run-specific "## This run" section (wiki/operations/templates/run-section.md) LAST.
 */
export function renderPrompt(parsed: ParsedPrompt, params: Record<string, string>, repoRoot: string): string {
  const t = loadTemplate(repoRoot, 'run-section');
  const contribute = loadTemplate(repoRoot, 'contribute').body;
  const line = (label: string, name: string, value: string) => fill(t.data.paramLine ?? '', { label, name, value });
  const lines = parsed.def.params.length
    ? parsed.def.params.map((p) => line(p.label, p.name, (params[p.name] ?? '').trim() || (t.data.emptyValue ?? '')))
    : [t.data.noParams ?? ''];
  // The operation id is how the agent finds its own procedure file; it varies per run, so it lives in the last section.
  const withId = [line('Operation id', 'operation id', parsed.def.id), ...lines];
  return `${parsed.body}\n\n${contribute}\n\n${fill(t.body, { params: withId.join('\n') })}\n`;
}

/** The item a run is about: the first filled asset parameter, else a parameter named subject/id/slug/entry/issue. */
export function subjectOf(def: OperationDef, params: Record<string, string>): { subject?: string } {
  const pick = def.params.find((p) => p.type === 'asset' && (params[p.name] ?? '').trim()) ?? def.params.find((p) => /^(subject|id|slug|entry|issue|track|record)$/.test(p.name) && (params[p.name] ?? '').trim());
  const value = pick ? (params[pick.name] ?? '').trim() : '';
  return value ? { subject: value } : {};
}

/** What a launch route takes from a request body: the confirmed provider, permission, model and effort (all optional). */
export interface LaunchOpts {
  runner?: RunnerId;
  permission?: string;
  choice?: { model?: string; effort?: string };
}

/** Read the confirm control's fields from a request body. A bypass/dangerous permission is refused, never passed on. */
export function launchOptsFromBody(body: unknown): LaunchOpts {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
  const permission = str(b.permission);
  if (permission && /bypass|dangerous/i.test(permission)) throw new Error('that permission mode is never offered from Studio');
  const runner = str(b.runner);
  const model = str(b.model);
  const effort = str(b.effort);
  return {
    ...(runner ? { runner } : {}),
    ...(permission && permission !== 'default' ? { permission } : {}),
    ...(model || effort ? { choice: { ...(model ? { model } : {}), ...(effort ? { effort } : {}) } } : {}),
  };
}

/**
 * Per-step choices a human confirmed for a multi-step launch (a workflow run's nodes, a schedule's chain steps), keyed by
 * node id or step index. Each entry is read like a single launch body; a step with no entry keeps the procedure default.
 */
export function stepChoicesFromBody(raw: unknown): Record<string, LaunchOpts> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, LaunchOpts> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const o = launchOptsFromBody(value);
    if (o.runner || o.permission || o.choice) out[key] = o;
  }
  return out;
}

/** Reads wiki/operations/prompts/*.md on each call, so an edited prompt is live without a restart. */
export class PromptOperations implements OperationLauncher {
  constructor(private repoRoot: string, private terminals: TerminalManager) {}

  private get dir(): string {
    return path.join(this.repoRoot, 'wiki', 'operations', 'prompts');
  }

  async loadAll(): Promise<ParsedPrompt[]> {
    let names: string[];
    try {
      names = (await fs.readdir(this.dir)).filter((n) => n.endsWith('.md')).sort();
    } catch {
      return [];
    }
    const out: ParsedPrompt[] = [];
    let runners: RunnersConfig | undefined;
    try { runners = loadRunners(this.repoRoot); } catch { runners = undefined; }
    for (const name of names) {
      try {
        out.push(parsePrompt(await fs.readFile(path.join(this.dir, name), 'utf8'), name, runners));
      } catch (error) {
        console.warn(`[operations] skipped ${name}: ${(error as Error).message}`);
      }
    }
    return out;
  }

  async list(module?: string): Promise<OperationDef[]> {
    const all = (await this.loadAll()).map((p) => p.def);
    return module ? all.filter((d) => d.module === module) : all;
  }

  async launch(id: string, params: Record<string, string>, runner?: RunnerId, permission?: string, promptText?: string, choice?: { model?: string; effort?: string }): Promise<TerminalInfo> {
    const parsed = (await this.loadAll()).find((p) => p.def.id === id);
    if (!parsed) throw new Error(`unknown operation: ${id}`);
    validateParams(parsed.def, params);
    const chosenRunner = runner ?? parsed.def.runner;
    // Resolution: this launch's explicit choice, else the procedure's entry for the runner, else the studio default (terminals.spawn).
    const dflt = modelFor(parsed.def, chosenRunner);
    const model = choice?.model?.trim() || dflt?.model;
    const effort = choice?.effort?.trim() || dflt?.effort;
    let known: RunnersConfig | undefined;
    try { known = loadRunners(this.repoRoot); } catch { known = undefined; }
    if (known) assertModelFitsRunner(known, chosenRunner, model);
    return this.terminals.spawn({
      runner: chosenRunner,
      title: parsed.def.title,
      prompt: promptText?.trim() ? promptText : renderPrompt(parsed, params, this.repoRoot),
      operation: parsed.def.id,
      module: parsed.def.module,
      permission,
      ...(model ? { model } : {}),
      ...(effort ? { effort } : {}),
      params,
      ...(parsed.def.idleMinutes ? { idleMinutes: parsed.def.idleMinutes } : {}),
      ...subjectOf(parsed.def, params),
    });
  }
}
