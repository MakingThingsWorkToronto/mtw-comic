import { useEffect } from 'preact/hooks';
import { buildUrl } from '../../web/shell/route';
import { navigate } from '../../web/shell/router';
import { Tabs } from '../../web/ui';
import type { ViewProps } from '../types';
import { ContributionsView } from './ContributionsView';
import { DefaultsView } from './DefaultsView';
import { OperationsView } from './OperationsView';
import { TerminalView, TerminalsView } from './TerminalsView';
import { UsageView } from './UsageView';
import './operations.css';

// Heading pattern for modules with a tab bar (Matt: no duplicated headings): the breadcrumb already names the module
// and the active tab names the view, so a view does not repeat either as a visible <h1>. Keep an
// <h1 class="sr-only"> with the view name for screen readers, and keep only the muted line and actions in .page-head.
// Detail pages (one terminal, one record) keep a visible <h1> because they name the thing, not the tab.
export default function OperationsModule({ path, pick }: ViewProps) {
  const view = path[0] ?? 'terminals';
  useEffect(() => {
    if (!path[0] && !pick) navigate(buildUrl('operations', ['terminals']), { replace: true });
  }, [path, pick]);

  return (
    <>
      {!path[1] && (
        <Tabs
          label="Operations views"
          value={view}
          onChange={(id) => navigate(buildUrl('operations', [id]))}
          items={[
            { id: 'terminals', label: 'Terminals' },
            { id: 'usage', label: 'Usage' },
            { id: 'contributions', label: 'Contributions' },
            { id: 'operations', label: 'Procedures' },
            { id: 'defaults', label: 'Defaults' },
          ]}
        />
      )}
      {view === 'defaults' ? <DefaultsView /> : view === 'operations' ? <OperationsView /> : view === 'usage' ? <UsageView /> : view === 'contributions' ? <ContributionsView /> : path[1] ? <TerminalView id={path[1]} /> : <TerminalsView />}
    </>
  );
}
