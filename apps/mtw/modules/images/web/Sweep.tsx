// New (migration spec section 6): the registration sweep. Lists exactly what is out of step, previews the files a
// registration would touch, and launches the images-register procedure in a visible terminal. It never writes itself.
import { useEffect, useMemo, useState } from 'preact/hooks';
import { Button } from '../../../web/ui/Button';
import { Dialog } from '../../../web/ui/Dialog';
import { EmptyState, Panel } from '../../../web/ui/Layout';
import { Table } from '../../../web/ui/Table';
import type { Column } from '../../../web/ui/Table';
import { bytesLabel } from '../shared/filter';
import { StaleBanner } from './common';
import { useHost } from './host';
import type { PlanPreview, SweepReport } from './host';
import { Viewer } from './Viewer';

type Unregistered = SweepReport['unregistered'][number];

function PlanDialog({ paths, onClose }: { paths: string[]; onClose: () => void }) {
  const host = useHost();
  const [plan, setPlan] = useState<PlanPreview | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [args, setArgs] = useState<[string, string, { model?: string; effort?: string }] | null>(null);
  useEffect(() => {
    let live = true;
    void host.data.planRegister?.(paths).then(
      (p) => live && setPlan(p),
      (e: Error) => live && setError(e.message),
    );
    return () => {
      live = false;
    };
  }, [paths.join('\n')]);

  const launch = async (): Promise<void> => {
    setBusy(true);
    try {
      if (!args) throw new Error('The agent choices are still loading; try again in a moment.');
      await host.launchOperation?.('images-register', { paths: paths.join('\n') }, args);
      onClose();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };
  const writable = plan?.items.filter((i) => i.action === 'new-record' || i.action === 'new-version').length ?? 0;
  return (
    <Dialog
      title={`Register ${paths.length} ${paths.length === 1 ? 'file' : 'files'}`}
      wide
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" help="Closes this window without registering anything." onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!plan?.ok || busy || !host.launchOperation || !args} help="Opens a terminal where an agent adds these files to the image library catalog so you can review them. It writes only through the library's own register tool." onClick={() => void launch()}>
            Launch in terminal
          </Button>
        </>
      }
    >
      {!plan && !error && <EmptyState>Planning.</EmptyState>}
      {error && <p role="alert" class="img-error">{error}</p>}
      {plan && (
        <div class="stack">
          {host.LaunchPicker && <host.LaunchPicker operation="images-register" onChoice={setArgs} />}
          <p class="muted">
            {writable} to write, {plan.items.filter((i) => i.action === 'noop').length} already registered, {plan.items.filter((i) => i.action === 'refuse').length} refused. The agent runs <code>mtw register image</code>; the producer is the only writer.
          </p>
          {plan.blockedBy.length > 0 && (
            <p role="alert" class="img-error">
              {plan.blockedBy.length} other unregistered {plan.blockedBy.length === 1 ? 'file blocks' : 'files block'} the producer. Include {plan.blockedBy.length === 1 ? 'it' : 'them'} in this batch.
            </p>
          )}
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th scope="col"><span>File</span></th>
                  <th scope="col"><span>Result</span></th>
                  <th scope="col"><span>Record</span></th>
                  <th scope="col"><span>Style</span></th>
                  <th scope="col"><span>Note</span></th>
                </tr>
              </thead>
              <tbody>
                {plan.items.map((i) => (
                  <tr key={i.path}>
                    <td title={i.path}>{i.path}</td>
                    <td>{i.action === 'new-record' ? 'New record' : i.action === 'new-version' ? 'New version' : i.action === 'noop' ? 'Already registered' : 'Refused'}</td>
                    <td>{i.recordId ?? ''}</td>
                    <td>{i.style ?? ''}</td>
                    <td title={i.reason ?? i.inferred ?? ''}>{i.reason ?? i.inferred ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {plan.errors.length > 0 && (
            <ul class="img-errors">
              {plan.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Dialog>
  );
}

export function Sweep() {
  const host = useHost();
  const [report, setReport] = useState<SweepReport | null>(null);
  const [error, setError] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [planning, setPlanning] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const [check, setCheck] = useState<'none' | 'files' | 'hash'>('none');
  const [reload, setReload] = useState(0);
  const [seen, setSeen] = useState(host.changeToken);
  const [busy, setBusy] = useState(true);
  const stale = host.changeToken !== seen;

  useEffect(() => {
    let live = true;
    setBusy(true);
    setError('');
    void host.data.sweep?.({ files: check !== 'none', hash: check === 'hash' }).then(
      (r) => {
        if (!live) return;
        setReport(r);
        // One stray file blocks every registration, so everything starts selected.
        setPicked(new Set(r.unregistered.map((u) => u.path)));
        setBusy(false);
      },
      (e: Error) => {
        if (!live) return;
        setError(e.message);
        setBusy(false);
      },
    );
    return () => {
      live = false;
    };
  }, [reload, check, host.data]);

  const toggle = (p: string): void => {
    const next = new Set(picked);
    if (next.has(p)) next.delete(p);
    else next.add(p);
    setPicked(next);
  };
  const selected = useMemo(() => (report?.unregistered ?? []).filter((u) => picked.has(u.path)).map((u) => u.path), [report, picked]);

  const columns: Column<Unregistered>[] = [
    { key: 'pick', header: '', render: (u) => <input type="checkbox" aria-label={`Select ${u.path}`} checked={picked.has(u.path)} onChange={() => toggle(u.path)} /> },
    { key: 'path', header: 'File', render: (u) => <button type="button" class="img-link" title="Shows this file full size in a window. Nothing is changed." onClick={() => setViewing(u.path)}>{u.path}</button>, sort: (a, b) => a.path.localeCompare(b.path) },
    { key: 'collection', header: 'Collection', render: (u) => u.inferred ?? <span class="muted">needs --collection</span> },
    { key: 'size', header: 'Size', render: (u) => bytesLabel(u.bytes), sort: (a, b) => a.bytes - b.bytes },
    { key: 'mtime', header: 'Modified', render: (u) => new Date(u.mtime).toLocaleString(), sort: (a, b) => a.mtime.localeCompare(b.mtime) },
  ];

  const clean = report && !report.unregistered.length && !report.unlisted.length && !report.problems.length && !report.derived.stale.length;
  return (
    <div class="stack">
      <div class="row">
        <Button help="Looks through the image folders again for files that are not in the catalog yet. It only reads; nothing is changed." onClick={() => setReload((n) => n + 1)} disabled={busy}>
          {busy ? 'Scanning' : 'Rescan'}
        </Button>
        <select class="select" aria-label="Registered files" value={check} onChange={(e) => setCheck((e.target as HTMLSelectElement).value as typeof check)}>
          <option value="none">Skip registered files</option>
          <option value="files">Check registered file sizes</option>
          <option value="hash">Check sizes and hashes (slow)</option>
        </select>
        <span class="toolbar-spacer" />
        <Button variant="primary" disabled={!selected.length || !host.launchOperation} help="Opens a window showing what registering the ticked files would do. Nothing is registered until you confirm there." onClick={() => setPlanning(true)}>
          Register {selected.length ? selected.length : ''}
        </Button>
      </div>
      {stale && <StaleBanner onReload={() => { setSeen(host.changeToken); setReload((n) => n + 1); }} />}
      {error && <p role="alert" class="img-error">{error}</p>}
      {report && (
        <>
          <p class="muted img-count" role="status">
            {report.unregistered.length} unregistered · {report.unlisted.length} unlisted · {report.checkedFiles ? `${report.problems.length} file problems` : 'registered files not checked'} · {report.registeredImages.toLocaleString('en-US')} registered images
          </p>
          {clean && <EmptyState>Nothing out of step.</EmptyState>}
          {report.unregistered.length > 0 && (
            <section class="img-section" aria-label="Unregistered files">
              <h2>Unregistered</h2>
              <Table columns={columns} rows={report.unregistered} rowKey={(u) => u.path} defaultSort={{ key: 'mtime', dir: 'desc' }} />
            </section>
          )}
          {report.problems.length > 0 && (
            <Panel title="Registered files that changed">
              <ul class="img-errors">
                {report.problems.slice(0, 50).map((p) => (
                  <li key={p.path}>
                    {p.kind === 'missing' ? 'Missing' : p.kind === 'size' ? 'Size changed' : 'Hash changed'}: <code>{p.path}</code>
                  </li>
                ))}
                {report.problems.length > 50 && <li>and {report.problems.length - 50} more</li>}
              </ul>
            </Panel>
          )}
          {report.unlisted.length > 0 && (
            <Panel title="Files the manifest does not list">
              <ul class="img-errors">
                {report.unlisted.slice(0, 30).map((u) => (
                  <li key={u.path}><code>{u.path}</code></li>
                ))}
                {report.unlisted.length > 30 && <li>and {report.unlisted.length - 30} more</li>}
              </ul>
            </Panel>
          )}
          {(report.integration.orphanComicStems.length > 0 || report.integration.diagramPackageStale) && (
            <Panel title="Website copies">
              {report.integration.diagramPackageStale && <p>Diagram build inputs were generated from an older manifest.</p>}
              {report.integration.orphanComicStems.length > 0 && (
                <ul class="img-errors">
                  {report.integration.orphanComicStems.slice(0, 30).map((s) => (
                    <li key={`${s.story}/${s.stem}`}>
                      <code>{s.story}/{s.stem}</code> has no canonical page
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}
          {report.derived.stale.length > 0 && (
            <Panel title="Derived files">
              <p>Older than the manifest: {report.derived.stale.join(', ')}. Run the refresh procedure.</p>
            </Panel>
          )}
        </>
      )}
      {planning && <PlanDialog paths={selected} onClose={() => setPlanning(false)} />}
      {viewing && <Viewer title={viewing.split('/').pop() ?? viewing} path={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
