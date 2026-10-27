// New. HTTP surface of the Images module under /api/images/. The manifest never reaches the browser: only paged,
// slim cards, facets and one record at a time.
import { spawn } from 'node:child_process';
import { realpathSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { HttpError } from '../../../server/router';
import type { Handler, RawResponse, Router, Services } from '../../types';
import { formatImgRef, parseImgRef } from '../shared/refs';
import { buildDetail } from '../shared/detail';
import { DECISIONS_LIB } from '../shared/types';
import type { CardQuery } from '../shared/types';
import { Catalog } from './catalog';
import { PathError, readableFile } from './files';
import { Integration } from './integration';
import { CONTENT_TYPES, raw } from './raw';
import { planRegister } from './register';
import type { RegisterContext } from './register';
import { planRemove, runRemove } from './remove';
import type { RemoveContext } from './remove';
import { createResolver } from './resolver';
import { sweepImages } from './sweep';
import { Thumbs, normalizeWidth } from './thumbs';

export interface ImagesContext {
  catalog: Catalog;
  thumbs: Thumbs;
  integration: Integration;
  register: RegisterContext;
  remove: RemoveContext;
}

export interface ImagesOptions {
  /** apps/mtw/.state by default. Tests pass a temp directory. */
  stateDir?: string;
}

const num = (v: string | null, fallback: number): number => {
  const n = Number(v);
  return Number.isFinite(n) && v !== null && v !== '' ? n : fallback;
};

const decideBody = z.object({
  id: z.string().min(1),
  action: z.enum(['approve', 'reject', 'select', 'unselect', 'note']),
  version: z.string().optional(),
  style: z.string().optional(),
  scope: z.enum(['public-site', 'reference', 'cover']).optional(),
  reason: z.string().max(2000).optional(),
});
const registerBody = z.object({
  paths: z.array(z.string().min(1)).min(1).max(500),
  options: z
    .object({
      record: z.string().optional(),
      style: z.string().optional(),
      collection: z.string().optional(),
      note: z.string().optional(),
      sourceName: z.string().optional(),
      service: z.string().optional(),
      category: z.string().optional(),
    })
    .default({}),
});

const removeBody = z
  .object({
    paths: z.array(z.string().min(1)).max(2000).optional(),
    ids: z.array(z.string().min(1)).max(2000).optional(),
    rejected: z.boolean().optional(),
    etag: z.string().optional(),
  })
  .refine((b) => Boolean(b.paths?.length || b.ids?.length || b.rejected), { message: 'name paths, ids or rejected' });

function fail(error: unknown): never {
  if (error instanceof HttpError) throw error;
  if (error instanceof PathError) throw new HttpError(error.status, error.message);
  throw error;
}

export function createContext(services: Services, opts: ImagesOptions = {}): ImagesContext {
  const stateDir = opts.stateDir ?? path.join(services.repoRoot, 'apps', 'mtw', '.state');
  const catalog = new Catalog(services.repoRoot, services.decisions);
  const runProducer = (cmd: string, args: string[]): Promise<{ code: number; stdout: string; stderr: string }> => services.wiki.runProducer(cmd, args);
  return {
    catalog,
    thumbs: new Thumbs(services.repoRoot, path.join(stateDir, 'thumbs')),
    integration: new Integration(services.repoRoot),
    register: {
      repoRoot: services.repoRoot,
      catalog,
      leases: services.leases,
      stateDir,
      runProducer,
    },
    remove: { repoRoot: services.repoRoot, catalog, decisions: services.decisions, leases: services.leases, stateDir, runProducer },
  };
}

export function mountImages(router: Router, services: Services, opts: ImagesOptions = {}): ImagesContext {
  const ctx = createContext(services, opts);
  const { catalog } = ctx;
  services.assets.register(createResolver(catalog, ctx.integration));
  const get = (p: string, h: Handler): void => router.get(p, async (req) => {
    try {
      return await h(req);
    } catch (error) {
      return fail(error);
    }
  });
  const post = (p: string, h: Handler): void => router.post(p, async (req) => {
    try {
      return await h(req);
    } catch (error) {
      return fail(error);
    }
  });

  get('/status', async () => {
    const l = await catalog.ensure();
    return { etag: l.etag, records: l.manifest.records.length, collections: l.manifest.counts.collections, styleNames: l.manifest.styleNames };
  });

  get('/facets', async ({ query }) => catalog.facets(query.get('collection') || undefined, query.get('category') || undefined));

  get('/records', async ({ query }) => {
    const q: CardQuery = {
      ...(query.get('collection') ? { collection: query.get('collection') as string } : {}),
      ...(query.get('q') ? { q: query.get('q') as string } : {}),
      ...(query.get('category') ? { category: query.get('category') as string } : {}),
      ...(query.get('service') ? { service: query.get('service') as string } : {}),
      ...(query.get('style') ? { style: query.get('style') as string } : {}),
      ...(query.get('status') ? { status: query.get('status') as string } : {}),
      ...(query.get('gaps') === '1' ? { gaps: true } : {}),
      ...(['newest', 'oldest', 'title'].includes(query.get('sort') ?? '') ? { sort: query.get('sort') as 'newest' } : {}),
      offset: num(query.get('offset'), 0),
      limit: num(query.get('limit'), 60),
    };
    return catalog.cards(q);
  });

  get('/records/:id', async ({ params }) => {
    const hit = await catalog.record(params.id as string);
    if (!hit) throw new HttpError(404, `unknown record: ${params.id}`);
    const { record, loaded } = hit;
    const { overlay, entries } = await catalog.overlay();
    const integration: Record<string, string> = {};
    for (const [style, t] of Object.entries(record.treatments)) {
      if (!t.path) continue;
      const src = ctx.integration.integrationSrc(record, style, t.path);
      if (src) integration[style] = src;
    }
    return buildDetail({ record, byId: loaded.byId, family: loaded.family, entries, overlay, styleNames: loaded.manifest.styleNames, integration });
  });

  get('/evidence', async ({ query }) => {
    const l = await catalog.ensure();
    return catalog.evidenceQuery(
      { q: query.get('q') ?? '', group: query.get('group') ?? '', offset: num(query.get('offset'), 0), limit: num(query.get('limit'), 60) },
      l,
    );
  });

  get('/resolve', async ({ query }) => {
    const found = await services.assets.resolve(query.get('ref') ?? '');
    if (!found) throw new HttpError(404, 'asset not found');
    return found;
  });

  const roots = (): string[] => {
    const real = (d: string): string => {
      try {
        return realpathSync(d);
      } catch {
        return d;
      }
    };
    return [real(catalog.libraryRoot), real(ctx.thumbs.dir), catalog.libraryRoot, ctx.thumbs.dir];
  };
  const notFound = (message: string, status = 404): RawResponse => raw({ status, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: message }) });

  // Content-addressed thumbnail. SVG and originals are served as-is; everything goes through services.media.serve.
  get('/thumb/:sha', async ({ params, query, headers }) => {
    const sha = (params.sha as string).toLowerCase();
    const l = await catalog.ensure();
    const hit = /^[0-9a-f]{64}$/.test(sha) ? l.bySha.get(sha) : undefined;
    if (!hit) return notFound('unknown image');
    const file = await readableFile(services.repoRoot, `wiki/image-library/${hit.path}`).catch(() => null);
    if (!file || (hit.bytes && file.size !== hit.bytes)) return notFound('file missing or changed since registration');
    const ext = path.extname(file.abs).toLowerCase();
    const cacheControl = 'public, max-age=31536000, immutable';
    if (ext === '.svg' || query.get('w') === 'original') {
      return services.media.serve(file.abs, headers, { allowRoots: roots(), contentType: CONTENT_TYPES[ext] ?? 'application/octet-stream', cacheControl });
    }
    try {
      const out = await ctx.thumbs.get(sha, file.abs, normalizeWidth(num(query.get('w'), 320)));
      return services.media.serve(out, headers, { allowRoots: roots(), contentType: 'image/webp', cacheControl });
    } catch (error) {
      return notFound(`thumbnail failed: ${(error as Error).message}`, 415);
    }
  });

  // Original file; the path is one URL-encoded segment (the router has no wildcard).
  get('/file/:path', async ({ params, headers }) => {
    const file = await readableFile(services.repoRoot, params.path as string);
    const ext = path.extname(file.abs).toLowerCase();
    return services.media.serve(file.abs, headers, { allowRoots: roots(), contentType: CONTENT_TYPES[ext] ?? 'application/octet-stream', cacheControl: 'no-cache' });
  });

  get('/sweep', async ({ query }) => sweepImages(catalog, { files: query.get('files') === '1', hash: query.get('hash') === '1', deep: query.get('deep') === '1' }));

  // Read-only preview of exactly which files a registration would touch. The write is `mtw register image`.
  post('/register/plan', async ({ body }) => {
    const b = registerBody.safeParse(body ?? {});
    if (!b.success) throw new HttpError(400, b.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; '));
    const plan = await planRegister(ctx.register, b.data.paths, b.data.options);
    return { ...plan, payload: undefined, records: plan.payload?.records.length ?? 0 };
  });

  // Remove: archive outside the repo, verify, delete, drop from the catalog. The plan is read-only; the POST acts at
  // once because Matt's click on the confirm dialog is the approval (spec, 2026-10-11).
  post('/remove/plan', async ({ body }) => {
    const b = removeBody.safeParse(body ?? {});
    if (!b.success) throw new HttpError(400, b.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; '));
    return planRemove(ctx.remove, b.data);
  });

  post('/remove', async ({ body }) => {
    const b = removeBody.safeParse(body ?? {});
    if (!b.success) throw new HttpError(400, b.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; '));
    const { etag, ...req } = b.data;
    return runRemove(ctx.remove, req, etag);
  });

  post('/decide', async ({ body }) => {
    const b = decideBody.safeParse(body ?? {});
    if (!b.success) throw new HttpError(400, b.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; '));
    const d = b.data;
    const hit = await catalog.record(d.id);
    if (!hit) throw new HttpError(404, `unknown record: ${d.id}`);
    let version = d.version || 'current';
    let style = d.style;
    if (d.action !== 'note' && d.action !== 'unselect') {
      const resolved = await catalog.resolveFile(formatImgRef(d.id, version, d.style));
      if (!resolved) throw new HttpError(400, `no such version: ${formatImgRef(d.id, version, d.style)}`);
      style = resolved.style;
      if (version === 'current') version = 'current';
      else version = resolved.version?.token ?? version;
    }
    if (d.action === 'reject' && !d.reason?.trim()) throw new HttpError(400, 'a rejection needs a reason');
    const scope = d.scope ?? (d.action === 'approve' || d.action === 'select' ? 'reference' : undefined);
    return services.decisions.append(DECISIONS_LIB, {
      module: 'images',
      subject: `img:${d.id}@${version}`,
      action: d.action,
      actor: 'matt',
      value: { ...(style ? { style } : {}), ...(scope ? { scope } : {}), ...(d.reason?.trim() ? { reason: d.reason.trim() } : {}) },
    });
  });

  post('/reveal', async ({ body }) => {
    const p = z.object({ path: z.string().min(1) }).safeParse(body ?? {});
    if (!p.success) throw new HttpError(400, 'path is required');
    const file = await readableFile(services.repoRoot, p.data.path);
    const [cmd, args] =
      process.platform === 'win32' ? ['explorer.exe', [`/select,${file.abs}`]] : process.platform === 'darwin' ? ['open', ['-R', file.abs]] : ['xdg-open', [path.dirname(file.abs)]];
    const child = spawn(cmd as string, args as string[], { detached: true, stdio: 'ignore', windowsHide: false });
    child.on('error', () => undefined);
    child.unref();
    return { ok: true };
  });

  return ctx;
}
