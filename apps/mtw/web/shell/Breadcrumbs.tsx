import { findClientModule } from '../../modules/client-registry';
import { Link } from './Link';
import { buildUrl } from './route';
import { route } from './router';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function Breadcrumbs() {
  const { module, path } = route.value;
  const crumbs: { label: string; href?: string }[] = [{ label: 'Studio', href: '/' }];
  if (module) {
    const title = findClientModule(module)?.meta.title ?? cap(module);
    crumbs.push({ label: title, href: buildUrl(module) });
    path.forEach((seg, i) => crumbs.push({ label: i === 0 ? cap(seg) : seg, href: buildUrl(module, path.slice(0, i + 1)) }));
  }
  return (
    <nav class="crumbs" aria-label="Breadcrumb">
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <span key={i} class="row" style="gap:8px">
            {i > 0 && (
              <span class="sep" aria-hidden="true">
                /
              </span>
            )}
            {last || !c.href ? <span aria-current={last ? 'page' : undefined}>{c.label}</span> : <Link href={c.href}>{c.label}</Link>}
          </span>
        );
      })}
    </nav>
  );
}
