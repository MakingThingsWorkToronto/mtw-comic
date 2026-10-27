// Pure helpers and types shared by the Journal's server and client (no node, no DOM imports).
// Behaviour migrated from retired git 51eb6e03:wiki/journal/console/render.mjs (queue grouping, markdown for the post preview, answer payloads).

export const UNKNOWN = 'unknown';
export const isUnknown = (v: unknown): boolean => v === UNKNOWN || v === null || v === undefined || v === '';
export const show = (v: unknown): string => (isUnknown(v) ? UNKNOWN : String(v));
export const sentence = (v: unknown): string => {
  const t = show(v).trim();
  return /[.!?]$/.test(t) ? t : `${t}.`;
};
export const plural = (n: unknown, one: string, many?: string): string => (Number(n) === 1 ? one : many ?? `${one}s`);

/** Decision actions this module records (spec 6). Anything else is refused. */
export const DECISION_ACTIONS = ['approve-headline', 'answer', 'gate-pass-confirm', 'choose-cover', 'approve', 'reject', 'reopen', 'publish-direction'] as const;
export type DecisionAction = (typeof DECISION_ACTIONS)[number];

// ----------------------------------------------------------------- state types
// Only what the views read. The state itself is produced by server/state.ts (a port of the retired console build-state.mjs).

export interface CoverRow {
  option: string;
  file: string;
  state: string;
  imagePath: string | null;
  exists: boolean;
  bytes: number | string;
  existsNote: string;
  /** Added by the server: img:<record>@<treatment> when the file is registered in the image library. */
  ref?: string | null;
  /** Added by the server: URL from the owning resolver when one is registered. */
  preview?: string | null;
}
export interface QuestionRow { number: number; question: string; selfAnswerVerdict: string; stateText: string; state: string }
export interface RoundRow { file: string; path: string; round: number | string; date: string; dateSource: string; questionsRecorded: number; redactions: string; words: number }
export interface GateRow { gate: string; result: string; evidence: string }
export interface AskGroup { id: string; title: string; why: string; source: string; items: { label: string; question: string; note?: string }[] }
export interface Stage { id: string; label: string; state: string; evidence: string }

export interface EntryRec {
  slug: string;
  title: string;
  path: string;
  recordedStatusLine: string;
  recordedStatusNote: string;
  opened: string;
  files: { key: string; present: boolean; path: string }[];
  measurements: { file: string; path: string; title: string; limits: string }[];
  gates: { found: boolean; rows: GateRow[]; verdictLine: string; basis: string };
  framing: { sectionFound: boolean; namedPosition: string; namedPositionAvailable: string; datedEvent: string; datedEventAvailable: string; basis: string };
  assets: { found: boolean; immersive: { type: string; id: string; status: string; shows: string }[]; covers: CoverRow[]; coverClaim: string; coverClaimNote?: string; basis: string };
  post: { found: boolean; title?: string; standfirst?: string; body?: string; bodyWordCount?: number | string; notes?: string | null; openQuestions?: { number: number; text: string }[]; openQuestionCount?: number | string; basis: string; approvalNote?: string };
  localSiteUrl: string;
  answers: { found: boolean; count: number; rounds: RoundRow[]; questionsRecorded: number; note: string | null };
  questions: { total: number | string; answered: number | string; partial: number | string; open: number | string; unanswered: number | string; raisedNotAsked: number | string; rows: QuestionRow[]; raised: { number: number; question: string }[]; basis: string };
  draft: { exists: boolean; wordCount: number | string; path: string; note: string };
  approval: 'approved' | 'not approved';
  approvalEvidence: string;
  staleClaims: string[];
  questionsForMatt: AskGroup[];
  questionsForMattCount: number;
}
export interface ConceptRec {
  number: number;
  title: string;
  headline: string;
  headlineCharCountMeasured: number | string;
  description: string;
  argument: string;
  onlyMattCanSupply: string;
  origin: string;
  category: string;
  service: string;
  approval: string;
  approvalEvidence: string;
  entrySlug: string | null;
  entryMatchBasis: string;
  candidateFile: string | null;
  interviewFile: string | null;
  stages: Stage[];
  furthestStage: string;
  waitingOn: string;
  questions: { label: string; question: string }[];
  questionsSource?: string;
  conceptPage: string | null;
  /** Discovery-format proposals only: the score line, whether it is held, and the proposed week. */
  assessment?: string;
  evidence?: string;
  held?: boolean;
  proposedWeek?: string;
  /** Theme size from the signal digest, and what readers take away (discovery runs since 2026-10-11). */
  themeSize?: string;
  share?: string;
}
export interface QueueRowRaw { entry: string; stage?: string; waitingOn?: string; published?: string; route?: string; rejected?: string; reason?: string; reopen?: string; slug: string | null }
export interface JournalState {
  schemaVersion: number;
  generatedAt: string;
  honesty: { unknownToken: string; approvalRule: string; measurementRule: string };
  sources: Record<string, string>;
  concepts: ConceptRec[];
  entries: EntryRec[];
  queue: { found: boolean; queue: QueueRowRaw[]; published: QueueRowRaw[]; rejected: QueueRowRaw[]; publishedClaim: string; rejectedClaim: string; queueNote?: string; disagreements: string[] };
  /** Live work only. A candidate row has no entry yet: entrySlug is null and conceptNumber names it. */
  waiting: { entrySlug: string | null; conceptNumber?: number; entryTitle: string; ask: string; detail: string; where: string }[];
  coverage: { channels: { channel: string; lastRun: string; coverage: string; open: string; hasRun: boolean }[] };
  counts: Record<string, number | string>;
  generatorNotes: string[];
  [key: string]: unknown;
}

export interface DecisionRec { id: string; at: string; actor: string; module: string; subject: string; action: string; value?: unknown; note?: string }

// ------------------------------------------------------------------ queue view

export interface QueueViewRow {
  key: string;
  /** The name as queue.md writes it (the reject recorder matches rows by it). */
  name: string;
  title: string;
  stage: string;
  waitingOn: string;
  slug: string | null;
  conceptNumber: number | null;
  description: string;
  statusLine: string;
  bodyWords: number | string;
  rounds: number;
  questionsWaiting: number;
  approval: string;
  hasPost: boolean;
  cover: CoverRow | null;
  localSiteUrl: string | null;
}

const norm = (v: unknown): string => String(v ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const sameRow = (r: QueueRowRaw, c: ConceptRec): boolean =>
  Boolean((r.slug && c.entrySlug === r.slug) || norm(c.headline) === norm(r.entry) || norm(c.title) === norm(r.entry));

/**
 * Journal candidates: concepts in the newest proposals file with no entry folder that queue.md has not published or
 * rejected. They are work waiting on Matt's headline decision, so they show beside live work (Matt, 2026-10-11).
 */
export function liveCandidates(s: Pick<JournalState, 'concepts' | 'queue'>): ConceptRec[] {
  const parked = [...s.queue.published, ...s.queue.rejected];
  return s.concepts.filter((c) => !c.entrySlug && !parked.some((r) => sameRow(r, c)));
}

/**
 * Work in progress and candidates only: queue.md's Queue rows (minus any whose entry queue.md also lists as published
 * or rejected), then candidates queue.md does not list yet. Published and rejected work lives in their own tabs.
 */
export function queueView(s: JournalState): QueueViewRow[] {
  const bySlug = new Map(s.entries.map((e) => [e.slug, e]));
  const conceptFor = (r: QueueRowRaw): ConceptRec | undefined => s.concepts.find((c) => sameRow(r, c));
  const parked = new Set([...s.queue.published, ...s.queue.rejected].map((r) => r.slug).filter(Boolean));
  const live = s.queue.queue.filter((r) => !(r.slug && parked.has(r.slug)));
  const candidates: QueueViewRow[] = liveCandidates(s)
    .filter((c) => !live.some((r) => sameRow(r, c)))
    .map((c) => ({
      key: `concept-${c.number}`,
      name: c.headline,
      title: c.headline,
      stage: c.held ? 'Candidate (held)' : 'Candidate',
      waitingOn: c.held ? 'Matt — held: reopen or reject it' : 'Matt — choose the headline, or reject it',
      slug: null,
      conceptNumber: c.number,
      description: isUnknown(c.description) ? '' : c.description,
      statusLine: isUnknown(c.assessment) ? UNKNOWN : String(c.assessment),
      bodyWords: UNKNOWN,
      rounds: 0,
      questionsWaiting: c.questions.length,
      approval: c.approval,
      hasPost: false,
      cover: null,
      localSiteUrl: null,
    }));
  return live.map((r, i) => {
    const e = r.slug ? bySlug.get(r.slug) : undefined;
    const c = conceptFor(r);
    const cover = e ? e.assets.covers.find((x) => x.exists && /chosen/i.test(x.option)) ?? e.assets.covers.find((x) => x.exists) ?? null : null;
    return {
      key: r.slug ?? `row-${i}`,
      name: r.entry,
      title: e ? e.title : r.entry,
      stage: r.stage ?? UNKNOWN,
      waitingOn: r.waitingOn ?? UNKNOWN,
      slug: e ? e.slug : null,
      conceptNumber: !e && c?.conceptPage ? c.number : null,
      description: c && !isUnknown(c.description) ? c.description : '',
      statusLine: e ? e.recordedStatusLine : UNKNOWN,
      bodyWords: e ? e.post.bodyWordCount ?? UNKNOWN : UNKNOWN,
      rounds: e ? e.answers.count : 0,
      questionsWaiting: e ? e.questionsForMattCount : 0,
      approval: e ? e.approval : c ? c.approval : 'not approved',
      hasPost: Boolean(e?.post.found),
      cover,
      localSiteUrl: e ? e.localSiteUrl : null,
    };
  }).concat(candidates);
}

/** True when the newest reject/reopen decision for `subject` (e.g. `concept-7`) is a reject. A later reopen brings it back. */
export function rejectedByDecision(decisions: DecisionRec[], subject: string): boolean {
  const last = decisions.filter((d) => d.subject === subject && (d.action === 'reject' || d.action === 'reopen')).sort((a, b) => b.at.localeCompare(a.at))[0];
  return last?.action === 'reject';
}

/** Queue rows without candidates Matt has already rejected (hidden at once, before journal-reject updates queue.md). */
export function withoutRejectedCandidates(rows: QueueViewRow[], decisions: DecisionRec[]): QueueViewRow[] {
  return rows.filter((r) => !(r.slug === null && r.conceptNumber !== null && rejectedByDecision(decisions, `concept-${r.conceptNumber}`)));
}

/** Waiting items without rejected candidates (candidate rows carry no entry). */
export function waitingWithoutRejected(waiting: JournalState['waiting'], decisions: DecisionRec[]): JournalState['waiting'] {
  return waiting.filter((w) => !(w.entrySlug === null && w.conceptNumber !== undefined && rejectedByDecision(decisions, `concept-${w.conceptNumber}`)));
}

/** Where queue.md, the entry folders and the decision records disagree. Both sides are shown, neither is picked. */
export function disagreements(s: JournalState, decisions: DecisionRec[]): string[] {
  const out = s.entries.flatMap((e) => e.staleClaims.map((c) => `${e.title}: ${c}`)).concat(s.queue.disagreements);
  for (const e of s.entries) {
    const approved = decisions.filter((d) => d.subject === e.slug && d.action === 'approve').sort((a, b) => b.at.localeCompare(a.at))[0];
    if (approved && e.approval !== 'approved') out.push(`${e.title}: a decision record approves it (${approved.at.slice(0, 10)}), but no file records the approval yet.`);
    const rejected = decisions.filter((d) => d.subject === e.slug && (d.action === 'reject' || d.action === 'reopen')).sort((a, b) => b.at.localeCompare(a.at))[0];
    if (rejected) {
      const inRejected = s.queue.rejected.some((r) => r.slug === e.slug);
      if (rejected.action === 'reject' && !inRejected) out.push(`${e.title}: a decision record rejects it (${rejected.at.slice(0, 10)}), but queue.md does not list it as rejected.`);
      if (rejected.action === 'reopen' && inRejected) out.push(`${e.title}: a decision record reopens it (${rejected.at.slice(0, 10)}), but queue.md still lists it as rejected.`);
    }
  }
  return out;
}

// ------------------------------------------------------------- answer payloads

export interface AnswerItem { label: string; question: string; value: string }

/** Items whose box is empty or only whitespace are left out; the rest are kept byte for byte. */
export function filledAnswers(items: AnswerItem[]): AnswerItem[] {
  return items.filter((it) => it.value && it.value.replace(/[\s ]/g, '').length > 0);
}

export interface PayloadTemplate { header: string; item: string; footer: string }
const fillT = (t: string, v: Record<string, string>): string => t.replace(/\{\{(\w+)\}\}/g, (_m, k: string) => v[k] ?? '');

/** The payload an agent records: wording from wiki/operations/templates/journal-answers-payload.md, each answer verbatim. */
export function answersPayload(opts: { date: string; subject: string; items: AnswerItem[]; template: PayloadTemplate }): string | null {
  const filled = filledAnswers(opts.items);
  if (!filled.length) return null;
  const parts = filled.map((it) => fillT(opts.template.item, { label: it.label, question: it.question }) + '\n' + it.value);
  return fillT(opts.template.header, { date: opts.date, subject: opts.subject }) + '\n\n' + parts.join('\n\n') + '\n\n' + opts.template.footer;
}

// ------------------------------------------------------------------- markdown
// A small block parser for the post preview, returning data (not HTML) so the client renders it without injection.

export type Inline =
  | { t: 'text'; text: string }
  | { t: 'link'; text: string; href: string }
  | { t: 'code'; text: string }
  | { t: 'strong'; text: string }
  | { t: 'em'; text: string };
export type Block =
  | { type: 'h'; level: number; text: string }
  | { type: 'p'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'hr' }
  | { type: 'list'; ordered: boolean; items: string[] };

export function mdBlocks(src: string | null | undefined): Block[] {
  const blocks: Block[] = [];
  const lines = String(src ?? '').split('\n');
  let para: string[] = [];
  const flush = (): void => {
    if (para.length) blocks.push({ type: 'p', text: para.join(' ') });
    para = [];
  };
  let i = 0;
  while (i < lines.length) {
    const t = (lines[i] as string).trim();
    if (!t) { flush(); i++; continue; }
    const h = t.match(/^(#{1,4})\s+(.+)$/);
    if (h) { flush(); blocks.push({ type: 'h', level: (h[1] as string).length, text: (h[2] as string).trim() }); i++; continue; }
    if (/^-{3,}$/.test(t)) { flush(); blocks.push({ type: 'hr' }); i++; continue; }
    if (/^>\s?/.test(t)) {
      flush();
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test((lines[i] as string).trim())) { quote.push((lines[i] as string).trim().replace(/^>\s?/, '')); i++; }
      blocks.push({ type: 'quote', text: quote.join(' ') });
      continue;
    }
    if (/^(\d+)\.\s+/.test(t) || /^[-*]\s+/.test(t)) {
      flush();
      const ordered = /^\d+\.\s+/.test(t);
      const items: string[] = [];
      while (i < lines.length) {
        const raw = lines[i] as string;
        const li = raw.trim();
        if (ordered ? /^\d+\.\s+/.test(li) : /^[-*]\s+/.test(li)) { items.push(li.replace(/^(\d+\.|[-*])\s+/, '')); i++; }
        else if (li && /^\s{2,}\S/.test(raw) && items.length) { items[items.length - 1] += ` ${li}`; i++; }
        else break;
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }
    para.push(t);
    i++;
  }
  flush();
  return blocks;
}

/** Inline markdown to tokens: [text](href), `code`, **strong**, *em*. */
export function inlineTokens(src: string): Inline[] {
  const out: Inline[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|(^|[^*])\*([^*\n]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const lead = m[5] ?? '';
    if (m.index > last) out.push({ t: 'text', text: src.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ t: 'link', text: m[1], href: m[2] as string });
    else if (m[3] !== undefined) out.push({ t: 'code', text: m[3] });
    else if (m[4] !== undefined) out.push({ t: 'strong', text: m[4] });
    else {
      if (lead) out.push({ t: 'text', text: lead });
      out.push({ t: 'em', text: m[6] as string });
    }
    last = m.index + m[0].length;
  }
  if (last < src.length) out.push({ t: 'text', text: src.slice(last) });
  return out;
}

export const anchorOf = (t: string): string => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
