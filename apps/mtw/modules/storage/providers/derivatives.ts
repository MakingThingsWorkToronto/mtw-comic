// Reduction provider: regenerable site integration copies (report only; the app never plans their deletion).
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { buildEntries } from './context';
import type { ProviderContext, ReductionProvider } from './context';

const COMIC_PUBLIC = 'site/public/comic';
const SIZED = /-(1600|2400|3200)\.(avif|webp)$/i;

async function issueDirs(ctx: ProviderContext): Promise<string[]> {
  try {
    const entries = await fs.readdir(path.join(ctx.repoRoot, COMIC_PUBLIC), { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
  } catch {
    return [];
  }
}

export const integrationDerivatives: ReductionProvider = {
  id: 'integration-derivatives',
  vertical: 'site',
  label: 'Can be rebuilt',
  category: 'rebuild',
  describe:
    'Report the 1600 pixel avif and webp copies under site/public/comic (copies stop at the master width; any 2400/3200 left are legacy upscales). They are regenerable from the canonical masters, so this is report only: the live site needs them, and no plan can be created from this row.',
  reportOnly: true,
  params: [],

  async targets(ctx) {
    const dirs = await issueDirs(ctx);
    const out: { id: string; label: string }[] = [];
    for (const d of dirs) {
      const names = await fs.readdir(path.join(ctx.repoRoot, COMIC_PUBLIC, d));
      if (names.some((n) => SIZED.test(n))) out.push({ id: d, label: `${COMIC_PUBLIC}/${d}` });
    }
    return out;
  },

  async plan(target, ctx) {
    if (!/^[\w-]+$/.test(target)) throw new Error(`invalid target: ${target}`);
    const names = await fs.readdir(path.join(ctx.repoRoot, COMIC_PUBLIC, target)).catch(() => [] as string[]);
    return buildEntries(
      ctx,
      names
        .filter((n) => SIZED.test(n))
        .map((n) => ({
          path: `${COMIC_PUBLIC}/${target}/${n}`,
          reason: 'regenerable site copy of a canonical page master (rebuilt by the site image pipeline)',
          action: 'delete-derivative' as const,
          regenerable: true,
        })),
    );
  },
};
