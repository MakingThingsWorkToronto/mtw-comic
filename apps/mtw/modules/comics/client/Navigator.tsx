// Comic review navigator, compact (Matt, 2026-10-11): other scenes are one link each ("doubt 0/7"); the current scene
// shows its title on the left, then one colour-coded, numbered rectangle per screen (box), and only the current screen
// opens into its bubble circles. Tooltips name the state only.
import type { ReviewState, SpeechRow } from './types';

/** What a bubble's state means to the reviewer; "unvoiced" is simply not reviewed yet. */
export const STATE_TIP: Record<ReviewState, string> = { approved: 'Approved', pending: 'Not reviewed', unvoiced: 'Not reviewed', stale: 'Changed since approved', rejected: 'Rejected' };
/** Colour class per state; unvoiced shares "not reviewed". */
const shade = (s: ReviewState): string => (s === 'unvoiced' ? 'pending' : s);

export interface NavBox { key: string; panelIndex: number; rows: SpeechRow[] }
export interface NavScene { id: string; title: string; boxes: NavBox[] }

/** Pure: rows in reading order grouped into scenes and screens (a screen is a scene's box). */
export function navGroups(rows: SpeechRow[]): NavScene[] {
  const scenes: NavScene[] = [];
  for (const r of rows) {
    let scene = scenes[scenes.length - 1];
    if (!scene || scene.id !== r.sceneId) scenes.push((scene = { id: r.sceneId, title: r.sceneTitle || r.sceneId, boxes: [] }));
    const key = `${r.sceneId}/${r.panelId ?? r.panelIndex}`;
    let box = scene.boxes[scene.boxes.length - 1];
    if (!box || box.key !== key) scene.boxes.push((box = { key, panelIndex: r.panelIndex, rows: [] }));
    box.rows.push(r);
  }
  return scenes;
}

/** Pure: one colour for a screen: rejected, then changed, then all approved, else not reviewed. */
export function screenState(rows: SpeechRow[]): 'approved' | 'pending' | 'stale' | 'rejected' {
  if (rows.some((r) => r.state === 'rejected')) return 'rejected';
  if (rows.some((r) => r.state === 'stale')) return 'stale';
  return rows.length > 0 && rows.every((r) => r.state === 'approved') ? 'approved' : 'pending';
}

const approvedOf = (rows: SpeechRow[]) => rows.filter((r) => r.state === 'approved').length;

export function Navigator({ rows, currentId, onGo }: { rows: SpeechRow[]; currentId: string; onGo: (id: string) => void }) {
  const groups = navGroups(rows);
  const current = rows.find((r) => r.id === currentId);
  return (
    <nav class="rv-nav" aria-label="Scenes and screens">
      {groups.map((scene) => {
        const all = scene.boxes.flatMap((b) => b.rows);
        const ratio = `${approvedOf(all)}/${all.length}`;
        if (scene.id !== current?.sceneId)
          return (
            <button key={scene.id} type="button" class="rv-nav-scene" title={`Jumps to ${scene.title}, where ${ratio} balloons are approved. Nothing is changed.`} onClick={() => onGo(all[0]?.id ?? '')}>
              <span class="rv-nav-name">{scene.title}</span> <span class="muted">{ratio}</span>
            </button>
          );
        return (
          <div key={scene.id} class="rv-nav-current" aria-current="true">
            <span class="rv-nav-name rv-nav-name--current" title={`${scene.title}: ${ratio} approved`}>
              {scene.title}
            </span>
            {scene.boxes.map((box) => {
              const st = screenState(box.rows);
              const label = `Screen ${box.panelIndex + 1}: ${STATE_TIP[st]}`;
              const open = box.rows.some((r) => r.id === currentId);
              if (!open)
                return (
                  <button key={box.key} type="button" class={`rv-nav-screen rv-nav-screen--${st}`} title={`Jumps to ${label.charAt(0).toLowerCase()}${label.slice(1)}. Nothing is changed.`} aria-label={label} onClick={() => onGo(box.rows[0]?.id ?? '')}>
                    {box.panelIndex + 1}
                  </button>
                );
              return (
                <span key={box.key} class={`rv-nav-screen rv-nav-screen--open rv-nav-screen--${st}`} title={label}>
                  {box.panelIndex + 1}
                  {box.rows.map((r) => (
                    <button key={r.id} type="button" class={`dot dot--${shade(r.state)}${r.id === currentId ? ' dot--current' : ''}`} title={`Jumps to this balloon (${STATE_TIP[r.state].toLowerCase()}). Nothing is changed.`} aria-label={STATE_TIP[r.state]} aria-current={r.id === currentId ? 'true' : undefined} onClick={() => onGo(r.id)} />
                  ))}
                </span>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
