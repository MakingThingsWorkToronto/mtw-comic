import { useEffect, useState } from 'preact/hooks';
import { api } from '../../web/api';
import { formatTokens } from '../../web/format';
import { buildUrl } from '../../web/shell/route';
import { navigate } from '../../web/shell/router';
import { terminals } from '../../web/state';
import { Badge, EmptyState } from '../../web/ui';

export interface RunContrib {
  id: string;
  title: string;
  operation?: string;
  module?: string;
  startedAt: string;
  status: string;
  exitCode?: number;
  contributed?: string[];
  contributedNote?: string | null;
  contributedMissing?: boolean;
  changedFiles?: string[];
  tokensTotal?: number;
}

const when = (iso: string) => new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

/** What a run said it contributed, and the repo paths it changed (git status before and after). */
export function ContributionDetail({ run }: { run: RunContrib }) {
  const files = run.changedFiles ?? [];
  return (
    <div class="contrib">
      {run.status === 'running' ? (
        <p class="sub">Contributions are recorded when the run exits.</p>
      ) : run.contributedMissing ? (
        <p class="sub">The run did not end with a "Contributed:" list.</p>
      ) : (run.contributed ?? []).length ? (
        <ul>
          {(run.contributed ?? []).map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      ) : (
        <p class="sub">{`Contributed nothing${run.contributedNote ? `: ${run.contributedNote}` : '.'}`}</p>
      )}
      {files.length > 0 && (
        <details>
          <summary>{`${files.length} changed file${files.length === 1 ? '' : 's'}`}</summary>
          <ul class="contrib-files">
            {files.slice(0, 200).map((f) => (
              <li key={f}>
                <code>{f}</code>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

/** Fetches one run's record; refetches when the terminal list changes (an exit lands, contributions are written). */
export function useRun(id: string): RunContrib | null {
  const [run, setRun] = useState<RunContrib | null>(null);
  useEffect(() => {
    let live = true;
    api.get<RunContrib>(`/api/operations/runs/${encodeURIComponent(id)}`).then((r) => live && setRun(r)).catch(() => live && setRun(null));
    return () => {
      live = false;
    };
  }, [id, terminals.value]);
  return run;
}

export function ContributionsView() {
  const [runs, setRuns] = useState<RunContrib[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    api.get<RunContrib[]>('/api/operations/contributions?limit=40').then((r) => live && (setRuns(r), setError(''))).catch((e: Error) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [terminals.value]);

  return (
    <div class="page">
      <div class="page-head">
        <div class="title-block">
          <h1 class="sr-only">Contributions</h1>
          <p class="sub">What recent runs said they learned and recorded, with the files each run changed.</p>
        </div>
      </div>
      {error && <p role="alert" style="color:var(--error)">{error}</p>}
      {runs && runs.length === 0 && <EmptyState>No operation runs yet.</EmptyState>}
      <div class="stack">
        {(runs ?? []).map((r) => (
          <section key={r.id} class="contrib-run" aria-label={`${r.title} ${when(r.startedAt)}`}>
            <div class="row">
              <a href={buildUrl('operations', ['terminals', r.id])} onClick={(e) => { e.preventDefault(); navigate(buildUrl('operations', ['terminals', r.id])); }}>
                <strong>{r.title}</strong>
              </a>
              <Badge status={r.status as 'running' | 'exited'} />
              <span class="muted">{`${r.module ?? ''} · ${when(r.startedAt)}${r.tokensTotal ? ` · ${formatTokens(r.tokensTotal)}` : ''}${r.exitCode ? ` · exit ${r.exitCode}` : ''}`}</span>
            </div>
            <ContributionDetail run={r} />
          </section>
        ))}
      </div>
    </div>
  );
}
