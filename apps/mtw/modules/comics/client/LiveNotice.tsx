// Compact, dismissible notice naming which comics files another writer changed. Views refresh themselves from the same event.
import { useState } from 'preact/hooks';
import { useWikiChanged } from '../../../web/state';
import { Button } from '../../../web/ui';
import { describeChange } from './flow';

export function LiveNotice() {
  const [paths, setPaths] = useState<string[] | null>(null);
  useWikiChanged('comics', (change) => setPaths((prev) => [...new Set([...(prev ?? []), ...change.paths])]));
  if (!paths) return null;
  return (
    <p class="notice live-notice" role="status">
      <span>{describeChange(paths)}. Open views have refreshed; unsaved edits were kept.</span>
      <Button small variant="ghost" aria-label="Dismiss this notice" help="Hides this notice. Nothing else changes." onClick={() => setPaths(null)}>
        Dismiss
      </Button>
    </p>
  );
}
