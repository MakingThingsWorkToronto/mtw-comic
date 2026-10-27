import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runPreCommit, findPromptLiterals } from './pre-commit-checks.mjs';
import { reminderFor, mentionedAssets } from '../../.claude/hooks/asset-registration-reminder.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..');
const git = (cwd, ...a) => { const r = spawnSync('git', a, { cwd, encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); return r.stdout; };

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mtw-hooks-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  git(root, 'init', '-q');
  git(root, 'config', 'user.email', 't@t');
  git(root, 'config', 'user.name', 't');
  for (const d of ['wiki/image-library/assets', 'wiki/soundtrack-library/assets', 'wiki/comics-library', 'wiki/journal', 'apps/mtw/modules']) fs.mkdirSync(path.join(root, d), { recursive: true });
  const put = (rel, body = 'x') => { const f = path.join(root, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, body); };
  const stage = (...rels) => git(root, 'add', '--', ...rels);
  put('wiki/image-library/manifest.json', JSON.stringify({ files: [{ destination: 'assets/a/known.png' }], records: [] }));
  put('wiki/soundtrack-library/sources.json', JSON.stringify({ tracks: [{ file: 'known.mp3' }] }));
  return { root, put, stage };
}

test('parity: differing AGENTS.md and CLAUDE.md fail; identical pass', (t) => {
  const { root, put, stage } = fixture(t);
  put('AGENTS.md', 'one'); put('CLAUDE.md', 'two'); stage('AGENTS.md', 'CLAUDE.md');
  assert.match(runPreCommit(root, {}).failures[0].message, /differ/);
  put('CLAUDE.md', 'one'); stage('CLAUDE.md');
  assert.equal(runPreCommit(root, {}).failures.length, 0);
});

test('parity: only one staged compares against the index copy of the other', (t) => {
  const { root, put, stage } = fixture(t);
  put('AGENTS.md', 'one'); put('CLAUDE.md', 'one'); stage('AGENTS.md', 'CLAUDE.md');
  git(root, 'commit', '-qm', 'base');
  put('AGENTS.md', 'changed'); stage('AGENTS.md');
  assert.equal(runPreCommit(root, {}).failures[0].check, 'parity');
});

test('parity: word budget', (t) => {
  const { root, put, stage } = fixture(t);
  const big = 'word '.repeat(1700);
  put('AGENTS.md', big); put('CLAUDE.md', big); stage('AGENTS.md', 'CLAUDE.md');
  assert.match(runPreCommit(root, {}).failures[0].message, /budget/);
});

test('media: new media outside a canonical home fails', (t) => {
  const { root, put, stage } = fixture(t);
  put('Downloads/pic.png'); stage('Downloads/pic.png');
  assert.match(runPreCommit(root, {}).failures[0].message, /outside a canonical home/);
});

test('media: unregistered image asset fails; registered passes; site copies pass', (t) => {
  const { root, put, stage } = fixture(t);
  put('wiki/image-library/assets/a/new.png'); put('wiki/image-library/assets/a/known.png'); put('site/public/x.png');
  stage('wiki/image-library/assets/a/new.png', 'wiki/image-library/assets/a/known.png', 'site/public/x.png');
  const f = runPreCommit(root, {}).failures;
  assert.equal(f.length, 1);
  assert.match(f[0].message, /new\.png: not registered/);
});

test('media: registering in the same commit (staged manifest) passes', (t) => {
  const { root, put, stage } = fixture(t);
  put('wiki/image-library/assets/a/new.png');
  put('wiki/image-library/manifest.json', JSON.stringify({ files: [{ destination: 'assets/a/new.png' }] }));
  stage('wiki/image-library/assets/a/new.png', 'wiki/image-library/manifest.json');
  assert.equal(runPreCommit(root, {}).failures.length, 0);
});

test('media: audio must be in sources.json', (t) => {
  const { root, put, stage } = fixture(t);
  put('wiki/soundtrack-library/assets/new.mp3'); put('wiki/soundtrack-library/assets/known.mp3');
  stage('wiki/soundtrack-library/assets/new.mp3', 'wiki/soundtrack-library/assets/known.mp3');
  const f = runPreCommit(root, {}).failures;
  assert.equal(f.length, 1);
  assert.match(f[0].message, /new\.mp3: not registered in the audio/);
});

test('media: audio listed by canonicalPath in audio-records.json is registered (pre-commit and shared lookup)', async (t) => {
  const { root, put, stage } = fixture(t);
  const listed = 'wiki/soundtrack-library/assets/score-review/run-1/home-opening.webm';
  const stray = 'wiki/soundtrack-library/assets/score-review/run-1/home-unlisted.webm';
  put('wiki/soundtrack-library/audio-records.json', JSON.stringify({ schemaVersion: 1, records: [{ id: 'r1', canonicalPath: listed }] }));
  put(listed); put(stray);
  stage('wiki/soundtrack-library/audio-records.json', listed, stray);
  const f = runPreCommit(root, {}).failures;
  assert.equal(f.length, 1);
  assert.match(f[0].message, /home-unlisted\.webm: not registered in the audio/);
  const reg = await import('../assets/media-registration.mjs');
  assert.equal(reg.checkRegistered(listed, reg.diskReader(root)).registered, true);
  assert.equal(reg.checkRegistered(stray, reg.diskReader(root)).registered, false);
  put('wiki/soundtrack-library/audio-records.json', '{ not json');
  assert.equal(reg.checkRegistered(listed, reg.diskReader(root)).registered, false);
});

test('wiki-code: new code in wiki fails, allowlisted and modified pass', (t) => {
  const { root, put, stage } = fixture(t);
  put('wiki/journal/old.js'); stage('wiki/journal/old.js'); git(root, 'commit', '-qm', 'base');
  put('wiki/journal/old.js', 'y'); put('wiki/journal/new.js'); put('wiki/journal/gen.html');
  put('scripts/hooks/wiki-generated-allowlist.txt', '# c\nwiki/journal/gen.html\n');
  stage('wiki/journal/old.js', 'wiki/journal/new.js', 'wiki/journal/gen.html', 'scripts/hooks/wiki-generated-allowlist.txt');
  const f = runPreCommit(root, {}).failures;
  assert.equal(f.length, 1);
  assert.match(f[0].message, /new\.js/);
});

test('prompts: long agent-prompt literal in apps/mtw fails; short or tests pass', (t) => {
  const { root, put, stage } = fixture(t);
  const long = `You are a careful agent. ${'Read the files and report. '.repeat(10)}`;
  put('apps/mtw/modules/a.ts', `export const P = "${long}";\n`);
  put('apps/mtw/modules/b.ts', 'export const P = "You are fine";\n');
  put('apps/mtw/tests/c.ts', `export const P = "${long}";\n`);
  stage('apps/mtw/modules/a.ts', 'apps/mtw/modules/b.ts', 'apps/mtw/tests/c.ts');
  const f = runPreCommit(root, {}).failures;
  assert.equal(f.length, 1);
  assert.match(f[0].message, /a\.ts.*wiki\/operations\/prompts/);
  assert.equal(findPromptLiterals(`const x = \`${long}\``).length, 1);
});

test('bypass: MTW_HOOKS_SKIP skips the named check and reports it', (t) => {
  const { root, put, stage } = fixture(t);
  put('Downloads/pic.png'); stage('Downloads/pic.png');
  const r = runPreCommit(root, { MTW_HOOKS_SKIP: 'media' });
  assert.equal(r.failures.length, 0);
  assert.deepEqual(r.skipped, ['media']);
});

test('pre-commit CLI exits 1, prints a loud bypass line, and install.mjs is idempotent', (t) => {
  const { root, put, stage } = fixture(t);
  put('Downloads/pic.png'); stage('Downloads/pic.png');
  const run = (env) => spawnSync('node', [path.join(repo, 'scripts/hooks/pre-commit.mjs')], { cwd: root, encoding: 'utf8', env: { ...process.env, ...env } });
  assert.equal(run({}).status, 1);
  const skipped = run({ MTW_HOOKS_SKIP: 'media' });
  assert.equal(skipped.status, 0);
  assert.match(skipped.stderr, /BYPASSED/);
  fs.mkdirSync(path.join(root, 'scripts/hooks/git'), { recursive: true });
  fs.copyFileSync(path.join(repo, 'scripts/hooks/install.mjs'), path.join(root, 'scripts/hooks/install.mjs'));
  fs.copyFileSync(path.join(repo, 'scripts/hooks/git/pre-commit'), path.join(root, 'scripts/hooks/git/pre-commit'));
  const inst = () => spawnSync('node', [path.join(root, 'scripts/hooks/install.mjs')], { cwd: root, encoding: 'utf8' });
  assert.match(inst().stdout, /installed/);
  assert.match(inst().stdout, /already installed/);
  assert.equal(git(root, 'config', 'core.hooksPath').trim(), 'scripts/hooks/git');
});

test('reminder: unregistered asset named by Bash or Write is flagged; registered and absent are not', (t) => {
  const { root, put } = fixture(t);
  put('wiki/image-library/assets/a/new.png'); put('wiki/image-library/assets/a/known.png');
  const bash = { tool_name: 'Bash', tool_input: { command: 'python gen.py --out wiki/image-library/assets/a/new.png' } };
  assert.match(reminderFor(bash, root), /new\.png/);
  const win = { tool_name: 'Bash', tool_input: { command: 'x' }, tool_response: { stdout: `wrote ${root}\\wiki\\image-library\\assets\\a\\new.png` } };
  assert.deepEqual(mentionedAssets(win, root), ['wiki/image-library/assets/a/new.png']);
  const write = { tool_name: 'Write', tool_input: { file_path: path.join(root, 'wiki/image-library/assets/a/known.png'), content: 'x' } };
  assert.equal(reminderFor(write, root), null);
  const gone = { tool_name: 'Bash', tool_input: { command: 'cp a wiki/soundtrack-library/assets/nope.mp3' } };
  assert.equal(reminderFor(gone, root), null);
});

test('reminder hook CLI prints additionalContext JSON and exits 0; mirrors are byte-identical', (t) => {
  const { root, put } = fixture(t);
  put('wiki/soundtrack-library/assets/new.mp3');
  const input = JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'cp x wiki/soundtrack-library/assets/new.mp3' } });
  for (const dir of ['.claude', '.codex']) {
    const r = spawnSync('node', [path.join(repo, dir, 'hooks/asset-registration-reminder.mjs')], { input, encoding: 'utf8', env: { ...process.env, MTW_HOOK_ROOT: root } });
    assert.equal(r.status, 0);
    assert.match(JSON.parse(r.stdout).hookSpecificOutput.additionalContext, /new\.mp3/);
  }
  const a = fs.readFileSync(path.join(repo, '.claude/hooks/asset-registration-reminder.mjs'));
  assert.ok(a.equals(fs.readFileSync(path.join(repo, '.codex/hooks/asset-registration-reminder.mjs'))));
});

test('misplaced media: names strays and wrong-home media, skips canonical homes, site copies, skill assets and exemptions', async (t) => {
  const { findMisplacedMedia, homeFor } = await import('../assets/find-misplaced-media.mjs');
  const { misplacedLine } = await import('../../.claude/hooks/session-start.mjs');
  const { root, put } = fixture(t);
  for (const rel of ['discussion/stray.png', 'scratch/take.mp3', 'wiki/comics-library/assets/voices/a.mp3', 'wiki/image-library/assets/a/known.png',
    'wiki/soundtrack-library/assets/known.mp3', 'site/public/x.png', '.claude/skills/s/assets/i.png', 'fixtures/ok.png', 'notes/readme.md']) put(rel);
  put('scripts/assets/media-exempt.txt', 'fixtures/**\n');
  const found = findMisplacedMedia(root);
  assert.deepEqual(found.outside.sort(), ['discussion/stray.png', 'scratch/take.mp3']);
  assert.deepEqual(found.wrongHome, ['wiki/comics-library/assets/voices/a.mp3']);
  assert.equal(homeFor('scratch/take.mp3'), 'wiki/soundtrack-library/');
  assert.equal(homeFor('discussion/stray.png'), 'wiki/image-library/');
  fs.mkdirSync(path.join(root, 'scripts/assets'), { recursive: true });
  fs.copyFileSync(path.join(repo, 'scripts/assets/find-misplaced-media.mjs'), path.join(root, 'scripts/assets/find-misplaced-media.mjs'));
  fs.copyFileSync(path.join(repo, 'scripts/assets/media-registration.mjs'), path.join(root, 'scripts/assets/media-registration.mjs'));
  assert.match(await misplacedLine(root), /Misplaced media: 3 file\(s\)/);
  assert.equal(await misplacedLine(path.join(root, 'missing')), '');
});

test('session-start: prints template text from disk, adds live status only when Studio answers; mirrors identical; registrations point at real scripts', async (t) => {
  const { rulesText, statusLine } = await import('../../.claude/hooks/session-start.mjs');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mtw-ss-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'wiki/operations/templates'), { recursive: true });
  fs.writeFileSync(path.join(root, 'wiki/operations/templates/session-start.md'), '---\nid: x\n---\nRULE ONE\n');
  assert.equal(rulesText(root), 'RULE ONE');
  assert.equal(rulesText(path.join(root, 'missing')), '');
  assert.match(statusLine({ modules: [{ items: [{ label: 'Q', count: 2, attention: true }] }] }), /Waiting on Matt: Q 2/);
  assert.equal(statusLine(null), '');
  const run = spawnSync('node', [path.join(repo, '.claude/hooks/session-start.mjs')], { input: '{}', encoding: 'utf8', env: { ...process.env, MTW_STUDIO_URL: 'http://127.0.0.1:1' } });
  assert.equal(run.status, 0);
  assert.match(JSON.parse(run.stdout).hookSpecificOutput.additionalContext, /Studio is the operating surface/);
  for (const f of ['session-start.mjs', 'asset-registration-reminder.mjs', 'check-layering.mjs', 'lib/write-payload.mjs', 'lib/session-media.mjs']) {
    assert.ok(fs.readFileSync(path.join(repo, '.claude/hooks', f)).equals(fs.readFileSync(path.join(repo, '.codex/hooks', f))), `${f} mirror differs`);
  }
  const claude = JSON.parse(fs.readFileSync(path.join(repo, '.claude/settings.json'), 'utf8'));
  const codex = JSON.parse(fs.readFileSync(path.join(repo, '.codex/hooks.json'), 'utf8'));
  for (const [cfg, dir] of [[claude, '.claude'], [codex, '.codex']]) {
    for (const groups of Object.values(cfg.hooks)) for (const g of groups) for (const h of g.hooks) {
      const script = /hooks\/([\w-]+\.mjs)/.exec(h.command)?.[1];
      assert.ok(script && fs.existsSync(path.join(repo, dir, 'hooks', script)), `${dir} registers missing script ${script}`);
    }
  }
});

process.env.CODEX_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'mtw-codex-home-')); // keep the real ~/.codex out of these tests
const { recordSession } = await import('../../.claude/hooks/session-start.mjs');
const { readSessionMedia } = await import('../../.claude/hooks/lib/session-media.mjs');

function stopFixture(t) {
  const f = fixture(t);
  fs.mkdirSync(path.join(f.root, 'wiki/operations/templates'), { recursive: true });
  const started = new Date(Date.now() - 60_000);
  recordSession({ session_id: 'sess-1', source: 'startup' }, f.root, started);
  // Attribute files to this session the way the PostToolUse hook does (a Write naming the path).
  const own = (...rels) => { for (const rel of rels) recordToolEnd({ session_id: 'sess-1', tool_use_id: rel, tool_name: 'Write', tool_input: { file_path: path.join(f.root, rel), content: 'x' } }, f.root); };
  return { ...f, started, own };
}

test('session record: written once per session id, kept on resume', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mtw-sess-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const file = recordSession({ session_id: 'a/b..c' }, root, new Date('2026-10-10T05:00:00Z'));
  assert.ok(file.endsWith('ab..c.json'));
  recordSession({ session_id: 'a/b..c', source: 'resume' }, root, new Date('2026-10-10T09:00:00Z'));
  assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).startedAt, '2026-10-10T05:00:00.000Z');
  assert.equal(recordSession({}, root), null);
});

test('reminder hook records attribution: PreToolUse opens a window, PostToolUse closes it and logs named media', (t) => {
  const { root, put } = fixture(t);
  put('wiki/image-library/assets/a/named.png');
  const env = { ...process.env, MTW_HOOK_ROOT: root };
  for (const dir of ['.claude', '.codex']) {
    const base = { session_id: `s-${dir.slice(1)}`, tool_use_id: 'b1', tool_name: 'Bash', tool_input: { command: 'cp x wiki/image-library/assets/a/named.png' } };
    assert.equal(spawnSync('node', [path.join(repo, dir, 'hooks/asset-registration-reminder.mjs')], { input: JSON.stringify({ ...base, hook_event_name: 'PreToolUse' }), encoding: 'utf8', env }).status, 0);
    assert.equal(spawnSync('node', [path.join(repo, dir, 'hooks/asset-registration-reminder.mjs')], { input: JSON.stringify({ ...base, hook_event_name: 'PostToolUse' }), encoding: 'utf8', env }).status, 0);
    const m = readSessionMedia(root, base.session_id);
    assert.ok(m.paths.has('wiki/image-library/assets/a/named.png'));
    assert.equal(m.windows.length, 1);
  }
  assert.ok(fs.readFileSync(path.join(repo, '.claude/hooks/lib/session-media.mjs')).equals(fs.readFileSync(path.join(repo, '.codex/hooks/lib/session-media.mjs'))));
});

// 2026-10-11: process.exit() in a hook aborted Node on Windows while its stdin pipe closed (UV_HANDLE_CLOSING),
// so the PostToolUse hook "failed" on most shell calls. Hooks set process.exitCode and return instead.
test('hooks never call process.exit() (Windows UV_HANDLE_CLOSING abort)', () => {
  const files = [];
  const walk = (dir) => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p); else if (/\.m?js$/.test(e.name)) files.push(p); } };
  for (const d of ['.claude/hooks', '.codex/hooks']) walk(path.join(repo, d));
  assert.ok(files.length >= 10, `found ${files.length} hook files`);
  const offenders = files.filter((f) => fs.readFileSync(f, 'utf8').split(/\r?\n/).some((l) => /process\.exit\(/.test(l.replace(/\/\/.*$/, ''))));
  assert.deepEqual(offenders.map((f) => path.relative(repo, f)), []);
});

// 2026-10-11: a hook reparsed the 14.7 MB image manifest once per changed file and took 65 s against its
// 30 s timeout. Every registered hook must finish on the real working tree within half its timeout.
test('hooks: each registered Claude hook runs on the real tree within half its timeout', { timeout: 120000 }, () => {
  const settings = JSON.parse(fs.readFileSync(path.join(repo, '.claude/settings.json'), 'utf8'));
  const probe = { tool_name: 'Bash', tool_input: { command: 'git status' }, tool_response: { stdout: '' }, hook_event_name: '' };
  const seen = new Set();
  for (const [event, groups] of Object.entries(settings.hooks)) {
    for (const { hooks } of groups) {
      for (const h of hooks) {
        const script = h.command.match(/\.claude\/hooks\/([\w-]+\.mjs)/)?.[1];
        if (!script || seen.has(`${event}:${script}`)) continue;
        seen.add(`${event}:${script}`);
        assert.ok(h.timeout, `${event} ${script} has no timeout`);
        // No session_id: the hooks write no session records, yet still classify the whole working tree.
        const started = Date.now();
        const r = spawnSync(process.execPath, [path.join(repo, '.claude/hooks', script)], { cwd: repo, input: JSON.stringify({ ...probe, hook_event_name: event }), encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: repo, MTW_STUDIO_URL: 'http://127.0.0.1:9/' } });
        const ms = Date.now() - started;
        assert.equal(r.status, 0, `${event} ${script} exited ${r.status}: ${r.stderr}`);
        assert.ok(ms < h.timeout * 500, `${event} ${script} took ${ms} ms; budget ${h.timeout * 500} ms (half its ${h.timeout} s timeout)`);
      }
    }
  }
  assert.ok(seen.size >= 4, [...seen].join(', '));
});

test('ports: a staged launch file that adds a non-canonical port fails; 8787, 8788 and port 0 pass', (t) => {
  const { root, put, stage } = fixture(t);
  put('site/scripts/serve.mjs', "server.listen(0);\nconst site = 'http://127.0.0.1:8787/';\nconst studio = '--port 8788';\n");
  stage('site/scripts/serve.mjs');
  assert.deepEqual(runPreCommit(root, { MTW_HOOKS_SKIP: 'media' }).failures.filter((f) => f.check === 'ports'), []);
  put('site/scripts/serve.mjs', "server.listen(0);\nconst preview = 'http://localhost:' + 4402;\nconst old = 'http://127.0.0.1:4321/';\n");
  stage('site/scripts/serve.mjs');
  const fails = runPreCommit(root, { MTW_HOOKS_SKIP: 'media' }).failures.filter((f) => f.check === 'ports');
  assert.equal(fails.length, 1);
  assert.match(fails[0].message, /127\.0\.0\.1:4321.*8787 \(website\) and 8788 \(Studio\)/);
  // Historical evidence keeps its recorded ports.
  put('discussion/verification/old.md', 'http://127.0.0.1:4321/');
  stage('discussion/verification/old.md');
  assert.equal(runPreCommit(root, { MTW_HOOKS_SKIP: 'media' }).failures.filter((f) => f.check === 'ports' && f.message.includes('discussion/')).length, 0);
});
