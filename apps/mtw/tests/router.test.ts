import { describe, expect, it } from 'vitest';
import { buildUrl, parseLocation } from '../web/shell/route';

describe('parseLocation', () => {
  it('treats / as Home', () => {
    expect(parseLocation('/').module).toBeNull();
  });

  it('parses /m/<module>/<view>/<id>?filters', () => {
    const r = parseLocation('/m/operations/terminals/t-1234', '?status=running&q=a%20b');
    expect(r.module).toBe('operations');
    expect(r.path).toEqual(['terminals', 't-1234']);
    expect(r.query.get('status')).toBe('running');
    expect(r.query.get('q')).toBe('a b');
  });

  it('parses a bare module and decodes segments', () => {
    expect(parseLocation('/m/images').path).toEqual([]);
    expect(parseLocation('/m/images/view/a%20b').path).toEqual(['view', 'a b']);
  });

  it('sends unknown top-level paths to Home', () => {
    expect(parseLocation('/nothing/here').module).toBeNull();
  });
});

describe('buildUrl', () => {
  it('round-trips with parseLocation', () => {
    const url = buildUrl('operations', ['terminals', 'a b'], { status: 'exited' });
    expect(url).toBe('/m/operations/terminals/a%20b?status=exited');
    const [pathname, search] = url.split('?') as [string, string];
    const r = parseLocation(pathname, `?${search}`);
    expect(r.module).toBe('operations');
    expect(r.path).toEqual(['terminals', 'a b']);
  });

  it('builds Home and bare-module URLs', () => {
    expect(buildUrl(null)).toBe('/');
    expect(buildUrl('operations')).toBe('/m/operations');
  });
});
