// Comic Editor overlay: transparent handles over the reader iframe for each panel and balloon from geometry().
// Dragging converts iframe CSS px to panel fractions (model.ts). The iframe is shown at 1:1, so no extra scale.
import { useRef, useState } from 'preact/hooks';
import { dragMove, dragWidth, tailFromPoint, tailToPoint } from './model';
import type { BalloonAddr, BalloonData, Geometry, PxRect } from './model';

export interface Pick { scene: string; img: string; index: number }
export interface Placement { x?: number; y?: number; w?: number; tail?: [number, number] }

interface Props {
  geo: Geometry;
  selected: Pick | null;
  selectedPanel: { scene: string; img: string } | null;
  /** The balloon being edited (draft), used for drag starting values and tail. */
  draft: BalloonData | null;
  target: 'page' | 'phone';
  editable: boolean;
  onSelect(p: Pick): void;
  onSelectPanel(p: { scene: string; img: string }): void;
  onPlace(patch: Placement): void;
}

const css = (r: PxRect, g: Geometry) => ({ left: `${r.x - g.viewport.scrollX}px`, top: `${r.y - g.viewport.scrollY}px`, width: `${r.width}px`, height: `${r.height}px` });
const imgOf = (g: Geometry, panelId: string): string | null => g.panels.find((p) => p.id === panelId)?.imageId ?? null;

export function Overlay({ geo, selected, selectedPanel, draft, target, editable, onSelect, onSelectPanel, onPlace }: Props) {
  const drag = useRef<{ kind: 'move' | 'width' | 'tail'; x0: number; y0: number; panel: PxRect; start: Placement } | null>(null);
  const [live, setLive] = useState<{ dx: number; dy: number } | null>(null);

  const value = (): Placement => {
    if (!draft) return {};
    const src = target === 'phone' ? { ...draft, ...(draft.phone ?? {}) } : draft;
    return { x: src.x, y: src.y, ...(src.w !== undefined ? { w: src.w } : {}), ...(src.tail ? { tail: src.tail } : {}) };
  };

  const begin = (kind: 'move' | 'width' | 'tail', panel: PxRect) => (e: PointerEvent) => {
    if (!editable) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { kind, x0: e.clientX, y0: e.clientY, panel, start: value() };
    e.stopPropagation();
  };
  const move = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
    setLive({ dx, dy });
    const breakout = !!draft?.breakout;
    if (d.kind === 'move' && d.start.x !== undefined && d.start.y !== undefined) onPlace(dragMove(d.panel, { x: d.start.x, y: d.start.y }, dx, dy, breakout));
    else if (d.kind === 'width') onPlace({ w: dragWidth(d.panel, d.start.w ?? 0.34, dx, d.start.x ?? 0, breakout) });
    else if (d.kind === 'tail' && d.start.tail) {
      const p = tailToPoint(d.panel, d.start.tail);
      onPlace({ tail: tailFromPoint(d.panel, p.x + dx, p.y + dy) });
    }
  };
  const end = () => {
    drag.current = null;
    setLive(null);
  };

  return (
    <div class="ce-overlay" onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
      {geo.panels.map((p) => (
        <button
          key={p.id}
          type="button"
          class={`ce-panel${selectedPanel && selectedPanel.scene === p.scene && selectedPanel.img === p.imageId ? ' is-selected' : ''}`}
          style={css(p.visibleRect, geo)}
          aria-label={`Panel ${p.panelIndex + 1} of scene ${p.scene}`}
          title="Selects this panel so you can add a balloon to it. Nothing is changed."
          onClick={() => p.imageId && onSelectPanel({ scene: p.scene, img: p.imageId })}
        />
      ))}
      {geo.balloons.map((b) => {
        const img = imgOf(geo, b.panelId);
        if (!img) return null;
        const addr: BalloonAddr = { scene: b.scene, img, index: b.balloonIndex };
        const isSel = !!selected && selected.scene === addr.scene && selected.img === addr.img && selected.index === addr.index;
        const hostPanel = geo.panels.find((p) => p.id === (target === 'phone' && b.hostPanelId ? b.hostPanelId : b.panelId));
        const style = css(b.visibleRect, geo);
        const moved = isSel && live && drag.current?.kind === 'move' ? { transform: `translate(${live.dx}px, ${live.dy}px)` } : {};
        const wider = isSel && live && drag.current?.kind === 'width' ? { width: `${Math.max(8, b.visibleRect.width + live.dx)}px` } : {};
        return (
          <div key={b.id} class={`ce-balloon${isSel ? ' is-selected' : ''}`} style={{ ...style, ...moved, ...wider }}>
            <button
              type="button"
              class="ce-hit"
              aria-label={`Balloon ${b.balloonIndex + 1}, ${b.authoredWho}, ${b.kind}${editable ? '. Drag to move' : ''}`}
              aria-pressed={isSel}
              title={editable ? 'Selects this balloon so you can edit it in the side panel; once selected, drag it to move it. Nothing is saved until you press Save.' : 'Selects this balloon to read it in the side panel. Nothing is changed.'}
              onClick={() => onSelect(addr)}
              onPointerDown={isSel && hostPanel ? begin('move', hostPanel.rect) : undefined}
            />
            {isSel && editable && hostPanel && (
              <>
                <span class="ce-grip ce-grip--w" role="presentation" onPointerDown={begin('width', hostPanel.rect)} />
                {value().tail && (
                  <span
                    class="ce-grip ce-grip--tail"
                    role="presentation"
                    style={{
                      left: `${tailToPoint(hostPanel.rect, value().tail as [number, number]).x - b.visibleRect.x}px`,
                      top: `${tailToPoint(hostPanel.rect, value().tail as [number, number]).y - b.visibleRect.y}px`,
                    }}
                    onPointerDown={begin('tail', hostPanel.rect)}
                  />
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
