import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Decision, DecisionLog } from '../../modules/types';
import type { FileWikiStore } from './wiki-store';

/** Append-only human decisions: wiki/<lib>/decisions.jsonl, one JSON object per line. */
export class FileDecisionLog implements DecisionLog {
  constructor(private store: FileWikiStore) {}

  private file(lib: string): { abs: string; rel: string } {
    // A library is a safe relative folder under wiki/, possibly nested ('operations/spend'). No '..', no absolute paths.
    const segments = lib.split('/');
    if (!segments.every((seg) => /^[a-z0-9][a-z0-9._-]*$/i.test(seg) && seg !== '.' && seg !== '..' && !seg.includes('..'))) throw new Error(`invalid library name: ${lib}`);
    const abs = this.store.resolve(`wiki/${lib}/decisions.jsonl`);
    return { abs, rel: this.store.repoRelative(abs) };
  }

  async append(lib: string, input: Omit<Decision, 'id' | 'at'> & { at?: string }): Promise<Decision> {
    const { abs, rel } = this.file(lib);
    const decision: Decision = { ...input, id: randomUUID(), at: input.at ?? new Date().toISOString() };
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.appendFile(abs, `${JSON.stringify(decision)}\n`, 'utf8');
    this.store.noteWrite(rel, await fs.readFile(abs, 'utf8'));
    return decision;
  }

  async list(lib: string, opts: { since?: string; subject?: string } = {}): Promise<Decision[]> {
    const { abs } = this.file(lib);
    let text: string;
    try {
      text = await fs.readFile(abs, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
    const out: Decision[] = [];
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      try {
        const d = JSON.parse(line) as Decision;
        if (opts.since && d.at < opts.since) continue;
        if (opts.subject && d.subject !== opts.subject) continue;
        out.push(d);
      } catch {
        /* skip a torn line rather than fail the whole log */
      }
    }
    return out;
  }
}
