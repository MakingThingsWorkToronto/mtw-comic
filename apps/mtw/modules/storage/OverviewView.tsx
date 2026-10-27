import { Fragment } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { api } from '../../web/api';
import { buildUrl } from '../../web/shell/route';
import { navigate } from '../../web/shell/router';
import { useLiveResource } from '../../web/state';
import { Button, ConfirmLaunch, EmptyState, TabActions, Table, launchBody } from '../../web/ui';
import type { Column, LaunchArgs } from '../../web/ui';
import type { Category, HashProgress, ProviderInfo, ReductionRow, RootFootprint, ScanResult, Vertical } from './types';
import { Bar } from './ui/Bar';
import { formatBytes, formatWhen } from './ui/format';

interface ScanResponse {
  scan: ScanResult | null;
  scanning: boolean;
}

const VERTICALS: { id: Vertical; label: string }[] = [
  { id: 'images', label: 'Images' },
  { id: 'audio', label: 'Audio' },
  { id: 'comics', label: 'Comics' },
  { id: 'journal', label: 'Journal' },
  { id: 'site', label: 'Site' },
];
const CATEGORY_LABEL: Record<Category, string> = {
  duplicates: 'Duplicates',
  orphans: 'Not in a catalogue',
  older: 'Older versions',
  rebuild: 'Can be rebuilt',
  oversized: 'Larger than needed',
  screens: 'Old screenshots',
};
const CATEGORY_ORDER: Category[] = ['duplicates', 'orphans', 'older', 'oversized', 'screens', 'rebuild'];

function Roots({ scan, onOpen }: { scan: ScanResult; onOpen: (r: RootFootprint) => void }) {
  const max = Math.max(1, ...scan.roots.map((r) => r.bytes));
  return (
    <div class="st-roots" role="list" aria-label="Library sizes">
      {scan.roots.map((r) => (
        <Fragment key={r.id}>
          <div role="listitem">
            <button type="button" class="st-name" onClick={() => onOpen(r)} aria-label={`Browse ${r.label}`} title="Opens a size breakdown of this folder below, so you can see which sub-folders take the most space. Nothing is changed.">
              {r.label}
            </button>
            <div class="st-sub">{r.path}</div>
          </div>
          <Bar value={r.bytes} max={max} label={`${r.label} ${formatBytes(r.bytes)}`} />
          <div class="st-val">
            {formatBytes(r.bytes)} <span class="muted">· {r.files.toLocaleString()} files</span>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

function Browser({ scan, start, onClose }: { scan: ScanResult; start: RootFootprint; onClose: () => void }) {
  const [at, setAt] = useState(start.path);
  const total = scan.nodes[at]?.bytes ?? scan.roots.find((r) => r.path === at)?.bytes ?? 0;
  const children = useMemo(
    () =>
      Object.entries(scan.nodes)
        .filter(([p]) => p.startsWith(`${at}/`) && !p.slice(at.length + 1).includes('/'))
        .map(([p, n]) => ({ path: p, ...n }))
        .sort((a, b) => b.bytes - a.bytes),
    [scan, at],
  );
  const parent = at === start.path ? null : at.slice(0, at.lastIndexOf('/'));
  const rest = total - children.reduce((s, c) => s + c.bytes, 0);
  return (
    <section class="stack" aria-label={`Browse ${start.label}`}>
      <div class="row">
        <strong class="st-path">{at}</strong>
        <span class="muted">{formatBytes(total)}</span>
        <span class="grow" style="flex:1" />
        {parent && <Button small help="Goes up one folder level in this size breakdown. Nothing is changed." onClick={() => setAt(parent)}>Up</Button>}
        <Button small variant="ghost" help="Hides this size breakdown. Nothing is changed." onClick={onClose}>Close</Button>
      </div>
      <div class="table-wrap">
        <table class="table st-table">
          <thead>
            <tr>
              <th scope="col"><span>Folder</span></th>
              <th scope="col"><span>Share</span></th>
              <th scope="col" class="st-num"><span>Size</span></th>
            </tr>
          </thead>
          <tbody>
            {children.map((c) => (
              <tr key={c.path}>
                <td class="st-path">
                  <button type="button" class="btn btn--ghost btn--small" onClick={() => setAt(c.path)} aria-label={`Open ${c.path}`} title="Shows what is inside this folder and how big each part is. Nothing is changed.">
                    {c.path.slice(at.length + 1)}
                  </button>
                </td>
                <td><Bar value={c.bytes} max={total} label={`${Math.round((c.bytes / Math.max(1, total)) * 100)} percent`} /></td>
                <td class="st-num">{formatBytes(c.bytes)}</td>
              </tr>
            ))}
            {rest > 0 && (
              <tr>
                <td class="muted">Files here and small folders</td>
                <td><Bar value={rest} max={total} label="remainder" /></td>
                <td class="st-num">{formatBytes(rest)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const rowKey = (r: ReductionRow): string => `${r.providerId}/${r.target}`;

function Code({ scan }: { scan: ScanResult }) {
  const c = scan.code;
  return (
    <section class="stack" aria-label="Code">
      <h2>Code</h2>
      <p class="muted">For information only: apps/ and site/scripts.</p>
      <div class="st-stats">
        <span>Source files <strong>{c.files.toLocaleString()}</strong> <span class="muted">· {formatBytes(c.bytes)}</span></span>
        <span>Over 800 lines <strong>{c.large.length}</strong></span>
        <span>Same name in apps and site/scripts <strong>{c.duplicateNames.length}</strong></span>
      </div>
      {c.large.length > 0 && (
        <details class="st-details">
          <summary>Largest source files</summary>
          <Table
            columns={[
              { key: 'p', header: 'File', render: (f: { path: string; lines: number }) => <span class="st-path" title={f.path}>{f.path}</span> },
              { key: 'l', header: 'Lines', render: (f: { path: string; lines: number }) => <span class="st-num">{f.lines.toLocaleString()}</span>, sort: (a, b) => a.lines - b.lines },
            ]}
            rows={c.large}
            rowKey={(f) => f.path}
            defaultSort={{ key: 'l', dir: 'desc' }}
          />
        </details>
      )}
      {c.duplicateNames.length > 0 && (
        <details class="st-details">
          <summary>Same file name in two places</summary>
          <Table
            columns={[
              { key: 'n', header: 'Name', render: (d: { name: string; paths: string[] }) => <span class="st-path">{d.name}</span> },
              { key: 'p', header: 'Where', render: (d: { name: string; paths: string[] }) => <span class="st-path st-reason">{d.paths.join('  ')}</span> },
            ]}
            rows={c.duplicateNames}
            rowKey={(d) => d.name}
          />
        </details>
      )}
    </section>
  );
}

export function OverviewView() {
  const live = useLiveResource<ScanResponse>('/api/storage/scan', { module: 'storage' });
  const providers = useLiveResource<ProviderInfo[]>('/api/storage/providers', { enabled: true });
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [rows, setRows] = useState<ReductionRow[] | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [browse, setBrowse] = useState<RootFootprint | null>(null);
  const [thresholds, setThresholds] = useState<Record<string, Record<string, number>>>({});
  const [hashing, setHashing] = useState<HashProgress | null>(null);

  useEffect(() => {
    if (live.data?.scan) setScan(live.data.scan);
  }, [live.data]);
  useEffect(() => {
    if (scan && !rows) setRows(scan.reductions);
  }, [scan, rows]);

  const recalc = async () => {
    setBusy('recalc');
    setError('');
    try {
      setRows(await api.post<ReductionRow[]>('/api/storage/reductions', { params: thresholds }));
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy('');
  };

  // Duplicate checks hash files lazily in the background. Watch the progress; when it ends, refresh the rows from the new hashes.
  const watching = useRef(false);
  const watchHashing = async () => {
    if (watching.current) return;
    watching.current = true;
    try {
      for (;;) {
        const p = await api.get<HashProgress>('/api/storage/hashing');
        setHashing(p);
        if (!p.running) break;
        await new Promise((r) => window.setTimeout(r, 1200));
      }
      setRows(await api.post<ReductionRow[]>('/api/storage/reductions', { params: thresholds }));
    } catch (e) {
      setError((e as Error).message);
    }
    watching.current = false;
    setHashing(null);
  };
  useEffect(() => {
    if (scan) void watchHashing();
  }, [scan?.generatedAt]);

  const refresh = async () => {
    setBusy('scan');
    setError('');
    try {
      const r = await api.post<ScanResponse>('/api/storage/scan');
      setScan(r.scan);
      setRows(r.scan?.reductions ?? null);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy('');
  };

  const createPlan = async (row: ReductionRow) => {
    setBusy(rowKey(row));
    setError('');
    try {
      const r = await api.post<{ id: string }>('/api/storage/plans', { providerId: row.providerId, target: row.target, params: thresholds[row.providerId] });
      navigate(buildUrl('storage', ['plans', r.id]));
    } catch (e) {
      setError((e as Error).message);
      setBusy('');
    }
  };

  // Registering hands the files to the owning module's procedure; the confirm dialog picks provider, model, effort and permission.
  const [registering, setRegistering] = useState<ReductionRow | null>(null);
  const register = (row: ReductionRow) => setRegistering(row);
  const runRegister = async (row: ReductionRow, args: LaunchArgs): Promise<{ id: string }> => {
    setBusy(`register:${rowKey(row)}`);
    setError('');
    try {
      const r = await api.post<{ terminalId: string }>('/api/storage/register', { providerId: row.providerId, target: row.target, ...launchBody(args) });
      return { id: r.terminalId };
    } finally {
      setBusy('');
    }
  };

  // A cache written before the vertical grouping has no vertical on its rows, so every vertical would read 'Nothing found'.
  const stale = !!scan && (!scan.code || scan.reductions.some((r) => !r.vertical));
  const tunable = (providers.data ?? []).filter((p) => p.params.length > 0);
  const all = rows ?? [];
  const max = Math.max(1, ...all.map((x) => x.bytes));
  const columns: Column<ReductionRow>[] = [
    {
      key: 'category',
      header: 'Problem',
      render: (r) => CATEGORY_LABEL[r.category] ?? r.category,
      sort: (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category),
    },
    {
      key: 'target',
      header: 'Where',
      render: (r) => (
        <span title={r.targetLabel}>
          <span class="st-path">{r.targetLabel}</span>
          {r.pending ? <span class="muted"> · {r.pending.toLocaleString()} still being checked</span> : null}
        </span>
      ),
      sort: (a, b) => a.targetLabel.localeCompare(b.targetLabel),
    },
    { key: 'files', header: 'Files', render: (r) => <span class="st-num">{r.files.toLocaleString()}</span>, sort: (a, b) => a.files - b.files },
    {
      key: 'bytes',
      header: 'Size',
      render: (r) => (
        <span class="row" style="flex-wrap:nowrap;gap:8px">
          <Bar value={r.bytes} max={max} label={formatBytes(r.bytes)} />
          <span class="st-num" style="min-width:64px">{formatBytes(r.bytes)}</span>
        </span>
      ),
      sort: (a, b) => a.bytes - b.bytes,
    },
    {
      key: 'act',
      header: '',
      align: 'actions',
      render: (r) => (
        <span class="row" style="flex-wrap:nowrap;gap:6px;justify-content:flex-end">
          {r.register && (
            <Button small disabled={busy !== ''} aria-label={`Register ${r.targetLabel}`} help="Opens a terminal where an agent adds the files on this row to their library catalog, so Studio can show them for review. No file is moved or deleted." onClick={() => void register(r)}>
              {busy === `register:${rowKey(r)}` ? 'Opening…' : 'Register'}
            </Button>
          )}
          {r.reportOnly ? (
            r.register ? null : <span class="muted" title="The live site needs these; report only">Report only</span>
          ) : (
            <Button small variant="primary" disabled={busy !== ''} aria-label={`Create plan for ${CATEGORY_LABEL[r.category]}: ${r.targetLabel}`} help={r.providerId === 'oversized-originals' ? 'Drafts a plan listing the large originals on this row that could be shrunk. Nothing is changed yet: you review the file list on the plan page and approve it before anything runs.' : 'Drafts a plan listing the exact files on this row that could be archived. Nothing is moved or deleted yet: you review the file list on the plan page and approve it before anything runs.'} onClick={() => void createPlan(r)}>
              {r.providerId === 'oversized-originals' ? 'Create transcode plan' : 'Create plan'}
            </Button>
          )}
        </span>
      ),
    },
  ];

  return (
    <div class="page">
      <h1 class="sr-only">Asset health</h1>
      <TabActions>
        {scan && <span class="muted">Scanned {formatWhen(scan.generatedAt)} · {(scan.durationMs / 1000).toFixed(1)}s</span>}
        <Button variant="primary" disabled={busy !== ''} help="Scans the libraries again to measure sizes and find duplicates, look-alikes and leftovers. It only reads files; nothing is changed." onClick={() => void refresh()}>
          {busy === 'scan' ? 'Scanning…' : scan ? 'Refresh scan' : 'Run first scan'}
        </Button>
      </TabActions>
      <p class="sub muted">What makes the libraries harder to maintain. Nothing moves until you approve an exact file list.</p>
      {(error || live.error) && <p role="alert" style="color:var(--error)">{error || live.error}</p>}

      {!scan ? (
        <EmptyState>{live.loading ? 'Loading.' : 'No scan yet. Run the first scan to see sizes.'}</EmptyState>
      ) : (
        <>
          {stale && (
            <p class="st-note muted" role="status">
              Scan is from {formatWhen(scan.generatedAt)}, older than this build; it lacks the current health fields.{' '}
              <Button small variant="secondary" disabled={busy !== ''} help="Scans the libraries again so this page has the current figures. It only reads files; nothing is changed." onClick={() => void refresh()}>
                {busy === 'scan' ? 'Scanning…' : 'Refresh'}
              </Button>
            </p>
          )}
          {hashing?.running && (
            <div class="st-note row" role="status" aria-live="polite">
              <span>Checking for duplicates: {hashing.done.toLocaleString()} of {hashing.total.toLocaleString()} files</span>
              <Bar value={hashing.done} max={Math.max(1, hashing.total)} label="Duplicate check progress" />
            </div>
          )}

          <section class="stack" aria-label="Sizes">
            <Roots scan={scan} onOpen={setBrowse} />
          </section>
          {browse && <Browser scan={scan} start={browse} onClose={() => setBrowse(null)} />}

          {tunable.length > 0 && (
            <form class="st-thresholds" onSubmit={(e) => { e.preventDefault(); void recalc(); }}>
              {tunable.flatMap((p) =>
                p.params.map((x) => (
                  <div class="field" key={`${p.id}-${x.name}`}>
                    <label for={`th-${p.id}-${x.name}`}>{CATEGORY_LABEL[p.category]}: {x.label}</label>
                    <input
                      id={`th-${p.id}-${x.name}`}
                      class="input"
                      type="number"
                      min={0}
                      value={thresholds[p.id]?.[x.name] ?? x.default}
                      onInput={(e) => setThresholds((t) => ({ ...t, [p.id]: { ...(t[p.id] ?? {}), [x.name]: Number((e.target as HTMLInputElement).value) } }))}
                    />
                  </div>
                )),
              )}
              <Button type="submit" disabled={busy !== ''} help="Recalculates the list below using the limits you typed. It only changes what this page suggests; no files are touched." >{busy === 'recalc' ? 'Working…' : 'Recalculate'}</Button>
            </form>
          )}

          {VERTICALS.map((v) => {
            const mine = all.filter((r) => r.vertical === v.id);
            const root = scan.roots.find((r) => r.id === v.id);
            return (
              <section class="stack" key={v.id} aria-label={v.label}>
                <h2>
                  {v.label}
                  {root && <span class="muted st-h2-note"> · {formatBytes(root.bytes)} · {root.files.toLocaleString()} files</span>}
                </h2>
                <Table columns={columns} rows={mine} rowKey={rowKey} defaultSort={{ key: 'bytes', dir: 'desc' }} empty="Nothing found." />
              </section>
            );
          })}

          <Code scan={scan} />

          <details class="st-details">
            <summary>Details</summary>
            <div class="stack">
              <p class="muted st-path">
                Archive root {scan.archiveRoot}
                {scan.git.available ? ` · git pack ${scan.git.human}` : ''}
              </p>
              <Table
                columns={[
                  { key: 'p', header: 'Largest files', render: (f: { path: string; bytes: number }) => <span class="st-path" title={f.path}>{f.path}</span> },
                  { key: 'b', header: 'Size', render: (f: { path: string; bytes: number }) => <span class="st-num">{formatBytes(f.bytes)}</span>, sort: (a, b) => a.bytes - b.bytes },
                ]}
                rows={scan.largest}
                rowKey={(f) => f.path}
                defaultSort={{ key: 'b', dir: 'desc' }}
              />
            </div>
          </details>
        </>
      )}
      {registering && (
        <ConfirmLaunch
          operation={registering.vertical === 'audio' ? 'soundtrack-intake' : 'images-register'}
          title="Register these files"
          body="Hands the unregistered files to the owning library's register procedure in a terminal. Nothing moves. Choose which agent, model and effort do it."
          onClose={() => setRegistering(null)}
          run={(args) => runRegister(registering, args)}
        />
      )}
    </div>
  );
}
