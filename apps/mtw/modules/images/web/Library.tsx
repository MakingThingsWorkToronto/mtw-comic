// Migrated from retired git 51eb6e03:wiki/image-library/browser.js: collection tabs (L265-272), search (L274), cascading category/service
// selects (L67-75), style selector (L76-84), gaps (L85), reset (L249), newest-first paging (L66, L279-285),
// card grid (L107-150). Paging is server-side and infinite; "All" page size is gone.
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { Button } from '../../../web/ui/Button';
import { FilterBar } from '../../../web/ui/FilterBar';
import { EmptyState, Tabs } from '../../../web/ui/Layout';
import { Table } from '../../../web/ui/Table';
import type { Column } from '../../../web/ui/Table';
import { bytesLabel, orderStyles } from '../shared/filter';
import { COLLECTION_LABEL, COLLECTION_ORDER } from '../shared/types';
import type { Card as CardData, CardQuery, Facets } from '../shared/types';
import { Card } from './Card';
import { Anchor, StateBadge, StaleBanner, Thumb, styleLabel, useDebounced } from './common';
import { useHost } from './host';
import type { Host } from './host';
import { PickBar } from './PickBar';
import { RemoveDialog, canRemove } from './Remove';
import type { RemoveRequest } from './host';
import { STATE_LABEL } from '../shared/states';

const PAGE = 60;
const FILTER_KEYS = ['q', 'category', 'service', 'style', 'status', 'gaps'] as const;

interface Paged {
  items: CardData[];
  total: number;
  loading: boolean;
  error: string;
}

/** First page on any filter change; more pages append as the sentinel nears the viewport. */
function usePaged(host: Host, query: CardQuery, reload: number): [Paged, () => void] {
  const [state, setState] = useState<Paged>({ items: [], total: 0, loading: true, error: '' });
  const ref = useRef(state);
  ref.current = state;
  const run = useRef(0);
  const key = JSON.stringify(query);

  useEffect(() => {
    const id = ++run.current;
    setState({ items: [], total: 0, loading: true, error: '' });
    host.data.records({ ...query, offset: 0, limit: PAGE }).then(
      (r) => run.current === id && setState({ items: r.items, total: r.total, loading: false, error: '' }),
      (e: Error) => run.current === id && setState({ items: [], total: 0, loading: false, error: e.message }),
    );
  }, [key, reload, host.data]);

  const more = useCallback(() => {
    const cur = ref.current;
    if (cur.loading || cur.items.length >= cur.total) return;
    const id = run.current;
    setState({ ...cur, loading: true });
    host.data.records({ ...query, offset: cur.items.length, limit: PAGE }).then(
      (r) => run.current === id && setState((s) => ({ items: [...s.items, ...r.items], total: r.total, loading: false, error: '' })),
      (e: Error) => run.current === id && setState((s) => ({ ...s, loading: false, error: e.message })),
    );
  }, [key, host.data]);

  return [state, more];
}

function Sentinel({ onNear, watch }: { onNear: () => void; watch: number }) {
  const node = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = node.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && onNear(), { rootMargin: '800px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [onNear, watch]);
  return <div ref={node} class="img-sentinel" aria-hidden="true" />;
}

function tabLabel(id: string, facets: Facets | null): string {
  const c = facets?.collections;
  const n = c ? (id === 'earlier' ? (c.earlier ?? 0) + (c.experiments ?? 0) : (c[id] ?? 0)) : null;
  return `${COLLECTION_LABEL[id] ?? id}${n === null ? '' : ` ${n.toLocaleString('en-US')}`}`;
}

export function Library() {
  const host = useHost();
  const { query } = host;
  const collection = query.get('collection') || 'diagrams';
  const layout = query.get('layout') === 'table' ? 'table' : 'grid';
  const filters = Object.fromEntries(FILTER_KEYS.map((k) => [k, query.get(k) ?? ''])) as Record<(typeof FILTER_KEYS)[number], string>;

  const [search, setSearch] = useState(filters.q);
  const debounced = useDebounced(search, 220);
  useEffect(() => {
    if (debounced !== filters.q) host.setQuery({ q: debounced || undefined });
  }, [debounced]);
  useEffect(() => setSearch(filters.q), [filters.q]);

  const [facets, setFacets] = useState<Facets | null>(null);
  const [reload, setReload] = useState(0);
  const [seen, setSeen] = useState(host.changeToken);
  const stale = host.changeToken !== seen;
  useEffect(() => {
    let live = true;
    host.data.facets(collection, filters.category || undefined).then((f) => live && setFacets(f), () => undefined);
    return () => {
      live = false;
    };
  }, [collection, filters.category, reload, host.data]);

  const cardQuery: CardQuery = {
    collection,
    ...(filters.q ? { q: filters.q } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.service ? { service: filters.service } : {}),
    ...(filters.style ? { style: filters.style } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.gaps === '1' && collection === 'diagrams' ? { gaps: true } : {}),
  };
  const [paged, more] = usePaged(host, cardQuery, reload);
  const names = facets?.styleNames ?? {};
  const [picked, setPicked] = useState<CardData | null>(null);
  // Remove: Select mode picks cards; the bar and "Remove all rejected" open the confirm dialog.
  const removable = canRemove(host);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Map<string, CardData>>(new Map());
  const [removing, setRemoving] = useState<{ req: RemoveRequest; label: string } | null>(null);
  const toggle = (c: CardData): void =>
    setSelected((m) => {
      const next = new Map(m);
      if (next.has(c.id)) next.delete(c.id);
      else next.set(c.id, c);
      return next;
    });
  const stopSelecting = (): void => {
    setSelecting(false);
    setSelected(new Map());
  };

  const pickCollection = (id: string): void =>
    host.setQuery({ collection: id === 'diagrams' ? undefined : id, category: undefined, service: undefined, style: undefined, status: undefined, gaps: undefined });
  const hasFilters = FILTER_KEYS.some((k) => filters[k]);

  const selects = [
    { name: 'category', label: 'Category', value: filters.category, options: [{ value: '', label: 'All categories' }, ...(facets?.categories ?? []).map((f) => ({ value: f.value, label: `${f.value} (${f.count})` }))] },
    { name: 'service', label: 'Service', value: filters.service, options: [{ value: '', label: 'All services' }, ...(facets?.services ?? []).map((f) => ({ value: f.value, label: `${f.value} (${f.count})` }))] },
    {
      name: 'style',
      label: 'Style',
      value: filters.style,
      options: [{ value: '', label: 'Default style' }, ...orderStyles((facets?.styles ?? []).map((f) => f.value)).map((s) => ({ value: s, label: styleLabel(names, s) }))],
    },
    { name: 'status', label: 'Status', value: filters.status, options: [{ value: '', label: 'Any status' }, ...(facets?.statuses ?? []).map((f) => ({ value: f.value, label: `${STATE_LABEL[f.value as keyof typeof STATE_LABEL] ?? f.value} (${f.count})` }))] },
  ];

  const columns: Column<CardData>[] = [
    {
      key: 'preview',
      header: '',
      render: (c) => (selecting ? (
        <input type="checkbox" checked={selected.has(c.id)} aria-label={`Select ${c.title}`} onClick={(e) => e.stopPropagation()} onChange={() => toggle(c)} />
      ) : c.treatment ? <span class="img-row-thumb"><Thumb src={host.data.thumb({ sha: c.treatment.sha, path: c.treatment.path })} alt="" /></span> : <span class="muted">none</span>),
    },
    { key: 'title', header: 'Title', render: (c) => (host.pick ? c.title : <Anchor view="record" id={c.id}>{c.title}</Anchor>), sort: (a, b) => a.title.localeCompare(b.title) },
    { key: 'service', header: 'Service', render: (c) => c.service, sort: (a, b) => a.service.localeCompare(b.service) },
    { key: 'category', header: 'Category', render: (c) => c.category },
    { key: 'collection', header: 'Collection', render: (c) => COLLECTION_LABEL[c.collection] ?? c.collection },
    { key: 'style', header: 'Style', render: (c) => styleLabel(names, c.style) },
    { key: 'state', header: 'Status', render: (c) => <StateBadge state={c.state} raw={c.status} /> },
    { key: 'size', header: 'Size', render: (c) => (c.treatment ? `${c.treatment.w ?? '?'} × ${c.treatment.h ?? '?'} · ${bytesLabel(c.treatment.bytes)}` : ''), sort: (a, b) => (a.treatment?.bytes ?? 0) - (b.treatment?.bytes ?? 0) },
    { key: 'styles', header: 'Styles', render: (c) => String(c.treatmentCount) },
  ];

  return (
    <div class="stack">
      <Tabs label="Collections" value={collection} onChange={pickCollection} items={COLLECTION_ORDER.map((id) => ({ id, label: tabLabel(id, facets) }))} />
      {collection === 'diagrams' && facets?.diagramsByStyle && (
        <p class="muted small img-coverage" aria-label="Diagram coverage by style">
          {orderStyles(Object.keys(facets.diagramsByStyle))
            .map((s) => `${styleLabel(names, s)} ${facets.diagramsByStyle?.[s]?.present ?? 0} present, ${facets.diagramsByStyle?.[s]?.missing ?? 0} missing`)
            .join(' · ')}
        </p>
      )}
      <FilterBar
        search={search}
        onSearch={setSearch}
        searchLabel="Search images"
        selects={selects}
        onSelect={(name, value) => host.setQuery({ [name]: value || undefined, ...(name === 'category' ? { service: undefined } : {}) })}
      >
        {collection === 'diagrams' && (
          <label class="img-check" title="Diagrams with no file in the selected style">
            <input type="checkbox" checked={filters.gaps === '1'} onChange={(e) => host.setQuery({ gaps: (e.target as HTMLInputElement).checked ? '1' : undefined })} />
            Gaps
          </label>
        )}
        <Button variant="ghost" disabled={!hasFilters} help="Clears the search and all filters so every image shows again. Nothing is changed in the library." onClick={() => { setSearch(''); host.setQuery({ q: undefined, category: undefined, service: undefined, style: undefined, status: undefined, gaps: undefined }); }}>
          Reset
        </Button>
        <span class="toolbar-spacer" />
        {removable && (
          <>
            <Button small variant="ghost" aria-pressed={selecting} help={selecting ? 'Leaves selection mode and clears the images you ticked. Nothing is removed.' : 'Lets you tick several images at once so you can remove them together. Nothing is removed until you confirm.'} onClick={() => (selecting ? stopSelecting() : setSelecting(true))}>
              {selecting ? 'Done selecting' : 'Select'}
            </Button>
            <Button small variant="danger" help="Opens a window listing every image you rejected. Confirming archives their files outside the repo, checks them, deletes them from the repo and drops them from the catalog. They can be restored from the archive record." onClick={() => setRemoving({ req: { rejected: true }, label: 'all rejected images' })}>
              Remove all rejected
            </Button>
          </>
        )}
        <div class="img-seg" role="group" aria-label="Layout">
          <Button small variant="ghost" aria-pressed={layout === 'grid'} help="Shows the images as a grid of pictures. Nothing is changed." onClick={() => host.setQuery({ layout: undefined })}>
            Grid
          </Button>
          <Button small variant="ghost" aria-pressed={layout === 'table'} help="Shows the images as a table with their details. Nothing is changed." onClick={() => host.setQuery({ layout: 'table' })}>
            Table
          </Button>
        </div>
      </FilterBar>
      {stale && <StaleBanner onReload={() => { setSeen(host.changeToken); setReload((n) => n + 1); }} />}
      <p class="muted img-count" role="status" aria-live="polite">
        {paged.loading && !paged.items.length ? 'Loading' : `${paged.items.length.toLocaleString('en-US')} of ${paged.total.toLocaleString('en-US')}`}
      </p>
      {paged.error && <p role="alert" class="img-error">{paged.error}</p>}
      {!paged.loading && !paged.items.length && !paged.error ? (
        <EmptyState>No images match.</EmptyState>
      ) : layout === 'table' ? (
        <Table
          columns={columns}
          rows={paged.items}
          rowKey={(c) => c.id}
          {...(selecting ? { onRowClick: toggle } : host.pick ? { onRowClick: setPicked } : { onRowClick: (c: CardData) => host.go(host.href('record', c.id)) })}
          rowLabel={(c) => `${selecting ? 'Select' : host.pick ? 'Choose' : 'Open'} ${c.title}`}
        />
      ) : (
        <div class="img-grid">
          {paged.items.map((c) => (
            <Card key={c.id} card={c} names={names} {...(selecting ? { onSelect: toggle, selected: selected.has(c.id) } : host.pick ? { onPick: setPicked } : {})} />
          ))}
        </div>
      )}
      <Sentinel onNear={more} watch={paged.items.length} />
      {picked && <PickBar card={picked} onClose={() => setPicked(null)} />}
      {selecting && (
        <div class="img-pick img-select-bar glass" role="region" aria-label="Selected images">
          <div class="img-pick-main">
            <strong>{selected.size.toLocaleString('en-US')} selected</strong>
            <span class="muted small">Remove archives the files outside the repo first.</span>
          </div>
          <Button small variant="ghost" help="Ticks every image currently shown on this page. Nothing is removed." onClick={() => setSelected(new Map(paged.items.map((c) => [c.id, c])))}>
            Select all shown
          </Button>
          <Button small variant="ghost" disabled={!selected.size} help="Unticks all the images you selected. Nothing is removed." onClick={() => setSelected(new Map())}>
            Clear
          </Button>
          <Button variant="danger" disabled={!selected.size} help="Opens a window listing the ticked images. Confirming archives their files outside the repo, checks them, deletes them from the repo and drops them from the catalog. They can be restored from the archive record." onClick={() => setRemoving({ req: { ids: [...selected.keys()] }, label: `${selected.size} image${selected.size === 1 ? '' : 's'}` })}>
            Remove {selected.size || ''}
          </Button>
        </div>
      )}
      {removing && (
        <RemoveDialog
          request={removing.req}
          label={removing.label}
          onClose={() => setRemoving(null)}
          onDone={() => {
            setRemoving(null);
            stopSelecting();
            setReload((n) => n + 1);
          }}
        />
      )}
    </div>
  );
}
