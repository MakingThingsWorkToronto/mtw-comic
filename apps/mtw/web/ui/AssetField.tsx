import type { ComponentType } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { clientModules } from '../../modules/client-registry';
import type { AssetSummary, ViewProps } from '../../modules/types';
import { api } from '../api';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { EmptyState } from './Layout';
import { AudioPlayer, ImageViewer } from './Media';

interface AssetFieldProps {
  label: string;
  /** Asset prefix: 'img', 'snd', 'speech', ... */
  assetType: string;
  value: string;
  onChange: (ref: string) => void;
  required?: boolean;
}

function Preview({ asset }: { asset: AssetSummary }) {
  if (!asset.preview) return null;
  if (/^(snd|speech)$/.test(asset.ref.split(':', 1)[0] ?? '')) return <AudioPlayer src={asset.preview} label={asset.title} />;
  return <ImageViewer src={asset.preview} alt={asset.title} />;
}

/**
 * Holds a typed asset ref string. Shows the resolved asset as a chip with preview; "Browse" opens
 * the owning module's own view in pick mode (the module whose meta.assetTypes names this prefix).
 */
export function AssetField({ label, assetType, value, onChange, required }: AssetFieldProps) {
  const [asset, setAsset] = useState<AssetSummary | null>(null);
  const [problem, setProblem] = useState('');
  const [browsing, setBrowsing] = useState(false);
  const owner = clientModules.find((m) => m.meta.assetTypes?.includes(assetType));

  useEffect(() => {
    setAsset(null);
    setProblem('');
    if (!value.trim()) return;
    let live = true;
    const timer = setTimeout(() => {
      api.resolveAsset(value.trim()).then(
        (a) => live && setAsset(a),
        (e: Error) => live && setProblem(e.message),
      );
    }, 250);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [value]);

  return (
    <div class="field asset-field">
      <label>{label}</label>
      <div class="row">
        <input class="input" style="flex:1" value={value} required={required} placeholder={`${assetType}:...`} aria-label={label} onInput={(e) => onChange((e.target as HTMLInputElement).value)} />
        <Button disabled={!owner} help={owner ? 'Opens a picker so you can choose an existing item from the library instead of typing its reference. Nothing is changed until you choose one.' : 'There is no picker for this kind of item yet, so type the reference instead.'} onClick={() => setBrowsing(true)}>
          Browse
        </Button>
        {value && (
          <Button variant="ghost" help="Empties this field. The library item itself is not touched." onClick={() => onChange('')}>
            Clear
          </Button>
        )}
      </div>
      {asset && (
        <div class="asset-chip">
          <Preview asset={asset} />
          <div style="min-width:0">
            <div class="title">{asset.title}</div>
            <div class="meta">
              {asset.ref}
              {asset.status ? ` · ${asset.status}` : ''}
            </div>
          </div>
        </div>
      )}
      {problem && <span class="error">{problem}</span>}
      {browsing && owner && (
        <Dialog title={`Choose ${assetType}`} wide onClose={() => setBrowsing(false)}>
          <OwnerView load={owner.load} assetType={assetType} onPick={(ref) => { onChange(ref); setBrowsing(false); }} />
        </Dialog>
      )}
    </div>
  );
}

function OwnerView({ load, assetType, onPick }: { load: () => Promise<{ default: ComponentType<ViewProps> }>; assetType: string; onPick: (ref: string) => void }) {
  const [View, setView] = useState<ComponentType<ViewProps> | null>(null);
  useEffect(() => {
    void load().then((m) => setView(() => m.default));
  }, [load]);
  if (!View) return <EmptyState>Loading.</EmptyState>;
  return <View path={[]} query={new URLSearchParams()} pick={{ assetType, onPick }} />;
}
