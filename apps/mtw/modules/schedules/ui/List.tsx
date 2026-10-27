import { useState } from 'preact/hooks';
import { api } from '../../../web/api';
import { Link } from '../../../web/shell/Link';
import { buildUrl } from '../../../web/shell/route';
import { navigate } from '../../../web/shell/router';
import { Badge, Button, Dialog, StepChoices, Table } from '../../../web/ui';
import type { BadgeStatus, Column, StepChoicesBody } from '../../../web/ui';
import { copy } from '../copy';
import { stepsOf } from '../shared';
import type { ScheduleView } from '../lib/scheduler';
import type { RunRecord } from '../lib/store';
import { fmtWhen, opsOf, sget, spost } from './util';
import type { ListResponse } from './util';

export function runBadge(r: RunRecord | null, running: boolean) {
  if (running || r?.status === 'running') return <Badge status="running">{copy.status.running}</Badge>;
  if (!r) return <span class="muted">{copy.none}</span>;
  const map: Record<string, BadgeStatus> = { ok: 'approved', failed: 'rejected', timeout: 'rejected', error: 'rejected', interrupted: 'pending' };
  return <Badge status={map[r.status] ?? 'pending'}>{copy.status[r.status as 'ok'] ?? r.status}</Badge>;
}

export function lastTerminal(r: RunRecord | null): string | null {
  if (!r) return null;
  const withTerminal = [...r.steps].reverse().find((s) => s.terminalId);
  return withTerminal?.terminalId ?? null;
}

export function ScheduleList({ data, reload }: { data: ListResponse; reload: () => void }) {
  const [enabling, setEnabling] = useState<ScheduleView | null>(null);
  const [running, setRunning] = useState<ScheduleView | null>(null);
  // What Matt confirmed for each step of "Run now" (null until every picker has loaded). Timed runs never use this.
  const [choices, setChoices] = useState<StepChoicesBody | null>(null);
  const [error, setError] = useState('');

  const disable = async (v: ScheduleView): Promise<void> => {
    setError('');
    try {
      await spost('/enable', { id: v.id, enabled: false });
      reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const columns: Column<ScheduleView>[] = [
    {
      key: 'title',
      header: copy.list.columns.title,
      sort: (a, b) => (a.schedule?.title ?? a.id).localeCompare(b.schedule?.title ?? b.id),
      render: (v) => (
        <div class="s-cell">
          <Link href={buildUrl('schedules', [v.id])}>{v.schedule?.title ?? v.id}</Link>
          {v.problems.length > 0 && <span class="s-problem" title={v.problems.join('; ')}>{copy.list.problem}</span>}
        </div>
      ),
    },
    { key: 'what', header: copy.list.columns.what, render: (v) => (v.schedule ? <span title={opsOf(v.schedule).join(' → ')}>{opsOf(v.schedule).join(' → ')}</span> : null) },
    { key: 'runner', header: copy.list.columns.runner, render: (v) => v.schedule?.runner ?? '' },
    { key: 'cron', header: copy.list.columns.cron, render: (v) => (v.schedule ? <code>{v.schedule.cron}</code> : null) },
    {
      key: 'enabled',
      header: copy.list.columns.enabled,
      render: (v) =>
        v.schedule ? (
          <label class="row s-toggle">
            <input
              type="checkbox"
              role="switch"
              checked={v.schedule.enabled}
              aria-label={`${v.schedule.enabled ? copy.list.disable : copy.list.enable} ${v.schedule.title}`}
              title={v.schedule.enabled ? 'Switches this schedule off so the clock stops starting it. Past runs are kept.' : 'Opens a window to confirm switching this schedule on, so the clock starts it at its set times. Nothing is switched on until you confirm.'}
              onChange={() => (v.schedule?.enabled ? void disable(v) : setEnabling(v))}
            />
            <span>{v.schedule.enabled ? copy.list.on : copy.list.off}</span>
          </label>
        ) : null,
    },
    { key: 'next', header: copy.list.columns.next, render: (v) => (v.next ? fmtWhen(v.next) : <span class="muted">{copy.none}</span>), sort: (a, b) => (a.next ?? '9').localeCompare(b.next ?? '9') },
    {
      key: 'last',
      header: copy.list.columns.last,
      render: (v) => {
        const t = lastTerminal(v.last);
        return (
          <span class="row">
            {runBadge(v.last, v.running)}
            {v.last && (
              <>
                <span class="muted">{fmtWhen(v.last.startedAt)}</span>
                {t && (
                  <Link href={buildUrl('operations', ['terminals', t])} aria-label={`${copy.list.openTerminal}: ${v.schedule?.title ?? v.id}`}>
                    {copy.list.terminal}
                  </Link>
                )}
              </>
            )}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'actions',
      render: (v) =>
        v.schedule ? (
          <Button small disabled={v.running || v.problems.length > 0} aria-label={`${copy.list.runNow} ${v.schedule.title}`} help="Opens a window to confirm starting this schedule right now instead of waiting for its next time. Nothing starts until you confirm there." onClick={() => { setChoices(null); setRunning(v); }}>
            {copy.list.runNow}
          </Button>
        ) : null,
    },
  ];

  const confirmEnable = async (): Promise<void> => {
    if (!enabling) return;
    setError('');
    try {
      await spost('/enable', { id: enabling.id, enabled: true });
      setEnabling(null);
      reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const confirmRun = async (): Promise<void> => {
    if (!running) return;
    setError('');
    try {
      if (!choices) throw new Error('The agent choices are still loading; try again in a moment.');
      const r = await spost<RunRecord>('/run', { id: running.id, choices });
      setRunning(null);
      reload();
      const t = lastTerminal(r) ?? (await sget<{ runs: RunRecord[] }>(`/schedule/${running.id}`)).runs[0]?.steps.find((s) => s.terminalId)?.terminalId;
      if (t) navigate(buildUrl('operations', ['terminals', t]));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <>
      {!data.owner.mine && <p class="s-notice" role="status">{data.owner.pid ? copy.list.passive.replace('{pid}', String(data.owner.pid)) : copy.list.noClock}</p>}
      {error && <p role="alert" style="color:var(--error)">{error}</p>}
      <Table columns={columns} rows={data.schedules} rowKey={(v) => v.id} empty={copy.list.empty} />
      {enabling && enabling.schedule && (
        <Dialog
          title={`${copy.list.enable}: ${enabling.schedule.title}`}
          onClose={() => setEnabling(null)}
          footer={
            <>
              <Button variant="ghost" help="Closes this window. The schedule stays off." onClick={() => setEnabling(null)}>{copy.cancel}</Button>
              <Button variant="primary" help="Switches this schedule on. From now on the clock starts it at its set times, and each run opens a visible terminal under Operations." onClick={() => void confirmEnable()}>{copy.list.enable}</Button>
            </>
          }
        >
          <p class="muted">{copy.list.enableBody}</p>
          <p>
            <code>{enabling.schedule.cron}</code> · {opsOf(enabling.schedule).join(' → ')} · {enabling.schedule.runner}
          </p>
        </Dialog>
      )}
      {running && running.schedule && (
        <Dialog
          title={`${copy.list.runNow}: ${running.schedule.title}`}
          onClose={() => setRunning(null)}
          footer={
            <>
              <Button variant="ghost" help="Closes this window. Nothing is started." onClick={() => setRunning(null)}>{copy.cancel}</Button>
              <Button variant="primary" disabled={!choices} help="Starts this schedule once, now, with the provider, model and effort chosen below, and opens the terminal where it runs so you can watch it. It does not change the schedule's normal times." onClick={() => void confirmRun()}>{copy.list.runNow}</Button>
            </>
          }
        >
          <p class="muted">{copy.list.runBody}</p>
          <p>{opsOf(running.schedule).join(' → ')} · {running.schedule.runner}</p>
          <p class="muted">{copy.list.runChoices}</p>
          <StepChoices
            key={running.id}
            steps={stepsOf(running.schedule).map((st, i) => ({ key: String(i), operation: st.operation, label: st.operation, runner: st.runner ?? running.schedule?.runner ?? 'claude', permission: running.schedule?.permission ?? 'default' }))}
            onChange={setChoices}
          />
        </Dialog>
      )}
    </>
  );
}

void api;
