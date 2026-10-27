import { useEffect, useState } from 'preact/hooks';
import { buildUrl } from '../../../web/shell/route';
import { navigate } from '../../../web/shell/router';
import { Button, EmptyState } from '../../../web/ui';
import { copy } from '../copy';
import { filledAnswers } from '../shared';
import type { AskGroup } from '../shared';
import { launchFields, useLaunchPicker } from './common';
import { jpost } from './useJournal';

interface Props {
  groups: AskGroup[];
  target: { entry: string } | { concept: number };
  /** Reports whether any box holds text, so the page never reloads over unsaved typing. */
  onDirty: (dirty: boolean) => void;
  onRecorded: () => void;
}

type Result = { recorded: number; terminal: { id: string } | null; error?: string };

/** Answer boxes for every question waiting on Matt. Text is sent byte for byte; nothing is trimmed or tidied. */
export function AnswerForm({ groups, target, onDirty, onRecorded }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const { choice, picker, ready } = useLaunchPicker('journal-record-answers');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState<{ items: { label: string; question: string; value: string }[] } | null>(null);

  const items = groups.flatMap((g) => g.items.map((it) => ({ key: `${g.id}:${it.label}`, label: it.label, question: it.question, note: it.note })));
  const filled = filledAnswers(items.map((it) => ({ label: it.label, question: it.question, value: values[it.key] ?? '' })));
  useEffect(() => onDirty(filled.length > 0 || pending !== null), [filled.length, pending]);

  if (!items.length) return <EmptyState>{copy.answers.none}</EmptyState>;

  const submit = async (retry: boolean): Promise<void> => {
    const send = retry && pending ? pending.items : filled;
    if (!send.length) {
      setError(copy.answers.empty);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const r = await jpost<Result>('/answers', { ...target, items: send, record: !retry, ...launchFields(choice) });
      if (r.error) {
        setPending({ items: send });
        setError(`${copy.answers.recorded.replace('{n}', String(r.recorded))} ${r.error}`);
        onRecorded();
        setBusy(false);
        return;
      }
      setPending(null);
      setValues({});
      onRecorded();
      if (r.terminal) navigate(buildUrl('operations', ['terminals', r.terminal.id]));
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  return (
    <form
      class="stack"
      onSubmit={(e) => {
        e.preventDefault();
        if (!busy) void submit(false);
      }}
    >
      {groups.map((g) => (
        <fieldset key={g.id} class="j-group">
          <legend>{g.title}</legend>
          <p class="muted j-sub">{g.source}</p>
          {g.items.map((it) => {
            const key = `${g.id}:${it.label}`;
            const id = `a-${g.id}-${it.label}`;
            return (
              <div class="field j-q" key={key}>
                <label for={id}>
                  Q{it.label} · {it.question}
                </label>
                {it.note && <span class="hint">{it.note}</span>}
                <textarea
                  id={id}
                  class="input j-textarea"
                  rows={4}
                  placeholder={copy.answers.placeholder}
                  value={values[key] ?? ''}
                  onInput={(e) => setValues((v) => ({ ...v, [key]: (e.target as HTMLTextAreaElement).value }))}
                />
              </div>
            );
          })}
        </fieldset>
      ))}
      {picker}
      <div class="row">
        <Button type="submit" variant="primary" disabled={busy || !ready || (!filled.length && !pending)} help="Saves exactly what you typed as your answers (empty boxes are skipped), then opens a terminal where an agent files them into the right interview notes.">
          {busy ? copy.answers.sending : copy.answers.send}
        </Button>
        {pending && (
          <Button disabled={busy || !ready} help="Your answers are already saved. This only opens the terminal again so an agent can file them, after the first attempt failed. Nothing you typed is saved twice." onClick={() => void submit(true)}>
            {copy.answers.retry}
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" style="color:var(--error)">
          {error}
        </p>
      )}
    </form>
  );
}
