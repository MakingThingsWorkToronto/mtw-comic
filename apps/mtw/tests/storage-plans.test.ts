import { access, readFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FileDecisionLog } from '../server/core/decisions';
import { media } from '../server/core/media';
import { FileWikiStore } from '../server/core/wiki-store';
import { registerStorage } from '../modules/storage/server';
import { hashPlan, isSafeRepoPath, PlanError, StoragePlans } from '../modules/storage/plans';
import type { Plan, PlanDetail } from '../modules/storage/types';
import type { Handler, OperationLauncher, Router, Services, TerminalInfo } from '../modules/types';
import { makeRepo } from './storage-fixture';

let root: string;
let launched: { id: string; params: Record<string, string> }[];
let plans: StoragePlans;
let services: Services;

const terminal = (id: string): TerminalInfo => ({ id, runner: 'claude', title: 't', pid: 1, startedAt: new Date().toISOString(), status: 'running' });

beforeAll(async () => {
  root = await makeRepo();
  launched = [];
  const wiki = new FileWikiStore(root);
  const operations: OperationLauncher = {
    list: async () => [],
    launch: async (id, params) => {
      launched.push({ id, params });
      return terminal(`t-${launched.length}`);
    },
  };
  services = {
    repoRoot: root,
    wiki,
    decisions: new FileDecisionLog(wiki),
    events: { emit() {} },
    terminals: { list: () => [], spawn: () => terminal('x'), kill() {} },
    operations,
    assets: { register() {}, resolver: () => undefined, resolve: async () => null },
    media,
    leases: { holder: () => null },
  } as unknown as Services;
  plans = new StoragePlans(services, root);
});
afterAll(async () => {
  await rm(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
});

const exists = (rel: string) => access(path.join(root, rel)).then(() => true, () => false);

describe('plan lifecycle', () => {
  let id = '';

  it('creates a draft plan file with the exact list, bytes, hashes and reasons', async () => {
    const plan = await plans.create({ providerId: 'comics-published-issue', target: 'foo' });
    id = plan.id;
    expect(plan.status).toBe('draft');
    const onDisk = JSON.parse(await readFile(path.join(root, `wiki/operations/storage/plans/${id}.json`), 'utf8')) as Plan;
    expect(onDisk.files.length).toBe(5);
    expect(onDisk.files.every((f) => f.sha256.length === 64 && f.bytes > 0 && f.reason && f.action === 'archive')).toBe(true);
    expect(onDisk.files.every((f) => isSafeRepoPath(f.path))).toBe(true);
  });

  it('records exclusions on a draft and shrinks the savings', async () => {
    const before = await plans.detail(id);
    const first = before.plan.files[0]!.path;
    await plans.setExclusions(id, [first]);
    const after = await plans.detail(id);
    expect(after.includedFiles).toBe(before.includedFiles - 1);
    expect(after.includedBytes).toBe(before.includedBytes - before.plan.files[0]!.bytes);
    expect(after.planHash).not.toBe(before.planHash);
  });

  it('cannot execute before approval', async () => {
    await expect(plans.execute(id)).rejects.toBeInstanceOf(PlanError);
    expect(launched).toEqual([]);
  });

  it('approval is recorded as a decision and freezes the list', async () => {
    const plan = await plans.approve(id);
    expect(plan.status).toBe('approved');
    expect(plan.approval?.planHash).toBe(hashPlan(plan.files));
    const log = await readFile(path.join(root, 'wiki/operations/storage/decisions.jsonl'), 'utf8');
    const decisions = log.trim().split('\n').map((l) => JSON.parse(l) as { action: string; subject: string; module: string });
    expect(decisions.map((d) => d.action)).toEqual(['create-plan', 'approve-plan']);
    expect(decisions.every((d) => d.subject === id && d.module === 'storage')).toBe(true);
    await expect(plans.setExclusions(id, [])).rejects.toBeInstanceOf(PlanError);
  });

  it('execute launches the storage-execute-plan procedure and moves nothing itself', async () => {
    const before = (await plans.getPlan(id)).files.map((f) => f.path);
    const plan = await plans.execute(id);
    expect(plan.status).toBe('executing');
    expect(launched).toEqual([{ id: 'storage-execute-plan', params: { plan: id } }]);
    for (const p of before) expect(await exists(p)).toBe(true);
  });

  it('refuses to run an approval that no longer matches the list', async () => {
    const plan = await plans.getPlan(id);
    plan.status = 'approved';
    plan.files.find((f) => !f.excluded)!.sha256 = 'f'.repeat(64);
    await services.wiki.writeJson(`wiki/operations/storage/plans/${id}.json`, plan);
    const detail: PlanDetail = await plans.detail(id);
    expect(detail.approvalStale).toBe(true);
    await expect(plans.execute(id)).rejects.toThrow(/approve it again/);
  });

  it('lists plans with included totals', async () => {
    const list = await plans.listPlans();
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe(id);
  });
});

describe('guards', () => {
  it('refuses a report-only provider, an unknown target and unsafe ids', async () => {
    await expect(plans.create({ providerId: 'integration-derivatives', target: 'foo' })).rejects.toThrow(/report only/);
    await expect(plans.create({ providerId: 'comics-published-issue', target: 'nope' })).rejects.toThrow(/unknown target/);
    await expect(plans.getPlan('../../etc/passwd')).rejects.toBeInstanceOf(PlanError);
    expect(isSafeRepoPath('wiki/a/b.png')).toBe(true);
    expect(isSafeRepoPath('../x')).toBe(false);
    expect(isSafeRepoPath('C:/x')).toBe(false);
    expect(isSafeRepoPath('apps/mtw/package.json')).toBe(false);
  });

  it('creates no files outside the plan, decision log and scan cache', async () => {
    const entries = await readdir(path.join(root, 'wiki/operations/storage'));
    expect(entries.sort()).toEqual(['decisions.jsonl', 'plans']);
  });
});

describe('routes', () => {
  it('serve the scan cache, plans and errors with the documented shapes', async () => {
    const routes = new Map<string, Handler>();
    const router: Router = {
      get: (p, h) => void routes.set(`GET ${p}`, h),
      post: (p, h) => void routes.set(`POST ${p}`, h),
      rootPost: () => {},
    };
    const state = path.join(root, '.state-test');
    registerStorage(router, services, state);
    const call = (key: string, params: Record<string, string> = {}, body: unknown = {}) => (routes.get(key) as Handler)({ params, query: new URLSearchParams(), body, headers: {}, method: key.split(' ')[0] as string });

    expect(await call('GET /scan')).toEqual({ scan: null, scanning: false });
    const scanned = (await call('POST /scan')) as { scan: { roots: { id: string; bytes: number }[]; reductions: { providerId: string }[]; nodes: Record<string, unknown> } };
    const images = scanned.scan.roots.find((r) => r.id === 'images');
    expect(images?.bytes).toBeGreaterThan(300_000);
    expect(new Set(scanned.scan.reductions.map((r) => r.providerId))).toContain('comics-published-issue');
    expect(((await call('GET /scan')) as { scan: unknown }).scan).not.toBeNull();
    await expect(call('POST /plans', {}, {})).rejects.toThrow(/required/);
    await expect(call('GET /plans/:id', { id: 'missing-plan-id' })).rejects.toThrow(/no plan/);
    const providers = (await call('GET /providers')) as { id: string; reportOnly: boolean }[];
    expect(providers.map((p) => p.id)).toEqual([
      'duplicates',
      'lookalikes',
      'orphans',
      'comics-published-issue',
      'image-versions',
      'audio-candidates',
      'integration-derivatives',
      'oversized-originals',
      'replaced-originals',
      'image-evidence',
    ]);
    // The scan starts the lazy duplicate hashing in the background; wait for it before the folder is removed.
    for (let i = 0; i < 100 && ((await call('GET /hashing')) as { running: boolean }).running; i++) await new Promise((r) => setTimeout(r, 50));
    expect(await call('GET /hashing')).toMatchObject({ running: false });
    await expect(call('POST /register', {}, {})).rejects.toThrow(/required/);
    await expect(call('POST /register', {}, { providerId: 'comics-published-issue', target: 'foo' })).rejects.toThrow(/nothing to register/);
    await rm(state, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  });
});
