// Registry and reachability check for Comic B (skill: mtw-comic-story), run by comic-story-check.mjs --registry.
// The issue registry (src/data/comic-stories/index.ts) must match the pages: each -b page and A page exists, each -b page
// renders its own story, slugs, story ids and issue numbers are unique and in order, the reader routes exist, covers are
// panels of a story, and NEXT choices to -b pages are registered. Every issue must reach every other within 2
// interactions: a NEXT choice or the prev/next issue link is 1, the Issues overlay is 2 (open, pick). With an origin, it
// also checks the served pages: each overlay lists every issue in its own mode, prev/next exist, reader choices never
// point at -b pages, and the shelf lists every issue.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { checkArtFile } from './comic-story-art-check.mjs';

export async function registryCheck(site, origin, { requireArt = false } = {}) {
  const out = [];
  const err = (msg) => out.push(['ERROR', msg]);
  const warn = (msg) => out.push(['WARN', msg]);
  const ok = (msg) => out.push(['ok', msg]);
  const reg = await import(pathToFileURL(join(site, 'src/data/comic-stories/index.ts')).href);
  const issues = reg.comicIssues;
  const bare = (href) => href.replace(/[?#].*$/, '');
  const pageFile = (href) => {
    const path = bare(href).replace(/^\/|\/$/g, '') || 'index';
    if (issues.some(i => `/comics/${i.slug}` === '/' + path)) return join(site, 'src/pages/comics/[issue].astro');
    return [`src/pages/${path}.astro`, `src/pages/${path}/index.astro`].map((f) => join(site, f)).find((f) => existsSync(f));
  };
  const uniq = (key, f) => { const seen = new Set(); issues.forEach((i) => { const v = f(i); if (seen.has(v)) err(`duplicate ${key} ${v}`); seen.add(v); }); };
  uniq('slug', (i) => i.slug); uniq('story id', (i) => i.story.id); uniq('issue number', (i) => i.story.issue); uniq('-b page', (i) => i.bPage);
  issues.forEach((i, k) => { if (i.story.issue !== k + 1) err(`issue numbers are not 1..${issues.length} in order (found ${i.story.issue} at position ${k + 1})`); });
  if (!existsSync(join(site, 'src/pages/comics/[issue].astro'))) err('the reader route src/pages/comics/[issue].astro is missing');
  if (!existsSync(join(site, 'src/pages/comics/index.astro'))) err('the shelf src/pages/comics/index.astro is missing');

  // Which exported name and file each story has, to see that each -b page ships its own story.
  const exportsOf = {};
  for (const f of readdirSync(join(site, 'src/data/comic-stories')).filter((f) => f.endsWith('.ts') && !['index.ts', 'types.ts'].includes(f))) {
    const mod = await import(pathToFileURL(join(site, 'src/data/comic-stories', f)).href);
    for (const [name, v] of Object.entries(mod)) if (v && v.scenes && v.id) exportsOf[v.id] = { name, file: f.replace(/\.ts$/, '') };
  }
  for (const i of issues) {
    const t = `issue ${i.story.issue} (${i.slug})`;
    if (!/^[a-z0-9-]+$/.test(i.slug)) err(`${t}: slug is not a-z, 0-9, -`);
    const ex = exportsOf[i.story.id];
    if (!ex) err(`${t}: story ${i.story.id} has no authored source`);
    if (!pageFile(`/comics/${i.slug}/`)) err(`${t}: standalone reader is missing`);
    if (!/^https:\/\//.test(i.aPage)) err(`${t}: the external related-page link must be HTTPS`);
    const owner = issues.map((x) => x.story).find((st) => st.scenes.some((sc) => sc.panels.some((p) => p.img === i.cover)));
    if (!i.cover.startsWith('/') && !owner) err(`${t}: cover ${i.cover} is not a panel of any story`);
    out.push(...checkArtFile(reg.artSrc(i.cover, i.story), { publicDir: join(site, 'public'), label: `${t} cover`, requireArt }));
    for (const c of i.story.next.choices) {
      if (/-b\/?$/.test(bare(c.href)) && !issues.some((x) => x.bPage === bare(c.href))) err(`${t}: choice "${c.label}" goes to ${c.href}, a -b page not in the registry`);
      const href = reg.choiceHref(c.href, 'standalone');
      if (!/^https:\/\//.test(href) && !pageFile(href)) err(`${t}: choice "${c.label}" goes to ${c.href}, which is not a page`);
    }
  }

  // Reachability.
  const n = issues.length, d = issues.map(() => issues.map(() => 1e9));
  issues.forEach((i, a) => {
    issues.forEach((_, b) => { d[a][b] = a === b ? 0 : 2; }); // the Issues overlay: open, pick
    d[a][(a + 1) % n] = Math.min(d[a][(a + 1) % n], 1);
    d[a][(a - 1 + n) % n] = Math.min(d[a][(a - 1 + n) % n], 1);
    i.story.next.choices.forEach((c) => { const b = issues.findIndex((x) => x.bPage === bare(c.href)); if (b > -1 && b !== a) d[a][b] = 1; });
  });
  for (let k = 0; k < n; k++) for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) d[a][b] = Math.min(d[a][b], d[a][k] + d[k][b]);
  let worst = 0;
  issues.forEach((i, a) => issues.forEach((j, b) => { if (d[a][b] > 2) err(`issue ${i.story.issue} reaches issue ${j.story.issue} in ${d[a][b]} interactions`); worst = Math.max(worst, d[a][b]); }));
  ok(`${n} issues; every issue reaches every other within ${worst} interaction(s); matrix ${issues.map((i, a) => `${i.story.issue}:${issues.map((_, b) => d[a][b]).join('')}`).join(' ')}`);
  const direct = issues.map((i, a) => issues.filter((_, b) => b !== a && d[a][b] === 1).length);
  ok(`one-interaction links per issue (choices plus prev/next): ${direct.join(', ')}`);

  if (origin) {
    for (const i of issues) for (const [mode, path] of [['standalone', `/comics/${i.slug}/`]]) {
      const res = await fetch(origin + path + '?reel=off').catch(() => null);
      if (!res || !res.ok) { err(`${path}: HTTP ${res ? res.status : 'unreachable'}`); continue; }
      const html = await res.text();
      const want = issues.map((x) => (mode === 'standalone' ? `/comics/${x.slug}/` : x.bPage));
      const listed = [...html.matchAll(/class="cs-issue" href="([^"]+)"/g)].map((m) => m[1]);
      if (want.join() !== listed.join()) err(`${path}: the Issues overlay lists ${listed.join(' ') || 'nothing'}, expected ${want.join(' ')}`);
      if (!/data-issue-step="prev"/.test(html) || !/data-issue-step="next"/.test(html)) err(`${path}: no prev/next issue links`);
      if (!new RegExp(`"mode":"${mode}"`).test(html)) err(`${path}: #comic-config is not mode ${mode}`);
      if (mode === 'standalone') for (const m of html.matchAll(/class="cs-choice" href="([^"]+)"/g)) if (issues.some((x) => x.bPage === bare(m[1]))) err(`${path}: a choice still points at the -b page ${m[1]}`);
    }
    const shelf = await fetch(origin + '/comics/').catch(() => null);
    const covers = shelf && shelf.ok ? [...(await shelf.text()).matchAll(/class="cover" href="([^"]+)"/g)].map((m) => m[1]) : [];
    if (covers.join() !== issues.map((x) => `/comics/${x.slug}/`).join()) err(`/comics/ shelf lists ${covers.join(' ') || 'nothing'}`);
    else ok(`/comics/ shelf lists all ${n} issues`);
    ok(`served pages checked on ${origin}`);
  }
  return out;
}
