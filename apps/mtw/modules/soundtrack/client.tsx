// Migrated from retired git 51eb6e03:wiki/soundtrack-library/index.html. Views: / (music list; detail at /track/<id>) and /comic (comic audio).
// In a picker (AssetField) the owner view lists snd tracks, or the comic-audio records of the requested prefix.
import { useEffect } from 'preact/hooks';
import { buildUrl } from '../../web/shell/route';
import { navigate } from '../../web/shell/router';
import { useWikiChanged } from '../../web/state';
import { AddResourceButton, TabActions, Tabs } from '../../web/ui';
import type { ViewProps } from '../types';
import { ComicAudioView } from './client/ComicAudio';
import { refreshComic, refreshLibrary } from './client/data';
import { shouldTogglePlay } from './client/keyboard';
import { CountsStrip, MusicView } from './client/Library';
import { NowPlaying } from './client/NowPlaying';
import { release, toggle } from './client/player';
import './soundtrack.css';

export default function SoundtrackModule(props: ViewProps) {
  const { path, pick } = props;
  const comic = pick ? pick.assetType !== 'snd' : path[0] === 'comic';

  useEffect(() => {
    void refreshLibrary();
    void refreshComic();
    return release;
  }, []);

  // Live updates from outside the app (an intake or discovery run edits the library). Nothing here holds unsaved text.
  useWikiChanged('wiki/soundtrack-library/comic-audio.json', () => void refreshComic());
  useWikiChanged(['wiki/soundtrack-library/sources.json', 'wiki/soundtrack-library/discovery.json', 'wiki/soundtrack-library/manifest.json'], () => void refreshLibrary());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!shouldTogglePlay(e)) return;
      e.preventDefault();
      toggle();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div class="snd page">
      {!pick && (
        <>
          <h1 class="sr-only">Soundtrack</h1>
          {!comic && (
            <TabActions>
              <CountsStrip />
              <AddResourceButton kind="track" />
            </TabActions>
          )}
          <Tabs
            label="Soundtrack views"
            value={comic ? 'comic' : 'music'}
            onChange={(id) => navigate(buildUrl('soundtrack', id === 'comic' ? ['comic'] : []))}
            items={[
              { id: 'music', label: 'Music' },
              { id: 'comic', label: 'Comic audio' },
            ]}
          />
        </>
      )}
      {comic ? <ComicAudioView {...props} /> : <MusicView {...props} />}
      <NowPlaying />
    </div>
  );
}
