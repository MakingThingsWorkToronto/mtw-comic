import { describe, expect, it } from 'vitest';
import { boxReviewBalloon, issueForBalloon, legacySpeechTarget, reviewHref, sceneReviewBalloon } from '../modules/comics/client/nav';

const q = (s: string) => new URLSearchParams(s);

describe('comic review URLs', () => {
  it('opens an issue at a balloon with every state shown', () => {
    expect(reviewHref('home', 'home-quote-1-b0')).toBe('/m/comics/issues/home/review?state=all&b=home-quote-1-b0');
    expect(reviewHref('home')).toBe('/m/comics/issues/home/review?state=all');
    expect(reviewHref('home', '', { state: 'open', q: '' })).toBe('/m/comics/issues/home/review?state=open');
  });

  it('finds the issue from a balloon id, preferring the longest prefix', () => {
    expect(issueForBalloon('ai-ops-intro-2-b1', ['ai', 'ai-ops', 'home'])).toBe('ai-ops');
    expect(issueForBalloon('home-quote-1-b0', ['ai', 'homes'])).toBe('');
  });
});

describe('old speech URLs', () => {
  it('move the issue into the path and keep b, state and filters', () => {
    expect(legacySpeechTarget(q('issue=home&state=all&b=home-quote-1-b0'))).toBe('/m/comics/issues/home/review?state=all&b=home-quote-1-b0');
    expect(legacySpeechTarget(q('issue=home&view=list&character=rink&q=desk'))).toBe('/m/comics/issues/home/review?view=list&character=rink&q=desk&state=open');
  });

  it('finds the issue from the balloon when the link had none', () => {
    expect(legacySpeechTarget(q('b=home-quote-1-b0'), ['home', 'ai'])).toBe('/m/comics/issues/home/review?state=all&b=home-quote-1-b0');
  });

  it('falls back to the issues list', () => {
    expect(legacySpeechTarget(q(''))).toBe('/m/comics/issues');
    expect(legacySpeechTarget(q('b=zzz-1-b0'), ['home'])).toBe('/m/comics/issues');
  });
});

describe('scene and box targets', () => {
  const scene = { panels: [{ balloons: [] }, { balloons: [{ id: 'x-s-2-b0' }, { id: 'x-s-2-b1' }] }, { balloons: [{ id: 'x-s-3-b0' }] }] };
  it('opens a box at its first balloon, or the scene start when unlettered', () => {
    expect(boxReviewBalloon(scene.panels[2]!, scene)).toBe('x-s-3-b0');
    expect(boxReviewBalloon(scene.panels[0]!, scene)).toBe('x-s-2-b0');
    expect(sceneReviewBalloon(scene)).toBe('x-s-2-b0');
    expect(sceneReviewBalloon({ panels: [{ balloons: [] }] })).toBe('');
  });
});
