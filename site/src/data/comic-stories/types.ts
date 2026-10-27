// Comic Story schema (Comic B; skill: mtw-comic-story; facts: wiki/site/comic-story.md). A dark comic told on inked
// pages revealed box by box (no camera), balloons timed to a song. All timing is in beats of the song: the engine converts with
// 60 / bpm and the music's first-downbeat offset, so a story written against a beat map stays on the music.

/** A rectangle as fractions of the page: [x, y, w, h]. Authored on a 16:9 page; the engine maps it onto the whole window
 * edge to edge (x and y scale independently, the art is sliced to fit), and on phones and squarish windows it reflows
 * the boxes into portrait pages (1-2 columns, reading order kept), so `r` only needs to read on a wide screen. */
export type Rect = [number, number, number, number];

/** Recurring cast (wiki/site/comic-story.md). */
export type CastId =
  | 'matt' | 'claude' | 'codex'
  | 'dana' | 'marco' | 'ruth' | 'sam' | 'joan' | 'potvin'
  | 'slop' | 'hallucination' | 'snowball' | 'blindspot' | 'shadow' | 'shelf' | 'amnesia' | 'rogue' | 'overhead'
  | 'grok' | 'copilot' | 'opencode' | 'frontier-league' | 'local-crew'
  | 'narrator' | 'second-brain';

/** Reviewed mouth and protected face in normalized full-source image coordinates.
 * The reader maps these through the selected crop and responsive fit. */
export type ComicSpeakerAnchors = Partial<Record<CastId, { mouth: [number, number]; face: Rect }>>;

/** Sound, scored like a film (Matt, 2026-10-04: "Score plus effects feel free to use music where you want"): mostly quiet,
 * invented effects on the page's events, the song only where it lifts the story. Every effect is synthesized by the engine
 * (Web Audio, no files), so none is borrowed: buzz (a phone vibrating), ring (a phone ringing), paper (a rustle or a
 * flood of pages), keys (typing), click (a mouse, a send button), whoosh (something fast past the camera), impact (a hit,
 * a door slammed, something falling), glass (a crack or a break), alarm (a building or system alarm), door (a door or an
 * elevator opening), heartbeat (dread, two low thumps), sting (a low orchestral hit for a reveal or a turn), transit (one short passing road/rail rumble, not a bell loop). */
export type SfxKind = 'buzz' | 'ring' | 'paper' | 'keys' | 'click' | 'whoosh' | 'impact' | 'glass' | 'alarm' | 'door' | 'heartbeat' | 'sting' | 'transit';
/** Continuous depicted ambience; `none` deliberately removes a previous room. */
export type RoomTone = 'office' | 'servers' | 'street' | 'rain' | 'none';

export interface Sfx {
  kind: SfxKind;
  /** Beats after the box reveals (default 0). */
  delay?: number;
  /** Loudness 0-1 (default 0.7). */
  gain?: number;
}

/** Exact saved utterance for its written balloon; production approval is managed upstream. No provider API at playback. */
export interface BalloonSpeech {
  id: string;
  /** Local integration URL, rewritten with other media src fields in file-review mode. */
  src: string;
  /** Measured encoded recording duration in seconds; must fit the existing read/focus window. */
  durationSeconds: number;
  provider: string;
  /** Actual voice identity; narrated setup/intros may use second-brain without changing written who. */
  characterId: CastId;
  /** Saved normalized voice gain, 0-1; default 1. */
  gain?: number;
}

export interface Balloon {
  /** Beat, relative to the scene, when the balloon appears. */
  at: number;
  /** Optional saved words start with the first typed glyph (+0.3s); absent remains silent. */
  speech?: BalloonSpeech;
  /** The engine letters first, then draws the shape around the composed lettering, by the measured recipe
   * (.claude/skills/mtw-comic-story/assets/reference-balloons/report.md; the skill's assets/balloon-style.json). Only the kinds the reference
   * comics use (root, 2026-09-29, the measured usage table):
   * - speech: a superellipse hugging the text with a short tapered tail spliced into its outline; also chains, butted
   *   (`edge`), across panels, breakout, off-panel (a long thin tail), device (a tail to the screen), weak (a zigzag
   *   tail) and menace (a red wavy second outline), chosen by `state`;
   * - thought: the accepted yellow thought balloon with a bead stem toward the thinker (Matt’s dated exception);
   *   no cloud thought outline;
   * - burst: a jagged shout of straight spikes (Bangers); `state: 'scream'` fills it red, `'panic'` letters it in heavy
   *   italic (AllTime #15);
   * - fear: a spooked or shaken voice, a scalloped speech balloon (Matt's fear balloon, as the Avengers page draws it);
   * - caption and place: square yellow narration/place boxes (teal for `characterIntro`) with a thin black rule, butted into a box corner and stacked.
   * 'whisper' and 'machine' are deprecated: drawn as speech, and the checker and deslop lint fail them. */
  kind: 'speech' | 'thought' | 'burst' | 'fear' | 'caption' | 'place' | 'machine' | 'whisper';
  /** Identifying character caption: brand teal, with the same caption opacity and geometry. */
  characterIntro?: boolean;
  /** Keep a caption at its authored position instead of stacking it in a corner. */
  anchor?: 'free';
  /** Opening company/work/trouble/stakes caption: brand teal, anchored bottom right after lettering is measured. */
  sceneSetup?: boolean;
  who: CastId;
  /** Upper-case is applied by CSS; write in sentence case with Canadian spelling. Keep to about 12 words. A "\n" is a
   * composed line break and wins; without one the engine composes the lines itself (about 9 characters a line, never a
   * word broken). The browser never wraps lettering. */
  text: string;
  /** Balloon anchor (its top-left) as fractions of the panel. */
  x: number;
  y: number;
  /** Width as a fraction of the panel (default 0.34). */
  w?: number;
  /** Where the tail points, as fractions of the panel (the speaker's mouth; for an off-panel voice, a point on the box edge).
   * Speech, fear and burst; a thought uses the approved yellow balloon with a bead stem. */
  tail?: [number, number];
  /** Phone-only geometry after illustrated review; caption/place paragraph reflow keeps raw words, emphasis and voice. */
  phone?: { x?: number; y?: number; w?: number; tail?: [number, number]; anchor?: 'free'; chain?: boolean; reflow?: 'paragraph' };
  /** Deprecated with the machine balloon (2026-09-28). */
  steered?: boolean;
  /** Who or what is talking, which decides the kind (the balloon-usage table in the skill's lettering reference): calm
   * speech, an off-panel voice, a device or chat voice (an ordinary balloon whose tail runs to the screen), a weak voice,
   * menace, inner thought, a shout, a scream, panic, fear (spooked, shaken), narration. The checker fails a kind that does
   * not match (calm, offpanel, device, weak, menace: speech; thought: thought; shout, scream, panic: burst; fear: fear;
   * narration: caption or place). */
  state?: 'calm' | 'offpanel' | 'device' | 'weak' | 'menace' | 'thought' | 'shout' | 'scream' | 'panic' | 'fear' | 'narration';
  /** Emphasize one word or phrase (bold italic, as 80s lettering does). */
  em?: string;
  /** Let the balloon break out of its box across the border and gutter for dramatic effect (Matt, 2026-09-28: "you can
   * have chat bubbles overflow their boxes for dramatic effect"). Default false. When true, x, y and w may run past 0-1
   * (x and y from -0.3 to 1.3; the engine keeps the balloon on the page) and it is drawn above the borders. Rare: 1-2 an
   * issue, for a villain's line or the mentor's. */
  breakout?: boolean;
  /** Join this balloon to the previous balloon in the same box (the same speaker's follow-up) by a short neck, as the
   * references do; it needs no tail of its own. */
  chain?: boolean;
  /** Continue this line in the next panel: joined by a connector across the gutter to the last speech balloon of the
   * previous box in the scene (Avengers, crops/ref-40.png). It needs no tail of its own. */
  across?: boolean;
  /** Butt the balloon or caption flush against that edge of its box (the border cuts it), as the references do. */
  edge?: 'top' | 'left' | 'right' | 'bottom';
}

/** Small deterministic effects on art only, at this panel's focus; absent means still. */
export interface PanelMotion {
  preset: 'still' | 'push' | 'drift-left' | 'drift-right' | 'shadow' | 'light';
  /** Story beats, bounded to 2-8; default 4. */
  beats?: number;
  /** Intensity 0-1; default 0.5. */
  strength?: number;
}

/** Full-page raster planes share aspect and coordinates; ordered back to front, with genuine foreground alpha. */
export interface ComicArtLayer {
  id: string;
  src: string;
  role: 'background' | 'humans' | 'agents' | 'props' | 'light';
  opacity?: number;
}
/** Each plane moves independently on the existing story clock. Lettering and paper remain fixed. */
export interface LayerMotion extends Omit<PanelMotion, 'preset'> {
  layerId: string;
  preset: PanelMotion['preset'] | 'projection' | 'sprout' | 'travel' | 'vibrate';
  /** Isolated props only. Offsets in full-source width/height, each within -1 to 1; one pass, then hold. */
  from?: [number, number];
  to?: [number, number];
  /** Genuine prop alpha bounds in full-source coordinates; motion stays inside the decoded visible crop.
   * For travel, omitted beats follows the whole existing focus window with constant source-pixel speed. */
  sourceBounds?: Rect;
  /** Isolated ringing prop only, source-width displacement within 0-.012; returns to its source pose. */
  amplitude?: number;
  /** Projection-only, genuine agent RGBA: subtle alpha-masked upward line/dot band; source colour stays clear. */
  fabrication?: true;
  /** Light-plane-only, bottom-to-top stepped construction/learning reveal; 2-16 authored floors. */
  floors?: number;
  /** Optional independently authored light plane, numbered bottom-to-top within floors (default 8). */
  floorIndex?: number;
  /** Eligible indexes; omitted means all. Reduced motion never reveals excluded future floors. */
  activeFloors?: number[];
  /** Already saved eligible floors remain lit before focus and on rewind/replay. */
  retainedFloors?: number[];
  /** Existing story action supplying this floor's content; identity/style sheets are not lifecycle sources. */
  floorSource?: { sceneId: string; panelId: string };
}

/** Ordered hard cuts, relative to panel reveal. Full sources/crops are contained, never stretched.
 * Every source remains versioned in the canonical library; src points to its exact integration copy. */
/** Native source identity. Encoded aliases use the maintained source/output receipt contract. */
export interface ComicArtAuthority {
  panelId: string;
  path: string;
  sha256: string;
  recordId: string;
  treatment: string;
  deliveryBindings?: Array<{
    publicPath: string;
    sha256: string;
    encoderReceipt: { path: string; sha256: string; sourcePath: string; sourceSha256: string; outputPath: string };
  }>;
}
export interface ComicArtSource {
  speakers?: ComicSpeakerAnchors;
  /** Other visible heads, in native-source coordinates; reserves for lettering, never voiced cast. */
  protectedFaces?: Rect[];
  /** Explicit responsive source/group fit; omitted preserves legacy placement. */
  fit?: 'cover' | 'contain';
  src: string;
  ar?: Rect;
  /** Same canonical image, with distinct container encodings; no alternate scene or evidence. */
  alternates?: string[];
  canonicalSource?: ComicArtAuthority;
  phone?: { src?: string; ar?: Rect; alternates?: string[]; canonicalSource?: ComicArtAuthority; fit?: 'cover' | 'contain'; speakers?: ComicSpeakerAnchors; protectedFaces?: Rect[] };
}
/** Registered full-canvas plane; current usage panelId is distinct from immutable source ownership. */
export interface ComicAgentPlacement {
  /** Reviewed genuine alpha silhouette in the full native source, including its edge pixels. */
  sourceROI: Rect;
  /** Destination inside the actual panel; the background continues to cover its existing viewport. */
  slot: Rect;
  fit: 'contain';
  /** Only these source anchors belong to the independently placed digital pixels. */
  speakerIds: string[];
  phone?: Omit<ComicAgentPlacement, 'phone'>;
}
export interface ComicViewLayer extends ComicArtLayer {
  alternates?: string[];
  canonicalSource: ComicArtAuthority;
  /** Opt-in only for isolated digital agents. Physical contact and combined cast need authored placement. */
  agentPlacement?: ComicAgentPlacement;
  /** Genuine isolated physical prop or architectural light plane, fitted independently from the room. */
  propPlacement?: {
    sourceROI: Rect;
    slot: Rect;
    fit: 'contain';
  };
}
export interface ComicPanelView extends ComicArtSource {
  /** Atomic same-canvas group, back to front. Missing planes make this view unavailable. */
  layers?: ComicViewLayer[];
  /** Uses the panel clock plus this view's at; floor reveals require real earlier source anchors. */
  layerMotion?: LayerMotion[];
  id: string;
  /** Beats after this panel's at. First is 0; strictly increasing; each view has at least one beat. */
  at: number;
  alt: string;
  /** Omitted applies on both layouts; other layouts retain original page/plane artwork. */
  media?: 'phone' | 'desktop';
}

export interface ComicPanel {
  /** Reviewed anchors for original scene artwork; source/view overrides take precedence. */
  speakers?: ComicSpeakerAnchors;
  /** Explicit original page/scene-plane fit; omitted preserves legacy art-reserve containment. */
  artFit?: 'cover' | 'contain';
  /** Beat, relative to the scene, when this box fades up from its configured 30% ghost (the reveal; boxes reveal in reading order).
   * The reader needs time to read the previous box's balloons first (comic-story-check.mjs enforces it). */
  at: number;
  r: Rect;
  /** With raster page art (the scene's `art`): this box's region on that page, [x, y, w, h] as fractions of the art
   * (default `r`). `r` is then the box's place in the window like any issue's (full screen, reflowed on phones), and the
   * engine scales the region to cover the box, so keep the two shapes close (Matt, 2026-10-04: "all be full screen ...
   * scaling the boxes creating desktop and mobile views"). */
  ar?: Rect;
  /** Selected complete static source for this box. Owns its base even if cuts or encodings fail;
   * superseded page/plane pixels stay hidden. All-source failure displays a missing-art status. */
  staticArt?: ComicArtSource & { ar: Rect; canonicalSource: ComicArtAuthority };
  /** Complete first layer group to retain while a later cut decodes/fails. References are same-panel,
   * media-eligible canonical groups at zero; loading/missing first groups remain visibly unavailable. */
  fallbackView?: { desktop: string; phone: string };
  /** Fraction of excess crop taken from each edge, like object-position: 0 starts, 1 ends, 0.5 centers.
   * This never changes image proportions. Author only after reviewing protected subjects with final lettering. */
  cropFocus?: { phone?: [number, number]; page?: [number, number] };
  /** Contain the full source region in this phone-panel rectangle, reserving room for lettering. */
  phoneArt?: Rect;
  /** Image id: the engine fetches and inlines /comic/<story id>/<img>.svg (integration copy of
   * wiki/image-library/assets/scenes/comic-b/). Art is real SVG (Matt, 2026-09-28: "crisp vector"): top-level groups carry
   * data-layer="bg|mid|fig|light|fx" and data-depth (0-1 parallax), and optional data-fx="rain|flicker|brain" groups.
   * Rain groups may set data-loop (user units per loop, default a tenth of the viewBox height); brain groups light their
   * [data-floor] children in floor order, one per beat. A value starting with "/" is a path under site/public/ used as is
   * (tests; a raster path is shown as an image rather than inlined). */
  img?: string;
  /** What the art shows, for alt text and for the art brief. One or two sentences. */
  alt: string;
  /** Deprecated and ignored (2026-09-28: "the page reveal replaces the camera"): the camera focus of the first build. */
  focus?: [number, number, number];
  /** Deprecated and ignored (the page reveal replaces the camera): the camera drift of the first build. */
  drift?: [number, number, number];
  /** No border (crisp; the art simply ends). */
  open?: boolean;
  /** An id for this box, so a cascade's insets can name it as their `host`. */
  id?: string;
  /** A cascade inset (Crisis #8's stepped column; Matt, 2026-09-28: "position the og background properly ... sequentially
   * reveal those as overlays"): the id of the host box whose art is the background. The inset sits inside the host,
   * reveals after it and after the previous inset of the cascade, and steps diagonally so only gutter bands touch. */
  host?: string;
  /** A run of small boxes that animates a character in steps (Matt, 2026-09-28: "it is good to use many small boxes if
   * you can animate the character via quick intros"; Spider-Man #33's strained 2 x 3, Crisis's stepped column). Boxes with
   * the same run id reveal in fast succession (half a beat to a beat apart; a box with balloons still gets its reading
   * time) and may be equal in size. */
  run?: string;
  /** Run off the window on the page edges this box touches (no margin and no border there). Default: the page keeps a
   * clean, even margin like a printed comic (about 3.5% of the short side). */
  bleed?: boolean;
  /** A polygon in box fractions ([x, y] points, clockwise) cutting the box, e.g. a diagonal; the border follows the cut and
   * the neighbouring box's polygon should leave the gutter along it. */
  clip?: Array<[number, number]>;
  /** The box overlaps the box beneath it (its rect may overlap another box's), with a heavier border and a small paper
   * margin, drawn above. Art may break any border with a data-layer="break" group, drawn outside the clip. */
  inset?: boolean;
  /** Deprecated and ignored (2026-09-28: no engine-drawn overlays). Motion inside a box comes only from the art's own
   * data-fx groups (rain, flicker, brain floors) or not at all. */
  fx?: Array<'rain' | 'flicker' | 'brain' | 'grain' | 'shimmer' | 'grey' | 'breathe'>;
  /** Art only: never transform lettering, paper, gutters or panel borders. */
  motion?: PanelMotion;
  layerMotion?: LayerMotion[];
  /** Optional reading/content/reaction cuts; overrides scene planes in this box only.
   * Retain essential evidence in staticArt or scene.art fallback. Reduced motion preserves hard content cuts. */
  views?: ComicPanelView[];
  /** Desktop art reserve in panel fractions, contained without cropping; lettering occupies the remaining space. */
  pageArt?: [number, number, number, number];
  balloons: Balloon[];
  /** Sound effects this box makes, at its reveal plus `delay` (2026-10-04). One or two at most; a quiet box has none. */
  sfx?: Sfx[];
  /** Continuous ambience from this focused reveal through the next focus; absent inherits scene.room. */
  room?: RoomTone;
}

export interface ComicScene {
  id: string;
  /** Start beat of the scene in the song, and its length in beats. Scenes sit on phrases. */
  b: number;
  l: number;
  /** Additional non-speech art-reading beats after existing reading/speech end, before exit/bar rounding.
   * Optional finite 0-32; absent or zero preserves the existing timetable. Never a fabricated speech duration. */
  artHoldBeats?: number;
  /** Chapter caption shown on the full-page reveal, e.g. "Chapter one: the quote." */
  title?: string;
  /** The scene goes on in the same place at the same moment as the previous one, so it needs no place caption of its
   * own. Every other scene opens with a `place` caption saying where and when (Matt, 2026-10-04: "anchor the stories to
   * a place and time"; the checker fails a scene without one). */
  continues?: boolean;
  /** How loud the song is under this scene, 0-1 (default 0: no music). The engine fades between scenes' levels over two
   * beats. Use music where it lifts the story (the turn, the fight back, the landing), silence where the story is quiet,
   * and keep at least one scene in three without it (Matt, 2026-10-04: "it is kind of annoying at times"). */
  score?: number;
  /** The room tone under the scene, quiet and continuous (2026-10-04): an office at night (HVAC and a far printer),
   * servers (fans and hum), a street (traffic, a streetcar far off), rain on glass, or none. Default none. */
  room?: RoomTone;
  /** Villains this scene fields (for the check and the rogues' gallery). */
  villains?: CastId[];
  /** Generated page art. An extensionless absolute stem such as /comic/home/home-quote-20261008 loads the
   * configured AVIF/WebP width variants. `ar` crops each drawn region while `r` places it in the responsive reader.
   * A .svg path preserves legacy whole-page SVG support. Without `art`, each panel loads its own `img`. */
  art?: string;
  /** Available page fallback encodings; omitted preserves the AVIF/WebP legacy pair. */
  artFormats?: ('avif' | 'webp')[];
  /** Same-aspect decoded full-page planes; art remains the retained fallback if a plane cannot load. */
  layers?: ComicArtLayer[];
  /** Additional source inset as percent of the image's short side (0-5). Zero uses the measured ar exactly;
   * absent retains the shared inset used by legacy artwork. */
  artCropInsetPct?: number;
  /** Optional phone pages. Rectangles tile each unit page before gutters and entries preserve panel order.
   * Every non-inset panel img occurs exactly once; overrides with insets are unsupported. Absent uses legacy reflow. */
  phonePages?: Array<Array<{ img: string; r: Rect }>>;
  /** Phone-only minimum page canvas height in CSS pixels. Rich scenes retain
   * several readable boxes on one comic page with native vertical scrolling. */
  phonePageHeight?: number;
  /** Usable phone page width used to author phonePageHeight. When present,
   * the canvas scales with actual usable width to preserve source crops. */
  phonePageReferenceWidth?: number;
  /** Desktop paper aspect ratio. Bounds the page within the available viewport;
   * individual boxes still fill their artwork edge to edge. */
  pageAspect?: number;
  /** Deprecated and ignored. Boxes simply fade in reading order; retained only for older story data. */
  exit?: 'ink' | 'scratch' | 'tear' | 'fade';
  /** A rapid few beats: the only time a page may split into equal boxes (Matt, 2026-09-28: "don't use proportional
   * sizing in scenes, comic books never do this unless it's a rapid few sections"). At most one rapid scene an issue. */
  rapid?: boolean;
  /** Beats, relative to the scene, where the frame drains to grey except teal and holds (the song's dead stops). */
  hold?: Array<[number, number]>;
  panels: ComicPanel[];
}

export interface ComicChoice {
  /** The "NEXT:" line, e.g. "Next: the Shadow gets into the files." */
  label: string;
  /** Where it goes: another -b page, or the A page when its B page does not exist yet. Write the -b page; in the
   * standalone reader (/comics/) the component maps a -b page to its /comics/<slug>/ issue through the registry
   * (src/data/comic-stories/index.ts), and A pages open as they are. */
  href: string;
  /** A panel image for the choice card: resolved like ComicPanel.img (/comic/<story id>/<img>.svg, or a "/" path), and
   * shown as an <img>, not inlined. */
  img: string;
  villain?: CastId;
}

export interface ComicStory {
  /** Folder name under /comic/, e.g. 'home'. */
  id: string;
  /** The issue number and title on the cover, e.g. 1 and 'The night shift.' */
  issue: number;
  title: string;
  bpm: number;
  /** Total story beats (may run past the song when music.loop is set; the story does not repeat, it holds on NEXT). */
  beats: number;
  /** Ghost opacity for this issue's boxes before their story is told (default: the skill's page-constants
   * ghostOpacity; ?ghost= overrides for review). */
  ghost?: number;
  /** The balloon look, one per issue (the measured references): 'marvel' (default: rounded-rectangle balloons,
   * superellipse n 3.5, captions #eae619) or 'crisis' (fat ovals, n 2.3, cream captions #f9ddb6). */
  look?: 'marvel' | 'crisis';
  /** The page ground: dark by default (Matt, 2026-09-28: "use dark by default please"); 'paper' for newsprint. */
  theme?: 'dark' | 'paper';
  /** The song. Issues run longer than their song (Matt, 2026-09-28: "these scenes will be 2-4x longer than the 8 bits ...
   * loop the music and sync it to box changes"): story beats count on past the song's end and map into `loop`, a region
   * in song beats on phrase boundaries (default: from beat 0 to the last whole phrase of 16 beats in the file), so box
   * reveals and balloons stay on the beat across loops. */
  music: { src: string; offset: number; credit: string; source: string; loop?: { from: number; to: number } };
  scenes: ComicScene[];
  /** Optional local decoded ambience loops; loading/errors retain synthesized beds. No provider API in playback. */
  soundAssets?: { rooms?: Partial<Record<Exclude<RoomTone, 'none'>, { src: string; gain?: number }>> };
  /** The closing "NEXT:" page: beat it starts on, and the choices. */
  next: { b: number; heading: string; choices: ComicChoice[];
    /** Closing score through the unchanged NEXT entrance (1.5 beats); missing preserves legacy sound. */
    sound?: { score: number; room: RoomTone; fadeBeats?: number };
  };
  /** Deprecated (2026-09-28: the comic is the -b page's header, in flow; nothing folds away). Ignored. */
  collapseTo?: string;
}

/** One issue in the registry (src/data/comic-stories/index.ts): the single place that maps a story to its routes. */
export interface ComicIssue {
  /** URL slug in the standalone reader: /comics/<slug>/. */
  slug: string;
  story: ComicStory;
  /** The Comic B page on the site, e.g. '/home-b/'. */
  bPage: string;
  /** The A page it retells (canonical for the B page and the reader), e.g. '/'. */
  aPage: string;
  /** The issue's cover art (an image id resolved like ComicPanel.img). */
  cover: string;
  /** The headline villain (data only: never rendered; villains are announced by the trouble they cause). */
  villain: CastId;
  /** One line of trouble for the shelf and the Issues overlay; never names a villain. */
  hook: string;
  /** False until the issue is verified: its -b page and reader page show a dark holding frame ("Being inked."). */
  ready: boolean;
}
