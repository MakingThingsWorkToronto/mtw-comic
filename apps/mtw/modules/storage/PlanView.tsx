import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { api } from '../../web/api';
import { Link } from '../../web/shell/Link';
import { buildUrl } from '../../web/shell/route';
import { useLiveResource } from '../../web/state';
import { Button, Dialog, EmptyState, LaunchPicker, launchBody } from '../../web/ui';
import type { LaunchArgs } from '../../web/ui';
import type { PlanDetail, PlanFile } from './types';
import { StatusBadge } from './ui/StatusBadge';
import { formatBytes, formatWhen } from './ui/format';

const PAGE = 300;
type Confirm = null | 'approve' | 'execute' | 'cancel' | 'restore';

export function PlanView({ id }: { id: string }) {
  const live = useLiveResource<PlanDetail>(`/api/storage/plans/${encodeURIComponent(id)}`, { module: 'storage' });
  const [detail, setDetail] = useState<PlanDetail | null>(null);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [args, setArgs] = useState<LaunchArgs | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const timer = useRef<number | undefined>(undefined);
  const pending = useRef(false);

  useEffect(() => {
    if (!live.data) return;
    setDetail(live.data);
    if (pending.current) return;
    setExcluded(new Set(live.data.plan.files.filter((f) => f.excluded).map((f) => f.path)));
  }, [live.data]);

  const plan = detail?.plan;
  const editable = plan?.status === 'draft';

  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const all = plan?.files ?? [];
    return q ? all.filter((f) => f.path.toLowerCase().includes(q) || f.reason.toLowerCase().includes(q)) : all;
  }, [plan, filter]);

  const totals = useMemo(() => {
    const files = plan?.files ?? [];
    const inc = files.filter((f) => !excluded.has(f.path));
    return { files: inc.length, bytes: inc.reduce((s, f) => s + f.bytes, 0), allBytes: files.reduce((s, f) => s + f.bytes, 0) };
  }, [plan, excluded]);

  const save = (next: Set<string>) => {
    setExcluded(next);
    pending.current = true;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      api.post<PlanDetail>(`/api/storage/plans/${encodeURIComponent(id)}/exclusions`, { excluded: [...next] }).then(
        (d) => {
          pending.current = false;
          setDetail(d);
        },
        (e: Error) => {
          pending.current = false;
          setError(e.message);
        },
      );
    }, 250);
  };

  const toggle = (path: string) => {
    const next = new Set(excluded);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    save(next);
  };
  const setMany = (paths: string[], exclude: boolean) => {
    const next = new Set(excluded);
    for (const p of paths) exclude ? next.add(p) : next.delete(p);
    save(next);
  };

  const act = async (what: Exclude<Confirm, null>) => {
    setBusy(true);
    setError('');
    try {
      // Flush any pending exclusion change before the plan is frozen.
      if (what === 'approve') {
        window.clearTimeout(timer.current);
        await api.post(`/api/storage/plans/${encodeURIComponent(id)}/exclusions`, { excluded: [...excluded] });
        pending.current = false;
      }
      setDetail(await api.post<PlanDetail>(`/api/storage/plans/${encodeURIComponent(id)}/${what}`, what === 'execute' || what === 'restore' ? launchBody(args) : undefined));
      setConfirm(null);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  if (!plan || !detail) {
    return (
      <div class="page">
        {live.error ? <p role="alert" style="color:var(--error)">{live.error}</p> : <EmptyState>Loading…</EmptyState>}
        <Link href={buildUrl('storage', ['plans'])}>Back to plans</Link>
      </div>
    );
  }

  const archiveDir = `${detail.archiveRoot.replace(/\/+$/, '')}/${plan.id}/`;
  const done = plan.files.filter((f) => f.result);
  const term = detail.terminal;

  return (
    <div class="page">
      <div class="page-head">
        <div class="title-block">
          <h1>{plan.title}</h1>
          <p class="sub">
            <Link href={buildUrl('storage', ['plans'])}>Plans</Link> · {plan.vertical} · created {formatWhen(plan.createdAt)}
            {plan.approval && <> · approved {formatWhen(plan.approval.at)}</>}
          </p>
        </div>
        <div class="row">
          <StatusBadge status={plan.status} />
          {plan.status === 'draft' && (
            <Button variant="primary" disabled={busy || totals.files === 0} help="Opens a window asking you to confirm this exact file list. Confirming records your approval and freezes the list; nothing is moved yet." onClick={() => setConfirm('approve')}>
              Approve plan
            </Button>
          )}
          {(plan.status === 'approved' || plan.status === 'partial' || (plan.status === 'executing' && term?.status === 'exited')) && (
            <Button variant="danger" disabled={busy || detail.approvalStale} help="Opens a window to confirm. Confirming opens a terminal that moves the approved files into the archive folder, checking each copy before removing the original. The files can be restored from the archive." onClick={() => setConfirm('execute')}>
              {plan.status === 'approved' ? 'Execute' : 'Execute again'}
            </Button>
          )}
          {(plan.status === 'executed' || plan.status === 'partial') && (
            <Button disabled={busy} help="Opens a window to confirm. Confirming opens a terminal that copies the archived files back to where they were and checks each one." onClick={() => setConfirm('restore')}>Restore from archive</Button>
          )}
          {(plan.status === 'draft' || plan.status === 'approved') && (
            <Button variant="ghost" disabled={busy} help="Opens a window to confirm dropping this plan. The plan stays on record but can no longer be approved or run. No files are touched." onClick={() => setConfirm('cancel')}>Cancel plan</Button>
          )}
        </div>
      </div>

      {(error || live.error) && <p role="alert" style="color:var(--error)">{error || live.error}</p>}
      {detail.approvalStale && <p class="st-warn" role="alert">This plan changed after it was approved. Approve it again before it can run.</p>}
      {plan.status === 'executing' && term && (
        <p class="st-note">
          {term.status === 'running' ? 'The execute terminal is running. ' : `The execute terminal exited (code ${term.exitCode ?? '?'}) but the plan was not marked done. `}
          <Link href={buildUrl('operations', ['terminals', term.id])}>Open terminal</Link>
        </p>
      )}
      {plan.status !== 'executing' && plan.execution && (
        <p class="st-note">
          Last run <Link href={buildUrl('operations', ['terminals', plan.execution.terminalId])}>terminal</Link>
          {plan.execution.summary ? `: ${plan.execution.summary}` : ''}
        </p>
      )}
      {plan.restore && (
        <p class="st-note">
          Restore started {formatWhen(plan.restore.startedAt)} · <Link href={buildUrl('operations', ['terminals', plan.restore.terminalId])}>terminal</Link>
          {plan.restore.summary ? `: ${plan.restore.summary}` : ''}
        </p>
      )}

      <div class="st-stats" aria-live="polite">
        <span>
          Included <strong>{totals.files.toLocaleString()}</strong> of {plan.files.length.toLocaleString()} files
        </span>
        <span>
          Savings <strong>{formatBytes(totals.bytes)}</strong> of {formatBytes(totals.allBytes)}
        </span>
        <span>
          Archive <strong class="st-path">{archiveDir}</strong>
        </span>
        {done.length > 0 && <span>Recorded results <strong>{done.length.toLocaleString()}</strong></span>}
      </div>

      <div class="row">
        <div class="field">
          <label for="plan-filter">Filter files</label>
          <input id="plan-filter" class="input" value={filter} placeholder="path or reason" onInput={(e) => { setFilter((e.target as HTMLInputElement).value); setLimit(PAGE); }} />
        </div>
        {editable && (
          <>
            <Button small help="Puts every file currently listed (after your filter) back into the plan. Nothing is moved; the plan is only changed when you approve it." onClick={() => setMany(shown.map((f) => f.path), false)}>Include shown</Button>
            <Button small help="Takes every file currently listed (after your filter) out of the plan, so it will be left alone. Nothing is moved." onClick={() => setMany(shown.map((f) => f.path), true)}>Exclude shown</Button>
          </>
        )}
        <span class="muted">Showing {Math.min(limit, shown.length).toLocaleString()} of {shown.length.toLocaleString()}</span>
      </div>

      <div class="table-wrap">
        <table class="table st-table">
          <thead>
            <tr>
              <th scope="col"><span>Keep in plan</span></th>
              <th scope="col"><span>File</span></th>
              <th scope="col" class="st-num"><span>Size</span></th>
              <th scope="col"><span>Action</span></th>
              <th scope="col"><span>Reason</span></th>
              <th scope="col"><span>Result</span></th>
            </tr>
          </thead>
          <tbody>
            {shown.slice(0, limit).map((f) => (
              <FileRow key={f.path} f={f} off={excluded.has(f.path)} editable={Boolean(editable)} onToggle={() => toggle(f.path)} />
            ))}
          </tbody>
        </table>
      </div>
      {shown.length > limit && (
        <div class="row">
          <Button help="Lists more files from the plan on this page. Nothing is changed." onClick={() => setLimit(limit + PAGE)}>Show {Math.min(PAGE, shown.length - limit)} more</Button>
          <Button variant="ghost" help="Lists every file in the plan on this page. Nothing is changed." onClick={() => setLimit(shown.length)}>Show all</Button>
        </div>
      )}

      {plan.skipped.length > 0 && (
        <details class="st-details">
          <summary>Left out by the provider ({plan.skipped.length})</summary>
          <div class="table-wrap">
            <table class="table st-table">
              <tbody>
                {plan.skipped.map((s) => (
                  <tr key={s.path}>
                    <td class="st-path" title={s.path}>{s.path}</td>
                    <td class="st-reason">{s.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {confirm && (
        <Dialog
          title={
            { approve: 'Approve plan', execute: 'Execute plan', cancel: 'Cancel plan', restore: 'Restore from archive' }[confirm]
          }
          onClose={() => setConfirm(null)}
          footer={
            <>
              <Button variant="ghost" help="Closes this window without doing anything." onClick={() => setConfirm(null)}>Back</Button>
              <Button
                variant={confirm === 'execute' ? 'danger' : 'primary'}
                disabled={busy || ((confirm === 'execute' || confirm === 'restore') && !args)}
                help={{ approve: 'Records your approval of exactly this list of files and freezes it. Nothing is moved yet; running the plan is a separate step.', execute: 'Opens a terminal that moves the approved files into the archive folder, checking each copy before removing the original. The files can be restored later.', cancel: 'Drops this plan. It stays on record but can no longer be approved or run. No files are touched.', restore: 'Opens a terminal that copies the archived files back to where they were and checks each one.' }[confirm]}
                onClick={() => void act(confirm)}
              >
                {{ approve: 'Approve', execute: 'Open terminal and execute', cancel: 'Cancel plan', restore: 'Open terminal and restore' }[confirm]}
              </Button>
            </>
          }
        >
          {(confirm === 'execute' || confirm === 'restore') && (
            <LaunchPicker key={confirm} operation={confirm === 'restore' ? 'storage-restore' : plan.providerId === 'oversized-originals' ? 'storage-transcode-plan' : 'storage-execute-plan'} onChoice={setArgs} idPrefix="plan" />
          )}
          {confirm === 'approve' && (
            <p>
              Approve exactly these <strong>{totals.files.toLocaleString()}</strong> files ({formatBytes(totals.bytes)}). The approval is recorded and the list is frozen; a later change needs a new approval.
            </p>
          )}
          {confirm === 'execute' && (
            <p>
              A visible terminal will move <strong>{detail.includedFiles.toLocaleString()}</strong> files ({formatBytes(detail.includedBytes)}) to <span class="st-path">{archiveDir}</span>. Each file is copied, its sha256 verified, and only then removed from the repo. Manifests are refreshed through their producers.
            </p>
          )}
          {confirm === 'cancel' && <p>The plan is kept for the record but can no longer be approved or run.</p>}
          {confirm === 'restore' && <p>A visible terminal will copy the archived files back to their original paths, verify each sha256 and refresh the manifests.</p>}
        </Dialog>
      )}
    </div>
  );
}

function FileRow({ f, off, editable, onToggle }: { f: PlanFile; off: boolean; editable: boolean; onToggle: () => void }) {
  return (
    <tr class={off ? 'st-excluded' : undefined}>
      <td>
        <input type="checkbox" class="st-check" checked={!off} disabled={!editable} onChange={onToggle} aria-label={`Keep ${f.path} in plan`} />
      </td>
      <td class="st-path" title={`${f.path}\nsha256 ${f.sha256 || 'not yet hashed'}`}>{f.path}</td>
      <td class="st-num">{formatBytes(f.bytes)}</td>
      <td>{f.action}{f.regenerable ? ' (regenerable)' : ''}</td>
      <td class="st-reason">{f.reason}</td>
      <td class="st-reason">{f.result ? `${f.result.status}${f.result.note ? `: ${f.result.note}` : ''}` : ''}</td>
    </tr>
  );
}
