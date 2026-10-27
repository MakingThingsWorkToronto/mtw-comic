// Box-level art fixes: the "Fix art" dialog, live refresh of changed art with a before/after compare, and "Fixing…" badges.
import type { ComponentChildren } from 'preact';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { api } from '../../../web/api';
import { Link } from '../../../web/shell/Link';
import { buildUrl } from '../../../web/shell/route';
import { navigate } from '../../../web/shell/router';
import { terminals } from '../../../web/state';
import { Badge, Button, Dialog, LaunchConfirm, useLaunchChoice } from '../../../web/ui';
import { compactNumber } from './flow';
import {
  FIX_OPERATION, assembleFixParams, baselineOf, bustToken, bustUrl, canLaunch, createPresetLoader, detectNewArt, fixingBoxes, mediaSrc, panelRef, subjectTokens,
} from './fix';
import type { ArtChange, ArtStatus, Baseline, FixPanel, FixPreset } from './fix';
import { PanelCrop } from './parts';
import type { BoxGeometry } from './boxLayout';
import type { Rect } from './flow';
import type { CanonicalArtSource, PanelArtLayer } from './types';

// ------------------------------------------------------------------------------------------------ presets and runners

export const loadPresets = createPresetLoader(() => api.get<{ presets: FixPreset[] }>('/api/comics/fix-presets').then((r) => r.presets));

/** Runners a fix may use: Codex first (the default), Claude allowed. */

// ------------------------------------------------------------------------------------------------ art watch

/** Per issue: what each scene's art looked like when first seen or last kept. Survives navigation within the visit. */
const baselines = new Map<string, Map<string, Baseline>>();
const storyMtimes = new Map<string, number>();
/** Page art as it was when a fix was launched (object URLs), so "Before" still works after the file changes in place. */
const before = new Map<string, string>();

/** Remember the art a fix starts from. Failures are ignored: Before is then unavailable for an in-place rewrite. */
export async function captureBefore(key: string, src: string | null): Promise<void> {
  if (!src || before.has(key)) return;
  try {
    const res = await fetch(src);
    if (res.ok) before.set(key, URL.createObjectURL(await res.blob()));
  } catch {
    /* offline or blocked: skip */
  }
}

export interface ArtWatch {
  changes: Record<string, ArtChange>;
  /** Cache-busted URL for a scene's page art. */
  src: (sceneId: string, url: string | null) => string | null;
  keep: (sceneId: string) => void;
  status: ArtStatus | null;
}

const POLL_MS = 4000;

/**
 * Watches the issue's art (site copies, canonical masters, the story file) by polling the module's art-status route and
 * reports scenes whose art has a newer -vN or changed. `onSiteChange` runs when the views should refetch (art path or crop moved).
 */
export function useArtWatch(issue: string, onSiteChange?: () => void): ArtWatch {
  const [status, setStatus] = useState<ArtStatus | null>(null);
  const [changes, setChanges] = useState<Record<string, ArtChange>>({});
  const notify = useRef(onSiteChange);
  notify.current = onSiteChange;
  const latest = useRef<ArtStatus | null>(null);

  useEffect(() => {
    if (!issue) return;
    let live = true;
    let timer = 0;
    const tick = async () => {
      if (document.visibilityState === 'hidden') return;
      try {
        const next = await api.get<ArtStatus>(`/api/comics/issues/${encodeURIComponent(issue)}/art-status`);
        if (!live) return;
        let known = baselines.get(issue);
        if (!known) baselines.set(issue, (known = new Map()));
        const found: Record<string, ArtChange> = {};
        let refetch = false;
        for (const scene of next.scenes) {
          const b = known.get(scene.id);
          if (!b) {
            known.set(scene.id, baselineOf(scene));
            continue;
          }
          const change = detectNewArt(b, scene);
          if (change) found[scene.id] = change;
        }
        const storyBefore = storyMtimes.get(issue);
        if (next.story && storyBefore !== undefined && next.story.mtime !== storyBefore) refetch = true;
        if (next.story) storyMtimes.set(issue, next.story.mtime);
        const previous = latest.current;
        if (previous && next.scenes.some((s) => bustToken(s) !== bustToken(previous.scenes.find((p) => p.id === s.id)))) refetch = true;
        latest.current = next;
        setStatus(next);
        setChanges((old) => (JSON.stringify(old) === JSON.stringify(found) ? old : found));
        if (refetch) notify.current?.();
      } catch {
        /* the next tick retries */
      }
    };
    void tick();
    timer = window.setInterval(() => void tick(), POLL_MS);
    return () => {
      live = false;
      window.clearInterval(timer);
    };
  }, [issue]);

  const tokens = useMemo(() => new Map(status?.scenes.map((s) => [s.id, bustToken(s)]) ?? []), [status]);
  const src = useCallback((sceneId: string, url: string | null) => (url ? bustUrl(url, tokens.get(sceneId) ?? '0') : null), [tokens]);
  const keep = useCallback(
    (sceneId: string) => {
      const scene = latest.current?.scenes.find((s) => s.id === sceneId);
      if (scene) baselines.get(issue)?.set(sceneId, baselineOf(scene));
      setChanges((old) => {
        const { [sceneId]: _gone, ...rest } = old;
        return rest;
      });
      const url = before.get(`${issue}/${sceneId}`);
      if (url) URL.revokeObjectURL(url);
      before.delete(`${issue}/${sceneId}`);
    },
    [issue],
  );
  return { changes, src, keep, status };
}

// ------------------------------------------------------------------------------------------------ crop with compare

interface PanelArtProps {
  issue: string;
  sceneId: string;
  /** The scene's current page art URL (not yet cache-busted). */
  full: string | null;
  rect: Rect | null;
  alt: string;
  watch: ArtWatch;
  class?: string;
  /** Drawn over the crop in the crop's own box (e.g. the balloons). */
  overlay?: ComponentChildren;
  /** The box's reader geometry; when given the crop is laid out exactly as the reader lays the box out. */
  geometry?: BoxGeometry | null;
  layers?: PanelArtLayer[];
}

/** A panel's crop that refreshes when its art changes on disk, with a "New art" strip to compare before and after. */
export function PanelArt({ issue, sceneId, full, rect, alt, watch, class: cls = '', overlay, geometry, layers }: PanelArtProps) {
  const change = watch.changes[sceneId];
  const [showBefore, setShowBefore] = useState(false);
  useEffect(() => setShowBefore(false), [change?.file]);
  const current = watch.src(sceneId, full);
  const snapshot = before.get(`${issue}/${sceneId}`);
  // For a newer -vN the old file is still there, so "Before" needs no snapshot.
  const earlier = snapshot ?? (change?.kind === 'newer-version' ? current : null);
  const later = change?.showPath ? bustUrl(mediaSrc(change.showPath), watch.status ? Math.max(0, ...(watch.status.scenes.find((s) => s.id === sceneId)?.files.map((f) => f.mtime) ?? [0])) : 0) : current;
  const shown = !change ? current : showBefore && earlier ? earlier : later;
  if (!shown || !rect) return <div class={`crop crop--none muted small ${cls}`}>no art</div>;
  return (
    <div class="panel-art">
      <PanelCrop src={shown} rect={rect} alt={alt} class={cls} geometry={geometry ?? null} layers={layers}>
        {overlay}
      </PanelCrop>
      {change && (
        <div class="art-new" role="status">
          <span class="small">
            New art: <code>{change.file}</code>
          </span>
          <span class="row" role="group" aria-label="Compare before and after">
            <Button small variant="ghost" aria-pressed={showBefore} disabled={!earlier} help={earlier ? 'Shows the art as it was before the agent changed it, so you can compare. Nothing is changed.' : 'The earlier art was not kept in this browser, so there is nothing to compare with.'} onClick={() => setShowBefore(true)}>
              Before
            </Button>
            <Button small variant="ghost" aria-pressed={!showBefore} help="Shows the new art the agent made. Nothing is changed." onClick={() => setShowBefore(false)}>
              After
            </Button>
            <Button small variant="ghost" help="Accepts the new art as it looks now and stops showing this before-and-after comparison. No file is changed." onClick={() => watch.keep(sceneId)}>
              Keep
            </Button>
          </span>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ badge

function useRunTokens(subject: string | undefined, running: boolean): number | null {
  const [total, setTotal] = useState<number | null>(null);
  useEffect(() => {
    if (!subject) return;
    let live = true;
    const load = () =>
      api.get<unknown>(`/api/tokens/by?subject=${encodeURIComponent(subject)}`).then(
        (j) => live && setTotal(subjectTokens(j)),
        () => undefined,
      );
    void load();
    const timer = running ? window.setInterval(load, 8000) : 0;
    return () => {
      live = false;
      if (timer) window.clearInterval(timer);
    };
  }, [subject, running]);
  return total;
}

/** "Fixing…" while a fix run for this box is running; links to its terminal and clears when the terminal exits. */
export function FixBadge({ issue, sceneId, panel }: { issue: string; sceneId: string; panel: { index: number; img: string } }) {
  const run = fixingBoxes(terminals.value, issue).get(`${sceneId}/${panelRef(panel)}`);
  const tokens = useRunTokens(run?.subject, !!run);
  if (!run) return null;
  return (
    <Link class="fix-badge" href={buildUrl('operations', ['terminals', run.id])} aria-label="Fixing this box; open its terminal">
      <Badge status="running">Fixing…</Badge>
      {tokens ? <span class="small muted">{compactNumber(tokens)} tokens</span> : null}
    </Link>
  );
}

// ------------------------------------------------------------------------------------------------ dialog

export interface FixTarget {
  issue: string;
  sceneId: string;
  sceneTitle: string;
  art: string | null;
  /** Page art URL for the crop previews. */
  full: string | null;
  panels: (FixPanel & { alt: string; src?: string | null; layers?: PanelArtLayer[]; canonicalSource?: CanonicalArtSource | null })[];
}

export function FixArtButton({ target, label = 'Fix art', small = true }: { target: FixTarget; label?: string; small?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button small={small} variant="ghost" disabled={target.panels.length === 0} help="Opens a window where you say what is wrong with this box's picture. Launching it opens a terminal where an agent redraws only this box. Nothing changes until you launch." onClick={() => setOpen(true)}>
        {label}
      </Button>
      {open && <FixDialog target={target} onClose={() => setOpen(false)} />}
    </>
  );
}

function FixDialog({ target, onClose }: { target: FixTarget; onClose: () => void }) {
  const [presets, setPresets] = useState<FixPreset[]>([]);
  const [loadError, setLoadError] = useState('');
  const [chosen, setChosen] = useState<string[]>([]);
  const [note, setNote] = useState('');
  // Art is drawn by Codex's image tool: start there; the procedure's frontmatter supplies its model and effort.
  const lc = useLaunchChoice(FIX_OPERATION, 'codex');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [started, setStarted] = useState<string | null>(null);
  const [preview, setPreview] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadPresets().then((all) => setPresets(all.filter((p) => p.scope === 'art')), (e: Error) => setLoadError(e.message));
  }, []);

  const request = { issue: target.issue, sceneId: target.sceneId, art: target.art, panels: target.panels, fixes: chosen, note };
  const params = useMemo(() => assembleFixParams(request), [target, chosen, note]); // eslint-disable-line react-hooks/exhaustive-deps
  const ready = canLaunch(request);

  useEffect(() => {
    if (!showPreview) return;
    let live = true;
    const timer = window.setTimeout(() => {
      api.post<{ text: string }>('/api/comics/fix-preview', { params }).then(
        (r) => live && setPreview(r.text),
        (e: Error) => live && setPreview(`Could not render the prompt: ${e.message}`),
      );
    }, 250);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [showPreview, params]);

  const toggle = (id: string) => setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const launch = async () => {
    setBusy(true);
    setError('');
    try {
      void captureBefore(`${target.issue}/${target.sceneId}`, target.full);
      const [runner, permission, choice] = lc.args();
      const t = await api.launch(FIX_OPERATION, params, runner, permission === 'default' ? undefined : permission, choice);
      setStarted(t.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const many = target.panels.length > 1;
  return (
    <Dialog
      title={many ? `Fix art: ${target.panels.length} boxes in ${target.sceneTitle}` : `Fix art: ${target.sceneTitle}, box ${target.panels[0] ? target.panels[0].index + 1 : ''}`}
      onClose={onClose}
      wide
      footer={
        started ? (
          <>
            <Button variant="ghost" help="Closes this window. The agent keeps working in its terminal." onClick={onClose}>
              Stay here
            </Button>
            <Button
              variant="primary"
              help="Closes this window and opens the terminal where the agent is redrawing the box, so you can watch it."
              onClick={() => {
                onClose();
                navigate(buildUrl('operations', ['terminals', started]));
              }}
            >
              Watch terminal
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" help="Closes this window without starting anything." onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" disabled={busy || !ready} help="Opens a terminal where an agent redraws only the box or boxes shown here, following what you marked as wrong. It does not touch other boxes or the lettering." onClick={() => void launch()}>
              Launch
            </Button>
          </>
        )
      }
    >
      <div class="stack fix-dialog">
        <div class={`fix-crops${many ? ' fix-crops--many' : ''}`}>
          {target.panels.map((p) =>
            (p.src ?? target.full) && p.rect ? <PanelCrop key={p.index} src={(p.src ?? target.full)!} rect={p.rect} alt={p.alt} layers={p.layers} class={many ? 'crop--small' : 'crop--dialog'} /> : <div key={p.index} class="crop crop--none muted small">no art</div>,
          )}
        </div>
        {started ? (
          <p role="status">Started. The agent works on this {many ? 'set of boxes' : 'box'} only; the crop refreshes here when its art changes.</p>
        ) : (
          <>
            <fieldset class="fix-chips">
              <legend class="small muted">What is wrong</legend>
              {presets.map((p) => (
                <button key={p.id} type="button" class="chip" aria-pressed={chosen.includes(p.id)} title={`${chosen.includes(p.id) ? 'Removes' : 'Adds'} "${p.label}" ${chosen.includes(p.id) ? 'from' : 'to'} the list of things to fix. Nothing starts until you press Launch.`} onClick={() => toggle(p.id)}>
                  {p.label}
                </button>
              ))}
              {loadError && <span class="error">{loadError}</span>}
            </fieldset>
            <div class="row fix-fields">
              <div class="field fix-note">
                <label for="fix-note">Note</label>
                <input id="fix-note" class="input" value={note} maxLength={300} placeholder="Optional, one line" onInput={(e) => setNote((e.target as HTMLInputElement).value)} />
              </div>
            </div>
            <LaunchConfirm state={lc} idPrefix="fix" />
            <details onToggle={(e) => setShowPreview((e.currentTarget as HTMLDetailsElement).open)}>
              <summary class="small">Prompt preview</summary>
              <pre class="fix-preview">{preview || 'Rendering.'}</pre>
            </details>
            {error && (
              <p class="error" role="alert">
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </Dialog>
  );
}
