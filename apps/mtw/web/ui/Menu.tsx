import { useEffect, useRef, useState } from 'preact/hooks';
import { Button } from './Button';

/** A button that opens a short list of actions. Esc or an outside click closes it. */
export function Menu({ label, items, help }: { label: string; items: { id: string; label: string; onSelect: () => void; help?: string }[]; help?: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div class="menu" ref={root}>
      <Button variant="primary" aria-haspopup="menu" aria-expanded={open} help={help ?? `Opens a short list of actions: ${items.map((i) => i.label).join(', ')}. Nothing happens until you pick one.`} onClick={() => setOpen(!open)}>
        {label}
      </Button>
      {open && (
        <div class="menu-list" role="menu">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              title={item.help}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
