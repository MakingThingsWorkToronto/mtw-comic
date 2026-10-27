// Home "Running": other sessions' claims, read deterministically from the two coordination files.
//   discussion/handoff/STATUS.md   newest-first bullets: "- **<HOLDER ...> <SCOPE> (<time>):** <body>"
//   wiki/operations/leases.json    [{ path, holder, reviewByUtc?, until?, releaseRequired? }]
// Pure parsing only: no text is summarised or rewritten, and nothing is dumped; Home shows holder, scope, state and age.

export type ClaimState = 'claim' | 'released' | 'request' | 'hold' | 'note';

export interface StatusClaim {
  /** Who wrote it: the leading speaker ("CLAUDE", "HOME ROOT", "CODEX CAST", ...). */
  holder: string;
  /** Who it is addressed to, for "X TO Y" / "X → Y" entries. */
  to?: string;
  /** The bold title without holder, addressee and time. */
  scope: string;
  state: ClaimState;
  /** ISO time when the title carries one (date-only titles are noon UTC of that day). */
  at?: string;
  /** Repo paths the body names (first 20), for ownership matching. */
  paths: string[];
  /** Whole entry text, used only for ownership matching (never shown). */
  text: string;
  /** The title carries only a date (no time): show the date, not an age. */
  dateOnly?: true;
  /** "No files claimed" appears in the body. */
  noFiles: boolean;
}

export interface LeaseRow {
  path: string;
  holder: string;
  reviewByUtc?: string;
  until?: string;
  releaseRequired: boolean;
  /** reviewByUtc is in the past (the lease still applies; review is overdue). */
  overdue: boolean;
  /** until is in the past: Studio's lease checker ignores it. */
  expired: boolean;
}

const KNOWN_HOLDERS = /^(CLAUDE|CODEX|HOME|GLASS|MATT|ROOT|TO)\b/i;

/** "2026-10-12T02:45Z", "2026-10-11 21:34UTC", "2026-10-11T23:37:46.031569+00:00", "2026-10-11" -> ISO, else undefined. */
export function parseStatusTime(s: string): string | undefined {
  const m = /(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?\s*(Z|UTC|[+-]\d{2}:?\d{2})?)?/.exec(s);
  if (!m) return undefined;
  const [, day, hh, mm, ss, tz] = m;
  if (!hh) return `${day}T12:00:00.000Z`;
  const zone = !tz || tz === 'Z' || tz === 'UTC' ? 'Z' : tz.length === 5 ? `${tz.slice(0, 3)}:${tz.slice(3)}` : tz;
  const t = Date.parse(`${day}T${hh}:${mm}:${ss ?? '00'}${zone}`);
  return Number.isFinite(t) ? new Date(t).toISOString() : undefined;
}

function stateOf(title: string, body: string): ClaimState {
  const t = title.toUpperCase();
  if (/\bRELEASED\b|\bCOMPLETE[D]?\b|\bAPPLIED\b|\bDONE\b|\bCLOSED\b|\bLANDED\b|\bPUSHED\b|\bWIRED\b/.test(t)) return 'released';
  if (/\bHOLD\b|\bPAUSED?\b|\bBLOCKED\b|\bREJECTED\b|\bRETAINED\b/.test(t)) return 'hold';
  if (/→|\bTO\s+(?:CLAUDE|CODEX|HOME|GLASS|PEERS?|INCOMING|ROOT|MATT|VILLAIN|ALL)\b/.test(t)) return 'request';
  if (/\bCLAIMS?\b|\bACTIVE\b|\bTAKEOVER\b|\bOWN(S|ERSHIP)?\b/.test(t) || /^Exact files:/i.test(body.trim())) return 'claim';
  return 'note';
}

/** Split "CLAUDE CAST VILLAIN (t-1) → HOME ROOT: MODEL HANDBACK" into holder, addressee and scope. */
function splitTitle(raw: string): { holder: string; to?: string; scope: string } {
  const title = raw.replace(/\s*\((?:[^()]*\d{4}-\d{2}-\d{2}[^()]*)\)\s*/g, ' ').replace(/\s+/g, ' ').trim().replace(/:$/, '');
  // "X TO Y" only when Y names a session ("END TO END" is not an addressee).
  const arrow = /^(.*?)\s*(?:→|\bTO)\s+((?:CLAUDE|CODEX|HOME|GLASS|PEERS?|INCOMING|ROOT|MATT|VILLAIN|ALL)\b.*)$/.exec(title);
  const head = arrow ? (arrow[1] as string) : title;
  const rest = arrow ? (arrow[2] as string) : '';
  // Holder: up to the first two upper-case words of the head ("HOME ROOT", "CLAUDE", "CODEX CAST").
  const words = head.split(' ');
  const n = words.length > 1 && /^(ROOT|CAST|SHADOW|JOURNAL|DEDUPE|STUDIO|MASTER)$/i.test(words[1] as string) && KNOWN_HOLDERS.test(words[0] as string) ? 2 : 1;
  const holder = KNOWN_HOLDERS.test(words[0] ?? '') ? words.slice(0, n).join(' ') : 'unnamed';
  const own = (holder === 'unnamed' ? words : words.slice(n)).join(' ').trim();
  if (!arrow) return { holder, scope: own || title };
  const [to, ...about] = rest.split(':');
  return { holder, to: (to as string).trim(), scope: [own, about.join(':').trim()].filter(Boolean).join(': ') || title };
}

/** The newest `limit` bullets of STATUS.md (top of the file is newest), parsed. */
export function parseStatusEntries(text: string, limit = 12): StatusClaim[] {
  const out: StatusClaim[] = [];
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  for (let i = 0; i < lines.length && out.length < limit; i++) {
    const line = lines[i] as string;
    if (/^##\s/.test(line)) break; // older, sectioned history starts at the first heading
    const m = /^- \*\*(.+?)\*\*\s*(.*)$/.exec(line);
    if (!m) continue;
    const title = m[1] as string;
    const body = m[2] as string;
    const { holder, to, scope } = splitTitle(title);
    const at = parseStatusTime(title);
    const paths = [...new Set([...body.matchAll(/(?:^|[\s`(])((?:wiki|apps|site|scripts|discussion|\.claude|\.codex)\/[\w./*{},@-]*[\w*}])/g)].map((x) => x[1] as string))].slice(0, 20);
    out.push({ holder, ...(to ? { to } : {}), scope: scope.slice(0, 160), state: stateOf(title, body), ...(at ? { at } : {}), ...(at && /T12:00:00.000Z$/.test(at) && !/d{4}-d{2}-d{2}[T ]d{2}:d{2}/.test(title) ? { dateOnly: true as const } : {}), paths, text: `${title} ${body}`, noFiles: /\bno files claimed\b/i.test(body) });
  }
  return out;
}

/** wiki/operations/leases.json rows with overdue/expired flags. Unparseable input gives no rows. */
export function parseLeases(json: unknown, now: Date): LeaseRow[] {
  if (!Array.isArray(json)) return [];
  const t = now.getTime();
  return json
    .filter((l): l is Record<string, unknown> => !!l && typeof l === 'object' && typeof (l as { path?: unknown }).path === 'string' && typeof (l as { holder?: unknown }).holder === 'string')
    .map((l) => {
      const reviewByUtc = typeof l.reviewByUtc === 'string' ? l.reviewByUtc : undefined;
      const until = typeof l.until === 'string' ? l.until : undefined;
      const review = reviewByUtc ? Date.parse(reviewByUtc) : NaN;
      const end = until ? Date.parse(until) : NaN;
      return {
        path: l.path as string,
        holder: l.holder as string,
        ...(reviewByUtc ? { reviewByUtc } : {}),
        ...(until ? { until } : {}),
        releaseRequired: l.releaseRequired === true,
        overdue: Number.isFinite(review) && review < t,
        expired: Number.isFinite(end) && end < t,
      };
    });
}
