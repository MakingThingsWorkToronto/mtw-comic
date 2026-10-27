// Migrated from the retired soundtrack console (git 51eb6e03:wiki/soundtrack-library/index.html) and the retired `soundtrack.mjs serve`.
import type { ModuleMeta } from '../types';

export const meta: ModuleMeta = {
  id: 'soundtrack',
  title: 'Soundtrack',
  nav: { label: 'Soundtrack', order: 20, group: 'Studio' },
  manifest: [
    'wiki/soundtrack-library/sources.json',
    'wiki/soundtrack-library/discovery.json',
    'wiki/soundtrack-library/manifest.json',
    'wiki/soundtrack-library/comic-audio.json',
    'wiki/soundtrack-library/decisions.jsonl',
  ],
  assetTypes: ['snd', 'sfx', 'amb', 'speech'],
};
