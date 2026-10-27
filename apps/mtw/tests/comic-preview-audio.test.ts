import { afterEach, describe, expect, it, vi } from 'vitest';
import { previewOutput, speechPreview, PREVIEW_HEADROOM, SPEECH_BUS_LEVEL } from '../web/playback/previewAudio';

class Param {
  value = 0;
  events: [string, number, number][] = [];
  cancelScheduledValues(t: number) { this.events.push(['cancel', 0, t]); }
  setValueAtTime(v: number, t: number) { this.value = v; this.events.push(['set', v, t]); }
  linearRampToValueAtTime(v: number, t: number) { this.events.push(['linear', v, t]); }
}
class Node {
  gain = new Param(); frequency = new Param(); Q = new Param(); type = '';
  connections: Node[] = [];
  connect(n: Node) { this.connections.push(n); return n; }
  disconnect(n?: Node) { this.connections = n ? this.connections.filter(x => x !== n) : []; }
}
class Context {
  currentTime = 10; state = 'running'; destination = new Node(); gains: Node[] = []; filters: Node[] = []; sourceCount = 0;
  resume = () => Promise.resolve();
  createGain() { const n = new Node(); this.gains.push(n); return n; }
  createBiquadFilter() { const n = new Node(); this.filters.push(n); return n; }
  createMediaElementSource() { this.sourceCount++; return new Node(); }
}
class Media {
  duration = 2.612245; currentTime = 0; paused = true; playbackRate = 1; volume = 0.5; plays = 0; pauses = 0;
  events = new Map<string, Set<() => void>>();
  addEventListener(k: string, fn: () => void) { if (!this.events.has(k)) this.events.set(k, new Set()); this.events.get(k)!.add(fn); }
  removeEventListener(k: string, fn: () => void) { this.events.get(k)?.delete(fn); }
  emit(k: string) { this.events.get(k)?.forEach(fn => fn()); }
  play = async () => { this.plays++; this.paused = false; this.emit('playing'); };
  pause() { this.pauses++; this.paused = true; }
}
const create = () => { const media = new Media(), ctx = new Context(), p = speechPreview(media as unknown as HTMLMediaElement, ctx as unknown as AudioContext); return { media, ctx, p, gain: ctx.gains[0]! }; };
afterEach(() => vi.unstubAllGlobals());
describe('raw saved speech preview routing and clock envelopes', () => {
  it('shares one headroom/EQ route per context without double media attenuation', () => {
    const f = create(), master = previewOutput(f.ctx as unknown as AudioContext) as unknown as Node;
    expect(previewOutput(f.ctx as unknown as AudioContext)).toBe(master);
    expect(master.gain.value).toBe(PREVIEW_HEADROOM); expect(f.media.volume).toBe(1);
    expect(f.gain.connections).toEqual([master]); expect(f.ctx.filters.map(n => [n.type,n.frequency.value,n.gain.value])).toEqual([['highpass',35,0],['lowshelf',120,-2],['highshelf',4500,-1.5]]);
    expect(f.ctx.filters.at(-1)!.connections).toEqual([f.ctx.destination]); f.p.dispose();
  });
  it('starts at original media offset and schedules25ms attack/.7 bus and45ms release within encoded duration', async () => {
    const f = create(); await f.p.play();
    expect(f.media.currentTime).toBe(0); expect(f.media.playbackRate).toBe(1);
    expect(f.gain.gain.events).toContainEqual(['linear',SPEECH_BUS_LEVEL,10.025]);
    expect(f.gain.gain.events).toContainEqual(['set',SPEECH_BUS_LEVEL,10+f.media.duration-.045]);
    expect(f.gain.gain.events).toContainEqual(['linear',0,10+f.media.duration]); f.p.dispose();
  });
  it('midline seeking cancels old gain automation then ramps the exact elapsed offset without restarting sourcewords', async () => {
    const f = create(); await f.p.play(); f.ctx.currentTime=11; f.p.seek(1.2);
    expect(f.media.currentTime).toBe(1.2); expect(f.media.plays).toBe(1); expect(f.p.snapshot().naturalEnd).toBeCloseTo(11+f.media.duration-1.2);
    expect(f.gain.gain.events.slice(-5)[0]![0]).toBe('cancel'); expect(f.gain.gain.events.at(-1)![2]).toBeCloseTo(11+f.media.duration-1.2); f.p.dispose();
  });
  it('paused seek stays silent; backward replay has a fresh envelope and original source duration', async () => {
    const f=create(); await f.p.play(); f.p.stop(); f.p.seek(.8); expect(f.p.snapshot().active).toBe(false); expect(f.gain.gain.value).toBe(0);
    f.p.seek(0); await f.p.play(); expect(f.media.currentTime).toBe(0); expect(f.media.duration).toBe(2.612245); f.p.dispose();
  });
  it('short remaining windows cannot schedule fades beyond the source end', async () => {
    const f=create();f.media.currentTime=f.media.duration-.01;await f.p.play();const end=f.ctx.currentTime+.01;
    expect(f.gain.gain.events.filter(e=>e[0]==='linear').every(e=>e[2]<=end+1e-9)).toBe(true);f.p.dispose();
  });
  it('stop cancels a suspended-context start with no delayed audio or backlog', async () => {
    const f=create();f.ctx.state='suspended';let resume!:()=>void;f.ctx.resume=()=>new Promise<void>(r=>resume=r);
    const start=f.p.play();f.p.stop();resume();await start;expect(f.media.plays).toBe(0);expect(f.gain.gain.value).toBe(0);f.p.dispose();
  });
  it('dispose during pending media.play cannot revive playback on late success', async () => {
    const f=create();let resolve!:()=>void;f.media.play=()=>{f.media.paused=false;return new Promise<void>(r=>resolve=r);};
    const start=f.p.play();f.p.dispose();resolve();await start;expect(f.media.paused).toBe(true);expect(f.gain.connections).toEqual([]);expect(f.p.snapshot().active).toBe(false);
  });
  it('only one raw speech preview is active, including competing resumed contexts', async () => {
    const a=create(),b=create();a.ctx.state='suspended';b.ctx.state='suspended';let ra!:()=>void,rb!:()=>void;a.ctx.resume=()=>new Promise<void>(r=>ra=r);b.ctx.resume=()=>new Promise<void>(r=>rb=r);
    const pa=a.p.play(),pb=b.p.play();ra();await pa;rb();await pb;expect(a.media.paused).toBe(true);expect(a.gain.gain.value).toBe(0);expect(b.p.snapshot().active).toBe(true);a.p.dispose();b.p.dispose();
  });
  it('an old play promise cannot pause a newer replay on the same element', async () => {
    const f=create();let old!:()=>void;f.media.play=()=>{f.media.paused=false;return new Promise<void>(r=>old=r);};const first=f.p.play();f.p.stop();
    f.media.play=async()=>{f.media.paused=false;f.media.emit('playing');};await f.p.play();old();await first;expect(f.media.paused).toBe(false);expect(f.p.snapshot().active).toBe(true);f.p.dispose();
  });
  it('an old disposed owner cannot pause the newly mounted owner of the reused element', async () => {
    const f=create();let old!:()=>void;f.media.play=()=>{f.media.paused=false;return new Promise<void>(r=>old=r);};const first=f.p.play();f.p.dispose();
    const next=speechPreview(f.media as unknown as HTMLMediaElement,f.ctx as unknown as AudioContext);f.media.play=async()=>{f.media.paused=false;f.media.emit('playing');};await next.play();old();await first;expect(f.media.paused).toBe(false);expect(next.snapshot().active).toBe(true);next.dispose();
  });
  it('natural end clears active state; reusing the same media element does not create a forbidden second source node', async () => {
    const f=create();await f.p.play();f.media.emit('ended');expect(f.p.snapshot().active).toBe(false);f.p.dispose();
    const again=speechPreview(f.media as unknown as HTMLMediaElement,f.ctx as unknown as AudioContext);expect(f.ctx.sourceCount).toBe(1);await again.play();again.dispose();
  });
  it('invalid seek/speed and disposed play cannot change or start source playback', async () => {
    const f=create();expect(()=>f.p.seek(NaN)).toThrow();expect(()=>f.p.seek(-1)).toThrow();f.media.playbackRate=1.5;await expect(f.p.play()).rejects.toThrow();expect(f.media.plays).toBe(0);f.p.dispose();await expect(f.p.play()).rejects.toThrow();
  });
  it('hidden/pagehide stop immediately and cancel future starts without modifying media bytes', async () => {
    const doc=new Media() as Media & {hidden:boolean};doc.hidden=false;const win=new Media();vi.stubGlobal('document',doc);vi.stubGlobal('window',win);
    const f=create();await f.p.play();doc.hidden=true;doc.emit('visibilitychange');expect(f.media.paused).toBe(true);expect(f.gain.gain.value).toBe(0);
    await f.p.play();expect(f.media.plays).toBe(1);doc.hidden=false;await f.p.play();win.emit('pagehide');expect(f.gain.gain.value).toBe(0);f.p.dispose();
  });
});
