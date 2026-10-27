import { describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { claudeModels, codexModels, grokModels, syncModels } from '../../../scripts/models/sync-models.mjs';
import { modelChoices } from '../modules/operations/server';

describe('config/models.json sync', () => {
  it('reads Codex, Grok and Claude model lists without their sign-in fields', () => {
    const codex = codexModels({ fetched_at: 't', models: [{ slug: 'gpt-b', display_name: 'B', priority: 2, visibility: 'list', supported_reasoning_levels: [{ effort: 'low' }, { effort: 'high' }], default_reasoning_level: 'low' }, { slug: 'gpt-a', display_name: 'A', priority: 1, visibility: 'hide' }] });
    expect(codex?.models.map((m) => [m.id, m.hidden ?? false])).toEqual([['gpt-a', true], ['gpt-b', false]]);
    expect(codex?.models[1]).toMatchObject({ efforts: ['low', 'high'], defaultEffort: 'low' });
    const grok = grokModels({ models: { 'grok-9': { api_key: 'SECRET', info: { model: 'grok-9', name: 'Grok 9', reasoning_efforts: [{ value: 'high', default: true }, { value: 'low' }] } } } });
    expect(JSON.stringify(grok)).not.toContain('SECRET');
    expect(grok?.models[0]).toEqual({ id: 'grok-9', label: 'Grok 9', efforts: ['high', 'low'], defaultEffort: 'high' });
    const claude = claudeModels('"claude-opus-5-5[1m]" "claude-opus-5" "claude-haiku-4-5-20251001" "claude-sonnet-5-5" x');
    expect(claude?.models.map((m) => [m.id, m.hidden ?? false])).toEqual([['claude-opus-5-5', false], ['claude-opus-5', true], ['claude-sonnet-5-5', false]]);
  });

  it('writes only on change and keeps a provider whose CLI is missing', () => {
    const home = mkdtempSync(path.join(os.tmpdir(), 'mtw-models-'));
    const file = path.join(home, 'models.json');
    mkdirSync(path.join(home, '.codex'));
    writeFileSync(path.join(home, '.codex', 'models_cache.json'), JSON.stringify({ models: [{ slug: 'gpt-x', display_name: 'X' }] }));
    writeFileSync(file, JSON.stringify({ providers: { grok: { runner: null, label: 'Grok', source: 's', fetchedAt: null, models: [{ id: 'grok-1', label: 'G', efforts: [] }] } } }));
    expect(syncModels({ home, file })).toBe(true);
    const out = JSON.parse(readFileSync(file, 'utf8'));
    expect(Object.keys(out.providers).sort()).toEqual(['codex', 'grok']);
    expect(syncModels({ home, file })).toBe(false);
  });

  it('offers listed models and their efforts only to runners that take the flags', () => {
    const p = { runner: 'codex', label: 'Codex', source: 's', fetchedAt: null, models: [{ id: 'a', label: 'A', efforts: ['low', 'high'] }, { id: 'h', label: 'H', efforts: ['ultra'], hidden: true }] };
    expect(modelChoices({ modelArgs: ['-m', '{model}'], effortArgs: ['-c', 'x={effort}'] }, p)).toEqual({ models: [{ id: 'a', label: 'A' }], efforts: ['low', 'high'] });
    expect(modelChoices({}, p)).toEqual({ models: [], efforts: [] });
    expect(modelChoices({ modelArgs: ['--model', '{model}'], models: [{ id: 'f', label: 'F' }], efforts: ['low'] }, undefined)).toEqual({ models: [{ id: 'f', label: 'F' }], efforts: [] });
  });
});
