// The Add form every library shares (Matt, 2026-10-11). `ResourceForm` renders a structured field list from a spec in
// web/addResource.ts; `AddResourceButton` puts it in a Dialog and launches the chosen procedure in an Operations terminal.
// The launched agent shows its plan and waits for Matt's yes there before any paid request or library write.
import { useMemo, useState } from 'preact/hooks';
import { api } from '../api';
import { ADD_SPECS, buildAddLaunch, initialValues, modeOf, validateAdd } from '../addResource';
import type { AddField, AddKind, AddMode } from '../addResource';
import { buildUrl } from '../shell/route';
import { navigate } from '../shell/router';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { LaunchPicker } from './LaunchConfirm';
import type { LaunchArgs } from './LaunchConfirm';
import './resource.css';

type Choices = Partial<Record<string, readonly string[]>>;

export interface ResourceFormProps {
  /** Prefix for element ids, unique on the page. */
  idPrefix: string;
  fields: readonly AddField[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
  /** Shown only for fields listed here (after a launch attempt or once a field was left). */
  errors: Record<string, string>;
  /** Overrides a select's choices, e.g. a module's live collection list. */
  options?: Choices;
  onBlur?: (name: string) => void;
}

/** A structured field list: label, control, hint and error for each field, in spec order. */
export function ResourceForm({ idPrefix, fields, values, onChange, errors, options = {}, onBlur }: ResourceFormProps) {
  return (
    <div class="rf-fields">
      {fields.map((f) => {
        const id = `${idPrefix}-${f.name}`;
        const value = values[f.name] ?? '';
        const err = errors[f.name];
        const described = [f.hint ? `${id}-hint` : '', err ? `${id}-err` : ''].filter(Boolean).join(' ') || undefined;
        const common = {
          id,
          name: f.name,
          'aria-invalid': err ? ('true' as const) : undefined,
          'aria-describedby': described,
          'aria-required': f.required ? ('true' as const) : undefined,
          onBlur: () => onBlur?.(f.name),
        };
        const choices = options[f.name] ?? f.options ?? [];
        return (
          <div class={`field rf-field${f.control === 'textarea' ? ' rf-field--wide' : ''}`} key={f.name}>
            <label for={id}>
              {f.label}
              {f.required ? <span aria-hidden="true"> *</span> : null}
            </label>
            {f.control === 'select' ? (
              <select {...common} class="select" value={value} onChange={(e) => onChange(f.name, (e.target as HTMLSelectElement).value)}>
                {!f.initial && <option value="">Choose</option>}
                {choices.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : f.control === 'textarea' ? (
              <textarea {...common} class="input rf-textarea" rows={3} placeholder={f.placeholder} value={value} onInput={(e) => onChange(f.name, (e.target as HTMLTextAreaElement).value)} />
            ) : (
              <input {...common} class="input" placeholder={f.placeholder} maxLength={f.maxLength} value={value} onInput={(e) => onChange(f.name, (e.target as HTMLInputElement).value)} />
            )}
            {f.hint && (
              <span class="hint" id={`${id}-hint`}>
                {f.hint}
              </span>
            )}
            {err && (
              <span class="error" id={`${id}-err`}>
                {err}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** The Add button for one library: opens the structured form and launches its procedure in a terminal. */
export function AddResourceButton({ kind, options, label, small = true, variant = 'primary', help }: { kind: AddKind; options?: Choices; label?: string; small?: boolean; variant?: 'primary' | 'secondary' | 'ghost'; help?: string }) {
  const spec = ADD_SPECS[kind];
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button small={small} variant={variant} help={help ?? `Opens the "${spec.title}" form where you describe what you want. Nothing is created until you press Open terminal in it.`} onClick={() => setOpen(true)}>
        {label ?? spec.button}
      </Button>
      {open && <AddResourceDialog kind={kind} options={options ?? {}} onClose={() => setOpen(false)} />}
    </>
  );
}

function AddResourceDialog({ kind, options, onClose }: { kind: AddKind; options: Choices; onClose: () => void }) {
  const spec = ADD_SPECS[kind];
  const [modeId, setModeId] = useState(spec.modes[0]?.id ?? '');
  const mode: AddMode = modeOf(kind, modeId);
  const [byMode, setByMode] = useState<Record<string, Record<string, string>>>({});
  const values = byMode[mode.id] ?? initialValues(mode);
  const [shown, setShown] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [args, setArgs] = useState<LaunchArgs | null>(null);
  const errors = useMemo(() => validateAdd(mode, values, options), [mode, values, options]);
  const visible = Object.fromEntries(Object.entries(errors).filter(([k]) => shown.has(k)));
  const idPrefix = `add-${kind}-${mode.id}`;

  const change = (name: string, value: string): void => setByMode((all) => ({ ...all, [mode.id]: { ...values, [name]: value } }));

  const launch = async (): Promise<void> => {
    setShown(new Set(mode.fields.map((f) => f.name)));
    if (Object.keys(errors).length) {
      const first = mode.fields.find((f) => errors[f.name]);
      if (first) document.getElementById(`${idPrefix}-${first.name}`)?.focus();
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { operation, params } = buildAddLaunch(kind, mode.id, values, options);
      if (!args) throw new Error('The agent choices are still loading; try again in a moment.');
      const t = await api.launch(operation, params, args[0], args[1] === 'default' ? undefined : args[1], args[2]);
      onClose();
      navigate(buildUrl('operations', ['terminals', t.id]));
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <Dialog
      title={spec.title}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" help="Closes this form without starting anything. What you typed is discarded." onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={busy || !args} help={`Opens a terminal where an agent reads your request, checks the library for something reusable and shows its plan. It waits for your yes there before it writes anything${mode.paid ? ' or makes any paid request' : ''}.`} onClick={() => void launch()}>
            {busy ? 'Opening…' : 'Open terminal'}
          </Button>
        </>
      }
    >
      <form
        class="stack rf-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) void launch();
        }}
      >
        {spec.modes.length > 1 && (
          <fieldset class="rf-modes">
            <legend class="sr-only">What to do</legend>
            {spec.modes.map((m) => (
              <label key={m.id} class={`rf-mode${m.id === mode.id ? ' rf-mode--on' : ''}`}>
                <input type="radio" name={`add-${kind}-mode`} value={m.id} checked={m.id === mode.id} onChange={() => setModeId(m.id)} />
                {m.label}
              </label>
            ))}
          </fieldset>
        )}
        <p class="rf-summary">{mode.summary}</p>
        <ResourceForm idPrefix={idPrefix} fields={mode.fields} values={values} onChange={change} errors={visible} options={options} onBlur={(n) => setShown((s) => (s.has(n) ? s : new Set([...s, n])))} />
        <LaunchPicker key={mode.operation} operation={mode.operation} onChoice={setArgs} idPrefix={`${idPrefix}-lc`} />
        <p class="rf-note">
          Opens an Operations terminal. The agent checks for something reusable, shows its plan{mode.paid ? ', destinations and cost' : ' and destinations'}, and waits for your <strong>yes</strong> there before {mode.paid ? 'any paid request or ' : ''}any write to the library. It never approves, commits or pushes.
        </p>
        {error && (
          <p class="error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" hidden />
      </form>
    </Dialog>
  );
}
