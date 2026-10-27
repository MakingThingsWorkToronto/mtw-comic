import type { ModuleMeta } from '../types';

export const meta: ModuleMeta = {
  id: 'spend',
  title: 'Spend',
  nav: { label: 'Spend', order: 30, group: 'System' },
  manifest: ['wiki/operations/pricing.json', 'wiki/operations/spend/*', 'wiki/operations/usage/*.json'],
};
