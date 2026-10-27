import type { ComponentChildren } from 'preact';
import { Toolbar } from './Layout';

export interface FilterSelect {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
}

interface FilterBarProps {
  search: string;
  onSearch: (q: string) => void;
  searchLabel?: string;
  selects?: FilterSelect[];
  onSelect?: (name: string, value: string) => void;
  children?: ComponentChildren;
  /** Extra class on the toolbar, e.g. a module's one-row layout. */
  class?: string;
}

/** Search box plus selects. Values live in the URL query, so the caller passes them in and handles changes. */
export function FilterBar({ search, onSearch, searchLabel = 'Search', selects = [], onSelect, children, class: className }: FilterBarProps) {
  return (
    <Toolbar label="Filters" class={className}>
      <input class="input" type="search" aria-label={searchLabel} placeholder={searchLabel} value={search} onInput={(e) => onSearch((e.target as HTMLInputElement).value)} />
      {selects.map((s) => (
        <select key={s.name} class="select" aria-label={s.label} value={s.value} onChange={(e) => onSelect?.(s.name, (e.target as HTMLSelectElement).value)}>
          {s.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
      {children}
    </Toolbar>
  );
}
