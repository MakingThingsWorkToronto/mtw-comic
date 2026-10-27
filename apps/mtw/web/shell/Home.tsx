import { useEffect } from 'preact/hooks';
import type { HomeSummary } from '../../server/core/home';
import { useLiveResource } from '../state';
import { Link } from './Link';
import './home.css';

/** The tools needed to author, register and review comics. */
export function Home() {
  const live = useLiveResource<HomeSummary>('/api/home');
  useEffect(() => { void live.reload(); }, []);
  return <div class="page home">
    <div class="page-head"><div class="title-block"><h1>Comic Studio</h1><p class="sub">Write stories, cast characters, prepare art and sound, and review the reader.</p></div></div>
    {live.loading && !live.data && <p>Loading comic tools.</p>}
    {live.error && <p role="alert">Comic tools unavailable: {live.error}</p>}
    <ul class="home-list">{live.data?.modules.map(m => <li key={m.id} class="home-row">
      <Link href={m.href} class="home-row-main">{m.title}</Link>
      <span class="muted">{m.error ? `Summary unavailable: ${m.error}` : m.items.map(i => `${i.label}${i.count === undefined ? '' : ` ${i.count}`}`).join(' · ')}</span>
    </li>)}</ul>
  </div>;
}