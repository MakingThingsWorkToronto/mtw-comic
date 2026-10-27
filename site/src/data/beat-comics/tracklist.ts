// The mixtape's tracklist (Matt, 2026-09-27: "i think we need a track number for all the service landing and service
// pages as well"). Every page that gets a Beat Comic plays its disc, track number and title on the cover's CD display.
// Two discs (Matt, 2026-09-28: "journal should be a separate disk on the site playlist"), each numbered from its own
// Track 01:
//   - Disc 1, the site: the site's own service order (the contact form's), each landing page then its services, and
//     About Matt appended as Track 19 so no number changed.
//   - Disc 2, the Journal: the published Journal entries in the order of the months they cover (December 2025 onward);
//     a new entry is appended, so no number changes. Each title is the entry's own (`title` in its data;
//     beat-comic-audit.mjs checks it against the entry).
// The one source of truth for both discs: playlist.ts builds the rows from it, MotionToolbar.astro steps Previous and
// Next through it (Disc 1, then Disc 2, wrapping round), and the checks import it. Keep this file free of imports so
// the checks can load it as it is (Node strips the types).
export interface Track { disc: number; no: string; path: string; title: string }
export interface Disc { no: number; title: string; href?: string; tracks: Track[] }

const disc1: [string, string][] = [
  ['/', 'Making Things Work'],
  ['/agentic-systems/', 'Agentic Systems'],
  ['/agentic-systems/second-brain/', 'Second Brain'],
  ['/agentic-systems/agentic-team-modernization/', 'Agentic Team Modernization'],
  ['/agentic-systems/agentic-cost-planning/', 'Agentic Cost Planning'],
  ['/agentic-systems/agentic-devops-scaling/', 'Agentic DevOps & Scaling'],
  ['/agentic-systems/agent-ready-websites/', 'Agent-Ready Websites'],
  ['/traditional-systems/', 'Traditional Systems'],
  ['/traditional-systems/roles-access-control/', 'Roles & Access Control'],
  ['/traditional-systems/roadmaps-cloud-planning/', 'Roadmaps & Cloud Planning'],
  ['/traditional-systems/information-governance-ai-readiness/', 'Information Governance & AI Readiness'],
  ['/traditional-systems/intranet-collaboration/', 'Intranet & Collaboration'],
  ['/traditional-systems/power-platform-logic-apps/', 'Power Platform & Logic Apps'],
  ['/traditional-systems/custom-software-development/', 'Custom Software Development'],
  ['/data-migrations/', 'Data & Migrations'],
  ['/data-migrations/migration-planning/', 'Migration Planning'],
  ['/data-migrations/m365-migrations/', 'M365 Migrations'],
  ['/data-migrations/azure-migrations/', 'Azure Migrations'],
  // Track 19, the last on Disc 1 (Matt, 2026-09-28: "about matt also needs the 8 bit"): appended so no number changes.
  ['/about-matt/', 'About Matt'],
];

// Disc 2, the Journal (Matt, 2026-09-28: "when done this please do all journal entries next", "are you ready to start on
// disk 2?"): one track per published entry with a Beat Comic, in covered-month order.
const disc2: [string, string][] = [
  ['/journal/second-brain-needs-an-owner/', 'A second brain needs an owner to build it'],
  ['/journal/agents-build-the-tools-they-work-with/', 'Agents build the tools they work with'],
  ['/journal/every-generated-document-needs-a-rubric/', 'Standardize document generation quality with a rubric'],
  ['/journal/reference-code-makes-agent-builds-faster/', 'Reference code makes agent builds faster'],
  ['/journal/agents-report-is-not-evidence/', "An agent's report is not evidence"],
];

const number = (disc: number, list: [string, string][]): Track[] => list.map(([path, title], i) => ({ disc, no: String(i + 1).padStart(2, '0'), path, title }));

export const discs: Disc[] = [
  { no: 1, title: 'The site.', tracks: number(1, disc1) },
  { no: 2, title: 'The Journal.', href: '/journal/', tracks: number(2, disc2) },
];

/** Every track, Disc 1 then Disc 2: the order the mixtape plays (Previous and Next step through it and wrap round). */
export const tracklist: Track[] = discs.flatMap((d) => d.tracks);

/** The track for a page path: `{ disc, no, title }`. Throws on a page without one, so a new comic cannot ship
 * unnumbered. */
export function track(path: string): { disc: number; no: string; title: string } {
  const t = tracklist.find((x) => x.path === path);
  if (!t) throw new Error(`No mixtape track for ${path}: add it to src/data/beat-comics/tracklist.ts`);
  return { disc: t.disc, no: t.no, title: t.title };
}

/** How a track is named in words and on the CD display: "Track 05" on Disc 1 (unchanged), "Disc 2, Track 01" after it. */
export function trackLabel(t: { disc?: number; no: string }): string {
  return (t.disc || 1) > 1 ? `Disc ${t.disc}, Track ${t.no}` : `Track ${t.no}`;
}
