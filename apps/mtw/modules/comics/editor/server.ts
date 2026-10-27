// Comic Editor server routes (registered by comics/server.ts through registerEditor): story model, compare-and-swap
// balloon saves into site/src/data/comic-stories/<story>.ts, decision log, and the same-origin site proxy.
// New for the MTW app. Mounted under /api/comics/editor/*.
import { promises as fs } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { HttpError } from '../../../server/router';
import type { Router, Services } from '../../types';
import { DEFAULT_CAST, subjectOf } from './model';
import type { EditOp } from './model';
import { forwardToSite } from './proxy';
import { OpError, ShapeError, applyOps, generatedHeaderWarning, sha256, storyModel } from './storyFile';

const CONFIG_PATH = 'wiki/operations/editor.json';
export const DEFAULT_SITE = 'http://127.0.0.1:8787';
const STORY_DIR = 'site/src/data/comic-stories';

export interface EditorConfig { siteBaseUrl: string; siteStartCommand: string | null }
export const PREVIEW_TITLE = 'Website preview';

export interface IssueRef { id: string; slug: string; file: string }

const kebab = (s: string): string => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/** Pure: story ids and reader slugs from index.ts (`{ slug: 'x', ... story: fooComic`). The demo is added by the caller. */
export function parseIssueIndex(indexSource: string): IssueRef[] {
  const out: IssueRef[] = [];
  for (const m of indexSource.matchAll(/slug:\s*'([^']+)'[^\n]*?story:\s*(\w+?)Comic\b/g)) {
    const id = kebab(m[2] as string);
    out.push({ id, slug: m[1] as string, file: `${STORY_DIR}/${id}.ts` });
  }
  return out;
}
/** Pure: the CastId union from types.ts, or null. */
export function parseCast(typesSource: string): string[] | null {
  const m = /export type CastId\s*=([^;]+);/.exec(typesSource);
  if (!m) return null;
  const ids = [...(m[1] as string).matchAll(/'([^']+)'/g)].map((x) => x[1] as string);
  return ids.length ? ids : null;
}

/** True when something accepts a TCP connection at the URL's host and port. The Astro dev server can take several
 * seconds to render a page, so a timed page fetch reported a running preview as down (and offered a second start). */
export function portOpen(base: string, timeoutMs = 1500): Promise<boolean> {
  let u: URL;
  try {
    u = new URL(base);
  } catch {
    return Promise.resolve(false);
  }
  const port = Number(u.port) || (u.protocol === 'https:' ? 443 : 80);
  const host = u.hostname.replace(/^\[|\]$/g, '');
  return new Promise((resolve) => {
    const sock = net.connect({ host, port });
    const done = (up: boolean) => {
      sock.destroy();
      resolve(up);
    };
    sock.setTimeout(timeoutMs, () => done(false));
    sock.once('connect', () => done(true));
    sock.once('error', () => done(false));
  });
}

/** Pure: the forwarded query with valueless keys kept bare. Vite's style modules (`?astro&type=style&index=0&lang.css`)
 * are recognised by those bare flags; URLSearchParams.toString() would send `astro=&...&lang.css=` and break them. */
export function siteQuery(params: URLSearchParams): string {
  return [...params].map(([k, v]) => (v === '' ? encodeURIComponent(k) : `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)).join('&');
}

async function atomicWrite(file: string, text: string): Promise<void> {
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, text, 'utf8');
  await fs.rename(tmp, file);
}

export function registerEditor(router: Router, services: Services): void {
  const root = services.repoRoot;
  const abs = (rel: string): string => path.join(root, ...rel.split('/'));

  const config = async (): Promise<EditorConfig> => {
    try {
      if (await services.wiki.exists(CONFIG_PATH)) {
        const c = await services.wiki.readJson<Partial<EditorConfig>>(CONFIG_PATH);
        if (typeof c.siteBaseUrl === 'string' && /^https?:\/\//.test(c.siteBaseUrl)) return { siteBaseUrl: c.siteBaseUrl.replace(/\/+$/, ''), siteStartCommand: typeof c.siteStartCommand === 'string' && c.siteStartCommand.trim() ? c.siteStartCommand.trim() : null };
      }
    } catch {
      /* fall through to the default */
    }
    return { siteBaseUrl: DEFAULT_SITE, siteStartCommand: null };
  };

  const issues = async (): Promise<IssueRef[]> => {
    let list: IssueRef[] = [];
    try {
      list = parseIssueIndex(await fs.readFile(abs(`${STORY_DIR}/index.ts`), 'utf8'));
    } catch {
      /* no index: no issues */
    }
    return [...list, { id: 'demo', slug: 'demo', file: `${STORY_DIR}/demo.ts` }];
  };
  const issueFor = async (key: string): Promise<IssueRef> => {
    const hit = (await issues()).find((i) => i.id === key || i.slug === key);
    if (!hit) throw new HttpError(404, 'unknown issue');
    return hit;
  };

  const cast = async (): Promise<string[]> => {
    try {
      return parseCast(await fs.readFile(abs(`${STORY_DIR}/types.ts`), 'utf8')) ?? DEFAULT_CAST;
    } catch {
      return DEFAULT_CAST;
    }
  };

  const staleApprovals = async (issue: IssueRef): Promise<number> => {
    try {
      const f = await services.wiki.readJson<{ textReviews?: { storySource?: { path?: string } }[] }>('wiki/comics-library/speech-approvals.json');
      return (f.textReviews ?? []).filter((r) => (r.storySource?.path ?? '').endsWith(`/${issue.id}.ts`)).length;
    } catch {
      return 0;
    }
  };

  const view = async (issue: IssueRef) => {
    const text = await fs.readFile(abs(issue.file), 'utf8');
    const holder = services.leases.holder(issue.file);
    let model = null;
    let refusal: string | null = null;
    try {
      model = storyModel(text, issue.id, issue.slug);
    } catch (error) {
      if (error instanceof ShapeError) refusal = error.message;
      else throw error;
    }
    const stat = await fs.stat(abs(issue.file));
    return {
      issue,
      hash: sha256(text),
      mtime: stat.mtime.toISOString(),
      model,
      refusal,
      warning: generatedHeaderWarning(text),
      holder,
      editable: !!model && !holder,
      readOnlyReason: holder ? `Held by ${holder}` : refusal ? `This file cannot be line-patched: ${refusal}` : null,
      staleApprovals: await staleApprovals(issue),
      cast: await cast(),
    };
  };

  router.get('/editor/config', async () => ({ ...(await config()), proxy: '/api/comics/editor/site', issues: await issues() }));

  router.get('/editor/story/:id', async ({ params }) => view(await issueFor(params.id as string)));

  /** Cheap poll target for the live view: hash, mtime and lease holder only. */
  router.get('/editor/state/:id', async ({ params }) => {
    const issue = await issueFor(params.id as string);
    const text = await fs.readFile(abs(issue.file), 'utf8');
    const stat = await fs.stat(abs(issue.file));
    return { hash: sha256(text), mtime: stat.mtime.toISOString(), holder: services.leases.holder(issue.file) };
  });

  router.post('/editor/save/:id', async ({ params, body }) => {
    const issue = await issueFor(params.id as string);
    const b = (body ?? {}) as { baseHash?: unknown; ops?: unknown };
    if (typeof b.baseHash !== 'string') throw new HttpError(400, 'baseHash is required');
    if (!Array.isArray(b.ops) || !b.ops.length) throw new HttpError(400, 'ops is required');
    const holder = services.leases.holder(issue.file);
    if (holder) throw new HttpError(423, `Held by ${holder}; the editor is read-only`);
    const file = abs(issue.file);
    const text = await fs.readFile(file, 'utf8');
    const current = sha256(text);
    if (current !== b.baseHash) {
      const err = new HttpError(409, 'The story file changed on disk since it was loaded');
      throw err;
    }
    let result;
    try {
      result = applyOps(text, b.ops as EditOp[], await cast());
    } catch (error) {
      if (error instanceof ShapeError || error instanceof OpError) throw new HttpError(error.status, error.message);
      throw error;
    }
    // Compare-and-swap once more right before the rename (another writer may have landed while we parsed).
    if (sha256(await fs.readFile(file, 'utf8')) !== current) throw new HttpError(409, 'The story file changed on disk during the save');
    await atomicWrite(file, result.text);
    for (const c of result.changes) {
      await services.decisions.append('comics-library', {
        actor: 'matt',
        module: 'comics',
        subject: subjectOf(issue.id, { scene: c.scene, img: c.img, index: c.index }),
        action: c.action,
        value: { old: c.old?.text ?? null, new: c.new?.text ?? null, oldBalloon: c.old ?? null, newBalloon: c.new ?? null },
        note: 'Speech approvals hash the whole story file; editing invalidates them for this story.',
      });
    }
    services.events.emit('wiki-changed', { module: 'comics', paths: [issue.file] });
    return { ...(await view(issue)), saved: result.changes.length };
  });

  const previewTerminal = () => services.terminals.list().find((t) => t.title === PREVIEW_TITLE && t.status === 'running');
  const siteUp = (base: string): Promise<boolean> => portOpen(base);

  router.get('/editor/site/status', async () => ({ up: await siteUp((await config()).siteBaseUrl), terminal: previewTerminal()?.id ?? null }));

  /** Opens (or reuses) a visible shell terminal and types the configured start command into it. */
  router.post('/editor/site/start', async () => {
    const cfg = await config();
    if (await siteUp(cfg.siteBaseUrl)) return { up: true, terminal: previewTerminal()?.id ?? null, started: false };
    const existing = previewTerminal();
    if (existing) return { up: false, terminal: existing.id, started: false };
    if (!cfg.siteStartCommand) throw new HttpError(400, `Set siteStartCommand in ${CONFIG_PATH}`);
    const term = services.terminals.spawn({ runner: 'shell', title: PREVIEW_TITLE, module: 'comics' });
    services.terminals.write(term.id, `${cfg.siteStartCommand}\r`);
    return { up: false, terminal: term.id, started: true };
  });

  router.get('/editor/site', async ({ query, headers }) => {
    const u = query.get('u');
    if (!u) throw new HttpError(400, 'u is required');
    const rest = new URLSearchParams(query);
    rest.delete('u');
    return forwardToSite((await config()).siteBaseUrl, u, siteQuery(rest), headers);
  });
}
