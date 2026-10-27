// Offline: extract maintained pure audit functions; no browser, build, repo write or synthesis.
import osPath from 'node:path'; import fs from 'node:fs'; import vm from 'node:vm'; import assert from 'node:assert/strict'; import {createHash} from 'node:crypto'; import os from 'node:os'; import {spawnSync} from 'node:child_process';
const args=process.argv.slice(2); const i=args.indexOf('--repo'); const repo=osPath.resolve(i<0?process.cwd():args[i+1]); const j=args.indexOf('--producer'); const producer=j<0?repo+'/site/scripts/build-comics-library.mjs':args[j+1];
const source=fs.readFileSync(producer,'utf8');
const hash=b=>createHash('sha256').update(b).digest('hex');
const functions=source.slice(source.indexOf('export function canonicalAudioRef'),source.indexOf('const sourceHashes'))+
 source.slice(source.indexOf('const textKey'),source.indexOf('for (const profile of voiceInput.profiles) {'));
const scope={hash,Buffer}; vm.createContext(scope); vm.runInContext(functions.replaceAll('export function','function'),scope);
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')); const profiles=read(repo+'/wiki/comics-library/voices.json').profiles;
let retained=0; for(const profile of profiles)for(const clip of profile.clips||[]){
 const receipt=read(osPath.join(repo,scope.canonicalAudioRef(clip.receipt,'records'))),bytes=fs.readFileSync(osPath.join(repo,scope.canonicalAudioRef(clip.path)));
 scope.auditVoiceReceipt(profile,clip,receipt,bytes); retained++;
}
assert.equal(retained,23);
const profile=profiles.find(p=>p.characterId==='matt'),old=profile.clips.find(c=>c.provider==='Fish Audio');
const receipt=read(osPath.join(repo,scope.canonicalAudioRef(old.receipt,'records'))),bytes=fs.readFileSync(osPath.join(repo,scope.canonicalAudioRef(old.path)));
const path='wiki/soundtrack-library/assets/voices/matt/fish-v2-character-read.mp3';
const ref='wiki/soundtrack-library/records/fish/matt/fish-v2-character-read.json';
const relative=p=>'../soundtrack-library/'+p.slice('wiki/soundtrack-library/'.length);
const clip={...old,id:'fish-v2-character-read',path:relative(path),canonicalPath:path,receipt:relative(ref),receiptCanonicalPath:ref};
const future={...receipt,id:clip.id,path,savedAsset:{...receipt.savedAsset,path}};
scope.auditVoiceReceipt(profile,clip,future,bytes);
const rootOnly={...clip,path,receipt:ref}; scope.auditVoiceReceipt(profile,rootOnly,future,bytes);
const canonicalOnly={...clip}; delete canonicalOnly.path; delete canonicalOnly.receipt;
scope.auditVoiceReceipt(profile,canonicalOnly,future,bytes);
for(const bad of ['../soundtrack-library/assets/voices/matt/../../escape.mp3','wiki/soundtrack-library/assets/voices/matt/../dana/a.mp3','C:/secret.mp3','wiki/soundtrack-library/assets\\voices/matt/a.mp3'])assert.throws(()=>scope.canonicalAudioRef(bad),/Unsafe/);
assert.throws(()=>scope.auditVoiceReceipt(profile,{...clip,path:relative(path.replace('/matt/','/dana/'))},future,bytes),/aliases/);
assert.throws(()=>scope.auditVoiceReceipt(profile,{...clip,canonicalPath:path.replace('/matt/','/dana/'),path:relative(path.replace('/matt/','/dana/'))},future,bytes),/character path/);
assert.throws(()=>scope.auditVoiceReceipt(profile,clip,{...future,provider:'ElevenLabs'},bytes),/provider/);
assert.throws(()=>scope.auditVoiceReceipt(profile,clip,{...future,text:'Ask  them first.'},bytes),/exact Fish/);
assert.throws(()=>scope.auditVoiceReceipt(profile,clip,{...future,status:'unknown'},bytes),/saved success/);
assert.throws(()=>scope.auditVoiceReceipt(profile,clip,{...future,savedAsset:{...future.savedAsset,sha256:'0'.repeat(64)}},bytes),/file\/hash/);
assert.equal(scope.audioRefs(clip,'receipt','receiptCanonicalPath','records'),ref);
// Run the actual producer with canonical inputs and isolated output, including all current previews.
const previews=read(repo+'/wiki/comics-library/provider-voices.json');
const concrete=v=>({...v,provider:v.provider??(previews.provider.toLowerCase()==='mixed'?'ElevenLabs':previews.provider)});
for(const preview of previews.voices){
 const p=concrete(preview),asset=scope.providerPreviewPath(p),media=fs.readFileSync(osPath.join(repo,asset));
 assert.equal(hash(media),p.sha256.toLowerCase()); assert.equal(media.length,p.bytes);
}
const versioned=previews.voices.map(concrete).filter(p=>/\-v[1-9][0-9]*\.(mp3|wav)$/.test(scope.providerPreviewPath(p)));
assert.ok(versioned.length>0,'Canonical versioned previews must exercise the actual producer');
const sample=versioned[0],prefix='wiki/soundtrack-library/assets/voices/provider-previews/';
const assetId=sample.provider==='Fish Audio'?'fish-'+sample.voiceId:sample.voiceId;
const badNames=[assetId+'-v0.mp3',assetId+'-v01.mp3',assetId+'-v-1.mp3',assetId+'-v1.mp3.extra','wrong-'+assetId+'-v1.mp3',assetId+'-v1/child.mp3',assetId+'%2e-v1.mp3'];
const withPath=value=>({...sample,previewAsset:value,canonicalPath:value});
for(const name of badNames)assert.throws(()=>scope.providerPreviewPath(withPath(prefix+name)),/Unsafe/);
for(const unsafe of ['../escape.mp3',prefix+'../'+assetId+'-v1.mp3',prefix+assetId+'\\-v1.mp3',prefix+assetId+'-v1.mp3?x',prefix+assetId+'-v1.mp3#x'])assert.throws(()=>scope.providerPreviewPath(withPath(unsafe)),/Unsafe/);
assert.throws(()=>scope.providerPreviewPath({...sample,voiceId:sample.voiceId+'different'}),/Unsafe/);
assert.throws(()=>scope.providerPreviewPath({...sample,voiceId:'../escape'}),/Unsafe/);
assert.throws(()=>scope.providerPreviewPath(withPath('wiki/comics-library/assets/voices/provider-previews/'+assetId+'-v1.mp3')),/Unsafe/);
assert.throws(()=>scope.providerPreviewPath({...sample,previewAsset:prefix+assetId+'.mp3'}),/aliases/);
for(const provider of ['Fish Audio','ElevenLabs'])for(const ext of ['mp3','wav']){
 const v={voiceId:'ExactVoice_123',provider},id=provider==='Fish Audio'?'fish-'+v.voiceId:v.voiceId;
 assert.equal(scope.providerPreviewPath({...v,previewAsset:prefix+id+'-v2.'+ext}),prefix+id+'-v2.'+ext);
 assert.equal(scope.providerPreviewPath({...v,previewAsset:'assets/voices/provider-previews/'+id+'.'+ext}),'wiki/comics-library/assets/voices/provider-previews/'+id+'.'+ext);
}
const fixture=fs.mkdtempSync(osPath.join(os.tmpdir(),'mtw-comic-preview-path-'));
const fixtureInput=osPath.join(fixture,'inputs'),fixtureOutput=osPath.join(fixture,'output');
fs.mkdirSync(fixtureInput);fs.mkdirSync(fixtureOutput);
const invoke=()=>spawnSync(process.execPath,[producer,'--repo',repo,'--inputs',fixtureInput,'--snapshot',osPath.join(fixtureOutput,'comics-library.json')],{encoding:'utf8',timeout:60000});
const setCatalog=v=>fs.writeFileSync(osPath.join(fixtureInput,'provider-voices.json'),JSON.stringify(v));
let actualProducerNegativeChecks=0;
try{
 for(const name of ['characters.json','voices.json','speech-approvals.json','sounds.json']){const f=osPath.join(repo,'wiki/comics-library',name);if(fs.existsSync(f))fs.copyFileSync(f,osPath.join(fixtureInput,name));}
 setCatalog(previews);const actual=invoke();assert.equal(actual.status,0,actual.stderr||actual.stdout);
 const projection=JSON.parse(fs.readFileSync(osPath.join(fixtureOutput,'comics-library.json'),'utf8'));
 assert.equal(projection.voiceCatalog.voices.length,previews.voices.length);
 for(const p of versioned){const shown=projection.voiceCatalog.voices.find(v=>v.voiceId===p.voiceId);assert.ok(shown);assert.equal(shown.sha256,p.sha256);assert.equal(shown.previewAsset,'../soundtrack-library/'+scope.providerPreviewPath(p).slice('wiki/soundtrack-library/'.length));}
 const mutations=[{...withPath(prefix+'wrong-'+assetId+'-v1.mp3')},{...withPath(prefix+'../'+assetId+'-v1.mp3')},{...withPath(scope.providerPreviewPath(sample)),sha256:'0'.repeat(64)},{...withPath(prefix+assetId+'-v0.mp3')}];
 for(const changed of mutations){const wrong=structuredClone(previews);wrong.voices[wrong.voices.findIndex(v=>v.voiceId===sample.voiceId)]=changed;setCatalog(wrong);const result=invoke();assert.notEqual(result.status,0,'Actual producer accepted an unsafe preview');assert.match(result.stderr,/Unsafe provider preview asset path|Unsafe canonical audio reference|Provider preview hash differs/);actualProducerNegativeChecks++;}
}finally{
 for(const file of [osPath.join(fixtureOutput,'comics-library.json'),...fs.readdirSync(fixtureInput).map(n=>osPath.join(fixtureInput,n))])if(fs.existsSync(file))fs.unlinkSync(file);
 fs.rmdirSync(fixtureInput);fs.rmdirSync(fixtureOutput);fs.rmdirSync(fixture);
}
const result={retainedClips:retained,newCanonicalFormsAccepted:3,providerPreviewsBound:previews.voices.length,versionedPreviewsBound:versioned.length,actualProducerNegativeChecks,checks:['root/relative/alias refs','exact character directory','provider/script/UTF-8 identity','hash/container lineage unchanged','unknown receipts rejected','escape and contradictory aliases rejected','actual producer accepts versioned canonical previews','wrong ID/version/traversal/hash rejected through actual producer'],providerCalls:0,repoWrites:0};
console.log(JSON.stringify(result));
