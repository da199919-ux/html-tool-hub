import { configured,session,el,notice,guarded,validId,roleNames,message } from './core.js';
import { records,saveRecord,deleteRecord,sampleStops,seed } from './data.js';
const query=new URLSearchParams(location.search), workspace=query.get('workspace'), demo=query.get('demo')==='1';
const list=document.querySelector('#records'), dialog=document.querySelector('#editor'), form=document.querySelector('#record-form');
let current, editing=null, stops=[], stopRecords=()=>{}, generation=0;
function clear(){ generation++;stops.forEach(fn=>fn());stops=[];stopRecords();stopRecords=()=>{};list.replaceChildren();dialog.close();current=null;document.querySelector('#add').hidden=true;document.querySelector('#seed').hidden=true; }
function openEditor(row=null){editing=row;form.reset();document.querySelector('#edit-notice').textContent='';if(row){for(const k of ['time','title','content'])form.elements[k].value=row[k];form.elements.done.checked=row.done;}else form.elements.time.value='09:00';document.querySelector('#edit-title').textContent=row?'編輯行程':'新增行程';dialog.showModal();}
function render(rows,editable=false,admin=false){
  list.replaceChildren();rows.sort((a,b)=>a.time.localeCompare(b.time)||a.id.localeCompare(b.id));
  for(const row of rows){const card=el('article',undefined,'stop');const time=el('div',row.time,'stop-time'),body=el('div');body.append(el('h3',`${row.done?'✓ ':''}${row.title}`),el('p',row.content));
    if(row.version){const date=row.updatedAt?.toDate?.();body.append(el('p',`版本 ${row.version} · ${date?date.toLocaleString('zh-TW',{timeZone:'Asia/Taipei'}):'同步中'} · 修改者 UID：${row.updatedBy}`,'muted'));}
    const actions=el('div',undefined,'actions');if(editable){const edit=el('button','編輯','secondary');edit.onclick=()=>openEditor(row);actions.append(edit);}
    if(admin){const del=el('button','刪除','danger');del.onclick=()=>guarded(async()=>{if(confirm(`刪除「${row.title}」？`))await deleteRecord(current.s,workspace,row.id,row.version);});actions.append(del);}
    body.append(actions);card.append(time,body);list.append(card);
  } if(!rows.length) list.append(el('p','行程還是空白的。編輯者可新增景點，或加入示範行程。','panel'));
}
document.querySelector('#cancel').onclick=()=>dialog.close();
document.querySelector('#add').onclick=()=>openEditor();
document.querySelector('#seed').onclick=()=>guarded(async()=>{if(current?.editable){await seed(current.s,workspace);notice('示範行程已加入。');}});
form.onsubmit=async e=>{e.preventDefault();if(!current?.editable)return;const captured=current;const button=document.querySelector('#save');button.disabled=true;
  try {const value={time:form.elements.time.value,title:form.elements.title.value.trim(),content:form.elements.content.value,done:form.elements.done.checked};if(!value.title)throw new Error('請填入景點名稱。');await saveRecord(captured.s,workspace,editing?.id,editing?.version,value);if(current===captured){dialog.close();notice('行程已儲存，其他成員將即時收到更新。');}}
  catch(e){document.querySelector('#edit-notice').textContent=message(e);}finally{button.disabled=false;}
};
if(demo){document.querySelector('#login').hidden=true;document.querySelector('#role').textContent='唯讀示範';notice('這是公開示範，未連接你的雲端資料。請返回首頁登入並開啟工作空間。');render(sampleStops.map(([time,title,content],i)=>({id:String(i),time,title,content})));}
else if(!workspace||!validId(workspace)){document.querySelector('#login').hidden=true;notice('請從工具中心選擇工作空間。');}
else if(!configured){document.querySelector('#login').disabled=true;notice('尚未設定 Firebase。請先完成設定說明。');}
else guarded(()=>session((user,admin,s)=>{
  clear();const token=generation;if(!user){notice('請先登入才能查看此工作空間。');return;}
  const enable=role=>{
    stopRecords();list.replaceChildren();dialog.close();
    current={s,editable:role==='admin'||role==='editor'};
    document.querySelector('#role').textContent=roleNames[role]||'未授權';
    document.querySelector('#add').hidden=!current.editable;document.querySelector('#seed').hidden=!current.editable;
    if(!role){notice('尚未獲得此工作空間授權，請將 UID 提供給管理員。');return;}
    stopRecords=s.f.onSnapshot(records(s,workspace),{includeMetadataChanges:true},snap=>{
      if(token!==generation)return;
      render(snap.docs.map(d=>({id:d.id,...d.data()})),current.editable,admin);
      notice(snap.metadata.fromCache?'正在連線／目前為快取資料，尚未確認雲端最新狀態。':'已連接雲端 · 多人即時同步中');
    },e=>{list.replaceChildren();dialog.close();document.querySelector('#add').hidden=true;document.querySelector('#seed').hidden=true;current=null;notice(message(e));});
  };
  if(admin)enable('admin');else stops.push(s.f.onSnapshot(s.f.doc(s.db,'users',user.uid,'spaces',workspace),snap=>enable(snap.data()?.role),e=>{enable(null);notice(message(e));}));
}));
window.addEventListener('offline',()=>notice('網路已中斷。雲端儲存需連線，請保留尚未儲存的草稿。'));
