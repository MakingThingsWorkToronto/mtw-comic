import { useEffect, useState } from 'preact/hooks';
import type { TerminalInfo } from '../types';
import { api } from '../../web/api';
import type { RunnerOption } from '../../web/api';
import { formatDuration, formatEstUsd, formatPercent, formatTokens } from '../../web/format';
import { Link } from '../../web/shell/Link';
import { buildUrl } from '../../web/shell/route';
import { navigate, route, setQuery } from '../../web/shell/router';
import { terminals, useLiveResource } from '../../web/state';
import { Badge, Button, ConfirmLaunch, EmptyState, Menu, Table, Tabs, TabActions, launchBody } from '../../web/ui';
import type { Column, LaunchArgs } from '../../web/ui';
import { ContributionDetail, useRun } from './ContributionsView';
import { TerminalPane } from './TerminalPane';

const when = (iso: string) => new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const goto = (id: string) => navigate(buildUrl('operations', ['terminals', id]));

/** Ticks while anything runs so durations stay live. */
function useNow(active: boolean): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);
  return active ? now : Date.now();
}

const durationOf = (t: TerminalInfo, now: number): number => (t.exitedAt ? Date.parse(t.exitedAt) : now) - Date.parse(t.startedAt);
const tokensLabel = (t: TerminalInfo): string => (t.tokens ? `${formatTokens(t.tokens.total)} · ${formatPercent(t.tokens.cacheHitRate)} cache${t.tokens.estCostUsd !== undefined ? ` · ${formatEstUsd(t.tokens.estCostUsd)} est.` : ''}` : t.runner === 'shell' ? '' : 'none yet');

export const RESUME_HELP = 'Reopens this conversation in a new terminal from its saved transcript, so you can keep going where it stopped.';

/**
 * The confirm shown before an ended terminal's saved conversation is reopened: the provider is fixed to the original and
 * the original model and effort are preselected. Anything changed here is sent with the resume (never a bypass permission).
 */
export function ResumeDialog({ t, onClose }: { t: TerminalInfo; onClose: () => void }) {
  return (
    <ConfirmLaunch
      forceRunner={t.runner}
      lockRunner
      initial={{ ...(t.model ? { model: t.model } : {}), ...(t.effort ? { effort: t.effort } : {}) }}
      title={`Resume ${t.title}`}
      body="Reopens this conversation in a new terminal from its saved transcript. The provider stays the same; you can change the model and effort. A permission you leave on Default keeps the original's (never a bypass mode)."
      confirm="Resume"
      confirmHelp={RESUME_HELP}
      onClose={onClose}
      run={(args) => api.post<TerminalInfo>(`/api/operations/runs/${encodeURIComponent(t.id)}/resume`, launchBody(args))}
    />
  );
}

/** The confirm shown before a New terminal for claude or codex: provider, model, effort and permission (no procedure, so Operations > Defaults fills what is left empty). */
export function NewTerminalDialog({ runner, onClose }: { runner: string; onClose: () => void }) {
  return (
    <ConfirmLaunch
      forceRunner={runner}
      title="New terminal"
      body="Opens an empty agent session you can type into. Choose the provider, model, effort and permission; anything left on the saved default uses Operations > Defaults."
      confirm="Open terminal"
      onClose={onClose}
      run={(args) => api.spawnTerminal(args[0], undefined, { ...(args[1] !== 'default' ? { permission: args[1] } : {}), ...args[2] })}
    />
  );
}

/** A shell has no model or effort to confirm, so it starts straight away. */
export async function startShell(): Promise<void> {
  const t = await api.spawnTerminal('shell');
  goto(t.id);
}

export function TerminalsView() {
  const [error, setError] = useState('');
  const filter = route.value.query.get('status') ?? 'all';
  const all = terminals.value;
  const rows = filter === 'all' ? all : all.filter((t) => t.status === filter);
  const now = useNow(all.some((t) => t.status === 'running'));
  const runners = useLiveResource<RunnerOption[]>('/api/operations/runners', { module: 'operations' }).data ?? [];

  const [resuming, setResuming] = useState<TerminalInfo | null>(null);
  const [starting, setStarting] = useState<string | null>(null);
  const kill = (t: TerminalInfo) => api.killTerminal(t.id).catch((e: Error) => setError(e.message));
  const columns: Column<TerminalInfo>[] = [
    { key: 'runner', header: 'Runner', render: (t) => t.runner, sort: (a, b) => a.runner.localeCompare(b.runner) },
    { key: 'title', header: 'Operation', render: (t) => t.title, sort: (a, b) => a.title.localeCompare(b.title) },
    { key: 'module', header: 'Module', render: (t) => t.module ?? '', sort: (a, b) => (a.module ?? '').localeCompare(b.module ?? '') },
    { key: 'started', header: 'Started', render: (t) => when(t.startedAt), sort: (a, b) => a.startedAt.localeCompare(b.startedAt) },
    { key: 'duration', header: 'Duration', render: (t) => formatDuration(durationOf(t, now)), sort: (a, b) => durationOf(a, now) - durationOf(b, now) },
    { key: 'status', header: 'Status', render: (t) => (
        <>
          <Badge status={t.status} />
          {t.interrupted ? <span class="muted"> stopped unexpectedly</span> : null}
          {t.resumedFrom ? <span class="muted"> resumed</span> : null}
        </>
      ), sort: (a, b) => a.status.localeCompare(b.status) },
    { key: 'tokens', header: 'Tokens', render: (t) => tokensLabel(t), sort: (a, b) => (a.tokens?.total ?? 0) - (b.tokens?.total ?? 0) },
    {
      key: 'actions',
      header: '',
      align: 'actions',
      render: (t) =>
        t.status === 'running' ? (
          <Button small variant="danger" help="Stops this running session right now. Anything the agent was still doing is abandoned." aria-label={`Kill ${t.title}`} onClick={(e) => { e.stopPropagation(); void kill(t); }}>
            Kill
          </Button>
        ) : t.sessionId ? (
          <Button small variant="secondary" aria-label={`Resume ${t.title}`} help={RESUME_HELP} onClick={(e) => { e.stopPropagation(); setResuming(t); }}>
            Resume
          </Button>
        ) : null,
    },
  ];

  return (
    <div class="page">
      <div class="page-head">
        <div class="title-block">
          <h1 class="sr-only">Terminals</h1>
          <p class="sub">Every operation and scheduled run opens here. Sessions keep running when you leave this page.</p>
        </div>
      </div>
      <TabActions>
        <Menu
          label="New terminal"
          items={runners.map((r) => ({
            id: r.id,
            label: r.status === 'untested' && !r.label.includes('untested') ? `${r.label} (untested)` : r.label,
            onSelect: () => (r.status === 'untested' ? setError(`${r.label} is untested and cannot be launched yet.`) : r.id === 'shell' ? void startShell().catch((e: Error) => setError(e.message)) : setStarting(r.id)),
          }))}
        />
      </TabActions>
      <Tabs
        label="Status"
        value={filter}
        onChange={(id) => setQuery({ status: id === 'all' ? undefined : id })}
        items={[
          { id: 'all', label: 'All' },
          { id: 'running', label: 'Running' },
          { id: 'exited', label: 'Exited' },
        ]}
      />
      {error && <p class="error" role="alert" style="color:var(--error)">{error}</p>}
      {resuming && <ResumeDialog t={resuming} onClose={() => setResuming(null)} />}
      {starting && <NewTerminalDialog key={starting} runner={starting} onClose={() => setStarting(null)} />}
      <Table
        columns={columns}
        rows={rows}
        rowKey={(t) => t.id}
        onRowClick={(t) => goto(t.id)}
        rowLabel={(t) => `Open ${t.title}`}
        defaultSort={{ key: 'started', dir: 'desc' }}
        empty="No terminals yet."
      />
    </div>
  );
}

export function TerminalView({ id }: { id: string }) {
  const t = terminals.value.find((x) => x.id === id);
  const [error, setError] = useState('');
  const now = useNow(t?.status === 'running');
  const run = useRun(id);
  const [improveOpen, setImproveOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const improve = async (args: LaunchArgs): Promise<{ id: string }> => api.post<TerminalInfo>(`/api/operations/runs/${encodeURIComponent(id)}/improve`, launchBody(args));
  if (!t) {
    return (
      <div class="page">
        <EmptyState>This terminal is not in the server's list.</EmptyState>
        <Link href={buildUrl('operations', ['terminals'])}>Back to terminals</Link>
      </div>
    );
  }
  return (
    <div class="page">
      <div class="page-head">
        <div class="title-block">
          <h1>{t.title}</h1>
          <p class="sub">
            {`${t.runner}${t.module ? ` · ${t.module}` : ''} · pid ${t.pid} · started ${when(t.startedAt)} · ${formatDuration(durationOf(t, now))}`}
            {t.hasPrompt && (
              <>
                {' · '}
                <a href={`/api/terminals/${encodeURIComponent(t.id)}/prompt.md`} target="_blank" rel="noopener">
                  Prompt file
                </a>
              </>
            )}
          </p>
          {t.tokens ? (
            <dl class="token-counters" aria-label="Token usage">
              {([['Total', t.tokens.total], ['Input', t.tokens.input], ['Output', t.tokens.output], ['Cache read', t.tokens.cacheRead], ['Cache write', t.tokens.cacheWrite]] as const).map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{formatTokens(v)}</dd>
                </div>
              ))}
              <div>
                <dt>Cache hit</dt>
                <dd>{formatPercent(t.tokens.cacheHitRate)}</dd>
              </div>
              {t.tokens.estCostUsd !== undefined ? (
                <div title="API-equivalent estimate from wiki/operations/pricing.json; not a billed amount">
                  <dt>Est. cost</dt>
                  <dd>{formatEstUsd(t.tokens.estCostUsd)}</dd>
                </div>
              ) : null}
              {t.tokens.source && <span class="muted">{t.tokens.source}{t.tokens.model ? ` · ${t.tokens.model}` : ''}</span>}
            </dl>
          ) : t.runner !== 'shell' ? (
            <p class="sub">No token data yet.</p>
          ) : null}
        </div>
        <div class="row">
          <Badge status={t.status} />
          {t.status === 'running' && (
            <Button variant="danger" help="Stops this running session right now. Anything the agent was still doing is abandoned." onClick={() => void api.killTerminal(t.id).catch((e: Error) => setError(e.message))}>
              Kill
            </Button>
          )}
          {t.status === 'exited' && t.sessionId && (
            <Button variant="primary" help={RESUME_HELP} onClick={() => setResumeOpen(true)}>
              Resume
            </Button>
          )}
          {t.operation && t.hasPrompt && (
            <Button variant="secondary" help="Opens a window to confirm which agent, model and effort review this run and suggest edits to its procedure. Nothing starts until you confirm." onClick={() => setImproveOpen(true)}>
              Improve this procedure
            </Button>
          )}
          <Button variant="secondary" help="Goes back to the list of all agent sessions, running and finished." onClick={() => navigate(buildUrl('operations', ['terminals']))}>
            All terminals
          </Button>
        </div>
      </div>
      {error && <p role="alert" style="color:var(--error)">{error}</p>}
      {resumeOpen && <ResumeDialog t={t} onClose={() => setResumeOpen(false)} />}
      {improveOpen && <ConfirmLaunch operation="operations-improve-procedure" title="Improve this procedure" body="An agent reads this run and proposes edits to its procedure. Choose which agent, model and effort do it." onClose={() => setImproveOpen(false)} run={improve} />}
      {t.interrupted && <p class="sub">This terminal stopped without finishing (it crashed or Studio was closed). Resume reopens its saved conversation.</p>}
      {t.operation && run && run.status !== 'running' && (
        <section aria-label="Contributions">
          <h2 class="sr-only">Contributions</h2>
          <ContributionDetail run={run} />
        </section>
      )}
      <TerminalPane id={t.id} running={t.status === 'running'} fill />
    </div>
  );
}
