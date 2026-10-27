import { useEffect, useRef, useState } from 'preact/hooks';
import type { OperationDef } from '../../types';
import { api } from '../../../web/api';
import type { RunnerOption } from '../../../web/api';
import { ChangedBar } from '../../../web/shell/ChangedBar';
import { Link } from '../../../web/shell/Link';
import { buildUrl } from '../../../web/shell/route';
import { navigate } from '../../../web/shell/router';
import { Button, EmptyState, IconButton, Table } from '../../../web/ui';
import type { Column } from '../../../web/ui';
import { copy } from '../copy';
import type { ScheduleView } from '../lib/scheduler';
import type { RunRecord, Schedule, SkipRecord } from '../lib/store';
import { stepsOf } from '../shared';
import { runBadge } from './List';
import { fmtWhen, sget, spost, useRemote } from './util';

interface DetailResponse {
  owner: { mine: boolean; pid: number | null };
  view: ScheduleView;
  runs: RunRecord[];
  skips: SkipRecord[];
}

const toLines = (p: Record<string, string>): string => Object.entries(p).map(([k, v]) => `${k}=${v}`).join('\n');
const fromLines = (text: string): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const i = line.indexOf('=');
    if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return out;
};

interface Draft {
  id: string;
  title: string;
  operation: string;
  params: string;
  runner: string;
  permission: string;
  cron: string;
  chain: string[];
  timeout: string;
}

const blank: Draft = { id: '', title: '', operation: '', params: '', runner: 'claude', permission: 'default', cron: '0 7 * * 1', chain: [], timeout: '' };

const draftOf = (s: Schedule): Draft => ({
  id: s.id,
  title: s.title,
  operation: s.operation,
  params: toLines(s.params),
  runner: s.runner,
  permission: s.permission,
  cron: s.cron,
  chain: s.chain ? stepsOf(s).map((x) => x.operation) : [],
  timeout: s.stepTimeoutMinutes ? String(s.stepTimeoutMinutes) : '',
});

export function ScheduleDetail({ id }: { id: string }) {
  const isNew = id === 'new';
  const dirty = useRef(false);
  const { data, error, reload, live } = useRemote<DetailResponse>(isNew ? '/status' : `/schedule/${encodeURIComponent(id)}`, { hold: () => dirty.current, pollMs: 5000 });
  const [draft, setDraft] = useState<Draft>(blank);
  const [loaded, setLoaded] = useState(isNew);
  const [ops, setOps] = useState<OperationDef[]>([]);
  const [runners, setRunners] = useState<RunnerOption[]>([]);
  const [preview, setPreview] = useState<{ valid: boolean; error?: string; next?: string[] } | null>(null);
  const [message, setMessage] = useState('');
  const [problem, setProblem] = useState('');

  useEffect(() => {
    api.operations().then(setOps, () => setOps([]));
    api.runners().then(setRunners, () => setRunners([]));
  }, []);

  useEffect(() => {
    const s = (data as DetailResponse | null)?.view?.schedule;
    if (!isNew && s && !dirty.current) {
      setDraft(draftOf(s));
      setLoaded(true);
    }
  }, [data]);

  useEffect(() => {
    const t = setTimeout(() => {
      sget<{ valid: boolean; error?: string; next?: string[] }>(`/preview-cron?cron=${encodeURIComponent(draft.cron)}`).then(setPreview, () => setPreview(null));
    }, 250);
    return () => clearTimeout(t);
  }, [draft.cron]);

  const edit = (patch: Partial<Draft>): void => {
    dirty.current = true;
    setMessage('');
    setDraft((d) => ({ ...d, ...patch }));
  };

  const runnerChoices = runners.filter((r) => r.id !== 'shell');
  const perms = (runnerChoices.find((r) => r.id === draft.runner)?.permissions ?? []).filter((p) => !/bypass|dangerous/i.test(p.id));
  const opChoices = ops.filter((o) => o.runner !== 'shell');

  const save = async (): Promise<void> => {
    setProblem('');
    setMessage('');
    try {
      const body = {
        id: draft.id.trim(),
        title: draft.title.trim(),
        operation: draft.chain[0] ?? draft.operation,
        params: fromLines(draft.params),
        runner: draft.runner,
        permission: draft.permission,
        cron: draft.cron.trim(),
        ...(draft.chain.length ? { chain: draft.chain.map((operation) => ({ operation })) } : {}),
        ...(draft.timeout.trim() ? { stepTimeoutMinutes: Number(draft.timeout) } : {}),
      };
      await spost('/save', { schedule: body, ...(isNew ? {} : { originalId: id }) });
      dirty.current = false;
      setMessage(copy.detail.saved);
      if (isNew) navigate(buildUrl('schedules', [body.id]));
      else reload();
    } catch (e) {
      setProblem((e as Error).message);
    }
  };

  const view = isNew ? null : (data as DetailResponse | null)?.view ?? null;
  if (!isNew && !data && !error) return <EmptyState>Loading.</EmptyState>;
  if (!isNew && error && !data) return <p role="alert" style="color:var(--error)">{error}</p>;
  if (!isNew && view && !view.schedule) {
    return (
      <p role="alert">
        {copy.detail.unreadable} {view.problems.join('; ')}
      </p>
    );
  }
  if (!loaded) return <EmptyState>Loading.</EmptyState>;

  const runCols: Column<RunRecord>[] = [
    { key: 'started', header: copy.detail.columns.started, render: (r) => fmtWhen(r.startedAt) },
    { key: 'trigger', header: copy.detail.columns.trigger, render: (r) => r.trigger },
    { key: 'status', header: copy.detail.columns.status, render: (r) => runBadge(r, false) },
    {
      key: 'steps',
      header: copy.detail.columns.steps,
      render: (r) => (
        <span class="row">
          {r.steps.map((s) =>
            s.terminalId ? (
              <Link key={s.index} href={buildUrl('operations', ['terminals', s.terminalId])} title={s.exitCode !== undefined ? `exit ${s.exitCode}` : 'running'}>
                {s.operation}
                {s.exitCode !== undefined && s.exitCode !== 0 ? ` (exit ${s.exitCode})` : ''}
              </Link>
            ) : (
              <span key={s.index} class="muted">{s.operation}</span>
            ),
          )}
        </span>
      ),
    },
    { key: 'reason', header: copy.detail.columns.reason, render: (r) => <span title={r.reason ?? ''}>{r.reason ?? ''}</span> },
  ];

  const missing = !draft.id.trim() || !draft.title.trim() || !(draft.chain[0] ?? draft.operation) || !draft.cron.trim() || (preview !== null && !preview.valid);

  return (
    <div class="page">
      <div class="page-head">
        <div class="title-block">
          <h1>{isNew ? copy.detail.newTitle : draft.title || id}</h1>
          <p class="sub">
            <Link href={buildUrl('schedules')}>{copy.detail.back}</Link>
            {view?.schedule && <> · {view.schedule.enabled ? copy.list.on : copy.list.off}. {copy.detail.enabledNote}</>}
          </p>
        </div>
      </div>
      <ChangedBar live={{ changed: live.changed, reload: () => { dirty.current = false; return live.reload(); } }} label="schedules.json changed on disk." />
      {view && view.problems.length > 0 && (
        <p class="s-notice" role="status">
          {view.problems.join('; ')}
        </p>
      )}
      <form
        class="stack s-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!missing) void save();
        }}
      >
        <div class="row s-grid">
          <div class="field">
            <label for="s-id">{copy.detail.fields.id}</label>
            <input id="s-id" class="input" value={draft.id} readOnly={!isNew} onInput={(e) => edit({ id: (e.target as HTMLInputElement).value })} />
          </div>
          <div class="field s-grow">
            <label for="s-title">{copy.detail.fields.title}</label>
            <input id="s-title" class="input" value={draft.title} onInput={(e) => edit({ title: (e.target as HTMLInputElement).value })} />
          </div>
        </div>
        <div class="field">
          <label for="s-cron">{copy.detail.fields.cron}</label>
          <input id="s-cron" class="input s-mono" value={draft.cron} onInput={(e) => edit({ cron: (e.target as HTMLInputElement).value })} aria-describedby="s-cron-note" />
          <span id="s-cron-note" class="hint" role="status">
            {preview ? (preview.valid ? `${copy.detail.nextRuns}: ${(preview.next ?? []).map(fmtWhen).join(' · ')}` : `${copy.detail.invalid}: ${preview.error}`) : ''}
          </span>
        </div>
        <div class="row s-grid">
          <div class="field">
            <label for="s-runner">{copy.detail.fields.runner}</label>
            <select id="s-runner" class="select" value={draft.runner} onChange={(e) => edit({ runner: (e.target as HTMLSelectElement).value, permission: 'default' })}>
              {(runnerChoices.length ? runnerChoices : [{ id: 'claude', label: 'Claude', permissions: [] }, { id: 'codex', label: 'Codex', permissions: [] }]).map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>
          <div class="field">
            <label for="s-perm">{copy.detail.fields.permission}</label>
            <select id="s-perm" class="select" value={draft.permission} onChange={(e) => edit({ permission: (e.target as HTMLSelectElement).value })}>
              {(perms.length ? perms : [{ id: 'default', label: 'Ask before changes' }]).map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          <div class="field">
            <label for="s-timeout">{copy.detail.fields.timeout}</label>
            <input id="s-timeout" class="input" type="number" min={1} value={draft.timeout} placeholder="360" onInput={(e) => edit({ timeout: (e.target as HTMLInputElement).value })} />
          </div>
        </div>
        <div class="field">
          <label for="s-op">{copy.detail.fields.operation}</label>
          <select id="s-op" class="select" value={draft.operation} disabled={draft.chain.length > 0} onChange={(e) => edit({ operation: (e.target as HTMLSelectElement).value })}>
            <option value="">Choose</option>
            {opChoices.map((o) => (
              <option key={o.id} value={o.id}>{o.title} ({o.id})</option>
            ))}
          </select>
        </div>
        <fieldset class="s-chain">
          <legend>{copy.detail.fields.chain}</legend>
          <p class="hint">{copy.detail.fields.chainHint}</p>
          {draft.chain.map((op, i) => (
            <div class="row" key={`${i}-${op}`}>
              <span class="muted s-step">{i + 1}</span>
              <select class="select s-grow" aria-label={`Step ${i + 1}`} value={op} onChange={(e) => edit({ chain: draft.chain.map((x, j) => (j === i ? (e.target as HTMLSelectElement).value : x)) })}>
                {opChoices.map((o) => (
                  <option key={o.id} value={o.id}>{o.title} ({o.id})</option>
                ))}
              </select>
              <IconButton label={`${copy.detail.fields.up} ${i + 1}`} glyph="left" help="Moves this step one place earlier in the chain. The steps run in the order listed, one after another. Not saved until you press Save." disabled={i === 0} onClick={() => { const c = [...draft.chain]; [c[i - 1], c[i]] = [c[i] as string, c[i - 1] as string]; edit({ chain: c }); }} />
              <IconButton label={`${copy.detail.fields.down} ${i + 1}`} glyph="right" help="Moves this step one place later in the chain. The steps run in the order listed, one after another. Not saved until you press Save." disabled={i === draft.chain.length - 1} onClick={() => { const c = [...draft.chain]; [c[i + 1], c[i]] = [c[i] as string, c[i + 1] as string]; edit({ chain: c }); }} />
              <IconButton label={`${copy.detail.fields.remove} ${i + 1}`} glyph="close" help="Takes this step out of the chain. Not saved until you press Save." onClick={() => edit({ chain: draft.chain.filter((_, j) => j !== i) })} />
            </div>
          ))}
          <div class="row">
            <Button small help="Adds another job to the end of the chain; choose which job in the list that appears. Not saved until you press Save." onClick={() => edit({ chain: [...draft.chain, draft.chain.length ? (opChoices[0]?.id ?? '') : draft.operation || (opChoices[0]?.id ?? '')] })}>
              {copy.detail.fields.addStep}
            </Button>
          </div>
        </fieldset>
        <div class="field">
          <label for="s-params">{copy.detail.fields.params}</label>
          <textarea id="s-params" class="input s-textarea s-mono" rows={3} value={draft.params} onInput={(e) => edit({ params: (e.target as HTMLTextAreaElement).value })} />
        </div>
        <div class="row">
          <Button type="submit" variant="primary" disabled={missing} help="Saves this schedule's settings. It does not turn the schedule on; switching it on is a separate choice on the Schedules list.">{copy.detail.save}</Button>
          {message && <span class="muted" role="status">{message}</span>}
        </div>
        {problem && <p role="alert" style="color:var(--error)">{problem}</p>}
      </form>
      {!isNew && (
        <>
          <h2>{copy.detail.history}</h2>
          <Table columns={runCols} rows={(data as DetailResponse).runs} rowKey={(r) => r.runId} empty={copy.detail.noRuns} />
          {(data as DetailResponse).skips.length > 0 && (
            <ul class="s-skips">
              {(data as DetailResponse).skips.map((s, i) => (
                <li key={i}><span class="muted">{copy.detail.skipped} {fmtWhen(s.at)} ({s.trigger}):</span> {s.reason}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
