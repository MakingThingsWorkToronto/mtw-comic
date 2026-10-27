// New module (no wiki origin): the New workflow button and its structured form. It builds a linear workflow from
// ordered steps (a procedure from /api/operations, or a decision gate), checks it with the same schema and run checks
// the server uses, and saves wiki/workflows/<id>.json through POST /api/workflows/create (never an overwrite).
import { useEffect, useMemo, useState } from 'preact/hooks';
import type { OperationDef } from '../../types';
import { api } from '../../../web/api';
import { buildUrl } from '../../../web/shell/route';
import { navigate } from '../../../web/shell/router';
import { AssetField, Button, Dialog } from '../../../web/ui';
import { copy } from '../copy';
import { buildWorkflow, checkNewWorkflow, domainChoices, slugify } from '../lib/create';
import type { Draft, DraftStep } from '../lib/create';

const c = copy.create;

const blank = (): Draft => ({ title: '', id: '', domain: '', description: '', steps: [{ kind: 'operation', label: '', params: {}, ask: [] }] });

function ParamInput({ id, p, value, onChange }: { id: string; p: OperationDef['params'][number]; value: string; onChange: (v: string) => void }) {
  if (p.type === 'select' && p.options?.length) {
    return (
      <select id={id} class="select" value={value} onChange={(e) => onChange((e.target as HTMLSelectElement).value)}>
        <option value="">{c.choose}</option>
        {p.options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  return <input id={id} value={value} onInput={(e) => onChange((e.target as HTMLInputElement).value)} />;
}

function StepEditor({ step, index, count, ops, onChange, onMove, onRemove }: {
  step: DraftStep;
  index: number;
  count: number;
  ops: OperationDef[];
  onChange: (s: DraftStep) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const pre = `wf-new-s${index}`;
  const def = ops.find((o) => o.id === step.operation);
  const modules = useMemo(() => [...new Set(ops.map((o) => o.module))].sort(), [ops]);
  const setParam = (name: string, v: string) => onChange({ ...step, params: { ...(step.params ?? {}), [name]: v } });
  const toggleAsk = (name: string, on: boolean) => onChange({ ...step, ask: on ? [...(step.ask ?? []), name] : (step.ask ?? []).filter((n) => n !== name) });
  return (
    <li class="wf-new-step">
      <fieldset>
        <legend>{c.stepN(index + 1)}</legend>
        <div class="row wf-new-step-head">
          <div class="field">
            <label for={`${pre}-kind`}>{c.kind}</label>
            <select id={`${pre}-kind`} class="select" value={step.kind} onChange={(e) => onChange({ kind: (e.target as HTMLSelectElement).value as DraftStep['kind'], label: step.label, params: {}, ask: [] })}>
              <option value="operation">{c.kindOperation}</option>
              <option value="human-gate">{c.kindGate}</option>
            </select>
          </div>
          <div class="row wf-new-step-tools">
            <Button small variant="ghost" disabled={index === 0} aria-label={c.moveUpN(index + 1)} help="Moves this step one place earlier in the workflow. Nothing is saved until you save the workflow." onClick={() => onMove(-1)}>{c.up}</Button>
            <Button small variant="ghost" disabled={index === count - 1} aria-label={c.moveDownN(index + 1)} help="Moves this step one place later in the workflow. Nothing is saved until you save the workflow." onClick={() => onMove(1)}>{c.down}</Button>
            <Button small variant="ghost" disabled={count === 1} aria-label={c.removeN(index + 1)} help="Takes this step out of the workflow you are building. It is not saved or deleted anywhere else." onClick={onRemove}>{c.remove}</Button>
          </div>
        </div>
        {step.kind === 'operation' ? (
          <>
            <div class="field">
              <label for={`${pre}-op`}>{c.procedure} *</label>
              <select id={`${pre}-op`} class="select" value={step.operation ?? ''} onChange={(e) => onChange({ ...step, operation: (e.target as HTMLSelectElement).value, params: {}, ask: [] })}>
                <option value="">{c.choose}</option>
                {modules.map((m) => (
                  <optgroup label={m} key={m}>
                    {ops.filter((o) => o.module === m).map((o) => <option key={o.id} value={o.id}>{o.title} ({o.id})</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div class="field">
              <label for={`${pre}-label`}>{c.stepLabel}</label>
              <input id={`${pre}-label`} value={step.label} placeholder={def?.title ?? ''} onInput={(e) => onChange({ ...step, label: (e.target as HTMLInputElement).value })} />
            </div>
            {def && def.params.length > 0 && (
              <div class="wf-new-params">
                {def.params.map((p) => {
                  const pid = `${pre}-p-${p.name}`;
                  const asked = step.ask?.includes(p.name) ?? false;
                  const value = step.params?.[p.name] ?? '';
                  return (
                    <div class="field wf-new-param" key={p.name}>
                      {!asked && p.type === 'asset' && p.assetType ? (
                        <AssetField label={`${p.label || p.name}${p.required ? ' *' : ''}`} assetType={p.assetType} value={value} onChange={(v) => setParam(p.name, v)} />
                      ) : (
                        <>
                          <label for={pid}>{p.label || p.name}{p.required ? ' *' : ''}</label>
                          {asked ? <p class="muted wf-new-asked">{c.askedHint}</p> : <ParamInput id={pid} p={p} value={value} onChange={(v) => setParam(p.name, v)} />}
                        </>
                      )}
                      <label class="wf-new-check">
                        <input type="checkbox" checked={asked} onChange={(e) => toggleAsk(p.name, (e.target as HTMLInputElement).checked)} /> {c.ask}
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <div class="field">
              <label for={`${pre}-label`}>{c.gateLabel} *</label>
              <input id={`${pre}-label`} value={step.label} placeholder={c.gatePlaceholder} onInput={(e) => onChange({ ...step, label: (e.target as HTMLInputElement).value })} />
            </div>
            <div class="field">
              <label for={`${pre}-note`}>{c.gateNote}</label>
              <textarea id={`${pre}-note`} rows={2} value={step.note ?? ''} onInput={(e) => onChange({ ...step, note: (e.target as HTMLTextAreaElement).value })} />
            </div>
            <label class="wf-new-check">
              <input type="checkbox" checked={Boolean(step.noteRequired)} onChange={(e) => onChange({ ...step, noteRequired: (e.target as HTMLInputElement).checked })} /> {c.noteRequired}
            </label>
          </>
        )}
      </fieldset>
    </li>
  );
}

/** "New workflow" button plus its dialog. `existing` is the list's ids and domains. */
export function NewWorkflowButton({ existing }: { existing: { id: string; domain?: string }[] }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(blank);
  const [idEdited, setIdEdited] = useState(false);
  const [ops, setOps] = useState<OperationDef[] | null>(null);
  const [error, setError] = useState('');
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || ops) return;
    api.operations().then(setOps, (e: Error) => setError(`${c.opsFailed} ${e.message}`));
  }, [open, ops]);

  const opMap = useMemo(() => new Map((ops ?? []).map((o) => [o.id, o])), [ops]);
  const workflow = useMemo(() => buildWorkflow(draft, opMap), [draft, opMap]);
  const check = useMemo(() => {
    const own: string[] = [];
    if (!draft.title.trim()) own.push(c.needsTitle);
    if (!draft.id.trim()) own.push(c.needsId);
    draft.steps.forEach((s, i) => {
      if (s.kind === 'operation' && !s.operation) own.push(c.needsProcedure(i + 1));
      if (s.kind === 'human-gate' && !s.label.trim()) own.push(c.needsQuestion(i + 1));
    });
    if (own.length || !ops) return own;
    return checkNewWorkflow(workflow, { operations: opMap }, existing.map((e) => e.id)).problems;
  }, [draft, workflow, ops, opMap, existing]);
  const domains = useMemo(() => domainChoices(existing.map((e) => e.domain)), [existing]);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const setStep = (i: number, s: DraftStep) => setDraft((d) => ({ ...d, steps: d.steps.map((x, j) => (j === i ? s : x)) }));
  const move = (i: number, dir: -1 | 1) =>
    setDraft((d) => {
      const steps = [...d.steps];
      const [s] = steps.splice(i, 1);
      steps.splice(i + dir, 0, s as DraftStep);
      return { ...d, steps };
    });
  const close = () => setOpen(false); // the draft is kept until it is saved

  const save = async (): Promise<void> => {
    setTried(true);
    setError('');
    if (check.length) return;
    setBusy(true);
    try {
      const res = await fetch('/api/workflows/create', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ workflow }) });
      const body = (await res.json().catch(() => null)) as { id?: string; error?: string } | null;
      if (res.status === 404 && !body?.id && /not found/i.test(body?.error ?? 'not found')) return setError(c.needsRestart);
      if (!res.ok) return setError(body?.error ?? `${res.status} ${res.statusText}`);
      setOpen(false);
      setDraft(blank());
      setIdEdited(false);
      setTried(false);
      navigate(buildUrl('workflows', [body?.id ?? workflow.id]));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant="primary" help="Opens a form where you build a new workflow by adding steps one after another. Nothing is created until you save it." onClick={() => setOpen(true)}>{c.button}</Button>
      {open && (
        <Dialog
          title={c.title}
          wide
          onClose={close}
          footer={
            <>
              <Button variant="ghost" help="Closes the form and throws away what you typed. No workflow is created." onClick={close}>{copy.cancel}</Button>
              <Button variant="primary" help="Saves this workflow so it appears in the list and can be run. Saving does not run it." disabled={busy || !ops} onClick={() => void save()}>{busy ? c.saving : c.save}</Button>
            </>
          }
        >
          <p class="muted">{c.hint}</p>
          <form class="stack wf-new" onSubmit={(e) => { e.preventDefault(); void save(); }}>
            <div class="wf-new-grid">
              <div class="field">
                <label for="wf-new-title">{c.fields.title} *</label>
                <input id="wf-new-title" value={draft.title} onInput={(e) => { const title = (e.target as HTMLInputElement).value; set(idEdited ? { title } : { title, id: slugify(title) }); }} />
              </div>
              <div class="field">
                <label for="wf-new-id">{c.fields.id} *</label>
                <input id="wf-new-id" value={draft.id} aria-describedby="wf-new-id-hint" onInput={(e) => { setIdEdited(true); set({ id: (e.target as HTMLInputElement).value.toLowerCase() }); }} />
                <span class="hint" id="wf-new-id-hint">{c.fileHint(draft.id || '<id>')}</span>
              </div>
              <div class="field">
                <label for="wf-new-domain">{c.fields.domain}</label>
                <input id="wf-new-domain" list="wf-new-domains" value={draft.domain} aria-describedby="wf-new-domain-hint" onInput={(e) => set({ domain: (e.target as HTMLInputElement).value })} />
                <datalist id="wf-new-domains">{domains.map((d) => <option key={d} value={d} />)}</datalist>
                <span class="hint" id="wf-new-domain-hint">{c.domainHint}</span>
              </div>
              <div class="field wf-new-wide">
                <label for="wf-new-desc">{c.fields.description}</label>
                <textarea id="wf-new-desc" rows={2} value={draft.description} onInput={(e) => set({ description: (e.target as HTMLTextAreaElement).value })} />
              </div>
            </div>
            <h3 class="wf-new-h">{c.steps}</h3>
            {!ops && !error && <p class="muted">{copy.loading}</p>}
            {ops && (
              <ol class="wf-new-steps">
                {draft.steps.map((s, i) => (
                  <StepEditor
                    key={i}
                    step={s}
                    index={i}
                    count={draft.steps.length}
                    ops={ops}
                    onChange={(n) => setStep(i, n)}
                    onMove={(dir) => move(i, dir)}
                    onRemove={() => setDraft((d) => ({ ...d, steps: d.steps.filter((_, j) => j !== i) }))}
                  />
                ))}
              </ol>
            )}
            <div class="row">
              <Button small help="Adds a step that has an agent carry out one of the ready-made jobs. You pick which job after adding it." onClick={() => set({ steps: [...draft.steps, { kind: 'operation', label: '', params: {}, ask: [] }] })}>{c.addProcedure}</Button>
              <Button small help="Adds a step where the workflow stops and waits for you to approve or reject before going on." onClick={() => set({ steps: [...draft.steps, { kind: 'human-gate', label: '' }] })}>{c.addGate}</Button>
            </div>
            {tried && check.length > 0 && (
              <div class="wf-problems" role="alert">
                <strong>{c.fix}</strong>
                <ul>{check.map((p) => <li key={p}>{p}</li>)}</ul>
              </div>
            )}
            {error && <p role="alert" style="color:var(--error)">{error}</p>}
            <details class="wf-new-preview">
              <summary>{c.preview}</summary>
              <pre>{JSON.stringify(workflow, null, 2)}</pre>
            </details>
          </form>
        </Dialog>
      )}
    </>
  );
}
