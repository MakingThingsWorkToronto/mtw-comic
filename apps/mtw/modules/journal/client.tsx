// Journal module views (migrated from the retired Journal console, git 51eb6e03:wiki/journal/console/render.mjs: front door, queue, entry, post preview, concept, prompts).
import { useRef } from 'preact/hooks';
import { buildUrl } from '../../web/shell/route';
import { navigate } from '../../web/shell/router';
import { ChangedBar } from '../../web/shell/ChangedBar';
import { AddResourceButton, EmptyState, TabActions, Tabs } from '../../web/ui';
import type { ViewProps } from '../types';
import { copy } from './copy';
import layout from './layout.json';
import { Concept } from './ui/Concept';
import { Entry } from './ui/Entry';
import { Front } from './ui/Front';
import { DiscoverButton, OperationsView } from './ui/Ops';
import { Preview } from './ui/Preview';
import { Queue } from './ui/Queue';
import { ReviewChat } from './ui/ReviewChat';
import { useOverview } from './ui/useJournal';
import './journal.css';

export default function JournalModule({ path, query }: ViewProps) {
  const dirty = useRef(false);
  const { data, error, live, reload } = useOverview(() => dirty.current);
  const view = path[0] ?? 'waiting';
  const onDirty = (d: boolean): void => {
    dirty.current = d;
  };
  const tabbed = !path[1] && ['waiting', 'queue', 'operations'].includes(view);

  return (
    <div class="page">
      <ChangedBar live={live} label={copy.answers.changed} />
      {error && (
        <p role="alert" style="color:var(--error)">
          {error}
        </p>
      )}
      {tabbed && (
        <>
          <Tabs
            label="Journal views"
            value={view}
            onChange={(id) => navigate(buildUrl('journal', id === 'waiting' ? [] : [id]))}
            items={(layout.module as string[]).map((id) => ({ id, label: copy.module.tabs[id as 'waiting'] }))}
          />
          <TabActions>
            <DiscoverButton />
            <AddResourceButton kind="journal-candidate" />
          </TabActions>
          <div class="page-head">
            <div class="title-block">
              <h1 class="sr-only">{copy.module.title}</h1>
              <p class="sub">{view === 'waiting' ? copy.front.sub : view === 'queue' ? copy.queue.sub : copy.operations.sub}</p>
            </div>
          </div>
        </>
      )}
      {view === 'operations' && !path[1] ? (
        <OperationsView />
      ) : !data ? (
        !error && <EmptyState>Loading.</EmptyState>
      ) : view === 'queue' ? (
        <Queue data={data} tab={query.get('tab') ?? 'queue'} onChanged={reload} />
      ) : view === 'entry' && path[1] ? (
        path[2] === 'preview' ? (
          <Preview data={data} slug={path[1]} />
        ) : (
          <div class="j-with-chat">
            <div class="j-main">
              <Entry data={data} slug={path[1]} tab={query.get('tab') ?? 'status'} onDirty={onDirty} onChanged={reload} />
            </div>
            <ReviewChat subject={`entry:${path[1]}`} kind="entry" />
          </div>
        )
      ) : view === 'concept' && path[1] ? (
        <div class="j-with-chat">
          <div class="j-main">
            <Concept data={data} number={Number(path[1])} onDirty={onDirty} onChanged={reload} />
          </div>
          <ReviewChat subject={`concept:${path[1]}`} kind="candidate" />
        </div>
      ) : (
        <Front data={data} />
      )}
    </div>
  );
}
