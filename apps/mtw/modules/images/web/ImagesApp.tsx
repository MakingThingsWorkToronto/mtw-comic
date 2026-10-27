// Shell of the Images views: title, tabs and the active view. Used by the app module and the static snapshot.
import { TabActions, Tabs } from '../../../web/ui/Layout';
import { AddResourceButton } from '../../../web/ui/ResourceForm';
import { COLLECTION_ORDER } from '../shared/types';
import { Evidence } from './Evidence';
import { useHost } from './host';
import { Library } from './Library';
import { RecordView } from './Record';
import { Sweep } from './Sweep';

export function ImagesApp() {
  const host = useHost();
  // Pick mode embeds only the library inside AssetField's dialog.
  if (host.pick) return <Library />;
  const tabs = [
    { id: 'library', label: 'Library' },
    { id: 'evidence', label: 'Evidence' },
    ...(host.data.sweep ? [{ id: 'sweep', label: 'Registration' }] : []),
  ];
  const active = host.view === 'record' ? 'library' : host.view;
  return (
    <div class="page img-module">
      {host.view !== 'record' && (
        <>
          <Tabs
            label="Images views"
            value={active}
            onChange={(id) => host.go(host.href(id as 'library' | 'evidence' | 'sweep'))}
            items={tabs}
          />
          {host.mode === 'snapshot' ? (
            <TabActions>
              <a href="all-files.html">All files</a>
            </TabActions>
          ) : (
            <TabActions>
              <AddResourceButton kind="image" options={{ collection: COLLECTION_ORDER }} />
            </TabActions>
          )}
          <div class="page-head">
            <div class="title-block">
              <h1 class="sr-only">Images</h1>
              <p class="sub">{host.mode === 'snapshot' ? 'Static snapshot of wiki/image-library.' : 'wiki/image-library'}</p>
            </div>
          </div>
        </>
      )}
      {host.view === 'record' && host.id ? <RecordView id={host.id} key={host.id} /> : host.view === 'evidence' ? <Evidence /> : host.view === 'sweep' && host.data.sweep ? <Sweep /> : <Library />}
    </div>
  );
}
