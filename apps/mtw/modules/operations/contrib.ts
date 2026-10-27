// Self-learning loop: capture the "Contributed:" list an operation agent ends with, and the files the run changed.
// Server-side only; read-only on the repo (git status), writes only the run's own record under .state/runs/<id>/run.json.
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Services, TerminalInfo } from '../types';

export interface Contributions {
  /** One entry per bullet under "Contributed:". Empty when the agent wrote "Contributed: nothing". */
  items: string[];
  /** The reason after "nothing", when given. */
  nothing?: string;
}

const ESC = String.fromCharCode(27);
const BEL = String.fromCharCode(7);
const ANSI = new RegExp(`${ESC}(?:\\[[0-?]*[ -/]*[@-~]|\\][^${BEL}${ESC}]*(?:${BEL}|${ESC}\\\\)|[@-Z\\\\-_])`, 'g');
const FORWARD = new RegExp(`${ESC}\\[\\d*C`, 'g');

/** Terminal bytes to plain text: cursor-forward becomes a space, other escapes vanish. */
export function plainText(raw: string): string {
  return raw.replace(FORWARD, ' ').replace(ANSI, '').replace(/\r\n?/g, '\n');
}

const MARK = '[\\s\\u23fa\\u25cf\\u2022*-]*';
const HEAD = new RegExp(`^${MARK}Contributed:`, 'i');
const BULLET = /^\s*(?:[-*•●⏺]|\d+[.)])\s+(.*\S)\s*$/;

/** Parse the last "Contributed:" list in terminal output. Returns null when the agent never wrote one. */
export function parseContributed(raw: string): Contributions | null {
  const lines = plainText(raw).split('\n');
  let at = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i] as string;
    if (!HEAD.test(line)) continue;
    // The template's own placeholder text, echoed when the agent reads it, is not a result.
    if (/<path or asset>/.test(lines[i + 1] ?? '') || /<why>/.test(line)) continue;
    at = i;
    break;
  }
  if (at < 0) return null;
  const rest = (lines[at] as string).replace(HEAD, '').trim();
  const items: string[] = [];
  if (/^nothing\b/i.test(rest)) {
    const why = rest.replace(/^nothing\s*[—–:-]*\s*/i, '').trim();
    return { items, ...(why ? { nothing: why } : {}) };
  }
  if (rest) items.push(rest);
  for (let i = at + 1; i < lines.length; i++) {
    const line = lines[i] as string;
    if (!line.trim()) {
      if (items.length) break;
      continue;
    }
    const m = line.match(BULLET);
    if (m) items.push((m[1] as string).trim());
    else if (items.length && /^\s{2,}\S/.test(line)) items[items.length - 1] += ` ${line.trim()}`;
    else break;
  }
  return { items: items.slice(0, 50).map((s) => s.slice(0, 500)) };
}

export type GitSnapshot = Map<string, string>;

function run(cmd: string, args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { cwd, maxBuffer: 16 * 1024 * 1024, windowsHide: true }, (err, stdout) => (err ? reject(err) : resolve(stdout)));
  });
}

/** Dirty paths from `git status --porcelain`, each with a status + size + mtime signature so a re-edited file shows. */
export async function gitSnapshot(repoRoot: string): Promise<GitSnapshot> {
  const out = await run('git', ['status', '--porcelain', '-z', '--untracked-files=all'], repoRoot);
  const snap: GitSnapshot = new Map();
  const parts = out.split('\0');
  for (let i = 0; i < parts.length && snap.size < 3000; i++) {
    const entry = parts[i] as string;
    if (entry.length < 4) continue;
    const status = entry.slice(0, 2);
    const file = entry.slice(3);
    if (status[0] === 'R' || status[0] === 'C') i++; // the next token is the rename source
    let sig = status;
    try {
      const st = await fs.stat(path.join(repoRoot, file));
      sig += `:${st.size}:${Math.round(st.mtimeMs)}`;
    } catch {
      sig += ':gone';
    }
    snap.set(file, sig);
  }
  return snap;
}

/** Paths whose entry is new or different after the run. */
export function changedBetween(before: GitSnapshot, after: GitSnapshot): string[] {
  const out: string[] = [];
  for (const [file, sig] of after) if (before.get(file) !== sig) out.push(file);
  for (const file of before.keys()) if (!after.has(file)) out.push(file);
  return out.sort();
}

type Terminals = {
  stateDir?: string;
  attach?: (id: string, listener: (f: { type: string; data?: string }) => void) => { replay: string; exit?: number; detach: () => void } | null;
};

const TAIL_CHARS = 128 * 1024;
const RUN_ID = /^t-[0-9a-f]{8}$/;

export function runFileFor(stateDir: string, id: string): string | null {
  return RUN_ID.test(id) ? path.join(stateDir, 'runs', id, 'run.json') : null;
}

async function patchRun(file: string, patch: Record<string, unknown>): Promise<void> {
  let rec: Record<string, unknown> = {};
  try {
    rec = JSON.parse(await fs.readFile(file, 'utf8')) as Record<string, unknown>;
  } catch {
    /* the record is rewritten whole; a missing one is started here */
  }
  // Atomic: Studio reads run.json while this writes, and a half-written file parsed as "Unexpected end of JSON input".
  const text = `${JSON.stringify({ ...rec, ...patch }, null, 2)}\n`;
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, text, 'utf8');
  try {
    await fs.rename(tmp, file);
  } catch {
    // A reader holding the file open on Windows can refuse the rename; fall back to an in-place write.
    await fs.writeFile(file, text, 'utf8');
    await fs.rm(tmp, { force: true });
  }
}

/**
 * Watches the server's terminal events. For each operation-launched terminal it snapshots git status when first seen,
 * keeps the tail of the output, and at exit stores `contributed`, `contributedNote` and `changedFiles` in run.json.
 */
export class ContributionTracker {
  private seen = new Set<string>();
  private baselines = new Map<string, Promise<GitSnapshot | null>>();
  constructor(private services: Services) {}

  /** Resolves once the run's "before" git snapshot is taken (changes made earlier count as already there). */
  baseline(id: string): Promise<GitSnapshot | null> | undefined {
    return this.baselines.get(id);
  }

  start(): () => void {
    const events = this.services.events as unknown as { on?: (fn: (type: string, data: unknown) => void) => () => void };
    return (
      events.on?.((type, data) => {
        if (type !== 'terminal' || !Array.isArray(data)) return;
        for (const t of data as TerminalInfo[]) if (t.operation && !this.seen.has(t.id)) this.track(t);
      }) ?? (() => {})
    );
  }

  private track(t: TerminalInfo): void {
    const terminals = this.services.terminals as unknown as Terminals;
    if (!terminals.attach || !terminals.stateDir) return;
    this.seen.add(t.id);
    const before: Promise<GitSnapshot | null> = gitSnapshot(this.services.repoRoot).catch(() => null);
    this.baselines.set(t.id, before);
    let tail = '';
    let done = false;
    const finish = (): void => {
      if (done) return;
      done = true;
      void this.finalize(t.id, tail, before).finally(() => this.baselines.delete(t.id));
    };
    const handle = terminals.attach(t.id, (f) => {
      if (f.type === 'output') tail = (tail + (f.data ?? '')).slice(-TAIL_CHARS);
      else if (f.type === 'exit') finish();
    });
    if (!handle) return;
    tail = handle.replay.slice(-TAIL_CHARS);
    if (handle.exit !== undefined) finish();
  }

  private async finalize(id: string, tail: string, beforeP: Promise<GitSnapshot | null>): Promise<void> {
    const terminals = this.services.terminals as unknown as Terminals;
    const file = runFileFor(terminals.stateDir as string, id);
    if (!file) return;
    try {
      const [before, after] = await Promise.all([beforeP, gitSnapshot(this.services.repoRoot).catch(() => null)]);
      const parsed = parseContributed(tail);
      await patchRun(file, {
        contributed: parsed?.items ?? [],
        contributedNote: parsed?.nothing ?? null,
        contributedMissing: !parsed,
        ...(before && after ? { changedFiles: changedBetween(before, after) } : {}),
        contributionsAt: new Date().toISOString(),
      });
      this.services.events.emit('terminal', this.services.terminals.list());
    } catch {
      /* capture must never break a run */
    }
  }
}

export interface ContributionRun {
  id: string;
  title: string;
  operation?: string;
  module?: string;
  runner?: string;
  startedAt: string;
  exitedAt?: string;
  status: string;
  exitCode?: number;
  contributed?: string[];
  contributedNote?: string | null;
  contributedMissing?: boolean;
  changedFiles?: string[];
  promptPath?: string | null;
  transcript?: string;
  tokensTotal?: number;
}

export function toContributionRun(rec: Record<string, any>): ContributionRun | null {
  if (typeof rec.id !== 'string' || typeof rec.startedAt !== 'string') return null;
  return {
    id: rec.id,
    title: String(rec.title ?? rec.id),
    ...(rec.operation ? { operation: String(rec.operation) } : {}),
    ...(rec.module ? { module: String(rec.module) } : {}),
    ...(rec.runner ? { runner: String(rec.runner) } : {}),
    startedAt: rec.startedAt,
    ...(rec.exitedAt ? { exitedAt: String(rec.exitedAt) } : {}),
    status: String(rec.status ?? 'running'),
    ...(typeof rec.exitCode === 'number' ? { exitCode: rec.exitCode } : {}),
    ...(Array.isArray(rec.contributed) ? { contributed: rec.contributed.map(String) } : {}),
    ...('contributedNote' in rec ? { contributedNote: rec.contributedNote ?? null } : {}),
    ...(rec.contributedMissing ? { contributedMissing: true } : {}),
    ...(Array.isArray(rec.changedFiles) ? { changedFiles: rec.changedFiles.map(String) } : {}),
    promptPath: rec.promptPath ?? null,
    ...(rec.transcript ? { transcript: String(rec.transcript) } : {}),
    ...(rec.tokens?.total ? { tokensTotal: Number(rec.tokens.total) } : {}),
  };
}

export async function readRun(stateDir: string, id: string): Promise<ContributionRun | null> {
  const file = runFileFor(stateDir, id);
  if (!file) return null;
  try {
    return toContributionRun(JSON.parse(await fs.readFile(file, 'utf8')));
  } catch {
    return null;
  }
}

/** Recent operation runs, newest first. */
export async function recentRuns(stateDir: string, limit = 40): Promise<ContributionRun[]> {
  const dir = path.join(stateDir, 'runs');
  let names: string[] = [];
  try {
    names = await fs.readdir(dir);
  } catch {
    return [];
  }
  const out: ContributionRun[] = [];
  for (const name of names) {
    const run = await readRun(stateDir, name);
    if (run?.operation) out.push(run);
  }
  return out.sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, limit);
}
