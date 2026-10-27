// Approve/reject for comic audio: decision file, producer rebuild (stubbed with the producer's own applyReview), decisions log.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { FileDecisionLog } from '../server/core/decisions';
import { FileLeases } from '../server/core/leases';
import { FileWikiStore } from '../server/core/wiki-store';
import type { Services } from '../modules/types';
import { REVIEW_FILE, reviewComicAudio } from '../modules/soundtrack/server/comic-review';
import { ComicAudioStore } from '../modules/soundtrack/server/resolver';
// @ts-expect-error untyped producer module
import { applyReview, describe as describeClip } from '../../../.claude/skills/mtw-soundtrack/scripts/comic-audio.mjs';

const cleanups: (() => void)[] = [];
afterEach(() => {
  while (cleanups.length) cleanups.pop()?.();
});

function setup(rebuildCode = 0) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'mtw-comic-review-'));
  cleanups.push(() => rmSync(root, { recursive: true, force: true }));
  const lib = path.join(root, 'wiki', 'soundtrack-library');
  mkdirSync(lib, { recursive: true });
  const base = [
    { id: 'line-1', type: 'speech-dialogue', title: 'dana line', character: 'Dana', text: 'Let me check.', provider: 'ElevenLabs', status: 'candidate', productionApproved: false },
    { id: 'effect-keys', type: 'effect-recipe', kind: 'keys', title: 'Keys effect', provider: 'Web Audio', status: 'procedural-recipe', productionApproved: false },
  ];
  const build = () => {
    const reviewPath = path.join(root, REVIEW_FILE);
    let review = null;
    try {
      review = JSON.parse(readFileSync(reviewPath, 'utf8'));
    } catch {
      /* no decisions yet */
    }
    const records = applyReview(structuredClone(base), review);
    writeFileSync(path.join(lib, 'comic-audio.json'), JSON.stringify({ counts: { records: records.length }, records }));
  };
  build();
  const leases = new FileLeases(root);
  const wiki = new FileWikiStore(root, leases);
  const services = { repoRoot: root, wiki, decisions: new FileDecisionLog(wiki), events: { emit: () => undefined }, leases } as unknown as Services;
  const comic = new ComicAudioStore(lib);
  let queue: Promise<unknown> = Promise.resolve();
  const deps = {
    services,
    comic,
    enqueue: <T>(fn: () => Promise<T>) => {
      const run = queue.then(fn, fn);
      queue = run.catch(() => undefined);
      return run;
    },
    now: () => new Date('2026-10-13T12:00:00Z'),
    rebuild: async () => {
      if (rebuildCode !== 0) return { code: rebuildCode, stderr: 'Error: stub failure' };
      build();
      return { code: 0, stderr: '' };
    },
  };
  return { root, lib, deps };
}

describe('comic audio review', () => {
  it('approves every clip by default and describes each in plain words', () => {
    const records = applyReview(
      [
        { id: 'a', type: 'speech-dialogue', character: 'Dana', text: 'Let me\nfinish.', sourceRefs: [{ story: 'home', scene: 'brief' }] },
        { id: 'b', type: 'effect-recipe', kind: 'keys' },
        { id: 'c', type: 'provider-preview', title: 'Bella', provider: 'ElevenLabs', description: 'A warm voice.' },
      ],
      null,
    );
    expect(records.map((r: { approval: string }) => r.approval)).toEqual(['approved', 'approved', 'approved']);
    expect(records[0].description).toBe('Dana says: “Let me finish.” In the Home comic, brief scene.');
    expect(records[1].description).toMatch(/typing on a keyboard/);
    expect(records[2].description).toBe('A warm voice.');
    expect(describeClip({ type: 'ambience-recording', room: 'street' })).toMatch(/^Street background/);
  });

  it('rejects then re-approves a clip: decision file, rebuilt record and decisions log all agree', async () => {
    const { root, lib, deps } = setup();
    const out = await reviewComicAudio(deps, { id: 'line-1', approval: 'rejected' });
    expect(out.record).toMatchObject({ id: 'line-1', approval: 'rejected', approvalDecided: { at: '2026-10-13T12:00:00.000Z', by: 'matt' } });
    expect(out.logged).toBe(true);
    const review = JSON.parse(readFileSync(path.join(root, REVIEW_FILE), 'utf8'));
    expect(review.decisions['line-1']).toEqual({ approval: 'rejected', at: '2026-10-13T12:00:00.000Z', by: 'matt' });
    const catalog = JSON.parse(readFileSync(path.join(lib, 'comic-audio.json'), 'utf8'));
    expect(catalog.records.find((r: { id: string }) => r.id === 'effect-keys').approval).toBe('approved');
    const log = readFileSync(path.join(lib, 'decisions.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    expect(log.at(-1)).toMatchObject({ actor: 'matt', subject: 'speech:line-1', action: 'reject' });

    const back = await reviewComicAudio(deps, { id: 'line-1', approval: 'approved' });
    expect(back.record.approval).toBe('approved');
  });

  it('refuses bad input and unknown ids, and keeps the old decisions when the rebuild fails', async () => {
    const { root, deps } = setup(1);
    expect(() => reviewComicAudio(deps, { id: 'line-1', approval: 'maybe' })).toThrow(/approved or rejected/);
    await expect(reviewComicAudio(deps, { id: 'nope', approval: 'rejected' })).rejects.toThrow(/no comic audio record/);
    await expect(reviewComicAudio(deps, { id: 'line-1', approval: 'rejected' })).rejects.toThrow(/rebuild failed/);
    expect(JSON.parse(readFileSync(path.join(root, REVIEW_FILE), 'utf8')).decisions).toEqual({});
  });
});
