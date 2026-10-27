import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { referenceSlot, SLOT_DIR } from '../modules/comics/server/modelVersions';
import { meta } from '../modules/comics/meta';
import { globToRegExp } from '../server/core/leases';

function repo(files: Record<string, string>): string {
  const root = mkdtempSync(path.join(os.tmpdir(), 'mtw-slot-'));
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    writeFileSync(path.join(root, rel), body);
  }
  return root;
}

const model = { recordId: 'comic-b-model-slop-dedicated', style: 'comic-ink', title: 'Slop', path: '../image-library/assets/scenes/comic-b/models/slop-dedicated-v1.png', status: 'unreviewed-preview', sha256: null, present: true };

describe('character reference slot', () => {
  it('lists every -vN sheet newest first and marks the registered one', async () => {
    const root = repo({
      [`${SLOT_DIR}/slop-dedicated-v1.png`]: 'a',
      [`${SLOT_DIR}/slop-dedicated-v2.png`]: 'b',
      [`${SLOT_DIR}/slop-dedicated-v3.png`]: 'c',
      [`${SLOT_DIR}/hallucination-dedicated-v2.png`]: 'other character',
      ['wiki/image-library/records/comic-b-model-slop-dedicated/comic-ink/v3/reference-review.json']: JSON.stringify({ observations: ['female'], unresolved: ['too tall'] }),
    });
    const slot = await referenceSlot(root, 'slop', model);
    expect(slot.versions.map((v) => [v.version, v.registered])).toEqual([[3, false], [2, false], [1, true]]);
    expect(slot.registeredVersion).toBe(1);
    expect(slot.versions[0]?.observations).toEqual(['female']);
    expect(slot.versions[0]?.unresolved).toEqual(['too tall']);
    expect(slot.versions[0]?.preview).toContain(encodeURIComponent(`${SLOT_DIR}/slop-dedicated-v3.png`));
  });

  it('gives a character without a registered sheet the default <id>-dedicated slot', async () => {
    const root = repo({ [`${SLOT_DIR}/newbie-dedicated-v1.png`]: 'a' });
    const slot = await referenceSlot(root, 'newbie', null);
    expect(slot.stem).toBe('newbie-dedicated');
    expect(slot.versions.map((v) => [v.version, v.registered])).toEqual([[1, false]]);
  });

  it('refreshes the Comics module when a slot file, its record or the catalog changes', () => {
    const watched = (rel: string) => meta.manifest.some((p) => (/[*?]/.test(p) ? globToRegExp(p).test(rel) : p === rel));
    expect(watched(`${SLOT_DIR}/slop-dedicated-v3.png`)).toBe(true);
    expect(watched('wiki/image-library/manifest.json')).toBe(true);
    expect(watched('wiki/image-library/records/comic-b-model-slop-dedicated/comic-ink/v3/reference-review.json')).toBe(true);
  });
});
