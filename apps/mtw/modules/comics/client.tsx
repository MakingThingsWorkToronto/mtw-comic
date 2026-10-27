import { useEffect } from 'preact/hooks';
import { buildUrl } from '../../web/shell/route';
import { navigate } from '../../web/shell/router';
import { AddResourceButton, EmptyState, Tabs } from '../../web/ui';
import type { ViewProps } from '../types';
import { CastDetailView, CastList } from './client/Cast';
import { CharacterChat } from './client/CastChat';
import { IssueView, IssuesView } from './client/Issues';
import { LiveNotice } from './client/LiveNotice';
import { Pick } from './client/Pick';
import { IssueReview, SpeechRedirect } from './client/Review';
import { SoundsView } from './client/Sounds';
import { StoryView } from './client/StoryView';
import { EditorView } from './editor/client';
import './comics.css';

const TABS = [
  { id: 'issues', label: 'Issues' },
  { id: 'cast', label: 'Cast' },
  { id: 'sounds', label: 'Sounds' },
];

export default function ComicsModule({ path, query, pick }: ViewProps) {
  const view = path[0] ?? 'issues';
  useEffect(() => {
    if (!path[0] && !pick) navigate(buildUrl('comics', ['issues']), { replace: true });
  }, [path, pick]);

  if (pick) return <Pick assetType={pick.assetType} onPick={pick.onPick} />;
  if (view === 'editor') return <EditorView path={path} query={query} />;
  // Comic review lives inside each issue; the old top-level tab's URLs redirect there.
  if (view === 'speech') return <SpeechRedirect query={query} />;
  const detail = path[1] !== undefined;
  return (
    <>
      <LiveNotice />
      {!detail && <Tabs label="Comics views" value={view} onChange={(id) => navigate(buildUrl('comics', [id]))} items={TABS} />}
      {view === 'cast' ? (
        detail ? (
          <div class="cast-with-chat">
            <div class="cast-main">
              <CastDetailView id={path[1] as string} query={query} />
            </div>
            <CharacterChat id={path[1] as string} />
          </div>
        ) : (
          <>
            <div class="row cast-add">
              <AddResourceButton kind="character" />
            </div>
            <CastList query={query} />
          </>
        )
      ) : view === 'sounds' ? (
        <SoundsView />
      ) : detail && path[2] === 'review' ? (
        <IssueReview id={path[1] as string} query={query} />
      ) : detail && path[2] === 'story' ? (
        <StoryView id={path[1] as string} />
      ) : detail ? (
        <>
          <p class="row" style="gap: var(--space-2);">
            <a class="btn btn--secondary btn--small" href={buildUrl('comics', ['issues', path[1] as string, 'story'])} title="The raw storyline, scene by scene, with a chat to improve it. Words freeze only when you approve them.">Story</a>
          </p>
          <IssueView id={path[1] as string} query={query} />
        </>
      ) : (
        <IssuesView />
      )}
    </>
  );
}
