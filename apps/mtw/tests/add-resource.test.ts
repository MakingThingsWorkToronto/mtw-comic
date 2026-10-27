// Add forms: the shared operations-add-resource procedure, the per-kind specs, validation and launch parameters.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePrompt, renderPrompt, subjectOf, validateParams } from '../server/core/prompts';
import { loadTemplate } from '../server/core/templates';
import { ADD_KINDS, ADD_OPERATION, ADD_SPECS, BRIEF_MAX, addSubject, buildAddLaunch, initialValues, listItems, modeOf, oneLine, slug, validateAdd } from '../web/addResource';
import type { AddKind } from '../web/addResource';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const prompt = (id: string) => parsePrompt(readFileSync(path.join(REPO, 'wiki', 'operations', 'prompts', `${id}.md`), 'utf8'), `${id}.md`);
const parsed = prompt(ADD_OPERATION);

const valid: Record<AddKind, Record<string, string>> = {
  image: { name: 'Operator desk at night', brief: 'A holographic desk scene\nfor the Home hero.', collection: 'scenes', style: 'holographic', options: '2', use: '', sources: 'img:home-desk@v2\nhttps://example.com/ref.png' },
  track: { name: 'Slow synth build', brief: 'Home hero bed', mood: 'calm', length: '', options: '3', sources: '' },
  'journal-candidate': { name: 'Measuring agents can slow their work', brief: 'What happened.', category: 'Agentic Systems', event: '', counter: '', sources: '' },
  character: { name: '', brief: 'A night-shift operator who finds the stuck queue.', role: 'operator', issue: 'home', look: '', voice: '', sources: '' },
};

describe('operations-add-resource procedure', () => {
  it('parses, with a kind select matching every Add kind, idleMinutes and a subject the run is found by', () => {
    expect(parsed.def.id).toBe(ADD_OPERATION);
    expect(parsed.def.idleMinutes).toBeGreaterThan(0);
    const kind = parsed.def.params.find((p) => p.name === 'kind');
    expect(kind?.type).toBe('select');
    expect(kind?.options).toEqual([...ADD_KINDS]);
    expect(Object.keys(ADD_SPECS).sort()).toEqual([...ADD_KINDS].sort());
    expect(parsed.def.params.some((p) => p.type === 'asset')).toBe(false);
  });

  it('accepts the launch parameters of every shared-procedure mode and finds the run by its subject', () => {
    for (const kind of ADD_KINDS) {
      const { operation, params } = buildAddLaunch(kind, undefined, valid[kind]);
      expect(operation).toBe(ADD_OPERATION);
      expect(() => validateParams(parsed.def, params)).not.toThrow();
      for (const key of Object.keys(params)) expect(parsed.def.params.map((p) => p.name)).toContain(key);
      expect(subjectOf(parsed.def, params)).toEqual({ subject: params.subject });
      for (const v of Object.values(params)) expect(v).not.toMatch(/\n/);
    }
  });

  it('keeps the whole prefix before "## This run" byte-identical across kinds (prompt caching)', () => {
    const a = renderPrompt(parsed, buildAddLaunch('image', 'generate', valid.image).params, REPO);
    const b = renderPrompt(parsed, buildAddLaunch('journal-candidate', undefined, valid['journal-candidate']).params, REPO);
    const ia = a.indexOf('## This run');
    const ib = b.indexOf('## This run');
    expect(ia).toBeGreaterThan(0);
    expect(a.slice(0, ia)).toBe(b.slice(0, ib));
    expect(a.slice(ia)).toContain('Collection: scenes; Style: holographic; Options: 2');
    expect(a.slice(0, ia)).not.toContain('Operator desk');
    expect(parsed.body).not.toMatch(/\{\{\w+\}\}/);
  });

  it('waits for Matt\'s yes before any paid request or library write, uses Codex for images and never commits', () => {
    const body = parsed.body;
    expect(body).toMatch(/ask Matt to reply `yes`/);
    expect(body).toMatch(/Do nothing further until he does: no provider request/);
    expect(body.indexOf('Plan and ask')).toBeLessThan(body.indexOf('Produce only the approved plan'));
    expect(body).toContain('scripts/assets/check-asset-destination.mjs');
    expect(body).toMatch(/only by Codex through the Codex CLI/);
    expect(body).toMatch(/maintained producer/);
    expect(body).toMatch(/Never run `git add`, `git commit`, `git push`/);
    expect(body).toContain('discussion/handoff/STATUS.md');
  });

  it('has a stable per-kind section in the add-resource-kinds template for every kind', () => {
    const t = loadTemplate(REPO, 'add-resource-kinds');
    for (const kind of ADD_KINDS) expect(t.body).toContain(`\n## ${kind}\n`);
  });
});

describe('modes that reuse an existing procedure', () => {
  it('send only parameters the target procedure declares, with every required one filled', () => {
    const cases: [AddKind, string, Record<string, string>][] = [
      ['image', 'register', { paths: 'wiki/image-library/assets/scenes/a-v2.png\nwiki/image-library/assets/scenes/b.png', record: '', style: '', collection: 'scenes', note: 'from Codex' }],
      ['track', 'downloads', { files: 'all new in Downloads' }],
    ];
    for (const [kind, mode, values] of cases) {
      const { operation, params } = buildAddLaunch(kind, mode, values);
      expect(operation).not.toBe(ADD_OPERATION);
      const def = prompt(operation).def;
      expect(() => validateParams(def, params)).not.toThrow();
      for (const key of Object.keys(params)) expect(def.params.map((p) => p.name)).toContain(key);
    }
    expect(buildAddLaunch('image', 'register', cases[0]![2]).params.paths).toBe('wiki/image-library/assets/scenes/a-v2.png; wiki/image-library/assets/scenes/b.png');
  });

  it('every mode names a procedure that exists', () => {
    for (const kind of ADD_KINDS) for (const m of ADD_SPECS[kind].modes) expect(() => prompt(m.operation)).not.toThrow();
  });
});

describe('validation helpers', () => {
  it('requires the required fields and reports them by name', () => {
    const errors = validateAdd(modeOf('image'), initialValues(modeOf('image')));
    expect(Object.keys(errors).sort()).toEqual(['brief', 'collection', 'name', 'style']);
    expect(errors.name).toMatch(/required/);
    expect(validateAdd(modeOf('image'), valid.image)).toEqual({});
  });

  it('rejects values outside a select, over-long text and image paths outside the library', () => {
    expect(validateAdd(modeOf('image'), { ...valid.image, style: '3d' }).style).toMatch(/one of/);
    expect(validateAdd(modeOf('image'), { ...valid.image, brief: 'x'.repeat(BRIEF_MAX + 1) }).brief).toMatch(/characters or fewer/);
    const reg = modeOf('image', 'register');
    expect(validateAdd(reg, { paths: 'discussion/x.png' }).paths).toMatch(/wiki\/image-library\/assets/);
    expect(validateAdd(reg, { paths: 'wiki/image-library/assets/../x.png' }).paths).toBeDefined();
    expect(validateAdd(reg, { paths: 'wiki\\image-library\\assets\\scenes\\a.png' })).toEqual({});
  });

  it('honours a module\'s live select options', () => {
    const mode = modeOf('image');
    expect(validateAdd(mode, { ...valid.image, collection: 'new-shelf' }).collection).toBeDefined();
    expect(validateAdd(mode, { ...valid.image, collection: 'new-shelf' }, { collection: ['new-shelf'] })).toEqual({});
  });

  it('lets a character go unnamed and still gives the run a subject', () => {
    expect(validateAdd(modeOf('character'), valid.character)).toEqual({});
    const { params } = buildAddLaunch('character', undefined, valid.character);
    expect(params.name).toBeUndefined();
    expect(params.subject).toBe('add:character:a-night-shift-operator-who-finds-the-stuck-queue');
    expect(params.details).toBe('Role: operator; Issue: home');
  });

  it('builds compact one-line values', () => {
    expect(oneLine('  a\n\n b\tc ')).toBe('a b c');
    expect(listItems('a\n b ; c\r\n\n')).toEqual(['a', 'b', 'c']);
    expect(slug('  Measuring Agents: can SLOW their work!  ')).toBe('measuring-agents-can-slow-their-work');
    expect(addSubject('track', '', '')).toBe('add:track:untitled');
    const { params } = buildAddLaunch('image', 'generate', valid.image);
    expect(params).toEqual({
      kind: 'image',
      name: 'Operator desk at night',
      brief: 'A holographic desk scene for the Home hero.',
      details: 'Collection: scenes; Style: holographic; Options: 2',
      sources: 'img:home-desk@v2; https://example.com/ref.png',
      subject: 'add:image:operator-desk-at-night',
    });
  });

  it('refuses to build a launch from invalid input', () => {
    expect(() => buildAddLaunch('journal-candidate', undefined, { name: 'x' })).toThrow(/required/);
  });
});
