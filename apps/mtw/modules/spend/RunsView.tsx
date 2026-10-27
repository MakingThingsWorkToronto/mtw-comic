import { Link } from '../../web/shell/Link';
import { buildUrl } from '../../web/shell/route';
import { route, setQuery } from '../../web/shell/router';
import { formatDuration, formatEstUsd, formatPercent, formatTokens } from '../../web/format';
import { useLiveResource } from '../../web/state';
import { EmptyState, FilterBar, Table } from '../../web/ui';
import type { Column } from '../../web/ui';

interface RunRow {
  id: string;
  startedAt: string;
  durationMs: number;
  runner: string;
  model: string;
  operation: string;
  module: string;
  subject: string;
  status: string;
  transcript: string;
  tokens: { total: number; cacheHitRate: number; estCostUsd?: number } | null;
}

const when = (iso: string) => new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const cost = (r: RunRow) => r.tokens?.estCostUsd ?? 0;

export function RunsView() {
  const live = useLiveResource<{ runs: RunRow[] }>('/api/spend/runs', { module: 'spend' });
  const q = route.value.query;
  const search = q.get('q') ?? '';
  const runner = q.get('runner') ?? '';
  const module = q.get('module') ?? '';
  const all = live.data?.runs ?? [];
  const options = (get: (r: RunRow) => string, all_: string) => [{ value: '', label: all_ }, ...[...new Set(all.map(get).filter(Boolean))].sort().map((v) => ({ value: v, label: v }))];
  const rows = all.filter(
    (r) => (!runner || r.runner === runner) && (!module || r.module === module) && (!search || `${r.operation} ${r.subject} ${r.model}`.toLowerCase().includes(search.toLowerCase())),
  );

  const columns: Column<RunRow>[] = [
    { key: 'date', header: 'Date', render: (r) => when(r.startedAt), sort: (a, b) => a.startedAt.localeCompare(b.startedAt) },
    { key: 'runner', header: 'Runner', render: (r) => r.runner, sort: (a, b) => a.runner.localeCompare(b.runner) },
    { key: 'model', header: 'Model', render: (r) => r.model, sort: (a, b) => a.model.localeCompare(b.model) },
    { key: 'op', header: 'Operation', render: (r) => <Link href={buildUrl('operations', ['terminals', r.id])} title={r.transcript || 'Open the terminal'}>{r.operation}</Link>, sort: (a, b) => a.operation.localeCompare(b.operation) },
    { key: 'module', header: 'Module', render: (r) => r.module, sort: (a, b) => a.module.localeCompare(b.module) },
    { key: 'subject', header: 'Subject', render: (r) => r.subject, sort: (a, b) => a.subject.localeCompare(b.subject) },
    { key: 'dur', header: 'Duration', align: 'num', render: (r) => <span class="num">{formatDuration(r.durationMs)}</span>, sort: (a, b) => a.durationMs - b.durationMs },
    { key: 'tokens', header: 'Tokens', align: 'num', render: (r) => <span class="num">{r.tokens ? formatTokens(r.tokens.total) : ''}</span>, sort: (a, b) => (a.tokens?.total ?? 0) - (b.tokens?.total ?? 0) },
    { key: 'hit', header: 'Cache hit', align: 'num', render: (r) => <span class="num">{r.tokens ? formatPercent(r.tokens.cacheHitRate) : ''}</span>, sort: (a, b) => (a.tokens?.cacheHitRate ?? 0) - (b.tokens?.cacheHitRate ?? 0) },
    { key: 'cost', header: 'Est. cost', align: 'num', render: (r) => <span class="num">{r.tokens?.estCostUsd !== undefined ? formatEstUsd(cost(r)) : ''}</span>, sort: (a, b) => cost(a) - cost(b) },
  ];

  return (
    <div class="page">
      <h1 class="sr-only">Runs</h1>
      <FilterBar
        search={search}
        onSearch={(v) => setQuery({ q: v })}
        searchLabel="Search operation, subject or model"
        selects={[
          { name: 'runner', label: 'Runner', value: runner, options: options((r) => r.runner, 'All runners') },
          { name: 'module', label: 'Module', value: module, options: options((r) => r.module, 'All modules') },
        ]}
        onSelect={(name, value) => setQuery({ [name]: value })}
      />
      {live.error && <p role="alert" style="color:var(--error)">{live.error}</p>}
      {!live.data && !live.error ? <EmptyState>Loading.</EmptyState> : <Table columns={columns} rows={rows} rowKey={(r) => r.id} defaultSort={{ key: 'date', dir: 'desc' }} empty="No runs match." />}
      <p class="sp-note muted">Est. cost is an API-equivalent estimate from wiki/operations/pricing.json, not a billed amount.</p>
    </div>
  );
}
