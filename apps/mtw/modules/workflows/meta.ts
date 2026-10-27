import type { ModuleMeta } from '../types';

export const meta: ModuleMeta = {
  id: 'workflows',
  title: 'Workflows',
  nav: { label: 'Workflows', order: 45, group: 'System' },
  manifest: ['wiki/workflows/*.json', 'wiki/workflows/decisions.jsonl'],
};
