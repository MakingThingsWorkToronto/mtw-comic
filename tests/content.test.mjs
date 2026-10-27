import{test}from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import path from'node:path';
import {comicMediaUrls} from '../scripts/comics/media-urls.mjs';
const root=path.resolve(import.meta.dirname,'..'),site=path.join(root,'site');
test('rendered project has all local page, image, script and music references',()=>{const out=path.join(site,'dist');assert.ok(fs.existsSync(out),'Run npm run build before npm test');const pages=[];function walk(dir){for(const f of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,f.name);if(f.isDirectory())walk(p);else if(f.name.endsWith('.html'))pages.push(p);}}walk(out);assert.ok(pages.length>=8);const missing=[];for(const file of pages){const html=fs.readFileSync(file,'utf8');for(const m of html.matchAll(/(?:src|href)=["'](\/(?!\/)[^"']+)["']/g)){const url=m[1].split(/[?#]/)[0];if(!url)continue;const asset=path.join(out,url);if(!fs.existsSync(asset)&&!fs.existsSync(path.join(asset,'index.html')))missing.push(path.relative(out,file)+' → '+url);}}assert.deepEqual(missing,[]);});
test('one root instruction source and Claude bootstrap',()=>{assert.equal(fs.readFileSync(path.join(root,'CLAUDE.md'),'utf8').trim(),'@AGENTS.md');assert.match(fs.readFileSync(path.join(root,'AGENTS.md'),'utf8'),/Reproduce after pulling/);});
test('every rendered comic has its runtime artwork and fallback formats',()=>{
  const out=path.join(site,'dist/comics'),missing=[];
  for(const item of fs.readdirSync(out,{withFileTypes:true})){
    if(!item.isDirectory())continue;
    const file=path.join(out,item.name,'index.html');if(!fs.existsSync(file))continue;
    const html=fs.readFileSync(file,'utf8');
    const match=html.match(/<script[^>]*id="comic-story"[^>]*>([\s\S]*?)<\/script>/);
    if(!match)continue;
    const story=JSON.parse(match[1]);
    for(const url of comicMediaUrls(story))if(!fs.existsSync(path.join(site,'dist',url)))missing.push(`${item.name}: ${url}`);
  }
  assert.deepEqual(missing,[],'Player-created image URLs must exist; a script tag and cover alone cannot prove an illustrated issue.');
});
test('comic workspace excludes unrelated consulting pages and Studio modules',()=>{
  for(const module of ['journal','storage','schedules','spend'])assert.equal(fs.existsSync(path.join(root,'apps/mtw/modules',module)),false,module);
  for(const page of ['contact','journal','agentic-systems','traditional-systems','data-migrations','experiments'])assert.equal(fs.existsSync(path.join(site,'src/pages',page)),false,page);
});
