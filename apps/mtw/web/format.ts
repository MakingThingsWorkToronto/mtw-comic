// Small display helpers shared by the shell and modules.
export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(Math.round(n));
}

export const formatPercent = (rate: number): string => `${Math.round(rate * 100)}%`;

export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, '0')}s`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}

/** Estimated dollars, always shown with a leading "~" so an estimate never reads as a billed amount. */
export function formatEstUsd(n: number): string {
  if (!n) return '~$0';
  return n < 0.01 ? '~<$0.01' : n < 100 ? `~$${n.toFixed(2)}` : `~$${Math.round(n).toLocaleString('en-US')}`;
}
