// Journal candidates: the structured record (wiki/journal/candidates.json) Studio reads instead of parsing proposals
// prose. One record per proposed concept, append only, with a stable `number` (never reused) and `id`. The proposals
// markdown stays the readable argument and evidence; each record names its file and section. Studio only reads this
// file; the writer is the `mtw journal candidates` CLI (apps/mtw/cli/journal.ts). Matt, 2026-10-11.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

export const CANDIDATES_REL = 'wiki/journal/candidates.json';
export const PROPOSALS_DIR_REL = 'wiki/journal/candidates';

const text = z.string().trim().min(1);
const optional = z.string().trim().min(1).nullable().default(null);

export const candidateSchema = z
  .object({
    number: z.number().int().positive(),
    id: z.string().regex(/^[a-z0-9][a-z0-9-]{1,80}$/),
    headline: text,
    summary: text,
    argument: optional,
    evidence: optional,
    onlyMatt: optional,
    service: optional,
    category: optional,
    assessment: optional,
    proposedWeek: optional,
    /** Discovery runs since 2026-10-11: the theme's size from the signal digest, and what readers take away. */
    themeSize: optional,
    share: optional,
    /** candidate: waits on Matt's headline decision. held: the proposals file holds it. promoted: an entry folder exists. Rejection lives in queue.md. */
    status: z.enum(['candidate', 'held', 'promoted']),
    entry: z.string().regex(/^[a-z0-9][a-z0-9-]*$/).nullable().default(null),
    rebuildOf: optional,
    source: z.object({ file: z.string().regex(/^wiki\/journal\/candidates\/PROPOSALS-[A-Za-z0-9-]+\.md$/), section: z.number().int().positive() }),
    questions: z.array(z.object({ label: text, question: text })).default([]),
    added: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .refine((c) => (c.status === 'promoted') === Boolean(c.entry), { message: 'status is promoted exactly when entry is set' });

export const candidatesFileSchema = z
  .object({ schemaVersion: z.literal(1), candidates: z.array(candidateSchema) })
  .superRefine((f, ctx) => {
    for (const key of ['number', 'id'] as const) {
      const seen = new Set<unknown>();
      for (const c of f.candidates) {
        if (seen.has(c[key])) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `duplicate ${key}: ${String(c[key])}` });
        seen.add(c[key]);
      }
    }
  });

export type Candidate = z.infer<typeof candidateSchema>;
export type CandidatesFile = z.infer<typeof candidatesFileSchema>;

/** The file, validated. Absent reads as found: false; an invalid file is reported, never half-read. */
export function readCandidates(root: string): { found: boolean; file: CandidatesFile | null; errors: string[] } {
  const abs = path.join(root, CANDIDATES_REL);
  if (!existsSync(abs)) return { found: false, file: null, errors: [] };
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(abs, 'utf8'));
  } catch (error) {
    return { found: true, file: null, errors: [`${CANDIDATES_REL} is not JSON: ${(error as Error).message}`] };
  }
  const r = candidatesFileSchema.safeParse(raw);
  if (!r.success) return { found: true, file: null, errors: r.error.issues.map((i) => `${CANDIDATES_REL} ${i.path.join('.')}: ${i.message}`) };
  return { found: true, file: r.data, errors: [] };
}

export const slugify = (s: string): string =>
  s.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'candidate';

/** A concept as the proposals parsers in state.ts return it (either format). */
export interface ParsedConcept {
  number: number;
  headline: string;
  description: string;
  argument?: string;
  evidence?: string;
  onlyMattCanSupply?: string;
  service?: string;
  category?: string;
  assessment?: string;
  held?: boolean;
  proposedWeek?: string;
  proposalQuestions?: { label: string; question: string }[];
  themeSize?: string;
  share?: string;
  rebuildOf?: string | null;
}

const known = (v: unknown): string | null => (typeof v === 'string' && v.trim() && v !== 'unknown' ? v.trim() : null);

/**
 * Pure: append the concepts of one proposals file that the file does not already hold (matched by source file and
 * section). New records get the next unused number and a unique id. Existing records are never changed.
 */
export function appendFromProposals(file: CandidatesFile, concepts: ParsedConcept[], sourceRel: string, today: string, opts: { requireShare?: boolean } = {}): { file: CandidatesFile; added: Candidate[] } {
  const out: Candidate[] = [...file.candidates];
  const added: Candidate[] = [];
  let next = out.reduce((n, c) => Math.max(n, c.number), 0) + 1;
  const ids = new Set(out.map((c) => c.id));
  for (const c of concepts) {
    if (out.some((x) => x.source.file === sourceRel && x.source.section === c.number)) continue;
    const headline = known(c.headline);
    const summary = known(c.description);
    if (!headline || !summary) throw new Error(`${sourceRel} section ${c.number}: a candidate needs a headline and a summary`);
    if (opts.requireShare && !known(c.share)) throw new Error(`${sourceRel} section ${c.number}: a new candidate needs a "Readers get:" line naming the skill, procedure, prompt or code readers take away`);
    let id = slugify(headline.replace(/\.$/, ''));
    for (let k = 2; ids.has(id); k++) id = `${slugify(headline.replace(/\.$/, ''))}-${k}`;
    ids.add(id);
    const rec = candidateSchema.parse({
      number: next++,
      id,
      headline,
      summary,
      argument: known(c.argument),
      evidence: known(c.evidence),
      onlyMatt: known(c.onlyMattCanSupply),
      service: known(c.service),
      category: known(c.category),
      assessment: known(c.assessment),
      proposedWeek: known(c.proposedWeek),
      themeSize: known(c.themeSize),
      share: known(c.share),
      status: c.held ? 'held' : 'candidate',
      entry: null,
      rebuildOf: known(c.rebuildOf ?? null),
      source: { file: sourceRel, section: c.number },
      questions: c.proposalQuestions ?? [],
      added: today,
    });
    out.push(rec);
    added.push(rec);
  }
  return { file: candidatesFileSchema.parse({ schemaVersion: 1, candidates: out }), added };
}

/** Pure: mark one candidate promoted to an entry folder (or back to candidate with entry null). */
export function linkEntry(file: CandidatesFile, ref: string, entry: string | null): CandidatesFile {
  const hit = file.candidates.find((c) => c.id === ref || String(c.number) === ref);
  if (!hit) throw new Error(`no candidate ${ref}`);
  const candidates = file.candidates.map((c) => (c === hit ? { ...c, entry, status: entry ? ('promoted' as const) : ('candidate' as const) } : c));
  return candidatesFileSchema.parse({ schemaVersion: 1, candidates });
}
