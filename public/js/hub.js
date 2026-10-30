import { configured,session,el,notice,guarded,validId,roleNames } from './core.js';
const spaces=document.querySelector('#spaces');
let stops=[], epoch=0, current;
function reset(){ epoch++; stops.forEach(fn=>fn()); stops=[]; spaces.replaceChildren(); document.querySelector('#admin').hidden=true; }
document.querySelector('#search').oninput=e=>{ document.querySelector('#travel-card').hidden=!('金山萬里一日遊 旅遊規劃'.includes(e.target.value.trim())); };
if(!configured){ document.querySelector('#login').disabled=true; notice('尚未連接 Firebase：可先瀏覽示範行程，請依 docs/setup.md 完成設定。'); }
else guarded(()=>session((user,admin,s)=>{
  reset(); current={user,admin,s}; const generation=epoch;
  document.querySelector('#role').textContent=admin?'管理員':user?'已登入':'等待登入';
  if(!user){spaces.append(el('p','請先登入 Google 帳號。'));notice('登入後將依授權顯示工作空間。');return;}
  notice(admin?'管理員可建立空間並使用成員 UID 授權。':'若尚無工作空間，請將頁首 UID 提供給管理員。');
  document.querySelector('#admin').hidden=!admin;
  const source=admin?s.f.collection(s.db,'workspaces'):s.f.collection(s.db,'users',user.uid,'spaces');
  const cards=new Map(); let childStops=[];
  const paint=()=>{spaces.replaceChildren(); for(const [id,data] of cards){const card=el('article',undefined,'panel');card.append(el('h3',data.name),el('p',roleNames[data.role]||'管理員'));const a=el('a','開啟行程 →','button');a.href=`tools/travel/index.html?workspace=${encodeURIComponent(id)}`;card.append(a);spaces.append(card);} if(!cards.size) spaces.append(el('p','目前沒有已授權的工作空間。'));};
  stops.push(()=>childStops.forEach(fn=>fn()));
  stops.push(s.f.onSnapshot(source,snap=>{
    childStops.forEach(fn=>fn());childStops=[];cards.clear();
    const select=document.querySelector('#admin-spaces'); select.replaceChildren();
    for(const row of snap.docs){
      if(admin){ cards.set(row.id,{...row.data(),role:'admin'});const opt=el('option',row.data().name);opt.value=row.id;select.append(opt); }
      else childStops.push(s.f.onSnapshot(s.f.doc(s.db,'workspaces',row.id),doc=>{if(generation!==epoch)return;if(doc.exists())cards.set(row.id,{...doc.data(),role:row.data().role});else cards.delete(row.id);paint();},()=>{cards.delete(row.id);paint();}));
    }
    paint();
  },e=>notice(e.message)));
}));
document.querySelector('#create-space').onsubmit=e=>{e.preventDefault();guarded(async()=>{
  const {s,admin}=current||{};if(!admin)return;const form=e.target;const name=form.elements.name.value.trim();if(!name)throw new Error('請填入空間名稱。');
  await s.f.addDoc(s.f.collection(s.db,'workspaces'),{name,toolId:'travel',createdAt:s.f.serverTimestamp()});form.reset();notice('新工作空間已建立。');
});};
async function membership(remove){
  const {s,admin}=current||{};if(!admin)return;const form=document.querySelector('#member-form');if(!form.reportValidity())return;
  const uid=form.elements.uid.value.trim(), workspace=form.elements.workspace.value;
  if(!validId(uid)||!validId(workspace))throw new Error('UID 或空間代碼格式不正確。');
  const ref=s.f.doc(s.db,'users',uid,'spaces',workspace);
  if(remove){if(!confirm('確認撤銷此 UID 在選定空間的存取權？'))return;await s.f.deleteDoc(ref);}
  else await s.f.setDoc(ref,{role:form.elements.role.value});
  notice(remove?'已撤銷成員權限。':'成員授權已儲存。請對方在首頁查看工作空間。');
}
document.querySelector('#member-form').onsubmit=e=>{e.preventDefault();guarded(()=>membership(false));};
document.querySelector('#revoke').onclick=()=>guarded(()=>membership(true));
