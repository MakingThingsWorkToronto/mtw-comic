import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parsePrompt, renderPrompt, subjectOf } from '../server/core/prompts';
import {
  BALLOON_KINDS, INSERT_OPERATION, MOTION_PRESETS, PARAM_ORDER, ROOM_TONES, SFX_KINDS, boxParams, boxPositions, insertRunFor, insertRuns, insertSubject,
  lineWarnings, parseInsertSubject, sceneParams, scenePositions, speakersOf, splitPosition, validateBox, validateScene,
} from '../modules/comics/client/insert';
import type { BoxForm, SceneForm } from '../modules/comics/client/insert';
import type { TerminalInfo } from '../modules/types';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)), '..', '..');
const procedureText = () => readFileSync(path.join(repoRoot, 'wiki', 'operations', 'prompts', `${INSERT_OPERATION}.md`), 'utf8');

const scene = (over: Partial<SceneForm> = {}): SceneForm => ({
  issue: 'home', where: 'after', anchor: 'agent', id: 'late-quote', title: 'The late quote', purpose: 'Matt finds  the\nwrong desk count.', room: 'office', characters: ['matt', 'claude'],
  boxes: 3, score: '0.25', sfx: ['paper', 'keys'], soundIdeas: '', art: 'Night office.', refs: ['img:comic-b-model-matt', ''], ...over,
});
const box = (over: Partial<BoxForm> = {}): BoxForm => ({
  issue: 'home', scene: 'agent', where: 'after', box: 2, happens: 'Claude reads the quote table.', characters: ['claude', 'matt'],
  lines: [{ speaker: 'claude', kind: 'speech', text: 'The desk count is wrong.' }, { speaker: '', kind: 'caption', text: 'Tuesday, 11 pm.' }],
  surfaces: [{ object: 'laptop', camera: 'front', reader: 'claude', shows: 'the quote table with the desk count highlighted' }],
  sfx: ['keys'], motion: 'push', motionNote: '', art: '', refs: [], ...over,
});

describe('comics-insert procedure', () => {
  it('parses as one shared claude procedure that closes after an hour idle, with the params in the client order', () => {
    const { def } = parsePrompt(procedureText(), INSERT_OPERATION);
    expect(def).toMatchObject({ id: INSERT_OPERATION, module: 'comics', runner: 'claude', skill: 'mtw-comic-story', idleMinutes: 60 });
    expect(def.params.map((p) => p.name)).toEqual([...PARAM_ORDER]);
    expect(def.params.find((p) => p.name === 'kind')).toMatchObject({ type: 'select', options: ['scene', 'box'] });
  });
  it('keeps the body identical across runs: every form value lands only in the final "This run" section', () => {
    const parsed = parsePrompt(procedureText(), INSERT_OPERATION);
    const a = renderPrompt(parsed, sceneParams(scene()), repoRoot);
    const b = renderPrompt(parsed, boxParams(box()), repoRoot);
    const cut = (t: string) => t.slice(0, t.lastIndexOf('## This run'));
    expect(cut(a)).toBe(cut(b));
    expect(cut(a)).not.toContain('late-quote');
    expect(a.slice(a.lastIndexOf('## This run'))).toContain('late-quote');
  });
  it('the body names the ownership, Codex, destination, registration and no-commit rules', () => {
    const { body } = parsePrompt(procedureText(), INSERT_OPERATION);
    for (const s of ['discussion/handoff/STATUS.md', 'codex-orchestration', 'box-prompt', 'box-defects.md', 'check-asset-destination.mjs', 'wiki/image-library/assets/scenes/comic-b/', 'comic-story-check.mjs', 'Do not commit or push']) expect(body).toContain(s);
  });
  it('the subject param is what Studio records as the run subject', () => {
    const { def } = parsePrompt(procedureText(), INSERT_OPERATION);
    const p = sceneParams(scene());
    expect(subjectOf(def, p)).toEqual({ subject: p.subject });
  });
});

describe('vocabularies match the story types', () => {
  const types = readFileSync(path.join(repoRoot, 'site', 'src', 'data', 'comic-stories', 'types.ts'), 'utf8');
  const union = (re: RegExp) => [...(types.match(re)?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1]);
  it('sound effects, room tones and motion presets', () => {
    expect([...SFX_KINDS]).toEqual(union(/export type SfxKind = ([^;]+);/));
    expect([...ROOM_TONES]).toEqual(union(/export type RoomTone = ([^;]+);/));
    expect(new Set(MOTION_PRESETS)).toEqual(new Set(union(/preset: ('still'[^;]+);/)));
  });
  it('balloon kinds are the current ones without the deprecated machine balloon', () => {
    const kinds = union(/\n\s*kind: ('speech'[^;]+);/);
    expect(BALLOON_KINDS.every((k) => kinds.includes(k))).toBe(true);
    expect(BALLOON_KINDS).not.toContain('machine');
  });
});

describe('scene validation', () => {
  it('accepts a complete form', () => expect(validateScene(scene(), ['agent', 'intro'])).toEqual({}));
  it('requires a unique kebab id, a purpose, a known anchor and 1-8 boxes', () => {
    expect(validateScene(scene({ id: '' }), ['agent']).id).toMatch(/required/);
    expect(validateScene(scene({ id: 'Late Quote' }), ['agent']).id).toMatch(/hyphens/);
    expect(validateScene(scene({ id: 'agent' }), ['agent']).id).toMatch(/already/);
    expect(validateScene(scene({ purpose: '  ' }), ['agent']).purpose).toMatch(/required/);
    expect(validateScene(scene({ anchor: 'gone' }), ['agent']).position).toBeTruthy();
    expect(validateScene(scene({ boxes: 0 }), ['agent']).boxes).toBeTruthy();
    expect(validateScene(scene({ boxes: 9 }), ['agent']).boxes).toBeTruthy();
  });
  it('rejects unknown vocabularies and non-image refs', () => {
    expect(validateScene(scene({ room: 'cave' }), ['agent']).room).toBeTruthy();
    expect(validateScene(scene({ sfx: ['boom'] }), ['agent']).sfx).toMatch(/boom/);
    expect(validateScene(scene({ refs: ['snd:x'] }), ['agent']).refs).toMatch(/snd:x/);
  });
  it('an empty issue needs no anchor', () => expect(validateScene(scene({ anchor: '' }), [])).toEqual({}));
});

describe('box validation', () => {
  it('accepts a complete form', () => expect(validateBox(box(), 4)).toEqual({}));
  it('requires what happens and a position inside the scene', () => {
    expect(validateBox(box({ happens: '' }), 4).happens).toBeTruthy();
    expect(validateBox(box({ box: 5 }), 4).position).toBeTruthy();
    expect(validateBox(box({ box: 0 }), 0)).toEqual({});
  });
  it('checks each balloon row: words, the 90-character limit and a speaker unless narration', () => {
    const e = validateBox(box({ lines: [{ speaker: '', kind: 'speech', text: 'hi' }, { speaker: 'matt', kind: 'speech', text: '' }, { speaker: 'matt', kind: 'speech', text: 'x'.repeat(91) }, { speaker: '', kind: 'place', text: 'Leeds.' }] }), 4);
    expect(Object.keys(e)).toEqual(['line-0', 'line-1', 'line-2']);
    expect(lineWarnings([{ speaker: 'm', kind: 'speech', text: 'one two three four five six seven eight nine ten eleven twelve thirteen' }])[0]).toMatch(/13 words/);
  });
  it('applies the surface contract: a back view is blank, a content face needs shows and a reader', () => {
    const s = (over: object) => validateBox(box({ surfaces: [{ object: 'phone', camera: 'front', reader: 'matt', shows: 'the alert', ...over }] }), 4);
    expect(s({})).toEqual({});
    expect(s({ camera: 'back', shows: 'the alert' })['surface-0']).toMatch(/back/);
    expect(s({ camera: 'back', shows: '', reader: '' })).toEqual({});
    expect(s({ shows: '' })['surface-0']).toMatch(/shows/);
    expect(s({ reader: '' })['surface-0']).toMatch(/reads/);
    expect(s({ camera: 'top' })['surface-0']).toBeTruthy();
  });
});

describe('parameter assembly', () => {
  const oneLineValues = (p: Record<string, string>) => Object.values(p).every((v) => !/[\r\n]/.test(v) && v === v.trim());
  it('a scene sends every param in procedure order as compact one-line values', () => {
    const p = sceneParams(scene());
    expect(Object.keys(p)).toEqual([...PARAM_ORDER]);
    expect(oneLineValues(p)).toBe(true);
    expect(p).toMatchObject({
      subject: 'insert:scene:home/after:agent/late-quote',
      kind: 'scene',
      scene: 'late-quote',
      position: 'after:agent',
      story: '{"title":"The late quote","purpose":"Matt finds the wrong desk count."}',
      cast: '{"present":["matt","claude"]}',
      sound: '{"score":0.25,"room":"office","sfx":["paper","keys"]}',
      lines: '',
      boxes: '3',
      refs: 'img:comic-b-model-matt',
    });
  });
  it('a box carries lines, speakers and surfaces in a stable key order', () => {
    const p = boxParams(box());
    expect(Object.keys(p)).toEqual([...PARAM_ORDER]);
    expect(oneLineValues(p)).toBe(true);
    expect(p.subject).toMatch(/^insert:box:home\/agent\/after:2@[a-z0-9]+$/);
    expect(p.position).toBe('after:2');
    expect(p.cast).toBe('{"present":["claude","matt"],"speakers":["claude"]}');
    expect(p.lines).toBe('[["claude","speech","The desk count is wrong."],["narrator","caption","Tuesday, 11 pm."]]');
    expect(p.surfaces).toBe('[{"object":"laptop","camera":"front","reader":"claude","shows":"the quote table with the desk count highlighted"}]');
    expect(p.sound).toBe('{"sfx":["keys"]}');
    expect(p.motion).toBe('{"preset":"push"}');
    expect(p.boxes).toBe('');
  });
  it('the same form gives the same params; different box text gives a different subject', () => {
    expect(boxParams(box())).toEqual(boxParams(box()));
    expect(boxParams(box({ happens: 'Other.' })).subject).not.toBe(boxParams(box()).subject);
    expect(speakersOf([{ speaker: 'a', kind: 'speech', text: 'x' }, { speaker: 'a', kind: 'burst', text: 'y' }, { speaker: 'b', kind: 'speech', text: '' }])).toEqual(['a']);
  });
});

describe('subjects, positions and runs', () => {
  it('parses both subject shapes', () => {
    expect(parseInsertSubject(insertSubject.scene('home', 'before', 'intro', 'new-one'))).toEqual({ kind: 'scene', issue: 'home', where: 'before', anchor: 'intro', scene: 'new-one' });
    expect(parseInsertSubject(insertSubject.scene('home', 'after', '', 'first'))).toMatchObject({ anchor: '' });
    expect(parseInsertSubject(insertSubject.box('home', 'agent', 'before', 1, 'x'))).toEqual({ kind: 'box', issue: 'home', scene: 'agent', where: 'before', anchor: '1' });
    expect(parseInsertSubject('delete:comic:home')).toBeNull();
  });
  it('lists slots before the first and after each item', () => {
    expect(scenePositions([{ id: 'a', title: '' }, { id: 'b', title: 'Bee' }]).map((p) => p.value)).toEqual(['before:a', 'after:a', 'after:b']);
    expect(scenePositions([{ id: 'a', title: '' }, { id: 'b', title: 'Bee' }])[2]?.label).toBe('After 2. Bee');
    expect(boxPositions(2).map((p) => p.value)).toEqual(['before:1', 'after:1', 'after:2']);
    expect(boxPositions(0).map((p) => p.value)).toEqual(['after:0']);
    expect(splitPosition('before:x-y')).toEqual({ where: 'before', anchor: 'x-y' });
  });
  it('finds running insert runs for the issue by operation and subject', () => {
    const t = (id: string, subject: string, status: 'running' | 'exited', startedAt: string, operation = INSERT_OPERATION): TerminalInfo => ({ id, runner: 'claude', title: 't', operation, pid: 1, startedAt, status, subject });
    const s = insertSubject.scene('home', 'after', 'agent', 'late-quote');
    const list = [t('1', s, 'exited', '2026-10-11T01:00:00Z'), t('2', s, 'running', '2026-10-11T02:00:00Z'), t('3', insertSubject.scene('demo', 'after', 'x', 'y'), 'running', '2026-10-11T03:00:00Z'), t('4', s, 'running', '2026-10-11T04:00:00Z', 'operations-delete-item')];
    expect(insertRuns(list, 'home').map((r) => r.run.id)).toEqual(['2']);
    expect(insertRunFor(list, s)?.id).toBe('2');
  });
});
