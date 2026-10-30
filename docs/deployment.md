# 目前狀態與部署
## 帳號與所有權（對話最後實際確認）
- GitHub 帳號：da199919-ux；新公開儲存庫 html-tool-hub。其他既有專案未覆寫。
- Firebase 原先誤建於 a25295945@gmail.com 的登入工作階段。
- 已邀請 da199919@gmail.com 成為擁有者；第一次接受後仍待處理，之後重新檢查已正式成為擁有者且能進入管理頁面。
- 使用者明確同意移除舊帳號；已從專案成員清單移除 a25295945@gmail.com。
- 最終清單僅有人員擁有者 da199919@gmail.com，另有 4 個服務帳戶，未變更服務帳戶。
- 所有權變更未重新建立 Firebase 專案，projectId 保持 html-tool-hub。

## 已部署
- 網站：https://da199919-ux.github.io/html-tool-hub/
- Repo：https://github.com/da199919-ux/html-tool-hub
- 已知成功 CI：https://github.com/da199919-ux/html-tool-hub/actions/runs/41045282747
- 該次提交：4430125db5163a60452e5bca3110fa7a30509699；2026-10-31 起的更新以 GitHub 提交紀錄與 Actions 為準。
- Firebase Web App：HTML Tool Hub Web，設定在 public/js/firebase-config.js。
- Firestore Standard / Native / (default) / asia-east1（台灣），位置經使用者同意。
- Spark 免費方案，沒有升級 Blaze 或啟用付費備份。
- Google 登入供應商已啟用，授權網域包含 da199919-ux.github.io。
- Google 登入公開名稱 HTML Tool Hub；支援信箱 2026-10-31 經使用者同意由 a25295945@gmail.com 改為 da199919@gmail.com。
- firestore.rules 已透過 Console 發布；GitHub Pages 工作流程只部署 public/，不會自動部署 Firestore 規則。
- 首頁與公開唯讀示範已透過瀏覽器查看。

## 管理員與資料
users/wXEGTc7M4ERp7yy0zQDi9uX53ST2 的 role 為字串 admin。2026-10-31 已在 Authentication 核對此 UID 屬於 da199919@gmail.com，並以該帳號登入正式網站確認管理員區可用。

Firebase 專案擁有者與網站管理員是兩套不同權限；變更專案擁有者不會自動更改網站管理員 UID。

2026-10-31 驗收時建立測試空間「驗收測試 A」（ctpj7cbCoOfiUQkwHmwy）與「驗收測試 B」（dl1hkNZPNj2PzaqN86vZ），保留作回歸測試；測試帳號在 A 的權限已撤銷。詳見 [驗證紀錄](verification.md)。

資料模型：
- users/{uid}：role=admin，客戶端不得寫入該主文件。
- users/{uid}/spaces/{workspaceId}：role=editor 或 viewer，成員索引即授權依據。
- workspaces/{workspaceId}：name、toolId=travel、createdAt。
- workspaces/{workspaceId}/records/{id}：title、time、content、done、version、updatedAt、updatedBy。

## 實作與驗證界線
已實作即時監聽、交易版本檢查、衝突草稿保留、角色與成員變化監聽、登出清除、記憶體快取、相對路徑部署。僅管理員能刪除行程。
既有 CI 通過語法檢查、6 項交易模擬測試、9 組 Firestore Emulator 規則測試。2026-10-31 另以兩個真實 Google 帳號完成隔離、即時同步、唯讀、撤權與衝突驗收；尚未測試項目列在驗證紀錄。
未實作完整歷史版本、復原、游標協作、空間改名/刪除、檔案上傳；新增工具需擴充規則和資料模型，不能只上傳 HTML。
