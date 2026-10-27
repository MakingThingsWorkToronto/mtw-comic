// Images module: parity with the legacy browser (retired git 51eb6e03:wiki/image-library/browser.js), facets, states, refs, versions, resolver.
// Read-only over the real library; nothing here writes under wiki/.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { Catalog } from '../modules/images/server/catalog';
import { Integration } from '../modules/images/server/integration';
import { createResolver } from '../modules/images/server/resolver';
import { buildIndex, computeFacets, matchEntries } from '../modules/images/shared/filter';
import { formatImgRef, parseImgRef } from '../modules/images/shared/refs';
import { STATE_LABEL, stateOf } from '../modules/images/shared/states';
import type { ImageRecord, Manifest } from '../modules/images/shared/types';
import { FamilyIndex, pickVersion, versionsOf } from '../modules/images/shared/versions';
import { realRepoRoot } from './images-fixture';

let manifest: Manifest;
beforeAll(() => {
  manifest = JSON.parse(readFileSync(path.join(realRepoRoot, 'wiki', 'image-library', 'manifest.json'), 'utf8')) as Manifest;
});

interface OldState {
  collection: string;
  style: string;
  category: string;
  service: string;
  search: string;
  gaps: boolean;
}

/** browser.js L66 and L153-164, copied verbatim apart from reading `library` and `state` as parameters. */
function oracle(library: Manifest, state: OldState): string[] {
  const selection = (record: ImageRecord) => {
    const style = state.style === 'all' ? Object.keys(record.treatments)[0] : state.style;
    return { style, treatment: record.treatments[style as string] || { status: 'missing' } };
  };
  const available = library.records.filter((r) => (state.collection === 'earlier' ? ['earlier', 'experiments'].includes(r.collection) : r.collection === state.collection)).reverse();
  const query = state.search.trim().toLocaleLowerCase();
  return available
    .filter((record) => {
      if (state.category && record.category !== state.category) return false;
      if (state.service && record.service !== state.service) return false;
      if (state.collection !== 'diagrams' && state.style !== 'all' && !record.treatments[state.style]) return false;
      if (query) {
        const haystack = [record.id, record.logicalId, record.title, record.description, record.service, record.sourceName, ...Object.values(record.treatments).map((t) => t.sourceName)]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (state.gaps && (selection(record).treatment as { path?: string }).path) return false;
      return true;
    })
    .map((r) => r.id);
}

const COLLECTIONS = ['diagrams', 'icons', 'originals', 'scenes', 'comics', 'earlier'];
const TERMS = ['azure', 'brain', 'copilot', 'security', 'journal', 'comic', 'migration', 'agent', 'hero', 'card', 'team', 'power platform', 'retained', 'v2', 'icon', 'second brain', 'cost', 'AWS', 'Matt', 'no-such-image-zzz'];

describe('oracle parity with browser.js', () => {
  it('returns identical ids for collections, categories, services, styles, gaps and search terms', () => {
    const index = buildIndex(manifest.records);
    let compared = 0;
    const check = (state: OldState): void => {
      const expected = oracle(manifest, state);
      const got = matchEntries(index, { collection: state.collection, style: state.style, category: state.category, service: state.service, q: state.search, gaps: state.gaps }).map((e) => e.id);
      expect(got, JSON.stringify(state)).toEqual(expected);
      compared++;
    };
    for (const collection of COLLECTIONS) {
      const records = manifest.records.filter((r) => (collection === 'earlier' ? ['earlier', 'experiments'].includes(r.collection) : r.collection === collection));
      const styleKeys = [...new Set(records.flatMap((r) => Object.keys(r.treatments)))];
      const styles = collection === 'diagrams' ? styleKeys : ['all', ...styleKeys];
      const base: OldState = { collection, style: collection === 'diagrams' || collection === 'icons' ? 'svg-flat' : 'all', category: '', service: '', search: '', gaps: false };
      check(base);
      for (const style of styles) {
        check({ ...base, style });
        if (collection === 'diagrams') check({ ...base, style, gaps: true });
      }
      const categories = [...new Set(records.map((r) => r.category))];
      for (const category of categories) {
        check({ ...base, category });
        const services = [...new Set(records.filter((r) => r.category === category).map((r) => r.service))];
        for (const service of services.slice(0, 12)) check({ ...base, category, service });
      }
      for (const search of TERMS) check({ ...base, search });
      const titles = records.filter((_, i) => i % 61 === 0).map((r) => r.title.split(/\s+/)[0] ?? '');
      for (const search of titles) check({ ...base, search, category: categories[0] ?? '' });
    }
    expect(compared).toBeGreaterThan(250);
  });

  it('puts the newest-registered record first', () => {
    const index = buildIndex(manifest.records);
    const first = matchEntries(index, { collection: 'diagrams' })[0] as { id: string; pos: number };
    const lastDiagram = [...manifest.records].reverse().find((r) => r.collection === 'diagrams');
    expect(first.id).toBe(lastDiagram?.id);
  });
});

describe('facets and counts', () => {
  it('match manifest.counts for every collection', () => {
    const index = buildIndex(manifest.records);
    const facets = computeFacets(index, manifest);
    expect(facets.collections).toEqual(manifest.counts.collections);
    for (const collection of COLLECTIONS) {
      const f = computeFacets(index, manifest, { collection });
      const expected = collection === 'earlier' ? manifest.counts.collections.earlier! + manifest.counts.collections.experiments! : manifest.counts.collections[collection]!;
      expect(matchEntries(index, { collection }).length).toBe(expected);
      expect(f.categories.reduce((n, c) => n + c.count, 0)).toBe(expected);
      expect(f.statuses.reduce((n, c) => n + c.count, 0)).toBe(expected);
    }
  });

  it('counts present and missing diagram files like the producer', () => {
    const index = buildIndex(manifest.records);
    for (const [style, c] of Object.entries(manifest.counts.diagramsByStyle ?? {})) {
      const present = index.filter((e) => e.collection === 'diagrams' && e.paths[style]).length;
      expect(present, style).toBe(c.present);
    }
  });
});

describe('review states', () => {
  it('maps every status string in the manifest to a known state without throwing', () => {
    const seen = new Set<string>();
    for (const r of manifest.records) for (const t of Object.values(r.treatments)) seen.add(t.status ?? '');
    for (const status of seen) expect(Object.keys(STATE_LABEL)).toContain(stateOf(status));
  });

  it('maps representative statuses', () => {
    expect(stateOf('in-review')).toBe('reviewed');
    expect(stateOf('unreviewed-preview')).toBe('unreviewed');
    expect(stateOf('draft-preview')).toBe('draft');
    expect(stateOf('spot-checked-preview')).toBe('reviewed');
    expect(stateOf('selected-reference')).toBe('selected');
    expect(stateOf('historical-reference')).toBe('reference');
    expect(stateOf('earlier-attempt')).toBe('reference');
    expect(stateOf('rejected')).toBe('rejected');
    expect(stateOf('retained rejected caption composition')).toBe('rejected');
    expect(stateOf('user-approved')).toBe('approved');
    expect(stateOf('review-evidence')).toBe('evidence');
    expect(stateOf('retained nonselected candidate')).toBe('reference');
    expect(stateOf('authored; static reviewed; native pending')).toBe('reviewed');
    expect(stateOf('missing')).toBe('missing');
  });
});

describe('img: references', () => {
  it('parses and formats the grammar', () => {
    expect(parseImgRef('img:about-expertise-brain')).toEqual({ id: 'about-expertise-brain', version: 'current' });
    expect(parseImgRef('img:a#svg-glass@v3')).toEqual({ id: 'a', style: 'svg-glass', version: 'v3' });
    expect(parseImgRef('img:a@0123abcd')).toEqual({ id: 'a', version: '0123abcd' });
    expect(parseImgRef('img:a@nonsense')).toBeNull();
    expect(parseImgRef('snd:a')).toBeNull();
    expect(formatImgRef('a', 'v2', 'svg-glass')).toBe('img:a#svg-glass@v2');
  });
});

describe('versions and the img: resolver over the real library', () => {
  it('gives unique v<N> and sha8 tokens in every family chain', () => {
    const family = new FamilyIndex(manifest.records);
    let chains = 0;
    for (const r of manifest.records) {
      for (const style of Object.keys(r.treatments)) {
        const chain = versionsOf(family, r, style);
        const tokens = chain.map((v) => v.token);
        expect(new Set(tokens).size, `${r.id}/${style}`).toBe(tokens.length);
        expect(new Set(chain.map((v) => v.sha8)).size, `${r.id}/${style} sha8`).toBe(chain.length);
        const live = r.treatments[style];
        if (live?.path) {
          const cur = pickVersion(chain, 'current');
          expect(cur?.sha256, `${r.id}/${style} current`).toBe(live.sha256);
        }
        chains++;
      }
    }
    expect(chains).toBeGreaterThan(1800);
  });

  it('resolves every record, with v<N> and sha8 tokens, and existing integration sources', async () => {
    const catalog = new Catalog(realRepoRoot);
    const integration = new Integration(realRepoRoot);
    const resolver = createResolver(catalog, integration);
    const l = await catalog.ensure();
    const unresolved: string[] = [];
    for (const r of l.manifest.records) {
      const found = await resolver.resolve(`img:${r.id}`);
      if (!found) unresolved.push(r.id);
    }
    expect(unresolved).toEqual([]);

    const sample = l.manifest.records.find((r) => r.collection === 'diagrams' && Object.keys(r.treatments).includes('svg-glass')) as ImageRecord;
    const chain = (await catalog.versions(sample.id))['svg-glass'] ?? [];
    expect(chain.length).toBeGreaterThan(0);
    const first = chain[0]!;
    const byToken = await resolver.resolve(`img:${sample.id}#svg-glass@${first.token}`);
    const bySha = await resolver.resolve(`img:${sample.id}#svg-glass@${first.sha8}`);
    expect(byToken?.canonicalPath).toBe(`wiki/image-library/${first.path}`);
    expect(bySha?.canonicalPath).toBe(byToken?.canonicalPath);
    expect(await resolver.resolve('img:does-not-exist')).toBeNull();
    expect(await resolver.resolve('img:' + sample.id + '@v9999')).toBeNull();

    // integrationSrc is set only for files that exist.
    for (const r of l.manifest.records.filter((x) => x.collection === 'diagrams')) {
      for (const [style, t] of Object.entries(r.treatments)) {
        if (!t.path) continue;
        const src = integration.integrationSrc(r, style, t.path);
        if (!src) continue;
        const abs = src.startsWith('/') ? path.join(realRepoRoot, 'site', 'public', src) : path.join(realRepoRoot, src);
        expect(existsSync(abs), `${r.id}/${style} -> ${src}`).toBe(true);
      }
    }
  });

  it('maps comic pages and Journal covers to the website copies', async () => {
    const catalog = new Catalog(realRepoRoot);
    const resolver = createResolver(catalog, new Integration(realRepoRoot));
    if (existsSync(path.join(realRepoRoot, 'site', 'public', 'comic', 'home', 'home-agent-20261008-1600.avif'))) {
      const comic = await resolver.resolve('img:comic-b-home-agent-20261008@current');
      expect(comic?.integrationSrc).toBe('/comic/home/home-agent-20261008-1600.avif');
    }
    const journal = await resolver.resolve('img:scene-journal-access-model-applications@current');
    if (journal) expect(journal.integrationSrc ?? '').toMatch(/access-model-applications/);
  });

  it('pages cards without the heavy fields', async () => {
    const catalog = new Catalog(realRepoRoot);
    const page = await catalog.cards({ collection: 'diagrams', limit: 60 });
    expect(page.items.length).toBe(60);
    expect(JSON.stringify(page).length).toBeLessThan(60_000);
    expect(JSON.stringify(page)).not.toContain('"description"');
  });
});
