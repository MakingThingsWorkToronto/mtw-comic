import { buildUrl } from './route';
import { Link } from './Link';
import { route } from './router';
import { findClientModule } from '../../modules/client-registry';
import { budgetWarnings, estCostToday, runningCount, tokensToday } from '../state';
import { formatEstUsd, formatTokens } from '../format';
import { navOpen } from './Nav';

// The MTW mark, geometry from site/src/components/BrandMark.astro.
function BrandMark() {
  return (
    <svg class="brand-mark" viewBox="0 0 115 151" width="20" height="26" aria-hidden="true" focusable="false">
      <path
        d="M 5.0,138.5 L 48.5,17.0 L 50.5,18.0 L 58.0,39.5 L 67.0,16.5 L 111.5,135.0 L 58.0,101.5 L 5.0,138.5 Z M 15.5,126.0 L 58.0,96.5 L 102.5,124.0 L 67.0,28.5 L 58.0,52.5 L 48.5,29.0 L 16.5,117.0 L 13.5,126.0 L 15.5,126.0 Z M 23.0,115.5 L 34.5,81.0 L 43.0,77.5 L 38.0,96.5 L 58.0,82.5 L 79.0,95.5 L 73.5,79.0 L 81.0,79.5 L 94.5,113.0 L 92.0,113.5 L 58.0,91.5 L 23.0,115.5 Z"
        fill="currentColor"
        fill-rule="evenodd"
      />
      <path d="M 79.0,75.5 L 72.0,74.5 L 67.0,63.5 L 63.0,73.5 L 54.0,73.5 L 49.0,63.5 L 44.0,74.5 L 36.5,75.0 L 49.0,41.5 L 58.0,64.5 L 67.5,42.0 L 79.0,75.5 Z" fill="var(--teal)" />
    </svg>
  );
}

/** Spend module when registered, else the Operations usage tab. */
const spendHref = (view: string): string => (findClientModule('spend') ? buildUrl('spend', [view]) : buildUrl('operations', ['usage']));

export function Header() {
  const running = runningCount.value;
  const onTerminals = route.value.module === 'operations' && route.value.path[0] === 'terminals';
  return (
    <header class="header">
      <button type="button" class="menu-btn" aria-label="Modules menu" aria-expanded={navOpen.value} aria-controls="module-nav" title="Shows or hides the list of Studio pages on a narrow screen." onClick={() => (navOpen.value = !navOpen.value)}>
        <svg viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
          <path d="M2 4h12M2 8h12M2 12h12" />
        </svg>
      </button>
      <Link class="brand" href="/" aria-label="Making Things Work Studio, home">
        <BrandMark />
        <span>
          Making Things <em>Work</em>
        </span>
      </Link>
      <span class="app-label">Studio</span>
      <span class="header-spacer" />
      <Link class="term-indicator" href={buildUrl('operations', ['terminals'])} data-active={running > 0 || onTerminals} aria-label={`Terminals: ${running} running`}>
        {running > 0 && <span class="dot" aria-hidden="true" />}
        <span>{running}<span class="term-unit"> running</span></span>
      </Link>
      {budgetWarnings.value.length > 0 && (
        <Link class="budget-badge" href={spendHref('budgets')} title="A monthly budget is at or past 80% (estimate)">
          Budget {Math.round(Math.max(...budgetWarnings.value.map((w) => w.fraction)) * 100)}%
        </Link>
      )}
      <Link class="tokens-today" href={spendHref('overview')} aria-label={`Tokens today: ${tokensToday.value}, estimated cost ${formatEstUsd(estCostToday.value)}`} title="Tokens today and estimated API-equivalent cost (not a billed amount)">
        {formatTokens(tokensToday.value)} <span class="tokens-unit">tokens today</span> <span class="tokens-unit">{formatEstUsd(estCostToday.value)} est.</span><span class="tokens-short" aria-hidden="true"> tok</span>
      </Link>
    </header>
  );
}
