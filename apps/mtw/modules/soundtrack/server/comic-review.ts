// Matt's approve/reject decisions for comic audio. Every clip is approved unless he rejects it; a decision is saved in
// comic-audio-review.json (an input of the comic-audio producer), the producer rebuilds comic-audio.json so the record's
// `approval` changes, and the click is logged to decisions.jsonl. The projection itself is never hand-edited.
import { HttpError } from '../../../server/router';
import type { Services } from '../../types';
import { comicPrefix } from '../prefix';
import type { ComicAudioRecord } from '../types';
import { LIB } from './library';
import type { ComicAudioStore } from './resolver';

export const REVIEW_FILE = `${LIB}/comic-audio-review.json`;
export const COMIC_PRODUCER = '.claude/skills/mtw-soundtrack/scripts/comic-audio.mjs';
export type Approval = 'approved' | 'rejected';

export interface ReviewFile {
  schemaVersion: 1;
  about?: string;
  decisions: Record<string, { approval: Approval; at: string; by: string }>;
}

const ABOUT = 'Matt\'s approve/reject decisions for comic audio, written by MTW Studio (/m/soundtrack/comic). A clip with no entry is approved. Read by comic-audio.mjs; do not hand-edit comic-audio.json.';

export interface ReviewDeps {
  services: Services;
  comic: ComicAudioStore;
  /** The soundtrack store's write queue, so a decision never interleaves with intake or another click. */
  enqueue<T>(fn: () => Promise<T>): Promise<T>;
  now?: () => Date;
  /** Rebuilds comic-audio.json; the real one runs the producer. */
  rebuild?: () => Promise<{ code: number; stderr: string }>;
}

export function reviewComicAudio(deps: ReviewDeps, body: unknown): Promise<{ record: ComicAudioRecord; logged: boolean }> {
  const msg = (body ?? {}) as { id?: unknown; approval?: unknown };
  if (typeof msg.id !== 'string' || !msg.id) throw new HttpError(400, 'id is required');
  if (msg.approval !== 'approved' && msg.approval !== 'rejected') throw new HttpError(400, 'approval is approved or rejected');
  const id = msg.id;
  const approval: Approval = msg.approval;
  const { services } = deps;
  const rebuild = deps.rebuild ?? (() => services.wiki.runProducer('node', [COMIC_PRODUCER, 'build']));

  return deps.enqueue(async () => {
    const before = await deps.comic.read();
    const record = before.records.find((r) => r.id === id);
    if (!record) throw new HttpError(404, `no comic audio record ${id}`);
    const exists = await services.wiki.exists(REVIEW_FILE);
    const previous = exists ? await services.wiki.readText(REVIEW_FILE) : null;
    const review: ReviewFile = previous ? (JSON.parse(previous) as ReviewFile) : { schemaVersion: 1, about: ABOUT, decisions: {} };
    review.decisions = { ...review.decisions, [id]: { approval, at: (deps.now ? deps.now() : new Date()).toISOString(), by: 'matt' } };
    await services.wiki.writeJson(REVIEW_FILE, review);
    const r = await rebuild();
    if (r.code !== 0) {
      // The catalog must agree with the decision file: put the old decisions back and report.
      if (previous !== null) await services.wiki.writeText(REVIEW_FILE, previous);
      else await services.wiki.writeJson(REVIEW_FILE, { ...review, decisions: Object.fromEntries(Object.entries(review.decisions).filter(([k]) => k !== id)) });
      throw new HttpError(500, `not saved: comic-audio.json rebuild failed: ${r.stderr.trim().split('\n')[0] || `exit ${r.code}`}`);
    }
    const after = await deps.comic.read();
    const updated = after.records.find((x) => x.id === id) ?? { ...record, approval };
    const logged = await services.decisions
      .append('soundtrack-library', { actor: 'matt', module: 'soundtrack', subject: `${comicPrefix(record.type)}:${id}`, action: approval === 'approved' ? 'approve' : 'reject' })
      .then(
        () => true,
        () => false,
      );
    return { record: updated, logged };
  });
}
