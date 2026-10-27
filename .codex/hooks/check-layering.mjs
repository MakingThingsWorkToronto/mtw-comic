#!/usr/bin/env node
// check-layering — REFUSES a write that would INTRODUCE commentary layered over a stale surface,
// instead of that surface being brought up to date.
//
// STRATA AND LAYERING is Matt's term for the defect: a surface records decision A, then decision C
// contradicting A, then decision T amending C, and nothing marks which is live. The fact base fills
// with layered contradictory instruction and every later reader has to guess. It happened here on
// 2026-09-17 to .claude/skills/journal-entry/SKILL.md — four successive tone corrections accumulated
// in one file, all still present, none marked dead, 855 lines of which roughly half was post-mortem.
//
// WHY A HEURISTIC GUARD MAY BLOCK. A guard that blocks on a false positive gets disabled, so the
// refusal is scoped to the one shape a false positive rarely takes: a signature CLASS the pre-write
// file did not already carry. A class the file already carries never refuses — the existing stock is
// burned down by the repo scan, not by blocking every edit to a file that carries it — and each
// needle's sentence-level discriminators (below) keep the class judgement itself honest.
//
// NO MODEL, no network, no tokens. It is a text scan on a write.
//
// TWO MODES:
//   (hook)   PreToolUse on Write|Edit — reads the tool payload on stdin BEFORE the tool runs, so
//            the file on disk is the PRE-WRITE content. Exit contract: 0 = allow, the write
//            introduces no new signature class; 2 = refuse, with the introduced classes named on
//            stderr for the agent; 1 = CANNOT MEASURE (unparseable payload, unreadable prior) —
//            fail-open in the harness, which only blocks on 2, but distinguishable from a pass,
//            because one code path must never produce both "measured clean" and "could not
//            measure". An absent file is an empty prior, so any class is new there.
//            CHECK_LAYERING_ROOT points the prior-read at a planted tree; it exists because this
//            mode READS the tree, and a probe that could only be judged against the real repo could
//            never plant a prior.
//   --scan   repo-wide report over the surfaces agents read as instruction or fact. This is how the
//            existing stock gets CLOSED rather than merely observed: run it, fix what it names, run
//            it again. Exits 0 by default; `--strict` exits 1 when anything is found.
//
// Usage:
//   node .claude/hooks/check-layering.mjs --scan
//   node .claude/hooks/check-layering.mjs --scan --strict
//
// This file is mirrored byte-identically at .codex/hooks/check-layering.mjs, on the same footing as
// the two skill trees: a change made in one is made identically in the other.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeSurfaces } from './lib/write-payload.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// --- Discrimination -----------------------------------------------------------------------------
// A needle matches a PHRASE; only the sentence around it says whether that phrase is the defect.
// "The preview server this check starts does not exist yet" is a measured fact about a runtime,
// while "the exporter deriving the manifest does not exist yet" is a gap recorded in place. Same
// words, opposite verdicts. A guard that cannot tell them apart teaches its readers to reword true
// statements, and a needle that fires on a truth is how a guard gets ignored.
//
// So each signature may carry `notWhen`, a predicate over the match's SURROUNDINGS that returns true
// when the hit is not the class the needle exists to catch. Every discriminator below is a property
// of the sentence, never of the file: a per-file exemption cannot tell the covered class from the
// uncovered one.

/** Comment continuation markers are typography, and leaving them in the window makes a wrapped
 * clause read as though a new one opened. Stripped before any discriminator reads the text. */
const COMMENT_PREFIX = /^\s*(?:\/\/+|\/\*+|\*+)\s?/;

/**
 * The text around a hit, reconstructed ACROSS THE HARD WRAP. A first version reached one line either
 * side on the theory that a sentence spans at most two lines; that was measured wrong — a wrapped
 * sentence ran to three lines with the clause that decided the verdict entirely outside the window —
 * so the window reaches one line back and two lines forward. Backward stays at one line because
 * `before` is cut to this sentence's own opening anyway; forward carries the justifying
 * continuation, which is often the sentence that follows.
 *
 * `before` is cut back to the previous sentence end: a neighbouring sentence's subject must not be
 * allowed to speak for this one, or an unrelated attribution two clauses away becomes an excuse.
 */
export function surroundings(lines, i, matched) {
  const strip = (s) => String(s ?? '').replace(COMMENT_PREFIX, '').trim();
  const parts = [strip(lines[i - 1]), strip(lines[i]), strip(lines[i + 1]), strip(lines[i + 2])];
  const joined = parts.join(' ');
  const from = joined.indexOf(matched, parts[0].length + 1);
  const at = from < 0 ? joined.indexOf(matched) : from;
  if (at < 0) return { before: '', after: '' };
  return {
    before: joined.slice(0, at).split(/(?<=[.!?])\s+/).pop(),
    after: joined.slice(at + matched.length),
  };
}

/** The things this repo BUILDS. A subject naming one of these is the class the declared-gap needle
 * exists to catch, so it VETOES the subject-shape excuses below — "the helper for the tour data does
 * not exist yet" is a gap however many runtime nouns the sentence also contains. */
const REPO_ARTIFACT = /\b(?:generator|producer|exporter|importer|module|script|helper|page|file|test|suite|gate|hook|skill|template|manifest|schema|diagram|tour|entry|asset|component|variant)s?\b|\.(?:md|json|mjs|js|ts|svg|astro|html|css)\b/i;

/**
 * The things a RUN or a DEPLOYMENT holds. "does not exist yet" said of one of these is a measured or
 * target-state fact about a runtime, not a missing repo artifact: there is no producer to build and
 * no claim to drop.
 *
 * ADAPTED. The donor guard listed cloud-subscription nouns, which name nothing in this repo. The
 * class is unchanged — a runtime or target-state object rather than an authored artifact — and the
 * vocabulary is this repo's: what a build, a dev server, a browser session or a deploy holds.
 */
const DEPLOYED_OBJECT = /\b(?:build (?:output|artifact)|dev server|preview server|deployment|deploy|production site|domain|route|browser|browser session|tab|viewport|screenshot|recording|render|frame|server|database|endpoint|instance|cache|session)s?\b/i;

/** An indefinite noun phrase opening a relative clause — "against a viewport that". That shape
 * describes a CLASS of condition; a gap recorded in place names the specific thing that is missing. */
const GENERIC_RELATIVE = /\b(?:a|an|any|some) (?:[\w-]+ ){0,3}(?:that|which) $/i;

/** A bare pronoun SUBJECT. The needle's own remedy — build the producer or drop the claim — needs a
 * named producer, and "say plainly that it does not exist yet" names none.
 *
 * The lookbehind is load-bearing and was measured, not predicted: without it the pronoun matched as
 * the OBJECT of a preposition too, so "the renderer for it does not exist yet" — a gap naming its own
 * missing producer — went silent. A pronoun only defeats the remedy when it is what the sentence is
 * about. */
const BARE_PRONOUN = /(?<!\b(?:for|of|to|with|from|about|on|in|at|by|against|into|over|under|after|before|behind|around)\s)\b(?:it|they|these|those|one) $/i;

/** The party OWED is a READER or acting session — "what a resuming session is owed", "Matt is owed
 * the reason" — or the owed thing is a READ that actor performs ("that read is owed on every item").
 * Each declares a standing duty to read or to be told, procedure rather than a repo artifact whose
 * construction was deferred: there is no producer to build and no claim to drop. Applied only when
 * the match itself contains `owed`, and keyed to the subject noun ENDING `before`, so "the exporter
 * is owed" still fires. */
const OWED_TO_READER = /\b(?:sessions?|humans?|readers?|agents?|operators?|reads?|reviewers?|Matt) $/i;

/** A NEGATED debt — "nothing is owed", "no grouping argument is owed" — asserts that no requirement
 * exists, which is the opposite of an unpaid item and cannot be a gap recorded in place.
 *
 * The needle's own lookbehinds already refuse this shape, and they are kept: they are what stops the
 * MATCH. This predicate is the same rule read over the WRAP-RECONSTRUCTED sentence, and that
 * difference is the whole defect — `sig.re` is tested against ONE LINE while every other
 * discriminator reads `surroundings`, so a hard wrap falling between the negator and the phrase
 * defeats a line-local lookbehind and nothing else. The window mirrors the lookbehinds' own — `no`
 * plus at most two words — so the two homes cannot drift, and the words must be CONTIGUOUS, which
 * keeps a negator in an earlier clause ("There is no consumer for it; the exporter is owed") firing
 * as it should. */
const NEGATED_DEBT = /\b(?:nothing|none|no(?: [\w-]+){0,2}) $/i;

/** Externally-supplied INPUT, absent because nobody has produced it. Discriminating only when the
 * same sentence asserts the consuming mechanism is BUILT (tested at the use site): "Built at both
 * ends; the data does not exist yet" is a measured statement about input this repo cannot
 * manufacture, not a producer it deferred. */
const EXTERNAL_INPUT = /\b(?:data|actuals|answers|interview) $/i;

/** A research uncertainty whose evidence is not settled — "keep the strategy gap open". The verdict
 * is refusing to manufacture a fact from an exhausted or ambiguous search, not recording an artifact
 * somebody still has to build. Restricted to the explicit GAP OPEN marker and to evidence nouns at
 * the end of the subject; the REPO_ARTIFACT veto at the use site keeps "the strategy generator gap
 * open" firing. */
const RESEARCH_UNCERTAINTY = /\b(?:strategy|claim|evidence|source|currentness|question) $/i;

/** The because-clause names the RUN ITSELF as what creates the absent subject — "the file does not
 * exist yet because the build itself creates it". This is the runtime-condition class the code-file
 * rule already recognises, stated with an abstract subject instead of a runtime noun; a
 * because-clause naming a repo artifact ("because the exporter that creates it was never written")
 * does not match and still fires. */
const RUNTIME_CREATED = /^\s*because (?:the |this )?(?:deploy(?:ment)?|run|build|copy|import|render) (?:itself )?creates?\b/i;

/** A dated changelog row (`- 2026-09-12 · …`). Combined at the use site with a past-tense auxiliary
 * immediately before the staleness phrase: a dated record of a LANDED fix may describe the defect it
 * corrected in the past tense ("… rather than a blanket date that WAS no longer true"), and
 * rewording a dated record falsifies it. A dated row announcing a PRESENT staleness is still a stale
 * note and still fires. */
const DATED_LOG_ROW = /^\s*[-*]\s+20\d\d-\d\d-\d\d\b/;

/** The clause a match sits in — the tail of `before` after its last `;` or `—`. The REPO_ARTIFACT
 * veto below is scoped to it: a repo-artifact token in a DISTANT clause of the same unbroken string —
 * a locator citation naming a `.mjs` file three clauses back — must not speak for a subject it is
 * not attached to. */
const lastClause = (s) => String(s).split(/[;—]/).pop();

/**
 * A PAST-TENSE EXPLANATION of why the present shape exists. `used to be` reads as self-described
 * staleness and is usually the opposite: the sentence explains a shape by naming the failure that
 * forced it, which is the reason a later reader must not undo it. Deleting one of those to clear a
 * signature destroys the reason and invites the regression — the countable win traded for the
 * uncountable loss this guard exists to prevent.
 *
 * TENSE ALONE IS TOO WEAK, and the donor guard's own suite proved it: `RUNG 2 CHANGED. It used to be
 * pending-decision` is past-tense with no future verb and IS a stale note — a surface announcing
 * that it changed. What separates the two is not tense but WHETHER THE SENTENCE GOES ON TO JUSTIFY
 * THE PRESENT: an explanation carries a because-clause, a date the change landed, or a consequence.
 * A stale note stops at the announcement.
 *
 * So the class requires a past marker AND a justifying continuation, and is vetoed by any
 * future-facing verb — a sentence that explains a past failure and then defers work is a deferral.
 */
const PAST_EXPLANATION = /\b(?:used to be|used to|previously|formerly|originally|at the time of writing)\b/i;
const JUSTIFIES_PRESENT = /\b(?:because|is why|so (?:that|the|an?)\b|which meant|it moved|moved (?:out|in)|drifted|discarded|the reason|pass(?:ed|ing) on|and was|rather than|forced|invites?|replaced by|landed|(?:is|are) now|20\d\d-\d\d-\d\d)\b/i;
// `until ` followed by a DATE or a COMMIT ID is a recorded boundary of a past state ("APPROVED until
// 2026-09-07", "threw until 99afa34 added the entry"), not a deferral; `until` followed by anything
// else still reads as future-facing.
const FUTURE_DEFERRAL = /\b(?:will|shall|should|must|needs? to|to be (?:built|added|done|implemented|written)|once |until (?!20\d\d|[0-9a-f]{7,40}\b)|when it lands)\b/i;

/** A markdown HEADING, an anchor link to one, or a table row: page STRUCTURE, not a deferral. A
 * `## Gaps / TODO` section and the cross-references pointing at it are how a page organises measured
 * absences; the needle's remedy — move it to the plan — would delete the organisation and leave the
 * absences unnamed. */
const HEADING_OR_ANCHOR = /^\s*#{1,6}\s|\]\(#|^\s*\|/;

/** An attribution. A provisional state belonging to a named party's recorded position is a fact this
 * repo captured, not work this repo deferred, and rewording it would falsify the record. */
const ATTRIBUTED = /\b(?:(?:[\w']+ )?(?:recorded|stated|current) position|position (?:is|was) that|according to|(?:Matt|client|operator|vendor|customer|they|he|she) (?:say|says|said|states|stated|reports|reported|confirmed|advised|asked|wants|prefers)\b)/i;

/**
 * The phrase sits inside a quotation THIS SURFACE OPENED, so the surface is reporting another's
 * wording. A JSON value's opening `"` follows its key and is a delimiter, not a quotation — without
 * that test every string in every .json file would read as quoted and the needle would go silent on
 * the whole tree.
 */
export function isQuotedTerm(before, after) {
  const q = Math.max(before.lastIndexOf('"'), before.lastIndexOf('`'), before.lastIndexOf('“'));
  if (q < 0 || before.length - q > 60) return false;
  if (/[:,[{]\s*$/.test(before.slice(0, q))) return false;
  return /^[^"`”\n]{0,60}["`”]/.test(after);
}

/** A bare token: no lowercase, no sentence punctuation. An instruction needs a verb and an object,
 * and neither survives this shape. */
const BARE_TOKEN = /^[A-Z0-9 _-]*$/;

/**
 * The match is the WHOLE of a delimited literal, so the phrase is MENTIONED, not USED — a fixture's
 * match list, a vocabulary row, a rule naming the token it forbids deleting. The surface carries the
 * marker AS DATA, and the needle's remedy — move the work to the plan — has nothing to move: a name
 * instructs nobody, and deleting it to clear a signature breaks whatever matches on it.
 *
 * DELIBERATELY BESIDE `isQuotedTerm` RATHER THAN INSIDE IT. That predicate asks whether the surface
 * OPENED A QUOTATION, and its JSON carve-out — a value's `"` follows its key and is a delimiter —
 * exists because treating every JSON value as quoted would silence the needle across the whole tree.
 * This asks a different question, on the axis the carve-out cannot see: USE versus MENTION.
 * `"note": "TODO: wire the exporter"` is a deferral written into a JSON value and still fires,
 * because the value is a SENTENCE; `"markers": ["RESUME TODO", …]` does not, because the value is a
 * token.
 *
 * WHAT THIS ACCEPTS, stated rather than left to be discovered: a value that is ONLY the marker —
 * `"status": "TODO"` — reads as data, because a lone token names a state and instructs no one. It
 * does NOT reach a marker trailing a code line, which the comments-only walk drops before any
 * discriminator sees it.
 */
export function isLiteralValue(before, after, matched) {
  const q = Math.max(before.lastIndexOf('"'), before.lastIndexOf('`'));
  if (q < 0) return false;
  const close = after.search(/["`]/);
  if (close < 0) return false;
  const head = before.slice(q + 1);
  const tail = after.slice(0, close);
  if (head.length + String(matched).length + tail.length > 40) return false;
  return BARE_TOKEN.test(head) && BARE_TOKEN.test(tail);
}

/**
 * Each signature is a shape that means a stale surface was annotated instead of fixed. `why` is
 * printed with the hit so a reader can judge it immediately. `notWhen` is optional and documented
 * above.
 */
export const SIGNATURES = [
  {
    name: 'instruction-to-a-future-reader',
    re: /(?:to the (?:wiki-writer|next agent|future (?:agent|writer|session))|for the (?:next|future) (?:agent|session|writer))/i,
    why: 'a note addressed to whoever comes next. Its content belongs in the file being correct, or in the plan.',
  },
  {
    name: 'overwrite-me',
    re: /\b(?:OVERWRITE|overwrite) (?:this|the) (?:page|file|prose|section)\b/i,
    why: 'telling a future writer to replace the page instead of writing it correctly now.',
  },
  {
    name: 'declared-gap',
    // Negated markers ("nothing is owed", "no tier is owed") state an ABSENCE of owed work and are
    // not a declared gap.
    re: /\b(?:owed and does not exist|does not exist yet|(?<!\bnothing )(?<!\bno [\w-]+ )(?<!\bno [\w-]+ [\w-]+ )is owed|(?<!\bnone )(?<!\bno [\w-]+ )(?<!\bno [\w-]+ [\w-]+ )are owed|not yet built|not yet implemented|GAP (?:STILL )?OPEN)\b/i,
    why: 'a gap recorded in place. Build the producer or drop the claim.',
    // A MISSING REPO ARTIFACT is the class; a RUNTIME OR TARGET-STATE condition, a reader's standing
    // duty, and an absent external input are not. Each shape below says "this sentence is about
    // something other than a file this repo owes", and the REPO_ARTIFACT veto — scoped to the
    // match's own clause, so a distant locator citation cannot trip it — stops the two subject-shape
    // excuses from reaching a sentence that does name one.
    notWhen: ({ before, after, matched }) => (
      isQuotedTerm(before, after)
      || BARE_PRONOUN.test(before)
      // "so no grouping argument is owed": a DENIAL that any requirement exists. The needle's
      // lookbehinds say this line-locally; NEGATED_DEBT says it across the hard wrap.
      || NEGATED_DEBT.test(before)
      // "A control is owed BY more than an empty result" — an agent follows, so the sentence names
      // what SUPPLIES a thing rather than declaring work this repo has deferred.
      || (/\bowed\b/i.test(matched) && /^\s*by\b/i.test(after))
      // "What a resuming session is owed", "Matt is owed the reason", "that read is owed on every
      // item": the owed party is a reader, or the owed thing is a read — a standing duty of
      // procedure, not a deferred artifact.
      || (/\bowed\b/i.test(matched) && OWED_TO_READER.test(before))
      // "Built at both ends; the data does not exist yet": absent EXTERNAL INPUT beside an
      // asserted-built mechanism — nothing in this repo can produce an interview nobody has run.
      || (EXTERNAL_INPUT.test(before) && /\bbuilt\b/i.test(before))
      // "keep the strategy gap open": an honest research verdict over unresolved evidence, not a
      // missing repository artifact.
      || (/\bGAP (?:STILL )?OPEN\b/i.test(matched)
        && RESEARCH_UNCERTAINTY.test(before)
        && !REPO_ARTIFACT.test(lastClause(before)))
      // "…does not exist yet because the build itself creates it": the run creates the subject.
      || RUNTIME_CREATED.test(after)
      || (!REPO_ARTIFACT.test(lastClause(before)) && (GENERIC_RELATIVE.test(before) || DEPLOYED_OBJECT.test(before)))
    ),
  },
  {
    name: 'self-described-staleness',
    re: /\b(?:this (?:page|file|section) is (?:out of date|stale|outdated)|no longer (?:accurate|true|current)|superseded but|kept for reference|at the time of writing|used to be)\b/i,
    why: 'the surface describes its own staleness. Bring it up to date; the description is the defect.',
    // A past-tense EXPLANATION is the opposite of a stale note: it says why the present shape is what
    // it is. Vetoed by a future-facing verb, so a sentence that explains and then defers is still
    // caught. See PAST_EXPLANATION above.
    //
    // The triple reads the RECONSTRUCTED sentence, not the raw line: a justifying clause often sits
    // beyond the hard wrap. `before` is already cut to this sentence's opening; `after` deliberately
    // runs on, because an explanation's justification is often the sentence that FOLLOWS the
    // announcement ("It used to be X. That single expression is why …").
    notWhen: ({ line, before, after, matched }) => {
      if (isQuotedTerm(before, after)) return true;
      const sentence = `${before}${matched}${after}`;
      return (
        (PAST_EXPLANATION.test(sentence) && JUSTIFIES_PRESENT.test(sentence) && !FUTURE_DEFERRAL.test(sentence))
        // A dated changelog row recording a LANDED fix describes the corrected defect in the past
        // tense; rewording a dated record falsifies it. Present-tense staleness still fires.
        || (DATED_LOG_ROW.test(line) && /\b(?:was|were) $/i.test(before))
      );
    },
  },
  {
    name: 'provisional-state',
    re: /\b(?:for now|temporarily|until we|in the meantime|as a stopgap|placeholder until)\b/i,
    why: 'a provisional state recorded as content. If work is owed, it belongs in the plan.',
    // A quoted or attributed position is a recorded FACT about what someone wants, not this repo
    // deferring. The remedy the `why` names is meaningless applied to Matt's own stance.
    notWhen: ({ before, after }) => ATTRIBUTED.test(before) || isQuotedTerm(before, after),
  },
  {
    name: 'todo-marker',
    re: /\b(?:TODO|FIXME|XXX|HACK)\b/,
    why: 'deferred work inline. The plan is the only home for work owed.',
    // A heading, an anchor link to one, or a table row is page structure rather than a deferral.
    // Also: a marker quoted AS DATA — a fixture matching on the literal, a rule about not deleting
    // the phrases a check matches on — is the needle's own vocabulary as subject matter, and
    // deleting it to clear the signature is the exact defect that rule documents.
    notWhen: ({ line, before, after, matched }) => (
      HEADING_OR_ANCHOR.test(line)
      || isQuotedTerm(before, after)
      || isLiteralValue(before, after, matched)
    ),
  },
];

/**
 * Surfaces exempt by purpose, not by convenience:
 *  - this file and its mirror contain every signature as data
 *  - `wiki/image-library/records/` is byte-preserved provenance (AGENTS.md: "never overwrite
 *    historical evidence"). Those records QUOTE other surfaces as they stood when the record was
 *    made; rewording a dated capture to appease a heuristic falsifies the record.
 *
 * An entry ending in `/` is a directory prefix; anything else is one file. Every entry must be
 * reachable by the repo scan below — an exemption over an unwalked tree reads as coverage that does
 * not exist.
 *
 * `discussion/` and `site/` are not listed because they are not WALKED: `discussion/` is this repo's
 * declared temporary planning and provenance layer, and `site/` is built output and application
 * code rather than a surface an agent reads as instruction or fact.
 */
const FIXED_EXEMPT = [
  '.claude/hooks/check-layering.mjs',
  '.codex/hooks/check-layering.mjs',
  'wiki/image-library/records/',
];

/**
 * Exemptions SCOPED TO A SIGNATURE CLASS, because a blanket directory exemption is coarser than the
 * reason that justifies it and cannot tell the covered class from the uncovered one. The list is
 * empty; the mechanism carries the class it serves. Each entry is `{prefix, classes[]}`.
 */
const CLASS_SCOPED_EXEMPT = [];

/** Whether `signatureName` is exempted for `relPath` by a class-scoped entry. */
export function isClassExempt(relPath, signatureName) {
  const p = String(relPath).replace(/\\/g, '/').replace(/^\.\//, '');
  return CLASS_SCOPED_EXEMPT.some((e) => (p.startsWith(e.prefix) || p.includes(`/${e.prefix}`)) && e.classes.includes(signatureName));
}

export const EXEMPT = [...FIXED_EXEMPT];

export function isExempt(relPath) {
  const p = String(relPath).replace(/\\/g, '/').replace(/^\.\//, '');
  return EXEMPT.some((e) => (e.endsWith('/')
    ? p.startsWith(e) || p.includes(`/${e}`)
    : p === e || p.endsWith(`/${e}`)));
}

/**
 * In a CODE file, only comments can layer. A runtime message string like "the file does not exist
 * yet" describes a condition the code handles — it is behaviour, not a stale note about the repo.
 * Scanning whole code files produces mostly that class of false positive, so code files are scanned
 * as comments only. Prose surfaces (`.md`, `.json`) are scanned whole.
 */
export function isCodeFile(relPath) {
  return /\.(?:mjs|js|cjs|ts)$/.test(String(relPath));
}

const COMMENT_LINE = /^\s*(?:\/\/|\/\*|\*)/;

/** Every signature hit in `text`, with its line number. Pure. */
export function findLayering(text, { commentsOnly = false } = {}) {
  const lines = String(text).split(/\r?\n/);
  const hits = [];
  lines.forEach((line, i) => {
    if (commentsOnly && !COMMENT_LINE.test(line)) return;
    for (const sig of SIGNATURES) {
      const m = line.match(sig.re);
      if (!m) continue;
      // The discriminator reads the sentence, which is why it gets `lines` and not `line`.
      if (sig.notWhen && sig.notWhen({ ...surroundings(lines, i, m[0]), matched: m[0], line })) continue;
      hits.push({ line: i + 1, signature: sig.name, matched: m[0], why: sig.why, text: line.trim().slice(0, 120) });
    }
  });
  return hits;
}

// --- Repo scan -----------------------------------------------------------------------------------

/**
 * Every tree an agent reads as instruction or fact in this repo.
 *
 * `.claude` and `.codex` carry the CRAFT (the two co-equal skill editions, which must stay
 * byte-identical, plus the Claude-only agents). `wiki` carries the FACTS. Those are the two surfaces
 * layering has actually damaged here.
 *
 * `discussion/` and `site/` are deliberately absent. `discussion/` is the declared temporary
 * planning and provenance layer — provisional prose is its purpose — and `site/` is the website's
 * own code, tests and build output, judged by the build and the browser rather than by this guard.
 */
export const SCAN_ROOTS = ['wiki', '.claude', '.codex'];

/** The repo's top instruction surfaces, which live at the root rather than under a scanned tree. */
export const SCAN_FILES = ['AGENTS.md', 'CLAUDE.md'];
const SCAN_EXTENSIONS = ['.md', '.json', '.mjs', '.js'];

/**
 * Directory names that are generated dependencies, build products or machine-local runtime state,
 * never surfaces an agent reads as instruction or fact.
 */
export const SCAN_SKIP_DIRS = new Set(['node_modules', 'out', 'build', 'dist', '.astro', '.vercel']);

/**
 * AN ENTRY THAT VANISHED BETWEEN ENUMERATION AND USE IS NOT AN ERROR IN THIS WALK.
 *
 * This module is the live PreToolUse hook, so `scanRepo` can run against a tree another session is
 * writing. `readdirSync` reports a name; by the time `statSync` or `readFileSync` reaches it the
 * file can be gone, and the walk would die with ENOENT on a path that was never the tree's state.
 *
 * ENOENT ONLY, AND NOTHING ELSE. A permission error, an EISDIR or an I/O error is a real defect in
 * the walk and still throws: a scanner that swallowed every read error would report a clean tree for
 * a tree it could not read, which is the one thing this scan must never do.
 */
export function isVanished(err) {
  return Boolean(err) && err.code === 'ENOENT';
}

/**
 * Read one surface, or `null` when it vanished between the walk and this read. Exported so the
 * tolerance is provable on the FUNCTION scanRepo actually calls rather than on a copy of its rule.
 */
export function readSurface(rel) {
  try {
    return readFileSync(join(ROOT, rel), 'utf8');
  } catch (err) {
    if (isVanished(err)) return null;
    throw err;
  }
}

// `lost` is the SHARED tally, threaded through the recursion rather than returned, so a surface
// dropped at the stat site is counted in the same number as one dropped at the read site. A counter
// wired to only one of the two loss sites is a number that can never move for the other, which reads
// as "nothing was lost" — the value it must never be able to fake.
function walk(dir, out = [], lost = { n: 0 }) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return out;
  for (const entry of readdirSync(abs)) {
    // Generated output and machine-local runtime state, never surfaces anyone reads as instruction.
    if (SCAN_SKIP_DIRS.has(entry)) continue;
    const rel = `${dir}/${entry}`;
    let st;
    try {
      st = statSync(join(ROOT, rel));
    } catch (err) {
      if (isVanished(err)) { lost.n += 1; continue; } // see isVanished: enumerated, then removed under us
      throw err;
    }
    // A nested git checkout is a transient or foreign tree, policed by its own repo — never judged
    // by this one's guard.
    if (st.isDirectory() && existsSync(join(ROOT, rel, '.git'))) continue;
    if (st.isDirectory()) walk(rel, out, lost);
    else if (SCAN_EXTENSIONS.some((e) => entry.endsWith(e))) out.push(rel);
  }
  return out;
}

/**
 * THE WALK'S OWN POSITIVE CONTROL. A scan that reached nothing prints exactly what a clean tree
 * prints, and those are opposite verdicts. So the count is not merely reported, it is REFUSED below
 * when it is implausible: a total of zero is only a measurement once the denominator is known real.
 */
export const MIN_SURFACES = 100;

export function scanRepo() {
  const lost = { n: 0 };
  const walked = [
    ...SCAN_FILES.filter((f) => existsSync(join(ROOT, f))),
    ...SCAN_ROOTS.flatMap((d) => walk(d, [], lost)),
  ].filter((s) => !isExempt(s));

  // `surfaces` is what was READ, never merely what was named. A surface enumerated by the walk and
  // gone by the time it was opened joins `vanished` instead — reported, so a shrinking population is
  // visible rather than quietly reducing the denominator every other number here is read against.
  const surfaces = [];
  const report = [];
  let vanished = lost.n;
  for (const surface of walked) {
    const text = readSurface(surface);
    if (text === null) { vanished += 1; continue; }
    surfaces.push(surface);
    const hits = findLayering(text, { commentsOnly: isCodeFile(surface) })
      .filter((h) => !isClassExempt(surface, h.signature));
    if (hits.length) report.push({ surface, hits });
  }
  return { surfacesScanned: surfaces.length, surfaces, report, vanished };
}

// --- Entry ---------------------------------------------------------------------------------------
// Guarded so the module is safely IMPORTABLE. Without this, importing it for a test runs hook mode,
// which blocks reading stdin — the test hangs rather than fails, which is the worst outcome of all.

const invokedDirectly = Boolean(process.argv[1])
  // Either edition's copy: the file is mirrored, and both are run directly.
  && /\.(?:claude|codex)\/hooks\/check-layering\.mjs$/.test(process.argv[1].replace(/\\/g, '/'));
const argv = process.argv.slice(2);

if (invokedDirectly && argv.includes('--scan')) {
  const { surfacesScanned, report, vanished } = scanRepo();
  const total = report.reduce((n, r) => n + r.hits.length, 0);
  for (const { surface, hits } of report) {
    for (const h of hits) {
      console.log(`${surface}:${h.line}  [${h.signature}] "${h.matched}"`);
      console.log(`    ${h.text}`);
      console.log(`    -> ${h.why}`);
    }
  }
  // WALKED FIRST, AND NAMED: a summary a careful reader can take for its own opposite is a defect in
  // the summary.
  console.log(`\ncheck-layering: WALKED ${surfacesScanned} surface(s); found ${total} signature(s) on ${report.length} of them.`);
  // A surface that vanished mid-scan is NAMED, never absorbed into the count: the reader is told the
  // population moved under the walk rather than left to read a smaller number as a smaller tree.
  if (vanished > 0) {
    console.log(`check-layering: ${vanished} surface(s) were enumerated and gone before they could be read `
      + '(a concurrent session or a test fixture removed them mid-scan); they are not in the count above.');
  }
  if (surfacesScanned < MIN_SURFACES) {
    console.error(`check-layering: REFUSING this result — the walk reached only ${surfacesScanned} surface(s), `
      + `below the floor of ${MIN_SURFACES}. A total of ${total} over a walk this small measures the walk, `
      + 'not the tree. Check SCAN_ROOTS against the checkout before reading anything into the count.');
    process.exitCode = 1;
  } else {
    if (total === 0) console.log('Nothing layered. This is the state to hold.');
    process.exitCode = argv.includes('--strict') && total > 0 ? 1 : 0;
  }
}

/**
 * A written path as a repo-relative posix path, or '' when it is not this repo's to judge.
 * '' is returned for an absolute path outside ROOT — see the caller for why an outside path is never
 * judged. Exported so the rule is testable on its own rather than only through a spawned hook.
 */
export function toRepoRelative(filePath, root = ROOT) {
  const p = filePath.replace(/\\/g, '/');
  if (!p) return '';
  const rootPosix = `${root.replace(/\\/g, '/')}/`;
  if (p.startsWith(rootPosix)) return p.slice(rootPosix.length);
  const isAbsolutePath = /^([A-Za-z]:)?\//.test(p);
  return isAbsolutePath ? '' : p;
}

/**
 * The hook's verdict over one parsed payload (null when it did not parse), in-process:
 * `{ code, stderr }` with the exit code and the lines the hook would print. `root` is the
 * CHECK_LAYERING_ROOT seam, read at call time.
 */
export function hookVerdict(payload, { root = process.env.CHECK_LAYERING_ROOT || ROOT } = {}) {
  // The seam is read where the tree is read. Everything below that touches disk resolves under
  // `root`, so a probe judges a planted tree and nothing else; absent, the hook judges this repo.
  const stderr = [];
  try {
    if (!payload || typeof payload !== 'object') {
      // CANNOT MEASURE, and it says so. Exit 1 is fail-open in the harness — only exit 2 blocks a
      // PreToolUse — but it is distinguishable from a pass, because one code path must never produce
      // both "measured clean" and "could not measure".
      stderr.push('check-layering: cannot measure — the hook payload did not parse. The write proceeds unjudged.');
      return { code: 1, stderr };
    }
    const extracted = writeSurfaces(payload);
    if (extracted.error) {
      stderr.push(`check-layering: REFUSED — cannot measure this write: ${extracted.error}.`);
      return { code: 2, stderr };
    }

    // REPO-RELATIVE, OR NOT AT ALL. A session's scratchpad lives outside the checkout, and a foreign
    // tree is not this guard's subject: the walk already skips nested checkouts on exactly that
    // ground. The payload may carry the path already repo-relative, so absence of a root prefix is
    // not by itself "outside" — only an ABSOLUTE path that is not under `root` is.
    for (const surface of extracted.surfaces) {
      const text = surface.text;
      const rel = toRepoRelative(String(surface.path ?? ''), root);

      // Out of scope BY DECLARATION — an exempt surface, an unscanned extension, a tree this guard
      // does not judge, or a payload adding no text — is an allow, not an unmeasured pass.
      const inScannedTree = SCAN_FILES.includes(rel)
        || SCAN_ROOTS.some((d) => rel === d || rel.startsWith(`${d}/`));
      const scannable = text
        && rel
        && inScannedTree
        && !isExempt(rel)
        && SCAN_EXTENSIONS.some((e) => rel.endsWith(e));
      if (!scannable) continue;

      // PRE-WRITE CONTENT IS THE PRIOR. An absent file is an empty prior. An unreadable prior is
      // CANNOT MEASURE: guessing either way would manufacture a verdict.
      let prior = '';
      if (existsSync(join(root, rel))) {
        try {
          prior = readFileSync(join(root, rel), 'utf8');
        } catch {
          stderr.push(`check-layering: cannot measure — ${rel} exists but its pre-write content could not be read. `
            + 'The write proceeds unjudged.');
          return { code: 1, stderr };
        }
      }

      // THE REFUSAL IS CLASS-PER-FILE. Only a signature class absent from the prior refuses.
      const commentsOnly = isCodeFile(rel);
      const judge = (t) => findLayering(t, { commentsOnly }).filter((h) => !isClassExempt(rel, h.signature));
      const priorClasses = new Set(judge(prior).map((h) => h.signature));
      const introduced = judge(text).filter((h) => !priorClasses.has(h.signature));

      if (introduced.length) {
        const classes = [...new Set(introduced.map((h) => h.signature))];
        stderr.push(`check-layering: REFUSED — this write would introduce ${classes.length} layering signature `
          + `class(es) that ${rel} does not already carry:`);
        for (const h of introduced) stderr.push(`  [${h.signature}] "${h.matched}" -> ${h.why}`);
        stderr.push('  Bring the surface up to date instead of annotating it; work owed goes in discussion/, never '
          + 'inline in a skill or a wiki fact. A class the file already carries never refuses — that stock is the '
          + 'repo scan\'s to burn down (node .claude/hooks/check-layering.mjs --scan). If this hit is a runtime or '
          + 'target-state condition rather than a missing repo artifact, the defect is in the needle: sharpen the '
          + 'discriminator in this hook (in BOTH editions), never reword a true sentence to satisfy it.');
        return { code: 2, stderr };
      }
    }
    return { code: 0, stderr };
  } catch {
    // An unexpected failure is CANNOT MEASURE too — never a pass. Fail-open, distinguishably.
    stderr.push('check-layering: cannot measure — unexpected failure. The write proceeds unjudged.');
    return { code: 1, stderr };
  }
}

// Hook mode — PreToolUse. Wrapped in a block rather than guarded by an early `process.exit` — an
// exit at module scope would terminate any process that merely IMPORTS this file, turning a test
// suite that imports it into a single vacuous pass.
if (invokedDirectly && !argv.includes('--scan')) {
  let payload = null;
  try {
    payload = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    payload = null;
  }
  const { code, stderr } = hookVerdict(payload);
  for (const line of stderr) console.error(line);
  // No process.exit(): on Windows it can abort Node while the stdin pipe is closing (UV_HANDLE_CLOSING).
  process.exitCode = code;
}
