// Images module client entry (migrated from the retired image console, git 51eb6e03:wiki/image-library/{index.html,browser.js}). Builds the app Host for the
// shared views: server data, shell router, SSE-driven "changed on disk" token, terminal launch.
import { useMemo, useState } from 'preact/hooks';
import { api } from '../../web/api';
import { buildUrl } from '../../web/shell/route';
import { navigate, setQuery as setShellQuery } from '../../web/shell/router';
import { useWikiChanged } from '../../web/state';
import { LaunchPicker } from '../../web/ui';
import type { ViewProps } from '../types';
import { createAppData } from './web/appData';
import { HostContext } from './web/host';
import type { Host, ImagesView } from './web/host';
import { ImagesApp } from './web/ImagesApp';
import './web/images.css';

const data = createAppData();

function parsePath(path: string[]): { view: ImagesView; id?: string } {
  if (path[0] === 'record' && path[1]) return { view: 'record', id: path[1] };
  if (path[0] === 'evidence') return { view: 'evidence' };
  if (path[0] === 'sweep') return { view: 'sweep' };
  return { view: 'library' };
}

function appHref(view: ImagesView, id?: string, query?: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) if (v) q.set(k, v);
  return buildUrl('images', view === 'record' ? ['record', id ?? ''] : view === 'library' ? [] : [view], q);
}

async function launchOperation(id: string, params: Record<string, string>, args?: [string, string, { model?: string; effort?: string }]): Promise<void> {
  if (!args) throw new Error('The agent choices are still loading; try again in a moment.');
  const t = await api.launch(id, params, args[0], args[1] === 'default' ? undefined : args[1], args[2]);
  navigate(buildUrl('operations', ['terminals', t.id]));
}

export default function ImagesModule({ path, query, pick }: ViewProps) {
  // In a picker dialog the filters are local so the page URL is never touched.
  const [local, setLocal] = useState(() => new URLSearchParams());
  // Views show "Changed on disk. Reload" instead of refetching under the human's hands.
  const [token, setToken] = useState(0);
  useWikiChanged('images', () => setToken((n) => n + 1));
  const route = parsePath(path);

  const host = useMemo<Host>(() => {
    if (pick) {
      return {
        mode: 'app',
        data,
        view: 'library',
        query: local,
        href: () => '#',
        go: () => undefined,
        setQuery: (patch) =>
          setLocal((prev) => {
            const next = new URLSearchParams(prev);
            for (const [k, v] of Object.entries(patch)) {
              if (v === undefined || v === '') next.delete(k);
              else next.set(k, v);
            }
            return next;
          }),
        changeToken: 0,
        pick: pick.onPick,
      };
    }
    return {
      mode: 'app',
      data,
      view: route.view,
      ...(route.id ? { id: route.id } : {}),
      query,
      href: appHref,
      go: (href, opts) => navigate(href, opts),
      setQuery: setShellQuery,
      changeToken: token,
      launchOperation,
      LaunchPicker,
    };
  }, [pick, local, route.view, route.id, query, token]);

  return (
    <HostContext.Provider value={host}>
      <ImagesApp />
    </HostContext.Provider>
  );
}
