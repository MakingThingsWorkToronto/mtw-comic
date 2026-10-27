import { Link } from '../../../web/shell/Link';
import { Table } from '../../../web/ui';
import type { Column } from '../../../web/ui';
import { copy } from '../copy';
import layout from '../layout.json';
import { disagreements, waitingWithoutRejected } from '../shared';
import type { JournalState } from '../shared';
import { EntryLink, Notice, Sections, jUrl } from './common';
import type { Overview } from './useJournal';

type Waiting = JournalState['waiting'][number];

export function Front({ data }: { data: Overview }) {
  const { state, decisions } = data;
  const c = state.counts;
  const cols: Column<Waiting>[] = [
    {
      key: 'entry',
      header: copy.front.columns.entry,
      render: (w) => (w.entrySlug ? <EntryLink slug={w.entrySlug} title={w.entryTitle} /> : <Link href={jUrl('concept', String(w.conceptNumber))}>{w.entryTitle}</Link>),
      sort: (a, b) => a.entryTitle.localeCompare(b.entryTitle),
    },
    { key: 'ask', header: copy.front.columns.ask, render: (w) => <span title={w.ask}>{w.ask}</span> },
    { key: 'detail', header: copy.front.columns.detail, render: (w) => <span class="muted" title={w.detail}>{w.detail}</span> },
    {
      key: 'open',
      header: '',
      align: 'actions',
      render: (w) => (
        <Link
          class="btn btn--small btn--secondary"
          href={w.entrySlug ? `${jUrl('entry', w.entrySlug)}?tab=${w.ask.includes('draft') ? 'notes' : 'interview'}` : jUrl('concept', String(w.conceptNumber))}
          aria-label={`${copy.front.open} ${w.entryTitle}: ${w.ask}`}
          title="Opens the page where you can answer or review what is waiting on you here. Nothing is changed by opening it."
        >
          {copy.front.open}
        </Link>
      ),
    },
  ];
  return (
    <Sections
      order={layout.front}
      map={{
        disagreements: () => <Notice title={copy.disagree.title} items={disagreements(state, decisions)} />,
        facts: () => (
          <>
            {!state.queue.found && <Notice kind="info" title={copy.front.queueMissing} />}
            <p class="muted j-facts">
              {c.entries} {copy.front.facts.entries} · {c.entriesDrafted} {copy.front.facts.drafts} · {c.answerRounds} {copy.front.facts.rounds} · {c.approved} {copy.front.facts.approved} · {c.unreconciledClaims} {copy.front.facts.unreconciled}
            </p>
          </>
        ),
        waiting: () => <Table columns={cols} rows={waitingWithoutRejected(state.waiting, decisions)} rowKey={(w) => `${w.entrySlug ?? w.where}-${w.ask}`} empty={copy.front.empty} />,
      }}
    />
  );
}
