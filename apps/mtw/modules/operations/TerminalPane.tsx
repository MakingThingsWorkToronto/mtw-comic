import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useFillHeight } from '../../web/ui/useFillHeight';

interface Props {
  id: string;
  /** Whether the server reports the process still running; reconnects only while it is. */
  running: boolean;
  /** Receives a sender that types into the terminal (null when disconnected), for composers beside it. */
  bind?: (send: ((data: string) => boolean) | null) => void;
  /** Fill the window's height below the terminal (its own page); a panel that sizes it leaves this off. */
  fill?: boolean;
}

type Frame = { type: 'replay' | 'output'; data: string } | { type: 'exit'; exitCode: number } | { type: 'error'; message: string };

/**
 * An xterm bound to /ws/terminal/:id. The server keeps ~256 KB of scrollback per terminal and
 * replays it on every attach, so leaving this view and coming back loses nothing.
 */
export function TerminalPane({ id, running, bind, fill }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  useFillHeight(wrap, 24, fill ? 'always' : 'off');
  const runningRef = useRef(running);
  runningRef.current = running;
  const bindRef = useRef(bind);
  bindRef.current = bind;
  const [state, setState] = useState<'connecting' | 'live' | 'closed'>('connecting');

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'Consolas, "Cascadia Mono", Menlo, monospace',
      scrollback: 5000,
      theme: { background: '#0b1419', foreground: '#f2f2ef', cursor: '#5fc4c9', selectionBackground: '#1a9ba166' },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(el);

    let ws: WebSocket | null = null;
    let retry: number | undefined;
    let disposed = false;

    const sendResize = () => {
      if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
    };
    const doFit = () => {
      try {
        fit.fit();
      } catch {
        /* host not laid out yet */
      }
      sendResize();
    };

    const connect = () => {
      setState('connecting');
      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      ws = new WebSocket(`${proto}://${location.host}/ws/terminal/${encodeURIComponent(id)}`);
      ws.onopen = () => {
        setState('live');
        doFit();
        bindRef.current?.((data) => {
          if (ws?.readyState !== WebSocket.OPEN) return false;
          ws.send(JSON.stringify({ type: 'input', data })); return true;
        });
      };
      ws.onmessage = (event) => {
        const frame = JSON.parse(String(event.data)) as Frame;
        if (frame.type === 'replay') {
          term.reset();
          term.write(frame.data);
        } else if (frame.type === 'output') term.write(frame.data);
        else if (frame.type === 'exit') term.write(`\r\n\x1b[2m[process exited with code ${frame.exitCode}]\x1b[0m\r\n`);
        else if (frame.type === 'error') term.write(`\r\n[${frame.message}]\r\n`);
      };
      ws.onclose = () => {
        setState('closed');
        bindRef.current?.(null);
        if (!disposed && runningRef.current) retry = window.setTimeout(connect, 1500);
      };
    };

    const input = term.onData((data) => {
      if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'input', data }));
    });
    const observer = new ResizeObserver(() => doFit());
    observer.observe(el);
    connect();

    return () => {
      disposed = true;
      window.clearTimeout(retry);
      observer.disconnect();
      input.dispose();
      ws?.close();
      term.dispose();
    };
  }, [id]);

  return (
    <div class="terminal-wrap" ref={wrap}>
      <div class="terminal-host" ref={host} role="group" aria-label="Terminal" data-state={state} />
    </div>
  );
}
