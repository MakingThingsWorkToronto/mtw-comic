/** One horizontal bar: a filled share of a track, with the value as text beside it (never colour alone). */
export function Bar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.max(value > 0 ? 1 : 0, Math.round((value / max) * 100)) : 0;
  return (
    <span class="st-bar" role="img" aria-label={label}>
      <span class="st-bar-fill" style={{ width: `${pct}%` }} />
    </span>
  );
}
