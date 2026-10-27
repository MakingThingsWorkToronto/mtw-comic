// Small review parts shared by the speech flow and the issue overview: page-art crop, state meter, word diff, lettering.
import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Badge } from '../../../web/ui';
import type { BadgeStatus } from '../../../web/ui';
import { boxFrame, placedLayerFrame } from './boxLayout';
import type { BoxGeometry } from './boxLayout';
import { cropLayout, meterLabel, meterSegments, wordDiff } from './flow';
import type { Rect } from './flow';
import type { Counts, ReviewState, PanelArtLayer } from './types';

export const BADGE: Record<ReviewState, BadgeStatus> = { approved: 'approved', rejected: 'rejected', stale: 'pending', pending: 'candidate', unvoiced: 'pending' };
export const LABEL: Record<ReviewState, string> = { approved: 'Approved', rejected: 'Rejected', stale: 'Stale', pending: 'To review', unvoiced: 'Unvoiced' };

export const StateBadge = ({ state }: { state: ReviewState }) => <Badge status={BADGE[state]}>{LABEL[state]}</Badge>;

const sizes = new Map<string, { width: number; height: number }>();

/** The panel's region of the page art: the image is placed by fractions inside a box with the crop's own aspect ratio. */
export function PanelCrop({ src, rect, alt, class: cls = '', children, geometry, layers = [] }: { src: string; rect: Rect; alt: string; class?: string; children?: ComponentChildren; geometry?: BoxGeometry | null; layers?: PanelArtLayer[] }) {
  const [, bump] = useState(0);
  const img = useRef<HTMLImageElement>(null);
  const natural = sizes.get(src);
  // An image that was already loaded (cache, reused element) fires no load event: read its size directly.
  useEffect(() => {
    const el = img.current;
    if (!natural && el?.complete && el.naturalWidth) {
      sizes.set(src, { width: el.naturalWidth, height: el.naturalHeight });
      bump((n) => n + 1);
    }
  });
  // With the box's reader geometry: the layout rect's shape with the art covering it, as the comic shows it.
  const frame = natural && geometry ? boxFrame({ ...geometry, ar: rect }, natural) : null;
  const layout = frame ? { aspect: frame.aspect, widthPct: frame.img.widthPct, leftPct: frame.img.leftPct, topPct: frame.img.topPct } : natural ? cropLayout(rect, natural) : null;
  return (
    <div
      class={`crop ${cls}`}
      role="img"
      aria-label={alt || 'Panel art'}
      style={{ aspectRatio: layout ? String(layout.aspect) : '4 / 3', width: layout ? `min(100%, calc(var(--crop-h, 50vh) * ${layout.aspect}))` : '100%', ...(frame ? { '--bx-font': `${frame.fontCqw}cqw` } : {}) }}
    >
      <img
        ref={img}
        src={src}
        alt=""
        decoding="async"
        onLoad={(e) => {
          const img = e.currentTarget;
          sizes.set(src, { width: img.naturalWidth, height: img.naturalHeight });
          bump((n) => n + 1);
        }}
        style={layout ? { width: `${layout.widthPct}%`, left: `${layout.leftPct}%`, top: `${layout.topPct}%` } : { visibility: 'hidden' }}
      />
      {layout && layers.filter(layer => layer.src !== src).map(layer => {
        const placement = layer.role === 'agents' ? layer.agentPlacement : layer.role === 'props' || layer.role === 'light' ? layer.propPlacement : undefined;
        const ownSize = sizes.get(layer.src);
        const loaded = (e: { currentTarget: HTMLImageElement }) => { sizes.set(layer.src, { width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight }); bump(n => n + 1); };
        if (placement) {
          // Never borrow room dimensions for an alpha pose sheet. Decode its own canvas before fitting it.
          const placed = ownSize ? placedLayerFrame(placement, ownSize, layout.aspect) : null;
          if (!placed) return <img key={layer.id} src={layer.src} alt="" decoding="async" onLoad={loaded} style={{ visibility: 'hidden' }} />;
          const bounds = placed.bounds, image = placed.img;
          return <div key={layer.id} data-layer-placement={layer.role} style={{ position: 'absolute', overflow: 'hidden', left: `${bounds.leftPct}%`, top: `${bounds.topPct}%`, width: `${bounds.widthPct}%`, height: `${bounds.heightPct}%`, opacity: layer.opacity }}>
            <img src={layer.src} alt="" decoding="async" onLoad={loaded} style={{ width: `${image.widthPct}%`, left: `${image.leftPct}%`, top: `${image.topPct}%` }} />
          </div>;
        }
        const size = ownSize ?? natural;
        const layerFrame = size && geometry ? boxFrame({ ...geometry, ar: layer.crop }, size) : null;
        const positioned = layerFrame ? layerFrame.img : size ? cropLayout(layer.crop, size) : layout;
        return positioned ? <img key={layer.id} src={layer.src} alt="" decoding="async"
          onLoad={loaded}
          style={{ width: `${positioned.widthPct}%`, left: `${positioned.leftPct}%`, top: `${positioned.topPct}%`, opacity: layer.opacity }} /> : null;
      })}
      {layout ? children : null}
    </div>
  );
}

const SEG_CLASS: Record<ReviewState, string> = { approved: 'seg-approved', rejected: 'seg-rejected', pending: 'seg-pending', stale: 'seg-stale', unvoiced: 'seg-unvoiced' };

/** Stacked bar of approved / rejected / to review / stale (/ unvoiced) with a text equivalent. */
export function Meter({ counts, label }: { counts: Counts; label: string }) {
  const segs = meterSegments(counts);
  return (
    <div class="meter" role="img" aria-label={`${label}: ${meterLabel(counts)}`} title={meterLabel(counts)}>
      {segs.map((s) => (
        <span key={s.state} class={SEG_CLASS[s.state]} style={{ width: `${s.pct}%` }} />
      ))}
    </div>
  );
}

/** Earlier text with removed words struck and added words marked; marks also carry a text prefix for non-colour readers. */
export function Diff({ before, after }: { before: string; after: string }) {
  return (
    <p class="diff" aria-label="Changes since the earlier text">
      {wordDiff(before, after).map((seg, i) =>
        seg.op === 'same' ? (
          <span key={i}>{seg.text} </span>
        ) : seg.op === 'add' ? (
          <ins key={i}>
            <span class="sr">added: </span>
            {seg.text}{' '}
          </ins>
        ) : (
          <del key={i}>
            <span class="sr">removed: </span>
            {seg.text}{' '}
          </del>
        ),
      )}
    </p>
  );
}

/** The balloon text in the comic's lettering face (Comic Neue; Bangers for bursts). Line breaks are kept as authored. */
export function Lettering({ text, kind }: { text: string; kind: string }) {
  return (
    <p class={`letter letter--${kind}`} lang="en">
      {text}
    </p>
  );
}
