// Character chat: the shared agent chat bound to comics-character-feedback, beside a character's page, to tweak its
// appearance (Codex generates any new art) and its voice profile (Matt still chooses the voice).
import { api } from '../../../web/api';
import { AgentChat } from '../../../web/ui/AgentChat';
import type { ChatPreset } from '../../../web/ui/AgentChat';

export const CHARACTER_FEEDBACK = 'comics-character-feedback';
const SCOPES = { appearance: 'Appearance', voice: 'Voice' };

let cache: Promise<ChatPreset[]> | null = null;
const loadCharacterPresets = (): Promise<ChatPreset[]> =>
  (cache ??= api.get<{ presets: ChatPreset[] }>('/api/comics/character-fix-presets').then((r) => r.presets, (e) => ((cache = null), Promise.reject(e))));

export function CharacterChat({ id }: { id: string }) {
  return (
    <AgentChat
      label="Feedback for this character"
      title="Tweak this character"
      operation={CHARACTER_FEEDBACK}
      subject={`cast:${id}`}
      placeholder="Explain what to change about how they look or sound. Or press the mic and say it."
      hint="Codex generates any new art; you still choose the voice."
      loadPresets={loadCharacterPresets}
      scopeLabels={SCOPES}
      launch={(req) => api.post<{ id: string }>(`/api/comics/cast/${encodeURIComponent(id)}/feedback`, req)}
    />
  );
}
