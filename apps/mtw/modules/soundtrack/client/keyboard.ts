// Migrated from retired git 51eb6e03:wiki/soundtrack-library/index.html (the Space handler, Enter on a row). Pure so the rules are testable.

/** Elements that use Space (or Enter) themselves: Space must not toggle the player there. */
const OWN_SPACE = new Set(['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'SUMMARY', 'AUDIO', 'VIDEO']);

export interface KeyLike {
  code: string;
  key?: string;
  defaultPrevented?: boolean;
  target: unknown;
}

/** Space toggles play unless the focus is on something that handles Space itself (the legacy console double-fired on buttons and summary). */
export function shouldTogglePlay(e: KeyLike): boolean {
  if (e.code !== 'Space' || e.defaultPrevented) return false;
  const t = e.target as { tagName?: string; isContentEditable?: boolean } | null;
  if (!t) return true;
  if (t.isContentEditable) return false;
  return !OWN_SPACE.has((t.tagName ?? '').toUpperCase());
}

/**
 * Enter (or a click) on a list row: a different track starts playing from its beginning; the track already loaded
 * toggles, so Enter on the current row pauses it rather than restarting it.
 */
export function rowAction(loadedKey: string | null, rowKey: string): 'play' | 'toggle' {
  return loadedKey === rowKey ? 'toggle' : 'play';
}

/** Arrow Up/Down moves between rows; null when the key is not an arrow or there is nowhere to go. */
export function nextRow(index: number, count: number, key: string): number | null {
  if (count === 0) return null;
  if (key === 'ArrowDown') return Math.min(count - 1, index + 1);
  if (key === 'ArrowUp') return Math.max(0, index - 1);
  return null;
}
