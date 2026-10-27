// New. Pick mode (ViewProps.pick): choose a style and version of one image and return its `img:` reference.
import { useEffect, useState } from 'preact/hooks';
import { Button } from '../../../web/ui/Button';
import { primaryStyle } from '../shared/filter';
import { formatImgRef } from '../shared/refs';
import type { Card, RecordDetail } from '../shared/types';
import { Thumb, styleLabel } from './common';
import { useHost } from './host';

export function PickBar({ card, onClose }: { card: Card; onClose: () => void }) {
  const host = useHost();
  const [detail, setDetail] = useState<RecordDetail | null>(null);
  const [style, setStyle] = useState(card.style);
  const [version, setVersion] = useState('current');

  useEffect(() => {
    let live = true;
    setDetail(null);
    setStyle(card.style);
    setVersion('current');
    void host.data.record(card.id).then((d) => live && setDetail(d));
    return () => {
      live = false;
    };
  }, [card.id]);

  const styles = detail ? Object.keys(detail.versions) : [card.style];
  const chain = detail?.versions[style] ?? [];
  const ref = formatImgRef(card.id, version, detail && style !== primaryStyle(detail.record) ? style : undefined);
  const t = card.treatment;

  return (
    <div class="img-pick glass" role="region" aria-label="Choose version">
      {t && <span class="img-row-thumb"><Thumb src={host.data.thumb({ sha: t.sha, path: t.path })} alt="" /></span>}
      <div class="img-pick-main">
        <strong>{card.title}</strong>
        <code>{ref}</code>
      </div>
      <label class="img-pick-field">
        <span>Style</span>
        <select class="select" value={style} onChange={(e) => { setStyle((e.target as HTMLSelectElement).value); setVersion('current'); }}>
          {styles.map((s) => (
            <option key={s} value={s}>
              {styleLabel(detail?.styleNames ?? {}, s)}
            </option>
          ))}
        </select>
      </label>
      <label class="img-pick-field">
        <span>Version</span>
        <select class="select" value={version} onChange={(e) => setVersion((e.target as HTMLSelectElement).value)}>
          <option value="current">Current</option>
          {chain.map((v) => (
            <option key={v.token} value={v.token}>
              {v.token}
              {v.current ? ' (current)' : ''} · {v.state}
            </option>
          ))}
        </select>
      </label>
      <Button variant="ghost" help="Closes the image picker without choosing anything." onClick={onClose}>
        Cancel
      </Button>
      <Button variant="primary" disabled={!detail} help="Uses the image and version shown here for the field you came from. The library itself is not changed." onClick={() => host.pick?.(ref)}>
        Use image
      </Button>
    </div>
  );
}
