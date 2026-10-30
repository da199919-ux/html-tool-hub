import {test} from 'node:test';
import assert from 'node:assert/strict';
import {saveRecord,deleteRecord,seed} from '../public/js/data.js';
function mock(existing){const writes=[];const s={auth:{currentUser:{uid:'editor'}},db:{},f:{collection:(_db,...parts)=>parts.join('/'),doc:(path,id)=>`${path}/${id||'new'}`,serverTimestamp:()=> 'SERVER_TIME',runTransaction:async(_db,fn)=>fn({get:async ref=>({exists:()=>existing[ref]!==undefined,data:()=>existing[ref]}),set:(ref,data)=>writes.push({ref,data}),delete:ref=>writes.push({ref,delete:true})})}};return {s,writes};}
const path='workspaces/a/records/one';
test('transaction preserves remote edits by rejecting stale draft',async()=>{const {s,writes}=mock({[path]:{version:2}});await assert.rejects(saveRecord(s,'a','one',1,{title:'draft'}),/草稿仍保留/);assert.equal(writes.length,0);});
test('transaction rejects deleted record',async()=>{const {s,writes}=mock({});await assert.rejects(saveRecord(s,'a','one',1,{title:'draft'}));assert.equal(writes.length,0);});
test('valid transaction increments version and binds actor',async()=>{const {s,writes}=mock({[path]:{version:2}});await saveRecord(s,'a','one',2,{title:'new'});assert.equal(writes[0].data.version,3);assert.equal(writes[0].data.updatedBy,'editor');assert.equal(writes[0].data.updatedAt,'SERVER_TIME');});
test('deletion rejects stale version',async()=>{const {s,writes}=mock({[path]:{version:2}});await assert.rejects(deleteRecord(s,'a','one',1));assert.equal(writes.length,0);});
test('seed never overwrites existing sample',async()=>{const {s,writes}=mock({'workspaces/a/records/sample-1':{version:1}});await assert.rejects(seed(s,'a'));assert.equal(writes.length,0);});
test('seed creates four independent records',async()=>{const {s,writes}=mock({});await seed(s,'a');assert.equal(writes.length,4);assert.equal(new Set(writes.map(w=>w.ref)).size,4);assert.ok(writes.every(w=>w.data.version===1));});
