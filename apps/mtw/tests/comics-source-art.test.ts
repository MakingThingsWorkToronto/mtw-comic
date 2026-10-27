import { describe, expect, it } from 'vitest';
import { parseStorySource, sceneArt } from '../modules/comics/server/stories';
import { pagesView, speechRows } from '../modules/comics/server/views';
import type { Snapshot } from '../modules/comics/server/library';
import { StoryArt } from '../modules/comics/server/stories';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { placedLayerFrame } from '../modules/comics/client/boxLayout';

const canonical={path:'wiki/image-library/assets/scenes/home/base.png',sha256:'a'.repeat(64),recordId:'home-base',treatment:'comic-ink'};
const literal=()=>'export const homeComic = retime('+JSON.stringify({scenes:[{id:'scene',art:'/comic/home/old-atlas',panels:[{img:'native',alt:'Native composition',ar:[.2,.3,.4,.5],r:[0,0,1,.5],staticArt:{src:'/comic/home/opaque-old.webp',ar:[0,0,1,1]},views:[{id:'projection',at:0,src:'/comic/home/base.png',ar:[.1,.1,.8,.8],canonicalSource:canonical,phone:{src:'/comic/home/phone-base.png',ar:[0,0,1,1]},layers:[{id:'base',role:'background',src:'/comic/home/base.png',opacity:1},{id:'agent',role:'agents',src:'/comic/home/agent.png',opacity:.72,canonicalSource:{...canonical,path:'wiki/image-library/assets/scenes/home/agent.png'}}]}]}]}]})+');';

describe('selected source art in Studio',()=>{
 it('selects separate desktop/phone views and preserves independent agent, prop and light source regions',()=>{
  const agent={sourceROI:[.1,.05,.2,.9],slot:[.65,.1,.3,.8],fit:'contain',speakerIds:['codex']};
  const phoneAgent={...agent,sourceROI:[.55,.05,.2,.9],slot:[.6,.08,.38,.86]};
  const prop={sourceROI:[.02,.55,.26,.12],slot:[.1,.7,.5,.2],fit:'contain'};
  const view=(media:string,placement:unknown)=>({at:0,id:media,media,src:`/comic/home/${media}.png`,ar:[0,0,1,1],fit:'cover',layers:[
   {id:'agent',role:'agents',src:'/comic/home/pose-sheet.png',agentPlacement:placement,opacity:.8},
   {id:'tram',role:'props',src:'/comic/home/tram.png',propPlacement:prop},
   {id:'floor',role:'light',src:'/comic/home/floor.png',propPlacement:prop},
  ]});
  const source='export const homeComic = retime('+JSON.stringify({scenes:[{id:'s',panels:[{img:'p',alt:'',views:[view('phone',phoneAgent),view('desktop',agent)]}]}]})+');';
  const panel=sceneArt(parseStorySource(source),()=>true)[0]?.panels[0];
  expect(panel?.src).toContain('desktop.png');expect(panel?.phone?.src).toContain('phone.png');
  expect(panel?.views?.map(v=>v.media)).toEqual(['phone','desktop']);
  expect(panel?.layers?.[0]).toMatchObject({agentPlacement:agent,crop:agent.sourceROI});
  expect(panel?.phone?.layers?.[0]).toMatchObject({agentPlacement:phoneAgent,crop:phoneAgent.sourceROI});
  expect(panel?.phone?.layers?.slice(1).map(l=>l.propPlacement)).toEqual([prop,prop]);
 });
 it('resolves an existing nested phone placement without changing ordinary background crop registration',()=>{
  const phone={sourceROI:[.5,0,.5,1] as [number,number,number,number],slot:[.65,.05,.3,.9] as [number,number,number,number],fit:'contain' as const};
  const panel=sceneArt([{id:'s',panels:[{img:'p',alt:'',views:[{at:0,src:'/comic/home/base.png',ar:[.1,.2,.8,.6],layers:[
   {id:'wall',role:'background',src:'/comic/home/wall.png'},
   {id:'actor',role:'agents',src:'/comic/home/actor.png',agentPlacement:{sourceROI:[0,0,.5,1],slot:[.5,.05,.4,.9],fit:'contain',speakerIds:['claude'],phone}},
  ]}]}]}],()=>true)[0]?.panels[0];
  expect(panel?.layers?.[0]?.crop).toEqual([.1,.2,.8,.6]);expect(panel?.phone?.layers?.[0]?.crop).toEqual([.1,.2,.8,.6]);
  expect(panel?.phone?.layers?.[1]?.agentPlacement).toEqual(phone);
 });
 it('contains the complete selected actor ROI on desktop and portrait panels using the actor canvas dimensions',()=>{
  const sourceROI:[number,number,number,number]=[.55,.05,.2,.9],slot:[number,number,number,number]=[.6,.08,.38,.86];
  for(const aspect of [1.5,.65]){
   const frame=placedLayerFrame({sourceROI,slot,fit:'contain'},{width:1536,height:1024},aspect)!;
   expect(frame.bounds.widthPct).toBeLessThanOrEqual(slot[2]*100+1e-9);expect(frame.bounds.heightPct).toBeLessThanOrEqual(slot[3]*100+1e-9);
   expect(frame.bounds.leftPct).toBeGreaterThanOrEqual(slot[0]*100);expect(frame.bounds.topPct).toBeGreaterThanOrEqual(slot[1]*100);
   expect(frame.bounds.widthPct*aspect/frame.bounds.heightPct).toBeCloseTo((sourceROI[2]*1536)/(sourceROI[3]*1024));
   // The source ROI edges map exactly to the clipped wrapper: the neighbouring pose remains outside it.
   expect(frame.img.leftPct+sourceROI[0]*frame.img.widthPct).toBeCloseTo(0);
   expect(frame.img.leftPct+(sourceROI[0]+sourceROI[2])*frame.img.widthPct).toBeCloseTo(100);
   expect(frame.img.topPct+sourceROI[1]/sourceROI[3]*100).toBeCloseTo(0);
  }
 });
 it('uses the selected layered view, crop and phone variant instead of the legacy atlas/static fallback',()=>{
  const [scene]=sceneArt(parseStorySource(literal()),()=>true),panel=scene?.panels[0];
  expect(panel?.src).toContain('base.png');expect(panel?.src).not.toContain('opaque-old');
  expect(panel?.crop).toEqual([.1,.1,.8,.8]);expect(panel?.canonicalSource).toEqual(canonical);
  expect(panel?.layers).toHaveLength(2);expect(panel?.layers?.[1]).toMatchObject({role:'agents',opacity:.72,crop:[.1,.1,.8,.8]});
  expect(panel?.phone?.src).toContain('phone-base.png');expect(panel?.phone?.crop).toEqual([0,0,1,1]);
  expect(panel?.phone?.layers?.[1]?.crop).toEqual([0,0,1,1]);expect(panel?.views?.[0]?.layers).toHaveLength(2);
 });
 it('keeps ordinary atlas crops and rejects unsafe selected sources without substituting unrelated atlas art',()=>{
  const [scene]=sceneArt([{id:'s',art:'/comic/home/atlas',panels:[{img:'legacy',alt:'',ar:[.1,.2,.3,.4]},{img:'unsafe',alt:'',staticArt:{src:'/comic/home/../../secret.png'}}]}],()=>true);
  expect(scene?.panels[0]?.src).toContain('atlas-1600.webp');expect(scene?.panels[0]?.crop).toEqual([.1,.2,.3,.4]);
  expect(scene?.panels[1]?.src).toBeNull();
 });
 it('speech and page APIs carry the actual panel source/layers, with speech lookup stable by panel id',()=>{
  const art=sceneArt(parseStorySource(literal()),()=>true);
  const row={id:'line',storyId:'home',sceneId:'scene',panelId:'native',panelIndex:99,balloonIndex:0,text:'Checked words.',characterId:'matt',kind:'speech',storySource:{path:'home.ts',sha256:'x'}};
  const comic={id:'home',scenes:[{id:'scene',title:'Scene',beat:0,seconds:5}],textReview:[row]};
  const snap={derived:{comics:[comic]},voices:{profiles:[]},speech:[],approvals:{textReviews:[]},sourceNow:{}} as unknown as Snapshot;
  const speech=speechRows(snap,{art:new Map([['home',art]])})[0];
  expect(speech?.crop?.src).toContain('base.png');expect(speech?.crop?.layers?.[1]?.opacity).toBe(.72);
  expect(speech?.crop?.phone?.src).toContain('phone-base.png');
  const page=pagesView(snap,snap.derived.comics[0]!,art)[0]?.panels[0];
  expect(page?.src).toContain('base.png');expect(page?.canonicalSource).toEqual(canonical);expect(page?.views?.[0]?.layers).toHaveLength(2);
 });
 it('rechecks a newly imported selected source even when the story text is unchanged',async()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'mtw-studio-source-art-'));
  const storyPath='site/src/data/comic-stories/home.ts',source=path.join(root,storyPath),asset=path.join(root,'site/public/comic/home/base.png');
  fs.mkdirSync(path.dirname(source),{recursive:true});fs.writeFileSync(source,literal());
  const art=new StoryArt(root);
  expect((await art.scenes(storyPath))[0]?.panels[0]?.src).toBeNull();
  fs.mkdirSync(path.dirname(asset),{recursive:true});fs.writeFileSync(asset,Buffer.from('89504e470d0a1a0a','hex'));
  expect((await art.scenes(storyPath))[0]?.panels[0]?.src).toContain('base.png');
 });
});
