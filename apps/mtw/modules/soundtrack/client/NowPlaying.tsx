// Migrated from retired git 51eb6e03:wiki/soundtrack-library/index.html (the footer player). Always present so a song can be paused or stopped from anywhere in the list.
import { IconButton } from '../../../web/ui';
import { fmtTime } from './profile';
import { length, loaded, playError, playing, position, seek, stop, toggle } from './player';

export function NowPlaying() {
  const item = loaded.value;
  const dur = length.value;
  const pos = position.value;
  const state = !item ? '' : playing.value ? 'playing' : pos > 0 ? 'paused' : 'stopped';
  return (
    <section class="snd-now" aria-label="Now playing">
      <IconButton label={playing.value ? 'Pause' : 'Play'} glyph={playing.value ? 'pause' : 'play'} help={playing.value ? 'Pauses the sound that is playing. You can resume from the same spot.' : 'Plays the sound you last chose in the list. Nothing is changed.'} disabled={!item} onClick={toggle} />
      <IconButton label="Stop" glyph="stop" help="Stops the sound and returns to the start. Nothing is changed in the library." disabled={!item} onClick={stop} />
      <div class="snd-now-title" aria-live="polite">
        <b>{item ? item.title : 'Nothing playing'}</b>
        <span>{playError.value || (item ? `${item.subtitle}${state ? ` · ${state}` : ''}` : 'Choose a track to listen')}</span>
      </div>
      <input
        class="snd-now-seek"
        type="range"
        min={0}
        max={1000}
        value={dur ? Math.round((pos / dur) * 1000) : 0}
        disabled={!item || !dur}
        aria-label="Position in the track"
        onInput={(e) => {
          if (dur) seek(((e.target as HTMLInputElement).valueAsNumber / 1000) * dur);
        }}
      />
      <span class="snd-now-time">
        {fmtTime(pos)} / {fmtTime(dur)}
      </span>
    </section>
  );
}
