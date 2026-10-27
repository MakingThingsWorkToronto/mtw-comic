// Shared storage types (client and server). Pure data; no Node imports.

export type Vertical = 'comics' | 'images' | 'audio' | 'journal' | 'site';
/** What makes an asset set harder to maintain. */
export type Category = 'duplicates' | 'orphans' | 'older' | 'rebuild' | 'oversized' | 'screens';
export type FileAction = 'archive' | 'delete-derivative' | 'transcode';

export interface PlanFileResult {
  status: 'archived' | 'deleted' | 'restored' | 'skipped' | 'failed' | 'transcoded';
  archivedTo?: string;
  /** Transcode: the new versioned file written next to the original (the original stays). */
  outputPath?: string;
  sha256Verified?: boolean;
  at?: string;
  note?: string;
}

export interface PlanFile {
  /** Repo-relative, forward slashes. */
  path: string;
  bytes: number;
  sha256: string;
  reason: string;
  action: FileAction;
  /** True when the file can be rebuilt from canonical sources (derivatives only). */
  regenerable?: boolean;
  /** Human exclusion from the approval. */
  excluded?: boolean;
  result?: PlanFileResult;
}

export interface SkippedFile {
  path: string;
  reason: string;
}

export interface ProviderPlan {
  files: PlanFile[];
  /** Files not hashed yet (duplicate checks run in the background); they are left out until hashed. */
  pending?: number;
  savings: number;
  skipped: SkippedFile[];
}

export interface ProviderInfo {
  id: string;
  vertical: Vertical;
  label: string;
  category: Category;
  describe: string;
  reportOnly: boolean;
  /** Tunable day thresholds etc. */
  params: { name: string; label: string; default: number }[];
}

/** One planable target of a provider with its current savings. */
export interface ReductionRow {
  providerId: string;
  vertical: Vertical;
  providerLabel: string;
  target: string;
  targetLabel: string;
  category: Category;
  files: number;
  bytes: number;
  skipped: number;
  reportOnly: boolean;
  /** The row can launch the owning module's register procedure. */
  register?: boolean;
  pending?: number;
}

export type PlanStatus = 'draft' | 'approved' | 'executing' | 'executed' | 'partial' | 'cancelled';

export interface PlanApproval {
  at: string;
  decisionId: string;
  planHash: string;
  files: number;
  bytes: number;
}

export interface Plan {
  schemaVersion: 1;
  id: string;
  title: string;
  providerId: string;
  vertical: Vertical;
  target: string;
  params: Record<string, number>;
  status: PlanStatus;
  createdAt: string;
  files: PlanFile[];
  skipped: SkippedFile[];
  approval?: PlanApproval;
  execution?: { terminalId: string; startedAt: string; finishedAt?: string; summary?: string; archiveDir?: string };
  restore?: { terminalId: string; startedAt: string; summary?: string };
  notes?: string[];
}

export interface PlanSummary {
  id: string;
  title: string;
  vertical: Vertical;
  providerId: string;
  target: string;
  status: PlanStatus;
  createdAt: string;
  files: number;
  bytes: number;
}

export interface KindTotals {
  image: number;
  audio: number;
  video: number;
  data: number;
  other: number;
}

export interface RootFootprint {
  id: string;
  label: string;
  path: string;
  bytes: number;
  files: number;
  kinds: KindTotals;
}

export interface NodeFootprint {
  bytes: number;
  files: number;
}

export interface GitFootprint {
  available: boolean;
  packBytes: number;
  looseBytes: number;
  packs: number;
  objects: number;
  human: string;
}

export interface CodeReport {
  /** Source files under apps/ and site/scripts (node_modules, build output and state excluded). */
  files: number;
  bytes: number;
  large: { path: string; lines: number }[];
  duplicateNames: { name: string; paths: string[] }[];
}

export interface HashProgress {
  running: boolean;
  done: number;
  total: number;
}

export interface ScanResult {
  generatedAt: string;
  durationMs: number;
  roots: RootFootprint[];
  /** Directory path (repo-relative) to totals, depth-limited, small folders omitted. */
  nodes: Record<string, NodeFootprint>;
  largest: { path: string; bytes: number }[];
  git: GitFootprint;
  code: CodeReport;
  reductions: ReductionRow[];
  archiveRoot: string;
}

export interface StorageConfig {
  archiveRoot: string;
  defaults: Record<string, number>;
}

export interface PlanDetail {
  plan: Plan;
  includedFiles: number;
  includedBytes: number;
  planHash: string;
  /** Plan changed since it was approved. */
  approvalStale: boolean;
  terminal?: { id: string; status: 'running' | 'exited'; exitCode?: number };
  archiveRoot: string;
}
