// Plain-English tooltips for the Journal's launch buttons. Each says what happens when the job starts; the ids
// are internal keys and never shown.
const SUMMARY: Record<string, string> = {
  'journal-discover': 'looks through your recent work, sessions and bookmarks, ranks what to write next and adds the best ideas to the candidate list. It publishes nothing',
  'journal-ingest': 'reads one outside source of ideas and writes a dated record of what it found. It never posts, likes or follows anything on X',
  'journal-ingest-all': 'reads every outside source of ideas in turn and writes a dated record for each. It never posts, likes or follows anything on X',
  'journal-source': 'turns the newest reading record into updates to the list of voices and the industry framing, and says which Journal ideas each finding could strengthen',
  'journal-recommend': 'ranks the next entries to write from your commits, sessions and bookmarks and saves the ranking as a dated proposals file. Nothing is interviewed, drafted or published',
  'journal-interview': 'interviews you about the chosen idea and records your answers word for word',
  'journal-draft': 'writes the entry from its finished interview, then checks the draft against the writing rubric. It does not approve or publish anything',
  'journal-cover': 'makes five cover concepts, saves them in the image library and stops so you can choose one',
  'journal-assets': 'makes the diagrams this entry needs and checks them by eye',
  'journal-publish': 'builds the entry page from the approved draft and checks it. It asks you for a yes before anything goes live',
  'journal-open-entry': 'sets up the entry for an approved headline: its folder with drafted questions, a queue row and a link back to the idea',
  'journal-record-answers': 'files the answers you typed into the right interview notes',
  'journal-record-approval': "writes your approval into the entry's files. It does not publish",
  'journal-record-cover': "marks your chosen cover in the entry's cover notes. The other covers are kept",
  'journal-reject': 'moves the rejected ideas to the Rejected list with your reason. Nothing is deleted',
  'journal-reopen': 'moves a rejected idea back into the queue and keeps its history',
  'journal-review': 'reviews one idea or entry with you in a terminal beside this page',
  'llm-column-claude-solo': 'drafts one LLM Journal column entry written by Claude about working on this site, ready for your moderation',
  'llm-column-codex-solo': 'drafts one LLM Journal column entry written by Codex about working on this site, ready for your moderation',
  'llm-column-joint': 'drafts one joint LLM Journal column entry with a section from Claude and a section from Codex, ready for your moderation',
};

/** "Opens a terminal where an agent ..." sentence for starting a Journal job. */
export function startsHelp(id: string, title: string): string {
  const what = SUMMARY[id];
  return what
    ? `Opens a terminal where an agent ${what}. You can watch it and answer its questions there.`
    : `Opens a terminal where an agent carries out "${title}". You can watch it and answer its questions there.`;
}

/** Tooltip for a button that opens the set-up window for a job (nothing starts yet). */
export function setupHelp(id: string, title: string): string {
  const what = SUMMARY[id];
  return `Opens a window to set up "${title}" before anything starts.${what ? ` When you start it, an agent ${what}.` : ''}`;
}
