import { describe, expect, it } from 'vitest';
import type { ServerModule, Services } from '../modules/types';
import { buildHomeSummary } from '../server/core/home';

const meta = (id: string, order: number) => ({ id, title: id.toUpperCase(), nav: { label: id, order }, manifest: [] });
const services = {} as Services;

describe('buildHomeSummary', () => {
  it('collects summaries, links modules without summary() and survives a failing module', async () => {
    const modules: ServerModule[] = [
      { meta: meta('b', 20) },
      { meta: meta('a', 10), summary: () => ({ items: [{ id: 'x', label: 'Waiting', count: 3, href: '/m/a?tab=x', attention: true }] }) },
      { meta: meta('c', 30), summary: () => { throw new Error('boom'); } },
    ];
    const home = await buildHomeSummary(modules, services);
    expect(home.modules.map((m) => m.id)).toEqual(['a', 'b', 'c']);
    expect(home.modules[0]).toMatchObject({ summarized: true, href: '/m/a', items: [{ count: 3 }] });
    expect(home.modules[1]).toMatchObject({ summarized: false, items: [] });
    expect(home.modules[2]).toMatchObject({ summarized: true, items: [], error: 'boom' });
  });
});
