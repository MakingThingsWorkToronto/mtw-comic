/** Saved speech previews only. The complete comic mix remains the reader's own controller. */
export const PREVIEW_HEADROOM = 0.6;
export const SPEECH_ATTACK = 0.025;
export const SPEECH_RELEASE = 0.045;
export const SPEECH_BUS_LEVEL = 0.7;

let shared: AudioContext | null = null;
const outputs = new WeakMap<AudioContext, GainNode>();
const sources = new WeakMap<HTMLMediaElement, { context: AudioContext; node: MediaElementAudioSourceNode }>();
const owners = new WeakMap<HTMLMediaElement, SpeechPreview>();
let active: SpeechPreview | null = null;

export function previewOutput(ctx: AudioContext): GainNode {
  const cached = outputs.get(ctx);
  if (cached) return cached;
  const master = ctx.createGain(), hp = ctx.createBiquadFilter(), low = ctx.createBiquadFilter(), high = ctx.createBiquadFilter();
  master.gain.value = PREVIEW_HEADROOM;
  hp.type = 'highpass'; hp.frequency.value = 35; hp.Q.value = 0.707;
  low.type = 'lowshelf'; low.frequency.value = 120; low.gain.value = -2;
  high.type = 'highshelf'; high.frequency.value = 4500; high.gain.value = -1.5;
  master.connect(hp); hp.connect(low); low.connect(high); high.connect(ctx.destination);
  outputs.set(ctx, master);
  return master;
}

function context(): AudioContext {
  if (!shared || shared.state === 'closed') shared = new AudioContext();
  return shared;
}

export interface SpeechPreview {
  play(): Promise<void>;
  stop(): void;
  seek(seconds: number): void;
  dispose(): void;
  snapshot(): { headroom: number; speechBus: number; attack: number; release: number; offset: number; active: boolean; naturalEnd: number | null };
}

export function speechPreview(media: HTMLMediaElement, ctx = sources.get(media)?.context ?? context()): SpeechPreview {
  let source = sources.get(media);
  if (source && source.context !== ctx) throw new Error('A speech media element cannot move between audio contexts');
  if (!source) {
    source = { context: ctx, node: ctx.createMediaElementSource(media) };
    sources.set(media, source);
  }
  const gain = ctx.createGain(); gain.gain.value = 0;
  source.node.connect(gain); gain.connect(previewOutput(ctx));
  // Headroom is applied once in the common output, never also in media.volume.
  media.volume = 1;
  let generation = 0, disposed = false, running = false, started = false, end: number | null = null;
  function silence() {
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now); gain.gain.setValueAtTime(0, now);
    running = false; started = false; end = null;
    if (active === api) active = null;
  }
  function envelope() {
    const now = ctx.currentTime, remaining = media.duration - media.currentTime;
    gain.gain.cancelScheduledValues(now); gain.gain.setValueAtTime(0, now);
    const attack = Number.isFinite(remaining) && remaining > 0 ? Math.min(SPEECH_ATTACK, remaining / 2) : SPEECH_ATTACK;
    gain.gain.linearRampToValueAtTime(SPEECH_BUS_LEVEL, now + attack);
    end = Number.isFinite(remaining) && remaining > 0 ? now + remaining : null;
    if (end !== null) {
      const release = Math.min(SPEECH_RELEASE, remaining / 2);
      gain.gain.setValueAtTime(SPEECH_BUS_LEVEL, Math.max(now + attack, end - release));
      gain.gain.linearRampToValueAtTime(0, end);
    }
  }
  function ended() { silence(); }
  function playing() { if (running && !disposed) { started = true; envelope(); } }
  function visibility() { if (globalThis.document?.hidden) api.stop(); }
  function pagehide() { api.stop(); }
  const api: SpeechPreview = {
    async play() {
      if (disposed || ctx.state === 'closed' || typeof media.playbackRate !== 'number' || media.playbackRate !== 1) throw new Error('Speech preview requires an undisposed media element at its original speed');
      if (globalThis.document?.hidden) return;
      if (active && active !== api) active.stop();
      const mine = ++generation;
      if (ctx.state === 'suspended') await ctx.resume();
      if (disposed || mine !== generation) return;
      if (globalThis.document?.hidden) return;
      if (active && active !== api) active.stop();
      active = api; running = true; started = false;
      gain.gain.cancelScheduledValues(ctx.currentTime); gain.gain.setValueAtTime(0, ctx.currentTime);
      try { await media.play(); }
      catch (error) { if (mine === generation) silence(); throw error; }
      // Stop/route change during a pending play promise must not revive the clip.
      if (disposed || mine !== generation) {
        if (owners.get(media) === api && (!running || active !== api)) media.pause();
      }
      else if (!started) { started = true; envelope(); }
    },
    stop() { generation++; media.pause(); silence(); },
    seek(seconds) {
      if (!Number.isFinite(seconds) || seconds < 0 || disposed) throw new RangeError('Speech preview position must be finite and nonnegative');
      const wasPlaying = running && !media.paused;
      silence(); media.currentTime = seconds;
      if (wasPlaying) { active = api; running = true; envelope(); }
    },
    dispose() {
      if (disposed) return;
      api.stop(); disposed = true;
      media.removeEventListener('ended', ended); media.removeEventListener('playing', playing);
      globalThis.document?.removeEventListener('visibilitychange', visibility);
      globalThis.window?.removeEventListener('pagehide', pagehide);
      source!.node.disconnect(gain); gain.disconnect();
    },
    snapshot: () => ({ headroom: PREVIEW_HEADROOM, speechBus: SPEECH_BUS_LEVEL, attack: SPEECH_ATTACK, release: SPEECH_RELEASE, offset: media.currentTime, active: running, naturalEnd: end }),
  };
  media.addEventListener('ended', ended); media.addEventListener('playing', playing);
  owners.set(media, api);
  globalThis.document?.addEventListener('visibilitychange', visibility);
  globalThis.window?.addEventListener('pagehide', pagehide);
  return api;
}
