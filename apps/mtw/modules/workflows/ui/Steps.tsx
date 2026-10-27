// New module (no wiki origin): the compact vertical step list with edges; with a run it carries node state, terminal links, tokens and gate buttons.
import { useState } from 'preact/hooks';
import { Link } from '../../../web/shell/Link';
import { buildUrl } from '../../../web/shell/route';
import { Badge, Button } from '../../../web/ui';
import { copy } from '../copy';
import type { NodeRun } from '../lib/engine';
import { edgeWhen, topoOrder } from '../lib/schema';
import type { Workflow, WorkflowNode } from '../lib/schema';
import { fmtTokens, fmtUsd, nodeBadge } from './util';
import type { TourData } from './util';

interface Props {
  workflow: Workflow;
  tour?: TourData | undefined;
  /** Present on the run view. */
  nodes?: Record<string, NodeRun>;
  onDecide?: (node: string, decision: 'approve' | 'reject', note: string) => Promise<void>;
  busy?: boolean;
}

function Gate({ def, node, onDecide, busy }: { def: WorkflowNode; node: NodeRun; onDecide: NonNullable<Props['onDecide']>; busy?: boolean | undefined }) {
  const [note, setNote] = useState('');
  const id = `wf-note-${def.id}`;
  const blocked = Boolean(def.noteRequired) && !note.trim();
  return (
    <div class="wf-gate">
      <div class="field">
        <label for={id}>{copy.runView.note}{def.noteRequired ? ' (required)' : ''}</label>
        <textarea id={id} class="wf-note" rows={2} value={note} onInput={(e) => setNote((e.target as HTMLTextAreaElement).value)} aria-describedby={blocked ? `${id}-hint` : undefined} />
        {blocked && <span class="hint" id={`${id}-hint`}>{copy.runView.noteRequired}</span>}
      </div>
      <div class="row">
        <Button variant="primary" small help="Approves this decision with your note and lets the workflow carry on to its next steps." disabled={busy || blocked} onClick={() => void onDecide(def.id, 'approve', note)}>{copy.runView.approve}</Button>
        <Button variant="danger" small help="Rejects this decision with your note. The workflow follows its rejection path instead of carrying on." disabled={busy} onClick={() => void onDecide(def.id, 'reject', note)}>{copy.runView.reject}</Button>
        <span class="muted">{node.status === 'waiting' ? copy.runView.waiting : ''}</span>
      </div>
    </div>
  );
}

export function Steps({ workflow, tour, nodes, onDecide, busy }: Props) {
  const order = topoOrder(workflow) ?? workflow.nodes.map((n) => n.id);
  const byId = new Map(workflow.nodes.map((n) => [n.id, n]));
  return (
    <ol class="wf-steps">
      {order.map((id, i) => {
        const def = byId.get(id) as WorkflowNode;
        const run = nodes?.[id];
        const out = workflow.edges.filter((e) => e.from === id);
        const step = def.tourStep !== undefined ? tour?.steps[def.tourStep] : undefined;
        const status = run?.status ?? 'pending';
        return (
          <li class={`wf-step wf-step--${status}`} id={`wf-node-${id}`} key={id} aria-current={status === 'waiting' || status === 'running' ? 'step' : undefined}>
            <span class="wf-num" aria-hidden="true">{i + 1}</span>
            <div class="wf-body">
              <div class="row wf-line">
                <strong class="wf-label">{def.label}</strong>
                <span class="wf-kind">{copy.kind[def.kind]}</span>
                {run && <Badge status={nodeBadge(status)}>{copy.node[status]}</Badge>}
                {def.operation && <code class="wf-op">{def.operation}</code>}
              </div>
              {def.note && <p class="wf-note-text">{def.note}</p>}
              {step && <p class="wf-note-text">{step.paragraphs[0] ?? step.title}</p>}
              {run?.error && <p class="wf-error" role="status">{run.error}</p>}
              {run?.note && run.decision && <p class="wf-note-text">Your note: {run.note}</p>}
              {run && (run.terminalId || run.tokens) && (
                <div class="row wf-meta">
                  {run.terminalId && <Link href={buildUrl('operations', ['terminals', run.terminalId])}>{copy.runView.terminal}</Link>}
                  {run.tokens && (
                    <span class="muted" title={`${run.tokens.input} input, ${run.tokens.output} output, ${run.tokens.cacheRead} cache read`}>
                      {fmtTokens(run.tokens.total)} tokens{run.tokens.estCostUsd ? `, ${fmtUsd(run.tokens.estCostUsd)} ${copy.runView.estimate}` : ''}
                    </span>
                  )}
                </div>
              )}
              {run && status === 'waiting' && def.kind === 'human-gate' && onDecide && <Gate def={def} node={run} onDecide={onDecide} busy={busy} />}
              {out.length > 0 && (
                <ul class="wf-edges" aria-label={`After ${def.label}`}>
                  {out.map((e) => (
                    <li key={`${e.to}-${edgeWhen(e)}`}>
                      <span aria-hidden="true">{'→'}</span> <button type="button" class="wf-jump" title="Scrolls down to the step that comes next so you can read it. Nothing is run or changed." aria-description="Scrolls down to the step that comes next so you can read it. Nothing is run or changed." onClick={() => document.getElementById(`wf-node-${e.to}`)?.scrollIntoView({ block: 'nearest' })}>{byId.get(e.to)?.label ?? e.to}</button> <span class="muted">{copy.when[edgeWhen(e)]}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
