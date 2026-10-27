// Protect artwork named by comic authoring documents before removal.
import { promises as fs } from 'node:fs';
import path from 'node:path';

const REF_TOKEN = /(?:\.{0,2}\/)?(?:[\w@+.-]+\/)*[\w@+.-]+\.(?:png|jpe?g|webp|avif|gif|webm|mp4|mov)|(?:assets|records)\/[\w@+.\-/]+\//g;

async function* walkMarkdown(dir: string, skip: (rel: string) => boolean, rel = ''): AsyncGenerator<string> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const childRel = rel ? `${rel}/${e.name}` : e.name;
    if (skip(childRel)) continue;
    if (e.isDirectory()) yield* walkMarkdown(path.join(dir, e.name), skip, childRel);
    else if (e.isFile() && e.name.endsWith('.md')) yield path.join(dir, e.name);
  }
}

export interface ReferenceIndex {
  /** Returns the referring page (repo-relative) when a wiki page names this repo-relative file, else null. */
  referencedBy(repoRel: string): string | null;
}

/**
 * Which files do maintained wiki pages name? Pages inside wiki/image-library describe their own records and are ignored.
 * A page references a file by its path ending, or by bare file name; a folder reference counts only when it is specific
 * (five or more segments) so a passing mention of "assets/scenes" protects nothing.
 */
export async function buildReferenceIndex(repoRoot: string): Promise<ReferenceIndex> {
    const byBase = new Map<string, { token: string; page: string }[]>();
    const dirs: { token: string; page: string }[] = [];
    const wikiDir = path.join(repoRoot, 'wiki');
    const files: string[] = [];
    for await (const f of walkMarkdown(wikiDir, (rel) => rel.startsWith('image-library') || rel.includes('node_modules'))) files.push(f);
    await Promise.all(files.map(async (f) => {
      const text = await fs.readFile(f, 'utf8');
      const page = path.relative(repoRoot, f).replaceAll('\\', '/');
      for (const raw of text.match(REF_TOKEN) ?? []) {
        const token = raw.replace(/^(\.{1,2}\/)+/, '').replace(/^wiki\//, '').replace(/^image-library\//, '');
        if (token.endsWith('/')) {
          if (token.split('/').filter(Boolean).length >= 5) dirs.push({ token, page });
          continue;
        }
        const base = token.slice(token.lastIndexOf('/') + 1).toLowerCase();
        const list = byBase.get(base) ?? [];
        list.push({ token, page });
        byBase.set(base, list);
      }
    }));
    return {
      referencedBy(repoRel: string): string | null {
        const p = repoRel.replace(/^wiki\/(image-library\/)?/, '').toLowerCase();
        const base = p.slice(p.lastIndexOf('/') + 1);
        for (const hit of byBase.get(base) ?? []) {
          if (!hit.token.includes('/') || p.endsWith(hit.token.toLowerCase())) return hit.page;
        }
        for (const d of dirs) if (p.startsWith(d.token.toLowerCase())) return d.page;
        return null;
      },
    };
}
