import { useEffect, useState } from 'preact/hooks';
import type { AssetSummary } from '../../types';
import { api } from '../../../web/api';
import { AudioPlayer, Badge, Button, EmptyState, FilterBar, ImageViewer, Table } from '../../../web/ui';
import type { BadgeStatus, Column } from '../../../web/ui';

const badge = (s?: string): BadgeStatus => (s === 'selected' || s === 'approved' ? 'approved' : s === 'rejected' ? 'rejected' : s === 'candidate' ? 'candidate' : 'pending');

/** Pick mode for AssetField: browse a comics asset type and choose one ref. */
export function Pick({ assetType, onPick }: { assetType: string; onPick: (ref: string) => void }) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<AssetSummary[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    const timer = setTimeout(() => {
      api.get<{ items: AssetSummary[]; total: number }>(`/api/assets/${encodeURIComponent(assetType)}?limit=100&q=${encodeURIComponent(q)}`).then(
        (r) => live && (setItems(r.items), setTotal(r.total), setError('')),
        (e: Error) => live && setError(e.message),
      );
    }, 150);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [assetType, q]);

  const columns: Column<AssetSummary>[] = [
    {
      key: 'preview',
      header: 'Preview',
      render: (a) => (a.preview ? assetType === 'cast' ? <ImageViewer src={a.preview} alt={a.title} /> : <AudioPlayer src={a.preview} label={a.title} /> : <span class="muted">none</span>),
    },
    { key: 'title', header: 'Name', render: (a) => a.title },
    { key: 'status', header: 'Status', render: (a) => <Badge status={badge(a.status)}>{a.status ?? ''}</Badge> },
    {
      key: 'choose',
      header: '',
      align: 'actions',
      render: (a) => (
        <Button small variant="primary" aria-label={`Choose ${a.title}`} help="Uses this item for the field you came from. The library itself is not changed." onClick={() => onPick(a.ref)}>
          Choose
        </Button>
      ),
    },
  ];
  return (
    <div class="stack">
      <FilterBar search={q} onSearch={setQ} searchLabel={`Search ${assetType}`} />
      {error ? <EmptyState>{error}</EmptyState> : items ? <Table columns={columns} rows={items} rowKey={(a) => a.ref} empty="No matches." /> : <EmptyState>Loading.</EmptyState>}
      {items && total > items.length && <p class="muted small">Showing {items.length} of {total}. Narrow the search.</p>}
    </div>
  );
}
