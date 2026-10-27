// Comic Editor side panel: text, kind, who, state, em, placement and phone overrides for the selected balloon.
// Timing fields (at, b, l) are deliberately absent: retime() recomputes them on import.
import { useEffect, useState } from 'preact/hooks';
import { Tabs } from '../../../web/ui';
import { EDGES, KINDS, STATES, validateBalloon, wordCount, wordGuidance } from './model';
import type { BalloonData } from './model';

interface Props {
  draft: BalloonData;
  cast: string[];
  tab: 'page' | 'phone';
  onTab(t: 'page' | 'phone'): void;
  onChange(next: BalloonData): void;
  editable: boolean;
}

const num = (v: string): number | undefined => (v.trim() === '' || !Number.isFinite(Number(v)) ? undefined : Number(v));
const strip = <T extends Record<string, unknown>>(o: T): T => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) if (v !== undefined) out[k] = v;
  return out as T;
};

/** The typed text is kept locally so partial entries ("0.", "-") survive re-render; it resyncs only when the value changes elsewhere. */
function Num({ id, label, value, onInput, disabled, step = 0.01 }: { id: string; label: string; value: number | undefined; onInput(v: number | undefined): void; disabled: boolean; step?: number }) {
  const [text, setText] = useState(value === undefined ? '' : String(value));
  useEffect(() => {
    if (num(text) !== value) setText(value === undefined ? '' : String(value));
  }, [value]);
  return (
    <div class="field">
      <label for={id}>{label}</label>
      <input id={id} class="input" type="text" inputMode="decimal" data-step={step} value={text} disabled={disabled} onInput={(e) => { const v = (e.target as HTMLInputElement).value; setText(v); onInput(num(v)); }} />
    </div>
  );
}

export function SidePanel({ draft, cast, tab, onTab, onChange, editable }: Props) {
  const dis = !editable;
  const set = (patch: Partial<BalloonData>) => onChange(strip({ ...draft, ...patch }) as BalloonData);
  const phone = draft.phone ?? {};
  const setPhone = (patch: Record<string, unknown>) => {
    const next = strip({ ...phone, ...patch });
    const { phone: _drop, ...rest } = draft;
    onChange(Object.keys(next).length ? ({ ...rest, phone: next } as BalloonData) : (rest as BalloonData));
  };
  const setTail = (tail: [number | undefined, number | undefined], phoneTarget: boolean) => {
    const done = tail[0] !== undefined && tail[1] !== undefined ? ([tail[0], tail[1]] as [number, number]) : undefined;
    if (phoneTarget) setPhone({ tail: done });
    else set({ tail: done as [number, number] });
  };
  const problems = validateBalloon(draft, cast);
  const guide = wordGuidance(draft.text ?? '');
  const tail = (tab === 'phone' ? phone.tail : draft.tail) ?? [undefined, undefined];

  return (
    <div class="stack ce-side">
      <Tabs label="Placement target" value={tab} onChange={(t) => onTab(t as 'page' | 'phone')} items={[{ id: 'page', label: 'Page' }, { id: 'phone', label: 'Phone overrides' }]} />
      {tab === 'page' ? (
        <>
          <div class="field">
            <label for="ce-text">Text</label>
            <textarea id="ce-text" class="input area" rows={5} value={draft.text} disabled={dis} onInput={(e) => set({ text: (e.target as HTMLTextAreaElement).value })} />
            <span class={`small ${guide ? 'error' : 'muted'}`}>{guide ?? `${wordCount(draft.text ?? '')} words. Aim for about 12. Press Enter for a composed line break.`}</span>
          </div>
          <div class="ce-grid">
            <div class="field">
              <label for="ce-kind">Kind</label>
              <select id="ce-kind" class="select" value={draft.kind} disabled={dis} onChange={(e) => set({ kind: (e.target as HTMLSelectElement).value })}>
                {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div class="field">
              <label for="ce-who">Who</label>
              <select id="ce-who" class="select" value={draft.who} disabled={dis} onChange={(e) => set({ who: (e.target as HTMLSelectElement).value })}>
                {cast.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div class="field">
              <label for="ce-state">State</label>
              <select id="ce-state" class="select" value={draft.state ?? ''} disabled={dis} onChange={(e) => set({ state: (e.target as HTMLSelectElement).value || undefined })}>
                <option value="">none</option>
                {STATES.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div class="field">
              <label for="ce-edge">Edge</label>
              <select id="ce-edge" class="select" value={draft.edge ?? ''} disabled={dis} onChange={(e) => set({ edge: (e.target as HTMLSelectElement).value || undefined })}>
                <option value="">none</option>
                {EDGES.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>
          <div class="field">
            <label for="ce-em">Emphasis (a word or phrase in the text)</label>
            <input id="ce-em" class="input" value={draft.em ?? ''} disabled={dis} onInput={(e) => set({ em: (e.target as HTMLInputElement).value || undefined })} />
          </div>
          <div class="ce-grid">
            <Num id="ce-x" label="x" value={draft.x} disabled={dis} onInput={(v) => set({ x: v as number })} />
            <Num id="ce-y" label="y" value={draft.y} disabled={dis} onInput={(v) => set({ y: v as number })} />
            <Num id="ce-w" label="w" value={draft.w} disabled={dis} onInput={(v) => set({ w: v })} />
            <Num id="ce-tx" label="tail x" value={tail[0]} disabled={dis} onInput={(v) => setTail([v, tail[1]], false)} />
            <Num id="ce-ty" label="tail y" value={tail[1]} disabled={dis} onInput={(v) => setTail([tail[0], v], false)} />
          </div>
          {(draft.kind === 'caption' || draft.kind === 'place') && draft.anchor !== 'free' && (
            <p class="small muted">Captions sit in a box corner: y above 0.6 puts it at the bottom; x above 0.35 with x + w above 0.9 puts it on the right. Other x/y changes do not move it.</p>
          )}
          <fieldset class="ce-flags" disabled={dis}>
            <legend class="small muted">Flags</legend>
            {(['characterIntro', 'sceneSetup', 'breakout', 'chain', 'across'] as const).map((f) => (
              <label key={f} class="ce-flag">
                <input type="checkbox" checked={!!draft[f]} onChange={(e) => set({ [f]: (e.target as HTMLInputElement).checked || undefined } as Partial<BalloonData>)} /> {f}
              </label>
            ))}
          </fieldset>
        </>
      ) : (
        <>
          <p class="small muted">Phone-only placement. Empty fields fall back to the page values. Words and reveal timing are shared.</p>
          <div class="ce-grid">
            <Num id="ce-px" label="phone x" value={phone.x} disabled={dis} onInput={(v) => setPhone({ x: v })} />
            <Num id="ce-py" label="phone y" value={phone.y} disabled={dis} onInput={(v) => setPhone({ y: v })} />
            <Num id="ce-pw" label="phone w" value={phone.w} disabled={dis} onInput={(v) => setPhone({ w: v })} />
            <Num id="ce-ptx" label="phone tail x" value={phone.tail?.[0]} disabled={dis} onInput={(v) => setTail([v, tail[1]], true)} />
            <Num id="ce-pty" label="phone tail y" value={phone.tail?.[1]} disabled={dis} onInput={(v) => setTail([tail[0], v], true)} />
          </div>
          <label class="ce-flag">
            <input type="checkbox" disabled={dis} checked={phone.anchor === 'free'} onChange={(e) => setPhone({ anchor: (e.target as HTMLInputElement).checked ? 'free' : undefined })} /> anchor free
          </label>
          <label class="ce-flag">
            <input type="checkbox" disabled={dis} checked={!!phone.chain} onChange={(e) => setPhone({ chain: (e.target as HTMLInputElement).checked || undefined })} /> chain
          </label>
        </>
      )}
      {problems.length > 0 && <p class="error small" role="alert">{problems.join('. ')}.</p>}
    </div>
  );
}
