import { describe, expect, it } from 'vitest';
import { defaultsFor, launchSummary } from '../web/ui/launchChoice';
import type { OperationDef } from '../modules/types';
import type { RunnerOption } from '../web/api';

const def = { id: 'x', title: 'X', module: 'm', runner: 'claude', params: [], models: [{ runner: 'claude', model: 'claude-sonnet-5-5', effort: 'medium' }, { runner: 'codex', model: 'gpt-6.1-sol', effort: 'high' }] } as OperationDef;
const runners: RunnerOption[] = [
  { id: 'claude', label: 'Claude', status: 'proven', tokenSource: 'otel', permissions: [{ id: 'default', label: 'Ask before changes' }], models: [{ id: 'claude-sonnet-5-5', label: 'Sonnet 5.5' }], efforts: ['medium'] },
  { id: 'codex', label: 'Codex', status: 'proven', tokenSource: 'x', permissions: [{ id: 'default', label: 'Ask before changes' }], models: [{ id: 'gpt-6.1-sol', label: 'GPT-6.1 Sol' }], efforts: ['high'] },
];

describe('LaunchConfirm helpers', () => {
  it('starts from the procedure entry for the chosen provider and switches with it', () => {
    expect(defaultsFor(def, 'claude')).toEqual({ model: 'claude-sonnet-5-5', effort: 'medium' });
    expect(defaultsFor(def, 'codex')).toEqual({ model: 'gpt-6.1-sol', effort: 'high' });
    expect(defaultsFor(def, 'opencode')).toEqual({ model: '', effort: '' });
    expect(defaultsFor(undefined, 'claude')).toEqual({ model: '', effort: '' });
  });
  it('summarises the launch in plain English', () => {
    expect(launchSummary({ runner: 'claude', model: 'claude-sonnet-5-5', effort: 'medium', permission: 'default' }, runners)).toBe('Runs in a new terminal with Claude Sonnet 5.5 at medium effort; ask before changes.');
  });
});
