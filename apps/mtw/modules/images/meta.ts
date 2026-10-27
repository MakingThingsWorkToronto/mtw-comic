// Migrated from the retired image console (git 51eb6e03:wiki/image-library/{index.html,browser.js,library.css}): module identity and canonical paths.
import type { ModuleMeta } from '../types';

export const meta: ModuleMeta = {
  id: 'images',
  title: 'Images',
  nav: { label: 'Images', order: 10, group: 'Studio' },
  manifest: ['wiki/image-library/manifest.json', 'wiki/image-library/decisions.jsonl'],
  assetTypes: ['img'],
};
