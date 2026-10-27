// sha256 cache keyed by (path, size, mtime) in .state/storage/hashes.json, so rescans only hash new or changed files.
import { createHash } from 'node:crypto';
import { createReadStream, promises as fs } from 'node:fs';
import path from 'node:path';

interface Entry {
  size: number;
  mtimeMs: number;
  sha256: string;
}

export interface HashTarget {
  /** Repo-relative path, forward slashes. */
  rel: string;
  abs: string;
  size: number;
  mtimeMs: number;
}

export interface HashProgress {
  running: boolean;
  done: number;
  total: number;
}

export function sha256File(abs: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const h = createHash('sha256');
    createReadStream(abs)
      .on('data', (d) => h.update(d))
      .on('error', reject)
      .on('end', () => resolve(h.digest('hex')));
  });
}

const LIMIT = 6;

export class Hasher {
  private entries = new Map<string, Entry>();
  private loaded: Promise<void> | null = null;
  private dirty = false;
  private job: Promise<void> | null = null;
  progress: HashProgress = { running: false, done: 0, total: 0 };

  constructor(readonly file: string) {}

  private load(): Promise<void> {
    this.loaded ??= (async () => {
      try {
        const raw = JSON.parse(await fs.readFile(this.file, 'utf8')) as { files?: Record<string, Entry> };
        for (const [k, v] of Object.entries(raw.files ?? {})) this.entries.set(k, v);
      } catch {
        /* no cache yet */
      }
    })();
    return this.loaded;
  }

  /** The cached hash when the file is unchanged since it was hashed, else null. Never reads file contents. */
  async cached(t: HashTarget): Promise<string | null> {
    await this.load();
    const e = this.entries.get(t.rel);
    return e && e.size === t.size && e.mtimeMs === t.mtimeMs ? e.sha256 : null;
  }

  /** The hash, computing and caching it when needed. */
  async sha(t: HashTarget): Promise<string> {
    const hit = await this.cached(t);
    if (hit) return hit;
    const sha256 = await sha256File(t.abs);
    this.entries.set(t.rel, { size: t.size, mtimeMs: t.mtimeMs, sha256 });
    this.dirty = true;
    return sha256;
  }

  async flush(): Promise<void> {
    if (!this.dirty) return;
    this.dirty = false;
    const files = Object.fromEntries([...this.entries.entries()].sort((a, b) => a[0].localeCompare(b[0])));
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    await fs.writeFile(this.file, JSON.stringify({ version: 1, files }), 'utf8');
  }

  /** Hash every target not already cached, in the background-friendly way: a few at a time, with progress. */
  ensure(targets: HashTarget[]): Promise<void> {
    if (this.job) return this.job;
    this.job = (async () => {
      try {
        await this.load();
        const todo: HashTarget[] = [];
        for (const t of targets) if (!(await this.cached(t))) todo.push(t);
        this.progress = { running: true, done: 0, total: todo.length };
        let next = 0;
        let sinceFlush = 0;
        const worker = async (): Promise<void> => {
          while (next < todo.length) {
            const t = todo[next++] as HashTarget;
            try {
              await this.sha(t);
            } catch {
              /* a file that vanished mid-scan is simply not hashed */
            }
            this.progress.done++;
            if (++sinceFlush >= 200) {
              sinceFlush = 0;
              await this.flush();
            }
          }
        };
        await Promise.all(Array.from({ length: Math.min(LIMIT, todo.length) }, worker));
        await this.flush();
      } finally {
        this.progress = { ...this.progress, running: false };
        this.job = null;
      }
    })();
    return this.job;
  }
}

const hashers = new Map<string, Hasher>();
export function hasherFor(stateDir: string): Hasher {
  const key = path.resolve(stateDir);
  let h = hashers.get(key);
  if (!h) {
    h = new Hasher(path.join(key, 'hashes.json'));
    hashers.set(key, h);
  }
  return h;
}

export const defaultStateDir = (repoRoot: string): string => path.join(repoRoot, 'apps', 'mtw', '.state', 'storage');
