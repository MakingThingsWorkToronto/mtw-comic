// Display rules for chosen, held and production-selected voices (mirrors casting.chosen / casting.selected on the server).
import type { BadgeStatus } from '../../../web/ui';
import type { CastRow, VoiceView, ClipView } from './types';

/** A held choice is still the displayed choice; keep other stored takes in history. */
export function chosenClips(clips: ClipView[], choice: { voiceId: string; provider: string } | null): ClipView[] {
  return choice ? clips.filter(c => c.voiceId === choice.voiceId && (c.provider ?? 'ElevenLabs') === choice.provider) : clips;
}

export interface VoiceBadge { status: BadgeStatus; label: string }

/** A chosen voice that is held shows as pending with the preview-review wording; a production-selected one as approved. */
export function chosenBadge(voice: { held?: boolean } | null): VoiceBadge | null {
  if (!voice) return null;
  return voice.held ? { status: 'pending', label: 'held for preview review' } : { status: 'approved', label: 'selected' };
}

export function voiceStateBadge(v: VoiceView): VoiceBadge {
  if (v.state === 'selected') return chosenBadge(v) as VoiceBadge;
  if (v.state === 'rejected') return { status: 'rejected', label: 'rejected' };
  if (v.state === 'option') return { status: 'pending', label: 'preview' };
  return { status: 'candidate', label: v.state };
}

export type VoiceFilter = '' | 'selected' | 'held' | 'shortlisted' | 'unvoiced';

/** 'selected' = production-eligible choice; 'held' = chosen but held; 'shortlisted' = shortlist and no choice; 'unvoiced' = neither. */
export function matchesVoiceFilter(c: Pick<CastRow, 'voice' | 'voiceUse' | 'shortlist'>, filter: string): boolean {
  switch (filter) {
    case 'selected': return !!c.voice && !c.voice.held;
    case 'held': return !!c.voice?.held;
    case 'shortlisted': return c.shortlist > 0 && !c.voice;
    case 'unvoiced': return !c.voice && !c.voiceUse;
    default: return true;
  }
}

const day = (iso: string): string => iso.slice(0, 10);
const KIND: Record<string, string> = { chosen: 'Chosen', held: 'Chosen, held', rejected: 'Rejected' };

/** One compact line per history event: "2026-10-10 Rejected Voice name (Provider): reason". */
export function timelineLine(e: { at: string; kind: string; name: string; provider: string; reason?: string }): string {
  return `${day(e.at)} ${KIND[e.kind] ?? e.kind} ${e.name} (${e.provider})${e.reason ? `: ${e.reason}` : ''}`;
}
