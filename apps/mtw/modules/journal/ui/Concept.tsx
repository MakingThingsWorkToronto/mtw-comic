import { useState } from 'preact/hooks';
import { Link } from '../../../web/shell/Link';
import { Button, EmptyState, Table } from '../../../web/ui';
import type { Column } from '../../../web/ui';
import { copy } from '../copy';
import layout from '../layout.json';
import { show, sentence } from '../shared';
import type { Stage } from '../shared';
import { ActionDialog } from './ActionDialog';
import { AnswerForm } from './AnswerForm';
import { Approval, Sections, Unk, jUrl, latest, launchFields } from './common';
import type { RunnerChoice } from './common';
import { jpost } from './useJournal';
import type { Overview } from './useJournal';

export function Concept({ data, number, onDirty, onChanged }: { data: Overview; number: number; onDirty: (d: boolean) => void; onChanged: () => void }) {
  const c = data.state.concepts.find((x) => x.number === number);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  if (!c) return <EmptyState>{copy.concept.notFound}</EmptyState>;
  const subject = `concept-${c.number}`;
  // Concept numbers restart in each proposals file, so an approval counts only for the headline it names.
  const last = latest(data.decisions, subject, 'approve-headline');
  const approved = last && (last.value as { headline?: string } | undefined)?.headline === c.headline ? last : null;
  const cols: Column<Stage>[] = [
    { key: 'label', header: 'Stage', render: (s) => s.label },
    { key: 'state', header: 'State', render: (s) => <Unk value={s.state} /> },
    { key: 'evidence', header: 'Evidence', render: (s) => <span title={s.evidence}>{sentence(s.evidence)}</span> },
  ];
  const approveHeadline = async (r: RunnerChoice) => {
    await jpost('/decide', { subject, action: 'approve-headline', value: { headline: c.headline } });
    const terminal = await jpost<{ id: string }>('/launch', { operation: 'journal-open-entry', params: { concept: String(c.number) }, ...launchFields(r) });
    onChanged();
    return { terminal };
  };
  const rejectCandidate = async (r: RunnerChoice) => {
    const why = reason.trim();
    await jpost('/decide', { subject, action: 'reject', ...(why ? { note: why } : {}) });
    const terminal = await jpost<{ id: string }>('/launch', { operation: 'journal-reject', params: { entries: c.headline, ...(why ? { reasons: why } : {}) }, ...launchFields(r) });
    setReason('');
    onChanged();
    return { terminal };
  };
  const group = { id: 'concept', title: copy.concept.questions, why: '', source: c.questionsSource ?? '', items: c.questions.map((q) => ({ label: q.label, question: q.question })) };
  return (
    <div class="page">
      <div class="page-head">
        <div class="title-block">
          <h1>{c.headline}</h1>
          <p class="sub">
            {show(c.category)} · {show(c.service)} · {show(c.headlineCharCountMeasured)} characters · <Approval value={c.approval} />
          </p>
        </div>
        {c.entrySlug && (
          <Link class="btn btn--secondary" href={jUrl('entry', c.entrySlug)} title="Opens the entry that was started from this idea. Nothing is changed.">
            {copy.concept.entry}
          </Link>
        )}
      </div>
      <Sections
        order={layout.concept}
        map={{
          proposal: () => (
            <>
              <h2>{copy.concept.proposal}</h2>
              <dl class="j-dl">
                <dt>{copy.concept.description}</dt>
                <dd>{show(c.description)}</dd>
                <dt>{copy.concept.argument}</dt>
                <dd>{show(c.argument)}</dd>
                {c.share && (
                  <>
                    <dt>{copy.concept.share}</dt>
                    <dd>{c.share}</dd>
                  </>
                )}
                {c.themeSize && (
                  <>
                    <dt>{copy.concept.themeSize}</dt>
                    <dd>{c.themeSize}</dd>
                  </>
                )}
                {c.assessment === undefined ? (
                  <>
                    <dt>{copy.concept.onlyMatt}</dt>
                    <dd>{show(c.onlyMattCanSupply)}</dd>
                  </>
                ) : (
                  <>
                    <dt>{copy.concept.evidence}</dt>
                    <dd>{show(c.evidence)}</dd>
                    <dt>{copy.concept.assessment}</dt>
                    <dd>{show(c.assessment)}</dd>
                    <dt>{copy.concept.week}</dt>
                    <dd>{show(c.proposedWeek)}</dd>
                  </>
                )}
              </dl>
            </>
          ),
          stages: () => (
            <>
              <h3>{copy.concept.stages}</h3>
              <Table columns={cols} rows={c.stages} rowKey={(s) => s.id} />
            </>
          ),
          approveHeadline: () => (
            <div class="row">
              {!c.entrySlug && (
                <Button variant="primary" help="Opens a window to confirm. Confirming records that you approve this headline exactly as shown, then opens a terminal where an agent sets up the entry: its folder with drafted questions, a queue row and a link back to this idea. The interview comes next; nothing is published." onClick={() => setApproving(true)}>
                  {copy.concept.approveHeadline}
                </Button>
              )}
              {!c.entrySlug && (
                <Button variant="danger" help="Rejects this candidate idea. It moves to the Rejected tab with your reason and can be reopened later; nothing is deleted." onClick={() => setRejecting(true)}>
                  Reject…
                </Button>
              )}
              {rejecting && (
                <ActionDialog title="Reject this candidate" body="Records a reject decision for this idea, then launches the recorder that moves it to the Rejected list in queue.md. Nothing is deleted; you can reopen it later." confirm="Reject and launch" confirmHelp="Records that you rejected this idea, then opens a terminal where an agent moves it to the Rejected list with your reason." onClose={() => setRejecting(false)} operation="journal-reject" run={rejectCandidate}>
                  <p>
                    <strong>{c.headline}</strong>
                  </p>
                  <div class="field">
                    <label for="reject-reason">Reason (optional)</label>
                    <input id="reject-reason" class="input" title="Why you are rejecting this idea. It is saved with the decision and shown in the Rejected list." value={reason} onInput={(e) => setReason((e.target as HTMLInputElement).value)} />
                  </div>
                </ActionDialog>
              )}
              {approving && (
                <ActionDialog title={copy.concept.approveHeadlineTitle} body={copy.concept.approveHeadlineBody} confirm={copy.concept.approveHeadlineConfirm} confirmHelp="Records your approval of this headline, then opens a terminal where an agent sets up the entry for the interview. Nothing is published." onClose={() => setApproving(false)} operation="journal-open-entry" run={approveHeadline}>
                  <p>
                    <strong>{c.headline}</strong>
                  </p>
                </ActionDialog>
              )}
              {approved && <span class="muted">{copy.concept.headlineApproved}, {approved.at.slice(0, 10)}</span>}
            </div>
          ),
          answers: () =>
            c.questions.length ? (
              <>
                <h2 id="answers">{copy.answers.title}</h2>
                <p class="muted">{copy.answers.sub}</p>
                <AnswerForm groups={[group]} target={{ concept: c.number }} onDirty={onDirty} onRecorded={onChanged} />
              </>
            ) : (
              <p class="muted">{copy.concept.noQuestions}</p>
            ),
        }}
      />
    </div>
  );
}
