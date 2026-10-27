// Schedules module views: the list (enabled toggle, next and last run, Run now) and the schedule detail/edit form.
import { Link } from '../../web/shell/Link';
import { buildUrl } from '../../web/shell/route';
import { EmptyState } from '../../web/ui';
import type { ViewProps } from '../types';
import { copy } from './copy';
import { ScheduleDetail } from './ui/Detail';
import { ScheduleList } from './ui/List';
import { useRemote } from './ui/util';
import type { ListResponse } from './ui/util';
import './schedules.css';

function ListPage() {
  const { data, error, reload } = useRemote<ListResponse>('/list', { pollMs: 5000 });
  return (
    <div class="page">
      <div class="page-head">
        <div class="title-block">
          <h1>{copy.title}</h1>
          <p class="sub">{copy.sub}</p>
        </div>
        <Link class="btn btn--primary" href={buildUrl('schedules', ['new'])} title="Opens a blank form to set up a new schedule: which jobs run, in what order and when. Nothing is created or switched on until you save it, and switching it on is a separate step.">
          {copy.list.new}
        </Link>
      </div>
      {error && <p role="alert" style="color:var(--error)">{error}</p>}
      {data ? <ScheduleList data={data} reload={reload} /> : !error && <EmptyState>Loading.</EmptyState>}
    </div>
  );
}

export default function SchedulesModule({ path }: ViewProps) {
  return path[0] ? <ScheduleDetail id={path[0]} /> : <ListPage />;
}
