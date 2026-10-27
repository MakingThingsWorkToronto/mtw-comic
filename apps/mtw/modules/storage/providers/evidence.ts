// Reduction provider: verification / evidence screenshots in the image library that no wiki page names.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { SkippedFile } from '../types';
import { ageDays, buildEntries, dateInPath, dropReferenced, IMAGE_LIB, loadImageManifest, mapLimit, MEDIA_EXT } from './context';
import type { Candidate, ProviderContext, ReductionProvider } from './context';

/** Folders that hold verification evidence. Legacy relocated inputs (records/discussion-relocation-*) are not evidence. */
const EVIDENCE_DIRS = [
  /^records\/(site-glass-|glass-native-|player-|[^/]*-testing-|[^/]*-placement-)[^/]*\//,
  /^assets\/experiments\/comic-b\/(reader-art|browser-shots|style-checks|player-controls|review|shelf-intros)\//,
];
const MIN_BYTES = 50_000;

/** Group id: the first folder that names one evidence run. */
export function groupOf(rel: string): string {
  const parts = rel.split('/');
  return parts[0] === 'records' ? parts.slice(0, 2).join('/') : parts.slice(0, 4).join('/');
}

interface Found {
  path: string;
  group: string;
  bytes: number;
  sha256: string;
  age: number;
  basis: 'path date' | 'file time';
}

async function findEvidence(ctx: ProviderContext): Promise<{ found: Found[]; skipped: SkippedFile[] }> {
  const days = ctx.params.days ?? 30;
  return ctx.memo(`evidence-${days}`, async () => {
    const manifest = await loadImageManifest(ctx);
    // Records the human approved or the site selected are never evidence to clear.
    const protectedPaths = new Set<string>();
    for (const r of manifest.records) {
      const keep = r.userApproved || /^(selected|user-approved)/i.test(r.status ?? '') || /^selected/i.test(r.publicUse ?? '');
      for (const t of Object.values(r.treatments ?? {})) {
        if (t.path && (keep || t.userApproved || /^(selected|user-approved)/i.test(t.status ?? ''))) protectedPaths.add(t.path);
      }
    }
    const skipped: SkippedFile[] = [];
    const candidates = manifest.files.filter(
      (f) => MEDIA_EXT.test(f.destination) && (f.bytes ?? 0) >= MIN_BYTES && EVIDENCE_DIRS.some((re) => re.test(f.destination)) && !protectedPaths.has(f.destination),
    );
    const aged = await mapLimit(candidates, 24, async (f): Promise<Found | null> => {
      const repoPath = `${IMAGE_LIB}/${f.destination}`;
      let date = dateInPath(f.destination);
      let basis: Found['basis'] = 'path date';
      if (!date) {
        try {
          date = (await fs.stat(path.join(ctx.repoRoot, repoPath))).mtime;
          basis = 'file time';
        } catch {
          return null;
        }
      }
      const age = ageDays(date, ctx.now);
      if (age < days) return null;
      return { path: repoPath, group: groupOf(f.destination), bytes: f.bytes ?? 0, sha256: f.sha256 ?? '', age, basis };
    });
    const old = aged.filter((x): x is Found => x !== null);
    const refs = await dropReferenced(ctx, old, skipped);
    return { found: refs, skipped };
  });
}

export const imageEvidence: ReductionProvider = {
  id: 'image-evidence',
  vertical: 'images',
  label: 'Old screenshots',
  category: 'screens',
  describe:
    'Archive verification and evidence screenshots (site-glass, glass-native, player and reader-art runs) older than the day threshold that no maintained wiki page names. Age comes from a date in the path, else the file time. Selected, user-approved and small files stay.',
  reportOnly: false,
  params: [{ name: 'days', label: 'Older than (days)', default: 30 }],

  async targets(ctx) {
    const { found } = await findEvidence(ctx);
    return [...new Set(found.map((f) => f.group))].sort().map((g) => ({ id: g, label: g }));
  },

  async plan(target, ctx) {
    const { found, skipped } = await findEvidence(ctx);
    const days = ctx.params.days ?? 30;
    const mine: Candidate[] = found
      .filter((f) => f.group === target)
      .map((f) => ({ path: f.path, reason: `verification evidence, ${f.age} days old by ${f.basis} (threshold ${days}); no wiki page names it`, sha256: f.sha256 }));
    return buildEntries(ctx, mine, skipped.filter((s) => s.path.includes(`/${target}/`)));
  },
};
