import { signal } from '@preact/signals';
import type { ComponentChildren } from 'preact';
import { createPortal } from 'preact/compat';
import { useCallback, useRef } from 'preact/hooks';

export function Toolbar({ children, label, class: className }: { children: ComponentChildren; label?: string; class?: string }) {
  return (
    <div class={className ? `toolbar ${className}` : 'toolbar'} role="toolbar" aria-label={label}>
      {children}
    </div>
  );
}

export type BadgeStatus = 'approved' | 'candidate' | 'rejected' | 'pending' | 'running' | 'exited';

export function Badge({ status, children }: { status: BadgeStatus; children?: ComponentChildren }) {
  return <span class={`badge badge--${status}`}>{children ?? status}</span>;
}

export function Panel({ title, children }: { title?: string; children: ComponentChildren }) {
  return (
    <section class="glass panel">
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}

/** One short line. No illustration. */
export function EmptyState({ children }: { children: ComponentChildren }) {
  return <p class="empty">{children}</p>;
}

export interface TabItem {
  id: string;
  label: string;
  /** Plain-English tooltip; defaults to "Shows the <label> tab." */
  help?: string;
}

/** The right-hand end of the mounted tab row; view actions render into it through <TabActions>. */
const tabActionsHost = signal<HTMLElement | null>(null);

/**
 * Page-header pattern: when a page has tabs, the tab row is the title row (keep an sr-only <h1>) and the view's
 * actions sit at its right end. Render them with <TabActions>; they render nothing when no tab row is mounted.
 */
export function TabActions({ children }: { children: ComponentChildren }) {
  const host = tabActionsHost.value;
  return host ? createPortal(children, host) : null;
}

export function Tabs({ items, value, onChange, label }: { items: TabItem[]; value: string; onChange: (id: string) => void; label: string }) {
  // Only the first tab row on the page (document order) is the title row and receives <TabActions>; nested tab rows are plain filters.
  const mine = useRef<HTMLElement | null>(null);
  const setHost = useCallback((el: HTMLElement | null) => {
    if (el) {
      mine.current = el;
      if (document.querySelector('.tabs-actions') === el) tabActionsHost.value = el;
    } else if (tabActionsHost.value === mine.current) tabActionsHost.value = null;
  }, []);
  const move = (index: number) => {
    const next = items[(index + items.length) % items.length];
    if (next) onChange(next.id);
  };
  return (
    <div class="tabs-row">
    <div class="tabs" role="tablist" aria-label={label}>
      {items.map((item, i) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          class="tab"
          title={item.help ?? `Shows the ${item.label} tab.`}
          id={`tab-${item.id}`}
          aria-selected={item.id === value}
          tabIndex={item.id === value ? 0 : -1}
          onClick={() => onChange(item.id)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') move(i + 1);
            else if (e.key === 'ArrowLeft') move(i - 1);
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
    <div class="tabs-actions" ref={setHost} />
    </div>
  );
}
