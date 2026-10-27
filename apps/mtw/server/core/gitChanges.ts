// Home "Health": uncommitted changes grouped by area and by likely owner. `git status` is slow on this repo, so the
// dashboard runs it in the background at most once a minute (server/core/dashboard.ts) and never inside a request.
import { execFile } from 'node:child_process';
import path from 'node:path';
import { globToRegExp } from './leases';
import type { LeaseRow, StatusClaim } from './statusBoard';

export interface ChangedFile {
  /** Two-letter porcelain code ("??", " M", "D ", ...). */
  code: string;
  path: string;
}
export interface OwnerGroup {
  owner: string;
  /** How the owner was found: an active lease, a STATUS.md entry that names the folder, or nothing. */
  via: 'lease' | 'status' | 'none';
  files: number;
  areas: string[];
  /** For lease owners: the lease path and whether its review time has passed. */
  lease?: { path: string; overdue: boolean; reviewByUtc?: string };
}
export interface GitChanges {
  total: number;
  byArea: { area: string; files: number }[];
  byOwner: OwnerGroup[];
}

/** NUL-separated `git status --porcelain -z` -> entries (rename sources skipped). */
export function parsePorcelain(z: string): ChangedFile[] {
  const out: ChangedFile[] = [];
  const parts = z.split('\0');
  for (let i = 0; i < parts.length; i++) {
    const e = parts[i] as string;
    if (e.length < 4) continue;
    const code = e.slice(0, 2);
    if (code[0] === 'R' || code[0] === 'C') i++;
    out.push({ code, path: e.slice(3) });
  }
  return out;
}

/** Top-level area: two segments for the big roots (wiki/image-library, apps/mtw, .claude/skills), else one. */
export function areaOf(p: string): string {
  const seg = p.split('/');
  if (seg.length > 2 && ['wiki', 'apps', '.claude', '.codex', 'scripts', 'site'].includes(seg[0] as string)) return `${seg[0]}/${seg[1]}`;
  return seg.length > 1 ? (seg[0] as string) : '(root files)';
}

/**
 * Pure: group changed files by area and likely owner. Owner order: an unexpired lease whose glob matches; else the
 * newest STATUS.md entry still in force (not released, not "No files claimed") that names the file's folder (a
 * path prefix, or a distinctive folder name of 12+ characters); else "unclaimed". "Likely": STATUS.md is prose.
 */
export function groupChanges(files: ChangedFile[], leases: LeaseRow[], claims: StatusClaim[]): GitChanges {
  const live = leases.filter((l) => !l.expired).map((l) => ({ l, re: globToRegExp(l.path) }));
  const active = claims.filter((c) => c.state !== 'released' && !c.noFiles);
  const dirOwner = new Map<string, string | null>();
  const ownerOfDir = (dir: string): string | null => {
    if (dirOwner.has(dir)) return dirOwner.get(dir) ?? null;
    // Longest folder prefix with at least three segments that an entry names, e.g. ".../home-regeneration-20261011".
    const seg = dir.split('/');
    let found: string | null = null;
    // A named file in the same folder, or a named folder/glob that contains this folder.
    const named = active.find((c) => c.paths.some((p) => path.posix.dirname(p) === dir || (/[*/]$/.test(p) && `${dir}/`.startsWith(p.replace(/\*.*$/, '')))));
    if (named) found = named.holder;
    for (let n = seg.length; n >= 3 && !found; n--) {
      const leaf = seg[n - 1] as string;
      const hit = leaf.length >= 12 ? active.find((c) => c.text.includes(leaf)) : undefined;
      if (hit) found = hit.holder;
    }
    dirOwner.set(dir, found);
    return found;
  };
  const areas = new Map<string, number>();
  const owners = new Map<string, OwnerGroup>();
  for (const f of files) {
    const area = areaOf(f.path);
    areas.set(area, (areas.get(area) ?? 0) + 1);
    const lease = live.find((x) => x.re.test(f.path));
    let key: string;
    let group: OwnerGroup;
    if (lease) {
      key = `lease:${lease.l.holder}:${lease.l.path}`;
      group = owners.get(key) ?? { owner: lease.l.holder, via: 'lease', files: 0, areas: [], lease: { path: lease.l.path, overdue: lease.l.overdue, ...(lease.l.reviewByUtc ? { reviewByUtc: lease.l.reviewByUtc } : {}) } };
    } else {
      const holder = ownerOfDir(path.posix.dirname(f.path));
      key = holder ? `status:${holder}` : 'none';
      group = owners.get(key) ?? { owner: holder ?? 'unclaimed', via: holder ? 'status' : 'none', files: 0, areas: [] };
    }
    group.files++;
    if (!group.areas.includes(area)) group.areas.push(area);
    owners.set(key, group);
  }
  return {
    total: files.length,
    byArea: [...areas].map(([area, n]) => ({ area, files: n })).sort((a, b) => b.files - a.files || a.area.localeCompare(b.area)),
    byOwner: [...owners.values()].sort((a, b) => b.files - a.files),
  };
}

/** Runs `git status --porcelain -z --untracked-files=all` (about half a second here). */
export function gitStatusFiles(repoRoot: string): Promise<ChangedFile[]> {
  return new Promise((resolve, reject) => {
    execFile('git', ['status', '--porcelain', '-z', '--untracked-files=all'], { cwd: repoRoot, maxBuffer: 1 << 26, windowsHide: true, timeout: 30_000 }, (error, stdout) => {
      if (error) reject(error);
      else resolve(parsePorcelain(String(stdout)));
    });
  });
}
