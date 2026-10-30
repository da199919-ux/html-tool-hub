import { before,after,beforeEach,test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment,assertSucceeds,assertFails } from '@firebase/rules-unit-testing';
import { doc,setDoc,getDoc,getDocs,collection,updateDoc,deleteDoc,serverTimestamp } from 'firebase/firestore';
let env;
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-html-tool-hub',firestore:{rules:await readFile('firestore.rules','utf8'),host:'127.0.0.1',port:8080}});});
after(async()=>{await env?.cleanup();});
beforeEach(async()=>{await env.clearFirestore();await env.withSecurityRulesDisabled(async ctx=>{const db=ctx.firestore();await Promise.all([
setDoc(doc(db,'users/admin'),{role:'admin'}),
setDoc(doc(db,'users/editor/spaces/a'),{role:'editor'}),
setDoc(doc(db,'users/viewer/spaces/a'),{role:'viewer'}),
setDoc(doc(db,'workspaces/a'),{name:'A',toolId:'travel',createdAt:serverTimestamp()}),
setDoc(doc(db,'workspaces/b'),{name:'B',toolId:'travel',createdAt:serverTimestamp()}),
setDoc(doc(db,'workspaces/a/records/one'),record('editor'))]);});});
function db(uid){return uid?env.authenticatedContext(uid).firestore():env.unauthenticatedContext().firestore();}
function record(uid,version=1){return {title:'金山',time:'09:00',content:'筆記',done:false,version,updatedBy:uid,updatedAt:serverTimestamp()};}
test('anonymous and unapproved users cannot read records',async()=>{for(const uid of [null,'stranger'])await assertFails(getDocs(collection(db(uid),'workspaces/a/records')));});
test('members can read assigned records, not other spaces',async()=>{for(const uid of ['editor','viewer']){await assertSucceeds(getDocs(collection(db(uid),'workspaces/a/records')));await assertFails(getDoc(doc(db(uid),'workspaces/b')));await assertFails(getDocs(collection(db(uid),'workspaces/b/records')));}});
test('viewer cannot mutate or grant membership',async()=>{const d=db('viewer');await assertFails(setDoc(doc(d,'workspaces/a/records/new'),record('viewer')));await assertFails(updateDoc(doc(d,'workspaces/a/records/one'),record('viewer',2)));await assertFails(deleteDoc(doc(d,'workspaces/a/records/one')));await assertFails(setDoc(doc(d,'users/viewer/spaces/b'),{role:'editor'}));});
test('editor may create and versioned update but cannot delete',async()=>{const d=db('editor');await assertSucceeds(setDoc(doc(d,'workspaces/a/records/new'),record('editor')));await assertSucceeds(updateDoc(doc(d,'workspaces/a/records/one'),record('editor',2)));await assertFails(updateDoc(doc(d,'workspaces/a/records/one'),record('editor',2)));await assertFails(deleteDoc(doc(d,'workspaces/a/records/one')));await assertFails(setDoc(doc(d,'workspaces/b/records/new'),record('editor')));});
test('reject forged identity, timestamps, unexpected fields, invalid values',async()=>{const d=db('editor');for(const change of [{updatedBy:'admin'},{updatedAt:new Date(0)},{extra:true},{title:''},{content:'x'.repeat(4001)},{time:'25:90'},{version:9},{done:'yes'}])await assertFails(setDoc(doc(d,'workspaces/a/records/new'),{...record('editor'),...change}));});
test('self promotion is denied even for admin frontend',async()=>{for(const uid of ['editor','stranger','admin'])await assertFails(setDoc(doc(db(uid),`users/${uid}`),{role:'admin'}));});
test('workspace listings are admin-only, memberships self-only',async()=>{await assertSucceeds(getDocs(collection(db('admin'),'workspaces')));await assertFails(getDocs(collection(db('editor'),'workspaces')));await assertSucceeds(getDocs(collection(db('editor'),'users/editor/spaces')));await assertFails(getDocs(collection(db('viewer'),'users/editor/spaces')));});
test('admin grants, updates, revokes; revoked user loses read',async()=>{const d=db('admin');const ref=doc(d,'users/stranger/spaces/a');await assertSucceeds(setDoc(ref,{role:'viewer'}));await assertSucceeds(getDoc(doc(db('stranger'),'workspaces/a')));await assertSucceeds(setDoc(ref,{role:'editor'}));await assertSucceeds(deleteDoc(ref));await assertFails(getDoc(doc(db('stranger'),'workspaces/a')));await assertFails(setDoc(ref,{role:'admin'}));await assertFails(setDoc(doc(d,'users/stranger/spaces/missing'),{role:'viewer'}));});
test('admin creates space and deletes record, cannot delete space',async()=>{const d=db('admin');await assertSucceeds(setDoc(doc(d,'workspaces/c'),{name:'C',toolId:'travel',createdAt:serverTimestamp()}));await assertSucceeds(deleteDoc(doc(d,'workspaces/a/records/one')));await assertFails(deleteDoc(doc(d,'workspaces/a')));});
