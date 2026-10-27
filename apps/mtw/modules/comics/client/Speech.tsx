import { useCallback, useMemo, useRef, useState } from 'preact/hooks';
import { Link } from '../../../web/shell/Link';
import { setQuery } from '../../../web/shell/router';
import { AudioPlayer, Button, EmptyState, FilterBar } from '../../../web/ui';
import { OpButton } from './OpButton';
import { countStates, filterRows } from './flow';
import { reviewHref } from './nav';
import { post, useView } from './hooks';
import { Meter, StateBadge, LABEL } from './parts';
import { ReviewFlow } from './ReviewFlow';
import type { Decide } from './ReviewFlow';
import type { CastRow, Counts, ReviewState, SpeechRow } from './types';

/**
 * Comic review. URL: ?view=flow|list&issue=&state=&character=&q=&b=<balloon id> (all optional, all shareable).
 * Inside an issue (/m/comics/issues/<id>/review) the issue is fixed: no issue filter, one progress bar.
 */
export function SpeechView({ query, fixedIssue }: { query: URLSearchParams; fixedIssue?: string }) {
  const view = query.get('view') === 'list' ? 'list' : 'flow';
  const issue = fixedIssue ?? query.get('issue') ?? '';
  const state = query.get('state') ?? (view === 'flow' ? 'open' : 'all');
  const who = query.get('character') ?? '';
  const q = query.get('q') ?? '';
  const selected = query.get('b') ?? '';

  const [overrides, setOverrides] = useState<Record<string, ReviewState>>({});
  const [error, setError] = useState('');
  const keep = useRef(new Set<string>());
  const hold = Object.keys(overrides).length > 0;

  const { data, error: loadError, reload } = useView<{ counts: Counts; rows: SpeechRow[] }>(`/api/comics/speech${issue ? `?issue=${encodeURIComponent(issue)}` : ''}`, hold);
  const issues = useView<{ issues: { id: string; title: string }[] }>('/api/comics/issues').data?.issues ?? [];
  const cast = useView<{ characters: CastRow[] }>('/api/comics/cast').data?.characters ?? [];
  const names = useMemo(() => Object.fromEntries(cast.map((c) => [c.id, c.name])), [cast]);

  const all = useMemo(() => (data?.rows ?? []).map((r) => (overrides[r.id] ? { ...r, state: overrides[r.id] as ReviewState } : r)), [data, overrides]);
  const rows = useMemo(() => filterRows(all, { state, character: who, q, keep: keep.current }, names), [all, state, who, q, names, overrides]); // eslint-disable-line react-hooks/exhaustive-deps
  const speakers = useMemo(() => [...new Set(all.map((r) => r.characterId))].sort(), [all]);
  const perIssue = useMemo(() => issues.map((i) => ({ ...i, counts: countStates(all.filter((r) => r.storyId === i.id)) })).filter((i) => i.counts.total > 0), [issues, all]);

  const decide: Decide = useCallback(
    async (row, action) => {
      const next: ReviewState = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'pending';
      keep.current.add(row.id);
      setOverrides((o) => ({ ...o, [row.id]: next }));
      setError('');
      try {
        await post(`/api/comics/speech/${encodeURIComponent(row.id)}/review`, { action });
        await reload();
        return true;
      } catch (e) {
        setError(`${row.id}: ${(e as Error).message}`);
        return false;
      } finally {
        setOverrides((o) => {
          const { [row.id]: _gone, ...rest } = o;
          return rest;
        });
      }
    },
    [reload],
  );

  const onSelect = useCallback((id: string) => setQuery({ b: id }), []);

  // "Approve screen": every balloon of the box on screen at once; when all are approved it unapproves them all.
  const screen = useMemo(() => {
    const cur = all.find((r) => r.id === selected) ?? rows[0];
    return cur ? all.filter((r) => r.storyId === cur.storyId && r.sceneId === cur.sceneId && r.panelId === cur.panelId) : [];
  }, [all, rows, selected]);
  const screenApproved = screen.length > 0 && screen.every((r) => r.state === 'approved');
  const [screenBusy, setScreenBusy] = useState(false);
  const approveScreen = useCallback(async () => {
    const action = screenApproved ? 'revoke' : 'approve';
    const targets = screenApproved ? screen : screen.filter((r) => r.state !== 'approved');
    if (!targets.length) return;
    setScreenBusy(true);
    setError('');
    for (const r of targets) keep.current.add(r.id);
    setOverrides((o) => ({ ...o, ...Object.fromEntries(targets.map((r) => [r.id, action === 'approve' ? 'approved' : 'pending'])) }));
    try {
      for (const r of targets) await post(`/api/comics/speech/${encodeURIComponent(r.id)}/review`, { action });
      await reload();
    } catch (e) {
      setError((e as Error).message);
      await reload();
    } finally {
      setOverrides({});
      setScreenBusy(false);
    }
  }, [screen, screenApproved, reload]);

  if (loadError) return <EmptyState>{loadError}</EmptyState>;
  if (!data) return <EmptyState>Loading.</EmptyState>;

  const c = countStates(all);
  const setFilter = (name: string, value: string) => {
    keep.current = new Set();
    setQuery({ [name]: value, b: '' });
  };
  const filterBar = (
        <FilterBar
          search={q}
          onSearch={(v) => setFilter('q', v)}
          searchLabel="Search balloon text and characters"
          selects={[
            ...(fixedIssue ? [] : [{ name: 'issue', label: 'Issue', value: issue, options: [{ value: '', label: 'All issues' }, ...issues.map((i) => ({ value: i.id, label: i.title }))] }]),
            {
              name: 'state',
              label: 'State',
              value: state,
              options: [{ value: 'open', label: 'Open (to review, stale)' }, { value: 'all', label: 'Any state' }, ...(Object.keys(LABEL) as ReviewState[]).map((s) => ({ value: s, label: LABEL[s] }))],
            },
            { name: 'character', label: 'Character', value: who, options: [{ value: '', label: 'Any character' }, ...speakers.map((s) => ({ value: s, label: names[s] ?? s }))] },
          ]}
          onSelect={setFilter}
        >
        </FilterBar>
  );
  // One switch: in Review it offers List, in List it offers Review.
  const viewTool = (
    <Button small variant="secondary" aria-label={view === 'flow' ? 'Show as a list' : 'Show one box at a time'} help={view === 'flow' ? 'Switches to a list of all the balloons. Nothing is changed.' : 'Switches to reviewing one balloon at a time with its picture. Nothing is changed.'} onClick={() => setQuery({ view: view === 'flow' ? 'list' : '' })}>
      {view === 'flow' ? 'List' : 'Review'}
    </Button>
  );
  const screenTool =
    screen.length > 0 ? (
      <Button
        small
        variant={screenApproved ? 'secondary' : 'primary'}
        aria-pressed={screenApproved}
        disabled={screenBusy}
        help={screenApproved ? 'Takes back your approval of every balloon on this screen. No audio is deleted.' : screen.length === 1 ? 'Records that you approve the words of the balloon on this screen. No audio is made.' : `Records that you approve the words of all ${screen.length} balloons on this screen. No audio is made.`}
        onClick={() => void approveScreen()}
      >
        {screenApproved ? 'Screen approved ✓' : 'Approve screen'}
      </Button>
    ) : null;
  return (
    <div class="stack">
      <div class="meters" aria-label={fixedIssue ? 'Review progress' : 'Review progress by issue'}>
        {fixedIssue && perIssue.map((i) => (
          <div key={i.id} class="meter-row meter-row--static">
            <span class="meter-name">{i.title}</span>
            <Meter counts={i.counts} label={i.title} />
            <span class="muted small meter-n">
              {i.counts.approved}/{i.counts.total}
            </span>
          </div>
        ))}
        {!fixedIssue && perIssue.map((i) => (
          <button key={i.id} type="button" class={`meter-row${issue === i.id ? ' meter-row--on' : ''}`} aria-pressed={issue === i.id} title={issue === i.id ? `Shows balloons from every issue again, not just ${i.title}. Nothing is changed.` : `Shows only the balloons from ${i.title}. Nothing is changed.`} onClick={() => setFilter('issue', issue === i.id ? '' : i.id)}>
            <span class="meter-name">{i.title}</span>
            <Meter counts={i.counts} label={i.title} />
            <span class="muted small meter-n">
              {i.counts.approved}/{i.counts.total}
            </span>
          </button>
        ))}
      </div>
      <p class="muted small">
        {c.approved} approved · {c.pending} to review · {c.stale} stale · {c.rejected} rejected{c.unvoiced ? ` · ${c.unvoiced} unvoiced` : ''}
      </p>
      {view === 'list' && (
        <>
          {filterBar}
          <div class="row rv-tools">
            {screenTool}
            {viewTool}
          </div>
        </>
      )}

      {view === 'flow' ? (
        <ReviewFlow rows={rows} names={names} selectedId={selected} onSelect={onSelect} decide={decide} error={error} onArtChange={() => void reload()} filters={filterBar} screenTool={screenTool} viewTool={viewTool} filtered={!!q || !!who || state !== 'all'} />
      ) : rows.length === 0 ? (
        <EmptyState>No balloons match.</EmptyState>
      ) : (
        <>
          {error && (
            <p class="error" role="alert">
              {error}
            </p>
          )}
          <ul class="speech-list">
            {rows.map((r) => (
              <li key={r.id} class="speech-row">
                <div class="speech-meta">
                  <StateBadge state={r.state} />
                  <span class="muted small">
                    {r.storyId} · {r.sceneTitle} · {names[r.characterId] ?? r.characterId}
                  </span>
                </div>
                <p class="speech-text">{r.text}</p>
                <div class="speech-actions row">
                  {r.audio?.preview && <AudioPlayer profile="speech" src={r.audio.preview} label={`take for ${r.id}`} />}
                  <Link class="btn btn--ghost btn--small" href={reviewHref(r.storyId, r.id)} aria-label={`Review ${r.id} with its panel`} title="Opens this balloon in the one-at-a-time review, next to its picture. Nothing is changed by opening it.">
                    Review
                  </Link>
                  <Button small variant={r.state === 'approved' ? 'secondary' : 'primary'} aria-pressed={r.state === 'approved'} aria-label={r.state === 'approved' ? `Unapprove text of ${r.id}` : `Approve text of ${r.id}`} help={r.state === 'approved' ? 'Takes back your approval of this balloon\'s words. No audio is deleted.' : 'Records that you approve the words of this balloon, so speech can be made for it. No audio is made by this click.'} onClick={() => void decide(r, r.state === 'approved' ? 'revoke' : 'approve')}>
                    {r.state === 'approved' ? 'Approved ✓' : 'Approve'}
                  </Button>
                  {r.state === 'approved' && !r.audio && r.voice && <OpButton id="comics-generate-speech" params={{ balloon: r.id }} label="Generate speech" small help="Opens a terminal where an agent makes the spoken audio for this balloon using its approved words and chosen voice. It first checks the approvals and shows its plan before it asks the voice service for anything." />}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
