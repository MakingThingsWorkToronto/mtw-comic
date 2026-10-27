// Migrated from retired git 51eb6e03:wiki/soundtrack-library/index.html (drawLane, the lane click-to-seek, the playhead).
import { useEffect, useRef } from 'preact/hooks';
import { BAND_NAMES } from '../types';
import type { Profile, Track } from '../types';
import { fit, palette, useFrame, useReducedMotion } from './frame';
import { bandsOf, laneColor, laneFrame } from './profile';
import { audioEl, position, seek, toggle } from './player';

const LEGEND: { label: string; hint: string; cls: string }[] = [
  { label: 'Beat', hint: 'Every beat of the grid (white tick)', cls: 'beat' },
  { label: 'Phrase', hint: 'First beat of each phrase (tall white tick)', cls: 'phrase' },
  { label: 'Accent', hint: 'Beats where the hits land (teal tick)', cls: 'accent' },
  { label: 'Dead stop', hint: 'Beats of silence the page can freeze on (dark block)', cls: 'stop' },
  { label: 'Kick', hint: 'Detected kick drum onsets (white dot, bottom row)', cls: 'kick' },
  { label: 'Snare', hint: 'Detected snare onsets (light teal dot, middle row)', cls: 'snare' },
  { label: 'Hat', hint: 'Detected hi-hat onsets (teal dot, top row)', cls: 'hat' },
];

export function LaneLegend() {
  return (
    <ul class="snd-legend" aria-label="Lane legend">
      {LEGEND.map((l) => (
        <li key={l.cls} title={l.hint}>
          <span class={`swatch swatch--${l.cls}`} aria-hidden="true" />
          {l.label}
        </li>
      ))}
    </ul>
  );
}

/** Draw the static lane: eight bands (low at the bottom, each scaled to its own range), beat/phrase/accent ticks, stops, onset dots. */
export function drawLane(c: HTMLCanvasElement, profile: Profile | null): void {
  const f = fit(c);
  if (!f) return;
  const { x, w, h } = f;
  const pal = palette();
  x.clearRect(0, 0, w, h);
  if (!profile) return;
  const u = bandsOf(profile) as Uint8Array;
  const F = profile.frequency;
  const nf = F.frames;
  const nb = F.bands.length;
  const bm = profile.beatMap;
  const dur = bm.duration;
  const top = 18;
  const bh = (h - top - 22) / nb;
  for (let b = 0; b < nb; b++) {
    for (let px = 0; px < w; px++) {
      const v = (u[b * nf + laneFrame(px, w, nf)] as number) / 255;
      x.fillStyle = laneColor(v);
      x.fillRect(px, top + (nb - 1 - b) * bh, 1, bh - 1);
    }
  }
  x.fillStyle = pal.muted;
  x.font = `10px ${pal.font}`;
  for (let b = 0; b < nb; b++) x.fillText(BAND_NAMES[b] ?? '', 4, top + (nb - 1 - b) * bh + 11);
  const tx = (t: number) => (t / dur) * w;
  for (let k = 0; k <= bm.endBeat; k++) {
    const t = bm.offset + k * bm.beatSeconds;
    const phrase = bm.phrases.indexOf(k) > -1;
    x.fillStyle = phrase ? '#f2f2efcc' : '#f2f2ef33';
    x.fillRect(Math.round(tx(t)), 0, 1, phrase ? 14 : 6);
  }
  for (const k of bm.hits) {
    x.fillStyle = pal.tealLight;
    x.fillRect(Math.round(tx(bm.offset + k * bm.beatSeconds)) - 1, 0, 3, 16);
  }
  for (const k of bm.stops) {
    x.fillStyle = '#000000b0';
    x.fillRect(tx(bm.offset + k * bm.beatSeconds), top, tx(bm.beatSeconds), h - top - 22);
  }
  const rows: [keyof Profile['onsets'], number, string][] = [
    ['kicks', 0, pal.paper],
    ['snares', 7, pal.tealLight],
    ['hats', 14, pal.teal],
  ];
  for (const [name, dy, color] of rows) {
    x.fillStyle = color;
    for (const t of profile.onsets[name]) x.fillRect(Math.round(tx(t)), h - 20 + dy * 0.9, 1, 5);
  }
}

export function FrequencyLane({ track, profile }: { track: Track; profile: Profile | null }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const duration = profile?.beatMap.duration ?? track.beatMap?.duration ?? 0;

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const redraw = () => drawLane(c, profile);
    redraw();
    const ro = new ResizeObserver(redraw);
    ro.observe(c);
    return () => ro.disconnect();
  }, [profile]);

  useFrame(() => {
    const el = head.current;
    if (!el || !duration) return;
    el.style.left = `${Math.min(100, (audioEl().currentTime / duration) * 100)}%`;
  }, reduced);

  const seekTo = (fraction: number) => {
    if (!duration) return;
    seek(Math.max(0, Math.min(1, fraction)) * duration);
    if (audioEl().paused) toggle();
  };

  return (
    <div class="snd-lane">
      <canvas
        ref={canvas}
        class="snd-canvas snd-canvas--lane"
        role="slider"
        tabIndex={0}
        aria-label="Frequency lane: click to seek"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(position.value)}
        onClick={(e) => {
          const r = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
          seekTo((e.clientX - r.left) / r.width);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            seek(audioEl().currentTime + 5);
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            seek(audioEl().currentTime - 5);
          }
        }}
      />
      <div ref={head} class="snd-playhead" aria-hidden="true" />
    </div>
  );
}
