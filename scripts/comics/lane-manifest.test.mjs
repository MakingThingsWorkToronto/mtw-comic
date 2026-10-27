import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { buildLaneManifest } from './lane-manifest.mjs';

const table = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = table[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const t = Buffer.concat([Buffer.from(type), data]);
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(t));
  return Buffer.concat([len, t, c]);
}
function png(w, h, channels, alphaAt = () => 255) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = channels === 4 ? 6 : 2;
  const rows = [];
  for (let y = 0; y < h; y++) {
    const row = [0];
    for (let x = 0; x < w; x++) { row.push(200, 10, 10); if (channels === 4) row.push(alphaAt(x, y)); }
    rows.push(Buffer.from(row));
  }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(Buffer.concat(rows))), chunk('IEND', Buffer.alloc(0))]);
}

test('buildLaneManifest measures size, alpha and canvas fit', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lm-'));
  const lane = path.join(root, 'lane-01');
  const run = path.join(lane, 'run-01');
  fs.mkdirSync(run, { recursive: true });
  const a = path.join(root, 'a.png');
  const b = path.join(root, 'b.png');
  fs.writeFileSync(a, png(2, 2, 4, (x, y) => (x === 0 && y === 0 ? 0 : 255)));
  fs.writeFileSync(b, png(2, 2, 3));
  fs.writeFileSync(path.join(lane, 'job.json'), JSON.stringify([{ id: 'agent-a', transparent_background: true }, { id: 'plate-b', transparent_background: false }]));
  const canvas = { size: '1024x1024', w: 1024, h: 1024 };
  for (const id of ['agent-a', 'plate-b']) fs.writeFileSync(path.join(root, `${id}.request.json`), JSON.stringify({ schema: 'comic-request/1', slug: 's', scene: 'sc', box: id, canvas, references: [] }));
  const fence = '`'.repeat(3);
  fs.writeFileSync(path.join(run, 'last-message.txt'), `${fence}json\n${JSON.stringify([{ id: 'agent-a', ok: true, path: a }, { id: 'plate-b', ok: true, path: b }])}\n${fence}`);
  fs.writeFileSync(path.join(run, 'receipt.json'), JSON.stringify({ threadId: 't', exitCode: 0, promptSha256: 'p', lastMessage: 'last-message.txt', generatedImages: [] }));
  const m = await buildLaneManifest(run);
  assert.equal(m.schema, 'comic-lane/1');
  assert.equal(m.jobs.length, 2);
  const [ja, jb] = m.jobs;
  assert.equal(ja.kind, 'agent');
  assert.equal(jb.kind, 'plate');
  assert.equal(ja.output.width, 2);
  assert.equal(ja.output.height, 2);
  assert.equal(ja.output.alpha, true);
  assert.equal(jb.output.alpha, false);
  assert.equal(ja.output.fitsCanvas, true);
  assert.equal(ja.output.native, a);
  assert.deepEqual(fs.readFileSync(path.join(run, 'out', 'agent-a.png')), fs.readFileSync(a));
  assert.equal(ja.review, null);
  assert.equal(ja.registration, null);
  assert.ok(fs.existsSync(path.join(run, 'lane-manifest.json')));
});
