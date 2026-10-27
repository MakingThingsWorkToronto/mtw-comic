// Keeps the reader's scroll position when a click re-renders the page: after a pointer or key action inside `root`, any
// scroll jump in the next `holdMs` that the person did not make (no wheel, touch or scroll keys) is put back.
import { useEffect } from 'preact/hooks';
import type { RefObject } from 'preact';

/** The element that actually scrolls `el` (its nearest scrolling ancestor, else the document). */
export function scrollerOf(el: Element | null): HTMLElement {
  for (let n = el?.parentElement ?? null; n; n = n.parentElement) {
    const o = getComputedStyle(n).overflowY;
    if ((o === 'auto' || o === 'scroll') && n.scrollHeight > n.clientHeight) return n;
  }
  return (document.scrollingElement as HTMLElement) ?? document.documentElement;
}

const SCROLL_KEYS = new Set(['PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown', ' ']);

/** `active` re-binds once the root is rendered (pass whether it is on the page). */
export function useScrollHold(root: RefObject<HTMLElement>, active = true, holdMs = 1200): void {
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    let hold: { el: HTMLElement; top: number; until: number } | null = null;
    let raf = 0;
    const watch = () => {
      if (!hold) return;
      if (performance.now() > hold.until) {
        hold = null;
        return;
      }
      if (Math.abs(hold.el.scrollTop - hold.top) > 2) hold.el.scrollTop = hold.top;
      raf = requestAnimationFrame(watch);
    };
    const start = (e: Event) => {
      const t = e.target as HTMLElement | null;
      // Typing in a field or the terminal scrolls on its own terms.
      if (e instanceof KeyboardEvent && (SCROLL_KEYS.has(e.key) && !(t?.tagName === 'BUTTON') || t?.closest('textarea, input, select, .xterm'))) return;
      const el = scrollerOf(node);
      hold = { el, top: el.scrollTop, until: performance.now() + holdMs };
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(watch);
    };
    const release = () => {
      hold = null;
    };
    node.addEventListener('pointerdown', start, true);
    document.addEventListener('keydown', start, true);
    window.addEventListener('wheel', release, { passive: true });
    window.addEventListener('touchmove', release, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      node.removeEventListener('pointerdown', start, true);
      document.removeEventListener('keydown', start, true);
      window.removeEventListener('wheel', release);
      window.removeEventListener('touchmove', release);
    };
  }, [root, active, holdMs]);
}
