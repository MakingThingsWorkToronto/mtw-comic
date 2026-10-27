// Migrated from the "Preserved image context and review evidence" section of wiki/image-library/all-files.html
// (producer generated_files, maintain_library.py L260-275): evidence images, kept out of the creative list.
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { FilterBar } from '../../../web/ui/FilterBar';
import { EmptyState } from '../../../web/ui/Layout';
import { bytesLabel } from '../shared/filter';
import type { EvidenceItem } from '../shared/types';
import { Thumb, useDebounced } from './common';
import { useHost } from './host';
import { Viewer } from './Viewer';

const PAGE = 60;

export function Evidence() {
  const host = useHost();
  const group = host.query.get('group') ?? '';
  const q = host.query.get('q') ?? '';
  const [search, setSearch] = useState(q);
  const debounced = useDebounced(search, 220);
  useEffect(() => {
    if (debounced !== q) host.setQuery({ q: debounced || undefined });
  }, [debounced]);

  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [groups, setGroups] = useState<{ value: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<EvidenceItem | null>(null);
  const run = useRef(0);
  const ref = useRef({ items, total, loading });
  ref.current = { items, total, loading };

  useEffect(() => {
    const id = ++run.current;
    setItems([]);
    setLoading(true);
    void host.data.evidence({ q, group, offset: 0, limit: PAGE }).then((r) => {
      if (run.current !== id) return;
      setItems(r.items);
      setTotal(r.total);
      setGroups(r.groups);
      setLoading(false);
    });
  }, [q, group, host.data]);

  const more = useCallback(() => {
    const cur = ref.current;
    if (cur.loading || cur.items.length >= cur.total) return;
    const id = run.current;
    setLoading(true);
    void host.data.evidence({ q, group, offset: cur.items.length, limit: PAGE }).then((r) => {
      if (run.current !== id) return;
      setItems((prev) => [...prev, ...r.items]);
      setLoading(false);
    });
  }, [q, group, host.data]);

  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && more(), { rootMargin: '800px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [more, items.length]);

  return (
    <div class="stack">
      <FilterBar
        search={search}
        onSearch={setSearch}
        searchLabel="Search evidence"
        selects={[{ name: 'group', label: 'Group', value: group, options: [{ value: '', label: 'All groups' }, ...groups.map((g) => ({ value: g.value, label: `${g.value} (${g.count})` }))] }]}
        onSelect={(name, value) => host.setQuery({ [name]: value || undefined })}
      />
      <p class="muted img-count" role="status" aria-live="polite">
        {loading && !items.length ? 'Loading' : `${items.length.toLocaleString('en-US')} of ${total.toLocaleString('en-US')}`}
      </p>
      {!loading && !items.length ? (
        <EmptyState>No evidence images match.</EmptyState>
      ) : (
        <div class="img-grid img-grid--evidence">
          {items.map((e) => (
            <article class="img-card" key={e.path}>
              <button type="button" class="img-card-preview" aria-label={`Open ${e.name}`} title="Shows this evidence image full size in a window. Nothing is changed." onClick={() => setViewing(e)}>
                <Thumb src={host.data.thumb({ sha: e.sha, path: e.path })} alt={e.name} />
              </button>
              <div class="img-card-info">
                <p class="img-card-service">{e.group}</p>
                <p class="img-evidence-name" title={e.path}>{e.name}</p>
                <p class="muted">{bytesLabel(e.bytes)}</p>
              </div>
            </article>
          ))}
        </div>
      )}
      <div ref={sentinel} class="img-sentinel" aria-hidden="true" />
      {viewing && <Viewer title={viewing.name} path={viewing.path} onClose={() => setViewing(null)} />}
    </div>
  );
}
