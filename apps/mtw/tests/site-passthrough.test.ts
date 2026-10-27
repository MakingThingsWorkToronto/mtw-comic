import { describe, expect, it } from 'vitest';
import { isSitePath, siteBase } from '../server/sitePassthrough';

describe('site passthrough', () => {
  it('forwards only the site public folders the framed reader loads from', () => {
    for (const p of ['/comic/home/x-2400.webp', '/audio/moire-epic-win.mp3', '/fonts/kalam-700.woff2', '/scripts/comic-story.js', '/images/a.png', '/marks/m.svg']) expect(isSitePath(p)).toBe(true);
    for (const p of ['/api/comics/box', '/m/comics', '/', '/assets/index.js', '/@vite/client', '/comic/../server.ts', '/comicx/a']) expect(isSitePath(p)).toBe(false);
  });
  it('uses only a loopback http site base', () => {
    expect(siteBase('{"siteBaseUrl":"http://127.0.0.1:8787"}')).toBe('http://127.0.0.1:8787');
    expect(siteBase('{"siteBaseUrl":"https://example.com"}')).toBeNull();
    expect(siteBase('not json')).toBeNull();
    expect(siteBase(null)).toBeNull();
  });
});
