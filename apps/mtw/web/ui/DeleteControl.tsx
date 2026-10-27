// The Delete button every item view shares (Matt, 2026-10-11). Clicking it starts the shared operations-delete-item
// procedure in an ordinary Operations terminal; nothing is deleted from the browser. The run asks Matt to confirm the
// exact file plan in that terminal. While it runs the item's panel is disabled; when the item leaves the module's data
// the panel disappears; if the run ends with the item still there the panel re-enables with a note.
import { signal } from '@preact/signals';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { TerminalInfo } from '../../modules/types';
import { api } from '../api';
import { DELETE_MODULE, DELETE_OPERATION, deleteBusy, deleteParams, deletePhase, deleteRunFor } from '../delete';
import type { DeleteKind, DeletePhase } from '../delete';
import { Link } from '../shell/Link';
import { buildUrl } from '../shell/route';
import { terminals, useWikiChanged } from '../state';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { LaunchPicker } from './LaunchConfirm';
import type { LaunchArgs } from './LaunchConfirm';
import './delete.css';

export interface DeleteOptions {
  kind: DeleteKind;
  /** From `deleteSubject`: how the run is found again in the terminals list. */
  subject: string;
  /** The exact item, as the agent should read it (a ref or id). */
  target: string;
  /** Canonical files Studio already knows for the item, if any. */
  paths?: string[];
  /** Whether the item is still in the module's data (default true: the view unmounts when it is gone). */
  present?: boolean;
  /** Refetch the module's data; called when the run exits and on matching file changes while it runs. */
  onSettle: () => unknown;
}

export interface DeleteHandle {
  phase: DeletePhase;
  busy: boolean;
  run: TerminalInfo | undefined;
  options: DeleteOptions;
  error: string;
  launch: (args: LaunchArgs | null) => Promise<void>;
  dismiss: () => void;
  /** Attach to the item's panel element. */
  ref: (el: HTMLElement | null) => void;
  /** Add to the panel's class list. */
  zoneClass: string;
  /** Spread onto the panel element. */
  zoneAttrs: { 'aria-disabled'?: 'true'; 'aria-busy'?: 'true'; 'data-delete': DeletePhase };
}

// Per page session, shared by every instance: a remount (a view that refetches by clearing its data) must not
// re-check a run whose exit was already followed by a refetch, or forget a dismissed note.
const checkedRuns = signal<ReadonlySet<string>>(new Set());
const dismissedRuns = signal<ReadonlySet<string>>(new Set());
const add = (s: typeof checkedRuns, id: string): void => {
  if (!s.value.has(id)) s.value = new Set([...s.value, id]);
};

const CONTROLS = 'button, input, select, textarea, a[href], [tabindex]';

/** Disable every control in `el` except the delete controls; returns the undo. */
function lockControls(el: HTMLElement): () => void {
  const undo: (() => void)[] = [];
  el.querySelectorAll<HTMLElement>(CONTROLS).forEach((c) => {
    if (c.closest('.del-ctl')) return;
    if (c instanceof HTMLButtonElement || c instanceof HTMLInputElement || c instanceof HTMLSelectElement || c instanceof HTMLTextAreaElement) {
      if (c.disabled) return;
      c.disabled = true;
      undo.push(() => (c.disabled = false));
    } else {
      const prev = c.getAttribute('tabindex');
      c.setAttribute('tabindex', '-1');
      undo.push(() => (prev === null ? c.removeAttribute('tabindex') : c.setAttribute('tabindex', prev)));
    }
  });
  return () => undo.forEach((fn) => fn());
}

export function useDelete(options: DeleteOptions): DeleteHandle {
  const [launched, setLaunched] = useState<TerminalInfo | undefined>(undefined);
  const [error, setError] = useState('');
  const [el, setEl] = useState<HTMLElement | null>(null);
  const settle = useRef(options.onSettle);
  settle.current = options.onSettle;

  const listed = deleteRunFor(terminals.value, options.subject);
  // Until the SSE terminal list catches up, the launch response stands in for the run.
  const run = listed ?? (launched?.subject === options.subject ? launched : undefined);
  const checked = run && checkedRuns.value.has(run.id) ? run.id : undefined;
  const dismissed = run && dismissedRuns.value.has(run.id) ? run.id : undefined;
  const phase = deletePhase({ run, present: options.present ?? true, checkedRunId: checked, dismissedRunId: dismissed });
  const busy = deleteBusy(phase);

  useEffect(() => {
    if (phase !== 'checking' || !run) return;
    const id = run.id;
    void Promise.resolve()
      .then(() => settle.current())
      .catch(() => undefined)
      .finally(() => add(checkedRuns, id));
  }, [phase, run?.id]);

  useWikiChanged(DELETE_MODULE[options.kind], () => {
    if (busy) void Promise.resolve(settle.current()).catch(() => undefined);
  });

  useEffect(() => (el && busy ? lockControls(el) : undefined), [el, busy]);

  const launch = async (args: LaunchArgs | null): Promise<void> => {
    setError('');
    try {
      const params = deleteParams(options.kind, options.subject, options.target, options.paths);
      if (!args) throw new Error('The agent choices are still loading; try again in a moment.');
      const t = await api.launch(DELETE_OPERATION, params, args[0], args[1] === 'default' ? undefined : args[1], args[2]);
      setLaunched(t);
    } catch (e) {
      setError((e as Error).message);
      throw e;
    }
  };

  return {
    phase,
    busy,
    run,
    options,
    error,
    launch,
    dismiss: () => run && add(dismissedRuns, run.id),
    ref: setEl,
    zoneClass: busy ? 'del-zone del-zone--busy' : 'del-zone',
    zoneAttrs: { ...(busy ? { 'aria-disabled': 'true' as const, 'aria-busy': 'true' as const } : {}), 'data-delete': phase },
  };
}

const KIND_NOUN: Record<DeleteKind, string> = {
  image: 'image version',
  track: 'track',
  journal: 'Journal entry',
  comic: 'comic issue',
  'comic-page': 'comic page',
  'comic-box': 'comic box',
};

/** The button, the "Deleting…" badge and the "did not complete" note for one item. Place it inside the item's panel. */
export function DeleteControl({ del, label = 'Delete', small = true, statusOnly = false }: { del: DeleteHandle; label?: string; small?: boolean; /** Show only the badge or note, no button (a second place showing the same item). */ statusOnly?: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [starting, setStarting] = useState(false);
  const [args, setArgs] = useState<LaunchArgs | null>(null);
  const { phase, run, options } = del;
  const noun = KIND_NOUN[options.kind];
  const terminalHref = run ? buildUrl('operations', ['terminals', run.id]) : '';

  const start = async (): Promise<void> => {
    setStarting(true);
    try {
      await del.launch(args);
      setConfirming(false);
    } catch {
      // del.error is shown in the dialog.
    } finally {
      setStarting(false);
    }
  };

  if (phase === 'gone' || (statusOnly && (phase === 'idle' || phase === 'failed'))) return null;
  return (
    <span class="del-ctl">
      {phase === 'deleting' || phase === 'checking' ? (
        <Link class="badge badge--running del-badge" href={terminalHref} role="status" title={`Opens the terminal where this ${noun} is being deleted, so you can follow it or answer its confirmation question.`}>
          {phase === 'deleting' ? 'Deleting… open terminal' : 'Checking…'}
        </Link>
      ) : (
        <Button small={small} variant="danger" aria-label={`${label} ${noun} ${options.target}`} help={`Asks you to confirm first, then opens a terminal where an agent lists exactly which files and records belong to this ${noun}. Nothing is removed until you type your confirmation in that terminal.`} onClick={() => setConfirming(true)}>
          {label}
        </Button>
      )}
      {phase === 'failed' && run && (
        <span class="del-failed" role="status">
          Delete did not complete{typeof run.exitCode === 'number' ? ` (exit ${run.exitCode})` : ''}.{' '}
          <Link href={terminalHref}>View terminal</Link>{' '}
          <button type="button" class="del-dismiss" title="Hides this note. The item was not deleted and nothing else changes." onClick={del.dismiss}>
            Dismiss
          </button>
        </span>
      )}
      {confirming && (
        <Dialog
          title={`Delete ${noun}`}
          onClose={() => setConfirming(false)}
          footer={
            <>
              <Button variant="ghost" help="Closes this window. Nothing is deleted." onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button variant="danger" disabled={starting || !args} help={`Opens a terminal where an agent works out exactly what belongs to this ${noun}. It removes nothing until you type your confirmation there.`} onClick={() => void start()}>
                Start delete run
              </Button>
            </>
          }
        >
          <div class="stack">
            <code class="del-target">{options.target}</code>
            <LaunchPicker operation={DELETE_OPERATION} onChoice={setArgs} idPrefix="del" />
            <p>
              This opens an Operations terminal. The agent lists the exact files, catalog records and references it would remove, stops if anything else uses this {noun}, and removes nothing until you type the confirmation in that terminal.
            </p>
            <p class="muted">This panel stays disabled while the run is open and disappears once the {noun} is gone.</p>
            {del.error && (
              <p role="alert" class="del-error">
                {del.error}
              </p>
            )}
          </div>
        </Dialog>
      )}
    </span>
  );
}
