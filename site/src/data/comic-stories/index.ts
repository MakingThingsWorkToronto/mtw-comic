// The Comic B issue registry (skill: mtw-comic-story; facts: wiki/site/comic-story.md): the one place that maps each
// story to its routes. The -b pages on the site, the standalone reader (/comics/ and /comics/<slug>/), the Issues overlay,
// prev/next issue and the NEXT choices all resolve links through here. comic-story-check.mjs --registry checks it
// against the pages. Slugs mirror the A pages they retell (Comic B root, 2026-09-28). `ready: false` swaps an issue's pages for
// a dark holding frame ("Being inked."); every issue is true, since Matt steers from work in progress (2026-09-28: "i
// appreciate you showing your hand"). `hook` is the
// line the shelf and the Issues overlay show: the trouble, never a villain's name (Matt, 2026-09-28: "Villains are
// announced by the trouble they cause, not by name"). Hooks are draft copy for mtw-articulation review.
import type { CastId, ComicIssue, ComicStory } from './types';
import { homeComic } from './home';
import { agenticComic } from './agentic';
import { traditionalComic } from './traditional';
import { dataMigrationsComic } from './data-migrations';
import { navigationArt, navigationPositions } from './navigation-art';

export const comicIssues: ComicIssue[] = [
  { slug: 'home', ready: true, hook: 'A quote went out at eleven at night. Nobody checked it.', story: homeComic, bPage: '/home-b/', aPage: 'https://www.makingthings.work/', cover: 'home-tower-night', villain: 'snowball' },
  { slug: 'agentic-systems', ready: true, hook: 'An agent had the keys to production, and nobody had told it why.', story: agenticComic, bPage: '/agentic-systems-b/', aPage: 'https://www.makingthings.work/agentic-systems/', cover: 'agentic-floor19', villain: 'amnesia' },
  { slug: 'traditional-systems', ready: true, hook: 'Anyone could open the files. Nobody had looked.', story: traditionalComic, bPage: '/traditional-systems-b/', aPage: 'https://www.makingthings.work/traditional-systems/', cover: 'trad-dana-desk', villain: 'shadow' },
  { slug: 'data-migrations', ready: true, hook: 'A thirty-year-old system, and nobody left who remembers it.', story: dataMigrationsComic, bPage: '/data-migrations-b/', aPage: 'https://www.makingthings.work/data-migrations/', cover: 'dm-records-room', villain: 'snowball' },
].sort((a, b) => a.story.issue - b.story.issue);

/** The rogues' gallery by name (wiki/site/comic-story.md). */
export const villainNames: Partial<Record<CastId, string>> = {
  slop: 'The Slop', hallucination: 'The Hallucination', snowball: 'The Snowball', blindspot: 'The Blindspot',
  shadow: 'The Shadow', shelf: 'The Shelf', amnesia: 'The Amnesia', rogue: 'The Rogue Agent', overhead: 'Overhead',
};

export type ComicMode = 'page' | 'standalone';

const norm = (href: string) => href.replace(/[?#].*$/, '').replace(/\/?$/, '/');

/** The issue a story belongs to. */
export function issueOf(story: ComicStory): ComicIssue {
  const hit = comicIssues.find((i) => i.story.id === story.id);
  if (!hit) throw new Error(`Comic story "${story.id}" is not in src/data/comic-stories/index.ts`);
  return hit;
}
/** Where an issue opens: its -b page on the site, or its page in the standalone reader. */
export const issueHref = (issue: ComicIssue, mode: ComicMode) => (mode === 'standalone' ? `/comics/${issue.slug}/` : issue.bPage);
/** A NEXT choice's link in this mode: another comic's -b page becomes its reader page when standalone; A pages stay. */
export function choiceHref(href: string, mode: ComicMode): string {
  if (mode !== 'standalone') return href;
  const hit = comicIssues.find((i) => norm(i.bPage) === norm(href));
  return hit ? issueHref(hit, mode) + (href.match(/[?#].*$/)?.[0] ?? '') : href.startsWith('/') && !href.startsWith('/comics/') ? 'https://www.makingthings.work'+href : href;
}
/** Navigation uses registered panel crops for raster pages; standalone image paths pass through.
 * The shelf, Issues overlay and NEXT cards all share this resolver. */
export function artSrc(img: string, story: ComicStory): string {
  if (img.startsWith('/')) return img;
  const crop = navigationArt[img];
  if (crop) return crop;
  const sceneIn = (s: ComicStory) => s.scenes.find((sc) => sc.panels.some((p) => p.img === img));
  const owner = sceneIn(story) ? story : comicIssues.map((i) => i.story).find((s) => sceneIn(s)) ?? story;
  const scene = sceneIn(owner);
  if (scene?.art && !/\.svg$/i.test(scene.art)) {
    throw new Error(`Raster panel "${img}" in ${owner.id}/${scene.id} needs a registered navigation crop in navigation-art.ts`);
  }
  return `/comic/${owner.id}/${img}.svg`;
}
/** Keep the intended subject in navigation crops; unknown/legacy images retain the centred default. */
export function artPosition(img: string): string { return navigationPositions[img] ?? '50% 50%'; }
/** The previous and next issue, wrapping around. */
export function neighbours(issue: ComicIssue): { prev: ComicIssue; next: ComicIssue } {
  const i = comicIssues.indexOf(issue), n = comicIssues.length;
  return { prev: comicIssues[(i - 1 + n) % n], next: comicIssues[(i + 1) % n] };
}
