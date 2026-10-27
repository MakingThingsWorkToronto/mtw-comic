// Migrated from retired git 51eb6e03:wiki/journal/console/build-state.mjs (measurement only; render.mjs and all HTML are dropped).
// The parse*/link*/prompt functions are a faithful port: same measurements, same "unknown" handling, same
// approval rule. It is intentionally untyped inside (the original is untyped JavaScript and the parity test
// pins its output); the typed surface is shared/types.ts. Everything is synchronous so module state below
// is safe: buildState() sets it, runs to completion and never yields.
// @ts-nocheck
import * as nodeFs from 'node:fs';
import { join, basename, relative } from 'node:path';
import { liveCandidates } from '../shared';
import { readCandidates } from './candidates';

export interface BuildOptions {
  repoRoot: string;
  /** ISO time for generatedAt (JOURNAL_CONSOLE_NOW in the old generator). */
  now?: string;
  /** Proposals file name inside wiki/journal/candidates. When set, concepts are parsed from that file (tests, and the
   *  CLI import). Default: wiki/journal/candidates.json, else the newest PROPOSALS-*.md that parses. */
  proposalsFile?: string;
  /** Prompt templates file. Default wiki/journal/console/prompt-templates.json. */
  templatesPath?: string;
}

// The entry's route on the local dev server. site/astro.config.mjs sets
// trailingSlash: 'always' and the local preview runs on port 8787 (`npm run all`).
export const LOCAL_SITE_ORIGIN = 'http://localhost:8787';
const localSiteUrl = (slug) => `${LOCAL_SITE_ORIGIN}/journal/${slug}/`;

// One build is synchronous and the files do not change under it, so reads are memoised per build (identical
// results, far fewer syscalls on Windows). buildState() clears the caches.
const memo = { read: new Map(), exists: new Map(), stat: new Map(), dir: new Map(), dirents: new Map() };
const cached = (map, key, fn) => {
  if (map.has(key)) return map.get(key);
  const v = fn();
  map.set(key, v);
  return v;
};
const readFileSync = (p, enc) => cached(memo.read, `${p}|${enc}`, () => nodeFs.readFileSync(p, enc));
const existsSync = (p) => cached(memo.exists, p, () => nodeFs.existsSync(p));
const statSync = (p) => cached(memo.stat, p, () => nodeFs.statSync(p));
const readdirSync = (p, opts) => (opts ? cached(memo.dirents, p, () => nodeFs.readdirSync(p, opts)) : cached(memo.dir, p, () => nodeFs.readdirSync(p)));

let REPO = '';
let P = {};
let SCENES = '';
let TEMPLATES_PATH = '';
let NOW = '';
let notes = [];
const note = (m) => { notes.push(m); };

const UNKNOWN = 'unknown';
const show = (v) => (v === UNKNOWN || v === null || v === undefined || v === '' ? UNKNOWN : String(v));
const readIf = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : null);
const rel = (p) => relative(REPO, p).split('\\').join('/');
const mdFiles = (dir, skip = []) =>
  existsSync(dir)
    ? readdirSync(dir).filter((f) => f.endsWith('.md') && !skip.includes(f)).sort()
    : [];
const subDirs = (dir) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort()
    : [];
const words = (text) => (text.match(/\S+/g) || []).length;
const STOP = new Set(['the', 'and', 'for', 'with', 'not', 'its', 'are', 'was', 'from', 'that', 'this', 'your']);
const slugTokens = (s) =>
  s.toLowerCase().replace(/\.md$/, '').replace(/^\d{4}-\d{2}-/, '')
    .split(/[^a-z0-9]+/).filter((t) => t.length > 2 && !STOP.has(t));

// Two proposals formats exist. Headline format (PROPOSALS-2026-09-17): "## 1 · Title" with **Headline:** and
// **Description:** fields. Discovery format (PROPOSALS-2026-10-08): "## 1. Headline." with plain "Card summary:",
// "Argument and reader:" and "Proposed service:" lines and a numbered question list.
const isDiscoveryFormat = (src) => /^Card summary:/mi.test(src);
// Read uncached: the service picks the file before buildState clears the per-build memo, so a memoized read
// would miss a proposals file that arrived since the last build.
const hasHeadlines = (file) => {
  const src = nodeFs.existsSync(file) ? nodeFs.readFileSync(file, 'utf8') : null;
  if (!src || !/^##\s+\d+\s*[·.\-]/m.test(src)) return false;
  return /^\*\*Headline:?\*\*/mi.test(src) || isDiscoveryFormat(src);
};

/** The proposals file in use: explicit, else the newest PROPOSALS-*.md in either known format. */
export function chooseProposals(repoRoot: string, explicit?: string): { file: string | null; skipped: string[] } {
  const dir = join(repoRoot, 'wiki', 'journal', 'candidates');
  if (explicit) return { file: explicit, skipped: [] };
  const all = nodeFs.existsSync(dir) ? nodeFs.readdirSync(dir).filter((f) => /^PROPOSALS-.*\.md$/.test(f)).sort().reverse() : [];
  const usable = all.find((f) => hasHeadlines(join(dir, f))) ?? all[0] ?? null;
  return { file: usable, skipped: all.filter((f) => f !== usable) };
}

// ---------------------------------------------------------------- proposals

function parseProposals() {
  if (!P.explicitProposals) {
    const rec = readCandidates(REPO);
    if (rec.found) return conceptsFromRecords(rec);
  }
  const src = readIf(P.proposals);
  if (!src) {
    note(`Proposals file not found at ${rel(P.proposals)}; concepts are unknown.`);
    return { concepts: [], backlog: [], pausedCandidates: [], source: rel(P.proposals), found: false };
  }
  return parseProposalsText(src, rel(P.proposals));
}

// wiki/journal/candidates.json: one validated record per concept, numbered for good. Shaped like a parsed concept so
// everything downstream is unchanged; the record's own entry and source replace the proposals-file guesswork.
function conceptsFromRecords(rec) {
  if (!rec.file) {
    rec.errors.forEach(note);
    return { concepts: [], backlog: [], pausedCandidates: [], source: 'wiki/journal/candidates.json', found: false };
  }
  const concepts = rec.file.candidates.map((c) => ({
    number: c.number,
    id: c.id,
    title: c.headline,
    headline: c.headline,
    headlineCharCountStated: UNKNOWN,
    headlineCharCountMeasured: c.headline.length,
    headlineCharCountSource: 'measured from wiki/journal/candidates.json',
    description: c.summary,
    argument: c.argument ?? UNKNOWN,
    evidence: c.evidence ?? undefined,
    onlyMattCanSupply: c.onlyMatt ?? UNKNOWN,
    origin: c.rebuildOf ? `rebuild of ${c.rebuildOf}` : 'new concept',
    rebuildOf: c.rebuildOf,
    category: c.category ?? UNKNOWN,
    service: c.service ?? UNKNOWN,
    assessment: c.assessment ?? undefined,
    held: c.status === 'held',
    proposedWeek: c.proposedWeek ?? undefined,
    themeSize: c.themeSize ?? undefined,
    share: c.share ?? undefined,
    proposalQuestions: c.questions,
    recordEntry: c.entry,
    sourceFile: c.source.file,
    sourceSection: c.source.section,
    approval: 'not approved',
    approvalEvidence: 'No file in the repo records an approval for this concept.',
  }));
  return { concepts, backlog: [], pausedCandidates: [], source: 'wiki/journal/candidates.json', found: true, format: 'records' };
}

/** Pure parse of one proposals file's text, either format. The `mtw journal candidates import` CLI uses it too. */
export function parseProposalsText(src: string, sourceRel: string) {

  // Concept blocks: "## 1 · Title" up to the next "## "
  const blocks = [];
  const re = /^##\s+(\d+)\s*[·.\-]\s*(.+)$/gm;
  let m;
  const marks = [];
  while ((m = re.exec(src)) !== null) marks.push({ n: Number(m[1]), title: m[2].trim(), at: m.index });
  marks.forEach((mk, i) => {
    const end = i + 1 < marks.length ? marks[i + 1].at : src.length;
    const tail = src.slice(mk.at, end);
    const cut = tail.search(/\n##\s+/);
    blocks.push({ ...mk, body: cut === -1 ? tail : tail.slice(0, cut) });
  });

  const field = (body, label) => {
    const r = new RegExp(`^\\*\\*${label}:?\\*\\*\\s*(.+)$`, 'mi');
    const hit = body.match(r);
    return hit ? hit[1].trim() : null;
  };

  // Proposals files may carry CRLF line endings; the discovery parser reads line by line.
  if (isDiscoveryFormat(src)) return parseDiscoveryProposals(blocks.map((b) => ({ ...b, body: b.body.replace(/\r/g, '') })), sourceRel);

  const concepts = blocks.map((b) => {
    const headlineRaw = field(b.body, 'Headline');
    let headline = headlineRaw, charCount = null, charCountSource = 'unknown';
    if (headlineRaw) {
      const cc = headlineRaw.match(/\*\(\s*(\d+)\s*characters?\s*\)\*/i);
      if (cc) charCount = Number(cc[1]);
      headline = headlineRaw.replace(/\*\(.*?\)\*\s*$/, '').trim();
      charCountSource = cc ? 'stated in the proposals file' : 'not stated';
    }
    const measured = headline ? headline.length : null;
    const description = field(b.body, 'Description');
    const rebuild = field(b.body, 'Rebuild of');
    const isNew = /^\*\*New concept\.?\*\*/mi.test(b.body);
    const catLine = b.body.match(/^\*\*Category:\*\*\s*(.+)$/mi);
    let category = null, service = null;
    if (catLine) {
      const parts = catLine[1].split('·').map((s) => s.trim());
      category = (parts[0] || '').replace(/\*\*/g, '').trim() || null;
      const svc = parts.find((s) => /^\*\*Service:\*\*/i.test(s) || /Service:/i.test(s));
      if (svc) service = svc.replace(/\*\*/g, '').replace(/^Service:\s*/i, '').replace(/\s*\*\(.*?\)\*/, '').trim();
    }
    const argues = b.body.match(/\*\*What it argues\.\*\*\s*([\s\S]*?)(?:\n\n|$)/);
    let argument = argues ? argues[1].replace(/\s+/g, ' ').trim() : null;
    if (argument) {
      const first = argument.match(/^.*?[.!?](?=\s|$)/);
      argument = (first ? first[0] : argument).trim();
    }
    const onlyHe = b.body.match(/\*\*What only he can supply:?\*\*\s*([\s\S]*?)(?:\n\n|$)/);
    const rebuildOf = rebuild ? rebuild.replace(/[`*]/g, '').trim() : null;

    return {
      number: b.n,
      title: b.title.replace(/\*/g, ''),
      headline: headline || UNKNOWN,
      headlineCharCountStated: charCount === null ? UNKNOWN : charCount,
      headlineCharCountMeasured: measured === null ? UNKNOWN : measured,
      headlineCharCountSource: charCountSource,
      description: description || UNKNOWN,
      argument: argument || UNKNOWN,
      onlyMattCanSupply: onlyHe ? onlyHe[1].replace(/\s+/g, ' ').trim() : UNKNOWN,
      origin: rebuildOf ? `rebuild of ${rebuildOf}` : (isNew ? 'new concept' : UNKNOWN),
      rebuildOf,
      category: category || UNKNOWN,
      service: service || UNKNOWN,
      approval: 'not approved',
      approvalEvidence: 'No file in the repo records an approval for this concept.',
    };
  });

  // Backlog table at the foot.
  const backlog = [];
  const tbl = src.match(/\|\s*#\s*\|\s*Working title\s*\|[\s\S]*?(?:\n\n|$)/i);
  if (tbl) {
    tbl[0].split('\n').forEach((line) => {
      const cells = line.split('|').map((c) => c.trim());
      if (cells.length < 6) return;
      if (!/^\d+$/.test(cells[1])) return;
      backlog.push({
        number: Number(cells[1]),
        workingTitle: cells[2],
        source: cells[3].replace(/`/g, ''),
        service: cells[4],
      });
    });
  } else {
    note('Backlog table not found in the proposals file.');
  }

  // "Two of the original twelve have no new ammunition at all: ..."
  const paused = [];
  const pm = src.match(/(Two|Three|\d+) of the original twelve have no new ammunition at all:\s*([^.]+)\./i);
  if (pm) paused.push(pm[0].trim());

  return { concepts, backlog, pausedCandidates: paused, source: sourceRel, found: true };
}

// Discovery format: the heading is the headline; plain "Label: value" lines carry the rest, and the
// numbered list in each block is the questions drafted for the eventual interview.
function parseDiscoveryProposals(blocks, sourceRel) {
  const plain = (body, label) => {
    const hit = body.match(new RegExp(`^${label}:\\s*(.+)$`, 'mi'));
    return hit ? hit[1].trim() : null;
  };
  const concepts = blocks.map((b) => {
    const headline = b.title.replace(/\*/g, '').trim();
    const svcLine = plain(b.body, 'Proposed service');
    const svc = svcLine ? svcLine.match(/^([^;]+)/) : null;
    const cat = svcLine ? svcLine.match(/category:\s*([^.;]+)/i) : null;
    const assessment = plain(b.body, 'Title');
    const questions = b.body.split('\n')
      .map((l) => l.match(/^(\d+)\.\s+(.+)$/))
      .filter(Boolean)
      .map((q) => ({ label: q[1], question: q[2].trim() }));
    return {
      number: b.n,
      title: headline,
      headline,
      headlineCharCountStated: UNKNOWN,
      headlineCharCountMeasured: headline.length,
      headlineCharCountSource: 'measured from the heading',
      description: plain(b.body, 'Card summary') || UNKNOWN,
      argument: plain(b.body, 'Argument and reader') || UNKNOWN,
      onlyMattCanSupply: UNKNOWN,
      evidence: plain(b.body, 'Evidence') || UNKNOWN,
      origin: 'new concept',
      rebuildOf: null,
      category: cat ? cat[1].trim() : UNKNOWN,
      service: svc ? svc[1].trim() : UNKNOWN,
      assessment: assessment || UNKNOWN,
      held: /\*\*Hold\*\*/.test(assessment || ''),
      proposedWeek: plain(b.body, 'Proposed week') || UNKNOWN,
      themeSize: plain(b.body, 'Theme size') || UNKNOWN,
      share: plain(b.body, 'Readers get') || UNKNOWN,
      proposalQuestions: questions,
      approval: 'not approved',
      approvalEvidence: 'No file in the repo records an approval for this concept.',
    };
  });
  return { concepts, backlog: [], pausedCandidates: [], source: sourceRel, found: true, format: 'discovery' };
}

// --------------------------------------------------------------- candidates

function parseCandidates() {
  const files = mdFiles(P.candidates, ['README.md']).filter((f) => !/^PROPOSALS-/.test(f));
  return files.map((f) => {
    const src = readFileSync(join(P.candidates, f), 'utf8');
    const h1 = src.match(/^#\s+(.+)$/m);
    const month = f.match(/^(\d{4}-\d{2})/);
    return {
      file: f,
      path: `candidates/${f}`,
      title: h1 ? h1[1].trim() : UNKNOWN,
      topicMonth: month ? month[1] : UNKNOWN,
      bytes: statSync(join(P.candidates, f)).size,
    };
  });
}

// ------------------------------------------------------------------ entries
//
// wiki/journal/entries/<slug>/ is the real unit of work. Each folder holds
// README.md (the anchor), interview.md (questions, verdicts, gates), answers/
// (verbatim rounds, append only), assets.md, an optional measurement file and
// draft.md. Everything below is read from those files; nothing is inferred.

// An approval must be written down in so many words. Nothing else counts, and
// the presence of a draft, a gate pass or a status line never counts.
const APPROVAL_MARKERS = [
  /^\s*\*\*Matt'?s approval:?\*\*\s*(granted|given|approved|yes)\b/im,
  /^\|\s*Matt'?s approval\s*\|\s*(given|granted|approved|yes)\b/im,
  /^\s*\*\*Approved by Matt\b/im,
  /^Approved by Matt\s*(?:on|:)/im,
  /^\s*\*\*Approval:?\*\*\s*(granted|given|approved)\b/im,
];

function approvalIn(files) {
  for (const f of files) {
    const src = readIf(f.path);
    if (!src) continue;
    for (const re of APPROVAL_MARKERS) {
      const hit = src.match(re);
      if (hit) {
        const line = src.slice(0, hit.index).split('\n').length;
        return { approval: 'approved', evidence: `${f.rel}:${line} records it in so many words.` };
      }
    }
  }
  return {
    approval: 'not approved',
    evidence: 'Approval is never inferred. No file in this entry records Matt approving it in so many words.',
  };
}

// Question rows in an entry's interview.md:
//   | # | Question | Self answer verdict | State |
// The State cell is read literally. "Partially answered" is not "answered".
function classifyQuestionState(cell) {
  const t = cell.replace(/\*/g, '').trim();
  if (!t) return 'unknown';
  if (/unanswered/i.test(t)) return 'unanswered';
  if (/partial/i.test(t)) return 'partially answered';
  if (/\banswered\b/i.test(t)) return 'answered';
  if (/\bopen\b/i.test(t)) return 'open';
  return 'unknown';
}

function parseEntryQuestions(src) {
  const out = {
    total: UNKNOWN, answered: UNKNOWN, partial: UNKNOWN, open: UNKNOWN,
    unanswered: UNKNOWN, unreadable: UNKNOWN, raisedNotAsked: UNKNOWN,
    rows: [], raised: [], basis: 'No question table or question list could be located in interview.md.',
  };
  if (!src) return out;

  const section = src.match(/^##\s*Questions\s*$([\s\S]*?)(?=^##\s|\Z)/m);
  const scope = section ? section[1] : src;

  // Table shape first.
  const rows = [];
  scope.split('\n').forEach((line) => {
    const cells = line.split('|').map((c) => c.trim());
    if (cells.length < 5) return;
    if (!/^\d+$/.test(cells[1])) return;
    rows.push({
      number: Number(cells[1]),
      question: cells[2].replace(/\*/g, '').trim(),
      selfAnswerVerdict: cells[3] ? cells[3].replace(/\*/g, '').trim() : UNKNOWN,
      stateText: cells[4].replace(/\*/g, '').trim(),
      state: classifyQuestionState(cells[4]),
    });
  });

  if (rows.length) {
    out.rows = rows;
    out.total = rows.length;
    out.answered = rows.filter((r) => r.state === 'answered').length;
    out.partial = rows.filter((r) => r.state === 'partially answered').length;
    out.open = rows.filter((r) => r.state === 'open').length;
    out.unanswered = rows.filter((r) => r.state === 'unanswered').length;
    out.unreadable = rows.filter((r) => r.state === 'unknown').length;
    out.basis = `Read from the ${rows.length}-row question table in interview.md; each State cell taken literally.`;
  } else {
    // Legacy shape: a numbered list with "> UNANSWERED" under each question.
    const plain = (scope.match(/^\s*\d+\.\s+\S/gm) || []).length;
    const bold = (scope.match(/^\*\*\d+\.\s/gm) || []).length;
    const count = Math.max(plain, bold);
    const marks = (src.match(/^>\s*UNANSWERED\s*$/gim) || []).length;
    if (count > 0) {
      out.total = count;
      out.unanswered = marks;
      out.answered = UNKNOWN;
      out.partial = UNKNOWN;
      out.open = UNKNOWN;
      out.unreadable = UNKNOWN;
      out.basis = `No question table; counted ${count} numbered question(s) and ${marks} "UNANSWERED" marker(s). Whether the rest are answered cannot be read from the file.`;
    }
  }

  // "Raised by the answers, not yet asked" — a numbered list.
  const raisedSec = src.match(/^#{2,4}\s*Raised by the answers[^\n]*$([\s\S]*?)(?=^#{2,4}\s|\Z)/m);
  if (raisedSec) {
    const items = [...raisedSec[1].matchAll(/^\s*(\d+)\.\s+(.+)$/gm)].map((m) => ({
      number: Number(m[1]),
      question: m[2].replace(/\*/g, '').trim(),
    }));
    out.raised = items;
    out.raisedNotAsked = items.length;
  } else {
    out.raisedNotAsked = UNKNOWN;
  }

  return out;
}

function parseAnswerRounds(dir, relBase) {
  if (!existsSync(dir)) {
    return { count: 0, rounds: [], questionsRecorded: 0, found: false,
      note: 'No answers/ folder exists in this entry.' };
  }
  const files = mdFiles(dir);
  const rounds = files.map((f) => {
    const src = readFileSync(join(dir, f), 'utf8');
    const nameRound = f.match(/round-(\d+)/i);
    const headRound = src.match(/^#\s+.*round\s+(\d+)/im);
    const nameDate = f.match(/(\d{4}-\d{2}-\d{2})/);
    const collected = src.match(/^Collected:\s*(.+)$/im);
    const qs = [...src.matchAll(/^##\s*Q(\d+)\b[^\n]*$/gim)].map((m) => Number(m[1]));
    const redactions = /^\*\*Redactions[^\n]*:\*\*\s*none/im.test(src)
      ? 'none applied'
      : (/^\*\*Redactions[^\n]*applied[^\n]*:\*\*/im.test(src) ? 'one or more applied, marked inline' : UNKNOWN);
    return {
      file: f,
      path: `${relBase}/answers/${f}`,
      round: nameRound ? Number(nameRound[1]) : (headRound ? Number(headRound[1]) : UNKNOWN),
      date: collected ? collected[1].trim() : (nameDate ? nameDate[1] : UNKNOWN),
      dateSource: collected ? 'the file\'s Collected: line' : (nameDate ? 'the filename' : 'not stated'),
      questionsRecorded: qs.length,
      questionNumbers: qs,
      redactions,
      words: words(src),
    };
  }).sort((a, b) => (a.round === UNKNOWN ? 99 : a.round) - (b.round === UNKNOWN ? 99 : b.round));

  return {
    found: true,
    count: rounds.length,
    rounds,
    questionsRecorded: rounds.reduce((n, r) => n + r.questionsRecorded, 0),
    note: rounds.length ? null : 'The answers/ folder exists but holds no markdown file.',
  };
}

// --------------------------------------------- per-entry detail parsers
//
// Added for the multi-page console: the entry details page needs the gate
// report, the per-entry framing availability, the asset tables and both
// covers, and the post preview page needs the drafted entry body. All of it
// is read from the entry's own files, the same rule as everything above.

const cleanCell = (s) =>
  String(s == null ? '' : s)
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .trim();

function mdSection(src, heading) {
  if (!src) return null;
  const m = src.match(new RegExp(`^#{2,4}\\s*${heading}[^\\n]*$([\\s\\S]*)`, 'm'));
  if (!m) return null;
  const rest = m[1];
  const next = rest.search(/^#{1,6}\s/m);
  return next === -1 ? rest : rest.slice(0, next);
}

function mdTableRows(text) {
  if (!text) return [];
  const rows = [];
  text.split('\n').forEach((line) => {
    const t = line.trim();
    if (!t.startsWith('|')) return;
    const cells = t.split('|').slice(1, -1).map((c) => c.trim());
    if (!cells.length) return;
    if (cells.every((c) => /^:?-{2,}:?$/.test(c))) return;
    rows.push(cells);
  });
  return rows;
}

function parseGates(src) {
  const sec = mdSection(src, 'Gate report');
  if (!sec) {
    return { found: false, rows: [], verdictLine: UNKNOWN,
      basis: 'No "Gate report" section could be located in interview.md, so no gate state can be measured.' };
  }
  const rows = mdTableRows(sec).slice(1)
    .filter((c) => c.length >= 2)
    .map((c) => ({ gate: cleanCell(c[0]), result: cleanCell(c[1]), evidence: cleanCell(c[2] || '') }));
  const verdict = sec.match(/^\*\*([^\n*]*Gate[^\n*]*)\*\*/m);
  return {
    found: true,
    rows,
    verdictLine: verdict ? verdict[1].trim() : UNKNOWN,
    basis: `Read from the ${rows.length}-row gate table in interview.md. Each cell is quoted as written; nothing is re-judged here.`,
  };
}

// Framing, per entry rather than as a count: is a named public position
// available to argue against, and is a dated external event available.
function parseEntryFraming(src) {
  const sec = mdSection(src, 'Proof and anonymity check');
  const pick = (label) => {
    if (!sec) return UNKNOWN;
    const m = sec.match(new RegExp(`^[-*]\\s*\\*{0,2}${label}[^:\\n]*:?\\*{0,2}\\s*(.+)$`, 'mi'));
    return m ? cleanCell(m[1]) : UNKNOWN;
  };
  const named = pick('Counter position');
  const dated = pick('Dated events available');
  return {
    sectionFound: Boolean(sec),
    namedPosition: named,
    namedPositionAvailable: named === UNKNOWN ? UNKNOWN : 'yes',
    datedEvent: dated,
    datedEventAvailable: dated === UNKNOWN ? UNKNOWN : 'yes',
    basis: sec
      ? 'Quoted from the "Proof and anonymity check" section of this entry\'s interview.md.'
      : 'This entry\'s interview.md has no "Proof and anonymity check" section, so neither availability can be read. Absent is not the same as none, so both read unknown.',
  };
}


function parseEntryAssets(dir) {
  const src = readIf(join(dir, 'assets.md'));
  if (!src) {
    return { found: false, immersive: [], covers: [], coverClaim: UNKNOWN,
      basis: 'No assets.md in this entry folder.' };
  }
  const immersive = mdTableRows(mdSection(src, 'Immersive set') || '').slice(1)
    .filter((c) => c.length >= 3)
    .map((c) => ({ type: cleanCell(c[0]), id: cleanCell(c[1]), status: cleanCell(c[2]), shows: cleanCell(c[3] || '') }));

  const coverSec = mdSection(src, 'Cover');
  const covers = mdTableRows(coverSec || '').slice(1)
    .filter((c) => c.length >= 2)
    .map((c) => {
      const fileCell = cleanCell(c[1]);
      const name = (fileCell.match(/[A-Za-z0-9._-]+\.(?:png|jpe?g|webp|svg)/i) || [null])[0];
      const abs = name ? join(SCENES, name) : null;
      const exists = abs ? existsSync(abs) : false;
      return {
        option: cleanCell(c[0]),
        file: name || UNKNOWN,
        state: cleanCell(c[2] || ''),
        imagePath: name ? `../../image-library/assets/scenes/journal/${name}` : null,
        exists,
        bytes: exists ? statSync(abs).size : UNKNOWN,
        existsNote: name
          ? (exists ? `Resolved on disk at wiki/image-library/assets/scenes/journal/${name}.`
                    : `Named in assets.md but NOT found at wiki/image-library/assets/scenes/journal/${name}.`)
          : 'No image filename could be read from this row.',
      };
    });

  const claim = coverSec ? coverSec.match(/^\*\*(.+?)\*\*\s*$/m) : null;
  return {
    found: true,
    immersive,
    covers,
    coverClaim: claim ? claim[1].trim() : UNKNOWN,
    coverClaimNote: 'This is assets.md\'s own wording about the cover, not a measurement, and it is not an approval.',
    basis: 'Read from the tables in this entry\'s assets.md. Cover files are then looked for on disk.',
  };
}

// The drafted entry, split into the part that is the post and the part that
// is the note to Matt. The post preview page renders the first; the second
// sits below it, separated, so he can read then decide.
function parsePost(src) {
  if (!src) return { found: false, basis: 'No draft.md in this entry folder.' };
  const entryHead = src.match(/^##\s*The entry\s*$/m);
  if (!entryHead) {
    return { found: false, basis: 'draft.md exists but has no "## The entry" heading, so the post body cannot be located. Nothing is guessed.' };
  }
  const notesHead = src.match(/^##\s*Draft notes for Matt\s*$/m);
  const from = entryHead.index + entryHead[0].length;
  const to = notesHead ? notesHead.index : src.length;
  let body = src.slice(from, to).replace(/^\s*-{3,}\s*$/gm, '').trim();

  const t = body.match(/^#\s+(.+)$/m);
  const title = t ? t[1].trim() : UNKNOWN;
  if (t) body = body.slice(body.indexOf(t[0]) + t[0].length).trim();

  let standfirst = UNKNOWN;
  const sf = body.match(/^\*([^*][^\n]*)\*\s*$/m);
  if (sf && body.startsWith('*')) {
    standfirst = sf[1].trim();
    body = body.slice(sf[0].length).trim();
  }

  const notes = notesHead
    ? src.slice(notesHead.index + notesHead[0].length).trim()
    : null;

  let openQuestions = [];
  if (notes) {
    const oq = notes.match(/\*\*Open questions for you:?\*\*\s*([\s\S]*)$/i);
    if (oq) openQuestions = [...oq[1].matchAll(/^\s*(\d+)\.\s+(.+)$/gm)].map((m) => ({ number: Number(m[1]), text: m[2].trim() }));
  }

  return {
    found: true,
    title,
    standfirst,
    body,
    bodyWordCount: words(body),
    notes,
    notesPresent: Boolean(notes),
    openQuestions,
    openQuestionCount: notes ? openQuestions.length : UNKNOWN,
    basis: 'The post body is everything between the "## The entry" heading and the "## Draft notes for Matt" section of draft.md. Nothing was rewritten for this preview.',
    approvalNote: 'Rendering a draft is not approving it. Nothing on the preview page records an approval.',
  };
}

function parseMeasurement(dir, file) {
  const src = readIf(join(dir, file));
  if (!src) return { title: UNKNOWN, limits: UNKNOWN };
  const h1 = src.match(/^#\s+(.+)$/m);
  const lim = src.match(/^\*{0,2}Limits:?\*{0,2}\s*(.+)$/mi);
  return { title: h1 ? h1[1].trim() : UNKNOWN, limits: lim ? cleanCell(lim[1]) : UNKNOWN };
}

// ------------------------------------------------------------------- queue
//
// wiki/journal/queue.md is the fact about which entries are live work, which
// are published and which Matt has rejected. It is read, never inferred: an
// entry folder does not put an entry in the queue, and the absence of one
// does not take it out.

function parseQueue() {
  const src = readIf(P.queue);
  if (!src) {
    note(`queue.md not found at ${rel(P.queue)}; the queue, published and rejected groups are unknown.`);
    return { found: false, path: '../queue.md', queue: [], published: [], rejected: [],
      publishedClaim: UNKNOWN, rejectedClaim: UNKNOWN, disagreements: [] };
  }
  const placeholder = (c) => !c || c === '—' || c === '-' || c === '';

  const rows = (heading, keys) => {
    const sec = mdSection(src, heading);
    return mdTableRows(sec || '').slice(1)
      .map((cells) => {
        const o = {};
        keys.forEach((k, i) => { o[k] = cleanCell(cells[i] || ''); });
        const link = (cells[0] || '').match(/\(([^)]*entries\/([A-Za-z0-9._-]+)\/?[^)]*)\)/);
        o.slug = link ? link[2] : null;
        return o;
      })
      .filter((o) => !placeholder(o[keys[0]]));
  };

  const queue = rows('Queue', ['entry', 'stage', 'waitingOn']);
  const published = rows('Published', ['entry', 'published', 'route']);
  const rejected = rows('Rejected', ['entry', 'rejected', 'reason', 'reopen']);

  const claim = (heading) => {
    const sec = mdSection(src, heading) || '';
    const line = sec.split('\n').map((l) => l.trim()).find((l) => l && !l.startsWith('|'));
    return line ? cleanCell(line) : UNKNOWN;
  };

  return {
    found: true,
    path: '../queue.md',
    queue,
    published,
    rejected,
    publishedClaim: claim('Published'),
    rejectedClaim: claim('Rejected'),
    queueNote: claim('Queue'),
    rule: 'Only Matt moves an entry between these groups. This console copies a prompt for him to paste; it writes nothing and deletes nothing. A rejected idea keeps its row and its reason.',
    basis: 'Read from the Queue, Published and Rejected tables in wiki/journal/queue.md. That file is the fact; no grouping is inferred from an entry folder or from the proposals file.',
  };
}

function parseEntries() {
  const slugs = subDirs(P.entries);
  if (!slugs.length) {
    note(`No entry folders found under ${rel(P.entries)}.`);
    return [];
  }
  return slugs.map((slug) => {
    const dir = join(P.entries, slug);
    const relBase = `../entries/${slug}`;
    const has = (f) => existsSync(join(dir, f));
    const readEntry = (f) => readIf(join(dir, f));

    const readme = readEntry('README.md');
    const interview = readEntry('interview.md');
    const measurements = existsSync(dir)
      ? readdirSync(dir).filter((f) => /^measurement.*\.md$/i.test(f)).sort()
      : [];

    const h1 = (readme && readme.match(/^#\s+(.+)$/m)) || (interview && interview.match(/^#\s+(.+)$/m));
    let title = h1 ? h1[1].trim() : UNKNOWN;
    title = title.replace(/^E\d+[a-z]?\s*·\s*/i, '');

    const statusLine = readme ? readme.match(/^\*\*Status:\*\*\s*(.+)$/m) : null;
    const opened = readme ? readme.match(/^\*\*Opened:\*\*\s*([0-9-]+)/m) : null;

    const files = [
      { key: 'README.md', present: has('README.md') },
      { key: 'interview.md', present: has('interview.md') },
      { key: 'assets.md', present: has('assets.md') },
      { key: 'draft.md', present: has('draft.md') },
    ].map((f) => ({ ...f, path: `${relBase}/${f.key}` }));

    const answers = parseAnswerRounds(join(dir, 'answers'), relBase);
    const questions = parseEntryQuestions(interview);

    const draftSrc = readEntry('draft.md');
    const draft = draftSrc === null
      ? { exists: false, wordCount: UNKNOWN, path: `${relBase}/draft.md`,
          note: 'No draft.md in this entry folder.' }
      : { exists: true, wordCount: words(draftSrc), path: `${relBase}/draft.md`,
          note: 'Word count measured over the whole file, markdown and headings included. A draft is not an approval.' };

    // Cross-check: questions the table still calls open or unanswered for which
    // an answers round records a Q heading. Measured, not guessed.
    const answeredInRounds = new Set(answers.rounds.flatMap((r) => r.questionNumbers));
    const contradictions = questions.rows
      .filter((r) => (r.state === 'open' || r.state === 'unanswered') && answeredInRounds.has(r.number))
      .map((r) => r.number);

    // The README's own status line is a claim in a file, not a measurement.
    const statusChecks = [];
    if (statusLine) {
      const claim = statusLine[1];
      if (/not drafted/i.test(claim) && draft.exists) {
        statusChecks.push('README.md still says "not drafted" while draft.md exists.');
      }
      if (/not interviewed/i.test(claim) && answers.count > 0) {
        statusChecks.push('README.md still says "not interviewed" while answer rounds exist.');
      }
    }
    if (contradictions.length) {
      statusChecks.push(`interview.md's question table still shows question ${contradictions.join(', ')} as open, but answers/ records an answer for ${contradictions.length === 1 ? 'it' : 'them'}.`);
    }

    const approvalFiles = [
      { path: join(dir, 'README.md'), rel: `wiki/journal/entries/${slug}/README.md` },
      { path: join(dir, 'interview.md'), rel: `wiki/journal/entries/${slug}/interview.md` },
      { path: join(dir, 'draft.md'), rel: `wiki/journal/entries/${slug}/draft.md` },
    ].filter((f) => existsSync(f.path));
    const approval = approvalIn(approvalFiles);

    return {
      slug,
      title,
      path: relBase,
      readmePath: `${relBase}/README.md`,
      recordedStatusLine: statusLine ? statusLine[1].replace(/\*\*/g, '').trim() : UNKNOWN,
      recordedStatusNote: 'This is the entry README\'s own wording, not a measurement.',
      opened: opened ? opened[1] : UNKNOWN,
      files,
      measurements: measurements.map((f) => ({ file: f, path: `${relBase}/${f}`, ...parseMeasurement(dir, f) })),
      gates: parseGates(interview),
      framing: parseEntryFraming(interview),
      assets: parseEntryAssets(dir),
      post: parsePost(draftSrc),
      localSiteUrl: localSiteUrl(slug),
      postPage: `post-${slug}.html`,
      detailPage: `entry-${slug}.html`,
      answers,
      questions,
      draft,
      approval: approval.approval,
      approvalEvidence: approval.evidence,
      staleClaims: statusChecks,
      migratedFrom: (() => {
        const hits = interview ? [...interview.matchAll(/interviews\/([A-Za-z0-9._-]+\.md)/g)].map((m) => m[1]) : [];
        return [...new Set(hits)];
      })(),
    };
  });
}

// ------------------------------------------------------------ answers index

function parseAnswersIndex() {
  const src = readIf(P.answersIndex);
  if (!src) {
    note(`answers-index.md not found at ${rel(P.answersIndex)}; the self answer pass cannot be represented.`);
    return { found: false, path: '../answers-index.md', answered: UNKNOWN, open: UNKNOWN,
      total: UNKNOWN, rows: [], openRows: [], topics: [], topicCount: UNKNOWN };
  }

  const rows = [];
  const openRows = [];
  const idxSec = src.match(/^##\s*Index\s*$([\s\S]*?)(?=^##\s|\Z)/m);
  const openSec = src.match(/^##\s*Asked but not yet answered\s*$([\s\S]*?)(?=^##\s|\Z)/m);

  if (idxSec) {
    idxSec[1].split('\n').forEach((line) => {
      const c = line.split('|').map((x) => x.trim());
      if (c.length < 8 || !/^\d+$/.test(c[1])) return;
      const link = c[5].match(/\(([^)]+)\)/);
      rows.push({
        number: Number(c[1]),
        question: c[2],
        entry: c[3],
        round: c[4],
        answerPath: link ? `../${link[1]}` : UNKNOWN,
        topics: c[6] ? c[6].split(',').map((t) => t.trim()).filter(Boolean) : [],
      });
    });
  } else {
    note('No "## Index" table in answers-index.md; answered counts are unknown.');
  }

  if (openSec) {
    openSec[1].split('\n').forEach((line) => {
      const c = line.split('|').map((x) => x.trim());
      if (c.length < 6 || !/^\d+$/.test(c[1])) return;
      openRows.push({ number: Number(c[1]), question: c[2], entry: c[3], whyItMatters: c[4] });
    });
  } else {
    note('No "## Asked but not yet answered" table in answers-index.md; open counts are unknown.');
  }

  const topics = [...new Set(rows.flatMap((r) => r.topics))].sort();
  const answered = idxSec ? rows.length : UNKNOWN;
  const open = openSec ? openRows.length : UNKNOWN;
  const total = (answered === UNKNOWN || open === UNKNOWN) ? UNKNOWN : answered + open;

  // The prose coverage paragraphs, read literally rather than re-summarized.
  const coverage = [...src.matchAll(/^\*\*([^*:]+):?\*\*\s*([^\n]+)$/gm)]
    .filter((m) => /coverage/i.test(m[1]))
    .map((m) => ({ label: m[1].trim(), text: m[2].trim() }));

  return {
    found: true,
    path: '../answers-index.md',
    rows: rows.sort((a, b) => a.number - b.number),
    openRows: openRows.sort((a, b) => a.number - b.number),
    answered,
    open,
    total,
    topics,
    topicCount: topics.length,
    coverage,
    entriesRepresented: [...new Set(rows.concat(openRows).map((r) => r.entry))].sort(),
    rule: 'The self answer pass reads this file. A question that is not indexed will be asked again.',
  };
}

// --------------------------------------------------------------- interviews

// Honest detection. An interview counts as having answers only when the file
// carries an explicit answer marker. Anything else is "open" (questions found,
// no answers) or "unknown" (no question section could be located).
const ANSWER_MARKERS = [
  /^#{2,4}\s*(matt'?s\s+)?answers?\b/im,
  /^\*\*\s*(matt'?s\s+)?answers?\s*[:*]/im,
  /^\s*(?:\d+\.\s*)?answer\s*:/im,
  /^>\s*matt:/im,
  /^\*\*matt:\*\*/im,
];

function parseInterviews(entries) {
  const files = mdFiles(P.interviews, ['README.md']);
  // Which legacy files an entry folder says it superseded or retained.
  const referenced = new Map();
  (entries || []).forEach((e) => {
    (e.migratedFrom || []).forEach((f) => {
      if (!referenced.has(f)) referenced.set(f, []);
      referenced.get(f).push(e.slug);
    });
  });
  const readmeSrc = readIf(join(P.interviews, 'README.md'));
  const order = new Map();
  if (readmeSrc) {
    readmeSrc.split('\n').forEach((line) => {
      const cells = line.split('|').map((c) => c.trim());
      if (cells.length < 5 || !/^\d+$/.test(cells[1])) return;
      const link = cells[2].match(/\(([^)]+\.md)\)/);
      if (!link) return;
      order.set(basename(link[1]), { order: Number(cells[1]), entry: cells[3], service: cells[4] });
    });
  } else {
    note(`Interview README not found; interview order is unknown.`);
  }

  return files.map((f) => {
    const src = readFileSync(join(P.interviews, f), 'utf8');
    const meta = order.get(f) || null;
    const qSection = src.match(/^##\s*Questions for Matt\s*$([\s\S]*?)(?=^##\s|\Z)/m);
    let questionCount = UNKNOWN;
    if (qSection) {
      // Two shapes are in use: a plain numbered list, and bold-numbered headings.
      const plain = (qSection[1].match(/^\s*\d+\.\s+\S/gm) || []).length;
      const bold = (qSection[1].match(/^\*\*\d+\.\s/gm) || []).length;
      questionCount = Math.max(plain, bold);
    }
    const unansweredMarks = (src.match(/^>\s*UNANSWERED\s*$/gim) || []).length;
    const hasAnswers = ANSWER_MARKERS.some((r) => r.test(src));
    let status, statusReason;
    if (questionCount === UNKNOWN) {
      status = UNKNOWN;
      statusReason = 'No "Questions for Matt" section could be located in the file.';
    } else if (questionCount === 0) {
      status = UNKNOWN;
      statusReason = 'A "Questions for Matt" section exists but no question could be counted in it.';
    } else if (unansweredMarks >= questionCount) {
      status = 'open';
      statusReason = `${questionCount} questions, all ${unansweredMarks} marked UNANSWERED in the file.`;
    } else if (unansweredMarks > 0) {
      status = UNKNOWN;
      statusReason = `${questionCount} questions with ${unansweredMarks} marked UNANSWERED; the rest cannot be read as answered or open from the file.`;
    } else if (hasAnswers) {
      status = UNKNOWN;
      statusReason = 'An answer marker was found, but whether every question is answered cannot be measured from the file.';
    } else {
      status = 'open';
      statusReason = `${questionCount} questions found, no answer marker present in the file.`;
    }
    const srcCand = src.match(/Source:\s*candidate\s*`?([A-Za-z0-9._-]+\.md)`?/i);
    const supersedes = [...src.matchAll(/Supersedes[^\n]*?\(([A-Za-z0-9._-]+\.md)\)/gi)].map((x) => x[1]);
    const missing = src.match(/\*\*Missing today:?\*\*\s*([^\n]+)/i);
    const depth = src.match(/^##\s*Depth test\s*$([\s\S]*?)(?=^##\s|\Z)/m);
    return {
      file: f,
      path: `../interviews/${f}`,
      order: meta ? meta.order : UNKNOWN,
      orderNote: meta ? null : 'Not listed in the interviews README table.',
      entry: meta ? meta.entry : (src.match(/^#\s+(.+)$/m) || [, UNKNOWN])[1],
      service: meta ? meta.service : ((src.match(/Service tag:\s*([^·\n]+)/) || [, UNKNOWN])[1] || UNKNOWN).trim(),
      sourceCandidate: srcCand ? srcCand[1] : UNKNOWN,
      supersedes,
      questionCount,
      status,
      statusReason,
      depthTestPresent: Boolean(depth),
      missingToday: missing ? missing[1].replace(/\s+$/, '') : UNKNOWN,
      legacy: true,
      migrated: false,
      migrationNote: referenced.has(f)
        ? `Not migrated. Retained: the entry folder ${referenced.get(f).join(', ')} names this file as the interview it supersedes.`
        : 'Not migrated. Still the only file for this entry; it moves into wiki/journal/entries/<slug>/ when the entry is picked up.',
      supersededByEntry: referenced.has(f) ? referenced.get(f) : null,
    };
  }).sort((a, b) => (a.order === UNKNOWN ? 99 : a.order) - (b.order === UNKNOWN ? 99 : b.order));
}

// ------------------------------------------------------------------ records

function parseRecords() {
  // README.md is the folder's contract, not a run record.
  const files = mdFiles(P.records, ['README.md']);
  return files.map((f) => {
    const src = readFileSync(join(P.records, f), 'utf8');
    const head = src.slice(0, 4000);
    const grab = (label) => {
      const hit = head.match(new RegExp(`^${label}:\\s*(.+)$`, 'mi'));
      return hit ? hit[1].trim() : UNKNOWN;
    };
    const h1 = src.match(/^#\s+(.+)$/m);
    const limits = grab('Limits');
    return {
      file: f,
      path: `../records/${f}`,
      title: h1 ? h1[1].trim() : UNKNOWN,
      channel: grab('Channel'),
      captured: grab('Captured'),
      coverage: grab('Coverage'),
      limits: limits === UNKNOWN ? UNKNOWN : limits.replace(/\*\*/g, ''),
      bytes: statSync(join(P.records, f)).size,
    };
  }).sort((a, b) => String(b.captured).localeCompare(String(a.captured)));
}

// ------------------------------------------------------------------ framing

function parseFraming() {
  const src = readIf(P.framing);
  if (!src) {
    note('framing.md not found; framing counts are unknown.');
    return { findings: [], total: UNKNOWN, dateOrderUnverified: UNKNOWN, openItems: UNKNOWN, watchlistTerms: UNKNOWN };
  }
  const section = src.match(/^##\s*Findings\s*$([\s\S]*?)(?=^##\s|\Z)/m);
  if (!section) {
    note('No "Findings" section in framing.md; framing counts are unknown.');
    return { findings: [], total: UNKNOWN, dateOrderUnverified: UNKNOWN, openItems: UNKNOWN, watchlistTerms: UNKNOWN };
  }
  const parts = section[1].split(/^###\s+/m).slice(1);
  const findings = parts.map((p) => {
    const title = p.split('\n')[0].trim();
    const dateOrder = p.match(/\*\*Date order:?\*\*[:\s]*([^\n]+)/i);
    const doText = dateOrder ? dateOrder[1].replace(/\*\*/g, '').trim() : UNKNOWN;
    const unverified = doText !== UNKNOWN && /unverified/i.test(doText);
    return {
      title,
      dateOrder: doText,
      dateOrderUnverified: doText === UNKNOWN ? UNKNOWN : unverified,
      hasOpenNote: /\*\*Open:?\*\*/i.test(p),
    };
  });
  const watchRows = (src.match(/^\|\s*\*[^|]+\*\s*\|/gm) || []).length;
  return {
    findings,
    total: findings.length,
    dateOrderUnverified: findings.filter((f) => f.dateOrderUnverified === true).length,
    openItems: findings.filter((f) => f.hasOpenNote).length,
    watchlistTerms: watchRows || UNKNOWN,
  };
}

// ----------------------------------------------------------------- coverage

function parseCoverage() {
  const src = readIf(P.ingestion);
  if (!src) {
    note('ingestion.md not found; coverage is unknown.');
    return { channels: [], source: rel(P.ingestion) };
  }
  const section = src.match(/^##\s*Coverage\s*$([\s\S]*?)(?=^##\s|\Z)/m);
  if (!section) {
    note('No "Coverage" section in ingestion.md; coverage is unknown.');
    return { channels: [], source: rel(P.ingestion) };
  }
  const channels = [];
  section[1].split('\n').forEach((line) => {
    const cells = line.split('|').map((c) => c.trim());
    if (cells.length < 6) return;
    if (!/^`/.test(cells[1])) return;
    channels.push({
      channel: cells[1].replace(/`/g, ''),
      lastRun: cells[2] || UNKNOWN,
      coverage: cells[3] || UNKNOWN,
      open: cells[4] || UNKNOWN,
      hasRun: !/^never$/i.test(cells[2]),
    });
  });
  return { channels, source: rel(P.ingestion) };
}

// ------------------------------------------------------- concept -> pipeline

function linkConcepts(state) {
  const interviews = state.interviews;
  const candidates = state.candidates;
  const entries = state.entries;
  const proposalsFile = basename(state.sources.proposals);

  state.concepts.forEach((c) => {
    // Candidate file behind a rebuild.
    let candidate = null;
    if (c.rebuildOf) {
      const want = c.rebuildOf.replace(/\.md$/, '');
      candidate = candidates.find((k) => k.file.replace(/\.md$/, '') === want)
        || candidates.find((k) => k.file.startsWith(want))
        || null;
    }
    c.candidateFile = candidate ? candidate.file : (c.origin === 'new concept' ? null : UNKNOWN);

    // Entry folder. Strongest signal: the entry's own README names this
    // proposals file and a concept number. Second: its interview.md names the
    // same source candidate.
    let entry = null;
    let entryBasis = null;
    // A candidates.json record names its entry outright; the filename heuristics below are for proposals files only.
    const fromRecord = c.sourceFile !== undefined;
    if (fromRecord && c.recordEntry) {
      entry = entries.find((e) => e.slug === c.recordEntry) || null;
      entryBasis = entry ? `wiki/journal/candidates.json links candidate ${c.id} to ${c.recordEntry}` : null;
      if (!entry) note(`wiki/journal/candidates.json links candidate ${c.id} to entry ${c.recordEntry}, and that folder does not exist.`);
    }
    for (const e of fromRecord ? [] : entries) {
      const readme = readIf(join(P.entries, e.slug, 'README.md'));
      if (!readme) continue;
      const m = readme.match(new RegExp(`${proposalsFile.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\)[^|\\n]*?concept\\s+(\\d+)`, 'i'));
      if (m && Number(m[1]) === c.number) {
        entry = e;
        entryBasis = `${e.slug}/README.md names ${proposalsFile}, concept ${c.number}`;
        break;
      }
    }
    if (!entry && candidate && !fromRecord) {
      const byCandidate = entries.find((e) => {
        const iv = readIf(join(P.entries, e.slug, 'interview.md'));
        return iv ? new RegExp(`candidate\\s*\`?${candidate.file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(iv) : false;
      });
      if (byCandidate) {
        entry = byCandidate;
        entryBasis = `${byCandidate.slug}/interview.md names candidate ${candidate.file} as its source`;
      }
    }
    c.entrySlug = entry ? entry.slug : null;
    c.entryPath = entry ? entry.path : null;
    c.entryMatchBasis = entryBasis || 'No entry folder under wiki/journal/entries/ could be matched to this concept.';

    // Legacy interview file, by token overlap between the candidate slug and
    // the interview's entry title from the interviews README.
    let interview = null;
    let matchBasis = null;
    if (candidate) {
      // Strongest signal: an interview file that names this candidate as its
      // source. If more than one does, drop any that another one supersedes.
      let named = interviews.filter((iv) => iv.sourceCandidate === candidate.file);
      if (named.length > 1) {
        const superseded = new Set(interviews.flatMap((iv) => iv.supersedes || []));
        const live = named.filter((iv) => !superseded.has(iv.file));
        if (live.length) named = live;
      }
      if (named.length === 1) { interview = named[0]; matchBasis = 'the interview file names this candidate as its source'; }
    }
    if (!interview && candidate) {
      const want = slugTokens(candidate.file);
      let best = null, bestScore = 0;
      interviews.forEach((iv) => {
        if (iv.entry === UNKNOWN) return;
        const have = slugTokens(iv.entry);
        const score = want.filter((t) => have.includes(t)).length;
        if (score > bestScore) { bestScore = score; best = iv; }
      });
      if (bestScore >= 3) { interview = best; matchBasis = `matched on ${bestScore} shared words between the candidate filename and the interview title`; }
    }
    c.interviewMatchBasis = matchBasis || UNKNOWN;
    c.interviewFile = interview ? interview.file : (candidate ? UNKNOWN : null);
    c.legacyInterviewFile = c.interviewFile;
    c.interviewQuestionCount = interview ? interview.questionCount : UNKNOWN;

    // A concept with no entry folder yet gets its own console page, where Matt
    // reads the proposal and answers the questions drafted for it in its legacy
    // interview file. Read from that file's "## Questions for Matt" list.
    c.questions = [];
    if (!entry && interview) {
      const src = readIf(join(REPO, 'wiki', 'journal', 'interviews', interview.file)) || '';
      const m = src.replace(/\r/g, '').match(/## Questions for Matt\s*\n([\s\S]*?)(?=\n## |$)/);
      if (m) {
        m[1].split('\n').forEach((line) => {
          const q = line.match(/^(\d+)\.\s+(.+)$/);
          if (q) c.questions.push({ label: q[1], question: q[2].trim() });
        });
      }
      c.questionsSource = `wiki/journal/interviews/${interview.file}`;
    }
    if (!entry && !c.questions.length && c.proposalQuestions?.length) {
      c.questions = c.proposalQuestions;
      c.questionsSource = `${rel(P.proposals)}, concept ${c.number}`;
    }
    c.conceptPage = entry ? null : `concept-${c.number}.html`;

    // Stage ladder. Each stage is measured; nothing is inferred forward.
    const ingested = state.records.length > 0;
    const sourced = state.framing.total !== UNKNOWN && state.framing.total > 0;

    // Interviewed, measured from the entry folder when one exists.
    let interviewedState, interviewedEvidence;
    if (entry) {
      const q = entry.questions;
      const rounds = entry.answers.count;
      if (q.total === UNKNOWN) {
        interviewedState = UNKNOWN;
        interviewedEvidence = `${entry.slug}/interview.md: ${q.basis}`;
      } else if (rounds === 0) {
        interviewedState = 'not started';
        interviewedEvidence = `${entry.slug}/interview.md holds ${q.total} question(s); no answer round is recorded in answers/.`;
      } else {
        const stillOpen = (q.open === UNKNOWN ? 0 : q.open) + (q.unanswered === UNKNOWN ? 0 : q.unanswered);
        const answered = q.answered === UNKNOWN ? UNKNOWN : q.answered;
        const base = `${entry.slug}: ${rounds} answer round(s) recording ${entry.answers.questionsRecorded} answer(s); interview.md marks ${show(answered)} of ${q.total} question(s) answered`;
        if (q.answered === UNKNOWN) {
          interviewedState = UNKNOWN;
          interviewedEvidence = `${base}. ${q.basis}`;
        } else if (stillOpen === 0 && q.partial === 0) {
          interviewedState = 'done';
          interviewedEvidence = `${base}, none open.`;
        } else {
          interviewedState = 'in progress';
          interviewedEvidence = `${base}, ${stillOpen} still open and ${show(q.partial)} partial. ${q.raisedNotAsked === UNKNOWN ? 'Questions raised but not asked: unknown.' : `${q.raisedNotAsked} question(s) raised by the answers and not yet asked.`}`;
        }
      }
    } else if (interview) {
      interviewedState = interview.status === 'open' ? 'not started' : UNKNOWN;
      interviewedEvidence = `No entry folder. Legacy file wiki/journal/interviews/${interview.file}: ${interview.statusReason}`;
    } else {
      interviewedState = candidate ? UNKNOWN : 'not started';
      interviewedEvidence = candidate
        ? 'Neither an entry folder nor a legacy interview file could be matched to this concept.'
        : 'No entry folder and no legacy interview file exists for this concept.';
    }

    // Drafted, measured from draft.md alone. A draft is never an approval.
    let draftedState, draftedEvidence;
    if (entry && entry.draft.exists) {
      draftedState = 'done';
      draftedEvidence = `${entry.slug}/draft.md exists: ${show(entry.post.bodyWordCount)} words in the entry body, ${entry.draft.wordCount} across the whole file including its notes to Matt. Drafted is not approved.`;
    } else if (entry) {
      draftedState = 'not started';
      draftedEvidence = `No draft.md in wiki/journal/entries/${entry.slug}/.`;
    } else {
      draftedState = 'not started';
      draftedEvidence = 'No entry folder exists for this concept, so there is no draft.md to measure.';
    }

    const approvalState = entry ? entry.approval : 'not approved';
    const approvalEvidence = entry
      ? entry.approvalEvidence
      : 'Approval is never inferred. No file records Matt approving this concept.';

    const stages = [
      { id: 'ingested', label: 'Ingested', state: ingested ? 'done' : 'not started',
        evidence: ingested ? `${state.records.length} dated record(s) under wiki/journal/records/` : 'No record files found.' },
      { id: 'sourced', label: 'Sourced', state: sourced ? 'done' : 'not started',
        evidence: sourced ? `${state.framing.total} framing finding(s) in wiki/journal/framing.md` : 'No framing findings found.' },
      { id: 'proposed', label: 'Concept proposed', state: 'done',
        evidence: c.sourceFile ? `Proposed in ${c.sourceFile}, section ${c.sourceSection}; recorded in wiki/journal/candidates.json` : `Proposed in ${proposalsFile}` },
      { id: 'entry', label: 'Entry opened',
        state: entry ? 'done' : 'not started',
        evidence: entry
          ? `wiki/journal/entries/${entry.slug}/ exists with ${entry.files.filter((f) => f.present).length} of ${entry.files.length} standard files. ${c.entryMatchBasis}.`
          : 'No folder under wiki/journal/entries/ is matched to this concept. Its work still lives in a legacy interview file.' },
      { id: 'interviewed', label: 'Interviewed', state: interviewedState, evidence: interviewedEvidence },
      { id: 'drafted', label: 'Drafted', state: draftedState, evidence: draftedEvidence },
      { id: 'approved', label: 'Approved', state: approvalState, evidence: approvalEvidence },
    ];
    c.stages = stages;
    c.approval = approvalState;
    c.approvalEvidence = approvalEvidence;

    // The ladder is no longer strictly sequential: this entry is drafted while
    // four of its questions are still open. So report the furthest stage that
    // measures done, and every stage that does not, rather than one position.
    const done = stages.filter((s) => s.state === 'done');
    const blocked = stages.find((s) => s.state !== 'done');
    c.furthestStage = done.length ? done[done.length - 1].label : 'nothing measured as done';
    c.outstandingStages = stages
      .filter((s) => s.state !== 'done')
      .map((s) => ({ label: s.label, state: s.state }));
    c.currentStage = c.furthestStage;
    c.currentStageState = done.length ? 'done' : UNKNOWN;
    c.nextStage = blocked ? blocked.label : null;
    c.nextStageState = blocked ? blocked.state : null;
    c.nextStageEvidence = blocked ? blocked.evidence : 'Every measured stage reads done.';
    c.interviewStatus = interviewedState;

    // What is actually needed next, named from the blocked stage rather than
    // assumed to be a headline decision.
    if (approvalState !== 'approved' && draftedState === 'done') {
      c.waitingOn = 'Matt — the draft is written and unapproved. Nothing here approves it.';
    } else if (blocked && blocked.id === 'interviewed') {
      c.waitingOn = 'Matt — the open interview questions';
    } else if (blocked && blocked.id === 'entry') {
      c.waitingOn = 'An entry folder under wiki/journal/entries/, then the interview';
    } else if (blocked && blocked.id === 'drafted') {
      c.waitingOn = 'Drafting, which runs without Matt once the gates pass';
    } else {
      c.waitingOn = 'Matt — headline and description approval';
    }
  });
}
// --------------------------------------------------------------- prompts
//
// The console does not own a single word of any prompt. The wording lives in
// console/prompt-templates.json, one entry per prompt kind, each carrying the
// seven parts fixed by wiki/journal/prompt-structure.md. This function only
// substitutes {{placeholders}} from measured state.
//
// A placeholder with no value is NOT dropped: it renders as a visible marker,
// because an empty slot means the state model cannot carry that part yet.

const MISSING = (name) => `[no value for {{${name}}}: the console's state model cannot supply this yet]`;

// Loose name match between a queue.md row and a concept, used only to decide
// which group a concept sits in when no entry folder links them.
const normName = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function fill(text, ctx) {
  if (typeof text !== 'string') return text;
  return text.replace(/\{\{([A-Za-z0-9_]+)\}\}/g, (m, key) => {
    const v = ctx[key];
    if (v === undefined || v === null || v === '' || v === UNKNOWN) return MISSING(key);
    return String(v);
  });
}

// A list item that is exactly one placeholder expands to however many lines
// the state holds for it.
function fillList(list, ctx) {
  const out = [];
  (list || []).forEach((item) => {
    const solo = typeof item === 'string' && item.match(/^\{\{([A-Za-z0-9_]+)\}\}$/);
    if (solo) {
      const v = ctx[solo[1]];
      if (Array.isArray(v)) { v.forEach((x) => out.push(String(x))); return; }
      if (v === undefined || v === null || v === '' || v === UNKNOWN) { out.push(MISSING(solo[1])); return; }
      out.push(String(v));
      return;
    }
    out.push(fill(item, ctx));
  });
  return out;
}

function loadTemplates() {
  const path = TEMPLATES_PATH;
  const src = readIf(path);
  if (!src) {
    note(`prompt-templates.json not found at ${rel(path)}; no prompt can be assembled.`);
    return null;
  }
  try {
    return JSON.parse(src);
  } catch (err) {
    note(`prompt-templates.json could not be parsed (${err.message}); no prompt can be assembled.`);
    return null;
  }
}

// Everything a template may substitute, measured here and nowhere else.
function promptContexts(state, templates) {
  const shared = (templates && templates.shared) || {};
  const proposalsFile = basename(state.sources.proposals);
  const today = String(state.generatedAt).slice(0, 10);
  const newest = state.records[0];

  const base = {
    today,
    proposalsFile,
    reportLimits: shared.reportLimits || '',
    newestRecordLine: newest
      ? `wiki/journal/records/${newest.file}  (the newest record, captured ${newest.captured})`
      : '',
    coverageSummary: state.coverage.channels.length
      ? state.coverage.channels.map((c) => `${c.channel} last run ${c.lastRun}`).join('; ')
      : '',
    channelsNeverRun: state.coverage.channels.length
      ? (state.coverage.channels.filter((c) => !c.hasRun).map((c) => c.channel).join(', ')
        || 'none; every channel has run at least once')
      : '',
    framingCounts: state.framing.total === UNKNOWN
      ? ''
      : `framing.md currently holds ${state.framing.total} finding(s), of which ${show(state.framing.dateOrderUnverified)} carry a date order marked unverified.`,
    answersIndexState: state.answersIndex.found
      ? `${show(state.answersIndex.answered)} question(s) already answered, ${show(state.answersIndex.open)} asked and still open`
      : '',
    briefLine: existsSync(P.diagramsPrompt)
      ? 'discussion/handoff/CODEX-PROMPT-diagrams.md  (the diagram brief)'
      : 'discussion/handoff/CODEX-PROMPT-diagrams.md  (NOT FOUND when this prompt was generated: locate the current diagram brief before proceeding, and do not guess)',
  };

  // Per concept, for the interview and draft prompts.
  const forConcept = (c) => {
    const e = c.entrySlug ? state.entries.find((x) => x.slug === c.entrySlug) : null;
    const entryBase = e ? `wiki/journal/entries/${e.slug}` : 'wiki/journal/entries/<slug>';
    const entryFiles = e
      ? [
          `${entryBase}/README.md  (the anchor: read this before anything else in the entry)`,
          `${entryBase}/interview.md  (questions, self answer verdicts, analysis, gate report)`,
          `${entryBase}/answers/  (${e.answers.count} round(s), verbatim and never edited: ${e.answers.rounds.map((r) => r.file).join(', ') || 'none yet'})`,
          ...e.measurements.map((m) => `${entryBase}/${m.file}  (a measurement already taken for this entry)`),
          `${entryBase}/assets.md  (what artwork exists; nothing is authored in the entry folder)`,
        ]
      : [
          c.legacyInterviewFile && c.legacyInterviewFile !== UNKNOWN
            ? `wiki/journal/interviews/${c.legacyInterviewFile}  (the legacy interview file for this concept; it migrates into an entry folder)`
            : 'wiki/journal/interviews/README.md  (no legacy interview file is matched to this concept; pick or create one with Matt)',
        ];

    return {
      ...base,
      conceptHeadline: c.headline,
      // A candidates.json record points at its own proposals file and section.
      ...(c.sourceFile ? { proposalsFile: basename(c.sourceFile), conceptNumber: c.sourceSection } : { conceptNumber: c.number }),
      conceptTitle: c.title,
      conceptState: `${c.origin}. Headline "${c.headline}" (${show(c.headlineCharCountMeasured)} characters). Approval: ${c.approval}. Furthest stage measured done: ${c.furthestStage}. Not done: ${c.outstandingStages.map((s) => `${s.label} (${s.state})`).join(', ') || 'nothing'}.`,
      entryBase,
      entryFiles,
      slug: e ? e.slug : '<slug>',
      entryState: e
        ? `wiki/journal/entries/${e.slug}/ (${c.entryMatchBasis}). Questions: ${show(e.questions.total)} on file, ${show(e.questions.answered)} answered, ${show(e.questions.open)} open, ${show(e.questions.unanswered)} still reading UNANSWERED, ${show(e.questions.raisedNotAsked)} raised by the answers and not yet asked. Answer rounds: ${e.answers.count}${e.answers.count ? ` (${e.answers.rounds.map((r) => `round ${show(r.round)} on ${show(r.date)}, ${r.questionsRecorded} answer(s)`).join('; ')})` : ''}. Draft: ${e.draft.exists ? `draft.md exists, ${show(e.post.bodyWordCount)} words in the entry body` : 'none'}. Approval: ${e.approval}.${e.staleClaims.length ? ` Unreconciled in the files: ${e.staleClaims.join(' ')}` : ''}`
        : 'No entry folder exists for this concept, so nothing about its interview has been measured.',
      candidateFileLine: c.candidateFile && c.candidateFile !== UNKNOWN
        ? `wiki/journal/candidates/${c.candidateFile}  (the candidate being rebuilt)`
        : '',
      argument: c.argument,
      onlyMatt: c.onlyMattCanSupply,
      category: c.category,
      service: c.service,
      approvalState: c.approval,
      interviewState: c.interviewStatus,
      draftLine: e
        ? (e.draft.exists
            ? `A draft already exists at ${entryBase}/draft.md, ${show(e.post.bodyWordCount)} words in the entry body. This is a revision, not a first draft: read it before rewriting anything and keep what the rounds support.`
            : `No draft.md exists yet in ${entryBase}/. It is created only after the gates pass.`)
        : 'No entry folder exists for this concept, so there is nowhere to write a draft yet. Run the interview prompt first.',
    };
  };

  const forEntry = (e) => ({
    ...base,
    entrySlug: e.slug,
    entryTitle: e.title,
    payload: '{{PAYLOAD}}', // filled in the page from what Matt typed or selected
  });

  return { base, forConcept, forEntry };
}

function assembleParts(tpl, ctx, templates) {
  const shared = (templates && templates.shared) || {};
  return {
    ask: fill(tpl.ask, ctx),
    noContext: shared.noContextLine || '',
    readFirst: (shared.readFirstAlways || []).concat(fillList(tpl.readFirst, ctx)).filter((x) => x && !/^\s*$/.test(x)),
    rule: fillList(tpl.rule, ctx),
    payload: fill(tpl.payload, ctx),
    writeTo: fillList(tpl.writeTo, ctx),
    report: fillList(tpl.report, ctx),
    refresh: shared.refresh || '',
  };
}

function buildPrompts(state) {
  const templates = loadTemplates();
  state.promptTemplates = {
    path: 'wiki/journal/console/prompt-templates.json',
    found: Boolean(templates),
    version: templates ? templates.version : UNKNOWN,
    rule: 'Prompt wording lives in this file, never in the generator or the page. Change the words there and regenerate.',
  };
  if (!templates) return [];

  const ctxs = promptContexts(state, templates);
  const out = [];

  // Prompts are for live work. A concept is offered on prompts.html only
  // while queue.md lists it in the Queue group: published and rejected rows
  // are left out. The group is read from queue.md, never from a list here.
  const sameRow = (row, c) =>
    (c.entrySlug && row.slug === c.entrySlug)
    || normName(row.entry) === normName(c.headline)
    || normName(row.entry) === normName(c.title);
  const inQueueGroup = (c) => {
    if (!state.queue.found) return true;
    if (state.queue.published.some((r) => sameRow(r, c))) return false;
    if (state.queue.rejected.some((r) => sameRow(r, c))) return false;
    return state.queue.queue.some((r) => sameRow(r, c));
  };

  Object.keys(templates.prompts).forEach((id) => {
    const tpl = templates.prompts[id];
    // Templates that belong to a control on an entry or the queue are
    // assembled with that control's context further down, not here.
    if (tpl.surface && tpl.surface !== 'prompts') return;
    let options = [null];
    if (tpl.choice && tpl.choice.from === 'channels') {
      options = state.coverage.channels.map((c) => c.channel);
      if (!options.length) options = [null];
    } else if (tpl.choice && tpl.choice.from === 'concepts') {
      options = state.concepts.filter(inQueueGroup).map((c) => c.headline);
      if (!options.length) {
        out.push({
          id,
          title: tpl.title,
          kind: tpl.kind,
          surface: tpl.surface || 'prompts',
          plain: tpl.plain || null,
          fileMissing: null,
          emptyNote: state.queue.found
            ? 'Nothing in the Queue group of queue.md, so this prompt has no live work to offer.'
            : 'queue.md was not found, so no live work could be read for this prompt.',
          choiceLabel: tpl.choice.label,
          variants: [],
        });
        return;
      }
    }

    const variants = options.map((choice) => {
      let ctx;
      if (tpl.choice && tpl.choice.from === 'concepts') {
        const c = state.concepts.find((k) => k.headline === choice) || state.concepts[0];
        ctx = c ? ctxs.forConcept(c) : { ...ctxs.base };
      } else if (tpl.choice && tpl.choice.from === 'channels') {
        ctx = { ...ctxs.base, channel: choice };
      } else {
        ctx = { ...ctxs.base };
      }
      return { choice, parts: assembleParts(tpl, ctx, templates) };
    });

    out.push({
      id,
      title: tpl.title,
      kind: tpl.kind,
      surface: tpl.surface || 'prompts',
      plain: tpl.plain || null,
      fileMissing: id === 'assets' && !existsSync(P.diagramsPrompt) ? 'discussion/handoff/CODEX-PROMPT-diagrams.md' : null,
      choiceLabel: tpl.choice ? tpl.choice.label : null,
      variants,
    });
  });

  // The controls that live on an entry's own pages carry the same seven
  // parts, with the payload left for the page to fill from what Matt typed
  // or selected. Their wording comes from the same template file.
  state.entries.forEach((e) => {
    const ctx = ctxs.forEntry(e);
    e.controlPrompts = {};
    ['answers', 'approve'].forEach((id) => {
      if (!templates.prompts[id]) return;
      e.controlPrompts[id] = assembleParts(templates.prompts[id], ctx, templates);
    });
  });

  // A concept page's answer control: the same seven parts, with the concept's
  // own context and the payload filled from what Matt typed on the page.
  state.concepts.filter((c) => c.conceptPage).forEach((c) => {
    c.controlPrompts = {};
    if (templates.prompts['concept-answers']) {
      c.controlPrompts.answers = assembleParts(templates.prompts['concept-answers'], { ...ctxs.forConcept(c), payload: '{{PAYLOAD}}' }, templates);
    }
  });

  state.queuePrompts = {};
  ['reject', 'reopen'].forEach((id) => {
    if (!templates.prompts[id]) return;
    state.queuePrompts[id] = assembleParts(templates.prompts[id], { ...ctxs.base, payload: '{{PAYLOAD}}', entrySlug: 'the queue', entryTitle: 'the queue' }, templates);
  });

  return out;
}


// ------------------------------------------------------------------- build

function build() {
  const state = {
    schemaVersion: 1,
    name: 'Making Things Work Journal console state',
    generatedAt: NOW,
    generator: 'apps/mtw/modules/journal/lib/state.ts',
    honesty: {
      unknownToken: UNKNOWN,
      approvalRule: 'Approval is never inferred from a file. Every concept reads "not approved" unless a file explicitly records an approval.',
      measurementRule: 'Every value in this file was measured from a repo file. Where a state could not be measured it reads "unknown".',
    },
    sources: {
      proposals: rel(P.proposals),
      candidates: rel(P.candidates),
      entries: rel(P.entries),
      answersIndex: rel(P.answersIndex),
      interviewProtocol: rel(P.interviewProtocol),
      interviews: rel(P.interviews),
      records: rel(P.records),
      framing: rel(P.framing),
      ingestion: rel(P.ingestion),
    },
  };

  const proposals = parseProposals();
  state.concepts = proposals.concepts;
  state.backlog = proposals.backlog;
  state.pausedCandidates = proposals.pausedCandidates;
  state.candidates = parseCandidates();
  state.entries = parseEntries();
  state.answersIndex = parseAnswersIndex();
  state.interviews = parseInterviews(state.entries);
  state.legacyInterviews = {
    count: state.interviews.length,
    folder: rel(P.interviews),
    migrated: 0,
    note: 'The original interview files. None has been deleted; each migrates into wiki/journal/entries/<slug>/ when its entry is picked up. A file listed here is NOT the current state of any entry that has an entry folder.',
    supersededByAnEntry: state.interviews.filter((i) => i.supersededByEntry).map((i) => i.file),
  };
  state.queue = parseQueue();
  // Where queue.md and the entry folders disagree, both are shown and
  // neither is picked.
  state.queue.disagreements = [];
  state.queue.queue.forEach((r) => {
    if (r.slug && !existsSync(join(P.entries, r.slug))) {
      state.queue.disagreements.push(`queue.md lists "${r.entry}" pointing at wiki/journal/entries/${r.slug}/, and that folder does not exist.`);
    }
  });
  state.entries.forEach((e) => {
    const inQueue = state.queue.queue.some((r) => r.slug === e.slug)
      || state.queue.published.some((r) => r.slug === e.slug)
      || state.queue.rejected.some((r) => r.slug === e.slug);
    if (state.queue.found && !inQueue) {
      state.queue.disagreements.push(`The entry folder wiki/journal/entries/${e.slug}/ exists and queue.md lists it in no group.`);
    }
  });

  state.records = parseRecords();
  state.framing = parseFraming();
  state.coverage = parseCoverage();

  linkConcepts(state);

  // The plain-language glosses, from the implementation plan's table. Every
  // page emits the gloss for a term beside its first use on that page.
  state.glossary = [
    { term: 'Gate A', gloss: 'Whether Matt has given a decision, a mistake and a number. Without all three the entry is not worth writing.' },
    { term: 'Self answer pass', gloss: 'Checking what Matt has already told us before asking him anything.' },
    { term: 'CLOSED / SHARPENED / STANDS / DEEPEN', gloss: 'Already answered / ask a narrower version / genuinely new / dig into something he already said.' },
    { term: 'Channel', gloss: 'Where outside thinking was read from: his bookmarks, his reading history, a person’s timeline, the web.' },
    { term: 'Framing finding', gloss: 'Something the industry says, paired with what MTW actually does about it.' },
    { term: 'Immersive set', gloss: 'The diagrams and role stories that sit inside the entry.' },
    { term: 'Record', gloss: 'The dated evidence file a run leaves behind.' },
  ];

  // What is actually waiting on Matt, measured per entry rather than as a
  // list of every unapproved concept. Nothing here infers a decision: an
  // absent decision is reported as absent.
  state.waiting = [];
  // Published and rejected entries are finished or parked, so they never wait on Matt (Matt, 2026-10-11).
  const parked = new Set([...state.queue.published, ...state.queue.rejected].map((r) => r.slug).filter(Boolean));
  state.entries.filter((e) => !parked.has(e.slug)).forEach((e) => {
    const add = (ask, detail, where) =>
      state.waiting.push({ entrySlug: e.slug, entryTitle: e.title, ask, detail, where });

    if (e.draft.exists && e.approval !== 'approved') {
      add('Read the draft and decide',
        `draft.md exists: ${show(e.post.bodyWordCount)} words in the entry itself, ${e.draft.wordCount} across the whole file including its notes to him. ${e.approvalEvidence}`,
        `entry-${e.slug}.html`);
    }
    if (e.post.found && e.post.openQuestionCount !== UNKNOWN && e.post.openQuestionCount > 0) {
      add(`Answer ${e.post.openQuestionCount} question${e.post.openQuestionCount === 1 ? '' : 's'} the draft asks him`,
        e.post.openQuestions.map((q) => `${q.number}. ${q.text}`).join(' '),
        `entry-${e.slug}.html`);
    }
    const covers = e.assets.covers || [];
    // A row whose Option cell says "Chosen" records Matt's choice, the same rule renderPost uses; stop asking then.
    if (covers.length > 1 && !covers.some((c) => /chosen/i.test(c.option))) {
      add(`Choose the cover, ${covers.length} exist`,
        `${covers.map((c) => `${c.option}: ${c.file}`).join('; ')}. No file in this entry records a choice, and a choice is never inferred.`,
        `entry-${e.slug}.html`);
    }
    const stillOpen = (e.questions.open === UNKNOWN ? 0 : e.questions.open)
      + (e.questions.unanswered === UNKNOWN ? 0 : e.questions.unanswered);
    const raised = e.questions.raisedNotAsked === UNKNOWN ? 0 : e.questions.raisedNotAsked;
    if (stillOpen + raised > 0) {
      add(`${stillOpen + raised} interview question${stillOpen + raised === 1 ? '' : 's'} nobody has put to him`,
        `${stillOpen} still open in the question table, ${raised} raised by his own answers and never asked.`,
        `entry-${e.slug}.html`);
    }
  });

  // Candidates: proposed concepts with no entry folder that queue.md has not published or rejected.
  // Each waits on Matt's headline decision; a held concept says so rather than being hidden.
  liveCandidates(state).forEach((c) => {
    state.waiting.push({
      entrySlug: null,
      conceptNumber: c.number,
      entryTitle: c.headline,
      ask: c.held ? 'Held candidate: reopen or reject' : 'Choose the headline, or reject it',
      detail: [c.description, c.assessment].filter((v) => v && v !== UNKNOWN).join(' '),
      where: `concept-${c.number}`,
    });
  });

  // Everything currently waiting on an answer from Matt for one entry,
  // gathered from the files rather than listed by hand. The post preview
  // page turns this into a form he can type into and copy back.
  state.entries.forEach((e) => {
    const groups = [];

    if (e.post.found && e.post.openQuestions.length) {
      groups.push({
        id: 'draft',
        title: 'Questions the draft asks you',
        why: 'These change the words in the entry itself. It is not finished until they are answered.',
        source: `${e.path}/draft.md, the "Open questions for you" list`,
        items: e.post.openQuestions.map((q) => ({ label: `draft-${q.number}`, question: q.text })),
      });
    }

    if (e.questions.raised && e.questions.raised.length) {
      groups.push({
        id: 'raised',
        title: 'Questions your own answers raised, which nobody has asked you',
        why: 'Each one came out of something you said in an earlier round. Nothing has been assumed either way while they sit here.',
        source: `${e.path}/interview.md, the "Raised by the answers, not yet asked" list`,
        items: e.questions.raised.map((q) => ({ label: String(q.number), question: q.question })),
      });
    }

    const stillOpenRows = e.questions.rows.filter((r) => r.state === 'open' || r.state === 'unanswered' || r.state === 'unknown');
    if (stillOpenRows.length) {
      groups.push({
        id: 'open',
        title: 'Interview questions the file still reads as open',
        why: 'The question table does not record an answer for these, so the entry is resting on something that is not written down.',
        source: `${e.path}/interview.md, the question table`,
        items: stillOpenRows.map((r) => ({ label: String(r.number), question: r.question, note: `The table says: ${r.stateText}` })),
      });
    }

    const covers = e.assets.covers || [];
    // A row whose Option cell says "Chosen" records Matt's choice, the same rule renderPost uses; stop asking then.
    if (covers.length > 1 && !covers.some((c) => /chosen/i.test(c.option))) {
      groups.push({
        id: 'cover',
        title: 'The cover',
        why: 'This decides which image the entry carries. Both images exist, no file records a choice, and a choice is never assumed from a file.',
        source: `${e.path}/assets.md, the cover table`,
        items: [{
          label: 'cover',
          question: `Which cover should this entry carry: ${covers.map((c) => `${c.option} (${c.file})`).join(', ')}? The drafting skill now asks for five concepts to choose from rather than one produced, so "offer me five first" is an answer.`,
        }],
      });
    }

    e.questionsForMatt = groups;
    e.questionsForMattCount = groups.reduce((n, g) => n + g.items.length, 0);
  });

  state.conceptsWithoutEntry = state.concepts.filter((c) => !c.entrySlug).length;

  state.pages = {
    index: 'index.html',
    prompts: 'prompts.html',
    perEntry: state.entries.map((e) => ({ slug: e.slug, post: `post-${e.slug}.html`, detail: `entry-${e.slug}.html`, localSite: localSiteUrl(e.slug) })),
    perConcept: state.concepts.filter((c) => c.conceptPage).map((c) => ({ number: c.number, page: c.conceptPage })),
  };

  state.waitingOnMatt = state.concepts
    .filter((c) => c.approval === 'not approved')
    .map((c) => ({
      conceptNumber: c.number,
      headline: c.headline,
      headlineCharCountMeasured: c.headlineCharCountMeasured,
      headlineCharCountStated: c.headlineCharCountStated,
      description: c.description,
      argument: c.argument,
      origin: c.origin,
      category: c.category,
      service: c.service,
      entrySlug: c.entrySlug,
      currentStage: c.currentStage,
      currentStageState: c.currentStageState,
      decision: c.waitingOn,
      approvalEvidence: c.approvalEvidence,
    }));

  const sumMeasured = (list, pick) =>
    list.reduce((n, x) => { const v = pick(x); return v === UNKNOWN ? n : n + v; }, 0);
  const openQuestions =
    sumMeasured(state.entries, (e) => e.questions.open) +
    sumMeasured(state.entries, (e) => e.questions.unanswered);
  const raisedNotAsked = sumMeasured(state.entries, (e) => e.questions.raisedNotAsked);
  const draftsWritten = state.entries.filter((e) => e.draft.exists).length;
  const answerRounds = state.entries.reduce((n, e) => n + e.answers.count, 0);

state.limits = [
    'The bookmarks list was not exhausted; bookmarks older than the earliest captured item were not reached.',
    'No noticed-date is available from the browser bookmarks view, so the lead-time rule cannot be tested from that capture.',
    state.pausedCandidates.length
      ? `${state.pausedCandidates.join(' ')} They wait for a targeted ingestion run rather than being rebuilt on nothing.`
      : 'Candidates with no new ammunition could not be read from the proposals file.',
    `${state.interviews.length} legacy interview file(s) remain in wiki/journal/interviews/ and none has been migrated into an entry folder. Their question state is read from the legacy "UNANSWERED" markers only, which is a weaker measurement than an entry's question table.`,
    ...state.entries.flatMap((e) => e.staleClaims.map((s) => `Unreconciled inside wiki/journal/entries/${e.slug}/: ${s} This console reports what each file says and does not choose between them.`)),
  ];

  state.generatorNotes = notes;

  const counts = {
    concepts: state.concepts.length,
    backlog: state.backlog.length,
    candidates: state.candidates.length,
    entries: state.entries.length,
    entriesDrafted: draftsWritten,
    answerRounds,
    answersRecordedInRounds: state.entries.reduce((n, e) => n + e.answers.questionsRecorded, 0),
    entryQuestions: sumMeasured(state.entries, (e) => e.questions.total),
    entryQuestionsAnswered: sumMeasured(state.entries, (e) => e.questions.answered),
    entryQuestionsOpen: openQuestions,
    entryQuestionsRaisedNotAsked: raisedNotAsked,
    indexQuestionsTotal: state.answersIndex.total,
    indexQuestionsAnswered: state.answersIndex.answered,
    indexQuestionsOpen: state.answersIndex.open,
    indexTopics: state.answersIndex.topicCount,
    legacyInterviews: state.interviews.length,
    legacyInterviewsMigrated: 0,
    interviews: state.interviews.length,
    interviewsOpen: state.interviews.filter((i) => i.status === 'open').length,
    interviewsUnknown: state.interviews.filter((i) => i.status === UNKNOWN).length,
    records: state.records.length,
    framingFindings: state.framing.total,
    framingDateOrderUnverified: state.framing.dateOrderUnverified,
    channels: state.coverage.channels.length,
    channelsNeverRun: state.coverage.channels.filter((c) => !c.hasRun).length,
    approved: state.entries.filter((e) => e.approval === 'approved').length,
    unreconciledClaims: state.entries.reduce((n, e) => n + e.staleClaims.length, 0),
  };
  state.counts = counts;

  state.prompts = buildPrompts(state);

  return state;
}

export function buildState(opts: BuildOptions) {
  for (const m of Object.values(memo)) m.clear();
  REPO = opts.repoRoot;
  const chosen = chooseProposals(REPO, opts.proposalsFile);
  P = {
    proposals: join(REPO, 'wiki', 'journal', 'candidates', chosen.file ?? 'PROPOSALS-missing.md'),
    explicitProposals: Boolean(opts.proposalsFile),
    candidates: join(REPO, 'wiki', 'journal', 'candidates'),
    entries: join(REPO, 'wiki', 'journal', 'entries'),
    answersIndex: join(REPO, 'wiki', 'journal', 'answers-index.md'),
    interviews: join(REPO, 'wiki', 'journal', 'interviews'),
    records: join(REPO, 'wiki', 'journal', 'records'),
    framing: join(REPO, 'wiki', 'journal', 'framing.md'),
    ingestion: join(REPO, 'wiki', 'journal', 'ingestion.md'),
    journalReadme: join(REPO, 'wiki', 'journal', 'README.md'),
    interviewProtocol: join(REPO, 'wiki', 'journal', 'interview-protocol.md'),
    candidateQuality: join(REPO, 'wiki', 'journal', 'candidate-quality.md'),
    diagramsPrompt: join(REPO, 'discussion', 'handoff', 'CODEX-PROMPT-diagrams.md'),
    queue: join(REPO, 'wiki', 'journal', 'queue.md'),
  };
  SCENES = join(REPO, 'wiki', 'image-library', 'assets', 'scenes', 'journal');
  TEMPLATES_PATH = opts.templatesPath ?? join(REPO, 'wiki', 'journal', 'console', 'prompt-templates.json');
  NOW = opts.now ?? new Date().toISOString();
  notes = [];
  return build();
}

/** One line of measured state for an operation's optional "state" parameter (concept and entry lines of the old prompts). */
export function measuredState(state, { entry, concept }: { entry?: string; concept?: string }) {
  const ctxs = promptContexts(state, null);
  let c = null;
  if (concept) c = state.concepts.find((k) => String(k.number) === String(concept) || k.headline === concept) || null;
  if (!c && entry) c = state.concepts.find((k) => k.entrySlug === entry) || null;
  if (!c) return entry ? `Entry ${entry}: no proposed concept matches this entry folder, so no pipeline is measured.` : '';
  const ctx = ctxs.forConcept(c);
  return `Concept: ${ctx.conceptState} Entry: ${ctx.entryState}`;
}
