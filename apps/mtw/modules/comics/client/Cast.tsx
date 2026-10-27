import { useEffect, useMemo, useState } from 'preact/hooks';
import { buildUrl } from '../../../web/shell/route';
import { Link } from '../../../web/shell/Link';
import { setQuery } from '../../../web/shell/router';
import { AudioPlayer, Badge, Button, Dialog, EmptyState, FilterBar, ImageViewer, Table } from '../../../web/ui';
import type { Column } from '../../../web/ui';
import { VoiceCompare } from './Compare';
import { OpButton } from './OpButton';
import { post, useView } from './hooks';
import { chosenBadge, chosenClips, matchesVoiceFilter, timelineLine, voiceStateBadge } from './casting-view';
import { EffectVoices } from './Effects';
import { SystemVoiceAudition } from './SystemVoice';
import { useReferenceSlot, useSlotRecords } from './slotProbe';
import { SlotDecision } from './SlotDecision';
import type { CastDetail, CastRow, VoiceView } from './types';

const GROUPS = ['mentor', 'hero', 'operator', 'antagonist', 'villain', 'system', 'narration', 'background', 'reference'];

export function CastList({ query }: { query: URLSearchParams }) {
  const { data, error } = useView<{ characters: CastRow[] }>('/api/comics/cast');
  const q = query.get('q') ?? '';
  const group = query.get('group') ?? '';
  const voice = query.get('voice') ?? '';
  const rows = useMemo(
    () =>
      (data?.characters ?? []).filter(
        (c) =>
          (!q || `${c.name} ${c.role}`.toLowerCase().includes(q.toLowerCase())) &&
          (!group || c.group === group) &&
          matchesVoiceFilter(c, voice),
      ),
    [data, q, group, voice],
  );
  if (error) return <EmptyState>{error}</EmptyState>;
  if (!data) return <EmptyState>Loading.</EmptyState>;
  const columns: Column<CastRow>[] = [
    { key: 'portrait', header: 'Model', render: (c) => (c.portrait ? <span class="stack"><ImageViewer src={c.portrait} alt={`${c.name} model sheet${c.slotVersion ? ` v${c.slotVersion}` : ''}`} />{c.awaitingRegistration && <Badge status="pending">v{c.slotVersion} awaiting registration</Badge>}</span> : <span class="muted">none</span>) },
    { key: 'name', header: 'Name', render: (c) => <Link href={buildUrl('comics', ['cast', c.id])}>{c.name}</Link>, sort: (a, b) => a.name.localeCompare(b.name) },
    { key: 'group', header: 'Group', render: (c) => c.group, sort: (a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group) },
    { key: 'role', header: 'Role', render: (c) => <span title={c.role}>{c.role}</span> },
    {
      key: 'voice',
      header: 'Voice',
      render: (c) =>
        c.voice ? (
          <span class="row">
            <Badge status={chosenBadge(c.voice)?.status ?? 'approved'}>{c.voice.name}</Badge>
            {c.voice.held && <span class="muted small">held for preview review</span>}
          </span>
        ) : c.voiceUse ? <span class="muted">{c.voiceUse}</span> : c.shortlist ? <Badge status="candidate">{`${c.shortlist} shortlisted`}</Badge> : <span class="muted">Unvoiced</span>,
    },
    { key: 'in', header: 'Speaks in', render: (c) => c.speakingIn.join(', ') || '-' },
  ];
  return (
    <div class="stack">
      <FilterBar
        search={q}
        onSearch={(v) => setQuery({ q: v })}
        searchLabel="Search characters"
        selects={[
          { name: 'group', label: 'Group', value: group, options: [{ value: '', label: 'All groups' }, ...GROUPS.map((g) => ({ value: g, label: g }))] },
          { name: 'voice', label: 'Voice', value: voice, options: [{ value: '', label: 'Any voice' }, { value: 'selected', label: 'Selected' }, { value: 'held', label: 'Held for preview' }, { value: 'shortlisted', label: 'Shortlisted' }, { value: 'unvoiced', label: 'Unvoiced' }] },
        ]}
        onSelect={(name, value) => setQuery({ [name]: value })}
      />
      <Table columns={columns} rows={rows} rowKey={(c) => c.id} defaultSort={{ key: 'group', dir: 'asc' }} empty="No characters match." />
      <EffectVoices />
    </div>
  );
}

const FIELDS = [
  ['delivery', 'Delivery'],
  ['pace', 'Pace'],
  ['pitch', 'Pitch'],
  ['accent', 'Accent'],
  ['pronunciations', 'Pronunciations'],
  ['sampleLine', 'Sample line'],
  ['notes', 'Notes'],
] as const;

function ProfileForm({ detail, onSaved }: { detail: CastDetail; onSaved: () => void }) {
  const profile = detail.profile;
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dirty = Object.keys(draft).length > 0;
  useEffect(() => setDraft({}), [detail.id]);
  if (!profile) return <EmptyState>No voice profile.</EmptyState>;
  const save = async () => {
    setBusy(true);
    setError('');
    try {
      await post(`/api/comics/cast/${encodeURIComponent(detail.id)}/profile`, { fields: draft });
      setDraft({});
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form class="stack" onSubmit={(e) => { e.preventDefault(); if (dirty && !busy) void save(); }}>
      <div class="profile-grid">
        {FIELDS.map(([name, label]) => (
          <div class={`field${name === 'delivery' || name === 'notes' ? ' wide' : ''}`} key={name}>
            <label for={`pf-${name}`}>{label}</label>
            <textarea id={`pf-${name}`} class="input area" rows={name === 'delivery' || name === 'notes' ? 2 : 1} value={draft[name] ?? profile[name]} onInput={(e) => setDraft((d) => ({ ...d, [name]: (e.target as HTMLTextAreaElement).value }))} />
          </div>
        ))}
      </div>
      <div class="row">
        <Button type="submit" variant="primary" disabled={!dirty || busy} help="Saves your changes to this character's voice notes (delivery, accent and so on). It does not choose a voice or generate any audio.">
          Save profile
        </Button>
        {dirty && (
          <Button variant="ghost" help="Throws away your unsaved changes to the voice notes and goes back to what is saved." onClick={() => setDraft({})}>
            Discard
          </Button>
        )}
        {error && <span class="error">{error}</span>}
      </div>
    </form>
  );
}

/** Cast detail. `?compare=` holds up to three voice refs being compared, so a comparison is a shareable link. */
export function CastDetailView({ id, query }: { id: string; query: URLSearchParams }) {
  const [dirtyHold, setDirtyHold] = useState(false);
  const { data, error, reload, changed } = useView<CastDetail>(`/api/comics/cast/${encodeURIComponent(id)}`, dirtyHold);
  const slot = useReferenceSlot(data);
  const slotRecords = useSlotRecords(slot);
  const [filter, setFilter] = useState('');
  const [only, setOnly] = useState('');
  const [confirm, setConfirm] = useState<VoiceView | null>(null);
  const [problem, setProblem] = useState('');
  const [busy, setBusy] = useState(false);
  const compare = (query.get('compare') ?? '').split(',').filter(Boolean).slice(0, 3);
  const setCompare = (refs: string[]) => setQuery({ compare: refs.join(',') });

  if (error) return <EmptyState>{error}</EmptyState>;
  if (!data) return <EmptyState>Loading.</EmptyState>;

  const act = async (job: () => Promise<unknown>) => {
    setBusy(true);
    setProblem('');
    try {
      await job();
      reload();
    } catch (e) {
      setProblem((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const visibleClips = chosenClips(data.clips, data.choice?.voice ?? data.voice);
  const shortlist = (v: VoiceView, on: boolean) => act(() => post(`/api/comics/cast/${encodeURIComponent(id)}/shortlist`, { voiceId: v.voiceId, on }));
  const select = (v: VoiceView) =>
    act(async () => {
      await post(`/api/comics/cast/${encodeURIComponent(id)}/select`, { voiceId: v.voiceId });
      setConfirm(null);
    });

  const voices = data.voices.filter((v) => (!only || (only === 'shortlist' ? v.state === 'shortlist' || v.state === 'selected' : v.labels.gender === only)) && (!filter || `${v.name} ${v.description} ${Object.values(v.labels).join(' ')}`.toLowerCase().includes(filter.toLowerCase())));
  const columns: Column<VoiceView>[] = [
    { key: 'name', header: 'Voice', render: (v) => <span title={v.description}>{v.name}</span> },
    { key: 'provider', header: 'Provider', render: (v) => v.provider },
    { key: 'labels', header: 'Labels', render: (v) => [v.labels.gender, v.labels.age, v.labels.accent, v.labels.persona ?? v.labels.descriptive].filter(Boolean).join(' · ') },
    { key: 'state', header: 'State', render: (v) => <Badge status={voiceStateBadge(v).status}>{voiceStateBadge(v).label}</Badge> },
    {
      key: 'compare',
      header: 'Compare',
      render: (v) =>
        data.locked ? null : (
          <Button small variant={compare.includes(v.ref) ? 'primary' : 'ghost'} aria-pressed={compare.includes(v.ref)} disabled={!compare.includes(v.ref) && compare.length >= 3} aria-label={`${compare.includes(v.ref) ? 'Remove' : 'Add'} ${v.name} ${compare.includes(v.ref) ? 'from' : 'to'} the comparison`} help={compare.includes(v.ref) ? 'Takes this voice out of the side-by-side comparison. Nothing else changes.' : 'Puts this voice in the side-by-side comparison above (up to three) so you can play them one after another. Nothing is chosen.'} onClick={() => setCompare(compare.includes(v.ref) ? compare.filter((r) => r !== v.ref) : [...compare, v.ref])}>
            {compare.includes(v.ref) ? `Slot ${compare.indexOf(v.ref) + 1}` : 'Compare'}
          </Button>
        ),
    },
    { key: 'play', header: 'Preview', render: (v) => (v.preview ? <AudioPlayer profile="speech" src={v.preview} label={v.name} /> : <span class="muted">no file</span>) },
    {
      key: 'actions',
      header: '',
      align: 'actions',
      render: (v) =>
        data.locked ? null : (
          <span class="row end">
            <Button small variant="ghost" disabled={busy} aria-label={`${v.state === 'shortlist' ? 'Remove' : 'Shortlist'} ${v.name}`} help={v.state === 'shortlist' ? 'Takes this voice off your shortlist for this character. The voice is not deleted.' : 'Adds this voice to your shortlist for this character, so it is easy to find again. It does not choose the voice.'} onClick={() => void shortlist(v, v.state !== 'shortlist')}>
              {v.state === 'shortlist' ? 'Remove' : 'Shortlist'}
            </Button>
            <Button small variant="primary" disabled={busy} aria-label={`Select voice ${v.name}`} help="Opens a window asking you to confirm this voice for the character. Once you confirm, it becomes the character's voice, their speech approvals are reset against it, and the choice is locked." onClick={() => setConfirm(v)}>
              Select voice
            </Button>
          </span>
        ),
    },
  ];

  const newest = slot?.versions[0];
  const older = slot?.versions.slice(1) ?? [];
  return (
    <div class="stack">
      <div class="page-head">
        <div class="title-block">
          <h1>{data.name}</h1>
          <p class="sub">
            {data.group} · {data.role}
          </p>
        </div>
        <div class="row">
          {!data.locked && !data.voiceUse && <OpButton id="comics-audition-voice" params={{ character: `cast:${data.id}` }} label="Audition a voice" help="Opens a terminal where an agent plans a voice audition for this character, reusing earlier previews first, and shows you the plan before it asks the voice service for anything. It never picks the voice for you." />}
          <Link class="btn btn--ghost" href={buildUrl('comics', ['cast'])} title="Goes back to the list of all comic characters. Unsaved changes here are lost.">
            All characters
          </Link>
        </div>
      </div>
      {changed && (
        <p class="notice" role="status">
          Changed on disk. <Button small help="Loads the newer version of this character from disk. Edits you have not saved here are replaced." onClick={() => { setDirtyHold(false); reload(); }}>Reload</Button>
        </p>
      )}
      <div class="cast-head">
        {newest ? (
          <ImageViewer src={newest.preview} alt={`${data.name} model sheet v${newest.version}`} />
        ) : data.portrait ? (
          <ImageViewer src={data.portrait} alt={`${data.name} model sheet`} />
        ) : (
          <span class="muted">No model sheet</span>
        )}
        <div class="stack">
          {newest && (
            <SlotDecision name={data.name} version={newest.version} inUse={newest.registered} usedVersion={slot?.registeredVersion ?? null} record={slotRecords[newest.path]} />
          )}
          {data.model?.shared && <Badge status="pending">shared sheet</Badge>}
          <p class="muted">{data.signature}</p>
          {data.introduction && <p>{data.introduction}</p>}
          <p class="muted small">Speaks in: {data.speakingIn.join(', ') || 'no dialogue'}</p>
          {newest && newest.observations.length > 0 && (
            <details>
              <summary class="small">Author review of v{newest.version} (not your approval)</summary>
              <ul class="small">
                {newest.observations.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
              {newest.unresolved.length > 0 && <p class="muted small">Open: {newest.unresolved.join(' ')}</p>}
            </details>
          )}
          {slot && <p class="muted small">Reference slot: {slot.dir}/{slot.stem}-v&lt;N&gt;</p>}
        </div>
      </div>
      {older.length > 0 && (
        <div class="stack">
          <h3>Earlier versions in this slot</h3>
          <div class="row">
            {older.map((v) => (
              <div class="stack" key={v.path} data-slot-version={v.version}>
                <ImageViewer src={v.preview} alt={`${data.name} model sheet v${v.version}`} />
                <SlotDecision name={data.name} version={v.version} inUse={v.registered} usedVersion={null} record={slotRecords[v.path]} />
              </div>
            ))}
          </div>
        </div>
      )}

      <h2>Voice</h2>
      {data.choice ? (
        <div class="stack choice" data-production-hold={data.choice.held ? 'true' : undefined}>
          <p>
            <Badge status={chosenBadge({ held: data.choice.held })?.status ?? 'approved'}>{chosenBadge({ held: data.choice.held })?.label}</Badge>{' '}
            {data.choice.voice?.name ?? data.voice?.name} ({data.voice?.provider}) <span class="muted small">locked</span>{' '}
            <Button small variant="ghost" disabled={busy} aria-label={`Change voice for ${data.name}`} help="Unlocks this character's voice so you can pick another from the options. The current voice stays in the history and its saved clips are kept." onClick={() => void act(() => post(`/api/comics/cast/${encodeURIComponent(id)}/change`, {}))}>
              Change voice
            </Button>
          </p>
          {data.choice.holdReason && data.choice.held && <p class="muted small">{data.choice.holdReason} Speech generation stays off while held.</p>}
          {data.choice.source && <p class="muted small">{data.choice.source}</p>}
          {data.choice.voice?.preview && <AudioPlayer profile="speech" src={data.choice.voice.preview} label={data.choice.voice.name} />}
        </div>
      ) : data.voiceUse ? (
        <p class="muted">{data.voiceUse}</p>
      ) : null}
      {problem && <p class="error">{problem}</p>}
      {!data.voiceUse && (
        <>
          {!data.locked && compare.length > 0 && <VoiceCompare detail={data} refs={compare} busy={busy} onRemove={(r) => setCompare(compare.filter((x) => x !== r))} onClear={() => setCompare([])} onSelect={setConfirm} />}
          <FilterBar search={filter} onSearch={setFilter} searchLabel="Search voices" selects={[{ name: 'only', label: 'Show', value: only, options: [{ value: '', label: 'All options' }, { value: 'shortlist', label: 'Shortlist' }, { value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }] }]} onSelect={(_n, v) => setOnly(v)} />
          <Table columns={columns} rows={voices} rowKey={(v) => v.ref} empty="No voices match." />
        </>
      )}

      {data.shortlisted.length > 0 && (
        <>
          <h2>Shortlist</h2>
          <ul class="plain">
            {data.shortlisted.map((v) => (
              <li key={v.ref} class="row">
                <span>{v.name}</span>
                <span class="muted small">{v.provider}</span>
                {v.state === 'selected' && <Badge status={voiceStateBadge(v).status}>{voiceStateBadge(v).label}</Badge>}
                {v.preview && <AudioPlayer profile="speech" src={v.preview} label={v.name} />}
              </li>
            ))}
          </ul>
        </>
      )}

      {data.history.length > 0 && (
        <>
          <h2>Choice history</h2>
          <ol class="timeline">
            {data.history.map((e, i) => (
              <li key={`${e.at}-${i}`}>{timelineLine(e)}</li>
            ))}
          </ol>
        </>
      )}

      {visibleClips.length > 0 && (
        <>
          <h2>Auditions</h2>
          <Table
            columns={[
              { key: 'title', header: 'Take', render: (c) => c.title },
              { key: 'text', header: 'Line', render: (c) => <span title={c.text}>{c.text}</span> },
              { key: 'status', header: 'Status', render: (c) => <Badge status={c.status === 'approved' ? 'approved' : c.status === 'rejected' ? 'rejected' : 'candidate'}>{c.status}</Badge> },
              { key: 'play', header: 'Play', render: (c) => (c.preview ? <AudioPlayer profile="speech" src={c.preview} label={c.title} /> : <span class="muted">no file</span>) },
            ]}
            rows={visibleClips}
            rowKey={(c) => c.id}
          />
        </>
      )}

      <h2>Delivery</h2>
      <div onInput={() => setDirtyHold(true)}>
        <ProfileForm detail={data} onSaved={() => { setDirtyHold(false); reload(); }} />
      </div>
      {!data.locked && <SystemVoiceAudition detail={data} />}

      {confirm && (
        <Dialog
          title="Select voice"
          onClose={() => setConfirm(null)}
          footer={
            <>
              <Button variant="ghost" help="Closes this window. No voice is chosen." onClick={() => setConfirm(null)}>
                Cancel
              </Button>
              <Button variant="primary" disabled={busy} help="Makes this voice the character's voice now. Their speech approvals are reset against it and the choice is locked." onClick={() => void select(confirm)}>
                Select voice
              </Button>
            </>
          }
        >
          <p>
            {confirm.name} ({confirm.provider}) becomes the voice of {data.name}. Speech approvals for {data.name} are reset against it, and the choice is locked.
          </p>
          {confirm.preview && <AudioPlayer profile="speech" src={confirm.preview} label={confirm.name} />}
          {problem && <p class="error">{problem}</p>}
        </Dialog>
      )}
    </div>
  );
}
