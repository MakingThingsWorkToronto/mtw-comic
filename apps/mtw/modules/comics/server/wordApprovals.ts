// Matt approves balloon words before a character has a voice (2026-10-11). Such an approval is stored with an empty
// provider and voice; the library still calls the row "unvoiced", so the routes show it as approved through this check,
// and choosing the character's voice binds every such approval to that voice (ComicsStore.selectVoice), so the speech
// generation gate only ever sees voice-bound approvals.

export interface WordReview { id: string; status?: string; voiceId?: string; provider?: string; textSha256?: string; storySource?: { path?: string; sha256?: string } }
export interface WordRow { id: string; textSha256: string; storySource: { path: string; sha256: string } }

/** Pure: an approval of these exact words in this exact story file, made before any voice was chosen. */
export function wordsApproved(review: WordReview | undefined, row: WordRow, nowHash: string | null | undefined): boolean {
  return !!review && review.status === 'approved' && !review.voiceId && review.textSha256 === row.textSha256 && !!nowHash && review.storySource?.sha256 === nowHash;
}

/** Pure: show unvoiced rows whose words Matt approved as approved (everything else unchanged). */
export function applyWordApprovals<T extends { id: string; state: string }>(rows: T[], reviews: WordReview[], derived: Map<string, WordRow>, sourceNow: Record<string, string | null | undefined>): T[] {
  const byId = new Map(reviews.map((r) => [r.id, r]));
  return rows.map((r) => {
    if (r.state !== 'unvoiced') return r;
    const d = derived.get(r.id);
    return d && wordsApproved(byId.get(r.id), d, sourceNow[d.storySource.path]) ? { ...r, state: 'approved' } : r;
  });
}

/** Pure: bind a character's voiceless approvals to its newly chosen voice. Returns how many were bound. */
export function bindWordApprovals(reviews: WordReview[], characterId: string, provider: string, voiceId: string): number {
  let n = 0;
  for (const r of reviews as (WordReview & { characterId?: string })[]) {
    if (r.characterId === characterId && !r.voiceId) {
      r.provider = provider;
      r.voiceId = voiceId;
      n++;
    }
  }
  return n;
}
