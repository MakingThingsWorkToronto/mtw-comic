import { expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { artStatus } from '../modules/comics/server/artwatch';
import type { SceneArt } from '../modules/comics/server/stories';

it('notices replaced deep native layers without any story-word or legacy atlas change', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'mtw-selected-artwatch-'));
  const rel = 'site/public/comic/home/projection/v2/actor.png';
  const file = path.join(root, rel);await fs.mkdir(path.dirname(file), { recursive: true });await fs.writeFile(file, 'first');
  const scenes = [{ id: 'home', art: '/comic/home/deep/atlas', full: null, thumb: null, panels: [{ index: 0, img: 'actor', alt: '', crop: [0, 0, 1, 1], layers: [{ id: 'agent', src: '/api/comics/media?path=' + encodeURIComponent(rel), crop: [0, 0, 1, 1], opacity: .72 }] }] }] as SceneArt[];
  const first = await artStatus(root, null, scenes);expect(first.scenes[0]?.files[0]?.path).toBe(rel);
  await fs.utimes(file, new Date('2026-10-01'), new Date('2026-10-01'));
  const second = await artStatus(root, null, scenes);expect(second.scenes[0]?.files[0]?.mtime).not.toBe(first.scenes[0]?.files[0]?.mtime);
  expect(second.scenes[0]?.files[0]?.version).toBe(2);
});

it('does not turn foreign or traversing source URLs into watched repo files', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'mtw-selected-artwatch-'));
  const scenes = [{ id: 'home', art: null, full: null, thumb: null, panels: [{ index: 0, img: 'bad', alt: '', crop: [0, 0, 1, 1], src: '/api/comics/media?path=' + encodeURIComponent('site/public/comic/../../secret'), canonicalSource: { path: 'wiki/image-library/assets/../../secret' }, phone: { src: 'https://foreign.test/api/comics/media?path=site/public/comic/private', crop: [0, 0, 1, 1] } }] }] as SceneArt[];
  expect((await artStatus(root, null, scenes)).scenes[0]?.files).toEqual([]);
});
