// Studio auto-intake (Matt, 2026-10-10: "ensure the guardrails exist to force save and update in canonical locations ...
// this is not optional for future agents as the human needs to approve").
//
// Change events -> catalog: each module with an `intake` declares the media it catalogs; wiki/operations/intake.json (data)
// names the roots, the stability window and a `since` floor. A new or changed media file under a root that the catalog
// does not list is registered once its size and mtime have been stable for `stableMs`, as a pending-human item (never
// approved), and logged as `auto-registered` by actor `studio-intake`. A reconciliation sweep at startup (and on
// POST /api/intake/reconcile, which agents may call) catches what appeared while Studio was down. Every
// module register() call runs through one queue, so producers never run concurrently from here; failures are kept and
// shown on Home until a later pass succeeds. Nothing here renames, moves, overwrites or deletes media.
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, promises as fs, watch } from 'node:fs';
import type { FSWatcher } from 'node:fs';
import path from 'node:path';
import type { DecisionLog, EventBus, IntakeFile, IntakeOutcome, ModuleIntake, SummaryItem } from '../../modules/types';
import { CANONICAL_PREFIXES, diskReader, hasLibraryMaster, isExemptMedia } from '../../../../scripts/assets/media-registration.mjs';

/** When a file arrived here: its mtime, or its creation time when later (Windows copies keep the source's mtime). */
const arrivedMs = (st: { mtimeMs: number; birthtimeMs?: number }): number => Math.max(st.mtimeMs, st.birthtimeMs ?? 0);

export const INTAKE_CONFIG = 'wiki/operations/intake.json';
export const INTAKE_ACTOR = 'studio-intake';
export const MISSES_FILE = 'intake-misses.jsonl';

export interface IntakeConfig {
  enabled: boolean;
  since: string | null;
  stableMs: number;
  /** How long a file that needs a record decision waits for its author's own registration (images). */
  decisionGraceMs: number;
  modules: Record<string, { roots: string[] }>;
}

export interface IntakeFailure {
  module: string;
  path: string;
  /** The newest reason. */
  error: string;
  /** The newest attempt. */
  at: string;
  /** The first failed attempt (kept across retries). */
  firstAt?: string;
}
/** A file the producer refused because another session holds a lease on the catalog: deferred, not failed. */
export interface IntakeHeld {
  module: string;
  path: string;
  holder: string;
  detail: string;
  at: string;
}
/** One unresolved agent-stop miss per path (newest miss wins), with when it was recorded. */
export interface OpenMissFile {
  path: string;
  at: string;
  sessionId?: string;
  runtime?: string;
  /** 'unregistered' (canonical home, no catalog entry), 'outside' (in the repo, outside every home), 'transport' (provider cache outside the repo). */
  kind: 'unregistered' | 'outside' | 'transport';
}
/** What Home shows for auto-intake (the dashboard reads this; summaryItems() renders the same facts as rows). */
export interface IntakeFacts {
  enabled: boolean;
  pending: { module: string; label: string; count: number; href: string }[];
  /** Failures whose newest attempt is within the window, one per path, newest first. */
  failures: IntakeFailure[];
  /** Failures older than the window (kept until a later pass succeeds, not shown as current). */
  olderFailures: number;
  held: IntakeHeld[];
  misses: OpenMissFile[];
  windowHours: number;
}

/** "wiki/image-library/manifest.json is leased to <holder>; no changes made" -> holder. */
export function leaseHolderOf(detail: string | undefined): string | null {
  const m = /\bis leased to ([^;\s]+)/.exec(detail ?? '');
  return m ? (m[1] as string) : null;
}

/** Pure: failures whose newest attempt is within `hours` of `now`, newest first, plus how many are older. */
export function recentFailures(all: IntakeFailure[], now: Date, hours = 24): { recent: IntakeFailure[]; older: number } {
  const floor = now.getTime() - hours * 3_600_000;
  const recent = all.filter((f) => Date.parse(f.at) >= floor).sort((a, b) => b.at.localeCompare(a.at));
  return { recent, older: all.length - recent.length };
}

/** Pure: one row per path across all misses (the newest miss wins), filtered by `isOpen`, oldest first. */
export function flattenMisses(misses: IntakeMiss[], isOpen: (path: string, kind: OpenMissFile['kind']) => boolean, repoRoot: string): OpenMissFile[] {
  const byPath = new Map<string, OpenMissFile>();
  const root = posix(repoRoot).replace(/\/$/, '').toLowerCase();
  for (const m of misses) {
    const add = (p: string, kind: OpenMissFile['kind']): void => {
      const prev = byPath.get(p);
      if (prev && prev.at >= m.at) return;
      byPath.set(p, { path: p, at: m.at, kind, ...(m.sessionId ? { sessionId: m.sessionId } : {}), ...(m.runtime ? { runtime: m.runtime } : {}) });
    };
    for (const f of m.files ?? []) add(posix(f), 'unregistered');
    for (const raw of m.outside ?? []) {
      const p = posix(raw);
      const abs = /^[a-z]:\//i.test(p) || p.startsWith('/');
      if (abs && p.toLowerCase().startsWith(`${root}/`)) add(p.slice(root.length + 1), 'outside');
      else add(p, abs ? 'transport' : 'outside');
    }
  }
  return [...byPath.values()].filter((f) => isOpen(f.path, f.kind)).sort((a, b) => a.at.localeCompare(b.at));
}

/** Catalogs whose text names every registered file's sha256 (the catalogs checked by sha). */
const SHA_CATALOGS = ['wiki/image-library/manifest.json', 'wiki/soundtrack-library/manifest.json', 'wiki/soundtrack-library/comic-audio.json', 'wiki/comics-library/speech.json'];
export interface IntakeRegistration {
  module: string;
  path: string;
  subject?: string;
  detail?: string;
  at: string;
}
export interface IntakeMiss {
  at: string;
  sessionId?: string;
  runtime?: string;
  files: string[];
  outside?: string[];
}
export interface IntakeStatus {
  enabled: boolean;
  running: boolean;
  since: string | null;
  stableMs: number;
  roots: Record<string, string[]>;
  waiting: string[];
  deferred: { path: string; module: string; until: string; detail: string }[];
  busy: boolean;
  failures: IntakeFailure[];
  held: IntakeHeld[];
  recent: IntakeRegistration[];
  misses: IntakeMiss[];
  lastReconcile: { at: string; reason: string; found: number; registered: number; failed: number } | null;
}
export interface ReconcileResult {
  found: number;
  registered: number;
  failed: number;
  outcomes: (IntakeOutcome & { module: string })[];
}

export interface IntakeOptions {
  repoRoot: string;
  stateDir: string;
  decisions: DecisionLog;
  events: EventBus;
  modules: { id: string; intake: ModuleIntake }[];
  /** Overrides wiki/operations/intake.json (tests). */
  config?: Partial<IntakeConfig>;
  /** How often a waiting file is re-measured; defaults to stableMs. */
  pollMs?: number;
  now?: () => Date;
  /** Attach fs.watch on the roots (off in tests that drive notice() directly). */
  watch?: boolean;
}

const posix = (p: string): string => p.replace(/\\/g, '/');

export async function loadIntakeConfig(repoRoot: string): Promise<IntakeConfig> {
  const fallback: IntakeConfig = { enabled: false, since: null, stableMs: 2000, decisionGraceMs: 900_000, modules: {} };
  try {
    const raw = JSON.parse(await fs.readFile(path.join(repoRoot, ...INTAKE_CONFIG.split('/')), 'utf8')) as Partial<IntakeConfig>;
    return {
      enabled: raw.enabled === true,
      since: typeof raw.since === 'string' ? raw.since : null,
      stableMs: Number.isFinite(raw.stableMs) ? Number(raw.stableMs) : 2000,
      decisionGraceMs: Number.isFinite(raw.decisionGraceMs) ? Number(raw.decisionGraceMs) : 900_000,
      modules: raw.modules && typeof raw.modules === 'object' ? raw.modules : {},
    };
  } catch {
    return fallback;
  }
}

async function* walk(abs: string): AsyncGenerator<string> {
  let entries;
  try {
    entries = await fs.readdir(abs, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const child = path.join(abs, e.name);
    if (e.isDirectory()) yield* walk(child);
    else if (e.isFile()) yield child;
  }
}

export class IntakeService {
  private config: IntakeConfig = { enabled: false, since: null, stableMs: 2000, decisionGraceMs: 900_000, modules: {} };
  /** path -> files waiting on purpose (deferUntil), re-checked when their time comes. */
  private deferred = new Map<string, { module: string; until: number; detail: string; timer: NodeJS.Timeout | null }>();
  private watchers: FSWatcher[] = [];
  /** path -> last measurement while waiting for the file to settle. */
  private waiting = new Map<string, { module: string; bytes: number; mtimeMs: number; seenAt: number; timer: NodeJS.Timeout | null }>();
  private queue: Promise<unknown> = Promise.resolve();
  private busyCount = 0;
  private failures = new Map<string, IntakeFailure>();
  /** path -> refused because another session leases the catalog; retried by the next pass, never shown as a failure. */
  private held = new Map<string, IntakeHeld>();
  private shaText: { sig: string; text: string } | null = null;
  private factsMemo: { at: number; windowHours: number; promise: Promise<IntakeFacts>; value?: IntakeFacts } | null = null;
  private factsRefresh: Promise<void> | null = null;
  private recent: IntakeRegistration[] = [];
  private lastReconcile: IntakeStatus['lastReconcile'] = null;
  private started = false;
  private stopped = false;

  constructor(private opts: IntakeOptions) {}

  private now(): Date {
    return this.opts.now ? this.opts.now() : new Date();
  }

  private get stateFile(): string {
    return path.join(this.opts.stateDir, 'intake', 'state.json');
  }

  rootsOf(id: string): string[] {
    const mod = this.opts.modules.find((m) => m.id === id);
    const configured = this.config.modules[id]?.roots;
    return (configured?.length ? configured : (mod?.intake.defaultRoots ?? [])).map((r) => posix(r).replace(/\/?$/, '/'));
  }

  /** The module whose roots hold `rel` and that catalogs its file type. */
  moduleFor(rel: string): { id: string; intake: ModuleIntake } | null {
    const p = posix(rel);
    for (const m of this.opts.modules) if (this.rootsOf(m.id).some((r) => p.startsWith(r)) && m.intake.accepts(p)) return m;
    return null;
  }

  async start(): Promise<void> {
    this.config = { ...(await loadIntakeConfig(this.opts.repoRoot)), ...(this.opts.config ?? {}) };
    await this.loadState();
    this.started = true;
    if (!this.config.enabled) return;
    if (this.opts.watch !== false) this.attach();
    // Startup reconciliation: what appeared while Studio was down. Errors are kept as failures, never thrown.
    void this.reconcile('startup').catch(() => undefined);
  }

  private attach(): void {
    for (const m of this.opts.modules) {
      for (const root of this.rootsOf(m.id)) {
        const abs = path.join(this.opts.repoRoot, root);
        if (!existsSync(abs)) continue;
        try {
          const w = watch(abs, { recursive: true }, (_event, filename) => {
            if (!filename) return;
            this.notice(posix(path.posix.join(root, posix(String(filename)))));
          });
          w.on('error', () => undefined);
          this.watchers.push(w);
        } catch {
          /* an unwatchable root is still covered by reconciliation */
        }
      }
    }
  }

  /** A change event for one path: measure it now and again after stableMs; register when unchanged. */
  notice(rel: string): void {
    if (!this.config.enabled || this.stopped) return;
    const p = posix(rel);
    const mod = this.moduleFor(p);
    if (!mod || path.posix.basename(p).startsWith('.')) return;
    const prev = this.waiting.get(p);
    if (prev?.timer) clearTimeout(prev.timer);
    this.waiting.set(p, { module: mod.id, bytes: prev?.bytes ?? -1, mtimeMs: prev?.mtimeMs ?? -1, seenAt: prev?.seenAt ?? 0, timer: null });
    void this.measure(p);
  }

  private async measure(p: string): Promise<void> {
    const w = this.waiting.get(p);
    if (!w || this.stopped) return;
    let st;
    try {
      st = await fs.stat(path.join(this.opts.repoRoot, p));
    } catch {
      this.waiting.delete(p); // gone (renamed temp file, deleted): nothing to register
      return;
    }
    const t = Date.now();
    const unchanged = st.size === w.bytes && st.mtimeMs === w.mtimeMs;
    // Stable = the same size and mtime observed for at least stableMs (not merely two quick equal reads).
    if (unchanged && st.size > 0 && t - w.seenAt >= this.config.stableMs) {
      if (w.timer) clearTimeout(w.timer);
      this.waiting.delete(p);
      void this.process(w.module, [{ path: p, bytes: st.size, mtimeMs: st.mtimeMs }], 'change').catch(() => undefined);
      return;
    }
    if (!unchanged) {
      w.bytes = st.size;
      w.mtimeMs = st.mtimeMs;
      w.seenAt = t;
    }
    if (w.timer) clearTimeout(w.timer);
    w.timer = setTimeout(() => void this.measure(p), this.opts.pollMs ?? this.config.stableMs);
    w.timer.unref?.();
  }

  private clear(p: string): void {
    this.failures.delete(p);
    this.held.delete(p);
  }

  /** Record a failure, keeping the first attempt's time across retries. */
  private fail(f: IntakeFailure): void {
    const prev = this.failures.get(f.path);
    this.failures.set(f.path, { ...f, firstAt: prev?.firstAt ?? prev?.at ?? f.at });
  }

  /** Run `fn` after every earlier queued intake step, whether or not that step failed. */
  private serialize<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.queue.then(fn, fn);
    this.queue = run.catch(() => undefined);
    return run;
  }

  private sinceMs(): number {
    const t = this.config.since ? Date.parse(this.config.since) : NaN;
    return Number.isFinite(t) ? t : 0;
  }

  /** Register `files` for one module (serialized; re-checks the catalog inside the queue, so a repeat is a no-op). */
  process(moduleId: string, files: IntakeFile[], reason: string, force = false): Promise<(IntakeOutcome & { module: string })[]> {
    return this.serialize(async () => {
      const mod = this.opts.modules.find((m) => m.id === moduleId);
      if (!mod || !files.length) return [];
      this.busyCount++;
      try {
        const floor = this.sinceMs();
        const present: IntakeFile[] = [];
        for (const f of files) {
          try {
            const st = await fs.stat(path.join(this.opts.repoRoot, f.path));
            if (arrivedMs(st) >= floor) present.push({ path: f.path, bytes: st.size, mtimeMs: st.mtimeMs });
          } catch {
            this.clear(f.path);
          }
        }
        if (!present.length) return [];
        let todo: IntakeFile[] = present;
        let outcomes: IntakeOutcome[];
        try {
          const unregistered = new Set(await mod.intake.unregistered(present.map((f) => f.path)));
          for (const f of present) if (!unregistered.has(f.path)) this.clear(f.path);
          todo = present.filter((f) => unregistered.has(f.path));
          if (!todo.length) return [];
          outcomes = await mod.intake.register(todo, { sinceMs: floor, stableMs: this.config.stableMs, graceMs: this.config.decisionGraceMs, force });
        } catch (error) {
          outcomes = todo.map((f) => ({ path: f.path, ok: false, detail: (error as Error).message }));
        }
        // A file the module did not answer for is a failure, never silently dropped.
        const silent = todo.filter((f) => !outcomes.some((o) => o.path === f.path));
        if (silent.length) {
          // Registered meanwhile by someone else is fine; still unregistered with no answer is a failure.
          const still = new Set(await mod.intake.unregistered(silent.map((f) => f.path)).catch(() => silent.map((f) => f.path)));
          for (const f of silent) {
            if (still.has(f.path)) outcomes.push({ path: f.path, ok: false, detail: 'the module returned no outcome for this file' });
            else this.clear(f.path);
          }
        }
        const at = this.now().toISOString();
        for (const o of outcomes) {
          const was = this.deferred.get(o.path);
          if (was?.timer) clearTimeout(was.timer);
          this.deferred.delete(o.path);
          if (!o.ok && o.deferUntil) {
            this.clear(o.path);
            const timer = setTimeout(() => this.notice(o.path), Math.max(0, o.deferUntil - Date.now()) + 1000);
            timer.unref?.();
            this.deferred.set(o.path, { module: moduleId, until: o.deferUntil, detail: o.detail ?? 'waiting', timer });
            continue;
          }
          if (o.ok) {
            this.clear(o.path);
            this.recent = [{ module: moduleId, path: o.path, ...(o.subject ? { subject: o.subject } : {}), ...(o.detail ? { detail: o.detail } : {}), at }, ...this.recent].slice(0, 50);
            await this.opts.decisions
              .append(mod.intake.lib, { actor: INTAKE_ACTOR, module: moduleId, subject: o.subject ?? o.path, action: 'auto-registered', value: { path: o.path, reason }, note: 'Registered as a pending-human item; not an approval.' })
              .catch((error: Error) => {
                this.fail({ module: moduleId, path: o.path, error: `registered, but the decision log failed: ${error.message}`, at });
              });
          } else {
            const holder = leaseHolderOf(o.detail);
            if (holder) {
              // Another session holds the catalog: deferred until a later pass (startup, reconcile, the next change).
              this.failures.delete(o.path);
              this.held.set(o.path, { module: moduleId, path: o.path, holder, detail: o.detail ?? '', at });
            } else {
              this.held.delete(o.path);
              this.fail({ module: moduleId, path: o.path, error: o.detail ?? 'registration failed', at });
            }
          }
        }
        await this.saveState();
        const registered = outcomes.filter((o) => o.ok).map((o) => o.path);
        this.opts.events.emit('intake', { module: moduleId, registered, failed: outcomes.filter((o) => !o.ok).map((o) => ({ path: o.path, error: o.detail })) });
        // Home and the module's list views refetch on wiki-changed.
        this.opts.events.emit('wiki-changed', { module: moduleId, paths: registered });
        if (outcomes.some((o) => !o.ok && !o.deferUntil && !leaseHolderOf(o.detail))) this.opts.events.emit('wiki-changed', { module: 'intake', paths: [] });
        return outcomes.map((o) => ({ ...o, module: moduleId }));
      } finally {
        this.busyCount--;
      }
    });
  }

  /**
   * Walk every root and register what the catalogs do not list (files newer than `since`). `paths` narrows the walk
   * to those files (an agent names its own files). Settling files are handed to the stability check.
   */
  async reconcile(reason: string, paths?: string[]): Promise<ReconcileResult> {
    if (!this.config.enabled) return { found: 0, registered: 0, failed: 0, outcomes: [] };
    const floor = this.sinceMs();
    const settleBefore = this.now().getTime() - this.config.stableMs;
    const byModule = new Map<string, IntakeFile[]>();
    const consider = async (rel: string): Promise<void> => {
      const mod = this.moduleFor(rel);
      if (!mod || path.posix.basename(rel).startsWith('.')) return;
      let st;
      try {
        st = await fs.stat(path.join(this.opts.repoRoot, rel));
      } catch {
        return;
      }
      if (!st.isFile() || arrivedMs(st) < floor) return;
      if (st.mtimeMs > settleBefore) return void this.notice(rel);
      byModule.set(mod.id, [...(byModule.get(mod.id) ?? []), { path: rel, bytes: st.size, mtimeMs: st.mtimeMs }]);
    };
    if (paths?.length) {
      for (const p of paths) await consider(posix(p).replace(/^\.\//, ''));
    } else {
      for (const m of this.opts.modules) {
        for (const root of this.rootsOf(m.id)) {
          for await (const abs of walk(path.join(this.opts.repoRoot, root))) await consider(posix(path.relative(this.opts.repoRoot, abs)));
        }
      }
    }
    const outcomes: ReconcileResult['outcomes'] = [];
    let found = 0;
    for (const [id, files] of byModule) {
      found += files.length;
      // Named paths come from an agent finishing its own work, so no grace for its own registration.
      outcomes.push(...(await this.process(id, files, reason, Boolean(paths?.length))));
    }
    const result = { found, registered: outcomes.filter((o) => o.ok).length, failed: outcomes.filter((o) => !o.ok && !o.deferUntil).length, outcomes };
    this.lastReconcile = { at: this.now().toISOString(), reason, found: result.found, registered: result.registered, failed: result.failed };
    return result;
  }

  async misses(): Promise<IntakeMiss[]> {
    let text = '';
    try {
      text = await fs.readFile(path.join(this.opts.stateDir, MISSES_FILE), 'utf8');
    } catch {
      return [];
    }
    const out: IntakeMiss[] = [];
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      try {
        out.push(JSON.parse(line) as IntakeMiss);
      } catch {
        /* a torn line is skipped */
      }
    }
    return out;
  }

  /** Misses with at least one file still open (see openMissFiles): these wait on someone. */
  async openMisses(): Promise<IntakeMiss[]> {
    const open = new Set((await this.openMissFiles()).map((f) => f.path));
    if (!open.size) return [];
    const root = posix(this.opts.repoRoot).replace(/\/$/, '').toLowerCase();
    const rel = (p: string): string => {
      const q = posix(p);
      return q.toLowerCase().startsWith(`${root}/`) ? q.slice(root.length + 1) : q;
    };
    return (await this.misses()).filter((m) => [...(m.files ?? []).map(posix), ...(m.outside ?? []).map(rel)].some((p) => open.has(p)));
  }

  /**
   * One row per still-open path, oldest first. Same rules as the pre-commit media check (scripts/assets/media-registration.mjs
   * classify): a canonical file is open while its catalog lacks it; a repo file outside the homes is open while it
   * exists, is untracked (a tracked one was judged by pre-commit), is not exempt, and (under site/) is neither a
   * resized derivative of a library master nor a same-bytes copy; a provider-cache file outside the repo (transport)
   * is open while it exists and no catalog names its sha256.
   */
  async openMissFiles(): Promise<OpenMissFile[]> {
    const misses = await this.misses();
    if (!misses.length) return [];
    const repo = this.opts.repoRoot;
    const candidates = flattenMisses(misses, () => true, repo);
    const tracked = await this.trackedOf(candidates.filter((f) => f.kind === 'outside' && existsSync(path.join(repo, f.path))).map((f) => f.path));
    const read = diskReader(repo);
    const open = new Set<string>();
    for (const f of candidates) {
      if (f.kind === 'unregistered') {
        const mod = this.moduleFor(f.path);
        if (!mod || !existsSync(path.join(repo, f.path))) continue;
        if ((await mod.intake.unregistered([f.path]).catch(() => [f.path])).length) open.add(f.path);
      } else if (f.kind === 'transport') {
        if (existsSync(f.path) && !(await this.bytesKnown(f.path))) open.add(f.path);
      } else {
        if (!existsSync(path.join(repo, f.path)) || tracked.has(f.path)) continue;
        if (CANONICAL_PREFIXES.some((h) => f.path.startsWith(h)) || isExemptMedia(f.path, repo)) continue;
        if (f.path.startsWith('site/') && (hasLibraryMaster(f.path, read) || (await this.bytesKnown(path.join(repo, f.path))))) continue;
        open.add(f.path);
      }
    }
    return flattenMisses(misses, (p) => open.has(p), repo);
  }

  /** The subset of `paths` that git tracks (one `git ls-files` call). */
  private trackedOf(paths: string[]): Promise<Set<string>> {
    if (!paths.length) return Promise.resolve(new Set());
    return new Promise((resolve) => {
      execFile('git', ['ls-files', '-z', '--', ...paths], { cwd: this.opts.repoRoot, maxBuffer: 1 << 24, windowsHide: true }, (error, stdout) => {
        resolve(error ? new Set() : new Set(String(stdout).split('\0').filter(Boolean)));
      });
    });
  }

  /** True when a catalog names this file's sha256 (catalog text cached by size and mtime). */
  private async bytesKnown(abs: string): Promise<boolean> {
    let sha: string;
    try {
      sha = createHash('sha256').update(await fs.readFile(abs)).digest('hex');
    } catch {
      return false;
    }
    const sig = (await Promise.all(SHA_CATALOGS.map((r) => fs.stat(path.join(this.opts.repoRoot, r)).then((st) => `${st.size}:${st.mtimeMs}`, () => '-')))).join('|');
    if (this.shaText?.sig !== sig) {
      const texts = await Promise.all(SHA_CATALOGS.map((r) => fs.readFile(path.join(this.opts.repoRoot, r), 'utf8').catch(() => '')));
      this.shaText = { sig, text: texts.join('\n') };
    }
    return this.shaText.text.includes(sha);
  }

  /**
   * Home's view of auto-intake: pending per module, failures in the window, lease-held files and open misses.
   * Memoized for `maxAgeMs` (the miss check hashes files and runs git); any intake pass clears the memo.
   */
  facts(windowHours = 24, maxAgeMs = 15_000): Promise<IntakeFacts> {
    const m = this.factsMemo && this.factsMemo.windowHours === windowHours ? this.factsMemo : null;
    if (m && Date.now() - m.at < maxAgeMs) return m.promise;
    // Stale-while-revalidate: an older settled value answers at once while one refresh runs (maxAgeMs 0 always waits).
    if (m?.value && maxAgeMs > 0) {
      this.factsRefresh ??= this.computeFacts(windowHours)
        .then((value) => {
          this.factsMemo = { at: Date.now(), windowHours, promise: Promise.resolve(value), value };
        }, () => undefined)
        .finally(() => {
          this.factsRefresh = null;
        });
      return Promise.resolve(m.value);
    }
    const promise = this.computeFacts(windowHours);
    const entry: NonNullable<typeof this.factsMemo> = { at: Date.now(), windowHours, promise };
    this.factsMemo = entry;
    promise.then(
      (value) => {
        entry.value = value;
      },
      () => {
        if (this.factsMemo === entry) this.factsMemo = null;
      },
    );
    return promise;
  }

  private async computeFacts(windowHours: number): Promise<IntakeFacts> {
    const pending: IntakeFacts['pending'] = [];
    for (const m of this.opts.modules) {
      try {
        const p = await m.intake.pending();
        pending.push({ module: m.id, label: p.label, count: p.count, href: p.href });
      } catch {
        /* optional here; the module's own view still shows it */
      }
    }
    const { recent, older } = recentFailures([...this.failures.values()], this.now(), windowHours);
    return { enabled: this.config.enabled, pending, failures: recent, olderFailures: older, held: [...this.held.values()], misses: await this.openMissFiles(), windowHours };
  }

  async status(): Promise<IntakeStatus> {
    return {
      enabled: this.config.enabled,
      running: this.started && !this.stopped,
      since: this.config.since,
      stableMs: this.config.stableMs,
      roots: Object.fromEntries(this.opts.modules.map((m) => [m.id, this.rootsOf(m.id)])),
      waiting: [...this.waiting.keys()],
      deferred: [...this.deferred].map(([p, d]) => ({ path: p, module: d.module, until: new Date(d.until).toISOString(), detail: d.detail })),
      busy: this.busyCount > 0,
      failures: [...this.failures.values()],
      held: [...this.held.values()],
      recent: this.recent,
      misses: await this.openMisses(),
      lastReconcile: this.lastReconcile,
    };
  }

  /** Home rows (the pre-dashboard shape, still served): pending items, failures in the last 24h, lease-held files, open misses. */
  async summaryItems(maxAgeMs = 15_000): Promise<SummaryItem[]> {
    const f = await this.facts(24, maxAgeMs);
    const items: SummaryItem[] = [];
    for (const m of this.opts.modules) {
      const p = f.pending.find((x) => x.module === m.id);
      if (p) items.push({ id: `${m.id}-pending`, label: p.label, count: p.count, href: p.href, attention: p.count > 0 });
      else items.push({ id: `${m.id}-pending`, label: `${m.id} intake`, count: 1, detail: 'Pending count unavailable', href: `/m/${m.id}`, attention: true });
    }
    const first = f.failures[0];
    items.push({
      id: 'failures',
      label: `Intake failures (last ${f.windowHours}h)`,
      count: f.failures.length,
      ...(first ? { detail: `${first.at.slice(0, 16).replace('T', ' ')} ${first.path}: ${first.error}`.slice(0, 240) } : f.olderFailures ? { detail: `${f.olderFailures} older failure(s) not counted` } : {}),
      href: first ? `/m/${first.module}` : '/',
      attention: f.failures.length > 0,
      source: 'apps/mtw/.state/intake/state.json',
    });
    if (f.held.length) {
      const holders = [...new Set(f.held.map((h) => h.holder))];
      items.push({ id: 'held', label: 'Intake deferred by a catalog lease', count: f.held.length, detail: `Waiting for ${holders.join(', ')} to release the catalog; retried on the next pass.`, href: '/', attention: false, source: 'wiki/operations/leases.json' });
    }
    const last = f.misses.at(-1);
    items.push({
      id: 'misses',
      label: 'Unregistered media left by agent stops',
      count: f.misses.length,
      ...(last ? { detail: `${last.at.slice(0, 16).replace('T', ' ')} ${f.misses.slice(-3).map((m) => m.path).join(', ')}` } : {}),
      href: last ? `/m/${this.moduleFor(last.path)?.id ?? 'images'}` : '/',
      attention: f.misses.length > 0,
      source: 'apps/mtw/.state/intake-misses.jsonl',
    });
    if (!this.config.enabled) items.push({ id: 'disabled', label: 'Auto-intake is off (wiki/operations/intake.json)', count: 1, href: '/', attention: true });
    return items;
  }

  private async loadState(): Promise<void> {
    try {
      const s = JSON.parse(await fs.readFile(this.stateFile, 'utf8')) as { failures?: IntakeFailure[]; held?: IntakeHeld[]; recent?: IntakeRegistration[] };
      for (const f of s.failures ?? []) {
        // State written before 2026-10-12 kept lease refusals as failures; they are deferrals.
        const holder = leaseHolderOf(f.error);
        if (holder) this.held.set(f.path, { module: f.module, path: f.path, holder, detail: f.error, at: f.at });
        else this.failures.set(f.path, f);
      }
      for (const h of s.held ?? []) this.held.set(h.path, h);
      this.recent = (s.recent ?? []).slice(0, 50);
    } catch {
      /* first run */
    }
  }

  private async saveState(): Promise<void> {
    this.factsMemo = null;
    try {
      await fs.mkdir(path.dirname(this.stateFile), { recursive: true });
      const tmp = `${this.stateFile}.${process.pid}.tmp`;
      await fs.writeFile(tmp, `${JSON.stringify({ failures: [...this.failures.values()], held: [...this.held.values()], recent: this.recent }, null, 2)}\n`, 'utf8');
      await fs.rename(tmp, this.stateFile);
    } catch {
      /* state is a convenience; the catalogs and decision logs are the record */
    }
  }

  /** Resolves when every queued step has finished (tests, shutdown). */
  idle(): Promise<void> {
    return this.queue.then(() => undefined);
  }

  stop(): void {
    this.stopped = true;
    for (const w of this.watchers) w.close();
    this.watchers = [];
    for (const w of this.waiting.values()) if (w.timer) clearTimeout(w.timer);
    for (const d of this.deferred.values()) if (d.timer) clearTimeout(d.timer);
    this.deferred.clear();
    this.waiting.clear();
  }
}
