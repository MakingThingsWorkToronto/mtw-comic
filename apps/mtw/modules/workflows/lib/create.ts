// New module (no wiki origin): pure helpers shared by the list (domain sections) and the New workflow form,
// and the server's create check. The form builds a linear workflow: each step runs after the one before it succeeds.
import { WorkflowSchema, problemsOf } from './schema';
import type { ValidationContext, Workflow } from './schema';

export const OTHER_DOMAIN = 'Other';
/** Offered in the form beside the domains already in use. */
export const SUGGESTED_DOMAINS = ['Access', 'Comics', 'Images', 'Journal', 'Music', 'Research', 'Site'];
/** Ids the routes under /m/workflows/ already use. */
export const RESERVED_IDS = ['run', 'new', 'runs', 'list', 'create'];

/** Sections in name order, "Other" (no domain) last. Rows keep their order inside a section. */
export function groupByDomain<T>(rows: readonly T[], domainOf: (row: T) => string | undefined | null): { domain: string; rows: T[] }[] {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const d = (domainOf(row) ?? '').trim() || OTHER_DOMAIN;
    const key = [...map.keys()].find((k) => k.toLowerCase() === d.toLowerCase()) ?? d;
    map.set(key, [...(map.get(key) ?? []), row]);
  }
  return [...map.entries()]
    .map(([domain, list]) => ({ domain, rows: list }))
    .sort((a, b) => (a.domain === OTHER_DOMAIN ? 1 : b.domain === OTHER_DOMAIN ? -1 : a.domain.localeCompare(b.domain)));
}

/** Distinct domains in use plus the suggestions, for the form's datalist. */
export function domainChoices(inUse: readonly (string | undefined | null)[]): string[] {
  const out: string[] = [];
  for (const d of [...inUse, ...SUGGESTED_DOMAINS]) {
    const v = (d ?? '').trim();
    if (v && v !== OTHER_DOMAIN && !out.some((x) => x.toLowerCase() === v.toLowerCase())) out.push(v);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');

export interface OperationInfo {
  id: string;
  title?: string;
  params: { name: string; label?: string; type?: string; assetType?: string; options?: string[]; required?: boolean }[];
}

export interface DraftStep {
  kind: 'operation' | 'human-gate';
  label: string;
  /** operation steps */
  operation?: string;
  params?: Record<string, string>;
  /** Parameter names Matt enters when he starts a run instead of fixing them here. */
  ask?: string[];
  /** gate steps: the question Matt answers */
  note?: string;
  noteRequired?: boolean;
}

export interface Draft {
  title: string;
  id: string;
  domain: string;
  description: string;
  steps: DraftStep[];
}

const uniq = (base: string, taken: Set<string>, sep = '-'): string => {
  let v = base;
  for (let n = 2; taken.has(v); n++) v = `${base}${sep}${n}`;
  taken.add(v);
  return v;
};

/** The workflow JSON the form writes. Pure; the server validates it again. */
export function buildWorkflow(d: Draft, ops: ReadonlyMap<string, OperationInfo>): Workflow {
  const ids = new Set<string>();
  const inputNames = new Set<string>();
  const inputs: NonNullable<Workflow['inputs']> = [];
  const nodes: Workflow['nodes'] = d.steps.map((s, i) => {
    const label = s.label.trim() || (s.kind === 'human-gate' ? 'Decision' : (ops.get(s.operation ?? '')?.title ?? `Step ${i + 1}`));
    const id = uniq(slugify(label) || `step-${i + 1}`, ids);
    if (s.kind === 'human-gate') {
      return { id, label, kind: 'human-gate' as const, ...(s.note?.trim() ? { note: s.note.trim() } : {}), ...(s.noteRequired ? { noteRequired: true } : {}) };
    }
    const def = ops.get(s.operation ?? '');
    const params: Record<string, string> = {};
    for (const p of def?.params ?? []) {
      if (s.ask?.includes(p.name)) {
        const name = uniq(p.name.replace(/[^A-Za-z0-9_]/g, '_').replace(/^[^A-Za-z]+/, '') || 'value', inputNames, '_');
        inputs.push({ name, label: p.label || p.name, ...(p.required ? { required: true } : {}) });
        params[p.name] = `{{input.${name}}}`;
      } else {
        const v = (s.params?.[p.name] ?? '').trim();
        if (v) params[p.name] = v;
      }
    }
    // Keep a value for a name the procedure does not declare, so validation reports it instead of dropping it.
    for (const [k, v] of Object.entries(s.params ?? {})) if (!def?.params.some((p) => p.name === k) && v.trim()) params[k] = v.trim();
    return { id, label, kind: 'operation' as const, operation: s.operation ?? '', ...(Object.keys(params).length ? { params } : {}) };
  });
  const edges = nodes.slice(1).map((n, i) => ({ from: (nodes[i] as { id: string }).id, to: n.id }));
  return {
    id: d.id.trim(),
    title: d.title.trim(),
    ...(d.domain.trim() ? { domain: d.domain.trim() } : {}),
    description: d.description.trim(),
    ...(inputs.length ? { inputs } : {}),
    nodes,
    edges,
  } as Workflow;
}

/** Everything that stops a new workflow from being saved: schema, reserved or taken id, and the run checks. */
export function checkNewWorkflow(raw: unknown, ctx: ValidationContext, existingIds: readonly string[]): { workflow: Workflow | null; problems: string[] } {
  const parsed = WorkflowSchema.safeParse(raw);
  if (!parsed.success) return { workflow: null, problems: parsed.error.issues.map((i) => `${i.path.join('.') || 'workflow'}: ${i.message}`) };
  const w = parsed.data;
  const problems: string[] = [];
  if (RESERVED_IDS.includes(w.id)) problems.push(`id "${w.id}" is reserved; choose another`);
  if (existingIds.includes(w.id)) problems.push(`a workflow with id "${w.id}" already exists; choose another id`);
  if (w.diagram) problems.push('a new workflow from the form cannot name a diagram; add it to the file afterwards');
  problems.push(...problemsOf(w, ctx));
  return { workflow: w, problems };
}
