import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const source=readFileSync(new URL('../public/scripts/comic-story.js',import.meta.url),'utf8');
const start=source.indexOf('  function render(t) {'),end=source.indexOf('\n  }',start)+4;
assert(start>=0&&end>start);
const render=source.slice(start,end);
const readiness=source.match(/var si = sceneAt\(T\), loaded = ([^\n]+);/)[1];
const done=new Error('stop after render preload branch');
for(const target of [0,3,6,9]) {
 const requested=[], model=Array.from({length:10},(_,i)=>({d:{b:i,l:1},panels:[{loaded:i<3}],page:{classList:{toggle(){}}}}));
 const ctx={model,scenes:model,sceneAt:t=>t,liveScene:-1,B:1,inHold:()=>0,T:target,si:target,
 loadScene:i=>{requested.push(i);if(model[i]) model[i].panels.forEach(p=>p.loaded=true);},renderPanels:()=>{throw done;}};
 vm.createContext(ctx);vm.runInContext(render,ctx);
 try{ctx.render(target);}catch(e){assert.equal(e,done);}
 assert.equal(vm.runInContext(readiness,ctx),true,`readiness neighborhood after jump ${target}`);
 for(const i of [target-1,target,target+1,target+2]) assert(requested.includes(i),`jump ${target} schedules ${i}`);
 if(target===6){
  model.forEach((m,i)=>m.panels.forEach(p=>p.loaded=i<3));ctx.liveScene=-1;
  vm.runInContext(render.replace('loadScene(si - 1); ',''),ctx);
  try{ctx.render(target);}catch(e){assert.equal(e,done);}
  assert.equal(vm.runInContext(readiness,ctx),false,'negative control reproduces missing previous-scene timeout');
  vm.runInContext(render,ctx);ctx.liveScene=-1;try{ctx.render(target);}catch(e){assert.equal(e,done);}
 }
 const before=requested.length;try{ctx.render(target);}catch(e){assert.equal(e,done);}assert.equal(requested.length,before,'same-scene render does not reschedule');
}
console.log('4 direct-jump readiness cases passed, including bounds and two-ahead preload; no browser launched.');
