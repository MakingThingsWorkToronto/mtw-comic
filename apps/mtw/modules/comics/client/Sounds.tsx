import { AudioPlayer, Badge, EmptyState, Table } from '../../../web/ui';
import { secs, useView } from './hooks';
import type { SoundsData } from './types';

export function SoundsView() {
  const { data, error } = useView<SoundsData>('/api/comics/sounds');
  if (error) return <EmptyState>{error}</EmptyState>;
  if (!data) return <EmptyState>Loading.</EmptyState>;
  return (
    <div class="stack">
      <h2>Rooms</h2>
      <Table
        columns={[
          { key: 'room', header: 'Room', render: (s) => s.room },
          { key: 'status', header: 'Status', render: (s) => <Badge status={s.productionApproved ? 'approved' : 'candidate'}>{s.productionApproved ? 'approved' : s.status}</Badge> },
          { key: 'level', header: 'Level', render: (s) => (s.integratedLufs !== null ? `${s.integratedLufs} LUFS · peak ${s.truePeakDbfs} dBFS` : '-') },
          { key: 'loop', header: 'Loop', render: (s) => (s.loop ? 'yes' : 'no') },
          { key: 'play', header: 'Play', render: (s) => (s.preview ? <AudioPlayer src={s.preview} label={`${s.room} room`} /> : <span class="muted">no file</span>) },
        ]}
        rows={data.rooms}
        rowKey={(s) => s.room}
        empty="No room sounds."
      />
      <h2>Recorded speech</h2>
      <Table
        columns={[
          { key: 'id', header: 'Balloon', render: (s) => <span title={s.id}>{s.id}</span> },
          { key: 'who', header: 'Speaker', render: (s) => s.characterId },
          { key: 'text', header: 'Line', render: (s) => <span title={s.text}>{s.text.replace(/\s+/g, ' ')}</span> },
          { key: 'len', header: 'Length', render: (s) => secs(s.durationSeconds) },
          { key: 'status', header: 'Status', render: (s) => <Badge status={s.status.includes('rejected') ? 'rejected' : 'candidate'}>{s.status}</Badge> },
          { key: 'play', header: 'Play', render: (s) => (s.preview ? <AudioPlayer src={s.preview} label={s.id} /> : <span class="muted">no file</span>) },
        ]}
        rows={data.speech}
        rowKey={(s) => s.id}
        empty="No recorded speech."
      />
      {data.next.length > 0 && (
        <>
          <h2>Next sound</h2>
          <ul class="plain">
            {data.next.map((n) => (
              <li key={n.issue}>
                <strong>{n.title}</strong>: {typeof n.sound === 'string' ? n.sound : JSON.stringify(n.sound)}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
