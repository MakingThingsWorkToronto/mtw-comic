// The Home dashboard (GET /api/home `dashboard`): five sections computed from canonical files, each with the time it
// was read and the file it came from. Cheap reads run per request; slow ones (git status, the wiki gates, the
// misplaced-media scan, the site probe, the server-source scan) run in the background behind Refreshing caches and are
// never awaited past a short budget, so /api/home stays well under a second.
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ActivityRow, HealthRow, LibraryRow, NeedItem, TerminalInfo } from '../../modules/types';
import { groupChanges, gitStatusFiles } from './gitChanges';
import type { ChangedFile, GitChanges } from './gitChanges';
import type { HomeModuleEntry } from './home';
import type { IntakeFacts } from './intake';
import { nextSteps } from './nextSteps';
import type { NextStep } from './nextSteps';
import type { Core } from './services';
import { parseLeases, parseStatusEntries } from './statusBoard';
import type { ClaimState, LeaseRow } from './statusBoard';

/** This Studio process's start, for the "restart to load changed server files" check. */
export const PROCESS_STARTED = new Date(Date.now() - process.uptime() * 1000);

/** A value refreshed in the background at most every `ttlMs`; readers get the last value at once. */
export class Refreshing<T> {
  private value: { data: T; readAt: string } | null = null;
  private failure: { message: string; at: string } | null = null;
  private startedAt = 0;
  private loading: Promise<void> | null = null;
  constructor(private load: () => Promise<T>, private ttlMs: number) {}

  /** The last value; starts a refresh when stale. With `waitMs`, waits that long for a first value. */
  async get(waitMs = 0): Promise<{ data: T; readAt: string } | null> {
    if (!this.loading && Date.now() - this.startedAt > this.ttlMs) {
      this.startedAt = Date.now();
      this.loading = this.load().then(
        (data) => {
          this.value = { data, readAt: new Date().toISOString() };
          this.failure = null;
        },
        (error: Error) => {
          this.failure = { message: error.message, at: new Date().toISOString() };
        },
      ).finally(() => {
        this.loading = null;
      });
    }
    if (!this.value && this.loading && waitMs > 0) await Promise.race([this.loading, new Promise((r) => setTimeout(r, waitMs).unref?.())]);
    return this.value;
  }
  get error(): { message: string; at: string } | null {
    return this.failure;
  }
}

export interface TerminalRow {
  id: string;
  title: string;
  runner: string;
  model?: string;
  effort?: string;
  operation?: string;
  module?: string;
  subject?: string;
  startedAt: string;
  lastActivityAt?: string;
  tokens?: number;
  href: string;
}
export interface ClaimRow {
  holder: string;
  to?: string;
  scope: string;
  state: ClaimState;
  at?: string;
  dateOnly?: true;
}
export interface DashboardData {
  version: 1;
  generatedAt: string;
  studio: { startedAt: string; pid: number };
  needs: { readAt: string; items: (NeedItem & { module: string; moduleTitle: string })[] };
  running: {
    readAt: string;
    terminals: TerminalRow[];
    activity: (ActivityRow & { module: string })[];
    claims: { readAt: string | null; source: string; rows: ClaimRow[] };
    leases: { readAt: string | null; source: string; rows: LeaseRow[] };
  };
  health: { readAt: string; rows: (HealthRow & { readAt?: string })[] };
  libraries: { readAt: string; rows: (LibraryRow & { module: string; title: string })[] };
  nextSteps: { readAt: string; steps: NextStep[] };
}

const STATUS_FILE = 'discussion/handoff/STATUS.md';
const LEASES_FILE = 'wiki/operations/leases.json';
const GATES = [
  { name: 'wiki graph', args: ['scripts/wiki/wiki-graph.mjs', '--check'] },
  { name: 'wiki frontmatter gate', args: ['scripts/wiki/wiki-frontmatter-gate.mjs'] },
  { name: 'wiki index gate', args: ['scripts/wiki/wiki-index-gate.mjs'] },
];
const off = (): boolean => Boolean(process.env.VITEST) || process.env.MTW_HOME_BACKGROUND === 'off';

function run(repoRoot: string, args: string[], timeout = 60_000): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    execFile(process.execPath, args, { cwd: repoRoot, timeout, maxBuffer: 1 << 24, windowsHide: true }, (error, stdout, stderr) => {
      const code = error ? (typeof (error as { code?: unknown }).code === 'number' ? ((error as { code: number }).code) : 1) : 0;
      resolve({ code, stdout: String(stdout), stderr: String(stderr) });
    });
  });
}

/** Server-side sources (not the hot-reloaded client) changed after this process started. */
async function changedServerFiles(appRoot: string, since: Date): Promise<string[]> {
  const out: string[] = [];
  const skipDir = new Set(['node_modules', 'dist', '.state', 'client', 'ui', 'web', 'fonts', 'test', 'tests']);
  const walk = async (dir: string): Promise<void> => {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (!skipDir.has(e.name)) await walk(abs);
      } else if (/\.(ts|mts|mjs|json)$/.test(e.name) && !/\.tsx$/.test(e.name)) {
        const st = await fs.stat(abs).catch(() => null);
        if (st && st.mtimeMs > since.getTime()) out.push(path.relative(appRoot, abs).replace(/\\/g, '/'));
      }
    }
  };
  await walk(path.join(appRoot, 'server'));
  await walk(path.join(appRoot, 'modules'));
  return out.sort();
}

/** One dashboard per core: holds the background caches. */
export class Dashboard {
  private status: Refreshing<{ claims: ReturnType<typeof parseStatusEntries>; leasesJson: unknown }>;
  private git: Refreshing<ChangedFile[]>;
  private gates: Refreshing<{ name: string; ok: boolean; detail: string }[]>;
  private misplaced: Refreshing<{ outside: number; wrongHome: number }>;
  private site: Refreshing<{ up: boolean; url: string }>;
  private server: Refreshing<string[]>;
  private intake: Refreshing<IntakeFacts | null>;

  constructor(private core: Core, private appRoot: string) {
    const repo = core.repoRoot;
    this.status = new Refreshing(async () => {
      const [text, leases] = await Promise.all([fs.readFile(path.join(repo, STATUS_FILE), 'utf8').catch(() => ''), fs.readFile(path.join(repo, LEASES_FILE), 'utf8').then((t) => JSON.parse(t) as unknown, () => [])]);
      return { claims: parseStatusEntries(text, 12), leasesJson: leases };
    }, 5_000);
    this.git = new Refreshing(() => (off() ? Promise.reject(new Error('background checks are off')) : gitStatusFiles(repo)), 60_000);
    this.gates = new Refreshing(async () => {
      if (off()) throw new Error('background checks are off');
      const results = [];
      for (const g of GATES) {
        const r = await run(repo, g.args);
        const last = `${r.stderr}\n${r.stdout}`.trim().split('\n').filter(Boolean).at(-1) ?? '';
        results.push({ name: g.name, ok: r.code === 0, detail: r.code === 0 ? 'passes' : last.slice(0, 160) || `exit ${r.code}` });
      }
      return results;
    }, 10 * 60_000);
    this.misplaced = new Refreshing(async () => {
      if (off()) throw new Error('background checks are off');
      const r = await run(repo, ['scripts/assets/find-misplaced-media.mjs', '--json']);
      if (r.code !== 0) throw new Error(r.stderr.trim().split('\n').at(-1) ?? `exit ${r.code}`);
      const j = JSON.parse(r.stdout) as { outside: string[]; wrongHome: string[] };
      return { outside: j.outside.length, wrongHome: j.wrongHome.length };
    }, 5 * 60_000);
    this.site = new Refreshing(async () => {
      const cfg = await core.wiki.readJson<{ siteBaseUrl?: string }>('wiki/operations/editor.json').catch(() => ({}) as { siteBaseUrl?: string });
      const url = cfg.siteBaseUrl ?? 'http://127.0.0.1:8787';
      try {
        await fetch(url, { signal: AbortSignal.timeout(1500) });
        return { up: true, url };
      } catch {
        return { up: false, url };
      }
    }, 15_000);
    this.server = new Refreshing(() => changedServerFiles(appRoot, PROCESS_STARTED), 60_000);
    this.intake = new Refreshing(async () => (core.intake ? core.intake.facts() : null), 15_000);
  }

  async build(modules: HomeModuleEntry[]): Promise<DashboardData> {
    const now = new Date();
    const at = now.toISOString();
    const [status, git, gates, misplaced, site, server, intake] = await Promise.all([
      this.status.get(500),
      this.git.get(0),
      this.gates.get(0),
      this.misplaced.get(0),
      this.site.get(300),
      this.server.get(300),
      this.intake.get(400),
    ]);
    const leases = parseLeases(status?.data.leasesJson ?? [], now);
    const claims = status?.data.claims ?? [];

    // 1. Needs you now: every module's needs, oldest first (undated last, in module order).
    const needs = modules
      .flatMap((m) => (m.needs ?? []).map((n) => ({ ...n, module: m.id, moduleTitle: m.title })))
      .map((n, i) => ({ n, i }))
      .sort((a, b) => (a.n.since && b.n.since ? a.n.since.localeCompare(b.n.since) : a.n.since ? -1 : b.n.since ? 1 : a.i - b.i))
      .map((x) => x.n);

    // 2. Running.
    const terminals: TerminalRow[] = this.core.terminals
      .list()
      .filter((t: TerminalInfo) => t.status === 'running')
      .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
      .map((t) => ({
        id: t.id,
        title: t.title,
        runner: t.runner,
        ...(t.model ? { model: t.model } : {}),
        ...(t.effort ? { effort: t.effort } : {}),
        ...(t.operation ? { operation: t.operation } : {}),
        ...(t.module ? { module: t.module } : {}),
        ...(t.subject ? { subject: t.subject } : {}),
        startedAt: t.startedAt,
        ...(t.lastActivityAt ? { lastActivityAt: t.lastActivityAt } : {}),
        ...(t.tokens ? { tokens: t.tokens.total } : {}),
        href: `/m/operations/terminals/${encodeURIComponent(t.id)}`,
      }));
    const activity = modules.flatMap((m) => (m.activity ?? []).map((a) => ({ ...a, module: m.id })));

    // 3. Health.
    const health: (HealthRow & { readAt?: string })[] = [];
    health.push(
      site
        ? { id: 'site', label: 'Site preview', state: site.data.up ? 'pass' : 'fail', detail: site.data.up ? `${site.data.url} answers` : `${site.data.url} does not answer; start it with npm run all`, source: 'wiki/operations/editor.json siteBaseUrl', readAt: site.readAt }
        : { id: 'site', label: 'Site preview', state: 'info', detail: 'Checking', source: 'wiki/operations/editor.json siteBaseUrl' },
    );
    const restartFiles = server?.data ?? [];
    health.push({
      id: 'studio',
      label: 'Studio',
      state: restartFiles.length ? 'warn' : 'pass',
      detail: restartFiles.length ? `${restartFiles.length} server file(s) changed since this process started (pid ${process.pid}); restart Studio to load them: ${restartFiles.slice(0, 3).join(', ')}` : `Server code current (pid ${process.pid})`,
      source: 'apps/mtw/server + modules/*/server sources',
      ...(server ? { readAt: server.readAt } : {}),
    });
    const facts = intake?.data ?? null;
    if (facts) {
      const newest = facts.failures[0];
      const heldBy = [...new Set(facts.held.map((h) => h.holder))];
      health.push({
        id: 'intake',
        label: `Intake failures (${facts.windowHours} h)`,
        state: !facts.enabled ? 'fail' : facts.failures.length ? 'fail' : 'pass',
        detail: !facts.enabled
          ? 'Auto-intake is off'
          : `${facts.failures.length} failed${newest ? `; newest ${newest.at.slice(11, 16)} UTC: ${newest.error.slice(0, 120)}` : ''}${facts.held.length ? `; ${facts.held.length} deferred by lease ${heldBy.join(', ')}` : ''}${facts.olderFailures ? `; ${facts.olderFailures} older` : ''}`,
        href: '/m/images',
        source: 'apps/mtw/.state/intake/state.json',
        readAt: intake?.readAt ?? at,
      });
      const oldestMiss = facts.misses[0];
      const ms = misplaced?.data;
      const total = facts.misses.length + (ms ? ms.outside + ms.wrongHome : 0);
      health.push({
        id: 'media',
        label: 'Unregistered or misplaced media',
        state: total ? 'warn' : 'pass',
        detail: `${facts.misses.length} left unregistered by agent stops${oldestMiss ? ` (oldest ${oldestMiss.at.slice(0, 16).replace('T', ' ')} UTC: ${oldestMiss.path.split('/').slice(-2).join('/')})` : ''}${ms ? `; ${ms.outside} outside the canonical homes, ${ms.wrongHome} in a content home` : '; misplaced scan pending'}`,
        href: '/m/images',
        source: 'apps/mtw/.state/intake-misses.jsonl + scripts/assets/find-misplaced-media.mjs',
        readAt: misplaced?.readAt ?? intake?.readAt ?? at,
      });
    }
    let changes: GitChanges | null = null;
    if (git) {
      changes = groupChanges(git.data, leases, claims);
      const top = changes.byArea.slice(0, 4).map((a) => `${a.area} ${a.files}`).join(', ');
      const owners = changes.byOwner.slice(0, 4).map((o) => `${o.owner}${o.via === 'lease' ? ' (lease)' : ''} ${o.files}`).join(', ');
      const unclaimed = changes.byOwner.find((o) => o.via === 'none')?.files ?? 0;
      health.push({ id: 'git', label: 'Uncommitted changes', state: changes.total === 0 ? 'pass' : unclaimed ? 'warn' : 'info', detail: changes.total ? `${changes.total} files. By area: ${top}. Likely owners: ${owners}` : 'Working tree clean', source: 'git status --porcelain + wiki/operations/leases.json + discussion/handoff/STATUS.md', readAt: git.readAt });
    } else {
      health.push({ id: 'git', label: 'Uncommitted changes', state: 'info', detail: this.git.error ? `Not read: ${this.git.error.message}` : 'Reading git status in the background', source: 'git status --porcelain' });
    }
    if (gates) {
      const failing = gates.data.filter((g) => !g.ok);
      health.push({ id: 'gates', label: 'Wiki gates', state: failing.length ? 'fail' : 'pass', detail: failing.length ? failing.map((g) => `${g.name}: ${g.detail}`).join('; ') : `${gates.data.length} gates pass`, source: 'scripts/wiki/{wiki-graph --check,wiki-frontmatter-gate,wiki-index-gate}.mjs (background, every 10 min)', readAt: gates.readAt });
    } else {
      health.push({ id: 'gates', label: 'Wiki gates', state: 'info', detail: this.gates.error ? `Not run: ${this.gates.error.message}` : 'Running in the background', source: 'scripts/wiki/*.mjs' });
    }
    for (const m of modules) for (const h of m.health ?? []) health.push({ ...h, readAt: at });

    // 4. Libraries.
    const libraries = modules.flatMap((m) => (m.library ? [{ ...m.library, module: m.id, title: m.title }] : []));

    // 5. Next steps.
    const unpriced = /Price unknown for (.+?);/.exec(health.find((h) => h.id === 'pricing')?.detail ?? '')?.[1]?.split(', ') ?? [];
    const steps = nextSteps({
      now,
      restart: server ? { files: restartFiles, runningTerminals: terminals.length } : null,
      siteUp: site ? site.data.up : null,
      leases,
      owners: changes?.byOwner ?? null,
      intake: facts
        ? {
            enabled: facts.enabled,
            failures: facts.failures.length,
            ...(facts.failures[0] ? { newest: { path: facts.failures[0].path, error: facts.failures[0].error } } : {}),
            held: [...facts.held.reduce((m, h) => m.set(h.holder, (m.get(h.holder) ?? 0) + 1), new Map<string, number>())].map(([holder, files]) => ({ holder, files })),
            misses: facts.misses.length,
          }
        : null,
      needs,
      unpricedModels: unpriced,
      gates: gates ? gates.data.map((g) => ({ name: g.name, ok: g.ok })) : null,
    });

    return {
      version: 1,
      generatedAt: at,
      studio: { startedAt: PROCESS_STARTED.toISOString(), pid: process.pid },
      needs: { readAt: at, items: needs },
      running: {
        readAt: at,
        terminals,
        activity,
        claims: { readAt: status?.readAt ?? null, source: STATUS_FILE, rows: claims.map((c) => ({ holder: c.holder, ...(c.to ? { to: c.to } : {}), scope: c.scope, state: c.state, ...(c.at ? { at: c.at } : {}), ...(c.dateOnly ? { dateOnly: true as const } : {}) })) },
        leases: { readAt: status?.readAt ?? null, source: LEASES_FILE, rows: leases },
      },
      health: { readAt: at, rows: health },
      libraries: { readAt: at, rows: libraries },
      nextSteps: { readAt: at, steps },
    };
  }
}

const dashboards = new WeakMap<Core, Dashboard>();
export function dashboardFor(core: Core, appRoot = fileURLToPath(new URL('../..', import.meta.url))): Dashboard {
  let d = dashboards.get(core);
  if (!d) dashboards.set(core, (d = new Dashboard(core, appRoot)));
  return d;
}
