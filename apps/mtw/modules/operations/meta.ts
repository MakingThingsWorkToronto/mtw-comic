import type { ModuleMeta } from '../types';

export const meta: ModuleMeta = {
  id: 'operations',
  title: 'Operations',
  nav: { label: 'Operations', order: 10, group: 'System' },
  manifest: ['wiki/operations/runners.json', 'wiki/operations/prompts/*.md', 'wiki/operations/leases.json'],
};
