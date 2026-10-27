// Comic Editor view (route /m/comics/editor/<issue>): the real reader in a same-origin iframe, transparent handles from
// its geometry(), a side panel, compare-and-swap saves to the story file and live reload when files change on disk.
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { api } from '../../../web/api';
import { buildUrl } from '../../../web/shell/route';
import { navigate } from '../../../web/shell/router';
import { useWikiChanged } from '../../../web/state';
import { Button, ConfirmLaunch, Dialog, EmptyState, Toolbar } from '../../../web/ui';
import type { ViewProps } from '../../types';
import { Overlay } from './Overlay';
import type { Pick, Placement } from './Overlay';
import { SidePanel } from './SidePanel';
import { diffPatch, newBalloon, subjectOf, threeWay } from './model';
import type { BalloonData, EditOp, FieldConflict, StoryModel } from './model';
import { proxied } from './proxy-url';
import { useGeometry } from './useGeometry';
import './editor.css';

interface StoryView {
  issue: { id: string; slug: string; file: string };
  hash: string;
  mtime: string;
  model: StoryModel | null;
  refusal: string | null;
  warning?: string | null;
  holder: string | null;
  editable: boolean;
  readOnlyReason: string | null;
  staleApprovals: number;
  cast: string[];
}
interface Config { siteBaseUrl: string; proxy: string; issues: { id: string; slug: string }[] }
interface Conflict { fields: FieldConflict[]; theirs: StoryView; patch: Record<string, unknown> }

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);
const at = (v: StoryView | null, p: Pick | null): BalloonData | null =>
  (v?.model && p ? v.model.scenes.find((s) => s.id === p.scene)?.panels.find((x) => x.img === p.img)?.balloons[p.index] : null) ?? null;
const clock = (): string => new Date().toTimeString().slice(0, 5);

export function EditorView({ path, query }: ViewProps) {
  const key = path[1];
  if (!key) return <IssuePicker />;
  return <Editor issue={key} query={query} />;
}

function IssuePicker() {
  const [cfg, setCfg] = useState<Config | null>(null);
  useEffect(() => void api.get<Config>('/api/comics/editor/config').then(setCfg, () => undefined), []);
  return (
    <div class="stack">
      <h1>Comic editor</h1>
      {!cfg ? <EmptyState>Loading.</EmptyState> : (
        <ul class="plain">
          {cfg.issues.map((i) => <li key={i.id}><a href={buildUrl('comics', ['editor', i.id])}>{i.id}</a></li>)}
        </ul>
      )}
    </div>
  );
}

function Editor({ issue, query }: { issue: string; query: URLSearchParams }) {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [view, setView] = useState<StoryView | null>(null);
  const [error, setError] = useState('');
  const [sel, setSel] = useState<Pick | null>(null);
  const [panelSel, setPanelSel] = useState<{ scene: string; img: string } | null>(null);
  const [draft, setDraft] = useState<BalloonData | null>(null);
  const [base, setBase] = useState<BalloonData | null>(null);
  const [tab, setTab] = useState<'page' | 'phone'>('page');
  const [device, setDevice] = useState<'page' | 'phone'>('page');
  const [scene, setScene] = useState(query.get('scene') ?? '');
  const [beat, setBeat] = useState(Number(query.get('beat') ?? 6) || 0);
  const [frameKey, setFrameKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [toast, setToast] = useState('');
  const [external, setExternal] = useState(false);
  const [site, setSite] = useState<{ up: boolean | null; terminal: string | null }>({ up: null, terminal: null });
  const [starting, setStarting] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const viewRef = useRef<StoryView | null>(null);
  viewRef.current = view;

  const dirty = !!draft && !!base && !same(draft, base);
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;

  const load = useCallback(async (keepSelection = true): Promise<StoryView> => {
    const v = await api.get<StoryView>(`/api/comics/editor/story/${encodeURIComponent(issue)}`);
    setView(v);
    if (!keepSelection) {
      setSel(null);
      setDraft(null);
      setBase(null);
    }
    return v;
  }, [issue]);

  useEffect(() => {
    void api.get<Config>('/api/comics/editor/config').then(setCfg, (e) => setError((e as Error).message));
    load(false).then((v) => {
      if (!scene && v.model?.scenes[0]) setScene(v.model.scenes[0].id);
    }, (e) => setError((e as Error).message));
  }, [issue]);

  const select = (p: Pick, v: StoryView | null = view, force = false) => {
    if (!force && dirtyRef.current) {
      setError('Save or revert the open edit before selecting another balloon.');
      return;
    }
    setError('');
    const b = at(v, p);
    setSel(p);
    setPanelSel({ scene: p.scene, img: p.img });
    setBase(b ? structuredClone(b) : null);
    setDraft(b ? structuredClone(b) : null);
    if (p.scene !== scene) setScene(p.scene);
    if (typeof b?.at === 'number') setBeat(Math.ceil(b.at) + 2);
  };

  // Live: poll the cheap state route and listen for wiki-changed. Clean buffer reloads silently; dirty shows a bar.
  const onDisk = useCallback(async () => {
    try {
      const s = await api.get<{ hash: string; holder: string | null }>(`/api/comics/editor/state/${encodeURIComponent(issue)}`);
      const cur = viewRef.current;
      if (!cur || (s.hash === cur.hash && s.holder === cur.holder)) return;
      if (dirtyRef.current) {
        setExternal(true);
        return;
      }
      const v = await load(true);
      setToast(`Changed by another writer, ${clock()}`);
      setFrameKey((k) => k + 1);
      setSel((p) => {
        if (p && !at(v, p)) {
          setDraft(null);
          setBase(null);
          return null;
        }
        if (p) {
          const b = at(v, p);
          setBase(b ? structuredClone(b) : null);
          setDraft(b ? structuredClone(b) : null);
        }
        return p;
      });
    } catch {
      /* transient: next poll */
    }
  }, [issue, load]);
  useEffect(() => {
    const id = window.setInterval(() => void onDisk(), 2000);
    return () => window.clearInterval(id);
  }, [onDisk]);
  useWikiChanged(['site/src/data/comic-stories/*.ts', 'site/public/comic/**', 'wiki/comics-library/decisions.jsonl'], () => void onDisk());

  // Website preview: poll the site dev server through the app (2 s) so the reader loads as soon as it answers.
  useEffect(() => {
    let live = true;
    const probe = () => api.get<{ up: boolean; terminal: string | null }>('/api/comics/editor/site/status').then((s) => {
      if (!live) return;
      setSite((prev) => {
        if (prev.up === false && s.up) setFrameKey((k) => k + 1);
        return prev.up === s.up && prev.terminal === s.terminal ? prev : s;
      });
      if (s.up) setStarting(false);
    }, () => undefined);
    void probe();
    const id = window.setInterval(() => void probe(), 2000);
    return () => {
      live = false;
      window.clearInterval(id);
    };
  }, []);

  const startSite = async () => {
    setStarting(true);
    try {
      const r = await api.post<{ up: boolean; terminal: string | null }>('/api/comics/editor/site/start', {});
      setSite((p) => ({ up: p.up, terminal: r.terminal }));
    } catch (e) {
      setStarting(false);
      setError((e as Error).message);
    }
  };

  // Direct framing of the Astro dev site (native HMR) when the reader hook answers; the proxy is the fallback.
  const [direct, setDirect] = useState(true);
  const siteOrigin = useMemo(() => {
    try { return cfg ? new URL(cfg.siteBaseUrl).origin : ''; } catch { return ''; }
  }, [cfg?.siteBaseUrl]);
  const useDirect = direct && !!siteOrigin;
  const src = useMemo(() => {
    if (!view || !cfg) return '';
    const q = `${scene ? `scene=${encodeURIComponent(scene)}&` : ''}beat=${beat}&hold&mute`;
    if (useDirect) return `${cfg.siteBaseUrl.replace(/\/$/, '')}/comics/${view.issue.slug}/?editor=${encodeURIComponent(window.location.origin)}&${q}`;
    return proxied(`/comics/${view.issue.slug}/?${q}`, cfg.proxy);
  }, [view?.issue.slug, cfg, scene, beat, frameKey, useDirect]);

  const { geo, status, refresh } = useGeometry(frame, `${src}|${device}`, {
    origin: useDirect ? siteOrigin : undefined,
    onTimeout: useDirect ? () => setDirect(false) : undefined,
  });

  const editable = !!view?.editable;
  const place = (p: Placement) => {
    if (!draft) return;
    if (tab === 'phone') {
      const phone = { ...(draft.phone ?? {}), ...p };
      setDraft({ ...draft, phone });
    } else setDraft({ ...draft, ...p } as BalloonData);
  };

  const run = async (ops: EditOp[], after?: (v: StoryView) => void) => {
    if (!view) return;
    setBusy(true);
    setError('');
    try {
      const out = await api.post<StoryView & { saved: number }>(`/api/comics/editor/save/${encodeURIComponent(issue)}`, { baseHash: view.hash, ops });
      setView(out);
      setFrameKey((k) => k + 1);
      after?.(out);
      setToast(`Saved ${out.saved} change${out.saved === 1 ? '' : 's'}. Speech approvals for this story are now stale.`);
      setExternal(false);
    } catch (e) {
      const msg = (e as Error).message;
      if (/changed on disk/i.test(msg)) await openConflict(ops);
      else setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const openConflict = async (ops: EditOp[]) => {
    const theirs = await load(true);
    const op = ops[0];
    if (op?.op === 'edit' && base && draft) {
      const t = at(theirs, op);
      const patch = diffPatch(base, draft);
      if (t) {
        const { conflicts } = threeWay(base, draft, t);
        setConflict({ fields: conflicts, theirs, patch });
        return;
      }
    }
    setConflict({ fields: [], theirs, patch: {} });
  };

  const save = () => {
    if (!sel || !draft || !base) return;
    const patch = diffPatch(base, draft);
    if (!Object.keys(patch).length) return;
    void run([{ op: 'edit', ...sel, patch }], (v) => select(sel, v, true));
  };

  const insert = () => {
    const target = sel ?? (panelSel ? { ...panelSel, index: -1 } : null);
    if (!target) return setError('Select a panel or balloon first.');
    if (dirty) return setError('Save or revert the open edit first.');
    void run([{ op: 'insert', scene: target.scene, img: target.img, after: target.index, balloon: newBalloon() }], (v) => select({ scene: target.scene, img: target.img, index: target.index + 1 }, v, true));
  };

  const remove = () => {
    if (!sel) return;
    setConfirmDelete(false);
    void run([{ op: 'delete', ...sel }], () => {
      setSel(null);
      setDraft(null);
      setBase(null);
    });
  };

  const resolve = async (choice: 'mine' | 'theirs' | 'reload') => {
    const c = conflict;
    if (!c) return;
    setConflict(null);
    if (choice === 'reload') return void (await load(false));
    if (choice === 'theirs') {
      setView(c.theirs);
      if (sel) {
        const b = at(c.theirs, sel);
        setBase(b ? structuredClone(b) : null);
        setDraft(b ? structuredClone(b) : null);
      }
      setFrameKey((k) => k + 1);
      return;
    }
    if (!sel) return;
    setBusy(true);
    try {
      const out = await api.post<StoryView & { saved: number }>(`/api/comics/editor/save/${encodeURIComponent(issue)}`, { baseHash: c.theirs.hash, ops: [{ op: 'edit', ...sel, patch: c.patch }] });
      setView(out);
      select(sel, out, true);
      setFrameKey((k) => k + 1);
      setToast('Saved over the newer file; only your changed fields were written.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Every agent launch confirms provider, model, effort and permission first (ConfirmLaunch opens the terminal).
  const [pendingLaunch, setPendingLaunch] = useState<{ id: string; title: string; params: Record<string, string> } | null>(null);
  const launch = (id: string, params: Record<string, string>) => setPendingLaunch({ id, title: id === 'comics-editor-check' ? 'Run story checks' : 'Ask an agent to revise this balloon', params });

  if (error && !view) return <div class="stack"><h1>Comic editor</h1><EmptyState>{error}</EmptyState></div>;
  if (!view || !cfg) return <div class="stack"><h1>Comic editor</h1><EmptyState>Loading.</EmptyState></div>;

  const model = view.model;
  const sceneIds = model?.scenes.map((s) => s.id) ?? [];
  const subject = sel ? subjectOf(view.issue.id, sel) : '';
  const textChanged = !!draft && !!base && draft.text !== base.text;

  return (
    <div class="stack ce">
      <h1>Comic editor: {view.issue.id}</h1>
      {view.holder && <p class="notice" role="status">Read-only. {view.readOnlyReason}. The session that holds this file can release it in discussion/handoff.</p>}
      {!view.holder && view.refusal && <p class="notice" role="status">Read-only. {view.readOnlyReason}</p>}
      {view.warning && <p class="notice" role="status">Warning: {view.warning}</p>}
      {external && <p class="notice" role="status"><span>Changed on disk while you have an unsaved edit.</span><Button small help="Opens a window comparing your unsaved edit with the newer version of the story file, so you can choose which to keep. Nothing is written until you choose." onClick={() => { setExternal(false); void openConflict(sel ? [{ op: 'edit', ...sel, patch: {} }] : []); }}>Review</Button></p>}
      {toast && <p class="notice" role="status"><span>{toast}</span><Button small variant="ghost" help="Hides this message. Nothing else changes." onClick={() => setToast('')}>Dismiss</Button></p>}
      {error && <p class="error" role="alert">{error}</p>}
      <Toolbar label="Scene and beat">
        <label class="row small" for="ce-scene">Scene
          <select id="ce-scene" class="select" value={scene} onChange={(e) => setScene((e.target as HTMLSelectElement).value)}>
            {sceneIds.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <Button small help="Moves the preview back one beat of the music, to see what the page looks like earlier in the story. Nothing is changed." onClick={() => setBeat((b) => Math.max(0, b - 1))} aria-label="Previous beat">-</Button>
        <label class="row small" for="ce-beat">Beat
          <input id="ce-beat" class="input ce-beat" type="number" min={0} step={0.5} value={beat} onInput={(e) => setBeat(Number((e.target as HTMLInputElement).value) || 0)} />
        </label>
        <Button small help="Moves the preview forward one beat of the music, to see what the page looks like later in the story. Nothing is changed." onClick={() => setBeat((b) => b + 1)} aria-label="Next beat">+</Button>
        <Button small variant={device === 'phone' ? 'primary' : 'secondary'} help={device === 'phone' ? 'Switches the preview back to the full page layout. Nothing is changed.' : 'Switches the preview to how the comic looks on a phone. Nothing is changed.'} onClick={() => { const next = device === 'phone' ? 'page' : 'phone'; setDevice(next); setTab(next); }}>{device === 'phone' ? 'Phone view' : 'Page view'}</Button>
        <Button small help="Redraws the preview from the latest saved story file. Unsaved edits in the side panel are kept." onClick={() => { setFrameKey((k) => k + 1); refresh(); }}>Reload view</Button>
      </Toolbar>
      <div class="ce-layout">
        <div class="ce-stage-wrap">
          <div class={`ce-stage ce-stage--${device}`}>
            {site.up === false ? (
              <div class="ce-down" role="status">
                <p>Website preview isn't running.</p>
                {starting || site.terminal ? (
                  <p class="small muted">Starting… <a href={buildUrl('operations', ['terminals', ...(site.terminal ? [site.terminal] : [])])}>(open terminal)</a></p>
                ) : (
                  <Button variant="primary" help="Starts the local copy of the website in a terminal so the comic preview can show. You can see and stop it in Operations." onClick={() => void startSite()}>Start website preview</Button>
                )}
              </div>
            ) : site.up === true && (
              <iframe key={frameKey} ref={frame} class="ce-frame" title={`Reader: ${view.issue.slug}`} src={src} onLoad={() => refresh()} />
            )}
            {site.up === true && geo && status === 'ready' && (
              <Overlay geo={geo} selected={sel} selectedPanel={panelSel} draft={draft} target={tab} editable={editable} onSelect={(p) => select(p)} onSelectPanel={setPanelSel} onPlace={place} />
            )}
          </div>
          {site.up === true && status !== 'ready' && <p class="small muted" role="status">{status === 'waiting' ? 'Waiting for the reader geometry.' : `No geometry from the reader. It must load through the app origin (${cfg.proxy}); check the site dev server at ${cfg.siteBaseUrl}. Pick balloons from the list instead.`}</p>}
        </div>
        <aside class="ce-aside" aria-label="Balloon editor">
          <BalloonList model={model} sel={sel} onSelect={(p) => select(p)} scene={scene} open={status !== 'ready'} />
          {draft && sel ? (
            <>
              <p class="small muted">{subject}</p>
              <SidePanel draft={draft} cast={view.cast} tab={tab} onTab={setTab} onChange={setDraft} editable={editable} />
              {textChanged && view.staleApprovals > 0 && <p class="notice small" role="status">Editing text invalidates this story's speech approvals ({view.staleApprovals} on record). They must be reviewed again.</p>}
              {textChanged && view.staleApprovals === 0 && <p class="small muted">Saved text invalidates any speech approval for this story (approval hashes the whole file).</p>}
              <div class="row">
                <Button variant="primary" disabled={!editable || !dirty || busy} help="Writes your changes to this balloon into the comic's story file and records the edit. Changing the words clears any speech approvals for this story, so they need reviewing again." onClick={save}>Save</Button>
                <Button disabled={!dirty} help="Throws away your unsaved changes to this balloon and goes back to what is in the story file." onClick={() => setDraft(base ? structuredClone(base) : null)}>Revert</Button>
                <Button disabled={!editable || busy} help="Adds a new blank balloon right after the selected one in the story file, and selects it so you can fill it in. Save or revert any open edit first." onClick={insert}>Insert after</Button>
                <Button variant="danger" disabled={!editable || busy} help="Opens a window asking you to confirm removing this balloon from the story file. Nothing is removed until you confirm." onClick={() => setConfirmDelete(true)}>Delete</Button>
              </div>
            </>
          ) : (
            <div class="stack">
              <p class="small muted">Select a balloon on the page or in the list.</p>
              <Button disabled={!editable || busy || !panelSel} help="Adds a new blank balloon to the panel you selected in the story file, and selects it so you can fill it in." onClick={insert}>Insert balloon in selected panel</Button>
            </div>
          )}
          <div class="row ce-after">
            <Button disabled={dirty} help={dirty ? 'Save or revert your edit first. Then this opens a terminal where an agent runs the story\'s automatic checks and reports every problem.' : 'Opens a terminal where an agent runs the story\'s automatic checks and reports every problem. It changes nothing.'} onClick={() => void launch('comics-editor-check', { story: view.issue.id })}>Run checks</Button>
            <Button disabled={dirty || !sel} help={sel ? 'Opens a window where you say what should change in this balloon. Launching it opens a terminal where an agent rewrites it in the story file.' : 'Select a balloon first. Then you can ask an agent to rewrite it.'} onClick={() => setAskOpen(true)}>Ask an agent</Button>
          </div>
        </aside>
      </div>
      {confirmDelete && sel && (
        <Dialog title="Delete balloon" onClose={() => setConfirmDelete(false)} footer={<><Button variant="ghost" help="Closes this window. The balloon is kept." onClick={() => setConfirmDelete(false)}>Cancel</Button><Button variant="danger" help="Removes this balloon from the story file now. Later balloons in the same panel are renumbered, and the deletion is logged." onClick={remove}>Delete</Button></>}>
          <p>Delete {subject}? The line leaves the story file and later balloons in this panel renumber. The decision is logged.</p>
        </Dialog>
      )}
      {askOpen && sel && (
        <Dialog title="Ask an agent" onClose={() => setAskOpen(false)} footer={<><Button variant="ghost" help="Closes this window without asking anything." onClick={() => setAskOpen(false)}>Cancel</Button><Button variant="primary" disabled={!instruction.trim()} help="Opens a terminal where an agent rewrites this balloon in the story file following your instruction. You can watch it there." onClick={() => { setAskOpen(false); void launch('comics-editor-revise', { story: view.issue.id, scene: sel.scene, panel: sel.img, balloon: String(sel.index + 1), instruction: instruction.trim() }); }}>Launch</Button></>}>
          <div class="field">
            <label for="ce-instruction">What should change for {subject}</label>
            <textarea id="ce-instruction" class="input area" rows={4} value={instruction} onInput={(e) => setInstruction((e.target as HTMLTextAreaElement).value)} />
          </div>
        </Dialog>
      )}
      {conflict && (
        <Dialog title="The story file changed on disk" onClose={() => setConflict(null)} footer={<><Button variant="ghost" help="Drops your unsaved edit and loads the newer story file as it is now." onClick={() => void resolve('reload')}>Reload</Button><Button help="Discards your edit to this balloon and uses the newer story file's version." onClick={() => void resolve('theirs')}>Take theirs</Button><Button variant="primary" disabled={!sel || !Object.keys(conflict.patch).length} help="Writes only the fields you changed on top of the newer story file, so the other changes in the newer file stay." onClick={() => void resolve('mine')}>Keep mine</Button></>}>
          {conflict.fields.length ? (
            <ul class="plain">
              {conflict.fields.map((f) => <li key={f.field}><strong>{f.field}</strong>: mine {JSON.stringify(f.mine)}; theirs {JSON.stringify(f.theirs)}</li>)}
            </ul>
          ) : (
            <p>Nothing overlaps with your fields. Keep mine writes only the fields you changed on top of the new file.</p>
          )}
          <p class="small muted">Nothing is written until you choose. Keep mine changes only this balloon's line; take theirs discards your edit; reload drops all local state.</p>
        </Dialog>
      )}
      {pendingLaunch && (
        <ConfirmLaunch
          operation={pendingLaunch.id}
          title={pendingLaunch.title}
          body="Choose which agent, model and effort do this. Nothing starts until you press Launch."
          onClose={() => setPendingLaunch(null)}
          run={([runner, permission, choice]) => api.launch(pendingLaunch.id, pendingLaunch.params, runner, permission === 'default' ? undefined : permission, choice)}
        />
      )}
    </div>
  );
}

function BalloonList({ model, sel, onSelect, scene, open }: { model: StoryModel | null; sel: Pick | null; onSelect(p: Pick): void; scene: string; open: boolean }) {
  if (!model) return null;
  const sc = model.scenes.find((s) => s.id === scene) ?? model.scenes[0];
  if (!sc) return null;
  return (
    <details class="ce-list" open={open || undefined}>
      <summary>Balloons in {sc.id}</summary>
      <ul class="plain ce-items">
        {sc.panels.flatMap((p) => p.balloons.map((b, i) => (
          <li key={`${p.img}-${i}`}>
            <button type="button" class={`ce-item${sel && sel.scene === sc.id && sel.img === p.img && sel.index === i ? ' is-selected' : ''}`} title="Selects this balloon so you can edit it in the side panel. Nothing is changed until you save." onClick={() => onSelect({ scene: sc.id, img: p.img, index: i })}>
              <span class="small muted">{p.img} #{i + 1} {b.who}</span> {b.text.replace(/\n/g, ' ').slice(0, 60)}
            </button>
          </li>
        )))}
      </ul>
    </details>
  );
}
