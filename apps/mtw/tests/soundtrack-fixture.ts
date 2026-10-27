// Test support for the soundtrack module: a temp copy of the library (never the live one) and a server that mirrors
// server/app.ts plus the raw-route hook the module needs (see the report's "promote to shared").
import { spawn } from 'node:child_process';
import { copyFileSync, linkSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Core } from '../server/core/services';

export const appRoot = fileURLToPath(new URL('..', import.meta.url));
export const liveRepo = path.resolve(appRoot, '..', '..');
export const liveLib = path.join(liveRepo, 'wiki', 'soundtrack-library');

const LIB_FILES = ['sources.json', 'discovery.json', 'manifest.json', 'comic-audio.json'];

function linkOrCopy(src: string, dest: string): void {
  try {
    linkSync(src, dest);
  } catch {
    copyFileSync(src, dest);
  }
}

function linkTree(from: string, to: string): void {
  mkdirSync(to, { recursive: true });
  for (const name of readdirSync(from)) {
    const src = path.join(from, name);
    const dest = path.join(to, name);
    if (statSync(src).isDirectory()) linkTree(src, dest);
    else linkOrCopy(src, dest);
  }
}

export interface Fixture {
  root: string;
  lib: string;
  cleanup(): void;
}

/**
 * A repo root in the OS temp dir holding copies of the library data and profiles, hard links to the audio assets (read only by
 * the producer's check), the two producer scripts (so `soundtrack.mjs check` and the legacy `serve` run against the copy),
 * and a few tiny stand-in files for the comic-audio allowlists.
 */
export function makeFixture(): Fixture {
  const root = mkdtempSync(path.join(os.tmpdir(), 'mtw-snd-'));
  const lib = path.join(root, 'wiki', 'soundtrack-library');
  mkdirSync(lib, { recursive: true });
  for (const f of LIB_FILES) copyFileSync(path.join(liveLib, f), path.join(lib, f));
  mkdirSync(path.join(lib, 'profiles'), { recursive: true });
  // Profiles and audio are only ever read (the module never writes them), so hard links stand in for copies.
  for (const f of readdirSync(path.join(liveLib, 'profiles'))) if (f.endsWith('.json')) linkOrCopy(path.join(liveLib, 'profiles', f), path.join(lib, 'profiles', f));
  mkdirSync(path.join(lib, 'records'), { recursive: true });
  linkTree(path.join(liveLib, 'assets'), path.join(lib, 'assets'));
  writeFileSync(path.join(root, 'AGENTS.md'), 'fixture root\n');
  const scripts = path.join(root, '.claude', 'skills', 'mtw-soundtrack', 'scripts');
  mkdirSync(scripts, { recursive: true });
  for (const f of ['soundtrack.mjs', 'comic-audio-paths.mjs']) copyFileSync(path.join(liveRepo, '.claude', 'skills', 'mtw-soundtrack', 'scripts', f), path.join(scripts, f));
  const stand = (rel: string, body = 'x'.repeat(2000)) => {
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    writeFileSync(path.join(root, rel), body);
  };
  stand('wiki/comics-library/assets/voices/matt/v1.mp3');
  stand('wiki/comics-library/assets/sounds/rooms/street.wav');
  stand('wiki/comics-library/assets/other/secret.mp3');
  stand('wiki/comics-library/records/receipt.json', '{"ok":true}');
  stand('wiki/comics-library/records/notes.txt');
  stand('site/public/scripts/comic-story.js', '// runtime');
  stand('site/public/scripts/other.js', '// not served');
  stand('wiki/soundtrack-library/assets/speech/batch/line.mp3');
  stand('wiki/soundtrack-library/records/batch/receipt.json', '{"receipt":true}');
  stand('wiki/soundtrack-library/sources.json.bak', 'not served');
  return { root, lib, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

export interface Studio {
  url: string;
  core: Core;
  close(): Promise<void>;
}

/**
 * The real app (server/app.ts) over a fixture root. The calling test file must replace the module registry with the soundtrack
 * module: vi.mock('../modules/server-registry', async () => ({ serverModules: [(await import('../modules/soundtrack/server')).server] })).
 */
export async function startStudio(repoRoot: string): Promise<Studio> {
  const { startApp } = await import('../server/app');
  const app = await startApp({ repoRoot, appRoot, port: 0 });
  return { url: app.url.replace(/\/$/, ''), core: app.core, close: () => app.close() };
}

export async function runNode(script: string, args: string[], cwd: string): Promise<{ code: number; stdout: string }> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script, ...args], { cwd, windowsHide: true });
    let stdout = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stdout += d));
    child.on('close', (code) => resolve({ code: code ?? 1, stdout }));
  });
}

