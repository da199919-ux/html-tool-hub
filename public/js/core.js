import { firebaseConfig } from './firebase-config.js';
export const configured = ['apiKey','authDomain','projectId','appId'].every(k => firebaseConfig[k]);
export const roleNames = { admin:'管理員', editor:'編輯者', viewer:'檢視者' };
let services;
export async function connect() {
  if (!configured) throw new Error('請先依設定說明填入 Firebase 網頁設定。');
  if (!services) {
    const [app, a, f] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js')
    ]);
    const instance = app.initializeApp(firebaseConfig);
    services = { a, f, auth:a.getAuth(instance), db:f.getFirestore(instance) };
    await a.setPersistence(services.auth, a.browserSessionPersistence);
  }
  return services;
}
export function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
export function message(error) {
  const code = error.code || '';
  if (code.includes('permission-denied')) return '目前沒有存取權限，請聯絡管理員。';
  if (code.includes('popup')) return '登入視窗未完成。請允許彈出視窗，或使用 Safari／Chrome 開啟。';
  if (code.includes('unauthorized-domain')) return '請將此網站網域加入 Firebase 的 Authorized domains。';
  return error.message || String(error);
}
export function notice(text) { document.querySelector('#notice').textContent = text; }
export async function guarded(action) { try { await action(); } catch(e) { notice(message(e)); } }
export function validId(value) { return /^[A-Za-z0-9_-]{1,128}$/.test(value); }
export async function session(onChange) {
  const s = await connect();
  document.querySelector('#login').onclick = () => guarded(() => s.a.signInWithPopup(s.auth,new s.a.GoogleAuthProvider()));
  document.querySelector('#logout').onclick = () => guarded(() => s.a.signOut(s.auth));
  let stopProfile = () => {};
  s.a.onAuthStateChanged(s.auth, user => {
    stopProfile();
    document.querySelector('#login').hidden = !!user;
    document.querySelector('#logout').hidden = !user;
    document.querySelector('#identity').textContent = user ? `${user.displayName || '使用者'} · UID：${user.uid}` : '尚未登入';
    onChange(null, false, s);
    if (user) stopProfile = s.f.onSnapshot(s.f.doc(s.db,'users',user.uid), snap => {
      onChange(user, snap.data()?.role === 'admin', s);
    }, e => notice(message(e)));
  });
}
