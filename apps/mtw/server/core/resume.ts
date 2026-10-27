// Resuming a past terminal: the provider CLIs already keep every conversation on disk and can reopen it by id.
// Studio only remembers which id belonged to which terminal (run.json) and checks the transcript is still there.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import type { TerminalInfo } from '../../modules/types';
import { claudeProjectDir } from './tokens';
import type { RunnerConfig } from './runners';

export type TranscriptKind = 'claude' | 'codex' | null;

/** Which provider's transcript store a runner uses, from its token sources. */
export function transcriptKind(runner: RunnerConfig): TranscriptKind {
  const sources = [runner.tokenSource, runner.tokenFallback];
  if (sources.includes('claude-transcript')) return 'claude';
  if (sources.includes('codex-rollout')) return 'codex';
  return null;
}

export interface Homes {
  claude: string;
  codex: string;
}
export const defaultHomes = (): Homes => ({ claude: path.join(homedir(), '.claude'), codex: path.join(homedir(), '.codex') });

/** ~/.claude/projects/<cwd munged>/<sessionId>.jsonl, or the same file under any other project folder. */
export function findClaudeTranscript(claudeHome: string, cwd: string, sessionId: string): string | null {
  const projects = path.join(claudeHome, 'projects');
  const direct = path.join(projects, claudeProjectDir(cwd), `${sessionId}.jsonl`);
  if (existsSync(direct)) return direct;
  try {
    for (const dir of readdirSync(projects)) {
      const candidate = path.join(projects, dir, `${sessionId}.jsonl`);
      if (existsSync(candidate)) return candidate;
    }
  } catch {
    /* no projects folder */
  }
  return null;
}

/** ~/.codex/sessions/YYYY/MM/DD/rollout-<time>-<sessionId>.jsonl */
export function findCodexRollout(codexHome: string, sessionId: string): string | null {
  const root = path.join(codexHome, 'sessions');
  const suffix = `-${sessionId}.jsonl`;
  const names = (p: string): string[] => {
    try {
      return readdirSync(p).sort().reverse();
    } catch {
      return [];
    }
  };
  for (const y of names(root)) {
    for (const m of names(path.join(root, y))) {
      for (const d of names(path.join(root, y, m))) {
        const day = path.join(root, y, m, d);
        const hit = names(day).find((n) => n.startsWith('rollout-') && n.endsWith(suffix));
        if (hit) return path.join(day, hit);
      }
    }
  }
  return null;
}

/** The conversation id a Codex rollout file belongs to: session_meta.payload.id, else the id in the file name. */
export function codexSessionIdOf(rollout: string): string | null {
  try {
    const first = readFileSync(rollout, 'utf8').split('\n', 1)[0] ?? '';
    const meta = JSON.parse(first) as { type?: string; payload?: { id?: string } };
    if (meta.type === 'session_meta' && meta.payload?.id) return meta.payload.id;
  } catch {
    /* half-written first line: fall back to the name */
  }
  return /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.jsonl$/i.exec(path.basename(rollout))?.[1] ?? null;
}

/** The saved transcript for a conversation, or null when the CLI no longer has it. */
export function findTranscript(kind: TranscriptKind, homes: Homes, cwd: string, sessionId: string): string | null {
  if (kind === 'claude') return findClaudeTranscript(homes.claude, cwd, sessionId);
  if (kind === 'codex') return findCodexRollout(homes.codex, sessionId);
  return null;
}

/** A permission's args that skip safety prompts. Resume never reuses them. */
export const isBypass = (args: string[]): boolean => args.some((a) => /dangerously|bypass/i.test(a));

export interface RunFile {
  id?: string;
  runner?: string;
  title?: string;
  operation?: string;
  module?: string;
  subject?: string;
  startedAt?: string;
  exitedAt?: string;
  exitCode?: number;
  status?: string;
  sessionId?: string;
  transcript?: string;
  cwd?: string;
  permission?: string | null;
  model?: string;
  effort?: string;
  resumedFrom?: string;
  pid?: number;
  hasPrompt?: boolean;
  tokens?: TerminalInfo['tokens'];
}

export function readRunFile(stateDir: string, id: string): RunFile | null {
  if (!/^t-[0-9a-f]{8}$/.test(id)) return null;
  try {
    return JSON.parse(readFileSync(path.join(stateDir, 'runs', id, 'run.json'), 'utf8')) as RunFile;
  } catch {
    return null;
  }
}

/**
 * Every earlier terminal still described on disk, newest first, so they stay findable after a Studio restart.
 * A record still saying "running" belongs to a process that is gone: it crashed or Studio stopped, so it is shown as
 * exited and `interrupted`. Records from before session ids were stored recover the id from the Codex rollout path.
 */
export function loadPastTerminals(stateDir: string, limit = 200): TerminalInfo[] {
  const runsDir = path.join(stateDir, 'runs');
  let names: string[] = [];
  try {
    names = readdirSync(runsDir);
  } catch {
    return [];
  }
  const out: TerminalInfo[] = [];
  for (const name of names) {
    const r = readRunFile(stateDir, name);
    if (!r?.id || !r.startedAt || !r.runner) continue;
    let sessionId = r.sessionId;
    if (!sessionId && r.transcript && path.basename(r.transcript).startsWith('rollout-')) sessionId = codexSessionIdOf(r.transcript) ?? undefined;
    let exitedAt = r.exitedAt;
    if (!exitedAt) {
      try {
        exitedAt = statSync(path.join(runsDir, name, 'run.json')).mtime.toISOString();
      } catch {
        exitedAt = r.startedAt;
      }
    }
    out.push({
      id: r.id,
      runner: r.runner as TerminalInfo['runner'],
      title: r.title ?? 'Terminal',
      ...(r.operation ? { operation: r.operation } : {}),
      ...(r.module ? { module: r.module } : {}),
      pid: r.pid ?? 0,
      startedAt: r.startedAt,
      exitedAt,
      ...(r.exitCode !== undefined ? { exitCode: r.exitCode } : {}),
      status: 'exited',
      ...(r.status === 'running' ? { interrupted: true } : {}),
      ...(r.tokens ? { tokens: r.tokens } : {}),
      ...(r.hasPrompt ? { hasPrompt: true } : {}),
      ...(sessionId ? { sessionId } : {}),
      ...(r.subject ? { subject: r.subject } : {}),
      lastActivityAt: exitedAt,
      ...(r.model ? { model: r.model } : {}),
      ...(r.effort ? { effort: r.effort } : {}),
      ...(r.resumedFrom ? { resumedFrom: r.resumedFrom } : {}),
    });
  }
  out.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  return out.slice(0, limit);
}
