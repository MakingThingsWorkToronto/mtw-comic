import { useState } from 'preact/hooks';
import { api } from '../../web/api';
import { useLiveResource } from '../../web/state';
import { Button, EmptyState, Table } from '../../web/ui';
import type { Column } from '../../web/ui';

interface Entry {
  at: string;
  provider: string;
  units: number;
  unit: string;
  operation?: string;
  subject?: string;
  receipt?: string;
  note?: string;
}
interface Total {
  provider: string;
  label: string;
  month: Record<string, number>;
  allowance: { amount: number; unit: string; source: string } | null;
}
interface Data {
  entries: Entry[];
  totals: Total[];
  month: string;
}

const fmt = (n: number): string => n.toLocaleString('en-US', { maximumFractionDigits: 2 });

export function ProvidersView() {
  const live = useLiveResource<Data>('/api/spend/ledger', { module: 'spend' });
  const [form, setForm] = useState({ provider: 'elevenlabs', units: '', unit: 'credits', operation: '', subject: '', receipt: '', at: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const add = async () => {
    setBusy(true);
    setError('');
    try {
      await api.post('/api/spend/ledger', { ...form, units: Number(form.units) });
      setForm((f) => ({ ...f, units: '', operation: '', subject: '', receipt: '', at: '' }));
      await live.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const d = live.data;
  if (!d) return live.error ? <p role="alert" style="color:var(--error)">{live.error}</p> : <EmptyState>Loading.</EmptyState>;

  const columns: Column<Entry>[] = [
    { key: 'at', header: 'Date', render: (e) => new Date(e.at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }), sort: (a, b) => a.at.localeCompare(b.at) },
    { key: 'provider', header: 'Provider', render: (e) => e.provider, sort: (a, b) => a.provider.localeCompare(b.provider) },
    { key: 'units', header: 'Amount', align: 'num', render: (e) => <span class="num">{fmt(e.units)} {e.unit}</span>, sort: (a, b) => a.units - b.units },
    { key: 'op', header: 'Operation', render: (e) => e.operation ?? '' },
    { key: 'subject', header: 'Subject', render: (e) => e.subject ?? '' },
    { key: 'receipt', header: 'Receipt', render: (e) => (e.receipt ? <span title={e.receipt}>{e.receipt.split('/').pop()}</span> : '') },
  ];

  return (
    <div class="page">
      <h1 class="sr-only">Providers</h1>
      <p class="sp-note muted">Credits spent on non-LLM providers, from wiki/operations/spend/ledger.jsonl. Amounts are as recorded in receipts; allowances come from wiki/operations/spend/allowances.json and are unverified until noted.</p>
      <section>
        <h2>{d.month}</h2>
        <ul class="sp-bars" aria-label="Monthly provider totals">
          {d.totals.map((t) => {
            const used = t.allowance ? (t.month[t.allowance.unit] ?? 0) : 0;
            const frac = t.allowance ? used / t.allowance.amount : 0;
            return (
              <li key={t.provider} class="sp-limit">
                <span class="sp-bar-label">{t.label}</span>
                <span class="sp-bar-track" aria-hidden="true">
                  <span class={`sp-bar-fill${frac >= 0.8 ? ' sp-warn' : ''}`} style={`width:${Math.min(100, frac * 100)}%`} />
                </span>
                <span class="num">{Object.entries(t.month).map(([u, n]) => `${fmt(n)} ${u}`).join(', ') || '0'}</span>
                <span class="muted" title={t.allowance?.source}>{t.allowance ? `of ${fmt(t.allowance.amount)} ${t.allowance.unit} allowance` : 'no allowance set'}</span>
              </li>
            );
          })}
        </ul>
      </section>
      <section>
        <h2>Add entry</h2>
        <form class="sp-form" onSubmit={(e) => { e.preventDefault(); if (!busy) void add(); }}>
          <div class="field">
            <label for="l-provider">Provider</label>
            <input id="l-provider" class="input" list="l-providers" value={form.provider} onInput={(e) => set('provider', (e.target as HTMLInputElement).value)} />
            <datalist id="l-providers">
              {d.totals.map((t) => <option key={t.provider} value={t.provider} />)}
            </datalist>
          </div>
          <div class="field">
            <label for="l-units">Amount</label>
            <input id="l-units" class="input" type="number" min="0" step="any" required value={form.units} onInput={(e) => set('units', (e.target as HTMLInputElement).value)} />
          </div>
          <div class="field">
            <label for="l-unit">Unit</label>
            <select id="l-unit" class="select" value={form.unit} onChange={(e) => set('unit', (e.target as HTMLSelectElement).value)}>
              <option value="credits">credits</option>
              <option value="usd">usd</option>
              <option value="images">images</option>
            </select>
          </div>
          <div class="field">
            <label for="l-op">Operation</label>
            <input id="l-op" class="input" value={form.operation} onInput={(e) => set('operation', (e.target as HTMLInputElement).value)} />
          </div>
          <div class="field">
            <label for="l-subject">Subject</label>
            <input id="l-subject" class="input" value={form.subject} onInput={(e) => set('subject', (e.target as HTMLInputElement).value)} />
          </div>
          <div class="field">
            <label for="l-receipt">Receipt path</label>
            <input id="l-receipt" class="input" value={form.receipt} onInput={(e) => set('receipt', (e.target as HTMLInputElement).value)} />
          </div>
          <div class="field">
            <label for="l-at">Date (optional)</label>
            <input id="l-at" class="input" type="date" value={form.at} onInput={(e) => set('at', (e.target as HTMLInputElement).value)} />
          </div>
          <Button type="submit" variant="primary" help="Records this amount as spent with the provider so it counts toward the month total. It does not buy or charge anything." disabled={busy || !form.units}>
            Add entry
          </Button>
        </form>
        {error && <p role="alert" style="color:var(--error)">{error}</p>}
      </section>
      <section>
        <h2>Ledger</h2>
        <Table columns={columns} rows={d.entries} rowKey={(e) => `${e.at}|${e.provider}|${e.units}|${e.subject ?? ''}`} defaultSort={{ key: 'at', dir: 'desc' }} empty="No entries yet." />
      </section>
    </div>
  );
}
