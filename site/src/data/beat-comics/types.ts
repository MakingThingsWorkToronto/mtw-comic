// Beat Comic story schema (skill: mtw-beat-comic; component: src/components/BeatComic.astro; engine:
// public/scripts/beat-comic.js). All timing is in beats of the song; the engine converts with 60 / bpm and the music's
// first-downbeat offset, so a story written against a beat map (scripts/analyze-song.mjs) stays on the music.

/** A panel rectangle as fractions of the stage's safe area: [x, y, w, h]. On portrait screens a page without a
 * full-width panel is transposed (columns become rows). */
export type Rect = [number, number, number, number];

export interface Panel {
  /** Beat, relative to the page, when the panel lands (its frame is inked and its art resolves from chunky pixels). */
  at: number;
  r: Rect;
  /** Optional rectangle for portrait screens, when neither the layout nor its transposition reads on a phone. */
  rp?: Rect;
  /** An image to pixelate and posterize to the four flat brand colours: `contain` for holograms, `cover` for photos.
   * The engine makes every image shimmer pixel by pixel and keeps it still (Matt, 2026-09-28: "keep still site wide but
   * add shimmer to pixels"; the one-pixel nod on the beat read as a bug). One kind per
   * page: a page's image panels are all cinematic photos or all holograms, never mixed (Matt, 2026-09-28: "if the basic
   * is a cinematic image then all boxes should use that"); `beat-comic-check.mjs` fails a page that mixes them. A panel
   * with a caption or a name bar uses a cinematic photo, `card('<service>')` or `photo('<starting point>')` from
   * sources.ts, never a hologram (`hero`), which sits letterboxed small under the label (Matt, 2026-09-28: "some box
   * images are hidden behind labels because we use the holo not the cinematic"); `beat-comic-audit.mjs` checks it. */
  img?: { src: string; fit: 'contain' | 'cover' };
  /** Pixel type: the first word paper, the rest teal-light, with a flat teal shadow. */
  pix?: string;
  /** Smaller pixel type (a subtitle panel). */
  small?: boolean;
  /** Draw the MTW mark as pixel art beside the type (above it in a tall panel). */
  mark?: boolean;
  /** With `pix`: the pixel type runs as an 8-bit scrolling marquee (the marquee's look: first word teal-light, the rest
   * paper, a flat ink shadow, teal rules), beside the MTW mark with `mark`. A landing page's cover shows its section
   * name this way in the main box, with `TRACK nn.` as pixel type in the box below it (Matt, 2026-09-28: "swap the
   * "Track 02" ... with the section name so the section name scrolls on a marquee and the "Track ##" is in the bottom
   * left"). */
  scroll?: boolean;
  /** A pixel bar chart that grows as the panel lands. */
  chart?: boolean;
  /** A pixel chat window (bubbles and a typing indicator) that fills in as the panel lands. */
  chat?: boolean;
  /** An 8-bit scrolling marquee of the story's track ("TRACK 02: AGENTIC SYSTEMS"); a string adds a segment after it. */
  marquee?: boolean | string;
  /** The sound box: an 8-bit marquee (Matt, 2026-09-27) shown from `at` to `until` whatever the sound state (Matt,
   * 2026-09-28). While the browser holds the music back or the visitor's sound setting is off it asks for a click (a tap
   * on touch screens) on the screen, which starts or unmutes the music; while the music is audible it says SOUND ON. */
  sound?: boolean;
  /** An old-school CD player display: TRACK and TIME in seven-segment digits and the track title scrolling as CD
   * text (the cover's full-width panel; Matt, 2026-09-27). */
  cd?: boolean;
  /** A slim CD-display strip across the panel's foot: the song's time and "TRACK nn * TITLE" scrolling (Matt, 2026-09-27). */
  ticker?: boolean;
  /** A counting figure: the pixel type becomes `fmt` with # = from + step x (beats since landing - after) / every, capped
   * at `to` (`fmt1` for 1), printed with thousands separators (6,000). It keeps counting while the scene holds (Matt,
   * 2026-09-27). A figure that climbs to a published number lands on it: the homepage's 6,000+ rolls up from 1,000+ and
   * 125+ from 115+ (Matt, 2026-09-28: "add count up on 6000+ box", "start animating 125+ sites at 115 and move up"). */
  count?: { from: number; step: number; every: number; after?: number; to?: number; fmt: string; fmt1?: string };
  /** Page beat at which the panel leaves (default: the page's end). */
  until?: number;
  /** Narration: a flat teal caption box, typed on. Never the panel's only content: every panel carries img, pix, chart,
   * chat or mark (a caption-only panel reads as an empty box; Matt, 2026-09-26). */
  cap?: string;
  /** A second caption (paper box, bottom right) landing at page beat `at2`: the punchline. */
  cap2?: string;
  at2?: number;
  /** A name bar along the panel's foot (the service grid). */
  name?: string;
  /** The ways in (Matt, 2026-09-28: "link the ways in boxes to their sections, so a user can click through"): the cell's
   * service page. The component lays a real link over the cell, outside the aria-hidden scenes, with `name` as its text;
   * it can be clicked, tapped or focused only while the cell shows, and following it plays the page transition and the
   * mixtape crossfade. Build it from the tracklist by the cell's name, never retyped; a landing page's own "N WAYS IN."
   * cell has none (it would link to the page it is on). An image panel without a name bar may link too (Matt,
   * 2026-09-28: the "Your turn." starting points "link those to something on the site"): its link covers the panel and
   * is named by its `cap`, and hover or focus lights the caption box. */
  href?: string;
  /** A small group label on the panel's top edge; use on the first of a group only. */
  tag?: string;
  /** A mixtape tracklist, the back of the CD (the homepage cover; Matt, 2026-09-28: "restyle the first scene on homepage
   * to reflect the tracklist", "journal should be a separate disk on the site playlist", "needs to look 8 bit", "the
   * same style as the marquee tracklist on the section pages"). Each row is a marquee strip (the landing covers'
   * renderer: first word teal-light, the rest paper, an ink shadow, teal rules on disc labels and landing tracks) in the
   * engine's pixel font at whole-pixel scale; the engine lays the rows out in columns broken only between groups,
   * choosing the layout by type size and evenness ("balance out the columns"); a name too long for its column scrolls.
   * Rows land one every 0.2 beat. The playing row (`now`) waits cued until `live`, then lights teal-light with a play
   * head blinking on the beat and the song's time. Every row with an `href` gets a real link over itself
   * (BeatComic.astro, outside the aria-hidden scenes), live from `live` until the page's cut; hover or focus lights the
   * row paper. `live` must come after the page's sound box leaves (`beat-comic-check.mjs`). Rows: playlistRows() in
   * playlist.ts, never retyped; the Tracklist dialog shows the same rows. */
  tracks?: { rows: TracklistRow[]; live?: number };
}

/** One row of a tracklist (`Panel.tracks` and the Tracklist overlay; build them with playlistRows() in playlist.ts). */
export interface TracklistRow {
  /** The track number ("02"), counted within its disc (each disc starts at 01); a disc label has none, and a row
   * without one under a disc is a note, drawn dimmest. */
  no?: string;
  /** The disc the row is on (1 the site, 2 the Journal; Matt, 2026-09-28: "journal should be a separate disk on the site
   * playlist"): a disc label's own number, or its track's. Track numbers repeat across discs, so the playing row and the
   * checks match on the disc too. */
  discNo?: number;
  title: string;
  /** The track's page; the row becomes a link. The playing row has none (it would link to the page it is on). */
  href?: string;
  /** A disc label ("Disc 2. The Journal."): a teal band that starts a disc, and may link. */
  disc?: boolean;
  /** A section's landing track: paper type, heading its services, with a teal rule above when it is not a column's first. */
  head?: boolean;
  /** The track playing: this page's own row. */
  now?: boolean;
}

export interface Sfx {
  /** Beat, relative to the page. Put slams on the beat map's accents. */
  at: number;
  /** The word, comic style: BAM!, POW!, WHAM! Pixel sprite on a jagged slab with speed lines. */
  w: string;
  /** One short line under the word. */
  sub?: string;
  /** Centre as fractions of the safe area (clamped so the slab stays on the page). */
  x: number;
  y: number;
  /** Rotation in degrees. */
  r?: number;
  /** Beats on screen (default 1.6). */
  len?: number;
  /** No speed lines and no boil: for a freeze-frame gag. */
  still?: boolean;
}

export interface Page {
  /** Start beat and length in beats. Put pages on the song's phrases. */
  b: number;
  l: number;
  /** Chapter card: flat type on the teal banner, flashed for one beat at the page start. */
  title?: string;
  ground?: 'ink' | 'teal';
  panels: Panel[];
  sfx?: Sfx[];
  /** Freeze frames, [from, to] in page beats: motion holds while the music stops dead. */
  freeze?: [number, number][];
  /** Campfire strength (embers and glow), default 1. */
  ember?: number;
  /** The grid grows into a field of swaying stalks; paper planes launch at page beat `planes`. */
  field?: boolean;
  planes?: number;
  /** The close: shows `closeScene` in the page's own hero layout. */
  close?: boolean;
}

export interface BeatComicStory {
  bpm: number;
  /** Loop length in beats: one pass of the song, rounded up to the bar. */
  beats: number;
  /** Beat the close page starts on. */
  close: number;
  music: { src: string; offset: number; credit: string; source: string };
  /** The page's own hero, where it sits: two heading lines (the second in the accent colour), then either the
   * homepage's glass panel (panelLead/panelAccent/panelText) or a lede and the hero image (lede, image).
   *
   * `pixelate` (the close through the ages; Matt, 2026-09-28: "take us from 8 bit to common pixels to 2026 pixels, this
   * is an animation through the ages of pixelation", "fade the section image in AFTER the font clarifies to beauty
   * text"): the heading lands as big boxy 8-bit pixels and, from this beat of the close (5 in a 12-beat close, 4 in 10,
   * 3 in 8; `true` = 5), resolves in clean stages a beat apart: 8-bit, 16-bit, the familiar pixels of a desktop screen,
   * then the page's own smooth type. The hero image (or the homepage's panel) fades in only after that, from half a beat
   * after the type is smooth.
   *
   * `layout: 'full-bleed'`: the page's hero is a full-bleed image behind its heading (a Journal entry, About Matt), not a
   * side image. The close then lays the image edge to edge under the header with the page hero's own ink gradient and
   * the crop the page gives it (its object-position, read from the page's hero image), and puts the heading and the lede
   * in the page title's column at the page heading's own size, so the fold lands on the same picture. The image follows
   * the same order: the type resolves, then the image fades in. */
  closeScene: { lines: [string, string]; pixelate?: boolean | number; layout?: 'side' | 'full-bleed'; panelLead?: string; panelAccent?: string; panelText?: string; lede?: string; image?: { src: string; width: number; height: number } };
  /** Play once and hold on the final freeze frame (the still slab stays) until the reader enters the page, instead of
   * looping with the song. */
  holdEnd?: boolean;
  /** With holdEnd: the campfire's embers keep rising on the held close. */
  holdLive?: boolean;
  /** The mixtape track: `track('<page path>')` from tracklist.ts, never retyped. Its disc (1 the site, 2 the Journal),
   * number within the disc and title, shown on the cover's CD ticker ("TRACK 05 * TITLE" on Disc 1, "DISC 2 * TRACK 01 *
   * TITLE" after it) and marquee, and matched to the playing row of the Tracklist. */
  track?: { disc?: number; no: string; title: string };
  /** With holdEnd: the High Scores board shown on the held "TO BE CONTINUED." (built with highScores() in high-scores.ts). */
  highScores?: HighScores;
  /** Selector of the element the stage folds into when the reader enters the page (its real hero panel). When that
   * element is part of the page's scroll reveal (`data-reveal`), the stage waits for it to begin its reveal (at most
   * 4 s) before handing over; on a page without the scroll reveal (a Journal entry: `.journal-entry-hero .page-title`)
   * it hands over as soon as the fold ends. */
  collapseTo: string;
  markPaths: { outline: string; m: string };
  pages: Page[];
}

/** One row of the High Scores board: an ironic player name for a service, linking to its page. */
export interface HighScoreEntry {
  player: string;
  service: string;
  href: string;
  /** Starting score; the engine keeps adding to it while the ending holds. */
  score: number;
}

export interface HighScores {
  /** Page through every entry (the homepage); otherwise one page of related services. */
  cycle: boolean;
  /** Centre the board under the held slab and clear the close's words (the homepage's arcade game-over screen). */
  center?: boolean;
  entries: HighScoreEntry[];
}
