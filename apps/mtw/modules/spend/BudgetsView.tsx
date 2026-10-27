import { useState } from 'preact/hooks';
import { api } from '../../web/api';
import { formatEstUsd, formatTokens } from '../../web/format';
import { useLiveResource } from '../../web/state';
import { ChangedBar } from '../../web/shell/ChangedBar';
import { Button, EmptyState } from '../../web/ui';

interface Budget {
  scope: 'total' | 'runner' | 'module';
  key?: string;
  limitUsd?: number;
  limitTokens?: number;
}
interface Status extends Budget {
  usedUsd: number;
  usedTokens: number;
  fraction: number;
}
interface Data {
  monthly: Budget[];
  statuses: Status[];
}

export function BudgetsView() {
  const [draft, setDraft] = useState<Budget[] | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const dirty = draft !== null;
  const live = useLiveResource<Data>('/api/spend/budgets', { module: 'spend', isDirty: () => dirty });

  if (!live.data) return live.error ? <p role="alert" style="color:var(--error)">{live.error}</p> : <EmptyState>Loading.</EmptyState>;
  const rows = draft ?? live.data.monthly;
  const statusOf = (i: number): Status | undefined => (draft ? undefined : live.data?.statuses[i]);
  const edit = (i: number, patch: Partial<Budget>) => setDraft(rows.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await api.post('/api/spend/budgets', { monthly: rows });
      setDraft(null);
      await live.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div class="page">
      <h1 class="sr-only">Budgets</h1>
      <p class="sp-note muted">Optional monthly limits. Dollar limits compare against the estimated API-equivalent cost; token limits against tokens. A muted badge appears in the header at 80%.</p>
      <ChangedBar live={live} label="Budgets changed on disk." />
      {rows.length === 0 && <EmptyState>No budgets set.</EmptyState>}
      <div class="sp-budgets">
        {rows.map((b, i) => {
          const st = statusOf(i);
          return (
            <div class="sp-budget" key={i}>
              <div class="field">
                <label for={`b-scope-${i}`}>Applies to</label>
                <select id={`b-scope-${i}`} class="select" value={b.scope} onChange={(e) => edit(i, { scope: (e.target as HTMLSelectElement).value as Budget['scope'] })}>
                  <option value="total">Everything</option>
                  <option value="runner">A runner</option>
                  <option value="module">A module</option>
                </select>
              </div>
              <div class="field">
                <label for={`b-key-${i}`}>Name</label>
                <input id={`b-key-${i}`} class="input" disabled={b.scope === 'total'} placeholder={b.scope === 'runner' ? 'claude' : b.scope === 'module' ? 'journal' : ''} value={b.key ?? ''} onInput={(e) => edit(i, { key: (e.target as HTMLInputElement).value })} />
              </div>
              <div class="field">
                <label for={`b-usd-${i}`}>Est. USD / month</label>
                <input id={`b-usd-${i}`} class="input" type="number" min="0" step="1" value={b.limitUsd ?? ''} onInput={(e) => edit(i, { limitUsd: Number((e.target as HTMLInputElement).value) || undefined })} />
              </div>
              <div class="field">
                <label for={`b-tok-${i}`}>Tokens / month</label>
                <input id={`b-tok-${i}`} class="input" type="number" min="0" step="100000" value={b.limitTokens ?? ''} onInput={(e) => edit(i, { limitTokens: Number((e.target as HTMLInputElement).value) || undefined })} />
              </div>
              <div class="sp-budget-use">
                {st ? (
                  <>
                    <span class="sp-bar-track" aria-hidden="true">
                      <span class={`sp-bar-fill${st.fraction >= 0.8 ? ' sp-warn' : ''}`} style={`width:${Math.min(100, st.fraction * 100)}%`} />
                    </span>
                    <span class="num">{Math.round(st.fraction * 100)}%</span>
                    <span class="muted">{formatEstUsd(st.usedUsd)} est. · {formatTokens(st.usedTokens)}</span>
                  </>
                ) : (
                  <span class="muted">Save to see usage.</span>
                )}
              </div>
              <Button small variant="ghost" help="Takes this spending limit out of the list. It only changes for good when you press Save." aria-label={`Remove budget ${i + 1}`} onClick={() => setDraft(rows.filter((_, j) => j !== i))}>
                Remove
              </Button>
            </div>
          );
        })}
      </div>
      {error && <p role="alert" style="color:var(--error)">{error}</p>}
      <div class="row">
        <Button help="Adds a new empty spending limit to the list so you can set an amount. It only counts once you press Save." onClick={() => setDraft([...rows, { scope: 'total', limitUsd: 50 }])}>Add budget</Button>
        <Button variant="primary" help="Saves your spending limits so they are used from now on. Nothing is spent by saving." disabled={!dirty || saving} onClick={() => void save()}>
          Save
        </Button>
        {dirty && (
          <Button variant="ghost" help="Throws away your unsaved changes and goes back to the saved spending limits." onClick={() => setDraft(null)}>
            Discard
          </Button>
        )}
      </div>
    </div>
  );
}
