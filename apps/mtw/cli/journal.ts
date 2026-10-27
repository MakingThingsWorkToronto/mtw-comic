// Journal commands of the `mtw` CLI: the only writer of wiki/journal/candidates.json (Studio Journal only reads it).
//   mtw journal candidates import <wiki/journal/candidates/PROPOSALS-....md>   append that file's concepts (new sections only)
//   mtw journal candidates link <id|number> <entry-slug>                       mark a candidate promoted to its entry folder
//   mtw journal candidates unlink <id|number>                                  undo a link (back to candidate)
//   mtw journal candidates validate                                            check the file against its schema
//   mtw journal candidates list                                                one line per candidate
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CANDIDATES_REL, PROPOSALS_DIR_REL, appendFromProposals, candidatesFileSchema, linkEntry, readCandidates } from '../modules/journal/lib/candidates';
import type { CandidatesFile, ParsedConcept } from '../modules/journal/lib/candidates';
import { parseProposalsText } from '../modules/journal/lib/state';

export const JOURNAL_USAGE = `Journal:
  mtw journal candidates import <${PROPOSALS_DIR_REL}/PROPOSALS-<date>.md>
  mtw journal candidates link <id|number> <entry-slug>
  mtw journal candidates unlink <id|number>
  mtw journal candidates validate
  mtw journal candidates list`;

const repoRoot = (): string => path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const today = (d = new Date()): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function load(root: string): CandidatesFile {
  const r = readCandidates(root);
  if (!r.found) return { schemaVersion: 1, candidates: [] };
  if (!r.file) throw new Error(r.errors.join('\n'));
  return r.file;
}

/** Validated, then written through a temp file so a reader never sees half a file. */
function save(root: string, file: CandidatesFile): void {
  const data = candidatesFileSchema.parse(file);
  const abs = path.join(root, CANDIDATES_REL);
  const tmp = `${abs}.tmp-${process.pid}`;
  writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`);
  renameSync(tmp, abs);
}

export async function journalCommand(argv: string[], root = repoRoot(), out = process.stdout): Promise<number | null> {
  if (argv[0] !== 'journal') return null;
  if (argv[1] !== 'candidates') {
    out.write(`${JOURNAL_USAGE}\n`);
    return 2;
  }
  const [cmd, a, b] = argv.slice(2);
  if (cmd === 'validate') {
    const r = readCandidates(root);
    if (!r.found) throw new Error(`${CANDIDATES_REL} does not exist`);
    if (!r.file) throw new Error(r.errors.join('\n'));
    out.write(`${CANDIDATES_REL}: ${r.file.candidates.length} candidates, valid\n`);
    return 0;
  }
  if (cmd === 'list') {
    for (const c of load(root).candidates) out.write(`${c.number}\t${c.id}\t${c.status}${c.entry ? ` -> ${c.entry}` : ''}\t${c.headline}\n`);
    return 0;
  }
  if (cmd === 'import' && a) {
    const rel = a.replace(/\\/g, '/').replace(/^\.\//, '');
    if (!rel.startsWith(`${PROPOSALS_DIR_REL}/PROPOSALS-`) || !existsSync(path.join(root, rel))) throw new Error(`not a proposals file under ${PROPOSALS_DIR_REL}/: ${a}`);
    const parsed = parseProposalsText(readFileSync(path.join(root, rel), 'utf8'), rel) as { concepts: ParsedConcept[] };
    if (!parsed.concepts.length) throw new Error(`${rel}: no concepts parsed. Use the headline or discovery format (wiki/journal/console.md, Live work and candidates).`);
    const src = readFileSync(path.join(root, rel), 'utf8');
    const current = load(root);
    const fresh = parsed.concepts.filter((c) => !current.candidates.some((x) => x.source.file === rel && x.source.section === c.number));
    // Matt, 2026-10-11: discovery was shallow. A file that adds candidates must show its signal coverage (the line
    // signal-digest.mjs prints) and say what readers take away from each new candidate.
    if (fresh.length && !/^Coverage: \d+ commits from \d+ repos .*; \d+ bookmarks/m.test(src)) throw new Error(`${rel}: no Coverage line. Run the journal-recommendation skill's signal-digest.mjs and copy the Coverage line it prints under the title.`);
    const { file, added } = appendFromProposals(current, parsed.concepts, rel, today(), { requireShare: true });
    save(root, file);
    out.write(`${rel}: ${added.length} added, ${parsed.concepts.length - added.length} already recorded\n`);
    for (const c of added) out.write(`  ${c.number}\t${c.id}\t${c.status}\t${c.headline}\n`);
    return 0;
  }
  if ((cmd === 'link' && a && b) || (cmd === 'unlink' && a)) {
    if (b && !existsSync(path.join(root, 'wiki', 'journal', 'entries', b))) throw new Error(`no entry folder wiki/journal/entries/${b}/`);
    save(root, linkEntry(load(root), a, cmd === 'link' ? (b as string) : null));
    out.write(`${a}: ${cmd === 'link' ? `promoted to ${b}` : 'back to candidate'}\n`);
    return 0;
  }
  out.write(`${JOURNAL_USAGE}\n`);
  return 2;
}
