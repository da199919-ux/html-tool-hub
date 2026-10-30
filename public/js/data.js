export function records(s, workspace) { return s.f.collection(s.db,'workspaces',workspace,'records'); }
export async function saveRecord(s, workspace, id, expectedVersion, value) {
  const ref = id ? s.f.doc(records(s,workspace),id) : s.f.doc(records(s,workspace));
  await s.f.runTransaction(s.db,async tx => {
    const snap = await tx.get(ref);
    if ((id && (!snap.exists() || snap.data().version !== expectedVersion)) || (!id && snap.exists()))
      throw new Error('這筆行程已被其他人修改或刪除。草稿仍保留，請取消編輯、重新開啟最新版本後合併內容。');
    tx.set(ref,{...value,version:(expectedVersion || 0)+1,updatedBy:s.auth.currentUser.uid,updatedAt:s.f.serverTimestamp()});
  });
}
export async function deleteRecord(s,workspace,id,version) {
  const ref=s.f.doc(records(s,workspace),id);
  await s.f.runTransaction(s.db,async tx=>{
    const snap=await tx.get(ref);
    if (!snap.exists() || snap.data().version!==version) throw new Error('資料已有更新，請重新確認再刪除。');
    tx.delete(ref);
  });
}
export const sampleStops = [
  ['09:30','野柳地質公園','海岸散步與地景觀察；出發前確認開放時間、門票與天候。'],
  ['12:00','金山老街','午餐與老街散步，依現場人潮調整時間。'],
  ['14:00','獅頭山公園','步道散步；依體力及天候決定路線。'],
  ['16:00','萬里海邊','休息、看海後返程；海況不佳時改為室內行程。']
];
export async function seed(s,workspace) {
  // 固定 ID、單一交易：重複點擊或兩人同時初始化都不覆寫已有內容。
  await s.f.runTransaction(s.db,async tx=>{
    const refs=sampleStops.map((_,i)=>s.f.doc(records(s,workspace),`sample-${i+1}`));
    const snapshots=await Promise.all(refs.map(ref=>tx.get(ref)));
    if(snapshots.some(snap=>snap.exists())) throw new Error('此工作空間已有示範資料，未重複加入。');
    sampleStops.forEach(([time,title,content],i)=>tx.set(refs[i],{time,title,content,done:false,version:1,updatedBy:s.auth.currentUser.uid,updatedAt:s.f.serverTimestamp()}));
  });
}
