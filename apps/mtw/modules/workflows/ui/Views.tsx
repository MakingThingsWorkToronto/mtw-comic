// New module (no wiki origin): list, detail and run views.
import { useMemo, useState } from 'preact/hooks';
import { Link } from '../../../web/shell/Link';
import { buildUrl } from '../../../web/shell/route';
import { navigate } from '../../../web/shell/router';
import { api } from '../../../web/api';
import { Badge, Button, Dialog, EmptyState, StepChoices, Table } from '../../../web/ui';
import type { Column, StepChoicesBody, StepToConfirm } from '../../../web/ui';
import { copy } from '../copy';
import { groupByDomain } from '../lib/create';
import { sumTokens } from '../lib/tokens';
import type { Workflow } from '../lib/schema';
import { DiagramView } from './Diagram';
import { NewWorkflowButton } from './NewWorkflow';
import { Steps } from './Steps';
import { fmtTokens, fmtUsd, fmtWhen, llmSteps, nodeBadge, useRemote, wpost } from './util';
import type { DetailData, ListRow, RunData, RunSummary } from './util';

function RunStatus({ run }: { run: RunSummary | null }) {
  if (!run) return <span class="muted">{copy.neverRun}</span>;
  return (
    <span class="wf-cell">
      <Badge status={nodeBadge(run.status)}>{copy.status[run.status] ?? run.status}</Badge>
      <Link href={buildUrl('workflows', ['run', run.runId])}>{fmtWhen(run.startedAt)}</Link>
    </span>
  );
}

/** Starts a run; asks for the workflow's inputs first when it declares any. */
function useStarter() {
  const [asking, setAsking] = useState<{ id: string; title: string; inputs: NonNullable<Workflow['inputs']>; steps: StepToConfirm[] } | null>(null);
  // The provider / model / effort / permission Matt confirmed per LLM step; null until every picker has loaded.
  const [choices, setChoices] = useState<StepChoicesBody | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const go = async (id: string, inputs: Record<string, string>, picked?: StepChoicesBody): Promise<void> => {
    setBusy(true);
    setError('');
    try {
      const out = await wpost<{ run: { runId: string } }>('/run', { id, inputs, ...(picked ? { choices: picked } : {}) });
      setAsking(null);
      navigate(buildUrl('workflows', ['run', out.run.runId]));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const begin = async (id: string, title: string, _needsInput?: boolean): Promise<void> => {
    try {
      // Always read the workflow: the confirm lists its LLM steps, and only a run with neither inputs nor agents starts straight away.
      const d = await (await fetch(`/api/workflows/workflow/${encodeURIComponent(id)}`)).json() as DetailData;
      const steps = llmSteps(d.workflow, await api.operations());
      const inputs = d.workflow?.inputs ?? [];
      if (!inputs.length && !steps.length) return go(id, {});
      setValues({});
      setChoices(null);
      setError('');
      setAsking({ id, title, inputs, steps });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const dialog = asking && (
    <Dialog
      title={`${copy.start.title}: ${asking.title}`}
      onClose={() => setAsking(null)}
      footer={
        <>
          <Button variant="ghost" help="Closes this window without starting the workflow." onClick={() => setAsking(null)}>{copy.cancel}</Button>
          <Button variant="primary" help="Starts this workflow now with the values you entered. Its steps launch agents that you can follow, and it may stop to ask for your approval." disabled={busy || (asking.steps.length > 0 && !choices)} onClick={() => void go(asking.id, values, choices ?? undefined)}>{copy.start.go}</Button>
        </>
      }
    >
      <p class="muted">{copy.start.hint}</p>
      <form class="stack" onSubmit={(e) => { e.preventDefault(); if (!busy && (!asking.steps.length || choices)) void go(asking.id, values, choices ?? undefined); }}>
        {asking.inputs.map((i) => (
          <div class="field" key={i.name}>
            <label for={`wf-in-${i.name}`}>{i.label}{i.required ? ' (required)' : ''}</label>
            <input id={`wf-in-${i.name}`} value={values[i.name] ?? ''} required={Boolean(i.required)} onInput={(e) => setValues({ ...values, [i.name]: (e.target as HTMLInputElement).value })} />
          </div>
        ))}
        {asking.steps.length > 0 && (
          <>
            <p class="muted">{copy.start.agents}</p>
            <StepChoices key={asking.id} steps={asking.steps} onChange={setChoices} />
          </>
        )}
        {error && <p role="alert" style="color:var(--error)">{error}</p>}
      </form>
    </Dialog>
  );
  return { begin, dialog, error: asking ? '' : error, busy };
}

export function ListPage() {
  const { data, error } = useRemote<ListRow[]>('/list', { pollMs: 5000 });
  const starter = useStarter();
  const columns: Column<ListRow>[] = [
    {
      key: 'title',
      header: copy.list.columns.title,
      sort: (a, b) => a.title.localeCompare(b.title),
      render: (r) => (
        <div class="wf-title-cell">
          <div class="wf-cell">
            <Link href={buildUrl('workflows', [r.id])}>{r.title}</Link>
            {r.problems.length > 0 && <span class="wf-problem" title={r.problems.join('; ')}>{copy.list.problem}</span>}
          </div>
          {r.description && <span class="muted wf-desc">{r.description}</span>}
        </div>
      ),
    },
    { key: 'steps', header: copy.list.columns.steps, align: 'num', render: (r) => `${r.nodes} (${r.gates} ${copy.list.gates})`, sort: (a, b) => a.nodes - b.nodes },
    { key: 'last', header: copy.list.columns.last, render: (r) => <RunStatus run={r.last} />, sort: (a, b) => (a.last?.startedAt ?? '').localeCompare(b.last?.startedAt ?? '') },
    {
      key: 'actions',
      header: copy.list.columns.actions,
      align: 'actions',
      render: (r) => (
        <Button small variant="primary" help={r.active ? 'This workflow is already running, so it cannot be started a second time.' : r.problems.length > 0 ? 'This workflow has problems that must be fixed before it can run.' : 'Starts this workflow. If it needs details from you it asks first. Its steps launch agents that you can follow.'} disabled={r.problems.length > 0 || r.active} aria-label={`${copy.run} ${r.title}`} onClick={() => void starter.begin(r.id, r.title, r.needsInput)}>
          {r.active ? copy.status.running : copy.run}
        </Button>
      ),
    },
  ];
  const sections = data ? groupByDomain(data, (r) => r.domain) : [];
  // A server started before the domain field sends rows without it: one "Other" section until Studio restarts.
  const oldServer = Boolean(data?.length) && !data?.some((r) => 'domain' in r);
  return (
    <div class="page">
      <div class="page-head">
        <div class="title-block">
          <h1>{copy.title}</h1>
          <p class="sub">{copy.sub}</p>
        </div>
        <NewWorkflowButton existing={(data ?? []).map((r) => ({ id: r.id, ...(r.domain ? { domain: r.domain } : {}) }))} />
      </div>
      {(error || starter.error) && <p role="alert" style="color:var(--error)">{error || starter.error}</p>}
      {oldServer && <p class="muted">{copy.list.domainsAfterRestart}</p>}
      {!data && !error && <EmptyState>{copy.loading}</EmptyState>}
      {data && data.length === 0 && <EmptyState>{copy.empty}</EmptyState>}
      {sections.map((sec) => {
        const hid = `wf-domain-${sec.domain.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        return (
          <section class="stack wf-domain" aria-labelledby={hid} key={sec.domain}>
            <h2 id={hid}>{sec.domain} <span class="muted wf-count">{sec.rows.length}</span></h2>
            <Table columns={columns} rows={sec.rows} rowKey={(r) => r.id} empty={copy.empty} defaultSort={{ key: 'title', dir: 'asc' }} />
          </section>
        );
      })}
      {starter.dialog}
    </div>
  );
}

export function DetailPage({ id }: { id: string }) {
  const { data, error } = useRemote<DetailData>(`/workflow/${encodeURIComponent(id)}`, { pollMs: 5000 });
  const starter = useStarter();
  if (!data) return <div class="page">{error ? <p role="alert" style="color:var(--error)">{error}</p> : <EmptyState>{copy.loading}</EmptyState>}</div>;
  const w = data.workflow;
  const runColumns: Column<RunSummary>[] = [
    { key: 'started', header: copy.detail.columns.started, render: (r) => <Link href={buildUrl('workflows', ['run', r.runId])}>{fmtWhen(r.startedAt)}</Link> },
    { key: 'status', header: copy.detail.columns.status, render: (r) => <Badge status={nodeBadge(r.status)}>{copy.status[r.status] ?? r.status}</Badge> },
    { key: 'progress', header: copy.detail.columns.progress, render: (r) => `${r.done} of ${r.total}` },
    { key: 'tokens', header: copy.detail.columns.tokens, align: 'num', render: (r) => (r.tokens ? fmtTokens(r.tokens) : '') },
  ];
  return (
    <div class="page">
      <div class="page-head">
        <div class="title-block">
          <h1>{w?.title ?? id}</h1>
          {w?.description && <p class="sub">{w.description}</p>}
        </div>
        {w && (
          <Button variant="primary" help={data.problems.length > 0 ? 'This workflow has problems that must be fixed before it can run.' : 'Starts this workflow. If it needs details from you it asks first. Its steps launch agents that you can follow.'} disabled={data.problems.length > 0} onClick={() => void starter.begin(id, w.title, (w.inputs ?? []).length > 0)}>{copy.run}</Button>
        )}
      </div>
      {w?.notice && <p class="wf-notice">{w.notice}</p>}
      {starter.error && <p role="alert" style="color:var(--error)">{starter.error}</p>}
      {data.problems.length > 0 && (
        <div class="wf-problems" role="alert">
          <strong>{copy.detail.problems}</strong>
          <ul>{data.problems.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
      )}
      {w && data.svg && <DiagramView svg={data.svg} workflow={w} />}
      {w && (
        <section aria-labelledby="wf-steps-h" class="stack">
          <h2 id="wf-steps-h">{copy.detail.steps}</h2>
          <Steps workflow={w} tour={data.tour} />
        </section>
      )}
      <section aria-labelledby="wf-runs-h" class="stack">
        <h2 id="wf-runs-h">{copy.detail.recent}</h2>
        <Table columns={runColumns} rows={data.runs} rowKey={(r) => r.runId} empty={copy.detail.noRuns} />
      </section>
      {starter.dialog}
    </div>
  );
}

export function RunPage({ runId }: { runId: string }) {
  const { data, error, reload } = useRemote<RunData>(`/run/${encodeURIComponent(runId)}`, { pollMs: 1500 });
  const run = data?.run;
  // The diagram and tour come from the workflow's current file; the run keeps its own snapshot of the nodes.
  const detail = useRemote<DetailData>(`/workflow/${encodeURIComponent(run?.workflowId ?? '')}`, { enabled: Boolean(run?.workflow.diagram) });
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const states = useMemo(() => (run ? Object.fromEntries(Object.entries(run.nodes).map(([id, n]) => [id, n.status])) : undefined), [run]);
  if (!run) return <div class="page">{error ? <p role="alert" style="color:var(--error)">{error}</p> : <EmptyState>{copy.loading}</EmptyState>}</div>;

  const totals = sumTokens(run);
  const active = run.status === 'running' || run.status === 'waiting';
  const act = async (fn: () => Promise<unknown>): Promise<void> => {
    setBusy(true);
    setProblem('');
    try {
      await fn();
      reload();
    } catch (e) {
      setProblem((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div class="page">
      <div class="page-head">
        <div class="title-block">
          <h1>{run.title}</h1>
          <p class="sub">
            <Link href={buildUrl('workflows', [run.workflowId])}>Workflow</Link> · started {fmtWhen(run.startedAt)}
          </p>
        </div>
        <div class="row">
          <Badge status={nodeBadge(run.status)}>{copy.status[run.status] ?? run.status}</Badge>
          <span class="wf-total" aria-label={copy.runView.tokens}>
            {totals.nodes ? `${fmtTokens(totals.total)} tokens${totals.estCostUsd ? `, ${fmtUsd(totals.estCostUsd)} ${copy.runView.estimate}` : ''}` : 'no token data yet'}
          </span>
          {active && <Button variant="danger" small help="Stops this run. Steps already finished stay as they are, and steps not yet started will not happen." disabled={busy} onClick={() => void act(() => wpost(`/run/${encodeURIComponent(runId)}/cancel`))}>{copy.runView.cancelRun}</Button>}
        </div>
      </div>
      {run.workflow.notice && <p class="wf-notice">{run.workflow.notice}</p>}
      {problem && <p role="alert" style="color:var(--error)">{problem}</p>}
      <div class={detail.data?.svg ? 'wf-split' : ''}>
        {detail.data?.svg && <DiagramView svg={detail.data.svg} workflow={run.workflow} states={states as never} />}
        <Steps
          workflow={run.workflow}
          tour={detail.data?.tour}
          nodes={run.nodes}
          busy={busy}
          onDecide={(node, decision, note) => act(() => wpost(`/run/${encodeURIComponent(runId)}/decide`, { node, decision, note }))}
        />
      </div>
    </div>
  );
}
