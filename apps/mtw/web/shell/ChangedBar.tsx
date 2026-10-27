import type { LiveResource } from '../state';
import { Button } from '../ui/Button';

/** Compact bar for a view with unsaved edits whose files changed on disk. Render when `live.changed`. */
export function ChangedBar({ live, label = 'Changed on disk.' }: { live: Pick<LiveResource<unknown>, 'changed' | 'reload'>; label?: string }) {
  if (!live.changed) return null;
  return (
    <div class="changed-bar" role="status">
      <span>{label}</span>
      <Button small variant="secondary" help="Loads the newer version of this page from disk. Edits you have not saved on this page are replaced by it." onClick={() => void live.reload()}>
        Reload
      </Button>
    </div>
  );
}
