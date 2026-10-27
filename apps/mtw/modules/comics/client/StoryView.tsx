// Story tab of an issue: the raw storyline (scenes, boxes, lines) on the left, read from the story file, and on the right
// the shared agent chat bound to comics-story-feedback, which revises the story through the comic build workflow's story
// stage (scripts/comics/README.md). Matt approves the words here before any image lane starts.
import { useEffect, useState } from 'preact/hooks';
import { api } from '../../../web/api';
import { buildUrl } from '../../../web/shell/route';
import { Link } from '../../../web/shell/Link';
import { AgentChat } from '../../../web/ui/AgentChat';
import { EmptyState } from '../../../web/ui';

export const STORY_FEEDBACK = 'comics-story-feedback';

interface Balloon { index: number; who: string; kind: string; state: string | null; text: string; sceneSetup: boolean; characterIntro: boolean }
interface Box { index: number; img: string; alt: string; r: number[] | null; balloons: Balloon[]; sfx: string[]; room: string | null; hasArt: boolean }
interface Scene { id: string; title: string | null; place: string | null; score: number | null; room: string | null; villains: string[]; boxes: Box[] }
interface Storyline { id: string; file: string; sha256: string; issue: number | null; title: string | null; scenes: Scene[]; counts: { scenes: number; boxes: number; lines: number }; next: { heading: string | null; choices: string[] } }

const who = (b: Balloon): string => (b.kind === 'caption' || b.kind === 'place' ? (b.sceneSetup ? 'SETUP' : b.characterIntro ? 'INTRO' : b.kind.toUpperCase()) : b.who.toUpperCase());

export function StoryChat({ id }: { id: string }) {
  return (
    <AgentChat
      label="Feedback for this story"
      title="Improve the story"
      operation={STORY_FEEDBACK}
      subject={`story:${id}`}
      placeholder="Say what the story gets wrong or what it must include. Or press the mic and say it."
      hint="Claude rewrites the words, reruns the story checks and a cold read, then refreshes this tab. Words freeze only when you approve them."
      launch={(req) => api.post<{ id: string }>(`/api/comics/story/${encodeURIComponent(id)}/feedback`, req)}
    />
  );
}

export function StoryView({ id }: { id: string }) {
  const [data, setData] = useState<Storyline | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    api.get<Storyline>(`/api/comics/story/${encodeURIComponent(id)}`).then((d) => live && setData(d), (e: Error) => live && setError(e.message));
    const timer = setInterval(() => setTick((t) => t + 1), 15000);
    return () => { live = false; clearInterval(timer); };
  }, [id, tick]);
  return (
    <div class="cast-with-chat">
      <div class="cast-main">
        <div class="row" style="justify-content: space-between; align-items: baseline;">
          <h2 style="margin: 0;">Story{data?.title ? `: ${data.title}` : ''}</h2>
          <Link href={buildUrl('comics', ['issues', id])} class="btn btn--ghost btn--small">Back to the issue</Link>
        </div>
        {error ? <EmptyState>The story could not be read: {error}</EmptyState> : !data ? <p class="muted">Reading the story file…</p> : (
          <>
            <p class="muted small">{data.counts.scenes} scenes, {data.counts.boxes} boxes, {data.counts.lines} lines. {data.file} ({data.sha256.slice(0, 8)}). Reloads every 15 s while a revision runs.</p>
            {data.scenes.map((sc, si) => (
              <section key={sc.id} class="story-scene">
                <h3>{si + 1}. {sc.title ?? sc.id} <span class="muted small">({sc.id}; {sc.boxes.length} boxes; score {sc.score ?? 0}; room {sc.room ?? 'none'}{sc.villains.length ? `; villains ${sc.villains.join(', ')}` : ''})</span></h3>
                {sc.place && <p class="muted small">{sc.place}</p>}
                <ol>
                  {sc.boxes.map((b) => (
                    <li key={b.img}>
                      <div><strong>{b.img}</strong> <span class="muted small">{b.r ? `r ${b.r.map((n) => Math.round(n * 100) / 100).join(', ')}` : ''}{b.sfx.length ? ` · sfx ${b.sfx.join(', ')}` : ''}{b.room ? ` · room ${b.room}` : ''}{b.hasArt ? '' : ' · no art yet'}</span></div>
                      <div class="muted small">{b.alt}</div>
                      <ul class="story-lines">
                        {b.balloons.map((bl) => <li key={bl.index}><span class="story-who">{who(bl)}</span> {bl.text}{bl.state && bl.state !== 'calm' && bl.state !== 'narration' ? <span class="muted small"> ({bl.state})</span> : null}</li>)}
                      </ul>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
            {data.next.heading && <p><strong>NEXT:</strong> {data.next.heading} {data.next.choices.length ? <span class="muted small">({data.next.choices.join(' · ')})</span> : null}</p>}
          </>
        )}
      </div>
      <StoryChat id={id} />
    </div>
  );
}
