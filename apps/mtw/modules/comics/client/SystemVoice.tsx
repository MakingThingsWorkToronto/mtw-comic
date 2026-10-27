// Provisional browser speech for timing and delivery tests: a system voice reads a named audition script or the sample
// line. Ported from the retired comics console (git 51eb6e03:wiki/comics-library/app.js, "Live system voice audition").
// It creates no audio file and is not a final recording; it is hidden once a voice is chosen (the console blocked it too).
import { useEffect, useState } from 'preact/hooks';
import { Button } from '../../../web/ui';
import type { CastDetail } from './types';

const clamp = (v: number, lo: number, hi: number, fallback: number): number => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);

export function SystemVoiceAudition({ detail }: { detail: CastDetail }) {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
  const supported = Boolean(synth && typeof SpeechSynthesisUtterance !== 'undefined');
  const scripts = detail.auditionScripts ?? [];
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState(detail.audition?.voiceURI ?? '');
  const [rate, setRate] = useState(String(detail.audition?.rate ?? 1));
  const [pitch, setPitch] = useState(String(detail.audition?.pitch ?? 1));
  const [script, setScript] = useState(scripts[0]?.id ?? 'custom');
  const [message, setMessage] = useState(supported ? 'Choose a voice and press Audition. Nothing plays automatically.' : 'System speech is unavailable in this browser.');

  useEffect(() => {
    if (!synth) return undefined;
    const load = () => setVoices(synth.getVoices());
    load();
    synth.addEventListener?.('voiceschanged', load);
    return () => {
      synth.removeEventListener?.('voiceschanged', load);
      synth.cancel();
    };
  }, [synth]);
  useEffect(() => setScript(scripts[0]?.id ?? 'custom'), [detail.id]);

  const audition = (): void => {
    if (!synth) return;
    const text = (scripts.find((s) => s.id === script)?.text ?? detail.profile?.sampleLine ?? '').trim();
    if (!text) {
      setMessage('Add a sample line before auditioning this profile.');
      return;
    }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/\n/g, ' '));
    const v = voices.find((x) => x.voiceURI === voiceURI);
    if (v) u.voice = v;
    u.rate = clamp(Number(rate), 0.5, 2, 1);
    u.pitch = clamp(Number(pitch), 0, 2, 1);
    u.onerror = () => setMessage('System voice playback failed. Choose another voice or browser.');
    u.onend = () => setMessage('Finished. This is provisional browser speech, not a recording.');
    setMessage(`Playing ${v ? v.name : 'the browser default voice'}.`);
    synth.speak(u);
  };

  return (
    <section class="stack" aria-label="Live system voice audition">
      <h2>Live system voice audition</h2>
      <p class="muted small">Provisional browser speech for testing timing and delivery. It creates no audio file and is not a final recording.</p>
      <div class="profile-grid">
        <div class="field wide">
          <label for="sv-voice">System voice</label>
          <select id="sv-voice" class="select" value={voiceURI} disabled={!supported} onChange={(e) => setVoiceURI((e.target as HTMLSelectElement).value)}>
            <option value="">Browser default</option>
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} · {v.lang}
              </option>
            ))}
          </select>
        </div>
        <div class="field">
          <label for="sv-rate">Rate</label>
          <input id="sv-rate" class="input" type="number" min="0.5" max="2" step="0.1" value={rate} onInput={(e) => setRate((e.target as HTMLInputElement).value)} />
        </div>
        <div class="field">
          <label for="sv-pitch">Pitch</label>
          <input id="sv-pitch" class="input" type="number" min="0" max="2" step="0.1" value={pitch} onInput={(e) => setPitch((e.target as HTMLInputElement).value)} />
        </div>
        <div class="field wide">
          <label for="sv-script">Script</label>
          <select id="sv-script" class="select" value={script} onChange={(e) => setScript((e.target as HTMLSelectElement).value)}>
            {scripts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
            <option value="custom">Sample line above</option>
          </select>
        </div>
      </div>
      <div class="row">
        <Button variant="secondary" disabled={!supported} help="Reads the chosen script aloud with your computer's built-in voice so you can judge timing and delivery. It makes no audio file and chooses no voice for the character." onClick={audition}>
          Audition
        </Button>
        <Button variant="ghost" disabled={!supported} help="Stops the voice that is reading. Nothing is changed." onClick={() => synth?.cancel()}>
          Stop
        </Button>
      </div>
      <p class="muted small" aria-live="polite">
        {message}
      </p>
    </section>
  );
}
