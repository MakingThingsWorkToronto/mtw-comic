// The module-local reduction provider registry. Add a provider here; the overview, plans and tests pick it up.
import { audioCandidates } from './audio';
import type { ReductionProvider } from './context';
import { comicsPublishedIssue } from './comics';
import { integrationDerivatives } from './derivatives';
import { duplicates } from './duplicates';
import { imageEvidence } from './evidence';
import { lookalikes } from './lookalikes';
import { orphans } from './orphans';
import { oversizedOriginals, replacedOriginals } from './oversized';
import { imageVersions } from './versions';

export const providers: ReductionProvider[] = [
  duplicates,
  lookalikes,
  orphans,
  comicsPublishedIssue,
  imageVersions,
  audioCandidates,
  integrationDerivatives,
  oversizedOriginals,
  replacedOriginals,
  imageEvidence,
];

export function findProvider(id: string): ReductionProvider | undefined {
  return providers.find((p) => p.id === id);
}
