import { useEffect, useState } from 'preact/hooks';
import type { OperationDef } from '../../types';
import { api } from '../../../web/api';
import { buildUrl } from '../../../web/shell/route';
import { navigate } from '../../../web/shell/router';
import { AssetField, Button, Dialog, LaunchConfirm, useLaunchChoice } from '../../../web/ui';

let cache: Promise<OperationDef[]> | null = null;
const defs = (): Promise<OperationDef[]> => (cache ??= api.operations('comics').catch((e) => ((cache = null), Promise.reject(e))));

/** The confirm dialog: any parameters not fixed by the caller, then provider / model / effort / permission. */
function OpDialog({ op, params, label, onClose }: { op: OperationDef; params: Record<string, string>; label?: string; onClose: () => void }) {
  const [extra, setExtra] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lc = useLaunchChoice(op.id);
  const ask = op.params.filter((p) => !(p.name in params));
  const merged = { ...params, ...extra };
  const missing = ask.filter((p) => p.required && !(merged[p.name] ?? '').trim());

  const launch = async () => {
    setBusy(true);
    setError('');
    try {
      const [runner, permission, choice] = lc.args();
      const t = await api.launch(op.id, merged, runner, permission === 'default' ? undefined : permission, choice);
      onClose();
      navigate(buildUrl('operations', ['terminals', t.id]));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      title={op.title}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" help="Closes this window without starting anything." onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={busy || missing.length > 0 || !lc.ready} help={`Opens a terminal where the chosen agent carries out "${label ?? op.title}" with the details above. You can follow it and answer its questions there.`} onClick={() => void launch()}>
            Launch
          </Button>
        </>
      }
    >
      <form class="stack" onSubmit={(e) => { e.preventDefault(); if (!busy && !missing.length) void launch(); }}>
        {ask.map((p) =>
          p.type === 'asset' ? (
            <AssetField key={p.name} label={p.label} assetType={p.assetType ?? 'cast'} value={extra[p.name] ?? ''} onChange={(v) => setExtra((x) => ({ ...x, [p.name]: v }))} {...(p.required ? { required: true } : {})} />
          ) : p.type === 'select' ? (
            <div class="field" key={p.name}>
              <label for={`op-${p.name}`}>{p.label}</label>
              <select id={`op-${p.name}`} class="select" title={p.label} value={extra[p.name] ?? ''} onChange={(e) => setExtra((x) => ({ ...x, [p.name]: (e.target as HTMLSelectElement).value }))}>
                <option value="">Choose</option>
                {(p.options ?? []).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div class="field" key={p.name}>
              <label for={`op-${p.name}`}>{p.label}</label>
              <input id={`op-${p.name}`} class="input" value={extra[p.name] ?? ''} onInput={(e) => setExtra((x) => ({ ...x, [p.name]: (e.target as HTMLInputElement).value }))} />
            </div>
          ),
        )}
        <LaunchConfirm state={lc} idPrefix={`op-${op.id}`} />
        {error && <span class="error">{error}</span>}
      </form>
    </Dialog>
  );
}

/**
 * Starts a comics procedure (wiki/operations/prompts/comics-*.md) as a visible terminal. Clicking always opens the
 * confirm dialog (provider, model, effort, permission), even when no parameters are missing.
 */
export function OpButton({ id, params = {}, label, small, variant = 'secondary', help }: { id: string; params?: Record<string, string>; label?: string; small?: boolean; variant?: 'primary' | 'secondary' | 'ghost'; /** Plain-English tooltip saying what clicking does. */ help?: string }) {
  const [op, setOp] = useState<OperationDef | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let live = true;
    void defs().then((all) => live && setOp(all.find((o) => o.id === id) ?? null), () => undefined);
    return () => {
      live = false;
    };
  }, [id]);

  return (
    <>
      <Button small={small ?? false} variant={variant} disabled={!op} help={op ? (help ?? `Opens a window to confirm which agent, model and effort carry out "${label ?? op.title}" in a terminal. Nothing starts until you confirm.`) : 'This job is not available right now, so the button does nothing.'} onClick={() => setOpen(true)}>
        {label ?? op?.title ?? id}
      </Button>
      {open && op && <OpDialog op={op} params={params} {...(label ? { label } : {})} onClose={() => setOpen(false)} />}
    </>
  );
}
