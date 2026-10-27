// Migrated from the viewer dialog of retired git 51eb6e03:wiki/image-library/browser.js: openRecord (L229-244), comparison grid with
// All / Flat+outline / Holo+photo modes (L211-224, L294), figure captions (L180-210), lineage buttons (L235-244),
// tour link (L139-146). New: version chain, decisions overlay, integration source, copy ref.
import { useEffect, useMemo, useState } from 'preact/hooks';
import { Button } from '../../../web/ui/Button';
import { DeleteControl, useDelete } from '../../../web/ui/DeleteControl';
import { deleteSubject } from '../../../web/delete';
import { Dialog } from '../../../web/ui/Dialog';
import { EmptyState, Tabs } from '../../../web/ui/Layout';
import { Table } from '../../../web/ui/Table';
import type { Column } from '../../../web/ui/Table';
import { bytesLabel, orderStyles } from '../shared/filter';
import { formatImgRef } from '../shared/refs';
import { recordState } from '../shared/states';
import { PERMANENT_STYLES } from '../shared/types';
import type { DecisionEntry, RecordDetail, Treatment, VersionEntry } from '../shared/types';
import { Anchor, StateBadge, StaleBanner, Thumb, styleLabel, useCopy } from './common';
import { useHost } from './host';
import type { DecideInput, RemoveRequest } from './host';
import { RemoveDialog, canRemove } from './Remove';
import { Viewer } from './Viewer';

type Mode = 'all' | 'vectors' | 'rasters';

function stylesFor(detail: RecordDetail, mode: Mode): string[] {
  const keys = Object.keys(detail.record.treatments);
  if (detail.record.collection !== 'diagrams') return orderStyles(keys);
  const extras = keys.filter((s) => !(PERMANENT_STYLES as readonly string[]).includes(s));
  const perm = PERMANENT_STYLES.filter((s) => keys.includes(s));
  if (mode === 'vectors') return [...perm.slice(0, 2), ...extras.filter((s) => s.startsWith('svg-'))];
  if (mode === 'rasters') return [...perm.slice(2), ...extras.filter((s) => !s.startsWith('svg-'))];
  return [...perm, ...extras];
}

function DecisionDialog({ detail, intent, onClose, onDone }: { detail: RecordDetail; intent: { action: DecideInput['action']; style: string; version: string }; onClose: () => void; onDone: () => void }) {
  const host = useHost();
  const [scope, setScope] = useState<'public-site' | 'reference' | 'cover'>('reference');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const needsReason = intent.action === 'reject';
  const verb = { approve: 'Approve', reject: 'Reject', select: 'Select', unselect: 'Clear selection', note: 'Note' }[intent.action];
  const ref = formatImgRef(detail.record.id, intent.version, intent.style);

  const submit = async (): Promise<void> => {
    setBusy(true);
    setError('');
    try {
      await host.data.decide?.({
        id: detail.record.id,
        action: intent.action,
        version: intent.version,
        style: intent.style,
        ...(intent.action === 'approve' || intent.action === 'select' ? { scope } : {}),
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      });
      onDone();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <Dialog
      title={`${verb} image`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" help="Closes this window without recording anything." onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={intent.action === 'reject' ? 'danger' : 'primary'}
            disabled={busy || (needsReason && !reason.trim())}
            help={{ approve: 'Records that you approve this image for the use you picked. It only writes your decision in the image library\'s log; no file changes and nothing is published.', reject: 'Records that you reject this image, with your reason. The files stay on disk until you remove them.', select: 'Records this version as your pick for the use you chose. It only writes your decision in the image library\'s log; no file changes.', unselect: 'Records that this version is no longer your pick. No file changes.', note: 'Saves your note on this image in the library\'s log. No file changes.' }[intent.action]}
            onClick={() => void submit()}
          >
            {verb}
          </Button>
        </>
      }
    >
      <form class="stack" onSubmit={(e) => { e.preventDefault(); if (!busy && (!needsReason || reason.trim())) void submit(); }}>
        <code class="img-ref">{ref}</code>
        {(intent.action === 'approve' || intent.action === 'select') && (
          <div class="field">
            <label for="dec-scope">Scope</label>
            <select id="dec-scope" class="select" value={scope} onChange={(e) => setScope((e.target as HTMLSelectElement).value as typeof scope)}>
              <option value="reference">Reference</option>
              <option value="public-site">Public site</option>
              <option value="cover">Cover</option>
            </select>
          </div>
        )}
        <div class="field">
          <label for="dec-reason">{needsReason ? 'Reason' : 'Note (optional)'}</label>
          <textarea id="dec-reason" class="input img-textarea" rows={3} value={reason} onInput={(e) => setReason((e.target as HTMLTextAreaElement).value)} />
        </div>
        {error && <p role="alert" class="img-error">{error}</p>}
      </form>
    </Dialog>
  );
}

/** Delete is offered in the app only (not the static snapshot, not a picker). */
const canDelete = (host: ReturnType<typeof useHost>): boolean => host.mode === 'app' && !host.pick && Boolean(host.launchOperation);

/** The delete handle for one version of one style, keyed by content hash so a renumbered chain cannot be mistaken for it. */
function useVersionDelete(recordId: string, style: string, version: { token: string; sha8: string; path: string } | undefined, onSettle: () => void) {
  return useDelete({
    kind: 'image',
    subject: deleteSubject.image(recordId, version?.sha8 ?? 'none', style),
    target: formatImgRef(recordId, version?.token ?? 'current', style),
    paths: version ? [`wiki/image-library/${version.path}`] : [],
    onSettle,
  });
}

function Figure({ detail, style, onView, onDecide, onSettle, onRemove }: { detail: RecordDetail; style: string; onView: (path: string) => void; onDecide: (action: DecideInput['action'], style: string, version: string) => void; onSettle: () => void; onRemove: (req: RemoveRequest, label: string) => void }) {
  const host = useHost();
  const [copied, copy] = useCopy();
  const t: Treatment | undefined = detail.record.treatments[style];
  const currentVersion = (detail.versions[style] ?? []).find((v) => v.current);
  const sha8 = t?.sha256 ? t.sha256.slice(0, 8) : undefined;
  const del = useVersionDelete(detail.record.id, style, sha8 && t?.path ? { token: currentVersion && currentVersion.sha256 === t.sha256 ? currentVersion.token : sha8, sha8, path: t.path } : undefined, onSettle);
  const state = recordState(detail.record, t);
  const name = styleLabel(detail.styleNames, style);
  const canDecide = Boolean(host.data.decide) && Boolean(t?.path);
  const effective = detail.decision && (!detail.decision.style || detail.decision.style === style) ? detail.decision : undefined;
  return (
    <figure class={`img-figure ${del.zoneClass}`} ref={del.ref} {...del.zoneAttrs}>
      <div class="img-figure-head">
        <h3>{name}</h3>
        <StateBadge state={effective ? (effective.kind === 'approved' ? 'approved' : effective.kind === 'rejected' ? 'rejected' : 'selected') : state} raw={t?.status} />
      </div>
      {t?.path && t.sha256 ? (
        <button type="button" class="img-figure-image" aria-label={`Open original ${name}`} title="Shows the full-size original in a window. Nothing is changed." onClick={() => onView(t.path as string)}>
          <Thumb src={host.data.thumb({ sha: t.sha256, path: t.path }, 640)} alt={`${detail.record.title}, ${name}`} w={t.width} h={t.height} />
        </button>
      ) : (
        <div class="img-figure-image img-fail">No file</div>
      )}
      <figcaption>
        {t?.path && (
          <p class="muted img-meta">
            {t.width} × {t.height} · {t.format} · {bytesLabel(t.bytes)}
            {t.sourceName ? ` · ${t.sourceName}` : ''}
          </p>
        )}
        {t?.note && (
          <details>
            <summary>Note</summary>
            <p>{t.note}</p>
          </details>
        )}
        {t?.path && (
          <div class="img-figure-actions">
            <Button small variant="ghost" help="Copies this style's reference to your clipboard so you can paste it where an image is asked for. Nothing is changed." onClick={() => copy(formatImgRef(detail.record.id, 'current', style), 'Copied')}>
              {copied ? 'Copied' : 'Copy ref'}
            </Button>
            {canDecide && (
              <>
                <Button small variant="secondary" help="Opens a window where you approve this image and say where it may be used. It only records your decision in the image library's log; no file changes and nothing is published." onClick={() => onDecide('approve', style, 'current')}>Approve</Button>
                <Button small variant="secondary" help="Opens a window where you mark this version as your pick for a use (reference, public site or cover). It only records your choice; no file changes." onClick={() => onDecide('select', style, 'current')}>Select</Button>
                <Button small variant="danger" help="Opens a window where you give a reason for rejecting this image. The rejection is recorded; the files stay on disk until you remove them." onClick={() => onDecide('reject', style, 'current')}>Reject</Button>
              </>
            )}
            {canDelete(host) && t.sha256 && <DeleteControl del={del} />}
            {canRemove(host) && (
              <Button small variant="danger" onClick={() => onRemove({ paths: [t.path as string] }, `${name} file`)} aria-label={`Remove the ${name} file`} help="Opens a window to confirm. Confirming archives this file outside the repo, checks the copy, deletes it from the repo and drops it from the catalog. It can be restored from the archive record.">
                Remove
              </Button>
            )}
          </div>
        )}
        {detail.integration?.[style] && (
          <p class="muted img-meta" title="Website copy of this image">
            Site: <code>{detail.integration[style]}</code>
          </p>
        )}
      </figcaption>
    </figure>
  );
}

function VersionActions({ detail, style, v, onView, onDecide, onSettle }: { detail: RecordDetail; style: string; v: VersionEntry; onView: (path: string) => void; onDecide: (action: DecideInput['action'], style: string, version: string) => void; onSettle: () => void }) {
  const host = useHost();
  const [copied, copy] = useCopy();
  const del = useVersionDelete(v.recordId, style, v, onSettle);
  return (
    <span class={`img-row-actions ${del.zoneClass}`} ref={del.ref} {...del.zoneAttrs}>
      <Button small variant="ghost" help="Shows this version full size in a window. Nothing is changed." onClick={() => onView(v.path)}>View</Button>
      <Button small variant="ghost" help="Copies the reference to this exact version to your clipboard so you can paste it where an image is asked for. Nothing is changed." onClick={() => copy(formatImgRef(detail.record.id, v.current ? 'current' : v.token, style), v.sha8)}>{copied === v.sha8 ? 'Copied' : 'Copy ref'}</Button>
      {host.data.decide && <Button small variant="secondary" help="Opens a window where you mark this version as your pick for a use (reference, public site or cover). It only records your choice; no file changes." onClick={() => onDecide('select', style, v.token)}>Select</Button>}
      {canDelete(host) && <DeleteControl del={del} />}
    </span>
  );
}

function Versions({ detail, onView, onDecide, onSettle }: { detail: RecordDetail; onView: (path: string) => void; onDecide: (action: DecideInput['action'], style: string, version: string) => void; onSettle: () => void }) {
  const styles = Object.keys(detail.versions);
  const [style, setStyle] = useState(styles[0] ?? '');
  useEffect(() => {
    if (!styles.includes(style)) setStyle(styles[0] ?? '');
  }, [detail.record.id]);
  const chain = detail.versions[style] ?? [];
  if (!styles.length) return null;
  const columns: Column<VersionEntry>[] = [
    { key: 'v', header: 'Version', render: (v) => <span>{v.token}{v.current ? <span class="muted"> · current</span> : ''}</span> },
    { key: 'record', header: 'Record', render: (v) => (v.recordId === detail.record.id ? <span class="muted">this record</span> : <Anchor view="record" id={v.recordId}>{v.recordId}</Anchor>) },
    { key: 'kind', header: 'Kind', render: (v) => v.kind },
    { key: 'state', header: 'Status', render: (v) => <StateBadge state={v.state} raw={v.status} /> },
    { key: 'size', header: 'Size', render: (v) => (v.width ? `${v.width} × ${v.height} · ${bytesLabel(v.bytes)}` : bytesLabel(v.bytes)) },
    { key: 'hash', header: 'Hash', render: (v) => <code>{v.sha8}</code> },
    {
      key: 'actions',
      header: '',
      align: 'actions',
      render: (v) => <VersionActions key={v.sha256} detail={detail} style={style} v={v} onView={onView} onDecide={onDecide} onSettle={onSettle} />,
    },
  ];
  return (
    <section class="img-section" aria-label="Versions">
      <h2>Versions</h2>
      {styles.length > 1 && <Tabs label="Version style" value={style} onChange={setStyle} items={styles.map((s) => ({ id: s, label: styleLabel(detail.styleNames, s) }))} />}
      <Table columns={columns} rows={chain} rowKey={(v) => v.sha256} empty="No other versions." />
    </section>
  );
}

function Decisions({ entries }: { entries: DecisionEntry[] }) {
  if (!entries.length) return null;
  const columns: Column<DecisionEntry>[] = [
    { key: 'at', header: 'When', render: (d) => new Date(d.at).toLocaleString() },
    { key: 'action', header: 'Decision', render: (d) => d.action },
    { key: 'subject', header: 'Subject', render: (d) => <code>{d.subject}</code> },
    { key: 'scope', header: 'Scope', render: (d) => d.value?.scope ?? '' },
    { key: 'reason', header: 'Reason', render: (d) => d.value?.reason ?? d.note ?? '' },
  ];
  return (
    <section class="img-section" aria-label="Decisions">
      <h2>Decisions</h2>
      <Table columns={columns} rows={entries} rowKey={(d) => d.id} />
    </section>
  );
}

export function RecordView({ id }: { id: string }) {
  const host = useHost();
  const [detail, setDetail] = useState<RecordDetail | null | undefined>(undefined);
  const [mode, setMode] = useState<Mode>('all');
  const [viewing, setViewing] = useState<string | null>(null);
  const [intent, setIntent] = useState<{ action: DecideInput['action']; style: string; version: string } | null>(null);
  const [removing, setRemoving] = useState<{ req: RemoveRequest; label: string } | null>(null);
  const [reload, setReload] = useState(0);
  const [seen, setSeen] = useState(host.changeToken);
  const stale = host.changeToken !== seen;

  useEffect(() => {
    let live = true;
    // Same id: keep showing the record while it refetches (a delete run's check must not remount the page).
    setDetail((d) => (d && d.record.id === id ? d : undefined));
    void host.data.record(id).then((d) => live && setDetail(d));
    return () => {
      live = false;
    };
  }, [id, reload, host.data]);

  const tour = useMemo(() => {
    const t = detail?.record.tour;
    const v = t?.versions.find((x) => x.version === t.currentVersion);
    return v?.preview && v.review?.playback === 'generated' ? v.preview : undefined;
  }, [detail]);

  if (detail === undefined) return <EmptyState>Loading.</EmptyState>;
  if (detail === null) {
    return (
      <div class="stack">
        <EmptyState>No image with id {id}.</EmptyState>
        <Anchor view="library">Back to library</Anchor>
      </div>
    );
  }
  const r = detail.record;
  const styles = stylesFor(detail, mode);
  const refetch = (): void => {
    setSeen(host.changeToken);
    setReload((n) => n + 1);
  };
  const done = (): void => {
    setIntent(null);
    refetch();
  };
  const lineage = (kind: 'reference' | 'related' | 'family', title: string) => {
    const list = detail.linked.filter((l) => l.kind === kind);
    return list.length ? (
      <div class="img-lineage">
        <h3>{title}</h3>
        <ul>
          {list.map((l) => (
            <li key={l.id}>
              <Anchor view="record" id={l.id}>{l.title}</Anchor>
            </li>
          ))}
        </ul>
      </div>
    ) : null;
  };

  return (
    <div class="page">
      <div class="page-head">
        <div class="title-block">
          <h1>{r.title}</h1>
          <p class="sub">
            {r.service} / {r.category} · <code>{r.id}</code>
          </p>
        </div>
        <div class="row">
          {tour && (
            <a class="btn btn--secondary" href={host.data.file(tour)} target="_blank" rel="noopener" title="Opens this image's interactive tour in a new browser tab. Nothing is changed.">
              Explore tour
            </a>
          )}
          <Anchor view="library" class="btn btn--ghost" title="Goes back to the image library, to the group this image belongs to. Nothing is changed." query={{ collection: r.collection === 'experiments' ? 'earlier' : r.collection }}>
            Back to library
          </Anchor>
          {canRemove(host) && (
            <Button variant="danger" help="Opens a window to confirm removing this whole image. Confirming archives its files outside the repo, checks them, deletes them from the repo and drops it from the catalog. It can be restored from the archive record." onClick={() => setRemoving({ req: { ids: [r.id] }, label: 'image' })}>
              Remove
            </Button>
          )}
        </div>
      </div>
      {stale && <StaleBanner onReload={done} />}
      {r.description && <p class="img-description">{r.description}</p>}
      {r.rejectionReason && <p class="img-error">Rejected: {r.rejectionReason}</p>}
      {detail.decision && (
        <p class="muted">
          Decision: {detail.decision.kind === 'approved' ? 'Approved by Matt' : detail.decision.kind === 'rejected' ? 'Rejected' : 'Selected'}
          {detail.decision.scope ? ` for ${detail.decision.scope}` : ''}
          {detail.decision.reason ? ` · ${detail.decision.reason}` : ''}
        </p>
      )}
      {r.collection === 'diagrams' && (
        <div class="img-seg" role="group" aria-label="Compare">
          {(['all', 'vectors', 'rasters'] as const).map((m) => (
            <Button key={m} small variant="ghost" aria-pressed={mode === m} help={m === 'all' ? 'Shows every style of this diagram. Nothing is changed.' : m === 'vectors' ? 'Shows only the drawn (flat and outline) styles of this diagram. Nothing is changed.' : 'Shows only the picture-style (holographic and photo) versions of this diagram. Nothing is changed.'} onClick={() => setMode(m)}>
              {m === 'all' ? 'All' : m === 'vectors' ? 'Flat + outline' : 'Holo + photo'}
            </Button>
          ))}
        </div>
      )}
      <div class={`img-compare${styles.length === 1 ? ' img-compare--single' : ''}`}>
        {styles.map((s) => (
          <Figure key={s} detail={detail} style={s} onView={setViewing} onDecide={(action, style, version) => setIntent({ action, style, version })} onSettle={refetch} onRemove={(req, label) => setRemoving({ req, label })} />
        ))}
      </div>
      <Versions detail={detail} onView={setViewing} onDecide={(action, style, version) => setIntent({ action, style, version })} onSettle={refetch} />
      {(detail.linked.length > 0) && (
        <section class="img-section" aria-label="Lineage">
          <h2>Lineage</h2>
          {lineage('reference', 'Source references')}
          {lineage('related', 'Related diagrams')}
          {lineage('family', 'Other versions and attempts')}
        </section>
      )}
      <Decisions entries={detail.decisions} />
      {viewing && <Viewer title={r.title} path={viewing} onClose={() => setViewing(null)} />}
      {intent && <DecisionDialog detail={detail} intent={intent} onClose={() => setIntent(null)} onDone={done} />}
      {removing && (
        <RemoveDialog
          request={removing.req}
          label={removing.label}
          onClose={() => setRemoving(null)}
          onDone={() => {
            setRemoving(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
