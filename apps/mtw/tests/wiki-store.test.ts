import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileDecisionLog } from '../server/core/decisions';
import { FileLeases, globToRegExp } from '../server/core/leases';
import { FileWikiStore } from '../server/core/wiki-store';

let root: string;
beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), 'mtw-wiki-'));
  mkdirSync(path.join(root, 'wiki', 'lib'), { recursive: true });
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('FileWikiStore', () => {
  it('refuses paths outside wiki/', async () => {
    const store = new FileWikiStore(root);
    for (const bad of ['../outside.json', 'wiki/../outside.json', '/etc/passwd', 'wiki/lib/../../x.json', 'wiki']) {
      await expect(store.writeText(bad, 'x')).rejects.toThrow(/escapes wiki/);
      await expect(store.readText(bad)).rejects.toThrow(/escapes wiki/);
    }
  });

  it('writes atomically: content lands, no temp file is left', async () => {
    const store = new FileWikiStore(root);
    await store.writeJson('wiki/lib/a.json', { a: 1 });
    expect(JSON.parse(readFileSync(path.join(root, 'wiki', 'lib', 'a.json'), 'utf8'))).toEqual({ a: 1 });
    expect(await store.readJson('lib/a.json')).toEqual({ a: 1 });
    await store.writeJson('wiki/lib/a.json', { a: 2 });
    expect(readdirSync(path.join(root, 'wiki', 'lib'))).toEqual(['a.json']);
    expect(store.ownWrites.get('wiki/lib/a.json')).toBeTruthy();
    expect(await store.exists('wiki/lib/a.json')).toBe(true);
    expect(await store.exists('wiki/lib/missing.json')).toBe(false);
  });

  it('leaves the previous file intact when the write fails', async () => {
    const store = new FileWikiStore(root);
    await store.writeText('wiki/lib/a.txt', 'old');
    // A directory squatting on the destination makes the final rename fail.
    mkdirSync(path.join(root, 'wiki', 'lib', 'blocked'));
    await expect(store.writeText('wiki/lib/blocked', 'new')).rejects.toBeTruthy();
    expect(readdirSync(path.join(root, 'wiki', 'lib')).sort()).toEqual(['a.txt', 'blocked']);
    expect(readFileSync(path.join(root, 'wiki', 'lib', 'a.txt'), 'utf8')).toBe('old');
  });

  it('refuses writes to a path leased to another session', async () => {
    mkdirSync(path.join(root, 'wiki', 'operations'), { recursive: true });
    writeFileSync(path.join(root, 'wiki', 'operations', 'leases.json'), JSON.stringify([{ path: 'wiki/lib/**', holder: 'codex-7' }]));
    const store = new FileWikiStore(root, new FileLeases(root));
    await expect(store.writeText('wiki/lib/a.txt', 'x')).rejects.toThrow(/leased to codex-7/);
    await expect(store.writeText('wiki/other/a.txt', 'x')).resolves.toBeUndefined();
  });
});

describe('FileLeases', () => {
  it('returns null with no file, honours globs and expiry', () => {
    expect(new FileLeases(root).holder('wiki/lib/a.json')).toBeNull();
    mkdirSync(path.join(root, 'wiki', 'operations'), { recursive: true });
    writeFileSync(
      path.join(root, 'wiki', 'operations', 'leases.json'),
      JSON.stringify([
        { path: 'wiki/lib/*.json', holder: 'a' },
        { path: 'wiki/old/**', holder: 'b', until: '2020-01-01T00:00:00Z' },
      ]),
    );
    const leases = new FileLeases(root, () => new Date('2026-10-09T00:00:00Z'));
    expect(leases.holder('wiki/lib/x.json')).toBe('a');
    expect(leases.holder('wiki/lib/sub/x.json')).toBeNull();
    expect(leases.holder('wiki/old/x.json')).toBeNull();
    expect(globToRegExp('wiki/**/x.json').test('wiki/a/b/x.json')).toBe(true);
  });
});

describe('FileDecisionLog', () => {
  it('appends and lists, filtering by subject and time', async () => {
    const store = new FileWikiStore(root);
    const log = new FileDecisionLog(store);
    expect(await log.list('lib')).toEqual([]);
    const a = await log.append('lib', { actor: 'matt', module: 'm', subject: 'snd:one', action: 'approve', at: '2026-10-01T00:00:00.000Z' });
    await log.append('lib', { actor: 'matt', module: 'm', subject: 'snd:two', action: 'reject', note: 'too loud' });
    expect(a.id).toBeTruthy();
    const all = await log.list('lib');
    expect(all.map((d) => d.action)).toEqual(['approve', 'reject']);
    expect((await log.list('lib', { subject: 'snd:two' }))[0]?.note).toBe('too loud');
    expect(await log.list('lib', { since: '2026-10-02T00:00:00.000Z' })).toHaveLength(1);
    const file = readFileSync(path.join(root, 'wiki', 'lib', 'decisions.jsonl'), 'utf8');
    expect(file.trimEnd().split('\n')).toHaveLength(2);
    await expect(log.append('../escape', { actor: 'matt', module: 'm', subject: 's', action: 'a' })).rejects.toThrow(/invalid library/);
  });
});
