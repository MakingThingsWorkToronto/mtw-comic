// Comic review inside its issue (/m/comics/issues/<id>/review), and the redirect that keeps old /m/comics/speech links working.
import { useEffect } from 'preact/hooks';
import { buildUrl } from '../../../web/shell/route';
import { Link } from '../../../web/shell/Link';
import { navigate } from '../../../web/shell/router';
import { EmptyState } from '../../../web/ui';
import { useView } from './hooks';
import { legacySpeechTarget } from './nav';
import { SpeechView } from './Speech';
import './nav.css';

/** The Comic review flow with the issue fixed: one box at a time, its balloons, Play, effects and feedback. */
export function IssueReview({ id, query }: { id: string; query: URLSearchParams }) {
  const issues = useView<{ issues: { id: string; title: string }[] }>('/api/comics/issues').data?.issues;
  const title = issues?.find((i) => i.id === id)?.title ?? id;
  return (
    <div class="stack">
      <div class="page-head">
        <div class="title-block">
          <h1>Comic review</h1>
          <p class="sub">
            <Link href={buildUrl('comics', ['issues', id])}>{title}</Link> · one box at a time, with its balloons, Play, effects and feedback
          </p>
        </div>
      </div>
      <SpeechView query={query} fixedIssue={id} />
    </div>
  );
}

/** Old /m/comics/speech?issue=&b=&state= links: move to the issue's Comic review, keeping the balloon and filters. */
export function SpeechRedirect({ query }: { query: URLSearchParams }) {
  const needsLookup = !query.get('issue') && !!query.get('b');
  const { data, error } = useView<{ issues: { id: string }[] }>('/api/comics/issues');
  const ready = !needsLookup || !!data || !!error;
  const target = ready ? legacySpeechTarget(query, (data?.issues ?? []).map((i) => i.id)) : '';
  useEffect(() => {
    if (target) navigate(target, { replace: true });
  }, [target]);
  return <EmptyState>Comic review has moved into each issue. Opening it.</EmptyState>;
}
