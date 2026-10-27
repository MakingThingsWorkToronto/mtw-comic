import type { ModuleMeta } from '../types';

export const meta: ModuleMeta = {
  id: 'comics',
  title: 'Comics',
  nav: { label: 'Comics', order: 30, group: 'Studio' },
  manifest: [
    'scripts/comics/voice-casting.mjs',
    'wiki/comics-library/voices.json',
    'wiki/comics-library/provider-voices.json',
    'wiki/comics-library/speech-approvals.json',
    'wiki/comics-library/speech.json',
    'wiki/comics-library/sounds.json',
    'wiki/comics-library/characters.json',
    'wiki/comics-library/decisions.jsonl',
    'site/src/data/comic-stories/*.ts',
    'site/public/comic/**',
    // Character reference slots and their registration: a new sheet or a catalog change refreshes the cast pages.
    'wiki/image-library/manifest.json',
    'wiki/image-library/assets/scenes/comic-b/models/**',
    'wiki/image-library/records/comic-b-model-*/**',
  ],
  assetTypes: ['speech', 'voice', 'cast'],
};
