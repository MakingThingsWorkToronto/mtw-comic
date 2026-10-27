// The site playlist as tracklist rows (skill: mtw-beat-comic): one list for the homepage cover's tracklist panel
// (`Panel.tracks`) and the Tracklist overlay every Beat Comic opens from its dock (BeatComic.astro), so the two are the
// same rows in the same 8-bit marquee style. It is the comics' global navigation (Matt, 2026-09-28: "i am trying to give
// this global navigation", "this will be the perm way to stay in the 8-bit experience").
//   - Disc 1 is the site: every Disc 1 track of tracklist.ts in order (19 since About Matt joined as Track 19), never
//     retyped. A top-level page heads a group: each section's landing page heads its services (Matt: "you can highlight
//     the section landing pages over the service pages"), and a top-level page without services (About Matt) is a group
//     of its own, drawn like them.
//   - Disc 2 is the Journal (Matt, 2026-09-28: "journal should be a separate disk on the site playlist"): its label links
//     to the Journal, and its tracks are the entries with a Beat Comic, numbered from their own Track 01.
// The current page's row is the one playing, with no link (it would link to the page it is on); every other row links
// to its page. Every row carries its disc number (`discNo`), since each disc numbers from 01.
import type { TracklistRow } from './types';
import { discs } from './tracklist';

const topLevel = (path: string) => /^\/[^/]+\/$/.test(path);

export function playlistRows(current: string): TracklistRow[] {
  const here = current.endsWith('/') ? current : `${current}/`;
  return discs.flatMap((d): TracklistRow[] => [
    { disc: true, discNo: d.no, title: `Disc ${d.no}. ${d.title}`, ...(d.href && d.href !== here ? { href: d.href } : {}) },
    ...d.tracks.map((t): TracklistRow => ({ discNo: d.no, no: t.no, title: t.title, ...(t.path === here ? { now: true } : { href: t.path }), ...(d.no === 1 && topLevel(t.path) ? { head: true } : {}) })),
  ]);
}
