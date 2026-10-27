// Nav icons for the top-level links, keyed by module id ('' is Home). Line icons on a 24px grid, drawn in currentColor.
// A module without an entry shows its first letter.
const PATHS: Record<string, string[]> = {
  '': ['M3 10.5 12 3l9 7.5', 'M5 9.5V21h5v-6h4v6h5V9.5'],
  images: ['M4 4h16v16H4z', 'M4 16l5-5 4 4 3-3 4 4', 'M15.5 8.5h.01'],
  soundtrack: ['M9 18V5l12-2v13', 'M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'],
  comics: ['M3 5h18v11H9l-5 4v-4H3z', 'M7 9h10', 'M7 12h6'],
  journal: ['M5 3h12a2 2 0 0 1 2 2v16H7a2 2 0 0 1-2-2z', 'M5 19a2 2 0 0 1 2-2h12', 'M9 7h6'],
  operations: ['M3 4h18v16H3z', 'M7 9l3 3-3 3', 'M12 15h5'],
  schedules: ['M4 5h16v15H4z', 'M4 10h16', 'M8 3v4', 'M16 3v4', 'M12 13v3l2 1'],
  spend: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M15 9a3 3 0 0 0-3-1.5c-1.7 0-3 .9-3 2.2 0 3 6 1.6 6 4.6 0 1.3-1.3 2.2-3 2.2a3.4 3.4 0 0 1-3-1.5', 'M12 6v1.5', 'M12 16.5V18'],
  storage: ['M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3z', 'M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6', 'M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3'],
  workflows: ['M6 3v12', 'M6 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M18 9a9 9 0 0 1-9 9'],
};

export function NavIcon({ id, label }: { id: string; label: string }) {
  const paths = PATHS[id];
  if (!paths) return <span class="nav-icon nav-icon--letter" aria-hidden="true">{label.charAt(0)}</span>;
  return (
    <svg class="nav-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
