import { useEffect } from 'preact/hooks';
import { formatEstUsd, formatPercent, formatTokens } from '../../web/format';
import { useLiveResource, usageSummary } from '../../web/state';
import { EmptyState, Table } from '../../web/ui';
import type { Column } from '../../web/ui';

interface Agg {
  key?: string;
  runs: number;
  total: number;
  estCostUsd: number;
  cacheSavingsUsd: number;
  cacheHitRate: number;
}
interface Window {
  usedPercent: number;
  windowMinutes: number;
  resetsAt: string | null;
}
export interface OverviewData {
  estimateNote: string;
  pricing: { asOf?: string; source?: string };
  unpricedRuns: number;
  /** Absent from servers started before 2026-10-12. */
  unpricedModels?: string[];
  unpricedTokens?: number;
  periods: { week: Agg; month: Agg; all: Agg };
  days: { day: string; runners: Record<string, number>; estCostUsd: number; total: number }[];
  byRunner: Agg[];
  byModule: Agg[];
  topOperations: Agg[];
  planLimits: { codex: { at: string; primary: Window | null; secondary: Window | null } | null; claude: null };
  budgets: { scope: string; key?: string; fraction: number }[];
}

export const RUNNER_CLASS: Record<string, string> = { claude: 'sp-c1', codex: 'sp-c2' };

function BarList({ rows, label }: { rows: Agg[]; label: string }) {
  const max = Math.max(1, ...rows.map((r) => r.total));
  if (!rows.some((r) => r.total > 0)) return <EmptyState>No runs with token data this month.</EmptyState>;
  return (
    <ul class="sp-bars" aria-label={label}>
      {rows.map((r) => (
        <li key={r.key}>
          <span class="sp-bar-label" title={r.key}>{r.key}</span>
          <span class="sp-bar-track" aria-hidden="true">
            <span class="sp-bar-fill" style={`width:${(r.total / max) * 100}%`} />
          </span>
          <span class="num">{formatTokens(r.total)}</span>
          <span class="num muted">{formatEstUsd(r.estCostUsd)}</span>
        </li>
      ))}
    </ul>
  );
}

/** 30 daily stacked bars, one segment per runner, drawn in SVG. */
function DailyStrip({ days }: { days: OverviewData['days'] }) {
  const max = Math.max(1, ...days.map((d) => d.total));
  const runners = [...new Set(days.flatMap((d) => Object.keys(d.runners)))];
  const w = 10;
  const h = 64;
  return (
    <figure class="sp-strip">
      <svg viewBox={`0 0 ${days.length * w} ${h}`} preserveAspectRatio="none" role="img" aria-label={`Tokens per day for the last 30 days, peak ${formatTokens(max)}`}>
        {days.map((d, i) => {
          let y = h;
          return (
            <g key={d.day}>
              <title>{`${d.day}: ${formatTokens(d.total)} tokens, ${formatEstUsd(d.estCostUsd)} est.`}</title>
              <rect x={i * w} y={0} width={w} height={h} fill="transparent" />
              {runners.map((r) => {
                const bh = ((d.runners[r] ?? 0) / max) * (h - 2);
                y -= bh;
                return bh > 0 ? <rect key={r} class={RUNNER_CLASS[r] ?? 'sp-c3'} x={i * w + 1} y={y} width={w - 2} height={bh} /> : null;
              })}
            </g>
          );
        })}
      </svg>
      <figcaption>
        <span class="muted">{days[0]?.day}</span>
        <span class="sp-legend">
          {runners.map((r) => (
            <span key={r}>
              <i class={`sp-swatch ${RUNNER_CLASS[r] ?? 'sp-c3'}`} aria-hidden="true" />
              {r}
            </span>
          ))}
        </span>
        <span class="muted">{days[days.length - 1]?.day}</span>
      </figcaption>
    </figure>
  );
}

const resetLabel = (iso: string | null): string => (iso ? new Date(iso).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' }) : 'unknown');
const windowName = (m: number): string => (m >= 1440 ? `${Math.round(m / 1440)}-day window` : m >= 60 ? `${Math.round(m / 60)}-hour window` : `${m}-minute window`);

function PlanLimits({ data }: { data: OverviewData['planLimits'] }) {
  const codex = data.codex;
  const wins = codex ? [codex.primary, codex.secondary].filter((w): w is Window => !!w) : [];
  return (
    <section>
      <h2>Plan limits</h2>
      <ul class="sp-bars" aria-label="Plan limits">
        {wins.map((w) => (
          <li key={w.windowMinutes} class="sp-limit">
            <span class="sp-bar-label">Codex, {windowName(w.windowMinutes)}</span>
            <span class="sp-bar-track" aria-hidden="true">
              <span class="sp-bar-fill" style={`width:${Math.min(100, w.usedPercent)}%`} />
            </span>
            <span class="num">{Math.round(w.usedPercent)}%</span>
            <span class="muted">resets {resetLabel(w.resetsAt)}</span>
          </li>
        ))}
        {!wins.length && (
          <li class="sp-limit">
            <span class="sp-bar-label">Codex</span>
            <span class="muted">not reported yet (read from the latest Codex rollout)</span>
          </li>
        )}
        <li class="sp-limit">
          <span class="sp-bar-label">Claude</span>
          <span class="muted">not reported (Claude Code transcripts do not carry plan-limit windows)</span>
        </li>
      </ul>
      {codex && <p class="muted sp-note">Codex figures as of {new Date(codex.at).toLocaleString()}.</p>}
    </section>
  );
}

export function Overview() {
  const live = useLiveResource<OverviewData>('/api/spend/overview', { module: 'spend' });
  // Refresh as runs start, report tokens and end.
  const stamp = usageSummary.value?.generatedAt;
  useEffect(() => {
    if (stamp) void live.reload();
  }, [stamp]);

  const d = live.data;
  if (live.error) return <p role="alert" style="color:var(--error)">{live.error}</p>;
  if (!d) return <EmptyState>Loading.</EmptyState>;

  const withTokens = d.topOperations.filter((r) => r.total > 0);
  const periods: { key: string; label: string; a: Agg }[] = [
    { key: 'week', label: 'This week', a: d.periods.week },
    { key: 'month', label: 'This month', a: d.periods.month },
    { key: 'all', label: 'All time', a: d.periods.all },
  ];
  const columns: Column<(typeof periods)[number]>[] = [
    { key: 'label', header: 'Period', render: (p) => p.label },
    { key: 'runs', header: 'Runs', align: 'num', render: (p) => <span class="num">{p.a.runs}</span> },
    { key: 'tokens', header: 'Tokens', align: 'num', render: (p) => <span class="num">{formatTokens(p.a.total)}</span> },
    { key: 'hit', header: 'Cache hit', align: 'num', render: (p) => <span class="num">{formatPercent(p.a.cacheHitRate)}</span> },
    { key: 'cost', header: 'Est. API cost', align: 'num', render: (p) => <span class="num">{formatEstUsd(p.a.estCostUsd)}</span> },
    { key: 'saved', header: 'Est. cache savings', align: 'num', render: (p) => <span class="num">{formatEstUsd(p.a.cacheSavingsUsd)}</span> },
  ];
  const opCols: Column<Agg>[] = [
    { key: 'op', header: 'Operation', render: (r) => r.key },
    { key: 'runs', header: 'Runs', align: 'num', render: (r) => <span class="num">{r.runs}</span> },
    { key: 'tokens', header: 'Tokens', align: 'num', render: (r) => <span class="num">{formatTokens(r.total)}</span> },
    { key: 'cost', header: 'Est. cost', align: 'num', render: (r) => <span class="num">{formatEstUsd(r.estCostUsd)}</span> },
  ];

  return (
    <div class="page">
      <h1 class="sr-only">Spend overview</h1>
      <p class="sp-note muted">
        Estimates at placeholder API prices; not billed. <a href="/api/tokens/pricing" target="_blank" rel="noreferrer">pricing.json</a>
        {d.unpricedRuns > 0
          ? ` ${d.unpricedRuns} run(s) this month${d.unpricedTokens ? ` (${formatTokens(d.unpricedTokens)} tokens)` : ''} are not costed: price unknown for ${d.unpricedModels?.length ? d.unpricedModels.join(', ') : 'their model'}.`
          : ''}
      </p>
      <Table columns={columns} rows={periods} rowKey={(p) => p.key} empty="No runs yet." />
      <section>
        <h2>Last 30 days</h2>
        <DailyStrip days={d.days} />
      </section>
      <PlanLimits data={d.planLimits} />
      <div class="sp-grid">
        <section>
          <h2>By runner, this month</h2>
          <BarList rows={d.byRunner} label="Tokens by runner" />
        </section>
        <section>
          <h2>By module, this month</h2>
          <BarList rows={d.byModule} label="Tokens by module" />
        </section>
      </div>
      <section>
        <h2>Top operations by est. cost, this month</h2>
        <Table columns={opCols} rows={withTokens} rowKey={(r) => r.key ?? ''} empty="No operations with token data yet." />
        {withTokens.length < d.topOperations.length && <p class="sp-note muted">{d.topOperations.length - withTokens.length} operation(s) without token data are hidden.</p>}
      </section>
    </div>
  );
}
