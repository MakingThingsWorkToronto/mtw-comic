import { useState } from 'preact/hooks';
import { Badge, Button } from '../../../web/ui';
import { post } from './hooks';
import type { SlotRecord } from './slotProbe';

/**
 * One reference-slot sheet's state and Matt's decision, on the cast page he is working on: whether stories use it,
 * whether the image catalog holds it, and Approve / Reject through the Images module's decide route.
 */
export function SlotDecision({ name, version, inUse, usedVersion, record }: { name: string; version: number; inUse: boolean; usedVersion: number | null; record: SlotRecord | undefined }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [done, setDone] = useState('');
  const [problem, setProblem] = useState('');
  const decide = async (action: 'approve' | 'reject') => {
    if (!record) return;
    setProblem('');
    try {
      await post('/api/images/decide', { id: record.id, action, style: record.style, version: 'current', ...(action === 'reject' ? { reason } : { scope: 'reference' }) });
      setDone(action === 'approve' ? 'Approved' : 'Rejected');
      setRejecting(false);
    } catch (error) {
      setProblem((error as Error).message);
    }
  };
  const state = done ? done.toLowerCase() : record?.state;
  return (
    <div class="stack" data-slot-decision={version}>
      <p>
        {inUse ? (
          <Badge status="approved">v{version} · {name}'s sheet · used by stories and generation</Badge>
        ) : record ? (
          <Badge status="pending">v{version} · registered · not yet {name}'s sheet</Badge>
        ) : (
          <Badge status="pending">v{version} · newest · not registered yet</Badge>
        )}{' '}
        {state && <span class="muted small">{state}</span>}
      </p>
      {!inUse && usedVersion !== null && <p class="muted small">Stories and image generation use v{usedVersion} until this version becomes {name}'s sheet.</p>}
      {record && !done && (
        <div class="row">
          <Button small variant="primary" help={`Records your approval of v${version} as ${name}'s reference sheet in the image catalog. The next character run then makes it the sheet stories and generation use.`} onClick={() => void decide('approve')}>
            Approve v{version}
          </Button>
          {rejecting ? (
            <>
              <input class="input" aria-label={`Why v${version} is rejected`} placeholder="Why (required)" value={reason} onInput={(e) => setReason((e.target as HTMLInputElement).value)} />
              <Button small disabled={!reason.trim()} help="Records the rejection with your reason. The file is kept." onClick={() => void decide('reject')}>
                Reject
              </Button>
            </>
          ) : (
            <Button small variant="ghost" help={`Rejects v${version} with a reason you type. The file and its record are kept.`} onClick={() => setRejecting(true)}>
              Reject…
            </Button>
          )}
        </div>
      )}
      {done && <p class="muted small">{done}. Recorded in the image catalog's decisions.</p>}
      {problem && <p class="error small">{problem}</p>}
    </div>
  );
}
