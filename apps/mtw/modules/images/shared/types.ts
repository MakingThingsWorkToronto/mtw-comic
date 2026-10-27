// Migrated from retired git 51eb6e03:wiki/image-library/browser.js (record and treatment shapes, L1-60) and manifest.json.
// Shared by the server, the web views and the static snapshot bundle: no node or DOM imports here.

export interface Treatment {
  path?: string;
  sha256?: string;
  bytes?: number;
  width?: number;
  height?: number;
  format?: string;
  mode?: string | null;
  status?: string;
  note?: string;
  sourceName?: string;
  metadata?: string;
  [key: string]: unknown;
}

export interface TourVersion {
  version: number;
  data?: string;
  preview?: string;
  review?: { playback?: string; [key: string]: unknown };
  [key: string]: unknown;
}

export interface Tour {
  id: string;
  currentVersion: number;
  versions: TourVersion[];
}

export interface ImageRecord {
  id: string;
  logicalId?: string | null;
  collection: string;
  title: string;
  description: string;
  service: string;
  category: string;
  sourceName?: string;
  treatments: Record<string, Treatment>;
  references?: string[];
  relatedDiagrams?: string[];
  tour?: Tour;
  tourVariants?: Tour[];
  retainedFrom?: string;
  status?: string;
  userApproved?: boolean;
  rejectionReason?: string;
  publicUse?: string;
  selectedReference?: unknown;
  selectionAuthority?: unknown;
  [key: string]: unknown;
}

export interface ManifestFile {
  destination: string;
  sha256: string;
  bytes: number;
  role?: string;
}

export interface ManifestCounts {
  collections: Record<string, number>;
  diagramsByStyle?: Record<string, { present: number; missing: number }>;
  [key: string]: unknown;
}

export interface Manifest {
  schemaVersion?: number;
  styleNames: Record<string, string>;
  counts: ManifestCounts;
  records: ImageRecord[];
  files: ManifestFile[];
  [key: string]: unknown;
}

/** Typed badge state mapped from the free-string treatment status. The raw string is always kept. */
export type ReviewState = 'reviewed' | 'draft' | 'unreviewed' | 'rejected' | 'selected' | 'approved' | 'reference' | 'evidence' | 'missing';

export interface Card {
  id: string;
  title: string;
  service: string;
  category: string;
  collection: string;
  /** The treatment style shown on the card. */
  style: string;
  /** Null when the shown style has no file (a gap). */
  treatment: { path: string; sha: string; w?: number; h?: number; format?: string; bytes?: number; status: string; state: ReviewState } | null;
  /** Raw status of the shown style even when no file exists. */
  status: string;
  state: ReviewState;
  treatmentCount: number;
  styles: string[];
  hasTour: boolean;
  decision?: DecisionState;
}

export type DecisionKind = 'approved' | 'rejected' | 'selected';
export interface DecisionState {
  kind: DecisionKind;
  version?: string;
  style?: string;
  scope?: string;
  reason?: string;
  at: string;
}

export interface Facet {
  value: string;
  count: number;
}
export interface Facets {
  collections: Record<string, number>;
  categories: Facet[];
  services: Facet[];
  styles: Facet[];
  statuses: Facet[];
  styleNames: Record<string, string>;
  /** Diagram coverage per style (present/missing), from the manifest counts: the retired console's coverage strip. */
  diagramsByStyle?: Record<string, { present: number; missing: number }>;
}

export interface CardQuery {
  collection?: string;
  q?: string;
  category?: string;
  service?: string;
  style?: string;
  status?: string;
  gaps?: boolean;
  sort?: 'newest' | 'oldest' | 'title';
  offset?: number;
  limit?: number;
}

export interface VersionEntry {
  /** `v<N>` when unambiguous in the family, else the 8-character content hash. */
  token: string;
  n: number | null;
  recordId: string;
  style: string;
  path: string;
  sha256: string;
  sha8: string;
  status: string;
  state: ReviewState;
  bytes?: number;
  width?: number;
  height?: number;
  /** The record's own live treatment for this style. */
  live: boolean;
  /** The version a reader gets from `@current`. */
  current: boolean;
  kind: 'live' | 'archive' | 'retained';
}

export interface EvidenceItem {
  path: string;
  sha: string;
  bytes: number;
  group: string;
  name: string;
}

export interface RecordDetail {
  record: ImageRecord;
  /** Version chain per style. */
  versions: Record<string, VersionEntry[]>;
  decisions: DecisionEntry[];
  decision?: DecisionState;
  styleNames: Record<string, string>;
  /** Linked records (references, related diagrams) with their titles. */
  linked: { id: string; title: string; kind: 'reference' | 'related' | 'family' }[];
  integration?: Record<string, string>;
}

export interface DecisionEntry {
  id: string;
  at: string;
  action: string;
  subject: string;
  actor: string;
  value?: { style?: string; scope?: string; reason?: string };
  note?: string;
}

/**
 * Decisions live in wiki/image-library/decisions.jsonl. The producer (maintain_library.py) skips a library-root
 * decisions.jsonl, so appends never enter files[] and never fail refresh, verify or register.
 */
export const DECISIONS_LIB = 'image-library';

export const COLLECTION_ORDER = ['diagrams', 'icons', 'originals', 'scenes', 'comics', 'earlier'] as const;
export const COLLECTION_LABEL: Record<string, string> = {
  diagrams: 'Diagrams',
  icons: 'Icons',
  originals: 'Originals',
  scenes: 'Scenes',
  comics: 'Comics',
  earlier: 'Earlier and experiments',
  experiments: 'Experiments',
};
/** The four permanent styles come first in selectors and comparisons; extras (svg-glass ...) follow. */
export const PERMANENT_STYLES = ['svg-flat', 'svg-outline', 'holographic', 'photorealistic'] as const;
