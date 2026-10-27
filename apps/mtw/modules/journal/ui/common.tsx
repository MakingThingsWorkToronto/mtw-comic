import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { Link } from '../../../web/shell/Link';
import { buildUrl } from '../../../web/shell/route';
import { Badge, LaunchConfirm, useLaunchChoice } from '../../../web/ui';
import type { LaunchChoice } from '../../../web/ui';
import { copy } from '../copy';
import { UNKNOWN, isUnknown, show } from '../shared';
import type { CoverRow, DecisionRec } from '../shared';

export const jUrl = (...segments: string[]): string => buildUrl('journal', segments);

export function Approval({ value }: { value: string }) {
  return <Badge status={value === 'approved' ? 'approved' : 'pending'}>{value}</Badge>;
}

export function Unk({ value }: { value: unknown }) {
  return isUnknown(value) ? <span class="unk">{copy.unknown}</span> : <>{show(value)}</>;
}

/** First-use gloss as a focusable tooltip. */
export function Gloss({ term, children }: { term: string; children?: ComponentChildren }) {
  const text = copy.glosses[term];
  if (!text) return <>{children ?? term}</>;
  return (
    <span class="gloss" tabIndex={0} title={text} aria-label={`${children ?? term}: ${text}`}>
      {children ?? term}
    </span>
  );
}

export function Notice({ title, items, kind = 'warn' }: { title?: string; items?: string[]; kind?: 'warn' | 'info'; children?: ComponentChildren }) {
  if (items && !items.length) return null;
  return (
    <div class={`j-notice j-notice--${kind}`} role="status">
      {title && <strong>{title}</strong>}
      {items && (
        <ul>
          {items.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** A cover: the registered preview when an img: resolver serves one, otherwise the Journal's own file route; "absent" when missing. */
export function Cover({ cover, width = 64 }: { cover: CoverRow | null; width?: number }) {
  const h = Math.round((width * 9) / 16);
  const [failed, setFailed] = useState(false);
  const style = `width:${width}px;height:${h}px`;
  if (!cover || !cover.exists || cover.file === UNKNOWN || failed) {
    return (
      <span class="j-cover j-cover--none" style={style} title={cover?.existsNote}>
        {copy.absent}
      </span>
    );
  }
  const src = cover.preview ?? `/api/journal/cover/${encodeURIComponent(cover.file)}`;
  return <img class="j-cover" src={src} alt={`Cover option: ${cover.option}`} style={style} loading="lazy" onError={() => setFailed(true)} />;
}

export function EntryLink({ slug, title, tab }: { slug: string; title: string; tab?: string }) {
  return (
    <Link href={tab ? `${jUrl('entry', slug)}?tab=${tab}` : jUrl('entry', slug)}>{title}</Link>
  );
}

/** Newest decision of any of the given actions for a subject. */
export function latest(decisions: DecisionRec[], subject: string, ...actions: string[]): DecisionRec | undefined {
  return decisions.filter((d) => d.subject === subject && actions.includes(d.action)).sort((a, b) => b.at.localeCompare(a.at))[0];
}

/** The provider / model / effort / permission a launch confirms (see web/ui/LaunchConfirm). */
export type RunnerChoice = LaunchChoice;

/** The request fields for a launch: runner and permission always, model and effort only when chosen (else the procedure's default applies). */
export function launchFields(c: RunnerChoice): { runner: string; permission: string; model?: string; effort?: string } {
  return { runner: c.runner, permission: c.permission, ...(c.model ? { model: c.model } : {}), ...(c.effort ? { effort: c.effort } : {}) };
}

/** Choice state and the shared confirm control for one Journal operation. Bypass options are never offered. */
/** `ready` is false until the providers and the procedure's own defaults have loaded: launch buttons wait for it, so nothing starts on a guess. */
export function useLaunchPicker(operation: string, idPrefix = 'jr'): { choice: RunnerChoice; picker: ComponentChildren; ready: boolean } {
  const state = useLaunchChoice(operation);
  return { choice: state.choice, picker: <LaunchConfirm state={state} idPrefix={idPrefix} />, ready: state.ready };
}

/** Render sections in the order layout.json gives. Unknown ids are ignored. */
export function Sections({ order, map }: { order: readonly string[]; map: Record<string, () => ComponentChildren> }) {
  return <>{order.map((id) => (map[id] ? <div key={id} class="j-section">{map[id]!()}</div> : null))}</>;
}
