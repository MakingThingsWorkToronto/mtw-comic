// Prompt text the app hands to agents lives in wiki/operations/templates/*.md, never in code (Matt, 2026-10-09).
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { parseFrontmatter } from './prompts';

export interface Template { body: string; data: Record<string, string> }
const cache = new Map<string, { mtimeMs: number; template: Template }>();

export function loadTemplate(repoRoot: string, name: string): Template {
  const file = path.join(repoRoot, 'wiki', 'operations', 'templates', `${name}.md`);
  let mtimeMs: number;
  try { mtimeMs = statSync(file).mtimeMs; } catch { throw new Error(`missing prompt template wiki/operations/templates/${name}.md`); }
  const hit = cache.get(file);
  if (hit && hit.mtimeMs === mtimeMs) return hit.template;
  const { data, body } = parseFrontmatter(readFileSync(file, 'utf8'));
  const template: Template = { body: body.trim(), data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) };
  cache.set(file, { mtimeMs, template });
  return template;
}

/** Replace {{name}} placeholders (double braces, so JSON or code in a template is left alone). */
export function fill(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (m, key: string) => (key in vars ? vars[key]! : m));
}

export function renderTemplate(repoRoot: string, name: string, vars: Record<string, string>): string {
  return fill(loadTemplate(repoRoot, name).body, vars);
}
