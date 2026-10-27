// New. Content-addressed thumbnail cache (the old library loaded full-size originals). Registered files are immutable,
// so <sha256>-<w>.webp never goes stale. Writes only under apps/mtw/.state/thumbs; never touches wiki/.
import { createRequire } from 'node:module';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface Sharp {
  (input: string, options?: Record<string, unknown>): {
    rotate(): ReturnType<Sharp>;
    resize(options: Record<string, unknown>): ReturnType<Sharp>;
    webp(options: Record<string, unknown>): ReturnType<Sharp>;
    toFile(file: string): Promise<unknown>;
  };
  concurrency(n: number): number;
}

let sharpPromise: Promise<Sharp> | undefined;

/**
 * Temporary bridge: `sharp` is not yet an apps/mtw dependency, so fall back to site/node_modules.
 * Remove the bridge once `sharp` is added to apps/mtw/package.json (reported in the packet notes).
 */
export function loadSharp(repoRoot: string): Promise<Sharp> {
  sharpPromise ??= (async () => {
    const bases = [
      fileURLToPath(new URL('../../../package.json', import.meta.url)), // apps/mtw (once sharp is a dependency)
      path.join(repoRoot, 'site', 'package.json'),
      fileURLToPath(new URL('../../../../../site/package.json', import.meta.url)), // the real site/, when repoRoot is a test copy
    ];
    let last: unknown;
    for (const base of bases) {
      try {
        const s = createRequire(base)('sharp') as Sharp;
        s.concurrency(2);
        return s;
      } catch (error) {
        last = error;
      }
    }
    throw new Error(`sharp is not installed: ${(last as Error).message}`);
  })();
  return sharpPromise;
}

export const THUMB_WIDTHS = [320, 640] as const;
export const normalizeWidth = (w: number): 320 | 640 => (w >= 640 ? 640 : 320);

/** Small FIFO limiter: two thumbnails render at once so a first page of a 1,000-file library cannot starve the server. */
class Limiter {
  private active = 0;
  private waiting: (() => void)[] = [];
  constructor(private max: number) {}
  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active >= this.max) await new Promise<void>((resolve) => this.waiting.push(resolve));
    this.active++;
    try {
      return await fn();
    } finally {
      this.active--;
      this.waiting.shift()?.();
    }
  }
}

export class Thumbs {
  private limiter = new Limiter(2);
  private inflight = new Map<string, Promise<string>>();

  constructor(private repoRoot: string, readonly dir: string) {}

  cacheFile(sha: string, width: number): string {
    if (!/^[0-9a-f]{64}$/.test(sha)) throw new Error('invalid sha256');
    return path.join(this.dir, `${sha}-${normalizeWidth(width)}.webp`);
  }

  /** Absolute path of the thumbnail, generating it once. */
  async get(sha: string, source: string, width: number): Promise<string> {
    const out = this.cacheFile(sha, width);
    try {
      await fs.access(out);
      return out;
    } catch {
      /* generate below */
    }
    const pending = this.inflight.get(out);
    if (pending) return pending;
    const job = this.limiter
      .run(async () => {
        const sharp = await loadSharp(this.repoRoot);
        await fs.mkdir(this.dir, { recursive: true });
        const tmp = `${out}.${process.pid}.${Math.random().toString(36).slice(2, 8)}.tmp`;
        try {
          await sharp(source, { limitInputPixels: 268_435_456 })
            .rotate()
            .resize({ width: normalizeWidth(width), withoutEnlargement: true })
            .webp({ quality: 72 })
            .toFile(tmp);
          await fs.rename(tmp, out);
        } catch (error) {
          await fs.rm(tmp, { force: true });
          throw error;
        }
        return out;
      })
      .finally(() => this.inflight.delete(out));
    this.inflight.set(out, job);
    return job;
  }
}
