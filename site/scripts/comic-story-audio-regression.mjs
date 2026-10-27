import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

// Execute the real audio controller, with browser audio policy modelled explicitly.
// This does not claim audible/browser verification; run both sound controls there too.
const path = process.argv[2] ? resolve(process.argv[2]) : fileURLToPath(new URL('../public/scripts/comic-story.js', import.meta.url));
const source = readFileSync(path, 'utf8');
const from = source.indexOf('  /* ---------- Clock and music');
const to = source.indexOf("  var skip = stage.querySelector('.cs-skip');", from);
assert(from >= 0 && to > from, 'audio controller boundaries exist');
const code = source.slice(from, to);
const visibilityFrom = source.indexOf("  document.addEventListener('visibilitychange', function () {");
const visibilityTo = source.indexOf('  var rsz = 0;', visibilityFrom);
assert(visibilityFrom >= 0 && visibilityTo > visibilityFrom, 'visibility handler boundaries exist');
// Collapse's audio handoff precedes the unrelated geometry animation. Execute that exact prefix.
const collapseFrom = source.indexOf('  function collapse() {');
const collapseTo = source.indexOf("    state = 'collapsing';", collapseFrom);
assert(collapseFrom >= 0 && collapseTo > collapseFrom, 'collapse audio handoff boundaries exist');
const navigationFrom = source.indexOf('  new MutationObserver(function () {', source.indexOf('  /* ---------- The mixtape:'));
const navigationTo = source.indexOf('  var mixIn = false;', navigationFrom);
assert(navigationFrom >= 0 && navigationTo > navigationFrom);
const navigationCode = source.slice(navigationFrom, navigationTo);
const lifecycleCode = source.slice(visibilityFrom, visibilityTo) + source.slice(collapseFrom, collapseTo) + '}';
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
function fixture({ muted = false, score = 0 } = {}) {
  const listeners = {}, documentListeners = {}, clicks = {}, contexts = [], audios = [], classes = new Set();
  const attributes = {}; const stored = {}; const timers = new Map(); let timerId = 0;
  const env = { gesture: false, sound: !muted, blocked: false, resumeCalls: 0, playCalls: 0, spectrum: 0 };
  const parameter = (value = 0) => ({ value, events: [], cancelScheduledValues(t) { this.events.push(["cancel",0,t]); }, setTargetAtTime(v,t,k) { this.value = v; this.events.push(["target",v,t,k]); }, setValueAtTime(v,t) { this.value = v; this.events.push(["set",v,t]); }, linearRampToValueAtTime(v,t) { this.events.push(["linear",v,t]); }, exponentialRampToValueAtTime(v,t) { this.events.push(["exponential",v,t]); } });
  const node = () => ({ gain: parameter(), frequency: parameter(), Q: parameter(), detune: parameter(), connections: [], connect(to) { this.connections.push(to); return to; }, disconnect() { this.connections = []; }, start() {}, stop() {} });
  class AudioContext {
    constructor() { this.state = 'suspended'; this.currentTime = 0; this.sampleRate = 8; this.destination = {}; this.gains = []; contexts.push(this); }
    createGain() { const g = node(); this.gains.push(g); return g; }
    createMediaElementSource() { return node(); }
    createAnalyser() {
      const analyser = node(); analyser.fftSize = 2048;
      Object.defineProperty(analyser, 'frequencyBinCount', { get: () => analyser.fftSize / 2 });
      analyser.getByteFrequencyData = values => values.fill(env.spectrum);
      this.analyser = analyser; return analyser;
    }
    close() { this.state = 'closed'; return Promise.resolve(); }
    createBuffer() { return { getChannelData: () => new Float32Array(32) }; }
    createBufferSource() { return node(); }
    createBiquadFilter() { return node(); }
    createOscillator() { return node(); }
    resume() { env.resumeCalls++; if (env.gesture) this.state = 'running'; return Promise.resolve(); }
    suspend() { this.state = 'suspended'; return Promise.resolve(); }
  }
  class Audio {
    constructor() { this.paused = true; this.currentTime = 0; this.muted = false; audios.push(this); }
    addEventListener() {}
    play() { env.playCalls++; if (!this.muted && !env.gesture) return Promise.reject(new Error('autoplay blocked')); this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
  }
  const window = {
    AudioContext,
    addEventListener(type, callback) { (listeners[type] ||= []).push(callback); },
    MTWTactile: {
      isSoundOn: () => env.sound,
      setBlocked: value => { env.blocked = value; },
      setSound(value) { env.sound = value; for (const cb of listeners['mtw-sound'] || []) cb({ detail: { on: value } }); }
    }
  };
  const bars = Array.from({ length: 4 }, () => ({ style: { setProperty(name, value) { this[name] = value; } } }));
  const creditAttributes = {};
  const credit = { setAttribute(name, value) { creditAttributes[name] = value; } };
  const tag = { querySelectorAll: selector => selector === '.rl-eq i' ? bars : [], querySelector: selector => selector === '.rl-tag__credit' ? credit : null, classList: { add: (...names) => names.forEach(x => classes.add(x)), remove: (...names) => names.forEach(x => classes.delete(x)), toggle(name, on) { if (on) classes.add(name); else classes.delete(name); } } };
  const muteBtn = { setAttribute: (key, value) => { attributes[key] = value; }, addEventListener: (type, callback) => { clicks[type] = callback; } };
  const scene = { b: 0, l: 100, score, room: 'none', panels: [] };
  const sandbox = vm.createContext({
    window, Audio, URL, URLSearchParams, q: new URLSearchParams(), document: { baseURI: 'http://localhost:8789/comics/test/', hidden: false, addEventListener(type, callback) { documentListeners[type] = callback; } },
    localStorage: { getItem: () => muted ? 'off' : 'on' }, sessionStorage: { getItem: key => stored[key] || '{}', setItem(key, value) { stored[key] = value; } },
    MutationObserver: class { constructor(callback) { env.leave = callback; } observe() {} }, root: { hasAttribute: () => true },
    story: { music: { src: '/song.mp3', offset: 0, credit: 'test' }, next: { b: 100 }, beats: 100 },
    APP: false, scenes: [scene], B: 1, END_T: 102, REDUCED: false, mixIn: false, audioPre: null, tag, muteBtn,
    c01: v => Math.max(0, Math.min(1, v)), clamp: (v,a,b) => Math.max(a,Math.min(b,v)),
    now: () => 5, sceneAt: () => 0, render() {}, performance: { now: () => 5000 },
    requestAnimationFrame: () => 1, setTimeout(callback) { const id = ++timerId; timers.set(id, callback); return id; }, clearTimeout(id) { timers.delete(id); },
    ramp() {}, playTail() {}, XF: 4, EQ_IN() {}
  });
  vm.runInContext(code + lifecycleCode + navigationCode, sandbox);
  const run = expression => vm.runInContext(expression, sandbox);
  const event = selector => ({ target: { closest: query => query.includes(selector) ? {} : null } });
  return { env, contexts, audios, attributes, run, stored, bars, credit, creditAttributes, classes,
    pagehide(persisted) { for (const callback of listeners.pagehide || []) callback({ persisted }); },
    swap() { documentListeners['astro:before-swap']?.(); },
    meter() { const pair = [...timers].find(([, callback]) => callback.name === 'meter'); assert(pair, 'actual meter timer is scheduled'); timers.delete(pair[0]); pair[1](); },
    visibility(hidden) { sandbox.document.hidden = hidden; documentListeners.visibilitychange(); },
    pointer(selector) { env.gesture = true; listeners.pointerdown[0](event(selector)); },
    click() { env.gesture = true; clicks.click(); },
    siteClick() { env.gesture = true; window.MTWTactile.setSound(env.blocked ? true : !env.sound); },
  };
}
const results = [];
async function test(name, fn) { try { await fn(); results.push({ name, pass: true }); } catch (error) { results.push({ name, pass: false, error: error.message }); } }
await test('comic button: blocked autoplay pointerdown then click enables sound once', async () => {
  const f = fixture(); f.run('startMusic()'); await flush(); assert(f.env.blocked);
  f.pointer('.cs-tag__mute'); await flush(); f.click(); await flush();
  assert.equal(f.run('muted'), false); assert.equal(f.run('audioLive'), true); assert.equal(f.contexts[0].state, 'running');
});
await test('site button: blocked autoplay pointerdown then click enables sound once', async () => {
  const f = fixture(); f.run('startMusic()'); await flush();
  f.pointer('[data-sound-toggle]'); await flush(); f.siteClick(); await flush();
  assert.equal(f.run('muted'), false); assert.equal(f.contexts[0].state, 'running');
});
await test('comic unmute resumes score after muted autoplay without restarting track', async () => {
  const f = fixture({ muted: true }); f.run('startMusic()'); await flush();
  assert.equal(f.contexts[0].state, 'suspended'); assert.equal(f.run('audioLive'), true);
  const plays = f.env.playCalls; f.click(); await flush();
  assert.equal(f.contexts[0].state, 'running'); assert.equal(f.env.playCalls, plays); assert.equal(f.audios[0].muted, false);
});
await test('site unmute resumes score after muted autoplay', async () => {
  const f = fixture({ muted: true }); f.run('startMusic()'); await flush(); f.siteClick(); await flush();
  assert.equal(f.contexts[0].state, 'running'); assert.equal(f.run('muted'), false);
});
await test('ordinary gesture retries a suspended live score', async () => {
  const f = fixture(); f.env.gesture = true; f.run('startMusic()'); await flush();
  f.contexts[0].state = 'suspended'; f.pointer('.comic-panel'); await flush(); assert.equal(f.contexts[0].state, 'running');
});
await test('unmuting while paused does not resume score or media', async () => {
  const f = fixture({ muted: true }); f.run('startMusic()'); await flush(); f.run("userPaused = true; state = 'paused'");
  const plays = f.env.playCalls; f.click(); await flush(); assert.equal(f.contexts[0].state, 'suspended'); assert.equal(f.env.playCalls, plays);
});
await test('score initializes when media starts after the only still-mode frame', async () => {
  const f = fixture({ score: 0.6 }); f.env.gesture = true; f.run('T = 5; REDUCED = true; startMusic()'); await flush();
  assert.equal(f.run('score.info().level'), 0.6); assert.equal(f.contexts[0].gains[2].gain.value, 0.6);
});
await test('intentional silent score and nonzero authored score remain distinct', async () => {
  for (const score of [0, 0.6]) {
    const f = fixture({ score }); f.env.gesture = true; f.run('startMusic()'); await flush(); f.run('score.update(5)');
    assert.equal(f.run('score.info().level'), score); assert.equal(f.contexts[0].gains[2].gain.value, score);
  }
});
await test('hidden page suspends room context and media; visible page resumes both', async () => {
  const f = fixture(); f.env.gesture = true; f.run('startMusic()'); await flush();
  f.visibility(true); await flush(); assert.equal(f.contexts[0].state, 'suspended'); assert.equal(f.audios[0].paused, true);
  f.visibility(false); await flush(); assert.equal(f.contexts[0].state, 'running'); assert.equal(f.audios[0].paused, false);
});
await test('visibility does not resume a manually paused comic', async () => {
  const f = fixture(); f.env.gesture = true; f.run('startMusic()'); await flush();
  f.run("userPaused = true; state = 'paused'; score.pause(true); audio.pause()");
  f.visibility(true); f.visibility(false); await flush(); assert.equal(f.contexts[0].state, 'suspended'); assert.equal(f.audios[0].paused, true);
});
await test('collapse from manual pause resumes score with the continuing song', async () => {
  const f = fixture(); f.env.gesture = true; f.run('startMusic()'); await flush();
  f.run("userPaused = true; state = 'paused'; score.pause(true); audio.pause(); collapse()"); await flush();
  assert.equal(f.contexts[0].state, 'running'); assert.equal(f.audios[0].paused, false);
});

await test('silent scored scene does not become an unscored navigation tail', async () => {
  const f = fixture({ score: 0 }); f.env.gesture = true; f.run('startMusic()'); await flush(); f.run('score.update(5)');
  f.env.leave(); assert.equal(JSON.parse(f.stored['mtw-mixtape']).tail, null);
});
await test('navigation tail includes the audible music gain and current master gain', async () => {
  const f = fixture({ score: 0.35 }); f.env.gesture = true; f.run('startMusic()'); await flush(); f.run('score.update(5)');
  f.contexts[0].gains[0].gain.value = 0.4;
  f.env.leave(); const tail=JSON.parse(f.stored['mtw-mixtape']).tail;
  assert(Math.abs(tail.vol - 0.85 * 0.35 * 0.4 * 0.6) < 1e-10);
});
await test('normal authored score transition retains two-beat interpolation', async () => {
  const f = fixture({ score: 0 }); f.env.gesture = true; f.run('startMusic()'); await flush();
  f.run("scenes.push({b:10,l:20,score:0.8,room:'none',panels:[]}); score.update(10)"); assert.equal(f.run('score.info().level'),0);
  f.run('score.update(11)'); assert.equal(f.run('score.info().level'),0.4);
  f.run('score.update(12)'); assert.equal(f.run('score.info().level'),0.8);
});

await test('meter observes the actual shared post-EQ analyser and credits its playing score', async () => {
  const f = fixture({ score: 0.6 }); f.env.gesture = true; f.run('T=5;startMusic()'); await flush();
  const ctx = f.contexts[0]; assert.equal(ctx.analyser.fftSize, 512);
  const eq=f.run('score.info().eq');
  assert.deepEqual(JSON.parse(JSON.stringify(eq)),{highpassHz:35,highpassQ:.707,lowShelfHz:120,lowShelfDb:-2,highShelfHz:4500,highShelfDb:-1.5});
  const hp=ctx.gains[0].connections[0],low=hp.connections[0],high=low.connections[0];
  assert.equal(hp.type,'highpass');assert.equal(low.type,'lowshelf');assert.equal(high.type,'highshelf');
  assert(high.connections.includes(ctx.analyser),'shared post-EQ master reaches meter');
  assert(ctx.gains[1].connections.includes(ctx.gains[0]),'room bus enters shaped master');
  assert(ctx.gains[2].connections.includes(ctx.gains[0]),'media gain enters same shaped master');
  assert(ctx.analyser.connections.includes(ctx.destination), 'meter reaches destination');
  f.env.spectrum = 70; f.meter();
  for (const bar of f.bars) assert.equal(bar.style['--level'], '0.500');
  assert(f.classes.has('is-music-active')); assert.equal(f.creditAttributes['aria-label'], 'test');
});
await test('effect/room spectrum animates with score zero without presenting silent music as active', async () => {
  const f = fixture({ score: 0 }); f.env.gesture = true; f.run('startMusic()'); await flush();
  f.env.spectrum = 255; f.meter();
  for (const bar of f.bars) assert.equal(bar.style['--level'], '1.000');
  assert(!f.classes.has('is-music-active'));
  f.env.spectrum = 0; f.meter(); for (const bar of f.bars) assert.equal(bar.style['--level'], '0.000');
});
await test('meter settles for mute, manual pause, hidden context and cold autoplay block', async () => {
  for (const state of ['muted=true', 'userPaused=true', 'document.hidden=true', "ctx='blocked'"]) {
    const f = fixture({ score: 0.6 }); f.env.gesture = true; f.run('startMusic()'); await flush();
    f.env.spectrum = 200;
    if (state === "ctx='blocked'") f.contexts[0].state = 'suspended'; else f.run(state);
    f.meter(); for (const bar of f.bars) assert.equal(bar.style['--level'], '0.000');
    assert(!f.classes.has('is-music-active'));
  }
  const cold = fixture(); cold.run('startMusic()'); await flush(); cold.env.spectrum = 200; cold.meter();
  for (const bar of cold.bars) assert.equal(bar.style['--level'], '0.000');
});
await test('persisted pagehide preserves score context and meter for native restoration', async () => {
  const f = fixture({ score: 0.6 }); f.env.gesture = true; f.run('T=5;startMusic()'); await flush();
  f.pagehide(true); assert.equal(f.contexts[0].state, 'running');
  f.env.spectrum = 70; f.meter(); for (const bar of f.bars) assert.equal(bar.style['--level'], '0.500');
});
await test('nonpersisted pagehide closes score context and stops meter', async () => {
  const f = fixture(); f.env.gesture = true; f.run('startMusic()'); await flush();
  f.pagehide(false); assert.equal(f.contexts[0].state, 'closed');
  assert.throws(() => f.meter(), /actual meter timer is scheduled/);
});

async function savedSpeechFixture({clipGain=.4}={}) {
  const f=fixture({score:0}),sources=[];
  f.run("fetch=function(){return Promise.resolve({ok:true,arrayBuffer:function(){return Promise.resolve([2]);}})};scenes[0].id='brief';scenes[0].panels=[{img:'dana',at:1,room:'none',balloons:[{at:1,speech:{id:'dana',src:'/dana.mp3',durationSeconds:2,provider:'saved',characterId:'dana',gain:"+clipGain+"}}]},{img:'next',at:6,room:'none',balloons:[]}]");
  f.env.gesture=true;f.run('startMusic()');const ctx=f.contexts[0],original=ctx.createBufferSource.bind(ctx);
  ctx.createBufferSource=()=>{const n=original();n.start=(when,offset,duration)=>{n.started={when,offset,duration};if(n.buffer?.speech)sources.push(n);};n.stop=()=>{n.stoppedGain=n.connections[0]?.gain.value;n.stopped=true;};return n;};
  ctx.decodeAudioData=()=>Promise.resolve({duration:2,speech:true});for(let i=0;i<35;i++)await Promise.resolve();f.run('score.seek(1.3)');for(let i=0;i<35;i++)await Promise.resolve();return {...f,sources};
}
await test('actual saved voice bus .7 preserves clip-relative gain and routes once through master .6/EQ without forcing music',async()=>{
 const f=await savedSpeechFixture(),node=f.sources.at(-1),clip=node.connections[0],bus=clip.connections[0],master=bus.connections[0],info=f.run('score.info()');
 assert.equal(bus.gain.value,.7);assert.equal(master.gain.value,.6);assert.equal(info.level,0);assert.equal(info.speech.current.clipGain,.4);assert.equal(info.speech.musicDuck,.65);assert.equal(info.speech.ambienceDuck,.75);
 assert.equal(master.connections[0].type,'highpass');assert.equal(node.started.when,0);assert.equal(node.started.offset,0);assert(Math.abs(node.started.duration-2)<1e-9);
 assert.equal(info.speech.current.scheduledClipGain,0);f.contexts[0].currentTime=.0125;assert(Math.abs(f.run('score.info().speech.current.scheduledClipGain')-.2)<1e-9);f.contexts[0].currentTime=1;assert.equal(f.run('score.info().speech.current.scheduledClipGain'),.4);f.contexts[0].currentTime=1.9775;assert(Math.abs(f.run('score.info().speech.current.scheduledClipGain')-.2)<1e-9);
 assert(clip.gain.events.some(([k,v,t])=>k==='linear'&&v===.4&&Math.abs(t-.025)<1e-9));assert(clip.gain.events.some(([k,v,t])=>k==='set'&&v===.4&&Math.abs(t-1.955)<1e-9));assert(clip.gain.events.some(([k,v,t])=>k==='linear'&&v===0&&Math.abs(t-2)<1e-9));
});
await test('mid-speech seek cancels old envelope before source stop and starts at exact elapsed words with fresh .025 attack',async()=>{
 const f=await savedSpeechFixture(),old=f.sources.at(-1);f.contexts[0].currentTime=.8;f.run('score.seek(2.1)');const next=f.sources.at(-1);
 assert(old.stopped);assert.equal(old.stoppedGain,0);assert(Math.abs(next.started.offset-.8)<1e-9);assert(Math.abs(next.started.duration-1.2)<1e-9);assert.equal(next.started.when,.8);
 assert(next.connections[0].gain.events.some(([k,v,t])=>k==='linear'&&v===.4&&Math.abs(t-.825)<1e-9));assert(Math.abs(f.run('score.info().speech.current.envelope.endsAt')-2)<1e-9);
});
await test('very short remaining speech release stays inside source window and does not speed or replay words',async()=>{
 const f=await savedSpeechFixture();f.run('score.seek(3.299)');const node=f.sources.at(-1),info=f.run('score.info().speech.current');assert(node.started.duration<.002);assert(info.envelope.attackSeconds<.001);assert(info.envelope.releaseSeconds<.001);assert(info.envelope.releaseAt<=info.envelope.endsAt);assert(node.connections[0].gain.events.filter(e=>e[0]==='linear').every(e=>e[2]<=info.envelope.endsAt));
});
await test('pause/mute/hidden/disposal silence scheduled voice immediately; reduced motion retains same source/window',async()=>{
 for(const change of ['userPaused=true;score.pause(true)','score.setMute(true)','document.hidden=true;score.update(1.5)','REDUCED=true;score.seek(1.5)']){
  const f=await savedSpeechFixture(),old=f.sources.at(-1);f.run(change);
  if(change.startsWith('REDUCED')){assert(f.run('score.info().speech.playing'));assert(Math.abs(f.sources.at(-1).started.offset-.2)<1e-9);}else{assert(!f.run('score.info().speech.playing'));assert.equal(old.stoppedGain,0);}
 }
 const f=await savedSpeechFixture(),old=f.sources.at(-1);f.pagehide(false);assert(old.stopped);assert.equal(old.stoppedGain,0);assert.equal(f.contexts[0].state,'closed');
});
await test('natural voice end restores only ducking; quiet music and common speech balance remain explicit',async()=>{
 const f=await savedSpeechFixture({clipGain:1});const node=f.sources.at(-1);node.onended();const info=f.run('score.info()');assert.equal(info.speech.playing,false);assert.equal(info.speech.musicDuck,1);assert.equal(info.speech.ambienceDuck,1);assert.equal(info.speech.busLevel,.7);assert.equal(info.level,0);assert.equal(info.masterGain,.6);
});
console.log(JSON.stringify({ script: path, results }, null, 2));
if (results.some(x => !x.pass)) process.exitCode = 1;
