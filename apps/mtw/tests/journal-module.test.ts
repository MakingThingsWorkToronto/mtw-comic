// Journal module: honesty rules (console.md), decisions, answers payloads, launches. Runs on a temp copy of the Journal inputs.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { makeRepoCopy } from '../modules/journal/test/fixture';
import type { RepoCopy } from '../modules/journal/test/fixture';
import { server as journal } from '../modules/journal/server';
import { buildState } from '../modules/journal/lib/state';
import { answersPayload, disagreements, rejectedByDecision, waitingWithoutRejected, withoutRejectedCandidates, liveCandidates, mdBlocks, inlineTokens, queueView } from '../modules/journal/shared';
import { chooseProposals } from '../modules/journal/lib/state';
import { parseReviewPresets } from '../modules/journal/lib/review';
import { appendFromProposals, candidatesFileSchema, readCandidates } from '../modules/journal/lib/candidates';
import { journalCommand } from '../cli/journal';
import type { JournalState } from '../modules/journal/shared';
import { parsePrompt, renderPrompt } from '../server/core/prompts';
import { fakeLaunchers, startModules } from './module-harness';
import type { ModuleHarness } from './module-harness';

const realRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)), '..', '..');
const NOW = '2026-10-09T12:00:00.000Z';
const sha = (file: string): string => createHash('sha1').update(readFileSync(file)).digest('hex');

const TPL = { header: 'Matt typed these in the Journal on {{date}}, {{subject}}:', item: '## Q{{label}} · {{question}}', footer: "[end of Matt's answers]" };
let copy: RepoCopy;
let h: ModuleHarness;
let launches: ReturnType<typeof fakeLaunchers>['launches'];

const write = (rel: string, text: string): void => {
  mkdirSync(path.dirname(path.join(copy.root, rel)), { recursive: true });
  writeFileSync(path.join(copy.root, rel), text);
};
const state = (opts: { templatesPath?: string } = {}): JournalState =>
  JSON.parse(JSON.stringify(buildState({ repoRoot: copy.root, now: NOW, proposalsFile: 'PROPOSALS-2026-09-17.md', ...opts })));

beforeAll(async () => {
  copy = makeRepoCopy(realRoot);
  // The harness needs a core first to fake launchers around its operations list.
  const probe = await startModules(copy.root, []);
  const fake = fakeLaunchers(probe.core);
  launches = fake.launches;
  await probe.close();
  h = await startModules(copy.root, [journal], fake.overrides);
});
afterAll(async () => {
  await h?.close();
  copy?.cleanup();
});

describe('honesty rules', () => {
  it('approval is "not approved" unless a marker file says so in so many words', () => {
    write('wiki/journal/entries/t-plain/README.md', '# T plain\n\n**Status:** drafted, looks good\n');
    write('wiki/journal/entries/t-plain/draft.md', '## The entry\n\n# Title\n\nBody text here.\n');
    write('wiki/journal/entries/t-marked/README.md', '# T marked\n\nApproved by Matt on 2026-10-01.\n');
    const s = state();
    expect(s.entries.find((e) => e.slug === 't-plain')?.approval).toBe('not approved');
    expect(s.entries.find((e) => e.slug === 't-marked')?.approval).toBe('approved');
    expect(s.entries.find((e) => e.slug === 't-marked')?.approvalEvidence).toMatch(/README\.md:3/);
  });

  it('a decision record never turns into an approval; the disagreement shows both', async () => {
    const before = state();
    const slug = 't-plain';
    const r = await h.post('/api/journal/decide', { subject: slug, action: 'approve', note: 'ok' });
    expect(r.status).toBe(200);
    const after = state();
    expect(after.entries.find((e) => e.slug === slug)?.approval).toBe('not approved');
    const decisions = await h.get('/api/journal/decisions');
    const notes = disagreements(after, decisions);
    expect(notes.some((n) => n.includes('a decision record approves it') && n.includes('no file records'))).toBe(true);
    expect(before.entries.length).toBe(after.entries.length);
  });

  it('a Chosen cover row suppresses the cover ask; two unmarked covers raise it', () => {
    write('wiki/journal/entries/t-cover/README.md', '# T cover\n');
    const table = (a: string, b: string) => `# Assets\n\n## Cover\n\n| Option | File | State |\n|---|---|---|\n| ${a} | \`cover-a.png\` | draft |\n| ${b} | \`cover-b.png\` | draft |\n`;
    write('wiki/journal/entries/t-cover/assets.md', table('A', 'B'));
    let e = state().entries.find((x) => x.slug === 't-cover')!;
    expect(e.questionsForMatt.some((g) => g.id === 'cover')).toBe(true);
    write('wiki/journal/entries/t-cover/assets.md', table('A (Chosen)', 'B'));
    const s = state();
    e = s.entries.find((x) => x.slug === 't-cover')!;
    expect(e.questionsForMatt.some((g) => g.id === 'cover')).toBe(false);
    expect(s.waiting.some((w) => w.entrySlug === 't-cover' && w.ask.startsWith('Choose the cover'))).toBe(false);
  });

  it('missing covers are reported as absent, never invented', () => {
    const e = state().entries.find((x) => x.slug === 't-cover')!;
    expect(e.assets.covers.every((c) => c.exists === false && /NOT found/.test(c.existsNote))).toBe(true);
    const rows = queueView({ ...state(), queue: { ...state().queue, queue: [{ entry: 'T cover', slug: 't-cover', stage: 'x', waitingOn: 'y' }] } });
    expect(rows[0]?.cover).toBeNull();
  });

  it('queue.md and entry folders that disagree are both shown', () => {
    write('wiki/journal/entries/t-orphan/README.md', '# T orphan\n');
    const q = readFileSync(path.join(copy.root, 'wiki/journal/queue.md'), 'utf8');
    const ghost = '| [Ghost entry](entries/t-ghost/README.md) | idea | Matt |\n';
    write('wiki/journal/queue.md', q.replace(/(## Queue[\s\S]*?\|[-| ]+\|\r?\n)/, `$1${ghost}`));
    const s = state();
    expect(s.queue.disagreements.some((d) => d.includes('t-ghost') && d.includes('does not exist'))).toBe(true);
    expect(s.queue.disagreements.some((d) => d.includes('t-orphan') && d.includes('lists it in no group'))).toBe(true);
    write('wiki/journal/queue.md', q);
  });

  it('stale status lines surface as claims, not measurements', () => {
    write('wiki/journal/entries/t-stale/README.md', '# T stale\n\n**Status:** not drafted\n');
    write('wiki/journal/entries/t-stale/draft.md', '## The entry\n\n# X\n\nBody.\n');
    const e = state().entries.find((x) => x.slug === 't-stale')!;
    expect(e.staleClaims.join(' ')).toMatch(/still says "not drafted" while draft\.md exists/);
    expect(e.recordedStatusNote).toMatch(/not a measurement/);
  });

  it('a missing queue.md or template file produces notices, not empty silence', () => {
    const missing = buildState({ repoRoot: copy.root, now: NOW, proposalsFile: 'PROPOSALS-2026-09-17.md', templatesPath: path.join(copy.root, 'nope.json') }) as unknown as JournalState & { prompts: unknown[] };
    expect(missing.prompts).toEqual([]);
    expect(missing.generatorNotes.some((n) => /prompt-templates\.json not found/.test(n))).toBe(true);
    const queueFile = path.join(copy.root, 'wiki/journal/queue.md');
    const saved = readFileSync(queueFile, 'utf8');
    rmSync(queueFile);
    const s = state();
    expect(s.queue.found).toBe(false);
    expect(s.generatorNotes.some((n) => /queue\.md not found/.test(n))).toBe(true);
    writeFileSync(queueFile, saved);
  });

  it('unknown stays "unknown"', () => {
    write('wiki/journal/entries/t-bare/README.md', 'no heading, no status\n');
    const e = state().entries.find((x) => x.slug === 't-bare')!;
    expect(e.title).toBe('unknown');
    expect(e.recordedStatusLine).toBe('unknown');
    expect(e.opened).toBe('unknown');
    expect(e.gates.verdictLine).toBe('unknown');
    expect(e.framing.namedPositionAvailable).toBe('unknown');
  });

  it('the module writes no queue.md or README, even through its decision routes', async () => {
    const files = [
      path.join(copy.root, 'wiki/journal/queue.md'),
      ...readdirSync(path.join(copy.root, 'wiki/journal/entries')).map((s) => path.join(copy.root, 'wiki/journal/entries', s, 'README.md')).filter((f) => { try { readFileSync(f); return true; } catch { return false; } }),
    ];
    const before = files.map(sha);
    await h.post('/api/journal/decide', { subject: 't-plain', action: 'reject' });
    await h.post('/api/journal/decide', { subject: 't-plain', action: 'reopen' });
    await h.post('/api/journal/answers', { entry: 't-plain', items: [{ label: '1', question: 'q?', value: 'a' }], launch: true });
    expect(files.map(sha)).toEqual(before);
    // And statically: no module source calls a file-writing API at all (decisions go through services.decisions).
    const dir = path.join(realRoot, 'apps/mtw/modules/journal');
    const sources: string[] = [];
    const walk = (d: string): void => {
      for (const n of readdirSync(d, { withFileTypes: true })) {
        if (n.isDirectory()) walk(path.join(d, n.name));
        else if (/\.(ts|tsx)$/.test(n.name) && !d.includes(`${path.sep}test`)) sources.push(path.join(d, n.name));
      }
    };
    walk(dir);
    const offenders = sources.filter((f) => /writeFile|appendFile|\.writeText|\.writeJson|renameSync|rmSync|unlinkSync|mkdirSync/.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });
});

describe('decisions', () => {
  it('records only the documented actions, for known subjects', async () => {
    expect((await h.post('/api/journal/decide', { subject: 't-plain', action: 'delete-everything' })).status).toBe(400);
    expect((await h.post('/api/journal/decide', { subject: 'no-such-entry', action: 'approve' })).status).toBe(400);
    expect((await h.post('/api/journal/decide', { subject: 't-plain', action: 'answer' })).status).toBe(400);
    const ok = await h.post('/api/journal/decide', { subject: 't-plain', action: 'gate-pass-confirm', value: { decision: true, mistake: true, number: false } });
    expect(ok.status).toBe(200);
    expect(ok.body).toMatchObject({ module: 'journal', actor: 'matt', action: 'gate-pass-confirm' });
    expect((await h.post('/api/journal/decide', { subject: 't-plain', action: 'gate-pass-confirm', value: { decision: true } })).status).toBe(400);
  });

  it('publish-direction needs Matt\'s explicit flag and a real entry; the module never sets published', async () => {
    expect((await h.post('/api/journal/decide', { subject: 't-marked', action: 'publish-direction' })).status).toBe(400);
    const ok = await h.post('/api/journal/decide', { subject: 't-marked', action: 'publish-direction', explicit: true });
    expect(ok.status).toBe(200);
    expect(state().queue.published.some((r) => r.slug === 't-marked')).toBe(false);
  });

  it('choose-cover subject must be an image ref or an unregistered-file marker', async () => {
    const v = { entry: 't-cover', file: 'cover-a.png' };
    expect((await h.post('/api/journal/decide', { subject: 't-cover', action: 'choose-cover', value: v })).status).toBe(400);
    expect((await h.post('/api/journal/decide', { subject: 'cover-file:cover-a.png', action: 'choose-cover', value: v })).status).toBe(200);
    expect((await h.post('/api/journal/decide', { subject: 'img:rec@photograph', action: 'choose-cover', value: { entry: 'nope', file: 'x' } })).status).toBe(400);
  });
});

describe('answers', () => {
  it('payload keeps every answer byte for byte and drops only empty boxes', () => {
    const odd = '  leading and trailing  \r\nsecond line with \u201csmart quotes\u201d, tabs\t, \u00a0nbsp and trailing space \n';
    const payload = answersPayload({ template: TPL, date: '2026-10-09', subject: 'entry x', items: [{ label: '1', question: 'Q one?', value: odd }, { label: '2', question: 'Q two?', value: ' \u00a0\n ' }, { label: 'draft-3', question: 'Q three?', value: 'plain' }] });
    expect(payload).toContain(`## Q1 \u00b7 Q one?\n${odd}`);
    expect(payload).not.toContain('Q two?');
    expect(payload).toContain('## Qdraft-3 \u00b7 Q three?\nplain');
    expect(payload).toMatch(/^Matt typed these in the Journal on 2026-10-09, entry x:\n\n/);
    expect(payload!.endsWith("[end of Matt's answers]")).toBe(true);
    expect(answersPayload({ template: TPL, date: 'd', subject: 's', items: [{ label: '1', question: 'q', value: '   ' }] })).toBeNull();
  });

  it('records one decision per answer (value verbatim) and launches the recorder with the payload verbatim', async () => {
    launches.length = 0;
    const odd = '  keep my spacing \u2014 and  double  spaces\r\nline two  ';
    const r = await h.post('/api/journal/answers', { entry: 't-plain', items: [{ label: '1', question: 'What broke?', value: odd }, { label: '2', question: 'Empty?', value: '' }] });
    expect(r.status).toBe(200);
    expect(r.body.recorded).toBe(1);
    expect(r.body.terminal).toMatchObject({ operation: 'journal-record-answers' });
    const all = await h.get('/api/journal/decisions?subject=t-plain');
    const ans = all.filter((d: { action: string }) => d.action === 'answer');
    expect(ans.at(-1).value).toBe(odd);
    expect(launches).toHaveLength(1);
    expect(launches[0]!.id).toBe('journal-record-answers');
    expect(launches[0]!.params.payload).toContain(odd);
    expect(launches[0]!.params.entry).toBe('t-plain');
    // Through the real prompt renderer the verbatim text survives (the sentinel line protects trailing space).
    const parsed = parsePrompt(readFileSync(path.join(copy.root, 'wiki/operations/prompts/journal-record-answers.md'), 'utf8'));
    expect(renderPrompt(parsed, launches[0]!.params, copy.root)).toContain(odd);
  });

  it('refuses an answer set that names both or neither of entry and concept, or only empty boxes', async () => {
    expect((await h.post('/api/journal/answers', { items: [{ label: '1', question: 'q', value: 'a' }] })).status).toBe(400);
    expect((await h.post('/api/journal/answers', { entry: 't-plain', concept: 1, items: [{ label: '1', question: 'q', value: 'a' }] })).status).toBe(400);
    expect((await h.post('/api/journal/answers', { entry: 't-plain', items: [{ label: '1', question: 'q', value: '  ' }] })).status).toBe(400);
  });
});

describe('launch', () => {
  it('never passes bypass permissions and only launches Journal operations', async () => {
    launches.length = 0;
    expect((await h.post('/api/journal/launch', { operation: 'journal-source', params: {}, permission: 'bypass' })).status).toBe(400);
    expect((await h.post('/api/journal/launch', { operation: 'journal-source', params: {}, permission: 'dangerously-skip' })).status).toBe(400);
    expect((await h.post('/api/journal/launch', { operation: 'asset-destination-check', params: {} })).status).toBe(400);
    expect((await h.post('/api/journal/launch', { operation: 'journal-nope', params: {} })).status).toBe(404);
    expect(launches).toHaveLength(0);
    const ok = await h.post('/api/journal/launch', { operation: 'journal-source', params: {}, permission: 'accept-edits' });
    expect(ok.status).toBe(200);
    expect(launches[0]).toMatchObject({ id: 'journal-source', permission: 'accept-edits' });
  });

  it('starts from the procedure frontmatter model for the runner, and an explicit model or effort overrides it', async () => {
    launches.length = 0;
    expect((await h.post('/api/journal/launch', { operation: 'journal-draft', params: { entry: 't-plain' } })).status).toBe(200);
    expect(launches[0]).toMatchObject({ id: 'journal-draft', model: 'claude-opus-5-5', effort: 'high' });
    expect((await h.post('/api/journal/launch', { operation: 'journal-draft', params: { entry: 't-plain' }, runner: 'codex' })).status).toBe(200);
    expect(launches[1]).toMatchObject({ runner: 'codex', model: 'gpt-6.1-sol', effort: 'medium' });
    expect((await h.post('/api/journal/launch', { operation: 'journal-draft', params: { entry: 't-plain' }, model: 'claude-sonnet-5-5', effort: 'low' })).status).toBe(200);
    expect(launches[2]).toMatchObject({ model: 'claude-sonnet-5-5', effort: 'low' });
  });

  it('fills the optional measured-state parameter from the files for an entry', async () => {
    launches.length = 0;
    const r = await h.post('/api/journal/launch', { operation: 'journal-record-approval', params: { entry: 't-plain' } });
    expect(r.status).toBe(200);
    expect(launches[0]!.params.state).toMatch(/Entry t-plain|no proposed concept/);
    expect((await h.post('/api/journal/launch', { operation: 'journal-record-approval', params: { entry: 'not-an-entry' } })).status).toBe(400);
  });

  it('previews the exact prompt: body first, then the run section', async () => {
    const r = await h.post('/api/journal/preview', { operation: 'journal-reject', params: { entries: 'A; B', reasons: 'thin' } });
    expect(r.status).toBe(200);
    expect(r.body.text.indexOf('## Rules')).toBeLessThan(r.body.text.lastIndexOf('## This run'));
    expect(r.body.text).toContain('Entries to reject (separated by semicolons) (entries): A; B');
  });
});

describe('operation prompt files', () => {
  const dir = path.join(realRoot, 'wiki/operations/prompts');
  const files = readdirSync(dir).filter((f) => /^(journal|llm-column)-.*\.md$/.test(f));
  const EXPECTED = [
    'journal-ingest', 'journal-ingest-all', 'journal-source', 'journal-recommend', 'journal-interview', 'journal-draft', 'journal-assets',
    'journal-record-answers', 'journal-record-approval', 'journal-reject', 'journal-reopen', 'journal-cover', 'journal-record-cover',
    'journal-review', 'journal-publish', 'journal-discover', 'journal-open-entry', 'llm-column-claude-solo', 'llm-column-codex-solo', 'llm-column-joint',
  ];

  it('has every procedure, each parsing with the shared frontmatter reader', () => {
    expect(files.map((f) => f.replace(/\.md$/, '')).sort()).toEqual([...EXPECTED].sort());
    for (const f of files) {
      const p = parsePrompt(readFileSync(path.join(dir, f), 'utf8'), f);
      expect(p.def.id).toBe(f.replace(/\.md$/, ''));
      expect(p.def.module).toBe('journal');
      expect(['claude', 'codex']).toContain(p.def.runner);
      expect(p.body).not.toMatch(/^## This run/m); // the launcher appends it
      expect(p.body).toMatch(/## Read first/);
      expect(p.body).toMatch(/## Report/);
    }
  });

  it('keeps the shared wording identical across procedures', () => {
    const bodies = files.map((f) => parsePrompt(readFileSync(path.join(dir, f), 'utf8'), f).body);
    for (const b of bodies) {
      expect(b).toContain('Follow AGENTS.md or CLAUDE.md (they are identical) for this repo.');
      expect(b).toContain('State the limits out loud: what was not reached, what could not be verified, and what a reader must not conclude.');
      expect(b).toContain('MTW Studio re-reads the files on its own.');
      expect(b).not.toContain('build-state.mjs');
    }
  });

  it('no procedure asks for publication, bypass or an approval inference', () => {
    for (const f of files) {
      const body = readFileSync(path.join(dir, f), 'utf8');
      expect(body).not.toMatch(/--dangerously|skip-permissions/);
    }
  });
});

describe('candidates and live work (Matt, 2026-10-11)', () => {
  const DISCOVERY = [
    '# Journal discovery proposals, 1 January 2099',
    '',
    '## 1. Measuring agents can slow their work.',
    '',
    'Title: 37 characters. Recommended direction, provisionally 16/25.',
    '',
    'Card summary: Collecting evidence is part of the cost.',
    '',
    'Argument and reader: for an operator, measure collection separately.',
    '',
    'Evidence: authored changes only.',
    '',
    'Proposed service: Agentic Cost Planning; category: Agentic Systems. Tags deferred.',
    '',
    'Questions for the eventual interview, after headline selection:',
    '',
    '1. **SHARPENED:** What symptom made you inspect the tool?',
    '2. **STANDS:** What reproduction led to the correction?',
    '',
    'Proposed week: week of October 12.',
    '',
    '## 2. Dry runs still need live-command guards.',
    '',
    'Title: 38 characters. **Hold**, 14/25.',
    '',
    'Card summary: A test can inherit access.',
    '',
    '## Fresh signal supplement.',
    '',
    'Not a concept.',
    '',
  ].join('\n');
  const discovery = (): JournalState => {
    // CRLF, as files saved on Windows arrive.
    write('wiki/journal/candidates/PROPOSALS-2099-01-01.md', DISCOVERY.replace(/\n/g, '\r\n'));
    try {
      return JSON.parse(JSON.stringify(buildState({ repoRoot: copy.root, now: NOW, proposalsFile: 'PROPOSALS-2099-01-01.md' })));
    } finally {
      rmSync(path.join(copy.root, 'wiki/journal/candidates/PROPOSALS-2099-01-01.md'));
    }
  };

  it('picks the newest proposals file in the discovery format and reads its concepts', () => {
    write('wiki/journal/candidates/PROPOSALS-2099-01-01.md', DISCOVERY);
    expect(chooseProposals(copy.root).file).toBe('PROPOSALS-2099-01-01.md');
    rmSync(path.join(copy.root, 'wiki/journal/candidates/PROPOSALS-2099-01-01.md'));
    const s = discovery();
    expect(s.concepts.map((c) => c.headline)).toEqual(['Measuring agents can slow their work.', 'Dry runs still need live-command guards.']);
    const [one, two] = s.concepts;
    expect(one).toMatchObject({ description: 'Collecting evidence is part of the cost.', service: 'Agentic Cost Planning', category: 'Agentic Systems', held: false, approval: 'not approved' });
    expect(one!.questions.map((q) => q.label)).toEqual(['1', '2']);
    expect(two).toMatchObject({ held: true, argument: 'unknown' });
  });

  it('shows candidates and live work in the queue view and never a published entry', () => {
    const s = discovery();
    const rows = queueView(s);
    const published = new Set(s.queue.published.map((r) => r.slug));
    expect(rows.some((r) => r.slug && published.has(r.slug))).toBe(false);
    const cands = rows.filter((r) => r.key.startsWith('concept-'));
    expect(cands.map((r) => r.stage)).toEqual(['Candidate', 'Candidate (held)']);
    expect(liveCandidates(s)).toHaveLength(2);
  });

  it('waits on Matt for candidates and live entries only', () => {
    const s = discovery();
    const published = new Set(s.queue.published.map((r) => r.slug));
    expect(s.waiting.some((w) => w.entrySlug && published.has(w.entrySlug))).toBe(false);
    expect(s.waiting.filter((w) => w.entrySlug === null).map((w) => w.conceptNumber)).toEqual([1, 2]);
  });
});

describe('candidates.json (Matt, 2026-10-11)', () => {
  const sink = (): { write: (t: string) => boolean; text: string } => {
    const o = { text: '', write: (t: string) => ((o.text += t), true) };
    return o;
  };
  const records = (): JournalState => JSON.parse(JSON.stringify(buildState({ repoRoot: copy.root, now: NOW })));

  it('the real file is valid and every promoted record names an existing entry', () => {
    const r = readCandidates(realRoot);
    expect(r.errors).toEqual([]);
    for (const c of r.file!.candidates) if (c.entry) expect(readdirSync(path.join(realRoot, 'wiki/journal/entries'))).toContain(c.entry);
  });

  it('Studio reads concepts from the records, with each record\'s own entry and source', () => {
    const s = records();
    const file = readCandidates(copy.root).file!;
    expect(s.concepts.map((c) => c.number)).toEqual(file.candidates.map((c) => c.number));
    for (const c of file.candidates) {
      const k = s.concepts.find((x) => x.number === c.number)!;
      expect(k.entrySlug).toBe(c.entry);
      expect(k.stages.find((x) => x.id === 'proposed')!.evidence).toContain(c.source.file);
    }
    const live = queueView(s).filter((r) => r.key.startsWith('concept-')).map((r) => r.conceptNumber);
    expect(live).toEqual(file.candidates.filter((c) => !c.entry).map((c) => c.number));
  });

  it('an invalid file is reported, never half-read', () => {
    const real = readFileSync(path.join(copy.root, 'wiki/journal/candidates.json'), 'utf8');
    try {
      write('wiki/journal/candidates.json', JSON.stringify({ schemaVersion: 1, candidates: [{ number: 1 }] }));
      const s = records();
      expect(s.concepts).toEqual([]);
      expect(s.generatorNotes.some((n) => /candidates\.json/.test(n))).toBe(true);
    } finally {
      write('wiki/journal/candidates.json', real);
    }
  });

  it('import appends only new sections with the next numbers and unique ids; existing records never change', () => {
    const base = candidatesFileSchema.parse({ schemaVersion: 1, candidates: [] });
    const concepts = [
      { number: 1, headline: 'Same words.', description: 'One.' },
      { number: 2, headline: 'Same words', description: 'Two.', held: true },
    ];
    const one = appendFromProposals(base, concepts, 'wiki/journal/candidates/PROPOSALS-2099-01-01.md', '2099-01-01');
    expect(one.added.map((c) => [c.number, c.id, c.status])).toEqual([[1, 'same-words', 'candidate'], [2, 'same-words-2', 'held']]);
    const again = appendFromProposals(one.file, concepts, 'wiki/journal/candidates/PROPOSALS-2099-01-01.md', '2099-01-02');
    expect(again.added).toEqual([]);
    expect(again.file).toEqual(one.file);
    expect(() => appendFromProposals(base, [{ number: 1, headline: 'unknown', description: 'x' }], 'wiki/journal/candidates/PROPOSALS-x.md', '2099-01-01')).toThrow(/headline/);
  });

  it('the CLI imports, links and validates, and refuses files outside the candidates folder', async () => {
    const real = readFileSync(path.join(copy.root, 'wiki/journal/candidates.json'), 'utf8');
    try {
      rmSync(path.join(copy.root, 'wiki/journal/candidates.json'));
      const out = sink();
      await expect(journalCommand(['journal', 'candidates', 'import', 'wiki/journal/queue.md'], copy.root, out as never)).rejects.toThrow(/not a proposals file/);
      // Matt, 2026-10-11: a discovery file with no signal coverage, or a candidate with nothing for readers, is refused.
      await expect(journalCommand(['journal', 'candidates', 'import', 'wiki/journal/candidates/PROPOSALS-2026-10-08.md'], copy.root, out as never)).rejects.toThrow(/no Coverage line/);
      const block = (n: number, share: boolean) =>
        [`## ${n}. Theme number ${n} spans the quarter.`, '', 'Title: 34 characters.', '', `Card summary: Summary ${n}.`, '', 'Theme size: 120 commits across 6 weeks in 2 repos', '', ...(share ? ['Readers get: the journal-review procedure and its presets.', ''] : [])].join('\n');
      const file = (share: boolean) => ['# Journal discovery proposals, 1 January 2099', '', 'Coverage: 4950 commits from 9 repos over 13 weeks (window 12 weeks to 2099-01-01); 340 bookmarks (2098-10-01 to 2098-12-30).', '', block(1, true), block(2, share)].join('\n');
      write('wiki/journal/candidates/PROPOSALS-2099-01-02.md', file(false));
      await expect(journalCommand(['journal', 'candidates', 'import', 'wiki/journal/candidates/PROPOSALS-2099-01-02.md'], copy.root, out as never)).rejects.toThrow(/Readers get/);
      write('wiki/journal/candidates/PROPOSALS-2099-01-02.md', file(true));
      expect(await journalCommand(['journal', 'candidates', 'import', 'wiki/journal/candidates/PROPOSALS-2099-01-02.md'], copy.root, out as never)).toBe(0);
      expect(out.text).toMatch(/2 added/);
      expect(readCandidates(copy.root).file!.candidates[0]).toMatchObject({ share: 'the journal-review procedure and its presets.', themeSize: '120 commits across 6 weeks in 2 repos' });
      rmSync(path.join(copy.root, 'wiki/journal/candidates/PROPOSALS-2099-01-02.md'));
      await expect(journalCommand(['journal', 'candidates', 'link', '1', 'no-such-entry'], copy.root, out as never)).rejects.toThrow(/no entry folder/);
      expect(await journalCommand(['journal', 'candidates', 'link', '1', 't-plain'], copy.root, out as never)).toBe(0);
      expect(readCandidates(copy.root).file!.candidates[0]).toMatchObject({ status: 'promoted', entry: 't-plain' });
      expect(await journalCommand(['journal', 'candidates', 'validate'], copy.root, out as never)).toBe(0);
      expect(await journalCommand(['images', 'x'], copy.root, out as never)).toBeNull();
    } finally {
      write('wiki/journal/candidates.json', real);
    }
  });
});

describe('publish', () => {
  it('launches journal-publish for a real entry only, after the publish direction is recorded', async () => {
    launches.length = 0;
    expect((await h.post('/api/journal/launch', { operation: 'journal-publish', params: { entry: 'not-an-entry' } })).status).toBe(400);
    expect((await h.post('/api/journal/decide', { subject: 't-plain', action: 'publish-direction', explicit: true })).status).toBe(200);
    const r = await h.post('/api/journal/launch', { operation: 'journal-publish', params: { entry: 't-plain' } });
    expect(r.status).toBe(200);
    expect(launches[0]).toMatchObject({ id: 'journal-publish' });
    expect(launches[0]!.params.entry).toBe('t-plain');
  });
});

describe('repeatable workflow (Matt, 2026-10-11)', () => {
  it('discovery launches as one journal-discover session with its ingestion choice', async () => {
    launches.length = 0;
    const r = await h.post('/api/journal/launch', { operation: 'journal-discover', params: { ingest: 'skip', focus: 'cost' } });
    expect(r.status).toBe(200);
    expect(launches).toHaveLength(1);
    expect(launches[0]).toMatchObject({ id: 'journal-discover', params: { ingest: 'skip', focus: 'cost' } });
  });

  it('approving a headline opens its entry through journal-open-entry with the concept resolved to number and headline', async () => {
    launches.length = 0;
    const s = JSON.parse(JSON.stringify(buildState({ repoRoot: copy.root, now: NOW }))) as JournalState;
    const cand = liveCandidates(s)[0]!;
    expect((await h.post('/api/journal/decide', { subject: `concept-${cand.number}`, action: 'approve-headline', value: { headline: cand.headline } })).status).toBe(200);
    const r = await h.post('/api/journal/launch', { operation: 'journal-open-entry', params: { concept: String(cand.number) } });
    expect(r.status).toBe(200);
    expect(launches[0]!.params.concept).toBe(`${cand.number} · ${cand.headline}`);
  });

  it('the operation dropdowns offer fresh candidates, never published ideas', async () => {
    const s = JSON.parse(JSON.stringify(buildState({ repoRoot: copy.root, now: NOW }))) as JournalState;
    const offered = ((await h.get('/api/journal/options')).concepts as { number: number }[]).map((c) => c.number);
    for (const c of liveCandidates(s)) expect(offered).toContain(c.number);
    for (const c of s.concepts.filter((x) => x.entrySlug && s.queue.published.some((r) => r.slug === x.entrySlug))) expect(offered).not.toContain(c.number);
  });

  it('the weekly schedule runs discovery as one session and stays off until Matt enables it', () => {
    const sch = JSON.parse(readFileSync(path.join(realRoot, 'wiki/operations/schedules.json'), 'utf8')).schedules.find((x: { id: string }) => x.id === 'journal-weekly');
    expect(sch).toMatchObject({ operation: 'journal-discover', enabled: false });
    expect(sch.chain).toBeUndefined();
  });

  it('every procedure the runbook sequence names exists', () => {
    const runbook = readFileSync(path.join(realRoot, 'wiki/journal/runbook.md'), 'utf8');
    const named = [...new Set(runbook.match(/`(journal-[a-z-]+)`/g)?.map((m) => m.slice(1, -1)) ?? [])].filter((n) => !['journal-recommendation', 'journal-interview', 'journal-entry'].includes(n));
    const procs = new Set(readdirSync(path.join(realRoot, 'wiki/operations/prompts')).map((f) => f.replace(/\.md$/, '')));
    for (const s of JSON.parse(readFileSync(path.join(realRoot, 'wiki/operations/schedules.json'), 'utf8')).schedules) procs.add(s.id);
    expect(named.filter((n) => !procs.has(n))).toEqual([]);
  });
});

describe('review chat', () => {
  it('reads presets from the template, each with a known scope', () => {
    const presets = parseReviewPresets(readFileSync(path.join(realRoot, 'wiki/operations/templates/journal-review-fixes.md'), 'utf8'));
    expect(presets.length).toBeGreaterThan(5);
    expect(new Set(presets.map((p) => p.id)).size).toBe(presets.length);
  });

  it('launches journal-review for one item with only its description under This run, and refuses bad subjects', async () => {
    launches.length = 0;
    expect((await h.post('/api/journal/review', { subject: 'nope', note: 'x' })).status).toBe(400);
    expect((await h.post('/api/journal/review', { subject: 'entry:not-an-entry', note: 'x' })).status).toBe(404);
    const r = await h.post('/api/journal/review', { subject: 'entry:t-plain', fixes: ['gate-report', 'made-up'], note: '  check   it ' });
    expect(r.status).toBe(200);
    expect(launches[0]).toMatchObject({ id: 'journal-review' });
    expect(launches[0]!.params).toMatchObject({ subject: 'entry:t-plain', fixes: 'gate-report', note: 'check it' });
    expect(launches[0]!.params.target).toMatch(/^Entry t-plain/);
    expect((await h.get('/api/journal/review-presets')).presets.length).toBeGreaterThan(5);
  });
});

describe('markdown for the post preview', () => {
  it('parses blocks and inline tokens as data', () => {
    const blocks = mdBlocks('## Heading\n\nA **bold** claim with [a link](https://example.com) and `code`.\n\n> quoted\n\n1. one\n2. two\n');
    expect(blocks.map((b) => b.type)).toEqual(['h', 'p', 'quote', 'list']);
    const tokens = inlineTokens('A **bold** claim with [a link](https://example.com) and `code`.');
    expect(tokens.map((t) => t.t)).toEqual(['text', 'strong', 'text', 'link', 'text', 'code', 'text']);
  });
});

describe('rejecting a candidate (Matt, 2026-10-11)', () => {
  const dec = (action: string, at: string) => ({ id: at, at, actor: 'matt', module: 'journal', subject: 'concept-7', action });
  const row = (n: number | null, slug: string | null) => ({ key: n === null ? `e-${slug}` : `concept-${n}`, conceptNumber: n, slug }) as never;
  it('a reject decision hides the candidate row at once and a later reopen restores it', () => {
    const rows = [row(7, null), row(8, null), row(null, 'an-entry')];
    expect(withoutRejectedCandidates(rows, []).length).toBe(3);
    const rejected = [dec('reject', '2026-10-11T10:00:00Z')];
    expect(rejectedByDecision(rejected, 'concept-7')).toBe(true);
    expect(withoutRejectedCandidates(rows, rejected).map((r) => r.key)).toEqual(['concept-8', 'e-an-entry']);
    const reopened = [...rejected, dec('reopen', '2026-10-11T11:00:00Z')];
    expect(withoutRejectedCandidates(rows, reopened).length).toBe(3);
  });
  it('the Waiting list drops rejected candidates too, never entries', () => {
    const waiting = [
      { entrySlug: null, conceptNumber: 7, entryTitle: 'A', ask: 'x', detail: '', where: '' },
      { entrySlug: 'an-entry', entryTitle: 'B', ask: 'y', detail: '', where: '' },
    ];
    expect(waitingWithoutRejected(waiting, [dec('reject', '2026-10-11T10:00:00Z')]).map((w) => w.entryTitle)).toEqual(['B']);
  });
});
