import { useLayoutEffect } from 'preact/hooks';
import type { RefObject } from 'preact';

/**
 * Sizes a sticky side panel to the window's visible height below its top edge, so it fills the space down to the bottom
 * gap whether the page is at the top (the panel sits lower) or scrolled (it sticks below the header). Narrow layouts,
 * where the panel is not sticky, keep their own height. `always` fills for any element, sticky or not (a terminal that
 * is its page's last block); `off` leaves the height alone.
 */
export function useFillHeight(ref: RefObject<HTMLElement>, gap = 12, mode: 'sticky' | 'always' | 'off' = 'sticky'): void {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || mode === 'off') return;
    let frame = 0;
    const fit = (): void => {
      frame = 0;
      if (mode === 'sticky' && getComputedStyle(el).position !== 'sticky') {
        el.style.height = '';
        return;
      }
      el.style.height = `${Math.max(240, window.innerHeight - Math.max(0, el.getBoundingClientRect().top) - gap)}px`;
    };
    const queue = (): void => {
      if (!frame) frame = requestAnimationFrame(fit);
    };
    fit();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
      el.style.height = '';
    };
  });
}
