// Animation helpers for the detail visuals. Migrated from the tick() loop in retired git 51eb6e03:wiki/soundtrack-library/index.html.
import { useEffect, useRef, useState } from 'preact/hooks';
import { audioEl } from './player';

export function useReducedMotion(): boolean {
  const query = () => (typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null);
  const [reduced, setReduced] = useState(() => query()?.matches ?? false);
  useEffect(() => {
    const m = query();
    if (!m) return;
    const on = () => setReduced(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return reduced;
}

/**
 * Calls `cb` every animation frame, or, with reduced motion, only when the audio reports a new time (about four times a
 * second) so nothing animates between updates.
 */
export function useFrame(cb: () => void, reduced: boolean): void {
  const latest = useRef(cb);
  latest.current = cb;
  useEffect(() => {
    if (reduced) {
      const a = audioEl();
      const tick = () => latest.current();
      for (const ev of ['timeupdate', 'seeked', 'pause', 'play', 'emptied'] as const) a.addEventListener(ev, tick);
      tick();
      return () => {
        for (const ev of ['timeupdate', 'seeked', 'pause', 'play', 'emptied'] as const) a.removeEventListener(ev, tick);
      };
    }
    let raf = 0;
    const loop = () => {
      latest.current();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);
}

export interface Fitted {
  x: CanvasRenderingContext2D;
  w: number;
  h: number;
  /** True when the backing store was resized (the canvas is blank and needs a full redraw). */
  resized: boolean;
}

/** Size the canvas backing store to its CSS box at device pixel ratio (max 2) and return a context in CSS pixels. */
export function fit(c: HTMLCanvasElement): Fitted | null {
  const r = c.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const tw = Math.round(r.width * dpr);
  const th = Math.round(r.height * dpr);
  const resized = c.width !== tw || c.height !== th;
  if (resized) {
    c.width = tw;
    c.height = th;
  }
  const x = c.getContext('2d');
  if (!x) return null;
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { x, w: r.width, h: r.height, resized };
}

export interface Palette {
  teal: string;
  tealLight: string;
  paper: string;
  muted: string;
  surface: string;
  font: string;
}

/** Canvas cannot read CSS variables; resolve the site tokens once per draw. */
export function palette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return {
    teal: v('--teal', '#1a9ba1'),
    tealLight: v('--teal-light', '#5fc4c9'),
    paper: v('--paper', '#f2f2ef'),
    muted: v('--muted', '#b9c3c4'),
    surface: v('--surface', '#0b1419'),
    font: getComputedStyle(document.body).fontFamily,
  };
}
