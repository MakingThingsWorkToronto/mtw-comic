export function formatBytes(n: number): string {
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(2)} GB`;
  if (n >= 1024 ** 2) return `${(n / 1024 ** 2).toFixed(n >= 100 * 1024 ** 2 ? 0 : 1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

export const formatWhen = (iso: string): string =>
  new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Last two path segments plus a leading ellipsis, for narrow cells. */
export const shortPath = (p: string): string => {
  const parts = p.split('/');
  return parts.length > 3 ? `…/${parts.slice(-3).join('/')}` : p;
};
