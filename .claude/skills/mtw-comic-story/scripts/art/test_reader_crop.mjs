import assert from 'node:assert/strict';
import {measuredReaderCrop} from './register_background.mjs';
const canvas={width:1536,height:1024}, measured={left:9,top:8,width:511,height:473};
assert.deepEqual(measuredReaderCrop(canvas,measured,4),[13/1536,12/1024,503/1536,465/1024]);
assert.notDeepEqual(measuredReaderCrop(canvas,measured,4),[0,0,.34,.4]);
// Different output: the registered target is used, not the original native source crop.
const target={left:24,top:350,width:840,height:500};
assert.deepEqual(measuredReaderCrop({width:1600,height:1000},target,0),[.015,.35,.525,.5]);
for(const r of [{...measured,left:-1},{...measured,width:1536},{...measured,top:.5}])assert.throws(()=>measuredReaderCrop(canvas,r,4),/rectangle/);
for(const trim of [-1,1.5,237])assert.throws(()=>measuredReaderCrop(canvas,measured,trim),/frame trim/);
assert.throws(()=>measuredReaderCrop({width:0,height:1024},measured),/canvas/);
console.log(JSON.stringify({passed:10,total:10,scope:'Measured final-canvas reader crop; no visual approval'}));
