// Migrated from retired git 51eb6e03:wiki/soundtrack-library/comic-audio-console.js: dialogue, auditions, ambience,
// effects, provider previews. Every clip is approved unless Matt rejects it here (comic-audio-review.json).
import { useMemo, useState } from 'preact/hooks';
import { setQuery } from '../../../web/shell/router';
import { Badge, Button, Dialog, EmptyState, FilterBar, IconButton, Table } from '../../../web/ui';
import type { Column } from '../../../web/ui';
import { comicPrefix } from '../prefix';
import type { ViewProps } from '../../types';
import type { ComicAudioRecord, MediaRef } from '../types';
import { TYPE_LABELS, approvalOf, filterRecords, sortRecords } from './comic-filters';
import type { ComicFilters } from './comic-filters';
import { busy, comicAudio, comicSrc, reviewComic, saveError } from './data';
import { loaded, play, playing, toggle } from './player';
import { fmtTime } from './profile';

const refOf = (r: ComicAudioRecord) => `${comicPrefix(r.type)}:${r.id}`;
const cap = (s: string) => (s ? s[0]!.toUpperCase() + s.slice(1) : s);

/** "Home · brief", once per story and scene, from a clip's story references or its authored uses. */
function usedIn(r: ComicAudioRecord): string[] {
  const refs = [...(r.sourceRefs ?? []), ...((r.uses ?? []) as { story?: string; scene?: string }[])];
  return Array.from(new Set(refs.filter((x) => x?.story).map((x) => [cap(x.story as string), x.scene?.replace(/-/g, ' ')].filter(Boolean).join(' · '))));
}

function PlayButton({ r }: { r: ComicAudioRecord }) {
  if (!r.media) return <span class="muted" title="Played live by the comic; there is no recorded file">live</span>;
  const on = loaded.value?.key === refOf(r) && playing.value;
  return (
    <IconButton
      label={`${on ? 'Pause' : 'Play'} ${r.title}`}
      glyph={on ? 'pause' : 'play'}
      help={on ? 'Pauses this sound.' : 'Plays this sound through the player at the bottom of the page. Nothing is changed.'}
      onClick={(e) => {
        e.stopPropagation();
        if (loaded.value?.key === refOf(r)) toggle();
        else play({ key: refOf(r), src: comicSrc((r.media as MediaRef).path), title: r.title, subtitle: TYPE_LABELS[r.type] ?? r.type, ...(r.durationSeconds ? { duration: r.durationSeconds } : {}) });
      }}
    />
  );
}

function ReviewButton({ r }: { r: ComicAudioRecord }) {
  const approved = approvalOf(r) === 'approved';
  return (
    <Button
      small
      variant={approved ? 'secondary' : 'primary'}
      disabled={busy.value.has(r.id)}
      aria-label={`${approved ? 'Reject' : 'Approve'} ${r.title}`}
      help={
        approved
          ? 'Marks this clip as rejected so it is not used. The audio file is kept, and you can approve it again.'
          : 'Approves this clip for use again. The audio file is not changed.'
      }
      onClick={(e) => {
        e.stopPropagation();
        void reviewComic(r.id, approved ? 'rejected' : 'approved');
      }}
    >
      {approved ? 'Reject' : 'Approve'}
    </Button>
  );
}

const ApprovalBadge = ({ r }: { r: ComicAudioRecord }) => <Badge status={approvalOf(r)}>{approvalOf(r)}</Badge>;

function FileLink({ media, label }: { media: MediaRef | null | undefined; label: string }) {
  if (!media) return null;
  return (
    <li>
      <a href={comicSrc(media.path)} target="_blank" rel="noopener">
        {label}
      </a>
    </li>
  );
}

function RecordDialog({ r, onClose }: { r: ComicAudioRecord; onClose: () => void }) {
  const voice = (r.settings as { voiceName?: string } | null | undefined)?.voiceName;
  const where = usedIn(r);
  const facts: [string, string][] = [
    ['Type', TYPE_LABELS[r.type] ?? r.type],
    ...(r.character ? ([['Character', r.character]] as [string, string][]) : []),
    ['Source', [r.provider, voice].filter(Boolean).join(' · ')],
    ...(r.durationSeconds ? ([['Length', fmtTime(r.durationSeconds)]] as [string, string][]) : []),
    ...(where.length ? ([['Used in', where.slice(0, 6).join(', ') + (where.length > 6 ? ` and ${where.length - 6} more` : '')]] as [string, string][]) : []),
  ];
  const decided = r.approvalDecided?.at ? ` on ${r.approvalDecided.at.slice(0, 10)}` : ' by default';
  return (
    <Dialog title={r.title} wide onClose={onClose}>
      <p class="snd-lead">{r.description}</p>
      <div class="row snd-review-row">
        <PlayButton r={r} />
        <ApprovalBadge r={r} />
        <span class="muted">
          {cap(approvalOf(r))}
          {decided}
        </span>
        <ReviewButton r={r} />
      </div>
      <dl class="snd-facts">
        {facts.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <details>
        <summary>Technical details</summary>
        <ul class="snd-files">
          <FileLink media={r.media} label="Recording" />
          <FileLink media={r.original} label="Original generation" />
          <FileLink media={r.receipt} label="Generation receipt" />
          <FileLink media={r.normalizedReceipt} label="Loudness normalization" />
          <FileLink media={r.encodedReceipt} label="Encoded measurements" />
          <FileLink media={r.monoReceipt} label="Mono check" />
          {!r.media && r.runtime && <FileLink media={{ path: r.runtime.path }} label="Comic sound engine" />}
        </ul>
        {r.integratedLufs != null && (
          <p class="muted">
            Loudness {r.integratedLufs} LUFS, peak {r.truePeakDbfs} dBTP
          </p>
        )}
        {r.settings != null && <pre class="snd-pre">{JSON.stringify({ voiceId: r.voiceId, delivery: r.delivery, settings: r.settings }, null, 2)}</pre>}
        {!r.media && r.runtime?.functionSource && <pre class="snd-pre">{r.runtime.functionSource}</pre>}
      </details>
    </Dialog>
  );
}

/** The comic-audio view. In a picker it lists one asset prefix's records and offers Choose. */
export function ComicAudioView({ query, pick }: ViewProps) {
  const data = comicAudio.value;
  const [local, setLocal] = useState<ComicFilters>({ q: '', type: '', character: '', provider: '', approval: pick ? 'approved' : '' });
  const filters: ComicFilters = pick
    ? local
    : { q: query.get('q') ?? '', type: query.get('type') ?? '', character: query.get('character') ?? '', provider: query.get('provider') ?? '', approval: query.get('approval') ?? '' };
  const setFilter = (key: keyof ComicFilters, value: string) => (pick ? setLocal((f) => ({ ...f, [key]: value })) : setQuery({ [key]: value }));
  const [openId, setOpenId] = useState<string | null>(null);

  const scope = useMemo(() => sortRecords((data?.records ?? []).filter((r) => !pick || comicPrefix(r.type) === pick.assetType)), [data, pick]);
  const rows = useMemo(() => filterRecords(scope, filters), [scope, filters.q, filters.type, filters.character, filters.provider, filters.approval]);
  const types = useMemo(() => Array.from(new Set(scope.map((r) => r.type))), [scope]);
  const characters = useMemo(() => {
    const names = new Map<string, string>();
    for (const r of scope) if (r.characterId) names.set(r.characterId, r.character ?? r.characterId);
    return Array.from(names).sort((a, b) => a[1].localeCompare(b[1]));
  }, [scope]);
  const providers = useMemo(() => Array.from(new Set(scope.map((r) => r.provider))).sort(), [scope]);

  if (!data) return <EmptyState>Loading.</EmptyState>;
  const rejected = scope.filter((r) => approvalOf(r) === 'rejected').length;
  // The open record is looked up live, so an Approve/Reject click inside the dialog shows at once.
  const open = openId ? scope.find((r) => r.id === openId) : undefined;

  const columns: Column<ComicAudioRecord>[] = [
    { key: 'play', header: '', render: (r) => <PlayButton r={r} /> },
    {
      key: 'title',
      header: 'Clip',
      render: (r) => (
        <div class="snd-title">
          <span class="snd-title-line">{r.title}</span>
          {r.description && <span class="muted snd-quote-line">{r.description}</span>}
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (r) => TYPE_LABELS[r.type] ?? r.type },
    { key: 'character', header: 'Character', render: (r) => r.character ?? '' },
    { key: 'provider', header: 'Source', render: (r) => r.provider },
    { key: 'length', header: 'Length', render: (r) => (r.durationSeconds ? fmtTime(r.durationSeconds) : '') },
    { key: 'status', header: 'Status', render: (r) => <ApprovalBadge r={r} /> },
    {
      key: 'action',
      header: '',
      align: 'actions',
      render: (r) =>
        pick ? (
          <Button
            small
            variant="primary"
            disabled={approvalOf(r) === 'rejected'}
            aria-label={`Choose ${r.title}`}
            help={approvalOf(r) === 'rejected' ? 'This clip was rejected. Approve it first to use it.' : 'Uses this sound for the field you came from. The sound library itself is not changed.'}
            onClick={(e) => {
              e.stopPropagation();
              pick.onPick(refOf(r));
            }}
          >
            Choose
          </Button>
        ) : (
          <ReviewButton r={r} />
        ),
    },
  ];

  return (
    <div class="stack">
      <FilterBar
        search={filters.q}
        onSearch={(v) => setFilter('q', v)}
        searchLabel="Search descriptions, words, characters"
        onSelect={(name, value) => setFilter(name as keyof ComicFilters, value)}
        selects={[
          { name: 'type', label: 'Type', value: filters.type, options: [{ value: '', label: 'Any type' }, ...types.map((t) => ({ value: t, label: TYPE_LABELS[t] ?? t }))] },
          { name: 'character', label: 'Character', value: filters.character, options: [{ value: '', label: 'Any character' }, ...characters.map(([id, name]) => ({ value: id, label: name }))] },
          { name: 'provider', label: 'Source', value: filters.provider, options: [{ value: '', label: 'Any source' }, ...providers.map((p) => ({ value: p, label: p }))] },
          {
            name: 'approval',
            label: 'Status',
            value: filters.approval,
            options: [
              { value: '', label: 'Any status' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ],
          },
        ]}
      />
      {saveError.value && (
        <p role="alert" class="snd-error">
          {saveError.value}
        </p>
      )}
      <p class="muted" aria-live="polite">
        {rows.length} of {scope.length} clips
        {!pick && ` · ${scope.length - rejected} approved · ${rejected} rejected`}
      </p>
      <div class="snd-table snd-table--comic">
        <Table columns={columns} rows={rows} rowKey={(r) => r.id} onRowClick={(r) => setOpenId(r.id)} rowLabel={(r) => `${r.title}, details`} empty="No clips match these filters." />
      </div>
      {open && <RecordDialog r={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}
