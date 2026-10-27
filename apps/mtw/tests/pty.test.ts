import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { INHERITED_SESSION_MARKERS, resolveExecutable, resolveWindowsNodeShim, terminalEnvironment } from '../server/core/pty';

describe('resolveExecutable', () => {
  it('finds a bare name on PATH, trying PATHEXT on win32', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'mtw-pty-'));
    try {
      writeFileSync(path.join(dir, 'tool.CMD'), '');
      writeFileSync(path.join(dir, 'plain'), '');
      expect(resolveExecutable('tool', { env: { PATH: dir, PATHEXT: '.EXE;.CMD' }, platform: 'win32' })).toBe(path.join(dir, 'tool.CMD'));
      expect(resolveExecutable('plain', { env: { PATH: dir }, platform: 'linux' })).toBe(path.join(dir, 'plain'));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('refuses a name nothing on PATH answers to, by name', () => {
    expect(() => resolveExecutable('no-such-tool-xyz', { env: { PATH: tmpdir() }, platform: 'linux' })).toThrow(/no-such-tool-xyz/);
  });

  it('returns absolute and relative paths as given', () => {
    expect(resolveExecutable('/bin/sh')).toBe('/bin/sh');
    expect(resolveExecutable('.\\run.exe')).toBe('.\\run.exe');
  });
});

describe('resolveWindowsNodeShim', () => {
  it('reads the JS entry out of an npm .cmd shim', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'mtw-shim-'));
    try {
      writeFileSync(path.join(dir, 'entry.js'), '');
      const shim = path.join(dir, 'tool.cmd');
      writeFileSync(shim, '@echo off\r\n"%_prog%"  "%dp0%\\entry.js" %*\r\n');
      expect(resolveWindowsNodeShim(shim)).toBe(path.join(dir, 'entry.js'));
      writeFileSync(shim, '@echo off\r\necho hi\r\n');
      expect(resolveWindowsNodeShim(shim)).toBeNull();
      expect(resolveWindowsNodeShim(path.join(dir, 'tool.exe'))).toBeNull();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('terminalEnvironment', () => {
  it('strips session markers and colour policy, and advertises a real terminal', () => {
    const source: NodeJS.ProcessEnv = { KEEP: '1', TERM: 'dumb', NO_COLOR: '1', FORCE_COLOR: '0' };
    for (const marker of INHERITED_SESSION_MARKERS) source[marker] = 'x';
    const env = terminalEnvironment(source);
    expect(env.KEEP).toBe('1');
    expect(env.TERM).toBe('xterm-256color');
    expect(env.COLORTERM).toBe('truecolor');
    expect(env.NO_COLOR).toBeUndefined();
    expect(env.FORCE_COLOR).toBeUndefined();
    for (const marker of INHERITED_SESSION_MARKERS) expect(env[marker]).toBeUndefined();
    expect(source.NO_COLOR).toBe('1'); // the caller's env is untouched
    expect(INHERITED_SESSION_MARKERS).toContain('CLAUDECODE');
  });
});
