// Replaces the in-browser window.MTW_LIBRARY of wiki/image-library/data.js: the manifest is loaded once on the
// server, indexed, and re-loaded when manifest.json changes (ETag = manifest sha256). The browser never gets the whole manifest.
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { DecisionLog } from '../../types';
import { buildIndex, computeFacets, matchEntries, shownStyle, toCard } from '../shared/filter';
import type { IndexEntry, Overlay } from '../shared/filter';
import { parseImgRef } from '../shared/refs';
import { effectiveDecisions } from '../shared/decisions';
import { DECISIONS_LIB } from '../shared/types';
import { buildEvidence, queryEvidence } from '../shared/evidence';
import type { Card, CardQuery, DecisionEntry, DecisionState, EvidenceItem, Facets, ImageRecord, Manifest } from '../shared/types';
import { FamilyIndex, pickVersion, versionsOf } from '../shared/versions';
import type { VersionEntry } from '../shared/types';

export const IMAGE_EXT = new Set(['.png', '.svg', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.tif', '.tiff', '.bmp', '.ico']);

export interface Loaded {
  manifest: Manifest;
  etag: string;
  index: IndexEntry[];
  byId: Map<string, { record: ImageRecord; entry: IndexEntry }>;
  family: FamilyIndex;
  /** sha256 -> first registered image destination (library-relative). Registered files are immutable. */
  bySha: Map<string, { path: string; bytes: number }>;
  evidence: EvidenceItem[];
  loadedAt: number;
}

const CHECK_EVERY_MS = 400;

export class Catalog {
  readonly libraryRoot: string;
  private loaded: Loaded | null = null;
  private signature = '';
  private lastCheck = 0;
  private pending: Promise<Loaded> | null = null;
  private overlayCache: { sig: string; overlay: Map<string, DecisionState>; entries: DecisionEntry[] } | null = null;

  constructor(readonly repoRoot: string, private decisions?: DecisionLog, libraryRel = 'wiki/image-library') {
    this.libraryRoot = path.join(repoRoot, ...libraryRel.split('/'));
  }

  get manifestPath(): string {
    return path.join(this.libraryRoot, 'manifest.json');
  }

  /** Current index; re-reads the manifest when its size or mtime changed (cheap stat, at most every 400 ms). */
  async ensure(): Promise<Loaded> {
    const now = Date.now();
    if (this.loaded && now - this.lastCheck < CHECK_EVERY_MS) return this.loaded;
    if (this.pending) return this.pending;
    this.pending = (async () => {
      try {
        const st = await fs.stat(this.manifestPath);
        const sig = `${st.size}:${st.mtimeMs}`;
        if (!this.loaded || sig !== this.signature) {
          this.loaded = await this.load();
          this.signature = sig;
        }
        this.lastCheck = Date.now();
        return this.loaded;
      } finally {
        this.pending = null;
      }
    })();
    return this.pending;
  }

  private async load(): Promise<Loaded> {
    const bytes = await fs.readFile(this.manifestPath);
    const manifest = JSON.parse(bytes.toString('utf8')) as Manifest;
    const etag = createHash('sha256').update(bytes).digest('hex');
    const index = buildIndex(manifest.records);
    const byId = new Map<string, { record: ImageRecord; entry: IndexEntry }>();
    manifest.records.forEach((record, i) => byId.set(record.id, { record, entry: index[i] as IndexEntry }));
    const bySha = new Map<string, { path: string; bytes: number }>();
    for (const r of manifest.records) {
      for (const t of Object.values(r.treatments)) if (t.path && t.sha256 && !bySha.has(t.sha256)) bySha.set(t.sha256, { path: t.path, bytes: t.bytes ?? 0 });
    }
    const evidence = buildEvidence(manifest.files ?? []);
    for (const e of evidence) if (!bySha.has(e.sha)) bySha.set(e.sha, { path: e.path, bytes: e.bytes });
    return { manifest, etag, index, byId, family: new FamilyIndex(manifest.records), bySha, evidence, loadedAt: Date.now() };
  }

  /** Latest decision per record, by class: approve/reject beats select (decisions.jsonl; the manifest is never edited). */
  async overlay(): Promise<{ overlay: Overlay; entries: DecisionEntry[] }> {
    if (!this.decisions) return { overlay: new Map(), entries: [] };
    let sig = 'none';
    try {
      const st = await fs.stat(path.join(this.repoRoot, 'wiki', DECISIONS_LIB, 'decisions.jsonl'));
      sig = `${st.size}:${st.mtimeMs}`;
    } catch {
      /* no decisions yet */
    }
    if (this.overlayCache?.sig === sig) return this.overlayCache;
    const list = (await this.decisions.list(DECISIONS_LIB)).filter((d) => d.module === 'images');
    const entries: DecisionEntry[] = list.map((d) => ({ id: d.id, at: d.at, action: d.action, subject: d.subject, actor: d.actor, ...(d.value ? { value: d.value as DecisionEntry['value'] } : {}), ...(d.note ? { note: d.note } : {}) }));
    this.overlayCache = { sig, overlay: effectiveDecisions(entries), entries };
    return this.overlayCache;
  }

  async cards(query: CardQuery): Promise<{ total: number; items: Card[]; etag: string }> {
    const l = await this.ensure();
    const { overlay } = await this.overlay();
    const hits = matchEntries(l.index, query, overlay);
    const offset = Math.max(0, query.offset ?? 0);
    const limit = Math.min(200, Math.max(1, query.limit ?? 60));
    const style = query.style && query.style !== 'all' ? query.style : undefined;
    const items = hits.slice(offset, offset + limit).map((e) => toCard((l.byId.get(e.id) as { record: ImageRecord }).record, e, style, overlay));
    return { total: hits.length, items, etag: l.etag };
  }

  async facets(collection?: string, category?: string): Promise<Facets> {
    const l = await this.ensure();
    const { overlay } = await this.overlay();
    return computeFacets(l.index, l.manifest, { ...(collection ? { collection } : {}), ...(category ? { category } : {}), overlay });
  }

  async record(id: string): Promise<{ record: ImageRecord; entry: IndexEntry; loaded: Loaded } | null> {
    const l = await this.ensure();
    const hit = l.byId.get(id);
    return hit ? { ...hit, loaded: l } : null;
  }

  async versions(id: string): Promise<Record<string, VersionEntry[]>> {
    const hit = await this.record(id);
    if (!hit) return {};
    const out: Record<string, VersionEntry[]> = {};
    for (const style of hit.entry.keys) {
      const chain = versionsOf(hit.loaded.family, hit.record, style);
      if (chain.length) out[style] = chain;
    }
    return out;
  }

  /** Resolve `{id, style?, version}` to the exact file, or null. Never throws for unknown ids. */
  async resolveFile(ref: string): Promise<{ record: ImageRecord; style: string; version: VersionEntry | undefined; treatmentPath: string; sha: string } | null> {
    const parsed = parseImgRef(ref);
    if (!parsed) return null;
    const hit = await this.record(parsed.id);
    if (!hit) return null;
    const style = parsed.style ?? shownStyle(hit.entry, undefined);
    const chain = versionsOf(hit.loaded.family, hit.record, style);
    const version = pickVersion(chain, parsed.version);
    if (!version) return null;
    return { record: hit.record, style, version, treatmentPath: version.path, sha: version.sha256 };
  }

  evidenceQuery(opts: { q?: string; group?: string; offset?: number; limit?: number }, l: Loaded): ReturnType<typeof queryEvidence> {
    return queryEvidence(l.evidence, opts);
  }
}

export { effectiveDecisions };
