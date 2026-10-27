// Focused speech review: one balloon at a time, shown in its box as the reader letters it (words editable in place), with
// the box's effects, a Play that runs the box, the saved take, keyboard shortcuts and the box's feedback conversation.
import type { ComponentChildren } from 'preact';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'preact/hooks';
import { Button } from '../../../web/ui';
import { useScrollHold } from '../../../web/ui/useScrollHold';
import { BalloonEditor, BalloonLayer, BoxHistory, FeedbackPanel, SoundStrip, clockOf, useBox, useBoxPlayer } from './BoxStudio';
import { PreviewDown, ReaderStage, useReaderAvailable } from './ReaderStage';
import { FixArtButton, FixBadge, PanelArt, useArtWatch } from './FixArt';
import { OpButton } from './OpButton';
import { commandForKey, flowReduce, restoreAction, SHORTCUTS, settle } from './flow';
import type { Command, FlowAction, FlowState } from './flow';
import { Navigator } from './Navigator';
import { Diff, StateBadge } from './parts';
import type { ReviewState, SpeechRow } from './types';

// Auto-play is on unless Matt turned it off (Matt, 2026-10-11: on by default; a new key so the old "off" is not kept).
const AUTOPLAY_KEY = 'mtw.comics.autoplay-box';
const PANEL_KEY = 'mtw.comics.review-panel';
const readAutoplay = (): boolean => {
  try {
    return localStorage.getItem(AUTOPLAY_KEY) !== '0';
  } catch {
    return true;
  }
};

const ICON = {
  prev: 'M6 5h2v14H6zM20 5v14L9 12z',
  play: 'M8 5v14l11-7z',
  stop: 'M7 7h10v10H7z',
  next: 'M16 5h2v14h-2zM4 5l11 7-11 7z',
};

/** An icon-only toolbar button; its tooltip names the action and its key, e.g. "Play: Space". */
function IconBtn({ label, keyName, icon, onClick, disabled, pressed, help }: { label: string; keyName: string; icon: string; onClick: () => void; disabled?: boolean; pressed?: boolean; help: string }) {
  return (
    <button type="button" class="btn btn--small rv-icon" title={`${help} Keyboard shortcut: ${keyName}.`} aria-label={`${label} (${keyName})`} aria-keyshortcuts={keyName === 'Space' ? 'Space' : keyName} aria-pressed={pressed} disabled={disabled} onClick={onClick}>
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path fill="currentColor" d={icon} />
      </svg>
    </button>
  );
}

export type Decide = (row: SpeechRow, action: 'approve' | 'reject' | 'revoke') => Promise<boolean>;

interface Props {
  /** Visible rows in reading order, with optimistic states applied. */
  rows: SpeechRow[];
  names: Record<string, string>;
  selectedId: string;
  onSelect: (id: string) => void;
  decide: Decide;
  error: string;
  /** Refetch the rows when the story or its art path moved on disk. */
  onArtChange?: () => void;
  /** The search bar, shown under the toolbar when Search is on. */
  filters?: ComponentChildren;
  /** Toolbar controls owned by the page: Approve screen, and the Review/List switch. */
  screenTool?: ComponentChildren;
  viewTool?: ComponentChildren;
  /** A search or filter is active (Search then opens by default so the filter is visible). */
  filtered?: boolean;
}

const hint = (command: Command) => SHORTCUTS.find((s) => s.command === command)?.key ?? '';

export function ReviewFlow({ rows, names, selectedId, onSelect, decide, error, onArtChange, filters, screenTool, viewTool, filtered = false }: Props) {
  const ids = useMemo(() => rows.map((r) => r.id), [rows]);
  const states = useMemo(() => Object.fromEntries(rows.map((r) => [r.id, r.state])) as Record<string, ReviewState>, [rows]);
  const ctx = useMemo(() => ({ ids, states }), [ids, states]);
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;

  const [flow, dispatch] = useReducer(
    (s: FlowState, a: FlowAction) => settle(flowReduce(s, a, ctxRef.current), ctxRef.current),
    { current: selectedId, undo: [] } as FlowState,
    (init) => settle(init, ctx),
  );
  // Keep the cursor valid when the list changes (live reload, filter) without moving it off a row that still exists.
  const current = ctx.ids.includes(flow.current ?? '') ? flow.current : settle(flow, ctx).current;
  // Mirror the cursor into the URL, remembering what we pushed so its echo is not mistaken for a deep-link change.
  const pushed = useRef<string[]>([]);
  useEffect(() => {
    if (current && current !== flow.current) dispatch({ type: 'goto', id: current });
    if (current && current !== selectedId) {
      pushed.current.push(current);
      onSelect(current);
    }
  }, [current]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const echo = pushed.current.indexOf(selectedId);
    if (echo >= 0) {
      pushed.current = pushed.current.slice(echo + 1);
      return;
    }
    if (selectedId && selectedId !== flow.current && ids.includes(selectedId)) dispatch({ type: 'goto', id: selectedId });
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const row = rows.find((r) => r.id === current) ?? null;
  const index = row ? ids.indexOf(row.id) : -1;
  const box = useBox(row?.storyId ?? '', row?.sceneId ?? '', row?.panelId ?? '');
  const reloadBox = box.reload;
  const watch = useArtWatch(row?.storyId ?? '', () => {
    onArtChange?.();
    void reloadBox();
  });
  const clock = useMemo(() => clockOf(box.data), [box.data]);
  const player = useBoxPlayer(clock, row?.id ?? '');
  const [ask, setAsk] = useState('');

  const [autoplay, setAutoplay] = useState(readAutoplay);
  // Search and Navigate open in the same slot under the toolbar; the choice is remembered in this browser.
  const [panel, setPanel] = useState<'' | 'search' | 'navigate'>(() => {
    try {
      const v = localStorage.getItem(PANEL_KEY);
      return filtered ? 'search' : v === 'search' || v === 'navigate' ? v : '';
    } catch {
      return filtered ? 'search' : '';
    }
  });
  const togglePanel = (p: 'search' | 'navigate') =>
    setPanel((cur) => {
      const next = cur === p ? '' : p;
      try {
        localStorage.setItem(PANEL_KEY, next);
      } catch {
        /* storage blocked: the toggle still works for this visit */
      }
      return next;
    });
  // The stage is the site's own reader when the site preview runs (its motion and sound); Studio's drawing otherwise.
  const reader = useReaderAvailable();
  const [readerPlaying, setReaderPlaying] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const boxKey = row ? `${row.storyId}/${row.sceneId}/${row.panelId ?? row.panelIndex}` : '';
  useEffect(() => setReaderPlaying(false), [boxKey]);
  const playing = reader ? readerPlaying : player.playing;

  useEffect(() => {
    try {
      localStorage.setItem(AUTOPLAY_KEY, autoplay ? '1' : '0');
    } catch {
      /* storage blocked: the toggle still works for this visit */
    }
  }, [autoplay]);

  // Arriving on a new screen whose box has loaded: play it once when auto-play is on (moving between its bubbles does not
  // replay it).
  const loadedFor = box.data && row && box.data.box.balloons.some((b) => b.id === row.id) ? boxKey : '';
  useEffect(() => {
    if (!autoplay || !loadedFor || reader === null) return;
    if (reader) setReaderPlaying(true);
    else player.play();
  }, [loadedFor, reader]); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlay = useCallback(() => (reader ? setReaderPlaying((v) => !v) : player.toggle()), [reader, player.toggle]);

  const act = useCallback(
    async (action: 'approve' | 'reject') => {
      const r = rows.find((x) => x.id === current);
      if (!r) return;
      // Approve is a toggle (Matt, 2026-10-11): on an approved balloon it, and R, unapprove and stay here. Words can be
      // approved before the speaker has a voice; nothing is rejected before it was approved.
      if (r.state === 'approved') {
        await decide(r, 'revoke');
        return;
      }
      if (action === 'reject') return;
      dispatch({ type: 'decided', decision: { id: r.id, prev: r.state, action } });
      const ok = await decide(r, action);
      if (!ok) dispatch({ type: 'undone' });
    },
    [rows, current, decide],
  );
  const undo = useCallback(async () => {
    const last = flow.undo[flow.undo.length - 1];
    if (!last) return;
    dispatch({ type: 'undone' });
    const r = rows.find((x) => x.id === last.id);
    if (r) await decide(r, restoreAction(last.prev));
  }, [flow.undo, rows, decide]);

  const run = useCallback(
    (command: Command) => {
      if (command === 'play') togglePlay();
      else if (command === 'approve') void act('approve');
      else if (command === 'reject') void act('reject');
      else if (command === 'next') dispatch({ type: 'move', dir: 1 });
      else if (command === 'prev') dispatch({ type: 'move', dir: -1 });
      else void undo();
    },
    [togglePlay, act, undo],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName ?? '';
      const command = commandForKey({
        key: e.key,
        ctrl: e.ctrlKey,
        meta: e.metaKey,
        alt: e.altKey,
        typing: tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || !!t?.isContentEditable,
        onControl: tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY',
      });
      if (!command || e.repeat || document.querySelector('[role="dialog"]')) return;
      e.preventDefault();
      run(command);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [run]);

  const section = useRef<HTMLElement>(null);
  useScrollHold(section, !!row);
  // The reader's last box, kept on screen while the next box's data loads (unmounting it blanked the stage).
  const stageRef = useRef<{ issue: string; scene: string; img: string; at: number; length: number; bpm: number; version: string; playing: boolean } | null>(null);

  if (!row) return <p class="muted">Nothing to review with these filters.</p>;

  const who = names[row.characterId] ?? row.characterId;
  const approved = row.state === 'approved';
  const data = box.data && box.data.box.balloons.some((b) => b.id === row.id) ? box.data : null;
  // While the next box loads, the previous one's chat panel and geometry hold the layout (balloons are hidden).
  const shell = data ?? box.data;
  if (data) stageRef.current = { issue: row.storyId, scene: row.sceneId, img: row.panelId ?? '', at: data.box.at, length: data.box.length, bpm: data.box.bpm, version: data.box.hash, playing: readerPlaying };
  const stage = reader ? stageRef.current : null;
  const key = (c: Command) => <kbd aria-hidden="true">{hint(c)}</kbd>;

  return (
    <section class="rv" ref={section} aria-label="Review one balloon">
      <div class="rv-actions row">
        <span class="rv-transport" role="group" aria-label="Move and play">
          <IconBtn label="Previous bubble" keyName="K" help="Goes to the previous balloon in the review. Nothing is changed." disabled={index <= 0} onClick={() => run('prev')} icon={ICON.prev} />
          <IconBtn label={playing ? 'Stop' : 'Play'} keyName="Space" help={playing ? 'Stops the preview. Nothing is changed.' : 'Plays this balloon with its sound and speech so you can judge it. Nothing is changed.'} disabled={!clock} onClick={() => run('play')} icon={playing ? ICON.stop : ICON.play} pressed={playing} />
          <IconBtn label="Next bubble" keyName="J" help="Goes to the next balloon in the review. Nothing is changed." disabled={index >= ids.length - 1} onClick={() => run('next')} icon={ICON.next} />
        </span>
        <Button small variant={approved ? 'secondary' : 'primary'}  help={approved ? 'Takes back your approval of this balloon\'s words. No audio is deleted. Keyboard shortcut: A.' : 'Records that you approve the words of this balloon, so speech can be made for it. No audio is made by this click. Keyboard shortcut: A.'} aria-keyshortcuts="A" onClick={() => run('approve')} aria-pressed={approved}>
          {approved ? 'Bubble approved ✓' : 'Approve bubble'}
        </Button>
        {screenTool}
        <Button small variant={panel === 'navigate' ? 'primary' : 'secondary'} aria-pressed={panel === 'navigate'} help="Shows or hides the list of scenes and screens so you can jump to another balloon. Nothing is changed." onClick={() => togglePanel('navigate')}>
          Navigate
        </Button>
        <Button small variant={panel === 'search' ? 'primary' : 'secondary'} aria-pressed={panel === 'search'} help="Shows or hides the search box and filters for finding balloons. Nothing is changed." onClick={() => togglePanel('search')}>
          Search{filtered ? ' •' : ''}
        </Button>
        {viewTool}
        <label class="rv-auto">
          <input type="checkbox" checked={autoplay} onChange={(e) => setAutoplay((e.target as HTMLInputElement).checked)} /> Auto-play screen
        </label>
      </div>
      {panel === 'search' && filters}
      {panel === 'navigate' && <Navigator rows={rows} currentId={row.id} onGo={(id) => dispatch({ type: 'goto', id })} />}

      <div class="rv-head">
        <strong aria-live="polite">
          {index + 1} of {ids.length}
        </strong>
        <StateBadge state={row.state} />
        <span class="muted small">
          {row.sceneTitle} · panel {row.panelIndex + 1} · {who}
        </span>
      </div>

      <div class="rv-main bx-main">
        <div class="stack bx-left">
          {stage ? (
            <ReaderStage
              issue={stage.issue}
              scene={stage.scene}
              img={stage.img}
              at={stage.at}
              length={stage.length}
              bpm={stage.bpm}
              playing={stage.playing}
              version={stage.version}
              currentIndex={data ? row.balloonIndex : null}
              onEnded={() => setReaderPlaying(false)}
              onBalloon={setEditing}
              fallback={null}
            />
          ) : (
            <>
              {reader === false && <PreviewDown />}
              <PanelArt
                issue={row.storyId}
                sceneId={row.sceneId}
                full={row.crop?.src ?? null}
                rect={row.crop?.rect ?? null}
                layers={row.crop?.layers}
                alt={row.crop?.alt ?? ''}
                watch={watch}
                class="crop--stage"
                geometry={data ? { r: data.box.r, ar: data.box.ar, focus: data.box.focus, insetPct: data.box.insetPct } : null}
                overlay={data ? <BalloonLayer data={data} revealed={player.revealed} current={row.id} onSaved={() => void reloadBox()} /> : null}
              />
            </>
          )}
          {editing !== null && data && <BalloonEditor data={data} index={editing} names={names} onClose={() => setEditing(null)} onSaved={() => void reloadBox()} />}
          {error && (
            <p class="error" role="alert">
              {error}
            </p>
          )}
          {row.crop && (
            <div class="row">
              <FixArtButton
                target={{
                  issue: row.storyId,
                  sceneId: row.sceneId,
                  sceneTitle: row.sceneTitle,
                  art: row.crop.art,
                  full: watch.src(row.sceneId, row.crop.src),
                  panels: [{ index: row.panelIndex, img: row.panelId ?? '', rect: row.crop.rect, alt: row.crop.alt, layers: row.crop.layers, canonicalSource: row.crop.canonicalSource }],
                }}
              />
              <FixBadge issue={row.storyId} sceneId={row.sceneId} panel={{ index: row.panelIndex, img: row.panelId ?? '' }} />
            </div>
          )}
          {data && <SoundStrip data={data} onAsk={setAsk} />}
          {box.error && <p class="error small">{box.error}</p>}
          {player.error && <p class="error small">{player.error}</p>}
          {row.state === 'stale' && (
            <div class="rv-stale">
              <p class="small muted">Changed since it was last approved or voiced.</p>
              {row.baseline ? <Diff before={row.baseline} after={row.text} /> : <p class="small muted">The earlier text was not recorded; read this version before approving.</p>}
            </div>
          )}
          <p class="small muted">
            {row.voice ? `Voice ${row.voice}` : `${who} has no selected voice yet.`}
            {row.audio ? ` · take ${Math.round(row.audio.durationSeconds * 10) / 10} s, ${row.audio.status}` : ' · no saved take'}
          </p>
          {!row.audio && row.state === 'approved' && row.voice && <OpButton id="comics-generate-speech" params={{ balloon: row.id }} label="Generate speech" small help="Opens a terminal where an agent makes the spoken audio for this balloon using its approved words and chosen voice. It first checks the approvals and shows its plan before it asks the voice service for anything." />}
          {data && <BoxHistory data={data} />}
        </div>
        {shell ? <FeedbackPanel data={shell} waiting={!data} prefill={ask} onPrefilled={() => setAsk('')} /> : <aside class="chat muted small">Loading the box.</aside>}
      </div>
    </section>
  );
}
