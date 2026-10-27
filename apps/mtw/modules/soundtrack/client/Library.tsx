// Migrated from retired git 51eb6e03:wiki/soundtrack-library/index.html (filters, renderList, the counts strip).
import { useMemo, useState } from 'preact/hooks';
import { Link } from '../../../web/shell/Link';
import { buildUrl } from '../../../web/shell/route';
import { navigate, setQuery } from '../../../web/shell/router';
import { Badge, Button, EmptyState, FilterBar, Table } from '../../../web/ui';
import type { BadgeStatus, Column } from '../../../web/ui';
import type { ViewProps } from '../../types';
import type { Track } from '../types';
import { act, busy, library, loadError, saveError, trackItem } from './data';
import { DEFAULT_FILTERS, FEEL_OPTIONS, RATING_OPTIONS, SORTS, STATUS_OPTIONS, filterTracks, filtersFromQuery, GENRES, queryPatch } from './filters';
import type { Filters } from './filters';
import { nextRow, rowAction } from './keyboard';
import { loaded, play, toggle } from './player';
import { fmtTime } from './profile';
import { Spark, Stars } from './Stars';
import { TrackDetail } from './TrackDetail';

const STATUS_BADGE: Record<string, BadgeStatus> = { approved: 'approved', candidate: 'candidate', 'needs source': 'pending', withdrawn: 'rejected' };

/** Filters live in the URL, except in a picker dialog where they are local (the dialog has no URL of its own). */
function useFilters(query: URLSearchParams, pick: ViewProps['pick']): [Filters, (key: keyof Filters, value: string) => void] {
  const [local, setLocal] = useState<Filters>({ ...DEFAULT_FILTERS, ...(pick ? { status: 'approved' } : {}) });
  const filters = pick ? local : filtersFromQuery(query);
  const set = (key: keyof Filters, value: string) => (pick ? setLocal((f) => ({ ...f, [key]: value })) : setQuery(queryPatch(key, value)));
  return [filters, set];
}

export function CountsStrip() {
  const lib = library.value;
  if (!lib) return null;
  const c = lib.counts;
  return (
    <div class="row snd-counts" aria-label="Library counts">
      <Badge status="pending">{c.tracks} tracks</Badge>
      <Badge status="approved">{c.approved} approved</Badge>
      <Badge status="candidate">{c.candidates} to review</Badge>
      <Badge status="pending">{c.profiled} profiled</Badge>
    </div>
  );
}

export function MusicView({ path, query, pick }: ViewProps) {
  const lib = library.value;
  const [filters, setFilter] = useFilters(query, pick);
  const selectedId = !pick && path[0] === 'track' ? path[1] : undefined;
  const tracks = lib?.tracks ?? [];
  const rows = useMemo(() => filterTracks(tracks, filters), [tracks, filters.q, filters.genre, filters.feel, filters.bmin, filters.bmax, filters.status, filters.rating, filters.found, filters.sort]);
  const genres = useMemo(() => GENRES(tracks), [tracks]);
  const selected = selectedId ? tracks.find((t) => t.id === selectedId) : undefined;
  const detailUrl = (t: Track) => buildUrl('soundtrack', ['track', t.id], query);
  const listUrl = buildUrl('soundtrack', [], query);

  const activate = (t: Track) => {
    const item = trackItem(t);
    if (rowAction(loaded.value?.key ?? null, item.key) === 'toggle') toggle();
    else play(item);
    if (!pick) navigate(detailUrl(t));
  };

  const columns: Column<Track>[] = [
    {
      key: 'track',
      header: 'Track',
      render: (t) => (
        <div class="snd-title">
          <span class="snd-title-line">
            {pick ? <span>{t.title}</span> : (
              <Link href={detailUrl(t)} aria-current={t.id === selectedId ? 'true' : undefined}>
                {t.title}
              </Link>
            )}
            {t.status !== 'approved' && <Badge status={STATUS_BADGE[t.status] ?? 'pending'}>{t.status}</Badge>}
          </span>
          <span class="muted">{[t.artist, t.provider, t.genre].filter(Boolean).join(' · ')}</span>
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (t) => <Stars subject={t.title} value={t.rating || 0} disabled={busy.value.has(t.id)} onRate={(r) => void act(t.id, 'rate', r)} />,
    },
    { key: 'energy', header: 'Energy', render: (t) => <Spark energy={t.energy} /> },
    { key: 'bpm', header: 'BPM', render: (t) => (t.beatMap ? t.beatMap.bpm : 'not profiled') },
    { key: 'length', header: 'Length', render: (t) => (t.beatMap ? fmtTime(t.beatMap.duration) : '') },
    { key: 'feel', header: 'Feel', render: (t) => t.summary?.feel ?? '' },
    {
      key: 'action',
      header: '',
      align: 'actions',
      render: (t) =>
        pick ? (
          <Button
            small
            variant="primary"
            disabled={t.status !== 'approved'}
            help={t.status === 'approved' ? 'Uses this track for the field you came from. The music library itself is not changed.' : 'Only approved tracks can be chosen. Approve this track first.'}
            aria-label={`Choose ${t.title}`}
            onClick={(e) => {
              e.stopPropagation();
              pick.onPick(`snd:${t.id}`);
            }}
          >
            Choose
          </Button>
        ) : t.status === 'candidate' ? (
          <Button
            small
            variant="primary"
            disabled={busy.value.has(t.id)}
            aria-label={`Approve ${t.title}`}
            help="Marks this candidate track as approved for use, once its credit and licence are on file. It only records your decision; the audio file is not changed, and you can undo it until a page uses the track."
            onClick={(e) => {
              e.stopPropagation();
              void act(t.id, 'approve');
            }}
          >
            Approve
          </Button>
        ) : null,
    },
  ];

  const onListKeyDown = (e: KeyboardEvent) => {
    const row = (e.target as HTMLElement).closest('tr');
    if (!row || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
    const all = [...(e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('tbody tr')];
    const next = nextRow(all.indexOf(row), all.length, e.key);
    if (next === null) return;
    e.preventDefault();
    all[next]?.focus();
  };

  const runs = lib?.discovery.runs ?? [];

  const nowKey = loaded.value?.key;
  const preview = !selectedId && !pick ? (tracks.find((t) => `snd:${t.id}` === nowKey) ?? rows[0]) : undefined;

  return (
    <>
      <FilterBar
        class="snd-filters"
        search={filters.q}
        onSearch={(v) => setFilter('q', v)}
        searchLabel="Search title, artist, genre"
        onSelect={(name, value) => setFilter(name as keyof Filters, value)}
        selects={[
          { name: 'genre', label: 'Genre', value: filters.genre, options: [{ value: '', label: 'Any genre' }, ...genres.map((g) => ({ value: g, label: g }))] },
          { name: 'feel', label: 'Feel', value: filters.feel, options: FEEL_OPTIONS },
          { name: 'status', label: 'Status', value: filters.status, options: STATUS_OPTIONS },
          { name: 'rating', label: 'Rating', value: filters.rating, options: RATING_OPTIONS },
          { name: 'found', label: 'Found by', value: filters.found, options: [{ value: '', label: 'Any run' }, ...runs.map((r) => ({ value: r.id, label: r.label }))] },
        ]}
      >
        <span class="snd-range">
          <label for="snd-bmin">BPM</label>
          <input id="snd-bmin" class="input" type="number" inputMode="numeric" placeholder="min" value={filters.bmin} onInput={(e) => setFilter('bmin', (e.target as HTMLInputElement).value)} />
          <span aria-hidden="true">to</span>
          <input class="input" type="number" inputMode="numeric" placeholder="max" aria-label="Maximum BPM" value={filters.bmax} onInput={(e) => setFilter('bmax', (e.target as HTMLInputElement).value)} />
        </span>
        <span class="snd-range">
          <label for="snd-sort">Sort</label>
          <select id="snd-sort" class="select" value={filters.sort} onChange={(e) => setFilter('sort', (e.target as HTMLSelectElement).value)}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </span>
      </FilterBar>
    <div class="snd-split" data-detail={selectedId ? 'true' : 'false'}>
      <div class="snd-list stack">
        {saveError.value && (
          <p role="alert" class="snd-error">
            {saveError.value}
          </p>
        )}
        {loadError.value && (
          <p role="alert" class="snd-error">
            {loadError.value}
          </p>
        )}
        {!lib ? (
          <EmptyState>Loading.</EmptyState>
        ) : (
          <div class="snd-table" onKeyDown={onListKeyDown}>
            <Table columns={columns} rows={rows} rowKey={(t) => t.id} onRowClick={activate} rowLabel={(t) => `${t.title} by ${t.artist}`} empty="No tracks match these filters." />
          </div>
        )}
        <p class="muted snd-shown" aria-live="polite">
          {lib ? `${rows.length} of ${tracks.length} shown` : ''}
        </p>
      </div>
      {!pick && (
        <div class="snd-detail-pane">
          {selectedId ? (
            !lib ? (
              <EmptyState>Loading.</EmptyState>
            ) : selected ? (
              <TrackDetail key={selected.id} track={selected} backHref={listUrl} />
            ) : (
              <EmptyState>No track with the id "{selectedId}".</EmptyState>
            )
          ) : preview ? (
            <TrackDetail key={preview.id} track={preview} backHref={listUrl} />
          ) : (
            <EmptyState>No tracks to show.</EmptyState>
          )}
        </div>
      )}
    </div>
    </>
  );
}
