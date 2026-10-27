// Shared agent chat panel for any Studio screen: a prompt box (typed or spoken) with an optional common-issues pop-up.
// Send launches the screen's procedure; the panel then becomes that run's terminal, with a composer under it (typed or
// spoken) to keep iterating. When the run ends (exit, or Studio closing it after the procedure's idleMinutes, when its
// prompt cache has expired) the terminal disappears and the prompt box returns for a fresh start.
// Prompt caching: every launch renders the procedure's stable body first and only the short "This run" section last;
// follow-ups go into the same live session instead of new runs, so they reuse its warm cache.
import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { api } from '../api';
import { terminals } from '../state';
import { TerminalPane } from '../../modules/operations/TerminalPane';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { Badge } from './Layout';
import { LaunchConfirm, useLaunchChoice } from './LaunchConfirm';
import { appendDictation, chatDraftKey, emptyChatDraft, parseChatDraft, promptAfterSend, replyAfterSend, terminalLine } from './chatText';
import type { ChatDraft } from './chatText';
import { MicButton, useDictation } from './VoiceInput';
import { useFillHeight } from './useFillHeight';
import './chat.css';

export interface ChatPreset { id: string; label: string; instruction: string; scope?: string }
export interface ChatRun { id: string; status: string }
function storedDraft(key: string): ChatDraft { try { return parseChatDraft(sessionStorage.getItem(key)); } catch { return emptyChatDraft(); } }
function storeDraft(key: string, draft: ChatDraft): void { try { if (draft.note || draft.reply || draft.chosen.length) sessionStorage.setItem(key, JSON.stringify(draft)); else sessionStorage.removeItem(key); } catch { /* Preserve component state when storage is unavailable. */ } }

export interface AgentChatProps {
  /** Accessible name of the panel, e.g. "Feedback for this box". */
  label: string;
  title: string;
  /** Procedure id and tracking subject: the panel finds its live run by these. */
  operation: string;
  subject: string;
  placeholder: string;
  hint?: string;
  loadPresets?: () => Promise<ChatPreset[]>;
  scopeLabels?: Record<string, string>;
  /** Optional user-invoked checks inside Common Issues; selecting flags never sends the conversation. */
  presetTools?: (select: (ids: string[]) => void) => ComponentChildren;
  /** `model`/`effort` are set only when chosen; absent means the procedure's frontmatter default for the runner. */
  launch: (req: { fixes: string[]; note: string; runner: string; permission: string; model?: string; effort?: string }) => Promise<{ id: string }>;
  /** The run the screen's own data reported (covers the moment before the live terminal list arrives). */
  knownRun?: ChatRun | null;
  /** Text to add to the prompt box (e.g. from an "Ask for a change" button); cleared through onPrefilled. */
  prefill?: string;
  onPrefilled?: () => void;
  /** Retired: the provider list now comes from runners.json through the shared confirm control. */
  runners?: { id: string; label: string }[];
  /** The screen is switching items: nothing can be sent until it settles. */
  waiting?: boolean;
}

/** The default provider from config/studio.json (Operations > Defaults), read once per page load. */
let defaultRunnerP: Promise<string> | null = null;
const defaultRunner = (): Promise<string> => (defaultRunnerP ??= api.settings().then((s) => s.defaultRunner, () => 'claude'));


function PresetPicker({ load, scopeLabels, chosen, onChange, onClose, tools }: { load: () => Promise<ChatPreset[]>; scopeLabels?: Record<string, string>; chosen: string[]; onChange: (ids: string[]) => void; onClose: () => void; tools?: AgentChatProps['presetTools'] }) {
  const [presets, setPresets] = useState<ChatPreset[]>([]);
  const [error, setError] = useState('');
  useEffect(() => void load().then(setPresets, (e: Error) => setError(e.message)), [load]);
  const toggle = (id: string) => onChange(chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id]);
  // The letter beside each issue selects it from the keyboard.
  const keyed = useRef({ presets, toggle });
  keyed.current = { presets, toggle };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || !/^[a-z]$/.test(e.key)) return;
      const hit = keyed.current.presets[e.key.charCodeAt(0) - 97];
      if (!hit) return;
      e.preventDefault();
      keyed.current.toggle(hit.id);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  return (
    <Dialog
      title="Common issues (press a letter to pick)"
      onClose={onClose}
      wide
      footer={
        <Button variant="primary" help="Closes the list of common issues and keeps the ones you ticked. Nothing is sent yet." onClick={onClose}>
          Done{chosen.length ? ` (${chosen.length})` : ''}
        </Button>
      }
    >
      <div class="stack">
        {tools?.(ids => onChange([...new Set([...chosen, ...ids])]))}
        {error && <p class="error">{error}</p>}
        <ol class="chat-issues">
          {presets.map((p, i) => (
            <li key={p.id}>
              <button type="button" class="chip chat-issue" aria-pressed={chosen.includes(p.id)} title={`${p.instruction} Click to tick or untick this issue so it is included in your message. Nothing is sent yet.`} onClick={() => toggle(p.id)}>
                <span class="chat-issue-key">{i < 26 ? String.fromCharCode(97 + i) : ''}</span> {p.label}
                {p.scope && <span class="muted small"> {scopeLabels?.[p.scope] ?? p.scope}</span>}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </Dialog>
  );
}

export function AgentChat(props: AgentChatProps) {
  const { label, title, operation, subject, placeholder, hint, loadPresets, scopeLabels, launch, knownRun, prefill, onPrefilled, waiting = false } = props;
  const draftKey = chatDraftKey(operation, subject);
  const [note, setNoteState] = useState(() => storedDraft(draftKey).note);
  const [chosen, setChosenState] = useState<string[]>(() => storedDraft(draftKey).chosen);
  const [picking, setPicking] = useState(false);
  // Provider, model, effort and permission are confirmed before the first send; they start from the studio's default
  // provider and the procedure's frontmatter models for it.
  const [preferred, setPreferred] = useState<string | undefined>();
  useEffect(() => void defaultRunner().then(setPreferred), []);
  const launchState = useLaunchChoice(operation, preferred);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [started, setStarted] = useState<string | null>(null);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [reply, setReplyState] = useState(() => storedDraft(draftKey).reply);
  const send = useRef<((data: string) => boolean) | null>(null);
  const panel = useRef<HTMLElement>(null);
  useFillHeight(panel);
  const area = useRef<HTMLTextAreaElement>(null);

  const mutateDraft = (change: (draft: ChatDraft) => ChatDraft): void => {
    const current = activeDraftKey.current === draftKey ? draftLive.current : storedDraft(draftKey), next = change(current);
    storeDraft(draftKey, next); draftLive.current = next; activeDraftKey.current = draftKey;
    setNoteState(next.note); setReplyState(next.reply); setChosenState(next.chosen);
  };
  const setNote = (value: string | ((old: string) => string)) => mutateDraft(d => ({ ...d, note: typeof value === 'function' ? value(d.note) : value }));
  const setReply = (value: string | ((old: string) => string)) => mutateDraft(d => ({ ...d, reply: typeof value === 'function' ? value(d.reply) : value }));
  const setChosen = (value: string[] | ((old: string[]) => string[])) => mutateDraft(d => ({ ...d, chosen: typeof value === 'function' ? value(d.chosen) : value }));

  const promptVoice = useDictation((t) => setNote((n) => appendDictation(n, t)));
  const replyVoice = useDictation((t) => setReply((n) => appendDictation(n, t)));

  useEffect(() => {
    if (loadPresets) void loadPresets().then((all) => setLabels(Object.fromEntries(all.map((p) => [p.id, p.label]))), () => undefined);
  }, [loadPresets]);
  useEffect(() => {
    setStarted(null);
    setError('');
    setBusy(false);
    setPicking(false);
  }, [operation, subject]);
  useEffect(() => {
    if (!prefill) return;
    setNote((n) => (n ? `${n}\n${prefill}` : prefill));
    onPrefilled?.();
    area.current?.focus();
  }, [prefill]); // eslint-disable-line react-hooks/exhaustive-deps

  const mine = terminals.value.filter((t) => t.operation === operation && t.subject === subject);
  const running =
    mine.find((t) => t.status === 'running') ??
    (started && !mine.some((t) => t.id === started) ? { id: started, status: 'running' } : null) ??
    (knownRun?.status === 'running' && !mine.length ? knownRun : null);
  const last = mine.find((t) => t.status === 'exited');
  useEffect(() => {
    if (!running) {
      promptVoice.stop();
      replyVoice.stop();
    }
  }, [running?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = async () => {
    const sentKey = draftKey, snapshot = { note, chosen: [...chosen] };
    promptVoice.stop();
    setBusy(true);
    setError('');
    try {
      const [runner, permission, pick] = launchState.args();
      const t = await launch({ fixes: chosen, note, runner, permission, ...pick });
      const current = activeDraftKey.current === sentKey ? draftLive.current : storedDraft(sentKey), cleared = promptAfterSend(current, snapshot);
      storeDraft(sentKey, cleared);
      if (activeDraftKey.current === sentKey) { draftLive.current = cleared; setNoteState(cleared.note); setChosenState(cleared.chosen); setStarted(t.id); }
    } catch (e) {
      if (activeDraftKey.current === sentKey) setError((e as Error).message);
    } finally {
      if (activeDraftKey.current === sentKey) setBusy(false);
    }
  };
  const sendReply = () => {
    const line = terminalLine(reply);
    if (busy || !line || !send.current) return;
    const sender = send.current, sentKey = draftKey, snapshot = reply;
    replyVoice.stop();
    try { if (!sender(line)) return setError('The terminal is disconnected; your reply is kept.'); } catch (e) { return setError((e as Error).message); }
    setBusy(true);
    // A separate Enter, so the agent's prompt takes the pasted line first.
    window.setTimeout(() => {
      try {
        if (!sender('\r')) { if (activeDraftKey.current === sentKey) setError('The connection closed before Send finished; your reply is kept.'); return; }
        const current = activeDraftKey.current === sentKey ? draftLive.current : storedDraft(sentKey), cleared = replyAfterSend(current, snapshot);
        storeDraft(sentKey, cleared);
        if (activeDraftKey.current === sentKey) { draftLive.current = cleared; setReplyState(cleared.reply); }
      } catch (e) { if (activeDraftKey.current === sentKey) setError((e as Error).message); }
      finally { if (activeDraftKey.current === sentKey) setBusy(false); }
    }, 60);
  };

  // Added after the existing hooks so hot updates retain the existing note/reply state where supported.
  const activeDraftKey = useRef(draftKey), draftLive = useRef<ChatDraft>({ note, reply, chosen });
  if (activeDraftKey.current === draftKey) draftLive.current = { note, reply, chosen };
  useEffect(() => {
    if (activeDraftKey.current !== draftKey) {
      const next = storedDraft(draftKey); activeDraftKey.current = draftKey; draftLive.current = next;
      setNoteState(next.note); setReplyState(next.reply); setChosenState(next.chosen);
    } else storeDraft(draftKey, draftLive.current);
  }, [draftKey]);

  if (running) {
    const info = mine.find((t) => t.id === running.id);
    return (
      <aside class="chat chat--live" ref={panel} aria-label={label}>
        <div class="chat-head">
          <Badge status="running">Working</Badge>
          <span class="small muted">
            {info?.runner ?? launchState.choice.runner}
            {info?.model ? ` · ${info.model}` : ''}
            {info?.effort ? ` · ${info.effort} effort` : ''} · {running.id}
            {info?.idleMinutes ? ` · closes after ${info.idleMinutes} quiet minutes` : ''}
          </span>
          <Button small variant="ghost" help="Stops this conversation with the agent right now. Anything it was still working on is abandoned." onClick={() => void api.killTerminal(running.id).catch((e: Error) => setError(e.message))}>
            End
          </Button>
        </div>
        <div class="chat-term">
          <TerminalPane id={running.id} running bind={(fn) => (send.current = fn)} />
        </div>
        <div class="chat-compose">
          <textarea
            class="input"
            rows={2}
            value={reply + (replyVoice.interim ? ` ${replyVoice.interim}` : '')}
            placeholder="Reply to the agent (or type in the terminal)"
            aria-label="Reply to the agent"
            onInput={(e) => setReply((e.target as HTMLTextAreaElement).value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendReply();
              }
            }}
          />
          <MicButton dictation={replyVoice} label="Speak a reply" />
          <Button small variant="primary" help="Sends what you typed to the agent as your answer. It is only sent when you press this." disabled={busy || !terminalLine(reply)} onClick={sendReply}>
            Send
          </Button>
        </div>
        {(error || replyVoice.error) && <p class="error small">{error || replyVoice.error}</p>}
      </aside>
    );
  }

  return (
    <aside class="chat" ref={panel} aria-label={label} aria-busy={waiting}>
      <h2 class="chat-title">{title}</h2>
      {last && (
        <p class="small muted" role="status">
          {last.closedReason === 'idle' ? `The last conversation closed after ${last.idleMinutes ?? ''} quiet minutes. Start a new one here.` : 'The last conversation ended. Start a new one here.'}
        </p>
      )}
      {loadPresets && (
        <div class="row chat-chosen">
          <Button small help="Opens a list of common problems you can tick so the agent knows what to fix. Nothing is sent until you press Send." onClick={() => setPicking(true)}>
            Common issues…
          </Button>
          {chosen.map((id) => (
            <button key={id} type="button" class="chip" aria-pressed="true" title="Takes this common issue back out of your message. Nothing is sent." onClick={() => setChosen((c) => c.filter((x) => x !== id))}>
              {labels[id] ?? id} ×
            </button>
          ))}
        </div>
      )}
      <div class="chat-field">
        <textarea
          ref={area}
          class="input chat-note"
          rows={8}
          value={note + (promptVoice.interim ? ` ${promptVoice.interim}` : '')}
          placeholder={placeholder}
          aria-label="Your message"
          onInput={(e) => setNote((e.target as HTMLTextAreaElement).value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !waiting && (chosen.length || note.trim())) {
              e.preventDefault();
              void start();
            }
          }}
        />
      </div>
      <LaunchConfirm state={launchState} idPrefix={`chat-${operation}`} />
      <div class="row chat-send">
        <MicButton dictation={promptVoice} label="Speak your message" />
        <Button variant="primary" help="Starts an agent working on your message and any ticked common issues, using the provider, model and effort chosen above. You can follow it and reply as it works." disabled={waiting || busy || !launchState.ready || (!chosen.length && !note.trim())} onClick={() => void start()}>
          Send
        </Button>
      </div>
      <p class="small muted">Ctrl+Enter sends.{hint ? ` ${hint}` : ''}</p>
      {(error || promptVoice.error) && (
        <p class="error" role="alert">
          {error || promptVoice.error}
        </p>
      )}
      {picking && loadPresets && <PresetPicker load={loadPresets} scopeLabels={scopeLabels} chosen={chosen} onChange={setChosen} onClose={() => setPicking(false)} tools={props.presetTools} />}
    </aside>
  );
}

