// Test helper (not a test): builds a throwaway repo root with a refreshed mini image library under the OS temp dir.
// The real producer (maintain_library.py) writes the derived files, so the register/verify round trip is real.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FileDecisionLog } from '../server/core/decisions';
import { Assets } from '../server/core/assets';
import { media } from '../server/core/media';
import { FileLeases } from '../server/core/leases';
import { FileWikiStore } from '../server/core/wiki-store';
import { Catalog } from '../modules/images/server/catalog';
import { createContext } from '../modules/images/server/routes';
import type { ImagesContext } from '../modules/images/server/routes';
import type { Services } from '../modules/types';

export const appRoot = fileURLToPath(new URL('..', import.meta.url));
export const realRepoRoot = path.resolve(appRoot, '..', '..');
export const HELPER = path.join(realRepoRoot, '.claude', 'skills', 'mtw-raster-alternatives', 'scripts', 'portable-gallery', 'maintain_library.py');
export const SEED = path.join(appRoot, 'tests', 'fixtures', 'images', 'mini-library');

const sharp = createRequire(path.join(realRepoRoot, 'site', 'package.json'))('sharp') as (options: unknown) => { png(): { toFile(f: string): Promise<unknown> } };

/** A distinct solid-colour PNG (so each file has its own hash). */
export async function writePng(file: string, color: { r: number; g: number; b: number }, size = { w: 32, h: 18 }): Promise<void> {
  mkdirSync(path.dirname(file), { recursive: true });
  await sharp({ create: { width: size.w, height: size.h, channels: 3, background: color } }).png().toFile(file);
}

export interface Fixture {
  root: string;
  lib: string;
  stateDir: string;
  services: Services;
  ctx: ImagesContext;
  catalog: Catalog;
  run(op: 'refresh' | 'verify' | 'register', extra?: string[]): { code: number; out: string };
  cleanup(): void;
}

export async function makeFixture(): Promise<Fixture> {
  const root = mkdtempSync(path.join(os.tmpdir(), 'mtw-images-'));
  const lib = path.join(root, 'wiki', 'image-library');
  mkdirSync(path.dirname(lib), { recursive: true });
  cpSync(SEED, lib, { recursive: true });
  await writePng(path.join(lib, 'assets/diagrams/holographic/fx-diagram.png'), { r: 20, g: 120, b: 160 });
  await writePng(path.join(lib, 'assets/diagrams/photorealistic/fx-diagram.png'), { r: 160, g: 120, b: 20 });
  await writePng(path.join(lib, 'assets/scenes/fx-scene.png'), { r: 90, g: 10, b: 10 });
  await writePng(path.join(lib, 'assets/originals/fx-original.png'), { r: 10, g: 90, b: 10 });
  await writePng(path.join(lib, 'assets/experiments/fx-exp.png'), { r: 10, g: 10, b: 90 });
  await writePng(path.join(lib, 'records/fx-evidence/shot.png'), { r: 200, g: 200, b: 200 });
  writeFileSync(path.join(lib, 'records/fx-evidence/notes.txt'), 'evidence note\n');
  const stateDir = path.join(root, 'apps', 'mtw', '.state');
  mkdirSync(stateDir, { recursive: true });

  const run = (op: 'refresh' | 'verify' | 'register', extra: string[] = []): { code: number; out: string } => {
    const receipts = path.join(stateDir, 'receipts', `fx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    const r = spawnSync('python', [HELPER, op, '--library', lib, '--receipt-dir', receipts, ...extra], { encoding: 'utf8' });
    return { code: r.status ?? 1, out: `${r.stdout}${r.stderr}` };
  };
  const first = run('refresh');
  if (first.code !== 0) throw new Error(`fixture refresh failed: ${first.out}`);

  const leases = new FileLeases(root);
  const wiki = new FileWikiStore(root, leases);
  const decisions = new FileDecisionLog(wiki);
  const services = {
    repoRoot: root,
    wiki,
    decisions,
    events: { emit: () => undefined },
    terminals: {} as Services['terminals'],
    operations: {} as Services['operations'],
    media,
    assets: new Assets(),
    leases,
  } satisfies Services;
  const ctx = createContext(services, { stateDir });
  ctx.register.helper = HELPER;
  return { root, lib, stateDir, services, ctx, catalog: ctx.catalog, run, cleanup: () => rmSync(root, { recursive: true, force: true, maxRetries: 3 }) };
}
