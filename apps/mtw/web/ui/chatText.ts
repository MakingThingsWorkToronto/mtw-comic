// Pure text helpers for the shared agent chat and voice input (no browser APIs, so they are unit-tested in node).

/** Join dictated text onto what is already typed, with one space between. */
export function appendDictation(current: string, spoken: string): string {
  const s = spoken.trim();
  if (!s) return current;
  if (!current) return s;
  return /\s$/.test(current) ? `${current}${s}` : `${current} ${s}`;
}

/** One line for the terminal; the agent's prompt submits on Enter, so line breaks become spaces. */
export const terminalLine = (text: string): string => text.replace(/\s*\n\s*/g, ' ').trim();

export interface ChatDraft { note: string; reply: string; chosen: string[] }
export const emptyChatDraft = (): ChatDraft => ({ note: '', reply: '', chosen: [] });
export const chatDraftKey = (operation: string, subject: string): string => `mtw-chat-draft:v1:${encodeURIComponent(operation)}:${encodeURIComponent(subject)}`;
export function parseChatDraft(raw: string | null): ChatDraft {
  try {
    const value = JSON.parse(raw ?? 'null') as Partial<ChatDraft> | null;
    if (!value || typeof value !== 'object') return emptyChatDraft();
    return { note: typeof value.note === 'string' ? value.note : '', reply: typeof value.reply === 'string' ? value.reply : '', chosen: Array.isArray(value.chosen) ? value.chosen.filter((id): id is string => typeof id === 'string') : [] };
  } catch { return emptyChatDraft(); }
}
/** An in-flight Send must never clear edits made after its captured snapshot. */
export function promptAfterSend(current: ChatDraft, sent: Pick<ChatDraft, 'note' | 'chosen'>): ChatDraft {
  return current.note === sent.note && JSON.stringify(current.chosen) === JSON.stringify(sent.chosen) ? { ...current, note: '', chosen: [] } : current;
}
export const replyAfterSend = (current: ChatDraft, sent: string): ChatDraft => current.reply === sent ? { ...current, reply: '' } : current;
