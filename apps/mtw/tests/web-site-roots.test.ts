// Regression (2026-10-11): web/audio/ collided with the site passthrough's /audio/ root, so in dev Vite's URL for
// web/audio/previewAudio.ts was forwarded to the site preview and 404ed, and every module importing web/ui went blank.
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SITE_ROOTS } from '../server/sitePassthrough';

describe('web/ folders and the site passthrough', () => {
  it('no top-level folder under web/ (the Vite root) is one of the site roots the server forwards', () => {
    const web = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'web');
    const dirs = readdirSync(web, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
    expect(dirs.filter((d) => (SITE_ROOTS as readonly string[]).includes(d))).toEqual([]);
  });
});
