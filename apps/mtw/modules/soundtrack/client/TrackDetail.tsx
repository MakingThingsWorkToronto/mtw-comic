// Migrated from retired git 51eb6e03:wiki/soundtrack-library/index.html (select(): the detail panel, credit tag, stats, copy buttons).
import { useEffect, useRef, useState } from 'preact/hooks';
import { buildUrl } from '../../../web/shell/route';
import { Link } from '../../../web/shell/Link';
import { Button, DeleteControl, EmptyState, Panel, useDelete } from '../../../web/ui';
import { deleteSubject } from '../../../web/delete';
import type { Profile, Track } from '../types';
import { audioSrc, fetchProfile, refreshLibrary, trackItem } from './data';
import { useFrame, useReducedMotion } from './frame';
import { FrequencyLane, LaneLegend } from './FrequencyLane';
import { LiveBands, useMetronome } from './LiveBands';
import { audioEl, load, metronome, playing, toggle } from './player';
import { bandsOf, creditSnippet, creditText, eqLevels, trackStats } from './profile';
import { ReviewBox } from './ReviewBox';

function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'manual'>('idle');
  useEffect(() => {
    if (state !== 'copied') return;
    const timer = setTimeout(() => setState('idle'), 1200);
    return () => clearTimeout(timer);
  }, [state]);
  const copy = () => {
    const done = navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject(new Error('no clipboard'));
    done.then(
      () => setState('copied'),
      () => setState('manual'),
    );
  };
  return (
    <>
      <Button help={`Copies the ${label.replace(/^Copy /, '')} to your clipboard so you can paste it where the music is credited. Nothing is changed.`} onClick={copy}>{state === 'copied' ? 'Copied' : label}</Button>
      {state === 'manual' && <input class="input snd-manual" readOnly value={text} aria-label={`${label}: select and copy`} onFocus={(e) => (e.target as HTMLInputElement).select()} />}
    </>
  );
}

function CreditTag({ track, profile }: { track: Track; profile: Profile | null }) {
  const bars = useRef<(HTMLElement | null)[]>([]);
  const reduced = useReducedMotion();
  useFrame(() => {
    const levels = eqLevels(bandsOf(profile), profile, audioEl().currentTime, !audioEl().paused && !reduced);
    levels.forEach((v, k) => {
      const el = bars.current[k];
      if (el) el.style.transform = `scaleY(${v.toFixed(2)})`;
    });
  }, reduced);
  if (!track.credit) return null;
  return (
    <div class="snd-credit-tag">
      <button type="button" aria-label={playing.value ? 'Pause' : 'Play'} title={playing.value ? 'Pauses this track.' : 'Plays this track so you can hear it. Nothing is changed.'} onClick={toggle}>
        <span class="snd-eq" aria-hidden="true">
          {[0, 1, 2, 3].map((k) => (
            <i
              key={k}
              ref={(el) => {
                bars.current[k] = el;
              }}
            />
          ))}
        </span>
      </button>
      {track.credit.href ? (
        <a href={track.credit.href} target="_blank" rel="noopener">
          {track.credit.text}
        </a>
      ) : (
        <span>{track.credit.text}</span>
      )}
    </div>
  );
}

export function TrackDetail({ track, backHref }: { track: Track; backHref: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileState, setProfileState] = useState<'loading' | 'ready' | 'none'>('loading');
  const del = useDelete({
    kind: 'track',
    subject: deleteSubject.track(track.id),
    target: `snd:${track.id}`,
    paths: [`wiki/soundtrack-library/assets/${track.file}`],
    onSettle: refreshLibrary,
  });

  useEffect(() => {
    load(trackItem(track));
  }, [track.id]);

  useEffect(() => {
    let live = true;
    setProfile(null);
    if (!track.profile) {
      setProfileState('none');
      return;
    }
    setProfileState('loading');
    fetchProfile(track.id).then(
      (p) => {
        if (live) {
          setProfile(p);
          setProfileState('ready');
        }
      },
      () => live && setProfileState('none'),
    );
    return () => {
      live = false;
    };
  }, [track.id, track.profile]);

  useMetronome(profile);

  const stats = trackStats(track);
  const byline = [track.artist, track.provider, track.genre, track.published ? `published ${track.published}` : ''].filter(Boolean).join(' · ');

  return (
    <article class={`snd-detail ${del.zoneClass}`} aria-label={track.title} ref={del.ref} {...del.zoneAttrs}>
      <Link class="snd-back" href={backHref}>
        All tracks
      </Link>
      <header class="snd-detail-head">
        <h2>{track.title}</h2>
        <p class="muted">
          {byline}
          {track.license && (
            <>
              {' · '}
              {track.licenseUrl ? (
                <a href={track.licenseUrl} target="_blank" rel="noopener">
                  {track.license}
                </a>
              ) : (
                track.license
              )}
            </>
          )}
          {track.usedBy && track.usedBy.length > 0 && ` · used on ${track.usedBy.join(', ')}`}
        </p>
      </header>
      {track.note && (
        <p class="snd-note" role="note">
          <b>{track.status}:</b> {track.note}
        </p>
      )}
      <ReviewBox track={track} />
      <div class="snd-actions">
        <CreditTag track={track} profile={profile} />
        {track.credit && <CopyButton label="Copy credit" text={creditText(track)} />}
        {track.credit && <CopyButton label="Copy story music line" text={creditSnippet(track)} />}
        <Button variant={metronome.value ? 'primary' : 'secondary'} aria-pressed={metronome.value} help={metronome.value ? 'Turns the click track off.' : 'Plays a click on every beat while the track plays, so you can hear whether the measured beats line up with the music. Nothing is changed.'} onClick={() => (metronome.value = !metronome.value)}>
          Metronome
        </Button>
        <a class="btn btn--secondary" href={audioSrc(track.file)} download={track.file} title="Saves a copy of this audio file to your Downloads folder. The library file is not changed.">
          Download
        </a>
        <DeleteControl del={del} small={false} />
      </div>
      {stats.length ? (
        <dl class="snd-stats">
          {stats.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <EmptyState>Not profiled yet.</EmptyState>
      )}
      <Panel title="Frequency lane">
        <LaneLegend />
        {profileState === 'none' ? <EmptyState>No profile for this track.</EmptyState> : <FrequencyLane track={track} profile={profile} />}
      </Panel>
      <Panel title="Live bands">
        {profileState === 'none' ? <EmptyState>No profile for this track.</EmptyState> : <LiveBands profile={profile} />}
      </Panel>
    </article>
  );
}

export const detailHref = (id: string, query: URLSearchParams): string => buildUrl('soundtrack', ['track', id], query);
