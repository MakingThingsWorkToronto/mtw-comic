// Journal actions: human decisions (direct writes to wiki/journal/decisions.jsonl) and operation launches.
// Nothing here writes queue.md, an entry README or any other approval: agents do that after Matt's click.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { parseFrontmatter, parsePrompt, renderPrompt } from '../../../server/core/prompts';
import { HttpError } from '../../../server/router';
import type { OperationDef, RunnerId, Services, TerminalInfo } from '../../types';
import { DECISION_ACTIONS, answersPayload, filledAnswers } from '../shared';
import type { AnswerItem, DecisionRec } from '../shared';
import { REVIEW_OPERATION, REVIEW_RUNNERS, REVIEW_TEMPLATE, parseReviewPresets, parseReviewSubject } from './review';
import type { ReviewPreset } from './review';
import type { JournalService } from './service';

export const OPERATION_ID = /^(journal|llm-column)-[a-z0-9-]+$/;
/** A schedule or a click may never ask for bypass; the id or any of its args names it. */
export const BYPASS = /bypass|dangerous/i;

export function assertSafePermission(permission: string | undefined): void {
  if (permission && BYPASS.test(permission)) throw new HttpError(400, 'bypass permissions are never passed from the Journal');
}

const decideSchema = z.object({
  subject: z.string().min(1).max(300),
  action: z.enum(DECISION_ACTIONS),
  value: z.unknown().optional(),
  note: z.string().max(4000).optional(),
  /** Required for publish-direction: only Matt's explicit action records it. */
  explicit: z.boolean().optional(),
});

const launchSchema = z.object({
  operation: z.string().regex(OPERATION_ID),
  params: z.record(z.string()).default({}),
  runner: z.enum(['claude', 'codex']).optional(),
  permission: z.string().optional(),
  /** Matt's confirmed model and effort; absent means the procedure's frontmatter default for the runner. */
  model: z.string().min(1).optional(),
  effort: z.string().min(1).optional(),
  /** Matt's edit of the previewed prompt (the retired console let him edit it before copying). */
  prompt: z.string().max(200000).optional(),
});

const answerItem = z.object({ label: z.string().min(1), question: z.string().min(1), value: z.string() });
const answersSchema = z
  .object({
    entry: z.string().optional(),
    concept: z.coerce.number().int().optional(),
    items: z.array(answerItem).min(1),
    /** Write the decision records. Off when retrying only the launch. */
    record: z.boolean().default(true),
    launch: z.boolean().default(true),
    runner: z.enum(['claude', 'codex']).optional(),
    permission: z.string().optional(),
    model: z.string().min(1).optional(),
    effort: z.string().min(1).optional(),
  })
  .refine((b) => Boolean(b.entry) !== (b.concept !== undefined), { message: 'give exactly one of entry or concept' });

const parseBody = <T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, body: unknown): T => {
  const r = schema.safeParse(body ?? {});
  if (!r.success) throw new HttpError(400, r.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; '));
  return r.data;
};

const localDate = (d = new Date()): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export class JournalActions {
  constructor(private svc: JournalService, private services: Services, private today: () => string = localDate) {}

  private known(): { entries: Set<string>; concepts: Set<string>; rows: Set<string> } {
    const { state } = this.svc.state();
    return {
      entries: new Set(state.entries.map((e) => e.slug)),
      concepts: new Set(state.concepts.map((c) => `concept-${c.number}`)),
      rows: new Set([...state.queue.queue, ...state.queue.rejected].flatMap((r) => [r.entry, r.slug ?? ''].filter(Boolean))),
    };
  }

  /** Validate and append one decision. The log is the only thing written. */
  async decide(body: unknown): Promise<DecisionRec> {
    const b = parseBody(decideSchema, body);
    const k = this.known();
    const isEntry = k.entries.has(b.subject);
    const isConcept = k.concepts.has(b.subject);
    switch (b.action) {
      case 'answer':
        if (typeof b.value !== 'string' || !b.value.trim()) throw new HttpError(400, 'an answer needs text');
        if (!isEntry && !isConcept) throw new HttpError(400, `unknown entry or concept: ${b.subject}`);
        break;
      case 'gate-pass-confirm': {
        const v = b.value as Record<string, unknown> | undefined;
        if (!isEntry) throw new HttpError(400, `unknown entry: ${b.subject}`);
        if (!v || typeof v.decision !== 'boolean' || typeof v.mistake !== 'boolean' || typeof v.number !== 'boolean') {
          throw new HttpError(400, 'gate-pass-confirm needs { decision, mistake, number } as booleans');
        }
        break;
      }
      case 'choose-cover': {
        const v = b.value as { entry?: unknown; file?: unknown } | undefined;
        if (!/^(img|cover-file):\S+/.test(b.subject)) throw new HttpError(400, 'choose-cover subject must be an img: ref (or cover-file: for an unregistered image)');
        if (!v || typeof v.entry !== 'string' || !k.entries.has(v.entry) || typeof v.file !== 'string') throw new HttpError(400, 'choose-cover needs { entry, file } naming an existing entry');
        break;
      }
      case 'publish-direction':
        if (b.explicit !== true) throw new HttpError(400, 'publish-direction is recorded only from Matt\'s explicit action');
        if (!isEntry) throw new HttpError(400, `unknown entry: ${b.subject}`);
        break;
      case 'approve':
        if (!isEntry) throw new HttpError(400, `unknown entry: ${b.subject}`);
        break;
      case 'approve-headline':
        if (!isEntry && !isConcept) throw new HttpError(400, `unknown entry or concept: ${b.subject}`);
        break;
      case 'reject':
      case 'reopen':
        if (!isEntry && !isConcept && !k.rows.has(b.subject)) throw new HttpError(400, `${b.subject} is not in queue.md`);
        break;
    }
    const rec = (await this.services.decisions.append('journal', {
      actor: 'matt',
      module: 'journal',
      subject: b.subject,
      action: b.action,
      ...(b.value !== undefined ? { value: b.value } : {}),
      ...(b.note ? { note: b.note } : {}),
    })) as DecisionRec;
    this.services.events.emit('wiki-changed', { module: 'journal', paths: ['wiki/journal/decisions.jsonl'] });
    return rec;
  }

  /** Answer form: one `answer` decision per filled box (value verbatim), then the record-answers operation with the payload verbatim. */
  async answers(body: unknown): Promise<{ recorded: number; payload: string; terminal: TerminalInfo | null; error?: string }> {
    const b = parseBody(answersSchema, body);
    const k = this.known();
    const subject = b.entry ?? `concept-${b.concept}`;
    if (b.entry ? !k.entries.has(b.entry) : !k.concepts.has(subject)) throw new HttpError(400, `unknown ${b.entry ? 'entry' : 'concept'}: ${subject}`);
    const items: AnswerItem[] = b.items;
    const filled = filledAnswers(items);
    const label = b.entry ? `entry ${b.entry}` : `concept ${b.concept}`;
    const tpl = parseFrontmatter(await this.services.wiki.readText('wiki/operations/templates/journal-answers-payload.md')).data;
    const template = { header: String(tpl.header ?? ''), item: String(tpl.item ?? ''), footer: String(tpl.footer ?? '') };
    const payload = answersPayload({ date: this.today(), subject: label, items, template });
    if (!payload) throw new HttpError(400, 'every answer box is empty');
    let recorded = 0;
    if (b.record) {
      for (const it of filled) {
        await this.services.decisions.append('journal', {
          actor: 'matt',
          module: 'journal',
          subject,
          action: 'answer',
          value: it.value,
          note: `Q${it.label} · ${it.question}`,
        });
        recorded++;
      }
      this.services.events.emit('wiki-changed', { module: 'journal', paths: ['wiki/journal/decisions.jsonl'] });
    }
    if (!b.launch) return { recorded, payload, terminal: null };
    try {
      assertSafePermission(b.permission);
      const terminal = await this.launchOp({
        operation: 'journal-record-answers',
        params: { ...(b.entry ? { entry: b.entry } : { concept: String(b.concept) }), payload },
        ...(b.runner ? { runner: b.runner } : {}),
        ...(b.permission ? { permission: b.permission } : {}),
        ...(b.model ? { model: b.model } : {}),
        ...(b.effort ? { effort: b.effort } : {}),
      });
      return { recorded, payload, terminal };
    } catch (error) {
      return { recorded, payload, terminal: null, error: (error as Error).message };
    }
  }

  async reviewPresets(): Promise<ReviewPreset[]> {
    return parseReviewPresets(await this.services.wiki.readText(REVIEW_TEMPLATE).catch(() => ''));
  }

  /** Review chat: launch journal-review for one candidate or entry, described in one line under "This run". One live session per item. */
  async review(body: unknown): Promise<TerminalInfo> {
    const b = (body ?? {}) as { subject?: unknown; fixes?: unknown; note?: unknown; runner?: unknown; permission?: unknown; model?: unknown; effort?: unknown };
    const subject = typeof b.subject === 'string' ? b.subject : '';
    const target = parseReviewSubject(subject);
    if (!target) throw new HttpError(400, 'subject must be entry:<slug> or concept:<n>');
    const known = new Set((await this.reviewPresets()).map((p) => p.id));
    const fixes = Array.isArray(b.fixes) ? [...new Set(b.fixes.filter((f): f is string => typeof f === 'string' && known.has(f)))] : [];
    const note = typeof b.note === 'string' ? b.note.replace(/\s+/g, ' ').trim().slice(0, 4000) : '';
    const runner = typeof b.runner === 'string' && REVIEW_RUNNERS.includes(b.runner) ? b.runner : 'claude';
    const permissionIn = typeof b.permission === 'string' ? b.permission : undefined;
    assertSafePermission(permissionIn);
    const permission = permissionIn && permissionIn !== 'default' ? permissionIn : undefined;
    const choice = { model: typeof b.model === 'string' && b.model ? b.model : undefined, effort: typeof b.effort === 'string' && b.effort ? b.effort : undefined };
    const live = this.services.terminals.list().find((t) => t.operation === REVIEW_OPERATION && t.subject === subject && t.status === 'running');
    if (live) throw new HttpError(409, `this item already has a running review (${live.id}); type into it`);
    const { state } = this.svc.state();
    const group = (slug: string): string =>
      state.queue.published.some((r) => r.slug === slug) ? 'published' : state.queue.rejected.some((r) => r.slug === slug) ? 'rejected' : 'live work';
    let line: string;
    let measured = '';
    if (target.kind === 'entry') {
      const e = state.entries.find((x) => x.slug === target.slug);
      if (!e) throw new HttpError(404, `unknown entry: ${target.slug}`);
      line = `Entry ${e.slug} · ${e.title} (wiki/journal/entries/${e.slug}/), queue group: ${group(e.slug)}`;
      measured = this.svc.measured({ entry: e.slug });
    } else {
      const c = state.concepts.find((x) => x.number === target.number);
      if (!c) throw new HttpError(404, `unknown concept: ${target.number}`);
      line = `Candidate concept ${c.number} · ${c.headline} (${state.sources.proposals}, section ${c.number})${c.entrySlug ? `, entry ${c.entrySlug}` : ''}`;
      measured = this.svc.measured({ concept: String(c.number) });
    }
    const params = { subject, target: line, state: measured, fixes: fixes.join(', '), note };
    try {
      return await this.services.operations.launch(REVIEW_OPERATION, params, runner as RunnerId, permission, undefined, choice);
    } catch (error) {
      throw new HttpError(400, (error as Error).message);
    }
  }

  private async def(id: string): Promise<OperationDef> {
    const def = (await this.services.operations.list()).find((d) => d.id === id);
    if (!def) throw new HttpError(404, `unknown operation: ${id}`);
    return def;
  }

  /** Fill the optional measured-state parameter, normalise a concept reference, then launch through the shared operations launcher. */
  private async prepared(body: z.infer<typeof launchSchema>): Promise<{ def: OperationDef; params: Record<string, string> }> {
    assertSafePermission(body.permission);
    const def = await this.def(body.operation);
    const params = { ...body.params };
    const { state } = this.svc.state();
    if (params.entry && def.id !== 'journal-reopen' && def.id !== 'journal-reject' && !state.entries.some((e) => e.slug === params.entry)) {
      throw new HttpError(400, `unknown entry: ${params.entry}`);
    }
    if (params.concept) {
      const c = state.concepts.find((x) => String(x.number) === params.concept || x.headline === params.concept);
      if (c) params.concept = `${c.number} · ${c.headline}`;
    }
    if (def.params.some((p) => p.name === 'state') && !params.state) {
      const m = this.svc.measured({ ...(params.entry ? { entry: params.entry } : {}), ...(params.concept ? { concept: params.concept.split(' · ')[0] as string } : {}) });
      if (m) params.state = m;
    }
    return { def, params };
  }

  async launchOp(body: unknown): Promise<TerminalInfo> {
    const b = parseBody(launchSchema, body);
    const { params } = await this.prepared(b);
    const permission = b.permission && b.permission !== 'default' ? b.permission : undefined;
    try {
      return await this.services.operations.launch(b.operation, params, b.runner as RunnerId | undefined, permission, b.prompt, { model: b.model, effort: b.effort });
    } catch (error) {
      throw new HttpError(400, (error as Error).message);
    }
  }

  /** The exact prompt the launcher will hand over (body, then `## This run`). */
  async preview(body: unknown): Promise<{ text: string; def: OperationDef }> {
    const b = parseBody(launchSchema, body);
    const { def, params } = await this.prepared(b);
    const file = path.join(this.svc.root, 'wiki', 'operations', 'prompts', `${def.id}.md`);
    const parsed = parsePrompt(await fs.readFile(file, 'utf8'), `${def.id}.md`);
    return { text: renderPrompt(parsed, params, this.svc.root), def };
  }
}
