import type { ComponentType } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { findClientModule } from '../../modules/client-registry';
import type { ViewProps } from '../../modules/types';
import { EmptyState } from '../ui/Layout';
import { Breadcrumbs } from './Breadcrumbs';
import { Header } from './Header';
import { Home } from './Home';
import { Nav, navCollapsed } from './Nav';
import { route } from './router';

function ModuleHost({ id, path, query }: { id: string; path: string[]; query: URLSearchParams }) {
  const [view, setView] = useState<{ id: string; View: ComponentType<ViewProps> } | null>(null);
  const mod = findClientModule(id);

  useEffect(() => {
    if (!mod) return;
    let live = true;
    void mod.load().then((m) => live && setView({ id, View: m.default }));
    return () => {
      live = false;
    };
  }, [id, mod]);

  if (!mod) return <EmptyState>No module named "{id}".</EmptyState>;
  if (!view || view.id !== id) return <EmptyState>Loading.</EmptyState>;
  return <view.View path={path} query={query} />;
}

export function App() {
  const r = route.value;
  return (
    <>
      <a class="skip" href="#main">
        Skip to content
      </a>
      <Header />
      <div class="shell" data-collapsed={navCollapsed.value}>
        <Nav />
        <main class="content" id="main" tabIndex={-1}>
          <Breadcrumbs />
          {r.module ? <ModuleHost key={r.module} id={r.module} path={r.path} query={r.query} /> : <Home />}
        </main>
      </div>
    </>
  );
}
