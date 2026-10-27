import { Badge } from '../../../web/ui';
import type { BadgeStatus } from '../../../web/ui';
import type { PlanStatus } from '../types';

const MAP: Record<PlanStatus, { status: BadgeStatus; label: string }> = {
  draft: { status: 'candidate', label: 'Draft' },
  approved: { status: 'approved', label: 'Approved' },
  executing: { status: 'running', label: 'Running' },
  executed: { status: 'exited', label: 'Executed' },
  partial: { status: 'pending', label: 'Partial' },
  cancelled: { status: 'rejected', label: 'Cancelled' },
};

export function StatusBadge({ status }: { status: PlanStatus }) {
  const m = MAP[status];
  return <Badge status={m.status}>{m.label}</Badge>;
}
