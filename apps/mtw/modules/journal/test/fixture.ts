// Test helper: a throwaway copy of the Journal's inputs under the OS temp dir, so tests never touch wiki/.
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, truncateSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export interface RepoCopy {
  root: string;
  cleanup(): void;
}

/** Copies wiki/journal (candidates included), wiki/operations, the diagram brief, and zero-filled stand-ins (same sizes) for the journal scene images. */
export function makeRepoCopy(realRoot: string): RepoCopy {
  const root = mkdtempSync(path.join(os.tmpdir(), 'mtw-journal-'));
  const copy = (rel: string): void => {
    const from = path.join(realRoot, rel);
    if (!existsSync(from)) return;
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    cpSync(from, path.join(root, rel), { recursive: true });
  };
  copy('wiki/journal');
  copy('wiki/operations');
  copy('discussion/handoff/CODEX-PROMPT-diagrams.md');
  const scenes = path.join(realRoot, 'wiki/image-library/assets/scenes/journal');
  if (existsSync(scenes)) {
    const dest = path.join(root, 'wiki/image-library/assets/scenes/journal');
    mkdirSync(dest, { recursive: true });
    for (const name of readdirSync(scenes)) {
      const file = path.join(dest, name);
      writeFileSync(file, '');
      truncateSync(file, statSync(path.join(scenes, name)).size);
    }
  }
  return { root, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}
