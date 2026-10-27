// Plans: exact file lists in wiki/operations/storage/plans/<id>.json. The app creates, edits (exclusions) and approves plans;
// the bytes are moved only by the visible `storage-execute-plan` terminal procedure. Nothing here deletes or moves a file.
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { LaunchOpts } from '../../server/core/prompts';
import type { Decision, Services } from '../types';
import { findProvider } from './providers/registry';
import { makeContext } from './providers/context';
import { defaultStateDir } from './providers/hasher';
import type { Plan, PlanDetail, PlanFile, PlanSummary, StorageConfig } from './types';

export const STORAGE_DIR = 'wiki/operations/storage';
export const STORAGE_LIB = 'operations/storage';
export const DEFAULT_CONFIG: StorageConfig = { archiveRoot: 'C:/MTW-archive/', defaults: { days: 30 } };

const PLAN_ID = /^[a-z0-9][a-z0-9-]{2,120}$/;
const ALLOWED_PREFIXES = ['wiki/', 'site/public/'];

export class PlanError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

export const TRANSCODE_PROVIDER = 'oversized-originals';

export const planPath = (id: string): string => `${STORAGE_DIR}/plans/${id}.json`;

export function isSafeRepoPath(p: string): boolean {
  return !p.includes('..') && !p.includes('\\') && !p.startsWith('/') && !/^[A-Za-z]:/.test(p) && ALLOWED_PREFIXES.some((a) => p.startsWith(a));
}

/** Hash of what an approval covers: the included files, their hashes and actions. */
export function hashPlan(files: PlanFile[]): string {
  const h = createHash('sha256');
  for (const f of files.filter((x) => !x.excluded).sort((a, b) => a.path.localeCompare(b.path))) h.update(`${f.path}\t${f.sha256}\t${f.action}\n`);
  return h.digest('hex');
}

export const includedOf = (plan: Plan): { files: number; bytes: number } => {
  const inc = plan.files.filter((f) => !f.excluded);
  return { files: inc.length, bytes: inc.reduce((s, f) => s + f.bytes, 0) };
};

const slug = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

export class StoragePlans {
  constructor(
    private services: Services,
    private repoRoot: string,
    private stateDir?: string,
  ) {}

  private context(opts: { hash?: boolean; params?: Record<string, number> }) {
    return makeContext(this.repoRoot, { ...opts, ...(this.stateDir ? { stateDir: this.stateDir } : {}) });
  }

  async config(): Promise<StorageConfig> {
    try {
      const c = await this.services.wiki.readJson<Partial<StorageConfig>>(`${STORAGE_DIR}/config.json`);
      return { archiveRoot: c.archiveRoot || DEFAULT_CONFIG.archiveRoot, defaults: { ...DEFAULT_CONFIG.defaults, ...(c.defaults ?? {}) } };
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  /** Human decisions are appended through services.decisions (library 'operations/storage'). */
  decide(d: Omit<Decision, 'id' | 'at'>): Promise<Decision> {
    return this.services.decisions.append(STORAGE_LIB, d);
  }

  async listPlans(): Promise<PlanSummary[]> {
    const dir = `${STORAGE_DIR}/plans`;
    let names: string[] = [];
    try {
      names = (await fs.readdir(path.join(this.repoRoot, dir))).filter((n) => n.endsWith('.json'));
    } catch {
      return [];
    }
    const out: PlanSummary[] = [];
    for (const n of names) {
      try {
        const plan = await this.services.wiki.readJson<Plan>(`${dir}/${n}`);
        const inc = includedOf(plan);
        out.push({ id: plan.id, title: plan.title, vertical: plan.vertical, providerId: plan.providerId, target: plan.target, status: plan.status, createdAt: plan.createdAt, files: inc.files, bytes: inc.bytes });
      } catch {
        /* skip an unreadable plan file */
      }
    }
    return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getPlan(id: string): Promise<Plan> {
    if (!PLAN_ID.test(id)) throw new PlanError(400, 'invalid plan id');
    try {
      return await this.services.wiki.readJson<Plan>(planPath(id));
    } catch {
      throw new PlanError(404, `no plan ${id}`);
    }
  }

  async detail(id: string): Promise<PlanDetail> {
    const plan = await this.getPlan(id);
    const inc = includedOf(plan);
    const planHash = hashPlan(plan.files);
    const termId = plan.execution?.terminalId;
    const term = termId ? this.services.terminals.list().find((t) => t.id === termId) : undefined;
    const detail: PlanDetail = {
      plan,
      includedFiles: inc.files,
      includedBytes: inc.bytes,
      planHash,
      approvalStale: Boolean(plan.approval && plan.approval.planHash !== planHash),
      archiveRoot: (await this.config()).archiveRoot,
    };
    if (term) detail.terminal = { id: term.id, status: term.status, ...(term.exitCode !== undefined ? { exitCode: term.exitCode } : {}) };
    return detail;
  }

  async create(input: { providerId: string; target: string; params?: Record<string, number> }): Promise<Plan> {
    const provider = findProvider(input.providerId);
    if (!provider) throw new PlanError(404, `unknown provider ${input.providerId}`);
    if (provider.reportOnly) throw new PlanError(400, `${provider.label} is report only; no plan can be created`);
    const cfg = await this.config();
    const params = Object.fromEntries(provider.params.map((p) => [p.name, Number(input.params?.[p.name] ?? cfg.defaults[p.name] ?? p.default)]));
    const targets = await provider.targets(this.context({ params }));
    const found = targets.find((t) => t.id === input.target);
    if (!found) throw new PlanError(404, `unknown target ${input.target}`);
    if (found.planless) throw new PlanError(400, `${found.label} cannot be archived; register it instead`);
    const result = await provider.plan(input.target, this.context({ hash: true, params }));
    const files = result.files.filter((f) => isSafeRepoPath(f.path));
    if (files.length === 0) throw new PlanError(409, 'nothing to reduce for this target');
    const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
    const id = `${slug(provider.id)}-${slug(input.target)}-${stamp}`.slice(0, 120);
    if (await this.services.wiki.exists(planPath(id))) throw new PlanError(409, `plan ${id} already exists; try again in a minute`);
    const plan: Plan = {
      schemaVersion: 1,
      id,
      title: `${found.label}`,
      providerId: provider.id,
      vertical: found.vertical ?? provider.vertical,
      target: input.target,
      params,
      status: 'draft',
      createdAt: new Date().toISOString(),
      files,
      skipped: result.skipped,
    };
    await this.services.wiki.writeJson(planPath(id), plan);
    await this.decide({ actor: 'matt', module: 'storage', subject: id, action: 'create-plan', value: { files: files.length, bytes: includedOf(plan).bytes }, note: plan.title });
    return plan;
  }

  private async save(plan: Plan): Promise<void> {
    await this.services.wiki.writeJson(planPath(plan.id), plan);
  }

  /** Replace the exclusion set. Only a draft plan can change; approving freezes it. */
  async setExclusions(id: string, excluded: string[]): Promise<Plan> {
    const plan = await this.getPlan(id);
    if (plan.status !== 'draft') throw new PlanError(409, `plan is ${plan.status}; only a draft can change`);
    const set = new Set(excluded);
    for (const f of plan.files) {
      if (set.has(f.path)) f.excluded = true;
      else delete f.excluded;
    }
    await this.save(plan);
    return plan;
  }

  async approve(id: string): Promise<Plan> {
    const plan = await this.getPlan(id);
    if (plan.status !== 'draft') throw new PlanError(409, `plan is ${plan.status}; only a draft can be approved`);
    const inc = includedOf(plan);
    if (inc.files === 0) throw new PlanError(400, 'every file is excluded; nothing to approve');
    const planHash = hashPlan(plan.files);
    const decision = await this.decide({
      actor: 'matt',
      module: 'storage',
      subject: id,
      action: 'approve-plan',
      value: { planHash, files: inc.files, bytes: inc.bytes, excluded: plan.files.length - inc.files },
      note: plan.title,
    });
    plan.status = 'approved';
    plan.approval = { at: decision.at, decisionId: decision.id, planHash, files: inc.files, bytes: inc.bytes };
    await this.save(plan);
    return plan;
  }

  async cancel(id: string): Promise<Plan> {
    const plan = await this.getPlan(id);
    if (plan.status !== 'draft' && plan.status !== 'approved') throw new PlanError(409, `plan is ${plan.status}; it cannot be cancelled`);
    plan.status = 'cancelled';
    await this.save(plan);
    await this.decide({ actor: 'matt', module: 'storage', subject: id, action: 'cancel-plan', note: plan.title });
    return plan;
  }

  async execute(id: string, opts: LaunchOpts = {}): Promise<Plan> {
    const plan = await this.getPlan(id);
    const term = plan.execution && this.services.terminals.list().find((t) => t.id === plan.execution?.terminalId);
    const retry = plan.status === 'partial' || (plan.status === 'executing' && (!term || term.status === 'exited'));
    if (plan.status !== 'approved' && !retry) throw new PlanError(409, `plan is ${plan.status}; it must be approved before it can run`);
    if (!plan.approval || plan.approval.planHash !== hashPlan(plan.files)) throw new PlanError(409, 'the plan changed after approval; approve it again');
    const terminal = await this.services.operations.launch(plan.providerId === TRANSCODE_PROVIDER ? 'storage-transcode-plan' : 'storage-execute-plan', { plan: id }, opts.runner, opts.permission, undefined, opts.choice);
    plan.status = 'executing';
    plan.execution = { terminalId: terminal.id, startedAt: new Date().toISOString() };
    await this.save(plan);
    await this.decide({ actor: 'matt', module: 'storage', subject: id, action: 'execute-plan', value: { terminalId: terminal.id }, note: plan.title });
    return plan;
  }

  async restore(id: string, opts: LaunchOpts = {}): Promise<Plan> {
    const plan = await this.getPlan(id);
    if (plan.providerId === TRANSCODE_PROVIDER) throw new PlanError(409, 'a transcode plan only adds new files; the originals were never moved. Delete the new files by hand if you do not want them.');
    if (plan.status !== 'executed' && plan.status !== 'partial') throw new PlanError(409, `plan is ${plan.status}; only an executed plan can be restored`);
    const terminal = await this.services.operations.launch('storage-restore', { plan: id }, opts.runner, opts.permission, undefined, opts.choice);
    plan.restore = { terminalId: terminal.id, startedAt: new Date().toISOString() };
    await this.save(plan);
    await this.decide({ actor: 'matt', module: 'storage', subject: id, action: 'restore-plan', value: { terminalId: terminal.id }, note: plan.title });
    return plan;
  }

  /** Hand unregistered files to the owning module's register procedure in a visible terminal. The list goes in a file; nothing moves. */
  async register(input: { providerId: string; target: string }, opts: LaunchOpts = {}): Promise<{ terminalId: string; files: number }> {
    const provider = findProvider(input.providerId);
    if (!provider?.register) throw new PlanError(404, 'nothing to register for this row');
    const req = await provider.register(input.target, this.context({}));
    if (!req || req.paths.length === 0) throw new PlanError(409, 'nothing to register for this row');
    const dir = this.stateDir ?? defaultStateDir(this.repoRoot);
    await fs.mkdir(dir, { recursive: true });
    const listFile = path.join(dir, `register-${slug(provider.id)}-${slug(input.target)}.txt`);
    await fs.writeFile(listFile, req.paths.join('\n') + '\n', 'utf8');
    const rel = path.relative(this.repoRoot, listFile).split(path.sep).join('/');
    const terminal = await this.services.operations.launch(req.procedure, { [req.param]: req.text(req.paths.length, rel) }, opts.runner, opts.permission, undefined, opts.choice);
    await this.decide({ actor: 'matt', module: 'storage', subject: `${input.providerId}/${input.target}`, action: 'register-files', value: { terminalId: terminal.id, files: req.paths.length, list: rel } });
    return { terminalId: terminal.id, files: req.paths.length };
  }
}
