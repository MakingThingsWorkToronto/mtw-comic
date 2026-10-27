// Migrated from retired git 51eb6e03:wiki/soundtrack-library/index.html (stars()). One 1-5 rating; clicking the current star clears it.

interface StarsProps {
  value: number;
  onRate: (rating: number) => void;
  disabled?: boolean;
  large?: boolean;
  /** What is being rated, for the accessible name. */
  subject: string;
}

export function Stars({ value, onRate, disabled, large, subject }: StarsProps) {
  return (
    <span class={`snd-stars${large ? ' snd-stars--large' : ''}`} role="group" aria-label={`Rating for ${subject}: ${value || 'not rated'} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          class={i <= value ? 'on' : ''}
          disabled={disabled}
          aria-pressed={i === value}
          title={i === value ? `Clears your ${i}-star rating. Nothing else changes.` : `Rates this ${i} out of 5 and saves it in the library's decision log. Nothing else changes.`}
          aria-label={`${i} star${i > 1 ? 's' : ''}${i === value ? ', click to clear' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onRate(i === value ? 0 : i);
          }}
        >
          ★
        </button>
      ))}
    </span>
  );
}

/** Bars of loudness per bar of music; a single path keeps 150 rows cheap. */
export function Spark({ energy }: { energy: number[] | null | undefined }) {
  if (!energy || !energy.length) return null;
  const max = Math.max(...energy) || 1;
  const d = energy.map((v, i) => `M${i * 4 + 1.5} 18v${-Math.max(1, Math.round((v / max) * 18))}`).join('');
  return (
    <svg class="snd-spark" width={energy.length * 4} height="18" viewBox={`0 0 ${energy.length * 4} 18`} aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  );
}
