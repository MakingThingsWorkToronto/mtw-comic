import { buildUrl } from '../../../web/shell/route';
import { Link } from '../../../web/shell/Link';
import { navigate, setQuery } from '../../../web/shell/router';
import { Badge, DeleteControl, EmptyState, FilterBar, Table, useDelete } from '../../../web/ui';
import { boxFingerprint, deleteSubject } from '../../../web/delete';
import { useLiveResource } from '../../../web/state';
import type { Column } from '../../../web/ui';
import { FixArtButton, FixBadge, useArtWatch } from './FixArt';
import { InsertBoxButton, InsertSceneButton, InsertingBadge, useInserts } from './InsertDialogs';
import type { InsertSubject } from './insert';
import type { ArtWatch, FixTarget } from './FixArt';
import { OpButton } from './OpButton';
import { PreviewDown, ReaderStage } from './ReaderStage';
import { boxReviewBalloon, reviewHref, sceneReviewBalloon } from './nav';
import './nav.css';
import { compactNumber } from './flow';
import { secs, useTokensSpent, useView } from './hooks';
import { Meter, StateBadge } from './parts';
import type { Counts, IssueFull, IssueSummary, PagePanel, PageScene, SceneRow } from './types';

export const reviewLine = (c: Counts): string => `${c.approved} of ${c.total} approved${c.stale ? `, ${c.stale} stale` : ''}${c.rejected ? `, ${c.rejected} rejected` : ''}`;

export interface DrawingReference {
  recordId: string;
  kind: string;
  label: string;
  title: string;
  status: string | null;
  present: boolean;
  src: string | null;
}

export function IssuesView() {
  const { data, error } = useView<{ builtAt: string; warnings: string[]; references?: DrawingReference[]; issues: IssueSummary[] }>('/api/comics/issues');
  if (error) return <EmptyState>{error}</EmptyState>;
  if (!data) return <EmptyState>Loading.</EmptyState>;
  const columns: Column<IssueSummary>[] = [
    { key: 'issue', header: '#', render: (r) => r.issue ?? 'demo', sort: (a, b) => (a.issue ?? 99) - (b.issue ?? 99) },
    {
      key: 'title',
      header: 'Title',
      render: (r) => <Link href={buildUrl('comics', ['issues', r.id])}>{r.title}</Link>,
      sort: (a, b) => a.title.localeCompare(b.title),
    },
    { key: 'length', header: 'Length', render: (r) => `${secs(r.durationSeconds)} · ${r.bpm} bpm` },
    { key: 'panels', header: 'Scenes / panels', render: (r) => `${r.scenes} / ${r.panels}` },
    { key: 'speech', header: 'Comic review', render: (r) => reviewLine(r.reviews) },
    { key: 'checks', header: 'Gaps', render: (r) => (r.problems ? <Badge status="rejected">{String(r.problems)}</Badge> : <Badge status="approved">none</Badge>) },
    {
      key: 'links',
      header: 'Links',
      align: 'actions',
      render: (r) => (
        <span class="row end">
          <Link class="btn btn--ghost btn--small" href={buildUrl('comics', ['editor', r.id])} title="Opens the Comic Editor for this issue, where you can change the wording and placement of its speech balloons. Nothing changes until you press Save there.">
            Open in editor
          </Link>
          <a class="btn btn--ghost btn--small" href={r.localUrl} target="_blank" rel="noreferrer" title="Opens this comic on your local copy of the website in a new browser tab. Needs the local website running. Nothing is changed.">
            Open locally
          </a>
          <a class="btn btn--ghost btn--small" href={r.liveUrl} target="_blank" rel="noreferrer" title="Opens this comic on the public website in a new browser tab. Nothing is changed.">
            Open on site
          </a>
          <OpButton id="comics-run-checks" params={{ story: r.id }} label="Check" small variant="ghost" help="Opens a terminal where an agent runs the automatic story checks on this issue and lists every problem it finds. It fixes nothing and changes no files." />
        </span>
      ),
    },
  ];
  return (
    <div class="stack">
      <div class="row">
        <OpButton id="comics-rebuild-library" label="Rebuild library" help="Opens a terminal where an agent checks that the comics library pages can be rebuilt from the cast, voices, images and stories, and reports any warnings. It writes no files." />
        <OpButton id="comics-author-issue" label="Author or revise issue" help="Opens a window where you describe the issue you want written or changed. Launching it opens a terminal where an agent writes or revises that issue's story, art plan and lettering, then runs the checks. It does not publish." />
        <OpButton id="comics-beat-comic" label="Beat comic" help="Opens a window where you choose an approved song and a story. Launching it opens a terminal where an agent builds an 8-bit motion comic cut to that song's beats and runs its checks. It does not publish." />
        <span class="muted small">Library built {new Date(data.builtAt).toLocaleString()}</span>
      </div>
      <Table columns={columns} rows={data.issues} rowKey={(r) => r.id} defaultSort={{ key: 'issue', dir: 'asc' }} />
      {data.warnings.length > 0 && (
        <details>
          <summary class="muted small">{data.warnings.length} library warnings at the last build</summary>
          <ul class="small">
            {data.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

export function IssueView({ id, query }: { id: string; query: URLSearchParams }) {
  // Same fetch as useView, but a refetch that finds the issue gone must show it gone (useView keeps the old data).
  const issue = useLiveResource<IssueFull>(`/api/comics/issues/${encodeURIComponent(id)}`, { module: 'comics' });
  const gone = issue.error === 'unknown issue';
  const data = gone ? null : (issue.data ?? null);
  const error = issue.data === undefined || gone ? issue.error : '';
  const pagesView = useView<{ scenes: PageScene[] }>(`/api/comics/issues/${encodeURIComponent(id)}/pages`);
  const pages = pagesView.data?.scenes ?? [];
  const watch = useArtWatch(id, () => void pagesView.reload());
  const spent = useTokensSpent('comics', id);
  const reloadAll = (): Promise<unknown> => Promise.all([issue.reload(), pagesView.reload()]);
  const del = useDelete({ kind: 'comic', subject: deleteSubject.comic(id), target: id, paths: [`site/src/data/comic-stories/${id}.ts`], present: !gone, onSettle: reloadAll });
  if (gone) return <EmptyState>This issue is no longer in the comics library.</EmptyState>;
  if (error) return <EmptyState>{error}</EmptyState>;
  if (!data) return <EmptyState>Loading.</EmptyState>;
  const gaps = Object.entries(data.coverage).filter(([, v]) => v.length);
  return (
    <div class={`stack ${del.zoneClass}`} ref={del.ref} {...del.zoneAttrs}>
      <div class="page-head">
        <div class="title-block">
          <h1>{data.title}</h1>
          <p class="sub">
            {data.issue ? `Issue ${data.issue} · ` : ''}
            {secs(data.durationSeconds)} · {data.scenes.length} scenes · {data.panels} panels · {reviewLine(data.reviews)}
            {spent && spent.total > 0 ? ` · ${compactNumber(spent.total)} tokens spent${spent.runs ? ` over ${spent.runs} runs` : ''}` : ''}
          </p>
        </div>
        <div class="row">
          <Link class="btn btn--secondary" href={buildUrl('comics', ['editor', data.id])} title="Opens the Comic Editor for this issue, where you can change the wording and placement of its speech balloons. Nothing changes until you press Save there.">
            Open in editor
          </Link>
          <a class="btn btn--secondary" href={data.localUrl} target="_blank" rel="noreferrer" title="Opens this comic on your local copy of the website in a new browser tab. Needs the local website running. Nothing is changed.">
            Open locally
          </a>
          <a class="btn btn--secondary" href={data.liveUrl} target="_blank" rel="noreferrer" title="Opens this comic on the public website in a new browser tab. Nothing is changed.">
            Open on site
          </a>
          <Link class="btn btn--secondary" href={reviewHref(data.id)} title="Opens the Comic review page for this issue, where you review this issue's boxes, balloons and speech. Nothing is changed by opening it.">
            Comic review
          </Link>
          <DeleteControl del={del} small={false} label="Delete issue" />
        </div>
      </div>
      <Link class="meter-row issue-progress" href={reviewHref(data.id)} aria-label={`Comic review progress: ${reviewLine(data.reviews)}. Open Comic review.`}>
        <span class="meter-name">Comic review</span>
        <Meter counts={data.reviews} label={`${data.title} review progress`} />
        <span class="muted small meter-n">
          {data.reviews.approved}/{data.reviews.total}
        </span>
      </Link>
      {gaps.length > 0 && <p class="muted">{gaps.map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${v.join(', ')}`).join(' · ')}</p>}
      <IssueScenes issue={data.id} rows={data.scenes} pages={pages} query={query} watch={watch} onSettle={reloadAll} />
    </div>
  );
}


/** A scene's name: its title, else its id (most Home scenes have no title yet). */
const sceneName = (s: { id: string; title: string }): string => s.title?.trim() || s.id;

/**
 * The issue's scenes (Matt, 2026-10-11: the page was disorganized): a compact list on the left, one row per scene with
 * its numbers, and the chosen scene on the right, shown through the comic reader (click a box to review it) above its
 * boxes and bubbles. The first scene is chosen when none is.
 */
function IssueScenes({ issue, rows, pages, query, watch, onSettle }: { issue: string; rows: SceneRow[]; pages: PageScene[]; query: URLSearchParams; watch: ArtWatch; onSettle: () => unknown }) {
  const q = query.get('q') ?? '';
  const needle = q.trim().toLowerCase();
  const chosen = query.get('scene') || pages[0]?.id || '';
  const hit = (s: PageScene): boolean => !needle || s.panels.some((p) => p.balloons.some((b) => `${b.text} ${b.characterId}`.toLowerCase().includes(needle)));
  const scene = pages.find((s) => s.id === chosen);
  const pageDel = useDelete({ kind: 'comic-page', subject: deleteSubject.page(issue, chosen || '-'), target: `${issue}/${chosen}`, present: Boolean(scene), onSettle });
  const inserts = useInserts(issue);
  if (pages.length === 0) return null;
  const byId = new Map(rows.map((r) => [r.id, r]));
  // Running Insert scene runs sit at their requested slot; Insert box runs sit among the chosen scene's boxes.
  const sceneInserts = (where: InsertSubject['where'], anchor: string) =>
    inserts
      .filter(({ target }) => target.kind === 'scene' && target.where === where && target.anchor === anchor)
      .map(({ run, target }) => (
        <li key={run.id} class="iss-inserting">
          <InsertingBadge run={run} label={`scene ${target.scene}`} />
        </li>
      ));
  const boxInserts = (where: InsertSubject['where'], n: number) =>
    inserts
      .filter(({ target }) => target.kind === 'box' && target.scene === chosen && target.where === where && target.anchor === String(n))
      .map(({ run }) => (
        <li key={run.id} class="iss-inserting">
          <InsertingBadge run={run} label={`new box ${where} box ${n}`} />
        </li>
      ));
  return (
    <div class="iss">
      <aside class="iss-list stack">
        <div class="iss-list-head">
          <span class="small muted">{pages.length} scenes</span>
          <InsertSceneButton issue={issue} scenes={pages.map((s) => ({ id: s.id, title: s.title }))} chosen={chosen} />
        </div>
        <FilterBar search={q} onSearch={(v) => setQuery({ q: v })} searchLabel="Search balloon text and characters" />
        <ol class="iss-scenes" aria-label="Scenes">
          {pages[0] && sceneInserts('before', pages[0].id)}
          {pages.map((s, n) => [
            <SceneItem key={s.id} issue={issue} n={n + 1} s={s} row={byId.get(s.id)} on={s.id === chosen} dim={!hit(s)} watch={watch} onSettle={onSettle} />,
            ...sceneInserts('after', s.id),
          ])}
        </ol>
      </aside>
      {scene && (
        <section class={`iss-scene stack ${pageDel.zoneClass}`} aria-label={`Scene ${sceneName(scene)}`} ref={pageDel.ref} {...pageDel.zoneAttrs}>
          <div class="row iss-scene-head">
            <h2>{sceneName(scene)}</h2>
            <span class="muted small">
              beat {scene.beat} · {secs(scene.seconds)} · {scene.panels.length} boxes · {scene.counts.approved}/{scene.balloons} approved
            </span>
            <Link class="btn btn--secondary btn--small" href={reviewHref(issue, sceneReviewBalloon(scene))} title="Opens the Comic review page at this scene, so you can review its boxes, balloons and speech. Nothing is changed by opening it.">
              Review this scene
            </Link>
            <InsertBoxButton issue={issue} scene={scene.id} sceneName={sceneName(scene)} boxCount={scene.panels.length} />
            <DeleteControl del={pageDel} label="Delete page" />
          </div>
          {scenePreview(issue, scene)}
          <h3 class="iss-boxes-head" id="iss-boxes-head">
            Bubble Text
          </h3>
          <ol class="iss-boxes" aria-labelledby="iss-boxes-head">
            {boxInserts('before', 1)}
            {boxInserts('after', 0)}
            {scene.panels.map((p) => [
              <BoxRow key={`${p.index}-${boxFingerprint(p)}`} issue={issue} scene={scene} p={p} needle={needle} watch={watch} onSettle={onSettle} />,
              ...boxInserts('after', p.index + 1),
            ])}
          </ol>
        </section>
      )}
    </div>
  );
}

/** One scene row: thumbnail, name, numbers and approval bar; dimmed while a delete run for its page is open. */
function SceneItem({ issue, n, s, row, on, dim, watch, onSettle }: { issue: string; n: number; s: PageScene; row: SceneRow | undefined; on: boolean; dim: boolean; watch: ArtWatch; onSettle: () => unknown }) {
  const del = useDelete({ kind: 'comic-page', subject: deleteSubject.page(issue, s.id), target: `${issue}/${s.id}`, onSettle });
  const name = sceneName(s);
  return (
    <li class={del.zoneClass} ref={del.ref} {...del.zoneAttrs}>
      <button type="button" class={`iss-item${on ? ' is-on' : ''}${dim ? ' is-dim' : ''}`} aria-pressed={on} title={`Shows ${name} in the main area. Nothing is changed.`} onClick={() => setQuery({ scene: s.id })}>
        <span class="iss-thumb">{s.thumb ? <img src={watch.src(s.id, s.thumb) ?? s.thumb} alt="" loading="lazy" decoding="async" /> : null}</span>
        <span class="iss-text">
          <span class="iss-name">
            <span class="muted">{n}.</span> {name}
          </span>
          <span class="small muted">
            {secs(s.seconds)} · {s.panels.length} boxes{row ? ` · ${row.room}${row.score ? ` · score ${row.score}` : ''}` : ''}
          </span>
          {row && row.speakers.length > 0 && <span class="small muted iss-who">{row.speakers.join(', ')}</span>}
          <span class="iss-meter">
            <Meter counts={s.counts} label={name} />
            <span class="small muted">
              {s.counts.approved}/{s.balloons}
            </span>
          </span>
        </span>
      </button>
      <DeleteControl del={del} statusOnly />
    </li>
  );
}

/** One box of the chosen scene: number, its bubbles in reading order, review, fix and delete. */
function BoxRow({ issue, scene, p, needle, watch, onSettle }: { issue: string; scene: PageScene; p: PagePanel; needle: string; watch: ArtWatch; onSettle: () => unknown }) {
  const del = useDelete({ kind: 'comic-box', subject: deleteSubject.box(issue, scene.id, p.index + 1, boxFingerprint(p)), target: `${issue}/${scene.id}/box ${p.index + 1}`, onSettle });
  const fix: FixTarget = { issue, sceneId: scene.id, sceneTitle: sceneName(scene), art: scene.art, full: watch.src(scene.id, p.src !== undefined ? p.src : scene.full), panels: [{ index: p.index, img: p.img, rect: p.crop, alt: p.alt, layers: p.layers, canonicalSource: p.canonicalSource }] };
  const approved = p.balloons.filter((b) => b.state === 'approved').length;
  return (
    <li class={`iss-box ${del.zoneClass}`} ref={del.ref} {...del.zoneAttrs}>
      <div class="iss-box-head">
        <Link class="iss-box-num" href={reviewHref(issue, boxReviewBalloon(p, scene))} title="Review this box" aria-label={`Review box ${p.index + 1}`}>
          {p.index + 1}
        </Link>
        <span class="small muted">{p.balloons.length ? `${approved}/${p.balloons.length} approved` : 'no lettering'}</span>
        <FixBadge issue={issue} sceneId={scene.id} panel={p} />
        <span class="iss-box-actions">
          <Link class="btn btn--ghost btn--small" href={reviewHref(issue, boxReviewBalloon(p, scene))} title="Opens the Comic review page at this box, so you can review it. Nothing is changed by opening it.">
            Review
          </Link>
          <FixArtButton target={fix} />
          <DeleteControl del={del} label="Delete box" />
        </span>
      </div>
      {p.balloons.length > 0 && (
        <ol class="balloon-list">
          {p.balloons
            .filter((b) => !needle || `${b.text} ${b.characterId}`.toLowerCase().includes(needle))
            .map((b) => (
              <li key={b.id}>
                <StateBadge state={b.state} />
                <span class="small muted">{b.characterId}</span>
                <Link class="balloon-text" href={reviewHref(issue, b.id)} title="Review this bubble">
                  {b.text}
                </Link>
              </li>
            ))}
        </ol>
      )}
    </li>
  );
}

/** The scene as the comic reader shows it; clicking a box opens it in Comic review (Matt, 2026-10-11). */
function scenePreview(issue: string, scene: PageScene) {
  return (
    <ReaderStage
      issue={issue}
      scene={scene.id}
      img=""
      at={0}
      length={1}
      bpm={90}
      playing={false}
      version={scene.panels.map((p) => p.img).join(',')}
      currentIndex={null}
      onEnded={() => undefined}
      onBalloon={() => undefined}
      onPanel={(img) => {
        const panel = scene.panels.find((p) => p.img === img);
        if (panel) navigate(reviewHref(issue, boxReviewBalloon(panel, scene)));
      }}
      fallback={<PreviewDown />}
    />
  );
}
