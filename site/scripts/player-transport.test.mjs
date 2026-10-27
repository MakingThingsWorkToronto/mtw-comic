import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { Window } from 'happy-dom';
import { expect, it, vi } from 'vitest';

const code = readFileSync(new URL('../public/scripts/motion-toolbar.js', import.meta.url), 'utf8');
it('routes transport to the registered story while preserving native playlist links for other players', async () => {
  const window = new Window();
  try {
    window.document.body.innerHTML = '<div data-motion-toolbar><a class="rl-prev" href="/previous/"></a><button class="rl-pause"><span class="rl-pause__label">Pause</span></button><a class="rl-next" href="/next/"></a></div>';
    vm.runInNewContext(code, { window, document: window.document, CustomEvent: window.CustomEvent, setTimeout: () => 1, performance: { now: () => 0 } });
    const prev = vi.fn(), next = vi.fn(), togglePause = vi.fn();
    window.MTWToolbar.register({ prev, next, togglePause });
    function press(selector) { const e = new window.MouseEvent('click', { bubbles: true, cancelable: true }); window.document.querySelector(selector).dispatchEvent(e); return e.defaultPrevented; }
    expect(press('.rl-next')).toBe(true); expect(next).toHaveBeenCalledOnce();
    expect(press('.rl-prev')).toBe(true); expect(prev).toHaveBeenCalledOnce();
    press('.rl-pause'); expect(togglePause).toHaveBeenCalledOnce();
    window.MTWToolbar.setPaused(true);
    expect(window.document.querySelector('.rl-pause').getAttribute('aria-label')).toBe('Play');
    window.MTWToolbar.register({});
    expect(press('.rl-next')).toBe(false);
    expect(next).toHaveBeenCalledOnce();
  } finally { await window.happyDOM.abort(); }
});
