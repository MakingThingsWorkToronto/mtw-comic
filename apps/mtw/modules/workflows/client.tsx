// New module (no wiki origin). Routes: /m/workflows (list), /m/workflows/<id> (detail), /m/workflows/run/<runId> (run view).
import type { ViewProps } from '../types';
import { DetailPage, ListPage, RunPage } from './ui/Views';
import './workflows.css';

export default function WorkflowsModule({ path }: ViewProps) {
  if (path[0] === 'run' && path[1]) return <RunPage runId={path[1]} />;
  if (path[0]) return <DetailPage id={path[0]} />;
  return <ListPage />;
}
