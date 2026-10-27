// Migrated from retired git 51eb6e03:wiki/soundtrack-library/index.html (renderReview): rating, Approve / Undo, Find similar, where the track was found.
import { useState } from 'preact/hooks';
import { api } from '../../../web/api';
import { buildUrl } from '../../../web/shell/route';
import { navigate } from '../../../web/shell/router';
import { Badge, Button, ConfirmLaunch } from '../../../web/ui';
import type { DiscoveryRequest, Library, Track } from '../types';
import { act, busy, library } from './data';
import { Stars } from './Stars';

export const FIND_SIMILAR_OPERATION = 'soundtrack-find-similar';

/** The latest request whose basis is this track (open ones win). */
export function requestFor(lib: Library, trackId: string): DiscoveryRequest | undefined {
  const mine = lib.discovery.requests.filter((r) => r.basis === trackId);
  return mine.find((r) => r.status === 'open') ?? mine[mine.length - 1];
}

function FindSimilar({ track, lib }: { track: Track; lib: Library }) {
  const req = requestFor(lib, track.id);
  const [confirming, setConfirming] = useState(false);
  const working = busy.value.has(track.id) || confirming;

  if (req && req.status === 'open') {
    return (
      <span class="snd-inline">
        <Badge status="candidate">Requested {req.requested.slice(0, 10)}</Badge>
        <Button small variant="primary" disabled={working} help="Opens a terminal where an agent searches Pixabay Music for songs like this one and adds what it finds to the library as candidates for you to review. Nothing is approved or downloaded for use." onClick={() => setConfirming(true)}>
          Run discovery now
        </Button>
        {confirming && req && (
          <ConfirmLaunch
            operation={FIND_SIMILAR_OPERATION}
            title="Run discovery now"
            body="Choose which agent, model and effort search for songs like this one. Nothing starts until you press Launch."
            onClose={() => setConfirming(false)}
            run={([runner, permission, choice]) => api.launch(FIND_SIMILAR_OPERATION, { track: `snd:${track.id}`, request: req.id }, runner, permission === 'default' ? undefined : permission, choice)}
          />
        )}
      </span>
    );
  }
  return (
    <span class="snd-inline">
      <Button small disabled={working} help="Files a request to find songs like this one. It only records the request; the search itself starts when you press Run discovery now." onClick={() => void act(track.id, 'similar')}>
        Find similar
      </Button>
      {req && (
        <span class="muted">
          Last search {(req.done || req.requested).slice(0, 10)}
          {req.found != null ? `, ${req.found} found` : ''}
        </span>
      )}
    </span>
  );
}

export function ReviewBox({ track }: { track: Track }) {
  const lib = library.value;
  if (!lib) return null;
  const pending = busy.value.has(track.id);
  const dv = track.discovery;
  const run = dv && lib.discovery.runs.find((r) => r.id === dv.run);
  const basis = dv?.basis ? lib.tracks.find((t) => t.id === dv.basis) : undefined;
  const canUndo = track.status === 'approved' && track.approvedVia === 'console' && !(track.usedBy || []).length;

  return (
    <div class="snd-review" aria-label="Review">
      <div class="snd-review-row">
        <span class="snd-review-label">Your rating</span>
        <Stars large subject={track.title} value={track.rating || 0} disabled={pending} onRate={(r) => void act(track.id, 'rate', r)} />
        {track.status === 'candidate' && (
          <Button variant="primary" disabled={pending} help="Marks this candidate track as approved for use, once its credit and licence are on file. It only records your decision; the audio file is not changed, and you can undo it until a page uses the track." onClick={() => void act(track.id, 'approve')}>
            Approve for use
          </Button>
        )}
        {track.status === 'approved' && <Badge status="approved">Approved{track.approved ? ` ${track.approved}` : ''}</Badge>}
        {canUndo && (
          <Button disabled={pending} help="Puts this track back to candidate. Only possible while no page uses it. The audio file is not changed." onClick={() => void act(track.id, 'unapprove')}>
            Undo approval
          </Button>
        )}
        <FindSimilar track={track} lib={lib} />
      </div>
      {dv && (
        <p class="snd-found">
          Found by {run ? run.label : dv.run}
          {basis ? `, like "${basis.title}"` : ''}
          {dv.why ? `: ${dv.why}` : ''}
          {dv.cid ? ' Content ID registered: a YouTube upload may be claimed; the website is unaffected.' : ''}
        </p>
      )}
    </div>
  );
}
