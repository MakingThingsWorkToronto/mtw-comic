// Home summary for Comics: balloons and boxes awaiting Matt's review per issue, computed the way the issue's own
// review view counts them (reviewState plus voiceless word approvals, server/wordApprovals.ts).
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { ModuleSummary, NeedItem } from '../../types';
import { reviewState } from './library';
import type { Snapshot } from './library';
import { wordsApproved } from './wordApprovals';
import type { WordReview } from './wordApprovals';

const SOURCE = 'wiki/comics-library/{approvals,voices}.json + site/src/data/comic-stories/<issue>.ts';
/** States that wait on Matt: no decision yet, or words changed after his approval. Rejected rows wait on a fix. */
const WAITING = new Set(['pending', 'unvoiced', 'stale']);

export interface IssueReview {
  id: string;
  title: string;
  balloons: number;
  boxes: number;
  firstBalloon: string | null;
  storyPath: string | null;
}

/** Pure: per issue, the balloons still awaiting review and the distinct boxes (scene/panel) they sit in. */
export function issueReviews(snap: Pick<Snapshot, 'derived' | 'voices' | 'approvals' | 'sourceNow'>): IssueReview[] {
  const reviews = new Map((snap.approvals.textReviews as unknown as WordReview[]).map((r) => [r.id, r]));
  return snap.derived.comics.map((c) => {
    const boxes = new Set<string>();
    let balloons = 0;
    let first: string | null = null;
    for (const r of c.textReview) {
      let state: string = reviewState(snap, r).state;
      if (state === 'unvoiced' && wordsApproved(reviews.get(r.id), r, snap.sourceNow[r.storySource.path])) state = 'approved';
      if (!WAITING.has(state)) continue;
      balloons++;
      boxes.add(`${r.sceneId}/${r.panelId ?? r.panelIndex}`);
      first ??= r.id;
    }
    return { id: c.id, title: c.title, balloons, boxes: boxes.size, firstBalloon: first, storyPath: c.textReview[0]?.storySource.path ?? null };
  });
}

export async function comicsSummary(snap: Snapshot, repoRoot: string): Promise<ModuleSummary> {
  const issues = issueReviews(snap);
  const mtime = async (rel: string | null): Promise<string | undefined> => {
    if (!rel) return undefined;
    try {
      return (await fs.stat(path.join(repoRoot, rel))).mtime.toISOString();
    } catch {
      return undefined;
    }
  };
  const needs: NeedItem[] = [];
  let newest: { label: string; at?: string; href?: string } | null = null;
  for (const i of issues) {
    const at = await mtime(i.storyPath);
    if (at && (!newest?.at || at > newest.at)) newest = { label: `${i.title} (${i.id})`, at, href: `/m/comics/issues/${encodeURIComponent(i.id)}` };
    if (!i.balloons) continue;
    needs.push({
      id: `comics-${i.id}`,
      title: `${i.title.replace(/\.$/, '')} (${i.id}): ${i.balloons} balloon${i.balloons === 1 ? '' : 's'} in ${i.boxes} box${i.boxes === 1 ? '' : 'es'}`,
      next: 'Approve or fix the balloon words',
      count: i.balloons,
      // The story file's last change: when these words last became reviewable.
      ...(at ? { since: at } : {}),
      href: `/m/comics/issues/${encodeURIComponent(i.id)}/review${i.firstBalloon ? `?b=${encodeURIComponent(i.firstBalloon)}` : ''}`,
      action: 'Review',
      source: SOURCE,
    });
  }
  const balloons = issues.reduce((n, i) => n + i.balloons, 0);
  const boxes = issues.reduce((n, i) => n + i.boxes, 0);
  const total = snap.derived.comics.reduce((n, c) => n + c.textReview.length, 0);
  return {
    items: [{ id: 'balloons', label: `Balloons awaiting review (${boxes} boxes)`, count: balloons, href: '/m/comics', attention: balloons > 0, source: SOURCE }],
    needs,
    library: {
      total: snap.derived.comics.length,
      totalLabel: `issues, ${total} balloons`,
      awaiting: balloons,
      awaitingLabel: `balloons in ${boxes} boxes`,
      newest,
      href: '/m/comics',
      source: SOURCE,
    },
  };
}
