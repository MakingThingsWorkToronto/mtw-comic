import type { ComponentChildren, JSX } from 'preact';
import { navigate } from './router';

interface LinkProps extends Omit<JSX.HTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
  children?: ComponentChildren;
}

/** Client-side navigation for plain left clicks; modified clicks keep the browser default. */
export function Link({ href, onClick, children, ...rest }: LinkProps) {
  return (
    <a
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(href);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
