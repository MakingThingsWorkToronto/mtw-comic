// Pre-commit checks over STAGED content. Guardrails that catch misses; none of this claims
// global enforcement (AGENTS.md: "Never claim global enforcement"). Each check returns an array of
// one-line failure messages that name the fix.
import path from 'node:path';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { canonicalHomes, checkAssetDestination } from '../assets/check-asset-destination.mjs';
import { inspectInstructions } from '../agents/check-agent-instructions.mjs';
import { isMedia, checkRegistered, isExemptMedia, mediaExemptions, REGISTER_HINT } from '../assets/media-registration.mjs';
import { readPage } from '../wiki/wiki-graph.mjs';
import { isMaintainedPage } from '../wiki/wiki-frontmatter-gate.mjs';

export const CHECKS = ['parity', 'media', 'wiki-code', 'prompts', 'wiki-frontmatter', 'wiki-graph', 'ports', 'hooks'];
const CODE_EXT = /\.(?:js|ts|tsx|css|html)$/;
// Media that legitimately lives outside the canonical homes: site integration copies, skill assets.
const MEDIA_COPY_PREFIXES = ['site/', '.claude/skills/', '.codex/skills/'];

export function git(root, args) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${r.stderr.trim()}`);
  return r.stdout;
}

/** Staged entries: [{ status: 'A'|'M'|'R'|'C', path }] (rename/copy report the destination). */
export function stagedEntries(root) {
  const out = git(root, ['diff', '--cached', '--name-status', '-z', '--diff-filter=ACMR', '-M']).split('\0').filter(Boolean);
  const entries = [];
  for (let i = 0; i < out.length;) {
    const status = out[i][0];
    if (status === 'R' || status === 'C') { entries.push({ status, path: out[i + 2] }); i += 3; } else { entries.push({ status, path: out[i + 1] }); i += 2; }
  }
  return entries;
}

export function stagedBlob(root, rel) {
  const r = spawnSync('git', ['show', `:${rel}`], { cwd: root, maxBuffer: 256 * 1024 * 1024 });
  return r.status === 0 ? r.stdout : null;
}

export function stagedReader(root) {
  return (rel) => {
    const b = stagedBlob(root, rel);
    if (b) return b.toString('utf8');
    try { return fs.readFileSync(path.join(root, rel), 'utf8'); } catch { return null; }
  };
}

export function checkParity(root, entries) {
  if (!entries.some((e) => e.path === 'AGENTS.md' || e.path === 'CLAUDE.md')) return [];
  const a = stagedBlob(root, 'AGENTS.md');
  const c = stagedBlob(root, 'CLAUDE.md');
  if (!a?.length || !c?.length) return ['AGENTS.md/CLAUDE.md: one is missing from the index; stage both identically (git add AGENTS.md CLAUDE.md).'];
  const fails = [];
  if (!a.equals(c)) fails.push('AGENTS.md and CLAUDE.md differ in the index; edit both identically and stage both (git add AGENTS.md CLAUDE.md).');
  const text = a.toString('utf8');
  const words = text.match(/\S+/g)?.length ?? 0;
  const lines = text.trimEnd().split(/\r?\n/).length;
  if (words > 1650 || lines > 210) fails.push(`AGENTS.md context budget exceeded: ${words} words, ${lines} lines (limits 1650/210); trim it.`);
  if (!fails.length && fs.existsSync(path.join(root, 'site/package.json'))) {
    // Links, commands and table rows are judged on the working tree by the maintained checker.
    for (const issue of inspectInstructions(root).issues) fails.push(`${issue} (node scripts/agents/check-agent-instructions.mjs).`);
  }
  return fails;
}

export function checkMedia(root, entries, readText) {
  const fails = [];
  const exemptions = mediaExemptions(root); // scripts/assets/media-exempt.txt (test fixtures), shared with the agent hooks
  for (const e of entries) {
    if (e.status === 'M' || !isMedia(e.path)) continue;
    if (MEDIA_COPY_PREFIXES.some((p) => e.path.startsWith(p)) || isExemptMedia(e.path, root, exemptions)) continue;
    const kind = Object.keys(canonicalHomes).find((k) => e.path.startsWith(`${canonicalHomes[k]}/`));
    if (!kind) {
      fails.push(`${e.path}: new media outside a canonical home; move it under wiki/image-library/, wiki/soundtrack-library/, wiki/comics-library/ or wiki/journal/ (node scripts/assets/check-asset-destination.mjs <kind> <path>).`);
      continue;
    }
    try { checkAssetDestination(kind, e.path, root); } catch (err) { fails.push(`${e.path}: ${err.message}.`); continue; }
    const r = checkRegistered(e.path, readText);
    if (!r.registered) fails.push(`${e.path}: not registered in the ${r.registry} catalog${r.detail ? ` (${r.detail})` : ''}; ${REGISTER_HINT[r.registry]}, and stage the catalog change.`);
  }
  return fails;
}

export function loadAllowlist(root) {
  const f = path.join(root, 'scripts/hooks/wiki-generated-allowlist.txt');
  if (!fs.existsSync(f)) return { exact: new Set(), prefixes: [] };
  const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  return { exact: new Set(lines.filter((l) => !l.endsWith('/'))), prefixes: lines.filter((l) => l.endsWith('/')) };
}

export function checkWikiCode(root, entries) {
  const allow = loadAllowlist(root);
  const fails = [];
  for (const e of entries) {
    if (e.status === 'M' || !e.path.startsWith('wiki/') || !CODE_EXT.test(e.path)) continue;
    if (allow.exact.has(e.path) || allow.prefixes.some((p) => e.path.startsWith(p))) continue;
    fails.push(`${e.path}: console/app code does not belong under wiki/; build it in apps/mtw/ (modules/<id>/) and keep wiki/ to data. If it is a generated projection, list it in scripts/hooks/wiki-generated-allowlist.txt.`);
  }
  return fails;
}

const AGENT_PHRASE = /\bYou are\b|Read (?:AGENTS|CLAUDE)\.md|\b[Dd]o not ask\b|\b[Dd]on't ask\b|\bYour task is\b/;
const LITERALS = [/'((?:[^'\\\n]|\\.)*)'/g, /"((?:[^"\\\n]|\\.)*)"/g, /`((?:[^`\\]|\\.)*)`/g];

export function findPromptLiterals(addedText) {
  const hits = [];
  for (const re of LITERALS) {
    for (const m of addedText.matchAll(re)) {
      if (m[1].length > 160 && AGENT_PHRASE.test(m[1])) hits.push(m[1].slice(0, 60).replace(/\s+/g, ' '));
    }
  }
  return hits;
}

export function checkPrompts(root, entries) {
  const fails = [];
  for (const e of entries) {
    if (!/^apps\/mtw\/.*\.tsx?$/.test(e.path) || /\/tests?\/|\.test\.tsx?$/.test(e.path)) continue;
    const diff = git(root, ['diff', '--cached', '-U0', '--no-color', '--', e.path]);
    const added = diff.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).map((l) => l.slice(1)).join('\n');
    const hits = findPromptLiterals(added);
    if (hits.length) fails.push(`${e.path}: hardcoded agent prompt text ("${hits[0]}..."); put it in wiki/operations/prompts/<module>-<verb>.md or a template and load it.`);
  }
  return fails;
}

/** Every staged maintained wiki page parses with the full routing frontmatter (wiki/graph-schema.md). */
export function checkWikiFrontmatter(root, entries) {
  const fails = [];
  for (const e of entries) {
    if (!isMaintainedPage(e.path)) continue;
    const bytes = stagedBlob(root, e.path);
    if (!bytes) continue;
    try {
      if (!readPage(bytes, e.path, { strict: true })) fails.push(`${e.path}: maintained wiki page without frontmatter; add id, kind, title, load_when, themes, keywords, routes, relations (wiki/graph-schema.md).`);
    } catch (error) { fails.push(`${error.message}; fix the frontmatter (wiki/graph-schema.md).`); }
  }
  return fails;
}

/** A staged wiki page or the graph producer means graph.json and the README index blocks must be current. */
export function checkWikiGraph(root, entries) {
  if (!entries.some((e) => isMaintainedPage(e.path) || e.path === 'scripts/wiki/wiki-graph.mjs' || e.path === 'wiki/graph.json')) return [];
  const r = spawnSync(process.execPath, ['scripts/wiki/wiki-graph.mjs', '--check'], { cwd: root, encoding: 'utf8' });
  return r.status === 0 ? [] : [`${r.stderr.trim() || 'wiki graph check failed'}; run node scripts/wiki/wiki-graph.mjs --write and stage wiki/graph.json and the README index blocks.`];
}

// Local servers use only 8787 (website) and 8788 (Studio) (Matt, 2026-10-11: every other port is obsolete). Launch code,
// skills and maintained guidance may not add a fixed URL, port option or listen() on any other port; tests use port 0.
const PORT_SCOPE = /^(?:site\/(?:scripts|src|integrations|public\/scripts)\/|site\/astro\.config\.mjs$|site\/package\.json$|package\.json$|apps\/|scripts\/|\.claude\/|\.codex\/(?:skills|hooks|agents)\/|wiki\/(?:site|operations)\/|AGENTS\.md$|CLAUDE\.md$)/;
const PORT_EXEMPT = /(?:^|\/)(?:verification|records|fixtures|node_modules|dist[^/]*)\//;
const FIXED_PORT = /(?:(?:localhost|127\.0\.0\.1|0\.0\.0\.0):|\bport\s*[:=]\s*|--port[\s=]+|\bPORT\s*=\s*|\.listen\(\s*)(\d{4,5})\b/gi;

// 8789 is the one exception (Matt, 2026-10-12): the local OAuth sign-in callback for the X API
// (scripts/research/x-bookmarks/auth.mjs), open only for the seconds of a sign-in; it serves nothing.
const ALLOWED_PORTS = new Set(['8787', '8788', '8789']);

export function findStrayPorts(addedText) {
  return [...addedText.matchAll(FIXED_PORT)].filter((m) => !ALLOWED_PORTS.has(m[1])).map((m) => m[0]);
}

export function checkPorts(root, entries) {
  const fails = [];
  for (const e of entries) {
    if (!PORT_SCOPE.test(e.path) || PORT_EXEMPT.test(e.path) || e.path === 'scripts/hooks/hooks.node-test.mjs') continue;
    const diff = git(root, ['diff', '--cached', '-U0', '--no-color', '--', e.path]);
    const hits = findStrayPorts(diff.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).join('\n'));
    if (hits.length) fails.push(`${e.path}: adds "${hits[0]}"; MTW serves only 8787 (website) and 8788 (Studio); 8789 is reserved for the X sign-in callback. Point it at one of those, or use port 0 in a test (wiki/site/build.md).`);
  }
  return fails;
}

// Agent hooks run on every tool call and session stop; a change to them, their settings or their shared reader must
// pass the hook suite, including its time budgets (2026-10-11: a hook took 65 s against a 30 s timeout).
const HOOK_CODE = /^(?:\.claude\/hooks\/|\.codex\/hooks\/|\.claude\/settings\.json$|\.codex\/hooks\.json$|scripts\/hooks\/|scripts\/assets\/media-registration\.mjs$)/;

export function checkHooks(root, entries, env = process.env) {
  if (env.MTW_HOOK_SUITE_RUNNING || !entries.some((e) => HOOK_CODE.test(e.path))) return [];
  if (!fs.existsSync(path.join(root, 'scripts/hooks/hooks.node-test.mjs'))) return [];
  // The suite builds its own temporary repositories; a commit's private index or Git dir must not leak into them.
  const clean = Object.fromEntries(Object.entries(env).filter(([k]) => !k.startsWith('GIT_')));
  const r = spawnSync(process.execPath, ['--test', 'scripts/hooks/hooks.node-test.mjs'], { cwd: root, encoding: 'utf8', env: { ...clean, MTW_HOOK_SUITE_RUNNING: '1' }, maxBuffer: 64 * 1024 * 1024 });
  if (r.status === 0) return [];
  const failed = (r.stdout.match(/^not ok \d+ - .*$/gm) ?? []).slice(0, 3).join('; ');
  return [`agent hook suite failed (${failed || 'see output'}); run node --test scripts/hooks/hooks.node-test.mjs and fix it before committing hook changes.`];
}

/** Run all checks. `env.MTW_HOOKS_SKIP` = comma list of check names or "all"; skips are returned so the caller prints them loudly. */
export function runPreCommit(root, env = process.env) {
  const skip = new Set(String(env.MTW_HOOKS_SKIP ?? '').split(',').map((s) => s.trim()).filter(Boolean));
  const skipped = CHECKS.filter((c) => skip.has(c) || skip.has('all'));
  const unknown = [...skip].filter((s) => s !== 'all' && !CHECKS.includes(s));
  const entries = stagedEntries(root);
  const readText = stagedReader(root);
  const run = {
    parity: () => checkParity(root, entries),
    media: () => checkMedia(root, entries, readText),
    'wiki-code': () => checkWikiCode(root, entries),
    prompts: () => checkPrompts(root, entries),
    'wiki-frontmatter': () => checkWikiFrontmatter(root, entries),
    'wiki-graph': () => checkWikiGraph(root, entries),
    ports: () => checkPorts(root, entries),
    hooks: () => checkHooks(root, entries, env),
  };
  const failures = [];
  for (const name of CHECKS) {
    if (skipped.includes(name)) continue;
    for (const message of run[name]()) failures.push({ check: name, message });
  }
  return { failures, skipped, unknown };
}
