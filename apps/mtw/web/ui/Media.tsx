import { useEffect, useRef, useState } from 'preact/hooks';
import { IconButton } from './Button';
import { Dialog } from './Dialog';
import { speechPreview, type SpeechPreview } from '../playback/previewAudio';

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Compact player: play/pause, scrub, time. */
export function AudioPlayer({ src, label, profile }: { src: string; label: string; profile?: 'speech' }) {
  const audio = useRef<HTMLAudioElement>(null);
  const preview = useRef<SpeechPreview | null>(null);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => () => { preview.current?.dispose(); preview.current = null; audio.current?.pause(); }, [src, profile]);

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    setError('');
    try {
      if (profile === 'speech') {
        const p = preview.current ??= speechPreview(a);
        if (a.paused) void p.play().catch(() => { setPlaying(false); setError('Audio preview unavailable.'); });
        else p.stop();
      } else if (a.paused) void a.play().catch(() => setPlaying(false));
      else a.pause();
    } catch { setPlaying(false); setError('Audio preview unavailable.'); }
  };

  return (
    <div class="audio">
      <audio
        ref={audio}
        src={src}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime((e.target as HTMLAudioElement).currentTime)}
        onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
      />
      <IconButton label={`${playing ? 'Pause' : 'Play'} ${label}`} glyph={playing ? 'pause' : 'play'} help={playing ? `Pauses ${label}.` : `Plays ${label} here in the browser so you can hear it. Nothing is changed or recorded.`} onClick={toggle} />
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={time}
        aria-label={`Position in ${label}`}
        onInput={(e) => {
          const a = audio.current;
          if (a) { const seconds = Number((e.target as HTMLInputElement).value); if (preview.current) preview.current.seek(seconds); else a.currentTime = seconds; }
        }}
      />
      {error && <span class="small" role="status">{error}</span>}
      <span class="time">
        {fmt(time)} / {fmt(duration)}
      </span>
    </div>
  );
}

/** Thumbnail that opens the full image in a dialog. */
export function ImageViewer({ src, alt, full }: { src: string; alt: string; full?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" class="image-thumb" aria-label={`View ${alt}`} title="Opens a larger view of this image in a window. Nothing is changed." onClick={() => setOpen(true)}>
        <img src={src} alt={alt} loading="lazy" />
      </button>
      {open && (
        <Dialog title={alt} wide onClose={() => setOpen(false)}>
          <img class="image-full" src={full ?? src} alt={alt} />
        </Dialog>
      )}
    </>
  );
}
