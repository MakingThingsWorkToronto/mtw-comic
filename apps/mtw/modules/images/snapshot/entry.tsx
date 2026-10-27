// New. Entry of the static snapshot bundle (built by server/export.ts into a classic IIFE: no module scripts, no network).
// Hash routing keeps it working from file://. `#image=<id>` from the legacy browser still opens a record.
import { render } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import '../../../web/theme/fonts.css';
import '../../../web/theme/tokens.css';
import '../../../web/theme/app.css';
import '../../../web/ui/ui.css';
import '../web/images.css';
import type { Manifest } from '../shared/types';
import { HostContext } from '../web/host';
import type { Host, ImagesView } from '../web/host';
import { ImagesApp } from '../web/ImagesApp';
import { createSnapshotData } from './data';
import type { DecisionRow } from './data';

declare global {
  interface Window {
    MTW_LIBRARY?: Manifest;
    MTW_DECISIONS?: DecisionRow[];
  }
}

function parseHash(hash: string): { view: ImagesView; id?: string; query: URLSearchParams } {
  const body = hash.replace(/^#/, '');
  const legacy = /^image=(.+)$/.exec(body);
  if (legacy) return { view: 'record', id: decodeURIComponent(legacy[1] as string), query: new URLSearchParams() };
  const [pathPart = '', search = ''] = body.split('?');
  const parts = pathPart.split('/').filter(Boolean).map(decodeURIComponent);
  const query = new URLSearchParams(search);
  if (parts[0] === 'record' && parts[1]) return { view: 'record', id: parts[1], query };
  if (parts[0] === 'evidence') return { view: 'evidence', query };
  return { view: 'library', query };
}

function hashHref(view: ImagesView, id?: string, query?: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) if (v) q.set(k, v);
  const path = view === 'record' ? `record/${encodeURIComponent(id ?? '')}` : view === 'library' ? '' : view;
  const qs = q.toString();
  return `#/${path}${qs ? `?${qs}` : ''}`;
}

function Root({ lib, rows }: { lib: Manifest; rows: DecisionRow[] }) {
  const data = useMemo(() => createSnapshotData(lib, rows), [lib, rows]);
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const on = (): void => setHash(location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const route = parseHash(hash);
  const host = useMemo<Host>(
    () => ({
      mode: 'snapshot',
      data,
      view: route.view,
      ...(route.id ? { id: route.id } : {}),
      query: route.query,
      href: hashHref,
      go: (href, opts) => {
        if (opts?.replace) location.replace(href);
        else location.hash = href;
      },
      setQuery: (patch) => {
        const q = new URLSearchParams(parseHash(location.hash).query);
        for (const [k, v] of Object.entries(patch)) {
          if (v === undefined || v === '') q.delete(k);
          else q.set(k, v);
        }
        const current = parseHash(location.hash);
        location.replace(hashHref(current.view, current.id, Object.fromEntries(q)));
      },
      changeToken: 0,
    }),
    [data, hash],
  );
  return (
    <HostContext.Provider value={host}>
      <main class="content">
        <ImagesApp />
      </main>
    </HostContext.Provider>
  );
}

const lib = window.MTW_LIBRARY;
const mount = document.getElementById('app');
if (lib && Array.isArray(lib.records) && mount) render(<Root lib={lib} rows={window.MTW_DECISIONS ?? []} />, mount);
