// New (Matt, 2026-10-11). The Remove confirm dialog: shows what will be archived outside the repo (count and total size)
// and what is kept because it is in use. Matt's click on Remove is the approval; Studio then moves the files itself.
import { useEffect, useState } from 'preact/hooks';
import { Button } from '../../../web/ui/Button';
import { Dialog } from '../../../web/ui/Dialog';
import { bytesLabel } from '../shared/filter';
import { useHost } from './host';
import type { RemovePlan, RemoveRequest, RemoveResult } from './host';

/** Remove is offered in the app only (not the static snapshot, not a picker). */
export const canRemove = (host: ReturnType<typeof useHost>): boolean => host.mode === 'app' && !host.pick && Boolean(host.data.remove && host.data.planRemove);

const plural = (n: number, word: string): string => `${n.toLocaleString('en-US')} ${word}${n === 1 ? '' : 's'}`;

export function RemoveDialog({ request, label, onClose, onDone }: { request: RemoveRequest; label: string; onClose: () => void; onDone: (result: RemoveResult) => void }) {
  const host = useHost();
  const [plan, setPlan] = useState<RemovePlan | null>(null);
  const [result, setResult] = useState<RemoveResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    host.data.planRemove?.(request).then(
      (p) => live && setPlan(p),
      (e: Error) => live && setError(e.message),
    );
    return () => {
      live = false;
    };
  }, []);

  const removing = plan?.items.filter((i) => i.action === 'remove') ?? [];
  const kept = (result ? result.kept : plan?.items.filter((i) => i.action === 'keep')) ?? [];

  const submit = async (): Promise<void> => {
    if (!plan) return;
    setBusy(true);
    setError('');
    try {
      const r = (await host.data.remove?.({ ...request, etag: plan.etag })) as RemoveResult;
      setResult(r);
      if (r.error && !r.removed) setError(r.error);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const close = (): void => (result ? onDone(result) : onClose());
  const footer = result ? (
    <Button variant="primary" help="Closes this window. The removal has already happened." onClick={close}>
      Done
    </Button>
  ) : (
    <>
      <Button variant="ghost" help="Closes this window. Nothing is removed." onClick={onClose}>
        Cancel
      </Button>
      <Button variant="danger" disabled={busy || !plan || Boolean(plan.blocked) || !plan.remove} help="Archives the listed files outside the repo, checks each copy, then deletes them from the repo and drops them from the catalog. They can be restored from the archive record." onClick={() => void submit()}>
        {busy ? 'Removing' : plan?.remove ? `Remove ${plural(plan.remove, 'file')}` : 'Remove'}
      </Button>
    </>
  );

  return (
    <Dialog title={`Remove ${label}`} onClose={close} footer={footer} wide>
      <div class="stack img-remove">
        {!plan && !error && <p class="muted">Checking which files are in use.</p>}
        {plan && !result && (
          <>
            <p class="img-remove-summary">
              {plan.remove ? (
                <>
                  <strong>{plural(plan.remove, 'file')}</strong>, <strong>{bytesLabel(plan.removeBytes)}</strong>, will be archived to <code>{plan.archiveDir}</code>, checked by sha256, deleted from the
                  repo and dropped from the catalog. They can be restored from the archive record.
                </>
              ) : (
                'Nothing here can be removed.'
              )}
            </p>
            {plan.blocked && (
              <p role="alert" class="img-error">
                {plan.blocked}
              </p>
            )}
            {removing.length > 0 && (
              <details open={removing.length <= 8}>
                <summary>{plural(removing.length, 'file')} to remove</summary>
                <ul class="img-remove-list">
                  {removing.map((i) => (
                    <li key={i.path}>
                      <code>{i.path}</code> <span class="muted">{bytesLabel(i.bytes)}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        )}
        {result && (
          <p class="img-remove-summary" role="status">
            {result.removed ? `Removed ${plural(result.removed, 'file')} (${bytesLabel(result.removedBytes)}).` : 'Nothing was removed.'}
            {result.archiveRecord && (
              <>
                {' '}
                Archive record: <code>{result.archiveRecord}</code>
              </>
            )}
          </p>
        )}
        {result && result.failed.length > 0 && (
          <ul class="img-remove-list img-error">
            {result.failed.map((f) => (
              <li key={f.path}>
                <code>{f.path}</code>: {f.error}
              </li>
            ))}
          </ul>
        )}
        {kept.length > 0 && (
          <div>
            <h3 class="img-remove-head">Kept ({kept.length.toLocaleString('en-US')})</h3>
            <ul class="img-remove-list">
              {kept.map((i) => (
                <li key={i.path}>
                  <code>{i.path}</code> <span class="muted">{i.reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {error && (
          <p role="alert" class="img-error">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
}
