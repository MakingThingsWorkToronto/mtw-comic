// The site's services, by group. Service pages build their footer's Related services row from this (Matt,
// 2026-09-24: related services are a standard part of the flat footer on every service page, not page content), and
// the header's Services mega menu lists every entry.
export const serviceCatalog: readonly { id: string; group: string; label: string; href: string }[] = [
  { id: 'second-brain', group: 'agentic-systems', label: 'Second Brain', href: '/agentic-systems/second-brain/' },
  { id: 'agentic-team-modernization', group: 'agentic-systems', label: 'Agentic Team Modernization', href: '/agentic-systems/agentic-team-modernization/' },
  { id: 'agentic-cost-planning', group: 'agentic-systems', label: 'Agentic Cost Planning', href: '/agentic-systems/agentic-cost-planning/' },
  { id: 'agentic-devops-scaling', group: 'agentic-systems', label: 'Agentic DevOps & Scaling', href: '/agentic-systems/agentic-devops-scaling/' },
  { id: 'agent-ready-websites', group: 'agentic-systems', label: 'Agent-Ready Websites', href: '/agentic-systems/agent-ready-websites/' },
  { id: 'roles-access-control', group: 'traditional-systems', label: 'Roles & Access Control', href: '/traditional-systems/roles-access-control/' },
  { id: 'roadmaps-cloud-planning', group: 'traditional-systems', label: 'Roadmaps & Cloud Planning', href: '/traditional-systems/roadmaps-cloud-planning/' },
  { id: 'information-governance', group: 'traditional-systems', label: 'Information Governance & AI Readiness', href: '/traditional-systems/information-governance-ai-readiness/' },
  { id: 'intranet-collaboration', group: 'traditional-systems', label: 'Intranet & Collaboration', href: '/traditional-systems/intranet-collaboration/' },
  { id: 'power-platform-logic-apps', group: 'traditional-systems', label: 'Power Platform & Logic Apps', href: '/traditional-systems/power-platform-logic-apps/' },
  { id: 'custom-software-development', group: 'traditional-systems', label: 'Custom Software Development', href: '/traditional-systems/custom-software-development/' },
  { id: 'migration-planning', group: 'data-migrations', label: 'Migration Planning', href: '/data-migrations/migration-planning/' },
  { id: 'm365-migrations', group: 'data-migrations', label: 'M365 Migrations', href: '/data-migrations/m365-migrations/' },
  { id: 'azure-migrations', group: 'data-migrations', label: 'Azure Migrations', href: '/data-migrations/azure-migrations/' },
];

/** The other services in this service's group, then any extra service ids the page names, without repeats. */
export function relatedServices(id: string, extra: string[] = []): { label: string; href: string }[] {
  const self = serviceCatalog.find((s) => s.id === id);
  if (!self) throw new Error(`Unknown service: ${id}`);
  const ids = [...serviceCatalog.filter((s) => s.group === self.group && s.id !== id).map((s) => s.id), ...extra];
  return [...new Set(ids)].map((x) => {
    const s = serviceCatalog.find((c) => c.id === x);
    if (!s) throw new Error(`Unknown related service: ${x}`);
    return { label: s.label, href: s.href };
  });
}
