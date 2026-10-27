// New module (no wiki origin): the workflow definition lives in wiki/workflows/<id>.json, validated here.
import { z } from 'zod';

export const NODE_KINDS = ['operation', 'human-gate', 'script', 'schedule'] as const;
export type NodeKind = (typeof NODE_KINDS)[number];

const slug = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'use lower-case letters, digits and hyphens');

export const NodeSchema = z.object({
  id: slug,
  label: z.string().min(1),
  kind: z.enum(NODE_KINDS),
  /** Operation id (wiki/operations/prompts/<id>.md). Required for 'operation' and 'script'. */
  operation: z.string().min(1).optional(),
  /** Operation parameters. Values may use {{input.<name>}} (run input) or {{<gate-node-id>}} (that gate's note). */
  params: z.record(z.string()).optional(),
  /** Runner override; 'script' nodes default to 'shell'. */
  runner: z.string().min(1).optional(),
  /** The SVG element this node maps to: an element id, or a CSS selector (starts with # . [ or contains a space). */
  diagramNode: z.string().min(1).optional(),
  /** Index of the tour step that explains this node. */
  tourStep: z.number().int().min(0).optional(),
  /** Human-gate: the note is required before Approve (its text can feed later nodes as {{<node-id>}}). */
  noteRequired: z.boolean().optional(),
  /** What this node does, or what the gate asks Matt to check. */
  note: z.string().optional(),
});
export type WorkflowNode = z.infer<typeof NodeSchema>;

export const EdgeSchema = z.object({ from: slug, to: slug, when: z.enum(['success', 'failure', 'always']).optional() });
export type WorkflowEdge = z.infer<typeof EdgeSchema>;

export const WorkflowSchema = z.object({
  id: slug,
  title: z.string().min(1),
  /** The section the list shows it under (Journal, Music, Comics, Access, Research ...). None: "Other". */
  domain: z.string().trim().min(1).max(40).optional(),
  description: z.string().default(''),
  /** Shown on the detail and run views (e.g. the "example mapping" label). */
  notice: z.string().optional(),
  diagram: z.object({ svg: z.string().min(1), tour: z.string().min(1).optional() }).optional(),
  /** Values Matt supplies when starting a run. */
  inputs: z.array(z.object({ name: z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/), label: z.string().min(1), required: z.boolean().optional() })).optional(),
  nodes: z.array(NodeSchema).min(1),
  edges: z.array(EdgeSchema),
});
export type Workflow = z.infer<typeof WorkflowSchema>;

/** What validation needs to know about the world. Built by the server; tests pass fixtures. */
export interface ValidationContext {
  operations: Map<string, { id: string; params: { name: string; required?: boolean; type?: string; options?: string[] }[] }>;
  /** Element ids in the SVG; null/undefined when none was read. */
  svgIds?: Set<string> | null;
  svgError?: string;
  tourSteps?: number | null;
  tourError?: string;
}

const TEMPLATE = /\{\{\s*([^}]+?)\s*\}\}/g;
export const templateRefs = (value: string): string[] => [...value.matchAll(TEMPLATE)].map((m) => m[1] as string);

export function renderTemplate(value: string, inputs: Record<string, string>, notes: Record<string, string>): string {
  return value.replace(TEMPLATE, (_all, ref: string) => (ref.startsWith('input.') ? (inputs[ref.slice(6)] ?? '') : (notes[ref] ?? '')));
}

export function isSelector(s: string): boolean {
  return /^[#.[]/.test(s) || /\s/.test(s);
}

export const edgeWhen = (e: WorkflowEdge): 'success' | 'failure' | 'always' => e.when ?? 'success';

/** The nodes in dependency order, or null when the graph has a cycle. */
export function topoOrder(w: Pick<Workflow, 'nodes' | 'edges'>): string[] | null {
  const indeg = new Map(w.nodes.map((n) => [n.id, 0]));
  for (const e of w.edges) if (indeg.has(e.to)) indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1);
  const queue = w.nodes.filter((n) => indeg.get(n.id) === 0).map((n) => n.id);
  const out: string[] = [];
  while (queue.length) {
    const id = queue.shift() as string;
    out.push(id);
    for (const e of w.edges) {
      if (e.from !== id || !indeg.has(e.to)) continue;
      indeg.set(e.to, (indeg.get(e.to) ?? 1) - 1);
      if (indeg.get(e.to) === 0) queue.push(e.to);
    }
  }
  return out.length === w.nodes.length ? out : null;
}

/** Everything wrong with a parsed workflow. A workflow with problems cannot run. */
export function problemsOf(w: Workflow, ctx: ValidationContext): string[] {
  const p: string[] = [];
  const ids = new Set<string>();
  for (const n of w.nodes) {
    if (ids.has(n.id)) p.push(`duplicate node id "${n.id}"`);
    ids.add(n.id);
  }
  const inputNames = new Set((w.inputs ?? []).map((i) => i.name));
  const gates = new Set(w.nodes.filter((n) => n.kind === 'human-gate').map((n) => n.id));

  for (const n of w.nodes) {
    const at = `node "${n.id}"`;
    if (n.kind === 'operation' || n.kind === 'script') {
      if (!n.operation) {
        p.push(`${at}: ${n.kind} needs an operation`);
        continue;
      }
      const def = ctx.operations.get(n.operation);
      if (!def) {
        p.push(`${at}: operation "${n.operation}" does not exist in wiki/operations/prompts`);
        continue;
      }
      const given = n.params ?? {};
      for (const key of Object.keys(given)) if (!def.params.some((d) => d.name === key)) p.push(`${at}: "${n.operation}" has no parameter "${key}"`);
      for (const d of def.params) {
        const value = given[d.name];
        if (d.required && !(value ?? '').trim()) p.push(`${at}: required parameter "${d.name}" of "${n.operation}" is not set`);
        if (value && d.options?.length && !value.includes('{{') && !d.options.includes(value)) p.push(`${at}: "${value}" is not one of ${d.options.join(', ')} for "${d.name}"`);
      }
    } else if (n.operation) p.push(`${at}: ${n.kind} nodes take no operation`);
    for (const value of Object.values(n.params ?? {})) {
      for (const ref of templateRefs(value)) {
        if (ref.startsWith('input.')) {
          if (!inputNames.has(ref.slice(6))) p.push(`${at}: {{${ref}}} is not a declared input`);
        } else if (!gates.has(ref)) p.push(`${at}: {{${ref}}} is not a human-gate node`);
      }
    }
    if (n.noteRequired && n.kind !== 'human-gate') p.push(`${at}: noteRequired only applies to a human-gate`);
    if (n.diagramNode) {
      if (!w.diagram) p.push(`${at}: diagramNode set but the workflow has no diagram`);
      else if (ctx.svgIds && !isSelector(n.diagramNode) && !ctx.svgIds.has(n.diagramNode)) p.push(`${at}: diagramNode "${n.diagramNode}" is not an id in the SVG`);
    }
    if (n.tourStep !== undefined) {
      if (!w.diagram?.tour) p.push(`${at}: tourStep set but the diagram has no tour`);
      else if (typeof ctx.tourSteps === 'number' && n.tourStep >= ctx.tourSteps) p.push(`${at}: tourStep ${n.tourStep} is past the tour's ${ctx.tourSteps} steps`);
    }
  }
  for (const e of w.edges) {
    if (!ids.has(e.from)) p.push(`edge ${e.from} -> ${e.to}: unknown node "${e.from}"`);
    if (!ids.has(e.to)) p.push(`edge ${e.from} -> ${e.to}: unknown node "${e.to}"`);
    if (e.from === e.to) p.push(`edge ${e.from} -> ${e.to}: a node cannot lead to itself`);
  }
  if (!p.length && topoOrder(w) === null) p.push('the edges contain a cycle; a workflow must be a directed acyclic graph');
  if (w.diagram) {
    if (ctx.svgError) p.push(`diagram: ${ctx.svgError}`);
    if (w.diagram.tour && ctx.tourError) p.push(`tour: ${ctx.tourError}`);
  }
  return p;
}
