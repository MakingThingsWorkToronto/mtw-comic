import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { buildUrl } from '../../../web/shell/route';
import { navigate } from '../../../web/shell/router';
import { Button, Dialog } from '../../../web/ui';
import { copy } from '../copy';
import { useLaunchPicker } from './common';
import type { RunnerChoice } from './common';

export interface ActionResult {
  /** Terminal to open when the action launched an operation. */
  terminal?: { id: string } | null;
  error?: string;
}

interface Props {
  title: string;
  body: string;
  confirm: string;
  onClose: () => void;
  /** Called with the runner choice; throw or return { error } to stay open. */
  run: (choice: RunnerChoice) => Promise<ActionResult | void>;
  /** The procedure this dialog launches; its frontmatter models are the dialog's defaults. */
  operation?: string;
  /** False for decisions that launch nothing. */
  launches?: boolean;
  disabled?: boolean;
  /** Plain-English tooltip for the confirm button. */
  confirmHelp?: string;
  children?: ComponentChildren;
}

/** One confirm step for a decision (and the recorder it launches). Nothing happens until the button is pressed. */
export function ActionDialog({ title, body, confirm, onClose, run, operation, launches = true, disabled, confirmHelp, children }: Props) {
  const { choice, picker, ready } = useLaunchPicker(operation ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const go = async (): Promise<void> => {
    setBusy(true);
    setError('');
    try {
      const r = await run(choice);
      if (r && r.error) {
        setError(r.error);
        setBusy(false);
        return;
      }
      onClose();
      if (r && r.terminal) navigate(buildUrl('operations', ['terminals', r.terminal.id]));
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
          <Button variant="ghost" help="Closes this window. Nothing is recorded or started." onClick={onClose}>{copy.operations.cancel}</Button>
          <Button variant="primary" disabled={busy || disabled || (launches && Boolean(operation) && !ready)} help={confirmHelp ?? (launches ? 'Records your decision, then opens a terminal where an agent writes it into the files. The runner you picked decides which agent does it.' : 'Records your decision. Nothing else starts.')} onClick={() => void go()}>{confirm}</Button>
        </>
      }
    >
      <p class="muted">{body}</p>
      {children}
      {launches && picker}
      {error && <p role="alert" style="color:var(--error)">{error}</p>}
    </Dialog>
  );
}
