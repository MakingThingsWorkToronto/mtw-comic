// Shapes shared by the soundtrack module's server and client. Origin: wiki/soundtrack-library/{sources,manifest,discovery}.json.

export type TrackStatus = 'approved' | 'candidate' | 'needs source' | 'withdrawn';

export interface BeatMap {
  bpm: number;
  beatSeconds: number;
  offset: number;
  duration: number;
  endBeat: number;
  loopBeats: number;
  loopSeconds: number;
  phraseLength: number;
  phrases: number[];
  stops: number[];
  hits: number[];
  medianLoudness?: number;
}

export interface TrackSummary {
  rmsDbfs: number;
  dynamicsDb: number;
  brightnessHz: number;
  bassShare: number;
  bandMean?: number[];
  feel: string;
  feelFit: Record<string, number>;
  hitPhaseBeats: number;
  onsetPhase12?: number[];
  onsetsPerSecond: number;
  kickOnBeat?: number;
  snareOnBeat?: number;
  introBeats: number;
}

export interface TrackDiscovery {
  run: string;
  rank: number;
  basis?: string;
  why?: string;
  cid?: boolean;
  moods?: string[];
  seconds?: number;
  popularity?: { views?: number; downloads?: number; likes?: number };
}

export interface Track {
  id: string;
  file: string;
  download?: string;
  provider: string;
  title: string;
  artist: string;
  source?: string;
  license?: string;
  licenseUrl?: string;
  genre?: string;
  published?: string;
  status: TrackStatus;
  approved?: string;
  approvedVia?: string;
  usedBy?: string[];
  rating?: number;
  note?: string;
  grid?: { bpm: number; offset: number };
  gridQuestion?: string;
  discovery?: TrackDiscovery;
  // Added by the manifest producer.
  credit?: { text: string; href: string | null } | null;
  asset?: { file: string; bytes: number; sha256: string } | null;
  beatMap?: BeatMap | null;
  summary?: TrackSummary | null;
  profile?: string | null;
  energy?: number[] | null;
}

export interface DiscoveryRequest {
  id: string;
  basis: string;
  title: string;
  artist: string;
  requested: string;
  by: string;
  status: 'open' | 'done';
  done?: string;
  found?: number;
}

export interface DiscoveryRun {
  id: string;
  label: string;
  date?: string;
  method?: string;
  basis?: string;
  request?: string | null;
  queries?: string[];
  read?: number;
  record?: string;
  added?: string[];
}

export interface Discovery {
  requests: DiscoveryRequest[];
  runs: DiscoveryRun[];
}

export interface Counts {
  tracks: number;
  approved: number;
  candidates: number;
  profiled: number;
}

export interface Library {
  bands: string[];
  counts: Counts;
  discovery: Discovery;
  tracks: Track[];
}

/** profiles/<id>.json, the heavy per-track measurements. */
export interface Profile {
  id: string;
  beatMap: BeatMap & { beats?: number[] };
  frequency: { data: string; frames: number; fps: number; bands: string[] };
  onsets: { kicks: number[]; snares: number[]; hats: number[] };
  summary: TrackSummary;
}

export type TrackAction = 'approve' | 'unapprove' | 'rate' | 'similar';

export interface TrackResult {
  track: Track;
  counts: Counts;
  discovery: Discovery;
  /** Whether the decisions.jsonl line was appended (a log failure never undoes the click). */
  logged: boolean;
  /** The request id when this click created one. */
  requestId?: string;
}

export interface MediaRef {
  path: string;
  href?: string;
  sha256?: string;
}

export interface ComicAudioRecord {
  id: string;
  type: string;
  title: string;
  characterId?: string;
  character?: string;
  characters?: string[];
  provider: string;
  voiceId?: string;
  media?: MediaRef | null;
  original?: MediaRef | null;
  receipt?: MediaRef | null;
  normalizedReceipt?: MediaRef | null;
  encodedReceipt?: MediaRef | null;
  monoReceipt?: MediaRef | null;
  durationSeconds?: number | null;
  text?: string | null;
  settings?: unknown;
  delivery?: unknown;
  status: string;
  productionApproved: boolean;
  hearingReview?: string;
  /** Plain-words description, searchable; the producer writes one for every clip. */
  description?: string;
  /** Matt's decision: approved unless he rejected it (comic-audio-review.json). */
  approval?: 'approved' | 'rejected';
  approvalDecided?: { at: string | null; by: string } | null;
  kind?: string;
  room?: string;
  integratedLufs?: number | null;
  truePeakDbfs?: number | null;
  measurements?: { measurementBasis?: string } | null;
  uses?: unknown[];
  durationBoundSeconds?: number;
  sourceRefs?: { story?: string; scene?: string; img?: string; panel?: number; balloon?: number }[];
  runtime?: { path: string; href: string; functionSource?: string } | null;
  reproduction?: string;
}

export interface ComicAudio {
  counts: Record<string, number>;
  records: ComicAudioRecord[];
}

export const BAND_NAMES = ['Sub', 'Bass', 'Low-mid', 'Mid', 'Up-mid', 'Pres', 'Brill', 'Air'] as const;
