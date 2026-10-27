import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {resolve,join}from'node:path';
import {deflateSync}from'node:zlib';
import {hash,panelSelectedMedia,loadContext,validateAudioOpportunities,validateFiles}from'./audio_opportunities.mjs';
import {storySnapshot,prepareRebind}from'./rebind_audio_opportunities.mjs';
const args=process.argv.slice(2),get=k=>args[args.indexOf(k)+1];
if(!args.includes('--fixtures'))throw Error('Explicit ignored fixture root required');
const parent=resolve(get('--fixtures'));assert(parent.replaceAll('\\','/').includes('/.codex/worktrees/'));await fs.mkdir(parent,{recursive:true});const root=await fs.mkdtemp(join(parent,'selected-source-'));let passed=0;
const put=async(p,b)=>{await fs.mkdir(resolve(root,p,'..'),{recursive:true});await fs.writeFile(join(root,p),b);};
function crc(bytes){let n=0xffffffff;for(const b of bytes){n^=b;for(let i=0;i<8;i++)n=(n>>>1)^((n&1)?0xedb88320:0);}return(n^0xffffffff)>>>0;}
function png(rgb){const chunk=(type,bytes)=>{const t=Buffer.from(type),size=Buffer.alloc(4),check=Buffer.alloc(4);size.writeUInt32BE(bytes.length);check.writeUInt32BE(crc(Buffer.concat([t,bytes])));return Buffer.concat([size,t,bytes,check]);};const head=Buffer.alloc(13);head.writeUInt32BE(1);head.writeUInt32BE(1,4);head[8]=8;head[9]=2;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',head),chunk('IDAT',deflateSync(Buffer.from([0,...rgb]))),chunk('IEND',Buffer.alloc(0))]);}
const paths=['wiki/image-library/assets/a.png','wiki/image-library/assets/b.png'];const natives=[png([12,48,60]),png([140,20,35])];
await put('package.json','{"type":"module"}');
await put('wiki/soundtrack-library/comic-audio.json','{"records":[]}');
for(let i=0;i<2;i++){await put(paths[i],natives[i]);await put('site/public/comic/fixture/'+(i?'b':'a')+'.png',natives[i]);}
await put('wiki/image-library/manifest.json',JSON.stringify({records:paths.map((p,i)=>({id:i?'b-record':'a-record',collection:'comics',treatments:{'comic-ink':{path:p.slice('wiki/image-library/'.length),sha256:hash(natives[i])}}}))}));
const source=(i,panelId)=>({src:'/comic/fixture/'+(i?'b':'a')+'.png',ar:[0,0,1,1],canonicalSource:{panelId,path:paths[i],sha256:hash(natives[i]),recordId:i?'b-record':'a-record',treatment:'comic-ink'}});
const story={id:'fixture',issue:1,title:'Source fixture',bpm:90,beats:16,scenes:[{id:'one',b:0,l:16,art:'/comic/fixture/shared-legacy',panels:[{img:'one-box',at:1,balloons:[],staticArt:source(0,'one-box')},{img:'two-box',at:8,balloons:[],staticArt:source(1,'two-box'),views:[{id:'context',at:0,alt:'Synthetic same source context.',...source(1,'two-box')},{id:'detail',at:2,alt:'Synthetic same source detail.',...source(1,'two-box')}]}]}]};
await put('site/source.ts','export const STORY='+JSON.stringify(story)+';');const context=await loadContext(root,'site/source.ts');
const audit={schemaVersion:1,storyId:'fixture',storySource:context.source,librarySource:context.library,boxes:context.panels.map((p,i)=>({sceneId:p.sceneId,panelId:p.panelId,selectedMedia:p.selectedMedia,visualReview:{status:'inspected',observations:'Synthetic identity/hash fixture only, not artwork approval.'},visuals:[{viewId:'master',path:paths[i],sha256:hash(natives[i])}],decisionReason:'No audible event in synthetic fixtures.',opportunityIds:[],speech:[]})),opportunities:[],coverage:[],qualityReview:{listening:'pending',nativeTiming:'pending'}};
await validateFiles(audit,context,root);assert.equal(validateAudioOpportunities(audit,context).quantityMet,false);passed++;
assert.notDeepEqual(context.panels[0].selectedMedia.staticArt,context.panels[1].selectedMedia.staticArt);assert.deepEqual(storySnapshot(story).panels.map(p=>p.media),context.panels.map(p=>p.selectedMedia));passed++;
assert.deepEqual(panelSelectedMedia({art:'/old',layers:[{role:'background',src:'/old.png',id:'unused'}]},{}),{art:'/old',layers:[{role:'background',src:'/old.png'}]});passed++;
function stale(label,change){const altered=structuredClone(story);change(altered);const current={...context,panels:context.panels.map((p,i)=>({...p,selectedMedia:panelSelectedMedia(altered.scenes[0],altered.scenes[0].panels[i])}))};assert.throws(()=>validateAudioOpportunities(audit,current),/Stale selected media/,label);assert.throws(()=>prepareRebind(audit,context,current,storySnapshot(story),storySnapshot(altered)),/inspected successor/,label);passed++;}
stale('distinct panel static source changed',s=>s.scenes[0].panels[0].staticArt=source(1,'one-box'));
stale('phone canonical source changed',s=>s.scenes[0].panels[1].staticArt.phone=source(0,'two-box'));
stale('ordered source changed',s=>s.scenes[0].panels[1].views.reverse());
stale('view crop changed',s=>s.scenes[0].panels[1].views[1].ar=[.1,0,.9,1]);
stale('source alias changed',s=>s.scenes[0].panels[0].staticArt.src='/comic/fixture/b.png');
stale('source delivery identity changed',s=>s.scenes[0].panels[0].staticArt.canonicalSource.deliveryBindings=[{publicPath:'site/public/comic/fixture/a.png',sha256:'f'.repeat(64)}]);
const missingSnapshot=structuredClone(audit);delete missingSnapshot.boxes[0].selectedMedia;assert.throws(()=>validateAudioOpportunities(missingSnapshot,context),/Missing selected panel source snapshot/);passed++;
await fs.rename(join(root,paths[0]),join(root,'retained-a.png'));await assert.rejects(validateFiles(audit,context,root),/ENOENT/);await fs.rename(join(root,'retained-a.png'),join(root,paths[0]));passed++;
await put('site/public/comic/fixture/a.png',natives[1]);await assert.rejects(validateFiles(audit,context,root),/source-bound encoder receipt/);await put('site/public/comic/fixture/a.png',natives[0]);passed++;
const phone=structuredClone(story);phone.scenes[0].panels[0].staticArt.phone={...source(0,'one-box'),src:'/comic/fixture/missing-phone.png'};await put('site/phone.ts','export const STORY='+JSON.stringify(phone)+';');const pc=await loadContext(root,'site/phone.ts'),pa=structuredClone(audit);pa.storySource=pc.source;pa.boxes[0].selectedMedia=pc.panels[0].selectedMedia;await assert.rejects(validateFiles(pa,pc,root),/ENOENT/);passed++;
const wrongAudit=structuredClone(audit);wrongAudit.boxes[1].visuals=wrongAudit.boxes[0].visuals;await assert.rejects(validateFiles(wrongAudit,context,root),/missing from actual visual audit/);passed++;
const pending=structuredClone(audit);pending.boxes.forEach(b=>b.visualReview.status='pending');assert.equal(validateAudioOpportunities(pending,context).quantityMet,false);passed++;
await put('site/public/comic/fixture/a.png',Buffer.from('not a raster'));await assert.rejects(validateFiles(audit,context,root));await put('site/public/comic/fixture/a.png',natives[0]);passed++;
const known=await import('./review_known_text_revision_audio.mjs');assert.equal(typeof known.checkKnownTextChanges,'function');assert.equal(typeof known.prepareKnownRevision,'function');assert.equal(typeof known.reviewKnownRevision,'function');passed++;
const receipt={status:'pass',passed,fixtureRoot:root,limits:'Synthetic1px source/hash/alias/ordering regressions only; no real artwork/audio/native reader/hearing/Matt approval. Fixtures retained.'};await put('results.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
