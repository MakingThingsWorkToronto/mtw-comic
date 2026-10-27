import { useEffect, useState } from 'preact/hooks';
import type { CastDetail } from './types';

type Slot = NonNullable<CastDetail['slot']>;
const VERSIONED = /^(.*)-v(\d+)\.(png|jpe?g|webp|avif)$/i;
const POLL_MS = 15_000;

const mediaUrl = (rel: string) => `/api/comics/media?path=${encodeURIComponent(rel)}`;

async function exists(rel: string): Promise<boolean> {
  const res = await fetch(mediaUrl(rel), { headers: { Range: 'bytes=0-0' } }).catch(() => null);
  return !!res && (res.status === 200 || res.status === 206);
}

/**
 * The character's reference slot as the client can see it. A server that already reports `slot` wins. A server started
 * before slots existed only reports the registered sheet, so the client probes the next `-vN` names through the media
 * route and keeps probing every 15 s: a newly generated sheet shows without a Studio restart or a manual reload.
 */
export function useReferenceSlot(data: CastDetail | null): Slot | undefined {
  const [probed, setProbed] = useState<Slot | undefined>(undefined);
  const portrait = data?.portrait ? new URLSearchParams(data.portrait.split('?')[1] ?? '').get('path') : null;
  const serverSlot = data?.slot;
  useEffect(() => {
    if (serverSlot || !portrait) return;
    const m = VERSIONED.exec(portrait.split('/').pop() ?? '');
    if (!m) return;
    const dir = portrait.slice(0, portrait.lastIndexOf('/'));
    const [, stem, n, ext] = m;
    let stop = false;
    const probe = async () => {
      const found: Slot['versions'] = [];
      for (let v = Number(n) + 1; v < Number(n) + 20; v++) {
        const rel = `${dir}/${stem}-v${v}.${ext}`;
        if (!(await exists(rel))) break;
        found.push({ version: v, path: rel, preview: mediaUrl(rel), savedAt: '', registered: false, observations: [], unresolved: [] });
      }
      const registered = { version: Number(n), path: portrait, preview: mediaUrl(portrait), savedAt: '', registered: true, observations: [], unresolved: [] };
      if (!stop) setProbed({ dir, stem: stem ?? '', recordId: data?.model?.recordId ?? null, registeredVersion: Number(n), versions: [...found.reverse(), registered] });
    };
    void probe();
    const timer = setInterval(() => void probe(), POLL_MS);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, [serverSlot, portrait]);
  return serverSlot ?? probed;
}

/** The catalog record holding one slot file, and its review state, from the Images module. */
export interface SlotRecord { id: string; style: string; state: string; status: string }

/**
 * Looks up which image-catalog record holds each slot file (`/api/images/records`), so the cast page can show
 * whether a sheet is registered and offer Matt's approve/reject on the page he is working on. Re-checks every 15 s.
 */
export function useSlotRecords(slot: Slot | undefined): Record<string, SlotRecord> {
  const [found, setFound] = useState<Record<string, SlotRecord>>({});
  const key = slot ? `${slot.dir}/${slot.stem}:${slot.versions.map((v) => v.version).join(',')}` : '';
  useEffect(() => {
    if (!slot) return;
    let stop = false;
    const look = async () => {
      const res = await fetch(`/api/images/records?q=${encodeURIComponent(slot.stem)}&limit=100`).catch(() => null);
      const body = res?.ok ? ((await res.json()) as { items?: { id: string; style: string; status: string; state: string; treatment?: { path?: string } }[] }) : null;
      const out: Record<string, SlotRecord> = {};
      for (const item of body?.items ?? []) {
        const p = item.treatment?.path;
        if (p && !item.id.startsWith('earlier-')) out[`wiki/image-library/${p}`] = { id: item.id, style: item.style, state: item.state, status: item.status };
      }
      if (!stop) setFound(out);
    };
    void look();
    const timer = setInterval(() => void look(), POLL_MS);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, [key]);
  return found;
}
