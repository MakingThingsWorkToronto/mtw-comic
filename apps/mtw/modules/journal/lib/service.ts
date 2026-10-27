// Server data layer for the Journal module: state (cached by a cheap file fingerprint), decisions, cover refs,
// operation options. Replaces the old build/write/render cycle of wiki/journal/console. Never writes queue.md or
// README approvals: the only write path is services.decisions (wiki/journal/decisions.jsonl).
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import type { AssetSummary, Services } from '../../types';
import { UNKNOWN, queueView } from '../shared';
import type { CoverRow, DecisionRec, JournalState, QueueRowRaw } from '../shared';
import { CANDIDATES_REL } from './candidates';
import { buildState, chooseProposals, measuredState } from './state';

const SKIP_DIRS = new Set(['node_modules', '.git']);
const SCENES_REL = 'wiki/image-library/assets/scenes/journal';
const COVER_MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml' };
export const STATIC_CHANNELS = ['web', 'x-bookmarks', 'x-history', 'x-following', 'x-timeline'];

/** mtime+size of every file the state reads. Cheap enough to check per request; replaces SSE-driven invalidation. */
function fingerprint(root: string, today: string): string {
  const parts: string[] = [today];
  const walk = (dir: string): void => {
    let names: string[];
    try {
      names = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of names) {
      if (SKIP_DIRS.has(name)) continue;
      const full = path.join(dir, name);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) walk(full);
      else parts.push(`${path.relative(root, full)}:${st.mtimeMs}:${st.size}`);
    }
  };
  walk(path.join(root, 'wiki', 'journal'));
  walk(path.join(root, SCENES_REL));
  return parts.join('|');
}

const DROP_FROM_OVERVIEW = ['prompts', 'queuePrompts', 'promptTemplates', 'glossary', 'limits', 'interviews', 'legacyInterviews', 'candidates', 'backlog', 'pages'];

export function slimState(state: JournalState): JournalState {
  const slim: Record<string, unknown> = { ...state };
  for (const k of DROP_FROM_OVERVIEW) delete slim[k];
  slim.answersIndex = { found: (state.answersIndex as { found: boolean }).found, answered: (state.answersIndex as { answered: unknown }).answered, open: (state.answersIndex as { open: unknown }).open };
  slim.entries = state.entries.map((e) => {
    const copy: Record<string, unknown> = { ...e };
    delete copy.controlPrompts;
    return copy;
  });
  slim.concepts = state.concepts.map((c) => {
    const copy: Record<string, unknown> = { ...c };
    delete copy.controlPrompts;
    return copy;
  });
  return slim as unknown as JournalState;
}

export interface OperationOptions {
  channels: string[];
  concepts: { value: string; label: string; number: number; entry: string | null }[];
  entries: { value: string; label: string }[];
  rejected: { value: string; label: string }[];
}

const norm = (v: unknown): string => String(v ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Concepts offered to the operation dropdowns: those queue.md lists in the Queue group, then the candidates
 *  (no entry folder, not published or rejected), so open-entry can be launched for a fresh candidate. */
export function liveConcepts(s: JournalState): JournalState['concepts'] {
  const sameRow = (row: QueueRowRaw, c: JournalState['concepts'][number]): boolean =>
    Boolean((c.entrySlug && row.slug === c.entrySlug) || norm(row.entry) === norm(c.headline) || norm(row.entry) === norm(c.title));
  if (!s.queue.found) return s.concepts;
  return s.concepts.filter((c) => {
    if (s.queue.published.some((r) => sameRow(r, c))) return false;
    if (s.queue.rejected.some((r) => sameRow(r, c))) return false;
    return s.queue.queue.some((r) => sameRow(r, c)) || !c.entrySlug;
  });
}

export function operationOptions(s: JournalState, root = ''): OperationOptions {
  const channels = s.coverage.channels.length ? s.coverage.channels.map((c) => c.channel) : STATIC_CHANNELS;
  return {
    channels,
    concepts: liveConcepts(s).map((c) => ({ value: String(c.number), label: c.headline, number: c.number, entry: c.entrySlug })),
    entries: s.entries.map((e) => ({ value: e.slug, label: e.title })),
    rejected: s.queue.rejected.map((r) => ({ value: r.entry, label: r.entry })),
  };
}

interface Cached {
  fp: string;
  state: JournalState;
  proposals: { file: string | null; skipped: string[] };
}

export class JournalService {
  private cache: Cached | null = null;
  private manifest: { mtime: number; byFile: Map<string, { id: string; treatment: string }> } | null = null;

  constructor(private services: Services, private clock: () => string = () => new Date().toISOString()) {}

  get root(): string {
    return this.services.repoRoot;
  }

  /** Computed on demand; recomputed only when a source file changed (or the date rolled over). */
  state(): Cached {
    const now = this.clock();
    const fp = fingerprint(this.root, now.slice(0, 10));
    if (this.cache && this.cache.fp === fp) return this.cache;
    // wiki/journal/candidates.json is the source when it exists; buildState falls back to the newest proposals file.
    const proposals = existsSync(path.join(this.root, CANDIDATES_REL)) ? { file: CANDIDATES_REL, skipped: [] } : chooseProposals(this.root);
    const state = JSON.parse(JSON.stringify(buildState({ repoRoot: this.root, now }))) as JournalState;
    this.cache = { fp, state, proposals };
    return this.cache;
  }

  decisions(subject?: string): Promise<DecisionRec[]> {
    return this.services.decisions.list('journal', subject ? { subject } : {}) as Promise<DecisionRec[]>;
  }

  async overview(): Promise<{ state: JournalState; decisions: DecisionRec[]; proposals: Cached['proposals']; queue: ReturnType<typeof queueView> }> {
    const { state, proposals } = this.state();
    const slim = slimState(state);
    await Promise.all(slim.entries.map((e) => Promise.all(e.assets.covers.map((c) => this.enrichCover(c)))));
    return { state: slim, decisions: await this.decisions(), proposals, queue: queueView(slim) };
  }

  options(): OperationOptions {
    return operationOptions(this.state().state, this.root);
  }

  measured(opts: { entry?: string; concept?: string }): string {
    return measuredState(this.state().state, opts);
  }

  private manifestIndex(): Map<string, { id: string; treatment: string }> {
    const file = path.join(this.root, 'wiki', 'image-library', 'manifest.json');
    let mtime = 0;
    try {
      mtime = statSync(file).mtimeMs;
    } catch {
      return new Map();
    }
    if (this.manifest && this.manifest.mtime === mtime) return this.manifest.byFile;
    const byFile = new Map<string, { id: string; treatment: string }>();
    try {
      const json = JSON.parse(readFileSync(file, 'utf8')) as { records: { id: string; treatments?: Record<string, { path?: string }> }[] };
      for (const rec of json.records) {
        for (const [treatment, t] of Object.entries(rec.treatments ?? {})) {
          if (t.path?.includes('scenes/journal/')) byFile.set(path.posix.basename(t.path), { id: rec.id, treatment });
        }
      }
    } catch {
      /* an unreadable manifest only means covers fall back to the filename */
    }
    this.manifest = { mtime, byFile };
    return byFile;
  }

  /** img:<record>@<treatment> when the file is registered; preview from the owning resolver when one exists. Filename fallback otherwise. */
  private async enrichCover(c: CoverRow): Promise<void> {
    if (c.file === UNKNOWN) return;
    const hit = this.manifestIndex().get(c.file);
    c.ref = hit ? `img:${hit.id}@${hit.treatment}` : null;
    c.preview = null;
    if (c.ref) {
      let found: AssetSummary | null = null;
      try {
        found = await this.services.assets.resolve(c.ref);
      } catch {
        found = null;
      }
      c.preview = found?.preview ?? null;
    }
  }

  /** Absolute path of a Journal cover image for the media service (filename only; resolved inside the scenes folder). */
  coverPath(file: string): { abs: string; mime: string; dir: string } {
    const m = /^([A-Za-z0-9._-]+)\.(png|jpe?g|webp|svg)$/i.exec(file);
    if (!m) throw new Error('not a cover filename');
    const dir = path.join(this.root, SCENES_REL);
    return { abs: path.join(dir, file), mime: COVER_MIME[(m[2] as string).toLowerCase()] ?? 'application/octet-stream', dir };
  }
}
