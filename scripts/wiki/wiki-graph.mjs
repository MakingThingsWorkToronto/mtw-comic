import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const relationTypes = new Set(['depends_on', 'supports', 'contradicts', 'supersedes', 'derived_from']);
// Vocabulary. wiki/graph-schema.md names every literal; its test keeps page and code equal.
export const KINDS = new Set(['index', 'knowledge', 'workflow', 'rules', 'log', 'status']);
export const THEMES = new Set(['site', 'copy', 'design', 'motion', 'images', 'diagrams', 'tours', 'comics', 'audio', 'journal', 'contact', 'discoverability', 'deployment', 'studio', 'operations', 'workflows', 'experience', 'competitors', 'research', 'project', 'wiki']);
const FIELDS = ['id', 'kind', 'title', 'load_when', 'themes', 'keywords', 'routes', 'relations'];
const KEYWORD_RE = /^[a-z0-9][a-z0-9 ._\/-]{1,40}$/;
const ROUTE_RE = /^\/(?:[a-z0-9-]+\/?)*\*?$/;
// Every maintained page must carry load_when and themes. Flip to false only during a staged rollout.
export const STRICT = true;
const portable = value => value.split(path.sep).join('/');

// A deliberately small YAML subset: one field per line, with JSON values.
// JSON strings/arrays are valid YAML; no library-specific tags or implicit dates.
export function readPage(bytes, filename, { strict = STRICT } = {}) {
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) bytes = bytes.subarray(3);
  if (!bytes.subarray(0, 4).equals(Buffer.from('---\n')) && !bytes.subarray(0, 5).equals(Buffer.from('---\r\n'))) return null;
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`${filename}: unterminated frontmatter`);
  const metadata = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([a-z_]+): (.+)$/);
    if (!field || Object.hasOwn(metadata, field[1])) throw new Error(`${filename}: invalid/duplicate field`);
    try { metadata[field[1]] = JSON.parse(field[2]); } catch (error) { throw new Error(`${filename}: field ${field[1]} is not JSON (${error.message})`); }
  }
  if (Object.keys(metadata).some(key => !FIELDS.includes(key))) throw new Error(`${filename}: unknown field`);
  if (typeof metadata.id !== 'string' || !/^wiki:[a-zA-Z0-9/_-]+$/.test(metadata.id)) throw new Error(`${filename}: invalid id`);
  if (!KINDS.has(metadata.kind) || typeof metadata.title !== 'string' || !metadata.title.trim() || !Array.isArray(metadata.relations)) throw new Error(`${filename}: missing kind/title/relations`);
  const requireRouting = strict && metadata.kind !== 'log';
  if (metadata.load_when !== undefined && (typeof metadata.load_when !== 'string' || !metadata.load_when.trim())) throw new Error(`${filename}: invalid load_when`);
  if (requireRouting && metadata.load_when === undefined) throw new Error(`${filename}: missing load_when`);
  if (metadata.themes !== undefined && (!Array.isArray(metadata.themes) || metadata.themes.some(theme => !THEMES.has(theme)) || new Set(metadata.themes).size !== metadata.themes.length)) throw new Error(`${filename}: invalid themes`);
  if (requireRouting && !(metadata.themes?.length > 0)) throw new Error(`${filename}: missing themes`);
  metadata.themes ??= [];
  metadata.keywords ??= [];
  if (!Array.isArray(metadata.keywords) || metadata.keywords.some(keyword => typeof keyword !== 'string' || !KEYWORD_RE.test(keyword)) || new Set(metadata.keywords).size !== metadata.keywords.length) throw new Error(`${filename}: invalid keywords`);
  metadata.routes ??= [];
  if (!Array.isArray(metadata.routes) || metadata.routes.some(route => typeof route !== 'string' || !ROUTE_RE.test(route)) || new Set(metadata.routes).size !== metadata.routes.length) throw new Error(`${filename}: invalid routes`);
  for (const relation of metadata.relations) {
    if (!relation || Object.keys(relation).some(key => !['type', 'target', 'reason', 'evidence'].includes(key)) || !relationTypes.has(relation.type) || typeof relation.target !== 'string' || typeof relation.reason !== 'string' || !relation.reason.trim()) throw new Error(`${filename}: invalid reasoning relation`);
    if (relation.evidence !== undefined && (!Array.isArray(relation.evidence) || relation.evidence.some(item => typeof item !== 'string' || !item))) throw new Error(`${filename}: invalid evidence`);
  }
  return { ...metadata, body: text.slice(match[0].length) };
}

// MTW Studio procedure and prompt templates are operation data with their own YAML frontmatter, not knowledge pages.
// Folders whose files carry another tool's frontmatter (Studio procedure data; LLM column drafts written by the llm-column skill): source records, never pages.
const operationData = new Set([...['prompts', 'templates'].map(name => path.join('operations', name)), path.join('journal', 'llm-column', 'drafts')]);
// Archived skill packages (copied .claude/.codex folders inside library records) are source records, never pages.
export const WALK_SKIP_DIRS = new Set(['.claude', '.codex', '__pycache__', 'node_modules']);
// Search and index walks also skip media folders; wiki_read by exact path still reaches any page.
export const SERVED_WALK_SKIP_DIRS = new Set([...WALK_SKIP_DIRS, 'assets']);

function markdownFiles(directory, wikiRoot = directory, skip = WALK_SKIP_DIRS) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) return [];
    if (entry.isDirectory() && (operationData.has(path.relative(wikiRoot, filename)) || skip.has(entry.name))) return [];
    return entry.isDirectory() ? markdownFiles(filename, wikiRoot, skip) : entry.isFile() && entry.name.endsWith('.md') ? [filename] : [];
  }).sort();
}

// Source records keep their own bytes, may carry foreign frontmatter and are never maintained pages (wiki/wiki-rules.md rule 2).
export const SOURCE_RECORD_RE = /^wiki\/(?:journal\/(?:entries|interviews|candidates)\/(?!README\.md$)|journal\/signals\/|journal\/llm-column\/(?:drafts|conversations)\/|.*\/records\/(?!README\.md$)|.*\/assets\/|operations\/(?:prompts|templates)\/|experience\/(?:resume-full|projects-list)\.md$|journal\/console\/)/;
export const isSourceRecord = relative => SOURCE_RECORD_RE.test(relative);

// Repo-relative posix paths of every candidate wiki page.
export function wikiMarkdownFiles(root = repoRoot, skip = WALK_SKIP_DIRS) {
  return markdownFiles(path.join(root, 'wiki'), path.join(root, 'wiki'), skip).map(filename => portable(path.relative(root, filename)));
}

export function loadPages(root = repoRoot, pageOverrides = new Map()) {
  return wikiMarkdownFiles(root).flatMap(relative => {
    if (isSourceRecord(relative)) return [];
    const page = readPage(pageOverrides.get(relative) ?? fs.readFileSync(path.join(root, relative)), relative);
    return page ? [{ ...page, path: relative }] : [];
  });
}

export function buildGraph(root = repoRoot, pageOverrides = new Map()) {
  const pages = loadPages(root, pageOverrides);
  const byId = new Map(), byPath = new Map();
  for (const page of pages) {
    if (byId.has(page.id)) throw new Error(`Duplicate id: ${page.id}`);
    byId.set(page.id, page); byPath.set(page.path, page);
  }
  const nodes = new Map(pages.map(({ body, relations, ...page }) => [page.id, page]));
  const edges = [], unresolvedLinks = [];
  function reference(source, target, projection = false) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(target)) {
      if (!/^https?:\/\//i.test(target)) throw new Error(`${source}: unsupported reference ${target}`);
      if (!projection && !/^https:\/\//i.test(target)) throw new Error(`${source}: evidence URL must use HTTPS`);
      const id = `url:${target}`;
      nodes.set(id, { id, kind: 'reference', url: target }); return id;
    }
    const decoded = decodeURIComponent(target.replace(/^<|>$/g, '').split('#')[0]);
    const resolved = path.resolve(root, path.dirname(source), decoded || path.basename(source));
    const relative = portable(path.relative(root, resolved));
    if (relative.startsWith('../') || path.isAbsolute(relative)) throw new Error(`${source}: reference outside repo: ${target}`);
    if (!fs.existsSync(resolved) && !(projection && relative === 'wiki/graph.json')) throw new Error(`${source}: missing reference ${target}`);
    if (byPath.has(relative)) return byPath.get(relative).id;
    const id = `file:${relative}`;
    nodes.set(id, { id, kind: 'reference', path: relative }); return id;
  }
  for (const page of pages) {
    for (const relation of page.relations) {
      if (!byId.has(relation.target)) throw new Error(`${page.path}: unknown relation target ${relation.target}`);
      const evidence = (relation.evidence ?? []).map(target => reference(page.path, target));
      edges.push({ from: page.id, to: relation.target, type: relation.type, reason: relation.reason, ...(evidence.length ? { evidence } : {}) });
    }
    const prose = page.body.replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, '');
    for (const match of prose.matchAll(/\[[^\]]*\]\((<[^>]+>|[^)\s]+)\)/g)) {
      if (match[1].startsWith('#')) continue;
      try { edges.push({ from: page.id, to: reference(page.path, match[1], true), type: 'links_to' }); }
      catch (error) { unresolvedLinks.push({ from: page.id, target: match[1], error: error.message }); }
    }
  }
  const uniqueEdges = [...new Map(edges.map(edge => [JSON.stringify(edge), edge])).values()];
  return { version: 2, nodes: [...nodes.values()].sort((a, b) => a.id.localeCompare(b.id, 'en')), edges: uniqueEdges.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b), 'en')), unresolvedLinks: unresolvedLinks.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b), 'en')) };
}

export function neighborhood(graph, id) {
  const node = graph.nodes.find(candidate => candidate.id === id);
  if (!node) throw new Error(`Unknown node: ${id}`);
  return { node, outgoing: graph.edges.filter(edge => edge.from === id), incoming: graph.edges.filter(edge => edge.to === id) };
}

// Index blocks. A README renders the pages it routes between these markers; prose outside them is hand-authored.
//   <!-- wiki-index:begin pages -->    every maintained page whose nearest ancestor README is this file
//   <!-- wiki-index:begin folders -->  (wiki/README.md) root pages, then one entry per top-level folder README
//   <!-- wiki-index:begin skills -->   one entry per .claude/skills/*/SKILL.md, from its description
const BLOCK_RE = /<!-- wiki-index:begin (pages|folders|skills) -->\r?\n([\s\S]*?)<!-- wiki-index:end -->/g;

// fromDirectory is the README's repo-relative posix directory, e.g. "wiki/site".
export function indexEntry(fromDirectory, page) {
  const target = path.posix.relative(fromDirectory, page.path) || path.posix.basename(page.path);
  const trigger = page.load_when ? page.load_when.trim().replace(/\.?$/, '.') : 'No trigger recorded.';
  const tail = [page.keywords.length ? ` Keywords: ${page.keywords.join(', ')}.` : '', page.themes.length ? ` Themes: ${page.themes.join(', ')}.` : ''].join('');
  return `- [${page.title}](${target}) — Load when: ${trigger}${tail}`;
}

export function skillEntries(root, fromDirectory) {
  const skillsRoot = path.join(root, '.claude/skills');
  if (!fs.existsSync(skillsRoot)) return [];
  return fs.readdirSync(skillsRoot, { withFileTypes: true }).filter(entry => entry.isDirectory()).flatMap(entry => {
    const skillPath = path.join(skillsRoot, entry.name, 'SKILL.md');
    if (!fs.existsSync(skillPath)) return [];
    const description = fs.readFileSync(skillPath, 'utf8').match(/^description:\s*(.+?)\s*$/m)?.[1]?.replace(/^(["'])(.*)\1$/, '$2');
    const target = path.posix.relative(fromDirectory, `.claude/skills/${entry.name}/SKILL.md`);
    return [`- [${entry.name}](${target}) — Load when: ${description ?? 'No description recorded.'}`];
  }).sort((a, b) => a.localeCompare(b, 'en'));
}

export function renderIndexes(root = repoRoot, pageOverrides = new Map()) {
  const pages = loadPages(root, pageOverrides);
  const readmes = new Map(pages.filter(page => path.basename(page.path) === 'README.md').map(page => [path.posix.dirname(page.path), page]));
  function owningReadme(page) {
    let directory = path.posix.dirname(page.path);
    while (directory !== 'wiki' && directory !== '.') {
      if (readmes.has(directory) && readmes.get(directory).path !== page.path) return readmes.get(directory);
      directory = path.posix.dirname(directory);
    }
    return readmes.get('wiki');
  }
  const routed = new Map();
  for (const page of pages) {
    const owner = owningReadme(page);
    if (!owner || owner.path === page.path) continue;
    const list = routed.get(owner.path) ?? [];
    list.push(page); routed.set(owner.path, list);
  }
  const outputs = new Map();
  for (const readme of readmes.values()) {
    const directory = path.posix.dirname(readme.path);
    const absoluteDirectory = directory; // repo-relative posix
    const original = (pageOverrides.get(readme.path) ?? fs.readFileSync(path.join(root, readme.path))).toString('utf8');
    const eol = original.includes('\r\n') ? '\r\n' : '\n';
    const rendered = original.replace(BLOCK_RE, (whole, kind) => {
      let entries;
      if (kind === 'skills') entries = skillEntries(root, absoluteDirectory);
      else if (kind === 'folders') {
        const topLevel = [...readmes.values()].filter(other => other.path !== readme.path && path.posix.dirname(path.posix.dirname(other.path)) === directory);
        const rootPages = (routed.get(readme.path) ?? []).filter(page => path.posix.dirname(page.path) === directory);
        entries = [...rootPages, ...topLevel].sort((a, b) => a.path.localeCompare(b.path, 'en')).map(page => indexEntry(absoluteDirectory, page));
      } else {
        const here = (routed.get(readme.path) ?? []).filter(page => directory !== 'wiki' || path.posix.dirname(page.path) !== 'wiki');
        const nested = directory === 'wiki' ? [] : [...readmes.values()].filter(other => other.path !== readme.path && owningReadme(other)?.path === readme.path);
        entries = [...new Map([...here, ...nested].map(page => [page.path, page])).values()].sort((a, b) => a.path.localeCompare(b.path, 'en')).map(page => indexEntry(absoluteDirectory, page));
      }
      return `<!-- wiki-index:begin ${kind} -->${eol}${entries.map(entry => entry + eol).join('')}<!-- wiki-index:end -->`;
    });
    if (rendered !== original) outputs.set(readme.path, rendered);
  }
  return outputs;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [mode, id, ...rest] = process.argv.slice(2);
    if (rest.length || !['--write', '--check', '--node'].includes(mode) || (mode === '--node' ? !id : id !== undefined)) throw new Error('Usage: node scripts/wiki/wiki-graph.mjs <--write|--check|--node wiki:id>');
    const graph = buildGraph(), output = `${JSON.stringify(graph, null, 2)}\n`, destination = path.join(repoRoot, 'wiki/graph.json');
    const indexes = mode === '--node' ? new Map() : renderIndexes();
    if (mode === '--write') {
      for (const [relative, text] of indexes) fs.writeFileSync(path.join(repoRoot, relative), text);
      fs.writeFileSync(destination, output);
    } else if (mode === '--check') {
      if (indexes.size) throw new Error(`stale index blocks in ${[...indexes.keys()].join(', ')}; run --write`);
      if (!fs.existsSync(destination) || fs.readFileSync(destination, 'utf8') !== output) throw new Error('wiki/graph.json is stale; run --write');
    }
    if (mode === '--node') process.stdout.write(`${JSON.stringify(neighborhood(graph, id), null, 2)}\n`);
    else process.stdout.write(`${JSON.stringify({ pages: graph.nodes.filter(node => node.kind !== 'reference').length, references: graph.nodes.filter(node => node.kind === 'reference').length, reasoningEdges: graph.edges.filter(edge => edge.type !== 'links_to').length, links: graph.edges.filter(edge => edge.type === 'links_to').length, unresolvedLinks: graph.unresolvedLinks.length, indexesWritten: mode === '--write' ? indexes.size : undefined })}\n`);
  } catch (error) { process.stderr.write(`FAIL ${error.message}\n`); process.exitCode = 1; }
}
