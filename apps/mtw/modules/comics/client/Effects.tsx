import { useState } from 'preact/hooks';
import { AudioPlayer, Badge, Button, EmptyState } from '../../../web/ui';
import { post, useView } from './hooks';
import type { EffectDirectionView } from './types';

const FIELDS = [
  ['usage', 'Usage'],
  ['notes', 'Notes'],
] as const;

function Direction({ d, onSaved }: { d: EffectDirectionView; onSaved: () => void }) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dirty = Object.keys(draft).length > 0;
  const save = async () => {
    setBusy(true);
    setError('');
    try {
      await post(`/api/comics/effects/${encodeURIComponent(d.id)}`, { fields: draft });
      setDraft({});
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form class="effect-card" onSubmit={(e) => { e.preventDefault(); if (dirty && !busy) void save(); }}>
      <div class="row">
        <strong>{d.id}</strong>
        <span class="muted small">{d.voiceName} ({d.provider})</span>
        <Badge status="approved">{d.status ?? 'direction'}</Badge>
        <Badge status={d.gate.canGenerate ? 'approved' : 'pending'}>{d.gate.canGenerate ? 'generation approved' : 'exact words gate'}</Badge>
      </div>
      <p class="muted small">{d.gate.reason}</p>
      {d.preview && <AudioPlayer src={d.preview} label={`${d.voiceName} preview`} />}
      {FIELDS.map(([name, label]) => (
        <div class="field" key={name}>
          <label for={`ef-${d.id}-${name}`}>{label}</label>
          <textarea id={`ef-${d.id}-${name}`} class="input area" rows={2} value={draft[name] ?? String(d[name] ?? '')} onInput={(e) => setDraft((x) => ({ ...x, [name]: (e.target as HTMLTextAreaElement).value }))} />
        </div>
      ))}
      <div class="row">
        <Button type="submit" variant="primary" disabled={!dirty || busy} help="Saves your usage and notes for this sound effect in the comics library. The sound file itself is not changed.">Save direction</Button>
        {dirty && <Button variant="ghost" help="Throws away your unsaved changes to this effect's notes and goes back to what is saved." onClick={() => setDraft({})}>Discard</Button>}
        {error && <span class="error">{error}</span>}
      </div>
    </form>
  );
}

/** Effect voice directions (POW/WOW and the like): casting decisions, never approval to synthesize new words. */
export function EffectVoices() {
  const { data, error, reload } = useView<{ directions: EffectDirectionView[] }>('/api/comics/effects');
  if (error) return <EmptyState>{error}</EmptyState>;
  if (!data || data.directions.length === 0) return null;
  return (
    <section class="stack">
      <h2>Effect voices</h2>
      <p class="muted">A direction names a voice for vocal effects. New words still need exact-word review before anything is generated.</p>
      {data.directions.map((d) => <Direction key={d.id} d={d} onSaved={() => void reload()} />)}
    </section>
  );
}
