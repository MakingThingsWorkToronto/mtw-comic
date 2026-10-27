// Studio home: a dashboard into MTW operations (Matt, 2026-10-12). Five sections, every number computed by the server
// from canonical files (server/core/dashboard.ts), each with the time it was read and the file it came from:
// Needs you now, Running, Health, Libraries, Next steps. A server started before this dashboard existed answers
// /api/home without `dashboard`; the page then shows the old summary and asks for a Studio restart.
import { useEffect, useState } from 'preact/hooks';
import type { SummaryItem } from '../../modules/types';
import type { DashboardData } from '../../server/core/dashboard';
import type { HomeModuleEntry, HomeSummary } from '../../server/core/home';
import { runningCount, useLiveResource } from '../state';
import { Link } from './Link';
import './home.css';

type Health = DashboardData['health']['rows'][number];

/** "4 min", "3 h", "2 days" since an ISO time; '' when unknown. */
export function age(iso: string | undefined | null, now = Date.now()): string {
  if (!iso) return '';
  const min = Math.round((now - Date.parse(iso)) / 60_000);
  if (!Number.isFinite(min)) return '';
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min`;
  if (min < 48 * 60) return `${Math.round(min / 60)} h`;
  return `${Math.round(min / 1440)} days`;
}
const clock = (iso: string | null | undefined): string => (iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'not yet');
const shortDate = (iso: string | undefined): string => (iso ? new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '');
const num = (n: number | null | undefined): string => (n === null || n === undefined ? '-' : n.toLocaleString('en-US'));
const fmtTokens = (n: number): string => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(n));

function Section({ id, title, readAt, source, children, wide }: { id: string; title: string; readAt?: string | null; source?: string; children: preact.ComponentChildren; wide?: boolean }) {
  return (
    <section class={`home-sec glass home-${id}${wide ? ' home-wide' : ''}`} aria-labelledby={`home-${id}-h`}>
      <header class="home-sec-head">
        <h2 id={`home-${id}-h`}>{title}</h2>
        <p class="home-meta muted">
          Read {clock(readAt)}
          {source ? <span title={source}> · {source}</span> : null}
        </p>
      </header>
      {children}
    </section>
  );
}

const STATE_LABEL: Record<Health['state'], string> = { pass: 'Pass', warn: 'Warn', fail: 'Fail', info: 'Info' };
function Chip({ state, children }: { state: string; children: preact.ComponentChildren }) {
  return <span class={`home-chip home-chip--${state}`}>{children}</span>;
}

function Needs({ d }: { d: DashboardData }) {
  const items = d.needs.items;
  return (
    <Section id="needs" title="Needs you now" readAt={d.needs.readAt} source="each module's canonical files (row source)">
      {items.length === 0 ? (
        <p class="home-empty muted">Nothing is waiting on your decision.</p>
      ) : (
        <ol class="home-list">
          {items.map((n) => (
            <li key={`${n.module}/${n.id}`} class="home-need">
              <div class="home-need-text">
                <span class="home-need-title">
                  <span class="home-mod">{n.moduleTitle}</span> {n.title}
                </span>
                <span class="home-sub muted">
                  {n.next}
                  {n.since ? ` · waiting ${age(n.since)}` : ''}
                </span>
                <span class="home-src muted">{n.source}</span>
              </div>
              <Link href={n.href} class="btn btn--small btn--secondary home-act" aria-label={`${n.action}: ${n.moduleTitle} ${n.title}`}>
                {n.action}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}

function Running({ d }: { d: DashboardData }) {
  const r = d.running;
  const workflows = r.activity.filter((a) => a.kind === 'workflow-run');
  const schedules = r.activity.filter((a) => a.kind === 'schedule');
  return (
    <Section id="running" title="Running" readAt={r.readAt} source="Studio terminals, workflow runs, schedules, STATUS.md, leases.json">
      <h3 class="home-h3">Terminals ({r.terminals.length})</h3>
      {r.terminals.length === 0 ? (
        <p class="home-empty muted">No terminal is running.</p>
      ) : (
        <ul class="home-list">
          {r.terminals.map((t) => (
            <li key={t.id} class="home-row">
              <Link href={t.href} class="home-row-main">
                {t.title}
              </Link>
              <span class="home-sub muted">
                {[t.runner, t.model, t.effort].filter(Boolean).join(' · ')} · started {age(t.startedAt)} ago{t.tokens ? ` · ${fmtTokens(t.tokens)} tokens` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
      <h3 class="home-h3">Workflow runs today ({workflows.length})</h3>
      {workflows.length === 0 ? (
        <p class="home-empty muted">None today.</p>
      ) : (
        <ul class="home-list">
          {workflows.map((a) => (
            <li key={a.id} class="home-row">
              <Link href={a.href} class="home-row-main">
                {a.label}
              </Link>
              <span class="home-sub muted">
                <Chip state={a.status === 'failed' ? 'fail' : a.status === 'waiting' ? 'warn' : a.status === 'succeeded' ? 'pass' : 'info'}>{a.status}</Chip> {a.at ? `started ${age(a.at)} ago` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
      <h3 class="home-h3">Next scheduled runs</h3>
      {schedules.length === 0 ? (
        <p class="home-empty muted">No schedule is enabled.</p>
      ) : (
        <ul class="home-list">
          {schedules.map((a) => (
            <li key={a.id} class="home-row">
              <Link href={a.href} class="home-row-main">
                {a.label}
              </Link>
              <span class="home-sub muted">{a.status === 'running' ? 'running now' : a.at ? new Date(a.at).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</span>
            </li>
          ))}
        </ul>
      )}
      <h3 class="home-h3">Leases ({r.leases.rows.length})</h3>
      {r.leases.rows.length === 0 ? (
        <p class="home-empty muted">No session holds a lease.</p>
      ) : (
        <ul class="home-list">
          {r.leases.rows.map((l) => (
            <li key={`${l.holder}/${l.path}`} class="home-row">
              <span class="home-row-main">
                {l.holder} <code>{l.path}</code>
              </span>
              <span class="home-sub muted">
                {l.overdue ? <Chip state="warn">review overdue</Chip> : l.expired ? <Chip state="info">expired</Chip> : <Chip state="pass">active</Chip>} {l.reviewByUtc ? `review by ${clock(l.reviewByUtc)}${l.overdue ? ` (${age(l.reviewByUtc)} ago)` : ''}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
      <h3 class="home-h3">Other sessions (newest STATUS.md entries)</h3>
      <ul class="home-list">
        {r.claims.rows.slice(0, 8).map((c, i) => (
          <li key={i} class="home-row">
            <span class="home-row-main">
              <span class="home-holder">{c.holder}</span>
              {c.to ? <span class="muted"> to {c.to}</span> : null}
            </span>
            <span class="home-sub muted">
              <Chip state={c.state === 'released' ? 'pass' : c.state === 'hold' ? 'warn' : 'info'}>{c.state}</Chip> {c.scope}
              {c.at ? (c.dateOnly ? ` · ${shortDate(c.at)}` : ` · ${age(c.at)} ago`) : ''}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function HealthView({ d }: { d: DashboardData }) {
  return (
    <Section id="health" title="Health" readAt={d.health.readAt} source="per row">
      <ul class="home-list">
        {d.health.rows.map((h) => (
          <li key={h.id} class="home-hrow">
            <Chip state={h.state}>{STATE_LABEL[h.state]}</Chip>
            <div class="home-need-text">
              <span class="home-need-title">{h.href ? <Link href={h.href}>{h.label}</Link> : h.label}</span>
              <span class="home-sub">{h.detail}</span>
              <span class="home-src muted">
                {h.source}
                {h.readAt ? ` · read ${clock(h.readAt)}` : ''}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Libraries({ d }: { d: DashboardData }) {
  return (
    <Section id="libs" title="Libraries" readAt={d.libraries.readAt} source="library catalogs (row source)">
      <ul class="home-list">
        {d.libraries.rows.map((l) => (
          <li key={l.module} class="home-lib">
            <Link href={l.href} class="home-lib-name">
              {l.title}
            </Link>
            <span class="home-lib-num">
              <strong>{num(l.total)}</strong> <span class="muted">{l.totalLabel}</span>
            </span>
            <span class="home-lib-num">
              <strong>{num(l.awaiting)}</strong> <span class="muted">{l.awaitingLabel}</span>
            </span>
            <span class="home-lib-new muted">
              {l.newest ? (
                <>
                  Newest: {l.newest.href ? <Link href={l.newest.href}>{l.newest.label}</Link> : l.newest.label}
                  {l.newest.at ? `, ${shortDate(l.newest.at)}` : ''}
                </>
              ) : (
                'Newest: unknown'
              )}
            </span>
            <span class="home-src muted home-lib-src">{l.source}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function NextSteps({ d }: { d: DashboardData }) {
  const steps = d.nextSteps.steps;
  return (
    <Section id="next" title="Next steps" readAt={d.nextSteps.readAt} source="rules in apps/mtw/server/core/nextSteps.ts">
      {steps.length === 0 ? (
        <p class="home-empty muted">No step is due.</p>
      ) : (
        <ol class="home-steps">
          {steps.map((s) => (
            <li key={s.id}>
              {s.href ? <Link href={s.href}>{s.text}</Link> : s.text}
              <span class="home-src muted"> {s.because}</span>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}

/** The pre-dashboard view, for a Studio server that has not been restarted onto the new /api/home. */
function Legacy({ mods }: { mods: HomeModuleEntry[] }) {
  const waiting = (i: SummaryItem): boolean => i.attention === true && Number(i.count ?? 0) > 0;
  const needs = mods.flatMap((m) => m.items.filter(waiting).map((item) => ({ m, item })));
  return (
    <>
      <p class="home-restart" role="status">
        Restart Studio to load the new dashboard data. Until then this page shows the old summary from the running server.
      </p>
      <Section id="needs" title="Needs you (old summary)">
        <ul class="home-list">
          {needs.map(({ m, item }) => (
            <li key={`${m.id}/${item.id}`} class="home-row">
              <Link href={item.href} class="home-row-main">
                {m.title}: {item.label} {item.count !== undefined ? <strong>{item.count}</strong> : null}
              </Link>
              {item.detail && <span class="home-sub muted">{item.detail}</span>}
            </li>
          ))}
        </ul>
      </Section>
      <Section id="libs" title="Modules (old summary)">
        <ul class="home-list">
          {mods.map((m) => (
            <li key={m.id} class="home-row">
              <Link href={m.href} class="home-row-main">
                {m.title}
              </Link>
              <span class="home-sub muted">{m.error ? `Summary unavailable: ${m.error}` : m.items.filter((i) => !i.attention).map((i) => (i.count !== undefined ? `${i.label} ${i.count}` : i.label)).join(' · ')}</span>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}

export function Home() {
  // Refetches on any wiki change (summaries read the files the watcher covers), when terminals start or stop, and
  // every 30 s while the tab is visible (git status, gates and leases change outside the watched paths).
  const live = useLiveResource<HomeSummary>('/api/home');
  const running = runningCount.value;
  const [, tick] = useState(0);
  useEffect(() => {
    void live.reload();
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void live.reload();
        tick((n) => n + 1);
      }
    }, 30_000);
    return () => clearInterval(t);
  }, [live.reload]); // eslint-disable-line react-hooks/exhaustive-deps

  const d = live.data?.dashboard;
  return (
    <div class="page home">
      <div class="page-head">
        <div class="title-block">
          <h1>Operations</h1>
          <p class="sub">{d ? `Computed from canonical files at ${clock(d.generatedAt)}. Studio running since ${clock(d.studio.startedAt)}.` : 'Studio home'}</p>
        </div>
      </div>
      {live.loading && !live.data && <p class="muted">Loading.</p>}
      {live.error && <p role="alert" class="home-error">Home data unavailable: {live.error}</p>}
      {live.data && !d && <Legacy mods={live.data.modules} />}
      {d && (
        <div class="home-grid">
          <Needs d={d} />
          <Running d={d} />
          <HealthView d={d} />
          <Libraries d={d} />
          <NextSteps d={d} />
        </div>
      )}
    </div>
  );
}
