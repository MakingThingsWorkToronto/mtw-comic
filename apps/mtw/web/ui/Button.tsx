import type { ComponentChildren, JSX } from 'preact';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

/**
 * Plain-English help for a control: what clicking it does. It becomes the hover
 * tooltip (title) and the accessible description, so keyboard and screen-reader
 * users get it too. If a caller also passes `title`, `help` wins.
 */
export interface HelpProps {
  help?: string;
}

/** The tooltip and accessible-description attributes for a control. */
export function helpAttrs(help: string | undefined, title?: unknown): Record<string, string> {
  if (help) return { title: help, 'aria-description': help };
  return typeof title === 'string' && title ? { title } : {};
}

interface ButtonProps extends Omit<JSX.IntrinsicElements['button'], 'size' | 'ref'>, HelpProps {
  variant?: Variant;
  small?: boolean;
  type?: 'button' | 'submit';
  children?: ComponentChildren;
}

export function Button({ variant = 'secondary', small, class: cls, type = 'button', help, title, children, ...rest }: ButtonProps) {
  return (
    <button type={type} class={`btn btn--${variant}${small ? ' btn--small' : ''}${cls ? ` ${cls}` : ''}`} {...rest} {...helpAttrs(help, title)}>
      {children}
    </button>
  );
}

const GLYPHS = {
  close: 'M4 4l8 8M12 4l-8 8',
  left: 'M10 3L5 8l5 5',
  right: 'M6 3l5 5-5 5',
  stop: 'M4 4h8v8H4z',
  play: 'M5 3l8 5-8 5z',
  pause: 'M5 3v10M11 3v10',
} as const;

export type Glyph = keyof typeof GLYPHS;

interface IconButtonProps extends Omit<JSX.IntrinsicElements['button'], 'size' | 'ref'>, HelpProps {
  /** Required: the accessible name, also shown as the tooltip unless `help` gives a longer one. */
  label: string;
  glyph: Glyph;
  type?: 'button' | 'submit';
}

export function IconButton({ label, glyph, class: cls, type = 'button', help, title, ...rest }: IconButtonProps) {
  return (
    <button type={type} class={`icon-btn${cls ? ` ${cls}` : ''}`} aria-label={label} {...rest} {...helpAttrs(help, title ?? label)}>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d={GLYPHS[glyph]} />
      </svg>
    </button>
  );
}
