// Reduction provider: soundtrack candidates that were rejected or never approved. Reads wiki/soundtrack-library/sources.json.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { SkippedFile } from '../types';
import { ageDays, buildEntries, readJsonIf } from './context';
import type { Candidate, ProviderContext, ReductionProvider } from './context';

const LIB = 'wiki/soundtrack-library';

interface Track {
  id: string;
  file: string;
  status?: string;
  approved?: string;
  usedBy?: string[];
  rating?: number;
  title?: string;
  discovery?: { run?: string };
}

export const audioCandidates: ReductionProvider = {
  id: 'audio-candidates',
  vertical: 'audio',
  label: 'Older versions',
  category: 'older',
  describe:
    'Archive music files for tracks that are withdrawn or rejected, or that stayed a candidate past the day threshold with no approval, no use by a page or comic, and no rating of 4 or more. The catalog entry stays; the audio moves to the archive.',
  reportOnly: false,
  params: [{ name: 'days', label: 'Candidate older than (days)', default: 30 }],

  async targets() {
    return [{ id: 'candidates', label: 'Soundtrack candidates' }];
  },

  async plan(target, ctx: ProviderContext) {
    if (target !== 'candidates') throw new Error(`unknown target: ${target}`);
    const days = ctx.params.days ?? 30;
    const sources = await readJsonIf<{ tracks: Track[] }>(path.join(ctx.repoRoot, LIB, 'sources.json'));
    const skipped: SkippedFile[] = [];
    const candidates: Candidate[] = [];
    for (const t of sources?.tracks ?? []) {
      if (!t.file) continue;
      const rel = `${LIB}/assets/${t.file}`;
      if ((t.usedBy?.length ?? 0) > 0) {
        if (t.status !== 'approved') skipped.push({ path: rel, reason: `used by ${t.usedBy?.join(', ')}` });
        continue;
      }
      if (t.status === 'approved' || t.approved) continue;
      if (t.status === 'withdrawn' || t.status === 'rejected') {
        candidates.push({ path: rel, reason: `${t.status} track: ${t.title ?? t.id}` });
        continue;
      }
      if (t.status !== 'candidate') continue;
      if ((t.rating ?? 0) >= 4) {
        skipped.push({ path: rel, reason: `rated ${t.rating}` });
        continue;
      }
      let added: Date | null = null;
      const run = /^(20\d{2}-\d{2}-\d{2})/.exec(t.discovery?.run ?? '');
      if (run) added = new Date(`${run[1]}T00:00:00Z`);
      else {
        try {
          added = (await fs.stat(path.join(ctx.repoRoot, rel))).mtime;
        } catch {
          /* missing file is reported below */
        }
      }
      const age = added ? ageDays(added, ctx.now) : 0;
      if (added && age >= days) candidates.push({ path: rel, reason: `candidate never approved, ${age} days since discovery (threshold ${days}): ${t.title ?? t.id}` });
    }
    return buildEntries(ctx, candidates, skipped);
  },
};
