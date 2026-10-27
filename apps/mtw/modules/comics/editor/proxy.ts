// Comic Editor: a minimal reverse proxy to the site dev server so the reader iframe is same-origin with the app
// (the geometry hook only answers a same-origin postMessage). New for the MTW app.
//
// LIMIT: the core router has no wildcard or root-path routes, so this mounts at /api/comics/editor/site?u=<path>
// and rewrites reader-owned HTML/JSON/CSS resources and dynamic local requests through it. Vite/Astro dev internals (/@vite/client, module imports
// of /node_modules/..., the HMR websocket) are root paths, so full fidelity needs a core root-level proxy
// (see the report); the page itself, its data, art and the engine script work through this route.
import type { RawResponse } from '../../types';
import { PROXY_PATH, proxied } from './proxy-url';

export { PROXY_PATH, proxied };

const ATTR = /(\s(?:src|href|action|poster|data-src|srcset)=)(["'])(\/(?!\/)[^"']*)\2/g;

// Studio's Comic review crops the framed reader to one box, so the reader's own out-of-view pause (an IntersectionObserver
// under 35% visible) fired a moment into every Play. In that frame only (?studioFrame=1), observers report full view.
const FRAME_SHIM = `<script>(function(){if(!/[?&]studioFrame=1(&|$)/.test(location.search))return;function O(cb){this.cb=cb}O.prototype.observe=function(el){var self=this;setTimeout(function(){self.cb([{target:el,isIntersecting:true,intersectionRatio:1,boundingClientRect:el.getBoundingClientRect(),intersectionRect:el.getBoundingClientRect(),rootBounds:null,time:performance.now()}],self)},0)};O.prototype.unobserve=function(){};O.prototype.disconnect=function(){};O.prototype.takeRecords=function(){return[]};window.IntersectionObserver=O})();</script>`;

const SHIM = `<script>(function(){var P=${JSON.stringify(PROXY_PATH)};function w(u){var s=typeof u==='string'?u:u instanceof URL?u.href:null;if(s===null||s.slice(0,2)==='//')return u;try{var v=new URL(s,document.baseURI);if(v.origin!==location.origin||v.pathname===P||!(s.charAt(0)==='/'||/^https?:/.test(s)))return u;return P+'?u='+encodeURIComponent(v.pathname)+(v.search?'&'+v.search.slice(1):'')+v.hash}catch(e){return u}}function ss(v){var text=String(v);if(/(?:^|,)\\s*data:/i.test(text))return text;return text.split(',').map(function(c){return c.replace(/^(\\s*)(\\S+)/,function(_,space,url){return space+w(url)})}).join(',')}var f=window.fetch;if(f)window.fetch=function(i,o){var input=i;if(typeof Request!=='undefined'&&i instanceof Request){var url=w(i.url);if(url!==i.url)input=new Request(url,i)}else input=w(i);return f.call(this,input,o)};var x=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u){arguments[1]=w(u);return x.apply(this,arguments)};function prop(C,key){if(!C)return;var d=Object.getOwnPropertyDescriptor(C.prototype,key);if(!d||!d.set||!d.get||!d.configurable)return;Object.defineProperty(C.prototype,key,{configurable:d.configurable,enumerable:d.enumerable,get:d.get,set:function(v){d.set.call(this,key==='srcset'?ss(v):w(v))}})}[['HTMLImageElement',['src','srcset']],['HTMLSourceElement',['src','srcset']],['HTMLMediaElement',['src']]].forEach(function(pair){pair[1].forEach(function(key){prop(window[pair[0]],key)})});var a=Element.prototype.setAttribute;Element.prototype.setAttribute=function(k,v){if(/^(IMG|SOURCE|AUDIO|VIDEO|SCRIPT)$/.test(this.tagName)&&/^(src|srcset)$/i.test(k))v=k.toLowerCase()==='srcset'?ss(v):w(v);return a.call(this,k,v)}})();</script>`;

const localResource = (url: string): string => url.startsWith('/') && !url.startsWith('//') && !url.startsWith(PROXY_PATH) ? proxied(url) : url;
const srcsetResource = (value: string): string => /(?:^|,)\s*data:/i.test(value) ? value : value.split(',').map(candidate => candidate.replace(/^(\s*)(\S+)/, (_m, space: string, url: string) => space + localResource(url))).join(',');

/** Only reader-owned playback keys change; catalog/native authority and written prose are data, not requests. */
export function rewriteComicData(value: unknown, key = ''): unknown {
  if (key === 'canonicalSource') return value;
  if (typeof value === 'string') return ['src', 'paperTile'].includes(key) ? localResource(value) : value;
  if (Array.isArray(value)) return key === 'alternates' ? value.map(v => typeof v === 'string' ? localResource(v) : v) : value.map(v => rewriteComicData(v));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([name, child]) => [name, key === 'paperGrain' && ['light', 'dark'].includes(name) && typeof child === 'string' ? localResource(child) : rewriteComicData(child, name)]));
}

/** CSS resolves relative resources against the upstream stylesheet, never the proxy's query-string route. */
export function rewriteCss(css: string, sitePath = '/'): string {
  return css.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (match, quote: string, raw: string) => {
    const url = raw.trim();
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url) || url.startsWith(PROXY_PATH)) return match;
    const target = new URL(url, 'http://upstream.invalid' + sitePath);
    return `url(${quote}${proxied(target.pathname + target.search) + target.hash}${quote})`;
  });
}

/** The site's dev reload client: Studio reloads the frame itself, and inside the frame its root imports resolved against
 * Studio ("/node_modules/vite/dist/client/env.mjs" 404, "Unexpected token '.'"). */
const VITE_CLIENT = /<script[^>]*\ssrc=["']\/@vite\/client["'][^>]*>\s*<\/script>/g;

export function rewriteHtml(html: string, sitePath = '/'): string {
  const tagResources = (tag: string): string => tag.replace(ATTR, (_m, attr: string, quote: string, url: string) => `${attr}${quote}${(/srcset=/i.test(attr) ? srcsetResource(url) : localResource(url)).replace(/&/g, '&amp;')}${quote}`);
  const out = html.replace(VITE_CLIENT, '')
    .replace(/<(script|style)\b([^>]*)>([\s\S]*?)<\/\1>|<[^>]*>/gi, (match, kind: string | undefined, attrs: string, content: string) => {
      if (!kind) return tagResources(match);
      let body = content;
      if (kind.toLowerCase() === 'style') body = rewriteCss(content, sitePath);
      else if (/\bid=["']comic-(?:story|config)["']/.test(attrs) && /\btype=["']application\/json["']/.test(attrs)) {
        try { body = JSON.stringify(rewriteComicData(JSON.parse(content))).replace(/</g, '\\u003c'); } catch { /* Preserve malformed data for the reader's own failure. */ }
      }
      return tagResources(`<${kind}${attrs}>`) + body + `</${kind}>`;
    });
  return out.includes('<head') ? out.replace(/<head([^>]*)>/, `<head$1>${SHIM}${FRAME_SHIM}`) : SHIM + FRAME_SHIM + out;
}

/** Fetch a site path through the configured base URL. Never follows to another host. */
export async function forwardToSite(base: string, sitePath: string, search: string, headers: Record<string, string | string[] | undefined> = {}): Promise<RawResponse> {
  if (!sitePath.startsWith('/') || sitePath.startsWith('//') || sitePath.includes('\\')) return { __raw: true, status: 400, body: 'bad path' };
  const origin = new URL(base).origin;
  const target = new URL(sitePath + (search ? `?${search}` : ''), origin);
  if (target.origin !== origin) return { __raw: true, status: 400, body: 'bad path' };
  const fwd: Record<string, string> = { accept: String(headers.accept ?? '*/*') };
  if (headers.range) fwd.range = String(headers.range);
  let res: Response;
  try {
    res = await fetch(target, { headers: fwd, redirect: 'manual' });
  } catch {
    return { __raw: true, status: 502, headers: { 'content-type': 'text/plain; charset=utf-8' }, body: `The site dev server is not reachable at ${origin}. Start it, or set siteBaseUrl in wiki/operations/editor.json.` };
  }
  const type = res.headers.get('content-type') ?? 'application/octet-stream';
  const keep: Record<string, string> = { 'content-type': type, 'cache-control': 'no-store' };
  for (const h of ['content-range', 'accept-ranges']) {
    const v = res.headers.get(h);
    if (v) keep[h] = v;
  }
  const loc = res.headers.get('location');
  if (loc && res.status >= 300 && res.status < 400) {
    const next = new URL(loc, origin);
    if (next.origin === origin) keep.location = proxied(next.pathname + next.search);
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (/text\/html/i.test(type)) return { __raw: true, status: res.status, headers: keep, body: rewriteHtml(new TextDecoder().decode(bytes), sitePath) };
  if (/text\/css/i.test(type)) return { __raw: true, status: res.status, headers: keep, body: rewriteCss(new TextDecoder().decode(bytes), sitePath) };
  return { __raw: true, status: res.status, headers: keep, body: bytes };
}
