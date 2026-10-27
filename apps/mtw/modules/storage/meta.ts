import type { ModuleMeta } from '../types';

export const meta: ModuleMeta = {
  id: 'storage',
  title: 'Storage',
  nav: { label: 'Storage', order: 40, group: 'System' },
  manifest: [
    'wiki/operations/storage/config.json',
    'wiki/operations/storage/plans/*.json',
    'wiki/operations/storage/decisions.jsonl',
    'wiki/operations/prompts/storage-*.md',
  ],
};
