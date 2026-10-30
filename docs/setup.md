> 交接更新：現有 html-tool-hub 已建立並部署，請先讀 deployment.md，不要重新建立或覆寫專案。以下保留從零設定的參考流程。

# 新手設定：從檔案包到可共用網站

## 0. 本次 GitHub 授權檢查

2026-10-30 已讀取連線可存取的 GitHub 儲存庫，結果為空清單。這不代表你的帳號沒有專案，而是目前連線未回傳可用專案；無法確認讀寫、Actions 或 Pages 管理權。未修改任何遠端專案。

你已確認有 GitHub 帳號。下一步請在 GitHub 建立**全新的**儲存庫，例如 `html-tool-hub`；若同名已存在，使用 `html-tool-hub-v1`，不要覆寫舊專案。若要由助理後續上傳，請將新儲存庫授權給 GitHub 連線，並提供儲存庫網址。不要提供 GitHub 密碼或個人存取權杖。

## 1. 建立 Firebase 專案（需你登入 Google）

1. 開啟 [Firebase Console](https://console.firebase.google.com/)，新增獨立專案。建議先不用既有正式資料庫。
2. 新增 Web 應用程式，取得 Firebase SDK 設定。
3. 將設定填入 `public/js/firebase-config.js` 的 `firebaseConfig`：

```js
export const firebaseConfig = {
  apiKey: '從 Firebase 複製',
  authDomain: '你的專案.firebaseapp.com',
  projectId: '你的專案 ID',
  appId: '從 Firebase 複製'
};
```

可一併保留 Console 提供的其他 Web 設定欄位。這些是前端設定；實際資料保護由登入及安全規則提供。**不要放服務帳戶 JSON、private_key 或 Admin SDK 金鑰。**

4. Authentication → Sign-in method → Google → 啟用，填妥支援電子郵件。
5. Authentication → Settings → Authorized domains 加入 `你的帳號.github.io`，只有網域，不含 `https://` 或 `/html-tool-hub`。本機登入測試時另外加入 `127.0.0.1`／`localhost`。
6. 建立 Cloud Firestore **Standard、Native mode、預設 `(default)` 資料庫**，選擇適合你的區域。先使用正式／鎖定模式，禁止測試模式的公開讀寫。
7. Firestore → Rules，完整貼入本專案 `firestore.rules` 並發布。不要把本規則直接覆蓋到存放其他應用資料的既有資料庫。

本次尚無 Firebase 管理連線或專案參數。上述建專案、選區域、啟用 Google、授權網域和部署規則，需要你操作 Console，或之後明確授權可用的管理途徑；目前不需要提供任何私鑰。

## 2. 建立 GitHub 儲存庫與上傳

1. 開啟 [GitHub 新增儲存庫](https://github.com/new)，選擇新的名稱。若採公開儲存庫，程式碼與 Web 設定可被查看，請勿放私人行程或憑證。
2. 將 **html-tool-hub 資料夾內的內容**上傳至新儲存庫根目錄，而非多包一層資料夾。
3. 使用 GitHub Desktop 的「Add local repository／Create repository」再「Publish repository」較不容易漏掉隱藏檔。選擇這個新資料夾，不要選現有專案。
4. 確認 GitHub 上能看到 `.github/workflows/pages.yml`、`public/index.html` 以及 `firestore.rules`。若瀏覽器上傳遺漏隱藏資料夾，可在 GitHub 用 Add file → Create new file，以完整路徑 `.github/workflows/pages.yml` 建立並貼入原檔。
5. 分支使用 `main`。Settings → Pages → Build and deployment → Source 選 **GitHub Actions**。
6. Actions → Verify and deploy Tool Hub → Run workflow。流程先安裝測試依賴、執行語法及 Firestore 模擬器測試，再將 `public/` 發布至 Pages。
7. 首次依賴安裝會產生 `package-lock.json`；建議在本機 `npm install` 後把鎖定檔提交，再將 workflow 的 `npm install` 改為 `npm ci`，固定往後的安裝結果。

預期網址：`https://你的帳號.github.io/你的儲存庫名稱/`。以 Pages 實際顯示的網址為準，這不是本次已發布的網址。

**Pages 工作流程只發布網站，不會替你部署 Firebase 規則。** 規則變更請獨立發布；不需要把 Firebase 私鑰放進 GitHub Actions。若 Actions 的模擬器測試失敗，請修正原因，不要移除測試門檻。

## 3. 設定第一位管理員

1. 在網站按「Google 登入」。尚未授權時沒有工作空間屬正常狀態。
2. 複製頁首的 UID（也可從 Firebase Authentication → Users 找到）。
3. 在 Firestore Data 建立集合 `users`，文件 ID 使用這個 **完整 UID**。
4. 新增欄位 `role`，型別選 string，值為 `admin`。
5. 網站會監聽角色更新；若仍未更新，重新整理。現在應出現管理區。

V1 的管理員是全站管理員，可讀寫所有工作空間。僅將此身分給信任的人；新增或移除管理員需 Firebase Console 操作，前端不能自行提權。其他人不用建立頂層 users 文件，也不會自動成為成員。

## 4. 建立金山萬里工作空間

1. 管理員首頁 → 建立新工作空間 → 輸入「金山萬里一日遊」。
2. 點「開啟行程」，再按「加入示範行程」。這會建立四筆可編輯資料，不覆寫既有示範 ID。
3. 邀請同伴先登入，將自己的 UID 傳給你。
4. 回首頁管理區，選工作空間、貼 UID，選編輯者或檢視者，按「儲存授權」。
5. 對方首頁會出現空間。分享工具網址也可以，但知道網址不代表具有權限。
6. 要變更角色，用同一 UID 及空間重新儲存；要移除，用「撤銷此成員權限」。

成員授權文件的唯一位置是 `users/{uid}/spaces/{workspaceId}`，只有 `role` 欄位。不需要在另一處再建一份 members 清單。撤銷一般成員不會移除 Console 設定的全站管理員身分。

## 5. 本機規則測試與規則部署（可選 CLI）

安裝 Node.js 22+、npm 及 Java 21+，進入專案資料夾：

```sh
npm install
npm run check
npm run test:rules
```

測試使用 `demo-html-tool-hub` 模擬專案，不會寫入正式 Firebase。第一次執行需下載模擬器。

若選擇用 CLI 部署規則，而非貼到 Console：

```sh
npx firebase login
npx firebase deploy --only firestore:rules,firestore:indexes --project 你的專案ID
```

請先核對專案 ID。登入會開啟 Google 授權，由你本人完成。

## 6. 常見問題

- **登入被封鎖**：允許彈出視窗；LINE 內建瀏覽器改用 Safari／Chrome。
- **unauthorized-domain**：核對 Firebase Authorized domains，網域不能含路徑。
- **permission-denied**：確認規則已發布、登入 UID 正確、成員文件放在正確空間。
- **管理員看不到按鈕**：檢查 `users/完整UID` 的 `role` 是否為小寫 `admin`。
- **儲存衝突**：先複製草稿，取消編輯，再開啟最新資料並合併。系統不會自動覆蓋別人的修改。
- **離線**：畫面可能顯示本次工作階段的快取，但交易儲存需要連線。未儲存的草稿只留在目前頁面，關閉或重新整理會失去。
- **Pages 404**：檢查 workflow 與 `public/index.html` 位置，確認 Source 是 GitHub Actions。
- **撤權**：網站會停止相應顯示，但已被使用者複製或截圖的資料無法收回。

## 官方參考

- [Firebase Google 登入](https://firebase.google.com/docs/auth/web/google-signin)
- [Firestore 規則條件](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [交易與批次寫入](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [安全規則測試](https://firebase.google.com/docs/rules/unit-tests)
- [GitHub Pages 自訂工作流程](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
