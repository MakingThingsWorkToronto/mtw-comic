import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { LeaseChecker, WikiStore } from '../../modules/types';

export const sha1 = (text: string | Buffer): string => createHash('sha1').update(text).digest('hex');

/**
 * Reads and writes files under <repo>/wiki only. Writes are atomic (temp file in the same folder +
 * rename) and recorded by content hash so the watcher can ignore the app's own writes.
 */
export class FileWikiStore implements WikiStore {
  readonly wikiRoot: string;
  /** repo-relative path -> content hash of the last write made through this store */
  readonly ownWrites = new Map<string, string>();

  constructor(readonly repoRoot: string, private leases?: LeaseChecker) {
    this.wikiRoot = path.join(repoRoot, 'wiki');
  }

  /** Resolve a repo-relative (or wiki-relative) path to an absolute path inside wiki/, or throw. */
  resolve(rel: string): string {
    const norm = rel.replace(/\\/g, '/');
    if (norm.startsWith('/') || /^[A-Za-z]:/.test(norm)) throw new Error(`path escapes wiki/: ${rel}`);
    const abs = path.resolve(this.repoRoot, norm === 'wiki' || norm.startsWith('wiki/') ? norm : `wiki/${norm}`);
    const inside = path.relative(this.wikiRoot, abs);
    if (inside === '' || inside.startsWith('..') || path.isAbsolute(inside)) throw new Error(`path escapes wiki/: ${rel}`);
    return abs;
  }

  repoRelative(abs: string): string {
    return path.relative(this.repoRoot, abs).replace(/\\/g, '/');
  }

  async readText(rel: string): Promise<string> {
    return fs.readFile(this.resolve(rel), 'utf8');
  }

  async readJson<T = unknown>(rel: string): Promise<T> {
    return JSON.parse(await this.readText(rel)) as T;
  }

  async exists(rel: string): Promise<boolean> {
    try {
      await fs.access(this.resolve(rel));
      return true;
    } catch {
      return false;
    }
  }

  async writeText(rel: string, text: string): Promise<void> {
    const abs = this.resolve(rel);
    const repoRel = this.repoRelative(abs);
    const holder = this.leases?.holder(repoRel);
    if (holder) throw new Error(`${repoRel} is leased to ${holder}`);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    const tmp = path.join(path.dirname(abs), `.${path.basename(abs)}.${randomUUID().slice(0, 8)}.tmp`);
    try {
      await fs.writeFile(tmp, text, 'utf8');
      this.ownWrites.set(repoRel, sha1(text));
      await fs.rename(tmp, abs);
    } catch (error) {
      await fs.rm(tmp, { force: true });
      throw error;
    }
  }

  async writeJson(rel: string, value: unknown): Promise<void> {
    await this.writeText(rel, `${JSON.stringify(value, null, 2)}\n`);
  }

  /** Record a write made some other way (e.g. a decisions append) so the watcher ignores it. */
  noteWrite(repoRel: string, text: string): void {
    this.ownWrites.set(repoRel, sha1(text));
  }

  runProducer(command: string, args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { cwd: this.repoRoot, shell: false, windowsHide: true });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (d) => (stdout += d));
      child.stderr.on('data', (d) => (stderr += d));
      child.on('error', reject);
      child.on('close', (code) => resolve({ code: code ?? 1, stdout, stderr }));
    });
  }
}
