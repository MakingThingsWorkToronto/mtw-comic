// Pure logic for the box art fix flow: run parameters, tracking keys, newer-art detection, cache busting.
import type { Rect } from './flow';
import type { CanonicalArtSource, PanelArtLayer } from './types';

export const FIX_OPERATION = 'comics-fix-box-art';

export interface FixPreset {
  id: string;
  label: string;
  instruction: string;
  scope: 'art' | 'speech' | 'sound' | 'motion' | 'appearance' | 'voice';
}
/** Share concurrent opens, then read the current canonical presets again on the next open. */
export function createPresetLoader(fetchPresets: () => Promise<FixPreset[]>): () => Promise<FixPreset[]> {
  let pending: Promise<FixPreset[]> | null = null;
  return () => {
    if (!pending) pending = fetchPresets().finally(() => { pending = null; });
    return pending;
  };
}
export interface FixPanel {
  index: number;
  /** The panel's img id from the story; may be empty. */
  img: string;
  /** The box's region of the page master (`ar`), fractions [x, y, w, h]. */
  rect: Rect | null;
  src?: string | null;
  layers?: PanelArtLayer[];
  canonicalSource?: CanonicalArtSource | null;
}

/** How the run and the views name a box: its img id, else its index. */
export const panelRef = (p: { index: number; img: string }): string => p.img || String(p.index);

const num = (n: number): string => String(Math.round(n * 10000) / 10000);
const region = (r: Rect | null): string => (r ? `[${r.map(num).join(', ')}]` : 'none');
const oneLine = (s: string): string => s.replace(/\s+/g, ' ').trim();

/** The run's tracking key; GET /api/tokens/by?subject= and the "Fixing…" badge both use it. */
export const fixSubject = (issue: string, scene: string, refs: string[]): string => `fix:${issue}/${scene}/${refs.join('+')}`;

export function parseFixSubject(subject: string | undefined): { issue: string; scene: string; refs: string[] } | null {
  const m = /^fix:([^/]+)\/([^/]+)\/(.+)$/.exec(subject ?? '');
  return m ? { issue: m[1] as string, scene: m[2] as string, refs: (m[3] as string).split('+') } : null;
}

export interface FixRequest {
  issue: string;
  sceneId: string;
  /** The scene's art base from the story, `/comic/<issue>/<name>`. */
  art: string | null;
  panels: FixPanel[];
  fixes: string[];
  note: string;
}

/** Parameters for wiki/operations/prompts/comics-fix-box-art.md; the launcher appends them under "This run". */
export function assembleFixParams(r: FixRequest): Record<string, string> {
  const refs = r.panels.map(panelRef);
  const art = [r.art ?? 'none', ...r.panels.map((p) => `${panelRef(p)} ar=${region(p.rect)}`)].join(' | ');
  return {
    subject: fixSubject(r.issue, r.sceneId, refs),
    issue: r.issue,
    scene: r.sceneId,
    panel: refs.join(', '),
    art,
    fixes: r.fixes.join(', '),
    note: oneLine(r.note),
  };
}

export const canLaunch = (r: Pick<FixRequest, 'panels' | 'fixes' | 'note'>): boolean => r.panels.length > 0 && (r.fixes.length > 0 || oneLine(r.note).length > 0);

// ------------------------------------------------------------------------------------------------ newer art

export interface ArtFile {
  path: string;
  mtime: number;
  version: number | null;
  kind: 'site' | 'canonical';
}
export interface SceneStatus {
  id: string;
  art: string | null;
  files: ArtFile[];
}
export interface ArtStatus {
  story: { path: string; mtime: number } | null;
  scenes: SceneStatus[];
}

/** What the view showed when it first looked (or when the last change was kept). */
export interface Baseline {
  art: string | null;
  version: number;
  mtimes: Record<string, number>;
}
export interface ArtChange {
  kind: 'newer-version' | 'changed' | 'appeared' | 'repointed';
  /** Display name of the new file. */
  file: string;
  /** Repo path to show as the new art (a site webp when there is one, else the canonical master). */
  showPath: string | null;
  version: number | null;
}

const stemVersion = (art: string | null): number => {
  const m = /-v(\d+)$/.exec(art ?? '');
  return m ? Number(m[1]) : 0;
};

export function baselineOf(scene: SceneStatus): Baseline {
  return {
    art: scene.art,
    version: Math.max(stemVersion(scene.art), ...scene.files.map((f) => f.version ?? 0)),
    mtimes: Object.fromEntries(scene.files.map((f) => [f.path, f.mtime])),
  };
}

const base = (p: string): string => p.slice(p.lastIndexOf('/') + 1);
const width = (p: string): number => Number(/-(\d+)\.\w+$/.exec(p)?.[1] ?? 0);
/** Prefer the site's widest webp (the 1600 slot the reader shows; copies never exceed the master), then whatever exists. */
function best(files: ArtFile[]): ArtFile | null {
  const site = files.filter((f) => f.kind === 'site' && f.path.endsWith('.webp')).sort((a, b) => width(b.path) - width(a.path));
  const wide = site[0];
  return wide ?? files.find((f) => f.kind === 'canonical') ?? files[0] ?? null;
}

/** Compare a scene's current art files with the baseline: a newer -vN, a repointed `art`, an appeared file or a changed file. */
export function detectNewArt(b: Baseline, now: SceneStatus): ArtChange | null {
  const newer = now.files.filter((f) => (f.version ?? 0) > b.version);
  if (newer.length) {
    const top = Math.max(...newer.map((f) => f.version ?? 0));
    const same = newer.filter((f) => f.version === top);
    const pick = best(same);
    return { kind: 'newer-version', file: base(same.find((f) => f.kind === 'canonical')?.path ?? pick?.path ?? ''), showPath: pick?.path ?? null, version: top };
  }
  if (now.art !== b.art && now.art) return { kind: 'repointed', file: base(now.art), showPath: best(now.files)?.path ?? null, version: stemVersion(now.art) || null };
  const fresh = now.files.filter((f) => !(f.path in b.mtimes) || f.mtime > (b.mtimes[f.path] as number));
  if (fresh.length) {
    const pick = best(fresh);
    return { kind: fresh.some((f) => f.path in b.mtimes) ? 'changed' : 'appeared', file: base(pick?.path ?? ''), showPath: pick?.path ?? null, version: pick?.version ?? null };
  }
  return null;
}

/** Cache-busting: add or replace `v=` so a rewritten file at the same path is fetched again. */
export function bustUrl(src: string, token: string | number): string {
  const clean = src.replace(/([?&])v=[^&]*&?/, '$1').replace(/[?&]$/, '');
  return `${clean}${clean.includes('?') ? '&' : '?'}v=${encodeURIComponent(String(token))}`;
}

/** The newest site file's mtime for a scene: the token that busts its crop whenever the site copy is rewritten. */
export const bustToken = (scene: SceneStatus | undefined): string => String(Math.max(0, ...(scene?.files.filter((f) => f.kind === 'site').map((f) => f.mtime) ?? [])));

export const mediaSrc = (repoPath: string): string => `/api/comics/media?path=${encodeURIComponent(repoPath)}`;

// ------------------------------------------------------------------------------------------------ pending runs

export interface RunLike {
  id: string;
  operation?: string;
  subject?: string;
  status: string;
  startedAt?: string;
}
/** Running fix runs for one issue, keyed by `<scene>/<box>`; the newest run wins when several touch a box. */
export function fixingBoxes(runs: RunLike[], issue: string): Map<string, RunLike> {
  const out = new Map<string, RunLike>();
  const mine = runs.filter((r) => r.operation === FIX_OPERATION && r.status === 'running').sort((a, b) => (a.startedAt ?? '').localeCompare(b.startedAt ?? ''));
  for (const r of mine) {
    const s = parseFixSubject(r.subject);
    if (s && s.issue === issue) for (const ref of s.refs) out.set(`${s.scene}/${ref}`, r);
  }
  return out;
}

/** Total tokens from GET /api/tokens/by: the runs' own totals, else the summary's. */
export function subjectTokens(json: unknown): number | null {
  if (!json || typeof json !== 'object') return null;
  const o = json as { runs?: unknown; summary?: { all?: { total?: unknown } } };
  if (Array.isArray(o.runs)) {
    const total = o.runs.reduce<number>((n, r) => n + ((r as { tokens?: { total?: number } }).tokens?.total ?? 0), 0);
    if (total > 0 || o.runs.length) return total;
  }
  const t = o.summary?.all?.total;
  return typeof t === 'number' ? t : null;
}
