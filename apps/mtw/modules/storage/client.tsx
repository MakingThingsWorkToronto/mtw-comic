import { useEffect } from 'preact/hooks';
import { buildUrl } from '../../web/shell/route';
import { navigate } from '../../web/shell/router';
import { Tabs } from '../../web/ui';
import type { ViewProps } from '../types';
import { OverviewView } from './OverviewView';
import { PlanView } from './PlanView';
import { PlansView } from './PlansView';
import './storage.css';

export default function StorageModule({ path, pick }: ViewProps) {
  const view = path[0] ?? 'overview';
  useEffect(() => {
    if (!path[0] && !pick) navigate(buildUrl('storage', ['overview']), { replace: true });
  }, [path, pick]);

  const detail = view === 'plans' && path[1];
  return (
    <>
      {!detail && (
        <Tabs
          label="Storage views"
          value={view === 'plans' ? 'plans' : 'overview'}
          onChange={(id) => navigate(buildUrl('storage', [id]))}
          items={[
            { id: 'overview', label: 'Overview' },
            { id: 'plans', label: 'Plans' },
          ]}
        />
      )}
      {detail ? <PlanView id={path[1] as string} /> : view === 'plans' ? <PlansView /> : <OverviewView />}
    </>
  );
}
