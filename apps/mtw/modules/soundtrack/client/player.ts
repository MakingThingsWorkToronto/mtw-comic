// The one audio element the module plays through (list rows, the detail's credit tag, comic audio): one thing plays at a time.
// Migrated from the footer player in retired git 51eb6e03:wiki/soundtrack-library/index.html.
import { signal } from '@preact/signals';

export interface Loaded {
  /** Identity of what is loaded, e.g. `snd:<id>` or `speech:<id>`. */
  key: string;
  src: string;
  title: string;
  subtitle: string;
  /** Known length, shown until the file reports its own. */
  duration?: number;
}

export const loaded = signal<Loaded | null>(null);
export const playing = signal(false);
export const position = signal(0);
export const length = signal(0);
export const metronome = signal(false);
export const playError = signal('');

let el: HTMLAudioElement | null = null;

export function audioEl(): HTMLAudioElement {
  if (el) return el;
  const a = new Audio();
  a.preload = 'none';
  const sync = () => {
    playing.value = !a.paused;
    position.value = a.currentTime || 0;
    length.value = Number.isFinite(a.duration) && a.duration > 0 ? a.duration : (loaded.value?.duration ?? 0);
  };
  for (const ev of ['play', 'pause', 'ended', 'emptied', 'loadedmetadata', 'timeupdate', 'durationchange'] as const) a.addEventListener(ev, sync);
  a.addEventListener('error', () => {
    if (loaded.value) playError.value = `Could not load ${loaded.value.title}. Check that the audio file exists.`;
  });
  return (el = a);
}

export function play(item: Loaded): void {
  const a = audioEl();
  playError.value = '';
  if (loaded.value?.key !== item.key || a.getAttribute('src') !== item.src) {
    a.pause();
    loaded.value = item;
    a.src = item.src;
    a.currentTime = 0;
    position.value = 0;
    length.value = item.duration ?? 0;
  }
  void a.play().catch(() => {
    playing.value = false;
  });
}

/** Load a track without starting it (the detail panel opens on a track and waits for Play). */
export function load(item: Loaded): void {
  if (loaded.value?.key === item.key) return;
  const a = audioEl();
  a.pause();
  playError.value = '';
  loaded.value = item;
  a.src = item.src;
  position.value = 0;
  length.value = item.duration ?? 0;
}

export function toggle(): void {
  const a = audioEl();
  if (!loaded.value) return;
  if (a.paused) void a.play().catch(() => (playing.value = false));
  else a.pause();
}

export function stop(): void {
  if (!el) return;
  el.pause();
  el.currentTime = 0;
  position.value = 0;
}

export function seek(seconds: number): void {
  const a = audioEl();
  if (!loaded.value) return;
  a.currentTime = Math.max(0, seconds);
}

/** Pause and unload (the module is closing). */
export function release(): void {
  if (!el) return;
  el.pause();
  el.removeAttribute('src');
  el.load();
  loaded.value = null;
  playing.value = false;
  position.value = 0;
  length.value = 0;
}
