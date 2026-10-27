// The module contract every MTW app module implements. Modules are registered statically in modules/index.ts.
// Data lives in wiki/; a module's `manifest` names the canonical wiki paths it reads, writes and watches.
import type { ComponentType } from 'preact';

/** Server-side services the core hands to each module. */
export interface Services {
  /** Absolute repo root (the folder containing wiki/ and apps/). */
  repoRoot: string;
  wiki: WikiStore;
  decisions: DecisionLog;
  events: EventBus;
  terminals: TerminalManager;
  operations: OperationLauncher;
  assets: AssetRegistry;
  leases: LeaseChecker;
  media: MediaService;
}

export interface WikiStore {
  /** Repo-relative path under wiki/ → parsed JSON. */
  readJson<T = unknown>(path: string): Promise<T>;
  /** Atomic write (temp file + rename). Refuses paths outside wiki/ or leased to another session. */
  writeJson(path: string, value: unknown): Promise<void>;
  readText(path: string): Promise<string>;
  writeText(path: string, text: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  /** Run an existing producer (e.g. `node .claude/skills/mtw-soundtrack/scripts/soundtrack.mjs build`); resolves with exit code + output. */
  runProducer(command: string, args: string[]): Promise<{ code: number; stdout: string; stderr: string }>;
}

/** Append-only human decisions: wiki/<lib>/decisions.jsonl. */
export interface Decision {
  id: string;            // generated
  at: string;            // ISO time
  actor: string;         // 'matt' unless stated
  module: string;        // module id
  subject: string;       // asset ref or record id
  action: string;        // e.g. 'approve', 'reject', 'rate', 'edit', 'request-similar'
  value?: unknown;
  note?: string;
}
export interface DecisionLog {
  append(lib: string, decision: Omit<Decision, 'id' | 'at'> & { at?: string }): Promise<Decision>;
  list(lib: string, opts?: { since?: string; subject?: string }): Promise<Decision[]>;
}

/** Server-sent events: `wiki-changed` (module id + paths), `terminal` (list changed), module-specific names. */
export interface EventBus {
  emit(type: string, data: unknown): void;
}

/** Where a run's token numbers came from; OTel is preferred when present, transcripts are the fallback. */
export type TokenSourceId = 'otel' | 'claude-transcript' | 'codex-rollout';
export interface TokenTotals {
  input: number;       // non-cached input
  output: number;
  cacheRead: number;
  cacheWrite: number;
  total: number;
  /** cacheRead / (input + cacheRead + cacheWrite), 0..1 */
  cacheHitRate: number;
  model?: string;
  /** Cost the CLI itself reported over OTel (API-equivalent for subscriptions). */
  costUsd?: number;
  /** ESTIMATE from wiki/operations/pricing.json (placeholder prices until Matt confirms). Never a billed amount. */
  estCostUsd?: number;
  /** ESTIMATE of what cache reads saved versus uncached input at the same price table. */
  cacheSavingsUsd?: number;
  /** True when wiki/operations/pricing.json has no price for `model`: estCostUsd is then absent, never $0. */
  unpriced?: boolean;
  source?: TokenSourceId;
}

/** Runner ids come from wiki/operations/runners.json; 'claude' | 'codex' | 'shell' are proven, others may be added as data rows. */
export type RunnerId = string;
export interface TerminalInfo {
  id: string;
  runner: RunnerId;
  title: string;          // operation title or 'Terminal'
  operation?: string;     // operation id
  module?: string;
  pid: number;
  startedAt: string;
  exitedAt?: string;
  exitCode?: number;
  status: 'running' | 'exited';
  /** Live token totals (see server/core/tokens.ts). Absent for shells and until a transcript/OTel signal arrives. */
  tokens?: TokenTotals;
  /** True when .state/runs/<id>/prompt.md exists; served read-only at /api/terminals/<id>/prompt.md. */
  hasPrompt?: boolean;
  sessionId?: string;
  /** What the run was about (an item id/ref), for attribution: see GET /api/tokens/by?subject=. */
  subject?: string;
  /** Last output or input, for idle closing (see OperationDef.idleMinutes). */
  lastActivityAt?: string;
  /** Close the run after this many quiet minutes (from the operation's frontmatter). */
  idleMinutes?: number;
  /** The model and effort the runner was started with (config/studio.json or the launch's choice); absent = the CLI's default. */
  model?: string;
  effort?: string;
  /** Set when Studio, not the user or the process, ended the run. */
  closedReason?: 'idle';
  /** Set when this terminal reopened an earlier one's saved conversation (see TerminalService.resume). */
  resumedFrom?: string;
  /** Set on a terminal read back from disk after a Studio restart whose process was gone: it crashed or Studio stopped. */
  interrupted?: boolean;
}
export interface TerminalManager {
  list(): TerminalInfo[];
  spawn(opts: { runner: RunnerId; title: string; prompt?: string; operation?: string; module?: string; subject?: string; params?: Record<string, string>; cwd?: string; permission?: string; idleMinutes?: number; model?: string; effort?: string }): TerminalInfo;
  kill(id: string): void;
  /** Type into a running terminal (e.g. a start command for a shell terminal). */
  write(id: string, data: string): void;
  /** Reopen a past terminal's saved conversation in a new terminal; throws a plain message when it cannot. */
  resume?(id: string, change?: { model?: string; effort?: string; permission?: string }): TerminalInfo;
}

/** A standard operation: a markdown prompt in wiki/operations/prompts/<id>.md with frontmatter. */
export interface OperationDef {
  id: string;
  title: string;
  module: string;
  runner: RunnerId;
  skill?: string;
  /** An interactive run that stays quiet this long is closed (its prompt cache has expired; start a new run instead). */
  idleMinutes?: number;
  /** Default model and effort per provider (at most one entry per runner), checked against runners.json; the launch dialog and autonomous runs start from these. */
  models?: { runner: RunnerId; model: string; effort: string }[];
  params: { name: string; label: string; type: 'text' | 'asset' | 'select'; assetType?: string; options?: string[]; required?: boolean }[];
}
export interface OperationLauncher {
  list(module?: string): Promise<OperationDef[]>;
  /** `promptText` is Matt's own edit of the rendered prompt (the launch dialog's editable preview); default: the rendered template. */
  launch(id: string, params: Record<string, string>, runner?: RunnerId, permission?: string, promptText?: string, choice?: { model?: string; effort?: string }): Promise<TerminalInfo>;
}

/** Typed asset references, e.g. `img:<record>@<version>`, `snd:<track>`, `speech:<utterance>`. */
export interface AssetSummary {
  ref: string;
  title: string;
  status?: string;
  preview?: string;        // URL served by the app (thumbnail, audio file)
  canonicalPath: string;   // repo-relative under wiki/
  integrationSrc?: string; // site/public URL when one exists
  meta?: Record<string, unknown>;
}
export interface AssetResolver {
  prefix: string;          // 'img' | 'snd' | 'speech' | ...
  label: string;           // 'Image', 'Sound'
  module: string;          // module whose list view browses it
  list(query: { q?: string; filters?: Record<string, string>; limit?: number; offset?: number }): Promise<{ items: AssetSummary[]; total: number }>;
  resolve(ref: string): Promise<AssetSummary | null>;
}
export interface AssetRegistry {
  register(resolver: AssetResolver): void;
  resolver(prefix: string): AssetResolver | undefined;
  resolve(ref: string): Promise<AssetSummary | null>;
}

export interface LeaseChecker {
  /** Returns the holder when a path is claimed by another session in discussion/handoff/STATUS.md lease rules. */
  holder(path: string): string | null;
}

/**
 * A handler result the core writes as-is instead of JSON. Give exactly one of `stream`, `file` (absolute path,
 * streamed whole) or `body`. The legacy marker `__mtwRaw` is accepted too.
 */
export interface RawResponse {
  __raw: true;
  status?: number;
  headers?: Record<string, string>;
  stream?: NodeJS.ReadableStream | null;
  file?: string;
  body?: string | Uint8Array;
}

/** Range-aware file serving. `serve` never throws: failures come back as 403/404/416 RawResponses. */
export interface MediaService {
  serve(
    absPath: string,
    reqHeaders: Record<string, string | string[] | undefined>,
    opts: {
      /** Absolute directories; the file's real path (symlinks resolved) must be inside one, else 403. */
      allowRoots: string[];
      contentType?: string;
      cacheControl?: string;
    },
  ): Promise<RawResponse>;
}

/** Minimal router the server hands modules. Paths are mounted under /api/<module id>/. */
export interface Router {
  get(path: string, handler: Handler): void;
  post(path: string, handler: Handler): void;
  /**
   * Mount a POST at an exact root path (not under /api/<module>). Only the core's explicit allowlist is accepted
   * (/api/track, /api/collected: the Pixabay collector script). CORS is sent only when `cors` names an origin,
   * and only that origin; the loopback Host check still applies.
   */
  rootPost(path: string, handler: Handler, opts?: { cors?: string }): void;
}
export interface HandlerInput {
  params: Record<string, string>;
  query: URLSearchParams;
  body: unknown;
  /** Request headers (lower-case names), e.g. `range`, `if-none-match`. */
  headers: Record<string, string | string[] | undefined>;
  method: string;
}
export type Handler = (req: HandlerInput) => Promise<unknown> | unknown;

/** Client view props. */
export interface ViewProps {
  /** Path segments after /m/<module>/. */
  path: string[];
  query: URLSearchParams;
  /** Picker mode: the view is shown inside AssetField's dialog; call onPick with a ref. */
  pick?: { assetType: string; onPick: (ref: string) => void };
}

/**
 * A module is three static pieces so the web bundle never imports server code:
 *   modules/<id>/meta.ts    ModuleMeta   (pure data; imported by both sides)
 *   modules/<id>/server.ts  ServerModule (routes, resolvers; imported only by server-registry.ts)
 *   modules/<id>/client.tsx default export: the module's view component (lazy-loaded by client-registry.ts)
 */
export interface ModuleMeta {
  id: string;
  title: string;
  /** Short nav label and order. */
  nav: { label: string; order: number; /** Nav section; order sorts within it. Default 'Studio'. */ group?: 'Studio' | 'System' };
  /** Canonical wiki paths (repo-relative, may be globs) this module owns/watches. Watch only these. */
  manifest: string[];
  /** Asset prefixes this module provides a picker for. */
  assetTypes?: string[];
}
/** One row on the Home dashboard. `href` is the exact (filtered) view that shows the items. */
export interface SummaryItem {
  id: string;
  label: string;
  /** How many items wait; a string for non-counts such as a date or "1.2M". */
  count?: number | string;
  detail?: string;
  href: string;
  /** True when the count means something waits on Matt: shown under "Needs you" while the count is non-zero. */
  attention?: boolean;
  /** The canonical file(s) the number was computed from (Home shows it as the row's source). */
  source?: string;
}
/** One thing awaiting Matt's own decision, with the exact place to make it (Home "Needs you now"). */
export interface NeedItem {
  id: string;
  /** What waits, e.g. "Home: 69 balloons in 23 boxes". */
  title: string;
  /** One-line next step, e.g. "Approve or fix each balloon's words". */
  next: string;
  count?: number;
  /** ISO time the oldest waiting item arrived, when the data records it (sorts oldest first). */
  since?: string;
  /** Deep link to the exact view where the decision is made. */
  href: string;
  /** Button label, e.g. "Review". */
  action: string;
  source: string;
}
/** One library's compact Home row: total, awaiting review, newest addition. */
export interface LibraryRow {
  total: number | null;
  totalLabel: string;
  awaiting: number | null;
  awaitingLabel: string;
  newest?: { label: string; at?: string; href?: string } | null;
  href: string;
  source: string;
}
/** Something running or scheduled (workflow runs, next scheduled runs). */
export interface ActivityRow {
  id: string;
  kind: 'workflow-run' | 'schedule';
  label: string;
  status: string;
  at?: string;
  href: string;
}
export type HealthState = 'pass' | 'warn' | 'fail' | 'info';
export interface HealthRow {
  id: string;
  label: string;
  state: HealthState;
  detail: string;
  href?: string;
  source: string;
}
export interface ModuleSummary {
  items: SummaryItem[];
  /** Items awaiting Matt's decision (Home "Needs you now"). */
  needs?: NeedItem[];
  /** Home "Libraries" row, for library modules. */
  library?: LibraryRow;
  /** Home "Running" rows. */
  activity?: ActivityRow[];
  /** Home "Health" rows. */
  health?: HealthRow[];
}
export interface ServerModule {
  meta: ModuleMeta;
  /** Optional, read-only, cheap: a few rows for the Home dashboard (GET /api/home). Must not write or spawn. */
  summary?: (services: Services) => Promise<ModuleSummary> | ModuleSummary;
  register?: (router: Router, services: Services) => void | Promise<void>;
  /** Optional auto-intake (server/core/intake.ts): registers new media under the module's roots as pending-human items. */
  intake?: (services: Services) => ModuleIntake;
}

/** One media file the intake found under a module's roots (repo-relative, forward slashes). */
export interface IntakeFile {
  path: string;
  bytes: number;
  mtimeMs: number;
}
export interface IntakeOutcome {
  path: string;
  ok: boolean;
  /** Asset ref of the new catalog entry (img:..., snd:...). */
  subject?: string;
  /** What was done, or why it failed. */
  detail?: string;
  /** Not a failure: the file waits (e.g. for its author's own registration) and is re-checked at this time (ms). */
  deferUntil?: number;
}
/**
 * A module's side of auto-intake. Registration must be idempotent (skip files already listed), never set an approved
 * status, and never rename, move or overwrite a media file. The core serializes every register() call.
 */
export interface ModuleIntake {
  /** Library name for the decision log (wiki/<lib>/decisions.jsonl). */
  lib: string;
  /** Roots used when wiki/operations/intake.json names none for this module. */
  defaultRoots: string[];
  /** File types this module catalogs. */
  accepts(rel: string): boolean;
  /** The subset of `rels` its catalog does not list. */
  unregistered(rels: string[]): Promise<string[]>;
  /** `scope`: the since floor and stability window, for modules that must batch other eligible files together. */
  register(files: IntakeFile[], scope?: { sinceMs: number; stableMs: number; graceMs?: number; force?: boolean }): Promise<IntakeOutcome[]>;
  /** Items intake registered that still wait on Matt, for Home "Needs you". */
  pending(): Promise<{ count: number; label: string; href: string }>;
}
export interface ClientModule {
  meta: ModuleMeta;
  load: () => Promise<{ default: ComponentType<ViewProps> }>;
}
