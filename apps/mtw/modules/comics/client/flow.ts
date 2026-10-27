// Pure logic for the Comics review views (no DOM, no Preact), so the rules are testable in node.
import type { Counts, ReviewState } from './types';

// ---------------------------------------------------------------------------------------------------- word diff

export interface DiffSeg {
  op: 'same' | 'add' | 'del';
  text: string;
}

const words = (s: string): string[] => s.split(/\s+/).filter(Boolean);

/** Word-level diff (longest common subsequence). Whitespace and line breaks are not significant. */
export function wordDiff(before: string, after: string): DiffSeg[] {
  const a = words(before);
  const b = words(after);
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table = new Uint16Array(rows * cols);
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i * cols + j] = a[i] === b[j] ? (table[(i + 1) * cols + j + 1] as number) + 1 : Math.max(table[(i + 1) * cols + j] as number, table[i * cols + j + 1] as number);
    }
  }
  const out: DiffSeg[] = [];
  const push = (op: DiffSeg['op'], word: string) => {
    const last = out[out.length - 1];
    if (last && last.op === op) last.text += ` ${word}`;
    else out.push({ op, text: word });
  };
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      push('same', a[i] as string);
      i++;
      j++;
    } else if (i < a.length && (j === b.length || (table[(i + 1) * cols + j] as number) >= (table[i * cols + j + 1] as number))) {
      push('del', a[i++] as string);
    } else {
      push('add', b[j++] as string);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------- panel crop

export type Rect = [number, number, number, number];
export interface CropLayout {
  /** width / height of the visible crop for the container's aspect-ratio. */
  aspect: number;
  /** Absolutely positioned image: width as a percentage of the container. */
  widthPct: number;
  leftPct: number;
  /** Percentage of the container height. */
  topPct: number;
}

/**
 * Show only `rect` ([x, y, w, h] as fractions of the page art) of an image with natural size `natural`.
 * Returns null for an empty or out-of-range rect. Values are clamped into the page.
 */
export function cropLayout(rect: Rect, natural: { width: number; height: number }): CropLayout | null {
  const [x0, y0, w0, h0] = rect;
  if (!(natural.width > 0 && natural.height > 0)) return null;
  const x = Math.min(Math.max(x0, 0), 1);
  const y = Math.min(Math.max(y0, 0), 1);
  const w = Math.min(w0, 1 - x);
  const h = Math.min(h0, 1 - y);
  if (!(w > 0 && h > 0)) return null;
  return {
    aspect: (w * natural.width) / (h * natural.height),
    widthPct: 100 / w,
    leftPct: (-x / w) * 100,
    topPct: (-y / h) * 100,
  };
}

// ---------------------------------------------------------------------------------------------------- progress

export const STATES: ReviewState[] = ['approved', 'rejected', 'pending', 'stale', 'unvoiced'];

export function countStates(rows: { state: ReviewState }[]): Counts {
  const c: Counts = { total: rows.length, approved: 0, rejected: 0, stale: 0, pending: 0, unvoiced: 0 };
  for (const r of rows) c[r.state]++;
  return c;
}

export interface MeterSegment {
  state: ReviewState;
  count: number;
  pct: number;
}
/** Segment widths for a stacked meter; segments with no balloons are dropped and widths sum to 100 (or 0 when empty). */
export function meterSegments(c: Counts): MeterSegment[] {
  if (c.total <= 0) return [];
  return STATES.filter((s) => c[s] > 0).map((s) => ({ state: s, count: c[s], pct: (c[s] / c.total) * 100 }));
}

export const meterLabel = (c: Counts): string =>
  `${c.approved} approved, ${c.rejected} rejected, ${c.pending} to review, ${c.stale} stale${c.unvoiced ? `, ${c.unvoiced} unvoiced` : ''} of ${c.total}`;

// ---------------------------------------------------------------------------------------------------- filters

export interface FilterRow {
  id: string;
  text: string;
  characterId: string;
  state: ReviewState;
}
export interface RowFilter {
  /** `all` or empty: any; `open`: to review or stale; otherwise one state. */
  state?: string;
  character?: string;
  q?: string;
  /** Ids shown regardless of the state filter (balloons decided in this sitting stay in the queue so it does not jump). */
  keep?: ReadonlySet<string>;
}

/** Search covers balloon text, character id and name, and the balloon id. */
export function filterRows<T extends FilterRow>(rows: T[], f: RowFilter, names: Record<string, string> = {}): T[] {
  const q = (f.q ?? '').trim().toLowerCase();
  const stateOk = (r: T): boolean => {
    if (!f.state || f.state === 'all' || f.keep?.has(r.id)) return true;
    return f.state === 'open' ? r.state === 'pending' || r.state === 'stale' : r.state === f.state;
  };
  return rows.filter((r) => stateOk(r) && (!f.character || r.characterId === f.character) && (!q || `${r.text} ${r.characterId} ${names[r.characterId] ?? ''} ${r.id}`.toLowerCase().includes(q)));
}

// ---------------------------------------------------------------------------------------------------- shortcuts and flow

export type Command = 'play' | 'approve' | 'reject' | 'next' | 'prev' | 'undo';

export const SHORTCUTS: { key: string; command: Command; label: string }[] = [
  { key: 'Space', command: 'play', label: 'Play' },
  { key: 'A', command: 'approve', label: 'Approve / unapprove' },
  { key: 'R', command: 'reject', label: 'Unapprove' },
  { key: 'J', command: 'next', label: 'Next' },
  { key: 'K', command: 'prev', label: 'Previous' },
  { key: 'U', command: 'undo', label: 'Undo' },
];

export interface KeyInfo {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  alt?: boolean;
  /** Focus is in a text field, select or editable region. */
  typing?: boolean;
  /** Focus is on a button or link, which already owns Space and Enter. */
  onControl?: boolean;
}

/** Map a key press to a review command, or null when the key must be left alone. */
export function commandForKey(k: KeyInfo): Command | null {
  if (k.ctrl || k.meta || k.alt || k.typing) return null;
  if (k.key === ' ' || k.key === 'Spacebar') return k.onControl ? null : 'play';
  switch (k.key.toLowerCase()) {
    case 'a':
      return 'approve';
    case 'r':
      return 'reject';
    case 'j':
      return 'next';
    case 'k':
      return 'prev';
    case 'u':
      return 'undo';
    default:
      return null;
  }
}

export interface Decided {
  id: string;
  /** State before the decision, to restore on undo. */
  prev: ReviewState;
  action: 'approve' | 'reject';
}
export interface FlowState {
  current: string | null;
  undo: Decided[];
}
export type FlowAction =
  | { type: 'goto'; id: string }
  | { type: 'move'; dir: 1 | -1 }
  | { type: 'decided'; decision: Decided }
  | { type: 'undone' };
export interface FlowContext {
  /** Visible ids in order. */
  ids: string[];
  states: Record<string, ReviewState>;
}

const OPEN: ReviewState[] = ['pending', 'stale'];

/** The next id that still needs a decision after `from` (wrapping once), else the plain next id, else `from`. */
export function nextOpen(ctx: FlowContext, from: string | null): string | null {
  const { ids, states } = ctx;
  if (ids.length === 0) return null;
  const at = from === null ? -1 : ids.indexOf(from);
  for (let n = 1; n <= ids.length; n++) {
    const id = ids[(at + n + ids.length) % ids.length] as string;
    if (id !== from && OPEN.includes(states[id] as ReviewState)) return id;
  }
  return ids[Math.min(at + 1, ids.length - 1)] ?? from;
}

/** Keeps `current` valid when the list changes under it (live reload, filter): stays on the same id when it still exists. */
export function settle(state: FlowState, ctx: FlowContext): FlowState {
  if (state.current && ctx.ids.includes(state.current)) return state;
  return { ...state, current: ctx.ids.find((id) => OPEN.includes(ctx.states[id] as ReviewState)) ?? ctx.ids[0] ?? null };
}

export function flowReduce(state: FlowState, action: FlowAction, ctx: FlowContext): FlowState {
  switch (action.type) {
    case 'goto':
      return ctx.ids.includes(action.id) ? { ...state, current: action.id } : state;
    case 'move': {
      if (ctx.ids.length === 0) return state;
      const at = state.current === null ? -1 : ctx.ids.indexOf(state.current);
      const to = Math.min(Math.max(at + action.dir, 0), ctx.ids.length - 1);
      return { ...state, current: ctx.ids[to] ?? null };
    }
    case 'decided': {
      // The decided id counts as closed for the purpose of finding the next one to look at.
      const states = { ...ctx.states, [action.decision.id]: action.decision.action === 'approve' ? 'approved' : ('rejected' as ReviewState) };
      return { current: nextOpen({ ids: ctx.ids, states }, action.decision.id), undo: [...state.undo, action.decision] };
    }
    case 'undone': {
      const last = state.undo[state.undo.length - 1];
      if (!last) return state;
      return { current: last.id, undo: state.undo.slice(0, -1) };
    }
  }
}

/** The write that restores a state: back to unreviewed (or stale, which only an old review can be) is a revoke. */
export function restoreAction(prev: ReviewState): 'approve' | 'reject' | 'revoke' {
  return prev === 'approved' ? 'approve' : prev === 'rejected' ? 'reject' : 'revoke';
}

// ---------------------------------------------------------------------------------------------------- live awareness

const LABELS: [RegExp, string][] = [
  [/speech-approvals\.json$/, 'Speech approvals'],
  [/speech\.json$/, 'Speech takes'],
  [/voices\.json$/, 'Voice casting'],
  [/provider-voices\.json$/, 'Voice catalog'],
  [/casting(?:-runtime)?\.(?:js|mjs|ts)$/, 'Casting rules'],
  [/decisions\.jsonl$/, 'Decisions'],
  [/sounds\.json$/, 'Sounds'],
  [/characters\.json$/, 'Characters'],
];

/** "Speech approvals and Voice casting updated by another writer" for a set of changed repo paths. */
export function describeChange(paths: string[]): string {
  const names: string[] = [];
  for (const p of paths) {
    const hit = LABELS.find(([re]) => re.test(p.replace(/\\/g, '/')));
    const name = hit ? hit[1] : 'Comics files';
    if (!names.includes(name)) names.push(name);
  }
  if (names.length === 0) return 'Comics files updated by another writer';
  const list = names.length === 1 ? (names[0] as string) : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  return `${list} updated by another writer`;
}

// ---------------------------------------------------------------------------------------------------- tokens adapter

export interface TokensSpent {
  total: number;
  runs: number;
}
/** Tolerant reader for GET /api/tokens/by: `{total, runs}`, `{row: {...}}` or `{rows: [...]}`; null when unrecognised. */
export function parseTokens(json: unknown): TokensSpent | null {
  const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  const one = (v: unknown): TokensSpent | null => {
    if (!v || typeof v !== 'object') return null;
    const o = v as Record<string, unknown>;
    const total = typeof o.total === 'number' ? o.total : num(o.input) + num(o.output) + num(o.cacheRead) + num(o.cacheWrite);
    return { total, runs: num(o.runs) };
  };
  if (json && typeof json === 'object') {
    const o = json as Record<string, unknown>;
    if (Array.isArray(o.rows)) return o.rows.reduce<TokensSpent>((s, r) => ({ total: s.total + (one(r)?.total ?? 0), runs: s.runs + (one(r)?.runs ?? 0) }), { total: 0, runs: 0 });
    if (o.row) return one(o.row);
    if ('total' in o || 'input' in o) return one(o);
  }
  return null;
}

export const compactNumber = (n: number): string => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : String(n));

// ---------------------------------------------------------------------------------------------------- voice comparison

export interface Take {
  src: string;
  /** True when the take speaks the reference line (a fair A/B), false for a provider preview of some other line. */
  sameLine: boolean;
  line: string;
}
export interface CompareVoice {
  ref: string;
  voiceId: string;
  provider: string;
  preview?: string;
}
export interface CompareClip {
  voiceId?: string;
  provider?: string;
  text: string;
  preview?: string;
}

/**
 * Choose the line to A/B and one take per voice. The reference line is the one most of the compared voices have an
 * audition clip for (ties go to the earlier clip text, then the profile sample line); a voice without a take of that
 * line falls back to its provider preview, marked `sameLine: false`.
 */
export function pickTakes(voices: CompareVoice[], clips: CompareClip[], sampleLine = ''): { line: string; takes: (Take | null)[] } {
  const mine = (v: CompareVoice) => clips.filter((c) => c.preview && c.voiceId === v.voiceId && (!c.provider || c.provider === v.provider));
  const tally = new Map<string, number>();
  for (const v of voices) for (const t of new Set(mine(v).map((c) => c.text.trim()).filter(Boolean))) tally.set(t, (tally.get(t) ?? 0) + 1);
  let line = sampleLine.trim();
  let best = line ? (tally.get(line) ?? 0) : 0;
  for (const [t, n] of tally) {
    if (n > best) {
      line = t;
      best = n;
    }
  }
  return {
    line,
    takes: voices.map((v) => {
      const clip = mine(v).find((c) => c.text.trim() === line);
      if (clip?.preview) return { src: clip.preview, sameLine: true, line };
      return v.preview ? { src: v.preview, sameLine: false, line: '' } : null;
    }),
  };
}

/** Next slot to play in a back-to-back run, skipping slots with no audio; null when the run is over. */
export function nextSlot(takes: (Take | null)[], after: number): number | null {
  for (let i = after + 1; i < takes.length; i++) if (takes[i]) return i;
  return null;
}

/** Keys 1 to 3 pick a compared voice; returns the zero-based slot or null. */
export function slotForKey(key: string, count: number): number | null {
  const n = Number(key);
  return Number.isInteger(n) && n >= 1 && n <= count ? n - 1 : null;
}
