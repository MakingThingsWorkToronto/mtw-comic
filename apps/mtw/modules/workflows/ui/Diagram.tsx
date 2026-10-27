// New module (no wiki origin): the inline Site Glass diagram with the active node ringed and completed nodes marked.
import { useEffect, useMemo, useRef } from 'preact/hooks';
import type { NodeRun } from '../lib/engine';
import type { Workflow } from '../lib/schema';
import { isSelector } from '../lib/schema';

const NS = 'http://www.w3.org/2000/svg';

function find(root: Element, ref: string): Element | null {
  try {
    return root.querySelector(isSelector(ref) ? ref : `[id="${ref.replace(/"/g, '')}"]`);
  } catch {
    return null;
  }
}

function mark(el: Element, kind: 'active' | 'done' | 'failed'): void {
  el.classList.add(`wf-${kind}`);
  const target = el as SVGGraphicsElement;
  if (typeof target.getBBox !== 'function') return;
  let box: DOMRect;
  try {
    box = target.getBBox();
  } catch {
    return;
  }
  if (!box.width || !box.height || !(el instanceof SVGGElement)) return;
  const pad = Math.max(4, Math.min(box.width, box.height) * 0.04);
  const ring = document.createElementNS(NS, 'rect');
  ring.setAttribute('class', `wf-mark wf-ring wf-ring--${kind}`);
  ring.setAttribute('x', String(box.x - pad));
  ring.setAttribute('y', String(box.y - pad));
  ring.setAttribute('width', String(box.width + pad * 2));
  ring.setAttribute('height', String(box.height + pad * 2));
  ring.setAttribute('rx', String(pad * 1.5));
  ring.setAttribute('fill', 'none');
  ring.setAttribute('pointer-events', 'none');
  el.appendChild(ring);
  if (kind === 'done') {
    const r = Math.max(9, Math.min(26, Math.min(box.width, box.height) * 0.12));
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'wf-mark wf-check');
    g.setAttribute('transform', `translate(${box.x + box.width - r * 0.3} ${box.y + r * 0.3})`);
    g.setAttribute('pointer-events', 'none');
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('r', String(r));
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', `M${-r * 0.45} ${r * 0.02} L${-r * 0.1} ${r * 0.38} L${r * 0.5} ${-r * 0.36}`);
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke-width', String(Math.max(2, r * 0.22)));
    g.append(c, p);
    el.appendChild(g);
  }
}

/** `svg` is sanitised by the server (no scripts or event handlers). The markup is set once; only classes and marks change. */
export function DiagramView({ svg, workflow, states }: { svg: string; workflow: Workflow; states?: Record<string, NodeRun['status']> }) {
  const root = useRef<HTMLDivElement>(null);
  const html = useMemo(() => ({ __html: svg }), [svg]);
  const active = workflow.nodes.find((n) => states?.[n.id] === 'waiting' || states?.[n.id] === 'running');

  useEffect(() => {
    const host = root.current;
    if (!host) return;
    host.querySelectorAll('.wf-mark').forEach((n) => n.remove());
    host.querySelectorAll('.wf-active, .wf-done, .wf-failed').forEach((n) => n.classList.remove('wf-active', 'wf-done', 'wf-failed'));
    if (!states) return;
    for (const n of workflow.nodes) {
      if (!n.diagramNode) continue;
      const status = states[n.id];
      const kind = status === 'running' || status === 'waiting' ? 'active' : status === 'done' ? 'done' : status === 'failed' ? 'failed' : null;
      const el = kind ? find(host, n.diagramNode) : null;
      if (el && kind) mark(el, kind);
    }
  }, [svg, workflow, states]);

  const label = active ? `Diagram. Active step: ${active.label}.` : 'Diagram of the process.';
  return <div class="wf-svg glass" ref={root} role="img" aria-label={label} dangerouslySetInnerHTML={html} />;
}
