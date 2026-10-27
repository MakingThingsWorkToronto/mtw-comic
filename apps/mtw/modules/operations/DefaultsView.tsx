import { useEffect, useState } from 'preact/hooks';
import { api } from '../../web/api';
import type { RunnerOption, StudioSettings } from '../../web/api';
import { Button } from '../../web/ui';

/**
 * Operations > Defaults: config/studio.json. The provider Studio's chat panels and pickers start on, and for each
 * provider the model and effort its terminals launch with (a procedure that names its own runner keeps it).
 */
export function DefaultsView() {
  const [runners, setRunners] = useState<RunnerOption[] | null>(null);
  const [saved, setSaved] = useState<StudioSettings | null>(null);
  const [draft, setDraft] = useState<StudioSettings | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  /** Providers whose model is being typed as an id not in the list. */
  const [typing, setTyping] = useState<string[]>([]);

  useEffect(() => {
    api.runners().then(setRunners, (e: Error) => setError(e.message));
    api.settings().then(
      (s) => {
        setSaved(s);
        setDraft(s);
      },
      // An older Studio server has no settings route until it restarts.
      () => setError('This Studio server predates Defaults: restart Studio (npm run studio) to edit them here, or edit config/studio.json.'),
    );
  }, []);

  if (error && !draft) return <p class="error small">{error}</p>;
  if (!runners || !draft) return <p class="muted small">Loading.</p>;
  const providers = runners.filter((r) => r.id !== 'shell' && r.status === 'proven');
  const set = (runner: string, key: 'model' | 'effort', value: string) =>
    setDraft({ ...draft, runners: { ...draft.runners, [runner]: { model: draft.runners[runner]?.model ?? '', effort: draft.runners[runner]?.effort ?? '', [key]: value } } });
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const next = await api.saveSettings(draft);
      setSaved(next);
      setDraft(next);
      setStatus('Saved to config/studio.json. The next terminal Studio starts uses these.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div class="page">
      <div class="page-head">
        <div class="title-block">
          <h1 class="sr-only">Defaults</h1>
          <p class="muted small">
            Studio settings, kept in <code>config/studio.json</code>. Each provider's model and effort apply to every terminal Studio starts with it; a procedure that names its own
            provider (Codex for image generation) keeps it.
          </p>
        </div>
      </div>
      <section class="ops-defaults stack">
        <div class="field">
          <label for="def-runner">Default provider</label>
          <select id="def-runner" class="select" value={draft.defaultRunner} onChange={(e) => setDraft({ ...draft, defaultRunner: (e.target as HTMLSelectElement).value })}>
            {providers.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <p class="small muted">Where Studio's chat panels and runner pickers start.</p>
        </div>
        <table class="ops-defaults-table">
          <thead>
            <tr>
              <th scope="col">Provider</th>
              <th scope="col">Model</th>
              <th scope="col">Effort</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((r) => {
              const cur = draft.runners[r.id] ?? { model: '', effort: '' };
              const listed = (r.models ?? []).some((m) => m.id === cur.model);
              const other = typing.includes(r.id) || (Boolean(cur.model) && !listed);
              return (
                <tr key={r.id}>
                  <th scope="row">{r.label}</th>
                  <td>
                    {r.models?.length ? (
                      <>
                        <select
                          class="select"
                          aria-label={`${r.label} model`}
                          value={other ? '__other' : cur.model}
                          onChange={(e) => {
                            const v = (e.target as HTMLSelectElement).value;
                            setTyping((t) => (v === '__other' ? [...t, r.id] : t.filter((x) => x !== r.id)));
                            if (v !== '__other') set(r.id, 'model', v);
                          }}
                        >
                          <option value="">The CLI's own default</option>
                          {r.models.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.label} ({m.id})
                            </option>
                          ))}
                          <option value="__other">Other model id…</option>
                        </select>
                        {other && <input class="input" aria-label={`${r.label} model id`} placeholder="model id" value={cur.model} onInput={(e) => set(r.id, 'model', (e.target as HTMLInputElement).value)} />}
                      </>
                    ) : (
                      <span class="muted small">Not settable</span>
                    )}
                  </td>
                  <td>
                    {r.efforts?.length ? (
                      <select class="select" aria-label={`${r.label} effort`} value={cur.effort} onChange={(e) => set(r.id, 'effort', (e.target as HTMLSelectElement).value)}>
                        <option value="">The CLI's own default</option>
                        {r.efforts.map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span class="muted small">Not settable</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div class="row">
          <Button variant="primary" disabled={!dirty || busy} help="Saves your choice of default agent, model and effort. The next terminal Studio starts uses them; terminals already running are not changed." onClick={() => void save()}>
            {busy ? 'Saving…' : 'Save defaults'}
          </Button>
          {dirty && (
            <Button variant="secondary" disabled={busy} help="Puts the settings above back to what was last saved. Nothing is saved or started." onClick={() => setDraft(saved)}>
              Discard changes
            </Button>
          )}
          {status && !dirty && (
            <span class="small muted" role="status">
              {status}
            </span>
          )}
        </div>
        {error && <p class="error small">{error}</p>}
      </section>
    </div>
  );
}
