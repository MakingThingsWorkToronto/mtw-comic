import { useEffect } from 'preact/hooks';
import { formatEstUsd, formatPercent, formatTokens } from '../../web/format';
import { findClientModule } from '../client-registry';
import { Link } from '../../web/shell/Link';
import { buildUrl } from '../../web/shell/route';
import { refreshUsageSummary, terminals, usageSummary } from '../../web/state';
import type { UsageRowDto } from '../../web/state';
import { EmptyState, Table } from '../../web/ui';
import type { Column } from '../../web/ui';

function Bars({ rows, label }: { rows: UsageRowDto[]; label: string }) {
  const max = Math.max(1, ...rows.map((r) => r.total));
  if (!rows.some((r) => r.total > 0)) return <EmptyState>No token data yet.</EmptyState>;
  return (
    <ul class="bars" aria-label={label}>
      {rows.map((r) => (
        <li key={r.key}>
          <span class="bar-label" title={r.label}>{r.label}</span>
          <span class="bar-track" aria-hidden="true">
            <span class="bar-fill" style={`width:${(r.total / max) * 100}%`} />
          </span>
          <span class="bar-value">{formatTokens(r.total)}</span>
        </li>
      ))}
    </ul>
  );
}

export function UsageView() {
  const s = usageSummary.value;
  // The header refreshes on terminal events; also refresh when this view opens.
  useEffect(() => refreshUsageSummary(0), [terminals.value.length]);

  if (!s) return <EmptyState>Loading.</EmptyState>;
  const columns: Column<UsageRowDto>[] = [
    { key: 'label', header: 'Operation', render: (r) => r.label, sort: (a, b) => a.label.localeCompare(b.label) },
    { key: 'module', header: 'Module', render: (r) => r.module ?? '', sort: (a, b) => (a.module ?? '').localeCompare(b.module ?? '') },
    { key: 'runs', header: 'Runs', align: 'num', render: (r) => r.runs, sort: (a, b) => a.runs - b.runs },
    { key: 'input', header: 'Input', align: 'num', render: (r) => formatTokens(r.input), sort: (a, b) => a.input - b.input },
    { key: 'output', header: 'Output', align: 'num', render: (r) => formatTokens(r.output), sort: (a, b) => a.output - b.output },
    { key: 'cache', header: 'Cache read', align: 'num', render: (r) => formatTokens(r.cacheRead), sort: (a, b) => a.cacheRead - b.cacheRead },
    { key: 'hit', header: 'Hit', align: 'num', render: (r) => formatPercent(r.cacheHitRate), sort: (a, b) => a.cacheHitRate - b.cacheHitRate },
    { key: 'total', header: 'Total', align: 'num', render: (r) => formatTokens(r.total), sort: (a, b) => a.total - b.total },
    { key: 'est', header: 'Est. cost', align: 'num', render: (r) => formatEstUsd(r.estCostUsd), sort: (a, b) => a.estCostUsd - b.estCostUsd },
  ];
  const days = s.byDay.slice(0, 14).reverse();
  return (
    <div class="page">
      <div class="page-head">
        <div class="title-block">
          <h1 class="sr-only">Usage</h1>
          <p class="usage-summary">
            <span>Today <strong>{formatTokens(s.today.total)}</strong></span>
            <span>All time <strong>{formatTokens(s.all.total)}</strong></span>
            <span>Runs <strong>{s.runs}</strong></span>
            <span>Cache hit <strong>{formatPercent(s.all.cacheHitRate)}</strong></span>
            {s.byRunner.map((r) => (
              <span key={r.key}>{r.label} <strong>{formatTokens(r.total)}</strong></span>
            ))}
            {findClientModule('spend') && <Link href={buildUrl('spend')}>Full spend view</Link>}
          </p>
        </div>
      </div>
      <Table columns={columns} rows={s.byOperation} rowKey={(r) => r.key} defaultSort={{ key: 'total', dir: 'desc' }} empty="No runs yet." />
      <div class="usage-grid">
        <section>
          <h2>By operation</h2>
          <Bars rows={s.byOperation.slice(0, 10)} label="Tokens by operation" />
        </section>
        <section>
          <h2>By day</h2>
          <Bars rows={days} label="Tokens by day" />
        </section>
      </div>
    </div>
  );
}
