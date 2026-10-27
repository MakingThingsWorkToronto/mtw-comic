// New. Spend module shell. Heading pattern (see operations/client.tsx): the tab names the view, so each view keeps
// an sr-only <h1>. Every money figure is an ESTIMATE (API-equivalent, subscription) and is always marked as one.
import { useEffect } from 'preact/hooks';
import { buildUrl } from '../../web/shell/route';
import { navigate } from '../../web/shell/router';
import { Tabs } from '../../web/ui';
import type { ViewProps } from '../types';
import { BudgetsView } from './BudgetsView';
import { Overview } from './Overview';
import { ProvidersView } from './ProvidersView';
import { RunsView } from './RunsView';
import './spend.css';

export default function SpendModule({ path, pick }: ViewProps) {
  const view = path[0] ?? 'overview';
  useEffect(() => {
    if (!path[0] && !pick) navigate(buildUrl('spend', ['overview']), { replace: true });
  }, [path, pick]);
  return (
    <>
      <Tabs
        label="Spend views"
        value={view}
        onChange={(id) => navigate(buildUrl('spend', [id]))}
        items={[
          { id: 'overview', label: 'Overview' },
          { id: 'runs', label: 'Runs' },
          { id: 'budgets', label: 'Budgets' },
          { id: 'providers', label: 'Providers' },
        ]}
      />
      {view === 'runs' ? <RunsView /> : view === 'budgets' ? <BudgetsView /> : view === 'providers' ? <ProvidersView /> : <Overview />}
    </>
  );
}
