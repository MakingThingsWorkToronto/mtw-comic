import type { ModuleMeta } from '../types';

export const meta: ModuleMeta = {
  id: 'journal',
  title: 'Journal',
  nav: { label: 'Journal', order: 40, group: 'Studio' },
  manifest: [
    'wiki/journal/queue.md',
    'wiki/journal/entries/**',
    'wiki/journal/answers-index.md',
    'wiki/journal/interviews/*.md',
    'wiki/journal/records/*.md',
    'wiki/journal/framing.md',
    'wiki/journal/ingestion.md',
    'wiki/journal/console/prompt-templates.json',
    'wiki/journal/decisions.jsonl',
    'wiki/journal/candidates/*.md',
    'wiki/journal/candidates.json',
  ],
};
