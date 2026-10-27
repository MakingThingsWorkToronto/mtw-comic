// Migrated from retired git 51eb6e03:wiki/image-library/browser.js renderCard (L107-150): preview, service, title, status, treatment count.
import { useState } from 'preact/hooks';
import { Button } from '../../../web/ui/Button';
import { bytesLabel } from '../shared/filter';
import { formatImgRef } from '../shared/refs';
import type { Card as CardData } from '../shared/types';
import { Anchor, StateBadge, Thumb, styleLabel, useCopy } from './common';
import { useHost } from './host';
import { Viewer } from './Viewer';

export function Card({ card, names, onPick, selected, onSelect }: { card: CardData; names: Record<string, string>; onPick?: (card: CardData) => void; selected?: boolean; onSelect?: (card: CardData) => void }) {
  const host = useHost();
  const [viewing, setViewing] = useState(false);
  const [copied, copy] = useCopy();
  const t = card.treatment;
  const href = host.href('record', card.id);
  const open = (): void => {
    if (onSelect) onSelect(card);
    else if (onPick) onPick(card);
    else host.go(href);
  };
  const style = styleLabel(names, card.style);
  return (
    <article class={`img-card${selected ? ' img-card--selected' : ''}`} data-state={card.state}>
      {onSelect && (
        <label class="img-card-select">
          <input type="checkbox" checked={Boolean(selected)} onChange={() => onSelect(card)} />
          <span class="sr-only">Select {card.title}</span>
        </label>
      )}
      <button type="button" class="img-card-preview" aria-label={`${onSelect ? (selected ? 'Deselect' : 'Select') : onPick ? 'Choose' : 'Open'} ${card.title}`} aria-pressed={onSelect ? Boolean(selected) : undefined} title={onSelect ? (selected ? 'Takes this image out of your selection. Nothing is removed.' : 'Adds this image to your selection so you can act on several at once. Nothing is removed yet.') : onPick ? 'Uses this image for the field you came from. Nothing is changed in the library.' : 'Opens this image\'s page with all its versions and styles. Nothing is changed.'} onClick={open}>
        {t ? <Thumb src={host.data.thumb({ sha: t.sha, path: t.path })} alt={`${card.title}, ${style}`} w={t.w} h={t.h} /> : <span class="img-fail">No {style} file</span>}
      </button>
      <div class="img-card-info">
        <p class="img-card-service">{card.service}</p>
        <h3>{onPick ? <button type="button" class="img-link" title="Uses this image for the field you came from. Nothing is changed in the library." onClick={open}>{card.title}</button> : <Anchor view="record" id={card.id}>{card.title}</Anchor>}</h3>
        <div class="img-card-meta">
          <StateBadge state={card.state} raw={card.status} />
          <span class="muted">
            {style}
            {card.treatmentCount > 1 ? ` · ${card.treatmentCount} styles` : ''}
            {t?.bytes ? ` · ${bytesLabel(t.bytes)}` : ''}
          </span>
        </div>
        <div class="img-card-actions">
          {t && (
            <Button small variant="ghost" onClick={() => setViewing(true)} aria-label={`Open original of ${card.title}`} help="Shows the full-size original of this image in a window. Nothing is changed.">
              Original
            </Button>
          )}
          <Button small variant="ghost" onClick={() => copy(formatImgRef(card.id), 'Copied')} aria-label={`Copy reference for ${card.title}`} help="Copies this image's reference to your clipboard so you can paste it where an image is asked for, such as in a request to an agent. Nothing is changed.">
            {copied ? 'Copied' : 'Copy ref'}
          </Button>
          {card.hasTour && <span class="muted">Tour</span>}
        </div>
      </div>
      {viewing && t && <Viewer title={card.title} path={t.path} onClose={() => setViewing(false)} />}
    </article>
  );
}
