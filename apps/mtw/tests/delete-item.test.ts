// Delete buttons: the shared operations-delete-item procedure, subject builders and the panel state logic.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePrompt, renderPrompt, subjectOf, validateParams } from '../server/core/prompts';
import { loadTemplate } from '../server/core/templates';
import type { TerminalInfo } from '../modules/types';
import { DELETE_MODULE, DELETE_OPERATION, boxFingerprint, deleteBusy, deleteParams, deletePhase, deleteRunFor, deleteSubject } from '../web/delete';
import type { DeleteKind } from '../web/delete';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const PROMPT = path.join(REPO, 'wiki', 'operations', 'prompts', `${DELETE_OPERATION}.md`);
const KINDS: DeleteKind[] = ['image', 'track', 'journal', 'comic', 'comic-page', 'comic-box'];

const parsed = parsePrompt(readFileSync(PROMPT, 'utf8'), `${DELETE_OPERATION}.md`);

describe('operations-delete-item procedure', () => {
  it('parses, with a kind select covering every delete kind and a subject the run is found by', () => {
    expect(parsed.def.id).toBe(DELETE_OPERATION);
    const kind = parsed.def.params.find((p) => p.name === 'kind');
    expect(kind?.type).toBe('select');
    expect(kind?.options).toEqual(KINDS);
    expect(Object.keys(DELETE_MODULE).sort()).toEqual([...KINDS].sort());
    // No asset parameter, so subjectOf picks the `subject` parameter and the UI can find the run by it.
    expect(parsed.def.params.some((p) => p.type === 'asset')).toBe(false);
    const params = deleteParams('image', deleteSubject.image('rec', 'abcd1234', 'svg-flat'), 'img:rec#svg-flat@v2', ['wiki/image-library/assets/x.svg']);
    expect(() => validateParams(parsed.def, params)).not.toThrow();
    expect(subjectOf(parsed.def, params)).toEqual({ subject: 'delete:img:rec#svg-flat@abcd1234' });
    expect(() => validateParams(parsed.def, { ...params, kind: 'folder' })).toThrow(/one of/);
  });

  it('keeps the whole prefix before "## This run" byte-identical across kinds (prompt caching)', () => {
    const a = renderPrompt(parsed, deleteParams('image', deleteSubject.image('r', 'v1'), 'img:r@v1', ['a.png']), REPO);
    const b = renderPrompt(parsed, deleteParams('comic-box', deleteSubject.box('home', 's1', 3, 'zz'), 'home/s1/box 3'), REPO);
    const ia = a.indexOf('## This run');
    const ib = b.indexOf('## This run');
    expect(ia).toBeGreaterThan(0);
    expect(a.slice(0, ia)).toBe(b.slice(0, ib));
    expect(a.slice(ia)).toContain('delete:img:r@v1');
    expect(a.slice(0, ia)).not.toContain('delete:img:');
    expect(parsed.body).not.toMatch(/\{\{\w+\}\}/);
  });

  it('demands an inventory, an ownership check and Matt\'s typed confirmation before any removal', () => {
    const body = parsed.body;
    expect(body).toContain('discussion/handoff/STATUS.md');
    expect(body).toContain('git status');
    expect(body).toMatch(/Do nothing further until he types it/);
    expect(body).toMatch(/never a whole folder/);
    expect(body).toMatch(/maintained producers/);
    expect(body.indexOf('Inventory')).toBeLessThan(body.indexOf('Execute only the confirmed plan'));
  });

  it('has a stable per-kind section in the delete-item-kinds template for every kind', () => {
    const t = loadTemplate(REPO, 'delete-item-kinds');
    for (const kind of KINDS) expect(t.body).toContain(`\n## ${kind}\n`);
  });
});

describe('delete subjects', () => {
  it('names the exact item', () => {
    expect(deleteSubject.image('diagram-a', 'v3', 'svg-glass')).toBe('delete:img:diagram-a#svg-glass@v3');
    expect(deleteSubject.image('diagram-a', 'v3')).toBe('delete:img:diagram-a@v3');
    expect(deleteSubject.track('pixabay-1')).toBe('delete:snd:pixabay-1');
    expect(deleteSubject.journal('second-brain')).toBe('delete:journal:second-brain');
    expect(deleteSubject.comic('home')).toBe('delete:comic:home');
    expect(deleteSubject.page('home', 'open')).toBe('delete:comic-page:home/open');
    expect(deleteSubject.box('home', 'open', 2, 'fp')).toBe('delete:comic-box:home/open/2@fp');
  });

  it('fingerprints a box by its crop and balloons, not its index', () => {
    const a = { crop: [0, 0, 0.5, 0.5], balloons: [{ id: 'b1' }] };
    expect(boxFingerprint(a)).toBe(boxFingerprint({ ...a }));
    expect(boxFingerprint(a)).not.toBe(boxFingerprint({ crop: [0.5, 0, 0.5, 0.5], balloons: [{ id: 'b1' }] }));
    expect(boxFingerprint(a)).not.toBe(boxFingerprint({ crop: [0, 0, 0.5, 0.5], balloons: [{ id: 'b2' }] }));
    expect(boxFingerprint({ crop: null, balloons: [] })).toMatch(/^[0-9a-z]+$/);
  });

  it('omits paths when none are known', () => {
    expect(deleteParams('track', 's', 'snd:x')).toEqual({ kind: 'track', target: 'snd:x', subject: 's' });
    expect(deleteParams('track', 's', 'snd:x', ['', 'a.mp3', 'b.json']).paths).toBe('a.mp3, b.json');
  });
});

const term = (over: Partial<TerminalInfo>): TerminalInfo => ({ id: 't1', runner: 'claude', title: 'Delete', operation: DELETE_OPERATION, subject: 'delete:snd:x', pid: 1, startedAt: '2026-10-11T10:00:00Z', status: 'running', ...over });

describe('delete run lookup and panel state', () => {
  it('finds the latest run of the delete operation for exactly this subject', () => {
    const list = [
      term({ id: 'old', startedAt: '2026-10-11T09:00:00Z', status: 'exited', exitCode: 0 }),
      term({ id: 'other-subject', subject: 'delete:snd:y', startedAt: '2026-10-11T11:00:00Z' }),
      term({ id: 'other-op', operation: 'soundtrack-intake', startedAt: '2026-10-11T11:00:00Z' }),
      term({ id: 'new', startedAt: '2026-10-11T10:30:00Z' }),
    ];
    expect(deleteRunFor(list, 'delete:snd:x')?.id).toBe('new');
    expect(deleteRunFor(list, 'delete:snd:z')).toBeUndefined();
  });

  it('disables while running, checks after exit, then hides or re-enables with a note', () => {
    const running = term({});
    const exited = term({ status: 'exited', exitCode: 0, exitedAt: '2026-10-11T10:05:00Z' });
    expect(deletePhase({ run: undefined, present: true })).toBe('idle');
    expect(deletePhase({ run: running, present: true })).toBe('deleting');
    // Item gone from the module's data: the panel disappears, even while the terminal is still open.
    expect(deletePhase({ run: running, present: false })).toBe('gone');
    expect(deletePhase({ run: exited, present: false })).toBe('gone');
    // Exited, data not yet refetched: stay disabled.
    expect(deletePhase({ run: exited, present: true })).toBe('checking');
    // Refetched and still there: the delete did not complete.
    expect(deletePhase({ run: exited, present: true, checkedRunId: 't1' })).toBe('failed');
    expect(deletePhase({ run: exited, present: true, checkedRunId: 't1', dismissedRunId: 't1' })).toBe('idle');
    // A check of an older run does not count for a newer one.
    expect(deletePhase({ run: exited, present: true, checkedRunId: 'older' })).toBe('checking');
    expect(deleteBusy('deleting')).toBe(true);
    expect(deleteBusy('checking')).toBe(true);
    expect(deleteBusy('failed')).toBe(false);
    expect(deleteBusy('idle')).toBe(false);
  });
});
