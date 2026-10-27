// Comic Editor: asks the reader iframe for its read-only geometry() over postMessage ({type:'mtw-geometry'} ->
// {type:'mtw-geometry-result'}), which the engine answers for the same origin (site proxy) or, with ?editor=<this origin>, for an exact loopback
// editor origin (direct framing of the Astro dev site). `opts.origin` is the frame's origin; `opts.onTimeout` fires if
// no reply arrives within 3 s of a (re)start, so the caller can fall back to the proxy.
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import type { RefObject } from 'preact';
import type { Geometry } from './model';

export type GeometryStatus = 'waiting' | 'ready' | 'unavailable';

export function useGeometry(frame: RefObject<HTMLIFrameElement>, resetKey: string, opts: { origin?: string; onTimeout?: () => void } = {}): { geo: Geometry | null; status: GeometryStatus; refresh: () => void } {
  const [geo, setGeo] = useState<Geometry | null>(null);
  const [status, setStatus] = useState<GeometryStatus>('waiting');
  const seq = useRef(0);
  const misses = useRef(0);
  const targetOrigin = opts.origin ?? window.location.origin;
  const onTimeout = useRef(opts.onTimeout);
  onTimeout.current = opts.onTimeout;
  const gotReply = useRef(false);

  const refresh = useCallback(() => {
    const win = frame.current?.contentWindow;
    if (!win) return;
    seq.current += 1;
    try {
      win.postMessage({ type: 'mtw-geometry', requestId: seq.current }, targetOrigin);
    } catch {
      /* cross-origin frame: handled by the miss counter */
    }
    misses.current += 1;
    if (misses.current > 6) setStatus((s) => (s === 'ready' ? s : 'unavailable'));
  }, [frame, targetOrigin]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== targetOrigin || e.source !== frame.current?.contentWindow) return;
      const d = e.data as { type?: string; geometry?: Geometry } | null;
      if (d?.type !== 'mtw-geometry-result' || !d.geometry) return;
      misses.current = 0;
      gotReply.current = true;
      setGeo(d.geometry);
      setStatus('ready');
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [frame, targetOrigin]);

  useEffect(() => {
    misses.current = 0;
    gotReply.current = false;
    const fallback = window.setTimeout(() => { if (!gotReply.current) onTimeout.current?.(); }, 3000);
    setStatus('waiting');
    const id = window.setInterval(refresh, 1000);
    const t = window.setTimeout(refresh, 300);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(t);
      window.clearTimeout(fallback);
    };
  }, [resetKey, refresh]);

  return { geo, status, refresh };
}
