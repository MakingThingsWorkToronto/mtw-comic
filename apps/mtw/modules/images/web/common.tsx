// New. Small pieces shared by the Images views.
import type { ComponentChildren, JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { ChangedBar } from '../../../web/shell/ChangedBar';
import { Badge } from '../../../web/ui/Layout';
import type { BadgeStatus } from '../../../web/ui/Layout';
import { STATE_HINT, STATE_LABEL } from '../shared/states';
import type { ReviewState } from '../shared/types';
import { useHost } from './host';
import type { ImagesView } from './host';

/** Link that navigates in place in the app and falls back to a normal hash link in the snapshot. */
export function Anchor({ view, id, query, children, ...rest }: { view: ImagesView; id?: string; query?: Record<string, string | undefined>; children: ComponentChildren } & Omit<JSX.HTMLAttributes<HTMLAnchorElement>, 'href'>) {
  const host = useHost();
  const href = host.href(view, id, query);
  return (
    <a
      {...rest}
      href={href}
      onClick={(e) => {
        if (host.mode !== 'app' || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        host.go(href);
      }}
    >
      {children}
    </a>
  );
}

const BADGE: Record<ReviewState, BadgeStatus> = {
  approved: 'approved',
  rejected: 'rejected',
  selected: 'candidate',
  reviewed: 'candidate',
  draft: 'pending',
  unreviewed: 'pending',
  reference: 'exited',
  evidence: 'exited',
  missing: 'pending',
};

/** One-word state. The raw status string and the review caveat live in the tooltip. */
export function StateBadge({ state, raw }: { state: ReviewState; raw?: string }) {
  return (
    <span title={`${STATE_HINT[state]}${raw && raw !== 'missing' ? ` Recorded status: ${raw}` : ''}`}>
      <Badge status={BADGE[state]}>{STATE_LABEL[state]}</Badge>
    </span>
  );
}

/** Lazy thumbnail with a one-word failure state. */
export function Thumb({ src, alt, w, h }: { src: string; alt: string; w?: number | undefined; h?: number | undefined }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (failed) return <span class="img-fail">No preview</span>;
  return <img src={src} alt={alt} loading="lazy" decoding="async" {...(w && h ? { width: w, height: h } : {})} onError={() => setFailed(true)} />;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.append(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** A button that copies text and says so for a moment. */
export function useCopy(): [string, (text: string, label?: string) => void] {
  const [done, setDone] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  return [
    done,
    (text, label = text) => {
      void copyText(text).then((ok) => {
        setDone(ok ? label : '');
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setDone(''), 1500);
      });
    },
  ];
}

/** Shown when the library changed under an open view; the view keeps what the human sees until they choose. */
export function StaleBanner({ onReload }: { onReload: () => void }) {
  return <ChangedBar live={{ changed: true, reload: async () => onReload() }} />;
}

export function styleLabel(names: Record<string, string>, style: string): string {
  return names[style] ?? style.replace(/-/g, ' ');
}

export function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
