// Review chat: the shared agent chat bound to journal-review, beside a candidate or entry page. Matt reviews, asks for
// changes and states his decisions in its terminal; the agent records them through Studio's decide route.
import { AgentChat } from '../../../web/ui/AgentChat';
import type { ChatPreset } from '../../../web/ui/AgentChat';
import { jget, jpost } from './useJournal';

export const REVIEW_OPERATION = 'journal-review';
const SCOPES = { candidate: 'Candidate', interview: 'Interview', draft: 'Draft', assets: 'Assets', decision: 'Decision' };

let cache: Promise<ChatPreset[]> | null = null;
const loadPresets = (): Promise<ChatPreset[]> =>
  (cache ??= jget<{ presets: ChatPreset[] }>('/review-presets').then((r) => r.presets, (e) => ((cache = null), Promise.reject(e))));

export function ReviewChat({ subject, kind }: { subject: string; kind: 'candidate' | 'entry' }) {
  return (
    <AgentChat
      label={kind === 'candidate' ? 'Review this candidate' : 'Review this entry'}
      title={kind === 'candidate' ? 'Review this candidate' : 'Work on this entry'}
      operation={REVIEW_OPERATION}
      subject={subject}
      placeholder={
        kind === 'candidate'
          ? 'Ask for sharper headlines, a counter-position or a thinness check, or say you approve or reject it. Or press the mic and say it.'
          : 'Ask for the next interview round, a draft revision or cover ideas, or state your decision. Or press the mic and say it.'
      }
      hint="One session per item: keep typing into it. Your decisions are recorded only when you state them."
      loadPresets={loadPresets}
      scopeLabels={SCOPES}
      launch={(req) => jpost<{ id: string }>('/review', { subject, ...req })}
    />
  );
}
