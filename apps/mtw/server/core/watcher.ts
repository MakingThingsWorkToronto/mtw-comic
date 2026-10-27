import { existsSync, readFileSync, statSync, watch } from 'node:fs';
import type { FSWatcher } from 'node:fs';
import path from 'node:path';
import type { ModuleMeta } from '../../modules/types';
import type { Events } from './events';
import { globToRegExp } from './leases';
import { sha1 } from './wiki-store';
import type { FileWikiStore } from './wiki-store';

const GLOB_CHARS = /[*?[\]{}]/;

/** The deepest literal directory of a manifest path (`wiki/a/b/*.json` -> `wiki/a/b`). */
export function watchRootOf(manifestPath: string): string {
  const parts = manifestPath.replace(/\\/g, '/').split('/');
  const literal: string[] = [];
  for (const part of parts) {
    if (GLOB_CHARS.test(part)) break;
    literal.push(part);
  }
  return literal.join('/');
}

/**
 * Watches ONLY the canonical paths each module's manifest names, debounces 250 ms, ignores writes
 * this app just made (same content hash as the store recorded), and emits
 * `wiki-changed {module, paths}` on the event bus.
 */
export class ManifestWatcher {
  private watchers: FSWatcher[] = [];
  private pending = new Map<string, Set<string>>();
  private timer: NodeJS.Timeout | null = null;
  private firstQueuedAt = 0;
  private watched = new Set<string>();
  private rescanTimer: NodeJS.Timeout | null = null;
  private modules: ModuleMeta[] = [];

  constructor(private repoRoot: string, private store: FileWikiStore, private events: Events, private debounceMs = 250) {}

  /** Watches every registered module's manifest. Roots that do not exist yet are retried every 30 s. */
  start(modules: ModuleMeta[]): void {
    this.modules = modules;
    this.attach();
    this.rescanTimer = setInterval(() => this.attach(), 30_000);
    this.rescanTimer.unref();
  }

  private attach(): void {
    for (const meta of this.modules) {
      for (const pattern of meta.manifest) {
        const root = watchRootOf(pattern);
        const abs = path.join(this.repoRoot, root);
        const id = `${meta.id}|${pattern}`;
        if (this.watched.has(id) || !existsSync(abs)) continue;
        this.watched.add(id);
        const matcher = GLOB_CHARS.test(pattern) ? globToRegExp(pattern) : null;
        const isDir = statSync(abs).isDirectory();
        try {
          const w = watch(abs, { recursive: isDir }, (_event, filename) => {
            const rel = (isDir ? path.posix.join(root, String(filename ?? '').replace(/\\/g, '/')) : root).replace(/\/$/, '');
            if (matcher && !matcher.test(rel)) return;
            if (path.basename(rel).startsWith('.') && rel.endsWith('.tmp')) return;
            this.queue(meta.id, rel);
          });
          w.on('error', () => undefined);
          this.watchers.push(w);
        } catch {
          /* a path that cannot be watched is simply not live */
        }
      }
    }
  }

  private queue(moduleId: string, rel: string): void {
    let set = this.pending.get(moduleId);
    if (!set) this.pending.set(moduleId, (set = new Set()));
    set.add(rel);
    const now = Date.now();
    if (!this.firstQueuedAt) this.firstQueuedAt = now;
    if (this.timer) clearTimeout(this.timer);
    // Debounce, but never starve: a steady stream of writes still flushes within 4x the debounce window.
    const wait = Math.max(0, Math.min(this.debounceMs, this.firstQueuedAt + this.debounceMs * 4 - now));
    this.timer = setTimeout(() => this.flush(), wait);
  }

  private flush(): void {
    this.timer = null;
    this.firstQueuedAt = 0;
    for (const [moduleId, paths] of this.pending) {
      const changed = [...paths].filter((rel) => !this.isOwnWrite(rel));
      if (changed.length) this.events.emit('wiki-changed', { module: moduleId, paths: changed });
    }
    this.pending.clear();
  }

  private isOwnWrite(rel: string): boolean {
    const known = this.store.ownWrites.get(rel);
    if (!known) return false;
    try {
      return sha1(readFileSync(path.join(this.repoRoot, rel))) === known;
    } catch {
      return false;
    }
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer);
    if (this.rescanTimer) clearInterval(this.rescanTimer);
    for (const w of this.watchers) w.close();
    this.watchers = [];
    this.watched.clear();
  }
}
