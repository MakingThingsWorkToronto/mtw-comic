// Reduction provider: a published comic issue. Reads wiki/image-library/manifest.json and the story files under
// site/src/data/comic-stories/ (the art the site actually uses); never guesses from file names alone.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { SkippedFile } from '../types';
import { buildEntries, dropReferenced, IMAGE_LIB, loadImageManifest, MEDIA_EXT } from './context';
import type { Candidate, ProviderContext, ReductionProvider } from './context';

const PAGES = 'assets/scenes/comic-b/pages/';
const EVIDENCE = 'assets/experiments/comic-b/';
const STORIES_DIR = 'site/src/data/comic-stories';

/** Page-art file: <stem>-v<N>[-print].<ext>. */
export function parseVersioned(name: string): { stem: string; version: number; print: boolean } | null {
  const m = /^(.*)-v(\d+)(-print)?\.(png|jpe?g|webp)$/i.exec(name);
  return m ? { stem: m[1] as string, version: Number(m[2]), print: Boolean(m[3]) } : null;
}

/** Page identity across file-name variants: no build date, no "-device" tag. */
export const pageKey = (stem: string): string => stem.replace(/-\d{8}(?=-|$)/, '').replace(/-device$/, '');

interface SiteArt {
  /** story id -> page key -> versions the site's story files name */
  byIssue: Map<string, Map<string, Set<number>>>;
  /** story id -> number of art entries */
  issues: Set<string>;
}

async function readSiteArt(ctx: ProviderContext): Promise<SiteArt> {
  return ctx.memo('site-comic-art', async () => {
    const byIssue = new Map<string, Map<string, Set<number>>>();
    const issues = new Set<string>();
    let names: string[] = [];
    try {
      names = (await fs.readdir(path.join(ctx.repoRoot, STORIES_DIR))).filter((n) => n.endsWith('.ts'));
    } catch {
      /* no story files: nothing is published */
    }
    for (const name of names) {
      const text = await fs.readFile(path.join(ctx.repoRoot, STORIES_DIR, name), 'utf8');
      for (const m of text.matchAll(/art:\s*["']\/comic\/([^/"']+)\/([^"']+)["']/g)) {
        const id = m[1] as string;
        const base = m[2] as string;
        issues.add(id);
        const v = /^(.*)-v(\d+)$/.exec(base);
        const key = pageKey(v ? (v[1] as string) : base);
        const pages = byIssue.get(id) ?? new Map<string, Set<number>>();
        const set = pages.get(key) ?? new Set<number>();
        if (v) set.add(Number(v[2]));
        pages.set(key, set);
        byIssue.set(id, pages);
      }
    }
    return { byIssue, issues };
  });
}

export const comicsPublishedIssue: ReductionProvider = {
  id: 'comics-published-issue',
  vertical: 'comics',
  label: 'Older versions',
  category: 'older',
  describe:
    'Archive what a finished issue no longer needs: superseded page-art versions (the version the site uses and the registered selection stay), the generation evidence of those versions, retained rejected candidates, and the issue\'s reader and browser verification screenshots and contact sheets. Anything a wiki page names is left alone.',
  reportOnly: false,
  params: [],

  async targets(ctx) {
    const art = await readSiteArt(ctx);
    return [...art.issues].sort().map((id) => ({ id, label: id }));
  },

  async plan(id, ctx) {
    const art = await readSiteArt(ctx);
    const manifest = await loadImageManifest(ctx);
    const skipped: SkippedFile[] = [];
    const candidates: Candidate[] = [];

    // Versions to keep per page: the registered selection (comics collection; older catalogs filed comic pages under scenes) plus what the site's story names.
    const keep = new Map<string, Set<number>>();
    const keepPaths = new Set<string>();
    const add = (key: string, v: number): void => {
      keep.set(key, (keep.get(key) ?? new Set<number>()).add(v));
    };
    for (const [key, versions] of art.byIssue.get(id) ?? []) for (const v of versions) add(key, v);
    for (const r of manifest.records) {
      if ((r.collection !== 'comics' && r.collection !== 'scenes') || r.sceneKind !== 'Comic page') continue;
      for (const t of Object.values(r.treatments ?? {})) {
        if (!t.path?.startsWith(PAGES)) continue;
        const name = t.path.slice(t.path.lastIndexOf('/') + 1);
        if (!name.startsWith(`${id}-`)) continue;
        const p = parseVersioned(name);
        if (!p) continue;
        add(pageKey(p.stem), p.version);
        keepPaths.add(`${IMAGE_LIB}/${t.path}`);
      }
    }

    // (1) superseded page-art versions, (2) the generation evidence of those versions
    for (const f of manifest.files) {
      const rel = f.destination;
      if (rel.startsWith(PAGES) && !rel.slice(PAGES.length).includes('/')) {
        const name = rel.slice(PAGES.length);
        if (!name.startsWith(`${id}-`)) continue;
        const p = parseVersioned(name);
        const kept = p && keep.get(pageKey(p.stem));
        if (!p || !kept || kept.size === 0 || kept.has(p.version)) continue;
        candidates.push({
          path: `${IMAGE_LIB}/${rel}`,
          reason: `superseded page art: v${p.version}; kept v${[...kept].sort((a, b) => a - b).join(', v')}`,
          sha256: f.sha256 ?? '',
        });
        continue;
      }
      const m = /^records\/comic-b-([^/]+)\/comic-ink\/v(\d+)\//.exec(rel);
      if (m && (m[1] as string).startsWith(`${id}-`)) {
        const kept = keep.get(pageKey(m[1] as string));
        const version = Number(m[2]);
        if (kept && kept.size > 0 && !kept.has(version)) {
          candidates.push({ path: `${IMAGE_LIB}/${rel}`, reason: `generation evidence of superseded v${version}`, sha256: f.sha256 ?? '' });
        }
      }
    }

    // (3) retained rejected candidates for this issue (never user-approved, never the kept art)
    for (const r of manifest.records) {
      const rejected = /reject/i.test(r.status ?? '') || Boolean(r.rejectionReason) || Object.values(r.treatments ?? {}).some((t) => /reject/i.test(t.status ?? ''));
      if (!rejected || r.userApproved || !new RegExp(`^(earlier-)?comic-b-${id}-`).test(r.id)) continue;
      for (const t of Object.values(r.treatments ?? {})) {
        if (!t.path || !t.path.startsWith('assets/') || keepPaths.has(`${IMAGE_LIB}/${t.path}`) || t.userApproved) continue;
        candidates.push({
          path: `${IMAGE_LIB}/${t.path}`,
          reason: `rejected candidate${r.rejectionReason ? `: ${r.rejectionReason}` : ''}`,
          sha256: t.sha256 ?? '',
        });
      }
    }

    // (4) reader / browser verification screenshots and contact sheets for this issue
    for (const f of manifest.files) {
      const rel = f.destination;
      if (!rel.startsWith(EVIDENCE) || !MEDIA_EXT.test(rel)) continue;
      const name = rel.slice(rel.lastIndexOf('/') + 1);
      const contact = rel.startsWith(`${EVIDENCE}contact-sheets/`) && name.includes(id);
      if (name.startsWith(`${id}-`) || contact) {
        candidates.push({
          path: `${IMAGE_LIB}/${rel}`,
          reason: contact ? 'contact sheet for this issue' : 'reader / browser verification screenshot for this issue',
          sha256: f.sha256 ?? '',
        });
      }
    }

    const kept = candidates.filter((c) => !keepPaths.has(c.path));
    const unreferenced = await dropReferenced(ctx, kept, skipped);
    return buildEntries(ctx, unreferenced, skipped);
  },
};
