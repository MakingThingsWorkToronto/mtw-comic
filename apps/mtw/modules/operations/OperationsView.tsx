import { useState } from 'preact/hooks';
import type { OperationDef } from '../types';
import { api } from '../../web/api';
import type { RunnerOption } from '../../web/api';
import { buildUrl } from '../../web/shell/route';
import { navigate } from '../../web/shell/router';
import { useLiveResource } from '../../web/state';
import { AssetField, Button, Dialog, LaunchConfirm, Table, useLaunchChoice } from '../../web/ui';
import type { Column } from '../../web/ui';

function LaunchDialog({ op, onClose }: { op: OperationDef; onClose: () => void }) {
  const lc = useLaunchChoice(op.id);
  const runnerOk = lc.runners.find((r) => r.id === lc.choice.runner)?.status !== 'untested';
  const [params, setParams] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (name: string, value: string) => setParams((p) => ({ ...p, [name]: value }));

  const missing = op.params.filter((p) => p.required && !(params[p.name] ?? '').trim());
  const launch = async () => {
    setBusy(true);
    setError('');
    try {
      const [runner, permission, choice] = lc.args();
      const t = await api.launch(op.id, params, runner, permission === 'default' ? undefined : permission, choice);
      onClose();
      navigate(buildUrl('operations', ['terminals', t.id]));
    } catch (e) {
      setError((e as Error).message);
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
          <Button variant="primary" disabled={busy || missing.length > 0 || !runnerOk || !lc.ready} help={`Opens a terminal where an agent carries out "${op.title}" with the details above. You can watch it and answer its questions there.`} onClick={() => void launch()}>
            Launch
          </Button>
        </>
      }
    >
      <form class="stack" onSubmit={(e) => { e.preventDefault(); if (!busy && !missing.length) void launch(); }}>
        {op.params.map((p) =>
          p.type === 'asset' ? (
            <AssetField key={p.name} label={p.label} assetType={p.assetType ?? 'img'} value={params[p.name] ?? ''} onChange={(v) => set(p.name, v)} {...(p.required ? { required: true } : {})} />
          ) : p.type === 'select' ? (
            <div class="field" key={p.name}>
              <label for={`p-${p.name}`}>{p.label}</label>
              <select id={`p-${p.name}`} class="select" value={params[p.name] ?? ''} onChange={(e) => set(p.name, (e.target as HTMLSelectElement).value)}>
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
              <label for={`p-${p.name}`}>{p.label}</label>
              <input id={`p-${p.name}`} class="input" value={params[p.name] ?? ''} onInput={(e) => set(p.name, (e.target as HTMLInputElement).value)} />
            </div>
          ),
        )}
        <LaunchConfirm state={lc} idPrefix={`op-${op.id}`} />
        {error && <p role="alert" style="color:var(--error)">{error}</p>}
      </form>
    </Dialog>
  );
}

export function OperationsView() {
  const [active, setActive] = useState<OperationDef | null>(null);
  // Prompts and runners.json are in this module's manifest: both refetch when the files change on disk.
  const opsLive = useLiveResource<OperationDef[]>('/api/operations', { module: 'operations' });
  const runnersLive = useLiveResource<RunnerOption[]>('/api/operations/runners', { module: 'operations' });
  const ops = opsLive.data ?? [];
  const error = opsLive.error || runnersLive.error;

  const columns: Column<OperationDef>[] = [
    { key: 'title', header: 'Operation', render: (o) => o.title, sort: (a, b) => a.title.localeCompare(b.title) },
    { key: 'module', header: 'Module', render: (o) => o.module, sort: (a, b) => a.module.localeCompare(b.module) },
    { key: 'runner', header: 'Runner', render: (o) => o.runner },
    { key: 'skill', header: 'Skill', render: (o) => o.skill ?? '' },
    {
      key: 'launch',
      header: '',
      align: 'actions',
      render: (o) => (
        <Button small variant="primary" aria-label={`Launch ${o.title}`} help={`Opens a window to set up "${o.title}" before anything starts. Nothing runs until you press Launch there.`} onClick={() => setActive(o)}>
          Launch
        </Button>
      ),
    },
  ];

  return (
    <div class="page">
      <div class="page-head">
        <div class="title-block">
          <h1 class="sr-only">Procedures</h1>
          <p class="sub">Each launch opens a terminal under Terminals. Prompts live in wiki/operations/prompts.</p>
        </div>
      </div>
      {error && <p role="alert" style="color:var(--error)">{error}</p>}
      <Table columns={columns} rows={ops} rowKey={(o) => o.id} defaultSort={{ key: 'title', dir: 'asc' }} empty="No operations found." />
      {active && <LaunchDialog op={active} onClose={() => setActive(null)} />}
    </div>
  );
}
