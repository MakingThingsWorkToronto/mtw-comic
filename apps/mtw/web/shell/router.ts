import { signal } from '@preact/signals';
import { parseLocation } from './route';
import type { ParsedRoute } from './route';

// The router owns navigation state: the URL is the source of truth, `route` mirrors it.
const read = (): ParsedRoute => parseLocation(location.pathname, location.search);
export const route = signal<ParsedRoute>(read());

window.addEventListener('popstate', () => {
  route.value = read();
});

/** `keepScroll`: stay where the reader is (query-only changes on the same page); a new page starts at the top. */
export function navigate(href: string, opts: { replace?: boolean; keepScroll?: boolean } = {}): void {
  if (href === location.pathname + location.search) return;
  if (opts.replace) history.replaceState(null, '', href);
  else history.pushState(null, '', href);
  route.value = read();
  if (!opts.keepScroll) window.scrollTo(0, 0);
}

/** Replace the query string (filters, sort) without adding a history entry. */
export function setQuery(next: Record<string, string | undefined>): void {
  const q = new URLSearchParams(location.search);
  for (const [k, v] of Object.entries(next)) {
    if (v === undefined || v === '') q.delete(k);
    else q.set(k, v);
  }
  const qs = q.toString();
  // Filters, sort and the selected item change in place: never jump the page to the top (Matt, 2026-10-11).
  navigate(location.pathname + (qs ? `?${qs}` : ''), { replace: true, keepScroll: true });
}
