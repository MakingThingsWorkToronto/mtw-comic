import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {catalogMatches,chooseCatalogMatch,readBoundFile,sha256,verifyDelivery,rebindDelivery} from './playback_bindings.mjs';
import {prepareDeliveryRebind} from './rebind_playback_delivery.mjs';
const row=(id,p,h)=>({id,collection:'scenes',treatments:{'comic-ink':{path:p,sha256:h}}});
test('same basename different bytes does not become a match',()=>{
 const catalog={records:[row('a','assets/a/foo.avif','one'),row('b','assets/b/foo.avif','two')]};
 assert.equal(chooseCatalogMatch(catalogMatches(catalog,'two')).recordId,'b');
});
test('same byte duplicate owners refuse ambiguous inference',()=>{
 assert.throws(()=>chooseCatalogMatch(catalogMatches({records:[row('a','assets/a.png','same'),row('b','assets/b.png','same')]},'same')),/ambiguous/);
});
test('exact owner path disambiguates identical bytes',()=>{
 const matches=catalogMatches({records:[row('a','assets/a.png','same'),row('b','assets/b.png','same')]},'same');
 assert.equal(chooseCatalogMatch(matches,null,'assets/b.png').recordId,'b');
});
test('owner preferred over generic retained file variant',()=>{
 const matches=catalogMatches({records:[row('comic-b-retained-x','assets/old.png','same'),row('comic-b-owner','assets/new.png','same')]},'same');
 assert.equal(chooseCatalogMatch(matches).recordId,'comic-b-owner');
});
test('explicit reader-selected master wins over equal-byte intermediate proof',()=>{
 const a=row('proof','assets/proof.png','same'),b=row('selected','assets/selected.png','same');b.treatments['comic-ink'].status='content-reviewed-for-reader';
 assert.equal(chooseCatalogMatch(catalogMatches({records:[a,b]},'same')).recordId,'selected');
});
test('valid current alias preserved, stale alias cannot bypass hash',()=>{
 const matches=catalogMatches({records:[row('owner','assets/new.png','actual'),row('stale','assets/old.png','old')]},'actual');
 assert.equal(chooseCatalogMatch(matches,{recordId:'owner',treatment:'comic-ink'}).recordId,'owner');
 assert.equal(chooseCatalogMatch(matches,{recordId:'stale',treatment:'comic-ink'}).recordId,'owner');
});
test('actual receipt must bind the selected source and encoded output pair',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'comic-encoder-'));
 const mkdir=relative=>fs.mkdirSync(path.join(root,relative),{recursive:true});
 mkdir('wiki/image-library/assets');mkdir('site/public/comic/test');
 const master='wiki/image-library/assets/master.png',publicPath='site/public/comic/test/art-3200.avif',receipt='receipt.json';
 try {
  fs.writeFileSync(path.join(root,master),'master');fs.writeFileSync(path.join(root,publicPath),'derivative');
  const masterHash=sha256(Buffer.from('master')),derivativeHash=sha256(Buffer.from('derivative'));
  fs.writeFileSync(path.join(root,receipt),JSON.stringify({source:{path:master,sha256:masterHash},outputs:[{path:publicPath,sha256:derivativeHash}]}));
  const alias={recordId:'owner',treatment:'comic-ink',deliveryBinding:{publicPath,sha256:derivativeHash,encoderReceipt:{path:receipt,sha256:sha256(fs.readFileSync(path.join(root,receipt))),sourcePath:master,sourceSha256:masterHash,outputPath:publicPath}}};
  const catalog={records:[row('owner','assets/master.png',masterHash)]};
  assert.equal(verifyDelivery(root,catalog,alias),true);
  alias.deliveryBinding.encoderReceipt.sourceSha256='stale';assert.throws(()=>verifyDelivery(root,catalog,alias),/Stale/);
  alias.deliveryBinding.encoderReceipt.sourceSha256=masterHash;
  fs.writeFileSync(path.join(root,receipt),JSON.stringify({source:{sha256:'wrong-source'},outputs:[{path:publicPath,sha256:derivativeHash}]}));
  alias.deliveryBinding.encoderReceipt.sha256=sha256(fs.readFileSync(path.join(root,receipt)));
  assert.throws(()=>verifyDelivery(root,catalog,alias),/does not bind/);
 } finally {
  for(const relative of [master,publicPath,receipt])fs.unlinkSync(path.join(root,relative));
  for(const relative of ['wiki/image-library/assets','wiki/image-library','wiki','site/public/comic/test','site/public/comic','site/public','site',''])fs.rmdirSync(path.join(root,relative));
 }
});
test('byte read rejects stale hash and unsafe paths',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'comic-bind-')),file=path.join(root,'sample');
 try {fs.writeFileSync(file,'actual'); assert.equal(readBoundFile(root,'sample',sha256(Buffer.from('actual'))),sha256(Buffer.from('actual')));
 assert.throws(()=>readBoundFile(root,'sample','stale'),/Stale/);assert.throws(()=>readBoundFile(root,'../sample',''),/Unsafe/);}
 finally {fs.unlinkSync(file);fs.rmdirSync(root);}
});

function fixture(t) {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'comic-rebind-')),files=new Set(),dirs=new Set([root]);
 const write=(relative,bytes)=>{
  const file=path.join(root,relative);let dir=path.dirname(file);
  while(dir!==root){dirs.add(dir);dir=path.dirname(dir);}fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,bytes);files.add(file);return sha256(Buffer.isBuffer(bytes)?bytes:Buffer.from(bytes));
 };
 t.after(()=>{for(const file of files)fs.unlinkSync(file);for(const dir of [...dirs].sort((a,b)=>b.length-a.length))fs.rmdirSync(dir);});
 const source='wiki/image-library/assets/master.png',target='site/public/comic/test/art-1600.avif';
 const sourceSha=write(source,'master'),outputSha=write(target,'small delivery');
 const alias={story:'test',scene:'scene',art:'/comic/test/art',recordId:'owner',treatment:'comic-ink',deliveryBinding:{publicPath:'site/public/comic/test/art-3200.avif',sha256:'old'}};
 const catalog={records:[row('owner','assets/master.png',sourceSha)]};
 const config={schemaVersion:1,masterAliases:[alias],subjectBindings:[{exact:'retained subject'}],phoneTargets:[{exact:'retained phone'}],sourceReceipts:{exact:'retained recipe'}};
 const constants={page:{artWidths:[1600]}};
 const receipt=()=>{
  const receiptPath='wiki/image-library/records/encoder.json',outputPath='wiki/image-library/assets/derivative.avif';write(outputPath,'small delivery');
  const receiptSha=write(receiptPath,JSON.stringify({source:{sha256:sourceSha},outputs:[{path:outputPath,sha256:outputSha}]}));
  alias.deliveryBinding.encoderReceipt={path:receiptPath,sha256:receiptSha,sourcePath:source,sourceSha256:sourceSha,outputPath:'deleted-3200.avif'};
  return receiptPath;
 };
 const legacy=()=>alias.deliveryBinding.legacyAlias={originalAlias:{story:'test',scene:'original-unsplit-scene',art:alias.art,recordId:'owner',treatment:'comic-ink'},priorConfigSha256:'a'.repeat(64),masterSha256:sourceSha,standing:'retained authority'};
 return {root,write,source,target,sourceSha,outputSha,alias,catalog,config,constants,receipt,legacy};
}
test('current artWidths producer prefers exact catalog bytes and preserves annotations',t=>{
 const f=fixture(t);f.write('wiki/image-library/assets/delivery.avif','small delivery');f.catalog.records.push(row('delivery','assets/delivery.avif',f.outputSha));
 const before=JSON.stringify(f.config),result=rebindDelivery(f.root,f.catalog,f.config,f.constants),a=result.candidate.masterAliases[0];
 assert.equal(result.slot,1600);assert.equal(a.deliveryBinding.publicPath,f.target);assert.equal(a.deliveryBinding.canonicalDerivative.recordId,'delivery');
 assert.equal(JSON.stringify(f.config),before);assert.deepEqual(result.candidate.phoneTargets,f.config.phoneTargets);assert.deepEqual(result.candidate.subjectBindings,f.config.subjectBindings);assert.deepEqual(result.candidate.sourceReceipts,f.config.sourceReceipts);
 assert.equal(verifyDelivery(f.root,f.catalog,a),true);a.deliveryBinding.canonicalDerivative.recordId='substitute';assert.throws(()=>verifyDelivery(f.root,f.catalog,a),/identity/);
});
test('receipt lineage resolves actual source/output bytes without basename authority',t=>{
 const f=fixture(t);f.receipt();const a=rebindDelivery(f.root,f.catalog,f.config,f.constants).candidate.masterAliases[0];
 assert.equal(a.deliveryBinding.encoderReceipt.outputPath,'wiki/image-library/assets/derivative.avif');assert.equal(verifyDelivery(f.root,f.catalog,a),true);
});
test('stale receipt hash and mismatched selected master refuse regeneration-free rebinding',t=>{
 const f=fixture(t);f.receipt();f.alias.deliveryBinding.encoderReceipt.sha256='0'.repeat(64);
 assert.throws(()=>rebindDelivery(f.root,f.catalog,f.config,f.constants),e=>e.aliases[0].error.includes('Stale'));
 f.receipt();f.alias.deliveryBinding.encoderReceipt.sourceSha256='b'.repeat(64);
 assert.throws(()=>rebindDelivery(f.root,f.catalog,f.config,f.constants),e=>e.aliases[0].error.includes('source differs'));
});
test('wrong-source receipt with a valid output cannot supply lineage',t=>{
 const f=fixture(t),r=f.receipt(),data=JSON.parse(fs.readFileSync(path.join(f.root,r),'utf8'));data.source.sha256='wrong';f.write(r,JSON.stringify(data));f.alias.deliveryBinding.encoderReceipt.sha256=sha256(fs.readFileSync(path.join(f.root,r)));
 assert.throws(()=>rebindDelivery(f.root,f.catalog,f.config,f.constants),e=>e.aliases[0].error.includes('retained encoder output'));
});
test('existing frozen same-art legacy authority stays verbatim across lettering split',t=>{
 const f=fixture(t),authority=structuredClone(f.legacy()),result=rebindDelivery(f.root,f.catalog,f.config,f.constants);
 assert.deepEqual(result.candidate.masterAliases[0].deliveryBinding.legacyAlias,authority);assert.equal(verifyDelivery(f.root,f.catalog,result.candidate.masterAliases[0]),true);
 f.alias.deliveryBinding.legacyAlias.originalAlias.recordId='wrong';assert.throws(()=>rebindDelivery(f.root,f.catalog,f.config,f.constants),e=>e.aliases[0].error.includes('authority changed'));
});
test('new legacy authority and missing selected master cannot be invented',t=>{
 const f=fixture(t);assert.throws(()=>rebindDelivery(f.root,f.catalog,f.config,f.constants),e=>e.aliases[0].error.includes('No exact'));
 f.legacy();f.catalog.records[0].treatments['comic-ink'].sha256='0'.repeat(64);assert.throws(()=>rebindDelivery(f.root,f.catalog,f.config,f.constants),e=>e.aliases[0].error.includes('Stale'));
});
test('ambiguous identical canonical bytes refuse choosing by name',t=>{
 const f=fixture(t);for(const name of ['one','two']){f.write('wiki/image-library/assets/'+name+'.avif','small delivery');f.catalog.records.push(row(name,'assets/'+name+'.avif',f.outputSha));}
 assert.throws(()=>rebindDelivery(f.root,f.catalog,f.config,f.constants),e=>e.aliases[0].error.includes('ambiguous'));
});
test('producer freezes prior config and current input hashes in immutable recipe',t=>{
 const f=fixture(t);f.legacy();const configPath='config.json',catalogPath='catalog.json',constantsPath='constants.json';
 const prior=f.write(configPath,JSON.stringify(f.config));f.write(catalogPath,JSON.stringify(f.catalog));f.write(constantsPath,JSON.stringify(f.constants));
 const result=prepareDeliveryRebind({...f,configPath,catalogPath,constantsPath});assert.equal(result.receipt.priorConfigSha256,prior);assert.equal(result.receipt.outputConfigSha256,sha256(result.candidateBytes));assert.equal(result.receipt.bindings.length,1);assert.deepEqual(result.receipt.bindings[0].priorBinding,f.alias.deliveryBinding);assert.deepEqual(result.receipt.inputGuards.map(x=>x.path),[configPath,catalogPath,constantsPath]);
});
test('invalid PAGE widths and unsafe art stems fail exact preflight',t=>{
 const f=fixture(t);assert.throws(()=>rebindDelivery(f.root,f.catalog,f.config,{page:{artWidths:[]}}),/artWidths/);f.alias.art='/comic/../outside';assert.throws(()=>rebindDelivery(f.root,f.catalog,f.config,f.constants),e=>e.aliases[0].error.includes('stem'));
});
