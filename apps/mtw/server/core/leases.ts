import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { LeaseChecker } from '../../modules/types';

interface Lease {
  path: string; // repo-relative glob: * within a segment, ** across segments
  holder: string;
  until?: string; // ISO time; expired leases are ignored
}

export function globToRegExp(glob: string): RegExp {
  const g = glob.replace(/\\/g, '/').replace(/^\/+/, '');
  let re = '';
  for (let i = 0; i < g.length; i++) {
    const c = g[i] as string;
    if (c === '*') {
      if (g[i + 1] === '*') {
        re += '.*';
        i++;
        if (g[i + 1] === '/') i++;
      } else re += '[^/]*';
    } else re += c.replace(/[.+^${}()|[\]\\?]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}

/**
 * Reads the optional wiki/operations/leases.json ([{ "path": "<glob>", "holder": "<session>", "until": "<ISO>" }]).
 * With no file there are no leases and holder() returns null. The file is re-read on each check so
 * a lease added by another session takes effect without a restart.
 */
export class FileLeases implements LeaseChecker {
  private file: string;
  constructor(repoRoot: string, private now: () => Date = () => new Date()) {
    this.file = path.join(repoRoot, 'wiki', 'operations', 'leases.json');
  }

  holder(repoPath: string): string | null {
    if (!existsSync(this.file)) return null;
    let leases: Lease[];
    try {
      leases = JSON.parse(readFileSync(this.file, 'utf8')) as Lease[];
    } catch {
      return null;
    }
    const target = repoPath.replace(/\\/g, '/');
    for (const lease of leases) {
      if (lease.until && new Date(lease.until) < this.now()) continue;
      if (globToRegExp(lease.path).test(target)) return lease.holder;
    }
    return null;
  }
}
