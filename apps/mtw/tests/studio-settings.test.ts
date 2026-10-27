import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRunners } from '../server/core/runners';
import { loadStudioSettings, saveStudioSettings } from '../server/core/studioSettings';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

describe('Studio settings (config/studio.json)', () => {
  it('the repo file defaults Claude to Opus 5.5, and every default model and effort is one its runner offers', () => {
    const s = loadStudioSettings(REPO);
    const runners = loadRunners(REPO);
    expect(s.runners.claude?.model).toBe('claude-opus-5-5');
    expect(runners[s.defaultRunner]).toBeDefined();
    for (const [id, d] of Object.entries(s.runners)) {
      const r = runners[id];
      expect(r, id).toBeDefined();
      if (d.model) expect(r!.modelArgs.length, `${id} takes a model flag`).toBeGreaterThan(0);
      if (d.effort) expect(r!.efforts, `${id} effort`).toContain(d.effort);
    }
  });

  it('falls back to empty defaults without a file, and refuses argv-unsafe values on save', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'mtw-settings-'));
    expect(loadStudioSettings(dir)).toEqual({ defaultRunner: 'claude', runners: {} });
    await expect(saveStudioSettings(dir, { defaultRunner: 'claude', runners: { claude: { model: 'opus; rm -rf /', effort: 'high' } } })).rejects.toThrow();
    const saved = await saveStudioSettings(dir, { defaultRunner: 'codex', runners: { claude: { model: ' claude-sonnet-5-5 ', effort: 'low' } } });
    expect(saved.runners.claude).toEqual({ model: 'claude-sonnet-5-5', effort: 'low' });
    expect(JSON.parse(readFileSync(path.join(dir, 'config', 'studio.json'), 'utf8')).defaultRunner).toBe('codex');
  });
});
