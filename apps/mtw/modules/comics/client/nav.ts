// Pure URLs for Comic review (no DOM, no Preact), so the routing rules are testable in node.
// Comic review lives inside its issue: /m/comics/issues/<issue>/review?state=all&b=<balloon id>.
// The old top-level /m/comics/speech?issue=&b=&state= URLs redirect here.
import { buildUrl } from '../../../web/shell/route';

export const REVIEW_SEGMENT = 'review';

/** Comic review for one issue, opened at a balloon (its box) when given. Extra query keys are kept as given (empty ones dropped). */
export function reviewHref(issue: string, b = '', extra: Record<string, string> = {}): string {
  const q: Record<string, string> = {};
  for (const [k, v] of Object.entries(extra)) if (v) q[k] = v;
  if (!('state' in q)) q.state = 'all';
  if (b) q.b = b;
  return buildUrl('comics', ['issues', issue, REVIEW_SEGMENT], q);
}

/** The issue a balloon id (`<story>-<scene>-<img>-b<n>`) belongs to: the longest known issue id that prefixes it. */
export function issueForBalloon(b: string, issueIds: string[]): string {
  let best = '';
  for (const id of issueIds) if (id.length > best.length && b.startsWith(`${id}-`)) best = id;
  return best;
}

/**
 * Where an old /m/comics/speech URL now lives. Keeps b, state, view, character and q; the issue moves into the path.
 * Without an issue it is found from the balloon id; with neither, the issues list.
 */
export function legacySpeechTarget(query: URLSearchParams, issueIds: string[] = []): string {
  const b = query.get('b') ?? '';
  const issue = query.get('issue') || (b ? issueForBalloon(b, issueIds) : '');
  if (!issue) return buildUrl('comics', ['issues']);
  const extra: Record<string, string> = {};
  for (const k of ['state', 'view', 'character', 'q']) {
    const v = query.get(k);
    if (v) extra[k] = v;
  }
  // The old link without a state opened the open queue; keep that meaning.
  if (!extra.state) extra.state = b ? 'all' : 'open';
  return reviewHref(issue, b, extra);
}

interface HasBalloons {
  balloons: { id: string }[];
}

/** The balloon a box opens at: its own first balloon, else the scene's first (a box without lettering). */
export function boxReviewBalloon(panel: HasBalloons, scene: { panels: HasBalloons[] }): string {
  return panel.balloons[0]?.id ?? sceneReviewBalloon(scene);
}

/** The balloon a scene opens at: the first balloon of its first lettered box, or '' when it has none. */
export function sceneReviewBalloon(scene: { panels: HasBalloons[] }): string {
  for (const p of scene.panels) if (p.balloons[0]) return p.balloons[0].id;
  return '';
}
