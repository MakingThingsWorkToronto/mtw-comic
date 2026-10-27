import fs from 'node:fs';
import path from 'node:path';
const base = process.argv[2];
if (!base || !/^https:\/\//.test(base)) throw Error('Usage: npm run test:live -- https://your-project.vercel.app');
const root = path.resolve(import.meta.dirname, '..'), dist = path.join(root, 'site/dist');
const requests = new Set(['/']), failed = [], pages = [];
function add(value, relative = '/') {
  if (!value || /^(?:data:|#|mailto:|tel:|javascript:)/.test(value)) return;
  const url = new URL(value, new URL(relative, base));
  if (url.origin === new URL(base).origin) requests.add(url.pathname);
}
function media(value) {
  if (typeof value === 'string' && /^\/(?:comic|audio|images|fonts|marks|scripts)\//.test(value) && /\.[a-z0-9]{2,5}(?:[?#]|$)/i.test(value)) add(value);
  else if (Array.isArray(value)) value.forEach(media);
  else if (value && typeof value === 'object') Object.values(value).forEach(media);
}
function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) walk(file);
    else if (item.name.endsWith('.html')) {
      const relative = '/' + path.relative(dist, file).replaceAll('\\', '/').replace(/index\.html$/, '');
      pages.push(relative); add(relative);
      const html = fs.readFileSync(file, 'utf8');
      for (const match of html.matchAll(/(?:src|href)=["'](\/[^"']+)["']/g)) add(match[1]);
      for (const match of html.matchAll(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/g)) {
        try { media(JSON.parse(match[1])); } catch { /* Other application metadata need not be player data. */ }
      }
    } else if (item.name.endsWith('.css')) {
      const relative = '/' + path.relative(dist, file).replaceAll('\\', '/');
      for (const match of fs.readFileSync(file, 'utf8').matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) add(match[1], relative);
    }
  }
}
walk(dist);
const paths = [...requests]; let next = 0;
await Promise.all(Array.from({ length: 6 }, async () => {
  while (next < paths.length) {
    const resource = paths[next++];
    try {
      const response = await fetch(new URL(resource, base), { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(20000) });
      const type = response.headers.get('content-type') || '';
      if (!response.ok || resource.endsWith('.js') && !/javascript/.test(type)) failed.push({ resource, status: response.status, type });
    } catch (error) { failed.push({ resource, error: error.message }); }
  }
}));
console.log(JSON.stringify({ host: base, pages: pages.length, resources: paths.length, passed: paths.length - failed.length, failed }, null, 2));
process.exitCode = failed.length ? 1 : 0;
