// Migrated from retired git 51eb6e03:wiki/soundtrack-library/index.html (the meters and tile-grid transition preview in tick(), the metronome).
import { useEffect, useRef } from 'preact/hooks';
import { BAND_NAMES } from '../types';
import type { Profile } from '../types';
import { fit, palette, useFrame, useReducedMotion } from './frame';
import { bandsOf, levelsAt } from './profile';
import { audioEl, metronome } from './player';

let ac: AudioContext | null = null;

/** A short click: 1400 Hz on a beat, 2000 Hz on the first beat of a phrase. */
function click(phrase: boolean): void {
  try {
    ac = ac ?? new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.frequency.value = phrase ? 2000 : 1400;
    g.gain.setValueAtTime(0.2, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.05);
    o.connect(g).connect(ac.destination);
    o.start();
    o.stop(ac.currentTime + 0.06);
  } catch {
    /* no audio context available: the metronome is silent */
  }
}

/** The metronome follows the beat grid while the track plays. Mount it once per detail. */
export function useMetronome(profile: Profile | null): void {
  const last = useRef(-1);
  useEffect(() => {
    last.current = -1;
  }, [profile]);
  // The click is audio, not motion, so it runs on animation frames even with reduced motion.
  useFrame(() => {
    const a = audioEl();
    if (!profile || !metronome.value || a.paused) return;
    const bm = profile.beatMap;
    const bi = Math.floor((a.currentTime - bm.offset) / bm.beatSeconds);
    if (bi !== last.current && bi >= 0) {
      last.current = bi;
      click(bm.phrases.indexOf(bi) > -1);
    }
  }, false);
}

export function LiveBands({ profile }: { profile: Profile | null }) {
  const meters = useRef<HTMLCanvasElement>(null);
  const tiles = useRef<HTMLCanvasElement>(null);
  const seed = useRef<number[]>([]);
  const reduced = useReducedMotion();

  useFrame(() => {
    const a = audioEl();
    const u = bandsOf(profile);
    if (!profile || !u) return;
    const t = a.currentTime;
    const lv = levelsAt(u, profile, t, a.paused && t === 0);
    const pal = palette();
    const m = meters.current ? fit(meters.current) : null;
    if (m) {
      const { x, w, h } = m;
      const bw = w / 8;
      x.clearRect(0, 0, w, h);
      lv.forEach((v, i) => {
        x.fillStyle = i < 2 ? pal.tealLight : i < 5 ? pal.teal : pal.paper;
        x.fillRect(i * bw + 6, h - 18 - v * (h - 30), bw - 12, v * (h - 30));
        x.fillStyle = pal.muted;
        x.font = `10px ${pal.font}`;
        x.fillText(BAND_NAMES[i] ?? '', i * bw + 6, h - 4);
      });
    }
    const tc = tiles.current ? fit(tiles.current) : null;
    if (tc) {
      const { x, w, h } = tc;
      const pitch = 16;
      const cols = Math.ceil(w / pitch);
      const rows = Math.ceil(h / pitch);
      x.clearRect(0, 0, w, h);
      if (!seed.current.length) for (let i = 0; i < 4000; i++) seed.current.push(Math.random());
      const bass = ((lv[0] as number) + (lv[1] as number)) / 2;
      const mid = ((lv[2] as number) + (lv[3] as number) + (lv[4] as number)) / 3;
      const high = ((lv[5] as number) + (lv[6] as number) + (lv[7] as number)) / 3;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const hash = seed.current[(r * cols + c) % seed.current.length] as number;
          let alpha = 0;
          let col = '26,155,161';
          if (hash < 0.27) alpha = 0.08 + mid * 0.35;
          if (hash > 0.97) {
            alpha = high * high * 0.95;
            col = '242,242,239';
          }
          const fromBottom = 1 - r / rows;
          if (fromBottom < bass * 0.8 && hash < 0.6) {
            alpha = Math.max(alpha, 0.2 + bass * 0.5);
            col = '95,196,201';
          }
          if (alpha < 0.02) continue;
          x.fillStyle = `rgba(${col},${alpha.toFixed(3)})`;
          x.fillRect(c * pitch + 2, r * pitch + 2, pitch - 4, pitch - 4);
        }
      }
      // The square flashes on each beat; with reduced motion it stays dim.
      const bm = profile.beatMap;
      const beatF = (t - bm.offset) / bm.beatSeconds;
      const pulse = reduced ? 0.15 : Math.pow(Math.max(0, 1 - (beatF - Math.floor(beatF))), 3);
      x.fillStyle = `rgba(95,196,201,${(pulse * 0.9).toFixed(3)})`;
      x.fillRect(w - 34, 10, 24, 24);
    }
  }, reduced);

  return (
    <div class="snd-live">
      <canvas ref={meters} class="snd-canvas snd-canvas--meters" role="img" aria-label="Level of each of the eight frequency bands at the current moment" />
      <canvas ref={tiles} class="snd-canvas snd-canvas--tiles" role="img" aria-label="Tile grid driven by the bands, as a page transition would draw it" />
    </div>
  );
}
