// Voice input for any text field: the browser's speech recognition (Chrome/Edge), dictating into a callback.
// Hidden when the browser has none. Nothing is recorded or sent anywhere by Studio; the browser does the recognition.
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

interface RecognitionResult { isFinal: boolean; 0: { transcript: string } }
interface RecognitionEvent { resultIndex: number; results: ArrayLike<RecognitionResult> }
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start(): void;
  stop(): void;
}
type RecognitionCtor = new () => Recognition;

const ctor = (): RecognitionCtor | null => {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

export { appendDictation } from './chatText';

export interface Dictation {
  supported: boolean;
  listening: boolean;
  /** Words heard but not final yet. */
  interim: string;
  error: string;
  toggle: () => void;
  stop: () => void;
}

/** Dictation into `onFinal` (called once per finished phrase). Continues until stopped. */
export function useDictation(onFinal: (text: string) => void, lang = 'en-CA'): Dictation {
  const Ctor = ctor();
  const rec = useRef<Recognition | null>(null);
  const cb = useRef(onFinal);
  cb.current = onFinal;
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState('');

  const stop = useCallback(() => {
    rec.current?.stop();
  }, []);
  const toggle = useCallback(() => {
    if (!Ctor) return;
    if (rec.current) {
      rec.current.stop();
      return;
    }
    const r = new Ctor();
    r.lang = lang;
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      let pending = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i] as RecognitionResult;
        if (res.isFinal) cb.current(res[0].transcript);
        else pending += res[0].transcript;
      }
      setInterim(pending);
    };
    r.onerror = (e) => setError(e.error === 'not-allowed' ? 'Microphone permission was refused.' : `Voice input: ${e.error}`);
    r.onend = () => {
      rec.current = null;
      setListening(false);
      setInterim('');
    };
    setError('');
    rec.current = r;
    r.start();
    setListening(true);
  }, [Ctor, lang]);
  useEffect(() => () => rec.current?.stop(), []);
  return { supported: !!Ctor, listening, interim, error, toggle, stop };
}

/** The mic toggle. Renders nothing when the browser has no speech recognition. */
export function MicButton({ dictation, label = 'Voice input' }: { dictation: Dictation; label?: string }) {
  if (!dictation.supported) return null;
  return (
    <button
      type="button"
      class={`btn btn--small mic${dictation.listening ? ' mic--on' : ''}`}
      aria-pressed={dictation.listening}
      aria-label={dictation.listening ? `${label}: listening, press to stop` : label}
      title={dictation.listening ? 'Stops listening. What was heard stays in the box for you to edit; nothing is sent.' : 'Turns on your microphone and types what you say into the box. Nothing is sent until you press the send or save button yourself.'}
      onClick={dictation.toggle}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path fill="currentColor" d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12h-2Z" />
      </svg>
      {dictation.listening ? ' Listening' : ''}
    </button>
  );
}
