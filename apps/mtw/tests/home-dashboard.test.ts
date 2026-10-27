// Home dashboard (2026-10-12): next-step rules, STATUS.md and leases.json parsing, uncommitted-change grouping,
// unknown-price handling, and the pure Home summaries of workflows, spend and comics.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { workflowsSummary } from '../modules/workflows/server';
import type { RunState } from '../modules/workflows/lib/engine';
import { spendHealth } from '../modules/spend/server';
import { costLine } from '../modules/operations/server';
import { areaOf, groupChanges, parsePorcelain } from '../server/core/gitChanges';
import { nextSteps } from '../server/core/nextSteps';
import type { StepFacts } from '../server/core/nextSteps';
import { PricingTable } from '../server/core/spend';
import { parseLeases, parseStatusEntries, parseStatusTime } from '../server/core/statusBoard';
import { summarizeRuns } from '../server/core/tokens';
import type { RunRecord } from '../server/core/tokens';
import { Refreshing } from '../server/core/dashboard';

const NOW = new Date('2026-10-12T03:00:00Z');
const base = (over: Partial<StepFacts> = {}): StepFacts => ({ now: NOW, restart: { files: [], runningTerminals: 0 }, siteUp: true, leases: [], owners: [], intake: { enabled: true, failures: 0, held: [], misses: 0 }, needs: [], unpricedModels: [], gates: [], ...over });

describe('next-step rules', () => {
  it('produce nothing when all is well', () => {
    expect(nextSteps(base())).toEqual([]);
  });

  it('order: unblock first, then decisions (one per module, oldest first), then housekeeping', () => {
    const steps = nextSteps(
      base({
        restart: { files: ['server/core/home.ts'], runningTerminals: 2 },
        siteUp: false,
        leases: [{ path: 'wiki/image-library/**', holder: 'codex-root', reviewByUtc: '2026-10-12T01:30:00Z', releaseRequired: true, overdue: true, expired: false }],
        intake: { enabled: true, failures: 2, newest: { path: 'a.png', error: 'producer exploded' }, held: [{ holder: 'codex-root', files: 154 }], misses: 3 },
        needs: [
          { id: 'n1', module: 'soundtrack', title: '85 candidate tracks', next: 'Play, rate and approve', href: '/m/soundtrack?status=candidate', action: 'Listen', source: 's', since: '2026-10-02T00:00:00Z' },
          { id: 'n2', module: 'comics', title: 'Home: 116 balloons in 75 boxes', next: 'Approve or fix the balloon words', href: '/m/comics/issues/home/review?b=x', action: 'Review', source: 'c', since: '2026-10-11T00:00:00Z' },
          { id: 'n3', module: 'comics', title: 'Demo: 41 balloons', next: 'Approve', href: '/m/comics/issues/demo/review', action: 'Review', source: 'c' },
        ],
        owners: [
          { owner: 'codex-root', via: 'lease', files: 1346, areas: ['wiki/image-library'], lease: { path: 'wiki/image-library/**', overdue: true } },
          { owner: 'unclaimed', via: 'none', files: 57, areas: ['apps/mtw', '.claude/skills'] },
        ],
        unpricedModels: ['claude-fable-5-1', 'gpt-6.1-sol'],
        gates: [{ name: 'wiki graph', ok: false }],
      }),
      20,
    );
    expect(steps.map((s) => s.id)).toEqual([
      'restart',
      'site',
      'lease-codex-root-wiki/image-library/**',
      'gate-wiki graph',
      'intake-failures',
      'misses',
      'need-n1',
      'need-n2',
      'commit-lease-codex-root',
      'commit-unclaimed',
      'held-codex-root',
      'pricing',
    ]);
    expect(steps[0]?.text).toBe('Restart Studio after its 2 running terminals finish to load 1 changed server file (server/core/home.ts)');
    expect(steps[2]?.text).toContain('review was due 2 h ago');
    expect(steps.find((s) => s.id === 'need-n2')?.href).toBe('/m/comics/issues/home/review?b=x');
    expect(steps.find((s) => s.id === 'commit-lease-codex-root')?.text).toBe('Commit 1346 files under wiki/image-library/** after lease codex-root is released');
    expect(steps.find((s) => s.id === 'pricing')?.text).toContain('claude-fable-5-1, gpt-6.1-sol');
  });

  it('caps the list and skips facts that are not known yet', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ id: `n${i}`, module: `m${i}`, title: `t${i}`, next: 'Do', href: '/m/x', action: 'Go', source: 's' }));
    expect(nextSteps(base({ needs: many }))).toHaveLength(8);
    expect(nextSteps(base({ restart: null, siteUp: null, owners: null, intake: null, gates: null }))).toEqual([]);
    expect(nextSteps(base({ intake: { enabled: false, failures: 0, held: [], misses: 0 } })).map((s) => s.id)).toEqual(['intake-off']);
  });
});

const STATUS = `# Agent Handoff Status

- **CLAUDE JOURNAL WORKFLOW WIRED END TO END (2026-10-11):** Fixed things. No files claimed.
- **CLAUDE CAST VILLAIN (t-1) → HOME ROOT: MODEL REGISTRATION HANDBACK (2026-10-12T02:30Z):** Handback of wiki/comics-library/characters.json.
- **CLAUDE STUDIO ADD-RESOURCE CLAIM (2026-10-11T21:34UTC, Matt):** Exact files: \`apps/mtw/web/addResource.ts\`, apps/mtw/web/ui/ResourceForm.tsx.
- **HOME r08 REGISTRATION REJECTED / ROOT LEASE RETAINED (2026-10-12T00:08:17.204358+00:00):** Root keeps the lease.
not a bullet
## Older section
- **CODEX OLD CLAIM (2026-09-01):** ignored
`;

describe('STATUS.md and leases.json parsing', () => {
  it('reads the newest bullets up to the first heading: holder, addressee, scope, state, time, paths', () => {
    const rows = parseStatusEntries(STATUS);
    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({ holder: 'CLAUDE JOURNAL', scope: 'WORKFLOW WIRED END TO END', state: 'released', at: '2026-10-11T12:00:00.000Z', dateOnly: true, noFiles: true });
    expect(rows[0]?.to).toBeUndefined();
    expect(rows[1]).toMatchObject({ holder: 'CLAUDE CAST', to: 'HOME ROOT', state: 'request', at: '2026-10-12T02:30:00.000Z', paths: ['wiki/comics-library/characters.json'] });
    expect(rows[2]).toMatchObject({ holder: 'CLAUDE STUDIO', state: 'claim', at: '2026-10-11T21:34:00.000Z', paths: ['apps/mtw/web/addResource.ts', 'apps/mtw/web/ui/ResourceForm.tsx'] });
    expect(rows[2]?.dateOnly).toBeUndefined();
    expect(rows[3]).toMatchObject({ holder: 'HOME', state: 'hold', at: '2026-10-12T00:08:17.000Z' });
    expect(parseStatusEntries(STATUS, 2)).toHaveLength(2);
  });

  it('parses the time formats STATUS.md uses', () => {
    expect(parseStatusTime('(2026-10-11 16:04)')).toBe('2026-10-11T16:04:00.000Z');
    expect(parseStatusTime('x 2026-10-11T23:37:46.031569+00:00')).toBe('2026-10-11T23:37:46.000Z');
    expect(parseStatusTime('2026-10-11T20:00-0400')).toBe('2026-10-12T00:00:00.000Z');
    expect(parseStatusTime('no date')).toBeUndefined();
  });

  it('flags leases past their review time as overdue and past `until` as expired', () => {
    const rows = parseLeases(
      [
        { path: 'wiki/image-library/**', holder: 'a', reviewByUtc: '2026-10-12T01:31:25.528820+00:00', releaseRequired: true },
        { path: 'wiki/x/**', holder: 'b', until: '2026-10-12T02:00:00Z' },
        { path: 'wiki/y/**', holder: 'c', reviewByUtc: '2026-10-12T05:00:00Z' },
        { holder: 'no path' },
      ],
      NOW,
    );
    expect(rows.map((r) => [r.holder, r.overdue, r.expired, r.releaseRequired])).toEqual([
      ['a', true, false, true],
      ['b', false, true, false],
      ['c', false, false, false],
    ]);
    expect(parseLeases({ not: 'a list' }, NOW)).toEqual([]);
  });
});

describe('uncommitted changes', () => {
  it('parses porcelain -z (skipping rename sources) and groups by area and likely owner', () => {
    const z = ['?? wiki/image-library/assets/scenes/comic-b/home-regeneration-20261011/a/x.png', ' M apps/mtw/web/addResource.ts', 'R  site/new.ts', 'site/old.ts', ' M wiki/comics-library/characters.json', ' M README.md', ''].join('\0');
    const files = parsePorcelain(z);
    expect(files.map((f) => f.path)).toEqual(['wiki/image-library/assets/scenes/comic-b/home-regeneration-20261011/a/x.png', 'apps/mtw/web/addResource.ts', 'site/new.ts', 'wiki/comics-library/characters.json', 'README.md']);
    expect(areaOf('wiki/image-library/assets/x.png')).toBe('wiki/image-library');
    expect(areaOf('README.md')).toBe('(root files)');
    const leases = parseLeases([{ path: 'wiki/image-library/**', holder: 'codex-root', reviewByUtc: '2026-10-12T01:00:00Z' }], NOW);
    const g = groupChanges(files, leases, parseStatusEntries(STATUS));
    expect(g.total).toBe(5);
    expect(g.byOwner).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ owner: 'codex-root', via: 'lease', files: 1, lease: expect.objectContaining({ overdue: true }) }),
        expect.objectContaining({ owner: 'CLAUDE STUDIO', via: 'status', files: 1, areas: ['apps/mtw'] }),
        expect.objectContaining({ owner: 'CLAUDE CAST', via: 'status', files: 1 }),
        expect.objectContaining({ owner: 'unclaimed', via: 'none', files: 2 }),
      ]),
    );
  });
});

describe('unknown prices are unknown, never $0', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'mtw-pricing-'));
  const file = path.join(dir, 'pricing.json');
  writeFileSync(file, JSON.stringify({ models: { 'claude-opus': { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 } } }));
  const table = new PricingTable(file);
  const tokens = (model: string | undefined, total: number) => ({ input: total, output: 0, cacheRead: 0, cacheWrite: 0, total, cacheHitRate: 0, ...(model ? { model } : {}) });

  it('marks unpriced tokens and rolls their model ids up', () => {
    const priced = table.withEstimate(tokens('claude-opus-5-5', 1_000_000));
    expect(priced.estCostUsd).toBeCloseTo(15);
    expect(priced.unpriced).toBeUndefined();
    const unpriced = table.withEstimate({ ...tokens('claude-fable-5-1', 2_000_000), estCostUsd: 9 });
    expect(unpriced.estCostUsd).toBeUndefined();
    expect(unpriced.unpriced).toBe(true);
    const run = (id: string, t: ReturnType<typeof tokens>): RunRecord => ({ id, runner: 'claude', title: id, startedAt: NOW.toISOString(), status: 'exited', tokens: table.withEstimate(t) });
    const s = summarizeRuns([run('a', tokens('claude-opus-5-5', 1_000_000)), run('b', tokens('claude-fable-5-1', 2_000_000)), run('c', tokens('gpt-6.1-sol', 500_000)), run('d', tokens(undefined, 10))], NOW);
    expect(s.all.estCostUsd).toBeCloseTo(15);
    expect(s.all.unpricedTokens).toBe(2_500_010);
    expect(s.all.unpricedModels).toEqual(['claude-fable-5-1', 'gpt-6.1-sol', 'unknown model']);
    rmSync(dir, { recursive: true, force: true });
  });

  it('says "price unknown for <model>" in the Operations line', () => {
    expect(costLine({ total: 100, estCostUsd: 1.5 })).toBe('est. $1.50 (estimate)');
    expect(costLine({ total: 3_000_000, estCostUsd: 1.34, unpricedTokens: 2_000_000, unpricedModels: ['claude-fable-5-1'] })).toBe('est. $1.34 for priced models; price unknown for claude-fable-5-1 (2.0M tokens not costed)');
    expect(costLine({ total: 2_000_000, estCostUsd: 0, unpricedTokens: 2_000_000, unpricedModels: ['gpt-6.1-sol'] })).toBe('est. cost unknown: price unknown for gpt-6.1-sol (2.0M tokens not costed)');
  });
});

describe('module Home summaries (pure parts)', () => {
  it('workflows: a waiting gate is a need with a deep link; today and active runs are activity', () => {
    const run = (runId: string, status: RunState['status'], startedAt: string, nodes: RunState['nodes']): RunState =>
      ({ runId, workflowId: 'w', title: `Run ${runId}`, status, startedAt, inputs: {}, nodes, workflow: { id: 'w', title: 'W', nodes: [{ id: 'gate', label: 'Approve headline', kind: 'human-gate' }] } }) as unknown as RunState;
    const s = workflowsSummary(
      [
        run('r1', 'waiting', '2026-10-12T01:00:00Z', { gate: { status: 'waiting', startedAt: '2026-10-12T01:10:00Z' } }),
        run('r2', 'failed', '2026-10-12T02:00:00Z', {}),
        run('r3', 'succeeded', '2026-10-01T02:00:00Z', {}),
      ],
      new Date('2026-10-12T02:30:00Z'),
    );
    expect(s.needs).toEqual([expect.objectContaining({ title: 'Run r1: Approve headline', since: '2026-10-12T01:10:00Z', href: '/m/workflows/run/r1' })]);
    expect(s.activity?.map((a) => a.id)).toEqual(['r1', 'r2']);
    expect(s.items.find((i) => i.id === 'failed')?.count).toBe(1);
  });

  it('spend: no budget is info, allowance use comes from the ledger, unpriced models warn', () => {
    const rows = spendHealth(
      [{ id: 'a', runner: 'claude', title: 'a', startedAt: NOW.toISOString(), status: 'exited', tokens: { input: 1, output: 0, cacheRead: 0, cacheWrite: 0, total: 1, cacheHitRate: 0, model: 'claude-fable-5-1', unpriced: true } }],
      [],
      [{ at: NOW.toISOString(), provider: 'elevenlabs', units: 9000, unit: 'credits' }],
      { elevenlabs: { label: 'ElevenLabs', amount: 10000, unit: 'credits' } },
      NOW,
    );
    expect(rows.map((r) => [r.id, r.state])).toEqual([
      ['budgets', 'info'],
      ['allowance-elevenlabs', 'warn'],
      ['pricing', 'warn'],
    ]);
    expect(rows[2]?.detail).toBe('Price unknown for claude-fable-5-1; their tokens are not costed');
  });
});

describe('Refreshing cache', () => {
  it('serves the last value at once and refreshes in the background after the TTL', async () => {
    let n = 0;
    const r = new Refreshing(async () => ++n, 20);
    expect(await r.get(0)).toBeNull();
    expect((await r.get(200))?.data).toBe(1);
    expect((await r.get())?.data).toBe(1);
    await new Promise((res) => setTimeout(res, 30));
    expect((await r.get())?.data).toBe(1); // stale value served while the refresh runs
    await new Promise((res) => setTimeout(res, 10));
    expect((await r.get())?.data).toBe(2);
  });
});
