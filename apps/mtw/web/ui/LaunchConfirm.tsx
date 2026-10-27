import { useEffect, useMemo, useState } from 'preact/hooks';
import type { OperationDef } from '../../modules/types';
import { api } from '../api';
import type { RunnerOption } from '../api';
import { buildUrl } from '../shell/route';
import { navigate } from '../shell/router';
import type { ComponentChildren } from 'preact';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { defaultsFor, launchSummary, noBypass } from './launchChoice';
import type { LaunchChoice } from './launchChoice';

export { defaultsFor, launchSummary };
export type { LaunchChoice };

/**
 * The confirm control every LLM launch shows: provider, model, effort (reasoning) and permission.
 * Defaults come from the procedure's `models:` frontmatter for the chosen provider and switch when the provider changes.
 * An empty model/effort means "no entry": the launcher then falls back to Operations > Defaults.
 */
export interface LaunchChoiceState {
  choice: LaunchChoice;
  setChoice: (next: LaunchChoice) => void;
  /** The provider list (the plain shell is never offered), once loaded. */
  runners: RunnerOption[];
  /** The procedure's definition, once loaded. */
  def?: OperationDef;
  /** False until the providers have loaded and (for a procedure) its own defaults have been applied. */
  ready: boolean;
  /** The trailing arguments for `api.launch`: (runner, permission, { model, effort }). */
  args: () => LaunchArgs;
}

/** The trailing arguments for `api.launch`: provider, permission and the model/effort Matt confirmed (absent = procedure default). */
export type LaunchArgs = [runner: string, permission: string, choice: { model?: string; effort?: string }];

/**
 * Hook for callers: give it an operation id and it loads the procedure and the providers and returns the choice state.
 * `forceRunner` starts on that provider instead of the procedure's own.
 */
export function useLaunchChoice(operationId: string | undefined, forceRunner?: string, initial?: Partial<LaunchChoice>): LaunchChoiceState {
  const [def, setDef] = useState<OperationDef | undefined>();
  const [runners, setRunners] = useState<RunnerOption[]>([]);
  const [choice, setChoiceState] = useState<LaunchChoice>({ runner: forceRunner ?? initial?.runner ?? 'claude', model: initial?.model ?? '', effort: initial?.effort ?? '', permission: initial?.permission ?? 'default' });
  const [touched, setTouched] = useState(false);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    let live = true;
    api.runners().then((r) => live && setRunners(r.filter((x) => x.id !== 'shell')), () => undefined);
    return () => { live = false; };
  }, []);
  useEffect(() => {
    let live = true;
    setDef(undefined);
    setSeeded(false);
    if (!operationId) return undefined;
    api.operations().then((all) => live && setDef(all.find((d) => d.id === operationId)), () => undefined);
    return () => { live = false; };
  }, [operationId]);
  // Once the procedure arrives, start from its own provider and that provider's entry (unless the caller already chose).
  useEffect(() => {
    if (!def || touched) return;
    const runner = forceRunner ?? def.runner;
    setChoiceState({ runner, ...defaultsFor(def, runner), permission: initial?.permission ?? 'default' });
    setSeeded(true);
  }, [def, forceRunner, touched]);

  const setChoice = (next: LaunchChoice): void => {
    setTouched(true);
    setChoiceState(next);
  };
  const args = (): LaunchArgs => [
    choice.runner,
    choice.permission,
    { ...(choice.model ? { model: choice.model } : {}), ...(choice.effort ? { effort: choice.effort } : {}) },
  ];
  // Never ready before the provider list is in and the procedure's own defaults are applied: nothing launches on a guess.
  const ready = runners.length > 0 && (!operationId || (!!def && (seeded || touched)));
  return { choice, setChoice, runners, def, ready, args };
}

/** Provider, Model, Effort (reasoning) and Permission selects with a one-line summary. Bypass options are never offered. */
export function LaunchConfirm({ state, idPrefix = 'lc', lockRunner = false }: { state: LaunchChoiceState; idPrefix?: string; /** The provider is fixed (Resume continues the original conversation). */ lockRunner?: boolean }) {
  const { choice, setChoice, runners, def } = state;
  const runner = runners.find((r) => r.id === choice.runner);
  const models = runner?.models ?? [];
  const efforts = runner?.efforts ?? [];
  const perms = (runner?.permissions ?? []).filter((p) => noBypass(p.id));
  const summary = useMemo(() => launchSummary(choice, runners), [choice, runners]);
  const onRunner = (id: string): void => setChoice({ runner: id, ...defaultsFor(def, id), permission: 'default' });
  // A model the procedure names stays selectable even if it is missing from the list (never silently swapped).
  const modelOptions = choice.model && !models.some((m) => m.id === choice.model) ? [...models, { id: choice.model, label: choice.model }] : models;
  const grid = { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3, 12px)' } as const;
  return (
    <div class="launch-confirm" data-testid="launch-confirm">
      <div style={grid}>
        <div class="field">
          <label for={`${idPrefix}-provider`}>Provider</label>
          <select id={`${idPrefix}-provider`} class="select" value={choice.runner} disabled={lockRunner} title="Chooses which agent program does the work in the terminal, for example Claude or Codex. Changing it resets the model and effort to this procedure's default for that provider." aria-description="Chooses which agent program does the work." onChange={(e) => onRunner((e.target as HTMLSelectElement).value)}>
            {runners.length ? runners.map((r) => <option key={r.id} value={r.id}>{r.label}</option>) : <option value={choice.runner}>{choice.runner}</option>}
          </select>
        </div>
        {models.length > 0 && (
          <div class="field">
            <label for={`${idPrefix}-model`}>Model</label>
            <select id={`${idPrefix}-model`} class="select" value={choice.model} title="Chooses which model the agent thinks with. Bigger models write and judge better but cost more tokens; smaller ones are fine for routine recording and checks." aria-description="Chooses which model the agent uses." onChange={(e) => setChoice({ ...choice, model: (e.target as HTMLSelectElement).value })}>
              <option value="">Saved default (Operations &gt; Defaults)</option>
              {modelOptions.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
        )}
        {efforts.length > 0 && (
          <div class="field">
            <label for={`${idPrefix}-effort`}>Effort (reasoning)</label>
            <select id={`${idPrefix}-effort`} class="select" value={choice.effort} title="How long the agent thinks before it answers. Higher effort is slower and uses more tokens; lower effort suits simple, well-defined steps." aria-description="How much reasoning the agent does." onChange={(e) => setChoice({ ...choice, effort: (e.target as HTMLSelectElement).value })}>
              <option value="">Saved default (Operations &gt; Defaults)</option>
              {efforts.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
        )}
        {perms.length > 1 && (
          <div class="field">
            <label for={`${idPrefix}-perm`}>Permission</label>
            <select id={`${idPrefix}-perm`} class="select" value={choice.permission} title="Chooses how much the agent may do on its own before it has to ask you first." aria-description="Chooses how much the agent may do before asking." onChange={(e) => setChoice({ ...choice, permission: (e.target as HTMLSelectElement).value })}>
              {perms.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
        )}
      </div>
      <p data-testid="launch-summary" style={{ margin: 'var(--space-2, 8px) 0 0', color: 'var(--muted)', fontSize: 'var(--fs-small)' }}>{summary}</p>
    </div>
  );
}

/** The request body fields for a route that launches: provider, permission and the model/effort Matt confirmed. */
export function launchBody(args: LaunchArgs | null | undefined): { runner?: string; permission?: string; model?: string; effort?: string } {
  if (!args) return {};
  return { runner: args[0], permission: args[1], ...args[2] };
}

/**
 * A small confirm dialog for a button that launches a procedure with nothing else to ask: shows the confirm control,
 * runs `run` with the chosen arguments on Launch, and opens the terminal it returns.
 */
export function ConfirmLaunch({ operation, forceRunner, initial, lockRunner, title, body, confirm = 'Launch', confirmHelp, disabled, onClose, run, children }: {
  /** The procedure whose defaults are preselected; omit for a launch with no procedure (a New terminal, a Resume). */
  operation?: string;
  forceRunner?: string;
  initial?: Partial<LaunchChoice>;
  lockRunner?: boolean;
  title: string;
  body?: string;
  confirm?: string;
  confirmHelp?: string;
  disabled?: boolean;
  onClose: () => void;
  run: (args: LaunchArgs) => Promise<{ id: string } | void>;
  children?: ComponentChildren;
}) {
  const state = useLaunchChoice(operation, forceRunner, initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const go = async (): Promise<void> => {
    setBusy(true);
    setError('');
    try {
      const t = await run(state.args());
      onClose();
      if (t && t.id) navigate(buildUrl('operations', ['terminals', t.id]));
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };
  return (
    <Dialog
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" help="Closes this window without starting anything." onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={busy || disabled || !state.ready} help={confirmHelp ?? 'Opens a terminal where the chosen agent carries this out. You can follow it and answer its questions there.'} onClick={() => void go()}>{confirm}</Button>
        </>
      }
    >
      {body && <p class="muted">{body}</p>}
      {children}
      <LaunchConfirm state={state} idPrefix={`cl-${operation ?? 'terminal'}`} lockRunner={lockRunner} />
      {error && <p role="alert" style={{ color: 'var(--error)' }}>{error}</p>}
    </Dialog>
  );
}

/** The confirm control as a self-contained component for hosts that cannot call the hook: reports the choice upward. */
export function LaunchPicker({ operation, onChoice, idPrefix = 'lp', forceRunner, initial, lockRunner }: {
  /** The procedure whose frontmatter defaults are preselected; omit for a launch with no procedure (a plain terminal). */
  operation?: string;
  /** Reports the choice, or null until the providers and the procedure's defaults have loaded: callers disable their button on null. */
  onChoice: (args: LaunchArgs | null) => void;
  idPrefix?: string;
  forceRunner?: string;
  initial?: Partial<LaunchChoice>;
  lockRunner?: boolean;
}) {
  const state = useLaunchChoice(operation, forceRunner, initial);
  const key = `${state.ready}|${JSON.stringify(state.choice)}`;
  useEffect(() => onChoice(state.ready ? state.args() : null), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return <LaunchConfirm state={state} idPrefix={idPrefix} lockRunner={lockRunner} />;
}
