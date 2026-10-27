const fs=require('fs'),assert=require('assert');
const source=fs.readFileSync(process.argv[2]||new URL('../public/scripts/comic-story.js', require('url').pathToFileURL(__filename)),'utf8');
const start=source.indexOf('  function burstPath('),end=source.indexOf('  // A neck',start);
assert(start>=0&&end>start,'burst helper found');
const helper=source.slice(start,end).replace("return { d: 'M' + pts.map(pt).join('L') + 'Z', bbox: bboxOf(pts) };","return { points: pts, angles: ang, tailI: tailI };");
assert(helper.includes('points: pts'),'capture actual generated polygon');
const hash=(a,b)=>{const h=Math.sin(a*127.1+b*311.7)*43758.5453;return h-Math.floor(h)};
const burst=Function('BS','hash',helper+';return burstPath')({},hash);
const g={c:16,inkW:280,inkH:65};
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function intersections(p){let n=0;for(let i=0;i<p.length;i++)for(let j=i+2;j<p.length;j++){if(i===0&&j===p.length-1)continue;const a=p[i],b=p[(i+1)%p.length],c=p[j],d=p[(j+1)%p.length];if(cross(a,b,c)*cross(a,b,d)<-1e-8&&cross(c,d,a)*cross(c,d,b)<-1e-8)n++}return n}
const tests=[];
for(const [name,angle] of [['upper-left negative angle',-2.4],['upper-right negative angle',-.8],['lower-left control',2.4],['lower-right control',.8]]){
 let failures=[];for(const seed of [1,2,7,11,29]){const p=burst({seed,st:'shout'},g,[Math.cos(angle)*220,Math.sin(angle)*220]);const count=intersections(p.points);if(count)failures.push({seed,intersections:count})}
 tests.push({name,pass:failures.length===0,failures});
}
for(const [name,angle] of [['atan2 negative/positive pi seam',Math.PI],['zero/two-pi seam',0]]){
 const failures=[];for(const seed of [1,2,7,11,29]){const epsilon=1e-6,make=a=>burst({seed,st:'shout'},g,[Math.cos(a)*220,Math.sin(a)*220]);const a=make(angle-epsilon),b=make(angle+epsilon);const maxDelta=Math.max(...a.points.map((p,i)=>Math.hypot(p[0]-b.points[i][0],p[1]-b.points[i][1])));if(maxDelta>.01)failures.push({seed,maxDelta})}
 tests.push({name,pass:failures.length===0,failures});
}
console.log(JSON.stringify({runtime:process.argv[2],pass:tests.every(t=>t.pass),tests},null,2));
if(tests.some(t=>!t.pass))process.exitCode=1;
