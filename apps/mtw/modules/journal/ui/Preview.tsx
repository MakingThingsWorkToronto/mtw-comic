import { Link } from '../../../web/shell/Link';
import { EmptyState } from '../../../web/ui';
import { copy } from '../copy';
import { anchorOf, isUnknown, mdBlocks, show } from '../shared';
import { Approval, Cover, jUrl } from './common';
import { Blocks, Inline } from './Md';
import type { Overview } from './useJournal';

/** The entry as it reads: the chosen cover, title, standfirst, contents and body. The built site is the faithful view; this links to it. */
export function Preview({ data, slug }: { data: Overview; slug: string }) {
  const e = data.state.entries.find((x) => x.slug === slug);
  if (!e) return <EmptyState>{copy.entry.notFound}</EmptyState>;
  const post = e.post;
  const cover = e.assets.covers.find((c) => c.exists && /chosen/i.test(c.option)) ?? e.assets.covers.find((c) => c.exists) ?? null;
  const blocks = post.found ? mdBlocks(post.body) : [];
  const toc = blocks.filter((b) => b.type === 'h' && b.level === 2) as { type: 'h'; level: number; text: string }[];
  return (
    <article class="j-post">
      <p>
        <Link href={jUrl('entry', slug)}>{copy.preview.back}</Link> ·{' '}
        <a href={e.localSiteUrl} target="_blank" rel="noopener noreferrer">
          {copy.entry.site}
        </a>
      </p>
      {cover ? <Cover cover={cover} width={720} /> : <p class="muted">{copy.preview.noCover}</p>}
      <h1>{show(post.title)}</h1>
      {!isUnknown(post.standfirst) && (
        <p class="j-standfirst">
          <Inline text={post.standfirst as string} />
        </p>
      )}
      <p class="muted">
        {copy.preview.byline} · {show(post.bodyWordCount)} {copy.preview.words} · <Approval value={e.approval} />
      </p>
      {post.found ? (
        <>
          {toc.length > 0 && (
            <nav class="j-toc" aria-label={copy.preview.contents}>
              <strong>{copy.preview.contents}</strong>
              <ul>
                {toc.map((h) => (
                  <li key={h.text}>
                    <a href={`#${anchorOf(h.text.replace(/[*`]/g, ''))}`}>{h.text.replace(/[*`]/g, '')}</a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <div class="j-prose">
            <Blocks blocks={blocks} anchors />
          </div>
        </>
      ) : (
        <p class="muted">{copy.preview.notFound} {post.basis}</p>
      )}
    </article>
  );
}
