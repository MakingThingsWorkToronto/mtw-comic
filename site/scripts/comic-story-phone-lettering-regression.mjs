// Regression for hand-composed lines that overflow narrow authored phone boxes.
import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../public/scripts/comic-story.js',import.meta.url),'utf8');
const extract=name=>{const s=source.indexOf('  function '+name+'(');assert(s>=0);return source.slice(s,source.indexOf('\n  }',s)+4)};
const ctx={BS:{caption:{}},balloonLayoutData:bl=>bl.d.phone,wordW:(text,em,Lt)=>text.length*Lt.fs*(em?1.1:1)};vm.createContext(ctx);vm.runInContext(['partition','combos','wrapAuthoredLines','composeLines'].map(extract).join('\n'),ctx);
const words=rows=>rows.map(s=>s.split(' ').map(t=>({t,em:t==='everything,'})));const Lt={fs:1};let tests=0;
const lines=words(['Claude. An AI.','It reads everything,','and agrees with everyone.']);
let b={words:{set:true,lines},phoneLayout:true};let result=ctx.composeLines(b,Lt,12);
assert.deepEqual(Array.from(result.flat(),x=>x.t),lines.flat().map(x=>x.t));assert(result.flat().find(x=>x.t==='everything,').em);assert(result.length>lines.length);assert.equal(Lt.fs,1);tests++;
for(const row of result){const width=row.reduce((n,x,i)=>n+ctx.wordW(x.t,x.em,Lt)+(i?.9:0),0);assert(width<=12.5)}tests++;
assert.equal(ctx.composeLines({...b,phoneLayout:false},Lt,3),lines);assert.equal(ctx.composeLines({...b},Lt,100).length,3);tests++;
assert.deepEqual(Array.from(ctx.wrapAuthoredLines(words(['A B','C D']),Lt,100),x=>x.map(w=>w.t).join(' ')),['A B','C D']);tests++;
const long=words(['Wednesday']);result=ctx.wrapAuthoredLines(long,Lt,3);assert.equal(result[0][0].t,'Wednesday');assert.equal(result.length,1);tests++;
const empty=[];assert.equal(ctx.composeLines({words:{set:true,lines:empty},phoneLayout:true},Lt,10),empty);tests++;
// Wrapping changes neither word timing units nor their order; the authored break still separates the final pair.
const mix=words(['One two three four','Five six']);result=ctx.wrapAuthoredLines(mix,Lt,8);assert.equal(result.flat().length,6);assert.equal(result.at(-1).map(x=>x.t).join(' '),'Five six');tests++;
assert(source.includes("bl.phoneLayout = mode === 'phone' && !!m.d.phonePages;"));tests++;
// Responsive caption composition joins parsed words, never the approved source utterance or voice binding.
const raw={text:'Claude. An AI.\nIt reads everything,\nand agrees with everyone.',phone:{w:.94,reflow:'paragraph'},speech:{id:'approved-voice',src:'/approved.mp3'}};
const originalRaw=JSON.stringify(raw),caption={words:{set:true,lines},phoneLayout:true,cap:true,kind:'caption',d:raw};
const capLt={fs:1,cap:1,lead:1.29},paragraph=ctx.composeLines(caption,capLt,36);
assert(paragraph.length<lines.length);assert.equal(paragraph.length,2);assert.equal(capLt.fs,1);
assert.equal(JSON.stringify(raw),originalRaw);assert.equal(caption.words.lines,lines);
assert.deepEqual(Array.from(paragraph.flat(),x=>({t:x.t,em:x.em})),lines.flat().map(x=>({t:x.t,em:x.em})));
paragraph.flat().forEach((word,i)=>assert.equal(word,lines.flat()[i]));tests++;
assert.equal(ctx.composeLines({...caption,phoneLayout:false},capLt,36),lines);
assert.equal(ctx.composeLines({...caption,d:{...raw,phone:{w:.94}}},capLt,36).length,3);
assert.equal(ctx.composeLines({...caption,cap:false,kind:'speech'},capLt,36).length,3);tests++;
assert.equal(ctx.composeLines({...caption,kind:'place'},capLt,36).length,2);tests++;
console.log(`${tests} phone authored-line wrapping cases passed; actual lettering height/occlusion still requires native review.`);
