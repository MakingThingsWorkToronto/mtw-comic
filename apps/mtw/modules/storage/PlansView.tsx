import { Link } from '../../web/shell/Link';
import { buildUrl } from '../../web/shell/route';
import { navigate } from '../../web/shell/router';
import { useLiveResource } from '../../web/state';
import { Table } from '../../web/ui';
import type { Column } from '../../web/ui';
import type { PlanSummary } from './types';
import { StatusBadge } from './ui/StatusBadge';
import { formatBytes, formatWhen } from './ui/format';

export function PlansView() {
  const live = useLiveResource<PlanSummary[]>('/api/storage/plans', { module: 'storage' });
  const columns: Column<PlanSummary>[] = [
    {
      key: 'title',
      header: 'Plan',
      render: (p) => (
        <Link href={buildUrl('storage', ['plans', p.id])} aria-label={`Open plan ${p.title}`}>
          {p.title}
        </Link>
      ),
      sort: (a, b) => a.title.localeCompare(b.title),
    },
    { key: 'vertical', header: 'Vertical', render: (p) => p.vertical, sort: (a, b) => a.vertical.localeCompare(b.vertical) },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} />, sort: (a, b) => a.status.localeCompare(b.status) },
    { key: 'files', header: 'Files', render: (p) => <span class="st-num">{p.files.toLocaleString()}</span>, sort: (a, b) => a.files - b.files },
    { key: 'bytes', header: 'Savings', render: (p) => <span class="st-num">{formatBytes(p.bytes)}</span>, sort: (a, b) => a.bytes - b.bytes },
    { key: 'created', header: 'Created', render: (p) => formatWhen(p.createdAt), sort: (a, b) => a.createdAt.localeCompare(b.createdAt) },
  ];
  return (
    <div class="page">
      <div class="page-head">
        <div class="title-block">
          <h1 class="sr-only">Plans</h1>
          <p class="sub">Each plan is an exact file list in wiki/operations/storage/plans. Nothing moves until you approve and execute.</p>
        </div>
      </div>
      {live.error && <p role="alert" style="color:var(--error)">{live.error}</p>}
      <Table
        columns={columns}
        rows={live.data ?? []}
        rowKey={(p) => p.id}
        rowLabel={(p) => `Plan ${p.title}`}
        onRowClick={(p) => navigate(buildUrl('storage', ['plans', p.id]))}
        defaultSort={{ key: 'created', dir: 'desc' }}
        empty={live.loading ? 'Loading.' : 'No plans yet. Create one from a reduction on the Overview.'}
      />
    </div>
  );
}
