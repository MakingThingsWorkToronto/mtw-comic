import { signal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { clientModules } from '../../modules/client-registry';
import { IconButton } from '../ui/Button';
import { Link } from './Link';
import { NavIcon } from './navIcons';
import { buildUrl } from './route';
import { route } from './router';

const GROUPS = ['Studio', 'System'] as const;
const KEY = 'mtw.nav.collapsed';
const read = (): boolean => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};
export const navCollapsed = signal(read());
/** Phone width (<= 760px): the rail becomes a drawer opened from the header menu button. */
export const navOpen = signal(false);

function toggle(): void {
  navCollapsed.value = !navCollapsed.value;
  try {
    localStorage.setItem(KEY, navCollapsed.value ? '1' : '0');
  } catch {
    /* storage is a convenience only */
  }
}

const GROUPS_KEY = 'mtw.nav.closedGroups';
const readClosed = (): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(GROUPS_KEY) ?? '[]') as unknown;
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
};
/** Sections the person closed; remembered per browser. */
export const closedGroups = signal<string[]>(readClosed());

function toggleGroup(group: string): void {
  const now = closedGroups.value.includes(group) ? closedGroups.value.filter((g) => g !== group) : [...closedGroups.value, group];
  closedGroups.value = now;
  try {
    localStorage.setItem(GROUPS_KEY, JSON.stringify(now));
  } catch {
    /* storage is a convenience only */
  }
}

export function Nav() {
  const current = route.value.module;
  const here = route.value.module + '/' + route.value.path.join('/');
  useEffect(() => {
    navOpen.value = false;
  }, [here]);
  useEffect(() => {
    if (!navOpen.value) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && (navOpen.value = false);
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [navOpen.value]);
  const link = (item: { id: string; label: string; href: string }) => (
    <Link key={item.id} href={item.href} aria-current={(current ?? '') === item.id ? 'page' : undefined} title={item.label}>
      <NavIcon id={item.id} label={item.label} />
      <span class="label">{item.label}</span>
    </Link>
  );
  const groups = GROUPS.map((group) => ({
    group,
    items: clientModules
      .filter((m) => (m.meta.nav.group ?? 'Studio') === group)
      .sort((x, y) => x.meta.nav.order - y.meta.nav.order)
      .map((m) => ({ id: m.meta.id, label: m.meta.nav.label, href: buildUrl(m.meta.id) })),
  })).filter((g) => g.items.length > 0);
  return (
    <>
    <div class="nav-backdrop" data-open={navOpen.value} onClick={() => (navOpen.value = false)} aria-hidden="true" />
    <nav class="nav" id="module-nav" aria-label="Modules" data-open={navOpen.value}>
      {link({ id: '', label: 'Home', href: '/' })}
      {groups.map((g) => (
        <div class="nav-group" role="group" aria-labelledby={`nav-group-${g.group}`} key={g.group} data-closed={closedGroups.value.includes(g.group)}>
          <button
            type="button"
            class="nav-group-label"
            id={`nav-group-${g.group}`}
            aria-expanded={!closedGroups.value.includes(g.group)}
            aria-controls={`nav-items-${g.group}`}
            title={closedGroups.value.includes(g.group) ? `Shows the ${g.group} pages in the side menu.` : `Hides the ${g.group} pages in the side menu. Nothing is deleted.`}
            onClick={() => toggleGroup(g.group)}
          >
            <svg class="nav-chevron" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
            {g.group}
          </button>
          {/* A closed section still shows the page you are on; the icon rail (no section headings) shows every link. */}
          <div class="nav-items" id={`nav-items-${g.group}`}>
            {g.items.filter((i) => navCollapsed.value || !closedGroups.value.includes(g.group) || i.id === current).map(link)}
          </div>
        </div>
      ))}
      <IconButton class="nav-toggle" label={navCollapsed.value ? 'Expand navigation' : 'Collapse navigation'} glyph={navCollapsed.value ? 'right' : 'left'} help={navCollapsed.value ? 'Widens the side menu so page names show next to their icons.' : 'Shrinks the side menu to just icons to give the page more room.'} onClick={toggle} />
    </nav>
    </>
  );
}
