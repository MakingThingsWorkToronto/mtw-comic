// New module (no wiki origin): reads wiki/workflows/*.json plus the diagram SVG and tour each one names.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Services } from '../../types';
import { WorkflowSchema, problemsOf } from './schema';
import type { ValidationContext, Workflow } from './schema';

export const WORKFLOW_DIR = 'wiki/workflows';
/** Repo folders a workflow may read diagrams and tours from. */
const READABLE = ['wiki/image-library/', 'site/src/data/', 'site/public/'];

export interface LoadedWorkflow {
  id: string;
  /** null when the file could not be parsed. */
  workflow: Workflow | null;
  problems: string[];
}

function safeRepoPath(repoRoot: string, rel: string): string {
  const norm = rel.replace(/\\/g, '/');
  if (path.isAbsolute(norm) || norm.split('/').includes('..') || !READABLE.some((p) => norm.startsWith(p))) throw new Error(`"${rel}" is outside the folders a workflow may read`);
  const abs = path.resolve(repoRoot, norm);
  if (!abs.startsWith(path.resolve(repoRoot) + path.sep)) throw new Error(`"${rel}" is outside the repo`);
  return abs;
}

/** Drop anything executable from an SVG before it is inlined into the page. */
export function sanitizeSvg(text: string): string {
  return text
    .replace(/<\?xml[^>]*\?>/g, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*')/gi, '')
    .replace(/\s(href|xlink:href)\s*=\s*("\s*javascript:[^"]*"|'\s*javascript:[^']*')/gi, '');
}

export async function readSvg(repoRoot: string, rel: string): Promise<{ svg: string; ids: Set<string> } | { error: string }> {
  try {
    if (!rel.toLowerCase().endsWith('.svg')) return { error: `"${rel}" is not an .svg file` };
    const svg = sanitizeSvg(await fs.readFile(safeRepoPath(repoRoot, rel), 'utf8'));
    return { svg, ids: new Set([...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1] as string)) };
  } catch (error) {
    return { error: (error as NodeJS.ErrnoException).code === 'ENOENT' ? `${rel} does not exist` : (error as Error).message };
  }
}

export interface TourStep {
  title: string;
  paragraphs: string[];
}

export async function readTour(repoRoot: string, rel: string): Promise<{ title: string; steps: TourStep[] } | { error: string }> {
  try {
    const data = JSON.parse(await fs.readFile(safeRepoPath(repoRoot, rel), 'utf8')) as { title?: string; steps?: { title?: string; paragraphs?: string[] }[] };
    if (!Array.isArray(data.steps)) return { error: `${rel} has no steps` };
    return { title: data.title ?? '', steps: data.steps.map((s) => ({ title: s.title ?? '', paragraphs: s.paragraphs ?? [] })) };
  } catch (error) {
    return { error: (error as NodeJS.ErrnoException).code === 'ENOENT' ? `${rel} does not exist` : (error as Error).message };
  }
}

export async function contextFor(services: Services, w: Workflow | null): Promise<ValidationContext> {
  const ops = await services.operations.list();
  const ctx: ValidationContext = { operations: new Map(ops.map((o) => [o.id, o])) };
  if (w?.diagram) {
    const svg = await readSvg(services.repoRoot, w.diagram.svg);
    if ('error' in svg) ctx.svgError = svg.error;
    else ctx.svgIds = svg.ids;
    if (w.diagram.tour) {
      const tour = await readTour(services.repoRoot, w.diagram.tour);
      if ('error' in tour) ctx.tourError = tour.error;
      else ctx.tourSteps = tour.steps.length;
    }
  }
  return ctx;
}

export async function loadWorkflows(services: Services): Promise<LoadedWorkflow[]> {
  let files: string[] = [];
  try {
    files = (await fs.readdir(path.join(services.repoRoot, WORKFLOW_DIR))).filter((f) => f.endsWith('.json')).sort();
  } catch {
    return [];
  }
  const out: LoadedWorkflow[] = [];
  for (const f of files) {
    const id = f.replace(/\.json$/, '');
    try {
      const raw = await services.wiki.readJson(`${WORKFLOW_DIR}/${f}`);
      const parsed = WorkflowSchema.safeParse(raw);
      if (!parsed.success) {
        out.push({ id, workflow: null, problems: parsed.error.issues.map((i) => `${i.path.join('.') || 'file'}: ${i.message}`) });
        continue;
      }
      const w = parsed.data;
      const problems = w.id === id ? [] : [`id "${w.id}" must match the file name "${id}.json"`];
      problems.push(...problemsOf(w, await contextFor(services, w)));
      out.push({ id, workflow: w, problems });
    } catch (error) {
      out.push({ id, workflow: null, problems: [(error as Error).message] });
    }
  }
  return out;
}
