import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readFileSync as read, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ContributionTracker, changedBetween, gitSnapshot, parseContributed, recentRuns, runFileFor } from '../modules/operations/contrib';
import { parsePrompt } from '../server/core/prompts';
import type { Services } from '../modules/types';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const ESC = String.fromCharCode(27);

describe('parseContributed', () => {
  it('reads the last Contributed list, ignoring ANSI and earlier mentions', () => {
    const out = `Contributed: nothing — early\r\nwork...\r\n${ESC}[1mContributed:${ESC}[0m\r\n- wiki/operations/prompts/x.md — fixed step 2\r\n- .claude/skills/a/SKILL.md and .codex copy — added rule\r\n  that wraps\r\n\r\nDone.`;
    expect(parseContributed(out)).toEqual({ items: ['wiki/operations/prompts/x.md — fixed step 2', '.claude/skills/a/SKILL.md and .codex copy — added rule that wraps'] });
  });

  it('handles "nothing — why", missing lists and the template placeholder', () => {
    expect(parseContributed('Contributed: nothing — the procedure was right')).toEqual({ items: [], nothing: 'the procedure was right' });
    expect(parseContributed('no list here')).toBeNull();
    expect(parseContributed('Contributed:\n- <path or asset> — <what changed and why>')).toBeNull();
  });
});

describe('git snapshots', () => {
  it('reports paths added or re-edited between two snapshots', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'mtw-contrib-'));
    const git = (...a: string[]) => execFileSync('git', a, { cwd: dir, stdio: 'ignore' });
    git('init', '-q');
    writeFileSync(path.join(dir, 'a.txt'), '1');
    writeFileSync(path.join(dir, 'b.txt'), '1');
    const before = await gitSnapshot(dir);
    writeFileSync(path.join(dir, 'b.txt'), '12345');
    mkdirSync(path.join(dir, 'sub'));
    writeFileSync(path.join(dir, 'sub', 'c.txt'), 'x');
    const after = await gitSnapshot(dir);
    expect(changedBetween(before, after)).toEqual(['b.txt', 'sub/c.txt']);
  });
});

describe('ContributionTracker', () => {
  it('stores contributed and changedFiles in run.json when an operation terminal exits', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'mtw-contrib-'));
    execFileSync('git', ['init', '-q'], { cwd: dir });
    const stateDir = path.join(dir, 'state');
    const id = 't-0123abcd';
    mkdirSync(path.join(stateDir, 'runs', id), { recursive: true });
    const file = runFileFor(stateDir, id) as string;
    writeFileSync(file, JSON.stringify({ id, title: 'T', operation: 'op', startedAt: '2026-10-10T00:00:00.000Z', status: 'running', promptPath: 'p.md' }));
    let listener: ((f: { type: string; data?: string }) => void) | undefined;
    let busListener: ((type: string, data: unknown) => void) | undefined;
    const info = { id, title: 'T', operation: 'op', status: 'running' };
    const services = {
      repoRoot: dir,
      events: { emit: (t: string, d: unknown) => busListener?.(t, d), on: (fn: (t: string, d: unknown) => void) => ((busListener = fn), () => undefined) },
      terminals: { stateDir, list: () => [info], attach: (_id: string, l: typeof listener) => ((listener = l), { replay: '', detach: () => undefined }) },
    } as unknown as Services;
    const tracker = new ContributionTracker(services);
    tracker.start();
    services.events.emit('terminal', [info]);
    // Wait for the run's "before" snapshot itself (a fixed pause raced git status on a loaded machine).
    await tracker.baseline(id);
    writeFileSync(path.join(dir, 'made.md'), 'new');
    listener?.({ type: 'output', data: 'Contributed:\r\n- made.md — new note\r\n' });
    listener?.({ type: 'exit' });
    for (let i = 0; i < 50 && !JSON.parse(readFileSync(file, 'utf8')).contributionsAt; i++) await new Promise((r) => setTimeout(r, 100));
    const rec = JSON.parse(readFileSync(file, 'utf8'));
    expect(rec.contributed).toEqual(['made.md — new note']);
    expect(rec.contributedMissing).toBe(false);
    expect(rec.changedFiles).toEqual(['made.md']);
    expect(rec.promptPath).toBe('p.md');
    const runs = await recentRuns(stateDir);
    expect(runs[0]).toMatchObject({ id, operation: 'op', contributed: ['made.md — new note'], changedFiles: ['made.md'] });
  });
});

describe('learning procedures', () => {
  it('parses operations-improve-procedure and operations-run-retro', () => {
    for (const [id, params] of [['operations-improve-procedure', ['operation', 'run', 'prompt', 'transcript']], ['operations-run-retro', ['runs', 'operation']]] as const) {
      const { def, body } = parsePrompt(read(path.join(REPO, 'wiki', 'operations', 'prompts', `${id}.md`), 'utf8'), id);
      expect(def.id).toBe(id);
      expect(def.params.map((p) => p.name)).toEqual(params);
      expect(body).toContain('Contributed:');
      expect(body).not.toContain('## This run');
    }
  });
});
