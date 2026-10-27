import { useEffect, useState } from 'preact/hooks';
import type { OperationDef } from '../../types';
import { api } from '../../../web/api';
import { buildUrl } from '../../../web/shell/route';
import { navigate } from '../../../web/shell/router';
import { wikiChanged } from '../../../web/state';
import { Button, Dialog, Table } from '../../../web/ui';
import type { Column } from '../../../web/ui';
import { copy } from '../copy';
import layout from '../layout.json';
import { Notice, Sections, launchFields, useLaunchPicker } from './common';
import { REVIEW_OPERATION } from './ReviewChat';
import { setupHelp, startsHelp } from './help';

export const DISCOVER_OPERATION = 'journal-discover';
import { jget, jpost } from './useJournal';

export interface Options {
  channels: string[];
  concepts: { value: string; label: string; number: number; entry: string | null }[];
  entries: { value: string; label: string }[];
  rejected: { value: string; label: string }[];
}

/** Parameters the Journal view fills itself; they never appear as inputs. */
const HIDDEN = new Set(['state', 'unattended']);

function ParamField({ p, value, onChange, options, opId }: { p: OperationDef['params'][number]; value: string; onChange: (v: string) => void; options: Options | null; opId: string }) {
  const id = `jp-${p.name}`;
  let choices: { value: string; label: string }[] | null = null;
  let placeholder = '';
  if (p.type === 'select' && p.options) choices = p.options.map((o) => ({ value: o, label: o }));
  else if (p.name === 'concept' && options) {
    choices = options.concepts.map((c) => ({ value: c.value, label: `${c.number} · ${c.label}` }));
    placeholder = copy.operations.chooseConcept;
  } else if (p.name === 'entry' && options) {
    choices = opId === 'journal-reopen' ? options.rejected : options.entries;
    placeholder = opId === 'journal-reopen' ? copy.operations.chooseRejected : copy.operations.chooseEntry;
  }
  return (
    <div class="field">
      <label for={id}>
        {p.label}
        {p.required ? ' *' : ''}
      </label>
      {choices ? (
        <select id={id} class="select" value={value} onChange={(e) => onChange((e.target as HTMLSelectElement).value)}>
          <option value="">{placeholder || 'Choose'}</option>
          {choices.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      ) : p.name === 'payload' || p.name === 'brief' || p.name === 'notes' ? (
        <textarea id={id} class="input j-textarea" rows={4} value={value} onInput={(e) => onChange((e.target as HTMLTextAreaElement).value)} />
      ) : (
        <input id={id} class="input" value={value} onInput={(e) => onChange((e.target as HTMLInputElement).value)} />
      )}
    </div>
  );
}

/** Launch dialog for one Journal operation: parameters, runner, permission, and the exact prompt as a preview. */
export function LaunchDialog({ def, options, preset = {}, onClose }: { def: OperationDef; options: Options | null; preset?: Record<string, string>; onClose: () => void }) {
  const [params, setParams] = useState<Record<string, string>>(preset);
  const { choice, picker, ready } = useLaunchPicker(def.id);
  const [preview, setPreview] = useState('');
  const [edited, setEdited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const shown = def.params.filter((p) => !HIDDEN.has(p.name));
  const missing = def.params.filter((p) => p.required && !(params[p.name] ?? '').trim());
  const body = () => ({ operation: def.id, params, ...launchFields({ ...choice, runner: choice.runner || def.runner }) });
  const launchBody = () => ({ ...body(), ...(edited && preview.trim() ? { prompt: preview } : {}) });

  const showPreview = async (): Promise<void> => {
    setError('');
    try {
      setPreview((await jpost<{ text: string }>('/preview', body())).text);
      setEdited(false);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const launch = async (): Promise<void> => {
    setBusy(true);
    setError('');
    try {
      const t = await jpost<{ id: string }>('/launch', launchBody());
      onClose();
      navigate(buildUrl('operations', ['terminals', t.id]));
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <Dialog
      title={def.title}
      onClose={onClose}
      wide={Boolean(preview)}
      footer={
        <>
          <Button
            variant="ghost"
            help={preview ? 'Hides the instructions the agent will receive. Any edits you made to them are kept until you close this window.' : 'Shows the exact instructions the agent will receive, so you can read and edit them before starting. Nothing starts yet.'}
            onClick={() => (preview ? setPreview('') : void showPreview())}
            disabled={Boolean(missing.length)}
          >
            {preview ? copy.operations.hidePreview : copy.operations.preview}
          </Button>
          <Button variant="ghost" help="Closes this window without starting anything." onClick={onClose}>
            {copy.operations.cancel}
          </Button>
          <Button variant="primary" disabled={busy || missing.length > 0 || !ready} help={startsHelp(def.id, def.title)} onClick={() => void launch()}>
            {copy.operations.launch}
          </Button>
        </>
      }
    >
      <form
        class="stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy && !missing.length) void launch();
        }}
      >
        {shown.map((p) => (
          <ParamField key={p.name} p={p} opId={def.id} options={options} value={params[p.name] ?? ''} onChange={(v) => setParams((s) => ({ ...s, [p.name]: v }))} />
        ))}
        {picker}
        {error && (
          <p role="alert" style="color:var(--error)">
            {error}
          </p>
        )}
      </form>
      {preview && (
        <textarea
          class="input j-prompt"
          rows={18}
          aria-label="Rendered prompt (edit before launching)"
          value={preview}
          onInput={(e) => {
            setPreview((e.target as HTMLTextAreaElement).value);
            setEdited(true);
          }}
        />
      )}
    </Dialog>
  );
}

export function useJournalOps(): { ops: OperationDef[]; options: Options | null; error: string } {
  const [ops, setOps] = useState<OperationDef[]>([]);
  const [options, setOptions] = useState<Options | null>(null);
  const [error, setError] = useState('');
  const version = wikiChanged.value.n;
  useEffect(() => {
    api.operations('journal').then(setOps, (e: Error) => setError(e.message));
    jget<Options>('/options').then(setOptions, (e: Error) => setError(e.message));
  }, [version]);
  return { ops, options, error };
}

/** Discovery from the browser: one journal-discover session (ingest, source, recommend, register) with its parameters and prompt preview. */
export function DiscoverButton() {
  const { ops, options } = useJournalOps();
  const [open, setOpen] = useState(false);
  const def = ops.find((o) => o.id === DISCOVER_OPERATION);
  return (
    <>
      <Button variant="secondary" disabled={!def} help={def ? setupHelp(def.id, def.title) : 'This job is not available right now, so the button does nothing.'} onClick={() => setOpen(true)}>
        {copy.operations.discover}
      </Button>
      {open && def && <LaunchDialog def={def} options={options} onClose={() => setOpen(false)} />}
    </>
  );
}

export function OperationsView() {
  const { ops, options, error } = useJournalOps();
  const [active, setActive] = useState<OperationDef | null>(null);
  const columns: Column<OperationDef>[] = [
    { key: 'op', header: copy.operations.columns.operation, render: (o) => o.title, sort: (a, b) => a.title.localeCompare(b.title) },
    { key: 'runner', header: copy.operations.columns.runner, render: (o) => o.runner },
    { key: 'skill', header: copy.operations.columns.skill, render: (o) => o.skill ?? '' },
    {
      key: 'launch',
      header: copy.operations.columns.launch,
      align: 'actions',
      render: (o) => (
        <Button small variant="primary" aria-label={`${copy.operations.launch} ${o.title}`} help={setupHelp(o.id, o.title)} onClick={() => setActive(o)}>
          {copy.operations.launch}
        </Button>
      ),
    },
  ];
  // The review chat's procedure launches from a candidate or entry page, not from this list.
  const group = (isColumn: boolean): OperationDef[] => ops.filter((o) => o.id !== REVIEW_OPERATION && o.id.startsWith('llm-column-') === isColumn);
  return (
    <>
      {error && (
        <p role="alert" style="color:var(--error)">
          {error}
        </p>
      )}
      <Sections
        order={layout.operations}
        map={{
          journal: () => (
            <>
              <h2>{copy.operations.journal}</h2>
              <Table columns={columns} rows={group(false)} rowKey={(o) => o.id} empty={copy.operations.empty} />
            </>
          ),
          column: () => (
            <>
              <h2>{copy.operations.column}</h2>
              <Table columns={columns} rows={group(true)} rowKey={(o) => o.id} empty={copy.operations.empty} />
            </>
          ),
        }}
      />
      {active && <LaunchDialog def={active} options={options} onClose={() => setActive(null)} />}
    </>
  );
}
