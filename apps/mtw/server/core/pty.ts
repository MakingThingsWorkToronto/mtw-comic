// Ported from accelerator apps/stdio/mcp/lib/pty.mjs: the one door to node-pty.
// Spawns a process under a pseudo-terminal and RELEASES its handles when it is gone.
//
// Why release exists (measured on node 24 / node-pty 1.1.0 / Windows ConPTY): after the child exits
// on its own, onExit fires but node-pty's conout worker thread is disposed only from kill(), so the
// event loop never drains. kill() after exit would dispose it but forks conpty_console_list_agent
// against a dead pid ("AttachConsole failed" plus a 5 s wait). So on win32 the process-list probe
// is narrowed to the root pid and the worker is disposed directly after a natural exit. This reaches
// into a dependency pinned to an EXACT version in package.json. Elsewhere node-pty is untouched.
import { existsSync, readFileSync } from 'node:fs';
import { delimiter, dirname, isAbsolute, join, resolve } from 'node:path';
import pty from 'node-pty';
import type { IPty } from 'node-pty';

export type { IPty };

interface ResolveOptions {
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
}

/**
 * node-pty does NOT search PATH (spawn('claude') throws "File not found" while claude.exe is on
 * PATH). So a bare executable is resolved here first: PATH, and on win32 PATHEXT. A name nothing
 * answers to is refused by name. An absolute or relative path is returned as is.
 */
export function resolveExecutable(file: string, { env = process.env, platform = process.platform }: ResolveOptions = {}): string {
  if (isAbsolute(file) || file.includes('/') || file.includes('\\')) return file;
  const exts = platform === 'win32' ? (env.PATHEXT ?? '.EXE;.CMD;.BAT;.COM').split(';') : [''];
  for (const dir of (env.PATH ?? env.Path ?? '').split(delimiter)) {
    if (!dir) continue;
    for (const ext of exts) {
      const candidate = join(dir, file + ext);
      if (existsSync(candidate)) return candidate;
    }
  }
  // Windows PowerShell lives at a fixed path that a trimmed PATH (Git Bash, agent hosts) may omit.
  if (platform === 'win32' && /^powershell(\.exe)?$/i.test(file)) {
    const fixed = join(env.SystemRoot ?? env.SYSTEMROOT ?? 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    if (existsSync(fixed)) return fixed;
  }
  throw new Error(`executable "${file}" is not on PATH, so it cannot be spawned`);
}

/**
 * npm's Windows launcher is a cmd.exe shim whose last command names one JavaScript entry below
 * %dp0% and forwards %*. Run that entry with this process's Node: ConPTY still owns the interactive
 * child, while cmd.exe's 8191-character command-line ceiling no longer truncates a long prompt.
 * Unknown hand-written cmd/bat launchers keep the ComSpec fallback in spawnPty.
 */
export function resolveWindowsNodeShim(file: string): string | null {
  if (!/\.cmd$/i.test(file)) return null;
  try {
    const match = readFileSync(file, 'utf8').match(/["']%dp0%[\\/]([^"'\r\n]+\.js)["']\s+%\*/i);
    if (!match?.[1]) return null;
    const entry = resolve(dirname(file), match[1]);
    return existsSync(entry) ? entry : null;
  } catch {
    return null;
  }
}

/**
 * Claude Code marks the processes it spawns with these so a nested `claude` knows it is a child of
 * a running session. A runner this app spawns is a NEW top-level session, so the markers are
 * stripped (an inherited CLAUDE_CODE_CHILD_SESSION made the spawned claude skip transcript saving).
 */
export const INHERITED_SESSION_MARKERS: readonly string[] = Object.freeze([
  'CLAUDECODE',
  'CLAUDE_CODE_CHILD_SESSION',
  'CLAUDE_CODE_SESSION_ID',
  'CLAUDE_CODE_BRIDGE_SESSION_ID',
  'CLAUDE_CODE_SSE_PORT',
  'CLAUDE_CODE_MESSAGING_SOCKET',
  'CLAUDE_CODE_MESSAGING_TOKEN',
  'CLAUDE_CODE_ENTRYPOINT',
  'CLAUDE_CODE_EXECPATH',
  'CLAUDE_PID',
  'CLAUDE_EFFORT',
]);

/**
 * Environment for a real interactive terminal, independent of whatever launched this server. Agent
 * hosts set TERM=dumb / NO_COLOR / FORCE_COLOR for their own captured output; forwarding them would
 * make the CLI suppress colour in a full xterm. Returns a copy; the caller's env is never mutated.
 */
export function terminalEnvironment(env: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  const terminalEnv: NodeJS.ProcessEnv = { ...env, TERM: 'xterm-256color', COLORTERM: 'truecolor' };
  delete terminalEnv.NO_COLOR;
  delete terminalEnv.FORCE_COLOR;
  for (const marker of INHERITED_SESSION_MARKERS) delete terminalEnv[marker];
  return terminalEnv;
}

// node-pty internals this module touches (version-pinned); not part of its typings.
interface ConptyAgent {
  _useConpty?: boolean;
  _useConptyDll?: boolean;
  _innerPid?: number;
  _getConsoleProcessList?: () => Promise<number[]>;
  _conoutSocketWorker?: { dispose?: () => void };
  _inSocket?: { destroy?: () => void };
}
type InternalPty = IPty & { _agent?: ConptyAgent };

/** Narrow the Windows console-process probe to the root pid (the helper fails on this host). */
export function stabilizePty<T extends IPty>(proc: T, { platform = process.platform }: { platform?: NodeJS.Platform } = {}): T {
  const agent = (proc as unknown as InternalPty)?._agent;
  if (platform === 'win32' && agent?._useConpty === true && agent._useConptyDll !== true && Number.isInteger(agent._innerPid)) {
    const pid = agent._innerPid as number;
    agent._getConsoleProcessList = async () => [pid];
  }
  return proc;
}

export interface SpawnPtyOptions {
  cols?: number;
  rows?: number;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

export function spawnPty(file: string, args: string[], { cols = 120, rows = 40, cwd = process.cwd(), env = process.env }: SpawnPtyOptions = {}): IPty {
  const resolved = resolveExecutable(file, { env });
  const commandShim = process.platform === 'win32' && /\.(cmd|bat)$/i.test(resolved);
  const nodeShimEntry = commandShim ? resolveWindowsNodeShim(resolved) : null;
  const executable = nodeShimEntry
    ? process.execPath
    : commandShim
      ? env.ComSpec ?? env.COMSPEC ?? join(env.SystemRoot ?? env.SYSTEMROOT ?? 'C:\\Windows', 'System32', 'cmd.exe')
      : resolved;
  const argv = nodeShimEntry ? [nodeShimEntry, ...args] : commandShim ? ['/d', '/s', '/c', resolved, ...args] : args;
  return stabilizePty(pty.spawn(executable, argv, { cols, rows, cwd, env: terminalEnvironment(env) as Record<string, string>, name: 'xterm-256color' }));
}

/** Drop every handle node-pty still holds on a process that has already exited. */
export function releasePty(proc: IPty): void {
  const agent = (proc as InternalPty)?._agent;
  const worker = agent?._conoutSocketWorker;
  if (process.platform === 'win32' && worker && typeof worker.dispose === 'function') {
    try {
      agent?._inSocket?.destroy?.();
      worker.dispose();
    } catch {
      /* already released */
    }
    return;
  }
  try {
    proc.kill();
  } catch {
    /* already gone */
  }
}
