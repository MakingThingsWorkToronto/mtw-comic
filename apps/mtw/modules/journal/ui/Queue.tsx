import { useState } from 'preact/hooks';
import { Link } from '../../../web/shell/Link';
import { setQuery } from '../../../web/shell/router';
import { Button, EmptyState, Table, Tabs, Toolbar } from '../../../web/ui';
import type { Column } from '../../../web/ui';
import { copy } from '../copy';
import layout from '../layout.json';
import { disagreements, show, withoutRejectedCandidates } from '../shared';
import type { QueueRowRaw, QueueViewRow } from '../shared';
import { ActionDialog } from './ActionDialog';
import { Approval, Cover, EntryLink, Notice, jUrl, launchFields } from './common';
import type { RunnerChoice } from './common';
import { jpost } from './useJournal';
import type { Overview } from './useJournal';

export function Queue({ data, tab, onChanged }: { data: Overview; tab: string; onChanged: () => void }) {
  const { state, decisions } = data;
  const queue = withoutRejectedCandidates(data.queue, decisions);
  const themeSizeOf = (r: QueueViewRow): string | undefined => (r.slug === null && r.conceptNumber !== null ? state.concepts.find((c) => c.number === r.conceptNumber)?.themeSize : undefined);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [reopening, setReopening] = useState<QueueRowRaw | null>(null);
  const q = state.queue;
  const counts: Record<string, number> = { queue: queue.length, published: q.published.length, rejected: q.rejected.length };
  const active = (layout.queueTabs as string[]).includes(tab) ? tab : 'queue';

  const toggle = (key: string): void =>
    setPicked((s) => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  const allKeys = queue.map((r) => r.key);
  const allOn = allKeys.length > 0 && allKeys.every((k) => picked.has(k));

  const columns: Column<QueueViewRow>[] = [
    {
      key: 'pick',
      header: copy.queue.columns.pick,
      render: (r) => <input type="checkbox" checked={picked.has(r.key)} onChange={() => toggle(r.key)} aria-label={`Select ${r.title}`} />,
    },
    { key: 'cover', header: copy.queue.columns.cover, render: (r) => (r.slug ? <Cover cover={r.cover} /> : null) },
    {
      key: 'entry',
      header: copy.queue.columns.entry,
      sort: (a, b) => a.title.localeCompare(b.title),
      render: (r) => (
        <div class="j-cell">
          {r.slug ? <EntryLink slug={r.slug} title={r.title} /> : r.conceptNumber !== null ? <Link href={jUrl('concept', String(r.conceptNumber))}>{r.title}</Link> : r.title}
          {(r.description || themeSizeOf(r)) && (
            <div class="muted j-sub" title={r.description}>
              {[r.description, themeSizeOf(r) ? `Theme size: ${themeSizeOf(r)}` : ''].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
      ),
    },
    { key: 'stage', header: copy.queue.columns.stage, render: (r) => <span title={r.stage}>{r.stage}</span> },
    { key: 'waiting', header: copy.queue.columns.waiting, render: (r) => <span title={r.waitingOn}>{r.waitingOn}</span> },
    {
      key: 'facts',
      header: copy.queue.columns.facts,
      render: (r) =>
        r.slug ? (
          <span class="muted">
            {show(r.bodyWords)} words · {r.rounds} rounds · {r.questionsWaiting} open
          </span>
        ) : null,
    },
    { key: 'approval', header: copy.queue.columns.approval, render: (r) => <Approval value={r.approval} /> },
    {
      key: 'actions',
      header: copy.queue.columns.actions,
      align: 'actions',
      render: (r) =>
        r.slug ? (
          <span class="row">
            {r.hasPost && (
              <Link class="btn btn--small btn--secondary" href={jUrl('entry', r.slug, 'preview')} title="Opens a readable preview of this entry inside Studio. Nothing is changed.">
                {copy.entry.preview}
              </Link>
            )}
            {r.localSiteUrl && r.hasPost && (
              <a class="btn btn--small btn--ghost" href={r.localSiteUrl} target="_blank" rel="noopener noreferrer" title="Opens this entry's page on your local copy of the website in a new browser tab. Nothing is changed.">
                {copy.entry.site}
              </a>
            )}
          </span>
        ) : null,
    },
  ];

  const selectedRows = queue.filter((r) => picked.has(r.key));
  const rejectNames = selectedRows.map((r) => r.name);

  const reject = async (c: RunnerChoice) => {
    for (const r of selectedRows) {
      await jpost('/decide', { subject: r.slug ?? (r.conceptNumber !== null ? `concept-${r.conceptNumber}` : r.title), action: 'reject', ...(reason.trim() ? { note: reason.trim() } : {}) });
    }
    const terminal = await jpost<{ id: string }>('/launch', {
      operation: 'journal-reject',
      params: { entries: rejectNames.join('; '), ...(reason.trim() ? { reasons: reason.trim() } : {}) },
      ...launchFields(c),
    });
    setPicked(new Set());
    setReason('');
    onChanged();
    return { terminal };
  };

  const reopen = async (c: RunnerChoice) => {
    const row = reopening as QueueRowRaw;
    await jpost('/decide', { subject: row.slug ?? row.entry, action: 'reopen' });
    const terminal = await jpost<{ id: string }>('/launch', { operation: 'journal-reopen', params: { entry: row.entry }, ...launchFields(c) });
    onChanged();
    return { terminal };
  };

  return (
    <>
      <Notice title={copy.disagree.title} items={disagreements(state, decisions)} />
      <Tabs
        label="Queue groups"
        value={active}
        onChange={(id) => setQuery({ tab: id === 'queue' ? undefined : id })}
        items={(layout.queueTabs as string[]).map((id) => ({ id, label: `${copy.queue.tabs[id as 'queue']} (${counts[id]})` }))}
      />
      {active === 'queue' && (
        <>
          <Toolbar label="Queue actions">
            <label class="row">
              <input type="checkbox" checked={allOn} onChange={() => setPicked(allOn ? new Set() : new Set(allKeys))} />
              <span>{copy.queue.selectAll}</span>
            </label>
            <Button variant="danger" disabled={!picked.size} help="Opens a window to confirm rejecting the ticked ideas. Confirming records the rejection and opens a terminal where an agent moves them to the Rejected list with your reason. Nothing is deleted, and you can reopen them later." onClick={() => setRejecting(true)}>
              {copy.queue.reject}
            </Button>
          </Toolbar>
          <Table columns={columns} rows={queue} rowKey={(r) => r.key} empty={copy.queue.empty.queue} />
          {rejecting && (
            <ActionDialog title={copy.rejectDialog.title} body={copy.rejectDialog.body} confirm={copy.rejectDialog.confirm} confirmHelp="Records that you rejected the ticked ideas, then opens a terminal where an agent moves them to the Rejected list with your reason. Nothing is deleted." onClose={() => setRejecting(false)} operation="journal-reject" run={reject}>
              <ul class="j-list">
                {rejectNames.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
              <div class="field">
                <label for="j-reject-reason">{copy.rejectDialog.reason}</label>
                <input id="j-reject-reason" class="input" value={reason} onInput={(e) => setReason((e.target as HTMLInputElement).value)} />
              </div>
            </ActionDialog>
          )}
        </>
      )}
      {active === 'published' &&
        (q.published.length ? (
          <Table
            columns={[
              { key: 'entry', header: copy.queue.published.entry, render: (r: QueueRowRaw) => r.entry },
              { key: 'published', header: copy.queue.published.published, render: (r: QueueRowRaw) => r.published ?? '' },
              { key: 'route', header: copy.queue.published.route, render: (r: QueueRowRaw) => r.route ?? '' },
            ]}
            rows={q.published}
            rowKey={(r) => r.entry}
          />
        ) : (
          <EmptyState>
            {copy.queue.empty.published} {copy.queue.claim}: “{show(q.publishedClaim)}”
          </EmptyState>
        ))}
      {active === 'rejected' &&
        (q.rejected.length ? (
          <>
            <Table
              columns={[
                { key: 'entry', header: copy.queue.rejected.entry, render: (r: QueueRowRaw) => r.entry },
                { key: 'rejected', header: copy.queue.rejected.rejected, render: (r: QueueRowRaw) => r.rejected ?? '' },
                { key: 'reason', header: copy.queue.rejected.reason, render: (r: QueueRowRaw) => <span title={r.reason}>{r.reason ?? ''}</span> },
                {
                  key: 'actions',
                  header: copy.queue.rejected.actions,
                  align: 'actions',
                  render: (r: QueueRowRaw) => (
                    <Button small aria-label={`${copy.queue.reopen} ${r.entry}`} help="Opens a window to confirm putting this idea back in the queue. Confirming opens a terminal where an agent moves it back and keeps its history." onClick={() => setReopening(r)}>
                      {copy.queue.reopen}
                    </Button>
                  ),
                },
              ]}
              rows={q.rejected}
              rowKey={(r) => r.entry}
            />
            {reopening && (
              <ActionDialog title={`${copy.reopenDialog.title}: ${reopening.entry}`} body={copy.reopenDialog.body} confirm={copy.reopenDialog.confirm} confirmHelp="Records that you reopened this idea, then opens a terminal where an agent moves it back into the queue and keeps its history." onClose={() => setReopening(null)} operation="journal-reopen" run={reopen} />
            )}
          </>
        ) : (
          <EmptyState>
            {copy.queue.empty.rejected} {copy.queue.claim}: “{show(q.rejectedClaim)}”
          </EmptyState>
        ))}
    </>
  );
}
