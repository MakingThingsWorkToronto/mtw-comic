import { afterAll, describe, expect, it } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { loadRunners } from '../server/core/runners';
import { PromptOperations, parseFrontmatter, parsePrompt, renderPrompt, validateParams } from '../server/core/prompts';
import { renderTemplate } from '../server/core/templates';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const SAMPLE = `---
id: asset-destination-check
title: Check an asset destination
module: operations
runner: claude
skill: mtw-soundtrack
params:
  - name: type
    label: Asset type
    type: select
    options: [image, journal, audio, comic]
    required: true
  - name: path
    label: Destination path
    type: text
    required: true
---
Run the checker.

Report the result.
`;

describe('parseFrontmatter', () => {
  it('parses scalars, inline lists and list-of-map items', () => {
    const { data, body } = parseFrontmatter(SAMPLE);
    expect(data.id).toBe('asset-destination-check');
    expect(data.runner).toBe('claude');
    const params = data.params as Record<string, unknown>[];
    expect(params).toHaveLength(2);
    expect(params[0]).toMatchObject({ name: 'type', type: 'select', options: ['image', 'journal', 'audio', 'comic'], required: true });
    expect(params[1]).toMatchObject({ name: 'path', required: true });
    expect(body.startsWith('Run the checker.')).toBe(true);
  });

  it('handles CRLF and files with no frontmatter', () => {
    expect(parseFrontmatter(SAMPLE.replace(/\n/g, '\r\n')).data.id).toBe('asset-destination-check');
    expect(parseFrontmatter('just text')).toEqual({ data: {}, body: 'just text' });
  });
});

describe('parsePrompt', () => {
  it('builds an OperationDef and rejects bad frontmatter by source name', () => {
    const { def, body } = parsePrompt(SAMPLE);
    expect(def).toMatchObject({ id: 'asset-destination-check', module: 'operations', runner: 'claude', skill: 'mtw-soundtrack' });
    expect(body).toContain('Report the result.');
    expect(() => parsePrompt('---\nid: Bad Id\ntitle: x\nmodule: m\nrunner: claude\n---\nbody', 'bad.md')).toThrow(/bad\.md/);
    // Runner ids are data rows in runners.json (checked at launch), so any non-empty id parses; a missing one does not.
    expect(() => parsePrompt('---\nid: ok\ntitle: x\nmodule: m\n---\nbody')).toThrow(/runner/);
  });
});

describe('renderPrompt / validateParams', () => {
  it('puts the stable body first and a final "This run" section with the params', () => {
    const parsed = parsePrompt(SAMPLE);
    const text = renderPrompt(parsed, { type: 'audio', path: 'wiki/soundtrack-library/x.mp3' }, REPO);
    expect(text.startsWith('Run the checker.')).toBe(true);
    const idx = text.indexOf('## This run');
    expect(idx).toBeGreaterThan(text.indexOf('Report the result.'));
    expect(text.slice(idx)).toContain('- Asset type (type): audio');
    expect(text.slice(idx)).toContain('- Destination path (path): wiki/soundtrack-library/x.mp3');
    expect(text.trimEnd().endsWith('x.mp3')).toBe(true);
    expect(text.slice(idx)).toContain('- Operation id (operation id): asset-destination-check');
  });

  it('orders body, then the stable contribution block, then "This run" last', () => {
    const parsed = parsePrompt(SAMPLE);
    const a = renderPrompt(parsed, { type: 'audio', path: 'a.mp3' }, REPO);
    const b = renderPrompt(parsed, { type: 'image', path: 'b.png' }, REPO);
    const body = a.indexOf('Report the result.');
    const contrib = a.indexOf('## Contribute what you learned');
    const run = a.indexOf('## This run');
    expect(body).toBeGreaterThan(-1);
    expect(contrib).toBeGreaterThan(body);
    expect(run).toBeGreaterThan(contrib);
    expect(a.slice(contrib)).toContain('Contributed:');
    expect(a.slice(contrib)).toContain('BOTH');
    expect(a.indexOf('## This run', run + 1)).toBe(-1);
    // Everything before "## This run" is identical across runs: that is the cached prefix.
    expect(a.slice(0, run)).toBe(b.slice(0, b.indexOf('## This run')));
  });

  it('requires required params and valid select options', () => {
    const { def } = parsePrompt(SAMPLE);
    expect(() => validateParams(def, { type: 'audio' })).toThrow(/path/);
    expect(() => validateParams(def, { type: 'video', path: 'a' })).toThrow(/one of/);
    expect(() => validateParams(def, { type: 'audio', path: 'a' })).not.toThrow();
  });
});

describe('prompt templates', () => {
  it('reads the handover line from wiki/operations/templates/handover.md', () => {
    const line = renderTemplate(REPO, 'handover', { title: 'Check', promptPath: 'C:/x/prompt.md' });
    expect(line).toContain('C:/x/prompt.md');
    expect(line).not.toContain('{{');
    expect(/[\r\n]/.test(line)).toBe(false);
  });
});

const MODELS = [
  'models:',
  '  - runner: claude',
  '    model: claude-sonnet-5-5',
  '    effort: medium',
  '  - runner: codex',
  '    model: gpt-6.1-sol',
  '    effort: high',
  '',
].join('\n');
const entry = (runner: string, model: string, effort: string) => `  - runner: ${runner}\n    model: ${model}\n    effort: ${effort}\n`;
const withModels = (block: string) => `---\nid: m-op\ntitle: M\nmodule: operations\nrunner: claude\n${block}---\nbody\n`;

describe('procedure models frontmatter', () => {
  const runners = loadRunners(REPO);
  it('parses one entry per runner', () => {
    const { def } = parsePrompt(withModels(MODELS), 'm.md', runners);
    expect(def.models).toEqual([
      { runner: 'claude', model: 'claude-sonnet-5-5', effort: 'medium' },
      { runner: 'codex', model: 'gpt-6.1-sol', effort: 'high' },
    ]);
  });
  it('reports a repeated runner, an unknown model and an unknown effort as problems', () => {
    expect(() => parsePrompt(withModels(MODELS + entry('claude', 'claude-opus-5-5', 'high')), 'm.md', runners)).toThrow(/more than once/);
    expect(() => parsePrompt(withModels('models:\n' + entry('claude', 'nope', 'low')), 'm.md', runners)).toThrow(/not a claude model/);
    expect(() => parsePrompt(withModels('models:\n' + entry('codex', 'gpt-6.1-sol', 'max')), 'm.md', runners)).toThrow(/not a codex effort/);
  });
});

describe('shipped procedures', () => {
  it('each has a valid models block: one entry per runner, model and effort from runners.json', () => {
    const runners = loadRunners(REPO);
    const dir = path.join(REPO, 'wiki', 'operations', 'prompts');
    for (const f of readdirSync(dir).filter((n) => n.endsWith('.md'))) {
      const { def } = parsePrompt(readFileSync(path.join(dir, f), 'utf8'), f, runners);
      expect(def.models?.map((m) => m.runner).sort(), f).toEqual(['claude', 'codex']);
    }
  });
});

describe('PromptOperations.launch model resolution', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'mtw-models-'));
  mkdirSync(path.join(root, 'wiki', 'operations', 'prompts'), { recursive: true });
  cpSync(path.join(REPO, 'wiki', 'operations', 'runners.json'), path.join(root, 'wiki', 'operations', 'runners.json'));
  cpSync(path.join(REPO, 'wiki', 'operations', 'templates'), path.join(root, 'wiki', 'operations', 'templates'), { recursive: true });
  const promptFile = path.join(root, 'wiki', 'operations', 'prompts', 'm-op.md');
  writeFileSync(promptFile, withModels(MODELS));
  const spawned: { runner: string; model?: string; effort?: string }[] = [];
  const terminals = { spawn: (o: { runner: string; model?: string; effort?: string }) => { spawned.push(o); return { id: 't' }; } } as never;
  const ops = new PromptOperations(root, terminals);
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it('with no choice (how schedules launch) uses the frontmatter entry for the runner', async () => {
    await ops.launch('m-op', {});
    await ops.launch('m-op', {}, 'codex', 'default');
    expect(spawned[0]).toMatchObject({ runner: 'claude', model: 'claude-sonnet-5-5', effort: 'medium' });
    expect(spawned[1]).toMatchObject({ runner: 'codex', model: 'gpt-6.1-sol', effort: 'high' });
  });
  it('an explicit choice overrides it, field by field', async () => {
    await ops.launch('m-op', {}, 'claude', undefined, undefined, { model: 'claude-opus-5-5' });
    expect(spawned[2]).toMatchObject({ model: 'claude-opus-5-5', effort: 'medium' });
    await ops.launch('m-op', {}, 'claude', undefined, undefined, { effort: 'max' });
    expect(spawned[3]).toMatchObject({ model: 'claude-sonnet-5-5', effort: 'max' });
  });
  it('refuses a model that runners.json lists under another provider, but allows an unlisted typed id', async () => {
    writeFileSync(promptFile, withModels(MODELS));
    const before = spawned.length;
    await expect(ops.launch('m-op', {}, 'codex', undefined, undefined, { model: 'claude-opus-5-5' })).rejects.toThrow(/Claude model.*cannot run in Codex/);
    await expect(ops.launch('m-op', {}, 'claude', undefined, undefined, { model: 'gpt-6.1-sol' })).rejects.toThrow(/Codex model.*cannot run in Claude/);
    expect(spawned).toHaveLength(before);
    await ops.launch('m-op', {}, 'claude', undefined, undefined, { model: 'my-custom-model-id' });
    expect(spawned[before]).toMatchObject({ runner: 'claude', model: 'my-custom-model-id' });
  });
  it('leaves model and effort unset when the procedure has no entry, so the studio default applies', async () => {
    writeFileSync(promptFile, withModels(''));
    await ops.launch('m-op', {});
    expect(spawned[spawned.length - 1]!.model).toBeUndefined();
  });
});
