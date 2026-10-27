// Storage test fixture: a tiny repo under the OS temp dir. Not a test file.
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export async function put(root: string, rel: string, content: string | Buffer): Promise<void> {
  const abs = path.join(root, rel);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, content);
}

export const big = (n: number, ch = 'x'): Buffer => Buffer.alloc(n, ch);

export async function makeRepo(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'mtw-storage-'));
  const lib = 'wiki/image-library';
  const pages = `${lib}/assets/scenes/comic-b/pages`;

  // Site story: issue "foo" uses page art v3 of foo-page (device-tagged name) and one other page.
  await put(
    root,
    'site/src/data/comic-stories/foo.ts',
    'export const foo = { scenes: [ { art: "/comic/foo/foo-page-20261009-device-v3" }, { art: "/comic/foo/foo-two-20261008" } ] };\n',
  );
  await put(root, 'site/src/data/comic-stories/bar.ts', 'export const bar = { scenes: [ { art: "/comic/bar/bar-one-20261008" } ] };\n');

  // Canonical page art: foo-page v1 (+print), v2 (registered selection), v3 (site); foo-two only v1; bar-one v1, v2.
  for (const name of ['foo-page-20261008-v1.png', 'foo-page-20261008-v1-print.png', 'foo-page-20261008-v2.png', 'foo-page-20261008-v3.png', 'foo-two-20261008-v1.png', 'bar-one-20261008-v1.png', 'bar-one-20261008-v2.png', 'foo-rejected-v1.png']) {
    await put(root, `${pages}/${name}`, `art ${name}`);
  }
  await put(root, `${lib}/records/comic-b-foo-page-20261008/comic-ink/v1/brief.json`, '{"v":1}');
  await put(root, `${lib}/records/comic-b-foo-page-20261008/comic-ink/v2/brief.json`, '{"v":2}');
  await put(root, `${lib}/records/comic-b-foo-page-20261008/comic-ink/v3/brief.json`, '{"v":3}');
  await put(root, `${lib}/assets/experiments/comic-b/reader-art/baseline-01/foo-systems-desktop-0-0.png`, 'shot desktop');
  await put(root, `${lib}/assets/experiments/comic-b/reader-art/baseline-01/foo-systems-phone-0-0.png`, 'shot phone');
  await put(root, `${lib}/assets/experiments/comic-b/reader-art/baseline-01/bar-systems-desktop-0-0.png`, 'bar shot');
  await put(root, 'wiki/site/comic-notes.md', 'The phone check is saved as `reader-art/baseline-01/foo-systems-phone-0-0.png`.\n');

  const file = (destination: string, content = destination) => ({ destination, sha256: 'manifest-hint', bytes: Buffer.byteLength(content), role: 'x' });
  const manifest = {
    records: [
      // Older catalogs filed comic pages under 'scenes'; the comics provider still reads them.
      { id: 'comic-b-foo-page-20261008', collection: 'scenes', sceneKind: 'Comic page', treatments: { 'comic-ink': { path: 'assets/scenes/comic-b/pages/foo-page-20261008-v2.png' } } },
      { id: 'comic-b-foo-two-20261008', collection: 'comics', sceneKind: 'Comic page', treatments: { 'comic-ink': { path: 'assets/scenes/comic-b/pages/foo-two-20261008-v1.png' } } },
      { id: 'comic-b-bar-one-20261008', collection: 'comics', sceneKind: 'Comic page', treatments: { 'comic-ink': { path: 'assets/scenes/comic-b/pages/bar-one-20261008-v2.png' } } },
      { id: 'earlier-comic-b-foo-rejected', collection: 'earlier', status: 'rejected', rejectionReason: 'wrong hands', treatments: { 'comic-ink': { path: 'assets/scenes/comic-b/pages/foo-rejected-v1.png', status: 'rejected' } } },
      // The kept version is also registered as a rejected-looking record by mistake of nobody: must never be planned.
      { id: 'comic-b-foo-page-20261008-device-attempt-v2', collection: 'earlier', status: 'rejected', treatments: { 'comic-ink': { path: 'assets/scenes/comic-b/pages/foo-page-20261008-v2.png', status: 'rejected' } } },
    ],
    files: [
      ...['foo-page-20261008-v1.png', 'foo-page-20261008-v1-print.png', 'foo-page-20261008-v2.png', 'foo-page-20261008-v3.png', 'foo-two-20261008-v1.png', 'bar-one-20261008-v1.png', 'bar-one-20261008-v2.png', 'foo-rejected-v1.png'].map((n) => file(`assets/scenes/comic-b/pages/${n}`)),
      file('records/comic-b-foo-page-20261008/comic-ink/v1/brief.json'),
      file('records/comic-b-foo-page-20261008/comic-ink/v2/brief.json'),
      file('records/comic-b-foo-page-20261008/comic-ink/v3/brief.json'),
      file('assets/experiments/comic-b/reader-art/baseline-01/foo-systems-desktop-0-0.png'),
      file('assets/experiments/comic-b/reader-art/baseline-01/foo-systems-phone-0-0.png'),
      file('assets/experiments/comic-b/reader-art/baseline-01/bar-systems-desktop-0-0.png'),
    ],
  };

  // Evidence: old unreferenced, old but named by a page, fresh, and a user-approved record's file.
  const ev = [
    'records/site-glass-run-20260101/shot-old.png',
    'records/site-glass-run-20260101/shot-named.png',
    'records/site-glass-run-20260101/shot-approved.png',
    'records/site-glass-run-20261009/shot-fresh.png',
    'records/discussion-relocation-2026-01-01/sources/legacy.png',
  ];
  for (const rel of ev) {
    await put(root, `${lib}/${rel}`, big(60_000, rel.length % 2 ? 'a' : 'b'));
    manifest.files.push({ destination: rel, sha256: 'manifest-hint', bytes: 60_000, role: 'provenance' });
  }
  manifest.records.push({ id: 'approved-shot', collection: 'experiments', status: 'user-approved', treatments: { 'comic-review': { path: 'records/site-glass-run-20260101/shot-approved.png' } } } as never);
  await put(root, 'wiki/site/evidence-notes.md', 'See shot-named.png for the layout check.\n');
  await put(root, `${lib}/manifest.json`, JSON.stringify(manifest));

  // Derivatives
  for (const n of ['foo-page-20261009-device-v3-1600.avif', 'foo-page-20261009-device-v3-1600.webp', 'foo-page-20261009-device-v3-3200.avif', 'keep.svg']) {
    await put(root, `site/public/comic/foo/${n}`, big(2000));
  }

  // Soundtrack
  const sl = 'wiki/soundtrack-library';
  const tracks = [
    { id: 'a', file: 'a.mp3', status: 'approved', title: 'A' },
    { id: 'b', file: 'b.mp3', status: 'withdrawn', title: 'B' },
    { id: 'c', file: 'c.mp3', status: 'candidate', title: 'C', discovery: { run: '2026-01-02-like-x' } },
    { id: 'd', file: 'd.mp3', status: 'candidate', title: 'D', discovery: { run: '2026-10-08-like-x' } },
    { id: 'e', file: 'e.mp3', status: 'candidate', title: 'E', rating: 5, discovery: { run: '2026-01-02-like-x' } },
    { id: 'f', file: 'f.mp3', status: 'candidate', title: 'F', usedBy: ['home'], discovery: { run: '2026-01-02-like-x' } },
  ];
  for (const t of tracks) await put(root, `${sl}/assets/${t.file}`, big(1000));
  await put(root, `${sl}/sources.json`, JSON.stringify({ tracks }));
  return root;
}

export const NOW = new Date('2026-10-09T12:00:00Z');

/** Extra material for the asset-health tests: duplicates, orphans, oversized rasters, code and a finished transcode. */
export async function addAssetHealth(root: string): Promise<void> {
  const lib = 'wiki/image-library';
  const same = Buffer.from('identical bytes '.repeat(200));
  await put(root, `${lib}/assets/dupes/a.png`, same);
  await put(root, `${lib}/assets/dupes/deeper/copy-of-a.png`, same);
  await put(root, 'site/public/hero.png', same); // expected integration copy of a.png
  await put(root, 'site/public/lonely-thing.png', Buffer.from('nothing in a library matches this '.repeat(100)));
  // Cross-library: the same sound in the soundtrack library and in comics; the soundtrack keeps it.
  const sound = Buffer.from('a sound '.repeat(400));
  await put(root, 'wiki/soundtrack-library/assets/shared-sound.mp3', sound);
  await put(root, 'wiki/comics-library/assets/sounds/shared-sound.mp3', sound);
  // Orphans
  await put(root, `${lib}/assets/orphans/loose.png`, Buffer.from('loose image '.repeat(300)));
  await put(root, 'wiki/soundtrack-library/assets/stray.mp3', Buffer.from('stray '.repeat(300)));
  await put(root, 'wiki/comics-library/assets/sounds/known.wav', Buffer.from('known '.repeat(300)));
  await put(root, 'wiki/comics-library/assets/sounds/lost.wav', Buffer.from('lost '.repeat(300)));
  await put(root, 'wiki/comics-library/records/sounds-note.json', JSON.stringify({ sounds: ['known.wav', 'shared-sound.mp3'] }));
  // Oversized: a photographic PNG, a PNG far larger than its site copy, a flat PNG (fine), a PNG that already has a WebP sibling.
  const png = (w: number, h: number, bytes: number): Buffer => {
    const b = Buffer.alloc(bytes, 7);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]).copy(b, 0);
    b.write('IHDR', 12, 'ascii');
    b.writeUInt32BE(w, 16);
    b.writeUInt32BE(h, 20);
    return b;
  };
  await put(root, `${lib}/assets/big/photo.png`, png(1000, 1000, 2_500_000));
  await put(root, `${lib}/assets/big/flat.png`, png(5000, 5000, 1_200_000));
  await put(root, `${lib}/assets/big/sized-scene-v1.png`, png(8000, 8000, 1_500_000));
  await put(root, 'site/public/sized-scene-1600.webp', Buffer.alloc(200_000, 1));
  await put(root, `${lib}/assets/big/has-sibling.png`, png(1000, 1000, 2_500_000));
  await put(root, `${lib}/assets/big/has-sibling-v2.webp`, Buffer.alloc(900_000, 2));
  // Older image versions
  await put(root, `${lib}/assets/diagrams/box-v1.png`, Buffer.from('box one '.repeat(200)));
  await put(root, `${lib}/assets/diagrams/box-v2.png`, Buffer.from('box two '.repeat(200)));
  await put(root, `${lib}/assets/diagrams/box-v3.png`, Buffer.from('box three '.repeat(200)));
  await put(root, `${lib}/assets/diagrams/earlier-only.png`, Buffer.from('earlier only '.repeat(200)));
  const m = JSON.parse(await readFile(path.join(root, `${lib}/manifest.json`), 'utf8')) as { records: unknown[]; files: unknown[] };
  const f = (destination: string, content: Buffer) => ({ destination, sha256: 'manifest-hint', bytes: content.length, role: 'x' });
  m.files.push(
    f('assets/dupes/a.png', same),
    f('assets/dupes/deeper/copy-of-a.png', same),
    f('assets/diagrams/box-v1.png', Buffer.alloc(1600)),
    f('assets/diagrams/box-v2.png', Buffer.alloc(1600)),
    f('assets/diagrams/box-v3.png', Buffer.alloc(1600)),
    f('assets/diagrams/earlier-only.png', Buffer.alloc(2600)),
  );
  m.records.push(
    { id: 'box', collection: 'diagrams', status: 'selected', treatments: { flat: { path: 'assets/diagrams/box-v2.png', status: 'selected' } } },
    { id: 'earlier-box', collection: 'earlier', treatments: { flat: { path: 'assets/diagrams/earlier-only.png' } } },
  );
  await put(root, `${lib}/manifest.json`, JSON.stringify(m));
  // A finished transcode plan: the original and its replacement both exist.
  await put(root, `${lib}/assets/done/old-original.png`, Buffer.from('original '.repeat(300)));
  await put(root, `${lib}/assets/done/old-original-v2.webp`, Buffer.from('replacement '.repeat(100)));
  await put(
    root,
    'wiki/operations/storage/plans/oversized-originals-images-202610090000.json',
    JSON.stringify({
      id: 'oversized-originals-images-202610090000',
      providerId: 'oversized-originals',
      target: 'images',
      status: 'executed',
      files: [
        {
          path: `${lib}/assets/done/old-original.png`,
          bytes: 2700,
          sha256: 'a'.repeat(64),
          action: 'transcode',
          reason: 'x',
          result: { status: 'transcoded', outputPath: `${lib}/assets/done/old-original-v2.webp` },
        },
      ],
    }),
  );
  // Code
  await put(root, 'apps/mtw/server/big.ts', 'const x = 1;\n'.repeat(900));
  await put(root, 'apps/mtw/server/small.ts', 'const y = 1;\n');
  await put(root, 'apps/mtw/node_modules/pkg/ignored.ts', 'const z = 1;\n'.repeat(900));
  await put(root, 'apps/mtw/server/shared-name.mjs', 'export {};\n');
  await put(root, 'site/scripts/shared-name.mjs', 'export {};\n');
  await put(root, 'site/scripts/own.mjs', 'export {};\n');
}
